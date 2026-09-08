"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  FileCheck2,
  FileLock2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import {
  removeTrustEvidenceAction,
  saveTrustAction,
  uploadTrustEvidenceAction,
} from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { SubmitButton } from "@/components/submit-button";
import type { ModuleConfigByType } from "@/lib/domain";
import { trustEntryState, type TrustState } from "@/lib/trust";

type Config = ModuleConfigByType["TRUST"];
type Evidence = {
  id: string;
  entryId: string;
  originalFilename: string;
  sizeBytes: number;
  mediaType: string;
};
const MAX_EVIDENCE_FILES = 6;
const id = () =>
  "trust_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const statusLabels: Record<TrustState, string> = {
  ACTIVE: "Active",
  EXPIRING: "Expires soon",
  EXPIRED: "Expired",
};
function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  const target = index + offset;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
function dateLabel(value?: string) {
  return value ? new Date(value + "T00:00:00").toLocaleDateString() : "";
}

export function TrustEditor({
  businessId,
  config: initial,
  evidence,
}: {
  businessId: string;
  config: Config;
  evidence: Evidence[];
}) {
  const [config, setConfig] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const persistedIds = new Set(initial.entries.map((entry) => entry.id));
  const visibleEntries = config.entries.filter(
    (entry) => trustEntryState(entry.expiresOn) !== "EXPIRED",
  );
  function updateEntry(
    index: number,
    change: Partial<Config["entries"][number]>,
  ) {
    setConfig({
      ...config,
      entries: config.entries.map((entry, i) =>
        i === index ? { ...entry, ...change } : entry,
      ),
    });
  }
  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet">
        <div className="stack-form">
          <div className="section-heading">
            <div>
              <h2>Credentials & reassurance</h2>
              <p>
                Show qualifications, memberships or cover that help customers
                trust your business.
              </p>
            </div>
            <button
              type="button"
              className="secondary"
              disabled={config.entries.length >= 12}
              onClick={() => setAdding(true)}
            >
              <Plus size={18} aria-hidden="true" /> Add credential
            </button>
          </div>
          <label>
            Heading customers see
            <input
              required
              maxLength={60}
              value={config.label}
              onChange={(event) =>
                setConfig({ ...config, label: event.currentTarget.value })
              }
            />
          </label>
          {config.entries.length === 0 && !adding && (
            <div className="empty-state">
              <ShieldCheck size={28} aria-hidden="true" />
              <strong>No credentials yet</strong>
              <p>
                Add insurance, registration, a trade membership or another
                reassurance item.
              </p>
              <button type="button" onClick={() => setAdding(true)}>
                <Plus size={18} aria-hidden="true" /> Add credential
              </button>
            </div>
          )}
          {adding && (
            <div className="focused-form">
              <label>
                Credential or membership name
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={newName}
                  onChange={(event) => setNewName(event.currentTarget.value)}
                  placeholder="e.g. Public liability insurance"
                />
              </label>
              <div className="row-actions">
                <button
                  type="button"
                  disabled={!newName.trim()}
                  onClick={() => {
                    setConfig({
                      ...config,
                      entries: [
                        ...config.entries,
                        { id: id(), name: newName.trim() },
                      ],
                    });
                    setNewName("");
                    setAdding(false);
                  }}
                >
                  Add credential
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setNewName("");
                    setAdding(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <div className="credential-card-list">
            {config.entries.map((entry, index) => {
              const files = evidence.filter(
                (item) => item.entryId === entry.id,
              );
              const state = trustEntryState(entry.expiresOn);
              return (
                <details className="credential-card" key={entry.id}>
                  <summary>
                    <ShieldCheck size={23} aria-hidden="true" />
                    <span>
                      <strong>{entry.name}</strong>
                      <small>
                        {entry.referenceNumber
                          ? "Reference " + entry.referenceNumber + " · "
                          : ""}
                        {entry.expiresOn
                          ? "Expires " + dateLabel(entry.expiresOn)
                          : "No expiry date"}{" "}
                        ·{" "}
                        {files.length
                          ? `${files.length} public file${files.length === 1 ? "" : "s"}`
                          : "No public files"}
                      </small>
                    </span>
                    <span
                      className={
                        "credential-state state-" + state.toLowerCase()
                      }
                    >
                      {statusLabels[state]}
                    </span>
                    <span className="edit-affordance">
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </span>
                  </summary>
                  <div className="focused-form">
                    <label>
                      Credential or membership name
                      <input
                        required
                        maxLength={100}
                        value={entry.name}
                        onChange={(event) =>
                          updateEntry(index, {
                            name: event.currentTarget.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Short description{" "}
                      <span className="optional">Optional</span>
                      <textarea
                        rows={3}
                        maxLength={300}
                        value={entry.description ?? ""}
                        onChange={(event) =>
                          updateEntry(index, {
                            description: event.currentTarget.value || undefined,
                          })
                        }
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Reference number{" "}
                        <span className="optional">Optional</span>
                        <input
                          maxLength={80}
                          value={entry.referenceNumber ?? ""}
                          onChange={(event) =>
                            updateEntry(index, {
                              referenceNumber:
                                event.currentTarget.value || undefined,
                            })
                          }
                        />
                      </label>
                      <label>
                        Expiry date <span className="optional">Optional</span>
                        <input
                          type="date"
                          value={entry.expiresOn ?? ""}
                          onChange={(event) =>
                            updateEntry(index, {
                              expiresOn: event.currentTarget.value || undefined,
                            })
                          }
                        />
                      </label>
                    </div>
                    <section className="private-evidence-card public-evidence-card">
                      <FileLock2 size={23} aria-hidden="true" />
                      <div>
                        <strong>Public credential files</strong>
                        <p>
                          Certificate images and PDFs are visible from your
                          public page.
                        </p>
                      </div>
                      {!persistedIds.has(entry.id) ? (
                        <small>
                          Save this new credential before attaching a file.
                        </small>
                      ) : (
                        <div className="stack-form credential-file-manager">
                          {files.map((file) => (
                            <div className="file-state" key={file.id}>
                              <FileCheck2 size={20} aria-hidden="true" />
                              <span>
                                <strong>{file.originalFilename}</strong>
                                <small>
                                  {Math.ceil(file.sizeBytes / 1024)} KB · Public
                                </small>
                              </span>
                              <a
                                className="button secondary"
                                href={"/trust-evidence/" + file.id}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </a>
                              <form action={removeTrustEvidenceAction}>
                                <input
                                  type="hidden"
                                  name="businessId"
                                  value={businessId}
                                />
                                <input
                                  type="hidden"
                                  name="entryId"
                                  value={entry.id}
                                />
                                <input
                                  type="hidden"
                                  name="evidenceId"
                                  value={file.id}
                                />
                                <SubmitButton
                                  className="secondary danger-text"
                                  pendingLabel="Removing…"
                                >
                                  <Trash2 size={17} aria-hidden="true" /> Remove
                                  file
                                </SubmitButton>
                              </form>
                            </div>
                          ))}
                          {files.length < MAX_EVIDENCE_FILES && (
                            <form
                              action={uploadTrustEvidenceAction}
                              className="stack-form"
                            >
                              <input
                                type="hidden"
                                name="businessId"
                                value={businessId}
                              />
                              <input
                                type="hidden"
                                name="entryId"
                                value={entry.id}
                              />
                              <label>
                                Supporting file{" "}
                                <span className="optional">Optional</span>
                                <input
                                  type="file"
                                  name="evidence"
                                  accept="application/pdf,image/jpeg,image/png"
                                  multiple
                                  required
                                />
                              </label>
                              <SubmitButton
                                className="secondary"
                                pendingLabel="Uploading…"
                              >
                                <Upload size={17} aria-hidden="true" /> Upload
                                files
                              </SubmitButton>
                              <small>
                                Up to {MAX_EVIDENCE_FILES} public PDF, JPG or
                                PNG files; maximum 5 MB each.
                              </small>
                            </form>
                          )}
                        </div>
                      )}
                    </section>
                    <div className="question-secondary-actions">
                      <span className="reorder-buttons">
                        <button
                          type="button"
                          className="icon secondary"
                          aria-label={"Move " + entry.name + " up"}
                          disabled={index === 0}
                          onClick={() =>
                            setConfig({
                              ...config,
                              entries: move(config.entries, index, -1),
                            })
                          }
                        >
                          <ArrowUp size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="icon secondary"
                          aria-label={"Move " + entry.name + " down"}
                          disabled={index === config.entries.length - 1}
                          onClick={() =>
                            setConfig({
                              ...config,
                              entries: move(config.entries, index, 1),
                            })
                          }
                        >
                          <ArrowDown size={18} aria-hidden="true" />
                        </button>
                      </span>
                      <button
                        type="button"
                        className="secondary danger-text"
                        onClick={() =>
                          setConfig({
                            ...config,
                            entries: config.entries.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                      >
                        Remove credential
                      </button>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
          <EditorActionForm
            action={saveTrustAction}
            className="credential-save-form"
          >
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="config" value={JSON.stringify(config)} />
            <div className="editor-save-bar">
              <SubmitButton>Save changes</SubmitButton>
              <small>Attached files are public on your customer page.</small>
            </div>
          </EditorActionForm>
        </div>
      </div>
      <aside className="tool-editor-aside">
        <section className="tool-customer-preview credential-preview">
          <small>What customers see</small>
          <h2>{config.label}</h2>
          {visibleEntries.length === 0 ? (
            <div className="empty-state">
              <ShieldCheck size={27} aria-hidden="true" />
              <strong>No active credentials to show</strong>
              <p>Add an active credential or update an expired one.</p>
            </div>
          ) : (
            <ul>
              {visibleEntries.map((entry) => (
                <li key={entry.id}>
                  <ShieldCheck size={21} aria-hidden="true" />
                  <span>
                    <strong>{entry.name}</strong>
                    {entry.description && <span>{entry.description}</span>}
                    {entry.referenceNumber && (
                      <small>Reference: {entry.referenceNumber}</small>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="trust-disclaimer">
            Information provided by this business.
          </p>
        </section>
      </aside>
    </div>
  );
}
