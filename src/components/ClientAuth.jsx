import { useState } from "react";
import { supabase } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function ClientAuth({ onAuthenticated }) {
  const [screen, setScreen] = useState("login"); // login | forgot | check_email
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      if (err.message.includes("Invalid login")) {
        setError("Incorrect email or password. Try again or use Forgot Password.");
      } else {
        setError(err.message);
      }
    } else if (data?.user) {
      onAuthenticated(data.user);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setScreen("check_email");
      setMessage(`Password reset email sent to ${email}. Check your inbox.`);
    }
  }

  if (screen === "check_email") {
    return (
      <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px", textAlign: "center" }}>
          
          <div style={{ fontSize: "16px", fontWeight: "normal", color: "#f7f6f3", marginBottom: "8px", ...F }}>Check your email</div>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.6", marginBottom: "20px" }}>{message}</div>
          <button onClick={() => { setScreen("login"); setError(""); }} style={{ background: "transparent", color: "#aaa", border: "1px solid #333", borderRadius: "7px", padding: "10px 20px", fontSize: "12px", cursor: "pointer", ...F }}>
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#1a1a1a", borderRadius: "12px", padding: "32px 28px", width: "100%", maxWidth: "360px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: "6px" }}>
            {screen === "forgot" ? "Reset Password" : "Welcome Back"}
          </div>
          <h1 style={{ color: "#f7f6f3", fontSize: "24px", fontWeight: "normal", margin: 0, ...F }}>
            {screen === "forgot" ? "Forgot password?" : "Workout Plan"}
          </h1>
          {screen === "login" && (
            <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>
              Sign in to access your plan
            </div>
          )}
          {screen === "forgot" && (
            <div style={{ fontSize: "12px", color: "#555", marginTop: "4px", lineHeight: "1.5" }}>
              Enter your email and we'll send you a reset link.
            </div>
          )}
        </div>

        {/* Email field */}
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Email</div>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (screen === "forgot" ? handleForgotPassword() : handleLogin())}
            style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", ...F }}
          />
        </div>

        {/* Password field — only on login screen */}
        {screen === "login" && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "10px", color: "#666", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "5px" }}>Password</div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "11px 13px", borderRadius: "7px", border: "1px solid #333", background: "#111", color: "#f7f6f3", fontSize: "14px", ...F }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#2a1111", border: "1px solid #5a2020", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", fontSize: "12px", color: "#f87171", lineHeight: "1.5" }}>
            {error}
          </div>
        )}

        {/* Primary action */}
        <button
          onClick={screen === "forgot" ? handleForgotPassword : handleLogin}
          disabled={loading}
          style={{ width: "100%", background: loading ? "#333" : "#f7f6f3", color: "#111", border: "none", borderRadius: "7px", padding: "13px", fontSize: "14px", cursor: loading ? "default" : "pointer", ...F, marginBottom: "12px" }}
        >
          {loading ? "Please wait..." : screen === "forgot" ? "Send Reset Email" : "Sign In"}
        </button>

        {/* Secondary action */}
        {screen === "login" && (
          <button
            onClick={() => { setScreen("forgot"); setError(""); }}
            style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: "12px", cursor: "pointer", ...F, padding: "4px" }}
          >
            Forgot password?
          </button>
        )}
        {screen === "forgot" && (
          <button
            onClick={() => { setScreen("login"); setError(""); }}
            style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: "12px", cursor: "pointer", ...F, padding: "4px" }}
          >
            Back to sign in
          </button>
        )}
      </div>
    </div>
  );
}
