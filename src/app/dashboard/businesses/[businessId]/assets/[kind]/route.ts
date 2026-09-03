import { currentUser } from "@/lib/auth";
import { findOwnedBusiness } from "@/lib/business";
import { generateQrPng } from "@/lib/qr";
import {
  generatePrintableReviewSign,
  generateSocialReviewGraphic,
} from "@/lib/review-assets";
import { publicBusinessUrl, safeDownloadSlug } from "@/lib/public-url";
import { safeHttpUrl } from "@/lib/public-actions";

const kinds = [
  "business-page-qr",
  "review-qr",
  "printable-review-sign",
  "social-review-graphic",
] as const;
type Kind = (typeof kinds)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string; kind: string }> },
) {
  const user = await currentUser();
  if (!user) return new Response("Not found", { status: 404 });
  const { businessId, kind: rawKind } = await params;
  if (!kinds.includes(rawKind as Kind))
    return new Response("Not found", { status: 404 });
  const business = await findOwnedBusiness(user.id, businessId);
  if (!business) return new Response("Not found", { status: 404 });
  const kind = rawKind as Kind;
  const reviewUrl = safeHttpUrl(business.googleReviewUrl);
  if (kind === "business-page-qr" && !business.published)
    return new Response("Publish business first", { status: 409 });
  if (kind !== "business-page-qr" && !reviewUrl)
    return new Response("Configure a valid review URL first", { status: 409 });
  let bytes: Buffer;
  if (kind === "business-page-qr")
    bytes = await generateQrPng(publicBusinessUrl(business.slug));
  else if (kind === "review-qr") bytes = await generateQrPng(reviewUrl!);
  else if (kind === "printable-review-sign")
    bytes = await generatePrintableReviewSign({
      name: business.name,
      brandColor: business.brandColor,
      googleReviewUrl: reviewUrl!,
      logoUrl: business.logoUrl,
    });
  else
    bytes = await generateSocialReviewGraphic({
      name: business.name,
      brandColor: business.brandColor,
      googleReviewUrl: reviewUrl!,
      logoUrl: business.logoUrl,
    });
  const base = safeDownloadSlug(business.name);
  const suffix: Record<Kind, string> = {
    "business-page-qr": "business-page-qr",
    "review-qr": "review-qr",
    "printable-review-sign": "printable-review-sign",
    "social-review-graphic": "social-review-graphic",
  };
  const download = new URL(request.url).searchParams.get("download") === "1";
  const body = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${base}-${suffix[kind]}.png"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
