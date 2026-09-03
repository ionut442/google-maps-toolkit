"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function AuthForm({
  action,
  kind,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  kind: "signup" | "login";
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const field = (name: string) => state.fields?.[name]?.[0];
  return (
    <form action={formAction} className="stack card auth-form">
      {kind === "signup" && (
        <label>
          Business name
          <input
            name="businessName"
            required
            minLength={2}
            aria-describedby="businessName-error"
          />
          {field("businessName") && (
            <small id="businessName-error" className="error">
              {field("businessName")}
            </small>
          )}
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(field("email"))}
          aria-describedby="email-error"
        />
        {field("email") && (
          <small id="email-error" className="error">
            {field("email")}
          </small>
        )}
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete={kind === "signup" ? "new-password" : "current-password"}
          required
          minLength={kind === "signup" ? 10 : 1}
          aria-invalid={Boolean(field("password"))}
          aria-describedby="password-error"
        />
        {field("password") && (
          <small id="password-error" className="error">
            {field("password")}
          </small>
        )}
      </label>
      {state.error && (
        <p role="alert" className="error callout">
          {state.error}
        </p>
      )}
      <button disabled={pending}>
        {pending ? "Working…" : kind === "signup" ? "Create account" : "Log in"}
      </button>
    </form>
  );
}
