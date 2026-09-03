import type { ReactNode } from "react";
import type { ModuleType } from "@/lib/domain";
import type { PublicAction } from "@/lib/public-actions";
import {
  createTelHref,
  createWhatsAppUrl,
  safeHttpUrl,
} from "@/lib/public-actions";
import type { PublicBusiness, PublicModule } from "@/lib/public-business";
import { QuoteRequestForm } from "@/components/public/quote-request-form";
import { PricingEstimator } from "@/components/public/pricing-estimator";
import { PostcodeChecker } from "@/components/public/postcode-checker";
import { formatMoney } from "@/lib/pricing";
import { trustEntryState } from "@/lib/trust";
import { TrackedLink } from "@/components/public/analytics-client";
import { AreaMap } from "@/components/area-map";

type RendererContext = {
  business: PublicBusiness;
  module: PublicModule;
  primary: PublicAction | null;
  pricingContext?: { addOnIds: string[]; quantity?: number };
  pricingSummary?: string;
};

type RegistryEntry = {
  analyticsEvent: string;
  render: (context: RendererContext) => ReactNode;
};

function externalProps(external = false) {
  return external ? { target: "_blank", rel: "noopener noreferrer" } : {};
}

export const publicModuleRegistry: Record<ModuleType, RegistryEntry> = {
  CALL_WHATSAPP: {
    analyticsEvent: "contact_action_selected",
    render: ({ business, module, primary }) => {
      if (module.type !== "CALL_WHATSAPP") return null;
      const callHref = createTelHref(business.phone);
      const whatsappHref = createWhatsAppUrl(
        business.whatsapp,
        module.config.whatsappMessage,
      );
      const actions = [
        callHref && {
          type: "CALL",
          label: module.config.callLabel,
          href: callHref,
          external: false,
        },
        whatsappHref && {
          type: "WHATSAPP",
          label: module.config.whatsappLabel,
          href: whatsappHref,
          external: true,
        },
      ].filter(Boolean) as Array<{
        type: string;
        label: string;
        href: string;
        external: boolean;
      }>;
      if (!actions.length) return null;
      return (
        <section className="action-module" aria-labelledby="contact-heading">
          <p className="action-kicker">Get in touch</p>
          <h2 id="contact-heading">Talk to {business.name}</h2>
          <div className="action-button-grid">
            {actions.map((action) => (
              <TrackedLink
                className={
                  action.type === primary?.type
                    ? "action-link subdued"
                    : "action-link"
                }
                href={action.href}
                key={action.type}
                slug={business.slug}
                eventType={
                  action.type === "CALL" ? "CALL_CLICK" : "WHATSAPP_CLICK"
                }
                {...externalProps(action.external)}
              >
                {action.label}
                {action.external && (
                  <span className="sr-only"> (opens in a new tab)</span>
                )}
              </TrackedLink>
            ))}
          </div>
        </section>
      );
    },
  },
  QUOTE_REQUEST: {
    analyticsEvent: "quote_surface_viewed",
    render: ({ business, module, pricingContext, pricingSummary }) => {
      if (module.type !== "QUOTE_REQUEST") return null;
      return (
        <section
          className="action-module action-module-accent"
          id="quote"
          aria-labelledby="quote-heading"
        >
          <p className="action-kicker">{module.config.label}</p>
          <h2 id="quote-heading">Tell us what you need</h2>
          <p>
            {module.config.intro ||
              "Share a few details and we’ll get back to you."}
          </p>
          <QuoteRequestForm
            slug={business.slug}
            config={module.config}
            pricingContext={pricingContext}
            pricingSummary={pricingSummary}
          />
        </section>
      );
    },
  },
  PRICING: {
    analyticsEvent: "pricing_surface_viewed",
    render: ({ module, primary }) =>
      module.type === "PRICING" ? (
        <details
          className="action-module public-tool-card"
          aria-labelledby="pricing-heading"
        >
          <summary>
            <span>
              <span className="action-kicker">Pricing</span>
              <strong id="pricing-heading">{module.config.label}</strong>
            </span>
            <span>View prices →</span>
          </summary>
          {module.config.mode === "HOURLY" ? (
            <div className="hourly-price">
              <strong>
                {formatMoney(module.config.amountMinor, module.config.currency)}
              </strong>
              <span>/ hour</span>
              {module.config.note && <p>{module.config.note}</p>}
            </div>
          ) : module.config.mode === "PRICE_LIST" ? (
            <div className="public-price-categories">
              {module.config.categories.map((category) => (
                <details key={category.id}>
                  <summary>
                    <span>
                      <strong>{category.name}</strong>
                      <small>
                        {category.items.length}{" "}
                        {category.items.length === 1 ? "service" : "services"}
                      </small>
                    </span>
                    <span>View prices</span>
                  </summary>
                  <div>
                    {category.items.map((item) => (
                      <div className="public-price-row" key={item.id}>
                        <span>
                          {item.name}
                          {item.description && (
                            <small>{item.description}</small>
                          )}
                        </span>
                        <strong>
                          {item.pricePrefix === "FROM" ? "From " : ""}
                          {formatMoney(
                            item.amountMinor,
                            module.config.currency,
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <PricingEstimator
              config={module.config}
              ctaHref={
                primary?.type === "QUOTE_REQUEST" ? "#quote" : primary?.href
              }
              ctaLabel={
                primary?.type === "QUOTE_REQUEST"
                  ? "Get Exact Quote"
                  : primary?.label
              }
            />
          )}
          {(module.config.mode === "PRICE_LIST" ||
            module.config.mode === "HOURLY") &&
            primary && (
              <a className="action-link" href={primary.href}>
                {primary.type === "QUOTE_REQUEST"
                  ? "Request Exact Quote"
                  : primary.label}
              </a>
            )}
        </details>
      ) : null,
  },
  SERVICE_AREA: {
    analyticsEvent: "service_area_viewed",
    render: ({ module, primary }) => {
      if (module.type !== "SERVICE_AREA") return null;
      if (!module.config.areas.length && !module.config.postalCodes.length)
        return null;
      const points = module.config.areas.flatMap((area) =>
        "latitude" in area
          ? [
              {
                name: area.name,
                latitude: area.latitude,
                longitude: area.longitude,
              },
            ]
          : [],
      );
      return (
        <details
          className="action-module public-tool-card"
          aria-labelledby="area-heading"
        >
          <summary>
            <span>
              <span className="action-kicker">Service area</span>
              <strong id="area-heading">
                {module.config.areas.length + module.config.postalCodes.length}{" "}
                areas listed
              </strong>
            </span>
            <span>See where we work →</span>
          </summary>
          <ul className="chip-list">
            {module.config.areas.map((value) => (
              <li key={value.id}>{value.name}</li>
            ))}
          </ul>
          {points.length > 0 && (
            <>
              <p className="map-note">
                Markers show area centres, not exact service boundaries.
              </p>
              <AreaMap points={points} compact />
            </>
          )}
          {module.config.postalCodes.length > 0 && (
            <PostcodeChecker
              config={module.config}
              ctaHref={primary?.href}
              ctaLabel={primary?.label}
            />
          )}
        </details>
      );
    },
  },
  TRUST: {
    analyticsEvent: "trust_signals_viewed",
    render: ({ module }) => {
      if (module.type !== "TRUST") return null;
      const entries = module.config.entries.filter(
        (entry) => trustEntryState(entry.expiresOn) !== "EXPIRED",
      );
      if (!entries.length) return null;
      return (
        <details
          className="action-module public-tool-card"
          aria-labelledby="trust-heading"
        >
          <summary>
            <span>
              <span className="action-kicker">Credentials</span>
              <strong id="trust-heading">
                {entries.length}{" "}
                {entries.length === 1 ? "credential" : "credentials"}
              </strong>
            </span>
            <span>View credentials →</span>
          </summary>
          <p>
            <small>Information provided by business.</small>
          </p>
          <ul className="trust-list">
            {entries.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {item.description && <span>{item.description}</span>}
                {item.referenceNumber && (
                  <small>Reference: {item.referenceNumber}</small>
                )}
              </li>
            ))}
          </ul>
        </details>
      );
    },
  },
  FAQ: {
    analyticsEvent: "faq_viewed",
    render: ({ module }) => {
      if (module.type !== "FAQ" || !module.config.suggestedFaqs.length)
        return null;
      return (
        <section className="action-module" aria-labelledby="faq-heading">
          <p className="action-kicker">Frequently asked questions</p>
          <h2 id="faq-heading">
            {module.config.suggestedFaqs.length} questions
          </h2>
          <div className="public-faq-list">
            {module.config.suggestedFaqs.map((faq, index) => (
              <details key={`${index}-${faq.question}`}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      );
    },
  },
  REVIEW: {
    analyticsEvent: "review_link_selected",
    render: ({ business, module }) => {
      if (module.type !== "REVIEW") return null;
      const href = safeHttpUrl(business.googleReviewUrl);
      return href ? (
        <section className="action-module" aria-labelledby="review-heading">
          <p className="action-kicker">Customer feedback</p>
          <h2 id="review-heading">Find us on Google</h2>
          <TrackedLink
            className="action-link"
            href={href}
            slug={business.slug}
            eventType="REVIEW_CLICK"
            target="_blank"
            rel="noopener noreferrer"
          >
            ⭐ {module.config.label || "Leave Us a Review"}
            <span className="sr-only"> (opens in a new tab)</span>
          </TrackedLink>
        </section>
      ) : null;
    },
  },
  SAVE_CONTACT: {
    analyticsEvent: "contact_card_downloaded",
    render: ({ business, module }) =>
      module.type === "SAVE_CONTACT" ? (
        <section
          className="action-module compact-module"
          aria-labelledby="save-heading"
        >
          <div>
            <p className="action-kicker">Keep the details</p>
            <h2 id="save-heading">Save this business</h2>
          </div>
          <a
            className="action-link"
            href={`/${business.slug}/contact.vcf`}
            download
          >
            {module.config.label}
          </a>
        </section>
      ) : null,
  },
};

export function PublicModuleRenderer({
  business,
  primary,
  pricingContext,
  pricingSummary,
}: {
  business: PublicBusiness;
  primary: PublicAction | null;
  pricingContext?: { addOnIds: string[]; quantity?: number };
  pricingSummary?: string;
}) {
  return (
    <div className="action-modules">
      {business.modules.map((module) => (
        <div key={module.type} data-module={module.type.toLowerCase()}>
          {publicModuleRegistry[module.type].render({
            business,
            module,
            primary,
            pricingContext,
            pricingSummary,
          })}
        </div>
      ))}
    </div>
  );
}
