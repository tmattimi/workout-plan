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
    .select('*, exercises(name, primary_muscle)')
    .eq('client_id', clientId)
    .eq('completed', true)
    .order('session_date', { ascending: false })
    .limit(limit);
  return { data: data || [], error };
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
