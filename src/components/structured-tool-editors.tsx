"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  savePromotionsAction,
  saveServicesAction,
  saveWorkHoursAction,
} from "@/app/actions";
import { EditorActionForm } from "@/components/editor-action-form";
import { SubmitButton } from "@/components/submit-button";
import type { PromotionsConfig } from "@/lib/promotions";
import type { ServicesConfig } from "@/lib/services";
import { weekDayLabels, type WorkHoursConfig } from "@/lib/work-hours";

const newId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;

function move<T>(items: T[], index: number, offset: number) {
  const target = index + offset;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function OrderButtons({
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
        aria-label={`Move ${label} up`}
        disabled={index === 0}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={17} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="icon secondary"
        aria-label={`Move ${label} down`}
        disabled={index === count - 1}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={17} aria-hidden="true" />
      </button>
    </span>
  );
}

export function ServicesEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: ServicesConfig;
}) {
  const [config, setConfig] = useState(initial);
  return (
    <div className="editor-sheet">
      <EditorActionForm action={saveServicesAction} className="stack-form">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="config" value={JSON.stringify(config)} />
        <header>
          <div>
            <span className="eyebrow">Services</span>
            <h3>Show what your business does</h3>
            <p>
              Group services into clear categories. Prices stay in the Pricing
              tool.
            </p>
          </div>
        </header>
        <label>
          Section heading
          <input
            value={config.label}
            maxLength={60}
            required
            onChange={(event) =>
              setConfig({ ...config, label: event.currentTarget.value })
            }
          />
        </label>
        <div className="structured-list">
          {config.categories.map((category, categoryIndex) => (
            <section className="structured-card" key={category.id}>
              <div className="structured-card-heading">
                <input
                  aria-label="Category name"
                  value={category.name}
                  maxLength={100}
                  required
                  onChange={(event) => {
                    const categories = [...config.categories];
                    categories[categoryIndex] = {
                      ...category,
                      name: event.currentTarget.value,
                    };
                    setConfig({ ...config, categories });
                  }}
                />
                <OrderButtons
                  label={category.name || "category"}
                  index={categoryIndex}
                  count={config.categories.length}
                  onMove={(offset) =>
                    setConfig({
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
                  type="button"
                  className="icon secondary danger-text"
                  aria-label={`Delete ${category.name || "category"}`}
                  onClick={() =>
                    setConfig({
                      ...config,
                      categories: config.categories.filter(
                        (item) => item.id !== category.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
              {category.items.map((item, itemIndex) => (
                <div className="structured-row" key={item.id}>
                  <span>
                    <input
                      aria-label="Service name"
                      placeholder="Service name"
                      value={item.name}
                      maxLength={100}
                      required
                      onChange={(event) => {
                        const items = [...category.items];
                        items[itemIndex] = {
                          ...item,
                          name: event.currentTarget.value,
                        };
                        const categories = [...config.categories];
                        categories[categoryIndex] = { ...category, items };
                        setConfig({ ...config, categories });
                      }}
                    />
                    <input
                      aria-label={`Description for ${item.name || "service"}`}
                      placeholder="Short description (optional)"
                      value={item.description ?? ""}
                      maxLength={300}
                      onChange={(event) => {
                        const items = [...category.items];
                        items[itemIndex] = {
                          ...item,
                          description: event.currentTarget.value,
                        };
                        const categories = [...config.categories];
                        categories[categoryIndex] = { ...category, items };
                        setConfig({ ...config, categories });
                      }}
                    />
                  </span>
                  <OrderButtons
                    label={item.name || "service"}
                    index={itemIndex}
                    count={category.items.length}
                    onMove={(offset) => {
                      const categories = [...config.categories];
                      categories[categoryIndex] = {
                        ...category,
                        items: move(category.items, itemIndex, offset),
                      };
                      setConfig({ ...config, categories });
                    }}
                  />
                  <button
                    type="button"
                    className="icon secondary danger-text"
                    aria-label={`Delete ${item.name || "service"}`}
                    onClick={() => {
                      const categories = [...config.categories];
                      categories[categoryIndex] = {
                        ...category,
                        items: category.items.filter(
                          (candidate) => candidate.id !== item.id,
                        ),
                      };
                      setConfig({ ...config, categories });
                    }}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              ))}
              {category.items.length < 30 && (
                <button
                  type="button"
                  className="secondary add-inline"
                  onClick={() => {
                    const categories = [...config.categories];
                    categories[categoryIndex] = {
                      ...category,
                      items: [
                        ...category.items,
                        { id: newId("service"), name: "", description: "" },
                      ],
                    };
                    setConfig({ ...config, categories });
                  }}
                >
                  <Plus size={17} aria-hidden="true" /> Add service
                </button>
              )}
            </section>
          ))}
        </div>
        {config.categories.length < 12 && (
          <button
            type="button"
            className="secondary"
            onClick={() =>
              setConfig({
                ...config,
                categories: [
                  ...config.categories,
                  { id: newId("category"), name: "New category", items: [] },
                ],
              })
            }
          >
            <Plus size={18} aria-hidden="true" /> Add category
          </button>
        )}
        <SubmitButton>Save services</SubmitButton>
      </EditorActionForm>
    </div>
  );
}

export function WorkHoursEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: WorkHoursConfig;
}) {
  const [config, setConfig] = useState(initial);
  return (
    <div className="editor-sheet">
      <EditorActionForm action={saveWorkHoursAction} className="stack-form">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="config" value={JSON.stringify(config)} />
        <header>
          <div>
            <span className="eyebrow">Working hours</span>
            <h3>Set a clear weekly schedule</h3>
            <p>Choose closed, regular hours, or open 24 hours for every day.</p>
          </div>
        </header>
        <label>
          Section heading
          <input
            value={config.label}
            maxLength={60}
            required
            onChange={(event) =>
              setConfig({ ...config, label: event.currentTarget.value })
            }
          />
        </label>
        <div className="hours-editor-list">
          {config.days.map((entry, index) => (
            <div className="hours-editor-row" key={entry.day}>
              <strong>{weekDayLabels[entry.day]}</strong>
              <select
                aria-label={`${weekDayLabels[entry.day]} availability`}
                value={entry.status}
                onChange={(event) => {
                  const status = event.currentTarget
                    .value as WorkHoursConfig["days"][number]["status"];
                  const days = [...config.days];
                  days[index] =
                    status === "OPEN"
                      ? {
                          day: entry.day,
                          status,
                          opensAt: "09:00",
                          closesAt: "17:00",
                        }
                      : { day: entry.day, status };
                  setConfig({ ...config, days });
                }}
              >
                <option value="CLOSED">Closed</option>
                <option value="OPEN">Open</option>
                <option value="OPEN_24_HOURS">Open 24 hours</option>
              </select>
              {entry.status === "OPEN" && (
                <span className="hours-time-inputs">
                  <input
                    type="time"
                    aria-label={`${weekDayLabels[entry.day]} opens`}
                    value={entry.opensAt}
                    required
                    onChange={(event) => {
                      const days = [...config.days];
                      days[index] = {
                        ...entry,
                        opensAt: event.currentTarget.value,
                      };
                      setConfig({ ...config, days });
                    }}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    aria-label={`${weekDayLabels[entry.day]} closes`}
                    value={entry.closesAt}
                    required
                    onChange={(event) => {
                      const days = [...config.days];
                      days[index] = {
                        ...entry,
                        closesAt: event.currentTarget.value,
                      };
                      setConfig({ ...config, days });
                    }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
        <SubmitButton>Save working hours</SubmitButton>
      </EditorActionForm>
    </div>
  );
}

export function PromotionsEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: PromotionsConfig;
}) {
  const [config, setConfig] = useState(initial);
  return (
    <div className="editor-sheet">
      <EditorActionForm action={savePromotionsAction} className="stack-form">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="config" value={JSON.stringify(config)} />
        <header>
          <div>
            <span className="eyebrow">Special offers</span>
            <h3>Highlight current promotions</h3>
            <p>
              Expired offers stay saved here but disappear from the public page.
            </p>
          </div>
        </header>
        <label>
          Section heading
          <input
            value={config.label}
            maxLength={60}
            required
            onChange={(event) =>
              setConfig({ ...config, label: event.currentTarget.value })
            }
          />
        </label>
        <div className="structured-list">
          {config.offers.map((offer, index) => (
            <section className="structured-card" key={offer.id}>
              <div className="structured-card-heading">
                <strong>{offer.title || "New offer"}</strong>
                <OrderButtons
                  label={offer.title || "offer"}
                  index={index}
                  count={config.offers.length}
                  onMove={(offset) =>
                    setConfig({
                      ...config,
                      offers: move(config.offers, index, offset),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon secondary danger-text"
                  aria-label={`Delete ${offer.title || "offer"}`}
                  onClick={() =>
                    setConfig({
                      ...config,
                      offers: config.offers.filter(
                        (item) => item.id !== offer.id,
                      ),
                    })
                  }
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
              <label>
                Offer title
                <input
                  value={offer.title}
                  maxLength={120}
                  required
                  onChange={(event) => {
                    const offers = [...config.offers];
                    offers[index] = {
                      ...offer,
                      title: event.currentTarget.value,
                    };
                    setConfig({ ...config, offers });
                  }}
                />
              </label>
              <label>
                Description
                <textarea
                  value={offer.description ?? ""}
                  maxLength={400}
                  rows={3}
                  onChange={(event) => {
                    const offers = [...config.offers];
                    offers[index] = {
                      ...offer,
                      description: event.currentTarget.value,
                    };
                    setConfig({ ...config, offers });
                  }}
                />
              </label>
              <label>
                Valid until (optional)
                <input
                  type="date"
                  value={offer.validUntil ?? ""}
                  onChange={(event) => {
                    const offers = [...config.offers];
                    offers[index] = {
                      ...offer,
                      validUntil: event.currentTarget.value || undefined,
                    };
                    setConfig({ ...config, offers });
                  }}
                />
              </label>
            </section>
          ))}
        </div>
        {config.offers.length < 20 && (
          <button
            type="button"
            className="secondary"
            onClick={() =>
              setConfig({
                ...config,
                offers: [
                  ...config.offers,
                  { id: newId("offer"), title: "", description: "" },
                ],
              })
            }
          >
            <Plus size={18} aria-hidden="true" /> Add offer
          </button>
        )}
        <SubmitButton>Save offers</SubmitButton>
      </EditorActionForm>
    </div>
  );
}
