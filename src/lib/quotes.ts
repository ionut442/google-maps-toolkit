import { randomUUID } from "node:crypto";
import { applicationBaseUrl } from "./environment";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import { parseModuleConfig, type ModuleConfigByType } from "./domain";
import {
  attemptEmailDelivery,
  buildQuoteEmail,
  configuredEmailTransport,
  type EmailTransport,
} from "./email";
import { emitAnalyticsHook, type AnalyticsHookSink } from "./analytics";
import { consumeQuoteRateLimit } from "./rate-limit";
import {
  quoteHoneypotTriggered,
  validateQuoteSubmission,
  type QuoteAnswer,
} from "./quote-validation";
import { privateStorage, type PrivateObjectStorage } from "./storage";
import { quoteStorageKey, validatePhotoUploads } from "./uploads";
import { calculateEstimate, formatMoney } from "./pricing";

type ReadClient = PrismaClient | Prisma.TransactionClient;

export type SubmitQuoteResult =
  | { ok: true; accepted: boolean }
  | {
      ok: false;
      status: 404 | 413 | 422 | 429 | 500;
      message: string;
      fieldErrors?: Record<string, string>;
      retryAfterSeconds?: number;
    };

async function publicQuoteContext(
  slug: string,
  client: PrismaClient,
  previewUserId?: string,
) {
  const business = await client.business.findFirst({
    where: {
      slug,
      OR: [
        { published: true },
        ...(previewUserId
          ? [{ memberships: { some: { userId: previewUserId } } }]
          : []),
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      modules: {
        where: { type: { in: ["QUOTE_REQUEST", "PRICING"] }, enabled: true },
        select: { type: true, config: true },
      },
    },
  });
  const quote = business?.modules.find((item) => item.type === "QUOTE_REQUEST");
  if (!business || !quote) return null;
  try {
    const pricing = business.modules.find((item) => item.type === "PRICING");
    return {
      business,
      config: parseModuleConfig("QUOTE_REQUEST", JSON.parse(quote.config)),
      pricing: pricing
        ? parseModuleConfig("PRICING", JSON.parse(pricing.config))
        : null,
    };
  } catch {
    return null;
  }
}

async function cleanupObjects(
  storage: PrivateObjectStorage,
  objectKeys: string[],
) {
  await Promise.allSettled(
    objectKeys.map((objectKey) => storage.delete(objectKey)),
  );
}

export async function submitPublicQuote(input: {
  slug: string;
  formData: FormData;
  clientIdentifier: string;
  client?: PrismaClient;
  storage?: PrivateObjectStorage;
  transport?: EmailTransport;
  analyticsSink?: AnalyticsHookSink;
  now?: Date;
  previewUserId?: string;
}): Promise<SubmitQuoteResult> {
  if (quoteHoneypotTriggered(input.formData))
    return { ok: true, accepted: false };
  const client = input.client ?? db;
  const storage = input.storage ?? privateStorage;
  const now = input.now ?? new Date();
  const context = await publicQuoteContext(
    input.slug,
    client,
    input.previewUserId,
  );
  if (!context)
    return {
      ok: false,
      status: 404,
      message: "Quote requests are not available for this business.",
    };

  const submissionKey = String(input.formData.get("submissionKey") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(submissionKey)) {
    const duplicate = await client.quoteRequest.findUnique({
      where: {
        businessId_submissionKey: {
          businessId: context.business.id,
          submissionKey,
        },
      },
      select: { id: true },
    });
    if (duplicate) return { ok: true, accepted: true };
  }

  let rate;
  try {
    rate = await consumeQuoteRateLimit(
      context.business.id,
      input.clientIdentifier,
      { client, now },
    );
  } catch {
    return {
      ok: false,
      status: 500,
      message: "Quote requests are temporarily unavailable. Please try again.",
    };
  }
  if (!rate.allowed)
    return {
      ok: false,
      status: 429,
      message: "Too many quote attempts. Please wait and try again.",
      retryAfterSeconds: rate.retryAfterSeconds,
    };

  const quoteFormData = new FormData();
  for (const [key, value] of input.formData.entries())
    if (key !== "pricingAddOn" && key !== "pricingQuantity")
      quoteFormData.append(key, value);
  const validated = validateQuoteSubmission(context.config, quoteFormData);
  if (!validated.success)
    return {
      ok: false,
      status: 422,
      message: validated.message,
      fieldErrors: validated.fieldErrors,
    };

  const pricingAddOns = input.formData.getAll("pricingAddOn");
  const pricingQuantities = input.formData.getAll("pricingQuantity");
  if (pricingAddOns.length || pricingQuantities.length) {
    try {
      if (!context.pricing || context.pricing.mode !== "SIMPLE_ESTIMATE")
        throw new Error("Estimator unavailable");
      if (
        pricingAddOns.length > 12 ||
        pricingAddOns.some(
          (id) => typeof id !== "string" || !/^[a-z][a-z0-9_]{1,39}$/.test(id),
        ) ||
        pricingQuantities.length > 1 ||
        pricingQuantities.some((value) => typeof value !== "string")
      )
        throw new Error("Invalid add-ons");
      const selection = {
        addOnIds: pricingAddOns as string[],
        ...(pricingQuantities.length
          ? { quantity: Number(pricingQuantities[0]) }
          : {}),
      };
      const estimate = calculateEstimate(context.pricing, selection);
      validated.data.answers.push({
        fieldId: "pricing_estimate",
        label: "Pricing estimate context",
        type: "TEXT",
        value: `${formatMoney(estimate.totalMinor, context.pricing.currency)} estimate; options: ${estimate.addOns.map((item) => item.label).join(", ") || "none"}${estimate.quantity === undefined ? "" : `; quantity: ${estimate.quantity}`}`,
      });
    } catch {
      return {
        ok: false,
        status: 422,
        message:
          "The pricing estimate is no longer valid. Refresh and try again.",
        fieldErrors: {},
      };
    }
  }

  let uploads;
  try {
    uploads = await validatePhotoUploads(validated.data.files);
  } catch (error) {
    return {
      ok: false,
      status: 422,
      message:
        error instanceof Error ? error.message : "Photo validation failed.",
      fieldErrors: {
        photos: "Choose valid JPG, PNG or WebP photos up to 5 MB each.",
      },
    };
  }

  const quoteId = randomUUID();
  const deliveryId = randomUUID();
  const stored = uploads.map((upload) => ({
    upload,
    objectKey: quoteStorageKey(quoteId, upload),
  }));
  const storedKeys: string[] = [];
  try {
    for (const item of stored) {
      await storage.store(item.objectKey, item.upload.bytes);
      storedKeys.push(item.objectKey);
    }
  } catch {
    await cleanupObjects(storage, storedKeys);
    return {
      ok: false,
      status: 500,
      message: "We could not store the photos. Please try again.",
    };
  }

  let appUrl: string;
  try {
    appUrl = applicationBaseUrl();
  } catch {
    await cleanupObjects(storage, storedKeys);
    return {
      ok: false,
      status: 500,
      message: "Quote requests are temporarily unavailable. Please try again.",
    };
  }
  const email = buildQuoteEmail({
    businessName: context.business.name,
    quoteId,
    customerName: validated.data.customerName,
    customerPhone: validated.data.customerPhone,
    customerEmail: validated.data.customerEmail,
    answers: validated.data.answers,
    photoCount: stored.length,
    appUrl,
  });

  try {
    await client.$transaction(async (transaction) => {
      await transaction.quoteRequest.create({
        data: {
          id: quoteId,
          businessId: context.business.id,
          submissionKey: validated.data.submissionKey,
          configSnapshot: JSON.stringify(context.config),
          answers: JSON.stringify(validated.data.answers),
          customerName: validated.data.customerName,
          customerPhone: validated.data.customerPhone,
          customerEmail: validated.data.customerEmail,
          uploads: {
            create: stored.map(({ upload, objectKey }) => ({
              id: upload.id,
              objectKey,
              originalFilename: upload.originalFilename,
              mediaType: upload.mediaType,
              sizeBytes: upload.sizeBytes,
            })),
          },
          emailDelivery: {
            create: {
              id: deliveryId,
              destination: context.business.email,
              subject: email.subject,
              bodyText: email.bodyText,
              status: "PENDING",
              nextAttemptAt: now,
            },
          },
        },
      });
    });
  } catch {
    await cleanupObjects(storage, storedKeys);
    const duplicate = await client.quoteRequest.findUnique({
      where: {
        businessId_submissionKey: {
          businessId: context.business.id,
          submissionKey: validated.data.submissionKey,
        },
      },
      select: { id: true },
    });
    if (duplicate) return { ok: true, accepted: true };
    return {
      ok: false,
      status: 500,
      message: "Your request could not be saved. Please try again.",
    };
  }

  await emitAnalyticsHook(
    {
      name: "quote_submitted",
      businessId: context.business.id,
      occurredAt: now,
    },
    input.analyticsSink,
  );
  try {
    await attemptEmailDelivery(deliveryId, {
      client,
      transport: input.transport ?? configuredEmailTransport(),
      now,
    });
  } catch {
    // Quote and pending delivery job are already durable.
  }
  return { ok: true, accepted: true };
}

function parseAnswers(value: string): QuoteAnswer[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as QuoteAnswer[]) : [];
  } catch {
    return [];
  }
}

export async function listOwnedQuoteRequests(
  userId: string,
  businessId: string,
  client: ReadClient = db,
) {
  return client.quoteRequest.findMany({
    where: { businessId, business: { memberships: { some: { userId } } } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      emailDelivery: { select: { status: true } },
      _count: { select: { uploads: true } },
    },
  });
}

export async function listAllOwnedQuoteRequests(
  userId: string,
  client: ReadClient = db,
) {
  return client.quoteRequest.findMany({
    where: { business: { memberships: { some: { userId } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      business: { select: { name: true } },
      emailDelivery: { select: { status: true } },
      _count: { select: { uploads: true } },
    },
  });
}

export async function findOwnedQuoteRequest(
  userId: string,
  quoteId: string,
  client: ReadClient = db,
) {
  const quote = await client.quoteRequest.findFirst({
    where: { id: quoteId, business: { memberships: { some: { userId } } } },
    select: {
      id: true,
      createdAt: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      answers: true,
      business: { select: { id: true, name: true } },
      uploads: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          originalFilename: true,
          mediaType: true,
          sizeBytes: true,
        },
      },
      emailDelivery: {
        select: {
          id: true,
          status: true,
          attemptCount: true,
          lastAttemptAt: true,
          nextAttemptAt: true,
          lastError: true,
        },
      },
    },
  });
  return quote ? { ...quote, answers: parseAnswers(quote.answers) } : null;
}

export async function findOwnedQuoteUpload(
  userId: string,
  quoteId: string,
  uploadId: string,
  client: ReadClient = db,
) {
  return client.quoteUpload.findFirst({
    where: {
      id: uploadId,
      quoteRequestId: quoteId,
      quoteRequest: { business: { memberships: { some: { userId } } } },
    },
    select: {
      id: true,
      objectKey: true,
      originalFilename: true,
      mediaType: true,
      sizeBytes: true,
    },
  });
}

export async function retryOwnedQuoteEmail(
  userId: string,
  quoteId: string,
  options: {
    client?: PrismaClient;
    transport?: EmailTransport;
    now?: Date;
  } = {},
) {
  const client = options.client ?? db;
  const quote = await client.quoteRequest.findFirst({
    where: { id: quoteId, business: { memberships: { some: { userId } } } },
    select: { emailDelivery: { select: { id: true } } },
  });
  if (!quote?.emailDelivery)
    throw new Error("Quote request not found or access denied");
  return attemptEmailDelivery(quote.emailDelivery.id, options);
}

export type PublicQuoteConfig = ModuleConfigByType["QUOTE_REQUEST"];
