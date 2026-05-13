import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// PR Celebration overlay — shown briefly when a new PR is hit
export function PRCelebration({ exercise, weight, reps, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDismiss && onDismiss();
    }, 4000);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "20px",
    }} onClick={() => { setVisible(false); onDismiss && onDismiss(); }}>
      <div style={{
        background: "#111", borderRadius: "16px", padding: "28px 24px",
        textAlign: "center", maxWidth: "300px", width: "100%",
        border: "2px solid #f59e0b", boxShadow: "0 0 40px rgba(245,158,11,0.3)",
        animation: "prPop 0.3s ease-out",
      }}>
        <div style={{ fontSize: "52px", marginBottom: "10px" }}>🏆</div>
        <div style={{ fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#f59e0b", marginBottom: "6px" }}>
          New Personal Record
        </div>
        <div style={{ fontSize: "20px", fontWeight: "600", color: "#fff", marginBottom: "6px" }}>
          {exercise}
        </div>
        <div style={{ fontSize: "28px", fontWeight: "700", color: "#f59e0b", marginBottom: "4px" }}>
          {weight} lbs
        </div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
          {reps} reps · Tap to continue
        </div>
      </div>
      <style>{`@keyframes prPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}

// Progressive overload suggestions — shown at the end of a session
export function OverloadSuggestions({ sessionExercises, sessionLogs, sessionKey, allLogs }) {
  const [expanded, setExpanded] = useState(false);

  // Build suggestions for each exercise that was logged this session
  const suggestions = [];

  sessionExercises.forEach(ex => {
    if (ex.category === "Recovery" || ex.category === "Mobility") return;
    const key = `${sessionKey}__${ex.name}`;
    const todayLog = sessionLogs[key];
    if (!todayLog?.sets?.length) return;

    const doneSets = todayLog.sets.filter(s => s.done && s.weight && s.reps);
    if (doneSets.length === 0) return;

    // Find previous session logs for this exercise
    const prevLogs = [];
    Object.entries(allLogs).forEach(([k, v]) => {
      if (k.includes(`__${ex.name}`) && k !== key) {
        const prevDone = v.sets?.filter(s => s.done && s.weight && s.reps) || [];
        if (prevDone.length > 0) {
          const sessionPart = k.split("__")[0];
          const dateStr = sessionPart.split("_").slice(1).join("_");
          prevLogs.push({ date: dateStr, sets: prevDone });
        }
      }
    });
    prevLogs.sort((a, b) => b.date.localeCompare(a.date));

    const prevSession = prevLogs[0];
    const maxWeightToday = Math.max(...doneSets.map(s => parseFloat(s.weight)));
    const totalRepsToday = doneSets.reduce((acc, s) => acc + parseInt(s.reps || 0), 0);

    // Rep range target
    const repRange = ex.reps || "8–12";
    const rangeMax = parseInt(repRange.split(/[–-]/)[1]) || parseInt(repRange) || 12;

    // Suggestion logic
    let suggestion = null;
    let type = "maintain";

    if (!prevSession) {
      // First time logging
      suggestion = `First time logging this — keep the same weight next session and focus on clean form. Aim for ${ex.reps} reps on all sets.`;
      type = "baseline";
    } else {
      const prevMaxWeight = Math.max(...prevSession.sets.map(s => parseFloat(s.weight)));
      const prevTotalReps = prevSession.sets.reduce((acc, s) => acc + parseInt(s.reps || 0), 0);
      const avgRepsToday = Math.round(totalRepsToday / doneSets.length);

      if (avgRepsToday >= rangeMax && doneSets.length >= parseInt(ex.sets || 3)) {
        // Hit the top of the rep range on all sets — add weight
        const increment = maxWeightToday >= 100 ? 5 : 2.5;
        suggestion = `You hit ${avgRepsToday} reps across ${doneSets.length} sets at ${maxWeightToday} lbs. Next session: increase to ${maxWeightToday + increment} lbs and aim for ${ex.reps} reps.`;
        type = "increase";
      } else if (avgRepsToday < parseInt(repRange.split(/[–-]/)[0]) - 1 || 0) {
        // Struggling — suggest dropping weight
        suggestion = `Rep count was lower than the target range. Keep ${maxWeightToday} lbs next session and focus on technique — don't add weight until you're hitting ${ex.reps} comfortably.`;
        type = "hold";
      } else if (maxWeightToday > prevMaxWeight) {
        suggestion = `Weight went up from ${prevMaxWeight} lbs to ${maxWeightToday} lbs. Keep building — aim to add 1 more rep per set next session before increasing weight again.`;
        type = "progress";
      } else {
        // Same as last time — suggest adding a rep
        suggestion = `Same weight as last session (${maxWeightToday} lbs). Try to add 1 rep per set next time — once you hit ${rangeMax} reps on all sets, bump the weight by 2.5–5 lbs.`;
        type = "rep_add";
      }
    }

    if (suggestion) {
      suggestions.push({ exercise: ex.name, suggestion, type, weight: maxWeightToday, reps: totalRepsToday });
    }
  });

  if (suggestions.length === 0) return null;

  const typeColors = {
    increase: { bg: "#e8f5e9", color: "#2d7a1e", icon: "↑" },
    progress: { bg: "#e3f2fd", color: "#2563a8", icon: "📈" },
    rep_add: { bg: "#f3e5f5", color: "#7a3aa0", icon: "+" },
    hold: { bg: "#fff3e0", color: "#c47a0a", icon: "⏸" },
    baseline: { bg: "#f5f5f3", color: "#555", icon: "📌" },
    maintain: { bg: "#f5f5f3", color: "#555", icon: "→" },
  };

  return (
    <div style={{ margin: "12px 16px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", overflow: "hidden" }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", background: "#111", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🎯</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#fff" }}>Next Session Targets</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)" }}>{suggestions.length} exercises with suggestions</div>
          </div>
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div>
          {suggestions.map((s, i) => {
            const style = typeColors[s.type] || typeColors.maintain;
            return (
              <div key={i} style={{ padding: "12px 14px", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "600" }}>{s.exercise}</span>
                  <span style={{ fontSize: "10px", background: style.bg, color: style.color, padding: "2px 8px", borderRadius: "20px", flexShrink: 0, marginLeft: "8px" }}>
                    {style.icon} {s.type === "increase" ? "Add weight" : s.type === "rep_add" ? "Add reps" : s.type === "hold" ? "Hold weight" : s.type === "progress" ? "Progress" : "Baseline"}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.55" }}>{s.suggestion}</div>
              </div>
            );
          })}
          <div style={{ padding: "10px 14px", background: "#f9f9f7" }}>
            <div style={{ fontSize: "10px", color: "#aaa", lineHeight: "1.5" }}>
              Suggestions are based on your logged sets this session vs. previous sessions. The rule: hit the top of the rep range on all sets → add weight. Otherwise → add reps first.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
