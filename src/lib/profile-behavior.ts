export function synchronizedWhatsapp(
  phone: string,
  current: string,
  synchronized: boolean,
) {
  return synchronized ? phone : current;
}

export function resolvedGoogleReviewUrl({
  previousMapsUrl,
  previousReviewUrl,
  submittedMapsUrl,
  submittedReviewUrl,
  resolvedForMapsUrl,
}: {
  previousMapsUrl: string | null;
  previousReviewUrl: string | null;
  submittedMapsUrl: string | null;
  submittedReviewUrl: string | null;
  resolvedForMapsUrl: string | null;
}) {
  if (!submittedMapsUrl) return null;
  if (submittedMapsUrl === previousMapsUrl)
    return submittedReviewUrl ?? previousReviewUrl;
  return resolvedForMapsUrl === submittedMapsUrl ? submittedReviewUrl : null;
}
