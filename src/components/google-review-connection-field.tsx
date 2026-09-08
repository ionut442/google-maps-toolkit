"use client";

import { useState, useTransition } from "react";
import { extractReviewLinkAction } from "@/app/actions";

export function GoogleReviewConnectionField({
  initialMapsUrl,
  initialReviewUrl,
  fieldError,
}: {
  initialMapsUrl: string | null;
  initialReviewUrl: string | null;
  fieldError?: string;
}) {
  const startingMapsUrl = initialMapsUrl ?? initialReviewUrl ?? "";
  const startingReviewUrl = initialReviewUrl ?? "";
  const [googleMapsUrl, setGoogleMapsUrl] = useState(startingMapsUrl);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(startingReviewUrl);
  const [resolvedGoogleMapsUrl, setResolvedGoogleMapsUrl] = useState(
    startingReviewUrl ? startingMapsUrl : "",
  );
  const [reviewLinkError, setReviewLinkError] = useState("");
  const [pending, startTransition] = useTransition();

  function updateGoogleMapsUrl(value: string) {
    setGoogleMapsUrl(value);
    setReviewLinkError("");
    if (value === startingMapsUrl) {
      setGoogleReviewUrl(startingReviewUrl);
      setResolvedGoogleMapsUrl(startingReviewUrl ? startingMapsUrl : "");
    } else if (value !== resolvedGoogleMapsUrl) {
      setGoogleReviewUrl("");
      setResolvedGoogleMapsUrl("");
    }
  }

  function resolveReviewLink() {
    setReviewLinkError("");
    startTransition(async () => {
      const result = await extractReviewLinkAction(googleMapsUrl);
      if (!result.success) {
        setGoogleReviewUrl("");
        setResolvedGoogleMapsUrl("");
        setReviewLinkError(result.error);
        return;
      }
      setGoogleReviewUrl(result.reviewUrl);
      setResolvedGoogleMapsUrl(googleMapsUrl);
    });
  }

  const ready = Boolean(
    googleReviewUrl && resolvedGoogleMapsUrl === googleMapsUrl,
  );
  return (
    <div className="google-profile-setup">
      <p className="field-intro">
        Open your business in Google Maps, choose Share → Copy link, then paste
        it here.
      </p>
      <label>
        Google Maps share link
        <input
          name="googleMapsUrl"
          type="url"
          value={googleMapsUrl}
          onChange={(event) => updateGoogleMapsUrl(event.currentTarget.value)}
          placeholder="https://maps.app.goo.gl/..."
        />
        {fieldError && <small className="error">{fieldError}</small>}
      </label>
      <button
        className="button secondary google-review-resolve"
        type="button"
        disabled={pending || !googleMapsUrl.trim()}
        onClick={resolveReviewLink}
      >
        {pending ? "Getting review link…" : "Get review link"}
      </button>
      <input type="hidden" name="googleReviewUrl" value={googleReviewUrl} />
      <input
        type="hidden"
        name="resolvedGoogleMapsUrl"
        value={resolvedGoogleMapsUrl}
      />
      {ready && (
        <div className="google-review-ready" role="status">
          <strong>Review link ready</strong>
          <a href={googleReviewUrl} target="_blank" rel="noopener noreferrer">
            Test review link ↗
          </a>
        </div>
      )}
      {reviewLinkError && (
        <p className="error callout" role="alert">
          {reviewLinkError}
        </p>
      )}
    </div>
  );
}
