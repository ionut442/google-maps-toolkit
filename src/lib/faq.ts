import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import {
  faqItemSchema,
  MAX_FAQS,
  moduleSwapIndex,
  parseModuleConfig,
  type FaqItem,
} from "./domain";
import { requireOwnedBusiness } from "./business";

type Client = PrismaClient | Prisma.TransactionClient;

async function faqContext(userId: string, businessId: string, client: Client) {
  const business = await requireOwnedBusiness(userId, businessId, client);
  const faqModule = business.modules.find((item) => item.type === "FAQ");
  if (!faqModule) throw new Error("FAQ tool not found or access denied");
  try {
    return {
      business,
      faqModule,
      config: parseModuleConfig("FAQ", JSON.parse(faqModule.config)),
    };
  } catch {
    throw new Error("FAQ configuration is invalid");
  }
}

async function saveFaqs(
  userId: string,
  businessId: string,
  update: (items: FaqItem[]) => FaqItem[],
  client: Client,
) {
  const { business, faqModule, config } = await faqContext(
    userId,
    businessId,
    client,
  );
  const suggestedFaqs = update([...config.suggestedFaqs]);
  const validated = parseModuleConfig("FAQ", { ...config, suggestedFaqs });
  await client.businessModule.update({
    where: { id: faqModule.id },
    data: { config: JSON.stringify(validated) },
  });
  return business.slug;
}

export async function addFaqItem(
  userId: string,
  businessId: string,
  item: FaqItem,
  client: Client = db,
) {
  const validated = faqItemSchema.parse(item);
  return saveFaqs(
    userId,
    businessId,
    (items) => {
      if (items.length >= MAX_FAQS) throw new Error(`FAQ limit is ${MAX_FAQS}`);
      return [...items, validated];
    },
    client,
  );
}

export async function updateFaqItem(
  userId: string,
  businessId: string,
  index: number,
  item: FaqItem,
  client: Client = db,
) {
  const validated = faqItemSchema.parse(item);
  return saveFaqs(
    userId,
    businessId,
    (items) => {
      if (!Number.isInteger(index) || index < 0 || index >= items.length)
        throw new Error("FAQ item not found");
      items[index] = validated;
      return items;
    },
    client,
  );
}

export async function deleteFaqItem(
  userId: string,
  businessId: string,
  index: number,
  client: Client = db,
) {
  return saveFaqs(
    userId,
    businessId,
    (items) => {
      if (!Number.isInteger(index) || index < 0 || index >= items.length)
        throw new Error("FAQ item not found");
      return items.filter((_, itemIndex) => itemIndex !== index);
    },
    client,
  );
}

export async function moveFaqItem(
  userId: string,
  businessId: string,
  index: number,
  direction: string,
  client: Client = db,
) {
  return saveFaqs(
    userId,
    businessId,
    (items) => {
      const target = moduleSwapIndex(items.length, index, direction);
      if (target === null) throw new Error("FAQ cannot move in that direction");
      [items[index], items[target]] = [items[target], items[index]];
      return items;
    },
    client,
  );
}
