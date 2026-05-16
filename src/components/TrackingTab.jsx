import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Shared storage ────────────────────────────────────────────────────────────
function loadGoals() { try { return JSON.parse(localStorage.getItem("goals_v1") || "[]"); } catch { return []; } }
function saveGoals(g) { try { localStorage.setItem("goals_v1", JSON.stringify(g)); } catch {} }
function getMonthKey() { return new Date().toISOString().slice(0, 7); }
function getMonthLabel() { return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }); }
function loadMonthData(key) { try { return JSON.parse(localStorage.getItem(`monthly_goals_${key}`) || "null"); } catch { return null; } }
function saveMonthData(key, data) { try { localStorage.setItem(`monthly_goals_${key}`, JSON.stringify(data)); } catch {} }
function loadAllMonths() {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith("monthly_goals_"))
      .map(k => { try { return { key: k.replace("monthly_goals_", ""), ...JSON.parse(localStorage.getItem(k)) }; } catch { return null; } })
      .filter(Boolean).sort((a, b) => b.key.localeCompare(a.key));
  } catch { return []; }
}

// ── Goal types ────────────────────────────────────────────────────────────────
const GOAL_TYPES = [
  { id: "strength", label: "Strength", unit: "lbs", hasTarget: true },
  { id: "reps", label: "Reps", unit: "reps", hasTarget: true },
  { id: "bodyweight", label: "Bodyweight", unit: "lbs", hasTarget: true },
  { id: "habit", label: "Habit", unit: "weeks", hasTarget: true },
  { id: "custom", label: "Custom", unit: "", hasTarget: false },
];

const REFLECTION_PROMPTS = [
  "What did you do consistently this month that you're proud of?",
  "Where did your body surprise you — positively or negatively?",
  "What habit do you want to carry into next month?",
  "Where did you struggle, and what would you do differently?",
  "What did you learn about yourself through your training this month?",
];

// ── Add Goal form ─────────────────────────────────────────────────────────────
function AddGoalForm({ onAdd, onCancel }) {
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const gt = GOAL_TYPES.find(t => t.id === type);

  function submit() {
    if (!name.trim()) return;
    onAdd({ id: Date.now(), type, name: name.trim(), targetValue: targetValue ? parseFloat(targetValue) : null, unit: gt.unit, targetDate: targetDate || null, notes: notes.trim() || null, currentValue: 0, prevPct: 0, completed: false, createdDate: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>New Goal</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
        {GOAL_TYPES.map(t => (
          <button key={t.id} onClick={() => setType(t.id)} style={{ background: type === t.id ? "#1a1a1a" : "#f5f5f3", color: type === t.id ? "#f7f6f3" : "#555", border: "1px solid " + (type === t.id ? "#1a1a1a" : "#e0e0e0"), borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F }}>{t.label}</button>
        ))}
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Do 1 pull-up, reach 145 lbs"
        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", marginBottom: "8px", ...F }} />
      {gt.hasTarget && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder={`Target (${gt.unit})`}
            style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
            style={{ flex: 1, padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>
      )}
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why this goal matters..." rows={2}
        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", resize: "none", boxSizing: "border-box", marginBottom: "12px", ...F }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={submit} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "6px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>Add Goal</button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Goal card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(goal.currentValue || "");
  const [celebrated, setCelebrated] = useState(false);

  const pct = goal.targetValue ? Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)) : null;

  function handleUpdate() {
    const val = parseFloat(progress);
    if (isNaN(val)) return;
    const newPct = goal.targetValue ? Math.min(100, Math.round((val / goal.targetValue) * 100)) : null;
    const milestones = [25, 50, 75, 100];
    const crossed = milestones.filter(m => m > (goal.prevPct || 0) && m <= (newPct || 0));
    if (crossed.length) setCelebrated(crossed[crossed.length - 1]);
    onUpdate({ ...goal, currentValue: val, prevPct: newPct });
    setEditing(false);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "8px", overflow: "hidden" }}>
      {celebrated && (
        <div style={{ background: "#1a1a1a", color: "#f7f6f3", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
          <span style={{ ...F }}>{celebrated === 100 ? "Goal complete!" : `${celebrated}% there!`}</span>
          <button onClick={() => setCelebrated(null)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600" }}>{goal.name}</div>
            <div style={{ fontSize: "10px", color: "#aaa" }}>{GOAL_TYPES.find(t => t.id === goal.type)?.label}{goal.targetDate ? ` · By ${goal.targetDate}` : ""}</div>
          </div>
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 0 0 8px" }}>×</button>
        </div>

        {pct !== null && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#aaa", marginBottom: "4px" }}>
              <span>{goal.currentValue || 0} {goal.unit}</span>
              <span>Target: {goal.targetValue} {goal.unit}</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "5px", marginBottom: "6px" }}>
              <div style={{ background: goal.completed ? "#2d7a1e" : "#1a1a1a", borderRadius: "20px", height: "5px", width: `${pct}%`, transition: "width 0.4s ease" }} />
            </div>
            <div style={{ fontSize: "10px", color: goal.completed ? "#2d7a1e" : "#888", marginBottom: "8px" }}>{pct}% complete</div>
          </>
        )}

        {goal.notes && <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic", marginBottom: "8px", lineHeight: "1.5" }}>{goal.notes}</div>}

        {!goal.completed && (
          editing ? (
            <div style={{ display: "flex", gap: "6px" }}>
              <input type="number" value={progress} onChange={e => setProgress(e.target.value)} placeholder={`Current ${goal.unit || "value"}`}
                style={{ flex: 1, padding: "6px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", ...F }} />
              <button onClick={handleUpdate} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", fontSize: "11px", cursor: "pointer" }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #ddd", borderRadius: "5px", padding: "6px 10px", fontSize: "11px", cursor: "pointer", color: "#999" }}>×</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              {goal.targetValue && <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid #ddd", color: "#555", borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>Update</button>}
              <button onClick={() => onUpdate({ ...goal, completed: true, completedDate: new Date().toISOString().slice(0, 10) })} style={{ background: "none", border: "1px solid #2d7a1e", color: "#2d7a1e", borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>Done</button>
            </div>
          )
        )}
        {goal.completed && <div style={{ fontSize: "11px", color: "#2d7a1e", fontWeight: "600" }}>Completed {goal.completedDate || ""}</div>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TrackingTab() {
  const monthKey = getMonthKey();
  const [section, setSection] = useState("goals"); // goals | monthly | history
  const [goals, setGoals] = useState(loadGoals);
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [monthData, setMonthData] = useState(() => loadMonthData(monthKey) || { goals: ["", "", ""], reflection: "", promptIndex: 0 });
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { saveMonthData(monthKey, monthData); }, [monthData, monthKey]);

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);
  const prompt = REFLECTION_PROMPTS[monthData.promptIndex % REFLECTION_PROMPTS.length];

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function loadHistory() {
    setHistory(loadAllMonths().filter(m => m.key !== monthKey));
    setSection("history");
  }

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px" }}>
        {[["goals", "Goals"], ["monthly", getMonthLabel().split(" ")[0]]].map(([s, label]) => (
          <button key={s} onClick={() => setSection(s)} style={{
            flex: 1, padding: "8px", border: "1px solid " + (section === s ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "6px", background: section === s ? "#1a1a1a" : "#fff",
            color: section === s ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "12px", ...F,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Goals section ── */}
      {section === "goals" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>
              {active.length} active goal{active.length !== 1 ? "s" : ""}
            </div>
            {!adding && (
              <button onClick={() => setAdding(true)} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                + New Goal
              </button>
            )}
          </div>

          {adding && <AddGoalForm onAdd={g => { setGoals(p => [g, ...p]); setAdding(false); }} onCancel={() => setAdding(false)} />}

          {active.length === 0 && !adding && (
            <div style={{ textAlign: "center", padding: "30px 20px", color: "#bbb", ...F }}>
              <div style={{ fontSize: "14px", marginBottom: "6px" }}>No active goals</div>
              <div style={{ fontSize: "11px" }}>Add a goal to start tracking</div>
            </div>
          )}

          {active.map(g => (
            <GoalCard key={g.id} goal={g}
              onUpdate={u => setGoals(p => p.map(x => x.id === g.id ? u : x))}
              onDelete={() => setGoals(p => p.filter(x => x.id !== g.id))}
            />
          ))}

          {completed.length > 0 && (
            <>
              <button onClick={() => setShowCompleted(p => !p)} style={{ background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", padding: "8px 0", ...F }}>
                {showCompleted ? "▲" : "▼"} {completed.length} completed
              </button>
              {showCompleted && completed.map(g => (
                <GoalCard key={g.id} goal={g}
                  onUpdate={u => setGoals(p => p.map(x => x.id === g.id ? u : x))}
                  onDelete={() => setGoals(p => p.filter(x => x.id !== g.id))}
                />
              ))}
            </>
          )}

          <div style={{ marginTop: "16px", padding: "12px 14px", background: "#f5f5f3", borderRadius: "7px", fontSize: "11px", color: "#777", lineHeight: "1.65", ...F }}>
            Goals will auto-populate from your logged PRs and body measurements once device sync is connected. For now, set them manually and update after each session.
          </div>
        </>
      )}

      {/* ── Monthly section ── */}
      {section === "monthly" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "15px", ...F }}>{getMonthLabel()}</div>
            <button onClick={loadHistory} style={{ background: "none", border: "1px solid #e0e0e0", color: "#999", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", cursor: "pointer" }}>Past months</button>
          </div>

          {/* Intentions */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>This month's intentions</div>
            {monthData.goals.map((goal, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: goal.trim() ? "#1a1a1a" : "#f0f0f0", color: goal.trim() ? "#fff" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>{i + 1}</div>
                <input value={goal} onChange={e => { const g = [...monthData.goals]; g[i] = e.target.value; setMonthData(p => ({ ...p, goals: g })); }}
                  placeholder={["Train consistently", "Focus on progressive overload", "Honor my rest days"][i]}
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "12px", background: "#fafaf8", ...F }} />
              </div>
            ))}
            {monthData.goals.length < 5 && (
              <button onClick={() => setMonthData(p => ({ ...p, goals: [...p.goals, ""] }))} style={{ background: "none", border: "none", color: "#ccc", fontSize: "11px", cursor: "pointer", padding: "4px 0", ...F }}>+ Add intention</button>
            )}
          </div>

          {/* Reflection */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Reflection</div>
              <button onClick={() => setMonthData(p => ({ ...p, promptIndex: (p.promptIndex + 1) % REFLECTION_PROMPTS.length }))} style={{ background: "none", border: "none", color: "#bbb", fontSize: "10px", cursor: "pointer" }}>New prompt</button>
            </div>
            <div style={{ fontSize: "12px", color: "#666", fontStyle: "italic", marginBottom: "10px", lineHeight: "1.6", ...F }}>{prompt}</div>
            <textarea value={monthData.reflection} onChange={e => setMonthData(p => ({ ...p, reflection: e.target.value }))}
              placeholder="Write your thoughts here..." rows={4}
              style={{ width: "100%", padding: "10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "12px", resize: "none", lineHeight: "1.7", boxSizing: "border-box", background: "#fafaf8", ...F }} />
          </div>

          <button onClick={handleSave} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "6px", padding: "10px 20px", fontSize: "12px", cursor: "pointer", ...F }}>
            {saved ? "Saved" : "Save"}
          </button>
        </>
      )}

      {/* ── History section ── */}
      {section === "history" && (
        <>
          <button onClick={() => setSection("monthly")} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "14px", ...F }}>← Back</button>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Past months</div>
          {history.length === 0 ? (
            <div style={{ color: "#bbb", fontSize: "12px", ...F }}>No past months recorded yet.</div>
          ) : history.map(m => (
            <div key={m.key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>
                {new Date(m.key + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              {m.goals?.filter(g => g?.trim()).map((g, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#555", marginBottom: "3px", display: "flex", gap: "6px" }}>
                  <span style={{ color: "#2d7a1e" }}>✓</span>{g}
                </div>
              ))}
              {m.reflection && (
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#999", fontStyle: "italic", borderTop: "1px solid #f0f0f0", paddingTop: "8px", lineHeight: "1.6", ...F }}>
                  {m.reflection.slice(0, 140)}{m.reflection.length > 140 ? "…" : ""}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
