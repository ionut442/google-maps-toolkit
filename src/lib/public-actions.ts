import type { PrimaryAction } from "./domain";

const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;

function digitsOnly(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function hasOnlyPhoneCharacters(value: string) {
  return /^[+()\d.\-\s]+$/.test(value);
}

function trimPhoneInput(value: string) {
  return value.trim().replace(/^=+\s*/, "");
}

export function normalizeDialablePhone(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = trimPhoneInput(value);
  if (!hasOnlyPhoneCharacters(trimmed)) return null;
  const digits = digitsOnly(trimmed);
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS)
    return null;
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (trimmed.startsWith("00") && digits.length > 2)
    return `+${digits.slice(2)}`;
  return digits;
}

export function createTelHref(value: string | null | undefined) {
  const normalized = normalizeDialablePhone(value);
  return normalized ? `tel:${normalized}` : null;
}

export function normalizeWhatsAppNumber(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const trimmed = trimPhoneInput(value);
  if (!hasOnlyPhoneCharacters(trimmed)) return null;
  let digits = digitsOnly(trimmed);
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS)
    return null;
  return digits;
}

export function createWhatsAppUrl(
  value: string | null | undefined,
  message?: string | null,
) {
  const number = normalizeWhatsAppNumber(value);
  if (!number) return null;
  const url = new URL(`https://wa.me/${number}`);
  const cleanMessage = message?.trim();
  if (cleanMessage) url.searchParams.set("text", cleanMessage);
  return url.toString();
}

export function safeHttpUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export type PublicAction = {
  type: PrimaryAction;
  label: string;
  href: string;
  external?: boolean;
};

export function resolvePublicPrimaryAction(input: {
  configured: string | null;
  enabledTypes: string[];
  phone: string;
  whatsapp: string;
  whatsappMessage?: string;
  reviewUrl: string | null;
}): PublicAction | null {
  const quote: PublicAction | null = input.enabledTypes.includes(
    "QUOTE_REQUEST",
  )
    ? { type: "QUOTE_REQUEST" as const, label: "Get a Quote", href: "#quote" }
    : null;
  const tel = input.enabledTypes.includes("CALL_WHATSAPP")
    ? createTelHref(input.phone)
    : null;
  const call: PublicAction | null = tel
    ? { type: "CALL" as const, label: "Call Now", href: tel }
    : null;
  const whatsappUrl = input.enabledTypes.includes("CALL_WHATSAPP")
    ? createWhatsAppUrl(input.whatsapp, input.whatsappMessage)
    : null;
  const whatsapp: PublicAction | null = whatsappUrl
    ? {
        type: "WHATSAPP" as const,
        label: "Message on WhatsApp",
        href: whatsappUrl,
        external: true,
      }
    : null;
  const reviewUrl = input.enabledTypes.includes("REVIEW")
    ? safeHttpUrl(input.reviewUrl)
    : null;
  const review: PublicAction | null = reviewUrl
    ? {
        type: "REVIEW" as const,
        label: "Open Google Reviews",
        href: reviewUrl,
        external: true,
      }
    : null;
  const actions = [quote, call, whatsapp, review].filter(
    (action): action is PublicAction => Boolean(action),
  );
  return (
    actions.find((action) => action.type === input.configured) ??
    actions[0] ??
    null
  );
}
