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
  const phases = [
    { label: "Your business", active: step <= 3, complete: step > 3 },
    {
      label: "Customer tools",
      active: step >= 4 && step <= 5,
      complete: step > 5,
    },
    { label: "Preview & publish", active: step === 6, complete: false },
  ];
  return (
    <main className="setup-shell">
      <aside className="setup-progress" aria-label={`Step ${step} of 6`}>
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
        <small>Step {step} of 6</small>
      </aside>
      <div className="setup-content">
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${(step / 6) * 100}%` }} />
        </div>
        <span className="eyebrow">Step {step} of 6</span>
        <h1>{title}</h1>
        <p className="setup-intro">{intro}</p>
        {children}
      </div>
    </main>
  );
}
