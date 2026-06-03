import { useState, useEffect } from "react";
import { EXERCISE_DB } from "../data/exercises";
import MuscleScience from "./MuscleScience";
import AlternativeExercises from "./AlternativeExercises";
import { InlineEmpty } from "./ui";

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
function GoalsSection({ clientId }) {
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
  useEffect(() => {
    saveMonthData(monthKey, monthData);
    if (clientId) {
      import("../lib/supabase").then(({ upsertMonthlyIntentions }) => {
        upsertMonthlyIntentions(clientId, monthKey, { goals: monthData.goals, reflection: monthData.reflection, prompt_index: monthData.promptIndex });
      }).catch(() => {});
    }
  }, [monthData, monthKey, clientId]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!clientId) return;
    import("../lib/supabase").then(async ({ getGoals, getMonthlyIntentions }) => {
      const [goalsResult, intentionsResult] = await Promise.all([getGoals(clientId), getMonthlyIntentions(clientId)]);
      if (goalsResult.data?.length > 0) {
        const mapped = goalsResult.data.map(g => ({
          id: g.id, type: g.type, name: g.name, targetValue: g.target_value,
          currentValue: g.current_value, unit: g.unit, targetDate: g.target_date,
          notes: g.notes, completed: g.completed, completedDate: g.completed_date,
          createdDate: g.created_at?.slice(0,10), prevPct: 0,
        }));
        setGoals(mapped);
        saveGoals(mapped);
      }
      if (intentionsResult.data?.length > 0) {
        const thisMonth = intentionsResult.data.find(m => m.month_key === monthKey);
        if (thisMonth) {
          setMonthData({ goals: thisMonth.goals || ["","",""], reflection: thisMonth.reflection || "", promptIndex: thisMonth.prompt_index || 0 });
        }
      }
    }).catch(() => {});
  }, [clientId]);

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);
  const prompt = REFLECTION_PROMPTS[monthData.promptIndex % REFLECTION_PROMPTS.length];

  async function addGoal() {
    if (!newGoal.name.trim()) return;
    const gt = GOAL_TYPES.find(t => t.id === newGoal.type);
    const goal = { id: String(Date.now()), ...newGoal, targetValue: newGoal.targetValue ? parseFloat(newGoal.targetValue) : null, unit: gt.unit, currentValue: 0, prevPct: 0, completed: false, createdDate: new Date().toISOString().slice(0, 10) };
    setGoals(p => [goal, ...p]);
    setNewGoal({ type: "strength", name: "", targetValue: "", targetDate: "", notes: "" });
    setAdding(false);
    if (clientId) {
      try {
        const { saveGoal } = await import("../lib/supabase");
        await saveGoal(clientId, { id: goal.id, type: goal.type, name: goal.name, target_value: goal.targetValue, current_value: 0, unit: goal.unit, target_date: goal.targetDate || null, notes: goal.notes || null, completed: false });
      } catch(e) { console.warn("Goal save failed:", e); }
    }
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

      {active.length === 0 && !adding && <InlineEmpty>No active goals. Tap "+ New Goal" to add one.</InlineEmpty>}

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


// ── Ask Coach AI ─────────────────────────────────────────────────────────────
function CoachAISection({ clientId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const QUICK_QUESTIONS = [
    "Why am I not seeing progress?",
    "How do I know if I'm working hard enough?",
    "What should I eat before training?",
    "How sore is too sore?",
    "Should I train if I'm tired?",
    "How long until I see results?",
  ];

  async function ask(q) {
    const text = q || question.trim();
    if (!text) return;
    setLoading(true);
    setAnswer(null);
    setQuestion("");

    const newHistory = [...history, { role: "user", content: text }];

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: `You are a knowledgeable personal trainer assistant helping a client understand their training. 
Be direct, warm, and practical. Keep answers to 2-4 sentences unless the question needs more. 
No disclaimers or suggestions to see a doctor for basic training questions. 
You know about exercise science, nutrition, recovery, and progressive overload. 
Speak like a coach talking to a client, not like a textbook.`,
          messages: newHistory,
        }),
      });

      const data = await response.json();
      const replyText = data.content?.[0]?.text || "I couldn't process that — try again.";
      const updatedHistory = [...newHistory, { role: "assistant", content: replyText }];
      setHistory(updatedHistory.slice(-10)); // keep last 5 exchanges
      setAnswer(replyText);
    } catch (err) {
      setAnswer("Something went wrong. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "6px" }}>
        Ask a training question
      </div>
      <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "14px", lineHeight: "1.6" }}>
        Get instant answers about your training, recovery, nutrition, or program.
      </div>

      {/* Answer */}
      {answer && (
        <div style={{ background: "#f9f9f7", border: "1px solid #e4e0db", borderRadius: "9px", padding: "14px 16px", marginBottom: "14px", fontSize: "13px", color: "#333", lineHeight: "1.75", ...F }}>
          {answer}
        </div>
      )}

      {loading && (
        <div style={{ background: "#f9f9f7", border: "1px solid #e4e0db", borderRadius: "9px", padding: "14px 16px", marginBottom: "14px", fontSize: "13px", color: "#bbb", lineHeight: "1.75", ...F }}>
          Thinking...
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="Ask anything about your training..."
          style={{ flex: 1, padding: "10px 13px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", color: "#111" }}
        />
        <button
          onClick={() => ask()}
          disabled={!question.trim() || loading}
          style={{
            background: question.trim() ? "#111" : "#e4e0db",
            color: question.trim() ? "#fff" : "#aaa",
            border: "none", borderRadius: "8px", padding: "10px 14px",
            fontSize: "12px", cursor: question.trim() ? "pointer" : "default", flexShrink: 0,
          }}
        >
          Ask
        </button>
      </div>

      {/* Quick questions */}
      {!answer && !loading && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>Common questions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {QUICK_QUESTIONS.map(q => (
              <button key={q} onClick={() => ask(q)} style={{
                background: "#fafaf8", border: "1px solid #e4e0db", borderRadius: "8px",
                padding: "10px 14px", fontSize: "12px", color: "#555", cursor: "pointer",
                textAlign: "left", ...F, lineHeight: "1.4",
              }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New question button after answering */}
      {answer && !loading && (
        <button
          onClick={() => { setAnswer(null); }}
          style={{ background: "none", border: "1px solid #e4e0db", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#aaa", cursor: "pointer", width: "100%", ...F }}
        >
          Ask another question
        </button>
      )}
    </div>
  );
}


// ── Exercise Library ──────────────────────────────────────────────────────────
const MUSCLE_GROUPS = ["All", "Chest", "Back", "Lats", "Shoulders", "Triceps", "Biceps", "Glutes", "Hamstrings", "Quads", "Core", "Cardio"];
const CATEGORIES = ["All", "Compound Bilateral", "Compound Unilateral", "Isolation Bilateral", "Isolation Unilateral"];

function ExerciseLibrary({ onGoToAlternatives }) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(null);

  const q = search.toLowerCase().trim();

  const filtered = EXERCISE_DB.filter(ex => {
    const matchMuscle = muscle === "All" ||
      ex.primaryMuscle?.toLowerCase().includes(muscle.toLowerCase()) ||
      ex.secondaryMuscles?.some(m => m.toLowerCase().includes(muscle.toLowerCase()));
    const matchCat = category === "All" || ex.category === category;
    const matchSearch = !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.primaryMuscle?.toLowerCase().includes(q) ||
      ex.secondaryMuscles?.some(m => m.toLowerCase().includes(q)) ||
      ex.cues?.some(c => c.toLowerCase().includes(q));
    return matchMuscle && matchCat && matchSearch;
  });

  // Group by primary muscle
  const grouped = {};
  filtered.forEach(ex => {
    const key = ex.primaryMuscle || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ex);
  });

  const equipIcons = { dumbbell: "🏋️", barbell: "⚡", cable: "🔗", machine: "⚙️", bench: "🪑", band: "🔴", pull_up_bar: "⬆️" };

  return (
    <div>
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search exercises, muscles, or cues..."
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "12px", boxSizing: "border-box", marginBottom: "10px", ...F }}
      />

      {/* Muscle filter */}
      <div style={{ display: "flex", gap: "5px", overflowX: "auto", marginBottom: "8px", paddingBottom: "4px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {MUSCLE_GROUPS.map(m => (
          <button key={m} onClick={() => setMuscle(m)} style={{
            flexShrink: 0, padding: "5px 11px", borderRadius: "20px", fontSize: "10px", cursor: "pointer",
            background: muscle === m ? "#111" : "#f5f5f3",
            color: muscle === m ? "#fff" : "#777",
            border: `1px solid ${muscle === m ? "#111" : "#e0e0e0"}`, ...F,
          }}>{m}</button>
        ))}
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "5px", overflowX: "auto", marginBottom: "14px", paddingBottom: "4px", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} style={{
            flexShrink: 0, padding: "4px 10px", borderRadius: "20px", fontSize: "9px", cursor: "pointer",
            background: category === c ? "#555" : "transparent",
            color: category === c ? "#fff" : "#aaa",
            border: `1px solid ${category === c ? "#555" : "#e8e8e8"}`, ...F,
          }}>{c}</button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
        {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Grouped results */}
      {(search || muscle !== "All" || category !== "All") ? (
        // Flat list when filtering
        filtered.map(ex => <ExLibCard key={ex.id} ex={ex} expanded={expanded} setExpanded={setExpanded} equipIcons={equipIcons} />)
      ) : (
        // Grouped by muscle when browsing
        Object.entries(grouped).map(([muscleGroup, exercises]) => (
          <div key={muscleGroup} style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "7px", paddingBottom: "5px", borderBottom: "1px solid #ebebeb" }}>
              {muscleGroup}
            </div>
            {exercises.map(ex => <ExLibCard key={ex.id} ex={ex} expanded={expanded} setExpanded={setExpanded} equipIcons={equipIcons} />)}
          </div>
        ))
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>
          No exercises found. Try a different search or filter.
        </div>
      )}

      {/* Link back to Alternatives */}
      <div style={{ marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #f0f0f0", textAlign: "center" }}>
        <button onClick={onGoToAlternatives} style={{ fontSize: "11px", color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
          Looking for exercise swaps? → Alternatives
        </button>
      </div>
    </div>
  );
}

function ExLibCard({ ex, expanded, setExpanded, equipIcons }) {
  const isOpen = expanded === ex.id;
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "6px", overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(isOpen ? null : ex.id)}
        style={{ width: "100%", background: "none", border: "none", padding: "11px 13px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "3px" }}>{ex.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            <span style={{ fontSize: "9px", background: "#f0f0f0", color: "#666", padding: "2px 7px", borderRadius: "20px" }}>{ex.primaryMuscle}</span>
            {(ex.secondaryMuscles || []).slice(0,2).map(m => (
              <span key={m} style={{ fontSize: "9px", background: "#f9f9f7", color: "#aaa", padding: "2px 7px", borderRadius: "20px" }}>{m}</span>
            ))}
            {ex.bodyweight && <span style={{ fontSize: "9px", background: "#f0fff0", color: "#2d7a1e", padding: "2px 7px", borderRadius: "20px" }}>Bodyweight</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0, marginLeft: "8px" }}>
          <div style={{ display: "flex", gap: "2px" }}>
            {(ex.equipment || []).slice(0,3).map(eq => (
              <span key={eq} style={{ fontSize: "8px", background: "#f0f0f0", color: "#777", padding: "1px 4px", borderRadius: "3px", letterSpacing: "0.03em" }}>{equipIcons[eq] || eq}</span>
            ))}
            {ex.bodyweight && ex.equipment?.length === 0 && <span style={{ fontSize: "9px", color: "#aaa" }}>BW</span>}
          </div>
          <span style={{ color: "#ccc", fontSize: "11px", marginLeft: "4px" }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {isOpen && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "11px 13px" }}>
          {/* Category badge */}
          <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            {ex.category}
          </div>

          {/* Cues */}
          {ex.cues?.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb", marginBottom: "6px" }}>Form Cues</div>
              {ex.cues.map((cue, i) => (
                <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", paddingBottom: "6px", borderBottom: i < ex.cues.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                  <span style={{ flexShrink: 0, width: "16px", height: "16px", background: "#111", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", marginTop: "1px" }}>{i+1}</span>
                  <span style={{ fontSize: "11px", color: "#555", lineHeight: "1.65", ...F }}>{cue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Watch for */}
          {ex.watchFor && (
            <div style={{ background: "#fff8f0", borderRadius: "6px", padding: "8px 10px", marginBottom: "8px" }}>
              <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: "#c47a0a", marginBottom: "4px" }}>Watch for</div>
              <div style={{ fontSize: "11px", color: "#8a5500", lineHeight: "1.65", ...F }}>{ex.watchFor}</div>
            </div>
          )}

          {/* Contraindications */}
          {ex.contraindications?.length > 0 && (
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "9px", color: "#aaa" }}>Avoid if:</span>
              {ex.contraindications.map(c => (
                <span key={c} style={{ fontSize: "9px", background: "#fff0f0", color: "#c0392b", padding: "2px 7px", borderRadius: "20px" }}>{c.replace(/_/g," ")}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Guide section ─────────────────────────────────────────────────────────────
function GuideSection({ principles, openEntryId }) {
  const [expandedPrinciple, setExpandedPrinciple] = useState(openEntryId || null);
  const [search, setSearch] = useState("");

  if (openEntryId && expandedPrinciple !== openEntryId) setExpandedPrinciple(openEntryId);

  if (!principles || principles.length === 0) {
    return <div style={{ color: "#bbb", fontSize: "12px", textAlign: "center", padding: "20px" }}>No guide content available.</div>;
  }

  // Normalize: handle both flat [{title,body}] and sectioned [{section, entries:[]}] formats
  const normalized = Array.isArray(principles) && principles[0]?.entries
    ? principles
    : [{ section: "Training Principles", entries: principles.map((p, i) => ({ ...p, id: p.id || String(i), tags: p.tags || [] })) }];

  const q = search.toLowerCase().trim();

  // Flatten all entries for search
  const allEntries = normalized.flatMap((section, si) =>
    section.entries.map((p, i) => ({ ...p, section: section.section, si, i, key: p.id || `${si}-${i}` }))
  );

  const filtered = q
    ? allEntries.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.subtitle || "").toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      )
    : null;

  return (
    <div>
      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search — e.g. core brace, eccentric, glutes..."
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "12px", boxSizing: "border-box", marginBottom: "14px", ...F }}
      />

      {/* Search results */}
      {filtered && (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px", color: "#bbb", fontSize: "12px" }}>Nothing found for "{search}"</div>
          )}
          {filtered.map(p => (
            <div key={p.key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "6px", marginBottom: "5px", overflow: "hidden" }}>
              <button onClick={() => setExpandedPrinciple(expandedPrinciple === p.key ? null : p.key)}
                style={{ width: "100%", background: "transparent", border: "none", padding: "10px 13px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", textAlign: "left" }}>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{p.title}</div>
                  {p.subtitle && <div style={{ fontSize: "11px", color: "#888", marginTop: "1px", lineHeight: 1.4 }}>{p.subtitle}</div>}
                  <div style={{ fontSize: "9px", color: "#bbb", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{p.section}</div>
                </div>
                <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginLeft: "8px", marginTop: "2px" }}>{expandedPrinciple === p.key ? "▲" : "▼"}</span>
              </button>
              {expandedPrinciple === p.key && (
                <div style={{ padding: "0 13px 11px", fontSize: "11px", color: "#555", lineHeight: "1.75", borderTop: "1px solid #f5f5f3" }}>
                  <div style={{ paddingTop: "9px" }}>{p.body}</div>
                  {p.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "10px" }}>
                      {p.tags.map(t => (
                        <span key={t} style={{ fontSize: "9px", background: "#f5f5f3", color: "#aaa", padding: "2px 7px", borderRadius: "20px" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Browseable sections when not searching */}
      {!filtered && normalized.map((section, si) => (
        <div key={si} style={{ marginBottom: "18px" }}>
          <div style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "7px", paddingBottom: "5px", borderBottom: "1px solid #ebebeb" }}>
            {section.section}
          </div>
          {section.entries.map((p, i) => {
            const key = p.id || `${si}-${i}`;
            return (
              <div key={key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "6px", marginBottom: "5px", overflow: "hidden" }}>
                <button onClick={() => setExpandedPrinciple(expandedPrinciple === key ? null : key)}
                  style={{ width: "100%", background: "transparent", border: "none", padding: "10px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a" }}>{p.title}</div>
                    {p.subtitle && <div style={{ fontSize: "11px", color: "#888", marginTop: "1px", lineHeight: 1.4 }}>{p.subtitle}</div>}
                  </div>
                  <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}>{expandedPrinciple === key ? "▲" : "▼"}</span>
                </button>
                {expandedPrinciple === key && (
                  <div style={{ padding: "0 13px 11px", fontSize: "11px", color: "#555", lineHeight: "1.75", borderTop: "1px solid #f5f5f3" }}>
                    <div style={{ paddingTop: "9px" }}>{p.body}</div>
                    {p.tags?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "10px" }}>
                        {p.tags.map(t => (
                          <span key={t} style={{ fontSize: "9px", background: "#f5f5f3", color: "#aaa", padding: "2px 7px", borderRadius: "20px" }}>{t}</span>
                        ))}
                      </div>
                    )}
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
export default function ToolsTab({ principles, clientEquipment, clientInjuries, onEquipmentChange, onInjuryChange, defaultSection, clientId }) {
  const [section, setSection] = useState(defaultSection || "alternatives");

  const SECTIONS = [
    { id: "alternatives", label: "Alternatives" },
    { id: "library", label: "Exercise Library" },
    { id: "muscles", label: "Muscles" },
    { id: "guide", label: "Guide" },
    { id: "coach", label: "Ask Coach AI" },
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
        <>
        <AlternativeExercises
          clientEquipment={clientEquipment}
          clientInjuries={clientInjuries}
          onEquipmentChange={onEquipmentChange}
          onInjuryChange={onInjuryChange}
        />
        <button
          onClick={() => setSection("library")}
          style={{ display: "block", width: "100%", marginTop: "14px", padding: "12px", background: "#f9f9f7", border: "1px solid #e4e0db", borderRadius: "9px", fontSize: "12px", color: "#555", cursor: "pointer", textAlign: "center" }}
        >
          Browse the full Exercise Library →
        </button>
        </>
      )}

      {section === "muscles" && (
        <div style={{ margin: "0 -16px" }}>
          <MuscleScience />
        </div>
      )}

      {section === "library" && <ExerciseLibrary onGoToAlternatives={() => setSection("alternatives")} />}
      {section === "guide" && <GuideSection principles={principles} />}
      {section === "coach" && <CoachAISection clientId={clientId} />}
    </div>
  );
}
