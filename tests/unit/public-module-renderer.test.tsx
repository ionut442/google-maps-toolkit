import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import type { PublicBusiness } from "@/lib/public-business";

describe("public tool cards", () => {
  it("renders saved-order collapsed cards with both contact actions", () => {
    const business: PublicBusiness = {
      name: "Example Plumbing",
      slug: "example-plumbing",
      logoUrl: null,
      description: "Local plumbing services for homes and businesses.",
      phone: "+40700111222",
      whatsapp: "+40700333444",
      email: "hello@example.test",
      website: null,
      brandColor: "#2F6FED",
      industry: "PLUMBING",
      customIndustryLabel: null,
      googleReviewUrl: null,
      googleReviewScore: null,
      googleReviewCount: null,
      displayGoogleReviewScore: false,
      displayGoogleReviewCount: false,
      primaryAction: "CALL",
      modules: [
        {
          type: "CALL_WHATSAPP",
          sortOrder: 1,
          config: {
            callLabel: "Call now",
            whatsappLabel: "Message on WhatsApp",
            whatsappMessage: "Hello",
            emergencyEnabled: false,
          },
        },
        {
          type: "SAVE_CONTACT",
          sortOrder: 2,
          config: { label: "Save contact" },
        },
      ],
    };

    const html = renderToStaticMarkup(
      <PublicModuleRenderer
        business={business}
        primary={{
          type: "CALL",
          label: "Call now",
          href: "tel:+40700111222",
          external: false,
        }}
      />,
    );

    expect(html.match(/<details/g)).toHaveLength(2);
    expect(html).not.toContain("<details open");
    expect(html.indexOf("Call &amp; WhatsApp")).toBeLessThan(
      html.indexOf("Save Contact"),
    );
    expect(html).toContain('href="tel:+40700111222"');
    expect(html).toContain("wa.me/40700333444");
    expect(html).toContain('class="whatsapp-icon"');
    expect(html).toContain('class="action-link button compact-public-button"');
  });

  it("shows credential expiry and image evidence without inventing expiry text", () => {
    const business: PublicBusiness = {
      name: "Example Heating",
      slug: "example-heating",
      logoUrl: null,
      description: "Qualified local heating services for nearby homes.",
      phone: "+40700111222",
      whatsapp: "+40700111222",
      email: "hello@example.test",
      website: null,
      brandColor: "#AA00AA",
      industry: "HEATING",
      customIndustryLabel: null,
      googleReviewUrl: null,
      googleReviewScore: null,
      googleReviewCount: null,
      displayGoogleReviewScore: false,
      displayGoogleReviewCount: false,
      primaryAction: null,
      modules: [
        {
          type: "TRUST",
          sortOrder: 1,
          config: {
            label: "Credentials",
            entries: [
              {
                id: "gas_safe",
                name: "Gas Safe registered",
                referenceNumber: "123456",
                expiresOn: "2099-10-15",
              },
              { id: "insured", name: "Fully insured" },
            ],
          },
        },
      ],
      trustEvidence: [
        {
          id: "evidence-image",
          entryId: "gas_safe",
          mediaType: "image/png",
          originalFilename: "certificate.png",
        },
        {
          id: "evidence-pdf",
          entryId: "gas_safe",
          mediaType: "application/pdf",
          originalFilename: "certificate.pdf",
        },
      ],
    };
    const html = renderToStaticMarkup(
      <PublicModuleRenderer business={business} primary={null} />,
    );
    expect(html).toContain("Valid until 15 October 2099");
    expect(html.match(/Valid until/g)).toHaveLength(1);
    expect(html).toContain('src="/trust-evidence/evidence-image"');
    expect(html).toContain('class="public-credential-image"');
    expect(html).toContain("View certificate.pdf");
  });

  it("opens every opted-in card and routes each offer through its saved request method", () => {
    const business: PublicBusiness = {
      name: "Example Offers",
      slug: "example-offers",
      logoUrl: null,
      description: "Current offers from a local business.",
      phone: "+40700111222",
      whatsapp: "+40700333444",
      email: "offers@example.test",
      website: null,
      brandColor: "#FFB020",
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
          type: "PROMOTIONS",
          sortOrder: 1,
          openByDefault: true,
          config: {
            label: "Offers",
            offers: [
              { id: "phone", title: "Phone offer", requestMethod: "PHONE" },
              {
                id: "whatsapp",
                title: "WhatsApp offer",
                requestMethod: "WHATSAPP",
              },
              { id: "email", title: "Email offer", requestMethod: "EMAIL" },
            ],
          },
        },
        {
          type: "SAVE_CONTACT",
          sortOrder: 2,
          openByDefault: true,
          config: { label: "Save contact" },
        },
        {
          type: "FAQ",
          sortOrder: 3,
          openByDefault: false,
          config: {
            label: "FAQs",
            suggestedFaqs: [{ question: "Question?", answer: "Answer." }],
          },
        },
      ],
    };

    const html = renderToStaticMarkup(
      <PublicModuleRenderer business={business} primary={null} />,
    );

    expect(html.match(/open=""/g)).toHaveLength(2);
    expect(html.match(/class="public-tool-card"/g)).toHaveLength(3);
    expect(html).toContain('href="tel:+40700111222"');
    expect(html).toContain("wa.me/40700333444");
    expect(html).toContain("WhatsApp+offer");
    expect(html).toContain(
      'href="mailto:offers@example.test?subject=Offer%20enquiry%3A%20Email%20offer',
    );
    expect(html.match(/Request this offer/g)).toHaveLength(3);
    expect(html).toContain('class="sr-only" id="promotions-heading"');
    expect(html).toContain('class="sr-only" id="faq-heading"');
    expect(html).not.toContain('<h2 id="promotions-heading"');
    expect(html).not.toContain('<h2 id="faq-heading"');
  });
});
