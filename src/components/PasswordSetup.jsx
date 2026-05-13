import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

// This screen handles two cases:
// 1. Client clicking an invite link (has access_token in URL hash from Supabase)
// 2. Client clicking a password reset link

export default function PasswordSetup({ onComplete }) {
  const [screen, setScreen] = useState("loading"); // loading | setup | success | error
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isInvite, setIsInvite] = useState(false);

  useEffect(() => {
    // Supabase puts the session tokens in the URL hash after email confirmation
    // Check if we have an active session from a link click
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setScreen("setup");
        // Check if this is a new invite (no password set yet) or a reset
        const createdAt = new Date(session.user.created_at);
        const now = new Date();
        const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
        setIsInvite(hoursSinceCreation < 24); // Created in last 24 hours = invite
      } else {
        setScreen("error");
      }
    }

    // Listen for auth state change from URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session) {
          setScreen("setup");
          const createdAt = new Date(session.user.created_at);
          const now = new Date();
          const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
          setIsInvite(hoursSinceCreation < 24);
        }
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  async function handleSetPassword() {
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setScreen("success");
      setTimeout(() => onComplete && onComplete(), 2000);
    }
  }

  if (screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid #333", borderTop: "3px solid #f7f6f3", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (screen === "error") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔗</div>
          <div style={{ fontSize: "16px", color: "#f7f6f3", marginBottom: "8px", ...F }}>Link expired</div>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>
            This setup link has expired or already been used. Contact your coach for a new invite.
          </div>
          <button
            onClick={() => window.location.href = "/"}
            style={{ background: "#f7f6f3", color: "#111", border: "none", borderRadius: "7px", padding: "11px 24px", fontSize: "13px", cursor: "pointer", ...F }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (screen === "success") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "14px" }}>✅</div>
          <div style={{ fontSize: "18px", color: "#f7f6f3", marginBottom: "8px", ...F }}>
            {isInvite ? "Account ready!" : "Password updated!"}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>Taking you to your plan...</div>
        </div>
      </div>
    );
  }

  // Setup screen
  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>
            {isInvite ? "Welcome" : "Reset Password"}
          </div>
          <h1 style={{ color: "#f7f6f3", fontSize: "22px", fontWeight: "normal", margin: "0 0 6px", ...F }}>
            {isInvite ? "Set your password" : "Choose a new password"}
          </h1>
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
            {isInvite
              ? "Create a password to secure your account. You'll use this to sign in each time."
              : "Choose a new password for your account."
            }
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Password</div>
          <input
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", ...F }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Confirm Password</div>
          <input
            type="password"
            placeholder="Same password again"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSetPassword()}
            style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", ...F }}
          />
        </div>

        {/* Password strength indicator */}
        {password.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", gap: "3px", marginBottom: "4px" }}>
              {[1, 2, 3, 4].map(level => {
                const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                const colors = ["#a02a2a", "#c47a0a", "#2563a8", "#2d7a1e"];
                return (
                  <div key={level} style={{ flex: 1, height: "3px", borderRadius: "2px", background: level <= strength ? colors[strength - 1] : "#333" }} />
                );
              })}
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>
              {password.length >= 12 ? "Strong" : password.length >= 10 ? "Good" : password.length >= 8 ? "OK" : "Too short"}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "#2a1111", border: "1px solid #5a2020", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", fontSize: "12px", color: "#f87171" }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSetPassword}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#333" : "#f7f6f3", color: "#111", border: "none", borderRadius: "7px", padding: "13px", fontSize: "14px", cursor: loading ? "default" : "pointer", ...F }}
        >
          {loading ? "Setting password..." : isInvite ? "Create Account" : "Update Password"}
        </button>
      </div>
    </div>
  );
}
