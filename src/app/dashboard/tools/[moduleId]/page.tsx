import { notFound } from "next/navigation";
import { ContactActionEditor } from "@/components/contact-action-editor";
import { CustomerPreview } from "@/components/customer-preview";
import { FaqEditor } from "@/components/faq-editor";
import { PricingEditor } from "@/components/pricing-editor";
import { QuoteEditor } from "@/components/quote-editor";
import { ServiceAreaEditor } from "@/components/service-area-editor";
import { SimpleToolEditor } from "@/components/simple-tool-editor";
import {
  PromotionsEditor,
  ServicesEditor,
  WorkHoursEditor,
} from "@/components/structured-tool-editors";
import { ToolEditorShell } from "@/components/dashboard-ui";
import { ToolStatusSwitch } from "@/components/tool-status-switch";
import { TrustEditor } from "@/components/trust-editor";
import { requireUser } from "@/lib/auth";
import { requireOwnedBusiness } from "@/lib/business";
import {
  moduleTypes,
  parseModuleConfig,
  type ModuleConfigByType,
  type ModuleType,
} from "@/lib/domain";
import { safeHttpUrl } from "@/lib/public-actions";
import { toolDescriptions, toolEditorTitles } from "@/lib/tool-presentation";
import { listOwnedTrustEvidence } from "@/lib/trust-evidence";

export default async function ToolPage({
  params,
  searchParams,
}: {
  params: Promise<{ moduleId: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await requireUser();
  const business = await requireOwnedBusiness(user.id);
  const { moduleId } = await params;
  const { returnTo } = await searchParams;
  const tool = business.modules.find((candidate) => candidate.id === moduleId);
  if (!tool || !moduleTypes.includes(tool.type as ModuleType)) notFound();
  const type = tool.type as ModuleType;
  const config = parseModuleConfig(type, JSON.parse(tool.config));
  const evidence =
    type === "TRUST" ? await listOwnedTrustEvidence(user.id, business.id) : [];
  const complex = !["REVIEW", "SAVE_CONTACT"].includes(type);
  const ownsPreview = [
    "CALL_WHATSAPP",
    "QUOTE_REQUEST",
    "PRICING",
    "SERVICE_AREA",
    "TRUST",
    "FAQ",
    "SERVICES",
    "WORK_HOURS",
    "PROMOTIONS",
  ].includes(type);
  return (
    <ToolEditorShell
      type={type}
      title={toolEditorTitles[type]}
      intro={toolDescriptions[type]}
      fullWidth={ownsPreview}
      backHref={returnTo === "publish" ? "/onboarding/publish" : undefined}
      backLabel={returnTo === "publish" ? "Final check" : undefined}
      statusControl={
        <ToolStatusSwitch
          businessId={business.id}
          moduleId={tool.id}
          type={type}
          enabled={tool.enabled}
        />
      }
      aside={
        complex && !ownsPreview ? (
          <CustomerPreview business={business} />
        ) : undefined
      }
    >
      {type === "CALL_WHATSAPP" && (
        <ContactActionEditor
          businessId={business.id}
          phone={business.phone}
          whatsapp={business.whatsapp}
          config={config as ModuleConfigByType["CALL_WHATSAPP"]}
        />
      )}
      {type === "QUOTE_REQUEST" && (
        <QuoteEditor
          businessId={business.id}
          config={config as ModuleConfigByType["QUOTE_REQUEST"]}
        />
      )}
      {type === "PRICING" && (
        <PricingEditor
          businessId={business.id}
          config={config as ModuleConfigByType["PRICING"]}
        />
      )}
      {type === "SERVICE_AREA" && (
        <ServiceAreaEditor
          businessId={business.id}
          config={config as ModuleConfigByType["SERVICE_AREA"]}
        />
      )}
      {type === "TRUST" && (
        <TrustEditor
          businessId={business.id}
          config={config as ModuleConfigByType["TRUST"]}
          evidence={evidence}
        />
      )}
      {type === "FAQ" && (
        <FaqEditor
          businessId={business.id}
          config={config as ModuleConfigByType["FAQ"]}
        />
      )}
      {type === "SERVICES" && (
        <ServicesEditor
          businessId={business.id}
          config={config as ModuleConfigByType["SERVICES"]}
        />
      )}
      {type === "WORK_HOURS" && (
        <WorkHoursEditor
          businessId={business.id}
          config={config as ModuleConfigByType["WORK_HOURS"]}
        />
      )}
      {type === "PROMOTIONS" && (
        <PromotionsEditor
          businessId={business.id}
          config={config as ModuleConfigByType["PROMOTIONS"]}
          contacts={{
            phone: business.phone,
            whatsapp: business.whatsapp,
            email: business.email,
          }}
        />
      )}
      {(type === "REVIEW" || type === "SAVE_CONTACT") && (
        <SimpleToolEditor
          businessId={business.id}
          moduleId={tool.id}
          type={type}
          label={(config as { label: string }).label}
          googleUrl={safeHttpUrl(business.googleReviewUrl)}
          business={business}
        />
      )}
    </ToolEditorShell>
  );
}
