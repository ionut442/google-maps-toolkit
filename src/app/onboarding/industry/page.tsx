import { requireUser } from "@/lib/auth";
import { requireOwnedBusinessRecord } from "@/lib/business";
import { templates } from "@/lib/templates";
import { StepShell } from "@/components/step-shell";
import { BusinessTypeChooser } from "@/components/business-type-chooser";

export default async function IndustryPage() {
  const user = await requireUser();
  const business = await requireOwnedBusinessRecord(user.id);
  return (
    <StepShell
      step={2}
      title="What type of business do you run?"
      intro="We’ll recommend a useful starting set of customer tools."
    >
      <BusinessTypeChooser
        current={business.industry}
        customLabel={business.customIndustryLabel}
        choices={Object.values(templates).map((template) => ({
          industry: template.industry,
          name: template.industry === "OTHER" ? "Other" : template.name,
          toolCount: template.modules.filter((module) => module.enabled).length,
        }))}
      />
    </StepShell>
  );
}
