import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  Plus, Eye, Pencil, Archive, Trash2, Search, ChevronDown,
  Layers, CheckCircle2, Inbox as InboxIcon, BarChart3,
} from "lucide-react";

// ── Role-based nav visibility (matches Dashboard.jsx) ──────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Sidebar SVG Icons (kept identical to Dashboard.jsx) ─────────────────────
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
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
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
};

// ── Sidebar Item (identical to Dashboard.jsx) ───────────────────────────────
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

// ── Sample category data (mirrors the reference screenshot) ────────────────
const CATEGORIES = [
  {
    id: 1,
    name: "Faculty Task Assignment",
    code: "FTA-004",
    description: "Template for assigning tasks and deliverables to faculty members.",
    type: "Task",
    fields: 6,
    status: "Active",
    dateCreated: "Feb 10, 2024",
  },
  {
    id: 2,
    name: "Clearance Request",
    code: "CLR-003",
    description: "Submission form for student clearance processing.",
    type: "Form",
    fields: 4,
    status: "Active",
    dateCreated: "Feb 1, 2024",
  },
  {
    id: 3,
    name: "Completion Form",
    code: "CPF-002",
    description: "Form used by students to request completion of incomplete grades.",
    type: "Form",
    fields: 5,
    status: "Active",
    dateCreated: "Jan 20, 2024",
  },
  {
    id: 4,
    name: "Student Request Form",
    code: "SRF-001",
    description: "General student request form for academic-related concerns.",
    type: "Form",
    fields: 6,
    status: "Active",
    dateCreated: "Jan 15, 2024",
  },
  {
    id: 5,
    name: "Document Endorsement",
    code: "DEN-005",
    description: "Endorsement form for routing documents through approvers.",
    type: "Form",
    fields: 4,
    status: "Archived",
    dateCreated: "Nov 5, 2023",
  },
];

const TYPE_CFG = {
  Task: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  Form: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

const STATUS_CFG = {
  Active: { bg: "#ecfdf5", color: "#059669", dot: "#10b981" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
  Archived: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
};

const STATUS_FILTERS = ["All", "Active", "Inactive", "Archived"];

function ActionBtn({ children, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6, border: "1px solid transparent",
        background: "transparent", color: danger ? "#9ca3af" : "#6b7280",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? "#fef2f2" : "#f3f4f6";
        e.currentTarget.style.color = danger ? "#dc2626" : "#374151";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "#9ca3af" : "#6b7280";
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{
      flex: 1, background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "16px 18px",
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: valueColor || "#111827", margin: "6px 0 4px", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{sub}</p>
    </div>
  );
}

export default function DocumentCategories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Date Created");

  const role = (typeof window !== "undefined" && localStorage.getItem("role")) || "admin";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(role);
  const displayName = (typeof window !== "undefined" && localStorage.getItem("name")) || "PATH Administrator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalCategories = CATEGORIES.length;
  const activeCategories = CATEGORIES.filter(c => c.status === "Active").length;
  const archivedCategories = CATEGORIES.filter(c => c.status === "Archived").length;
  const usedThisMonth = 113;

  const filtered = useMemo(() => {
    return CATEGORIES.filter(c => {
      const matchesStatus = statusFilter === "All" ? true : c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q
        || c.name.toLowerCase().includes(q)
        || c.code.toLowerCase().includes(q)
        || c.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter]);

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

          {canViewAdminNav && <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => navigate("/reports")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-dashboard")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Categories />} label="Document Categories" active={true} onClick={() => navigate("/document-categories")} />}
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
                placeholder="Search categories..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus /> Add Category
            </button>
          </div>
        </TopBar>

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto", padding: "24px 28px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Document Categories</h1>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Create and manage document categories with custom form fields.</p>
            </div>
            <button
              onClick={() => {}}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                borderRadius: 9, border: "none", background: "#7c3aed", color: "white",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
              onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}
            >
              <Icon.Plus size={13} color="white" /> Add Category
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <StatCard label="Total Categories" value={totalCategories} sub={`${totalCategories - archivedCategories} non-archived`} />
            <StatCard label="Active Categories" value={activeCategories} valueColor="#059669" sub="Visible to users" />
            <StatCard label="Archived Categories" value={archivedCategories} valueColor="#d97706" sub="Hidden from users" />
            <StatCard label="Used This Month" value={usedThisMonth} valueColor="#2563eb" sub="Total submissions" />
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{
              flex: "1 1 320px", display: "flex", alignItems: "center", gap: 8,
              background: "white", border: "1px solid #e5e7eb", borderRadius: 9,
              padding: "10px 14px", color: "#9ca3af",
            }}>
              <Search style={{ width: 15, height: 15 }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search category name, code, or description..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12.5, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Status:</span>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", whiteSpace: "nowrap",
                    border: statusFilter === s ? "1px solid #7c3aed" : "1px solid #e5e7eb",
                    background: statusFilter === s ? "#7c3aed" : "white",
                    color: statusFilter === s ? "white" : "#6b7280",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Sort by:</span>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                border: "1px solid #e5e7eb", borderRadius: 8, background: "white",
                fontSize: 12, color: "#374151", fontWeight: 600, cursor: "pointer",
              }}>
                {sortBy} <ChevronDown style={{ width: 13, height: 13, color: "#9ca3af" }} />
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>{filtered.length} categories found</p>

          {/* Table */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
                  {["Category Name", "Code", "Description", "Type", "Fields", "Status", "Date Created", "Actions"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 7 ? "center" : "left", padding: "12px 16px",
                      fontSize: 10.5, fontWeight: 700, color: "#6b7280",
                      letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const tCfg = TYPE_CFG[c.type];
                  const sCfg = STATUS_CFG[c.status];
                  return (
                    <tr key={c.id} style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #f1f1f4" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#111827", maxWidth: 160 }}>{c.name}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: "#6b7280", background: "#f3f4f6",
                          border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                        }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#6b7280", maxWidth: 280 }}>{c.description}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                          background: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.border}`,
                        }}>
                          {c.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 600 }}>{c.fields}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          background: sCfg.bg, color: sCfg.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sCfg.dot, display: "inline-block" }} />
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#6b7280", whiteSpace: "nowrap" }}>{c.dateCreated}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                          <ActionBtn title="View"><Eye style={{ width: 14, height: 14 }} /></ActionBtn>
                          <ActionBtn title="Edit"><Pencil style={{ width: 14, height: 14 }} /></ActionBtn>
                          {c.status !== "Archived" && (
                            <ActionBtn title="Archive"><Archive style={{ width: 14, height: 14 }} /></ActionBtn>
                          )}
                          <ActionBtn title="Delete" danger><Trash2 style={{ width: 14, height: 14 }} /></ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No categories match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #f1f1f4" }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>Last updated: July 23, 2026</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>PATH v2.4 · Document Categories Module</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px", borderTop: "0.5px solid #e5e7eb", fontSize: 10, color: "#aaa", background: "white" }}>
          <span>© 2026 PATH Document Management System. All rights reserved.</span>
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
