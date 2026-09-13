import type { Metadata } from "next";
import styles from "@/app/marketing.module.css";
import {
  MarketingShell,
  PageHero,
} from "@/components/marketing/marketing-shell";
import { HelpCentre } from "./help-centre";

export const metadata: Metadata = {
  title: "Help Centre | LocalAction",
  description:
    "Set up your LocalAction page, configure every customer tool, manage quote requests and use Review Kit.",
  alternates: { canonical: "https://local-action.com/help" },
};

export default function HelpPage() {
  return (
    <MarketingShell>
      <main id="main">
        <PageHero
          eyebrow="Help Centre"
          title="How can we help?"
          intro="Set up your page, configure your tools and understand what your customers see."
        />
        <section className={styles.contentSection}>
          <div className={styles.wideContainer}>
            <HelpCentre />
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
