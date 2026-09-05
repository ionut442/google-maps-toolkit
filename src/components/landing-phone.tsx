"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ChartNoAxesColumn,
  FileText,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
} from "lucide-react";
import styles from "@/app/landing.module.css";

export function LandingPhone() {
  const [view, setView] = useState<"main" | "quote" | "done">("main");

  return (
    <div className={styles.phoneScreen} aria-live="polite">
      <div className={styles.phoneNotch} />
      {view === "main" ? (
        <>
          <div className={styles.businessIdentity}>
            <div className={styles.businessAvatar}>OP</div>
            <div>
              <strong>Oak &amp; Pipe Plumbing</strong>
              <span>Local plumber · Manchester</span>
            </div>
          </div>
          <h2 className={styles.phoneIntro}>How can we help?</h2>
          <p className={styles.phoneCopy}>
            Repairs, installations and emergency plumbing across Greater
            Manchester.
          </p>
          <button
            className={styles.phonePrimary}
            onClick={() => setView("quote")}
          >
            <FileText size={17} /> Get a quote
          </button>
          <div className={styles.quickActions}>
            <span className={styles.quickAction}>
              <Phone size={18} />
              Call
            </span>
            <span className={styles.quickAction}>
              <MessageCircle size={18} />
              WhatsApp
            </span>
            <span className={styles.quickAction}>
              <Star size={18} />
              Review
            </span>
          </div>
          <div className={styles.phoneCards}>
            <div className={styles.phoneCard}>
              <span className={styles.phoneCardIcon}>
                <ChartNoAxesColumn size={18} />
              </span>
              <span>
                <strong>Pricing</strong>
                <span>Clear starting prices</span>
              </span>
              <span className={styles.phoneCardValue}>From £65</span>
            </div>
            <div className={styles.phoneCard}>
              <span className={styles.phoneCardIcon}>
                <MapPin size={18} />
              </span>
              <span>
                <strong>Service area</strong>
                <span>Manchester · Stockport · Salford</span>
              </span>
              <span className={styles.phoneCardValue}>Check</span>
            </div>
            <div className={styles.phoneCard}>
              <span className={styles.phoneCardIcon}>
                <ShieldCheck size={18} />
              </span>
              <span>
                <strong>Trust &amp; credentials</strong>
                <span>Business-provided information</span>
              </span>
              <span className={styles.phoneCardValue}>View</span>
            </div>
          </div>
        </>
      ) : view === "quote" ? (
        <div className={styles.phoneFormView}>
          <button className={styles.phoneBack} onClick={() => setView("main")}>
            <ArrowLeft size={15} /> Back
          </button>
          <span className={styles.phoneFormLabel}>Quote request</span>
          <h2>Tell us about the job</h2>
          <label>
            What needs doing?
            <textarea defaultValue="Bathroom tap replacement" />
          </label>
          <label>
            Your postcode
            <input defaultValue="M20 3AB" />
          </label>
          <button
            className={styles.phonePrimary}
            onClick={() => setView("done")}
          >
            Request my quote
          </button>
        </div>
      ) : (
        <div className={styles.phoneDoneView}>
          <span className={styles.phoneDoneIcon}>✓</span>
          <span className={styles.phoneFormLabel}>Request sent</span>
          <h2>Oak &amp; Pipe will be in touch.</h2>
          <p>Your details are now in their quote inbox.</p>
          <button className={styles.phoneBack} onClick={() => setView("main")}>
            <ArrowLeft size={15} /> Back to page
          </button>
        </div>
      )}
    </div>
  );
}
