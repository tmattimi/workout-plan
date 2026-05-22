import { useState } from "react";
import { getRecoveryAssessment } from "../lib/recoveryEngine";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const SLEEP_OPTIONS = ["4","4.5","5","5.5","6","6.5","7","7.5","8","8.5","9","9+"];
const ENERGY_OPTIONS = [
  { val:"1", label:"Very low", emoji:"😴" },
  { val:"2", label:"Low",      emoji:"😕" },
  { val:"3", label:"Okay",     emoji:"😐" },
  { val:"4", label:"Good",     emoji:"🙂" },
  { val:"5", label:"Great",    emoji:"💪" },
];

function ScoreRing({ score, color, size = 64 }) {
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede9e4" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

function RecoveryScore({ assessment }) {
  const [expanded, setExpanded] = useState(false);
  if (!assessment) return null;

  return (
    <div style={{ background: "#fff", border: `1px solid ${assessment.color}33`, borderRadius: "12px", marginBottom: "16px", overflow: "hidden" }}>
      <button onClick={() => setExpanded(p => !p)} style={{
        width: "100%", background: "none", border: "none",
        padding: "14px 16px", cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: "14px",
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreRing score={assessment.score} color={assessment.color} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "15px", fontWeight: "700", color: assessment.color }}>{assessment.score}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{assessment.label}</span>
            {assessment.intensityMultiplier < 1 && assessment.intensityMultiplier > 0 && (
              <span style={{ fontSize: "9px", background: `${assessment.color}20`, color: assessment.color, borderRadius: "4px", padding: "2px 6px", fontWeight: "700" }}>
                {Math.round(assessment.intensityMultiplier * 100)}% intensity
              </span>
            )}
            {assessment.intensityMultiplier === 0 && (
              <span style={{ fontSize: "9px", background: "#fee2e2", color: "#ef4444", borderRadius: "4px", padding: "2px 6px", fontWeight: "700" }}>
                Rest day
              </span>
            )}
          </div>
          <div style={{ fontSize: "12px", color: "#777", lineHeight: "1.5", ...F }}>{assessment.summary}</div>
        </div>
        <span style={{ color: "#ccc", fontSize: "10px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "12px 16px" }}>
          {assessment.factors.map((f, i) => (
            <div key={i} style={{
              display: "flex", gap: "12px", alignItems: "center",
              padding: "7px 0",
              borderBottom: i < assessment.factors.length - 1 ? "1px solid #f5f5f3" : "none",
            }}>
              <div style={{ width: "40px", flexShrink: 0 }}>
                <div style={{ height: "4px", background: "#f0ede8", borderRadius: "2px" }}>
                  <div style={{ height: "100%", width: `${f.score ?? 50}%`, borderRadius: "2px", transition: "width 0.5s",
                    background: f.score >= 70 ? "#22c55e" : f.score >= 40 ? "#f59e0b" : "#ef4444" }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#333", marginRight: "6px" }}>{f.label}</span>
                <span style={{ fontSize: "11px", fontWeight: "700", color: assessment.color, marginRight: "6px" }}>{f.value}</span>
                <span style={{ fontSize: "10px", color: "#aaa" }}>{f.note}</span>
              </div>
            </div>
          ))}

          <div style={{ background: `${assessment.color}10`, border: `1px solid ${assessment.color}25`, borderRadius: "8px", padding: "11px 13px", marginTop: "12px" }}>
            <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: assessment.color, marginBottom: "5px" }}>
              Today's recommendation
            </div>
            <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.7", ...F }}>{assessment.recommendation}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function DailyLogForm({ todayKey, dailyHealth, onUpdate }) {
  const existing = dailyHealth[todayKey] || {};
  const [form, setForm] = useState({
    sleep_hours:   existing.sleep_hours   || "",
    energy_level:  existing.energy_level  || "",
    resting_hr:    existing.resting_hr    || "",
    hrv:           existing.hrv           || "",
    notes:         existing.notes         || "",
  });
  const [saved, setSaved] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); setSaved(false); }

  function save() {
    const updated = {
      ...dailyHealth,
      [todayKey]: { ...(dailyHealth[todayKey] || {}), ...form, logged_at: new Date().toISOString() },
    };
    onUpdate(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "14px" }}>
        {new Date(todayKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>

      {/* Sleep */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "9px" }}>Hours slept</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
          {SLEEP_OPTIONS.map(h => {
            const val = h === "9+" ? "9.5" : h;
            const selected = form.sleep_hours === val || form.sleep_hours === h;
            return (
              <button key={h} onClick={() => set("sleep_hours", val)} style={{
                padding: "7px 11px", borderRadius: "7px", fontSize: "13px", cursor: "pointer", ...F,
                background: selected ? "#111" : "#f9f9f7",
                color: selected ? "#fff" : "#666",
                border: `1px solid ${selected ? "#111" : "#e4e0db"}`,
                fontWeight: selected ? "700" : "400",
              }}>{h}</button>
            );
          })}
        </div>
      </div>

      {/* Energy */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "11px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "9px" }}>How do you feel?</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {ENERGY_OPTIONS.map(e => (
            <button key={e.val} onClick={() => set("energy_level", e.val)} style={{
              flex: 1, padding: "10px 4px", borderRadius: "8px", cursor: "pointer",
              background: form.energy_level === e.val ? "#f9f9f7" : "#fff",
              border: `1px solid ${form.energy_level === e.val ? "#111" : "#e4e0db"}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            }}>
              <span style={{ fontSize: "18px" }}>{e.emoji}</span>
              <span style={{ fontSize: "8px", color: form.energy_level === e.val ? "#111" : "#aaa", letterSpacing: "0.04em" }}>{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HR and HRV */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "10px", color: "#999", marginBottom: "6px" }}>Resting heart rate (bpm)</div>
          <input type="number" inputMode="decimal" value={form.resting_hr} onChange={e => set("resting_hr", e.target.value)} placeholder="e.g. 58"
            style={{ width: "100%", padding: "9px 11px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", color: "#111", background: "#fafaf8", boxSizing: "border-box" }} />
        </div>
        <div>
          <div style={{ fontSize: "10px", color: "#999", marginBottom: "6px" }}>HRV (ms)</div>
          <input type="number" inputMode="decimal" value={form.hrv} onChange={e => set("hrv", e.target.value)} placeholder="e.g. 52"
            style={{ width: "100%", padding: "9px 11px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", color: "#111", background: "#fafaf8", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Save */}
      <button onClick={save} style={{
        width: "100%", background: saved ? "#2d7a1e" : "#111", color: "#fff",
        border: "none", borderRadius: "9px", padding: "13px",
        fontSize: "13px", fontWeight: "600", cursor: "pointer", ...F,
        transition: "background 0.2s",
      }}>
        {saved ? "✓ Saved" : "Save"}
      </button>
    </div>
  );
}

function HistoryRow({ date, data }) {
  const d = new Date(date + "T12:00:00");
  const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 0", borderBottom: "1px solid #f5f5f3" }}>
      <div style={{ width: "80px", flexShrink: 0, fontSize: "10px", color: "#aaa" }}>{label}</div>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", flex: 1 }}>
        {data.sleep_hours && (
          <span style={{ fontSize: "10px", background: "#f0f4ff", color: "#2563a8", padding: "2px 7px", borderRadius: "20px" }}>
            💤 {data.sleep_hours}h
          </span>
        )}
        {data.energy_level && (
          <span style={{ fontSize: "10px", background: "#f0fdf4", color: "#2d7a1e", padding: "2px 7px", borderRadius: "20px" }}>
            {ENERGY_OPTIONS.find(e => e.val === String(data.energy_level))?.emoji} {data.energy_level}/5
          </span>
        )}
        {data.resting_hr && (
          <span style={{ fontSize: "10px", background: "#fef3e4", color: "#c47a0a", padding: "2px 7px", borderRadius: "20px" }}>
            ♥ {data.resting_hr} bpm
          </span>
        )}
        {data.hrv && (
          <span style={{ fontSize: "10px", background: "#f5f0ff", color: "#7c3aed", padding: "2px 7px", borderRadius: "20px" }}>
            HRV {data.hrv}ms
          </span>
        )}
      </div>
    </div>
  );
}

export default function HealthTab({ dailyHealth, todayKey, onHealthUpdate, clientId }) {
  const [section, setSection] = useState("today"); // today | history | integrations

  const assessment = getRecoveryAssessment(dailyHealth, todayKey);

  // Recent 14 days of history, most recent first
  const recentHistory = Object.entries(dailyHealth)
    .filter(([date]) => date <= todayKey)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 14);

  const SECTIONS = [
    { id: "today",        label: "Today" },
    { id: "history",      label: "History" },
    { id: "integrations", label: "Connect" },
  ];

  return (
    <div style={{ padding: "16px 16px 80px", ...F }}>

      {/* Section tabs */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "16px", background: "#f5f5f3", borderRadius: "9px", padding: "3px" }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            flex: 1, padding: "7px 4px", borderRadius: "7px", fontSize: "11px", cursor: "pointer", border: "none",
            background: section === s.id ? "#fff" : "transparent",
            color: section === s.id ? "#111" : "#888",
            fontWeight: section === s.id ? "600" : "400", ...F,
            boxShadow: section === s.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>{s.label}</button>
        ))}
      </div>

      {/* TODAY */}
      {section === "today" && (
        <>
          {assessment && <RecoveryScore assessment={assessment} />}
          {!assessment && (dailyHealth[todayKey]?.sleep_hours || dailyHealth[todayKey]?.resting_hr) && (
            <div style={{ background: "#fafaf8", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "11px 14px", marginBottom: "14px", fontSize: "11px", color: "#aaa", textAlign: "center" }}>
              Log a few more days to unlock your recovery score
            </div>
          )}
          <DailyLogForm todayKey={todayKey} dailyHealth={dailyHealth} onUpdate={onHealthUpdate} />
        </>
      )}

      {/* HISTORY */}
      {section === "history" && (
        <div style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "12px", padding: "14px 16px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "12px" }}>Last 14 days</div>
          {recentHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>
              No health data logged yet. Start with today.
            </div>
          ) : (
            recentHistory.map(([date, data]) => (
              <HistoryRow key={date} date={date} data={data} />
            ))
          )}
        </div>
      )}

      {/* INTEGRATIONS */}
      {section === "integrations" && (
        <div>
          {[
            {
              name: "Apple Health",
              icon: "♥",
              color: "#ff2d55",
              status: "coming_soon",
              statusLabel: "Coming soon",
              description: "Automatically sync sleep, resting heart rate, HRV, steps, and workout data. Requires the native iOS app — in development.",
            },
            {
              name: "Apple Watch",
              icon: "⌚",
              color: "#1c1c1e",
              status: "coming_soon",
              statusLabel: "Coming soon",
              description: "Workout data, heart rate zones, and activity rings flow in automatically via Apple Health.",
            },
            {
              name: "Oura Ring",
              icon: "◎",
              color: "#7a3aa0",
              status: "planned",
              statusLabel: "Planned",
              description: "Readiness score, HRV, sleep stages, and recovery data via the Oura REST API.",
            },
            {
              name: "Garmin",
              icon: "◉",
              color: "#007dc5",
              status: "planned",
              statusLabel: "Planned",
              description: "Steps, heart rate, VO2 max, and workout data via Garmin Connect.",
            },
            {
              name: "Whoop",
              icon: "⬡",
              color: "#00c4a1",
              status: "planned",
              statusLabel: "Planned",
              description: "Strain, recovery score, and sleep performance data.",
            },
          ].map(app => (
            <div key={app.name} style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "10px", padding: "14px 16px", marginBottom: "8px", display: "flex", gap: "13px", alignItems: "flex-start" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: app.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                {app.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{app.name}</span>
                  <span style={{
                    fontSize: "9px", padding: "2px 7px", borderRadius: "20px",
                    background: app.status === "coming_soon" ? "#fef3e4" : "#f5f0ff",
                    color: app.status === "coming_soon" ? "#c47a0a" : "#7c3aed",
                  }}>
                    {app.statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.6" }}>{app.description}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "16px", padding: "14px 16px", background: "#f9f9f7", borderRadius: "10px", fontSize: "11px", color: "#aaa", lineHeight: "1.7", textAlign: "center" }}>
            Until native integrations are live, log your sleep and heart rate manually in the Today tab. Your recovery score builds as you log more days.
          </div>
        </div>
      )}
    </div>
  );
}
