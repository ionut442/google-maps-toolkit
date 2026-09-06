import { describe, expect, it } from "vitest";
import { getTemplate, templates } from "@/lib/templates";
import {
  canPublishBusiness,
  moduleSwapIndex,
  moduleTypes,
  parseModuleConfig,
  resolvePrimaryAction,
  validPrimaryActions,
} from "@/lib/domain";

describe("industry templates", () => {
  it("covers every initial service category with controlled modules", () => {
    expect(Object.keys(templates)).toHaveLength(15);
    for (const template of Object.values(templates)) {
      expect(template.modules.length).toBe(8);
      expect(new Set(template.modules.map((m) => m.type)).size).toBe(8);
      expect(template.modules.every((m) => moduleTypes.includes(m.type))).toBe(
        true,
      );
    }
  });
  it("provides strong plumbing defaults", () => {
    const template = getTemplate("PLUMBING");
    expect(template.defaultPrimaryAction).toBe("CALL");
    expect(
      template.modules
        .filter((module) => module.enabled)
        .map(({ type }) => type),
    ).toEqual(["CALL_WHATSAPP", "SAVE_CONTACT"]);
    expect(JSON.stringify(template)).toContain("Emergency call");
  });
  it("uses industry-specific cleaning quote fields", () =>
    expect(JSON.stringify(getTemplate("CLEANING"))).toContain(
      "What needs cleaning?",
    ));
  it("provides specific HVAC and pressure-washing starter content", () => {
    expect(JSON.stringify(getTemplate("HVAC"))).toContain(
      "System type or model",
    );
    expect(JSON.stringify(getTemplate("PRESSURE_WASHING"))).toContain(
      "outdoor tap",
    );
  });
  it("strictly rejects arbitrary module configuration", () =>
    expect(() =>
      parseModuleConfig("REVIEW", { label: "Reviews", arbitrary: true }),
    ).toThrow());
  it("only offers actions backed by enabled modules", () =>
    expect(
      validPrimaryActions([
        { type: "QUOTE_REQUEST", enabled: false },
        { type: "CALL_WHATSAPP", enabled: true },
      ]),
    ).toEqual(["CALL", "WHATSAPP"]));
  it("resolves a disabled primary action to the next enabled action", () => {
    expect(
      resolvePrimaryAction("QUOTE_REQUEST", [
        { type: "QUOTE_REQUEST", enabled: false },
        { type: "CALL_WHATSAPP", enabled: true },
      ]),
    ).toBe("CALL");
  });
  it("validates ordering directions and boundaries", () => {
    expect(moduleSwapIndex(3, 1, "up")).toBe(0);
    expect(moduleSwapIndex(3, 1, "down")).toBe(2);
    expect(moduleSwapIndex(3, 0, "up")).toBeNull();
    expect(moduleSwapIndex(3, 1, "sideways")).toBeNull();
  });
  it("permits publishing with complete details and an enabled customer tool", () => {
    const business = {
      phone: "+40700111222",
      description: "Local service business",
    };
    expect(
      canPublishBusiness(business, [{ type: "QUOTE_REQUEST", enabled: true }]),
    ).toBe(true);
    expect(
      canPublishBusiness(business, [{ type: "QUOTE_REQUEST", enabled: false }]),
    ).toBe(false);
    expect(
      canPublishBusiness({ ...business, phone: "" }, [
        { type: "QUOTE_REQUEST", enabled: true },
      ]),
    ).toBe(false);
  });
});
