import { z } from "zod";
import { moneyIdSchema } from "./pricing";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
    );
  }, "Enter a valid date");
export const trustConfigSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    entries: z
      .array(
        z
          .object({
            id: moneyIdSchema,
            name: z.string().trim().min(1).max(100),
            description: z.string().trim().max(300).optional(),
            referenceNumber: z.string().trim().max(80).optional(),
            expiresOn: dateSchema.optional(),
          })
          .strict(),
      )
      .max(12),
  })
  .strict()
  .superRefine((value, ctx) => {
    const ids = value.entries.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Credential IDs must be unique",
        path: ["entries"],
      });
  });
export type TrustConfig = z.infer<typeof trustConfigSchema>;
export type TrustState = "ACTIVE" | "EXPIRING" | "EXPIRED";
export function trustEntryState(
  expiresOn: string | undefined,
  now = new Date(),
): TrustState {
  if (!expiresOn) return "ACTIVE";
  const expiry = new Date(`${expiresOn}T23:59:59.999Z`);
  if (expiry < now) return "EXPIRED";
  const days = (expiry.valueOf() - now.valueOf()) / 86_400_000;
  return days <= 30 ? "EXPIRING" : "ACTIVE";
}
