import { useState, useEffect } from "react";
import { getPrograms, saveProgram, deleteProgram, getMyClients, assignProgramToClient } from "../lib/supabase";
import { schedule as taraSchedule } from "../tara-data";
import { schedule as skylerSchedule, IMBALANCE_NOTE as taraNotes } from "../data.js";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Program viewer — same format as client sees ──────────────────────────────
function ExerciseCard({ ex }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #ebebeb", background: "#fff" }}>
      <div style={{ padding: "11px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "3px" }}>{ex.name}</div>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            {ex.sets && <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#555", padding: "2px 7px", borderRadius: "20px" }}>{ex.sets} sets</span>}
            {ex.reps && <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#555", padding: "2px 7px", borderRadius: "20px" }}>{ex.reps} reps</span>}
            {ex.rest && <span style={{ fontSize: "10px", background: "#f0f0f0", color: "#555", padding: "2px 7px", borderRadius: "20px" }}>{ex.rest} rest</span>}
            {ex.eccentric && <span style={{ fontSize: "10px", background: "#fff3e0", color: "#c47a0a", padding: "2px 7px", borderRadius: "20px" }}>{ex.eccentric}</span>}
            {ex.bodyweight && <span style={{ fontSize: "10px", background: "#f0fff0", color: "#2d7a1e", padding: "2px 7px", borderRadius: "20px" }}>Bodyweight</span>}
          </div>
        </div>
        <button onClick={() => setOpen(p => !p)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </button>
      </div>
      {open && ex.form?.length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          {ex.why && <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.65", ...F, marginBottom: "10px", fontStyle: "italic" }}>{ex.why}</div>}
          {ex.form.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 0", borderTop: "1px solid #f5f5f3" }}>
              <span style={{ fontSize: "9px", fontWeight: "700", color: "#999", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0, paddingTop: "1px", minWidth: "60px" }}>{cue.label}</span>
              <span style={{ fontSize: "11px", color: "#555", lineHeight: "1.65", ...F }}>{cue.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DayView({ day }) {
  if (!day) return null;
  const isRest = day.type === "rest";
  return (
    <div style={{ background: "#f9f9f7", minHeight: "100%" }}>
      {/* Day header */}
      <div style={{ background: "#1a1a1a", padding: "16px", color: "#f5f5f7" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6e6e73", marginBottom: "3px" }}>{day.day}</div>
        <div style={{ fontSize: "18px", fontWeight: "normal" }}>{day.focus || day.label}</div>
        {day.muscles?.length > 0 && <div style={{ fontSize: "10px", color: "#555", marginTop: "3px" }}>{day.muscles.join(", ")}</div>}
      </div>

      {isRest ? (
        <div style={{ padding: "30px 16px", textAlign: "center", color: "#bbb", fontSize: "13px", ...F }}>Rest day — active recovery or complete rest</div>
      ) : (
        <>
          {/* Warm-up strip */}
          <div style={{ background: "rgba(196,122,10,0.08)", borderBottom: "1px solid rgba(196,122,10,0.15)", padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#c47a0a" }}>Warm-Up</span>
            <span style={{ fontSize: "10px", color: "rgba(196,122,10,0.6)" }}>5–8 min · start here</span>
          </div>

          {/* Exercises */}
          {(day.exercises || []).map((ex, i) => <ExerciseCard key={i} ex={ex} />)}

          {/* Core finisher */}
          {day.core_finisher?.length > 0 && (
            <>
              <div style={{ padding: "6px 16px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
                <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Core</span>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
              </div>
              {day.core_finisher.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}
            </>
          )}

          {/* Cardio */}
          {day.cardio && (
            <>
              <div style={{ padding: "6px 16px 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
                <span style={{ fontSize: "8px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Cardio</span>
                <div style={{ height: "1px", flex: 1, background: "#e8e8e8" }} />
              </div>
              <div style={{ background: "#fff", padding: "12px 16px", borderBottom: "1px solid #ebebeb" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "4px" }}>{day.cardio.name}</div>
                <div style={{ fontSize: "11px", background: "#eff6ff", color: "#2563a8", padding: "3px 10px", borderRadius: "20px", display: "inline-block", marginBottom: "4px" }}>{day.cardio.protocol}</div>
                {day.cardio.feel && <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.5", ...F, marginTop: "4px" }}>{day.cardio.feel}</div>}
              </div>
            </>
          )}

          {/* Cool down strip */}
          <div style={{ background: "rgba(29,111,168,0.06)", borderTop: "1px solid rgba(29,111,168,0.12)", padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase", color: "#1d6fa8" }}>Cool Down</span>
            <span style={{ fontSize: "10px", color: "rgba(29,111,168,0.6)" }}>5 min · stretch & recover</span>
          </div>
        </>
      )}
    </div>
  );
}

function ProgramViewer({ program, onClose }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const schedule = program.schedule || [];
  const currentDay = schedule[selectedDay];

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 100, display: "flex", flexDirection: "column", maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "#1a1a1a", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#999", fontSize: "14px", cursor: "pointer", padding: "4px 8px 4px 0" }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "15px", fontWeight: "600", color: "#f5f5f7" }}>{program.name}</div>
          {program.description && <div style={{ fontSize: "10px", color: "#555", marginTop: "1px" }}>{program.description}</div>}
        </div>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {program.goal && <span style={{ fontSize: "8px", background: "rgba(255,255,255,0.08)", color: "#999", padding: "2px 7px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{program.goal.replace(/_/g," ")}</span>}
          {program.days_per_week && <span style={{ fontSize: "8px", background: "rgba(255,255,255,0.08)", color: "#999", padding: "2px 7px", borderRadius: "4px" }}>{program.days_per_week} days/wk</span>}
        </div>
      </div>

      {/* Day picker */}
      <div style={{ background: "#111", overflowX: "auto", display: "flex", gap: "2px", padding: "8px", flexShrink: 0 }}>
        {schedule.map((day, i) => (
          <button key={i} onClick={() => setSelectedDay(i)} style={{
            flexShrink: 0, padding: "6px 10px", borderRadius: "6px", fontSize: "10px",
            background: selectedDay === i ? "#f5f5f7" : "transparent",
            color: selectedDay === i ? "#111" : "#555",
            border: "none", cursor: "pointer", ...F,
            fontWeight: selectedDay === i ? "600" : "normal",
          }}>
            {day.day}
          </button>
        ))}
      </div>

      {/* Day content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <DayView day={currentDay} />
      </div>
    </div>
  );
}

// ── Main Program Library ──────────────────────────────────────────────────────
export default function ProgramLibrary({ coachId }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | template | client
  const [goalFilter, setGoalFilter] = useState("all");
  const [sort, setSort] = useState("newest"); // newest | name | goal
  const [clients, setClients] = useState([]);
  const [deployFor, setDeployFor] = useState(null); // program id whose client-picker is open
  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState(null);
  const [collapsed, setCollapsed] = useState({}); // goal -> bool

  useEffect(() => { loadPrograms(); }, [coachId]);
  useEffect(() => { getMyClients().then(({ data }) => setClients(data || [])); }, []);

  async function handleDeploy(programId, clientId, clientName) {
    setDeploying(true);
    const { error } = await assignProgramToClient(programId, clientId);
    setDeploying(false);
    if (!error) {
      setDeployFor(null);
      setDeployMsg({ id: programId, text: `Deployed to ${clientName}` });
      setTimeout(() => setDeployMsg(null), 3000);
    } else {
      setDeployMsg({ id: programId, text: "Deploy failed — try again" });
    }
  }

  async function loadPrograms() {
    setLoading(true);
    const { data } = await getPrograms(coachId);
    setPrograms(data || []);
    setLoading(false);
  }

  async function handleSaveBuiltIn(name, description, goal, schedule, metadata, clientId) {
    setSaving(true);
    const trainingDays = schedule.filter(d => d.type !== "rest" && d.exercises?.length > 0).length;
    const { data, error } = await saveProgram(coachId, {
      name, description, goal,
      daysPerWeek: trainingDays,
      schedule, metadata,
      isTemplate: !clientId,
      clientId: clientId || null,
    });
    if (!error) {
      setPrograms(prev => [data, ...prev]);
    }
    setSaving(false);
  }

  async function handleDelete(programId) {
    if (!window.confirm("Remove this program from the library?")) return;
    await deleteProgram(programId);
    setPrograms(prev => prev.filter(p => p.id !== programId));
  }

  const hasTaraSaved = programs.some(p => p.name === "Tara — Body Recomposition");
  const hasSkylSaved = programs.some(p => p.name.includes("Skyler"));

  // Known goals + friendly labels. Anything else falls under "Other".
  const GOAL_LABELS = {
    body_recomposition: "Recomp",
    weight_loss: "Weight Loss",
    fat_loss: "Weight Loss",
    muscle_gain: "Muscle Gain",
    hypertrophy: "Muscle Gain",
    strength: "Strength",
    general_fitness: "General Fitness",
    endurance: "Endurance",
  };
  const goalLabel = (g) => GOAL_LABELS[g] || (g ? g.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Other");

  // Goal values actually present in the library, for the chip row.
  const presentGoals = Array.from(new Set(programs.map(p => p.goal || "other")));

  const filtered = programs.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "template" && p.is_template) || (filter === "client" && !p.is_template);
    const matchGoal = goalFilter === "all" || (p.goal || "other") === goalFilter;
    return matchSearch && matchFilter && matchGoal;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "name") return (a.name || "").localeCompare(b.name || "");
    if (sort === "goal") return goalLabel(a.goal).localeCompare(goalLabel(b.goal));
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  // Group the sorted list by goal label, preserving sort order within groups.
  const grouped = sorted.reduce((acc, p) => {
    const label = goalLabel(p.goal);
    (acc[label] = acc[label] || []).push(p);
    return acc;
  }, {});
  const groupOrder = Object.keys(grouped).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  if (viewing) {
    return <ProgramViewer program={viewing} onClose={() => setViewing(null)} />;
  }

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "14px" }}>Program Library</div>

      {/* Save built-in programs */}
      {(!hasTaraSaved || !hasSkylSaved) && (
        <div style={{ background: "#f0f5ff", border: "1px solid #dbeafe", borderRadius: "9px", padding: "12px 14px", marginBottom: "14px" }}>
          <div style={{ fontSize: "11px", color: "#2563a8", marginBottom: "8px", fontWeight: "600" }}>Save current programs to library</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {!hasTaraSaved && (
              <button onClick={() => handleSaveBuiltIn(
                "Tara — Body Recomposition",
                "27F · L5 herniated disc, scoliosis, SI joint dysfunction, ACL strain history. No axial spinal loading. Body recomposition focus.",
                "body_recomposition",
                taraSchedule,
                { injuries: ["L5 herniated disc", "scoliosis", "SI joint dysfunction", "ACL strain history"], contraindications: ["No barbell squats", "No conventional deadlifts"], imbalance_note: taraNotes },
                null
              )} disabled={saving} style={{ background: saving ? "#ccc" : "#2563a8", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                {saving ? "Saving..." : "Save Tara's Program"}
              </button>
            )}
            {!hasSkylSaved && (
              <button onClick={() => handleSaveBuiltIn(
                "Skyler — Program",
                "Skyler's current training program.",
                "muscle_gain",
                skylerSchedule,
                {},
                null
              )} disabled={saving} style={{ background: saving ? "#ccc" : "#1a1a1a", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                {saving ? "Saving..." : "Save Skyler's Program"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search + type filter + sort */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search programs..."
          style={{ flex: 1, padding: "8px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "12px", color: "#111" }}
        />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: "7px 8px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "11px", color: "#666", background: "#fff", cursor: "pointer" }}>
          <option value="newest">Newest</option>
          <option value="name">Name A–Z</option>
          <option value="goal">Goal</option>
        </select>
      </div>

      {/* Type filter: all / template / client */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {["all","template","client"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 12px", borderRadius: "7px", fontSize: "10px", cursor: "pointer", textTransform: "capitalize", border: "1px solid",
            background: filter === f ? "#111" : "transparent",
            color: filter === f ? "#fff" : "#999",
            borderColor: filter === f ? "#111" : "#e4e0db",
          }}>{f === "all" ? "All" : f}</button>
        ))}
      </div>

      {/* Goal chips */}
      {presentGoals.length > 1 && (
        <div style={{ display: "flex", gap: "5px", marginBottom: "14px", flexWrap: "wrap" }}>
          <button onClick={() => setGoalFilter("all")} style={{
            padding: "5px 12px", borderRadius: "16px", fontSize: "10px", cursor: "pointer", border: "1px solid",
            background: goalFilter === "all" ? "#5b4636" : "#f3f1ec", color: goalFilter === "all" ? "#f7f6f3" : "#777",
            borderColor: goalFilter === "all" ? "#5b4636" : "#e0ddd5",
          }}>All Goals</button>
          {presentGoals.map(g => (
            <button key={g} onClick={() => setGoalFilter(g)} style={{
              padding: "5px 12px", borderRadius: "16px", fontSize: "10px", cursor: "pointer", border: "1px solid",
              background: goalFilter === g ? "#5b4636" : "#f3f1ec", color: goalFilter === g ? "#f7f6f3" : "#777",
              borderColor: goalFilter === g ? "#5b4636" : "#e0ddd5",
            }}>{goalLabel(g)}</button>
          ))}
        </div>
      )}

      {/* Programs — grouped by goal, collapsible */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "12px" }}>Loading...</div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "12px", lineHeight: "1.7", ...F }}>
          {programs.length === 0 ? "No programs saved yet. Save Tara and Skyler's programs above to get started." : "No programs match that search."}
        </div>
      ) : (
        groupOrder.map(label => {
          const list = grouped[label];
          const isCollapsed = collapsed[label];
          return (
            <div key={label} style={{ marginBottom: "16px" }}>
              {/* Section header */}
              <button
                onClick={() => setCollapsed(c => ({ ...c, [label]: !c[label] }))}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", borderBottom: "1px solid #e8e4dd", padding: "0 2px 7px", cursor: "pointer", marginBottom: "10px" }}
              >
                <span style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#5b4636", fontWeight: "600", ...F }}>
                  {label} <span style={{ color: "#bbb", fontWeight: "400" }}>· {list.length}</span>
                </span>
                <span style={{ fontSize: "11px", color: "#bbb", transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>▾</span>
              </button>

              {!isCollapsed && list.map(program => {
                const pickerOpen = deployFor === program.id;
                const msg = deployMsg && deployMsg.id === program.id ? deployMsg.text : null;
                return (
                  <div key={program.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "13px 15px", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "3px" }}>{program.name}</div>
                      {program.description && <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.5", marginBottom: "6px" }}>{program.description}</div>}
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                        {program.days_per_week && <span style={{ fontSize: "9px", background: "#f0f0f0", color: "#666", padding: "2px 7px", borderRadius: "4px" }}>{program.days_per_week} days/wk</span>}
                        {program.is_template
                          ? <span style={{ fontSize: "9px", background: "#f0fff0", color: "#2d7a1e", padding: "2px 7px", borderRadius: "4px" }}>Template</span>
                          : <span style={{ fontSize: "9px", background: "#fff5ec", color: "#9a6320", padding: "2px 7px", borderRadius: "4px" }}>Client-specific</span>}
                        <span style={{ fontSize: "9px", color: "#ccc" }}>Saved {new Date(program.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => { setDeployFor(pickerOpen ? null : program.id); setDeployMsg(null); }}
                        style={{ background: pickerOpen ? "#5b4636" : "#1d6fa8", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}
                      >
                        {pickerOpen ? "Cancel" : "Deploy"}
                      </button>
                      <button
                        onClick={async () => {
                          const { getProgramById } = await import("../lib/supabase");
                          const { data } = await getProgramById(program.id);
                          if (data) setViewing(data);
                        }}
                        style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(program.id)}
                        style={{ background: "none", border: "1px solid #e4e0db", borderRadius: "20px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", color: "#bbb" }}
                      >
                        Remove
                      </button>
                      {msg && <span style={{ fontSize: "11px", color: msg.includes("failed") ? "#b91c1c" : "#2d7a1e", alignSelf: "center", ...F }}>{msg}</span>}
                    </div>

                    {/* Deploy: client picker */}
                    {pickerOpen && (
                      <div style={{ marginTop: "11px", paddingTop: "11px", borderTop: "1px solid #f0ede7" }}>
                        <div style={{ fontSize: "10px", color: "#999", marginBottom: "7px", letterSpacing: "0.05em", ...F }}>Assign this program to:</div>
                        {clients.length === 0 ? (
                          <div style={{ fontSize: "11px", color: "#bbb", ...F }}>No clients yet.</div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "5px", maxHeight: "180px", overflowY: "auto" }}>
                            {clients.map(c => (
                              <button
                                key={c.id}
                                disabled={deploying}
                                onClick={() => handleDeploy(program.id, c.id, c.name)}
                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#faf9f6", border: "1px solid #ece8e1", borderRadius: "7px", padding: "8px 11px", cursor: deploying ? "default" : "pointer", textAlign: "left", ...F }}
                              >
                                <span style={{ fontSize: "12px", color: "#111" }}>{c.name}</span>
                                {c.goal && <span style={{ fontSize: "9px", color: "#aaa" }}>{goalLabel(c.goal)}</span>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
}
