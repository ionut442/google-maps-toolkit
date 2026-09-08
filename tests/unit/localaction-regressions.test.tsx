import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PageOrderList } from "@/components/page-order-list";
import { ProfileForm } from "@/components/profile-form";
import { BusinessPage } from "@/components/public/business-page";
import { SimpleToolEditor } from "@/components/simple-tool-editor";
import type { PublicBusiness } from "@/lib/public-business";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/actions", () => ({
  extractReviewLinkAction: vi.fn(),
  moveModuleAction: vi.fn(),
  saveProfileAction: vi.fn(),
  saveReviewToolAction: vi.fn(),
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
});
