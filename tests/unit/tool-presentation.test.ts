import { describe, expect, it } from "vitest";
import type { ModuleConfigByType } from "@/lib/domain";
import { toolEditorHref, toolSummary } from "@/lib/tool-presentation";

describe("tool presentation", () => {
  it("summarizes quote questions and photo support", () => {
    const config = {
      label: "Get a quote",
      fields: [
        {
          id: "name",
          type: "CONTACT",
          label: "Name",
          contactKind: "NAME",
          required: true,
        },
        { id: "photo", type: "PHOTO", label: "Photo", required: false },
      ],
    } as ModuleConfigByType["QUOTE_REQUEST"];

    expect(toolSummary("QUOTE_REQUEST", config)).toBe(
      "2 questions · Photos enabled",
    );
  });

  it("creates an encoded dedicated editor route", () => {
    expect(toolEditorHref("module/with spaces")).toBe(
      "/dashboard/tools/module%2Fwith%20spaces",
    );
  });

  it("uses natural singular pricing copy", () => {
    const config = {
      mode: "PRICE_LIST",
      currency: "GBP",
      label: "Prices",
      categories: [
        {
          id: "services",
          name: "Services",
          items: [
            {
              id: "callout",
              name: "Call-out",
              amountMinor: 8000,
              pricePrefix: "FIXED",
              description: "",
            },
          ],
        },
      ],
    } as ModuleConfigByType["PRICING"];

    expect(toolSummary("PRICING", config)).toBe("1 price in 1 category");
  });
});
