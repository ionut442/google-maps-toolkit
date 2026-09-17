import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageOrderList } from "@/components/page-order-list";
import { ProfileForm } from "@/components/profile-form";
import { BusinessPage } from "@/components/public/business-page";
import { SimpleToolEditor } from "@/components/simple-tool-editor";
import { PromotionsEditor } from "@/components/structured-tool-editors";
import type { PublicBusiness } from "@/lib/public-business";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions", () => ({
  extractReviewLinkAction: vi.fn(),
  moveModuleAction: vi.fn(),
  saveProfileAction: vi.fn(),
  savePromotionsAction: vi.fn(),
  saveReviewToolAction: vi.fn(),
  setModuleOpenByDefaultAction: vi.fn(),
  updateModuleLabelAction: vi.fn(),
}));

const directReviewUrl =
  "https://search.google.com/local/writereview?placeid=ChIJExamplePlaceIdentifier12345";

describe("LocalAction real-user regressions", () => {
  it("keeps both Step 3 disclosure sections visibly open", () => {
    const html = renderToStaticMarkup(
      <ProfileForm
        onboarding
        business={{
          name: "Test Co",
          description: "A useful business description.",
          phone: "+40700111222",
          whatsapp: "+40700111222",
          email: "owner@example.test",
          website: null,
          logoUrl: null,
          brandColor: "#13572C",
          googleReviewUrl: null,
          googleBusinessName: null,
          googleMapsUrl: null,
        }}
      />,
    );
    expect(
      html.match(/<details class="profile-disclosure" open=""/g),
    ).toHaveLength(2);
    expect(html).toContain("Page personalisation");
    expect(html).toContain("Google Business Profile");
    expect(html).toContain(
      "Used on your printable review sign and social review graphic.",
    );
    expect(html).not.toContain("Customer preview");
  });

  it("marks saved and unsaved Page Order tools with a direct setup link", () => {
    const html = renderToStaticMarkup(
      <PageOrderList
        businessId="business"
        business={{ phone: "+40700111222", googleReviewUrl: directReviewUrl }}
        tools={[
          {
            id: "pricing-id",
            type: "PRICING",
            enabled: true,
            openByDefault: true,
            customizedAt: new Date(),
          },
          {
            id: "quote-id",
            type: "QUOTE_REQUEST",
            enabled: true,
            customizedAt: null,
          },
        ]}
      />,
    );
    expect(html).toContain("Configured");
    expect(html).toContain("Needs setup");
    expect(html).toContain("1 enabled tool still needs setup");
    expect(html).toContain('href="/dashboard/tools/quote-id"');
    expect(html).toContain("Finish setup");
    expect(html).toContain('name="openByDefault"');
    expect(html).toContain('checked=""');
    expect(html).toContain("Open by default");
    expect(html).toContain('class="page-order-main"');
    expect(html).toContain('class="page-order-actions"');
  });

  it("uses LocalAction styling and preserves a logo's intrinsic shape", () => {
    const business: PublicBusiness = {
      name: "Wide Logo Co",
      slug: "wide-logo",
      logoUrl: "https://example.test/wide-logo.png",
      description: "A useful business description.",
      phone: "+40700111222",
      whatsapp: "+40700111222",
      email: "owner@example.test",
      website: null,
      brandColor: "#FF00FF",
      industry: "PLUMBING",
      customIndustryLabel: null,
      googleReviewUrl: null,
      googleReviewScore: null,
      googleReviewCount: null,
      displayGoogleReviewScore: false,
      displayGoogleReviewCount: false,
      primaryAction: null,
      modules: [],
    };
    const html = renderToStaticMarkup(
      <BusinessPage business={business} preview />,
    );
    expect(html).toContain('class="public-action-page"');
    expect(html).not.toContain("#FF00FF");
    expect(html).toContain('class="action-logo"');
    expect(html).not.toMatch(/class="action-logo"[^>]+(?:width|height)=/);
  });

  it("keeps the required desktop, tablet, and mobile page padding", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(/\.action-page-shell\s*\{[^}]*padding:\s*60px/s);
    expect(css).toMatch(
      /@media \(max-width: 980px\) and \(min-width: 701px\)[\s\S]*?\.action-page-shell\s*\{[^}]*padding:\s*36px/s,
    );
    expect(css).toMatch(
      /@media \(max-width: 700px\)[\s\S]*?\.action-page-shell\s*\{[^}]*padding:\s*22px/s,
    );
    expect(css).toMatch(
      /\.public-credential-image\s*\{[^}]*object-fit:\s*contain/s,
    );
  });

  it("keeps compact preview actions readable and status feedback semantic", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toMatch(
      /\.public-quick-actions\s*\{[^}]*padding:\s*1rem 1\.1rem 1\.15rem/s,
    );
    expect(css).toMatch(
      /@container \(max-width: 520px\)[\s\S]*?\.compact-action-module \.action-link\s*\{[^}]*min-width:\s*0/s,
    );
    expect(css).toMatch(
      /\.compact-action-module \.compact-public-button\s*\{[^}]*background:\s*var\(--primary\)/s,
    );
    expect(css).toMatch(
      /\.quote-form-preview \.public-quote-form button\s*\{[^}]*background:\s*var\(--primary\)/s,
    );
    expect(css).toMatch(
      /\.publish-checklist \.is-ready small\s*\{[^}]*color:\s*var\(--success\)/s,
    );
    expect(css).toMatch(
      /\.add-credential-button\s*\{[^}]*white-space:\s*nowrap/s,
    );
    expect(readFileSync("src/app/icon.svg", "utf8")).toContain("#ffb020");
    expect(readFileSync("src/app/homepage.html", "utf8")).toContain(
      '<link rel="icon" href="/icon.svg" type="image/svg+xml" />',
    );
  });

  it("puts the shared Google connection flow inside the Review editor", () => {
    const html = renderToStaticMarkup(
      <SimpleToolEditor
        businessId="business"
        moduleId="review-id"
        type="REVIEW"
        label="Leave a review"
        googleUrl={directReviewUrl}
        business={{
          name: "Test Co",
          phone: "+40700111222",
          email: "owner@example.test",
          googleMapsUrl: "https://maps.app.goo.gl/example",
          googleReviewScore: null,
          googleReviewCount: null,
          displayGoogleReviewScore: false,
          displayGoogleReviewCount: false,
        }}
      />,
    );
    expect(html).toContain("Google Maps share link");
    expect(html).toContain("Get review link");
    expect(html).toContain("Review link ready");
    expect(html).toContain("Button text");
    expect(html).not.toContain("Connect Google");
    expect(html).not.toContain("Business Details");
  });

  it("warns when an offer's selected request channel has no business contact", () => {
    const html = renderToStaticMarkup(
      <PromotionsEditor
        businessId="business"
        contacts={{ phone: "+40700111222", whatsapp: "", email: "" }}
        config={{
          label: "Special Offers",
          offers: [
            {
              id: "email_offer",
              title: "Email offer",
              requestMethod: "EMAIL",
            },
          ],
        }}
      />,
    );
    expect(html).toContain("How should customers request this offer?");
    expect(html).toContain(
      "Add this contact method in Business Details before publishing the offer.",
    );
  });

  it("keeps enabled Services and Special Offers visible before items are added", () => {
    const business: PublicBusiness = {
      name: "Preview Co",
      slug: "preview-co",
      logoUrl: null,
      description: "A useful business description.",
      phone: "+40700111222",
      whatsapp: "+40700111222",
      email: "owner@example.test",
      website: null,
      brandColor: "#13332c",
      industry: "PLUMBING",
      customIndustryLabel: null,
      googleReviewUrl: null,
      googleReviewScore: null,
      googleReviewCount: null,
      displayGoogleReviewScore: false,
      displayGoogleReviewCount: false,
      primaryAction: null,
      modules: [
        {
          type: "SERVICES",
          sortOrder: 0,
          config: { label: "Services", categories: [] },
        },
        {
          type: "PROMOTIONS",
          sortOrder: 1,
          config: { label: "Special Offers", offers: [] },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <BusinessPage business={business} preview />,
    );
    expect(html).toContain('data-module="services"');
    expect(html).toContain("Contact us to discuss the service you need.");
    expect(html).toContain('data-module="promotions"');
    expect(html).toContain(
      "Contact us to ask about our latest special offers.",
    );
  });

  it("preserves the responsive interaction fixes in shared styles and shells", () => {
    const css = readFileSync("src/app/glm.css", "utf8");
    const shell = readFileSync("src/components/app-shell.tsx", "utf8");
    const publish = readFileSync("src/app/onboarding/publish/page.tsx", "utf8");
    expect(css).toMatch(/\.action-description\s*\{[^}]*max-width:\s*none/s);
    expect(css).toMatch(/\.page-order-list\s*\{[^}]*gap:\s*12px/s);
    expect(css).toMatch(/\.page-order-actions button\s*\{[^}]*width:\s*32px/s);
    expect(css).toMatch(
      /\.google-review-display-options input\[type="checkbox"\]\s*\{[^}]*box-shadow:\s*none/s,
    );
    expect(css).toMatch(
      /button\.search-result[\s\S]*?background:\s*var\(--glm-white\)\s*!important/s,
    );
    expect(shell).toContain('removeAttribute("open")');
    expect(publish).toContain(
      "Finish setting up your enabled tools before publishing.",
    );
  });
});
