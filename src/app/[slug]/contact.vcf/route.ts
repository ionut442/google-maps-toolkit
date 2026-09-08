import { findPublicBusinessBySlug } from "@/lib/public-business";
import { toPublicBusiness } from "@/lib/public-business";
import { currentUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { createVCard, vCardFilename } from "@/lib/vcard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let business = await findPublicBusinessBySlug(slug);
  if (!business) {
    const user = await currentUser();
    if (user) {
      const owned = await requireOwnedBusiness(user.id);
      if (owned.slug === slug) business = toPublicBusiness(owned);
    }
  }
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
