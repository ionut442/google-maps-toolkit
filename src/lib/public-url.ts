import { applicationBaseUrl } from "./environment";

export function publicBusinessUrl(slug: string) {
  return new URL(
    `/${encodeURIComponent(slug)}`,
    `${applicationBaseUrl()}/`,
  ).toString();
}

export function safeDownloadSlug(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "business"
  );
}
