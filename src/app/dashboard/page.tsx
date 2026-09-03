import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { setPublishedAction } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { CopyLink } from "@/components/copy-link";
import { ToolList } from "@/components/tool-list";
import { PrimaryForm } from "@/components/primary-form";
import { ProfileForm } from "@/components/profile-form";
import { listOwnedQuoteRequests } from "@/lib/quotes";
import { listOwnedTrustEvidence } from "@/lib/trust-evidence";
import { getOwnedDashboardActivity } from "@/lib/analytics";
import { publicBusinessUrl } from "@/lib/public-url";
import { safeHttpUrl } from "@/lib/public-actions";

export default async function DashboardPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const quoteRequests = await listOwnedQuoteRequests(user.id, business.id);
  const trustEvidence = await listOwnedTrustEvidence(user.id, business.id);
  const { summary, activity } = await getOwnedDashboardActivity(
    user.id,
    business.id,
  );
  const url = publicBusinessUrl(business.slug);
  const reviewUrl = safeHttpUrl(business.googleReviewUrl);
  const assetBase = `/dashboard/businesses/${business.id}/assets`;
  return (
    <>
      <AppHeader email={user.email} />
      <main className="dashboard">
        <header>
          <span className="eyebrow">Dashboard</span>
          <h1>{business.name}</h1>
          <p>Configure useful customer actions. No page builder required.</p>
        </header>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Your Page</h2>
              <span
                className={`badge ${business.published ? "live" : "muted"}`}
              >
                {business.published ? "Published" : "Unpublished"}
              </span>
            </div>
          </div>
          <div className="url-row">
            <code>{url}</code>
            <CopyLink value={url} />
            {business.published && (
              <Link
                className="button secondary"
                href={`/${business.slug}`}
                target="_blank"
              >
                View page
              </Link>
            )}
          </div>
          <div className="publish-row">
            <form action={setPublishedAction}>
              <input type="hidden" name="businessId" value={business.id} />
              <input
                type="hidden"
                name="published"
                value={String(!business.published)}
              />
              <button>{business.published ? "Unpublish" : "Publish"}</button>
            </form>
            {business.published && (
              <div className="qr-card compact-qr-card">
                {/* Generated owner-only image; Next image optimization is unnecessary. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${assetBase}/business-page-qr`}
                  alt={`Business Page QR for ${business.name}`}
                  width="160"
                  height="160"
                />
                <div>
                  <strong>Business Page QR</strong>
                  <small>Opens the complete Action Page.</small>
                  <a
                    className="button secondary"
                    href={`${assetBase}/business-page-qr?download=1`}
                  >
                    Download Business Page QR
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="panel">
          <h2>Primary Action</h2>
          <PrimaryForm business={business} />
        </section>
        <section className="panel">
          <h2>Your Tools</h2>
          <p>Active tools appear in this order on your public Action Page.</p>
          <ToolList
            businessId={business.id}
            tools={business.modules}
            trustEvidence={trustEvidence}
          />
        </section>
        <section className="panel">
          <h2>Business Profile</h2>
          <ProfileForm business={business} />
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Review &amp; QR Kit</h2>
              <p>Ready-made fixed assets. No design editor.</p>
            </div>
            {reviewUrl && (
              <a
                className="button secondary"
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Test Review Link
              </a>
            )}
          </div>
          {reviewUrl ? (
            <div className="review-kit-grid">
              <article className="qr-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${assetBase}/review-qr`}
                  alt={`Review QR for ${business.name}`}
                  width="220"
                  height="220"
                />
                <h3>Review QR</h3>
                <p>Opens your confirmed Google destination.</p>
                <a
                  className="button secondary"
                  href={`${assetBase}/review-qr?download=1`}
                >
                  Download Review QR
                </a>
              </article>
              <article className="qr-card">
                <div className="asset-preview">A4</div>
                <h3>Printable Review Sign</h3>
                <p>High-resolution A4-proportioned PNG for printing.</p>
                <a
                  className="button secondary"
                  href={`${assetBase}/printable-review-sign?download=1`}
                >
                  Download Printable Review Sign
                </a>
              </article>
              <article className="qr-card">
                <div className="asset-preview square">1:1</div>
                <h3>Social Review Graphic</h3>
                <p>Fixed 1200 × 1200 branded PNG.</p>
                <a
                  className="button secondary"
                  href={`${assetBase}/social-review-graphic?download=1`}
                >
                  Download Social Review Graphic
                </a>
              </article>
            </div>
          ) : (
            <p className="empty">
              Add a valid HTTP(S) Google review URL in Business Profile to
              enable Review, Review QR, and Review Kit downloads.
            </p>
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Quote Requests</h2>
              <p>Recent customer requests and email-delivery status.</p>
            </div>
            <Link className="button secondary" href="/dashboard/quotes">
              View history
            </Link>
          </div>
          {quoteRequests.length ? (
            <div className="quote-history-list compact-history">
              {quoteRequests.slice(0, 5).map((quote) => (
                <Link
                  href={`/dashboard/quotes/${quote.id}`}
                  className="quote-history-row"
                  key={quote.id}
                >
                  <strong>{quote.customerName || "Customer request"}</strong>
                  <span>
                    {quote.createdAt.toLocaleString()} · Email{" "}
                    {quote.emailDelivery?.status.toLowerCase() ?? "pending"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No quote requests yet.</p>
          )}
        </section>
        <section className="panel">
          <h2>Last 30 Days</h2>
          <div className="metrics">
            {[
              ["Page views", summary.pageViews],
              ["Quote requests", summary.quoteRequests],
              ["Call clicks", summary.callClicks],
              ["WhatsApp clicks", summary.whatsappClicks],
              ["Review clicks", summary.reviewClicks],
            ].map(([label, value]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <h3>Recent Activity</h3>
          {activity.length ? (
            <ol className="activity-list">
              {activity.map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <time dateTime={item.createdAt.toISOString()}>
                    {item.createdAt.toLocaleString()}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty">No activity yet.</p>
          )}
        </section>
      </main>
    </>
  );
}
