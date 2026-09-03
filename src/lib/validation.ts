import { z } from "zod";
import { industries, primaryActions } from "./domain";

const httpUrl = z
  .string()
  .url()
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Use a valid HTTP or HTTPS URL");
const optionalUrl = z
  .union([z.literal(""), httpUrl])
  .transform((v) => v || null);
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(10, "Use at least 10 characters").max(128),
  businessName: z.string().trim().min(2).max(100),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});
export const industrySchema = z
  .object({
    industry: z.enum(industries),
    customIndustryLabel: z.string().trim().max(80).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.industry === "OTHER" && !value.customIndustryLabel) {
      ctx.addIssue({
        code: "custom",
        path: ["customIndustryLabel"],
        message: "Tell us what type of business you run",
      });
    }
  });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(500),
  phone: z.string().trim().min(7).max(40),
  whatsapp: z.string().trim().min(7).max(40),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  website: optionalUrl,
  logoUrl: optionalUrl,
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour"),
  googleReviewUrl: optionalUrl,
  googleBusinessName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
  googleMapsUrl: optionalUrl.optional().transform((value) => value ?? null),
});
export const primaryActionSchema = z.object({
  primaryAction: z.enum(primaryActions),
});

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return prefix + trimmed.replace(/\D/g, "");
}
