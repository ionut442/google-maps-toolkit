import { describe, expect, it } from "vitest";
import { resolvedGoogleReviewUrl } from "@/lib/profile-behavior";

const oldMaps = "https://maps.app.goo.gl/old";
const newMaps = "https://maps.app.goo.gl/new";
const oldReview =
  "https://search.google.com/local/writereview?placeid=ChIJOldPlaceIdentifier12345";
const newReview =
  "https://search.google.com/local/writereview?placeid=ChIJNewPlaceIdentifier12345";

describe("profile Google link behavior", () => {
  it("preserves a resolved review URL during ordinary profile edits", () => {
    expect(
      resolvedGoogleReviewUrl({
        previousMapsUrl: oldMaps,
        previousReviewUrl: oldReview,
        submittedMapsUrl: oldMaps,
        submittedReviewUrl: null,
        resolvedForMapsUrl: null,
      }),
    ).toBe(oldReview);
  });

  it("requires a changed Maps URL to be resolved", () => {
    expect(
      resolvedGoogleReviewUrl({
        previousMapsUrl: oldMaps,
        previousReviewUrl: oldReview,
        submittedMapsUrl: newMaps,
        submittedReviewUrl: oldReview,
        resolvedForMapsUrl: oldMaps,
      }),
    ).toBeNull();
    expect(
      resolvedGoogleReviewUrl({
        previousMapsUrl: oldMaps,
        previousReviewUrl: oldReview,
        submittedMapsUrl: newMaps,
        submittedReviewUrl: newReview,
        resolvedForMapsUrl: newMaps,
      }),
    ).toBe(newReview);
  });

  it("clears both meanings without falling back from Maps to review", () => {
    expect(
      resolvedGoogleReviewUrl({
        previousMapsUrl: oldMaps,
        previousReviewUrl: oldReview,
        submittedMapsUrl: null,
        submittedReviewUrl: oldReview,
        resolvedForMapsUrl: oldMaps,
      }),
    ).toBeNull();
    expect(
      resolvedGoogleReviewUrl({
        previousMapsUrl: oldMaps,
        previousReviewUrl: oldReview,
        submittedMapsUrl: newMaps,
        submittedReviewUrl: null,
        resolvedForMapsUrl: null,
      }),
    ).toBeNull();
  });
});
