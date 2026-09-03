"use client";

import { useState } from "react";
import {
  removeTrustEvidenceAction,
  saveTrustAction,
  uploadTrustEvidenceAction,
} from "@/app/actions";
import type { ModuleConfigByType } from "@/lib/domain";
import { trustEntryState } from "@/lib/trust";
import { SubmitButton } from "./submit-button";

type Config = ModuleConfigByType["TRUST"];
type Evidence = {
  id: string;
  entryId: string;
  originalFilename: string;
  sizeBytes: number;
};
const id = () =>
  `trust_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
const move = <T,>(items: T[], index: number, offset: number) => {
  const next = [...items];
  const target = index + offset;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

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
  return (
    <details className="purpose-editor">
      <summary>Configure credentials</summary>
      <div className="editor-sheet stack-form">
        <header>
          <div>
            <span className="eyebrow">Credentials</span>
            <h3>Build customer confidence</h3>
            <p>Add each credential and its private evidence together.</p>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => setAdding(true)}
          >
            + Add credential
          </button>
        </header>
        <form id="credentials-config" action={saveTrustAction}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="config" value={JSON.stringify(config)} />
        </form>
        <label>
          Public heading
          <input
            value={config.label}
            onChange={(e) =>
              setConfig({ ...config, label: e.currentTarget.value })
            }
          />
        </label>
        {config.entries.length === 0 && !adding && (
          <div className="empty-state">
            <strong>No credentials yet</strong>
            <span>Add insurance, registration, or another credential.</span>
            <button type="button" onClick={() => setAdding(true)}>
              Add credential
            </button>
          </div>
        )}
        {adding && (
          <div className="focused-form">
            <label>
              Credential name
              <input
                autoFocus
                id="new-credential-name"
                placeholder="e.g. Public liability insurance"
              />
            </label>
            <div className="row-actions">
              <button
                type="button"
                onClick={() => {
                  const input = document.querySelector<HTMLInputElement>(
                    "#new-credential-name",
                  );
                  const name = input?.value.trim();
                  if (!name) return input?.focus();
                  setConfig({
                    ...config,
                    entries: [...config.entries, { id: id(), name }],
                  });
                  setAdding(false);
                }}
              >
                Add credential
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setAdding(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <div className="object-list">
          {config.entries.map((entry, index) => {
            const file = evidence.find((item) => item.entryId === entry.id);
            return (
              <details className="object-card" key={entry.id}>
                <summary>
                  <span>
                    <strong>{entry.name}</strong>
                    <small>
                      {entry.expiresOn
                        ? `Expires ${new Date(`${entry.expiresOn}T00:00:00`).toLocaleDateString()}`
                        : "No expiry date"}{" "}
                      · {file ? "Evidence attached" : "No evidence"}
                    </small>
                  </span>
                  <span>Edit →</span>
                </summary>
                <div className="focused-form">
                  <label>
                    Credential name
                    <input
                      value={entry.name}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          entries: config.entries.map((item, i) =>
                            i === index
                              ? { ...item, name: e.currentTarget.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <label>
                    Description <span className="optional">Optional</span>
                    <textarea
                      rows={2}
                      value={entry.description ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          entries: config.entries.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  description:
                                    e.currentTarget.value || undefined,
                                }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Reference number{" "}
                      <span className="optional">Optional</span>
                      <input
                        value={entry.referenceNumber ?? ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            entries: config.entries.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    referenceNumber:
                                      e.currentTarget.value || undefined,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Expiry date <span className="optional">Optional</span>
                      <input
                        type="date"
                        value={entry.expiresOn ?? ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            entries: config.entries.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    expiresOn:
                                      e.currentTarget.value || undefined,
                                  }
                                : item,
                            ),
                          })
                        }
                      />
                    </label>
                  </div>
                  {entry.expiresOn && (
                    <span
                      className={`badge ${trustEntryState(entry.expiresOn).toLowerCase()}`}
                    >
                      {trustEntryState(entry.expiresOn).toLowerCase()}
                    </span>
                  )}
                  <section className="evidence-card">
                    <div>
                      <strong>Private evidence</strong>
                      <p>
                        Supporting files stay owner-only and are never shown on
                        the public page.
                      </p>
                    </div>
                    {file ? (
                      <>
                        <div className="file-state">
                          <span aria-hidden="true">▤</span>
                          <div>
                            <strong>{file.originalFilename}</strong>
                            <small>{Math.ceil(file.sizeBytes / 1024)} KB</small>
                          </div>
                        </div>
                        <div className="row-actions">
                          <a
                            className="button secondary"
                            href={`/dashboard/trust-evidence/${file.id}`}
                          >
                            Download
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
                            <SubmitButton
                              className="secondary danger-text"
                              pendingLabel="Removing…"
                            >
                              Remove file
                            </SubmitButton>
                          </form>
                        </div>
                      </>
                    ) : (
                      <form
                        action={uploadTrustEvidenceAction}
                        className="stack-form"
                      >
                        <input
                          type="hidden"
                          name="businessId"
                          value={businessId}
                        />
                        <input type="hidden" name="entryId" value={entry.id} />
                        <input
                          type="file"
                          name="evidence"
                          accept="application/pdf,image/jpeg,image/png"
                          required
                        />
                        <SubmitButton pendingLabel="Uploading…">
                          Upload evidence
                        </SubmitButton>
                        <small>Private PDF, JPG or PNG; maximum 5 MB.</small>
                      </form>
                    )}
                  </section>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon secondary"
                      aria-label={`Move ${entry.name} up`}
                      disabled={index === 0}
                      onClick={() =>
                        setConfig({
                          ...config,
                          entries: move(config.entries, index, -1),
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon secondary"
                      aria-label={`Move ${entry.name} down`}
                      disabled={index === config.entries.length - 1}
                      onClick={() =>
                        setConfig({
                          ...config,
                          entries: move(config.entries, index, 1),
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="secondary danger-text"
                      onClick={() =>
                        setConfig({
                          ...config,
                          entries: config.entries.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Delete credential
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <button type="submit" form="credentials-config">
          Save credentials
        </button>
      </div>
    </details>
  );
}
