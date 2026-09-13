"use client";

import { useMemo, useState } from "react";
import styles from "@/app/marketing.module.css";

type Article = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  steps?: string[];
};

type Category = { id: string; title: string; articles: Article[] };

export const helpCategories: Category[] = [
  {
    id: "getting-started",
    title: "Getting started",
    articles: [
      {
        id: "create-page",
        title: "Creating your LocalAction page",
        paragraphs: [
          "Create an account with your email and password, then follow the guided setup. LocalAction creates one business workspace and gives you a draft Action Page to configure before publishing.",
          "The setup asks for your business type, business details, customer tools, and main customer action. You can return to the dashboard and change these choices later.",
        ],
      },
      {
        id: "business-type",
        title: "Choosing your business type",
        paragraphs: [
          "Choose the closest listed trade or service category. If none fits, choose Other and enter a clear business type. This choice helps LocalAction start you with useful tool defaults; it does not limit which tools you can use later.",
        ],
      },
      {
        id: "business-details",
        title: "Adding your business details",
        paragraphs: [
          "Add the name customers know, a short description, contact email, phone number, and any optional WhatsApp number, website, logo, and Google information. A description and phone number are required before publication.",
          "If WhatsApp is still linked to the phone field, changing the phone number updates both. Edit WhatsApp separately when the business uses a different number.",
        ],
      },
      {
        id: "choosing-tools",
        title: "Choosing customer tools",
        paragraphs: [
          "Turn on the tools that give customers useful next steps. Enabling a tool selects it for the page; open that tool and save its settings before treating it as ready. The Page Order screen marks enabled tools that still need setup.",
          "You can enable, disable, reorder, and configure tools from the dashboard without rebuilding the page.",
        ],
      },
      {
        id: "main-action",
        title: "Choosing your main customer action",
        paragraphs: [
          "Choose Get a Quote, Call, WhatsApp, or Review as the main action. Only actions supported by an enabled tool are available. LocalAction places the selected action prominently near the top of the page while keeping other enabled actions available below.",
        ],
      },
      {
        id: "previewing",
        title: "Previewing your page",
        paragraphs: [
          "Use Open draft preview to inspect the current saved page even before it is published. The preview uses the same interactive customer components as the public page, while protecting the draft from anonymous access.",
          "Save changes in each editor before relying on the preview; unsaved form values are not part of the draft.",
        ],
      },
      {
        id: "publishing",
        title: "Publishing your page",
        paragraphs: [
          "The final setup check shows what is ready and links directly to anything that still needs attention. When the required business details and at least one customer tool are ready, publish the page and share its public link.",
          "Publishing makes the configured business information publicly accessible. You can later unpublish the page from Page Order; the private draft remains available to you.",
        ],
      },
    ],
  },
  {
    id: "your-page",
    title: "Your business page",
    articles: [
      {
        id: "page-identity",
        title: "Business name, description, and logo",
        paragraphs: [
          "The public page header uses the saved business name, description, business type, and logo. Without a logo, LocalAction shows a business initial. Upload a clear JPG, PNG, or WebP logo and preview it after saving.",
        ],
      },
      {
        id: "page-order",
        title: "Page order and Open by default",
        paragraphs: [
          "Use Page Order to move enabled tools up or down. That order is the order customers see. Each tool appears as an expandable section; Open by default controls whether its details are already expanded when the page loads.",
          "Opening every tool can make a long page harder to scan, so reserve Open by default for the details customers most often need.",
        ],
      },
      {
        id: "publish-unpublish",
        title: "Publishing, unpublishing, and draft preview",
        paragraphs: [
          "A published page is available at its public business URL. Unpublishing removes anonymous access without deleting your configuration. Draft preview stays available to the signed-in owner and is the right place to check saved changes before publishing again.",
        ],
      },
      {
        id: "google-rating-display",
        title: "Google rating display",
        paragraphs: [
          "After LocalAction resolves a Google Maps share link, an available public rating and review count can be saved with the business. Business Details lets you choose whether to show the score, the count, both, or neither. These values are a snapshot from Google and can become outdated; resolve the link again to refresh them.",
        ],
      },
    ],
  },
  {
    id: "customer-tools",
    title: "Customer tools",
    articles: [
      {
        id: "call-whatsapp",
        title: "Call & WhatsApp",
        paragraphs: [
          "Set the call and WhatsApp button labels, the WhatsApp starter message, and the optional emergency or 24/7 note. The main phone and WhatsApp numbers come from Business Details.",
          "WhatsApp initially follows the phone number until you edit it separately. Customers see one-tap Call and WhatsApp actions for valid saved numbers. WhatsApp opens in a new tab with the starter message ready; it does not send the message automatically.",
        ],
      },
      {
        id: "get-a-quote",
        title: "Get a Quote",
        paragraphs: [
          "Build the form from text, number, dropdown, multiple-choice, checkbox, postcode or address, contact, and photo fields. Mark fields required only when you genuinely need the answer. Every form must retain at least one required contact field.",
          "Customers can submit the configured answers, contact details, job description, and up to three JPG, PNG, or WebP photos when a photo field is present. Requests are saved in Quote Requests and a notification is sent to the business contact email. Uploaded photos are opened securely from the dashboard rather than attached to the notification email.",
        ],
      },
      {
        id: "pricing",
        title: "Pricing",
        paragraphs: [
          "Choose one pricing mode. Hourly shows one rate and an optional note. Price list groups fixed or From prices into categories, with an optional description on each item. Simple estimate combines a base price with optional add-ons and an optional quantity range.",
          "A customer can use a simple estimate as context for a quote request, but all displayed prices and estimates are supplied by the business. They are not validated or turned into a binding quote by LocalAction.",
        ],
      },
      {
        id: "services",
        title: "Services",
        paragraphs: [
          "Create service categories, add services inside each category, and add an optional description for each service. Reorder categories and services so the most useful information appears first. Empty categories are not shown publicly.",
        ],
      },
      {
        id: "service-area",
        title: "Service Area",
        paragraphs: [
          "Search and save named areas to place them on the map and show area chips. You can also save exact postcode entries for the customer postcode checker. The checker compares a customer entry with your saved postcode list; it does not calculate distance or infer nearby coverage.",
          "Map points frame the places you saved. They are a visual guide, not a precise legal or geographic service boundary. Keep the saved areas and postcode list current.",
        ],
      },
      {
        id: "working-hours",
        title: "Working Hours",
        paragraphs: [
          "Configure Monday through Sunday. Each day can be Closed, Open for one start-and-finish period, or Open 24 hours. Customers see the seven-day schedule exactly as saved. The schedule does not automatically change for holidays or exceptional closures.",
        ],
      },
      {
        id: "trust-credentials",
        title: "Trust & Credentials",
        paragraphs: [
          "Add credentials or reassurance entries with a name, optional description, reference number, and expiry date. You can attach supported image or PDF evidence. Evidence associated with a visible, non-expired credential can be opened from the public page.",
          "Expired credentials stop appearing publicly. LocalAction labels this section “Information provided by this business” because the business, not LocalAction, supplies and is responsible for the claims and evidence.",
        ],
      },
      {
        id: "faqs",
        title: "FAQs",
        paragraphs: [
          "Add the questions customers genuinely ask and provide a complete answer for each. Edit, delete, and reorder entries from the FAQ editor. Customers see the saved questions as expandable items; empty FAQ content is not displayed.",
        ],
      },
      {
        id: "google-reviews",
        title: "Google Reviews",
        paragraphs: [
          "Connect the Google listing from Business Details or the Google Reviews editor. LocalAction resolves the Maps share link into the direct destination used by the review button and Review Kit.",
          "If Google returns a public rating and review count, choose whether either value appears on the Action Page. Resolve the Maps link again when you want to refresh the saved snapshot.",
        ],
        steps: [
          "Open your business in Google Maps.",
          "Choose Share, then Copy link.",
          "Paste the Maps share link into LocalAction.",
          "Choose Get review link.",
          "Check the resolved business and review destination, choose any rating display options, then save.",
        ],
      },
      {
        id: "save-contact",
        title: "Save Contact",
        paragraphs: [
          "This tool downloads a standard contact card for the customer. It contains the saved business name and, when valid and available, the business phone, contact email, and website. It does not include the business logo, WhatsApp starter message, service areas, or private account information.",
        ],
      },
      {
        id: "special-offers",
        title: "Special Offers",
        paragraphs: [
          "Add an offer title, optional description, optional Valid until date, and the contact method customers should use: Phone, WhatsApp, or Email. Make sure the chosen contact method exists in Business Details.",
          "An offer with an expiry date no longer appears publicly after that date. Customers choose Request this offer and are sent to the configured contact channel; LocalAction does not create a coupon or automatically fulfil the offer.",
        ],
      },
    ],
  },
  {
    id: "review-kit",
    title: "Review Kit",
    articles: [
      {
        id: "printable-review-sign",
        title: "Printable Review Sign",
        paragraphs: [
          "The printable sign is an A4-proportioned PNG. It uses the business name, the first usable character of that name as the identity mark, the saved brand colour, and a QR code for the saved direct Google review destination.",
          "Set the brand colour in Business Details and connect a valid Google review destination before opening Review Kit. The business logo is not placed in the generated sign.",
        ],
      },
      {
        id: "social-review-graphic",
        title: "Social Review Graphic",
        paragraphs: [
          "The social graphic is a square PNG using the same business name, initial, saved brand colour, Google review destination, and QR code. Download it from Review Kit after checking the preview. The generated graphic does not include the uploaded business logo.",
        ],
      },
    ],
  },
  {
    id: "quote-requests",
    title: "Quote Requests",
    articles: [
      {
        id: "incoming-quotes",
        title: "Viewing incoming quote requests",
        paragraphs: [
          "Open Quote Requests from the dashboard to see submissions for your business. A request can include the customer name, phone, email, configured answers, job or address details, pricing-estimate context, and photo count, depending on the form the customer completed.",
          "Open an individual request to view its full answers and authenticated photo links. The request also shows notification delivery status. If a notification failed and remains eligible, the dashboard provides a retry action; the request itself remains saved even when email delivery fails.",
        ],
      },
    ],
  },
  {
    id: "business-settings",
    title: "Business Details",
    articles: [
      {
        id: "profile-settings",
        title: "Contact information, logo, and brand colour",
        paragraphs: [
          "Business Details is the source for the public name, description, phone, WhatsApp number, contact email, website, and logo used by enabled tools. Save the form, then use draft preview to check the result.",
          "Brand colour is used for the downloadable Review Kit graphics. It does not recolour the public Action Page. LocalAction adjusts very light or low-contrast colours when needed so generated assets remain readable.",
        ],
      },
      {
        id: "google-business-connection",
        title: "Google Business connection",
        paragraphs: [
          "Paste a Google Maps share link and choose Get review link. LocalAction saves the Maps source, resolved direct review destination, Google business name when available, and any available rating snapshot. This connection supports the Google Reviews tool and Review Kit; it does not edit or manage the Google Business Profile.",
        ],
      },
    ],
  },
  {
    id: "account-privacy",
    title: "Account & privacy",
    articles: [
      {
        id: "account-access",
        title: "Signing out and account help",
        paragraphs: [
          "Use Log out in the dashboard account area to end the current browser session. Business contact details can be changed in Business Details. For login trouble, an account email change, or another account issue that is not available in the dashboard, email support@local-action.com.",
        ],
      },
      {
        id: "privacy-requests",
        title: "Data and privacy requests",
        paragraphs: [
          "For access, correction, deletion, or another privacy request, use the Contact page and choose Privacy or data request, or email support@local-action.com. Include enough information to identify the relevant account or quote request, but do not send passwords or unnecessary sensitive information.",
        ],
      },
    ],
  },
];

export function HelpCentre() {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return helpCategories;
    return helpCategories
      .map((category) => ({
        ...category,
        articles: category.articles.filter((article) =>
          [
            category.title,
            article.title,
            ...article.paragraphs,
            ...(article.bullets ?? []),
            ...(article.steps ?? []),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(needle),
        ),
      }))
      .filter((category) => category.articles.length > 0);
  }, [query]);

  return (
    <div className={styles.helpLayout}>
      <aside className={styles.helpNav}>
        <strong>Browse help</strong>
        <nav aria-label="Help categories">
          {helpCategories.map((category) => (
            <a href={`#${category.id}`} key={category.id}>
              {category.title}
            </a>
          ))}
        </nav>
      </aside>
      <div>
        <label className={styles.searchLabel}>
          Search the Help Centre
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help..."
          />
        </label>
        <p className="sr-only" aria-live="polite">
          {visible.reduce(
            (count, category) => count + category.articles.length,
            0,
          )}{" "}
          help articles shown
        </p>
        {visible.length ? (
          visible.map((category) => (
            <section
              className={styles.helpCategory}
              id={category.id}
              key={category.id}
            >
              <h2>{category.title}</h2>
              <div className={styles.helpCards}>
                {category.articles.map((article) => (
                  <article
                    className={styles.helpCard}
                    id={article.id}
                    key={article.id}
                  >
                    <h3>{article.title}</h3>
                    {article.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {article.steps && (
                      <ol>
                        {article.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    )}
                    {article.bullets && (
                      <ul>
                        {article.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className={styles.emptyState}>
            <h2>No matching help found</h2>
            <p>Try a broader word, or email support@local-action.com.</p>
          </div>
        )}
      </div>
    </div>
  );
}
