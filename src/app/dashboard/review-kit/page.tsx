import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { safeHttpUrl } from "@/lib/public-actions";
import { isDirectGoogleReviewUrl } from "@/lib/google-review-link";

export default async function ReviewKitPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const candidateReviewUrl = safeHttpUrl(business.googleReviewUrl);
  const reviewUrl = isDirectGoogleReviewUrl(candidateReviewUrl)
    ? candidateReviewUrl
    : null;
  const base = `/dashboard/businesses/${business.id}/assets`;
  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="Review Kit"
        title="Review Kit"
        intro="Finished graphics using your business colour and direct Google review link from Business Details."
        action={
          reviewUrl ? (
            <a
              className="button secondary"
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Test review link <ExternalLink size={16} />
            </a>
          ) : undefined
        }
      />
      {reviewUrl ? (
        <>
          <div className="review-kit-grid">
            {[
              {
                key: "printable-review-sign",
                title: "Printable review sign",
                copy: "2480 × 3508 · A4",
              },
              {
                key: "social-review-graphic",
                title: "Social review graphic",
                copy: "1200 × 1200 · Square",
              },
            ].map((asset) => (
              <article className="asset-card" key={asset.key}>
                <div className="asset-image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${base}/${asset.key}`}
                    alt={`${asset.title} for ${business.name}`}
                  />
                </div>
                <div>
                  <h2>{asset.title}</h2>
                  <p>{asset.copy}</p>
                  <a
                    className="button secondary"
                    href={`${base}/${asset.key}?download=1`}
                  >
                    Download PNG
                  </a>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="Connect your Google listing first"
          message="Connect your Google Maps share link in Business Details to generate these review graphics."
          action={
            <Link className="button" href="/dashboard/business">
              Add Google details
            </Link>
          }
        />
      )}
    </main>
  );
}
