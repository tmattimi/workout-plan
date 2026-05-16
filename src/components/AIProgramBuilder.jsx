import { useState } from "react";
import { getSafeExercises } from "../data/exercises";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Format client profile for Claude ─────────────────────────────────────────
function buildPrompt(client, overview, equipment, injuries, prefs) {
  const { recentLogs, measurements, prs, checkins } = overview || {};

  let prompt = `You are an expert personal trainer creating a weekly workout program for ${client.name || "a client"}.

CLIENT PROFILE:
- Goals: ${prefs.goals || "General fitness, muscle building, fat loss"}
- Training days per week: ${prefs.daysPerWeek || 6}
- Program style: ${prefs.style || "Push Pull Legs"}
- Available equipment: ${equipment?.join(", ") || "full gym"}
- Injury flags: ${injuries?.length ? injuries.join(", ") : "none"}
- Fitness level: ${prefs.level || "intermediate"}
`;

  if (prs && prs.length > 0) {
    prompt += `\nCURRENT STRENGTH LEVELS (Personal Records):\n`;
    prs.slice(0, 10).forEach(pr => {
      prompt += `  ${pr.exercise_name}: ${pr.weight_lbs} lbs × ${pr.reps}\n`;
    });
  }

  if (measurements && measurements.length > 0) {
    const latest = measurements[measurements.length - 1];
    prompt += `\nBODY COMPOSITION:\n`;
    if (latest.weight_lbs) prompt += `  Weight: ${latest.weight_lbs} lbs\n`;
  }

  if (checkins && checkins.length > 0) {
    const recent = checkins.slice(-3);
    const avgEnergy = (recent.reduce((s, c) => s + (c.energy_level || 5), 0) / recent.length).toFixed(1);
    prompt += `\nRECENT CHECK-INS (avg energy ${avgEnergy}/10 over last 3 sessions)\n`;
  }

  if (recentLogs && recentLogs.length > 0) {
    prompt += `\nRECENT TRAINING (last ${recentLogs.length} sets logged)\n`;
  }

  const safeExercises = getSafeExercises(equipment || [], injuries || []);
  prompt += `\nAPPROVED EXERCISES (${safeExercises.length} available based on equipment and injuries):\n`;
  prompt += safeExercises.slice(0, 30).map(e => `  ${e.name} [${e.primaryMuscle}]`).join("\n");

  prompt += `

TASK: Generate a complete weekly program in the following exact JSON format. Return ONLY the JSON, no explanation:

{
  "programName": "string",
  "weeklySchedule": [
    {
      "day": "MON",
      "label": "Push",
      "type": "push",
      "focus": "Push — Chest Focus",
      "muscles": ["Chest", "Shoulders", "Triceps"],
      "exercises": [
        {
          "name": "exercise name exactly as listed above",
          "sets": 4,
          "reps": "6–10",
          "rest": "2–3 min",
          "category": "Compound Bilateral",
          "order": 1,
          "rationale": "one sentence why this exercise for this client"
        }
      ],
      "cardio": {
        "name": "Incline Treadmill",
        "protocol": "4.0 to 4.5 mph at 8 to 12% incline for 20 minutes",
        "zone": "Zone 3 (65–75% max HR)",
        "feel": "Breathing noticeably elevated, short sentences only."
      }
    }
  ],
  "coachNotes": "2-3 sentences about the key programming decisions for this client"
}

Rules:
- Only use exercises from the approved list above
- Place heavier compound movements first, isolation last, core never before isolation
- 4–6 exercises per session for intermediate clients, 5–7 for advanced
- Include 1 rest day minimum
- Cardio after lifting, Zone 3, 20 minutes
- Match exercise selection to available equipment and injury restrictions strictly
`;

  return prompt;
}

// ── Program display ───────────────────────────────────────────────────────────
function ProgramDisplay({ program, onSave }) {
  const [expanded, setExpanded] = useState(null);

  if (!program?.weeklySchedule) return null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Generated Program</div>
          <div style={{ fontSize: "16px", ...F }}>{program.programName}</div>
        </div>
        <button onClick={onSave} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "7px 16px", fontSize: "11px", cursor: "pointer", ...F }}>
          Assign to Client
        </button>
      </div>

      {program.coachNotes && (
        <div style={{ background: "#f9f9f7", borderRadius: "7px", padding: "12px 14px", marginBottom: "14px", fontSize: "12px", color: "#555", lineHeight: "1.65", ...F, fontStyle: "italic" }}>
          {program.coachNotes}
        </div>
      )}

      {program.weeklySchedule.map((day, di) => (
        <div key={di} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "7px", overflow: "hidden" }}>
          <button onClick={() => setExpanded(expanded === di ? null : di)}
            style={{ width: "100%", background: "none", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.12em", color: "#aaa" }}>{day.day}</span>
                <span style={{ fontSize: "13px", fontWeight: "600" }}>{day.label}</span>
                {day.type === "rest" && <span style={{ fontSize: "10px", color: "#bbb" }}>Rest</span>}
              </div>
              {day.muscles?.length > 0 && <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{day.muscles.join(", ")}</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {day.exercises && <span style={{ fontSize: "10px", color: "#bbb" }}>{day.exercises.length} exercises</span>}
              <span style={{ color: "#ccc", fontSize: "11px" }}>{expanded === di ? "▲" : "▼"}</span>
            </div>
          </button>

          {expanded === di && day.exercises && (
            <div style={{ borderTop: "1px solid #f0f0f0" }}>
              {day.exercises.map((ex, ei) => (
                <div key={ei} style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#e8e8e8", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "700", flexShrink: 0 }}>
                    {ex.order || ei + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "3px" }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: ex.rationale ? "4px" : 0 }}>
                      <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#555", padding: "2px 8px", borderRadius: "20px" }}>{ex.sets} × {ex.reps}</span>
                      {ex.rest && <span style={{ fontSize: "9px", color: "#aaa", padding: "2px 7px", background: "#f5f5f3", borderRadius: "20px" }}>{ex.rest}</span>}
                    </div>
                    {ex.rationale && <div style={{ fontSize: "10px", color: "#aaa", lineHeight: "1.5", fontStyle: "italic" }}>{ex.rationale}</div>}
                  </div>
                </div>
              ))}
              {day.cardio && (
                <div style={{ padding: "10px 14px", background: "#f9f9f7", display: "flex", gap: "10px" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#e8e8e8", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "800", flexShrink: 0 }}>Z3</div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "600" }}>{day.cardio.name}</div>
                    <div style={{ fontSize: "10px", color: "#888" }}>{day.cardio.protocol}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIProgramBuilder({ client, overview, equipment, injuries }) {
  const [prefs, setPrefs] = useState({
    goals: "Build muscle, reduce body fat",
    daysPerWeek: 6,
    style: "Push Pull Legs",
    level: "intermediate",
  });
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  async function generateProgram() {
    setLoading(true);
    setError(null);
    setProgram(null);

    const userPrompt = buildPrompt(client, overview, equipment, injuries, prefs);

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are an expert personal trainer. Return only valid JSON. No markdown, no explanation, no code blocks.",
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data.content?.[0]?.text || "{}";
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
      catch { throw new Error("Could not parse the generated program. Try again."); }

      setProgram(parsed);
    } catch (err) {
      setError(err.message || "Program generation failed. Check your connection and try again.");
    }

    setLoading(false);
  }

  function handleSave() {
    // In future: push to Supabase as client's active program
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
        AI Program Builder — {client?.name}
      </div>

      {/* Preferences */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", marginBottom: "10px" }}>Program preferences</div>

        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Primary goals</div>
          <input value={prefs.goals} onChange={e => setPrefs(p => ({ ...p, goals: e.target.value }))}
            style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Training days/week</div>
            <select value={prefs.daysPerWeek} onChange={e => setPrefs(p => ({ ...p, daysPerWeek: parseInt(e.target.value) }))}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }}>
              {[3,4,5,6].map(n => <option key={n} value={n}>{n} days</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Program style</div>
            <select value={prefs.style} onChange={e => setPrefs(p => ({ ...p, style: e.target.value }))}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }}>
              {["Push Pull Legs", "Upper Lower", "Full Body", "Bro Split"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Fitness level</div>
            <select value={prefs.level} onChange={e => setPrefs(p => ({ ...p, level: e.target.value }))}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }}>
              {["beginner", "intermediate", "advanced"].map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {injuries?.length > 0 && (
          <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "6px", padding: "8px 10px", fontSize: "10px", color: "#7a5010", marginBottom: "10px" }}>
            Injury flags active: <strong>{injuries.join(", ")}</strong>. Contraindicated exercises will be excluded automatically.
          </div>
        )}

        <button onClick={generateProgram} disabled={loading} style={{
          width: "100%", background: loading ? "#ccc" : "#1a1a1a", color: "#f7f6f3",
          border: "none", borderRadius: "7px", padding: "12px", fontSize: "13px",
          cursor: loading ? "wait" : "pointer", ...F, letterSpacing: "0.04em",
        }}>
          {loading ? "Generating program..." : "Generate Program"}
        </button>

        {loading && (
          <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: "11px", color: "#bbb" }}>
            Reading {client?.name}'s data and building their program. Takes about 15 seconds.
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: "7px", padding: "12px 14px", marginBottom: "14px", fontSize: "12px", color: "#a02020" }}>
          {error}
        </div>
      )}

      {saved && (
        <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: "7px", padding: "10px 14px", marginBottom: "10px", fontSize: "12px", color: "#2d7a1e" }}>
          Program saved. Supabase integration will push this to the client's plan in the next update.
        </div>
      )}

      {program && <ProgramDisplay program={program} onSave={handleSave} />}
    </div>
  );
}
