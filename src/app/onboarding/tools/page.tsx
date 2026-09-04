import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { finishToolsAction } from "@/app/actions";
import { StepShell } from "@/components/step-shell";
import { ToolList } from "@/components/tool-list";
export default async function ToolsPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  return (
    <StepShell
      step={4}
      title="Choose your customer tools"
      intro="Start with the actions your customers need most. You can change these later."
    >
      <ToolList
        businessId={business.id}
        tools={business.modules}
        onboarding
        googleConnected={Boolean(business.googleReviewUrl)}
      />
      <form action={finishToolsAction}>
        <button className="sticky-submit">Continue</button>
      </form>
    </StepShell>
  );
}
