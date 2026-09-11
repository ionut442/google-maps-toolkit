import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ContactActionEditor } from "@/components/contact-action-editor";
import { QuoteEditor } from "@/components/quote-editor";
import { ToolStatusSwitch } from "@/components/tool-status-switch";
import type { QuoteModuleConfig } from "@/lib/quote-config";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions", () => ({
  updateContactActionConfigAction: vi.fn(),
  addQuoteFieldAction: vi.fn(),
  deleteQuoteFieldAction: vi.fn(),
  moveQuoteFieldAction: vi.fn(),
  saveQuoteAction: vi.fn(),
  updateQuoteFieldAction: vi.fn(),
  updateQuoteFormMetaAction: vi.fn(),
  toggleModuleAction: vi.fn(),
}));

const quote: QuoteModuleConfig = {
  label: "Tell us about your job",
  intro: "We will call you back.",
  fields: [
    {
      id: "private_phone_key",
      type: "CONTACT",
      contactKind: "PHONE",
      label: "Your phone number",
      required: true,
    },
    {
      id: "private_rooms_key",
      type: "NUMBER",
      label: "How many rooms?",
      required: false,
      min: 1,
      max: 12,
      step: 1,
    },
    {
      id: "private_photo_key",
      type: "PHOTO",
      label: "A photo of the job",
      required: false,
    },
  ],
};

describe("purpose-built editor presentation", () => {
  it("presents collapsed questions and keeps numeric limits inside more options", () => {
    const html = renderToStaticMarkup(
      createElement(QuoteEditor, { businessId: "business", config: quote }),
    );
    expect(html.match(/class="question-editor-card"/g)).toHaveLength(3);
    expect(html).not.toMatch(/class="question-editor-card"[^>]*open/);
    expect(html).toContain("Customer form preview");
    expect(html).toContain("Save quote form");
    expect(html).toContain('class="quote-field-label"');
    expect(html).toContain('aria-label="Preview only, answers are not sent"');
    expect(html).toMatch(
      /<details class="advanced-options"><summary>More options<\/summary>[\s\S]*name="min"/,
    );
    expect(html).not.toContain('name="type" value="PHOTO"');
    const visibleText = html.replace(/<[^>]*>/g, " ");
    expect(visibleText).not.toMatch(
      /private_phone_key|private_rooms_key|Configure|Add field/,
    );
    expect(visibleText).toContain(
      "Keep at least one contact question required",
    );
  });

  it("keeps contact values and button contracts while separating the channels", () => {
    const html = renderToStaticMarkup(
      createElement(ContactActionEditor, {
        businessId: "business",
        phone: "+40 700 123 456",
        whatsapp: "+40 700 123 456",
        config: {
          callLabel: "Call us",
          whatsappLabel: "Message us",
          emergencyLabel: "Emergency call",
          emergencyEnabled: true,
          whatsappMessage: "Please send a quote.",
        },
      }),
    );
    expect(html).toContain("Using your business phone");
    expect(html).toContain("WhatsApp starter message");
    expect(html).toContain("Please send a quote.");
    for (const name of [
      "businessId",
      "callLabel",
      "whatsappLabel",
      "emergencyLabel",
      "whatsappMessage",
      "emergencyEnabled",
    ])
      expect(html).toContain(`name="${name}"`);
    expect(html).toMatch(
      /<details class="advanced-options"><summary>Button text<\/summary>/,
    );
  });

  it("names the accessible switch and preserves its existing form identifiers", () => {
    const html = renderToStaticMarkup(
      createElement(ToolStatusSwitch, {
        businessId: "business",
        moduleId: "module",
        type: "PRICING",
        enabled: true,
      }),
    );
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain('aria-label="Pricing on your customer page"');
    expect(html).toContain('name="moduleId" value="module"');
  });
});
