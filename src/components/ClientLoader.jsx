import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getClientActivePlan } from "../lib/supabase";
import { adaptPlanToSchedule } from "../lib/planAdapter";
import ClientAuth from "./ClientAuth";
import PasswordSetup from "./PasswordSetup";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// Check if the URL has Supabase auth tokens (from invite/reset email click)
function hasAuthTokensInUrl() {
  const hash = window.location.hash;
  return hash.includes("access_token") || hash.includes("type=invite") || hash.includes("type=recovery");
}

export default function ClientLoader({ children }) {
  const [state, setState] = useState("loading"); // loading | auth | setup | ready | error
  const [clientData, setClientData] = useState(null);
  const [adaptedSchedule, setAdaptedSchedule] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // If URL has auth tokens, show password setup screen
    if (hasAuthTokensInUrl()) {
      setState("setup");
      return;
    }
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
        loadClientData(session.user.id);
      } else {
        setState("auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      await loadClientData(session.user.id);
    } else {
      setState("auth");
    }
  }

  async function loadClientData(authUserId) {
    try {
      setState("loading");

      // Get client record linked to this auth user
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("auth_user_id", authUserId)
        .eq("is_active", true)
        .single();

      // If not found by auth_user_id, try matching by email
      if (error || !client) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: clientByEmail } = await supabase
            .from("clients")
            .select("*")
            .eq("email", user.email)
            .eq("is_active", true)
            .single();
          if (clientByEmail) {
            await supabase
              .from("clients")
              .update({ auth_user_id: authUserId })
              .eq("id", clientByEmail.id);
            client = { ...clientByEmail, auth_user_id: authUserId };
          }
        }
      }

      if (!client) {
        setState("error");
        return;
      }

      setClientData(client);

      // Load their active plan
      const { data: plan } = await getClientActivePlan(client.id);
      if (plan) {
        const schedule = adaptPlanToSchedule(plan);
        setAdaptedSchedule(schedule);
      }

      setState("ready");
    } catch (err) {
      console.error("ClientLoader error:", err);
      setState("ready"); // Fall through to default schedule
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setState("auth");
    setClientData(null);
    setAdaptedSchedule(null);
  }

  if (state === "setup") {
    return (
      <PasswordSetup onComplete={() => {
        setState("loading");
        checkSession();
        // Clean up URL hash
        window.history.replaceState(null, "", window.location.pathname);
      }} />
    );
  }

  if (state === "auth") {
    return <ClientAuth onAuthenticated={async (user) => {
      setSession({ user });
      await loadClientData(user.id);
    }} />;
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
          <div style={{ fontSize: "16px", marginBottom: "8px", ...F }}>No plan found</div>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "16px" }}>
            Your account isn't linked to a plan yet. Contact your coach.
          </div>
          <button onClick={handleSignOut} style={{ background: "transparent", color: "#aaa", border: "1px solid #333", borderRadius: "7px", padding: "8px 16px", fontSize: "12px", cursor: "pointer", ...F }}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return children({ clientData, adaptedSchedule, onSignOut: handleSignOut });
}
