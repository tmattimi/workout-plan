// ── Exercise Swap Library ─────────────────────────────────────────────────────
// Research basis:
// - Schoenfeld (2010): muscle activation by movement pattern and load position
// - Contreras et al. (2015): glute EMG across variations
// - Pedrosa et al. (2022): stretch-mediated hypertrophy — lengthened position loading
// - NSCA CSCS (Haff & Triplett): movement pattern equivalence
// - Wakahara et al. (2012): hamstring regional hypertrophy by exercise type
//
// Each swap includes:
//   name: exact exercise name
//   tradeoff: what changes mechanically
//   position: "same" | "lengthened" | "shortened" | "mid" — muscle length position
//   researchNote: one-sentence scientific basis

export const SWAP_MAP = {

  // ── GLUTES ─────────────────────────────────────────────────────────────────

  "Hip Thrust (Barbell or Machine)": [
    {
      name: "Glute Bridge",
      equipment: [],
      tradeoff: "No equipment needed. Shorter range of motion than the hip thrust — the glute does not fully lengthen — so it is a partial stimulus. Best as a temporary swap when no bench or bar is available.",
      position: "shortened",
      researchNote: "Contreras et al. (2015): hip thrust produces higher peak glute EMG than glute bridge due to greater range of motion at the hip."
    },
    {
      name: "Single-Leg Hip Thrust (Bodyweight or Light)",
      equipment: ["bench"],
      tradeoff: "Eliminates bilateral compensation. Higher glute demand per side. Slightly less absolute load but often greater muscle activation on the working side.",
      position: "same",
      researchNote: "Contreras (2013): single-leg variation increases unilateral glute activation by approximately 30% versus bilateral at matched loads."
    },
    {
      name: "Hip Thrust Machine",
      equipment: ["machine"],
      tradeoff: "Identical movement and muscle activation to the barbell version. More stable setup, easier to control load increments. Use this if barbell setup is unavailable or uncomfortable.",
      position: "same",
      researchNote: "Same primary movement pattern — glute max loaded at peak hip extension. Direct equivalent."
    },
  ],

  "Cable Kickback (Glutes)": [
    {
      name: "Glute Kickback Machine",
      equipment: ["machine"],
      tradeoff: "Direct replacement. Same muscle, same contracted-position loading, more stable than cable. If the machine is available, this is a true equivalent.",
      position: "same",
      researchNote: "Same movement pattern — hip extension against resistance at the contracted position. Direct equivalent to cable version."
    },
    {
      name: "Banded Donkey Kick",
      equipment: ["band"],
      tradeoff: "No cable required. Band resistance is lower and peaks at the midpoint rather than the end range, so the peak contraction stimulus is slightly reduced. Still an effective glute isolation tool.",
      position: "same",
      researchNote: "Contreras et al. (2015): donkey kick activates glute max effectively as an isolation exercise. Resistance profile differs from cable due to band elasticity."
    },
    {
      name: "Hip Thrust (Barbell or Machine)",
      equipment: ["bench"],
      tradeoff: "Shifts from isolation to compound. Greater total load possible. Loses the unilateral isolation — both glutes work together. Use this when cable is unavailable and you want to maintain glute volume.",
      position: "shortened",
      researchNote: "Contreras et al. (2015): hip thrust produces the highest peak glute EMG of any exercise measured, making it the strongest compound replacement for glute isolation work."
    },
    {
      name: "45-Degree Hip Extension (Back Extension Machine)",
      equipment: ["machine"],
      tradeoff: "Loads the glute in a lengthened position — the opposite of the kickback. This is actually a useful complement: one loads the glute at stretch, one at contraction. Different stimulus, same muscle.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): lengthened-position loading produces superior hypertrophy. The 45-degree extension trains glute max through the stretch, which the kickback does not."
    },
  ],

  "Cable Hip Abduction (Standing)": [
    {
      name: "Clamshell (Band)",
      equipment: ["band"],
      tradeoff: "No cable required. Loads the glute medius in a different position — lying on your side rather than standing. Resistance profile is lighter but the muscle activation is comparable for the glute medius.",
      position: "mid",
      researchNote: "Distefano et al. (2009): clamshell produces high glute medius EMG and is a primary rehabilitation and strengthening exercise for hip abductor deficiency."
    },
    {
      name: "Hip Abduction Machine",
      equipment: ["machine"],
      tradeoff: "Seated rather than standing, but the same muscle group is targeted with a similar resistance profile. True equivalent if the cable is occupied or unavailable.",
      position: "same",
      researchNote: "Same primary muscle — glute medius and TFL via hip abduction. Direct equivalent in a seated position."
    },
    {
      name: "Side-Lying Hip Abduction (Bodyweight)",
      equipment: [],
      tradeoff: "No equipment at all. Resistance is bodyweight only — significantly lighter than cable. Use this when no equipment is available. Increase reps to compensate for lower resistance.",
      position: "mid",
      researchNote: "Selkowitz et al. (2013): side-lying hip abduction isolates glute medius effectively with minimal TFL involvement when performed with the pelvis level."
    },
  ],

  "Romanian Deadlift (Dumbbell)": [
    {
      name: "Single-Leg RDL (Dumbbell)",
      equipment: ["dumbbell"],
      tradeoff: "Same movement, unilateral version. Higher balance demand, lower absolute load, but greater per-side hamstring and glute activation. Better at identifying left-right asymmetries.",
      position: "lengthened",
      researchNote: "Wakahara et al. (2012): unilateral hip hinge produces similar hamstring hypertrophy to bilateral with lower spinal compressive load."
    },
    {
      name: "Lying Leg Curl (Machine)",
      equipment: ["machine"],
      tradeoff: "Trades the lengthened hip-hinge position for a knee-flexion pattern. Hits the hamstring differently — more biceps femoris short head. Complementary, not identical. Good swap if lower back is fatigued.",
      position: "shortened",
      researchNote: "Schoenfeld (2010): leg curl specifically loads the hamstring in the shortened/contracted position via knee flexion — mechanically distinct from the RDL's hip-hinge lengthened-position loading."
    },
    {
      name: "Barbell RDL",
      equipment: ["barbell"],
      tradeoff: "Higher absolute load possible. More spinal compression than the dumbbell version. Only use if lower back history permits and the individual has been cleared for barbell loading.",
      position: "lengthened",
      researchNote: "Same movement pattern as dumbbell RDL. Greater barbell load allows more mechanical tension if tolerated — mechanically equivalent."
    },
    {
      name: "45-Degree Hip Extension (Back Extension Machine)",
      equipment: ["machine"],
      tradeoff: "Hip hinge pattern, similar to the RDL. Loads the hamstring and glute in a lengthened position. Lower spinal shear than the RDL because the torso is supported. Good swap for lower back sensitivity.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): hip extension under load at the lengthened position produces significant hamstring and glute hypertrophy stimulus, comparable to the RDL movement."
    },
  ],

  "Lying Leg Curl (Machine)": [
    {
      name: "Single-Leg Hamstring Curl",
      equipment: ["machine"],
      tradeoff: "Unilateral version of the same machine. Addresses left-right imbalance. Lower absolute load but higher per-side demand. Direct equivalent.",
      position: "shortened",
      researchNote: "Same movement pattern. Unilateral loading reduces bilateral deficit compensation."
    },
    {
      name: "Nordic Hamstring Curl",
      equipment: ["bench"],
      tradeoff: "No machine required. Kneel and lower your torso toward the floor with only the hamstring resisting. Extremely high hamstring stimulus but also high fatigue and DOMS. Reduce volume when first introducing.",
      position: "lengthened",
      researchNote: "Schoenfeld et al. (2021): Nordic curl produces the greatest eccentric hamstring load of any exercise — highest hamstring hypertrophy stimulus, especially for biceps femoris long head."
    },
    {
      name: "Stability Ball Hamstring Curl",
      equipment: ["stability_ball"],
      tradeoff: "No machine required. Lie on your back, feet on a stability ball, curl heels toward glutes. Lower resistance than machine but meaningful hamstring activation. Adds core demand.",
      position: "shortened",
      researchNote: "Core stability demand is higher than machine, hamstring load is lower. Effective bodyweight alternative when no machine is available."
    },
    {
      name: "Romanian Deadlift (Dumbbell)",
      equipment: ["dumbbell"],
      tradeoff: "Trades knee-flexion hamstring loading for hip-hinge lengthened loading. Different mechanical stimulus — hits the hamstring via stretch rather than contraction. Complementary movement, not identical.",
      position: "lengthened",
      researchNote: "Wakahara et al. (2012): RDL preferentially hypertrophies the proximal hamstring via lengthened loading — opposite end of the length-tension curve from the leg curl."
    },
  ],

  // ── QUADS ──────────────────────────────────────────────────────────────────

  "Leg Press": [
    {
      name: "Goblet Squat",
      equipment: ["dumbbell"],
      tradeoff: "No machine required. Bilateral compound movement with similar quad emphasis. Adds upper back and core demand. Lower absolute load but comparable muscle activation.",
      position: "mid",
      researchNote: "Schoenfeld (2010): goblet squat produces similar quad EMG to leg press with the addition of core anti-flexion demand."
    },
    {
      name: "Bulgarian Split Squat (Dumbbell)",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Unilateral version. Higher per-leg demand, better addresses asymmetries. No machine needed. Significant balance challenge for beginners.",
      position: "lengthened",
      researchNote: "Schoenfeld (2010): split squat produces higher glute and quad activation per leg than bilateral leg press at matched total load."
    },
    {
      name: "Hack Squat Machine",
      equipment: ["machine"],
      tradeoff: "Direct leg press equivalent with a different body angle. Greater quad emphasis than the standard leg press. True mechanical equivalent.",
      position: "mid",
      researchNote: "Similar quad activation profile to leg press with greater VMO emphasis depending on foot position."
    },
  ],

  "Leg Extension": [
    {
      name: "Terminal Knee Extension (Band)",
      equipment: ["band"],
      tradeoff: "Band anchored behind you. Slight knee bend with resistance, then extend to full lockout. Specifically trains the VMO in the final degrees of extension — same ACL-protective mechanism as the machine. No machine required.",
      position: "shortened",
      researchNote: "Distefano et al. (2009): VMO strengthening in terminal knee extension range is the primary evidence-based ACL injury prevention strategy."
    },
    {
      name: "Sissy Squat (Bodyweight or Loaded)",
      equipment: [],
      tradeoff: "Kneel backward on a fixed surface, leaning the torso away to challenge the quad in a lengthened position. High quad stimulus but significant knee stress for those with knee history. Use with caution.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): sissy squat loads the quad in the lengthened position — a complementary stimulus to the contracted-position leg extension."
    },
  ],

  "Bulgarian Split Squat (Dumbbell)": [
    {
      name: "Leg Press",
      equipment: ["machine"],
      tradeoff: "Trades unilateral for bilateral. Eliminates balance demand. Lower per-leg stimulus but allows higher absolute load. Good swap when balance or stability is a limiting factor.",
      position: "mid",
      researchNote: "Comparable quad and glute activation in bilateral pressing pattern. Unilateral advantage of split squat is lost."
    },
    {
      name: "Split Squat (Front Foot Elevated)",
      equipment: ["bench"],
      tradeoff: "Same movement but with the front foot elevated instead of the rear. Shifts load toward the quad — greater stretch on the quad, slightly less glute. Removes the balance challenge of the rear foot being elevated.",
      position: "lengthened",
      researchNote: "Front foot elevation increases quad lengthened-position loading, which Pedrosa et al. (2022) identifies as superior for hypertrophy."
    },
    {
      name: "Reverse Lunge (Dumbbell)",
      equipment: ["dumbbell"],
      tradeoff: "Similar movement pattern. Step back rather than having the foot elevated. Less stable foot position than split squat — lower balance challenge. Good stepping-stone exercise when split squat is too difficult.",
      position: "mid",
      researchNote: "Reverse lunge produces comparable quad and glute activation to forward lunge with lower knee shear force — appropriate for knee sensitivity."
    },
  ],

  // ── HAMSTRINGS ─────────────────────────────────────────────────────────────

  "Single-Leg Hamstring Curl": [
    {
      name: "Lying Leg Curl (Machine)",
      equipment: ["machine"],
      tradeoff: "Bilateral version. More total volume per set but addresses asymmetries less effectively. Direct equivalent otherwise.",
      position: "shortened",
      researchNote: "Same movement pattern. Bilateral reduces per-side loading demand."
    },
    {
      name: "Nordic Hamstring Curl",
      equipment: ["bench"],
      tradeoff: "Extremely high eccentric hamstring load. No machine required. Very high DOMS on first introduction — start with partial range only.",
      position: "lengthened",
      researchNote: "Schoenfeld et al. (2021): Nordic curl is the highest-evidence hamstring injury prevention and hypertrophy exercise, particularly for biceps femoris."
    },
  ],

  // ── BACK ───────────────────────────────────────────────────────────────────

  "Lat Pulldown (Wide Overhand)": [
    {
      name: "Pull-Up (or Assisted Pull-Up)",
      equipment: ["pull_up_bar"],
      tradeoff: "No cable required. Uses bodyweight. The lat loading is identical — same muscle, same pulling pattern. Use a band for assistance if needed. Typically produces higher lat activation than the machine version.",
      position: "lengthened",
      researchNote: "Schoenfeld (2010): pull-up and lat pulldown produce equivalent lat activation. Pull-up typically activates slightly more core musculature due to the lack of leg support."
    },
    {
      name: "Neutral-Grip Pulldown",
      equipment: ["cable"],
      tradeoff: "Same machine, neutral grip attachment. Slightly more bicep involvement, slightly less outer lat emphasis. Good swap when the shoulder prefers a neutral wrist position.",
      position: "lengthened",
      researchNote: "Grip variation changes forearm supination but lat activation remains equivalent. Neutral grip reduces external shoulder rotation demand."
    },
    {
      name: "Single-Arm Cable Row",
      equipment: ["cable"],
      tradeoff: "Unilateral pulling on the cable. Different angle — more horizontal pull than vertical. Hits the mid-back alongside the lat. Not an identical replacement for the lat pulldown but maintains pulling volume.",
      position: "mid",
      researchNote: "Different pulling angle activates lat and mid-back differently. Vertical pull (pulldown) emphasizes lat width; horizontal pull (row) emphasizes lat thickness."
    },
  ],

  "Seated Cable Row (Neutral Grip)": [
    {
      name: "Chest-Supported DB Row",
      equipment: ["dumbbell", "bench"],
      tradeoff: "No cable required. Lie face-down on an incline bench and row both dumbbells. Removes lower back involvement entirely — good swap for lower back sensitivity. Very similar mid-back activation.",
      position: "lengthened",
      researchNote: "Chest support eliminates lumbar loading. Dumbbell row produces comparable mid-back and lat activation to cable row per Schoenfeld (2010)."
    },
    {
      name: "Single-Arm Dumbbell Row",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Unilateral. One side at a time, allowing greater focus and range of motion. No cable required. Addresses left-right back strength differences. Standard replacement when cable is unavailable.",
      position: "lengthened",
      researchNote: "Same horizontal pulling pattern. Unilateral loading allows greater scapular retraction range per rep."
    },
    {
      name: "Machine Row",
      equipment: ["machine"],
      tradeoff: "Direct replacement on a plate-loaded or pin-select machine. Identical movement pattern. Useful when the cable station is occupied.",
      position: "mid",
      researchNote: "Direct mechanical equivalent of the seated cable row."
    },
  ],

  "Single-Arm Dumbbell Row": [
    {
      name: "Chest-Supported DB Row",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Bilateral version with chest support. Eliminates lower back loading. Slightly less unilateral focus. Good swap when the lower back is fatigued from the day's other exercises.",
      position: "lengthened",
      researchNote: "Chest support removes spinal erector demand. Comparable lat and mid-back activation to the unilateral row."
    },
    {
      name: "Single-Arm Cable Row",
      equipment: ["cable"],
      tradeoff: "Cable version of the same unilateral pull. The cable maintains constant tension through the full range, including at the bottom where the dumbbell has less resistance. Different resistance profile but same muscle.",
      position: "mid",
      researchNote: "Cable constant tension provides more stimulus at the bottom of the range where the dumbbell row has near-zero resistance."
    },
  ],

  "Face Pull (Cable)": [
    {
      name: "Band Face Pull",
      equipment: ["band"],
      tradeoff: "No cable required. Anchor a band at face height and pull toward the forehead, spreading the band apart. Resistance profile differs from cable but the movement and muscle activation are equivalent.",
      position: "shortened",
      researchNote: "Same movement pattern. Band elasticity means resistance increases through the range — highest at full contraction, which reinforces the rear delt squeeze."
    },
    {
      name: "Rear Delt Fly (Bent-Over)",
      equipment: ["dumbbell"],
      tradeoff: "No cable or band required. Hinge forward and raise dumbbells out to the side. Hits rear delts and upper back. Different movement but same primary muscle. Prone to using too much weight — use light dumbbells.",
      position: "shortened",
      researchNote: "Schoenfeld (2010): rear delt fly effectively isolates the posterior deltoid. Heavier loads recruit traps excessively — keep weight light for rear delt specificity."
    },
  ],

  // ── SHOULDERS ──────────────────────────────────────────────────────────────

  "Seated Dumbbell Overhead Press": [
    {
      name: "Arnold Press",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Same equipment. Adds a rotation through the press — starts palms facing you, ends palms facing away. More front delt involvement at the bottom. Good variation when the standard OHP has been in the program for several weeks.",
      position: "mid",
      researchNote: "Arnold press activates more anterior deltoid through the rotation phase. Total shoulder activation is similar to standard overhead press."
    },
    {
      name: "Barbell Overhead Press",
      equipment: ["barbell"],
      tradeoff: "More load capacity, different wrist position, slightly more upper trap and serratus involvement. Mechanically equivalent shoulder stimulus. Can be done seated or standing.",
      position: "mid",
      researchNote: "Mechanical equivalent to dumbbell OHP. Barbell version allows greater absolute load."
    },
    {
      name: "Pike Push-Up",
      equipment: [],
      tradeoff: "No equipment. Place hands shoulder-width on the floor and push from a pike position. Significantly lower load than dumbbell pressing. Use high reps to accumulate comparable volume.",
      position: "mid",
      researchNote: "Targets the same anterior and medial deltoid as overhead pressing. Load is limited to bodyweight fraction."
    },
    {
      name: "Single-Arm Overhead DB Press",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Unilateral version. Higher per-side demand with added core anti-lateral-flexion challenge. Lower absolute load. Identifies and addresses left-right pressing asymmetries.",
      position: "mid",
      researchNote: "Unilateral pressing adds significant core demand. Per-side deltoid activation is comparable to bilateral at matched loads."
    },
  ],

  "Lateral Raise": [
    {
      name: "Cable Lateral Raise (Single-Arm)",
      equipment: ["cable"],
      tradeoff: "Cable maintains tension at the bottom of the range where the dumbbell has near-zero resistance. Better stimulus through the full arc. If the cable is available, this is the superior version.",
      position: "same",
      researchNote: "Cable provides constant tension unlike the dumbbell which has zero resistance at the bottom. Research supports cable for superior side delt hypertrophy stimulus through the full range."
    },
    {
      name: "Band Lateral Raise",
      equipment: ["band"],
      tradeoff: "No cable or dumbbell required. Band resistance peaks at the top rather than the bottom. Lower absolute load. Use double the reps to compensate.",
      position: "shortened",
      researchNote: "Band resistance curve is opposite to cable — highest at peak contraction. Effective when no equipment is available."
    },
  ],

  "Cable Lateral Raise (Single-Arm)": [
    {
      name: "Lateral Raise",
      equipment: ["dumbbell"],
      tradeoff: "No cable required. Dumbbell has near-zero resistance at the bottom of the range — the cable is the superior version. Use this when the cable is unavailable.",
      position: "shortened",
      researchNote: "Dumbbell lateral raise produces lower side delt activation at the start position due to zero mechanical advantage. Cable is preferred for continuous tension."
    },
  ],

  // ── TRICEPS ────────────────────────────────────────────────────────────────

  "Overhead Tricep Extension": [
    {
      name: "DB Overhead Tricep Extension",
      equipment: ["dumbbell"],
      tradeoff: "No cable required. Hold one dumbbell overhead with both hands. Same stretched-position loading of the long head. Slightly less constant tension than the cable at the top of the range.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): overhead position loads the tricep long head at full stretch — the position that produces superior hypertrophy. Dumbbell version maintains this mechanical advantage."
    },
    {
      name: "Lying Tricep Extension (Skullcrusher)",
      equipment: ["barbell", "bench"],
      tradeoff: "Lie on a bench and lower a barbell or dumbbells toward the forehead. Different angle from overhead but still loads the long head in a lengthened position. High absolute load possible.",
      position: "lengthened",
      researchNote: "Schoenfeld et al. (2021): skullcrusher and overhead extension both train the tricep long head in a lengthened position — functionally equivalent stimuli."
    },
  ],

  "Tricep Rope Pushdown": [
    {
      name: "Tricep Bar Pushdown",
      equipment: ["cable"],
      tradeoff: "Same cable, different attachment. Straight bar slightly changes forearm position. Equivalent tricep activation. Use whichever attachment is available.",
      position: "shortened",
      researchNote: "Both attachments produce equivalent tricep lateral and medial head activation. Rope allows slight supination at the bottom, bar keeps wrists neutral."
    },
    {
      name: "Band Tricep Pushdown",
      equipment: ["band"],
      tradeoff: "No cable required. Anchor a band overhead and push down. Band resistance peaks at the contracted position. Lower absolute load — increase reps to compensate.",
      position: "shortened",
      researchNote: "Band resistance at the bottom of the pushdown (contracted position) is highest with a band, matching the muscle's strongest position in that range."
    },
    {
      name: "Bench Dip",
      equipment: ["bench"],
      tradeoff: "No cable or band. Place hands on a bench and lower yourself. High tricep load but adds shoulder stress. Avoid if shoulder is an issue.",
      position: "mid",
      researchNote: "Tricep dip produces high overall tricep activation. Shoulder in compromised position at deep range — use partial range if any shoulder discomfort."
    },
  ],

  // ── BICEPS ─────────────────────────────────────────────────────────────────

  "Incline Dumbbell Curl": [
    {
      name: "Cable Curl (Low Pulley)",
      equipment: ["cable"],
      tradeoff: "Cable maintains constant tension through the full range including the bottom where dumbbells have near-zero load. Loses the incline-position stretch on the long head. Different length-tension tradeoff.",
      position: "mid",
      researchNote: "Cable curl provides superior bottom-range tension. The incline curl's advantage is the shoulder-behind-torso position that stretches the long head — this is not replicated by the cable curl."
    },
    {
      name: "Bayesian Curl (Cable Behind You)",
      equipment: ["cable"],
      tradeoff: "Stand facing away from the cable with the handle behind and low. Curl the arm forward. Puts the shoulder in extension behind the torso — replicates the same long head stretch as the incline curl. Best cable equivalent to incline curl.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): shoulder behind the torso with elbow below the shoulder during curl maximally stretches the long head. Bayesian curl achieves this with cable constant tension."
    },
    {
      name: "Alternating Dumbbell Curl",
      equipment: ["dumbbell"],
      tradeoff: "Loses the incline position and therefore the long head stretch. Activation is more toward the short head and brachialis. A reasonable swap when the incline bench is unavailable, but the long head stimulus is reduced.",
      position: "mid",
      researchNote: "Standard curl does not stretch the long head. Loses the specific incline curl advantage but maintains overall bicep volume."
    },
  ],

  "Alternating Dumbbell Curl": [
    {
      name: "Barbell Curl",
      equipment: ["barbell"],
      tradeoff: "Both arms curl simultaneously. More total load possible per set. Slightly reduces individual arm focus. Wrist is locked in supination throughout rather than rotating during the curl.",
      position: "mid",
      researchNote: "Barbell curl produces similar bicep activation to dumbbell curl. Supination during the alternating curl activates slightly more long head."
    },
    {
      name: "Cable Curl (Low Pulley)",
      equipment: ["cable"],
      tradeoff: "Constant tension from the cable instead of the dumbbell. Better bottom-range stimulus since the dumbbell has near-zero resistance at full extension. Trade the rotation for better constant tension.",
      position: "mid",
      researchNote: "Cable constant tension fills in the bottom dead zone of the dumbbell curl where the dumbbell produces minimal bicep force."
    },
    {
      name: "Hammer Curl",
      equipment: ["dumbbell"],
      tradeoff: "Same equipment, neutral grip throughout. Shifts emphasis to the brachialis and brachioradialis. Good variation if the bicep is fatigued or if adding forearm thickness is a goal.",
      position: "mid",
      researchNote: "Hammer curl de-emphasizes the bicep and preferentially loads the brachialis, which sits beneath the bicep and contributes to arm thickness."
    },
  ],

  // ── CHEST ──────────────────────────────────────────────────────────────────

  "Dumbbell Bench Press": [
    {
      name: "Barbell Bench Press",
      equipment: ["barbell", "bench"],
      tradeoff: "More load capacity. Fixed wrist position limits independent movement of each arm. Mechanically equivalent chest stimulus. Use if dumbbells are unavailable or if higher loading is the goal.",
      position: "mid",
      researchNote: "Schoenfeld (2010): barbell and dumbbell bench press produce equivalent pec major activation. Dumbbell allows greater range of motion — slight stretch advantage at the bottom."
    },
    {
      name: "Push-Up",
      equipment: [],
      tradeoff: "No equipment. High pec activation relative to bodyweight exercises. Load is limited. Use elevated feet to increase difficulty. Very high reps required to match loaded pressing stimulus.",
      position: "mid",
      researchNote: "Calatayud et al. (2015): push-up produces equivalent pec activation to bench press at matched intensity when the instability challenge is accounted for."
    },
    {
      name: "Chest Press Machine",
      equipment: ["machine"],
      tradeoff: "Machine guided path. Lower stabilizer demand. Same primary chest activation. Good swap when shoulder stability is an issue or when no dumbbell bench setup is available.",
      position: "mid",
      researchNote: "Machine chest press produces equivalent pec activation to the dumbbell press with reduced anterior deltoid stabilization demand."
    },
  ],

  "Incline Dumbbell Press": [
    {
      name: "Incline Barbell Press",
      equipment: ["barbell", "bench"],
      tradeoff: "More absolute load. Fixed wrist position. Otherwise identical movement pattern — same upper chest stimulus.",
      position: "mid",
      researchNote: "Direct equivalent. Barbell limits independent arm movement but produces identical upper chest activation at matched angles."
    },
    {
      name: "Low-to-High Cable Fly",
      equipment: ["cable"],
      tradeoff: "Trades compound pressing for cable isolation. The upward arc of the cable fly emphasizes the upper chest (clavicular head) in the same way as incline pressing. Complementary rather than identical.",
      position: "shortened",
      researchNote: "The upward sweeping arc of the low-to-high cable fly targets the clavicular head of the pec — the same portion emphasized by incline pressing."
    },
  ],

  "Cable Fly (High-to-Low)": [
    {
      name: "Dumbbell Bench Press",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Trades isolation for compound. Adds tricep as a secondary mover. More absolute load. Loses the isolation stimulus of the fly.",
      position: "mid",
      researchNote: "Bench press and cable fly both train pec major but with different mechanics. Fly provides greater pec stretch at the bottom; press provides greater mechanical loading."
    },
    {
      name: "Push-Up (Wide)",
      equipment: [],
      tradeoff: "No equipment. Wide hand placement increases pec activation relative to standard push-up. Much lower absolute load.",
      position: "mid",
      researchNote: "Wide-grip push-up increases pectoralis major EMG compared to standard grip by increasing horizontal adduction demand."
    },
  ],

  // ── CORE ───────────────────────────────────────────────────────────────────

  "Dead Bug": [
    {
      name: "Bird Dog",
      equipment: [],
      tradeoff: "Same deep core and anti-extension stimulus but on hands and knees instead of supine. Slightly higher proprioceptive demand. Equally appropriate for lumbar stability work.",
      position: "same",
      researchNote: "McGill (2010): bird dog and dead bug both train the TVA and multifidus with minimal spinal compressive load. Both are primary exercises for lumbar rehabilitation and stability."
    },
    {
      name: "Plank",
      equipment: [],
      tradeoff: "Isometric hold rather than dynamic movement. Similar deep core anti-extension demand. Simpler to execute. Good swap when coordination for the dead bug is difficult.",
      position: "same",
      researchNote: "McGill (2010): plank produces sustained TVA and multifidus coactivation with very low disc compressive forces — appropriate for lumbar sensitization."
    },
  ],

  "Plank": [
    {
      name: "Dead Bug",
      equipment: [],
      tradeoff: "Dynamic rather than isometric. Adds limb movement that challenges the core anti-extension stability more specifically. Better lumbar spine rehabilitation exercise.",
      position: "same",
      researchNote: "McGill (2010): dead bug preferentially activates the TVA through the coordination demand of controlling limb movement while maintaining lumbar neutral."
    },
    {
      name: "Ab Wheel Rollout",
      equipment: ["ab_wheel"],
      tradeoff: "Higher difficulty. Significant anti-extension core demand through the full rollout. Should only be used once plank can be held easily for 60 seconds. Contraindicated for lower back injury.",
      position: "lengthened",
      researchNote: "Ab wheel rollout produces the highest core anti-extension demand of any exercise — not appropriate as a beginner alternative."
    },
  ],

  "Pallof Press (Cable)": [
    {
      name: "Band Pallof Press",
      equipment: ["band"],
      tradeoff: "No cable required. Anchor a band at chest height and perform the same movement. Band resistance increases through the range — higher resistance at full extension than cable. Good equivalent.",
      position: "same",
      researchNote: "Same anti-rotation stimulus. Band resistance profile differs slightly — peaks at full arm extension versus cable which is constant."
    },
  ],

  "Cable Crunch": [
    {
      name: "Hanging Knee Raise",
      equipment: ["pull_up_bar"],
      tradeoff: "No cable required. Hang from a bar and bring knees toward chest. Lower abs are more involved. High shoulder demand — avoid if shoulder is an issue.",
      position: "shortened",
      researchNote: "Hanging knee raise produces high rectus abdominis activation through spinal flexion against bodyweight resistance."
    },
    {
      name: "Bicycle Crunch",
      equipment: [],
      tradeoff: "No equipment. Highest oblique activation of any bodyweight ab exercise per Escamilla et al. (2006). Adding rotation makes it complementary to the cable crunch rather than identical. Very effective.",
      position: "shortened",
      researchNote: "Escamilla et al. (2006): bicycle crunch produces the highest oblique EMG of any tested bodyweight abdominal exercise."
    },
  ],

  "Side Plank": [
    {
      name: "Copenhagen Plank (Adductor Side Plank)",
      equipment: ["bench"],
      tradeoff: "Top foot on a bench, bottom leg hanging. Adds inner thigh loading alongside the oblique and glute medius activation of the standard side plank. More difficult — reduce hold time initially.",
      position: "same",
      researchNote: "Ishøi et al. (2016): Copenhagen plank produces high adductor and glute medius activation simultaneously. Research-backed for groin injury prevention."
    },
    {
      name: "Pallof Press (Cable)",
      equipment: ["cable"],
      tradeoff: "Trades the isometric lateral hold for anti-rotation pressing. Different core challenge — anti-rotation versus anti-lateral flexion. Complementary movements that together cover the full frontal plane demand.",
      position: "same",
      researchNote: "Pallof press and side plank train perpendicular frontal plane stability functions. Together they provide comprehensive lateral core training."
    },
  ],

  // ── CALVES ─────────────────────────────────────────────────────────────────

  "Standing Calf Raise": [
    {
      name: "Seated Calf Raise",
      equipment: ["machine"],
      tradeoff: "Seated version targets the soleus — the deeper calf muscle — rather than the gastrocnemius. Both are needed for full lower leg development. Different muscle emphasis, not an identical swap.",
      position: "mid",
      researchNote: "The gastrocnemius crosses the knee joint; the seated position bends the knee which shortens and de-activates the gastrocnemius, shifting load to the soleus."
    },
    {
      name: "Bodyweight Calf Raise",
      equipment: [],
      tradeoff: "No machine. Same movement but bodyweight only. Requires high reps (30+) to produce comparable stimulus. Stand on a step for full range of motion.",
      position: "mid",
      researchNote: "Same movement pattern. Load is significantly lower — compensate with higher reps and controlled tempo."
    },
  ],

  "Seated Calf Raise": [
    {
      name: "Standing Calf Raise",
      equipment: ["machine"],
      tradeoff: "Shifts emphasis to the gastrocnemius — the outer, more visible calf muscle. Different muscle emphasis. Both are needed. If no seated machine, use this but understand the soleus gets less work.",
      position: "mid",
      researchNote: "Standing calf raise with knee straight maximally activates the gastrocnemius. The soleus gets less work because the gastrocnemius dominates force production in this position."
    },
  ],
// ── CORE ───────────────────────────────────────────────────────────────────

  "Dead Bug": [
    {
      name: "Bird Dog",
      equipment: [],
      tradeoff: "Same anti-extension core demand in a quadruped position rather than supine. Easier to learn, slightly less challenge for the lower abs. Good swap if the dead bug feels uncoordinated.",
      position: "same",
      researchNote: "Both movements train anti-extension stability of the lumbar spine. Bird dog emphasizes contralateral coordination; dead bug emphasizes lower ab control against gravity."
    },
    {
      name: "Plank",
      equipment: [],
      tradeoff: "Simpler movement, still high anti-extension demand. Lower coordination requirement. Use if you are learning core control or short on time.",
      position: "same",
      researchNote: "McGill (2010): plank trains the same anti-extension pattern as dead bug with lower coordination demand — appropriate for beginners or as a regression."
    },
  ],

  "Bird Dog": [
    {
      name: "Dead Bug",
      equipment: [],
      tradeoff: "Supine version of the same anti-extension demand. Higher lower ab engagement. More challenge for people who find the quadruped position easy.",
      position: "same",
      researchNote: "Both movements train contralateral limb coordination and lumbar anti-extension. Dead bug adds gravity-driven challenge to the lower abdominals."
    },
    {
      name: "Plank",
      equipment: [],
      tradeoff: "No limb movement required. Still trains anti-extension. Use as a regression if bird dog coordination is difficult.",
      position: "same",
      researchNote: "McGill (2010): plank is the foundational anti-extension movement from which bird dog and dead bug progress."
    },
  ],

  "Banded Clamshell": [
    {
      name: "Cable Hip Abduction (Standing)",
      equipment: ["cable"],
      tradeoff: "Standing version loads the glute medius through a larger range with constant cable tension. More challenging and better for progressive overload.",
      position: "mid",
      researchNote: "Distefano et al. (2009): both clamshell and standing abduction produce high glute medius activation. Standing version allows greater loading."
    },
    {
      name: "Side-Lying Hip Abduction",
      equipment: [],
      tradeoff: "No band or cable required. Bodyweight only. Same glute medius activation as the clamshell but through a longer lever arm. Slightly more challenging.",
      position: "mid",
      researchNote: "Glute medius activation is comparable between clamshell and side-lying abduction. Side-lying version uses longer lever — harder with bodyweight."
    },
    {
      name: "Hip Thrust (Barbell or Machine)",
      equipment: ["bench"],
      tradeoff: "Shifts from glute medius isolation to glute max compound. Different muscle emphasis. Use when equipment is truly limited and you want to maintain glute volume.",
      position: "shortened",
      researchNote: "Not a direct substitute — different movement and muscle. Best used when no hip abduction option exists and overall glute volume needs to be maintained."
    },
  ],

  "Bicycle Crunch": [
    {
      name: "Cable Crunch",
      equipment: ["cable"],
      tradeoff: "Loaded version of abdominal flexion. Higher resistance and better progressive overload than bodyweight bicycle crunch. Less rotational component.",
      position: "shortened",
      researchNote: "Escamilla et al. (2010): cable crunch produces high rectus abdominis activation comparable to crunches with added resistance for progressive overload."
    },
    {
      name: "Dead Bug",
      equipment: [],
      tradeoff: "Anti-extension instead of flexion. Different core demand — more spinal stability, less rectus abdominis. Better for people with lower back sensitivity to crunching.",
      position: "same",
      researchNote: "McGill (2010): for clients with lower back issues, anti-extension movements like dead bug are preferred over spinal flexion movements like crunches."
    },
    {
      name: "Hanging Knee Raise",
      equipment: ["pull_up_bar"],
      tradeoff: "Higher difficulty — requires grip strength and shoulder stability. Greater lower ab demand due to hip flexion against gravity. Better progressive overload path.",
      position: "lengthened",
      researchNote: "Escamilla et al. (2010): hanging leg raise produces the highest lower abdominal activation of core exercises measured — a significant upgrade from bicycle crunch."
    },
  ],

  "Hanging Knee Raise": [
    {
      name: "Bicycle Crunch",
      equipment: [],
      tradeoff: "No bar required. Regression from hanging raise — lower ab demand is reduced. Use when grip or shoulder stability is a limiting factor.",
      position: "same",
      researchNote: "Bicycle crunch maintains rotational abdominal stimulus without the grip and shoulder demand of the hanging version."
    },
    {
      name: "Captain's Chair Knee Raise",
      equipment: ["machine"],
      tradeoff: "Same movement, arms supported. Removes grip and shoulder as limiters. Direct equivalent for people whose arms fatigue before the abs.",
      position: "same",
      researchNote: "Escamilla et al. (2010): captain's chair knee raise produces identical lower abdominal activation to the hanging version with arms supported."
    },
    {
      name: "Cable Crunch",
      equipment: ["cable"],
      tradeoff: "Seated/kneeling version. No grip required. High rectus abdominis load with resistance — good for progressive overload if the hanging version is not available.",
      position: "shortened",
      researchNote: "Different movement pattern but maintains high abdominal loading with progressive resistance — appropriate when no pull-up bar is available."
    },
  ],

  // ── CARDIO ─────────────────────────────────────────────────────────────────

  "StairMaster": [
    {
      name: "Incline Treadmill Walk",
      equipment: [],
      tradeoff: "High incline (10-15%) at moderate speed closely mimics the glute and hamstring demand of the StairMaster. Slightly lower caloric output but very similar posterior chain stimulus.",
      position: "same",
      researchNote: "Incline walking at 10-15% activates glutes and hamstrings at levels comparable to stair climbing. Zone 2 heart rate is easily maintained."
    },
    {
      name: "Cycling (Stationary Bike)",
      equipment: [],
      tradeoff: "Low impact. Joint-friendly alternative for days with knee or hip discomfort. Seat position shifts load away from glutes compared to stair climbing.",
      position: "same",
      researchNote: "Stationary cycling maintains cardiovascular stimulus with minimal joint stress — appropriate substitute when impact or joint loading needs to be reduced."
    },
    {
      name: "Elliptical",
      equipment: [],
      tradeoff: "Low impact, similar cardiovascular demand. Less glute activation than the StairMaster — the posterior chain is less involved. Use for recovery days or joint-sensitive sessions.",
      position: "same",
      researchNote: "Elliptical provides cardiovascular training at Zone 2 intensity with lower musculoskeletal stress than stair climbing or running."
    },
    {
      name: "Rowing Machine",
      equipment: [],
      tradeoff: "Full-body cardiovascular option. High caloric output. Different muscle emphasis — more back and arms involved. Excellent cross-training option.",
      position: "same",
      researchNote: "Rowing at moderate intensity maintains Zone 2 heart rate with high total body muscle recruitment — more upper body involvement than the StairMaster."
    },
  ],

  "StairMaster (Optional)": [
    {
      name: "Incline Treadmill Walk",
      equipment: [],
      tradeoff: "High incline at moderate speed closely mimics the glute and hamstring demand of the StairMaster. Slightly lower caloric output but very similar posterior chain stimulus.",
      position: "same",
      researchNote: "Incline walking at 10-15% activates glutes and hamstrings at levels comparable to stair climbing."
    },
    {
      name: "Cycling (Stationary Bike)",
      equipment: [],
      tradeoff: "Low impact. Joint-friendly alternative for days with knee or hip discomfort.",
      position: "same",
      researchNote: "Stationary cycling maintains cardiovascular stimulus with minimal joint stress."
    },
    {
      name: "Rest",
      equipment: [],
      tradeoff: "This session is optional — if you are fatigued or your legs are sore from the week, skipping it and resting is the right call. Recovery is part of the program.",
      position: "same",
      researchNote: "Optional sessions exist precisely so recovery takes priority when needed. Skipping one optional session has no meaningful impact on weekly volume."
    },
  ],

  "StairMaster (Warm-Up)": [
    {
      name: "Incline Treadmill Walk",
      equipment: [],
      tradeoff: "5 minutes at 10% incline provides the same warm-up stimulus. Gets blood to the glutes and hamstrings before lifting.",
      position: "same",
      researchNote: "Low-intensity incline walking as a warm-up elevates heart rate and activates the posterior chain in preparation for the training session."
    },
    {
      name: "Cycling (Stationary Bike)",
      equipment: [],
      tradeoff: "5 minutes at easy resistance. Low impact warm-up that elevates heart rate without pre-fatiguing the legs.",
      position: "same",
      researchNote: "Light cycling as a warm-up increases blood flow to working muscles without meaningful energy depletion before the main session."
    },
    {
      name: "Banded Glute Walk",
      equipment: ["band"],
      tradeoff: "Swaps cardiovascular warm-up for a glute activation warm-up. Less heart rate elevation but more targeted glute medius activation before lifting.",
      position: "same",
      researchNote: "Glute activation drills before lifting improve motor unit recruitment during subsequent compound movements — different warm-up goal but appropriate substitute."
    },
  ],

  "Cycle Class": [
    {
      name: "Cycling (Stationary Bike)",
      equipment: [],
      tradeoff: "Solo session instead of a class. Same cardiovascular stimulus. Maintain the same duration and effort — Zone 2 to Zone 3 depending on the day.",
      position: "same",
      researchNote: "Indoor cycling at matched intensity produces identical cardiovascular adaptation regardless of group class or individual session format."
    },
    {
      name: "Rowing Machine",
      equipment: [],
      tradeoff: "Full-body alternative. Similar cardiovascular output with additional upper body involvement. Good cross-training option.",
      position: "same",
      researchNote: "Rowing at matched RPE maintains the cardiovascular training stimulus with higher upper body muscle recruitment."
    },
    {
      name: "Running (Treadmill)",
      equipment: [],
      tradeoff: "Higher impact. Greater caloric output at the same perceived effort. Only if joints tolerate running.",
      position: "same",
      researchNote: "Running produces higher VO2 demand than cycling at the same RPE due to greater muscle mass involvement and impact loading."
    },
  ],

  // ── ADDITIONAL TRICEP SWAPS ─────────────────────────────────────────────────
  // Note on Overhead Tricep Extension + Rope Pushdown pairing:
  // These two are intentionally programmed together. The overhead extension
  // loads the tricep long head in a LENGTHENED position (stretch-mediated hypertrophy).
  // The rope pushdown loads all three heads in a SHORTENED/contracted position.
  // Together they cover the full length-tension curve of the tricep.
  // This is evidence-based programming, not redundancy.

  "Overhead Tricep Extension (Cable)": [
    {
      name: "DB Overhead Tricep Extension",
      equipment: ["dumbbell"],
      tradeoff: "Hold one dumbbell overhead with both hands. Same stretched-position loading of the long head. Slightly less constant tension than cable at the top but identical mechanical advantage.",
      position: "lengthened",
      researchNote: "Pedrosa et al. (2022): overhead position loads the tricep long head at full stretch — the position that produces superior hypertrophy. Dumbbell version maintains this."
    },
    {
      name: "Lying Tricep Extension (Skullcrusher)",
      equipment: ["barbell", "bench"],
      tradeoff: "Lie on a bench and lower a barbell or dumbbells toward the forehead. Still loads the long head in a lengthened position. High absolute load possible. Different angle.",
      position: "lengthened",
      researchNote: "Schoenfeld et al. (2021): skullcrusher and overhead extension both train the tricep long head in a lengthened position — functionally equivalent stimuli."
    },
    {
      name: "Tricep Dip (Parallel Bars or Bench)",
      equipment: ["bench"],
      tradeoff: "Compound movement — adds chest and front delt involvement. Less isolated than the extension but high tricep load. Avoid if shoulder discomfort exists at the bottom.",
      position: "mid",
      researchNote: "Tricep dip produces high overall tricep activation across all three heads. Not a direct substitute for lengthened-position loading but maintains tricep volume."
    },
    {
      name: "Close-Grip Bench Press",
      equipment: ["barbell", "bench"],
      tradeoff: "Compound pressing movement. High tricep load with chest involvement. Use when cable is unavailable and you want to maintain pushing volume.",
      position: "mid",
      researchNote: "Close-grip bench press is one of the highest-loading tricep exercises available. Loses the isolated lengthened-position stimulus but maintains overall tricep volume."
    },
  ],

  // ── ADDITIONAL SHOULDER SWAPS ──────────────────────────────────────────────

  "Rear Delt Fly (Machine or Cable)": [
    {
      name: "Face Pull (Cable)",
      equipment: ["cable"],
      tradeoff: "Adds external rotation to the rear delt work. Hits rear delt, lower trap, and rotator cuff together. More complete posterior shoulder stimulus.",
      position: "same",
      researchNote: "Face pulls train rear delts and external rotators simultaneously — more comprehensive posterior shoulder work than isolated rear delt fly."
    },
    {
      name: "Bent-Over Dumbbell Reverse Fly",
      equipment: ["dumbbell"],
      tradeoff: "No machine or cable required. Bent-over position with dumbbells. Same rear delt and mid-trap activation. Requires more stability from the lower back.",
      position: "same",
      researchNote: "Rear delt activation is equivalent between machine and free-weight reverse fly. Position requires more postural control with dumbbells."
    },
    {
      name: "Band Pull-Apart",
      equipment: ["band"],
      tradeoff: "No machine or cable required. Band held in front and pulled apart. Primarily rear delt and mid-trap. Lower peak load — increase reps to 20-25.",
      position: "same",
      researchNote: "Band pull-apart activates rear delts and scapular retractors effectively at light to moderate loads — appropriate as a swap when no cable or machine is available."
    },
  ],

  // ── ADDITIONAL BACK SWAPS ──────────────────────────────────────────────────

  "Chest-Supported Row (Machine or Dumbbell)": [
    {
      name: "Seated Cable Row (Neutral Grip)",
      equipment: ["cable"],
      tradeoff: "Cable provides constant tension. No chest support — requires more postural stability. Same mid-back and rhomboid activation.",
      position: "same",
      researchNote: "Mid-back activation is equivalent between supported and unsupported rows at matched loads. Unsupported version adds postural demand."
    },
    {
      name: "Single-Arm Dumbbell Row",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Unilateral. Knee on bench for support — reduces the postural demand of the chest-supported version. High load possible. Ensures left-right balance.",
      position: "same",
      researchNote: "Unilateral dumbbell row produces equivalent lat and mid-back activation to bilateral cable rows while identifying and correcting side-to-side strength imbalances."
    },
  ],

  "Pull-Up (or Assisted)": [
    {
      name: "Lat Pulldown (Wide Overhand)",
      equipment: ["cable"],
      tradeoff: "Exact mechanical substitute. Same lat emphasis, same wide grip. Allows precise load selection — more appropriate for progressing toward unassisted pull-ups.",
      position: "lengthened",
      researchNote: "Lat pulldown and pull-up produce nearly identical lat activation patterns. Lat pulldown is the standard regression when bodyweight pull-ups are not yet achievable."
    },
    {
      name: "Assisted Pull-Up Machine",
      equipment: ["machine"],
      tradeoff: "Same movement with counterweight assistance. Maintains the pull-up motor pattern while reducing the load. Best progression tool toward unassisted pull-ups.",
      position: "lengthened",
      researchNote: "Assisted pull-up maintains the exact pull-up movement pattern with adjustable assistance — superior to lat pulldown for developing pull-up strength specifically."
    },
    {
      name: "Single-Arm Dumbbell Row",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Different position but equivalent lat loading. Use when no pull-up bar or lat pulldown is available.",
      position: "same",
      researchNote: "Unilateral rowing produces high lat activation comparable to vertical pulling — appropriate substitute when vertical pulling equipment is unavailable."
    },
  ],

  // ── ADDITIONAL LEG SWAPS ───────────────────────────────────────────────────

  "Sumo Squat (Dumbbell or Barbell)": [
    {
      name: "Bulgarian Split Squat (Dumbbell)",
      equipment: ["dumbbell", "bench"],
      tradeoff: "Unilateral version. Higher glute and VMO demand per side. Eliminates bilateral compensation. More challenging — reduce load significantly.",
      position: "lengthened",
      researchNote: "Bulgarian split squat produces higher unilateral glute and quad activation than bilateral squat variations due to greater hip flexion depth and single-leg demand."
    },
    {
      name: "Leg Press",
      equipment: ["machine"],
      tradeoff: "Seated compound push. Same quad and glute loading without spinal compression. Use when barbell squat feels uncomfortable or is contraindicated.",
      position: "same",
      researchNote: "Leg press produces equivalent quad and glute activation to squats at matched loads. Removes spinal loading — appropriate for lower back sensitive clients."
    },
    {
      name: "Goblet Squat",
      equipment: ["dumbbell"],
      tradeoff: "Dumbbell held at chest. Easier to maintain upright torso. Lower absolute load than barbell sumo but identical movement pattern and muscle activation.",
      position: "same",
      researchNote: "Goblet squat maintains quad and glute activation of the squat pattern while front-loading the weight encourages more upright torso position."
    },
  ],

  "Nordic Hamstring Curl": [
    {
      name: "Lying Leg Curl (Machine)",
      equipment: ["machine"],
      tradeoff: "Machine version. Loads hamstrings in a shortened position rather than the lengthened eccentric of the Nordic. Less effective for hamstring hypertrophy but much easier.",
      position: "shortened",
      researchNote: "Bourne et al. (2017): Nordic curl produces significantly greater hamstring hypertrophy than leg curl due to high eccentric load in a lengthened position."
    },
    {
      name: "Romanian Deadlift (Dumbbell)",
      equipment: ["dumbbell"],
      tradeoff: "Hip hinge pattern. Loads hamstrings in a lengthened position like the Nordic. More practical — can be loaded progressively with dumbbells.",
      position: "lengthened",
      researchNote: "RDL loads hamstrings in a lengthened position similar to the Nordic curl. Both are stretch-mediated loading patterns — comparable hypertrophy stimulus."
    },
  ],

  "Hip Abduction (Machine)": [
    {
      name: "Cable Hip Abduction (Standing)",
      equipment: ["cable"],
      tradeoff: "Cable version in standing position. Same glute medius loading with constant tension. Adds stability demand from standing.",
      position: "mid",
      researchNote: "Distefano et al. (2009): standing cable abduction produces high glute medius activation comparable to machine abduction."
    },
    {
      name: "Banded Clamshell",
      equipment: ["band"],
      tradeoff: "Lying version with band resistance. No machine or cable required. Effective glute medius activation at lighter loads.",
      position: "mid",
      researchNote: "Clamshell with band activates the glute medius effectively as an isolation exercise — appropriate when hip abduction machine is unavailable."
    },
  ],

};

// ── Helper ─────────────────────────────────────────────────────────────────────
export function getSwaps(exerciseName) {
  // Try exact match first
  if (SWAP_MAP[exerciseName]) return SWAP_MAP[exerciseName];
  // Try case-insensitive match
  const key = Object.keys(SWAP_MAP).find(
    k => k.toLowerCase() === exerciseName.toLowerCase()
  );
  return key ? SWAP_MAP[key] : [];
}