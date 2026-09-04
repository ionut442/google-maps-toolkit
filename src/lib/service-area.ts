import { z } from "zod";
import { moneyIdSchema } from "./pricing";

export const structuredAreaSchema = z
  .object({
    id: moneyIdSchema,
    name: z.string().trim().min(1).max(120),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    countryCode: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .optional(),
    source: z.literal("PHOTON"),
    sourceId: z.string().trim().min(1).max(160),
  })
  .strict();

const postalCodeSchema = z
  .object({
    id: moneyIdSchema,
    display: z.string().trim().min(2).max(16),
    normalized: z.string().min(2).max(16),
  })
  .strict();

const serviceAreaCurrentSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    areas: z.array(structuredAreaSchema).max(20),
    postalCodes: z.array(postalCodeSchema).max(20),
  })
  .strict();

const legacyServiceAreaSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    areas: z
      .array(
        z
          .object({ id: moneyIdSchema, name: z.string().trim().min(1).max(80) })
          .strict(),
      )
      .max(20),
    postalCodes: z.array(postalCodeSchema).max(20),
  })
  .strict();

export const serviceAreaConfigSchema = z
  .union([serviceAreaCurrentSchema, legacyServiceAreaSchema])
  .superRefine((value, ctx) => {
    const areaKeys = value.areas.map((item) => item.name.toLocaleLowerCase());
    const postalKeys = value.postalCodes.map((item) =>
      normalizePostalCode(item.display),
    );
    const ids = [
      ...value.areas.map((item) => item.id),
      ...value.postalCodes.map((item) => item.id),
    ];
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Service-area IDs must be unique",
      });
    if (new Set(areaKeys).size !== areaKeys.length)
      ctx.addIssue({
        code: "custom",
        message: "Service areas must be unique",
        path: ["areas"],
      });
    if (new Set(postalKeys).size !== postalKeys.length)
      ctx.addIssue({
        code: "custom",
        message: "Postcodes must be unique",
        path: ["postalCodes"],
      });
    value.postalCodes.forEach((item, index) => {
      if (
        !postalCodeIsValid(item.display) ||
        item.normalized !== normalizePostalCode(item.display)
      )
        ctx.addIssue({
          code: "custom",
          message:
            "Use letters and numbers only, with optional spaces or hyphens",
          path: ["postalCodes", index, "display"],
        });
    });
  });

export type ServiceAreaConfig = z.infer<typeof serviceAreaConfigSchema>;
export type StructuredArea = z.infer<typeof structuredAreaSchema>;
export const normalizeArea = (value: string) =>
  value.trim().replace(/\s+/g, " ");
export const normalizePostalCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "");
export const postalCodeIsValid = (value: string) =>
  /^[\p{L}\p{N}]+(?:[ -][\p{L}\p{N}]+)*$/u.test(value.trim());

export function parsePostalCodeBatch(value: string) {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  value
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const normalized = normalizePostalCode(item);
      if (!postalCodeIsValid(item)) invalid.push(item);
      else if (!seen.has(normalized)) {
        seen.add(normalized);
        valid.push(item.toUpperCase());
      }
    });
  return { valid, invalid };
}
export function postcodeIsServed(config: ServiceAreaConfig, value: string) {
  const normalized = normalizePostalCode(value);
  return Boolean(
    normalized &&
    config.postalCodes.some((item) => item.normalized === normalized),
  );
}
