import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractGoogleReviewLink,
  extractGoogleReviewStats,
  generateGoogleReviewUrl,
  googleMapsHexPairToPlaceId,
  GoogleReviewLinkError,
  resolveGooglePlaceId,
} from "@/lib/google-review-link";

const placeId = "ChIJN1t_tDeuEmsRUsoyG83frY4";
const penangPlaceId = "ChIJqc9AwPLpSjAREsHn965EcRA";

describe("Google review link resolution", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("follows an allowed short-link redirect and extracts a Place ID from HTML", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "https://www.google.com/maps/place/Test" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(`<script>window.placeId = "${placeId}"</script>`, {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).resolves.toBe(placeId);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ redirect: "manual" });
  });

  it("extracts a Place ID from a redirect URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: {
            location: `https://www.google.com/maps/search/?api=1&query_place_id=${placeId}`,
          },
        }),
      ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).resolves.toBe(placeId);
  });

  it("resolves the supplied real share-link redirect to Penang Island", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          location:
            "https://www.google.com/maps/place/Penang+Island/@5.369907,100.2606831,12z/data=!3m1!4b1!4m6!3m5!1s0x304ae9f2c040cfa9:0x107144aef7e7c112!8m2!3d5.3673161!4d100.2486493",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      extractGoogleReviewLink("https://maps.app.goo.gl/hdACQxBqiUgWvufV9"),
    ).resolves.toEqual({
      success: true,
      placeId: penangPlaceId,
      reviewUrl: generateGoogleReviewUrl(penangPlaceId),
      reviewScore: null,
      reviewCount: null,
    });
  });

  it("converts ftid and !1s hex pairs deterministically", async () => {
    expect(
      googleMapsHexPairToPlaceId("0x304ae9f2c040cfa9", "0x107144aef7e7c112"),
    ).toBe(penangPlaceId);

    for (const location of [
      "https://www.google.com/maps?ftid=0x304ae9f2c040cfa9:0x107144aef7e7c112",
      "https://www.google.com/maps/place/Penang/data=!1s0x304ae9f2c040cfa9:0x107144aef7e7c112!8m2",
    ]) {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response(null, { status: 302, headers: { location } }),
          ),
      );
      await expect(
        resolveGooglePlaceId("https://maps.app.goo.gl/example"),
      ).resolves.toBe(penangPlaceId);
    }
  });

  it("normalizes a direct write-review URL without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      extractGoogleReviewLink(
        `https://search.google.com/local/writereview?placeid=${placeId}`,
      ),
    ).resolves.toEqual({
      success: true,
      placeId,
      reviewUrl: generateGoogleReviewUrl(placeId),
      reviewScore: null,
      reviewCount: null,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an external URL before fetch and blocks unsafe redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: "https://example.com/private" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      resolveGooglePlaceId("https://example.com/maps"),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_GOOGLE_URL",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).rejects.toMatchObject({ code: "REDIRECT_BLOCKED" });
  });

  it("times out one bounded fetch operation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            ),
          ),
      ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example", { timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("rejects too many redirects and missing IDs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { location: "https://www.google.com/maps/place/again" },
        }),
      ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).rejects.toMatchObject({ code: "TOO_MANY_REDIRECTS" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html />")));
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).rejects.toMatchObject({ code: "PLACE_ID_NOT_FOUND" });
  });

  it("extracts a safely encoded hex pair from returned HTML", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            '<script>const next="https:\\/\\/www.google.com\\/maps\\/data=!1s0x304ae9f2c040cfa9:0x107144aef7e7c112!8m2"</script>',
          ),
        ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).resolves.toBe(penangPlaceId);
  });

  it("rejects oversized responses and malformed or out-of-range hex", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("small", { headers: { "content-length": "2097153" } }),
        ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).rejects.toMatchObject({ code: "GOOGLE_FETCH_FAILED" });

    for (const pair of [
      ["0x", "0x1"],
      ["0x10000000000000000", "0x1"],
      ["0x1", "0x10000000000000000"],
      ["0xnothex", "0x1"],
    ]) {
      expect(() => googleMapsHexPairToPlaceId(pair[0], pair[1])).toThrow(
        GoogleReviewLinkError,
      );
    }
  });

  it("validates and encodes generated URLs", () => {
    expect(generateGoogleReviewUrl(placeId)).toBe(
      `https://search.google.com/local/writereview?placeid=${placeId}`,
    );
    expect(() => generateGoogleReviewUrl("0x123:0x456")).toThrow(
      GoogleReviewLinkError,
    );
  });

  it("extracts exact Google review details when present", () => {
    expect(
      extractGoogleReviewStats(`
        <script type="application/ld+json">
          {"@type":"LocalBusiness","aggregateRating":{"ratingValue":"4.8","reviewCount":"1,234"}}
        </script>`),
    ).toEqual({ reviewScore: 4.8, reviewCount: 1234 });
    expect(
      extractGoogleReviewStats("Rated 4.7 stars from 89 Google reviews"),
    ).toEqual({ reviewScore: 4.7, reviewCount: 89 });
  });

  it("leaves missing or abbreviated review details unavailable", () => {
    expect(
      extractGoogleReviewStats("<html>No aggregate rating</html>"),
    ).toEqual({ reviewScore: null, reviewCount: null });
    expect(extractGoogleReviewStats("4.8 stars · 1.2K reviews")).toEqual({
      reviewScore: null,
      reviewCount: null,
    });
  });

  it("uses matching SerpApi place results as a server-side stats fallback", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "test-serpapi-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          place_results: {
            place_id: placeId,
            title: "Test business",
            rating: 4.9,
            reviews: 321,
          },
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      extractGoogleReviewLink(
        `https://search.google.com/local/writereview?placeid=${placeId}`,
      ),
    ).resolves.toMatchObject({
      success: true,
      placeId,
      reviewScore: 4.9,
      reviewCount: 321,
    });
    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requested.origin).toBe("https://serpapi.com");
    expect(requested.searchParams.get("place_id")).toBe(placeId);
  });

  it("ignores mismatched or unavailable SerpApi results without breaking the review link", async () => {
    vi.stubEnv("SERPAPI_API_KEY", "test-serpapi-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            place_results: {
              place_id: penangPlaceId,
              rating: 5,
              reviews: 999,
            },
          }),
        ),
      ),
    );

    await expect(
      extractGoogleReviewLink(
        `https://search.google.com/local/writereview?placeid=${placeId}`,
      ),
    ).resolves.toEqual({
      success: true,
      placeId,
      reviewUrl: generateGoogleReviewUrl(placeId),
      reviewScore: null,
      reviewCount: null,
    });
  });

  it("rejects the supplied generic-search redirect instead of guessing a business", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(null, {
            status: 302,
            headers: {
              location:
                "https://www.google.com/maps/search/plumber/@51.5068727,-0.2464961,13z",
            },
          }),
        )
        .mockResolvedValueOnce(
          new Response(
            `<html>Results for plumber <script>window.placeId = "${placeId}"</script></html>`,
          ),
        ),
    );
    await expect(
      extractGoogleReviewLink("https://maps.app.goo.gl/nr1vSpyzwnpSYjnT9"),
    ).resolves.toEqual({
      success: false,
      error: expect.stringContaining("correct business"),
    });
  });
});
