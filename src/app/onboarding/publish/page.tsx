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
import { canPublishBusiness } from "@/lib/domain";
import { publicBusinessUrl } from "@/lib/public-url";
import {
  allEnabledToolsReady,
  onboardingToolReady,
} from "@/lib/onboarding-readiness";
import { labels, moduleTypes, type ModuleType } from "@/lib/domain";
import { toolEditorHref } from "@/lib/tool-presentation";
import { listOwnedTrustEvidence } from "@/lib/trust-evidence";

export default async function PublishPage() {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const trustEvidence = await listOwnedTrustEvidence(user.id, business.id);
  const url = publicBusinessUrl(business.slug);
  const detailsReady = Boolean(business.phone && business.description);
  const enabledTools = business.modules.filter(
    (module) =>
      module.enabled && moduleTypes.includes(module.type as ModuleType),
  );
  const toolsReady = allEnabledToolsReady(enabledTools, business);
  const missingDetails = [
    ...(!business.description ? ["short description"] : []),
    ...(!business.phone ? ["phone number"] : []),
  ];
  const publishable =
    canPublishBusiness(business, business.modules) && toolsReady;
  const asset =
    "/dashboard/businesses/" + business.id + "/assets/business-page-qr";

  return (
    <StepShell
      step={5}
      title={business.published ? "You’re live" : "Final check"}
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
              <h2>Finish your enabled tools</h2>
              <ul className="publish-checklist">
                <ChecklistItem
                  ready={detailsReady}
                  label="Business details added"
                  detail={
                    missingDetails.length
                      ? `Missing: ${missingDetails.join(" and ")}`
                      : undefined
                  }
                  href="/onboarding/details?from=publish"
                />
                {enabledTools.map((module) => {
                  const type = module.type as ModuleType;
                  const ready = onboardingToolReady(module, business);
                  return (
                    <ChecklistItem
                      key={module.id}
                      ready={ready}
                      label={labels[type]}
                      detail={
                        ready
                          ? "Saved and ready"
                          : type === "CALL_WHATSAPP" || type === "SAVE_CONTACT"
                            ? "Add a phone number in Business details"
                            : "Review this tool and save your changes"
                      }
                      href={`${toolEditorHref(module.id)}?returnTo=publish`}
                    />
                  );
                })}
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
        <CustomerPreview business={{ ...business, trustEvidence }} />
      </div>
    </StepShell>
  );
}

function ChecklistItem({
  ready,
  label,
  detail,
  href,
}: {
  ready: boolean;
  label: string;
  detail?: string;
  href: string;
}) {
  return (
    <li className={ready ? "is-ready" : "needs-attention"}>
      {ready ? (
        <CheckCircle2 size={19} aria-hidden="true" />
      ) : (
        <CircleAlert size={19} aria-hidden="true" />
      )}
      <span>
        {label}
        {detail && <small>{detail}</small>}
      </span>
      <Link href={href}>{ready ? "Edit" : "Finish this"}</Link>
    </li>
  );
}
