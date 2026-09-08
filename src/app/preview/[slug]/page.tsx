import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/public/business-page";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { toPublicBusiness } from "@/lib/public-business";
import { listOwnedTrustEvidence } from "@/lib/trust-evidence";

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
  const trustEvidence = await listOwnedTrustEvidence(user.id, business.id);

  return (
    <BusinessPage
      business={toPublicBusiness({ ...business, trustEvidence })}
      preview
    />
  );
}
