"use client";

import { useState } from "react";
import { savePricingAction } from "@/app/actions";
import type { ModuleConfigByType } from "@/lib/domain";
import { currencies, formatMoney } from "@/lib/pricing";
import { SubmitButton } from "./submit-button";

type Config = ModuleConfigByType["PRICING"];
const id = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
const move = <T,>(items: T[], index: number, offset: number) => {
  const next = [...items];
  const target = index + offset;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};
const minor = (value: string) =>
  Math.max(0, Math.round(Number(value || 0) * 100));

export function PricingEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: Config;
}) {
  const [config, setConfig] = useState(initial);
  const [addingCategory, setAddingCategory] = useState(false);

  function changeMode(mode: Config["mode"]) {
    if (mode === "HOURLY")
      setConfig({
        mode,
        label: "Hourly rate",
        currency: config.currency,
        amountMinor: 0,
      });
    else if (mode === "PRICE_LIST")
      setConfig({
        mode,
        label: "Pricing",
        currency: config.currency,
        categories: [],
      });
    else
      setConfig({
        mode,
        label: "Simple estimate",
        currency: config.currency,
        base: { label: "Starting price", amountMinor: 0 },
        addOns: [],
      });
  }

  return (
    <details className="purpose-editor">
      <summary>Configure pricing</summary>
      <form action={savePricingAction} className="editor-sheet stack-form">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="config" value={JSON.stringify(config)} />
        <header>
          <div>
            <span className="eyebrow">Pricing</span>
            <h3>How do you show prices?</h3>
          </div>
          <label>
            Currency
            <select
              value={config.currency}
              onChange={(e) =>
                setConfig({
                  ...config,
                  currency: e.currentTarget.value as Config["currency"],
                })
              }
            >
              {currencies.map((currency) => (
                <option key={currency}>{currency}</option>
              ))}
            </select>
          </label>
        </header>
        <div
          className="segmented-control"
          role="radiogroup"
          aria-label="Pricing type"
        >
          {[
            { value: "HOURLY", label: "Hourly rate" },
            { value: "PRICE_LIST", label: "Price list" },
            { value: "SIMPLE_ESTIMATE", label: "Simple estimator" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={config.mode === option.value}
              className={
                config.mode === option.value ? "selected" : "secondary"
              }
              onClick={() => changeMode(option.value as Config["mode"])}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label>
          Public heading
          <input
            value={config.label}
            maxLength={60}
            onChange={(e) =>
              setConfig({ ...config, label: e.currentTarget.value })
            }
          />
        </label>

        {config.mode === "HOURLY" && (
          <div className="focused-form">
            <label>
              Hourly amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={(config.amountMinor / 100).toFixed(2)}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    amountMinor: minor(e.currentTarget.value),
                  })
                }
              />
            </label>
            <label>
              Short note <span className="optional">Optional</span>
              <input
                value={config.note ?? ""}
                maxLength={160}
                placeholder="Materials quoted separately"
                onChange={(e) =>
                  setConfig({
                    ...config,
                    note: e.currentTarget.value || undefined,
                  })
                }
              />
            </label>
            <div className="customer-preview">
              <span>Customer preview</span>
              <strong>
                {formatMoney(config.amountMinor, config.currency)}{" "}
                <small>/ hour</small>
              </strong>
              {config.note && <p>{config.note}</p>}
            </div>
          </div>
        )}

        {config.mode === "PRICE_LIST" && (
          <section className="object-list">
            <div className="object-list-heading">
              <div>
                <h4>Price list</h4>
                <p>Add a category, then its services.</p>
              </div>
              <button
                type="button"
                className="secondary"
                onClick={() => setAddingCategory(true)}
              >
                + Add category
              </button>
            </div>
            {config.categories.length === 0 && !addingCategory && (
              <div className="empty-state">
                <strong>No prices yet</strong>
                <span>Add your first category to get started.</span>
                <button type="button" onClick={() => setAddingCategory(true)}>
                  Add your first category
                </button>
              </div>
            )}
            {addingCategory && (
              <div className="focused-form">
                <label>
                  Category name
                  <input
                    autoFocus
                    id="new-category-name"
                    placeholder="e.g. Drain cleaning"
                  />
                </label>
                <div className="row-actions">
                  <button
                    type="button"
                    onClick={() => {
                      const input =
                        document.querySelector<HTMLInputElement>(
                          "#new-category-name",
                        );
                      const name = input?.value.trim();
                      if (!name) return input?.focus();
                      setConfig({
                        ...config,
                        categories: [
                          ...config.categories,
                          { id: id("category"), name, items: [] },
                        ],
                      });
                      setAddingCategory(false);
                    }}
                  >
                    Add category
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setAddingCategory(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {config.categories.map((category, categoryIndex) => (
              <details className="object-card" key={category.id}>
                <summary>
                  <span>
                    <strong>{category.name}</strong>
                    <small>
                      {category.items.length}{" "}
                      {category.items.length === 1 ? "service" : "services"}
                    </small>
                  </span>
                  <span>Edit →</span>
                </summary>
                <div className="focused-form">
                  <label>
                    Category name
                    <input
                      value={category.name}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          categories: config.categories.map((item, index) =>
                            index === categoryIndex
                              ? { ...item, name: e.currentTarget.value }
                              : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="price-rows">
                    {category.items.map((item, itemIndex) => (
                      <div className="price-row" key={item.id}>
                        <input
                          aria-label="Service name"
                          value={item.name}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              categories: config.categories.map((cat, index) =>
                                index === categoryIndex
                                  ? {
                                      ...cat,
                                      items: cat.items.map(
                                        (price, priceIndex) =>
                                          priceIndex === itemIndex
                                            ? {
                                                ...price,
                                                name: e.currentTarget.value,
                                              }
                                            : price,
                                      ),
                                    }
                                  : cat,
                              ),
                            })
                          }
                        />
                        <span>{config.currency}</span>
                        <input
                          aria-label="Price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={(item.amountMinor / 100).toFixed(2)}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              categories: config.categories.map((cat, index) =>
                                index === categoryIndex
                                  ? {
                                      ...cat,
                                      items: cat.items.map(
                                        (price, priceIndex) =>
                                          priceIndex === itemIndex
                                            ? {
                                                ...price,
                                                amountMinor: minor(
                                                  e.currentTarget.value,
                                                ),
                                              }
                                            : price,
                                      ),
                                    }
                                  : cat,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="icon secondary"
                          aria-label={`Move ${item.name} up`}
                          disabled={itemIndex === 0}
                          onClick={() =>
                            setConfig({
                              ...config,
                              categories: config.categories.map((cat, index) =>
                                index === categoryIndex
                                  ? {
                                      ...cat,
                                      items: move(cat.items, itemIndex, -1),
                                    }
                                  : cat,
                              ),
                            })
                          }
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="icon secondary"
                          aria-label={`Move ${item.name} down`}
                          disabled={itemIndex === category.items.length - 1}
                          onClick={() =>
                            setConfig({
                              ...config,
                              categories: config.categories.map((cat, index) =>
                                index === categoryIndex
                                  ? {
                                      ...cat,
                                      items: move(cat.items, itemIndex, 1),
                                    }
                                  : cat,
                              ),
                            })
                          }
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className="text-button danger-text"
                          onClick={() =>
                            setConfig({
                              ...config,
                              categories: config.categories.map((cat, index) =>
                                index === categoryIndex
                                  ? {
                                      ...cat,
                                      items: cat.items.filter(
                                        (_, i) => i !== itemIndex,
                                      ),
                                    }
                                  : cat,
                              ),
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      setConfig({
                        ...config,
                        categories: config.categories.map((cat, index) =>
                          index === categoryIndex
                            ? {
                                ...cat,
                                items: [
                                  ...cat.items,
                                  {
                                    id: id("price"),
                                    name: "New service",
                                    amountMinor: 0,
                                    pricePrefix: "FIXED",
                                  },
                                ],
                              }
                            : cat,
                        ),
                      })
                    }
                  >
                    + Add price
                  </button>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="icon secondary"
                      aria-label={`Move ${category.name} up`}
                      disabled={categoryIndex === 0}
                      onClick={() =>
                        setConfig({
                          ...config,
                          categories: move(
                            config.categories,
                            categoryIndex,
                            -1,
                          ),
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="icon secondary"
                      aria-label={`Move ${category.name} down`}
                      disabled={categoryIndex === config.categories.length - 1}
                      onClick={() =>
                        setConfig({
                          ...config,
                          categories: move(config.categories, categoryIndex, 1),
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
                          categories: config.categories.filter(
                            (_, index) => index !== categoryIndex,
                          ),
                        })
                      }
                    >
                      Delete category
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </section>
        )}

        {config.mode === "SIMPLE_ESTIMATE" && (
          <EstimatorEditor config={config} setConfig={setConfig} />
        )}
        <SubmitButton pendingLabel="Saving…">Save pricing</SubmitButton>
      </form>
    </details>
  );
}

function EstimatorEditor({
  config,
  setConfig,
}: {
  config: Extract<Config, { mode: "SIMPLE_ESTIMATE" }>;
  setConfig: (config: Config) => void;
}) {
  return (
    <section className="focused-form estimator-builder">
      <div>
        <h4>Starting price</h4>
        <p>The amount every estimate begins with.</p>
      </div>
      <div className="price-row">
        <input
          aria-label="Starting price label"
          value={config.base.label}
          onChange={(e) =>
            setConfig({
              ...config,
              base: { ...config.base, label: e.currentTarget.value },
            })
          }
        />
        <span>{config.currency}</span>
        <input
          aria-label="Starting price amount"
          type="number"
          min="0"
          step="0.01"
          value={(config.base.amountMinor / 100).toFixed(2)}
          onChange={(e) =>
            setConfig({
              ...config,
              base: {
                ...config.base,
                amountMinor: minor(e.currentTarget.value),
              },
            })
          }
        />
      </div>
      <div>
        <h4>Choices customers can add</h4>
        <p>Each choice clearly shows how it changes the estimate.</p>
      </div>
      {config.addOns.map((choice, index) => (
        <div className="price-row" key={choice.id}>
          <input
            aria-label="Choice"
            value={choice.label}
            onChange={(e) =>
              setConfig({
                ...config,
                addOns: config.addOns.map((item, i) =>
                  i === index
                    ? { ...item, label: e.currentTarget.value }
                    : item,
                ),
              })
            }
          />
          <span>+</span>
          <input
            aria-label="Amount added"
            type="number"
            min="0"
            step="0.01"
            value={(choice.amountMinor / 100).toFixed(2)}
            onChange={(e) =>
              setConfig({
                ...config,
                addOns: config.addOns.map((item, i) =>
                  i === index
                    ? { ...item, amountMinor: minor(e.currentTarget.value) }
                    : item,
                ),
              })
            }
          />
          <button
            type="button"
            className="icon secondary"
            aria-label={`Move ${choice.label} up`}
            disabled={index === 0}
            onClick={() =>
              setConfig({ ...config, addOns: move(config.addOns, index, -1) })
            }
          >
            ↑
          </button>
          <button
            type="button"
            className="icon secondary"
            aria-label={`Move ${choice.label} down`}
            disabled={index === config.addOns.length - 1}
            onClick={() =>
              setConfig({ ...config, addOns: move(config.addOns, index, 1) })
            }
          >
            ↓
          </button>
          <button
            type="button"
            className="text-button danger-text"
            onClick={() =>
              setConfig({
                ...config,
                addOns: config.addOns.filter((_, i) => i !== index),
              })
            }
          >
            Delete
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        onClick={() =>
          setConfig({
            ...config,
            addOns: [
              ...config.addOns,
              { id: id("choice"), label: "New choice", amountMinor: 0 },
            ],
          })
        }
      >
        + Add choice
      </button>
      <div className="customer-preview">
        <span>Customer preview</span>
        <strong>
          {config.base.label}:{" "}
          {formatMoney(config.base.amountMinor, config.currency)}
        </strong>
        {config.addOns.map((choice) => (
          <div key={choice.id}>
            {choice.label}
            <b>+{formatMoney(choice.amountMinor, config.currency)}</b>
          </div>
        ))}
      </div>
    </section>
  );
}
