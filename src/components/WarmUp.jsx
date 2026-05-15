import SessionFlow from "./SessionFlow";

export default function WarmUp({ warmup, onComplete }) {
  if (!warmup) return null;

  const steps = warmup.drills.map(d => ({
    name: d.name,
    label: d.name,
    duration: d.duration,
    instruction: d.instruction,
  }));

  return (
    <SessionFlow
      steps={steps}
      label="Drill"
      accent="#2563a8"
      intro={{
        title: warmup.label,
        subtitle: "Before You Lift",
      }}
      completion={{
        headline: "Warm-Up Complete",
        body: "Muscles are primed. Get into the main session.",
        cta: "Start Session",
      }}
      onDone={onComplete}
      onSkip={onComplete}
    />
  );
}
