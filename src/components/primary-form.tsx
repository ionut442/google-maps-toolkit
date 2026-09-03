import { setPrimaryAction } from "@/app/actions";
import { validPrimaryActions } from "@/lib/domain";
import { SubmitButton } from "@/components/submit-button";
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
        <label className="choice" key={action}>
          <input
            type="radio"
            name="primaryAction"
            value={action}
            defaultChecked={business.primaryAction === action}
            required
          />
          <span>
            <strong>{actionLabels[action]}</strong>
            <small>This becomes your most prominent customer action.</small>
          </span>
        </label>
      ))}
      <SubmitButton pendingLabel="Saving…">Save primary action</SubmitButton>
    </form>
  );
}
