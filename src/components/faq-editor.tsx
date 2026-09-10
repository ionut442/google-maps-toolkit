import {
  addFaqAction,
  deleteFaqAction,
  moveFaqAction,
  saveFaqListAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { EditorActionForm } from "@/components/editor-action-form";
import { ArrowUp, ArrowDown, Pencil, Plus, CircleHelp } from "lucide-react";
import { MAX_FAQS, type ModuleConfigByType } from "@/lib/domain";

export function FaqEditor({
  businessId,
  config,
}: {
  businessId: string;
  config: ModuleConfigByType["FAQ"];
}) {
  const formId = `faq-list-${businessId}`;
  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet stack-form">
        <header>
          <div>
            <span className="eyebrow">FAQ</span>
            <h3>Questions customers often ask</h3>
            <p>
              Add questions one at a time. Customers open only the answers they
              need.
            </p>
          </div>
        </header>
        {config.suggestedFaqs.length === 0 && (
          <div className="empty-state">
            <CircleHelp size={24} aria-hidden="true" />
            <strong>No questions yet</strong>
            <span>Add the first question customers often ask.</span>
          </div>
        )}
        <div className="object-list">
          {config.suggestedFaqs.map((faq, index) => (
            <details className="object-card" key={`${index}-${faq.question}`}>
              <summary>
                <span>
                  <strong>{faq.question}</strong>
                  <small>
                    {faq.answer.slice(0, 84)}
                    {faq.answer.length > 84 ? "…" : ""}
                  </small>
                </span>
                <span className="edit-affordance">
                  <Pencil size={15} aria-hidden="true" /> Edit
                </span>
              </summary>
              <div className="focused-form">
                <label>
                  Question
                  <input
                    form={formId}
                    name="question"
                    defaultValue={faq.question}
                    required
                    maxLength={160}
                  />
                </label>
                <label>
                  Answer
                  <textarea
                    form={formId}
                    name="answer"
                    defaultValue={faq.answer}
                    required
                    maxLength={500}
                    rows={4}
                  />
                </label>
                <div className="row-actions">
                  <form action={moveFaqAction}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="index" value={index} />
                    <SubmitButton
                      className="icon secondary"
                      name="direction"
                      value="up"
                      disabled={index === 0}
                      aria-label={`Move ${faq.question} up`}
                      pendingLabel="…"
                    >
                      <ArrowUp size={18} aria-hidden="true" />
                    </SubmitButton>
                    <SubmitButton
                      className="icon secondary"
                      name="direction"
                      value="down"
                      disabled={index === config.suggestedFaqs.length - 1}
                      aria-label={`Move ${faq.question} down`}
                      pendingLabel="…"
                    >
                      <ArrowDown size={18} aria-hidden="true" />
                    </SubmitButton>
                  </form>
                  <form action={deleteFaqAction}>
                    <input type="hidden" name="businessId" value={businessId} />
                    <input type="hidden" name="index" value={index} />
                    <SubmitButton
                      className="secondary danger-text"
                      pendingLabel="Deleting…"
                    >
                      Delete question
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </details>
          ))}
        </div>
        {config.suggestedFaqs.length < MAX_FAQS && (
          <details className="add-object">
            <summary>
              <Plus size={18} aria-hidden="true" /> Add question
            </summary>
            <EditorActionForm
              action={addFaqAction}
              className="focused-form stack-form"
              savedMessage="Question added"
            >
              <input type="hidden" name="businessId" value={businessId} />
              <label>
                Question
                <input name="question" required maxLength={160} autoFocus />
              </label>
              <label>
                Answer
                <textarea name="answer" required maxLength={500} rows={4} />
              </label>
              <SubmitButton pendingLabel="Adding…">Add question</SubmitButton>
            </EditorActionForm>
          </details>
        )}
        <small>
          {config.suggestedFaqs.length} of {MAX_FAQS} questions
        </small>
        <EditorActionForm
          action={saveFaqListAction}
          id={formId}
          savedMessage="FAQ saved"
        >
          <input type="hidden" name="businessId" value={businessId} />
          <SubmitButton>Save changes</SubmitButton>
        </EditorActionForm>
      </div>
      <aside className="tool-editor-aside">
        <section className="tool-customer-preview faq-customer-preview">
          <small>What customers see</small>
          <h2>Questions customers often ask</h2>
          {config.suggestedFaqs.length === 0 ? (
            <p>Your questions and answers will appear here.</p>
          ) : (
            <div className="public-faq-list">
              {config.suggestedFaqs.map((faq, index) => (
                <details key={`${index}-${faq.question}`}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
