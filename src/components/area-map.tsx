type Point = { name: string; latitude: number; longitude: number };

const TILE_SIZE = 256;
const VIEWPORT = { width: 640, height: 320 };

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function project(point: Point, zoom: number) {
  const scale = 2 ** zoom;
  const latitude = clamp(point.latitude, -85.0511, 85.0511);
  const sin = Math.sin((latitude * Math.PI) / 180);
  return {
    x: ((point.longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function mapLayout(points: Point[]) {
  let zoom = 13;
  for (; zoom > 1; zoom -= 1) {
    const projected = points.map((point) => project(point, zoom));
    const width =
      (Math.max(...projected.map((point) => point.x)) -
        Math.min(...projected.map((point) => point.x))) *
      TILE_SIZE;
    const height =
      (Math.max(...projected.map((point) => point.y)) -
        Math.min(...projected.map((point) => point.y))) *
      TILE_SIZE;
    if (width <= VIEWPORT.width * 0.68 && height <= VIEWPORT.height * 0.6)
      break;
  }
  const projected = points.map((point) => project(point, zoom));
  const center = {
    x:
      (Math.min(...projected.map((point) => point.x)) +
        Math.max(...projected.map((point) => point.x))) /
      2,
    y:
      (Math.min(...projected.map((point) => point.y)) +
        Math.max(...projected.map((point) => point.y))) /
      2,
  };
  const origin = {
    x: center.x * TILE_SIZE - VIEWPORT.width / 2,
    y: center.y * TILE_SIZE - VIEWPORT.height / 2,
  };
  const scale = 2 ** zoom;
  const tiles = [];
  const firstX = Math.floor(origin.x / TILE_SIZE);
  const firstY = Math.floor(origin.y / TILE_SIZE);
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const rawX = firstX + column;
      const y = firstY + row;
      if (y < 0 || y >= scale) continue;
      const x = ((rawX % scale) + scale) % scale;
      tiles.push({
        x,
        y,
        left: rawX * TILE_SIZE - origin.x,
        top: y * TILE_SIZE - origin.y,
      });
    }
  }
  return { zoom, origin, tiles };
}

export function AreaMap({
  points,
  compact = false,
}: {
  points: Point[];
  compact?: boolean;
}) {
  if (!points.length) return null;
  const layout = mapLayout(points);
  return (
    <div
      className={compact ? "area-map compact" : "area-map"}
      role="img"
      aria-label={`Map showing ${points.map((point) => point.name).join(", ")}`}
    >
      <div className="area-map-canvas" aria-hidden="true">
        {layout.tiles.map((tile) => (
          // Tile requests stay same-origin so privacy shields do not block them.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${tile.x}-${tile.y}`}
            src={`/api/map-tiles/${layout.zoom}/${tile.x}/${tile.y}`}
            alt=""
            draggable={false}
            style={{ left: tile.left, top: tile.top }}
          />
        ))}
        {points.map((point) => {
          const projected = project(point, layout.zoom);
          return (
            <span
              className="area-map-marker"
              key={`${point.name}-${point.latitude}-${point.longitude}`}
              title={point.name}
              style={{
                left: projected.x * TILE_SIZE - layout.origin.x,
                top: projected.y * TILE_SIZE - layout.origin.y,
              }}
            />
          );
        })}
      </div>
      <a
        className="area-map-attribution"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}
