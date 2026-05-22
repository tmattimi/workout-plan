import { useState, useEffect, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export function parseRestSeconds(restStr) {
  if (!restStr || restStr === "—") return null;
  if (restStr.includes("min")) {
    // Handle ranges like "2–3 min" — use the lower bound
    const match = restStr.match(/(\d+)/);
    if (match) return parseInt(match[1]) * 60;
  }
  if (restStr.includes("sec")) {
    const match = restStr.match(/(\d+)/);
    if (match) return parseInt(match[1]);
  }
  return 90;
}

export default function RestTimer({ seconds, onDone, onDismiss, nextExercise }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [total, setTotal] = useState(seconds);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef(null);
  const doneRef = useRef(false);
  const audioCtxRef = useRef(null);

  // Gentle beep using Web Audio API
  function playBeep(freq = 880, duration = 0.12, vol = 0.3) {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  function playDoneSound() {
    setTimeout(() => playBeep(660, 0.15, 0.4), 0);
    setTimeout(() => playBeep(880, 0.15, 0.4), 180);
    setTimeout(() => playBeep(1100, 0.25, 0.5), 360);
  }

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          // Countdown beeps at 3, 2, 1
          if (t <= 4 && t > 1) playBeep(440, 0.08, 0.2);
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (!doneRef.current) {
              doneRef.current = true;
              playDoneSound();
              if (navigator.vibrate) navigator.vibrate([300, 100, 300, 100, 500]);
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

  function addTime(extraSecs) {
    doneRef.current = false;
    setTimeLeft(t => t + extraSecs);
    setTotal(t => t + extraSecs);
    setRunning(true);
  }

  const pct = Math.min(100, ((total - timeLeft) / total) * 100);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isOvertime = timeLeft === 0;
  const isAlmostDone = timeLeft <= 10 && timeLeft > 0;

  const ringColor = isOvertime ? "#4ade80" : isAlmostDone ? "#facc15" : "#4ade80";
  const bgColor = isOvertime ? "#1a4a1a" : "#111";

  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 640,
      background: bgColor,
      color: "#fff",
      zIndex: 1000,
      boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
      transition: "background 0.4s",
    }}>
      {/* Progress bar at top */}
      <div style={{ height: "3px", background: "rgba(255,255,255,0.1)" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: ringColor,
          transition: "width 0.9s linear",
          borderRadius: "0 2px 2px 0",
        }} />
      </div>

      <div style={{ padding: "14px 18px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Ring timer */}
        <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
          <svg viewBox="0 0 56 56" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle cx="28" cy="28" r="24" fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.9s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isOvertime ? (
              <span style={{ fontSize: "20px" }}>✓</span>
            ) : (
              <span style={{ fontSize: "13px", fontWeight: "700", ...F, color: isAlmostDone ? "#facc15" : "#fff" }}>
                {mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : secs}
              </span>
            )}
          </div>
        </div>

        {/* Center text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>
            {isOvertime ? "Rest complete" : isAlmostDone ? "Almost there..." : "Rest"}
          </div>
          {nextExercise ? (
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Next: {nextExercise}
            </div>
          ) : (
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>
              {isOvertime ? "Tap to dismiss" : `${mins > 0 ? `${mins}m ` : ""}${secs}s remaining`}
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: "7px", flexShrink: 0, alignItems: "center" }}>
          {/* +30s */}
          {!isOvertime && (
            <button
              onClick={() => addTime(30)}
              style={{
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "20px", padding: "6px 10px",
                fontSize: "11px", cursor: "pointer", ...F,
              }}
            >
              +30s
            </button>
          )}
          {/* Pause/resume */}
          {!isOvertime && (
            <button
              onClick={() => {
                if (running) clearInterval(intervalRef.current);
                setRunning(r => !r);
              }}
              style={{
                background: "rgba(255,255,255,0.1)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "20px", padding: "6px 10px",
                fontSize: "11px", cursor: "pointer", ...F,
              }}
            >
              {running ? "Pause" : "Resume"}
            </button>
          )}
          {/* Skip / Let's go */}
          <button
            onClick={onDismiss}
            style={{
              background: isOvertime ? "#4ade80" : "rgba(255,255,255,0.12)",
              color: isOvertime ? "#111" : "#fff",
              border: "none",
              borderRadius: "20px", padding: "6px 14px",
              fontSize: "11px", cursor: "pointer", ...F,
              fontWeight: isOvertime ? "700" : "400",
            }}
          >
            {isOvertime ? "Let's go" : "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
