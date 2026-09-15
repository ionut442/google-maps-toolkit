import { describe, expect, it } from "vitest";
import {
  formatPaddleMoney,
  formatTaxRate,
} from "@/lib/paddle-billing-overview";

describe("Paddle billing presentation", () => {
  it("shows plan price, tax, and total as currency amounts", () => {
    expect(formatPaddleMoney("999", "EUR")).toBe("€9.99");
    expect(formatPaddleMoney("250", "EUR")).toBe("€2.50");
    expect(formatPaddleMoney("1249", "EUR")).toBe("€12.49");
  });

  it("formats Paddle decimal tax rates for people", () => {
    expect(formatTaxRate("0.25")).toBe("25%");
    expect(formatTaxRate(null)).toBeNull();
  });
});
