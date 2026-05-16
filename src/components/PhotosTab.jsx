import { useState, useRef } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const POSES = [
  {
    id: "front",
    label: "Front",
    instruction: "Face the camera straight on. Feet hip-width apart, arms slightly away from your sides. Neutral expression, chin level.",
    tip: "Same spot, same lighting every time.",
  },
  {
    id: "side",
    label: "Side",
    instruction: "Turn 90 degrees. Arms down at your sides. Stand tall with shoulders back.",
    tip: "Left side is standard, but pick one and stay consistent.",
  },
  {
    id: "back",
    label: "Back",
    instruction: "Turn around completely. Feet hip-width, arms slightly away from your sides.",
    tip: "This is where glute and back development shows up most clearly.",
  },
];

const WEAR_GUIDE = "Form-fitting clothing works best — shorts and a sports bra, or compression gear. Avoid baggy clothes. Same outfit each month if possible.";
const LIGHTING_GUIDE = "Natural light or overhead lighting. Avoid strong backlighting. Same room, same time of day.";

function getMonthKey(date) {
  return (date || new Date()).toISOString().slice(0, 7);
}

function loadPhotos() {
  try { return JSON.parse(localStorage.getItem("progress_photos_v2") || "{}"); } catch { return {}; }
}

function savePhotos(d) {
  try { localStorage.setItem("progress_photos_v2", JSON.stringify(d)); } catch {}
}

function loadScans() {
  try { return JSON.parse(localStorage.getItem("body_scans_v1") || "[]"); } catch { return []; }
}

function saveScans(d) {
  try { localStorage.setItem("body_scans_v1", JSON.stringify(d)); } catch {}
}

// ── Body scan upload + AI extraction ─────────────────────────────────────────
function BodyScanUpload() {
  const [scans, setScans] = useState(loadScans);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });

    const mediaType = file.type || "image/jpeg";

    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You extract body composition data from InBody, DEXA, or similar scan documents. 
Return ONLY valid JSON with this exact structure, no other text:
{
  "weight_lbs": number or null,
  "body_fat_pct": number or null,
  "lean_mass_lbs": number or null,
  "fat_mass_lbs": number or null,
  "bmr_kcal": number or null,
  "visceral_fat": number or null,
  "scan_type": "InBody" or "DEXA" or "Other",
  "scan_date": "YYYY-MM-DD" or null,
  "notes": "any important observations in one plain sentence, or null"
}
If a value is not present, use null. Extract numbers only, no units in the JSON values.`,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: "Extract all body composition metrics from this scan." }
            ]
          }]
        })
      });

      const data = await resp.json();
      const raw = data.content?.[0]?.text || "{}";
      let parsed = {};
      try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); } catch {}

      const entry = {
        id: Date.now(),
        date: parsed.scan_date || new Date().toISOString().slice(0, 10),
        scan_type: parsed.scan_type || "Scan",
        metrics: parsed,
        imageData: `data:${mediaType};base64,${base64}`,
        uploadedAt: new Date().toISOString(),
      };

      const updated = [entry, ...scans];
      setScans(updated);
      saveScans(updated);
    } catch (err) {
      console.error("Scan extraction failed:", err);
    }

    setUploading(false);
    fileRef.current.value = "";
  }

  const METRIC_LABELS = {
    weight_lbs: { label: "Body Weight", unit: "lbs", explain: "Total body weight including muscle, fat, bone, and water." },
    body_fat_pct: { label: "Body Fat", unit: "%", explain: "Percentage of total weight that is fat tissue. Healthy range for active women is roughly 18–28%." },
    lean_mass_lbs: { label: "Lean Mass", unit: "lbs", explain: "Everything that is not fat — muscle, bone, organs, water. This is what training builds." },
    fat_mass_lbs: { label: "Fat Mass", unit: "lbs", explain: "Total weight of fat tissue in the body." },
    bmr_kcal: { label: "Resting Metabolic Rate", unit: "kcal", explain: "Calories your body burns at rest. Higher lean mass means a higher BMR." },
    visceral_fat: { label: "Visceral Fat Rating", unit: "", explain: "Fat stored around internal organs. A rating under 10 is considered healthy for most people." },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999" }}>Body Scans</div>
        <button onClick={() => fileRef.current.click()} disabled={uploading}
          style={{ background: "#1a1a1a", color: "#f7f6f3", border: "none", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
          {uploading ? "Reading scan..." : "+ Upload scan"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: "none" }} />
      </div>

      <div style={{ background: "#fef3e4", border: "1px solid #f0c060", borderRadius: "7px", padding: "10px 12px", marginBottom: "12px", fontSize: "11px", color: "#7a5010", lineHeight: "1.6" }}>
        Scan numbers reflect general trends over time. InBody and similar devices can vary by 3 to 5% based on hydration, recent food intake, and time of day. Use them directionally, not as exact measurements. Research supports this caution — a 2014 study in the European Journal of Clinical Nutrition found BIA accuracy varies significantly with hydration status.
      </div>

      {scans.length === 0 && !uploading && (
        <div style={{ textAlign: "center", padding: "24px", color: "#bbb", ...F }}>
          <div style={{ fontSize: "13px", marginBottom: "4px" }}>No scans uploaded yet</div>
          <div style={{ fontSize: "11px" }}>Upload a photo of your InBody or DEXA printout and the app will extract all the numbers automatically.</div>
        </div>
      )}

      {scans.map((scan, si) => (
        <div key={scan.id} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", marginBottom: "8px", overflow: "hidden" }}>
          <button onClick={() => setExpanded(expanded === si ? null : si)}
            style={{ width: "100%", background: "none", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" }}>
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600" }}>{scan.scan_type} · {scan.date}</div>
              {scan.metrics?.body_fat_pct && (
                <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                  {scan.metrics.body_fat_pct}% body fat · {scan.metrics.lean_mass_lbs ? `${scan.metrics.lean_mass_lbs} lbs lean mass` : ""}
                </div>
              )}
            </div>
            <span style={{ color: "#ccc", fontSize: "11px" }}>{expanded === si ? "▲" : "▼"}</span>
          </button>

          {expanded === si && (
            <div style={{ padding: "0 14px 14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "12px" }}>
                {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                  const val = scan.metrics?.[key];
                  if (val == null) return null;
                  return (
                    <div key={key} style={{ background: "#f9f9f7", borderRadius: "6px", padding: "9px 10px" }}>
                      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "2px" }}>{meta.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#1a1a1a" }}>{val}{meta.unit}</div>
                      <div style={{ fontSize: "10px", color: "#888", marginTop: "3px", lineHeight: "1.4" }}>{meta.explain}</div>
                    </div>
                  );
                })}
              </div>
              {scan.metrics?.notes && (
                <div style={{ fontSize: "11px", color: "#777", fontStyle: "italic", marginBottom: "10px", lineHeight: "1.5" }}>{scan.metrics.notes}</div>
              )}
              <button onClick={() => { const u = scans.filter(s => s.id !== scan.id); setScans(u); saveScans(u); }}
                style={{ background: "none", border: "none", color: "#e0e0e0", fontSize: "11px", cursor: "pointer" }}>Remove</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Pose upload slot ──────────────────────────────────────────────────────────
function PoseSlot({ pose, image, onUpload, onRemove }) {
  const fileRef = useRef();

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => onUpload(r.result);
    r.readAsDataURL(file);
    fileRef.current.value = "";
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.12em", color: "#888", marginBottom: "5px", textAlign: "center" }}>{pose.label}</div>
      {image ? (
        <div style={{ position: "relative" }}>
          <img src={image} alt={pose.label} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "6px", display: "block" }} />
          <button onClick={onRemove} style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "13px", lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <button onClick={() => fileRef.current.click()}
          style={{ width: "100%", aspectRatio: "3/4", background: "#f5f5f3", border: "2px dashed #ddd", borderRadius: "6px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ccc" strokeWidth="1.5"><path d="M12 16V8m0 0-3 3m3-3 3 3"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          <span style={{ fontSize: "9px", color: "#bbb" }}>Add photo</span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PhotosTab() {
  const [photos, setPhotos] = useState(loadPhotos);
  const [view, setView] = useState("current"); // current | history | compare | scan | guide
  const [compareMonths, setCompareMonths] = useState([]);

  const currentKey = getMonthKey();
  const currentEntry = photos[currentKey] || {};

  function updateCurrentPose(poseId, dataUrl) {
    const updated = { ...photos, [currentKey]: { ...currentEntry, [poseId]: dataUrl, date: currentKey } };
    setPhotos(updated);
    savePhotos(updated);
  }

  function removePose(poseId) {
    const entry = { ...currentEntry };
    delete entry[poseId];
    const updated = { ...photos, [currentKey]: entry };
    setPhotos(updated);
    savePhotos(updated);
  }

  const allMonths = Object.keys(photos).sort((a, b) => b.localeCompare(a));
  const monthsWithPhotos = allMonths.filter(k => POSES.some(p => photos[k]?.[p.id]));

  function formatMonth(key) {
    return new Date(key + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  return (
    <div style={{ padding: "16px 16px 60px" }}>
      {/* Nav */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "18px", overflowX: "auto", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {[["current", "This Month"], ["history", "History"], ["compare", "Compare"], ["scan", "Body Scan"], ["guide", "Guide"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flexShrink: 0, padding: "6px 12px", border: "1px solid " + (view === v ? "#1a1a1a" : "#e0e0e0"),
            borderRadius: "20px", background: view === v ? "#1a1a1a" : "#fff",
            color: view === v ? "#f7f6f3" : "#777", cursor: "pointer", fontSize: "11px", ...F,
          }}>{label}</button>
        ))}
      </div>

      {/* ── Current month ── */}
      {view === "current" && (
        <>
          <div style={{ fontSize: "15px", ...F, marginBottom: "14px" }}>{formatMonth(currentKey)}</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
            {POSES.map(pose => (
              <PoseSlot key={pose.id} pose={pose} image={currentEntry[pose.id]}
                onUpload={url => updateCurrentPose(pose.id, url)}
                onRemove={() => removePose(pose.id)}
              />
            ))}
          </div>

          {/* Pose tips */}
          <div style={{ background: "#f9f9f7", borderRadius: "8px", padding: "12px 14px", marginBottom: "10px" }}>
            {POSES.map(pose => (
              <div key={pose.id} style={{ marginBottom: "8px", fontSize: "11px", lineHeight: "1.55" }}>
                <span style={{ fontWeight: "700", color: "#555" }}>{pose.label}: </span>
                <span style={{ color: "#777" }}>{pose.instruction}</span>
                {pose.tip && <span style={{ color: "#bbb", fontStyle: "italic" }}> {pose.tip}</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── History ── */}
      {view === "history" && (
        <>
          {monthsWithPhotos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#bbb", ...F }}>
              <div>No photos logged yet. Start with this month.</div>
            </div>
          ) : monthsWithPhotos.map(monthKey => {
            const entry = photos[monthKey];
            return (
              <div key={monthKey} style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#555" }}>{formatMonth(monthKey)}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {POSES.map(pose => entry[pose.id] ? (
                    <div key={pose.id} style={{ flex: 1 }}>
                      <img src={entry[pose.id]} alt={pose.label} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "6px" }} />
                      <div style={{ fontSize: "9px", color: "#bbb", textAlign: "center", marginTop: "3px" }}>{pose.label}</div>
                    </div>
                  ) : (
                    <div key={pose.id} style={{ flex: 1, aspectRatio: "3/4", background: "#f5f5f3", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "9px", color: "#ccc" }}>{pose.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ── Compare ── */}
      {view === "compare" && (
        <>
          <div style={{ fontSize: "11px", color: "#888", marginBottom: "12px", lineHeight: "1.5" }}>
            Select two months to compare side by side.
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            {monthsWithPhotos.map(k => {
              const sel = compareMonths.includes(k);
              return (
                <button key={k} onClick={() => {
                  if (sel) setCompareMonths(p => p.filter(m => m !== k));
                  else if (compareMonths.length < 2) setCompareMonths(p => [...p, k]);
                }} style={{
                  padding: "5px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer",
                  background: sel ? "#1a1a1a" : "#fff", color: sel ? "#f7f6f3" : "#555",
                  border: "1px solid " + (sel ? "#1a1a1a" : "#ddd"),
                }}>
                  {formatMonth(k)}
                </button>
              );
            })}
          </div>

          {compareMonths.length === 2 && (
            <div>
              {POSES.map(pose => {
                const imgA = photos[compareMonths[0]]?.[pose.id];
                const imgB = photos[compareMonths[1]]?.[pose.id];
                if (!imgA && !imgB) return null;
                return (
                  <div key={pose.id} style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: "6px" }}>{pose.label}</div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[compareMonths[0], compareMonths[1]].map(k => (
                        <div key={k} style={{ flex: 1 }}>
                          {photos[k]?.[pose.id] ? (
                            <img src={photos[k][pose.id]} alt={pose.label} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: "6px" }} />
                          ) : (
                            <div style={{ width: "100%", aspectRatio: "3/4", background: "#f5f5f3", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: "10px", color: "#ccc" }}>No photo</span>
                            </div>
                          )}
                          <div style={{ fontSize: "10px", color: "#aaa", textAlign: "center", marginTop: "3px" }}>{formatMonth(k)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {monthsWithPhotos.length < 2 && (
            <div style={{ color: "#bbb", fontSize: "12px", ...F, textAlign: "center", padding: "20px" }}>
              Log at least two months of photos to compare.
            </div>
          )}
        </>
      )}

      {/* ── Body scan ── */}
      {view === "scan" && <BodyScanUpload />}

      {/* ── Guide ── */}
      {view === "guide" && (
        <div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginBottom: "6px" }}>What to wear</div>
            <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.65" }}>{WEAR_GUIDE}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginBottom: "6px" }}>Lighting</div>
            <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.65" }}>{LIGHTING_GUIDE}</div>
          </div>
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#333", marginBottom: "8px" }}>Poses</div>
            {POSES.map(pose => (
              <div key={pose.id} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #f5f5f3" }}>
                <div style={{ fontSize: "11px", fontWeight: "600", color: "#444", marginBottom: "3px" }}>{pose.label}</div>
                <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.6" }}>{pose.instruction}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#f5f5f3", borderRadius: "7px", padding: "12px 14px" }}>
            <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.7" }}>
              Take photos on the same day each month. The scale can stay flat for weeks while your body is actively recomping. Photos and measurements tell the real story.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
