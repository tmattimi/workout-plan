import { useState } from "react";
import { formatDate, thisMonth } from "../storage";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function MonthlyPrompt({ photos, onSave, onDismiss }) {
  const [step, setStep] = useState("prompt"); // prompt | capture | saved
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setStep("capture");
  }

  function handleSave() {
    setSaving(true);
    const entry = {
      date: new Date().toISOString().slice(0, 10),
      month: thisMonth(),
      note: note.trim(),
      dataUrl: preview,
    };
    const updated = [...(photos || []), entry];
    onSave(updated);
    setTimeout(() => {
      setSaving(false);
      setStep("saved");
    }, 600);
  }

  if (step === "saved") {
    return (
      <div style={{ padding: "28px 20px", textAlign: "center" }}>
        
        <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "6px" }}>Progress photo saved</div>
        <div style={{ fontSize: "12px", color: "#777", marginBottom: "20px", lineHeight: "1.6" }}>
          Check back next month to see how far you've come. The changes show up in photos long before the mirror catches up.
        </div>
        <button onClick={onDismiss} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "13px 28px", fontSize: "13px", cursor: "pointer", ...F }}>
          Done
        </button>
      </div>
    );
  }

  if (step === "capture") {
    return (
      <div style={{ padding: "16px 16px 28px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
          Monthly Progress Photo
        </div>

        {preview && (
          <div style={{ marginBottom: "14px", borderRadius: "10px", overflow: "hidden", border: "1px solid #e8e8e8" }}>
            <img src={preview} alt="Preview" style={{ width: "100%", display: "block", maxHeight: "300px", objectFit: "cover" }} />
          </div>
        )}

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#777", marginBottom: "5px" }}>
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. feeling stronger, waist looking slimmer..."
            rows={3}
            style={{ width: "100%", padding: "9px 11px", borderRadius: "7px", border: "1px solid #e0e0e0", fontSize: "12px", color: "#333", resize: "none", ...F }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => { setStep("prompt"); setPreview(null); }} style={{ flex: 1, background: "#f5f5f3", color: "#555", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>
            Retake
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, background: saving ? "#aaa" : "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", cursor: "pointer", ...F }}>
            {saving ? "Saving..." : "Save Photo"}
          </button>
        </div>
      </div>
    );
  }

  // Default: prompt view
  return (
    <div style={{ padding: "24px 20px 28px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "10px" }}>
        Monthly Check-In
      </div>
      
      <div style={{ fontSize: "18px", fontWeight: "normal", marginBottom: "8px" }}>
        Time for your progress photo
      </div>
      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.7", marginBottom: "20px" }}>
        A new month means a new check-in. Progress photos reveal changes the scale and mirror miss — especially during a recomp where weight can stay similar while body composition shifts significantly. Log measurements too for the full picture.
      </div>

      <div style={{ background: "#f5f5f3", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: "#555", marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tips for consistent photos</div>
        {["Same time of day — morning, fasted, is best", "Same location and lighting", "Same poses each month (front, side, back)", "Same clothing or no shirt for accuracy"].map((tip, i) => (
          <div key={i} style={{ fontSize: "11px", color: "#666", display: "flex", gap: "7px", marginBottom: "4px" }}>
            <span style={{ color: "#aaa", flexShrink: 0 }}>→</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      <label style={{ display: "block", width: "100%", background: "#111", color: "#fff", borderRadius: "8px", padding: "14px", fontSize: "14px", cursor: "pointer", textAlign: "center", ...F, marginBottom: "10px" }}>
        Take or Upload Photo
        <input type="file" accept="image/*" capture="user" onChange={handleFileSelect} style={{ display: "none" }} />
      </label>

      <button onClick={onDismiss} style={{ width: "100%", background: "transparent", color: "#aaa", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px", fontSize: "12px", cursor: "pointer", ...F }}>
        Remind me later
      </button>

      {photos && photos.length > 0 && (
        <div style={{ marginTop: "16px", fontSize: "10px", color: "#aaa", textAlign: "center" }}>
          Last photo: {formatDate(photos[photos.length - 1].date)}
        </div>
      )}
    </div>
  );
}
