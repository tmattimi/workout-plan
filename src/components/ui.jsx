// Shared UI primitives — used across the coach dashboard and client tabs
// so empty states, section labels, and cards look consistent everywhere.

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export const UI = {
  bg: "#f7f6f3", card: "#fff", dark: "#1a1a1a", mid: "#555",
  muted: "#999", faint: "#bbb", border: "#e8e8e8", borderSoft: "#eee",
};

// Small uppercase section label, optional right-aligned slot (e.g. a button)
export function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: UI.muted, ...F }}>
        {children}
      </div>
      {right}
    </div>
  );
}

// Consistent empty state — icon, headline, optional detail line
export function EmptyState({ icon = "○", title, detail }) {
  return (
    <div style={{ background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 26, color: UI.faint, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, color: UI.mid, ...F, marginBottom: detail ? 6 : 0 }}>{title}</div>
      {detail && (
        <div style={{ fontSize: 12, color: UI.muted, lineHeight: 1.6, maxWidth: 320, margin: "0 auto", ...F }}>
          {detail}
        </div>
      )}
    </div>
  );
}

// Lightweight inline empty state for use inside scrolling panels (chat, lists)
export function InlineEmpty({ children }) {
  return (
    <div style={{ textAlign: "center", color: UI.faint, fontSize: 12, padding: "30px 16px", lineHeight: 1.7, ...F }}>
      {children}
    </div>
  );
}

// Standard white card container
export function Card({ children, style }) {
  return (
    <div style={{ background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  );
}
