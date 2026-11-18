type Step = { title: string; text: string };

/** Étapes numérotées 01, 02, 03, 04. */
export default function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.title} className="reveal flex flex-col gap-3 rounded-3xl bg-surface-muted p-6">
          <span
            aria-hidden="true"
            className="text-5xl font-normal leading-none tracking-tight text-accent"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="text-xl font-medium tracking-tight text-ink">{step.title}</h3>
          <p className="text-base text-ink-soft">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}
