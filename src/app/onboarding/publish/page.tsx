import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import { setPublishedAction } from "@/app/actions";
import { StepShell } from "@/components/step-shell";
import { SubmitButton } from "@/components/submit-button";
import { publicBusinessUrl } from "@/lib/public-url";
export default async function PublishPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const url = publicBusinessUrl(business.slug);
  return (
    <StepShell
      step={6}
      title="Your page is ready"
      intro="Publish now or keep it private while you refine details."
    >
      <div className="card publish-card">
        <span className="subtle">Public URL</span>
        <strong>{url}</strong>
        <p className="subtle">
          After publishing, download the Business Page QR from your dashboard.
        </p>
        <form action={setPublishedAction}>
          <input type="hidden" name="businessId" value={business.id} />
          <input type="hidden" name="published" value="true" />
          <input type="hidden" name="intent" value="onboarding" />
          <SubmitButton pendingLabel="Publishing…">
            Publish and open dashboard
          </SubmitButton>
        </form>
        <form action={setPublishedAction}>
          <input type="hidden" name="businessId" value={business.id} />
          <input type="hidden" name="published" value="false" />
          <input type="hidden" name="intent" value="onboarding" />
          <SubmitButton className="secondary" pendingLabel="Saving…">
            Continue unpublished
          </SubmitButton>
        </form>
      </div>
    </StepShell>
  );
}
