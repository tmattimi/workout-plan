import { useState, useRef, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

/*
  DayReorderStrip — the weekly day selector with an optional reorder mode.

  Normal mode: tabs you tap to switch days (same behavior as before).
  Edit mode:   press-and-drag any day to a new position. Works with both
               mouse and touch (native HTML5 DnD doesn't work on mobile, so
               this uses pointer math directly).

  Props:
    schedule    array of day objects (each has .day and .label)
    activeDay   index of the currently selected day
    onSelect    (index) => void   — tap a day to view it
    onReorder   (newOrderLabels[]) => void — called when a drag completes
*/
export default function DayReorderStrip({ schedule, activeDay, onSelect, onReorder }) {
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState(schedule);     // working copy while editing
  const [dragIdx, setDragIdx] = useState(null);     // index being dragged
  const [overIdx, setOverIdx] = useState(null);     // index being hovered over
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  // Keep working copy in sync when the real schedule changes (and not editing)
  useEffect(() => { if (!editing) setOrder(schedule); }, [schedule, editing]);

  function startEdit() { setOrder(schedule); setEditing(true); }
  function cancelEdit() { setOrder(schedule); setEditing(false); setDragIdx(null); setOverIdx(null); }
  function saveEdit() {
    onReorder(order.map(d => d.day));
    setEditing(false);
    setDragIdx(null);
    setOverIdx(null);
  }

  // ── Drag handling (pointer events: works for mouse + touch) ──────────────────
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
        const copy = [...prev];
        const [moved] = copy.splice(from, 1);
        copy.splice(to, 0, moved);
        return copy;
      });
      setDragIdx(null);
      setOverIdx(null);
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

  // Keep a ref of overIdx so the pointerup closure reads the latest value
  const overIdxRef = useRef(null);
  useEffect(() => { overIdxRef.current = overIdx; }, [overIdx]);

  const list = editing ? order : schedule;

  return (
    <div style={{ background: "#fff", borderBottom: "1px solid #e5e5e5" }}>
      {/* Header row with edit / save / cancel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px 0" }}>
        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", ...F }}>
          {editing ? "Drag to rearrange" : "Your week"}
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

      {/* Day strip */}
      <div
        ref={containerRef}
        style={{ display: "flex", overflowX: editing ? "visible" : "auto", msOverflowStyle: "none", scrollbarWidth: "none", padding: "4px 0 0", touchAction: editing ? "none" : "pan-x" }}
      >
        {list.map((d, i) => {
          const isActive = !editing && activeDay === i;
          const isDragging = editing && dragIdx === i;
          const isOver = editing && overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <button
              key={d.day}
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
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 46,
                opacity: isDragging ? 0.5 : 1,
                transform: isOver ? "scale(1.05)" : "none",
                transition: "transform 0.1s, background 0.1s",
                touchAction: editing ? "none" : "auto",
              }}
            >
              {editing && <span style={{ fontSize: 10, color: "#ccc", lineHeight: 1, marginBottom: 1 }}>⋮⋮</span>}
              <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.15em", color: isActive ? "#1a1a1a" : "#bbb" }}>{d.day}</span>
              <span style={{ fontSize: 9, color: isActive ? "#1a1a1a" : "#ccc", whiteSpace: "nowrap" }}>{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
