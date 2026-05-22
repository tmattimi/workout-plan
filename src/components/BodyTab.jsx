import { useState, useEffect, useRef } from "react";
import HealthTab from "./HealthTab";

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
        <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px", ...F }}>No measurements logged yet.</div>
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
          <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>No photos yet.</div>
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
function BodyScanSection() {
  const [scans, setScans] = useState(loadScans);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const fileRef = useRef();

  useEffect(() => { saveScans(scans); }, [scans]);

  const METRIC_LABELS = {
    weight_lbs: { label: "Body Weight", unit: "lbs", explain: "Total weight including muscle, fat, bone, and water." },
    body_fat_pct: { label: "Body Fat", unit: "%", explain: "Percentage of total weight that is fat. Active women typically range from 18 to 28%." },
    lean_mass_lbs: { label: "Lean Mass", unit: "lbs", explain: "Everything that is not fat — muscle, bone, organs, water. Training builds this." },
    fat_mass_lbs: { label: "Fat Mass", unit: "lbs", explain: "Total weight of fat tissue." },
    bmr_kcal: { label: "Resting Metabolic Rate", unit: "kcal", explain: "Calories burned at rest. Higher lean mass means a higher BMR." },
    visceral_fat: { label: "Visceral Fat Rating", unit: "", explain: "Fat stored around internal organs. Under 10 is healthy for most people." },
  };

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
    const mediaType = file.type || "image/jpeg";
    try {
      // Image analysis requires vision AI — enter metrics manually below
      const entry = { id: Date.now(), date: today(), scan_type: "Scan", metrics: {}, imageData: `data:${mediaType};base64,${base64}` };
      const updated = [entry, ...scans];
      setScans(updated);
    } catch {}
    setUploading(false);
    fileRef.current.value = "";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Body Scans</div>
        <button onClick={() => fileRef.current.click()} disabled={uploading} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
          {uploading ? "Reading..." : "+ Upload scan"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
      </div>

      <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "6px", padding: "9px 12px", marginBottom: "10px", fontSize: "10px", color: "#7a5010", lineHeight: "1.55" }}>
        InBody and similar devices vary by 3 to 5% based on hydration and timing. Use for trends, not exact numbers.
      </div>

      {scans.length === 0 && !uploading && (
        <div style={{ textAlign: "center", padding: "16px", color: "#bbb", fontSize: "12px" }}>Upload a photo of your InBody or DEXA printout — the app will extract all the numbers automatically.</div>
      )}

      {scans.map((scan, si) => (
        <div key={scan.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", marginBottom: "7px", overflow: "hidden" }}>
          <button onClick={() => setExpanded(expanded === si ? null : si)} style={{ width: "100%", background: "none", border: "none", padding: "11px 13px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600" }}>{scan.scan_type} · {scan.date}</div>
              {scan.metrics?.body_fat_pct && <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>{scan.metrics.body_fat_pct}% body fat · {scan.metrics.lean_mass_lbs ? `${scan.metrics.lean_mass_lbs} lbs lean mass` : ""}</div>}
            </div>
            <span style={{ color: "#ccc", fontSize: "11px" }}>{expanded === si ? "▲" : "▼"}</span>
          </button>
          {expanded === si && (
            <div style={{ padding: "0 13px 13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                  const val = scan.metrics?.[key];
                  if (val == null) return null;
                  return (
                    <div key={key} style={{ background: "#f9f9f7", borderRadius: "5px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "2px" }}>{meta.label}</div>
                      <div style={{ fontSize: "15px", fontWeight: "700" }}>{val}{meta.unit}</div>
                      <div style={{ fontSize: "9px", color: "#aaa", marginTop: "2px", lineHeight: "1.4" }}>{meta.explain}</div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { const u = scans.filter(s => s.id !== scan.id); setScans(u); }} style={{ marginTop: "8px", background: "none", border: "none", color: "#e0e0e0", fontSize: "11px", cursor: "pointer" }}>Remove</button>
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
  const [section, setSection] = useState("measurements");

  const SECTIONS = [
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
      {section === "scans" && <BodyScanSection />}
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
