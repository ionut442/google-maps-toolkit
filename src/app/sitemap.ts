import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/help", "/contact", "/terms", "/privacy", "/cookies"];
  return routes.map((route) => ({
    url: `https://local-action.com${route}`,
    lastModified: new Date("2026-09-13T00:00:00Z"),
    changeFrequency: route ? "monthly" : "weekly",
    priority: route ? 0.7 : 1,
  }));
}
