import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { StepShell } from "@/components/step-shell";
import { ProfileForm } from "@/components/profile-form";
export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const { from } = await searchParams;
  const publishMissing =
    from === "publish"
      ? ([
          ...(!business.description ? ["description" as const] : []),
          ...(!business.phone ? ["phone" as const] : []),
        ] satisfies Array<"description" | "phone">)
      : [];
  return (
    <StepShell
      step={3}
      title="Add your business details"
      intro="Enter the essentials once. Your customer tools will reuse them automatically."
    >
      <ProfileForm
        business={business}
        onboarding
        publishMissing={publishMissing}
        returnToPublish={from === "publish"}
      />
    </StepShell>
  );
}
