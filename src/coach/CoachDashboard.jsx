import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  signInCoach, signOutCoach, getCoachSession, onAuthChange,
  getMyClients, createClient_db, updateClient_db, deleteClient_db,
  getMyPlans, createPlan, updatePlan, createPlanDay,
  addExerciseToPlanDay, removePlanExercise, reorderPlanExercises,
  assignPlanToClient, getAllExercises, getClientOverview,
  createCoachNote, getMessages, sendMessage, markMessagesRead, subscribeToMessages,
  inviteClient, getClientIntake, seedClientDataFromIntake
} from "../lib/supabase";
import { formatDate } from "../storage";
import AICoachPanel from "../components/AICoachPanel";
import AIProgramBuilder from "../components/AIProgramBuilder";
import ClientAnalytics from "./ClientAnalytics";
import ClientProgramReview from "./ClientProgramReview";
import ClientProgramView from "./ClientProgramView";
import ClientStatusView from "./ClientStatusView";
import GroupProgramming from "./GroupProgramming";
import ProgramLibrary from "./ProgramLibrary";
import VideoLibrary from "./VideoLibrary";
import ProgressDashboard from "../components/ProgressDashboard";
import { UI, SectionLabel, EmptyState, Card, InlineEmpty } from "../components/ui";
import { clientSetupLink, authRedirectUrl } from "../lib/env";

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
function ClientCard({ client, onSelect, unreadCount, lastActive, sessionCount }) {
  const initials = client.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Compliance color based on last active
  function getStatusColor() {
    if (!lastActive) return "#e0e0e0";
    const days = Math.floor((Date.now() - new Date(lastActive)) / 86400000);
    if (days <= 3) return "#2d7a1e";
    if (days <= 7) return "#c47a0a";
    return "#a02020";
  }

  function getStatusLabel() {
    if (!lastActive) return "No sessions yet";
    const days = Math.floor((Date.now() - new Date(lastActive)) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days <= 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  const statusColor = getStatusColor();

  return (
    <button onClick={() => onSelect(client)} style={{
      width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px",
      padding: "13px 16px", marginBottom: "8px", display: "flex", alignItems: "center",
      gap: "12px", cursor: "pointer", ...F, textAlign: "left",
    }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#111", color: "#f7f6f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700" }}>
          {initials}
        </div>
        <div style={{ position: "absolute", bottom: 0, right: 0, width: "11px", height: "11px", borderRadius: "50%", background: statusColor, border: "2px solid #fff" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{client.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#aaa", textTransform: "capitalize" }}>{client.goal?.replace("_", " ") || "No goal"}</span>
          <span style={{ fontSize: "10px", color: statusColor, fontWeight: "600" }}>{getStatusLabel()}</span>
          {sessionCount > 0 && <span style={{ fontSize: "10px", color: "#bbb" }}>{sessionCount} sessions</span>}
        </div>
      </div>
      {unreadCount > 0 && (
        <div style={{ background: "#a02020", color: "#fff", borderRadius: "20px", padding: "2px 8px", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>
          {unreadCount}
        </div>
      )}
      <span style={{ color: "#ccc", fontSize: "14px" }}>→</span>
    </button>
  );
}

// ── Create Client Modal ────────────────────────────────────────────────────────
function CreateClientModal({ onSave, onCancel, coachId }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", goal: "", sex: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [createError, setCreateError] = useState(null);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setCreateError(null);
    const payload = {
      name: form.name.trim(),
      coach_id: coachId,
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
      ...(form.notes.trim() && { notes: form.notes.trim() }),
      goal: form.goal || "recomp",
      sex: form.sex || "female",
    };
    console.log("Creating client with payload:", payload);
    const { data, error } = await createClient_db(payload);
    console.log("Result:", { data, error });
    setSaving(false);
    if (data) {
      setCreated(data);
    } else {
      setCreateError(error?.message || "Something went wrong. Please try again.");
    }
  }

  if (created) {
    const clientUrl = clientSetupLink(created.access_token);
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", maxWidth: "380px", width: "100%" }}>
          
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
        <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "4px" }}>New Client</div>
        <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "16px", lineHeight: 1.5 }}>
          Only name is required to get started. Everything else can be filled in by the client when they complete their onboarding form.
        </div>
        {[["Name", "name", "text", true], ["Email", "email", "email", false], ["Phone", "phone", "tel", false]].map(([label, key, type, required]) => (
          <div key={key} style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>
              {label} {required ? <span style={{ color: "#a02a2a" }}>*</span> : <span style={{ color: "#bbb" }}>(optional)</span>}
            </div>
            <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
          </div>
        ))}

        <div style={{ background: "#f9f9f7", borderRadius: "7px", padding: "10px 12px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>Optional — fill in if you know it</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Goal</div>
              <select value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F, color: form.goal ? "#111" : "#aaa" }}>
                <option value="">— not set —</option>
                {["recomp","fat_loss","muscle_gain","strength"].map(g => (
                  <option key={g} value={g}>{g.replace(/_/g," ")}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Sex</div>
              <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F, color: form.sex ? "#111" : "#aaa" }}>
                <option value="">— not set —</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Notes</div>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="Anything you already know — goals, injuries, experience..."
              style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
          </div>
        </div>
        {createError && (
          <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: 7, padding: "10px 12px", marginBottom: 10, fontSize: 12, color: "#a02020", lineHeight: 1.5 }}>
            {createError}
          </div>
        )}
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
// ── Billing Panel ─────────────────────────────────────────────────────────────
function BillingPanel({ client, coachId }) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(client.billing_status || 'trial');
  const [saved, setSaved] = useState(false);

  const statusColors = {
    active: "#2d7a1e", trial: "#c47a0a", complimentary: "#2563a8",
    past_due: "#a02020", cancelled: "#888", paused: "#555",
  };

  const statusLabels = {
    active: "Active", trial: "Trial", complimentary: "Complimentary",
    past_due: "Past due", cancelled: "Cancelled", paused: "Paused",
  };

  async function saveStatus(newStatus) {
    setSaving(true);
    await updateClient_db(client.id, { billing_status: newStatus });
    setStatus(newStatus);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  const trialEnd = client.trial_ends_at ? new Date(client.trial_ends_at) : null;
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)) : null;

  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "14px" }}>
        Billing — {client.name}
      </div>

      {/* Current status */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "14px 16px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>Status</div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: statusColors[status] || "#bbb" }} />
              <span style={{ fontSize: "15px", fontWeight: "600", color: "#111" }}>{statusLabels[status] || status}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {status === 'trial' && trialDaysLeft !== null && (
              <div style={{ fontSize: "11px", color: "#c47a0a" }}>{trialDaysLeft} days left</div>
            )}
            {client.billing_next_renewal && (
              <div style={{ fontSize: "11px", color: "#aaa" }}>
                Renews {new Date(client.billing_next_renewal).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            )}
            {client.stripe_customer_id && (
              <div style={{ fontSize: "9px", color: "#ddd", marginTop: "2px" }}>Stripe: {client.stripe_customer_id.slice(0, 12)}...</div>
            )}
          </div>
        </div>
      </div>

      {/* Manual override — for Tara to manage edge cases */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "14px 16px", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: "600", color: "#555", marginBottom: "10px" }}>Override status</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {["active", "trial", "complimentary", "paused", "cancelled"].map(s => (
            <button
              key={s} onClick={() => saveStatus(s)} disabled={saving || s === status}
              style={{
                padding: "6px 12px", borderRadius: "20px", fontSize: "11px", cursor: s === status ? "default" : "pointer",
                background: s === status ? statusColors[s] : "#f5f5f3",
                color: s === status ? "#fff" : "#555",
                border: `1px solid ${s === status ? statusColors[s] : "#e4e0db"}`,
                opacity: saving ? 0.6 : 1,
              }}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>
        {saved && <div style={{ fontSize: "10px", color: "#2d7a1e", marginTop: "8px" }}>Saved</div>}
      </div>

      {/* Complimentary note */}
      {status === "complimentary" && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "11px 13px", fontSize: "11px", color: "#1e40af", lineHeight: "1.6" }}>
          Complimentary access — this client will never see a payment gate regardless of billing status.
        </div>
      )}
    </div>
  );
}


// ── Assign Plan View ───────────────────────────────────────────────────────────
function AssignPlanView({ client, coachId, onAssigned }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    import("../lib/supabase").then(({ getPrograms }) => {
      getPrograms(coachId).then(({ data }) => {
        setPrograms(data || []);
        setLoading(false);
      });
    });
  }, [coachId]);

  async function handleAssign(program) {
    if (!window.confirm(`Assign "${program.name}" to ${client.name}? This will replace their current program.`)) return;
    setAssigning(program.id);
    const { getProgramById, assignProgramToClient } = await import("../lib/supabase");
    const { data: fullProgram } = await getProgramById(program.id);
    if (fullProgram) {
      await assignProgramToClient(program.id, client.id);
      // Also store schedule in client record for immediate use
      await import("../lib/supabase").then(({ updateClient_db }) => {
        updateClient_db(client.id, { assigned_program_id: program.id });
      });
    }
    setAssigning(null);
    onAssigned(program);
  }

  const filtered = programs.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>
        Assign program to {client.name}
      </div>
      <div style={{ fontSize: "12px", color: "#777", lineHeight: "1.6", marginBottom: "14px" }}>
        Select a program from the library. This replaces their current active plan immediately.
      </div>

      {programs.length === 0 && !loading && (
        <div style={{ background: "#fff8f0", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px", fontSize: "12px", color: "#92400e", lineHeight: "1.6" }}>
          No programs in the library yet. Go to Program Library and save a program first.
        </div>
      )}

      {programs.length > 0 && (
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search programs..."
          style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "12px", marginBottom: "10px", boxSizing: "border-box" }}
        />
      )}

      {loading && <div style={{ color: "#bbb", fontSize: "12px", padding: "10px 0" }}>Loading programs...</div>}

      {filtered.map(program => (
        <div key={program.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "13px 15px", marginBottom: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "3px" }}>{program.name}</div>
              {program.description && <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.5", marginBottom: "4px" }}>{program.description.slice(0, 100)}{program.description.length > 100 ? "..." : ""}</div>}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {program.goal && <span style={{ fontSize: "9px", background: "#f0f0f0", color: "#666", padding: "2px 7px", borderRadius: "4px" }}>{program.goal.replace(/_/g," ")}</span>}
                {program.days_per_week && <span style={{ fontSize: "9px", background: "#f0f0f0", color: "#666", padding: "2px 7px", borderRadius: "4px" }}>{program.days_per_week} days/wk</span>}
                {program.is_template && <span style={{ fontSize: "9px", background: "#f0fff0", color: "#2d7a1e", padding: "2px 7px", borderRadius: "4px" }}>Template</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => handleAssign(program)}
            disabled={assigning === program.id}
            style={{
              background: assigning === program.id ? "#aaa" : "#1a1a1a",
              color: "#fff", border: "none", borderRadius: "20px",
              padding: "7px 16px", fontSize: "11px",
              cursor: assigning === program.id ? "wait" : "pointer",
            }}
          >
            {assigning === program.id ? "Assigning..." : "Assign to " + client.name.split(" ")[0]}
          </button>
        </div>
      ))}
    </div>
  );
}


function ClientDetail({ client, coachId, plans, onBack, onDelete, onAssignPlan }) {
  const [view, setView] = useState("overview"); // overview | notes | messages | assign
  const [overview, setOverview] = useState(null);
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [messages, setMessages] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);
  const [intake, setIntake] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(client.auth_user_id ? "exists" : null);
  const [inviteError, setInviteError] = useState("");
  const [setupLink, setSetupLink] = useState(null);
  const [editForm, setEditForm] = useState({ name: client.name || "", email: client.email || "", phone: client.phone || "", goal: client.goal || "recomp", sex: client.sex || "male", notes: client.notes || "" });
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [showProgramReview, setShowProgramReview] = useState(false);

  async function handleSeedFromIntake() {
    if (!intake) return;
    setSeeding(true);
    setSeedResult(null);
    const result = await seedClientDataFromIntake(client.id, intake);
    setSeedResult(result);
    setSeeding(false);
    // Reload overview to reflect new data
    const data = await getClientOverview(client.id);
    setOverview(data);
  }
  const [editSaving, setEditSaving] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSaveEdit() {
    setEditSaving(true);
    setEditSaved(false);
    await updateClient_db(client.id, editForm);
    setEditSaving(false);
    setEditSaved(true);
    setTimeout(() => setEditSaved(false), 2000);
    Object.assign(client, editForm);
  }

  async function handleDeleteClient() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    const { error } = await deleteClient_db(client.id);
    setDeleting(false);
    if (!error) {
      if (onDelete) onDelete(client.id);
      else onBack();
    }
  }

  async function handleSendInvite() {
    if (!client.email) {
      setInviteError("Add an email address to this client first.");
      return;
    }
    setInviting(true);
    setInviteError("");
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: client.email,
          clientId: client.id,
          clientName: client.name,
          redirectTo: authRedirectUrl(),
        }),
      });
      const result = await res.json();
      if (result.error) {
        setInviteError(result.error);
      } else {
        setInviteStatus("sent");
        if (result.setupLink) setSetupLink(result.setupLink);
      }
    } catch (err) {
      setInviteError("Failed to send invite. Please try again.");
    }
    setInviting(false);
  }

  useEffect(() => {
    async function load() {
      const { recalculatePRsFromLogs } = await import("../lib/supabase");
      await recalculatePRsFromLogs(client.id);
      const [data, intakeResult] = await Promise.all([
        getClientOverview(client.id),
        getClientIntake(client.id)
      ]);
      setOverview(data);
      setIntake(intakeResult.data);
      setMessages(data.messages || []);
      markMessagesRead(client.id, "client");
    }
    load();

    // Real-time subscription — messages appear instantly when client sends
    const unsub = subscribeToMessages(client.id, (newMsg) => {
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id);
        if (exists) return prev;
        const updated = [...prev, newMsg].sort((a, b) => a.created_at.localeCompare(b.created_at));
        return updated;
      });
      // If on messages tab, mark as read immediately
      setView(v => {
        if (v === "messages") markMessagesRead(client.id, "client");
        return v;
      });
      // Update unread count in overview
      setOverview(prev => prev ? {
        ...prev,
        unreadFromClient: (prev.unreadFromClient || 0) + (newMsg.sender === "client" ? 1 : 0)
      } : prev);
    });

    return () => { if (unsub?.unsubscribe) unsub.unsubscribe(); };
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

  const clientUrl = clientSetupLink(client.access_token);

  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", marginBottom: "14px", ...F }}>← All Clients</button>

      {/* Client header */}
      <div style={{ background: "#111", borderRadius: "10px", padding: "16px", marginBottom: "14px", color: "#f7f6f3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div style={{ fontSize: "18px", fontWeight: "normal" }}>{client.name}</div>
          <div style={{ fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: client.is_active ? "#2d7a1e" : "#555", background: client.is_active ? "rgba(45,122,30,0.15)" : "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: "20px" }}>
            {client.is_active ? "Active" : "Inactive"}
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "#555", marginBottom: "10px", textTransform: "capitalize" }}>
          {client.goal?.replace("_"," ")} · {client.sex}
        </div>
        <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
          <button onClick={handleSendInvite} disabled={inviting} style={{ flex: 1, background: inviteStatus === "sent" ? "#2d7a1e" : "#333", color: "#fff", border: "none", borderRadius: "5px", padding: "8px 10px", fontSize: "11px", cursor: "pointer", ...F }}>
            {inviting ? "Sending..." : inviteStatus === "sent" ? "✓ Invite Sent" : inviteStatus === "exists" ? "Resend Invite" : "Send Invite"}
          </button>

        </div>
        {inviteError && <div style={{ fontSize: "10px", color: "#f87171", marginTop: "6px" }}>{inviteError}</div>}
        {setupLink && (
          <div style={{ marginTop: "10px", background: "#1a1a1a", borderRadius: "7px", padding: "10px 12px" }}>
            <div style={{ fontSize: "9px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
              Direct setup link — send this to your client if they didn't receive the email
            </div>
            <div style={{ fontSize: "10px", color: "#888", wordBreak: "break-all", marginBottom: "8px", fontFamily: "monospace" }}>
              {setupLink.substring(0, 60)}...
            </div>
            <button onClick={() => { navigator.clipboard.writeText(setupLink); }} style={{ background: "#333", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "6px 12px", fontSize: "10px", cursor: "pointer", ...F }}>
              Copy setup link
            </button>
          </div>
        )}
      </div>

      {/* Two-level nav — 5 primary tabs, each revealing its own sub-options */}
      {(() => {
        const NAV = [
          { id: "overview", label: "Overview", items: [["overview", "Overview"]] },
          { id: "program",  label: "Program",  items: [["view_program", "View Program"], ["program", "Build"], ["assign", "Assign Plan"], ["program_review", "Program Review"]] },
          { id: "progress", label: "Progress", items: [["progress_dashboard", "Dashboard"], ["analytics", "Analytics"], ["ai", "AI Analysis"], ["photos", "Photos"], ["workout_notes", "Workout Notes"]] },
          { id: "messages", label: "Messages", items: [["messages", "Messages"], ["notes", "Coach Notes"]] },
          { id: "admin",    label: "Admin",    items: [["intake", "Intake Form"], ["billing", "Billing"], ["edit", "Edit Client"]] },
        ];
        // Which primary tab owns the current view?
        const activePrimary = NAV.find(g => g.items.some(([v]) => v === view))?.id || "overview";
        const activeGroup = NAV.find(g => g.id === activePrimary);
        const unread = overview?.unreadFromClient > 0 ? overview.unreadFromClient : 0;
        return (
          <div style={{ marginBottom: "16px" }}>
            {/* Primary tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: activeGroup.items.length > 1 ? "10px" : "0" }}>
              {NAV.map(g => {
                const isActive = g.id === activePrimary;
                return (
                  <button key={g.id} onClick={() => setView(g.items[0][0])} style={{
                    flex: 1, padding: "9px 4px", border: "1px solid " + (isActive ? "#111" : "#e0e0e0"),
                    borderRadius: "7px", background: isActive ? "#111" : "#fff",
                    color: isActive ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "11px", ...F,
                    position: "relative", whiteSpace: "nowrap",
                  }}>
                    {g.label}{g.id === "messages" && unread ? ` (${unread})` : ""}
                  </button>
                );
              })}
            </div>
            {/* Sub-nav for the active primary tab (only when it has more than one item) */}
            {activeGroup.items.length > 1 && (
              <div style={{ display: "flex", gap: "5px", overflowX: "auto", alignItems: "center", paddingBottom: "2px" }}>
                {activeGroup.items.map(([v, label]) => (
                  <button key={v} onClick={() => setView(v)} style={{
                    flex: "0 0 auto", background: view === v ? "#5b4636" : "#f3f1ec",
                    color: view === v ? "#f7f6f3" : "#777", border: "1px solid " + (view === v ? "#5b4636" : "#e0ddd5"),
                    borderRadius: "16px", padding: "5px 13px", fontSize: "11px", cursor: "pointer", ...F, whiteSpace: "nowrap",
                  }}>
                    {label}{v === "messages" && unread ? ` (${unread})` : ""}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

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
            {/* Compliance + stats */}
            {(() => {
              // Calculate compliance: sessions in last 14 days vs expected (6/week)
              const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
              const recentSessions = sessions.filter(([d]) => d >= twoWeeksAgo);
              const expectedSessions = 12; // 6/week × 2 weeks
              const compliancePct = Math.min(100, Math.round((recentSessions.length / expectedSessions) * 100));
              const complianceColor = compliancePct >= 75 ? "#2d7a1e" : compliancePct >= 50 ? "#c47a0a" : "#a02020";

              // Avg check-in scores
              const checkins = overview.checkins || [];
              const recent3 = checkins.slice(-3);
              const avgEnergy = recent3.length ? (recent3.reduce((s,c) => s + (c.energy_level || 5), 0) / recent3.length).toFixed(1) : null;
              const avgSleep = recent3.length ? (recent3.reduce((s,c) => s + (c.sleep_quality || 5), 0) / recent3.length).toFixed(1) : null;

              return (
                <>
                  {/* Compliance bar */}
                  <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa" }}>2-week compliance</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: complianceColor }}>{compliancePct}%</div>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "5px" }}>
                      <div style={{ background: complianceColor, borderRadius: "20px", height: "5px", width: `${compliancePct}%`, transition: "width 0.5s ease" }} />
                    </div>
                    <div style={{ fontSize: "10px", color: "#bbb", marginTop: "5px" }}>
                      {recentSessions.length} of {expectedSessions} expected sessions logged
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "7px", marginBottom: "14px" }}>
                    {[
                      ["Sessions", sessions.length, null],
                      ["PRs", overview.prs?.length || 0, null],
                      ["Energy", avgEnergy ? `${avgEnergy}/10` : "—", null],
                      ["Unread", overview.unreadFromClient || 0, overview.unreadFromClient > 0 ? "#a02020" : null],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "9px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: "8px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#bbb", marginBottom: "3px" }}>{label}</div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: color || "#1a1a1a" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* Deload flag — every 4th week */}
            {(() => {
              const totalSessions = sessions.length;
              if (totalSessions > 0 && totalSessions % 16 >= 12) {
                return (
                  <div style={{ background: "#fffbea", border: "1px solid #fcd34d", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: "600", color: "#92400e" }}>Deload week recommended</div>
                      <div style={{ fontSize: "10px", color: "#b45309", lineHeight: "1.5", marginTop: "2px" }}>
                        {client.name?.split(" ")[0]} is approaching a natural deload point. Consider reducing volume by 40% this week to allow full recovery before the next training block.
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Week-in-review summary */}
            {(() => {
              const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
              const thisWeekSessions = sessions.filter(([date]) => date >= weekAgo);
              const lastWeekStart = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);
              const lastWeekSessions = sessions.filter(([date]) => date >= lastWeekStart && date < weekAgo);
              if (thisWeekSessions.length === 0) return null;
              const trend = thisWeekSessions.length > lastWeekSessions.length ? "up" : thisWeekSessions.length < lastWeekSessions.length ? "down" : "same";
              return (
                <div style={{ background: "#f0f7ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#2563a8", marginBottom: "5px" }}>This week</div>
                  <div style={{ fontSize: "12px", color: "#1e3a5f" }}>
                    <strong>{thisWeekSessions.length}</strong> session{thisWeekSessions.length !== 1 ? "s" : ""}
                    {trend === "up" && <span style={{ color: "#2d7a1e", fontSize: "10px", marginLeft: "6px" }}>↑ more than last week</span>}
                    {trend === "down" && <span style={{ color: "#a02020", fontSize: "10px", marginLeft: "6px" }}>↓ fewer than last week</span>}
                    {trend === "same" && <span style={{ color: "#666", fontSize: "10px", marginLeft: "6px" }}>same as last week</span>}
                  </div>
                </div>
              );
            })()}

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
                        <span style={{ fontSize: "12px", color: "#555" }}><span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: "#f59e0b", color: "#111", padding: "2px 5px", borderRadius: "3px", marginRight: "4px" }}>PR</span>{pr.weight_lbs} lbs × {pr.reps}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Measurements */}
            {latestMeasurement && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "10px" }}>
                  Measurements · {formatDate(latestMeasurement.measured_at)}
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

            {/* Check-in history */}
            {overview.checkins && overview.checkins.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "10px" }}>Recent Check-ins</div>
                {overview.checkins.slice(-4).reverse().map((c, i) => (
                  <div key={i} style={{ marginBottom: "8px", paddingBottom: "8px", borderBottom: i < Math.min(3, overview.checkins.length - 1) ? "1px solid #f5f5f5" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#555" }}>{formatDate(c.checked_in_at?.slice(0, 10))}</span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {c.energy_level && <span style={{ fontSize: "10px", color: c.energy_level >= 7 ? "#2d7a1e" : c.energy_level >= 4 ? "#c47a0a" : "#a02020" }}>Energy {c.energy_level}/10</span>}
                        {c.sleep_quality && <span style={{ fontSize: "10px", color: "#aaa" }}>Sleep {c.sleep_quality}/10</span>}
                        {c.soreness_level && <span style={{ fontSize: "10px", color: "#aaa" }}>Sore {c.soreness_level}/10</span>}
                      </div>
                    </div>
                    {c.notes && <div style={{ fontSize: "11px", color: "#888", fontStyle: "italic", lineHeight: "1.5" }}>"{c.notes}"</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Quick actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <button onClick={() => setView("notes")} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "11px 14px", cursor: "pointer", textAlign: "left", ...F }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>Coach Notes</div>
                <div style={{ fontSize: "12px", color: "#333" }}>Add a note →</div>
              </button>
              <button onClick={() => setView("program")} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "11px 14px", cursor: "pointer", textAlign: "left", ...F }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>AI Program</div>
                <div style={{ fontSize: "12px", color: "#333" }}>Build program →</div>
              </button>
              <button onClick={() => setView("messages")} style={{ background: overview?.unreadFromClient > 0 ? "#fff5f5" : "#fff", border: `1px solid ${overview?.unreadFromClient > 0 ? "#f0b0b0" : "#e8e8e8"}`, borderRadius: "8px", padding: "11px 14px", cursor: "pointer", textAlign: "left", ...F }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>Messages</div>
                <div style={{ fontSize: "12px", color: overview?.unreadFromClient > 0 ? "#a02020" : "#333" }}>
                  {overview?.unreadFromClient > 0 ? `${overview.unreadFromClient} unread →` : "View thread →"}
                </div>
              </button>
              <button onClick={() => setView("ai")} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "11px 14px", cursor: "pointer", textAlign: "left", ...F }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "3px" }}>AI Analysis</div>
                <div style={{ fontSize: "12px", color: "#333" }}>Run analysis →</div>
              </button>
            </div>
          </>
        );
      })()}

      {/* Progress Dashboard */}
      {view === "progress_dashboard" && (
        <ProgressDashboard clientId={client.id} clientName={client.name} />
      )}

      {/* AI Analysis */}
      {view === "analytics" && (
        <ClientAnalytics clientId={client.id} />
      )}

      {/* Program Review */}
      {view === "program_review" && (
        <div style={{ padding: "8px 0" }}>
          <div style={{ fontSize: "13px", color: "#555", marginBottom: "16px", lineHeight: 1.6 }}>
            Generate an AI-powered review of {client.name}'s training period — what's working, what needs attention, and specific recommendations for the next program rotation.
          </div>
          <button
            onClick={() => setShowProgramReview(true)}
            style={{ ...F, fontSize: "14px", fontWeight: "600", padding: "11px 24px", background: "#111", color: "#fff", border: "none", borderRadius: "7px", cursor: "pointer" }}
          >
            Generate Program Review
          </button>
        </div>
      )}

      {showProgramReview && (
        <ClientProgramReview
          client={client}
          onClose={() => setShowProgramReview(false)}
        />
      )}

      {view === "photos" && (
        <EmptyState
          icon="◎"
          title="Progress photos"
          detail="Photo viewing from the coach dashboard is coming soon. Clients can upload progress photos from their app today."
        />
      )}

      {view === "ai" && overview && (
        <AICoachPanel client={client} overview={overview} />
      )}
      {view === "ai" && !overview && (
        <div style={{ textAlign: "center", padding: "30px", color: "#bbb", ...F }}>Loading client data...</div>
      )}

      {/* AI Program Builder */}
      {view === "view_program" && (
        <ClientProgramView client={client} />
      )}

      {view === "program" && (
        <AIProgramBuilder
          client={client}
          intake={intake}
          overview={overview}
        />
      )}

      {/* Workout Notes — read all exercise notes left by the client */}
      {view === "workout_notes" && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
            Exercise notes from {client.name}
          </div>
          {!overview ? (
            <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>Loading...</div>
          ) : (() => {
            // Collect all set-level notes from recent logs
            const logsWithNotes = (overview.recentLogs || []).filter(log => log.notes && log.notes.trim());
            if (logsWithNotes.length === 0) {
              return (
                <EmptyState
                  icon="✎"
                  title="No exercise notes yet"
                  detail={`Notes that ${client.name} leaves on exercises during workouts will appear here.`}
                />
              );
            }
            // Group by date
            const byDate = {};
            logsWithNotes.forEach(log => {
              const d = log.session_date;
              if (!byDate[d]) byDate[d] = [];
              byDate[d].push(log);
            });
            return Object.entries(byDate).sort((a,b) => b[0].localeCompare(a[0])).map(([date, logs]) => (
              <div key={date} style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: "#aaa", letterSpacing: "0.08em", marginBottom: "6px" }}>{formatDate(date)}</div>
                {logs.map((log, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "11px 13px", marginBottom: "6px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#555", marginBottom: "4px" }}>
                      {log.exercises?.name || "Exercise"}
                      {log.weight_lbs && <span style={{ fontSize: "10px", color: "#bbb", fontWeight: "400", marginLeft: "6px" }}>{log.weight_lbs} lbs × {log.reps}</span>}
                    </div>
                    <div style={{ fontSize: "12px", color: "#333", lineHeight: "1.6", ...F, fontStyle: "italic" }}>"{log.notes}"</div>
                  </div>
                ))}
              </div>
            ));
          })()}
        </div>
      )}

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
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#aaa" }}>
                {client.name}
              </div>
              {overview?.unreadFromClient > 0 && (
                <div style={{ fontSize: "10px", color: "#a02020" }}>{overview.unreadFromClient} unread</div>
              )}
            </div>
            <div style={{ maxHeight: "380px", overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", color: UI.faint, fontSize: "12px", padding: "30px 0", ...F }}>No messages yet — say hello to {client.name}</div>
              )}
              {messages.map((msg, i) => {
                const isCoach = msg.sender === "coach";
                const showDate = i === 0 || messages[i-1]?.created_at?.slice(0,10) !== msg.created_at?.slice(0,10);
                return (
                  <div key={i}>
                    {showDate && (
                      <div style={{ textAlign: "center", fontSize: "9px", color: "#ccc", margin: "4px 0 8px", letterSpacing: "0.08em" }}>
                        {formatDate(msg.created_at?.slice(0, 10))}
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: isCoach ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "78%", background: isCoach ? "#1a1a1a" : "#f0f0ee",
                        color: isCoach ? "#f7f6f3" : "#333",
                        borderRadius: isCoach ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                        padding: "9px 12px", fontSize: "12px", lineHeight: "1.6",
                      }}>
                        <div>{msg.message}</div>
                        <div style={{ fontSize: "9px", color: isCoach ? "rgba(255,255,255,0.35)" : "#bbb", marginTop: "3px" }}>
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                          {isCoach && " · You"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input type="text" value={reply} onChange={e => setReply(e.target.value)}
              placeholder={`Message ${client.name.split(" ")[0]}...`}
              onKeyDown={e => e.key === "Enter" && handleSendReply()}
              style={{ flex: 1, padding: "10px 12px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
            <button onClick={handleSendReply} disabled={!reply.trim()} style={{ background: reply.trim() ? "#111" : "#e0e0e0", color: reply.trim() ? "#fff" : "#aaa", border: "none", borderRadius: "7px", padding: "10px 16px", fontSize: "13px", cursor: reply.trim() ? "pointer" : "default", ...F }}>
              Send
            </button>
          </div>
        </>
      )}

      {/* Intake Form */}
      {view === "intake" && (
        <div>
          {!intake ? (
            <EmptyState
              icon="✎"
              title="No intake submitted yet"
              detail="This client hasn't completed the onboarding questionnaire yet."
            />
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999" }}>Client Intake Form</div>
                <button onClick={handleSeedFromIntake} disabled={seeding} style={{ background: seeding ? "#ccc" : "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: seeding ? "wait" : "pointer", ...F }}>
                  {seeding ? "Seeding..." : "Seed into app data"}
                </button>
              </div>
              <button
                onClick={() => setView("program")}
                style={{
                  width: "100%", background: "#2563a8", color: "#fff",
                  border: "none", borderRadius: "9px", padding: "13px",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer", ...F,
                  marginBottom: "14px", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "7px",
                }}
              >
                
                Build Program from This Intake
              </button>

              {seedResult && (
                <div style={{ background: seedResult.errors.length > 0 ? "#fff5f5" : "#e8f5e9", border: `1px solid ${seedResult.errors.length > 0 ? "#f0b0b0" : "#a5d6a7"}`, borderRadius: "7px", padding: "10px 13px", marginBottom: "12px", fontSize: "11px", lineHeight: "1.6" }}>
                  {seedResult.errors.length === 0 ? (
                    <div style={{ color: "#2d7a1e" }}>
                      Done. {seedResult.hasMeasurements ? "Body measurements logged. " : ""}{seedResult.prCount > 0 ? `${seedResult.prCount} baseline PRs saved. ` : ""}Injury flags and equipment updated on the client profile.
                    </div>
                  ) : (
                    <div style={{ color: "#a02020" }}>
                      Partial: {seedResult.errors.join(", ")}
                    </div>
                  )}
                </div>
              )}
              {[
                { label: "── GOALS ──", value: " " },
                { label: "Primary Goal", value: intake.primary_goal?.replace("_"," ") },
                { label: "Target Weight", value: intake.target_weight_lbs ? `${intake.target_weight_lbs} lbs` : null },
                { label: "Timeline", value: intake.goal_timeline?.replace("_"," ") },
                { label: "Focus Areas", value: intake.focus_areas?.join(", ") },
                { label: "Goal Notes", value: intake.goal_notes },
                { label: "── STATS ──", value: " " },
                { label: "Height", value: intake.height_ft ? `${intake.height_ft}' ${Math.round((intake.height_in || 0) % 12)}"` : null },
                { label: "Current Weight", value: intake.current_weight_lbs ? `${intake.current_weight_lbs} lbs` : null },
                { label: "Body Fat %", value: intake.body_fat_pct ? `${intake.body_fat_pct}%` : null },
                { label: "── MEASUREMENTS ──", value: " " },
                { label: "Waist", value: intake.waist_in ? `${intake.waist_in}"` : null },
                { label: "Chest", value: intake.chest_in ? `${intake.chest_in}"` : null },
                { label: "Hips", value: intake.hips_in ? `${intake.hips_in}"` : null },
                { label: "Right Thigh", value: intake.right_thigh_in ? `${intake.right_thigh_in}"` : null },
                { label: "Left Thigh", value: intake.left_thigh_in ? `${intake.left_thigh_in}"` : null },
                { label: "Right Arm", value: intake.right_arm_in ? `${intake.right_arm_in}"` : null },
                { label: "Left Arm", value: intake.left_arm_in ? `${intake.left_arm_in}"` : null },
                { label: "── BASELINE BENCHMARKS ──", value: " " },
                { label: "Bench Press (baseline)", value: intake.bench_press_lbs ? `${intake.bench_press_lbs} lbs` : null },
                { label: "Overhead Press (baseline)", value: intake.overhead_press_lbs ? `${intake.overhead_press_lbs} lbs` : null },
                { label: "Squat (baseline)", value: intake.squat_lbs ? `${intake.squat_lbs} lbs` : null },
                { label: "Hip Thrust (baseline)", value: intake.hip_thrust_lbs ? `${intake.hip_thrust_lbs} lbs` : null },
                { label: "Deadlift (baseline)", value: intake.deadlift_lbs ? `${intake.deadlift_lbs} lbs` : null },
                { label: "Max Pull-Ups (baseline)", value: intake.pullups_max !== null ? `${intake.pullups_max} reps` : null },
                { label: "── TRAINING ──", value: " " },
                { label: "Training Days/Week", value: intake.training_days_per_week },
                { label: "Preferred Days", value: intake.preferred_days?.join(", ") },
                { label: "Session Length", value: intake.session_length_minutes ? `${intake.session_length_minutes} min` : null },
                { label: "Training Style", value: intake.training_style?.replace(/_/g, " ") },
                { label: "Equipment", value: intake.equipment_available?.join(", ") },
                { label: "── CARDIO ──", value: " " },
                { label: "Cardio Types", value: intake.cardio_types?.filter(c => c !== "none").join(", ") || (intake.cardio_types?.includes("none") ? "None" : null) },
                { label: "Cardio Days/Week", value: intake.cardio_days_per_week },
                { label: "Cardio Duration", value: intake.cardio_duration_minutes ? `${intake.cardio_duration_minutes} min` : null },
                { label: "Cardio Notes", value: intake.cardio_notes },
                { label: "Fixed Commitments", value: intake.fixed_commitments?.length ? intake.fixed_commitments.map(c => `${c.day}: ${c.activity}`).join(", ") : "None" },
                { label: "── INJURIES ──", value: " " },
                { label: "Injury Flags", value: intake.injury_flags?.join(", ") || "None" },
                { label: "Injury Notes", value: intake.injury_notes },
                { label: "Mobility Limitations", value: intake.mobility_limitations },
                { label: "── LIFESTYLE ──", value: " " },
                { label: "Sleep", value: intake.sleep_hours_per_night ? `${intake.sleep_hours_per_night} hrs/night` : null },
                { label: "Stress Level", value: intake.stress_level ? `${intake.stress_level}/5` : null },
                { label: "Nutrition Approach", value: intake.nutrition_approach?.replace("_"," ") },
                { label: "Daily Protein", value: intake.daily_protein_grams ? `${intake.daily_protein_grams}g` : null },
                { label: "Stretches", value: intake.does_stretch === true ? "Yes" : intake.does_stretch === false ? "No" : null },
                { label: "── BACKGROUND ──", value: " " },
                { label: "Experience", value: intake.experience_level },
                { label: "Knows Progressive Overload", value: intake.knows_progressive_overload === true ? "Yes" : intake.knows_progressive_overload === false ? "No" : null },
                { label: "Knows Form Basics", value: intake.knows_form_basics === true ? "Yes" : intake.knows_form_basics === false ? "No" : null },
                { label: "Prior Coaching", value: intake.prior_coaching === true ? "Yes" : intake.prior_coaching === false ? "No" : null },
                { label: "Prior Coaching Notes", value: intake.prior_coaching_notes },
                { label: "Additional Notes", value: intake.additional_notes },
              ].filter(item => item.value).map(({ label, value }, i) => {
                // Section dividers
                if (label.startsWith("──")) {
                  return (
                    <div key={i} style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginTop: "14px", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid #f0f0f0" }}>
                      {label.replace(/──/g, "").trim()}
                    </div>
                  );
                }
                return (
                  <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 13px", marginBottom: "6px", display: "flex", justifyContent: "space-between", gap: "10px" }}>
                    <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: "12px", fontWeight: "500", textAlign: "right", textTransform: "capitalize" }}>{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Client */}
      {view === "billing" && (
        <BillingPanel client={client} coachId={coachId} />
      )}

      {view === "edit" && (
        <div>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "14px" }}>Client Details</div>
          {[["Name", "name", "text"], ["Email", "email", "email"], ["Phone", "phone", "tel"]].map(([label, key, type]) => (
            <div key={key} style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>{label}</div>
              <input type={type} value={editForm[key]} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Goal</div>
              <select value={editForm.goal} onChange={e => setEditForm(f => ({ ...f, goal: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}>
                {["recomp","fat_loss","muscle_gain","strength","endurance"].map(g => (
                  <option key={g} value={g}>{g.replace("_"," ")}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Sex</div>
              <select value={editForm.sex} onChange={e => setEditForm(f => ({ ...f, sex: e.target.value }))}
                style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "13px", ...F }}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "#777", marginBottom: "4px" }}>Coach Notes / Intake</div>
            <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
              rows={3} style={{ width: "100%", padding: "9px 11px", borderRadius: "6px", border: "1px solid #e0e0e0", fontSize: "12px", resize: "none", ...F }} />
          </div>
          <button onClick={handleSaveEdit} disabled={editSaving} style={{ width: "100%", background: editSaved ? "#2d7a1e" : "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "13px", fontSize: "14px", cursor: "pointer", ...F, marginBottom: "10px" }}>
            {editSaving ? "Saving..." : editSaved ? "✓ Saved" : "Save Changes"}
          </button>

          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "12px", marginTop: "4px" }}>
            {!confirmDelete ? (
              <button onClick={handleDeleteClient}
                style={{ width: "100%", background: "none", border: "1px solid #f0d0d0", borderRadius: "8px", padding: "11px", fontSize: "12px", cursor: "pointer", color: "#c0a0a0", ...F }}>
                Delete Client
              </button>
            ) : (
              <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: "8px", padding: "12px" }}>
                <div style={{ fontSize: "12px", color: "#a02020", marginBottom: "10px", lineHeight: 1.5 }}>
                  This will permanently delete {client.name} and all their data — logs, measurements, PRs, and messages. This cannot be undone.
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1, background: "#f5f5f3", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "9px", fontSize: "12px", cursor: "pointer", color: "#555" }}>
                    Cancel
                  </button>
                  <button onClick={handleDeleteClient} disabled={deleting}
                    style={{ flex: 1, background: "#a02020", border: "none", borderRadius: "6px", padding: "9px", fontSize: "12px", cursor: "pointer", color: "#fff", ...F }}>
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Plan — pulls from program library */}
      {view === "assign" && (
        <AssignPlanView
          client={client}
          coachId={coachId}
          onAssigned={() => { setView("overview"); alert(`Program assigned to ${client.name}.`); }}
        />
      )}
    </div>
  );
}

// ── Client List View ───────────────────────────────────────────────────────────
function ClientListView({ clients, loading, unreadCounts, onSelect, onNewClient }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent"); // recent | name | unread
  const [listView, setListView] = useState("clients"); // clients | status
  const [recentActivity, setRecentActivity] = useState([]);
  const [showActivity, setShowActivity] = useState(true);

  useEffect(() => {
    // Fetch recent workout completions and swaps across all clients
    async function loadActivity() {
      if (!clients.length) return;
      const clientIds = clients.map(c => c.id);
      const since = new Date(Date.now() - 7 * 86400000).toISOString();

      const [logsRes, swapsRes] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("client_id, session_date, logged_at, exercises(name)")
          .in("client_id", clientIds)
          .eq("completed", true)
          .gte("logged_at", since)
          .order("logged_at", { ascending: false })
          .limit(50),
        supabase
          .from("exercise_swaps")
          .select("client_id, original_exercise, swap_exercise, reason_category, swapped_at")
          .in("client_id", clientIds)
          .gte("swapped_at", since)
          .order("swapped_at", { ascending: false })
          .limit(20),
      ]);

      // Group logs by client+day to get "session completed" events
      const sessionMap = {};
      (logsRes.data || []).forEach(log => {
        const key = `${log.client_id}__${log.session_date || log.logged_at?.slice(0,10)}`;
        if (!sessionMap[key]) {
          sessionMap[key] = {
            type: "session",
            client_id: log.client_id,
            date: log.session_date || log.logged_at?.slice(0,10),
            logged_at: log.logged_at,
            exercises: [],
          };
        }
        if (log.exercises?.name) sessionMap[key].exercises.push(log.exercises.name);
      });

      const swapEvents = (swapsRes.data || []).map(s => ({ type: "swap", ...s }));
      const sessionEvents = Object.values(sessionMap);
      const allEvents = [...sessionEvents, ...swapEvents]
        .sort((a, b) => new Date(b.logged_at || b.swapped_at) - new Date(a.logged_at || a.swapped_at))
        .slice(0, 15);

      setRecentActivity(allEvents);
    }
    loadActivity();
  }, [clients]);

  // Build activity summary from clients data
  function getLastActive(client) {
    return client.last_workout_at || client.updated_at || null;
  }

  function getSessionCount(client) {
    return client.total_sessions || 0;
  }

  // Build roster health summary
  const rosterStats = (() => {
    const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);
    const activeThisWeek = clients.filter(c => {
      if (!c.last_workout_at) return false;
      const days = Math.floor((Date.now() - new Date(c.last_workout_at)) / 86400000);
      return days <= 7;
    }).length;
    const needsCheckIn = clients.filter(c => {
      if (!c.last_workout_at) return true;
      const days = Math.floor((Date.now() - new Date(c.last_workout_at)) / 86400000);
      return days > 7;
    }).length;
    return { totalUnread, activeThisWeek, needsCheckIn };
  })();

  const filtered = clients
    .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "unread") return (unreadCounts[b.id] || 0) - (unreadCounts[a.id] || 0);
      // recent: sort by last active
      const da = getLastActive(a) ? new Date(getLastActive(a)) : new Date(0);
      const db = getLastActive(b) ? new Date(getLastActive(b)) : new Date(0);
      return db - da;
    });

  // Group into attention-needed and others
  const needsAttention = filtered.filter(c => {
    const la = getLastActive(c);
    if (!la) return false;
    const days = Math.floor((Date.now() - new Date(la)) / 86400000);
    return days > 7;
  });
  const active = filtered.filter(c => {
    const la = getLastActive(c);
    if (!la) return true;
    const days = Math.floor((Date.now() - new Date(la)) / 86400000);
    return days <= 7;
  });

  function timeAgo(str) {
    if (!str) return "";
    const mins = Math.floor((Date.now() - new Date(str)) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  return (
    <div style={{ padding: "16px 16px 60px" }}>

      {/* Roster at-a-glance summary */}
      {clients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
          <div style={{ background: rosterStats.activeThisWeek === clients.length ? "#f0fff4" : "#fff", border: `1px solid ${rosterStats.activeThisWeek === clients.length ? "#bbf7d0" : "#e8e8e8"}`, borderRadius: "9px", padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#111", lineHeight: 1 }}>{rosterStats.activeThisWeek}</div>
            <div style={{ fontSize: "8px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "3px" }}>Active this week</div>
          </div>
          <div style={{ background: rosterStats.needsCheckIn > 0 ? "#fff8f0" : "#fff", border: `1px solid ${rosterStats.needsCheckIn > 0 ? "#fed7aa" : "#e8e8e8"}`, borderRadius: "9px", padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: rosterStats.needsCheckIn > 0 ? "#c47a0a" : "#111", lineHeight: 1 }}>{rosterStats.needsCheckIn}</div>
            <div style={{ fontSize: "8px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "3px" }}>Need check-in</div>
          </div>
          <div style={{ background: rosterStats.totalUnread > 0 ? "#fff5f5" : "#fff", border: `1px solid ${rosterStats.totalUnread > 0 ? "#fecaca" : "#e8e8e8"}`, borderRadius: "9px", padding: "12px 10px", textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: rosterStats.totalUnread > 0 ? "#a02020" : "#111", lineHeight: 1 }}>{rosterStats.totalUnread}</div>
            <div style={{ fontSize: "8px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "3px" }}>Unread messages</div>
          </div>
        </div>
      )}

      {/* Recent activity feed */}
      {recentActivity.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <button
            onClick={() => setShowActivity(p => !p)}
            style={{ width: "100%", background: "none", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "0 0 8px 0", ...F }}
          >
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", display: "flex", alignItems: "center", gap: "6px" }}>
              This week
              <span style={{ background: "#2563a8", color: "#fff", borderRadius: "20px", padding: "1px 6px", fontSize: "9px" }}>{recentActivity.length}</span>
            </div>
            <span style={{ fontSize: "10px", color: "#ccc" }}>{showActivity ? "▲" : "▼"}</span>
          </button>

          {showActivity && (
            <div style={{ background: "#f9f9f7", borderRadius: "9px", overflow: "hidden" }}>
              {recentActivity.map((event, i) => {
                const clientName = clients.find(c => c.id === event.client_id)?.name || "Client";
                const isLast = i === recentActivity.length - 1;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const c = clients.find(cl => cl.id === event.client_id);
                      if (c) onSelect(c);
                    }}
                    style={{
                      width: "100%", background: "none", border: "none",
                      borderBottom: isLast ? "none" : "1px solid #f0efec",
                      padding: "10px 13px", cursor: "pointer", textAlign: "left", ...F,
                      display: "flex", alignItems: "flex-start", gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>
                      {event.type === "swap" ? "⇄" : "✓"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12px", color: "#222", marginBottom: "2px" }}>
                        <span style={{ fontWeight: "600" }}>{clientName}</span>
                        {event.type === "session" ? (
                          <span style={{ color: "#555" }}>
                            {" "}completed a session
                            {event.exercises?.length > 0 && (
                              <span style={{ color: "#999" }}> · {[...new Set(event.exercises)].slice(0, 3).join(", ")}{event.exercises.length > 3 ? "..." : ""}</span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "#555" }}>
                            {" "}swapped <span style={{ textDecoration: "line-through", color: "#bbb" }}>{event.original_exercise}</span>
                            {" → "}<span style={{ color: "#2563a8" }}>{event.swap_exercise}</span>
                            {event.reason_category && <span style={{ color: "#999" }}> · {event.reason_category}</span>}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: "10px", color: "#bbb", flexShrink: 0, marginTop: "2px" }}>
                      {timeAgo(event.logged_at || event.swapped_at)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999" }}>
          {clients.length} client{clients.length !== 1 ? "s" : ""}
        </div>
        <button onClick={onNewClient} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "7px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
          + New Client
        </button>
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        {[["clients", "Clients"], ["status", "Status"]].map(([v, label]) => (
          <button key={v} onClick={() => setListView(v)} style={{
            flex: 1, padding: "8px", borderRadius: "8px", fontSize: "11px", cursor: "pointer",
            border: `1px solid ${listView === v ? "#111" : "#e0e0e0"}`,
            background: listView === v ? "#111" : "transparent",
            color: listView === v ? "#f7f6f3" : "#888", ...F,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Search + sort */}
      {clients.length > 2 && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..."
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "12px", ...F }} />
          <select value={sort} onChange={e => setSort(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "11px", background: "#fff" }}>
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", color: "#aaa", padding: "20px", fontSize: "13px" }}>Loading clients...</div>}

      {!loading && clients.length === 0 && (
        <EmptyState
          icon="+"
          title="No clients yet"
          detail='Tap "+ New Client" above to add your first client and send them an invite.'
        />
      )}

      {listView === "status" ? (
        <ClientStatusView clients={filtered} onSelectClient={onSelect} />
      ) : (
        <>
          {/* Needs attention */}
          {needsAttention.length > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#a02020", marginBottom: "8px", fontWeight: "700" }}>
                Needs attention ({needsAttention.length})
              </div>
              {needsAttention.map(client => (
                <ClientCard key={client.id} client={client} onSelect={onSelect}
                  unreadCount={unreadCounts[client.id] || 0}
                  lastActive={getLastActive(client)}
                  sessionCount={getSessionCount(client)} />
              ))}
            </div>
          )}

          {/* Active clients */}
          {active.length > 0 && (
            <div>
              {needsAttention.length > 0 && (
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "8px" }}>Active</div>
              )}
              {active.map(client => (
                <ClientCard key={client.id} client={client} onSelect={onSelect}
                  unreadCount={unreadCounts[client.id] || 0}
                  lastActive={getLastActive(client)}
                  sessionCount={getSessionCount(client)} />
              ))}
            </div>
          )}
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

  // Refresh unread counts every 20 seconds
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => loadUnreadCounts(), 20000);
    return () => clearInterval(interval);
  }, [session, clients]);

  async function loadData() {
    setLoading(true);
    const [clientsResult, plansResult] = await Promise.all([getMyClients(), getMyPlans()]);
    const newClients = clientsResult.data || [];
    setClients(newClients);
    setPlans(plansResult.data || []);
    setLoading(false);
    // Load unread message counts per client
    loadUnreadCounts(newClients);
  }

  async function loadUnreadCounts(clientList) {
    const list = clientList || clients;
    if (!list.length) return;
    const counts = {};
    await Promise.all(list.map(async c => {
      const { data } = await getMessages(c.id);
      counts[c.id] = (data || []).filter(m => m.sender === "client" && !m.is_read).length;
    }));
    setUnreadCounts(counts);
  }

  async function handleAssignPlan(clientId, planId) {
    const { error } = await assignPlanToClient(clientId, planId);
    if (!error) {
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, assigned_program_id: planId } : c));
    }
  }

  if (!authChecked) return <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>Loading...</div>;
  if (!session) return <LoginScreen onLogin={() => getCoachSession().then(setSession)} />;

  return (
    <div style={{ ...F, background: "#f7f6f3", minHeight: "100vh", maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ background: "#111", color: "#f7f6f3", padding: "20px 18px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "3px" }}>Tara Mattimiro Fitness</div>
            <h1 style={{ margin: "0 0 2px", fontSize: "21px", fontWeight: "normal" }}>Coach Dashboard</h1>
            <div style={{ fontSize: "11px", color: "#444" }}>
              {clients.length} client{clients.length !== 1 ? "s" : ""}
              {Object.values(unreadCounts).reduce((s, n) => s + n, 0) > 0 && (
                <span style={{ color: "#a02020", marginLeft: "8px", fontWeight: "600" }}>
                  {Object.values(unreadCounts).reduce((s, n) => s + n, 0)} unread
                </span>
              )}
            </div>
          </div>
          <button onClick={signOutCoach} style={{ background: "none", border: "1px solid #333", color: "#666", borderRadius: "20px", padding: "5px 12px", fontSize: "11px", cursor: "pointer", ...F }}>
            Sign out
          </button>
        </div>
        <div style={{ display: "flex", gap: "3px" }}>
          {[["clients","Clients"],["groups","Groups"],["library","Program Library"],["videos","Videos"],["plans","Plan Builder"]].map(([v, label]) => (
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
          onDelete={(clientId) => {
            setClients(prev => prev.filter(c => c.id !== clientId));
            setSelectedClient(null);
          }}
          onAssignPlan={handleAssignPlan}
        />
      ) : view === "clients" ? (
        <ClientListView
          clients={clients}
          loading={loading}
          unreadCounts={unreadCounts}
          onSelect={setSelectedClient}
          onNewClient={() => setShowCreateClient(true)}
        />
      ) : view === "library" ? (
        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          <ProgramLibrary coachId={session.user.id} />
        </div>
      ) : view === "groups" ? (
        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          <GroupProgramming coachId={session.user.id} allClients={clients} />
        </div>
      ) : view === "videos" ? (
        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          <VideoLibrary coachId={session.user.id} />
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
