"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Plus, Search, X } from "lucide-react";
import { saveServiceAreaAction } from "@/app/actions";
import { AreaMap } from "@/components/area-map";
import { EditorActionForm } from "@/components/editor-action-form";
import { SubmitButton } from "@/components/submit-button";
import type { ModuleConfigByType } from "@/lib/domain";
import {
  normalizePostalCode,
  parsePostalCodeBatch,
  type StructuredArea,
} from "@/lib/service-area";

type Config = ModuleConfigByType["SERVICE_AREA"];
type Result = Omit<StructuredArea, "id">;
const id = (prefix: string) =>
  prefix + "_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);

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
  const [postcodeDraft, setPostcodeDraft] = useState("");
  const [postcodeMessage, setPostcodeMessage] = useState("");
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
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(
          "/api/geocode?q=" + encodeURIComponent(query.trim()),
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

  function addPostcodes() {
    const parsed = parsePostalCodeBatch(postcodeDraft);
    const existing = new Set(config.postalCodes.map((item) => item.normalized));
    const available = Math.max(0, 20 - config.postalCodes.length);
    const additions = parsed.valid
      .filter((item) => !existing.has(normalizePostalCode(item)))
      .slice(0, available);
    setConfig({
      ...config,
      postalCodes: [
        ...config.postalCodes,
        ...additions.map((display) => ({
          id: id("postcode"),
          display,
          normalized: normalizePostalCode(display),
        })),
      ],
    });
    const messages = [
      parsed.invalid.length ? "Check: " + parsed.invalid.join(", ") : "",
      parsed.valid.length > additions.length
        ? "Duplicates or entries above the 20-postcode limit were not added."
        : "",
    ].filter(Boolean);
    setPostcodeMessage(messages.join(" "));
    if (!parsed.invalid.length) setPostcodeDraft("");
  }

  return (
    <div className="tool-editor-layout">
      <div className="editor-sheet">
        <EditorActionForm action={saveServiceAreaAction}>
          <input type="hidden" name="businessId" value={businessId} />
          <input type="hidden" name="config" value={JSON.stringify(config)} />
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

          <section
            className="stack-form service-area-section"
            aria-labelledby="areas-title"
          >
            <div>
              <h2 id="areas-title">Areas you serve</h2>
              <p>Search for towns, cities or areas your team can reach.</p>
            </div>
            <label>
              Search for a town or area
              <span className="search-input">
                <Search size={19} aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setQuery(value);
                    if (value.trim().length < 3) {
                      setResults([]);
                      setSearchState("idle");
                    }
                  }}
                  placeholder="e.g. Cluj-Napoca"
                  autoComplete="off"
                  aria-describedby="place-search-status"
                />
              </span>
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
                  : query.length > 0 && query.trim().length < 3
                    ? "Type at least 3 characters."
                    : ""}
            </div>
            {results.length > 0 && (
              <ul className="search-results">
                {results.map((result) => {
                  const exists = config.areas.some(
                    (area) =>
                      area.name.toLocaleLowerCase() ===
                      result.name.toLocaleLowerCase(),
                  );
                  return (
                    <li key={result.source + "-" + result.sourceId}>
                      <button
                        type="button"
                        className="search-result"
                        disabled={exists || config.areas.length >= 20}
                        onClick={() => {
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
                        <MapPin size={19} aria-hidden="true" />
                        <span>
                          <strong>{result.name}</strong>
                          <small>
                            {exists ? "Already added" : "Add this area"}
                          </small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <small>
              Search results © OpenStreetMap contributors, powered by Photon.
            </small>
            {config.areas.length === 0 ? (
              <div className="empty-state">
                <MapPin size={27} aria-hidden="true" />
                <strong>No areas added yet</strong>
                <p>Search above to show customers where you work.</p>
              </div>
            ) : (
              <div className="area-card-list">
                {config.areas.map((area) => (
                  <article className="area-card" key={area.id}>
                    <MapPin size={19} aria-hidden="true" />
                    <span>
                      <strong>{area.name}</strong>
                      <small>
                        {"latitude" in area
                          ? "Shown on your map"
                          : "Search and replace this older area to add a map pin"}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="icon secondary"
                      aria-label={"Remove " + area.name}
                      onClick={() =>
                        setConfig({
                          ...config,
                          areas: config.areas.filter(
                            (item) => item.id !== area.id,
                          ),
                        })
                      }
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </div>
            )}
            {config.areas.length >= 20 && (
              <small>You have added the maximum of 20 areas.</small>
            )}
          </section>

          <section
            className="stack-form service-area-section"
            aria-labelledby="postcodes-title"
          >
            <div>
              <h2 id="postcodes-title">Postcodes you definitely cover</h2>
              <p>
                Paste one or several postcodes. Separate them with a comma or a
                new line.
              </p>
            </div>
            <label>
              Postcodes
              <textarea
                rows={3}
                value={postcodeDraft}
                onChange={(event) =>
                  setPostcodeDraft(event.currentTarget.value.toUpperCase())
                }
                placeholder={"SW1A 1AA, 90210\n400001"}
                aria-describedby="postcode-batch-status"
              />
            </label>
            <button
              type="button"
              className="secondary"
              disabled={
                !postcodeDraft.trim() || config.postalCodes.length >= 20
              }
              onClick={addPostcodes}
            >
              <Plus size={18} aria-hidden="true" /> Add postcodes
            </button>
            <p
              id="postcode-batch-status"
              className={
                postcodeMessage ? "form-feedback error" : "form-feedback"
              }
              role="status"
            >
              {postcodeMessage}
            </p>
            {config.postalCodes.length > 0 && (
              <div className="postcode-chip-list">
                {config.postalCodes.map((code) => (
                  <span className="postcode-chip" key={code.id}>
                    {code.display}
                    <button
                      type="button"
                      aria-label={"Remove " + code.display}
                      onClick={() =>
                        setConfig({
                          ...config,
                          postalCodes: config.postalCodes.filter(
                            (item) => item.id !== code.id,
                          ),
                        })
                      }
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <small>{config.postalCodes.length} of 20 postcodes added</small>
          </section>
          <div className="editor-save-bar">
            <SubmitButton>Save changes</SubmitButton>
            <small>Customers see saved areas and postcodes.</small>
          </div>
        </EditorActionForm>
      </div>

      <aside className="tool-editor-aside">
        <section className="tool-customer-preview service-area-preview">
          <small>What customers see</small>
          <h2>{config.label}</h2>
          {points.length ? (
            <>
              <AreaMap points={points} />
              <p className="map-note">
                Pins show the centre of each area, not exact service boundaries.
              </p>
            </>
          ) : (
            <div className="map-empty-state">
              <MapPin size={26} aria-hidden="true" />
              <p>Your map appears here after you add a place.</p>
            </div>
          )}
          {config.areas.length > 0 && (
            <div className="area-preview-chips">
              {config.areas.map((area) => (
                <span key={area.id}>{area.name}</span>
              ))}
            </div>
          )}
          {config.postalCodes.length > 0 && (
            <div className="postcode-preview">
              <h3>Do we cover your postcode?</h3>
              <div>
                <input
                  aria-label="Customer postcode preview"
                  placeholder="Enter your postcode"
                  disabled
                />
                <button type="button" disabled>
                  Check
                </button>
              </div>
              <small>
                {config.postalCodes.length} exact postcodes are ready to check.
              </small>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
