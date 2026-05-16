import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const REFLECTION_PROMPTS = [
  "What did you do consistently this month that you are proud of?",
  "Where did your body surprise you — positively or negatively?",
  "What habit do you want to carry into next month?",
  "Where did you struggle, and what would you do differently?",
  "What did you learn about yourself through your training this month?",
];

function getMonthKey() { return new Date().toISOString().slice(0, 7); }
function getMonthLabel() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function loadMonthData(key) {
  try { return JSON.parse(localStorage.getItem(`monthly_goals_${key}`) || "null"); } catch { return null; }
}
function saveMonthData(key, data) {
  try { localStorage.setItem(`monthly_goals_${key}`, JSON.stringify(data)); } catch {}
}
function loadAllMonths() {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("monthly_goals_"));
    return keys.map(k => {
      const data = JSON.parse(localStorage.getItem(k) || "null");
      return data ? { key: k.replace("monthly_goals_", ""), ...data } : null;
    }).filter(Boolean).sort((a, b) => b.key.localeCompare(a.key));
  } catch { return []; }
}

export default function MonthlyGoals() {
  const monthKey = getMonthKey();
  const [data, setData] = useState(() => loadMonthData(monthKey) || { goals: ["", "", ""], reflection: "", promptIndex: 0, completed: false });
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { saveMonthData(monthKey, data); }, [data, monthKey]);

  function handleGoalChange(i, val) {
    setData(prev => {
      const goals = [...prev.goals];
      goals[i] = val;
      return { ...prev, goals };
    });
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function loadHistory() {
    setHistory(loadAllMonths().filter(m => m.key !== monthKey));
    setShowHistory(true);
  }

  const prompt = REFLECTION_PROMPTS[data.promptIndex % REFLECTION_PROMPTS.length];
  const filledGoals = data.goals.filter(g => g.trim()).length;

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Monthly Goals</div>
          <div style={{ fontSize: "15px", ...F, marginTop: "2px" }}>{getMonthLabel()}</div>
        </div>
        <button onClick={loadHistory} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "20px", padding: "5px 12px", fontSize: "10px", cursor: "pointer" }}>
          Past months
        </button>
      </div>

      {/* Goals section */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
          Intentions for this month
        </div>
        {data.goals.map((goal, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: goal.trim() ? "#111" : "#f0f0f0", color: goal.trim() ? "#fff" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>
              {i + 1}
            </div>
            <input
              value={goal}
              onChange={e => handleGoalChange(i, e.target.value)}
              placeholder={["Train consistently this month", "Focus on progressive overload", "Honor my rest days"][i]}
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "12px", ...F, background: "#fafaf8" }}
            />
          </div>
        ))}
        {data.goals.length < 5 && (
          <button onClick={() => setData(prev => ({ ...prev, goals: [...prev.goals, ""] }))}
            style={{ background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", padding: "4px 0", ...F }}>
            + Add another intention
          </button>
        )}
      </div>

      {/* Reflection section */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Reflection</div>
          <button onClick={() => setData(prev => ({ ...prev, promptIndex: (prev.promptIndex + 1) % REFLECTION_PROMPTS.length }))}
            style={{ background: "none", border: "none", color: "#bbb", fontSize: "10px", cursor: "pointer" }}>
            New prompt
          </button>
        </div>
        <div style={{ fontSize: "12px", color: "#555", fontStyle: "italic", marginBottom: "10px", lineHeight: "1.6", ...F }}>
          {prompt}
        </div>
        <textarea
          value={data.reflection}
          onChange={e => setData(prev => ({ ...prev, reflection: e.target.value }))}
          placeholder="Write your thoughts here..."
          rows={4}
          style={{ width: "100%", padding: "10px", border: "1px solid #e8e8e8", borderRadius: "5px", fontSize: "12px", resize: "none", lineHeight: "1.7", boxSizing: "border-box", background: "#fafaf8", ...F }}
        />
      </div>

      {/* Scripture for the month */}
      <div style={{ background: "#111", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>This month's anchor</div>
        <div style={{ fontSize: "12px", color: "#e8e0cc", fontStyle: "italic", lineHeight: "1.7", ...F }}>
          "Not that I have already obtained this or am already perfect, but I press on to make it my own."
        </div>
        <div style={{ fontSize: "10px", color: "#c47a0a", marginTop: "6px" }}>— Philippians 3:12</div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button onClick={handleSave} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "10px 20px", fontSize: "12px", cursor: "pointer", ...F }}>
          {saved ? "Saved" : "Save"}
        </button>
        <div style={{ fontSize: "11px", color: "#bbb" }}>
          {filledGoals} of {data.goals.length} intentions set
        </div>
      </div>

      {/* History */}
      {showHistory && (
        <div style={{ marginTop: "20px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Past months</div>
          {history.length === 0 ? (
            <div style={{ color: "#bbb", fontSize: "12px", ...F }}>No past months recorded yet.</div>
          ) : history.map(m => (
            <div key={m.key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px" }}>
                {new Date(m.key + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
              {m.goals?.filter(g => g?.trim()).map((g, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#555", marginBottom: "3px", display: "flex", gap: "6px" }}>
                  <span style={{ color: "#2d7a1e" }}>✓</span> {g}
                </div>
              ))}
              {m.reflection && (
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#888", fontStyle: "italic", borderTop: "1px solid #f0f0f0", paddingTop: "8px", lineHeight: "1.6", ...F }}>
                  {m.reflection.slice(0, 120)}{m.reflection.length > 120 ? "..." : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
