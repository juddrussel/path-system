import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "";
const API_BASE = `${API}/api`;
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API}${url}`;
}

const ROLE_LABELS = {
  admin: "Admin",
  program_chair: "Program Chair",
  user: "Faculty",
  guest: "Guest",
};
function formatRole(role) {
  return ROLE_LABELS[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User");
}

const AVATAR_COLORS = [
  ["#ede9fe", "#5b21b6"], ["#dbeafe", "#1d4ed8"], ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#e0f2fe", "#0369a1"],
];
function avatarBg(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function initials(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

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
  Logout: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
      <path d="M6 2H3.2a1 1 0 00-1 1v10a1 1 0 001 1H6" strokeLinecap="round" />
      <path d="M10 11l3.5-3-3.5-3M13.3 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Mark: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="17" height="17">
      <path d="M4.5 1.8h5l3 3V14.2H4.5z" strokeLinejoin="round" />
      <path d="M9.5 1.8v3h3M6.2 8h3.6M6.2 10.5h3.6" strokeLinecap="round" />
    </svg>
  ),
};

// ── Layout-only CSS (grouped nav, profile footer) ──────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;900&display=swap');
  .path-sidebar {
    box-sizing: border-box;
    width: 250px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 28px 20px 20px;
    border-right: 1px solid #ebe5f0;
    background: #f8f7fc;
    color: #40354a;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    position: sticky;
    top: 0;
    height: 100vh;
    flex-shrink: 0;
  }
  .path-sidebar *, .path-sidebar *::before, .path-sidebar *::after { box-sizing: border-box; }
  .path-sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 0 9px; }
  .path-sidebar__mark { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 9px; background: #7c3aed; color: #fff; box-shadow: 0 8px 17px rgba(124, 58, 237, .18); }
  .path-sidebar__name { color: #111827; font-size: 15px; font-weight: 700; letter-spacing: .1em; line-height: 1; }
  .path-sidebar__subname { display: block; margin-top: 4px; color: #a196aa; font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .path-sidebar__navigation { flex: 1; overflow-y: auto; padding-right: 2px; }
  .path-sidebar__group + .path-sidebar__group { margin-top: 22px; }
  .path-sidebar__group-label { display: block; margin: 0 9px 10px; color: #b1a7b7; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
  .path-sidebar__items { display: flex; flex-direction: column; gap: 3px; }
  .path-sidebar__item { width: 100%; display: flex; align-items: center; gap: 10px; min-height: 35px; border: 0; border-radius: 9px; padding: 0 11px; background: transparent; color: #6b7280; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; font-size: 13px !important; font-weight: 500 !important; line-height: normal !important; text-align: left; cursor: pointer; transition: background 160ms ease, color 160ms ease; }
  .path-sidebar__item:hover { background: rgba(124,58,237,0.06); color: #7c3aed; }
  .path-sidebar__item--active { background: linear-gradient(90deg, rgba(124,58,237,0.16), rgba(124,58,237,0.05)); color: #7c3aed; font-weight: 600 !important; }
  .path-sidebar__item--active:hover { background: linear-gradient(90deg, rgba(124,58,237,0.16), rgba(124,58,237,0.05)); }
  .path-sidebar__item-icon { display: grid; width: 16px; height: 16px; flex: 0 0 auto; place-items: center; opacity: .85; }
  .path-sidebar__item--active .path-sidebar__item-icon, .path-sidebar__item:hover .path-sidebar__item-icon { opacity: 1; }
  .path-sidebar__item-label { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .path-sidebar__badge { display: grid; min-width: 18px; height: 16px; place-items: center; border-radius: 99px; padding: 0 4px; background: #dc2626; color: #fff; font-size: 10px; font-weight: 700; }
  .path-sidebar__profile { display: flex; align-items: center; gap: 9px; border-top: 1px solid #ebe5f0; padding: 17px 8px 0; }
  .path-sidebar__profile-avatar { display: grid; width: 31px; height: 31px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #e9ddff; color: #7134d6; font-size: 10px; font-weight: 900; overflow: hidden; }
  .path-sidebar__profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .path-sidebar__profile-copy { min-width: 0; flex: 1; }
  .path-sidebar__profile-name { display: block; overflow: hidden; color: #4c3c56; font-size: 11px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
  .path-sidebar__profile-role { display: block; margin-top: 3px; color: #a096a8; font-size: 9px; font-weight: 600; text-transform: capitalize; }
  .path-sidebar__profile-menu-button { display: grid; width: 26px; height: 26px; flex: 0 0 auto; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #a69bac; cursor: pointer; }
  .path-sidebar__profile-menu-button:hover { background: #f7f3fb; color: #6d35c8; }
`;

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
  const [profile, setProfile] = useState(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/chat/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(d => { if (d) setUnreadTotal(d.count || 0); })
      .catch(() => {});
  }, [location.pathname]);

  // Fetch the full profile (name, avatar, role) from the API using the JWT
  // id, same pattern TopBar.jsx uses — falls back to the decoded token so
  // the sidebar still shows something if the request fails.
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const decoded = JSON.parse(atob(token.split(".")[1]));
      fetch(`${API_BASE}/users/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => (r.ok ? r.json() : null))
        .then(data => setProfile(data || decoded))
        .catch(() => setProfile(decoded));
    } catch {
      setProfile({});
    }
  }, []);

  const currentKey = activePage || [...NAV_ITEMS, ...ADMIN_NAV_ITEMS].find(
    n => location.pathname.startsWith(n.path)
  )?.key;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const badgeFor = key => (key === "inbox" ? unreadTotal : undefined);

  const manageItems = [
    ...(canViewAdminNav ? ADMIN_NAV_ITEMS : []),
    { key: "settings", icon: Icon.Settings, label: "Settings", path: null },
  ];

  const navGroups = [
    { label: "Workspace", items: NAV_ITEMS },
    { label: "Manage", items: manageItems },
  ];

  return (
    <>
      <style>{styles}</style>
      <aside className="path-sidebar" aria-label="Main navigation">
        {/* Brand */}
        <div className="path-sidebar__brand">
          <span className="path-sidebar__mark"><Icon.Mark /></span>
          <span>
            <span className="path-sidebar__name">DS PATH</span>
            <span className="path-sidebar__subname">Processing &amp; Tracking Hub</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="path-sidebar__navigation">
          {navGroups.map(group => {
            if (!group.items.length) return null;
            return (
              <section className="path-sidebar__group" key={group.label}>
                <span className="path-sidebar__group-label">{group.label}</span>
                <div className="path-sidebar__items">
                  {group.items.map(n => {
                    const isActive = currentKey === n.key;
                    const badge = badgeFor(n.key);
                    return (
                      <button
                        key={n.key}
                        type="button"
                        className={`path-sidebar__item${isActive ? " path-sidebar__item--active" : ""}`}
                        onClick={() => (n.path ? navigate(n.path) : undefined)}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="path-sidebar__item-icon"><n.icon /></span>
                        <span className="path-sidebar__item-label">{n.label}</span>
                        {badge > 0 && (
                          <span className="path-sidebar__badge">{badge > 99 ? "99+" : badge}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>

        {/* Profile / logout */}
        {(() => {
          const [bg, fg] = avatarBg(profile?.full_name || "");
          return (
            <div className="path-sidebar__profile">
              <span className="path-sidebar__profile-avatar" style={!profile?.avatar_url ? { background: bg, color: fg } : undefined}>
                {profile?.avatar_url ? (
                  <img src={fullAvatarUrl(profile.avatar_url)} alt="" />
                ) : (
                  initials(profile?.full_name)
                )}
              </span>
              <span className="path-sidebar__profile-copy">
                <span className="path-sidebar__profile-name">{profile?.full_name || profile?.username || "User"}</span>
                <span className="path-sidebar__profile-role">{formatRole(profile?.role || user.role)}</span>
              </span>
              <button
                className="path-sidebar__profile-menu-button"
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
              >
                <Icon.Logout />
              </button>
            </div>
          );
        })()}
      </aside>
    </>
  );
}