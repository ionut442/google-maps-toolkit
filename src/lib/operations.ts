import type { PrismaClient } from "@prisma/client";
import { db } from "./db";
import {
  privateStorage,
  publicStorage,
  type PrivateObjectStorage,
} from "./storage";

export const ANALYTICS_RETENTION_DAYS = 90;
export const QUOTE_RETENTION_DAYS = 365;
export const RATE_LIMIT_RETENTION_HOURS = 24;

export async function purgeExpiredOperationalData(
  options: {
    client?: PrismaClient;
    storage?: PrivateObjectStorage;
    now?: Date;
  } = {},
) {
  const client = options.client ?? db;
  const storage = options.storage ?? privateStorage;
  const now = options.now ?? new Date();
  const analyticsBefore = new Date(
    now.getTime() - ANALYTICS_RETENTION_DAYS * 86_400_000,
  );
  const rateLimitBefore = new Date(
    now.getTime() - RATE_LIMIT_RETENTION_HOURS * 3_600_000,
  );
  const quotesBefore = new Date(
    now.getTime() - QUOTE_RETENTION_DAYS * 86_400_000,
  );
  const [analytics, sessions, rateLimits] = await client.$transaction([
    client.analyticsEvent.deleteMany({
      where: { createdAt: { lt: analyticsBefore } },
    }),
    client.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    client.quoteRateLimit.deleteMany({
      where: { windowStart: { lt: rateLimitBefore } },
    }),
  ]);
  const expiredQuotes = await client.quoteRequest.findMany({
    where: { createdAt: { lt: quotesBefore } },
    orderBy: { createdAt: "asc" },
    select: { id: true, uploads: { select: { objectKey: true } } },
  });
  let quotes = 0;
  let quoteObjects = 0;
  let quoteFailures = 0;
  for (const quote of expiredQuotes) {
    const removed = await Promise.allSettled(
      quote.uploads.map((upload) => storage.delete(upload.objectKey)),
    );
    if (removed.some((result) => result.status === "rejected")) {
      quoteFailures += 1;
      continue;
    }
    await client.quoteRequest.delete({ where: { id: quote.id } });
    quotes += 1;
    quoteObjects += quote.uploads.length;
  }
  return {
    analytics: analytics.count,
    sessions: sessions.count,
    rateLimits: rateLimits.count,
    quotes,
    quoteObjects,
    quoteFailures,
  };
}

export async function deleteBusinessData(
  businessId: string,
  options: {
    client?: PrismaClient;
    storage?: PrivateObjectStorage;
    publicStorage?: PrivateObjectStorage;
  } = {},
) {
  const client = options.client ?? db;
  const storage = options.storage ?? privateStorage;
  const credentialStorage =
    options.publicStorage ?? options.storage ?? publicStorage;
  const business = await client.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      published: true,
      quoteRequests: { select: { uploads: { select: { objectKey: true } } } },
      trustEvidence: { select: { objectKey: true, storageScope: true } },
    },
  });
  if (!business) return { deleted: false, objectCount: 0 };
  if (business.published)
    await client.business.update({
      where: { id: business.id },
      data: { published: false },
    });
  const privateObjectKeys = business.quoteRequests.flatMap((quote) =>
    quote.uploads.map((upload) => upload.objectKey),
  );
  const legacyCredentialKeys = business.trustEvidence
    .filter((evidence) => evidence.storageScope !== "PUBLIC")
    .map((evidence) => evidence.objectKey);
  const publicObjectKeys = business.trustEvidence
    .filter((evidence) => evidence.storageScope === "PUBLIC")
    .map((evidence) => evidence.objectKey);
  const deletedObjects = await Promise.allSettled([
    ...privateObjectKeys.map((objectKey) => storage.delete(objectKey)),
    ...legacyCredentialKeys.map((objectKey) => storage.delete(objectKey)),
    ...publicObjectKeys.map((objectKey) => credentialStorage.delete(objectKey)),
  ]);
  const failed = deletedObjects.filter(
    (result) => result.status === "rejected",
  ).length;
  if (failed)
    throw new Error(
      `Business deletion stopped because ${failed} private object(s) could not be deleted`,
    );
  await client.business.delete({ where: { id: business.id } });
  return {
    deleted: true,
    objectCount:
      privateObjectKeys.length +
      legacyCredentialKeys.length +
      publicObjectKeys.length,
  };
}

export async function deleteUserData(
  userId: string,
  options: {
    client?: PrismaClient;
    storage?: PrivateObjectStorage;
    publicStorage?: PrivateObjectStorage;
  } = {},
) {
  const client = options.client ?? db;
  const storage = options.storage ?? privateStorage;
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      memberships: {
        select: {
          businessId: true,
          business: { select: { _count: { select: { memberships: true } } } },
        },
      },
    },
  });
  if (!user) return { deleted: false, businessesDeleted: 0 };
  let businessesDeleted = 0;
  for (const membership of user.memberships) {
    if (membership.business._count.memberships === 1) {
      const result = await deleteBusinessData(membership.businessId, {
        client,
        storage,
        publicStorage: options.publicStorage,
      });
      if (result.deleted) businessesDeleted += 1;
    }
  }
  await client.user.delete({ where: { id: user.id } });
  return { deleted: true, businessesDeleted };
}
