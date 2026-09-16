import { Prisma, type PrismaClient } from "@prisma/client";
import { db } from "./db";

type Client = PrismaClient | Prisma.TransactionClient;

export type ClerkUserIdentity = {
  id: string;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: { status?: string | null } | null;
  }>;
};

const localUserSelect = { id: true, email: true } as const;

export class ClerkAccountLinkingError extends Error {
  constructor(message = "We could not safely link this Clerk account.") {
    super(message);
    this.name = "ClerkAccountLinkingError";
  }
}

export function normalizeIdentityEmail(email: string) {
  return email.trim().toLowerCase();
}

export function verifiedPrimaryEmail(identity: ClerkUserIdentity) {
  const primary = identity.emailAddresses.find(
    (address) => address.id === identity.primaryEmailAddressId,
  );
  if (!primary || primary.verification?.status !== "verified") {
    throw new ClerkAccountLinkingError(
      "Your primary Clerk email must be verified before LocalAction can link this account.",
    );
  }
  return normalizeIdentityEmail(primary.emailAddress);
}

async function linkedUser(clerkUserId: string, client: Client) {
  return client.user.findUnique({
    where: { clerkUserId },
    select: localUserSelect,
  });
}

async function claimExistingUser(
  localUserId: string,
  clerkUserId: string,
  client: Client,
) {
  const claimed = await client.user.updateMany({
    where: { id: localUserId, clerkUserId: null },
    data: { clerkUserId },
  });
  if (claimed.count === 1) {
    const user = await linkedUser(clerkUserId, client);
    if (user) return user;
    throw new ClerkAccountLinkingError();
  }

  const current = await client.user.findUnique({
    where: { id: localUserId },
    select: { ...localUserSelect, clerkUserId: true },
  });
  if (current?.clerkUserId === clerkUserId) {
    return { id: current.id, email: current.email };
  }
  throw new ClerkAccountLinkingError(
    "This LocalAction account is already linked to another Clerk identity.",
  );
}

async function linkOrCreateUser(
  clerkUserId: string,
  email: string,
  client: Client,
) {
  const existing = await client.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.clerkUserId && existing.clerkUserId !== clerkUserId) {
      throw new ClerkAccountLinkingError(
        "This LocalAction account is already linked to another Clerk identity.",
      );
    }
    if (existing.clerkUserId === clerkUserId) {
      return { id: existing.id, email: existing.email };
    }
    return claimExistingUser(existing.id, clerkUserId, client);
  }

  try {
    return await client.user.create({
      data: { email, clerkUserId },
      select: localUserSelect,
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }

    const byClerkId = await linkedUser(clerkUserId, client);
    if (byClerkId) return byClerkId;

    const byEmail = await client.user.findUnique({ where: { email } });
    if (!byEmail) throw error;
    if (byEmail.clerkUserId && byEmail.clerkUserId !== clerkUserId) {
      throw new ClerkAccountLinkingError(
        "This LocalAction account is already linked to another Clerk identity.",
      );
    }
    return claimExistingUser(byEmail.id, clerkUserId, client);
  }
}

export async function resolveLocalUserForClerkSession(
  clerkUserId: string,
  loadIdentity: () => Promise<ClerkUserIdentity>,
  client: Client = db,
) {
  const existing = await linkedUser(clerkUserId, client);
  if (existing) return existing;

  const identity = await loadIdentity();
  if (identity.id !== clerkUserId) {
    throw new ClerkAccountLinkingError(
      "Clerk identity did not match the session.",
    );
  }
  return linkOrCreateUser(clerkUserId, verifiedPrimaryEmail(identity), client);
}
