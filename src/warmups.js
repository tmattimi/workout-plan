// Dynamic warm-up protocols tailored to each session type.
// Each drill primes the specific muscles and movement patterns being trained.
// Duration: 5–7 minutes total. All bodyweight, no equipment needed.

export const warmups = {
  push: {
    label: "Push Day Warm-Up",
    intro: "These drills open up the chest, activate the shoulders, and get the rotator cuff firing before any pressing. Takes about 5 minutes.",
    drills: [
      {
        name: "Arm Circles",
        duration: 30,
        reps: null,
        instruction: "Stand tall. Make slow, controlled circles with both arms — forward for 15 seconds, then backward. Gradually increase the size of the circle as you go. This mobilizes the shoulder joint and starts warming the rotator cuff.",
        why: "The shoulder is the most injury-prone joint in upper body pressing. Warm synovial fluid reduces friction in the joint before you load it.",
      },
      {
        name: "Band Pull-Aparts (or Towel Stretch)",
        duration: 40,
        reps: null,
        instruction: "Hold a resistance band or towel taut in front of you at chest height with both hands about shoulder-width apart. Pull it apart horizontally until it touches your chest, then return. Keep the arms straight throughout. Slow and controlled.",
        why: "Activates the rear delts and external rotators — the muscles that counterbalance heavy pressing. Skipping this is the most common cause of shoulder impingement over time.",
      },
      {
        name: "Wall Slides",
        duration: 45,
        reps: null,
        instruction: "Stand with your back flat against a wall. Press your lower back, upper back, and the backs of your arms against the wall. Slide your arms up overhead and back down — like a slow snow angel. Keep everything in contact with the wall the whole time.",
        why: "Activates the lower traps and teaches proper scapular movement. Sets up the shoulder blade positioning you need for safe bench pressing.",
      },
      {
        name: "Shoulder Pass-Throughs",
        duration: 40,
        reps: null,
        instruction: "Hold a broomstick or band with a very wide grip. Keeping both arms straight, raise it overhead and bring it all the way behind your body to your lower back. Then return. Go only as far as your mobility allows — don't force it. Narrow the grip slowly over reps.",
        why: "Dynamically stretches the anterior shoulder capsule and chest. Increases shoulder mobility for the overhead press.",
      },
      {
        name: "Push-Up to Downward Dog",
        duration: 45,
        reps: null,
        instruction: "Do one slow push-up with full range. At the top, push your hips up and back into downward dog position — arms straight, hips high, heels reaching toward the floor. Hold for 2 seconds. Return to push-up position and repeat.",
        why: "Warms the chest, shoulders, and triceps through the pushing pattern while also stretching the lat and thoracic spine — exactly the combination needed before pressing sessions.",
      },
      {
        name: "Thoracic Rotation",
        duration: 40,
        reps: null,
        instruction: "Sit cross-legged on the floor or kneel. Place one hand behind your head. Rotate your upper back — not your hips — to open your elbow toward the ceiling. Hold for a second, then return. Do 10 rotations per side.",
        why: "Thoracic mobility directly affects how much you can retract the scapulae during pressing. A stiff upper back limits scapular retraction, which transfers stress to the shoulder joint.",
      },
    ],
  },

  pull: {
    label: "Pull Day Warm-Up",
    intro: "These drills activate the lats, prime the scapular stabilizers, and open up the bicep for heavy pulling. Takes about 5 minutes.",
    drills: [
      {
        name: "Dead Hang",
        duration: 30,
        reps: null,
        instruction: "Hang from a pull-up bar with a full dead hang — arms completely straight, shoulders relaxed up by the ears. Just hang. Let gravity decompress the spine and stretch the lat. After 15 seconds, depress and retract the shoulder blades so the shoulders pull away from the ears without bending the elbows.",
        why: "Decompresses the shoulder joint after daily compression, and teaches the shoulder blade packing position needed at the bottom of every pull-up and pulldown.",
      },
      {
        name: "Scapular Pull-Up",
        duration: 40,
        reps: null,
        instruction: "Start in a dead hang. Without bending the elbows at all, squeeze the shoulder blades down and together — your body will rise an inch or two. Then let them rise back up. That's one rep. Do 8–10 slow reps. This is not a pull-up — the elbows stay straight the entire time.",
        why: "Directly activates the lower traps and serratus, which initiate every proper pulling rep. Warming these up dramatically improves lat recruitment in the main work sets.",
      },
      {
        name: "Cat-Cow",
        duration: 30,
        reps: null,
        instruction: "On hands and knees. Breathe in as you arch the lower back and look up (cow). Breathe out as you round the back and tuck the chin (cat). 10 slow, full reps. Let the spine move through its full range.",
        why: "Mobilizes the thoracic spine so the upper back can fully flex and extend during rowing movements — particularly important for feeling the mid-back stretch at the start of each rep.",
      },
      {
        name: "Band Straight-Arm Pulldown (or Towel Over Door)",
        duration: 40,
        reps: null,
        instruction: "Attach a band to something above you or use a towel over a door. Facing the anchor, arms extended overhead, pull the band down to your hips keeping the arms straight. Squeeze the lats at the bottom. Slow return. 12 reps.",
        why: "Isolates the lat mind-muscle connection before adding load. People who can't feel their lats working in pulldowns benefit most from doing this first.",
      },
      {
        name: "Face Pull (Band or Light Cable)",
        duration: 40,
        reps: null,
        instruction: "Using a light band or the cable at face height, perform 15 slow face pulls. Pull to the forehead with elbows high and wide. Squeeze the rear delts hard at the top. This is also in the main workout — treat these as feeder sets at a much lighter weight.",
        why: "Activates the rear delts and external rotators before the session puts load on the back. Also serves as a rehearsal rep for the main exercise.",
      },
      {
        name: "Bicep Flexion and Extension",
        duration: 30,
        reps: null,
        instruction: "Stand with arms hanging at your sides. Slowly curl both arms to full contraction, supinating at the top. Then lower slowly to a full stretch — arms slightly behind the body at the bottom. 10 very slow reps with no weight. Focus on feeling the stretch at the bottom.",
        why: "Warms the bicep tendon at its insertion point — one of the most common pull day injury sites. The slow eccentric at the bottom is especially important before heavy curl work.",
      },
    ],
  },

  legs: {
    label: "Leg Day Warm-Up",
    intro: "These drills activate the glutes, mobilize the hips, and prepare the knee and ankle for heavy loading. Takes about 6 minutes. Don't skip this one — cold glutes are the most common reason people feel hip thrusts in their lower back instead.",
    drills: [
      {
        name: "Glute Bridge",
        duration: 45,
        reps: null,
        instruction: "Lie on your back, knees bent, feet flat on the floor. Drive the hips up and squeeze the glutes hard at the top — hold for 2 full seconds. Lower slowly. Do 15 reps. Focus entirely on feeling the glutes fire, not the lower back. If you feel it in the lower back, push through the heels more and tuck the chin.",
        why: "This is a lighter version of the hip thrust used specifically to establish the glute mind-muscle connection before loading. Starting heavy with cold glutes causes the lower back and hamstrings to dominate — this prevents that.",
      },
      {
        name: "Clamshell",
        duration: 40,
        reps: null,
        instruction: "Lie on your side with knees bent and hips stacked. Keeping the feet together, rotate the top knee open toward the ceiling as far as you can without your hips rolling back. Lower slowly. 15 reps each side.",
        why: "Activates the gluteus medius — the hip stabilizer that controls knee tracking in every squat and lunge variation. Weakness here is the primary cause of knee caving.",
      },
      {
        name: "Hip 90/90 Stretch",
        duration: 50,
        reps: null,
        instruction: "Sit on the floor with both legs bent at 90° — one in front and one behind. Both shins flat on the floor. Sit tall and lean slightly forward over the front shin. Hold 20 seconds. Then rotate both legs to switch which side is forward. Two rounds each side.",
        why: "Opens internal and external hip rotation simultaneously. Restricted hip rotation forces the knee to compensate during squats and lunges — this addresses it directly.",
      },
      {
        name: "Leg Swing",
        duration: 40,
        reps: null,
        instruction: "Hold onto something for balance. Swing one leg forward and back in a controlled arc — as high as comfortable. 15 swings. Then swing the same leg across the body and out to the side. 15 swings. Repeat on the other leg.",
        why: "Dynamically lengthens the hip flexors and hamstrings through movement rather than static stretch. Movement-based warm-ups are more effective than static stretching before training.",
      },
      {
        name: "Bodyweight Squat",
        duration: 40,
        reps: null,
        instruction: "Feet shoulder-width, toes out. Squat as deep as your mobility allows — aim for thighs parallel or below. Drive through the whole foot to stand. 15 slow reps. Pause at the bottom for 1 second on each rep. Keep the chest up throughout.",
        why: "Rehearses the squat and lunge pattern, warms the knee joint, and checks ankle mobility. If you can't hit depth comfortably here, ankle mobility needs attention before loading.",
      },
      {
        name: "Walking Lunge",
        duration: 40,
        reps: null,
        instruction: "10 walking lunges total — 5 each leg. Slow and controlled. Focus on the front knee tracking over the second toe, not caving inward. Let the rear knee come close to the floor. Core braced.",
        why: "Rehearses the split squat pattern used in Bulgarian split squats. The unilateral movement pattern also activates the glute medius before loading.",
      },
    ],
  },

  rest: {
    label: "Recovery Day Mobility",
    intro: "Today is recovery. These movements reduce soreness from the week and maintain the range of motion you've built. None of this should be intense — if anything hurts, back off.",
    drills: [
      {
        name: "Child's Pose with Lat Reach",
        duration: 60,
        reps: null,
        instruction: "Kneel and sit back toward your heels. Extend both arms forward on the floor. Walk the hands to the right to feel a stretch in the left lat. Hold 20 seconds. Walk to the left. Repeat twice each side.",
        why: "Passively stretches the lat and thoracic spine after heavy pulling sessions. Also decompresses the lower back.",
      },
      {
        name: "Pigeon Pose",
        duration: 60,
        reps: null,
        instruction: "From a plank, bring one knee forward and place it behind your wrist. Extend the other leg straight back. Lower the hips toward the floor. Hold for 30 seconds. Don't force depth — just breathe and let the hip relax. Switch sides.",
        why: "The glutes, hip external rotators, and hip flexors all shorten after heavy hip thrust and split squat work. Pigeon pose targets all of them simultaneously.",
      },
      {
        name: "Thoracic Foam Roll",
        duration: 60,
        reps: null,
        instruction: "Place a foam roller perpendicular to your spine at mid-back level. Arms crossed over the chest. Lean back over the roller and extend. Move the roller up one segment, repeat. Work from the middle of the back to the top of the shoulder blades.",
        why: "Heavy pressing and rowing compresses the thoracic spine over time. Rolling it out restores mobility for the following week.",
      },
      {
        name: "90-90 Hip Stretch",
        duration: 50,
        reps: null,
        instruction: "Same as the leg day warm-up version. Sit on the floor, both legs bent at 90°, both shins flat. Lean slightly forward. Hold 30 seconds each side. Two rounds.",
        why: "After a full week of bilateral and unilateral leg training, hip mobility work is the most valuable recovery investment.",
      },
      {
        name: "Dead Hang",
        duration: 30,
        reps: null,
        instruction: "Hang from a pull-up bar for 30 seconds — completely relaxed. Let the spine decompress.",
        why: "Decompresses the spine and shoulder girdle after a week of loading. 30 seconds of passive hang has been shown to reduce subjective shoulder tightness.",
      },
    ],
  },
};

// Assign warm-up type to each day
export function getWarmupForDay(dayType) {
  if (dayType === 'push') return warmups.push;
  if (dayType === 'pull') return warmups.pull;
  if (dayType === 'legs') return warmups.legs;
  return warmups.rest;
}
