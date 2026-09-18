import { describe, expect, it } from "vitest";
import {
  calculateEstimate,
  currencies,
  currencyLabels,
  parseMajorAmount,
  pricingConfigSchema,
} from "@/lib/pricing";
import {
  normalizeArea,
  normalizePostalCode,
  postcodeIsServed,
  serviceAreaConfigSchema,
} from "@/lib/service-area";
import { trustConfigSchema, trustEntryState } from "@/lib/trust";

describe("Goal 4 strict business tools", () => {
  it("offers the supported customer-facing currencies", () => {
    expect(currencies).toEqual(["USD", "EUR", "GBP", "SGD", "CAD", "AUD"]);
    expect(currencies).not.toContain("RON");
    expect(currencyLabels.SGD).toBe("Singapore dollar");
    expect(currencyLabels.CAD).toBe("Canadian dollar");
    expect(currencyLabels.AUD).toBe("Australian dollar");
  });

  const estimate = pricingConfigSchema.parse({
    mode: "SIMPLE_ESTIMATE",
    label: "Estimate",
    currency: "RON",
    base: { label: "Visit", amountMinor: 10000 },
    addOns: [{ id: "urgent", label: "Urgent", amountMinor: 5000 }],
    quantity: {
      id: "rooms",
      label: "Rooms",
      unitLabel: "room",
      unitAmountMinor: 2000,
      min: 0,
      max: 5,
      step: 1,
    },
  });
  it("validates both modes and calculates all controlled combinations", () => {
    if (estimate.mode !== "SIMPLE_ESTIMATE") throw new Error("wrong fixture");
    expect(
      calculateEstimate(estimate, { addOnIds: [], quantity: 0 }).totalMinor,
    ).toBe(10000);
    expect(
      calculateEstimate(estimate, { addOnIds: ["urgent"], quantity: 0 })
        .totalMinor,
    ).toBe(15000);
    expect(
      calculateEstimate(estimate, { addOnIds: [], quantity: 3 }).totalMinor,
    ).toBe(16000);
    expect(
      calculateEstimate(estimate, { addOnIds: ["urgent"], quantity: 3 })
        .totalMinor,
    ).toBe(21000);
    expect(
      calculateEstimate(estimate, { addOnIds: [], quantity: 5 }).totalMinor,
    ).toBe(20000);
    expect(() =>
      calculateEstimate(estimate, { addOnIds: ["missing"], quantity: 3 }),
    ).toThrow();
    expect(() =>
      calculateEstimate(estimate, { addOnIds: [], quantity: 6 }),
    ).toThrow();
    expect(parseMajorAmount("12.34")).toBe(1234);
    expect(() => parseMajorAmount("12.345")).toThrow();
    expect(
      pricingConfigSchema.safeParse({
        mode: "PRICE_LIST",
        label: "Prices",
        currency: "RON",
        items: [
          {
            id: "visit",
            name: "Visit",
            amountMinor: 1000,
            pricePrefix: "FROM",
          },
        ],
      }).success,
    ).toBe(true);
    expect(
      pricingConfigSchema.safeParse({
        mode: "PRICE_LIST",
        label: "Prices",
        currency: "RON",
        items: [
          { id: "visit", name: "Bad", amountMinor: -1, pricePrefix: "FROM" },
        ],
      }).success,
    ).toBe(false);
    expect(
      pricingConfigSchema.safeParse({
        mode: "SIMPLE_ESTIMATE",
        label: "Bad",
        currency: "RON",
        base: { label: "Base", amountMinor: 0 },
        addOns: [],
        formula: "base * 7",
      }).success,
    ).toBe(false);
    expect(
      pricingConfigSchema.safeParse({
        mode: "PRICE_LIST",
        label: "Duplicate",
        currency: "RON",
        items: [
          { id: "same", name: "One", amountMinor: 1, pricePrefix: "FROM" },
          { id: "same", name: "Two", amountMinor: 2, pricePrefix: "FROM" },
        ],
      }).success,
    ).toBe(false);
  });
  it("normalizes and checks exact service areas deterministically", () => {
    const config = serviceAreaConfigSchema.parse({
      label: "Area",
      areas: [{ id: "area_one", name: "North  Town" }],
      postalCodes: [
        { id: "postcode_one", display: "AB 1-2CD", normalized: "AB12CD" },
      ],
    });
    expect(normalizeArea(" North   Town ")).toBe("North Town");
    expect(normalizePostalCode("ab 1-2cd")).toBe("AB12CD");
    expect(postcodeIsServed(config, "ab1 2cd")).toBe(true);
    expect(postcodeIsServed(config, "ZZ99")).toBe(false);
    expect(
      serviceAreaConfigSchema.safeParse({
        label: "Empty",
        areas: [],
        postalCodes: [],
      }).success,
    ).toBe(true);
    expect(
      serviceAreaConfigSchema.safeParse({
        label: "Area",
        areas: [],
        postalCodes: [
          { id: "postcode_one", display: "AB 1", normalized: "wrong" },
        ],
      }).success,
    ).toBe(false);
    expect(
      serviceAreaConfigSchema.safeParse({
        label: "Area",
        areas: [],
        postalCodes: Array.from({ length: 21 }, (_, index) => ({
          id: `postcode_${index}`,
          display: String(index),
          normalized: String(index),
        })),
      }).success,
    ).toBe(false);
  });
  it("validates credential dates, IDs, and lifecycle states", () => {
    expect(
      trustConfigSchema.safeParse({
        label: "Trust",
        entries: [{ id: "license", name: "License", expiresOn: "2026-02-30" }],
      }).success,
    ).toBe(false);
    expect(
      trustEntryState("2026-01-01", new Date("2026-08-27T00:00:00Z")),
    ).toBe("EXPIRED");
    expect(
      trustEntryState("2026-09-05", new Date("2026-08-27T00:00:00Z")),
    ).toBe("EXPIRING");
    expect(
      trustEntryState("2027-09-05", new Date("2026-08-27T00:00:00Z")),
    ).toBe("ACTIVE");
    expect(
      trustConfigSchema.safeParse({
        label: "Trust",
        entries: [
          { id: "same", name: "One" },
          { id: "same", name: "Two" },
        ],
      }).success,
    ).toBe(false);
  });
});
