import { z } from "zod";

const serviceIdSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
const serviceNameSchema = z.string().trim().min(1).max(100);

const serviceItemSchema = z
  .object({
    id: serviceIdSchema,
    name: serviceNameSchema,
    description: z.string().trim().max(300).optional(),
  })
  .strict();

const serviceCategorySchema = z
  .object({
    id: serviceIdSchema,
    name: serviceNameSchema,
    items: z.array(serviceItemSchema).max(30),
  })
  .strict();

export const servicesConfigSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    categories: z.array(serviceCategorySchema).max(12),
  })
  .strict()
  .superRefine((config, ctx) => {
    const ids = config.categories.flatMap((category) => [
      category.id,
      ...category.items.map((item) => item.id),
    ]);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Service IDs must be unique" });
  });

export type ServicesConfig = z.infer<typeof servicesConfigSchema>;

export function serviceCount(config: ServicesConfig) {
  return config.categories.reduce(
    (total, category) => total + category.items.length,
    0,
  );
}
