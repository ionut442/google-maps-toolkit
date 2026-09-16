"use client";

import { useActionState } from "react";
import { createBusinessAction } from "@/app/actions";

export function BusinessNameForm() {
  const [state, formAction, pending] = useActionState(createBusinessAction, {});
  const error = state.fields?.businessName?.[0];
  return (
    <form action={formAction} className="stack card auth-form">
      <label>
        Business name
        <input
          name="businessName"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={100}
          aria-invalid={Boolean(error)}
          aria-describedby="businessName-error"
        />
        {error && (
          <small id="businessName-error" className="error">
            {error}
          </small>
        )}
      </label>
      {state.error && (
        <p role="alert" className="error callout">
          {state.error}
        </p>
      )}
      <button disabled={pending}>{pending ? "Saving…" : "Continue"}</button>
    </form>
  );
}
