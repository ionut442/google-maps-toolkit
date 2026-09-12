"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { updateContactActionConfigAction } from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { SubmitButton } from "@/components/submit-button";
import type { ModuleConfigByType } from "@/lib/domain";

export function ContactActionEditor({
  businessId,
  config,
  phone,
  whatsapp,
}: {
  businessId: string;
  config: ModuleConfigByType["CALL_WHATSAPP"];
  phone: string;
  whatsapp: string;
}) {
  const [draft, setDraft] = useState(config);
  const followsPhone = !whatsapp || whatsapp === phone;
  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet stack-form">
        <p>Your phone and WhatsApp number come from Business Details.</p>
        <div className="contact-channel-grid">
          <section className="contact-channel">
            <Phone size={22} aria-hidden="true" />
            <h2>Call</h2>
            <small>Phone number</small>
            <strong>{phone || "Add your business phone"}</strong>
            <Link href="/dashboard/business">Edit business details</Link>
          </section>
          <section className="contact-channel">
            <MessageCircle size={22} aria-hidden="true" />
            <h2>WhatsApp</h2>
            <small>WhatsApp number</small>
            <strong>{whatsapp || phone || "Add your WhatsApp number"}</strong>
            <small>
              {followsPhone
                ? "Using your business phone"
                : "Using a different number"}
            </small>
            <Link href="/dashboard/business">Edit business details</Link>
          </section>
        </div>
        <EditorActionForm action={updateContactActionConfigAction}>
          <input type="hidden" name="businessId" value={businessId} />
          <label>
            WhatsApp starter message <span className="optional">Optional</span>
            <textarea
              name="whatsappMessage"
              value={draft.whatsappMessage ?? ""}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  whatsappMessage: event.currentTarget.value,
                })
              }
              maxLength={300}
              rows={4}
              placeholder="Hi, I'd like a quote for a job. Are you available?"
              aria-describedby="whatsapp-message-help"
            />
          </label>
          <small id="whatsapp-message-help">
            Customers will see this message ready to send.
          </small>
          <fieldset className="emergency-availability">
            <legend>Emergency availability</legend>
            <label className="emergency-toggle">
              <input
                type="checkbox"
                name="emergencyEnabled"
                checked={draft.emergencyEnabled}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    emergencyEnabled: event.currentTarget.checked,
                  })
                }
              />
              Emergency / 24-7 calls available
            </label>
            {draft.emergencyEnabled && (
              <label>
                Availability label
                <input
                  name="emergencyLabel"
                  value={draft.emergencyLabel ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      emergencyLabel: event.currentTarget.value,
                    })
                  }
                  list="emergency-label-options"
                  maxLength={40}
                  placeholder="24/7 emergency"
                  required
                />
                <datalist id="emergency-label-options">
                  <option value="24/7" />
                  <option value="Emergency calls" />
                  <option value="24/7 emergency" />
                </datalist>
              </label>
            )}
          </fieldset>
          <details className="advanced-options">
            <summary>Button text</summary>
            <div className="stack-form">
              <label>
                Call button
                <input
                  name="callLabel"
                  value={draft.callLabel}
                  onChange={(event) =>
                    setDraft({ ...draft, callLabel: event.currentTarget.value })
                  }
                  maxLength={40}
                  required
                />
              </label>
              <label>
                WhatsApp button
                <input
                  name="whatsappLabel"
                  value={draft.whatsappLabel}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      whatsappLabel: event.currentTarget.value,
                    })
                  }
                  maxLength={40}
                  required
                />
              </label>
            </div>
          </details>
          <SubmitButton>Save changes</SubmitButton>
        </EditorActionForm>
      </div>
      <aside className="tool-editor-aside">
        <section className="tool-customer-preview">
          <h2>What customers see</h2>
          <p>Two simple ways to get in touch.</p>
          <div className="contact-preview-actions">
            <div className="contact-preview-action">
              <span>
                <Phone size={20} aria-hidden="true" />
                {draft.callLabel}
              </span>
              {draft.emergencyEnabled && draft.emergencyLabel && (
                <small className="contact-preview-emergency">
                  {draft.emergencyLabel}
                </small>
              )}
            </div>
            <div className="contact-preview-action">
              <span>
                <MessageCircle size={20} aria-hidden="true" />
                {draft.whatsappLabel}
              </span>
            </div>
          </div>
          {draft.whatsappMessage && (
            <div className="message-preview">
              <small>Ready to send on WhatsApp</small>
              <p>{draft.whatsappMessage}</p>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
