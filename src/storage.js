const KEYS = {
  workoutLogs: 'workout_logs_v1',
  measurements: 'body_measurements_v1',
  personalRecords: 'personal_records_v1',
  progressPhotos: 'progress_photos_v1',
  monthlyPrompt: 'monthly_prompt_v1',
};

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function loadWorkoutLogs() { return load(KEYS.workoutLogs) || {}; }
export function saveWorkoutLogs(data) { save(KEYS.workoutLogs, data); }

export function loadMeasurements() { return load(KEYS.measurements) || []; }
export function saveMeasurements(data) { save(KEYS.measurements, data); }

export function loadPRs() { return load(KEYS.personalRecords) || {}; }
export function savePRs(data) { save(KEYS.personalRecords, data); }

export function loadProgressPhotos() { return load(KEYS.progressPhotos) || []; }
export function saveProgressPhotos(data) { save(KEYS.progressPhotos, data); }

export function loadMonthlyPrompt() { return load(KEYS.monthlyPrompt) || {}; }
export function saveMonthlyPrompt(data) { save(KEYS.monthlyPrompt, data); }

export function today() { return new Date().toISOString().slice(0, 10); }
export function thisMonth() { return new Date().toISOString().slice(0, 7); }

export function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function formatShortDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
