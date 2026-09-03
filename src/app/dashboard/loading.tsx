export default function DashboardLoading() {
  return (
    <main className="dashboard" aria-busy="true">
      <div className="skeleton title-skeleton" />
      <div className="skeleton panel-skeleton" />
      <div className="skeleton panel-skeleton" />
      <span className="sr-only">Loading dashboard…</span>
    </main>
  );
}
