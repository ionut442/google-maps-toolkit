"use client";
import { useState } from "react";
import type { ServiceAreaConfig } from "@/lib/service-area";
import { postcodeIsServed } from "@/lib/service-area";
export function PostcodeChecker({
  config,
  ctaHref,
  ctaLabel,
}: {
  config: ServiceAreaConfig;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const served = postcodeIsServed(config, value);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setChecked(true);
      }}
      className="inline-form"
    >
      <label>
        Check an exact postcode
        <input
          value={value}
          onChange={(e) => {
            setValue(e.currentTarget.value);
            setChecked(false);
          }}
          maxLength={24}
        />
      </label>
      <button>Check</button>
      {checked && (
        <>
          <p role="status">
            {served
              ? "Yes — this postcode is listed in the service area."
              : "This postcode is not listed. Contact the business to confirm."}
          </p>
          {ctaHref && (
            <a className="action-link" href={ctaHref}>
              {ctaLabel ?? "Contact us"}
            </a>
          )}
        </>
      )}
    </form>
  );
}
