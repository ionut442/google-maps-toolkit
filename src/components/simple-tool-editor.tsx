import Link from "next/link";
import { ContactRound, ExternalLink, Star } from "lucide-react";
import { updateModuleLabelAction } from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { SubmitButton } from "@/components/submit-button";
import type { ModuleType } from "@/lib/domain";

export function SimpleToolEditor({
  businessId,
  moduleId,
  type,
  label,
  googleUrl,
  business,
}: {
  businessId: string;
  moduleId: string;
  type: ModuleType;
  label: string;
  googleUrl?: string | null;
  business: { name: string; phone: string; email: string };
}) {
  const review = type === "REVIEW";
  return (
    <div className="editor-sheet stack-form">
      <div className="simple-tool-intro">
        {review ? (
          <Star size={24} aria-hidden="true" />
        ) : (
          <ContactRound size={24} aria-hidden="true" />
        )}
        <div>
          <h2>
            {review ? "Google review button" : "Downloadable contact card"}
          </h2>
          <p>
            {review
              ? "Send happy customers straight to your Google listing."
              : "Customers save your current business details to their phone in one tap."}
          </p>
        </div>
      </div>
      <EditorActionForm action={updateModuleLabelAction}>
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="moduleId" value={moduleId} />
        <label>
          Button text
          <input name="label" defaultValue={label} maxLength={60} required />
        </label>
        <SubmitButton>Save changes</SubmitButton>
      </EditorActionForm>
      {review ? (
        <div className="simple-tool-preview">
          <span>Google connection</span>
          {googleUrl ? (
            <>
              <strong>Google listing connected</strong>
              <a
                className="button secondary"
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Test review link <ExternalLink size={16} aria-hidden="true" />
              </a>
            </>
          ) : (
            <>
              <strong>Google listing not connected</strong>
              <p>
                Add a confirmed Google Maps or review link in Business Details.
              </p>
              <Link className="button secondary" href="/dashboard/business">
                Connect Google
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="simple-tool-preview">
          <span>Information customers save</span>
          <strong>{business.name}</strong>
          <p>
            {business.phone}
            <br />
            {business.email}
          </p>
          <small>Update these details from Business Details.</small>
          <Link className="button secondary" href="/dashboard/business">
            Edit business details
          </Link>
        </div>
      )}
    </div>
  );
}
