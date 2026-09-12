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

  it("keeps contact pending until explicitly saved and derives save-contact from the phone", () => {
    expect(
      onboardingToolReady(makeModule("CALL_WHATSAPP"), { phone: "+401234" }),
    ).toBe(false);
    expect(
      onboardingToolReady(makeModule("CALL_WHATSAPP", new Date()), {
        phone: "+401234",
      }),
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

  it("requires a saved Review tool and a direct review destination", () => {
    const direct =
      "https://search.google.com/local/writereview?placeid=ChIJExamplePlaceIdentifier12345";
    expect(
      onboardingToolReady(makeModule("REVIEW", new Date()), {
        phone: "+401234",
        googleReviewUrl: null,
      }),
    ).toBe(false);
    expect(
      onboardingToolReady(makeModule("REVIEW"), {
        phone: "+401234",
        googleReviewUrl: direct,
      }),
    ).toBe(false);
    expect(
      onboardingToolReady(makeModule("REVIEW", new Date()), {
        phone: "+401234",
        googleReviewUrl: direct,
      }),
    ).toBe(true);
  });
});
