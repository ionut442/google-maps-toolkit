import { updateContactActionConfigAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import type { ModuleConfigByType } from "@/lib/domain";

export function ContactActionEditor({
  businessId,
  config,
}: {
  businessId: string;
  config: ModuleConfigByType["CALL_WHATSAPP"];
}) {
  return (
    <details className="tool-editor">
      <summary>Contact action settings</summary>
      <form action={updateContactActionConfigAction} className="stack">
        <input type="hidden" name="businessId" value={businessId} />
        <label>
          Call label
          <input
            name="callLabel"
            defaultValue={config.callLabel}
            maxLength={40}
            required
          />
        </label>
        <label>
          WhatsApp label
          <input
            name="whatsappLabel"
            defaultValue={config.whatsappLabel}
            maxLength={40}
            required
          />
        </label>
        <label>
          Optional WhatsApp message
          <textarea
            name="whatsappMessage"
            defaultValue={config.whatsappMessage ?? ""}
            maxLength={300}
            rows={3}
            placeholder="Hi, I’d like to request a quote."
          />
        </label>
        <label>
          Emergency label
          <input
            name="emergencyLabel"
            defaultValue={config.emergencyLabel}
            maxLength={40}
            required
          />
        </label>
        <SubmitButton pendingLabel="Saving…">
          Save contact settings
        </SubmitButton>
      </form>
    </details>
  );
}
