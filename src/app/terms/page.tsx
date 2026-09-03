import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="legal-page">
      <p className="eyebrow">Terms</p>
      <h1>Private-beta terms</h1>
      <p>
        LocalAction provides configurable customer actions for participating
        local service businesses. Businesses are responsible for the accuracy of
        their profile, pricing guidance, service areas, credentials, review
        destination, and responses to customers.
      </p>
      <p>
        Pricing estimates are indicative and are not invoices, payment requests,
        or accepted quotes. Credential information is business-provided and is
        not independently verified by LocalAction.
      </p>
      <p>
        The private beta may be changed, suspended, or withdrawn while
        reliability and customer value are evaluated. These product-level terms
        require jurisdiction-specific legal review before a public launch.
      </p>
      <Link href="/">Return home</Link>
    </main>
  );
}
