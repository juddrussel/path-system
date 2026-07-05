import { useState, useEffect } from "react";
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
  Download: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12">
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" />
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
  Clock: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l2 2" strokeLinecap="round" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" width="14" height="14">
      <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3M8 10v1" strokeLinecap="round" />
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
  Doc: () => (
    <svg viewBox="0 0 16 16" fill="#7c3aed" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>)

};

// ── Badge ─────────────────────────────────────────────────────────────────────
const badgeStyles = {
  pending: { background: "#fef3c7", color: "#92400e" },
  approved: { background: "#d1fae5", color: "#065f46" },
  reviewing: { background: "#ede9fe", color: "#5b21b6" },
  draft: { background: "#f3f4f6", color: "#374151" },
  urgent: { background: "#fee2e2", color: "#991b1b" },
  high: { background: "#fef3c7", color: "#92400e" },
  medium: { background: "#ede9fe", color: "#5b21b6" },
  low: { background: "#d1fae5", color: "#065f46" },
};

function Badge({ type, label }) {
  const s = badgeStyles[type?.toLowerCase()] || badgeStyles.draft;
  return (
    <span style={{
      ...s,
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: "bold",
    }}>
      {label}
    </span>
  );
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ department: "", status: "", priority: "", date: "" });
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState({ total: 0, draft: 0, registered: 0, urgent: 0 });
  const [pulse, setPulse] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchDashboard();
  }, [filters, search]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, q: search }).toString();
      const res = await fetch(`${API}/api/dashboard?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setDocs(data.recent_docs || []);
      setStats(data.stats || { total: 0, draft: 0, registered: 0, urgent: 0 });
      setPulse(data.pulse_docs || []);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, trackingId) => {
    if (!window.confirm(`Delete ${trackingId}?`)) return;
    await fetch(`${API}/api/documents/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchDashboard();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName = user.username || "User";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

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
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={true} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>
          
          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-dashboard")} />}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracking #, requester, keyword..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus /> New Document
            </button>
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Download /> Intake Document
            </button>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minWidth: 0 }}>

            {/* Page Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: "bold", color: "#111" }}>Operational Dashboard</h1>
                <p style={{ fontSize: 12, color: "#666", marginTop: 3 }}>
                  Welcome back, <strong>{displayName}</strong>. Here's what's happening today.
                </p>
              </div>
              <button onClick={() => navigate("/documents")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: "bold", cursor: "pointer", border: "1px solid #ddd", background: "white", color: "#333" }}>
                <Icon.Reports /> View All Documents
              </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Total Documents", value: stats.total, delta: "All time", icon: <Icon.Doc />, bg: "#ede9fe" },
                { label: "Pending / Draft", value: stats.draft, delta: "Awaiting action", icon: <Icon.Clock />, bg: "#fef3c7" },
                { label: "Registered", value: stats.registered, delta: "Completed intake", icon: <Icon.Check />, bg: "#d1fae5" },
                { label: "Urgent Items", value: stats.urgent, delta: "High priority", icon: <Icon.Alert />, bg: "#fee2e2" },
              ].map(({ label, value, delta, icon, bg }) => (
                <div key={label} style={{ background: "#f8f5ff", borderRadius: 10, padding: "14px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#111" }}>{loading ? "—" : value}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 5 }}>{delta}</div>
                  <div style={{ position: "absolute", right: 14, top: 14, width: 30, height: 30, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Icon.Filter />
              <span style={{ fontSize: 12, fontWeight: "bold", color: "#333" }}>Filters</span>
              {[
                { key: "department", label: "Department", options: ["All", "Human Resources", "Finance", "Operations", "Legal"] },
                { key: "status", label: "Status", options: ["All", "Draft", "Registered"] },
                { key: "priority", label: "Priority", options: ["All", "Low", "Medium", "High", "Urgent"] },
              ].map(({ key, label, options }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f9", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#666" }}>
                  <span>{label}</span>
                  <select
                    value={filters[key]}
                    onChange={e => setFilters(f => ({ ...f, [key]: e.target.value === "All" ? "" : e.target.value }))}
                    style={{ border: "none", background: "transparent", fontSize: 11, color: "#333", outline: "none", cursor: "pointer" }}
                  >
                    {options.map(o => <option key={o} value={o === "All" ? "" : o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9f9f9", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 11, color: "#666" }}>
                <span>Date</span>
                <input type="date" value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} style={{ border: "none", background: "transparent", fontSize: 11, color: "#333", outline: "none", cursor: "pointer" }} />
              </div>
            </div>

            {/* Recent Documents Table */}
            <div style={{ background: "white", border: "0.5px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: "bold", color: "#111" }}>Recent Documents</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Live tracking of active document workflows</div>
                </div>
                <button onClick={() => navigate("/documents/new")} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: "bold" }}>
                  + New
                </button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead>
                  <tr>
                    {["Tracking #", "Subject & Type", "Status", "Priority", "Department", "Actions"].map((h, i) => (
                      <th key={h} style={{ fontSize: 10, color: "#999", letterSpacing: 0.5, textTransform: "uppercase", padding: "9px 16px", textAlign: "left", borderBottom: "0.5px solid #e5e7eb", background: "#fafafa", width: ["18%", "28%", "13%", "13%", "18%", "10%"][i] }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 28, color: "#aaa", fontSize: 12 }}>Loading...</td>
                    </tr>
                  ) : docs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 28, color: "#aaa", fontSize: 12 }}>
                        No documents yet.{" "}
                        <span onClick={() => navigate("/documents/new")} style={{ color: "#7c3aed", fontWeight: "bold", cursor: "pointer" }}>
                          Create your first intake →
                        </span>
                      </td>
                    </tr>
                  ) : docs.map(doc => (
                    <tr key={doc.id} onMouseEnter={e => e.currentTarget.querySelectorAll("td").forEach(td => td.style.background = "#fafafa")} onMouseLeave={e => e.currentTarget.querySelectorAll("td").forEach(td => td.style.background = "")}>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#7c3aed", fontWeight: "bold", borderBottom: "0.5px solid #f0f0f0", cursor: "pointer" }}>
                        {doc.tracking_id}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#333", borderBottom: "0.5px solid #f0f0f0" }}>
                        {(doc.title || "(No title)").slice(0, 30)}
                        <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", marginTop: 2 }}>{doc.document_type || "–"}</div>
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
                        <Badge type={doc.status === "Registered" ? "approved" : "draft"} label={doc.status} />
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
                        <Badge type={doc.priority?.toLowerCase()} label={doc.priority} />
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#333", borderBottom: "0.5px solid #f0f0f0" }}>
                        {doc.department || "–"}
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "0.5px solid #f0f0f0" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <ActionBtn color="#059669" title="View" onClick={() => navigate(`/documents/${doc.id}`)}><Icon.Eye /></ActionBtn>
                          <ActionBtn color="#7c3aed" title="Edit" onClick={() => navigate(`/documents/${doc.id}/edit`)}><Icon.Edit /></ActionBtn>
                          <ActionBtn danger title="Delete" onClick={() => handleDelete(doc.id, doc.tracking_id)}><Icon.Trash /></ActionBtn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: "9px 16px", fontSize: 11, color: "#aaa", borderTop: "0.5px solid #f0f0f0" }}>
                Showing {docs.length} of {stats.total} document{stats.total !== 1 ? "s" : ""} ·{" "}
                <span onClick={() => navigate("/documents")} style={{ color: "#7c3aed", cursor: "pointer" }}>View all</span>
              </div>
            </div>

          </div>

          {/* ── Live Pulse Panel ── */}
          <div style={{ width: 200, borderLeft: "0.5px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "0.5px solid #e5e7eb", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: "bold", color: "#333" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                Live Pulse
              </div>
              <span style={{ fontSize: 9, color: "#059669", background: "#d1fae5", padding: "2px 7px", borderRadius: 20, fontWeight: "bold" }}>
                Real-Time
              </span>
            </div>

            <div style={{ flex: 1 }}>
              {pulse.length === 0 ? (
                <div style={{ padding: "16px 12px", fontSize: 11, color: "#aaa", textAlign: "center" }}>No recent activity.</div>
              ) : pulse.map((doc, i) => {
                const initials = ((doc.created_by_name || "?")[0] || "?").toUpperCase();
                return (
                  <div key={i} style={{ padding: "9px 12px", borderBottom: "0.5px solid #f0f0f0", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: "bold", flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: "bold", color: "#333" }}>{doc.created_by_name || "Unknown"}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{doc.status}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#7c3aed", marginBottom: 2 }}>{doc.tracking_id}</div>
                    <div style={{ fontSize: 10, color: "#bbb" }}>{doc.time_ago} ago</div>
                  </div>
                );
              })}
            </div>

            {canViewAdminNav && (
              <div onClick={() => navigate("/audit")} style={{ textAlign: "center", padding: 10, fontSize: 11, color: "#7c3aed", borderTop: "0.5px solid #e5e7eb", cursor: "pointer", fontWeight: "bold" }}
                onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                View Full Audit Log
              </div>
            )}
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
