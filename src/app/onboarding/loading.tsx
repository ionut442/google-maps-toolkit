export default function OnboardingLoading() {
  return (
    <main className="setup" aria-busy="true">
      <div className="skeleton title-skeleton" />
      <div className="skeleton panel-skeleton" />
      <span className="sr-only">Loading setup…</span>
    </main>
  );
}
