import type { ReactNode } from "react";
import {
  ChevronDown,
  ExternalLink,
  MapPin,
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
import { promotionIsExpired } from "@/lib/promotions";
import { weekDayLabels } from "@/lib/work-hours";
import { trustEntryState } from "@/lib/trust";

function cityName(value: string) {
  return value.split(",", 1)[0]?.trim() || value;
}

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

const moduleKickers: Record<ModuleType, string> = {
  CALL_WHATSAPP: "Contact",
  QUOTE_REQUEST: "Get a quote",
  PROMOTIONS: "Special offers",
  PRICING: "Pricing",
  SERVICES: "Services",
  SERVICE_AREA: "Service area",
  WORK_HOURS: "Availability",
  TRUST: "Trust & credentials",
  FAQ: "FAQs",
  REVIEW: "Customer feedback",
  SAVE_CONTACT: "Keep the details",
};

function modulePreview(module: PublicModule, business: PublicBusiness) {
  switch (module.type) {
    case "CALL_WHATSAPP":
      return (
        <>
          <strong>{business.phone}</strong>
          {module.config.emergencyEnabled && module.config.emergencyLabel
            ? ` · ${module.config.emergencyLabel}`
            : " · Call or message in one tap"}
        </>
      );
    case "QUOTE_REQUEST":
      return module.config.intro || "A few quick questions · quick to send";
    case "PROMOTIONS": {
      const active = module.config.offers.filter(
        (offer) => !promotionIsExpired(offer.validUntil),
      );
      return `${active.length} active ${active.length === 1 ? "offer" : "offers"}`;
    }
    case "PRICING":
      if (module.config.mode === "HOURLY")
        return `From ${formatMoney(module.config.amountMinor, module.config.currency)} per hour`;
      if (module.config.mode === "PRICE_LIST") {
        const first = module.config.categories.flatMap(
          (category) => category.items,
        )[0];
        return first
          ? `${first.name} · ${first.pricePrefix === "FROM" ? "from " : ""}${formatMoney(first.amountMinor, module.config.currency)}`
          : "Clear starting prices";
      }
      return "Build a quick starting estimate";
    case "SERVICES":
      return (
        module.config.categories
          .flatMap((category) => category.items)
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ") || "See what this business offers"
      );
    case "SERVICE_AREA": {
      return module.config.areas.length
        ? `${module.config.areas.length} service ${module.config.areas.length === 1 ? "area" : "areas"}`
        : `${module.config.postalCodes.length} covered postcodes`;
    }
    case "WORK_HOURS":
      return "See this week’s availability";
    case "TRUST":
      return `${module.config.entries.length} business-provided ${module.config.entries.length === 1 ? "credential" : "credentials"}`;
    case "FAQ":
      return `${module.config.suggestedFaqs.length} common ${module.config.suggestedFaqs.length === 1 ? "question" : "questions"}`;
    case "REVIEW":
      return business.googleReviewScore !== null
        ? `${business.googleReviewScore.toFixed(1)} · ${business.googleReviewCount ?? "Google"} reviews`
        : "Read or leave a Google review";
    case "SAVE_CONTACT":
      return "Add phone & email to your contacts";
  }
}

function promotionRequestAction(
  business: PublicBusiness,
  offer: Extract<
    PublicModule,
    { type: "PROMOTIONS" }
  >["config"]["offers"][number],
) {
  if (offer.requestMethod === "WHATSAPP") {
    const href = createWhatsAppUrl(
      business.whatsapp || business.phone,
      `Hi, I'm interested in the offer: ${offer.title}.`,
    );
    return href
      ? { href, external: true, eventType: "WHATSAPP_CLICK" as const }
      : null;
  }
  if (offer.requestMethod === "EMAIL") {
    const email = business.email.trim();
    if (!email) return null;
    const subject = encodeURIComponent(`Offer enquiry: ${offer.title}`);
    const body = encodeURIComponent(
      `Hi, I'm interested in the offer: ${offer.title}.`,
    );
    return {
      href: `mailto:${email}?subject=${subject}&body=${body}`,
      external: false,
      eventType: undefined,
    };
  }
  const href = createTelHref(business.phone);
  return href
    ? { href, external: false, eventType: "CALL_CLICK" as const }
    : null;
}

function WhatsAppIcon({ size = 21 }: { size?: number }) {
  return (
    <svg
      className="whatsapp-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.5 11.7a8.5 8.5 0 0 1-12.58 7.45L3.5 20.5l1.4-4.28A8.5 8.5 0 1 1 20.5 11.7Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.1 7.55c.18-.4.37-.41.68-.42h.58c.18 0 .4.07.5.34l.7 1.7c.08.22.04.4-.1.58l-.55.68c-.13.16-.07.34.04.5.48.7 1.08 1.3 1.78 1.78.18.12.36.14.51.02l.83-.72c.18-.15.38-.18.6-.08l1.63.77c.22.1.34.27.3.54-.1.65-.43 1.23-.96 1.63-.46.35-1.08.52-1.7.4-1.02-.2-2.33-.76-3.75-2.02-1.17-1.04-2.04-2.31-2.33-3.35-.22-.8-.06-1.67.4-2.35.04-.06.09-.12.14-.2Z"
        fill="currentColor"
      />
    </svg>
  );
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
          sublabel:
            module.config.emergencyEnabled && module.config.emergencyLabel
              ? module.config.emergencyLabel
              : null,
        }
      : null,
    whatsappHref
      ? {
          type: "WHATSAPP" as const,
          label: module.config.whatsappLabel,
          href: whatsappHref,
          external: true,
          icon: WhatsAppIcon,
          sublabel: null,
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
              <div className="public-quick-action-item" key={action.type}>
                <TrackedLink
                  className={`public-quick-action public-quick-action-${action.type.toLowerCase()}`}
                  href={action.href}
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
                {action.sublabel && (
                  <small className="public-quick-action-note">
                    {action.sublabel}
                  </small>
                )}
              </div>
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
        <div>
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

function ServicesPresentation({
  module,
}: {
  module: Extract<PublicModule, { type: "SERVICES" }>;
}) {
  const categories = module.config.categories.filter(
    (category) => category.items.length > 0,
  );
  if (!categories.length) return null;
  return (
    <section
      className="action-module public-services"
      aria-labelledby="services-heading"
    >
      <div className="public-module-heading">
        <div>
          <h2 id="services-heading">{module.config.label}</h2>
        </div>
      </div>
      <div className="public-service-categories">
        {categories.map((category) => (
          <section key={category.id}>
            <h3>{category.name}</h3>
            {category.items.map((item) => (
              <div className="public-service-row" key={item.id}>
                <strong>{item.name}</strong>
                {item.description && <p>{item.description}</p>}
              </div>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}

function WorkHoursPresentation({
  module,
}: {
  module: Extract<PublicModule, { type: "WORK_HOURS" }>;
}) {
  if (!module.config.days.some((entry) => entry.status !== "CLOSED"))
    return null;
  return (
    <section
      className="action-module public-work-hours"
      aria-labelledby="hours-heading"
    >
      <div className="public-module-heading">
        <div>
          <h2 id="hours-heading">{module.config.label}</h2>
        </div>
      </div>
      <dl>
        {module.config.days.map((entry) => (
          <div key={entry.day}>
            <dt>{weekDayLabels[entry.day]}</dt>
            <dd>
              {entry.status === "CLOSED"
                ? "Closed"
                : entry.status === "OPEN_24_HOURS"
                  ? "Open 24 hours"
                  : `${entry.opensAt}–${entry.closesAt}`}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PromotionsPresentation({
  business,
  module,
}: {
  business: PublicBusiness;
  module: Extract<PublicModule, { type: "PROMOTIONS" }>;
}) {
  const offers = module.config.offers.filter(
    (offer) => !promotionIsExpired(offer.validUntil),
  );
  if (!offers.length) return null;
  return (
    <section
      className="action-module public-promotions"
      aria-labelledby="promotions-heading"
    >
      <div className="public-module-heading">
        <div>
          <h2 id="promotions-heading">{module.config.label}</h2>
        </div>
      </div>
      <div className="public-promotion-list">
        {offers.map((offer) => {
          const action = promotionRequestAction(business, offer);
          return (
            <article key={offer.id}>
              <strong>{offer.title}</strong>
              {offer.description && <p>{offer.description}</p>}
              {offer.validUntil && (
                <small>Valid until {offer.validUntil}</small>
              )}
              {action && (
                <TrackedLink
                  className="public-offer-action"
                  href={action.href}
                  slug={business.slug}
                  eventType={action.eventType}
                  {...externalProps(action.external)}
                >
                  Request this offer{" "}
                  <ExternalLink size={16} aria-hidden="true" />
                </TrackedLink>
              )}
            </article>
          );
        })}
      </div>
    </section>
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
        <div>
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
            <li key={area.id}>
              <MapPin size={14} aria-hidden="true" /> {cityName(area.name)}
            </li>
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
        <div>
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
          <div>
            <h2 id="review-heading">Find us on Google</h2>
            <p>
              Had a good experience? Your review helps other local customers.
            </p>
          </div>
          <TrackedLink
            className="action-link button compact-public-button"
            href={href}
            slug={business.slug}
            eventType="REVIEW_CLICK"
            target="_blank"
            rel="noopener noreferrer"
          >
            {module.config.label || "Leave Us a Review"}{" "}
            <Star size={17} aria-hidden="true" />
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
          <div>
            <h2 id="save-heading">Save this business</h2>
            <p>Add the phone number and email to your contacts.</p>
          </div>
          <a
            className="action-link button compact-public-button"
            href={"/" + business.slug + "/contact.vcf"}
            download
          >
            {module.config.label}
          </a>
        </section>
      ) : null,
  },
  SERVICES: {
    analyticsEvent: "services_viewed",
    render: ({ module }) =>
      module.type === "SERVICES" &&
      module.config.categories.some((category) => category.items.length > 0) ? (
        <ServicesPresentation module={module} />
      ) : null,
  },
  WORK_HOURS: {
    analyticsEvent: "work_hours_viewed",
    render: ({ module }) =>
      module.type === "WORK_HOURS" &&
      module.config.days.some((entry) => entry.status !== "CLOSED") ? (
        <WorkHoursPresentation module={module} />
      ) : null,
  },
  PROMOTIONS: {
    analyticsEvent: "promotions_viewed",
    render: ({ business, module }) =>
      module.type === "PROMOTIONS" &&
      module.config.offers.some(
        (offer) => !promotionIsExpired(offer.validUntil),
      ) ? (
        <PromotionsPresentation business={business} module={module} />
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
            id={`module-${module.type.toLowerCase().replaceAll("_", "-")}`}
            open={module.openByDefault}
          >
            <summary>
              <span className="public-tool-summary">
                <ToolIcon type={module.type} />
                <span>
                  <span className="public-tool-kicker">
                    {moduleKickers[module.type]}
                  </span>
                  <strong>{labels[module.type]}</strong>
                  <small>{modulePreview(module, business)}</small>
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
