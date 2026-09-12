"use client";

import { useState, useTransition } from "react";
import { extractReviewLinkAction } from "@/app/actions";

export function GoogleReviewConnectionField({
  initialMapsUrl,
  initialReviewUrl,
  initialReviewScore = null,
  initialReviewCount = null,
  initialDisplayReviewScore = false,
  initialDisplayReviewCount = false,
  fieldError,
}: {
  initialMapsUrl: string | null;
  initialReviewUrl: string | null;
  initialReviewScore?: number | null;
  initialReviewCount?: number | null;
  initialDisplayReviewScore?: boolean;
  initialDisplayReviewCount?: boolean;
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
  const [reviewScore, setReviewScore] = useState(initialReviewScore);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [displayReviewScore, setDisplayReviewScore] = useState(
    initialDisplayReviewScore,
  );
  const [displayReviewCount, setDisplayReviewCount] = useState(
    initialDisplayReviewCount,
  );
  const [statsRefreshed, setStatsRefreshed] = useState(false);
  const [pending, startTransition] = useTransition();

  function updateGoogleMapsUrl(value: string) {
    setGoogleMapsUrl(value);
    setReviewLinkError("");
    if (value === startingMapsUrl) {
      setGoogleReviewUrl(startingReviewUrl);
      setResolvedGoogleMapsUrl(startingReviewUrl ? startingMapsUrl : "");
      setReviewScore(initialReviewScore);
      setReviewCount(initialReviewCount);
      setDisplayReviewScore(initialDisplayReviewScore);
      setDisplayReviewCount(initialDisplayReviewCount);
    } else if (value !== resolvedGoogleMapsUrl) {
      setGoogleReviewUrl("");
      setResolvedGoogleMapsUrl("");
      setReviewScore(null);
      setReviewCount(null);
      setDisplayReviewScore(false);
      setDisplayReviewCount(false);
    }
    setStatsRefreshed(false);
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
      const refreshingCurrentListing = resolvedGoogleMapsUrl === googleMapsUrl;
      const nextReviewScore =
        result.reviewScore ?? (refreshingCurrentListing ? reviewScore : null);
      const nextReviewCount =
        result.reviewCount ?? (refreshingCurrentListing ? reviewCount : null);
      setReviewScore(nextReviewScore);
      setReviewCount(nextReviewCount);
      if (nextReviewScore === null) setDisplayReviewScore(false);
      if (nextReviewCount === null) setDisplayReviewCount(false);
      setStatsRefreshed(
        result.reviewScore !== null || result.reviewCount !== null,
      );
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
      <div className="google-review-input-row">
        <label className="google-review-url-field">
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
      </div>
      <input type="hidden" name="googleReviewUrl" value={googleReviewUrl} />
      <input
        type="hidden"
        name="resolvedGoogleMapsUrl"
        value={resolvedGoogleMapsUrl}
      />
      <input type="hidden" name="googleReviewScore" value={reviewScore ?? ""} />
      <input type="hidden" name="googleReviewCount" value={reviewCount ?? ""} />
      <input
        type="hidden"
        name="googleReviewStatsRefreshed"
        value={statsRefreshed ? "true" : "false"}
      />
      <fieldset className="google-review-display-options">
        <legend>Review details under your business name</legend>
        <label>
          <input
            type="checkbox"
            name="displayGoogleReviewScore"
            checked={displayReviewScore}
            disabled={reviewScore === null}
            onChange={(event) =>
              setDisplayReviewScore(event.currentTarget.checked)
            }
          />
          Display review score
        </label>
        <label>
          <input
            type="checkbox"
            name="displayGoogleReviewCount"
            checked={displayReviewCount}
            disabled={reviewCount === null}
            onChange={(event) =>
              setDisplayReviewCount(event.currentTarget.checked)
            }
          />
          Display total number of reviews
        </label>
        {reviewScore === null && reviewCount === null ? (
          <small>
            Google review details are unavailable. Use Get review link to try
            again; the review link can still work without them.
          </small>
        ) : (
          <small>
            Latest Google details:{" "}
            {reviewScore === null
              ? "score unavailable"
              : `★ ${reviewScore.toFixed(1)}`}
            {" · "}
            {reviewCount === null
              ? "review count unavailable"
              : `${reviewCount.toLocaleString("en-GB")} reviews`}
          </small>
        )}
      </fieldset>
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
