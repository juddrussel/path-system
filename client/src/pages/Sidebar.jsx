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

// ── Palette ───────────────────────────────────────────────────────────────
const COLORS = {
  bg: "#f8f7fc",
  border: "rgba(15,10,40,0.08)",
  textMuted: "#6b7280",
  textActive: "#7c3aed",
  activePill: "#ece7fb",
  accent: "#7c3aed",
  heading: "#111827",
};

// ── Sidebar SVG Icons ────────────────────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
      <rect x="1" y="1" width="6" height="6" rx="1.3" />
      <rect x="9" y="1" width="6" height="6" rx="1.3" />
      <rect x="1" y="9" width="6" height="6" rx="1.3" />
      <rect x="9" y="9" width="6" height="6" rx="1.3" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M2 3.5h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9z" strokeLinejoin="round" />
      <path d="M2 3.5l6 5 6-5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <path d="M5 8.3l2 2 4-4.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M4 1.5h6l3 3V13a1 1 0 01-1 1H4a1 1 0 01-1-1V2.5a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M5.5 7.5h5M5.5 10h5M5.5 5h2.5" strokeLinecap="round" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M8 1.5c1 0 1.5.6 1.5 1.3S9 4 8 4 6.5 3.4 6.5 2.8 7 1.5 8 1.5z" />
      <path d="M8 4v3.2M3.5 14.5c0-2.8 2-4.3 4.5-4.3s4.5 1.5 4.5 4.3" strokeLinecap="round" />
      <circle cx="8" cy="9.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M8 1.8a1 1 0 011 1v.5c2 .4 3.4 2.1 3.4 4.2v2.3l1.1 1.8c.2.3 0 .8-.4.8H2.9c-.4 0-.6-.5-.4-.8L3.6 9.8V7.5c0-2.1 1.4-3.8 3.4-4.2v-.5a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M6.3 13.4a1.7 1.7 0 003.4 0" strokeLinecap="round" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M2.5 13.5h11" strokeLinecap="round" />
      <rect x="3" y="9" width="2.2" height="4.5" />
      <rect x="6.9" y="6" width="2.2" height="7.5" />
      <rect x="10.8" y="3" width="2.2" height="10.5" />
    </svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M8 1.8l6 3-6 3-6-3 6-3z" strokeLinejoin="round" />
      <path d="M2 8l6 3 6-3M2 11l6 3 6-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <circle cx="6" cy="5" r="2.6" />
      <path d="M1.2 14c0-2.8 2-4.6 4.8-4.6s4.8 1.8 4.8 4.6" strokeLinecap="round" />
      <path d="M10.8 3c1.5.2 2.6 1.4 2.6 2.9 0 1.4-1 2.6-2.4 2.9M12.5 10.2c1.5.5 2.5 1.8 2.5 3.8" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M8 1.5l5.2 1.9v3.8c0 3.4-2.2 6-5.2 7-3-.9-5.2-3.6-5.2-7V3.4L8 1.5z" strokeLinejoin="round" />
      <path d="M5.7 8l1.6 1.6 3-3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <circle cx="5.5" cy="4.5" r="2.2" />
      <path d="M1.3 13.5c0-2.5 1.8-4 4.2-4 .8 0 1.5.15 2.1.45" strokeLinecap="round" />
      <path d="M11.5 4v5.5M8.9 6.75h5.2" strokeLinecap="round" />
    </svg>
  ),
  TaskAssigned: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <rect x="3" y="2.5" width="10" height="11.5" rx="1.3" />
      <path d="M6 2v1.6h4V2" strokeLinecap="round" />
      <path d="M5.5 8h5M5.5 10.5h3.2" strokeLinecap="round" />
    </svg>
  ),
  SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <circle cx="8" cy="8" r="6.3" />
      <path d="M8 4.6v3.6l2.5 1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1.6v1.5M8 12.9v1.5M2.9 4.4l1.1 1.1M12 10.5l1.1 1.1M1.6 8h1.5M12.9 8h1.5M2.9 11.6l1.1-1.1M12 5.5l1.1-1.1" strokeLinecap="round" />
    </svg>
  ),
  Collapse: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M5.7 2.5v11" />
    </svg>
  ),
  Chevron: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="12" height="12">
      <path d="M4.5 6.5L8 10l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M6 2H3.2a1 1 0 00-1 1v10a1 1 0 001 1H6" strokeLinecap="round" />
      <path d="M10 11l3.5-3-3.5-3M13.3 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick, badge }) {
  const [hover, setHover] = useState(false);
  const highlighted = active || hover;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "2px 12px",
        padding: "8px 11px",
        borderRadius: 10,
        color: highlighted ? COLORS.textActive : COLORS.textMuted,
        fontSize: 13,
        fontWeight: highlighted ? 600 : 500,
        cursor: "pointer",
        background: active
          ? "linear-gradient(90deg, rgba(124,58,237,0.16), rgba(124,58,237,0.05))"
          : hover ? "rgba(124,58,237,0.06)" : "transparent",
        border: "1px solid transparent",
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
      }}
    >
      <span style={{ display: "flex", opacity: highlighted ? 1 : 0.85, flexShrink: 0 }}>{icon}</span>
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
  { key: "inbox", icon: Icon.Inbox, label: "Inbox", path: "/inbox" },
  { key: "tasks", icon: Icon.Tasks, label: "My Tasks", path: "/tasks" },
  { key: "forms", icon: Icon.Forms, label: "Forms", path: "/forms" },
  { key: "tracking", icon: Icon.Tracking, label: "Tracking", path: "/tracking" },
  { key: "notifications", icon: Icon.Bell, label: "Notifications", path: "/notifications" },
];

const ADMIN_NAV_ITEMS = [
  { key: "reports", icon: Icon.Reports, label: "Reports", path: "/reports" },
  { key: "document-categories", icon: Icon.Categories, label: "Categories", path: "/document-categories" },
  { key: "users", icon: Icon.Users, label: "Users", path: "/users" },
  { key: "audit", icon: Icon.Shield, label: "Audit Trail", path: "/audit" },
  { key: "assign-task", icon: Icon.AssignTask, label: "Assign Task", path: "/assign-task" },
  { key: "task-assigned", icon: Icon.TaskAssigned, label: "Tasks Assigned", path: "/task-assigned" },
  { key: "sla-configuration", icon: Icon.SLA, label: "SLA Config", path: "/sla-configuration" },
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
      width: 220, background: COLORS.bg, color: COLORS.textMuted,
      display: "flex", flexDirection: "column", flexShrink: 0,
      minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      fontFamily: "inherit", borderRight: `1px solid ${COLORS.border}`,
    }}>
      {/* Logo */}
      <div style={{
        padding: "16px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: COLORS.accent, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
          }}>
            DS
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.heading, letterSpacing: 1.5 }}>
            DS PATH
          </span>
        </div>
        <span style={{ color: "#9ca3af", cursor: "pointer", display: "flex" }}>
          <Icon.Collapse />
        </span>
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
          <div style={{
            fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: 1,
            padding: "16px 22px 6px", textTransform: "uppercase",
          }}>
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
      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: "12px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, color: "#9ca3af",
        }}>
          <span>v1.0.0</span>
          <span onClick={handleLogout} style={{ cursor: "pointer", display: "flex", color: "#9ca3af" }}>
            <Icon.Logout />
          </span>
        </div>
      </div>
    </div>
  );
}