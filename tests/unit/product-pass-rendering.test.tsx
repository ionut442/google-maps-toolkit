import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleReviewSummary } from "@/components/google-review-summary";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import type { PublicBusiness } from "@/lib/public-business";

const base: Omit<PublicBusiness, "modules"> = {
  name: "Example Plumbing",
  slug: "example-plumbing",
  logoUrl: null,
  description: "Local plumbing services.",
  phone: "+40700111222",
  whatsapp: "+40700111222",
  email: "hello@example.test",
  website: null,
  brandColor: "#ff00ff",
  industry: "PLUMBING",
  customIndustryLabel: null,
  googleReviewUrl: null,
  googleReviewScore: 4.8,
  googleReviewCount: 1234,
  displayGoogleReviewScore: true,
  displayGoogleReviewCount: true,
  primaryAction: null,
};

describe("product pass public rendering", () => {
  it("renders populated structured tools and suppresses expired offers", () => {
    const business: PublicBusiness = {
      ...base,
      modules: [
        {
          type: "SERVICES",
          sortOrder: 1,
          config: {
            label: "What we do",
            categories: [
              {
                id: "repairs",
                name: "Repairs",
                items: [
                  {
                    id: "leaks",
                    name: "Leak repair",
                    description: "Fast fault finding",
                  },
                ],
              },
            ],
          },
        },
        {
          type: "WORK_HOURS",
          sortOrder: 2,
          config: {
            label: "Hours",
            days: [
              {
                day: "MONDAY",
                status: "OPEN",
                opensAt: "09:00",
                closesAt: "17:00",
              },
              { day: "TUESDAY", status: "OPEN_24_HOURS" },
              { day: "WEDNESDAY", status: "CLOSED" },
              { day: "THURSDAY", status: "CLOSED" },
              { day: "FRIDAY", status: "CLOSED" },
              { day: "SATURDAY", status: "CLOSED" },
              { day: "SUNDAY", status: "CLOSED" },
            ],
          },
        },
        {
          type: "PROMOTIONS",
          sortOrder: 3,
          config: {
            label: "Offers",
            offers: [
              {
                id: "active_offer",
                title: "Active offer",
                validUntil: "2099-01-01",
                requestMethod: "PHONE",
              },
              {
                id: "expired_offer",
                title: "Expired offer",
                validUntil: "2020-01-01",
                requestMethod: "PHONE",
              },
            ],
          },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <PublicModuleRenderer business={business} primary={null} />,
    );
    expect(html).toContain("Leak repair");
    expect(html).toContain("09:00–17:00");
    expect(html).toContain("Open 24 hours");
    expect(html).toContain("Active offer");
    expect(html).not.toContain("Expired offer");
  });

  it("does not render empty structured tool cards", () => {
    const business: PublicBusiness = {
      ...base,
      modules: [
        {
          type: "SERVICES",
          sortOrder: 1,
          config: { label: "Services", categories: [] },
        },
        {
          type: "PROMOTIONS",
          sortOrder: 2,
          config: { label: "Offers", offers: [] },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <PublicModuleRenderer business={business} primary={null} />,
    );
    expect(html).not.toContain("<details");
  });

  it("renders review score and count independently without empty punctuation", () => {
    expect(
      renderToStaticMarkup(<GoogleReviewSummary business={base} />),
    ).toContain("★★★★★");
    expect(
      renderToStaticMarkup(<GoogleReviewSummary business={base} />),
    ).toContain("4.8");
    expect(
      renderToStaticMarkup(
        <GoogleReviewSummary
          business={{ ...base, displayGoogleReviewScore: false }}
        />,
      ),
    ).toContain("1,234 Google reviews");
    expect(
      renderToStaticMarkup(
        <GoogleReviewSummary
          business={{ ...base, displayGoogleReviewCount: false }}
        />,
      ),
    ).not.toContain(" · ");
    expect(
      renderToStaticMarkup(
        <GoogleReviewSummary
          business={{
            ...base,
            displayGoogleReviewScore: false,
            displayGoogleReviewCount: false,
          }}
        />,
      ),
    ).toBe("");
  });
});
