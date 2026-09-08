"use client";

import {
  useActionState,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { extractReviewLinkAction, saveProfileAction } from "@/app/actions";
import { synchronizedWhatsapp } from "@/lib/profile-behavior";

type Profile = {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  logoUrl: string | null;
  brandColor: string;
  googleReviewUrl: string | null;
  googleBusinessName: string | null;
  googleMapsUrl: string | null;
};

const validHex = (value: string) => /^#[0-9A-F]{6}$/.test(value);
const sanitizePhoneInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 15);
  return value.trimStart().startsWith("+") ? `+${digits}` : digits;
};

export function ProfileForm({
  business,
  onboarding = false,
  publishMissing = [],
  returnToPublish = false,
}: {
  business: Profile;
  onboarding?: boolean;
  publishMissing?: Array<"description" | "phone">;
  returnToPublish?: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfileAction, {});
  const [phone, setPhone] = useState(business.phone);
  const [whatsapp, setWhatsapp] = useState(business.whatsapp || business.phone);
  const [whatsappSynced, setWhatsappSynced] = useState(
    !business.whatsapp || business.whatsapp === business.phone,
  );
  const [brandColor, setBrandColor] = useState(
    business.brandColor.toUpperCase(),
  );
  const initialGoogleMapsUrl =
    business.googleMapsUrl ?? business.googleReviewUrl ?? "";
  const initialGoogleReviewUrl = business.googleReviewUrl ?? "";
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initialGoogleMapsUrl);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(
    initialGoogleReviewUrl,
  );
  const [resolvedGoogleMapsUrl, setResolvedGoogleMapsUrl] = useState(
    initialGoogleReviewUrl ? initialGoogleMapsUrl : "",
  );
  const [reviewLinkError, setReviewLinkError] = useState("");
  const [reviewLinkPending, startReviewLinkTransition] = useTransition();
  const error = (name: string) => state.fields?.[name]?.[0];

  function updatePhone(value: string) {
    const normalized = sanitizePhoneInput(value);
    setPhone(normalized);
    setWhatsapp((current) =>
      synchronizedWhatsapp(normalized, current, whatsappSynced),
    );
  }

  function updateHex(value: string) {
    const normalized = value.trim().toUpperCase();
    setBrandColor(normalized.startsWith("#") ? normalized : `#${normalized}`);
  }

  function updateGoogleMapsUrl(value: string) {
    setGoogleMapsUrl(value);
    setReviewLinkError("");
    if (value === initialGoogleMapsUrl) {
      setGoogleReviewUrl(initialGoogleReviewUrl);
      setResolvedGoogleMapsUrl(
        initialGoogleReviewUrl ? initialGoogleMapsUrl : "",
      );
    } else if (value !== resolvedGoogleMapsUrl) {
      setGoogleReviewUrl("");
      setResolvedGoogleMapsUrl("");
    }
  }

  function resolveReviewLink() {
    setReviewLinkError("");
    startReviewLinkTransition(async () => {
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

  return (
    <form action={action} className="profile-form surface-card">
      {publishMissing.length > 0 && (
        <div className="form-attention" role="alert">
          <strong>Finish these business details before publishing:</strong>
          <span>
            {publishMissing
              .map((field) =>
                field === "description" ? "short description" : "phone number",
              )
              .join(", ")}
            .
          </span>
        </div>
      )}
      <fieldset className="form-section">
        <legend>Business details</legend>
        <div className="form-grid">
          <label>
            Business name
            <input
              name="name"
              defaultValue={business.name}
              required
              minLength={2}
            />
            {error("name") && <small className="error">{error("name")}</small>}
          </label>
          <label>
            Contact email
            <input
              name="email"
              type="email"
              defaultValue={business.email}
              required
            />
            {error("email") && (
              <small className="error">{error("email")}</small>
            )}
          </label>
          <label
            className={`wide ${publishMissing.includes("description") ? "missing-required" : ""}`.trim()}
          >
            Short description
            <textarea
              name="description"
              defaultValue={business.description}
              required
              minLength={10}
              maxLength={500}
              rows={3}
              placeholder="What you do and who you help"
              aria-invalid={
                publishMissing.includes("description") ||
                Boolean(error("description"))
              }
            />
            {error("description") && (
              <small className="error">{error("description")}</small>
            )}
          </label>
          <label
            className={`phone-field ${publishMissing.includes("phone") ? "missing-required" : ""}`.trim()}
          >
            Phone number
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => updatePhone(e.currentTarget.value)}
              required
              inputMode="tel"
              pattern="\+?[0-9]{7,15}"
              title="Use 7 to 15 numbers, with an optional + at the start"
              placeholder="+40700000000"
              aria-invalid={
                publishMissing.includes("phone") || Boolean(error("phone"))
              }
            />
            {error("phone") && (
              <small className="error">{error("phone")}</small>
            )}
          </label>
          <label className="whatsapp-field">
            WhatsApp number
            <span className="input-action">
              <input
                name="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(sanitizePhoneInput(e.currentTarget.value));
                  setWhatsappSynced(false);
                }}
                required
                inputMode="tel"
                pattern="\+?[0-9]{7,15}"
                title="Use 7 to 15 numbers, with an optional + at the start"
              />
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setWhatsapp(phone);
                  setWhatsappSynced(true);
                }}
              >
                Use business phone
              </button>
            </span>
            <small>
              {whatsappSynced
                ? "Keeps in sync with your business phone."
                : "Using your custom WhatsApp number."}
            </small>
            {error("whatsapp") && (
              <small className="error">{error("whatsapp")}</small>
            )}
          </label>
          <label>
            Website <span className="optional">Optional</span>
            <input
              name="website"
              type="url"
              pattern="https?://.+"
              title="Enter a complete address starting with http:// or https://"
              defaultValue={business.website ?? ""}
              placeholder="https://"
            />
            {error("website") && (
              <small className="error">{error("website")}</small>
            )}
          </label>
          <label className="logo-upload-field">
            Upload logo <span className="optional">Optional</span>
            <input
              name="logoFile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
            <small>JPG, PNG or WebP. Maximum 1 MB.</small>
            {error("logoFile") && (
              <small className="error">{error("logoFile")}</small>
            )}
          </label>
          <label>
            Or use a logo URL <span className="optional">Optional</span>
            <input
              name="logoUrl"
              type="url"
              pattern="https?://.+"
              title="Enter a complete address starting with http:// or https://"
              defaultValue={business.logoUrl ?? ""}
              placeholder="https://"
            />
            {error("logoUrl") && (
              <small className="error">{error("logoUrl")}</small>
            )}
          </label>
        </div>
      </fieldset>

      <details className="profile-disclosure" open={!onboarding}>
        <summary>
          <span>Page personalisation</span>
          <small>Colour and branding</small>
        </summary>
        <fieldset className="form-section">
          <legend>Action Page colour</legend>
          <p className="field-intro">
            Choose one accent for your public buttons and highlights.
          </p>
          <div className="color-row">
            <label className="color-swatch" title="Open colour picker">
              <span className="sr-only">Choose brand colour</span>
              <input
                type="color"
                value={validHex(brandColor) ? brandColor : "#2F6FED"}
                onChange={(e) =>
                  setBrandColor(e.currentTarget.value.toUpperCase())
                }
              />
            </label>
            <label>
              HEX
              <input
                name="brandColor"
                value={brandColor}
                onChange={(e) => updateHex(e.currentTarget.value)}
                maxLength={7}
                pattern="#[0-9A-Fa-f]{6}"
                aria-invalid={Boolean(error("brandColor"))}
              />
            </label>
            <div
              className="brand-preview"
              style={
                {
                  "--preview-brand": validHex(brandColor)
                    ? brandColor
                    : "#2F6FED",
                } as CSSProperties
              }
            >
              <span>Customer preview</span>
              <strong>Get a quote</strong>
            </div>
          </div>
          {error("brandColor") && (
            <small className="error">{error("brandColor")}</small>
          )}
        </fieldset>
      </details>

      <details className="profile-disclosure" open={!onboarding}>
        <summary>
          <span>Google Business Profile</span>
          <small>Optional connection</small>
        </summary>
        <fieldset className="form-section google-profile-setup">
          <legend>Google Business Profile</legend>
          <p className="field-intro">
            Open your business in Google Maps, choose Share → Copy link, then
            paste it here.
          </p>
          <label>
            Google Maps share link
            <input
              name="googleMapsUrl"
              type="url"
              value={googleMapsUrl}
              onChange={(e) => updateGoogleMapsUrl(e.currentTarget.value)}
              placeholder="https://maps.app.goo.gl/..."
            />
            {error("googleMapsUrl") && (
              <small className="error">{error("googleMapsUrl")}</small>
            )}
          </label>
          <button
            className="button secondary google-review-resolve"
            type="button"
            disabled={reviewLinkPending || !googleMapsUrl.trim()}
            onClick={resolveReviewLink}
          >
            {reviewLinkPending ? "Getting review link…" : "Get review link"}
          </button>
          <input type="hidden" name="googleReviewUrl" value={googleReviewUrl} />
          <input
            type="hidden"
            name="resolvedGoogleMapsUrl"
            value={resolvedGoogleMapsUrl}
          />
          <input
            type="hidden"
            name="googleBusinessName"
            value={business.googleBusinessName ?? business.name}
          />
          {googleReviewUrl && resolvedGoogleMapsUrl === googleMapsUrl && (
            <div className="google-review-ready" role="status">
              <strong>Review link ready</strong>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Test review link ↗
              </a>
            </div>
          )}
          {reviewLinkError && (
            <p className="error callout" role="alert">
              {reviewLinkError}
            </p>
          )}
        </fieldset>
      </details>

      {onboarding && <input type="hidden" name="intent" value="onboarding" />}
      {returnToPublish && (
        <input type="hidden" name="returnTo" value="publish" />
      )}
      {state.error && (
        <p className="error callout" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="success callout" role="status">
          {state.success}
        </p>
      )}
      <button className="form-submit" disabled={pending}>
        {pending
          ? "Saving…"
          : onboarding
            ? returnToPublish
              ? "Save and return to final check"
              : "Save and choose tools"
            : "Save profile"}
      </button>
    </form>
  );
}
