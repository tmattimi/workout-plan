import { useState, useEffect, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Shared timer ring ─────────────────────────────────────────────────────────
function TimerRing({ seconds, total, accent = "#2563a8" }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, seconds / total);
  const offset = circ * (1 - pct);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} fill="none" stroke="#ebebeb" strokeWidth="4" />
      <circle
        cx="32" cy="32" r={r} fill="none" stroke={accent} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}
      />
      <text x="32" y="37" textAnchor="middle" fill="#1a1a1a" fontSize="13" fontFamily="Georgia, serif" fontWeight="600">
        {mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : secs}
      </text>
    </svg>
  );
}

// ── Checkmark circle ──────────────────────────────────────────────────────────
function CheckCircle({ accent = "#2d7a1e" }) {
  return (
    <div style={{
      width: "28px", height: "28px", borderRadius: "50%",
      background: accent, display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0,
    }}>
      <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
        <path d="M1 4L4.5 7.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Main SessionFlow component ────────────────────────────────────────────────
// steps: [{ name, duration, instruction, note?, label? }]
// label: what to call a step (e.g. "Drill" or "Stretch")
// accent: theme color
// intro: { title, subtitle, totalLabel }
// completion: { headline, body, scripture? }
// onDone: called when user finishes
export default function SessionFlow({
  steps = [],
  label = "Step",
  accent = "#2563a8",
  intro,
  completion,
  onDone,
  onSkip,
}) {
  const [phase, setPhase] = useState("intro"); // intro | active | done
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(steps[0]?.duration || 30);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const current = steps[step];

  // Reset timer when step changes
  useEffect(() => {
    clearInterval(intervalRef.current);
    setTimeLeft(steps[step]?.duration || 30);
    setRunning(false);
  }, [step]);

  // Countdown
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          markDone();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function markDone() {
    setCompleted(prev => new Set([...prev, step]));
  }

  function goTo(i) {
    clearInterval(intervalRef.current);
    setStep(i);
  }

  function goNext() {
    markDone();
    if (step < steps.length - 1) {
      goTo(step + 1);
    } else {
      setPhase("done");
    }
  }

  function goPrev() {
    if (step > 0) goTo(step - 1);
  }

  if (!steps.length) return null;

  // ── Intro screen ─────────────────────────────────────────────────────────────
  if (phase === "intro") {
    const totalSecs = steps.reduce((a, s) => a + s.duration, 0);
    const totalMins = Math.ceil(totalSecs / 60);
    return (
      <div style={{ padding: "20px 16px 32px", ...F }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", marginBottom: "4px" }}>
          {intro?.subtitle || label}
        </div>
        <div style={{ fontSize: "20px", fontWeight: "normal", marginBottom: "16px" }}>
          {intro?.title || `${label} Routine`}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <div style={{ flex: 1, background: "#f5f5f3", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "4px" }}>
              {label}s
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a" }}>{steps.length}</div>
          </div>
          <div style={{ flex: 1, background: "#f5f5f3", borderRadius: "8px", padding: "12px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: "4px" }}>
              Time
            </div>
            <div style={{ fontSize: "20px", fontWeight: "700", color: "#1a1a1a" }}>{totalMins} min</div>
          </div>
        </div>

        {/* Step list */}
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", flexShrink: 0, fontWeight: "600" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "500", color: "#1a1a1a" }}>{s.label || s.name}</div>
              {s.note && <div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px" }}>{s.note}</div>}
            </div>
            <div style={{ fontSize: "10px", color: "#bbb" }}>{s.duration}s</div>
          </div>
        ))}

        <button
          onClick={() => setPhase("active")}
          style={{ width: "100%", marginTop: "20px", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "15px", fontSize: "14px", cursor: "pointer", ...F }}
        >
          Begin
        </button>
        {onSkip && (
          <button
            onClick={onSkip}
            style={{ width: "100%", marginTop: "8px", background: "transparent", color: "#bbb", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px", fontSize: "12px", cursor: "pointer", ...F }}
          >
            Skip
          </button>
        )}
      </div>
    );
  }

  // ── Completion screen ─────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div style={{ padding: "40px 20px 32px", textAlign: "center", ...F }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
            <path d="M1 6L6.5 11.5L17 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "6px" }}>
          {completion?.headline || "Done"}
        </div>
        <div style={{ fontSize: "12px", color: "#777", lineHeight: "1.65", marginBottom: completion?.scripture ? "16px" : "24px" }}>
          {completion?.body || "Well done."}
        </div>
        {completion?.scripture && (
          <div style={{ fontSize: "11px", fontStyle: "italic", color: "#999", padding: "10px 16px", background: "#f5f5f3", borderRadius: "8px", lineHeight: "1.6", marginBottom: "24px" }}>
            "{completion.scripture.verse}" — {completion.scripture.ref}
          </div>
        )}
        <button
          onClick={onDone}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "13px 32px", fontSize: "13px", cursor: "pointer", ...F }}
        >
          {completion?.cta || "Done"}
        </button>
      </div>
    );
  }

  // ── Active step screen ────────────────────────────────────────────────────────
  const isDone = completed.has(step);

  return (
    <div style={{ padding: "16px", ...F }}>
      {/* Progress bar + counter */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ flex: 1, height: "3px", background: "#ebebeb", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: accent, borderRadius: "2px", width: `${(completed.size / steps.length) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: "10px", color: "#bbb", whiteSpace: "nowrap" }}>
          {completed.size}/{steps.length}
        </span>
      </div>

      {/* Step dots */}
      <div style={{ display: "flex", gap: "5px", justifyContent: "center", marginBottom: "16px" }}>
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: "8px", height: "8px", borderRadius: "50%", border: "none",
              cursor: "pointer", padding: 0, transition: "background 0.2s",
              background: completed.has(i) ? accent : i === step ? "#1a1a1a" : "#e0e0e0",
            }}
          />
        ))}
      </div>

      {/* Step card */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>

        {/* Card header */}
        <div style={{ padding: "14px 16px", background: "#f9f9f7", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", marginBottom: "3px" }}>
              {label} {step + 1} of {steps.length}
            </div>
            <div style={{ fontSize: "17px", fontWeight: "600", color: "#1a1a1a" }}>
              {current.label || current.name}
            </div>
            {current.note && (
              <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{current.note}</div>
            )}
          </div>
          {isDone && <CheckCircle accent={accent} />}
        </div>

        {/* Card body */}
        <div style={{ padding: "16px" }}>
          {/* Instruction */}
          <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.75", marginBottom: "16px" }}>
            {current.instruction}
          </div>

          {/* Timer + controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <TimerRing seconds={timeLeft} total={current.duration} accent={accent} />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setRunning(r => !r)}
                style={{
                  background: running ? "#f0f0f0" : accent,
                  color: running ? "#555" : "#fff",
                  border: "none", borderRadius: "20px",
                  padding: "8px 18px", fontSize: "12px", cursor: "pointer", ...F,
                }}
              >
                {running ? "Pause" : timeLeft === current.duration ? "Start" : "Resume"}
              </button>
              <button
                onClick={() => { clearInterval(intervalRef.current); setTimeLeft(current.duration); setRunning(false); }}
                style={{ background: "none", color: "#bbb", border: "1px solid #e8e8e8", borderRadius: "20px", padding: "8px 14px", fontSize: "12px", cursor: "pointer", ...F }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Up next */}
      {step < steps.length - 1 && (
        <div style={{ padding: "10px 14px", background: "#f5f5f3", borderRadius: "8px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "9px", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "2px" }}>Up next</div>
            <div style={{ fontSize: "12px", color: "#555" }}>{steps[step + 1]?.label || steps[step + 1]?.name}</div>
          </div>
          <div style={{ fontSize: "10px", color: "#bbb" }}>{steps[step + 1]?.duration}s</div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px" }}>
        {step > 0 && (
          <button
            onClick={goPrev}
            style={{ flex: 1, background: "#f5f5f3", color: "#555", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: "pointer", ...F }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={goNext}
          style={{
            flex: 2, background: step === steps.length - 1 ? accent : "#111",
            color: "#fff", border: "none", borderRadius: "8px",
            padding: "13px", fontSize: "13px", cursor: "pointer", ...F,
          }}
        >
          {step === steps.length - 1 ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}
