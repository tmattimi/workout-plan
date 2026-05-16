import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const GOAL_TYPES = [
  { id: "strength", label: "Strength Goal", examples: "e.g. Do 1 pull-up, Bench 100 lbs", unit: "lbs", hasTarget: true },
  { id: "reps", label: "Rep Goal", examples: "e.g. 10 pull-ups, 20 push-ups", unit: "reps", hasTarget: true },
  { id: "bodyweight", label: "Bodyweight Goal", examples: "e.g. Reach 145 lbs", unit: "lbs", hasTarget: true },
  { id: "habit", label: "Habit Goal", examples: "e.g. Train 5 days/week for 8 weeks", unit: "weeks", hasTarget: true },
  { id: "custom", label: "Custom Goal", examples: "e.g. Run a 5K, Hold a plank 60s", unit: "", hasTarget: false },
];

const MILESTONES = [25, 50, 75, 100];

function loadGoals() {
  try { return JSON.parse(localStorage.getItem("goals_v1") || "[]"); } catch { return []; }
}
function saveGoals(g) {
  try { localStorage.setItem("goals_v1", JSON.stringify(g)); } catch {}
}

function GoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(goal.currentValue || "");
  const [showMilestone, setShowMilestone] = useState(null);

  const pct = goal.targetValue
    ? Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100))
    : null;

  const prevPct = goal.prevPct || 0;

  function handleUpdateProgress() {
    const val = parseFloat(progress);
    if (isNaN(val)) return;
    const newPct = goal.targetValue ? Math.min(100, Math.round((val / goal.targetValue) * 100)) : null;
    // Check if we crossed a milestone
    const crossed = MILESTONES.filter(m => m > prevPct && m <= (newPct || 0));
    if (crossed.length > 0) setShowMilestone(crossed[crossed.length - 1]);
    onUpdate({ ...goal, currentValue: val, prevPct: newPct });
    setEditing(false);
  }

  const accent = goal.completed ? "#147a50" : "#c47a0a";
  const barColor = goal.completed ? "#2d7a1e" : accent;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "10px", overflow: "hidden" }}>
      {showMilestone && (
        <div style={{ background: "#111", color: "#f7f6f3", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...F, fontSize: "13px" }}>
            {showMilestone === 100 ? "Goal complete!" : `${showMilestone}% of the way there!`}
          </span>
          <button onClick={() => setShowMilestone(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "16px" }}>×</button>
        </div>
      )}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{goal.name}</div>
            <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {GOAL_TYPES.find(t => t.id === goal.type)?.label || "Goal"}
              {goal.targetDate && ` · By ${goal.targetDate}`}
            </div>
          </div>
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "16px", padding: "0 0 0 8px" }}>×</button>
        </div>

        {goal.targetValue && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#999", marginBottom: "4px" }}>
              <span>{goal.currentValue || 0} {goal.unit}</span>
              <span>Target: {goal.targetValue} {goal.unit}</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "6px", marginBottom: "10px" }}>
              <div style={{ background: barColor, borderRadius: "20px", height: "6px", width: `${pct}%`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ fontSize: "10px", color: accent, fontWeight: "700", marginBottom: "8px" }}>{pct}% complete</div>
          </>
        )}

        {goal.notes && (
          <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", marginBottom: "8px", lineHeight: "1.5" }}>{goal.notes}</div>
        )}

        {!goal.completed && (
          editing ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="number"
                value={progress}
                onChange={e => setProgress(e.target.value)}
                placeholder={`Current ${goal.unit || "value"}`}
                style={{ flex: 1, padding: "6px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", ...F }}
              />
              <button onClick={handleUpdateProgress} style={{ background: accent, color: "#fff", border: "none", borderRadius: "5px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", ...F }}>Save</button>
              <button onClick={() => setEditing(false)} style={{ background: "none", border: "1px solid #ddd", borderRadius: "5px", padding: "6px 10px", fontSize: "11px", cursor: "pointer", color: "#999" }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setEditing(true)} style={{ background: "none", border: `1px solid ${accent}`, color: accent, borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                Update Progress
              </button>
              <button onClick={() => onUpdate({ ...goal, completed: true, completedDate: new Date().toISOString().slice(0, 10) })} style={{ background: "none", border: "1px solid #2d7a1e", color: "#2d7a1e", borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                Mark Complete
              </button>
            </div>
          )
        )}
        {goal.completed && (
          <div style={{ fontSize: "11px", color: "#2d7a1e", fontWeight: "600" }}>
            Completed {goal.completedDate || ""}
          </div>
        )}
      </div>
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }) {
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const gt = GOAL_TYPES.find(t => t.id === type);

  function submit() {
    if (!name.trim()) return;
    onAdd({
      id: Date.now(),
      type,
      name: name.trim(),
      targetValue: targetValue ? parseFloat(targetValue) : null,
      unit: gt.unit,
      targetDate: targetDate || null,
      notes: notes.trim() || null,
      currentValue: 0,
      prevPct: 0,
      completed: false,
      createdDate: new Date().toISOString().slice(0, 10),
    });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>New Goal</div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Goal type</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {GOAL_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              background: type === t.id ? "#111" : "#f5f5f3",
              color: type === t.id ? "#f7f6f3" : "#555",
              border: "1px solid " + (type === t.id ? "#111" : "#e0e0e0"),
              borderRadius: "20px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", ...F
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Goal name</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={gt.examples}
          style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
      </div>

      {gt.hasTarget && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Target ({gt.unit})</div>
            <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g. 1"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Target date (optional)</div>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Notes (optional)</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why this goal matters to you..."
          rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", resize: "none", boxSizing: "border-box", ...F }} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={submit} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>Add Goal</button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "5px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function GoalTracker() {
  const [goals, setGoals] = useState(loadGoals);
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => { saveGoals(goals); }, [goals]);

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Goals</div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
            + New Goal
          </button>
        )}
      </div>

      {adding && <AddGoalForm onAdd={g => { setGoals(prev => [g, ...prev]); setAdding(false); }} onCancel={() => setAdding(false)} />}

      {active.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#bbb", ...F }}>
          <div style={{ fontSize: "14px", marginBottom: "6px" }}>No active goals</div>
          <div style={{ fontSize: "11px" }}>Add a goal to track your progress</div>
        </div>
      )}

      {active.map(g => (
        <GoalCard
          key={g.id}
          goal={g}
          onUpdate={updated => setGoals(prev => prev.map(x => x.id === g.id ? updated : x))}
          onDelete={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
        />
      ))}

      {completed.length > 0 && (
        <>
          <button onClick={() => setShowCompleted(p => !p)} style={{ background: "none", border: "none", color: "#999", fontSize: "11px", cursor: "pointer", padding: "8px 0", ...F }}>
            {showCompleted ? "▲" : "▼"} {completed.length} completed goal{completed.length !== 1 ? "s" : ""}
          </button>
          {showCompleted && completed.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onUpdate={updated => setGoals(prev => prev.map(x => x.id === g.id ? updated : x))}
              onDelete={() => setGoals(prev => prev.filter(x => x.id !== g.id))}
            />
          ))}
        </>
      )}

      <div style={{ marginTop: "20px", padding: "14px", background: "#f5f5f3", borderRadius: "7px", fontSize: "11px", color: "#666", lineHeight: "1.7", ...F }}>
        <strong style={{ color: "#333" }}>How goal tracking works:</strong> Set a specific, measurable target. Update your progress after sessions. When you hit 25%, 50%, and 75% milestones the app will celebrate with you. Mark complete when done.
      </div>
    </div>
  );
}
