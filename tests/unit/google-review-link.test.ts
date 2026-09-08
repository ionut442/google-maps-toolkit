import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractGoogleReviewLink,
  generateGoogleReviewUrl,
  GoogleReviewLinkError,
  resolveGooglePlaceId,
} from "@/lib/google-review-link";

const placeId = "ChIJN1t_tDeuEmsRUsoyG83frY4";

describe("Google review link resolution", () => {
  afterEach(() => vi.unstubAllGlobals());

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

  it("rejects too many redirects, missing IDs, and hex-only feature IDs", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<html>0x487604b900d26973:0x2d93df740cb42a1f</html>"),
        ),
    );
    await expect(
      resolveGooglePlaceId("https://maps.app.goo.gl/example"),
    ).rejects.toMatchObject({ code: "PLACE_ID_NOT_FOUND" });
  });

  it("validates and encodes generated URLs", () => {
    expect(generateGoogleReviewUrl(placeId)).toBe(
      `https://search.google.com/local/writereview?placeid=${placeId}`,
    );
    expect(() => generateGoogleReviewUrl("0x123:0x456")).toThrow(
      GoogleReviewLinkError,
    );
  });
});
