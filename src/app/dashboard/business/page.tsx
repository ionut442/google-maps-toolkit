import Link from "next/link";
import { manageBillingAction } from "@/app/billing-actions";
import { PageHeader, SectionCard } from "@/components/dashboard-ui";
import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";
import {
  billingStatusLabel,
  hasBillingAccess,
} from "@/lib/billing-entitlement";
import { requireOwnedBusiness } from "@/lib/business";
import { db } from "@/lib/db";

export default async function BusinessDetailsPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const billing = await db.businessBilling.findUnique({
    where: { businessId: business.id },
  });
  const billingDate =
    billing?.status === "trialing"
      ? (billing.trialEndsAt ?? billing.nextBilledAt)
      : (billing?.nextBilledAt ?? billing?.currentPeriodEndsAt);
  return (
    <main className="dashboard-page narrow-dashboard-page">
      <PageHeader
        eyebrow="Business & billing"
        title="Business settings"
        intro="Keep your customer-facing details accurate and manage your LocalAction subscription."
      />
      <ProfileForm business={business} />
      <SectionCard className="billing-settings-card">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Paddle subscription</span>
            <h2>Billing</h2>
          </div>
          <span
            className={`billing-status billing-status-${billing?.status ?? "none"}`}
          >
            {billingStatusLabel(billing?.status)}
          </span>
        </div>
        <p>
          <strong>LocalAction monthly</strong>
          <br />
          €9.99/month + applicable taxes after the one-month free trial.
        </p>
        <p>Manage payment method, invoices, and cancellation in Paddle.</p>
        {billingDate && (
          <p className="billing-date">
            {billing?.status === "trialing"
              ? "Trial ends"
              : "Next billing date"}
            :{" "}
            <time dateTime={billingDate.toISOString()}>
              {billingDate.toLocaleDateString()}
            </time>
          </p>
        )}
        {billing?.status === "past_due" && (
          <p className="billing-warning">
            Your page remains available while Paddle retries payment. Open the
            portal to update your payment method.
          </p>
        )}
        {!hasBillingAccess(billing?.status) && billing && (
          <p className="billing-warning">
            This subscription does not currently allow publication. Your saved
            business configuration is unchanged.
          </p>
        )}
        <div className="billing-settings-actions">
          {billing ? (
            <form action={manageBillingAction}>
              <input type="hidden" name="businessId" value={business.id} />
              <button className="button" type="submit">
                Manage billing
              </button>
            </form>
          ) : (
            <Link className="button" href="/onboarding/publish">
              Start free trial
            </Link>
          )}
          <small>Paddle securely hosts your billing portal.</small>
        </div>
      </SectionCard>
    </main>
  );
}
