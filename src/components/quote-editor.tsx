import {
  addQuoteFieldAction,
  deleteQuoteFieldAction,
  moveQuoteFieldAction,
  updateQuoteFieldAction,
  updateQuoteFormMetaAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import {
  quoteFieldTypes,
  type QuoteField,
  type QuoteModuleConfig,
} from "@/lib/quote-config";

const fieldNames: Record<QuoteField["type"], string> = {
  TEXT: "Text",
  NUMBER: "Number",
  DROPDOWN: "Dropdown",
  MULTIPLE_CHOICE: "Multiple choice",
  CHECKBOX: "Checkbox",
  ADDRESS: "Address or postcode",
  CONTACT: "Contact detail",
  PHOTO: "Photo upload",
};

export function QuoteEditor({
  businessId,
  config,
}: {
  businessId: string;
  config: QuoteModuleConfig;
}) {
  const requiredContacts = config.fields.filter(
    (field) => field.type === "CONTACT" && field.required,
  ).length;
  const contacts = config.fields.filter(
    (field) => field.type === "CONTACT",
  ).length;
  const hasPhoto = config.fields.some((field) => field.type === "PHOTO");
  return (
    <details className="quote-editor-wrap purpose-editor">
      <summary>Configure quote form</summary>
      <div className="editor-sheet">
        <h3>Quote form</h3>
        <p className="subtle">
          Configure a short customer intake form. Supported fields only.
        </p>
        <form
          action={updateQuoteFormMetaAction}
          className="stack quote-meta-form"
        >
          <input type="hidden" name="businessId" value={businessId} />
          <label>
            Form label
            <input
              name="label"
              defaultValue={config.label}
              required
              maxLength={60}
            />
          </label>
          <label>
            Introduction
            <textarea
              name="intro"
              defaultValue={config.intro ?? ""}
              maxLength={240}
              rows={2}
            />
          </label>
          <SubmitButton pendingLabel="Saving…">
            Save form introduction
          </SubmitButton>
        </form>

        <div className="quote-editor-list">
          {config.fields.map((field, index) => {
            const mustStayRequired =
              field.type === "CONTACT" &&
              field.required &&
              requiredContacts === 1;
            const cannotDelete =
              field.type === "CONTACT" && (contacts === 1 || mustStayRequired);
            return (
              <article className="quote-editor-field" key={field.id}>
                <header>
                  <strong>
                    {index + 1}. {fieldNames[field.type]}
                  </strong>
                  <code>{field.id}</code>
                </header>
                <form action={updateQuoteFieldAction} className="stack">
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="index" value={index} />
                  <label>
                    Customer-facing label
                    <input
                      name="label"
                      defaultValue={field.label}
                      required
                      maxLength={100}
                    />
                  </label>
                  <label>
                    Helper text
                    <input
                      name="helperText"
                      defaultValue={field.helperText ?? ""}
                      maxLength={160}
                    />
                  </label>
                  {mustStayRequired && (
                    <input type="hidden" name="required" value="true" />
                  )}
                  <label className="quote-option">
                    <input
                      type="checkbox"
                      name="required"
                      value="true"
                      defaultChecked={field.required}
                      disabled={mustStayRequired}
                    />
                    <span>Required</span>
                  </label>
                  {(field.type === "DROPDOWN" ||
                    field.type === "MULTIPLE_CHOICE") && (
                    <label>
                      Choices, one per line
                      <textarea
                        name="choices"
                        defaultValue={field.choices.join("\n")}
                        rows={Math.min(8, field.choices.length + 1)}
                        required
                      />
                    </label>
                  )}
                  {field.type === "NUMBER" && (
                    <div className="form-grid">
                      <label>
                        Minimum
                        <input
                          name="min"
                          type="number"
                          defaultValue={field.min}
                        />
                      </label>
                      <label>
                        Maximum
                        <input
                          name="max"
                          type="number"
                          defaultValue={field.max}
                        />
                      </label>
                    </div>
                  )}
                  {field.type === "CONTACT" && (
                    <label>
                      Contact detail
                      <select
                        name="contactKind"
                        defaultValue={field.contactKind}
                      >
                        <option value="NAME">Name</option>
                        <option value="PHONE">Phone</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </label>
                  )}
                  <SubmitButton pendingLabel="Saving…">Save field</SubmitButton>
                </form>
                <div className="quote-editor-field-actions">
                  <form action={moveQuoteFieldAction}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="index" value={index} />
                    <SubmitButton
                      className="icon"
                      name="direction"
                      value="up"
                      disabled={index === 0}
                      aria-label={`Move ${field.label} up`}
                    >
                      ↑
                    </SubmitButton>
                    <SubmitButton
                      className="icon"
                      name="direction"
                      value="down"
                      disabled={index === config.fields.length - 1}
                      aria-label={`Move ${field.label} down`}
                    >
                      ↓
                    </SubmitButton>
                  </form>
                  <form action={deleteQuoteFieldAction}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="index" value={index} />
                    <SubmitButton
                      className="danger"
                      disabled={cannotDelete}
                      pendingLabel="Removing…"
                    >
                      Remove
                    </SubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>

        {config.fields.length < 16 && (
          <form action={addQuoteFieldAction} className="quote-add-field-form">
            <input type="hidden" name="businessId" value={businessId} />
            <label>
              Add field
              <select name="type" defaultValue="TEXT">
                {quoteFieldTypes
                  .filter((type) => type !== "PHOTO" || !hasPhoto)
                  .map((type) => (
                    <option value={type} key={type}>
                      {fieldNames[type]}
                    </option>
                  ))}
              </select>
            </label>
            <SubmitButton pendingLabel="Adding…">Add field</SubmitButton>
          </form>
        )}
        <small>{config.fields.length} of 16 fields</small>
      </div>
    </details>
  );
}
