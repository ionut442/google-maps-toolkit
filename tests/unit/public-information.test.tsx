import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ContactPage from "@/app/contact/page";
import CookiePolicyPage from "@/app/cookies/page";
import HelpPage from "@/app/help/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";

describe("public Legal, Help, and Contact pages", () => {
  it.each([
    ["Help", HelpPage],
    ["Contact", ContactPage],
    ["Terms", TermsPage],
    ["Privacy", PrivacyPage],
    ["Cookies", CookiePolicyPage],
  ])("renders the %s route in the marketing shell", (_name, Page) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain("marketing-page-shell");
    expect(html).toContain("Local");
    expect(html).toContain("Action");
    expect(html).toContain('href="/help"');
    expect(html).toContain('href="/contact"');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/cookies"');
  });

  it("keeps the homepage product claims and sample content explicit", () => {
    const homepage = readFileSync("src/app/homepage.html", "utf8");
    expect(homepage).toContain("Calls, quotes,");
    expect(homepage).toContain("WhatsApp");
    expect(homepage).toContain("reviews");
    expect(homepage).toContain('<li><a href="/help">Help</a></li>');
    expect(homepage).toContain('<li><a href="/cookies">Cookies</a></li>');
    expect(homepage).toContain(
      "Most businesses can get their LocalAction page",
    );
    expect(homepage).toContain("Placeholder — not a customer endorsement");
    expect(homepage.match(/class="testimonial-type"/g)).toHaveLength(3);
    expect(homepage).toContain('data-count="128"');
    expect(homepage).toContain('data-count="6"');
    expect(homepage).toContain('data-count="14"');
    expect(homepage).toContain('data-count="9"');
    expect(homepage).toContain("We’ll email you when a customer submits");
    expect(homepage).toContain("LocalAction complements your website");
    expect(homepage).toContain(
      "without replacing your broader business presence",
    );
    expect(homepage).not.toContain("LocalAction can work on its own");
    expect(homepage).toContain("Then <strong>€9.99 / month</strong>");
    expect(homepage).not.toContain("+ applicable taxes");
    expect(homepage).not.toContain("Merchant of Record");
  });

  it("describes cancellation and retained settings in the Terms", () => {
    const html = renderToStaticMarkup(<TermsPage />);
    expect(html).toContain("Cancellation stops the next renewal");
    expect(html).toContain("does not end access");
    expect(html).toContain("becomes unpublished");
    expect(html).toContain("saved business and page configuration remains");
    expect(html).toContain("publish the page again");
  });

  it("provides stable Help anchors for current tools", () => {
    const html = renderToStaticMarkup(<HelpPage />);
    for (const anchor of [
      "google-reviews",
      "pricing",
      "special-offers",
      "trust-credentials",
      "save-contact",
      "printable-review-sign",
    ])
      expect(html).toContain(`id="${anchor}"`);
  });

  it("contains no forbidden content placeholders in public information sources", () => {
    const files = [
      "src/app/terms/page.tsx",
      "src/app/privacy/page.tsx",
      "src/app/cookies/page.tsx",
      "src/app/help/help-centre.tsx",
      "src/app/contact/page.tsx",
      "src/app/contact/contact-form.tsx",
    ];
    const source = files.map((file) => readFileSync(file, "utf8")).join("\n");
    for (const forbidden of [
      "Lorem ipsum",
      "[Company Name]",
      "[Address]",
      "[Jurisdiction]",
      "TO" + "DO",
      "Coming soon",
    ])
      expect(source).not.toContain(forbidden);
  });
});
