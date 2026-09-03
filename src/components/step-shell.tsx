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
  return (
    <main className="setup">
      <div className="progress" aria-label={`Step ${step} of 6`}>
        <span style={{ width: `${(step / 6) * 100}%` }} />
      </div>
      <span className="eyebrow">Step {step} of 6</span>
      <h1>{title}</h1>
      <p>{intro}</p>
      {children}
    </main>
  );
}
