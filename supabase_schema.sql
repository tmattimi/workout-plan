-- ============================================================
-- WORKOUT APP — SUPABASE SCHEMA
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── COACHES ──────────────────────────────────────────────────
-- One row per coach (you). auth.users handles login.
create table coaches (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- ── CLIENTS ──────────────────────────────────────────────────
create table clients (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  access_token text unique default encode(gen_random_bytes(16), 'hex'), -- unique URL token
  is_active boolean default true,
  -- Profile
  height_in numeric,
  current_weight_lbs numeric,
  goal_weight_lbs numeric,
  goal text, -- 'recomp' | 'fat_loss' | 'muscle_gain' | 'strength'
  sex text default 'male', -- 'male' | 'female'
  date_of_birth date,
  -- Settings
  weekly_frequency integer default 6,
  equipment text[] default array['barbell','dumbbell','cable','machine','bodyweight'],
  injury_flags text[] default array[]::text[], -- e.g. ['shoulder','knee','lower_back']
  notes text, -- coach intake notes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── EXERCISE LIBRARY ─────────────────────────────────────────
create table exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  primary_muscle text not null,  -- 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core'
  primary_region text,           -- e.g. 'Gluteus Maximus'
  secondary_muscles text[] default array[]::text[],
  category text not null,        -- 'Compound Bilateral' | 'Compound Unilateral' | 'Isolation Bilateral' | 'Isolation Unilateral' | 'Core Stage 1' etc
  equipment text[] not null,     -- ['dumbbell'] or ['barbell','dumbbell'] etc
  movement_pattern text,         -- 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'isolation'
  difficulty text default 'beginner', -- 'beginner' | 'intermediate' | 'advanced'
  injury_contraindications text[] default array[]::text[], -- ['shoulder','knee'] etc
  -- Form and cues stored as JSON
  form_cues jsonb default '[]',
  why text,
  video_url text,
  -- For alternative mapping
  alternative_for text[] default array[]::text[], -- exercise names this can sub for
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── WORKOUT PLANS ────────────────────────────────────────────
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references coaches(id) on delete cascade not null,
  name text not null,
  description text,
  split_type text default 'PPL', -- 'PPL' | 'Upper/Lower' | 'Full Body' | 'Custom'
  frequency integer default 6,
  is_template boolean default false, -- coach can save plans as reusable templates
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PLAN DAYS ─────────────────────────────────────────────────
create table plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references workout_plans(id) on delete cascade not null,
  day_of_week text not null, -- 'MON' | 'TUE' | 'WED' etc
  label text not null,       -- 'Push A' | 'Pull A' etc
  focus text,                -- 'Push A — Chest Focus'
  session_type text,         -- 'push' | 'pull' | 'legs' | 'rest'
  muscles text[] default array[]::text[],
  session_note text,
  cardio_protocol jsonb,     -- { name, protocol, zone, feel }
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- ── PLAN EXERCISES ────────────────────────────────────────────
create table plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid references plan_days(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  sort_order integer default 0,
  sets integer not null,
  rep_range text not null,   -- '6–10' | '12–15' etc
  rest_seconds integer,      -- 120 = 2 min
  eccentric text,            -- '3s down'
  notes text,                -- coach notes for this exercise in this plan
  is_unilateral boolean default false,
  imbalance_note text,
  created_at timestamptz default now()
);

-- ── CLIENT PLAN ASSIGNMENTS ───────────────────────────────────
create table client_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  plan_id uuid references workout_plans(id) not null,
  started_at date default current_date,
  ends_at date,              -- null = ongoing
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── WORKOUT LOGS ──────────────────────────────────────────────
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  plan_day_id uuid references plan_days(id),
  plan_exercise_id uuid references plan_exercises(id),
  exercise_id uuid references exercises(id) not null,
  session_date date not null default current_date,
  set_number integer not null,
  weight_lbs numeric,
  reps integer,
  completed boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- ── PERSONAL RECORDS ─────────────────────────────────────────
create table personal_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  exercise_id uuid references exercises(id) not null,
  weight_lbs numeric not null,
  reps integer not null,
  achieved_at date not null default current_date,
  created_at timestamptz default now(),
  unique(client_id, exercise_id) -- one PR per exercise per client (upserted)
);

-- ── MEASUREMENTS ─────────────────────────────────────────────
create table measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  measured_at date not null default current_date,
  weight_lbs numeric,
  waist_in numeric,
  chest_in numeric,
  hips_in numeric,
  right_thigh_in numeric,
  left_thigh_in numeric,
  right_arm_in numeric,
  left_arm_in numeric,
  body_fat_pct numeric,
  notes text,
  created_at timestamptz default now()
);

-- ── PROGRESS PHOTOS ──────────────────────────────────────────
-- Photos stored in Supabase Storage, only metadata here
create table progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  taken_at date not null default current_date,
  storage_path text not null, -- path in Supabase Storage bucket
  angle text,                 -- 'front' | 'side' | 'back'
  notes text,
  created_at timestamptz default now()
);

-- ── COACH NOTES ───────────────────────────────────────────────
create table coach_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  coach_id uuid references coaches(id) not null,
  note text not null,
  note_type text default 'general', -- 'general' | 'exercise' | 'nutrition' | 'motivation'
  exercise_id uuid references exercises(id), -- if note is about a specific exercise
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── CLIENT MESSAGES (Q&A) ─────────────────────────────────────
create table client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  coach_id uuid references coaches(id) not null,
  sender text not null,      -- 'client' | 'coach'
  message text not null,
  exercise_id uuid references exercises(id), -- optional — links to a specific exercise
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ── WEEKLY CHECK-INS ──────────────────────────────────────────
create table weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  week_of date not null,     -- Monday of that week
  sessions_completed integer,
  energy_level integer,      -- 1-5
  soreness_level integer,    -- 1-5
  sleep_quality integer,     -- 1-5
  nutrition_adherence integer, -- 1-5
  notes text,
  goals_for_next_week text,
  created_at timestamptz default now()
);

-- ── SKILL GOALS ───────────────────────────────────────────────
-- For things like "achieve first pull-up"
create table skill_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  skill text not null,       -- 'pull_up' | 'pushup_50' | 'splits' etc
  target_value numeric,      -- e.g. 1 (one unassisted pull-up)
  current_value numeric default 0,
  achieved boolean default false,
  achieved_at date,
  created_at timestamptz default now()
);

-- ── ADDITIONAL ACTIVITIES ─────────────────────────────────────
create table additional_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade not null,
  activity_date date not null default current_date,
  activity_type text not null, -- 'walk' | 'run' | 'swim' | 'sport' | 'yoga' | 'other'
  description text,
  duration_minutes integer,
  distance_miles numeric,
  steps integer,
  calories_burned integer,
  notes text,
  created_at timestamptz default now()
);

-- ── INDEXES ───────────────────────────────────────────────────
create index idx_workout_logs_client_date on workout_logs(client_id, session_date);
create index idx_workout_logs_exercise on workout_logs(exercise_id);
create index idx_measurements_client on measurements(client_id, measured_at);
create index idx_coach_notes_client on coach_notes(client_id);
create index idx_client_messages_client on client_messages(client_id, created_at);
create index idx_clients_token on clients(access_token);
create index idx_clients_coach on clients(coach_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
alter table coaches enable row level security;
alter table clients enable row level security;
alter table workout_plans enable row level security;
alter table plan_days enable row level security;
alter table plan_exercises enable row level security;
alter table client_plan_assignments enable row level security;
alter table workout_logs enable row level security;
alter table personal_records enable row level security;
alter table measurements enable row level security;
alter table progress_photos enable row level security;
alter table coach_notes enable row level security;
alter table client_messages enable row level security;
alter table weekly_checkins enable row level security;
alter table exercises enable row level security;
alter table skill_goals enable row level security;
alter table additional_activities enable row level security;

-- Coaches can see their own data
create policy "coaches_own" on coaches for all using (auth.uid() = id);

-- Coaches can manage their clients
create policy "coaches_manage_clients" on clients for all
  using (coach_id = auth.uid());

-- Allow client access via token (used by client app — no auth required)
-- We handle this via a server function that validates the token
create policy "clients_read_own" on clients for select
  using (true); -- further restricted in API layer by token validation

-- Coaches manage their plans
create policy "coaches_manage_plans" on workout_plans for all
  using (coach_id = auth.uid());

create policy "plan_days_via_plan" on plan_days for all
  using (plan_id in (select id from workout_plans where coach_id = auth.uid()));

create policy "plan_exercises_via_plan" on plan_exercises for all
  using (plan_day_id in (
    select pd.id from plan_days pd
    join workout_plans wp on wp.id = pd.plan_id
    where wp.coach_id = auth.uid()
  ));

-- Exercises: coaches can manage, everyone can read
create policy "exercises_read_all" on exercises for select using (true);
create policy "exercises_coach_write" on exercises for insert with check (true);
create policy "exercises_coach_update" on exercises for update using (true);

-- All client data tables: coach can read their clients' data
create policy "coach_read_client_logs" on workout_logs for all
  using (client_id in (select id from clients where coach_id = auth.uid()));

create policy "coach_read_client_prs" on personal_records for all
  using (client_id in (select id from clients where coach_id = auth.uid()));

create policy "coach_read_measurements" on measurements for all
  using (client_id in (select id from clients where coach_id = auth.uid()));

create policy "coach_manage_notes" on coach_notes for all
  using (coach_id = auth.uid());

create policy "coach_manage_messages" on client_messages for all
  using (coach_id = auth.uid());

create policy "coach_read_checkins" on weekly_checkins for all
  using (client_id in (select id from clients where coach_id = auth.uid()));

create policy "coach_read_activities" on additional_activities for all
  using (client_id in (select id from clients where coach_id = auth.uid()));

-- ── STORAGE BUCKET ────────────────────────────────────────────
-- Run this separately in Supabase Storage settings:
-- Create a bucket called "progress-photos" set to private
-- Coaches can read/write, clients write via signed upload URLs

-- ── HELPER FUNCTION — validate client token ───────────────────
-- Called from the app to get client data by token (no auth required)
create or replace function get_client_by_token(p_token text)
returns json language plpgsql security definer as $$
declare
  v_client json;
begin
  select row_to_json(c) into v_client
  from clients c
  where c.access_token = p_token and c.is_active = true;
  return v_client;
end;
$$;

-- ── SEED EXERCISE LIBRARY ─────────────────────────────────────
-- Core exercises with equipment tags and injury contraindications
insert into exercises (name, primary_muscle, primary_region, secondary_muscles, category, equipment, movement_pattern, difficulty, injury_contraindications, why) values

-- CHEST
('Dumbbell Bench Press', 'chest', 'Sternal Head', array['shoulders','triceps'], 'Compound Bilateral', array['dumbbell','bench'], 'push', 'beginner', array['shoulder'], 'Each side works independently — the right cannot compensate for the left. Better for asymmetry correction than barbell.'),
('Barbell Bench Press', 'chest', 'Sternal Head', array['shoulders','triceps'], 'Compound Bilateral', array['barbell','bench'], 'push', 'beginner', array['shoulder','wrist'], 'Primary chest compound. Allows the most loading but both sides share the bar.'),
('Incline Dumbbell Press', 'chest', 'Clavicular Head', array['shoulders','triceps'], 'Compound Bilateral', array['dumbbell','bench'], 'push', 'beginner', array['shoulder'], 'Upper chest emphasis. The incline shifts load to the clavicular head.'),
('Incline Barbell Press', 'chest', 'Clavicular Head', array['shoulders','triceps'], 'Compound Bilateral', array['barbell','bench'], 'push', 'beginner', array['shoulder'], 'Upper chest compound with higher loading potential.'),
('Push-Up', 'chest', 'Sternal Head', array['shoulders','triceps','core'], 'Compound Bilateral', array['bodyweight'], 'push', 'beginner', array[]::text[], 'Bodyweight chest compound. Scales with elevation and tempo.'),
('Cable Fly (Low-to-High)', 'chest', 'Clavicular Head', array[]::text[], 'Isolation Bilateral', array['cable'], 'isolation', 'beginner', array['shoulder'], 'Constant cable tension through the full arc — superior to dumbbell fly at peak contraction.'),
('Dumbbell Fly', 'chest', 'Sternal Head', array[]::text[], 'Isolation Bilateral', array['dumbbell','bench'], 'isolation', 'beginner', array['shoulder'], 'Chest isolation. Cable version is preferred for constant tension.'),
('Pec Deck / Machine Fly', 'chest', 'Sternal Head', array[]::text[], 'Isolation Bilateral', array['machine'], 'isolation', 'beginner', array['shoulder'], 'Machine chest isolation. Good for beginners learning the fly pattern.'),
('Single-Arm Cable Fly', 'chest', 'Clavicular Head', array[]::text[], 'Isolation Unilateral', array['cable'], 'isolation', 'beginner', array['shoulder'], 'Unilateral cable fly — each pec works alone.'),

-- BACK
('Lat Pulldown (Wide Overhand)', 'back', 'Latissimus Dorsi', array['biceps'], 'Compound Bilateral', array['cable','machine'], 'pull', 'beginner', array['shoulder'], 'Primary lat compound. Wide grip builds lat width.'),
('Pull-Up', 'back', 'Latissimus Dorsi', array['biceps'], 'Compound Bilateral', array['bodyweight','pull_up_bar'], 'pull', 'advanced', array['shoulder','elbow'], 'The best lat builder. Key weekly progress marker.'),
('Assisted Pull-Up', 'back', 'Latissimus Dorsi', array['biceps'], 'Compound Bilateral', array['machine'], 'pull', 'beginner', array['shoulder'], 'Pull-up with weight assistance. Progress by reducing assistance.'),
('Seated Cable Row (Neutral Grip)', 'back', 'Rhomboids', array['biceps'], 'Compound Bilateral', array['cable'], 'pull', 'beginner', array['lower_back'], 'Mid-back thickness. Neutral grip allows heavier loading.'),
('Barbell Row', 'back', 'Latissimus Dorsi', array['biceps'], 'Compound Bilateral', array['barbell'], 'pull', 'intermediate', array['lower_back'], 'Heavy bilateral back compound. High lower back demand.'),
('Single-Arm Dumbbell Row', 'back', 'Latissimus Dorsi', array['biceps'], 'Compound Unilateral', array['dumbbell','bench'], 'pull', 'beginner', array['lower_back'], 'Unilateral — addresses left/right back asymmetry directly.'),
('Chest-Supported DB Row', 'back', 'Rhomboids', array['biceps'], 'Compound Bilateral', array['dumbbell','bench'], 'pull', 'beginner', array[]::text[], 'Removes lower back — pure mid-back isolation.'),
('Straight-Arm Cable Pulldown', 'back', 'Latissimus Dorsi', array[]::text[], 'Isolation Bilateral', array['cable'], 'isolation', 'beginner', array['shoulder'], 'Isolates lats without bicep involvement. Builds lat mind-muscle connection.'),
('Face Pull', 'shoulders', 'Posterior Delt', array['back'], 'Isolation Bilateral', array['cable'], 'pull', 'beginner', array[]::text[], 'Rear delt and external rotation. Critical for shoulder health.'),
('Band Pull-Apart', 'shoulders', 'Posterior Delt', array['back'], 'Isolation Bilateral', array['band','bodyweight'], 'pull', 'beginner', array[]::text[], 'Rear delt activation. Great warm-up and accessory.'),

-- SHOULDERS
('Seated Dumbbell Overhead Press', 'shoulders', 'Anterior Delt', array['triceps'], 'Compound Bilateral', array['dumbbell','bench'], 'push', 'beginner', array['shoulder'], 'Primary shoulder compound. Seated removes lower back demand.'),
('Standing Barbell Overhead Press', 'shoulders', 'Anterior Delt', array['triceps','core'], 'Compound Bilateral', array['barbell'], 'push', 'intermediate', array['shoulder','lower_back'], 'Heaviest shoulder compound. Standing adds core demand.'),
('Arnold Press', 'shoulders', 'Lateral Delt', array['triceps'], 'Compound Bilateral', array['dumbbell'], 'push', 'intermediate', array['shoulder'], 'Hits all three delt heads through the rotation arc.'),
('Single-Arm Overhead DB Press', 'shoulders', 'Anterior Delt', array['triceps','core'], 'Compound Unilateral', array['dumbbell'], 'push', 'intermediate', array['shoulder'], 'Unilateral shoulder press — exposes and corrects left/right gap.'),
('Lateral Raise (Dumbbell)', 'shoulders', 'Lateral Delt', array[]::text[], 'Isolation Bilateral', array['dumbbell'], 'isolation', 'beginner', array[]::text[], 'Side delt isolation. Essential for shoulder width.'),
('Cable Lateral Raise (Single-Arm)', 'shoulders', 'Lateral Delt', array[]::text[], 'Isolation Unilateral', array['cable'], 'isolation', 'beginner', array[]::text[], 'Cable version — constant tension vs dumbbell. Unilateral.'),
('Rear Delt Fly (Bent-Over)', 'shoulders', 'Posterior Delt', array[]::text[], 'Isolation Bilateral', array['dumbbell'], 'isolation', 'beginner', array['lower_back'], 'Rear delt isolation. Important for shoulder health under push volume.'),

-- BICEPS
('Alternating Dumbbell Curl', 'biceps', 'Short Head', array[]::text[], 'Isolation Bilateral', array['dumbbell'], 'isolation', 'beginner', array['elbow'], 'Supination at top hits short head and maximizes peak contraction.'),
('Barbell Curl', 'biceps', 'Short Head', array[]::text[], 'Isolation Bilateral', array['barbell'], 'isolation', 'beginner', array['elbow','wrist'], 'Primary bilateral bicep compound. Allows most loading.'),
('Incline Dumbbell Curl', 'biceps', 'Long Head', array[]::text[], 'Isolation Bilateral', array['dumbbell','bench'], 'isolation', 'beginner', array['shoulder','elbow'], 'Long head stretch position. Best for bicep peak.'),
('Hammer Curl', 'biceps', 'Brachialis', array[]::text[], 'Isolation Bilateral', array['dumbbell'], 'isolation', 'beginner', array['elbow'], 'Neutral grip targets brachialis — pushes bicep up when developed.'),
('Cable Curl (Low Pulley)', 'biceps', 'Short Head', array[]::text[], 'Isolation Bilateral', array['cable'], 'isolation', 'beginner', array['elbow'], 'Constant tension at full extension — different from dumbbell curls.'),
('Preacher Curl', 'biceps', 'Short Head', array[]::text[], 'Isolation Bilateral', array['machine','barbell','dumbbell'], 'isolation', 'beginner', array['elbow'], 'Removes swing. Good for strict bicep isolation.'),

-- TRICEPS
('Overhead Tricep Extension', 'triceps', 'Long Head', array[]::text[], 'Isolation Bilateral', array['cable','dumbbell'], 'isolation', 'beginner', array['shoulder','elbow'], 'Only exercise with full long head stretch. Essential for complete tricep development.'),
('Tricep Rope Pushdown', 'triceps', 'Lateral Head', array[]::text[], 'Isolation Bilateral', array['cable'], 'isolation', 'beginner', array['elbow'], 'Lateral and medial head. Spread rope at bottom for full contraction.'),
('Close-Grip Bench Press', 'triceps', 'Medial Head', array['chest'], 'Compound Bilateral', array['barbell','bench'], 'push', 'intermediate', array['shoulder','elbow','wrist'], 'Tricep-dominant press. Elbows tucked for maximum tricep activation.'),
('Tricep Dips', 'triceps', 'Lateral Head', array['chest','shoulders'], 'Compound Bilateral', array['bodyweight','dip_bar'], 'push', 'intermediate', array['shoulder','elbow'], 'Compound tricep movement. High shoulder demand.'),
('Single-Arm Tricep Pushdown', 'triceps', 'Lateral Head', array[]::text[], 'Isolation Unilateral', array['cable'], 'isolation', 'beginner', array['elbow'], 'Unilateral version — identifies and corrects left/right tricep gap.'),

-- QUADS
('Leg Press', 'quads', 'Vastus Lateralis', array['glutes','hamstrings'], 'Compound Bilateral', array['machine'], 'squat', 'beginner', array['knee','lower_back'], 'Bilateral quad compound. Machine removes balance demand.'),
('Bulgarian Split Squat', 'quads', 'Vastus Lateralis', array['glutes','hamstrings'], 'Compound Unilateral', array['dumbbell','bench'], 'squat', 'intermediate', array['knee'], 'Best unilateral leg exercise. Directly addresses left/right size difference.'),
('Leg Extension', 'quads', 'Vastus Medialis', array[]::text[], 'Isolation Bilateral', array['machine'], 'isolation', 'beginner', array['knee'], 'Pure quad isolation. Full knee extension targets VMO.'),
('Goblet Squat', 'quads', 'Rectus Femoris', array['glutes'], 'Compound Bilateral', array['dumbbell','kettlebell'], 'squat', 'beginner', array['knee'], 'Upright torso maximizes quad depth. Great teaching tool.'),
('Barbell Back Squat', 'quads', 'Rectus Femoris', array['glutes','hamstrings','core'], 'Compound Bilateral', array['barbell'], 'squat', 'intermediate', array['knee','lower_back','shoulder'], 'King of quad exercises. High technical demand.'),
('Walking Lunge', 'quads', 'Rectus Femoris', array['glutes'], 'Compound Unilateral', array['dumbbell','bodyweight'], 'squat', 'beginner', array['knee'], 'Unilateral. Increases range of motion vs static lunge.'),
('Step-Up', 'quads', 'Rectus Femoris', array['glutes'], 'Compound Unilateral', array['dumbbell','bodyweight','bench'], 'squat', 'beginner', array['knee'], 'Low-impact unilateral quad and glute exercise.'),

-- HAMSTRINGS
('Romanian Deadlift (Dumbbell)', 'hamstrings', 'Biceps Femoris Long Head', array['glutes'], 'Compound Bilateral', array['dumbbell'], 'hinge', 'beginner', array['lower_back'], 'Loads hamstrings in stretched position — superior hypertrophy stimulus.'),
('Romanian Deadlift (Barbell)', 'hamstrings', 'Biceps Femoris Long Head', array['glutes'], 'Compound Bilateral', array['barbell'], 'hinge', 'intermediate', array['lower_back'], 'Barbell version allows heavier loading.'),
('Single-Leg Hamstring Curl', 'hamstrings', 'Semimembranosus', array[]::text[], 'Isolation Unilateral', array['machine'], 'isolation', 'beginner', array['knee'], 'Most direct tool for left/right hamstring comparison and correction.'),
('Lying Leg Curl', 'hamstrings', 'Semimembranosus', array[]::text[], 'Isolation Bilateral', array['machine'], 'isolation', 'beginner', array['knee'], 'Bilateral hamstring isolation. Full stretch at extension.'),
('Nordic Curl', 'hamstrings', 'Biceps Femoris Long Head', array[]::text[], 'Isolation Bilateral', array['bodyweight','partner'], 'isolation', 'advanced', array['knee'], 'Eccentric-focused. One of the most effective hamstring exercises in research.'),

-- GLUTES
('Hip Thrust (Barbell)', 'glutes', 'Gluteus Maximus', array['hamstrings'], 'Compound Bilateral', array['barbell','bench'], 'hinge', 'intermediate', array['lower_back'], 'Highest glute max EMG of any exercise. Loads glute at full extension.'),
('Hip Thrust (Machine)', 'glutes', 'Gluteus Maximus', array['hamstrings'], 'Compound Bilateral', array['machine'], 'hinge', 'beginner', array[]::text[], 'Machine version — easier setup, same stimulus.'),
('Single-Leg Hip Thrust', 'glutes', 'Gluteus Maximus', array['hamstrings'], 'Compound Unilateral', array['bodyweight','bench'], 'hinge', 'intermediate', array['lower_back'], 'Exposes left/right glute imbalance bilateral thrusts mask.'),
('Cable Pull-Through', 'glutes', 'Gluteus Maximus', array['hamstrings'], 'Compound Bilateral', array['cable'], 'hinge', 'beginner', array['lower_back'], 'Hip hinge pattern. Good alternative when barbell is unavailable.'),
('Glute Bridge', 'glutes', 'Gluteus Maximus', array['hamstrings'], 'Compound Bilateral', array['bodyweight'], 'hinge', 'beginner', array[]::text[], 'Bodyweight hip thrust. Great warm-up and beginner option.'),

-- CALVES
('Standing Calf Raise', 'calves', 'Gastrocnemius', array[]::text[], 'Isolation Bilateral', array['machine','bodyweight'], 'isolation', 'beginner', array[]::text[], 'Gastrocnemius with straight knee. Full range required.'),
('Seated Calf Raise', 'calves', 'Soleus', array[]::text[], 'Isolation Bilateral', array['machine'], 'isolation', 'beginner', array[]::text[], 'Soleus targeted with bent knee — different muscle from standing raise.'),
('Single-Leg Calf Raise', 'calves', 'Gastrocnemius', array[]::text[], 'Isolation Unilateral', array['bodyweight'], 'isolation', 'beginner', array[]::text[], 'Bodyweight unilateral. Find imbalances between sides.'),

-- CORE
('Dead Bug', 'core', 'Transverse Abdominis', array[]::text[], 'Core Stage 1', array['bodyweight'], 'isolation', 'beginner', array[]::text[], 'Deep core stability. Foundation before any loaded core work.'),
('Plank', 'core', 'Transverse Abdominis', array[]::text[], 'Core Stage 1', array['bodyweight'], 'isolation', 'beginner', array['shoulder','wrist'], 'Full-body brace. Teaches core tension needed in compound lifts.'),
('Pallof Press', 'core', 'Obliques', array[]::text[], 'Core Stage 2', array['cable','band'], 'isolation', 'beginner', array[]::text[], 'Anti-rotation. Trains core to resist rotational forces in compound lifts.'),
('Side Plank', 'core', 'Obliques', array[]::text[], 'Core Stage 2', array['bodyweight'], 'isolation', 'beginner', array['shoulder','wrist'], 'Anti-lateral flexion. Covers the third plane of core stability.'),
('Hanging Knee Raise', 'core', 'Rectus Abdominis', array[]::text[], 'Core Stage 3', array['pull_up_bar'], 'isolation', 'intermediate', array['shoulder','elbow'], 'Loaded flexion. Posterior pelvic tilt at top is the key.'),
('Ab Wheel Rollout', 'core', 'Transverse Abdominis', array[]::text[], 'Core Stage 3', array['ab_wheel'], 'isolation', 'intermediate', array['lower_back','shoulder'], 'Most demanding anti-extension movement. Progress range gradually.'),
('Cable Crunch', 'core', 'Rectus Abdominis', array[]::text[], 'Core Stage 3', array['cable'], 'isolation', 'beginner', array[]::text[], 'Only loaded flexion exercise that allows progressive overload on abs.'),
('Bird Dog', 'core', 'Transverse Abdominis', array[]::text[], 'Core Stage 1', array['bodyweight'], 'isolation', 'beginner', array[]::text[], 'Anti-extension stability. Great for lower back health.');

-- Update alternatives mapping
update exercises set alternative_for = array['Hip Thrust (Barbell)', 'Hip Thrust (Machine)'] where name = 'Single-Leg Hip Thrust';
update exercises set alternative_for = array['Hip Thrust (Barbell)'] where name in ('Hip Thrust (Machine)', 'Cable Pull-Through', 'Glute Bridge');
update exercises set alternative_for = array['Romanian Deadlift (Dumbbell)', 'Romanian Deadlift (Barbell)'] where name = 'Nordic Curl';
update exercises set alternative_for = array['Pull-Up', 'Lat Pulldown (Wide Overhand)'] where name = 'Assisted Pull-Up';
update exercises set alternative_for = array['Lat Pulldown (Wide Overhand)'] where name in ('Pull-Up', 'Assisted Pull-Up', 'Straight-Arm Cable Pulldown');
update exercises set alternative_for = array['Dumbbell Bench Press', 'Barbell Bench Press'] where name in ('Push-Up', 'Pec Deck / Machine Fly');
update exercises set alternative_for = array['Barbell Bench Press'] where name = 'Dumbbell Bench Press';
update exercises set alternative_for = array['Bulgarian Split Squat'] where name in ('Walking Lunge', 'Step-Up');
update exercises set alternative_for = array['Leg Press'] where name in ('Goblet Squat', 'Barbell Back Squat', 'Walking Lunge');
update exercises set alternative_for = array['Seated Cable Row (Neutral Grip)'] where name = 'Barbell Row';
update exercises set alternative_for = array['Single-Arm Dumbbell Row'] where name = 'Chest-Supported DB Row';

select count(*) as exercises_seeded from exercises;
