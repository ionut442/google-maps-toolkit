import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getOwnedDashboardActivity,
  recordPublicAnalyticsEvent,
} from "@/lib/analytics";
import { createBusinessForUser } from "@/lib/business";

const client = new PrismaClient();
beforeEach(async () => {
  await client.session.deleteMany();
  await client.businessModule.deleteMany();
  await client.membership.deleteMany();
  await client.business.deleteMany();
  await client.user.deleteMany();
});
afterAll(() => client.$disconnect());

describe("Goal 5 analytics persistence and ownership", () => {
  it("records only against a published slug and aggregates quotes once", async () => {
    const owner = await client.user.create({
      data: { email: "analytics-owner@example.test", passwordHash: "x" },
    });
    const business = await createBusinessForUser(
      owner.id,
      "Analytics Plumbing",
      owner.email,
      client,
    );
    await expect(
      recordPublicAnalyticsEvent(business.slug, "PAGE_VIEW"),
    ).resolves.toBe(false);
    await client.business.update({
      where: { id: business.id },
      data: { published: true },
    });
    await recordPublicAnalyticsEvent(business.slug, "PAGE_VIEW");
    await recordPublicAnalyticsEvent(business.slug, "CALL_CLICK");
    await client.quoteRequest.create({
      data: {
        id: crypto.randomUUID(),
        submissionKey: "once",
        configSnapshot: "{}",
        answers: "{}",
        businessId: business.id,
      },
    });
    const result = await getOwnedDashboardActivity(owner.id, business.id);
    expect(result.summary).toMatchObject({
      pageViews: 1,
      callClicks: 1,
      quoteRequests: 1,
    });
    expect(result.activity.map((item) => item.label)).toEqual(
      expect.arrayContaining([
        "Action Page viewed",
        "Call button clicked",
        "New quote request",
      ]),
    );
  });

  it("denies cross-business dashboard analytics", async () => {
    const owner = await client.user.create({
      data: { email: "owner-a@example.test", passwordHash: "x" },
    });
    const stranger = await client.user.create({
      data: { email: "owner-b@example.test", passwordHash: "x" },
    });
    const business = await createBusinessForUser(
      owner.id,
      "Private Analytics",
      owner.email,
      client,
    );
    await expect(
      getOwnedDashboardActivity(stranger.id, business.id),
    ).rejects.toThrow("access denied");
  });
});
