import {
  labels,
  moduleTypes,
  parseModuleConfig,
  type ModuleType,
} from "@/lib/domain";
import {
  moveModuleAction,
  toggleModuleAction,
  updateModuleLabelAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { FaqEditor } from "@/components/faq-editor";
import { ContactActionEditor } from "@/components/contact-action-editor";
import { QuoteEditor } from "@/components/quote-editor";
import type { ModuleConfigByType } from "@/lib/domain";
import { PricingEditor } from "@/components/pricing-editor";
import { ServiceAreaEditor } from "@/components/service-area-editor";
import { TrustEditor } from "@/components/trust-editor";

type Tool = {
  id: string;
  type: string;
  enabled: boolean;
  sortOrder: number;
  config: string;
};

const iconPaths: Record<ModuleType, string> = {
  CALL_WHATSAPP:
    "M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2a1.5 1.5 0 0 1 1.5-.36c1.05.35 2.18.54 3.35.54A1.75 1.75 0 0 1 22 17.13V20a2 2 0 0 1-2 2C10.06 22 2 13.94 2 4a2 2 0 0 1 2-2h2.87A1.75 1.75 0 0 1 8.62 3.75c0 1.17.19 2.3.54 3.35a1.5 1.5 0 0 1-.36 1.5l-2.2 2.2Z",
  QUOTE_REQUEST: "M4 4h16v16H4zM8 9h8M8 13h5",
  PRICING:
    "M12 2v20M17 6.5c0-1.38-2.24-2.5-5-2.5S7 5.12 7 6.5 9.24 9 12 9s5 1.12 5 2.5-2.24 2.5-5 2.5S7 17.62 7 19",
  SERVICE_AREA:
    "M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  TRUST: "m12 2 7 3v6c0 5-3 8-7 11-4-3-7-6-7-11V5l7-3Zm-3 9 2 2 4-4",
  FAQ: "M4 4h16v14H8l-4 4V4Zm6 5a2 2 0 1 1 3 1.7c-1 .6-1 1.3-1 2.3m0 2h.01",
  REVIEW:
    "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1L12 2Z",
  SAVE_CONTACT:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10-4v6m3-3h-6",
};

function ToolIcon({ type }: { type: ModuleType }) {
  return (
    <span className="tool-icon" aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={iconPaths[type]} />
      </svg>
    </span>
  );
}

export function ToolList({
  businessId,
  tools,
  editable = true,
  trustEvidence = [],
}: {
  businessId: string;
  tools: Tool[];
  editable?: boolean;
  trustEvidence?: Array<{
    id: string;
    entryId: string;
    originalFilename: string;
    sizeBytes: number;
  }>;
}) {
  return (
    <div className="tool-list">
      {tools.map((tool, index) => {
        const type = moduleTypes.includes(tool.type as ModuleType)
          ? (tool.type as ModuleType)
          : null;
        if (!type) return null;
        const config = parseModuleConfig(type, JSON.parse(tool.config)) as {
          label?: string;
          suggestedFields?: string[];
          suggestedFaqs?: Array<{ question: string }>;
          mode?: string;
        };
        return (
          <article
            className="tool"
            data-tool={type.toLowerCase()}
            key={tool.id}
          >
            <div className="tool-summary">
              <ToolIcon type={type} />
              <div>
                <strong>{labels[type]}</strong>
                <span className={`badge ${tool.enabled ? "live" : "muted"}`}>
                  {tool.enabled ? "Enabled" : "Disabled"}
                </span>
                {config.label && <p className="subtle">{config.label}</p>}
                {config.suggestedFields && (
                  <small>{config.suggestedFields.join(" · ")}</small>
                )}
                {config.suggestedFaqs && type !== "FAQ" && (
                  <small>
                    {config.suggestedFaqs.map((f) => f.question).join(" · ")}
                  </small>
                )}
              </div>
            </div>
            {editable && (
              <div className="tool-controls">
                <form action={toggleModuleAction}>
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="moduleId" value={tool.id} />
                  <SubmitButton className="secondary" pendingLabel="Updating…">
                    {tool.enabled ? "Disable" : "Enable"}
                  </SubmitButton>
                </form>
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
                    ↑
                  </SubmitButton>
                  <SubmitButton
                    className="icon secondary"
                    name="direction"
                    value="down"
                    disabled={index === tools.length - 1}
                    aria-label={`Move ${labels[type]} down`}
                    pendingLabel="…"
                  >
                    ↓
                  </SubmitButton>
                </form>
                {config.label &&
                  ![
                    "FAQ",
                    "QUOTE_REQUEST",
                    "PRICING",
                    "SERVICE_AREA",
                    "TRUST",
                  ].includes(type) && (
                    <details>
                      <summary>Basic setting</summary>
                      <form
                        action={updateModuleLabelAction}
                        className="inline-form"
                      >
                        <input
                          type="hidden"
                          name="businessId"
                          value={businessId}
                        />
                        <input type="hidden" name="moduleId" value={tool.id} />
                        <input
                          name="label"
                          defaultValue={config.label}
                          aria-label={`${labels[type]} label`}
                          maxLength={60}
                        />
                        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
                      </form>
                    </details>
                  )}
              </div>
            )}
            {editable && type === "FAQ" && (
              <FaqEditor
                businessId={businessId}
                config={config as ModuleConfigByType["FAQ"]}
              />
            )}
            {editable && type === "CALL_WHATSAPP" && (
              <ContactActionEditor
                businessId={businessId}
                config={config as ModuleConfigByType["CALL_WHATSAPP"]}
              />
            )}
            {editable && type === "QUOTE_REQUEST" && (
              <QuoteEditor
                businessId={businessId}
                config={config as ModuleConfigByType["QUOTE_REQUEST"]}
              />
            )}
            {editable && type === "PRICING" && (
              <PricingEditor
                businessId={businessId}
                config={config as ModuleConfigByType["PRICING"]}
              />
            )}
            {editable && type === "SERVICE_AREA" && (
              <ServiceAreaEditor
                businessId={businessId}
                config={config as ModuleConfigByType["SERVICE_AREA"]}
              />
            )}
            {editable && type === "TRUST" && (
              <TrustEditor
                businessId={businessId}
                config={config as ModuleConfigByType["TRUST"]}
                evidence={trustEvidence}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
