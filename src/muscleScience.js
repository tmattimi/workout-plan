// Muscle science database — each group has anatomy, regions, activation science, and alternatives
// Grounded in exercise science literature (Schoenfeld, NSCA, anatomy texts)

export const muscleGroups = [
  {
    id: "glutes",
    name: "Glutes",
    
    color: "#fce8e8",
    accent: "#a02a2a",
    summary: "The glutes are three muscles that form the largest muscle group in the body. They control hip extension, abduction, and rotation — and are the primary driver of most lower body power.",
    regions: [
      {
        name: "Gluteus Maximus",
        role: "The largest of the three. Responsible for hip extension — pushing the hips forward from a bent position. Most active at full hip extension, which is why hip thrusts are uniquely effective: peak resistance coincides with peak glute activation.",
        bestExercises: ["Hip Thrust", "Single-Leg Hip Thrust", "Romanian Deadlift", "Bulgarian Split Squat"],
        scienceNote: "Research consistently shows the hip thrust produces the highest EMG activation of the glute max compared to squats, deadlifts, or any other exercise (Contreras et al., 2015). The glute max is nearly fully shortening at the top of a hip thrust — uniquely efficient."
      },
      {
        name: "Gluteus Medius",
        role: "The mid-glute. Responsible for hip abduction (moving the leg out to the side) and stabilizing the pelvis during single-leg movements. Weakness here causes knee cave in squats and lunges.",
        bestExercises: ["Bulgarian Split Squat", "Walking Lunge", "Single-Leg Hip Thrust", "Lateral Band Walk"],
        scienceNote: "The glute med is most active during single-leg stance phases. Training it directly reduces injury risk and improves bilateral squat mechanics. Unilateral exercises are more effective at activating it than bilateral ones."
      },
      {
        name: "Gluteus Minimus",
        role: "The smallest and deepest. Assists the medius with abduction and internal rotation. Often undertrained but important for hip stability.",
        bestExercises: ["Single-Leg Hip Thrust", "Bulgarian Split Squat", "Lateral Band Walk"],
        scienceNote: "The glute min works in synergy with the med. Any exercise effectively targeting the medius also recruits the minimus. Direct isolation is rarely necessary."
      }
    ],
    weeklyStrategy: "Trained directly twice per week — Wednesday as the primary focus (hip thrust leads the session) and Saturday as the secondary session. The hip thrust is the single best exercise for glute max development and is placed first on its priority day.",
    alternatives: ["Barbell Hip Thrust (machine version)", "Cable Pull-Through", "Sumo Deadlift", "Step-Up", "Reverse Lunge"]
  },
  {
    id: "hamstrings",
    name: "Hamstrings",
    
    color: "#fef3e4",
    accent: "#c47a0a",
    summary: "The hamstrings are a group of three muscles running down the back of the thigh. They work in two ways: knee flexion (curling the leg) and hip extension (extending at the hip). Most exercises only train one function — complete hamstring development requires training both.",
    regions: [
      {
        name: "Biceps Femoris (Long Head)",
        role: "The largest hamstring muscle. Crosses both the hip and knee, making it active in both hip extension and knee flexion. The long head is best targeted by exercises that load it in a stretched position — hip-hinge movements where the hip is flexed.",
        bestExercises: ["Romanian Deadlift", "Single-Leg Hamstring Curl", "Nordic Curl"],
        scienceNote: "Stretch-loaded training produces superior hypertrophy compared to peak-contracted loading. The RDL loads the biceps femoris long head maximally in the stretched position — this is why the RDL outperforms leg curls alone for hamstring size (Maeo et al., 2021)."
      },
      {
        name: "Semimembranosus and Semitendinosus",
        role: "The two medial hamstring muscles. Primarily active during knee flexion. The semimembranosus is larger and produces more force; the semitendinosus sits more superficially. Both are well targeted by leg curl variations.",
        bestExercises: ["Single-Leg Hamstring Curl", "Romanian Deadlift", "Good Morning"],
        scienceNote: "Isolated leg curls hit the medial hamstrings more effectively than hip hinge exercises. This is why both the RDL and hamstring curl are in the program — they complement each other by targeting different aspects of the same muscle group."
      }
    ],
    weeklyStrategy: "The RDL is the primary hamstring compound on Wednesday, placed second in the session immediately after the hip thrust while the posterior chain is maximally warm. The single-leg hamstring curl on Saturday directly addresses the left/right strength difference contributing to the half-inch thigh size asymmetry.",
    alternatives: ["Nordic Hamstring Curl", "Good Morning", "Leg Curl Machine (bilateral)", "Cable Pull-Through", "Glute-Ham Raise"]
  },
  {
    id: "quads",
    name: "Quadriceps",
    
    color: "#fef3e4",
    accent: "#c47a0a",
    summary: "Four muscles on the front of the thigh. Their primary job is extending the knee. They're also active in hip flexion (rectus femoris only). The quads are the largest muscle group in the legs and respond well to both heavy compound loading and direct isolation work.",
    regions: [
      {
        name: "Rectus Femoris",
        role: "The only quad that crosses the hip — it flexes the hip as well as extends the knee. It's most active at longer muscle lengths, which is why deep squats and leg presses with significant hip flexion are effective.",
        bestExercises: ["Leg Press", "Goblet Squat", "Bulgarian Split Squat"],
        scienceNote: "The rectus femoris is frequently undertrained because it's difficult to fully stretch during many quad exercises. A deeper range of motion on squats and presses maximizes its stimulus."
      },
      {
        name: "Vastus Lateralis",
        role: "The outer quad — the most visible from the side. Primary force producer in knee extension. Narrow stance positions tend to emphasize this muscle.",
        bestExercises: ["Leg Press (narrow stance)", "Leg Extension", "Bulgarian Split Squat"],
        scienceNote: "The VL is typically the dominant contributor to knee extension force. It's well activated by most quad exercises but responds particularly well to the leg extension because of the peak contraction at full extension."
      },
      {
        name: "Vastus Medialis",
        role: "The teardrop-shaped inner quad. Responsible for the final degrees of knee extension and knee stability. Weakness here contributes to patellar tracking issues.",
        bestExercises: ["Leg Extension (last 15–30° of extension)", "Bulgarian Split Squat", "Goblet Squat"],
        scienceNote: "The VM is maximally active at full knee extension — the exact position held at the top of each leg extension rep. The 1-second pause at full extension specifically targets this."
      },
      {
        name: "Vastus Intermedius",
        role: "The deepest quad, running directly under the rectus femoris. Assists in overall knee extension. Cannot be directly isolated — trained through all compound quad movements.",
        bestExercises: ["Leg Press", "Goblet Squat", "Leg Extension"],
        scienceNote: "The VI activates alongside the other vasti during knee extension. It doesn't require special attention — any effective quad training recruits it."
      }
    ],
    weeklyStrategy: "Legs A (Wednesday) hits the quads third in the session after the posterior chain. Legs B (Saturday) puts the leg press first as the primary quad compound. The leg extension in both sessions provides direct isolation for the terminal range of motion compounds miss.",
    alternatives: ["Hack Squat", "Leg Extension (single-leg)", "Step-Up", "Sissy Squat", "Cyclist Squat"]
  },
  {
    id: "chest",
    name: "Chest (Pectorals)",
    emoji: "",
    color: "#e9f0fb",
    accent: "#2563a8",
    summary: "The pectorals are a fan-shaped muscle with fibers running in different directions across the chest. Different fiber orientations mean different exercises stress different regions. Most people overdevelop the mid-chest from flat pressing while neglecting the upper and lower portions.",
    regions: [
      {
        name: "Clavicular Head (Upper Chest)",
        role: "Runs from the collarbone to the humerus. Responsible for shoulder flexion and horizontal adduction at an upward angle. This is the region that creates chest 'thickness' and the upper shelf appearance. Almost exclusively trained with incline angles.",
        bestExercises: ["Incline Dumbbell Press", "Cable Fly Low-to-High", "Incline Cable Fly"],
        scienceNote: "EMG studies show the upper pec is significantly more active during incline pressing (30–45°) than flat or decline. The clavicular head has independent motor unit recruitment — flat pressing alone does not adequately develop it."
      },
      {
        name: "Sternal Head (Mid/Lower Chest)",
        role: "The largest portion, running from the sternum to the humerus. Handles most of the force in flat pressing. Responsible for horizontal adduction and shoulder flexion.",
        bestExercises: ["Dumbbell Bench Press", "Cable Fly", "Dips"],
        scienceNote: "The sternal head is maximally activated during flat pressing movements. It reaches peak stretch at the bottom of a dumbbell press — which is why the 3-second descent is emphasized to maximize time under tension in the stretched position."
      }
    ],
    weeklyStrategy: "Chest is the Monday Push A priority — the dumbbell bench press opens that session. Thursday Push B hits the upper chest first with the incline press taking the primary slot. Total weekly chest volume: 9–11 sets across two sessions.",
    alternatives: ["Barbell Bench Press", "Dips", "Cable Crossover (various angles)", "Push-Up Variations", "Pec Deck"]
  },
  {
    id: "back",
    name: "Back (Lats and Mid-Back)",
    
    color: "#ebf5e6",
    accent: "#2d7a1e",
    summary: "The back is the most complex muscle group — it contains multiple muscles with different attachment points, fiber directions, and functions. Training it fully requires both vertical pulling (for lat width) and horizontal pulling (for mid-back thickness).",
    regions: [
      {
        name: "Latissimus Dorsi",
        role: "The largest back muscle, creating the V-taper. Runs from the lower spine and pelvis up to the humerus. Responsible for shoulder adduction and extension — pulling the arms down and back. Width comes from lat development.",
        bestExercises: ["Lat Pulldown", "Pull-Up", "Straight-Arm Pulldown", "Single-Arm Row"],
        scienceNote: "The lat is unique in that it has no direct insertion into the spine — it originates from the thoracolumbar fascia. This means it can be trained through a very long range of motion. The dead hang position at the bottom of a pull-up or pulldown is where maximum lat stretch occurs — cutting the return short removes much of the stimulus."
      },
      {
        name: "Rhomboids and Mid-Traps",
        role: "Located between the shoulder blades. Responsible for scapular retraction — pulling the shoulder blades together. Critical for posture and shoulder health. Developed primarily through horizontal rowing.",
        bestExercises: ["Seated Cable Row", "Single-Arm Dumbbell Row", "Chest-Supported Row", "Face Pull"],
        scienceNote: "The rhomboids and mid-traps require the scapulae to be fully retracted at the end of each row. This is why the 1-second squeeze at the peak of rowing movements is prescribed — it maximizes time in the position where these muscles are most contracted."
      },
      {
        name: "Teres Major",
        role: "A smaller muscle that assists the lat in shoulder adduction and extension. Sometimes called the 'lat's little helper.' Trained by the same exercises that hit the lats.",
        bestExercises: ["Lat Pulldown", "Pull-Up", "Single-Arm Row"],
        scienceNote: "The teres major acts synergistically with the lat. It cannot be isolated but is fully recruited during any effective lat exercise."
      },
      {
        name: "Lower Traps",
        role: "Pull the shoulder blades down and inward. Critical for proper shoulder mechanics, especially during overhead pressing. Undertrained in most programs.",
        bestExercises: ["Pull-Up (shoulder depression at initiation)", "Lat Pulldown", "Face Pull"],
        scienceNote: "Depressing the shoulder blades before initiating a pull-up or pulldown specifically recruits the lower traps. This is why shoulder blade depression is cued before every pulling rep — it's not just form, it's targeting an often-neglected muscle."
      }
    ],
    weeklyStrategy: "Pull A (Tuesday) leads with lat pulldown and seated row as bilateral compounds, then one unilateral row. Pull B (Friday) opens with pull-ups as the progress marker. Face pulls in both Pull sessions protect shoulder health under heavy push volume.",
    alternatives: ["Barbell Row", "T-Bar Row", "Meadows Row", "Inverted Row", "Rope Climbing (if available)"]
  },
  {
    id: "shoulders",
    name: "Shoulders (Deltoids)",
    
    color: "#f3eafa",
    accent: "#7a3aa0",
    summary: "The deltoid has three distinct heads that require different exercises to fully develop. Most pressing movements hit the front delt heavily but neglect the side and rear. A complete shoulder program needs direct work for all three.",
    regions: [
      {
        name: "Anterior (Front) Delt",
        role: "Responsible for shoulder flexion — raising the arm in front. Gets heavy stimulus from all pressing movements. Almost universally overdeveloped relative to the other two heads in people who press frequently.",
        bestExercises: ["Overhead Press", "Arnold Press", "Incline Press (secondary)"],
        scienceNote: "The front delt is recruited during all horizontal and vertical pressing. Someone doing four push sessions per week already has significant front delt volume — adding direct front raises is usually unnecessary and can contribute to the shoulder imbalances that cause injury."
      },
      {
        name: "Lateral (Side) Delt",
        role: "Responsible for raising the arm out to the side (abduction). Creates shoulder WIDTH — the muscle most people are thinking of when they want 'capped shoulders.' Gets minimal stimulus from pressing; requires direct lateral raise work.",
        bestExercises: ["Lateral Raise (Dumbbell)", "Cable Lateral Raise", "Arnold Press"],
        scienceNote: "The side delt is nearly silent during bench press and only moderately active during overhead press. Research shows direct lateral raise work is the most effective way to target it. Cable lateral raises are preferred over dumbbell raises because they maintain tension at the bottom of the range where the resistance curve of dumbbells drops to zero."
      },
      {
        name: "Posterior (Rear) Delt",
        role: "Responsible for horizontal abduction — pulling the arm back behind the body. Critical for shoulder health, posture, and injury prevention. Almost always the weakest and most underdeveloped of the three in people who press heavily.",
        bestExercises: ["Face Pull", "Rear Delt Fly", "Reverse Pec Deck", "Band Pull-Apart"],
        scienceNote: "Heavy pressing with underdeveloped rear delts creates anterior shoulder tilt — a key contributor to rotator cuff injuries and shoulder impingement. The face pull is one of the most important exercises in the program not for aesthetics but for long-term shoulder health. External rotation training alongside rear delt work (which the face pull provides) is backed by a large body of injury prevention research."
      }
    ],
    weeklyStrategy: "Push B (Thursday) leads with the seated dumbbell press and Arnold press as the primary shoulder session. Both Push days include lateral raises. Face pulls appear in both Pull sessions for rear delt and external rotation. The unilateral overhead press tracks left/right shoulder strength parity weekly.",
    alternatives: ["Barbell Military Press", "Push Press", "Upright Row (light)", "Cable Face Pull variations", "Band Pull-Apart"]
  },
  {
    id: "triceps",
    name: "Triceps",
    emoji: "",
    color: "#e9f0fb",
    accent: "#2563a8",
    summary: "The triceps make up roughly two-thirds of the upper arm — more than the biceps. Most people undertrain them by focusing too heavily on pressing movements. Full tricep development requires at least one exercise with the arm overhead to fully stretch the long head.",
    regions: [
      {
        name: "Long Head",
        role: "The largest of the three heads and the one most responsible for the overall size of the upper arm. Unique in that it crosses the shoulder joint — meaning it only reaches full stretch when the arm is elevated overhead. Cannot be fully trained without an overhead extension variation.",
        bestExercises: ["Overhead Tricep Extension", "Skull Crusher", "JM Press"],
        scienceNote: "The long head contributes approximately 55% of total tricep cross-sectional area. Research shows it is significantly more active during overhead extension than during pushdowns (Boeckh-Behrens & Buskies, 2000). This is why overhead extension is prescribed in the program despite pushdowns already being included."
      },
      {
        name: "Lateral Head",
        role: "The outermost head — creates the 'horseshoe' shape visible from the side. Most active when the arm is at the side or below. Primarily targeted by pushdown variations.",
        bestExercises: ["Tricep Rope Pushdown", "Close-Grip Press", "Tricep Dips"],
        scienceNote: "The lateral head reaches peak activation during pushdown movements. Spreading the rope at the bottom of a rope pushdown further maximizes lateral head contraction at the end range."
      },
      {
        name: "Medial Head",
        role: "The deepest head, located underneath the other two. Provides stability during all elbow extension. Always active but never the primary mover in any single exercise.",
        bestExercises: ["All tricep exercises (always recruits)", "Reverse Grip Pushdown"],
        scienceNote: "The medial head is the workhorse — it assists in all elbow extension and is nearly always partially active. It cannot be fully isolated but contributes meaningfully to overall tricep volume in every set."
      }
    ],
    weeklyStrategy: "Push A (Monday) uses the overhead extension (long head) and rope pushdown (lateral/medial). Push B (Thursday) uses the rope pushdown again as the primary isolation. Both sessions also include pressing movements which add indirect tricep volume.",
    alternatives: ["Skull Crusher", "Tricep Dip", "Close-Grip Bench Press", "Diamond Push-Up", "Cable Overhead Extension"]
  },
  {
    id: "biceps",
    name: "Biceps",
    emoji: "",
    color: "#ebf5e6",
    accent: "#2d7a1e",
    summary: "The bicep is a two-headed muscle with a third synergist below it. Full arm development requires targeting all three — the long head for peak, the short head for width, and the brachialis for the 'pushing up' effect that makes the arm look bigger from the side.",
    regions: [
      {
        name: "Long Head",
        role: "The outer head — primarily responsible for the bicep 'peak.' It crosses the shoulder joint and reaches maximum stretch when the arm is behind the body (as in incline curls). Peak training requires stretch-loaded exercises.",
        bestExercises: ["Incline Dumbbell Curl", "Cable Curl (arms behind body)"],
        scienceNote: "The long head produces maximum force and hypertrophic stimulus when it is at full stretch — the incline curl uniquely achieves this by putting the arm in a position behind the torso line before the curl begins. Research confirms greater long head EMG activation in this position vs. standard standing curls."
      },
      {
        name: "Short Head",
        role: "The inner head — contributes to overall bicep width and fullness. More active at peak contraction (supinated, fully curled position). Supinating the wrist at the top of each alternating curl specifically targets this head.",
        bestExercises: ["Alternating Dumbbell Curl", "Preacher Curl", "Spider Curl"],
        scienceNote: "Supination (rotating the palm upward and outward) is one of the bicep's primary functions. Curling without supination, as in a hammer curl, does not fully activate the short head. This is why the alternating dumbbell curl prescribes supination at the top — it adds short head recruitment beyond what a neutral grip provides."
      },
      {
        name: "Brachialis",
        role: "Not technically a bicep — it lies underneath the bicep and cannot be seen directly. When developed, it pushes the bicep upward creating the appearance of a larger, higher bicep. Most effectively targeted with a neutral grip (no supination).",
        bestExercises: ["Hammer Curl", "Cross-Body Curl", "Neutral-Grip Pulldown"],
        scienceNote: "The brachialis is the strongest elbow flexor — it contributes more to overall elbow flexion force than the bicep. Developing it produces a visible difference in arm size and shape. The hammer curl is the primary brachialis exercise in this program."
      }
    ],
    weeklyStrategy: "Pull A (Tuesday) uses the alternating curl (short head) and incline curl (long head). Pull B (Friday) adds the hammer curl (brachialis) and cable curl (bottom-range tension) for a different stimulus. Total weekly bicep volume: 12 working sets.",
    alternatives: ["Preacher Curl", "Concentration Curl", "Barbell Curl", "Reverse Curl", "Spider Curl"]
  },
  {
    id: "core",
    name: "Core",
    
    color: "#e5f7f0",
    accent: "#147a50",
    summary: "The core is not just the visible abdominal muscles — it's a system of deep stabilizing muscles that control spinal position under load. Training the visible abs without the deep core is like building walls without a foundation. This program trains them in the correct order.",
    regions: [
      {
        name: "Transverse Abdominis (TVA)",
        role: "The deepest abdominal muscle — wraps around the torso like a belt. The primary stabilizer of the spine. Activates before any limb movement in a healthy core. This is the muscle being recruited when you 'brace' before a heavy set. Cannot be seen but its function is essential.",
        bestExercises: ["Dead Bug", "Plank", "Diaphragmatic Breathing with Brace"],
        scienceNote: "McGill's decades of spine research show the TVA is the primary contributor to spinal stiffness during loading. The core bracing technique (breathe in, then brace hard) dramatically increases intra-abdominal pressure and TVA activation, protecting the spine during all compound lifts. This is Stage 1 — everything else builds on it."
      },
      {
        name: "Rectus Abdominis",
        role: "The visible 'six-pack' muscle. Responsible for spinal flexion. Like any other muscle, it requires progressive overload to grow and become visible — bodyweight crunches plateau quickly. Direct loading is necessary.",
        bestExercises: ["Cable Crunch", "Hanging Knee Raise", "Ab Wheel Rollout (secondary)"],
        scienceNote: "The rectus abdominis responds to the same hypertrophy principles as any other muscle — it needs progressive overload. Cable crunches allow weight to be added week over week. The hanging knee raise trains spinal flexion in a hanging position, recruiting the rectus most effectively when posterior pelvic tilt is achieved at the top."
      },
      {
        name: "Obliques (Internal and External)",
        role: "The angled fibers on the sides of the torso. Responsible for rotation and lateral flexion. Critical for resisting rotational forces during compound lifts — every time you squat, deadlift, or press with load, the obliques are working to keep the spine from twisting.",
        bestExercises: ["Pallof Press", "Side Plank", "Cable Woodchop"],
        scienceNote: "The Pallof press is an anti-rotation exercise — the core is not moving, it's resisting movement. This is what the obliques actually do during real athletic and lifting situations. Training them with rotation (twists) trains a different and less functionally important pattern than anti-rotation work."
      },
      {
        name: "Erector Spinae",
        role: "Run along the spine. Resist forward bending and assist in hip extension. Heavily recruited during RDLs, hip thrusts, and any hinge movement. Provide critical stability during all heavy loaded movements.",
        bestExercises: ["Romanian Deadlift (isometric hold)", "Hip Thrust", "Good Morning"],
        scienceNote: "The erectors are trained isometrically in this program — they maintain a neutral spine against load rather than flexing and extending. This is the correct training stimulus. Excessive flexion-extension of a loaded spine (as in back extensions with heavy weight) is associated with disc stress in current biomechanics research."
      }
    ],
    weeklyStrategy: "Core is embedded at the end of Friday and Saturday — never standalone. Friday covers Stage 1 (Dead Bug), Stage 2 (Pallof Press), and Stage 3 (Hanging Knee Raise). Saturday covers Stage 3 (Ab Wheel) and Stage 2 (Side Plank) plus Stage 1 (Plank). The stages build on each other and should not be rushed.",
    alternatives: ["Bird-Dog", "Suitcase Carry", "Farmer's Carry", "Cable Woodchop", "Dragon Flag Progression"]
  },
  {
    id: "calves",
    name: "Calves",
    
    color: "#fef3e4",
    accent: "#c47a0a",
    summary: "The calves are two separate muscles — the gastrocnemius and the soleus — that require different training positions to fully develop. Both need a genuine full stretch at the bottom of each rep to grow, since they are conditioned by daily walking to handle shortened-range movement.",
    regions: [
      {
        name: "Gastrocnemius",
        role: "The larger, outer calf muscle with two heads. Crosses both the knee and ankle — active only when the knee is straight. Creates the rounded shape visible from the back. Best targeted by standing calf raises with a straight knee.",
        bestExercises: ["Standing Calf Raise"],
        scienceNote: "The gastroc is a fast-twitch dominant muscle and responds well to heavier loads with full range. Because it crosses the knee, it is largely deactivated when the knee is bent — making the seated calf raise ineffective for it."
      },
      {
        name: "Soleus",
        role: "The deeper, flatter calf muscle. Does not cross the knee — active regardless of knee position. Responds better to higher reps and sustained tension. Best targeted with seated calf raises where the knee is bent and the gastroc is disengaged.",
        bestExercises: ["Seated Calf Raise"],
        scienceNote: "The soleus is slow-twitch dominant and has more endurance fibers than the gastroc. It responds best to higher rep ranges (15–20) and sustained time under tension. This is why the rep range on seated calf raises differs from most other exercises."
      }
    ],
    weeklyStrategy: "Standing calf raises (gastroc) on Wednesday. Seated calf raises (soleus) on Saturday. Both require full range of motion — heel drops below the step level at the bottom and maximum elevation at the top. Partial reps produce minimal stimulus in calves.",
    alternatives: ["Donkey Calf Raise", "Single-Leg Standing Calf Raise", "Smith Machine Calf Raise", "Leg Press Calf Press"]
  }
];

// Exercise to muscle group mapping for the database view
export const exerciseDatabase = [
  // Glutes
  { name: "Hip Thrust", primaryGroup: "glutes", primaryRegion: "Gluteus Maximus", secondaryGroups: ["hamstrings"], category: "Compound", difficulty: "Intermediate" },
  { name: "Single-Leg Hip Thrust", primaryGroup: "glutes", primaryRegion: "Gluteus Maximus", secondaryGroups: ["hamstrings"], category: "Compound Unilateral", difficulty: "Intermediate" },
  { name: "Bulgarian Split Squat", primaryGroup: "quads", primaryRegion: "Vastus Lateralis", secondaryGroups: ["glutes", "hamstrings"], category: "Compound Unilateral", difficulty: "Intermediate" },
  { name: "Walking Lunge", primaryGroup: "quads", primaryRegion: "Rectus Femoris", secondaryGroups: ["glutes"], category: "Compound Unilateral", difficulty: "Beginner" },
  { name: "Romanian Deadlift", primaryGroup: "hamstrings", primaryRegion: "Biceps Femoris (Long Head)", secondaryGroups: ["glutes"], category: "Compound", difficulty: "Intermediate" },
  { name: "Goblet Squat", primaryGroup: "quads", primaryRegion: "Rectus Femoris", secondaryGroups: ["glutes"], category: "Compound", difficulty: "Beginner" },
  { name: "Leg Press", primaryGroup: "quads", primaryRegion: "Vastus Lateralis", secondaryGroups: ["glutes", "hamstrings"], category: "Compound", difficulty: "Beginner" },
  { name: "Leg Extension", primaryGroup: "quads", primaryRegion: "Vastus Medialis", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Single-Leg Hamstring Curl", primaryGroup: "hamstrings", primaryRegion: "Semimembranosus and Semitendinosus", secondaryGroups: [], category: "Isolation Unilateral", difficulty: "Beginner" },
  { name: "Standing Calf Raise", primaryGroup: "calves", primaryRegion: "Gastrocnemius", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Seated Calf Raise", primaryGroup: "calves", primaryRegion: "Soleus", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Chest
  { name: "Dumbbell Bench Press", primaryGroup: "chest", primaryRegion: "Sternal Head (Mid/Lower Chest)", secondaryGroups: ["shoulders", "triceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Incline Dumbbell Press", primaryGroup: "chest", primaryRegion: "Clavicular Head (Upper Chest)", secondaryGroups: ["shoulders", "triceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Cable Fly (Low-to-High)", primaryGroup: "chest", primaryRegion: "Clavicular Head (Upper Chest)", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Shoulders
  { name: "Seated Dumbbell Overhead Press", primaryGroup: "shoulders", primaryRegion: "Anterior (Front) Delt", secondaryGroups: ["triceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Arnold Press", primaryGroup: "shoulders", primaryRegion: "Lateral (Side) Delt", secondaryGroups: ["triceps"], category: "Compound", difficulty: "Intermediate" },
  { name: "Lateral Raise", primaryGroup: "shoulders", primaryRegion: "Lateral (Side) Delt", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Cable Lateral Raise (Single-Arm)", primaryGroup: "shoulders", primaryRegion: "Lateral (Side) Delt", secondaryGroups: [], category: "Isolation Unilateral", difficulty: "Beginner" },
  { name: "Single-Arm Overhead DB Press", primaryGroup: "shoulders", primaryRegion: "Anterior (Front) Delt", secondaryGroups: ["triceps"], category: "Compound Unilateral", difficulty: "Intermediate" },
  { name: "Face Pull", primaryGroup: "shoulders", primaryRegion: "Posterior (Rear) Delt", secondaryGroups: ["back"], category: "Isolation", difficulty: "Beginner" },
  { name: "Rear Delt Fly", primaryGroup: "shoulders", primaryRegion: "Posterior (Rear) Delt", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Back
  { name: "Lat Pulldown (Wide Overhand)", primaryGroup: "back", primaryRegion: "Latissimus Dorsi", secondaryGroups: ["biceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Pull-Up", primaryGroup: "back", primaryRegion: "Latissimus Dorsi", secondaryGroups: ["biceps"], category: "Compound", difficulty: "Advanced" },
  { name: "Seated Cable Row", primaryGroup: "back", primaryRegion: "Rhomboids and Mid-Traps", secondaryGroups: ["biceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Single-Arm Dumbbell Row", primaryGroup: "back", primaryRegion: "Latissimus Dorsi", secondaryGroups: ["biceps"], category: "Compound Unilateral", difficulty: "Beginner" },
  { name: "Chest-Supported DB Row", primaryGroup: "back", primaryRegion: "Rhomboids and Mid-Traps", secondaryGroups: ["biceps"], category: "Compound", difficulty: "Beginner" },
  { name: "Straight-Arm Pulldown", primaryGroup: "back", primaryRegion: "Latissimus Dorsi", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Biceps
  { name: "Alternating Dumbbell Curl", primaryGroup: "biceps", primaryRegion: "Short Head", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Incline Dumbbell Curl", primaryGroup: "biceps", primaryRegion: "Long Head", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Hammer Curl", primaryGroup: "biceps", primaryRegion: "Brachialis", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Cable Curl (Low Pulley)", primaryGroup: "biceps", primaryRegion: "Short Head", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Triceps
  { name: "Overhead Tricep Extension", primaryGroup: "triceps", primaryRegion: "Long Head", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  { name: "Tricep Rope Pushdown", primaryGroup: "triceps", primaryRegion: "Lateral Head", secondaryGroups: [], category: "Isolation", difficulty: "Beginner" },
  // Core
  { name: "Dead Bug", primaryGroup: "core", primaryRegion: "Transverse Abdominis (TVA)", secondaryGroups: [], category: "Core Stage 1", difficulty: "Beginner" },
  { name: "Plank", primaryGroup: "core", primaryRegion: "Transverse Abdominis (TVA)", secondaryGroups: [], category: "Core Stage 1", difficulty: "Beginner" },
  { name: "Pallof Press", primaryGroup: "core", primaryRegion: "Obliques (Internal and External)", secondaryGroups: [], category: "Core Stage 2", difficulty: "Beginner" },
  { name: "Side Plank", primaryGroup: "core", primaryRegion: "Obliques (Internal and External)", secondaryGroups: [], category: "Core Stage 2", difficulty: "Beginner" },
  { name: "Hanging Knee Raise", primaryGroup: "core", primaryRegion: "Rectus Abdominis", secondaryGroups: [], category: "Core Stage 3", difficulty: "Intermediate" },
  { name: "Ab Wheel Rollout", primaryGroup: "core", primaryRegion: "Transverse Abdominis (TVA)", secondaryGroups: [], category: "Core Stage 3", difficulty: "Intermediate" },
];
