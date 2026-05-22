import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

function Counter({ target, duration = 1200, suffix = "" }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setValue(target);
        clearInterval(interval);
      } else {
        setValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);
  return <>{value.toLocaleString()}{suffix}</>;
}

export default function SessionSummary({ sessionKey, logs, schedule, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
  }, []);

  // Find current day from sessionKey
  const dayCode = sessionKey?.split("_")[0] || "";
  const day = schedule?.find(d => d.day === dayCode);
  const allExercises = [...(day?.exercises || []), ...(day?.core_finisher || [])];

  // Compute stats from logs
  let totalSets = 0, totalReps = 0, totalVolume = 0;
  const prs = [];
  const exerciseSummaries = [];

  allExercises.forEach(ex => {
    const exKey = `${sessionKey}__${ex.name}`;
    const exLog = logs[exKey];
    if (!exLog?.sets?.length) return;

    const doneSets = exLog.sets.filter(s => s.done);
    if (!doneSets.length) return;

    const workingSets = doneSets.filter(s => s.type !== "warmup");
    const setCount = workingSets.length;
    const repCount = workingSets.reduce((sum, s) => sum + (parseInt(s.reps) || 0), 0);
    const vol = workingSets.reduce((sum, s) => sum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0);

    totalSets += setCount;
    totalReps += repCount;
    totalVolume += vol;

    // PRs
    const prSet = workingSets.find(s => s.isPR);
    if (prSet) {
      prs.push({ exercise: ex.name, weight: prSet.weight, reps: prSet.reps });
    }

    if (setCount > 0) {
      const topSet = workingSets.reduce((best, s) => {
        const w = parseFloat(s.weight) || 0;
        return w > (parseFloat(best?.weight) || 0) ? s : best;
      }, workingSets[0]);

      exerciseSummaries.push({
        name: ex.name,
        sets: setCount,
        topWeight: topSet?.weight,
        topReps: topSet?.reps,
        bodyweight: ex.bodyweight,
        isPR: !!prSet,
      });
    }
  });

  const volumeK = totalVolume > 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : Math.round(totalVolume);

  // Motivational message based on PRs
  const getMessage = () => {
    if (prs.length >= 3) return "Exceptional session. Multiple PRs today.";
    if (prs.length === 2) return "Two personal records in one session. That's a big day.";
    if (prs.length === 1) return `New personal record on ${prs[0].exercise}. Keep stacking.`;
    if (totalSets >= 20) return "High volume session complete. Recovery is part of the work.";
    if (exerciseSummaries.length >= 5) return "Full session logged. Consistency is the whole game.";
    return "Session logged. Every rep compounds.";
  };

  function handleDismiss() {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.3s",
    }}
      onClick={e => { if (e.target === e.currentTarget) handleDismiss(); }}
    >
      <div style={{
        width: "100%", maxWidth: 640, margin: "0 auto",
        background: "#111",
        borderRadius: "20px 20px 0 0",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        maxHeight: "88vh",
        overflowY: "auto",
        ...F,
      }}>
        {/* Header */}
        <div style={{
          padding: "28px 22px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>
            Session complete
          </div>
          <div style={{ fontSize: "22px", fontWeight: "normal", color: "#f7f6f3", marginBottom: "8px" }}>
            {day?.focus || "Workout"}
          </div>
          <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.6" }}>
            {getMessage()}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1px", background: "rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          {[
            { label: "Sets", value: totalSets, suffix: "" },
            { label: "Reps", value: totalReps, suffix: "" },
            { label: "Volume", value: totalVolume > 1000 ? Math.round(totalVolume / 100) / 10 : Math.round(totalVolume), suffix: totalVolume > 1000 ? "k lbs" : " lbs" },
          ].map(({ label, value, suffix }) => (
            <div key={label} style={{
              background: "#111", padding: "16px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#f7f6f3", lineHeight: 1 }}>
                <Counter target={value} suffix={suffix} />
              </div>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginTop: "4px" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* PRs */}
        {prs.length > 0 && (
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "10px" }}>
              🏆 Personal records
            </div>
            {prs.map((pr, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: i < prs.length - 1 ? "7px" : 0,
              }}>
                <span style={{ fontSize: "13px", color: "#e8e0cc" }}>{pr.exercise}</span>
                <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "600" }}>
                  {pr.weight ? `${pr.weight} lbs × ${pr.reps}` : `${pr.reps} reps`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Exercise breakdown */}
        {exerciseSummaries.length > 0 && (
          <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "10px" }}>
              Exercises logged
            </div>
            {exerciseSummaries.map((ex, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0",
                borderBottom: i < exerciseSummaries.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <span style={{ fontSize: "12px", color: "#aaa" }}>{ex.name}</span>
                  {ex.isPR && (
                    <span style={{ fontSize: "8px", background: "#f59e0b", color: "#111", borderRadius: "4px", padding: "1px 5px", fontWeight: "700" }}>
                      PR
                    </span>
                  )}
                </div>
                <span style={{ fontSize: "11px", color: "#666" }}>
                  {ex.sets} sets
                  {ex.topWeight && !ex.bodyweight && ` · ${ex.topWeight} lbs`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Dismiss */}
        <div style={{ padding: "18px 22px 32px" }}>
          <button
            onClick={handleDismiss}
            style={{
              width: "100%", background: "#f7f6f3", color: "#111",
              border: "none", borderRadius: "10px", padding: "15px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer", ...F,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
