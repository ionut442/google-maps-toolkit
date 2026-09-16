import { redirect } from "next/navigation";
import { BusinessNameForm } from "@/components/business-name-form";
import { StepShell } from "@/components/step-shell";
import { requireUser } from "@/lib/auth";
import { findOwnedBusiness } from "@/lib/business";
import { onboardingDestination } from "@/lib/onboarding";

export default async function BusinessOnboardingPage() {
  const user = await requireUser();
  const business = await findOwnedBusiness(user.id);
  if (business) redirect(onboardingDestination(business.onboardingStep));

  return (
    <StepShell
      step={1}
      title="What is your business called?"
      intro="Add your business name, then we’ll tailor your LocalAction tools."
    >
      <BusinessNameForm />
    </StepShell>
  );
}
