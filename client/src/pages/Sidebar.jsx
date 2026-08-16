import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

// ── Sidebar SVG Icons ────────────────────────────────────────────────────────
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
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1.5a1 1 0 011 1v.6c2 .4 3.5 2.2 3.5 4.4v2.4l1.2 1.9c.2.3 0 .8-.4.8H2.7c-.4 0-.6-.5-.4-.8L3.5 10V7.5c0-2.2 1.5-4 3.5-4.4v-.6a1 1 0 011-1z" />
      <path d="M6.2 13.5a1.8 1.8 0 003.6 0z" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" />
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
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
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
};

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick, badge }) {
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
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8,
          background: "#dc2626", color: "white", fontSize: 10, fontWeight: "bold",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );
}

// Maps a URL path to the nav key it should highlight as active.
const NAV_ITEMS = [
  { key: "dashboard", icon: Icon.Grid, label: "Dashboard", path: "/dashboard" },
  { key: "inbox", icon: Icon.Inbox, label: "Inbox / Received", path: "/inbox" },
  { key: "tasks", icon: Icon.Tasks, label: "My Tasks", path: "/tasks" },
  { key: "forms", icon: Icon.Forms, label: "Forms", path: "/forms" },
  { key: "tracking", icon: Icon.Tracking, label: "Tracking", path: "/tracking" },
  { key: "notifications", icon: Icon.Bell, label: "Notifications", path: "/notifications" },
];

const ADMIN_NAV_ITEMS = [
  { key: "reports", icon: Icon.Reports, label: "Reports", path: "/reports" },
  { key: "document-categories", icon: Icon.Categories, label: "Document Categories", path: "/document-categories" },
  { key: "users", icon: Icon.Users, label: "Users & Roles", path: "/users" },
  { key: "audit", icon: Icon.Shield, label: "Audit Trail", path: "/audit" },
  { key: "assign-task", icon: Icon.AssignTask, label: "Assign Task", path: "/assign-task" },
  { key: "task-assigned", icon: Icon.AssignTask, label: "Tasks Assigned", path: "/task-assigned" },
  { key: "sla-configuration", icon: Icon.SLA, label: "SLA Configuration", path: "/sla-configuration" },
];

/**
 * Shared app sidebar. Drop this into any page — it figures out the active
 * item from the current URL and fetches the unread-message badge itself,
 * so every page automatically stays in sync.
 *
 * Usage: <Sidebar />
 * Optional: <Sidebar activePage="tasks" /> to override auto-detection.
 */
export default function Sidebar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/chat/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(d => { if (d) setUnreadTotal(d.count || 0); })
      .catch(() => {});
  }, [location.pathname]);

  const currentKey = activePage || [...NAV_ITEMS, ...ADMIN_NAV_ITEMS].find(
    n => location.pathname.startsWith(n.path)
  )?.key;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const badgeFor = key => (key === "inbox" ? unreadTotal : undefined);

  return (
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
        {NAV_ITEMS.map(n => (
          <SbItem
            key={n.key}
            icon={<n.icon />}
            label={n.label}
            active={currentKey === n.key}
            onClick={() => navigate(n.path)}
            badge={badgeFor(n.key)}
          />
        ))}

        {canViewAdminNav && (
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>
            Administration
          </div>
        )}
        {canViewAdminNav && ADMIN_NAV_ITEMS.map(n => (
          <SbItem
            key={n.key}
            icon={<n.icon />}
            label={n.label}
            active={currentKey === n.key}
            onClick={() => navigate(n.path)}
          />
        ))}

        <SbItem icon={<Icon.Settings />} label="Settings" active={currentKey === "settings"} onClick={() => { }} />
      </div>

      {/* Bottom */}
      <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
        <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
        <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
      </div>
    </div>
  );
}