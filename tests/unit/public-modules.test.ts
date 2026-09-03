import { describe, expect, it } from "vitest";
import { safeParseModuleConfig } from "@/lib/domain";

describe("public module configuration safety", () => {
  it("accepts safe empty optional content", () => {
    expect(
      safeParseModuleConfig("FAQ", { label: "Questions", suggestedFaqs: [] }),
    ).toEqual({ label: "Questions", suggestedFaqs: [] });
    expect(
      safeParseModuleConfig("TRUST", { label: "Trust", entries: [] }),
    ).toEqual({ label: "Trust", entries: [] });
    expect(
      safeParseModuleConfig("SERVICE_AREA", {
        label: "Areas",
        areas: [],
        postalCodes: [],
      }),
    ).toEqual({ label: "Areas", areas: [], postalCodes: [] });
  });

  it("rejects malformed optional entries without throwing", () => {
    expect(
      safeParseModuleConfig("FAQ", {
        label: "Questions",
        suggestedFaqs: [{ question: "Question without an answer" }],
      }),
    ).toBeNull();
    expect(
      safeParseModuleConfig("TRUST", {
        label: "Trust",
        entries: [42],
      }),
    ).toBeNull();
    expect(
      safeParseModuleConfig("SERVICE_AREA", {
        label: "Areas",
        areas: [],
        postalCodes: "not-an-array",
      }),
    ).toBeNull();
  });

  it("rejects arbitrary fields in the closed registry", () => {
    expect(
      safeParseModuleConfig("REVIEW", {
        label: "Reviews",
        customHtml: "<script>alert(1)</script>",
      }),
    ).toBeNull();
  });
});
