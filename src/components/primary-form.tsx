import { setPrimaryAction } from "@/app/actions";
import { validPrimaryActions } from "@/lib/domain";
import { SubmitButton } from "@/components/submit-button";
import { MessageCircle, Phone, Star, ClipboardList } from "lucide-react";

const actionDetails = {
  QUOTE_REQUEST: {
    description: "Collect the details you need before following up.",
    icon: ClipboardList,
  },
  CALL: {
    description: "Help customers speak to you immediately.",
    icon: Phone,
  },
  WHATSAPP: {
    description: "Start a familiar message conversation.",
    icon: MessageCircle,
  },
  REVIEW: {
    description: "Send happy customers to your Google listing.",
    icon: Star,
  },
};
const actionLabels = {
  QUOTE_REQUEST: "Get a Quote",
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  REVIEW: "Google Review",
} as const;
export function PrimaryForm({
  business,
  onboarding = false,
}: {
  business: {
    id: string;
    primaryAction: string | null;
    modules: Array<{ type: string; enabled: boolean }>;
  };
  onboarding?: boolean;
}) {
  const actions = validPrimaryActions(business.modules);
  return (
    <form action={setPrimaryAction} className="card stack">
      <input type="hidden" name="businessId" value={business.id} />
      {onboarding && <input type="hidden" name="intent" value="onboarding" />}
      {actions.map((action) => (
        <label className="choice primary-action-choice" key={action}>
          <input
            type="radio"
            name="primaryAction"
            value={action}
            defaultChecked={business.primaryAction === action}
            required
          />
          <span>
            {(() => {
              const Icon = actionDetails[action].icon;
              return <Icon size={22} aria-hidden="true" />;
            })()}
            <strong>{actionLabels[action]}</strong>
            <small>{actionDetails[action].description}</small>
          </span>
        </label>
      ))}
      <SubmitButton pendingLabel="Saving…">
        {onboarding ? "Continue" : "Save main action"}
      </SubmitButton>
    </form>
  );
}
