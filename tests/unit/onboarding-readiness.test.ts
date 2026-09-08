import { describe, expect, it } from "vitest";
import {
  allEnabledToolsReady,
  onboardingToolReady,
} from "@/lib/onboarding-readiness";

describe("onboarding tool readiness", () => {
  const makeModule = (type: string, customizedAt: Date | null = null) => ({
    type,
    enabled: true,
    customizedAt,
  });

  it("keeps selected configurable tools pending until they are saved", () => {
    expect(onboardingToolReady(makeModule("FAQ"), { phone: "+401234" })).toBe(
      false,
    );
    expect(
      onboardingToolReady(makeModule("FAQ", new Date()), {
        phone: "+401234",
      }),
    ).toBe(true);
  });

  it("makes contact and save-contact ready from a saved phone number", () => {
    expect(
      onboardingToolReady(makeModule("CALL_WHATSAPP"), { phone: "+401234" }),
    ).toBe(true);
    expect(onboardingToolReady(makeModule("SAVE_CONTACT"), { phone: "" })).toBe(
      false,
    );
  });

  it("requires every enabled tool to be ready", () => {
    expect(
      allEnabledToolsReady([makeModule("CALL_WHATSAPP"), makeModule("FAQ")], {
        phone: "+401234",
      }),
    ).toBe(false);
  });
});
