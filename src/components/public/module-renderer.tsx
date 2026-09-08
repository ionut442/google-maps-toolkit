import type { ReactNode } from "react";
import {
  BadgeDollarSign,
  ChevronDown,
  ContactRound,
  ExternalLink,
  MapPinned,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import { AreaMap } from "@/components/area-map";
import { ToolIcon } from "@/components/dashboard-ui";
import { TrackedLink } from "@/components/public/analytics-client";
import { PostcodeChecker } from "@/components/public/postcode-checker";
import { PricingEstimator } from "@/components/public/pricing-estimator";
import { QuoteRequestForm } from "@/components/public/quote-request-form";
import { labels, type ModuleType } from "@/lib/domain";
import type { PublicAction } from "@/lib/public-actions";
import {
  createTelHref,
  createWhatsAppUrl,
  safeHttpUrl,
} from "@/lib/public-actions";
import type { PublicBusiness, PublicModule } from "@/lib/public-business";
import { formatMoney, type PricingConfig } from "@/lib/pricing";
import { trustEntryState } from "@/lib/trust";
import { toolDescriptions } from "@/lib/tool-presentation";

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

function ContactPresentation({
  business,
  module,
}: {
  business: PublicBusiness;
  module: Extract<PublicModule, { type: "CALL_WHATSAPP" }>;
}) {
  const callHref = createTelHref(business.phone);
  const whatsappHref = createWhatsAppUrl(
    business.whatsapp,
    module.config.whatsappMessage,
  );
  const actions = [
    callHref
      ? {
          type: "CALL" as const,
          label: module.config.callLabel,
          href: callHref,
          external: false,
          icon: Phone,
        }
      : null,
    whatsappHref
      ? {
          type: "WHATSAPP" as const,
          label: module.config.whatsappLabel,
          href: whatsappHref,
          external: true,
          icon: MessageCircle,
        }
      : null,
  ].filter(Boolean);
  if (!actions.length) return null;
  return (
    <section
      className="action-module public-quick-actions"
      aria-labelledby="contact-heading"
    >
      <h2 className="sr-only" id="contact-heading">
        Other ways to contact {business.name}
      </h2>
      <div>
        {actions.map(
          (action) =>
            action && (
              <TrackedLink
                className="public-quick-action"
                href={action.href}
                key={action.type}
                slug={business.slug}
                eventType={
                  action.type === "CALL" ? "CALL_CLICK" : "WHATSAPP_CLICK"
                }
                {...externalProps(action.external)}
              >
                <action.icon size={21} aria-hidden="true" />
                <span>{action.label}</span>
                {action.external && (
                  <span className="sr-only"> (opens in a new tab)</span>
                )}
              </TrackedLink>
            ),
        )}
      </div>
    </section>
  );
}

function PricingPresentation({
  module,
  primary,
}: {
  module: Extract<PublicModule, { type: "PRICING" }>;
  primary: PublicAction | null;
}) {
  return (
    <section
      className="action-module public-pricing-module"
      aria-labelledby="pricing-heading"
    >
      <div className="public-module-heading">
        <BadgeDollarSign size={25} aria-hidden="true" />
        <div>
          <p className="action-kicker">Pricing</p>
          <h2 id="pricing-heading">{module.config.label}</h2>
        </div>
      </div>
      {module.config.mode === "HOURLY" ? (
        <div className="hourly-price">
          <strong>
            {formatMoney(module.config.amountMinor, module.config.currency)}
          </strong>
          <span>/ hour</span>
          {module.config.note && <p>{module.config.note}</p>}
        </div>
      ) : module.config.mode === "PRICE_LIST" ? (
        <PublicPriceList config={module.config} />
      ) : (
        <PricingEstimator
          config={module.config}
          ctaHref={primary?.type === "QUOTE_REQUEST" ? "#quote" : primary?.href}
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
    </section>
  );
}

function PublicPriceList({
  config,
}: {
  config: Extract<PricingConfig, { mode: "PRICE_LIST" }>;
}) {
  return (
    <div className="public-price-categories">
      {config.categories.map((category) => (
        <section key={category.id}>
          {(config.categories.length > 1 || category.name !== "Services") && (
            <h3>{category.name}</h3>
          )}
          {category.items.map((item) => (
            <div className="public-price-row" key={item.id}>
              <span>
                <strong>{item.name}</strong>
                {item.description && <small>{item.description}</small>}
              </span>
              <strong>
                {item.pricePrefix === "FROM" ? "From " : ""}
                {formatMoney(item.amountMinor, config.currency)}
              </strong>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function ServiceAreaPresentation({
  module,
  primary,
}: {
  module: Extract<PublicModule, { type: "SERVICE_AREA" }>;
  primary: PublicAction | null;
}) {
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
    <section
      className="action-module public-service-area"
      aria-labelledby="area-heading"
    >
      <div className="public-module-heading">
        <MapPinned size={25} aria-hidden="true" />
        <div>
          <p className="action-kicker">Service area</p>
          <h2 id="area-heading">{module.config.label}</h2>
        </div>
      </div>
      {points.length > 0 && (
        <>
          <AreaMap points={points} compact />
          <p className="map-note">
            The map frames this business&apos;s saved service areas.
          </p>
        </>
      )}
      {module.config.areas.length > 0 && (
        <ul className="chip-list">
          {module.config.areas.map((area) => (
            <li key={area.id}>{area.name}</li>
          ))}
        </ul>
      )}
      {module.config.postalCodes.length > 0 && (
        <PostcodeChecker
          config={module.config}
          ctaHref={primary?.href}
          ctaLabel={primary?.label}
        />
      )}
    </section>
  );
}

function TrustPresentation({
  business,
  module,
}: {
  business: PublicBusiness;
  module: Extract<PublicModule, { type: "TRUST" }>;
}) {
  const entries = module.config.entries.filter(
    (entry) => trustEntryState(entry.expiresOn) !== "EXPIRED",
  );
  if (!entries.length) return null;
  return (
    <section
      className="action-module public-trust-module"
      aria-labelledby="trust-heading"
    >
      <div className="public-module-heading">
        <ShieldCheck size={25} aria-hidden="true" />
        <div>
          <p className="action-kicker">Credentials & reassurance</p>
          <h2 id="trust-heading">{module.config.label}</h2>
        </div>
      </div>
      <ul className="trust-list">
        {entries.map((item) => {
          const evidence = (business.trustEvidence ?? []).filter(
            (file) => file.entryId === item.id,
          );
          return (
            <li key={item.id}>
              <ShieldCheck size={20} aria-hidden="true" />
              <span>
                <strong>{item.name}</strong>
                {item.description && <span>{item.description}</span>}
                {item.referenceNumber && (
                  <small>Reference: {item.referenceNumber}</small>
                )}
                {item.expiresOn && (
                  <small>
                    Valid until {formatCredentialExpiry(item.expiresOn)}
                  </small>
                )}
                {evidence.length > 0 && (
                  <span className="public-credential-files">
                    {evidence.map((file) => (
                      <a
                        href={`/trust-evidence/${file.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        key={file.id}
                      >
                        {file.mediaType.startsWith("image/") ? (
                          // Dynamic owner uploads are served through the public evidence route.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="public-credential-image"
                            src={`/trust-evidence/${file.id}`}
                            alt={`${item.name}: ${file.originalFilename}`}
                            loading="lazy"
                          />
                        ) : (
                          `View ${file.originalFilename}`
                        )}
                      </a>
                    ))}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="trust-disclaimer">Information provided by this business.</p>
    </section>
  );
}

export function formatCredentialExpiry(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export const publicModuleRegistry: Record<ModuleType, RegistryEntry> = {
  CALL_WHATSAPP: {
    analyticsEvent: "contact_action_selected",
    render: ({ business, module }) =>
      module.type === "CALL_WHATSAPP" ? (
        <ContactPresentation business={business} module={module} />
      ) : null,
  },
  QUOTE_REQUEST: {
    analyticsEvent: "quote_surface_viewed",
    render: ({ business, module, pricingContext, pricingSummary }) =>
      module.type === "QUOTE_REQUEST" ? (
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
      ) : null,
  },
  PRICING: {
    analyticsEvent: "pricing_surface_viewed",
    render: ({ module, primary }) =>
      module.type === "PRICING" ? (
        <PricingPresentation module={module} primary={primary} />
      ) : null,
  },
  SERVICE_AREA: {
    analyticsEvent: "service_area_viewed",
    render: ({ module, primary }) =>
      module.type === "SERVICE_AREA" ? (
        <ServiceAreaPresentation module={module} primary={primary} />
      ) : null,
  },
  TRUST: {
    analyticsEvent: "trust_signals_viewed",
    render: ({ business, module }) =>
      module.type === "TRUST" ? (
        <TrustPresentation business={business} module={module} />
      ) : null,
  },
  FAQ: {
    analyticsEvent: "faq_viewed",
    render: ({ module }) =>
      module.type !== "FAQ" || !module.config.suggestedFaqs.length ? null : (
        <section
          className="action-module public-faq-module"
          aria-labelledby="faq-heading"
        >
          <p className="action-kicker">Frequently asked questions</p>
          <h2 id="faq-heading">Questions customers often ask</h2>
          <div className="public-faq-list">
            {module.config.suggestedFaqs.map((faq, index) => (
              <details key={index + "-" + faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ),
  },
  REVIEW: {
    analyticsEvent: "review_link_selected",
    render: ({ business, module }) => {
      if (module.type !== "REVIEW") return null;
      const href = safeHttpUrl(business.googleReviewUrl);
      return href ? (
        <section
          className="action-module compact-action-module public-review-module"
          aria-labelledby="review-heading"
        >
          <Star size={26} aria-hidden="true" />
          <div>
            <p className="action-kicker">Customer feedback</p>
            <h2 id="review-heading">Find us on Google</h2>
            <p>
              Had a good experience? Your review helps other local customers.
            </p>
          </div>
          <TrackedLink
            className="action-link"
            href={href}
            slug={business.slug}
            eventType="REVIEW_CLICK"
            target="_blank"
            rel="noopener noreferrer"
          >
            {module.config.label || "Leave Us a Review"}{" "}
            <ExternalLink size={17} aria-hidden="true" />
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
          className="action-module compact-action-module public-save-contact"
          aria-labelledby="save-heading"
        >
          <ContactRound size={26} aria-hidden="true" />
          <div>
            <p className="action-kicker">Keep the details</p>
            <h2 id="save-heading">Save this business</h2>
            <p>Add the phone number and email to your contacts.</p>
          </div>
          <a
            className="action-link"
            href={"/" + business.slug + "/contact.vcf"}
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
      {business.modules.map((module) => {
        const content = publicModuleRegistry[module.type].render({
          business,
          module,
          primary,
          pricingContext,
          pricingSummary,
        });
        if (content === null || content === undefined) return null;
        return (
          <details
            className="public-tool-card"
            key={module.type}
            data-module={module.type.toLowerCase()}
          >
            <summary>
              <span className="public-tool-summary">
                <ToolIcon type={module.type} />
                <span>
                  <strong>{labels[module.type]}</strong>
                  <small>{toolDescriptions[module.type]}</small>
                </span>
              </span>
              <ChevronDown
                className="public-tool-chevron"
                size={21}
                aria-hidden="true"
              />
            </summary>
            <div className="public-tool-panel">{content}</div>
          </details>
        );
      })}
    </div>
  );
}
