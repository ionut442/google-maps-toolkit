import { z } from "zod";

export const quoteFieldTypes = [
  "TEXT",
  "NUMBER",
  "DROPDOWN",
  "MULTIPLE_CHOICE",
  "CHECKBOX",
  "ADDRESS",
  "CONTACT",
  "PHOTO",
] as const;
export type QuoteFieldType = (typeof quoteFieldTypes)[number];

const idSchema = z.string().regex(/^[a-z][a-z0-9_]{1,39}$/);
const labelSchema = z.string().trim().min(1).max(100);
const helperSchema = z.string().trim().max(160).optional();
const baseShape = {
  id: idSchema,
  label: labelSchema,
  required: z.boolean(),
  helperText: helperSchema,
};

const textFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("TEXT"),
    multiline: z.boolean().default(false),
    minLength: z.number().int().min(0).max(500).optional(),
    maxLength: z.number().int().min(1).max(2000).default(500),
  })
  .strict()
  .refine(
    (field) => (field.minLength ?? 0) <= field.maxLength,
    "Minimum length cannot exceed maximum length",
  );

const numberFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("NUMBER"),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    step: z.number().positive().max(1_000_000).default(1),
  })
  .strict()
  .refine(
    (field) =>
      field.min === undefined ||
      field.max === undefined ||
      field.min <= field.max,
    "Minimum number cannot exceed maximum number",
  );

const choicesSchema = z
  .array(z.string().trim().min(1).max(80))
  .min(2)
  .max(12)
  .refine(
    (choices) =>
      new Set(choices.map((choice) => choice.toLowerCase())).size ===
      choices.length,
    "Choices must be unique",
  );

const dropdownFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("DROPDOWN"),
    choices: choicesSchema,
  })
  .strict();

const multipleChoiceFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("MULTIPLE_CHOICE"),
    choices: choicesSchema,
    maxSelections: z.number().int().min(1).max(12).optional(),
  })
  .strict()
  .refine(
    (field) =>
      field.maxSelections === undefined ||
      field.maxSelections <= field.choices.length,
    "Selection limit cannot exceed choice count",
  );

const checkboxFieldSchema = z
  .object({ ...baseShape, type: z.literal("CHECKBOX") })
  .strict();

const addressFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("ADDRESS"),
    maxLength: z.number().int().min(20).max(300).default(160),
  })
  .strict();

export const contactKinds = ["NAME", "PHONE", "EMAIL"] as const;
const contactFieldSchema = z
  .object({
    ...baseShape,
    type: z.literal("CONTACT"),
    contactKind: z.enum(contactKinds),
  })
  .strict();

const photoFieldSchema = z
  .object({ ...baseShape, type: z.literal("PHOTO") })
  .strict();

export const quoteFieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  dropdownFieldSchema,
  multipleChoiceFieldSchema,
  checkboxFieldSchema,
  addressFieldSchema,
  contactFieldSchema,
  photoFieldSchema,
]);
export type QuoteField = z.infer<typeof quoteFieldSchema>;

export const quoteModuleConfigSchema = z
  .object({
    label: z.string().trim().min(1).max(60),
    intro: z.string().trim().max(240).optional(),
    fields: z.array(quoteFieldSchema).min(1).max(16),
  })
  .strict()
  .superRefine((config, context) => {
    const ids = new Set<string>();
    let photoCount = 0;
    let contactCount = 0;
    let requiredContactCount = 0;
    config.fields.forEach((field, index) => {
      if (ids.has(field.id)) {
        context.addIssue({
          code: "custom",
          message: "Field IDs must be unique",
          path: ["fields", index, "id"],
        });
      }
      ids.add(field.id);
      if (field.type === "PHOTO") photoCount += 1;
      if (field.type === "CONTACT") {
        contactCount += 1;
        if (field.required) requiredContactCount += 1;
      }
    });
    if (photoCount > 1)
      context.addIssue({
        code: "custom",
        message: "Only one photo field is supported",
      });
    if (!contactCount || !requiredContactCount)
      context.addIssue({
        code: "custom",
        message: "At least one contact field must be required",
      });
  });

export type QuoteModuleConfig = z.infer<typeof quoteModuleConfigSchema>;

export function createQuoteField(type: QuoteFieldType, id: string): QuoteField {
  const shared = { id, required: false, helperText: "" };
  switch (type) {
    case "TEXT":
      return {
        ...shared,
        type,
        label: "Additional details",
        multiline: true,
        maxLength: 500,
      };
    case "NUMBER":
      return { ...shared, type, label: "Approximate amount", step: 1 };
    case "DROPDOWN":
      return {
        ...shared,
        type,
        label: "Choose one",
        choices: ["Option 1", "Option 2"],
      };
    case "MULTIPLE_CHOICE":
      return {
        ...shared,
        type,
        label: "Choose all that apply",
        choices: ["Option 1", "Option 2"],
      };
    case "CHECKBOX":
      return { ...shared, type, label: "Please confirm" };
    case "ADDRESS":
      return {
        ...shared,
        type,
        label: "Job postcode or address",
        maxLength: 160,
      };
    case "CONTACT":
      return {
        ...shared,
        type,
        label: "Your phone number",
        contactKind: "PHONE",
        required: true,
      };
    case "PHOTO":
      return {
        ...shared,
        type,
        label: "Job photos",
        helperText: "Up to 3 JPG, PNG or WebP photos.",
      };
  }
}
