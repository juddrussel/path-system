import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  CheckCheck, Trash2, Search, Clock, ChevronRight,
  ClipboardList, FileText, RefreshCw, MessageSquare, AlertTriangle,
  AlertCircle, Inbox, Bell, Lightbulb,
} from "lucide-react";

// ── Role-based nav visibility (mirrors Dashboard.jsx) ──────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Sidebar SVG Icons (mirrors Dashboard.jsx's Icon set, trimmed to what's
// used on this page + the same Bell icon added to the Dashboard sidebar) ───
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
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
};

// ── Sidebar Item (mirrors Dashboard.jsx) ────────────────────────────────────
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

// ─── Sample Data ────────────────────────────────────────────────────────────

const TABS = [
  { key: "all",           label: "All" },
  { key: "unread",        label: "Unread" },
  { key: "tasks",         label: "Tasks" },
  { key: "forms",         label: "Forms" },
  { key: "messages",      label: "Messages" },
  { key: "announcements", label: "Announcements" },
];

const NOTIFICATIONS = [
  {
    id: 1,
    category: "tasks",
    icon: ClipboardList,
    title: "New Workflow Assignment",
    time: "10 minutes ago",
    body: 'You have been assigned as the lead orchestrator for "Q3 Infrastructure Audit". Please review the project scope and initial tasks.',
    tags: [{ label: "ORCHESTRATION", tone: "purple" }, { label: "HIGH PRIORITY", tone: "red" }],
    unread: true,
    highlight: true,
  },
  {
    id: 2,
    category: "forms",
    icon: FileText,
    title: "Compliance Form Pending",
    time: "1 hour ago",
    body: 'The "Safety Protocol V4" form requires your digital signature before the end of the business day to maintain site certification.',
    tags: [{ label: "COMPLIANCE", tone: "blue" }],
    unread: true,
    highlight: true,
  },
  {
    id: 3,
    category: "announcements",
    icon: RefreshCw,
    title: "System Maintenance Scheduled",
    time: "3 hours ago",
    body: "PATH System will undergo scheduled maintenance this Sunday from 02:00 to 04:00 UTC. Some modules may be temporarily unavailable.",
    tags: [{ label: "SYSTEM", tone: "gray" }],
    unread: false,
    highlight: false,
  },
  {
    id: 4,
    category: "messages",
    icon: MessageSquare,
    title: "Message from Sarah Jenkins",
    time: "5 hours ago",
    body: "Hey Alex, I uploaded the revised process diagrams for the automation flow. Let me know if you need any adjustments.",
    tags: [{ label: "COLLABORATION", tone: "gray" }],
    unread: false,
    highlight: false,
  },
  {
    id: 5,
    category: "tasks",
    icon: AlertTriangle,
    title: "Task Overdue: Server Log Review",
    time: "Yesterday at 5:30 PM",
    body: 'The daily server log review task for "Cluster-B" is now 2 hours overdue. Please complete this as soon as possible.',
    tags: [{ label: "MONITORING", tone: "gray" }, { label: "HIGH PRIORITY", tone: "red" }],
    unread: true,
    highlight: true,
  },
];

const TAG_CFG = {
  purple: { bg: "#ede9fe", color: "#6d28d9" },
  red:    { bg: "#fee2e2", color: "#b91c1c" },
  blue:   { bg: "#dbeafe", color: "#1e40af" },
  gray:   { bg: "#f3f4f6", color: "#4b5563" },
};

// ─── Small building blocks ──────────────────────────────────────────────────

function Tag({ label, tone }) {
  const cfg = TAG_CFG[tone] ?? TAG_CFG.gray;
  return (
    <span style={{ fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: cfg.bg, color: cfg.color, letterSpacing: 0.3, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 34, height: 19, borderRadius: 20, cursor: "pointer",
        background: on ? "#7c3aed" : "#e5e7eb",
        display: "flex", alignItems: "center",
        padding: 2, transition: "background 0.15s",
      }}
    >
      <div style={{
        width: 15, height: 15, borderRadius: "50%", background: "white",
        transform: on ? "translateX(15px)" : "translateX(0)",
        transition: "transform 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
      }} />
    </div>
  );
}

// ─── Notifications Page ─────────────────────────────────────────────────────

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [settings, setSettings] = useState({ push: true, email: false, alerts: true });

  let role = "";
  try { role = JSON.parse(localStorage.getItem("user") || "{}")?.role || ""; } catch { /* noop */ }
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(role);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (activeTab === "unread" && !n.unread) return false;
      if (!["all", "unread"].includes(activeTab) && n.category !== activeTab) return false;
      if (query && !(`${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
  }, [notifications, activeTab, query]);

  const unreadCount = notifications.filter(n => n.unread).length;
  const readPct = notifications.length ? Math.round((unreadCount / notifications.length) * 100) : 0;
  const urgentCount = notifications.filter(n => n.tags.some(t => t.label === "HIGH PRIORITY")).length;
  const pendingTaskCount = notifications.filter(n => n.category === "tasks").length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, unread: false, highlight: false })));
  const clearAll = () => setNotifications([]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 200, background: "#1e1b2e", color: "#c8c4e0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <SbItem icon={<Icon.Bell />} label="Notifications" active={true} onClick={() => navigate("/notifications")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          {canViewAdminNav && <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => navigate("/reports")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Categories />} label="Document Categories" active={false} onClick={() => navigate("/document-categories")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          {canViewAdminNav && <SbItem icon={<Icon.SLA />} label="SLA Configuration" active={false} onClick={() => navigate("/sla-configuration")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>

        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input
                type="text"
                placeholder="Search tracking #, requester, keyword..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>
        </TopBar>

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "flex-start" }}>

            {/* ── Left: Notifications list ── */}
            <div>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: 21, fontWeight: 800, color: "#1e1b4b" }}>Notifications</h1>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Stay updated with your latest activities, tasks, and system alerts.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={markAllRead}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#7c3aed", background: "#fff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}
                  >
                    <CheckCheck style={{ width: 13, height: 13 }} /> Mark All as Read
                  </button>
                  <button
                    onClick={clearAll}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#6b7280", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", cursor: "pointer" }}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} /> Clear All
                  </button>
                </div>
              </div>

              {/* Tabs + search */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #ececf5", borderRadius: 10, padding: 4 }}>
                  {TABS.map(t => {
                    const active = activeTab === t.key;
                    return (
                      <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 11.5, fontWeight: 700, padding: "6px 12px", borderRadius: 7,
                          border: "none", cursor: "pointer", whiteSpace: "nowrap",
                          background: active ? "#7c3aed" : "transparent",
                          color: active ? "#fff" : "#6b7280",
                        }}
                      >
                        {t.label}
                        {t.key === "unread" && unreadCount > 0 && (
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#fff" : "#7c3aed", display: "inline-block" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", color: "#9ca3af", minWidth: 220 }}>
                  <Search style={{ width: 13, height: 13 }} />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    type="text"
                    placeholder="Search notifications..."
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
                  />
                </div>
              </div>

              {/* List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.length === 0 && (
                  <div style={{ background: "#fff", border: "1px solid #ececf5", borderRadius: 12, padding: "40px 20px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>
                    No notifications match this filter.
                  </div>
                )}
                {filtered.map(n => {
                  const NIcon = n.icon;
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex", gap: 12, padding: "14px 16px",
                        background: n.highlight ? "#faf8ff" : "#fff",
                        border: "1px solid #ececf5",
                        borderLeft: n.highlight ? "4px solid #7c3aed" : "1px solid #ececf5",
                        borderRadius: n.highlight ? "0 12px 12px 0" : 12,
                      }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: n.highlight ? "#ede9fe" : "#f3f4f6",
                        color: n.highlight ? "#7c3aed" : "#9ca3af",
                      }}>
                        <NIcon style={{ width: 16, height: 16 }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: n.highlight ? "#4c1d95" : "#111827" }}>{n.title}</p>
                            {n.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />}
                          </div>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#9ca3af", whiteSpace: "nowrap" }}>
                            <Clock style={{ width: 11, height: 11 }} /> {n.time}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#6b7280", marginTop: 5, lineHeight: 1.5 }}>{n.body}</p>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap", gap: 8 }}>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {n.tags.map(tag => <Tag key={tag.label} {...tag} />)}
                          </div>
                          <button
                            onClick={() => navigate("/tracking")}
                            style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "none", border: "none", cursor: "pointer" }}
                          >
                            View Details <ChevronRight style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer / pagination */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Showing {filtered.length} of {notifications.length} notifications</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, padding: "6px 12px", cursor: "not-allowed" }} disabled>Previous</button>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "#7c3aed", border: "1px solid #7c3aed", borderRadius: 7, padding: "6px 12px", cursor: "pointer" }}>Next</button>
                </div>
              </div>
            </div>

            {/* ── Right: Activity summary ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", padding: "4px 2px" }}>Activity Summary</div>

              {/* Unread items */}
              <div style={{ background: "#fff", border: "1px solid #ececf5", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>Unread Items</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#7c3aed", color: "#fff", padding: "2px 8px", borderRadius: 20 }}>{unreadCount}</span>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed", marginTop: 6 }}>{readPct}%</p>
                <div style={{ height: 5, borderRadius: 3, background: "#f3f4f6", marginTop: 8 }}>
                  <div style={{ height: 5, borderRadius: 3, background: "#7c3aed", width: `${readPct}%` }} />
                </div>
              </div>

              {/* Urgent alerts */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ececf5", borderRadius: 12, padding: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertCircle style={{ width: 16, height: 16, color: "#dc2626" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{urgentCount} Urgent Alerts</p>
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>Action required soon</p>
                </div>
              </div>

              {/* Pending tasks */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ececf5", borderRadius: 12, padding: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Inbox style={{ width: 16, height: 16, color: "#7c3aed" }} />
                </div>
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{pendingTaskCount} Pending Tasks</p>
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>Assigned across 3 workflows</p>
                </div>
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", padding: "10px 2px 0" }}>Notification Settings</div>

              <div style={{ background: "#fff", border: "1px solid #ececf5", borderRadius: 12, padding: "4px 16px" }}>
                {[
                  { key: "push",  label: "Push Notifications" },
                  { key: "email", label: "Email Summaries" },
                  { key: "alerts", label: "System Alerts" },
                ].map((row, i, arr) => (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4c1d95" }}>{row.label}</span>
                    <Toggle on={settings[row.key]} onChange={() => setSettings(s => ({ ...s, [row.key]: !s[row.key] }))} />
                  </div>
                ))}
              </div>

              <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 11.5, fontWeight: 700, color: "#7c3aed", background: "#fff", border: "1px solid #ddd6fe", borderRadius: 20, padding: "9px 14px", cursor: "pointer" }}>
                <Bell style={{ width: 13, height: 13 }} /> Manage Global Preferences
              </button>

              <div style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)", border: "1px solid #ddd6fe", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Lightbulb style={{ width: 13, height: 13, color: "#7c3aed" }} />
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#4c1d95" }}>Productivity Tip</p>
                </div>
                <p style={{ fontSize: 11, color: "#6d28d9", marginTop: 6, lineHeight: 1.5 }}>
                  Use keyboard shortcuts to quickly navigate: <strong>Shift + R</strong> marks all as read.
                </p>
                <button style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 6 }}>
                  Learn more shortcuts
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}