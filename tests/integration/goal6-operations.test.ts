import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { attemptEmailDelivery, type EmailTransport } from "@/lib/email";
import {
  deleteBusinessData,
  purgeExpiredOperationalData,
} from "@/lib/operations";
import type { PrivateObjectStorage, StoredObjectMetadata } from "@/lib/storage";

const client = new PrismaClient();

class MemoryStorage implements PrivateObjectStorage {
  objects = new Map<string, Uint8Array>();
  async store(key: string, bytes: Uint8Array) {
    this.objects.set(key, bytes);
  }
  async read(key: string) {
    const value = this.objects.get(key);
    if (!value) throw new Error("not found");
    return value;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
  async metadata(key: string): Promise<StoredObjectMetadata> {
    return {
      sizeBytes: (await this.read(key)).length,
      modifiedAt: new Date(0),
    };
  }
}

async function fixture() {
  return client.user.create({
    data: {
      email: `${crypto.randomUUID()}@example.test`,
      passwordHash: "test-only",
      memberships: {
        create: {
          business: {
            create: {
              name: "Goal 6 Plumbing",
              slug: `goal-6-${crypto.randomUUID()}`,
              industry: "PLUMBING",
              email: "owner@example.test",
            },
          },
        },
      },
    },
    include: { memberships: true },
  });
}

beforeEach(async () => {
  await client.session.deleteMany();
  await client.business.deleteMany();
  await client.user.deleteMany();
});
afterAll(() => client.$disconnect());

describe("Goal 6 operations", () => {
  it("claims an email job once under concurrent workers", async () => {
    const user = await fixture();
    const businessId = user.memberships[0].businessId;
    const deliveryId = crypto.randomUUID();
    await client.quoteRequest.create({
      data: {
        id: crypto.randomUUID(),
        businessId,
        submissionKey: crypto.randomUUID(),
        configSnapshot: "{}",
        answers: "[]",
        emailDelivery: {
          create: {
            id: deliveryId,
            destination: "owner@example.test",
            subject: "New quote",
            bodyText: "Quote details",
          },
        },
      },
    });
    let sends = 0;
    const transport: EmailTransport = {
      async send() {
        sends += 1;
        await new Promise((resolve) => setTimeout(resolve, 40));
        return { messageId: "provider-one" };
      },
    };
    await Promise.all([
      attemptEmailDelivery(deliveryId, { client, transport }),
      attemptEmailDelivery(deliveryId, { client, transport }),
    ]);
    expect(sends).toBe(1);
    await expect(
      client.emailDelivery.findUnique({ where: { id: deliveryId } }),
    ).resolves.toMatchObject({ status: "DELIVERED", attemptCount: 1 });
  });

  it("recovers one stale claim without a duplicate send", async () => {
    const user = await fixture();
    const deliveryId = crypto.randomUUID();
    const now = new Date("2026-09-01T12:00:00Z");
    await client.quoteRequest.create({
      data: {
        id: crypto.randomUUID(),
        businessId: user.memberships[0].businessId,
        submissionKey: crypto.randomUUID(),
        configSnapshot: "{}",
        answers: "[]",
        emailDelivery: {
          create: {
            id: deliveryId,
            destination: "owner@example.test",
            subject: "New quote",
            bodyText: "Quote details",
            status: "PROCESSING",
            attemptCount: 1,
            lastAttemptAt: new Date(now.getTime() - 11 * 60 * 1000),
          },
        },
      },
    });
    let sends = 0;
    const transport: EmailTransport = {
      async send() {
        sends += 1;
        await new Promise((resolve) => setTimeout(resolve, 40));
        return { messageId: "provider-recovered" };
      },
    };
    await Promise.all([
      attemptEmailDelivery(deliveryId, { client, transport, now }),
      attemptEmailDelivery(deliveryId, { client, transport, now }),
    ]);
    expect(sends).toBe(1);
    await expect(
      client.emailDelivery.findUnique({ where: { id: deliveryId } }),
    ).resolves.toMatchObject({ status: "DELIVERED", attemptCount: 2 });
  });

  it("purges bounded operational rows and deletes business files with cascades", async () => {
    const user = await fixture();
    const businessId = user.memberships[0].businessId;
    const now = new Date("2026-08-28T12:00:00Z");
    const storage = new MemoryStorage();
    const expiredPhotoKey = `quotes/${crypto.randomUUID()}/expired.png`;
    await storage.store(expiredPhotoKey, new Uint8Array([0]));
    await client.quoteRequest.create({
      data: {
        id: crypto.randomUUID(),
        businessId,
        submissionKey: crypto.randomUUID(),
        configSnapshot: "{}",
        answers: "[]",
        createdAt: new Date("2025-01-01"),
        uploads: {
          create: {
            id: crypto.randomUUID(),
            objectKey: expiredPhotoKey,
            originalFilename: "expired.png",
            mediaType: "image/png",
            sizeBytes: 1,
          },
        },
      },
    });
    await client.analyticsEvent.createMany({
      data: [
        {
          businessId,
          eventType: "PAGE_VIEW",
          createdAt: new Date("2026-05-01"),
        },
        {
          businessId,
          eventType: "CALL_CLICK",
          createdAt: new Date("2026-08-27"),
        },
      ],
    });
    await client.session.createMany({
      data: [
        {
          userId: user.id,
          tokenHash: crypto.randomUUID(),
          expiresAt: new Date("2026-08-01"),
        },
        {
          userId: user.id,
          tokenHash: crypto.randomUUID(),
          expiresAt: new Date("2026-09-01"),
        },
      ],
    });
    await client.quoteRateLimit.createMany({
      data: [
        {
          businessId,
          clientHash: crypto.randomUUID(),
          windowStart: new Date("2026-08-20"),
        },
        {
          businessId,
          clientHash: crypto.randomUUID(),
          windowStart: new Date("2026-08-28T11:50:00Z"),
        },
      ],
    });
    await expect(
      purgeExpiredOperationalData({ client, storage, now }),
    ).resolves.toEqual({
      analytics: 1,
      sessions: 1,
      rateLimits: 1,
      quotes: 1,
      quoteObjects: 1,
      quoteFailures: 0,
    });
    expect(storage.objects.size).toBe(0);

    const photoKey = `quotes/${crypto.randomUUID()}/photo.png`;
    const evidenceKey = `trust/${crypto.randomUUID()}/evidence.pdf`;
    await storage.store(photoKey, new Uint8Array([1]));
    await storage.store(evidenceKey, new Uint8Array([2]));
    await client.quoteRequest.create({
      data: {
        id: crypto.randomUUID(),
        businessId,
        submissionKey: crypto.randomUUID(),
        configSnapshot: "{}",
        answers: "[]",
        uploads: {
          create: {
            id: crypto.randomUUID(),
            objectKey: photoKey,
            originalFilename: "photo.png",
            mediaType: "image/png",
            sizeBytes: 1,
          },
        },
      },
    });
    await client.trustEvidence.create({
      data: {
        id: crypto.randomUUID(),
        entryId: crypto.randomUUID(),
        objectKey: evidenceKey,
        originalFilename: "evidence.pdf",
        mediaType: "application/pdf",
        sizeBytes: 1,
        businessId,
      },
    });
    await expect(
      deleteBusinessData(businessId, { client, storage }),
    ).resolves.toEqual({
      deleted: true,
      objectCount: 2,
    });
    expect(storage.objects.size).toBe(0);
    expect(
      await client.business.findUnique({ where: { id: businessId } }),
    ).toBeNull();
    expect(await client.quoteRequest.count()).toBe(0);
    expect(await client.analyticsEvent.count()).toBe(0);
  });
});
