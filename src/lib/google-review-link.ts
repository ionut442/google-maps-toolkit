import { isIP } from "node:net";
import { z } from "zod";

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 8_000;
const FRIENDLY_ERROR =
  "We couldn't get the review link from that Google Maps link. Make sure you copied the Share link for the correct business and try again.";

const allowedHosts = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "search.google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "g.page",
]);

const googleUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .transform((value, ctx) => {
    try {
      return new URL(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid URL" });
      return z.NEVER;
    }
  })
  .refine(
    (url) =>
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      !isIP(url.hostname) &&
      allowedHosts.has(url.hostname.toLowerCase()),
    "Unsupported Google Maps URL",
  );

export const googleMapsUrlSchema = googleUrlSchema.transform((url) =>
  url.toString(),
);

export const directGoogleReviewUrlSchema = googleUrlSchema
  .refine(
    (url) =>
      (url.hostname.toLowerCase() === "search.google.com" &&
        url.pathname.replace(/\/+$/, "") === "/local/writereview") ||
      (url.hostname.toLowerCase() === "g.page" &&
        /^\/r\/[A-Za-z0-9_-]+\/review\/?$/.test(url.pathname)),
    "Enter a direct Google review URL",
  )
  .transform((url, ctx) => {
    if (url.hostname.toLowerCase() === "g.page") return url.toString();
    const placeId = validPlaceId(url.searchParams.get("placeid"));
    if (!placeId) {
      ctx.addIssue({ code: "custom", message: "Invalid Google review URL" });
      return z.NEVER;
    }
    return generateGoogleReviewUrl(placeId);
  });

export function isDirectGoogleReviewUrl(value: string | null | undefined) {
  return Boolean(value && directGoogleReviewUrlSchema.safeParse(value).success);
}

export type GoogleReviewLinkErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_GOOGLE_URL"
  | "REDIRECT_BLOCKED"
  | "TOO_MANY_REDIRECTS"
  | "TIMEOUT"
  | "GOOGLE_FETCH_FAILED"
  | "PLACE_ID_NOT_FOUND";

export class GoogleReviewLinkError extends Error {
  constructor(public readonly code: GoogleReviewLinkErrorCode) {
    super(code);
    this.name = "GoogleReviewLinkError";
  }
}

export type ExtractReviewLinkResult =
  | {
      success: true;
      placeId: string;
      reviewUrl: string;
      reviewScore: number | null;
      reviewCount: number | null;
    }
  | { success: false; error: string };

export type GoogleReviewStats = {
  reviewScore: number | null;
  reviewCount: number | null;
};

const storedReviewScoreSchema = z
  .union([z.literal(""), z.coerce.number().min(0).max(5).multipleOf(0.01)])
  .transform((value) => (value === "" ? null : value));
const storedReviewCountSchema = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(2_147_483_647)])
  .transform((value) => (value === "" ? null : value));

export const googleReviewSnapshotSchema = z.object({
  googleReviewScore: storedReviewScoreSchema,
  googleReviewCount: storedReviewCountSchema,
  displayGoogleReviewScore: z.boolean(),
  displayGoogleReviewCount: z.boolean(),
  googleReviewStatsRefreshed: z.boolean(),
});

function parseGoogleUrl(input: string, redirect = false) {
  const result = googleUrlSchema.safeParse(input);
  if (result.success) return result.data;
  let parsed: URL | null = null;
  try {
    parsed = new URL(input);
  } catch {
    // Classified below.
  }
  if (!parsed) throw new GoogleReviewLinkError("INVALID_URL");
  throw new GoogleReviewLinkError(
    redirect ? "REDIRECT_BLOCKED" : "UNSUPPORTED_GOOGLE_URL",
  );
}

function validPlaceId(value: string | null | undefined) {
  if (!value) return null;
  const candidate = value.trim();
  if (
    candidate.length < 10 ||
    candidate.length > 512 ||
    !/^[A-Za-z0-9_-]+$/.test(candidate) ||
    /^0x[0-9a-f]+(?::0x[0-9a-f]+)?$/i.test(candidate)
  )
    return null;
  return candidate;
}

const MAX_UINT64 = (1n << 64n) - 1n;

function validHexPart(value: string) {
  if (!/^0x[0-9a-f]{1,16}$/i.test(value)) return null;
  try {
    const parsed = BigInt(value);
    return parsed <= MAX_UINT64 ? parsed : null;
  } catch {
    return null;
  }
}

export function googleMapsHexPairToPlaceId(hex1: string, hex2: string) {
  const part1 = validHexPart(hex1);
  const part2 = validHexPart(hex2);
  if (part1 === null || part2 === null)
    throw new GoogleReviewLinkError("PLACE_ID_NOT_FOUND");

  const first = Buffer.alloc(8);
  first.writeBigUInt64LE(part1);
  const second = Buffer.alloc(8);
  second.writeBigUInt64LE(part2);
  const payload = Buffer.concat([
    Buffer.from([0x09]),
    first,
    Buffer.from([0x11]),
    second,
  ]);
  return Buffer.concat([Buffer.from([0x0a, 0x12]), payload]).toString(
    "base64url",
  );
}

function decodedVariants(value: string) {
  const variants = new Set([value, value.replace(/&amp;/g, "&")]);
  let current = value;
  for (let index = 0; index < 2; index += 1) {
    try {
      current = decodeURIComponent(current);
      variants.add(current);
    } catch {
      break;
    }
  }
  variants.add(
    value
      .replace(/\\u003d/gi, "=")
      .replace(/\\u0026/gi, "&")
      .replace(/\\x3d/gi, "=")
      .replace(/\\x26/gi, "&")
      .replace(/\\\//g, "/"),
  );
  return [...variants];
}

function placeIdFromUrl(url: URL) {
  for (const variant of decodedVariants(url.toString())) {
    try {
      const parsed = new URL(variant);
      for (const key of ["query_place_id", "place_id", "placeid"]) {
        const direct = validPlaceId(parsed.searchParams.get(key));
        if (direct) return direct;
      }
      const queryPlace = parsed.searchParams
        .get("query")
        ?.match(/place_id:([^&]+)/i);
      const fromQuery = validPlaceId(queryPlace?.[1]);
      if (fromQuery) return fromQuery;
    } catch {
      // A decoded variant can stop being a valid URL; other strategies remain.
    }
  }
  return null;
}

function placeIdFromHtml(html: string) {
  for (const variant of decodedVariants(html)) {
    const contextual = [
      /(?:query_place_id|place_id|placeid)["']?\s*(?:=|:|%3D)\s*["']?([A-Za-z0-9_-]{10,512})/gi,
      /["']placeId["']\s*:\s*["']([A-Za-z0-9_-]{10,512})["']/gi,
    ];
    for (const pattern of contextual) {
      for (const match of variant.matchAll(pattern)) {
        const placeId = validPlaceId(match[1]);
        if (placeId) return placeId;
      }
    }
  }
  const commonBusinessId = html.match(/ChIJ[A-Za-z0-9_-]{20,}/)?.[0];
  return validPlaceId(commonBusinessId);
}

function parseRating(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim().replace(",", ".");
  if (!/^\d(?:\.\d{1,2})?$/.test(normalized)) return null;
  const rating = Number(normalized);
  return rating >= 0 && rating <= 5 ? rating : null;
}

function parseExactReviewCount(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value).trim();
  if (/[kmb]/i.test(normalized)) return null;
  if (
    !/^\d+$/.test(normalized) &&
    !/^\d{1,3}(?:[\s,.\u00a0\u202f]\d{3})+$/.test(normalized)
  )
    return null;
  const count = Number(normalized.replace(/[\s,.\u00a0\u202f]/g, ""));
  return Number.isSafeInteger(count) && count >= 0 && count <= 2_147_483_647
    ? count
    : null;
}

function structuredRating(value: unknown): GoogleReviewStats | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = structuredRating(item);
      if (found) return found;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  const aggregate = record.aggregateRating;
  if (aggregate && typeof aggregate === "object") {
    const ratingRecord = aggregate as Record<string, unknown>;
    const reviewScore = parseRating(ratingRecord.ratingValue);
    const reviewCount = parseExactReviewCount(
      ratingRecord.reviewCount ?? ratingRecord.ratingCount,
    );
    if (reviewScore !== null || reviewCount !== null)
      return { reviewScore, reviewCount };
  }
  if (record["@graph"]) return structuredRating(record["@graph"]);
  return null;
}

export function extractGoogleReviewStats(html: string): GoogleReviewStats {
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const found = structuredRating(JSON.parse(match[1]));
      if (found) return found;
    } catch {
      // Malformed third-party structured data is ignored.
    }
  }

  for (const variant of decodedVariants(html)) {
    const combined = variant.match(
      /([0-5](?:[.,]\d{1,2})?)\s*(?:stars?|out of 5)[^\d]{0,80}(\d[\d\s,.\u00a0\u202f]*?)\s+(?:Google\s+)?reviews?/i,
    );
    if (combined) {
      const reviewScore = parseRating(combined[1]);
      const reviewCount = parseExactReviewCount(combined[2]);
      if (reviewScore !== null || reviewCount !== null)
        return { reviewScore, reviewCount };
    }

    const aggregate = variant.match(
      /["']aggregateRating["']\s*:\s*\{([\s\S]{0,1000}?)\}/i,
    )?.[1];
    if (aggregate) {
      const score = aggregate.match(
        /["']ratingValue["']\s*:\s*["']?([0-5](?:[.,]\d{1,2})?)/i,
      )?.[1];
      const count = aggregate.match(
        /["'](?:reviewCount|ratingCount)["']\s*:\s*["']?(\d[\d\s,.\u00a0\u202f]*)/i,
      )?.[1];
      const reviewScore = parseRating(score);
      const reviewCount = parseExactReviewCount(count);
      if (reviewScore !== null || reviewCount !== null)
        return { reviewScore, reviewCount };
    }
  }
  return { reviewScore: null, reviewCount: null };
}

async function fetchSerpApiReviewStats(
  placeId: string,
  apiKey = process.env.SERPAPI_API_KEY?.trim(),
): Promise<GoogleReviewStats | null> {
  if (!apiKey) return null;
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("type", "place");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("api_key", apiKey);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const payload = JSON.parse(await readBoundedText(response)) as {
      place_results?: Record<string, unknown>;
    };
    const place = payload.place_results;
    if (!place || place.place_id !== placeId) return null;
    const reviewScore = parseRating(place.rating);
    const reviewCount = parseExactReviewCount(place.reviews);
    if (reviewScore === null && reviewCount === null) return null;
    return { reviewScore, reviewCount };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function hexPairFromText(value: string) {
  for (const variant of decodedVariants(value)) {
    const patterns = [
      /(?:[?&]|["']|\b)ftid["']?\s*(?:=|:|%3D)\s*["']?(0x[0-9a-f]+):(0x[0-9a-f]+)(?=[^0-9a-f]|$)/i,
      /!1s(0x[0-9a-f]+):(0x[0-9a-f]+)(?=[^0-9a-f]|$)/i,
    ];
    for (const pattern of patterns) {
      const match = variant.match(pattern);
      if (!match) continue;
      try {
        return googleMapsHexPairToPlaceId(match[1], match[2]);
      } catch {
        // A malformed or out-of-range pair is not a usable identifier.
      }
    }
  }
  return null;
}

async function readBoundedText(response: Response) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_RESPONSE_BYTES)
    throw new GoogleReviewLinkError("GOOGLE_FETCH_FAILED");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let output = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new GoogleReviewLinkError("GOOGLE_FETCH_FAILED");
    }
    output += decoder.decode(value, { stream: true });
  }
  return output + decoder.decode();
}

export function generateGoogleReviewUrl(placeId: string) {
  const valid = validPlaceId(placeId);
  if (!valid) throw new GoogleReviewLinkError("PLACE_ID_NOT_FOUND");
  const url = new URL("https://search.google.com/local/writereview");
  url.searchParams.set("placeid", valid);
  return url.toString();
}

async function resolveGoogleListing(
  input: string,
  options: { timeoutMs?: number; includeStats?: boolean } = {},
) {
  let url = parseGoogleUrl(input);
  const direct = placeIdFromUrl(url);
  if (direct) return { placeId: direct, reviewScore: null, reviewCount: null };
  const directHexPair = hexPairFromText(url.toString());
  if (directHexPair)
    return { placeId: directHexPair, reviewScore: null, reviewCount: null };

  let candidatePlaceId: string | null = null;

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );
  try {
    for (
      let redirectCount = 0;
      redirectCount <= MAX_REDIRECTS;
      redirectCount += 1
    ) {
      let response: Response;
      try {
        response = await fetch(url, {
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "accept-language": "en-GB,en;q=0.9",
          },
        });
      } catch {
        if (candidatePlaceId)
          return {
            placeId: candidatePlaceId,
            reviewScore: null,
            reviewCount: null,
          };
        if (controller.signal.aborted)
          throw new GoogleReviewLinkError("TIMEOUT");
        throw new GoogleReviewLinkError("GOOGLE_FETCH_FAILED");
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new GoogleReviewLinkError("GOOGLE_FETCH_FAILED");
        if (redirectCount === MAX_REDIRECTS) {
          if (candidatePlaceId)
            return {
              placeId: candidatePlaceId,
              reviewScore: null,
              reviewCount: null,
            };
          throw new GoogleReviewLinkError("TOO_MANY_REDIRECTS");
        }
        url = parseGoogleUrl(new URL(location, url).toString(), true);
        const redirected = placeIdFromUrl(url);
        const redirectedHexPair = hexPairFromText(url.toString());
        candidatePlaceId = redirected ?? redirectedHexPair ?? candidatePlaceId;
        if (candidatePlaceId && !options.includeStats)
          return {
            placeId: candidatePlaceId,
            reviewScore: null,
            reviewCount: null,
          };
        continue;
      }
      if (!response.ok) {
        if (candidatePlaceId)
          return {
            placeId: candidatePlaceId,
            reviewScore: null,
            reviewCount: null,
          };
        throw new GoogleReviewLinkError("GOOGLE_FETCH_FAILED");
      }
      const finalUrl = parseGoogleUrl(response.url || url.toString(), true);
      const fromFinalUrl = placeIdFromUrl(finalUrl);
      const genericSearch = /^\/maps\/search(?:\/|$)/i.test(finalUrl.pathname);
      let html: string;
      try {
        html = await readBoundedText(response);
      } catch (error) {
        if (candidatePlaceId)
          return {
            placeId: candidatePlaceId,
            reviewScore: null,
            reviewCount: null,
          };
        throw error;
      }
      const fromHtml = genericSearch ? null : placeIdFromHtml(html);
      const fromFinalHexPair = hexPairFromText(finalUrl.toString());
      const fromHtmlHexPair = genericSearch ? null : hexPairFromText(html);
      const placeId =
        fromFinalUrl ??
        fromHtml ??
        fromFinalHexPair ??
        fromHtmlHexPair ??
        candidatePlaceId;
      if (!placeId) throw new GoogleReviewLinkError("PLACE_ID_NOT_FOUND");
      return {
        placeId,
        ...(options.includeStats
          ? extractGoogleReviewStats(html)
          : { reviewScore: null, reviewCount: null }),
      };
    }
    throw new GoogleReviewLinkError("TOO_MANY_REDIRECTS");
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveGooglePlaceId(
  input: string,
  options: { timeoutMs?: number } = {},
) {
  return (await resolveGoogleListing(input, options)).placeId;
}

export async function extractGoogleReviewLink(
  input: string,
): Promise<ExtractReviewLinkResult> {
  try {
    const listing = await resolveGoogleListing(input, { includeStats: true });
    const serpApiStats =
      listing.reviewScore === null || listing.reviewCount === null
        ? await fetchSerpApiReviewStats(listing.placeId)
        : null;
    return {
      success: true,
      placeId: listing.placeId,
      reviewUrl: generateGoogleReviewUrl(listing.placeId),
      reviewScore: listing.reviewScore ?? serpApiStats?.reviewScore ?? null,
      reviewCount: listing.reviewCount ?? serpApiStats?.reviewCount ?? null,
    };
  } catch {
    return { success: false, error: FRIENDLY_ERROR };
  }
}
