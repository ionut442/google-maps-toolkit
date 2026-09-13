const INTEGER = /^\d+$/;
const MAX_ZOOM = 19;

export async function GET(
  _request: Request,
  context: { params: Promise<{ zoom: string; x: string; y: string }> },
) {
  const { zoom: zoomValue, x: xValue, y: yValue } = await context.params;
  if (
    !INTEGER.test(zoomValue) ||
    !INTEGER.test(xValue) ||
    !INTEGER.test(yValue)
  ) {
    return new Response("Invalid tile coordinates", { status: 400 });
  }

  const zoom = Number(zoomValue);
  const x = Number(xValue);
  const y = Number(yValue);
  const scale = 2 ** zoom;
  if (
    zoom < 0 ||
    zoom > MAX_ZOOM ||
    x < 0 ||
    y < 0 ||
    x >= scale ||
    y >= scale
  ) {
    return new Response("Tile coordinates out of range", { status: 400 });
  }

  const upstream = await fetch(
    `https://tile.openstreetmap.de/${zoom}/${x}/${y}.png`,
    {
      headers: {
        "User-Agent": "LocalAction/1.0 (https://local-action.com)",
      },
      next: { revalidate: 604_800 },
    },
  );
  if (!upstream.ok) {
    return new Response("Map tile unavailable", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/png",
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=86400",
    },
  });
}
