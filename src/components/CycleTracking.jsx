import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const PHASES = {
  menstrual: {
    name: "Menstrual", shortName: "Men.", days: "Days 1–5",
    color: "#a02020", bg: "#fff5f5", dot: "#a02020",
    summary: "Estrogen and progesterone are at their lowest. Your uterine lining sheds. Prostaglandins trigger muscle contractions that cause cramping, and iron drops as you lose blood. Energy is typically at its lowest point of the cycle.",
    training: {
      headline: "Honor the fatigue — lighter is smart, not weak",
      points: [
        "If you feel okay, light lifting with reduced load is fine and can actually help with cramp pain through endorphin release.",
        "High-intensity cardio and heavy compound lifts are harder because your body is redirecting resources. Don't force it.",
        "Walking, yoga, and stretching are ideal on days 1 and 2 when symptoms are worst.",
        "Perceived exertion will feel higher than normal for the same output. That's hormonal, not a fitness setback.",
      ],
    },
    nutrition: {
      headline: "Replenish what you're losing",
      points: [
        "Iron: red meat, dark leafy greens, lentils, pumpkin seeds. Low iron directly causes fatigue.",
        "Magnesium helps reduce cramping — dark chocolate, almonds, avocado, and black beans.",
        "Omega-3s reduce prostaglandin-driven inflammation. Salmon, walnuts, and flaxseed.",
        "Hydration matters more than usual because fluid loss is higher.",
      ],
    },
    recovery: "Sleep may be disrupted by cramping or discomfort. This is a valid week to reduce training volume and prioritize rest.",
    symptomOptions: ["Cramping", "Lower back pain", "Fatigue", "Headache", "Bloating", "Mood low", "Sleep disrupted", "Nausea"],
  },
  follicular: {
    name: "Follicular", shortName: "Fol.", days: "Days 6–13",
    color: "#1d6fa8", bg: "#f0f6fc", dot: "#1d6fa8",
    summary: "Estrogen rises steadily as your body prepares to release an egg. Neuromuscular coordination peaks, recovery is fastest, and strength gains are most accessible. Most women feel their best physically and mentally during this window.",
    training: {
      headline: "This is your strongest window — use it",
      points: [
        "Estrogen enhances muscle protein synthesis and speeds recovery between sessions. You can handle more volume.",
        "Neuromuscular coordination is at its best — complex movement patterns, new PRs, and technical work all benefit.",
        "High-intensity cardio is well-tolerated. Your body manages lactic acid more efficiently in this phase.",
        "If you're going to push for a PR or increase load significantly, do it now.",
      ],
    },
    nutrition: {
      headline: "Fuel the output",
      points: [
        "Protein remains the priority. Estrogen amplifies muscle protein synthesis — take advantage of it.",
        "Carbohydrate tolerance is better in this phase. Complex carbs around training support performance.",
        "Appetite is often naturally lower in follicular — you don't need to force extra calories.",
        "Hydration and electrolytes support the increased training capacity.",
      ],
    },
    recovery: "Recovery is measurably faster in this phase due to estrogen's anti-inflammatory effects. You can train on consecutive days with less soreness than during luteal.",
    symptomOptions: ["High energy", "Clear focus", "Strong in training", "Good mood", "Low bloating", "Motivated"],
  },
  ovulation: {
    name: "Ovulation", shortName: "Ov.", days: "Days 14–16",
    color: "#147a50", bg: "#f0f9f5", dot: "#147a50",
    summary: "Estrogen peaks, triggering the LH surge that causes the egg to release. Testosterone also rises briefly. Energy, confidence, and physical performance all peak simultaneously during this 2 to 3 day window.",
    training: {
      headline: "Peak performance — your best days of the month",
      points: [
        "This is the optimal window for testing maxes, competitions, and your hardest sessions of the month.",
        "Power output and reaction time are both at their highest — any athletic or explosive work benefits.",
        "One caution: ligament laxity increases around ovulation due to estrogen's effects on connective tissue. Warm up thoroughly and focus on joint stability cues.",
        "Coordination and mood are at their best — use this time for movements that require technique and focus.",
      ],
    },
    nutrition: {
      headline: "Support peak output",
      points: [
        "Zinc supports healthy ovulation — pumpkin seeds, shellfish, and legumes.",
        "Antioxidants from berries, leafy greens, and colorful vegetables support follicular health.",
        "Fiber helps the liver metabolize peak estrogen efficiently. Vegetables, legumes, and whole grains.",
        "Appetite is often at its lowest around ovulation. Eating lighter feels natural and is fine.",
      ],
    },
    recovery: "Recovery is excellent. Some women experience brief mid-cycle cramping on one side as the egg releases — this is normal and typically resolves within hours.",
    symptomOptions: ["Peak energy", "Confident", "Strong", "Mid-cycle cramp", "Slight bloating"],
  },
  luteal: {
    name: "Luteal", shortName: "Lut.", days: "Days 17–28",
    color: "#7a3aa0", bg: "#f9f5fc", dot: "#7a3aa0",
    summary: "Progesterone rises significantly and estrogen dips, then both drop sharply at the end. The first half of luteal (days 17–21) still allows solid training. The second half (days 22–28) is when PMS symptoms typically appear and performance can drop. This phase is the most variable — some women feel barely affected, others significantly so.",
    training: {
      headline: "Manage fatigue, not fight it",
      points: [
        "Days 17–21 are still productive for training. Strength may be slightly reduced but volume and technique work hold up well.",
        "Days 22–28: reduce intensity if PMS symptoms hit. Switching to moderate-weight volume work is a smart adjustment, not a step backward.",
        "Core body temperature rises 0.3 to 0.5°C in luteal, making cardio feel harder at the same effort level. Expect more perceived effort at Zone 3 targets.",
        "Sleep quality often decreases in the second half due to progesterone. Prioritize sleep over extra training sessions.",
        "Strength may feel noticeably reduced compared to follicular. This is real — hormonal changes affect neuromuscular efficiency. Work within it.",
      ],
    },
    nutrition: {
      headline: "Manage cravings with intention",
      points: [
        "Caloric needs genuinely increase in luteal — roughly 100 to 300 additional calories due to elevated BMR. This is physiological, not a lack of willpower.",
        "Complex carbohydrates reduce PMS-related mood fluctuations by supporting serotonin production. Sweet potato, oats, and brown rice.",
        "Magnesium and B6 reduce PMS symptoms. Bananas, potatoes, chicken, and dark chocolate.",
        "Reduce sodium and caffeine in the second half to minimize water retention and bloating.",
        "Craving sweets before your period is a well-documented hormonal response. Managing it with complex carbs is more effective than restriction.",
      ],
    },
    recovery: "Recovery is slower in luteal due to progesterone's effects on inflammation response. Building extra rest days into weeks 3 and 4 of your cycle is good programming.",
    symptomOptions: ["Fatigue", "Bloating", "Cravings", "Mood changes", "Breast tenderness", "Irritability", "Sleep issues", "Reduced motivation", "Water retention", "Headache"],
  },
};

function loadCycleData() { try { return JSON.parse(localStorage.getItem("cycle_data_v2") || "null"); } catch { return null; } }
function saveCycleData(d) { try { localStorage.setItem("cycle_data_v2", JSON.stringify(d)); } catch {} }
function loadSymptomLog() { try { return JSON.parse(localStorage.getItem("cycle_symptoms_v1") || "{}"); } catch { return {}; } }
function saveSymptomLog(d) { try { localStorage.setItem("cycle_symptoms_v1", JSON.stringify(d)); } catch {} }

function getPhaseInfo(lastStart, cycleLength = 28) {
  if (!lastStart) return null;
  const start = new Date(lastStart + "T12:00:00");
  const today = new Date();
  const dayOfCycle = Math.floor((today - start) / 86400000) + 1;
  const day = ((dayOfCycle - 1) % cycleLength) + 1;
  const daysUntil = cycleLength - day + 1;
  let phase;
  if (day <= 5) phase = "menstrual";
  else if (day <= 13) phase = "follicular";
  else if (day <= 16) phase = "ovulation";
  else phase = "luteal";
  return { phase, day, cycleLength, daysUntil };
}

function getPhaseForDay(day, cycleLength) {
  if (day < 1 || day > cycleLength) return null;
  if (day <= 5) return "menstrual";
  if (day <= 13) return "follicular";
  if (day <= 16) return "ovulation";
  return "luteal";
}

function CycleCalendar({ lastStart, cycleLength, symptoms, onDayClick }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const start = lastStart ? new Date(lastStart + "T12:00:00") : null;
  const monthLabel = new Date(calYear, calMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function getPhaseForDate(d) {
    if (!start) return null;
    const date = new Date(calYear, calMonth, d);
    const dayOfCycle = Math.floor((date - start) / 86400000) + 1;
    const day = ((dayOfCycle - 1) % cycleLength) + 1;
    return getPhaseForDay(day, cycleLength);
  }

  function dateKey(d) {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  function isToday(d) {
    return d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#aaa", padding: "2px 8px" }}>‹</button>
        <span style={{ fontSize: "13px", fontWeight: "600", ...F }}>{monthLabel}</span>
        <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
          style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#aaa", padding: "2px 8px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "3px" }}>
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} style={{ textAlign: "center", fontSize: "9px", fontWeight: "700", color: "#ccc", padding: "3px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const phase = getPhaseForDate(d);
          const phaseColor = phase ? PHASES[phase].dot : null;
          const hasSym = (symptoms[dateKey(d)] || []).length > 0;
          const todayStyle = isToday(d);
          return (
            <button key={d} onClick={() => onDayClick(dateKey(d))} style={{
              aspectRatio: "1", background: todayStyle ? "#1a1a1a" : phaseColor ? phaseColor + "20" : "transparent",
              border: "1px solid " + (todayStyle ? "#1a1a1a" : phaseColor ? phaseColor + "40" : "#f0f0f0"),
              borderRadius: "5px", cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "11px", fontWeight: todayStyle ? "700" : "400", color: todayStyle ? "#fff" : phaseColor || "#666" }}>{d}</span>
              {hasSym && <div style={{ position: "absolute", bottom: "2px", right: "3px", width: "4px", height: "4px", borderRadius: "50%", background: phaseColor || "#aaa" }} />}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
        {Object.entries(PHASES).map(([key, p]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: "#888" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: p.dot }} />{p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CycleTracking() {
  const [data, setData] = useState(() => loadCycleData() || { lastPeriodStart: "", cycleLength: 28 });
  const [symptoms, setSymptoms] = useState(loadSymptomLog);
  const [section, setSection] = useState("overview");
  const [selectedDay, setSelectedDay] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { saveCycleData(data); }, [data]);
  useEffect(() => { saveSymptomLog(symptoms); }, [symptoms]);

  const phaseInfo = getPhaseInfo(data.lastPeriodStart, data.cycleLength);
  const phase = phaseInfo ? PHASES[phaseInfo.phase] : null;
  const today = new Date().toISOString().slice(0, 10);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function toggleSymptom(date, symptom) {
    const existing = symptoms[date] || [];
    const updated = existing.includes(symptom) ? existing.filter(s => s !== symptom) : [...existing, symptom];
    setSymptoms(p => ({ ...p, [date]: updated }));
  }

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {!data.lastPeriodStart && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
          <div style={{ fontSize: "14px", ...F, marginBottom: "4px" }}>Set up cycle tracking</div>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "14px", lineHeight: "1.5" }}>Enter the first day of your last period to get started. The app will calculate your current phase and predict upcoming dates.</div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#777", marginBottom: "4px" }}>First day of last period</div>
              <input type="date" value={data.lastPeriodStart} onChange={e => setData(p => ({ ...p, lastPeriodStart: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: "#777", marginBottom: "4px" }}>Avg cycle length</div>
              <input type="number" min="21" max="40" value={data.cycleLength} onChange={e => setData(p => ({ ...p, cycleLength: parseInt(e.target.value) || 28 }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={handleSave} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 18px", fontSize: "12px", cursor: "pointer", ...F }}>
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      )}

      {phase && phaseInfo && (
        <div style={{ background: phase.bg, border: `1px solid ${phase.color}33`, borderRadius: "10px", padding: "14px 16px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: phase.color, marginBottom: "2px" }}>You are in</div>
              <div style={{ fontSize: "20px", ...F }}>{phase.name}</div>
              <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>Day {phaseInfo.day} of {phaseInfo.cycleLength} · {phase.days}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.1em" }}>Next period</div>
              <div style={{ fontSize: "20px", color: "#a02020", ...F }}>{phaseInfo.daysUntil}d</div>
            </div>
          </div>
          <div style={{ display: "flex", height: "5px", borderRadius: "20px", overflow: "hidden", marginBottom: "10px" }}>
            {[["menstrual", 5], ["follicular", 8], ["ovulation", 3], ["luteal", 12]].map(([key, len]) => (
              <div key={key} style={{ flex: len, background: PHASES[key].dot, opacity: phaseInfo.phase === key ? 1 : 0.25 }} />
            ))}
          </div>
          <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.65", ...F }}>{phase.summary}</div>
          <div style={{ marginTop: "8px", fontSize: "11px", fontWeight: "600", color: phase.color }}>{phase.training.headline}</div>
        </div>
      )}

      {phase && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px", overflowX: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {[["overview","Overview"],["calendar","Calendar"],["training","Training"],["nutrition","Nutrition"],["log","Log"],["settings","Settings"]].map(([s, label]) => (
            <button key={s} onClick={() => setSection(s)} style={{
              flexShrink: 0, padding: "6px 12px", fontSize: "11px", cursor: "pointer", ...F,
              border: "1px solid " + (section === s ? "#1a1a1a" : "#ddd"),
              background: section === s ? "#1a1a1a" : "#fff",
              color: section === s ? "#f7f6f3" : "#666", borderRadius: "20px",
            }}>{label}</button>
          ))}
        </div>
      )}

      {section === "overview" && phase && (
        <div>
          {Object.entries(PHASES).map(([key, p]) => (
            <div key={key} style={{ background: phaseInfo?.phase === key ? p.bg : "#fff", border: `1px solid ${phaseInfo?.phase === key ? p.color + "44" : "#e8e8e8"}`, borderRadius: "7px", padding: "12px 14px", marginBottom: "7px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: p.color }}>{p.name}</span>
                  <span style={{ fontSize: "10px", color: "#bbb" }}>{p.days}</span>
                </div>
                {phaseInfo?.phase === key && <span style={{ fontSize: "9px", background: p.dot, color: "#fff", borderRadius: "20px", padding: "2px 8px" }}>Now</span>}
              </div>
              <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.5" }}>{p.training.headline}</div>
            </div>
          ))}
        </div>
      )}

      {section === "calendar" && (
        <CycleCalendar lastStart={data.lastPeriodStart} cycleLength={data.cycleLength} symptoms={symptoms}
          onDayClick={date => { setSelectedDay(date); setSection("log"); }} />
      )}

      {section === "training" && phase && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "12px", ...F }}>{phase.training.headline}</div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            {phase.training.points.map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < phase.training.points.length - 1 ? "12px" : 0, paddingBottom: i < phase.training.points.length - 1 ? "12px" : 0, borderBottom: i < phase.training.points.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: phase.color, flexShrink: 0, marginTop: "5px" }} />
                <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.65" }}>{pt}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Recovery</div>
            <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.65" }}>{phase.recovery}</div>
          </div>
        </div>
      )}

      {section === "nutrition" && phase && (
        <div>
          <div style={{ fontSize: "13px", fontWeight: "600", color: "#1a1a1a", marginBottom: "12px", ...F }}>{phase.nutrition.headline}</div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px" }}>
            {phase.nutrition.points.map((pt, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: i < phase.nutrition.points.length - 1 ? "12px" : 0, paddingBottom: i < phase.nutrition.points.length - 1 ? "12px" : 0, borderBottom: i < phase.nutrition.points.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: phase.color, flexShrink: 0, marginTop: "5px" }} />
                <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.65" }}>{pt}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "log" && (
        <div>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
            {selectedDay || today}
            {selectedDay && selectedDay !== today && (
              <button onClick={() => setSelectedDay(null)} style={{ background: "none", border: "none", color: "#bbb", fontSize: "11px", cursor: "pointer", marginLeft: "10px" }}>← Today</button>
            )}
          </div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>How are you feeling?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(phase ? phase.symptomOptions : ["Fatigue", "Bloating", "Cramps", "Mood changes", "High energy", "Headache"]).map(s => {
                const logDate = selectedDay || today;
                const active = (symptoms[logDate] || []).includes(s);
                return (
                  <button key={s} onClick={() => toggleSymptom(logDate, s)} style={{
                    padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", ...F,
                    background: active ? (phase?.color || "#1a1a1a") : "#f5f5f3",
                    color: active ? "#fff" : "#555",
                    border: "1px solid " + (active ? (phase?.color || "#1a1a1a") : "#e0e0e0"),
                  }}>{s}</button>
                );
              })}
            </div>
          </div>
          {phaseInfo && phaseInfo.day <= 7 && (
            <div style={{ background: "#fff5f5", border: "1px solid #fcc", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", color: "#a02020", marginBottom: "6px" }}>Update period start if needed</div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="date" value={data.lastPeriodStart} onChange={e => setData(p => ({ ...p, lastPeriodStart: e.target.value }))}
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #fcc", borderRadius: "5px", fontSize: "12px" }} />
                <button onClick={handleSave} style={{ background: "#a02020", color: "#fff", border: "none", borderRadius: "5px", padding: "7px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
                  {saved ? "Saved" : "Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {section === "settings" && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>Cycle settings</div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>First day of last period</div>
              <input type="date" value={data.lastPeriodStart} onChange={e => setData(p => ({ ...p, lastPeriodStart: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "5px", fontSize: "12px", boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>Average cycle length: {data.cycleLength} days</div>
              <input type="range" min="21" max="40" value={data.cycleLength} onChange={e => setData(p => ({ ...p, cycleLength: parseInt(e.target.value) }))}
                style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#bbb" }}>
                <span>21 days</span><span>40 days</span>
              </div>
            </div>
            <button onClick={handleSave} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "5px", padding: "8px 18px", fontSize: "12px", cursor: "pointer", ...F }}>
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "12px 14px", fontSize: "11px", color: "#777", lineHeight: "1.65" }}>
            Cycle lengths vary naturally between 21 and 40 days. If your cycle is irregular — varying by more than 7 days from month to month — tracking start dates manually will give you more accurate phase predictions than a fixed average.
          </div>
        </div>
      )}
    </div>
  );
}
