import Link from "next/link";
import styles from "@/app/marketing.module.css";

function LogoMark() {
  return (
    <span className={styles.logoMark} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </svg>
    </span>
  );
}

const footerLinks = [
  ["Help", "/help"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Cookies", "/cookies"],
] as const;

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${styles.page} marketing-page-shell`}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.logo} href="/" aria-label="LocalAction home">
            <LogoMark />
            <span>
              Local<em>Action</em>
            </span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Main navigation">
            <Link href="/#how">How it works</Link>
            <Link href="/#features">What you get</Link>
            <Link href="/help">Help</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.loginLink} href="/login">
              Log in
            </Link>
            <Link className={styles.primaryButton} href="/signup">
              Create my page
            </Link>
          </div>
          <details className={styles.mobileMenu}>
            <summary aria-label="Open navigation">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/">Home</Link>
              <Link href="/#how">How it works</Link>
              <Link href="/#features">What you get</Link>
              <Link href="/help">Help</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/login">Log in</Link>
            </nav>
          </details>
        </div>
      </header>
      {children}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <Link className={styles.footerLogo} href="/">
              <LogoMark />
              <span>
                Local<em>Action</em>
              </span>
            </Link>
            <nav className={styles.footerLinks} aria-label="Footer navigation">
              {footerLinks.map(([label, href]) => (
                <Link href={href} key={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <p className={styles.footerNote}>
            © LocalAction — One simple page for calls, quotes, WhatsApp and
            reviews. Built for local service businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.narrowContainer}>
        <span className={styles.eyebrow}>
          <span /> {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
    </section>
  );
}
