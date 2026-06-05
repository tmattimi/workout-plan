import { useState, useEffect, useMemo, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
const C = {
  card: "#fff", dark: "#1a1a1a", mid: "#555", muted: "#999",
  faint: "#bbb", border: "#e8e8e8", blue: "#2563a8", green: "#2d7a1e", red: "#a02020",
};

// ── Build per-day series for one exercise ───────────────────────────────────────
// Returns { weight:[{date,v}], reps:[{date,v}] } using the heaviest set each day.
function buildSeries(allLogs, exerciseName) {
  const byDate = {}; // date -> { topWeight, repsAtTop }
  allLogs.forEach(log => {
    const name = log.exercise_name || log.exercises?.name;
    if (!name || name !== exerciseName) return;
    if (!log.session_date) return;
    const w = parseFloat(log.weight_lbs) || 0;
    const r = parseInt(log.reps) || 0;
    const d = log.session_date;
    if (!byDate[d] || w > byDate[d].topWeight) {
      byDate[d] = { topWeight: w, repsAtTop: r, maxReps: r };
    }
    // track best reps that day too (for bodyweight / rep-based lifts)
    if (byDate[d] && r > (byDate[d].maxReps || 0)) byDate[d].maxReps = r;
  });
  const dates = Object.keys(byDate).sort();
  return {
    weight: dates.map(d => ({ date: d, v: byDate[d].topWeight })),
    reps: dates.map(d => ({ date: d, v: byDate[d].maxReps })),
  };
}

function fmtShort(d) {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Mini line chart ─────────────────────────────────────────────────────────────
function MiniChart({ data, color = C.blue, unit = "" }) {
  const [tip, setTip] = useState(null);
  const ref = useRef(null);
  if (!data || data.length < 2) return null;

  const W = 300, H = 90, PAD = { t: 10, b: 22, l: 6, r: 6 };
  const cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const vals = data.map(p => p.v);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const toX = i => PAD.l + (i / Math.max(data.length - 1, 1)) * cW;
  const toY = v => PAD.t + cH - ((v - min) / range) * cH;
  const line = data.map((p, i) => `${toX(i)},${toY(p.v)}`).join(" ");
  const area = `${toX(0)},${H - PAD.b} ${line} ${toX(data.length - 1)},${H - PAD.b}`;

  function handle(e) {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width * W;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((x - PAD.l) / cW) * (data.length - 1))));
    setTip({ i, p: data[i] });
  }

  return (
    <div style={{ position: "relative" }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}
        onMouseMove={handle} onMouseLeave={() => setTip(null)}
        onTouchStart={handle} onTouchMove={handle} onTouchEnd={() => setTip(null)}>
        <polygon points={area} fill={color} opacity="0.07" />
        <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((p, i) => (
          <circle key={i} cx={toX(i)} cy={toY(p.v)} r={i === data.length - 1 ? 3.5 : 1.8}
            fill={i === data.length - 1 ? color : "#fff"} stroke={color} strokeWidth="1.5" />
        ))}
        {tip && <line x1={toX(tip.i)} y1={PAD.t} x2={toX(tip.i)} y2={H - PAD.b} stroke="#999" strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />}
        <text x={PAD.l} y={H - 2} fontSize="8" fill={C.muted}>{fmtShort(data[0].date)}</text>
        <text x={W - PAD.r} y={H - 2} textAnchor="end" fontSize="8" fill={C.muted}>{fmtShort(data[data.length - 1].date)}</text>
      </svg>
      {tip && (
        <div style={{ position: "absolute", top: 2, left: `clamp(0px, calc(${(toX(tip.i) / W) * 100}% - 40px), calc(100% - 80px))`,
          background: C.dark, color: "#fff", borderRadius: 6, padding: "4px 8px", fontSize: 11, pointerEvents: "none", ...F }}>
          <div style={{ fontSize: 9, color: "#aaa" }}>{fmtShort(tip.p.date)}</div>
          <div style={{ fontWeight: 700 }}>{tip.p.v}{unit}</div>
        </div>
      )}
    </div>
  );
}

// ── One exercise's progress card ────────────────────────────────────────────────
function ExerciseCard({ name, allLogs, onRemove, defaultMetric = "weight" }) {
  const [metric, setMetric] = useState(defaultMetric);
  const series = useMemo(() => buildSeries(allLogs, name), [allLogs, name]);
  const data = series[metric];
  const hasData = data && data.length >= 2;
  const hasAny = (series.weight.length + series.reps.length) > 0;

  const first = hasData ? data[0].v : null;
  const last = hasData ? data[data.length - 1].v : null;
  const change = (first != null && last != null) ? +(last - first).toFixed(1) : null;
  const color = metric === "weight" ? C.blue : C.green;
  const unit = metric === "weight" ? " lbs" : " reps";

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.dark, ...F }}>{name}</div>
          {hasData && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>{last}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{unit.trim()}</span>
              {change != null && change !== 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: change > 0 ? C.green : C.red }}>
                  {change > 0 ? "↑" : "↓"} {Math.abs(change)}{unit}
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {/* Weight / Reps toggle */}
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 7, overflow: "hidden" }}>
            {["weight", "reps"].map(m => (
              <button key={m} onClick={() => setMetric(m)} style={{
                border: "none", background: metric === m ? C.dark : "#fff",
                color: metric === m ? "#fff" : C.muted, fontSize: 10, padding: "4px 9px",
                cursor: "pointer", ...F, textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
          {onRemove && (
            <button onClick={onRemove} title="Remove" style={{ border: "none", background: "none", color: C.faint, fontSize: 16, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>
      {hasData ? (
        <MiniChart data={data} color={color} unit={unit} />
      ) : (
        <div style={{ fontSize: 11, color: C.muted, padding: "12px 0", textAlign: "center", ...F }}>
          {hasAny ? `Need at least 2 logged sessions to chart ${metric}.` : "No logged sessions yet for this exercise."}
        </div>
      )}
    </div>
  );
}

// ── Searchable exercise picker ──────────────────────────────────────────────────
function ExercisePicker({ exercises, onPick, placeholder = "Search any exercise…", excludeNames = [] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => {
    const query = q.toLowerCase().trim();
    return exercises
      .filter(name => !query || name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [q, exercises]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border}`,
          fontSize: 13, color: C.dark, background: "#fff", ...F, boxSizing: "border-box" }}
      />
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "#fff",
          border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 20, maxHeight: 260, overflowY: "auto" }}>
          {results.map(name => {
            const pinned = excludeNames.includes(name);
            return (
              <button key={name} onMouseDown={() => { onPick(name); setQ(""); setOpen(false); }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
                  border: "none", borderBottom: `1px solid ${C.border}`, background: "#fff",
                  padding: "10px 12px", fontSize: 13, color: C.dark, cursor: "pointer", textAlign: "left", ...F }}>
                <span>{name}</span>
                {pinned && <span style={{ fontSize: 10, color: C.green }}>pinned</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────
export default function ExerciseProgress({ allLogs, clientId }) {
  const [pinned, setPinned] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [explore, setExplore] = useState(null); // exercise selected in the main picker

  // All distinct exercise names that have logged data, sorted
  const exerciseNames = useMemo(() => {
    const set = new Set();
    allLogs.forEach(l => {
      const n = l.exercise_name || l.exercises?.name;
      if (n) set.add(n);
    });
    return [...set].sort();
  }, [allLogs]);

  // Load pinned from account
  useEffect(() => {
    if (!clientId) { setLoaded(true); return; }
    let cancelled = false;
    import("../lib/supabase").then(({ getPinnedExercises }) =>
      getPinnedExercises(clientId).then(({ data }) => {
        if (!cancelled) { if (Array.isArray(data)) setPinned(data); setLoaded(true); }
      })
    );
    return () => { cancelled = true; };
  }, [clientId]);

  function persist(next) {
    setPinned(next);
    if (clientId) import("../lib/supabase").then(({ savePinnedExercises }) => savePinnedExercises(clientId, next));
  }
  function addPin(name) { if (!pinned.includes(name)) persist([...pinned, name]); }
  function removePin(name) { persist(pinned.filter(n => n !== name)); }

  if (exerciseNames.length === 0) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 20px", textAlign: "center", ...F }}>
        <div style={{ fontSize: 22, color: C.faint, marginBottom: 10 }}>📈</div>
        <div style={{ fontSize: 13, color: C.mid }}>Log a few workouts to track exercise progress here.</div>
      </div>
    );
  }

  return (
    <div style={{ ...F }}>
      {/* ── Pinned key exercises ── */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, marginBottom: 10 }}>
            Your key exercises
          </div>
          {pinned.map(name => (
            <ExerciseCard key={name} name={name} allLogs={allLogs} onRemove={() => removePin(name)} />
          ))}
        </div>
      )}

      {/* ── Add a key exercise ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, marginBottom: 8 }}>
          {pinned.length > 0 ? "Add another key exercise" : "Pin your key exercises"}
        </div>
        <ExercisePicker
          exercises={exerciseNames}
          excludeNames={pinned}
          onPick={addPin}
          placeholder="Search to pin an exercise…"
        />
        {pinned.length === 0 && (
          <div style={{ fontSize: 11, color: C.faint, marginTop: 6, lineHeight: 1.5 }}>
            Pin the lifts you care about most — they'll always show here so you can track them at a glance.
          </div>
        )}
      </div>

      {/* ── Explore any exercise (always present) ── */}
      <div>
        <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: C.muted, marginBottom: 8 }}>
          Look up any exercise
        </div>
        <ExercisePicker
          exercises={exerciseNames}
          onPick={setExplore}
          placeholder="Search any exercise…"
        />
        {explore && (
          <div style={{ marginTop: 12 }}>
            <ExerciseCard
              name={explore}
              allLogs={allLogs}
              onRemove={null}
            />
            {!pinned.includes(explore) && (
              <button onClick={() => addPin(explore)} style={{
                width: "100%", border: `1px solid ${C.dark}`, background: "#fff", color: C.dark,
                borderRadius: 8, padding: "9px", fontSize: 12, cursor: "pointer", ...F, marginTop: -2,
              }}>
                + Pin {explore} to key exercises
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
