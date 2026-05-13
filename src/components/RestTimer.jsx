import { useState, useEffect, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Parse rest string like "2–3 min" or "90 sec" into seconds
export function parseRestSeconds(restStr) {
  if (!restStr || restStr === "—") return null;
  if (restStr.includes("min")) {
    const match = restStr.match(/(\d+)/);
    if (match) return parseInt(match[1]) * 60;
  }
  if (restStr.includes("sec")) {
    const match = restStr.match(/(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return 90; // default
}

export default function RestTimer({ seconds, onDone, onDismiss }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!doneRef.current) {
              doneRef.current = true;
              if (navigator.vibrate) navigator.vibrate([400, 100, 400, 100, 400]);
              onDone && onDone();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((seconds - timeLeft) / seconds) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isOvertime = timeLeft === 0;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 640,
      background: isOvertime ? "#2d7a1e" : "#111",
      color: "#fff", padding: "14px 20px",
      display: "flex", alignItems: "center", gap: "14px",
      zIndex: 1000, boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
      transition: "background 0.3s",
    }}>
      {/* Ring */}
      <div style={{ position: "relative", width: "52px", height: "52px", flexShrink: 0 }}>
        <svg viewBox="0 0 52 52" style={{ position: "absolute", inset: 0, width: "52px", height: "52px", transform: "rotate(-90deg)" }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
          <circle cx="26" cy="26" r="22" fill="none"
            stroke={isOvertime ? "#fff" : "#4ade80"}
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isOvertime ? (
            <span style={{ fontSize: "18px" }}>🔔</span>
          ) : (
            <span style={{ fontSize: "13px", fontWeight: "700", ...F }}>
              {mins > 0 ? `${mins}:${secs.toString().padStart(2,"0")}` : secs}
            </span>
          )}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>
          {isOvertime ? "Rest complete — next set!" : "Resting..."}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
          {isOvertime ? "Tap to dismiss" : `${mins > 0 ? `${mins}m ` : ""}${secs}s remaining`}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        {!isOvertime && (
          <button
            onClick={() => { setRunning(!running); if (running) clearInterval(intervalRef.current); }}
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: "20px", padding: "7px 12px", fontSize: "11px", cursor: "pointer", ...F }}
          >
            {running ? "Pause" : "Resume"}
          </button>
        )}
        <button
          onClick={onDismiss}
          style={{ background: isOvertime ? "#fff" : "rgba(255,255,255,0.15)", color: isOvertime ? "#2d7a1e" : "#fff", border: "none", borderRadius: "20px", padding: "7px 12px", fontSize: "11px", cursor: "pointer", ...F, fontWeight: isOvertime ? "700" : "400" }}
        >
          {isOvertime ? "Let's go" : "Skip"}
        </button>
      </div>
    </div>
  );
}
