import type { CSSProperties } from "react";
import { ExternalLink } from "lucide-react";
import { PublicModuleRenderer } from "@/components/public/module-renderer";
import { accessibleBrandColor } from "@/lib/brand";
import {
  businessTypeLabel,
  moduleTypes,
  safeParseModuleConfig,
  type ModuleType,
} from "@/lib/domain";
import {
  resolvePublicPrimaryAction,
  safeHttpUrl,
  type PublicAction,
} from "@/lib/public-actions";
import type { PublicBusiness, PublicModule } from "@/lib/public-business";

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
};

function publicModules(business: PreviewBusiness): PublicModule[] {
  return business.modules
    .filter(
      (module) =>
        module.enabled && moduleTypes.includes(module.type as ModuleType),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((module) => {
      const type = module.type as ModuleType;
      try {
        const config = safeParseModuleConfig(type, JSON.parse(module.config));
        return config
          ? ({ type, sortOrder: module.sortOrder, config } as PublicModule)
          : null;
      } catch {
        return null;
      }
    })
    .filter((module): module is PublicModule => Boolean(module));
}

function primaryFor(business: PublicBusiness): PublicAction | null {
  const contact = business.modules.find(
    (module) => module.type === "CALL_WHATSAPP",
  );
  const primary = resolvePublicPrimaryAction({
    configured: business.primaryAction,
    enabledTypes: business.modules.map((module) => module.type),
    phone: business.phone,
    whatsapp: business.whatsapp,
    whatsappMessage:
      contact?.type === "CALL_WHATSAPP"
        ? contact.config.whatsappMessage
        : undefined,
    reviewUrl: business.googleReviewUrl,
  });
  if (!primary || contact?.type !== "CALL_WHATSAPP") return primary;
  if (primary.type === "CALL")
    return { ...primary, label: contact.config.callLabel };
  if (primary.type === "WHATSAPP")
    return { ...primary, label: contact.config.whatsappLabel };
  return primary;
}

export function CustomerPreview({ business }: { business: PreviewBusiness }) {
  const safeBusiness: PublicBusiness = {
    name: business.name,
    slug: business.slug,
    logoUrl: business.logoUrl,
    description: business.description,
    phone: business.phone,
    whatsapp: business.whatsapp,
    email: business.email,
    website: business.website,
    brandColor: business.brandColor,
    industry: business.industry,
    customIndustryLabel: business.customIndustryLabel,
    googleReviewUrl: business.googleReviewUrl,
    primaryAction: business.primaryAction,
    modules: publicModules(business),
  };
  const brand = accessibleBrandColor(safeBusiness.brandColor);
  const primary = primaryFor(safeBusiness);
  const logoUrl = safeHttpUrl(safeBusiness.logoUrl);
  const style = {
    "--action-brand": brand.background,
    "--action-brand-foreground": brand.foreground,
    "--action-brand-border": brand.border,
    "--action-brand-soft": brand.soft,
  } as CSSProperties;

  return (
    <div className="customer-preview-frame" style={style}>
      <div className="preview-browser-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="customer-preview-viewport">
        <div className="customer-preview-page" inert>
          <header className="action-identity">
            {logoUrl ? (
              // Owner-provided absolute URLs cannot use next/image safely.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="action-logo"
                src={logoUrl}
                alt=""
                width={80}
                height={80}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="action-monogram" aria-hidden="true">
                {safeBusiness.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="action-kicker">
                {businessTypeLabel(
                  safeBusiness.industry,
                  safeBusiness.customIndustryLabel,
                )}
              </p>
              <h1>{safeBusiness.name}</h1>
              <p className="action-description">
                {safeBusiness.description ||
                  "Your business description appears here."}
              </p>
            </div>
          </header>
          {primary ? (
            <span className="primary-public-action">
              {primary.label}
              {primary.external && (
                <ExternalLink size={17} aria-hidden="true" />
              )}
            </span>
          ) : (
            <p className="preview-empty-action">
              Choose a main action to show it here.
            </p>
          )}
          <PublicModuleRenderer business={safeBusiness} primary={primary} />
        </div>
      </div>
      <p className="preview-interaction-note">
        Preview only — links and forms are disabled here.
      </p>
    </div>
  );
}
