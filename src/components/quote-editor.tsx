"use client";

import { useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  CheckSquare,
  ChevronDown,
  Hash,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  UserRound,
  ImagePlus,
  type LucideIcon,
} from "lucide-react";
import {
  addQuoteFieldAction,
  deleteQuoteFieldAction,
  moveQuoteFieldAction,
  saveQuoteAction,
  updateQuoteFieldAction,
} from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { QuoteFieldControl } from "@/components/public/quote-request-form";
import { SubmitButton } from "@/components/submit-button";
import {
  quoteFieldTypes,
  type QuoteField,
  type QuoteModuleConfig,
} from "@/lib/quote-config";

const questionTypes: Record<
  QuoteField["type"],
  { name: string; example: string; icon: LucideIcon }
> = {
  TEXT: {
    name: "Longer description",
    example: "What needs doing?",
    icon: AlignLeft,
  },
  NUMBER: { name: "Number", example: "How many rooms?", icon: Hash },
  DROPDOWN: {
    name: "Choose one",
    example: "Which service do you need?",
    icon: ChevronDown,
  },
  MULTIPLE_CHOICE: {
    name: "Choose several",
    example: "Which jobs need attention?",
    icon: ListChecks,
  },
  CHECKBOX: {
    name: "Yes / No",
    example: "Is this an emergency?",
    icon: CheckSquare,
  },
  ADDRESS: {
    name: "Address or postcode",
    example: "Where is the job?",
    icon: MapPin,
  },
  CONTACT: {
    name: "Contact detail",
    example: "Your name, phone or email",
    icon: UserRound,
  },
  PHOTO: {
    name: "Photos",
    example: "Show us what needs fixing",
    icon: ImagePlus,
  },
};

export function QuoteEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: QuoteModuleConfig;
}) {
  const [config, setConfig] = useState(initial);
  const signature = JSON.stringify(initial);
  const [savedSignature, setSavedSignature] = useState(signature);
  if (signature !== savedSignature) {
    setSavedSignature(signature);
    setConfig(initial);
  }
  const requiredContacts = config.fields.filter(
    (field) => field.type === "CONTACT" && field.required,
  ).length;
  const contacts = config.fields.filter(
    (field) => field.type === "CONTACT",
  ).length;
  const hasPhoto = config.fields.some((field) => field.type === "PHOTO");
  function changeQuestion(index: number, change: Partial<QuoteField>) {
    setConfig((current) => ({
      ...current,
      fields: current.fields.map((field, i) =>
        i === index ? ({ ...field, ...change } as QuoteField) : field,
      ),
    }));
  }
  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet stack-form">
        <section className="stack-form">
          <h2>Introduce your form</h2>
          <p>
            Choose what customers should tell you before you call them back.
          </p>
          <div className="stack-form quote-introduction-fields">
            <label>
              Heading customers see
              <input
                value={config.label}
                onChange={(event) =>
                  setConfig({ ...config, label: event.currentTarget.value })
                }
                required
                maxLength={60}
              />
            </label>
            <label>
              Short introduction <span className="optional">Optional</span>
              <textarea
                value={config.intro ?? ""}
                onChange={(event) =>
                  setConfig({ ...config, intro: event.currentTarget.value })
                }
                maxLength={240}
                rows={2}
              />
            </label>
          </div>
        </section>
        <section className="stack-form" aria-labelledby="questions-title">
          <div className="section-heading">
            <h2 id="questions-title">Questions</h2>
            <small>{config.fields.length} of 16</small>
          </div>
          <div className="question-editor-list">
            {config.fields.map((field, index) => {
              const mustStayRequired =
                field.type === "CONTACT" &&
                field.required &&
                requiredContacts === 1;
              const cannotDelete =
                field.type === "CONTACT" &&
                (contacts === 1 || mustStayRequired);
              const Icon = questionTypes[field.type].icon;
              const typeName =
                field.type === "TEXT" && !field.multiline
                  ? "Short answer"
                  : questionTypes[field.type].name;
              return (
                <details
                  className="question-editor-card"
                  key={field.id}
                  name="quote-questions"
                >
                  <summary>
                    <Icon size={21} aria-hidden="true" />
                    <span>
                      <strong>{field.label}</strong>
                      <small>
                        {field.required ? "Required" : "Optional"} · {typeName}
                      </small>
                    </span>
                    <span className="edit-affordance">
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </span>
                  </summary>
                  <div className="focused-form">
                    <EditorActionForm action={updateQuoteFieldAction}>
                      <input
                        type="hidden"
                        name="businessId"
                        value={businessId}
                      />
                      <input type="hidden" name="index" value={index} />
                      <label>
                        Question for the customer
                        <input
                          name="label"
                          value={field.label}
                          onChange={(event) =>
                            changeQuestion(index, {
                              label: event.currentTarget.value,
                            })
                          }
                          required
                          maxLength={100}
                        />
                      </label>
                      <label>
                        Helpful hint <span className="optional">Optional</span>
                        <input
                          name="helperText"
                          value={field.helperText ?? ""}
                          onChange={(event) =>
                            changeQuestion(index, {
                              helperText: event.currentTarget.value,
                            })
                          }
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
                          checked={field.required}
                          onChange={(event) =>
                            changeQuestion(index, {
                              required: event.currentTarget.checked,
                            })
                          }
                          disabled={mustStayRequired}
                        />
                        <span>Customers must answer this</span>
                      </label>
                      {mustStayRequired && (
                        <small>
                          Keep at least one contact question required so you can
                          reply.
                        </small>
                      )}
                      {(field.type === "DROPDOWN" ||
                        field.type === "MULTIPLE_CHOICE") && (
                        <label>
                          Choices, one per line
                          <textarea
                            name="choices"
                            defaultValue={field.choices.join("\n")}
                            onChange={(event) =>
                              changeQuestion(index, {
                                choices: event.currentTarget.value
                                  .split(/\r?\n/)
                                  .map((choice) => choice.trim())
                                  .filter(Boolean),
                              })
                            }
                            rows={Math.min(8, field.choices.length + 1)}
                            required
                          />
                        </label>
                      )}
                      {field.type === "CONTACT" && (
                        <label>
                          Which contact detail?
                          <select
                            name="contactKind"
                            value={field.contactKind}
                            onChange={(event) =>
                              changeQuestion(index, {
                                contactKind: event.currentTarget.value as
                                  | "NAME"
                                  | "PHONE"
                                  | "EMAIL",
                              })
                            }
                          >
                            <option value="NAME">Name</option>
                            <option value="PHONE">Phone</option>
                            <option value="EMAIL">Email</option>
                          </select>
                        </label>
                      )}
                      {field.type === "NUMBER" && (
                        <details className="advanced-options">
                          <summary>More options</summary>
                          <div className="form-grid">
                            <label>
                              Smallest number
                              <input
                                name="min"
                                type="number"
                                defaultValue={field.min}
                              />
                            </label>
                            <label>
                              Largest number
                              <input
                                name="max"
                                type="number"
                                defaultValue={field.max}
                              />
                            </label>
                          </div>
                        </details>
                      )}
                      <SubmitButton>Save question</SubmitButton>
                    </EditorActionForm>
                    <div className="question-secondary-actions">
                      <EditorActionForm
                        action={moveQuoteFieldAction}
                        className="row-actions"
                        savedMessage="Question moved"
                      >
                        <input
                          type="hidden"
                          name="businessId"
                          value={businessId}
                        />
                        <input type="hidden" name="index" value={index} />
                        <SubmitButton
                          className="icon secondary"
                          name="direction"
                          value="up"
                          disabled={index === 0}
                          aria-label={`Move ${field.label} up`}
                        >
                          <ArrowUp size={18} aria-hidden="true" />
                        </SubmitButton>
                        <SubmitButton
                          className="icon secondary"
                          name="direction"
                          value="down"
                          disabled={index === config.fields.length - 1}
                          aria-label={`Move ${field.label} down`}
                        >
                          <ArrowDown size={18} aria-hidden="true" />
                        </SubmitButton>
                      </EditorActionForm>
                      <EditorActionForm
                        action={deleteQuoteFieldAction}
                        savedMessage="Question removed"
                      >
                        <input
                          type="hidden"
                          name="businessId"
                          value={businessId}
                        />
                        <input type="hidden" name="index" value={index} />
                        <SubmitButton
                          className="secondary danger-text"
                          disabled={cannotDelete}
                        >
                          Remove question
                        </SubmitButton>
                      </EditorActionForm>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
          {config.fields.length < 16 ? (
            <details className="add-object">
              <summary>
                <Plus size={18} aria-hidden="true" /> Add question
              </summary>
              <div className="focused-form">
                <p>What would you like to ask?</p>
                <div className="question-type-grid">
                  {quoteFieldTypes
                    .filter((type) => type !== "PHOTO" || !hasPhoto)
                    .map((type) => {
                      const { icon: Icon, name, example } = questionTypes[type];
                      return (
                        <EditorActionForm
                          key={type}
                          action={addQuoteFieldAction}
                          savedMessage="Question added"
                        >
                          <input
                            type="hidden"
                            name="businessId"
                            value={businessId}
                          />
                          <input type="hidden" name="type" value={type} />
                          <button
                            className="question-type-choice"
                            type="submit"
                          >
                            <Icon size={22} aria-hidden="true" />
                            <strong>{name}</strong>
                            <small>{example}</small>
                          </button>
                        </EditorActionForm>
                      );
                    })}
                </div>
                {hasPhoto && (
                  <small>Your form already includes a photo question.</small>
                )}
              </div>
            </details>
          ) : (
            <p>Your form has 16 questions. Remove one before adding another.</p>
          )}
        </section>
        <EditorActionForm action={saveQuoteAction} className="quote-save-form">
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="config" value={JSON.stringify(config)} />
          <div className="editor-save-bar">
            <SubmitButton>Save quote form</SubmitButton>
            <small>Saves the introduction and every question.</small>
          </div>
        </EditorActionForm>
      </div>
      <aside className="tool-editor-aside">
        <section
          className="tool-customer-preview quote-form-preview"
          aria-label="Customer form preview"
        >
          <small>Customer preview · Changes appear here as you type</small>
          <h2>{config.label}</h2>
          <p>{config.intro}</p>
          <fieldset
            disabled
            className="public-quote-form"
            aria-label="Preview only, answers are not sent"
          >
            {config.fields.map((field) => (
              <div className="quote-preview-question" key={field.id}>
                <QuoteFieldControl field={field} onFiles={() => {}} />
                {field.helperText && (
                  <small id={`${field.id}-help`}>{field.helperText}</small>
                )}
              </div>
            ))}
            <button type="button">Send request</button>
          </fieldset>
        </section>
      </aside>
    </div>
  );
}
