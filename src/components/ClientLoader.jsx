import { useState, useEffect } from "react";
import { getClientByToken, getClientActivePlan, getClientLogs, getClientPRs, getClientMeasurements } from "../lib/supabase";
import { adaptPlanToSchedule } from "../lib/planAdapter";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Extracts ?client=TOKEN from the URL
function getClientToken() {
  // Try standard search params first
  let params = new URLSearchParams(window.location.search);
  let token = params.get("client");
  // Fallback: parse from full href in case search is empty
  if (!token && window.location.href.includes("client=")) {
    const match = window.location.href.match(/[?&]client=([^&]+)/);
    token = match ? match[1] : null;
  }
  console.log("getClientToken - href:", window.location.href, "token:", token);
  return token;
}

export default function ClientLoader({ children }) {
  const [state, setState] = useState("loading"); // loading | ready | no_token | no_plan | error
  const [clientData, setClientData] = useState(null);
  const [adaptedSchedule, setAdaptedSchedule] = useState(null);
  const [error, setError] = useState(null);

  const token = getClientToken();

  useEffect(() => {
    if (!token) {
      // No token — show default app
      setState("ready");
      return;
    }
    loadClient();
  }, [token]);

  async function loadClient() {
    try {
      setState("loading");

      // 1. Load client by token
      const client = await getClientByToken(token);
      console.log("TOKEN:", token);
      console.log("CLIENT RESULT:", client);
      if (!client) {
        setState("error");
        setError("This link is invalid or has been deactivated. Contact your coach for a new link.");
        return;
      }

      setClientData(client);

      // 2. Load their active plan
      const { data: plan } = await getClientActivePlan(client.id);

      if (plan) {
        const schedule = adaptPlanToSchedule(plan);
        setAdaptedSchedule(schedule);
      }
      // If no plan, app falls back to default schedule from data.js

      setState("ready");
    } catch (err) {
      console.error("ClientLoader error:", err);
      // Still show the app with default schedule
      setState("ready");
    }
  }

  if (state === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid #333", borderTop: "3px solid #f7f6f3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ color: "#555", fontSize: "12px", ...F }}>Loading your plan...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ textAlign: "center", color: "#f7f6f3" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔗</div>
          <div style={{ fontSize: "16px", marginBottom: "8px", ...F }}>Link not found</div>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.6" }}>{error}</div>
        </div>
      </div>
    );
  }

  // Pass client data and adapted schedule down to the app
  return children({ clientData, adaptedSchedule });
}
