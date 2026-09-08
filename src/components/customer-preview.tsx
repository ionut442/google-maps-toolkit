import Link from "next/link";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import { businessTypeLabel } from "@/lib/domain";
import { safeHttpUrl } from "@/lib/public-actions";
import { toPublicBusiness } from "@/lib/public-business";

type PreviewBusiness = {
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  brandColor: string;
  industry: string;
  customIndustryLabel: string | null;
  googleReviewUrl: string | null;
  primaryAction: string | null;
  modules: Array<{
    type: string;
    enabled: boolean;
    sortOrder: number;
    config: string;
  }>;
  trustEvidence?: Array<{
    id: string;
    entryId: string;
    mediaType: string;
    originalFilename: string;
  }>;
};

export function CustomerPreview({ business }: { business: PreviewBusiness }) {
  const safeBusiness = toPublicBusiness(business);
  const logoUrl = safeHttpUrl(safeBusiness.logoUrl);

  return (
    <div className="customer-preview-frame">
      <div className="preview-browser-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>Draft preview</strong>
      </div>
      <div className="customer-preview-viewport">
        <div className="customer-preview-page">
          <header className="action-identity">
            <p className="action-kicker">
              {businessTypeLabel(
                safeBusiness.industry,
                safeBusiness.customIndustryLabel,
              )}
            </p>
            {logoUrl ? (
              // Owner-provided absolute URLs cannot use next/image safely.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="action-logo"
                src={logoUrl}
                alt=""
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="action-monogram" aria-hidden="true">
                {safeBusiness.name.charAt(0).toUpperCase()}
              </div>
            )}
            <h1>{safeBusiness.name}</h1>
            <p className="action-description">
              {safeBusiness.description ||
                "Your business description appears here."}
            </p>
          </header>
          <PublicModuleRenderer business={safeBusiness} primary={null} />
        </div>
      </div>
      <p className="preview-interaction-note">
        Links and forms work in this draft.
        <Link
          href={`/preview/${encodeURIComponent(safeBusiness.slug)}`}
          target="_blank"
        >
          Open full interactive preview
        </Link>
      </p>
    </div>
  );
}
