import { useState } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const MUSCLES = {
  chest: {
    label: "Chest", clinical: "Pectoralis Major & Minor", color: "#2563a8", light: "#dbeafe",
    overview: "The pectoralis major has two distinct heads with independent motor unit recruitment. Flat pressing alone is insufficient — incline work is required for complete development.",
    regions: [
      { name: "Clavicular head (upper pec)", act: "Shoulder flexion from a low angle. Active at 30–45° incline. Independent from the sternal head — flat pressing does not adequately develop it.", exs: ["Incline Dumbbell Press", "Cable Fly Low-to-High"] },
      { name: "Sternal head (lower pec)", act: "Primary force producer in flat pressing. Reaches peak stretch at the bottom of a dumbbell press — controlled eccentrics are especially effective.", exs: ["Dumbbell Bench Press", "Flat Dumbbell Fly"] },
    ],
    biomech: "EMG research confirms the clavicular head is significantly more active at 30–45° incline than flat. Dumbbell pressing allows greater range than barbell, maximizing sternal fiber stretch at the bottom.",
    vol: "10–20 weekly sets. Two sessions per week with 48–72 hours recovery. Equal flat and incline volume is the evidence-based minimum.",
    errors: ["Elbows flaring past 75° — shoulder joint stress", "Cutting range short at the bottom — removes peak stretch", "Forward shoulder roll — anterior deltoid dominates", "Scapulae not retracted — impingement risk over time"],
  },
  shoulders: {
    label: "Shoulders", clinical: "Deltoideus — Anterior, Lateral, Posterior", color: "#7c3aed", light: "#ede9fe",
    overview: "Three heads with different functions. Pressing covers the anterior head. The lateral and posterior heads require direct, targeted work.",
    regions: [
      { name: "Anterior deltoid", act: "Shoulder flexion. Heavily recruited by pressing. Direct front raises on top of heavy pressing is usually unnecessary.", exs: ["Overhead Press (indirect)", "Incline Press (indirect)"] },
      { name: "Lateral deltoid", act: "Shoulder abduction — drives width. Cable raises maintain constant tension throughout the range; dumbbells drop to near-zero at the bottom.", exs: ["Cable Lateral Raise", "Dumbbell Lateral Raise"] },
      { name: "Posterior deltoid", act: "Horizontal abduction and external rotation. Most undertrained head. Weakness contributes to anterior impingement under heavy pressing loads.", exs: ["Face Pull", "Rear Delt Fly"] },
    ],
    biomech: "Cable lateral raises are mechanically superior — the cable maintains tension perpendicular to the forearm throughout. Dumbbells produce near-zero torque at 0° abduction.",
    vol: "Lateral and posterior delts: 12–20 direct weekly sets each. Anterior gets sufficient volume from pressing.",
    errors: ["Shrugging the traps during lateral raises", "Too heavy — momentum replaces tension", "Neglecting posterior deltoid entirely", "No external rotation work alongside pressing"],
  },
  back: {
    label: "Back", clinical: "Lat. Dorsi, Trapezius, Rhomboids", color: "#16a34a", light: "#dcfce7",
    overview: "Vertical pulling (lat width) and horizontal pulling (mid-back thickness) train different muscles. Both are required — they cannot substitute for each other.",
    regions: [
      { name: "Latissimus dorsi", act: "Creates the V-taper. Full overhead elevation required for maximum stretch. Dead hang at the bottom of every pull is not optional.", exs: ["Pull-Up", "Lat Pulldown", "Straight-Arm Pulldown"] },
      { name: "Middle trapezius", act: "Scapular retraction. Most active at peak contraction of rows. The 1-second hold and squeeze at the top is critical.", exs: ["Seated Cable Row", "Chest-Supported Row"] },
      { name: "Rhomboids", act: "Retract and downwardly rotate the scapula. Most challenged at full scapular retraction — the end of a properly executed row.", exs: ["Single-Arm DB Row", "Seated Cable Row"] },
    ],
    biomech: "The lat attaches to thoracolumbar fascia, not the spine directly. Cutting the return short on pulldowns removes the stretch stimulus — equivalent to training only the concentric half.",
    vol: "15–22 weekly sets split equally between vertical and horizontal pulling. Back training supports high volume well.",
    errors: ["Cutting return short on pulldowns — no lat stretch", "Rowing with arms not elbows — bicep dominance", "Not pausing at peak scapular retraction", "Pulling the bar behind the neck"],
  },
  biceps: {
    label: "Biceps", clinical: "Biceps Brachii, Brachialis", color: "#0d9488", light: "#ccfbf1",
    overview: "Three muscles with different grip requirements. The brachialis is the strongest elbow flexor and creates the thickness that pushes the bicep upward.",
    regions: [
      { name: "Long head — the peak", act: "Creates the peak. Crosses the shoulder joint and reaches maximum stretch when the arm is behind the body. Incline curls target this specifically.", exs: ["Incline Dumbbell Curl", "Cable Curl (arm behind body)"] },
      { name: "Short head — the width", act: "Contributes to width. Supination at the top of curls specifically recruits this head.", exs: ["Alternating Dumbbell Curl", "Preacher Curl"] },
      { name: "Brachialis — the force producer", act: "Strongest elbow flexor. Pushes the bicep upward when developed. Targeted with a neutral (hammer) grip.", exs: ["Hammer Curl", "Cross-Body Curl"] },
    ],
    biomech: "Cable curls provide resistance at full arm extension, where dumbbell resistance drops to near-zero. This bottom-range tension is the primary mechanical advantage of cables.",
    vol: "12–20 weekly sets across long-head, short-head, and brachialis movements. 2–3× weekly frequency works well.",
    errors: ["Not supinating at top of curls — short head bypassed", "Torso swing — removes tension", "Short range at bottom — removes stretch", "Elbows drifting forward on incline curls"],
  },
  triceps: {
    label: "Triceps", clinical: "Triceps Brachii — Three Heads", color: "#1d4ed8", light: "#dbeafe",
    overview: "Two-thirds of upper arm mass. The long head (~55%) crosses the shoulder and can only be fully trained overhead. Pushdown-only programs neglect the majority of the muscle.",
    regions: [
      { name: "Long head — ~55% of tricep", act: "Fully stretched only with the arm overhead. Significantly more active in overhead extension than pushdowns.", exs: ["Overhead Tricep Extension", "Skull Crusher"] },
      { name: "Lateral head — the horseshoe", act: "Creates the horseshoe shape from the side. Does not cross the shoulder joint.", exs: ["Tricep Rope Pushdown", "Close-Grip Press"] },
      { name: "Medial head — the stabilizer", act: "Deep stabilizer. Always partially active. Trained through all tricep movements.", exs: ["All tricep exercises (synergist)"] },
    ],
    biomech: "Research confirms the long head is substantially more active in overhead extension than pushdowns. Shoulder position — not just elbow position — determines its length.",
    vol: "10–18 weekly sets with at least one overhead extension per week. Significant indirect volume from pressing.",
    errors: ["Pushdowns only — long head (~55%) undertrained", "Elbows flaring during overhead extensions", "Upper arms moving — elbow lockdown breaks", "Not spreading rope at full extension"],
  },
  core: {
    label: "Core", clinical: "TVA, Rectus Abdominis, Obliques", color: "#059669", light: "#d1fae5",
    overview: "A canister of muscles surrounding the spine. The deep TVA pre-activates before any limb movement. Training visible abs without deep stability is building walls without a foundation.",
    regions: [
      { name: "Transverse abdominis (TVA)", act: "Deepest layer — wraps like a corset. Creates intra-abdominal pressure, stiffening the spine under load. The most important core muscle for injury prevention.", exs: ["Dead Bug", "Plank", "Ab Wheel Rollout"] },
      { name: "Rectus abdominis", act: "The six-pack. Responds to progressive overload. Cable crunches and hanging raises allow progressive loading.", exs: ["Cable Crunch", "Hanging Leg Raise"] },
      { name: "Obliques", act: "Critical for resisting rotation under load. The Pallof press trains the pattern obliques actually perform during compound lifting.", exs: ["Pallof Press", "Side Plank"] },
    ],
    biomech: "McGill's research: intra-abdominal pressure from TVA bracing is the most effective strategy for reducing disc compression under load.",
    vol: "3–4 core exercises 2–3× per week. Stability before loading.",
    errors: ["Crunching without posterior pelvic tilt — hip flexors dominate", "Not progressively loading the abs", "Training visible abs without deep stability first", "Over-training flexion, neglecting anti-rotation"],
  },
  glutes: {
    label: "Glutes", clinical: "Gluteus Maximus, Medius, Minimus", color: "#b91c1c", light: "#fee2e2",
    overview: "The largest muscle group. Peak glute max activation occurs at full hip extension — exactly where the hip thrust loads it hardest.",
    regions: [
      { name: "Gluteus maximus", act: "Peak activation at full hip extension. The hip thrust creates a horizontal resistance vector — peak resistance coincides with peak glute activation.", exs: ["Hip Thrust (Barbell)", "Single-Leg Hip Thrust", "Romanian Deadlift"] },
      { name: "Gluteus medius", act: "Hip abduction and pelvic stabilization. Weakness causes knee valgus — inward collapse during squats and lunges.", exs: ["Bulgarian Split Squat", "Single-Leg Hip Thrust"] },
    ],
    biomech: "Contreras et al. (2015): hip thrust produces significantly higher glute max EMG than squats or deadlifts. The horizontal resistance vector loads directly into hip extension.",
    vol: "12–20 direct weekly sets. 2–3× weekly frequency is effective.",
    errors: ["Hip hyperextension at top — lumbar overload", "Pushing through toes — quad dominance", "Shallow range — missing full hip extension peak", "Bilateral only — glute medius weakness hidden"],
  },
  hamstrings: {
    label: "Hamstrings", clinical: "Biceps Femoris, Semimembranosus, Semitendinosus", color: "#b45309", light: "#fef3c7",
    overview: "Perform both knee flexion and hip extension. RDLs and leg curls train different muscles — they are not interchangeable.",
    regions: [
      { name: "Biceps femoris long head", act: "Most important for hypertrophy. Maximally stimulated by hip hinge exercises in the stretched position — hip flexed, knee extended.", exs: ["Romanian Deadlift", "Nordic Curl"] },
      { name: "Semimembranosus", act: "Larger medial hamstring. Primary function is knee flexion. Best targeted through leg curl variations.", exs: ["Single-Leg Hamstring Curl", "Lying Leg Curl"] },
      { name: "Semitendinosus", act: "Superficial medial hamstring. Works alongside the semimembranosus. Trained identically through leg curl variations.", exs: ["Single-Leg Hamstring Curl", "Lying Leg Curl"] },
    ],
    biomech: "Maeo et al. (2021): stretch-loaded training (RDL) produces significantly greater hypertrophy than peak-contraction training alone. Loading at maximum length drives superior adaptation.",
    vol: "10–20 weekly sets with both hip hinge and knee flexion patterns. Unilateral exercises essential.",
    errors: ["Lower back rounding in RDLs — hip hinge lost", "Excessive knee bend — RDL becomes a squat", "Cutting leg curl short at bottom — stretch removed", "Bilateral curls only — asymmetry masked"],
  },
  quads: {
    label: "Quadriceps", clinical: "Rectus Femoris, Vastus Lateralis, VMO", color: "#d97706", light: "#fef9c3",
    overview: "Four muscles. The rectus femoris crosses the hip joint. The VMO stabilizes the patella and prevents knee pain.",
    regions: [
      { name: "Rectus femoris", act: "Only quad crossing the hip. Most challenged when the hip is simultaneously extended — the Bulgarian split squat achieves this uniquely.", exs: ["Bulgarian Split Squat", "Goblet Squat (deep)"] },
      { name: "Vastus lateralis", act: "Largest vasti — primary force producer. Creates the lateral quad sweep from the front.", exs: ["Leg Press", "Leg Extension"] },
      { name: "VMO (teardrop)", act: "Critical for final 15–30° of knee extension and patellar stabilization. VMO weakness causes lateral patellar tracking and knee pain.", exs: ["Leg Extension (pause at top)", "Step-Up"] },
    ],
    biomech: "The VMO fiber angle (~55°) pulls the patella medially. When weak relative to the vastus lateralis, the patella tracks laterally — the primary patellofemoral pain mechanism.",
    vol: "12–20 weekly sets. Higher rep ranges (12–20) are particularly effective for quad hypertrophy.",
    errors: ["Knee valgus under load — VMO and glute medius weakness", "Shallow squat depth — rectus femoris undertrained", "No pause at top of leg extensions — VMO range skipped", "Aggressive lockout on leg press"],
  },
  calves: {
    label: "Calves", clinical: "Gastrocnemius, Soleus", color: "#c2410c", light: "#ffedd5",
    overview: "Two muscles with different fiber types. Knee position is the physiological selector — straight knee loads gastrocnemius, bent knee loads soleus.",
    regions: [
      { name: "Gastrocnemius (two heads)", act: "Crosses both knee and ankle — active only with straight knee. Standing raises are the only way to fully activate it.", exs: ["Standing Calf Raise", "Single-Leg Standing Calf Raise"] },
      { name: "Soleus", act: "Does not cross the knee. Slow-twitch dominant, responds best to higher reps (15–25). Seated raises isolate it by deactivating the gastrocnemius.", exs: ["Seated Calf Raise"] },
    ],
    biomech: "The gastrocnemius becomes actively insufficient when the knee is flexed. This mechanical fact is ignored by most calf training programs.",
    vol: "15–22 weekly sets split between standing and seated. Higher frequency (3–4×/week) often necessary.",
    errors: ["Standing raises only — soleus never trained", "Partial range — heel not dropping below step", "Bouncing at bottom — elastic recoil replaces muscle force", "Low reps on seated raises — wrong fiber type for soleus"],
  },
};

// Hotspots over the anatomy image
// Image shows front (left half) and back (right half)
// x/y/w/h are percentages of the VISIBLE cropped half
const FRONT_HOTSPOTS = [
  { id: "chest",     x: 28, y: 18, w: 34, h: 14 },
  { id: "shoulders", x: 8,  y: 14, w: 20, h: 12 },
  { id: "biceps",    x: 6,  y: 26, w: 18, h: 16 },
  { id: "core",      x: 24, y: 33, w: 36, h: 16 },
  { id: "quads",     x: 18, y: 52, w: 22, h: 20 },
  { id: "calves",    x: 20, y: 73, w: 18, h: 14 },
];
const BACK_HOTSPOTS = [
  { id: "back",       x: 18, y: 14, w: 46, h: 24 },
  { id: "shoulders",  x: 8,  y: 12, w: 20, h: 12 },
  { id: "triceps",    x: 4,  y: 24, w: 18, h: 16 },
  { id: "glutes",     x: 22, y: 48, w: 30, h: 12 },
  { id: "hamstrings", x: 20, y: 60, w: 26, h: 18 },
  { id: "calves",     x: 22, y: 78, w: 20, h: 12 },
];

export default function MuscleScience() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("front");
  const [tab, setTab] = useState("anatomy");
  const [expRegion, setExpRegion] = useState(null);
  const [hovered, setHovered] = useState(null);

  function openMuscle(id) {
    setSelected(id);
    setTab("anatomy");
    setExpRegion(null);
    setHovered(null);
  }

  const hotspots = view === "front" ? FRONT_HOTSPOTS : BACK_HOTSPOTS;

  // ── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (selected) {
    const m = MUSCLES[selected];
    return (
      <div style={{ paddingBottom: 60 }}>
        <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f0f0f0" }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", ...F, display: "flex", alignItems: "center", gap: "5px", marginBottom: "10px" }}>
            ← All muscles
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "22px", fontWeight: "normal", color: m.color, ...F }}>{m.label}</div>
              <div style={{ fontSize: "11px", color: "#aaa", fontStyle: "italic", marginTop: "2px" }}>{m.clinical}</div>
            </div>
            <span style={{ fontSize: "10px", background: m.light, color: m.color, padding: "3px 10px", borderRadius: "20px", border: `1px solid ${m.color}33`, marginTop: "4px" }}>
              {m.regions.length} regions
            </span>
          </div>
        </div>

        <div style={{ padding: "12px 16px", background: "#f9f9f7", borderBottom: "1px solid #f0f0f0", borderLeft: `3px solid ${m.color}` }}>
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.75" }}>{m.overview}</div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0" }}>
          {[["anatomy", "Anatomy"], ["training", "Biomechanics"], ["errors", "Common Errors"]].map(([t, l]) => (
            <button key={t} onClick={() => { setTab(t); setExpRegion(null); }} style={{
              flex: 1, padding: "10px 4px", fontSize: "11px", border: "none", background: "none",
              borderBottom: tab === t ? `2px solid ${m.color}` : "2px solid transparent",
              color: tab === t ? m.color : "#aaa", cursor: "pointer", ...F,
              fontWeight: tab === t ? "600" : "400",
            }}>{l}</button>
          ))}
        </div>

        <div style={{ padding: "14px 16px" }}>
          {tab === "anatomy" && (
            <div>
              {m.regions.map((r, i) => (
                <div key={i} style={{ border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "7px", overflow: "hidden" }}>
                  <button onClick={() => setExpRegion(expRegion === i ? null : i)} style={{
                    width: "100%", background: expRegion === i ? m.light : "#fff",
                    border: "none", padding: "11px 14px", display: "flex", justifyContent: "space-between",
                    alignItems: "center", cursor: "pointer", ...F, textAlign: "left",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", fontWeight: "600", color: expRegion === i ? m.color : "#333" }}>{r.name}</span>
                    </div>
                    <span style={{ color: "#ccc", fontSize: "11px" }}>{expRegion === i ? "▲" : "▼"}</span>
                  </button>
                  {expRegion === i && (
                    <div style={{ padding: "10px 14px 13px", borderTop: `1px solid ${m.color}22` }}>
                      <p style={{ fontSize: "12px", color: "#444", lineHeight: "1.75", marginBottom: "10px" }}>{r.act}</p>
                      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: "6px" }}>Key Exercises</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                        {r.exs.map((e, ei) => (
                          <span key={ei} style={{ fontSize: "11px", background: m.light, color: m.color, border: `1px solid ${m.color}33`, padding: "3px 10px", borderRadius: "20px" }}>{e}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "training" && (
            <div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#aaa", marginBottom: "8px" }}>Biomechanics</div>
              <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "12px 14px", fontSize: "12px", color: "#444", lineHeight: "1.8", marginBottom: "14px" }}>{m.biomech}</div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#aaa", marginBottom: "8px" }}>Volume Guidelines</div>
              <div style={{ borderLeft: `2px solid ${m.color}`, padding: "10px 13px", background: m.light + "55", borderRadius: "0 7px 7px 0", fontSize: "12px", color: "#444", lineHeight: "1.75" }}>{m.vol}</div>
            </div>
          )}

          {tab === "errors" && (
            <div>
              {m.errors.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: m.light, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "600", flexShrink: 0, border: `1px solid ${m.color}33` }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.65", paddingTop: "2px" }}>{e}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── OVERVIEW with anatomy image and hotspots ──────────────────────────────
  return (
    <div style={{ padding: "14px 16px 60px" }}>
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#999", marginBottom: "3px" }}>Anatomy & Training</div>
        <div style={{ fontSize: "20px", fontWeight: "normal", ...F }}>Muscle Science</div>
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {[["front", "Anterior (Front)"], ["back", "Posterior (Back)"]].map(([v, l]) => (
          <button key={v} onClick={() => { setView(v); setHovered(null); }} style={{
            flex: 1, padding: "7px", borderRadius: "20px",
            border: "1px solid", borderColor: view === v ? "#111" : "#e0e0e0",
            background: view === v ? "#111" : "#fff",
            color: view === v ? "#fff" : "#666",
            fontSize: "11px", cursor: "pointer", ...F,
          }}>{l}</button>
        ))}
      </div>

      {/* Image with hotspots */}
      <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", marginBottom: "14px", background: "#f5f5f5", border: "1px solid #f0f0f0" }}>
        {/* Crop container — shows only front or back half */}
        <div style={{
          width: "100%",
          overflow: "hidden",
          position: "relative",
        }}>
          <img
            src="/anatomy.png"
            alt="Human muscular anatomy"
            style={{
              width: view === "front" ? "200%" : "200%",
              marginLeft: view === "front" ? "0%" : "-100%",
              display: "block",
            }}
          />

          {/* Hotspot buttons */}
          {hotspots.map(({ id, x, y, w, h }) => {
            const m = MUSCLES[id];
            const isHovered = hovered === id;
            return (
              <button
                key={id}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(id)}
                onTouchEnd={() => openMuscle(id)}
                onClick={() => openMuscle(id)}
                style={{
                  position: "absolute",
                  left: `${x}%`, top: `${y}%`,
                  width: `${w}%`, height: `${h}%`,
                  background: isHovered ? `${m.color}33` : "transparent",
                  border: isHovered ? `2px solid ${m.color}aa` : "2px solid transparent",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.12s",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  padding: "3px",
                }}
                aria-label={`Explore ${m.label}`}
              >
                {isHovered && (
                  <span style={{
                    background: m.color, color: "#fff",
                    fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                    whiteSpace: "nowrap", ...F, fontWeight: "600",
                    pointerEvents: "none", lineHeight: "1.4",
                  }}>{m.label}</span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ position: "absolute", bottom: "8px", left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontSize: "10px", color: "#777", background: "rgba(255,255,255,0.9)", padding: "3px 12px", borderRadius: "20px" }}>
            Tap a muscle to explore
          </span>
        </div>
      </div>

      {/* Muscle list */}
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "9px" }}>
        {view === "front" ? "Anterior muscles" : "Posterior muscles"}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
        {hotspots.map(({ id }) => {
          const m = MUSCLES[id];
          return (
            <button key={id} onClick={() => openMuscle(id)} style={{
              background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px",
              padding: "10px 11px", textAlign: "left", cursor: "pointer", ...F,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{m.label}</span>
              </div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>{m.clinical}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
