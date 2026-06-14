import { useState, useEffect, useCallback } from "react";
import {
  getClientActivePlan, getAllExercises,
  createPlanDay, updatePlanDay,
  addExerciseToPlanDay, removePlanExercise, updatePlanExercise, reorderPlanExercises,
} from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const DAY_ORDER = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_NAMES = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday", SUN: "Sunday" };
const SESSION_TYPES = [
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "upper", label: "Upper" },
  { id: "lower", label: "Lower" },
  { id: "full", label: "Full Body" },
  { id: "cardio", label: "Cardio" },
  { id: "rest", label: "Rest" },
];

// ── Component ─────────────────────────────────────────────────────────────────
// Edits a client's ACTIVE plan in place. Reads the plan_days / plan_exercises
// that the client app already consumes, and writes changes back through the
// existing Supabase CRUD helpers. Changes appear for the client next time they
// open their plan.
export default function ClientPlanEditor({ client }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);
  const [openDay, setOpenDay] = useState(null);   // day_of_week currently expanded
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [searchForDay, setSearchForDay] = useState(null); // plan_day id we're adding to

  const flash = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); }, []);

  const load = useCallback(async () => {
    if (!client?.id) return;
    setLoading(true);
    const { data } = await getClientActivePlan(client.id);
    setPlan(data || null);
    setLoading(false);
  }, [client]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getAllExercises().then(({ data }) => setExercises(data || [])); }, []);

  // Days sorted into week order; fill any missing weekday as a virtual "rest" slot
  // that becomes a real row the moment it's edited.
  const daysByKey = {};
  (plan?.plan_days || []).forEach(d => { daysByKey[d.day_of_week] = d; });

  async function ensureDay(dow) {
    // Return the existing plan_day, or create one for this weekday.
    if (daysByKey[dow]) return daysByKey[dow];
    const { data, error } = await createPlanDay({
      plan_id: plan.id, day_of_week: dow, session_type: "rest",
      label: DAY_NAMES[dow], focus: "Rest & Recovery", muscles: [],
    });
    if (error) { flash("Could not create day"); return null; }
    await load();
    return data;
  }

  async function changeDayType(dow, type) {
    setBusy(true);
    const day = await ensureDay(dow);
    if (!day) { setBusy(false); return; }
    const updates = { session_type: type };
    // Sensible defaults so the client side renders cleanly.
    if (type === "rest") { updates.focus = "Rest & Recovery"; updates.cardio_protocol = null; }
    else if (type === "cardio") { updates.focus = day.focus && day.focus !== "Rest & Recovery" ? day.focus : "Cardio"; }
    await updatePlanDay(day.id, updates);
    await load();
    setBusy(false);
    flash("Day updated");
  }

  async function saveDayField(day, field, value) {
    setBusy(true);
    await updatePlanDay(day.id, { [field]: value });
    await load();
    setBusy(false);
  }

  async function addExercise(day, exercise) {
    setBusy(true);
    const existing = (day.plan_exercises || []).length;
    await addExerciseToPlanDay(day.id, exercise.id, {
      sets: 3, rep_range: "8-12", rest_seconds: 90, sort_order: existing + 1,
    });
    await load();
    setBusy(false);
    setSearch("");
    setSearchForDay(null);
    flash(`Added ${exercise.name}`);
  }

  async function removeExercise(planExerciseId) {
    setBusy(true);
    await removePlanExercise(planExerciseId);
    await load();
    setBusy(false);
  }

  async function updateExerciseField(planExerciseId, field, value) {
    setBusy(true);
    await updatePlanExercise(planExerciseId, { [field]: value });
    await load();
    setBusy(false);
  }

  async function moveExercise(day, index, dir) {
    const list = [...(day.plan_exercises || [])].sort((a, b) => a.sort_order - b.sort_order);
    const swap = index + dir;
    if (swap < 0 || swap >= list.length) return;
    setBusy(true);
    const a = list[index], b = list[swap];
    await reorderPlanExercises([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order },
    ]);
    await load();
    setBusy(false);
  }

  if (loading) return <div style={{ padding: "30px", textAlign: "center", color: "#bbb", fontSize: "13px", ...F }}>Loading plan…</div>;

  if (!plan) {
    return (
      <div style={{ padding: "30px 20px", textAlign: "center", ...F }}>
        <div style={{ fontSize: "13px", color: "#888", lineHeight: "1.7", marginBottom: "6px" }}>
          {client?.name} doesn't have an active plan yet.
        </div>
        <div style={{ fontSize: "12px", color: "#bbb", lineHeight: "1.7" }}>
          Build one with the AI builder or assign a program from the library first, then come back here to fine-tune it.
        </div>
      </div>
    );
  }

  const searchResults = search.trim().length > 0
    ? exercises.filter(e => e.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <div style={{ padding: "4px 0 40px", ...F }}>
      <div style={{ fontSize: "11px", color: "#999", marginBottom: "14px", lineHeight: "1.6" }}>
        Editing <strong style={{ color: "#555" }}>{client?.name}</strong>'s active plan. Changes save immediately and show up
        for them next time they open the app.
      </div>

      {DAY_ORDER.map(dow => {
        const day = daysByKey[dow];
        const type = day?.session_type || "rest";
        const isOpen = openDay === dow;
        const exCount = day?.plan_exercises?.length || 0;
        return (
          <div key={dow} style={{ border: "1px solid #e8e4dd", borderRadius: "9px", marginBottom: "8px", overflow: "hidden", background: "#fff" }}>
            {/* Day header */}
            <button
              onClick={() => setOpenDay(isOpen ? null : dow)}
              style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
            >
              <div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#333", letterSpacing: "0.02em" }}>{DAY_NAMES[dow]}</div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                  {type === "rest" ? "Rest day" : type === "cardio" ? (day?.focus || "Cardio") : `${day?.focus || type} · ${exCount} exercise${exCount === 1 ? "" : "s"}`}
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "#ccc" }}>{isOpen ? "▲" : "▼"}</span>
            </button>

            {isOpen && (
              <div style={{ padding: "4px 14px 16px", borderTop: "1px solid #f0ede7" }}>
                {/* Session type chips */}
                <div style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", margin: "12px 0 7px" }}>Day type</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                  {SESSION_TYPES.map(st => (
                    <button key={st.id} disabled={busy}
                      onClick={() => changeDayType(dow, st.id)}
                      style={{ padding: "5px 11px", borderRadius: "16px", border: "1px solid " + (type === st.id ? "#1a1a1a" : "#e0ddd5"), background: type === st.id ? "#1a1a1a" : "#faf9f6", color: type === st.id ? "#f7f6f3" : "#777", fontSize: "11px", cursor: "pointer", ...F }}>
                      {st.label}
                    </button>
                  ))}
                </div>

                {day && type !== "rest" && (
                  <>
                    {/* Focus label */}
                    <div style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", margin: "4px 0 5px" }}>Focus</div>
                    <input
                      defaultValue={day.focus || ""}
                      onBlur={e => { if (e.target.value !== day.focus) saveDayField(day, "focus", e.target.value); }}
                      placeholder="e.g. Lower Body — Glutes & Hamstrings"
                      style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e4e0db", borderRadius: "6px", fontSize: "12px", marginBottom: "12px", ...F }}
                    />

                    {type === "cardio" ? (
                      <>
                        <div style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", margin: "4px 0 5px" }}>Cardio protocol</div>
                        <input
                          defaultValue={day.cardio_protocol || ""}
                          onBlur={e => { if (e.target.value !== day.cardio_protocol) saveDayField(day, "cardio_protocol", e.target.value); }}
                          placeholder="e.g. 30 min Zone 2, or Cycle Class"
                          style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e4e0db", borderRadius: "6px", fontSize: "12px", ...F }}
                        />
                      </>
                    ) : (
                      <>
                        {/* Exercises */}
                        <div style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb", margin: "4px 0 7px" }}>Exercises</div>
                        {[...(day.plan_exercises || [])].sort((a, b) => a.sort_order - b.sort_order).map((pe, i, arr) => (
                          <div key={pe.id} style={{ border: "1px solid #eee", borderRadius: "7px", padding: "9px 10px", marginBottom: "6px", background: "#fafafa" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>{pe.exercises?.name || "Exercise"}</span>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <button disabled={i === 0 || busy} onClick={() => moveExercise(day, i, -1)} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", color: i === 0 ? "#e0e0e0" : "#aaa", fontSize: "13px" }}>↑</button>
                                <button disabled={i === arr.length - 1 || busy} onClick={() => moveExercise(day, i, 1)} style={{ background: "none", border: "none", cursor: i === arr.length - 1 ? "default" : "pointer", color: i === arr.length - 1 ? "#e0e0e0" : "#aaa", fontSize: "13px" }}>↓</button>
                                <button disabled={busy} onClick={() => removeExercise(pe.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#d88", fontSize: "16px", lineHeight: 1 }}>×</button>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <label style={{ flex: 1 }}>
                                <span style={{ fontSize: "8px", color: "#aaa", display: "block", marginBottom: "2px" }}>Sets</span>
                                <input type="number" defaultValue={pe.sets ?? ""} onBlur={e => updateExerciseField(pe.id, "sets", e.target.value ? parseInt(e.target.value) : null)}
                                  style={{ width: "100%", boxSizing: "border-box", padding: "6px 7px", border: "1px solid #e4e0db", borderRadius: "5px", fontSize: "12px" }} />
                              </label>
                              <label style={{ flex: 1.4 }}>
                                <span style={{ fontSize: "8px", color: "#aaa", display: "block", marginBottom: "2px" }}>Reps</span>
                                <input defaultValue={pe.rep_range ?? ""} onBlur={e => updateExerciseField(pe.id, "rep_range", e.target.value)}
                                  placeholder="8-12" style={{ width: "100%", boxSizing: "border-box", padding: "6px 7px", border: "1px solid #e4e0db", borderRadius: "5px", fontSize: "12px" }} />
                              </label>
                              <label style={{ flex: 1.2 }}>
                                <span style={{ fontSize: "8px", color: "#aaa", display: "block", marginBottom: "2px" }}>Rest (s)</span>
                                <input type="number" defaultValue={pe.rest_seconds ?? ""} onBlur={e => updateExerciseField(pe.id, "rest_seconds", e.target.value ? parseInt(e.target.value) : null)}
                                  style={{ width: "100%", boxSizing: "border-box", padding: "6px 7px", border: "1px solid #e4e0db", borderRadius: "5px", fontSize: "12px" }} />
                              </label>
                            </div>
                          </div>
                        ))}

                        {/* Add exercise */}
                        {searchForDay === day.id ? (
                          <div style={{ border: "1px solid #e4e0db", borderRadius: "7px", padding: "9px", marginTop: "4px" }}>
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                              placeholder="Search exercises…"
                              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #e4e0db", borderRadius: "6px", fontSize: "12px", ...F }} />
                            {searchResults.length > 0 && (
                              <div style={{ marginTop: "6px", border: "1px solid #eee", borderRadius: "6px", overflow: "hidden", maxHeight: "220px", overflowY: "auto" }}>
                                {searchResults.map(ex => (
                                  <button key={ex.id} disabled={busy} onClick={() => addExercise(day, ex)}
                                    style={{ width: "100%", textAlign: "left", padding: "9px 11px", border: "none", borderBottom: "1px solid #f5f5f5", background: "#fff", fontSize: "12px", cursor: "pointer", display: "flex", justifyContent: "space-between", ...F }}>
                                    <span>{ex.name}</span>
                                    {ex.primary_muscle && <span style={{ fontSize: "9px", color: "#bbb" }}>{ex.primary_muscle}</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                            {search.trim().length > 1 && searchResults.length === 0 && (
                              <div style={{ fontSize: "11px", color: "#bbb", padding: "8px 2px" }}>
                                No match in the exercise database. (New exercises are added to the database separately.)
                              </div>
                            )}
                            <button onClick={() => { setSearchForDay(null); setSearch(""); }} style={{ marginTop: "7px", background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => { setSearchForDay(day.id); setSearch(""); }}
                            style={{ width: "100%", background: "none", border: "1px dashed #ddd", borderRadius: "7px", padding: "9px", cursor: "pointer", color: "#999", fontSize: "12px", ...F }}>
                            + Add exercise
                          </button>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", color: "#f7f6f3", padding: "9px 18px", borderRadius: "8px", fontSize: "12px", zIndex: 3000, ...F }}>
          {toast}
        </div>
      )}
    </div>
  );
}
