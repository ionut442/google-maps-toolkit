import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BusinessPage } from "@/components/public/business-page";
import { getPublicBusiness, type PublicBusiness } from "@/lib/public-business";
import { calculateEstimate, formatMoney } from "@/lib/pricing";
import { applicationBaseUrl } from "@/lib/environment";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function metadataUrl(path: string) {
  return new URL(path, `${applicationBaseUrl()}/`);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicBusiness(slug);
  if (!business) {
    return {
      title: "Business not found",
      robots: { index: false, follow: false },
    };
  }
  const title = `${business.name} | Contact, quote and service details`;
  const description =
    business.description ||
    `Contact ${business.name}, request a quote and view service details.`;
  const canonical = metadataUrl(business.slug);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: business.name,
      title,
      description,
    },
    twitter: { card: "summary", title, description },
  };
}

function pricingHandoff(
  business: PublicBusiness,
  query: Record<string, string | string[] | undefined>,
) {
  const addOnIds = (
    Array.isArray(query.estimateAddOn)
      ? query.estimateAddOn
      : query.estimateAddOn
        ? [query.estimateAddOn]
        : []
  ).slice(0, 12);
  const hasQuantity = typeof query.estimateQuantity === "string";
  if (!addOnIds.length && !hasQuantity) return null;
  const pricing = business.modules.find((item) => item.type === "PRICING");
  if (pricing?.type !== "PRICING" || pricing.config.mode !== "SIMPLE_ESTIMATE")
    return null;
  const selection = {
    addOnIds,
    ...(hasQuantity ? { quantity: Number(query.estimateQuantity) } : {}),
  };
  try {
    const result = calculateEstimate(pricing.config, selection);
    const details = [
      ...result.addOns.map((item) => item.label),
      ...(result.quantity === undefined ? [] : [`quantity ${result.quantity}`]),
    ];
    return {
      selection,
      summary: `${formatMoney(result.totalMinor, pricing.config.currency)} estimate${details.length ? ` (${details.join(", ")})` : ""}`,
    };
  } catch {
    return null;
  }
}

export default async function PublicActionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const business = await getPublicBusiness(slug);
  if (!business) notFound();

  const handoff = pricingHandoff(business, query);
  return (
    <BusinessPage
      business={business}
      pricingContext={handoff?.selection}
      pricingSummary={handoff?.summary}
    />
  );
}
