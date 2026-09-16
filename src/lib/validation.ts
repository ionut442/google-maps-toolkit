import { z } from "zod";
import { industries, primaryActions } from "./domain";
import {
  directGoogleReviewUrlSchema,
  googleMapsUrlSchema,
} from "./google-review-link";

const httpUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        ["http:", "https:"].includes(url.protocol) &&
        (url.hostname === "localhost" || url.hostname.includes("."))
      );
    } catch {
      return false;
    }
  }, "Enter a complete website address starting with http:// or https://");
const optionalUrl = z
  .union([z.literal(""), httpUrl])
  .transform((v) => v || null);
const optionalGoogleMapsUrl = z
  .union([z.literal(""), googleMapsUrlSchema])
  .transform((value) => value || null);
const optionalDirectReviewUrl = z
  .union([z.literal(""), directGoogleReviewUrlSchema])
  .transform((value) => value || null);
export const businessNameSchema = z.object({
  businessName: z.string().trim().min(2).max(100),
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
  phone: z
    .string()
    .trim()
    .regex(
      /^\+?\d{7,15}$/,
      "Use 7 to 15 numbers, with an optional + at the start",
    ),
  whatsapp: z
    .string()
    .trim()
    .regex(
      /^\+?\d{7,15}$/,
      "Use 7 to 15 numbers, with an optional + at the start",
    ),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  website: optionalUrl,
  logoUrl: optionalUrl,
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a six-digit hex colour"),
  googleReviewUrl: optionalDirectReviewUrl,
  googleBusinessName: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => v || null),
  googleMapsUrl: optionalGoogleMapsUrl
    .optional()
    .transform((value) => value ?? null),
});
export const primaryActionSchema = z.object({
  primaryAction: z.enum(primaryActions),
});

export function normalizePhone(value: string) {
  const trimmed = value.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  return prefix + trimmed.replace(/\D/g, "");
}
