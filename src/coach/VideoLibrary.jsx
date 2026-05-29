import { useState, useEffect, useRef } from "react";
import { uploadExerciseVideo, getExerciseVideos, setExerciseVideoUrl } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// All exercises from Tara and Skyler's programs that might need videos
const EXERCISE_LIST = [
  // Glutes / posterior chain
  "Hip Thrust (Barbell or Machine)", "Romanian Deadlift (Dumbbell)", "Bulgarian Split Squat (Dumbbell)",
  "Sumo Squat (Dumbbell or Barbell)", "Hip Abduction (Machine)", "Banded Clamshell",
  "Nordic Hamstring Curl", "Leg Press", "Single-Leg Press",
  // Back
  "Lat Pulldown (Wide Overhand)", "Chest-Supported Row (Machine or Dumbbell)",
  "Cable Row (Neutral Grip)", "Pull-Up (or Assisted)", "Face Pull (Cable)",
  // Shoulders
  "Seated Dumbbell Overhead Press", "Lateral Raise (Dumbbell or Cable)",
  "Rear Delt Fly (Machine or Cable)",
  // Chest
  "Dumbbell Bench Press", "Incline Dumbbell Press", "Cable Fly (Low to High)",
  // Arms
  "Overhead Tricep Extension (Cable)", "Tricep Rope Pushdown", "Incline Dumbbell Curl",
  "Cable Curl (EZ Bar)", "Hammer Curl",
  // Core
  "Dead Bug", "Bird Dog", "Bicycle Crunch", "Hanging Knee Raise", "Cable Crunch",
  // Cardio
  "StairMaster",
].sort();

export default function VideoLibrary({ coachId }) {
  const [videos, setVideos] = useState({}); // { exerciseName: url }
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | with_video | no_video
  const [editUrl, setEditUrl] = useState(null); // { name, url }
  const fileRef = useRef();
  const [targetExercise, setTargetExercise] = useState(null);

  useEffect(() => { loadVideos(); }, []);

  async function loadVideos() {
    setLoading(true);
    const { data } = await getExerciseVideos();
    setVideos(data || {});
    setLoading(false);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !targetExercise) return;
    fileRef.current.value = "";

    setUploading(targetExercise);
    const { url, error } = await uploadExerciseVideo(targetExercise, file);
    if (!error && url) {
      setVideos(prev => ({ ...prev, [targetExercise]: url }));
    } else {
      alert("Upload failed: " + (error?.message || "unknown error"));
    }
    setUploading(null);
    setTargetExercise(null);
  }

  async function handleSaveUrl() {
    if (!editUrl?.name || !editUrl?.url) return;
    const { error } = await setExerciseVideoUrl(editUrl.name, editUrl.url);
    if (!error) {
      setVideos(prev => ({ ...prev, [editUrl.name]: editUrl.url }));
      setEditUrl(null);
    }
  }

  async function handleRemove(name) {
    if (!window.confirm(`Remove video for ${name}?`)) return;
    await setExerciseVideoUrl(name, null);
    setVideos(prev => { const n = { ...prev }; delete n[name]; return n; });
  }

  const withVideo = EXERCISE_LIST.filter(e => videos[e]);
  const withoutVideo = EXERCISE_LIST.filter(e => !videos[e]);

  const filtered = EXERCISE_LIST.filter(e => {
    const matchSearch = !search || e.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "with_video" && videos[e]) || (filter === "no_video" && !videos[e]);
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Exercise Video Library</div>
        <div style={{ fontSize: "11px", color: "#aaa" }}>
          {withVideo.length}/{EXERCISE_LIST.length} have videos
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: "3px", background: "#f0f0f0", borderRadius: "2px", marginBottom: "14px" }}>
        <div style={{ height: "100%", width: `${(withVideo.length / EXERCISE_LIST.length) * 100}%`, background: "#2d7a1e", borderRadius: "2px", transition: "width 0.4s" }} />
      </div>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..."
          style={{ flex: 1, padding: "8px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "12px" }}
        />
        {[["all","All"],["no_video","Missing"],["with_video","Done"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            padding: "7px 10px", borderRadius: "7px", fontSize: "10px", cursor: "pointer",
            background: filter === v ? "#111" : "transparent",
            color: filter === v ? "#fff" : "#aaa",
            border: `1px solid ${filter === v ? "#111" : "#e4e0db"}`,
          }}>{l}</button>
        ))}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="video/*" onChange={handleUpload} style={{ display: "none" }} />

      {/* Exercise list */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#bbb", fontSize: "12px", padding: "20px" }}>Loading...</div>
      ) : (
        filtered.map(name => {
          const hasVideo = !!videos[name];
          const isUploading = uploading === name;
          return (
            <div key={name} style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "11px 14px", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Status dot */}
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: hasVideo ? "#2d7a1e" : "#e4e0db", flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#111" }}>{name}</div>
                  {hasVideo && (
                    <div style={{ fontSize: "10px", color: "#bbb", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {videos[name]}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                  {/* Upload button */}
                  <button
                    onClick={() => { setTargetExercise(name); fileRef.current.click(); }}
                    disabled={isUploading}
                    style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", background: "#1a1a1a", color: "#fff", border: "none" }}
                  >
                    {isUploading ? "Uploading..." : hasVideo ? "Replace" : "Upload"}
                  </button>

                  {/* Paste URL button */}
                  <button
                    onClick={() => setEditUrl({ name, url: videos[name] || "" })}
                    style={{ padding: "5px 10px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", background: "transparent", color: "#aaa", border: "1px solid #e4e0db" }}
                  >
                    URL
                  </button>

                  {/* Remove */}
                  {hasVideo && (
                    <button
                      onClick={() => handleRemove(name)}
                      style={{ padding: "5px 8px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", background: "transparent", color: "#ccc", border: "1px solid #e4e0db" }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Video preview */}
              {hasVideo && (
                <div style={{ marginTop: "8px", borderRadius: "6px", overflow: "hidden", background: "#000" }}>
                  <video src={videos[name]} controls muted style={{ width: "100%", maxHeight: "140px", objectFit: "cover", display: "block" }} />
                </div>
              )}
            </div>
          );
        })
      )}

      {/* URL edit modal */}
      {editUrl && (
        <div onClick={e => { if (e.target === e.currentTarget) setEditUrl(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", width: "100%", maxWidth: "400px" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "4px" }}>{editUrl.name}</div>
            <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "12px" }}>Paste a direct video URL (MP4, WebM, or Supabase storage URL)</div>
            <input
              value={editUrl.url}
              onChange={e => setEditUrl(p => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
              style={{ width: "100%", padding: "9px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "12px", boxSizing: "border-box", marginBottom: "10px" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => setEditUrl(null)} style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "1px solid #e4e0db", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
              <button onClick={handleSaveUrl} style={{ flex: 1, padding: "10px", borderRadius: "7px", border: "none", background: "#111", color: "#fff", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
