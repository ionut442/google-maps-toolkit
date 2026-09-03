import { describe, expect, it } from "vitest";
import {
  loginSchema,
  normalizePhone,
  profileSchema,
  signupSchema,
} from "@/lib/validation";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("account and profile validation", () => {
  it("normalizes email and enforces strong password length", () => {
    expect(
      signupSchema.parse({
        email: " Owner@Example.COM ",
        password: "long-enough",
        businessName: "ABC",
      }).email,
    ).toBe("owner@example.com");
    expect(() =>
      signupSchema.parse({
        email: "x@y.com",
        password: "short",
        businessName: "ABC",
      }),
    ).toThrow();
  });
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
  it("hashes and verifies passwords without plaintext storage", async () => {
    const password = "correct horse battery";
    const digest = await hashPassword(password);
    expect(digest).not.toContain(password);
    await expect(verifyPassword(password, digest)).resolves.toBe(true);
    await expect(verifyPassword("wrong", digest)).resolves.toBe(false);
  });
  it("does not disclose login parsing detail", () =>
    expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(
      false,
    ));
});
