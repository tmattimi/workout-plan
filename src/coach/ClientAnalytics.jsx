import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchAnalyticsData(clientId) {
  const [logsRes, swapsRes] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("*, exercises(name, primary_muscle)")
      .eq("client_id", clientId)
      .eq("completed", true)
      .order("logged_at", { ascending: false })
      .limit(500),
    supabase
      .from("exercise_swaps")
      .select("*")
      .eq("client_id", clientId)
      .order("swapped_at", { ascending: false })
      .limit(100),
  ]);

  return {
    logs: logsRes.data || [],
    swaps: swapsRes.data || [],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDay(logs) {
  const days = {};
  logs.forEach(log => {
    const day = log.session_date || log.logged_at?.slice(0, 10);
    if (!day) return;
    if (!days[day]) days[day] = [];
    days[day].push(log);
  });
  return days;
}

function getWeekKey(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().slice(0, 10);
}

function groupByWeek(dayMap) {
  const weeks = {};
  Object.entries(dayMap).forEach(([day, logs]) => {
    const wk = getWeekKey(day);
    if (!weeks[wk]) weeks[wk] = { days: [], logs: [] };
    weeks[wk].days.push(day);
    weeks[wk].logs.push(...logs);
  });
  return weeks;
}

function totalVolume(logs) {
  return logs.reduce((sum, l) => sum + ((parseFloat(l.weight_lbs) || 0) * (parseInt(l.reps) || 0)), 0);
}

function formatDate(str) {
  if (!str) return "";
  return new Date(str + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeek(str) {
  if (!str) return "";
  const start = new Date(str + "T12:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function timeAgo(str) {
  if (!str) return "";
  const mins = Math.floor((Date.now() - new Date(str)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return formatDate(str.slice(0, 10));
}

// ── Notification badge ────────────────────────────────────────────────────────
function Badge({ count, color = "#e53e3e" }) {
  if (!count) return null;
  return (
    <span style={{
      background: color, color: "#fff", borderRadius: "20px",
      padding: "1px 7px", fontSize: "10px", fontWeight: "700",
      marginLeft: "5px",
    }}>{count}</span>
  );
}

// ── Day session card ──────────────────────────────────────────────────────────
function SessionCard({ date, logs, swapsOnDay, expanded, onToggle }) {
  const vol = totalVolume(logs);
  const exercises = [...new Set(logs.map(l => l.exercises?.name || l.exercise_name).filter(Boolean))];
  const muscles = [...new Set(logs.map(l => l.exercises?.primary_muscle).filter(Boolean))];
  const clientNotes = logs.filter(l => l.client_note).map(l => l.client_note);
  const hasSwap = swapsOnDay.length > 0;
  const totalSets = logs.length;
  const prs = logs.filter(l => l.is_pr);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e8e8e4",
      borderRadius: "10px", marginBottom: "8px", overflow: "hidden",
    }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "13px 15px", cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: "10px",
        }}
      >
        {/* Date */}
        <div style={{ flexShrink: 0, textAlign: "center", width: "38px" }}>
          <div style={{ fontSize: "18px", fontWeight: "700", color: "#111", lineHeight: 1 }}>
            {new Date(date + "T12:00:00").getDate()}
          </div>
          <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
          </div>
        </div>

        {/* Summary */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#222" }}>
              {exercises.slice(0, 3).join(", ")}{exercises.length > 3 ? ` +${exercises.length - 3}` : ""}
            </span>
            {prs.length > 0 && (
              <span style={{ fontSize: "9px", background: "#f59e0b", color: "#111", borderRadius: "4px", padding: "1px 5px", fontWeight: "700" }}>
                {prs.length} PR{prs.length > 1 ? "s" : ""}
              </span>
            )}
            {hasSwap && (
              <span style={{ fontSize: "9px", background: "#2563a820", color: "#2563a8", borderRadius: "4px", padding: "1px 6px", fontWeight: "600" }}>
                ⇄ Swap
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "#aaa" }}>
            {totalSets} sets · {vol > 0 ? `${Math.round(vol).toLocaleString()} lbs volume` : "bodyweight"} · {muscles.slice(0, 2).join(", ")}
          </div>
        </div>

        {/* Chevron */}
        <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "12px 15px" }}>
          {/* Exercise breakdown */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "7px" }}>
              Sets logged
            </div>
            {exercises.map(ex => {
              const exLogs = logs.filter(l => (l.exercises?.name || l.exercise_name) === ex);
              return (
                <div key={ex} style={{ marginBottom: "6px", display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <div style={{ fontSize: "12px", color: "#333", flex: 1, minWidth: 0, fontWeight: "500" }}>{ex}</div>
                  <div style={{ fontSize: "11px", color: "#888", flexShrink: 0 }}>
                    {exLogs.map((l, i) => (
                      <span key={i}>
                        {i > 0 && " · "}
                        {l.weight_lbs ? `${l.weight_lbs}×${l.reps}` : l.reps ? `${l.reps} reps` : "—"}
                        {l.is_pr && " 🏆"}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Swaps */}
          {hasSwap && (
            <div style={{ background: "#f0f5ff", borderRadius: "7px", padding: "10px 12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563a8", marginBottom: "6px" }}>
                Exercise swaps
              </div>
              {swapsOnDay.map((sw, i) => (
                <div key={i} style={{ marginBottom: i < swapsOnDay.length - 1 ? "6px" : 0, fontSize: "11px" }}>
                  <span style={{ color: "#777", textDecoration: "line-through" }}>{sw.original_exercise}</span>
                  <span style={{ color: "#2563a8", margin: "0 5px" }}>→</span>
                  <span style={{ color: "#333", fontWeight: "500" }}>{sw.swap_exercise}</span>
                  <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
                    {sw.reason_category}{sw.reason_note ? ` — ${sw.reason_note}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Client notes */}
          {clientNotes.length > 0 && (
            <div style={{ background: "#fffbea", borderRadius: "7px", padding: "10px 12px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b7791f", marginBottom: "6px" }}>
                Client notes
              </div>
              {clientNotes.map((note, i) => (
                <div key={i} style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", marginBottom: i < clientNotes.length - 1 ? "5px" : 0 }}>
                  "{note}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Week summary row ──────────────────────────────────────────────────────────
function WeekRow({ weekKey, weekData, swaps, expanded, onToggle, expandedDay, onDayToggle }) {
  const { days, logs } = weekData;
  const vol = totalVolume(logs);
  const sessionCount = days.length;
  const prs = logs.filter(l => l.is_pr).length;
  const swapsThisWeek = swaps.filter(s => {
    const d = s.swapped_at?.slice(0, 10);
    return d && getWeekKey(d) === weekKey;
  });
  const hasNotes = logs.some(l => l.client_note);

  return (
    <div style={{ marginBottom: "12px" }}>
      {/* Week header */}
      <button
        onClick={onToggle}
        style={{
          width: "100%", background: expanded ? "#111" : "#f9f9f7",
          border: "1px solid " + (expanded ? "#111" : "#e8e8e4"),
          borderRadius: "9px", padding: "12px 15px", cursor: "pointer",
          textAlign: "left", display: "flex", alignItems: "center", gap: "10px",
          transition: "all 0.15s",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: expanded ? "#f7f6f3" : "#222", marginBottom: "3px" }}>
            {formatWeek(weekKey)}
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: expanded ? "#888" : "#aaa" }}>
              {sessionCount} session{sessionCount !== 1 ? "s" : ""}
            </span>
            {vol > 0 && (
              <span style={{ fontSize: "11px", color: expanded ? "#888" : "#aaa" }}>
                {Math.round(vol / 1000 * 10) / 10}k lbs volume
              </span>
            )}
            {prs > 0 && (
              <span style={{ fontSize: "11px", color: "#f59e0b", fontWeight: "600" }}>
                {prs} PR{prs !== 1 ? "s" : ""}
              </span>
            )}
            {swapsThisWeek.length > 0 && (
              <span style={{ fontSize: "11px", color: "#2563a8" }}>
                {swapsThisWeek.length} swap{swapsThisWeek.length !== 1 ? "s" : ""}
              </span>
            )}
            {hasNotes && (
              <span style={{ fontSize: "11px", color: "#b7791f" }}>📝 notes</span>
            )}
          </div>
        </div>
        <span style={{ color: expanded ? "#555" : "#ccc", fontSize: "11px", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Day sessions */}
      {expanded && (
        <div style={{ paddingTop: "8px", paddingLeft: "8px" }}>
          {days.sort((a, b) => b.localeCompare(a)).map(day => {
            const dayLogs = weekData.logs.filter(l => (l.session_date || l.logged_at?.slice(0, 10)) === day);
            const daySwaps = swapsThisWeek.filter(s => s.swapped_at?.slice(0, 10) === day);
            return (
              <SessionCard
                key={day}
                date={day}
                logs={dayLogs}
                swapsOnDay={daySwaps}
                expanded={expandedDay === day}
                onToggle={() => onDayToggle(day)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ value, max, color = "#111", label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontSize: "11px", color: "#555" }}>{label}</span>
        <span style={{ fontSize: "11px", color: "#888" }}>{value > 1000 ? `${Math.round(value / 100) / 10}k` : Math.round(value)}</span>
      </div>
      <div style={{ height: "5px", background: "#f0f0ee", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ── Trend comparison ──────────────────────────────────────────────────────────
function TrendSection({ weeks, swaps }) {
  const sortedWeeks = Object.entries(weeks).sort(([a], [b]) => b.localeCompare(a));
  const [window, setWindow] = useState(4); // weeks to compare

  const recent = sortedWeeks.slice(0, window);
  const prev = sortedWeeks.slice(window, window * 2);

  function weekStats(wkEntries) {
    const allLogs = wkEntries.flatMap(([, w]) => w.logs);
    const allDays = wkEntries.flatMap(([, w]) => w.days);
    return {
      sessions: allDays.length,
      volume: Math.round(totalVolume(allLogs)),
      sets: allLogs.length,
      prs: allLogs.filter(l => l.is_pr).length,
    };
  }

  const recStats = weekStats(recent);
  const prevStats = weekStats(prev);

  function delta(curr, prev) {
    if (!prev) return null;
    const d = curr - prev;
    const pct = prev > 0 ? Math.round((d / prev) * 100) : 0;
    return { d, pct, up: d >= 0 };
  }

  function DeltaBadge({ curr, prev, unit = "" }) {
    const info = delta(curr, prev);
    if (!info || prev === 0) return null;
    return (
      <span style={{
        fontSize: "10px", marginLeft: "6px", fontWeight: "600",
        color: info.up ? "#2d7a1e" : "#a02020",
      }}>
        {info.up ? "▲" : "▼"} {Math.abs(info.pct)}%
      </span>
    );
  }

  // Volume by week for chart
  const maxVol = Math.max(...sortedWeeks.slice(0, 8).map(([, w]) => totalVolume(w.logs)), 1);

  return (
    <div>
      {/* Window selector */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[2, 4, 6, 8].map(w => (
          <button key={w} onClick={() => setWindow(w)} style={{
            padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer",
            border: "1px solid " + (window === w ? "#111" : "#e0e0e0"),
            background: window === w ? "#111" : "transparent",
            color: window === w ? "#f7f6f3" : "#888",
          }}>
            {w}w
          </button>
        ))}
      </div>

      {/* Stats comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        {[
          { label: "Sessions", curr: recStats.sessions, prev: prevStats.sessions },
          { label: "Total sets", curr: recStats.sets, prev: prevStats.sets },
          { label: "Volume (lbs)", curr: recStats.volume, prev: prevStats.volume, big: true },
          { label: "PRs hit", curr: recStats.prs, prev: prevStats.prs },
        ].map(({ label, curr, prev: p, big }) => (
          <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "9px", padding: "12px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb", marginBottom: "4px" }}>{label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: big ? "20px" : "22px", fontWeight: "700", color: "#111" }}>
                {big && curr > 1000 ? `${Math.round(curr / 100) / 10}k` : curr}
              </span>
              <DeltaBadge curr={curr} prev={p} />
            </div>
            {p > 0 && (
              <div style={{ fontSize: "10px", color: "#ccc", marginTop: "2px" }}>
                prev: {big && p > 1000 ? `${Math.round(p / 100) / 10}k` : p}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Volume chart */}
      {sortedWeeks.length > 1 && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "9px", padding: "14px", marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "10px" }}>
            Weekly volume
          </div>
          {sortedWeeks.slice(0, 8).reverse().map(([wk, w]) => (
            <MiniBar
              key={wk}
              label={formatDate(wk)}
              value={totalVolume(w.logs)}
              max={maxVol}
              color={wk === sortedWeeks[0]?.[0] ? "#2563a8" : "#ddd"}
            />
          ))}
        </div>
      )}

      {/* Swap trends */}
      {swaps.length > 0 && (
        <div style={{ background: "#f0f5ff", border: "1px solid #dbeafe", borderRadius: "9px", padding: "14px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#2563a8", marginBottom: "8px" }}>
            Exercise swaps ({swaps.length} total)
          </div>
          {/* Most swapped exercises */}
          {(() => {
            const counts = {};
            swaps.forEach(s => {
              counts[s.original_exercise] = (counts[s.original_exercise] || 0) + 1;
            });
            return Object.entries(counts)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([ex, count]) => (
                <div key={ex} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "11px" }}>
                  <span style={{ color: "#444" }}>{ex}</span>
                  <span style={{ color: "#2563a8", fontWeight: "600" }}>{count}×</span>
                </div>
              ));
          })()}
          <div style={{ marginTop: "8px", fontSize: "10px", color: "#93c5fd" }}>
            Most common reason: {(() => {
              const counts = {};
              swaps.forEach(s => { if (s.reason_category) counts[s.reason_category] = (counts[s.reason_category] || 0) + 1; });
              return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || "Not specified";
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main analytics component ──────────────────────────────────────────────────
export default function ClientAnalytics({ client }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("sessions"); // sessions | trends | swaps
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    if (!client?.id) return;
    setLoading(true);
    fetchAnalyticsData(client.id).then(d => {
      setData(d);
      setLoading(false);
      // Auto-expand most recent week
      const dayMap = groupByDay(d.logs);
      const weekMap = groupByWeek(dayMap);
      const mostRecent = Object.keys(weekMap).sort().reverse()[0];
      if (mostRecent) setExpandedWeek(mostRecent);
    });
  }, [client?.id]);

  if (loading) {
    return (
      <div style={{ padding: "30px", textAlign: "center", color: "#bbb", ...F }}>
        Loading analytics...
      </div>
    );
  }

  if (!data) return null;

  const dayMap = groupByDay(data.logs);
  const weekMap = groupByWeek(dayMap);
  const sortedWeeks = Object.entries(weekMap).sort(([a], [b]) => b.localeCompare(a));

  const totalSessions = Object.keys(dayMap).length;
  const lastSession = Object.keys(dayMap).sort().reverse()[0];
  const daysSince = lastSession
    ? Math.floor((Date.now() - new Date(lastSession + "T12:00:00")) / 86400000)
    : null;

  const recentSwaps = data.swaps.slice(0, 5);

  return (
    <div style={{ ...F }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "16px" }}>
        {[
          { label: "Total sessions", value: totalSessions },
          { label: "Last session", value: daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : daysSince != null ? `${daysSince}d ago` : "None" },
          { label: "Swaps logged", value: data.swaps.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f9f9f7", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>{value}</div>
            <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "2px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[["sessions", "Sessions"], ["trends", "Trends"], ["swaps", "Swaps"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "8px", border: "1px solid " + (view === v ? "#111" : "#e0e0e0"),
            borderRadius: "8px", background: view === v ? "#111" : "transparent",
            color: view === v ? "#f7f6f3" : "#888",
            cursor: "pointer", fontSize: "11px", letterSpacing: "0.04em", ...F,
          }}>
            {label}
            {v === "swaps" && data.swaps.length > 0 && <Badge count={data.swaps.length} color="#2563a8" />}
          </button>
        ))}
      </div>

      {/* ── SESSIONS VIEW ── */}
      {view === "sessions" && (
        <>
          {sortedWeeks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>No sessions logged yet</div>
              <div style={{ fontSize: "11px" }}>Sessions will appear here as the client completes workouts.</div>
            </div>
          ) : sortedWeeks.map(([weekKey, weekData]) => (
            <WeekRow
              key={weekKey}
              weekKey={weekKey}
              weekData={weekData}
              swaps={data.swaps}
              expanded={expandedWeek === weekKey}
              onToggle={() => setExpandedWeek(expandedWeek === weekKey ? null : weekKey)}
              expandedDay={expandedDay}
              onDayToggle={day => setExpandedDay(expandedDay === day ? null : day)}
            />
          ))}
        </>
      )}

      {/* ── TRENDS VIEW ── */}
      {view === "trends" && (
        <TrendSection weeks={weekMap} swaps={data.swaps} />
      )}

      {/* ── SWAPS VIEW ── */}
      {view === "swaps" && (
        <>
          {data.swaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>No swaps logged yet</div>
              <div style={{ fontSize: "11px" }}>When a client swaps an exercise, the reason and details will appear here.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "12px" }}>
                {data.swaps.length} total swap{data.swaps.length !== 1 ? "s" : ""}
              </div>
              {data.swaps.map((sw, i) => (
                <div key={sw.id || i} style={{
                  background: "#fff", border: "1px solid #e8e8e4",
                  borderRadius: "9px", padding: "13px 15px", marginBottom: "8px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ fontSize: "10px", color: "#bbb" }}>{timeAgo(sw.swapped_at)}</div>
                    <div style={{ fontSize: "10px", background: "#f0f5ff", color: "#2563a8", padding: "2px 7px", borderRadius: "4px" }}>
                      {sw.reason_category || "No reason given"}
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", color: "#333", marginBottom: "4px" }}>
                    <span style={{ textDecoration: "line-through", color: "#bbb" }}>{sw.original_exercise}</span>
                    <span style={{ margin: "0 8px", color: "#2563a8" }}>→</span>
                    <span style={{ fontWeight: "600" }}>{sw.swap_exercise}</span>
                  </div>
                  {sw.reason_note && (
                    <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", lineHeight: "1.5" }}>
                      "{sw.reason_note}"
                    </div>
                  )}
                  {sw.session_key && (
                    <div style={{ fontSize: "10px", color: "#ccc", marginTop: "4px" }}>
                      Session: {sw.session_key}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
