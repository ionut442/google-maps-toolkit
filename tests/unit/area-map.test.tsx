import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AreaMap } from "@/components/area-map";

describe("service area map", () => {
  it("renders accessible, same-origin OpenStreetMap tiles around a saved area", () => {
    const html = renderToStaticMarkup(
      <AreaMap
        points={[
          {
            name: "Cluj-Napoca, Romania",
            latitude: 46.7712,
            longitude: 23.6236,
          },
        ]}
      />,
    );
    expect(html).toContain('aria-label="Map showing Cluj-Napoca, Romania"');
    expect(html).toContain('role="img"');
    expect(html).toContain('src="/api/map-tiles/13/');
    expect(html).toContain("© OpenStreetMap contributors");
    expect(html).not.toContain("tile.openstreetmap.org");
  });
});
