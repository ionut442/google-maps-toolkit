import { describe, expect, it } from "vitest";
import { promotionsConfigSchema, promotionIsExpired } from "@/lib/promotions";
import { servicesConfigSchema } from "@/lib/services";
import {
  defaultWorkHoursConfig,
  workHoursConfigSchema,
} from "@/lib/work-hours";

describe("structured customer tools", () => {
  it("validates service categories without pricing fields", () => {
    const config = servicesConfigSchema.parse({
      label: "What we do",
      categories: [
        {
          id: "repairs",
          name: "Repairs",
          items: [
            {
              id: "leaks",
              name: "Leak repair",
              description: "Indoor and outdoor leaks",
            },
          ],
        },
      ],
    });
    expect(config.categories[0].items[0]).not.toHaveProperty("price");
    expect(() =>
      servicesConfigSchema.parse({
        ...config,
        categories: [config.categories[0], config.categories[0]],
      }),
    ).toThrow();
  });

  it("requires a complete, non-overlapping weekly schedule", () => {
    expect(
      workHoursConfigSchema.parse(defaultWorkHoursConfig).days,
    ).toHaveLength(7);
    expect(() =>
      workHoursConfigSchema.parse({
        ...defaultWorkHoursConfig,
        days: defaultWorkHoursConfig.days.map((day, index) =>
          index === 0
            ? {
                day: day.day,
                status: "OPEN",
                opensAt: "17:00",
                closesAt: "09:00",
              }
            : day,
        ),
      }),
    ).toThrow();
  });

  it("uses date-only expiry so an offer remains visible through its valid-until date", () => {
    expect(promotionIsExpired("2026-09-10", "2026-09-10")).toBe(false);
    expect(promotionIsExpired("2026-09-09", "2026-09-10")).toBe(true);
    const parsed = promotionsConfigSchema.parse({
      label: "Offers",
      offers: [
        {
          id: "autumn_offer",
          title: "Autumn offer",
          validUntil: "2026-09-30",
        },
      ],
    });
    expect(parsed.offers).toHaveLength(1);
    expect(parsed.offers[0].requestMethod).toBe("PHONE");
  });

  it("preserves each supported promotion request method", () => {
    for (const requestMethod of ["PHONE", "WHATSAPP", "EMAIL"] as const) {
      const parsed = promotionsConfigSchema.parse({
        label: "Offers",
        offers: [
          { id: requestMethod.toLowerCase(), title: "Offer", requestMethod },
        ],
      });
      expect(parsed.offers[0].requestMethod).toBe(requestMethod);
    }
  });
});
