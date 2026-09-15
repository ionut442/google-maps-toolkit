"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { db } from "@/lib/db";
import { createPaddleClient } from "@/lib/paddle-config";

async function requireOwnedBilling(formData: FormData) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(
    user.id,
    String(formData.get("businessId")) || undefined,
  );
  const billing = await db.businessBilling.findUnique({
    where: { businessId: business.id },
  });
  if (!billing)
    throw new Error("No Paddle subscription exists for this business");
  return { billing, business, user };
}

export async function updateBillingAccountAction(formData: FormData) {
  const { billing } = await requireOwnedBilling(formData);
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 1024)
    throw new Error("Enter a valid billing name");

  await db.businessBilling.update({
    where: { businessId: billing.businessId },
    data: { billingName: name },
  });
  try {
    await createPaddleClient().customers.update(billing.paddleCustomerId, {
      name,
    });
  } catch {
    // The local billing contact remains authoritative when the API key has no
    // customer.write permission. Payment and tax data still stay in Paddle.
  }
  revalidatePath("/dashboard/billing");
}

export async function updatePaymentMethodAction(formData: FormData) {
  const { billing } = await requireOwnedBilling(formData);
  const session = await createPaddleClient().customerPortalSessions.create(
    billing.paddleCustomerId,
    [billing.paddleSubscriptionId],
  );
  const subscription = session.urls.subscriptions.find(
    (item) => item.id === billing.paddleSubscriptionId,
  );
  if (!subscription)
    throw new Error("Paddle could not create a payment-method link");
  redirect(subscription.updateSubscriptionPaymentMethod);
}

export async function downloadInvoiceAction(formData: FormData) {
  const { billing } = await requireOwnedBilling(formData);
  const index = Number(formData.get("paymentIndex"));
  if (!Number.isInteger(index) || index < 0 || index > 29)
    throw new Error("Invalid payment reference");

  const paddle = createPaddleClient();
  const transactions = await paddle.transactions
    .list({
      subscriptionId: [billing.paddleSubscriptionId],
      orderBy: "billed_at[DESC]",
      perPage: 30,
    })
    .next();
  const transaction = transactions[index];
  if (
    !transaction ||
    transaction.subscriptionId !== billing.paddleSubscriptionId ||
    transaction.status !== "completed" ||
    !transaction.details?.totals ||
    transaction.details?.totals?.grandTotal === "0"
  ) {
    throw new Error("No invoice is available for this payment");
  }
  const invoice = await paddle.transactions.getInvoicePDF(transaction.id);
  redirect(invoice.url);
}

export async function cancelSubscriptionAction(formData: FormData) {
  const { billing } = await requireOwnedBilling(formData);
  if (String(formData.get("confirm")) !== "yes")
    throw new Error("Confirm cancellation before continuing");

  await createPaddleClient().subscriptions.cancel(
    billing.paddleSubscriptionId,
    { effectiveFrom: "next_billing_period" },
  );
  revalidatePath("/dashboard/billing");
  redirect("/dashboard/billing?cancellation=scheduled");
}
