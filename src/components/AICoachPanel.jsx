import { useState } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const ANALYSIS_TYPES = [
  { id: "overall", label: "Overall Assessment", prompt: "Give an overall assessment of this client's progress, consistency, and training quality. Be specific and actionable." },
  { id: "progression", label: "Strength Progression", prompt: "Analyze this client's strength progression across their exercises. Which lifts are progressing well? Which have stalled? Give specific recommendations." },
  { id: "consistency", label: "Consistency & Habits", prompt: "Analyze training consistency, session frequency, and workout completion patterns. What patterns do you see? What should change?" },
  { id: "body", label: "Body Composition", prompt: "Analyze body measurement and weight trends. What does the data suggest about body composition changes? What adjustments would you recommend?" },
  { id: "recovery", label: "Recovery & Volume", prompt: "Analyze training volume, session frequency, and recovery patterns. Is the client overtraining or undertraining? What adjustments are needed?" },
  { id: "program", label: "Program Adjustments", prompt: "Based on the client's logs, PRs, and check-ins, suggest specific program adjustments: exercises to add/remove, rep ranges to shift, volume changes needed." },
];

function formatClientDataForPrompt(overview, clientName) {
  const { recentLogs, measurements, prs, checkins } = overview;

  let prompt = `You are an expert personal trainer analyzing client data for ${clientName}. Be direct, specific, and actionable. Reference actual numbers from the data.\n\n`;

  // Recent training logs
  if (recentLogs && recentLogs.length > 0) {
    prompt += `RECENT TRAINING LOGS (last ${recentLogs.length} sets):\n`;
    const bySession = {};
    recentLogs.forEach(log => {
      const key = `${log.session_date} - ${log.exercise_name || "Unknown"}`;
      if (!bySession[key]) bySession[key] = [];
      bySession[key].push(`${log.weight_lbs}lbs × ${log.reps}`);
    });
    Object.entries(bySession).slice(0, 20).forEach(([session, sets]) => {
      prompt += `  ${session}: ${sets.join(", ")}\n`;
    });
    prompt += "\n";
  }

  // PRs
  if (prs && prs.length > 0) {
    prompt += `PERSONAL RECORDS:\n`;
    prs.slice(0, 15).forEach(pr => {
      prompt += `  ${pr.exercise_name}: ${pr.weight_lbs}lbs × ${pr.reps} (${pr.achieved_date || "unknown date"})\n`;
    });
    prompt += "\n";
  }

  // Measurements
  if (measurements && measurements.length > 0) {
    prompt += `BODY MEASUREMENTS (most recent first):\n`;
    measurements.slice(0, 6).forEach(m => {
      const parts = [];
      if (m.weight_lbs) parts.push(`Weight: ${m.weight_lbs}lbs`);
      if (m.waist_in) parts.push(`Waist: ${m.waist_in}"`);
      if (m.hips_in) parts.push(`Hips: ${m.hips_in}"`);
      if (m.chest_in) parts.push(`Chest: ${m.chest_in}"`);
      if (m.right_thigh_in || m.left_thigh_in) parts.push(`Thigh: R${m.right_thigh_in}" L${m.left_thigh_in}"`);
      if (parts.length) prompt += `  ${m.measured_at}: ${parts.join(", ")}\n`;
    });
    prompt += "\n";
  }

  // Check-ins
  if (checkins && checkins.length > 0) {
    prompt += `RECENT CHECK-INS:\n`;
    checkins.slice(0, 4).forEach(c => {
      prompt += `  ${c.checked_in_at?.slice(0, 10)}: Energy ${c.energy_level}/10, Sleep ${c.sleep_quality}/10, Soreness ${c.soreness_level}/10`;
      if (c.notes) prompt += `, Notes: "${c.notes}"`;
      prompt += "\n";
    });
    prompt += "\n";
  }

  if (!recentLogs?.length && !prs?.length && !measurements?.length) {
    prompt += `NOTE: This client has limited data logged. Base recommendations on what is available and suggest what data would be most useful to track.\n\n`;
  }

  return prompt;
}

export default function AICoachPanel({ client, overview }) {
  const [analysisType, setAnalysisType] = useState("overall");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);

    const selectedType = ANALYSIS_TYPES.find(t => t.id === analysisType);
    const clientData = formatClientDataForPrompt(overview, client.name);

    const systemPrompt = `You are an expert personal trainer and strength coach. You analyze client training data and give specific, evidence-based recommendations. Be direct and concise. Use bullet points. Reference specific numbers from the data. Focus on what matters most. Limit your response to 300–400 words.`;

    const userPrompt = clientData + `\nANALYSIS REQUESTED: ${selectedType.prompt}`;

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content?.[0]?.text || "No response received.";
      const entry = { type: selectedType.label, result: text, timestamp: new Date().toLocaleTimeString() };
      setResult(entry);
      setHistory(prev => [entry, ...prev].slice(0, 5));
    } catch (err) {
      setError(err.message || "Analysis failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Parse result into sections for better display
  function renderResult(text) {
    return text.split("\n").map((line, i) => {
      if (!line.trim()) return <div key={i} style={{ height: "8px" }} />;
      if (line.startsWith("##")) return <div key={i} style={{ fontSize: "13px", fontWeight: "700", color: "#111", marginTop: "12px", marginBottom: "4px" }}>{line.replace(/^#+/, "").trim()}</div>;
      if (line.startsWith("#")) return <div key={i} style={{ fontSize: "14px", fontWeight: "700", color: "#111", marginTop: "14px", marginBottom: "6px" }}>{line.replace(/^#+/, "").trim()}</div>;
      if (line.startsWith("**") && line.endsWith("**")) return <div key={i} style={{ fontSize: "12px", fontWeight: "700", color: "#333", marginTop: "8px" }}>{line.replace(/\*\*/g, "")}</div>;
      if (line.match(/^[\-\*•]\s/)) return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}>
          <span style={{ color: "#c47a0a", flexShrink: 0, marginTop: "1px" }}>·</span>
          <span style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{line.replace(/^[\-\*•]\s/, "").replace(/\*\*/g, "")}</span>
        </div>
      );
      return <div key={i} style={{ fontSize: "12px", color: "#444", lineHeight: "1.7", marginBottom: "3px" }}>{line.replace(/\*\*/g, "")}</div>;
    });
  }

  return (
    <div style={{ padding: "0 0 20px" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999", marginBottom: "12px" }}>
        AI Coach Analysis — {client.name}
      </div>

      {/* Analysis type selector */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
        {ANALYSIS_TYPES.map(t => (
          <button key={t.id} onClick={() => setAnalysisType(t.id)} style={{
            padding: "6px 12px", borderRadius: "20px", fontSize: "11px", cursor: "pointer", ...F,
            background: analysisType === t.id ? "#111" : "#f5f5f3",
            color: analysisType === t.id ? "#f7f6f3" : "#555",
            border: "1px solid " + (analysisType === t.id ? "#111" : "#e0e0e0"),
          }}>{t.label}</button>
        ))}
      </div>

      <button onClick={runAnalysis} disabled={loading} style={{
        width: "100%", background: loading ? "#ccc" : "#111", color: "#f7f6f3",
        border: "none", borderRadius: "7px", padding: "12px", fontSize: "13px",
        cursor: loading ? "wait" : "pointer", marginBottom: "16px", ...F,
        letterSpacing: "0.05em",
      }}>
        {loading ? "Analyzing..." : `Run ${ANALYSIS_TYPES.find(t => t.id === analysisType)?.label}`}
      </button>

      {loading && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#999" }}>
          <div style={{ fontSize: "12px", ...F }}>Reading {client.name}'s data and generating insights...</div>
          <div style={{ fontSize: "11px", color: "#ccc", marginTop: "4px" }}>This takes about 10 seconds</div>
        </div>
      )}

      {error && (
        <div style={{ background: "#fff0f0", border: "1px solid #f0b0b0", borderRadius: "7px", padding: "12px 14px", marginBottom: "14px" }}>
          <div style={{ fontSize: "12px", color: "#a02020" }}>{error}</div>
        </div>
      )}

      {result && (
        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "8px", padding: "16px", marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>{result.type}</div>
            <div style={{ fontSize: "10px", color: "#bbb" }}>{result.timestamp}</div>
          </div>
          <div>{renderResult(result.result)}</div>
        </div>
      )}

      {history.length > 1 && (
        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: "8px" }}>Previous analyses this session</div>
          {history.slice(1).map((h, i) => (
            <div key={i} style={{ background: "#fafaf8", border: "1px solid #ebebeb", borderRadius: "7px", padding: "12px 14px", marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ fontSize: "10px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h.type}</div>
                <div style={{ fontSize: "10px", color: "#ccc" }}>{h.timestamp}</div>
              </div>
              <div style={{ maxHeight: "120px", overflow: "hidden", position: "relative" }}>
                <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.6" }}>{h.result.slice(0, 250)}...</div>
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40px", background: "linear-gradient(transparent, #fafaf8)" }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
