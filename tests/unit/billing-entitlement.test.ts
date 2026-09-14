import { describe, expect, it } from "vitest";
import {
  billingStatusLabel,
  hasBillingAccess,
} from "@/lib/billing-entitlement";
import {
  createCheckoutSignature,
  paddleConfigurationIssues,
  verifyCheckoutSignature,
} from "@/lib/paddle-config";
import { canPublishWithBilling } from "@/lib/publication-entitlement";

const readyBusiness = {
  phone: "+40700111222",
  description: "Ready local business",
};
const readyModules = [
  {
    type: "CALL_WHATSAPP",
    enabled: true,
    customizedAt: new Date("2026-09-14T10:00:00Z"),
  },
];

describe("per-business billing entitlement", () => {
  it.each(["trialing", "active", "past_due"])(
    "treats %s as entitled",
    (status) => expect(hasBillingAccess(status)).toBe(true),
  );

  it.each(["paused", "canceled", null, "unknown"])(
    "treats %s as not entitled",
    (status) => expect(hasBillingAccess(status)).toBe(false),
  );

  it("blocks publication without billing and permits a ready trial", () => {
    expect(canPublishWithBilling(null, readyBusiness, readyModules)).toBe(
      false,
    );
    expect(canPublishWithBilling("trialing", readyBusiness, readyModules)).toBe(
      true,
    );
    expect(
      canPublishWithBilling(
        "trialing",
        { ...readyBusiness, phone: "" },
        readyModules,
      ),
    ).toBe(false);
  });

  it("keeps owner-facing status labels centralized", () => {
    expect(billingStatusLabel("past_due")).toBe("Past due");
    expect(billingStatusLabel(null)).toBe("Not started");
  });
});

describe("Paddle environment separation", () => {
  const sandbox = {
    PADDLE_API_KEY: "pdl_sdbx_apikey_test-only",
    PADDLE_WEBHOOK_SECRET: "pdl_ntfset_test-only",
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: "test_client-token",
    NEXT_PUBLIC_PADDLE_PRICE_ID: "pri_localaction-monthly",
    NEXT_PUBLIC_PADDLE_ENVIRONMENT: "sandbox",
  };

  it("accepts a consistent sandbox configuration and signs a business", () => {
    expect(paddleConfigurationIssues(sandbox)).toEqual([]);
    const signature = createCheckoutSignature("business-a", sandbox);
    expect(verifyCheckoutSignature("business-a", signature, sandbox)).toBe(
      true,
    );
    expect(verifyCheckoutSignature("business-b", signature, sandbox)).toBe(
      false,
    );
  });

  it("rejects mixed sandbox and live credentials", () => {
    expect(
      paddleConfigurationIssues({
        ...sandbox,
        NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: "live_wrong-environment",
      }),
    ).toContain(
      "NEXT_PUBLIC_PADDLE_CLIENT_TOKEN must be a sandbox token in sandbox mode",
    );
  });
});
