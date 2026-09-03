import { z } from "zod";
import { quoteModuleConfigSchema } from "./quote-config";
import { pricingConfigSchema } from "./pricing";
import { serviceAreaConfigSchema } from "./service-area";
import { trustConfigSchema } from "./trust";

export const industries = [
  "PLUMBING",
  "HVAC",
  "ELECTRICAL",
  "ROOFING",
  "CLEANING",
  "LANDSCAPING",
  "PRESSURE_WASHING",
  "PEST_CONTROL",
  "HANDYMAN",
  "PAINTING",
  "MOBILE_DETAILING",
  "APPLIANCE_REPAIR",
  "POOL_SERVICES",
  "GARAGE_DOOR",
  "OTHER",
] as const;
export type Industry = (typeof industries)[number];

export function businessTypeLabel(
  industry: string,
  customLabel?: string | null,
) {
  if (industry === "OTHER") return customLabel?.trim() || "Other business";
  return industry
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const moduleTypes = [
  "CALL_WHATSAPP",
  "QUOTE_REQUEST",
  "PRICING",
  "SERVICE_AREA",
  "TRUST",
  "FAQ",
  "REVIEW",
  "SAVE_CONTACT",
] as const;
export type ModuleType = (typeof moduleTypes)[number];

export const primaryActions = [
  "QUOTE_REQUEST",
  "CALL",
  "WHATSAPP",
  "REVIEW",
] as const;
export type PrimaryAction = (typeof primaryActions)[number];

export const labels: Record<ModuleType, string> = {
  CALL_WHATSAPP: "Call & WhatsApp",
  QUOTE_REQUEST: "Get a Quote",
  PRICING: "Pricing",
  SERVICE_AREA: "Service Area",
  TRUST: "Trust & Credentials",
  FAQ: "FAQs",
  REVIEW: "Google Reviews",
  SAVE_CONTACT: "Save Contact",
};

export const MAX_FAQS = 12;
export const faqItemSchema = z
  .object({
    question: z.string().trim().min(1).max(160),
    answer: z.string().trim().min(1).max(500),
  })
  .strict();
export type FaqItem = z.infer<typeof faqItemSchema>;

export const moduleConfigSchemas = {
  CALL_WHATSAPP: z
    .object({
      callLabel: z.string().min(1).max(60),
      whatsappLabel: z.string().min(1).max(60),
      emergencyLabel: z.string().max(60).optional(),
      whatsappMessage: z.string().trim().max(300).optional(),
    })
    .strict(),
  QUOTE_REQUEST: quoteModuleConfigSchema,
  PRICING: pricingConfigSchema,
  SERVICE_AREA: serviceAreaConfigSchema,
  TRUST: trustConfigSchema,
  FAQ: z
    .object({
      label: z.string().min(1).max(60),
      suggestedFaqs: z.array(faqItemSchema).max(MAX_FAQS),
    })
    .strict(),
  REVIEW: z.object({ label: z.string().min(1).max(60) }).strict(),
  SAVE_CONTACT: z.object({ label: z.string().min(1).max(60) }).strict(),
} satisfies Record<ModuleType, z.ZodType>;

export type ModuleConfigByType = {
  [K in ModuleType]: z.infer<(typeof moduleConfigSchemas)[K]>;
};

export function parseModuleConfig<T extends ModuleType>(
  type: T,
  value: unknown,
): ModuleConfigByType[T] {
  return moduleConfigSchemas[type].parse(value) as ModuleConfigByType[T];
}

export function safeParseModuleConfig<T extends ModuleType>(
  type: T,
  value: unknown,
): ModuleConfigByType[T] | null {
  const result = moduleConfigSchemas[type].safeParse(value);
  return result.success ? (result.data as ModuleConfigByType[T]) : null;
}

export function moduleSupportsAction(type: ModuleType, action: PrimaryAction) {
  return (
    (action === "QUOTE_REQUEST" && type === "QUOTE_REQUEST") ||
    ((action === "CALL" || action === "WHATSAPP") &&
      type === "CALL_WHATSAPP") ||
    (action === "REVIEW" && type === "REVIEW")
  );
}

export function validPrimaryActions(
  modules: Array<{ type: string; enabled: boolean }>,
) {
  return primaryActions.filter((action) =>
    modules.some(
      (m) =>
        m.enabled &&
        moduleTypes.includes(m.type as ModuleType) &&
        moduleSupportsAction(m.type as ModuleType, action),
    ),
  );
}

export function resolvePrimaryAction(
  current: string | null,
  modules: Array<{ type: string; enabled: boolean }>,
): PrimaryAction | null {
  const valid = validPrimaryActions(modules);
  return current && valid.includes(current as PrimaryAction)
    ? (current as PrimaryAction)
    : (valid[0] ?? null);
}

export function moduleSwapIndex(
  length: number,
  index: number,
  direction: string,
): number | null {
  if (direction !== "up" && direction !== "down") return null;
  const target = direction === "up" ? index - 1 : index + 1;
  return index >= 0 && target >= 0 && target < length ? target : null;
}

export function canPublishBusiness(
  business: {
    primaryAction: string | null;
    phone: string;
    description: string;
  },
  modules: Array<{ type: string; enabled: boolean }>,
) {
  return Boolean(
    business.phone &&
    business.description &&
    business.primaryAction &&
    validPrimaryActions(modules).includes(
      business.primaryAction as PrimaryAction,
    ),
  );
}
