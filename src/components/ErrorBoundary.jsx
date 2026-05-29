import { Component } from "react";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      const { fallback, tabName } = this.props;
      if (fallback) return fallback;
      return (
        <div style={{ padding: "40px 24px", textAlign: "center", ...F }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#bbb", marginBottom: "12px" }}>
            Something went wrong
          </div>
          <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.7", marginBottom: "20px" }}>
            The {tabName || "this section"} couldn't load.
            {this.state.error?.message && (
              <div style={{ fontSize: "10px", color: "#ccc", marginTop: "8px", fontFamily: "monospace" }}>
                {this.state.error.message}
              </div>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ background: "#111", color: "#fff", border: "none", borderRadius: "7px", padding: "10px 20px", fontSize: "12px", cursor: "pointer", ...F }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
