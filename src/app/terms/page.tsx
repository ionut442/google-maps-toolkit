import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Terms of Service | LocalAction",
  description:
    "The terms that apply when businesses use LocalAction and publish customer Action Pages.",
  alternates: { canonical: "https://local-action.com/terms" },
};

const sections: LegalSection[] = [
  {
    id: "about",
    title: "1. About LocalAction",
    content: (
      <>
        <p>
          LocalAction gives local service businesses a customer Action Page and
          tools for handling the next steps customers want to take. Depending on
          what a business enables, a page can provide call and WhatsApp actions,
          quote requests, service and pricing information, service areas,
          working hours, special offers, credentials, FAQs, Google review links,
          and a downloadable contact card.
        </p>
        <p>
          LocalAction also provides a Review Kit that can generate a printable
          review sign and social review graphic using the business&apos;s saved
          Google review destination, business name, and brand colour.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "2. Who may use the service",
    content: (
      <p>
        You may use LocalAction if you have the legal capacity and authority to
        agree to these terms for yourself or for the business you represent. You
        must use the service for a legitimate business purpose and comply with
        laws that apply to you, your business, and your customers.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "3. Accounts and security",
    content: (
      <>
        <p>
          You must provide accurate registration information and keep your
          account details current. You are responsible for protecting your login
          credentials and for activity carried out through your account.
        </p>
        <p>
          Contact{" "}
          <a href="mailto:support@local-action.com">support@local-action.com</a>{" "}
          promptly if you believe someone has gained unauthorised access to your
          account.
        </p>
      </>
    ),
  },
  {
    id: "public-pages",
    title: "4. Business information and public pages",
    content: (
      <>
        <p>
          You control the business information and tools shown on your published
          Action Page. You are responsible for keeping that information
          accurate, lawful, and not misleading. This includes your services,
          prices, offers, opening hours, service areas, phone and other contact
          details, credentials, certifications, reference numbers, expiry dates,
          and uploaded evidence.
        </p>
        <p>
          LocalAction provides the publishing platform. We do not independently
          check every claim a business makes and do not certify a
          business&apos;s qualifications, insurance, licences, or other
          credentials unless we expressly say that we have done so.
        </p>
      </>
    ),
  },
  {
    id: "enquiries",
    title: "5. Quote requests and customer enquiries",
    content: (
      <>
        <p>
          LocalAction helps a potential customer send information to the
          business they choose. The business receives the submitted contact
          details, answers, job information, and photos, where those fields are
          enabled.
        </p>
        <p>
          LocalAction is not a party to any contract between a business and a
          customer. We do not guarantee that an enquiry will become a job, that
          a business will respond within a particular time, or that either party
          will proceed. The business and customer must agree the final scope,
          timing, price, payment, and other terms of the work directly.
        </p>
      </>
    ),
  },
  {
    id: "pricing",
    title: "6. Pricing displayed by businesses",
    content: (
      <p>
        Hourly rates, price lists, starting prices, and simple estimates are
        supplied and configured by the business. They are informational until
        the business and customer agree otherwise. LocalAction does not verify
        those figures and does not turn an on-page estimate into an invoice or
        binding quote.
      </p>
    ),
  },
  {
    id: "subscriptions",
    title: "7. Subscriptions and cancellation",
    content: (
      <>
        <p>
          LocalAction subscriptions renew on the applicable monthly billing
          cycle unless you cancel. You can request cancellation at any time.
          Cancellation stops the next renewal; it does not end access that is
          already covered by your current paid or trial entitlement period.
        </p>
        <p>
          When that entitlement period expires, your customer-facing LocalAction
          page becomes unpublished and is no longer publicly available. Your
          saved business and page configuration remains in your account in line
          with our normal account and data-retention practices. If you later
          start an eligible subscription again, you can publish the page again.
        </p>
      </>
    ),
  },
  {
    id: "offers",
    title: "8. Promotions and special offers",
    content: (
      <p>
        Businesses are responsible for an offer&apos;s accuracy, eligibility
        rules, expiry date, availability, and fulfilment. Offers with a saved
        expiry date stop appearing publicly after that date, but the business
        remains responsible for honouring any commitment already made to a
        customer.
      </p>
    ),
  },
  {
    id: "credentials",
    title: "9. Credentials and evidence",
    content: (
      <p>
        Credentials, descriptions, reference numbers, expiry dates, images, and
        documents are supplied by the business. Unless specifically stated,
        LocalAction has not verified or endorsed them. A business must have the
        right to upload and publicly display any supporting material and must
        remove or update material that is inaccurate, expired, confidential, or
        no longer authorised for use.
      </p>
    ),
  },
  {
    id: "google",
    title: "10. Google features",
    content: (
      <>
        <p>
          A business owner can provide a Google Maps share link. LocalAction may
          resolve it into a direct Google review destination and may obtain
          publicly available business name, rating, and review-count
          information. The owner chooses whether an available score or count
          appears on the Action Page.
        </p>
        <p>
          Google information can change, be delayed, or become unavailable.
          Google links take users to a third-party service governed by
          Google&apos;s own terms and policies. LocalAction is not Google and is
          not affiliated with, endorsed by, or sponsored by Google.
        </p>
      </>
    ),
  },
  {
    id: "review-kit",
    title: "11. Review Kit",
    content: (
      <p>
        Review Kit assets are generated from the business name, saved brand
        colour, and saved direct Google review destination. You must check those
        details before downloading, printing, or sharing an asset. You are
        responsible for using review materials in a way that complies with
        applicable law and the rules of the review platform.
      </p>
    ),
  },
  {
    id: "content",
    title: "12. Your content and the licence you give us",
    content: (
      <>
        <p>
          You retain your rights in content you provide, including business
          text, logos, images, and credential evidence. You confirm that you
          have the rights and permissions needed to use that content.
        </p>
        <p>
          You give LocalAction a non-exclusive licence to host, store, process,
          resize, render, display, and deliver your content only as needed to
          operate, secure, support, and improve the service. This licence ends
          when the content is deleted, except where a limited copy must be kept
          for legal, security, or backup purposes.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "13. Acceptable use",
    content: (
      <>
        <p>You must not use LocalAction to:</p>
        <ul>
          <li>
            break the law, facilitate unlawful activity, or impersonate others;
          </li>
          <li>
            publish fraudulent, deceptive, or materially misleading claims;
          </li>
          <li>
            upload content you do not have the right to use or that infringes
            another person&apos;s rights;
          </li>
          <li>send spam, harassment, malicious code, or prohibited content;</li>
          <li>
            probe, disrupt, overload, bypass, or interfere with the service or
            its security;
          </li>
          <li>collect, use, or disclose personal information unlawfully; or</li>
          <li>help another person do any of these things.</li>
        </ul>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "14. Third-party services",
    content: (
      <p>
        LocalAction relies on service providers for hosting, databases, file
        storage, email delivery, maps, and other necessary operations. It also
        links to destinations such as Google, WhatsApp, business websites, and
        telephone or email services. We do not control third-party services and
        are not responsible for their availability, content, or independent use
        of information. Their terms and privacy policies apply when you use
        them.
      </p>
    ),
  },
  {
    id: "availability",
    title: "15. Availability and changes",
    content: (
      <p>
        We work to keep LocalAction useful and available, but do not promise
        uninterrupted or error-free operation. Maintenance, security work,
        provider outages, and changes to the service may affect availability. We
        may add, change, or remove features while preserving obligations that
        have already arisen under these terms.
      </p>
    ),
  },
  {
    id: "suspension",
    title: "16. Suspension, termination, and deletion",
    content: (
      <>
        <p>
          We may suspend, unpublish, or terminate access when reasonably
          necessary to address unlawful use, abuse, security risk, serious or
          repeated breaches, or harm to LocalAction, its providers, businesses,
          or users. Where practical, we will explain the reason and give the
          account holder a chance to correct the issue.
        </p>
        <p>
          You may stop using LocalAction at any time. To request deletion of an
          account or business data, contact{" "}
          <a href="mailto:support@local-action.com">support@local-action.com</a>
          . See our <Link href="/privacy">Privacy Policy</Link> for more about
          deletion and retention.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "17. Disclaimers",
    content: (
      <p>
        LocalAction is provided on an “as available” basis. We do not guarantee
        that a business is suitable for a customer, that business-provided
        information is complete, or that third-party data and links remain
        accurate. You are responsible for checking information and deciding
        whether to enter a transaction. Nothing here limits a responsibility
        that cannot legally be excluded.
      </p>
    ),
  },
  {
    id: "liability",
    title: "18. Liability",
    content: (
      <>
        <p>
          To the extent permitted by law, LocalAction is not responsible for
          indirect or consequential loss, lost profits, lost opportunities, loss
          of data, or disputes and losses arising from work agreed between a
          business and customer or from a third-party service.
        </p>
        <p>
          We do not exclude liability for fraud, deliberate wrongdoing, death or
          personal injury caused by negligence, or any other liability or legal
          right that cannot be excluded or limited under applicable law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "19. Changes to these terms",
    content: (
      <p>
        We may update these terms when the service, our practices, or legal
        requirements change. We will post the revised terms with a new “Last
        updated” date. If a change materially affects registered users, we will
        take reasonable steps to bring it to their attention. Continued use
        after an update takes effect means the updated terms apply to later use.
      </p>
    ),
  },
  {
    id: "contact",
    title: "20. Contact",
    content: (
      <p>
        Questions about these terms can be sent to{" "}
        <a href="mailto:support@local-action.com">support@local-action.com</a>.
        You can also use our <Link href="/contact">contact form</Link>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      intro="Plain-English terms for businesses using LocalAction and for visitors using a LocalAction page."
      sections={sections}
    />
  );
}
