export type ToolReadinessModule = {
  type: string;
  enabled: boolean;
  customizedAt: Date | null;
};

export function onboardingToolReady(
  module: ToolReadinessModule,
  business: { phone: string },
) {
  if (!module.enabled) return true;
  if (module.type === "CALL_WHATSAPP" || module.type === "SAVE_CONTACT")
    return Boolean(business.phone.trim());
  return Boolean(module.customizedAt);
}

export function allEnabledToolsReady(
  modules: ToolReadinessModule[],
  business: { phone: string },
) {
  const enabled = modules.filter((module) => module.enabled);
  return (
    enabled.length > 0 &&
    enabled.every((module) => onboardingToolReady(module, business))
  );
}
