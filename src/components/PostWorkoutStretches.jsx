import SessionFlow from "./SessionFlow";

const STRETCH_LIBRARY = {
  chest: [
    { name: "Doorway Chest Stretch", duration: 30, instruction: "Stand in a doorway, arms at 90°. Lean gently forward until you feel the stretch across the chest. Hold steady, keep your back straight." },
    { name: "Cross-Body Shoulder Stretch", duration: 30, instruction: "Pull one arm across your chest and hold at the elbow. Feel the rear delt and upper chest release. Switch sides." },
  ],
  back: [
    { name: "Child's Pose", duration: 45, instruction: "Kneel and sit back onto your heels. Reach both arms forward on the floor. Let your hips sink and feel the lats lengthen. Breathe deeply." },
    { name: "Seated Spinal Twist", duration: 30, instruction: "Sit tall. Cross one leg over the other. Rotate toward the bent knee, using your opposite elbow as a lever. Keep your spine long. Switch sides." },
  ],
  shoulders: [
    { name: "Cross-Body Shoulder Stretch", duration: 30, instruction: "Pull one arm across your chest, hold at the elbow. Feel the rear delt release. Switch sides." },
    { name: "Overhead Tricep Stretch", duration: 30, instruction: "Raise one arm and bend it behind your head. Use the other hand to gently press the elbow down. Feel the long head of the tricep stretch. Switch sides." },
  ],
  biceps: [
    { name: "Wrist Flexor Stretch", duration: 30, instruction: "Extend one arm in front of you, palm up. Use your other hand to gently pull your fingers back toward you. Feel the stretch through the forearm and bicep. Switch sides." },
  ],
  triceps: [
    { name: "Overhead Tricep Stretch", duration: 30, instruction: "Raise one arm and bend it behind your head. Use the other hand to gently press the elbow down. Hold, then switch sides." },
  ],
  quads: [
    { name: "Standing Quad Stretch", duration: 30, instruction: "Stand on one leg and pull your other foot toward your glute. Keep your knees together and stand tall. Use a wall for balance if needed. Switch sides." },
    { name: "Couch Stretch", duration: 45, instruction: "Kneel near a wall. Place one foot up the wall behind you, front foot forward. Tuck your hips under and squeeze the rear glute to deepen the stretch. Switch sides." },
  ],
  hamstrings: [
    { name: "Standing Forward Fold", duration: 45, instruction: "Stand with feet hip-width. Hinge forward from the hips and let your upper body hang. Soft knees if needed. Breathe slowly and let gravity do the work." },
    { name: "Supine Hamstring Stretch", duration: 45, instruction: "Lie on your back and pull one leg toward your chest, keeping it as straight as possible. Use a towel or strap if needed. Hold at your end range. Switch sides." },
  ],
  glutes: [
    { name: "Figure-Four Stretch", duration: 45, instruction: "Lie on your back. Cross one ankle over your opposite knee. Pull both legs toward your chest until you feel a deep stretch in the glute. Switch sides." },
    { name: "Hip Flexor Lunge Stretch", duration: 40, instruction: "Kneel in a low lunge. Sink your hips forward and down, keeping your front shin vertical. Squeeze the rear glute to deepen it. Switch sides." },
  ],
  calves: [
    { name: "Wall Calf Stretch", duration: 30, instruction: "Hands on a wall, one foot back with the heel flat on the floor. Lean in gently. Keep the back leg straight for the gastroc, slightly bent for the soleus. Switch sides." },
  ],
  core: [
    { name: "Cobra Stretch", duration: 30, instruction: "Lie face down. Place your hands under your shoulders and press up, keeping your hips on the floor. Look forward and let the abs lengthen. Hold." },
    { name: "Kneeling Hip Flexor Stretch", duration: 40, instruction: "Kneel on one knee in a lunge. Drive your hips forward while keeping your chest tall. Feel the stretch at the front of the hip of the kneeling leg. Switch sides." },
  ],
};

const MUSCLE_MAP = {
  chest: "chest", back: "back", shoulders: "shoulders",
  biceps: "biceps", triceps: "triceps", quads: "quads",
  hamstrings: "hamstrings", glutes: "glutes", calves: "calves",
  core: "core", legs: ["quads", "hamstrings", "glutes"],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
};

function buildRoutine(muscles = []) {
  const groups = new Set();
  muscles.forEach(m => {
    const key = m.toLowerCase();
    const mapped = MUSCLE_MAP[key];
    if (Array.isArray(mapped)) mapped.forEach(g => groups.add(g));
    else if (mapped) groups.add(mapped);
  });
  if (groups.size === 0) { groups.add("chest"); groups.add("back"); groups.add("shoulders"); }

  const steps = [];
  groups.forEach(group => {
    const lib = STRETCH_LIBRARY[group] || [];
    lib.slice(0, 1).forEach(s => {
      steps.push({
        name: s.name,
        label: s.name,
        duration: s.duration,
        instruction: s.instruction,
        note: group.charAt(0).toUpperCase() + group.slice(1),
      });
    });
  });
  return steps;
}

export default function PostWorkoutStretches({ muscles = [], onDone }) {
  const steps = buildRoutine(muscles);
  if (!steps.length) return null;

  return (
    <SessionFlow
      steps={steps}
      label="Stretch"
      accent="#147a50"
      intro={{
        title: "Cool Down & Stretch",
        subtitle: "After Your Workout",
      }}
      completion={{
        headline: "All done.",
        body: "Good work today. Rest well and come back stronger.",
        scripture: {
          verse: "Do you not know that your body is a temple of the Holy Spirit?",
          ref: "1 Corinthians 6:19",
        },
        cta: "Finish",
      }}
      onDone={onDone}
    />
  );
}
