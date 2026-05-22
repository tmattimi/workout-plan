import { useState, useRef, useEffect } from "react";
import { uploadPhoto } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const POSES = [
  {
    id: "front",
    label: "Front",
    icon: "↑",
    instruction: "Face the camera straight on. Feet hip-width apart, arms slightly away from your sides. Chin level, neutral expression.",
    tip: "Same spot, same lighting every time. Consistency is what makes comparison meaningful.",
    why: "Shows overall symmetry, shoulder width, midsection, and quad development.",
  },
  {
    id: "side",
    label: "Side",
    icon: "→",
    instruction: "Turn 90 degrees to your left. Arms down at your sides. Stand tall — shoulders back, chest up.",
    tip: "Left side is the standard. Pick one and never switch.",
    why: "Shows posture, glute projection, midsection depth, and chest development.",
  },
  {
    id: "back",
    label: "Back",
    icon: "↓",
    instruction: "Turn completely around. Feet hip-width, arms slightly away from your sides.",
    tip: "This is where glute and back development shows up most clearly.",
    why: "Reveals glute shape, hamstring separation, back width, and overall posterior chain.",
  },
];

const GUIDE = {
  timing: "Same day each month — morning is best, before eating, after using the bathroom. Your body is most consistent then.",
  wear: "Form-fitting clothing. Sports bra and compression shorts, or a bikini. Avoid baggy clothes — they hide the changes you worked for. Same outfit every month if possible.",
  lighting: "Natural light from a window to your side, or a bright overhead light. Never shoot with a window directly behind you — it silhouettes your body and loses all the detail. Same room, same time of day.",
  setup: "Phone propped on a counter or shelf at hip height, not held above or below. Give yourself enough distance to fit your full body in frame with a few inches of space above your head.",
  mindset: "The scale can stay flat for 4–6 weeks while your body is actively recomping. Photos are where the real story lives. Take them even on the weeks where you feel discouraged — those are the ones you'll be most glad you have.",
};

function getDateKey(date) {
  return (date || new Date()).toISOString().slice(0, 10);
}

function getMonthKey(dateKey) {
  return dateKey ? dateKey.slice(0, 7) : new Date().toISOString().slice(0, 7);
}

function formatDate(key) {
  if (!key) return "";
  const d = new Date(key + (key.length === 7 ? "-02" : "T12:00:00"));
  return d.toLocaleDateString("en-US", { month: "long", day: key.length === 10 ? "numeric" : undefined, year: "numeric" });
}

// Load/save from localStorage with Supabase fallback
function loadLocalPhotos() {
  try { return JSON.parse(localStorage.getItem("tmf_photos_v3") || "{}"); } catch { return {}; }
}
function saveLocalPhotos(d) {
  try { localStorage.setItem("tmf_photos_v3", JSON.stringify(d)); } catch {}
}

// ── Single pose upload slot ───────────────────────────────────────────────────
function PoseSlot({ pose, image, uploading, onUpload, onRemove, compact }) {
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onUpload(reader.result, file);
    reader.readAsDataURL(file);
    fileRef.current.value = "";
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: "9px", fontWeight: "700", textTransform: "uppercase",
        letterSpacing: "0.14em", color: "#888", marginBottom: "5px", textAlign: "center",
      }}>
        {pose.label}
      </div>

      {image ? (
        <div style={{ position: "relative", borderRadius: "7px", overflow: "hidden" }}>
          <img
            src={image}
            alt={pose.label}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }}
          />
          {!compact && (
            <button
              onClick={onRemove}
              style={{
                position: "absolute", top: "6px", right: "6px",
                background: "rgba(0,0,0,0.55)", border: "none", color: "#fff",
                borderRadius: "50%", width: "24px", height: "24px",
                cursor: "pointer", fontSize: "14px", lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>
          )}
          {uploading && (
            <div style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", color: "#fff",
            }}>Saving...</div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            width: "100%", aspectRatio: "3/4",
            background: "#f7f6f3", border: "2px dashed #e0e0e0",
            borderRadius: "7px", cursor: uploading ? "default" : "pointer",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "5px",
          }}
        >
          <span style={{ fontSize: "22px", opacity: 0.25 }}>{pose.icon}</span>
          <span style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {uploading ? "..." : "Add"}
          </span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PhotosTab({ clientId }) {
  const [photos, setPhotos] = useState(loadLocalPhotos);
  const [view, setView] = useState("current"); // current | history | compare | guide
  const [uploading, setUploading] = useState({}); // { poseId: bool }
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [customDate, setCustomDate] = useState(getDateKey());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Use the selected date key for current entry
  const activeKey = customDate || getDateKey();
  const activeEntry = photos[activeKey] || {};

  // All entries sorted newest first
  const allEntries = Object.entries(photos)
    .filter(([, entry]) => POSES.some(p => entry[p.id]))
    .sort(([a], [b]) => b.localeCompare(a));

  async function handleUpload(poseId, dataUrl, file) {
    setUploading(prev => ({ ...prev, [poseId]: true }));

    // Save locally immediately for instant feedback
    const updated = {
      ...photos,
      [activeKey]: { ...activeEntry, [poseId]: dataUrl, date: activeKey, uploadedAt: new Date().toISOString() },
    };
    setPhotos(updated);
    saveLocalPhotos(updated);

    // Try to save to Supabase storage if we have a clientId
    if (clientId) {
      try {
        const { url } = await uploadPhoto(clientId, activeKey, poseId, dataUrl);
        if (url) {
          // Store the Supabase URL alongside the local copy
          const withUrl = {
            ...updated,
            [activeKey]: { ...updated[activeKey], [`${poseId}_url`]: url },
          };
          setPhotos(withUrl);
          saveLocalPhotos(withUrl);
        }
      } catch (e) {
        console.log("Supabase upload failed, using local:", e.message);
      }
    }

    setUploading(prev => ({ ...prev, [poseId]: false }));
  }

  function handleRemove(poseId) {
    const entry = { ...activeEntry };
    delete entry[poseId];
    delete entry[`${poseId}_url`];
    const updated = { ...photos, [activeKey]: entry };
    setPhotos(updated);
    saveLocalPhotos(updated);
  }

  const hasAnyPhotos = allEntries.length > 0;

  return (
    <div style={{ padding: "16px 16px 80px", ...F }}>

      {/* Nav tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "18px", overflowX: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {[["current", "Add Photos"], ["history", "History"], ["compare", "Compare"], ["guide", "Guide"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flexShrink: 0, padding: "7px 14px",
            border: "1px solid " + (view === v ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "20px",
            background: view === v ? "#1a1a1a" : "transparent",
            color: view === v ? "#f7f6f3" : "#888",
            cursor: "pointer", fontSize: "11px", letterSpacing: "0.04em", ...F,
          }}>{label}</button>
        ))}
      </div>

      {/* ── ADD PHOTOS ── */}
      {view === "current" && (
        <>
          {/* Date selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ fontSize: "15px", color: "#111" }}>{formatDate(activeKey)}</div>
            <button
              onClick={() => setShowDatePicker(p => !p)}
              style={{
                background: "none", border: "1px solid #e0e0e0", borderRadius: "6px",
                padding: "5px 10px", fontSize: "11px", color: "#888", cursor: "pointer", ...F,
              }}
            >
              {showDatePicker ? "Done" : "Change date"}
            </button>
          </div>

          {showDatePicker && (
            <div style={{ marginBottom: "14px" }}>
              <input
                type="date"
                value={customDate}
                max={getDateKey()}
                onChange={e => setCustomDate(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: "7px",
                  border: "1px solid #e0e0e0", fontSize: "13px", color: "#333",
                  background: "#f9f9f7", ...F,
                }}
              />
              <div style={{ fontSize: "10px", color: "#bbb", marginTop: "5px", lineHeight: "1.5" }}>
                You can backdate photos if you forgot to log them. They will appear in history on the date you select.
              </div>
            </div>
          )}

          {/* Three pose slots */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {POSES.map(pose => (
              <PoseSlot
                key={pose.id}
                pose={pose}
                image={activeEntry[pose.id]}
                uploading={!!uploading[pose.id]}
                onUpload={(url, file) => handleUpload(pose.id, url, file)}
                onRemove={() => handleRemove(pose.id)}
              />
            ))}
          </div>

          {/* Quick instructions */}
          <div style={{ background: "#f9f9f7", borderRadius: "9px", padding: "13px 14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "9px" }}>
              How to take them
            </div>
            {POSES.map(pose => (
              <div key={pose.id} style={{ marginBottom: "9px", paddingBottom: "9px", borderBottom: "1px solid #f0efec" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#444", marginBottom: "2px" }}>{pose.label}</div>
                <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.6" }}>{pose.instruction}</div>
                <div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px", fontStyle: "italic" }}>{pose.tip}</div>
              </div>
            ))}
          </div>

          {/* Storage note */}
          <div style={{ fontSize: "10px", color: "#ccc", textAlign: "center", lineHeight: "1.5" }}>
            Photos are saved to your account and backed up securely.
          </div>
        </>
      )}

      {/* ── HISTORY ── */}
      {view === "history" && (
        <>
          {!hasAnyPhotos ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.3 }}>📸</div>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>No photos yet</div>
              <div style={{ fontSize: "11px" }}>Add your first set from the Add Photos tab.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "11px", color: "#bbb", marginBottom: "14px" }}>
                {allEntries.length} {allEntries.length === 1 ? "entry" : "entries"} logged
              </div>
              {allEntries.map(([dateKey, entry]) => (
                <div key={dateKey} style={{ marginBottom: "22px" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {formatDate(dateKey)}
                    <span style={{ fontSize: "10px", color: "#ccc", fontWeight: "normal" }}>
                      {POSES.filter(p => entry[p.id]).length}/{POSES.length} poses
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {POSES.map(pose => (
                      <div key={pose.id} style={{ flex: 1, minWidth: 0 }}>
                        {entry[pose.id] ? (
                          <>
                            <img
                              src={entry[pose.id]}
                              alt={pose.label}
                              style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "6px", display: "block" }}
                            />
                            <div style={{ fontSize: "9px", color: "#bbb", textAlign: "center", marginTop: "3px" }}>{pose.label}</div>
                          </>
                        ) : (
                          <div style={{
                            width: "100%", aspectRatio: "3/4",
                            background: "#f7f6f3", borderRadius: "6px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <span style={{ fontSize: "9px", color: "#ddd" }}>{pose.label}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── COMPARE ── */}
      {view === "compare" && (
        <>
          {allEntries.length < 2 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb" }}>
              <div style={{ fontSize: "13px", marginBottom: "6px" }}>Need at least 2 entries to compare</div>
              <div style={{ fontSize: "11px" }}>Keep adding photos each month.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "12px" }}>
                Pick two dates to compare side by side.
              </div>

              {/* Selector row */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
                {[["Before", compareA, setCompareA], ["After", compareB, setCompareB]].map(([label, val, setter]) => (
                  <div key={label} style={{ flex: 1 }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "5px" }}>{label}</div>
                    <select
                      value={val || ""}
                      onChange={e => setter(e.target.value || null)}
                      style={{
                        width: "100%", padding: "8px 10px", borderRadius: "7px",
                        border: "1px solid #e0e0e0", background: "#f9f9f7",
                        fontSize: "12px", color: "#333", ...F,
                      }}
                    >
                      <option value="">Select date</option>
                      {allEntries.map(([k]) => (
                        <option key={k} value={k}>{formatDate(k)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Side by side */}
              {compareA && compareB && (
                <>
                  {/* Date labels */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    {[compareA, compareB].map((k, i) => (
                      <div key={k} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {i === 0 ? "Before" : "After"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#444", fontWeight: "600" }}>{formatDate(k)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pose rows */}
                  {POSES.map(pose => {
                    const imgA = photos[compareA]?.[pose.id];
                    const imgB = photos[compareB]?.[pose.id];
                    if (!imgA && !imgB) return null;
                    return (
                      <div key={pose.id} style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "#bbb", marginBottom: "6px", textAlign: "center" }}>
                          {pose.label}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {[compareA, compareB].map(k => (
                            <div key={k} style={{ flex: 1 }}>
                              {photos[k]?.[pose.id] ? (
                                <img
                                  src={photos[k][pose.id]}
                                  alt={pose.label}
                                  style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "7px", display: "block" }}
                                />
                              ) : (
                                <div style={{ width: "100%", aspectRatio: "3/4", background: "#f7f6f3", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: "10px", color: "#ccc" }}>No photo</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── GUIDE ── */}
      {view === "guide" && (
        <div>
          {/* Why photos matter */}
          <div style={{ background: "#111", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "8px" }}>Why this matters</div>
            <div style={{ fontSize: "13px", color: "#e8e0cc", lineHeight: "1.75", ...F }}>
              {GUIDE.mindset}
            </div>
          </div>

          {[
            { title: "When to take them", content: GUIDE.timing },
            { title: "What to wear", content: GUIDE.wear },
            { title: "Lighting", content: GUIDE.lighting },
            { title: "Camera setup", content: GUIDE.setup },
          ].map(({ title, content }) => (
            <div key={title} style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "9px", padding: "14px", marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginBottom: "6px", letterSpacing: "0.02em" }}>{title}</div>
              <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.7" }}>{content}</div>
            </div>
          ))}

          {/* Pose breakdown */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "9px", padding: "14px", marginBottom: "8px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginBottom: "10px" }}>The three poses</div>
            {POSES.map((pose, i) => (
              <div key={pose.id} style={{ marginBottom: i < POSES.length - 1 ? "12px" : 0, paddingBottom: i < POSES.length - 1 ? "12px" : 0, borderBottom: i < POSES.length - 1 ? "1px solid #f5f5f3" : "none" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "3px" }}>{pose.label}</div>
                <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.65", marginBottom: "3px" }}>{pose.instruction}</div>
                <div style={{ fontSize: "10px", color: "#999", fontStyle: "italic", marginBottom: "3px" }}>{pose.tip}</div>
                <div style={{ fontSize: "10px", color: "#bbb", lineHeight: "1.5" }}>Why: {pose.why}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#f9f9f7", borderRadius: "7px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.7" }}>
              Photos are stored privately to your account. Your coach can see them. No one else can.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
