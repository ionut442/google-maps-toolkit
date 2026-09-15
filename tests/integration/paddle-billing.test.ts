import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { db } from "@/lib/db";
import { createCheckoutSignature } from "@/lib/paddle-config";
import {
  applyPaddleSubscriptionEvent,
  normalizePaddleSubscriptionEvent,
  type PaddleSubscriptionEventInput,
} from "@/lib/paddle-billing";

const emailPrefix = "paddle-billing-test-";

function configurePaddleSandbox() {
  vi.stubEnv("PADDLE_API_KEY", "pdl_sdbx_apikey_test-only");
  vi.stubEnv("PADDLE_WEBHOOK_SECRET", "pdl_ntfset_test-only");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN", "test_client-token");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_PRICE_ID", "pri_localaction-monthly");
  vi.stubEnv("NEXT_PUBLIC_PADDLE_ENVIRONMENT", "sandbox");
}

async function createReadyBusiness(
  options: { published?: boolean; onboardingStep?: number } = {},
) {
  const suffix = randomUUID();
  const user = await db.user.create({
    data: {
      email: `${emailPrefix}${suffix}@example.test`,
      passwordHash: "test-only",
    },
  });
  const business = await db.business.create({
    data: {
      name: `Paddle Test ${suffix}`,
      slug: `paddle-test-${suffix}`,
      industry: "PLUMBER",
      email: user.email,
      phone: "+40700111222",
      description: "A billing-ready test business",
      published: options.published ?? false,
      onboardingStep: options.onboardingStep ?? 6,
      memberships: { create: { userId: user.id, role: "OWNER" } },
      modules: {
        create: {
          type: "CALL_WHATSAPP",
          enabled: true,
          customizedAt: new Date(),
          sortOrder: 0,
          config: "{}",
        },
      },
    },
  });
  return business;
}

function eventFor(
  businessId: string,
  overrides: Partial<PaddleSubscriptionEventInput> = {},
): PaddleSubscriptionEventInput {
  return {
    eventId: `evt_${randomUUID()}`,
    eventType: "subscription.created",
    occurredAt: "2026-09-14T12:00:00.000Z",
    businessId,
    checkoutSignature: createCheckoutSignature(businessId),
    paddleCustomerId: `ctm_${randomUUID()}`,
    paddleSubscriptionId: `sub_${randomUUID()}`,
    paddlePriceId: "pri_localaction-monthly",
    billingName: "Alex Buyer",
    quantity: 1,
    status: "trialing",
    trialEndsAt: "2026-10-14T12:00:00.000Z",
    nextBilledAt: "2026-10-14T12:00:00.000Z",
    currentPeriodEndsAt: "2026-10-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("Paddle subscription persistence", () => {
  beforeAll(configurePaddleSandbox);
  afterAll(() => vi.unstubAllEnvs());
  afterEach(async () => {
    await db.user.deleteMany({
      where: { email: { startsWith: emailPrefix } },
    });
  });

  it("maps checkout custom data to one business and auto-publishes a ready initial trial", async () => {
    const business = await createReadyBusiness();
    const input = eventFor(business.id);
    await expect(applyPaddleSubscriptionEvent(input)).resolves.toMatchObject({
      outcome: "applied",
      published: true,
    });
    await expect(
      db.businessBilling.findUnique({ where: { businessId: business.id } }),
    ).resolves.toMatchObject({
      paddleSubscriptionId: input.paddleSubscriptionId,
      paddleCustomerId: input.paddleCustomerId,
      billingName: "Alex Buyer",
      status: "trialing",
    });
    await expect(
      db.business.findUnique({ where: { id: business.id } }),
    ).resolves.toMatchObject({ published: true, onboardingStep: 7 });
  });

  it("handles duplicate and stale deliveries without overwriting newer state", async () => {
    const business = await createReadyBusiness({ onboardingStep: 7 });
    const input = eventFor(business.id, {
      status: "active",
      occurredAt: "2026-09-14T13:00:00.000Z",
    });
    await applyPaddleSubscriptionEvent(input);
    await expect(applyPaddleSubscriptionEvent(input)).resolves.toMatchObject({
      outcome: "duplicate",
    });
    await expect(
      applyPaddleSubscriptionEvent({
        ...input,
        eventId: `evt_${randomUUID()}`,
        eventType: "subscription.updated",
        status: "past_due",
        occurredAt: "2026-09-14T12:30:00.000Z",
      }),
    ).resolves.toMatchObject({ outcome: "stale" });
    await expect(
      db.businessBilling.findUnique({ where: { businessId: business.id } }),
    ).resolves.toMatchObject({
      status: "active",
      lastPaddleEventId: input.eventId,
    });
  });

  it("serializes concurrent out-of-order updates per business", async () => {
    const business = await createReadyBusiness({ onboardingStep: 7 });
    const created = eventFor(business.id, { status: "active" });
    await applyPaddleSubscriptionEvent(created);
    const older = {
      ...created,
      eventId: `evt_${randomUUID()}`,
      eventType: "subscription.updated" as const,
      occurredAt: "2026-09-14T12:30:00.000Z",
      status: "past_due" as const,
    };
    const newer = {
      ...created,
      eventId: `evt_${randomUUID()}`,
      eventType: "subscription.updated" as const,
      occurredAt: "2026-09-14T13:30:00.000Z",
      status: "active" as const,
    };
    await Promise.all([
      applyPaddleSubscriptionEvent(newer),
      applyPaddleSubscriptionEvent(older),
    ]);
    await expect(
      db.businessBilling.findUnique({ where: { businessId: business.id } }),
    ).resolves.toMatchObject({
      status: "active",
      lastPaddleEventId: newer.eventId,
    });
  });

  it.each(["paused", "canceled"] as const)(
    "unpublishes %s businesses without deleting their configuration",
    async (status) => {
      const business = await createReadyBusiness({
        published: true,
        onboardingStep: 7,
      });
      const created = eventFor(business.id, { status: "active" });
      await applyPaddleSubscriptionEvent(created);
      await applyPaddleSubscriptionEvent({
        ...created,
        eventId: `evt_${randomUUID()}`,
        eventType: "subscription.updated",
        occurredAt: "2026-09-14T14:00:00.000Z",
        status,
        nextBilledAt: null,
        currentPeriodEndsAt: null,
      });
      await expect(
        db.business.findUnique({ where: { id: business.id } }),
      ).resolves.toMatchObject({
        published: false,
        description: "A billing-ready test business",
        phone: "+40700111222",
      });
    },
  );

  it("keeps a scheduled cancellation published until Paddle ends the entitlement", async () => {
    const business = await createReadyBusiness({
      published: true,
      onboardingStep: 7,
    });
    const created = eventFor(business.id, { status: "trialing" });
    await applyPaddleSubscriptionEvent(created);

    await expect(
      applyPaddleSubscriptionEvent({
        ...created,
        eventId: `evt_${randomUUID()}`,
        eventType: "subscription.updated",
        occurredAt: "2026-09-14T14:00:00.000Z",
        status: "trialing",
        nextBilledAt: null,
      }),
    ).resolves.toMatchObject({
      outcome: "applied",
      unpublished: false,
    });
    await expect(
      db.business.findUnique({ where: { id: business.id } }),
    ).resolves.toMatchObject({ published: true });
  });

  it("does not republish after an owner manually unpublishes", async () => {
    const business = await createReadyBusiness({ onboardingStep: 6 });
    const created = eventFor(business.id, { status: "trialing" });
    await applyPaddleSubscriptionEvent(created);
    await db.business.update({
      where: { id: business.id },
      data: { published: false },
    });

    await applyPaddleSubscriptionEvent({
      ...created,
      eventId: `evt_${randomUUID()}`,
      eventType: "subscription.updated",
      occurredAt: "2026-09-14T14:00:00.000Z",
      status: "active",
    });

    await expect(
      db.business.findUnique({ where: { id: business.id } }),
    ).resolves.toMatchObject({ published: false, onboardingStep: 7 });
  });

  it("refuses to assign one Paddle subscription to another business", async () => {
    const first = await createReadyBusiness({ onboardingStep: 7 });
    const second = await createReadyBusiness({ onboardingStep: 7 });
    const firstEvent = eventFor(first.id);
    await applyPaddleSubscriptionEvent(firstEvent);
    await expect(
      applyPaddleSubscriptionEvent(
        eventFor(second.id, {
          paddleSubscriptionId: firstEvent.paddleSubscriptionId,
        }),
      ),
    ).rejects.toThrow("already assigned to another business");
  });

  it("extracts the signed business mapping from Paddle custom data", () => {
    const businessId = "business-custom-data";
    expect(
      normalizePaddleSubscriptionEvent({
        eventId: "evt_custom_data",
        eventType: "subscription.created",
        occurredAt: "2026-09-14T12:00:00.000Z",
        data: {
          id: "sub_custom_data",
          status: "trialing",
          customerId: "ctm_custom_data",
          customData: {
            businessId,
            checkoutSignature: createCheckoutSignature(businessId),
            billingName: "Taylor Purchaser",
          },
          items: [
            {
              recurring: true,
              quantity: 1,
              price: { id: "pri_localaction-monthly" },
              trialDates: { endsAt: "2026-10-14T12:00:00.000Z" },
            },
          ],
          nextBilledAt: "2026-10-14T12:00:00.000Z",
          currentBillingPeriod: { endsAt: "2026-10-14T12:00:00.000Z" },
        },
      }),
    ).toMatchObject({
      businessId,
      billingName: "Taylor Purchaser",
      quantity: 1,
      status: "trialing",
    });
  });

  it("fails safely when Paddle custom data has no business mapping", () => {
    expect(() =>
      normalizePaddleSubscriptionEvent({
        eventId: "evt_missing_mapping",
        eventType: "subscription.updated",
        occurredAt: "2026-09-14T12:00:00.000Z",
        data: {
          id: "sub_missing_mapping",
          status: "active",
          customerId: "ctm_missing_mapping",
          customData: {},
          items: [
            {
              recurring: true,
              quantity: 1,
              price: { id: "pri_localaction-monthly" },
            },
          ],
        },
      }),
    ).toThrow("missing required billing metadata");
  });
});
