import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { publicModuleRegistry } from "@/components/public/module-renderer";
import type { PublicBusiness, PublicModule } from "@/lib/public-business";

const business = {
  name: "Test Co",
  slug: "test-co",
  modules: [],
} as unknown as PublicBusiness;
function render(module: PublicModule) {
  return renderToStaticMarkup(
    publicModuleRegistry[module.type].render({
      business: { ...business, modules: [module] } as PublicBusiness,
      module,
      primary: {
        type: "QUOTE_REQUEST",
        label: "Get a Quote",
        href: "#quote",
        external: false,
      },
    }) as ReactNode,
  );
}

describe("Goal 4 public rendering", () => {
  it("renders price lists and estimators with non-binding quote paths", () => {
    const list = render({
      type: "PRICING",
      sortOrder: 0,
      config: {
        mode: "PRICE_LIST",
        label: "Prices",
        currency: "RON",
        categories: [
          {
            id: "drain_services",
            name: "Drain services",
            items: [
              {
                id: "drain",
                name: "Drain cleaning",
                amountMinor: 12000,
                pricePrefix: "FROM",
              },
            ],
          },
        ],
      },
    });
    expect(list).toContain("Drain cleaning");
    expect(list).toContain("Request Exact Quote");
    const estimator = render({
      type: "PRICING",
      sortOrder: 0,
      config: {
        mode: "SIMPLE_ESTIMATE",
        label: "Estimate",
        currency: "RON",
        base: { label: "Base", amountMinor: 10000 },
        addOns: [],
        quantity: {
          id: "units",
          label: "Units",
          unitLabel: "unit",
          unitAmountMinor: 100,
          min: 0,
          max: 10,
          step: 1,
        },
      },
    });
    expect(estimator).toContain("Estimated total");
    expect(estimator).toContain("Estimate only");
    expect(estimator).toContain("Get Exact Quote");
  });
  it("omits expired credentials and disclaims verification", () => {
    const html = render({
      type: "TRUST",
      sortOrder: 0,
      config: {
        label: "Trust",
        entries: [
          { id: "expired", name: "Old licence", expiresOn: "2020-01-01" },
          { id: "active", name: "Current insurance" },
        ],
      },
    });
    expect(html).not.toContain("Old licence");
    expect(html).toContain("Current insurance");
    expect(html).toContain("Information provided by this business");
    expect(html).toContain("lucide-shield-check");
    expect(html).not.toContain("public-tool-card");
    expect(html).not.toContain("Verified by Platform");
  });
});
