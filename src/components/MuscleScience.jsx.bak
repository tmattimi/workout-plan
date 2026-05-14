import { useState } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const MUSCLE_INFO = {
  chest: {
    label: "Chest", clinical: "Pectoralis Major & Minor",
    color: "#2563a8", light: "#dbeafe",
    overview: "The pectoralis major has two distinct heads with independent motor unit recruitment. Flat pressing alone is insufficient — incline work is non-optional for complete development.",
    regions: [
      { name: "Clavicular head (upper pec)", act: "Shoulder flexion from a low angle. Most active at 30–45° incline. Creates the shelf below the collarbone.", exs: ["Incline Dumbbell Press", "Cable Fly (Low-to-High)"] },
      { name: "Sternal head (lower pec)", act: "Primary force producer in flat pressing. Peak stretch at the bottom of a dumbbell press — controlled eccentrics are especially effective.", exs: ["Dumbbell Bench Press", "Flat Dumbbell Fly"] },
    ],
    biomech: "Dumbbell pressing allows greater range than barbell, maximizing sternal head stretch. EMG research confirms the clavicular head is significantly more active at 30–45° incline than flat.",
    errors: ["Elbows flaring past 75° — shoulder joint stress", "Cutting range short at the bottom — removes peak stretch", "Forward shoulder roll — anterior deltoid dominates", "Scapulae not retracted — impingement risk over time"],
  },
  shoulders: {
    label: "Shoulders", clinical: "Deltoideus — Anterior, Lateral, Posterior",
    color: "#7c3aed", light: "#ede9fe",
    overview: "Three distinct heads with different functions. Pressing covers the anterior head well. The lateral and posterior heads require direct work — they get minimal stimulus from pressing.",
    regions: [
      { name: "Anterior deltoid", act: "Shoulder flexion. Heavily recruited by pressing. Adding direct front raises on top of heavy pressing is usually unnecessary.", exs: ["Overhead Press (indirect)", "Incline Press (indirect)"] },
      { name: "Lateral deltoid", act: "Shoulder abduction — drives shoulder width. Cable raises maintain constant tension throughout the range; dumbbells drop to near zero at the bottom.", exs: ["Cable Lateral Raise", "Dumbbell Lateral Raise"] },
      { name: "Posterior deltoid", act: "Horizontal abduction and external rotation. Most undertrained head. Weakness contributes to anterior impingement under heavy pressing loads.", exs: ["Face Pull", "Rear Delt Fly"] },
    ],
    biomech: "Cable lateral raises are mechanically superior to dumbbells — the cable maintains tension perpendicular to the forearm throughout the range. Dumbbells produce zero torque at 0° arm abduction.",
    errors: ["Shrugging traps during lateral raises", "Too heavy on lateral raises — momentum replaces tension", "Neglecting posterior deltoid entirely", "Not balancing with external rotation work"],
  },
  back: {
    label: "Back", clinical: "Lat. Dorsi, Trapezius, Rhomboids, Erectors",
    color: "#16a34a", light: "#dcfce7",
    overview: "Complete development requires both vertical pulling (lat width) and horizontal pulling (mid-back thickness). These train different muscles and cannot substitute for each other.",
    regions: [
      { name: "Latissimus dorsi", act: "Creates the V-taper. Attaches to thoracolumbar fascia — full overhead elevation required for maximum stretch. Dead hang at the bottom of every pull is essential.", exs: ["Pull-Up", "Lat Pulldown", "Straight-Arm Pulldown"] },
      { name: "Middle trapezius", act: "Scapular retraction — pulling shoulder blades together. Most active at peak contraction of rows. The 1-second squeeze at the top is where it works hardest.", exs: ["Seated Cable Row", "Chest-Supported Row"] },
      { name: "Rhomboids", act: "Retract and downwardly rotate the scapula. Work with mid-trap. Most challenged at full retraction — the end position of a properly executed row.", exs: ["Single-Arm DB Row", "Seated Cable Row"] },
    ],
    biomech: "The lat attaches to thoracolumbar fascia, not the spine directly. Cutting the return short on pulldowns removes the stretch stimulus — equivalent to training only the concentric half.",
    errors: ["Cutting return short on pulldowns — no lat stretch", "Rowing with arms instead of elbows — bicep dominance", "Not pausing at peak scapular retraction", "Pulling bar behind neck"],
  },
  biceps: {
    label: "Biceps", clinical: "Biceps Brachii, Brachialis",
    color: "#0d9488", light: "#ccfbf1",
    overview: "Three muscles with different grip requirements. The brachialis — often neglected — is actually the strongest elbow flexor and creates the thickness that pushes the bicep upward.",
    regions: [
      { name: "Long head", act: "Creates the peak. Crosses the shoulder joint — reaches maximum stretch when the arm is behind the body. Incline curls specifically target this position.", exs: ["Incline Dumbbell Curl", "Cable Curl (arm behind body)"] },
      { name: "Short head", act: "Contributes to width. Supination at the top of curls specifically targets this head.", exs: ["Alternating Dumbbell Curl", "Preacher Curl"] },
      { name: "Brachialis", act: "The strongest elbow flexor — produces more force than the bicep itself. Targeted with neutral grip. When developed, pushes the bicep upward.", exs: ["Hammer Curl", "Cross-Body Curl"] },
    ],
    biomech: "Cable curls provide resistance at full arm extension — where dumbbell resistance drops to near zero. This bottom-range tension is the primary mechanical advantage of cables.",
    errors: ["Not supinating at top of curls — short head bypassed", "Torso swing — removes tension", "Short range at bottom — removes stretch stimulus", "Elbows drifting forward on incline curls"],
  },
  triceps: {
    label: "Triceps", clinical: "Triceps Brachii — Long, Lateral, Medial",
    color: "#1d4ed8", light: "#dbeafe",
    overview: "Two-thirds of upper arm mass. The long head (~55% of tricep) crosses the shoulder joint and can only be fully trained overhead. Pushdowns alone neglect the majority of the muscle.",
    regions: [
      { name: "Long head", act: "~55% of tricep cross-section. Fully stretched only with arm overhead. Significantly more active in overhead extension than pushdowns.", exs: ["Overhead Tricep Extension", "Skull Crusher"] },
      { name: "Lateral head", act: "Creates the horseshoe shape from the side. Does not cross the shoulder — elbow position alone determines its length.", exs: ["Tricep Rope Pushdown", "Close-Grip Press"] },
      { name: "Medial head", act: "Deep stabilizer. Always partially active. Cannot be isolated — trained through all tricep movements.", exs: ["All tricep exercises (synergist)"] },
    ],
    biomech: "Research confirms the long head is substantially more active in overhead extension than pushdowns — by a margin that makes overhead work indispensable.",
    errors: ["Pushdowns only — long head undertrained", "Elbows flaring during overhead extensions", "Upper arms moving — elbow lockdown breaks", "Not spreading rope at full extension"],
  },
  core: {
    label: "Core", clinical: "TVA, Rectus Abdominis, Obliques",
    color: "#059669", light: "#d1fae5",
    overview: "The core is a canister of muscles surrounding the spine. The deep TVA pre-activates before any limb movement. Training visible abs without deep stability is building walls without a foundation.",
    regions: [
      { name: "Transverse abdominis (TVA)", act: "The deepest layer — wraps like a corset. Creates intra-abdominal pressure when braced, stiffening the spine under load. The most important core muscle for injury prevention.", exs: ["Dead Bug", "Plank", "Ab Wheel Rollout"] },
      { name: "Rectus abdominis", act: "The six-pack. Responds to progressive overload. Cable crunches and hanging raises allow load to be added — unlike bodyweight crunches which plateau rapidly.", exs: ["Cable Crunch", "Hanging Leg Raise"] },
      { name: "Obliques", act: "More critical for resisting rotation than producing it. Anti-rotation (Pallof Press) trains the pattern obliques actually perform during compound lifts.", exs: ["Pallof Press", "Side Plank"] },
    ],
    biomech: "McGill: intra-abdominal pressure from TVA bracing is the most effective strategy for reducing disc compression under load. The 360° brace — expand all directions, then brace hard — is the evidence-based technique.",
    errors: ["Crunching without posterior pelvic tilt — hip flexors dominate", "Not loading progressively", "Training abs without deep stability foundation", "Over-training flexion, neglecting anti-rotation"],
  },
  glutes: {
    label: "Glutes", clinical: "Gluteus Maximus, Medius, Minimus",
    color: "#b91c1c", light: "#fee2e2",
    overview: "The largest muscle group in the body. Peak glute max activation occurs at full hip extension — exactly where the hip thrust loads it. This is the mechanical reason the thrust outperforms the squat.",
    regions: [
      { name: "Gluteus maximus", act: "Peak activation at full hip extension. Hip thrust creates a horizontal resistance vector — peak resistance coincides with peak activation.", exs: ["Hip Thrust (Barbell)", "Single-Leg Hip Thrust", "Romanian Deadlift"] },
      { name: "Gluteus medius", act: "Hip abduction and pelvic stabilization. Weakness causes knee valgus — inward knee collapse during squats and lunges.", exs: ["Bulgarian Split Squat", "Single-Leg Hip Thrust"] },
    ],
    biomech: "Contreras et al. (2015): hip thrust produces significantly higher glute max EMG than squats or deadlifts. The horizontal resistance vector loads directly into hip extension rather than sharing load across multiple muscles.",
    errors: ["Hip hyperextension at top — lumbar overload", "Pushing through toes — quad dominance", "Shallow range — missing peak extension", "Bilateral only — glute medius weakness hidden"],
  },
  hamstrings: {
    label: "Hamstrings", clinical: "Biceps Femoris, Semimembranosus, Semitendinosus",
    color: "#b45309", light: "#fef3c7",
    overview: "Perform both knee flexion and hip extension. RDLs and leg curls train different muscles through different mechanisms — they are not interchangeable.",
    regions: [
      { name: "Biceps femoris long head", act: "Most important for hypertrophy. Crosses both hip and knee. Maximally stimulated by hip hinge exercises loading it in the stretched position.", exs: ["Romanian Deadlift", "Nordic Curl"] },
      { name: "Semimembranosus", act: "Larger medial hamstring. Primary function is knee flexion. Best targeted through leg curl variations.", exs: ["Single-Leg Hamstring Curl", "Lying Leg Curl"] },
      { name: "Semitendinosus", act: "Superficial medial hamstring. Works alongside the semimembranosus. Trained identically through leg curl variations.", exs: ["Single-Leg Hamstring Curl", "Lying Leg Curl"] },
    ],
    biomech: "Maeo et al. (2021): stretch-loaded training (RDL) produces significantly greater hypertrophy than peak-contraction training (leg curls alone). Loading at maximum length drives superior adaptation.",
    errors: ["Lower back rounding in RDLs — hip hinge lost", "Excessive knee bend — RDL becomes a squat", "Leg curl short at bottom — stretch removed", "Bilateral only — asymmetry masked"],
  },
  quads: {
    label: "Quadriceps", clinical: "Rectus Femoris, Vastus Lateralis, VMO, Vastus Intermedius",
    color: "#d97706", light: "#fef9c3",
    overview: "Four muscles with different functions. The rectus femoris crosses the hip joint — hip position affects its challenge in ways the vasti are not. The VMO stabilizes the patella.",
    regions: [
      { name: "Rectus femoris", act: "Only quad crossing the hip. Most challenged with hip simultaneously extended — the split squat achieves this uniquely well.", exs: ["Bulgarian Split Squat", "Goblet Squat (deep)"] },
      { name: "Vastus lateralis", act: "Largest vasti — primary force producer. Creates the lateral sweep. Consistently recruited across most knee extension exercises.", exs: ["Leg Press", "Leg Extension"] },
      { name: "Vastus medialis (VMO)", act: "Teardrop above the knee. Critical for final 15–30° of extension and patellar stabilization. VMO weakness causes lateral patellar tracking — patellofemoral pain syndrome.", exs: ["Leg Extension (pause at top)", "Step-Up"] },
    ],
    biomech: "The VMO fiber angle (~55°) pulls the patella medially into the femoral groove. When the VMO is weak relative to the vastus lateralis, the patella tracks laterally — the primary patellofemoral pain mechanism.",
    errors: ["Knee valgus under load", "Shallow squat depth — rectus femoris undertrained", "No pause at top of leg extensions — VMO range skipped", "Aggressive lockout on leg press"],
  },
  calves: {
    label: "Calves", clinical: "Gastrocnemius, Soleus",
    color: "#c2410c", light: "#ffedd5",
    overview: "Two muscles with different fiber types and different training positions. Knee position is the physiological selector — straight knee for gastrocnemius, bent knee for soleus.",
    regions: [
      { name: "Gastrocnemius (2 heads)", act: "Crosses both knee and ankle — active only with straight knee. Creates the rounded shape from behind. Standing raises with straight knee are the only way to fully activate it.", exs: ["Standing Calf Raise"] },
      { name: "Soleus", act: "Does not cross the knee — active regardless. Slow-twitch dominant, responds to higher reps (15–25). Seated raises with bent knee isolate it by deactivating the gastrocnemius.", exs: ["Seated Calf Raise"] },
    ],
    biomech: "The gastrocnemius becomes actively insufficient when the knee is flexed. Knee position is therefore the physiological selector between the two muscles — a mechanical fact most calf training ignores.",
    errors: ["Standing raises only — soleus never trained", "Partial range — heel not dropping fully", "Bouncing at bottom — elastic recoil replaces muscle force", "Low reps on seated raises — wrong fiber type for soleus"],
  },
};

const SEARCH_TERMS = {
  chest: ["pec", "pectoral", "chest", "bench"],
  shoulders: ["delt", "deltoid", "shoulder", "ohp", "overhead"],
  back: ["lat", "trap", "rhomboid", "back", "pull", "row"],
  biceps: ["bicep", "curl", "brachialis", "arm"],
  triceps: ["tricep", "pushdown", "extension", "arm"],
  core: ["abs", "core", "abdominal", "oblique", "tva"],
  glutes: ["glute", "hip thrust", "butt", "posterior"],
  hamstrings: ["hamstring", "rdl", "deadlift", "posterior"],
  quads: ["quad", "squat", "knee", "vmo", "rectus"],
  calves: ["calf", "calves", "gastrocnemius", "soleus"],
};

export default function MuscleScience() {
  const [selected, setSelected] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeTab, setActiveTab] = useState("anatomy");
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? Object.entries(MUSCLE_INFO).filter(([id]) =>
        SEARCH_TERMS[id]?.some(t => t.includes(search.toLowerCase())) ||
        MUSCLE_INFO[id].label.toLowerCase().includes(search.toLowerCase())
      ).map(([id]) => id)
    : Object.keys(MUSCLE_INFO);

  function openMuscle(id) {
    setSelected(id);
    setActiveRegion(null);
    setActiveTab("anatomy");
  }

  if (selected) {
    const m = MUSCLE_INFO[selected];
    const tabs = [["anatomy", "Anatomy"], ["training", "Biomechanics"], ["errors", "Common Errors"]];

    return (
      <div style={{ padding: "0 0 60px" }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #f0f0f0" }}>
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", ...F, padding: "0 0 10px", display: "flex", alignItems: "center", gap: "5px" }}>
            ← All muscle groups
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#aaa", marginBottom: "3px" }}>Anatomy & Training</div>
              <div style={{ fontSize: "22px", fontWeight: "normal", color: m.color, ...F }}>{m.label}</div>
              <div style={{ fontSize: "11px", color: "#aaa", fontStyle: "italic", marginTop: "2px" }}>{m.clinical}</div>
            </div>
            <span style={{ fontSize: "10px", background: m.light, color: m.color, padding: "3px 10px", borderRadius: "20px", border: `1px solid ${m.color}33`, marginTop: "4px" }}>
              {m.regions.length} regions
            </span>
          </div>
        </div>

        {/* Zygote Body 3D viewer */}
        <div style={{ background: "#1a1a1a", position: "relative" }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#555", padding: "8px 14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>3D Anatomy Viewer</span>
            <span style={{ color: "#444" }}>Rotate · Zoom · Pinch</span>
          </div>
          <iframe
            src={`https://www.zygotebody.com`}
            width="100%"
            height="340"
            frameBorder="0"
            allow="fullscreen"
            style={{ display: "block" }}
            title="3D Anatomy — Zygote Body"
          />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, #1a1a1a)", height: "40px", pointerEvents: "none" }} />
        </div>

        {/* Overview */}
        <div style={{ padding: "14px 16px 0" }}>
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.75", marginBottom: "14px", padding: "10px 13px", background: "#f9f9f7", borderLeft: `3px solid ${m.color}`, borderRadius: "0 7px 7px 0" }}>
            {m.overview}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "14px", borderBottom: "1px solid #f0f0f0" }}>
            {tabs.map(([t, l]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                background: "none", border: "none", padding: "8px 12px",
                borderBottom: activeTab === t ? `2px solid ${m.color}` : "2px solid transparent",
                color: activeTab === t ? m.color : "#aaa",
                fontSize: "11px", cursor: "pointer", ...F,
                fontWeight: activeTab === t ? "600" : "400",
              }}>{l}</button>
            ))}
          </div>

          {/* Anatomy tab */}
          {activeTab === "anatomy" && (
            <div>
              {m.regions.map((r, i) => {
                const isOpen = activeRegion === i;
                return (
                  <div key={i} style={{ border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "7px", overflow: "hidden" }}>
                    <button onClick={() => setActiveRegion(isOpen ? null : i)} style={{ width: "100%", background: isOpen ? m.light : "#fff", border: "none", padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: isOpen ? m.color : "#333" }}>{r.name}</div>
                      </div>
                      <span style={{ color: "#ccc", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: "10px 14px 13px", borderTop: `1px solid ${m.color}22` }}>
                        <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.75", marginBottom: "10px" }}>{r.act}</div>
                        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa", marginBottom: "6px" }}>Key Exercises</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                          {r.exs.map((e, ei) => (
                            <span key={ei} style={{ fontSize: "11px", background: m.light, color: m.color, border: `1px solid ${m.color}33`, padding: "3px 10px", borderRadius: "20px" }}>{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Biomechanics tab */}
          {activeTab === "training" && (
            <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "13px 14px", fontSize: "12px", color: "#444", lineHeight: "1.8" }}>
              {m.biomech}
            </div>
          )}

          {/* Errors tab */}
          {activeTab === "errors" && (
            <div>
              {m.errors.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: m.light, color: m.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "600", flexShrink: 0, border: `1px solid ${m.color}33` }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.65" }}>{e}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Overview
  return (
    <div style={{ padding: "16px 16px 60px" }}>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#999", marginBottom: "3px" }}>Anatomy & Training</div>
        <div style={{ fontSize: "20px", fontWeight: "normal", ...F }}>Muscle Science</div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search muscle groups..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "9px 13px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "13px", marginBottom: "14px", ...F }}
      />

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {filtered.map(id => {
          const m = MUSCLE_INFO[id];
          return (
            <button key={id} onClick={() => openMuscle(id)} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "13px 12px", textAlign: "left", cursor: "pointer", ...F }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>{m.label}</div>
              </div>
              <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "7px", lineHeight: "1.4" }}>{m.clinical}</div>
              <div style={{ fontSize: "9px", background: m.light, color: m.color, padding: "2px 8px", borderRadius: "20px", display: "inline-block" }}>
                {m.regions.length} regions
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "16px", padding: "12px 14px", background: "#111", borderRadius: "8px" }}>
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#555", marginBottom: "6px" }}>How to use</div>
        <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.7" }}>
          Tap any muscle group to open the 3D anatomy viewer alongside NASM-grade regional breakdowns, biomechanics, and common training errors.
        </div>
      </div>
    </div>
  );
}
