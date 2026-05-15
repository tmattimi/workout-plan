import { useState } from "react";
import { formatDate, formatShortDate, today } from "../storage";

const METRICS = [
  { key: "weight", label: "Body Weight", unit: "lbs", color: "#2563a8", icon: "wt", group: "weight" },
  { key: "waist", label: "Waist", unit: "in", color: "#a02a2a", icon: "📏", group: "measurements" },
  { key: "chest", label: "Chest", unit: "in", color: "#2d7a1e", icon: "📏", group: "measurements" },
  { key: "hips", label: "Hips", unit: "in", color: "#7a3aa0", icon: "📏", group: "measurements" },
  { key: "rightThigh", label: "Right Thigh", unit: "in", color: "#c47a0a", icon: "📏", group: "measurements" },
  { key: "leftThigh", label: "Left Thigh", unit: "in", color: "#c47a0a", icon: "📏", group: "measurements", watchDiff: "rightThigh" },
  { key: "rightArm", label: "Right Arm", unit: "in", color: "#147a50", icon: "📏", group: "measurements" },
  { key: "leftArm", label: "Left Arm", unit: "in", color: "#147a50", icon: "📏", group: "measurements", watchDiff: "rightArm" },
];

// Baselines from intake
const BASELINES = {
  weight: 170, waist: 32.375, chest: 40.375, hips: 31.125,
  rightThigh: 22, leftThigh: 21.5, rightArm: 14.375, leftArm: 13.75,
};

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

function MiniSparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 0.1;
  const W = 80, H = 28;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const last = vals[vals.length - 1];
  const first = vals[0];
  const trending = last > first ? "#2d7a1e" : last < first ? "#a02a2a" : "#888";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: 80, height: 28 }}>
      <polyline points={pts} fill="none" stroke={trending} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * W} cy={H - ((last - min) / range) * (H - 4) - 2} r="2.5" fill={trending} />
    </svg>
  );
}

function BigChart({ data, metric, allData }) {
  if (!data || data.length === 0) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 0.5;
  const W = 300, H = 100;
  const pad = { l: 8, r: 8, t: 10, b: 20 };
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;

  const pts = data.map((d, i) => {
    const x = pad.l + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = pad.t + innerH - ((d.value - min) / range) * innerH;
    return { x, y, ...d };
  });

  // Add baseline dot
  const baseline = BASELINES[metric.key];

  // Compare first with diff partner for symmetry metrics
  const diffMetric = metric.watchDiff ? METRICS.find(m => m.key === metric.watchDiff) : null;
  const diffData = diffMetric ? allData.filter(d => d.metrics && d.metrics[diffMetric.key] != null).map(d => ({ date: d.date, value: parseFloat(d.metrics[diffMetric.key]) })).sort((a, b) => a.date.localeCompare(b.date)) : null;

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100 }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => {
          const y = pad.t + innerH - t * innerH;
          const val = min + t * range;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#f0f0f0" strokeWidth="1" />
              <text x={pad.l} y={y - 2} fontSize="7" fill="#ccc">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {/* Baseline marker */}
        {baseline && (
          <line
            x1={pad.l} y1={pad.t + innerH - ((baseline - min) / range) * innerH}
            x2={W - pad.r} y2={pad.t + innerH - ((baseline - min) / range) * innerH}
            stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3,3"
          />
        )}
        {/* Line */}
        <polyline
          points={pts.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={metric.color} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={metric.color} />
        ))}
        {/* Date labels (first and last) */}
        {data.length > 0 && (
          <>
            <text x={pad.l} y={H} fontSize="7" fill="#bbb">{formatShortDate(data[0].date)}</text>
            {data.length > 1 && (
              <text x={W - pad.r} y={H} fontSize="7" fill="#bbb" textAnchor="end">{formatShortDate(data[data.length - 1].date)}</text>
            )}
          </>
        )}
      </svg>
      {/* Symmetry comparison */}
      {diffMetric && diffData && diffData.length > 0 && data.length > 0 && (() => {
        const latestOwn = data[data.length - 1].value;
        const latestDiff = diffData[diffData.length - 1].value;
        const gap = Math.abs(latestOwn - latestDiff).toFixed(2);
        const baseGap = Math.abs(BASELINES[metric.key] - BASELINES[diffMetric.key]).toFixed(2);
        const improved = parseFloat(gap) < parseFloat(baseGap);
        return (
          <div style={{ marginTop: "6px", padding: "7px 10px", background: improved ? "#e8f5e9" : "#fff3e0", borderRadius: "6px", fontSize: "11px", color: improved ? "#2d7a1e" : "#c47a0a" }}>
            <strong>Symmetry gap:</strong> {gap}" (started at {baseGap}") — {improved ? "Gap is closing ✓" : "Keep going, gap unchanged"}
          </div>
        );
      })()}
    </div>
  );
}

export default function MeasurementsTracker({ measurements, onSave }) {
  const [view, setView] = useState("overview"); // overview | add | detail
  const [detailMetric, setDetailMetric] = useState(null);
  const [form, setForm] = useState(() => {
    const f = { date: today() };
    METRICS.forEach(m => { f[m.key] = ""; });
    return f;
  });
  const [saved, setSaved] = useState(false);

  function handleSubmit() {
    const entry = { date: form.date, metrics: {} };
    let hasData = false;
    METRICS.forEach(m => {
      if (form[m.key] !== "") {
        entry.metrics[m.key] = parseFloat(form[m.key]);
        hasData = true;
      }
    });
    if (!hasData) return;
    const updated = [...measurements.filter(e => e.date !== entry.date), entry].sort((a, b) => a.date.localeCompare(b.date));
    onSave(updated);
    setSaved(true);
    setTimeout(() => { setSaved(false); setView("overview"); }, 1200);
  }

  // Get latest values for each metric
  function getLatest(key) {
    for (let i = measurements.length - 1; i >= 0; i--) {
      const v = measurements[i].metrics?.[key];
      if (v != null) return { value: v, date: measurements[i].date };
    }
    return null;
  }

  function getSeriesForMetric(key) {
    return measurements
      .filter(m => m.metrics?.[key] != null)
      .map(m => ({ date: m.date, value: parseFloat(m.metrics[key]) }));
  }

  // Detail view
  if (view === "detail" && detailMetric) {
    const series = getSeriesForMetric(detailMetric.key);
    const latest = series[series.length - 1];
    const baseline = BASELINES[detailMetric.key];
    const change = latest ? (latest.value - baseline).toFixed(2) : null;
    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <button onClick={() => setView("overview")} style={{ background: "none", border: "none", color: detailMetric.color, fontSize: "13px", cursor: "pointer", marginBottom: "12px", ...F }}>
          ← Back
        </button>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "4px" }}>{detailMetric.label}</div>
        <div style={{ fontSize: "11px", color: "#999", marginBottom: "16px" }}>All recorded measurements</div>

        {series.length >= 2 && (
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "10px" }}>Trend</div>
            <BigChart data={series} metric={detailMetric} allData={measurements} />
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {[
            ["Current", latest ? `${latest.value} ${detailMetric.unit}` : "—"],
            ["Baseline", `${baseline} ${detailMetric.unit}`],
            ["Change", change !== null ? `${parseFloat(change) >= 0 ? "+" : ""}${change} ${detailMetric.unit}` : "—"],
          ].map(([label, val]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: "3px" }}>{label}</div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: label === "Change" && change !== null ? (parseFloat(change) > 0 ? "#2d7a1e" : parseFloat(change) < 0 ? "#a02a2a" : "#888") : "#1a1a1a" }}>{val}</div>
            </div>
          ))}
        </div>

        {/* All entries */}
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", overflow: "hidden" }}>
          <div style={{ padding: "10px 13px", borderBottom: "1px solid #f0f0f0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa" }}>
            All Entries
          </div>
          {[...series].reverse().map((s, i) => {
            const prev = series[series.length - 1 - i - 1];
            const diff = prev ? (s.value - prev.value) : null;
            return (
              <div key={i} style={{ padding: "10px 13px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#555" }}>{formatDate(s.date)}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700" }}>{s.value} {detailMetric.unit}</span>
                  {diff !== null && (
                    <span style={{ fontSize: "10px", color: diff > 0 ? "#2d7a1e" : diff < 0 ? "#a02a2a" : "#888", marginLeft: "8px" }}>
                      {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {series.length === 0 && (
            <div style={{ padding: "20px", textAlign: "center", color: "#bbb", fontSize: "12px" }}>No entries yet</div>
          )}
        </div>
      </div>
    );
  }

  // Add entry view
  if (view === "add") {
    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <button onClick={() => setView("overview")} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "12px", ...F }}>
          ← Back
        </button>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "4px" }}>Log Measurements</div>
        <div style={{ fontSize: "11px", color: "#999", marginBottom: "16px" }}>Fill in only the measurements you took. Leave the rest blank.</div>

        <div style={{ background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "5px" }}>Date</div>
            <input
              type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}
            />
          </div>

          {["weight", "measurements"].map(group => (
            <div key={group}>
              <div style={{ padding: "8px 14px 4px", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", background: "#f9f9f7" }}>
                {group === "weight" ? "Body Weight" : "Measurements"}
              </div>
              {METRICS.filter(m => m.group === group).map(metric => (
                <div key={metric.key} style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "12px", fontWeight: "500" }}>{metric.label}</div>
                    {metric.watchDiff && (
                      <div style={{ fontSize: "10px", color: "#c47a0a" }}>Track for symmetry</div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      type="number" inputMode="decimal"
                      placeholder="—"
                      value={form[metric.key]}
                      onChange={e => setForm(f => ({ ...f, [metric.key]: e.target.value }))}
                      style={{ width: "72px", padding: "7px 8px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", textAlign: "center", ...F }}
                    />
                    <span style={{ fontSize: "11px", color: "#aaa" }}>{metric.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "14px", background: saved ? "#2d7a1e" : "#111",
            color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px",
            cursor: "pointer", ...F, transition: "background 0.2s",
          }}
        >
          {saved ? "✓ Saved" : "Save Entry"}
        </button>
      </div>
    );
  }

  // Overview
  const hasData = measurements.length > 0;

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>Body Tracker</div>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>Measurements</div>
        </div>
        <button
          onClick={() => setView("add")}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}
        >
          + Log
        </button>
      </div>

      {!hasData && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", borderRadius: "8px", border: "1px solid #e8e8e8" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📏</div>
          <div style={{ fontSize: "14px", color: "#555", marginBottom: "6px" }}>No measurements logged yet</div>
          <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6" }}>
            Log monthly to track your recomp progress. The symmetry tracking will show the arm and thigh gaps closing over time.
          </div>
        </div>
      )}

      {hasData && (
        <>
          {/* Last logged date */}
          <div style={{ fontSize: "11px", color: "#999", marginBottom: "14px" }}>
            Last entry: {formatDate(measurements[measurements.length - 1].date)}
          </div>

          {/* Weight card */}
          {(() => {
            const series = getSeriesForMetric("weight");
            const latest = getLatest("weight");
            if (!latest) return null;
            const change = (latest.value - BASELINES.weight).toFixed(1);
            return (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "2px" }}>Body Weight</div>
                    <div style={{ fontSize: "26px", fontWeight: "700", color: "#2563a8" }}>{latest.value} <span style={{ fontSize: "14px", fontWeight: "normal", color: "#aaa" }}>lbs</span></div>
                    <div style={{ fontSize: "11px", color: parseFloat(change) > 0 ? "#2d7a1e" : "#a02a2a" }}>
                      {parseFloat(change) >= 0 ? "+" : ""}{change} lbs from baseline · Target: 185 lbs
                    </div>
                  </div>
                  <div>
                    {/* Progress toward goal */}
                    <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", textAlign: "right", marginBottom: "4px" }}>Progress to 185</div>
                    <div style={{ width: "100px", height: "8px", background: "#f0f0f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: "4px", background: "#2563a8",
                        width: `${Math.min(100, Math.max(0, ((latest.value - 170) / (185 - 170)) * 100))}%`
                      }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "#aaa", textAlign: "right", marginTop: "2px" }}>
                      {(185 - latest.value).toFixed(1)} lbs to go
                    </div>
                  </div>
                </div>
                {series.length >= 2 && (
                  <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                    <BigChart data={series} metric={METRICS[0]} allData={measurements} />
                  </div>
                )}
              </div>
            );
          })()}

          {/* Symmetry alert */}
          {(() => {
            const la = getLatest("leftArm"), ra = getLatest("rightArm");
            const lt = getLatest("leftThigh"), rt = getLatest("rightThigh");
            const armGap = la && ra ? Math.abs(ra.value - la.value).toFixed(2) : null;
            const thighGap = lt && rt ? Math.abs(rt.value - lt.value).toFixed(2) : null;
            const baseArmGap = (BASELINES.rightArm - BASELINES.leftArm).toFixed(2);
            const baseThighGap = (BASELINES.rightThigh - BASELINES.leftThigh).toFixed(2);
            if (!armGap && !thighGap) return null;
            return (
              <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", color: "#c47a0a", marginBottom: "6px" }}>Symmetry Tracking</div>
                {armGap && (
                  <div style={{ fontSize: "11px", color: "#7a5010", marginBottom: "3px" }}>
                    Arms: {armGap}" gap (started {baseArmGap}") {parseFloat(armGap) < parseFloat(baseArmGap) ? "✓ improving" : "→ keep going"}
                  </div>
                )}
                {thighGap && (
                  <div style={{ fontSize: "11px", color: "#7a5010" }}>
                    Thighs: {thighGap}" gap (started {baseThighGap}") {parseFloat(thighGap) < parseFloat(baseThighGap) ? "✓ improving" : "→ keep going"}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Measurement cards grid */}
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "10px", marginTop: "4px" }}>
            All Measurements
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {METRICS.filter(m => m.key !== "weight").map(metric => {
              const series = getSeriesForMetric(metric.key);
              const latest = series[series.length - 1];
              const baseline = BASELINES[metric.key];
              const change = latest ? (latest.value - baseline).toFixed(2) : null;
              return (
                <button
                  key={metric.key}
                  onClick={() => { setDetailMetric(metric); setView("detail"); }}
                  style={{
                    background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px",
                    padding: "12px", textAlign: "left", cursor: "pointer", ...F,
                  }}
                >
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: "3px" }}>{metric.label}</div>
                  {latest ? (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: metric.color }}>{latest.value}"</div>
                      <div style={{ fontSize: "10px", color: change !== null && parseFloat(change) !== 0 ? (parseFloat(change) > 0 ? "#2d7a1e" : "#a02a2a") : "#aaa" }}>
                        {change !== null ? `${parseFloat(change) >= 0 ? "+" : ""}${change}"` : "—"}
                      </div>
                      <div style={{ marginTop: "6px" }}>
                        <MiniSparkline data={series} color={metric.color} />
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "12px", color: "#ccc", marginTop: "4px" }}>Not logged</div>
                  )}
                  {metric.watchDiff && (
                    <div style={{ fontSize: "9px", color: "#c47a0a", marginTop: "2px" }}>symmetry</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Entry history */}
          {measurements.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "10px" }}>Entry History</div>
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", overflow: "hidden" }}>
                {[...measurements].reverse().slice(0, 6).map((entry, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#555" }}>{formatDate(entry.date)}</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {entry.metrics?.weight && (
                        <span style={{ fontSize: "10px", background: "#e9f0fb", color: "#2563a8", padding: "2px 7px", borderRadius: "20px" }}>{entry.metrics.weight} lbs</span>
                      )}
                      {Object.entries(entry.metrics || {}).filter(([k]) => k !== "weight").slice(0, 2).map(([k, v]) => (
                        <span key={k} style={{ fontSize: "10px", background: "#f5f5f3", color: "#555", padding: "2px 7px", borderRadius: "20px" }}>{METRICS.find(m => m.key === k)?.label}: {v}"</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
