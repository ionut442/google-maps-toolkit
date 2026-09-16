import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/app/marketing.module.css";
import {
  LegalDocument,
  type LegalSection,
} from "@/components/marketing/legal-document";

export const metadata: Metadata = {
  title: "Cookie Policy | LocalAction",
  description:
    "The strictly necessary cookies used for secure LocalAction business account sessions.",
  alternates: { canonical: "https://local-action.com/cookies" },
};

const sections: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "1. What cookies are",
    content: (
      <p>
        Cookies are small pieces of information a website asks a browser to
        store and return with later requests. Similar browser storage can
        include local storage and session storage. They can support essential
        functions such as keeping a user signed in, or optional functions such
        as advertising and cross-site measurement.
      </p>
    ),
  },
  {
    id: "what-we-use",
    title: "2. What LocalAction currently uses",
    content: (
      <>
        <p>
          LocalAction currently uses only cookies that are necessary to provide
          core functions such as authentication and security. We do not use
          advertising, marketing, or analytics cookies. LocalAction does not use
          local storage or session storage.
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.policyTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Purpose</th>
                <th>Type</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>__session</code>, <code>__client</code>, and related
                  Clerk authentication cookies
                </td>
                <td>
                  Clerk uses these cookies to authenticate business users,
                  refresh short-lived session tokens, protect sign-in state, and
                  let LocalAction retrieve the matching protected account.
                </td>
                <td>Strictly necessary</td>
                <td>
                  Session-token cookies are short-lived and refreshed while the
                  Clerk session remains valid. Other authentication cookies can
                  remain until their Clerk or browser expiry, logout,
                  revocation, or deletion in browser settings.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "security",
    title: "3. How authentication cookies are protected",
    content: (
      <p>
        Clerk signs and rotates authentication tokens, uses short-lived session
        tokens, and applies cookie controls including secure production delivery
        and SameSite protection. Clerk&apos;s long-lived production client
        cookie is HttpOnly on the Clerk authentication domain. Its short-lived
        session cookie must be available to Clerk&apos;s browser SDK on
        LocalAction&apos;s domain and is refreshed while the session remains
        valid.
      </p>
    ),
  },
  {
    id: "analytics",
    title: "4. Analytics and public Action Pages",
    content: (
      <p>
        Public Action Pages can record simple events such as a page view, call,
        WhatsApp open, review click, or quote request. Those events are sent
        directly to LocalAction and do not use cookies, browser storage, visitor
        IDs, advertising IDs, or device fingerprints. Visiting a public Action
        Page does not cause LocalAction to set an analytics cookie.
      </p>
    ),
  },
  {
    id: "controls",
    title: "5. Your controls",
    content: (
      <>
        <p>
          You can delete or block cookies using your browser settings. Because
          Clerk authentication cookies are required to recognise a signed-in
          account. Blocking or deleting them will prevent protected business
          pages from working or will sign you out. Public marketing and Action
          Pages remain available without these login cookies.
        </p>
        <p>
          There is no optional LocalAction cookie category to accept or reject,
          so LocalAction does not display a cookie-consent banner or preference
          panel.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "6. Third-party destinations",
    content: (
      <p>
        Clerk provides LocalAction&apos;s authentication and sets the strictly
        necessary cookies described above. LocalAction pages can also contain
        links to Google, WhatsApp, a business&apos;s website, email software, or
        telephone services. If you follow one of those links, the third party
        may use cookies or similar technologies under its own policy.
        LocalAction does not control cookies set after you leave our service.
        The marketing homepage also requests font files from Google&apos;s font
        service; LocalAction does not use that request to set its own cookie.
      </p>
    ),
  },
  {
    id: "changes",
    title: "7. Changes to this policy",
    content: (
      <p>
        If LocalAction&apos;s use of cookies or browser storage changes, we will
        update this page and its “Last updated” date. If we introduce a
        non-essential cookie that requires consent, we will add an appropriate
        choice before using it.
      </p>
    ),
  },
  {
    id: "contact",
    title: "8. Contact",
    content: (
      <p>
        Questions about cookies or privacy can be sent to{" "}
        <a href="mailto:support@local-action.com">support@local-action.com</a>.
        You can also read our <Link href="/privacy">Privacy Policy</Link> or use
        the <Link href="/contact">contact form</Link>.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Cookie Policy"
      intro="A clear account of the strictly necessary authentication cookies LocalAction currently uses."
      sections={sections}
    />
  );
}
