import { useState } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const STEPS = [
  "welcome",
  "goals",
  "stats",
  "measurements",
  "strength",
  "training",
  "cardio",
  "injuries",
  "lifestyle",
  "background",
  "anything_else",
  "complete",
];

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const DAY_LABELS = { MON:"Mon", TUE:"Tue", WED:"Wed", THU:"Thu", FRI:"Fri", SAT:"Sat", SUN:"Sun" };

const FOCUS_AREAS = [
  { key: "glutes", label: "Glutes" },
  { key: "legs", label: "Legs & Quads" },
  { key: "hamstrings", label: "Hamstrings" },
  { key: "upper_body", label: "Upper Body" },
  { key: "back", label: "Back" },
  { key: "shoulders", label: "Shoulders" },
  { key: "core", label: "Core & Abs" },
  { key: "arms", label: "Arms" },
  { key: "overall", label: "Full Body / Balanced" },
];

const INJURY_OPTIONS = [
  { key: "shoulder", label: "Shoulder" },
  { key: "knee", label: "Knee" },
  { key: "lower_back", label: "Lower Back" },
  { key: "upper_back", label: "Upper Back / Neck" },
  { key: "hip", label: "Hip / SI Joint" },
  { key: "elbow", label: "Elbow / Wrist" },
  { key: "ankle", label: "Ankle / Foot" },
  { key: "disc", label: "Disc / Spine" },
];

const EQUIPMENT_OPTIONS = [
  { key: "barbell", label: "Barbell + Rack" },
  { key: "dumbbell", label: "Dumbbells" },
  { key: "cable", label: "Cable Machines" },
  { key: "machine", label: "Weight Machines" },
  { key: "pull_up_bar", label: "Pull-Up Bar" },
  { key: "bench", label: "Bench" },
  { key: "band", label: "Resistance Bands" },
  { key: "kettlebell", label: "Kettlebells" },
  { key: "bodyweight", label: "Bodyweight Only" },
];

const CARDIO_OPTIONS = [
  { key: "stairmaster", label: "StairMaster" },
  { key: "treadmill", label: "Treadmill" },
  { key: "cycling", label: "Cycling / Spin" },
  { key: "elliptical", label: "Elliptical" },
  { key: "rowing", label: "Rowing Machine" },
  { key: "hiit", label: "HIIT Classes" },
  { key: "walking", label: "Walking" },
  { key: "running", label: "Running" },
  { key: "none", label: "I don't do cardio" },
];

const MEASUREMENT_GUIDES = {
  waist: {
    label: "Waist",
    fieldKey: "waist_in",
    description: "Measure at the narrowest point of your torso, usually about 1 inch above your belly button. Keep the tape horizontal and snug but not tight. Exhale normally before measuring.",
    tip: "Most accurate first thing in the morning, before eating.",
  },
  chest: {
    label: "Chest",
    fieldKey: "chest_in",
    description: "Measure across the fullest part of your chest, under your armpits and across your shoulder blades. Arms relaxed at your sides.",
    tip: "Keep the tape parallel to the floor all the way around.",
  },
  hips: {
    label: "Hips",
    fieldKey: "hips_in",
    description: "Measure at the widest point of your hips and glutes, usually 7–9 inches below your waist. Stand with feet together.",
    tip: "Look in a mirror to confirm the tape is level the whole way around.",
  },
  right_thigh: {
    label: "Right Thigh",
    fieldKey: "right_thigh_in",
    description: "Stand with feet slightly apart. Measure around the fullest part of your right thigh, halfway between the hip and knee.",
    tip: "Measure both thighs — the difference between sides is useful data.",
  },
  left_thigh: {
    label: "Left Thigh",
    fieldKey: "left_thigh_in",
    description: "Same position as the right thigh. Measure around the fullest part of your left thigh, halfway between the hip and knee.",
    tip: "Track both sides over time — asymmetries often improve with training.",
  },
  right_arm: {
    label: "Right Arm",
    fieldKey: "right_arm_in",
    description: "Arm relaxed at your side. Measure around the largest part of your right upper arm, midway between the shoulder and elbow.",
    tip: "Don't flex — a relaxed measurement is more consistent month to month.",
  },
  left_arm: {
    label: "Left Arm",
    fieldKey: "left_arm_in",
    description: "Same as the right arm. Measure around the largest part of your left upper arm, midway between shoulder and elbow.",
    tip: "Dominant arm is often slightly larger — that's normal.",
  },
};

// ── UI Components ─────────────────────────────────────────────────────────────

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const total = STEPS.length - 2;
  const pct = Math.max(0, Math.min(100, ((idx - 1) / total) * 100));
  return (
    <div style={{ height: "2px", background: "#ede9e4", borderRadius: "2px", margin: "0 0 28px" }}>
      <div style={{ height: "100%", background: "#111", borderRadius: "2px", width: `${pct}%`, transition: "width 0.4s" }} />
    </div>
  );
}

function StepLabel({ step, label }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: "#bbb", marginBottom: "5px" }}>{step}</div>
      <h2 style={{ fontSize: "23px", fontWeight: "normal", margin: 0, lineHeight: "1.2", ...F }}>{label}</h2>
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: "11px", padding: "18px", marginBottom: "12px", border: "1px solid #ede9e4", ...style }}>
      {children}
    </div>
  );
}

function Note({ children, color = "#f5f5f3", textColor = "#777" }) {
  return (
    <div style={{ background: color, borderRadius: "8px", padding: "10px 13px", marginBottom: "14px", fontSize: "11px", color: textColor, lineHeight: "1.65" }}>
      {children}
    </div>
  );
}

function Label({ text, required, optional, hint }) {
  return (
    <div style={{ marginBottom: "6px" }}>
      <div style={{ fontSize: "11px", color: "#555", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: "500" }}>
          {text}
          {required && <span style={{ color: "#a02a2a", marginLeft: "3px" }}>*</span>}
        </span>
        {optional && <span style={{ color: "#ccc", fontWeight: "normal" }}>optional</span>}
      </div>
      {hint && <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", lineHeight: "1.5" }}>{hint}</div>}
    </div>
  );
}

function TextInput({ label, required, optional, hint, value, onChange, placeholder, type = "text" }) {
  return (
    <div style={{ marginBottom: "13px" }}>
      <Label text={label} required={required} optional={optional} hint={hint} />
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "11px 13px", borderRadius: "8px",
          border: "1px solid #e4e0db", fontSize: "14px", color: "#222",
          background: "#fafaf8", ...F, boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function SelectInput({ label, required, optional, value, onChange, options }) {
  return (
    <div style={{ marginBottom: "13px" }}>
      <Label text={label} required={required} optional={optional} />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "11px 13px", borderRadius: "8px",
          border: "1px solid #e4e0db", fontSize: "14px", color: value ? "#222" : "#aaa",
          background: "#fafaf8", ...F,
        }}
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ label, hint, options, selected, onToggle, required }) {
  return (
    <div style={{ marginBottom: "13px" }}>
      <Label text={label} required={required} hint={hint} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
        {options.map(opt => {
          const isSelected = selected.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => onToggle(opt.key)}
              style={{
                background: isSelected ? "#111" : "#fafaf8",
                color: isSelected ? "#fff" : "#555",
                border: `1px solid ${isSelected ? "#111" : "#e4e0db"}`,
                borderRadius: "22px", padding: "8px 15px",
                fontSize: "12px", cursor: "pointer", ...F,
                transition: "all 0.12s",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function YesNo({ label, hint, value, onChange }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <Label text={label} hint={hint} />
      <div style={{ display: "flex", gap: "8px" }}>
        {[["Yes", true], ["No", false]].map(([lbl, val]) => (
          <button
            key={lbl}
            onClick={() => onChange(val)}
            style={{
              flex: 1, padding: "11px",
              borderRadius: "8px", fontSize: "13px", cursor: "pointer", ...F,
              background: value === val ? "#111" : "#fafaf8",
              color: value === val ? "#fff" : "#555",
              border: `1px solid ${value === val ? "#111" : "#e4e0db"}`,
              transition: "all 0.12s",
            }}
          >
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScaleInput({ label, hint, value, onChange, min = 1, max = 5, lowLabel, highLabel }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <Label text={label} hint={hint} />
      <div style={{ display: "flex", gap: "7px" }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1, padding: "11px 4px", borderRadius: "8px",
              background: value === n ? "#111" : "#fafaf8",
              color: value === n ? "#fff" : "#666",
              border: `1px solid ${value === n ? "#111" : "#e4e0db"}`,
              fontSize: "14px", fontWeight: "600", cursor: "pointer", ...F,
            }}
          >
            {n}
          </button>
        ))}
      </div>
      {(lowLabel || highLabel) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "9px", color: "#bbb" }}>{lowLabel}</span>
          <span style={{ fontSize: "9px", color: "#bbb" }}>{highLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

// ── Fixed commitment adder sub-component ─────────────────────────────────────
function CommitmentAdder({ onAdd, existingDays }) {
  const [day, setDay] = useState("");
  const [activity, setActivity] = useState("");

  const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const DAY_LABELS = { MON:"Mon", TUE:"Tue", WED:"Wed", THU:"Thu", FRI:"Fri", SAT:"Sat", SUN:"Sun" };

  function handleAdd() {
    if (!day || !activity.trim()) return;
    onAdd({ day, activity: activity.trim() });
    setDay("");
    setActivity("");
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "7px", marginBottom: "8px" }}>
        {/* Day picker */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", flex: 1 }}>
          {DAYS.map(d => (
            <button
              key={d}
              onClick={() => setDay(day === d ? "" : d)}
              style={{
                padding: "7px 8px", borderRadius: "7px", fontSize: "11px",
                cursor: "pointer", ...F,
                background: day === d ? "#111" : "#fafaf8",
                color: day === d ? "#fff" : "#666",
                border: `1px solid ${day === d ? "#111" : "#e4e0db"}`,
                opacity: existingDays.includes(d) ? 0.4 : 1,
              }}
              disabled={existingDays.includes(d)}
            >
              {DAY_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {day && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder={`What do you do on ${DAY_LABELS[day]}?`}
            value={activity}
            onChange={e => setActivity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{
              flex: 1, padding: "10px 13px", borderRadius: "8px",
              border: "1px solid #e4e0db", fontSize: "13px",
              color: "#222", background: "#fafaf8", ...F,
            }}
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={!activity.trim()}
            style={{
              background: activity.trim() ? "#111" : "#e4e0db",
              color: activity.trim() ? "#fff" : "#aaa",
              border: "none", borderRadius: "8px",
              padding: "10px 16px", fontSize: "12px",
              cursor: activity.trim() ? "pointer" : "default", ...F,
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      )}

      {!day && (
        <div style={{ textAlign: "center", padding: "10px", fontSize: "11px", color: "#ccc" }}>
          Tap a day to add a commitment
        </div>
      )}
    </div>
  );
}

export default function OnboardingQuestionnaire({ client, onComplete }) {
  const [step, setStep] = useState("welcome");
  const [saving, setSaving] = useState(false);
  const [expandedMeasurement, setExpandedMeasurement] = useState(null);

  const [form, setForm] = useState({
    // Goals
    primary_goal: "",
    target_weight_lbs: "",
    goal_timeline: "",
    focus_areas: [],
    training_style: "",
    goal_notes: "",
    // Stats
    height_ft: "",
    height_in_extra: "",
    current_weight_lbs: "",
    body_fat_pct: "",
    date_of_birth: "",
    sex: "female",
    // Measurements
    waist_in: "",
    chest_in: "",
    hips_in: "",
    right_thigh_in: "",
    left_thigh_in: "",
    right_arm_in: "",
    left_arm_in: "",
    // Strength
    bench_press_lbs: "",
    overhead_press_lbs: "",
    squat_lbs: "",
    hip_thrust_lbs: "",
    pullups_max: "",
    deadlift_lbs: "",
    // Training
    training_days_per_week: "",
    preferred_days: [],
    session_length_minutes: "",
    gym_access: true,
    equipment_available: [],
    // Cardio
    cardio_types: [],
    cardio_days_per_week: "",
    cardio_duration_minutes: "",
    cardio_notes: "",
    fixed_commitments: [], // [{ day: "SAT", activity: "Pilates" }]
    // Injuries
    injury_flags: [],
    injury_notes: "",
    mobility_limitations: "",
    // Lifestyle
    sleep_hours_per_night: "",
    stress_level: "",
    nutrition_approach: "",
    daily_protein_grams: "",
    does_stretch: null,
    // Background
    experience_level: "",
    knows_progressive_overload: null,
    knows_form_basics: null,
    prior_coaching: null,
    prior_coaching_notes: "",
    // Final
    additional_notes: "",
  });

  function update(key, value) { setForm(f => ({ ...f, [key]: value })); }
  function toggleArray(key, value) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
    }));
  }

  function canProceed() {
    if (step === "goals") return form.primary_goal && form.focus_areas.length > 0;
    if (step === "stats") return form.current_weight_lbs && form.height_ft;
    if (step === "training") return form.training_days_per_week && form.preferred_days.length > 0 && form.session_length_minutes;
    if (step === "background") return form.experience_level;
    return true;
  }

  function nextStep() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  function prevStep() {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const heightInTotal = (parseInt(form.height_ft) || 0) * 12 + (parseFloat(form.height_in_extra) || 0);

      const intakeData = {
        client_id: client.id,
        primary_goal: form.primary_goal || null,
        target_weight_lbs: form.target_weight_lbs ? parseFloat(form.target_weight_lbs) : null,
        goal_timeline: form.goal_timeline || null,
        focus_areas: form.focus_areas,
        goal_notes: [form.training_style && `Training style preference: ${form.training_style}`, form.goal_notes].filter(Boolean).join(" | ") || null,
        height_ft: form.height_ft ? parseInt(form.height_ft) : null,
        height_in: heightInTotal || null,
        current_weight_lbs: form.current_weight_lbs ? parseFloat(form.current_weight_lbs) : null,
        body_fat_pct: form.body_fat_pct ? parseFloat(form.body_fat_pct) : null,
        date_of_birth: form.date_of_birth || null,
        waist_in: form.waist_in ? parseFloat(form.waist_in) : null,
        chest_in: form.chest_in ? parseFloat(form.chest_in) : null,
        hips_in: form.hips_in ? parseFloat(form.hips_in) : null,
        right_thigh_in: form.right_thigh_in ? parseFloat(form.right_thigh_in) : null,
        left_thigh_in: form.left_thigh_in ? parseFloat(form.left_thigh_in) : null,
        right_arm_in: form.right_arm_in ? parseFloat(form.right_arm_in) : null,
        left_arm_in: form.left_arm_in ? parseFloat(form.left_arm_in) : null,
        bench_press_lbs: form.bench_press_lbs ? parseFloat(form.bench_press_lbs) : null,
        overhead_press_lbs: form.overhead_press_lbs ? parseFloat(form.overhead_press_lbs) : null,
        squat_lbs: form.squat_lbs ? parseFloat(form.squat_lbs) : null,
        hip_thrust_lbs: form.hip_thrust_lbs ? parseFloat(form.hip_thrust_lbs) : null,
        deadlift_lbs: form.deadlift_lbs ? parseFloat(form.deadlift_lbs) : null,
        pullups_max: form.pullups_max ? parseInt(form.pullups_max) : null,
        training_days_per_week: form.training_days_per_week ? parseInt(form.training_days_per_week) : null,
        preferred_days: form.preferred_days,
        fixed_commitments: form.fixed_commitments.length > 0 ? form.fixed_commitments : null,
        session_length_minutes: form.session_length_minutes ? parseInt(form.session_length_minutes) : null,
        gym_access: form.gym_access,
        equipment_available: form.equipment_available,
        injury_flags: form.injury_flags,
        injury_notes: [
          form.injury_notes,
          form.mobility_limitations && `Mobility: ${form.mobility_limitations}`,
          form.cardio_types.length > 0 && `Cardio preference: ${form.cardio_types.join(", ")}, ${form.cardio_days_per_week || "?"} days/week, ${form.cardio_duration_minutes || "?"}min`,
          form.cardio_notes,
          form.fixed_commitments.length > 0 && `Fixed weekly commitments (do not schedule lifting on these days): ${form.fixed_commitments.map(c => `${c.day} — ${c.activity}`).join("; ")}`,
        ].filter(Boolean).join(" | ") || null,
        sleep_hours_per_night: form.sleep_hours_per_night ? parseFloat(form.sleep_hours_per_night) : null,
        stress_level: form.stress_level ? parseInt(form.stress_level) : null,
        nutrition_approach: form.nutrition_approach || null,
        daily_protein_grams: form.daily_protein_grams ? parseFloat(form.daily_protein_grams) : null,
        does_stretch: form.does_stretch,
        experience_level: form.experience_level || null,
        knows_progressive_overload: form.knows_progressive_overload,
        knows_form_basics: form.knows_form_basics,
        prior_coaching: form.prior_coaching,
        prior_coaching_notes: form.prior_coaching_notes || null,
        additional_notes: form.additional_notes || null,
      };

      const { data: intake, error: intakeError } = await supabase
        .from("client_intake")
        .insert(intakeData)
        .select()
        .single();

      if (intakeError) throw intakeError;

      await supabase
        .from("clients")
        .update({ onboarding_completed: true, goal: form.primary_goal || null })
        .eq("id", client.id);

      // Seed body measurements
      const measFields = { weight_lbs: form.current_weight_lbs, waist_in: form.waist_in, hips_in: form.hips_in, chest_in: form.chest_in, right_thigh_in: form.right_thigh_in, left_thigh_in: form.left_thigh_in, right_arm_in: form.right_arm_in, left_arm_in: form.left_arm_in };
      const measData = {};
      Object.entries(measFields).forEach(([k, v]) => { if (v) measData[k] = parseFloat(v); });
      if (Object.keys(measData).length > 0) {
        await supabase.from("measurements").insert({ client_id: client.id, measured_at: new Date().toISOString().slice(0, 10), source: "intake", ...measData });
      }

      // Seed strength PRs
      if (intake?.id) {
        const { seedClientDataFromIntake } = await import("../lib/supabase");
        await seedClientDataFromIntake(client.id, intakeData);
      }

      setStep("complete");
    } catch (err) {
      console.error("Onboarding save error:", err);
    }
    setSaving(false);
  }

  // ── WELCOME ────────────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f3", padding: "0", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {/* Hero */}
        <div style={{ background: "#111", padding: "48px 28px 36px", color: "#f7f6f3" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#555", marginBottom: "10px" }}>
            Tara Mattimiro Fitness
          </div>
          <h1 style={{ fontSize: "30px", fontWeight: "normal", margin: "0 0 14px", lineHeight: "1.15", ...F }}>
            Hi {client.name?.split(" ")[0] || "there"}, let's build your plan.
          </h1>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: "1.75", margin: 0 }}>
            Before I can build something that actually works for you, I need to know who you are, what you're working toward, and what's going on with your body right now. This takes about 5–8 minutes.
          </p>
        </div>

        <div style={{ padding: "24px 20px", flex: 1 }}>
          <div style={{ marginBottom: "20px" }}>
            {[
              ["Your goals and what you want to focus on", "1–2 min"],
              ["Stats, measurements, and strength baseline", "2–3 min"],
              ["Training schedule and any limitations", "1–2 min"],
              ["Lifestyle and background", "1 min"],
            ].map(([item, time], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 0", borderBottom: "1px solid #ede9e4" }}>
                <span style={{ fontSize: "13px", color: "#333", ...F }}>{item}</span>
                <span style={{ fontSize: "10px", color: "#bbb", flexShrink: 0, marginLeft: "10px" }}>{time}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#f0f5ff", borderRadius: "9px", padding: "12px 14px", marginBottom: "20px", fontSize: "11px", color: "#2563a8", lineHeight: "1.65" }}>
            The more honest you are, the better the program. There are no wrong answers — only ones that lead to a plan that doesn't fit.
          </div>

          <button
            onClick={nextStep}
            style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "9px", padding: "15px", fontSize: "14px", cursor: "pointer", ...F }}
          >
            Start →
          </button>
        </div>
      </div>
    );
  }

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f3", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#111", padding: "48px 28px 36px", color: "#f7f6f3" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "#555", marginBottom: "10px" }}>
            All done
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "normal", margin: "0 0 12px", lineHeight: "1.2", ...F }}>
            Your intake is in.
          </h1>
          <p style={{ fontSize: "13px", color: "#888", lineHeight: "1.75", margin: 0 }}>
            I'll review everything you shared and build your program around it. You'll be notified as soon as it's ready.
          </p>
        </div>

        <div style={{ padding: "24px 20px", flex: 1 }}>
          <div style={{ marginBottom: "20px" }}>
            {[
              "Your intake has been sent to Tara",
              "She'll review your goals, history, and limitations",
              "Your personalized program will appear in the Plan tab",
              "Expect a response within 24–48 hours",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid #ede9e4", alignItems: "flex-start" }}>
                <span style={{ fontSize: "10px", color: "#bbb", marginTop: "3px", flexShrink: 0 }}>→</span>
                <span style={{ fontSize: "13px", color: "#333", lineHeight: "1.5", ...F }}>{item}</span>
              </div>
            ))}
          </div>

          <Note color="#f0fdf0" textColor="#2d7a1e">
            In the meantime, explore the app — check out the Body tab, Progress tracking, and Photos so you're ready to hit the ground running when your plan arrives.
          </Note>

          <button
            onClick={onComplete}
            style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "9px", padding: "15px", fontSize: "14px", cursor: "pointer", ...F }}
          >
            Go to the app →
          </button>
        </div>
      </div>
    );
  }

  // ── FORM STEPS ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", padding: "22px 18px 50px", maxWidth: 480, margin: "0 auto" }}>
      <ProgressBar step={step} />

      {/* ── GOALS ── */}
      {step === "goals" && (
        <>
          <StepLabel step="Step 1 of 9" label="What are you working toward?" />

          <Card>
            <SelectInput
              label="Primary goal"
              required
              value={form.primary_goal}
              onChange={v => update("primary_goal", v)}
              options={[
                { value: "fat_loss", label: "Fat loss — lose body fat" },
                { value: "muscle_gain", label: "Muscle gain — build size and strength" },
                { value: "recomp", label: "Body recomposition — lose fat, gain muscle" },
                { value: "strength", label: "Strength — get stronger, improve lifts" },
                { value: "general_health", label: "General health — feel better, move better" },
                { value: "endurance", label: "Endurance — build stamina and conditioning" },
              ]}
            />

            <TextInput
              label="Target weight"
              optional
              value={form.target_weight_lbs}
              onChange={v => update("target_weight_lbs", v)}
              placeholder="e.g. 145"
              type="number"
              hint="In pounds. Leave blank if a number on the scale is not your goal."
            />

            <SelectInput
              label="Timeline"
              optional
              value={form.goal_timeline}
              onChange={v => update("goal_timeline", v)}
              options={[
                { value: "3_months", label: "3 months" },
                { value: "6_months", label: "6 months" },
                { value: "1_year", label: "1 year" },
                { value: "ongoing", label: "Ongoing — this is a lifestyle change" },
              ]}
            />
          </Card>

          <Card>
            <MultiSelect
              label="Areas to prioritize"
              required
              hint="Pick everything that matters. Your coach will weight the program around these."
              options={FOCUS_AREAS}
              selected={form.focus_areas}
              onToggle={v => toggleArray("focus_areas", v)}
            />
          </Card>

          <Card>
            <SelectInput
              label="Training style preference"
              optional
              value={form.training_style}
              onChange={v => update("training_style", v)}
              options={[
                { value: "hypertrophy", label: "Hypertrophy — higher reps, muscle building" },
                { value: "strength", label: "Strength — lower reps, heavier weights" },
                { value: "mixed", label: "Mix of both" },
                { value: "no_preference", label: "No preference — coach decides" },
              ]}
            />

            <div style={{ marginBottom: "4px" }}>
              <Label text="Anything else about your goals?" optional />
              <textarea
                value={form.goal_notes}
                onChange={e => update("goal_notes", e.target.value)}
                placeholder="e.g. I have a wedding in 6 months, I want to feel strong for hiking, I've been stuck at the same weight for a year..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F, boxSizing: "border-box" }}
              />
            </div>
          </Card>
        </>
      )}

      {/* ── STATS ── */}
      {step === "stats" && (
        <>
          <StepLabel step="Step 2 of 9" label="Basic stats" />
          <Note>These help set appropriate starting weights and track real progress over time. Weigh yourself first thing in the morning for the most consistent number.</Note>

          <Card>
            <div style={{ marginBottom: "13px" }}>
              <Label text="Height" required />
              <div style={{ display: "flex", gap: "8px" }}>
                {[["height_ft", "ft"], ["height_in_extra", "in"]].map(([key, unit]) => (
                  <div key={key} style={{ flex: 1 }}>
                    <input
                      type="number" inputMode="numeric"
                      placeholder={unit === "ft" ? "5" : "7"}
                      value={form[key]}
                      onChange={e => update(key, e.target.value)}
                      style={{ width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "14px", ...F, boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: "9px", color: "#bbb", textAlign: "center", marginTop: "3px" }}>{unit}</div>
                  </div>
                ))}
              </div>
            </div>

            <TextInput label="Current weight" required value={form.current_weight_lbs} onChange={v => update("current_weight_lbs", v)} placeholder="e.g. 155" type="number" hint="In pounds." />
            <TextInput label="Body fat %" optional value={form.body_fat_pct} onChange={v => update("body_fat_pct", v)} placeholder="e.g. 22" type="number" hint="If you know it from a scan or test. Your coach can estimate from photos if you leave this blank." />
            <TextInput label="Date of birth" optional value={form.date_of_birth} onChange={v => update("date_of_birth", v)} type="date" hint="Helps personalize recovery recommendations." />

            <div style={{ marginBottom: "4px" }}>
              <Label text="Biological sex" hint="Used for cycle tracking and hormonal recovery personalization." />
              <div style={{ display: "flex", gap: "8px" }}>
                {[["female", "Female"], ["male", "Male"]].map(([val, label]) => (
                  <button key={val} onClick={() => update("sex", val)} style={{
                    flex: 1, padding: "11px", borderRadius: "8px",
                    background: form.sex === val ? "#111" : "#fafaf8",
                    color: form.sex === val ? "#fff" : "#555",
                    border: `1px solid ${form.sex === val ? "#111" : "#e4e0db"}`,
                    fontSize: "13px", cursor: "pointer", ...F,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── MEASUREMENTS ── */}
      {step === "measurements" && (
        <>
          <StepLabel step="Step 3 of 9" label="Body measurements" />
          <Note>All optional — but these are the most honest way to track real body composition changes. The scale can stay the same while your body is actively recomping. Measurements tell the real story.</Note>
          <Note color="#fef3e4" textColor="#7a5010">
            You need a flexible measuring tape. Take measurements first thing in the morning, before eating. Tap any measurement for instructions.
          </Note>

          {Object.entries(MEASUREMENT_GUIDES).map(([key, guide]) => {
            const isOpen = expandedMeasurement === key;
            const fieldKey = guide.fieldKey;
            return (
              <div key={key} style={{ background: "#fff", border: "1px solid #ede9e4", borderRadius: "10px", marginBottom: "8px", overflow: "hidden" }}>
                <button
                  onClick={() => setExpandedMeasurement(isOpen ? null : key)}
                  style={{ width: "100%", background: "transparent", border: "none", padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#222" }}>{guide.label}</div>
                    <div style={{ fontSize: "10px", color: "#bbb", marginTop: "1px" }}>Tap for instructions</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {form[fieldKey] && <span style={{ fontSize: "14px", fontWeight: "700", color: "#2563a8" }}>{form[fieldKey]}"</span>}
                    <span style={{ color: "#ccc", fontSize: "11px" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f5f5f3" }}>
                    <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.7", margin: "11px 0 7px" }}>{guide.description}</div>
                    <div style={{ fontSize: "11px", color: "#2563a8", background: "#e9f0fb", borderRadius: "6px", padding: "7px 10px", marginBottom: "11px", lineHeight: "1.5" }}>
                      {guide.tip}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <input
                        type="number" inputMode="decimal"
                        placeholder="Enter measurement"
                        value={form[fieldKey]}
                        onChange={e => update(fieldKey, e.target.value)}
                        style={{ flex: 1, padding: "10px 13px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "14px", ...F }}
                      />
                      <span style={{ fontSize: "12px", color: "#aaa" }}>inches</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── STRENGTH ── */}
      {step === "strength" && (
        <>
          <StepLabel step="Step 4 of 9" label="Strength baseline" />
          <Note>All optional. Enter a weight you can lift for multiple reps — not a one-rep max. If you have no idea, that is completely fine. Leave it blank and your coach will figure it out in the first few sessions.</Note>
          <Note color="#fef3e4" textColor="#7a5010">
            Beginners: if you have never done these exercises, just skip this step entirely. Your coach will assess you in person or through video form checks.
          </Note>

          <Card>
            {[
              { key: "hip_thrust_lbs", label: "Hip Thrust", placeholder: "e.g. 135", hint: "Barbell or machine — working weight for 8–12 reps" },
              { key: "bench_press_lbs", label: "Bench Press", placeholder: "e.g. 95", hint: "Barbell or dumbbell — working weight for 8–12 reps" },
              { key: "squat_lbs", label: "Squat", placeholder: "e.g. 115", hint: "Barbell, goblet, or machine — working weight" },
              { key: "deadlift_lbs", label: "Deadlift / RDL", placeholder: "e.g. 135", hint: "Romanian or conventional — working weight" },
              { key: "overhead_press_lbs", label: "Overhead Press", placeholder: "e.g. 55", hint: "Standing or seated — working weight" },
            ].map(({ key, label, placeholder, hint }) => (
              <TextInput key={key} label={label} optional value={form[key]} onChange={v => update(key, v)} placeholder={placeholder} type="number" hint={hint} />
            ))}

            <div style={{ marginBottom: "4px" }}>
              <Label text="Unassisted pull-ups" optional hint="Enter 0 if you can't do one yet — very common and nothing to be embarrassed about." />
              <input
                type="number" inputMode="numeric"
                value={form.pullups_max}
                onChange={e => update("pullups_max", e.target.value)}
                placeholder="e.g. 3"
                style={{ width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "14px", ...F, boxSizing: "border-box" }}
              />
            </div>
          </Card>
        </>
      )}

      {/* ── TRAINING ── */}
      {step === "training" && (
        <>
          <StepLabel step="Step 5 of 9" label="Training schedule" />
          <Note>Your coach will build the plan around your actual schedule. Be realistic here — a 3-day plan you stick to beats a 6-day plan you abandon by week two.</Note>

          <Card>
            <SelectInput
              label="Days per week"
              required
              value={form.training_days_per_week}
              onChange={v => update("training_days_per_week", v)}
              options={[
                { value: "2", label: "2 days" },
                { value: "3", label: "3 days" },
                { value: "4", label: "4 days" },
                { value: "5", label: "5 days" },
                { value: "6", label: "6 days" },
              ]}
            />

            <div style={{ marginBottom: "13px" }}>
              <Label text="Which days?" required hint="Pick the days that are most realistic for your schedule." />
              <div style={{ display: "flex", gap: "5px" }}>
                {DAYS.map(day => {
                  const selected = form.preferred_days.includes(day);
                  return (
                    <button key={day} onClick={() => toggleArray("preferred_days", day)} style={{
                      flex: 1, padding: "11px 2px", borderRadius: "8px",
                      background: selected ? "#111" : "#fafaf8",
                      color: selected ? "#fff" : "#666",
                      border: `1px solid ${selected ? "#111" : "#e4e0db"}`,
                      fontSize: "11px", cursor: "pointer", ...F,
                    }}>
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            <SelectInput
              label="How long per session?"
              required
              value={form.session_length_minutes}
              onChange={v => update("session_length_minutes", v)}
              options={[
                { value: "45", label: "45 minutes" },
                { value: "60", label: "60 minutes" },
                { value: "75", label: "75 minutes" },
                { value: "90", label: "90 minutes" },
                { value: "120", label: "2 hours+" },
              ]}
            />
          </Card>

          <Card>
            <div style={{ marginBottom: "13px" }}>
              <Label text="Do you have gym access?" />
              <div style={{ display: "flex", gap: "8px" }}>
                {[["Full gym", true], ["Home / limited", false]].map(([label, val]) => (
                  <button key={label} onClick={() => update("gym_access", val)} style={{
                    flex: 1, padding: "11px", borderRadius: "8px",
                    background: form.gym_access === val ? "#111" : "#fafaf8",
                    color: form.gym_access === val ? "#fff" : "#555",
                    border: `1px solid ${form.gym_access === val ? "#111" : "#e4e0db"}`,
                    fontSize: "12px", cursor: "pointer", ...F,
                  }}>{label}</button>
                ))}
              </div>
            </div>

            <MultiSelect
              label="Available equipment"
              hint="Select everything you have access to."
              options={EQUIPMENT_OPTIONS}
              selected={form.equipment_available}
              onToggle={v => toggleArray("equipment_available", v)}
            />
          </Card>
        </>
      )}

      {/* ── CARDIO ── */}
      {step === "cardio" && (
        <>
          <StepLabel step="Step 6 of 9" label="Cardio & conditioning" />
          <Note>Cardio is programmed as part of your overall plan — not as punishment. Your coach needs to know what you currently do and enjoy so it complements your lifting, not competes with it.</Note>

          <Card>
            <MultiSelect
              label="Cardio you like or currently do"
              hint="Select everything that applies. None is a valid answer."
              options={CARDIO_OPTIONS}
              selected={form.cardio_types}
              onToggle={v => toggleArray("cardio_types", v)}
            />

            {!form.cardio_types.includes("none") && form.cardio_types.length > 0 && (
              <>
                <SelectInput
                  label="How many days per week?"
                  optional
                  value={form.cardio_days_per_week}
                  onChange={v => update("cardio_days_per_week", v)}
                  options={[
                    { value: "1", label: "1 day" },
                    { value: "2", label: "2 days" },
                    { value: "3", label: "3 days" },
                    { value: "4", label: "4 days" },
                    { value: "5+", label: "5 or more days" },
                  ]}
                />

                <SelectInput
                  label="How long per session?"
                  optional
                  value={form.cardio_duration_minutes}
                  onChange={v => update("cardio_duration_minutes", v)}
                  options={[
                    { value: "15", label: "15 minutes" },
                    { value: "20", label: "20 minutes" },
                    { value: "30", label: "30 minutes" },
                    { value: "45", label: "45 minutes" },
                    { value: "60", label: "60 minutes" },
                  ]}
                />
              </>
            )}

            <div style={{ marginBottom: "13px" }}>
              <Label text="Anything else about your cardio?" optional hint="e.g. I hate steady-state, I love group classes, I walk 10k steps a day..." />
              <textarea
                value={form.cardio_notes}
                onChange={e => update("cardio_notes", e.target.value)}
                rows={2}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F, boxSizing: "border-box" }}
              />
            </div>
          </Card>

          <Card>
            <div style={{ marginBottom: "6px" }}>
              <Label
                text="Fixed weekly commitments"
                optional
                hint="Classes, sports, or activities that are already locked into your week. Your coach will build your lifting schedule around these so they never compete."
              />
              <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "10px", lineHeight: "1.5" }}>
                e.g. Pilates Saturday morning, spin class Tuesday, recreational soccer Thursday
              </div>
            </div>

            {/* Existing commitments */}
            {form.fixed_commitments.map((c, i) => (
              <div key={i} style={{
                display: "flex", gap: "8px", alignItems: "center",
                background: "#f9f9f7", borderRadius: "8px",
                padding: "9px 12px", marginBottom: "8px",
              }}>
                <span style={{ fontSize: "11px", fontWeight: "600", color: "#333", width: "38px", flexShrink: 0 }}>{c.day}</span>
                <span style={{ fontSize: "12px", color: "#555", flex: 1 }}>{c.activity}</span>
                <button
                  onClick={() => update("fixed_commitments", form.fixed_commitments.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#ccc", fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: "0 4px", flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Add new commitment */}
            <CommitmentAdder
              onAdd={commitment => update("fixed_commitments", [...form.fixed_commitments, commitment])}
              existingDays={form.fixed_commitments.map(c => c.day)}
            />
          </Card>
        </>
      )}

      {/* ── INJURIES ── */}
      {step === "injuries" && (
        <>
          <StepLabel step="Step 7 of 9" label="Injuries & limitations" />
          <Note color="#fff8f0" textColor="#7a4010">
            Being specific here protects you. Your coach will design around any limitation and avoid movements that cause pain. There is no shame in having a history — every body has one.
          </Note>
          <Note>This information is used for exercise selection only and is not medical advice. If you have a significant injury, please consult a physical therapist before starting a training program.</Note>

          <Card>
            <MultiSelect
              label="Current or past injuries and pain areas"
              hint="Select anything that is currently limiting you or that has been an issue in the past year."
              options={INJURY_OPTIONS}
              selected={form.injury_flags}
              onToggle={v => toggleArray("injury_flags", v)}
            />

            <div style={{ marginBottom: "13px" }}>
              <Label
                text="Describe any injuries in more detail"
                optional
                hint="The more specific, the better. What movements cause pain? What was the diagnosis? How long ago?"
              />
              <textarea
                value={form.injury_notes}
                onChange={e => update("injury_notes", e.target.value)}
                placeholder="e.g. Left knee pain on deep squats, diagnosed with patellar tendinitis 2021. L5 disc herniation — conventional deadlifts are off the table. Old ACL repair, right knee..."
                rows={3}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ marginBottom: "4px" }}>
              <Label text="Any mobility limitations?" optional hint="Movements, ranges of motion, or positions that are restricted or uncomfortable." />
              <textarea
                value={form.mobility_limitations}
                onChange={e => update("mobility_limitations", e.target.value)}
                placeholder="e.g. Can't sit in a full squat, limited shoulder internal rotation, tight hip flexors that pull on my lower back..."
                rows={2}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F, boxSizing: "border-box" }}
              />
            </div>
          </Card>
        </>
      )}

      {/* ── LIFESTYLE ── */}
      {step === "lifestyle" && (
        <>
          <StepLabel step="Step 8 of 9" label="Lifestyle & recovery" />
          <Note>Recovery is not separate from training — it is half of it. What happens outside the gym determines how much you get from what you do inside it.</Note>

          <Card>
            <TextInput
              label="Average sleep per night"
              optional
              value={form.sleep_hours_per_night}
              onChange={v => update("sleep_hours_per_night", v)}
              placeholder="e.g. 6.5"
              type="number"
              hint="In hours. Honest answer leads to a better plan — poor sleep changes how much volume you can recover from."
            />

            <ScaleInput
              label="Current stress level"
              hint="Life stress, not just training stress. Includes work, relationships, kids, finances — all of it."
              value={form.stress_level}
              onChange={v => update("stress_level", v)}
              lowLabel="Very low"
              highLabel="Very high"
            />

            <SelectInput
              label="How do you approach nutrition?"
              optional
              value={form.nutrition_approach}
              onChange={v => update("nutrition_approach", v)}
              options={[
                { value: "tracking_macros", label: "I track macros / calories consistently" },
                { value: "flexible", label: "I track loosely — rough numbers" },
                { value: "intuitive", label: "I eat intuitively" },
                { value: "unsure", label: "I have no structure right now" },
              ]}
            />

            <TextInput
              label="Daily protein intake"
              optional
              value={form.daily_protein_grams}
              onChange={v => update("daily_protein_grams", v)}
              placeholder="e.g. 120"
              type="number"
              hint="In grams. Estimate is fine. Leave blank if you don't track."
            />

            <YesNo
              label="Do you stretch or do mobility work regularly?"
              value={form.does_stretch}
              onChange={v => update("does_stretch", v)}
            />
          </Card>
        </>
      )}

      {/* ── BACKGROUND ── */}
      {step === "background" && (
        <>
          <StepLabel step="Step 9 of 9" label="Training background" />
          <Note>Helps your coach calibrate how much coaching and explanation to include in your plan, and how aggressively to start loading.</Note>

          <Card>
            <SelectInput
              label="Training experience"
              required
              value={form.experience_level}
              onChange={v => update("experience_level", v)}
              options={[
                { value: "beginner", label: "Beginner — less than 1 year of consistent training" },
                { value: "intermediate", label: "Intermediate — 1 to 3 years of consistent training" },
                { value: "advanced", label: "Advanced — 3+ years, training with intention" },
              ]}
            />

            <YesNo
              label="Do you know what progressive overload is?"
              hint="Gradually increasing the challenge over time — more weight, more reps, or harder variations — to keep making progress."
              value={form.knows_progressive_overload}
              onChange={v => update("knows_progressive_overload", v)}
            />

            <YesNo
              label="Are you comfortable with basic lifting form?"
              hint="Things like bracing your core, hinging at the hips, keeping a neutral spine, and tracking your knees over your toes."
              value={form.knows_form_basics}
              onChange={v => update("knows_form_basics", v)}
            />

            <YesNo
              label="Have you worked with a coach or trainer before?"
              value={form.prior_coaching}
              onChange={v => update("prior_coaching", v)}
            />

            {form.prior_coaching && (
              <div style={{ marginBottom: "4px" }}>
                <Label text="What worked and what didn't?" optional hint="Helps avoid repeating approaches that didn't serve you." />
                <textarea
                  value={form.prior_coaching_notes}
                  onChange={e => update("prior_coaching_notes", e.target.value)}
                  placeholder="e.g. Loved the structure but the volume was too high for my recovery. Was given a generic plan that didn't account for my knee..."
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F, boxSizing: "border-box" }}
                />
              </div>
            )}
          </Card>
        </>
      )}

      {/* ── ANYTHING ELSE ── */}
      {step === "anything_else" && (
        <>
          <StepLabel step="Final step" label="Anything else?" />
          <Note>Is there anything important your coach should know that wasn't covered? This goes directly to Tara. No detail is too small or too personal.</Note>

          <Card>
            <div style={{ marginBottom: "4px" }}>
              <Label
                text="Open field for Tara"
                optional
                hint="Past struggles, life context, things you're nervous about, specific requests — anything that matters."
              />
              <textarea
                value={form.additional_notes}
                onChange={e => update("additional_notes", e.target.value)}
                placeholder="e.g. I've tried and failed to stay consistent for years and I need accountability. I have a complicated relationship with food that I want you to be aware of. I'm a night shift nurse so my schedule is irregular..."
                rows={5}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.7", ...F, boxSizing: "border-box" }}
              />
            </div>
          </Card>

          <Note color="#f5f5f3" textColor="#888">
            By submitting, you are sharing this information with Tara Mattimiro to build your personalized training plan. It is kept private and used for coaching purposes only.
          </Note>
        </>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <button
          onClick={prevStep}
          style={{ flex: 1, background: "#fafaf8", color: "#555", border: "1px solid #e4e0db", borderRadius: "9px", padding: "14px", fontSize: "13px", cursor: "pointer", ...F }}
        >
          ← Back
        </button>
        {step === "anything_else" ? (
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 2, background: saving ? "#ccc" : "#111", color: "#fff", border: "none", borderRadius: "9px", padding: "14px", fontSize: "13px", cursor: saving ? "default" : "pointer", ...F }}
          >
            {saving ? "Submitting..." : "Submit to Tara →"}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            style={{ flex: 2, background: canProceed() ? "#111" : "#ddd", color: canProceed() ? "#fff" : "#aaa", border: "none", borderRadius: "9px", padding: "14px", fontSize: "13px", cursor: canProceed() ? "pointer" : "default", ...F }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
