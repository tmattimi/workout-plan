// Converts a Supabase workout plan (with nested plan_days and plan_exercises)
// into the schedule format the client app already understands.
// This means zero changes needed to the existing Plan/Exercise/WarmUp components.

export function adaptPlanToSchedule(supabasePlan) {
  if (!supabasePlan || !supabasePlan.plan_days) return null;

  const dayOrder = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const days = [...supabasePlan.plan_days].sort((a, b) => {
    const ai = dayOrder.indexOf(a.day_of_week);
    const bi = dayOrder.indexOf(b.day_of_week);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return days.map(day => {
    const exercises = [...(day.plan_exercises || [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((pe, idx) => {
        const ex = pe.exercises || {};
        const formCues = Array.isArray(ex.form_cues) ? ex.form_cues : [];
        return {
          // IDs for Supabase logging
          plan_exercise_id: pe.id,
          exercise_id: ex.id,
          // Display fields
          name: ex.name || "Unknown Exercise",
          category: ex.category || "Isolation Bilateral",
          order: idx + 1,
          sets: pe.sets,
          reps: pe.rep_range,
          rest: pe.rest_seconds ? formatRest(pe.rest_seconds) : "90 sec",
          eccentric: pe.eccentric || "",
          why: ex.why || "",
          form: formCues,
          imbalanceNote: pe.imbalance_note || null,
          notes: pe.notes || null,
          // Equipment and injury data
          equipment: ex.equipment || [],
          injury_contraindications: ex.injury_contraindications || [],
          primary_muscle: ex.primary_muscle || "",
          movement_pattern: ex.movement_pattern || "",
        };
      });

    const cardio = day.cardio_protocol || null;

    return {
      day: day.day_of_week,
      label: day.label || day.day_of_week,
      type: day.session_type || "rest",
      focus: day.focus || day.label || day.day_of_week,
      muscles: day.muscles || [],
      color: getSessionColor(day.session_type),
      accent: getSessionAccent(day.session_type),
      sessionNote: day.session_note || "",
      cardio: cardio,
      exercises,
      // Keep plan metadata for logging
      plan_day_id: day.id,
    };
  });
}

function formatRest(seconds) {
  if (!seconds) return "90 sec";
  if (seconds >= 120) return `${Math.round(seconds / 60)} min`;
  return `${seconds} sec`;
}

function getSessionColor(type) {
  const colors = {
    push: "#e9f0fb",
    pull: "#ebf5e6",
    legs: "#fef3e4",
    upper: "#f3eafa",
    lower: "#fce8e8",
    full_body: "#e5f7f0",
    cardio: "#f0f4e8",
    rest: "#f4f4f2",
  };
  return colors[type] || "#f5f5f3";
}

function getSessionAccent(type) {
  const accents = {
    push: "#2563a8",
    pull: "#2d7a1e",
    legs: "#c47a0a",
    upper: "#7a3aa0",
    lower: "#a02a2a",
    full_body: "#147a50",
    cardio: "#3d7a2a",
    rest: "#888",
  };
  return accents[type] || "#555";
}

// Build a sessionKey for logging that includes the plan_day_id
export function makeSupabaseSessionKey(planDayId, dateStr) {
  return `${planDayId}_${dateStr}`;
}
