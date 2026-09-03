import { normalizeDialablePhone, safeHttpUrl } from "./public-actions";

export type VCardBusiness = {
  name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
};

export function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function createVCard(business: VCardBusiness) {
  const name = business.name.trim() || "Local business";
  const phone = normalizeDialablePhone(business.phone);
  const email = business.email?.trim();
  const website = safeHttpUrl(business.website);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCardValue(name)}`,
    `ORG:${escapeVCardValue(name)}`,
  ];
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(phone)}`);
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    lines.push(`EMAIL;TYPE=WORK:${escapeVCardValue(email)}`);
  if (website) lines.push(`URL:${escapeVCardValue(website)}`);
  lines.push("END:VCARD", "");
  return lines.join("\r\n");
}

export function vCardFilename(slug: string) {
  const safe = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "business-contact"}.vcf`;
}
