import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AreaMap } from "@/components/area-map";

describe("service area map", () => {
  it("renders an accessible OpenStreetMap embed around a saved area", () => {
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
    expect(html).toContain("https://www.openstreetmap.org/export/embed.html?");
    expect(html).toContain("marker=46.7712%2C23.6236");
    expect(html).toContain('title="Map showing Cluj-Napoca, Romania"');
  });
});
