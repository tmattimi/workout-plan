import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const ACTIVITY_TYPES = [
  { id: "walk", label: "Walk", icon: "Walk", unit: "min", hasDistance: true },
  { id: "run", label: "Run", icon: "Run", unit: "min", hasDistance: true },
  { id: "bike", label: "Bike / Cycling", icon: "Bike", unit: "min", hasDistance: true },
  { id: "swim", label: "Swimming", icon: "Swim", unit: "min", hasDistance: false },
  { id: "hike", label: "Hike", icon: "Hike", unit: "min", hasDistance: true },
  { id: "yoga", label: "Yoga / Stretching", icon: "Yoga", unit: "min", hasDistance: false },
  { id: "steps", label: "Step Count", icon: "Steps", unit: "steps", hasDistance: false },
  { id: "sports", label: "Sport / Game", icon: "Sport", unit: "min", hasDistance: false },
  { id: "other", label: "Other", icon: "Other", unit: "min", hasDistance: false },
];

const INTENSITIES = [
  { id: "easy", label: "Easy", color: "#2d7a1e", desc: "Conversational pace" },
  { id: "moderate", label: "Moderate", color: "#c47a0a", desc: "Elevated breathing" },
  { id: "hard", label: "Hard", color: "#a02020", desc: "Challenging, short sentences" },
];

function loadActivities() {
  try { return JSON.parse(localStorage.getItem("activity_log_v1") || "[]"); } catch { return []; }
}
function saveActivities(d) {
  try { localStorage.setItem("activity_log_v1", JSON.stringify(d)); } catch {}
}

function today() { return new Date().toISOString().slice(0, 10); }
function formatDate(d) {
  const date = new Date(d + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function AddActivityForm({ onAdd, onCancel }) {
  const [type, setType] = useState("walk");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [intensity, setIntensity] = useState("moderate");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(today());

  const at = ACTIVITY_TYPES.find(a => a.id === type);

  function submit() {
    if (!duration) return;
    onAdd({
      id: Date.now(),
      type,
      duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : null,
      intensity,
      notes: notes.trim() || null,
      date,
    });
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "12px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Log Activity</div>

      {/* Activity type */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>Activity</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {ACTIVITY_TYPES.map(a => (
            <button key={a.id} onClick={() => setType(a.id)} style={{
              background: type === a.id ? "#111" : "#f5f5f3",
              color: type === a.id ? "#f7f6f3" : "#555",
              border: "1px solid " + (type === a.id ? "#111" : "#e0e0e0"),
              borderRadius: "20px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F
            }}>{a.label}</button>
          ))}
        </div>
      </div>

      {/* Duration + distance */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Duration ({at.unit})</div>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 30"
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>
        {at.hasDistance && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Distance (miles, optional)</div>
            <input type="number" step="0.1" value={distance} onChange={e => setDistance(e.target.value)} placeholder="e.g. 2.5"
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>
      </div>

      {/* Intensity */}
      {type !== "steps" && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "11px", color: "#666", marginBottom: "6px" }}>Intensity</div>
          <div style={{ display: "flex", gap: "6px" }}>
            {INTENSITIES.map(i => (
              <button key={i.id} onClick={() => setIntensity(i.id)} style={{
                flex: 1, padding: "7px 6px", border: "1px solid " + (intensity === i.id ? i.color : "#e0e0e0"),
                borderRadius: "5px", background: intensity === i.id ? i.color + "15" : "#fafaf8",
                color: intensity === i.id ? i.color : "#999", cursor: "pointer", ...F, fontSize: "11px",
              }}>
                <div style={{ fontWeight: "600", marginBottom: "1px" }}>{i.label}</div>
                <div style={{ fontSize: "9px" }}>{i.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Notes (optional)</div>
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel?"
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={submit} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>Log it</button>
        <button onClick={onCancel} style={{ background: "none", border: "1px solid #ddd", color: "#999", borderRadius: "5px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}

function getThisWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - day);
  const end = new Date(now);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

export default function ActivityLog({ clientId }) {
  const [activities, setActivities] = useState(loadActivities);
  const [adding, setAdding] = useState(false);

  useEffect(() => { saveActivities(activities); }, [activities]);

  useEffect(() => {
    if (!clientId) return;
    import("../lib/supabase").then(async ({ getActivities }) => {
      const { data } = await getActivities(clientId, 100);
      if (data?.length > 0) {
        setActivities(prev => {
          const supabaseActivities = data.map(row => ({
            id: `sb_${row.id}`, type: row.activity_type, duration: row.duration_minutes,
            distance: row.distance_miles, intensity: row.intensity,
            notes: row.notes, date: row.activity_date,
          }));
          const localOnly = prev.filter(a => !String(a.id).startsWith("sb_"));
          return [...localOnly, ...supabaseActivities];
        });
      }
    }).catch(() => {});
  }, [clientId]);

  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date));
  const [weekStart, weekEnd] = getThisWeekRange();
  const thisWeek = activities.filter(a => a.date >= weekStart && a.date <= weekEnd);
  const weekMins = thisWeek.filter(a => a.type !== "steps").reduce((s, a) => s + a.duration, 0);
  const weekSteps = thisWeek.filter(a => a.type === "steps").reduce((s, a) => s + a.duration, 0);

  // Group by date
  const grouped = {};
  sorted.forEach(a => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  });

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* This week summary */}
      <div style={{ background: "#111", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px", display: "flex", gap: "20px" }}>
        <div>
          <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>This week</div>
          <div style={{ fontSize: "22px", color: "#f7f6f3", fontWeight: "300", ...F }}>{weekMins}<span style={{ fontSize: "12px", color: "#888", marginLeft: "3px" }}>min</span></div>
        </div>
        {weekSteps > 0 && (
          <div>
            <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>Steps</div>
            <div style={{ fontSize: "22px", color: "#f7f6f3", fontWeight: "300", ...F }}>{weekSteps.toLocaleString()}</div>
          </div>
        )}
        <div>
          <div style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>Activities</div>
          <div style={{ fontSize: "22px", color: "#f7f6f3", fontWeight: "300", ...F }}>{thisWeek.length}</div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Activity log</div>
        {!adding && (
          <button onClick={() => setAdding(true)} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
            + Log Activity
          </button>
        )}
      </div>

      {adding && <AddActivityForm onAdd={a => {
              setActivities(prev => [a, ...prev]);
              setAdding(false);
              if (clientId) {
                import("../lib/supabase").then(({ logActivity }) => {
                  logActivity(clientId, { activity_type: a.type, duration_minutes: a.duration, distance_miles: a.distance || null, intensity: a.intensity, notes: a.notes || null, activity_date: a.date });
                }).catch(() => {});
              }
            }} onCancel={() => setAdding(false)} />}

      {sorted.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#bbb", ...F }}>
          <div style={{ fontSize: "14px", marginBottom: "6px" }}>No activities logged yet</div>
          <div style={{ fontSize: "11px" }}>Log walks, runs, yoga, sports — anything outside your main workout</div>
        </div>
      )}

      {Object.entries(grouped).map(([date, acts]) => (
        <div key={date} style={{ marginBottom: "14px" }}>
          <div style={{ fontSize: "10px", color: "#999", letterSpacing: "0.08em", marginBottom: "6px" }}>{formatDate(date)}</div>
          {acts.map(a => {
            const at = ACTIVITY_TYPES.find(x => x.id === a.type);
            const intensity = INTENSITIES.find(i => i.id === a.intensity);
            return (
              <div key={a.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "12px 14px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "3px" }}>{at?.label || a.type}</div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "#888" }}>{a.duration} {at?.unit || "min"}</span>
                    {a.distance && <span style={{ fontSize: "11px", color: "#888" }}>{a.distance} mi</span>}
                    {intensity && a.type !== "steps" && (
                      <span style={{ fontSize: "10px", color: intensity.color, fontWeight: "600" }}>{intensity.label}</span>
                    )}
                  </div>
                  {a.notes && <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px", fontStyle: "italic" }}>{a.notes}</div>}
                </div>
                <button onClick={() => setActivities(prev => prev.filter(x => x.id !== a.id))} style={{ background: "none", border: "none", color: "#ddd", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
