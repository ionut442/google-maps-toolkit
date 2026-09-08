import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AreaMap } from "@/components/area-map";

describe("service area map", () => {
  it("renders an accessible OpenStreetMap tile preview around a saved area", () => {
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
    expect(html).toContain("https://tile.openstreetmap.org/");
    expect(html).toContain('aria-label="Map showing Cluj-Napoca, Romania"');
    expect(html).toContain('title="Cluj-Napoca, Romania"');
    expect(html).not.toContain("<iframe");
  });
});
