import { useState, useEffect } from "react";
import {
  getGroups, createGroup, deleteGroup, updateGroup,
  addClientToGroup, removeClientFromGroup,
  assignProgramToGroup, broadcastMessageToGroup,
  getPrograms
} from "../lib/supabase";

const F = { fontFamily: "'Georgia','Times New Roman',serif" };

const GROUP_COLORS = ["#1a1a1a","#2563a8","#2d7a1e","#c47a0a","#a02020","#7c3aed","#0891b2"];

export default function GroupProgramming({ coachId, allClients }) {
  const [groups, setGroups] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | create | detail
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", color: "#1a1a1a" });

  useEffect(() => { load(); }, [coachId]);

  async function load() {
    setLoading(true);
    const [groupsResult, programsResult] = await Promise.all([
      getGroups(coachId),
      getPrograms(coachId),
    ]);
    setGroups(groupsResult.data || []);
    setPrograms(programsResult.data || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!newGroup.name.trim()) return;
    setCreating(true);
    const { data, error } = await createGroup(coachId, newGroup);
    if (!error && data) {
      setGroups(prev => [...prev, { ...data, client_group_members: [] }]);
      setNewGroup({ name: "", description: "", color: "#1a1a1a" });
      setView("list");
    }
    setCreating(false);
  }

  async function handleDelete(groupId) {
    if (!window.confirm("Delete this group? Clients won't be affected.")) return;
    await deleteGroup(groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    if (selected?.id === groupId) { setSelected(null); setView("list"); }
  }

  if (loading) return <div style={{ textAlign: "center", padding: "30px", color: "#bbb", fontSize: "12px" }}>Loading...</div>;

  // ── Create group form ──
  if (view === "create") {
    return (
      <div>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "0 0 14px", display: "flex", alignItems: "center", gap: "4px" }}>
          ← Back
        </button>
        <div style={{ fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "#bbb", marginBottom: "14px" }}>New Group</div>

        <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: "10px", padding: "16px", marginBottom: "12px" }}>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: "#999", marginBottom: "5px" }}>Group name</div>
            <input value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Recomposition Cohort, Spring 2026"
              style={{ width: "100%", padding: "9px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "13px", boxSizing: "border-box" }} autoFocus />
          </div>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "10px", color: "#999", marginBottom: "5px" }}>Description (optional)</div>
            <input value={newGroup.description} onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
              placeholder="e.g. Clients on the 5-day recomp program"
              style={{ width: "100%", padding: "9px 11px", borderRadius: "7px", border: "1px solid #e4e0db", fontSize: "13px", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: "10px", color: "#999", marginBottom: "8px" }}>Color</div>
            <div style={{ display: "flex", gap: "6px" }}>
              {GROUP_COLORS.map(c => (
                <button key={c} onClick={() => setNewGroup(p => ({ ...p, color: c }))} style={{
                  width: "24px", height: "24px", borderRadius: "50%", background: c, border: `2px solid ${newGroup.color === c ? "#111" : "transparent"}`, cursor: "pointer", flexShrink: 0,
                }} />
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleCreate} disabled={!newGroup.name.trim() || creating} style={{
          width: "100%", background: newGroup.name.trim() ? "#111" : "#ddd",
          color: newGroup.name.trim() ? "#fff" : "#aaa",
          border: "none", borderRadius: "9px", padding: "14px", fontSize: "13px",
          cursor: newGroup.name.trim() ? "pointer" : "default", ...F,
        }}>
          {creating ? "Creating..." : "Create Group"}
        </button>
      </div>
    );
  }

  // ── Group detail ──
  if (view === "detail" && selected) {
    return <GroupDetail
      group={selected}
      coachId={coachId}
      allClients={allClients}
      programs={programs}
      onBack={() => { setView("list"); setSelected(null); }}
      onUpdated={(updated) => setGroups(prev => prev.map(g => g.id === updated.id ? updated : g))}
      onDelete={() => handleDelete(selected.id)}
    />;
  }

  // ── Groups list ──
  return (
    <div style={{ paddingBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#999" }}>Client Groups</div>
        <button onClick={() => setView("create")} style={{ background: "#111", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 14px", fontSize: "11px", cursor: "pointer", ...F }}>
          + New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#bbb", lineHeight: "1.7", fontSize: "12px", ...F }}>
          No groups yet. Create a group to assign programs and send messages to multiple clients at once.
        </div>
      ) : (
        groups.map(group => {
          const members = group.client_group_members || [];
          return (
            <button key={group.id} onClick={() => { setSelected(group); setView("detail"); }}
              style={{ width: "100%", background: "#fff", border: "1px solid #e8e8e8", borderRadius: "9px", padding: "13px 15px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: group.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#111", marginBottom: "2px" }}>{group.name}</div>
                {group.description && <div style={{ fontSize: "11px", color: "#aaa" }}>{group.description}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#111", lineHeight: 1 }}>{members.length}</div>
                <div style={{ fontSize: "9px", color: "#bbb" }}>client{members.length !== 1 ? "s" : ""}</div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

// ── Group detail view ─────────────────────────────────────────────────────────
function GroupDetail({ group, coachId, allClients, programs, onBack, onUpdated, onDelete }) {
  const [members, setMembers] = useState(
    (group.client_group_members || []).map(m => m.client_id)
  );
  const [tab, setTab] = useState("members"); // members | assign | message
  const [selectedProgram, setSelectedProgram] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState(null);
  const [broadcast, setBroadcast] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);

  const clientsInGroup = allClients.filter(c => members.includes(c.id));
  const clientsNotInGroup = allClients.filter(c => !members.includes(c.id));

  async function toggleMember(clientId) {
    if (members.includes(clientId)) {
      await removeClientFromGroup(group.id, clientId);
      setMembers(prev => prev.filter(id => id !== clientId));
    } else {
      await addClientToGroup(group.id, clientId);
      setMembers(prev => [...prev, clientId]);
    }
  }

  async function handleAssign() {
    if (!selectedProgram) return;
    setAssigning(true);
    setAssignResult(null);
    const { error, count } = await assignProgramToGroup(selectedProgram, group.id);
    setAssigning(false);
    setAssignResult(error ? { error: error.message } : { success: true, count });
  }

  async function handleBroadcast() {
    if (!broadcast.trim()) return;
    setSending(true);
    setSendResult(null);
    const { error, count } = await broadcastMessageToGroup(coachId, group.id, broadcast.trim());
    setSending(false);
    if (!error) {
      setBroadcast("");
      setSendResult({ success: true, count });
    } else {
      setSendResult({ error: error.message });
    }
  }

  const program = programs.find(p => p.id === selectedProgram);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: "4px" }}>
        ← All Groups
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: group.color }} />
        <div>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#111" }}>{group.name}</div>
          {group.description && <div style={{ fontSize: "11px", color: "#aaa" }}>{group.description}</div>}
        </div>
        <button onClick={onDelete} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ddd", fontSize: "11px", cursor: "pointer" }}>Delete</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px", background: "#f5f5f3", borderRadius: "8px", padding: "3px" }}>
        {[["members","Members"],["assign","Assign Program"],["message","Broadcast"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "7px 4px", borderRadius: "6px", fontSize: "10px", cursor: "pointer", border: "none",
            background: tab === id ? "#fff" : "transparent",
            color: tab === id ? "#111" : "#888",
            fontWeight: tab === id ? "600" : "normal", ...F,
            boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}>{label}</button>
        ))}
      </div>

      {/* Members tab */}
      {tab === "members" && (
        <div>
          <div style={{ fontSize: "9px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
            {members.length} member{members.length !== 1 ? "s" : ""}
          </div>
          {allClients.map(client => {
            const inGroup = members.includes(client.id);
            return (
              <div key={client.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #f5f5f3" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", color: "#111" }}>{client.name}</div>
                  {client.email && <div style={{ fontSize: "10px", color: "#bbb" }}>{client.email}</div>}
                </div>
                <button onClick={() => toggleMember(client.id)} style={{
                  padding: "5px 12px", borderRadius: "20px", fontSize: "10px", cursor: "pointer",
                  background: inGroup ? "#1a1a1a" : "transparent",
                  color: inGroup ? "#fff" : "#aaa",
                  border: `1px solid ${inGroup ? "#1a1a1a" : "#e4e0db"}`,
                }}>
                  {inGroup ? "In group" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign program tab */}
      {tab === "assign" && (
        <div>
          <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.7", marginBottom: "14px" }}>
            Select a program to assign to all {members.length} client{members.length !== 1 ? "s" : ""} in this group simultaneously. This replaces their current active plan.
          </div>

          {members.length === 0 && (
            <div style={{ background: "#fff8f0", border: "1px solid #fcd34d", borderRadius: "8px", padding: "11px 13px", marginBottom: "12px", fontSize: "11px", color: "#92400e" }}>
              Add clients to this group first.
            </div>
          )}

          {programs.map(p => (
            <button key={p.id} onClick={() => setSelectedProgram(p.id === selectedProgram ? "" : p.id)}
              style={{
                width: "100%", background: selectedProgram === p.id ? "#f0f5ff" : "#fff",
                border: `1px solid ${selectedProgram === p.id ? "#2563a8" : "#e8e8e8"}`,
                borderRadius: "8px", padding: "11px 14px", marginBottom: "6px",
                display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textAlign: "left",
              }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: selectedProgram === p.id ? "#2563a8" : "#ddd", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#111" }}>{p.name}</div>
                {p.goal && <div style={{ fontSize: "10px", color: "#aaa" }}>{p.goal.replace(/_/g," ")} · {p.days_per_week} days/wk</div>}
              </div>
            </button>
          ))}

          {selectedProgram && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ background: "#f0f5ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "10px 13px", marginBottom: "10px", fontSize: "11px", color: "#1e40af" }}>
                Assigning <strong>{program?.name}</strong> to {members.length} client{members.length !== 1 ? "s": ""}: {clientsInGroup.map(c => c.name.split(" ")[0]).join(", ")}
              </div>
              <button onClick={handleAssign} disabled={assigning || members.length === 0} style={{
                width: "100%", background: assigning ? "#aaa" : "#1a1a1a", color: "#fff",
                border: "none", borderRadius: "9px", padding: "13px", fontSize: "13px",
                cursor: assigning ? "wait" : "pointer", fontWeight: "600", ...F,
              }}>
                {assigning ? "Assigning..." : `Assign to ${members.length} client${members.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {assignResult?.success && (
            <div style={{ marginTop: "10px", background: "#f0fff4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 13px", fontSize: "11px", color: "#2d7a1e" }}>
              Program assigned to {assignResult.count} client{assignResult.count !== 1 ? "s" : ""}. They'll see the new plan on their next login.
            </div>
          )}
          {assignResult?.error && (
            <div style={{ marginTop: "10px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 13px", fontSize: "11px", color: "#a02020" }}>
              Error: {assignResult.error}
            </div>
          )}
        </div>
      )}

      {/* Broadcast message tab */}
      {tab === "message" && (
        <div>
          <div style={{ fontSize: "11px", color: "#777", lineHeight: "1.7", marginBottom: "14px" }}>
            Send one message to all {members.length} client{members.length !== 1 ? "s" : ""} in this group. Each client receives it as an individual message in their Messages tab.
          </div>

          {members.length === 0 && (
            <div style={{ background: "#fff8f0", border: "1px solid #fcd34d", borderRadius: "8px", padding: "11px 13px", marginBottom: "12px", fontSize: "11px", color: "#92400e" }}>
              Add clients to this group first.
            </div>
          )}

          <textarea
            value={broadcast}
            onChange={e => setBroadcast(e.target.value)}
            placeholder={`Message to ${clientsInGroup.map(c => c.name.split(" ")[0]).join(", ") || "group members"}...`}
            rows={4}
            style={{ width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid #e4e0db", fontSize: "13px", resize: "none", lineHeight: "1.6", boxSizing: "border-box", marginBottom: "10px", ...F }}
          />

          <button onClick={handleBroadcast} disabled={!broadcast.trim() || sending || members.length === 0} style={{
            width: "100%", background: broadcast.trim() && members.length > 0 ? "#1a1a1a" : "#ddd",
            color: broadcast.trim() && members.length > 0 ? "#fff" : "#aaa",
            border: "none", borderRadius: "9px", padding: "13px", fontSize: "13px",
            cursor: broadcast.trim() && members.length > 0 ? "pointer" : "default",
            fontWeight: "600", ...F,
          }}>
            {sending ? "Sending..." : `Send to ${members.length} client${members.length !== 1 ? "s" : ""}`}
          </button>

          {sendResult?.success && (
            <div style={{ marginTop: "10px", background: "#f0fff4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 13px", fontSize: "11px", color: "#2d7a1e" }}>
              Sent to {sendResult.count} client{sendResult.count !== 1 ? "s" : ""}. Each client will see it in their Messages tab.
            </div>
          )}
          {sendResult?.error && (
            <div style={{ marginTop: "10px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 13px", fontSize: "11px", color: "#a02020" }}>
              Error: {sendResult.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
