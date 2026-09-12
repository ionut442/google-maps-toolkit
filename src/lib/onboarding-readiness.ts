import { isDirectGoogleReviewUrl } from "./google-review-link";

export type ToolReadinessModule = {
  type: string;
  enabled: boolean;
  customizedAt: Date | null;
};

export function onboardingToolReady(
  module: ToolReadinessModule,
  business: { phone: string; googleReviewUrl?: string | null },
) {
  if (!module.enabled) return true;
  if (module.type === "CALL_WHATSAPP")
    return Boolean(module.customizedAt) && Boolean(business.phone.trim());
  if (module.type === "SAVE_CONTACT") return Boolean(business.phone.trim());
  if (module.type === "REVIEW")
    return (
      Boolean(module.customizedAt) &&
      isDirectGoogleReviewUrl(business.googleReviewUrl)
    );
  return Boolean(module.customizedAt);
}

export function allEnabledToolsReady(
  modules: ToolReadinessModule[],
  business: { phone: string; googleReviewUrl?: string | null },
) {
  const enabled = modules.filter((module) => module.enabled);
  return (
    enabled.length > 0 &&
    enabled.every((module) => onboardingToolReady(module, business))
  );
}
