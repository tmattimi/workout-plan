import { useState, useEffect, useCallback, useRef } from "react";
import { schedule, principles } from "./data";
import {
  loadWorkoutLogs, saveWorkoutLogs, loadMeasurements, saveMeasurements,
  loadPRs, savePRs, loadProgressPhotos, saveProgressPhotos,
  loadMonthlyPrompt, saveMonthlyPrompt,
  today, thisMonth, formatDate, formatShortDate
} from "./storage";
import MeasurementsTracker from "./components/MeasurementsTracker";
import MuscleScience from "./components/MuscleScience";
import WarmUp from "./components/WarmUp";
import RestTimer, { parseRestSeconds } from "./components/RestTimer";
import { PRCelebration, OverloadSuggestions } from "./components/PRCelebration";
import MonthlyPrompt from "./components/MonthlyPrompt";
import DailyScripture from "./components/DailyScripture";
import PostWorkoutStretches from "./components/PostWorkoutStretches";
import { getWarmupForDay } from "./warmups";
import AlternativeExercises from "./components/AlternativeExercises";
import { getClientByToken } from "./lib/supabase";
import NewProgressTab from "./components/ProgressTab";
import PhotosTab from "./components/PhotosTab";
import TrackingTab from "./components/TrackingTab";
import ActivityLog from "./components/ActivityLog";
import CycleTracking from "./components/CycleTracking";
import HealthIntegration from "./components/HealthIntegration";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
function makeSessionKey(day, date) { return `${day}_${date}`; }

const categoryStyle = (cat) => {
  if (cat === "Compound Bilateral") return { bg: "#1a1a1a", color: "#fff", short: "Compound" };
  if (cat === "Compound Unilateral") return { bg: "#2563a8", color: "#fff", short: "Compound Uni" };
  if (cat === "Isolation Unilateral") return { bg: "#7a3aa0", color: "#fff", short: "Isolation Uni" };
  if (cat && cat.startsWith("Core")) return { bg: "#147a50", color: "#fff", short: cat.includes("Stage 1") ? "Core S1" : cat.includes("Stage 2") ? "Core S2" : "Core S3" };
  return { bg: "#555", color: "#fff", short: "Isolation" };
};

// ── Mini chart ─────────────────────────────────────────────────────────────────
function MiniChart({ data, color }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 200, H = 50;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 8) - 4;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 50 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((d.value - min) / range) * (H - 8) - 4;
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
    </svg>
  );
}

// ── Set Logger ─────────────────────────────────────────────────────────────────
function SetLogger({ exercise, sessionKey, logs, onLogsChange, accent = '#555', color = '#f5f5f3', onSetDone, prs }) {
  const exKey = `${sessionKey}__${exercise.name}`;
  const exLog = logs[exKey] || { sets: [], notes: "" };

  function updateLog(updated) { onLogsChange({ ...logs, [exKey]: updated }); }

  function addSet() {
    const prev = exLog.sets[exLog.sets.length - 1];
    updateLog({ ...exLog, sets: [...exLog.sets, { weight: prev?.weight || "", reps: prev?.reps || "", done: false }] });
  }

  function updateSet(i, field, val) {
    updateLog({ ...exLog, sets: exLog.sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s) });
  }

  function toggleDone(i) {
    const set = exLog.sets[i];
    const newDone = !set.done;
    const newSets = exLog.sets.map((s, idx) => idx === i ? { ...s, done: newDone } : s);
    updateLog({ ...exLog, sets: newSets });

    if (newDone && set.reps && !exercise.bodyweight) {
      // Set was just marked done — check if it's a PR (skip for bodyweight exercises)
      if (set.weight) {
        const w = parseFloat(set.weight);
        const r = parseInt(set.reps);
        const prevPR = prs[exercise.name];
        const isPR = !prevPR || w > prevPR.weight || (w === prevPR.weight && r > prevPR.reps);
        onSetDone && onSetDone({ exercise: exercise.name, weight: w, reps: r, isPR, rest: exercise.rest, setNumber: i + 1 });
      }
    } else if (newDone && exercise.bodyweight && set.reps) {
      // Bodyweight exercise — trigger rest timer only, no PR tracking
      onSetDone && onSetDone({ exercise: exercise.name, weight: 0, reps: parseInt(set.reps), isPR: false, rest: exercise.rest, setNumber: i + 1, bodyweight: true });
    } else if (!newDone) {
      // Set was unchecked — recalculate PR from remaining done sets
      const remainingDone = newSets.filter(s => s.done && s.weight && s.reps);
      if (remainingDone.length > 0) {
        const bestWeight = Math.max(...remainingDone.map(s => parseFloat(s.weight)));
        const bestReps = Math.max(...remainingDone.filter(s => parseFloat(s.weight) === bestWeight).map(s => parseInt(s.reps)));
        onSetDone && onSetDone({ exercise: exercise.name, weight: bestWeight, reps: bestReps, isPR: true, rest: exercise.rest, setNumber: i + 1, recalculate: true });
      } else {
        // No more done sets — notify to clear PR for this session
        onSetDone && onSetDone({ exercise: exercise.name, weight: 0, reps: 0, isPR: false, rest: exercise.rest, setNumber: i + 1, cleared: true });
      }
    }
  }

  function removeSet(i) {
    updateLog({ ...exLog, sets: exLog.sets.filter((_, idx) => idx !== i) });
  }

  const doneSets = exLog.sets.filter(s => s.done).length;

  return (
    <div style={{ marginTop: "10px", background: "#f9f9f7", borderRadius: "8px", overflow: "hidden", border: "1px solid #e8e8e8" }}>
      <div style={{ padding: "8px 12px", background: "#f5f5f3", borderBottom: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: "600", color: "#555" }}>
          Log Sets {exLog.sets.length > 0 ? `· ${doneSets}/${exLog.sets.length} done` : ""}
        </span>
        <button onClick={addSet} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
          + Set
        </button>
      </div>

      {exLog.sets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: exercise.bodyweight ? "24px 1fr 34px 24px" : "24px 1fr 1fr 34px 24px", gap: "4px", padding: "5px 12px 2px" }}>
          {(exercise.bodyweight ? ["", "Reps", "✓", ""] : ["", "Weight", "Reps", "✓", ""]).map((h, i) => (
            <span key={i} style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>{h}</span>
          ))}
        </div>
      )}

      {exLog.sets.map((set, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: exercise.bodyweight ? "24px 1fr 34px 24px" : "24px 1fr 1fr 34px 24px", gap: "4px", padding: "3px 12px", background: set.done ? "#e8f5e9" : "transparent", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: "11px", color: "#aaa", textAlign: "center" }}>{i + 1}</span>
          {!exercise.bodyweight && (
            <input type="number" inputMode="decimal" placeholder="lbs" value={set.weight}
              onChange={e => updateSet(i, "weight", e.target.value)}
              style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "13px", textAlign: "center", background: set.done ? "rgba(45,122,30,0.08)" : "#fff", color: "#1a1a1a", ...F }} />
          )}
          <input type="number" inputMode="numeric" placeholder={exercise.bodyweight ? "reps / sec" : "reps"} value={set.reps}
            onChange={e => updateSet(i, "reps", e.target.value)}
            style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "13px", textAlign: "center", background: set.done ? "rgba(45,122,30,0.08)" : "#fff", color: "#1a1a1a", ...F }} />
          <button onClick={() => toggleDone(i)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: `2px solid ${set.done ? "#2d7a1e" : "#ddd"}`, background: set.done ? "#2d7a1e" : "transparent", color: set.done ? "#fff" : "#ccc", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
          <button onClick={() => removeSet(i)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "16px", cursor: "pointer" }}>×</button>
        </div>
      ))}

      {exLog.sets.length === 0 && (
        <div style={{ padding: "12px", textAlign: "center", color: "#bbb", fontSize: "11px" }}>Tap "+ Set" to start logging</div>
      )}

      <div style={{ padding: "8px 12px" }}>
        <input type="text" placeholder="Notes (e.g. left side felt weaker)" value={exLog.notes}
          onChange={e => updateLog({ ...exLog, notes: e.target.value })}
          style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #e8e8e8", fontSize: "11px", color: "#555", background: "#fff", ...F }} />
      </div>
    </div>
  );
}

// ── Progress Tab ───────────────────────────────────────────────────────────────
function ProgressTab({ logs, prs }) {
  const [selected, setSelected] = useState(null);

  const exerciseData = {};
  Object.entries(logs).forEach(([key, val]) => {
    const parts = key.split("__");
    if (parts.length < 2) return;
    const exName = parts.slice(1).join("__");
    const dateStr = parts[0].split("_").slice(1).join("_");
    if (!val.sets?.length) return;
    const done = val.sets.filter(s => s.done && s.weight && s.reps);
    if (!done.length) return;
    const maxWeight = Math.max(...done.map(s => parseFloat(s.weight) || 0));
    if (!exerciseData[exName]) exerciseData[exName] = [];
    exerciseData[exName].push({ date: dateStr, maxWeight, sets: done.length });
  });
  Object.keys(exerciseData).forEach(ex => exerciseData[ex].sort((a, b) => a.date.localeCompare(b.date)));
  const exercises = Object.keys(exerciseData).sort();

  if (!exercises.length) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "12px" }}>No data yet</div>
        <div style={{ fontSize: "14px", color: "#888", lineHeight: "1.6" }}>Progress charts appear here after logging your first session.</div>
      </div>
    );
  }

  const sel = selected || exercises[0];
  const exData = exerciseData[sel] || [];
  const latest = exData[exData.length - 1];
  const progress = latest && exData[0] ? latest.maxWeight - exData[0].maxWeight : 0;
  const pr = prs[sel];

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Workout Progress</div>
      <select value={sel} onChange={e => setSelected(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", background: "#fff", color: "#1a1a1a", ...F, marginBottom: "14px" }}>
        {exercises.map(ex => <option key={ex} value={ex}>{ex}</option>)}
      </select>

      {pr && (
        <div style={{ background: "#111", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "3px 8px", borderRadius: "4px" }}>PR</span>
          <div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#f59e0b", marginBottom: "2px" }}>Personal Record</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>{pr.weight} lbs × {pr.reps} reps</div>
            <div style={{ fontSize: "10px", color: "#888" }}>Set on {formatDate(pr.date)}</div>
          </div>
        </div>
      )}

      {latest && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
          {[["Best", `${latest.maxWeight} lbs`], ["Sessions", exData.length], ["Change", `${progress >= 0 ? "+" : ""}${progress} lbs`]].map(([label, val]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: "4px" }}>{label}</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: label === "Change" && progress > 0 ? "#2d7a1e" : "#1a1a1a" }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {exData.length >= 2 && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "12px", marginBottom: "12px" }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "8px" }}>Max Weight Over Time</div>
          <MiniChart data={exData.map(d => ({ value: d.maxWeight }))} color="#2563a8" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ fontSize: "9px", color: "#bbb" }}>{formatShortDate(exData[0].date)}</span>
            <span style={{ fontSize: "9px", color: "#bbb" }}>{formatShortDate(exData[exData.length - 1].date)}</span>
          </div>
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", overflow: "hidden", marginBottom: "14px" }}>
        <div style={{ padding: "9px 13px", borderBottom: "1px solid #f0f0f0", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa" }}>Session History</div>
        {[...exData].reverse().map((d, i) => (
          <div key={i} style={{ padding: "10px 13px", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#555" }}>{formatDate(d.date)}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: "700" }}>{d.maxWeight} lbs</div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>{d.sets} sets</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "10px" }}>All Exercises</div>
      {exercises.map(ex => {
        const data = exerciseData[ex];
        const last = data[data.length - 1];
        const diff = data.length > 1 ? last.maxWeight - data[0].maxWeight : null;
        const hasPR = !!prs[ex];
        return (
          <button key={ex} onClick={() => setSelected(ex)} style={{ width: "100%", background: sel === ex ? "#f0f4ff" : "#fff", border: `1px solid ${sel === ex ? "#2563a8" : "#e8e8e8"}`, borderRadius: "7px", padding: "10px 13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: sel === ex ? "700" : "400", display: "flex", alignItems: "center", gap: "5px" }}>
                {hasPR && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "1px 5px", borderRadius: "3px" }}>PR</span>}
                {ex}
              </div>
              <div style={{ fontSize: "10px", color: "#aaa" }}>{data.length} session{data.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", fontWeight: "600" }}>{last.maxWeight} lbs</div>
              {diff !== null && <div style={{ fontSize: "10px", color: diff > 0 ? "#2d7a1e" : diff < 0 ? "#a02a2a" : "#aaa" }}>{diff > 0 ? "+" : ""}{diff} lbs</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────
function HistoryTab({ logs, activeSchedule }) {
  const [expanded, setExpanded] = useState(null);
  const sessions = {};
  Object.entries(logs).forEach(([key, val]) => {
    const parts = key.split("__");
    if (parts.length < 2) return;
    const sk = parts[0];
    if (!sessions[sk]) sessions[sk] = {};
    sessions[sk][parts.slice(1).join("__")] = val;
  });
  const keys = Object.keys(sessions).filter(sk => Object.values(sessions[sk]).some(v => v.sets?.some(s => s.done))).sort().reverse();

  if (!keys.length) return (
    <div style={{ padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "12px" }}>No sessions yet</div>
      <div style={{ fontSize: "14px", color: "#888", lineHeight: "1.6" }}>Past sessions appear here after completing your first workout.</div>
    </div>
  );

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Session History</div>
      {keys.map(sk => {
        const [dayAbbr, ...dp] = sk.split("_");
        const dateStr = dp.join("_");
        const day = activeSchedule.find(d => d.day === dayAbbr);
        const accent = day?.accent || "#555";
        const color = day?.color || "#f5f5f5";
        const exes = sessions[sk];
        const logged = Object.entries(exes).filter(([, v]) => v.sets?.some(s => s.done));
        const total = logged.reduce((a, [, v]) => a + v.sets.filter(s => s.done).length, 0);
        const isOpen = expanded === sk;
        return (
          <div key={sk} style={{ marginBottom: "8px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", overflow: "hidden" }}>
            <button onClick={() => setExpanded(isOpen ? null : sk)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: color, borderRadius: "6px", padding: "4px 9px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "700", color: accent }}>{dayAbbr}</span>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>{day?.focus || dayAbbr}</div>
                  <div style={{ fontSize: "10px", color: "#aaa" }}>{formatDate(dateStr)} · {total} sets</div>
                </div>
              </div>
              <span style={{ color: "#ccc", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div style={{ borderTop: "1px solid #f0f0f0" }}>
                {logged.map(([exName, val]) => {
                  const done = val.sets.filter(s => s.done);
                  return (
                    <div key={exName} style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "5px" }}>{exName}</div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {done.map((s, i) => (
                          <span key={i} style={{ fontSize: "11px", background: color, color: accent, padding: "2px 8px", borderRadius: "20px" }}>
                            {s.weight ? `${s.weight} lbs` : ""}{s.weight && s.reps ? " × " : ""}{s.reps || ""}
                          </span>
                        ))}
                      </div>
                      {val.notes && <div style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontStyle: "italic" }}>{val.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Photos Tab ─────────────────────────────────────────────────────────────────
// ── Cardio options per session type ───────────────────────────────────────────
const CARDIO_OPTIONS = [
  {
    id: "rowing",
    name: "Rowing Machine",
    icon: "Row",
    protocol: "Damper 4–5, moderate pace · 20 min",
    benefit: "Upper body dominant. Best active recovery for push and pull days — keeps the pattern moving at low load.",
    bestFor: ["push", "pull"],
  },
  {
    id: "stairmaster",
    name: "Stair Master",
    icon: "Stair",
    protocol: "Level 8–10 · 20 min",
    benefit: "High glute and quad demand. Strong choice on upper body days when legs are fresh.",
    bestFor: ["push", "pull"],
    warningFor: ["legs"],
    warning: "Your legs are already fatigued from this session. Consider rowing or incline walk instead.",
  },
  {
    id: "incline_walk",
    name: "Incline Treadmill",
    icon: "Walk",
    protocol: "4.0–4.5 mph · 8–12% incline · 20 min",
    benefit: "Low joint stress, consistent Zone 3. Works on any day. Good choice when legs are tired.",
    bestFor: ["push", "pull", "legs"],
  },
  {
    id: "assault_bike",
    name: "Assault Bike",
    icon: "Bike",
    protocol: "Moderate effort, consistent pace · 20 min",
    benefit: "Full body demand. Lung-heavy. Best on pull days — matches the pulling pattern and spares the chest.",
    bestFor: ["pull", "legs"],
  },
];

function CardioSwapCard({ sessionType, onLog }) {
  const F = { fontFamily: "'Georgia','Times New Roman',serif" };
  const recommended = CARDIO_OPTIONS.find(o => o.bestFor.includes(sessionType) && !o.warningFor?.includes(sessionType)) || CARDIO_OPTIONS[2];
  const [selected, setSelected] = useState(recommended);
  const [showAlts, setShowAlts] = useState(false);
  const [logged, setLogged] = useState(false);

  function handleSelect(option) {
    setSelected(option);
    setShowAlts(false);
    if (!logged) {
      setLogged(true);
      onLog && onLog({ type: option.id, name: option.name, duration: 20 });
    }
  }

  return (
    <div style={{ borderBottom: "1px solid #ebebeb", background: "#f9f9f7" }}>
      <div style={{ padding: "11px 16px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: logged ? "#2d7a1e" : "#e8e8e8", color: logged ? "#fff" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
          {logged ? "✓" : "Z3"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>Cardio · Zone 3 · 20 min</div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "3px" }}>{selected.name}</div>
          <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.5", marginBottom: "5px", ...F }}>{selected.protocol}</div>
          <div style={{ fontSize: "10px", color: "#888", lineHeight: "1.5", fontStyle: "italic", ...F }}>{selected.benefit}</div>
          {selected.warningFor?.includes(sessionType) && (
            <div style={{ marginTop: "5px", fontSize: "10px", color: "#a02020", lineHeight: "1.5" }}>{selected.warning}</div>
          )}
          <button onClick={() => setShowAlts(p => !p)} style={{ marginTop: "8px", background: "none", border: "none", color: "#aaa", fontSize: "10px", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
            {showAlts ? "Close" : "Switch cardio"}
          </button>
        </div>
      </div>

      {showAlts && (
        <div style={{ padding: "0 16px 12px 51px" }}>
          {CARDIO_OPTIONS.filter(o => o.id !== selected.id).map(option => {
            const hasWarning = option.warningFor?.includes(sessionType);
            return (
              <button key={option.id} onClick={() => handleSelect(option)} style={{ width: "100%", textAlign: "left", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "9px 12px", marginBottom: "5px", cursor: "pointer" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", marginBottom: "2px", ...F }}>{option.name}</div>
                <div style={{ fontSize: "10px", color: "#888" }}>{option.protocol}</div>
                {hasWarning && <div style={{ fontSize: "10px", color: "#a02020", marginTop: "3px" }}>{option.warning}</div>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App({ clientData, adaptedSchedule, onSignOut }) {
  // Use coach-assigned plan if available, otherwise fall back to default
  const activeSchedule = adaptedSchedule || schedule;

  const [activeDay, setActiveDay] = useState(() => {
    const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const idx = activeSchedule.findIndex(d => d.day === days[new Date().getDay()]);
    return idx >= 0 ? idx : 0;
  });
  const [tab, setTab] = useState("plan");
  const [expandedEx, setExpandedEx] = useState(null);
  const [expandedPrinciple, setExpandedPrinciple] = useState(null);
  const [showLogger, setShowLogger] = useState({});
  const [sessionDate, setSessionDate] = useState(today());
  const [showWarmup, setShowWarmup] = useState(false);
  const [customMovements, setCustomMovements] = useState(() => { try { return JSON.parse(localStorage.getItem("custom_movements_v1") || "{}"); } catch { return {}; } });
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [newMovement, setNewMovement] = useState({ name: "", sets: "", reps: "", notes: "" });
  const [dailyHealth, setDailyHealth] = useState(() => { try { return JSON.parse(localStorage.getItem("daily_health_v1") || "{}"); } catch { return {}; } });
  const [showHealthLog, setShowHealthLog] = useState(false);
  const [showStretches, setShowStretches] = useState(false);

  // State from storage
  const [logs, setLogs] = useState(loadWorkoutLogs);
  const [measurements, setMeasurements] = useState(loadMeasurements);
  const [prs, setPRs] = useState(loadPRs);
  const [photos, setPhotos] = useState(loadProgressPhotos);
  const [monthlyPrompt, setMonthlyPrompt] = useState(loadMonthlyPrompt);
  // Equipment and injury settings (persisted locally)
  const [clientEquipment, setClientEquipment] = useState(() => {
    try { return JSON.parse(localStorage.getItem("client_equipment") || "null"); } catch { return null; }
  });
  const [clientInjuries, setClientInjuries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("client_injuries") || "[]"); } catch { return []; }
  });

  function handleEquipmentChange(updated) {
    setClientEquipment(updated);
    localStorage.setItem("client_equipment", JSON.stringify(updated));
  }
  function handleInjuryChange(updated) {
    setClientInjuries(updated);
    localStorage.setItem("client_injuries", JSON.stringify(updated));
  }

  // Rest timer state
  const [restTimer, setRestTimer] = useState(null); // { seconds, exercise }

  // PR celebration state
  const [prCelebration, setPRCelebration] = useState(null); // { exercise, weight, reps }

  // Monthly prompt — show if we haven't shown this month
  const [showMonthlyPrompt, setShowMonthlyPrompt] = useState(() => {
    const prompt = loadMonthlyPrompt();
    const month = thisMonth();
    return prompt.lastShownMonth !== month;
  });

  const current = activeSchedule[activeDay];
  const sessionKey = makeSessionKey(current.day, sessionDate);
  const warmup = getWarmupForDay(current.type);

  const handleLogsChange = useCallback((newLogs) => {
    setLogs(newLogs);
    saveWorkoutLogs(newLogs);
  }, []);

  const handleMeasurementsChange = useCallback(async (updated) => {
    setMeasurements(updated);
    saveMeasurements(updated);
    // Also write latest entry to Supabase
    if (clientData && clientData.id && updated.length > 0) {
      try {
        const { logMeasurement } = await import("./lib/supabase");
        const latest = updated[updated.length - 1];
        if (latest && latest.metrics) {
          await logMeasurement(clientData.id, {
            measured_at: latest.date,
            weight_lbs: latest.metrics.weight || null,
            waist_in: latest.metrics.waist || null,
            chest_in: latest.metrics.chest || null,
            hips_in: latest.metrics.hips || null,
            right_thigh_in: latest.metrics.rightThigh || null,
            left_thigh_in: latest.metrics.leftThigh || null,
            right_arm_in: latest.metrics.rightArm || null,
            left_arm_in: latest.metrics.leftArm || null,
          });
        }
      } catch (err) {
        console.warn("Supabase measurement log failed:", err.message);
      }
    }
  }, [clientData]);

  const handlePhotosChange = useCallback((updated) => {
    setPhotos(updated);
    saveProgressPhotos(updated);
  }, []);

  // Called whenever a set is marked done
  async function handleSetDone({ exercise, weight, reps, isPR, rest, setNumber, recalculate, cleared, bodyweight }) {
    // Skip PR logic for bodyweight exercises — just trigger rest timer
    if (bodyweight) {
      if (rest) { const s = parseRestSeconds(rest); if (s > 0) setRestTimer({ seconds: s }); }
      return;
    }
    // 1. Local state updates immediately
    if (cleared) {
      // All sets unchecked — don't change the all-time PR, just skip
      return;
    } else if (recalculate) {
      // Recalculate PR from remaining sets — update silently without celebration
      const newPRs = { ...prs, [exercise]: { weight, reps, date: today() } };
      setPRs(newPRs);
      savePRs(newPRs);
    } else if (isPR) {
      const newPRs = { ...prs, [exercise]: { weight, reps, date: today() } };
      setPRs(newPRs);
      savePRs(newPRs);
      setPRCelebration({ exercise, weight, reps });
    } else {
      const restSecs = parseRestSeconds(rest);
      if (restSecs) setRestTimer({ seconds: restSecs, exercise });
    }

    // 2. Write to Supabase in the background if client is logged in
    if (clientData && clientData.id) {
      try {
        const { logSet, upsertPR, getAllExercises } = await import("./lib/supabase");
        const exObj = current.exercises && current.exercises.find(function(e) { return e.name === exercise; });
        
        // Try to get exercise_id from the plan exercise first,
        // then fall back to looking it up by name in the exercises table
        let exId = exObj && exObj.exercise_id;
        if (!exId) {
          const { data: allEx } = await getAllExercises();
          const found = allEx && allEx.find(function(e) { return e.name === exercise; });
          exId = found && found.id;
        }

        if (exId) {
          await logSet(clientData.id, {
            exercise_id: exId,
            plan_exercise_id: (exObj && exObj.plan_exercise_id) || null,
            plan_day_id: current.plan_day_id || null,
            session_date: sessionDate,
            set_number: setNumber || 1,
            weight_lbs: weight,
            reps: reps,
            completed: true,
          });
          if (isPR) {
            await upsertPR(clientData.id, exId, weight, reps);
          }
        } else {
          // Exercise not in library yet — log without exercise_id link
          // This should not happen with a seeded library but handles edge cases
          console.warn("Exercise not found in library:", exercise);
        }
      } catch (err) {
        console.warn("Supabase log failed:", err.message);
      }
    }
  }

  // When PR celebration closes, start the rest timer
  function handlePRDismiss() {
    const ex = current.exercises?.find(e => e.name === prCelebration?.exercise);
    const restSecs = parseRestSeconds(ex?.rest);
    setPRCelebration(null);
    if (restSecs) setRestTimer({ seconds: restSecs, exercise: prCelebration?.exercise });
  }

  function dismissMonthlyPrompt() {
    const updated = { lastShownMonth: thisMonth() };
    setMonthlyPrompt(updated);
    saveMonthlyPrompt(updated);
    setShowMonthlyPrompt(false);
  }

  const completedExercises = current.exercises?.filter(ex => {
    const exLog = logs[`${sessionKey}__${ex.name}`];
    return exLog?.sets?.some(s => s.done);
  }).length || 0;
  const trackableCount = current.exercises?.filter(ex => ex.category !== "Recovery" && ex.category !== "Mobility").length || 0;

  const tabs = [
    ["plan","Plan"], ["progress","Progress"], ["body","Body"],
    ["photos","Photos"], ["muscles","Muscles"],
    ["alternatives","Alternatives"], ["tracking","Tracking"],
    ["activity","Activity"],
    ["cycle","Cycle"], ["health","Health"],
    ["guide","Guide"],
  ];

  // Monthly prompt modal
  if (showMonthlyPrompt && tab === "plan") {
    return (
      <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: "#111", padding: "22px 18px" }}>
          <h1 style={{ margin: 0, fontSize: "21px", fontWeight: "normal", color: "#f7f6f3" }}>Workout Plan</h1>
        </div>
        <MonthlyPrompt
          photos={photos}
          onSave={(updated) => { handlePhotosChange(updated); dismissMonthlyPrompt(); }}
          onDismiss={dismissMonthlyPrompt}
        />
      </div>
    );
  }

  // Warm-up screen
  if (showWarmup) {
    return (
      <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: "#111", padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowWarmup(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>Before You Lift</div>
            <div style={{ fontSize: "16px", color: "#f7f6f3", fontWeight: "normal" }}>{current.focus}</div>
          </div>
        </div>
        <WarmUp warmup={warmup} onComplete={() => setShowWarmup(false)} />
      </div>
    );
  }

  // Post-workout stretch screen
  if (showStretches) {
    return (
      <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ background: "#111", padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowStretches(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>←</button>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>Post-Workout</div>
            <div style={{ fontSize: "16px", color: "#f7f6f3", fontWeight: "normal" }}>Cool Down & Stretch</div>
          </div>
        </div>
        <PostWorkoutStretches muscles={current.muscles || []} onDone={() => setShowStretches(false)} />
      </div>
    );
  }

  return (
    <div style={{ background: "#e8e8e8", minHeight: "100vh" }}>
    <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", color: "#1a1a1a", maxWidth: 640, margin: "0 auto", boxShadow: "0 0 60px rgba(0,0,0,0.1)" }}>

      {/* Header */}
      <div style={{ background: "#111", color: "#f7f6f3", padding: "22px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "normal", letterSpacing: "-0.5px" }}>
            {(() => {
              const h = new Date().getHours();
              const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
              return clientData?.name ? `${greeting}, ${clientData.name.split(" ")[0]}` : greeting;
            })()}
          </h1>
          {onSignOut && (
            <button onClick={onSignOut} style={{ background: "none", border: "1px solid #333", color: "#555", borderRadius: "20px", padding: "5px 12px", fontSize: "10px", cursor: "pointer", ...F, whiteSpace: "nowrap" }}>
              Sign out
            </button>
          )}
        </div>
        <div style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#555", marginBottom: "10px" }}>Push Pull Legs · 6 Days</div>
        {/* Scripture — inline in header */}
        <DailyScripture accent="#c47a0a" inHeader />
        <div style={{ display: "flex", gap: "3px", overflowX: "auto", paddingBottom: "1px", msOverflowStyle: "none", scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {tabs.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: "0 0 auto", background: tab === t ? "#f7f6f3" : "transparent",
              color: tab === t ? "#111" : "#666",
              border: "1px solid", borderColor: tab === t ? "#f7f6f3" : "#333",
              borderRadius: "4px 4px 0 0", padding: "6px 10px",
              fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase",
              cursor: "pointer", ...F, whiteSpace: "nowrap",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* PLAN */}
      {tab === "plan" && (
        <>
          {/* Day selector */}
          <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #e5e5e5", msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {activeSchedule.map((d, i) => (
              <button key={d.day} onClick={() => { setActiveDay(i); setExpandedEx(null); setShowLogger({}); }} style={{
                flex: "0 0 auto", background: "transparent", border: "none",
                borderBottom: activeDay === i ? "3px solid #1a1a1a" : "3px solid transparent",
                padding: "11px 12px 8px", cursor: "pointer", ...F,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "46px",
              }}>
                <span style={{ fontSize: "8px", fontWeight: "800", letterSpacing: "0.15em", color: activeDay === i ? "#1a1a1a" : "#bbb" }}>{d.day}</span>
                <span style={{ fontSize: "9px", color: activeDay === i ? "#1a1a1a" : "#ccc", whiteSpace: "nowrap" }}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Session header */}
          <div style={{ background: "#1a1a1a", borderBottom: "1px solid #2a2a2a", padding: "13px 16px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#888", marginBottom: "3px" }}>
              {current.day} · {current.muscles.join(", ") || "Recovery"}
            </div>
            <div style={{ fontSize: "17px", color: "#f7f6f3", marginBottom: "10px", fontWeight: "normal" }}>{current.focus}</div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                style={{ padding: "5px 8px", borderRadius: "5px", border: "1px solid #333", fontSize: "11px", background: "#111", color: "#888", ...F }} />
              {trackableCount > 0 && (
                <span style={{ fontSize: "11px", color: "#555", background: "#f0f0f0", padding: "4px 10px", borderRadius: "20px", border: "1px solid #e0e0e0" }}>
                  {completedExercises}/{trackableCount} started
                </span>
              )}
              {current.type !== "rest" && (
                <button onClick={() => setShowWarmup(true)} style={{ background: "rgba(196,122,10,0.12)", color: "#c47a0a", border: "1px solid #e8e8e8", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F, fontWeight: "600" }}>
                  Warm-Up
                </button>
              )}
            </div>
          </div>

          {/* Exercises */}
          <div>
            {current.exercises.map((ex, i) => {
              const isOpen = expandedEx === i;
              const logOpen = showLogger[ex.name];
              const cs = categoryStyle(ex.category);
              const exKey = `${sessionKey}__${ex.name}`;
              const exLog = logs[exKey];
              const doneSets = exLog?.sets?.filter(s => s.done).length || 0;
              const totalLogged = exLog?.sets?.length || 0;
              const isStarted = totalLogged > 0;
              const hasPR = !!prs[ex.name];

              return (
                <div key={i} style={{ borderBottom: "1px solid #ebebeb", background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                  <div style={{ padding: "11px 16px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: doneSets > 0 ? "#2d7a1e" : "#e8e8e8", color: doneSets > 0 ? "#fff" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
                      {doneSets > 0 ? "✓" : ex.order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {hasPR && <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "2px 6px", borderRadius: "3px", marginRight: "2px" }}>PR</span>}
                        {ex.name}
                      </div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#333", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{ex.sets} × {ex.reps}</span>
                        {ex.rest !== "—" && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{ex.rest} rest</span>}
                        
                        {isStarted && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "20px", background: doneSets > 0 ? "#e8f5e9" : "#f0f0f0", color: doneSets > 0 ? "#2d7a1e" : "#999" }}>{doneSets}/{totalLogged} done</span>}
                        {ex.imbalanceNote && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", background: "#f5f5f3", color: "#777", border: "1px solid #e0e0e0" }}>Imbalance</span>}
                      </div>
                      {ex.muscles && ex.muscles.length > 0 && (
                        <div style={{ fontSize: "10px", color: "#bbb", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ color: "#aaa" }}>{ex.muscles.join(" · ")}</span>
                          {ex.category && ex.category !== "Recovery" && ex.category !== "Mobility" && (
                            <span style={{ color: "#d0d0d0", fontSize: "9px", letterSpacing: "0.06em" }}>
                              · {ex.category.replace(" Bilateral", "").replace(" Unilateral", " Uni")}
                            </span>
                          )}
                        </div>
                      )}
                      {ex.note && (
                        <div style={{ fontSize: "11px", color: "#777", marginTop: "5px", lineHeight: "1.5", fontStyle: "italic" }}>
                          {ex.note}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                      {ex.category !== "Recovery" && ex.category !== "Mobility" && (
                        <button onClick={() => setShowLogger(p => ({ ...p, [ex.name]: !p[ex.name] }))} style={{ background: logOpen ? "#1a1a1a" : "transparent", color: logOpen ? "#fff" : "#555", border: "1px solid #d0d0d0", borderRadius: "5px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", ...F }}>
                          {logOpen ? "Hide" : "Log"}
                        </button>
                      )}
                      <button onClick={() => setExpandedEx(isOpen ? null : i)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "12px", cursor: "pointer", padding: "4px 0", textAlign: "right" }}>
                        {isOpen ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {logOpen && (
                    <div style={{ padding: "0 16px 12px 51px" }}>
                      <SetLogger
                        exercise={ex}
                        sessionKey={sessionKey}
                        logs={logs}
                        onLogsChange={handleLogsChange}
                        accent="#555"
                        color="#f5f5f3"
                        onSetDone={handleSetDone}
                        prs={prs}
                      />
                    </div>
                  )}

                  {isOpen && (
                    <div style={{ padding: "0 16px 12px 51px" }}>
                      {ex.imbalanceNote && (
                        <div style={{ fontSize: "11px", color: "#7a5010", lineHeight: "1.6", marginBottom: "7px", background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "5px", padding: "8px 10px" }}>
                          <strong>Imbalance note:</strong> {ex.imbalanceNote}
                        </div>
                      )}
                      {ex.form && ex.form.length > 0 && (
                        <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6" }}>
                          {ex.form.map((step, si) => (
                            <div key={si} style={{ marginBottom: "4px" }}>
                              <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: step.label === "Watch for" ? "#a02020" : "#999", marginRight: "5px" }}>
                                {step.label}:
                              </span>
                              <span>{step.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Core Finisher */}
          {current.core_finisher && current.core_finisher.length > 0 && (
            <div style={{ marginTop: "4px" }}>
              <div style={{ padding: "8px 16px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
                <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Core Finisher</span>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
              </div>
              {current.core_finisher.map((ex, i) => {
                const isOpen = expandedEx === `cf-${i}`;
                const logOpen = showLogger[`cf-${ex.name}`];
                const exKey = `${sessionKey}__${ex.name}`;
                const exLog = logs[exKey];
                const doneSets = exLog?.sets?.filter(s => s.done).length || 0;
                const totalLogged = exLog?.sets?.length || 0;
                return (
                  <div key={i} style={{ borderBottom: "1px solid #ebebeb", background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <div style={{ padding: "11px 16px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: doneSets > 0 ? "#2d7a1e" : "#e8e8e8", color: doneSets > 0 ? "#fff" : "#999", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
                        {doneSets > 0 ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{ex.name}</div>
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#333", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{ex.sets} × {ex.reps}</span>
                          {ex.rest !== "—" && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{ex.rest} rest</span>}
                          {totalLogged > 0 && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "20px", background: doneSets > 0 ? "#e8f5e9" : "#f0f0f0", color: doneSets > 0 ? "#2d7a1e" : "#999" }}>{doneSets}/{totalLogged} done</span>}
                          <span style={{ fontSize: "9px", color: "#bbb", padding: "2px 7px", background: "#f5f5f3", borderRadius: "20px" }}>Bodyweight</span>
                        </div>
                        {ex.muscles && <div style={{ fontSize: "10px", color: "#bbb", marginTop: "4px" }}>{ex.muscles.join(" · ")}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                        <button onClick={() => setShowLogger(p => ({ ...p, [`cf-${ex.name}`]: !p[`cf-${ex.name}`] }))} style={{ background: logOpen ? "#1a1a1a" : "transparent", color: logOpen ? "#fff" : "#555", border: "1px solid #d0d0d0", borderRadius: "5px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", ...F }}>
                          {logOpen ? "Hide" : "Log"}
                        </button>
                        <button onClick={() => setExpandedEx(isOpen ? null : `cf-${i}`)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "12px", cursor: "pointer", padding: "4px 0", textAlign: "right" }}>
                          {isOpen ? "▲" : "▼"}
                        </button>
                      </div>
                    </div>
                    {logOpen && (
                      <div style={{ padding: "0 16px 12px 51px" }}>
                        <SetLogger exercise={ex} sessionKey={sessionKey} logs={logs} onLogsChange={handleLogsChange} accent="#c47a0a" color="#1a1a1a" onSetDone={handleSetDone} prs={prs} />
                      </div>
                    )}
                    {isOpen && ex.form && ex.form.length > 0 && (
                      <div style={{ padding: "0 16px 10px 51px" }}>
                        <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6" }}>
                          {ex.form.map((step, si) => (
                            <div key={si} style={{ marginBottom: "4px" }}>
                              <span style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.08em", color: step.label === "Watch for" ? "#a02020" : "#999", marginRight: "5px" }}>
                                {step.label}:
                              </span>
                              <span>{step.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Post-lift cardio — swappable */}
          {current.cardio && current.type !== "rest" && (
            <div style={{ marginTop: "12px" }}>
            <div style={{ padding: "6px 16px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
              <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Cardio</span>
              <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
            </div>
            <CardioSwapCard
              sessionType={current.type}
              onLog={(activity) => {
                // auto-log to activity log
                try {
                  const existing = JSON.parse(localStorage.getItem("activity_log_v1") || "[]");
                  const entry = { id: Date.now(), type: activity.type, duration: activity.duration, date: sessionDate, intensity: "moderate", notes: `${current.focus} — post-lift cardio`, autoLogged: true };
                  localStorage.setItem("activity_log_v1", JSON.stringify([entry, ...existing]));
                } catch(e) {}
              }}
            />
            </div>
          )}

          {/* Overload suggestions */}
          <OverloadSuggestions
            sessionExercises={current.exercises}
            sessionLogs={logs}
            sessionKey={sessionKey}
            allLogs={logs}
          />

          {/* Cool down stretch — at the end of the full workout */}
          {current.type !== "rest" && (
            <div style={{ margin: "8px 16px 4px" }}>
              <button
                onClick={() => setShowStretches(true)}
                style={{
                  width: "100%", background: "#fff", border: "1px solid #e8e8e8",
                  borderRadius: "10px", padding: "13px 16px", cursor: "pointer", ...F,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "3px" }}>
                    After Your Workout
                  </div>
                  <div style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: "500" }}>Cool Down & Stretch</div>
                </div>
                <span style={{ fontSize: "12px", color: "#ccc" }}>→</span>
              </button>
            </div>
          )}

          {/* Steps + sleep nudge */}
          {(() => {
            const todayKey = sessionDate;
            const health = dailyHealth[todayKey] || {};
            const needsSteps = !health.steps;
            const needsSleep = !health.sleep;
            if (!needsSteps && !needsSleep) return null;
            return (
              <div style={{ margin: "8px 16px 4px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", overflow: "hidden" }}>
                <div style={{ padding: "10px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", color: "#777", ...F }}>
                    {needsSteps && needsSleep ? "Log steps + sleep" : needsSteps ? "Log today's steps" : "Log last night's sleep"}
                  </span>
                  <button onClick={() => setShowHealthLog(p => !p)} style={{ fontSize: "10px", color: "#555", background: "none", border: "1px solid #e0e0e0", borderRadius: "20px", padding: "3px 10px", cursor: "pointer" }}>
                    {showHealthLog ? "Close" : "Log"}
                  </button>
                </div>
                {showHealthLog && (
                  <div style={{ padding: "10px 14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {needsSteps && (
                      <div style={{ flex: 1, minWidth: "120px" }}>
                        <div style={{ fontSize: "10px", color: "#999", marginBottom: "4px" }}>Steps today (goal: 10,000)</div>
                        <input type="number" placeholder="e.g. 8500"
                          onBlur={e => {
                            if (!e.target.value) return;
                            const updated = { ...dailyHealth, [todayKey]: { ...(dailyHealth[todayKey] || {}), steps: parseInt(e.target.value) } };
                            setDailyHealth(updated);
                            try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}
                            setShowHealthLog(false);
                          }}
                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
                      </div>
                    )}
                    {needsSleep && (
                      <div style={{ flex: 1, minWidth: "120px" }}>
                        <div style={{ fontSize: "10px", color: "#999", marginBottom: "4px" }}>Sleep last night (goal: 8 hrs)</div>
                        <input type="number" step="0.5" placeholder="e.g. 7.5"
                          onBlur={e => {
                            if (!e.target.value) return;
                            const updated = { ...dailyHealth, [todayKey]: { ...(dailyHealth[todayKey] || {}), sleep: parseFloat(e.target.value) } };
                            setDailyHealth(updated);
                            try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}
                            setShowHealthLog(false);
                          }}
                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Add exercise */}
          {current.type !== "rest" && (() => {
            const EXERCISE_CATALOG = ["Ab Wheel Rollout", "Alternating Dumbbell Curl", "Arnold Press", "Bulgarian Split Squat (Dumbbell)", "Cable Crunch", "Cable Curl (Low Pulley)", "Cable Fly (Low-to-High)", "Cable Lateral Raise (Single-Arm)", "Cat-Cow", "Chest and Shoulder Doorway Stretch", "Chest-Supported DB Row", "Dead Bug", "Dumbbell Bench Press", "Face Pull (Rope Attachment)", "Foam Roll", "Goblet Squat", "Hammer Curl", "Hanging Knee Raise", "Hip Flexor Stretch", "Hip Thrust (Barbell or Machine)", "Incline Dumbbell Curl", "Incline Dumbbell Press", "Incline Treadmill", "Lat Pulldown (Wide Overhand)", "Lateral Raise", "Leg Extension", "Leg Press", "Light Walk", "Overhead Tricep Extension", "Pallof Press (Cable)", "Plank", "Pull-Up (or Assisted Pull-Up)", "Rear Delt Fly (Bent-Over)", "Romanian Deadlift (Dumbbell)", "Rowing Machine", "Rowing Machine or Incline Treadmill", "Seated Cable Row (Neutral Grip)", "Seated Calf Raise", "Seated Dumbbell Overhead Press", "Side Plank", "Single-Arm Dumbbell Row", "Single-Arm Overhead DB Press", "Single-Leg Hamstring Curl", "Standing Calf Raise", "Stationary Bike", "Stationary Bike or Brisk Walk", "Straight-Arm Cable Pulldown", "Tricep Rope Pushdown"];
            const cmKey = `${current.day}_${sessionDate}`;
            const dayMovements = customMovements[cmKey] || [];
            const searchTerm = newMovement.name.toLowerCase();
            const matches = searchTerm.length > 1
              ? EXERCISE_CATALOG.filter(n => n.toLowerCase().includes(searchTerm)).slice(0, 6)
              : [];

            function addMovement(name) {
              const updated = { ...customMovements, [cmKey]: [...dayMovements, { id: Date.now(), name }] };
              setCustomMovements(updated);
              try { localStorage.setItem("custom_movements_v1", JSON.stringify(updated)); } catch {}
              setNewMovement({ name: "", sets: "", reps: "", notes: "" });
              setShowAddMovement(false);
            }

            return (
              <div style={{ margin: "8px 16px 4px" }}>
                {dayMovements.map(m => (
                  <div key={m.id} style={{ marginBottom: "6px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600" }}>{m.name}</div>
                    <button onClick={() => {
                      const updated = { ...customMovements, [cmKey]: dayMovements.filter(x => x.id !== m.id) };
                      setCustomMovements(updated);
                      try { localStorage.setItem("custom_movements_v1", JSON.stringify(updated)); } catch {}
                    }} style={{ background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: "18px" }}>×</button>
                  </div>
                ))}

                {!showAddMovement ? (
                  <button onClick={() => setShowAddMovement(true)} style={{ width: "100%", background: "none", border: "1px dashed #ddd", borderRadius: "7px", padding: "9px 14px", cursor: "pointer", color: "#bbb", fontSize: "12px", textAlign: "left", ...F }}>
                    + Add exercise
                  </button>
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px" }}>
                    <input
                      autoFocus
                      value={newMovement.name}
                      onChange={e => setNewMovement(p => ({ ...p, name: e.target.value }))}
                      placeholder="Search exercises"
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box", ...F }}
                    />
                    {matches.length > 0 && (
                      <div style={{ marginTop: "4px", border: "1px solid #e8e8e8", borderRadius: "5px", overflow: "hidden" }}>
                        {matches.map(name => (
                          <button key={name} onClick={() => addMovement(name)} style={{ width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderBottom: "1px solid #f5f5f5", background: "#fff", fontSize: "12px", cursor: "pointer", ...F }}>
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                    {newMovement.name.length > 1 && matches.length === 0 && (
                      <button onClick={() => addMovement(newMovement.name.trim())} style={{ marginTop: "6px", width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "5px", padding: "8px", fontSize: "12px", cursor: "pointer", ...F }}>
                        Add "{newMovement.name}"
                      </button>
                    )}
                    <button onClick={() => { setShowAddMovement(false); setNewMovement({ name: "", sets: "", reps: "", notes: "" }); }} style={{ marginTop: "6px", background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer" }}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ margin: "12px 16px 80px", padding: "10px 12px", background: "#f0f0ee", borderRadius: "7px", color: "#777", fontSize: "11px", lineHeight: "1.55" }}>
            Tap <strong>Warm-Up</strong> before lifting. Tap <strong>Log</strong> on any exercise to record sets — the rest timer starts automatically. Tap <strong>Stretch</strong> when you're done to cool down. Tap ▼ for form cues.
          </div>
        </>
      )}

      {tab === "progress" && <NewProgressTab clientId={clientData?.id} bodyweight={clientData?.weight || 170} localLogs={logs} />}
      {tab === "body" && <MeasurementsTracker measurements={measurements} onSave={handleMeasurementsChange} />}
      {tab === "photos" && <PhotosTab />}
      {tab === "muscles" && <MuscleScience />}
      {tab === "alternatives" && (
        <AlternativeExercises
          clientEquipment={clientEquipment}
          clientInjuries={clientInjuries}
          onEquipmentChange={handleEquipmentChange}
          onInjuryChange={handleInjuryChange}
        />
      )}

      {tab === "tracking" && <TrackingTab />}
      {tab === "activity" && <ActivityLog />}
      {tab === "cycle" && <CycleTracking />}
      {tab === "health" && <HealthIntegration />}

      {tab === "guide" && (
        <div style={{ padding: "16px 16px 60px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "16px" }}>Training Guide</div>
          {principles.map((section, si) => (
            <div key={si} style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#c47a0a", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid #ebebeb" }}>
                {section.section}
              </div>
              {section.entries.map((p, i) => {
                const key = `${si}-${i}`;
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "6px", marginBottom: "6px", overflow: "hidden" }}>
                    <button onClick={() => setExpandedPrinciple(expandedPrinciple === key ? null : key)} style={{ width: "100%", background: "transparent", border: "none", padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a" }}>{p.title}</span>
                      <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginLeft: "8px" }}>{expandedPrinciple === key ? "▲" : "▼"}</span>
                    </button>
                    {expandedPrinciple === key && (
                      <div style={{ padding: "0 14px 12px", fontSize: "12px", color: "#444", lineHeight: "1.8", borderTop: "1px solid #f5f5f3" }}>
                        <div style={{ paddingTop: "10px" }}>{p.body}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Rest Timer — fixed to bottom */}
      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          onDone={() => {}}
          onDismiss={() => setRestTimer(null)}
        />
      )}

      {/* PR Celebration overlay */}
      {prCelebration && (
        <PRCelebration
          exercise={prCelebration.exercise}
          weight={prCelebration.weight}
          reps={prCelebration.reps}
          onDismiss={handlePRDismiss}
        />
      )}
    </div>
    </div>
  );
}
