import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const BODY_AREAS = [
  { id: "lower_back", label: "Lower Back" },
  { id: "knee", label: "Knee" },
  { id: "shoulder", label: "Shoulder" },
  { id: "hip", label: "Hip / Glute" },
  { id: "wrist", label: "Wrist / Elbow" },
  { id: "ankle", label: "Ankle / Foot" },
  { id: "neck", label: "Neck / Upper Trap" },
  { id: "hamstring", label: "Hamstring" },
  { id: "other", label: "Other" },
];

const MODIFICATIONS = {
  lower_back: {
    avoid: ["Romanian Deadlift", "Deadlift", "Hip Thrust", "Good Morning", "Back Squat"],
    swap: [
      { from: "Romanian Deadlift", to: "Leg Curl (machine)", why: "No spinal loading" },
      { from: "Hip Thrust", to: "Glute Bridge (bodyweight)", why: "Lower load, same activation" },
      { from: "Back Squat", to: "Leg Press", why: "Removes axial spine compression" },
    ],
    tips: [
      "Avoid heavy hip hinge movements until pain-free",
      "Focus on core anti-extension work: plank, dead bug",
      "Keep spine neutral on all exercises — stop if you feel it in your back",
      "Ice 15–20 min after sessions if inflamed",
    ],
  },
  knee: {
    avoid: ["Leg Extension", "Bulgarian Split Squat", "Lunge", "Box Jump"],
    swap: [
      { from: "Bulgarian Split Squat", to: "Leg Press (feet high)", why: "Less knee flexion stress" },
      { from: "Leg Extension", to: "Terminal Knee Extension (band)", why: "Low-load quad at safe angle" },
      { from: "Squat", to: "Goblet Squat (partial range)", why: "Controlled depth" },
    ],
    tips: [
      "Avoid knee flexion past 90° until pain-free",
      "Keep the knee tracking directly over the second toe",
      "Strengthen hips — weak glutes often overload the knee",
      "Avoid running and jumping until cleared",
    ],
  },
  shoulder: {
    avoid: ["Overhead Press", "Behind-the-Neck Press", "Upright Row", "Dip"],
    swap: [
      { from: "Overhead Press", to: "Landmine Press", why: "Shoulder-friendly arc" },
      { from: "Lateral Raise", to: "Cable Lateral (lower anchor)", why: "Constant tension, less impingement" },
      { from: "Bench Press", to: "DB Press (neutral grip)", why: "Reduces shoulder external rotation" },
    ],
    tips: [
      "Prioritize face pulls and rear delt work to restore balance",
      "Avoid overhead movements until pain-free through full range",
      "Keep chest stretches and doorway stretches daily",
      "Check scapular retraction cue on all pressing movements",
    ],
  },
  hip: {
    avoid: ["Hip Thrust", "Squat", "Lunge", "Deadlift"],
    swap: [
      { from: "Hip Thrust", to: "Clamshell (band)", why: "No hip flexion loading" },
      { from: "Squat", to: "Seated Leg Press (shallow)", why: "Controlled hip angle" },
    ],
    tips: [
      "Avoid deep hip flexion under load",
      "Hip flexor stretching and glute activation work daily",
      "Check if piriformis or IT band tightness is a factor",
      "Try pool walking or bike for active recovery",
    ],
  },
  wrist: {
    avoid: ["Barbell Curl", "Front Squat", "Pushup"],
    swap: [
      { from: "Barbell Curl", to: "Hammer Curl (neutral grip)", why: "Neutral wrist position" },
      { from: "Pushup", to: "Pushup on fists or handles", why: "Keeps wrist neutral" },
      { from: "DB Press", to: "DB Press with neutral grip", why: "Less wrist extension stress" },
    ],
    tips: [
      "Use wrist wraps for pressing movements short-term",
      "Neutral grip (thumb up) reduces wrist stress significantly",
      "Avoid loaded wrist extension — modify all pressing movements",
      "Wrist circles and forearm stretches daily",
    ],
  },
  ankle: {
    avoid: ["Standing Calf Raise", "Box Jump", "Lunge", "Running"],
    swap: [
      { from: "Standing Calf Raise", to: "Seated Calf Raise", why: "Less ankle range required" },
      { from: "Lunge", to: "Leg Press", why: "No ankle instability risk" },
    ],
    tips: [
      "Avoid loaded dorsiflexion until pain-free",
      "Single-leg balance work for ankle stability",
      "Keep upper body and seated lower body work going",
      "Ankle circles, alphabet writing with foot daily",
    ],
  },
  neck: {
    avoid: ["Shrug", "Behind-neck Press", "Chin Tuck under load"],
    swap: [
      { from: "Barbell Shrug", to: "Scapular Retraction (band)", why: "No cervical compression" },
    ],
    tips: [
      "Avoid loading the neck directly",
      "Check head position in all pressing and pulling — chin tucked",
      "Neck stretches, levator scapulae release daily",
      "If pain radiates into the arm, stop training and see a doctor",
    ],
  },
  hamstring: {
    avoid: ["Romanian Deadlift", "Good Morning", "Nordic Curl"],
    swap: [
      { from: "Romanian Deadlift", to: "Leg Curl (machine, partial range)", why: "Controlled load, no stretch pain" },
      { from: "Nordic Curl", to: "Glute-Ham Bridge", why: "Isometric instead of eccentric" },
    ],
    tips: [
      "Avoid full hamstring stretch under load during early recovery",
      "Start with isometric holds before eccentric loading",
      "Progress to machine leg curls before free weight hinge work",
      "Hamstring strains reinjure easily — build back slowly",
    ],
  },
  other: {
    avoid: [],
    swap: [],
    tips: [
      "Train around the pain — don't train through sharp pain",
      "If pain is new, sharp, or getting worse, stop and see a physical therapist",
      "Modify range of motion before reducing load",
      "Active recovery keeps blood flow going without stressing the injury",
    ],
  },
};

function loadInjuries() {
  try { return JSON.parse(localStorage.getItem("injuries_v1") || "[]"); } catch { return []; }
}
function saveInjuries(d) {
  try { localStorage.setItem("injuries_v1", JSON.stringify(d)); } catch {}
}

export default function InjuryAwareness() {
  const [injuries, setInjuries] = useState(loadInjuries);
  const [selected, setSelected] = useState(null);

  useEffect(() => { saveInjuries(injuries); }, [injuries]);

  function toggleArea(id) {
    setInjuries(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setSelected(id);
  }

  const mods = selected ? MODIFICATIONS[selected] : null;

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Disclaimer */}
      <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: "#7a5010", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Important</div>
        <div style={{ fontSize: "11px", color: "#7a5010", lineHeight: "1.6" }}>
          Tara Mattimiro is a personal trainer, not a physical therapist. The modifications here are general guidelines only. If you are experiencing pain, consult a licensed physical therapist or physician before continuing training.
        </div>
      </div>

      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>
        Flag an area of discomfort
      </div>

      {/* Body area selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "18px" }}>
        {BODY_AREAS.map(area => {
          const active = injuries.includes(area.id);
          return (
            <button key={area.id} onClick={() => toggleArea(area.id)} style={{
              background: active ? "#111" : selected === area.id ? "#f0f0f0" : "#fafaf8",
              color: active ? "#f7f6f3" : selected === area.id ? "#111" : "#555",
              border: "1px solid " + (active ? "#111" : selected === area.id ? "#ccc" : "#e0e0e0"),
              borderRadius: "20px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", ...F,
            }}>
              {active ? "✓ " : ""}{area.label}
            </button>
          );
        })}
      </div>

      {/* Modifications panel */}
      {selected && mods && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>
            {BODY_AREAS.find(a => a.id === selected)?.label} — Modifications
          </div>

          {mods.avoid.length > 0 && (
            <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#a02020", marginBottom: "8px" }}>Avoid or reduce</div>
              {mods.avoid.map((ex, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#a02020", marginBottom: "3px" }}>— {ex}</div>
              ))}
            </div>
          )}

          {mods.swap.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Suggested swaps</div>
              {mods.swap.map((s, i) => (
                <div key={i} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: i < mods.swap.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "12px", color: "#a02020", textDecoration: "line-through" }}>{s.from}</span>
                    <span style={{ color: "#ccc" }}>→</span>
                    <span style={{ fontSize: "12px", color: "#2d7a1e", fontWeight: "600" }}>{s.to}</span>
                  </div>
                  <div style={{ fontSize: "10px", color: "#999" }}>{s.why}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2d5a1e", marginBottom: "8px" }}>Guidelines</div>
            {mods.tips.map((tip, i) => (
              <div key={i} style={{ fontSize: "12px", color: "#2d5a1e", marginBottom: "5px", lineHeight: "1.5", display: "flex", gap: "6px" }}>
                <span>·</span><span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {injuries.length === 0 && !selected && (
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", ...F }}>
          <div style={{ fontSize: "13px" }}>No areas flagged</div>
          <div style={{ fontSize: "11px", marginTop: "4px" }}>Tap an area above if you have pain or discomfort</div>
        </div>
      )}

      {injuries.length > 0 && (
        <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10px", color: "#999", marginBottom: "6px" }}>Currently flagged:</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {injuries.map(id => {
              const area = BODY_AREAS.find(a => a.id === id);
              return (
                <span key={id} style={{ background: "#111", color: "#f7f6f3", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", ...F }}>
                  {area?.label}
                </span>
              );
            })}
          </div>
          <button onClick={() => { setInjuries([]); setSelected(null); }} style={{ background: "none", border: "none", color: "#bbb", fontSize: "10px", cursor: "pointer", marginTop: "8px", ...F }}>
            Clear all flags
          </button>
        </div>
      )}

      <div style={{ marginTop: "20px", padding: "14px", background: "#f5f5f3", borderRadius: "7px" }}>
        <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.7", ...F }}>
          <strong>Rule of thumb:</strong> Train around pain, never through it. Sharp, sudden, or worsening pain means stop. Dull, muscular soreness from previous sessions is normal — joint or tendon pain is not. When in doubt, rest and see a professional.
        </div>
      </div>
    </div>
  );
}
