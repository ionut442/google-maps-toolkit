import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { StepShell } from "@/components/step-shell";
import { ProfileForm } from "@/components/profile-form";
export default async function DetailsPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  return (
    <StepShell
      step={3}
      title="Add your business details"
      intro="Enter the essentials once. Your customer tools will reuse them automatically."
    >
      <ProfileForm business={business} onboarding />
    </StepShell>
  );
}
