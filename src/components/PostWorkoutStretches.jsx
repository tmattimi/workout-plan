import { useState, useEffect, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Stretches organized by muscle group targeted
const STRETCH_LIBRARY = {
  chest: [
    { name: "Doorway Chest Stretch", duration: 30, cue: "Stand in a doorway, arms at 90°. Lean forward until you feel a deep chest stretch. Keep your back straight and core braced.", side: false },
    { name: "Cross-Body Shoulder Stretch", duration: 30, cue: "Pull one arm across your chest. Hold at the elbow. Feel the rear delt and upper chest open up.", side: true },
  ],
  back: [
    { name: "Cat-Cow Stretch", duration: 45, cue: "On hands and knees. Arch your back toward the ceiling (cat), then drop your belly toward the floor (cow). Move slowly and breathe through each rep.", side: false },
    { name: "Child's Pose", duration: 45, cue: "Kneel and sit back onto your heels. Reach arms forward on the floor. Let your hips sink and feel the full lat stretch.", side: false },
    { name: "Seated Spinal Twist", duration: 30, cue: "Sit tall. Cross one leg over. Twist toward the bent knee and use your opposite elbow as a lever. Keep your spine long.", side: true },
  ],
  shoulders: [
    { name: "Cross-Body Shoulder Stretch", duration: 30, cue: "Pull one arm across your chest. Hold at the elbow. Feel the rear delt and upper back release.", side: true },
    { name: "Overhead Tricep Stretch", duration: 30, cue: "Raise one arm, bend it behind your head. Use the other hand to gently push the elbow down. Feel the long head stretch.", side: true },
    { name: "Wall Angel Stretch", duration: 30, cue: "Stand against a wall, arms at 90°. Slowly slide arms overhead while keeping them in contact with the wall. This opens the chest and anterior delt.", side: false },
  ],
  biceps: [
    { name: "Wrist Flexor Stretch", duration: 30, cue: "Extend one arm, palm up. Use your other hand to gently pull your fingers back. Feel the stretch along the forearm and bicep.", side: true },
  ],
  triceps: [
    { name: "Overhead Tricep Stretch", duration: 30, cue: "Raise one arm, bend it behind your head. Use the other hand to gently push the elbow down. Hold and breathe.", side: true },
  ],
  quads: [
    { name: "Standing Quad Stretch", duration: 30, cue: "Stand on one leg, pull the other foot toward your glute. Keep your knees together and stand tall. Use a wall for balance if needed.", side: true },
    { name: "Couch Stretch", duration: 45, cue: "Kneel near a wall. Place one foot up the wall behind you, front foot forward. Squeeze your glute and tuck your hips under. This is a deep hip flexor and quad stretch.", side: true },
  ],
  hamstrings: [
    { name: "Standing Forward Fold", duration: 45, cue: "Stand with feet hip-width. Hinge forward from the hips. Let your upper body hang heavy. Bend your knees slightly if needed. Breathe deeply.", side: false },
    { name: "Supine Hamstring Stretch", duration: 45, cue: "Lie on your back. Pull one leg toward your chest, keeping it as straight as possible. A strap or towel helps. Hold the stretch at the end of your range.", side: true },
  ],
  glutes: [
    { name: "Figure-Four Stretch (Pigeon)", duration: 45, cue: "Lie on your back. Cross one ankle over your opposite knee. Pull both legs toward your chest. Feel the deep glute stretch.", side: true },
    { name: "Hip Flexor Lunge Stretch", duration: 40, cue: "Kneel in a low lunge. Sink your hips forward and down. Keep your front shin vertical. Squeeze the rear glute to deepen the stretch.", side: true },
  ],
  calves: [
    { name: "Wall Calf Stretch", duration: 30, cue: "Hands on a wall, one foot back with heel flat on the floor. Lean into the wall. Keep your back leg straight for gastroc, slightly bent for soleus.", side: true },
  ],
  core: [
    { name: "Cobra Stretch", duration: 30, cue: "Lie face down. Place your hands under your shoulders. Press up, keeping hips on the floor. Look up and let your abs lengthen.", side: false },
    { name: "Kneeling Hip Flexor Stretch", duration: 40, cue: "Kneel on one knee. Drive your hips forward while keeping your chest tall. You should feel the stretch at the front of the hip of the kneeling leg.", side: true },
  ],
};

// Map session muscle groups to stretch groups
const MUSCLE_MAP = {
  chest: "chest", back: "back", shoulders: "shoulders",
  biceps: "biceps", triceps: "triceps", quads: "quads",
  hamstrings: "hamstrings", glutes: "glutes", calves: "calves",
  core: "core", legs: ["quads", "hamstrings", "glutes"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
};

function buildStretchRoutine(muscles = []) {
  const groups = new Set();
  muscles.forEach(m => {
    const key = m.toLowerCase();
    const mapped = MUSCLE_MAP[key];
    if (Array.isArray(mapped)) mapped.forEach(g => groups.add(g));
    else if (mapped) groups.add(mapped);
  });

  // Default if nothing matched
  if (groups.size === 0) {
    groups.add("chest");
    groups.add("back");
    groups.add("shoulders");
  }

  const routine = [];
  groups.forEach(group => {
    const stretches = STRETCH_LIBRARY[group] || [];
    // Pick the first stretch, and if it's bilateral, just add it once
    stretches.slice(0, 1).forEach(s => {
      if (s.side) {
        routine.push({ ...s, group, label: `${s.name} (Left)`, isLeft: true });
        routine.push({ ...s, group, label: `${s.name} (Right)`, isLeft: false });
      } else {
        routine.push({ ...s, group, label: s.name });
      }
    });
  });

  return routine;
}

function CountdownRing({ seconds, total }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const progress = Math.max(0, seconds / total);
  const offset = circ * (1 - progress);
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={radius} fill="none" stroke="#333" strokeWidth="4" />
      <circle
        cx="30" cy="30" r={radius}
        fill="none" stroke="#4ade80" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 1s linear" }}
      />
      <text x="30" y="35" textAnchor="middle" fill="#fff" fontSize="14" fontFamily="Georgia, serif">{seconds}</text>
    </svg>
  );
}

export default function PostWorkoutStretches({ muscles = [], onDone }) {
  const routine = buildStretchRoutine(muscles);
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(routine[0]?.duration || 30);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const intervalRef = useRef(null);
  const current = routine[step];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            // Auto advance
            if (step < routine.length - 1) {
              setTimeout(() => {
                setStep(s => s + 1);
                setTimeLeft(routine[step + 1]?.duration || 30);
                setRunning(false);
              }, 500);
            } else {
              setComplete(true);
              setRunning(false);
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, step]);

  function goTo(i) {
    clearInterval(intervalRef.current);
    setStep(i);
    setTimeLeft(routine[i]?.duration || 30);
    setRunning(false);
    setComplete(false);
  }

  if (!routine.length) return null;

  if (complete) {
    return (
      <div style={{ ...F, padding: "32px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🙏</div>
        <div style={{ fontSize: "16px", color: "#1a1a1a", marginBottom: "6px" }}>Well done.</div>
        <div style={{ fontSize: "12px", color: "#666", marginBottom: "24px", lineHeight: "1.6" }}>
          You honored your body today. Rest well and recover strong.
        </div>
        <div style={{ fontSize: "11px", fontStyle: "italic", color: "#888", marginBottom: "24px", padding: "10px 16px", background: "#f7f6f3", borderRadius: "8px" }}>
          "Do you not know that your body is a temple of the Holy Spirit?" — 1 Cor 6:19
        </div>
        <button onClick={onDone} style={{
          ...F, background: "#111", color: "#fff", border: "none",
          borderRadius: "8px", padding: "12px 28px", fontSize: "13px", cursor: "pointer",
        }}>
          Finish
        </button>
      </div>
    );
  }

  return (
    <div style={{ ...F, background: "#f7f6f3", minHeight: "100%" }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: "5px", justifyContent: "center", padding: "16px 16px 8px" }}>
        {routine.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: i === step ? "#111" : i < step ? "#4ade80" : "#ddd",
            border: "none", cursor: "pointer", padding: 0,
            transition: "background 0.2s",
          }} />
        ))}
      </div>

      {/* Step counter */}
      <div style={{ textAlign: "center", fontSize: "9px", color: "#999", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "10px" }}>
        Stretch {step + 1} of {routine.length}
      </div>

      {/* Main card */}
      <div style={{ margin: "0 16px 16px", background: "#111", borderRadius: "14px", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#666", marginBottom: "8px" }}>
          {current.group?.toUpperCase()}
        </div>
        <div style={{ fontSize: "18px", color: "#fff", marginBottom: "14px", lineHeight: "1.3" }}>
          {current.label}
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <CountdownRing seconds={timeLeft} total={current.duration} />
        </div>

        <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.7", marginBottom: "16px", textAlign: "left" }}>
          {current.cue}
        </div>

        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          <button
            onClick={() => setRunning(r => !r)}
            style={{
              ...F, background: running ? "#333" : "#4ade80",
              color: running ? "#fff" : "#111", border: "none",
              borderRadius: "8px", padding: "10px 22px", fontSize: "13px", cursor: "pointer",
            }}
          >
            {running ? "Pause" : timeLeft < current.duration ? "Resume" : "Start"}
          </button>
          {step < routine.length - 1 && (
            <button onClick={() => goTo(step + 1)} style={{
              ...F, background: "none", color: "#555", border: "1px solid #333",
              borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer",
            }}>
              Skip →
            </button>
          )}
          {step === routine.length - 1 && (
            <button onClick={() => setComplete(true)} style={{
              ...F, background: "none", color: "#555", border: "1px solid #333",
              borderRadius: "8px", padding: "10px 16px", fontSize: "13px", cursor: "pointer",
            }}>
              Finish
            </button>
          )}
        </div>
      </div>

      {/* Upcoming */}
      {step < routine.length - 1 && (
        <div style={{ margin: "0 16px", padding: "10px 14px", background: "#fff", borderRadius: "8px", border: "1px solid #eee" }}>
          <div style={{ fontSize: "9px", color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "4px" }}>Up next</div>
          <div style={{ fontSize: "12px", color: "#555" }}>{routine[step + 1]?.label} · {routine[step + 1]?.duration}s</div>
        </div>
      )}
    </div>
  );
}
