import { describe, expect, it } from "vitest";
import { parseModuleConfig } from "@/lib/domain";
import { getTemplate } from "@/lib/templates";
import {
  quoteFormDataBytes,
  quoteHoneypotTriggered,
  validateQuoteSubmission,
} from "@/lib/quote-validation";

const config = parseModuleConfig(
  "QUOTE_REQUEST",
  getTemplate("PLUMBING").modules.find((item) => item.type === "QUOTE_REQUEST")!
    .config,
);

function validForm() {
  const form = new FormData();
  form.set("submissionKey", crypto.randomUUID());
  form.set("website", "");
  form.set("field:issue_type", "Leak");
  form.set("field:urgency", "Normal service");
  form.set("field:property_postcode", "010101");
  form.set("field:issue_description", "Water under the kitchen sink");
  form.set("field:customer_name", "Ana Popescu");
  form.set("field:customer_phone", "+40 700 111 222");
  return form;
}

describe("dynamic quote submission validation", () => {
  it("normalizes a valid configured submission", () => {
    const result = validateQuoteSubmission(config, validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customerName).toBe("Ana Popescu");
      expect(result.data.customerPhone).toBe("+40 700 111 222");
      expect(
        result.data.answers.find((answer) => answer.fieldId === "issue_type"),
      ).toMatchObject({
        label: "What plumbing issue do you have?",
        value: "Leak",
      });
    }
  });

  it("rejects missing required fields while preserving field IDs", () => {
    const form = validForm();
    form.delete("field:property_postcode");
    const result = validateQuoteSubmission(config, form);
    expect(result).toMatchObject({
      success: false,
      fieldErrors: { property_postcode: "This field is required." },
    });
  });

  it("rejects unexpected fields and unsupported choices", () => {
    const unexpected = validForm();
    unexpected.set("admin", "true");
    expect(validateQuoteSubmission(config, unexpected)).toMatchObject({
      success: false,
      message: "Unexpected form data was submitted.",
    });
    const choice = validForm();
    choice.set("field:issue_type", "Injected choice");
    expect(validateQuoteSubmission(config, choice)).toMatchObject({
      success: false,
      fieldErrors: { issue_type: "Choose an available option." },
    });
  });

  it("validates contact structure and text constraints", () => {
    const contact = validForm();
    contact.set("field:customer_phone", "call me");
    expect(validateQuoteSubmission(config, contact)).toMatchObject({
      success: false,
      fieldErrors: { customer_phone: "Enter a valid phone number." },
    });
    const text = validForm();
    text.set("field:issue_description", "x".repeat(801));
    expect(validateQuoteSubmission(config, text)).toMatchObject({
      success: false,
      fieldErrors: { issue_description: "Enter no more than 800 characters." },
    });
  });

  it("rejects invalid submission keys", () => {
    const form = validForm();
    form.set("submissionKey", "replay-me");
    expect(validateQuoteSubmission(config, form)).toMatchObject({
      success: false,
      message: "Refresh the page and try again.",
    });
  });

  it("rejects duplicate scalar and fake photo values", () => {
    const duplicate = validForm();
    duplicate.append("field:property_postcode", "999999");
    expect(validateQuoteSubmission(config, duplicate)).toMatchObject({
      success: false,
      fieldErrors: { property_postcode: "Submit one value for this field." },
    });
    const fakePhoto = validForm();
    fakePhoto.set("photos", "not-a-file");
    expect(validateQuoteSubmission(config, fakePhoto)).toMatchObject({
      success: false,
      fieldErrors: { photos: "Choose photos using the file control." },
    });
  });

  it("checks every honeypot value and measures parsed request bytes", () => {
    const form = validForm();
    form.append("website", "https://spam.example");
    expect(quoteHoneypotTriggered(form)).toBe(true);
    expect(quoteFormDataBytes(form)).toBeGreaterThan(100);
  });
});
