import { createHash } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";

type Client = PrismaClient | Prisma.TransactionClient;
export const QUOTE_RATE_LIMIT = 5;
export const QUOTE_RATE_WINDOW_MS = 15 * 60 * 1000;

export function hashRateLimitClient(identifier: string) {
  const salt =
    process.env.QUOTE_RATE_LIMIT_SALT ??
    (process.env.NODE_ENV === "production"
      ? null
      : "local-development-rate-limit");
  if (!salt) throw new Error("QUOTE_RATE_LIMIT_SALT is not configured");
  return createHash("sha256")
    .update(`${salt}:${identifier || "unknown"}`)
    .digest("hex");
}

export async function consumeQuoteRateLimit(
  businessId: string,
  clientIdentifier: string,
  options: {
    client?: Client;
    now?: Date;
    limit?: number;
    windowMs?: number;
  } = {},
) {
  const client = options.client ?? db;
  const now = options.now ?? new Date();
  const limit = options.limit ?? QUOTE_RATE_LIMIT;
  const windowMs = options.windowMs ?? QUOTE_RATE_WINDOW_MS;
  const clientHash = hashRateLimitClient(clientIdentifier);
  for (let contentionAttempt = 0; contentionAttempt < 4; contentionAttempt++) {
    const existing = await client.quoteRateLimit.findUnique({
      where: { businessId_clientHash: { businessId, clientHash } },
    });
    if (!existing) {
      try {
        await client.quoteRateLimit.create({
          data: { businessId, clientHash, windowStart: now, count: 1 },
        });
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
      } catch {
        continue;
      }
    }

    const resetAt = new Date(existing.windowStart.getTime() + windowMs);
    if (resetAt <= now) {
      const reset = await client.quoteRateLimit.updateMany({
        where: { id: existing.id, windowStart: existing.windowStart },
        data: { windowStart: now, count: 1 },
      });
      if (reset.count === 1)
        return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
      continue;
    }

    const incremented = await client.quoteRateLimit.updateMany({
      where: {
        id: existing.id,
        windowStart: existing.windowStart,
        count: { lt: limit },
      },
      data: { count: { increment: 1 } },
    });
    if (incremented.count === 1)
      return {
        allowed: true,
        remaining: Math.max(0, limit - existing.count - 1),
        retryAfterSeconds: 0,
      };

    const current = await client.quoteRateLimit.findUnique({
      where: { businessId_clientHash: { businessId, clientHash } },
    });
    if (
      current &&
      current.windowStart.getTime() === existing.windowStart.getTime()
    )
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(
            (current.windowStart.getTime() + windowMs - now.getTime()) / 1000,
          ),
        ),
      };
  }
  return { allowed: false, remaining: 0, retryAfterSeconds: 1 };
}
