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
import GoalTracker from "./components/GoalTracker";
import MonthlyGoals from "./components/MonthlyGoals";
import InjuryAwareness from "./components/InjuryAwareness";
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
function SetLogger({ exercise, sessionKey, logs, onLogsChange, accent, color, onSetDone, prs }) {
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

    if (newDone && set.weight && set.reps) {
      // Set was just marked done — check if it's a PR
      const w = parseFloat(set.weight);
      const r = parseInt(set.reps);
      const prevPR = prs[exercise.name];
      const isPR = !prevPR || w > prevPR.weight || (w === prevPR.weight && r > prevPR.reps);
      onSetDone && onSetDone({ exercise: exercise.name, weight: w, reps: r, isPR, rest: exercise.rest, setNumber: i + 1 });
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
      <div style={{ padding: "8px 12px", background: color, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", fontWeight: "700", color: accent }}>
          Log Sets {exLog.sets.length > 0 ? `· ${doneSets}/${exLog.sets.length} done` : ""}
        </span>
        <button onClick={addSet} style={{ background: accent, color: "#fff", border: "none", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
          + Set
        </button>
      </div>

      {exLog.sets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 34px 24px", gap: "4px", padding: "5px 12px 2px" }}>
          {["", "Weight", "Reps", "✓", ""].map((h, i) => (
            <span key={i} style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>{h}</span>
          ))}
        </div>
      )}

      {exLog.sets.map((set, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 34px 24px", gap: "4px", padding: "3px 12px", background: set.done ? color : "transparent", alignItems: "center", borderBottom: "1px solid #f0f0f0" }}>
          <span style={{ fontSize: "11px", color: "#aaa", textAlign: "center" }}>{i + 1}</span>
          <input type="number" inputMode="decimal" placeholder="lbs" value={set.weight}
            onChange={e => updateSet(i, "weight", e.target.value)}
            style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "13px", textAlign: "center", background: set.done ? "rgba(255,255,255,0.7)" : "#fff", ...F }} />
          <input type="number" inputMode="numeric" placeholder="reps" value={set.reps}
            onChange={e => updateSet(i, "reps", e.target.value)}
            style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid #ddd", fontSize: "13px", textAlign: "center", background: set.done ? "rgba(255,255,255,0.7)" : "#fff", ...F }} />
          <button onClick={() => toggleDone(i)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: `2px solid ${set.done ? accent : "#ddd"}`, background: set.done ? accent : "transparent", color: set.done ? "#fff" : "#ccc", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
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
            <div style={{ fontSize: "10px", color: "#666" }}>Set on {formatDate(pr.date)}</div>
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
function PhotosTab({ photos, onSave }) {
  const [showAdd, setShowAdd] = useState(false);
  if (showAdd) return <MonthlyPrompt photos={photos} onSave={onSave} onDismiss={() => setShowAdd(false)} />;

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>Progress Photos</div>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>Visual Progress</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
          + Photo
        </button>
      </div>

      {!photos.length ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>📸</div>
          <div style={{ fontSize: "14px", color: "#555", marginBottom: "6px" }}>No photos yet</div>
          <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6" }}>
            Monthly progress photos reveal body composition changes that the scale completely misses — especially during a recomp.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[...photos].reverse().map((p, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", overflow: "hidden" }}>
                {p.dataUrl && (
                  <img src={p.dataUrl} alt={p.date} style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: "11px", fontWeight: "600" }}>{formatDate(p.date)}</div>
                  {p.note && <div style={{ fontSize: "10px", color: "#777", marginTop: "2px" }}>{p.note}</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "14px", padding: "10px 12px", background: "#f5f5f3", borderRadius: "7px", fontSize: "11px", color: "#666", lineHeight: "1.6" }}>
            Compare photos taken 4–8 weeks apart for the most visible changes. Body composition shifts show up in photos weeks before they register on the scale.
          </div>
        </>
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
  async function handleSetDone({ exercise, weight, reps, isPR, rest, setNumber, recalculate, cleared }) {
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
    ["photos","Photos"], ["history","History"], ["muscles","Muscles"],
    ["alternatives","Alternatives"], ["goals","Goals"],
    ["monthly","Monthly"], ["activity","Activity"], ["injury","Injury"],
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
    <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", color: "#1a1a1a", maxWidth: 640, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "#111", color: "#f7f6f3", padding: "22px 18px 0" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>Push Pull Legs × 2 · 6 Days</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "21px", fontWeight: "normal", letterSpacing: "-0.5px" }}>
            {clientData?.name ? `${clientData.name.split(" ")[0]}'s Plan` : "Workout Plan"}
          </h1>
          {onSignOut && (
            <button onClick={onSignOut} style={{ background: "none", border: "1px solid #333", color: "#555", borderRadius: "20px", padding: "5px 12px", fontSize: "10px", cursor: "pointer", ...F, whiteSpace: "nowrap" }}>
              Sign out
            </button>
          )}
        </div>
        {/* Scripture — inline in header */}
        <DailyScripture accent="#c47a0a" inHeader />
        <div style={{ display: "flex", gap: "3px", overflowX: "auto", paddingBottom: "1px" }}>
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
          <div style={{ display: "flex", overflowX: "auto", background: "#fff", borderBottom: "1px solid #e5e5e5" }}>
            {activeSchedule.map((d, i) => (
              <button key={d.day} onClick={() => { setActiveDay(i); setExpandedEx(null); setShowLogger({}); }} style={{
                flex: "0 0 auto", background: "transparent", border: "none",
                borderBottom: activeDay === i ? `3px solid ${d.accent}` : "3px solid transparent",
                padding: "11px 12px 8px", cursor: "pointer", ...F,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", minWidth: "46px",
              }}>
                <span style={{ fontSize: "8px", fontWeight: "800", letterSpacing: "0.15em", color: activeDay === i ? d.accent : "#bbb" }}>{d.day}</span>
                <span style={{ fontSize: "9px", color: activeDay === i ? "#1a1a1a" : "#ccc", whiteSpace: "nowrap" }}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Session header */}
          <div style={{ background: current.color, borderLeft: `4px solid ${current.accent}`, padding: "13px 16px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: current.accent, marginBottom: "2px" }}>
              {current.day} · {current.muscles.join(", ") || "Recovery"}
            </div>
            <div style={{ fontSize: "16px", marginBottom: "8px" }}>{current.focus}</div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px", flexWrap: "wrap" }}>
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                style={{ padding: "5px 8px", borderRadius: "5px", border: "1px solid rgba(0,0,0,0.1)", fontSize: "11px", background: "rgba(255,255,255,0.7)", color: "#333", ...F }} />
              {trackableCount > 0 && (
                <span style={{ fontSize: "11px", color: current.accent, background: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: "20px" }}>
                  {completedExercises}/{trackableCount} started
                </span>
              )}
              {/* Warm-up button */}
              {current.type !== "rest" && (
                <button onClick={() => setShowWarmup(true)} style={{ background: "rgba(255,255,255,0.7)", color: current.accent, border: `1px solid ${current.accent}44`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F, fontWeight: "600" }}>
                  Warm-Up
                </button>
              )}
            </div>

            {current.sessionNote && (
              <div style={{ fontSize: "11px", color: "#444", background: "rgba(255,255,255,0.65)", borderRadius: "5px", padding: "8px 10px", lineHeight: "1.55" }}>
                {current.sessionNote}
              </div>
            )}
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
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: current.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
                      {doneSets > 0 ? "✓" : ex.order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {hasPR && <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "2px 6px", borderRadius: "3px", marginRight: "2px" }}>PR</span>}
                        {ex.name}
                      </div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", background: current.color, color: current.accent, padding: "2px 8px", borderRadius: "20px", fontWeight: "700" }}>{ex.sets} × {ex.reps}</span>
                        {ex.rest !== "—" && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{ex.rest} rest</span>}
                        {ex.eccentric && ex.eccentric !== "—" && <span style={{ fontSize: "9px", color: "#7a3aa0", padding: "2px 7px", background: "#f3eafa", borderRadius: "20px" }}>{ex.eccentric}</span>}
                        {isStarted && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "20px", background: doneSets > 0 ? "#e8f5e9" : "#f0f0f0", color: doneSets > 0 ? "#2d7a1e" : "#999" }}>{doneSets}/{totalLogged} done</span>}
                        {ex.imbalanceNote && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", background: "#fef3e4", color: "#c47a0a", border: "1px solid #f0c060" }}>Imbalance</span>}
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
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                      {ex.category !== "Recovery" && ex.category !== "Mobility" && (
                        <button onClick={() => setShowLogger(p => ({ ...p, [ex.name]: !p[ex.name] }))} style={{ background: logOpen ? current.accent : "transparent", color: logOpen ? "#fff" : current.accent, border: `1px solid ${current.accent}`, borderRadius: "5px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", ...F }}>
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
                        accent={current.accent}
                        color={current.color}
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
                      {ex.form && ex.form.map((step, si) => (
                        <div key={si} style={{ marginBottom: "5px", fontSize: "11px", lineHeight: "1.6", borderLeft: `2px solid ${current.accent}`, paddingLeft: "10px" }}>
                          <strong style={{ color: current.accent }}>{step.label}: </strong>
                          <span style={{ color: "#333" }}>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Post-lift cardio */}
          {current.cardio && (
            <div style={{ margin: "0 16px 4px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ background: current.color, borderLeft: `4px solid ${current.accent}`, padding: "12px 14px" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: current.accent, marginBottom: "3px" }}>
                  Post-Lift Cardio · {current.cardio.zone}
                </div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "5px" }}>{current.cardio.name}</div>
                <div style={{ fontSize: "11px", color: "#444", lineHeight: "1.55" }}>{current.cardio.protocol}</div>
                <div style={{ fontSize: "10px", color: "#777", marginTop: "5px", lineHeight: "1.5", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "6px" }}>
                  {current.cardio.feel}
                </div>
              </div>
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
                  width: "100%", background: "#fff", border: `1px solid ${current.accent}44`,
                  borderRadius: "10px", padding: "13px 16px", cursor: "pointer", ...F,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  textAlign: "left",
                }}
              >
                <div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: current.accent, marginBottom: "3px" }}>
                    After Your Workout
                  </div>
                  <div style={{ fontSize: "13px", color: "#1a1a1a", fontWeight: "500" }}>Cool Down & Stretch</div>
                </div>
                <span style={{ fontSize: "12px", color: "#ccc" }}>→</span>
              </button>
            </div>
          )}

          <div style={{ margin: "12px 16px 80px", padding: "10px 12px", background: "#111", borderRadius: "7px", color: "#f7f6f3", fontSize: "11px", lineHeight: "1.55" }}>
            Tap <strong>Warm-Up</strong> before lifting. Tap <strong>Log</strong> on any exercise to record sets — the rest timer starts automatically. Tap <strong>Stretch</strong> when you're done to cool down. Tap ▼ for form cues.
          </div>
        </>
      )}

      {tab === "progress" && <NewProgressTab clientId={clientData?.id} bodyweight={clientData?.weight || 170} localLogs={logs} />}
      {tab === "body" && <MeasurementsTracker measurements={measurements} onSave={handleMeasurementsChange} />}
      {tab === "photos" && <PhotosTab photos={photos} onSave={handlePhotosChange} />}
      {tab === "history" && <HistoryTab logs={logs} activeSchedule={activeSchedule} />}
      {tab === "muscles" && <MuscleScience />}
      {tab === "alternatives" && (
        <AlternativeExercises
          clientEquipment={clientEquipment}
          clientInjuries={clientInjuries}
          onEquipmentChange={handleEquipmentChange}
          onInjuryChange={handleInjuryChange}
        />
      )}

      {tab === "goals" && <GoalTracker />}
      {tab === "monthly" && <MonthlyGoals />}
      {tab === "activity" && <ActivityLog />}
      {tab === "injury" && <InjuryAwareness />}
      {tab === "cycle" && <CycleTracking />}
      {tab === "health" && <HealthIntegration />}

      {tab === "guide" && (
        <div style={{ padding: "16px 16px 40px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "14px" }}>Training Guidelines</div>
          {principles.map((p, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "6px", marginBottom: "7px", overflow: "hidden" }}>
              <button onClick={() => setExpandedPrinciple(expandedPrinciple === i ? null : i)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "17px" }}>{p.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{p.title}</span>
                </div>
                <span style={{ color: "#ccc", fontSize: "12px" }}>{expandedPrinciple === i ? "▲" : "▼"}</span>
              </button>
              {expandedPrinciple === i && (
                <div style={{ padding: "0 14px 12px 40px", fontSize: "11px", color: "#444", lineHeight: "1.75", borderTop: "1px solid #f0f0f0", paddingTop: "10px" }}>
                  {p.body}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginTop: "10px", padding: "14px", background: "#111", borderRadius: "7px", color: "#f7f6f3" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#555", marginBottom: "6px" }}>The Big Picture</div>
            <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.8" }}>
              At 170 lbs with a 450 lb hip thrust and a 130 lb overhead press, there is already a strong foundation to build on. Every muscle gets hit twice a week at the right volume. The heaviest movements go first in every session. The core progression starts where it should — from the inside out. Unilateral work is targeted and purposeful. Progressive overload and consistent logging drive everything else. Measure monthly and the numbers will tell the story.
            </div>
          </div>
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
  );
}
