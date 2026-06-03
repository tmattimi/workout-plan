import { useState, useEffect } from "react";
import { InlineEmpty } from "./ui";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// ── Storage ───────────────────────────────────────────────────────────────────
function loadNutrition() {
  try { return JSON.parse(localStorage.getItem("nutrition_v1") || "{}"); } catch { return {}; }
}
function saveNutrition(d) {
  try { localStorage.setItem("nutrition_v1", JSON.stringify(d)); } catch {} }

function loadTargets() {
  try { return JSON.parse(localStorage.getItem("nutrition_targets_v1") || "null"); } catch { return null; }
}
function saveTargets(d) {
  try { localStorage.setItem("nutrition_targets_v1", JSON.stringify(d)); } catch {} }

function today() { return new Date().toISOString().slice(0, 10); }

// ── Common foods for quick-add ────────────────────────────────────────────────
const QUICK_FOODS = [
  { name: "Chicken breast (4 oz)", protein: 26, carbs: 0, fat: 3, calories: 130 },
  { name: "Ground beef 90% lean (4 oz)", protein: 22, carbs: 0, fat: 10, calories: 180 },
  { name: "Salmon (4 oz)", protein: 23, carbs: 0, fat: 9, calories: 175 },
  { name: "Eggs (2 large)", protein: 12, carbs: 1, fat: 10, calories: 140 },
  { name: "Greek yogurt (1 cup)", protein: 20, carbs: 9, fat: 0, calories: 120 },
  { name: "Cottage cheese (½ cup)", protein: 14, carbs: 4, fat: 1, calories: 80 },
  { name: "Protein shake (1 scoop)", protein: 25, carbs: 3, fat: 2, calories: 130 },
  { name: "Oatmeal (½ cup dry)", protein: 5, carbs: 27, fat: 3, calories: 150 },
  { name: "Brown rice (½ cup cooked)", protein: 2, carbs: 22, fat: 1, calories: 110 },
  { name: "Sweet potato (medium)", protein: 2, carbs: 26, fat: 0, calories: 112 },
  { name: "White rice (½ cup cooked)", protein: 2, carbs: 23, fat: 0, calories: 100 },
  { name: "Banana", protein: 1, carbs: 27, fat: 0, calories: 105 },
  { name: "Apple", protein: 0, carbs: 25, fat: 0, calories: 95 },
  { name: "Blueberries (1 cup)", protein: 1, carbs: 21, fat: 0, calories: 84 },
  { name: "Avocado (½)", protein: 1, carbs: 6, fat: 11, calories: 120 },
  { name: "Almonds (1 oz)", protein: 6, carbs: 6, fat: 14, calories: 164 },
  { name: "Peanut butter (2 tbsp)", protein: 7, carbs: 6, fat: 16, calories: 190 },
  { name: "Olive oil (1 tbsp)", protein: 0, carbs: 0, fat: 14, calories: 120 },
  { name: "Whole milk (1 cup)", protein: 8, carbs: 12, fat: 8, calories: 150 },
  { name: "Cheddar cheese (1 oz)", protein: 7, carbs: 0, fat: 9, calories: 113 },
  { name: "Broccoli (1 cup)", protein: 3, carbs: 6, fat: 0, calories: 31 },
  { name: "Spinach (2 cups)", protein: 2, carbs: 2, fat: 0, calories: 14 },
  { name: "Bread (1 slice)", protein: 3, carbs: 13, fat: 1, calories: 79 },
  { name: "Pasta (2 oz dry)", protein: 7, carbs: 42, fat: 1, calories: 200 },
  { name: "Lentils (½ cup cooked)", protein: 9, carbs: 20, fat: 0, calories: 115 },
  { name: "Black beans (½ cup)", protein: 7, carbs: 20, fat: 0, calories: 114 },
];

// ── Macro bar ─────────────────────────────────────────────────────────────────
function MacroBar({ label, value, target, color }) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target && value > target;
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
        <span style={{ color: "#666" }}>{label}</span>
        <span style={{ color: over ? "#a02020" : "#333", fontWeight: "600" }}>
          {value}g{target ? ` / ${target}g` : ""}
          {over && <span style={{ fontSize: "9px", color: "#a02020", marginLeft: "4px" }}>over</span>}
        </span>
      </div>
      <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "5px" }}>
        <div style={{ background: over ? "#a02020" : color, borderRadius: "20px", height: "5px", width: `${pct}%`, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

// ── Calorie ring (simple) ─────────────────────────────────────────────────────
function CalRing({ consumed, target }) {
  const pct = target ? Math.min(1, consumed / target) : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const over = consumed > target;
  const color = over ? "#a02020" : consumed / target >= 0.9 ? "#2d7a1e" : "#1a1a1a";
  return (
    <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#f0f0f0" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "16px", fontWeight: "700", color, lineHeight: 1 }}>{consumed}</div>
        <div style={{ fontSize: "9px", color: "#aaa" }}>kcal</div>
      </div>
    </div>
  );
}

// ── Add food modal ─────────────────────────────────────────────────────────────
function AddFoodModal({ onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("search"); // search | manual
  const [manual, setManual] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const matches = search.length > 1
    ? QUICK_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : QUICK_FOODS.slice(0, 6);

  function submitManual() {
    if (!manual.name || !manual.calories) return;
    onAdd({
      name: manual.name,
      calories: parseInt(manual.calories) || 0,
      protein: parseInt(manual.protein) || 0,
      carbs: parseInt(manual.carbs) || 0,
      fat: parseInt(manual.fat) || 0,
      id: Date.now(),
    });
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: "20px 16px 40px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ fontSize: "14px", fontWeight: "600" }}>Add food</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#bbb" }}>×</button>
        </div>

        <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
          {[["search", "Quick add"], ["manual", "Enter manually"]].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "7px", border: "1px solid " + (mode === m ? "#1a1a1a" : "#e0e0e0"),
              borderRadius: "6px", background: mode === m ? "#1a1a1a" : "#fff",
              color: mode === m ? "#f7f6f3" : "#666", cursor: "pointer", fontSize: "12px", ...F,
            }}>{label}</button>
          ))}
        </div>

        {mode === "search" && (
          <>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search foods..."
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box", marginBottom: "8px", ...F }} />
            <div>
              {matches.map(food => (
                <button key={food.name} onClick={() => onAdd({ ...food, id: Date.now() })}
                  style={{ width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid #f5f5f5", background: "#fff", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "13px", color: "#1a1a1a", ...F }}>{food.name}</div>
                    <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                      P: {food.protein}g · C: {food.carbs}g · F: {food.fat}g
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "#555" }}>{food.calories} kcal</div>
                </button>
              ))}
              {search.length > 1 && matches.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "#bbb", fontSize: "12px" }}>
                  Not found — switch to "Enter manually"
                </div>
              )}
            </div>
          </>
        )}

        {mode === "manual" && (
          <div>
            <input value={manual.name} onChange={e => setManual(p => ({ ...p, name: e.target.value }))}
              placeholder="Food name"
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "7px", fontSize: "13px", boxSizing: "border-box", marginBottom: "8px", ...F }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
              {[["calories", "Calories (kcal)"], ["protein", "Protein (g)"], ["carbs", "Carbs (g)"], ["fat", "Fat (g)"]].map(([key, label]) => (
                <div key={key}>
                  <div style={{ fontSize: "10px", color: "#888", marginBottom: "3px" }}>{label}</div>
                  <input type="number" value={manual[key]} onChange={e => setManual(p => ({ ...p, [key]: e.target.value }))}
                    placeholder="0"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <button onClick={submitManual} disabled={!manual.name || !manual.calories}
              style={{ width: "100%", background: manual.name && manual.calories ? "#1a1a1a" : "#e0e0e0", color: manual.name && manual.calories ? "#fff" : "#aaa", border: "none", borderRadius: "7px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NutritionTab({ clientId }) {
  const [data, setData] = useState(loadNutrition);
  const [targets, setTargets] = useState(() => loadTargets() || { calories: 2200, protein: 170, carbs: 220, fat: 70 });
  const [view, setView] = useState("today"); // today | week | targets
  const [showAdd, setShowAdd] = useState(false);
  const [editingTargets, setEditingTargets] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today());

  // Load from Supabase on mount
  useEffect(() => {
    if (!clientId) return;
    async function loadFromSupabase() {
      try {
        const { getNutritionLogs, getNutritionTargets } = await import("../lib/supabase");
        const [logsResult, targetsResult] = await Promise.all([
          getNutritionLogs(clientId, 60),
          getNutritionTargets(clientId),
        ]);
        if (logsResult.data?.length > 0) {
          // Convert array of rows to the {date: [items]} format
          const byDate = {};
          logsResult.data.forEach(row => {
            const d = row.log_date;
            if (!byDate[d]) byDate[d] = [];
            byDate[d].push({ id: row.id, name: row.food_name, calories: row.calories || 0, protein: row.protein_g || 0, carbs: row.carbs_g || 0, fat: row.fat_g || 0, time: row.meal_time, fromSupabase: true });
          });
          setData(prev => ({ ...byDate, ...prev }));
        }
        if (targetsResult.data) {
          const t = targetsResult.data;
          setTargets({ calories: t.calories || 2200, protein: t.protein_g || 170, carbs: t.carbs_g || 220, fat: t.fat_g || 70 });
        }
      } catch(e) { console.warn("Nutrition load failed:", e); }
    }
    loadFromSupabase();
  }, [clientId]);

  useEffect(() => { saveNutrition(data); }, [data]);
  useEffect(() => { saveTargets(targets); }, [targets]);

  const dayLog = data[selectedDate] || [];

  const totals = dayLog.reduce((acc, item) => ({
    calories: acc.calories + (item.calories || 0),
    protein: acc.protein + (item.protein || 0),
    carbs: acc.carbs + (item.carbs || 0),
    fat: acc.fat + (item.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  async function addFood(food) {
    const entry = { ...food, time: new Date().toTimeString().slice(0, 5) };
    const updated = { ...data, [selectedDate]: [...dayLog, entry] };
    setData(updated);
    saveNutrition(updated);
    setShowAdd(false);

    if (clientId) {
      try {
        const { logNutritionEntry } = await import("../lib/supabase");
        await logNutritionEntry(clientId, {
          log_date: selectedDate,
          food_name: food.name,
          calories: food.calories,
          protein_g: food.protein,
          carbs_g: food.carbs,
          fat_g: food.fat,
          meal_time: entry.time,
        });
      } catch(e) { console.warn("Nutrition Supabase write failed:", e); }
    }
  }

  async function removeFood(id) {
    const updated = { ...data, [selectedDate]: dayLog.filter(f => f.id !== id) };
    setData(updated);
    saveNutrition(updated);
    if (clientId && typeof id === 'number' && id > 1000000000000) {
      // Only attempt Supabase delete for Supabase-originated IDs (bigint, not Date.now())
    } else if (clientId) {
      try {
        const { deleteNutritionEntry } = await import("../lib/supabase");
        await deleteNutritionEntry(id);
      } catch(e) { console.warn("Nutrition delete failed:", e); }
    }
  }

  async function saveTargetsDone() {
    setSaved(true);
    setEditingTargets(false);
    saveTargets(targets);
    if (clientId) {
      try {
        const { upsertNutritionTargets } = await import("../lib/supabase");
        await upsertNutritionTargets(clientId, { calories: targets.calories, protein_g: targets.protein, carbs_g: targets.carbs, fat_g: targets.fat });
      } catch(e) { console.warn("Targets save failed:", e); }
    }
    setTimeout(() => setSaved(false), 2000);
  }

  // Weekly summary
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const log = data[key] || [];
    const cals = log.reduce((s, f) => s + (f.calories || 0), 0);
    const prot = log.reduce((s, f) => s + (f.protein || 0), 0);
    return { date: key, label: d.toLocaleDateString("en-US", { weekday: "short" }), calories: cals, protein: prot, logged: log.length > 0 };
  });

  const weekAvgCals = Math.round(last7.filter(d => d.logged).reduce((s, d) => s + d.calories, 0) / Math.max(1, last7.filter(d => d.logged).length));
  const weekAvgProt = Math.round(last7.filter(d => d.logged).reduce((s, d) => s + d.protein, 0) / Math.max(1, last7.filter(d => d.logged).length));
  const maxCals = Math.max(...last7.map(d => d.calories), targets.calories);

  // Cycle-phase caloric note
  function getCycleNote() {
    try {
      const cycleData = JSON.parse(localStorage.getItem("cycle_data_v2") || "null");
      if (!cycleData?.lastPeriodStart) return null;
      const start = new Date(cycleData.lastPeriodStart + "T12:00:00");
      const day = Math.floor((Date.now() - start) / 86400000) % (cycleData.cycleLength || 28) + 1;
      if (day >= 17 && day <= 28) return "Luteal phase: caloric needs are roughly 100 to 200 calories higher than usual. This is normal and physiological.";
      if (day >= 6 && day <= 13) return "Follicular phase: carbohydrate tolerance is higher. Fuel training sessions well.";
    } catch {}
    return null;
  }

  const cycleNote = getCycleNote();

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Section nav */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {[["today", "Today"], ["week", "This Week"], ["targets", "Targets"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: "7px", border: "1px solid " + (view === v ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "6px", background: view === v ? "#1a1a1a" : "#fff",
            color: view === v ? "#f7f6f3" : "#666", cursor: "pointer", fontSize: "12px", ...F,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Today ── */}
      {view === "today" && (
        <>
          {/* Date selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().slice(0, 10));
            }} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#bbb", padding: "0 6px" }}>‹</button>
            <div style={{ fontSize: "13px", fontWeight: "600", ...F }}>
              {selectedDate === today() ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </div>
            <button onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              const next = d.toISOString().slice(0, 10);
              if (next <= today()) setSelectedDate(next);
            }} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: selectedDate >= today() ? "#eee" : "#bbb", padding: "0 6px" }}>›</button>
          </div>

          {/* Calorie ring + macros */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", marginBottom: "12px", display: "flex", gap: "16px", alignItems: "center" }}>
            <CalRing consumed={totals.calories} target={targets.calories} />
            <div style={{ flex: 1 }}>
              <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="#2d7a1e" />
              <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="#1d6fa8" />
              <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="#c47a0a" />
            </div>
          </div>

          {/* Remaining */}
          {targets.calories > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              {[
                { label: "Remaining", val: Math.max(0, targets.calories - totals.calories), unit: "kcal", color: "#555" },
                { label: "Protein left", val: Math.max(0, targets.protein - totals.protein), unit: "g", color: "#2d7a1e" },
              ].map(({ label, val, unit, color }) => (
                <div key={label} style={{ flex: 1, background: "#f9f9f7", borderRadius: "7px", padding: "9px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: "2px" }}>{label}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color }}>{val}<span style={{ fontSize: "10px", fontWeight: "400", color: "#aaa", marginLeft: "2px" }}>{unit}</span></div>
                </div>
              ))}
            </div>
          )}

          {/* Cycle note */}
          {cycleNote && (
            <div style={{ background: "#f9f5fc", border: "1px solid #e0c8f0", borderRadius: "7px", padding: "9px 12px", marginBottom: "12px", fontSize: "11px", color: "#7a3aa0", lineHeight: "1.55" }}>
              {cycleNote}
            </div>
          )}

          {/* Food log */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>
              Food log · {dayLog.length} item{dayLog.length !== 1 ? "s" : ""}
            </div>
            <button onClick={() => setShowAdd(true)} style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
              + Add food
            </button>
          </div>

          {dayLog.length === 0 && (
            <InlineEmpty>Nothing logged yet. Tap "+ Add food" to start tracking.</InlineEmpty>
          )}

          {dayLog.map(item => (
            <div key={item.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 12px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "2px" }}>{item.name}</div>
                <div style={{ fontSize: "10px", color: "#aaa" }}>
                  P: {item.protein}g · C: {item.carbs}g · F: {item.fat}g
                  {item.time && <span style={{ marginLeft: "6px" }}>{item.time}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#333" }}>{item.calories}</span>
                <button onClick={() => removeFood(item.id)} style={{ background: "none", border: "none", color: "#e0e0e0", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0" }}>×</button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Week ── */}
      {view === "week" && (
        <>
          {/* Bar chart */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", marginBottom: "14px" }}>Calories — last 7 days</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "80px", marginBottom: "6px" }}>
              {last7.map(d => {
                const barH = maxCals > 0 ? Math.max(4, (d.calories / maxCals) * 72) : 4;
                const isTarget = d.calories >= targets.calories * 0.9 && d.calories <= targets.calories * 1.1;
                const isToday = d.date === today();
                return (
                  <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "80px" }}>
                    <div style={{ width: "100%", borderRadius: "3px 3px 0 0", background: isToday ? "#1a1a1a" : isTarget ? "#2d7a1e" : d.logged ? "#c47a0a" : "#f0f0f0", height: `${barH}px`, transition: "height 0.4s ease" }} />
                  </div>
                );
              })}
            </div>
            {/* Target line label */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              {last7.map(d => (
                <div key={d.date} style={{ flex: 1, textAlign: "center", fontSize: "9px", color: d.date === today() ? "#1a1a1a" : "#bbb" }}>{d.label}</div>
              ))}
            </div>
            <div style={{ fontSize: "10px", color: "#aaa" }}>
              <span style={{ color: "#2d7a1e" }}>Green</span> = on target &nbsp;·&nbsp; <span style={{ color: "#c47a0a" }}>Amber</span> = logged but off target
            </div>
          </div>

          {/* Weekly averages */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
            {[
              { label: "Avg calories", val: weekAvgCals, target: targets.calories, unit: "kcal" },
              { label: "Avg protein", val: weekAvgProt, target: targets.protein, unit: "g" },
              { label: "Days logged", val: last7.filter(d => d.logged).length, target: 7, unit: "/ 7" },
              { label: "Protein target", val: weekAvgProt >= targets.protein * 0.9 ? "Hit" : "Missed", target: null, unit: "" },
            ].map(({ label, val, target, unit }) => {
              const onTarget = target ? Math.abs(val - target) / target < 0.1 : val === "Hit";
              return (
                <div key={label} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "11px 12px" }}>
                  <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#bbb", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: onTarget ? "#2d7a1e" : "#c47a0a" }}>
                    {val}<span style={{ fontSize: "11px", fontWeight: "400", color: "#aaa", marginLeft: "2px" }}>{unit}</span>
                  </div>
                  {target && <div style={{ fontSize: "9px", color: "#ccc", marginTop: "1px" }}>Target: {target}{unit}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Targets ── */}
      {view === "targets" && (
        <>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Daily targets</div>
              <button onClick={() => setEditingTargets(p => !p)} style={{ background: "none", border: "1px solid #e0e0e0", borderRadius: "20px", padding: "4px 12px", fontSize: "10px", cursor: "pointer", color: "#555" }}>
                {editingTargets ? "Cancel" : "Edit"}
              </button>
            </div>

            {editingTargets ? (
              <div>
                {[["calories", "Calories (kcal)"], ["protein", "Protein (g)"], ["carbs", "Carbs (g)"], ["fat", "Fat (g)"]].map(([key, label]) => (
                  <div key={key} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", color: "#777", marginBottom: "3px" }}>{label}</div>
                    <input type="number" value={targets[key]} onChange={e => setTargets(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }} />
                  </div>
                ))}
                <button onClick={saveTargetsDone} style={{ width: "100%", background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "7px", padding: "11px", fontSize: "13px", cursor: "pointer", marginTop: "4px", ...F }}>
                  {saved ? "Saved" : "Save targets"}
                </button>
              </div>
            ) : (
              <div>
                {[
                  ["Calories", targets.calories, "kcal"],
                  ["Protein", targets.protein, "g"],
                  ["Carbs", targets.carbs, "g"],
                  ["Fat", targets.fat, "g"],
                ].map(([label, val, unit]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: "12px", color: "#666" }}>{label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600" }}>{val} <span style={{ fontSize: "10px", fontWeight: "400", color: "#aaa" }}>{unit}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidance */}
          <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "8px" }}>Setting your targets</div>
            <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7" }}>
              For muscle building with fat loss, the standard starting point is 1 gram of protein per pound of bodyweight. Calories should sit 200 to 300 below maintenance — aggressive deficits accelerate muscle loss alongside fat. Fat is a floor, not a ceiling: 0.3 to 0.4 grams per pound of bodyweight is the minimum for hormonal health. Carbohydrates fill the rest.
            </div>
          </div>

          <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: "8px" }}>Cycle-aware calories</div>
            <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7" }}>
              Caloric needs are measurably higher during the luteal phase (roughly days 17 to 28) due to elevated BMR from progesterone. Adding 100 to 200 calories during this window — particularly from complex carbohydrates — reduces PMS symptoms and supports training performance. This is physiological, not a lack of willpower.
            </div>
          </div>
        </>
      )}

      {showAdd && <AddFoodModal onAdd={addFood} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
