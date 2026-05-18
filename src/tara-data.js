// ── TARA'S PROGRAM ────────────────────────────────────────────────────────────
// 27F · 135 lbs · Goal: Recomp / Body Tone · Target: ~125 lbs
// History: L5 herniated disc, scoliosis, SI joint imbalance, ACL strain history
// No squats, no conventional deadlifts. Hip thrusts and RDLs are approved.
// Focus: posterior chain, glute definition, leg toning, deep core stability
// Schedule: Mon / Tue / Wed / Thu (short upper) / Fri (cycle class) / optional weekend

export const TARA_IMBALANCE_NOTE = "SI joint imbalance: always start with the left side. Match the right side exactly — never do more on the right. If there's a difference in how each side feels, note it. Focus on feeling the hip fully stabilize before adding load.";

export const schedule = [
  {
    day: "MON", label: "Glutes + Hamstrings", type: "posterior",
    focus: "Posterior Chain — Glutes & Hamstrings",
    muscles: ["Glutes", "Hamstrings", "Core"],
    cardio: { name: "Incline Treadmill Walk", protocol: "3.5 to 4.0 mph at 10–12% incline for 20 minutes", zone: "Zone 2 (60–70% max HR)", feel: "You should be able to hold a conversation but feel your heart rate elevated. This is fat-burning pace. Legs are warm from the session — keep moving." },
    exercises: [
      { name: "Hip Thrust (Barbell or Machine)", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s down", why: "The single most effective glute exercise. Loads the glutes at full hip extension — the position where the glute max generates maximum force. Progressive overload on this lift is what changes the shape of the glutes most directly. This is the centerpiece of Monday.", form: [{ label: "Setup", text: "Upper back on bench just below the shoulder blades. Feet flat, hip-width, toes slightly out. Barbell or pad across the hip crease — not the stomach." }, { label: "SI joint awareness", text: "Before each set, press your lower back down and feel both sides of your hips level. If one side shifts when you drive up, reduce the load." }, { label: "Drive", text: "Breathe in, brace the core, tuck the chin. Drive through the heels until hips form a straight line from shoulders to knees." }, { label: "Top", text: "Squeeze both glutes hard and hold one full second. If you feel the lower back working, the hips are going too high — dial back the range." }, { label: "Watch for", text: "Lower back hyperextending at the top, knees caving inward, uneven hip height between left and right." }] },
      { name: "Romanian Deadlift (Dumbbell)", muscles: ["Hamstrings", "Glutes", "Lower Back"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3–4s down", why: "Hamstring-dominant movement that loads the muscle in a lengthened position. Dumbbell RDLs are safer on the lower back than barbell because the load stays closer to the body and allows a more natural path. The slow eccentric is where most of the muscle growth stimulus comes from.", form: [{ label: "Setup", text: "Stand holding dumbbells in front of the thighs. Feet hip-width, soft fixed knee bend that doesn't change." }, { label: "Hinge", text: "Push the hips backward, not downward. This is a hip hinge, not a squat. Dumbbells stay dragging down the legs throughout." }, { label: "Depth", text: "Lower until you feel a deep hamstring pull — usually mid-shin. Back stays completely flat. If the back rounds, that's your end range." }, { label: "SI note", text: "If one hip feels different from the other at the bottom, come up slightly. Asymmetrical loading at the SI joint under stretch is a risk." }, { label: "Watch for", text: "Squatting the weight by bending the knees, lower back rounding, dumbbells drifting away from the body." }] },
      { name: "Cable Pull-Through", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 3, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s return", why: "Glute and hamstring-dominant hip hinge with zero spinal loading — ideal for reinforcing the hip hinge pattern while protecting the lower back. The cable keeps constant tension through the entire movement unlike free weights.", form: [{ label: "Setup", text: "Cable at the lowest setting, rope attachment, stand facing away from the machine. Walk forward until there's tension. Feet slightly wider than hip-width." }, { label: "Hinge", text: "Push the hips back and let the rope travel between your legs. Keep a slight knee bend, back flat." }, { label: "Drive", text: "Squeeze the glutes and drive the hips forward to standing. Hips are the engine — don't use the arms." }, { label: "Watch for", text: "Squatting instead of hinging, back rounding, arms pulling the weight rather than the hips driving." }] },
      { name: "Single-Leg Hip Thrust (Bodyweight or Light)", muscles: ["Glutes"], category: "Compound Unilateral", order: 4, sets: 3, reps: "10–12 each side", rest: "90 sec", eccentric: "3s down", imbalanceNote: TARA_IMBALANCE_NOTE, why: "SI joint imbalance means each hip needs to be challenged independently. The single-leg version reveals and addresses any left-right strength and stability difference that bilateral thrusts mask.", form: [{ label: "Setup", text: "Same position as bilateral hip thrust. One foot flat, one knee bent and lifted — or one leg extended forward." }, { label: "Drive", text: "Push through the working heel. Drive the hip up until the body forms a straight line from shoulder to working knee." }, { label: "Stability", text: "The key is keeping the pelvis level at the top. If one side drops, that's the weaker hip stabilizer. Note it." }, { label: "Watch for", text: "Hips rotating when the non-working leg is free, lower back compensating for weak glute." }] },
      { name: "Cable Kickback (Glutes)", muscles: ["Glutes"], category: "Isolation Unilateral", order: 5, sets: 3, reps: "15–20 each side", rest: "60 sec", eccentric: "2s return", imbalanceNote: TARA_IMBALANCE_NOTE, why: "Isolates the glute at the fully contracted position — the range hip thrusts and RDLs load least. Finishes the glute with a pure contraction-focused movement.", form: [{ label: "Setup", text: "Ankle cuff at the lowest cable position. Stand facing the machine, slight forward lean, hands on the frame for balance." }, { label: "Kick", text: "Keep the knee slightly bent and drive the leg straight back until you feel the glute fully squeeze. Don't swing — controlled movement only." }, { label: "Watch for", text: "Rotating the torso to gain range, hyperextending the lower back, losing the glute squeeze by going too high." }] },
    ],
    core_finisher: [
      { name: "Dead Bug", bodyweight: true, muscles: ["Deep Core", "TVA"], category: "Core Stage 1", sets: 3, reps: "8–10 each side", rest: "45 sec", eccentric: "3s lowering",
        form: [{ label: "Setup", text: "Lie on your back. Arms straight up, knees at 90° in the air. Press your lower back fully into the floor — no gap." }, { label: "Move", text: "Exhale and brace. Slowly lower your right arm overhead and left leg toward the floor simultaneously. Return and switch." }, { label: "L5 note", text: "The moment your lower back lifts off the floor, the rep ends. This is the single most important core exercise for lumbar stability." }, { label: "Watch for", text: "Holding breath, moving too fast, or letting the lower back arch." }]
      },
      { name: "Banded Clamshell", bodyweight: true, muscles: ["Hip Abductors", "Glute Medius"], category: "Core Stage 1", sets: 3, reps: "15–20 each side", rest: "45 sec", eccentric: "—",
        form: [{ label: "Setup", text: "Lie on your side, band just above the knees. Hips stacked, knees bent at 45°, feet together." }, { label: "Open", text: "Rotate the top knee upward as far as you can without the hip rolling backward. Hold one second at the top." }, { label: "Why this matters", text: "SI joint instability is directly tied to weak hip abductors and glute medius. This is your most important corrective exercise." }, { label: "Watch for", text: "Hip rolling back to gain range, rushing through reps, or skipping the squeeze at the top." }]
      },
      { name: "Plank with Hip Tap", bodyweight: true, muscles: ["Core", "Obliques", "Glutes"], category: "Core Stage 2", sets: 3, reps: "10 each side", rest: "45 sec", eccentric: "—",
        form: [{ label: "Setup", text: "High plank position, hands under shoulders, body in a straight line." }, { label: "Tap", text: "Slowly rotate the hip down toward the floor on one side, tap gently, return to neutral. Keep hips as level as possible." }, { label: "Watch for", text: "Letting the hips sag, rushing, or losing the brace in the core." }]
      },
    ],
  },
  {
    day: "TUE", label: "Upper Body Pull", type: "pull",
    focus: "Upper Body — Back & Shoulders",
    muscles: ["Back", "Shoulders", "Biceps", "Rear Delts"],
    cardio: { name: "Incline Treadmill Walk or Rowing Machine", protocol: "Treadmill: 3.5 mph at 10% incline, 15 min. Rower: moderate pace, damper 4, 15 min.", zone: "Zone 2 (60–70% max HR)", feel: "Keep it conversational — this is active recovery paired with the session, not a hard cardio effort." },
    exercises: [
      { name: "Lat Pulldown (Wide Overhand)", muscles: ["Lats", "Bicep", "Rear Delt"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s return", why: "Primary pulling compound. Wide grip builds lat width which creates the upper body V-taper that makes the waist look smaller. Placed first while the back is fresh.", form: [{ label: "Setup", text: "Grip just outside shoulder width. Lock knees under the pad. Lean back about 20°." }, { label: "Pull", text: "Drive the elbows down toward your back pockets. Bring the bar to the upper chest." }, { label: "Return", text: "3 full seconds to the top. Let the arms extend fully — the shoulder blade stretch at the top is part of the stimulus." }, { label: "Watch for", text: "Pulling behind the neck, excessive lower back arch, or cutting the return short." }] },
      { name: "Seated Cable Row (Neutral Grip)", muscles: ["Mid Back", "Lats", "Bicep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s return", why: "Builds mid-back thickness. Neutral grip allows heavier loading and targets rhomboids and mid-traps alongside the lats.", form: [{ label: "Setup", text: "Sit tall, feet flat on footplates. Slight forward lean at the start." }, { label: "Row", text: "Drive elbows straight back, pull the handle to the lower sternum. Squeeze shoulder blades together and hold one second." }, { label: "Return", text: "3 full seconds to full arm extension. Let shoulder blades protract forward." }, { label: "Watch for", text: "Leaning back with the lower back, shoulder rounding on the return, jerking the weight." }] },
      { name: "Single-Arm Dumbbell Row", muscles: ["Lats", "Mid Back", "Bicep"], category: "Compound Unilateral", order: 3, sets: 3, reps: "10–12 each side", rest: "90 sec", eccentric: "3s down", imbalanceNote: TARA_IMBALANCE_NOTE, why: "Back strength differences left to right are common with scoliosis. Unilateral work lets you identify and address them directly.", form: [{ label: "Setup", text: "One knee and same-side hand on a bench. Working arm straight down, back flat." }, { label: "Stretch first", text: "Let the arm extend fully and shoulder blade drift forward slightly before pulling." }, { label: "Drive", text: "Pull the elbow straight back and slightly up toward your back pocket." }, { label: "Watch for", text: "Rotating the torso to swing the weight, or shortcutting the stretch at the bottom." }] },
      { name: "Face Pull (Cable)", muscles: ["Rear Delt", "External Rotators", "Upper Back"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "15–20", rest: "90 sec", eccentric: "2s return", why: "Essential for shoulder health and posture. Targets the rear delts and external rotators which are chronically weak in most people. Counterbalances all the pushing and pulling with improved shoulder mechanics.", form: [{ label: "Setup", text: "Cable at face height with rope attachment. Grip both ends, pull at eye level." }, { label: "Pull", text: "Pull the rope toward your forehead and spread the ends apart. Elbows should finish above shoulder height." }, { label: "Watch for", text: "Elbows dropping below shoulder level, or using too much weight causing form breakdown." }] },
      { name: "Alternating Dumbbell Curl", muscles: ["Bicep"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "10–12 each arm", rest: "90 sec", eccentric: "3s down", why: "Alternating allows full supination on each rep for maximum bicep contraction.", form: [{ label: "Supination", text: "As you curl, rotate the palm upward — pinky higher than thumb at the top." }, { label: "Upper arm", text: "Pin the upper arm to your side. It doesn't move." }, { label: "Return", text: "3 full seconds back to a dead hang. The bottom stretch is a growth signal." }, { label: "Watch for", text: "Swinging the torso, elbows drifting forward, or stopping short at the bottom." }] },
      { name: "Lateral Raise", muscles: ["Side Delt"], category: "Isolation Bilateral", order: 6, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "2s down", why: "Side delts define the shoulder and create the appearance of broader shoulders relative to the waist — important for the toned look.", form: [{ label: "Setup", text: "Slight forward lean. Dumbbells in front of the hips." }, { label: "Raise", text: "Lead with elbows. Pour water from a jug — pinky slightly higher than thumb. Stop at shoulder height." }, { label: "Watch for", text: "Shrugging the traps, raising above shoulder height, or letting arms drop quickly." }] },
    ],
    core_finisher: [
      { name: "Pallof Press (Cable)", muscles: ["Core", "Obliques"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "10–12 each side", rest: "45 sec", eccentric: "2s return",
        form: [{ label: "Setup", text: "Stand side-on to the cable at chest height. Both hands on the handle." }, { label: "Press", text: "Press straight out until arms are fully extended. Hold 1–2 seconds. Return to chest." }, { label: "The point", text: "The cable tries to rotate you. Your core resists that rotation. This builds the anti-rotation stability the SI joint depends on." }, { label: "Watch for", text: "Torso rotating toward the cable, feet shifting, or rushing through the hold." }]
      },
      { name: "Dead Bug", bodyweight: true, muscles: ["Deep Core", "TVA"], category: "Core Stage 1", sets: 2, reps: "8 each side", rest: "45 sec", eccentric: "3s lowering",
        form: [{ label: "Move", text: "Lower opposite arm and leg slowly while keeping the lower back completely flat. Switch and repeat." }, { label: "Watch for", text: "Any lower back lift — that ends the rep immediately." }]
      },
    ],
  },
  {
    day: "WED", label: "Legs — Quads & Glutes", type: "legs",
    focus: "Lower Body — Quad & Glute Definition",
    muscles: ["Quads", "Glutes", "Calves", "Core"],
    cardio: { name: "Stationary Bike or Elliptical", protocol: "Moderate resistance, 15–20 minutes at a pace where you can talk but feel your heart rate elevated.", zone: "Zone 2 (60–70% max HR)", feel: "Easy on the joints post-leg session. Keep the legs moving — blood flow accelerates recovery." },
    exercises: [
      { name: "Leg Press", muscles: ["Quads", "Glutes"], category: "Compound Bilateral", order: 1, sets: 4, reps: "10–12", rest: "2–3 min", eccentric: "3s down", why: "Quad-dominant compound without spinal loading. Safe for the lower back and ACL history when foot placement is correct. Placed first for the quad emphasis — posterior chain had its spotlight Monday.", form: [{ label: "Foot position", text: "Feet hip-width at mid-platform, toes slightly out. Higher foot position shifts more load to the glutes. Lower shifts to quads." }, { label: "Core", text: "Lower back pressed into the seat pad throughout. If it lifts, you've gone too deep or too heavy." }, { label: "Press", text: "Drive through the whole foot. Stop just short of full knee lockout to keep tension on the quad." }, { label: "ACL note", text: "Do not let the knees cave inward. If they do, reduce the weight." }] },
      { name: "Hip Thrust (Barbell or Machine)", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", why: "Second glute compound of the week at higher reps — metabolic and hypertrophy stimulus. Lower weight than Monday, higher reps to create a different training stress.", form: [{ label: "Form", text: "Identical to Monday. Upper back on bench, feet flat, drive through heels, squeeze at the top." }, { label: "Load", text: "Slightly lighter than Monday since this is the third day this week. Focus on the contraction quality." }, { label: "Watch for", text: "Lower back hyperextending, knees caving, uneven hip height." }] },
      { name: "Leg Extension", muscles: ["Quads"], category: "Isolation Bilateral", order: 3, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down", why: "Direct quad isolation for the toned leg appearance. The leg extension hits the terminal range of knee extension that compound movements miss — this is what creates quad definition.", form: [{ label: "Setup", text: "Pad just above the ankle. Back flat on the seat." }, { label: "Extension", text: "Extend to full knee extension and pause one second at the top. Feel the quad fully contracting." }, { label: "Return", text: "3 full seconds back. Do not let the stack clatter." }, { label: "ACL note", text: "If you feel any discomfort at the knee joint (not muscle), stop and reduce weight or range of motion." }] },
      { name: "Cable Hip Abduction (Standing)", muscles: ["Glute Medius", "Hip Abductors"], category: "Isolation Unilateral", order: 4, sets: 3, reps: "15–20 each side", rest: "60 sec", eccentric: "2s return", imbalanceNote: TARA_IMBALANCE_NOTE, why: "Hip abduction directly targets the glute medius — the muscle that stabilizes the SI joint and defines the outer glute. Essential for your injury history and for the hip curve you're after.", form: [{ label: "Setup", text: "Ankle cuff, cable at the lowest position. Stand side-on to the machine, hand on frame." }, { label: "Abduct", text: "Lift the leg out to the side with a straight knee. Stop at about 40–45°. Squeeze at the top." }, { label: "Watch for", text: "Torso leaning away from the movement, hiking the hip to assist, or losing balance." }] },
      { name: "Seated Calf Raise", muscles: ["Soleus"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "3s down", why: "Seated targets the soleus — the deeper calf muscle below the gastrocnemius. Full range required.", form: [{ label: "Stretch", text: "Drop heels as low as possible below the step to start from a full stretch." }, { label: "Rise", text: "Drive onto the ball of the foot as high as possible. Hold one second at the top." }, { label: "Watch for", text: "Partial range of motion — if you don't feel the stretch at the bottom, you're not going deep enough." }] },
    ],
    core_finisher: [
      { name: "Banded Clamshell", bodyweight: true, muscles: ["Hip Abductors", "Glute Medius"], category: "Core Stage 1", sets: 3, reps: "20 each side", rest: "45 sec", eccentric: "—",
        form: [{ label: "Setup", text: "Lie on your side, band just above knees, hips stacked, knees bent at 45°." }, { label: "Open", text: "Rotate the top knee up as far as you can without the hip rolling back. Hold one second." }, { label: "Why", text: "Your most important corrective movement for SI joint stability. Do these every session without skipping." }]
      },
      { name: "Plank", bodyweight: true, muscles: ["Core", "Glutes"], category: "Core Stage 1", sets: 3, reps: "40–60 sec", rest: "45 sec", eccentric: "—",
        form: [{ label: "Position", text: "Forearms on the floor, elbows under shoulders. Body in a straight line." }, { label: "Brace", text: "Squeeze glutes, brace abs, push floor away with forearms — all three at once." }, { label: "Watch for", text: "Hips sagging, hips piking up, or holding your breath." }]
      },
      { name: "Dead Bug", bodyweight: true, muscles: ["Deep Core", "TVA"], category: "Core Stage 1", sets: 3, reps: "8 each side", rest: "45 sec", eccentric: "3s lowering",
        form: [{ label: "Move", text: "Lower opposite arm and leg slowly. Lower back stays flat into the floor the entire time." }, { label: "Watch for", text: "Any lower back lift — that ends the rep." }]
      },
    ],
  },
  {
    day: "THU", label: "Upper Body Push", type: "push",
    focus: "Upper Body — Chest & Shoulders (Short Session)",
    muscles: ["Chest", "Shoulders", "Triceps", "Core"],
    cardio: null,
    exercises: [
      { name: "Dumbbell Bench Press", muscles: ["Chest", "Front Delt", "Tricep"], category: "Compound Bilateral", order: 1, sets: 3, reps: "8–12", rest: "2 min", eccentric: "3s down", why: "Primary chest compound. Short session today so 3 sets instead of 4.", form: [{ label: "Setup", text: "Lie flat, shoulder blades together and down. Feet flat on the floor." }, { label: "Descent", text: "3 seconds down to a deep chest stretch. Elbows at 45–60° from the torso." }, { label: "Press", text: "Drive up and slightly inward. Stop just short of lockout." }, { label: "Watch for", text: "Hips lifting, wrists collapsing, or dumbbells drifting over the face." }] },
      { name: "Seated Dumbbell Overhead Press", muscles: ["Shoulder", "Tricep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", why: "Shoulder compound second. Builds the rounded shoulder definition that creates shape.", form: [{ label: "Setup", text: "Upright bench at 90°. Dumbbells at shoulder height, palms forward." }, { label: "Core", text: "Brace and press lower back into the bench." }, { label: "Press", text: "Drive dumbbells up in a slight inward arc. Exhale on the press." }, { label: "Watch for", text: "Lower back arching away from the bench." }] },
      { name: "Incline Dumbbell Press", muscles: ["Upper Chest", "Front Delt"], category: "Compound Bilateral", order: 3, sets: 3, reps: "10–12", rest: "90 sec", eccentric: "3s down", why: "Upper chest focus — creates the chest shelf and the fullness that balances the shoulder.", form: [{ label: "Setup", text: "Bench at 30–45°. Scapular retraction held throughout." }, { label: "Descent", text: "Lower until upper chest stretch. 3 seconds down." }, { label: "Watch for", text: "Bench too steep turning it into a shoulder press." }] },
      { name: "Lateral Raise", muscles: ["Side Delt"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "2s down", why: "Side delt isolation for shoulder width and definition. High reps on the finisher.", form: [{ label: "Raise", text: "Lead with elbows. Pinky slightly higher than thumb. Stop at shoulder height." }, { label: "Watch for", text: "Shrugging traps, raising above shoulder height." }] },
      { name: "Tricep Rope Pushdown", muscles: ["Tricep"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "12–15", rest: "60 sec", eccentric: "2s return", why: "Tricep definition isolation. Arms make up two-thirds of upper arm size — direct work here is the fastest path to toned arms.", form: [{ label: "Setup", text: "Cable at top, rope attachment. Thumbs up grip." }, { label: "Upper arms", text: "Pin elbows to ribcage. They don't move." }, { label: "Push", text: "Drive to full extension and spread the rope ends apart." }, { label: "Watch for", text: "Upper arms lifting away from the body." }] },
    ],
    core_finisher: [
      { name: "Side Plank", bodyweight: true, muscles: ["Obliques", "Glute Medius"], category: "Core Stage 2", sets: 2, reps: "30–45 sec each side", rest: "30 sec", eccentric: "—",
        form: [{ label: "Setup", text: "On your side, forearm on the floor, elbow under shoulder. Feet stacked." }, { label: "Hold", text: "Drive hips up. Body forms a straight line. Squeeze the glute of the top leg." }, { label: "SI note", text: "If one side feels significantly harder, note which one — that's the hip stabilizer that needs more attention." }, { label: "Watch for", text: "Hips sagging, top shoulder rotating, or holding your breath." }]
      },
      { name: "Banded Clamshell", bodyweight: true, muscles: ["Hip Abductors", "Glute Medius"], category: "Core Stage 1", sets: 2, reps: "15 each side", rest: "30 sec", eccentric: "—",
        form: [{ label: "Setup", text: "Band above knees, on your side, hips stacked." }, { label: "Open", text: "Rotate top knee up without the hip rolling back. Squeeze at the top." }]
      },
    ],
  },
  {
    day: "FRI", label: "Cycle Class", type: "cardio",
    focus: "Cardio — Cycle Class",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Cardiovascular"],
    cardio: { name: "Cycle Class", protocol: "45-minute class. Stay in Zone 2–3 (60–80% max HR) for most of the class. During sprints, push to Zone 4–5 briefly then recover.", zone: "Zone 2–4", feel: "This counts as your cardio AND lower body volume for the week. Your legs are doing real work — embrace it." },
    exercises: [],
    core_finisher: [],
  },
  {
    day: "SAT", label: "Rest or Optional", type: "rest",
    focus: "Active Recovery or Light Session",
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
    title: "Your injury history is the foundation of this program",
    body: "Every exercise choice accounts for your L5 disc, scoliosis, SI joint, and ACL history. No squats, no conventional deadlifts. Hip thrusts, RDLs, cable pull-throughs, and leg press are your primary lower body compounds — all approved movements that load the glutes and hamstrings without the spinal compression or knee shear that would be a problem.",
  },
  {
    title: "Deep core work is non-negotiable",
    body: "The dead bug and Pallof press are in your program every single session. This is not optional filler — these movements train the TVA and deep stabilizers that support the L5 disc and the SI joint. Every set matters more than it looks.",
  },
  {
    title: "The SI joint requires bilateral awareness",
    body: "Your SI joint imbalance means one hip can shift more load to compensate when you're fatigued. On every unilateral exercise, start on the left side and match it exactly on the right. If the hips feel uneven during a hip thrust or single-leg movement, reduce the load, not the range.",
  },
  {
    title: "Recomp works through consistency, not extremes",
    body: "Your goal — dropping body fat while maintaining or increasing muscle — is a body recomposition. This requires progressive overload on the compound lifts combined with a small caloric deficit. Aim to add weight or reps every 1–2 weeks on the hip thrust, RDL, and leg press. That's what changes the shape.",
  },
  {
    title: "The Friday cycle class is part of your plan",
    body: "Your 45-minute cycle class counts as cardio volume and lower body work for the week. It's built into the program. The Zone 2 treadmill walks after Monday and Wednesday sessions are fat-burning steady-state — keep the pace conversational.",
  },
];
