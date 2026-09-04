import { describe, expect, it } from "vitest";
import {
  createTelHref,
  createWhatsAppUrl,
  normalizeDialablePhone,
  normalizeWhatsAppNumber,
  resolvePublicPrimaryAction,
  safeHttpUrl,
} from "@/lib/public-actions";

describe("public customer action URLs", () => {
  it("normalizes common international dial formats", () => {
    expect(normalizeDialablePhone("+40 (700) 111-222")).toBe("+40700111222");
    expect(normalizeDialablePhone("0040 700 111 222")).toBe("+40700111222");
    expect(createTelHref("40700-111-222")).toBe("tel:40700111222");
    expect(createTelHref("=40700-111-222")).toBe("tel:40700111222");
  });

  it("rejects missing and impossible phone lengths", () => {
    expect(createTelHref("123")).toBeNull();
    expect(createTelHref("")).toBeNull();
    expect(normalizeDialablePhone("+1234567890123456")).toBeNull();
  });

  it("builds WhatsApp numbers without formatting or a plus sign", () => {
    expect(normalizeWhatsAppNumber("+40 (700) 111-222")).toBe("40700111222");
    expect(normalizeWhatsAppNumber("0040 700 111 222")).toBe("40700111222");
    expect(normalizeWhatsAppNumber("=40700111222")).toBe("40700111222");
    expect(normalizeWhatsAppNumber("0700111222")).toBe("0700111222");
  });

  it("safely encodes an optional WhatsApp message", () => {
    const href = createWhatsAppUrl("+40700111222", "Bună! Sink & tap? #urgent");
    const url = new URL(href!);
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/40700111222");
    expect(url.searchParams.get("text")).toBe("Bună! Sink & tap? #urgent");
  });

  it("only accepts HTTP website targets", () => {
    expect(safeHttpUrl("https://example.com/review")).toBe(
      "https://example.com/review",
    );
    expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeHttpUrl("not a URL")).toBeNull();
  });

  it("uses a supported configured action", () => {
    expect(
      resolvePublicPrimaryAction({
        configured: "WHATSAPP",
        enabledTypes: ["CALL_WHATSAPP", "QUOTE_REQUEST"],
        phone: "+40700111222",
        whatsapp: "+40700111222",
        reviewUrl: null,
      })?.type,
    ).toBe("WHATSAPP");
  });

  it("falls back when the configured action is unavailable", () => {
    expect(
      resolvePublicPrimaryAction({
        configured: "REVIEW",
        enabledTypes: ["CALL_WHATSAPP"],
        phone: "+40700111222",
        whatsapp: "",
        reviewUrl: "javascript:alert(1)",
      }),
    ).toMatchObject({ type: "CALL", href: "tel:+40700111222" });
  });

  it("returns no action when all enabled actions lack valid targets", () => {
    expect(
      resolvePublicPrimaryAction({
        configured: "CALL",
        enabledTypes: ["CALL_WHATSAPP", "REVIEW"],
        phone: "bad",
        whatsapp: "bad",
        reviewUrl: null,
      }),
    ).toBeNull();
  });
});
