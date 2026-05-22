import { useState } from "react";
import { getRecoveryAssessment } from "../lib/recoveryEngine";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

function ScoreRing({ score, color, size = 52 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

export default function RecoveryCard({ dailyHealth, todayKey, onLogHealth }) {
  const [expanded, setExpanded] = useState(false);
  
  const assessment = getRecoveryAssessment(dailyHealth, todayKey);
  const today = dailyHealth[todayKey] || {};
  const hasAnyData = today.sleep_hours || today.resting_hr || today.hrv || today.energy_level;
  
  // No data at all — show a prompt to log
  if (!hasAnyData) {
    return (
      <button
        onClick={onLogHealth}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px", padding: "12px 16px",
          display: "flex", alignItems: "center", gap: "12px",
          cursor: "pointer", textAlign: "left", marginBottom: "12px",
        }}
      >
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", ...F }}>
            Log sleep and recovery to get a daily readiness assessment
          </div>
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>Log →</div>
      </button>
    );
  }
  
  // Has data but not enough to score
  if (!assessment) {
    return (
      <div style={{
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px", padding: "12px 16px", marginBottom: "12px",
        display: "flex", alignItems: "center", gap: "12px",
      }}>
        
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", ...F }}>
          Log a few more days of sleep and heart rate to unlock your recovery score
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${assessment.color}33`,
      borderRadius: "10px",
      marginBottom: "12px",
      overflow: "hidden",
    }}>
      {/* Main row */}
      <button
        onClick={() => setExpanded(p => !p)}
        style={{
          width: "100%", background: "none", border: "none",
          padding: "12px 16px", cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: "13px",
        }}
      >
        {/* Score ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreRing score={assessment.score} color={assessment.color} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: assessment.color }}>
              {assessment.score}
            </span>
          </div>
        </div>
        
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
            <span style={{
              fontSize: "9px", fontWeight: "700", letterSpacing: "0.15em",
              textTransform: "uppercase", color: assessment.color,
            }}>
              {assessment.label}
            </span>
            {assessment.intensityMultiplier < 1 && assessment.intensityMultiplier > 0 && (
              <span style={{
                fontSize: "8px", background: `${assessment.color}20`,
                color: assessment.color, borderRadius: "4px", padding: "1px 5px",
              }}>
                {Math.round(assessment.intensityMultiplier * 100)}% intensity
              </span>
            )}
            {assessment.intensityMultiplier === 0 && (
              <span style={{
                fontSize: "8px", background: "#ef444420",
                color: "#ef4444", borderRadius: "4px", padding: "1px 5px",
              }}>
                rest day
              </span>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: "1.5", ...F }}>
            {assessment.summary}
          </div>
        </div>
        
        <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "10px", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      
      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px" }}>
          
          {/* Factor pills */}
          {assessment.factors.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              {assessment.factors.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "7px 0",
                  borderBottom: i < assessment.factors.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  {/* Mini score bar */}
                  <div style={{ width: "30px", flexShrink: 0 }}>
                    <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
                      <div style={{
                        height: "100%",
                        width: `${f.score ?? 50}%`,
                        background: f.score >= 70 ? "#22c55e" : f.score >= 40 ? "#f59e0b" : "#ef4444",
                        borderRadius: "2px",
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.7)", marginRight: "6px" }}>
                      {f.label}
                    </span>
                    <span style={{ fontSize: "10px", color: assessment.color, fontWeight: "700", marginRight: "6px" }}>
                      {f.value}
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                      {f.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Recommendation */}
          <div style={{
            background: `${assessment.color}10`,
            border: `1px solid ${assessment.color}25`,
            borderRadius: "7px", padding: "10px 12px",
            marginBottom: "10px",
          }}>
            <div style={{ fontSize: "9px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", color: assessment.color, marginBottom: "5px" }}>
              Today's recommendation
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: "1.65", ...F }}>
              {assessment.recommendation}
            </div>
          </div>
          
          {/* Update data link */}
          <button
            onClick={onLogHealth}
            style={{
              background: "none", border: "none", color: "rgba(255,255,255,0.3)",
              fontSize: "10px", cursor: "pointer", padding: 0, textDecoration: "underline",
            }}
          >
            Update today's data
          </button>
        </div>
      )}
    </div>
  );
}
