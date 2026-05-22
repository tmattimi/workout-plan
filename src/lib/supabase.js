import { createClient } from '@supabase/supabase-js';

// These come from your Vercel environment variables.
// In local dev, create a .env file with these values.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars not set — running in offline/local mode');
}

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ── AUTH (coach) ───────────────────────────────────────────────────────────────
export async function signInCoach(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signOutCoach() {
  return supabase.auth.signOut();
}

export async function getCoachSession() {
  const { data } = await supabase.auth.getSession();
  return data?.session;
}

// Send invite email via our serverless API function
// This keeps the Supabase service role key secret on the server
export async function inviteClient(clientId, email, clientName) {
  if (!supabase) return { error: { message: "Supabase not initialized" } };

  // Step 1: Create auth account with a random password
  // Supabase will send a confirmation email automatically
  const tempPassword = Math.random().toString(36).slice(2, 10) + 
                       Math.random().toString(36).slice(2, 6).toUpperCase() + "1!";

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password: tempPassword,
    options: {
      emailRedirectTo: window.location.origin + "/",
      data: { name: clientName, role: "client", client_id: clientId }
    }
  });

  if (signUpError) return { error: signUpError };
  if (!signUpData?.user) return { error: { message: "Failed to create account" } };

  // Step 2: Update client record with email and auth_user_id
  // Do these separately so if the auth_user_id link fails, email still saves
  await supabase.from("clients").update({ email }).eq("id", clientId);
  
  const { error: linkError } = await supabase
    .from("clients")
    .update({ auth_user_id: signUpData.user.id })
    .eq("id", clientId);

  if (linkError) {
    console.warn("Could not link auth user to client:", linkError.message);
    // Still return success — the email was sent
  }

  return { data: { userId: signUpData.user.id, emailSent: true } };
}

export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}

// ── CLIENT ACCESS (by token, no auth) ─────────────────────────────────────────
export async function getClientByToken(token) {
  if (!supabase) {
    console.warn("Supabase not initialized - check REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY env vars");
    return null;
  }
  if (!token) return null;
  const { data, error } = await supabase.rpc('get_client_by_token', { p_token: token });
  if (error) {
    console.error("getClientByToken error:", error.message);
    return null;
  }
  return data;
}

// ── COACH — CLIENT MANAGEMENT ─────────────────────────────────────────────────
export async function getMyClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createClient_db(clientData) {
  const { data, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single();
  return { data, error };
}

export async function deleteClient_db(clientId) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);
  return { error };
}

export async function updateClient_db(clientId, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', clientId)
    .select()
    .single();
  return { data, error };
}

// ── COACH — PLAN MANAGEMENT ───────────────────────────────────────────────────
export async function getMyPlans() {
  const { data, error } = await supabase
    .from('workout_plans')
    .select(`
      *,
      plan_days (
        *,
        plan_exercises (
          *,
          exercises (*)
        )
      )
    `)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createPlan(planData) {
  const { data, error } = await supabase
    .from('workout_plans')
    .insert(planData)
    .select()
    .single();
  return { data, error };
}

export async function updatePlan(planId, updates) {
  const { data, error } = await supabase
    .from('workout_plans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', planId)
    .select()
    .single();
  return { data, error };
}

export async function createPlanDay(dayData) {
  const { data, error } = await supabase
    .from('plan_days')
    .insert(dayData)
    .select()
    .single();
  return { data, error };
}

export async function updatePlanDay(dayId, updates) {
  const { data, error } = await supabase
    .from('plan_days')
    .update(updates)
    .eq('id', dayId)
    .select()
    .single();
  return { data, error };
}

export async function addExerciseToPlanDay(planDayId, exerciseId, config) {
  const { data, error } = await supabase
    .from('plan_exercises')
    .insert({ plan_day_id: planDayId, exercise_id: exerciseId, ...config })
    .select()
    .single();
  return { data, error };
}

export async function removePlanExercise(planExerciseId) {
  const { error } = await supabase
    .from('plan_exercises')
    .delete()
    .eq('id', planExerciseId);
  return { error };
}

export async function reorderPlanExercises(updates) {
  // updates: [{ id, sort_order }]
  const promises = updates.map(u =>
    supabase.from('plan_exercises').update({ sort_order: u.sort_order }).eq('id', u.id)
  );
  await Promise.all(promises);
}

export async function assignPlanToClient(clientId, planId) {
  // Deactivate existing assignment first
  await supabase
    .from('client_plan_assignments')
    .update({ is_active: false })
    .eq('client_id', clientId)
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('client_plan_assignments')
    .insert({ client_id: clientId, plan_id: planId, is_active: true })
    .select()
    .single();
  return { data, error };
}

// ── CLIENT — GET THEIR ACTIVE PLAN ────────────────────────────────────────────
export async function getClientActivePlan(clientId) {
  const { data: assignment } = await supabase
    .from('client_plan_assignments')
    .select('plan_id')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single();

  if (!assignment) return { data: null };

  const { data, error } = await supabase
    .from('workout_plans')
    .select(`
      *,
      plan_days (
        *,
        plan_exercises (
          *,
          exercises (*)
        )
      )
    `)
    .eq('id', assignment.plan_id)
    .single();

  return { data, error };
}

// ── WORKOUT LOGGING ───────────────────────────────────────────────────────────
export async function logSet(clientId, setData) {
  const { data, error } = await supabase
    .from('workout_logs')
    .insert({ client_id: clientId, ...setData })
    .select()
    .single();
  return { data, error };
}

export async function getSessionLogs(clientId, sessionDate) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*, exercises(name)')
    .eq('client_id', clientId)
    .eq('session_date', sessionDate);
  return { data: data || [], error };
}

export async function getClientLogs(clientId, limit = 200) {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, session_date, set_number, weight_lbs, reps, completed, is_pr, client_note, logged_at, exercises(name, primary_muscle)')
    .eq('client_id', clientId)
    .eq('completed', true)
    .order('session_date', { ascending: false })
    .order('logged_at', { ascending: true })
    .limit(limit);
  return { data: data || [], error };
}

// ── UPDATE LOG ENTRY ──────────────────────────────────────────────────────────
export async function updateLogNote(logId, note) {
  if (!supabase || !logId) return;
  await supabase.from('workout_logs').update({ client_note: note }).eq('id', logId);
}

// ── PERSONAL RECORDS ──────────────────────────────────────────────────────────
export async function upsertPR(clientId, exerciseId, weight, reps) {
  const { data, error } = await supabase
    .from('personal_records')
    .upsert({
      client_id: clientId,
      exercise_id: exerciseId,
      weight_lbs: weight,
      reps,
      achieved_at: new Date().toISOString().slice(0, 10)
    }, { onConflict: 'client_id,exercise_id' })
    .select()
    .single();
  return { data, error };
}

export async function getClientPRs(clientId) {
  const { data, error } = await supabase
    .from('personal_records')
    .select('*, exercises(name, primary_muscle)')
    .eq('client_id', clientId);
  return { data: data || [], error };
}

// Recalculate PRs from actual workout logs — source of truth
export async function recalculatePRsFromLogs(clientId) {
  if (!supabase) return;
  const { data: logs } = await supabase
    .from('workout_logs')
    .select('exercise_id, weight_lbs, reps, exercises(name, primary_muscle)')
    .eq('client_id', clientId)
    .eq('completed', true)
    .not('weight_lbs', 'is', null);

  if (!logs || logs.length === 0) return;

  // Find best weight (then most reps at that weight) per exercise
  const best = {};
  logs.forEach(log => {
    const id = log.exercise_id;
    const w = parseFloat(log.weight_lbs) || 0;
    const r = parseInt(log.reps) || 0;
    if (!best[id] || w > best[id].weight || (w === best[id].weight && r > best[id].reps)) {
      best[id] = { exercise_id: id, weight: w, reps: r, exercises: log.exercises };
    }
  });

  // Upsert each PR
  const upserts = Object.values(best).map(b =>
    supabase.from('personal_records').upsert({
      client_id: clientId,
      exercise_id: b.exercise_id,
      weight_lbs: b.weight,
      reps: b.reps,
      achieved_at: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'client_id,exercise_id' })
  );
  await Promise.all(upserts);
  return best;
}

// ── MEASUREMENTS ──────────────────────────────────────────────────────────────
export async function logMeasurement(clientId, measurementData) {
  const { data, error } = await supabase
    .from('measurements')
    .insert({ client_id: clientId, ...measurementData })
    .select()
    .single();
  return { data, error };
}

export async function getClientMeasurements(clientId) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('client_id', clientId)
    .order('measured_at', { ascending: true });
  return { data: data || [], error };
}

// ── COACH NOTES ───────────────────────────────────────────────────────────────
export async function getCoachNotes(clientId) {
  const { data, error } = await supabase
    .from('coach_notes')
    .select('*, exercises(name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createCoachNote(coachId, clientId, note, noteType = 'general', exerciseId = null) {
  const { data, error } = await supabase
    .from('coach_notes')
    .insert({ coach_id: coachId, client_id: clientId, note, note_type: noteType, exercise_id: exerciseId })
    .select()
    .single();
  return { data, error };
}

// ── CLIENT MESSAGES ───────────────────────────────────────────────────────────
export async function getMessages(clientId) {
  const { data, error } = await supabase
    .from('client_messages')
    .select('*, exercises(name)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  return { data: data || [], error };
}

export async function sendMessage(coachId, clientId, message, sender, exerciseId = null) {
  const { data, error } = await supabase
    .from('client_messages')
    .insert({ coach_id: coachId, client_id: clientId, message, sender, exercise_id: exerciseId })
    .select()
    .single();
  return { data, error };
}

export async function markMessagesRead(clientId, sender) {
  await supabase
    .from('client_messages')
    .update({ is_read: true })
    .eq('client_id', clientId)
    .eq('sender', sender)
    .eq('is_read', false);
}

// Realtime subscription for new messages
export function subscribeToMessages(clientId, callback) {
  return supabase
    .channel(`messages_${clientId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'client_messages',
      filter: `client_id=eq.${clientId}`
    }, payload => callback(payload.new))
    .subscribe();
}

// ── EXERCISE LIBRARY ──────────────────────────────────────────────────────────
export async function getAllExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .order('name');
  return { data: data || [], error };
}

export async function getAlternatives(exerciseName, equipment = [], injuryFlags = []) {
  let query = supabase
    .from('exercises')
    .select('*')
    .contains('alternative_for', [exerciseName])
    .eq('is_active', true);

  // Filter by available equipment if provided
  if (equipment.length > 0) {
    query = query.overlaps('equipment', equipment);
  }

  const { data, error } = await query;
  if (!data) return { data: [], error };

  // Filter out exercises that conflict with injury flags
  const safe = data.filter(ex => {
    if (!injuryFlags.length) return true;
    return !ex.injury_contraindications?.some(ic => injuryFlags.includes(ic));
  });

  return { data: safe, error };
}

export async function searchExercises(query, muscleGroup = null, equipment = [], injuryFlags = []) {
  let q = supabase
    .from('exercises')
    .select('*')
    .eq('is_active', true)
    .ilike('name', `%${query}%`);

  if (muscleGroup) q = q.eq('primary_muscle', muscleGroup);
  if (equipment.length) q = q.overlaps('equipment', equipment);

  const { data, error } = await q.order('name').limit(20);
  if (!data) return { data: [], error };

  const safe = injuryFlags.length
    ? data.filter(ex => !ex.injury_contraindications?.some(ic => injuryFlags.includes(ic)))
    : data;

  return { data: safe, error };
}

// ── CLIENT INTAKE ─────────────────────────────────────────────────────────────────
export async function getClientIntake(clientId) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('client_intake')
    .select('*')
    .eq('client_id', clientId)
    .single();
  return { data, error };
}

// ── WEEKLY CHECK-IN ───────────────────────────────────────────────────────────
export async function submitCheckin(clientId, checkinData) {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .upsert({ client_id: clientId, ...checkinData }, { onConflict: 'client_id,week_of' })
    .select()
    .single();
  return { data, error };
}

export async function getCheckins(clientId) {
  const { data, error } = await supabase
    .from('weekly_checkins')
    .select('*')
    .eq('client_id', clientId)
    .order('week_of', { ascending: false });
  return { data: data || [], error };
}

// ── ADDITIONAL ACTIVITIES ─────────────────────────────────────────────────────
export async function logActivity(clientId, activityData) {
  const { data, error } = await supabase
    .from('additional_activities')
    .insert({ client_id: clientId, ...activityData })
    .select()
    .single();
  return { data, error };
}

export async function getActivities(clientId, limit = 50) {
  const { data, error } = await supabase
    .from('additional_activities')
    .select('*')
    .eq('client_id', clientId)
    .order('activity_date', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

// ── COACH DASHBOARD DATA ───────────────────────────────────────────────────────
export async function getClientOverview(clientId) {
  const [logs, measurements, prs, checkins, messages] = await Promise.all([
    getClientLogs(clientId, 50),
    getClientMeasurements(clientId),
    getClientPRs(clientId),
    getCheckins(clientId),
    getMessages(clientId),
  ]);

  return {
    recentLogs: logs.data,
    measurements: measurements.data,
    prs: prs.data,
    checkins: checkins.data,
    messages: messages.data,
    unreadFromClient: messages.data.filter(m => m.sender === 'client' && !m.is_read).length,
  };
}

// ── Seed client data from intake form ────────────────────────────────────────
// Maps intake benchmark fields to exercise names in the exercises table
const INTAKE_EXERCISE_MAP = {
  bench_press_lbs:     "Dumbbell Bench Press",
  overhead_press_lbs:  "Seated Dumbbell Overhead Press",
  squat_lbs:           "Goblet Squat",
  hip_thrust_lbs:      "Hip Thrust (Barbell or Machine)",
  deadlift_lbs:        "Romanian Deadlift (Dumbbell)",
};

// Reps assumed for baseline strength entries (working rep counts, not 1RM)
const INTAKE_BASELINE_REPS = 5;
const INTAKE_PULLUP_REPS_KEY = "pullups_max"; // reps, no weight

export async function seedClientDataFromIntake(clientId, intake) {
  if (!supabase || !intake) return { errors: [] };

  const errors = [];
  const intakeDate = intake.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);

  // 1. Body measurements — log as a single entry on intake date
  const measurementFields = {
    weight_lbs:      intake.current_weight_lbs,
    waist_in:        intake.waist_in,
    hips_in:         intake.hips_in,
    chest_in:        intake.chest_in,
    right_arm_in:    intake.right_arm_in,
    left_arm_in:     intake.left_arm_in,
    right_thigh_in:  intake.right_thigh_in,
    left_thigh_in:   intake.left_thigh_in,
    body_fat_pct:    intake.body_fat_pct,
  };

  const hasMeasurements = Object.values(measurementFields).some(v => v != null && v !== "");
  if (hasMeasurements) {
    const { error: mErr } = await supabase
      .from('measurements')
      .insert({
        client_id: clientId,
        measured_at: intakeDate,
        ...Object.fromEntries(Object.entries(measurementFields).filter(([, v]) => v != null && v !== "")),
      });
    if (mErr) errors.push(`Measurements: ${mErr.message}`);
  }

  // 2. Baseline PRs — map exercise names → exercise IDs then upsert
  const { data: exercises } = await getAllExercises();
  const exByName = {};
  (exercises || []).forEach(ex => { exByName[ex.name.toLowerCase()] = ex; });

  const prUpserts = [];

  // Weighted benchmarks
  for (const [intakeKey, exerciseName] of Object.entries(INTAKE_EXERCISE_MAP)) {
    const weight = intake[intakeKey];
    if (!weight) continue;

    const ex = exByName[exerciseName.toLowerCase()];
    if (!ex) {
      errors.push(`Exercise not found in DB: ${exerciseName}`);
      continue;
    }

    prUpserts.push(
      supabase.from('personal_records').upsert({
        client_id: clientId,
        exercise_id: ex.id,
        weight_lbs: parseFloat(weight),
        reps: INTAKE_BASELINE_REPS,
        achieved_at: intakeDate,
        source: 'intake_baseline',
      }, { onConflict: 'client_id,exercise_id', ignoreDuplicates: false })
    );
  }

  // Pull-up max reps (bodyweight — log with weight 0)
  if (intake[INTAKE_PULLUP_REPS_KEY] != null) {
    const pullupEx = exByName["pull-up (or assisted pull-up)"];
    if (pullupEx) {
      prUpserts.push(
        supabase.from('personal_records').upsert({
          client_id: clientId,
          exercise_id: pullupEx.id,
          weight_lbs: 0,
          reps: parseInt(intake[INTAKE_PULLUP_REPS_KEY]),
          achieved_at: intakeDate,
          source: 'intake_baseline',
        }, { onConflict: 'client_id,exercise_id', ignoreDuplicates: false })
      );
    }
  }

  const prResults = await Promise.all(prUpserts);
  prResults.forEach(({ error }) => { if (error) errors.push(`PR: ${error.message}`); });

  // 3. Injury flags + equipment — update client record
  const clientUpdates = {};
  if (intake.injury_flags?.length) clientUpdates.injuries = intake.injury_flags;
  if (intake.equipment_available?.length) clientUpdates.equipment = intake.equipment_available;
  if (intake.primary_goal) clientUpdates.goal = intake.primary_goal;
  if (Object.keys(clientUpdates).length) {
    const { error: cErr } = await supabase
      .from('clients')
      .update({ ...clientUpdates, updated_at: new Date().toISOString() })
      .eq('id', clientId);
    if (cErr) errors.push(`Client update: ${cErr.message}`);
  }

  return { errors, intakeDate, hasMeasurements, prCount: prUpserts.length };
}

// ── NUTRITION ─────────────────────────────────────────────────────────────────
export async function logNutritionEntry(clientId, entry) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('nutrition_logs')
    .insert({ client_id: clientId, ...entry })
    .select().single();
  return { data, error };
}

export async function deleteNutritionEntry(entryId) {
  if (!supabase) return { error: null };
  return await supabase.from('nutrition_logs').delete().eq('id', entryId);
}

export async function getNutritionLogs(clientId, daysBack = 30) {
  if (!supabase) return { data: [] };
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('client_id', clientId)
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  return { data: data || [], error };
}

export async function upsertNutritionTargets(clientId, targets) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('nutrition_targets')
    .upsert({ client_id: clientId, ...targets }, { onConflict: 'client_id' })
    .select().single();
  return { data, error };
}

export async function getNutritionTargets(clientId) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*')
    .eq('client_id', clientId)
    .single();
  return { data, error };
}

// ── GOALS ─────────────────────────────────────────────────────────────────────
export async function saveGoal(clientId, goal) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('client_goals')
    .upsert({ client_id: clientId, ...goal }, { onConflict: 'id' })
    .select().single();
  return { data, error };
}

export async function deleteGoal(goalId) {
  if (!supabase) return { error: null };
  return await supabase.from('client_goals').delete().eq('id', goalId);
}

export async function getGoals(clientId) {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase
    .from('client_goals')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

// ── HEALTH LOGS ───────────────────────────────────────────────────────────────
export async function upsertHealthLog(clientId, logDate, healthData) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('client_health_logs')
    .upsert({ client_id: clientId, log_date: logDate, ...healthData }, { onConflict: 'client_id,log_date' })
    .select().single();
  return { data, error };
}

export async function getHealthLogs(clientId, daysBack = 14) {
  if (!supabase) return { data: [] };
  const since = new Date();
  since.setDate(since.getDate() - daysBack);
  const { data, error } = await supabase
    .from('client_health_logs')
    .select('*')
    .eq('client_id', clientId)
    .gte('log_date', since.toISOString().slice(0, 10))
    .order('log_date', { ascending: false });
  return { data: data || [], error };
}

// ── CYCLE TRACKING ────────────────────────────────────────────────────────────
export async function upsertCycleData(clientId, cycleData) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('cycle_data')
    .upsert({ client_id: clientId, ...cycleData }, { onConflict: 'client_id' })
    .select().single();
  return { data, error };
}

export async function getCycleData(clientId) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('cycle_data')
    .select('*')
    .eq('client_id', clientId)
    .single();
  return { data, error };
}

export async function upsertCycleSymptoms(clientId, logDate, symptoms) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('cycle_symptoms')
    .upsert({ client_id: clientId, log_date: logDate, symptoms }, { onConflict: 'client_id,log_date' })
    .select().single();
  return { data, error };
}

export async function getCycleSymptoms(clientId) {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase
    .from('cycle_symptoms')
    .select('*')
    .eq('client_id', clientId)
    .order('log_date', { ascending: false });
  return { data: data || [], error };
}

// ── MONTHLY INTENTIONS ────────────────────────────────────────────────────────
export async function upsertMonthlyIntentions(clientId, monthKey, intentionData) {
  if (!supabase) return { data: null };
  const { data, error } = await supabase
    .from('monthly_intentions')
    .upsert({ client_id: clientId, month_key: monthKey, ...intentionData }, { onConflict: 'client_id,month_key' })
    .select().single();
  return { data, error };
}

export async function getMonthlyIntentions(clientId) {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase
    .from('monthly_intentions')
    .select('*')
    .eq('client_id', clientId)
    .order('month_key', { ascending: false });
  return { data: data || [], error };
}

// ── PHOTO STORAGE ─────────────────────────────────────────────────────────────
export async function uploadPhoto(clientId, monthKey, poseId, base64DataUrl) {
  if (!supabase) return { url: null };
  // Convert base64 data URL to blob
  const arr = base64DataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  const blob = new Blob([u8arr], { type: mime });

  const path = `${clientId}/${monthKey}/${poseId}.jpg`;
  const { error } = await supabase.storage
    .from('progress-photos')
    .upload(path, blob, { upsert: true, contentType: mime });

  if (error) return { url: null, error };

  const { data } = supabase.storage.from('progress-photos').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function getPhotoUrls(clientId) {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase.storage
    .from('progress-photos')
    .list(`${clientId}`, { limit: 100 });
  return { data, error };
}

// ── BODY SCANS ────────────────────────────────────────────────────────────────
export async function saveBodyScan(clientId, scan) {
  if (!supabase) return { data: null };
  // Store extracted metrics in DB; image stays in localStorage (too large for DB)
  const { data, error } = await supabase
    .from('body_scans')
    .insert({ client_id: clientId, scan_date: scan.date, scan_type: scan.scan_type, metrics: scan.metrics })
    .select().single();
  return { data, error };
}

export async function getBodyScans(clientId) {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase
    .from('body_scans')
    .select('*')
    .eq('client_id', clientId)
    .order('scan_date', { ascending: false });
  return { data: data || [], error };
}

// ── COACH ANALYTICS ───────────────────────────────────────────────────────────

export async function getClientWorkoutAnalytics(clientId, days = 28) {
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const [logs, swaps, checkins] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('*, exercises(name, primary_muscle)')
      .eq('client_id', clientId)
      .eq('completed', true)
      .gte('session_date', since)
      .order('session_date', { ascending: false }),
    supabase
      .from('exercise_swaps')
      .select('*')
      .eq('client_id', clientId)
      .gte('swapped_at', new Date(Date.now() - days * 86400000).toISOString())
      .order('swapped_at', { ascending: false }),
    supabase
      .from('checkins')
      .select('*')
      .eq('client_id', clientId)
      .gte('checked_in_at', new Date(Date.now() - days * 86400000).toISOString())
      .order('checked_in_at', { ascending: false }),
  ]);

  const allLogs = logs.data || [];
  const allSwaps = swaps.data || [];
  const allCheckins = checkins.data || [];

  // Group logs by session date
  const byDate = {};
  allLogs.forEach(log => {
    const d = log.session_date;
    if (!byDate[d]) byDate[d] = { date: d, exercises: {}, totalSets: 0, totalVolume: 0, notes: log.session_note || '' };
    const exName = log.exercises?.name || log.exercise_id;
    if (!byDate[d].exercises[exName]) byDate[d].exercises[exName] = { name: exName, muscle: log.exercises?.primary_muscle, sets: [] };
    byDate[d].exercises[exName].sets.push({ weight: log.weight_lbs, reps: log.reps, rpe: log.rpe });
    byDate[d].totalSets++;
    if (log.weight_lbs && log.reps) byDate[d].totalVolume += (parseFloat(log.weight_lbs) * parseInt(log.reps));
  });

  const sessions = Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));

  // Attach swaps to sessions by date
  allSwaps.forEach(swap => {
    const d = swap.swapped_at?.slice(0, 10);
    if (d && byDate[d]) {
      if (!byDate[d].swaps) byDate[d].swaps = [];
      byDate[d].swaps.push(swap);
    }
  });

  // Week-by-week breakdown
  const weeks = {};
  sessions.forEach(s => {
    const date = new Date(s.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const wk = weekStart.toISOString().slice(0, 10);
    if (!weeks[wk]) weeks[wk] = { weekStart: wk, sessions: 0, totalVolume: 0, totalSets: 0, swapCount: 0 };
    weeks[wk].sessions++;
    weeks[wk].totalVolume += s.totalVolume;
    weeks[wk].totalSets += s.totalSets;
    weeks[wk].swapCount += (s.swaps?.length || 0);
  });

  const weeklyData = Object.values(weeks).sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  return {
    sessions,
    weeklyData,
    allSwaps,
    allCheckins,
    totalSessions: sessions.length,
    totalVolume: sessions.reduce((a, s) => a + s.totalVolume, 0),
    avgSessionsPerWeek: weeklyData.length ? (sessions.length / weeklyData.length).toFixed(1) : 0,
  };
}

export async function getRecentSwaps(clientId, limit = 20) {
  const { data, error } = await supabase
    .from('exercise_swaps')
    .select('*')
    .eq('client_id', clientId)
    .order('swapped_at', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
}

// ── PROGRESS PHOTOS ───────────────────────────────────────────────────────────

export async function uploadProgressPhoto(clientId, file, tag = 'front') {
  const ext = file.name.split('.').pop();
  const path = `${clientId}/${Date.now()}_${tag}.${ext}`;
  const { data, error } = await supabase.storage
    .from('progress-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) return { data: null, error };

  // Save record to DB
  const { data: record, error: dbErr } = await supabase
    .from('progress_photos')
    .insert({ client_id: clientId, storage_path: path, tag, taken_at: new Date().toISOString().slice(0, 10) })
    .select().single();

  return { data: record, error: dbErr };
}

export async function getProgressPhotos(clientId) {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('taken_at', { ascending: false });
  if (!data || data.length === 0) return { data: [], error };

  // Get signed URLs for each photo
  const withUrls = await Promise.all(data.map(async photo => {
    const { data: urlData } = await supabase.storage
      .from('progress-photos')
      .createSignedUrl(photo.storage_path, 3600);
    return { ...photo, url: urlData?.signedUrl || null };
  }));

  return { data: withUrls, error };
}

export async function deleteProgressPhoto(photo) {
  await supabase.storage.from('progress-photos').remove([photo.storage_path]);
  await supabase.from('progress_photos').delete().eq('id', photo.id);
}
