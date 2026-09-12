import Link from "next/link";
import { AnalyticsPageView } from "@/components/public/analytics-client";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import { GoogleReviewSummary } from "@/components/google-review-summary";
import { businessTypeLabel } from "@/lib/domain";
import { safeHttpUrl } from "@/lib/public-actions";
import type { PublicBusiness } from "@/lib/public-business";

export function BusinessPage({
  business,
  preview = false,
  pricingContext,
  pricingSummary,
}: {
  business: PublicBusiness;
  preview?: boolean;
  pricingContext?: { addOnIds: string[]; quantity?: number };
  pricingSummary?: string;
}) {
  const logoUrl = safeHttpUrl(business.logoUrl);

  return (
    <main className="public-action-page">
      {!preview && <AnalyticsPageView slug={business.slug} />}
      {preview && (
        <div className="draft-preview-banner">
          Interactive draft preview — only you can see this page. Links and
          forms work just as they will when published.
        </div>
      )}
      <div className="action-page-shell">
        <header className="action-identity">
          <p className="action-kicker">
            {businessTypeLabel(business.industry, business.customIndustryLabel)}
          </p>
          {logoUrl ? (
            // Owner-provided absolute URLs cannot use next/image without an unsafe wildcard host.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="action-logo"
              src={logoUrl}
              alt={`${business.name} logo`}
              decoding="async"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="action-monogram" aria-hidden="true">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1>{business.name}</h1>
          <GoogleReviewSummary
            business={business}
            href={
              business.modules.some((module) => module.type === "REVIEW")
                ? "#module-review"
                : undefined
            }
          />
          {business.description && (
            <p className="action-description">{business.description}</p>
          )}
        </header>

        <PublicModuleRenderer
          business={business}
          primary={null}
          pricingContext={pricingContext}
          pricingSummary={pricingSummary}
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
