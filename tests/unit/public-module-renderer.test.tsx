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
      primaryAction: "CALL",
      modules: [
        {
          type: "CALL_WHATSAPP",
          sortOrder: 1,
          config: {
            callLabel: "Call now",
            whatsappLabel: "Message on WhatsApp",
            whatsappMessage: "Hello",
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
  });
});
