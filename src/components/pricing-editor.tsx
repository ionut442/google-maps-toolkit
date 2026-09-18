"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BadgeDollarSign,
  Calculator,
  Clock3,
  List,
  Pencil,
  Plus,
} from "lucide-react";
import { savePricingAction } from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { PricingEstimator } from "@/components/public/pricing-estimator";
import { SubmitButton } from "@/components/submit-button";
import {
  currencies,
  currencyLabels,
  formatMoney,
  pricingConfigSchema,
  type PricingConfig,
} from "@/lib/pricing";

type Config = PricingConfig;
type PriceList = Extract<Config, { mode: "PRICE_LIST" }>;
type Estimate = Extract<Config, { mode: "SIMPLE_ESTIMATE" }>;
type Price = PriceList["categories"][number]["items"][number];
const id = (prefix: string) =>
  prefix + "_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
const minor = (value: string) =>
  Math.max(0, Math.round(Number(value || 0) * 100));

function move<T>(items: T[], index: number, offset: number) {
  const next = [...items];
  const target = index + offset;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function MoneyInput({
  label,
  value,
  currency,
  onChange,
  large = false,
}: {
  label: string;
  value: number;
  currency: Config["currency"];
  onChange: (value: number) => void;
  large?: boolean;
}) {
  return (
    <label>
      {label}
      <span className={large ? "money-input money-input-large" : "money-input"}>
        <span aria-hidden="true">{currency}</span>
        <input
          aria-label={label + " in " + currency}
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          required
          defaultValue={(value / 100).toFixed(2)}
          onChange={(event) => onChange(minor(event.currentTarget.value))}
        />
      </span>
    </label>
  );
}

function ReorderButtons({
  label,
  index,
  count,
  onMove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (offset: number) => void;
}) {
  return (
    <span className="reorder-buttons">
      <button
        type="button"
        className="icon secondary"
        aria-label={"Move " + label + " up"}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon secondary"
        aria-label={"Move " + label + " down"}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={18} aria-hidden="true" />
      </button>
    </span>
  );
}

export function PricingEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: Config;
}) {
  const [config, setConfig] = useState(initial);
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
  const validPreview = pricingConfigSchema.safeParse(config);
  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet">
        <EditorActionForm action={savePricingAction}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="config" value={JSON.stringify(config)} />
          <header>
            <h2>How do you normally charge?</h2>
            <label>
              Currency
              <select
                value={config.currency}
                onChange={(event) =>
                  setConfig({
                    ...config,
                    currency: event.currentTarget.value as Config["currency"],
                  })
                }
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currencyLabels[currency]} ({currency})
                  </option>
                ))}
              </select>
            </label>
          </header>
          <div
            className="pricing-mode-grid"
            role="radiogroup"
            aria-label="How do you normally charge?"
          >
            {[
              {
                value: "HOURLY",
                label: "Hourly rate",
                example: formatMoney(8000, config.currency) + " / hour",
                copy: "Best if most jobs are charged by time.",
                icon: Clock3,
              },
              {
                value: "PRICE_LIST",
                label: "Price list",
                example:
                  "Boiler service — " + formatMoney(12000, config.currency),
                copy: "Set prices for common jobs.",
                icon: List,
              },
              {
                value: "SIMPLE_ESTIMATE",
                label: "Simple estimate",
                example:
                  "From " + formatMoney(8000, config.currency) + " + extras",
                copy: "Customers build a rough estimate.",
                icon: Calculator,
              },
            ].map((option) => (
              <label
                className={
                  "pricing-mode-choice " +
                  (config.mode === option.value ? "selected" : "")
                }
                key={option.value}
              >
                <input
                  type="radio"
                  name="pricing-mode-choice"
                  value={option.value}
                  checked={config.mode === option.value}
                  onChange={() => changeMode(option.value as Config["mode"])}
                />
                <option.icon size={24} aria-hidden="true" />
                <strong>{option.label}</strong>
                <span>{option.example}</span>
                <small>{option.copy}</small>
              </label>
            ))}
          </div>
          <label>
            Heading customers see
            <input
              value={config.label}
              required
              maxLength={60}
              onChange={(event) =>
                setConfig({ ...config, label: event.currentTarget.value })
              }
            />
          </label>
          {config.mode === "HOURLY" && (
            <section className="stack-form" key="hourly">
              <MoneyInput
                label="Your hourly rate"
                large
                value={config.amountMinor}
                currency={config.currency}
                onChange={(amountMinor) =>
                  setConfig({ ...config, amountMinor })
                }
              />
              <small>Per hour of work.</small>
              <label>
                Short note <span className="optional">Optional</span>
                <input
                  value={config.note ?? ""}
                  maxLength={160}
                  placeholder="Materials quoted separately"
                  onChange={(event) =>
                    setConfig({
                      ...config,
                      note: event.currentTarget.value || undefined,
                    })
                  }
                />
              </label>
            </section>
          )}
          {config.mode === "PRICE_LIST" && (
            <PriceListEditor config={config} onChange={setConfig} />
          )}
          {config.mode === "SIMPLE_ESTIMATE" && (
            <EstimateEditor config={config} onChange={setConfig} />
          )}
          <div className="editor-save-bar">
            <SubmitButton>Save changes</SubmitButton>
            <small>Changes reach your page when you save.</small>
          </div>
        </EditorActionForm>
      </div>
      <aside className="tool-editor-aside">
        <section className="tool-customer-preview pricing-customer-preview">
          <small>What customers see</small>
          <h2>{config.label}</h2>
          {!validPreview.success ? (
            <p>Complete your price details to see the preview.</p>
          ) : config.mode === "HOURLY" ? (
            <>
              <p className="hourly-preview-amount">
                {formatMoney(config.amountMinor, config.currency)}{" "}
                <small>/ hour</small>
              </p>
              {config.note && <p>{config.note}</p>}
            </>
          ) : config.mode === "PRICE_LIST" ? (
            <div className="price-sheet-preview">
              {config.categories.length === 0 && (
                <p>Your prices will appear here.</p>
              )}
              {config.categories.map((category) => (
                <section key={category.id}>
                  {(config.categories.length > 1 ||
                    category.name !== "Services") && <h3>{category.name}</h3>}
                  {category.items.map((item) => (
                    <div className="price-sheet-preview-row" key={item.id}>
                      <span>
                        <strong>{item.name}</strong>
                        {item.description && <small>{item.description}</small>}
                      </span>
                      <strong>
                        {item.pricePrefix === "FROM" ? "From " : ""}
                        {formatMoney(item.amountMinor, config.currency)}
                      </strong>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          ) : (
            <PricingEstimator key={JSON.stringify(config)} config={config} />
          )}
        </section>
      </aside>
    </div>
  );
}

function PriceListEditor({
  config,
  onChange,
}: {
  config: PriceList;
  onChange: (config: PriceList) => void;
}) {
  const [organising, setOrganising] = useState(
    config.categories.length > 1 ||
      (config.categories.length === 1 &&
        config.categories[0].name !== "Services"),
  );
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [openPrice, setOpenPrice] = useState<string | null>(null);
  const showCategories =
    organising ||
    config.categories.length > 1 ||
    (config.categories.length === 1 &&
      config.categories[0].name !== "Services");
  function updateCategory(
    index: number,
    patch: Partial<PriceList["categories"][number]>,
  ) {
    onChange({
      ...config,
      categories: config.categories.map((category, i) =>
        i === index ? { ...category, ...patch } : category,
      ),
    });
  }
  function addPrice(categoryIndex = 0) {
    const price: Price = {
      id: id("price"),
      name: "New service",
      amountMinor: 0,
      pricePrefix: "FIXED",
    };
    if (config.categories.length === 0)
      onChange({
        ...config,
        categories: [{ id: id("category"), name: "Services", items: [price] }],
      });
    else
      updateCategory(categoryIndex, {
        items: [...config.categories[categoryIndex].items, price],
      });
    setOpenPrice(price.id);
  }
  return (
    <section className="stack-form">
      <div className="section-heading">
        <div>
          <h2>Your prices</h2>
          <p>Give customers an idea of what common jobs cost.</p>
        </div>
      </div>
      {config.categories.length === 0 && (
        <div className="empty-state">
          <BadgeDollarSign size={28} aria-hidden="true" />
          <strong>No prices yet</strong>
          <p>Add your first price so customers know what to expect.</p>
          <button type="button" onClick={() => addPrice()}>
            <Plus size={18} aria-hidden="true" /> Add a price
          </button>
        </div>
      )}
      {config.categories.map((category, categoryIndex) => (
        <section className="price-sheet-group stack-form" key={category.id}>
          {showCategories && (
            <div className="category-heading">
              <label>
                Category name
                <input
                  value={category.name}
                  required
                  maxLength={80}
                  onChange={(event) =>
                    updateCategory(categoryIndex, {
                      name: event.currentTarget.value,
                    })
                  }
                />
              </label>
              <details className="category-options">
                <summary>Category options</summary>
                <div className="stack-form">
                  <ReorderButtons
                    label={category.name}
                    index={categoryIndex}
                    count={config.categories.length}
                    onMove={(offset) =>
                      onChange({
                        ...config,
                        categories: move(
                          config.categories,
                          categoryIndex,
                          offset,
                        ),
                      })
                    }
                  />
                  <button
                    className="secondary danger-text"
                    type="button"
                    onClick={() =>
                      onChange({
                        ...config,
                        categories: config.categories.filter(
                          (_, i) => i !== categoryIndex,
                        ),
                      })
                    }
                  >
                    Remove category and its prices
                  </button>
                </div>
              </details>
            </div>
          )}
          <div className="price-sheet-list">
            {category.items.map((item, index) => (
              <details
                className="price-sheet-item"
                key={item.id}
                open={openPrice === item.id}
                onToggle={(event) => {
                  if (event.currentTarget.open) setOpenPrice(item.id);
                  else if (openPrice === item.id) setOpenPrice(null);
                }}
              >
                <summary>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {item.pricePrefix === "FROM"
                        ? "Starting from"
                        : "Fixed price"}
                    </small>
                  </span>
                  <strong>
                    {formatMoney(item.amountMinor, config.currency)}
                  </strong>
                  <span className="edit-affordance">
                    <Pencil size={15} aria-hidden="true" /> Edit
                  </span>
                </summary>
                <div className="focused-form">
                  <label>
                    Service name
                    <input
                      required
                      maxLength={80}
                      value={item.name}
                      onChange={(event) =>
                        updateCategory(categoryIndex, {
                          items: category.items.map((price, i) =>
                            i === index
                              ? { ...price, name: event.currentTarget.value }
                              : price,
                          ),
                        })
                      }
                    />
                  </label>
                  <MoneyInput
                    label="Price"
                    value={item.amountMinor}
                    currency={config.currency}
                    onChange={(amountMinor) =>
                      updateCategory(categoryIndex, {
                        items: category.items.map((price, i) =>
                          i === index ? { ...price, amountMinor } : price,
                        ),
                      })
                    }
                  />
                  <label className="quote-option">
                    <input
                      type="checkbox"
                      checked={item.pricePrefix === "FROM"}
                      onChange={(event) =>
                        updateCategory(categoryIndex, {
                          items: category.items.map((price, i) =>
                            i === index
                              ? {
                                  ...price,
                                  pricePrefix: event.currentTarget.checked
                                    ? "FROM"
                                    : "FIXED",
                                }
                              : price,
                          ),
                        })
                      }
                    />
                    <span>Starting from this price</span>
                  </label>
                  <label>
                    Description <span className="optional">Optional</span>
                    <textarea
                      rows={2}
                      maxLength={240}
                      value={item.description ?? ""}
                      onChange={(event) =>
                        updateCategory(categoryIndex, {
                          items: category.items.map((price, i) =>
                            i === index
                              ? {
                                  ...price,
                                  description:
                                    event.currentTarget.value || undefined,
                                }
                              : price,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="question-secondary-actions">
                    <ReorderButtons
                      label={item.name}
                      index={index}
                      count={category.items.length}
                      onMove={(offset) =>
                        updateCategory(categoryIndex, {
                          items: move(category.items, index, offset),
                        })
                      }
                    />
                    <button
                      type="button"
                      className="secondary danger-text"
                      onClick={() =>
                        updateCategory(categoryIndex, {
                          items: category.items.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Remove price
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <button
            type="button"
            className="secondary"
            disabled={category.items.length >= 30}
            onClick={() => addPrice(categoryIndex)}
          >
            <Plus size={18} aria-hidden="true" /> Add price
          </button>
          {category.items.length >= 30 && (
            <small>
              This category has 30 prices. Add another category for more.
            </small>
          )}
        </section>
      ))}
      {!showCategories ? (
        <button
          type="button"
          className="text-button"
          onClick={() => setOrganising(true)}
        >
          Organise into categories
        </button>
      ) : (
        <div className="stack-form">
          {!addingCategory ? (
            <button
              type="button"
              className="secondary"
              disabled={config.categories.length >= 12}
              onClick={() => setAddingCategory(true)}
            >
              <Plus size={18} aria-hidden="true" /> Add category
            </button>
          ) : (
            <div className="focused-form">
              <label>
                New category name
                <input
                  value={categoryName}
                  onChange={(event) =>
                    setCategoryName(event.currentTarget.value)
                  }
                  maxLength={80}
                  placeholder="e.g. Bathroom repairs"
                />
              </label>
              <div className="row-actions">
                <button
                  type="button"
                  disabled={!categoryName.trim()}
                  onClick={() => {
                    onChange({
                      ...config,
                      categories: [
                        ...config.categories,
                        {
                          id: id("category"),
                          name: categoryName.trim(),
                          items: [],
                        },
                      ],
                    });
                    setCategoryName("");
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
        </div>
      )}
    </section>
  );
}

function EstimateEditor({
  config,
  onChange,
}: {
  config: Estimate;
  onChange: (config: Estimate) => void;
}) {
  return (
    <section className="stack-form estimate-editor">
      <section className="stack-form">
        <h2>1. Starting price</h2>
        <p>The amount every estimate begins with.</p>
        <label>
          What does it include?
          <input
            required
            maxLength={80}
            value={config.base.label}
            onChange={(event) =>
              onChange({
                ...config,
                base: { ...config.base, label: event.currentTarget.value },
              })
            }
          />
        </label>
        <MoneyInput
          label="Starting price"
          value={config.base.amountMinor}
          currency={config.currency}
          onChange={(amountMinor) =>
            onChange({ ...config, base: { ...config.base, amountMinor } })
          }
        />
      </section>
      <section className="stack-form">
        <h2>2. Optional extras</h2>
        <p>Customers choose which extras they need.</p>
        {config.addOns.map((choice, index) => (
          <details className="object-card" key={choice.id}>
            <summary>
              <span>
                <strong>{choice.label}</strong>
                <small>
                  +{formatMoney(choice.amountMinor, config.currency)}
                </small>
              </span>
              <span className="edit-affordance">
                <Pencil size={15} aria-hidden="true" /> Edit
              </span>
            </summary>
            <div className="focused-form">
              <label>
                Extra name
                <input
                  required
                  maxLength={80}
                  value={choice.label}
                  onChange={(event) =>
                    onChange({
                      ...config,
                      addOns: config.addOns.map((item, i) =>
                        i === index
                          ? { ...item, label: event.currentTarget.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <MoneyInput
                label="Extra price"
                value={choice.amountMinor}
                currency={config.currency}
                onChange={(amountMinor) =>
                  onChange({
                    ...config,
                    addOns: config.addOns.map((item, i) =>
                      i === index ? { ...item, amountMinor } : item,
                    ),
                  })
                }
              />
              <div className="question-secondary-actions">
                <ReorderButtons
                  label={choice.label}
                  index={index}
                  count={config.addOns.length}
                  onMove={(offset) =>
                    onChange({
                      ...config,
                      addOns: move(config.addOns, index, offset),
                    })
                  }
                />
                <button
                  type="button"
                  className="secondary danger-text"
                  onClick={() =>
                    onChange({
                      ...config,
                      addOns: config.addOns.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove extra
                </button>
              </div>
            </div>
          </details>
        ))}
        <button
          type="button"
          className="secondary"
          disabled={config.addOns.length >= 12}
          onClick={() =>
            onChange({
              ...config,
              addOns: [
                ...config.addOns,
                { id: id("choice"), label: "New extra", amountMinor: 0 },
              ],
            })
          }
        >
          <Plus size={18} aria-hidden="true" /> Add extra
        </button>
      </section>
      <section className="stack-form">
        <h2>
          3. Quantity <span className="optional">Optional</span>
        </h2>
        <p>
          Use this if the price depends on a number of rooms, hours or items.
        </p>
        {!config.quantity ? (
          <button
            type="button"
            className="secondary"
            onClick={() =>
              onChange({
                ...config,
                quantity: {
                  id: id("quantity"),
                  label: "How many items?",
                  unitLabel: "item",
                  unitAmountMinor: 0,
                  min: 1,
                  max: 10,
                  step: 1,
                },
              })
            }
          >
            <Plus size={18} aria-hidden="true" /> Add a quantity
          </button>
        ) : (
          <div className="focused-form">
            <label>
              Question for customers
              <input
                required
                maxLength={80}
                value={config.quantity.label}
                onChange={(event) =>
                  onChange({
                    ...config,
                    quantity: {
                      ...config.quantity!,
                      label: event.currentTarget.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Unit name
              <input
                required
                maxLength={30}
                value={config.quantity.unitLabel}
                onChange={(event) =>
                  onChange({
                    ...config,
                    quantity: {
                      ...config.quantity!,
                      unitLabel: event.currentTarget.value,
                    },
                  })
                }
              />
            </label>
            <MoneyInput
              label="Price per unit"
              value={config.quantity.unitAmountMinor}
              currency={config.currency}
              onChange={(unitAmountMinor) =>
                onChange({
                  ...config,
                  quantity: { ...config.quantity!, unitAmountMinor },
                })
              }
            />
            <details className="advanced-options">
              <summary>Quantity limits</summary>
              <div className="form-grid">
                {(["min", "max", "step"] as const).map((key) => (
                  <label key={key}>
                    {key === "min"
                      ? "Smallest quantity"
                      : key === "max"
                        ? "Largest quantity"
                        : "Increase by"}
                    <input
                      required
                      type="number"
                      min={key === "step" ? 1 : 0}
                      max={1000}
                      step={1}
                      value={config.quantity![key]}
                      onChange={(event) =>
                        onChange({
                          ...config,
                          quantity: {
                            ...config.quantity!,
                            [key]: Number(event.currentTarget.value),
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <small>
                The range must divide evenly by the increase amount.
              </small>
            </details>
            <button
              type="button"
              className="secondary danger-text"
              onClick={() => onChange({ ...config, quantity: undefined })}
            >
              Remove quantity
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
