import { useState, useEffect, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

function useTimer(initialSeconds, onComplete) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            // Vibrate on completion
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            onComplete && onComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function start() { setSeconds(initialSeconds); setRunning(true); }
  function pause() { setRunning(false); clearInterval(intervalRef.current); }
  function resume() { setRunning(true); }
  function reset() { setRunning(false); setSeconds(initialSeconds); clearInterval(intervalRef.current); }

  return { seconds, running, start, pause, resume, reset };
}

function DrillTimer({ duration, onDone }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
            onDone && onDone();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const pct = ((duration - timeLeft) / duration) * 100;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (done) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#2d7a1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>✓</div>
        <span style={{ fontSize: "12px", color: "#2d7a1e", fontWeight: "600" }}>Done!</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "10px" }}>
      {/* Progress arc */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ position: "relative", width: "52px", height: "52px" }}>
          <svg viewBox="0 0 52 52" style={{ position: "absolute", top: 0, left: 0, width: "52px", height: "52px", transform: "rotate(-90deg)" }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="#f0f0f0" strokeWidth="4" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="#2563a8" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1a1a1a", ...F }}>
              {mins > 0 ? `${mins}:${secs.toString().padStart(2,"0")}` : secs}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {!running ? (
            <button onClick={() => setRunning(true)} style={{ background: "#2563a8", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
              {timeLeft === duration ? "Start" : "Resume"}
            </button>
          ) : (
            <button onClick={() => { setRunning(false); clearInterval(intervalRef.current); }} style={{ background: "#f0f0f0", color: "#555", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
              Pause
            </button>
          )}
          <button onClick={() => { setRunning(false); setTimeLeft(duration); clearInterval(intervalRef.current); }} style={{ background: "none", color: "#aaa", border: "1px solid #e0e0e0", borderRadius: "20px", padding: "8px 14px", fontSize: "12px", cursor: "pointer", ...F }}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WarmUp({ warmup, onComplete }) {
  const [started, setStarted] = useState(false);
  const [currentDrill, setCurrentDrill] = useState(0);
  const [completedDrills, setCompletedDrills] = useState([]);
  const [allDone, setAllDone] = useState(false);

  if (!warmup) return null;

  const drills = warmup.drills;
  const totalTime = drills.reduce((acc, d) => acc + d.duration, 0);
  const totalMins = Math.ceil(totalTime / 60);

  if (allDone) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔥</div>
        <div style={{ fontSize: "20px", fontWeight: "normal", marginBottom: "6px" }}>Warm-Up Complete</div>
        <div style={{ fontSize: "13px", color: "#777", marginBottom: "20px" }}>
          Muscles are primed and ready. Get into the main session.
        </div>
        <button onClick={onComplete} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "14px 28px", fontSize: "14px", cursor: "pointer", ...F }}>
          Start Session →
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={{ padding: "16px 16px 30px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Before You Lift</div>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "8px" }}>{warmup.label}</div>
        <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.6", marginBottom: "16px", background: "#f5f5f3", borderRadius: "7px", padding: "10px 12px" }}>
          {warmup.intro}
        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 14px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>Drills</div>
            <div style={{ fontSize: "18px", fontWeight: "700" }}>{drills.length}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 14px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>Time</div>
            <div style={{ fontSize: "18px", fontWeight: "700" }}>{totalMins} min</div>
          </div>
        </div>

        {/* Drill list preview */}
        {drills.map((drill, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#aaa", flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "500" }}>{drill.name}</div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>{drill.duration}s</div>
            </div>
          </div>
        ))}

        <button onClick={() => setStarted(true)} style={{ width: "100%", marginTop: "16px", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "14px", cursor: "pointer", ...F }}>
          Begin Warm-Up
        </button>
        <button onClick={onComplete} style={{ width: "100%", marginTop: "8px", background: "transparent", color: "#aaa", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "11px", fontSize: "12px", cursor: "pointer", ...F }}>
          Skip and go straight to workout
        </button>
      </div>
    );
  }

  const drill = drills[currentDrill];
  const isDrillDone = completedDrills.includes(currentDrill);

  function markDone() {
    if (!completedDrills.includes(currentDrill)) {
      setCompletedDrills(prev => [...prev, currentDrill]);
    }
  }

  function goNext() {
    if (currentDrill < drills.length - 1) {
      setCurrentDrill(currentDrill + 1);
    } else {
      setAllDone(true);
    }
  }

  return (
    <div style={{ padding: "16px 16px 30px" }}>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
        <div style={{ flex: 1, height: "4px", background: "#f0f0f0", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "#2563a8", borderRadius: "2px", width: `${((completedDrills.length) / drills.length) * 100}%`, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: "11px", color: "#aaa", whiteSpace: "nowrap" }}>{completedDrills.length}/{drills.length}</span>
      </div>

      {/* Drill selector dots */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", justifyContent: "center" }}>
        {drills.map((_, i) => (
          <button key={i} onClick={() => setCurrentDrill(i)} style={{
            width: "8px", height: "8px", borderRadius: "50%", border: "none", cursor: "pointer",
            background: completedDrills.includes(i) ? "#2d7a1e" : i === currentDrill ? "#2563a8" : "#e0e0e0",
          }} />
        ))}
      </div>

      {/* Current drill */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", background: "#f9f9f7" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "2px" }}>
                Drill {currentDrill + 1} of {drills.length}
              </div>
              <div style={{ fontSize: "17px", fontWeight: "600" }}>{drill.name}</div>
            </div>
            {isDrillDone && (
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#2d7a1e", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px" }}>✓</div>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.7", marginBottom: "12px" }}>
            {drill.instruction}
          </div>
          <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.55", background: "#f5f5f3", borderRadius: "6px", padding: "8px 10px", marginBottom: "12px" }}>
            <strong style={{ color: "#555" }}>Why: </strong>{drill.why}
          </div>

          <DrillTimer key={currentDrill} duration={drill.duration} onDone={markDone} />
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px" }}>
        {currentDrill > 0 && (
          <button onClick={() => setCurrentDrill(currentDrill - 1)} style={{ flex: 1, background: "#f5f5f3", color: "#555", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>
            ← Back
          </button>
        )}
        <button
          onClick={() => { markDone(); goNext(); }}
          style={{ flex: 2, background: currentDrill === drills.length - 1 ? "#2d7a1e" : "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}
        >
          {currentDrill === drills.length - 1 ? "Finish Warm-Up ✓" : "Next Drill →"}
        </button>
      </div>
    </div>
  );
}
