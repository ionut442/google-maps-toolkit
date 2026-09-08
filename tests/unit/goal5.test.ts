import { describe, expect, it, vi } from "vitest";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import sharp from "sharp";
import {
  aggregateDashboardActivity,
  analyticsEventTypes,
  last30DaysStart,
} from "@/lib/analytics";
import { generateQrPng, qrSettings } from "@/lib/qr";
import {
  generatePrintableReviewSign,
  generateSocialReviewGraphic,
  normalizeLogo,
  wrapBusinessName,
} from "@/lib/review-assets";
import { publicBusinessUrl, safeDownloadSlug } from "@/lib/public-url";
import { profileSchema } from "@/lib/validation";
import { POST as postAnalytics } from "@/app/api/analytics/route";
import { handleAnalyticsRequest } from "@/lib/analytics-request";
import { renderToStaticMarkup } from "react-dom/server";
import { publicModuleRegistry } from "@/components/public/module-renderer";
import type { PublicBusiness } from "@/lib/public-business";
import { sendAnalytics } from "@/components/public/analytics-client";

function decodeQr(buffer: Buffer) {
  const png = PNG.sync.read(buffer);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

describe("Goal 5 QR, assets, and analytics", () => {
  it("generates deterministic, high-contrast, decodable QR PNGs with a quiet zone", async () => {
    const destination =
      "https://www.google.com/maps/place/example?cid=12345678901234567890&long=encoded%20value";
    const [first, second] = await Promise.all([
      generateQrPng(destination),
      generateQrPng(destination),
    ]);
    expect(first.equals(second)).toBe(true);
    expect(decodeQr(first)).toBe(destination);
    expect(qrSettings).toMatchObject({
      width: 1024,
      margin: 4,
      errorCorrectionLevel: "M",
    });
    expect(PNG.sync.read(first)).toMatchObject({ width: 1024, height: 1024 });
  });

  it("constructs canonical business URLs and safe filenames", () => {
    process.env.APP_URL = "https://toolkit.example.test";
    expect(publicBusinessUrl("rapidflow-plumbing")).toBe(
      "https://toolkit.example.test/rapidflow-plumbing",
    );
    expect(safeDownloadSlug("../../ Élite Plumbing & Sons <script>")).toBe(
      "elite-plumbing-sons-script",
    );
    delete process.env.APP_URL;
  });

  it("rejects non-HTTP owner URLs", () => {
    const base = {
      name: "Safe Co",
      description: "A useful description",
      phone: "+40700111222",
      whatsapp: "+40700111222",
      email: "owner@example.test",
      website: "",
      logoUrl: "",
      brandColor: "#2563eb",
    };
    expect(
      profileSchema.safeParse({
        ...base,
        googleReviewUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...base,
        googleReviewUrl:
          "https://search.google.com/local/writereview?placeid=ChIJExamplePlaceIdentifier12345",
      }).success,
    ).toBe(true);
  });

  it("rejects arbitrary event types and metadata before persistence", async () => {
    const response = await postAnalytics(
      new Request("http://test/api/analytics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: "rapidflow-plumbing",
          eventType: "QUOTE_SUBMITTED",
          customerEmail: "private@example.test",
        }),
      }),
    );
    expect(response.status).toBe(400);
    const oversized = await postAnalytics(
      new Request("http://test/api/analytics", {
        method: "POST",
        body: JSON.stringify({
          slug: "rapidflow-plumbing",
          eventType: "PAGE_VIEW",
          padding: "x".repeat(1100),
        }),
      }),
    );
    expect(oversized.status).toBe(413);
  });

  it("fails open when analytics persistence is unavailable", async () => {
    const request = new Request("http://test/api/analytics", {
      method: "POST",
      body: JSON.stringify({
        slug: "rapidflow-plumbing",
        eventType: "CALL_CLICK",
      }),
    });
    await expect(
      handleAnalyticsRequest(request, async () => {
        throw new Error("database unavailable");
      }),
    ).resolves.toMatchObject({ status: 202 });
    vi.stubGlobal("navigator", {
      sendBeacon: () => {
        throw new Error("beacon unavailable");
      },
    });
    expect(() =>
      sendAnalytics("rapidflow-plumbing", "CALL_CLICK"),
    ).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("renders Review only for a safe configured destination", () => {
    const reviewModule = {
      type: "REVIEW" as const,
      sortOrder: 0,
      config: { label: "Leave Us a Review" },
    };
    const base = {
      name: "Review Co",
      slug: "review-co",
      modules: [reviewModule],
    } as unknown as PublicBusiness;
    const render = (googleReviewUrl: string | null) =>
      renderToStaticMarkup(
        publicModuleRegistry.REVIEW.render({
          business: { ...base, googleReviewUrl },
          module: reviewModule,
          primary: null,
        }),
      );
    const connected = render("https://g.page/r/example/review");
    expect(connected).toContain("Leave Us a Review");
    expect(connected).toContain("lucide-star");
    expect(render("javascript:alert(1)")).toBe("");
    expect(render(null)).toBe("");
  });

  it("uses an inclusive rolling 30-day boundary and authoritative quotes", () => {
    const now = new Date("2026-08-27T12:00:00.000Z");
    const atBoundary = last30DaysStart(now);
    const result = aggregateDashboardActivity(
      [
        { id: "view", eventType: "PAGE_VIEW", createdAt: atBoundary },
        {
          id: "call",
          eventType: "CALL_CLICK",
          createdAt: new Date(now.getTime() - 29 * 86400000),
        },
        {
          id: "old",
          eventType: "REVIEW_CLICK",
          createdAt: new Date(atBoundary.getTime() - 1),
        },
        { id: "arbitrary", eventType: "QUOTE_SUBMITTED", createdAt: now },
      ],
      [
        { id: "quote-in", createdAt: now },
        { id: "quote-old", createdAt: new Date(atBoundary.getTime() - 1) },
      ],
      now,
    );
    expect(result).toMatchObject({
      pageViews: 1,
      quoteRequests: 1,
      callClicks: 1,
      whatsappClicks: 0,
      reviewClicks: 0,
    });
    expect(analyticsEventTypes).toEqual([
      "PAGE_VIEW",
      "CALL_CLICK",
      "WHATSAPP_CLICK",
      "REVIEW_CLICK",
    ]);
  });

  it("renders fixed high-resolution assets for long Unicode names and no logo", async () => {
    const business = {
      name: "Élite International Plumbing Cleaning and Emergency Services București",
      brandColor: "#ffff00",
      googleReviewUrl:
        "https://search.google.com/local/writereview?placeid=ChIJExamplePlaceIdentifier12345",
    };
    expect(wrapBusinessName(business.name).length).toBeLessThanOrEqual(3);
    const [print, social] = await Promise.all([
      generatePrintableReviewSign(business),
      generateSocialReviewGraphic(business),
    ]);
    await expect(sharp(print).metadata()).resolves.toMatchObject({
      format: "png",
      width: 2480,
      height: 3508,
    });
    await expect(sharp(social).metadata()).resolves.toMatchObject({
      format: "png",
      width: 1200,
      height: 1200,
    });
    expect(print.byteLength).toBeGreaterThan(50_000);
    expect(social.byteLength).toBeGreaterThan(20_000);
    const embedded = await sharp(print)
      .extract({ left: 354, top: 2508, width: 562, height: 562 })
      .png()
      .toBuffer();
    expect(decodeQr(embedded)).toBe(business.googleReviewUrl);
    const socialQr = await sharp(social)
      .extract({ left: 817, top: 757, width: 272, height: 272 })
      .png()
      .toBuffer();
    expect(decodeQr(socialQr)).toBe(business.googleReviewUrl);
    await expect(
      generateSocialReviewGraphic({ ...business, name: "A1 Plumbing" }),
    ).resolves.toBeInstanceOf(Buffer);
  }, 15_000);

  it("contains square and wide logos without distortion", async () => {
    for (const [width, height] of [
      [200, 200],
      [600, 120],
    ]) {
      const source = await sharp({
        create: { width, height, channels: 4, background: "#2563eb" },
      })
        .png()
        .toBuffer();
      const normalized = await normalizeLogo(source, 280, 280);
      const trimmed = await sharp(normalized).trim().png().toBuffer();
      const metadata = await sharp(trimmed).metadata();
      expect(metadata.width).toBeLessThanOrEqual(280);
      expect(metadata.height).toBeLessThanOrEqual(280);
      expect((metadata.width ?? 1) / (metadata.height ?? 1)).toBeCloseTo(
        width / height,
        1,
      );
    }
  });
});
