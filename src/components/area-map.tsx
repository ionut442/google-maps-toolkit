type Point = { name: string; latitude: number; longitude: number };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function embedUrl(points: Point[]) {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latitudePadding = Math.max((maxLatitude - minLatitude) * 0.2, 0.06);
  const longitudePadding = Math.max((maxLongitude - minLongitude) * 0.2, 0.08);
  const bbox = [
    clamp(minLongitude - longitudePadding, -180, 180),
    clamp(minLatitude - latitudePadding, -85, 85),
    clamp(maxLongitude + longitudePadding, -180, 180),
    clamp(maxLatitude + latitudePadding, -85, 85),
  ].join(",");
  const query = new URLSearchParams({ bbox, layer: "mapnik" });
  if (points.length === 1) {
    query.set("marker", `${points[0].latitude},${points[0].longitude}`);
  }
  return `https://www.openstreetmap.org/export/embed.html?${query}`;
}

export function AreaMap({
  points,
  compact = false,
}: {
  points: Point[];
  compact?: boolean;
}) {
  if (!points.length) return null;
  const names = points.map((point) => point.name).join(", ");
  return (
    <iframe
      className={compact ? "area-map compact" : "area-map"}
      src={embedUrl(points)}
      title={`Map showing ${names}`}
      loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
