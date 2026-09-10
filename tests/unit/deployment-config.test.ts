import { describe, expect, it } from "vitest";
import { normalizeDeploymentId } from "../../next.config";

describe("deployment version skew protection", () => {
  it("normalizes a release identifier for Next.js deployment protection", () => {
    expect(normalizeDeploymentId(" b70a559 ")).toBe("b70a559");
    expect(normalizeDeploymentId("   ")).toBeUndefined();
    expect(normalizeDeploymentId(undefined)).toBeUndefined();
  });
});
