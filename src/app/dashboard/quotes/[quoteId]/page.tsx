import Link from "next/link";
import { notFound } from "next/navigation";
import { retryQuoteEmailAction } from "@/app/actions";
import { AppHeader } from "@/components/app-header";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { findOwnedQuoteRequest } from "@/lib/quotes";

function answerText(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) return value.join(", ");
  return value === true ? "Yes" : String(value);
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  const user = await requireUser();
  const { quoteId } = await params;
  const quote = await findOwnedQuoteRequest(user.id, quoteId);
  if (!quote) notFound();
  return (
    <>
      <AppHeader email={user.email} />
      <main className="dashboard">
        <Link href="/dashboard/quotes">← Quote history</Link>
        <header>
          <span className="eyebrow">Quote request</span>
          <h1>{quote.customerName || "Customer request"}</h1>
          <p>
            <time dateTime={quote.createdAt.toISOString()}>
              {quote.createdAt.toLocaleString()}
            </time>{" "}
            · {quote.business.name}
          </p>
        </header>
        <section className="panel quote-contact-summary">
          <h2>Contact</h2>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{quote.customerName || "Not supplied"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{quote.customerPhone || "Not supplied"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{quote.customerEmail || "Not supplied"}</dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2>Answers</h2>
          <dl className="quote-answer-list">
            {quote.answers.map((answer) => (
              <div key={answer.fieldId}>
                <dt>{answer.label}</dt>
                <dd>{answerText(answer.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel">
          <h2>Photos</h2>
          {quote.uploads.length ? (
            <div className="quote-photo-grid">
              {quote.uploads.map((upload) => (
                <a
                  href={`/dashboard/quotes/${quote.id}/uploads/${upload.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  key={upload.id}
                >
                  {upload.originalFilename}
                  <small>
                    {Math.ceil(upload.sizeBytes / 1024)} KB · secure view
                  </small>
                </a>
              ))}
            </div>
          ) : (
            <p>No photos supplied.</p>
          )}
        </section>
        <section className="panel">
          <h2>Email delivery</h2>
          <p>
            Status: <strong>{quote.emailDelivery?.status ?? "PENDING"}</strong>
            {quote.emailDelivery
              ? ` · ${quote.emailDelivery.attemptCount} attempt(s)`
              : ""}
          </p>
          {quote.emailDelivery?.lastError && (
            <p className="callout">{quote.emailDelivery.lastError}</p>
          )}
          {quote.emailDelivery &&
            quote.emailDelivery.status !== "DELIVERED" && (
              <form action={retryQuoteEmailAction}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <SubmitButton pendingLabel="Retrying…">
                  Retry email now
                </SubmitButton>
              </form>
            )}
        </section>
      </main>
    </>
  );
}
