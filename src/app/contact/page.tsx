import type { Metadata } from "next";
import styles from "@/app/marketing.module.css";
import {
  MarketingShell,
  PageHero,
} from "@/components/marketing/marketing-shell";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | LocalAction",
  description:
    "Contact LocalAction about your account, customer page, quote requests, Google reviews, privacy, or technical help.",
  alternates: { canonical: "https://local-action.com/contact" },
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <main id="main">
        <PageHero
          eyebrow="Contact"
          title="Need a hand?"
          intro="Questions about LocalAction, your account or a customer page? Send us a message."
        />
        <section className={styles.contentSection}>
          <div className={styles.wideContainer}>
            <div className={styles.contactGrid}>
              <div className={styles.formCard}>
                <h2>Send us a message</h2>
                <p>
                  Tell us what you need help with. Do not include passwords.
                </p>
                <ContactForm />
              </div>
              <aside className={styles.supportCard}>
                <h2>Email LocalAction</h2>
                <p>
                  Prefer email? Use the address below for account, product,
                  technical, or privacy questions.
                </p>
                <a
                  className={styles.supportEmail}
                  href="mailto:support@local-action.com"
                >
                  support@local-action.com
                </a>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
