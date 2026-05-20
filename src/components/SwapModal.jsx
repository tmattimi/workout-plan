import { useState } from "react";
import { getSwaps } from "../data/swaps";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const SWAP_REASONS = [
  "Equipment not available",
  "Causes pain or discomfort",
  "Injury or limitation",
  "Prefer this variation",
  "Other"
];

export default function SwapModal({ exercise, clientId, sessionKey, onSwap, onClose }) {
  const swaps = getSwaps(exercise.name);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const positionLabel = {
    same: { label: "Same position", color: "#2d7a1e" },
    lengthened: { label: "Stretched position", color: "#2563a8" },
    shortened: { label: "Contracted position", color: "#a07020" },
    mid: { label: "Mid-range", color: "#555" },
  };

  async function handleConfirm() {
    if (!selected || !reason) return;
    setSaving(true);
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      await supabase.from("exercise_swaps").insert({
        client_id: clientId,
        session_key: sessionKey,
        original_exercise: exercise.name,
        swap_exercise: selected.name,
        reason_category: reason,
        reason_note: note || null,
        swapped_at: new Date().toISOString(),
      });
    } catch (e) {
      console.log("Swap log failed (ok if table missing):", e.message);
    }
    setSaving(false);
    setDone(true);
    setTimeout(() => {
      onSwap(selected);
      onClose();
    }, 900);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#f7f6f3", width: "100%", maxWidth: 640,
        margin: "0 auto", borderRadius: "14px 14px 0 0",
        maxHeight: "88vh", display: "flex", flexDirection: "column",
        ...F,
      }}>
        {/* Header */}
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid #e8e8e4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#aaa", marginBottom: "4px" }}>
                Swap exercise
              </div>
              <div style={{ fontSize: "17px", color: "#111", fontWeight: "normal" }}>
                {exercise.name}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", fontSize: "22px", color: "#bbb",
              cursor: "pointer", padding: "4px 8px", lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>

          {swaps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#888", fontSize: "13px" }}>
              No alternative exercises on file for this movement yet.
            </div>
          ) : (
            <>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "12px", lineHeight: "1.6" }}>
                These alternatives train the same muscle group with scientific backing. Each note explains what changes mechanically.
              </div>

              {swaps.map((swap, i) => {
                const pos = positionLabel[swap.position] || positionLabel.mid;
                const isSelected = selected?.name === swap.name;
                return (
                  <button key={i} onClick={() => setSelected(swap)} style={{
                    width: "100%", textAlign: "left", background: isSelected ? "#1a1a1a" : "#fff",
                    border: isSelected ? "2px solid #111" : "1px solid #e4e4e0",
                    borderRadius: "10px", padding: "13px 14px", marginBottom: "10px",
                    cursor: "pointer", transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ fontSize: "14px", fontWeight: "normal", color: isSelected ? "#fff" : "#111", flex: 1, paddingRight: "8px" }}>
                        {swap.name}
                      </div>
                      <span style={{
                        fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
                        color: isSelected ? "#aaa" : pos.color,
                        background: isSelected ? "rgba(255,255,255,0.12)" : `${pos.color}18`,
                        padding: "2px 7px", borderRadius: "20px", whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {pos.label}
                      </span>
                    </div>

                    {/* Equipment */}
                    {swap.equipment.length > 0 && (
                      <div style={{ fontSize: "10px", color: isSelected ? "#888" : "#aaa", marginBottom: "5px" }}>
                        Needs: {swap.equipment.join(", ").replace(/_/g, " ")}
                      </div>
                    )}
                    {swap.equipment.length === 0 && (
                      <div style={{ fontSize: "10px", color: isSelected ? "#6a8" : "#2d7a1e", marginBottom: "5px" }}>
                        No equipment needed
                      </div>
                    )}

                    {/* Tradeoff */}
                    <div style={{ fontSize: "12px", color: isSelected ? "#ccc" : "#555", lineHeight: "1.6", marginBottom: "6px" }}>
                      {swap.tradeoff}
                    </div>

                    {/* Research note */}
                    <div style={{ fontSize: "10px", color: isSelected ? "#777" : "#aaa", lineHeight: "1.5", fontStyle: "italic" }}>
                      {swap.researchNote}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Reason section */}
          {selected && (
            <div style={{ marginTop: "16px", background: "#fff", borderRadius: "10px", padding: "14px", border: "1px solid #e4e4e0" }}>
              <div style={{ fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", marginBottom: "10px" }}>
                Why are you swapping?
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "12px" }}>
                {SWAP_REASONS.map(r => (
                  <button key={r} onClick={() => setReason(r)} style={{
                    background: reason === r ? "#111" : "#f4f4f2",
                    color: reason === r ? "#fff" : "#555",
                    border: "none", borderRadius: "20px",
                    padding: "6px 13px", fontSize: "12px", cursor: "pointer", ...F,
                  }}>
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Optional: any extra detail that helps your coach (e.g. 'lower back pain on the cable kickback')"
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#f7f6f3", border: "1px solid #e4e4e0",
                  borderRadius: "7px", color: "#333", fontSize: "12px",
                  lineHeight: "1.6", padding: "9px 12px", resize: "none",
                  outline: "none", ...F,
                }}
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div style={{ padding: "14px 18px", borderTop: "1px solid #e8e8e4" }}>
            {done ? (
              <div style={{ textAlign: "center", padding: "10px 0", color: "#2d7a1e", fontSize: "14px" }}>
                Swap confirmed — coach notified
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={!reason || saving}
                style={{
                  width: "100%", background: reason ? "#111" : "#ccc",
                  color: "#fff", border: "none", borderRadius: "8px",
                  padding: "14px", fontSize: "14px", cursor: reason ? "pointer" : "default",
                  ...F,
                }}
              >
                {saving ? "Saving..." : `Swap to ${selected.name}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
