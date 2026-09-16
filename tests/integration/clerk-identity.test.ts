import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createBusinessForUser } from "@/lib/business";
import {
  ClerkAccountLinkingError,
  resolveLocalUserForClerkSession,
  type ClerkUserIdentity,
} from "@/lib/clerk-identity";

const client = new PrismaClient();
const verifiedIdentity = (
  id: string,
  email: string,
  status = "verified",
): ClerkUserIdentity => ({
  id,
  primaryEmailAddressId: `${id}_email`,
  emailAddresses: [
    {
      id: `${id}_email`,
      emailAddress: email,
      verification: { status },
    },
  ],
});

afterEach(async () => {
  await client.business.deleteMany({
    where: { email: { endsWith: "@clerk-auth.test" } },
  });
  await client.user.deleteMany({
    where: { email: { endsWith: "@clerk-auth.test" } },
  });
});
afterAll(() => client.$disconnect());

describe("Clerk to LocalAction identity bridge", () => {
  it("links a verified matching email without changing user or business ownership", async () => {
    const legacy = await client.user.create({
      data: {
        email: "existing@clerk-auth.test",
        passwordHash: "legacy-only",
      },
    });
    const business = await createBusinessForUser(
      legacy.id,
      "Existing Clerk Bridge",
      legacy.email,
      client,
    );

    const resolved = await resolveLocalUserForClerkSession(
      "clerk_existing",
      async () =>
        verifiedIdentity("clerk_existing", " Existing@Clerk-Auth.Test "),
      client,
    );

    expect(resolved.id).toBe(legacy.id);
    expect(
      await client.user.findUnique({ where: { id: legacy.id } }),
    ).toMatchObject({ clerkUserId: "clerk_existing" });
    expect(
      await client.membership.findUnique({
        where: {
          userId_businessId: { userId: legacy.id, businessId: business.id },
        },
      }),
    ).not.toBeNull();
    expect(
      await client.business.findUnique({ where: { id: business.id } }),
    ).not.toBeNull();
  });

  it("uses the Clerk ID fast path without loading email identity", async () => {
    const user = await client.user.create({
      data: {
        email: "returning@clerk-auth.test",
        clerkUserId: "clerk_returning",
      },
    });
    const loader = vi.fn<() => Promise<ClerkUserIdentity>>();
    const resolved = await resolveLocalUserForClerkSession(
      "clerk_returning",
      loader,
      client,
    );
    expect(resolved.id).toBe(user.id);
    expect(loader).not.toHaveBeenCalled();
  });

  it("creates a passwordless local user for a new verified Clerk identity", async () => {
    const resolved = await resolveLocalUserForClerkSession(
      "clerk_new",
      async () => verifiedIdentity("clerk_new", "new@clerk-auth.test"),
      client,
    );
    const user = await client.user.findUnique({
      where: { id: resolved.id },
      include: { memberships: true },
    });
    expect(user).toMatchObject({
      clerkUserId: "clerk_new",
      passwordHash: null,
      memberships: [],
    });
  });

  it("does not reassign an email linked to another Clerk ID", async () => {
    const existing = await client.user.create({
      data: {
        email: "conflict@clerk-auth.test",
        clerkUserId: "clerk_original",
      },
    });
    await expect(
      resolveLocalUserForClerkSession(
        "clerk_intruder",
        async () =>
          verifiedIdentity("clerk_intruder", "conflict@clerk-auth.test"),
        client,
      ),
    ).rejects.toBeInstanceOf(ClerkAccountLinkingError);
    expect(
      await client.user.findUnique({ where: { id: existing.id } }),
    ).toMatchObject({ clerkUserId: "clerk_original" });
  });

  it("does not let an unverified primary email claim a legacy account", async () => {
    const legacy = await client.user.create({
      data: {
        email: "unverified@clerk-auth.test",
        passwordHash: "legacy-only",
      },
    });
    await expect(
      resolveLocalUserForClerkSession(
        "clerk_unverified",
        async () =>
          verifiedIdentity(
            "clerk_unverified",
            "unverified@clerk-auth.test",
            "unverified",
          ),
        client,
      ),
    ).rejects.toBeInstanceOf(ClerkAccountLinkingError);
    expect(
      await client.user.findUnique({ where: { id: legacy.id } }),
    ).toMatchObject({ clerkUserId: null });
  });
});
