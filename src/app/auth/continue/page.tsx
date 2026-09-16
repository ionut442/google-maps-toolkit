import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { findOwnedBusiness } from "@/lib/business";
import { onboardingDestination } from "@/lib/onboarding";

export default async function AuthContinuePage() {
  const user = await requireUser();
  const business = await findOwnedBusiness(user.id);
  if (!business) redirect("/onboarding/business");
  redirect(onboardingDestination(business.onboardingStep));
}
