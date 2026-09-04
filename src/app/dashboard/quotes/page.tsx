import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader, SectionCard } from "@/components/dashboard-ui";
import { requireUser } from "@/lib/auth";
import { listAllOwnedQuoteRequests } from "@/lib/quotes";

export default async function QuoteHistoryPage() {
  const user = await requireUser();
  const quotes = await listAllOwnedQuoteRequests(user.id);
  return (
    <main className="dashboard-page">
      <PageHeader
        eyebrow="Quote Requests"
        title="Customer requests"
        intro="Open each request to see the customer's answers, photos, and email-delivery status."
      />
      <SectionCard>
        {quotes.length ? (
          <div className="quote-history-list">
            {quotes.map((quote) => (
              <Link
                href={`/dashboard/quotes/${quote.id}`}
                className="quote-history-row"
                key={quote.id}
              >
                <div>
                  <strong>
                    {quote.customerName || "Customer name not supplied"}
                  </strong>
                  <span>
                    {quote.business.name} ·{" "}
                    {quote.customerPhone ||
                      quote.customerEmail ||
                      "Contact not supplied"}
                  </span>
                </div>
                <div>
                  <time dateTime={quote.createdAt.toISOString()}>
                    {quote.createdAt.toLocaleString()}
                  </time>
                  <span>
                    {quote._count.uploads} photo
                    {quote._count.uploads === 1 ? "" : "s"} · Email{" "}
                    {quote.emailDelivery?.status.toLowerCase() ?? "pending"}
                  </span>
                  <span className="quote-view-link">
                    View request <ChevronRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No quote requests yet"
            message="Requests submitted through your customer page will appear here."
          />
        )}
      </SectionCard>
    </main>
  );
}
