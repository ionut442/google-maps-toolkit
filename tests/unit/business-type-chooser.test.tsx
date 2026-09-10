import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BusinessTypeChooser } from "@/components/business-type-chooser";

const { useFormStatusMock } = vi.hoisted(() => ({
  useFormStatusMock: vi.fn(),
}));

vi.mock("react-dom", async () => ({
  ...(await vi.importActual<typeof import("react-dom")>("react-dom")),
  useFormStatus: useFormStatusMock,
}));
vi.mock("@/app/actions", () => ({ selectIndustryAction: vi.fn() }));

describe("BusinessTypeChooser", () => {
  beforeEach(() => {
    useFormStatusMock.mockReturnValue({
      pending: false,
      data: null,
      method: null,
      action: null,
    });
  });

  it("disables duplicate submission and shows immediate pending feedback", () => {
    useFormStatusMock.mockReturnValue({
      pending: true,
      data: null,
      method: "post",
      action: null,
    });

    const html = renderToStaticMarkup(
      <BusinessTypeChooser
        current="CLEANING"
        choices={[{ industry: "CLEANING", name: "Cleaning", toolCount: 2 }]}
      />,
    );

    expect(html).toContain("Saving choice…");
    expect(html).toContain("disabled");
    expect(html).not.toContain(">Continue</button>");
  });
});
