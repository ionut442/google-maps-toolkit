"use client";

import { useState } from "react";
import { selectIndustryAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

type Choice = { industry: string; name: string; toolCount: number };

export function BusinessTypeChooser({
  choices,
  current,
  customLabel,
}: {
  choices: Choice[];
  current: string;
  customLabel?: string | null;
}) {
  const [selected, setSelected] = useState(current);
  return (
    <form action={selectIndustryAction} className="industry-form">
      <div className="industry-grid">
        {choices.map((choice) => (
          <label className="choice" key={choice.industry}>
            <input
              type="radio"
              name="industry"
              value={choice.industry}
              checked={selected === choice.industry}
              onChange={() => setSelected(choice.industry)}
              required
            />
            <span>
              <strong>{choice.name}</strong>
              <small>
                {choice.industry === "OTHER"
                  ? "A flexible toolkit with sensible defaults"
                  : `${choice.toolCount} recommended tools`}
              </small>
            </span>
          </label>
        ))}
      </div>
      {selected === "OTHER" && (
        <label className="custom-business-type">
          What type of business is it?
          <input
            name="customIndustryLabel"
            defaultValue={customLabel ?? ""}
            required
            minLength={2}
            maxLength={80}
            placeholder="e.g. Locksmith"
          />
          <small>Use the name your customers would recognize.</small>
        </label>
      )}
      <SubmitButton
        type="submit"
        className="sticky-submit"
        pendingLabel="Saving choice…"
      >
        Continue
      </SubmitButton>
    </form>
  );
}
