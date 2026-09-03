"use client";
import { useState } from "react";
import type { PricingConfig } from "@/lib/pricing";
import { calculateEstimate, formatMoney } from "@/lib/pricing";

export function PricingEstimator({
  config,
  ctaHref,
  ctaLabel,
}: {
  config: Extract<PricingConfig, { mode: "SIMPLE_ESTIMATE" }>;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(config.quantity?.min);
  const result = calculateEstimate(config, { addOnIds, quantity });
  const query = new URLSearchParams();
  addOnIds.forEach((id) => query.append("estimateAddOn", id));
  if (quantity !== undefined) query.set("estimateQuantity", String(quantity));
  return (
    <div className="pricing-estimator">
      <p>
        <strong>{config.base.label}</strong>{" "}
        {formatMoney(config.base.amountMinor, config.currency)}
      </p>
      {config.addOns.map((item) => (
        <label className="quote-option" key={item.id}>
          <input
            type="checkbox"
            checked={addOnIds.includes(item.id)}
            onChange={(e) =>
              setAddOnIds(
                e.currentTarget.checked
                  ? [...addOnIds, item.id]
                  : addOnIds.filter((id) => id !== item.id),
              )
            }
          />
          <span>
            {item.label} (+{formatMoney(item.amountMinor, config.currency)})
          </span>
        </label>
      ))}
      {config.quantity && (
        <label>
          {config.quantity.label}
          <input
            type="number"
            min={config.quantity.min}
            max={config.quantity.max}
            step={config.quantity.step}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.currentTarget.value))}
          />
          <small>
            {formatMoney(config.quantity.unitAmountMinor, config.currency)} per{" "}
            {config.quantity.unitLabel}
          </small>
        </label>
      )}
      <p className="estimate-total" role="status" aria-live="polite">
        <strong>
          Estimated total: {formatMoney(result.totalMinor, config.currency)}
        </strong>
      </p>
      <small>Estimate only. The business confirms the final quote.</small>
      {ctaHref && (
        <a
          className="action-link"
          href={ctaHref === "#quote" ? `?${query.toString()}#quote` : ctaHref}
        >
          {ctaLabel ?? "Continue"}
        </a>
      )}
    </div>
  );
}
