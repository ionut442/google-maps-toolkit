import { db } from "@/lib/db";
import {
  mediaTypeForLogoFilename,
  storedLogoObjectKey,
} from "@/lib/business-logo";
import { privateStorage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; filename: string }> },
) {
  const { slug, filename } = await params;
  const business = await db.business.findUnique({
    where: { slug },
    select: { id: true, logoUrl: true },
  });
  if (!business) return new Response("Not found", { status: 404 });
  const stored = storedLogoObjectKey({
    businessId: business.id,
    slug,
    logoUrl: business.logoUrl,
  });
  const mediaType = mediaTypeForLogoFilename(filename);
  if (!stored || stored.filename !== filename || !mediaType)
    return new Response("Not found", { status: 404 });
  try {
    const bytes = await privateStorage.read(stored.objectKey);
    const body = Uint8Array.from(bytes).buffer;
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(bytes.byteLength),
        "Content-Type": mediaType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
