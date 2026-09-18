import { z } from "zod";

export const currencies = ["USD", "EUR", "GBP", "SGD", "CAD", "AUD"] as const;
export const currencyLabels: Record<(typeof currencies)[number], string> = {
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  SGD: "Singapore dollar",
  CAD: "Canadian dollar",
  AUD: "Australian dollar",
};
const acceptedCurrencies = [...currencies, "RON"] as const;
export const moneyIdSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
const amountSchema = z.number().int().min(0).max(100_000_000);
const labelSchema = z.string().trim().min(1).max(80);

const priceItemSchema = z
  .object({
    id: moneyIdSchema,
    name: labelSchema,
    amountMinor: amountSchema,
    pricePrefix: z.enum(["FIXED", "FROM"]),
    description: z.string().trim().max(240).optional(),
  })
  .strict();

const priceCategorySchema = z
  .object({
    id: moneyIdSchema,
    name: labelSchema,
    items: z.array(priceItemSchema).max(30),
  })
  .strict();

const addOnSchema = z
  .object({ id: moneyIdSchema, label: labelSchema, amountMinor: amountSchema })
  .strict();
const quantitySchema = z
  .object({
    id: moneyIdSchema,
    label: labelSchema,
    unitLabel: z.string().trim().min(1).max(30),
    unitAmountMinor: amountSchema,
    min: z.number().int().min(0).max(1000),
    max: z.number().int().min(0).max(1000),
    step: z.number().int().min(1).max(1000),
  })
  .strict()
  .refine(
    (value) =>
      value.max >= value.min && (value.max - value.min) % value.step === 0,
    "Quantity range must align with its step",
  );

const currentPricingSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("HOURLY"),
      label: z.string().trim().min(1).max(60),
      currency: z.enum(acceptedCurrencies),
      amountMinor: amountSchema,
      note: z.string().trim().max(160).optional(),
    })
    .strict(),
  z
    .object({
      mode: z.literal("PRICE_LIST"),
      label: z.string().trim().min(1).max(60),
      currency: z.enum(acceptedCurrencies),
      categories: z.array(priceCategorySchema).max(12),
    })
    .strict(),
  z
    .object({
      mode: z.literal("SIMPLE_ESTIMATE"),
      label: z.string().trim().min(1).max(60),
      currency: z.enum(acceptedCurrencies),
      base: z
        .object({ label: labelSchema, amountMinor: amountSchema })
        .strict(),
      addOns: z.array(addOnSchema).max(12),
      quantity: quantitySchema.optional(),
    })
    .strict(),
]);

const legacyPriceListSchema = z
  .object({
    mode: z.literal("PRICE_LIST"),
    label: z.string().trim().min(1).max(60),
    currency: z.enum(acceptedCurrencies),
    items: z.array(priceItemSchema).max(20),
  })
  .strict()
  .transform((legacy) => ({
    mode: "PRICE_LIST" as const,
    label: legacy.label,
    currency: legacy.currency,
    categories: legacy.items.length
      ? [{ id: "category_services", name: "Services", items: legacy.items }]
      : [],
  }));

export const pricingConfigSchema = z
  .union([currentPricingSchema, legacyPriceListSchema])
  .superRefine((config, ctx) => {
    const ids =
      config.mode === "PRICE_LIST"
        ? config.categories.flatMap((category) => [
            category.id,
            ...category.items.map((item) => item.id),
          ])
        : config.mode === "SIMPLE_ESTIMATE"
          ? [
              ...config.addOns.map((item) => item.id),
              ...(config.quantity ? [config.quantity.id] : []),
            ]
          : [];
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Pricing IDs must be unique" });
  });
export type PricingConfig = z.infer<typeof pricingConfigSchema>;
export type EstimateSelection = { addOnIds: string[]; quantity?: number };

export function calculateEstimate(
  config: Extract<PricingConfig, { mode: "SIMPLE_ESTIMATE" }>,
  selection: EstimateSelection,
) {
  const unique = [...new Set(selection.addOnIds)];
  if (unique.length !== selection.addOnIds.length)
    throw new Error("Duplicate add-on");
  const addOns = unique.map(
    (id) =>
      config.addOns.find((item) => item.id === id) ??
      (() => {
        throw new Error("Unknown add-on");
      })(),
  );
  let totalMinor =
    config.base.amountMinor +
    addOns.reduce((total, item) => total + item.amountMinor, 0);
  if (config.quantity) {
    const quantity = selection.quantity ?? config.quantity.min;
    if (
      !Number.isInteger(quantity) ||
      quantity < config.quantity.min ||
      quantity > config.quantity.max ||
      (quantity - config.quantity.min) % config.quantity.step !== 0
    )
      throw new Error("Invalid quantity");
    totalMinor += quantity * config.quantity.unitAmountMinor;
  } else if (selection.quantity !== undefined)
    throw new Error("Quantity is not configured");
  return {
    totalMinor,
    addOns,
    quantity: config.quantity
      ? (selection.quantity ?? config.quantity.min)
      : undefined,
  };
}

export function formatMoney(
  amountMinor: number,
  currency: (typeof acceptedCurrencies)[number],
) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

export function parseMajorAmount(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim()))
    throw new Error("Enter a non-negative amount with at most 2 decimals");
  const amount = Math.round(Number(value) * 100);
  return amountSchema.parse(amount);
}
