import { describe, expect, it } from "vitest";
import { parsePostalCodeBatch } from "@/lib/service-area";

describe("postcode batch presentation", () => {
  it("accepts comma or line-separated values and removes normalized duplicates", () => {
    expect(parsePostalCodeBatch("SW1A 1AA, sw1a-1aa\n90210")).toEqual({
      valid: ["SW1A 1AA", "90210"],
      invalid: [],
    });
  });

  it("returns invalid entries without losing the valid draft", () => {
    expect(parsePostalCodeBatch("10001, invalid!, 400001")).toEqual({
      valid: ["10001", "400001"],
      invalid: ["invalid!"],
    });
  });
});
