import { describe, expect, it } from "vitest";
import {
  createQuoteField,
  quoteFieldSchema,
  quoteFieldTypes,
  quoteModuleConfigSchema,
} from "@/lib/quote-config";
import { getTemplate } from "@/lib/templates";
import { parseModuleConfig } from "@/lib/domain";
import { editableQuoteField } from "@/lib/quote-config-service";

function quoteConfig(industry: string) {
  const quoteModule = getTemplate(industry).modules.find(
    (item) => item.type === "QUOTE_REQUEST",
  )!;
  return parseModuleConfig("QUOTE_REQUEST", quoteModule.config);
}

describe("constrained quote configuration", () => {
  it("creates every supported field type from controlled defaults", () => {
    for (const [index, type] of quoteFieldTypes.entries()) {
      expect(
        quoteFieldSchema.safeParse(createQuoteField(type, `field_${index}`))
          .success,
      ).toBe(true);
    }
  });

  it("provides strong Plumbing and Pressure Washing defaults", () => {
    const plumbing = quoteConfig("PLUMBING");
    expect(plumbing.fields.map((field) => field.id)).toEqual(
      expect.arrayContaining([
        "issue_type",
        "urgency",
        "property_postcode",
        "job_photos",
        "customer_phone",
      ]),
    );
    const washing = quoteConfig("PRESSURE_WASHING");
    const surface = washing.fields.find((field) => field.id === "surface_type");
    expect(surface).toMatchObject({
      type: "DROPDOWN",
      choices: ["Driveway", "Patio", "House", "Roof", "Other"],
    });
  });

  it("provides concise HVAC and Cleaning forms", () => {
    expect(quoteConfig("HVAC").fields.length).toBeLessThanOrEqual(10);
    expect(quoteConfig("CLEANING").fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "cleaning_type" }),
        expect.objectContaining({ id: "frequency" }),
      ]),
    );
  });

  it("rejects duplicate IDs, multiple photo fields, and no required contact", () => {
    const config = quoteConfig("PLUMBING");
    expect(
      quoteModuleConfigSchema.safeParse({
        ...config,
        fields: [
          config.fields[0],
          { ...config.fields[1], id: config.fields[0].id },
        ],
      }).success,
    ).toBe(false);
    const photo = config.fields.find((field) => field.type === "PHOTO")!;
    expect(
      quoteModuleConfigSchema.safeParse({
        ...config,
        fields: [...config.fields, { ...photo, id: "another_photo" }],
      }).success,
    ).toBe(false);
    expect(
      quoteModuleConfigSchema.safeParse({
        ...config,
        fields: config.fields.filter((field) => field.type !== "CONTACT"),
      }).success,
    ).toBe(false);
  });

  it("rejects arbitrary configuration and invalid choices", () => {
    const config = quoteConfig("PLUMBING");
    expect(
      quoteModuleConfigSchema.safeParse({ ...config, customHtml: "<b>bad</b>" })
        .success,
    ).toBe(false);
    expect(
      quoteFieldSchema.safeParse({
        id: "choice",
        type: "DROPDOWN",
        label: "Choice",
        required: true,
        choices: ["Same", "same"],
      }).success,
    ).toBe(false);
  });

  it("applies only supported owner edits", () => {
    const current = quoteConfig("PRESSURE_WASHING").fields.find(
      (field) => field.type === "DROPDOWN",
    )!;
    expect(
      editableQuoteField({
        current,
        label: "Updated surface",
        helperText: "Choose one.",
        required: false,
        choices: ["Wall", "Patio"],
      }),
    ).toMatchObject({
      id: current.id,
      type: "DROPDOWN",
      label: "Updated surface",
      choices: ["Wall", "Patio"],
      required: false,
    });
  });
});
