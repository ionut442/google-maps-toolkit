import { z } from "zod";
import type { QuoteField, QuoteModuleConfig } from "./quote-config";

export const MAX_QUOTE_PHOTOS = 3;
export const MAX_QUOTE_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_QUOTE_REQUEST_BYTES = 16 * 1024 * 1024;
export const MAX_QUOTE_ANSWER_CHARS = 20_000;

export type QuoteAnswer = {
  fieldId: string;
  label: string;
  type: QuoteField["type"];
  value: string | number | boolean | string[];
};

export type ValidatedQuoteSubmission = {
  submissionKey: string;
  answers: QuoteAnswer[];
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  files: File[];
};

export type QuoteValidationResult =
  | { success: true; data: ValidatedQuoteSubmission }
  | { success: false; message: string; fieldErrors: Record<string, string> };

const submissionKeySchema = z.string().uuid();

function singleValue(formData: FormData, name: string) {
  const values = formData.getAll(name);
  return values.length === 1 && typeof values[0] === "string"
    ? values[0].trim()
    : null;
}

function phoneIsValid(value: string) {
  return (
    /^[+()\d.\-\s]+$/.test(value) &&
    value.replace(/\D/g, "").length >= 7 &&
    value.replace(/\D/g, "").length <= 15
  );
}

function emailIsValid(value: string) {
  return z.string().email().safeParse(value).success && !/[\r\n]/.test(value);
}

function validateScalarField(
  field: Exclude<QuoteField, { type: "PHOTO" | "MULTIPLE_CHOICE" }>,
  raw: string | null,
) {
  if (!raw) return field.required ? "This field is required." : null;
  switch (field.type) {
    case "TEXT":
      if (raw.length < (field.minLength ?? 0))
        return `Enter at least ${field.minLength} characters.`;
      if (raw.length > field.maxLength)
        return `Enter no more than ${field.maxLength} characters.`;
      return null;
    case "NUMBER": {
      const value = Number(raw);
      if (!Number.isFinite(value)) return "Enter a valid number.";
      if (field.min !== undefined && value < field.min)
        return `Enter ${field.min} or more.`;
      if (field.max !== undefined && value > field.max)
        return `Enter ${field.max} or less.`;
      return null;
    }
    case "DROPDOWN":
      return field.choices.includes(raw) ? null : "Choose an available option.";
    case "CHECKBOX":
      return raw === "true" ? null : "Use the checkbox value shown.";
    case "ADDRESS":
      if (raw.length < 2 || raw.length > field.maxLength)
        return `Enter between 2 and ${field.maxLength} characters.`;
      return null;
    case "CONTACT":
      if (field.contactKind === "NAME" && raw.length > 120)
        return "Enter no more than 120 characters.";
      if (field.contactKind === "PHONE" && !phoneIsValid(raw))
        return "Enter a valid phone number.";
      if (field.contactKind === "EMAIL" && !emailIsValid(raw))
        return "Enter a valid email address.";
      return null;
  }
}

export function quoteHoneypotTriggered(formData: FormData) {
  return formData
    .getAll("website")
    .some((value) => String(value).trim().length > 0);
}

export function quoteFormDataBytes(formData: FormData) {
  const encoder = new TextEncoder();
  let bytes = 0;
  for (const [key, value] of formData.entries()) {
    bytes += encoder.encode(key).byteLength;
    bytes +=
      typeof value === "string" ? encoder.encode(value).byteLength : value.size;
  }
  return bytes;
}

export function validateQuoteSubmission(
  config: QuoteModuleConfig,
  formData: FormData,
): QuoteValidationResult {
  const submissionKey = String(formData.get("submissionKey") ?? "");
  if (!submissionKeySchema.safeParse(submissionKey).success)
    return {
      success: false,
      message: "Refresh the page and try again.",
      fieldErrors: {},
    };

  const allowedKeys = new Set(["submissionKey", "website", "photos"]);
  config.fields.forEach((field) => {
    if (field.type !== "PHOTO") allowedKeys.add(`field:${field.id}`);
  });
  for (const key of formData.keys()) {
    if (!allowedKeys.has(key))
      return {
        success: false,
        message: "Unexpected form data was submitted.",
        fieldErrors: {},
      };
  }

  const rawPhotos = formData.getAll("photos");
  const files = rawPhotos.filter(
    (value): value is File => value instanceof File && value.size > 0,
  );
  const photoField = config.fields.find((field) => field.type === "PHOTO");
  const fieldErrors: Record<string, string> = {};
  if (rawPhotos.some((value) => !(value instanceof File)))
    fieldErrors.photos = "Choose photos using the file control.";
  if (!photoField && files.length)
    fieldErrors.photos = "Photos are not enabled for this form.";
  if (photoField?.required && !files.length)
    fieldErrors[photoField.id] = "Add at least one photo.";
  if (files.length > MAX_QUOTE_PHOTOS)
    fieldErrors[photoField?.id ?? "photos"] =
      `Add no more than ${MAX_QUOTE_PHOTOS} photos.`;

  const answers: QuoteAnswer[] = [];
  let customerName: string | null = null;
  let customerPhone: string | null = null;
  let customerEmail: string | null = null;
  let totalChars = 0;

  for (const field of config.fields) {
    if (field.type === "PHOTO") continue;
    const key = `field:${field.id}`;
    if (field.type === "MULTIPLE_CHOICE") {
      const values = formData
        .getAll(key)
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim());
      const unique = [...new Set(values)];
      if (field.required && !unique.length)
        fieldErrors[field.id] = "Choose at least one option.";
      else if (
        unique.length !== values.length ||
        unique.some((value) => !field.choices.includes(value))
      )
        fieldErrors[field.id] = "Choose only available options.";
      else if (field.maxSelections && unique.length > field.maxSelections)
        fieldErrors[field.id] =
          `Choose no more than ${field.maxSelections} options.`;
      if (unique.length) {
        totalChars += unique.join("").length;
        answers.push({
          fieldId: field.id,
          label: field.label,
          type: field.type,
          value: unique,
        });
      }
      continue;
    }
    if (formData.getAll(key).length > 1) {
      fieldErrors[field.id] = "Submit one value for this field.";
      continue;
    }
    const raw = singleValue(formData, key);
    const error = validateScalarField(field, raw);
    if (error) fieldErrors[field.id] = error;
    if (!raw) continue;
    totalChars += raw.length;
    const value =
      field.type === "NUMBER"
        ? Number(raw)
        : field.type === "CHECKBOX"
          ? true
          : raw;
    answers.push({
      fieldId: field.id,
      label: field.label,
      type: field.type,
      value,
    });
    if (field.type === "CONTACT") {
      if (field.contactKind === "NAME") customerName = raw;
      if (field.contactKind === "PHONE") customerPhone = raw;
      if (field.contactKind === "EMAIL") customerEmail = raw.toLowerCase();
    }
  }

  if (totalChars > MAX_QUOTE_ANSWER_CHARS)
    return {
      success: false,
      message: "The submitted answers are too large.",
      fieldErrors: {},
    };
  if (Object.keys(fieldErrors).length)
    return {
      success: false,
      message: "Check the highlighted fields.",
      fieldErrors,
    };
  return {
    success: true,
    data: {
      submissionKey,
      answers,
      customerName,
      customerPhone,
      customerEmail,
      files,
    },
  };
}
