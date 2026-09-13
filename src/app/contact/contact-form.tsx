"use client";

import { useState, type FormEvent } from "react";
import styles from "@/app/marketing.module.css";
import { contactTopics } from "@/lib/contact-options";

type Status = { kind: "success" | "error"; message: string } | null;

export function ContactForm() {
  const [status, setStatus] = useState<Status>(null);
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSending(true);
    setStatus(null);
    const values = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(values.entries())),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);
      setStatus({
        kind: "success",
        message:
          result.message ??
          "Message sent. Thanks — we'll get back to you as soon as we can.",
      });
      form.reset();
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "We couldn't send your message. You can email us directly at support@local-action.com.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <label>
        Name
        <input
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={100}
          required
        />
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </label>
      <label>
        Business name <span>(optional)</span>
        <input
          name="businessName"
          autoComplete="organization"
          maxLength={120}
        />
      </label>
      <label>
        What can we help with?
        <select name="topic" defaultValue="" required>
          <option value="" disabled>
            Select a topic
          </option>
          {contactTopics.map((topic) => (
            <option key={topic}>{topic}</option>
          ))}
        </select>
      </label>
      <label>
        Message
        <textarea name="message" minLength={10} maxLength={4000} required />
      </label>
      <label className={styles.honeypot} aria-hidden="true">
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <button type="submit" disabled={sending}>
        {sending ? "Sending…" : "Send message"}
      </button>
      {status && (
        <p
          className={styles.formStatus}
          data-error={status.kind === "error"}
          role={status.kind === "error" ? "alert" : "status"}
        >
          {status.message}{" "}
          {status.kind === "error" && (
            <a href="mailto:support@local-action.com">
              support@local-action.com
            </a>
          )}
        </p>
      )}
    </form>
  );
}
