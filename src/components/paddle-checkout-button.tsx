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
  successPath?: string;
  completionPath?: string;
  buttonLabel?: string;
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
  successPath = "/onboarding/publish?checkout=success",
  completionPath,
  buttonLabel = "Start free trial & publish",
}: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const [activating, setActivating] = useState(activationPending);
  const [checkoutSubmitted, setCheckoutSubmitted] = useState(activationPending);
  const [message, setMessage] = useState<string | null>(null);

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
            if (completionPath) {
              router.push(completionPath);
            } else {
              router.refresh();
            }
          }
        },
      });
      if (!paddle) throw new Error("Paddle Checkout could not initialize");
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { businessId, checkoutSignature },
        settings: {
          displayMode: "overlay",
          theme: "light",
          showAddTaxId: true,
          successUrl: `${window.location.origin}${successPath}`,
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
      {activating ? (
        <div className="billing-activating" role="status">
          <span className="billing-spinner" aria-hidden="true" />
          <span>
            <strong>Activating your subscription…</strong>
            <small>
              {completionPath
                ? "We’ll return you to My Page as soon as Paddle confirms the trial."
                : "We’ll make publishing available as soon as Paddle confirms the trial."}
            </small>
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
          {opening ? "Opening secure checkout…" : buttonLabel}
        </button>
      )}
      {message && <p className="billing-checkout-message">{message}</p>}
    </div>
  );
}
