import { toggleModuleAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { labels, type ModuleType } from "@/lib/domain";

export function ToolStatusSwitch({
  businessId,
  moduleId,
  type,
  enabled,
}: {
  businessId: string;
  moduleId: string;
  type: ModuleType;
  enabled: boolean;
}) {
  return (
    <form action={toggleModuleAction} className="tool-status-control">
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="moduleId" value={moduleId} />
      <SubmitButton
        className={`tool-switch ${enabled ? "is-on" : ""}`}
        role="switch"
        aria-checked={enabled}
        aria-label={`${labels[type]} on your customer page`}
        pendingLabel="Updating…"
      >
        <span aria-hidden="true" />
        {enabled ? "On" : "Off"}
      </SubmitButton>
    </form>
  );
}
