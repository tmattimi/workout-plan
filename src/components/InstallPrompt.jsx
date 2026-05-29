import { useState, useEffect } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      localStorage.getItem("pwa_install_dismissed") === "true"
    ) {
      return;
    }

    // Android/Chrome — capture the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS — show manual instructions after 30 seconds if on Safari
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      const timer = setTimeout(() => setShowIOSInstructions(true), 30000);
      return () => { window.removeEventListener("beforeinstallprompt", handler); clearTimeout(timer); };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem("pwa_install_dismissed", "true");
    setPrompt(null);
    setShowIOSInstructions(false);
    setDismissed(true);
  }

  async function install() {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
    else dismiss();
  }

  if (dismissed || (!prompt && !showIOSInstructions)) return null;

  // Android install prompt
  if (prompt) {
    return (
      <div style={{
        position: "fixed", bottom: "80px", left: "16px", right: "16px",
        background: "#1a1a1a", borderRadius: "12px", padding: "14px 16px",
        display: "flex", alignItems: "center", gap: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)", zIndex: 1000,
        maxWidth: 608, margin: "0 auto",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#f5f5f7", marginBottom: "2px" }}>
            Add to Home Screen
          </div>
          <div style={{ fontSize: "10px", color: "#888", lineHeight: "1.5" }}>
            Install the app for faster access and a full-screen experience.
          </div>
        </div>
        <button onClick={dismiss} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", flexShrink: 0, padding: "4px" }}>✕</button>
        <button onClick={install} style={{ background: "#f5f5f7", color: "#111", border: "none", borderRadius: "7px", padding: "8px 14px", fontSize: "12px", fontWeight: "600", cursor: "pointer", flexShrink: 0, ...F }}>
          Install
        </button>
      </div>
    );
  }

  // iOS instructions
  if (showIOSInstructions) {
    return (
      <div style={{
        position: "fixed", bottom: "80px", left: "16px", right: "16px",
        background: "#1a1a1a", borderRadius: "12px", padding: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)", zIndex: 1000,
        maxWidth: 608, margin: "0 auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#f5f5f7" }}>Add to Home Screen</div>
          <button onClick={dismiss} style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.7" }}>
          Tap the <span style={{ color: "#f5f5f7" }}>Share button</span> at the bottom of Safari, then tap <span style={{ color: "#f5f5f7" }}>Add to Home Screen</span>. The app will open full screen without the browser bar.
        </div>
      </div>
    );
  }

  return null;
}
