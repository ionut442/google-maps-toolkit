import type { Prisma, PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { db } from "./db";
import type { QuoteAnswer } from "./quote-validation";
import { logServerEvent } from "./server-log";

type Client = PrismaClient | Prisma.TransactionClient;
export type TransactionalEmail = {
  deliveryId: string;
  destination: string;
  subject: string;
  text: string;
  replyTo?: string;
};
export interface EmailTransport {
  send(message: TransactionalEmail): Promise<{ messageId: string }>;
}

export class DevelopmentCaptureTransport implements EmailTransport {
  async send(message: TransactionalEmail) {
    return { messageId: `development:${message.deliveryId}` };
  }
}

export class ResendEmailTransport implements EmailTransport {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(message: TransactionalEmail) {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.destination,
      subject: message.subject,
      text: message.text,
      replyTo: message.replyTo,
    });
    if (error)
      throw new Error(
        `Email provider rejected request: ${error.name}: ${error.message}`,
      );
    if (!data?.id) throw new Error("Email provider response was invalid");
    return { messageId: data.id };
  }
}

class UnavailableProductionTransport implements EmailTransport {
  async send(): Promise<{ messageId: string }> {
    throw new Error("Production email transport is not configured");
  }
}

export function configuredEmailTransport(): EmailTransport {
  const production = process.env.NODE_ENV === "production";
  const mode =
    process.env.EMAIL_TRANSPORT ?? (production ? "resend" : "development");
  if (mode === "development" && !production)
    return new DevelopmentCaptureTransport();
  if (mode === "resend" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
    return new ResendEmailTransport(
      process.env.RESEND_API_KEY,
      process.env.EMAIL_FROM,
    );
  return new UnavailableProductionTransport();
}

function answerText(value: QuoteAnswer["value"]) {
  if (Array.isArray(value)) return value.join(", ");
  return value === true ? "Yes" : String(value);
}

export function buildQuoteEmail(input: {
  businessName: string;
  quoteId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  answers: QuoteAnswer[];
  photoCount: number;
  appUrl: string;
}) {
  const safeBusinessName = input.businessName
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 100);
  const lines = [
    `New quote request for ${safeBusinessName}`,
    "",
    `Customer: ${input.customerName ?? "Not supplied"}`,
    `Phone: ${input.customerPhone ?? "Not supplied"}`,
    `Email: ${input.customerEmail ?? "Not supplied"}`,
    "",
    ...input.answers.flatMap((answer) => [
      answer.label,
      answerText(answer.value),
      "",
    ]),
    `Photos: ${input.photoCount}`,
    "",
    `Open securely: ${new URL(`/dashboard/quotes/${input.quoteId}`, input.appUrl).toString()}`,
  ];
  return {
    subject: `New quote request — ${safeBusinessName}`,
    bodyText: lines.join("\n"),
  };
}

const MAX_EMAIL_ATTEMPTS = 5;
const EMAIL_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

export async function attemptEmailDelivery(
  deliveryId: string,
  options: { client?: Client; transport?: EmailTransport; now?: Date } = {},
) {
  const client = options.client ?? db;
  const transport = options.transport ?? configuredEmailTransport();
  const now = options.now ?? new Date();
  const delivery = await client.emailDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (
    !delivery ||
    delivery.status === "DELIVERED" ||
    delivery.attemptCount >= MAX_EMAIL_ATTEMPTS
  )
    return delivery;
  if (
    delivery.status === "PROCESSING" &&
    (!delivery.lastAttemptAt ||
      delivery.lastAttemptAt > new Date(now.getTime() - EMAIL_CLAIM_TIMEOUT_MS))
  )
    return delivery;
  const attemptCount = delivery.attemptCount + 1;
  const claimed = await client.emailDelivery.updateMany({
    where: {
      id: delivery.id,
      status: delivery.status,
      attemptCount: delivery.attemptCount,
      ...(delivery.status === "PROCESSING"
        ? {
            lastAttemptAt: {
              lte: new Date(now.getTime() - EMAIL_CLAIM_TIMEOUT_MS),
            },
          }
        : {}),
    },
    data: {
      status: "PROCESSING",
      attemptCount: { increment: 1 },
      lastAttemptAt: now,
      nextAttemptAt: null,
    },
  });
  if (claimed.count !== 1)
    return client.emailDelivery.findUnique({ where: { id: delivery.id } });
  try {
    if (
      /[\r\n]/.test(delivery.destination) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.destination)
    )
      throw new Error("Business notification email is invalid");
    const result = await transport.send({
      deliveryId: delivery.id,
      destination: delivery.destination,
      subject: delivery.subject,
      text: delivery.bodyText,
    });
    await client.emailDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING", attemptCount },
      data: {
        status: "DELIVERED",
        nextAttemptAt: null,
        lastError: null,
        providerMessageId: result.messageId.slice(0, 200),
      },
    });
    return client.emailDelivery.findUnique({ where: { id: delivery.id } });
  } catch (error) {
    const message = (error instanceof Error ? error.message : "Delivery failed")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 240);
    const delaySeconds = Math.min(3600, 60 * 2 ** (attemptCount - 1));
    logServerEvent("error", "quote_email_failed", {
      deliveryId: delivery.id,
      attemptCount,
      reason: message,
    });
    await client.emailDelivery.updateMany({
      where: { id: delivery.id, status: "PROCESSING", attemptCount },
      data: {
        status: "FAILED",
        nextAttemptAt: new Date(now.getTime() + delaySeconds * 1000),
        lastError: message,
      },
    });
    return client.emailDelivery.findUnique({ where: { id: delivery.id } });
  }
}

export async function processDueEmailDeliveries(
  options: {
    client?: PrismaClient;
    transport?: EmailTransport;
    now?: Date;
    limit?: number;
  } = {},
) {
  const client = options.client ?? db;
  const now = options.now ?? new Date();
  const jobs = await client.emailDelivery.findMany({
    where: {
      attemptCount: { lt: MAX_EMAIL_ATTEMPTS },
      OR: [
        {
          status: { in: ["PENDING", "FAILED"] },
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        {
          status: "PROCESSING",
          lastAttemptAt: {
            lte: new Date(now.getTime() - EMAIL_CLAIM_TIMEOUT_MS),
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: options.limit ?? 25,
    select: { id: true },
  });
  for (const job of jobs)
    await attemptEmailDelivery(job.id, {
      client,
      transport: options.transport,
      now,
    });
  return jobs.length;
}
