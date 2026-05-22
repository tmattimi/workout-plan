import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function HealthLogModal({ todayKey, dailyHealth, onSave, onDismiss }) {
  const existing = dailyHealth[todayKey] || {};
  const [form, setForm] = useState({
    sleep_hours: existing.sleep_hours || "",
    sleep_quality: existing.sleep_quality || "",
    resting_hr: existing.resting_hr || "",
    hrv: existing.hrv || "",
    energy_level: existing.energy_level || "",
  });
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 30); }, []);

  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }

  function handleSave() {
    const updated = {
      ...dailyHealth,
      [todayKey]: {
        ...(dailyHealth[todayKey] || {}),
        ...form,
        logged_at: new Date().toISOString(),
      },
    };
    setVisible(false);
    setTimeout(() => onSave(updated), 250);
  }

  function dismiss() {
    setVisible(false);
    setTimeout(onDismiss, 250);
  }

  const SLEEP_OPTIONS = ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9+"];
  const ENERGY_OPTIONS = [
    { val: "1", label: "Very low", emoji: "😴" },
    { val: "2", label: "Low",      emoji: "😕" },
    { val: "3", label: "Okay",     emoji: "😐" },
    { val: "4", label: "Good",     emoji: "🙂" },
    { val: "5", label: "Great",    emoji: "💪" },
  ];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "flex-end",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 640, margin: "0 auto",
        background: "#1c1c1e",
        borderRadius: "20px 20px 0 0",
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        maxHeight: "90vh", overflowY: "auto",
        ...F,
      }}>
        <div style={{ padding: "20px 20px 32px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6e6e73", marginBottom: "4px" }}>
                {new Date(todayKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ fontSize: "18px", color: "#f5f5f7", fontWeight: "normal" }}>How did you recover?</div>
            </div>
            <button onClick={dismiss} style={{ background: "none", border: "none", color: "#6e6e73", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>✕</button>
          </div>

          {/* Sleep */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
              Hours slept
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {SLEEP_OPTIONS.map(h => (
                <button
                  key={h}
                  onClick={() => set("sleep_hours", h === "9+" ? "9.5" : h)}
                  style={{
                    padding: "7px 12px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
                    background: (form.sleep_hours === h || (h === "9+" && form.sleep_hours === "9.5")) ? "#fff" : "rgba(255,255,255,0.06)",
                    color: (form.sleep_hours === h || (h === "9+" && form.sleep_hours === "9.5")) ? "#111" : "#aaa",
                    border: "none", fontWeight: (form.sleep_hours === h || (h === "9+" && form.sleep_hours === "9.5")) ? "700" : "400",
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Energy level */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
              How do you feel?
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {ENERGY_OPTIONS.map(e => (
                <button
                  key={e.val}
                  onClick={() => set("energy_level", e.val)}
                  style={{
                    flex: 1, padding: "10px 4px", borderRadius: "8px", cursor: "pointer",
                    background: form.energy_level === e.val ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.energy_level === e.val ? "rgba(255,255,255,0.2)" : "transparent"}`,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{e.emoji}</span>
                  <span style={{ fontSize: "8px", color: form.energy_level === e.val ? "#f5f5f7" : "#666", letterSpacing: "0.04em" }}>{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* HR and HRV — optional */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "22px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "#6e6e73", marginBottom: "6px" }}>Resting HR (bpm) — optional</div>
              <input
                type="number"
                inputMode="decimal"
                value={form.resting_hr}
                onChange={e => set("resting_hr", e.target.value)}
                placeholder="e.g. 58"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f5f5f7", fontSize: "14px", boxSizing: "border-box",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "10px", color: "#6e6e73", marginBottom: "6px" }}>HRV (ms) — optional</div>
              <input
                type="number"
                inputMode="decimal"
                value={form.hrv}
                onChange={e => set("hrv", e.target.value)}
                placeholder="e.g. 52"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#f5f5f7", fontSize: "14px", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              width: "100%", background: "#f5f5f7", color: "#111",
              border: "none", borderRadius: "10px", padding: "15px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer", ...F,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
