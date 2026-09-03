"use client";

import { useEffect, useMemo, useState } from "react";
import { saveServiceAreaAction } from "@/app/actions";
import type { ModuleConfigByType } from "@/lib/domain";
import {
  normalizePostalCode,
  postalCodeIsValid,
  type StructuredArea,
} from "@/lib/service-area";
import { AreaMap } from "./area-map";
import { SubmitButton } from "./submit-button";

type Config = ModuleConfigByType["SERVICE_AREA"];
type Result = Omit<StructuredArea, "id">;
const id = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;

export function ServiceAreaEditor({
  businessId,
  config: initial,
}: {
  businessId: string;
  config: Config;
}) {
  const [config, setConfig] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [postal, setPostal] = useState("");
  const postalValid = !postal || postalCodeIsValid(postal);
  const points = useMemo(
    () =>
      config.areas.flatMap((area) =>
        "latitude" in area
          ? [
              {
                name: area.name,
                latitude: area.latitude,
                longitude: area.longitude,
              },
            ]
          : [],
      ),
    [config.areas],
  );

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as { results?: Result[] };
        if (!response.ok) throw new Error();
        setResults(body.results ?? []);
        setSearchState("idle");
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSearchState("error");
      }
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <details className="purpose-editor">
      <summary>Configure service area</summary>
      <form action={saveServiceAreaAction} className="editor-sheet stack-form">
        <input type="hidden" name="businessId" value={businessId} />
        <input type="hidden" name="config" value={JSON.stringify(config)} />
        <header>
          <div>
            <span className="eyebrow">Service area</span>
            <h3>Where do you work?</h3>
            <p>Add confirmed places and exact postal codes one at a time.</p>
          </div>
        </header>
        <label>
          Public heading
          <input
            value={config.label}
            onChange={(e) =>
              setConfig({ ...config, label: e.currentTarget.value })
            }
          />
        </label>
        <section className="focused-form place-search">
          <label>
            Search city or area
            <input
              value={query}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setQuery(value);
                if (value.trim().length < 3) {
                  setResults([]);
                  setSearchState("idle");
                }
              }}
              placeholder="Start typing a place"
              autoComplete="off"
              aria-describedby="place-search-status"
            />
          </label>
          <div
            id="place-search-status"
            className="search-status"
            aria-live="polite"
          >
            {searchState === "loading"
              ? "Searching…"
              : searchState === "error"
                ? "Place search is unavailable. Try again shortly."
                : query.length > 0 && query.length < 3
                  ? "Type at least 3 characters."
                  : ""}
          </div>
          {results.length > 0 && (
            <ul className="search-results">
              {results.map((result) => (
                <li key={`${result.source}-${result.sourceId}`}>
                  <button
                    type="button"
                    className="search-result"
                    onClick={() => {
                      if (
                        !config.areas.some((area) => area.name === result.name)
                      )
                        setConfig({
                          ...config,
                          areas: [
                            ...config.areas,
                            { ...result, id: id("area") },
                          ],
                        });
                      setQuery("");
                      setResults([]);
                    }}
                  >
                    <strong>{result.name}</strong>
                    <small>Select this place</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <small>
            Search results © OpenStreetMap contributors, powered by Photon.
          </small>
        </section>
        <section className="object-list">
          <div className="object-list-heading">
            <h4>Selected places</h4>
          </div>
          {config.areas.length === 0 ? (
            <div className="empty-state">
              <strong>No service areas yet</strong>
              <span>Search for your first area above.</span>
            </div>
          ) : (
            config.areas.map((area) => (
              <div className="object-row" key={area.id}>
                <span>
                  <strong>{area.name}</strong>
                  <small>
                    {"latitude" in area
                      ? "Confirmed place"
                      : "Legacy area — search and replace to show it on the map"}
                  </small>
                </span>
                <button
                  type="button"
                  className="text-button danger-text"
                  onClick={() =>
                    setConfig({
                      ...config,
                      areas: config.areas.filter((item) => item.id !== area.id),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </section>
        <section className="focused-form">
          <div>
            <h4>Postal codes</h4>
            <p>
              Use letters and numbers, with spaces or hyphens where your country
              requires them.
            </p>
          </div>
          <div className="inline-add">
            <label>
              <span className="sr-only">Postal code</span>
              <input
                value={postal}
                onChange={(e) => setPostal(e.currentTarget.value.toUpperCase())}
                placeholder="Add postal code"
                aria-invalid={!postalValid}
              />
            </label>
            <button
              type="button"
              disabled={!postal || !postalValid}
              onClick={() => {
                const normalized = normalizePostalCode(postal);
                if (
                  !config.postalCodes.some(
                    (item) => item.normalized === normalized,
                  )
                )
                  setConfig({
                    ...config,
                    postalCodes: [
                      ...config.postalCodes,
                      {
                        id: id("postcode"),
                        display: postal.trim(),
                        normalized,
                      },
                    ],
                  });
                setPostal("");
              }}
            >
              + Add
            </button>
          </div>
          {!postalValid && (
            <small className="error">
              Use letters and numbers only, with optional spaces or hyphens.
            </small>
          )}
          <div className="chip-list">
            {config.postalCodes.map((code) => (
              <span className="editable-chip" key={code.id}>
                {code.display}
                <button
                  type="button"
                  aria-label={`Remove ${code.display}`}
                  onClick={() =>
                    setConfig({
                      ...config,
                      postalCodes: config.postalCodes.filter(
                        (item) => item.id !== code.id,
                      ),
                    })
                  }
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </section>
        {points.length > 0 && (
          <div>
            <h4>Map preview</h4>
            <p className="subtle">
              Markers show confirmed place centres, not exact service
              boundaries.
            </p>
            <AreaMap points={points} />
          </div>
        )}
        <SubmitButton pendingLabel="Saving…">Save service area</SubmitButton>
      </form>
    </details>
  );
}
