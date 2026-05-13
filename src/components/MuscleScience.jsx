import { useState } from "react";
import { muscleGroups, exerciseDatabase } from "../muscleScience";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Simple SVG body diagram — front view with tappable regions
function BodyDiagram({ onSelect, selectedGroup }) {
  const regions = [
    { id: "chest", label: "Chest", path: "M 88,58 L 112,58 L 115,80 L 85,80 Z", cx: 100, cy: 69 },
    { id: "shoulders", label: "Shoulders", cx: 100, cy: 48, isCircles: true },
    { id: "back", label: "Back", path: "M 88,58 L 112,58 L 115,80 L 85,80 Z", cx: 100, cy: 69, backSide: true },
    { id: "triceps", label: "Triceps", cx: 100, cy: 78, isArms: true },
    { id: "biceps", label: "Biceps", cx: 100, cy: 72, isArms: true },
    { id: "core", label: "Core", path: "M 88,80 L 112,80 L 110,105 L 90,105 Z", cx: 100, cy: 92 },
    { id: "quads", label: "Quads", path: "M 90,110 L 100,110 L 98,145 L 88,145 Z", cx: 94, cy: 127 },
    { id: "hamstrings", label: "Hams", path: "M 100,110 L 110,110 L 112,145 L 102,145 Z", cx: 106, cy: 127 },
    { id: "glutes", label: "Glutes", path: "M 88,105 L 112,105 L 112,115 L 88,115 Z", cx: 100, cy: 110 },
    { id: "calves", label: "Calves", cx: 100, cy: 158, isCalves: true },
  ];

  return (
    <svg viewBox="0 0 200 200" style={{ width: "100%", maxWidth: "200px", margin: "0 auto", display: "block" }}>
      {/* Body silhouette */}
      <g fill="#f0ede8" stroke="#ddd" strokeWidth="0.5">
        {/* Head */}
        <circle cx="100" cy="28" r="16" />
        {/* Neck */}
        <rect x="94" y="43" width="12" height="8" rx="2" />
        {/* Torso */}
        <rect x="82" y="51" width="36" height="62" rx="4" />
        {/* Left arm */}
        <rect x="62" y="53" width="18" height="52" rx="6" />
        {/* Right arm */}
        <rect x="120" y="53" width="18" height="52" rx="6" />
        {/* Left forearm */}
        <rect x="58" y="107" width="15" height="40" rx="6" />
        {/* Right forearm */}
        <rect x="127" y="107" width="15" height="40" rx="6" />
        {/* Left leg */}
        <rect x="84" y="113" width="16" height="50" rx="6" />
        {/* Right leg */}
        <rect x="100" y="113" width="16" height="50" rx="6" />
        {/* Left calf */}
        <rect x="84" y="164" width="14" height="30" rx="5" />
        {/* Right calf */}
        <rect x="102" y="164" width="14" height="30" rx="5" />
      </g>

      {/* Interactive regions */}
      {/* Chest */}
      <rect x="84" y="54" width="32" height="24" rx="2" fill={selectedGroup === "chest" ? "#2563a8" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "chest" ? "#2563a8" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("chest")} />
      <text x="100" y="68" textAnchor="middle" fontSize="6" fill={selectedGroup === "chest" ? "#2563a8" : "#888"} style={{ cursor: "pointer", pointerEvents: "none" }}>Chest</text>

      {/* Shoulders */}
      <circle cx="72" cy="60" r="9" fill={selectedGroup === "shoulders" ? "#7a3aa0" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "shoulders" ? "#7a3aa0" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("shoulders")} />
      <circle cx="128" cy="60" r="9" fill={selectedGroup === "shoulders" ? "#7a3aa0" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "shoulders" ? "#7a3aa0" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("shoulders")} />
      <text x="63" y="74" textAnchor="middle" fontSize="5.5" fill={selectedGroup === "shoulders" ? "#7a3aa0" : "#888"} style={{ pointerEvents: "none" }}>Shoulders</text>

      {/* Biceps */}
      <rect x="63" y="58" width="15" height="22" rx="4" fill={selectedGroup === "biceps" ? "#2d7a1e" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "biceps" ? "#2d7a1e" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("biceps")} />
      <rect x="122" y="58" width="15" height="22" rx="4" fill={selectedGroup === "biceps" ? "#2d7a1e" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "biceps" ? "#2d7a1e" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("biceps")} />
      <text x="70" y="72" textAnchor="middle" fontSize="5" fill={selectedGroup === "biceps" ? "#2d7a1e" : "#888"} style={{ pointerEvents: "none" }}>Bi</text>

      {/* Triceps (back of arm — shown as outline) */}
      <rect x="63" y="80" width="15" height="22" rx="4" fill={selectedGroup === "triceps" ? "#2563a8" : "transparent"} fillOpacity="0.25" stroke={selectedGroup === "triceps" ? "#2563a8" : "transparent"} strokeWidth="1.5" strokeDasharray="2,2" style={{ cursor: "pointer" }} onClick={() => onSelect("triceps")} />
      <rect x="122" y="80" width="15" height="22" rx="4" fill={selectedGroup === "triceps" ? "#2563a8" : "transparent"} fillOpacity="0.25" stroke={selectedGroup === "triceps" ? "#2563a8" : "transparent"} strokeWidth="1.5" strokeDasharray="2,2" style={{ cursor: "pointer" }} onClick={() => onSelect("triceps")} />
      <text x="70" y="93" textAnchor="middle" fontSize="5" fill={selectedGroup === "triceps" ? "#2563a8" : "#888"} style={{ pointerEvents: "none" }}>Tri</text>

      {/* Core */}
      <rect x="85" y="78" width="30" height="30" rx="2" fill={selectedGroup === "core" ? "#147a50" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "core" ? "#147a50" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("core")} />
      <text x="100" y="96" textAnchor="middle" fontSize="6" fill={selectedGroup === "core" ? "#147a50" : "#888"} style={{ cursor: "pointer", pointerEvents: "none" }}>Core</text>

      {/* Back (dashed — behind) */}
      <rect x="84" y="54" width="32" height="54" rx="2" fill={selectedGroup === "back" ? "#2d7a1e" : "transparent"} fillOpacity="0.15" stroke={selectedGroup === "back" ? "#2d7a1e" : "transparent"} strokeWidth="1.5" strokeDasharray="3,2" style={{ cursor: "pointer" }} onClick={() => onSelect("back")} />
      <text x="100" y="83" textAnchor="middle" fontSize="5.5" fill={selectedGroup === "back" ? "#2d7a1e" : "#999"} style={{ pointerEvents: "none" }}>Back ↩</text>

      {/* Glutes */}
      <rect x="84" y="109" width="32" height="14" rx="2" fill={selectedGroup === "glutes" ? "#a02a2a" : "transparent"} fillOpacity="0.3" stroke={selectedGroup === "glutes" ? "#a02a2a" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("glutes")} />
      <text x="100" y="119" textAnchor="middle" fontSize="5.5" fill={selectedGroup === "glutes" ? "#a02a2a" : "#888"} style={{ cursor: "pointer", pointerEvents: "none" }}>Glutes</text>

      {/* Quads */}
      <rect x="85" y="123" width="14" height="36" rx="4" fill={selectedGroup === "quads" ? "#c47a0a" : "transparent"} fillOpacity="0.35" stroke={selectedGroup === "quads" ? "#c47a0a" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("quads")} />
      <rect x="101" y="123" width="14" height="36" rx="4" fill={selectedGroup === "quads" ? "#c47a0a" : "transparent"} fillOpacity="0.35" stroke={selectedGroup === "quads" ? "#c47a0a" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("quads")} />
      <text x="92" y="143" textAnchor="middle" fontSize="5.5" fill={selectedGroup === "quads" ? "#c47a0a" : "#888"} style={{ pointerEvents: "none" }}>Quads</text>

      {/* Hamstrings (behind quads — dashed) */}
      <rect x="85" y="123" width="30" height="36" rx="4" fill="transparent" stroke={selectedGroup === "hamstrings" ? "#c47a0a" : "transparent"} strokeWidth="1.5" strokeDasharray="2,2" style={{ cursor: "pointer" }} onClick={() => onSelect("hamstrings")} />
      <text x="108" y="155" textAnchor="middle" fontSize="5" fill={selectedGroup === "hamstrings" ? "#c47a0a" : "#999"} style={{ pointerEvents: "none" }}>Hams↩</text>

      {/* Calves */}
      <rect x="85" y="161" width="12" height="26" rx="4" fill={selectedGroup === "calves" ? "#c47a0a" : "transparent"} fillOpacity="0.35" stroke={selectedGroup === "calves" ? "#c47a0a" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("calves")} />
      <rect x="103" y="161" width="12" height="26" rx="4" fill={selectedGroup === "calves" ? "#c47a0a" : "transparent"} fillOpacity="0.35" stroke={selectedGroup === "calves" ? "#c47a0a" : "transparent"} strokeWidth="1.5" style={{ cursor: "pointer" }} onClick={() => onSelect("calves")} />
      <text x="100" y="179" textAnchor="middle" fontSize="5.5" fill={selectedGroup === "calves" ? "#c47a0a" : "#888"} style={{ pointerEvents: "none" }}>Calves</text>
    </svg>
  );
}

export default function MuscleScience() {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [dbFilter, setDbFilter] = useState("all");
  const [dbView, setDbView] = useState("groups"); // groups | database | search
  const [searchQuery, setSearchQuery] = useState("");

  const group = muscleGroups.find(g => g.id === selectedGroup);

  // Exercises for selected group
  const groupExercises = selectedGroup
    ? exerciseDatabase.filter(e => e.primaryGroup === selectedGroup || e.secondaryGroups?.includes(selectedGroup))
    : [];

  // Database filtered
  const filteredExercises = exerciseDatabase.filter(ex => {
    const matchesFilter = dbFilter === "all" || ex.primaryGroup === dbFilter;
    const matchesSearch = !searchQuery || ex.name.toLowerCase().includes(searchQuery.toLowerCase()) || ex.primaryGroup.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (dbView === "database") {
    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
          <button onClick={() => setDbView("groups")} style={{ background: "none", border: "none", color: "#555", fontSize: "13px", cursor: "pointer", ...F }}>←</button>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>Exercise Database</div>
        </div>

        {/* Search */}
        <input
          type="text" placeholder="Search exercises..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #e0e0e0", fontSize: "13px", marginBottom: "10px", ...F }}
        />

        {/* Filter by muscle group */}
        <div style={{ display: "flex", gap: "5px", overflowX: "auto", paddingBottom: "4px", marginBottom: "12px" }}>
          {["all", ...muscleGroups.map(g => g.id)].map(f => (
            <button key={f} onClick={() => setDbFilter(f)} style={{
              flex: "0 0 auto", background: dbFilter === f ? "#111" : "#fff",
              color: dbFilter === f ? "#fff" : "#555",
              border: "1px solid #e0e0e0", borderRadius: "20px",
              padding: "4px 12px", fontSize: "11px", cursor: "pointer", ...F,
              whiteSpace: "nowrap",
            }}>
              {f === "all" ? "All" : muscleGroups.find(g => g.id === f)?.name || f}
            </button>
          ))}
        </div>

        <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "10px" }}>{filteredExercises.length} exercises</div>

        {filteredExercises.map((ex, i) => {
          const mg = muscleGroups.find(g => g.id === ex.primaryGroup);
          const region = mg?.regions?.find(r => r.name === ex.primaryRegion);
          return (
            <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "12px 14px", marginBottom: "7px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>{ex.name}</div>
                <span style={{ fontSize: "9px", background: mg?.color || "#f5f5f5", color: mg?.accent || "#555", padding: "2px 7px", borderRadius: "20px", border: `1px solid ${mg?.accent || "#ddd"}44`, whiteSpace: "nowrap" }}>
                  {mg?.emoji} {mg?.name}
                </span>
              </div>
              <div style={{ fontSize: "11px", color: "#777", marginBottom: "5px" }}>
                Primary: {ex.primaryRegion}
              </div>
              {ex.secondaryGroups?.length > 0 && (
                <div style={{ fontSize: "10px", color: "#aaa" }}>
                  Also works: {ex.secondaryGroups.map(sg => muscleGroups.find(g => g.id === sg)?.name).join(", ")}
                </div>
              )}
              <div style={{ display: "flex", gap: "5px", marginTop: "6px" }}>
                <span style={{ fontSize: "9px", background: "#f5f5f5", color: "#777", padding: "2px 7px", borderRadius: "20px" }}>{ex.category}</span>
                <span style={{ fontSize: "9px", background: "#f5f5f5", color: "#777", padding: "2px 7px", borderRadius: "20px" }}>{ex.difficulty}</span>
              </div>
              {region?.scienceNote && (
                <div style={{ marginTop: "8px", fontSize: "10px", color: "#666", lineHeight: "1.55", background: "#f9f9f7", borderRadius: "5px", padding: "7px 9px" }}>
                  {region.scienceNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Detail view for a selected muscle group
  if (selectedGroup && group) {
    return (
      <div style={{ padding: "16px 16px 40px" }}>
        <button onClick={() => { setSelectedGroup(null); setExpandedRegion(null); }} style={{ background: "none", border: "none", color: group.accent, fontSize: "13px", cursor: "pointer", marginBottom: "12px", ...F }}>
          ← All Muscle Groups
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "28px" }}>{group.emoji}</span>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "normal" }}>{group.name}</div>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.65", marginBottom: "14px", padding: "10px 12px", background: group.color, borderRadius: "7px", borderLeft: `3px solid ${group.accent}` }}>
          {group.summary}
        </div>

        {/* Regions */}
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>Anatomy</div>
        {group.regions.map((region, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", marginBottom: "7px", overflow: "hidden" }}>
            <button
              onClick={() => setExpandedRegion(expandedRegion === i ? null : i)}
              style={{ width: "100%", background: "transparent", border: "none", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", ...F, textAlign: "left" }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: group.accent }}>{region.name}</div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "2px" }}>
                  {region.bestExercises.slice(0, 2).join(" · ")}
                </div>
              </div>
              <span style={{ color: "#ccc", fontSize: "12px" }}>{expandedRegion === i ? "▲" : "▼"}</span>
            </button>
            {expandedRegion === i && (
              <div style={{ padding: "0 14px 14px", borderTop: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: "11px", color: "#444", lineHeight: "1.65", marginBottom: "10px", paddingTop: "10px" }}>
                  {region.role}
                </div>
                <div style={{ fontSize: "10px", color: "#555", lineHeight: "1.6", background: "#f9f9f7", borderRadius: "5px", padding: "8px 10px", marginBottom: "8px" }}>
                  <strong style={{ color: group.accent }}>Research note: </strong>{region.scienceNote}
                </div>
                <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#aaa", marginBottom: "5px" }}>Best exercises</div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                  {region.bestExercises.map((ex, ei) => (
                    <span key={ei} style={{ fontSize: "10px", background: group.color, color: group.accent, padding: "3px 9px", borderRadius: "20px", border: `1px solid ${group.accent}33` }}>{ex}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Weekly strategy */}
        <div style={{ background: "#111", borderRadius: "7px", padding: "12px 14px", marginBottom: "14px" }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: "6px" }}>In Your Plan</div>
          <div style={{ fontSize: "11px", color: "#bbb", lineHeight: "1.65" }}>{group.weeklyStrategy}</div>
        </div>

        {/* Exercises for this group */}
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>
          All Exercises ({groupExercises.length})
        </div>
        {groupExercises.map((ex, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "7px", padding: "10px 13px", marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
              <span style={{ fontSize: "12px", fontWeight: "600" }}>{ex.name}</span>
              <span style={{ fontSize: "9px", background: ex.primaryGroup === selectedGroup ? group.color : "#f5f5f5", color: ex.primaryGroup === selectedGroup ? group.accent : "#888", padding: "2px 7px", borderRadius: "20px" }}>
                {ex.primaryGroup === selectedGroup ? "Primary" : "Secondary"}
              </span>
            </div>
            <div style={{ fontSize: "10px", color: "#aaa" }}>{ex.primaryRegion} · {ex.category}</div>
          </div>
        ))}

        {/* Alternatives */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "8px" }}>Alternative Exercises</div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {group.alternatives.map((alt, i) => (
              <span key={i} style={{ fontSize: "11px", background: "#f5f5f3", color: "#555", padding: "5px 11px", borderRadius: "20px", border: "1px solid #e8e8e8" }}>{alt}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main overview — grid of muscle groups with body diagram
  return (
    <div style={{ padding: "16px 16px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "2px" }}>Muscle Science</div>
          <div style={{ fontSize: "16px", fontWeight: "normal" }}>Anatomy and Training</div>
        </div>
        <button
          onClick={() => setDbView("database")}
          style={{ background: "#f5f5f3", color: "#555", border: "1px solid #e0e0e0", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}
        >
          Exercise DB
        </button>
      </div>

      {/* Body diagram */}
      <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", color: "#aaa", textAlign: "center", marginBottom: "8px" }}>Tap a muscle group to explore</div>
        <BodyDiagram onSelect={setSelectedGroup} selectedGroup={selectedGroup} />
        {!selectedGroup && (
          <div style={{ fontSize: "10px", color: "#bbb", textAlign: "center", marginTop: "8px" }}>
            Dashed outlines are muscles on the back of the body
          </div>
        )}
      </div>

      {/* Muscle group cards */}
      <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#999", marginBottom: "10px" }}>All Muscle Groups</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {muscleGroups.map(group => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
            style={{
              background: "#fff", border: `1px solid #e8e8e8`,
              borderRadius: "8px", padding: "12px", textAlign: "left",
              cursor: "pointer", ...F,
            }}
          >
            <div style={{ fontSize: "22px", marginBottom: "4px" }}>{group.emoji}</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: group.accent, marginBottom: "2px" }}>{group.name}</div>
            <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "5px" }}>
              {group.regions.length} region{group.regions.length !== 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {group.regions.slice(0, 2).map((r, i) => (
                <span key={i} style={{ fontSize: "8px", background: group.color, color: group.accent, padding: "1px 5px", borderRadius: "10px" }}>
                  {r.name.split(" ")[0]}
                </span>
              ))}
              {group.regions.length > 2 && (
                <span style={{ fontSize: "8px", color: "#aaa" }}>+{group.regions.length - 2}</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Quick science note */}
      <div style={{ marginTop: "16px", padding: "12px 14px", background: "#111", borderRadius: "7px", color: "#f7f6f3" }}>
        <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#555", marginBottom: "6px" }}>How to use this</div>
        <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.7" }}>
          Tap any muscle group to see its anatomy, which regions need what exercises, why each exercise was chosen, and alternatives if equipment isn't available. The Exercise Database lets you search by muscle group or exercise name.
        </div>
      </div>
    </div>
  );
}
