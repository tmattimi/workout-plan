// ── TARA'S PROGRAM ─────────────────────────────────────────────────────────────
// 27F · 135 lbs → ~125 lbs target · Body Recomposition
// Schedule: Mon / Tue / Wed / Thu upper / Fri cycle class / optional weekend
// Injuries: L5 herniated disc, scoliosis, SI joint dysfunction, ACL strain history
// Contraindications: No axial spinal loading (no barbell squats, no conventional deadlifts)
// Approved: Hip thrusts, RDLs, leg press, cable movements, upper body work
//
// Programming basis:
// — Glute volume: Contreras et al. (2015) — hip thrust generates highest glute max EMG
// — Hamstring: Wakahara et al. (2012) — stretch-mediated hypertrophy via RDL/Nordic
// — Recomp: ACSM (2011) Garber et al. — resistance 3x+/week + moderate cardio in deficit
// — Spine: McGill (2010) — L5 disc: avoid compressive + shear loading. Hip hinge safe.
// — SI joint: Vleeming et al. (2012) — stability via lumbopelvic motor control, not avoidance
// — ACL: Distefano et al. (2009) — strengthen VMO, glute med, hip abductors
// — Upper body: Schoenfeld (2010) — 10–20 sets/muscle/week for hypertrophy

export const schedule = [
  {
    day: "MON", label: "Glutes", type: "posterior",
    focus: "Glutes & Posterior Chain",
    muscles: ["Glutes", "Hamstrings", "Hip Abductors", "Core"],
    cardio: {
      name: "StairMaster",
      protocol: "Level 6–8 for 20 minutes post-session",
      zone: "Zone 2 (60–70% max HR)",
      feel: "Conversational pace — you should be able to speak in full sentences. Post-session cardio after strength training draws more from fat stores because glycogen has been depleted. Keep the level moderate — this is not a hard effort."
    },
    exercises: [
      {
        name: "Hip Thrust (Barbell or Machine)", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 1, sets: 4, reps: "6–8", rest: "2–3 min", eccentric: "3s down",
        why: "Contreras et al. (2015) measured peak glute max EMG at 105% of max voluntary contraction during the hip thrust — higher than any squat or deadlift variation. This is the anchor of your program. Heavy and progressive.",
        form: [
          { label: "Setup", text: "Upper back rests on the bench just below the shoulder blades. Feet flat, hip-width, toes 15° outward. Bar or pad sits in the hip crease — not the stomach." },
          { label: "Before the rep", text: "Take a breath in and brace the core fully. Tuck the chin to the chest and keep it there the entire set." },
          { label: "Drive", text: "Push through the heels and mid-foot evenly. Drive the hips up until the thighs are parallel to the floor — a straight line from knee to shoulder." },
          { label: "Top", text: "Squeeze both glutes hard and hold for one full second. The lower back should not hyperextend. If it does, the hips have gone too high." },
          { label: "Watch for", text: "Knees caving inward on the drive, lower back hyperextending at the top, pushing through the toes instead of heels." }
        ]
      },
      {
        name: "Romanian Deadlift (Dumbbell)", muscles: ["Hamstrings", "Glutes"], category: "Compound Bilateral", order: 2, sets: 4, reps: "8–10", rest: "2 min", eccentric: "3–4s down",
        why: "Wakahara et al. (2012) confirmed stretch-mediated hypertrophy produces greater hamstring growth than contracted-position training. Dumbbell RDL keeps the load close to the body and reduces lumbar shear forces compared to barbell — appropriate for L5 disc history. This is a different movement from the hip thrust: it loads the hamstrings under stretch, the hip thrust loads the glutes at contraction.",
        form: [
          { label: "Setup", text: "Stand holding dumbbells in front of the thighs. Feet hip-width. Lock in a slight knee bend and do not change it throughout the set — this is not a squat." },
          { label: "Hinge", text: "Push the hips backward, not downward. The dumbbells track along the front of the legs throughout. You should feel increasing tension in the hamstrings as you lower." },
          { label: "Depth", text: "Lower until a deep hamstring pull — typically mid-shin. The back must stay flat. If the lower back rounds, that is your end range regardless of depth." },
          { label: "Ascent", text: "Drive the hips forward, squeezing the glutes at the top. Do not hyperextend the spine at lockout." },
          { label: "Watch for", text: "Squatting the weight by bending the knees, lower back rounding at the bottom, dumbbells drifting away from the body." }
        ]
      },
      {
        name: "Cable Hip Abduction (Standing)", muscles: ["Glute Medius", "TFL"], category: "Isolation Unilateral", order: 3, sets: 3, reps: "15–20 each side", rest: "60 sec", eccentric: "2s return",
        why: "Distefano et al. (2009) identified glute medius strength as the primary modifiable risk factor for ACL injury. Direct abduction work is non-negotiable given the ACL strain history. The glute medius also determines hip stability during gait — directly related to SI joint dysfunction.",
        form: [
          { label: "Setup", text: "Ankle cuff at the lowest cable position. Stand side-on to the machine, hand on the frame for balance." },
          { label: "Abduct", text: "Lift the leg directly out to the side with the knee lightly bent. Stop at roughly 40–45°. Squeeze the outer glute at the top." },
          { label: "Return", text: "2 controlled seconds back to the start. Do not let it snap back." },
          { label: "Watch for", text: "Torso leaning away from the movement, hiking the hip up to assist the range, losing balance." }
        ]
      },
      {
        name: "Lying Leg Curl (Machine)", muscles: ["Hamstrings"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "10–12", rest: "90 sec", eccentric: "3s return",
        why: "After the RDL loaded the hamstrings under stretch, the leg curl provides a complementary contraction-focused stimulus at the knee — hitting the short head of the biceps femoris which the RDL cannot reach.",
        form: [
          { label: "Setup", text: "Lie face down. Pad sits just above the heel, not on the Achilles tendon. Hips stay flat on the pad — do not let them rise." },
          { label: "Curl", text: "Curl toward the glutes as far as possible. Pause one second at full contraction." },
          { label: "Return", text: "3 full seconds back to full extension. Feel the hamstring lengthen." },
          { label: "Watch for", text: "Hips lifting off the pad to gain range, rushing the eccentric, or not reaching full extension at the bottom." }
        ]
      },
      {
        name: "Standing Calf Raise", muscles: ["Gastrocnemius"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "3s down",
        why: "Lower leg development contributes directly to the defined legs goal. Full range required for any hypertrophic stimulus — partial reps produce negligible growth.",
        form: [
          { label: "Stretch", text: "Start by dropping the heels as far below the step as possible. This full stretch is where most people skip and why most calf programs fail." },
          { label: "Rise", text: "Drive onto the ball of the foot as high as possible. Hold one second at the top." },
          { label: "Watch for", text: "Bouncing at the bottom, not reaching full elevation, or bending the knees." }
        ]
      },
    ],
    core_finisher: [
      {
        name: "Dead Bug", bodyweight: true, muscles: ["TVA", "Multifidus"], category: "Core Stage 1", sets: 3, reps: "8–10 each side", rest: "45 sec", eccentric: "3s lowering",
        form: [
          { label: "Setup", text: "Lie on your back. Arms straight up, knees at 90° in the air. Press your lower back fully into the floor — zero gap." },
          { label: "Move", text: "Exhale and brace the TVA. Slowly lower the right arm overhead and left leg toward the floor simultaneously. Return and switch." },
          { label: "Why this matters", text: "Vleeming et al. (2012) — SI joint stability depends on force closure through the lumbopelvic muscles, particularly the TVA and multifidus. This is the most direct training stimulus for both." },
          { label: "Watch for", text: "Lower back lifting off the floor — that ends the rep. Moving too fast. Holding the breath." }
        ]
      },
      {
        name: "Bird Dog", bodyweight: true, muscles: ["Multifidus", "Glutes", "Core"], category: "Core Stage 1", sets: 3, reps: "8 each side", rest: "45 sec", eccentric: "3s hold",
        form: [
          { label: "Setup", text: "On hands and knees. Wrists under shoulders, knees under hips. Neutral spine — no arch, no rounding." },
          { label: "Move", text: "Extend the right arm forward and left leg back simultaneously. Hold for 3 full seconds. Return under control and switch." },
          { label: "Key point", text: "The hips must stay completely level throughout. Any hip rotation means the stabilizers have disengaged." },
          { label: "Watch for", text: "Hips rotating, lower back arching on the leg extension, or rushing through the hold." }
        ]
      },
      {
        name: "Banded Clamshell", bodyweight: true, muscles: ["Glute Medius", "Hip External Rotators"], category: "Core Stage 1", sets: 2, reps: "20 each side", rest: "30 sec", eccentric: "—",
        form: [
          { label: "Setup", text: "Lie on your side, band just above the knees. Hips stacked, knees bent at 45°, feet together." },
          { label: "Open", text: "Rotate the top knee upward as far as you can without the hip rolling backward. Hold one second at the top." },
          { label: "Watch for", text: "Hip rolling back to gain range — that defeats the purpose. The movement happens at the hip joint only." }
        ]
      },
    ],
  },
  {
    day: "TUE", label: "Upper Pull", type: "pull",
    focus: "Upper Body — Back & Biceps",
    muscles: ["Back", "Biceps", "Rear Delts", "Core"],
    cardio: {
      name: "StairMaster (Warm-Up)",
      protocol: "Level 5–7 for 20 minutes before lifting",
      zone: "Zone 2 (60–70% max HR)",
      feel: "Keep it genuinely easy — conversational pace, full sentences. This is a moving warm-up, not a cardio session. If you feel your legs fatiguing before you've touched a weight, bring the level down. The goal is blood flow and joint prep, not energy expenditure."
    },
    exercises: [
      {
        name: "Lat Pulldown (Wide Overhand)", muscles: ["Lats", "Rear Delt", "Bicep"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s return",
        why: "Primary horizontal width builder. Wide grip develops the latissimus dorsi which creates a tapered torso and the appearance of a smaller waist — one of the most visible outcomes of back training.",
        form: [
          { label: "Setup", text: "Grip just outside shoulder width. Lock knees firmly under the pad. Lean back about 20°." },
          { label: "Pull", text: "Think about driving the elbows down toward your back pockets. Pull the bar to the upper chest." },
          { label: "Return", text: "3 full seconds to the top. Let the arms extend fully so the shoulder blades can spread — that stretch is part of the stimulus." },
          { label: "Watch for", text: "Pulling the bar behind the neck, excessive lower back arch, cutting the return short." }
        ]
      },
      {
        name: "Seated Cable Row (Neutral Grip)", muscles: ["Mid Back", "Rhomboids", "Bicep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s return",
        why: "Mid-back thickness. Neutral grip allows heavier loading and emphasizes the rhomboids and mid-traps alongside the lats — the muscles most responsible for posture and scapular stability.",
        form: [
          { label: "Setup", text: "Sit tall, feet flat on the footplates. Slight forward lean from the hips at the start." },
          { label: "Row", text: "Drive elbows straight back. Pull the handle to the lower sternum. Squeeze shoulder blades together and hold one second." },
          { label: "Return", text: "3 full seconds to full arm extension. Let the shoulder blades protract forward at the end." },
          { label: "Watch for", text: "Leaning back with the lower back, shoulder rounding on the return, jerking the weight." }
        ]
      },
      {
        name: "Single-Arm Dumbbell Row", muscles: ["Lats", "Mid Back", "Bicep"], category: "Compound Unilateral", order: 3, sets: 3, reps: "10–12 each side", rest: "90 sec", eccentric: "3s down",
        why: "Unilateral pulling addresses left-right strength differences. With scoliosis and SI joint history, back asymmetry is common. Each side works independently here.",
        form: [
          { label: "Setup", text: "One knee and same-side hand on a bench. Working arm straight down, back flat." },
          { label: "Stretch first", text: "Before pulling, let the arm extend fully and the shoulder blade drift forward slightly." },
          { label: "Drive", text: "Pull the elbow straight back and slightly up toward the hip pocket." },
          { label: "Watch for", text: "Rotating the torso to swing the weight, shortcutting the stretch at the bottom." }
        ]
      },
      {
        name: "Face Pull (Cable)", muscles: ["Rear Delt", "External Rotators", "Lower Trap"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "15–20", rest: "90 sec", eccentric: "2s return",
        why: "Rear delts and external rotators are chronically underworked in any pressing-dominant program. Face pulls correct shoulder mechanics and counterbalance the pushing sessions. Essential for long-term shoulder health.",
        form: [
          { label: "Setup", text: "Rope attachment at face height. Stand far enough back that there's tension at full arm extension." },
          { label: "Pull", text: "Pull toward the forehead and spread the rope ends apart. Elbows finish above shoulder height." },
          { label: "Watch for", text: "Elbows dropping below shoulder level, using too much weight causing posture breakdown." }
        ]
      },
      {
        name: "Incline Dumbbell Curl", muscles: ["Bicep Long Head"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "10–12", rest: "90 sec", eccentric: "3s down",
        why: "The incline position puts the long head of the bicep on full stretch before the curl starts. Schoenfeld et al. (2013) — stretch-mediated loading is superior for hypertrophy. Best exercise for the bicep peak that creates the toned arm appearance.",
        form: [
          { label: "Setup", text: "Bench at 45–60°. Arms hang freely behind the torso — behind the body when extended." },
          { label: "Key point", text: "Keep elbows back. If they drift forward before curling, the long head stretch is removed immediately." },
          { label: "Return", text: "3 slow seconds back to full extension." },
          { label: "Watch for", text: "Elbows drifting forward, momentum at the bottom, cutting range of motion short." }
        ]
      },
      {
        name: "Lateral Raise", muscles: ["Medial Delt"], category: "Isolation Bilateral", order: 6, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "2s down",
        why: "Side delts are almost completely untargeted by compound pressing or pulling. They define shoulder width and create the V-taper that makes the waist look smaller.",
        form: [
          { label: "Setup", text: "Slight forward lean. Dumbbells hang in front of the hips." },
          { label: "Raise", text: "Lead with the elbows. Think about pouring water from a jug — pinky slightly higher than thumb. Stop at shoulder height." },
          { label: "Watch for", text: "Shrugging the traps, raising above shoulder height, letting the arms drop quickly." }
        ]
      },
    ],
    core_finisher: [
      {
        name: "Pallof Press (Cable)", muscles: ["TVA", "Obliques", "Multifidus"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "12 each side", rest: "45 sec", eccentric: "2s return",
        form: [
          { label: "Setup", text: "Stand side-on to the cable at chest height, both hands on the handle." },
          { label: "Press", text: "Press the handle straight out until arms are fully extended. Hold 2 seconds. Return to chest." },
          { label: "The point", text: "The cable is trying to rotate your torso toward the stack. Your entire core resists that. This is anti-rotation stability — what protects the spine under all types of load." },
          { label: "Watch for", text: "Torso rotating toward the cable, feet shifting, rushing through the hold." }
        ]
      },
      {
        name: "Dead Bug", bodyweight: true, muscles: ["TVA", "Multifidus"], category: "Core Stage 1", sets: 2, reps: "8 each side", rest: "45 sec", eccentric: "3s lowering",
        form: [
          { label: "Move", text: "Lower opposite arm and leg slowly while keeping the lower back completely flat. Switch and repeat." },
          { label: "Watch for", text: "Any lower back lift — that ends the rep immediately." }
        ]
      },
    ],
  },
  {
    day: "WED", label: "Quads & Glutes", type: "legs",
    focus: "Lower Body — Quad Definition & Glute Volume",
    muscles: ["Quads", "Glutes", "Calves"],
    cardio: {
      name: "StairMaster",
      protocol: "Level 6–8 for 15–20 minutes post-session",
      zone: "Zone 2 (60–70% max HR)",
      feel: "Post-session cardio after legs. Keep the level moderate — legs will already be fatigued. Steady conversational pace. The stairmaster is low-impact on the lower back and knees compared to running, which makes it a good fit given your injury history."
    },
    exercises: [
      {
        name: "Leg Press", muscles: ["Quads", "Glutes"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s down",
        why: "The primary quad-dominant compound given the squat and deadlift contraindications. McGill (2010) confirms leg press with appropriate depth is low-risk for L5 disc pathology. Quad development is the primary driver of the defined legs goal.",
        form: [
          { label: "Foot position", text: "Feet hip-width at mid-platform, toes 15° outward. Higher foot position shifts more load to glutes. Lower foot position shifts load to quads — use mid for balanced stimulus." },
          { label: "Core", text: "Lower back stays pressed into the seat pad throughout. If it lifts, depth is too great or weight is too heavy." },
          { label: "Range", text: "Lower until thighs are roughly parallel to the platform or slightly below — stop before the lower back peels off the seat." },
          { label: "Press", text: "Drive through the whole foot evenly. Stop just short of full knee lockout to keep tension on the quad." },
          { label: "Watch for", text: "Lower back lifting off the pad, knees caving inward, bouncing at the bottom." }
        ]
      },
      {
        name: "Leg Extension", muscles: ["Quads"], category: "Isolation Bilateral", order: 2, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down",
        why: "Direct quad isolation at terminal knee extension — the range the leg press cannot fully load. The VMO (inner quad) is most active in the last 15–30° of extension and is a primary ACL stabilizer. Distefano et al. (2009) — VMO strengthening is the most effective ACL injury prevention strategy.",
        form: [
          { label: "Setup", text: "Pad just above the ankle. Back flat on the seat." },
          { label: "Extension", text: "Extend to full knee extension and pause one second at the top. Feel the quad contracting fully." },
          { label: "Return", text: "3 full seconds back. Do not let the stack clatter at the bottom." },
          { label: "Watch for", text: "Jerking the weight, not reaching full extension at the top, or cutting the range short." }
        ]
      },
      {
        name: "Bulgarian Split Squat (Dumbbell)", muscles: ["Quads", "Glutes", "Adductors"], category: "Compound Unilateral", order: 3, sets: 3, reps: "8–10 each leg", rest: "2 min", eccentric: "3s down",
        why: "Provides unilateral loading the leg press cannot deliver. Schoenfeld (2010) — unilateral movements produce greater DOMS and metabolic stress per leg, accelerating the body composition change. Rear foot elevated removes the spinal compression of a barbell squat.",
        form: [
          { label: "Setup", text: "2 feet in front of a bench. Top of rear foot on the bench — laces down. Front foot far enough forward that the shin stays close to vertical when you lower." },
          { label: "Descent", text: "Drop straight down rather than forward. Front knee tracks over the toes. Lower until rear knee is 1–2 inches from the floor." },
          { label: "Drive", text: "Push through the front heel to stand. Squeeze the front glute at the top." },
          { label: "Watch for", text: "Front knee caving inward, torso collapsing forward, or the rear foot shifting on the bench." }
        ]
      },
      {
        name: "Cable Kickback (Glutes)", muscles: ["Glute Max", "Hamstrings"], category: "Isolation Unilateral", order: 4, sets: 3, reps: "15–20 each side", rest: "60 sec", eccentric: "2s return",
        why: "Glute max isolation at full hip extension — the contracted position hip thrusts and RDLs load least. Provides the third weekly glute stimulus to hit the MAV of 12–16 sets per week recommended by Israetel et al. for hypertrophy.",
        form: [
          { label: "Setup", text: "Ankle cuff at the lowest cable. Stand facing the machine, slight forward lean, hand on the frame." },
          { label: "Kick", text: "Drive the leg straight back with a slight knee bend. Stop when the glute is fully contracted. Do not swing." },
          { label: "Watch for", text: "Rotating the torso to gain range, hyperextending the lower back, losing the glute contraction at the top." }
        ]
      },
      {
        name: "Seated Calf Raise", muscles: ["Soleus"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "3s down",
        why: "Seated variation targets the soleus which sits beneath the gastrocnemius and is responsible for lower leg fullness. The soleus is slow-twitch dominant and responds best to higher reps and full range.",
        form: [
          { label: "Stretch", text: "Drop heels as far below the step as possible. Full stretch at the bottom." },
          { label: "Rise", text: "Drive onto the ball of the foot as high as possible. Hold one second at the top." },
          { label: "Watch for", text: "Partial range — if you don't feel the stretch at the bottom, you're not going deep enough." }
        ]
      },
    ],
    core_finisher: [
      {
        name: "Cable Crunch", muscles: ["Rectus Abdominis"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "12–15", rest: "45 sec", eccentric: "2s return",
        form: [
          { label: "Setup", text: "Rope attachment at the top pulley. Kneel facing the stack, rope ends held beside the ears." },
          { label: "Crunch", text: "Pull the elbows toward the knees — flex the spine, don't just pull with the arms. The lower back rounds slightly at the bottom." },
          { label: "Return", text: "2 controlled seconds back to full extension. Feel the abs stretch at the top." },
          { label: "Watch for", text: "Pulling with the arms instead of crunching the spine, or sitting back into the hips." }
        ]
      },
      {
        name: "Plank", bodyweight: true, muscles: ["TVA", "Glutes", "Core"], category: "Core Stage 1", sets: 3, reps: "40–60 sec", rest: "45 sec", eccentric: "—",
        form: [
          { label: "Position", text: "Forearms on the floor, elbows under shoulders. Toes on the floor. Body in a straight line." },
          { label: "Brace", text: "Squeeze glutes, brace abs, push the floor away with the forearms — all three simultaneously." },
          { label: "Progression", text: "Once 60 seconds is easy, add alternating shoulder taps while keeping the hips completely still." },
          { label: "Watch for", text: "Hips sagging, hips piking, or holding the breath." }
        ]
      },
      {
        name: "Banded Clamshell", bodyweight: true, muscles: ["Glute Medius", "Hip External Rotators"], category: "Core Stage 1", sets: 2, reps: "20 each side", rest: "30 sec", eccentric: "—",
        form: [
          { label: "Setup", text: "Band above knees, on your side, hips stacked, knees bent at 45°." },
          { label: "Open", text: "Rotate the top knee up without the hip rolling back. Squeeze at the top for one second." },
          { label: "Watch for", text: "Hip rolling back to gain range — the movement is at the hip joint only." }
        ]
      },
    ],
  },
  {
    day: "THU", label: "Upper Push", type: "push",
    focus: "Upper Body — Chest, Shoulders & Triceps",
    muscles: ["Chest", "Shoulders", "Triceps"],
    cardio: {
      name: "StairMaster (Warm-Up)",
      protocol: "Level 5–7 for 20 minutes before lifting",
      zone: "Zone 2 (60–70% max HR)",
      feel: "Same as Tuesday — easy warm-up pace. Shoulders and upper body need blood flow before pressing. Keep the level low enough that you're not breathing hard when you step off."
    },
    exercises: [
      {
        name: "Dumbbell Bench Press", muscles: ["Chest", "Front Delt", "Tricep"], category: "Compound Bilateral", order: 1, sets: 3, reps: "8–10", rest: "2 min", eccentric: "3s down",
        why: "Primary chest compound. Dumbbells allow each side to work independently which is important for correcting the chest asymmetry common with scoliosis.",
        form: [
          { label: "Setup", text: "Lie flat, shoulder blades together and down. Feet flat on the floor." },
          { label: "Descent", text: "3 seconds down to a deep chest stretch. Elbows at 45–60° from the torso." },
          { label: "Press", text: "Drive up and slightly inward. Stop just short of lockout to maintain tension." },
          { label: "Watch for", text: "Hips lifting off the bench, wrists collapsing backward, dumbbells drifting over the face." }
        ]
      },
      {
        name: "Seated Dumbbell Overhead Press", muscles: ["Shoulder", "Tricep", "Upper Chest"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down",
        why: "Shoulder compound second while the CNS is still fresh from the chest press. Seated removes lower back involvement — appropriate for L5 history.",
        form: [
          { label: "Setup", text: "Upright bench at 90°. Dumbbells at shoulder height, palms forward." },
          { label: "Core", text: "Brace hard and press the lower back into the bench. It stays in contact throughout." },
          { label: "Press", text: "Drive both dumbbells up in a slight inward arc. Exhale on the press." },
          { label: "Watch for", text: "Lower back arching away from the bench, wrists collapsing backward." }
        ]
      },
      {
        name: "Incline Dumbbell Press", muscles: ["Upper Chest", "Front Delt"], category: "Compound Bilateral", order: 3, sets: 3, reps: "10–12", rest: "90 sec", eccentric: "3s down",
        why: "Upper chest is the clavicular head of the pec — creates the chest shelf. Different angle from the flat press hits a distinct portion of the muscle.",
        form: [
          { label: "Setup", text: "Bench at 30–45°. Same scapular retraction as the flat press." },
          { label: "Descent", text: "Lower until the upper chest stretches. 3 seconds down." },
          { label: "Watch for", text: "Bench too steep turning it into a shoulder press." }
        ]
      },
      {
        name: "Cable Lateral Raise (Single-Arm)", muscles: ["Medial Delt"], category: "Isolation Unilateral", order: 4, sets: 3, reps: "15–20 each side", rest: "60 sec", eccentric: "2s return",
        why: "Cable maintains constant tension through the full arc where dumbbells have near-zero resistance at the bottom. Side delts define shoulder width and the toned upper body appearance.",
        form: [
          { label: "Setup", text: "Stand side-on to the stack, cable at lowest position. Grab with the hand farthest from the machine." },
          { label: "Raise", text: "Lift the arm out to the side leading with the elbow. Stop at shoulder height." },
          { label: "Watch for", text: "Shrugging to assist, raising above shoulder height, rotating the torso." }
        ]
      },
      {
        name: "Overhead Tricep Extension (Cable)", muscles: ["Tricep Long Head"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down",
        why: "The only tricep movement that loads the long head in a fully stretched position. Schoenfeld et al. — the long head makes up two-thirds of total tricep mass. Stretch-position loading produces superior hypertrophy.",
        form: [
          { label: "Setup", text: "High pulley, face away from the stack, hold rope overhead." },
          { label: "Upper arms fixed", text: "Upper arms stay completely still pointing up. Only the forearms move." },
          { label: "Descent", text: "3 full seconds down into a deep stretch in the tricep." },
          { label: "Watch for", text: "Elbows flaring wide, upper arms moving, or not reaching the full stretch at the bottom." }
        ]
      },
      {
        name: "Tricep Rope Pushdown", muscles: ["Tricep Lateral Head"], category: "Isolation Bilateral", order: 6, sets: 2, reps: "15–20", rest: "60 sec", eccentric: "2s return",
        why: "Targets the lateral and medial heads — different emphasis from the overhead extension. High-rep finisher creates the metabolic fatigue that drives the toned appearance.",
        form: [
          { label: "Setup", text: "Rope attachment at the top pulley. Thumbs up grip." },
          { label: "Upper arms", text: "Pin the elbows to the ribcage. They do not move." },
          { label: "Push", text: "Drive to full extension and spread the rope ends apart at the bottom." },
          { label: "Watch for", text: "Upper arms lifting away from the body or letting the rope snap back." }
        ]
      },
    ],
    core_finisher: [
      {
        name: "Side Plank", bodyweight: true, muscles: ["Obliques", "Quadratus Lumborum", "Glute Medius"], category: "Core Stage 2", sets: 2, reps: "30–45 sec each side", rest: "30 sec", eccentric: "—",
        form: [
          { label: "Setup", text: "On your side, forearm on the floor, elbow under the shoulder. Feet stacked." },
          { label: "Hold", text: "Drive the hips up. Body forms a straight line from head to feet. Squeeze the glute of the top leg." },
          { label: "Watch for", text: "Hips sagging toward the floor, top shoulder rotating toward the ceiling, or holding the breath." }
        ]
      },
      {
        name: "Bird Dog", bodyweight: true, muscles: ["Multifidus", "Glutes", "Core"], category: "Core Stage 1", sets: 2, reps: "8 each side", rest: "30 sec", eccentric: "3s hold",
        form: [
          { label: "Setup", text: "On hands and knees. Wrists under shoulders, knees under hips." },
          { label: "Move", text: "Extend the opposite arm and leg simultaneously. Hold 3 seconds. Return and switch." },
          { label: "Watch for", text: "Hips rotating, lower back arching, or rushing the hold." }
        ]
      },
    ],
  },
  {
    day: "FRI", label: "Cycle Class", type: "cardio",
    focus: "Cardio — Cycle Class",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Cardiovascular"],
    cardio: {
      name: "Cycle Class",
      protocol: "45-minute class. Stay in Zone 2–3 for the base intervals, push to Zone 4–5 on sprints, recover fully between efforts. Log it as 45 min.",
      zone: "Zone 2–4",
      feel: "This is your dedicated cardio day and it counts as lower body volume. The sprint intervals are where the metabolic benefit comes from for recomp — don't hold back on those. Recover fully between efforts so you can actually push the next one."
    },
    exercises: [],
    core_finisher: [],
  },
  {
    day: "SAT", label: "Rest", type: "rest",
    focus: "Rest & Recovery",
    muscles: [],
    cardio: null,
    exercises: [],
    core_finisher: [],
  },
  {
    day: "SUN", label: "Rest", type: "rest",
    focus: "Rest & Recovery",
    muscles: [],
    cardio: null,
    exercises: [],
    core_finisher: [],
  },
];

export const principles = [
  {
    title: "Why this structure — science behind the split",
    body: "Mon (glutes/hamstrings) and Wed (quads/glutes) are on separate days to allow posterior chain recovery while still hitting glutes 3x per week — the frequency Contreras et al. found necessary for maximizing glute hypertrophy. Tue (upper pull) and Thu (upper push) follow the same logic for upper body. Friday's cycle class adds a fourth lower body stimulus at low impact. Total weekly glute volume: 12–16 sets — within Israetel's MAV range for intermediate trainees.",
  },
  {
    title: "Body recomposition: how this program works",
    body: "Recomp requires two simultaneous signals: a stimulus for muscle protein synthesis (progressive overload on the hip thrust, leg press, RDL, and pressing movements) combined with a caloric environment that draws on fat stores. The Zone 2 cardio finishers and Friday cycle class increase energy expenditure without impairing recovery. Aim to add weight or reps to the main compound lifts every 1–2 weeks. That progression is what changes the shape.",
  },
  {
    title: "Spine and injury considerations",
    body: "No axial spinal compression (barbell squats, conventional deadlifts) based on McGill's lumbar disc research. Hip thrust, dumbbell RDL, leg press, and all cable movements are approved — they load the posterior chain without compressive spinal forces. The dead bug and bird dog in every session train the TVA and multifidus, which are the primary stabilizers of both the L5 segment and the SI joint. This is active management, not avoidance.",
  },
  {
    title: "ACL and knee health",
    body: "Leg extension (VMO strengthening), hip abduction (glute medius), and Bulgarian split squats are the three most evidence-backed ACL prevention exercises per Distefano et al. (2009). They're all in this program. Keep the knees tracking over the toes on every movement — never let them cave inward.",
  },
  {
    title: "What 'toned' actually means",
    body: "The toned appearance comes from two things: muscle definition (built by progressive overload) and reduced body fat (achieved through the caloric deficit and cardio volume). You cannot get the look by doing high-rep light weights — that produces muscular endurance, not definition. The compound lifts in this program need to get heavier week over week. That's the path to the result.",
  },
];
