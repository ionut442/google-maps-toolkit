import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import {
  hasBillingAccess,
  isPaddleSubscriptionStatus,
  type PaddleSubscriptionStatus,
} from "@/lib/billing-entitlement";
import { canPublishWithBilling } from "@/lib/publication-entitlement";
import {
  requirePaddleConfig,
  verifyCheckoutSignature,
} from "@/lib/paddle-config";

type PaddleDb = Pick<PrismaClient, "$transaction">;

export type PaddleSubscriptionEventInput = {
  eventId: string;
  eventType: "subscription.created" | "subscription.updated";
  occurredAt: string;
  businessId: string;
  checkoutSignature: string;
  paddleCustomerId: string;
  paddleSubscriptionId: string;
  paddlePriceId: string;
  quantity: number;
  status: PaddleSubscriptionStatus;
  trialEndsAt: string | null;
  nextBilledAt: string | null;
  currentPeriodEndsAt: string | null;
};

export class PaddleWebhookError extends Error {
  constructor(
    message: string,
    readonly status = 422,
  ) {
    super(message);
  }
}

function optionalDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new PaddleWebhookError("Paddle event contains an invalid date");
  return date;
}

type PaddleSubscriptionPayload = {
  id?: unknown;
  status?: unknown;
  customerId?: unknown;
  customData?: unknown;
  items?: unknown;
  nextBilledAt?: unknown;
  currentBillingPeriod?: unknown;
};

type PaddleSubscriptionEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  data: object;
};

export function normalizePaddleSubscriptionEvent(
  event: PaddleSubscriptionEvent,
): PaddleSubscriptionEventInput | null {
  if (
    event.eventType !== "subscription.created" &&
    event.eventType !== "subscription.updated"
  )
    return null;

  const data = event.data as PaddleSubscriptionPayload;
  const customData =
    data.customData && typeof data.customData === "object"
      ? (data.customData as Record<string, unknown>)
      : {};
  const businessId = customData.businessId;
  const checkoutSignature = customData.checkoutSignature;
  const status = data.status;
  const items = Array.isArray(data.items)
    ? (data.items as Array<Record<string, unknown>>)
    : [];
  const recurringItem =
    items.find((item) => item.recurring === true) ?? items[0];
  const price = recurringItem?.price as Record<string, unknown> | undefined;
  const trialDates = recurringItem?.trialDates as
    | Record<string, unknown>
    | null
    | undefined;
  const currentPeriod = data.currentBillingPeriod as
    | Record<string, unknown>
    | null
    | undefined;

  if (
    typeof event.eventId !== "string" ||
    typeof event.occurredAt !== "string" ||
    typeof data.id !== "string" ||
    typeof data.customerId !== "string" ||
    typeof businessId !== "string" ||
    typeof checkoutSignature !== "string" ||
    typeof price?.id !== "string" ||
    typeof recurringItem?.quantity !== "number" ||
    typeof status !== "string" ||
    !isPaddleSubscriptionStatus(status)
  ) {
    throw new PaddleWebhookError(
      "Paddle subscription event is missing required billing metadata",
    );
  }

  return {
    eventId: event.eventId,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    businessId,
    checkoutSignature,
    paddleCustomerId: data.customerId,
    paddleSubscriptionId: data.id,
    paddlePriceId: price.id,
    quantity: recurringItem.quantity,
    status,
    trialEndsAt:
      typeof trialDates?.endsAt === "string" ? trialDates.endsAt : null,
    nextBilledAt:
      typeof data.nextBilledAt === "string" ? data.nextBilledAt : null,
    currentPeriodEndsAt:
      typeof currentPeriod?.endsAt === "string" ? currentPeriod.endsAt : null,
  };
}

export async function applyPaddleSubscriptionEvent(
  input: PaddleSubscriptionEventInput,
  client: PaddleDb = db,
) {
  const config = requirePaddleConfig();
  if (
    !verifyCheckoutSignature(input.businessId, input.checkoutSignature) ||
    input.paddlePriceId !== config.priceId ||
    input.quantity !== 1
  ) {
    throw new PaddleWebhookError(
      "Paddle subscription does not match an authorized LocalAction checkout",
      409,
    );
  }
  const occurredAt = optionalDate(input.occurredAt)!;
  const trialEndsAt = optionalDate(input.trialEndsAt);
  const nextBilledAt = optionalDate(input.nextBilledAt);
  const currentPeriodEndsAt = optionalDate(input.currentPeriodEndsAt);

  return client.$transaction(async (tx) => {
    // Serialize updates for one business so concurrent out-of-order deliveries
    // cannot overwrite a newer occurred_at snapshot after both read old state.
    await tx.$queryRaw`SELECT "id" FROM "Business" WHERE "id" = ${input.businessId} FOR UPDATE`;
    const duplicate = await tx.businessBilling.findUnique({
      where: { lastPaddleEventId: input.eventId },
      select: { businessId: true },
    });
    if (duplicate) return { outcome: "duplicate" as const, published: false };

    const business = await tx.business.findUnique({
      where: { id: input.businessId },
      include: { billing: true, modules: true },
    });
    if (!business)
      throw new PaddleWebhookError(
        "Paddle event references no LocalAction business",
      );

    const assignedSubscription = await tx.businessBilling.findUnique({
      where: { paddleSubscriptionId: input.paddleSubscriptionId },
      select: { businessId: true },
    });
    if (
      assignedSubscription &&
      assignedSubscription.businessId !== business.id
    ) {
      throw new PaddleWebhookError(
        "Paddle subscription is already assigned to another business",
        409,
      );
    }

    if (
      business.billing &&
      business.billing.lastPaddleEventOccurredAt >= occurredAt
    ) {
      return { outcome: "stale" as const, published: false };
    }

    if (
      business.billing &&
      business.billing.paddleSubscriptionId !== input.paddleSubscriptionId &&
      !(
        input.eventType === "subscription.created" &&
        input.status === "trialing" &&
        !hasBillingAccess(business.billing.status)
      )
    ) {
      throw new PaddleWebhookError(
        "Business already has a different current Paddle subscription",
        409,
      );
    }

    await tx.businessBilling.upsert({
      where: { businessId: business.id },
      create: {
        businessId: business.id,
        paddleCustomerId: input.paddleCustomerId,
        paddleSubscriptionId: input.paddleSubscriptionId,
        paddlePriceId: input.paddlePriceId,
        status: input.status,
        trialEndsAt,
        nextBilledAt,
        currentPeriodEndsAt,
        lastPaddleEventId: input.eventId,
        lastPaddleEventOccurredAt: occurredAt,
      },
      update: {
        paddleCustomerId: input.paddleCustomerId,
        paddleSubscriptionId: input.paddleSubscriptionId,
        paddlePriceId: input.paddlePriceId,
        status: input.status,
        trialEndsAt,
        nextBilledAt,
        currentPeriodEndsAt,
        lastPaddleEventId: input.eventId,
        lastPaddleEventOccurredAt: occurredAt,
      },
    });

    const entitled = hasBillingAccess(input.status);
    const ready = canPublishWithBilling(
      input.status,
      business,
      business.modules,
    );
    const shouldAutoPublish =
      entitled && ready && !business.published && business.onboardingStep < 7;
    const shouldUnpublish = !entitled && business.published;

    if (shouldAutoPublish || shouldUnpublish) {
      await tx.business.update({
        where: { id: business.id },
        data: shouldAutoPublish
          ? { published: true, onboardingStep: 7 }
          : { published: false },
      });
    }

    return {
      outcome: "applied" as const,
      published: shouldAutoPublish,
      unpublished: shouldUnpublish,
    };
  });
}
