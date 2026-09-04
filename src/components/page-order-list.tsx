import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { moveModuleAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { labels, moduleTypes, type ModuleType } from "@/lib/domain";
import { ToolIcon } from "@/components/dashboard-ui";

export function PageOrderList({
  businessId,
  tools,
}: {
  businessId: string;
  tools: Array<{ id: string; type: string; enabled: boolean }>;
}) {
  const enabled = tools.filter(
    (tool) => tool.enabled && moduleTypes.includes(tool.type as ModuleType),
  );
  return (
    <div className="page-order-list">
      {enabled.map((tool, index) => {
        const type = tool.type as ModuleType;
        return (
          <div className="page-order-row" key={tool.id}>
            <GripVertical className="drag-hint" size={18} aria-hidden="true" />
            <ToolIcon type={type} />
            <strong>{labels[type]}</strong>
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
