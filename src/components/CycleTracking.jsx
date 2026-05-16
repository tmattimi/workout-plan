import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Cycle phases with training + body guidance
const PHASES = {
  menstrual: {
    name: "Menstrual",
    days: "Days 1–5",
    color: "#a02020",
    bg: "#fff0f0",
    trainingFocus: "Active recovery & gentle movement",
    bodyFeel: "Energy is lowest. Prostaglandins cause cramping. Iron drops with blood loss.",
    training: [
      "Light walking, yoga, or stretching are ideal",
      "If you feel up to lifting — go lighter, shorter sessions",
      "Skip high-intensity cardio — your body is doing significant work internally",
      "Honor fatigue without guilt: rest is training too",
    ],
    nutrition: [
      "Iron-rich foods: red meat, leafy greens, lentils",
      "Anti-inflammatory: omega-3s, ginger, turmeric",
      "Magnesium for cramps: dark chocolate, nuts, seeds",
      "Stay hydrated — you lose more fluid",
    ],
    scripture: { v: "Come to me, all who are weary and burdened, and I will give you rest.", r: "Matthew 11:28" },
  },
  follicular: {
    name: "Follicular",
    days: "Days 6–13",
    color: "#2563a8",
    bg: "#e9f0fb",
    trainingFocus: "Build strength — your best window",
    bodyFeel: "Estrogen rises, energy climbs. Neuromuscular coordination is at its peak. This is your strongest phase.",
    training: [
      "Prioritize heavy compound lifts — progressive overload hits best here",
      "High-intensity cardio: your body handles it well",
      "Try new PRs — strength and power output is highest",
      "Recovery is faster in this phase — you can push harder",
    ],
    nutrition: [
      "Protein stays high — muscles are primed to grow",
      "Carbs support high-intensity training",
      "Lighter, fresher foods feel natural in this phase",
      "Hydration is still key — especially around heavy sessions",
    ],
    scripture: { v: "She is energetic and strong, a hard worker.", r: "Proverbs 31:17" },
  },
  ovulation: {
    name: "Ovulation",
    days: "Days 14–16",
    color: "#147a50",
    bg: "#e5f7f0",
    trainingFocus: "Peak power — compete & perform",
    bodyFeel: "LH surge. Estrogen peaks. You feel confident, social, and strong. Coordination and reaction time are highest.",
    training: [
      "Athletic performance is at its absolute peak — use it",
      "Great window for competition, testing maxes, or setting records",
      "Note: ligament laxity increases slightly — warm up thoroughly",
      "High-intensity intervals and power work respond well",
    ],
    nutrition: [
      "Zinc and antioxidants support ovulation: pumpkin seeds, berries",
      "Fiber-rich foods to support estrogen metabolism",
      "Lighter meals — appetite often decreases naturally",
      "Anti-inflammatory foods remain important",
    ],
    scripture: { v: "The Lord gives his people strength. The Lord blesses them with peace.", r: "Psalm 29:11" },
  },
  luteal: {
    name: "Luteal",
    days: "Days 17–28",
    color: "#7a3aa0",
    bg: "#f3eafa",
    trainingFocus: "Moderate intensity — listen to your body",
    bodyFeel: "Progesterone rises. Body temperature increases slightly. PMS symptoms may appear in the second half. Energy can drop.",
    training: [
      "First half (days 17–21): still strong — moderate to hard sessions work well",
      "Second half (days 22–28): reduce intensity if PMS hits",
      "Strength may feel harder — that's normal, not failure",
      "Prioritize sleep and recovery — progesterone affects sleep quality",
    ],
    nutrition: [
      "Caloric needs increase slightly (up to 100–300 kcal)",
      "Complex carbs reduce PMS cravings and mood dips",
      "Magnesium and B6 for PMS: bananas, potatoes, chicken",
      "Reduce caffeine and sodium to minimize bloating",
    ],
    scripture: { v: "I can do everything through Christ, who gives me strength.", r: "Philippians 4:13" },
  },
};

function loadCycleData() {
  try { return JSON.parse(localStorage.getItem("cycle_data_v1") || "null"); } catch { return null; }
}
function saveCycleData(d) {
  try { localStorage.setItem("cycle_data_v1", JSON.stringify(d)); } catch {}
}

function getCurrentPhase(lastPeriodStart, cycleLength = 28) {
  if (!lastPeriodStart) return null;
  const start = new Date(lastPeriodStart + "T12:00:00");
  const today = new Date();
  const dayOfCycle = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  const day = ((dayOfCycle - 1) % cycleLength) + 1;

  if (day <= 5) return { phase: "menstrual", day };
  if (day <= 13) return { phase: "follicular", day };
  if (day <= 16) return { phase: "ovulation", day };
  return { phase: "luteal", day };
}

function getDaysUntilNext(lastPeriodStart, cycleLength = 28) {
  if (!lastPeriodStart) return null;
  const start = new Date(lastPeriodStart + "T12:00:00");
  const today = new Date();
  const dayOfCycle = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  const day = ((dayOfCycle - 1) % cycleLength) + 1;
  return cycleLength - day + 1;
}

function PhaseBar({ currentDay, cycleLength }) {
  const pct = ((currentDay - 1) / cycleLength) * 100;
  return (
    <div style={{ position: "relative", marginBottom: "6px" }}>
      <div style={{ display: "flex", height: "8px", borderRadius: "20px", overflow: "hidden" }}>
        <div style={{ flex: 5, background: "#a02020" }} />
        <div style={{ flex: 8, background: "#2563a8" }} />
        <div style={{ flex: 3, background: "#147a50" }} />
        <div style={{ flex: 12, background: "#7a3aa0" }} />
      </div>
      <div style={{ position: "absolute", top: "-2px", left: `calc(${pct}% - 6px)`, width: "12px", height: "12px", borderRadius: "50%", background: "#111", border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

export default function CycleTracking() {
  const [data, setData] = useState(() => loadCycleData() || { lastPeriodStart: "", cycleLength: 28, symptoms: [], notes: "" });
  const [activeSection, setActiveSection] = useState("overview");
  const [saved, setSaved] = useState(false);

  useEffect(() => { saveCycleData(data); }, [data]);

  const phaseInfo = getCurrentPhase(data.lastPeriodStart, data.cycleLength);
  const phase = phaseInfo ? PHASES[phaseInfo.phase] : null;
  const daysUntilNext = getDaysUntilNext(data.lastPeriodStart, data.cycleLength);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  const SYMPTOMS = ["Cramping", "Bloating", "Fatigue", "Mood changes", "Headache", "Breast tenderness", "Cravings", "Low motivation", "High energy", "Brain fog"];

  return (
    <div style={{ padding: "16px 16px 60px" }}>

      {/* Setup if no data */}
      {!data.lastPeriodStart && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "14px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Set up cycle tracking</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>First day of last period</div>
              <input type="date" value={data.lastPeriodStart} onChange={e => setData(p => ({ ...p, lastPeriodStart: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Avg cycle length (days)</div>
              <input type="number" min="21" max="40" value={data.cycleLength} onChange={e => setData(p => ({ ...p, cycleLength: parseInt(e.target.value) || 28 }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
            </div>
          </div>
          <button onClick={handleSave} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      )}

      {/* Current phase card */}
      {phase && phaseInfo && (
        <>
          <div style={{ background: phase.bg, border: `1px solid ${phase.color}33`, borderRadius: "10px", padding: "16px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, marginBottom: "2px" }}>Current phase</div>
                <div style={{ fontSize: "20px", ...F, color: "#111" }}>{phase.name}</div>
                <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>{phase.days} · Day {phaseInfo.day} of {data.cycleLength}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "#999", textTransform: "uppercase", letterSpacing: "0.1em" }}>Next period</div>
                <div style={{ fontSize: "16px", color: "#a02020", ...F }}>{daysUntilNext}d</div>
              </div>
            </div>

            <PhaseBar currentDay={phaseInfo.day} cycleLength={data.cycleLength} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#aaa", marginTop: "4px" }}>
              <span>Day 1</span><span>Day {data.cycleLength}</span>
            </div>

            <div style={{ marginTop: "12px", fontSize: "12px", color: "#444", lineHeight: "1.6", ...F, fontStyle: "italic" }}>{phase.bodyFeel}</div>
            <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "600", color: phase.color }}>{phase.trainingFocus}</div>
          </div>

          {/* Section tabs */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
            {["overview", "training", "nutrition", "log"].map(s => (
              <button key={s} onClick={() => setActiveSection(s)} style={{
                flex: 1, padding: "7px 4px", border: "1px solid " + (activeSection === s ? "#111" : "#ddd"),
                borderRadius: "5px", background: activeSection === s ? "#111" : "#fafaf8",
                color: activeSection === s ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "10px",
                textTransform: "capitalize", letterSpacing: "0.05em", ...F,
              }}>{s}</button>
            ))}
          </div>

          {activeSection === "overview" && (
            <div>
              {/* All 4 phases overview */}
              {Object.entries(PHASES).map(([key, p]) => (
                <div key={key} style={{ background: phaseInfo.phase === key ? p.bg : "#fff", border: `1px solid ${phaseInfo.phase === key ? p.color + "44" : "#e8e8e8"}`, borderRadius: "7px", padding: "12px 14px", marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: p.color }}>{p.name}</span>
                      <span style={{ fontSize: "10px", color: "#aaa", marginLeft: "8px" }}>{p.days}</span>
                    </div>
                    {phaseInfo.phase === key && <span style={{ fontSize: "10px", background: p.color, color: "#fff", borderRadius: "20px", padding: "2px 8px" }}>Now</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: "#777", marginTop: "4px" }}>{p.trainingFocus}</div>
                </div>
              ))}

              {/* Scripture */}
              <div style={{ background: "#111", borderRadius: "8px", padding: "14px", marginTop: "14px" }}>
                <div style={{ fontSize: "12px", color: "#e8e0cc", fontStyle: "italic", lineHeight: "1.7", ...F }}>"{phase.scripture.v}"</div>
                <div style={{ fontSize: "10px", color: "#c47a0a", marginTop: "6px" }}>— {phase.scripture.r}</div>
              </div>

              {/* Update cycle settings */}
              <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "14px", marginTop: "12px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Update cycle</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Last period started</div>
                    <input type="date" value={data.lastPeriodStart} onChange={e => setData(p => ({ ...p, lastPeriodStart: e.target.value }))}
                      style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "11px", boxSizing: "border-box", ...F }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Cycle length</div>
                    <input type="number" min="21" max="40" value={data.cycleLength} onChange={e => setData(p => ({ ...p, cycleLength: parseInt(e.target.value) || 28 }))}
                      style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "11px", boxSizing: "border-box", ...F }} />
                  </div>
                </div>
                <button onClick={handleSave} style={{ marginTop: "8px", background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                  {saved ? "Saved" : "Update"}
                </button>
              </div>
            </div>
          )}

          {activeSection === "training" && (
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: phase.color, marginBottom: "12px" }}>Training — {phase.name} Phase</div>
              {phase.training.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", paddingBottom: "10px", borderBottom: i < phase.training.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: phase.color, flexShrink: 0, marginTop: "5px" }} />
                  <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{tip}</div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "nutrition" && (
            <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: phase.color, marginBottom: "12px" }}>Nutrition — {phase.name} Phase</div>
              {phase.nutrition.map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", paddingBottom: "10px", borderBottom: i < phase.nutrition.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: phase.color, flexShrink: 0, marginTop: "5px" }} />
                  <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{tip}</div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "log" && (
            <div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Today's symptoms</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {SYMPTOMS.map(s => {
                    const active = (data.symptoms || []).includes(s);
                    return (
                      <button key={s} onClick={() => setData(p => ({
                        ...p,
                        symptoms: active ? p.symptoms.filter(x => x !== s) : [...(p.symptoms || []), s]
                      }))} style={{
                        padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", ...F,
                        background: active ? phase.color : "#f5f5f3",
                        color: active ? "#fff" : "#666",
                        border: "1px solid " + (active ? phase.color : "#e0e0e0"),
                      }}>{s}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Notes for today</div>
                <textarea value={data.notes || ""} onChange={e => setData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="How is your body feeling today? Energy, mood, recovery..."
                  rows={3} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "12px", resize: "none", boxSizing: "border-box", lineHeight: "1.6", ...F }} />
                <button onClick={handleSave} style={{ marginTop: "8px", background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                  {saved ? "Saved" : "Save"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ marginTop: "20px", padding: "12px 14px", background: "#f5f5f3", borderRadius: "7px" }}>
        <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.7", ...F }}>
          Cycle-based training is about working <em>with</em> your body, not against it. Every phase has value — including rest. This information is educational; always listen to your body over any phase prescription.
        </div>
      </div>
    </div>
  );
}
