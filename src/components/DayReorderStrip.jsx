import { useState, useRef, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

/*
  DayReorderStrip — weekly day selector with an optional reorder mode.

  The weekday LABELS stay fixed in order (Mon, Tue, Wed...). What the user
  rearranges is WHICH WORKOUT sits in each weekday slot. Dragging one day onto
  another SWAPS their workouts. The labels never move.

  Each entry in `schedule` carries:
    slotLabel / slotDay — the fixed weekday for that position (shown to user)
    label               — the workout's name (Glutes, Upper Pull, etc.)
    workoutKey          — original identity of the workout in this slot

  Props:
    schedule   array of slot objects (in fixed weekday order)
    activeDay  index of the currently selected slot
    onSelect   (index) => void
    onReorder  (newWorkoutKeys[]) => void — array of workoutKeys in slot order
*/
export default function DayReorderStrip({ schedule, activeDay, onSelect, onReorder }) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(schedule);  // working copy while editing
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const itemRefs = useRef([]);
  const overIdxRef = useRef(null);

  useEffect(() => { if (!editing) setOrder(schedule); }, [schedule, editing]);
  useEffect(() => { overIdxRef.current = overIdx; }, [overIdx]);

  function startEdit() { setOrder(schedule); setEditing(true); }
  function cancelEdit() { setOrder(schedule); setEditing(false); setDragIdx(null); setOverIdx(null); }
  function saveEdit() {
    // Emit the workoutKey assigned to each fixed slot, in slot order
    onReorder(order.map(d => d.workoutKey || d.day));
    setEditing(false); setDragIdx(null); setOverIdx(null);
  }

  function getIndexAtX(clientX) {
    const els = itemRefs.current.filter(Boolean);
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (clientX < r.left + r.width / 2) return i;
    }
    return els.length - 1;
  }

  function onPointerDown(e, idx) {
    if (!editing) return;
    e.preventDefault();
    setDragIdx(idx);
    setOverIdx(idx);
    const move = (ev) => {
      const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
      setOverIdx(getIndexAtX(x));
    };
    const up = () => {
      setOrder(prev => {
        const from = idx;
        const to = overIdxRef.current;
        if (to == null || to === from) return prev;
        // SWAP the workout content of the two slots; labels stay put because
        // they're rendered from the slot position, not the workout.
        const copy = [...prev];
        const tmp = copy[from];
        copy[from] = copy[to];
        copy[to] = tmp;
        return copy;
      });
      setDragIdx(null); setOverIdx(null);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up);
  }

  const list = editing ? order : schedule;
  // Fixed weekday labels come from the slot position in the ORIGINAL schedule,
  // so they never move even as workouts are dragged between them.
  const slotLabels = schedule.map(d => ({ day: d.slotDay || d.day }));

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px 0" }}>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", ...F }}>
          {editing ? "Drag a workout to swap days" : "Your week"}
        </span>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={cancelEdit} style={{ background: "none", border: "none", fontSize: 11, color: "#999", cursor: "pointer", ...F }}>Cancel</button>
            <button onClick={saveEdit} style={{ background: "#1a1a1a", border: "none", borderRadius: 14, fontSize: 11, color: "#fff", cursor: "pointer", padding: "3px 12px", ...F }}>Save</button>
          </div>
        ) : (
          <button onClick={startEdit} style={{ background: "none", border: "none", fontSize: 11, color: "#2563a8", cursor: "pointer", ...F }}>Edit week</button>
        )}
      </div>

      <div style={{ display: "flex", overflowX: editing ? "visible" : "auto", scrollbarWidth: "none", padding: "4px 0 0", touchAction: editing ? "none" : "pan-x" }}>
        {list.map((d, i) => {
          const isActive = !editing && activeDay === i;
          const isDragging = editing && dragIdx === i;
          const isOver = editing && overIdx === i && dragIdx !== null && dragIdx !== i;
          // The weekday label for THIS position is always the fixed slot label.
          const weekday = slotLabels[i]?.day || d.day;
          return (
            <button
              key={i}
              ref={el => (itemRefs.current[i] = el)}
              onClick={() => { if (!editing) onSelect(i); }}
              onMouseDown={e => onPointerDown(e, i)}
              onTouchStart={e => onPointerDown(e, i)}
              style={{
                flex: "0 0 auto", background: isDragging ? "#eef4fb" : "transparent",
                border: editing ? "1px dashed " + (isOver ? "#2563a8" : "#ddd") : "none",
                borderBottom: isActive ? "3px solid #1a1a1a" : (editing ? undefined : "3px solid transparent"),
                borderRadius: editing ? 8 : 0,
                margin: editing ? "0 3px" : 0,
                padding: "9px 12px 8px", cursor: editing ? "grab" : "pointer", ...F,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 48,
                opacity: isDragging ? 0.5 : 1,
                transform: isOver ? "scale(1.05)" : "none",
                transition: "transform 0.1s, background 0.1s",
                touchAction: editing ? "none" : "auto",
              }}
            >
              {editing && <span style={{ fontSize: 10, color: "#ccc", lineHeight: 1, marginBottom: 1 }}>⋮⋮</span>}
              {/* Fixed weekday label — never moves */}
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", color: isActive ? "#1a1a1a" : "#bbb" }}>{weekday}</span>
              {/* The workout assigned to this slot — this is what moves */}
              <span style={{ fontSize: 9, color: isActive ? "#1a1a1a" : "#ccc", whiteSpace: "nowrap" }}>{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
