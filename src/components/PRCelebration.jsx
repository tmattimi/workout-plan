import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── PR Celebration overlay ─────────────────────────────────────────────────────
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

// ── Progressive Overload Suggestions ──────────────────────────────────────────
export function OverloadSuggestions({ sessionExercises, sessionLogs, sessionKey, allLogs }) {
  const [expanded, setExpanded] = useState(false);

  const suggestions = [];

  sessionExercises.forEach(ex => {
    if (ex.category === "Recovery" || ex.category === "Mobility") return;
    const key = `${sessionKey}__${ex.name}`;
    const todayLog = sessionLogs[key];
    if (!todayLog?.sets?.length) return;

    const doneSets = todayLog.sets.filter(s => s.done && s.weight && s.reps);
    if (doneSets.length === 0) return;

    // Find all previous sessions for this exercise
    const prevLogs = [];
    Object.entries(allLogs).forEach(([k, v]) => {
      if (k.includes(`__${ex.name}`) && k !== key) {
        const prevDone = v.sets?.filter(s => s.done && s.weight && s.reps) || [];
        if (prevDone.length > 0) {
          // Extract date from key: DAY_YYYY-MM-DD__ExerciseName
          const dateParts = k.split("__")[0].split("_").slice(1);
          const dateStr = dateParts.join("-");
          prevLogs.push({ date: dateStr, sets: prevDone });
        }
      }
    });
    prevLogs.sort((a, b) => b.date.localeCompare(a.date));

    const prevSession = prevLogs[0];
    const prev2Session = prevLogs[1];

    const maxWeightToday = Math.max(...doneSets.map(s => parseFloat(s.weight)));
    const avgRepsToday = Math.round(doneSets.reduce((acc, s) => acc + parseInt(s.reps || 0), 0) / doneSets.length);
    const setsCompleted = doneSets.length;
    const targetSets = parseInt(ex.sets || 3);

    const repRange = ex.reps || "8-12";
    const rangeParts = repRange.split(/[–\-]/);
    const rangeMin = parseInt(rangeParts[0]) || 8;
    const rangeMax = parseInt(rangeParts[1]) || parseInt(rangeParts[0]) || 12;

    let suggestion = null;
    let type = "maintain";
    let nextTarget = null;

    if (!prevSession) {
      suggestion = `First time logging — great start at ${maxWeightToday} lbs. Keep this weight next session and focus on clean form. Aim for ${ex.reps} reps on all ${ex.sets} sets.`;
      type = "baseline";
    } else {
      const prevMaxWeight = Math.max(...prevSession.sets.map(s => parseFloat(s.weight)));
      const prevAvgReps = Math.round(prevSession.sets.reduce((acc, s) => acc + parseInt(s.reps || 0), 0) / prevSession.sets.length);
      const increment = maxWeightToday >= 100 ? 5 : 2.5;

      if (avgRepsToday >= rangeMax && setsCompleted >= targetSets) {
        const newWeight = maxWeightToday + increment;
        suggestion = `You hit ${avgRepsToday} avg reps at ${maxWeightToday} lbs across ${setsCompleted} sets — that's the top of your range. Next session: increase to ${newWeight} lbs and aim for ${rangeMin}–${rangeMin + 2} reps.`;
        type = "increase";
        nextTarget = `${newWeight} lbs × ${rangeMin}–${rangeMin + 2} reps`;
      } else if (setsCompleted < targetSets) {
        suggestion = `You completed ${setsCompleted} of ${targetSets} sets at ${maxWeightToday} lbs. Next session: keep the same weight and complete all ${targetSets} sets before increasing anything.`;
        type = "hold";
        nextTarget = `${maxWeightToday} lbs × ${targetSets} sets`;
      } else if (avgRepsToday < rangeMin - 1) {
        const dropWeight = maxWeightToday > increment ? maxWeightToday - increment : maxWeightToday;
        suggestion = `You averaged ${avgRepsToday} reps — below the ${rangeMin}–${rangeMax} target. Consider dropping to ${dropWeight} lbs next session and building back up with clean reps.`;
        type = "drop";
        nextTarget = `${dropWeight} lbs × ${ex.reps} reps`;
      } else if (maxWeightToday > prevMaxWeight) {
        suggestion = `Weight went up from ${prevMaxWeight} to ${maxWeightToday} lbs — good progress. You averaged ${avgRepsToday} reps. Next goal: hit ${rangeMax} reps on all ${targetSets} sets at this weight before adding more.`;
        type = "progress";
        nextTarget = `${maxWeightToday} lbs × ${rangeMax} reps`;
      } else if (avgRepsToday > prevAvgReps) {
        const repsNeeded = rangeMax - avgRepsToday;
        suggestion = `Same weight (${maxWeightToday} lbs), but avg reps went ${prevAvgReps} → ${avgRepsToday}. ${repsNeeded <= 1 ? "One more session at the top of your range earns a weight increase!" : `${repsNeeded} more reps to go before bumping the weight.`}`;
        type = "rep_add";
        nextTarget = `${maxWeightToday} lbs × aim for ${Math.min(avgRepsToday + 1, rangeMax)} reps`;
      } else {
        suggestion = `Same weight (${maxWeightToday} lbs) and similar reps as last session. Push for ${avgRepsToday + 1} reps per set next time — small rep gains add up to weight increases.`;
        type = "rep_add";
        nextTarget = `${maxWeightToday} lbs × ${avgRepsToday + 1} reps`;
      }
    }

    if (suggestion) {
      suggestions.push({ exercise: ex.name, suggestion, type, nextTarget, weight: maxWeightToday, reps: avgRepsToday });
    }
  });

  if (suggestions.length === 0) return null;

  const typeColors = {
    increase: { bg: "#e8f5e9", color: "#2d7a1e", icon: "↑", label: "Add weight" },
    progress: { bg: "#e3f2fd", color: "#2563a8", icon: "📈", label: "Progress" },
    rep_add:  { bg: "#f3e5f5", color: "#7a3aa0", icon: "+", label: "Add reps" },
    hold:     { bg: "#fff3e0", color: "#c47a0a", icon: "⏸", label: "Hold weight" },
    drop:     { bg: "#fce4ec", color: "#c62828", icon: "↓", label: "Reduce weight" },
    baseline: { bg: "#f5f5f3", color: "#555",    icon: "📌", label: "Baseline" },
    maintain: { bg: "#f5f5f3", color: "#555",    icon: "→", label: "Maintain" },
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
                    {style.icon} {style.label}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.55", marginBottom: s.nextTarget ? "6px" : 0 }}>{s.suggestion}</div>
                {s.nextTarget && (
                  <div style={{ fontSize: "10px", background: style.bg, color: style.color, padding: "4px 9px", borderRadius: "5px", display: "inline-block", fontWeight: "600" }}>
                    Target: {s.nextTarget}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ padding: "10px 14px", background: "#f9f9f7" }}>
            <div style={{ fontSize: "10px", color: "#aaa", lineHeight: "1.5" }}>
              Rule: hit the top of your rep range on all sets → add weight. Otherwise → add reps first.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skip Day Banner ────────────────────────────────────────────────────────────
export function SkipDayBanner({ activeSchedule, activeDay, logs, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lastLoggedDate = (() => {
    let latest = null;
    Object.keys(logs).forEach(k => {
      // key format: DAYNAME_YYYY-MM-DD__ExerciseName
      const parts = k.split("__")[0].split("_");
      if (parts.length >= 2) {
        const dateStr = parts.slice(1).join("-");
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          if (!latest || dateStr > latest) latest = dateStr;
        }
      }
    });
    return latest;
  })();

  if (!lastLoggedDate) return null;

  const today = new Date().toISOString().slice(0, 10);
  const daysDiff = Math.round(
    (new Date(today + "T00:00:00") - new Date(lastLoggedDate + "T00:00:00")) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 2 || dismissed) return null;

  const current = activeSchedule[activeDay] || {};
  const muscles = current.muscles || [];

  function getAdvice() {
    const isLeg = muscles.some(m => ["Quads", "Hamstrings", "Glutes", "Legs"].includes(m));
    const isPush = muscles.some(m => ["Chest", "Shoulders", "Triceps"].includes(m));

    if (daysDiff >= 7) {
      return {
        headline: "Welcome back — ease back in",
        steps: [
          "Reduce all weights by 10–15% from your last logged session.",
          "Focus on form over load — your nervous system needs time to re-sync.",
          "Complete today's session at reduced intensity, not skipped exercises.",
          "You'll be back to full strength within 1–2 sessions.",
        ],
        scripture: { verse: "Do not grow weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
      };
    }
    if (daysDiff >= 4) {
      return {
        headline: `${daysDiff - 1} days off — reduce intensity slightly`,
        steps: [
          "Drop compound lift weights by 5–10% from your last session.",
          "Keep the same weights on isolation exercises.",
          "Don't try to make up skipped days — train what's scheduled today.",
          "Quality reps matter more than chasing last session's numbers.",
        ],
        scripture: { verse: "Be strong and courageous. Do not be afraid; do not be discouraged.", ref: "Joshua 1:9" },
      };
    }
    if (isLeg) {
      return {
        headline: `${daysDiff - 1} day${daysDiff > 2 ? "s" : ""} off — legs may feel strong`,
        steps: [
          "Extra rest often means stronger legs — don't reduce weight unless you feel off.",
          "Prioritize hip hinges (RDL, hip thrust) before squatting patterns.",
          "Stay connected to each rep — don't rush because you're fresh.",
          "Train today's session as written.",
        ],
        scripture: { verse: "She is clothed with strength and dignity; she can laugh at the days to come.", ref: "Proverbs 31:25" },
      };
    }
    return {
      headline: `${daysDiff - 1} day${daysDiff > 2 ? "s" : ""} missed — get back on track`,
      steps: [
        "Don't try to make up skipped days — pick up where the schedule says.",
        "Keep today's weights the same as your last session.",
        "Consistency over perfection. One missed session doesn't set back your progress.",
        "Show up today. That's what matters.",
      ],
      scripture: { verse: "The Lord is my strength and my shield; my heart trusts in him, and he helps me.", ref: "Psalm 28:7" },
    };
  }

  const advice = getAdvice();

  return (
    <div style={{ margin: "10px 14px", borderRadius: "10px", overflow: "hidden", border: "1px solid #f0c060" }}>
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", background: "#fef3e4", border: "none", cursor: "pointer",
          padding: "11px 14px", display: "flex", alignItems: "center", gap: "10px",
          textAlign: "left", ...F,
        }}
      >
        <span style={{ fontSize: "18px", flexShrink: 0 }}>📅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#c47a0a", marginBottom: "2px" }}>
            {advice.headline}
          </div>
          <div style={{ fontSize: "10px", color: "#a06020" }}>
            Last session was {daysDiff === 1 ? "yesterday" : `${daysDiff} days ago`} · Tap for guidance
          </div>
        </div>
        <span style={{ color: "#c47a0a", fontSize: "11px", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ background: "#fffcf5", padding: "12px 14px 14px", borderTop: "1px solid #f0c060" }}>
          {advice.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start" }}>
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#c47a0a", color: "#fff", fontSize: "9px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>{i + 1}</span>
              <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.55" }}>{step}</div>
            </div>
          ))}
          <div style={{ marginTop: "12px", padding: "10px 12px", background: "#111", borderRadius: "7px" }}>
            <div style={{ fontSize: "10px", fontStyle: "italic", color: "#e8e0cc", lineHeight: "1.6" }}>
              "{advice.scripture.verse}"
            </div>
            <div style={{ fontSize: "9px", color: "#c47a0a", marginTop: "4px" }}>— {advice.scripture.ref}</div>
          </div>
          <button onClick={() => { setDismissed(true); onDismiss && onDismiss(); }} style={{
            ...F, marginTop: "12px", background: "none", border: "1px solid #e0c080",
            color: "#a06020", borderRadius: "20px", padding: "5px 14px",
            fontSize: "10px", cursor: "pointer",
          }}>
            Got it — I'm ready to train
          </button>
        </div>
      )}
    </div>
  );
}
