import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return "";
  return new Date(str + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function formatMonth(str) {
  if (!str) return "";
  return new Date(str + "-02T12:00:00").toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });
}

function getMonthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

function totalVolume(sets) {
  return sets.reduce((sum, s) => sum + ((parseFloat(s.weight_lbs) || 0) * (parseInt(s.reps) || 0)), 0);
}

function timeAgo(str) {
  if (!str) return "";
  const days = Math.floor((Date.now() - new Date(str + "T12:00:00")) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "Last week";
  return `${Math.floor(days / 7)} weeks ago`;
}

// ── Exercise set detail ───────────────────────────────────────────────────────
function SetDetail({ sets, clientId }) {
  const [notes, setNotes] = useState(() => {
    const n = {};
    sets.forEach((s, i) => { if (s.client_note) n[i] = s.client_note; });
    return n;
  });
  const [editingNote, setEditingNote] = useState(null);

  async function saveNote(i) {
    const note = notes[i] || "";
    const set = sets[i];
    if (set.supabaseId && clientId) {
      try {
        const { updateLogNote } = await import("../lib/supabase");
        await updateLogNote(set.supabaseId, note);
      } catch (e) {
        console.warn("Note save failed:", e.message);
      }
    }
    setEditingNote(null);
  }

  return (
    <div style={{ paddingLeft: "12px", borderLeft: "2px solid #f0f0ee" }}>
      {sets.map((s, i) => (
        <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #fafafa" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "10px", color: "#ccc", width: "20px" }}>S{i + 1}</span>
            <span style={{ fontSize: "12px", color: "#444", fontWeight: "500" }}>
              {s.weight_lbs ? `${s.weight_lbs} lbs` : "BW"}
              <span style={{ color: "#999", fontWeight: "normal" }}> × </span>
              {s.reps} reps
            </span>
            {s.is_pr && (
              <span style={{ fontSize: "9px", background: "#f59e0b", color: "#111", borderRadius: "4px", padding: "1px 5px", fontWeight: "700" }}>PR</span>
            )}
            <button
              onClick={() => setEditingNote(editingNote === i ? null : i)}
              style={{ marginLeft: "auto", background: "none", border: "none", fontSize: "10px", color: notes[i] ? "#b7791f" : "#ddd", cursor: "pointer", padding: "2px 4px" }}
              title="Add note"
            >
              {notes[i] ? "📝" : "+note"}
            </button>
          </div>
          {notes[i] && editingNote !== i && (
            <div style={{ fontSize: "10px", color: "#999", fontStyle: "italic", marginTop: "2px", marginLeft: "30px" }}>
              "{notes[i]}"
            </div>
          )}
          {editingNote === i && (
            <div style={{ marginTop: "5px", marginLeft: "30px", display: "flex", gap: "6px" }}>
              <input
                autoFocus
                value={notes[i] || ""}
                onChange={e => setNotes(prev => ({ ...prev, [i]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && saveNote(i)}
                placeholder="Add a note..."
                style={{ flex: 1, padding: "5px 8px", borderRadius: "6px", border: "1px solid #e4e0db", fontSize: "12px" }}
              />
              <button onClick={() => saveNote(i)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>
                Save
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Single session card ───────────────────────────────────────────────────────
function SessionCard({ date, sets, clientId }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedEx, setExpandedEx] = useState(null);

  // Group by exercise
  const byExercise = {};
  sets.forEach(s => {
    const name = s.exercises?.name || s.exercise_name || "Unknown";
    if (!byExercise[name]) byExercise[name] = [];
    byExercise[name].push(s);
  });

  const exercises = Object.keys(byExercise);
  const vol = totalVolume(sets);
  const hasNotes = sets.some(s => s.client_note);
  const totalSets = sets.length;
  const muscles = [...new Set(sets.map(s => s.exercises?.primary_muscle).filter(Boolean))];

  return (
    <div style={{
      background: "#fff", border: "1px solid #ede9e4",
      borderRadius: "11px", marginBottom: "8px", overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "14px 16px", cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "flex-start", gap: "12px", ...F,
        }}
      >
        {/* Date block */}
        <div style={{ flexShrink: 0, width: "34px", textAlign: "center" }}>
          <div style={{ fontSize: "20px", fontWeight: "700", color: "#111", lineHeight: 1 }}>
            {new Date(date + "T12:00:00").getDate()}
          </div>
          <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
          </div>
        </div>

        {/* Summary */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>
              {exercises.slice(0, 2).join(", ")}
              {exercises.length > 2 && <span style={{ fontWeight: "normal", color: "#aaa" }}> +{exercises.length - 2} more</span>}
            </span>

          </div>
          <div style={{ fontSize: "11px", color: "#bbb" }}>
            {totalSets} sets
            {muscles.length > 0 && ` · ${muscles.slice(0, 2).join(", ")}`}
            {hasNotes && " · 📝"}
          </div>
        </div>

        <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginTop: "2px" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "12px 16px" }}>
          {exercises.map(ex => {
            const exSets = byExercise[ex];
            const isOpen = expandedEx === ex;
            const bestSet = exSets.reduce((best, s) => {
              const w = parseFloat(s.weight_lbs) || 0;
              return w > (parseFloat(best.weight_lbs) || 0) ? s : best;
            }, exSets[0]);

            return (
              <div key={ex} style={{ marginBottom: "10px" }}>
                <button
                  onClick={() => setExpandedEx(isOpen ? null : ex)}
                  style={{
                    width: "100%", background: "none", border: "none", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "5px 0", textAlign: "left", ...F,
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#222", fontWeight: "500" }}>{ex}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#aaa" }}>
                      {exSets.length} sets
                      {bestSet?.weight_lbs && ` · top ${bestSet.weight_lbs}×${bestSet.reps}`}
                    </span>
                    <span style={{ fontSize: "10px", color: "#ddd" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && <SetDetail sets={exSets} clientId={clientId} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main WorkoutHistory component ─────────────────────────────────────────────
export default function WorkoutHistory({ clientId, localLogs }) {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | calendar
  const [expandedMonth, setExpandedMonth] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!clientId) {
      // Fall back to localStorage logs
      buildFromLocal();
      return;
    }
    loadFromSupabase();
  }, [clientId]);

  async function loadFromSupabase() {
    setLoading(true);
    const { data, error } = await supabase
      .from("workout_logs")
      .select("*, exercises(name, primary_muscle)")
      .eq("client_id", clientId)
      .eq("completed", true)
      .order("session_date", { ascending: false })
      .limit(500);

    if (error || !data || data.length === 0) {
      // Fall back to localStorage
      buildFromLocal();
      return;
    }

    // Group by date
    const byDate = {};
    data.forEach(row => {
      const day = row.session_date || row.logged_at?.slice(0, 10);
      if (!day) return;
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(row);
    });

    // Merge with localStorage for any sessions not yet in Supabase
    if (localLogs) {
      mergeLocalLogs(byDate);
    }

    finalize(byDate);
  }

  function buildFromLocal() {
    if (!localLogs) { setSessions({}); setLoading(false); return; }
    const byDate = {};
    Object.entries(localLogs).forEach(([key, val]) => {
      // key format: DAY_YYYY-MM-DD__ExerciseName
      const parts = key.split("__");
      if (parts.length < 2) return;
      const dateMatch = parts[0].match(/\d{4}-\d{2}-\d{2}/);
      if (!dateMatch) return;
      const date = dateMatch[0];
      const exerciseName = parts[1];
      if (!val?.sets?.length) return;

      if (!byDate[date]) byDate[date] = [];
      // Only include sets that were actually marked done
      val.sets.filter(s => s.done).forEach((s, i) => {
        byDate[date].push({
          exercises: { name: exerciseName },
          exercise_name: exerciseName,
          weight_lbs: s.weight,
          reps: s.reps,
          set_number: i + 1,
          is_pr: s.isPR || false,
          client_note: s.note || null,
          session_date: date,
        });
      });
    });
    // Remove dates that ended up with no done sets
    Object.keys(byDate).forEach(d => { if (!byDate[d].length) delete byDate[d]; });
    finalize(byDate);
  }

  function mergeLocalLogs(byDate) {
    if (!localLogs) return;
    Object.entries(localLogs).forEach(([key, val]) => {
      const parts = key.split("__");
      if (parts.length < 2) return;
      const dateMatch = parts[0].match(/\d{4}-\d{2}-\d{2}/);
      if (!dateMatch || !val?.sets?.length) return;
      const date = dateMatch[0];
      const exerciseName = parts[1];

      // Only add if not already in Supabase data
      const alreadyHas = byDate[date]?.some(r => (r.exercises?.name || r.exercise_name) === exerciseName);
      if (!alreadyHas) {
        const doneSets = val.sets.filter(s => s.done);
        if (!doneSets.length) return;
        if (!byDate[date]) byDate[date] = [];
        doneSets.forEach((s, i) => {
          byDate[date].push({
            exercises: { name: exerciseName },
            exercise_name: exerciseName,
            weight_lbs: s.weight,
            reps: s.reps,
            set_number: i + 1,
            is_pr: s.isPR || false,
            client_note: s.note || null,
            session_date: date,
            fromLocal: true,
          });
        });
      }
    });
  }

  function finalize(byDate) {
    setSessions(byDate);
    // Auto-expand most recent month
    const mostRecentDate = Object.keys(byDate).sort().reverse()[0];
    if (mostRecentDate) setExpandedMonth(getMonthKey(mostRecentDate));
    setLoading(false);
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#bbb", ...F }}>
        Loading your workout history...
      </div>
    );
  }

  if (!sessions || Object.keys(sessions).length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", ...F }}>
        <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>🏋️</div>
        <div style={{ fontSize: "15px", color: "#333", marginBottom: "6px" }}>No workouts logged yet</div>
        <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6" }}>
          Completed sessions will show up here. Mark sets as done during your workout to start building your history.
        </div>
      </div>
    );
  }

  // Group sessions by month
  const byMonth = {};
  Object.entries(sessions).forEach(([date, sets]) => {
    const month = getMonthKey(date);
    if (!byMonth[month]) byMonth[month] = {};
    byMonth[month][date] = sets;
  });
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

  // Filter by search
  const filteredSessions = search
    ? Object.entries(sessions).filter(([date, sets]) => {
        const exNames = [...new Set(sets.map(s => s.exercises?.name || s.exercise_name || ""))].join(" ").toLowerCase();
        return exNames.includes(search.toLowerCase()) || date.includes(search);
      })
    : null;

  const totalSessionCount = Object.keys(sessions).length;

  // Sessions this calendar month
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const sessionsThisMonth = Object.keys(sessions).filter(d => d.startsWith(thisMonthKey)).length;

  // Sessions last calendar month
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);
  const sessionsLastMonth = Object.keys(sessions).filter(d => d.startsWith(lastMonthKey)).length;

  return (
    <div style={{ padding: "16px 16px 80px", ...F }}>

      {/* Summary stats — only meaningful numbers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "16px" }}>
        <div style={{ background: "#f9f9f7", borderRadius: "9px", padding: "13px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#111", lineHeight: 1 }}>{sessionsThisMonth}</div>
          <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>This month</div>
        </div>
        <div style={{ background: "#f9f9f7", borderRadius: "9px", padding: "13px 12px", textAlign: "center" }}>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#111", lineHeight: 1 }}>{totalSessionCount}</div>
          <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "4px" }}>Total sessions</div>
          {sessionsLastMonth > 0 && (
            <div style={{ fontSize: "9px", color: "#ccc", marginTop: "2px" }}>
              {sessionsLastMonth} last month
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "14px", position: "relative" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by exercise..."
          style={{
            width: "100%", padding: "10px 36px 10px 13px", borderRadius: "9px",
            border: "1px solid #e4e0db", fontSize: "13px", color: "#333",
            background: "#fafaf8", ...F, boxSizing: "border-box",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#bbb", fontSize: "16px", cursor: "pointer" }}
          >
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {search && filteredSessions && (
        <>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px" }}>
            {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""} with "{search}"
          </div>
          {filteredSessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "13px" }}>
              No sessions found
            </div>
          ) : filteredSessions.sort(([a], [b]) => b.localeCompare(a)).map(([date, sets]) => (
            <SessionCard key={date} date={date} sets={sets} />
          ))}
        </>
      )}

      {/* Monthly groups */}
      {!search && sortedMonths.map(month => {
        const monthSessions = byMonth[month];
        const sortedDates = Object.keys(monthSessions).sort((a, b) => b.localeCompare(a));
        const sessionCount = sortedDates.length;
        const monthPRs = sortedDates.flatMap(d => monthSessions[d]).filter(s => s.is_pr).length;
        const isExpanded = expandedMonth === month;

        return (
          <div key={month} style={{ marginBottom: "10px" }}>
            {/* Month header */}
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : month)}
              style={{
                width: "100%", background: isExpanded ? "#111" : "#f9f9f7",
                border: "1px solid " + (isExpanded ? "#111" : "#ede9e4"),
                borderRadius: "10px", padding: "12px 16px", cursor: "pointer",
                textAlign: "left", display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: isExpanded ? "8px" : 0, ...F,
                transition: "all 0.15s",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: isExpanded ? "#f7f6f3" : "#111", marginBottom: "2px" }}>
                  {formatMonth(month)}
                </div>
                <div style={{ fontSize: "11px", color: isExpanded ? "#666" : "#bbb" }}>
                  {sessionCount} session{sessionCount !== 1 ? "s" : ""}
                  {monthPRs > 0 && ` · ${monthPRs} PR${monthPRs > 1 ? "s" : ""}`}
                </div>
              </div>
              <span style={{ color: isExpanded ? "#555" : "#ccc", fontSize: "11px" }}>
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>

            {isExpanded && sortedDates.map(date => (
              <SessionCard key={date} date={date} sets={monthSessions[date]} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
