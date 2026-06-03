import { useState } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const C = {
  bg: "#f7f6f3",
  dark: "#111",
  mid: "#555",
  muted: "#aaa",
  border: "#e4e0db",
  green: "#2d7a1e",
  amber: "#c47a0a",
  red: "#a02020",
  blue: "#2563a8",
  card: "#fff",
};

// ── Supabase fetchers ──────────────────────────────────────────────────────────

async function fetchWorkoutLogs(clientId, from, to) {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("client_id", clientId)
    .gte("session_date", from)
    .lte("session_date", to)
    .order("session_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchCheckins(clientId, from, to) {
  const { data, error } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("client_id", clientId)
    .gte("week_of", from)
    .lte("week_of", to)
    .order("week_of", { ascending: true });
  if (error) throw error;
  return data || [];
}

async function fetchGoals(clientId) {
  const { data, error } = await supabase
    .from("client_goals")
    .select("*")
    .eq("client_id", clientId)
    .eq("completed", false);
  if (error) throw error;
  return data || [];
}

async function fetchMeasurements(clientId, from, to) {
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("client_id", clientId)
    .gte("measured_at", from)
    .lte("measured_at", to)
    .order("measured_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Data aggregation ───────────────────────────────────────────────────────────

function aggregateWorkoutData(logs) {
  const byExercise = {};
  const sessionDates = new Set();

  for (const row of logs) {
    sessionDates.add(row.session_date);
    if (!row.exercise_name) continue;
    const key = row.exercise_name;
    if (!byExercise[key]) {
      byExercise[key] = { sets: [], prs: 0, dates: new Set() };
    }
    byExercise[key].sets.push({
      date: row.session_date,
      weight: row.weight_lbs,
      reps: row.reps,
      completed: row.completed,
    });
    if (row.is_pr) byExercise[key].prs++;
    byExercise[key].dates.add(row.session_date);
  }

  // Summarise each exercise
  const exerciseSummaries = Object.entries(byExercise).map(([name, data]) => {
    const completedSets = data.sets.filter((s) => s.completed && s.weight > 0);
    const weights = completedSets.map((s) => s.weight);
    const firstWeight = weights[0] || 0;
    const lastWeight = weights[weights.length - 1] || 0;
    const maxWeight = Math.max(...weights, 0);
    const trend =
      lastWeight > firstWeight
        ? "progressing"
        : lastWeight < firstWeight
        ? "regressing"
        : "flat";

    return {
      name,
      sessionsAppeared: data.dates.size,
      totalSets: data.sets.length,
      completedSets: completedSets.length,
      firstWeight,
      lastWeight,
      maxWeight,
      prs: data.prs,
      trend,
      weightChange: lastWeight - firstWeight,
    };
  });

  return {
    totalSessions: sessionDates.size,
    exerciseSummaries,
  };
}

function buildPrompt(clientName, from, to, workoutSummary, checkins, goals, measurements) {
  const goalsList = goals.map((g) => `${g.name} (target: ${g.target_value} ${g.unit || ""})`).join(", ") || "No active goals recorded";

  const checkinSummary = checkins.length
    ? checkins
        .map(
          (c) =>
            `Week of ${c.week_of}: energy ${c.energy_level}/10, soreness ${c.soreness_level}/10, sleep ${c.sleep_quality}/10, nutrition adherence ${c.nutrition_adherence}/10${c.notes ? `. Notes: "${c.notes}"` : ""}`
        )
        .join("\n")
    : "No check-ins recorded for this period.";

  const progressingEx = workoutSummary.exerciseSummaries
    .filter((e) => e.trend === "progressing")
    .map((e) => `${e.name} (+${e.weightChange} lbs, ${e.prs} PR${e.prs !== 1 ? "s" : ""})`)
    .join(", ") || "None identified";

  const stalledEx = workoutSummary.exerciseSummaries
    .filter((e) => e.trend === "flat" || e.trend === "regressing")
    .map((e) => `${e.name} (${e.trend}, ${e.weightChange} lbs change)`)
    .join(", ") || "None identified";

  const measurementSummary =
    measurements.length >= 2
      ? (() => {
          const first = measurements[0];
          const last = measurements[measurements.length - 1];
          const lines = [];
          if (first.weight_lbs && last.weight_lbs)
            lines.push(`Weight: ${first.weight_lbs} → ${last.weight_lbs} lbs`);
          if (first.waist_in && last.waist_in)
            lines.push(`Waist: ${first.waist_in} → ${last.waist_in} in`);
          if (first.hips_in && last.hips_in)
            lines.push(`Hips: ${first.hips_in} → ${last.hips_in} in`);
          if (first.right_thigh_in && last.right_thigh_in)
            lines.push(`Right thigh: ${first.right_thigh_in} → ${last.right_thigh_in} in`);
          if (first.left_thigh_in && last.left_thigh_in)
            lines.push(`Left thigh: ${first.left_thigh_in} → ${last.left_thigh_in} in`);
          if (first.right_arm_in && last.right_arm_in)
            lines.push(`Right arm: ${first.right_arm_in} → ${last.right_arm_in} in`);
          if (first.left_arm_in && last.left_arm_in)
            lines.push(`Left arm: ${first.left_arm_in} → ${last.left_arm_in} in`);
          if (first.body_fat_pct && last.body_fat_pct)
            lines.push(`Body fat: ${first.body_fat_pct} → ${last.body_fat_pct}%`);
          return lines.join("\n") || "No measurement changes recorded.";
        })()
      : measurements.length === 1
      ? `Single measurement on ${measurements[0].measured_at}: weight ${measurements[0].weight_lbs} lbs`
      : "No measurements recorded for this period.";

  return `You are an expert strength and conditioning coach reviewing a client's training period to help their coach restructure the next program rotation.

CLIENT: ${clientName}
REVIEW PERIOD: ${from} to ${to}
ACTIVE GOALS: ${goalsList}

TRAINING VOLUME:
Total sessions completed: ${workoutSummary.totalSessions}

EXERCISE PROGRESSION SUMMARY:
Progressing exercises: ${progressingEx}
Stalled or regressing exercises: ${stalledEx}

ALL EXERCISE DATA:
${workoutSummary.exerciseSummaries
  .map(
    (e) =>
      `• ${e.name}: appeared in ${e.sessionsAppeared} sessions, ${e.completedSets} completed sets, weight ${e.firstWeight}→${e.lastWeight} lbs (max: ${e.maxWeight} lbs), ${e.prs} PRs, trend: ${e.trend}`
  )
  .join("\n")}

WEEKLY CHECK-INS:
${checkinSummary}

BODY MEASUREMENTS:
${measurementSummary}

Please provide a structured program review with the following sections. Be specific, direct, and coach-to-coach in tone — this is for Tara, the coach, not the client.

1. PERFORMANCE SUMMARY
A concise paragraph summarising what happened this period — volume, key wins, and overall trajectory.

2. WHAT'S WORKING
List the 3-5 exercises or patterns showing the clearest progress. Explain why each is working and whether to keep, increase, or maintain.

3. WHAT NEEDS ATTENTION
List exercises or patterns that are stalled, regressing, or flagged by check-in data. For each, give a specific reason and a concrete fix.

4. RECOVERY & READINESS ASSESSMENT
Based on the check-in data, assess whether the client is recovering well, underrecovering, or showing signs of fatigue accumulation. Be specific.

5. RECOMMENDED PROGRAM ADJUSTMENTS FOR NEXT ROTATION
Specific, actionable recommendations only. Include:
- Exercises to add, remove, or swap
- Volume or intensity changes (sets, reps, load)
- Any structural changes to the weekly split
- Progressive overload targets for key lifts

6. COACH NOTES
2-3 sentences Tara can use as talking points when reviewing this period with the client.`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ClientProgramReview({ client, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [fromDate, setFromDate] = useState(eightWeeksAgo);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [review, setReview] = useState(null);
  const [rawData, setRawData] = useState(null);

  const clientName = client?.name || "Client";

  async function generateReview() {
    setLoading(true);
    setError(null);
    setReview(null);

    try {
      const [logs, checkins, goals, measurements] = await Promise.all([
        fetchWorkoutLogs(client.id, fromDate, toDate),
        fetchCheckins(client.id, fromDate, toDate),
        fetchGoals(client.id),
        fetchMeasurements(client.id, fromDate, toDate),
      ]);

      const workoutSummary = aggregateWorkoutData(logs);
      setRawData({ workoutSummary, checkins, goals, measurements });

      if (workoutSummary.totalSessions === 0) {
        setError("No workout sessions found for this date range. Try expanding the date range.");
        setLoading(false);
        return;
      }

      const prompt = buildPrompt(clientName, fromDate, toDate, workoutSummary, checkins, goals, measurements);

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      setReview(text);
    } catch (err) {
      setError("Something went wrong fetching data. Check the console for details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Parse review into sections
  function parseSections(text) {
    const sectionHeaders = [
      "PERFORMANCE SUMMARY",
      "WHAT'S WORKING",
      "WHAT NEEDS ATTENTION",
      "RECOVERY & READINESS ASSESSMENT",
      "RECOMMENDED PROGRAM ADJUSTMENTS FOR NEXT ROTATION",
      "COACH NOTES",
    ];

    const sections = [];
    let remaining = text;

    for (let i = 0; i < sectionHeaders.length; i++) {
      const header = sectionHeaders[i];
      const nextHeader = sectionHeaders[i + 1];
      const startIdx = remaining.indexOf(header);
      if (startIdx === -1) continue;

      const contentStart = startIdx + header.length;
      const endIdx = nextHeader ? remaining.indexOf(nextHeader) : remaining.length;
      const content = remaining.slice(contentStart, endIdx !== -1 ? endIdx : undefined).trim();

      sections.push({ header, content: content.replace(/^[\s\n:]+/, "").trim() });
    }

    return sections.length ? sections : [{ header: "REVIEW", content: text }];
  }

  const sectionColors = {
    "PERFORMANCE SUMMARY": C.blue,
    "WHAT'S WORKING": C.green,
    "WHAT NEEDS ATTENTION": C.amber,
    "RECOVERY & READINESS ASSESSMENT": C.blue,
    "RECOMMENDED PROGRAM ADJUSTMENTS FOR NEXT ROTATION": C.dark,
    "COACH NOTES": "#6b3fa0",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      zIndex: 1000, overflowY: "auto", padding: "24px 16px",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
    }}>
      <div style={{
        background: C.bg, borderRadius: 12, width: "100%", maxWidth: 780,
        ...F, boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{
          padding: "24px 28px 20px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Program Review
            </div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: C.dark }}>
              {clientName}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 22, color: C.muted, lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {/* Date range */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Review Period
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: C.muted }}>From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  ...F, fontSize: 14, padding: "8px 12px", border: `1px solid ${C.border}`,
                  borderRadius: 6, background: C.card, color: C.dark,
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 11, color: C.muted }}>To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  ...F, fontSize: 14, padding: "8px 12px", border: `1px solid ${C.border}`,
                  borderRadius: 6, background: C.card, color: C.dark,
                }}
              />
            </div>

            {/* Quick ranges */}
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", paddingBottom: 2 }}>
              {[
                { label: "4 weeks", days: 28 },
                { label: "8 weeks", days: 56 },
                { label: "12 weeks", days: 84 },
              ].map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => {
                    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                    setFromDate(from);
                    setToDate(today);
                  }}
                  style={{
                    ...F, fontSize: 12, padding: "6px 12px",
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    background: C.card, color: C.mid, cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={generateReview}
              disabled={loading}
              style={{
                ...F, fontSize: 14, fontWeight: "bold",
                padding: "9px 22px", borderRadius: 6, border: "none",
                background: loading ? C.muted : C.dark, color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                marginLeft: "auto", whiteSpace: "nowrap",
              }}
            >
              {loading ? "Analyzing…" : "Generate Review"}
            </button>
          </div>
        </div>

        {/* Stats bar — shows after data is loaded */}
        {rawData && (
          <div style={{
            padding: "14px 28px", borderBottom: `1px solid ${C.border}`,
            display: "flex", gap: 28, flexWrap: "wrap",
          }}>
            {[
              { label: "Sessions", value: rawData.workoutSummary.totalSessions },
              { label: "Exercises tracked", value: rawData.workoutSummary.exerciseSummaries.length },
              { label: "PRs hit", value: rawData.workoutSummary.exerciseSummaries.reduce((a, e) => a + e.prs, 0) },
              { label: "Check-ins", value: rawData.checkins.length },
              { label: "Measurements", value: rawData.measurements.length },
              { label: "Active goals", value: rawData.goals.length },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 20, fontWeight: "bold", color: C.dark }}>{value}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px 28px", textAlign: "center", color: C.muted, fontSize: 15 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
            Pulling data and generating analysis…
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            margin: "20px 28px", padding: "14px 18px",
            background: "#fdf2f2", border: `1px solid #f0c0c0`,
            borderRadius: 8, color: C.red, fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Review output */}
        {review && (
          <div style={{ padding: "24px 28px" }}>
            {parseSections(review).map(({ header, content }) => (
              <div key={header} style={{
                marginBottom: 24, paddingBottom: 24,
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{
                  fontSize: 10, fontWeight: "bold", letterSpacing: 1.2,
                  textTransform: "uppercase", color: sectionColors[header] || C.dark,
                  marginBottom: 10,
                }}>
                  {header}
                </div>
                <div style={{
                  fontSize: 14, color: C.dark, lineHeight: 1.75,
                  whiteSpace: "pre-wrap",
                }}>
                  {content}
                </div>
              </div>
            ))}

            {/* Copy button */}
            <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
              <button
                onClick={() => navigator.clipboard.writeText(review)}
                style={{
                  ...F, fontSize: 13, padding: "8px 18px",
                  border: `1px solid ${C.border}`, borderRadius: 6,
                  background: C.card, color: C.mid, cursor: "pointer",
                }}
              >
                Copy Review
              </button>
              <button
                onClick={() => {
                  setReview(null);
                  setRawData(null);
                }}
                style={{
                  ...F, fontSize: 13, padding: "8px 18px",
                  border: `1px solid ${C.border}`, borderRadius: 6,
                  background: C.card, color: C.mid, cursor: "pointer",
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !review && !error && (
          <div style={{ padding: "40px 28px", textAlign: "center", color: C.muted, fontSize: 14 }}>
            Select a date range and click Generate Review to analyze {clientName}'s training period.
          </div>
        )}
      </div>
    </div>
  );
}
