"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { db } from "@/lib/db";
import { createPaddleClient } from "@/lib/paddle-config";

export async function manageBillingAction(formData: FormData) {
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

  const session = await createPaddleClient().customerPortalSessions.create(
    billing.paddleCustomerId,
    [billing.paddleSubscriptionId],
  );
  redirect(session.urls.general.overview);
}
