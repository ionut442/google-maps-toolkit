import Link from "next/link";

export function StepShell({
  step,
  title,
  intro,
  children,
}: {
  step: number;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const previous =
    {
      3: { href: "/onboarding/industry", label: "Business type" },
      4: { href: "/onboarding/details", label: "Business details" },
      5: { href: "/onboarding/tools", label: "Customer tools" },
    }[step] ?? null;
  const phases = [
    { label: "Your business", active: step <= 3, complete: step > 3 },
    {
      label: "Customer tools",
      active: step === 4,
      complete: step > 4,
    },
    { label: "Preview & publish", active: step === 5, complete: false },
  ];
  return (
    <main className="setup-shell">
      <aside className="setup-progress" aria-label={`Step ${step} of 5`}>
        <Link className="app-wordmark" href="/">
          <span aria-hidden="true">L</span>LocalAction
        </Link>
        <ol>
          {phases.map((phase, index) => (
            <li
              className={
                phase.active ? "active" : phase.complete ? "complete" : ""
              }
              key={phase.label}
            >
              <span>{index + 1}</span>
              {phase.label}
            </li>
          ))}
        </ol>
        <small>Step {step} of 5</small>
      </aside>
      <div className="setup-content">
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(step / 5) * 100}%` }} />
        </div>
        <div className="setup-step-heading">
          <span className="eyebrow">Step {step} of 5</span>
          {previous && (
            <Link className="setup-back-link" href={previous.href}>
              ← Back to {previous.label}
            </Link>
          )}
        </div>
        <h1>{title}</h1>
        <p className="setup-intro">{intro}</p>
        {children}
      </div>
    </main>
  );
}
