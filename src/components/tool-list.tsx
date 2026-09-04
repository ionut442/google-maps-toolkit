import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StatusBadge, ToolIcon } from "@/components/dashboard-ui";
import { ToolStatusSwitch } from "@/components/tool-status-switch";
import { labels, moduleTypes, type ModuleType } from "@/lib/domain";
import {
  parsedTool,
  toolDescriptions,
  toolEditorHref,
  toolSummary,
} from "@/lib/tool-presentation";

type Tool = { id: string; type: string; enabled: boolean; config: string };

export function ToolList({
  businessId,
  tools,
  onboarding = false,
  googleConnected = false,
}: {
  businessId: string;
  tools: Tool[];
  onboarding?: boolean;
  googleConnected?: boolean;
}) {
  return (
    <div className="tool-card-grid">
      {tools.map((tool) => {
        if (!moduleTypes.includes(tool.type as ModuleType)) return null;
        const type = tool.type as ModuleType;
        const { config } = parsedTool(type, tool.config);
        return (
          <article className="tool-summary-card" key={tool.id}>
            <div className="tool-card-top">
              <ToolIcon type={type} />
              <StatusBadge on={tool.enabled} />
            </div>
            <div>
              <h2>{labels[type]}</h2>
              <p>{toolDescriptions[type]}</p>
              <span className="tool-config-summary">
                {toolSummary(type, config, { googleConnected })}
              </span>
            </div>
            <div className="tool-card-actions">
              <ToolStatusSwitch
                businessId={businessId}
                moduleId={tool.id}
                type={type}
                enabled={tool.enabled}
              />
              {!onboarding && (
                <Link
                  className="button secondary tool-edit-button"
                  href={toolEditorHref(tool.id)}
                >
                  Edit <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
