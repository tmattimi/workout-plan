import { useState, useEffect } from "react";
import { supabase, saveGoal, deleteGoal, getGoals } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const GOAL_TYPES = [
  { id: "bodyweight",   label: "Body Weight",    unit: "lbs",   metric: "weight_lbs",    examples: "e.g. Reach 145 lbs",             hasTarget: true,  tracked: true  },
  { id: "strength",     label: "Strength",       unit: "lbs",   metric: null,            examples: "e.g. Bench press 135 lbs",       hasTarget: true,  tracked: true  },
  { id: "reps",         label: "Reps",           unit: "reps",  metric: null,            examples: "e.g. 10 pull-ups unassisted",    hasTarget: true,  tracked: true  },
  { id: "measurement",  label: "Measurement",    unit: "in",    metric: null,            examples: "e.g. Waist under 28 inches",     hasTarget: true,  tracked: true  },
  { id: "body_fat",     label: "Body Fat %",     unit: "%",     metric: "body_fat_pct",  examples: "e.g. Reach 20% body fat",        hasTarget: true,  tracked: true  },
  { id: "habit",        label: "Habit",          unit: "weeks", metric: null,            examples: "e.g. Train 4x/week for 8 weeks", hasTarget: true,  tracked: false },
  { id: "custom",       label: "Custom",         unit: "",      metric: null,            examples: "e.g. Run a 5K",                  hasTarget: false, tracked: false },
];

const MEASUREMENT_METRICS = [
  { key: "waist_in",       label: "Waist (in)" },
  { key: "hips_in",        label: "Hips (in)" },
  { key: "chest_in",       label: "Chest (in)" },
  { key: "right_thigh_in", label: "Thigh (in)" },
  { key: "right_arm_in",   label: "Arm (in)" },
];

const MILESTONES = [25, 50, 75, 100];

function loadLocalGoals() {
  try { return JSON.parse(localStorage.getItem("goals_v1") || "[]"); } catch { return []; }
}

function GoalCard({ goal, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState(goal.current_value || goal.currentValue || "");
  const [showMilestone, setShowMilestone] = useState(null);
  const [saving, setSaving] = useState(false);

  const currentVal = goal.current_value ?? goal.currentValue ?? 0;
  const targetVal = goal.target_value ?? goal.targetValue;

  // For body weight / measurements where lower is the goal
  const lowerIsBetter = goal.type === "bodyweight" || goal.type === "body_fat" || goal.type === "measurement";
  const startVal = goal.start_value || currentVal;

  let pct = null;
  if (targetVal && startVal !== undefined) {
    if (lowerIsBetter && startVal > targetVal) {
      pct = Math.min(100, Math.max(0, Math.round(((startVal - currentVal) / (startVal - targetVal)) * 100)));
    } else if (!lowerIsBetter) {
      pct = Math.min(100, Math.round((currentVal / targetVal) * 100));
    }
  }

  async function handleSave() {
    const val = parseFloat(progress);
    if (isNaN(val)) return;
    setSaving(true);

    const prevPct = pct || 0;
    const newCurrentVal = val;
    let newPct = null;
    if (targetVal) {
      if (lowerIsBetter && startVal > targetVal) {
        newPct = Math.min(100, Math.max(0, Math.round(((startVal - newCurrentVal) / (startVal - targetVal)) * 100)));
      } else {
        newPct = Math.min(100, Math.round((newCurrentVal / targetVal) * 100));
      }
    }

    const crossed = MILESTONES.filter(m => m > prevPct && m <= (newPct || 0));
    if (crossed.length > 0) setShowMilestone(crossed[crossed.length - 1]);

    await onUpdate({ ...goal, current_value: val, start_value: goal.start_value || currentVal });
    setEditing(false);
    setSaving(false);
  }

  const isComplete = goal.completed;
  const accentColor = isComplete ? "#2d7a1e" : "#c47a0a";
  const gt = GOAL_TYPES.find(t => t.id === goal.type);

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", marginBottom: "10px", overflow: "hidden", borderLeft: `3px solid ${isComplete ? "#2d7a1e" : accentColor}` }}>
      {showMilestone && (
        <div style={{ background: "#111", color: "#f7f6f3", padding: "11px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ ...F, fontSize: "13px" }}>
            {showMilestone === 100 ? "Goal achieved!" : `${showMilestone}% of the way there!`}
          </span>
          <button onClick={() => setShowMilestone(null)} style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "18px" }}>×</button>
        </div>
      )}
      <div style={{ padding: "13px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>{goal.name}</div>
            <div style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {gt?.label || "Goal"}
              {goal.exercise_name && ` · ${goal.exercise_name}`}
              {goal.target_date && ` · By ${goal.target_date}`}
            </div>
          </div>
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "18px", paddingLeft: "8px" }}>×</button>
        </div>

        {targetVal && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginBottom: "4px" }}>
              <span>Current: {currentVal} {goal.unit}</span>
              <span>Target: {targetVal} {goal.unit}</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "7px", marginBottom: "6px", overflow: "hidden" }}>
              <div style={{ background: isComplete ? "#2d7a1e" : accentColor, borderRadius: "20px", height: "7px", width: `${pct || 0}%`, transition: "width 0.5s ease" }} />
            </div>
            {pct !== null && (
              <div style={{ fontSize: "10px", color: accentColor, fontWeight: "700", marginBottom: "8px" }}>{pct}% complete</div>
            )}
          </>
        )}

        {goal.notes && (
          <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", marginBottom: "8px", lineHeight: "1.5" }}>{goal.notes}</div>
        )}

        {/* Auto-tracked indicator */}
        {gt?.tracked && !isComplete && (
          <div style={{ fontSize: "10px", color: "#2563a8", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563a8", display: "inline-block" }} />
            Auto-tracked in Progress tab
          </div>
        )}

        {!isComplete && (
          editing ? (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input type="number" value={progress} onChange={e => setProgress(e.target.value)}
                placeholder={`Current ${goal.unit || "value"}`}
                style={{ flex: 1, padding: "7px 10px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "12px", ...F }} />
              <button onClick={handleSave} disabled={saving}
                style={{ background: accentColor, color: "#fff", border: "none", borderRadius: "5px", padding: "7px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                {saving ? "…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)}
                style={{ background: "none", border: "1px solid #ddd", borderRadius: "5px", padding: "7px 10px", fontSize: "11px", cursor: "pointer", color: "#999" }}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setEditing(true)}
                style={{ background: "none", border: `1px solid ${accentColor}`, color: accentColor, borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                Update Progress
              </button>
              <button onClick={() => onUpdate({ ...goal, completed: true, completed_date: new Date().toISOString().slice(0, 10) })}
                style={{ background: "none", border: "1px solid #2d7a1e", color: "#2d7a1e", borderRadius: "5px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                Mark Complete
              </button>
            </div>
          )
        )}
        {isComplete && (
          <div style={{ fontSize: "11px", color: "#2d7a1e", fontWeight: "600" }}>
            Completed {goal.completed_date || goal.completedDate || ""}
          </div>
        )}
      </div>
    </div>
  );
}

function AddGoalForm({ onAdd, onCancel }) {
  const [type, setType] = useState("bodyweight");
  const [name, setName] = useState("");
  const [exerciseName, setExerciseName] = useState("");
  const [metricKey, setMetricKey] = useState("waist_in");
  const [targetValue, setTargetValue] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const gt = GOAL_TYPES.find(t => t.id === type);

  function submit() {
    if (!name.trim()) return;
    onAdd({
      type,
      name: name.trim(),
      exercise_name: (type === "strength" || type === "reps") ? exerciseName.trim() || null : null,
      metric_key: type === "measurement" ? metricKey : (gt?.metric || null),
      target_value: targetValue ? parseFloat(targetValue) : null,
      current_value: currentValue ? parseFloat(currentValue) : 0,
      start_value: currentValue ? parseFloat(currentValue) : 0,
      unit: gt?.unit || "",
      target_date: targetDate || null,
      notes: notes.trim() || null,
      completed: false,
    });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>New Goal</div>

      {/* Type selector */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>Type</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {GOAL_TYPES.map(t => (
            <button key={t.id} onClick={() => { setType(t.id); setName(""); }}
              style={{ background: type === t.id ? "#111" : "#f5f5f3", color: type === t.id ? "#f7f6f3" : "#555", border: "1px solid " + (type === t.id ? "#111" : "#e0e0e0"), borderRadius: "20px", padding: "4px 10px", fontSize: "11px", cursor: "pointer", ...F }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal name */}
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Goal name</div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder={gt?.examples || "Describe your goal"}
          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
      </div>

      {/* Exercise name for strength/reps goals */}
      {(type === "strength" || type === "reps") && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Exercise name <span style={{ color: "#bbb" }}>(for auto-tracking)</span></div>
          <input value={exerciseName} onChange={e => setExerciseName(e.target.value)} placeholder="e.g. Bench Press, Pull-Up"
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>
      )}

      {/* Metric selector for measurements */}
      {type === "measurement" && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Which measurement</div>
          <select value={metricKey} onChange={e => setMetricKey(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", ...F }}>
            {MEASUREMENT_METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
      )}

      {gt?.hasTarget && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Starting value ({gt.unit})</div>
            <input type="number" value={currentValue} onChange={e => setCurrentValue(e.target.value)} placeholder="Current"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Target ({gt.unit})</div>
            <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="Goal"
              style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Target date <span style={{ color: "#bbb" }}>(optional)</span></div>
        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
          style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", boxSizing: "border-box", ...F }} />
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Notes <span style={{ color: "#bbb" }}>(optional)</span></div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Why this goal matters to you..."
          rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "12px", resize: "none", boxSizing: "border-box", ...F }} />
      </div>

      {gt?.tracked && (
        <div style={{ fontSize: "11px", color: "#2563a8", background: "rgba(37,99,168,0.06)", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", lineHeight: 1.5 }}>
          This goal type is automatically tracked — your logged data will be overlaid on charts in the Progress tab.
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={submit} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "6px", padding: "9px 16px", fontSize: "12px", cursor: "pointer", ...F }}>Add Goal</button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "6px", padding: "9px 14px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

export default function GoalTracker({ clientId }) {
  const [goals, setGoals] = useState([]);
  const [adding, setAdding] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, [clientId]);

  async function loadGoals() {
    setLoading(true);
    if (clientId && supabase) {
      const { data } = await getGoals(clientId);
      if (data && data.length > 0) {
        setGoals(data);
        setLoading(false);
        return;
      }
    }
    // Fall back to localStorage (migrate old goals)
    const local = loadLocalGoals();
    setGoals(local);
    setLoading(false);
  }

  async function handleAdd(goal) {
    if (clientId && supabase) {
      const { data } = await saveGoal(clientId, goal);
      if (data) { setGoals(prev => [data, ...prev]); setAdding(false); return; }
    }
    // Fallback to localStorage
    const newGoal = { ...goal, id: Date.now() };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    try { localStorage.setItem("goals_v1", JSON.stringify(updated)); } catch {}
    setAdding(false);
  }

  async function handleUpdate(updated) {
    if (clientId && supabase && typeof updated.id === 'string') {
      await saveGoal(clientId, updated);
    }
    const newGoals = goals.map(g => g.id === updated.id ? updated : g);
    setGoals(newGoals);
    try { localStorage.setItem("goals_v1", JSON.stringify(newGoals)); } catch {}
  }

  async function handleDelete(id) {
    if (clientId && supabase && typeof id === 'string') {
      await deleteGoal(id);
    }
    const newGoals = goals.filter(g => g.id !== id);
    setGoals(newGoals);
    try { localStorage.setItem("goals_v1", JSON.stringify(newGoals)); } catch {}
  }

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

      {adding && <AddGoalForm onAdd={handleAdd} onCancel={() => setAdding(false)} />}

      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "12px" }}>Loading…</div>
      ) : active.length === 0 && !adding ? (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#bbb", ...F }}>
          <div style={{ fontSize: "14px", marginBottom: "6px" }}>No active goals</div>
          <div style={{ fontSize: "11px" }}>Add a goal to track your progress</div>
        </div>
      ) : (
        active.map(g => (
          <GoalCard key={g.id} goal={g}
            onUpdate={handleUpdate}
            onDelete={() => handleDelete(g.id)} />
        ))
      )}

      {completed.length > 0 && (
        <>
          <button onClick={() => setShowCompleted(p => !p)} style={{ background: "none", border: "none", color: "#999", fontSize: "11px", cursor: "pointer", padding: "8px 0", ...F }}>
            {showCompleted ? "▲" : "▼"} {completed.length} completed goal{completed.length !== 1 ? "s" : ""}
          </button>
          {showCompleted && completed.map(g => (
            <GoalCard key={g.id} goal={g}
              onUpdate={handleUpdate}
              onDelete={() => handleDelete(g.id)} />
          ))}
        </>
      )}

      <div style={{ marginTop: "20px", padding: "14px", background: "#f5f5f3", borderRadius: "7px", fontSize: "11px", color: "#666", lineHeight: "1.7", ...F }}>
        <strong style={{ color: "#333" }}>Auto-tracked goals</strong> — body weight, body fat, strength, rep, and measurement goals are automatically overlaid on your Progress charts as goal lines. Custom and habit goals require manual updates.
      </div>
    </div>
  );
}
