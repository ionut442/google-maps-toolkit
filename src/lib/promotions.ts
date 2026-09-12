import { z } from "zod";

const promotionIdSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
export const promotionRequestMethods = ["PHONE", "WHATSAPP", "EMAIL"] as const;
export type PromotionRequestMethod = (typeof promotionRequestMethods)[number];
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid date");

const promotionSchema = z
  .object({
    id: promotionIdSchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(400).optional(),
    validUntil: dateSchema.optional(),
    requestMethod: z.enum(promotionRequestMethods).default("PHONE"),
  })
  .strict();

export const promotionsConfigSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    offers: z.array(promotionSchema).max(20),
  })
  .strict()
  .superRefine((config, ctx) => {
    const ids = config.offers.map((offer) => offer.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Offer IDs must be unique" });
  });

export type PromotionsConfig = z.infer<typeof promotionsConfigSchema>;

export function promotionIsExpired(
  validUntil: string | undefined,
  today = new Date().toISOString().slice(0, 10),
) {
  return Boolean(validUntil && validUntil < today);
}
