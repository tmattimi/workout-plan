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
  "injuries",
  "lifestyle",
  "background",
  "anything_else",
  "complete",
];

const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const DAY_LABELS = { MON:"Mon", TUE:"Tue", WED:"Wed", THU:"Thu", FRI:"Fri", SAT:"Sat", SUN:"Sun" };

const FOCUS_AREAS = [
  { key: "glutes", label: "Glutes / Booty", emoji: "🍑" },
  { key: "upper_body", label: "Upper Body", emoji: "💪" },
  { key: "core", label: "Core / Abs", emoji: "🧱" },
  { key: "legs", label: "Legs / Quads", emoji: "🦵" },
  { key: "back", label: "Back", emoji: "🔙" },
  { key: "shoulders", label: "Shoulders", emoji: "🏋️" },
  { key: "overall", label: "Overall / Balanced", emoji: "⚖️" },
  { key: "weight_loss", label: "Fat Loss", emoji: "🔥" },
  { key: "muscle_gain", label: "Muscle Gain", emoji: "📈" },
];

const INJURY_OPTIONS = [
  { key: "shoulder", label: "Shoulder" },
  { key: "knee", label: "Knee" },
  { key: "lower_back", label: "Lower Back" },
  { key: "upper_back", label: "Upper Back / Neck" },
  { key: "hip", label: "Hip" },
  { key: "elbow", label: "Elbow / Wrist" },
  { key: "ankle", label: "Ankle / Foot" },
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

function ProgressBar({ step }) {
  const idx = STEPS.indexOf(step);
  const total = STEPS.length - 2; // exclude welcome and complete
  const pct = Math.max(0, Math.min(100, ((idx - 1) / total) * 100));
  return (
    <div style={{ height: "3px", background: "#f0f0f0", borderRadius: "2px", margin: "0 0 24px" }}>
      <div style={{ height: "100%", background: "#111", borderRadius: "2px", width: `${pct}%`, transition: "width 0.3s" }} />
    </div>
  );
}

function Section({ title, subtitle, required, children }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>
          {title}
          {required && <span style={{ color: "#a02a2a", marginLeft: "4px", fontSize: "12px" }}>*</span>}
        </div>
        {subtitle && <div style={{ fontSize: "12px", color: "#777", lineHeight: "1.5" }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required, type = "text", hint }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
        <span>{label}{required && <span style={{ color: "#a02a2a" }}> *</span>}</span>
        {!required && <span style={{ color: "#bbb" }}>Optional</span>}
      </div>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}
      />
      {hint && <div style={{ fontSize: "10px", color: "#aaa", marginTop: "3px" }}>{hint}</div>}
    </div>
  );
}

function SelectInput({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
        {label}{required && <span style={{ color: "#a02a2a" }}> *</span>}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", background: "#fff", ...F }}>
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ label, options, selected, onToggle, required }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
        {label}{required && <span style={{ color: "#a02a2a" }}> *</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
        {options.map(opt => {
          const isSelected = selected.includes(opt.key);
          return (
            <button key={opt.key} onClick={() => onToggle(opt.key)} style={{
              background: isSelected ? "#111" : "#fff",
              color: isSelected ? "#fff" : "#555",
              border: `1px solid ${isSelected ? "#111" : "#e0e0e0"}`,
              borderRadius: "20px", padding: "7px 14px",
              fontSize: "12px", cursor: "pointer", ...F,
              display: "flex", alignItems: "center", gap: "5px",
            }}>
              {opt.emoji && <span>{opt.emoji}</span>}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ScaleInput({ label, value, onChange, min = 1, max = 5, labels }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>{label}</div>
      <div style={{ display: "flex", gap: "8px" }}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            flex: 1, padding: "10px 4px", borderRadius: "7px",
            background: value === n ? "#111" : "#fff",
            color: value === n ? "#fff" : "#555",
            border: `1px solid ${value === n ? "#111" : "#e0e0e0"}`,
            fontSize: "13px", cursor: "pointer", ...F,
          }}>
            {n}
          </button>
        ))}
      </div>
      {labels && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ fontSize: "9px", color: "#aaa" }}>{labels[0]}</span>
          <span style={{ fontSize: "9px", color: "#aaa" }}>{labels[1]}</span>
        </div>
      )}
    </div>
  );
}

// Measurement diagram descriptions
const MEASUREMENT_GUIDES = {
  waist: { label: "Waist", unit: "in", description: "Measure at the narrowest point of your torso, usually about 1 inch above your belly button. Keep the tape horizontal and snug but not tight. Breathe out normally before measuring.", tip: "Most accurate first thing in the morning before eating." },
  chest: { label: "Chest", unit: "in", description: "Measure across the fullest part of your chest, under your armpits and across your shoulder blades. Keep arms relaxed at your sides.", tip: "Keep the tape parallel to the floor all the way around." },
  hips: { label: "Hips", unit: "in", description: "Measure at the widest point of your hips and glutes, usually about 7–9 inches below your waist. Stand with feet together.", tip: "Look in a mirror to make sure the tape is level all the way around." },
  right_thigh: { label: "Right Thigh", unit: "in", description: "Stand with feet slightly apart. Measure around the fullest part of your right thigh, halfway between the hip and knee.", tip: "Measure both thighs — differences between sides are important tracking data." },
  left_thigh: { label: "Left Thigh", unit: "in", description: "Same position as right thigh. Measure around the fullest part of your left thigh, halfway between the hip and knee.", tip: "Track the gap between left and right over time." },
  right_arm: { label: "Right Arm", unit: "in", description: "Relax your arm at your side. Measure around the largest part of your right upper arm, midway between the shoulder and elbow.", tip: "Don't flex — a relaxed measurement is more consistent." },
  left_arm: { label: "Left Arm", unit: "in", description: "Same as right arm. Measure around the largest part of your left upper arm, midway between shoulder and elbow.", tip: "Track the gap between arms — this often reveals dominant side patterns." },
};

export default function OnboardingQuestionnaire({ client, onComplete }) {
  const [step, setStep] = useState("welcome");
  const [saving, setSaving] = useState(false);
  const [expandedMeasurement, setExpandedMeasurement] = useState(null);

  // Form state
  const [form, setForm] = useState({
    // Goals
    primary_goal: "",
    target_weight_lbs: "",
    goal_timeline: "",
    focus_areas: [],
    goal_notes: "",
    // Stats
    height_ft: "",
    height_in_extra: "",
    current_weight_lbs: "",
    body_fat_pct: "",
    date_of_birth: "",
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
    // Injuries
    injury_flags: [],
    injury_notes: "",
    mobility_limitations: "",
    // Lifestyle
    sleep_hours_per_night: "",
    nutrition_approach: "",
    daily_protein_grams: "",
    does_stretch: null,
    stress_level: "",
    // Background
    experience_level: "",
    knows_progressive_overload: null,
    knows_form_basics: null,
    prior_coaching: null,
    // Additional
    additional_notes: "",
  });

  function update(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleArray(key, value) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value]
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
        goal_notes: form.goal_notes || null,
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
        pullups_max: form.pullups_max ? parseInt(form.pullups_max) : null,
        deadlift_lbs: form.deadlift_lbs ? parseFloat(form.deadlift_lbs) : null,
        training_days_per_week: form.training_days_per_week ? parseInt(form.training_days_per_week) : null,
        preferred_days: form.preferred_days,
        session_length_minutes: form.session_length_minutes ? parseInt(form.session_length_minutes) : null,
        gym_access: form.gym_access,
        equipment_available: form.equipment_available,
        injury_flags: form.injury_flags,
        injury_notes: form.injury_notes || null,
        mobility_limitations: form.mobility_limitations || null,
        sleep_hours_per_night: form.sleep_hours_per_night ? parseFloat(form.sleep_hours_per_night) : null,
        nutrition_approach: form.nutrition_approach || null,
        daily_protein_grams: form.daily_protein_grams ? parseFloat(form.daily_protein_grams) : null,
        does_stretch: form.does_stretch,
        stress_level: form.stress_level ? parseInt(form.stress_level) : null,
        experience_level: form.experience_level || null,
        knows_progressive_overload: form.knows_progressive_overload,
        knows_form_basics: form.knows_form_basics,
        prior_coaching: form.prior_coaching,
        additional_notes: form.additional_notes || null,
      };

      // 1. Save full intake form
      await supabase.from("client_intake").upsert(intakeData, { onConflict: "client_id" });

      // 2. Update client profile
      await supabase.from("clients").update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        current_weight_lbs: intakeData.current_weight_lbs,
        goal_weight_lbs: intakeData.target_weight_lbs,
        height_in: intakeData.height_in,
        goal: intakeData.primary_goal,
        weekly_frequency: intakeData.training_days_per_week,
        equipment: intakeData.equipment_available && intakeData.equipment_available.length ? intakeData.equipment_available : null,
        injury_flags: intakeData.injury_flags,
        date_of_birth: intakeData.date_of_birth,
      }).eq("id", client.id);

      // 3. Save initial measurements if any were provided
      const hasMeasurements = intakeData.waist_in || intakeData.chest_in || intakeData.hips_in ||
        intakeData.right_thigh_in || intakeData.left_thigh_in ||
        intakeData.right_arm_in || intakeData.left_arm_in || intakeData.current_weight_lbs;

      if (hasMeasurements) {
        await supabase.from("measurements").insert({
          client_id: client.id,
          measured_at: new Date().toISOString().slice(0, 10),
          weight_lbs: intakeData.current_weight_lbs,
          waist_in: intakeData.waist_in,
          chest_in: intakeData.chest_in,
          hips_in: intakeData.hips_in,
          right_thigh_in: intakeData.right_thigh_in,
          left_thigh_in: intakeData.left_thigh_in,
          right_arm_in: intakeData.right_arm_in,
          left_arm_in: intakeData.left_arm_in,
          body_fat_pct: intakeData.body_fat_pct,
          notes: "Initial measurement from onboarding",
        });
      }

      setStep("complete");
    } catch (err) {
      console.error("Onboarding save error:", err);
    }
    setSaving(false);
  }

  const cardStyle = { background: "#fff", borderRadius: "10px", padding: "20px", marginBottom: "16px", border: "1px solid #e8e8e8" };

  // ── WELCOME ────────────────────────────────────────────────────────────────
  if (step === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f3", padding: "40px 20px", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👋</div>
          <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#999", marginBottom: "6px" }}>Welcome</div>
          <h1 style={{ fontSize: "26px", fontWeight: "normal", margin: "0 0 12px", ...F }}>
            Hi {client.name?.split(" ")[0] || "there"}!
          </h1>
          <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.7", margin: "0 0 8px" }}>
            Before your coach builds your personalized plan, we need to learn a little about you.
          </p>
          <p style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6" }}>
            This takes about 5–8 minutes. Required fields are marked with a red asterisk. Everything else is optional but helpful.
          </p>
        </div>

        <div style={{ background: "#111", borderRadius: "10px", padding: "20px", marginBottom: "20px", color: "#f7f6f3" }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#555", marginBottom: "8px" }}>What to expect</div>
          {["Your goals and what you want to focus on", "Basic stats and body measurements", "Strength benchmarks if you know them", "How many days and how long you want to train", "Any injuries or limitations your coach needs to know", "Your lifestyle and training background"].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "12px", color: "#aaa" }}>
              <span style={{ color: "#555" }}>→</span>
              <span>{item}</span>
            </div>
          ))}
        </div>

        <button onClick={nextStep} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "14px", cursor: "pointer", ...F }}>
          Let's get started →
        </button>
      </div>
    );
  }

  // ── COMPLETE ───────────────────────────────────────────────────────────────
  if (step === "complete") {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f6f3", padding: "40px 20px", maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>🎯</div>
        <h1 style={{ fontSize: "24px", fontWeight: "normal", margin: "0 0 12px", ...F }}>You're all set!</h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: "1.7", margin: "0 0 8px" }}>
          Your intake has been sent to your coach. They'll review everything and build your personalized plan.
        </p>
        <p style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.6", marginBottom: "28px" }}>
          You'll be notified when your plan is ready. In the meantime, you can explore the app.
        </p>
        <button onClick={onComplete} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "14px", fontSize: "14px", cursor: "pointer", ...F }}>
          Go to App →
        </button>
      </div>
    );
  }

  // ── MAIN FORM STEPS ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", padding: "20px 16px 40px", maxWidth: 480, margin: "0 auto" }}>
      <ProgressBar step={step} />

      {/* GOALS */}
      {step === "goals" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 1</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 20px", ...F }}>Your Goals</h2>

          <div style={cardStyle}>
            <SelectInput label="Primary goal" required value={form.primary_goal} onChange={v => update("primary_goal", v)} options={[
              { value: "fat_loss", label: "Fat Loss / Cut" },
              { value: "muscle_gain", label: "Muscle Gain / Bulk" },
              { value: "recomp", label: "Body Recomposition (lose fat, gain muscle)" },
              { value: "strength", label: "Strength / Performance" },
              { value: "endurance", label: "Endurance / Cardio" },
              { value: "general_health", label: "General Health and Fitness" },
            ]} />

            <TextInput label="Target weight" value={form.target_weight_lbs} onChange={v => update("target_weight_lbs", v)}
              placeholder="e.g. 145" type="number" hint="In pounds. Leave blank if weight isn't your primary focus." />

            <SelectInput label="Timeline" value={form.goal_timeline} onChange={v => update("goal_timeline", v)} options={[
              { value: "3_months", label: "3 months" },
              { value: "6_months", label: "6 months" },
              { value: "1_year", label: "1 year" },
              { value: "ongoing", label: "Ongoing / long-term lifestyle" },
            ]} />
          </div>

          <div style={cardStyle}>
            <MultiSelect label="Areas to focus on *" required selected={form.focus_areas}
              options={FOCUS_AREAS} onToggle={v => toggleArray("focus_areas", v)} />
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Anything else about your goals?</div>
            <textarea value={form.goal_notes} onChange={e => update("goal_notes", e.target.value)}
              placeholder="e.g. I want to feel stronger for hiking, I have a wedding in 6 months..."
              rows={3} style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
          </div>
        </div>
      )}

      {/* STATS */}
      {step === "stats" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 2</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Basic Stats</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
            These help your coach set appropriate starting weights and track your progress accurately.
          </p>

          <div style={cardStyle}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Height <span style={{ color: "#a02a2a" }}>*</span></div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <div style={{ flex: 1 }}>
                <input type="number" inputMode="numeric" placeholder="Feet" value={form.height_ft} onChange={e => update("height_ft", e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
                <div style={{ fontSize: "9px", color: "#aaa", marginTop: "2px", textAlign: "center" }}>ft</div>
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" inputMode="numeric" placeholder="Inches" value={form.height_in_extra} onChange={e => update("height_in_extra", e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
                <div style={{ fontSize: "9px", color: "#aaa", marginTop: "2px", textAlign: "center" }}>in</div>
              </div>
            </div>

            <TextInput label="Current weight" required value={form.current_weight_lbs} onChange={v => update("current_weight_lbs", v)}
              placeholder="e.g. 155" type="number" hint="In pounds. Weigh yourself first thing in the morning for consistency." />

            <TextInput label="Body fat %" value={form.body_fat_pct} onChange={v => update("body_fat_pct", v)}
              placeholder="e.g. 22" type="number" hint="If you know it. Not required — your coach can estimate from photos and measurements." />

            <TextInput label="Date of birth" value={form.date_of_birth} onChange={v => update("date_of_birth", v)}
              type="date" hint="Helps personalize recovery and training recommendations." />
          </div>
        </div>
      )}

      {/* MEASUREMENTS */}
      {step === "measurements" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 3</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Body Measurements</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "16px", lineHeight: "1.5" }}>
            All optional — but incredibly useful for tracking real body composition changes. Tap any measurement for instructions on how to take it accurately.
          </p>

          <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "8px", padding: "10px 13px", marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "#7a5010" }}>📏 You need a flexible measuring tape. Take measurements first thing in the morning before eating, in your underwear.</div>
          </div>

          {Object.entries(MEASUREMENT_GUIDES).map(([key, guide]) => {
            const isOpen = expandedMeasurement === key;
            const fieldKey = key === "right_thigh" ? "right_thigh_in" : key === "left_thigh" ? "left_thigh_in" : key === "right_arm" ? "right_arm_in" : key === "left_arm" ? "left_arm_in" : `${key}_in`;
            return (
              <div key={key} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "8px", overflow: "hidden" }}>
                <button onClick={() => setExpandedMeasurement(isOpen ? null : key)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{guide.label}</div>
                    <div style={{ fontSize: "10px", color: "#aaa" }}>Tap for how-to</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {form[fieldKey] && <span style={{ fontSize: "13px", fontWeight: "600", color: "#2563a8" }}>{form[fieldKey]}"</span>}
                    <span style={{ color: "#ccc" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.7", margin: "10px 0 6px" }}>{guide.description}</div>
                    <div style={{ fontSize: "11px", color: "#2563a8", background: "#e9f0fb", borderRadius: "5px", padding: "6px 9px", marginBottom: "10px" }}>
                      💡 {guide.tip}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="number" inputMode="decimal" placeholder="Measurement" value={form[fieldKey]}
                        onChange={e => update(fieldKey, e.target.value)}
                        style={{ flex: 1, padding: "9px 12px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "14px", ...F }} />
                      <span style={{ fontSize: "13px", color: "#aaa" }}>inches</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* STRENGTH */}
      {step === "strength" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 4</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Strength Benchmarks</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "16px", lineHeight: "1.5" }}>
            All optional. Enter your best single lift or a weight you can do for multiple reps — just note which in the field. If you don't know, leave it blank and your coach will start you from scratch.
          </p>

          <div style={cardStyle}>
            {[
              { key: "bench_press_lbs", label: "Bench Press", placeholder: "e.g. 135 (3×8)", hint: "Flat bench, barbell or dumbbell" },
              { key: "overhead_press_lbs", label: "Overhead Press", placeholder: "e.g. 85 (3×10)", hint: "Standing or seated, barbell or dumbbell" },
              { key: "squat_lbs", label: "Squat", placeholder: "e.g. 185 (5×5)", hint: "Barbell back squat or goblet squat" },
              { key: "hip_thrust_lbs", label: "Hip Thrust", placeholder: "e.g. 225 (3×12)", hint: "Barbell or machine" },
              { key: "deadlift_lbs", label: "Deadlift", placeholder: "e.g. 225 (1 rep max)", hint: "Conventional or Romanian" },
            ].map(({ key, label, placeholder, hint }) => (
              <TextInput key={key} label={label} value={form[key]} onChange={v => update(key, v)}
                placeholder={placeholder} type="number" hint={hint} />
            ))}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                <span>Max pull-ups (unassisted)</span>
                <span style={{ color: "#bbb" }}>Optional</span>
              </div>
              <input type="number" inputMode="numeric" value={form.pullups_max} onChange={e => update("pullups_max", e.target.value)}
                placeholder="e.g. 5" style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
              <div style={{ fontSize: "10px", color: "#aaa", marginTop: "3px" }}>Enter 0 if you can't do one yet — that's totally fine and common</div>
            </div>
          </div>
        </div>
      )}

      {/* TRAINING */}
      {step === "training" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 5</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Training Preferences</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
            Your coach will build the plan around your schedule and available time.
          </p>

          <div style={cardStyle}>
            <SelectInput label="Days per week *" required value={form.training_days_per_week} onChange={v => update("training_days_per_week", v)} options={[
              { value: "3", label: "3 days" },
              { value: "4", label: "4 days" },
              { value: "5", label: "5 days" },
              { value: "6", label: "6 days" },
              { value: "7", label: "7 days" },
            ]} />

            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Which days? <span style={{ color: "#a02a2a" }}>*</span></div>
              <div style={{ display: "flex", gap: "6px" }}>
                {DAYS.map(day => {
                  const selected = form.preferred_days.includes(day);
                  return (
                    <button key={day} onClick={() => toggleArray("preferred_days", day)} style={{
                      flex: 1, padding: "10px 4px", borderRadius: "7px",
                      background: selected ? "#111" : "#fff",
                      color: selected ? "#fff" : "#555",
                      border: `1px solid ${selected ? "#111" : "#e0e0e0"}`,
                      fontSize: "11px", cursor: "pointer", ...F,
                    }}>
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            <SelectInput label="How long per session? *" required value={form.session_length_minutes} onChange={v => update("session_length_minutes", v)} options={[
              { value: "45", label: "45 minutes" },
              { value: "60", label: "60 minutes" },
              { value: "75", label: "75 minutes" },
              { value: "90", label: "90 minutes" },
              { value: "120", label: "2 hours" },
            ]} />
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "10px" }}>Do you have gym access?</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              {[["Yes, full gym", true], ["Home / limited equipment", false]].map(([label, val]) => (
                <button key={label} onClick={() => update("gym_access", val)} style={{
                  flex: 1, padding: "10px", borderRadius: "7px",
                  background: form.gym_access === val ? "#111" : "#fff",
                  color: form.gym_access === val ? "#fff" : "#555",
                  border: `1px solid ${form.gym_access === val ? "#111" : "#e0e0e0"}`,
                  fontSize: "12px", cursor: "pointer", ...F,
                }}>{label}</button>
              ))}
            </div>

            <MultiSelect label="Available equipment" selected={form.equipment_available}
              options={EQUIPMENT_OPTIONS} onToggle={v => toggleArray("equipment_available", v)} />
          </div>
        </div>
      )}

      {/* INJURIES */}
      {step === "injuries" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 6</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Injuries & Limitations</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "16px", lineHeight: "1.5" }}>
            Being honest here protects you. Your coach will design around any limitations and avoid movements that could cause pain or re-injury.
          </p>

          <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "10px 13px", marginBottom: "16px", fontSize: "10px", color: "#888", lineHeight: "1.5" }}>
            This information is used for exercise selection only and does not constitute medical advice. If you have a significant injury, consult a licensed physical therapist before starting a training program.
          </div>

          <div style={cardStyle}>
            <MultiSelect label="Any current or past injuries or pain areas?" selected={form.injury_flags}
              options={INJURY_OPTIONS} onToggle={v => toggleArray("injury_flags", v)} />

            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Tell your coach more about any injuries</div>
              <textarea value={form.injury_notes} onChange={e => update("injury_notes", e.target.value)}
                placeholder="e.g. Left knee pain when squatting deep, old shoulder injury from 2019 that still bothers me overhead..."
                rows={3} style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
            </div>

            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Any mobility limitations?</div>
              <textarea value={form.mobility_limitations} onChange={e => update("mobility_limitations", e.target.value)}
                placeholder="e.g. Can't sit in a deep squat, limited shoulder rotation, tight hip flexors..."
                rows={2} style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
            </div>
          </div>
        </div>
      )}

      {/* LIFESTYLE */}
      {step === "lifestyle" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 7</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Lifestyle & Recovery</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
            Recovery is half the program. Your coach needs to know what's happening outside the gym.
          </p>

          <div style={cardStyle}>
            <TextInput label="Average sleep per night" value={form.sleep_hours_per_night} onChange={v => update("sleep_hours_per_night", v)}
              placeholder="e.g. 7" type="number" hint="In hours. Honest answers lead to a better plan." />

            <ScaleInput label="Current stress level (1 = very low, 5 = very high)" value={form.stress_level}
              onChange={v => update("stress_level", v)} labels={["Very low", "Very high"]} />

            <SelectInput label="How do you approach nutrition?" value={form.nutrition_approach} onChange={v => update("nutrition_approach", v)} options={[
              { value: "tracking_macros", label: "I track macros / calories" },
              { value: "flexible", label: "I track loosely / flexible dieting" },
              { value: "intuitive", label: "I eat intuitively" },
              { value: "unsure", label: "I'm not sure / no structure" },
            ]} />

            <TextInput label="Daily protein intake" value={form.daily_protein_grams} onChange={v => update("daily_protein_grams", v)}
              placeholder="e.g. 120" type="number" hint="In grams per day. Estimate is fine. Leave blank if you don't track." />

            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>Do you stretch or do mobility work?</div>
              <div style={{ display: "flex", gap: "8px" }}>
                {[["Yes, regularly", true], ["Rarely or never", false]].map(([label, val]) => (
                  <button key={label} onClick={() => update("does_stretch", val)} style={{
                    flex: 1, padding: "10px", borderRadius: "7px",
                    background: form.does_stretch === val ? "#111" : "#fff",
                    color: form.does_stretch === val ? "#fff" : "#555",
                    border: `1px solid ${form.does_stretch === val ? "#111" : "#e0e0e0"}`,
                    fontSize: "12px", cursor: "pointer", ...F,
                  }}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BACKGROUND */}
      {step === "background" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Step 8</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Training Background</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
            Helps your coach calibrate how much explanation and coaching you need in the plan.
          </p>

          <div style={cardStyle}>
            <SelectInput label="Training experience *" required value={form.experience_level} onChange={v => update("experience_level", v)} options={[
              { value: "beginner", label: "Beginner (less than 1 year consistent training)" },
              { value: "intermediate", label: "Intermediate (1–3 years consistent training)" },
              { value: "advanced", label: "Advanced (3+ years, trained with intention)" },
            ]} />

            {[
              { key: "knows_progressive_overload", label: "Do you know what progressive overload is?", hint: "Gradually increasing weight, reps, or difficulty over time to keep making progress." },
              { key: "knows_form_basics", label: "Are you comfortable with basic lifting form?", hint: "Things like bracing your core, hip hinging, and keeping a neutral spine." },
              { key: "prior_coaching", label: "Have you worked with a coach or trainer before?", hint: "" },
            ].map(({ key, label, hint }) => (
              <div key={key} style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: "#555", marginBottom: "4px", fontWeight: "500" }}>{label}</div>
                {hint && <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "7px", lineHeight: "1.4" }}>{hint}</div>}
                <div style={{ display: "flex", gap: "8px" }}>
                  {[["Yes", true], ["No", false]].map(([lbl, val]) => (
                    <button key={lbl} onClick={() => update(key, val)} style={{
                      flex: 1, padding: "10px", borderRadius: "7px",
                      background: form[key] === val ? "#111" : "#fff",
                      color: form[key] === val ? "#fff" : "#555",
                      border: `1px solid ${form[key] === val ? "#111" : "#e0e0e0"}`,
                      fontSize: "12px", cursor: "pointer", ...F,
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANYTHING ELSE */}
      {step === "anything_else" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "4px" }}>Last Step</div>
          <h2 style={{ fontSize: "22px", fontWeight: "normal", margin: "0 0 8px", ...F }}>Anything Else?</h2>
          <p style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.5" }}>
            Is there anything important your coach should know that wasn't covered? This goes directly to them.
          </p>

          <div style={cardStyle}>
            <textarea value={form.additional_notes} onChange={e => update("additional_notes", e.target.value)}
              placeholder="e.g. I have a trip in 3 weeks where I won't have gym access, I'm a busy mom of 3 so consistency is a challenge, I've struggled with disordered eating in the past..."
              rows={6} style={{ width: "100%", padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", resize: "none", lineHeight: "1.6", ...F }} />
          </div>

          <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "12px 14px", marginBottom: "16px", fontSize: "11px", color: "#666", lineHeight: "1.6" }}>
            By submitting this form, you're sharing this information with your coach Tara Mattimiro to build your personalized plan. This information is kept private and used only for coaching purposes.
          </div>
        </div>
      )}

      {/* Navigation */}
      {step !== "welcome" && step !== "complete" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={prevStep} style={{ flex: 1, background: "#f5f5f3", color: "#555", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: "pointer", ...F }}>
            ← Back
          </button>
          {step === "anything_else" ? (
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, background: saving ? "#aaa" : "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: "pointer", ...F }}>
              {saving ? "Submitting..." : "Submit to Coach →"}
            </button>
          ) : (
            <button onClick={nextStep} disabled={!canProceed()} style={{ flex: 2, background: canProceed() ? "#111" : "#ccc", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: canProceed() ? "pointer" : "default", ...F }}>
              Continue →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
