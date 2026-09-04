import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  LayoutDashboard,
} from "lucide-react";
import { setPublishedAction } from "@/app/actions";
import { CopyLink } from "@/components/copy-link";
import { CustomerPreview } from "@/components/customer-preview";
import { StepShell } from "@/components/step-shell";
import { SubmitButton } from "@/components/submit-button";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import {
  canPublishBusiness,
  type PrimaryAction,
  validPrimaryActions,
} from "@/lib/domain";
import { publicBusinessUrl } from "@/lib/public-url";

export default async function PublishPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const url = publicBusinessUrl(business.slug);
  const detailsReady = Boolean(business.phone && business.description);
  const toolsReady = business.modules.some((module) => module.enabled);
  const actionReady = Boolean(
    business.primaryAction &&
    validPrimaryActions(business.modules).includes(
      business.primaryAction as PrimaryAction,
    ),
  );
  const publishable = canPublishBusiness(business, business.modules);
  const asset =
    "/dashboard/businesses/" + business.id + "/assets/business-page-qr";

  return (
    <StepShell
      step={6}
      title={business.published ? "You’re live" : "Your page is ready"}
      intro={
        business.published
          ? "Your customer page is published and ready to share."
          : "Review the essentials, then publish when everything looks right."
      }
    >
      <div className="publish-layout">
        <div className="card publish-card">
          {business.published ? (
            <>
              <div className="publish-success-mark">
                <CheckCircle2 size={30} aria-hidden="true" />
              </div>
              <h2>Your customer page is live</h2>
              <div className="publish-url">
                <small>Your page link</small>
                <strong>{url}</strong>
                <CopyLink value={url} />
              </div>
              <div className="publish-next-actions">
                <Link
                  className="button"
                  href={"/" + business.slug}
                  target="_blank"
                >
                  View page <ExternalLink size={17} aria-hidden="true" />
                </Link>
                <a className="button secondary" href={asset + "?download=1"}>
                  <Download size={17} aria-hidden="true" /> Download QR
                </a>
                <Link className="button secondary" href="/dashboard">
                  <LayoutDashboard size={17} aria-hidden="true" /> Go to
                  dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2>Final check</h2>
              <ul className="publish-checklist">
                <ChecklistItem
                  ready={detailsReady}
                  label="Business details added"
                  href="/onboarding/details"
                />
                <ChecklistItem
                  ready={toolsReady}
                  label="Customer tools selected"
                  href="/onboarding/tools"
                />
                <ChecklistItem
                  ready={actionReady}
                  label="Main action chosen"
                  href="/onboarding/primary"
                />
              </ul>
              {!publishable && (
                <p className="publish-blocked-message">
                  <CircleAlert size={18} aria-hidden="true" /> Finish the
                  highlighted item before publishing.
                </p>
              )}
              <div className="publish-actions">
                <form action={setPublishedAction}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="published" value="true" />
                  <SubmitButton disabled={!publishable}>
                    Publish my page
                  </SubmitButton>
                </form>
                <form action={setPublishedAction}>
                  <input type="hidden" name="businessId" value={business.id} />
                  <input type="hidden" name="published" value="false" />
                  <input type="hidden" name="intent" value="onboarding" />
                  <SubmitButton className="secondary">
                    Keep it private for now
                  </SubmitButton>
                </form>
              </div>
            </>
          )}
        </div>
        <CustomerPreview business={business} />
      </div>
    </StepShell>
  );
}

function ChecklistItem({
  ready,
  label,
  href,
}: {
  ready: boolean;
  label: string;
  href: string;
}) {
  return (
    <li className={ready ? "is-ready" : "needs-attention"}>
      {ready ? (
        <CheckCircle2 size={19} aria-hidden="true" />
      ) : (
        <CircleAlert size={19} aria-hidden="true" />
      )}
      <span>{label}</span>
      {!ready && <Link href={href}>Finish this</Link>}
    </li>
  );
}
