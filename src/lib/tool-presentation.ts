import {
  labels,
  parseModuleConfig,
  type ModuleConfigByType,
  type ModuleType,
} from "./domain";
import { formatMoney } from "./pricing";
import { trustEntryState } from "./trust";

export const toolDescriptions: Record<ModuleType, string> = {
  CALL_WHATSAPP: "Let customers contact you instantly.",
  QUOTE_REQUEST: "Collect job details before you call customers back.",
  PRICING: "Help customers understand what your services cost.",
  SERVICE_AREA: "Show customers where your business works.",
  TRUST: "Share qualifications and cover that build confidence.",
  FAQ: "Answer common questions before customers need to ask.",
  REVIEW: "Send happy customers to your Google listing.",
  SAVE_CONTACT: "Let customers save your details to their phone.",
};

export const toolEditorTitles: Record<ModuleType, string> = {
  CALL_WHATSAPP: "How customers contact you",
  QUOTE_REQUEST: "Quote request form",
  PRICING: "Your prices",
  SERVICE_AREA: "Where do you work?",
  TRUST: "Credentials & reassurance",
  FAQ: "Questions customers often ask",
  REVIEW: "Google Reviews",
  SAVE_CONTACT: "Save Contact",
};

export function toolSummary(
  type: ModuleType,
  config: ModuleConfigByType[ModuleType],
  options: { googleConnected?: boolean } = {},
) {
  if (type === "CALL_WHATSAPP") return "Call + WhatsApp ready";
  if (type === "QUOTE_REQUEST") {
    const quote = config as ModuleConfigByType["QUOTE_REQUEST"];
    const photos = quote.fields.some((field) => field.type === "PHOTO");
    return `${quote.fields.length} questions${photos ? " · Photos enabled" : ""}`;
  }
  if (type === "PRICING") {
    const pricing = config as ModuleConfigByType["PRICING"];
    if (pricing.mode === "HOURLY")
      return `${formatMoney(pricing.amountMinor, pricing.currency)} / hour`;
    if (pricing.mode === "PRICE_LIST") {
      const count = pricing.categories.reduce(
        (total, category) => total + category.items.length,
        0,
      );
      return `${count} ${count === 1 ? "price" : "prices"} in ${pricing.categories.length} ${pricing.categories.length === 1 ? "category" : "categories"}`;
    }
    return "Simple estimate configured";
  }
  if (type === "SERVICE_AREA") {
    const area = config as ModuleConfigByType["SERVICE_AREA"];
    return `${area.areas.length} areas · ${area.postalCodes.length} postcodes`;
  }
  if (type === "TRUST") {
    const trust = config as ModuleConfigByType["TRUST"];
    const active = trust.entries.filter(
      (entry) => trustEntryState(entry.expiresOn) === "ACTIVE",
    ).length;
    const expiring = trust.entries.filter(
      (entry) => trustEntryState(entry.expiresOn) === "EXPIRING",
    ).length;
    return `${active} active${expiring ? ` · ${expiring} expires soon` : ""}`;
  }
  if (type === "FAQ") {
    const faq = config as ModuleConfigByType["FAQ"];
    return `${faq.suggestedFaqs.length} questions`;
  }
  if (type === "REVIEW")
    return options.googleConnected
      ? "Google listing connected"
      : "Finish Google setup";
  return "Ready";
}

export function parsedTool(type: ModuleType, raw: string) {
  return {
    type,
    label: labels[type],
    config: parseModuleConfig(type, JSON.parse(raw)),
  };
}

export function toolEditorHref(moduleId: string) {
  return `/dashboard/tools/${encodeURIComponent(moduleId)}`;
}
