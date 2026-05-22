import { useState, useEffect, useCallback, useRef } from "react";
import SwapModal from "./components/SwapModal";
import { getSwaps } from "./data/swaps";
import { schedule as skylerSchedule } from "./data";
import { schedule as taraSchedule } from "./tara-data";
import { principles as taraPrinciples } from "./data/guide";
import { getAllNames } from "./data/exercises";
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
import SessionSummary from "./components/SessionSummary";
import RecoveryCard from "./components/RecoveryCard";
import HealthTab from "./components/HealthTab";
import HealthLogModal from "./components/HealthLogModal";
import { getRecoveryAssessment } from "./lib/recoveryEngine";
import { PRCelebration, OverloadSuggestions } from "./components/PRCelebration";
import MonthlyPrompt from "./components/MonthlyPrompt";
import DailyScripture from "./components/DailyScripture";
import PostWorkoutStretches from "./components/PostWorkoutStretches";
import { getWarmupForDay } from "./warmups";
import AlternativeExercises from "./components/AlternativeExercises";
import { getClientByToken } from "./lib/supabase";
import NewProgressTab from "./components/ProgressTab";
import PhotosTab from "./components/PhotosTab";
import WorkoutHistory from "./components/WorkoutHistory";
import TrackingTab from "./components/TrackingTab";
import ActivityLog from "./components/ActivityLog";
import CycleTracking from "./components/CycleTracking";
import HealthIntegration from "./components/HealthIntegration";
import NutritionTab from "./components/NutritionTab";
import BodyTab from "./components/BodyTab";
import ToolsTab from "./components/ToolsTab";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
function makeSessionKey(day, date) { return `${day}_${date}`; }

const categoryStyle = (cat) => {
  if (cat && cat.startsWith("Core")) return { bg: "#147a50", color: "#fff", short: cat.includes("Stage 1") ? "Core S1" : cat.includes("Stage 2") ? "Core S2" : "Core S3" };
  return { bg: "#333", color: "#fff", short: cat || "Exercise" };
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
// set.type: "normal" | "dropset" | "warmup"
// Detect equipment context from exercise name/data
function getWeightContext(exercise) {
  const name = (exercise.name || "").toLowerCase();
  const equip = (exercise.equipment || []).map(e => e.toLowerCase());

  if (exercise.bodyweight) return null; // no weight field

  // Smith Machine — always logs plates added only
  if (name.includes("smith machine") || name.includes("smith")) {
    return { label: "plates added", note: "Log the weight you added to the bar — do not include the bar itself. Smith machine bars vary by gym (typically 15–25 lbs) and are not comparable to free weight barbell data.", isSmith: true };
  }

  // Barbell exercises — log total bar + plates
  if (equip.includes("barbell") || name.includes("barbell") || name.includes("rdl") || name.includes("deadlift") || name.includes("bench press") || name.includes("squat") || name.includes("row") && equip.includes("barbell")) {
    return { label: "lbs (bar + plates)", note: "Log the total weight including the bar. Standard barbell = 45 lbs.", isSmith: false };
  }

  // Dumbbell exercises — log per dumbbell
  if (equip.includes("dumbbell") || name.includes("dumbbell") || name.includes("db ") || name.startsWith("db ") || name.includes(" db ")) {
    return { label: "lbs per dumbbell", note: "Log the weight of one dumbbell, not the combined total. If you used 25s, log 25.", isSmith: false };
  }

  // Cable exercises — log the stack weight
  if (equip.includes("cable") || name.includes("cable") || name.includes("pulldown") || name.includes("pushdown")) {
    return { label: "lbs (stack)", note: "Log the stack weight shown on the cable machine.", isSmith: false };
  }

  // Machine exercises — log the pin weight
  if (equip.includes("machine") || name.includes("machine") || name.includes("leg press") || name.includes("leg curl") || name.includes("leg extension") || name.includes("hip thrust machine") || name.includes("hip abduction")) {
    return { label: "lbs (pin weight)", note: "Log the weight shown on the machine plate selector.", isSmith: false };
  }

  // Default — just lbs
  return { label: "lbs", note: null, isSmith: false };
}

function SetLogger({ exercise, sessionKey, logs, onLogsChange, accent = '#555', color = '#f5f5f3', onSetDone, prs }) {
  const exKey = `${sessionKey}__${exercise.name}`;
  const weightCtx = getWeightContext(exercise);
  const exLog = logs[exKey] || { sets: [], notes: "" };

  function updateLog(updated) { onLogsChange({ ...logs, [exKey]: updated }); }

  function addSet(type = "normal") {
    const prev = exLog.sets.filter(s => s.type !== "dropset").slice(-1)[0];
    const dropPrev = exLog.sets[exLog.sets.length - 1];
    // Drop sets pre-fill slightly lighter than previous drop or parent set
    const baseWeight = type === "dropset"
      ? (dropPrev?.weight ? String(Math.max(0, parseFloat(dropPrev.weight) - 10)) : "")
      : (prev?.weight || "");
    updateLog({ ...exLog, sets: [...exLog.sets, { weight: baseWeight, reps: prev?.reps || "", done: false, type }] });
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
      if (set.weight && set.type !== "warmup") {
        const w = parseFloat(set.weight);
        const r = parseInt(set.reps);
        const prevPR = prs[exercise.name];
        const isPR = !prevPR || w > prevPR.weight || (w === prevPR.weight && r > prevPR.reps);
        onSetDone && onSetDone({ exercise: exercise.name, weight: w, reps: r, isPR, rest: set.type === "dropset" ? "0 sec" : exercise.rest, setNumber: i + 1 });
      }
    } else if (newDone && exercise.bodyweight && set.reps) {
      onSetDone && onSetDone({ exercise: exercise.name, weight: 0, reps: parseInt(set.reps), isPR: false, rest: exercise.rest, setNumber: i + 1, bodyweight: true });
    } else if (!newDone) {
      const remainingDone = newSets.filter(s => s.done && s.weight && s.reps && s.type !== "warmup");
      if (remainingDone.length > 0) {
        const bestWeight = Math.max(...remainingDone.map(s => parseFloat(s.weight)));
        const bestReps = Math.max(...remainingDone.filter(s => parseFloat(s.weight) === bestWeight).map(s => parseInt(s.reps)));
        onSetDone && onSetDone({ exercise: exercise.name, weight: bestWeight, reps: bestReps, isPR: true, rest: exercise.rest, setNumber: i + 1, recalculate: true });
      } else {
        onSetDone && onSetDone({ exercise: exercise.name, weight: 0, reps: 0, isPR: false, rest: exercise.rest, setNumber: i + 1, cleared: true });
      }
    }
  }

  function removeSet(i) {
    updateLog({ ...exLog, sets: exLog.sets.filter((_, idx) => idx !== i) });
  }

  const doneSets = exLog.sets.filter(s => s.done).length;
  const workingSets = exLog.sets.filter(s => s.type !== "warmup");

  // ── Progressive overload target — pulled from previous session logs ──────────
  const overloadTarget = (() => {
    if (exercise.bodyweight || exercise.category === "Recovery") return null;
    // Smith Machine data is not comparable to free weight — skip 1RM-based suggestions
    if (weightCtx?.isSmith) return null;
    const repRange = exercise.reps || "8-12";
    const rangeParts = repRange.split(/[–\-]/);
    const rangeMax = parseInt(rangeParts[1]) || parseInt(rangeParts[0]) || 12;
    const rangeMin = parseInt(rangeParts[0]) || 8;
    const targetSets = parseInt(exercise.sets || 3);

    // Find most recent previous session for this exercise
    const prevEntries = Object.entries(logs)
      .filter(([k]) => k.includes(`__${exercise.name}`) && k !== exKey)
      .map(([k, v]) => {
        const done = (v.sets || []).filter(s => s.done && s.weight && s.reps && s.type !== "warmup");
        if (!done.length) return null;
        const datePart = k.split("__")[0].split("_").slice(1).join("-");
        const maxW = Math.max(...done.map(s => parseFloat(s.weight)));
        const avgR = Math.round(done.reduce((a, s) => a + parseInt(s.reps), 0) / done.length);
        return { date: datePart, maxW, avgR, sets: done.length };
      })
      .filter(Boolean)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (!prevEntries.length) return null;
    const prev = prevEntries[0];
    const increment = prev.maxW >= 100 ? 5 : 2.5;

    if (prev.avgR >= rangeMax && prev.sets >= targetSets) {
      return { text: `↑ ${prev.maxW + increment} lbs × ${rangeMin}–${rangeMin + 2}`, type: "increase", prev: `Last: ${prev.maxW} lbs × ${prev.avgR} avg reps` };
    }
    if (prev.avgR < rangeMin - 1) {
      return { text: `↓ ${Math.max(prev.maxW - increment, increment)} lbs × ${rangeMin}–${rangeMax}`, type: "drop", prev: `Last: ${prev.maxW} lbs × ${prev.avgR} avg reps` };
    }
    if (prev.sets < targetSets) {
      return { text: `${prev.maxW} lbs × ${targetSets} sets`, type: "hold", prev: `Last: ${prev.sets}/${targetSets} sets completed` };
    }
    return { text: `${prev.maxW} lbs × ${Math.min(prev.avgR + 1, rangeMax)} reps`, type: "reps", prev: `Last: ${prev.maxW} lbs × ${prev.avgR} avg reps` };
  })();

  const targetColors = { increase: "#2d7a1e", drop: "#a02020", hold: "#c47a0a", reps: "#1d6fa8" };

  return (
    <div style={{ marginTop: "10px", background: "#f9f9f7", borderRadius: "8px", overflow: "hidden", border: "1px solid #e8e8e8" }}>
      {/* Header: target + controls */}
      <div style={{ padding: "8px 12px", background: "#f5f5f3", borderBottom: "1px solid #e8e8e8" }}>
        {overloadTarget && (
          <div style={{ marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: targetColors[overloadTarget.type] || "#555" }}>
              Target: {overloadTarget.text}
            </div>
            <div style={{ fontSize: "9px", color: "#bbb" }}>{overloadTarget.prev}</div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "11px", fontWeight: "600", color: "#555" }}>
            {exLog.sets.length > 0 ? `${doneSets}/${exLog.sets.length} done` : "Log sets"}
            {exLog.sets.some(s => s.type === "dropset") && <span style={{ color: "#7a3aa0", marginLeft: "6px", fontSize: "10px" }}>drop set</span>}
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={() => addSet("warmup")} style={{ background: "#f0f0f0", color: "#888", border: "none", borderRadius: "20px", padding: "3px 9px", fontSize: "10px", cursor: "pointer" }}>
              W
            </button>
            <button onClick={() => addSet("normal")} style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
              + Set
            </button>
          </div>
        </div>
      </div>

      {/* Column headers */}
      {exLog.sets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: exercise.bodyweight ? "20px 20px 1fr 34px 20px" : "20px 20px 1fr 1fr 34px 20px", gap: "4px", padding: "5px 12px 2px" }}>
          {(exercise.bodyweight
            ? ["", "", "Reps", "✓", ""]
            : ["", "", weightCtx?.label || "Weight", "Reps", "✓", ""]
          ).map((h, i) => (
            <span key={i} style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>{h}</span>
          ))}
        </div>
      )}

      {/* Set rows */}
      {exLog.sets.map((set, i) => {
        const isWarmup = set.type === "warmup";
        const isDrop = set.type === "dropset";
        const rowBg = set.done ? "#e8f5e9" : isWarmup ? "#fafaf0" : isDrop ? "#f8f5fc" : "transparent";
        const labelColor = isWarmup ? "#bbb" : isDrop ? "#7a3aa0" : "#aaa";
        const labelText = isWarmup ? "W" : isDrop ? "↓" : String(workingSets.indexOf(set) + 1);

        return (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: exercise.bodyweight ? "20px 20px 1fr 34px 20px" : "20px 20px 1fr 1fr 34px 20px",
            gap: "4px", padding: "3px 12px",
            background: rowBg, alignItems: "center", borderBottom: "1px solid #f0f0f0",
          }}>
            {/* Set type label */}
            <span style={{ fontSize: "10px", color: labelColor, textAlign: "center", fontWeight: isDrop ? "700" : "400" }}>{labelText}</span>

            {/* Drop set button — appears after each normal done set */}
            <button
              onClick={() => addSet("dropset")}
              title="Add drop set"
              style={{ width: "16px", height: "16px", borderRadius: "50%", background: isDrop ? "#7a3aa0" : "#f0f0f0", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: isDrop ? "#fff" : "#bbb", padding: 0 }}>
              ↓
            </button>

            {!exercise.bodyweight && (
              <input type="number" inputMode="decimal" placeholder={isWarmup ? "warm" : (weightCtx?.isSmith ? "plates" : "lbs")} value={set.weight}
                onChange={e => updateSet(i, "weight", e.target.value)}
                style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid " + (isWarmup ? "#e8e8c0" : isDrop ? "#e0d0f0" : "#ddd"), fontSize: "13px", textAlign: "center", background: set.done ? "rgba(45,122,30,0.08)" : "#fff", color: "#1a1a1a", ...F, opacity: isWarmup ? 0.7 : 1 }} />
            )}
            <input type="number" inputMode="numeric" placeholder={exercise.bodyweight ? "reps" : isWarmup ? "reps" : "reps"} value={set.reps}
              onChange={e => updateSet(i, "reps", e.target.value)}
              style={{ width: "100%", padding: "6px", borderRadius: "5px", border: "1px solid " + (isWarmup ? "#e8e8c0" : isDrop ? "#e0d0f0" : "#ddd"), fontSize: "13px", textAlign: "center", background: set.done ? "rgba(45,122,30,0.08)" : "#fff", color: "#1a1a1a", ...F, opacity: isWarmup ? 0.7 : 1 }} />
            <button onClick={() => toggleDone(i)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: `2px solid ${set.done ? "#2d7a1e" : isWarmup ? "#ddd" : "#ddd"}`, background: set.done ? "#2d7a1e" : "transparent", color: set.done ? "#fff" : "#ccc", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✓</button>
            <button onClick={() => removeSet(i)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "16px", cursor: "pointer" }}>×</button>
          </div>
        );
      })}

      {exLog.sets.length === 0 && (
        <div style={{ padding: "12px", textAlign: "center", color: "#bbb", fontSize: "11px" }}>Tap "+ Set" to start logging · "W" for a warm-up set</div>
      )}

      {weightCtx?.note && (
        <div style={{ padding: "4px 12px 2px", fontSize: "9px", color: weightCtx.isSmith ? "#c47a0a" : "#bbb", lineHeight: "1.6", background: weightCtx.isSmith ? "#fffbea" : "transparent" }}>
          {weightCtx.isSmith && "Note: "}{weightCtx.note}
        </div>
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

function CardioSwapCard({ sessionType, cardio, sessionKey, onLog }) {
  const F = { fontFamily: "'Georgia','Times New Roman',serif" };
  const [logged, setLogged] = useState(false);
  const [showAlts, setShowAlts] = useState(false);
  const [selected, setSelected] = useState(null);

  // Use day's own cardio as primary — only fall back to CARDIO_OPTIONS if none
  const primary = cardio || CARDIO_OPTIONS.find(o => o.bestFor.includes(sessionType)) || CARDIO_OPTIONS[2];
  const display = selected || primary;

  function handleMarkDone() {
    setLogged(true);
    onLog && onLog({ type: selected?.id || 'cardio', name: display.name, duration: display.protocol?.match(/\d+/)?.[0] || 20 });
    setShowAlts(false);
  }

  function handleSelect(option) {
    setSelected(option);
    setShowAlts(false);
  }

  return (
    <div style={{ borderBottom: "1px solid #ebebeb", background: logged ? "#f0f7f0" : "#f9f9f7" }}>
      <div style={{ padding: "11px 16px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: logged ? "#2d7a1e" : "#e8e8e8", color: logged ? "#fff" : "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
          {logged ? "✓" : "Z2"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>
            {display.zone || "Cardio"} · {display.protocol?.match(/(\d+)\s*min/)?.[1] || 20} min
          </div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "3px" }}>{display.name}</div>
          <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.5", marginBottom: "5px", ...F }}>{display.protocol}</div>
          {display.feel && <div style={{ fontSize: "10px", color: "#888", lineHeight: "1.5", fontStyle: "italic", ...F }}>{display.feel}</div>}
          {!logged && (
            <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
              <button onClick={handleMarkDone}
                style={{ background: "#111", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
                Mark done
              </button>
              <button onClick={() => setShowAlts(p => !p)}
                style={{ background: "none", border: "none", color: "#aaa", fontSize: "10px", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                {showAlts ? "Close" : "Switch"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showAlts && (
        <div style={{ padding: "0 16px 12px 51px" }}>
          {CARDIO_OPTIONS.map(option => (
            <button key={option.id} onClick={() => handleSelect(option)}
              style={{ width: "100%", textAlign: "left", background: selected?.id === option.id ? "#f0f4ff" : "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "9px 12px", marginBottom: "5px", cursor: "pointer" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1a1a1a", marginBottom: "2px", ...F }}>{option.name}</div>
              <div style={{ fontSize: "10px", color: "#888" }}>{option.protocol}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App({ clientData, adaptedSchedule, onSignOut }) {
  // Client IDs are stable and set by the coach in Supabase
  // Only these two clients have hardcoded programs — all others wait for a coach-built plan
  const TARA_ID    = "fa2b1f9e-ed1e-4b7a-b2a3-def60932e2f5";
  const SKYLER_ID  = "f1f04d99-76ec-477f-938f-ebfb456b1d88";
  const clientId   = clientData?.id || "";

  const defaultSchedule =
    clientId === TARA_ID   ? taraSchedule   :
    clientId === SKYLER_ID ? skylerSchedule :
    null; // all other clients: no program until coach assigns one

  // All clients use the shared training guide
  const defaultPrinciples = taraPrinciples;

  // Use DB-assigned plan if present, then client-specific default, then nothing
  const activeSchedule = adaptedSchedule || defaultSchedule;
  const hasPlan = !!activeSchedule;
  const principles = defaultPrinciples;

  const [activeDay, setActiveDay] = useState(() => {
    if (!activeSchedule) return 0;
    const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const idx = activeSchedule.findIndex(d => d.day === days[new Date().getDay()]);
    return idx >= 0 ? idx : 0;
  });
  const [tab, setTab] = useState("plan");
  const [expandedEx, setExpandedEx] = useState(null);
  const [swappedExercises, setSwappedExercises] = useState({}); // { originalName: swapObj }
  const [activeSwapModal, setActiveSwapModal] = useState(null); // exercise object
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
  const [sessionSkipped, setSessionSkipped] = useState({});  // { [sessionDate]: { reason, skipped } }
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | synced | failed
  const [syncFailedSets, setSyncFailedSets] = useState([]); // sets that failed to save
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'class', description: '', duration: '' });

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
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // PR celebration state
  const [prCelebration, setPRCelebration] = useState(null); // { exercise, weight, reps }

  // Monthly prompt — show if we haven't shown this month
  const [showMonthlyPrompt, setShowMonthlyPrompt] = useState(() => {
    const prompt = loadMonthlyPrompt();
    const month = thisMonth();
    return prompt.lastShownMonth !== month;
  });

  const current = activeSchedule ? activeSchedule[activeDay] : null;
  const sessionKey = current ? makeSessionKey(current.day, sessionDate) : "";
  const todayKey = new Date().toISOString().slice(0, 10);
  const warmup = current ? getWarmupForDay(current.type) : [];

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
        if (latest) {
          await logMeasurement(clientData.id, {
            measured_at: latest.measured_at || latest.date || new Date().toISOString().slice(0,10),
            weight_lbs: latest.weight_lbs || null,
            waist_in: latest.waist_in || null,
            chest_in: latest.chest_in || null,
            hips_in: latest.hips_in || null,
            right_thigh_in: latest.right_thigh_in || null,
            left_thigh_in: latest.left_thigh_in || null,
            right_arm_in: latest.right_arm_in || null,
            left_arm_in: latest.left_arm_in || null,
            body_fat_pct: latest.body_fat_pct || null,
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

  // Seed logs + PRs from Supabase when client loads — so overload engine has full history
  // across all devices, not just the current device's localStorage
  useEffect(() => {
    if (!clientData?.id) return;
    let cancelled = false;
    async function seedFromSupabase() {
      try {
        const { getClientLogs, getClientPRs, getClientMeasurements } = await import("./lib/supabase");
        const [logsResult, prResult, measResult] = await Promise.all([
          getClientLogs(clientData.id, 1000),
          getClientPRs(clientData.id),
          getClientMeasurements(clientData.id),
        ]);
        if (cancelled) return;

        // Convert Supabase log rows into the format the overload engine reads
        // Key format: HIST_{date}__{ExerciseName} — the HIST_ prefix lets us
        // distinguish these from current-session logs without overwriting them
        if (logsResult?.data?.length > 0) {
          const supabaseLogs = {};
          logsResult.data.forEach(row => {
            const exName = row.exercises?.name || row.exercise_name;
            if (!exName || !row.session_date) return;
            const key = `HIST_${row.session_date}__${exName}`;
            if (!supabaseLogs[key]) supabaseLogs[key] = { sets: [], date: row.session_date };
            supabaseLogs[key].sets.push({
              weight: row.weight_lbs ? String(row.weight_lbs) : "",
              reps: row.reps ? String(row.reps) : "",
              done: true,
              type: "normal",
              isPR: row.is_pr || false,
              note: row.client_note || "",
              supabaseId: row.id || null,
            });
          });
          // Merge: localStorage (current session) takes priority over history
          setLogs(prev => ({ ...supabaseLogs, ...prev }));
        }

        // Seed PRs from Supabase
        if (prResult?.data?.length > 0) {
          const supabasePRs = {};
          prResult.data.forEach(pr => {
            const name = pr.exercises?.name || pr.exercise_name;
            if (name) supabasePRs[name] = { weight: pr.weight_lbs, reps: pr.reps, date: pr.achieved_at };
          });
          setPRs(prev => ({ ...supabasePRs, ...prev }));
        }

        // Seed measurements from Supabase into localStorage so BodyTab sees them
        if (measResult?.data?.length > 0) {
          saveMeasurements(measResult.data);
          setMeasurements(measResult.data);
        }

      } catch(e) { console.warn("Supabase seed failed:", e); }
    }
    seedFromSupabase();
    return () => { cancelled = true; };
  }, [clientData?.id]);

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
    if (clientData && clientData.id && !cleared) {
      setSyncStatus("syncing");
      try {
        const { logSet, upsertPR, getAllExercises } = await import("./lib/supabase");
        const exObj = current?.exercises && current.exercises.find(function(e) { return e.name === exercise; });

        // Try to get exercise_id from the plan exercise first,
        // then fall back to looking it up by name in the exercises table
        let exId = exObj && exObj.exercise_id;
        if (!exId) {
          const { data: allEx } = await getAllExercises();
          const found = allEx && allEx.find(function(e) { return e.name === exercise; });
          exId = found && found.id;
        }

        // Log the set — with or without an exercise_id
        // We never silently drop a set just because the ID lookup failed
        const { data: logRow } = await logSet(clientData.id, {
          exercise_id: exId || null,
          exercise_name: !exId ? exercise : null, // fallback name if no ID
          plan_exercise_id: (exObj && exObj.plan_exercise_id) || null,
          plan_day_id: current?.plan_day_id || null,
          session_date: sessionDate,
          set_number: setNumber || 1,
          weight_lbs: bodyweight ? null : weight,
          reps: reps,
          completed: true,
          is_pr: isPR && !bodyweight && !recalculate ? true : false,
        });

        // Store log row ID in local state so notes can be saved later
        if (logRow?.id) {
          const exKey = `${sessionKey}__${exercise}`;
          setLogs(prev => {
            const exLog = prev[exKey] || { sets: [] };
            const setIdx = (setNumber || 1) - 1;
            const updatedSets = exLog.sets.map((s, i) => i === setIdx ? { ...s, supabaseId: logRow.id } : s);
            const updated = { ...prev, [exKey]: { ...exLog, sets: updatedSets } };
            saveWorkoutLogs(updated);
            return updated;
          });
        }

        if (isPR && exId && !bodyweight && !recalculate) {
          await upsertPR(clientData.id, exId, weight, reps);
        }
        setSyncStatus("synced");
      } catch (err) {
        console.warn("Supabase log failed (set saved locally):", err.message);
        setSyncStatus("failed");
        setSyncFailedSets(prev => [...prev, { exercise, weight, reps, setNumber, sessionDate }]);
      }
    }
  }

  // Retry any sets that failed to save to Supabase
  async function retrySyncFailed() {
    if (!syncFailedSets.length || !clientData?.id) return;
    setSyncStatus("syncing");
    const { logSet, getAllExercises } = await import("./lib/supabase");
    const { data: allEx } = await getAllExercises();
    let allGood = true;
    for (const s of syncFailedSets) {
      try {
        const found = allEx?.find(e => e.name === s.exercise);
        await logSet(clientData.id, {
          exercise_id: found?.id || null,
          exercise_name: !found ? s.exercise : null,
          session_date: s.sessionDate,
          set_number: s.setNumber || 1,
          weight_lbs: s.weight || null,
          reps: s.reps,
          completed: true,
          is_pr: false,
        });
      } catch (e) {
        allGood = false;
      }
    }
    if (allGood) { setSyncFailedSets([]); setSyncStatus("synced"); }
    else setSyncStatus("failed");
  }

  // When PR celebration closes, start the rest timer
  function handlePRDismiss() {
    const ex = current?.exercises?.find(e => e.name === prCelebration?.exercise);
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

  const completedExercises = current?.exercises?.filter(ex => {
    const exLog = logs[`${sessionKey}__${ex.name}`];
    return exLog?.sets?.some(s => s.done);
  }).length || 0;
  const trackableCount = current?.exercises?.filter(ex => ex.category !== "Recovery" && ex.category !== "Mobility").length || 0;

  const tabs = [
    ["plan","Plan"],
    ["progress","Progress"],
    ["body","Body"],
    ["nutrition","Nutrition"],
    ...(clientData?.sex === "female" ? [["cycle","Cycle"]] : []),
    ["tools","Tools"],
  ];

  // Monthly prompt modal
  if (showMonthlyPrompt && tab === "plan" && current) {
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
        <PostWorkoutStretches muscles={current?.muscles || []} onDone={() => setShowStretches(false)} />
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
          {/* No plan assigned yet */}
          {!hasPlan && (
            <div style={{ padding: "60px 24px", textAlign: "center" }}>
              
              <div style={{ fontSize: "20px", fontWeight: "normal", ...F, color: "#111", marginBottom: "10px" }}>
                Your plan is on its way
              </div>
              <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.8", ...F, maxWidth: "280px", margin: "0 auto 24px" }}>
                Your coach is reviewing your intake and building your personalized program. You'll see your full workout plan here as soon as it's ready.
              </div>
              <div style={{ background: "#f5f5f3", borderRadius: "10px", padding: "16px 20px", display: "inline-block", textAlign: "left", maxWidth: "280px" }}>
                <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>What happens next</div>
                {["Your intake has been submitted", "Coach reviews your goals & data", "Your custom program is built", "Plan appears here — ready to go"].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: i === 0 ? "#2d7a1e" : "#e8e8e8", color: i === 0 ? "#fff" : "#bbb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: "700", flexShrink: 0 }}>
                      {i === 0 ? "✓" : i + 1}
                    </div>
                    <div style={{ fontSize: "12px", color: i === 0 ? "#2d7a1e" : "#888" }}>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan exists — show full UI */}
          {hasPlan && (
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
          <div style={{ background: "linear-gradient(135deg, #2c2c2e 0%, #1c1c1e 100%)", borderBottom: "1px solid #3a3a3c", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#6e6e73", marginBottom: "3px" }}>
                  {current.day} · {current.muscles.join(", ") || "Recovery"}
                </div>
                <div style={{ fontSize: "17px", color: "#f5f5f7", fontWeight: "normal" }}>{current.focus}</div>
              </div>
              {trackableCount > 0 && (
                <div style={{ flexShrink: 0, marginLeft: "12px", textAlign: "right" }}>
                  {completedExercises === trackableCount && completedExercises > 0 ? (
                    <button onClick={() => setShowSessionSummary(true)} style={{ background: "#2d7a1e", color: "#fff", border: "none", borderRadius: "7px", padding: "7px 14px", fontSize: "11px", cursor: "pointer", fontWeight: "600" }}>
                      Finish
                    </button>
                  ) : (
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: completedExercises > 0 ? "#34c759" : "#555", lineHeight: 1 }}>{completedExercises}/{trackableCount}</div>
                      <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>done</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid #3a3a3c", fontSize: "10px", background: "rgba(255,255,255,0.04)", color: "#6e6e73", ...F }} />
              {clientData?.id && syncStatus === "syncing" && <span style={{ fontSize: "9px", color: "#6e6e73" }}>Saving...</span>}
              {syncStatus === "failed" && (
                <button onClick={retrySyncFailed} style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "5px", background: "rgba(255,59,48,0.12)", color: "#ff3b30", border: "1px solid rgba(255,59,48,0.25)", cursor: "pointer" }}>
                  Retry save
                </button>
              )}
            </div>
          </div>

          {/* Warm-up strip — sits above exercises, visible and tappable */}
          {current.type !== "rest" && (
            <button
              onClick={() => setShowWarmup(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(196,122,10,0.08)",
                border: "none",
                borderBottom: "1px solid rgba(196,122,10,0.15)",
                padding: "10px 16px",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c47a0a" }}>
                  Warm-Up
                </span>
                <span style={{ fontSize: "10px", color: "rgba(196,122,10,0.6)", marginLeft: "8px" }}>
                  5–8 min · start here
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "#c47a0a", opacity: 0.7 }}>View →</span>
            </button>
          )}

          {/* Exercises */}
          <div style={{ position: "relative" }}>
            {sessionSkipped[sessionDate] && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(247,246,243,0.7)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", padding: "14px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <div style={{ fontSize: "13px", color: "#aaa", ...F }}>Session skipped</div>
                </div>
              </div>
            )}
            {(() => {
              // Group exercises — identify superset pairs
              const renderedGroups = new Set();
              return current.exercises.map((ex, i) => {
                const pairIdx = ex.superset_group
                  ? current.exercises.findIndex((e, j) => j !== i && e.superset_group === ex.superset_group)
                  : -1;
                const isFirstOfPair = pairIdx > i;
                const isSecondOfPair = pairIdx !== -1 && pairIdx < i;
                const pairEx = pairIdx !== -1 ? current.exercises[pairIdx] : null;

              const isOpen = expandedEx === i;
              const logOpen = showLogger[ex.name];
              const cs = categoryStyle(ex.category);
              const exKey = `${sessionKey}__${ex.name}`;
              const exLog = logs[exKey];
              const doneSets = exLog?.sets?.filter(s => s.done).length || 0;
              const supersetLabel = ex.superset_group ? `SS-${ex.superset_group}` : null;
              const totalLogged = exLog?.sets?.length || 0;
              const isStarted = totalLogged > 0;
              const hasPR = !!prs[ex.name];

              return (
                <div key={i} style={{ borderBottom: "1px solid #ebebeb", background: "#fff", borderLeft: `3px solid ${doneSets > 0 ? "#34c759" : cs.bg === "#1a1a1a" ? "#e0e0e0" : cs.bg}` }}>
                  <div style={{ padding: "11px 13px 11px 14px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: doneSets > 0 ? "#34c759" : cs.bg === "#1a1a1a" ? "#ebebeb" : cs.bg + "22", color: doneSets > 0 ? "#fff" : cs.bg === "#1a1a1a" ? "#888" : cs.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "800", flexShrink: 0, marginTop: "1px" }}>
                      {doneSets > 0 ? "✓" : ex.order}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
                        {hasPR && <span style={{ fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "2px 6px", borderRadius: "3px", marginRight: "2px" }}>PR</span>}
                        {swappedExercises[ex.name] ? (
                          <span>
                            <span style={{ textDecoration: "line-through", color: "#bbb", fontSize: "11px" }}>{ex.name}</span>
                            <span style={{ display: "block", color: "#111" }}>{swappedExercises[ex.name].name}</span>
                          </span>
                        ) : ex.name}
                        {swappedExercises[ex.name] && (
                          <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#2563a8", color: "#fff", padding: "2px 6px", borderRadius: "3px" }}>Swapped</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", background: cs.bg === "#1a1a1a" ? "#f0f0f0" : cs.bg + "18", color: cs.bg === "#1a1a1a" ? "#444" : cs.bg, padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{ex.sets} × {ex.reps}</span>
                        {ex.rest !== "—" && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{ex.rest} rest</span>}
                        {isStarted && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "20px", background: doneSets > 0 ? "rgba(52,199,89,0.1)" : "#f0f0f0", color: doneSets > 0 ? "#1a7a35" : "#999" }}>{doneSets}/{totalLogged} done</span>}
                        {ex.imbalanceNote && <span style={{ fontSize: "8px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 6px", borderRadius: "3px", background: "rgba(217,119,6,0.08)", color: "#b45309", border: "1px solid rgba(217,119,6,0.2)" }}>Imbalance</span>}
                      </div>
                      {ex.muscles && ex.muscles.length > 0 && (
                        <div style={{ fontSize: "10px", color: "#bbb", marginTop: "4px", display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ color: "#aaa" }}>{ex.muscles.join(" · ")}</span>
                          {ex.category && ex.category !== "Recovery" && ex.category !== "Mobility" && (
                            <span style={{ color: cs.bg === "#1a1a1a" ? "#d0d0d0" : cs.bg + "99", fontSize: "9px", letterSpacing: "0.06em" }}>
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
                    <div style={{ display: "flex", flexDirection: "row", gap: "5px", flexShrink: 0, alignItems: "center" }}>
                      {ex.category !== "Recovery" && ex.category !== "Mobility" && (
                        <button onClick={() => setShowLogger(p => ({ ...p, [ex.name]: !p[ex.name] }))} style={{ background: logOpen ? "#1a1a1a" : "transparent", color: logOpen ? "#fff" : "#555", border: "1px solid #d0d0d0", borderRadius: "5px", padding: "5px 10px", fontSize: "10px", cursor: "pointer", ...F }}>
                          {logOpen ? "Hide" : "Log"}
                        </button>
                      )}
                      {getSwaps(ex.name).length > 0 && (
                        <button onClick={() => setActiveSwapModal(ex)} title="Swap exercise" style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "5px", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "5px 7px", lineHeight: 1 }}>
                          ⇄
                        </button>
                      )}
                      <button onClick={() => setExpandedEx(isOpen ? null : i)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "12px", cursor: "pointer", padding: "4px 2px", lineHeight: 1 }}>
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
            });
            })()}
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
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center" }}>
                          {ex.superset_group && (
                            <span style={{ fontSize: "9px", background: "#f3eafa", color: "#7a3aa0", padding: "2px 7px", borderRadius: "20px", fontWeight: "700", letterSpacing: "0.06em" }}>Superset</span>
                          )}
                          <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#333", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{ex.sets} × {ex.reps}</span>
                          {ex.rest !== "—" && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{ex.rest} rest</span>}
                          {totalLogged > 0 && <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "20px", background: doneSets > 0 ? "#e8f5e9" : "#f0f0f0", color: doneSets > 0 ? "#2d7a1e" : "#999" }}>{doneSets}/{totalLogged} done</span>}
                          <span style={{ fontSize: "9px", color: "#bbb", padding: "2px 7px", background: "#f5f5f3", borderRadius: "20px" }}>Bodyweight</span>
                        </div>
                        {ex.muscles && <div style={{ fontSize: "10px", color: "#bbb", marginTop: "4px" }}>{ex.muscles.join(" · ")}</div>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "row", gap: "5px", flexShrink: 0, alignItems: "center" }}>
                        <button onClick={() => setShowLogger(p => ({ ...p, [`cf-${ex.name}`]: !p[`cf-${ex.name}`] }))} style={{ background: logOpen ? "#1a1a1a" : "transparent", color: logOpen ? "#fff" : "#555", border: "1px solid #d0d0d0", borderRadius: "5px", padding: "5px 10px", fontSize: "10px", cursor: "pointer", ...F }}>
                          {logOpen ? "Hide" : "Log"}
                        </button>
                        {getSwaps(ex.name).length > 0 && (
                          <button onClick={() => setActiveSwapModal(ex)} title="Swap exercise" style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "5px", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "5px 7px", lineHeight: 1 }}>
                            ⇄
                          </button>
                        )}
                        <button onClick={() => setExpandedEx(isOpen ? null : `cf-${i}`)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "12px", cursor: "pointer", padding: "4px 2px", lineHeight: 1 }}>
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

          {/* Post-lift cardio — same card format as exercises */}
          {current.cardio && current.type !== "rest" && (() => {
            const cardio = current.cardio;
            const cardioEx = { name: cardio.name, sets: "1", reps: cardio.protocol, rest: "—", bodyweight: true, muscles: ["Cardio"], category: "Cardio" };
            const cardioKey = `cf-${cardio.name}`;
            const logOpen = showLogger[cardioKey];
            const isOpen = expandedEx === `cardio-0`;
            const cardioSwaps = getSwaps(cardio.name);
            return (
              <div style={{ marginTop: "4px" }}>
                <div style={{ padding: "6px 16px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
                  <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Cardio</span>
                  <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
                </div>
                <div style={{ borderBottom: "1px solid #ebebeb", background: "#fff" }}>
                  <div style={{ padding: "11px 16px", display: "flex", gap: "11px", alignItems: "flex-start" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#4a8fff22", color: "#4a8fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>
                      🏃
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "4px" }}>{cardio.name}</div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "10px", background: "#eff6ff", color: "#2563a8", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{cardio.protocol}</span>
                        {cardio.zone && <span style={{ fontSize: "9px", color: "#999", padding: "2px 7px", background: "#f0f0f0", borderRadius: "20px" }}>{cardio.zone}</span>}
                      </div>
                      {cardio.feel && <div style={{ fontSize: "11px", color: "#777", marginTop: "5px", lineHeight: "1.5", fontStyle: "italic" }}>"{cardio.feel}"</div>}
                    </div>
                    <div style={{ display: "flex", flexDirection: "row", gap: "5px", flexShrink: 0, alignItems: "center" }}>
                      {cardioSwaps.length > 0 && (
                        <button onClick={() => setActiveSwapModal(cardioEx)} title="Swap cardio" style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "5px", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "5px 7px", lineHeight: 1 }}>
                          ⇄
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Overload suggestions */}
          <OverloadSuggestions
            sessionExercises={current?.exercises}
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

          {/* Daily check-in — single button, opens bottom sheet */}
          {(() => {
            const todayKey = sessionDate;
            const logged = dailyHealth[todayKey]?.logged;
            return (
              <div style={{ margin: "8px 16px 4px" }}>
                {logged ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "#f5f5f3", borderRadius: "7px" }}>
                    <span style={{ fontSize: "11px", color: "#888" }}>
                      {dailyHealth[todayKey]?.sleep_hours ? `${dailyHealth[todayKey].sleep_hours}h sleep` : ""}
                      {dailyHealth[todayKey]?.sleep_hours && dailyHealth[todayKey]?.steps ? "  ·  " : ""}
                      {dailyHealth[todayKey]?.steps ? `${parseInt(dailyHealth[todayKey].steps).toLocaleString()} steps` : ""}
                      {!dailyHealth[todayKey]?.sleep_hours && !dailyHealth[todayKey]?.steps ? "Day logged" : ""}
                    </span>
                    <button onClick={() => setShowHealthLog(true)} style={{ fontSize: "10px", color: "#aaa", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Edit</button>
                  </div>
                ) : (
                  <button onClick={() => setShowHealthLog(true)} style={{ width: "100%", background: "none", border: "1px dashed #ddd", borderRadius: "7px", padding: "9px 14px", cursor: "pointer", color: "#bbb", fontSize: "11px", textAlign: "left", ...F }}>
                    + Log your day
                  </button>
                )}
              </div>
            );
          })()}

          {/* Daily check-in bottom sheet */}
          {showHealthLog && (() => {
            const todayKey = sessionDate;
            const existing = dailyHealth[todayKey] || {};
            return (
              <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end" }}
                onClick={e => e.target === e.currentTarget && setShowHealthLog(false)}>
                <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 16px 40px", width: "100%", maxWidth: 640, margin: "0 auto", boxSizing: "border-box" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", ...F }}>How was your day?</div>
                    <button onClick={() => setShowHealthLog(false)} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#bbb" }}>×</button>
                  </div>

                  {/* Quick-tap energy */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "10px", color: "#999", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Energy level</div>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {["Low", "Okay", "Good", "Great"].map((label, i) => {
                        const val = [3, 5, 7, 9][i];
                        const sel = existing.energy_level === val;
                        return (
                          <button key={label} onClick={() => {
                            const updated = { ...dailyHealth, [todayKey]: { ...(dailyHealth[todayKey] || {}), energy_level: val } };
                            setDailyHealth(updated);
                            try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}
                          }} style={{ flex: 1, padding: "8px 4px", borderRadius: "6px", border: "1px solid " + (sel ? "#1a1a1a" : "#e0e0e0"), background: sel ? "#1a1a1a" : "#fff", color: sel ? "#fff" : "#555", fontSize: "11px", cursor: "pointer", ...F }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Number fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    {[
                      { key: "sleep_hours", label: "Sleep (hours)", placeholder: "e.g. 7.5", step: "0.5", hint: "goal: 8 hrs" },
                      { key: "steps", label: "Steps", placeholder: "e.g. 8500", step: "100", hint: "goal: 10,000" },
                      { key: "weight_lbs", label: "Weight (lbs)", placeholder: "e.g. 148.5", step: "0.1", hint: "" },
                      { key: "soreness_level", label: "Soreness (1–10)", placeholder: "e.g. 4", step: "1", hint: "1 = none" },
                    ].map(({ key, label, placeholder, step, hint }) => (
                      <div key={key}>
                        <div style={{ fontSize: "10px", color: "#888", marginBottom: "3px" }}>{label}</div>
                        <input
                          type="number"
                          step={step}
                          defaultValue={existing[key] || ""}
                          placeholder={placeholder}
                          id={`health_${key}`}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }}
                        />
                        {hint && <div style={{ fontSize: "9px", color: "#ccc", marginTop: "2px" }}>{hint}</div>}
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    id="health_notes"
                    defaultValue={existing.notes || ""}
                    placeholder="Anything else? (injury, stress, nutrition...)"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box", marginBottom: "14px", ...F }}
                  />

                  <button onClick={async () => {
                    const get = id => document.getElementById(id)?.value;
                    const updated = {
                      ...dailyHealth,
                      [todayKey]: {
                        ...(dailyHealth[todayKey] || {}),
                        sleep_hours: get("health_sleep_hours") ? parseFloat(get("health_sleep_hours")) : (existing.sleep_hours || null),
                        steps: get("health_steps") ? parseInt(get("health_steps")) : (existing.steps || null),
                        weight_lbs: get("health_weight_lbs") ? parseFloat(get("health_weight_lbs")) : (existing.weight_lbs || null),
                        soreness_level: get("health_soreness_level") ? parseInt(get("health_soreness_level")) : (existing.soreness_level || null),
                        notes: get("health_notes") || (existing.notes || null),
                        logged: true,
                        logged_at: new Date().toISOString(),
                      }
                    };
                    setDailyHealth(updated);
                    try { localStorage.setItem("daily_health_v1", JSON.stringify(updated)); } catch {}

                    // Sync to Supabase
                    if (clientData?.id) {
                      try {
                        const { upsertHealthLog } = await import("./lib/supabase");
                        const entry = updated[todayKey];
                        await upsertHealthLog(clientData.id, todayKey, {
                          sleep_hours: entry.sleep_hours,
                          steps: entry.steps,
                          weight_lbs: entry.weight_lbs,
                          soreness_level: entry.soreness_level,
                          notes: entry.notes,
                          energy_level: entry.energy_level,
                        });
                      } catch(e) { console.warn("Health log save failed:", e); }
                    }

                    setShowHealthLog(false);
                  }} style={{ width: "100%", background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: "pointer", ...F }}>
                    Save
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Skip session / Log activity — inline, no modal needed */}
          {current.type !== "rest" && (() => {
            const skipped = sessionSkipped[sessionDate];
            const ACTIVITY_TYPES = [
              { id: 'class', label: 'Class' },
              { id: 'run', label: 'Run' },
              { id: 'walk', label: 'Walk' },
              { id: 'bike', label: 'Cycling' },
              { id: 'swim', label: 'Swim' },
              { id: 'rowing', label: 'Rowing' },
              { id: 'sport', label: 'Sport' },
              { id: 'other', label: 'Other' },
            ];

            async function logActivity() {
              const entry = {
                activity_date: sessionDate,
                activity_type: activityForm.type,
                description: activityForm.description || ACTIVITY_TYPES.find(a => a.id === activityForm.type)?.label,
                duration_minutes: activityForm.duration ? parseInt(activityForm.duration) : null,
                notes: `Logged instead of: ${current?.focus}`,
              };
              try {
                const existing = JSON.parse(localStorage.getItem("activity_log_v1") || "[]");
                localStorage.setItem("activity_log_v1", JSON.stringify([{ id: Date.now(), ...entry }, ...existing]));
                if (clientData?.id) {
                  const { logActivity: logAct } = await import("./lib/supabase");
                  await logAct(clientData.id, entry);
                }
              } catch(e) {}
              setShowActivityLog(false);
              setActivityForm({ type: 'class', description: '', duration: '' });
            }

            return (
              <div style={{ margin: "8px 16px 0" }}>
                {/* Skip toggle */}
                {!skipped && (
                  <button
                    onClick={() => setSessionSkipped(prev => ({ ...prev, [sessionDate]: { skipped: true } }))}
                    style={{ background: "none", border: "1px dashed #ddd", borderRadius: "7px", padding: "7px 14px", cursor: "pointer", color: "#bbb", fontSize: "11px", ...F, width: "100%", textAlign: "left" }}>
                    Mark session as skipped
                  </button>
                )}
                {skipped && (
                  <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#999", ...F }}>Session marked as skipped</span>
                    <button onClick={() => setSessionSkipped(prev => { const n = {...prev}; delete n[sessionDate]; return n; })}
                      style={{ background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer" }}>Undo</button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Log a different activity instead */}
          {current.type !== "rest" && (() => {
            const ACTIVITY_TYPES = [
              { id: 'class', label: 'Class', placeholder: 'Spin, HIIT, Pilates...' },
              { id: 'run', label: 'Run', placeholder: 'Outdoor, treadmill...' },
              { id: 'walk', label: 'Walk', placeholder: 'Outdoor, incline...' },
              { id: 'bike', label: 'Cycling', placeholder: 'Stationary, outdoor...' },
              { id: 'swim', label: 'Swim', placeholder: 'Laps, water aerobics...' },
              { id: 'rowing', label: 'Rowing', placeholder: 'Erg, on-water...' },
              { id: 'sport', label: 'Sport', placeholder: 'Tennis, hiking...' },
              { id: 'other', label: 'Other', placeholder: 'Elliptical, stairmaster...' },
            ];

            async function handleLogActivity() {
              const entry = {
                activity_date: sessionDate,
                activity_type: activityForm.type,
                description: activityForm.description || ACTIVITY_TYPES.find(a => a.id === activityForm.type)?.label,
                duration_minutes: activityForm.duration ? parseInt(activityForm.duration) : null,
              };
              try {
                const existing = JSON.parse(localStorage.getItem("activity_log_v1") || "[]");
                localStorage.setItem("activity_log_v1", JSON.stringify([{ id: Date.now(), ...entry }, ...existing]));
                if (clientData?.id) {
                  const { logActivity } = await import("./lib/supabase");
                  await logActivity(clientData.id, entry);
                }
              } catch(e) {}
              setShowActivityLog(false);
              setActivityForm({ type: 'class', description: '', duration: '' });
            }

            return (
              <div style={{ margin: "6px 16px 4px" }}>
                {!showActivityLog ? (
                  <button onClick={() => setShowActivityLog(true)}
                    style={{ background: "none", border: "1px dashed #ddd", borderRadius: "7px", padding: "7px 14px", cursor: "pointer", color: "#bbb", fontSize: "11px", ...F, width: "100%", textAlign: "left" }}>
                    + Log a class or cardio instead
                  </button>
                ) : (
                  <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>Log Activity</div>
                    {/* Type chips */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "10px" }}>
                      {ACTIVITY_TYPES.map(a => (
                        <button key={a.id} onClick={() => setActivityForm(p => ({ ...p, type: a.id }))}
                          style={{ padding: "4px 10px", borderRadius: "20px", border: `1px solid ${activityForm.type === a.id ? "#111" : "#e0e0e0"}`, background: activityForm.type === a.id ? "#111" : "#fff", color: activityForm.type === a.id ? "#fff" : "#555", fontSize: "11px", cursor: "pointer", ...F }}>
                          {a.label}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                      <input
                        value={activityForm.description}
                        onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))}
                        placeholder={ACTIVITY_TYPES.find(a => a.id === activityForm.type)?.placeholder || "Description"}
                        style={{ flex: 2, padding: "7px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", ...F }}
                      />
                      <input
                        type="number"
                        value={activityForm.duration}
                        onChange={e => setActivityForm(p => ({ ...p, duration: e.target.value }))}
                        placeholder="min"
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", ...F }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={handleLogActivity} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", cursor: "pointer", ...F }}>Save</button>
                      <button onClick={() => { setShowActivityLog(false); setActivityForm({ type: 'class', description: '', duration: '' }); }}
                        style={{ background: "none", border: "1px solid #ddd", borderRadius: "6px", padding: "8px 12px", fontSize: "12px", cursor: "pointer", color: "#999" }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Add exercise */}
          {current.type !== "rest" && (() => {
            const EXERCISE_CATALOG = getAllNames() || ["Ab Wheel Rollout", "Alternating Dumbbell Curl", "Arnold Press", "Bulgarian Split Squat (Dumbbell)", "Cable Crunch", "Cable Curl (Low Pulley)", "Cable Fly (Low-to-High)", "Cable Lateral Raise (Single-Arm)", "Cat-Cow", "Chest and Shoulder Doorway Stretch", "Chest-Supported DB Row", "Dead Bug", "Dumbbell Bench Press", "Face Pull (Rope Attachment)", "Foam Roll", "Goblet Squat", "Hammer Curl", "Hanging Knee Raise", "Hip Flexor Stretch", "Hip Thrust (Barbell or Machine)", "Incline Dumbbell Curl", "Incline Dumbbell Press", "Incline Treadmill", "Lat Pulldown (Wide Overhand)", "Lateral Raise", "Leg Extension", "Leg Press", "Light Walk", "Overhead Tricep Extension", "Pallof Press (Cable)", "Plank", "Pull-Up (or Assisted Pull-Up)", "Rear Delt Fly (Bent-Over)", "Romanian Deadlift (Dumbbell)", "Rowing Machine", "Rowing Machine or Incline Treadmill", "Seated Cable Row (Neutral Grip)", "Seated Calf Raise", "Seated Dumbbell Overhead Press", "Side Plank", "Single-Arm Dumbbell Row", "Single-Arm Overhead DB Press", "Single-Leg Hamstring Curl", "Standing Calf Raise", "Stationary Bike", "Stationary Bike or Brisk Walk", "Straight-Arm Cable Pulldown", "Tricep Rope Pushdown"];
            const cmKey = `${current?.day}_${sessionDate}`;
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
        </>
      )}

      {/* Swap Modal */}
      {activeSwapModal && (
        <SwapModal
          exercise={activeSwapModal}
          clientId={clientData?.id}
          sessionKey={sessionKey}
          onSwap={(swap) => setSwappedExercises(prev => ({ ...prev, [activeSwapModal.name]: swap }))}
          onClose={() => setActiveSwapModal(null)}
        />
      )}

      {tab === "progress" && <NewProgressTab clientId={clientData?.id} bodyweight={clientData?.weight || 170} localLogs={logs} measurements={measurements} />}
      {tab === "body" && <BodyTab clientId={clientData?.id} />}
      {tab === "health" && (
        <HealthTab
          dailyHealth={dailyHealth}
          todayKey={todayKey}
          onHealthUpdate={(updated) => {
            setDailyHealth(updated);
            localStorage.setItem("daily_health_v1", JSON.stringify(updated));
          }}
          clientId={clientData?.id}
        />
      )}
      {tab === "nutrition" && <NutritionTab clientId={clientData?.id} />}
      {tab === "cycle" && <CycleTracking clientId={clientData?.id} />}
      {tab === "tools" && (
        <ToolsTab
          principles={principles}
          clientEquipment={clientEquipment}
          clientInjuries={clientInjuries}
          onEquipmentChange={handleEquipmentChange}
          onInjuryChange={handleInjuryChange}
          clientId={clientData?.id}
        />
      )}



      {/* Rest Timer — fixed to bottom */}
      {showSessionSummary && (
        <SessionSummary
          sessionKey={sessionKey}
          logs={logs}
          schedule={activeSchedule}
          onDismiss={() => setShowSessionSummary(false)}
        />
      )}

      {showHealthLog && (
        <HealthLogModal
          todayKey={todayKey}
          dailyHealth={dailyHealth}
          onSave={(updated) => { setDailyHealth(updated); localStorage.setItem("daily_health_v1", JSON.stringify(updated)); setShowHealthLog(false); }}
          onDismiss={() => setShowHealthLog(false)}
        />
      )}

      {restTimer && (
        <RestTimer
          seconds={restTimer.seconds}
          nextExercise={restTimer.exercise || null}
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
