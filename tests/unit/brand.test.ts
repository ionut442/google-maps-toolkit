import { describe, expect, it } from "vitest";
import { accessibleBrandColor, DEFAULT_BRAND_COLOR } from "@/lib/brand";

describe("accessible public brand colors", () => {
  it("falls back for malformed values", () => {
    expect(accessibleBrandColor("red").background).toBe(DEFAULT_BRAND_COLOR);
    expect(accessibleBrandColor("#12345g").background).toBe(
      DEFAULT_BRAND_COLOR,
    );
  });

  it("uses dark text and a visible border on very light colors", () => {
    expect(accessibleBrandColor("#ffffff")).toMatchObject({
      background: "#ffffff",
      foreground: "#111827",
      border: "#667085",
    });
  });

  it("uses light text on dark colors and normalizes case", () => {
    expect(accessibleBrandColor(" #0000AA ")).toMatchObject({
      background: "#0000aa",
      foreground: "#ffffff",
    });
  });
});
