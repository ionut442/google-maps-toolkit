import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import { getTemplate } from "./templates";
import { uniqueSlug } from "./slug";

type Client = PrismaClient | Prisma.TransactionClient;

export async function findOwnedBusiness(
  userId: string,
  businessId?: string,
  client: Client = db,
) {
  const membership = await client.membership.findFirst({
    where: { userId, ...(businessId ? { businessId } : {}) },
    include: {
      business: { include: { modules: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  return membership?.business ?? null;
}

export async function requireOwnedBusiness(
  userId: string,
  businessId?: string,
  client: Client = db,
) {
  const business = await findOwnedBusiness(userId, businessId, client);
  if (!business) throw new Error("Business not found or access denied");
  return business;
}

export async function createBusinessForUser(
  userId: string,
  name: string,
  email: string,
  client: Client = db,
) {
  const slug = await uniqueSlug(name, async (candidate) =>
    Boolean(
      await client.business.findUnique({
        where: { slug: candidate },
        select: { id: true },
      }),
    ),
  );
  return client.business.create({
    data: {
      name,
      email,
      slug,
      industry: "UNSET",
      memberships: { create: { userId, role: "OWNER" } },
    },
  });
}

export async function applyTemplate(
  businessId: string,
  industry: string,
  client: Client = db,
  customIndustryLabel: string | null = null,
) {
  const template = getTemplate(industry);
  await client.businessModule.deleteMany({ where: { businessId } });
  await client.business.update({
    where: { id: businessId },
    data: {
      industry,
      customIndustryLabel: industry === "OTHER" ? customIndustryLabel : null,
      primaryAction: template.defaultPrimaryAction,
      onboardingStep: 3,
      modules: {
        create: template.modules.map((m, sortOrder) => ({
          type: m.type,
          enabled: m.enabled,
          sortOrder,
          config: JSON.stringify(m.config),
        })),
      },
    },
  });
  return template;
}
