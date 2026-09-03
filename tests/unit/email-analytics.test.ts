import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildQuoteEmail,
  configuredEmailTransport,
  DevelopmentCaptureTransport,
} from "@/lib/email";
import { emitAnalyticsHook } from "@/lib/analytics";

describe("quote email and analytics hooks", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("renders useful plain-text lead content and strips subject injection", () => {
    const email = buildQuoteEmail({
      businessName: "RapidFlow\r\nBcc: attacker@example.com",
      quoteId: crypto.randomUUID(),
      customerName: "Ana",
      customerPhone: "+40700111222",
      customerEmail: "ana@example.com",
      answers: [
        {
          fieldId: "issue",
          label: "Issue",
          type: "TEXT",
          value: "Leaking sink",
        },
      ],
      photoCount: 2,
      appUrl: "https://app.example.com",
    });
    expect(email.subject).not.toContain("\r");
    expect(email.subject).not.toContain("\n");
    expect(email.bodyText).toContain("Leaking sink");
    expect(email.bodyText).toContain("Photos: 2");
    expect(email.bodyText).toContain(
      "https://app.example.com/dashboard/quotes/",
    );
  });

  it("provides deterministic development capture IDs", async () => {
    await expect(
      new DevelopmentCaptureTransport().send({
        deliveryId: "delivery-1",
        destination: "owner@example.test",
        subject: "New quote",
        text: "Body",
      }),
    ).resolves.toEqual({ messageId: "development:delivery-1" });
  });

  it("never marks development capture delivered in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("EMAIL_TRANSPORT", "development");
    await expect(
      configuredEmailTransport().send({
        deliveryId: "delivery-1",
        destination: "owner@example.test",
        subject: "New quote",
        text: "Body",
      }),
    ).rejects.toThrow("Production email transport is not configured");
  });

  it("never lets analytics sink failure block submission", async () => {
    const sink = vi.fn().mockRejectedValue(new Error("analytics down"));
    await expect(
      emitAnalyticsHook(
        {
          name: "quote_submitted",
          businessId: "business-1",
          occurredAt: new Date(),
        },
        sink,
      ),
    ).resolves.toBeUndefined();
    expect(sink).toHaveBeenCalledOnce();
  });
});
