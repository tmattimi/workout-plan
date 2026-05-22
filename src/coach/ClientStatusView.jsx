import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr + "T12:00:00")) / 86400000);
}

function StatusDot({ color }) {
  return (
    <div style={{
      width: "8px", height: "8px", borderRadius: "50%",
      background: color, flexShrink: 0,
    }} />
  );
}

function getActivityStatus(lastSession, sessionsThisWeek) {
  const days = daysSince(lastSession);
  if (days === null) return { label: "Never logged", color: "#ccc", priority: 3 };
  if (days === 0) return { label: "Active today", color: "#2d7a1e", priority: 0 };
  if (days === 1) return { label: "Active yesterday", color: "#4ade80", priority: 1 };
  if (days <= 3) return { label: `${days}d ago`, color: "#f59e0b", priority: 1 };
  if (days <= 7) return { label: `${days}d since last session`, color: "#f59e0b", priority: 2 };
  if (days <= 14) return { label: `${days}d inactive`, color: "#ef4444", priority: 3 };
  return { label: `${days}d — needs check-in`, color: "#ef4444", priority: 3 };
}

export default function ClientStatusView({ clients, onSelectClient }) {
  const [statusData, setStatusData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("activity"); // activity | name | sessions

  useEffect(() => {
    if (!clients.length) { setLoading(false); return; }
    loadStatus();
  }, [clients]);

  async function loadStatus() {
    setLoading(true);
    const clientIds = clients.map(c => c.id);
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const { data: logs } = await supabase
      .from("workout_logs")
      .select("client_id, session_date, logged_at")
      .in("client_id", clientIds)
      .eq("completed", true)
      .order("session_date", { ascending: false });

    const { data: messages } = await supabase
      .from("messages")
      .select("client_id, sender, created_at, read")
      .in("client_id", clientIds)
      .eq("sender", "client")
      .order("created_at", { ascending: false });

    // Build per-client summary
    const data = {};
    clients.forEach(c => {
      const clientLogs = (logs || []).filter(l => l.client_id === c.id);
      const clientMessages = (messages || []).filter(m => m.client_id === c.id);

      // Unique session dates
      const sessionDates = [...new Set(clientLogs.map(l => l.session_date).filter(Boolean))].sort().reverse();
      const lastSession = sessionDates[0] || null;
      const sessionsThisWeek = sessionDates.filter(d => d >= weekAgo).length;
      const totalSessions = sessionDates.length;

      // Unread messages from client
      const unreadMessages = clientMessages.filter(m => !m.read).length;
      const lastMessage = clientMessages[0] || null;

      data[c.id] = {
        lastSession,
        sessionsThisWeek,
        totalSessions,
        unreadMessages,
        lastMessage,
        streak: calcStreak(sessionDates),
      };
    });

    setStatusData(data);
    setLoading(false);
  }

  function calcStreak(sessionDates) {
    if (!sessionDates.length) return 0;
    let streak = 0;
    let check = new Date();
    check.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const dateStr = check.toISOString().slice(0, 10);
      if (sessionDates.includes(dateStr)) {
        streak++;
      } else if (i > 0) {
        break; // gap in streak
      }
      check.setDate(check.getDate() - 1);
    }
    return streak;
  }

  const sortedClients = [...clients].sort((a, b) => {
    const da = statusData[a.id];
    const db = statusData[b.id];
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "sessions") return (db?.totalSessions || 0) - (da?.totalSessions || 0);
    // activity: sort by priority (needs attention first), then days since
    const sa = getActivityStatus(da?.lastSession, da?.sessionsThisWeek);
    const sb = getActivityStatus(db?.lastSession, db?.sessionsThisWeek);
    if (sb.priority !== sa.priority) return sb.priority - sa.priority;
    return (daysSince(da?.lastSession) || 999) - (daysSince(db?.lastSession) || 999);
  });

  // Summary counts
  const needsAttention = clients.filter(c => {
    const d = statusData[c.id];
    return !d?.lastSession || daysSince(d.lastSession) > 7;
  }).length;
  const activeThisWeek = clients.filter(c => (statusData[c.id]?.sessionsThisWeek || 0) > 0).length;
  const totalUnread = Object.values(statusData).reduce((sum, d) => sum + (d.unreadMessages || 0), 0);

  if (loading) {
    return (
      <div style={{ padding: "30px 20px", textAlign: "center", color: "#bbb", ...F }}>
        Loading client status...
      </div>
    );
  }

  return (
    <div style={{ ...F }}>
      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "16px" }}>
        {[
          { label: "Active this week", value: activeThisWeek, color: "#2d7a1e", bg: "#f0fdf0" },
          { label: "Need check-in", value: needsAttention, color: needsAttention > 0 ? "#ef4444" : "#2d7a1e", bg: needsAttention > 0 ? "#fff0f0" : "#f0fdf0" },
          { label: "Unread messages", value: totalUnread, color: totalUnread > 0 ? "#2563a8" : "#aaa", bg: totalUnread > 0 ? "#eff6ff" : "#f9f9f7" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ background: bg, borderRadius: "9px", padding: "11px 10px", textAlign: "center", border: `1px solid ${color}22` }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: "9px", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "3px", lineHeight: "1.3" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        <span style={{ fontSize: "10px", color: "#bbb", alignSelf: "center", marginRight: "2px" }}>Sort:</span>
        {[["activity", "Activity"], ["sessions", "Sessions"], ["name", "Name"]].map(([v, label]) => (
          <button key={v} onClick={() => setSortBy(v)} style={{
            padding: "5px 11px", borderRadius: "20px", fontSize: "10px", cursor: "pointer",
            border: `1px solid ${sortBy === v ? "#111" : "#e0e0e0"}`,
            background: sortBy === v ? "#111" : "transparent",
            color: sortBy === v ? "#f7f6f3" : "#888", ...F,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Client list */}
      {sortedClients.map(client => {
        const d = statusData[client.id];
        const status = getActivityStatus(d?.lastSession, d?.sessionsThisWeek);

        return (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            style={{
              width: "100%", background: "#fff",
              border: "1px solid #ede9e4",
              borderRadius: "10px", padding: "13px 15px",
              marginBottom: "7px", cursor: "pointer",
              textAlign: "left", display: "flex",
              alignItems: "center", gap: "12px", ...F,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "#111", color: "#f7f6f3",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px", fontWeight: "600", flexShrink: 0,
            }}>
              {client.name?.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{client.name}</span>
                {d?.unreadMessages > 0 && (
                  <span style={{
                    background: "#2563a8", color: "#fff",
                    borderRadius: "20px", padding: "1px 6px",
                    fontSize: "9px", fontWeight: "700",
                  }}>
                    {d.unreadMessages} msg
                  </span>
                )}
                {d?.streak > 2 && (
                  <span style={{ fontSize: "10px", color: "#f59e0b" }}>
                    🔥 {d.streak}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <StatusDot color={status.color} />
                <span style={{ fontSize: "11px", color: "#888" }}>{status.label}</span>
                {d?.sessionsThisWeek > 0 && (
                  <span style={{ fontSize: "10px", color: "#bbb", marginLeft: "4px" }}>
                    · {d.sessionsThisWeek} session{d.sessionsThisWeek !== 1 ? "s" : ""} this week
                  </span>
                )}
              </div>
            </div>

            {/* Total sessions */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#111" }}>{d?.totalSessions || 0}</div>
              <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.08em" }}>total</div>
            </div>

            <span style={{ color: "#ddd", fontSize: "12px", flexShrink: 0 }}>›</span>
          </button>
        );
      })}
    </div>
  );
}
