import { useState, useEffect } from "react";
import {
  signInCoach, signOutCoach, getCoachSession, onAuthChange,
  getMyClients, createClient_db, updateClient_db,
  getMyPlans, createPlan, updatePlan, createPlanDay,
  addExerciseToPlanDay, removePlanExercise, reorderPlanExercises,
  assignPlanToClient, getAllExercises, getClientOverview,
  createCoachNote, getMessages, sendMessage, markMessagesRead,
  inviteClient
} from "../lib/supabase";
import { formatDate } from "../storage";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };
const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const SESSION_TYPES = ["push","pull","legs","upper","lower","full_body","rest","cardio"];
const MUSCLE_GROUPS = ["chest","back","shoulders","biceps","triceps","quads","hamstrings","glutes","calves","core"];

// ── Auth Gate ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { error: err } = await signInCoach(email, password);
    if (err) { setError(err.message); setLoading(false); }
    else onLogin();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>Coach Access</div>
        <h1 style={{ color: "#f7f6f3", fontSize: "24px", fontWeight: "normal", margin: "0 0 24px", ...F }}>Dashboard</h1>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", marginBottom: "10px", ...F }} />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", marginBottom: "14px", ...F }} />
        {error && <div style={{ color: "#f87171", fontSize: "12px", marginBottom: "10px" }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", background: "#f7f6f3", color: "#111", border: "none", borderRadius: "7px", padding: "13px", fontSize: "14px", cursor: "pointer", ...F }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// ── Client Card ────────────────────────────────────────────────────────────────
function ClientCard({ client, onSelect, unreadCount }) {
  const initials = client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <button onClick={() => onSelect(client)} style={{
      width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px",
      padding: "14px 16px", marginBottom: "8px", display: "flex", alignItems: "center",
      gap: "12px", cursor: "pointer", ...F, textAlign: "left",
    }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#111", color: "#f7f6f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", flexShrink: 0 }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{client.name}</div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          {client.goal ? client.goal.replace("_", " ") : "No goal set"} · {client.is_active ? "Active" : "Inactive"}
        </div>
      </div>
      {unreadCount > 0 && (
        <div style={{ background: "#a02a2a", color: "#fff", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: "700" }}>
          {unreadCount}
        </div>
      )}
      <span style={{ color: "#ccc", fontSize: "14px" }}>→</span>
    </button>
  );
}

// ── Create Client Modal ────────────────────────────────────────────────────────
function CreateClientModal({ onSave, onCancel, coachId }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", goal: "recomp", sex: "male", notes: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await createClient_db({ ...form, coach_id: coachId });
    setSaving(false);
    if (data) setCreated(data);
  }

  if (created) {
    const clientUrl = `${window.location.origin}?client=${created.access_token}`;
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "380px", width: "100%" }}>
          <div style={{ fontSize: "28px", marginBottom: "10px", textAlign: "center" }}>✅</div>
          <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "6px", textAlign: "center" }}>Client Created</div>
          <div style={{ fontSize: "12px", color: "#555", marginBottom: "16px", textAlign: "center" }}>Send this link to {created.name}:</div>
          <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "10px 12px", fontSize: "11px", color: "#333", wordBreak: "break-all", marginBottom: "12px", fontFamily: "monospace" }}>
            {clientUrl}
          </div>
          <button onClick={() => navigator.clipboard.writeText(clientUrl)} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "11px", fontSize: "13px", cursor: "pointer", ...F, marginBottom: "8px" }}>
            Copy Link
          </button>
          <button onClick={() => onSave(created)} style={{ width: "100%", background: "transparent", color: "#555", border: "1px solid #e0e0e0", borderRadius: "7px", padding: "11px", fontSize: "13px", cursor: "pointer", ...F }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "420px", width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>New Client</div>
        {[["Name *", "name", "text"], ["Email", "email", "email"], ["Phone", "phone", "tel"]].map(([label, key, type]) => (
          <div key={key} style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>{label}</div>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Goal</div>
            <select value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
              style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}>
              {["recomp","fat_loss","muscle_gain","strength","endurance"].map(g => (
                <option key={g} value={g}>{g.replace("_"," ")}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Sex</div>
            <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
              style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Intake Notes</div>
          <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3} placeholder="Goals, injuries, experience level..."
            style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{ flex: 1, background: "#f5f5f3", color: "#555", border: "1px solid #e0e0e0", borderRadius: "7px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ flex: 2, background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>
            {saving ? "Creating..." : "Create Client"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan Builder ───────────────────────────────────────────────────────────────
function PlanBuilder({ coachId, onBack }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("all");
  const [loading, setLoading] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [exerciseConfig, setExerciseConfig] = useState({ sets: 3, rep_range: "8–12", rest_seconds: 120, eccentric: "3s down", notes: "" });

  useEffect(() => {
    async function load() {
      const [plansResult, exResult] = await Promise.all([getMyPlans(), getAllExercises()]);
      setPlans(plansResult.data || []);
      setExercises(exResult.data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreatePlan() {
    if (!newPlanName.trim()) return;
    const { data } = await createPlan({ coach_id: coachId, name: newPlanName });
    if (data) {
      // Create 7 default days
      const dayPromises = DAYS.map((day, i) =>
        createPlanDay({
          plan_id: data.id,
          day_of_week: day,
          label: day === "SUN" ? "Rest" : `Day ${i + 1}`,
          session_type: day === "SUN" ? "rest" : "push",
          sort_order: i,
        })
      );
      await Promise.all(dayPromises);
      const { data: refreshed } = await getMyPlans();
      setPlans(refreshed || []);
      setSelectedPlan(refreshed?.find(p => p.id === data.id) || null);
      setCreatingPlan(false);
      setNewPlanName("");
    }
  }

  async function handleAddExercise(exercise) {
    if (!selectedDay) return;
    const sort = (selectedDay.plan_exercises?.length || 0);
    await addExerciseToPlanDay(selectedDay.id, exercise.id, { ...exerciseConfig, sort_order: sort });
    // Refresh
    const { data } = await getMyPlans();
    setPlans(data || []);
    const refreshedPlan = data?.find(p => p.id === selectedPlan.id);
    setSelectedPlan(refreshedPlan);
    setSelectedDay(refreshedPlan?.plan_days?.find(d => d.id === selectedDay.id));
    setShowExercisePicker(false);
  }

  async function handleRemoveExercise(planExerciseId) {
    await removePlanExercise(planExerciseId);
    const { data } = await getMyPlans();
    setPlans(data || []);
    const refreshedPlan = data?.find(p => p.id === selectedPlan.id);
    setSelectedPlan(refreshedPlan);
    setSelectedDay(refreshedPlan?.plan_days?.find(d => d.id === selectedDay.id));
  }

  const filteredExercises = exercises.filter(ex => {
    const matchesMuscle = filterMuscle === "all" || ex.primary_muscle === filterMuscle;
    const matchesSearch = !exerciseSearch || ex.name.toLowerCase().includes(exerciseSearch.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>Loading plans...</div>;

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", ...F }}>← Back</button>
        <div style={{ fontSize: "18px", fontWeight: "normal" }}>Plan Builder</div>
      </div>

      {!selectedPlan ? (
        <>
          <button onClick={() => setCreatingPlan(true)} style={{ width: "100%", background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "13px", cursor: "pointer", ...F, marginBottom: "14px" }}>
            + Create New Plan
          </button>

          {creatingPlan && (
            <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
              <input type="text" placeholder="Plan name (e.g. PPL Phase 1)" value={newPlanName} onChange={e => setNewPlanName(e.target.value)}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", marginBottom: "10px", ...F }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setCreatingPlan(false)} style={{ flex: 1, background: "#fff", color: "#555", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "10px", fontSize: "12px", cursor: "pointer", ...F }}>Cancel</button>
                <button onClick={handleCreatePlan} style={{ flex: 2, background: "#111", color: "#fff", border: "none", borderRadius: "6px", padding: "10px", fontSize: "12px", cursor: "pointer", ...F }}>Create</button>
              </div>
            </div>
          )}

          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>Your Plans</div>
          {plans.length === 0 && <div style={{ color: "#aaa", fontSize: "13px", textAlign: "center", padding: "20px" }}>No plans yet</div>}
          {plans.map(plan => (
            <button key={plan.id} onClick={() => { setSelectedPlan(plan); setSelectedDay(null); }} style={{ width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px 15px", marginBottom: "7px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>{plan.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa", marginTop: "2px" }}>
                  {plan.plan_days?.length || 0} days · {plan.plan_days?.reduce((acc, d) => acc + (d.plan_exercises?.length || 0), 0)} exercises
                </div>
              </div>
              <span style={{ color: "#ccc" }}>→</span>
            </button>
          ))}
        </>
      ) : !selectedDay ? (
        <>
          <button onClick={() => setSelectedPlan(null)} style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", marginBottom: "12px", ...F }}>← All Plans</button>
          <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "14px" }}>{selectedPlan.name}</div>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>Days</div>
          {(selectedPlan.plan_days || []).sort((a, b) => a.sort_order - b.sort_order).map(day => (
            <button key={day.id} onClick={() => setSelectedDay(day)} style={{ width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#555", letterSpacing: "0.1em" }}>{day.day_of_week}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{day.label}</span>
                </div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                  {day.plan_exercises?.length || 0} exercises · {day.session_type}
                </div>
              </div>
              <span style={{ color: "#ccc" }}>→</span>
            </button>
          ))}
        </>
      ) : (
        <>
          <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", color: "#555", fontSize: "12px", cursor: "pointer", marginBottom: "12px", ...F }}>← {selectedPlan.name}</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999" }}>{selectedDay.day_of_week}</div>
              <div style={{ fontSize: "18px", fontWeight: "normal" }}>{selectedDay.label}</div>
            </div>
            <button onClick={() => setShowExercisePicker(true)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
              + Exercise
            </button>
          </div>

          {/* Exercise config for next add */}
          <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "8px" }}>Default Config for Next Exercise</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[["Sets", "sets", "number"], ["Reps", "rep_range", "text"], ["Rest (sec)", "rest_seconds", "number"]].map(([label, key, type]) => (
                <div key={key}>
                  <div style={{ fontSize: "9px", color: "#aaa", marginBottom: "3px" }}>{label}</div>
                  <input type={type} value={exerciseConfig[key]} onChange={e => setExerciseConfig(c => ({ ...c, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "5px", border: "1px solid #e0e0e0", fontSize: "12px", ...F }} />
                </div>
              ))}
            </div>
          </div>

          {/* Current exercises */}
          {(selectedDay.plan_exercises || []).sort((a, b) => a.sort_order - b.sort_order).map((pe, i) => (
            <div key={pe.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "7px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "3px" }}>{pe.exercises?.name}</div>
                <div style={{ fontSize: "10px", color: "#aaa" }}>{pe.sets} sets · {pe.rep_range} reps · {pe.rest_seconds}s rest</div>
                {pe.notes && <div style={{ fontSize: "10px", color: "#777", marginTop: "2px", fontStyle: "italic" }}>{pe.notes}</div>}
              </div>
              <button onClick={() => handleRemoveExercise(pe.id)} style={{ background: "none", border: "none", color: "#ccc", fontSize: "18px", cursor: "pointer" }}>×</button>
            </div>
          ))}

          {(!selectedDay.plan_exercises || selectedDay.plan_exercises.length === 0) && (
            <div style={{ padding: "20px", textAlign: "center", color: "#aaa", fontSize: "13px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px" }}>
              No exercises yet — tap + Exercise to add
            </div>
          )}
        </>
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", zIndex: 1000 }}>
          <div style={{ background: "#fff", flex: 1, borderRadius: "12px 12px 0 0", marginTop: "60px", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>Add Exercise</div>
                <button onClick={() => setShowExercisePicker(false)} style={{ background: "none", border: "none", fontSize: "20px", color: "#aaa", cursor: "pointer" }}>×</button>
              </div>
              <input type="text" placeholder="Search..." value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", marginBottom: "8px", ...F }} />
              <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "2px" }}>
                {["all", ...MUSCLE_GROUPS].map(m => (
                  <button key={m} onClick={() => setFilterMuscle(m)} style={{ flex: "0 0 auto", background: filterMuscle === m ? "#111" : "#f5f5f3", color: filterMuscle === m ? "#fff" : "#555", border: "none", borderRadius: "20px", padding: "4px 11px", fontSize: "10px", cursor: "pointer", ...F, textTransform: "capitalize", whiteSpace: "nowrap" }}>
                    {m === "all" ? "All" : m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 20px" }}>
              {filteredExercises.map((ex, i) => (
                <button key={i} onClick={() => handleAddExercise(ex)} style={{ width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "11px 13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{ex.name}</div>
                    <div style={{ fontSize: "10px", color: "#aaa", textTransform: "capitalize", marginTop: "2px" }}>
                      {ex.primary_muscle} · {ex.category} · {ex.difficulty}
                    </div>
                  </div>
                  <span style={{ color: "#2563a8", fontSize: "18px" }}>+</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Client Detail ──────────────────────────────────────────────────────────────
function ClientDetail({ client, coachId, plans, onBack, onAssignPlan }) {
  const [view, setView] = useState("overview"); // overview | notes | messages | assign
  const [overview, setOverview] = useState(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [messages, setMessages] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(client.auth_user_id ? "exists" : null);
  const [inviteError, setInviteError] = useState("");

  async function handleSendInvite() {
    if (!client.email) {
      setInviteError("Add an email address to this client first.");
      return;
    }
    setInviting(true);
    setInviteError("");
    const { error } = await inviteClient(client.id, client.email, client.name);
    setInviting(false);
    if (error) {
      if (error.message?.includes("already registered")) {
        setInviteStatus("exists");
        setInviteError("This email already has an account.");
      } else {
        setInviteError(error.message || "Failed to send invite.");
      }
    } else {
      setInviteStatus("sent");
    }
  }

  useEffect(() => {
    async function load() {
      // Recalculate PRs from actual logs first (ensures accuracy)
      const { recalculatePRsFromLogs } = await import("../lib/supabase");
      await recalculatePRsFromLogs(client.id);
      const data = await getClientOverview(client.id);
      setOverview(data);
      setMessages(data.messages || []);
      markMessagesRead(client.id, "client");
    }
    load();
  }, [client.id]);

  async function handleSendNote() {
    if (!note.trim()) return;
    setSavingNote(true);
    await createCoachNote(coachId, client.id, note);
    setNote("");
    setSavingNote(false);
    const data = await getClientOverview(client.id);
    setOverview(data);
  }

  async function handleSendReply() {
    if (!reply.trim()) return;
    await sendMessage(coachId, client.id, reply, "coach");
    setReply("");
    const { data } = await getMessages(client.id);
    setMessages(data || []);
  }

  const clientUrl = `${window.location.origin}?client=${client.access_token}`;

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "14px", ...F }}>← All Clients</button>

      {/* Client header */}
      <div style={{ background: "#111", borderRadius: "10px", padding: "16px", marginBottom: "14px", color: "#f7f6f3" }}>
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "4px" }}>{client.name}</div>
        <div style={{ fontSize: "11px", color: "#666", marginBottom: "10px" }}>
          {client.goal?.replace("_"," ")} · {client.sex} · {client.is_active ? "Active" : "Inactive"}
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <button onClick={handleSendInvite} disabled={inviting || !!inviteStatus} style={{ flex: 1, background: inviteStatus === "sent" ? "#2d7a1e" : "#333", color: "#fff", border: "none", borderRadius: "5px", padding: "8px 10px", fontSize: "11px", cursor: "pointer", ...F }}>
            {inviting ? "Sending..." : inviteStatus === "sent" ? "✓ Invite Sent" : inviteStatus === "exists" ? "Already invited" : "📧 Send Invite"}
          </button>
          <button onClick={() => navigator.clipboard.writeText(clientUrl)} style={{ background: "#222", color: "#aaa", border: "1px solid #333", borderRadius: "5px", padding: "8px 10px", fontSize: "10px", cursor: "pointer", ...F, whiteSpace: "nowrap" }}>
            Copy link
          </button>
        </div>
        {inviteError && <div style={{ fontSize: "10px", color: "#f87171", marginTop: "6px" }}>{inviteError}</div>}
      </div>

      {/* Sub-nav */}
      <div style={{ display: "flex", gap: "5px", marginBottom: "16px", overflowX: "auto" }}>
        {[["overview","Overview"],["notes","Coach Notes"],["messages","Messages"],["assign","Assign Plan"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{ flex: "0 0 auto", background: view === v ? "#111" : "#fff", color: view === v ? "#fff" : "#555", border: "1px solid #e0e0e0", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F, whiteSpace: "nowrap" }}>
            {label}{v === "messages" && overview?.unreadFromClient > 0 ? ` (${overview.unreadFromClient})` : ""}
          </button>
        ))}
      </div>

      {/* Overview */}
      {view === "overview" && overview && (() => {
        // Group logs by session date
        const sessionMap = {};
        (overview.recentLogs || []).forEach(log => {
          const d = log.session_date;
          if (!sessionMap[d]) sessionMap[d] = [];
          sessionMap[d].push(log);
        });
        const sessions = Object.entries(sessionMap).sort((a, b) => b[0].localeCompare(a[0]));

        // Group PRs by muscle group
        const prsByMuscle = {};
        (overview.prs || []).forEach(pr => {
          const muscle = pr.exercises?.primary_muscle || "other";
          if (!prsByMuscle[muscle]) prsByMuscle[muscle] = [];
          prsByMuscle[muscle].push(pr);
        });

        // Measurements trend
        const measurements = overview.measurements || [];
        const latestMeasurement = measurements[measurements.length - 1];
        const prevMeasurement = measurements[measurements.length - 2];

        return (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "16px" }}>
              {[
                ["Sessions", sessions.length],
                ["PRs", overview.prs?.length || 0],
                ["Unread", overview.unreadFromClient || 0]
              ].map(([label, val]) => (
                <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: label === "Unread" && val > 0 ? "#a02a2a" : "#1a1a1a" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Recent sessions grouped by date */}
            {sessions.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>Recent Sessions</div>
                {sessions.slice(0, 8).map(([date, logs]) => {
                  const muscles = [...new Set(logs.map(l => l.exercises?.primary_muscle).filter(Boolean))];
                  const isExpanded = expandedSession === date;
                  // Group by exercise name
                  const byExercise = {};
                  logs.forEach(log => {
                    const name = log.exercises?.name || "Unknown";
                    if (!byExercise[name]) byExercise[name] = [];
                    byExercise[name].push(log);
                  });
                  return (
                    <div key={date} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "8px", overflow: "hidden" }}>
                      <button onClick={() => setExpandedSession(isExpanded ? null : date)} style={{ width: "100%", background: "transparent", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: "600" }}>{formatDate(date)}</div>
                          <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px", textTransform: "capitalize" }}>
                            {muscles.slice(0, 3).join(" · ")} · {logs.length} sets
                          </div>
                        </div>
                        <span style={{ color: "#ccc", fontSize: "12px" }}>{isExpanded ? "▲" : "▼"}</span>
                      </button>
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #f0f0f0" }}>
                          {Object.entries(byExercise).map(([exName, exLogs]) => {
                            const maxW = Math.max(...exLogs.map(l => parseFloat(l.weight_lbs) || 0));
                            return (
                              <div key={exName} style={{ padding: "10px 14px", borderBottom: "1px solid #f5f5f5" }}>
                                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px" }}>{exName}</div>
                                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                                  {exLogs.sort((a,b) => a.set_number - b.set_number).map((log, i) => (
                                    <span key={i} style={{ fontSize: "11px", background: "#f0f4ff", color: "#2563a8", padding: "3px 9px", borderRadius: "20px" }}>
                                      Set {log.set_number}: {log.weight_lbs} lbs × {log.reps}
                                    </span>
                                  ))}
                                </div>
                                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>Best: {maxW} lbs</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* PRs by muscle group */}
            {overview.prs?.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>Personal Records</div>
                {Object.entries(prsByMuscle).map(([muscle, prs]) => (
                  <div key={muscle} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "7px" }}>
                    <div style={{ fontSize: "10px", textTransform: "capitalize", fontWeight: "600", color: "#555", marginBottom: "6px" }}>{muscle}</div>
                    {prs.map((pr, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#333" }}>{pr.exercises?.name}</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#f59e0b" }}>🏆 {pr.weight_lbs} lbs × {pr.reps}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Measurements */}
            {latestMeasurement && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "10px" }}>
                  Latest Measurements · {formatDate(latestMeasurement.measured_at)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    ["Weight", latestMeasurement.weight_lbs, "lbs", prevMeasurement?.weight_lbs],
                    ["Waist", latestMeasurement.waist_in, '"', prevMeasurement?.waist_in],
                    ["Chest", latestMeasurement.chest_in, '"', prevMeasurement?.chest_in],
                    ["R Thigh", latestMeasurement.right_thigh_in, '"', prevMeasurement?.right_thigh_in],
                    ["L Thigh", latestMeasurement.left_thigh_in, '"', prevMeasurement?.left_thigh_in],
                    ["R Arm", latestMeasurement.right_arm_in, '"', prevMeasurement?.right_arm_in],
                    ["L Arm", latestMeasurement.left_arm_in, '"', prevMeasurement?.left_arm_in],
                  ].filter(([, val]) => val).map(([label, val, unit, prev]) => {
                    const diff = prev ? (parseFloat(val) - parseFloat(prev)).toFixed(1) : null;
                    return (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #f5f5f5" }}>
                        <span style={{ fontSize: "11px", color: "#aaa" }}>{label}</span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "13px", fontWeight: "600" }}>{val}{unit}</span>
                          {diff !== null && diff !== "0.0" && (
                            <span style={{ fontSize: "10px", color: parseFloat(diff) > 0 ? "#2d7a1e" : "#a02a2a", marginLeft: "5px" }}>
                              {parseFloat(diff) > 0 ? "+" : ""}{diff}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Coach Notes */}
      {view === "notes" && (
        <>
          <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note for this client..."
              rows={3} style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", marginBottom: "8px", ...F }} />
            <button onClick={handleSendNote} disabled={savingNote} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "10px 20px", fontSize: "12px", cursor: "pointer", ...F }}>
              {savingNote ? "Saving..." : "Add Note"}
            </button>
          </div>
          {(overview?.coachNotes || []).map((n, i) => (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "12px 14px", marginBottom: "7px" }}>
              <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.6", marginBottom: "4px" }}>{n.note}</div>
              <div style={{ fontSize: "10px", color: "#bbb" }}>{formatDate(n.created_at?.slice(0, 10))}</div>
            </div>
          ))}
        </>
      )}

      {/* Messages */}
      {view === "messages" && (
        <>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", overflow: "hidden", marginBottom: "12px" }}>
            <div style={{ maxHeight: "350px", overflowY: "auto", padding: "12px" }}>
              {messages.length === 0 && <div style={{ textAlign: "center", color: "#aaa", fontSize: "13px", padding: "20px" }}>No messages yet</div>}
              {messages.map((msg, i) => (
                <div key={i} style={{ marginBottom: "10px", display: "flex", justifyContent: msg.sender === "coach" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "80%", background: msg.sender === "coach" ? "#111" : "#f5f5f3", color: msg.sender === "coach" ? "#fff" : "#333", borderRadius: "10px", padding: "8px 12px", fontSize: "12px", lineHeight: "1.5" }}>
                    {msg.message}
                    <div style={{ fontSize: "9px", color: msg.sender === "coach" ? "rgba(255,255,255,0.4)" : "#bbb", marginTop: "3px" }}>
                      {formatDate(msg.created_at?.slice(0, 10))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" value={reply} onChange={e => setReply(e.target.value)} placeholder="Reply to client..."
              onKeyDown={e => e.key === "Enter" && handleSendReply()}
              style={{ flex: 1, padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
            <button onClick={handleSendReply} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "10px 16px", fontSize: "13px", cursor: "pointer", ...F }}>
              Send
            </button>
          </div>
        </>
      )}

      {/* Assign Plan */}
      {view === "assign" && (
        <>
          <div style={{ fontSize: "13px", color: "#555", marginBottom: "14px", lineHeight: "1.6" }}>
            Select a plan to assign to {client.name}. This will replace their current active plan.
          </div>
          {plans.map(plan => (
            <button key={plan.id} onClick={() => onAssignPlan(client.id, plan.id)} style={{ width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "13px 15px", marginBottom: "7px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "600" }}>{plan.name}</div>
                <div style={{ fontSize: "11px", color: "#aaa" }}>{plan.plan_days?.length || 0} days</div>
              </div>
              <span style={{ color: "#2563a8" }}>Assign →</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState("clients"); // clients | plans | client_detail
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    getCoachSession().then(s => {
      setSession(s);
      setAuthChecked(true);
    });
    const { data: { subscription } } = onAuthChange(s => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function loadData() {
    setLoading(true);
    const [clientsResult, plansResult] = await Promise.all([getMyClients(), getMyPlans()]);
    setClients(clientsResult.data || []);
    setPlans(plansResult.data || []);
    setLoading(false);
  }

  async function handleAssignPlan(clientId, planId) {
    await assignPlanToClient(clientId, planId);
    alert("Plan assigned successfully.");
  }

  if (!authChecked) return <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Loading...</div>;
  if (!session) return <LoginScreen onLogin={() => getCoachSession().then(setSession)} />;

  return (
    <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "#111", color: "#f7f6f3", padding: "20px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>Coach</div>
            <h1 style={{ margin: 0, fontSize: "21px", fontWeight: "normal" }}>Dashboard</h1>
          </div>
          <button onClick={signOutCoach} style={{ background: "none", border: "1px solid #333", color: "#666", borderRadius: "20px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
            Sign Out
          </button>
        </div>
        <div style={{ display: "flex", gap: "3px" }}>
          {[["clients","Clients"],["plans","Plan Builder"]].map(([v, label]) => (
            <button key={v} onClick={() => { setView(v); setSelectedClient(null); }} style={{ background: view === v && !selectedClient ? "#f7f6f3" : "transparent", color: view === v && !selectedClient ? "#111" : "#666", border: "1px solid", borderColor: view === v && !selectedClient ? "#f7f6f3" : "#333", borderRadius: "4px 4px 0 0", padding: "6px 14px", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", ...F }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {selectedClient ? (
        <ClientDetail
          client={selectedClient}
          coachId={session.user.id}
          plans={plans}
          onBack={() => setSelectedClient(null)}
          onAssignPlan={handleAssignPlan}
        />
      ) : view === "clients" ? (
        <div style={{ padding: "16px 16px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999" }}>{clients.length} client{clients.length !== 1 ? "s" : ""}</div>
            <button onClick={() => setShowCreateClient(true)} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
              + New Client
            </button>
          </div>
          {loading && <div style={{ textAlign: "center", color: "#aaa", padding: "20px" }}>Loading...</div>}
          {!loading && clients.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>👤</div>
              <div style={{ fontSize: "14px", marginBottom: "6px" }}>No clients yet</div>
              <div style={{ fontSize: "12px" }}>Tap "+ New Client" to get started</div>
            </div>
          )}
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onSelect={setSelectedClient} unreadCount={unreadCounts[client.id] || 0} />
          ))}
        </div>
      ) : (
        <PlanBuilder coachId={session.user.id} onBack={() => setView("clients")} />
      )}

      {showCreateClient && (
        <CreateClientModal
          coachId={session.user.id}
          onSave={(newClient) => { setClients(prev => [newClient, ...prev]); setShowCreateClient(false); }}
          onCancel={() => setShowCreateClient(false)}
        />
      )}
    </div>
  );
}
