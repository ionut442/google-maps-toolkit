import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/public/business-page";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { toPublicBusiness } from "@/lib/public-business";

export const metadata: Metadata = {
  title: "Draft page preview",
  robots: { index: false, follow: false },
};

export default async function DraftPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const { slug } = await params;
  if (business.slug !== slug) notFound();

  return <BusinessPage business={toPublicBusiness(business)} preview />;
}
