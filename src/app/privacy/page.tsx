import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <p className="eyebrow">Privacy</p>
      <h1>How LocalAction handles data</h1>
      <p>
        LocalAction stores account and business profile data needed to provide
        each Action Page.
      </p>
      <h2>Quote requests and private files</h2>
      <p>
        When a customer requests a quote, the business receives the submitted
        contact details, answers, and optional photos. Photos and credential
        evidence are private and available only to an authenticated owner.
      </p>
      <h2>Activity analytics</h2>
      <p>
        LocalAction records the business, a controlled action type, and time. It
        does not store analytics IP addresses, cookie identifiers, fingerprints,
        or persistent visitor identities. Raw network addresses used briefly for
        abuse prevention are hashed and are not retained.
      </p>
      <h2>Retention and deletion</h2>
      <p>
        Activity events are retained for 90 days. Quote, account, and business
        records remain while needed by the business and can be deleted through
        the private-beta operator, including associated private files.
      </p>
      <h2>Cookies</h2>
      <p>
        Public Action Pages do not use analytics cookies. Signed-in business
        owners receive a necessary secure session cookie.
      </p>
      <p>
        This factual notice requires jurisdiction-specific legal review before a
        public launch.
      </p>
      <Link href="/">Return home</Link>
    </main>
  );
}
