export const paddleSubscriptionStatuses = [
  "trialing",
  "active",
  "past_due",
  "paused",
  "canceled",
] as const;

export type PaddleSubscriptionStatus =
  (typeof paddleSubscriptionStatuses)[number];

export function isPaddleSubscriptionStatus(
  value: string,
): value is PaddleSubscriptionStatus {
  return paddleSubscriptionStatuses.includes(value as PaddleSubscriptionStatus);
}

/**
 * LocalAction's single source of truth for billing access.
 * Paddle recommends retaining access while it retries a past-due payment.
 */
export function hasBillingAccess(status: string | null | undefined) {
  return status === "trialing" || status === "active" || status === "past_due";
}

export function billingStatusLabel(status: string | null | undefined) {
  switch (status) {
    case "trialing":
      return "Free trial";
    case "active":
      return "Active";
    case "past_due":
      return "Past due";
    case "paused":
      return "Paused";
    case "canceled":
      return "Canceled";
    default:
      return "Not started";
  }
}
