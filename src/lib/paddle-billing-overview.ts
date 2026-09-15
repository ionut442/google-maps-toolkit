import type { BusinessBilling } from "@prisma/client";
import { createPaddleClient } from "@/lib/paddle-config";

export type BillingPayment = {
  date: string;
  totalMinor: string;
  status: string;
  invoiceAvailable: boolean;
};

export type BillingOverview = {
  currencyCode: string;
  customer: { name: string | null; email: string } | null;
  address: {
    firstLine: string | null;
    secondLine: string | null;
    city: string | null;
    postalCode: string | null;
    region: string | null;
    countryCode: string;
  } | null;
  purchaserBusiness: {
    name: string;
    companyNumber: string | null;
    taxIdentifier: string | null;
  } | null;
  nextPayment: {
    billedAt: string;
    subtotalMinor: string;
    taxMinor: string;
    totalMinor: string;
    taxRate: string | null;
    lineItems: Array<{
      name: string;
      quantity: number;
      subtotalMinor: string;
    }>;
  } | null;
  payments: BillingPayment[];
  paymentsAvailable: boolean;
  purchaserDetailsAvailable: boolean;
  cancellationEffectiveAt: string | null;
  updatePaymentMethodAvailable: boolean;
};

export async function loadPaddleBillingOverview(
  billing: BusinessBilling,
): Promise<BillingOverview | null> {
  try {
    const paddle = createPaddleClient();
    const subscription = await paddle.subscriptions.get(
      billing.paddleSubscriptionId,
      { include: ["next_transaction"] },
    );
    const transactionsPromise = paddle.transactions
      .list({
        subscriptionId: [billing.paddleSubscriptionId],
        orderBy: "billed_at[DESC]",
        perPage: 30,
      })
      .next();
    const [customerResult, addressResult, businessResult, transactionsResult] =
      await Promise.allSettled([
        paddle.customers.get(billing.paddleCustomerId),
        paddle.addresses.get(billing.paddleCustomerId, subscription.addressId),
        subscription.businessId
          ? paddle.businesses.get(
              billing.paddleCustomerId,
              subscription.businessId,
            )
          : Promise.resolve(null),
        transactionsPromise,
      ]);

    const next = subscription.nextTransaction;
    const totals = next?.details.totals;
    const transactions =
      transactionsResult.status === "fulfilled" ? transactionsResult.value : [];

    return {
      currencyCode: subscription.currencyCode,
      customer:
        customerResult.status === "fulfilled"
          ? {
              name: customerResult.value.name ?? null,
              email: customerResult.value.email,
            }
          : null,
      address:
        addressResult.status === "fulfilled"
          ? {
              firstLine: addressResult.value.firstLine,
              secondLine: addressResult.value.secondLine,
              city: addressResult.value.city,
              postalCode: addressResult.value.postalCode,
              region: addressResult.value.region,
              countryCode: addressResult.value.countryCode,
            }
          : null,
      purchaserBusiness:
        businessResult.status === "fulfilled" && businessResult.value
          ? {
              name: businessResult.value.name,
              companyNumber: businessResult.value.companyNumber,
              taxIdentifier: businessResult.value.taxIdentifier,
            }
          : null,
      nextPayment:
        next && totals
          ? {
              billedAt:
                subscription.nextBilledAt ?? next.billingPeriod.startsAt,
              subtotalMinor: totals.subtotal,
              taxMinor: totals.tax,
              totalMinor: totals.grandTotal,
              taxRate: next.details.lineItems[0]?.taxRate ?? null,
              lineItems: next.details.lineItems.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                subtotalMinor: item.totals.subtotal,
              })),
            }
          : null,
      payments: transactions.map((transaction) => ({
        date: transaction.billedAt ?? transaction.createdAt,
        totalMinor: transaction.details?.totals?.grandTotal ?? "0",
        status: transaction.status,
        invoiceAvailable:
          transaction.status === "completed" &&
          Boolean(transaction.details?.totals) &&
          transaction.details?.totals?.grandTotal !== "0",
      })),
      paymentsAvailable: transactionsResult.status === "fulfilled",
      purchaserDetailsAvailable:
        customerResult.status === "fulfilled" &&
        addressResult.status === "fulfilled",
      cancellationEffectiveAt:
        subscription.scheduledChange?.action === "cancel"
          ? subscription.scheduledChange.effectiveAt
          : null,
      updatePaymentMethodAvailable:
        subscription.collectionMode === "automatic" &&
        subscription.status !== "canceled",
    };
  } catch {
    return null;
  }
}

export function formatPaddleMoney(amountMinor: string, currencyCode = "EUR") {
  const amount = Number(amountMinor);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatTaxRate(rate: string | null) {
  if (!rate) return null;
  const value = Number(rate);
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat("en-IE", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(value);
}
