import {
  cancelSubscriptionAction,
  downloadInvoiceAction,
  updateBillingAccountAction,
  updatePaymentMethodAction,
} from "@/app/billing-actions";
import { PageHeader, SectionCard } from "@/components/dashboard-ui";
import { PaddleCheckoutButton } from "@/components/paddle-checkout-button";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import {
  billingStatusLabel,
  hasBillingAccess,
} from "@/lib/billing-entitlement";
import { requireOwnedBusiness } from "@/lib/business";
import { db } from "@/lib/db";
import {
  createCheckoutSignature,
  paddlePublicConfig,
} from "@/lib/paddle-config";
import {
  formatPaddleMoney,
  formatTaxRate,
  loadPaddleBillingOverview,
} from "@/lib/paddle-billing-overview";

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function paymentStatus(status: string) {
  if (status === "completed") return "Paid";
  if (status === "past_due") return "Past due";
  return status.charAt(0).toUpperCase() + status.slice(1).replaceAll("_", " ");
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancellation?: string }>;
}) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const billing = await db.businessBilling.findUnique({
    where: { businessId: business.id },
  });
  const checkoutConfig = paddlePublicConfig();
  const checkoutSignature = checkoutConfig
    ? createCheckoutSignature(business.id)
    : null;
  const overview = billing ? await loadPaddleBillingOverview(billing) : null;
  const cancellationScheduled =
    (await searchParams).cancellation === "scheduled" ||
    Boolean(overview?.cancellationEffectiveAt);
  const currency = overview?.currencyCode ?? "EUR";
  const fallbackDate =
    billing?.status === "trialing"
      ? (billing.trialEndsAt ?? billing.nextBilledAt)
      : (billing?.nextBilledAt ?? billing?.currentPeriodEndsAt);

  return (
    <main className="dashboard-page billing-page">
      <PageHeader
        eyebrow="Account"
        title="Billing"
        intro="See what you pay, who is billed, and manage your LocalAction subscription."
      />

      {!billing ? (
        <SectionCard className="billing-empty-card">
          <span className="section-kicker">LocalAction monthly</span>
          <h2>No subscription yet</h2>
          <p>Start your free trial when you are ready to publish.</p>
          {checkoutConfig && checkoutSignature ? (
            <PaddleCheckoutButton
              businessId={business.id}
              checkoutSignature={checkoutSignature}
              clientToken={checkoutConfig.clientToken}
              email={user.email}
              environment={checkoutConfig.environment}
              priceId={checkoutConfig.priceId}
              successPath="/dashboard/page?checkout=success"
              completionPath="/dashboard/page?checkout=success"
              buttonLabel="Start free trial"
            />
          ) : (
            <button className="button" type="button" disabled>
              Billing setup unavailable
            </button>
          )}
        </SectionCard>
      ) : (
        <>
          {cancellationScheduled && (
            <p className="billing-notice" role="status">
              Cancellation is scheduled
              {overview?.cancellationEffectiveAt
                ? ` for ${formatDate(overview.cancellationEffectiveAt)}`
                : " for the end of the current billing period"}
              .
            </p>
          )}
          {!overview && (
            <p className="billing-warning" role="status">
              Live billing details are temporarily unavailable. Your locally
              confirmed subscription status is still shown below.
            </p>
          )}

          <section className="billing-overview-grid">
            <SectionCard className="billing-plan-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Subscription</span>
                  <h2>LocalAction monthly</h2>
                </div>
                <span
                  className={`billing-status billing-status-${billing.status}`}
                >
                  {billingStatusLabel(billing.status)}
                </span>
              </div>
              <p className="billing-plan-price">
                €9.99 <small>/ month before tax</small>
              </p>
              <dl className="billing-facts">
                <div>
                  <dt>
                    {billing.status === "trialing"
                      ? "Trial ends"
                      : "Next renewal"}
                  </dt>
                  <dd>
                    {formatDate(
                      overview?.nextPayment?.billedAt ?? fallbackDate,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Billing status</dt>
                  <dd>{billingStatusLabel(billing.status)}</dd>
                </div>
              </dl>
              {!hasBillingAccess(billing.status) && (
                <p className="billing-warning">
                  This subscription does not currently allow publication. Your
                  saved business configuration is unchanged.
                </p>
              )}
              {overview?.updatePaymentMethodAvailable && (
                <form action={updatePaymentMethodAction}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <SubmitButton className="secondary">
                    Update payment method
                  </SubmitButton>
                </form>
              )}
              <small>
                Card details are handled securely by Paddle; only that step
                opens Paddle&apos;s protected payment screen.
              </small>
            </SectionCard>

            <SectionCard className="billing-next-card">
              <span className="section-kicker">Next payment summary</span>
              <h2>
                {overview?.nextPayment
                  ? `${formatPaddleMoney(overview.nextPayment.totalMinor, currency)} due ${formatDate(overview.nextPayment.billedAt)}`
                  : "No upcoming payment available"}
              </h2>
              {overview?.nextPayment && (
                <>
                  <div className="billing-line-items">
                    {overview.nextPayment.lineItems.map((item, index) => (
                      <div key={`${item.name}-${index}`}>
                        <span>
                          {item.name} <small>× {item.quantity}</small>
                        </span>
                        <strong>
                          {formatPaddleMoney(item.subtotalMinor, currency)}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <dl className="billing-totals">
                    <div>
                      <dt>Plan price</dt>
                      <dd>
                        {formatPaddleMoney(
                          overview.nextPayment.subtotalMinor,
                          currency,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        Tax
                        {formatTaxRate(overview.nextPayment.taxRate)
                          ? ` (${formatTaxRate(overview.nextPayment.taxRate)})`
                          : ""}
                      </dt>
                      <dd>
                        +{" "}
                        {formatPaddleMoney(
                          overview.nextPayment.taxMinor,
                          currency,
                        )}
                      </dd>
                    </div>
                    <div className="billing-total-row">
                      <dt>Total</dt>
                      <dd>
                        {formatPaddleMoney(
                          overview.nextPayment.totalMinor,
                          currency,
                        )}
                      </dd>
                    </div>
                  </dl>
                  <p className="billing-tax-note">
                    Tax is calculated by Paddle from the purchaser&apos;s
                    billing country. For this payment, the plan price and tax
                    are shown separately above.
                  </p>
                </>
              )}
            </SectionCard>
          </section>

          <section className="billing-detail-grid">
            <SectionCard className="billing-payments-card">
              <span className="section-kicker">Payments</span>
              <h2>Payment history</h2>
              {overview && !overview.paymentsAvailable ? (
                <p className="billing-warning">
                  Payment history is temporarily unavailable.
                </p>
              ) : overview?.payments.length ? (
                <ol className="billing-payment-list">
                  {overview.payments.map((payment, index) => (
                    <li key={`${payment.date}-${index}`}>
                      <span>
                        <strong>
                          {formatPaddleMoney(payment.totalMinor, currency)}
                        </strong>
                        <small>{formatDate(payment.date)}</small>
                      </span>
                      <span
                        className={`payment-status payment-status-${payment.status}`}
                      >
                        {paymentStatus(payment.status)}
                      </span>
                      {payment.invoiceAvailable && (
                        <form action={downloadInvoiceAction}>
                          <input
                            type="hidden"
                            name="businessId"
                            value={business.id}
                          />
                          <input
                            type="hidden"
                            name="paymentIndex"
                            value={index}
                          />
                          <button className="text-button" type="submit">
                            Download invoice
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No completed or attempted payments to show yet.</p>
              )}
            </SectionCard>

            <SectionCard className="billing-account-card">
              <span className="section-kicker">Account</span>
              <h2>Billing details</h2>
              <form
                action={updateBillingAccountAction}
                className="billing-account-form"
              >
                <input type="hidden" name="businessId" value={business.id} />
                <label>
                  Billing name
                  <input
                    name="name"
                    defaultValue={
                      overview?.customer?.name ?? billing.billingName ?? ""
                    }
                    maxLength={1024}
                    autoComplete="name"
                    required
                  />
                </label>
                <label>
                  Billing email
                  <input
                    value={overview?.customer?.email ?? user.email}
                    readOnly
                    aria-describedby="billing-email-note"
                  />
                </label>
                <small id="billing-email-note">
                  This is the email used to sign in to LocalAction.
                </small>
                <SubmitButton className="secondary">
                  Save billing name
                </SubmitButton>
              </form>

              <dl className="billing-account-details">
                <div>
                  <dt>Purchase type</dt>
                  <dd>
                    {overview?.purchaserBusiness
                      ? "Business purchase"
                      : "Individual purchase"}
                  </dd>
                </div>
                {overview?.purchaserBusiness && (
                  <>
                    <div>
                      <dt>Company</dt>
                      <dd>{overview.purchaserBusiness.name}</dd>
                    </div>
                    {overview.purchaserBusiness.taxIdentifier && (
                      <div>
                        <dt>VAT / tax number</dt>
                        <dd>{overview.purchaserBusiness.taxIdentifier}</dd>
                      </div>
                    )}
                  </>
                )}
                {overview?.address && (
                  <div>
                    <dt>Billing country</dt>
                    <dd>{overview.address.countryCode}</dd>
                  </div>
                )}
              </dl>
              <p className="billing-account-note">
                Company, VAT, and required address details are collected by
                Paddle during checkout and used on compliant receipts and
                invoices. They are separate from your customer-facing Business
                details.
              </p>
              {overview && !overview.purchaserDetailsAvailable && (
                <p className="billing-warning">
                  Paddle purchaser details are temporarily unavailable. Your
                  LocalAction billing name and account email are still shown.
                </p>
              )}
            </SectionCard>
          </section>

          {billing.status !== "canceled" && !cancellationScheduled && (
            <details className="billing-cancel-panel">
              <summary>Cancel subscription</summary>
              <div>
                <p>
                  Cancellation takes effect at the end of the current billing
                  period. You keep access until then.
                </p>
                <form action={cancelSubscriptionAction}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <label className="billing-cancel-confirmation">
                    <input
                      type="checkbox"
                      name="confirm"
                      value="yes"
                      required
                    />
                    I understand the subscription will not renew.
                  </label>
                  <SubmitButton className="danger">
                    Confirm cancellation
                  </SubmitButton>
                </form>
              </div>
            </details>
          )}
        </>
      )}
    </main>
  );
}
