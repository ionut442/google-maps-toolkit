"use client";

import { initializePaddle } from "@paddle/paddle-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PaddleMode } from "@/lib/paddle-config";

type Props = {
  businessId: string;
  checkoutSignature: string;
  clientToken: string;
  email: string;
  environment: PaddleMode;
  priceId: string;
  disabled?: boolean;
  activationPending?: boolean;
};

export function PaddleCheckoutButton({
  businessId,
  checkoutSignature,
  clientToken,
  email,
  environment,
  priceId,
  disabled = false,
  activationPending = false,
}: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [activating, setActivating] = useState(activationPending);
  const [checkoutSubmitted, setCheckoutSubmitted] = useState(activationPending);
  const [message, setMessage] = useState<string | null>(null);
  const [billingName, setBillingName] = useState("");

  useEffect(() => {
    if (!activating) return;
    const interval = window.setInterval(() => router.refresh(), 1_500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
      setActivating(false);
      setMessage(
        "Activation is taking longer than expected. Refresh this page in a moment; your checkout has not been lost.",
      );
    }, 20_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [activating, router]);

  async function openCheckout() {
    const name = billingName.trim();
    if (!name) {
      setMessage("Add the name of the person buying the subscription.");
      return;
    }
    setOpening(true);
    setMessage(null);
    try {
      const paddle = await initializePaddle({
        token: clientToken,
        environment: environment === "sandbox" ? "sandbox" : "production",
        eventCallback(event) {
          if (event.name === "checkout.completed") {
            setOpening(false);
            setCheckoutSubmitted(true);
            setActivating(true);
            router.refresh();
          }
        },
      });
      if (!paddle) throw new Error("Paddle Checkout could not initialize");
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { businessId, checkoutSignature, billingName: name },
        settings: {
          displayMode: "overlay",
          theme: "light",
          showAddTaxId: true,
          successUrl: `${window.location.origin}/onboarding/publish?checkout=success`,
        },
      });
      setOpening(false);
    } catch (error) {
      setOpening(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Paddle Checkout could not be opened. Please try again.",
      );
    }
  }

  return (
    <div className="paddle-checkout-action" aria-live="polite">
      {!activating && !checkoutSubmitted && (
        <label className="checkout-billing-name">
          Billing name
          <input
            autoComplete="name"
            maxLength={1024}
            placeholder="Full name"
            value={billingName}
            onChange={(event) => setBillingName(event.currentTarget.value)}
          />
          <small>
            Company and VAT details can be added securely in checkout.
          </small>
        </label>
      )}
      {activating ? (
        <div className="billing-activating" role="status">
          <span className="billing-spinner" aria-hidden="true" />
          <span>
            <strong>Activating your subscription…</strong>
            <small>We’ll publish as soon as Paddle confirms the trial.</small>
          </span>
        </div>
      ) : checkoutSubmitted ? (
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setActivating(true);
            router.refresh();
          }}
        >
          Check activation status
        </button>
      ) : (
        <button
          className="button"
          type="button"
          disabled={disabled || opening}
          onClick={openCheckout}
        >
          {opening ? "Opening secure checkout…" : "Start free trial & publish"}
        </button>
      )}
      {message && <p className="billing-checkout-message">{message}</p>}
    </div>
  );
}
