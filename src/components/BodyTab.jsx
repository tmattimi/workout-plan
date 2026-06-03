import { useState, useEffect, useRef } from "react";
import HealthTab from "./HealthTab";
import { InlineEmpty } from "./ui";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Shared storage helpers ─────────────────────────────────────────────────────
function loadMeasurements() { try { return JSON.parse(localStorage.getItem("measurements") || "[]"); } catch { return []; } }
function saveMeasurements(d) { try { localStorage.setItem("measurements", JSON.stringify(d)); } catch {} }
function loadPhotos() { try { return JSON.parse(localStorage.getItem("progress_photos_v2") || "{}"); } catch { return {}; } }
function savePhotos(d) { try { localStorage.setItem("progress_photos_v2", JSON.stringify(d)); } catch {} }
function loadScans() { try { return JSON.parse(localStorage.getItem("body_scans_v1") || "[]"); } catch { return []; } }
function saveScans(d) { try { localStorage.setItem("body_scans_v1", JSON.stringify(d)); } catch {} }
function loadHealthData() { try { return JSON.parse(localStorage.getItem("health_data_v1") || "{}"); } catch { return {}; } }
function saveHealthData(d) { try { localStorage.setItem("health_data_v1", JSON.stringify(d)); } catch {} }
function today() { return new Date().toISOString().slice(0, 10); }

// ── Metrics config ────────────────────────────────────────────────────────────
const METRICS = [
  { key: "weight_lbs", label: "Weight", unit: "lbs", color: "#1d6fa8", group: "main" },
  { key: "body_fat_pct", label: "Body Fat", unit: "%", color: "#a02020", group: "main" },
  { key: "waist_in", label: "Waist", unit: '"', color: "#c47a0a", group: "measurements" },
  { key: "hips_in", label: "Hips", unit: '"', color: "#7a3aa0", group: "measurements" },
  { key: "chest_in", label: "Chest", unit: '"', color: "#2d7a1e", group: "measurements" },
  { key: "right_arm_in", label: "R Arm", unit: '"', color: "#147a50", group: "measurements" },
  { key: "left_arm_in", label: "L Arm", unit: '"', color: "#147a50", group: "measurements" },
  { key: "right_thigh_in", label: "R Thigh", unit: '"', color: "#7a3aa0", group: "measurements" },
  { key: "left_thigh_in", label: "L Thigh", unit: '"', color: "#7a3aa0", group: "measurements" },
];

const POSES = [
  { id: "front", label: "Front", instruction: "Face the camera straight on. Feet hip-width, arms slightly away from your sides. Chin level." },
  { id: "side", label: "Side", instruction: "Turn 90 degrees. Arms down at your sides. Stand tall, shoulders back." },
  { id: "back", label: "Back", instruction: "Turn around completely. Feet hip-width, arms slightly away." },
];

// ── Mini sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ values, color }) {
  if (values.length < 2) return null;
  const W = 80, H = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 28 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Measurements section ──────────────────────────────────────────────────────
function MeasurementsSection({ clientId }) {
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load from Supabase on mount, fall back to localStorage
  useEffect(() => {
    async function load() {
      if (clientId) {
        try {
          const { getClientMeasurements } = await import("../lib/supabase");
          const { data } = await getClientMeasurements(clientId);
          if (data && data.length > 0) {
            setMeasurements(data.map(m => ({ ...m, measured_at: m.measured_at })));
            setLoading(false);
            return;
          }
        } catch(e) { console.warn("Supabase measurements load failed:", e); }
      }
      // Fall back to localStorage
      setMeasurements(loadMeasurements());
      setLoading(false);
    }
    load();
  }, [clientId]);

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];

  async function handleSave() {
    if (!Object.values(form).some(v => v)) return;
    setSaving(true);
    const entry = {
      weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
      body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
      waist_in: form.waist_in ? parseFloat(form.waist_in) : null,
      hips_in: form.hips_in ? parseFloat(form.hips_in) : null,
      chest_in: form.chest_in ? parseFloat(form.chest_in) : null,
      right_arm_in: form.right_arm_in ? parseFloat(form.right_arm_in) : null,
      left_arm_in: form.left_arm_in ? parseFloat(form.left_arm_in) : null,
      right_thigh_in: form.right_thigh_in ? parseFloat(form.right_thigh_in) : null,
      left_thigh_in: form.left_thigh_in ? parseFloat(form.left_thigh_in) : null,
      measured_at: today(),
    };

    // Save to localStorage immediately
    const updated = [...measurements, entry];
    setMeasurements(updated);
    saveMeasurements(updated);

    // Save to Supabase if client is logged in
    if (clientId) {
      try {
        const { logMeasurement } = await import("../lib/supabase");
        await logMeasurement(clientId, entry);
      } catch(e) { console.warn("Supabase measurement save failed:", e); }
    }

    setForm({});
    setAdding(false);
    setSaving(false);
  }

  function formatDate(d) {
    return d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Measurements</div>
        <button onClick={() => setAdding(p => !p)} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
          {adding ? "Cancel" : "+ Log"}
        </button>
      </div>

      {adding && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            {METRICS.map(m => (
              <div key={m.key}>
                <div style={{ fontSize: "10px", color: "#888", marginBottom: "3px" }}>{m.label} ({m.unit})</div>
                <input type="number" step="0.1" value={form[m.key] || ""}
                  onChange={e => setForm(p => ({ ...p, [m.key]: e.target.value }))}
                  placeholder="—"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#888" : "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "6px", padding: "9px 18px", fontSize: "12px", cursor: "pointer", ...F }}>
            {saving ? "Saving..." : "Save measurements"}
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>Loading...</div>
      )}
      {!loading && measurements.length === 0 && !adding && (
        <InlineEmpty>No measurements logged yet.</InlineEmpty>
      )}

      {latest && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", color: "#bbb", marginBottom: "8px" }}>Latest · {formatDate(latest.measured_at)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {METRICS.filter(m => latest[m.key]).map(m => {
              const diff = prev?.[m.key] ? (parseFloat(latest[m.key]) - parseFloat(prev[m.key])).toFixed(1) : null;
              const values = measurements.map(e => parseFloat(e[m.key])).filter(Boolean);
              return (
                <div key={m.key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 12px", cursor: "pointer" }}
                  onClick={() => setSelected(selected === m.key ? null : m.key)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>{m.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a1a" }}>{latest[m.key]}<span style={{ fontSize: "10px", fontWeight: "400", color: "#aaa", marginLeft: "2px" }}>{m.unit}</span></div>
                      {diff && diff !== "0.0" && (
                        <div style={{ fontSize: "10px", color: parseFloat(diff) < 0 && m.key !== "weight_lbs" ? "#2d7a1e" : parseFloat(diff) > 0 && m.key !== "weight_lbs" ? "#a02020" : "#aaa" }}>
                          {parseFloat(diff) > 0 ? "+" : ""}{diff}
                        </div>
                      )}
                    </div>
                    {values.length > 1 && <Sparkline values={values} color={m.color} />}
                  </div>
                  {selected === m.key && values.length > 1 && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f0f0f0" }}>
                      {measurements.slice(-6).reverse().map((e, i) => e[m.key] && (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "2px 0" }}>
                          <span style={{ color: "#aaa" }}>{formatDate(e.measured_at)}</span>
                          <span style={{ fontWeight: "600" }}>{e[m.key]}{m.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Progress photos section ────────────────────────────────────────────────────
function PhotosSection() {
  const [photos, setPhotos] = useState(loadPhotos);
  const [subview, setSubview] = useState("current"); // current | history | compare
  const [compareMonths, setCompareMonths] = useState([]);
  const fileRefs = { front: useRef(), side: useRef(), back: useRef() };

  useEffect(() => { savePhotos(photos); }, [photos]);

  const currentKey = today().slice(0, 7);
  const currentEntry = photos[currentKey] || {};

  function handleFile(poseId, e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const updated = { ...photos, [currentKey]: { ...currentEntry, [poseId]: r.result, date: currentKey } };
      setPhotos(updated);
    };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  function removePose(poseId) {
    const entry = { ...currentEntry };
    delete entry[poseId];
    setPhotos(p => ({ ...p, [currentKey]: entry }));
  }

  const allMonths = Object.keys(photos).sort((a, b) => b.localeCompare(a));
  const monthsWithPhotos = allMonths.filter(k => POSES.some(p => photos[k]?.[p.id]));

  function formatMonth(k) {
    return new Date(k + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Progress Photos</div>
        <div style={{ display: "flex", gap: "3px" }}>
          {[["current", "Now"], ["history", "History"], ["compare", "Compare"]].map(([v, label]) => (
            <button key={v} onClick={() => setSubview(v)} style={{ padding: "4px 9px", border: "1px solid " + (subview === v ? "#1a1a1a" : "#e0e0e0"), borderRadius: "20px", background: subview === v ? "#1a1a1a" : "#fff", color: subview === v ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "10px" }}>{label}</button>
          ))}
        </div>
      </div>

      {subview === "current" && (
        <>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            {POSES.map(pose => {
              const img = currentEntry[pose.id];
              return (
                <div key={pose.id} style={{ flex: 1 }}>
                  <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "4px", textAlign: "center" }}>{pose.label}</div>
                  {img ? (
                    <div style={{ position: "relative" }}>
                      <img src={img} alt={pose.label} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "6px", display: "block" }} />
                      <button onClick={() => removePose(pose.id)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  ) : (
                    <button onClick={() => fileRefs[pose.id].current.click()} style={{ width: "100%", aspectRatio: "3/4", background: "#f5f5f3", border: "2px dashed #e0e0e0", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "4px" }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M12 16V8m0 0-3 3m3-3 3 3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      <span style={{ fontSize: "8px", color: "#bbb" }}>Add</span>
                    </button>
                  )}
                  <input ref={fileRefs[pose.id]} type="file" accept="image/*" capture="user" onChange={e => handleFile(pose.id, e)} style={{ display: "none" }} />
                </div>
              );
            })}
          </div>
          <div style={{ background: "#f9f9f7", borderRadius: "6px", padding: "10px 12px", fontSize: "10px", color: "#888", lineHeight: "1.6" }}>
            Form-fitting clothing, same lighting each month, same day each month. Front, side (left), back.
          </div>
        </>
      )}

      {subview === "history" && (
        monthsWithPhotos.length === 0 ? (
          <InlineEmpty>No photos yet.</InlineEmpty>
        ) : monthsWithPhotos.map(k => (
          <div key={k} style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#666", marginBottom: "6px" }}>{formatMonth(k)}</div>
            <div style={{ display: "flex", gap: "5px" }}>
              {POSES.map(pose => photos[k]?.[pose.id] ? (
                <div key={pose.id} style={{ flex: 1 }}>
                  <img src={photos[k][pose.id]} alt={pose.label} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "5px" }} />
                  <div style={{ fontSize: "8px", color: "#bbb", textAlign: "center", marginTop: "2px" }}>{pose.label}</div>
                </div>
              ) : <div key={pose.id} style={{ flex: 1, aspectRatio: "3/4", background: "#f5f5f3", borderRadius: "5px" }} />)}
            </div>
          </div>
        ))
      )}

      {subview === "compare" && (
        <>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "10px" }}>Select two months to compare.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
            {monthsWithPhotos.map(k => {
              const sel = compareMonths.includes(k);
              return (
                <button key={k} onClick={() => sel ? setCompareMonths(p => p.filter(m => m !== k)) : compareMonths.length < 2 && setCompareMonths(p => [...p, k])}
                  style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", background: sel ? "#1a1a1a" : "#fff", color: sel ? "#f7f6f3" : "#555", border: "1px solid " + (sel ? "#1a1a1a" : "#ddd") }}>
                  {formatMonth(k)}
                </button>
              );
            })}
          </div>
          {compareMonths.length === 2 && POSES.map(pose => {
            const a = photos[compareMonths[0]]?.[pose.id];
            const b = photos[compareMonths[1]]?.[pose.id];
            if (!a && !b) return null;
            return (
              <div key={pose.id} style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "5px" }}>{pose.label}</div>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[compareMonths[0], compareMonths[1]].map(k => (
                    <div key={k} style={{ flex: 1 }}>
                      {photos[k]?.[pose.id] ? <img src={photos[k][pose.id]} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "5px" }} alt="" /> : <div style={{ width: "100%", aspectRatio: "3/4", background: "#f5f5f3", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: "10px", color: "#ccc" }}>None</span></div>}
                      <div style={{ fontSize: "9px", color: "#aaa", textAlign: "center", marginTop: "2px" }}>{formatMonth(k)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {monthsWithPhotos.length < 2 && <div style={{ color: "#bbb", fontSize: "12px", textAlign: "center", padding: "16px" }}>Log at least two months of photos to compare.</div>}
        </>
      )}
    </div>
  );
}

// ── Body scan section ─────────────────────────────────────────────────────────

// ── Weight tracking section ───────────────────────────────────────────────────
function WeightSection({ clientId }) {
  const [healthData, setHealthData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("daily_health_v1") || "{}"); } catch { return {}; }
  });
  const [input, setInput] = useState("");
  const [editDate, setEditDate] = useState(today());
  const [saved, setSaved] = useState(false);

  // Load from Supabase
  useEffect(() => {
    if (!clientId) return;
    import("../lib/supabase").then(async ({ getHealthLogs }) => {
      const { data } = await getHealthLogs(clientId, 90);
      if (data?.length > 0) {
        const byDate = {};
        data.forEach(row => { if (row.weight_lbs) byDate[row.log_date] = { ...byDate[row.log_date], weight_lbs: row.weight_lbs }; });
        setHealthData(prev => ({ ...prev, ...byDate }));
      }
    });
  }, [clientId]);

  // Sorted weight history
  const history = Object.entries(healthData)
    .filter(([, d]) => d.weight_lbs)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, d]) => ({ date, value: parseFloat(d.weight_lbs) }));

  const current = healthData[editDate]?.weight_lbs || "";
  const latest = history[history.length - 1];
  const startWeight = history[0];
  const totalChange = history.length >= 2 ? (latest.value - startWeight.value).toFixed(1) : null;
  const changeColor = totalChange < 0 ? "#34c759" : totalChange > 0 ? "#e55" : "#aaa";

  function save() {
    const val = parseFloat(input);
    if (isNaN(val) || val < 50 || val > 600) return;
    const updated = { ...healthData, [editDate]: { ...(healthData[editDate] || {}), weight_lbs: val } };
    setHealthData(updated);
    localStorage.setItem("daily_health_v1", JSON.stringify(updated));
    if (clientId) {
      import("../lib/supabase").then(({ upsertHealthLog }) => upsertHealthLog(clientId, editDate, { weight_lbs: val }));
    }
    setInput("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function remove(date) {
    const updated = { ...healthData };
    if (updated[date]) { delete updated[date].weight_lbs; if (!Object.keys(updated[date]).filter(k => k !== "weight_lbs").length) delete updated[date]; }
    setHealthData(updated);
    localStorage.setItem("daily_health_v1", JSON.stringify(updated));
  }

  // Sparkline
  const vals = history.map(h => h.value);
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 0;
  const range = max - min || 1;
  const W = 100; const H = 60;
  const sparkPts = vals.map((v, i) => `${(i/(Math.max(vals.length-1,1)))*W},${H - ((v-min)/range)*(H-8) - 4}`).join(" ");

  return (
    <div style={{ paddingBottom: "40px" }}>
      {/* Header stat */}
      <div style={{ marginBottom: "20px" }}>
        {latest ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "4px" }}>Current weight</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                <span style={{ fontSize: "36px", fontWeight: "700", color: "#111", lineHeight: 1, letterSpacing: "-1px" }}>{latest.value}</span>
                <span style={{ fontSize: "13px", color: "#bbb" }}>lbs</span>
              </div>
              <div style={{ fontSize: "10px", color: "#bbb", marginTop: "3px" }}>
                {new Date(latest.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            {totalChange !== null && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "22px", fontWeight: "700", color: changeColor, letterSpacing: "-0.5px" }}>
                  {parseFloat(totalChange) > 0 ? "+" : ""}{totalChange}
                </div>
                <div style={{ fontSize: "9px", color: "#bbb" }}>lbs total</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ color: "#bbb", fontSize: "13px", marginBottom: "16px", ...F }}>No weight logged yet.</div>
        )}

        {/* Sparkline */}
        {history.length >= 2 && (
          <div style={{ marginBottom: "20px" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
              {/* Goal line if set — can add later */}
              <polyline points={sparkPts} fill="none" stroke="#d0d0d0" strokeWidth="1" />
              <polyline points={sparkPts} fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {history.map((h, i) => {
                const x = (i/(history.length-1))*W;
                const y = H - ((h.value-min)/range)*(H-8) - 4;
                return <circle key={i} cx={x} cy={y} r={i===history.length-1?"3":"1.5"} fill={i===history.length-1?"#111":"#bbb"} />;
              })}
            </svg>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "9px", color: "#bbb" }}>
                {new Date(history[0].date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {history[0].value} lbs
              </span>
              <span style={{ fontSize: "9px", color: "#bbb" }}>{history.length} entries</span>
            </div>
          </div>
        )}
      </div>

      {/* Log entry */}
      <div style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "12px" }}>Log weight</div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
          <input
            type="date" value={editDate} onChange={e => setEditDate(e.target.value)}
            style={{ flex: 1, padding: "9px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "13px", color: "#555", background: "#fafaf8" }}
          />
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="number" inputMode="decimal" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder={healthData[editDate]?.weight_lbs ? `Currently ${healthData[editDate].weight_lbs} lbs` : "e.g. 148.5"}
            style={{ flex: 1, padding: "11px 13px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "15px", color: "#111" }}
            autoFocus
          />
          <span style={{ fontSize: "12px", color: "#bbb", flexShrink: 0 }}>lbs</span>
          <button onClick={save} style={{
            background: saved ? "#2d7a1e" : "#111", color: "#fff",
            border: "none", borderRadius: "7px", padding: "11px 18px",
            fontSize: "13px", fontWeight: "600", cursor: "pointer", ...F,
            transition: "background 0.2s", flexShrink: 0,
          }}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* History log */}
      {history.length > 0 && (
        <div style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "10px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px 8px", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb" }}>History</div>
          {[...history].reverse().slice(0, 20).map(({ date, value }) => {
            const prev = history[history.findIndex(h => h.date === date) - 1];
            const diff = prev ? (value - prev.value).toFixed(1) : null;
            return (
              <div key={date} style={{ display: "flex", alignItems: "center", padding: "9px 16px", borderTop: "1px solid #f5f5f3" }}>
                <div style={{ flex: 1, fontSize: "12px", color: "#555" }}>
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginRight: "10px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</span>
                  <span style={{ fontSize: "10px", color: "#bbb" }}>lbs</span>
                  {diff !== null && diff !== "0.0" && (
                    <span style={{ fontSize: "9px", color: parseFloat(diff) < 0 ? "#2d7a1e" : "#e55", marginLeft: "2px" }}>
                      {parseFloat(diff) > 0 ? "+" : ""}{diff}
                    </span>
                  )}
                </div>
                <button onClick={() => remove(date)} style={{ background: "none", border: "none", color: "#ddd", fontSize: "14px", cursor: "pointer", padding: "2px 6px" }}>×</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BodyScanSection({ clientId }) {
  const [scans, setScans] = useState(loadScans);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [parseError, setParseError] = useState(null);
  const fileRef = useRef();

  useEffect(() => { saveScans(scans); }, [scans]);

  // ── InBody / DEXA metric definitions ───────────────────────────────────────
  // Grouped by section matching the scan output
  const METRIC_GROUPS = [
    {
      group: "Body Composition",
      hint: "The core numbers — what your body is actually made of. Weight alone tells you nothing; these numbers tell you whether you're gaining muscle, losing fat, or both.",
      metrics: [
        { key: "weight_lbs",          label: "Body Weight",            unit: "lbs",  explain: "Total weight — muscle, fat, bone, water, everything. Fluctuates 2–5 lbs daily based on hydration and food volume alone, so don't read too much into single weigh-ins. The trend over weeks is what matters." },
        { key: "lean_mass_lbs",       label: "Lean Body Mass",         unit: "lbs",  explain: "Everything in your body that isn't fat — muscle, bone, organs, and water. This is the number that training is supposed to move upward. If lean mass is increasing, the program is working even if the scale barely moves." },
        { key: "fat_mass_lbs",        label: "Fat Mass",               unit: "lbs",  explain: "The actual weight of fat tissue. This is what you want to see decrease over time. Losing 0.5–1 lb of fat per week while maintaining lean mass is an excellent result for recomposition." },
        { key: "body_fat_pct",        label: "Body Fat %",             unit: "%",    explain: "The percentage of your total weight that is fat. For active women, 18–28% is a healthy athletic range. Below 15% is very lean. The exact number matters less than the direction of the trend across scans." },
        { key: "skeletal_muscle_lbs", label: "Skeletal Muscle Mass",   unit: "lbs",  explain: "The muscle you can actually train — not organs or connective tissue, just the contractile muscle fibers. This is the most direct measure of whether lifting is building mass. Even small increases (0.5–1 lb per month) during recomp are meaningful progress." },
        { key: "dry_lean_mass_lbs",   label: "Dry Lean Mass",          unit: "lbs",  explain: "Lean mass minus the water component. Less influenced by hydration status — useful for comparing scans taken at different times of day or hydration levels." },
      ]
    },
    {
      group: "Body Water",
      hint: "Water makes up 60–70% of lean mass. These numbers reflect cellular health and inflammation levels — not a concern for most people, but useful if something looks off.",
      metrics: [
        { key: "tbw_lbs",       label: "Total Body Water",       unit: "lbs",   explain: "The total water in your body. Normally 60–65% of body weight. Being well-hydrated before a scan gives you more accurate lean mass numbers — dehydration artificially lowers lean mass readings." },
        { key: "icw_lbs",       label: "Intracellular Water",    unit: "lbs",   explain: "Water inside your cells. Higher intracellular water generally means healthier, well-nourished cells. Training typically increases this over time as muscle cells store more glycogen and water." },
        { key: "ecw_lbs",       label: "Extracellular Water",    unit: "lbs",   explain: "Water outside your cells — in blood, lymph, and between tissues. Temporarily elevated after intense training (soreness, inflammation). Chronically elevated ECW can indicate overtraining or inflammation." },
        { key: "ecw_tbw_ratio", label: "ECW/TBW Ratio",          unit: "",      explain: "The fraction of your body water that sits outside cells. Healthy range is typically 0.36–0.39. Values above 0.40 can indicate systemic inflammation or overtraining. A ratio of 0.376 (like in the example) is normal." },
      ]
    },
    {
      group: "Obesity Markers",
      hint: "Useful context, but body fat % is a more meaningful number than BMI for anyone who trains.",
      metrics: [
        { key: "bmi",            label: "BMI",                    unit: "",   explain: "Height-to-weight ratio. Simple and widely used, but deeply flawed for anyone who lifts — muscle is dense, so muscular people often show high BMI despite low body fat. Use body fat % instead." },
        { key: "pbf",            label: "Percent Body Fat (PBF)",  unit: "%",  explain: "Same as body fat % — the InBody label for it. The bar graph on the scan shows where you fall relative to the healthy range for your age and sex." },
        { key: "visceral_fat",   label: "Visceral Fat Level",      unit: "",   explain: "Rated 1–20. Fat stored around your internal organs — the most health-relevant type of fat. Level 1–9 is healthy, 10–14 is caution, 15+ is high risk. This number drops significantly with consistent training and improved diet, often before visible body changes happen." },
        { key: "bmr_kcal",       label: "Basal Metabolic Rate",    unit: "kcal", explain: "The calories your body burns at complete rest just to keep you alive — breathing, organ function, temperature regulation. More muscle = higher BMR = you burn more calories doing nothing. Every lb of muscle added increases BMR by roughly 6–10 kcal/day. This compounds over time." },
      ]
    },
    {
      group: "Segmental Lean Analysis",
      hint: "Breaks down muscle mass by body segment. The most useful thing here is checking for left-right imbalances — asymmetry over ~5% is worth paying attention to.",
      metrics: [
        { key: "right_arm_lbs",  label: "Right Arm Lean Mass",    unit: "lbs", explain: "Muscle and lean tissue in the right arm. Compare to left arm. A difference of more than 0.3–0.5 lbs between arms is common but worth monitoring if you have a history of injury." },
        { key: "left_arm_lbs",   label: "Left Arm Lean Mass",     unit: "lbs", explain: "Muscle and lean tissue in the left arm. If this is consistently lower than the right, targeted unilateral work (single-arm exercises) can help close the gap." },
        { key: "trunk_lbs",      label: "Trunk Lean Mass",        unit: "lbs", explain: "Lean mass in the torso — the largest segment. Includes back, chest, and core musculature. This segment contributes most to overall metabolic rate. Compound movements like rows, hip thrusts, and pressing movements build this." },
        { key: "right_leg_lbs",  label: "Right Leg Lean Mass",    unit: "lbs", explain: "Lean mass in the right leg. Includes quads, hamstrings, glutes, and calves. Should increase meaningfully as training progresses." },
        { key: "left_leg_lbs",   label: "Left Leg Lean Mass",     unit: "lbs", explain: "Lean mass in the left leg. Leg asymmetry is common, especially in people with a history of injury. A consistent difference over 0.5 lbs is worth noting for your coach." },
      ]
    },
    {
      group: "Segmental Fat Analysis",
      hint: "Fat distribution by limb — less actionable than the other sections, but useful for spotting patterns.",
      metrics: [
        { key: "right_arm_fat_pct",  label: "Right Arm Fat %",  unit: "%", explain: "Fat percentage in the right arm. Arms typically have lower fat % than the trunk. This number is not very actionable — overall body fat % is more relevant." },
        { key: "left_arm_fat_pct",   label: "Left Arm Fat %",   unit: "%", explain: "Fat percentage in the left arm." },
        { key: "trunk_fat_pct",      label: "Trunk Fat %",      unit: "%", explain: "Fat percentage in the torso. Often the last area to lean out. Elevated trunk fat % alongside a healthy visceral fat level is subcutaneous (under the skin), which is less of a health concern than visceral fat." },
        { key: "right_leg_fat_pct",  label: "Right Leg Fat %",  unit: "%", explain: "Fat percentage in the right leg." },
        { key: "left_leg_fat_pct",   label: "Left Leg Fat %",   unit: "%", explain: "Fat percentage in the left leg." },
      ]
    },
  ];

  // Flat lookup for edit access
  const METRIC_LABELS = {};
  METRIC_GROUPS.forEach(g => g.metrics.forEach(m => { METRIC_LABELS[m.key] = m; }));

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setParseError(null);
    fileRef.current.value = "";

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const mediaType = file.type || "image/jpeg";
      const isPDF = mediaType === "application/pdf";

      // Call Claude API to parse the scan
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: isPDF ? "document" : "image",
                source: { type: "base64", media_type: mediaType, data: base64 },
              },
              {
                type: "text",
                text: `This is a body composition scan (InBody, DEXA, or similar). Read every number on the document carefully.

Return ONLY a valid JSON object. No markdown, no explanation, no text outside the JSON.

Extract these values using exact key names — only include keys where a number is clearly visible on the scan:

Body composition:
  weight_lbs, lean_mass_lbs, fat_mass_lbs, body_fat_pct, skeletal_muscle_lbs, dry_lean_mass_lbs

Body water:
  tbw_lbs, icw_lbs, ecw_lbs, ecw_tbw_ratio

Obesity / metabolic:
  bmi, pbf, visceral_fat, bmr_kcal

Segmental lean (lbs per segment):
  right_arm_lbs, left_arm_lbs, trunk_lbs, right_leg_lbs, left_leg_lbs

Segmental fat (% per segment):
  right_arm_fat_pct, left_arm_fat_pct, trunk_fat_pct, right_leg_fat_pct, left_leg_fat_pct

Also include:
  "scan_type": device name from the scan header (e.g. "InBody 570", "DEXA")
  "scan_date": date shown on the scan in YYYY-MM-DD format, or null
  "interpretation": plain-English breakdown written directly to the client (not about them). Cover:
    1. What the overall body composition picture looks like right now
    2. The most meaningful number — what it tells them and whether it's good
    3. Anything to watch or be aware of (imbalances, visceral fat, fluid ratio)
    4. One specific thing the training should be targeting based on these results
    Keep it to 4-5 sentences. No jargon. No hedging. Direct and clear.

Return nothing except the JSON object.`,
              }
            ],
          }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      const { scan_type, scan_date, interpretation, ...metrics } = parsed;
      const entry = {
        id: Date.now(),
        date: scan_date || today(),
        scan_type: scan_type || "Body Scan",
        metrics,
        interpretation: interpretation || null,
        imageData: `data:${mediaType};base64,${base64}`,
      };
      setScans(prev => [entry, ...prev]);
      setExpanded(0);

    } catch (err) {
      console.error("Scan parse error:", err);
      setParseError("Couldn't read the scan automatically. Try a clearer photo or enter the numbers manually below.");
      // Still save the image so they can reference it
      const base64 = await new Promise((res) => {
        const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(file);
      }).catch(() => null);
      if (base64) {
        setScans(prev => [{ id: Date.now(), date: today(), scan_type: "Body Scan", metrics: {}, imageData: `data:${file.type};base64,${base64}` }, ...prev]);
        setExpanded(0);
      }
    }
    setUploading(false);
  }

  function updateMetric(scanId, key, val) {
    setScans(prev => prev.map(s => s.id === scanId ? { ...s, metrics: { ...s.metrics, [key]: val === "" ? undefined : parseFloat(val) } } : s));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Body Scans</div>
        <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ background: uploading ? "#999" : "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: uploading ? "wait" : "pointer", ...F }}>
          {uploading ? "Reading scan..." : "+ Upload scan"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
      </div>

      {parseError && (
        <div style={{ background: "#fff8f0", border: "1px solid #fcd34d", borderRadius: "7px", padding: "10px 13px", marginBottom: "10px", fontSize: "11px", color: "#92400e", lineHeight: "1.6" }}>
          {parseError}
        </div>
      )}

      <div style={{ background: "#f9f9f7", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 13px", marginBottom: "12px", fontSize: "10px", color: "#aaa", lineHeight: "1.6" }}>
        Upload a photo or PDF of your InBody or DEXA printout. Claude reads the scan and fills in all the numbers automatically.
      </div>

      {scans.length === 0 && !uploading && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#bbb", fontSize: "12px", lineHeight: "1.7", ...F }}>
          No scans yet. Upload your first InBody or DEXA result.
        </div>
      )}

      {scans.map((scan, si) => (
        <div key={scan.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", marginBottom: "10px", overflow: "hidden" }}>
          <button onClick={() => setExpanded(expanded === si ? null : si)} style={{ width: "100%", background: "none", border: "none", padding: "13px 15px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111" }}>{scan.scan_type}</div>
              <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                {new Date(scan.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                {scan.metrics?.body_fat_pct && ` · ${scan.metrics.body_fat_pct}% body fat`}
                {scan.metrics?.lean_mass_lbs && ` · ${scan.metrics.lean_mass_lbs} lbs lean mass`}
              </div>
            </div>
            <span style={{ color: "#ccc", fontSize: "11px" }}>{expanded === si ? "▲" : "▼"}</span>
          </button>

          {expanded === si && (
            <div style={{ padding: "0 15px 15px", borderTop: "1px solid #f5f5f3" }}>

              {/* AI interpretation */}
              {scan.interpretation && (
                <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "12px 14px", margin: "12px 0", lineHeight: "1.75", fontSize: "12px", color: "#444", ...F }}>
                  {scan.interpretation}
                </div>
              )}

              {/* Metrics grouped by section */}
              <div style={{ marginTop: "14px" }}>
                {METRIC_GROUPS.map(group => {
                  const groupVals = group.metrics.filter(m => scan.metrics?.[m.key] != null);
                  if (groupVals.length === 0) return null;
                  return (
                    <div key={group.group} style={{ marginBottom: "18px" }}>
                      {/* Group header */}
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>{group.group}</div>
                        <div style={{ fontSize: "10px", color: "#aaa", lineHeight: "1.5", ...F }}>{group.hint}</div>
                      </div>
                      {/* Metric cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                        {group.metrics.map(meta => {
                          const val = scan.metrics?.[meta.key];
                          const hasVal = val != null && val !== "";
                          return (
                            <div key={meta.key} style={{ background: hasVal ? "#fafaf8" : "#f5f5f5", borderRadius: "8px", padding: "10px 12px", border: hasVal ? "1px solid #ede9e4" : "1px solid #eee" }}>
                              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.07em", color: "#bbb", marginBottom: "5px" }}>{meta.label}</div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: "3px", marginBottom: "4px" }}>
                                <input
                                  type="number" inputMode="decimal"
                                  value={val ?? ""}
                                  onChange={e => updateMetric(scan.id, meta.key, e.target.value)}
                                  placeholder="—"
                                  style={{ width: "100%", border: "none", background: "transparent", fontSize: hasVal ? "17px" : "13px", fontWeight: hasVal ? "700" : "400", color: hasVal ? "#111" : "#ccc", padding: 0, outline: "none" }}
                                />
                                {hasVal && meta.unit && <span style={{ fontSize: "10px", color: "#bbb", flexShrink: 0 }}>{meta.unit}</span>}
                              </div>
                              <div style={{ fontSize: "9px", color: "#bbb", lineHeight: "1.5" }}>{meta.explain}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Show any metrics not yet entered */}
                {METRIC_GROUPS.every(g => g.metrics.every(m => scan.metrics?.[m.key] == null)) && (
                  <div style={{ textAlign: "center", padding: "20px", color: "#ccc", fontSize: "11px", lineHeight: "1.7", ...F }}>
                    No metrics extracted yet. Tap any field above to enter manually, or re-upload a clearer photo.
                  </div>
                )}
              </div>

              {/* Scan image thumbnail */}
              {scan.imageData && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ fontSize: "9px", color: "#ccc", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Original scan</div>
                  <img src={scan.imageData} alt="Body scan" style={{ maxWidth: "100%", borderRadius: "6px", border: "1px solid #e8e8e8" }} />
                </div>
              )}

              <button onClick={() => { setScans(prev => prev.filter(s => s.id !== scan.id)); if (expanded === si) setExpanded(null); }} style={{ marginTop: "12px", background: "none", border: "none", color: "#ddd", fontSize: "11px", cursor: "pointer", padding: 0 }}>
                Remove this scan
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// ── Daily health log section ──────────────────────────────────────────────────
function DailyHealthSection({ clientId }) {
  const [healthData, setHealthData] = useState(loadHealthData);
  const [editingDate, setEditingDate] = useState(today());
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = healthData[editingDate] || {};
    setForm({ steps: existing.steps || "", sleep_hours: existing.sleep_hours || "", sleep_quality: existing.sleep_quality || "", hrv: existing.hrv || existing.hrv_ms || "", resting_hr: existing.resting_hr || "", weight_lbs: existing.weight_lbs || "" });
  }, [editingDate, healthData]);

  // Load from Supabase on mount
  useEffect(() => {
    if (!clientId) return;
    import("../lib/supabase").then(async ({ getHealthLogs }) => {
      const { data } = await getHealthLogs(clientId, 30);
      if (data?.length > 0) {
        const byDate = {};
        data.forEach(row => {
          byDate[row.log_date] = { steps: row.steps, sleep_hours: row.sleep_hours, sleep_quality: row.sleep_quality, hrv: row.hrv_ms, resting_hr: row.resting_hr, weight_lbs: row.weight_lbs };
        });
        setHealthData(prev => ({ ...byDate, ...prev }));
      }
    }).catch(() => {});
  }, [clientId]);

  async function handleSave() {
    const updated = { ...healthData, [editingDate]: { ...form, logged_at: new Date().toISOString() } };
    setHealthData(updated);
    saveHealthData(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (clientId) {
      try {
        const { upsertHealthLog } = await import("../lib/supabase");
        await upsertHealthLog(clientId, editingDate, {
          steps: form.steps ? parseInt(form.steps) : null,
          sleep_hours: form.sleep_hours ? parseFloat(form.sleep_hours) : null,
          sleep_quality: form.sleep_quality ? parseInt(form.sleep_quality) : null,
          hrv_ms: form.hrv ? parseInt(form.hrv) : null,
          resting_hr: form.resting_hr ? parseInt(form.resting_hr) : null,
          weight_lbs: form.weight_lbs ? parseFloat(form.weight_lbs) : null,
        });
      } catch(e) { console.warn("Health log save failed:", e); }
    }
  }

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), ...healthData[key] };
  });

  const stepsToday = healthData[today()]?.steps;
  const sleepLastNight = healthData[today()]?.sleep_hours;
  const weightToday = healthData[today()]?.weight_lbs;

  // Get last 8 weight entries for mini sparkline
  const weightHistory = Object.entries(healthData)
    .filter(([, d]) => d.weight_lbs)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-8)
    .map(([date, d]) => ({ date, value: parseFloat(d.weight_lbs) }));

  const [showWeightInput, setShowWeightInput] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  function saveWeight(val) {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 50 || parsed > 600) return;
    const key = today();
    const updated = { ...healthData, [key]: { ...(healthData[key] || {}), weight_lbs: parsed } };
    setHealthData(updated);
    try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}
    if (clientId) {
      import("../lib/supabase").then(({ upsertHealthLog }) => {
        upsertHealthLog(clientId, key, { weight_lbs: parsed });
      });
    }
    setShowWeightInput(false);
    setWeightInput("");
  }

  return (
    <div>
      {/* Weight — top of Body tab, most prominent */}
      <div style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "10px", padding: "14px 16px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "4px" }}>Body Weight</div>
            {weightToday ? (
              <div style={{ fontSize: "26px", fontWeight: "700", color: "#111", lineHeight: 1 }}>
                {weightToday}
                <span style={{ fontSize: "12px", fontWeight: "normal", color: "#aaa", marginLeft: "4px" }}>lbs</span>
              </div>
            ) : (
              <div style={{ fontSize: "13px", color: "#aaa", marginTop: "4px" }}>Not logged today</div>
            )}
            {weightHistory.length >= 2 && (() => {
              const first = weightHistory[0].value;
              const last = weightHistory[weightHistory.length - 1].value;
              const diff = (last - first).toFixed(1);
              const label = weightHistory.length <= 2 ? "since start" : `last ${weightHistory.length} entries`;
              return (
                <div style={{ fontSize: "10px", color: diff < 0 ? "#2d7a1e" : diff > 0 ? "#a02020" : "#aaa", marginTop: "4px" }}>
                  {diff > 0 ? "+" : ""}{diff} lbs {label}
                </div>
              );
            })()}
          </div>
          <button
            onClick={() => { setShowWeightInput(p => !p); setWeightInput(weightToday ? String(weightToday) : ""); }}
            style={{ background: "#f9f9f7", border: "1px solid #e4e0db", borderRadius: "7px", padding: "7px 13px", fontSize: "11px", cursor: "pointer", color: "#555" }}
          >
            {weightToday ? "Update" : "Log weight"}
          </button>
        </div>

        {showWeightInput && (
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="number" inputMode="decimal"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveWeight(weightInput)}
              placeholder="e.g. 148.5"
              autoFocus
              style={{ flex: 1, padding: "9px 12px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "14px", color: "#111" }}
            />
            <span style={{ fontSize: "12px", color: "#aaa" }}>lbs</span>
            <button onClick={() => saveWeight(weightInput)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "9px 16px", fontSize: "12px", cursor: "pointer" }}>
              Save
            </button>
          </div>
        )}

        {/* Mini sparkline */}
        {weightHistory.length >= 3 && (
          <div style={{ marginTop: "12px", height: "30px" }}>
            {(() => {
              const vals = weightHistory.map(d => d.value);
              const min = Math.min(...vals); const max = Math.max(...vals);
              const range = max - min || 1;
              const W = 100; const H = 30;
              const pts = vals.map((v, i) => `${(i/(vals.length-1))*W},${H - ((v-min)/range)*(H-6) - 3}`).join(" ");
              return (
                <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke="#1d6fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  {vals.map((v, i) => {
                    const x = (i/(vals.length-1))*W;
                    const y = H - ((v-min)/range)*(H-6) - 3;
                    return <circle key={i} cx={x} cy={y} r={i===vals.length-1?"2.5":"1.5"} fill="#1d6fa8" />;
                  })}
                </svg>
              );
            })()}
          </div>
        )}
      </div>

      <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Daily Health Log</div>

      {/* Quick summary */}
      {(stepsToday || sleepLastNight) && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          {stepsToday && (
            <div style={{ flex: 1, background: stepsToday >= 10000 ? "#e8f5e9" : "#f9f9f7", borderRadius: "7px", padding: "9px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Steps</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: stepsToday >= 10000 ? "#2d7a1e" : "#c47a0a" }}>{parseInt(stepsToday).toLocaleString()}</div>
              <div style={{ fontSize: "9px", color: "#bbb" }}>goal: 10,000</div>
            </div>
          )}
          {sleepLastNight && (
            <div style={{ flex: 1, background: sleepLastNight >= 7.5 ? "#e8f5e9" : "#f9f9f7", borderRadius: "7px", padding: "9px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Sleep</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: sleepLastNight >= 7.5 ? "#2d7a1e" : "#c47a0a" }}>{sleepLastNight}h</div>
              <div style={{ fontSize: "9px", color: "#bbb" }}>goal: 8 hrs</div>
            </div>
          )}
        </div>
      )}

      {/* 7-day dots */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "12px" }}>
        {last7.map(d => {
          const hasData = d.steps || d.sleep_hours;
          const isToday = d.date === today();
          return (
            <div key={d.date} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "#bbb", marginBottom: "3px" }}>{d.label}</div>
              <div style={{ height: "6px", borderRadius: "3px", background: hasData ? "#1a1a1a" : "#f0f0f0" }} />
            </div>
          );
        })}
      </div>

      {/* Log form */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "10px", color: "#888" }}>Log entry</div>
          <input type="date" value={editingDate} onChange={e => setEditingDate(e.target.value)} style={{ padding: "4px 8px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "10px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
          {[["steps","Steps (goal: 10k)","10000"],["weight_lbs","Weight (lbs)",""],["sleep_hours","Sleep (hours)","7.5"],["sleep_quality","Sleep quality (1-10)",""],["hrv","HRV (ms)",""],["resting_hr","Resting HR (bpm)",""]].map(([key, label, placeholder]) => (
            <div key={key}>
              <div style={{ fontSize: "9px", color: "#888", marginBottom: "2px" }}>{label}</div>
              <input type="number" step="0.5" value={form[key] || ""} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                style={{ width: "100%", padding: "6px 8px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
            </div>
          ))}
        </div>
        <button onClick={handleSave} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 16px", fontSize: "11px", cursor: "pointer", ...F }}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── Main BodyTab ──────────────────────────────────────────────────────────────
export default function BodyTab({ clientId }) {
  const [section, setSection] = useState("weight");

  const SECTIONS = [
    { id: "weight", label: "Weight" },
    { id: "measurements", label: "Measurements" },
    { id: "health", label: "Health" },
    { id: "photos", label: "Photos" },
    { id: "scans", label: "Scans" },
  ];

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px" }}>
        {SECTIONS.map(({ id, label }) => (
          <button key={id} onClick={() => setSection(id)} style={{
            flex: 1, padding: "7px 4px", border: "1px solid " + (section === id ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "6px", background: section === id ? "#1a1a1a" : "#fff",
            color: section === id ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "11px", ...F,
          }}>{label}</button>
        ))}
      </div>

      {section === "weight" && <WeightSection clientId={clientId} />}
      {section === "measurements" && <MeasurementsSection clientId={clientId} />}
      {section === "photos" && <PhotosSection />}
      {section === "health" && (
        <HealthTab
          dailyHealth={(() => { try { return JSON.parse(localStorage.getItem("daily_health_v1") || "{}"); } catch { return {}; } })()}
          todayKey={new Date().toISOString().slice(0, 10)}
          onHealthUpdate={async (updated) => {
            try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}
            if (clientId) {
              const todayKey = new Date().toISOString().slice(0, 10);
              const todayData = updated[todayKey] || {};
              const { upsertHealthLog } = await import("../lib/supabase");
              await upsertHealthLog(clientId, todayKey, {
                sleep_hours: todayData.sleep_hours ? parseFloat(todayData.sleep_hours) : null,
                hrv_ms: todayData.hrv ? parseFloat(todayData.hrv) : null,
                resting_hr: todayData.resting_hr ? parseFloat(todayData.resting_hr) : null,
                weight_lbs: todayData.weight_lbs ? parseFloat(todayData.weight_lbs) : null,
                energy_level: todayData.energy_level ? parseInt(todayData.energy_level) : null,
              });
            }
          }}
          clientId={clientId}
        />
      )}
      {section === "scans" && <BodyScanSection clientId={clientId} />}
      {/* Health history summary — data logged from Plan tab */}
      {section === "measurements" && (() => {
        // Show last 7 days health strip if any data exists
        const loadedData = (() => { try { return JSON.parse(localStorage.getItem("health_data_v1") || "{}"); } catch { return {}; } })();
        const last7 = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (6 - i));
          const key = d.toISOString().slice(0, 10);
          return { label: d.toLocaleDateString("en-US", { weekday: "short" }), ...loadedData[key], date: key };
        });
        const hasAny = last7.some(d => d.logged || d.steps || d.sleep_hours);
        if (!hasAny) return null;
        return (
          <div style={{ marginTop: "16px", marginBottom: "4px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "8px" }}>Recent check-ins</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
              {last7.map((d, i) => {
                const hasData = d.logged || d.steps || d.sleep_hours;
                const energyColor = d.energy_level >= 7 ? "#2d7a1e" : d.energy_level >= 4 ? "#c47a0a" : d.energy_level ? "#a02020" : null;
                return (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "8px", color: "#bbb", marginBottom: "3px" }}>{d.label}</div>
                    <div style={{ height: "5px", borderRadius: "2px", background: hasData ? (energyColor || "#1a1a1a") : "#f0f0f0" }} />
                    {d.sleep_hours && <div style={{ fontSize: "8px", color: "#aaa", marginTop: "2px" }}>{d.sleep_hours}h</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
