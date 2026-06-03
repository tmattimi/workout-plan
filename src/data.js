export const IMBALANCE_NOTE = "Start with the left side every time. Match the right exactly and never do more. If there's a gap of 2 or more reps, hold the same weight on both sides until they catch up. Once they're equal for two sessions in a row, add weight to both together.";

export const schedule = [
  {
    day: "MON", label: "Push", type: "push",
    focus: "Push — Chest Focus",
    muscles: ["Chest", "Shoulders", "Triceps"],
    cardio: { name: "Incline Treadmill", protocol: "4.0 to 4.5 mph at 8 to 12% incline for 20 minutes", zone: "Zone 3 (65–75% max HR)", feel: "Breathing is noticeably elevated. Short sentences only, not fully conversational. Hold that the whole 20 minutes." },
    exercises: [
      { name: "Dumbbell Bench Press", muscles: ["Chest", "Front Delt", "Tricep"], category: "Compound Bilateral", order: 1, sets: 4, reps: "6–10", rest: "2–3 min", eccentric: "3s down", why: "Opens the session as the primary chest compound. Dumbbells mean each side has to generate its own force independently — the right side cannot carry the left, which is what makes them better than a barbell for catching and correcting asymmetry.", form: [{ label: "Setup", text: "Lie flat with feet firmly planted. Pull the shoulder blades together and down toward your back pockets. Hold that position the entire set." }, { label: "Elbows", text: "Hold the dumbbells at chest height with elbows at roughly 45–60° from your torso. Wrists stacked directly over elbows." }, { label: "Descent", text: "Take 3 full seconds to lower until you feel a deep stretch across the chest. Elbows stay above the torso plane." }, { label: "Press", text: "Drive back up along the same arc, thinking about pushing the chest up. Stop just short of lockout so the chest stays under tension." }, { label: "Breathing", text: "Breathe in on the way down. Brace your core hard at the bottom, then exhale as you press." }, { label: "Watch for", text: "Hips lifting off the bench, wrists collapsing backward, or dumbbells drifting too far over the face or stomach." }] },
      { name: "Incline Dumbbell Press", muscles: ["Upper Chest", "Front Delt", "Tricep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "8–12", rest: "2 min", eccentric: "3s down", why: "The incline shifts the load to the clavicular head of the pec — what builds the upper chest shelf. Second compound while the CNS is still fresh.", form: [{ label: "Setup", text: "Set the bench to 30 to 45 degrees. Steeper than that and it becomes a shoulder press. Same scapular retraction as the flat press." }, { label: "Descent", text: "Lower until the dumbbells are at upper chest level and you feel the upper pec stretch. If there is no stretch, go a little deeper." }, { label: "Press", text: "Drive up and very slightly inward. Exhale on the press. Stop just before full lockout." }, { label: "Watch for", text: "Bench set too steep, neck craning forward, or cutting the range of motion short at the bottom." }] },
      { name: "Single-Arm Overhead DB Press", muscles: ["Shoulder", "Tricep", "Core"], category: "Compound Unilateral", order: 3, sets: 3, reps: "10–12 each side", rest: "90 sec", eccentric: "3s down", imbalanceNote: IMBALANCE_NOTE, why: "Shoulder strength is one of the most common places left and right diverge. Each side has to stabilize and press alone here.", form: [{ label: "Setup", text: "Seated on an upright bench with one dumbbell at shoulder height, palm facing forward." }, { label: "Core", text: "Big breath in and brace hard before every single rep. Your torso must not lean away from the working side." }, { label: "Press", text: "Drive straight up with the dumbbell tracking in line with your ear. Exhale on the press." }, { label: "Watch for", text: "Lateral torso lean, wrist collapsing backward, or the elbow swinging forward during the press." }] },
      { name: "Cable Fly (Low-to-High)", muscles: ["Lower Chest", "Front Delt"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s return", why: "Cable keeps tension on the chest throughout the full arc. A dumbbell fly drops to near zero resistance at peak contraction.", form: [{ label: "Setup", text: "Both cables at the lowest position. Slight forward lean from the hips." }, { label: "Arms", text: "Lock in a slight elbow bend and keep it fixed the entire rep." }, { label: "Arc", text: "Sweep both handles up and across in a wide arc." }, { label: "Top", text: "Squeeze the chest hard at the top and hold for one full second." }, { label: "Watch for", text: "Elbow bend changing mid-rep, shrugging the shoulders, or rotating the torso." }] },
      { name: "Lateral Raise", muscles: ["Side Delt"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s down", why: "Side delts get almost no stimulus from pressing movements and need direct work. This is what builds shoulder width.", form: [{ label: "Setup", text: "Stand with a slight forward lean from the hips. Dumbbells hang in front of the hips." }, { label: "Raise", text: "Lead with the elbows. Think about pouring water from a jug, pinky slightly higher than thumb. Stop at shoulder height." }, { label: "Watch for", text: "Shrugging the traps, raising above shoulder height, or letting the arms drop quickly." }] },
      { name: "Overhead Tricep Extension", muscles: ["Tricep Long Head"], category: "Isolation Bilateral", order: 6, sets: 3, reps: "10–15", rest: "90 sec", eccentric: "3s down", why: "The only tricep exercise that fully stretches the long head, which is the largest portion. Every other variation misses this.", form: [{ label: "Setup", text: "Cable: high pulley, face away, hold rope overhead. DB: hold one dumbbell with both hands overhead." }, { label: "Upper arms fixed", text: "Upper arms stay completely still. Only the forearms move." }, { label: "Descent", text: "3 full seconds down into a deep stretch in the tricep." }, { label: "Watch for", text: "Elbows flaring wide, upper arms moving, or not reaching the full stretch at the bottom." }] },
      { name: "Tricep Rope Pushdown", muscles: ["Tricep"], category: "Isolation Bilateral", order: 7, sets: 2, reps: "15–20", rest: "60 sec", eccentric: "2s return", why: "High-rep finisher for the lateral and medial tricep heads — different stimulus from the overhead extension.", form: [{ label: "Setup", text: "Cable at the top with a rope attachment. Grip the ends with thumbs pointing up." }, { label: "Upper arms", text: "Pin the elbows to the ribcage — they do not move." }, { label: "Push", text: "Drive down to full extension and spread the rope ends apart at the bottom." }, { label: "Watch for", text: "Upper arms lifting away from the body or letting the rope snap back." }] },
    ],
  core_finisher: [
    { name: "Dead Bug", bodyweight: true, muscles: ["Deep Core", "TVA"], category: "Core Stage 1", bodyweight: true, sets: 3, reps: "8–10 each side", rest: "45 sec", eccentric: "3s lowering",
      form: [
        { label: "Setup", text: "Lie on your back. Arms straight up, knees at 90° in the air. Press your lower back fully into the floor — no gap at all." },
        { label: "Move", text: "Exhale and brace hard. Slowly lower your right arm overhead and left leg toward the floor at the same time. Return and switch sides." },
        { label: "The rule", text: "The moment your lower back lifts off the floor, the rep is over. Quality over quantity here." },
        { label: "Watch for", text: "Holding your breath, moving too fast, or letting the lower back arch." }
      ]
    },
    { name: "Plank", bodyweight: true, muscles: ["Core", "Glutes"], category: "Core Stage 1", bodyweight: true, sets: 3, reps: "45–60 sec", rest: "45 sec", eccentric: "—",
      form: [
        { label: "Position", text: "Forearms on the floor, elbows under shoulders. Toes on the floor, body in a straight line." },
        { label: "Brace", text: "Squeeze the glutes, brace the abs, and push the floor away with your forearms simultaneously. All three at once." },
        { label: "Progression", text: "Once 60 seconds feels easy, add alternating shoulder taps while keeping the hips completely still." },
        { label: "Watch for", text: "Hips sagging, hips piking up, or holding your breath." }
      ]
    },
  ],
  },
  {
    day: "TUE", label: "Pull", type: "pull",
    focus: "Pull — Back Focus",
    muscles: ["Back", "Biceps", "Rear Delts"],
    cardio: { name: "Rowing Machine or Incline Treadmill", protocol: "Rower: moderate pace at damper 4 to 5 for 20 minutes. Treadmill: 4.0 mph at 10% incline.", zone: "Zone 3 (65–75% max HR)", feel: "The rower keeps the pulling pattern moving at low load. Breathing stays elevated throughout." },
    exercises: [
      { name: "Lat Pulldown (Wide Overhand)", muscles: ["Lats", "Bicep", "Rear Delt"], category: "Compound Bilateral", order: 1, sets: 4, reps: "6–10", rest: "2–3 min", eccentric: "3s return", why: "Heaviest pull of the session so it goes first. Wide grip builds lat width and develops the strength pattern for unassisted pull-ups.", form: [{ label: "Setup", text: "Grip just outside shoulder width. Lock knees firmly under the pad. Lean back about 20°." }, { label: "Pull", text: "Think about driving the elbows down toward your back pockets. Bring the bar to the upper chest." }, { label: "Return", text: "3 full seconds back to the top. Let the bar travel all the way up so the shoulder blades can spread. That stretch at the top is part of the range." }, { label: "Watch for", text: "Pulling the bar behind the neck, excessive lower back arch, or cutting the return short." }] },
      { name: "Seated Cable Row (Neutral Grip)", muscles: ["Mid Back", "Lats", "Bicep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s return", why: "Builds mid-back thickness. Neutral grip lets you load heavier and hits the rhomboids and mid-traps alongside the lats.", form: [{ label: "Setup", text: "Sit tall with feet flat on the footplates. Lean slightly forward from the hips at the start." }, { label: "Row", text: "Drive the elbows straight back and pull the handle to the lower sternum. Squeeze the shoulder blades together and hold a full second." }, { label: "Return", text: "3 full seconds to full arm extension. Let shoulder blades protract forward at the end." }, { label: "Watch for", text: "Leaning back with the lower back to help, shoulder rounding on the return, or jerking the weight." }] },
      { name: "Single-Arm Dumbbell Row", muscles: ["Lats", "Mid Back", "Bicep"], category: "Compound Unilateral", order: 3, sets: 3, reps: "10–12 each side", rest: "90 sec", eccentric: "3s down", imbalanceNote: IMBALANCE_NOTE, why: "Left/right back strength differences cannot be addressed with bilateral exercises alone. Each side has to work independently.", form: [{ label: "Setup", text: "One knee and same-side hand on a bench. Working arm hanging straight down. Back flat." }, { label: "Stretch first", text: "Before pulling, let the arm extend fully and the shoulder blade drift forward slightly." }, { label: "Drive", text: "Pull the elbow straight back and slightly up — toward your back pocket. Pull until dumbbell reaches the lower chest." }, { label: "Watch for", text: "Rotating the torso to swing the weight, or shortcutting the stretch at the bottom." }] },
      { name: "Straight-Arm Cable Pulldown", muscles: ["Lats"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s return", why: "Isolates the lats without involving the biceps at all. Builds the lat mind-muscle connection that makes every pull more effective.", form: [{ label: "Setup", text: "Cable at the top. Stand about 2 feet back with a slight hip hinge, arms extended overhead." }, { label: "Arms stay straight", text: "Lock in a slight elbow bend and do not change it. Any significant bend and the lat isolation is gone." }, { label: "Arc", text: "Sweep the bar down in a wide arc to the hips." }, { label: "Watch for", text: "Significant elbow bending or the cable yanking the torso forward." }] },
      { name: "Alternating Dumbbell Curl", muscles: ["Bicep"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "10–12 each arm", rest: "90 sec", eccentric: "3s down", why: "Alternating allows full supination at the top of each rep, maximizing peak contraction.", form: [{ label: "Supination", text: "As you curl, rotate the palm upward. By the top, pinky should be higher than thumb." }, { label: "Upper arm", text: "Pin the upper arm to your side the entire rep." }, { label: "Return", text: "3 full seconds back to a complete dead hang. The bottom stretch is a growth stimulus." }, { label: "Watch for", text: "Swinging the torso, elbows drifting forward, or stopping short at the bottom." }] },
      { name: "Incline Dumbbell Curl", muscles: ["Bicep Long Head"], category: "Isolation Bilateral", order: 6, sets: 3, reps: "10–12", rest: "90 sec", eccentric: "3s down", why: "The incline position puts the long head of the bicep on full stretch before the curl even begins. Best exercise for building bicep peak.", form: [{ label: "Setup", text: "Bench at 45–60°. Arms hang freely behind the torso — behind the body when extended." }, { label: "Key point", text: "Keep elbows back. Drifting them forward before curling removes the long head stretch immediately." }, { label: "Return", text: "3 slow seconds back to full extension." }, { label: "Watch for", text: "Elbows drifting forward, momentum at the bottom, or cutting range of motion short." }] },
      { name: "Rear Delt Fly (Bent-Over)", muscles: ["Rear Delt", "Upper Back"], category: "Isolation Bilateral", order: 7, sets: 3, reps: "15–20", rest: "60 sec", eccentric: "2s return", why: "Critical for shoulder health with four push sessions per week. High reps here are intentional because rear delts are slow-twitch dominant.", form: [{ label: "Setup", text: "Hinge forward until the torso is nearly parallel to the floor. Use lighter dumbbells." }, { label: "Raise", text: "Lead with the elbows. Spread the wings. Squeeze the back of the shoulders at the top." }, { label: "Watch for", text: "Going too heavy causing body swing, or shrugging instead of contracting the rear delt." }] },
    ],
  core_finisher: [
    { name: "Pallof Press (Cable)", muscles: ["Core", "Obliques"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "10–12 each side", rest: "45 sec", eccentric: "2s return",
      form: [
        { label: "Setup", text: "Stand side-on to the cable stack with the cable at chest height. Hold the handle with both hands at your chest." },
        { label: "Press", text: "Press the handle straight out until your arms are fully extended. Hold for 1–2 seconds. Return to the chest." },
        { label: "The point", text: "The cable is trying to rotate you toward the stack. Your core resists that rotation the entire time. Shoulders and hips stay square." },
        { label: "Watch for", text: "Torso rotating toward the cable, feet shifting, or rushing through the hold." }
      ]
    },
    { name: "Dead Bug", bodyweight: true, muscles: ["Deep Core", "TVA"], category: "Core Stage 1", bodyweight: true, sets: 2, reps: "8 each side", rest: "45 sec", eccentric: "3s lowering",
      form: [
        { label: "Setup", text: "Lie on your back, arms up, knees at 90°. Lower back pressed flat into the floor." },
        { label: "Move", text: "Lower opposite arm and leg slowly while keeping the lower back completely flat. Switch and repeat." },
        { label: "Watch for", text: "Any lower back lift — that ends the rep immediately." }
      ]
    },
  ],
  },
  {
    day: "WED", label: "Legs", type: "legs",
    focus: "Legs — Posterior Chain",
    muscles: ["Glutes", "Hamstrings", "Quads", "Calves"],
    cardio: { name: "Stationary Bike", protocol: "Resistance 6 to 8 out of 10 for 20 minutes", zone: "Zone 3 (65–75% max HR)", feel: "Legs will be fatigued. That's fine. Hold the heart rate steady with consistent pedaling." },
    exercises: [
      { name: "Hip Thrust (Barbell or Machine)", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s down", why: "The most effective glute exercise. It loads the glute at full hip extension where peak resistance occurs. Progressive overload is the focus here week over week.", form: [{ label: "Setup", text: "Upper back on bench just below the shoulder blades. Feet flat, hip-width, toes slightly out. Barbell padded across the hip crease." }, { label: "Before driving", text: "Breathe in, brace the core, tuck the chin. Chin stays tucked the entire set." }, { label: "Drive", text: "Push through the heels. Drive the hips up until the body forms a straight line from shoulders to knees." }, { label: "Top", text: "Squeeze the glutes hard and hold one full second. If you feel it in the lower back, the hips are going too high." }, { label: "Watch for", text: "Lower back hyperextending, knees caving inward, or pushing through the toes instead of heels." }] },
      { name: "Romanian Deadlift (Dumbbell)", muscles: ["Hamstrings", "Glutes", "Lower Back"], category: "Compound Bilateral", order: 2, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3–4s down", why: "Primary hamstring compound, placed second while the posterior chain is warm. Loads the hamstrings in a stretched position. Stretch-loaded training produces better hypertrophy than contracted-position training.", form: [{ label: "Setup", text: "Stand holding dumbbells in front of the thighs. Feet hip-width, soft fixed knee bend — don't change it." }, { label: "Hinge", text: "Push the hips backward, not downward. This is a hip hinge, not a squat. Dumbbells stay close to the legs throughout." }, { label: "Depth", text: "Lower until a deep hamstring pull — usually mid-shin to ankle. The back must stay flat." }, { label: "Watch for", text: "Squatting the weight by bending the knees, lower back rounding, or dumbbells drifting away from the body." }] },
      { name: "Leg Press", muscles: ["Quads", "Glutes"], category: "Compound Bilateral", order: 3, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", why: "Third compound after the posterior chain has been loaded. Targets the quads heavily with the machine removing balance demands.", form: [{ label: "Foot position", text: "Hip-width at mid-platform, toes slightly out." }, { label: "Core", text: "Lower back pressed into the seat pad throughout. If it peels off, too deep or too heavy." }, { label: "Press", text: "Drive through the whole foot. Stop just short of full knee lockout." }, { label: "Watch for", text: "Lower back lifting off the pad, knees caving, full lockout at the top." }] },
      { name: "Bulgarian Split Squat (Dumbbell)", muscles: ["Quads", "Glutes", "Hamstrings"], category: "Compound Unilateral", order: 4, sets: 3, reps: "8–10 each leg", rest: "2 min", eccentric: "3s down", imbalanceNote: IMBALANCE_NOTE, why: "Addresses the half-inch left/right thigh size difference directly. The right leg cannot compensate for the left when each is working alone.", form: [{ label: "Setup", text: "2 feet in front of a bench. Top of rear foot on the bench — laces down. Front foot far enough forward that the shin stays vertical when you lower." }, { label: "Descent", text: "Drop straight down rather than forward. Front knee stays over the toes. Lower until rear knee is 2 inches from the floor." }, { label: "Torso", text: "Keep the chest up throughout." }, { label: "Watch for", text: "Rear foot wrong (top of foot, not ankle), front knee caving, torso collapsing forward." }] },
      { name: "Leg Extension", muscles: ["Quads"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down", why: "Direct quad isolation filling in the terminal range compound movements miss.", form: [{ label: "Setup", text: "Pad just above the ankle. Back flat on the seat." }, { label: "Extension", text: "Extend to full knee extension and pause one second at the top." }, { label: "Return", text: "3 full seconds back. Do not let the stack clatter." }] },
      { name: "Standing Calf Raise", muscles: ["Gastrocnemius"], category: "Isolation Bilateral", order: 6, sets: 4, reps: "15–20", rest: "60 sec", eccentric: "3s down", why: "Gastrocnemius targeted with straight knee. Full range is required — partial reps produce almost nothing.", form: [{ label: "Stretch", text: "Start by dropping heels as far below the step as possible. This is what most people skip." }, { label: "Rise", text: "Drive onto the ball of the foot as high as possible. Hold one second at the top." }, { label: "Watch for", text: "Bouncing at the bottom, not reaching full elevation, bending the knees." }] },
    ],
  core_finisher: [
    { name: "Cable Crunch", muscles: ["Abs"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "12–15", rest: "45 sec", eccentric: "2s return",
      form: [
        { label: "Setup", text: "Rope attachment at the top pulley. Kneel facing the stack, rope ends held beside your ears." },
        { label: "Crunch", text: "Pull the elbows toward the knees — flex the spine, don't just pull with the arms. The lower back should round slightly at the bottom." },
        { label: "Return", text: "2 controlled seconds back to full extension. Feel the abs stretch at the top." },
        { label: "Watch for", text: "Pulling with the arms instead of crunching the spine, or sitting back into the hips." }
      ]
    },
    { name: "Dead Bug", muscles: ["Deep Core", "TVA"], category: "Core Stage 1", bodyweight: true, sets: 3, reps: "8 each side", rest: "45 sec", eccentric: "3s lowering",
      form: [
        { label: "Setup", text: "Lie on your back, arms straight up, knees at 90°. Press the lower back fully into the floor." },
        { label: "Move", text: "Lower opposite arm and leg slowly toward the floor. Return and switch. Lower back stays flat the entire time." },
        { label: "Watch for", text: "Any lower back lift — that ends the rep." }
      ]
    },
  ],
  },
  {
    day: "THU", label: "Push", type: "push",
    focus: "Push — Shoulder Focus",
    muscles: ["Shoulders", "Chest", "Triceps"],
    cardio: { name: "Incline Treadmill", protocol: "4.0 to 4.5 mph at 8 to 12% incline for 20 minutes", zone: "Zone 3 (65–75% max HR)", feel: "Same target as Monday. Breathing noticeably elevated, short sentences only." },
    exercises: [
      { name: "Seated Dumbbell Overhead Press", muscles: ["Shoulder", "Tricep", "Upper Chest"], category: "Compound Bilateral", order: 1, sets: 4, reps: "6–10", rest: "2–3 min", eccentric: "3s down", why: "Primary shoulder compound first. Seated removes lower back involvement. Dumbbells let each shoulder work independently.", form: [{ label: "Setup", text: "Upright bench at 90°. Dumbbells at shoulder height, palms forward." }, { label: "Core", text: "Breathe in, brace hard, press lower back into the bench. It stays in contact throughout." }, { label: "Press", text: "Drive both dumbbells up in a slight inward arc. Exhale on the press." }, { label: "Watch for", text: "Lower back arching away from the bench, wrists collapsing backward." }] },
      { name: "Arnold Press", muscles: ["All 3 Delt Heads", "Tricep"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", why: "Works all three deltoid heads through the rotation arc — more complete shoulder stimulus than a standard press.", form: [{ label: "Start", text: "Hold dumbbells in front of the face with palms facing you. Elbows at 90° pointing forward." }, { label: "Movement", text: "As you press up, rotate wrists so palms face away by the time arms are extended. Rotation and press are one movement." }, { label: "Return", text: "Reverse exactly — lower while rotating palms back toward you. 3 full seconds." }, { label: "Watch for", text: "Rushing through the rotation, starting with arms too wide." }] },
      { name: "Incline Dumbbell Press", muscles: ["Upper Chest", "Front Delt", "Tricep"], category: "Compound Bilateral", order: 3, sets: 3, reps: "8–12", rest: "2 min", eccentric: "3s down", note: "Same form as Monday. Shoulder compounds came first so expect slightly less load.", why: "Second weekly upper chest session. Placed third after shoulder compounds since chest is secondary today.", form: [{ label: "Form", text: "Same as Monday. Bench at 30–45°, scapular retraction held, 3-second descent." }, { label: "Load", text: "Expect to use slightly less than Monday since shoulder work came first — log both." }] },
      { name: "Rear Delt Fly (Bent-Over)", muscles: ["Rear Delt", "Upper Back"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "15–20", rest: "90 sec", eccentric: "2s return", why: "This push day is heavy on front-delt pressing (overhead press, Arnold, incline) with no posterior shoulder work. The rear delt is the most under-trained head and balances all that anterior volume — critical for shoulder health and a complete delt. Replaces a third redundant overhead press.", form: [{ label: "Setup", text: "Hinge forward until the torso is nearly parallel to the floor. Use lighter dumbbells than you think." }, { label: "Raise", text: "Lead with the elbows. Spread the wings. Squeeze the back of the shoulders at the top." }, { label: "Watch for", text: "Going too heavy causing body swing, or shrugging instead of contracting the rear delt." }] },
      { name: "Cable Lateral Raise (Single-Arm)", muscles: ["Side Delt"], category: "Isolation Unilateral", order: 5, sets: 3, reps: "15–20 each side", rest: "90 sec", eccentric: "2s return", imbalanceNote: "If one shoulder is noticeably weaker, start there and match reps. Cable reveals asymmetry more clearly because tension is constant.", why: "Cable keeps tension at the bottom of the range where dumbbells have near zero resistance.", form: [{ label: "Setup", text: "Stand side-on to the stack. Cable at lowest position. Grab with the hand farthest from the stack." }, { label: "Raise", text: "Lift the arm out to the side leading with the elbow. Stop at shoulder height." }, { label: "Watch for", text: "Shrugging to assist, raising above shoulder height, or rotating the torso." }] },
      { name: "Cable Fly (Low-to-High)", muscles: ["Lower Chest", "Front Delt"], category: "Isolation Bilateral", order: 6, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s return", note: "Same as Monday. Cable at the lowest position, sweep up and across, full squeeze at the top.", why: "Second weekly chest isolation. Bilateral to keep it efficient.", form: [{ label: "Setup", text: "Both cables at the lowest position. Slight forward lean from the hips." }, { label: "Arms", text: "Lock in a slight elbow bend and keep it fixed the entire rep." }, { label: "Arc", text: "Sweep both handles up and across in a wide arc." }, { label: "Top", text: "Squeeze the chest hard at the top and hold for one full second." }, { label: "Watch for", text: "Elbow bend changing mid-rep, shrugging the shoulders, or rotating the torso." }] },
      { name: "Tricep Rope Pushdown", muscles: ["Tricep"], category: "Isolation Bilateral", order: 7, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "2s return", note: "Same as Monday. Elbows pinned to ribs, spread the rope at full extension.", why: "Second weekly tricep isolation. Different stimulus from the overhead extension on Monday.", form: [{ label: "Setup", text: "Cable at the top with a rope attachment. Grip the ends with thumbs pointing up." }, { label: "Upper arms", text: "Pin the elbows to the ribcage. They do not move." }, { label: "Push", text: "Drive down to full extension and spread the rope ends apart at the bottom." }, { label: "Watch for", text: "Upper arms lifting away from the body or letting the rope snap back." }] },
    ],
  core_finisher: [
    { name: "Side Plank", bodyweight: true, muscles: ["Obliques", "Glutes"], category: "Core Stage 2", bodyweight: true, sets: 2, reps: "30–45 sec each side", rest: "30 sec", eccentric: "—",
      form: [
        { label: "Setup", text: "On your side, forearm on the floor, elbow under your shoulder. Feet stacked or staggered." },
        { label: "Hold", text: "Drive the hips up — body forms a straight line from head to feet. Squeeze the glute of the top leg." },
        { label: "Watch for", text: "Hips sagging toward the floor, top shoulder rotating toward the ceiling, or holding your breath." }
      ]
    },
    { name: "Plank", bodyweight: true, muscles: ["Core", "Glutes"], category: "Core Stage 1", bodyweight: true, sets: 2, reps: "45–60 sec", rest: "45 sec", eccentric: "—",
      form: [
        { label: "Brace", text: "Glutes squeezed, abs braced, push the floor away with your forearms. All three at once." },
        { label: "Watch for", text: "Hips sagging or piking, neck craning forward." }
      ]
    },
  ],
  },
  {
    day: "FRI", label: "Pull", type: "pull",
    focus: "Pull — Bicep Focus & Core",
    muscles: ["Back", "Biceps", "Rear Delts", "Core"],
    cardio: { name: "Rowing Machine", protocol: "Moderate pace at damper 4 to 5 for 20 minutes", zone: "Zone 3 (65–75% max HR)", feel: "Keeps the back and arms moving at low load through the recovery window. Breathing stays elevated." },
    exercises: [
      { name: "Pull-Up (or Assisted Pull-Up)", bodyweight: true, muscles: ["Lats", "Bicep", "Core"], category: "Compound Bilateral", order: 1, sets: 4, reps: "Max reps (or 6–8 assisted)", rest: "2–3 min", eccentric: "3s down", why: "Primary compound and the key weekly progress marker. Tracking rep increases week over week is one of the clearest indicators of lat and bicep development.", form: [{ label: "Grip", text: "Overhand, just outside shoulder width. Full dead hang at the bottom." }, { label: "Before pulling", text: "Depress and retract the shoulder blades before you start pulling." }, { label: "Pull", text: "Drive the elbows down and back. Pull until the chin clears the bar." }, { label: "Eccentric", text: "3 full seconds on the way down. This is the fastest path to unassisted pull-ups." }, { label: "Watch for", text: "Kipping, not reaching a dead hang at the bottom, or craning the neck." }] },
      { name: "Chest-Supported DB Row", muscles: ["Mid Back", "Lats", "Rear Delt"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", why: "Chest support removes lower back involvement completely — pure mid-back work. Allows heavier loading without lower back fatigue late in the week.", form: [{ label: "Setup", text: "Incline bench at 30–45°. Lie face-down, chest on the pad. Arms hanging straight down." }, { label: "Row", text: "Drive both elbows straight back and up. Squeeze lat and mid-back hard at the peak." }, { label: "Return", text: "3 seconds down to a full dead hang." }, { label: "Watch for", text: "Lifting the head to assist, rotating the torso, or cutting range short." }] },
      { name: "Face Pull (Rope Attachment)", muscles: ["Rear Delt", "External Rotators"], category: "Isolation Bilateral", order: 3, sets: 4, reps: "15–20", rest: "90 sec", eccentric: "2s return", why: "Rear delts are the priority here — also trains external rotation essential for shoulder health under four push sessions per week.", form: [{ label: "Setup", text: "Cable at face height. Grip rope ends with thumbs pointing up." }, { label: "Pull", text: "Pull toward the face, splitting the ends apart. Elbows rise high and wide." }, { label: "Top", text: "Wrists beside ears, elbows high. Squeeze rear delts. Hold one second." }, { label: "Watch for", text: "Elbows dropping low turning it into a row, or pulling to the neck instead of the face." }] },
      { name: "Hammer Curl", muscles: ["Brachialis", "Bicep"], category: "Isolation Bilateral", order: 4, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down", why: "Neutral grip targets the brachialis — the muscle underneath the bicep that pushes the bicep up when developed.", form: [{ label: "Grip", text: "Neutral grip throughout — thumb pointing up at all times. No rotation." }, { label: "Form", text: "Upper arm pinned to the side. Full extension at the bottom. Full contraction at the top." }, { label: "Watch for", text: "Wrist supinating mid-rep, upper arm swinging forward." }] },
      { name: "Cable Curl (Low Pulley)", muscles: ["Bicep"], category: "Isolation Bilateral", order: 5, sets: 3, reps: "12–15", rest: "90 sec", eccentric: "3s down", why: "Cable provides resistance at full arm extension — the point where dumbbell resistance drops to almost nothing.", form: [{ label: "Key difference", text: "Pause briefly at full extension and feel the cable pulling. That bottom tension is what makes this different from dumbbell curls." }, { label: "Return", text: "3 full seconds back to extension." }] },

    ],
  core_finisher: [
    { name: "Dead Bug", muscles: ["Deep Core", "TVA"], category: "Core Stage 1", bodyweight: true, sets: 3, reps: "8–10 each side", rest: "45 sec", eccentric: "3s lowering",
      form: [
        { label: "Setup", text: "Lie on your back. Arms straight up, knees at 90° in the air. Press your lower back fully into the floor — no gap." },
        { label: "Move", text: "Exhale and brace. Lower opposite arm and leg simultaneously toward the floor. Return and switch sides." },
        { label: "Watch for", text: "Any lower back lift — that ends the rep immediately." }
      ]
    },
    { name: "Pallof Press (Cable)", muscles: ["Core", "Obliques"], category: "Core Stage 2", bodyweight: false, sets: 3, reps: "10–12 each side", rest: "45 sec", eccentric: "2s return",
      form: [
        { label: "Setup", text: "Kneel or stand side-on to the cable stack, cable at chest height. Hold the handle with both hands." },
        { label: "Press", text: "Press straight out to full arm extension. Hold 1–2 seconds. The cable tries to rotate you — resist that completely." },
        { label: "Watch for", text: "Torso rotating toward the stack, feet shifting, or rushing the hold." }
      ]
    },
    { name: "Hanging Knee Raise", muscles: ["Abs", "Hip Flexors"], category: "Core Stage 3", bodyweight: true, sets: 3, reps: "10–15", rest: "45 sec", eccentric: "3s down",
      form: [
        { label: "Hang", text: "Dead hang from the bar. Shoulder blades depressed and retracted before you start." },
        { label: "Raise", text: "Bring knees up toward the chest. At the top, tilt the pelvis posteriorly — curl the tailbone toward the ceiling. That tilt is what makes it abs and not just hip flexors." },
        { label: "Return", text: "3 full seconds back to a complete dead hang. No swinging." },
        { label: "Watch for", text: "Using momentum, not curling the pelvis at the top, legs dropping fast." }
      ]
    },
  ],
  },
  {
    day: "SAT", label: "Legs", type: "legs",
    focus: "Legs — Quad Focus & Core",
    muscles: ["Quads", "Glutes", "Hamstrings", "Calves", "Core"],
    cardio: { name: "Stationary Bike or Brisk Walk", protocol: "Bike: resistance 6 to 8 out of 10 for 20 minutes. Walk: brisk with hills if available.", zone: "Zone 3 (65–75% max HR)", feel: "End of the week. Legs will be more fatigued than Wednesday. Hold the heart rate target anyway." },
    exercises: [
      { name: "Leg Press", muscles: ["Quads", "Glutes"], category: "Compound Bilateral", order: 1, sets: 4, reps: "8–10", rest: "2–3 min", eccentric: "3s down", note: "Slightly lower foot position than Wednesday for more quad bias. Same core brace — lower back stays on the pad.", why: "Quad-focused bilateral compound placed first today. Lower rep range and higher load than Wednesday for a different stimulus.", form: [{ label: "Foot position", text: "Slightly lower than Wednesday to increase quad bias. Hip-width, toes slightly out." }, { label: "Core", text: "Lower back stays pressed into the seat pad throughout. If it peels off, reduce depth or weight." }, { label: "Press", text: "Drive through the whole foot. Stop just short of full knee lockout." }, { label: "Watch for", text: "Lower back lifting off the pad, knees caving, or locking out at the top." }] },
      { name: "Hip Thrust (Barbell or Machine)", muscles: ["Glutes", "Hamstrings"], category: "Compound Bilateral", order: 2, sets: 3, reps: "10–12", rest: "2 min", eccentric: "3s down", note: "Same form as Wednesday. Glutes are pre-fatigued from leg press so slightly less load is normal. Still aim to beat last Saturday.", why: "Second weekly glute compound. Glutes handle high frequency well and need the volume.", form: [{ label: "Setup", text: "Upper back on the bench just below the shoulder blades. Feet flat, hip-width, toes slightly out. Barbell padded across the hip crease." }, { label: "Before driving", text: "Breathe in, brace the core, tuck the chin. Chin stays tucked the entire set." }, { label: "Drive", text: "Push through the heels. Drive the hips up until the body forms a straight line from shoulders to knees." }, { label: "Top", text: "Squeeze the glutes hard and hold one full second. If you feel it in the lower back, the hips are going too high." }, { label: "Watch for", text: "Lower back hyperextending, knees caving inward, or pushing through the toes instead of heels." }] },
      { name: "Bulgarian Split Squat (Dumbbell)", muscles: ["Quads", "Glutes", "Hamstrings"], category: "Compound Unilateral", order: 3, sets: 3, reps: "10–12 each leg", rest: "90 sec", eccentric: "3s down", imbalanceNote: IMBALANCE_NOTE, note: "Higher rep range than Wednesday — same weight or slightly less. Left leg first. Today is the volume day for this movement.", why: "Second weekly unilateral leg session. Higher rep range than Wednesday for additional volume. Left leg first every time.", form: [{ label: "Setup", text: "2 feet in front of a bench. Top of rear foot on the bench, laces down. Front foot far enough forward that the shin stays vertical when you lower." }, { label: "Descent", text: "Drop straight down rather than forward. Front knee stays over the toes. Lower until the rear knee is about 2 inches from the floor." }, { label: "Torso", text: "Keep the chest up throughout. Do not fold forward." }, { label: "Watch for", text: "Rear foot placed wrong, front knee caving inward, or torso collapsing forward." }] },
      { name: "Single-Leg Hamstring Curl", muscles: ["Hamstrings"], category: "Isolation Unilateral", order: 4, sets: 3, reps: "12–15 each leg", rest: "90 sec", eccentric: "3s return", imbalanceNote: IMBALANCE_NOTE, why: "Most direct tool for finding and closing the left/right hamstring strength difference contributing to the thigh size asymmetry.", form: [{ label: "Extension", text: "Full leg extension before every rep. The stretch at the bottom is where the stimulus is." }, { label: "Curl", text: "Curl heel toward glute for full contraction at the top." }, { label: "Return", text: "3 full seconds back to full extension. This eccentric is the most important part." }, { label: "Watch for", text: "Hips lifting off the pad, short range of motion, or weight dropping fast." }] },
      { name: "Goblet Squat", muscles: ["Quads", "Glutes", "Core"], category: "Compound Bilateral", order: 5, sets: 3, reps: "15–20", rest: "90 sec", eccentric: "3s down", why: "High-rep quad and glute metabolic finisher. Goblet position enforces upright torso maximizing quad depth.", form: [{ label: "Hold", text: "One dumbbell vertically at chest. Elbows point downward." }, { label: "Descent", text: "Sit down and between the knees. Elbows track inside the knees at the bottom." }, { label: "Watch for", text: "Heels lifting, torso collapsing forward, knees caving on the way up." }] },
      { name: "Seated Calf Raise", muscles: ["Soleus"], category: "Isolation Bilateral", order: 6, sets: 4, reps: "15–20", rest: "60 sec", eccentric: "3s down", why: "Seated targets the soleus — a different, deeper calf muscle the standing raise barely touches.", form: [{ label: "Range", text: "Full heel drop at the bottom, rise as high as possible. Hold one second at the top." }, { label: "Return", text: "3 controlled seconds. No bouncing." }] },

    ],
  core_finisher: [
    { name: "Ab Wheel Rollout", muscles: ["Core", "Lats"], category: "Core Stage 3", bodyweight: true, sets: 3, reps: "8–10", rest: "45 sec", eccentric: "3s out",
      form: [
        { label: "Brace", text: "Before moving, breathe in and brace hard. Lower back stays neutral the entire roll — the moment it arches, you've gone too far." },
        { label: "Roll", text: "3 slow seconds out as far as you can while maintaining neutral spine." },
        { label: "Return", text: "Pull back using abs and lats together. Brace throughout the whole rep." },
        { label: "Progression", text: "Start with short rolls just past the knees. Add range as strength builds." }
      ]
    },
    { name: "Side Plank", muscles: ["Obliques", "Glutes"], category: "Core Stage 2", bodyweight: true, sets: 2, reps: "30–45 sec each side", rest: "30 sec", eccentric: "—",
      form: [
        { label: "Setup", text: "On your side, forearm on the floor, elbow under your shoulder. Feet stacked or staggered." },
        { label: "Hold", text: "Drive hips up — body straight from head to feet. Squeeze the glute of the top leg and brace the abs." },
        { label: "Watch for", text: "Hips sagging toward the floor, top shoulder rotating toward the ceiling." }
      ]
    },
    { name: "Plank", muscles: ["Core", "Glutes"], category: "Core Stage 1", bodyweight: true, sets: 2, reps: "45–60 sec", rest: "30 sec", eccentric: "—",
      form: [
        { label: "Brace", text: "Squeeze glutes, brace abs, push the floor away with your forearms — all three at once." },
        { label: "Progression", text: "Once 60 seconds feels easy, add alternating shoulder taps while keeping hips completely still." }
      ]
    },
  ],
  },
  {
    day: "SUN", label: "Rest", type: "rest",
    focus: "Active Recovery",
    muscles: [],
    exercises: [
      { name: "Light Walk", muscles: ["Full Body"], category: "Recovery", order: 1, sets: 1, reps: "20–30 min", rest: "—", eccentric: "—", why: "Easy movement supports blood flow and nutrient delivery.", form: [{ label: "Pace", text: "Fully conversational. Outdoors if possible." }] },
      { name: "Hip Flexor Stretch", muscles: ["Hip Flexors"], category: "Mobility", order: 2, sets: 2, reps: "60 sec each side", rest: "30 sec", eccentric: "—", why: "Heavy split squats and lunges shorten the hip flexors over time.", form: [{ label: "Position", text: "Kneeling lunge. Push the front hip gently forward. 60 seconds each side." }] },
      { name: "Chest and Shoulder Doorway Stretch", muscles: ["Chest", "Front Delt"], category: "Mobility", order: 3, sets: 2, reps: "30–45 sec each side", rest: "30 sec", eccentric: "—", why: "Four push sessions per week creates anterior tightness — this directly counters it.", form: [{ label: "Position", text: "Forearm on doorframe at 90°. Lean gently through the doorway." }] },
      { name: "Cat-Cow", muscles: ["Spine", "Core"], category: "Mobility", order: 4, sets: 2, reps: "10 slow reps", rest: "—", eccentric: "—", why: "Spinal mobility to reduce stiffness from the week's loading.", form: [{ label: "Movement", text: "On hands and knees. Breathe in as you arch (cow). Breathe out as you round (cat). Slow and deliberate." }] },
      { name: "Foam Roll", muscles: ["Full Body"], category: "Recovery", order: 5, sets: 1, reps: "5–10 min", rest: "—", eccentric: "—", why: "Reduces perceived soreness.", form: [{ label: "Technique", text: "Move slowly. Hold tender spots for 20–30 seconds. Priority: quads, hamstrings, glutes, upper back." }] },
    ],
  },
];

export const principles = [
  {
    section: "Technique",
    entries: [
      {
        id: "core_brace",
        title: "Core Bracing",
        body: "Before every compound set, breathe into the belly so the abdomen expands — not the chest. Then brace the abs hard in all directions, like you are about to take a hit. Hold that brace through the entire rep. This creates intra-abdominal pressure that stabilizes the spine and protects the discs. Releasing the brace mid-rep under heavy load is one of the most common causes of lower back injury.",
        tags: ["core", "spine", "breathing", "compound", "safety"],
      },
      {
        id: "scapular_retraction",
        title: "Scapular Retraction and Depression",
        body: "Pulling the shoulder blades together (retraction) and down toward the back pockets (depression) before a pressing or pulling movement stabilizes the shoulder joint and protects the rotator cuff. On bench press, rows, and pull-ups this position should be set before the first rep and held throughout the set. If the shoulder blades lose position mid-rep, the shoulder joint takes stress it was not designed to handle.",
        tags: ["shoulder", "pressing", "pulling", "setup"],
      },
      {
        id: "hip_hinge",
        title: "Hip Hinge",
        body: "A hip hinge means pushing the hips backward rather than bending the knees downward. The spine stays neutral — not rounding, not hyperextending. It is the foundation of deadlifts, Romanian deadlifts, and good mornings. A simple test: stand near a wall and push your hips back to touch it without letting your chest fall forward or your knees bend significantly. That is a hip hinge.",
        tags: ["deadlift", "RDL", "lower body", "spine"],
      },
      {
        id: "eccentric",
        title: "Eccentric Phase",
        body: "The lowering portion of any rep — the descent on a squat, the drop on a curl, the return on a lat pulldown. This is where most of the hypertrophic stimulus comes from. Eccentric loading creates more micro-damage in the muscle fiber, which triggers the repair and growth response. Every exercise in this program has a prescribed eccentric tempo of 2 to 3 seconds. Dropping the weight quickly instead of controlling it cuts that stimulus in half.",
        tags: ["tempo", "form", "hypertrophy", "reps"],
      },
      {
        id: "posterior_pelvic_tilt",
        title: "Posterior Pelvic Tilt",
        body: "Tilting the pelvis so the tailbone curls toward the floor and the lower back flattens slightly. At the top of a hip thrust or at the top of a hanging knee raise, achieving a posterior pelvic tilt ensures the glutes or abs — not the hip flexors or lower back — are completing the movement. Without it, the wrong muscles finish the rep.",
        tags: ["glutes", "core", "hip thrust", "hanging knee raise", "pelvis"],
      },
      {
        id: "neutral_spine",
        title: "Neutral Spine",
        body: "The natural position of the spine with its three gentle curves intact — a slight inward curve at the lower back (lumbar lordosis), a slight outward curve at the upper back (thoracic kyphosis), and a slight inward curve at the neck. Not flat. Not arched. Neutral. This is the safest position for the spine under load because it distributes force evenly across the vertebrae and discs.",
        tags: ["spine", "lower back", "safety", "posture"],
      },
      {
        id: "supination_pronation",
        title: "Supination and Pronation",
        body: "Supination means rotating the forearm so the palm faces upward. Pronation means rotating it so the palm faces downward. In curling movements, supinating at the top of the curl — so the pinky is higher than the thumb — maximizes bicep contraction. Neutral grip, where the thumb points up throughout, shifts more of the work to the brachialis, the muscle directly underneath the bicep.",
        tags: ["bicep", "curl", "grip", "forearm"],
      },
      {
        id: "foot_drive",
        title: "Foot Drive and Heel Pressure",
        body: "Pressing through the heels rather than the toes during lower body exercises — squats, leg press, hip thrusts — keeps the load on the glutes and hamstrings rather than shifting it to the quads and knees. If the heels lift or you can wiggle your toes freely under load, the foot drive is off. On hip thrusts specifically, heel pressure is what differentiates a glute-dominant rep from a quad-dominant one.",
        tags: ["lower body", "squat", "hip thrust", "glutes", "knees"],
      },
      {
        id: "elbow_tuck",
        title: "Elbow Position on Press",
        body: "During pressing movements, elbows should track at 45 to 60 degrees from the torso — not flared out to 90 degrees (which stresses the shoulder joint) and not tucked completely to the body (which shifts load entirely to the triceps). The 45 to 60 degree angle keeps the shoulder in a mechanically strong position and distributes the work appropriately between the chest, front delt, and tricep.",
        tags: ["bench press", "pressing", "shoulder", "chest"],
      },
      {
        id: "lat_engagement",
        title: "Lat Engagement",
        body: "Activating the lats before a pull creates a stable, powerful shoulder girdle. Think about pulling your shoulder blades into your back pockets, or trying to bend the bar you are hanging from. On pull-ups and lat pulldowns, the lats initiate the pull — not the arms. Starting the pull with the arms instead of the lats is the most common reason people fail to develop lat thickness despite years of pulling.",
        tags: ["lats", "pull-up", "lat pulldown", "back", "pulling"],
      },
    ],
  },
  {
    section: "Key Terms",
    entries: [
      {
        id: "progressive_overload",
        title: "Progressive Overload",
        body: "The principle that the body only adapts when it is asked to do more than it has done before. In practice: add one rep or 2.5 to 5 lbs to an exercise each session. When you can complete all prescribed sets at the top of the rep range with clean form, add weight next session. Without progressive overload, training is maintenance at best.",
        tags: ["fundamentals", "strength", "adaptation"],
      },
      {
        id: "hypertrophy",
        title: "Hypertrophy",
        body: "The increase in size of individual muscle fibers caused by resistance training and adequate protein. Hypertrophy is maximized by training in the 6 to 12 rep range with enough volume (total sets per muscle per week), appropriate rest between sets, and consistent progressive overload over time.",
        tags: ["muscle growth", "fundamentals", "reps"],
      },
      {
        id: "compound_vs_isolation",
        title: "Compound vs. Isolation",
        body: "Compound exercises involve multiple joints and muscle groups working together — bench press, squat, row, hip thrust. Isolation exercises target one muscle with one joint — curl, lateral raise, leg extension. Compound movements go first in every session because they require the most neuromuscular effort. Isolation exercises follow to add volume to specific muscles without taxing the whole system.",
        tags: ["exercise selection", "order", "fundamentals"],
      },
      {
        id: "bilateral_unilateral",
        title: "Bilateral and Unilateral",
        body: "Bilateral exercises use both limbs at once — barbell press, leg press, lat pulldown. Unilateral exercises use one limb at a time — single-arm row, Bulgarian split squat, single-leg curl. Bilateral movements allow heavier loads. Unilateral movements expose left-right imbalances that bilateral exercises hide because the stronger side compensates for the weaker.",
        tags: ["imbalance", "exercise selection", "strength"],
      },
      {
        id: "1rm",
        title: "1RM (One-Rep Max)",
        body: "The maximum weight you can lift for exactly one full rep with proper form. Training loads are often set as a percentage of 1RM. Strength work happens at 85 to 97 percent of 1RM. Muscle-building work at 67 to 85 percent. Endurance-focused work at 50 to 65 percent. You do not need to test your 1RM directly — the app estimates it from your working sets.",
        tags: ["strength", "loading", "percentages"],
      },
      {
        id: "rpe",
        title: "RPE (Rate of Perceived Exertion)",
        body: "A 1 to 10 scale for how hard a set feels relative to your maximum. RPE 7 means you have 3 reps left before failure. RPE 8 means 2 reps left. RPE 9 means 1 rep left. RPE 10 is absolute failure. Most working sets in this program target RPE 7 to 9 — genuinely challenging, but never grinding to failure on every set.",
        tags: ["effort", "intensity", "sets"],
      },
      {
        id: "doms",
        title: "DOMS (Delayed Onset Muscle Soreness)",
        body: "The soreness that appears 24 to 72 hours after training. It is caused by micro-damage in the muscle fiber from eccentric loading — the same damage that triggers the repair and growth response. DOMS is normal, especially after a new exercise or rep range. It is not an indicator of injury. Training through mild DOMS is appropriate. Sharp, joint-level pain is not DOMS.",
        tags: ["soreness", "recovery", "safety"],
      },
      {
        id: "drop_set",
        title: "Drop Set",
        body: "Immediately after completing a working set, reduce the weight by 10 to 20 percent and continue for additional reps with no rest. Drop sets extend the time a muscle is under tension past the point of fatigue at the working weight. They are used sparingly — typically on the last set of an isolation exercise — because the recovery cost is higher than standard sets.",
        tags: ["advanced", "technique", "sets", "fatigue"],
      },
      {
        id: "superset",
        title: "Superset",
        body: "Two exercises performed back to back with no rest between them, followed by a rest period. When paired exercises target opposing muscle groups — like biceps and triceps, or chest and back — one muscle rests while the other works. This keeps the session efficient without sacrificing performance. Supersets in this program are paired deliberately based on muscle recovery patterns.",
        tags: ["efficiency", "sets", "program design"],
      },
      {
        id: "warmup_set",
        title: "Warm-Up Set",
        body: "A set performed before working sets using a lighter load — typically 40 to 60 percent of the working weight. The purpose is to rehearse the movement pattern, increase blood flow to the muscle, and prime the neuromuscular connection before the heavier loads. Warm-up sets are not counted toward your working volume. They are especially important on heavy compound lifts at the start of a session.",
        tags: ["sets", "preparation", "injury prevention"],
      },
      {
        id: "zone3",
        title: "Zone 3 Cardio",
        body: "65 to 75 percent of maximum heart rate. At this intensity, breathing is elevated and sustained conversation is difficult but short sentences are possible. Zone 3 targets aerobic capacity and fat oxidation. It is harder than a casual walk and easier than high-intensity intervals. The 20-minute post-lift cardio in this program targets Zone 3 specifically because it builds aerobic capacity without the recovery cost of harder efforts.",
        tags: ["cardio", "heart rate", "aerobic"],
      },
      {
        id: "rest_periods",
        title: "Rest Periods",
        body: "The time between sets matters. 2 to 3 minutes between compound sets allows the phosphocreatine energy system to partially replenish, which means better performance on the next set and more total volume across the session. 90 seconds to 2 minutes between isolation sets is sufficient. Guessing rest almost always results in shorter rests than intended — use a timer.",
        tags: ["sets", "recovery", "performance"],
      },
    ],
  },
  {
    section: "Muscle Groups",
    entries: [
      {
        id: "lats",
        title: "Lats (Latissimus Dorsi)",
        body: "The large fan-shaped muscle that runs from the upper arm down to the lower back. It is responsible for pulling the arm toward the body — the primary mover in pull-ups, lat pulldowns, and rows. Well-developed lats create the V-taper silhouette. The lats are also critical stabilizers during pressing and squatting movements.",
        tags: ["back", "pulling", "anatomy"],
      },
      {
        id: "glutes",
        title: "Glutes (Gluteus Maximus, Medius, Minimus)",
        body: "The largest and most powerful muscle group in the body. The gluteus maximus drives hip extension — the finishing movement in squats, hip thrusts, and deadlifts. The gluteus medius stabilizes the pelvis laterally, which is why weak glutes cause knee collapse on squats and lunges. Hip thrusts, Bulgarian split squats, and RDLs are the primary glute builders in this program.",
        tags: ["lower body", "anatomy", "hip extension"],
      },
      {
        id: "hamstrings",
        title: "Hamstrings",
        body: "Three muscles running along the back of the thigh responsible for knee flexion and hip extension. They are trained with a stretch bias in RDLs — meaning the peak stimulus occurs when the muscle is lengthened under load. This stretch-based loading produces superior hypertrophy compared to exercises where the hamstrings work only in a shortened position.",
        tags: ["lower body", "anatomy", "knee", "hip"],
      },
      {
        id: "quads",
        title: "Quads (Quadriceps)",
        body: "Four muscles on the front of the thigh that extend the knee. The primary movers in squats, leg press, and Bulgarian split squats. The vastus medialis — the teardrop-shaped muscle above the inner knee — is often the weak link and the one most targeted by full-range squatting movements.",
        tags: ["lower body", "anatomy", "knee extension"],
      },
      {
        id: "rear_delt",
        title: "Rear Delts (Posterior Deltoid)",
        body: "The back portion of the shoulder muscle. Often underdeveloped because most pressing and isolation shoulder work targets the front and side delts. Weak rear delts contribute to forward shoulder posture and increase injury risk in overhead pressing. Face pulls and rear delt flies are programmed specifically to address this imbalance.",
        tags: ["shoulder", "anatomy", "posture", "balance"],
      },
      {
        id: "deep_core",
        title: "Deep Core (TVA and Diaphragm)",
        body: "The transverse abdominis (TVA) is the deepest layer of abdominal muscle, wrapping around the spine like a corset. It works with the diaphragm to create intra-abdominal pressure during bracing. Most people's visible abs are the rectus abdominis — the superficial 'six-pack' muscle — but the deep core is what actually protects the spine under load. Dead Bugs and Planks train the TVA specifically.",
        tags: ["core", "anatomy", "spine", "stability"],
      },
      {
        id: "brachialis",
        title: "Brachialis",
        body: "A muscle that runs underneath the bicep and is the primary elbow flexor. Unlike the bicep, it is active regardless of forearm rotation, which means it responds best to neutral grip (hammer) curls where the thumb points up throughout. Developing the brachialis pushes the bicep upward and creates more arm thickness overall.",
        tags: ["arms", "anatomy", "curl", "bicep"],
      },
    ],
  },
];
