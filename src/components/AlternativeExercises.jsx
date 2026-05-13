import { useState, useEffect } from "react";
import { getAlternatives, getAllExercises } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const EQUIPMENT_OPTIONS = [
  { key: "barbell", label: "Barbell", icon: "🏋️" },
  { key: "dumbbell", label: "Dumbbells", icon: "🪃" },
  { key: "cable", label: "Cable Machine", icon: "🔗" },
  { key: "machine", label: "Machines", icon: "⚙️" },
  { key: "bench", label: "Bench", icon: "🛋️" },
  { key: "pull_up_bar", label: "Pull-Up Bar", icon: "🔝" },
  { key: "band", label: "Bands", icon: "🪢" },
  { key: "bodyweight", label: "Bodyweight Only", icon: "🤸" },
  { key: "kettlebell", label: "Kettlebell", icon: "🫙" },
  { key: "ab_wheel", label: "Ab Wheel", icon: "⭕" },
];

const INJURY_OPTIONS = [
  { key: "shoulder", label: "Shoulder pain", description: "Limits overhead pressing and flyes" },
  { key: "knee", label: "Knee pain", description: "Limits deep squatting, lunges" },
  { key: "lower_back", label: "Lower back pain", description: "Limits hinging, heavy loading" },
  { key: "elbow", label: "Elbow / wrist pain", description: "Limits curls, pushdowns" },
  { key: "hip", label: "Hip pain", description: "Limits hip hinging, split squats" },
];

const MUSCLE_GROUPS = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core"
];

// Offline fallback alternatives when Supabase isn't connected
const OFFLINE_ALTERNATIVES = {
  "Hip Thrust (Barbell)": [
    { name: "Hip Thrust (Machine)", equipment: ["machine"], why: "Same stimulus, easier setup. No barbell or padding required." },
    { name: "Single-Leg Hip Thrust", equipment: ["bodyweight", "bench"], why: "Unilateral — also addresses left/right glute imbalance." },
    { name: "Cable Pull-Through", equipment: ["cable"], why: "Hip hinge pattern with constant cable tension on the glutes." },
    { name: "Glute Bridge", equipment: ["bodyweight"], why: "Bodyweight version. Great when no equipment is available." },
  ],
  "Dumbbell Bench Press": [
    { name: "Barbell Bench Press", equipment: ["barbell", "bench"], why: "Allows heavier loading but both sides share the bar." },
    { name: "Push-Up", equipment: ["bodyweight"], why: "Bodyweight chest compound. Elevate feet for more chest emphasis." },
    { name: "Pec Deck / Machine Fly", equipment: ["machine"], why: "Isolation — good when pressing movements are unavailable." },
  ],
  "Lat Pulldown (Wide Overhand)": [
    { name: "Pull-Up", equipment: ["bodyweight", "pull_up_bar"], why: "Harder but more effective. Bodyweight compound." },
    { name: "Assisted Pull-Up", equipment: ["machine"], why: "Same pattern with weight assistance." },
    { name: "Straight-Arm Cable Pulldown", equipment: ["cable"], why: "Isolates lats without bicep. Good accessory." },
  ],
  "Romanian Deadlift (Dumbbell)": [
    { name: "Romanian Deadlift (Barbell)", equipment: ["barbell"], why: "Allows heavier loading. Same stretch-loaded stimulus." },
    { name: "Nordic Curl", equipment: ["bodyweight"], why: "Eccentric-focused. One of the most effective hamstring exercises." },
    { name: "Single-Leg Hamstring Curl", equipment: ["machine"], why: "Isolation — identifies and corrects left/right hamstring asymmetry." },
  ],
  "Bulgarian Split Squat (Dumbbell)": [
    { name: "Walking Lunge", equipment: ["dumbbell", "bodyweight"], why: "Similar unilateral stimulus. More natural movement." },
    { name: "Step-Up", equipment: ["dumbbell", "bench", "bodyweight"], why: "Lower impact knee alternative. Same unilateral quad and glute work." },
    { name: "Goblet Squat", equipment: ["dumbbell", "kettlebell"], why: "Bilateral — loses unilateral benefit but hits same muscles." },
  ],
  "Pull-Up (or Assisted Pull-Up)": [
    { name: "Assisted Pull-Up", equipment: ["machine"], why: "Same pattern with assistance. Reduce assistance over time." },
    { name: "Lat Pulldown (Wide Overhand)", equipment: ["cable", "machine"], why: "Same movement pattern. Allows load control." },
    { name: "Band-Assisted Pull-Up", equipment: ["band", "pull_up_bar"], why: "Band reduces bodyweight. Good bridge to unassisted." },
  ],
  "Overhead Tricep Extension": [
    { name: "Skull Crusher", equipment: ["barbell", "dumbbell", "bench"], why: "Long head stretch with lying position. Heavier loading." },
    { name: "Tricep Dips", equipment: ["bodyweight", "dip_bar"], why: "Compound tricep movement. High shoulder demand — avoid with shoulder pain." },
    { name: "Close-Grip Bench Press", equipment: ["barbell", "bench"], why: "Compound press with tricep emphasis." },
  ],
};

// Injury-specific messaging
const INJURY_GUIDANCE = {
  shoulder: {
    avoid: ["Barbell Bench Press", "Overhead press variations", "Behind-neck movements", "Upright rows"],
    safeAlternatives: "Use dumbbell pressing (allows more natural wrist/shoulder path), cable movements with neutral grip, and rear delt/external rotation work to strengthen the shoulder girdle. Avoid any movement that causes pain.",
    disclaimer: true,
  },
  knee: {
    avoid: ["Deep squatting", "Heavy leg press with full depth", "Bulgarian split squat if painful"],
    safeAlternatives: "Reduce depth on squats and leg press. Step-ups and leg extensions are generally lower-impact. Hip hinge movements (RDL, hip thrust) load the knee minimally. Avoid forced end-range knee flexion.",
    disclaimer: true,
  },
  lower_back: {
    avoid: ["Barbell deadlift", "Heavy barbell row", "Sit-ups/crunches with high load"],
    safeAlternatives: "Use dumbbell RDL with lighter load and focus on hip hinge mechanics. Chest-supported rows remove lower back entirely. Core anti-extension work (dead bug, plank) strengthens the stabilizers. Hip thrust is generally safe — keep the chin tucked and avoid hyperextension.",
    disclaimer: true,
  },
  elbow: {
    avoid: ["Heavy barbell curls", "Skull crushers", "Tricep dips if painful"],
    safeAlternatives: "Reduce load and prioritize control. Cable movements are generally more joint-friendly than free weights for elbow pain. Hammer curls with a neutral grip often feel better than supinated curls. Avoid locking out aggressively.",
    disclaimer: true,
  },
  hip: {
    avoid: ["Deep squat variations", "Hip thrust if painful at end range"],
    safeAlternatives: "Reduce range of motion on all hip flexion exercises. Cable pull-throughs and glute bridges are lower-demand alternatives to hip thrusts. Single-leg work at comfortable depth is preferred.",
    disclaimer: true,
  },
};

export default function AlternativeExercises({ clientEquipment, clientInjuries, onEquipmentChange, onInjuryChange }) {
  const [view, setView] = useState("settings"); // settings | browse | detail
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [allExercises, setAllExercises] = useState([]);
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [filterEquipment, setFilterEquipment] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const equipment = clientEquipment || EQUIPMENT_OPTIONS.map(e => e.key);
  const injuries = clientInjuries || [];

  // Load all exercises on mount
  useEffect(() => {
    async function load() {
      const { data } = await getAllExercises();
      if (data && data.length) {
        setAllExercises(data);
      } else {
        // Offline fallback — use the keys from OFFLINE_ALTERNATIVES
        const offline = Object.keys(OFFLINE_ALTERNATIVES).map(name => ({ name, id: name }));
        setAllExercises(offline);
      }
    }
    load();
  }, []);

  async function loadAlternatives(exerciseName) {
    setLoading(true);
    setSelectedExercise(exerciseName);
    setView("detail");

    const { data } = await getAlternatives(exerciseName, equipment, injuries);
    if (data && data.length) {
      setAlternatives(data);
    } else {
      // Use offline fallback
      const offline = (OFFLINE_ALTERNATIVES[exerciseName] || []).filter(ex => {
        // Filter by available equipment
        const hasEquipment = ex.equipment.some(e => equipment.includes(e));
        return hasEquipment;
      });
      setAlternatives(offline);
    }
    setLoading(false);
  }

  // Filter displayed exercises
  const filteredExercises = allExercises.filter(ex => {
    const matchesMuscle = filterMuscle === "all" || ex.primary_muscle === filterMuscle;
    const matchesQuery = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEquipment = filterEquipment.length === 0 || (ex.equipment && ex.equipment.some(e => filterEquipment.includes(e)));
    return matchesMuscle && matchesQuery && matchesEquipment;
  });

  // Detail view — alternatives for a specific exercise
  if (view === "detail" && selectedExercise) {
    const activeInjuryGuidance = injuries.flatMap(inj => {
      const g = INJURY_GUIDANCE[inj];
      return g ? [{ injury: inj, ...g }] : [];
    });

    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <button onClick={() => { setView("browse"); setAlternatives([]); }} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "14px", ...F }}>
          ← Back
        </button>

        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Alternatives for</div>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "14px" }}>{selectedExercise}</div>

        {/* Injury warnings */}
        {activeInjuryGuidance.length > 0 && (
          <div style={{ background: "#fff3e0", border: "1px solid #f0c060", borderRadius: "8px", padding: "12px 14px", marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#c47a0a", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              ⚠️ Injury Awareness
            </div>
            {activeInjuryGuidance.map((g, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#7a5010", marginBottom: "3px", textTransform: "capitalize" }}>{g.injury} concern</div>
                <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6" }}>{g.safeAlternatives}</div>
                {g.avoid?.length > 0 && (
                  <div style={{ fontSize: "10px", color: "#a02a2a", marginTop: "4px" }}>
                    Avoid: {g.avoid.join(" · ")}
                  </div>
                )}
              </div>
            ))}
            <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(0,0,0,0.05)", borderRadius: "5px", fontSize: "10px", color: "#888", lineHeight: "1.5" }}>
              <strong>Disclaimer:</strong> This is general guidance only and does not constitute medical advice. If you are experiencing pain, consult a licensed physical therapist or physician before continuing to train the affected area.
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: "20px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>Loading alternatives...</div>
        )}

        {!loading && alternatives.length === 0 && (
          <div style={{ padding: "20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px" }}>No alternatives found with your current equipment</div>
            <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.6" }}>
              Try updating your equipment settings or contact your coach for a plan modification.
            </div>
          </div>
        )}

        {!loading && alternatives.length > 0 && (
          <>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>
              {alternatives.length} alternative{alternatives.length !== 1 ? "s" : ""} available with your equipment
            </div>
            {alternatives.map((alt, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px 14px", marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{alt.name}</div>
                  <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "8px" }}>
                    {(alt.equipment || []).slice(0, 2).map((eq, ei) => (
                      <span key={ei} style={{ fontSize: "9px", background: "#f5f5f3", color: "#777", padding: "2px 6px", borderRadius: "20px" }}>
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
                {(alt.why || alt.description) && (
                  <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.55" }}>
                    {alt.why || alt.description}
                  </div>
                )}
                {alt.difficulty && (
                  <div style={{ marginTop: "5px" }}>
                    <span style={{ fontSize: "9px", background: "#e9f0fb", color: "#2563a8", padding: "2px 7px", borderRadius: "20px" }}>
                      {alt.difficulty}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <div style={{ marginTop: "14px", padding: "10px 12px", background: "#f5f5f3", borderRadius: "7px", fontSize: "11px", color: "#666", lineHeight: "1.6" }}>
          <strong>Note:</strong> When substituting exercises, aim to match the primary muscle and movement pattern. Log the alternative under the same slot in your workout — your progress will still track correctly.
        </div>
      </div>
    );
  }

  // Settings view
  if (view === "settings") {
    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Setup</div>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "6px" }}>Equipment and Injuries</div>
        <div style={{ fontSize: "12px", color: "#777", marginBottom: "18px", lineHeight: "1.6" }}>
          Tell us what you have access to and any areas of pain. The app will automatically surface safe alternatives throughout the plan.
        </div>

        {/* Equipment */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: "10px" }}>
            Available Equipment
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
            {EQUIPMENT_OPTIONS.map(eq => {
              const selected = equipment.includes(eq.key);
              return (
                <button key={eq.key} onClick={() => {
                  const updated = selected
                    ? equipment.filter(e => e !== eq.key)
                    : [...equipment, eq.key];
                  onEquipmentChange && onEquipmentChange(updated);
                }} style={{
                  background: selected ? "#111" : "#fff",
                  color: selected ? "#fff" : "#555",
                  border: `1px solid ${selected ? "#111" : "#e0e0e0"}`,
                  borderRadius: "8px", padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: "8px",
                  cursor: "pointer", ...F, textAlign: "left",
                }}>
                  <span style={{ fontSize: "18px" }}>{eq.icon}</span>
                  <span style={{ fontSize: "12px" }}>{eq.label}</span>
                  {selected && <span style={{ marginLeft: "auto", fontSize: "12px" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Injuries */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: "6px" }}>
            Areas of Pain or Concern
          </div>
          <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px", lineHeight: "1.5" }}>
            Flag these so the app shows safe alternatives and avoids problematic movements.
          </div>
          {INJURY_OPTIONS.map(inj => {
            const selected = injuries.includes(inj.key);
            return (
              <button key={inj.key} onClick={() => {
                const updated = selected
                  ? injuries.filter(i => i !== inj.key)
                  : [...injuries, inj.key];
                onInjuryChange && onInjuryChange(updated);
              }} style={{
                width: "100%", background: selected ? "#fff3e0" : "#fff",
                border: `1px solid ${selected ? "#f0c060" : "#e0e0e0"}`,
                borderRadius: "8px", padding: "11px 13px", marginBottom: "7px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", ...F, textAlign: "left",
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: selected ? "600" : "400", color: selected ? "#7a5010" : "#333" }}>{inj.label}</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>{inj.description}</div>
                </div>
                {selected && <span style={{ color: "#c47a0a", fontSize: "16px" }}>⚠️</span>}
              </button>
            );
          })}
          <div style={{ marginTop: "6px", padding: "10px 12px", background: "#f5f5f3", borderRadius: "7px", fontSize: "10px", color: "#888", lineHeight: "1.5" }}>
            <strong>Disclaimer:</strong> Pain flagging provides general exercise guidance only. This is not a substitute for evaluation by a licensed physical therapist or physician. If you are in significant pain, stop training the affected area and seek professional medical advice.
          </div>
        </div>

        <button onClick={() => setView("browse")} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "14px", cursor: "pointer", ...F }}>
          Browse Exercises and Alternatives →
        </button>
      </div>
    );
  }

  // Browse view
  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <button onClick={() => setView("settings")} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", ...F }}>⚙️</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>Exercise Library</div>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>Find Alternatives</div>
        </div>
      </div>

      {/* Injury warning banner */}
      {injuries.length > 0 && (
        <div style={{ background: "#fff3e0", border: "1px solid #f0c060", borderRadius: "7px", padding: "9px 12px", marginBottom: "12px", fontSize: "11px", color: "#7a5010" }}>
          ⚠️ Showing safe alternatives for: <strong>{injuries.join(", ")}</strong>
        </div>
      )}

      {/* Search */}
      <input type="text" placeholder="Search exercises..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "13px", marginBottom: "10px", ...F }} />

      {/* Muscle filter */}
      <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "4px", marginBottom: "10px" }}>
        {["all", ...MUSCLE_GROUPS].map(m => (
          <button key={m} onClick={() => setFilterMuscle(m)} style={{
            flex: "0 0 auto", background: filterMuscle === m ? "#111" : "#fff",
            color: filterMuscle === m ? "#fff" : "#555",
            border: "1px solid #e0e0e0", borderRadius: "20px", padding: "5px 12px",
            fontSize: "11px", cursor: "pointer", ...F, whiteSpace: "nowrap",
            textTransform: "capitalize",
          }}>{m === "all" ? "All" : m}</button>
        ))}
      </div>

      <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "10px" }}>
        {filteredExercises.length} exercises · Tap any to see alternatives
      </div>

      {filteredExercises.map((ex, i) => {
        const hasAlternatives = OFFLINE_ALTERNATIVES[ex.name]?.length > 0;
        const injuryConflict = injuries.some(inj => ex.injury_contraindications?.includes(inj));
        return (
          <button key={i} onClick={() => loadAlternatives(ex.name)} style={{
            width: "100%", background: injuryConflict ? "#fff8f8" : "#fff",
            border: `1px solid ${injuryConflict ? "#f0c0c0" : "#e8e8e8"}`,
            borderRadius: "7px", padding: "11px 13px", marginBottom: "6px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            cursor: "pointer", ...F, textAlign: "left",
          }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "500", color: injuryConflict ? "#a02a2a" : "#1a1a1a", display: "flex", alignItems: "center", gap: "5px" }}>
                {injuryConflict && <span style={{ fontSize: "11px" }}>⚠️</span>}
                {ex.name}
              </div>
              <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", textTransform: "capitalize" }}>
                {ex.primary_muscle}{ex.category ? ` · ${ex.category}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {hasAlternatives && (
                <span style={{ fontSize: "9px", background: "#e9f0fb", color: "#2563a8", padding: "2px 7px", borderRadius: "20px" }}>
                  alternatives
                </span>
              )}
              <span style={{ color: "#ccc", fontSize: "12px" }}>→</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
