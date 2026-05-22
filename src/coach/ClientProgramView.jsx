import { useState } from "react";
import { schedule as taraSchedule } from "../tara-data";
import { schedule as skylerSchedule } from "../data.js";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const DAY_COLORS = {
  MON: { bg: "#111", text: "#f7f6f3", accent: "#c47a0a" },
  TUE: { bg: "#1a2744", text: "#e8f0ff", accent: "#4a8fff" },
  WED: { bg: "#1a3322", text: "#e8f5ee", accent: "#3aab5a" },
  THU: { bg: "#2a1a44", text: "#f0e8ff", accent: "#9a6fff" },
  FRI: { bg: "#2a1a1a", text: "#ffe8e8", accent: "#ff6b6b" },
  SAT: { bg: "#1a2a2a", text: "#e8faf5", accent: "#2abba0" },
  SUN: { bg: "#2a2520", text: "#fff3e8", accent: "#f0a050" },
};

const MUSCLE_TAG_COLOR = "#f9f9f7";

function MuscleTag({ label }) {
  return (
    <span style={{
      display: "inline-block",
      background: MUSCLE_TAG_COLOR,
      border: "1px solid #e4e0db",
      borderRadius: "20px",
      padding: "2px 9px",
      fontSize: "10px",
      color: "#777",
      marginRight: "4px",
      marginBottom: "4px",
    }}>
      {label}
    </span>
  );
}

function ExerciseCard({ ex, index }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #ede9e4",
      borderRadius: "10px",
      marginBottom: "8px",
      overflow: "hidden",
    }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "13px 15px", cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "flex-start", gap: "12px", ...F,
        }}
      >
        {/* Order bubble */}
        <div style={{
          flexShrink: 0, width: "26px", height: "26px", borderRadius: "50%",
          background: "#111", color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: "700", marginTop: "1px",
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "14px", fontWeight: "600", color: "#111", marginBottom: "3px" }}>
            {ex.name}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "4px" }}>
            {(ex.muscles || []).map(m => <MuscleTag key={m} label={m} />)}
          </div>
          {/* Sets/Reps/Rest inline */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {[
              ["Sets", ex.sets],
              ["Reps", ex.reps],
              ["Rest", ex.rest],
              ex.eccentric && ["Eccentric", ex.eccentric],
            ].filter(Boolean).map(([label, val]) => (
              <div key={label}>
                <span style={{ fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb" }}>{label} </span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <span style={{ color: "#ccc", fontSize: "11px", flexShrink: 0, marginTop: "4px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid #f5f5f3", padding: "13px 15px" }}>
          {/* Why */}
          {ex.why && (
            <div style={{ background: "#fafaf8", borderRadius: "7px", padding: "10px 12px", marginBottom: "10px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "5px" }}>
                Why this exercise
              </div>
              <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7", ...F }}>
                {ex.why}
              </div>
            </div>
          )}

          {/* Form cues */}
          {ex.form && ex.form.length > 0 && (
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "7px" }}>
                Form cues
              </div>
              {ex.form.map((cue, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", marginBottom: "7px",
                  paddingBottom: "7px",
                  borderBottom: i < ex.form.length - 1 ? "1px solid #f5f5f3" : "none",
                }}>
                  <div style={{
                    flexShrink: 0, fontSize: "10px", fontWeight: "700",
                    color: "#111", minWidth: "80px", paddingTop: "1px",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                    {cue.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.65", ...F }}>
                    {cue.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayCard({ day, isSelected, onClick }) {
  const colors = DAY_COLORS[day.day] || DAY_COLORS.MON;
  const totalExercises = (day.exercises || []).length + (day.core_finisher || []).length;

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, width: "72px",
        background: isSelected ? colors.bg : "#f9f9f7",
        border: `2px solid ${isSelected ? colors.bg : "#ede9e4"}`,
        borderRadius: "10px", padding: "10px 6px",
        cursor: "pointer", textAlign: "center", ...F,
        transition: "all 0.15s",
      }}
    >
      <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em", color: isSelected ? colors.text : "#444", marginBottom: "3px" }}>
        {day.day}
      </div>
      <div style={{ fontSize: "9px", color: isSelected ? colors.accent : "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px", lineHeight: "1.3" }}>
        {day.label}
      </div>
      <div style={{ fontSize: "9px", color: isSelected ? `${colors.text}88` : "#ccc" }}>
        {totalExercises} ex
      </div>
    </button>
  );
}

function CardioBlock({ cardio, accentColor }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: "#f0f8ff",
      border: "1px solid #d0e8ff",
      borderRadius: "10px",
      marginBottom: "16px",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "13px 15px", cursor: "pointer", textAlign: "left",
          display: "flex", justifyContent: "space-between", alignItems: "center", ...F,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "3px" }}>
            <span style={{ fontSize: "13px" }}>🏃</span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1a4a8a" }}>{cardio.name}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#4a7abf" }}>{cardio.protocol}</div>
        </div>
        <span style={{ color: "#aac4e0", fontSize: "11px" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid #d0e8ff", padding: "12px 15px" }}>
          <div style={{ fontSize: "11px", color: "#4a6a90", marginBottom: "5px" }}>
            <span style={{ fontWeight: "600" }}>Zone: </span>{cardio.zone}
          </div>
          {cardio.feel && (
            <div style={{ fontSize: "12px", color: "#3a5a80", lineHeight: "1.7", fontStyle: "italic", ...F }}>
              "{cardio.feel}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayView({ day }) {
  const colors = DAY_COLORS[day.day] || DAY_COLORS.MON;
  const allExercises = day.exercises || [];
  const coreFinisher = day.core_finisher || [];

  return (
    <div>
      {/* Day header */}
      <div style={{
        background: colors.bg, borderRadius: "12px",
        padding: "16px 18px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${colors.text}60`, marginBottom: "4px" }}>
              {day.day}
            </div>
            <div style={{ fontSize: "20px", fontWeight: "normal", color: colors.text, marginBottom: "4px", ...F }}>
              {day.focus}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "6px" }}>
              {(day.muscles || []).map(m => (
                <span key={m} style={{
                  background: `${colors.text}15`, color: colors.accent,
                  borderRadius: "20px", padding: "2px 9px", fontSize: "10px",
                }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: "700", color: colors.accent }}>
              {allExercises.length + coreFinisher.length}
            </div>
            <div style={{ fontSize: "9px", color: `${colors.text}60`, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              exercises
            </div>
          </div>
        </div>
      </div>

      {/* Cardio block if present */}
      {day.cardio && <CardioBlock cardio={day.cardio} accentColor={colors.accent} />}

      {/* Main exercises */}
      {allExercises.length > 0 && (
        <>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>
            Main Exercises
          </div>
          {allExercises.map((ex, i) => (
            <ExerciseCard key={ex.name} ex={ex} index={i} />
          ))}
        </>
      )}

      {/* Core finisher */}
      {coreFinisher.length > 0 && (
        <>
          <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", margin: "14px 0 8px" }}>
            Core Finisher
          </div>
          {coreFinisher.map((ex, i) => (
            <ExerciseCard key={ex.name} ex={ex} index={i} />
          ))}
        </>
      )}

      {/* Rest day */}
      {allExercises.length === 0 && !day.cardio && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px", opacity: 0.4 }}>💤</div>
          <div style={{ fontSize: "14px" }}>Rest Day</div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ClientProgramView({ client }) {
  // Route to client-specific program by stable Supabase ID only
  // New clients see nothing until a program is assigned by the coach
  const TARA_ID   = "fa2b1f9e-ed1e-4b7a-b2a3-def60932e2f5";
  const SKYLER_ID = "f1f04d99-76ec-477f-938f-ebfb456b1d88";
  const clientId  = client?.id || "";

  const schedule =
    clientId === TARA_ID   ? taraSchedule   :
    clientId === SKYLER_ID ? skylerSchedule :
    null;

  const [selectedDay, setSelectedDay] = useState(0);

  if (!schedule || schedule.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", ...F }}>
        <div style={{ fontSize: "28px", marginBottom: "12px", opacity: 0.3 }}>📋</div>
        <div style={{ fontSize: "14px", color: "#333", marginBottom: "7px", fontWeight: "600" }}>
          No program assigned yet
        </div>
        <div style={{ fontSize: "12px", color: "#aaa", lineHeight: "1.7", maxWidth: "260px", margin: "0 auto" }}>
          {client?.name?.split(" ")[0] || "This client"} will not see any workouts until a program is built and assigned. Use the Build Program tab to create one.
        </div>
      </div>
    );
  }

  const currentDay = schedule[selectedDay];

  return (
    <div style={{ ...F }}>
      {/* Client name + program label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "2px" }}>Current program</div>
          <div style={{ fontSize: "15px", color: "#111", fontWeight: "600" }}>{client?.name}</div>
        </div>
        <div style={{ fontSize: "10px", color: "#aaa" }}>
          {schedule.length} training days
        </div>
      </div>

      {/* Day picker — horizontal scroll */}
      <div style={{
        display: "flex", gap: "7px", overflowX: "auto",
        msOverflowStyle: "none", scrollbarWidth: "none",
        marginBottom: "16px", paddingBottom: "4px",
      }}>
        {schedule.map((day, i) => (
          <DayCard
            key={day.day}
            day={day}
            isSelected={selectedDay === i}
            onClick={() => setSelectedDay(i)}
          />
        ))}
      </div>

      {/* Day detail */}
      <DayView day={currentDay} />
    </div>
  );
}
