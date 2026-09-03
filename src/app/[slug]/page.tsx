import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import { accessibleBrandColor } from "@/lib/brand";
import { resolvePublicPrimaryAction, safeHttpUrl } from "@/lib/public-actions";
import { getPublicBusiness, type PublicBusiness } from "@/lib/public-business";
import { calculateEstimate, formatMoney } from "@/lib/pricing";
import {
  AnalyticsPageView,
  TrackedLink,
} from "@/components/public/analytics-client";
import { applicationBaseUrl } from "@/lib/environment";
import Link from "next/link";
import { businessTypeLabel } from "@/lib/domain";

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

function primaryFor(business: PublicBusiness) {
  const contact = business.modules.find(
    (module) => module.type === "CALL_WHATSAPP",
  );
  const whatsappMessage =
    contact?.type === "CALL_WHATSAPP"
      ? contact.config.whatsappMessage
      : undefined;
  const primary = resolvePublicPrimaryAction({
    configured: business.primaryAction,
    enabledTypes: business.modules.map((module) => module.type),
    phone: business.phone,
    whatsapp: business.whatsapp,
    whatsappMessage,
    reviewUrl: business.googleReviewUrl,
  });
  if (!primary || contact?.type !== "CALL_WHATSAPP") return primary;
  if (primary.type === "CALL")
    return { ...primary, label: contact.config.callLabel };
  if (primary.type === "WHATSAPP")
    return { ...primary, label: contact.config.whatsappLabel };
  return primary;
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

  const brand = accessibleBrandColor(business.brandColor);
  const primary = primaryFor(business);
  const logoUrl = safeHttpUrl(business.logoUrl);
  const handoff = pricingHandoff(business, query);
  const style = {
    "--action-brand": brand.background,
    "--action-brand-foreground": brand.foreground,
    "--action-brand-border": brand.border,
    "--action-brand-soft": brand.soft,
  } as CSSProperties;

  return (
    <main className="public-action-page" style={style}>
      <AnalyticsPageView slug={business.slug} />
      <div className="action-page-shell">
        <header className="action-identity">
          {logoUrl ? (
            // Owner-provided absolute URLs cannot use next/image without an unsafe wildcard host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="action-logo"
              src={logoUrl}
              alt={`${business.name} logo`}
              width={80}
              height={80}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="action-monogram" aria-hidden="true">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="action-kicker">
              {businessTypeLabel(
                business.industry,
                business.customIndustryLabel,
              )}
            </p>
            <h1>{business.name}</h1>
            {business.description && (
              <p className="action-description">{business.description}</p>
            )}
          </div>
        </header>

        {primary ? (
          <TrackedLink
            className="primary-public-action"
            href={primary.href}
            slug={business.slug}
            eventType={
              primary.type === "CALL"
                ? "CALL_CLICK"
                : primary.type === "WHATSAPP"
                  ? "WHATSAPP_CLICK"
                  : primary.type === "REVIEW"
                    ? "REVIEW_CLICK"
                    : undefined
            }
            {...(primary.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {primary.label}
            {primary.external && (
              <span className="sr-only"> (opens in a new tab)</span>
            )}
          </TrackedLink>
        ) : (
          <p className="action-unavailable">
            Contact details are being updated. Please check back soon.
          </p>
        )}

        <PublicModuleRenderer
          business={business}
          primary={primary}
          pricingContext={handoff?.selection}
          pricingSummary={handoff?.summary}
        />

        <footer className="action-footer">
          <span>{business.name}</span>
          <span aria-hidden="true">•</span>
          <span>Powered by LocalAction</span>
          <span aria-hidden="true">•</span>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </footer>
      </div>
    </main>
  );
}
