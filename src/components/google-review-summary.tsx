import type { PublicBusiness } from "@/lib/public-business";

export function GoogleReviewSummary({
  business,
  href,
}: {
  business: Pick<
    PublicBusiness,
    | "googleReviewScore"
    | "googleReviewCount"
    | "displayGoogleReviewScore"
    | "displayGoogleReviewCount"
  >;
  href?: string;
}) {
  const score =
    business.displayGoogleReviewScore && business.googleReviewScore !== null
      ? business.googleReviewScore.toFixed(1)
      : null;
  const count =
    business.displayGoogleReviewCount && business.googleReviewCount !== null
      ? `${business.googleReviewCount.toLocaleString("en-GB")} Google ${business.googleReviewCount === 1 ? "review" : "reviews"}`
      : null;
  if (!score && !count) return null;
  const label = [score ? `${score} out of 5` : null, count]
    .filter(Boolean)
    .join(", ");
  const content = (
    <>
      {score && (
        <>
          <strong>{score}</strong>
          <span className="google-review-stars" aria-hidden="true">
            ★★★★★
          </span>
        </>
      )}
      {count && (
        <span className="google-review-count">
          {score ? `(${count})` : count}
        </span>
      )}
    </>
  );
  return href ? (
    <a className="google-review-summary" href={href} aria-label={label}>
      {content}
    </a>
  ) : (
    <p className="google-review-summary" aria-label={label}>
      {content}
    </p>
  );
}
