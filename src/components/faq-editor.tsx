import {
  addFaqAction,
  deleteFaqAction,
  moveFaqAction,
  updateFaqAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { MAX_FAQS, type ModuleConfigByType } from "@/lib/domain";

export function FaqEditor({
  businessId,
  config,
}: {
  businessId: string;
  config: ModuleConfigByType["FAQ"];
}) {
  return (
    <details className="purpose-editor">
      <summary>Configure questions</summary>
      <div className="editor-sheet stack-form">
        <header>
          <div>
            <span className="eyebrow">FAQ</span>
            <h3>Answer common questions</h3>
            <p>
              Add questions one at a time. Customers open only the answers they
              need.
            </p>
          </div>
        </header>
        {config.suggestedFaqs.length === 0 && (
          <div className="empty-state">
            <strong>No FAQs yet</strong>
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
                <span>Edit →</span>
              </summary>
              <div className="focused-form">
                <form action={updateFaqAction} className="stack-form">
                  <input type="hidden" name="businessId" value={businessId} />
                  <input type="hidden" name="index" value={index} />
                  <label>
                    Question
                    <input
                      name="question"
                      defaultValue={faq.question}
                      required
                      maxLength={160}
                    />
                  </label>
                  <label>
                    Answer
                    <textarea
                      name="answer"
                      defaultValue={faq.answer}
                      required
                      maxLength={500}
                      rows={4}
                    />
                  </label>
                  <SubmitButton pendingLabel="Saving…">
                    Save question
                  </SubmitButton>
                </form>
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
                      ↑
                    </SubmitButton>
                    <SubmitButton
                      className="icon secondary"
                      name="direction"
                      value="down"
                      disabled={index === config.suggestedFaqs.length - 1}
                      aria-label={`Move ${faq.question} down`}
                      pendingLabel="…"
                    >
                      ↓
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
            <summary>+ Add question</summary>
            <form action={addFaqAction} className="focused-form stack-form">
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
            </form>
          </details>
        )}
        <small>
          {config.suggestedFaqs.length} of {MAX_FAQS} questions
        </small>
      </div>
    </details>
  );
}
