import { describe, expect, it } from "vitest";
import { createVCard, escapeVCardValue, vCardFilename } from "@/lib/vcard";

describe("vCard generation", () => {
  it("generates a standards-shaped card with CRLF endings", () => {
    const card = createVCard({
      name: "RapidFlow Plumbing",
      phone: "+40 (700) 111-222",
      email: "hello@example.com",
      website: "https://example.com/contact",
    });
    expect(card).toContain("BEGIN:VCARD\r\nVERSION:3.0\r\n");
    expect(card).toContain("TEL;TYPE=WORK,VOICE:+40700111222\r\n");
    expect(card).toContain("EMAIL;TYPE=WORK:hello@example.com\r\n");
    expect(card).toContain("URL:https://example.com/contact\r\n");
    expect(card.endsWith("END:VCARD\r\n")).toBe(true);
  });

  it("escapes punctuation, slashes, line breaks, and preserves Unicode", () => {
    expect(escapeVCardValue("Ștefan, A;B\\C\nD")).toBe(
      "Ștefan\\, A\\;B\\\\C\\nD",
    );
  });

  it("omits invalid optional values", () => {
    const card = createVCard({
      name: "Test",
      phone: "123",
      email: "not-an-email",
      website: "javascript:alert(1)",
    });
    expect(card).not.toContain("TEL;");
    expect(card).not.toContain("EMAIL;");
    expect(card).not.toContain("URL:");
  });

  it("sanitizes attachment filenames", () => {
    expect(vCardFilename("  Rapid Flow / Plumbing  ")).toBe(
      "rapid-flow-plumbing.vcf",
    );
    expect(vCardFilename("🔥")).toBe("business-contact.vcf");
  });
});
