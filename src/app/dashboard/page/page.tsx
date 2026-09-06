import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { setPublishedAction } from "@/app/actions";
import { CopyLink } from "@/components/copy-link";
import { CustomerPreview } from "@/components/customer-preview";
import {
  PageHeader,
  SectionCard,
  StatusBadge,
} from "@/components/dashboard-ui";
import { PageOrderList } from "@/components/page-order-list";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { publicBusinessUrl } from "@/lib/public-url";

export default async function MyPagePage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const url = publicBusinessUrl(business.slug);
  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="My Page"
        title="Your customer page"
        intro="Arrange the customer tools in the order that works for your business."
        action={
          <Link
            className="button secondary"
            href={
              business.published
                ? `/${business.slug}`
                : `/preview/${business.slug}`
            }
            target="_blank"
          >
            {business.published ? "Open live page" : "Open draft preview"}{" "}
            <ExternalLink size={16} />
          </Link>
        }
      />
      <div className="page-builder-layout">
        <div className="page-builder-settings">
          <SectionCard>
            <div className="section-heading">
              <div>
                <span className="section-kicker">Visibility</span>
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
            <form action={setPublishedAction} className="publish-control">
              <input type="hidden" name="businessId" value={business.id} />
              <input
                type="hidden"
                name="published"
                value={String(!business.published)}
              />
              <button className={business.published ? "secondary" : undefined}>
                {business.published ? "Take page offline" : "Publish page"}
              </button>
            </form>
          </SectionCard>
          <SectionCard>
            <span className="section-kicker">Layout</span>
            <h2>Page order</h2>
            <p>
              Move enabled tools into the order that makes sense for your
              customers.
            </p>
            <PageOrderList businessId={business.id} tools={business.modules} />
          </SectionCard>
        </div>
        <aside className="sticky-preview">
          <span className="section-kicker">Customer preview</span>
          <CustomerPreview business={business} />
        </aside>
      </div>
    </main>
  );
}
