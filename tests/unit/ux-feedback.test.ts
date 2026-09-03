import { describe, expect, it } from "vitest";
import { industrySchema, profileSchema } from "@/lib/validation";
import { pricingConfigSchema } from "@/lib/pricing";
import { serviceAreaConfigSchema } from "@/lib/service-area";
import { synchronizedWhatsapp } from "@/lib/profile-behavior";

describe("private-beta UX data contracts", () => {
  it("requires a useful label for Other businesses", () => {
    expect(industrySchema.safeParse({ industry: "OTHER" }).success).toBe(false);
    expect(
      industrySchema.parse({
        industry: "OTHER",
        customIndustryLabel: "Dog groomer",
      }),
    ).toEqual({ industry: "OTHER", customIndustryLabel: "Dog groomer" });
  });

  it("keeps WhatsApp synced until an owner overrides it", () => {
    expect(synchronizedWhatsapp("0712345678", "", true)).toBe("0712345678");
    expect(synchronizedWhatsapp("0799999999", "0700000000", false)).toBe(
      "0700000000",
    );
    expect(synchronizedWhatsapp("0799999999", "0700000000", true)).toBe(
      "0799999999",
    );
  });

  it("accepts HEX only and guided Google destinations", () => {
    const base = {
      name: "Test Co",
      description: "A useful description",
      phone: "0712345678",
      whatsapp: "0712345678",
      email: "owner@example.test",
      website: "",
      logoUrl: "",
      googleReviewUrl: "",
      googleBusinessName: "Test Co",
      googleMapsUrl:
        "https://www.google.com/maps/search/?api=1&query=Test%20Co",
    };
    expect(
      profileSchema.safeParse({ ...base, brandColor: "#2F6FED" }).success,
    ).toBe(true);
    expect(
      profileSchema.safeParse({ ...base, brandColor: "rgb(47, 111, 237)" })
        .success,
    ).toBe(false);
  });

  it("supports hourly, categorized, and legacy price lists", () => {
    const hourly = pricingConfigSchema.parse({
      mode: "HOURLY",
      label: "Hourly rate",
      currency: "GBP",
      amountMinor: 8000,
    });
    expect(hourly.mode === "HOURLY" && hourly.amountMinor).toBe(8000);
    const categorized = pricingConfigSchema.parse({
      mode: "PRICE_LIST",
      label: "Prices",
      currency: "USD",
      categories: [
        {
          id: "drain_work",
          name: "Drain cleaning",
          items: [
            {
              id: "unblock_sink",
              name: "Unblock sink",
              amountMinor: 10000,
              pricePrefix: "FIXED",
            },
          ],
        },
      ],
    });
    expect(
      categorized.mode === "PRICE_LIST" && categorized.categories[0].items,
    ).toHaveLength(1);
    const legacy = pricingConfigSchema.parse({
      mode: "PRICE_LIST",
      label: "Prices",
      currency: "USD",
      items: [
        {
          id: "old_price",
          name: "Legacy price",
          amountMinor: 1000,
          pricePrefix: "FROM",
        },
      ],
    });
    expect(legacy.mode === "PRICE_LIST" && legacy.categories[0].name).toBe(
      "Services",
    );
  });

  it("requires confirmed coordinates and validates postal input", () => {
    const valid = {
      label: "Areas",
      areas: [
        {
          id: "area_manchester",
          name: "Manchester, United Kingdom",
          latitude: 53.48,
          longitude: -2.24,
          countryCode: "GB",
          source: "PHOTON",
          sourceId: "123",
        },
      ],
      postalCodes: [
        { id: "postal_m1", display: "M1 1AE", normalized: "M11AE" },
      ],
    };
    expect(serviceAreaConfigSchema.safeParse(valid).success).toBe(true);
    expect(
      serviceAreaConfigSchema.safeParse({
        ...valid,
        postalCodes: [
          { id: "postal_bad", display: "M1 @@@", normalized: "M1@@@" },
        ],
      }).success,
    ).toBe(false);
  });
});
