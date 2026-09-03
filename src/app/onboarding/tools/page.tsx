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
      title="Your starting toolkit"
      intro="Strong defaults are ready. Enable, disable, rename, or reorder tools."
    >
      <ToolList businessId={business.id} tools={business.modules} />
      <form action={finishToolsAction}>
        <button>Continue to primary action</button>
      </form>
    </StepShell>
  );
}
