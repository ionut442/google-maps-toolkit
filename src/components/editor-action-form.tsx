"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/** Keep drafts intact when a server-side save fails. */
export function EditorActionForm({
  action,
  children,
  className = "stack-form",
  savedMessage = "Saved",
}: {
  action: (data: FormData) => Promise<void>;
  children: ReactNode;
  className?: string;
  savedMessage?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      await action(data);
      setMessage(savedMessage);
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(
        "We couldn't save that. Your changes are still here. Check your entries and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={action}
      onSubmit={submit}
      aria-busy={pending}
      className="editor-action-form"
    >
      <fieldset disabled={pending} className={className}>
        {children}
      </fieldset>
      <p
        className={failed ? "form-feedback error" : "form-feedback"}
        role={failed ? "alert" : "status"}
        aria-live="polite"
      >
        {pending ? "Saving…" : message}
      </p>
    </form>
  );
}
