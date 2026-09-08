import Link from "next/link";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { moveModuleAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { labels, moduleTypes, type ModuleType } from "@/lib/domain";
import { ToolIcon } from "@/components/dashboard-ui";
import { onboardingToolReady } from "@/lib/onboarding-readiness";
import { toolEditorHref } from "@/lib/tool-presentation";

export function PageOrderList({
  businessId,
  tools,
  business,
}: {
  businessId: string;
  tools: Array<{
    id: string;
    type: string;
    enabled: boolean;
    customizedAt: Date | null;
  }>;
  business: { phone: string; googleReviewUrl: string | null };
}) {
  const enabled = tools.filter(
    (tool) => tool.enabled && moduleTypes.includes(tool.type as ModuleType),
  );
  const pendingCount = enabled.filter(
    (tool) => !onboardingToolReady(tool, business),
  ).length;
  const pendingMessage = `${pendingCount} enabled ${pendingCount === 1 ? "tool" : "tools"} still ${pendingCount === 1 ? "needs" : "need"} setup before your page is ready.`;
  return (
    <div className="page-order-list">
      {pendingCount > 0 && (
        <p className="page-order-attention" role="status">
          {pendingMessage}
        </p>
      )}
      {enabled.map((tool, index) => {
        const type = tool.type as ModuleType;
        const ready = onboardingToolReady(tool, business);
        return (
          <div className="page-order-row" key={tool.id}>
            <GripVertical className="drag-hint" size={18} aria-hidden="true" />
            <ToolIcon type={type} />
            <strong>{labels[type]}</strong>
            <span
              className={
                ready ? "tool-readiness is-ready" : "tool-readiness is-pending"
              }
            >
              {ready ? "Configured" : "Needs setup"}
            </span>
            {!ready && (
              <Link
                className="finish-tool-setup"
                href={toolEditorHref(tool.id)}
              >
                Finish setup
              </Link>
            )}
            <form action={moveModuleAction}>
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="moduleId" value={tool.id} />
              <SubmitButton
                className="icon secondary"
                name="direction"
                value="up"
                disabled={index === 0}
                aria-label={`Move ${labels[type]} up`}
                pendingLabel="…"
              >
                <ChevronUp size={17} />
              </SubmitButton>
              <SubmitButton
                className="icon secondary"
                name="direction"
                value="down"
                disabled={index === enabled.length - 1}
                aria-label={`Move ${labels[type]} down`}
                pendingLabel="…"
              >
                <ChevronDown size={17} />
              </SubmitButton>
            </form>
          </div>
        );
      })}
    </div>
  );
}
