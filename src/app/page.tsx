import type { Metadata } from "next";
import Link from "next/link";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "LocalAction | One simple page for calls, quotes, WhatsApp and reviews",
  description:
    "Give customers one simple place to call, message, request a quote, see prices, check your service area and leave a review.",
};

type IconName =
  | "arrow"
  | "barChart"
  | "bug"
  | "call"
  | "car"
  | "check"
  | "chevron"
  | "clean"
  | "document"
  | "home"
  | "leaf"
  | "mapPin"
  | "message"
  | "paint"
  | "qr"
  | "review"
  | "shield"
  | "snow"
  | "spark"
  | "wrench"
  | "x";

function Icon({ name, className }: { name: IconName; className?: string }) {
  let content: React.ReactNode;

  switch (name) {
    case "arrow":
      content = (
        <>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </>
      );
      break;
    case "barChart":
      content = (
        <>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19H2" />
        </>
      );
      break;
    case "bug":
      content = (
        <>
          <path d="M8 2l2 3" />
          <path d="m16 2-2 3" />
          <rect x="6" y="5" width="12" height="15" rx="6" />
          <path d="M3 9h3" />
          <path d="M18 9h3" />
          <path d="M3 15h3" />
          <path d="M18 15h3" />
          <path d="M12 5v15" />
        </>
      );
      break;
    case "call":
      content = (
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.92Z" />
      );
      break;
    case "car":
      content = (
        <>
          <path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <path d="M3 11h18v7H3z" />
          <path d="M5 18v2" />
          <path d="M19 18v2" />
          <path d="M7 14h.01" />
          <path d="M17 14h.01" />
        </>
      );
      break;
    case "check":
      content = <path d="m5 12 4 4L19 6" />;
      break;
    case "chevron":
      content = <path d="m9 18 6-6-6-6" />;
      break;
    case "clean":
      content = (
        <>
          <path d="m15 4 5 5" />
          <path d="M13 6 3 16l5 5L18 11" />
          <path d="M14 14 9 9" />
          <path d="m4 14 6 6" />
        </>
      );
      break;
    case "document":
      content = (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h6" />
        </>
      );
      break;
    case "home":
      content = (
        <>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v10h14V10" />
          <path d="M9 20v-6h6v6" />
        </>
      );
      break;
    case "leaf":
      content = (
        <>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15 2 22 3 22 3s1 7-3.1 12.2A7 7 0 0 1 11 20Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6.94C9.39 12.93 12 12 16 12" />
        </>
      );
      break;
    case "mapPin":
      content = (
        <>
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      );
      break;
    case "message":
      content = (
        <>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </>
      );
      break;
    case "paint":
      content = (
        <>
          <path d="M18.4 2.6a2 2 0 0 1 3 3L9 18l-4 1 1-4Z" />
          <path d="m14 7 3 3" />
          <path d="M4 22c2-3 4-3 6 0" />
        </>
      );
      break;
    case "qr":
      content = (
        <>
          <rect x="3" y="3" width="6" height="6" />
          <rect x="15" y="3" width="6" height="6" />
          <rect x="3" y="15" width="6" height="6" />
          <path d="M15 15h2v2h-2z" />
          <path d="M19 15h2v6h-2" />
          <path d="M15 19h2v2h-2z" />
        </>
      );
      break;
    case "review":
      content = (
        <path d="m12 2 3 6.1 6.7 1-4.85 4.72L18 20.5l-6-3.15-6 3.15 1.15-6.68L2.3 9.1l6.7-1Z" />
      );
      break;
    case "shield":
      content = (
        <>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </>
      );
      break;
    case "snow":
      content = (
        <>
          <path d="M12 2v20" />
          <path d="m4.93 4.93 14.14 14.14" />
          <path d="M2 12h20" />
          <path d="m4.93 19.07 14.14-14.14" />
        </>
      );
      break;
    case "spark":
      content = (
        <>
          <path d="m13 2-2 8h7l-7 12 2-8H6Z" />
        </>
      );
      break;
    case "wrench":
      content = (
        <path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17l3 3 8.3-8.3a4 4 0 0 0-.6-5.4Z" />
      );
      break;
    case "x":
      content = (
        <>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </>
      );
      break;
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.9"
      viewBox="0 0 24 24"
    >
      {content}
    </svg>
  );
}

const features: Array<{
  icon: IconName;
  title: string;
  copy: string;
  mock: "quote" | "contact" | "pricing" | "area" | "trust" | "review";
}> = [
  {
    icon: "document",
    title: "Get a Quote",
    copy: "Collect the details you actually need before calling back. Customers can answer your questions and send useful job information.",
    mock: "quote",
  },
  {
    icon: "call",
    title: "Call & WhatsApp",
    copy: "Make contacting you a one-tap decision, without forcing customers to search around for a phone number.",
    mock: "contact",
  },
  {
    icon: "barChart",
    title: "Pricing",
    copy: "Show an hourly rate, a simple price list or an easy starting estimate.",
    mock: "pricing",
  },
  {
    icon: "mapPin",
    title: "Service Area",
    copy: "Make it clear where you work so customers can answer the first question before they even contact you.",
    mock: "area",
  },
  {
    icon: "shield",
    title: "Trust & FAQs",
    copy: "Answer common doubts and show useful business-provided credentials before they become reasons to leave.",
    mock: "trust",
  },
  {
    icon: "review",
    title: "Google Reviews",
    copy: "Give happy customers a simple route to your chosen review destination, with QR materials ready to use.",
    mock: "review",
  },
];

const audiences: Array<{ icon: IconName; label: string }> = [
  { icon: "wrench", label: "Plumbing" },
  { icon: "spark", label: "Electrical" },
  { icon: "snow", label: "HVAC" },
  { icon: "clean", label: "Cleaning" },
  { icon: "home", label: "Roofing" },
  { icon: "leaf", label: "Landscaping" },
  { icon: "wrench", label: "Handyman" },
  { icon: "paint", label: "Painting" },
  { icon: "clean", label: "Pressure washing" },
  { icon: "car", label: "Mobile detailing" },
  { icon: "bug", label: "Pest control" },
  { icon: "home", label: "And more" },
];

const faqs = [
  {
    question: "Do I need a website?",
    answer:
      "No. Your LocalAction page can work on its own. If you already have a website, you can use LocalAction alongside it.",
  },
  {
    question: "Do I need any technical knowledge?",
    answer:
      "No. LocalAction is designed for business owners, not developers. Add your details, choose what customers should be able to do and publish.",
  },
  {
    question: "Can I change my page later?",
    answer:
      "Yes. Update your business information, switch customer tools on or off and change their settings whenever you need.",
  },
  {
    question: "Can customers request a quote?",
    answer:
      "Yes. You choose the questions customers answer, and quote requests are kept in your dashboard so you can follow them up.",
  },
  {
    question: "Does LocalAction replace my Google Business Profile?",
    answer:
      "No. LocalAction works alongside your Google Business Profile and the other places customers find you. It does not automatically change or manage your Google listing.",
  },
  {
    question: "Can I use my own business colours and logo?",
    answer:
      "Yes. You can personalise the public page so it feels like your business rather than a generic template.",
  },
  {
    question: "How do the review features work?",
    answer:
      "You connect the review destination you want customers to use. LocalAction can then use it for your review action and generated QR materials.",
  },
];

function FeatureMock({ type }: { type: (typeof features)[number]["mock"] }) {
  if (type === "quote") {
    return (
      <div className={styles.featureMock} aria-hidden="true">
        <div className={styles.miniField}>What do you need help with?</div>
        <div className={styles.miniField}>Where is the job?</div>
        <div className={styles.miniField}>Add a photo (optional)</div>
        <div className={`${styles.miniAction} ${styles.miniActionPrimary}`}>Request my quote</div>
      </div>
    );
  }

  if (type === "contact") {
    return (
      <div className={styles.featureMock} aria-hidden="true">
        <div className={styles.miniActionRow}>
          <div className={`${styles.miniAction} ${styles.miniActionPrimary}`}>Call now</div>
          <div className={styles.miniAction}>WhatsApp</div>
        </div>
      </div>
    );
  }

  if (type === "pricing") {
    return (
      <div className={styles.featureMock} aria-hidden="true">
        <div className={styles.priceRow}>
          <span>Call-out</span>
          <strong>£65</strong>
        </div>
        <div className={styles.priceRow}>
          <span>Hourly rate</span>
          <strong>£80/hr</strong>
        </div>
        <div className={styles.priceRow}>
          <span>Tap replacement</span>
          <strong>From £95</strong>
        </div>
      </div>
    );
  }

  if (type === "area") {
    return (
      <div className={styles.featureMock} aria-hidden="true">
        <div className={styles.areaRow}>
          <strong>Manchester</strong>
          <span className={styles.areaPill}>Covered</span>
        </div>
        <div className={styles.areaRow}>
          <strong>Stockport</strong>
          <span className={styles.areaPill}>Covered</span>
        </div>
        <div className={styles.areaRow}>
          <strong>Salford</strong>
          <span className={styles.areaPill}>Covered</span>
        </div>
      </div>
    );
  }

  if (type === "trust") {
    return (
      <div className={styles.featureMock} aria-hidden="true">
        <div className={styles.trustRow}>
          <span>Public liability insurance</span>
          <strong>Current</strong>
        </div>
        <div className={styles.trustRow}>
          <span>Gas Safe number</span>
          <strong>Provided</strong>
        </div>
        <div className={styles.trustRow}>
          <span>Common question</span>
          <strong>Answered</strong>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.featureMock} aria-hidden="true">
      <div className={styles.reviewRow}>
        <span className={styles.reviewStars}>★★★★★</span>
        <strong>Leave a review</strong>
      </div>
      <div className={styles.reviewRow}>
        <span>Review QR</span>
        <strong>Ready</strong>
      </div>
      <div className={styles.reviewRow}>
        <span>Printable sign</span>
        <strong>Ready</strong>
      </div>
    </div>
  );
}

function QrPattern({ large = false }: { large?: boolean }) {
  const count = large ? 49 : 25;
  return (
    <div className={large ? styles.reviewQr : styles.qrMock} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className={styles.page} id="marketing-home">
      <header className={styles.marketingHeader}>
        <div className={`${styles.container} ${styles.nav}`}>
          <Link className={styles.logo} href="/" aria-label="LocalAction home">
            <span className={styles.logoMark}>LA</span>
            LocalAction
          </Link>

          <nav className={styles.navLinks} aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#what-you-get">What you get</a>
            <a href="#who-its-for">Who it&apos;s for</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className={styles.navActions}>
            <Link className={styles.loginLink} href="/login">
              Log in
            </Link>
            <Link className={styles.primaryButton} href="/signup">
              Create my page
              <Icon name="arrow" className={styles.buttonIcon} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowDot} />
                For local service businesses
              </div>
              <h1 className={styles.heroTitle}>
                Calls, quotes, WhatsApp and reviews — <em>from one simple page.</em>
              </h1>
              <p className={styles.heroCopy}>
                Give customers one clean, mobile-friendly place to take the next step — contact you,
                request a quote, see prices, check where you work and leave a review.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primaryButton} href="/signup">
                  Create my page
                  <Icon name="arrow" className={styles.buttonIcon} />
                </Link>
                <a className={styles.secondaryButton} href="#how-it-works">
                  See how it works
                </a>
              </div>
              <div className={styles.heroReassurance}>
                <span>
                  <Icon name="check" className={styles.tinyCheck} /> No website builder
                </span>
                <span>
                  <Icon name="check" className={styles.tinyCheck} /> No code
                </span>
                <span>
                  <Icon name="check" className={styles.tinyCheck} /> Change anything later
                </span>
              </div>
            </div>

            <div className={styles.heroVisual} aria-label="Example LocalAction customer page">
              <div className={styles.heroVisualBackdrop} />
              <div className={`${styles.floatingCard} ${styles.floatQuote}`} aria-hidden="true">
                <span className={styles.floatingIcon}>
                  <Icon name="document" />
                </span>
                <span>
                  <strong>New quote request</strong>
                  <span>Bathroom tap replacement</span>
                </span>
              </div>
              <div className={`${styles.floatingCard} ${styles.floatArea}`} aria-hidden="true">
                <span className={styles.floatingIcon}>
                  <Icon name="mapPin" />
                </span>
                <span>
                  <strong>Service area checked</strong>
                  <span>Manchester is covered</span>
                </span>
              </div>

              <div className={styles.phone}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneNotch} />
                  <div className={styles.businessIdentity}>
                    <div className={styles.businessAvatar}>OP</div>
                    <div>
                      <strong>Oak &amp; Pipe Plumbing</strong>
                      <span>Local plumber · Manchester</span>
                    </div>
                  </div>
                  <h2 className={styles.phoneIntro}>How can we help?</h2>
                  <p className={styles.phoneCopy}>
                    Repairs, installations and emergency plumbing across Greater Manchester.
                  </p>
                  <div className={styles.phonePrimary}>
                    <Icon name="document" className={styles.buttonIcon} /> Get a quote
                  </div>
                  <div className={styles.quickActions}>
                    <div className={styles.quickAction}>
                      <Icon name="call" />
                      Call
                    </div>
                    <div className={styles.quickAction}>
                      <Icon name="message" />
                      WhatsApp
                    </div>
                    <div className={styles.quickAction}>
                      <Icon name="review" />
                      Review
                    </div>
                  </div>
                  <div className={styles.phoneCards}>
                    <div className={styles.phoneCard}>
                      <span className={styles.phoneCardIcon}>
                        <Icon name="barChart" />
                      </span>
                      <span>
                        <strong>Pricing</strong>
                        <span>Clear starting prices</span>
                      </span>
                      <span className={styles.phoneCardValue}>From £65</span>
                    </div>
                    <div className={styles.phoneCard}>
                      <span className={styles.phoneCardIcon}>
                        <Icon name="mapPin" />
                      </span>
                      <span>
                        <strong>Service area</strong>
                        <span>Manchester · Stockport · Salford</span>
                      </span>
                      <span className={styles.phoneCardValue}>Check</span>
                    </div>
                    <div className={styles.phoneCard}>
                      <span className={styles.phoneCardIcon}>
                        <Icon name="shield" />
                      </span>
                      <span>
                        <strong>Trust &amp; credentials</strong>
                        <span>Business-provided information</span>
                      </span>
                      <span className={styles.phoneCardValue}>View</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.problemSection}>
          <div className={`${styles.container} ${styles.problemGrid}`}>
            <div>
              <h2 className={styles.problemTitle}>Customers shouldn&apos;t have to hunt for the next step.</h2>
              <p className={styles.problemCopy}>
                They already found your business. Now they want a handful of simple answers before they decide what to do next.
              </p>
            </div>
            <div className={styles.questionCloud} aria-label="Questions customers commonly have">
              <span className={styles.questionChip}>
                <Icon name="call" /> Can I call you now?
              </span>
              <span className={styles.questionChip}>
                <Icon name="mapPin" /> Do you cover my area?
              </span>
              <span className={styles.questionChip}>
                <Icon name="barChart" /> What does it cost?
              </span>
              <span className={styles.questionChip}>
                <Icon name="document" /> Can I request a quote?
              </span>
              <span className={styles.questionChip}>
                <Icon name="message" /> Can I send details?
              </span>
              <span className={styles.questionChip}>
                <Icon name="review" /> Where can I leave a review?
              </span>
            </div>
            <div className={styles.journey}>
              <div className={styles.journeyStep}>
                <span className={styles.journeyNumber}>01</span>
                <span>
                  <strong>Customer finds you</strong>
                  <span>Search, social, QR or your website</span>
                </span>
              </div>
              <span className={styles.journeyArrow}>
                <Icon name="arrow" />
              </span>
              <div className={styles.journeyStep}>
                <span className={styles.journeyNumber}>02</span>
                <span>
                  <strong>Opens your page</strong>
                  <span>One clean place with the useful details</span>
                </span>
              </div>
              <span className={styles.journeyArrow}>
                <Icon name="arrow" />
              </span>
              <div className={styles.journeyStep}>
                <span className={styles.journeyNumber}>03</span>
                <span>
                  <strong>Takes action</strong>
                  <span>Calls · WhatsApps · requests a quote · leaves a review</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section} id="what-you-get">
          <div className={styles.container}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionKicker}>What you get</span>
              <h2 className={styles.sectionTitle}>Everything they need. Nothing they don&apos;t.</h2>
              <p className={styles.sectionCopy}>
                Turn on the customer actions that make sense for your business. Keep the rest out of the way.
              </p>
            </div>
            <div className={styles.featureGrid}>
              {features.map((feature) => (
                <article className={styles.featureCard} key={feature.title}>
                  <span className={styles.featureIcon}>
                    <Icon name={feature.icon} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                  <FeatureMock type={feature.mock} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.softSection} id="how-it-works">
          <div className={styles.container}>
            <div className={styles.centeredHeader}>
              <span className={styles.sectionKicker}>How it works</span>
              <h2 className={styles.sectionTitle}>From business details to a live page in three simple steps.</h2>
              <p className={styles.sectionCopy}>
                No blank canvas and no website-building project. Start with the useful stuff and get your page ready.
              </p>
            </div>
            <div className={styles.stepsGrid}>
              <article className={styles.stepCard}>
                <span className={styles.stepNumber}>01</span>
                <h3>Add your business</h3>
                <p>Tell us the basics — your name, contact details, what you do and how customers should recognise you.</p>
                <div className={styles.stepVisual} aria-hidden="true">
                  <span className={styles.fakeLabel}>Business name</span>
                  <div className={styles.fakeInput} />
                  <span className={styles.fakeLabel}>Phone number</span>
                  <div className={styles.fakeInput} />
                </div>
              </article>
              <article className={styles.stepCard}>
                <span className={styles.stepNumber}>02</span>
                <h3>Choose what customers can do</h3>
                <p>Start with a sensible set of customer tools. Turn things on or off without configuring everything at once.</p>
                <div className={styles.stepVisual} aria-hidden="true">
                  <div className={styles.fakeToolRow}>
                    <span className={styles.fakeToolIcon}>
                      <Icon name="document" />
                    </span>
                    <strong>Get a quote</strong>
                    <span className={styles.fakeSwitch} />
                  </div>
                  <div className={styles.fakeToolRow}>
                    <span className={styles.fakeToolIcon}>
                      <Icon name="barChart" />
                    </span>
                    <strong>Pricing</strong>
                    <span className={styles.fakeSwitch} />
                  </div>
                </div>
              </article>
              <article className={styles.stepCard}>
                <span className={styles.stepNumber}>03</span>
                <h3>Publish and share</h3>
                <p>Your page is ready when you are. Share the link or a QR wherever customers already find your business.</p>
                <div className={styles.stepVisual} aria-hidden="true">
                  <div className={styles.publishVisual}>
                    <div className={styles.miniPublishedPage}>
                      <strong>Oak &amp; Pipe Plumbing</strong>
                      <div className={styles.miniPublishedButton}>Get a quote</div>
                    </div>
                    <QrPattern />
                  </div>
                </div>
              </article>
            </div>
            <div className={styles.stepsCta}>
              <Link className={styles.primaryButton} href="/signup">
                Create my page
                <Icon name="arrow" className={styles.buttonIcon} />
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section} id="who-its-for">
          <div className={styles.container}>
            <div className={styles.centeredHeader}>
              <span className={styles.sectionKicker}>Built for local services</span>
              <h2 className={styles.sectionTitle}>Made for businesses where every enquiry matters.</h2>
              <p className={styles.sectionCopy}>
                The page stays simple enough for a one-person trade business, while giving customers more useful ways to act than a basic contact page.
              </p>
            </div>
            <div className={styles.audienceGrid}>
              {audiences.map((audience) => (
                <div className={styles.audienceCard} key={audience.label}>
                  <span className={styles.audienceIcon}>
                    <Icon name={audience.icon} />
                  </span>
                  {audience.label}
                </div>
              ))}
            </div>
            <p className={styles.audienceFootnote}>
              Don&apos;t see your trade? LocalAction works for almost any local service business.
            </p>
          </div>
        </section>

        <section className={styles.softSection}>
          <div className={`${styles.container} ${styles.positioningGrid}`}>
            <div className={styles.positioningCopy}>
              <span className={styles.sectionKicker}>Less building. More doing.</span>
              <h2 className={styles.sectionTitle}>Not another website builder.</h2>
              <p className={styles.sectionCopy}>
                You don&apos;t need to choose a template, move blocks around or spend an afternoon deciding what goes where. Add your business, choose the useful customer actions and publish.
              </p>
              <div className={styles.positioningNote}>
                <strong>Already have a website?</strong> Keep it. <strong>Don&apos;t have one?</strong> That&apos;s fine too. LocalAction can work on its own or alongside the places customers already find you.
              </div>
            </div>
            <div className={styles.comparison} aria-label="Website builder and LocalAction comparison">
              <div className={styles.comparisonHeader}>
                <div>Typical page builder</div>
                <div>LocalAction</div>
              </div>
              {[
                ["Choose a template", "Add your business"],
                ["Design pages", "Choose customer actions"],
                ["Build forms", "Start with sensible defaults"],
                ["Configure layouts", "Turn things on or off"],
                ["Keep tweaking", "Publish"],
              ].map(([left, right]) => (
                <div className={styles.comparisonRow} key={left}>
                  <div>
                    <span className={styles.comparisonCross}>
                      <Icon name="x" />
                    </span>
                    {left}
                  </div>
                  <div>
                    <span className={styles.comparisonCheck}>
                      <Icon name="check" />
                    </span>
                    {right}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.analyticsSection}>
          <div className={`${styles.container} ${styles.analyticsGrid}`}>
            <div className={styles.dashboardMock} aria-label="Example LocalAction activity dashboard with sample data">
              <div className={styles.dashboardTop}>
                <strong>Last 30 days</strong>
                <span className={styles.sampleBadge}>Sample data</span>
              </div>
              <div className={styles.metricGrid}>
                <div className={styles.metricCard}>
                  <span>Page views</span>
                  <strong>238</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Quote requests</span>
                  <strong>21</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Calls</span>
                  <strong>34</strong>
                </div>
                <div className={styles.metricCard}>
                  <span>Review clicks</span>
                  <strong>12</strong>
                </div>
              </div>
              <div className={styles.activityMock}>
                <div className={styles.activityMockRow}>
                  <span className={styles.activityMockIcon}>
                    <Icon name="document" />
                  </span>
                  New quote request
                  <time>8 min ago</time>
                </div>
                <div className={styles.activityMockRow}>
                  <span className={styles.activityMockIcon}>
                    <Icon name="call" />
                  </span>
                  Customer tapped Call
                  <time>22 min ago</time>
                </div>
                <div className={styles.activityMockRow}>
                  <span className={styles.activityMockIcon}>
                    <Icon name="review" />
                  </span>
                  Customer opened Review
                  <time>1 hr ago</time>
                </div>
              </div>
            </div>
            <div className={styles.analyticsCopy}>
              <span className={styles.sectionKicker}>Simple activity</span>
              <h2 className={styles.sectionTitle}>See what customers actually use.</h2>
              <p className={styles.sectionCopy}>
                Your page isn&apos;t a black box. See when customers view it, request quotes, call, open WhatsApp or head to your review page — without a complicated analytics dashboard.
              </p>
              <div className={styles.analyticsPoints}>
                <div className={styles.analyticsPoint}>
                  <span className={styles.analyticsPointIcon}>
                    <Icon name="barChart" />
                  </span>
                  Simple activity overview
                </div>
                <div className={styles.analyticsPoint}>
                  <span className={styles.analyticsPointIcon}>
                    <Icon name="document" />
                  </span>
                  Recent quote requests
                </div>
                <div className={styles.analyticsPoint}>
                  <span className={styles.analyticsPointIcon}>
                    <Icon name="check" />
                  </span>
                  Just the numbers that help you follow up
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={`${styles.container} ${styles.reviewKitGrid}`}>
            <div className={styles.reviewAssets} aria-label="Example LocalAction review materials">
              <div className={styles.reviewSign}>
                <span className={styles.reviewSignMark}>OP</span>
                <h4>Happy with the job?</h4>
                <p>Scan here to leave Oak &amp; Pipe Plumbing a review.</p>
                <QrPattern large />
              </div>
              <div className={styles.reviewSocial}>
                <span>Oak &amp; Pipe Plumbing</span>
                <strong>Your feedback means a lot.</strong>
                <div className={styles.reviewSocialStars}>★★★★★</div>
              </div>
            </div>
            <div>
              <span className={styles.sectionKicker}>Review Kit</span>
              <h2 className={styles.sectionTitle}>Turn a happy customer into an easier review journey.</h2>
              <p className={styles.sectionCopy}>
                Connect the review destination you want customers to use, then generate ready-to-use materials from the same place you manage your customer page.
              </p>
              <div className={styles.reviewPoints}>
                <div className={styles.reviewPoint}>
                  <span className={styles.reviewPointIcon}>
                    <Icon name="qr" />
                  </span>
                  <span>
                    <strong>Review QR</strong>
                    <span>Put an easy scan route on invoices, cards or at the counter.</span>
                  </span>
                </div>
                <div className={styles.reviewPoint}>
                  <span className={styles.reviewPointIcon}>
                    <Icon name="document" />
                  </span>
                  <span>
                    <strong>Printable sign</strong>
                    <span>Generate a branded sign you can use where customers will actually see it.</span>
                  </span>
                </div>
                <div className={styles.reviewPoint}>
                  <span className={styles.reviewPointIcon}>
                    <Icon name="review" />
                  </span>
                  <span>
                    <strong>Social graphic</strong>
                    <span>Get a ready-made branded square graphic when you need one.</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.reassuranceStrip}>
          <div className={`${styles.container} ${styles.reassuranceGrid}`}>
            <div className={styles.reassuranceItem}>
              <Icon name="check" /> No coding
            </div>
            <div className={styles.reassuranceItem}>
              <Icon name="call" /> Mobile friendly
            </div>
            <div className={styles.reassuranceItem}>
              <Icon name="paint" /> Your branding
            </div>
            <div className={styles.reassuranceItem}>
              <Icon name="spark" /> Change anytime
            </div>
            <div className={styles.reassuranceItem}>
              <Icon name="wrench" /> Built for local services
            </div>
          </div>
        </div>

        <section className={styles.section} id="faq">
          <div className={styles.container}>
            <div className={styles.centeredHeader}>
              <span className={styles.sectionKicker}>FAQ</span>
              <h2 className={styles.sectionTitle}>A few things you might want to know first.</h2>
            </div>
            <div className={styles.faqList}>
              {faqs.map((faq) => (
                <details className={styles.faqItem} key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p className={styles.faqAnswer}>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.container}>
            <div className={styles.finalCtaCard}>
              <div className={styles.finalCtaCopy}>
                <h2>Make it easier for customers to choose what to do next.</h2>
                <p>
                  Give them one simple place to call, message, request a quote, check the details they care about and leave a review.
                </p>
              </div>
              <div className={styles.finalCtaAction}>
                <Link className={styles.darkButton} href="/signup">
                  Create my page
                  <Icon name="arrow" className={styles.buttonIcon} />
                </Link>
                <span className={styles.finalCtaLogin}>
                  Already have an account? <Link href="/login">Log in</Link>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerGrid}`}>
          <div className={styles.footerBrand}>
            <span className={styles.footerMark}>LA</span>
            LocalAction
          </div>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#what-you-get">What you get</a>
            <a href="#who-its-for">Who it&apos;s for</a>
            <a href="#faq">FAQ</a>
            <Link href="/login">Log in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
