import Link from "next/link";
import { ArrowRight, ExternalLink, QrCode } from "lucide-react";
import { CopyLink } from "@/components/copy-link";
import {
  EmptyState,
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/dashboard-ui";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { getOwnedDashboardActivity } from "@/lib/analytics";
import { listOwnedQuoteRequests } from "@/lib/quotes";
import { publicBusinessUrl } from "@/lib/public-url";

export default async function DashboardPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const quoteRequests = await listOwnedQuoteRequests(user.id, business.id);
  const { summary, activity } = await getOwnedDashboardActivity(
    user.id,
    business.id,
  );
  const url = publicBusinessUrl(business.slug);
  const assetBase = `/dashboard/businesses/${business.id}/assets`;
  const enabledTools = business.modules.filter((tool) => tool.enabled).length;

  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="Home"
        title={`Good to see you, ${business.name}`}
        intro="Here’s how your customer page is doing."
        action={
          business.published ? (
            <Link
              className="button secondary"
              href={`/${business.slug}`}
              target="_blank"
            >
              View customer page <ExternalLink size={16} />
            </Link>
          ) : undefined
        }
      />

      <div className="home-grid">
        <SectionCard className="page-status-card">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Your customer page</span>
              <h2>Page status</h2>
            </div>
            <StatusBadge
              on={business.published}
              onLabel="Live"
              offLabel="Not live"
            />
          </div>
          <div className="url-box">
            <span>{url}</span>
            <CopyLink value={url} />
          </div>
          <div className="status-card-footer">
            <span>
              <strong>{enabledTools}</strong> customer tools enabled
            </span>
            <Link href="/dashboard/page">
              Manage page <ArrowRight size={16} />
            </Link>
          </div>
        </SectionCard>

        <SectionCard className="home-qr-card">
          <div className="qr-miniature">
            {business.published ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${assetBase}/business-page-qr`}
                alt={`QR code for ${business.name}`}
                width="112"
                height="112"
              />
            ) : (
              <QrCode size={48} strokeWidth={1.3} />
            )}
          </div>
          <div>
            <span className="section-kicker">Share your page</span>
            <h2>Business Page QR</h2>
            <p>Print or share a direct route to every customer action.</p>
          </div>
          {business.published && (
            <a
              className="button secondary"
              href={`${assetBase}/business-page-qr?download=1`}
            >
              Download QR
            </a>
          )}
        </SectionCard>
      </div>

      <section className="quick-actions" aria-labelledby="quick-actions-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Shortcuts</span>
            <h2 id="quick-actions-title">Quick actions</h2>
          </div>
        </div>
        <div className="quick-action-grid">
          {[
            ["Update business details", "/dashboard/business"],
            ["Choose customer tools", "/dashboard/tools"],
            ["See quote requests", "/dashboard/quotes"],
            ["Download review assets", "/dashboard/review-kit"],
          ].map(([label, href]) => (
            <Link href={href} key={href}>
              <span>{label}</span>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <SectionCard>
        <div className="section-heading">
          <div>
            <span className="section-kicker">Last 30 days</span>
            <h2>Customer activity</h2>
          </div>
        </div>
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
      </SectionCard>

      <div className="home-grid home-lists">
        <SectionCard>
          <div className="section-heading">
            <div>
              <span className="section-kicker">Latest</span>
              <h2>Recent activity</h2>
            </div>
          </div>
          {activity.length ? (
            <ol className="activity-list">
              {activity.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <time dateTime={item.createdAt.toISOString()}>
                    {item.createdAt.toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="No activity yet"
              message="Customer interactions will appear here once your page is shared."
            />
          )}
        </SectionCard>
        <SectionCard>
          <div className="section-heading">
            <div>
              <span className="section-kicker">Inbox</span>
              <h2>Quote requests</h2>
            </div>
            <Link href="/dashboard/quotes">View all</Link>
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
                    {quote.createdAt.toLocaleDateString()} ·{" "}
                    {quote.emailDelivery?.status.toLowerCase() ?? "pending"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No quote requests"
              message="New requests from your customer page will be listed here."
            />
          )}
        </SectionCard>
      </div>
    </main>
  );
}
