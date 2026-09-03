import { describe, expect, it } from "vitest";
import { reservedSlugs, slugify, uniqueSlug, validateSlug } from "@/lib/slug";

describe("public slugs", () => {
  it("normalizes names and strips unsafe characters", () =>
    expect(slugify("  Café & Pipe Co.! ")).toBe("cafe-and-pipe-co"));
  it("rejects reserved and malformed slugs", () => {
    expect(() => validateSlug("dashboard")).toThrow();
    expect(() => validateSlug("Bad Slug")).toThrow();
    expect(reservedSlugs.has("api")).toBe(true);
  });
  it("resolves collisions deterministically", async () => {
    const taken = new Set(["abc-plumbing", "abc-plumbing-2"]);
    await expect(
      uniqueSlug("ABC Plumbing", async (s) => taken.has(s)),
    ).resolves.toBe("abc-plumbing-3");
  });
  it("protects reserved generated names", async () =>
    expect(uniqueSlug("Dashboard", async () => false)).resolves.toBe(
      "dashboard-business",
    ));
});
