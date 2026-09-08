"use client";

import { useRef, useState } from "react";
import type { QuoteField, QuoteModuleConfig } from "@/lib/quote-config";

function describedBy(field: QuoteField, hasError: boolean) {
  return (
    [
      field.helperText ? `${field.id}-help` : "",
      hasError ? `${field.id}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

function FieldLabel({ field }: { field: QuoteField }) {
  return (
    <span className="quote-field-label">
      {field.label}
      {field.required && <span aria-hidden="true"> *</span>}
    </span>
  );
}

export function QuoteFieldControl({
  field,
  error,
  onFiles,
}: {
  field: QuoteField;
  error?: string;
  onFiles: (files: FileList | null) => void;
}) {
  const name = `field:${field.id}`;
  const aria = describedBy(field, Boolean(error));
  if (field.type === "DROPDOWN")
    return (
      <label htmlFor={field.id}>
        <FieldLabel field={field} />
        <select
          id={field.id}
          name={name}
          required={field.required}
          aria-describedby={aria}
          aria-invalid={Boolean(error)}
        >
          <option value="">Choose an option</option>
          {field.choices.map((choice) => (
            <option value={choice} key={choice}>
              {choice}
            </option>
          ))}
        </select>
      </label>
    );
  if (field.type === "MULTIPLE_CHOICE")
    return (
      <fieldset
        className="quote-choice-field"
        aria-describedby={aria}
        aria-invalid={Boolean(error)}
      >
        <legend>
          <FieldLabel field={field} />
        </legend>
        {field.choices.map((choice) => (
          <label className="quote-option" key={choice}>
            <input type="checkbox" name={name} value={choice} />
            <span>{choice}</span>
          </label>
        ))}
      </fieldset>
    );
  if (field.type === "CHECKBOX")
    return (
      <label className="quote-option" htmlFor={field.id}>
        <input
          id={field.id}
          type="checkbox"
          name={name}
          value="true"
          required={field.required}
          aria-describedby={aria}
          aria-invalid={Boolean(error)}
        />
        <span>
          <FieldLabel field={field} />
        </span>
      </label>
    );
  if (field.type === "PHOTO")
    return (
      <label htmlFor={field.id}>
        <FieldLabel field={field} />
        <input
          id={field.id}
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required={field.required}
          aria-describedby={aria}
          aria-invalid={Boolean(error)}
          onChange={(event) => onFiles(event.currentTarget.files)}
        />
      </label>
    );
  if (field.type === "TEXT" && field.multiline)
    return (
      <label htmlFor={field.id}>
        <FieldLabel field={field} />
        <textarea
          id={field.id}
          name={name}
          required={field.required}
          minLength={field.minLength}
          maxLength={field.maxLength}
          rows={4}
          aria-describedby={aria}
          aria-invalid={Boolean(error)}
        />
      </label>
    );
  const inputType =
    field.type === "NUMBER"
      ? "number"
      : field.type === "CONTACT" && field.contactKind === "EMAIL"
        ? "email"
        : field.type === "CONTACT" && field.contactKind === "PHONE"
          ? "tel"
          : "text";
  return (
    <label htmlFor={field.id}>
      <FieldLabel field={field} />
      <input
        id={field.id}
        name={name}
        type={inputType}
        required={field.required}
        min={field.type === "NUMBER" ? field.min : undefined}
        max={field.type === "NUMBER" ? field.max : undefined}
        step={field.type === "NUMBER" ? field.step : undefined}
        maxLength={
          field.type === "TEXT"
            ? field.maxLength
            : field.type === "ADDRESS"
              ? field.maxLength
              : field.type === "CONTACT" && field.contactKind === "NAME"
                ? 120
                : undefined
        }
        autoComplete={
          field.type === "CONTACT"
            ? field.contactKind === "NAME"
              ? "name"
              : field.contactKind === "EMAIL"
                ? "email"
                : "tel"
            : field.type === "ADDRESS"
              ? "postal-code"
              : undefined
        }
        aria-describedby={aria}
        aria-invalid={Boolean(error)}
      />
    </label>
  );
}

export function QuoteRequestForm({
  slug,
  config,
  pricingContext,
  pricingSummary,
}: {
  slug: string;
  config: QuoteModuleConfig;
  pricingContext?: { addOnIds: string[]; quantity?: number };
  pricingSummary?: string;
}) {
  const submissionKey = useRef("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<string[]>([]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (fileNames.length > 3) {
      setFieldErrors({ photos: "Add no more than 3 photos." });
      return;
    }
    setPending(true);
    setMessage("");
    setFieldErrors({});
    const data = new FormData(event.currentTarget);
    submissionKey.current ||= crypto.randomUUID();
    data.set("submissionKey", submissionKey.current);
    try {
      const response = await fetch(`/api/quotes/${encodeURIComponent(slug)}`, {
        method: "POST",
        body: data,
        credentials: "same-origin",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Record<string, string>;
      };
      if (response.ok && payload.ok) {
        setSuccess(true);
        return;
      }
      setMessage(
        payload.message ??
          "Your request could not be submitted. Please try again.",
      );
      setFieldErrors(payload.fieldErrors ?? {});
    } catch {
      setMessage(
        "Your request could not be submitted. Check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (success)
    return (
      <div className="quote-success" role="status">
        <strong>Request sent</strong>
        <p>
          Your quote request was saved. The business will contact you using the
          details provided.
        </p>
      </div>
    );

  return (
    <form className="public-quote-form" onSubmit={submit} noValidate>
      {pricingContext?.addOnIds.map((id) => (
        <input key={id} type="hidden" name="pricingAddOn" value={id} />
      ))}
      {pricingContext?.quantity !== undefined && (
        <input
          type="hidden"
          name="pricingQuantity"
          value={String(pricingContext.quantity)}
        />
      )}
      {pricingSummary && (
        <p className="estimate-context">
          <strong>Estimate context:</strong> {pricingSummary}. This is not a
          binding quote.
        </p>
      )}
      <div className="quote-honeypot" aria-hidden="true">
        <label htmlFor={`website-${slug}`}>Leave this field empty</label>
        <input
          id={`website-${slug}`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      {config.fields.map((field) => {
        const error =
          fieldErrors[field.id] ??
          (field.type === "PHOTO" ? fieldErrors.photos : undefined);
        return (
          <div className="quote-field" key={field.id}>
            <QuoteFieldControl
              field={field}
              error={error}
              onFiles={(files) =>
                setFileNames(
                  files ? Array.from(files).map((file) => file.name) : [],
                )
              }
            />
            {field.helperText && (
              <small id={`${field.id}-help`}>{field.helperText}</small>
            )}
            {field.type === "PHOTO" && fileNames.length > 0 && (
              <small className="quote-file-feedback">
                {fileNames.length} selected: {fileNames.join(", ")}
              </small>
            )}
            {error && (
              <p className="quote-field-error" id={`${field.id}-error`}>
                {error}
              </p>
            )}
          </div>
        );
      })}
      {message && (
        <p className="quote-form-error" role="alert">
          {message}
        </p>
      )}
      <button className="quote-submit" type="submit" disabled={pending}>
        {pending ? "Sending request…" : "Send quote request"}
      </button>
      <small>Required fields are marked *. Photos: maximum 3, 5 MB each.</small>
    </form>
  );
}
