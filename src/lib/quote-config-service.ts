import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import { parseModuleConfig, moduleSwapIndex } from "./domain";
import {
  contactKinds,
  createQuoteField,
  quoteFieldTypes,
  quoteModuleConfigSchema,
  type QuoteField,
  type QuoteFieldType,
  type QuoteModuleConfig,
} from "./quote-config";
import { requireOwnedBusiness } from "./business";

type Client = PrismaClient | Prisma.TransactionClient;

async function context(userId: string, businessId: string, client: Client) {
  const business = await requireOwnedBusiness(userId, businessId, client);
  const quoteModule = business.modules.find(
    (item) => item.type === "QUOTE_REQUEST",
  );
  if (!quoteModule) throw new Error("Quote tool not found or access denied");
  let config: QuoteModuleConfig;
  try {
    config = parseModuleConfig("QUOTE_REQUEST", JSON.parse(quoteModule.config));
  } catch {
    throw new Error("Quote configuration is invalid");
  }
  return { business, quoteModule, config };
}

async function mutate(
  userId: string,
  businessId: string,
  update: (config: QuoteModuleConfig) => QuoteModuleConfig,
  client: Client,
) {
  const { business, quoteModule, config } = await context(
    userId,
    businessId,
    client,
  );
  const next = quoteModuleConfigSchema.parse(update(structuredClone(config)));
  await client.businessModule.update({
    where: { id: quoteModule.id },
    data: {
      config: JSON.stringify(next),
      enabled: true,
      customizedAt: new Date(),
    },
  });
  return business.slug;
}

export function editableQuoteField(input: {
  current: QuoteField;
  label: string;
  helperText: string;
  required: boolean;
  choices?: string[];
  min?: number;
  max?: number;
  contactKind?: string;
}): QuoteField {
  const shared = {
    ...input.current,
    label: input.label,
    helperText: input.helperText,
    required: input.required,
  };
  if (
    input.current.type === "DROPDOWN" ||
    input.current.type === "MULTIPLE_CHOICE"
  )
    return {
      ...shared,
      choices: input.choices ?? input.current.choices,
    } as QuoteField;
  if (input.current.type === "NUMBER")
    return { ...shared, min: input.min, max: input.max } as QuoteField;
  if (input.current.type === "CONTACT") {
    if (
      !contactKinds.includes(input.contactKind as (typeof contactKinds)[number])
    )
      throw new Error("Choose a supported contact type");
    return { ...shared, contactKind: input.contactKind } as QuoteField;
  }
  return shared;
}

export async function updateQuoteFormMeta(
  userId: string,
  businessId: string,
  value: { label: string; intro: string },
  client: Client = db,
) {
  return mutate(
    userId,
    businessId,
    (config) => ({ ...config, label: value.label, intro: value.intro }),
    client,
  );
}

export async function updateQuoteFormField(
  userId: string,
  businessId: string,
  index: number,
  value: Omit<Parameters<typeof editableQuoteField>[0], "current">,
  client: Client = db,
) {
  return mutate(
    userId,
    businessId,
    (config) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= config.fields.length
      )
        throw new Error("Quote field not found");
      config.fields[index] = editableQuoteField({
        current: config.fields[index],
        ...value,
      });
      return config;
    },
    client,
  );
}

export async function addQuoteFormField(
  userId: string,
  businessId: string,
  type: string,
  client: Client = db,
) {
  if (!quoteFieldTypes.includes(type as QuoteFieldType))
    throw new Error("Choose a supported field type");
  return mutate(
    userId,
    businessId,
    (config) => {
      if (config.fields.length >= 16)
        throw new Error("Quote forms support up to 16 fields");
      const id = `field_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
      config.fields.push(createQuoteField(type as QuoteFieldType, id));
      return config;
    },
    client,
  );
}

export async function deleteQuoteFormField(
  userId: string,
  businessId: string,
  index: number,
  client: Client = db,
) {
  return mutate(
    userId,
    businessId,
    (config) => {
      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= config.fields.length
      )
        throw new Error("Quote field not found");
      config.fields.splice(index, 1);
      return config;
    },
    client,
  );
}

export async function moveQuoteFormField(
  userId: string,
  businessId: string,
  index: number,
  direction: string,
  client: Client = db,
) {
  return mutate(
    userId,
    businessId,
    (config) => {
      const target = moduleSwapIndex(config.fields.length, index, direction);
      if (target === null)
        throw new Error("Quote field cannot move in that direction");
      [config.fields[index], config.fields[target]] = [
        config.fields[target],
        config.fields[index],
      ];
      return config;
    },
    client,
  );
}
