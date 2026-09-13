import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/map-tiles/[zoom]/[x]/[y]/route";

describe("map tile proxy", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects coordinates outside the selected zoom", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request("http://localhost/api/map-tiles/2/4/0"),
      { params: Promise.resolve({ zoom: "2", x: "4", y: "0" }) } as never,
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a cached same-origin tile response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await GET(
      new Request("http://localhost/api/map-tiles/13/4632/2888"),
      {
        params: Promise.resolve({ zoom: "13", x: "4632", y: "2888" }),
      } as never,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toContain("max-age=604800");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://tile.openstreetmap.de/13/4632/2888.png",
      expect.objectContaining({ next: { revalidate: 604_800 } }),
    );
  });
});
