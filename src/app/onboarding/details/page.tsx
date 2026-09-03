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
      title="Tell customers who you are"
      intro="Enter shared details once. Every tool can reuse them."
    >
      <ProfileForm business={business} onboarding />
    </StepShell>
  );
}
