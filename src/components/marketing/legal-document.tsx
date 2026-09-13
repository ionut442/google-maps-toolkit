import Link from "next/link";
import styles from "@/app/marketing.module.css";
import { MarketingShell, PageHero } from "./marketing-shell";

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

export function LegalDocument({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <MarketingShell>
      <main id="main">
        <PageHero eyebrow={eyebrow} title={title} intro={intro} />
        <div className={styles.contentSection}>
          <div className={styles.legalLayout}>
            <aside className={styles.toc}>
              <strong>On this page</strong>
              <nav aria-label={`${title} contents`}>
                {sections.map((section) => (
                  <a href={`#${section.id}`} key={section.id}>
                    {section.title}
                  </a>
                ))}
              </nav>
            </aside>
            <article className={styles.article}>
              <p className={styles.updated}>Last updated: 13 September 2026</p>
              {sections.map((section) => (
                <section id={section.id} key={section.id}>
                  <h2>{section.title}</h2>
                  {section.content}
                </section>
              ))}
              <p>
                Questions about this document? Visit our{" "}
                <Link href="/contact">contact page</Link> or email{" "}
                <a href="mailto:support@local-action.com">
                  support@local-action.com
                </a>
                .
              </p>
            </article>
          </div>
        </div>
      </main>
    </MarketingShell>
  );
}
