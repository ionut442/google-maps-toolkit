import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { retryQuoteEmailAction } from "@/app/actions";
import { PageHeader, SectionCard } from "@/components/dashboard-ui";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { findOwnedQuoteRequest } from "@/lib/quotes";

function answerText(value: string | number | boolean | string[]) {
  if (Array.isArray(value)) return value.join(", ");
  return value === true ? "Yes" : String(value);
}

function deliveryLabel(status: string | undefined) {
  if (status === "DELIVERED") return "Delivered";
  if (status === "FAILED") return "Needs attention";
  if (status === "PROCESSING") return "Sending";
  return "Pending";
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
    <main className="dashboard-page narrow-dashboard-page">
      <Link className="back-link" href="/dashboard/quotes">
        <ArrowLeft size={17} aria-hidden="true" /> Quote requests
      </Link>
      <PageHeader
        eyebrow="Quote Request"
        title={quote.customerName || "Customer request"}
        intro={`${quote.createdAt.toLocaleString()} · ${quote.business.name}`}
      />
      <SectionCard className="quote-contact-summary">
        <h2>Customer</h2>
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
      </SectionCard>
      <SectionCard>
        <h2>Request details</h2>
        <dl className="quote-answer-list">
          {quote.answers.map((answer) => (
            <div key={answer.fieldId}>
              <dt>{answer.label}</dt>
              <dd>{answerText(answer.value)}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>
      <SectionCard>
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
      </SectionCard>
      <SectionCard>
        <h2>Delivery</h2>
        <p>
          Email status:{" "}
          <strong>{deliveryLabel(quote.emailDelivery?.status)}</strong>
          {quote.emailDelivery
            ? ` · ${quote.emailDelivery.attemptCount} ${quote.emailDelivery.attemptCount === 1 ? "attempt" : "attempts"}`
            : ""}
        </p>
        {quote.emailDelivery?.lastError && (
          <p className="callout">{quote.emailDelivery.lastError}</p>
        )}
        {quote.emailDelivery && quote.emailDelivery.status !== "DELIVERED" && (
          <form action={retryQuoteEmailAction}>
            <input type="hidden" name="quoteId" value={quote.id} />
            <SubmitButton pendingLabel="Retrying…">
              Retry email now
            </SubmitButton>
          </form>
        )}
      </SectionCard>
    </main>
  );
}
