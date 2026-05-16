import { useState, useEffect } from "react";
import MuscleScience from "./MuscleScience";
import AlternativeExercises from "./AlternativeExercises";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Storage ───────────────────────────────────────────────────────────────────
function loadGoals() { try { return JSON.parse(localStorage.getItem("goals_v1") || "[]"); } catch { return []; } }
function saveGoals(g) { try { localStorage.setItem("goals_v1", JSON.stringify(g)); } catch {} }
function getMonthKey() { return new Date().toISOString().slice(0, 7); }
function getMonthLabel() { return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function loadMonthData(key) { try { return JSON.parse(localStorage.getItem(`monthly_goals_${key}`) || "null"); } catch { return null; } }
function saveMonthData(key, data) { try { localStorage.setItem(`monthly_goals_${key}`, JSON.stringify(data)); } catch {} }

const GOAL_TYPES = [
  { id: "strength", label: "Strength", unit: "lbs" },
  { id: "reps", label: "Reps", unit: "reps" },
  { id: "bodyweight", label: "Bodyweight", unit: "lbs" },
  { id: "habit", label: "Habit", unit: "weeks" },
  { id: "custom", label: "Custom", unit: "" },
];

const REFLECTION_PROMPTS = [
  "What did you do consistently this month that you're proud of?",
  "Where did your body surprise you — positively or negatively?",
  "What habit do you want to carry into next month?",
  "Where did you struggle, and what would you do differently?",
  "What did you learn about yourself through your training this month?",
];

// ── Goals section ─────────────────────────────────────────────────────────────
function GoalsSection() {
  const monthKey = getMonthKey();
  const [goals, setGoals] = useState(loadGoals);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ type: "strength", name: "", targetValue: "", targetDate: "", notes: "" });
  const [showCompleted, setShowCompleted] = useState(false);
  const [monthData, setMonthData] = useState(() => loadMonthData(monthKey) || { goals: ["", "", ""], reflection: "", promptIndex: 0 });
  const [saved, setSaved] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  const [progressVal, setProgressVal] = useState("");

  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveMonthData(monthKey, monthData); }, [monthData, monthKey]);

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);
  const prompt = REFLECTION_PROMPTS[monthData.promptIndex % REFLECTION_PROMPTS.length];

  function addGoal() {
    if (!newGoal.name.trim()) return;
    const gt = GOAL_TYPES.find(t => t.id === newGoal.type);
    setGoals(p => [{ id: Date.now(), ...newGoal, targetValue: newGoal.targetValue ? parseFloat(newGoal.targetValue) : null, unit: gt.unit, currentValue: 0, prevPct: 0, completed: false, createdDate: new Date().toISOString().slice(0, 10) }, ...p]);
    setNewGoal({ type: "strength", name: "", targetValue: "", targetDate: "", notes: "" });
    setAdding(false);
  }

  function updateProgress(goal) {
    const val = parseFloat(progressVal);
    if (isNaN(val)) return;
    const newPct = goal.targetValue ? Math.min(100, Math.round((val / goal.targetValue) * 100)) : null;
    setGoals(p => p.map(g => g.id === goal.id ? { ...g, currentValue: val, prevPct: newPct } : g));
    setEditingProgress(null);
    setProgressVal("");
  }

  return (
    <div>
      {/* Active goals */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Goals</div>
        {!adding && <button onClick={() => setAdding(true)} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>+ New Goal</button>}
      </div>

      {adding && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px", marginBottom: "10px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
            {GOAL_TYPES.map(t => (
              <button key={t.id} onClick={() => setNewGoal(p => ({ ...p, type: t.id }))} style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "10px", cursor: "pointer", background: newGoal.type === t.id ? "#1a1a1a" : "#f5f5f3", color: newGoal.type === t.id ? "#f7f6f3" : "#555", border: "1px solid " + (newGoal.type === t.id ? "#1a1a1a" : "#e0e0e0") }}>{t.label}</button>
            ))}
          </div>
          <input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} placeholder="Goal name" style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", marginBottom: "7px", ...F }} />
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            <input type="number" value={newGoal.targetValue} onChange={e => setNewGoal(p => ({ ...p, targetValue: e.target.value }))} placeholder={`Target (${GOAL_TYPES.find(t => t.id === newGoal.type)?.unit || ""})`} style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
            <input type="date" value={newGoal.targetDate} onChange={e => setNewGoal(p => ({ ...p, targetDate: e.target.value }))} style={{ flex: 1, padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={addGoal} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>Add</button>
            <button onClick={() => setAdding(false)} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "5px", padding: "8px 12px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {active.map(goal => {
        const pct = goal.targetValue ? Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)) : null;
        return (
          <div key={goal.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "11px 13px", marginBottom: "7px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: "600" }}>{goal.name}</div>
                <div style={{ fontSize: "10px", color: "#aaa" }}>{GOAL_TYPES.find(t => t.id === goal.type)?.label}{goal.targetDate ? ` · By ${goal.targetDate}` : ""}</div>
              </div>
              <button onClick={() => setGoals(p => p.filter(g => g.id !== goal.id))} style={{ background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: "16px" }}>×</button>
            </div>
            {pct !== null && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#aaa", marginBottom: "3px" }}>
                  <span>{goal.currentValue || 0} {goal.unit}</span>
                  <span>Target: {goal.targetValue} {goal.unit}</span>
                </div>
                <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "4px", marginBottom: "7px" }}>
                  <div style={{ background: "#1a1a1a", borderRadius: "20px", height: "4px", width: `${pct}%`, transition: "width 0.4s ease" }} />
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: "5px" }}>
              {editingProgress === goal.id ? (
                <>
                  <input type="number" value={progressVal} onChange={e => setProgressVal(e.target.value)} placeholder={`Current ${goal.unit}`} autoFocus style={{ flex: 1, padding: "5px 8px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "11px" }} />
                  <button onClick={() => updateProgress(goal)} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "4px", padding: "5px 10px", fontSize: "10px", cursor: "pointer" }}>Save</button>
                  <button onClick={() => { setEditingProgress(null); setProgressVal(""); }} style={{ background: "none", border: "1px solid #ddd", borderRadius: "4px", padding: "5px 8px", fontSize: "10px", cursor: "pointer", color: "#aaa" }}>×</button>
                </>
              ) : (
                <>
                  {goal.targetValue && <button onClick={() => { setEditingProgress(goal.id); setProgressVal(goal.currentValue || ""); }} style={{ background: "none", border: "1px solid #ddd", color: "#555", borderRadius: "4px", padding: "4px 10px", fontSize: "10px", cursor: "pointer" }}>Update</button>}
                  <button onClick={() => setGoals(p => p.map(g => g.id === goal.id ? { ...g, completed: true, completedDate: new Date().toISOString().slice(0, 10) } : g))} style={{ background: "none", border: "1px solid #2d7a1e", color: "#2d7a1e", borderRadius: "4px", padding: "4px 10px", fontSize: "10px", cursor: "pointer" }}>Done</button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {active.length === 0 && !adding && <div style={{ textAlign: "center", padding: "16px", color: "#bbb", fontSize: "12px", ...F }}>No active goals. Tap "+ New Goal" to add one.</div>}

      {completed.length > 0 && (
        <button onClick={() => setShowCompleted(p => !p)} style={{ background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", padding: "6px 0" }}>
          {showCompleted ? "▲" : "▼"} {completed.length} completed
        </button>
      )}
      {showCompleted && completed.map(goal => (
        <div key={goal.id} style={{ background: "#f9f9f7", border: "1px solid #ebebeb", borderRadius: "7px", padding: "10px 13px", marginBottom: "6px" }}>
          <div style={{ fontSize: "12px", color: "#888" }}>{goal.name}</div>
          <div style={{ fontSize: "10px", color: "#2d7a1e", marginTop: "2px" }}>Completed {goal.completedDate || ""}</div>
          <button onClick={() => setGoals(p => p.filter(g => g.id !== goal.id))} style={{ background: "none", border: "none", color: "#e0e0e0", fontSize: "11px", cursor: "pointer", marginTop: "4px" }}>Remove</button>
        </div>
      ))}

      {/* Monthly intentions */}
      <div style={{ height: "1px", background: "#ebebeb", margin: "18px 0 14px" }} />
      <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>
        {getMonthLabel()} — Intentions
      </div>
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px", marginBottom: "10px" }}>
        {monthData.goals.map((goal, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "7px" }}>
            <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: goal.trim() ? "#1a1a1a" : "#f0f0f0", color: goal.trim() ? "#fff" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", flexShrink: 0 }}>{i + 1}</div>
            <input value={goal} onChange={e => { const g = [...monthData.goals]; g[i] = e.target.value; setMonthData(p => ({ ...p, goals: g })); }}
              placeholder={["Train consistently", "Progressive overload", "Honor rest days"][i]}
              style={{ flex: 1, padding: "6px 10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "11px", background: "#fafaf8", ...F }} />
          </div>
        ))}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px", marginBottom: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "7px" }}>
          <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>Reflection</div>
          <button onClick={() => setMonthData(p => ({ ...p, promptIndex: (p.promptIndex + 1) % REFLECTION_PROMPTS.length }))} style={{ background: "none", border: "none", color: "#bbb", fontSize: "10px", cursor: "pointer" }}>New prompt</button>
        </div>
        <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", marginBottom: "8px", lineHeight: "1.6", ...F }}>{prompt}</div>
        <textarea value={monthData.reflection} onChange={e => setMonthData(p => ({ ...p, reflection: e.target.value }))} placeholder="Write your thoughts here..." rows={3}
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "11px", resize: "none", lineHeight: "1.65", boxSizing: "border-box", background: "#fafaf8", ...F }} />
      </div>
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "11px", cursor: "pointer", ...F }}>
        {saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

// ── Guide section ─────────────────────────────────────────────────────────────
function GuideSection({ principles }) {
  const [expandedPrinciple, setExpandedPrinciple] = useState(null);

  if (!principles || principles.length === 0) {
    return <div style={{ color: "#bbb", fontSize: "12px", textAlign: "center", padding: "20px" }}>Guide content loading...</div>;
  }

  return (
    <div>
      {principles.map((section, si) => (
        <div key={si} style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c47a0a", marginBottom: "7px", paddingBottom: "5px", borderBottom: "1px solid #ebebeb" }}>
            {section.section}
          </div>
          {section.entries.map((p, i) => {
            const key = `${si}-${i}`;
            return (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "6px", marginBottom: "5px", overflow: "hidden" }}>
                <button onClick={() => setExpandedPrinciple(expandedPrinciple === key ? null : key)}
                  style={{ width: "100%", background: "transparent", border: "none", padding: "10px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{p.title}</span>
                  <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}>{expandedPrinciple === key ? "▲" : "▼"}</span>
                </button>
                {expandedPrinciple === key && (
                  <div style={{ padding: "0 13px 11px", fontSize: "11px", color: "#555", lineHeight: "1.75", borderTop: "1px solid #f5f5f3" }}>
                    <div style={{ paddingTop: "9px" }}>{p.body}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Main ToolsTab ─────────────────────────────────────────────────────────────
export default function ToolsTab({ principles, clientEquipment, clientInjuries, onEquipmentChange, onInjuryChange, defaultSection }) {
  const [section, setSection] = useState(defaultSection || "alternatives");

  const SECTIONS = [
    { id: "alternatives", label: "Alternatives" },
    { id: "goals", label: "Goals" },
    { id: "muscles", label: "Muscles" },
    { id: "guide", label: "Guide" },
  ];

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px" }}>
        {SECTIONS.map(({ id, label }) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "7px 4px", border: "1px solid " + (section === id ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "6px", background: section === id ? "#1a1a1a" : "#fff",
            color: section === id ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "11px", ...F,
          }}>{label}</button>
        ))}
      </div>

      {section === "alternatives" && (
        <AlternativeExercises
          clientEquipment={clientEquipment}
          clientInjuries={clientInjuries}
          onEquipmentChange={onEquipmentChange}
          onInjuryChange={onInjuryChange}
        />
      )}

      {section === "goals" && <GoalsSection />}

      {section === "muscles" && (
        <div style={{ margin: "0 -16px" }}>
          <MuscleScience />
        </div>
      )}

      {section === "guide" && <GuideSection principles={principles} />}
    </div>
  );
}
