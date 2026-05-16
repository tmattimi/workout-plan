import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Manual health data entry (until native integration is built)
function loadHealthData() {
  try { return JSON.parse(localStorage.getItem("health_data_v1") || "{}"); } catch { return {}; }
}
function saveHealthData(d) {
  try { localStorage.setItem("health_data_v1", JSON.stringify(d)); } catch {}
}

const INTEGRATIONS = [
  {
    id: "apple_health",
    name: "Apple Health",
    icon: "♥",
    status: "coming_soon",
    description: "Sync steps, heart rate, sleep, and workouts from Apple Health.",
    requirement: "Requires a native iOS app. Coming in a future update.",
    color: "#ff2d55",
  },
  {
    id: "apple_watch",
    name: "Apple Watch",
    icon: "⌚",
    status: "coming_soon",
    description: "Sync workout data, heart rate zones, and activity rings.",
    requirement: "Works via Apple Health — same native app required.",
    color: "#1c1c1e",
  },
  {
    id: "oura",
    name: "Oura Ring",
    icon: "◎",
    status: "planned",
    description: "Sync readiness score, HRV, sleep stages, and recovery data.",
    requirement: "Oura has an open REST API. This will be connected via a server-side integration.",
    color: "#7a3aa0",
  },
  {
    id: "garmin",
    name: "Garmin",
    icon: "◉",
    status: "planned",
    description: "Sync steps, heart rate, VO2 max, and workout data.",
    requirement: "Garmin Connect API — server-side integration planned.",
    color: "#007dc5",
  },
];

const STATUS_LABELS = {
  connected: { label: "Connected", color: "#2d7a1e", bg: "#e8f5e9" },
  coming_soon: { label: "Coming soon", color: "#c47a0a", bg: "#fef3e4" },
  planned: { label: "Planned", color: "#7a3aa0", bg: "#f3eafa" },
};

export default function HealthIntegration() {
  const [healthData, setHealthData] = useState(loadHealthData);
  const [editingDate, setEditingDate] = useState(new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState({ steps: "", sleep_hours: "", sleep_quality: "", hrv: "", resting_hr: "", weight_lbs: "", notes: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing entry for this date if any
    const existing = healthData[editingDate] || {};
    setForm({
      steps: existing.steps || "",
      sleep_hours: existing.sleep_hours || "",
      sleep_quality: existing.sleep_quality || "",
      hrv: existing.hrv || "",
      resting_hr: existing.resting_hr || "",
      weight_lbs: existing.weight_lbs || "",
      notes: existing.notes || "",
    });
  }, [editingDate]);

  function handleSave() {
    const updated = { ...healthData, [editingDate]: { ...form, logged_at: new Date().toISOString() } };
    setHealthData(updated);
    saveHealthData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Recent 7 days for mini chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), ...healthData[key] };
  });

  const hasRecentData = last7.some(d => d.steps || d.sleep_hours || d.hrv);

  return (
    <div style={{ padding: "16px 16px 60px" }}>

      {/* Integrations status */}
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Device integrations</div>
      <div style={{ marginBottom: "20px" }}>
        {INTEGRATIONS.map(integration => {
          const statusInfo = STATUS_LABELS[integration.status];
          return (
            <div key={integration.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px 16px", marginBottom: "8px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: integration.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {integration.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>{integration.name}</div>
                  <span style={{ fontSize: "9px", fontWeight: "600", background: statusInfo.bg, color: statusInfo.color, padding: "2px 8px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {statusInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.5", marginBottom: "3px" }}>{integration.description}</div>
                <div style={{ fontSize: "10px", color: "#bbb", fontStyle: "italic" }}>{integration.requirement}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual data entry — bridge until integrations are live */}
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Manual health log</div>
      <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "10px 12px", marginBottom: "12px" }}>
        <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.6" }}>
          Until device sync is live, log your key health metrics here manually. This data will be automatically pulled into the AI coach analysis and goal tracking once integrations are connected.
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999" }}>Log entry</div>
          <input type="date" value={editingDate} onChange={e => setEditingDate(e.target.value)}
            style={{ padding: "5px 8px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "11px", ...F }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          {[
            { key: "steps", label: "Steps", placeholder: "e.g. 8500", type: "number" },
            { key: "weight_lbs", label: "Weight (lbs)", placeholder: "e.g. 148.5", type: "number" },
            { key: "sleep_hours", label: "Sleep (hours)", placeholder: "e.g. 7.5", type: "number" },
            { key: "sleep_quality", label: "Sleep quality (1–10)", placeholder: "e.g. 8", type: "number" },
            { key: "hrv", label: "HRV (ms)", placeholder: "From watch/ring", type: "number" },
            { key: "resting_hr", label: "Resting HR (bpm)", placeholder: "e.g. 58", type: "number" },
          ].map(field => (
            <div key={field.key}>
              <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>{field.label}</div>
              <input
                type={field.type}
                value={form[field.key]}
                onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }}
              />
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>Notes (optional)</div>
          <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Energy level, how you felt, anything notable..."
            style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }} />
        </div>

        <button onClick={handleSave} style={{ background: "#111", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "9px 18px", fontSize: "12px", cursor: "pointer", ...F }}>
          {saved ? "Saved" : "Save entry"}
        </button>
      </div>

      {/* Last 7 days summary */}
      {hasRecentData && (
        <>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Last 7 days</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "6px" }}>
            {last7.map(d => {
              const hasData = d.steps || d.sleep_hours || d.hrv;
              return (
                <div key={d.date} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "8px", color: "#bbb", marginBottom: "4px" }}>{d.label}</div>
                  <div style={{ width: "100%", paddingBottom: "100%", borderRadius: "4px", background: hasData ? "#111" : "#f0f0f0", position: "relative" }}>
                    {hasData && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#fff" }}>✓</div>}
                  </div>
                  {d.sleep_quality && <div style={{ fontSize: "8px", color: "#2563a8", marginTop: "3px" }}>{d.sleep_quality}/10</div>}
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(() => {
              const recent = last7.filter(d => d.steps);
              const avgSteps = recent.length ? Math.round(recent.reduce((s, d) => s + Number(d.steps), 0) / recent.length) : null;
              const recentSleep = last7.filter(d => d.sleep_hours);
              const avgSleep = recentSleep.length ? (recentSleep.reduce((s, d) => s + Number(d.sleep_hours), 0) / recentSleep.length).toFixed(1) : null;
              const recentHRV = last7.filter(d => d.hrv);
              const avgHRV = recentHRV.length ? Math.round(recentHRV.reduce((s, d) => s + Number(d.hrv), 0) / recentHRV.length) : null;
              return [
                avgSteps && { label: "Avg steps", value: avgSteps.toLocaleString() },
                avgSleep && { label: "Avg sleep", value: `${avgSleep}h` },
                avgHRV && { label: "Avg HRV", value: `${avgHRV}ms` },
              ].filter(Boolean).map((stat, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 14px", flex: "1" }}>
                  <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3px" }}>{stat.label}</div>
                  <div style={{ fontSize: "18px", ...F }}>{stat.value}</div>
                </div>
              ));
            })()}
          </div>
        </>
      )}
    </div>
  );
}
