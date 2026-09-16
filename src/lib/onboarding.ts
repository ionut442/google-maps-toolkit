export function onboardingDestination(step: number) {
  return (
    (
      {
        2: "/onboarding/industry",
        3: "/onboarding/details",
        4: "/onboarding/tools",
        5: "/onboarding/publish",
        6: "/onboarding/publish",
      } as Record<number, string>
    )[step] ?? "/dashboard"
  );
}
