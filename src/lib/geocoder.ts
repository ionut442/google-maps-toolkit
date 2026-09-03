import "server-only";
import { z } from "zod";

export type GeocoderResult = {
  source: "PHOTON";
  sourceId: string;
  name: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
};

export interface Geocoder {
  search(query: string): Promise<GeocoderResult[]>;
}

const responseSchema = z.object({
  features: z
    .array(
      z.object({
        geometry: z.object({ coordinates: z.tuple([z.number(), z.number()]) }),
        properties: z.record(z.string(), z.unknown()),
      }),
    )
    .max(10),
});

function displayName(properties: Record<string, unknown>) {
  return [
    properties.name,
    properties.city,
    properties.state,
    properties.country,
  ]
    .filter(
      (part, index, all) =>
        typeof part === "string" && part && all.indexOf(part) === index,
    )
    .join(", ");
}

export class PhotonGeocoder implements Geocoder {
  async search(query: string) {
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    const response = await fetch(url, {
      headers: { "User-Agent": "GoogleMapsToolbox-private-beta/1.0" },
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("Place search is temporarily unavailable");
    const parsed = responseSchema.parse(await response.json());
    return parsed.features.flatMap((feature) => {
      const name = displayName(feature.properties);
      const sourceId = String(feature.properties.osm_id ?? "");
      const countryCode = String(
        feature.properties.countrycode ?? "",
      ).toUpperCase();
      if (!name || !sourceId) return [];
      return [
        {
          source: "PHOTON" as const,
          sourceId,
          name,
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
          ...(countryCode ? { countryCode } : {}),
        },
      ];
    });
  }
}

export const geocoder: Geocoder = new PhotonGeocoder();
