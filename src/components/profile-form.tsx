"use client";

import { useActionState, useMemo, useState, type CSSProperties } from "react";
import { saveProfileAction } from "@/app/actions";
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

export function ProfileForm({
  business,
  onboarding = false,
}: {
  business: Profile;
  onboarding?: boolean;
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
  const [googleBusinessName, setGoogleBusinessName] = useState(
    business.googleBusinessName ?? business.name,
  );
  const error = (name: string) => state.fields?.[name]?.[0];
  const searchUrl = useMemo(
    () =>
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleBusinessName)}`,
    [googleBusinessName],
  );

  function updatePhone(value: string) {
    setPhone(value);
    setWhatsapp((current) =>
      synchronizedWhatsapp(value, current, whatsappSynced),
    );
  }

  function updateHex(value: string) {
    const normalized = value.trim().toUpperCase();
    setBrandColor(normalized.startsWith("#") ? normalized : `#${normalized}`);
  }

  return (
    <form action={action} className="profile-form surface-card">
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
          <label className="wide">
            Short description
            <textarea
              name="description"
              defaultValue={business.description}
              required
              minLength={10}
              maxLength={500}
              rows={3}
              placeholder="What you do and who you help"
            />
            {error("description") && (
              <small className="error">{error("description")}</small>
            )}
          </label>
          <label className="phone-field">
            Phone number
            <input
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => updatePhone(e.currentTarget.value)}
              required
              placeholder="+40 700 000 000"
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
                  setWhatsapp(e.currentTarget.value);
                  setWhatsappSynced(false);
                }}
                required
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
            Find your business, confirm the correct listing, then paste its
            Google Maps or review link.
          </p>
          <label>
            Business name
            <input
              name="googleBusinessName"
              value={googleBusinessName}
              onChange={(e) => setGoogleBusinessName(e.currentTarget.value)}
              placeholder="Your business name and town"
            />
          </label>
          <a
            className="button secondary"
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Find on Google Maps{" "}
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <label>
            Google Maps or review link
            <input
              name="googleMapsUrl"
              type="url"
              defaultValue={
                business.googleMapsUrl ?? business.googleReviewUrl ?? ""
              }
              placeholder="Paste the confirmed link"
            />
            {error("googleMapsUrl") && (
              <small className="error">{error("googleMapsUrl")}</small>
            )}
          </label>
          <input type="hidden" name="googleReviewUrl" value="" />
          <small>
            We never guess which business is yours. A Maps link opens the
            confirmed listing; a direct review link opens the review form.
          </small>
        </fieldset>
      </details>

      {onboarding && <input type="hidden" name="intent" value="onboarding" />}
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
            ? "Save and choose tools"
            : "Save profile"}
      </button>
    </form>
  );
}
