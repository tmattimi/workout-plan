import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
const C = {
  bg: "#f7f6f3", dark: "#111", mid: "#555", muted: "#aaa",
  border: "#e4e0db", green: "#2d7a1e", amber: "#c47a0a",
  red: "#a02020", blue: "#2563a8", card: "#fff",
};

// ── Formatting ─────────────────────────────────────────────────────────────────
function fmt(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}
function fmtShort(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function delta(a, b, decimals = 1) {
  if (a == null || b == null) return null;
  return parseFloat((b - a).toFixed(decimals));
}
function filterByRange(pts, days) {
  if (!days) return pts;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return pts.filter(p => p.date >= cutoffStr);
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton({ h = 16, w = "100%", radius = 6, mb = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: radius, marginBottom: mb,
      background: "linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}
function SkeletonCard() {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 10 }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <Skeleton h={14} w="40%" mb={12} />
      <Skeleton h={32} w="60%" mb={8} />
      <Skeleton h={90} mb={0} />
    </div>
  );
}

// ── Interactive SVG Line Chart with tap tooltips ───────────────────────────────
function LineChart({ series, height = 120, goalValue, goalLabel, rangeLabel }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, date, values }
  const svgRef = useRef(null);

  if (!series || series.length === 0) return null;
  const allPoints = series.flatMap(s => s.data);
  if (allPoints.length < 2) return null;

  const allValues = allPoints.map(p => p.v);
  if (goalValue != null) allValues.push(goalValue);
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const range = maxV - minV || 1;

  const W = 300;
  const H = height;
  const PAD = { t: 10, b: 26, l: 6, r: 6 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  const allDates = [...new Set(allPoints.map(p => p.date))].sort();
  const toX = d => PAD.l + (allDates.indexOf(d) / Math.max(allDates.length - 1, 1)) * cW;
  const toY = v => PAD.t + cH - ((v - minV) / range) * cH;
  const COLORS = [C.blue, C.green, C.amber, C.red, "#7c3aed", "#0891b2"];

  function handleInteraction(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = ((clientX - rect.left) / rect.width) * W;
    // Find nearest date index
    const idx = Math.round(((relX - PAD.l) / cW) * (allDates.length - 1));
    const clamped = Math.max(0, Math.min(allDates.length - 1, idx));
    const date = allDates[clamped];
    const x = toX(date);
    // Gather values for this date from all series
    const values = series.map((s, si) => {
      const pt = s.data.find(p => p.date === date);
      return pt ? { label: s.label, v: pt.v, color: s.color || COLORS[si % COLORS.length] } : null;
    }).filter(Boolean);
    if (values.length === 0) return;
    const y = toY(values[0].v);
    setTooltip({ x, y, date, values });
  }

  function clearTooltip() { setTooltip(null); }

  return (
    <div style={{ position: "relative", touchAction: "pan-y" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
        onMouseMove={handleInteraction}
        onMouseLeave={clearTooltip}
        onTouchStart={handleInteraction}
        onTouchMove={handleInteraction}
        onTouchEnd={clearTooltip}
      >
        {/* Goal line */}
        {goalValue != null && (
          <>
            <line x1={PAD.l} y1={toY(goalValue)} x2={W - PAD.r} y2={toY(goalValue)}
              stroke={C.red} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" />
            <text x={W - PAD.r - 2} y={toY(goalValue) - 4} textAnchor="end"
              fontSize="7" fill={C.red} opacity="0.85">{goalLabel || "Goal"}</text>
          </>
        )}

        {/* Series */}
        {series.map((s, si) => {
          const pts = [...s.data].sort((a, b) => a.date.localeCompare(b.date));
          if (pts.length < 2) return null;
          const color = s.color || COLORS[si % COLORS.length];
          const polyline = pts.map(p => `${toX(p.date)},${toY(p.v)}`).join(" ");
          const area = `${toX(pts[0].date)},${H - PAD.b} ${polyline} ${toX(pts[pts.length - 1].date)},${H - PAD.b}`;
          return (
            <g key={si}>
              {s.fill && <polygon points={area} fill={color} opacity="0.07" />}
              <polyline points={polyline} fill="none" stroke={color}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={toX(p.date)} cy={toY(p.v)}
                  r={i === pts.length - 1 ? 3.5 : 1.8}
                  fill={i === pts.length - 1 ? color : "#fff"}
                  stroke={color} strokeWidth="1.5" />
              ))}
            </g>
          );
        })}

        {/* Tooltip crosshair */}
        {tooltip && (
          <line x1={tooltip.x} y1={PAD.t} x2={tooltip.x} y2={H - PAD.b}
            stroke="#999" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
        )}

        {/* X axis labels */}
        {allDates.length >= 2 && (
          <>
            <text x={PAD.l} y={H - 2} textAnchor="start" fontSize="8" fill={C.muted}>
              {fmtShort(allDates[0])}
            </text>
            <text x={W - PAD.r} y={H - 2} textAnchor="end" fontSize="8" fill={C.muted}>
              {fmtShort(allDates[allDates.length - 1])}
            </text>
          </>
        )}
      </svg>

      {/* Floating tooltip bubble */}
      {tooltip && (
        <div style={{
          position: "absolute",
          top: 4,
          left: `clamp(0px, calc(${(tooltip.x / W) * 100}% - 56px), calc(100% - 112px))`,
          background: C.dark,
          color: "#fff",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 11,
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 90,
          boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
          ...F,
        }}>
          <div style={{ fontSize: 9, color: "#aaa", marginBottom: 3 }}>{fmtShort(tooltip.date)}</div>
          {tooltip.values.map((v, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {tooltip.values.length > 1 && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 13 }}>{v.v}</span>
              {v.label && tooltip.values.length > 1 && (
                <span style={{ fontSize: 9, color: "#888" }}>{v.label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Time range filter bar ──────────────────────────────────────────────────────
const RANGES = [
  { label: "4W", days: 28 },
  { label: "8W", days: 56 },
  { label: "12W", days: 84 },
  { label: "6M", days: 182 },
  { label: "All", days: null },
];

function RangeBar({ selected, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {RANGES.map(r => {
        const active = selected === r.days;
        return (
          <button key={r.label} onClick={() => onChange(r.days)} style={{
            ...F, fontSize: 12, padding: "5px 12px", borderRadius: 20,
            border: `1px solid ${active ? C.dark : C.border}`,
            background: active ? C.dark : C.card,
            color: active ? "#fff" : C.mid,
            cursor: "pointer", fontWeight: active ? 600 : 400,
            transition: "all 0.15s",
          }}>
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Change pill ────────────────────────────────────────────────────────────────
function Change({ value, unit = "", lowerIsBetter = false }) {
  if (value == null) return null;
  const good = lowerIsBetter ? value < 0 : value > 0;
  const neutral = value === 0;
  const color = neutral ? C.muted : good ? C.green : C.red;
  const arrow = neutral ? "→" : value > 0 ? "↑" : "↓";
  return (
    <span style={{ fontSize: 11, color, fontWeight: 600 }}>
      {arrow} {Math.abs(value)}{unit}
    </span>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({ title, sub, children, isEmpty, emptyMsg, emptyDetail }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2, color: C.muted, marginBottom: 2 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.5 }}>{sub}</div>}
      </div>
      {isEmpty ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "20px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, color: C.mid, ...F, marginBottom: emptyDetail ? 6 : 0 }}>{emptyMsg || "No data yet."}</div>
          {emptyDetail && <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{emptyDetail}</div>}
        </div>
      ) : children}
    </div>
  );
}

// ── Metric row ─────────────────────────────────────────────────────────────────
function MetricRow({ label, first, last, unit = "", lowerIsBetter = false }) {
  const d = delta(first, last);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
      <span style={{ fontSize: 13, color: C.mid, ...F }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        {first != null && last != null && first !== last && (
          <span style={{ fontSize: 11, color: C.muted }}>{first}{unit} →</span>
        )}
        <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, ...F }}>
          {last != null ? `${last}${unit}` : "—"}
        </span>
        <Change value={d} unit={unit} lowerIsBetter={lowerIsBetter} />
      </div>
    </div>
  );
}

// ── Strength drill-down ────────────────────────────────────────────────────────
function StrengthCard({ name, pts, rangeDays }) {
  const [expanded, setExpanded] = useState(false);
  const filtered = filterByRange(pts, rangeDays);
  if (filtered.length < 2) return null;

  const first = filtered[0].v;
  const last = filtered[filtered.length - 1].v;
  const d = delta(first, last);
  const max = Math.max(...filtered.map(p => p.v));
  const color = d > 0 ? C.green : d < 0 ? C.red : C.muted;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Header — tappable */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.dark, ...F }}>{name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {filtered.length} sessions · best {max} lbs
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{last} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>lbs</span></div>
            <Change value={d} unit=" lbs" />
          </div>
          <span style={{ fontSize: 16, color: C.muted, marginLeft: 4 }}>{expanded ? "↑" : "↓"}</span>
        </div>
      </button>

      {/* Chart — always visible */}
      <div style={{ padding: "0 16px 12px" }}>
        <LineChart
          series={[{ data: filtered, color, fill: true }]}
          height={80}
        />
      </div>

      {/* Expanded session history */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          <div style={{ padding: "8px 16px 4px", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: C.muted }}>
            Session history
          </div>
          {[...filtered].reverse().slice(0, 12).map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 12, color: C.mid }}>{fmtShort(p.date)}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{p.v} lbs</span>
            </div>
          ))}
          {filtered.length > 12 && (
            <div style={{ padding: "8px 16px", fontSize: 11, color: C.muted, textAlign: "center" }}>
              + {filtered.length - 12} earlier sessions
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Data fetching ──────────────────────────────────────────────────────────────
async function fetchAll(clientId) {
  const [measRes, logsRes, goalsRes] = await Promise.all([
    supabase.from("measurements").select("*").eq("client_id", clientId).order("measured_at", { ascending: true }),
    supabase.from("workout_logs")
      .select("exercise_name, weight_lbs, reps, session_date, completed, is_pr")
      .eq("client_id", clientId).eq("completed", true)
      .not("weight_lbs", "is", null)
      .order("session_date", { ascending: true }).limit(2000),
    supabase.from("client_goals").select("*").eq("client_id", clientId).eq("completed", false),
  ]);
  return {
    measurements: measRes.data || [],
    logs: logsRes.data || [],
    goals: goalsRes.data || [],
  };
}

// ── Strength aggregation ───────────────────────────────────────────────────────
const KEY_EXERCISES = [
  "Hip Thrust", "Romanian Deadlift", "Leg Press", "Lat Pulldown",
  "Dumbbell Bench Press", "Seated Dumbbell Overhead Press",
  "Bulgarian Split Squat", "Pull-Up", "Barbell Back Squat", "Deadlift",
];

function buildStrengthHistory(logs) {
  const byExercise = {};
  logs.forEach(log => {
    if (!log.exercise_name || !log.weight_lbs || !log.session_date) return;
    const matched = KEY_EXERCISES.find(k =>
      log.exercise_name.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(log.exercise_name.toLowerCase())
    );
    const key = matched || log.exercise_name;
    if (!byExercise[key]) byExercise[key] = {};
    const w = parseFloat(log.weight_lbs);
    if (!byExercise[key][log.session_date] || w > byExercise[key][log.session_date])
      byExercise[key][log.session_date] = w;
  });
  return Object.entries(byExercise)
    .map(([name, byDate]) => ({
      name,
      pts: Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, v })),
    }))
    .filter(e => e.pts.length >= 3)
    .sort((a, b) => b.pts.length - a.pts.length)
    .slice(0, 8);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ProgressDashboard({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rangeDays, setRangeDays] = useState(null); // null = all time

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    fetchAll(clientId)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [clientId]);

  if (loading) return (
    <div style={{ padding: "4px 0 60px" }}>
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 60, borderRadius: 10, background: "linear-gradient(90deg,#eee 25%,#f5f5f5 50%,#eee 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />)}
      </div>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );

  if (error) return (
    <div style={{ padding: "24px 0", color: C.red, fontSize: 13, ...F }}>
      Could not load data: {error}
    </div>
  );
  if (!data) return null;

  const { measurements, logs, goals } = data;

  // ── Apply range filter ────────────────────────────────────────────────────
  const cutoffStr = rangeDays
    ? new Date(Date.now() - rangeDays * 864e5).toISOString().slice(0, 10)
    : null;
  const filteredMeas = cutoffStr
    ? measurements.filter(m => m.measured_at >= cutoffStr)
    : measurements;
  const filteredLogs = cutoffStr
    ? logs.filter(l => l.session_date >= cutoffStr)
    : logs;

  // ── Weight ────────────────────────────────────────────────────────────────
  const weightPts = filteredMeas.filter(m => m.weight_lbs)
    .map(m => ({ date: m.measured_at, v: parseFloat(m.weight_lbs) }));
  const firstWeight = weightPts[0]?.v;
  const lastWeight = weightPts[weightPts.length - 1]?.v;
  const goalWeight = goals.find(g => g.type === "bodyweight")?.target_value;

  // ── Measurements ──────────────────────────────────────────────────────────
  const firstMeas = filteredMeas[0];
  const lastMeas = filteredMeas[filteredMeas.length - 1];
  const measSeries = [
    { key: "waist_in",       label: "Waist",      color: C.amber,   lowerIsBetter: true  },
    { key: "hips_in",        label: "Hips",       color: C.blue,    lowerIsBetter: true  },
    { key: "right_thigh_in", label: "R Thigh",    color: C.green,   lowerIsBetter: false },
    { key: "left_thigh_in",  label: "L Thigh",    color: "#7c3aed", lowerIsBetter: false },
    { key: "right_arm_in",   label: "R Arm",      color: "#0891b2", lowerIsBetter: false },
    { key: "left_arm_in",    label: "L Arm",      color: "#db2777", lowerIsBetter: false },
    { key: "body_fat_pct",   label: "Body Fat",   color: C.red,     lowerIsBetter: true, unit: "%" },
    { key: "chest_in",       label: "Chest",      color: "#64748b", lowerIsBetter: false },
  ].filter(m => measurements.some(row => row[m.key] != null));

  // ── Strength ──────────────────────────────────────────────────────────────
  const strengthHistory = buildStrengthHistory(filteredLogs);

  // ── Header stats ──────────────────────────────────────────────────────────
  const totalPRs = filteredLogs.filter(l => l.is_pr).length;
  const totalSessions = new Set(filteredLogs.map(l => l.session_date)).size;

  return (
    <div style={{ ...F, padding: "4px 0 60px" }}>

      {/* ── Time range filter ── */}
      <RangeBar selected={rangeDays} onChange={setRangeDays} />

      {/* ── Header stats ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { label: "Sessions", value: totalSessions },
          { label: "PRs hit", value: totalPRs },
          { label: "Check-ins", value: filteredMeas.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.dark }}>{value}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Body Weight ── */}
      <Section
        title="Body Weight"
        isEmpty={weightPts.length < 2}
        emptyMsg="No weight data for this period"
        emptyDetail={rangeDays ? "Try expanding the time range, or log your weight in the Body tab." : "Log your weight in the Body tab to see your trend here."}
      >
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: C.dark, letterSpacing: "-0.5px" }}>
                {lastWeight} <span style={{ fontSize: 14, color: C.muted, fontWeight: 400 }}>lbs</span>
              </div>
              {firstWeight != null && firstWeight !== lastWeight && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <Change value={delta(firstWeight, lastWeight)} unit=" lbs" lowerIsBetter />
                  <span style={{ fontSize: 11, color: C.muted }}>since {fmtShort(weightPts[0].date)}</span>
                </div>
              )}
            </div>
            {goalWeight && (
              <div style={{ textAlign: "right", background: "#fff0f0", border: `1px solid #fcc`, borderRadius: 8, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Goal</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>{goalWeight} lbs</div>
                <div style={{ fontSize: 11, color: C.muted }}>{Math.abs(lastWeight - goalWeight).toFixed(1)} to go</div>
              </div>
            )}
          </div>
          <LineChart
            series={[{ data: weightPts, color: C.dark, fill: true }]}
            height={110}
            goalValue={goalWeight}
            goalLabel={`Goal ${goalWeight} lbs`}
          />
          <div style={{ fontSize: 10, color: C.muted, marginTop: 8, textAlign: "center" }}>
            Tap or hover the chart to see values
          </div>
        </div>
      </Section>

      {/* ── Body Measurements ── */}
      <Section
        title="Body Measurements"
        sub="All measurements in inches unless noted."
        isEmpty={measSeries.length === 0 || filteredMeas.length === 0}
        emptyMsg="No measurements for this period"
        emptyDetail="Log measurements in the Body tab, or expand the time range."
      >
        {/* Waist & hips chart */}
        {measSeries.filter(s => ["waist_in", "hips_in"].includes(s.key)).length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Waist & Hips
            </div>
            <LineChart
              height={100}
              series={measSeries.filter(s => ["waist_in", "hips_in"].includes(s.key)).map(s => ({
                data: filteredMeas.filter(m => m[s.key]).map(m => ({ date: m.measured_at, v: parseFloat(m[s.key]) })),
                color: s.color, label: s.label, fill: false,
              }))}
            />
            <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
              {measSeries.filter(s => ["waist_in", "hips_in"].includes(s.key)).map(s => (
                <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 2, background: s.color, borderRadius: 1 }} />
                  <span style={{ fontSize: 10, color: C.muted }}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 6, textAlign: "center" }}>
              Tap or hover to see values
            </div>
          </div>
        )}

        {/* Metric rows */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "4px 16px" }}>
          {measSeries.map(s => (
            <MetricRow
              key={s.key}
              label={s.label}
              first={firstMeas?.[s.key] ? parseFloat(firstMeas[s.key]) : null}
              last={lastMeas?.[s.key] ? parseFloat(lastMeas[s.key]) : null}
              unit={s.unit || " in"}
              lowerIsBetter={s.lowerIsBetter}
            />
          ))}
          {firstMeas && lastMeas && (
            <div style={{ fontSize: 10, color: C.muted, padding: "10px 0 6px" }}>
              {fmt(firstMeas.measured_at)} → {fmt(lastMeas.measured_at)}
            </div>
          )}
        </div>

        {/* Arm asymmetry */}
        {lastMeas?.right_arm_in && lastMeas?.left_arm_in && (() => {
          const diff = Math.abs(parseFloat(lastMeas.right_arm_in) - parseFloat(lastMeas.left_arm_in)).toFixed(2);
          if (parseFloat(diff) < 0.1) return null;
          const larger = parseFloat(lastMeas.right_arm_in) > parseFloat(lastMeas.left_arm_in) ? "right" : "left";
          return (
            <div style={{ background: "#fff9eb", border: "1px solid #f0d080", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
              <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 2 }}>⚠️ Arm Asymmetry</div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
                {larger.charAt(0).toUpperCase() + larger.slice(1)} arm is {diff}" larger. Monitor with single-arm exercises.
              </div>
            </div>
          );
        })()}

        {/* Thigh asymmetry */}
        {lastMeas?.right_thigh_in && lastMeas?.left_thigh_in && (() => {
          const diff = Math.abs(parseFloat(lastMeas.right_thigh_in) - parseFloat(lastMeas.left_thigh_in)).toFixed(2);
          if (parseFloat(diff) < 0.1) return null;
          const larger = parseFloat(lastMeas.right_thigh_in) > parseFloat(lastMeas.left_thigh_in) ? "right" : "left";
          return (
            <div style={{ background: "#fff9eb", border: "1px solid #f0d080", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
              <div style={{ fontSize: 12, color: C.amber, fontWeight: 600, marginBottom: 2 }}>⚠️ Thigh Asymmetry</div>
              <div style={{ fontSize: 12, color: C.mid, lineHeight: 1.6 }}>
                {larger.charAt(0).toUpperCase() + larger.slice(1)} thigh is {diff}" larger. Bulgarian split squats and single-leg work are the primary tool.
              </div>
            </div>
          );
        })()}
      </Section>

      {/* ── Strength Over Time ── */}
      <Section
        title="Strength Over Time"
        sub="Heaviest set per session. Tap any card to see full session history."
        isEmpty={strengthHistory.length === 0}
        emptyMsg="No strength data for this period"
        emptyDetail={rangeDays ? "Try expanding the time range — at least 3 sessions per exercise are needed." : "Log at least 3 sessions per exercise to see strength trends here."}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {strengthHistory.map(({ name, pts }) => (
            <StrengthCard key={name} name={name} pts={pts} rangeDays={rangeDays} />
          ))}
        </div>
      </Section>

    </div>
  );
}
