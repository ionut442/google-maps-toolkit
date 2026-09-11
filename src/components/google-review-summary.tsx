import type { PublicBusiness } from "@/lib/public-business";

export function GoogleReviewSummary({
  business,
}: {
  business: Pick<
    PublicBusiness,
    | "googleReviewScore"
    | "googleReviewCount"
    | "displayGoogleReviewScore"
    | "displayGoogleReviewCount"
  >;
}) {
  const score =
    business.displayGoogleReviewScore && business.googleReviewScore !== null
      ? `★ ${business.googleReviewScore.toFixed(1)}`
      : null;
  const count =
    business.displayGoogleReviewCount && business.googleReviewCount !== null
      ? `${business.googleReviewCount.toLocaleString("en-GB")} Google ${business.googleReviewCount === 1 ? "review" : "reviews"}`
      : null;
  if (!score && !count) return null;
  return (
    <p className="google-review-summary" aria-label="Google review summary">
      {score}
      {score && count && <span aria-hidden="true"> · </span>}
      {count}
    </p>
  );
}
