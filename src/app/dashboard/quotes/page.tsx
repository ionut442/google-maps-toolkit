import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { listAllOwnedQuoteRequests } from "@/lib/quotes";

export default async function QuoteHistoryPage() {
  const user = await requireUser();
  const quotes = await listAllOwnedQuoteRequests(user.id);
  return (
    <>
      <AppHeader email={user.email} />
      <main className="dashboard">
        <header>
          <span className="eyebrow">Quote history</span>
          <h1>Quote requests</h1>
          <p>
            Recent customer requests across your businesses. Email remains
            primary notification.
          </p>
        </header>
        <section className="panel">
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
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="empty">No quote requests yet.</p>
          )}
        </section>
      </main>
    </>
  );
}
