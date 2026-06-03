import { useState } from "react";
import MuscleMap from "./MuscleMap";

const FRONT=['chest','shoulders','biceps','core','quads','calves'];
const BACK=['back','shoulders','triceps','glutes','hamstrings','calves'];

const D={
  chest:{label:'Chest',clinical:'Pectoralis major and minor',cat:'Horizontal push',c:'#2563a8',l:'#dbeafe',
    overview:'The pec major has two sections with different fiber directions that respond to different training angles. Flat pressing alone will not fully develop the chest because the upper section requires resistance coming from below — which only happens at an incline.',
    regions:[
      {name:'Clavicular head (upper pec)',dot:'#3b82f6',act:'Originates from the collarbone and fans diagonally downward. Most active at 30 to 45 degree incline where resistance comes from below. Flat pressing barely activates it. This is the section most people underdevelop by over-prioritizing flat work.',exs:['Incline Dumbbell Press','Incline Barbell Press','Cable Fly Low-to-High']},
      {name:'Sternal head (lower pec)',dot:'#1e40af',act:'The larger section originating from the sternum and ribs. Flat pressing primarily trains this head. It reaches its deepest stretch at the bottom of a dumbbell press when the arms travel wide, which is why a controlled descent produces consistently better results than bouncing the weight.',exs:['Dumbbell Bench Press','Flat Dumbbell Fly','Cable Crossover']},
      {name:'Pectoralis minor',dot:'#1e3a8a',act:'A smaller muscle beneath the pec major that stabilizes the shoulder blade during pressing. Cannot be isolated. Chronic tightness here contributes to rounded-shoulder posture and is worth addressing through mobility work.',exs:['All pressing movements (indirect)']},
    ],
    biomech:'Dumbbell pressing allows the arms to travel wider than a barbell, creating a deeper stretch on the sternal fibers. This greater range produces more mechanical tension per set. Most people benefit from prioritizing incline work rather than treating flat and incline as equal.',
    vol:'10 to 20 working sets per week across two sessions. Every chest session should include a dedicated incline movement.',
    errors:['Elbows flaring past 75 degrees shifts stress from the pec onto the shoulder joint','Bouncing off the chest removes the stretched position — the most important part of the range','Shoulders rolling forward at the top means the anterior deltoid is compensating','Not retracting the shoulder blades before pressing increases impingement risk over time']
  },
  shoulders:{label:'Shoulders',clinical:'Deltoideus — anterior, lateral, posterior',cat:'Multi-directional mover',c:'#7c3aed',l:'#ede9fe',
    overview:'Three heads with completely different functions and training requirements. The front is already well covered by pressing. The side and rear receive almost nothing from pressing and need dedicated direct work. Most people overtrain the front and neglect the other two.',
    regions:[
      {name:'Anterior deltoid (front)',dot:'#a78bfa',act:'Raises the arm forward and assists all pressing. If you press three to four times per week, the front delt is already well stimulated. Adding front raises on top is one of the most common ways to overtrain a single muscle head without realizing it.',exs:['Overhead Press (indirect)','All pressing (indirect)']},
      {name:'Lateral deltoid (side)',dot:'#7c3aed',act:'The main driver of shoulder width. Gets minimal stimulus from pressing. Cable raises are more effective than dumbbell raises because they maintain tension at the bottom of the range where a dumbbell hanging at the side produces almost no force.',exs:['Cable Lateral Raise','Dumbbell Lateral Raise']},
      {name:'Posterior deltoid (rear)',dot:'#4c1d95',act:'Pulls the arm back and rotates it outward. The most neglected head. When weak relative to the front, the shoulder is pulled into a forward-tilted position under pressing load, which is the most common mechanical cause of shoulder impingement.',exs:['Face Pull','Rear Delt Fly','Band Pull-Apart']},
    ],
    biomech:'At the start of a dumbbell lateral raise with the arm hanging down, gravity and the arm are parallel — producing zero torque at the shoulder. A cable redirects the force vector and maintains tension throughout the entire range. This difference becomes significant across a full training program.',
    vol:'The lateral and rear delts each need 12 to 20 direct sets per week. The front delt does not need direct work if you press regularly.',
    errors:['Shrugging the traps to initiate lateral raises means the upper trap is generating the movement instead of the lateral delt','Too much weight turns the raise into a momentum exercise with minimal muscular involvement','Neglecting rear delts while adding pressing volume makes the shoulder imbalance progressively worse','Skipping external rotation work compounds the rotational stress that heavy pressing creates']
  },
  back:{label:'Back',clinical:'Latissimus dorsi, trapezius, rhomboids',cat:'Vertical and horizontal pull',c:'#16a34a',l:'#dcfce7',
    overview:'Back development requires two different movement patterns. Vertical pulling builds lat width. Horizontal pulling builds mid-back thickness. These train different muscles and cannot substitute for each other — a complete program needs both.',
    regions:[
      {name:'Latissimus dorsi',dot:'#16a34a',act:'The largest back muscle, responsible for the V-taper by adding width below the armpits. It attaches to the thoracolumbar fascia and inserts on the upper arm. The lat only reaches its full length when the arm is completely extended overhead — stopping a pulldown short cuts off the stretch that drives the most adaptation.',exs:['Pull-Up','Lat Pulldown','Single-Arm Row','Straight-Arm Pulldown']},
      {name:'Middle trapezius and rhomboids',dot:'#15803d',act:'The mid-trap retracts the shoulder blades and is most active when the elbows pass behind the torso at the top of a row. The rhomboids sit between the blades and add mid-back thickness. The pause and squeeze at the peak of every row is specifically where this work happens — most people cut rows short and miss it entirely.',exs:['Seated Cable Row','Chest-Supported Row','Barbell Row']},
      {name:'Upper trapezius',dot:'#166534',act:'Elevates the shoulder blades. Often already overactive and tight. Rarely needs direct training and is frequently overtrained through shrugs. Releasing tension here is usually more beneficial than adding more volume.',exs:['Shrugs — rarely needed']},
    ],
    biomech:'Stopping a lat pulldown before full arm extension is the equivalent of doing partial reps. The lat reaches its full stretch only at complete overhead arm extension, where mechanical tension is highest. That is where the most important growth stimulus occurs.',
    vol:'15 to 22 sets per week, split roughly equally between vertical pulling and horizontal rowing.',
    errors:['Not reaching full arm extension at the bottom of pulldowns removes the stretch entirely','Rowing with the arms instead of driving the elbows back means the biceps generate most of the force','Not pausing at peak scapular retraction means the rhomboids and mid-traps barely reach their working range','Pulling the bar behind the neck places excessive stress on the cervical spine']
  },
  biceps:{label:'Biceps',clinical:'Biceps brachii, brachialis',cat:'Elbow flexion',c:'#0d9488',l:'#ccfbf1',
    overview:'Three muscles with different grip requirements. The brachialis sits underneath the bicep and is the stronger elbow flexor of the two. When it is well developed, it physically pushes the bicep upward, creating a higher peak without the bicep itself getting bigger.',
    regions:[
      {name:'Long head (outer, the peak)',dot:'#0d9488',act:'Creates the bicep peak when flexed. Because it crosses the shoulder joint, its stretch depends on shoulder position as well as elbow position. When the arm hangs behind the body during an incline curl, the long head is pre-stretched before the movement begins. Standard standing curls do not achieve this position.',exs:['Incline Dumbbell Curl','Spider Curl','Cable Curl (arm behind body)']},
      {name:'Short head (inner, the width)',dot:'#0f766e',act:'Contributes to bicep width from the front. More active during the contracted position at the top of a curl. Supinating the wrist outward at the top specifically recruits this head — hammer curls with a neutral grip reduce its involvement.',exs:['Alternating Dumbbell Curl','Preacher Curl','Barbell Curl']},
      {name:'Brachialis (underneath, the thickness)',dot:'#134e4a',act:'The stronger elbow flexor. Only flexes the elbow with no supination function. A neutral thumb-up grip reduces bicep involvement and shifts more load onto the brachialis. When it develops, it pushes the bicep heads upward from underneath.',exs:['Hammer Curl','Cross-Body Hammer Curl','Neutral-Grip Pulldown']},
    ],
    biomech:'A cable curl provides resistance at full arm extension where a dumbbell produces almost no force. Loading the bicep in its lengthened position at the bottom of the range is an important part of the training stimulus, which is why cable curls consistently produce strong results despite feeling easier.',
    vol:'12 to 20 sets per week across stretch-position, peak-contraction, and neutral-grip movements. Biceps recover quickly and respond well to two to three sessions per week.',
    errors:['Not supinating at the top of curls leaves the short head mostly uninvolved throughout the set','Torso swing transfers load to the lower back and makes the set essentially useless','Stopping short of full arm extension removes the loaded stretch at the bottom','Elbows drifting forward on incline curls eliminates the shoulder position that makes the exercise effective']
  },
  triceps:{label:'Triceps',clinical:'Triceps brachii — long, lateral, medial heads',cat:'Elbow extension',c:'#1d4ed8',l:'#dbeafe',
    overview:'The triceps make up roughly two thirds of upper arm size. The long head, the largest of the three at about 55% of total tricep volume, can only be fully stretched with the arm overhead. A program built entirely on pushdowns develops the outer horseshoe while chronically undertraining the biggest part of the muscle.',
    regions:[
      {name:'Long head (largest, requires overhead)',dot:'#3b82f6',act:'Runs along the underside of the arm and originates above the shoulder joint on the scapula. In a pushdown the shoulder is neutral and the long head is in a shortened position. In an overhead extension the shoulder is fully flexed and the long head is at maximum length. This is why overhead work produces far more stimulus for the long head than pushdowns do.',exs:['Overhead Tricep Extension','Skull Crusher','JM Press']},
      {name:'Lateral head (outer, the horseshoe)',dot:'#1d4ed8',act:'Creates the horseshoe shape visible from the side. Does not cross the shoulder joint, so elbow position determines its involvement. Most active at and below neutral arm position. Pushdown variations train this head well.',exs:['Rope Pushdown','Straight-Bar Pushdown','Close-Grip Bench Press']},
      {name:'Medial head (deep stabilizer)',dot:'#1e3a8a',act:'The deepest head, active throughout the full range of elbow extension. Provides joint stability and is most active at full lockout. Cannot be meaningfully isolated and is adequately trained through any complete tricep program.',exs:['All tricep exercises (synergist)']},
    ],
    biomech:'The long head originates from above the shoulder joint on the scapula. Bringing the arm overhead stretches this attachment, placing the long head at its maximum length before the extension begins. This pre-stretch increases mechanical tension during the movement, which is why overhead work is genuinely necessary for complete tricep development.',
    vol:'10 to 18 sets per week with at least one overhead extension movement every session. Account for the indirect volume triceps receive from all pressing work.',
    errors:['Only training pushdowns leaves the long head — the largest portion of the muscle — chronically understimulated','Elbows flaring during overhead extensions shifts stress onto the elbow joint','Upper arms moving during pushdowns means the shoulder is assisting instead of the tricep working in isolation','Not spreading the rope at the bottom of rope pushdowns misses the lateral head end-range contraction']
  },
  core:{label:'Core',clinical:'TVA, rectus abdominis, obliques',cat:'Spinal stabilization',c:'#059669',l:'#d1fae5',
    overview:'The core is a cylinder of muscles surrounding the spine on all sides. The deepest layer acts like a natural weightlifting belt and needs to be developed first. Training visible surface muscles without the deep stability foundation is extremely common and explains why many people with visible abs still have back problems.',
    regions:[
      {name:'Transverse abdominis (TVA)',dot:'#059669',act:'The deepest abdominal muscle, wrapping horizontally around the torso. When it contracts it increases internal pressure and stiffens the entire trunk, protecting the spine under load. This is the muscle doing the work when you brace before a heavy lift. In healthy spines it fires automatically before arm and leg movements as a protective reflex.',exs:['Dead Bug','Plank with active brace','Ab Wheel Rollout']},
      {name:'Rectus abdominis (six-pack)',dot:'#047857',act:'The paired vertical columns running down the front of the abdomen. Responds to progressive overload like any other muscle. Bodyweight crunches plateau quickly. Cable crunches allow you to add resistance over time and should become the primary loaded ab exercise once basic stability is established.',exs:['Cable Crunch','Hanging Leg Raise','Ab Wheel Rollout']},
      {name:'Obliques (internal and external)',dot:'#065f46',act:'The angled fibers on the sides of the torso. Their most important function is resisting rotation under load, not producing it. Every squat, deadlift, and single-arm exercise creates rotational forces on the spine that the obliques counteract isometrically. The Pallof press trains this pattern directly.',exs:['Pallof Press','Side Plank','Copenhagen Plank']},
    ],
    biomech:'The TVA creates intra-abdominal pressure by compressing the abdominal contents when it contracts. The technique that maximizes this is to breathe into the belly, expand outward in all directions including the sides and back, and then brace hard before the movement begins — creating a rigid cylinder around the spine.',
    vol:'Three to four core exercises two to three times per week. Build from anti-movement work first — planks, dead bugs, Pallof presses — before progressing to loaded flexion exercises like cable crunches.',
    errors:['Crunching without posterior pelvic tilt means the hip flexors are doing most of the work','Staying at bodyweight exercises indefinitely without adding load is the same as refusing to progress any other muscle','Training visible abs without deep stability work creates a strong surface over an unreliable foundation','Only programming flexion and ignoring anti-rotation and lateral stability leaves significant functional gaps']
  },
  glutes:{label:'Glutes',clinical:'Gluteus maximus, medius, minimus',cat:'Hip extension and pelvic stability',c:'#b91c1c',l:'#fee2e2',
    overview:'The largest muscle complex in the body. The key training principle is that the glute max reaches peak activation at full hip extension, not at the bottom of a movement. This one fact explains why the hip thrust consistently outperforms squats and deadlifts for glute development.',
    regions:[
      {name:'Gluteus maximus',dot:'#b91c1c',act:'Drives the hips into extension. Peak activation occurs at full hip extension — the top of a hip thrust, not the bottom. In a squat the deepest and hardest position is quad-dominant. In a hip thrust the hardest position is the top, which is precisely when the glute max is most active.',exs:['Hip Thrust','Single-Leg Hip Thrust','Romanian Deadlift','Cable Pull-Through']},
      {name:'Gluteus medius',dot:'#991b1b',act:'Located on the lateral hip. Abducts the leg and stabilizes the pelvis during any single-leg activity. When weak, the pelvis drops on the non-stance side, creating a valgus force at the knee. Knee cave during squats and lunges is most often a glute medius strength issue rather than a flexibility problem.',exs:['Bulgarian Split Squat','Single-Leg Hip Thrust','Clamshell','Hip Abduction Machine']},
      {name:'Gluteus minimus',dot:'#7f1d1d',act:'The smallest and deepest glute, sitting beneath the medius. Assists with abduction and internal hip rotation. Cannot be trained independently — it responds whenever the glute medius is effectively targeted. Programming adequately for the medius covers the minimus.',exs:['Same exercises as gluteus medius']},
    ],
    biomech:'The hip thrust uses a horizontal resistance vector. The load pulls straight down but the movement is a horizontal rotation of the hip, meaning peak resistance occurs at the top of the movement when the hip is fully extended. Squats and deadlifts use a vertical load distributed across multiple muscle groups simultaneously, which dilutes the glute-specific stimulus.',
    vol:'12 to 20 direct sets per week including both hip extension and hip abduction work. Glutes recover relatively quickly and respond well to two to three sessions per week.',
    errors:['Hyperextending the lower back at the top substitutes lumbar extension for the glute contraction','Pushing through the toes instead of the heels shifts load toward the quads','Not reaching full hip extension means the peak activation position is consistently missed','Training only bilateral movements leaves the glute medius unaddressed and asymmetries between sides hidden']
  },
  hamstrings:{label:'Hamstrings',clinical:'Biceps femoris, semimembranosus, semitendinosus',cat:'Knee flexion and hip extension',c:'#b45309',l:'#fef3c7',
    overview:'The hamstrings cross two joints and perform two different actions. The muscles most responsible for each action are different, and the exercises that train each are completely different. Hip hinges and leg curls are not interchangeable — a complete program needs both.',
    regions:[
      {name:'Biceps femoris long head (outer)',dot:'#b45309',act:'The outer hamstring and the most hypertrophy-responsive of the group. Crosses both the hip and knee, so it is most challenged when loaded in a lengthened position — hip flexed and knee relatively extended simultaneously. The Romanian deadlift achieves this. Loading a muscle in its stretched position produces a particularly strong growth stimulus.',exs:['Romanian Deadlift','Stiff-Leg Deadlift','Nordic Hamstring Curl']},
      {name:'Biceps femoris short head',dot:'#92400e',act:'Located alongside the long head on the outer thigh but only crosses the knee, not the hip. Active only during knee flexion, not during hip hinge movements. Responds to leg curl variations rather than RDLs — this is why leg curls cannot be replaced by RDLs alone.',exs:['Lying Leg Curl','Seated Leg Curl','Single-Leg Curl']},
      {name:'Semimembranosus and semitendinosus (inner)',dot:'#78350f',act:'The two medial hamstring muscles running along the inner thigh. Both are primarily knee flexors. The semimembranosus is larger and deeper; the semitendinosus is superficial with a long tendon. Trained through the same leg curl variations.',exs:['Lying Leg Curl','Seated Leg Curl','Single-Leg Curl']},
    ],
    biomech:'Loading a muscle at its longest length generates high mechanical tension that is one of the primary drivers of muscle growth. The RDL places the biceps femoris long head under load at near maximum length. Leg curls load in a more shortened position and target the muscles that only cross the knee. Both stimulus types are needed.',
    vol:'10 to 20 sets per week split between hip hinge movements and leg curl variations. Always include at least one unilateral exercise — hamstring strength asymmetry between sides is extremely common and bilateral exercises hide it.',
    errors:['Lower back rounding during RDLs transfers load onto the lumbar spine and removes the hamstring hinge','Too much knee bend converts the RDL into a squat and removes the hamstring stretch','Cutting the leg curl short at the bottom removes the stretched position that provides the most stimulus','Only bilateral leg curls mean strength differences between legs go undetected and unaddressed']
  },
  quads:{label:'Quadriceps',clinical:'Rectus femoris, vastus lateralis, VMO, vastus intermedius',cat:'Knee extension',c:'#d97706',l:'#fef9c3',
    overview:'Four muscles that extend the knee. The rectus femoris also crosses the hip, making it uniquely sensitive to hip position. The VMO stabilizes the kneecap and its weakness is the primary mechanical cause of anterior knee pain during squatting.',
    regions:[
      {name:'Rectus femoris (center)',dot:'#d97706',act:'The only quad crossing both the hip and knee. Hip position significantly affects how much it contributes to any exercise. Maximally challenged when the hip is extended while the knee is under load, as in the bottom of a Bulgarian split squat or deep lunge. In a leg press or seated extension the hip is flexed, shortening the rectus and reducing its contribution.',exs:['Bulgarian Split Squat','Reverse Lunge','Goblet Squat','Leg Press at full depth']},
      {name:'Vastus lateralis (outer sweep)',dot:'#b45309',act:'The largest quad muscle and the primary force producer in knee extension. Creates the lateral sweep visible from the front of the thigh. Consistently activated across most knee-dominant exercises and does not need specialized targeting.',exs:['Leg Press','Leg Extension','Hack Squat']},
      {name:'VMO — vastus medialis oblique (teardrop)',dot:'#92400e',act:'The teardrop-shaped section just above the inner kneecap. Most active in the final 15 to 30 degrees of extension. Its fiber direction pulls the kneecap medially, keeping it centered in the femoral groove. When weak relative to the vastus lateralis, the kneecap tracks laterally under load and creates the grinding pain many people experience when squatting.',exs:['Leg Extension with pause at top','Step-Up','Terminal Knee Extension']},
      {name:'Vastus intermedius (deep)',dot:'#78350f',act:'The deepest of the four, sitting against the femur beneath the rectus femoris. Active throughout the full range of knee extension. Cannot be isolated and is adequately trained through all other quad work as a synergist.',exs:['All knee extension exercises (synergist)']},
    ],
    biomech:"The VMO's fiber angle of roughly 55 degrees from the femur is what allows it to pull the kneecap medially. When insufficient, the kneecap is pulled laterally, increasing contact pressure on the outer portion of the joint. This is the mechanical explanation for anterior knee pain with squatting, and building VMO strength through full-range exercises and terminal extension work is the direct intervention.",
    vol:'12 to 20 sets per week mixing compound movements with some isolation work. Higher rep ranges of 12 to 20 work particularly well for quad hypertrophy.',
    errors:['Knee valgus under load is a strength issue caused by VMO and glute medius weakness, not a flexibility problem','Shallow squatting dramatically reduces stimulus on both the rectus femoris and VMO','Skipping the pause at the top of leg extensions means the VMO barely receives any training stimulus','Aggressive lockout on the leg press creates unnecessary patellar tendon stress with no additional training benefit']
  },
  calves:{label:'Calves',clinical:'Gastrocnemius, soleus',cat:'Plantarflexion',c:'#c2410c',l:'#ffedd5',
    overview:'Two muscles with different fiber types requiring completely different training positions. A straight knee trains the gastrocnemius. A bent knee trains the soleus. Most people do only standing raises and unknowingly neglect the soleus, which accounts for a substantial portion of total calf size.',
    regions:[
      {name:'Gastrocnemius (outer calf)',dot:'#c2410c',act:'The large two-headed muscle creating the rounded calf shape from behind. Has a medial and lateral head. Because it originates above the knee on the back of the femur, it becomes mechanically inefficient when the knee is bent — both ends shorten simultaneously, limiting force output. Standing raises are the only way to fully train it.',exs:['Standing Calf Raise','Single-Leg Standing Calf Raise','Donkey Calf Raise']},
      {name:'Soleus (deep calf)',dot:'#9a3412',act:'Sits beneath the gastrocnemius and makes up a large portion of total calf volume. Originates below the knee so it remains fully active regardless of knee position. Predominantly slow-twitch, meaning it responds better to higher reps of 15 to 25 and sustained tension. Seated raises are the only movement that specifically targets it.',exs:['Seated Calf Raise']},
    ],
    biomech:'When the knee is bent, the gastrocnemius is shortened at both its upper attachment on the femur and its lower attachment through plantarflexion simultaneously. A muscle cannot generate full tension when shortened at both ends, which is why seated raises effectively isolate the soleus.',
    vol:'15 to 22 sets per week split between standing and seated variations. Calves are conditioned by daily walking and typically require higher training frequency than most muscles — three to four sessions per week is often necessary.',
    errors:['Only standing raises means the soleus is never directly trained regardless of total volume accumulated','Not dropping the heel fully below the step removes the stretch position that provides the most growth stimulus','Bouncing at the bottom uses Achilles tendon recoil as momentum instead of muscle force','Low reps on seated raises work against the slow-twitch fiber composition of the soleus']
  },
};

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function MuscleScience() {
  const [view, setView] = useState('front');
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('anatomy');
  const [expR, setExpR] = useState(null);

  function pick(id) { setSel(id); setTab('anatomy'); setExpR(null); }
  function goBack() { setSel(null); }

  const list = view === 'front' ? FRONT : BACK;

  // SVG color helpers
  const fc = (id) => !sel ? D[id].l + 'cc' : sel === id ? D[id].c : D[id].l + '33';
  const sc = (id) => sel === id ? D[id].c : D[id].c + '44';
  const sw = (id) => sel === id ? 2 : 1;

  const frontSVG = () => (
    <svg viewBox="0 0 120 420" width="100" height="350" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="sk" cx="40%" cy="30%" r="60%"><stop offset="0%" stopColor="#f5e8d5"/><stop offset="100%" stopColor="#d4b888"/></radialGradient></defs>
      {/* head */}
      <ellipse cx="60" cy="22" rx="15" ry="19" fill="url(#sk)" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="60" cy="10" rx="14" ry="9" fill="#5c3820"/>
      <ellipse cx="49" cy="24" rx="2" ry="3" fill="#d4b888" stroke="#c8b080" strokeWidth="0.4"/>
      <ellipse cx="71" cy="24" rx="2" ry="3" fill="#d4b888" stroke="#c8b080" strokeWidth="0.4"/>
      <ellipse cx="55" cy="20" rx="1.8" ry="1.5" fill="#7a5c3c"/>
      <ellipse cx="65" cy="20" rx="1.8" ry="1.5" fill="#7a5c3c"/>
      <path d="M56,28 Q60,32 64,28" fill="none" stroke="#d4b888" strokeWidth="0.7"/>
      {/* neck */}
      <path d="M54,40 Q49,43 48,50 Q51,53 55,52 L55,40Z" fill="#d4b888"/>
      <path d="M66,40 Q71,43 72,50 Q69,53 65,52 L65,40Z" fill="#d4b888"/>
      <rect x="53" y="40" width="14" height="13" rx="3" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {/* clavicles */}
      <path d="M53,51 Q40,47 28,55" fill="none" stroke="#c8b080" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M67,51 Q80,47 92,55" fill="none" stroke="#c8b080" strokeWidth="1.5" strokeLinecap="round"/>
      {/* SHOULDERS */}
      <ellipse cx="20" cy="70" rx="10" ry="14" fill={fc('shoulders')} stroke={sc('shoulders')} strokeWidth={sw('shoulders')} onClick={() => pick('shoulders')} style={{cursor:'pointer'}}/>
      <ellipse cx="100" cy="70" rx="10" ry="14" fill={fc('shoulders')} stroke={sc('shoulders')} strokeWidth={sw('shoulders')} onClick={() => pick('shoulders')} style={{cursor:'pointer'}}/>
      {/* CHEST upper */}
      <path d="M28,55 Q17,62 16,74 Q18,82 27,85 Q36,83 40,72 Q42,61 36,53Z" fill={fc('chest')} stroke={sc('chest')} strokeWidth={sw('chest')} onClick={() => pick('chest')} style={{cursor:'pointer'}}/>
      <path d="M19,65 Q27,73 38,79" fill="none" stroke={sc('chest')} strokeWidth="0.6" opacity="0.8"/>
      {/* CHEST lower */}
      <path d="M16,78 Q13,89 15,102 Q21,110 34,111 Q46,107 49,95 Q50,84 43,79 Q35,87 23,84Z" fill={fc('chest')} stroke={sc('chest')} strokeWidth={sw('chest')} onClick={() => pick('chest')} style={{cursor:'pointer'}}/>
      <path d="M15,86 Q25,97 43,105" fill="none" stroke={sc('chest')} strokeWidth="0.6" opacity="0.7"/>
      <path d="M15,95 Q25,104 41,109" fill="none" stroke={sc('chest')} strokeWidth="0.5" opacity="0.5"/>
      {/* right chest */}
      <path d="M92,55 Q103,62 104,74 Q102,82 93,85 Q84,83 80,72 Q78,61 84,53Z" fill={fc('chest')} stroke={sc('chest')} strokeWidth={sw('chest')} onClick={() => pick('chest')} style={{cursor:'pointer'}}/>
      <path d="M101,65 Q93,73 82,79" fill="none" stroke={sc('chest')} strokeWidth="0.6" opacity="0.8"/>
      <path d="M104,78 Q107,89 105,102 Q99,110 86,111 Q74,107 71,95 Q70,84 77,79 Q85,87 97,84Z" fill={fc('chest')} stroke={sc('chest')} strokeWidth={sw('chest')} onClick={() => pick('chest')} style={{cursor:'pointer'}}/>
      <path d="M105,86 Q95,97 77,105" fill="none" stroke={sc('chest')} strokeWidth="0.6" opacity="0.7"/>
      {/* sternum */}
      <line x1="58" y1="51" x2="58" y2="112" stroke="#c8b080" strokeWidth="0.6" strokeDasharray="3,3"/>
      <line x1="62" y1="51" x2="62" y2="112" stroke="#c8b080" strokeWidth="0.6" strokeDasharray="3,3"/>
      {/* BICEPS left */}
      <path d="M9,78 Q2,91 3,108 Q5,117 12,120 Q20,117 23,107 Q25,91 19,78Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      <path d="M4,98 Q9,92 15,98" fill="none" stroke={sc('biceps')} strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      <path d="M20,76 Q26,88 26,105 Q24,114 20,116 Q16,113 15,105 Q13,89 16,76Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} opacity="0.72" onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      <path d="M3,110 Q1,120 4,126 Q8,130 14,129 Q20,126 22,118Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} opacity="0.62" onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      {/* BICEPS right */}
      <path d="M111,78 Q118,91 117,108 Q115,117 108,120 Q100,117 97,107 Q95,91 101,78Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      <path d="M116,98 Q111,92 105,98" fill="none" stroke={sc('biceps')} strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      <path d="M100,76 Q94,88 94,105 Q96,114 100,116 Q104,113 105,105 Q107,89 104,76Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} opacity="0.72" onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      <path d="M117,110 Q119,120 116,126 Q112,130 106,129 Q100,126 98,118Z" fill={fc('biceps')} stroke={sc('biceps')} strokeWidth={sw('biceps')} opacity="0.62" onClick={() => pick('biceps')} style={{cursor:'pointer'}}/>
      {/* forearms */}
      <path d="M0,130 Q-5,143 -3,157 Q0,165 7,165 Q14,162 16,151 Q17,139 14,129Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M120,130 Q125,143 123,157 Q120,165 113,165 Q106,162 104,151 Q103,139 106,129Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="4" cy="171" rx="7" ry="9" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="116" cy="171" rx="7" ry="9" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {/* obliques */}
      <path d="M31,111 Q25,125 26,140 Q29,150 36,151 Q43,145 44,131 Q45,117 40,109Z" fill={fc('core')} stroke={sc('core')} strokeWidth={sw('core')} onClick={() => pick('core')} style={{cursor:'pointer'}}/>
      <path d="M89,111 Q95,125 94,140 Q91,150 84,151 Q77,145 76,131 Q75,117 80,109Z" fill={fc('core')} stroke={sc('core')} strokeWidth={sw('core')} onClick={() => pick('core')} style={{cursor:'pointer'}}/>
      {/* CORE rectus */}
      <rect x="44" y="111" width="32" height="44" rx="4" fill={fc('core')} stroke={sc('core')} strokeWidth={sw('core')} onClick={() => pick('core')} style={{cursor:'pointer'}}/>
      <line x1="60" y1="111" x2="60" y2="155" stroke={sc('core')} strokeWidth="0.9" opacity="0.7"/>
      <line x1="44" y1="122" x2="76" y2="122" stroke={sc('core')} strokeWidth="0.9" opacity="0.7"/>
      <line x1="44" y1="133" x2="76" y2="133" stroke={sc('core')} strokeWidth="0.9" opacity="0.7"/>
      <line x1="44" y1="144" x2="76" y2="144" stroke={sc('core')} strokeWidth="0.9" opacity="0.7"/>
      {/* lower abs */}
      <path d="M44,153 Q42,163 44,170 Q49,176 60,177 Q71,176 76,170 Q78,163 76,153Z" fill={fc('core')} stroke={sc('core')} strokeWidth={sw('core')} onClick={() => pick('core')} style={{cursor:'pointer'}}/>
      {/* hip */}
      <path d="M30,175 Q23,185 25,194 Q33,200 60,201 Q87,200 95,194 Q97,185 90,175Z" fill="#d4b888" stroke="#c8b080" strokeWidth="0.5"/>
      <circle cx="37" cy="183" r="1.8" fill="#c8b080"/>
      <circle cx="83" cy="183" r="1.8" fill="#c8b080"/>
      {/* QUADS left */}
      <path d="M25,198 Q16,218 16,246 Q18,259 28,262 Q38,259 41,245 Q43,219 37,199Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      <path d="M37,198 Q32,220 32,247 Q34,260 43,262 Q52,259 53,246 Q54,220 49,199Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      <path d="M36,258 Q32,267 34,274 Q38,280 44,279 Q50,274 51,265 Q51,257 44,255Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} opacity="0.9" onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      {/* QUADS right */}
      <path d="M95,198 Q104,218 104,246 Q102,259 92,262 Q82,259 79,245 Q77,219 83,199Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      <path d="M83,198 Q88,220 88,247 Q86,260 77,262 Q68,259 67,246 Q66,220 71,199Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      <path d="M84,258 Q88,267 86,274 Q82,280 76,279 Q70,274 69,265 Q69,257 76,255Z" fill={fc('quads')} stroke={sc('quads')} strokeWidth={sw('quads')} opacity="0.9" onClick={() => pick('quads')} style={{cursor:'pointer'}}/>
      {/* kneecaps */}
      <ellipse cx="40" cy="284" rx="11" ry="8" fill="#c8b080" strokeWidth="0.4" opacity="0.5"/>
      <ellipse cx="40" cy="283" rx="6" ry="5" fill="#c8b080" strokeWidth="0.5" opacity="0.65"/>
      <ellipse cx="80" cy="284" rx="11" ry="8" fill="#c8b080" strokeWidth="0.4" opacity="0.5"/>
      <ellipse cx="80" cy="283" rx="6" ry="5" fill="#c8b080" strokeWidth="0.5" opacity="0.65"/>
      {/* shins */}
      <path d="M33,292 Q31,307 32,330" fill="none" stroke="#d4b888" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
      <path d="M87,292 Q89,307 88,330" fill="none" stroke="#d4b888" strokeWidth="1.6" strokeLinecap="round" opacity="0.6"/>
      {/* CALVES left */}
      <path d="M16,292 Q8,309 10,332 Q13,344 22,346 Q30,343 33,331 Q35,310 30,291Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M30,292 Q37,309 37,330 Q35,342 31,344 Q27,342 26,331Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.78" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M37,296 Q43,313 42,335 Q40,345 36,346 Q41,346 47,342 Q52,335 52,325 Q53,311 49,296Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.6" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      {/* CALVES right */}
      <path d="M104,292 Q112,309 110,332 Q107,344 98,346 Q90,343 87,331 Q85,310 90,291Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M90,292 Q83,309 83,330 Q85,342 89,344 Q93,342 94,331Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.78" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M83,296 Q77,313 78,335 Q80,345 84,346 Q79,346 73,342 Q68,335 68,325 Q67,311 71,296Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.6" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      {/* feet */}
      <rect x="11" y="346" width="20" height="9" rx="3" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <rect x="89" y="346" width="20" height="9" rx="3" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M10,354 Q7,361 9,367 L 32,367 Q34,362 31,354Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M89,354 Q87,361 89,367 L 112,367 Q114,362 110,354Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {!sel && <text x="60" y="383" textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="sans-serif">Tap a muscle</text>}
    </svg>
  );

  const backSVG = () => (
    <svg viewBox="0 0 120 420" width="100" height="350" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      {/* head */}
      <ellipse cx="60" cy="22" rx="15" ry="19" fill="#d4b888" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="60" cy="10" rx="14" ry="9" fill="#5c3820"/>
      <ellipse cx="49" cy="24" rx="2" ry="3" fill="#d4b888" stroke="#c8b080" strokeWidth="0.4"/>
      <ellipse cx="71" cy="24" rx="2" ry="3" fill="#d4b888" stroke="#c8b080" strokeWidth="0.4"/>
      <rect x="53" y="40" width="14" height="13" rx="3" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {/* upper trap */}
      <path d="M56,41 Q42,47 29,59 Q27,68 36,73 Q47,67 55,55 Q60,47 56,41Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      <path d="M64,41 Q78,47 91,59 Q93,68 84,73 Q73,67 65,55 Q60,47 64,41Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      {/* rear delt */}
      <ellipse cx="20" cy="70" rx="10" ry="14" fill={fc('shoulders')} stroke={sc('shoulders')} strokeWidth={sw('shoulders')} onClick={() => pick('shoulders')} style={{cursor:'pointer'}}/>
      <ellipse cx="100" cy="70" rx="10" ry="14" fill={fc('shoulders')} stroke={sc('shoulders')} strokeWidth={sw('shoulders')} onClick={() => pick('shoulders')} style={{cursor:'pointer'}}/>
      {/* mid trap */}
      <path d="M29,72 Q25,85 29,98 Q43,107 60,105 Q77,107 91,98 Q95,85 91,72 Q77,83 60,85 Q43,83 29,72Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      {/* rhomboids */}
      <path d="M43,81 Q41,94 44,104 Q51,111 60,109 Q69,111 76,104 Q79,94 77,81 Q69,90 60,92 Q51,90 43,81Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} opacity="0.85" onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      {/* spine */}
      <line x1="58" y1="79" x2="58" y2="175" stroke="#c8b080" strokeWidth="0.7" strokeDasharray="2,3"/>
      <line x1="62" y1="79" x2="62" y2="175" stroke="#c8b080" strokeWidth="0.7" strokeDasharray="2,3"/>
      {/* LAT left */}
      <path d="M13,80 Q3,101 4,129 Q7,146 19,152 Q32,148 36,130 Q40,107 34,82 Q25,90 16,84Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      <path d="M6,93 Q9,116 12,142" fill="none" stroke={sc('back')} strokeWidth="1" opacity="0.7"/>
      <path d="M9,89 Q12,111 15,137" fill="none" stroke={sc('back')} strokeWidth="0.8" opacity="0.6"/>
      {/* LAT right */}
      <path d="M107,80 Q117,101 116,129 Q113,146 101,152 Q88,148 84,130 Q80,107 86,82 Q95,90 104,84Z" fill={fc('back')} stroke={sc('back')} strokeWidth={sw('back')} onClick={() => pick('back')} style={{cursor:'pointer'}}/>
      <path d="M114,93 Q111,116 108,142" fill="none" stroke={sc('back')} strokeWidth="1" opacity="0.7"/>
      {/* TRICEPS left */}
      <path d="M3,82 Q-3,97 -2,114 Q0,124 8,126 Q15,123 18,112 Q20,96 14,81Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      <path d="M14,80 Q20,93 20,110 Q18,120 14,122 Q10,119 9,110 Q8,95 11,79Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} opacity="0.8" onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      <path d="M-2,113 Q-3,123 0,129 Q5,133 11,131 Q17,128 19,120Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} opacity="0.65" onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      {/* TRICEPS right */}
      <path d="M117,82 Q123,97 122,114 Q120,124 112,126 Q105,123 102,112 Q100,96 106,81Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      <path d="M106,80 Q100,93 100,110 Q102,120 106,122 Q110,119 111,110 Q112,95 109,79Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} opacity="0.8" onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      <path d="M122,113 Q123,123 120,129 Q115,133 109,131 Q103,128 101,120Z" fill={fc('triceps')} stroke={sc('triceps')} strokeWidth={sw('triceps')} opacity="0.65" onClick={() => pick('triceps')} style={{cursor:'pointer'}}/>
      {/* forearms */}
      <path d="M-3,134 Q-8,147 -6,161 Q-2,169 5,169 Q12,166 14,155 Q15,143 12,133Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M123,134 Q128,147 126,161 Q122,169 115,169 Q108,166 106,155 Q105,143 108,133Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="2" cy="175" rx="7" ry="9" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="118" cy="175" rx="7" ry="9" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {/* lower back */}
      <path d="M37,150 Q34,163 36,177 L 84,177 Q86,163 83,150Z" fill="#d4b888" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M55,150 Q54,164 55,175" fill="none" stroke="#c8b080" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M65,150 Q66,164 65,175" fill="none" stroke="#c8b080" strokeWidth="1.2" strokeLinecap="round"/>
      {/* GLUTE MED */}
      <path d="M11,177 Q3,190 5,204 Q10,215 23,216 Q33,214 36,203 Q37,190 30,177Z" fill={fc('glutes')} stroke={sc('glutes')} strokeWidth={sw('glutes')} opacity="0.86" onClick={() => pick('glutes')} style={{cursor:'pointer'}}/>
      <path d="M109,177 Q117,190 115,204 Q110,215 97,216 Q87,214 84,203 Q83,190 90,177Z" fill={fc('glutes')} stroke={sc('glutes')} strokeWidth={sw('glutes')} opacity="0.86" onClick={() => pick('glutes')} style={{cursor:'pointer'}}/>
      {/* GLUTE MAX */}
      <path d="M6,203 Q-1,221 0,245 Q4,260 16,264 Q29,260 33,244 Q36,221 30,204 Q21,215 12,211Z" fill={fc('glutes')} stroke={sc('glutes')} strokeWidth={sw('glutes')} onClick={() => pick('glutes')} style={{cursor:'pointer'}}/>
      <path d="M114,203 Q121,221 120,245 Q116,260 104,264 Q91,260 87,244 Q84,221 90,204 Q99,215 108,211Z" fill={fc('glutes')} stroke={sc('glutes')} strokeWidth={sw('glutes')} onClick={() => pick('glutes')} style={{cursor:'pointer'}}/>
      <path d="M0,255 Q18,266 60,266 Q102,266 120,255" fill="none" stroke={sc('glutes')} strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
      {/* HAMSTRINGS left */}
      <path d="M1,266 Q-5,284 -4,308 Q-1,320 8,323 Q17,320 20,307 Q22,284 17,266Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      <path d="M17,266 Q24,284 24,308 Q22,320 17,322 Q12,319 11,308 Q9,285 12,266Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} opacity="0.82" onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      <path d="M24,266 Q31,284 30,308 Q28,320 24,322 Q20,319 19,308Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} opacity="0.66" onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      {/* HAMSTRINGS right */}
      <path d="M119,266 Q125,284 124,308 Q121,320 112,323 Q103,320 100,307 Q98,284 103,266Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      <path d="M103,266 Q96,284 96,308 Q98,320 103,322 Q108,319 109,308 Q111,285 108,266Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} opacity="0.82" onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      <path d="M96,266 Q89,284 90,308 Q92,320 96,322 Q100,319 101,308Z" fill={fc('hamstrings')} stroke={sc('hamstrings')} strokeWidth={sw('hamstrings')} opacity="0.66" onClick={() => pick('hamstrings')} style={{cursor:'pointer'}}/>
      {/* knees */}
      <ellipse cx="13" cy="330" rx="13" ry="9" fill="#d4b888" stroke="#c8b080" strokeWidth="0.5"/>
      <ellipse cx="107" cy="330" rx="13" ry="9" fill="#d4b888" stroke="#c8b080" strokeWidth="0.5"/>
      {/* CALVES back left */}
      <path d="M0,338 Q-6,354 -4,374 Q-1,385 8,387 Q17,384 20,373 Q21,354 16,337Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M16,338 Q22,354 22,373 Q20,384 16,386 Q12,384 11,373Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.78" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M22,342 Q27,358 26,378 Q24,388 20,389 Q25,389 31,385 Q36,378 36,368 Q37,354 33,342Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.62" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M-4,385 Q-5,393 1,397 Q8,401 15,401 Q22,401 29,397 Q35,391 33,385" fill="none" stroke="#c8b080" strokeWidth="2.1" strokeLinecap="round" opacity="0.65"/>
      {/* CALVES back right */}
      <path d="M120,338 Q126,354 124,374 Q121,385 112,387 Q103,384 100,373 Q99,354 104,337Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M104,338 Q98,354 98,373 Q100,384 104,386 Q108,384 109,373Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.78" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M98,342 Q93,358 94,378 Q96,388 100,389 Q95,389 89,385 Q84,378 84,368 Q83,354 87,342Z" fill={fc('calves')} stroke={sc('calves')} strokeWidth={sw('calves')} opacity="0.62" onClick={() => pick('calves')} style={{cursor:'pointer'}}/>
      <path d="M116,385 Q117,393 111,397 Q104,401 97,401 Q90,401 83,397 Q77,391 79,385" fill="none" stroke="#c8b080" strokeWidth="2.1" strokeLinecap="round" opacity="0.65"/>
      {/* feet */}
      <path d="M-5,389 Q-8,396 -6,403 L 22,403 Q24,397 21,389Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      <path d="M99,389 Q97,396 99,403 L 127,403 Q129,397 125,389Z" fill="#e8d4bc" stroke="#c8b080" strokeWidth="0.5"/>
      {!sel && <text x="60" y="413" textAnchor="middle" fontSize="9" fill="#aaa" fontFamily="sans-serif">Tap a muscle</text>}
    </svg>
  );

  if (sel) {
    const m = D[sel];
    const tabs = [['anatomy','Anatomy'],['training','Biomechanics'],['errors','Common errors']];
    let body;
    if (tab === 'anatomy') {
      body = (
        <div>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:'#aaa', marginBottom:7 }}>Overview</div>
          <p style={{ fontSize:12, lineHeight:1.8, color:'#555', marginBottom:12 }}>{m.overview}</p>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:'#aaa', marginBottom:7 }}>Regions</div>
          {m.regions.map((r,i) => (
            <div key={i} style={{ border:'1px solid #eee', borderRadius:8, marginBottom:6, overflow:'hidden' }}>
              <div onClick={() => setExpR(expR===i?null:i)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 12px', background: expR===i ? m.l : '#f9f9f7', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:500, color: expR===i ? m.c : '#1a1a1a' }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:r.dot||m.c, display:'inline-block', flexShrink:0 }}/>
                  {r.name}
                </div>
                <span style={{ color:'#ccc', fontSize:11 }}>{expR===i?'▲':'▼'}</span>
              </div>
              {expR===i && (
                <div style={{ padding:'9px 12px 11px', borderTop:`1px solid ${m.c}22`, fontSize:12, lineHeight:1.8, color:'#555' }}>
                  <p style={{ marginBottom:8 }}>{r.act}</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {r.exs.map((e,ei) => <span key={ei} style={{ fontSize:10, padding:'2px 8px', borderRadius:20, border:`1px solid ${m.c}44`, background:m.l, color:m.c }}>{e}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else if (tab === 'training') {
      body = (
        <div>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:'#aaa', marginBottom:7 }}>Biomechanics</div>
          <div style={{ background:'#f9f9f7', borderRadius:8, padding:'11px 13px', fontSize:12, lineHeight:1.8, color:'#555', marginBottom:12 }}>{m.biomech}</div>
          <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.12em', color:'#aaa', marginBottom:7 }}>Volume</div>
          <div style={{ borderLeft:`2px solid ${m.c}`, padding:'9px 12px', background:m.l+'44', borderRadius:'0 8px 8px 0', fontSize:12, lineHeight:1.75, color:'#555' }}>{m.vol}</div>
        </div>
      );
    } else {
      body = (
        <div>
          {m.errors.map((e,i) => (
            <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start', padding:'8px 0', borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ width:19, height:19, borderRadius:'50%', background:m.l, color:m.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:600, flexShrink:0, border:`1px solid ${m.c}33`, marginTop:1 }}>{i+1}</div>
              <div style={{ fontSize:12, lineHeight:1.65, color:'#555', paddingTop:2 }}>{e}</div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ paddingBottom:60 }}>
        <div style={{ padding:'13px 15px 0' }}>
          <button onClick={goBack} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', fontSize:12, color:'#888', cursor:'pointer', ...F, marginBottom:10, padding:0 }}>← All muscles</button>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ fontSize:19, fontWeight:500, color:m.c, marginBottom:2, ...F }}>{m.label}</div>
              <div style={{ fontSize:11, color:'#aaa', fontStyle:'italic', marginBottom:5 }}>{m.clinical}</div>
              <span style={{ fontSize:10, padding:'2px 9px', borderRadius:20, background:m.l, color:m.c, border:`1px solid ${m.c}33` }}>{m.cat}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', borderBottom:'1px solid #f0f0f0', marginTop:12 }}>
          {tabs.map(([t,l]) => (
            <button key={t} onClick={() => { setTab(t); setExpR(null); }} style={{ flex:1, padding:'9px 4px', fontSize:11, border:'none', background:'none', borderBottom: tab===t ? `2px solid ${m.c}` : '2px solid transparent', color: tab===t ? m.c : '#aaa', cursor:'pointer', ...F, fontWeight: tab===t ? 600 : 400 }}>{l}</button>
          ))}
        </div>
        <div style={{ padding:'13px 15px' }}>{body}</div>
      </div>
    );
  }

  return (
    <div style={{ padding:'13px 14px 60px' }}>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'.18em', color:'#999', marginBottom:3 }}>Anatomy & Training</div>
        <div style={{ fontSize:19, fontWeight:'normal', ...F }}>Muscle Science</div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {[['front','Anterior — front'],['back','Posterior — back']].map(([v,l]) => (
          <button key={v} onClick={() => { setView(v); setSel(null); }} style={{ flex:1, padding:'7px', borderRadius:20, border:'1px solid', borderColor: view===v ? '#111' : '#e0e0e0', background: view===v ? '#111' : '#fff', color: view===v ? '#fff' : '#666', fontSize:11, cursor:'pointer', ...F }}>{l}</button>
        ))}
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ background:'#f7f4f0', borderRadius:10, padding:'8px 4px', flexShrink:0, textAlign:'center' }}>
          <MuscleMap
            view={view}
            sel={sel}
            onPick={pick}
            colorFor={(id) => D[id]?.c || '#2563a8'}
            size={150}
          />
          <div style={{ fontSize:10, color:'#aaa', marginTop:4 }}>Tap a muscle group</div>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
          {list.map(id => {
            const m = D[id];
            return (
              <button key={id} onClick={() => pick(id)} style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 8px', borderRadius:7, border:'1px solid transparent', background:'transparent', cursor:'pointer', textAlign:'left', width:'100%', fontFamily:'inherit' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:m.c, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a1a1a' }}>{m.label}</div>
                  <div style={{ fontSize:10, color:'#aaa' }}>{m.regions.length} regions</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:10, padding:'20px 14px', textAlign:'center' }}>
        <div style={{ fontSize:12, color:'#aaa', lineHeight:1.6 }}>Select a muscle group above to explore anatomy, biomechanics, and training science.</div>
      </div>
    </div>
  );
}
