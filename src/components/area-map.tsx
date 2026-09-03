"use client";

import { useEffect, useRef } from "react";

type Point = { name: string; latitude: number; longitude: number };

export function AreaMap({
  points,
  compact = false,
}: {
  points: Point[];
  compact?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current || !points.length) return;
    let disposed = false;
    let map: import("maplibre-gl").Map | undefined;
    void import("maplibre-gl").then(
      ({ Map, Marker, Popup, LngLatBounds, NavigationControl }) => {
        if (disposed || !container.current) return;
        const bounds = new LngLatBounds();
        map = new Map({
          container: container.current,
          style: "https://tiles.openfreemap.org/styles/positron",
          center: [points[0].longitude, points[0].latitude],
          zoom: 9,
          attributionControl: {
            compact: true,
            customAttribution: "© OpenStreetMap contributors · OpenFreeMap",
          },
        });
        map.addControl(
          new NavigationControl({ showCompass: false }),
          "top-right",
        );
        points.forEach((point) => {
          bounds.extend([point.longitude, point.latitude]);
          new Marker({ color: "#2563EB" })
            .setLngLat([point.longitude, point.latitude])
            .setPopup(new Popup({ offset: 18 }).setText(point.name))
            .addTo(map!);
        });
        if (points.length > 1)
          map.fitBounds(bounds, { padding: 52, maxZoom: 11, duration: 0 });
      },
    );
    return () => {
      disposed = true;
      map?.remove();
    };
  }, [points]);
  return (
    <div
      className={compact ? "area-map compact" : "area-map"}
      ref={container}
      role="img"
      aria-label={`Map showing ${points.map((point) => point.name).join(", ")}`}
    />
  );
}
