import { describe, expect, it } from "vitest";
import { normalizePhone, profileSchema } from "@/lib/validation";

describe("account and profile validation", () => {
  it("rejects invalid profile URLs and colours", () =>
    expect(() =>
      profileSchema.parse({
        name: "ABC",
        description: "A useful local business",
        phone: "1234567",
        whatsapp: "1234567",
        email: "a@b.com",
        website: "wrong",
        logoUrl: "",
        brandColor: "blue",
        googleReviewUrl: "",
      }),
    ).toThrow());
  it("normalizes phone values without losing international prefix", () =>
    expect(normalizePhone("+40 (700) 123-456")).toBe("+40700123456"));
  it("accepts only dialable profile numbers", () => {
    const base = {
      name: "ABC",
      description: "A useful local business",
      phone: "+40700123456",
      whatsapp: "40700123456",
      email: "a@b.com",
      website: "https://example.com",
      logoUrl: "https://cdn.example.com/logo.png",
      brandColor: "#2563EB",
      googleReviewUrl: "",
    };
    expect(profileSchema.safeParse(base).success).toBe(true);
    expect(profileSchema.safeParse({ ...base, phone: "call-me" }).success).toBe(
      false,
    );
    expect(
      profileSchema.safeParse({ ...base, whatsapp: "+40 700 123 456" }).success,
    ).toBe(false);
  });
});
