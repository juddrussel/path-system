import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" />
    </svg>
  ),
  Plus: ({ color = "currentColor", size = 14 }) => (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}>
      <path d="M8 1v14M1 8h14" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  Workflow: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="6" cy="5" r="3" />
      <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Help: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
      <path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M11 2l3 3-8 8H3v-3L11 2z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4" strokeLinecap="round" />
    </svg>
  ),
  Copy: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <rect x="5" y="5" width="9" height="9" rx="1" />
      <path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M13.5 8a5.5 5.5 0 10-1.6 3.9" strokeLinecap="round" />
      <path d="M14 5v3.2h-3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),

  // ── Stat card icons ──
  WorkflowStat: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="16" height="16">
      <circle cx="4" cy="4" r="2.2" />
      <circle cx="12" cy="4" r="2.2" />
      <circle cx="8" cy="12" r="2.2" />
      <path d="M5.6 5.6L7 10M10.4 5.6L9 10" strokeLinecap="round" />
    </svg>
  ),
  CheckCircle: ({ color = "#059669" }) => (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5 8l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  PencilDraft: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" width="16" height="16">
      <path d="M11 2l3 3-8.5 8.5L2 14l.5-3.5L11 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" width="16" height="16">
      <path d="M8 2l6 3-6 3-6-3 6-3z" strokeLinejoin="round" />
      <path d="M2 8l6 3 6-3M2 11l6 3 6-3" strokeLinejoin="round" />
    </svg>
  ),

  // ── Step preview icons ──
  Branch: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
      <circle cx="4" cy="3" r="1.4" />
      <circle cx="4" cy="13" r="1.4" />
      <circle cx="12" cy="8" r="1.4" />
      <path d="M4 4.4v3a3 3 0 003 3h3.5M4 11.6V8" />
    </svg>
  ),
  Forward: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
      <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
      <rect x="2" y="3" width="12" height="3" rx="0.5" />
      <path d="M3 6v6a1 1 0 001 1h8a1 1 0 001-1V6M6.5 9h3" strokeLinecap="round" />
    </svg>
  ),
  Dot: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
      <circle cx="8" cy="8" r="3" />
    </svg>
  ),
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeStyles = {
  published: { background: "#d1fae5", color: "#065f46" },
  draft: { background: "#fef3c7", color: "#92400e" },
  archived: { background: "#f3f4f6", color: "#6b7280" },
};

function Badge({ status }) {
  const s = badgeStyles[status?.toLowerCase()] || badgeStyles.draft;
  return (
    <span style={{
      ...s,
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: "bold",
      whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

// ── Date formatting ──────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ── Normalize a workflow record from the API ─────────────────────────────────
// Handles workflows saved from WorkflowDesigner, which persist `nodes`/`edges`
// plus a derived `steps` (ordered names) and `sla` string.
function normalizeWorkflow(wf) {
  const steps = Array.isArray(wf.steps) && wf.steps.length
    ? wf.steps
    : Array.isArray(wf.nodes)
      ? wf.nodes.map(n => n.name || n.label).filter(Boolean)
      : [];

  const sla = wf.sla || (Array.isArray(wf.nodes)
    ? `${wf.nodes.reduce((sum, n) => sum + (n.slaDays || 0), 0)}d`
    : "—");

  const description = wf.description || (steps.length
    ? `${steps.length}-step workflow: ${steps[0]} → ${steps[steps.length - 1]}`
    : "No description provided.");

  return {
    ...wf,
    steps,
    sla,
    active_docs: wf.active_docs ?? 0,
    description,
    modified_at: formatDate(wf.modified_at || wf.updated_at || wf.created_at),
    modified_by: wf.modified_by || wf.updated_by || wf.created_by || wf.author || "—",
  };
}

// ── Step icon resolver ───────────────────────────────────────────────────────
function getStepIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("intake")) return { icon: <Icon.Inbox />, color: "#7c3aed", bg: "#ede9fe" };
  if (n.includes("form") || n.includes("submission")) return { icon: <Icon.Forms />, color: "#2563eb", bg: "#dbeafe" };
  if (n.includes("forward") || n.includes("routing") || n.includes("office")) return { icon: <Icon.Forward />, color: "#2563eb", bg: "#dbeafe" };
  if (n.includes("decision") || n.includes("check") || n.includes("role")) return { icon: <Icon.Branch />, color: "#d97706", bg: "#fef3c7" };
  if (n.includes("approval") || n.includes("acknowledg") || n.includes("completed")) return { icon: <Icon.CheckCircle color="#059669" />, color: "#059669", bg: "#d1fae5" };
  if (n.includes("review")) return { icon: <Icon.Eye />, color: "#7c3aed", bg: "#ede9fe" };
  if (n.includes("assign") || n.includes("task")) return { icon: <Icon.AssignTask />, color: "#7c3aed", bg: "#ede9fe" };
  if (n.includes("archiv")) return { icon: <Icon.Archive />, color: "#9ca3af", bg: "#f3f4f6" };
  return { icon: <Icon.Dot />, color: "#9ca3af", bg: "#f3f4f6" };
}

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        color: active ? "white" : "#c8c4e0",
        fontSize: 12,
        cursor: "pointer",
        borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent",
        background: active ? "rgba(124,58,237,0.18)" : "transparent",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

// ── Small reusable action button ──────────────────────────────────────────────
function ActionBtn({ children, onClick, title, color, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26, borderRadius: 6,
        border: `0.5px solid ${hov && danger ? "#fca5a5" : hov && color ? "#c4b5fd" : "#e5e7eb"}`,
        background: hov && danger ? "#fee2e2" : hov && color ? "#ede9fe" : "white",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: danger ? (hov ? "#dc2626" : "#666") : color || "#666",
        padding: 0,
      }}
    >
      {children}
    </button>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, bg }) {
  return (
    <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "#111", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ── Workflow Card ────────────────────────────────────────────────────────────
function WorkflowCard({ wf, onEdit, onDuplicate, onDelete }) {
  const steps = wf.steps || [];
  const visibleSteps = steps.slice(0, 4);
  const remaining = steps.length - visibleSteps.length;

  return (
    <div style={{ background: "#faf9fd", border: "0.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Step preview */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleSteps.map((step, i) => {
          const { icon, color, bg } = getStepIcon(step);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <span style={{ fontSize: 12, color: "#444" }}>{step}</span>
            </div>
          );
        })}
        {remaining > 0 && (
          <div style={{ fontSize: 11, color: "#aaa", paddingLeft: 28 }}>+{remaining} more steps</div>
        )}
      </div>

      {/* Detail panel */}
      <div style={{ background: "white", borderTop: "0.5px solid #e5e7eb", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon.Workflow />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#111" }}>{wf.name}</div>
              <Badge status={wf.status} />
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 3, lineHeight: 1.5 }}>{wf.description}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#888" }}>
          <span><Icon.Tasks /> {" "}{steps.length} steps</span>
          <span>· SLA: {wf.sla || "—"}</span>
          <span>· {wf.active_docs || 0} active docs</span>
        </div>

        <div style={{ borderTop: "0.5px solid #f0f0f0", marginTop: "auto", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 10, color: "#aaa" }}>
            Modified {wf.modified_at} by {wf.modified_by}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <ActionBtn color="#7c3aed" title="Edit" onClick={() => onEdit(wf)}><Icon.Edit /></ActionBtn>
            <ActionBtn title="Duplicate" onClick={() => onDuplicate(wf)}><Icon.Copy /></ActionBtn>
            <ActionBtn danger title="Delete" onClick={() => onDelete(wf)}><Icon.Trash /></ActionBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create New Workflow Card ────────────────────────────────────────────────
function CreateWorkflowCard({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        border: `1.5px dashed ${hov ? "#7c3aed" : "#d8d4e8"}`,
        borderRadius: 12,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, cursor: "pointer", minHeight: 240,
        background: hov ? "#faf5ff" : "transparent",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ede9fe", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon.Plus size={18} />
      </div>
      <div style={{ fontSize: 13, fontWeight: "bold", color: "#7c3aed" }}>Create New Workflow</div>
      <div style={{ fontSize: 11, color: "#999" }}>Start from scratch or pick a template</div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function WorkflowDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:5000/api";

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/workflows`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setWorkflows((data.data || []).map(normalizeWorkflow));
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleEdit = (wf) => {
    navigate("/workflow-designer", { state: { workflowId: wf.id } });
  };

  const handleDuplicate = async (wf) => {
    try {
      const res = await fetch(`${API}/workflows/${wf.id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to duplicate workflow.");
      fetchWorkflows();
    } catch {
      window.alert("Could not duplicate this workflow. Please try again.");
    }
  };

  const handleDelete = async (wf) => {
    if (!window.confirm(`Delete "${wf.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API}/workflows/${wf.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchWorkflows();
    } catch {
      window.alert("Could not delete this workflow. Please try again.");
    }
  };

  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

  // ── Derived stats ──
  const stats = useMemo(() => {
    const total = workflows.length;
    const published = workflows.filter(w => w.status === "Published").length;
    const draft = workflows.filter(w => w.status === "Draft").length;
    const archived = workflows.filter(w => w.status === "Archived").length;
    const activeDocs = workflows.reduce((sum, w) => sum + (w.active_docs || 0), 0);
    return { total, published, draft, archived, activeDocs };
  }, [workflows]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    return workflows.filter(w => {
      if (statusFilter !== "All" && w.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const inName = (w.name || "").toLowerCase().includes(q);
        const inAuthor = (w.modified_by || "").toLowerCase().includes(q);
        if (!inName && !inAuthor) return false;
      }
      return true;
    });
  }, [workflows, search, statusFilter]);

  const filterPills = [
    { key: "All", label: `All (${stats.total})` },
    { key: "Published", label: `Published (${stats.published})` },
    { key: "Draft", label: `Draft (${stats.draft})` },
    { key: "Archived", label: `Archived (${stats.archived})` },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 200, background: "#1e1b2e", color: "#c8c4e0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        {/* Nav */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={true} onClick={() => navigate("/workflow-dashboard")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>

        {/* Bottom */}
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <button onClick={() => navigate("/workflow-designer")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus color="white" /> Create Workflow
            </button>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minWidth: 0 }}>

          {/* Page Header */}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#111" }}>Workflow Designer</h1>
            <p style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
              Create, customize, and automate document approval workflows
            </p>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <StatCard icon={<Icon.WorkflowStat />} value={loading ? "—" : stats.total} label="Total Workflows" bg="#ede9fe" />
            <StatCard icon={<Icon.CheckCircle />} value={loading ? "—" : stats.published} label="Published" bg="#d1fae5" />
            <StatCard icon={<Icon.PencilDraft />} value={loading ? "—" : stats.draft} label="Drafts" bg="#fef3c7" />
            <StatCard icon={<Icon.Layers />} value={loading ? "—" : stats.activeDocs} label="Active Documents" bg="#dbeafe" />
          </div>

          {/* Search + Refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search workflows by name or author..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <button onClick={fetchWorkflows} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Refresh /> Refresh
            </button>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: "bold", color: "#333", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon.Filter /> Filter:
            </span>
            {filterPills.map(p => (
              <span
                key={p.key}
                onClick={() => setStatusFilter(p.key)}
                style={{
                  fontSize: 11, fontWeight: "bold", padding: "6px 14px", borderRadius: 20, cursor: "pointer",
                  background: statusFilter === p.key ? "#7c3aed" : "#f3f4f6",
                  color: statusFilter === p.key ? "white" : "#666",
                }}
              >
                {p.label}
              </span>
            ))}
          </div>

          {/* Workflow Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <CreateWorkflowCard onClick={() => navigate("/workflow-designer")} />
            {loading ? (
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 12 }}>
                Loading workflows...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 12 }}>
                No workflows match your search.
              </div>
            ) : filtered.map(wf => (
              <WorkflowCard
                key={wf.id}
                wf={wf}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px", borderTop: "0.5px solid #e5e7eb", fontSize: 10, color: "#aaa", background: "white" }}>
          <span>© 2024 PATH Document Management System. All rights reserved.</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              System Operational
            </span>
            <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>

      </div>
    </div>
  );
}
