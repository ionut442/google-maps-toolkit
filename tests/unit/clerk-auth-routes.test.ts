import { describe, expect, it } from "vitest";
import { isPrivatePath } from "@/lib/auth-routes";
import { onboardingDestination } from "@/lib/onboarding";

describe("Clerk route boundaries", () => {
  it.each([
    "/dashboard",
    "/dashboard/tools",
    "/onboarding/business",
    "/onboarding/industry",
    "/preview/example",
  ])("protects %s", (path) => expect(isPrivatePath(path)).toBe(true));

  it.each([
    "/",
    "/login",
    "/signup",
    "/privacy",
    "/terms",
    "/example-business",
    "/api/quotes/example-business",
  ])("keeps %s public", (path) => expect(isPrivatePath(path)).toBe(false));

  it("preserves existing onboarding destinations", () => {
    expect(onboardingDestination(2)).toBe("/onboarding/industry");
    expect(onboardingDestination(3)).toBe("/onboarding/details");
    expect(onboardingDestination(4)).toBe("/onboarding/tools");
    expect(onboardingDestination(5)).toBe("/onboarding/publish");
    expect(onboardingDestination(6)).toBe("/onboarding/publish");
    expect(onboardingDestination(7)).toBe("/dashboard");
  });
});
