// ── MUSCLE-WEIGHTED EXERCISE COEFFICIENTS ────────────────────────────────────
// Based on EMG research and biomechanical analysis.
// Each exercise maps to muscle group contributions (must sum to 1.0).
// Groups: quads, hamstrings, glutes, chest, back, shoulders, biceps, triceps, core, calves

export const MUSCLE_GROUPS = {
  quads:       { label: 'Quadriceps',   color: '#d97706', light: '#fef9c3' },
  hamstrings:  { label: 'Hamstrings',   color: '#b45309', light: '#fef3c7' },
  glutes:      { label: 'Glutes',       color: '#b91c1c', light: '#fee2e2' },
  chest:       { label: 'Chest',        color: '#2563a8', light: '#dbeafe' },
  back:        { label: 'Back',         color: '#16a34a', light: '#dcfce7' },
  shoulders:   { label: 'Shoulders',    color: '#7c3aed', light: '#ede9fe' },
  biceps:      { label: 'Biceps',       color: '#0d9488', light: '#ccfbf1' },
  triceps:     { label: 'Triceps',      color: '#1d4ed8', light: '#dbeafe' },
  core:        { label: 'Core',         color: '#059669', light: '#d1fae5' },
  calves:      { label: 'Calves',       color: '#c2410c', light: '#ffedd5' },
};

// Dominance ratios — evidence-based healthy ranges
// ratio = groupA_score / groupB_score
export const BALANCE_BENCHMARKS = [
  {
    id: 'ham_quad',
    label: 'Hamstring : Quad',
    groupA: 'hamstrings',
    groupB: 'quads',
    healthyMin: 0.50,
    healthyMax: 0.80,
    lowWarning: 'Quad dominant — higher ACL and patellar tendon injury risk. Add RDLs and leg curls.',
    highWarning: 'Hamstring dominant — consider adding more quad-focused work.',
    balanced: 'Good posterior/anterior balance.',
  },
  {
    id: 'pull_push',
    label: 'Pull : Push',
    groupA: 'back',
    groupB: 'chest',
    healthyMin: 1.0,
    healthyMax: 1.5,
    lowWarning: 'Push dominant — common cause of shoulder impingement. Add more rows and pull-ups.',
    highWarning: 'Slightly pull dominant — monitor for balanced pressing volume.',
    balanced: 'Good push/pull balance.',
  },
  {
    id: 'glute_quad',
    label: 'Glute : Quad',
    groupA: 'glutes',
    groupB: 'quads',
    healthyMin: 0.60,
    healthyMax: 1.20,
    lowWarning: 'Quad dominant relative to glutes — add hip thrusts and Romanian deadlifts.',
    highWarning: 'Glute dominant — generally positive but ensure adequate quad volume.',
    balanced: 'Good glute activation relative to quad dominance.',
  },
];

// Exercise coefficients — primary muscle group contributions
// Format: { exercise_name_lowercase: { muscle_group: coefficient } }
export const EXERCISE_WEIGHTS = {
  // ── CHEST
  'barbell bench press':        { chest: 0.65, shoulders: 0.20, triceps: 0.15 },
  'dumbbell bench press':       { chest: 0.68, shoulders: 0.18, triceps: 0.14 },
  'incline barbell press':      { chest: 0.55, shoulders: 0.30, triceps: 0.15 },
  'incline dumbbell press':     { chest: 0.58, shoulders: 0.28, triceps: 0.14 },
  'dumbbell fly':               { chest: 0.82, shoulders: 0.12, triceps: 0.06 },
  'flat dumbbell fly':          { chest: 0.82, shoulders: 0.12, triceps: 0.06 },
  'cable fly':                  { chest: 0.80, shoulders: 0.14, triceps: 0.06 },
  'cable crossover':            { chest: 0.80, shoulders: 0.14, triceps: 0.06 },
  'push-up':                    { chest: 0.60, shoulders: 0.22, triceps: 0.18 },
  'chest press':                { chest: 0.65, shoulders: 0.20, triceps: 0.15 },
  'chest press machine':        { chest: 0.65, shoulders: 0.20, triceps: 0.15 },

  // ── BACK
  'pull-up':                    { back: 0.70, biceps: 0.22, core: 0.08 },
  'chin-up':                    { back: 0.60, biceps: 0.32, core: 0.08 },
  'lat pulldown':               { back: 0.70, biceps: 0.22, core: 0.08 },
  'seated cable row':           { back: 0.65, biceps: 0.20, core: 0.15 },
  'barbell row':                { back: 0.62, biceps: 0.18, core: 0.20 },
  'dumbbell row':               { back: 0.66, biceps: 0.22, core: 0.12 },
  'single-arm dumbbell row':    { back: 0.66, biceps: 0.22, core: 0.12 },
  'chest-supported row':        { back: 0.72, biceps: 0.22, core: 0.06 },
  'face pull':                  { back: 0.40, shoulders: 0.50, biceps: 0.10 },
  'straight-arm pulldown':      { back: 0.80, triceps: 0.12, core: 0.08 },
  'deadlift':                   { back: 0.30, hamstrings: 0.30, glutes: 0.25, quads: 0.10, core: 0.05 },
  'conventional deadlift':      { back: 0.30, hamstrings: 0.30, glutes: 0.25, quads: 0.10, core: 0.05 },
  'sumo deadlift':              { back: 0.20, hamstrings: 0.25, glutes: 0.35, quads: 0.15, core: 0.05 },

  // ── SHOULDERS
  'overhead press':             { shoulders: 0.60, triceps: 0.28, core: 0.12 },
  'barbell overhead press':     { shoulders: 0.60, triceps: 0.28, core: 0.12 },
  'dumbbell overhead press':    { shoulders: 0.62, triceps: 0.26, core: 0.12 },
  'seated dumbbell press':      { shoulders: 0.62, triceps: 0.28, core: 0.10 },
  'lateral raise':              { shoulders: 0.88, back: 0.08, core: 0.04 },
  'dumbbell lateral raise':     { shoulders: 0.88, back: 0.08, core: 0.04 },
  'cable lateral raise':        { shoulders: 0.88, back: 0.08, core: 0.04 },
  'rear delt fly':              { shoulders: 0.75, back: 0.20, biceps: 0.05 },
  'reverse pec deck':           { shoulders: 0.75, back: 0.20, biceps: 0.05 },
  'arnold press':               { shoulders: 0.65, triceps: 0.25, core: 0.10 },

  // ── BICEPS
  'barbell curl':               { biceps: 0.80, shoulders: 0.10, core: 0.10 },
  'dumbbell curl':              { biceps: 0.80, shoulders: 0.10, core: 0.10 },
  'alternating dumbbell curl':  { biceps: 0.80, shoulders: 0.10, core: 0.10 },
  'incline dumbbell curl':      { biceps: 0.85, shoulders: 0.10, core: 0.05 },
  'preacher curl':              { biceps: 0.88, shoulders: 0.07, core: 0.05 },
  'hammer curl':                { biceps: 0.75, back: 0.15, core: 0.10 },
  'cable curl':                 { biceps: 0.82, shoulders: 0.12, core: 0.06 },
  'concentration curl':         { biceps: 0.90, shoulders: 0.06, core: 0.04 },

  // ── TRICEPS
  'tricep pushdown':            { triceps: 0.85, shoulders: 0.10, core: 0.05 },
  'rope pushdown':              { triceps: 0.85, shoulders: 0.10, core: 0.05 },
  'overhead tricep extension':  { triceps: 0.85, shoulders: 0.10, core: 0.05 },
  'skull crusher':              { triceps: 0.82, shoulders: 0.12, core: 0.06 },
  'close-grip bench press':     { triceps: 0.55, chest: 0.32, shoulders: 0.13 },
  'dips':                       { triceps: 0.45, chest: 0.38, shoulders: 0.17 },
  'tricep dips':                { triceps: 0.45, chest: 0.38, shoulders: 0.17 },

  // ── QUADS
  'squat':                      { quads: 0.50, glutes: 0.30, hamstrings: 0.12, core: 0.08 },
  'barbell squat':              { quads: 0.50, glutes: 0.30, hamstrings: 0.12, core: 0.08 },
  'back squat':                 { quads: 0.50, glutes: 0.30, hamstrings: 0.12, core: 0.08 },
  'front squat':                { quads: 0.60, glutes: 0.22, hamstrings: 0.10, core: 0.08 },
  'goblet squat':               { quads: 0.52, glutes: 0.30, hamstrings: 0.10, core: 0.08 },
  'leg press':                  { quads: 0.55, glutes: 0.30, hamstrings: 0.15 },
  'leg extension':              { quads: 0.95, core: 0.05 },
  'hack squat':                 { quads: 0.58, glutes: 0.28, hamstrings: 0.14 },
  'bulgarian split squat':      { quads: 0.45, glutes: 0.38, hamstrings: 0.12, core: 0.05 },
  'split squat':                { quads: 0.45, glutes: 0.38, hamstrings: 0.12, core: 0.05 },
  'lunge':                      { quads: 0.45, glutes: 0.38, hamstrings: 0.12, core: 0.05 },
  'reverse lunge':              { quads: 0.42, glutes: 0.40, hamstrings: 0.12, core: 0.06 },
  'step-up':                    { quads: 0.42, glutes: 0.40, hamstrings: 0.12, core: 0.06 },

  // ── HAMSTRINGS / GLUTES
  'romanian deadlift':          { hamstrings: 0.60, glutes: 0.28, back: 0.07, core: 0.05 },
  'rdl':                        { hamstrings: 0.60, glutes: 0.28, back: 0.07, core: 0.05 },
  'stiff-leg deadlift':         { hamstrings: 0.62, glutes: 0.26, back: 0.07, core: 0.05 },
  'lying leg curl':             { hamstrings: 0.88, glutes: 0.07, calves: 0.05 },
  'seated leg curl':            { hamstrings: 0.88, glutes: 0.07, calves: 0.05 },
  'hamstring curl':             { hamstrings: 0.88, glutes: 0.07, calves: 0.05 },
  'leg curl':                   { hamstrings: 0.88, glutes: 0.07, calves: 0.05 },
  'nordic hamstring curl':      { hamstrings: 0.90, glutes: 0.07, core: 0.03 },
  'good morning':               { hamstrings: 0.50, glutes: 0.30, back: 0.15, core: 0.05 },
  'hip thrust':                 { glutes: 0.72, hamstrings: 0.18, quads: 0.07, core: 0.03 },
  'barbell hip thrust':         { glutes: 0.72, hamstrings: 0.18, quads: 0.07, core: 0.03 },
  'single-leg hip thrust':      { glutes: 0.76, hamstrings: 0.16, quads: 0.05, core: 0.03 },
  'glute bridge':               { glutes: 0.70, hamstrings: 0.20, core: 0.10 },
  'cable pull-through':         { glutes: 0.65, hamstrings: 0.25, back: 0.05, core: 0.05 },
  'clamshell':                  { glutes: 0.90, core: 0.10 },

  // ── CALVES
  'standing calf raise':        { calves: 0.90, core: 0.10 },
  'seated calf raise':          { calves: 0.90, core: 0.10 },
  'calf raise':                 { calves: 0.90, core: 0.10 },
  'donkey calf raise':          { calves: 0.90, core: 0.10 },

  // ── CORE
  'plank':                      { core: 0.85, shoulders: 0.10, back: 0.05 },
  'dead bug':                   { core: 0.90, shoulders: 0.05, back: 0.05 },
  'pallof press':               { core: 0.85, shoulders: 0.10, back: 0.05 },
  'cable crunch':               { core: 0.90, back: 0.05, shoulders: 0.05 },
  'ab wheel rollout':           { core: 0.80, shoulders: 0.12, back: 0.08 },
  'hanging leg raise':          { core: 0.82, back: 0.10, shoulders: 0.08 },
  'side plank':                 { core: 0.88, shoulders: 0.08, back: 0.04 },
  'russian twist':              { core: 0.88, shoulders: 0.07, back: 0.05 },
};

// Fuzzy match an exercise name to our coefficient table
export function getExerciseWeights(exerciseName) {
  const normalized = exerciseName.toLowerCase().trim();
  // Exact match
  if (EXERCISE_WEIGHTS[normalized]) return EXERCISE_WEIGHTS[normalized];
  // Partial match — find best overlap
  const keys = Object.keys(EXERCISE_WEIGHTS);
  for (const key of keys) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return EXERCISE_WEIGHTS[key];
    }
  }
  // Word-level partial match
  const words = normalized.split(/\s+/);
  let bestMatch = null;
  let bestScore = 0;
  for (const key of keys) {
    const keyWords = key.split(/\s+/);
    const overlap = words.filter(w => keyWords.includes(w)).length;
    const score = overlap / Math.max(words.length, keyWords.length);
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestMatch = key;
    }
  }
  return bestMatch ? EXERCISE_WEIGHTS[bestMatch] : null;
}

// Epley formula: estimated 1RM from weight × reps
export function epley1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Calculate muscle group strength scores from workout logs
// Returns { quads: { score, e1rm, exercises: [...] }, ... }
export function calculateMuscleScores(logs, bodyweightLbs = 170) {
  // logs: array of { exercise_name, weight_lbs, reps, session_date }
  // Use last 90 days only for rolling relevance
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const groupData = {};
  Object.keys(MUSCLE_GROUPS).forEach(g => {
    groupData[g] = { weightedE1RM: 0, totalWeight: 0, exercises: [] };
  });

  // Group logs by exercise, find best e1RM per exercise
  const byExercise = {};
  logs.forEach(log => {
    if (!log.weight_lbs || !log.reps) return;
    const date = new Date(log.session_date || log.achieved_at);
    if (date < cutoff) return;
    const name = (log.exercise_name || log.exercises?.name || '').toLowerCase();
    const e1rm = epley1RM(parseFloat(log.weight_lbs), parseInt(log.reps));
    if (!e1rm) return;
    if (!byExercise[name] || e1rm > byExercise[name].e1rm) {
      byExercise[name] = { name, e1rm, weight: parseFloat(log.weight_lbs), reps: parseInt(log.reps) };
    }
  });

  // Weight each exercise's e1RM by muscle group coefficients
  Object.values(byExercise).forEach(({ name, e1rm }) => {
    const weights = getExerciseWeights(name);
    if (!weights) return;
    Object.entries(weights).forEach(([group, coeff]) => {
      if (!groupData[group]) return;
      groupData[group].weightedE1RM += e1rm * coeff;
      groupData[group].totalWeight += coeff;
      groupData[group].exercises.push({ name, e1rm, coeff });
    });
  });

  // Normalize scores relative to bodyweight
  const scores = {};
  Object.entries(groupData).forEach(([group, data]) => {
    const rawScore = data.totalWeight > 0 ? data.weightedE1RM / data.totalWeight : 0;
    scores[group] = {
      score: rawScore,                                        // absolute lbs e1rm
      relative: bodyweightLbs > 0 ? rawScore / bodyweightLbs : 0, // relative to bodyweight
      exercises: data.exercises.sort((a, b) => b.e1rm - a.e1rm),
    };
  });

  return scores;
}

// Evaluate balance ratios
export function evaluateBalance(muscleScores) {
  return BALANCE_BENCHMARKS.map(bench => {
    const a = muscleScores[bench.groupA]?.score || 0;
    const b = muscleScores[bench.groupB]?.score || 0;
    const ratio = b > 0 ? a / b : null;
    let status = 'balanced';
    let message = bench.balanced;
    if (ratio !== null) {
      if (ratio < bench.healthyMin) { status = 'low'; message = bench.lowWarning; }
      else if (ratio > bench.healthyMax) { status = 'high'; message = bench.highWarning; }
    }
    return { ...bench, ratio, status, message };
  });
}

// Benchmark lifts for strength testing
export const BENCHMARK_LIFTS = [
  {
    id: 'bench_press',
    name: 'Bench Press',
    exerciseKey: 'barbell bench press',
    icon: '🏋️',
    primaryGroup: 'chest',
    instructions: [
      'Warm up with 2 sets: 50% of expected max for 10 reps, then 70% for 5 reps. Rest 3 minutes between warm-up sets.',
      'Load a weight you can lift for 3 to 6 reps with excellent form — retracted shoulder blades, controlled descent, full range of motion.',
      'Perform the set and immediately record the weight and exact number of reps completed.',
      'The app will calculate your estimated one-rep max using the Epley formula.',
    ],
    safetyNotes: 'Always use a spotter or safety bars when testing near maximum strength on the bench press.',
    cues: ['Shoulder blades retracted and depressed throughout', 'Feet flat on floor, slight arch in lower back', 'Bar touches mid-chest, not neck or stomach', 'Drive through the bar, not just push it away'],
  },
  {
    id: 'overhead_press',
    name: 'Overhead Press',
    exerciseKey: 'barbell overhead press',
    icon: '🤸',
    primaryGroup: 'shoulders',
    instructions: [
      'Warm up with 2 sets: 50% for 10 reps, then 70% for 5 reps. Rest 3 minutes.',
      'Load a weight you can press for 3 to 6 reps — standing, barbell from front rack position.',
      'No leg drive (strict press). Full lockout at the top, bar travels slightly behind head.',
      'Record weight and reps immediately after the set.',
    ],
    safetyNotes: 'Do not arch excessively through the lower back. Brace the core before every rep.',
    cues: ['Core braced, glutes squeezed before pressing', 'Bar starts at collarbone level', 'Press straight up — bar travels in a slight arc around the face', 'Full lockout — arms straight, bar over the base of the neck'],
  },
  {
    id: 'squat',
    name: 'Back Squat',
    exerciseKey: 'back squat',
    icon: '🏋️',
    primaryGroup: 'quads',
    instructions: [
      'Warm up with 2 sets: 50% for 8 reps, then 70% for 4 reps. Rest 3 to 4 minutes.',
      'Load a weight you can squat for 3 to 6 reps to parallel or below with control.',
      'Use a spotter or a squat rack with safety bars set just below parallel depth.',
      'Record weight and reps immediately after the set.',
    ],
    safetyNotes: 'Never squat near maximum without a rack with properly set safety bars or an experienced spotter.',
    cues: ['Bar resting on upper traps or rear delts (not neck)', 'Brace the core 360 degrees before descending', 'Knees tracking over toes throughout', 'Hip crease below the top of the knee at depth'],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    exerciseKey: 'conventional deadlift',
    icon: '💪',
    primaryGroup: 'hamstrings',
    instructions: [
      'Warm up with 2 sets: 50% for 6 reps, then 70% for 3 reps. Rest 3 to 4 minutes.',
      'Load a weight you can deadlift for 2 to 5 reps maintaining a neutral spine throughout.',
      'Do not round the lower back — if form breaks, the set is over regardless of reps completed.',
      'Record weight and reps immediately after the set.',
    ],
    safetyNotes: 'A rounded lower back under heavy load is the primary injury mechanism for deadlifts. Stop the set immediately if you cannot maintain position.',
    cues: ['Bar over mid-foot, hip-width stance', 'Hinge to the bar — do not squat down to it', 'Lat tension before breaking the floor — "protect your armpits"', 'Push the floor away, not pull the bar up'],
  },
  {
    id: 'hip_thrust',
    name: 'Hip Thrust',
    exerciseKey: 'barbell hip thrust',
    icon: '🔥',
    primaryGroup: 'glutes',
    instructions: [
      'Warm up with 2 sets: 50% for 10 reps, then 70% for 6 reps. Rest 3 minutes.',
      'Load a weight you can thrust for 3 to 8 reps — full hip extension at the top, no lumbar hyperextension.',
      'Use a padded barbell. Upper back resting on a bench, feet flat and hip-width apart.',
      'Record weight and reps immediately after the set.',
    ],
    safetyNotes: 'Do not hyperextend the lower back at the top — the glutes should be fully contracted, not the lumbar extensors.',
    cues: ['Upper back (not neck) resting on bench edge', 'Feet positioned so shins are vertical at the top', 'Drive through heels — toes can lift slightly', 'Squeeze glutes hard at the top — hold 1 second'],
  },
  {
    id: 'pull_up',
    name: 'Pull-Up',
    exerciseKey: 'pull-up',
    icon: '🧗',
    primaryGroup: 'back',
    instructions: [
      'Warm up with 2 easy sets of 3 to 5 reps with 3 minutes rest.',
      'Perform a set to clean failure — full hang at the bottom, chin clears the bar at the top.',
      'Record your bodyweight and the number of reps completed.',
      'For weighted pull-ups, add the additional weight to your bodyweight for the e1RM calculation.',
    ],
    safetyNotes: 'Full range of motion is required — dead hang at the bottom, chin over bar at the top. Partial reps do not count.',
    cues: ['Dead hang to start — full shoulder elevation', 'Initiate with scapular depression, not elbow flexion', 'Chest to bar, not just chin over bar ideally', 'Controlled descent — 2 seconds down'],
  },
];
