import { findPublicBusinessBySlug } from "@/lib/public-business";
import { createVCard, vCardFilename } from "@/lib/vcard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const business = await findPublicBusinessBySlug(slug);
  if (!business) return new Response("Not found", { status: 404 });
  const card = createVCard({
    name: business.name,
    phone: business.phone,
    email: business.email,
    website: business.website,
  });
  return new Response(card, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vCardFilename(business.slug)}"`,
      "Cache-Control": "no-store",
    },
  });
}
