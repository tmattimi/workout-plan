import { useState, useEffect, useRef } from "react";
import { getMessages, sendMessage, subscribeToMessages, markMessagesRead } from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

export default function MessagesTab({ clientId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!clientId) return;
    loadMessages();

    // Subscribe to new messages in real time
    const unsub = subscribeToMessages(clientId, (newMsg) => {
      setMessages(prev => {
        const exists = prev.some(m => m.id === newMsg.id);
        return exists ? prev : [...prev, newMsg].sort((a,b) => a.created_at.localeCompare(b.created_at));
      });
    });
    return () => { if (unsub?.unsubscribe) unsub.unsubscribe(); };
  }, [clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const { data } = await getMessages(clientId);
    setMessages((data || []).sort((a, b) => a.created_at.localeCompare(b.created_at)));
    setLoading(false);
    // Mark coach messages as read
    markMessagesRead(clientId, "coach").catch(() => {});
  }

  async function handleSend() {
    if (!reply.trim() || sending) return;
    setSending(true);
    const text = reply.trim();
    setReply("");
    const tempId = "temp-" + Date.now();
    const tempMsg = { id: tempId, client_id: clientId, sender: "client", message: text, created_at: new Date().toISOString(), is_read: false };
    // Add optimistic message immediately
    setMessages(prev => [...prev, tempMsg]);

    // Send to Supabase and replace temp with real row
    const { data } = await sendMessage(null, clientId, text, "client");
    setSending(false);

    if (data) {
      // Replace temp message with the real saved row
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } else {
      // If no row returned, just reload to get the real state
      await loadMessages();
    }
  }

  function formatTime(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  // Group messages by date
  const grouped = [];
  let lastDate = null;
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString();
    if (date !== lastDate) {
      grouped.push({ type: "date", label: date === new Date().toDateString() ? "Today" : new Date(msg.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) });
      lastDate = date;
    }
    grouped.push({ type: "message", msg });
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)", background: "#f9f9f7" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #ede9e4", background: "#fff" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "2px" }}>Messages</div>
        <div style={{ fontSize: "13px", color: "#111" }}>Tara Mattimiro</div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {loading && <div style={{ textAlign: "center", color: "#bbb", fontSize: "12px", padding: "20px" }}>Loading...</div>}

        {!loading && messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb", fontSize: "12px", lineHeight: "1.7", ...F }}>
            No messages yet. Send a note to Tara — questions about form, how a session felt, anything.
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === "date") {
            return (
              <div key={i} style={{ textAlign: "center", margin: "12px 0 8px", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "#ccc" }}>
                {item.label}
              </div>
            );
          }
          const { msg } = item;
          const isCoach = msg.sender === "coach";
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isCoach ? "flex-start" : "flex-end", marginBottom: "4px" }}>
              <div style={{ maxWidth: "75%" }}>
                <div style={{
                  background: isCoach ? "#fff" : "#1a1a1a",
                  color: isCoach ? "#111" : "#f5f5f7",
                  border: isCoach ? "1px solid #e8e8e8" : "none",
                  borderRadius: isCoach ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  ...F,
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: "9px", color: "#ccc", marginTop: "3px", textAlign: isCoach ? "left" : "right", paddingLeft: isCoach ? "4px" : 0, paddingRight: isCoach ? 0 : "4px" }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid #ede9e4", background: "#fff", display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Message Tara..."
          rows={1}
          style={{
            flex: 1, padding: "10px 13px", borderRadius: "20px",
            border: "1px solid #e4e0db", fontSize: "13px",
            resize: "none", lineHeight: "1.5", ...F,
            background: "#f9f9f7", maxHeight: "100px", overflow: "auto",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!reply.trim() || sending}
          style={{
            background: reply.trim() ? "#1a1a1a" : "#e4e0db",
            color: reply.trim() ? "#fff" : "#aaa",
            border: "none", borderRadius: "20px",
            padding: "10px 16px", fontSize: "12px",
            cursor: reply.trim() ? "pointer" : "default",
            flexShrink: 0, ...F,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
