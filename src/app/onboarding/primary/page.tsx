import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { StepShell } from "@/components/step-shell";
import { PrimaryForm } from "@/components/primary-form";
export default async function PrimaryPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  return (
    <StepShell
      step={5}
      title="Choose your main customer action"
      intro="This will be the clearest next step at the top of your customer page."
    >
      <PrimaryForm business={business} onboarding />
    </StepShell>
  );
}
