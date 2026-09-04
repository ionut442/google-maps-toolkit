import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { safeHttpUrl } from "@/lib/public-actions";

export default async function ReviewKitPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const reviewUrl = safeHttpUrl(business.googleReviewUrl);
  const base = `/dashboard/businesses/${business.id}/assets`;
  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="Review Kit"
        title="Turn happy customers into reviews"
        intro="Ready-made assets for counters, invoices, social posts, and printed signs."
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
        <div className="review-kit-grid">
          {[
            {
              key: "review-qr",
              title: "Review QR",
              copy: "A compact QR for receipts and counters.",
            },
            {
              key: "printable-review-sign",
              title: "Printable review sign",
              copy: "An A4 graphic ready for high-resolution printing.",
            },
            {
              key: "social-review-graphic",
              title: "Social review graphic",
              copy: "A square branded graphic for social channels.",
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
      ) : (
        <EmptyState
          title="Connect your Google listing first"
          message="Add a confirmed Google Maps or direct review link to unlock your fixed review assets."
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
