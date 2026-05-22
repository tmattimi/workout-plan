import { useState, useEffect } from "react";
import {
  getAllExercises, createPlan, createPlanDay, addExerciseToPlanDay, assignPlanToClient
} from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Map workout style to day structure ────────────────────────────────────────
const PROGRAM_STRUCTURES = {
  "Push Pull Legs": {
    3: [
      { day: "MON", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "WED", label: "Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "FRI", label: "Legs", type: "legs", muscles: ["Quads", "Hamstrings", "Glutes", "Calves"] },
    ],
    4: [
      { day: "MON", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "TUE", label: "Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "THU", label: "Legs", type: "legs", muscles: ["Quads", "Hamstrings", "Glutes"] },
      { day: "FRI", label: "Push / Pull", type: "push_pull", muscles: ["Shoulders", "Back", "Arms"] },
    ],
    5: [
      { day: "MON", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "TUE", label: "Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "WED", label: "Legs", type: "legs", muscles: ["Quads", "Hamstrings", "Glutes"] },
      { day: "THU", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "FRI", label: "Pull + Legs", type: "pull_legs", muscles: ["Back", "Hamstrings", "Glutes"] },
    ],
    6: [
      { day: "MON", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "TUE", label: "Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "WED", label: "Legs", type: "legs", muscles: ["Quads", "Hamstrings", "Glutes"] },
      { day: "THU", label: "Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "FRI", label: "Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "SAT", label: "Legs", type: "legs", muscles: ["Glutes", "Hamstrings", "Quads"] },
    ],
  },
  "Upper Lower": {
    4: [
      { day: "MON", label: "Upper", type: "upper", muscles: ["Chest", "Back", "Shoulders", "Arms"] },
      { day: "TUE", label: "Lower", type: "lower", muscles: ["Quads", "Hamstrings", "Glutes"] },
      { day: "THU", label: "Upper", type: "upper", muscles: ["Chest", "Back", "Shoulders", "Arms"] },
      { day: "FRI", label: "Lower", type: "lower", muscles: ["Glutes", "Hamstrings", "Quads"] },
    ],
    3: [
      { day: "MON", label: "Upper", type: "upper", muscles: ["Chest", "Back", "Shoulders", "Arms"] },
      { day: "WED", label: "Lower", type: "lower", muscles: ["Quads", "Hamstrings", "Glutes"] },
      { day: "FRI", label: "Upper", type: "upper", muscles: ["Chest", "Back", "Shoulders", "Arms"] },
    ],
  },
  "Full Body": {
    3: [
      { day: "MON", label: "Full Body A", type: "full_body", muscles: ["Compound Movements"] },
      { day: "WED", label: "Full Body B", type: "full_body", muscles: ["Compound Movements"] },
      { day: "FRI", label: "Full Body C", type: "full_body", muscles: ["Compound Movements"] },
    ],
  },
  "Glute Focus": {
    4: [
      { day: "MON", label: "Glutes + Hamstrings", type: "posterior", muscles: ["Glutes", "Hamstrings"] },
      { day: "TUE", label: "Upper Body", type: "upper", muscles: ["Back", "Shoulders", "Arms"] },
      { day: "THU", label: "Glutes + Quads", type: "legs", muscles: ["Glutes", "Quads"] },
      { day: "FRI", label: "Upper + Core", type: "upper", muscles: ["Chest", "Back", "Core"] },
    ],
    5: [
      { day: "MON", label: "Glutes + Hamstrings", type: "posterior", muscles: ["Glutes", "Hamstrings"] },
      { day: "TUE", label: "Upper Pull", type: "pull", muscles: ["Back", "Biceps", "Rear Delts"] },
      { day: "WED", label: "Quads + Calves", type: "quads", muscles: ["Quads", "Calves"] },
      { day: "THU", label: "Upper Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "SAT", label: "Glutes + Full Body", type: "full_glute", muscles: ["Glutes", "Full Body"] },
    ],
    6: [
      { day: "MON", label: "Glutes + Hamstrings", type: "posterior", muscles: ["Glutes", "Hamstrings"] },
      { day: "TUE", label: "Upper Pull", type: "pull", muscles: ["Back", "Biceps"] },
      { day: "WED", label: "Quads + Core", type: "quads", muscles: ["Quads", "Core"] },
      { day: "THU", label: "Upper Push", type: "push", muscles: ["Chest", "Shoulders", "Triceps"] },
      { day: "FRI", label: "Glutes + Hamstrings", type: "posterior", muscles: ["Glutes", "Hamstrings"] },
      { day: "SAT", label: "Full Body + Cardio", type: "full_body", muscles: ["Full Body"] },
    ],
  },
};

// ── Build the full AI prompt from all available client data ───────────────────
function buildFullPrompt(client, intake, overview, exerciseList) {
  const { recentLogs, measurements, prs, checkins } = overview || {};
  const latest = measurements?.[measurements.length - 1];

  let prompt = `You are an expert personal trainer and exercise scientist creating a complete, individualized weekly workout program.

══════════════════════════════════════════
CLIENT PROFILE
══════════════════════════════════════════
Name: ${client.name}
Sex: ${client.sex || "female"}
Goal: ${client.goal?.replace(/_/g, " ") || intake?.primary_goal?.replace(/_/g, " ") || "general fitness"}
Target weight: ${client.goal_weight_lbs || intake?.target_weight_lbs || "not specified"} lbs
Goal timeline: ${intake?.goal_timeline?.replace(/_/g, " ") || "not specified"}
`;

  if (intake?.focus_areas?.length) {
    prompt += `Priority focus areas: ${intake.focus_areas.join(", ")}\n`;
  }
  if (intake?.goal_notes) {
    prompt += `Client's own words about their goals: "${intake.goal_notes}"\n`;
  }

  prompt += `\n══════════════════════════════════════════
STATS & BODY COMPOSITION
══════════════════════════════════════════
`;
  if (client.current_weight_lbs || intake?.current_weight_lbs) {
    prompt += `Current weight: ${client.current_weight_lbs || intake?.current_weight_lbs} lbs\n`;
  }
  if (intake?.height_ft) {
    prompt += `Height: ${intake.height_ft}' ${Math.round((intake.height_in || 0) % 12)}"\n`;
  }
  if (latest?.body_fat_pct || intake?.body_fat_pct) {
    prompt += `Body fat %: ${latest?.body_fat_pct || intake?.body_fat_pct}%\n`;
  }
  if (latest?.waist_in) prompt += `Waist: ${latest.waist_in}"\n`;
  if (latest?.hips_in) prompt += `Hips: ${latest.hips_in}"\n`;
  if (client.date_of_birth) {
    const age = Math.floor((new Date() - new Date(client.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000));
    prompt += `Age: ${age}\n`;
  }

  const experienceLevel = intake?.experience_level || intake?.fitness_level || "intermediate";
  const sessionLength = intake?.session_length_minutes || intake?.session_length || 60;
  const trainingDays = intake?.training_days_per_week || client?.weekly_frequency || 4;
  const preferredDays = intake?.preferred_days || [];

  prompt += `\n══════════════════════════════════════════
TRAINING BACKGROUND
══════════════════════════════════════════
Experience level: ${experienceLevel}
Training days per week: ${trainingDays}
Preferred days: ${preferredDays.length ? preferredDays.join(", ") : "flexible"}
Session length: ${sessionLength} minutes
Training style preference: ${intake?.training_style?.replace(/_/g, " ") || "no preference — coach decides"}
Understands progressive overload: ${intake?.knows_progressive_overload === true ? "Yes" : intake?.knows_progressive_overload === false ? "No" : "Unknown"}
Comfortable with basic lifting form: ${intake?.knows_form_basics === true ? "Yes" : intake?.knows_form_basics === false ? "No" : "Unknown"}
Prior coaching experience: ${intake?.prior_coaching === true ? "Yes" : intake?.prior_coaching === false ? "No" : "Unknown"}
${intake?.prior_coaching_notes ? `What worked/didn't with prior coaching: "${intake.prior_coaching_notes}"` : ""}
`;

  const equipment = client.equipment || intake?.equipment_available || ["barbell", "dumbbell", "cable", "machine"];
  prompt += `Available equipment: ${Array.isArray(equipment) ? equipment.join(", ") : equipment}\n`;

  const injuries = client.injury_flags || intake?.injury_flags || [];
  if (injuries.length) {
    prompt += `\nINJURY FLAGS — STRICT CONTRAINDICATIONS:\n`;
    injuries.forEach(inj => prompt += `  - ${inj}: avoid all exercises loading this area\n`);
  }
  if (intake?.injury_notes) {
    prompt += `Detailed injury notes from client: "${intake.injury_notes}"\n`;
  }
  if (intake?.mobility_limitations) {
    prompt += `Mobility limitations: "${intake.mobility_limitations}"\n`;
  }

  // Fixed weekly commitments — hard scheduling constraints
  const fixedCommitments = intake?.fixed_commitments;
  if (fixedCommitments?.length > 0) {
    prompt += `\n══════════════════════════════════════════
FIXED WEEKLY COMMITMENTS — HARD SCHEDULING CONSTRAINTS
══════════════════════════════════════════
The following days are ALREADY COMMITTED to non-lifting activities.
Do NOT schedule lifting or strength training sessions on these days.
These are immovable — schedule around them:\n`;
    fixedCommitments.forEach(c => {
      prompt += `  - ${c.day}: ${c.activity} (this day is UNAVAILABLE for lifting)\n`;
    });
    const blockedDays = fixedCommitments.map(c => c.day);
    const availableDays = ["MON","TUE","WED","THU","FRI","SAT","SUN"].filter(d => !blockedDays.includes(d));
    prompt += `Available days for lifting: ${availableDays.join(", ")}\n`;
    prompt += `Preferred days from client (honour these, avoid blocked days): ${preferredDays.filter(d => !blockedDays.includes(d)).join(", ") || "any available day"}\n`;
  }

  // Cardio section
  if (intake?.cardio_types?.length > 0 && !intake.cardio_types.includes("none")) {
    prompt += `\n══════════════════════════════════════════
CARDIO & CONDITIONING
══════════════════════════════════════════
Cardio preferences: ${intake.cardio_types.join(", ")}
Cardio days per week: ${intake.cardio_days_per_week || "not specified"}
Cardio duration: ${intake.cardio_duration_minutes || "not specified"} min per session
${intake?.cardio_notes ? `Cardio notes: "${intake.cardio_notes}"` : ""}
`;
  }

  // Lifestyle section
  const hasLifestyleData = intake?.sleep_hours_per_night || intake?.stress_level || intake?.nutrition_approach;
  if (hasLifestyleData) {
    prompt += `\n══════════════════════════════════════════
LIFESTYLE & RECOVERY
══════════════════════════════════════════
`;
    if (intake?.sleep_hours_per_night) prompt += `Average sleep: ${intake.sleep_hours_per_night} hours/night\n`;
    if (intake?.stress_level) prompt += `Stress level: ${intake.stress_level}/5\n`;
    if (intake?.nutrition_approach) prompt += `Nutrition approach: ${intake.nutrition_approach.replace(/_/g, " ")}\n`;
    if (intake?.daily_protein_grams) prompt += `Daily protein: ~${intake.daily_protein_grams}g\n`;
    if (intake?.does_stretch === false) prompt += `Does NOT currently stretch or do mobility work\n`;
  }

  if (intake?.additional_notes || client.notes) {
    prompt += `\n══════════════════════════════════════════
ADDITIONAL NOTES FROM CLIENT
══════════════════════════════════════════
"${intake?.additional_notes || client.notes}"
`;
  }

  if (prs?.length > 0) {
    prompt += `\n══════════════════════════════════════════
CURRENT STRENGTH (Personal Records)
══════════════════════════════════════════
`;
    prs.slice(0, 12).forEach(pr => {
      prompt += `  ${pr.exercise_name}: ${pr.weight_lbs} lbs × ${pr.reps} reps\n`;
    });
  }

  if (checkins?.length > 0) {
    const recent = checkins.slice(-4);
    const avgEnergy = (recent.reduce((s, c) => s + (c.energy_level || 5), 0) / recent.length).toFixed(1);
    const avgRecovery = (recent.reduce((s, c) => s + (c.recovery_score || 5), 0) / recent.length).toFixed(1);
    prompt += `\nRecent check-in averages: energy ${avgEnergy}/10, recovery ${avgRecovery}/10\n`;
  }

  if (recentLogs?.length > 0) {
    const sessionDates = [...new Set(recentLogs.map(l => l.session_date))].slice(0, 8);
    prompt += `\nRecent training: ${sessionDates.length} sessions logged\n`;
  }

  // Exercise library — filtered and capped to keep prompt under token limit
  const focusKeywords = (intake?.focus_areas || []).join(' ').toLowerCase();
  const hasGluteFocus = focusKeywords.includes('glute') || focusKeywords.includes('lower');
  const hasUpperFocus = focusKeywords.includes('upper') || focusKeywords.includes('back') || focusKeywords.includes('shoulder');

  // Group exercises by muscle, send top exercises per group
  const muscleGroups = {};
  exerciseList.forEach(ex => {
    const muscle = ex.primary_muscle || ex.category || 'Other';
    if (!muscleGroups[muscle]) muscleGroups[muscle] = [];
    muscleGroups[muscle].push(ex.name);
  });

  // Prioritize relevant muscle groups, limit total exercises
  const priorityMuscles = hasGluteFocus
    ? ['Glutes', 'Hamstrings', 'Quads', 'Back', 'Shoulders', 'Chest', 'Core', 'Triceps', 'Biceps', 'Calves']
    : hasUpperFocus
    ? ['Back', 'Shoulders', 'Chest', 'Glutes', 'Hamstrings', 'Quads', 'Core', 'Triceps', 'Biceps', 'Calves']
    : ['Glutes', 'Quads', 'Hamstrings', 'Back', 'Chest', 'Shoulders', 'Core', 'Triceps', 'Biceps', 'Calves'];

  prompt += `\n══════════════════════════════════════════
EXERCISE LIBRARY (use exact names)
══════════════════════════════════════════
`;
  let exCount = 0;
  priorityMuscles.forEach(muscle => {
    const exes = muscleGroups[muscle] || [];
    if (exes.length === 0) return;
    const limit = ['Glutes','Hamstrings','Back','Quads'].includes(muscle) ? 12 : 8;
    const selected = exes.slice(0, limit);
    prompt += `\n${muscle}: ${selected.join(', ')}\n`;
    exCount += selected.length;
  });
  prompt += `\nTotal: ${exCount} exercises available.\n`;

  prompt += `
══════════════════════════════════════════
PROGRAMMING REQUIREMENTS
══════════════════════════════════════════

EXERCISE ORDER PER SESSION (strictly follow this):
1. WARM-UP: 2-3 activation/mobility exercises (light weight, high reps, targeting muscles for that day)
2. MAIN LIFTS: 3-5 compound movements (heaviest, most demanding first)
3. ACCESSORY WORK: 3-5 isolation or unilateral exercises
4. CORE FINISHER: 2-3 core exercises at the end (never before main lifts)
5. CARDIO FINISHER: Only for fat_loss or recomp goals — 15-20 min Zone 2 at end of session

VOLUME & REPS:
- Compound lifts: 3-4 sets × 6-10 reps, rest 2-3 min
- Accessory work: 3-4 sets × 10-15 reps, rest 60-90 sec  
- Core: 3 sets × 12-20 reps, rest 45-60 sec
- Warm-up: 2 sets × 12-15 reps (light activation only)

INJURY RULES: If injury flags exist, skip ALL exercises that load that joint. No exceptions.
FEMALE CLIENTS: Prioritize hip thrusts, RDLs, glute bridges, cable kickbacks for lower body days.
GLUTE FOCUS: 60%+ of leg day exercises must be posterior chain (glutes/hamstrings dominant).

TASK: Return ONLY a JSON object. No text before or after. No markdown. Start with { end with }.

EXACT JSON STRUCTURE REQUIRED:
{
  "programName": "string",
  "phase": "Phase 1 — Foundation",
  "durationWeeks": 8,
  "coachNotes": "2-3 sentences on key decisions for this specific client",
  "weeklySchedule": [
    {
      "day": "MON",
      "label": "Glutes + Hamstrings",
      "type": "posterior",
      "focus": "Glutes + Hamstrings",
      "muscles": ["Glutes", "Hamstrings"],
      "warmup": [
        { "name": "EXACT exercise name from library", "sets": 2, "reps": "15", "note": "activation" },
        { "name": "EXACT exercise name from library", "sets": 2, "reps": "12", "note": "mobility" }
      ],
      "exercises": [
        { "name": "EXACT exercise name from library", "sets": 4, "reps": "8-10", "rest": "2-3 min", "category": "Main Lift", "order": 1, "goal": "hypertrophy", "rationale": "why this exercise" },
        { "name": "EXACT exercise name from library", "sets": 3, "reps": "12-15", "rest": "90 sec", "category": "Accessory", "order": 2, "goal": "hypertrophy", "rationale": "why this exercise" },
        { "name": "EXACT exercise name from library", "sets": 3, "reps": "15-20", "rest": "60 sec", "category": "Core", "order": 3, "goal": "endurance", "rationale": "core stability" }
      ],
      "cardio": { "name": "Incline Treadmill Walk", "protocol": "3.5 mph at 10% incline, 15 min", "zone": "Zone 2" }
    },
    {
      "day": "SUN",
      "label": "Rest",
      "type": "rest",
      "focus": "Rest & Recovery",
      "muscles": [],
      "warmup": [],
      "exercises": [],
      "cardio": null
    }
  ]
}

IMPORTANT: Include ALL 7 days (MON through SUN). Training days get full exercises. Rest days get empty arrays.
Each training day must have: 2 warmup exercises, 4-6 main/accessory exercises, 2 core exercises.
Use ONLY exercise names exactly as they appear in the library above.
`;

  return prompt;
}

// ── Inline exercise editor ────────────────────────────────────────────────────
function ExerciseRow({ ex, exerciseList, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = search.length > 1
    ? exerciseList.filter(e => e.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5", background: editing ? "#fafaf8" : "#fff" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e8e8e8", color: "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
          {ex.order}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{ex.name}</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: ex.rationale ? 3 : 0 }}>
            <span style={{ fontSize: 10, background: "#f0f0f0", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{ex.sets} × {ex.reps}</span>
            {ex.rest && <span style={{ fontSize: 9, color: "#aaa", padding: "2px 7px", background: "#f5f5f3", borderRadius: 20 }}>{ex.rest}</span>}
            {ex.goal && <span style={{ fontSize: 9, color: "#2563a8", padding: "2px 7px", background: "rgba(37,99,168,0.08)", borderRadius: 20 }}>{ex.goal}</span>}
          </div>
          {ex.rationale && <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.5, fontStyle: "italic" }}>{ex.rationale}</div>}

          {editing && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Exercise search */}
              <div style={{ position: "relative" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search to replace exercise..."
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 11, boxSizing: "border-box", ...F }} />
                {filtered.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 180, overflowY: "auto" }}>
                    {filtered.map(e => (
                      <button key={e.id} onClick={() => { onChange({ ...ex, name: e.name }); setSearch(""); }}
                        style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", borderBottom: "1px solid #f5f5f5", textAlign: "left", cursor: "pointer", fontSize: 12, ...F }}>
                        {e.name}
                        <span style={{ fontSize: 10, color: "#bbb", marginLeft: 6 }}>{e.primary_muscle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Sets/reps/rest inline */}
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#aaa", marginBottom: 2 }}>Sets</div>
                  <input type="number" value={ex.sets} onChange={e => onChange({ ...ex, sets: parseInt(e.target.value) || ex.sets })}
                    style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #e0e0e0", fontSize: 12, ...F }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#aaa", marginBottom: 2 }}>Reps</div>
                  <input value={ex.reps} onChange={e => onChange({ ...ex, reps: e.target.value })}
                    style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #e0e0e0", fontSize: 12, ...F }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: "#aaa", marginBottom: 2 }}>Rest</div>
                  <input value={ex.rest || ""} onChange={e => onChange({ ...ex, rest: e.target.value })}
                    style={{ width: "100%", padding: "5px 8px", borderRadius: 5, border: "1px solid #e0e0e0", fontSize: 12, ...F }} />
                </div>
              </div>
              {/* Rationale */}
              <textarea value={ex.rationale || ""} onChange={e => onChange({ ...ex, rationale: e.target.value })}
                placeholder="Rationale for this exercise..." rows={2}
                style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #e0e0e0", fontSize: 11, resize: "none", boxSizing: "border-box", ...F }} />
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
          <button onClick={() => setEditing(p => !p)}
            style={{ background: editing ? "#111" : "none", color: editing ? "#fff" : "#aaa", border: "1px solid #e0e0e0", borderRadius: 4, padding: "3px 7px", fontSize: 10, cursor: "pointer", ...F }}>
            {editing ? "Done" : "Edit"}
          </button>
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={onMoveUp} disabled={isFirst}
              style={{ flex: 1, background: "none", border: "1px solid #e8e8e8", borderRadius: 4, padding: "2px 0", fontSize: 10, cursor: isFirst ? "default" : "pointer", color: isFirst ? "#e0e0e0" : "#888" }}>↑</button>
            <button onClick={onMoveDown} disabled={isLast}
              style={{ flex: 1, background: "none", border: "1px solid #e8e8e8", borderRadius: 4, padding: "2px 0", fontSize: 10, cursor: isLast ? "default" : "pointer", color: isLast ? "#e0e0e0" : "#888" }}>↓</button>
          </div>
          <button onClick={onRemove}
            style={{ background: "none", border: "1px solid #f0d0d0", borderRadius: 4, padding: "3px 7px", fontSize: 10, cursor: "pointer", color: "#e0a0a0" }}>×</button>
        </div>
      </div>
    </div>
  );
}

// ── Day card editor ───────────────────────────────────────────────────────────
function DayCard({ day, exerciseList, onChange }) {
  const [open, setOpen] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const addFiltered = addSearch.length > 1
    ? exerciseList.filter(e => e.name.toLowerCase().includes(addSearch.toLowerCase())).slice(0, 8)
    : [];

  function updateExercise(i, updated) {
    const exercises = [...(day.exercises || [])];
    exercises[i] = updated;
    onChange({ ...day, exercises });
  }

  function removeExercise(i) {
    const exercises = day.exercises.filter((_, idx) => idx !== i).map((ex, idx) => ({ ...ex, order: idx + 1 }));
    onChange({ ...day, exercises });
  }

  function moveExercise(i, dir) {
    const exercises = [...(day.exercises || [])];
    const j = i + dir;
    if (j < 0 || j >= exercises.length) return;
    [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    onChange({ ...day, exercises: exercises.map((ex, idx) => ({ ...ex, order: idx + 1 })) });
  }

  function addExercise(ex) {
    const exercises = [...(day.exercises || []), {
      name: ex.name,
      sets: 3,
      reps: "10–12",
      rest: "60–90 sec",
      category: ex.category || "Isolation",
      order: (day.exercises?.length || 0) + 1,
      goal: "hypertrophy",
      rationale: "",
    }];
    onChange({ ...day, exercises });
    setAddSearch("");
  }

  const isRest = day.type === "rest";
  const exCount = day.exercises?.length || 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 9, marginBottom: 8, overflow: "hidden" }}>
      {/* Day header */}
      <button onClick={() => !isRest && setOpen(p => !p)}
        style={{ width: "100%", background: isRest ? "#f9f9f7" : "none", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: isRest ? "default" : "pointer", textAlign: "left" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: isRest ? "#ccc" : "#aaa" }}>{day.day}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isRest ? "#bbb" : "#111" }}>{day.label}</span>
          </div>
          {day.muscles?.length > 0 && !isRest && (
            <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{day.muscles.join(", ")}</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isRest && <span style={{ fontSize: 10, color: "#bbb" }}>{exCount} exercises</span>}
          {!isRest && <span style={{ color: "#ccc", fontSize: 11 }}>{open ? "▲" : "▼"}</span>}
        </div>
      </button>

      {/* Exercises */}
      {open && !isRest && (
        <div style={{ borderTop: "1px solid #f0f0f0" }}>
          {/* Warm-up */}
          {day.warmup?.length > 0 && (
            <div style={{ padding: "8px 14px", background: "#fffbf0", borderBottom: "1px solid #f5f5f5" }}>
              <div style={{ fontSize: 9, color: "#c47a0a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Warm-Up</div>
              {day.warmup.map((w, i) => (
                <div key={i} style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                  {w.name} — {w.sets} × {w.reps}
                  {w.note && <span style={{ color: "#aaa" }}> · {w.note}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Main exercises */}
          {(day.exercises || []).map((ex, i) => (
            <ExerciseRow
              key={i}
              ex={ex}
              exerciseList={exerciseList}
              onChange={updated => updateExercise(i, updated)}
              onRemove={() => removeExercise(i)}
              onMoveUp={() => moveExercise(i, -1)}
              onMoveDown={() => moveExercise(i, 1)}
              isFirst={i === 0}
              isLast={i === (day.exercises?.length || 1) - 1}
            />
          ))}

          {/* Cardio */}
          {day.cardio && (
            <div style={{ padding: "10px 14px", background: "#f0f4ff", borderTop: "1px solid #e8eeff", display: "flex", gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#2563a8", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, flexShrink: 0 }}>Z2</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#2563a8" }}>{day.cardio.name}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{day.cardio.protocol}</div>
              </div>
            </div>
          )}

          {/* Add exercise */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #f5f5f5", position: "relative" }}>
            <input value={addSearch} onChange={e => setAddSearch(e.target.value)} placeholder="+ Add exercise..."
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px dashed #ddd", fontSize: 11, boxSizing: "border-box", ...F, background: "#fafaf8", color: "#888" }} />
            {addFiltered.length > 0 && (
              <div style={{ position: "absolute", bottom: "100%", left: 14, right: 14, background: "#fff", border: "1px solid #e0e0e0", borderRadius: 6, zIndex: 20, boxShadow: "0 -4px 12px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" }}>
                {addFiltered.map(e => (
                  <button key={e.id} onClick={() => addExercise(e)}
                    style={{ width: "100%", padding: "8px 12px", background: "none", border: "none", borderBottom: "1px solid #f5f5f5", textAlign: "left", cursor: "pointer", fontSize: 12, ...F }}>
                    {e.name}
                    <span style={{ fontSize: 10, color: "#bbb", marginLeft: 6 }}>{e.primary_muscle}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIProgramBuilder({ client, intake, overview }) {
  const [exercises, setExercises] = useState([]);
  const [program, setProgram] = useState(null);
  const [editedProgram, setEditedProgram] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [showCoachNotes, setShowCoachNotes] = useState(true);

  // Load exercise library
  useEffect(() => {
    getAllExercises().then(({ data }) => {
      if (data) setExercises(data);
    });
  }, []);

  // Pre-fill from intake — auto-select best program structure
  const daysPerWeek = intake?.training_days_per_week || client?.weekly_frequency || 4;
  const focusAreas = intake?.focus_areas || [];
  const hasGluteFocus = focusAreas.some(f => ["glutes", "glute", "legs", "hamstrings"].includes(f.toLowerCase()));
  const hasUpperFocus = focusAreas.some(f => ["upper_body", "back", "shoulders", "arms"].includes(f.toLowerCase()));
  const trainingStyle = intake?.training_style || "";

  const defaultStyle =
    hasGluteFocus ? "Glute Focus" :
    hasUpperFocus && !hasGluteFocus ? "Push Pull Legs" :
    daysPerWeek <= 3 ? "Full Body" :
    daysPerWeek >= 5 ? "Push Pull Legs" :
    "Upper Lower";

  async function generateProgram() {
    if (!exercises.length) {
      setError("Exercise library not loaded. Please wait and try again.");
      return;
    }
    setLoading(true);
    setError(null);
    setProgram(null);
    setEditedProgram(null);

    // Filter exercises by equipment and injuries
    const equipment = client?.equipment || intake?.equipment_available || ["dumbbell", "cable", "machine"];
    const injuries = client?.injury_flags || intake?.injury_flags || [];

    // Simple injury filter — exclude exercises mentioning injured body parts
    const injuryKeywords = injuries.flatMap(inj => {
      const map = {
        shoulder: ["shoulder", "overhead press", "lateral raise", "fly", "upright row"],
        knee: ["squat", "leg press", "lunge", "step up", "leg extension"],
        lower_back: ["deadlift", "good morning", "back extension", "seated row"],
        hip: ["hip thrust", "lunge", "split squat"],
        elbow: ["curl", "pushdown", "extension", "dip"],
        ankle: ["calf", "jump", "plyometric"],
      };
      return map[inj.toLowerCase()] || [];
    });

    const safeExercises = exercises.filter(ex => {
      const name = ex.name.toLowerCase();
      return !injuryKeywords.some(kw => name.includes(kw));
    });

    const prompt = buildFullPrompt(client, intake, overview, safeExercises);

    try {
      const resp = await fetch("/api/generate-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      const raw = (data.result || "{}").replace(/```json|```/g, "").trim();
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch { throw new Error("Could not parse the generated program. Please try again."); }

      if (!parsed.weeklySchedule?.length) throw new Error("Program generation incomplete. Please try again.");

      setProgram(parsed);
      setEditedProgram(JSON.parse(JSON.stringify(parsed))); // deep clone for editing
    } catch (err) {
      setError(err.message || "Generation failed. Check your connection and try again.");
    }

    setLoading(false);
  }

  function updateDay(dayIndex, updatedDay) {
    if (!editedProgram) return;
    const schedule = [...editedProgram.weeklySchedule];
    schedule[dayIndex] = updatedDay;
    setEditedProgram({ ...editedProgram, weeklySchedule: schedule });
  }

  async function saveAndAssign() {
    if (!editedProgram || !client?.id) return;
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Create the plan record
      const { data: plan, error: planErr } = await createPlan({
        name: editedProgram.programName,
        description: editedProgram.coachNotes,
        coach_id: null, // will be set server-side via RLS
        phase: editedProgram.phase || "Phase 1",
        duration_weeks: editedProgram.durationWeeks || 8,
        ai_generated: true,
      });
      if (planErr) throw new Error(`Plan creation failed: ${planErr.message}`);

      // 2. Create exercise name → ID lookup
      const exByName = {};
      exercises.forEach(ex => { exByName[ex.name.toLowerCase()] = ex; });

      // 3. Create plan days and exercises
      const trainingDays = editedProgram.weeklySchedule.filter(d => d.type !== "rest");
      for (let di = 0; di < trainingDays.length; di++) {
        const day = trainingDays[di];

        const { data: planDay, error: dayErr } = await createPlanDay({
          plan_id: plan.id,
          day_label: day.day,
          day: day.day,
          focus: day.focus || `${day.label} — ${day.muscles?.join(", ")}`,
          type: day.type,
          muscles: day.muscles || [],
          sort_order: di + 1,
        });
        if (dayErr) throw new Error(`Day creation failed: ${dayErr.message}`);

        // Add exercises to this day
        for (let ei = 0; ei < (day.exercises || []).length; ei++) {
          const ex = day.exercises[ei];
          const exerciseRecord = exByName[ex.name.toLowerCase()];

          if (exerciseRecord) {
            await addExerciseToPlanDay(planDay.id, exerciseRecord.id, {
              sets: ex.sets,
              reps: ex.reps,
              rest: ex.rest,
              sort_order: ei + 1,
              notes: ex.rationale || null,
            });
          }
        }
      }

      // 4. Assign to client
      const { error: assignErr } = await assignPlanToClient(client.id, plan.id);
      if (assignErr) throw new Error(`Assignment failed: ${assignErr.message}`);

      setSaved(true);
    } catch (err) {
      setSaveError(err.message || "Save failed. Please try again.");
    }

    setSaving(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>
        AI Program Builder
      </div>
      <div style={{ fontSize: "18px", ...F, marginBottom: "16px" }}>{client?.name}</div>

      {/* Client summary from intake */}
      {(intake || client) && (
        <div style={{ background: "#f9f9f7", border: "1px solid #e8e8e8", borderRadius: 8, padding: "12px 14px", marginBottom: "14px" }}>
          <div style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Program inputs</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[
              ["Goal", (client?.goal || intake?.primary_goal)?.replace(/_/g, " ")],
              ["Days/week", intake?.training_days_per_week || client?.weekly_frequency],
              ["Session", (intake?.session_length_minutes || intake?.session_length) ? `${intake?.session_length_minutes || intake?.session_length} min` : null],
              ["Level", intake?.experience_level || intake?.fitness_level],
              ["Style", intake?.training_style?.replace(/_/g, " ")],
              ["Focus", intake?.focus_areas?.slice(0, 2).join(", ")],
              ["Equipment", (client?.equipment || intake?.equipment_available)?.length ? `${(client?.equipment || intake?.equipment_available).length} items` : null],
              ["Injuries", (client?.injury_flags?.length || intake?.injury_flags?.length) ? (client?.injury_flags || intake?.injury_flags).join(", ") : "none"],
              ["Cardio", intake?.cardio_types?.filter(c => c !== "none").length ? intake.cardio_types.filter(c => c !== "none").join(", ") : null],
              ["Sleep", intake?.sleep_hours_per_night ? `${intake.sleep_hours_per_night}h/night` : null],
              ["Stress", intake?.stress_level ? `${intake.stress_level}/5` : null],
              ["Protein", intake?.daily_protein_grams ? `${intake.daily_protein_grams}g/day` : null],
              ["Sex", client?.sex],
              ["Blocked days", intake?.fixed_commitments?.length ? intake.fixed_commitments.map(c => `${c.day}`).join(", ") : null],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label} style={{ background: "#fff", borderRadius: 20, padding: "3px 10px", border: "1px solid #e0e0e0" }}>
                <span style={{ fontSize: 9, color: "#bbb" }}>{label}: </span>
                <span style={{ fontSize: 10, color: "#333", fontWeight: 600 }}>{val}</span>
              </div>
            ))}
          </div>
          {(intake?.goal_notes || client?.notes) && (
            <div style={{ fontSize: 11, color: "#555", marginTop: 8, fontStyle: "italic", lineHeight: 1.5, ...F }}>
              "{intake?.goal_notes || client?.notes}"
            </div>
          )}
          {intake?.injury_notes && (
            <div style={{ fontSize: 11, color: "#a02020", marginTop: 6, lineHeight: 1.5, background: "#fff8f8", borderRadius: 6, padding: "6px 10px" }}>
              ⚠️ {intake.injury_notes}
            </div>
          )}
          {intake?.fixed_commitments?.length > 0 && (
            <div style={{ fontSize: 11, color: "#7a5010", marginTop: 6, lineHeight: 1.5, background: "#fffbea", borderRadius: 6, padding: "6px 10px" }}>
              📅 Blocked days: {intake.fixed_commitments.map(c => `${c.day} (${c.activity})`).join(", ")}
            </div>
          )}
          {!intake && (
            <div style={{ fontSize: 11, color: "#b7791f", marginTop: 6, lineHeight: 1.5 }}>
              No intake form on file — results will be based on profile data only
            </div>
          )}
        </div>
      )}

      {/* Generate button */}
      {!program && (
        <>
          <button onClick={generateProgram} disabled={loading || !exercises.length}
            style={{ width: "100%", background: loading ? "#888" : "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: 8, padding: "14px", fontSize: 14, cursor: loading ? "wait" : "pointer", ...F, letterSpacing: "0.04em", marginBottom: 10 }}>
            {loading ? "Building program..." : "Generate Program with AI"}
          </button>
          {loading && (
            <div style={{ textAlign: "center", padding: "8px 0", fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
              Reading {client?.name?.split(" ")[0]}'s intake form, injury flags, and goals — building a personalised program.
              <br />This takes about 20–30 seconds.
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: 7, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: "#a02020" }}>
          {error}
        </div>
      )}

      {/* Editable program */}
      {editedProgram && (
        <div>
          {/* Program header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 17, ...F, marginBottom: 2 }}>{editedProgram.programName}</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>{editedProgram.phase} · {editedProgram.durationWeeks} weeks</div>
            </div>
            <button onClick={generateProgram} disabled={loading}
              style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: 20, padding: "5px 12px", fontSize: 10, cursor: "pointer", color: "#888", ...F }}>
              Regenerate
            </button>
          </div>

          {/* Coach notes */}
          {editedProgram.coachNotes && (
            <div style={{ background: "#f9f9f7", border: "1px solid #e8e8e8", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <button onClick={() => setShowCoachNotes(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Programming Notes</div>
                <span style={{ fontSize: 10, color: "#ccc" }}>{showCoachNotes ? "▲" : "▼"}</span>
              </button>
              {showCoachNotes && (
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.65, ...F, fontStyle: "italic", marginTop: 8 }}>
                  {editedProgram.coachNotes}
                </div>
              )}
            </div>
          )}

          {/* Day cards — all 7 days */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Weekly Schedule — tap any day to review and edit
            </div>
            {editedProgram.weeklySchedule.map((day, di) => (
              <DayCard
                key={di}
                day={day}
                exerciseList={exercises}
                onChange={updated => updateDay(di, updated)}
              />
            ))}
          </div>

          {/* Save & assign */}
          {saved ? (
            <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 14, ...F, color: "#2d7a1e", marginBottom: 4 }}>Program saved and assigned</div>
              <div style={{ fontSize: 11, color: "#555" }}>
                {client?.name}'s dashboard has been updated. They'll see this program the next time they open the app.
              </div>
            </div>
          ) : (
            <>
              {saveError && (
                <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: 7, padding: "10px 14px", marginBottom: 10, fontSize: 11, color: "#a02020" }}>
                  {saveError}
                </div>
              )}
              <button onClick={saveAndAssign} disabled={saving}
                style={{ width: "100%", background: saving ? "#888" : "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: 8, padding: "14px", fontSize: 14, cursor: saving ? "wait" : "pointer", ...F }}>
                {saving ? "Saving..." : `Save & Assign to ${client?.name?.split(" ")[0]}`}
              </button>
              <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                This will create the plan in your database and assign it to the client.
                You can reassign or update it any time from the coach dashboard.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
