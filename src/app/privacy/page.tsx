import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | LocalAction",
  description:
    "How LocalAction collects, uses, shares, protects, retains and deletes personal information.",
  alternates: { canonical: "https://local-action.com/privacy" },
};

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "1. Who this policy covers",
    content: (
      <>
        <p>
          This policy explains how LocalAction handles information about
          business account users who create and manage an Action Page, and
          visitors or customers who view a public Action Page or send a quote
          request.
        </p>
        <p>
          A business that receives a customer enquiry is responsible for how it
          uses that information after receiving it. Customers should also review
          any privacy information the chosen business provides.
        </p>
      </>
    ),
  },
  {
    id: "account-information",
    title: "2. Account information",
    content: (
      <p>
        When a business user creates an account, we store the email address,
        password hash, internal account identifier, account timestamps, and
        session records needed to sign the user in securely. We do not store the
        account password in readable form.
      </p>
    ),
  },
  {
    id: "business-profile",
    title: "3. Business profile information",
    content: (
      <>
        <p>
          We store information a business owner enters to set up and manage the
          service. This can include business name and type, description, phone,
          WhatsApp number, contact email, website, logo, brand colour, services,
          prices, working hours, service areas and postcodes, offers, FAQs,
          credentials, evidence files, page order, enabled tools, and publishing
          settings.
        </p>
        <p>
          Information the owner chooses to publish on an Action Page is publicly
          accessible. This may include contact details and uploaded credential
          evidence. Owners should not publish confidential information.
        </p>
      </>
    ),
  },
  {
    id: "google-information",
    title: "4. Google-related information",
    content: (
      <p>
        A business owner can provide a Google Maps share URL. We may process
        that URL to save a direct Google review destination and obtain publicly
        available Google business name, rating, and review-count information. We
        also store the owner&apos;s choices about displaying an available rating
        or count. Google information may change or become unavailable.
      </p>
    ),
  },
  {
    id: "quote-requests",
    title: "5. Quote requests",
    content: (
      <>
        <p>
          A business chooses the fields on its quote form. Depending on that
          configuration, a customer may provide a name, phone number, email
          address, postcode or address, answers to business-defined questions,
          free-text job information, choices, quantities, and up to three job
          photos.
        </p>
        <p>
          <strong>
            When a customer submits a quote request, that information is
            provided to the specific business the customer chose to contact.
          </strong>{" "}
          It appears in that business&apos;s protected Quote Requests dashboard
          and a notification is sent to the business&apos;s saved contact email.
          Photo files are not attached to the email; the business opens them
          through its authenticated dashboard.
        </p>
      </>
    ),
  },
  {
    id: "uploads",
    title: "6. Uploaded business content",
    content: (
      <p>
        We process business logos and credential evidence so they can be stored,
        displayed, resized, or delivered as configured. Credential evidence is
        available publicly only when the business has deliberately associated it
        with a visible, non-expired credential. Owner dashboard routes remain
        restricted to an authenticated owner.
      </p>
    ),
  },
  {
    id: "activity",
    title: "7. Activity information",
    content: (
      <>
        <p>
          LocalAction records small event rows for a published Action Page. The
          recorded information is the business, the event type, and the time.
          The event types cover page views, quote requests, calls, WhatsApp
          opens, and review-link clicks. Businesses see aggregated counts and
          recent quote activity in their dashboard.
        </p>
        <p>
          These activity events do not contain a visitor ID, cookie ID, IP
          address, device fingerprint, free-text customer information, or
          advertising identifier. We do not use an analytics cookie to collect
          these events.
        </p>
      </>
    ),
  },
  {
    id: "technical-data",
    title: "8. Technical and security data",
    content: (
      <p>
        Network information supplied by our trusted web entry point may be used
        briefly to apply abuse-prevention limits to quote and contact
        submissions. The rate-limit key is stored as a one-way hash, not as the
        raw network address. We may also process ordinary server and provider
        logs needed to diagnose failures, protect the service, and operate the
        website. We do not use that information to build advertising profiles.
      </p>
    ),
  },
  {
    id: "uses",
    title: "9. Why we use information",
    content: (
      <>
        <p>We use information to:</p>
        <ul>
          <li>create accounts and authenticate business users;</li>
          <li>save, publish, preview, and operate business Action Pages;</li>
          <li>route quote requests to the selected business;</li>
          <li>store and securely deliver uploaded files;</li>
          <li>send operational and enquiry notifications;</li>
          <li>
            resolve Google review destinations and show owner-selected public
            information;
          </li>
          <li>generate Review Kit assets;</li>
          <li>provide support, prevent abuse, and maintain security;</li>
          <li>understand aggregate product use; and</li>
          <li>comply with legal obligations and enforce our terms.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "10. How information is shared",
    content: (
      <>
        <p>
          We share information only as needed to provide the service, follow a
          user&apos;s direction, protect rights and safety, or meet legal
          obligations. Relevant recipients can include:
        </p>
        <ul>
          <li>
            the business selected by a customer who submits a quote request;
          </li>
          <li>
            hosting, database, private file-storage, and email-delivery
            providers;
          </li>
          <li>
            mapping and place-information services when a business configures
            service areas or a Google connection;
          </li>
          <li>
            Google, WhatsApp, telephone, email, or website services when a
            visitor chooses an outbound action; and
          </li>
          <li>
            authorities or professional advisers where disclosure is legally
            required or reasonably necessary to protect the service and its
            users.
          </li>
        </ul>
        <p>
          LocalAction does not sell personal information to advertisers and does
          not use personal information for third-party behavioural advertising.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "11. Retention and deletion",
    content: (
      <>
        <p>
          Action Page activity events are deleted after 90 days. Quote requests,
          including associated uploaded photos and email-delivery records, are
          deleted after 365 days. Quote rate-limit records older than 24 hours
          and expired login sessions are deleted through scheduled operational
          cleanup.
        </p>
        <p>
          Account and business profile information remains while the account or
          business is active or as needed to provide the service. When account
          or business deletion is completed, associated database records and
          managed files are deleted, subject to limited legal, security, and
          backup needs. Contact{" "}
          <a href="mailto:support@local-action.com">support@local-action.com</a>{" "}
          to request deletion.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "12. Security",
    content: (
      <p>
        We use measures designed to protect information, including hashed
        passwords and session tokens, access controls for owner data, private
        file storage for quote photos, validation and file-type limits,
        encrypted web connections in production, and rate limiting. No online
        service can guarantee absolute security, so account holders should
        protect their credentials and tell us promptly about suspected misuse.
      </p>
    ),
  },
  {
    id: "international",
    title: "13. International service providers",
    content: (
      <p>
        Our service providers may process information in countries different
        from the country where a user is located. Data-protection rules can
        differ between countries. We select providers and arrangements intended
        to give information appropriate protection for the service being
        supplied.
      </p>
    ),
  },
  {
    id: "rights",
    title: "14. Your privacy rights",
    content: (
      <>
        <p>
          Depending on where you live, you may have rights to ask for access to,
          correction of, or deletion of your personal information; to object to
          or restrict certain processing; to receive portable information; or to
          withdraw consent where processing relies on consent. These rights can
          be subject to legal exceptions.
        </p>
        <p>
          Send a request to{" "}
          <a href="mailto:support@local-action.com">support@local-action.com</a>{" "}
          or use our <Link href="/contact">contact form</Link>. We may need to
          verify your identity and authority before acting on a request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "15. Children&apos;s privacy",
    content: (
      <p>
        LocalAction accounts are intended for businesses and adults who can
        enter into an agreement. We do not knowingly invite children to create
        accounts or provide personal information. If you believe a child has
        submitted personal information, contact us so we can review and remove
        it where appropriate.
      </p>
    ),
  },
  {
    id: "third-party-links",
    title: "16. Third-party links",
    content: (
      <p>
        Action Pages can link to Google, WhatsApp, business websites, telephone
        services, and email services. Those third parties control their own
        processing. Their privacy policies apply after you follow a link or use
        their service.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "17. Cookies",
    content: (
      <p>
        LocalAction currently uses only a necessary login-session cookie for
        authenticated business users. Public activity analytics does not use
        cookies. Read the <Link href="/cookies">Cookie Policy</Link> for the
        exact cookie name, purpose, and duration.
      </p>
    ),
  },
  {
    id: "changes",
    title: "18. Changes to this policy",
    content: (
      <p>
        We may update this policy when our service, providers, or legal
        obligations change. We will publish the revised policy with a new “Last
        updated” date and take reasonable steps to highlight material changes to
        registered users.
      </p>
    ),
  },
  {
    id: "contact",
    title: "19. Contact",
    content: (
      <p>
        For privacy questions or requests, email{" "}
        <a href="mailto:support@local-action.com">support@local-action.com</a>{" "}
        or choose “Privacy or data request” on the{" "}
        <Link href="/contact">contact form</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What LocalAction collects, why we use it, who receives it, and the choices available to you."
      sections={sections}
    />
  );
}
