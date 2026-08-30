import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { socket, connectSocket } from "./socket";
import {
  CheckCheck,
  Trash2,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  AlertCircle,
  Inbox,
  Bell,
  Lightbulb,
  MessageSquare,
  Paperclip,
  CalendarClock,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l3 2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
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
      <rect
        x="9"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
      <rect
        x="1.5"
        y="9"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
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
      <path
        d="M2 2h8l3 3v9H2V2z"
        fillOpacity=".15"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M2 2h8l3 3v9H2V2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5 7h6M5 9.5h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path
        d="M11.5 12.5l.8.8 1.4-1.4"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  SLA: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path
        d="M8 4.5v3.8l2.6 1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="2" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Help: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
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
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
};

// ── Realtime Toast (mirrors TaskAssigned.jsx's Toast) ───────────────────────
// Reuses each notification's own TYPE_CFG icon instead of a fixed emoji, so
// a toast for "Task Submitted" shows the same ClipboardList icon it'll have
// once it lands in the list below, a deadline warning shows AlertCircle, etc.
function Toast({ toasts, onDismiss }) {
  return (
    <div className="notification-toast-stack">
      {toasts.map((t) => {
        const TIcon = t.icon || Bell;
        return (
          <div
            className={"notification-toast " + (t.highPriority ? "high" : "")}
            key={t.id}
          >
            <span className="notification-toast-icon">
              <TIcon size={14} />
            </span>
            <span>
              <strong>{t.title}</strong>
              {t.body && <small>{t.body}</small>}
            </span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "tasks", label: "Tasks" },
  { key: "forms", label: "Forms" },
  { key: "messages", label: "Messages" },
  { key: "announcements", label: "Announcements" },
];
const NOTIFICATIONS = [];
const TYPE_CFG = {
  task_assigned: { icon: ClipboardList, category: "tasks" },
  task_status_changed: { icon: CheckCircle2, category: "tasks" },
  task_comment_added: { icon: MessageSquare, category: "messages" },
  task_attachment_added: { icon: Paperclip, category: "tasks" },
  task_deadline_changed: { icon: CalendarClock, category: "tasks" },
  task_submitted: { icon: ClipboardList, category: "tasks" },
  form_submitted: { icon: ClipboardList, category: "forms" },
  form_approved: { icon: CheckCircle2, category: "forms" },
  form_rejected: { icon: AlertCircle, category: "forms", highPriority: true },
  form_revision: { icon: AlertCircle, category: "forms", highPriority: true },
  task_deadline_7d: { icon: CalendarClock, category: "tasks" },
  task_deadline_3d: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_deadline_1d: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_due_today: { icon: Clock, category: "tasks", highPriority: true },
  task_deadline_now: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_overdue: { icon: AlertCircle, category: "tasks", highPriority: true },
  task_deadline_near: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_approval_due_7d: { icon: CalendarClock, category: "tasks" },
  task_approval_due_3d: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_approval_due_1d: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  task_approval_due_today: {
    icon: Clock,
    category: "tasks",
    highPriority: true,
  },
  task_approval_overdue: {
    icon: AlertCircle,
    category: "tasks",
    highPriority: true,
  },
  user_registered: {
    icon: UserPlus,
    category: "announcements",
    highPriority: true,
  },
};
const DEADLINE_STAGE_PATTERN = /^task_deadline_(\\d+)d$/;
const APPROVAL_STAGE_PATTERN = /^task_approval_due_(\\d+)d$/;
function resolveTypeCfg(type) {
  if (TYPE_CFG[type]) return TYPE_CFG[type];
  const deadline = DEADLINE_STAGE_PATTERN.exec(type);
  if (deadline) {
    const days = Number(deadline[1]);
    return {
      icon: days <= 3 ? AlertCircle : CalendarClock,
      category: "tasks",
      highPriority: days <= 3,
    };
  }
  const approval = APPROVAL_STAGE_PATTERN.exec(type);
  if (approval) {
    const days = Number(approval[1]);
    return {
      icon: days <= 3 ? AlertCircle : CalendarClock,
      category: "tasks",
      highPriority: days <= 3,
    };
  }
  return { icon: Bell, category: "tasks" };
}
function rowToNotification(row) {
  const cfg = resolveTypeCfg(row.type);
  const receivedAt = new Date(row.created_at);
  const unread = !row.is_read;
  return {
    id: row.id,
    category: cfg.category,
    icon: cfg.icon,
    title: row.title,
    receivedAt,
    time: timeAgo(receivedAt),
    body: row.message,
    tags: [
      ...(row.tracking_id ? [{ label: row.tracking_id, tone: "purple" }] : []),
      ...(cfg.highPriority ? [{ label: "HIGH PRIORITY", tone: "red" }] : []),
      ...(unread ? [{ label: "NEW", tone: "red" }] : []),
    ],
    unread,
    highlight: unread,
    taskId: row.task_id,
    tracking_id: row.tracking_id,
  };
}
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return seconds + " seconds ago";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return minutes + " minute" + (minutes === 1 ? "" : "s") + " ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " hour" + (hours === 1 ? "" : "s") + " ago";
  const days = Math.floor(hours / 24);
  if (days < 7) return days + " day" + (days === 1 ? "" : "s") + " ago";
  return date.toLocaleDateString();
}
const TAG_CFG = {
  purple: { bg: "#ede9fe", color: "#6d28d9" },
  red: { bg: "#fee2e2", color: "#b91c1c" },
  gray: { bg: "#f3f4f6", color: "#4b5563" },
};
function Tag({ label, tone }) {
  const cfg = TAG_CFG[tone] || TAG_CFG.gray;
  return (
    <span
      className="notification-tag"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {label}
    </span>
  );
}
function Toggle({ on, onChange }) {
  return (
    <button
      type="button"
      className={"notification-toggle " + (on ? "on" : "")}
      onClick={onChange}
      aria-pressed={on}
    >
      <i />
    </button>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [toasts, setToasts] = useState([]);
  const [settings, setSettings] = useState({
    push: true,
    email: false,
    alerts: true,
  });
  const [, forceTick] = useState(0);
  const [loading, setLoading] = useState(true);
  let role = "";
  try {
    role = JSON.parse(localStorage.getItem("user") || "{}").role || "";
  } catch {}
  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, ...toast }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      6000,
    );
  }, []);
  const dismissToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API + "/api/notifications", {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error("Notification history request failed");
        const data = await res.json();
        if (!cancelled)
          setNotifications((data.notifications || []).map(rowToNotification));
      } catch (err) {
        console.error("Failed to load notification history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    connectSocket();
    const onNotification = (row) => {
      let isNew = true;
      setNotifications((ns) => {
        if (ns.some((n) => n.id === row.id)) {
          isNew = false;
          return ns;
        }
        return [rowToNotification(row), ...ns];
      });
      if (isNew) {
        const cfg = resolveTypeCfg(row.type);
        pushToast({
          icon: cfg.icon,
          highPriority: !!cfg.highPriority,
          title: row.title,
          body: row.message,
        });
      }
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [pushToast]);
  useEffect(() => {
    const id = setInterval(() => {
      forceTick((t) => t + 1);
      setNotifications((ns) =>
        ns.map((n) =>
          n.receivedAt ? { ...n, time: timeAgo(n.receivedAt) } : n,
        ),
      );
    }, 30000);
    return () => clearInterval(id);
  }, []);
  const filtered = useMemo(
    () =>
      notifications.filter((n) => {
        if (activeTab === "unread" && !n.unread) return false;
        if (!["all", "unread"].includes(activeTab) && n.category !== activeTab)
          return false;
        return (
          !query ||
          (n.title + " " + n.body).toLowerCase().includes(query.toLowerCase())
        );
      }),
    [notifications, activeTab, query],
  );
  const NOTIFICATIONS_PER_PAGE = 15;
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / NOTIFICATIONS_PER_PAGE),
  );
  const currentPage = Math.min(page, totalPages);
  const pagedNotifications = filtered.slice(
    (currentPage - 1) * NOTIFICATIONS_PER_PAGE,
    currentPage * NOTIFICATIONS_PER_PAGE,
  );
  const visibleStart = filtered.length
    ? (currentPage - 1) * NOTIFICATIONS_PER_PAGE + 1
    : 0;
  const visibleEnd = Math.min(
    currentPage * NOTIFICATIONS_PER_PAGE,
    filtered.length,
  );
  useEffect(() => {
    setPage(1);
  }, [activeTab, query]);
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const urgentCount = notifications.filter((n) =>
    n.tags.some((t) => t.label === "HIGH PRIORITY"),
  ).length;
  const todayCount = notifications.filter(
    (n) => n.receivedAt && Date.now() - n.receivedAt.getTime() < 86400000,
  ).length;
  const markAllRead = () => {
    setNotifications((ns) =>
      ns.map((n) => ({ ...n, unread: false, highlight: false })),
    );
    fetch(API + "/api/notifications/read-all", {
      method: "PATCH",
      headers: authHeaders(),
    }).catch((err) => console.error(err));
  };
  const clearAll = () => {
    setNotifications([]);
    setPage(1);
    fetch(API + "/api/notifications", {
      method: "DELETE",
      headers: authHeaders(),
    }).catch((err) => console.error(err));
  };
  const markRead = (id) => {
    setNotifications((ns) =>
      ns.map((n) =>
        n.id === id ? { ...n, unread: false, highlight: false } : n,
      ),
    );
    fetch(API + "/api/notifications/" + id + "/read", {
      method: "PATCH",
      headers: authHeaders(),
    }).catch((err) => console.error(err));
  };
  const grouped = pagedNotifications.reduce((groups, item) => {
    const group =
      item.receivedAt && Date.now() - item.receivedAt.getTime() < 86400000
        ? "Today"
        : "Earlier";
    (groups[group] || (groups[group] = [])).push(item);
    return groups;
  }, {});
  const styles = [
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');.path-notifications-shell{display:flex;height:100vh;overflow:hidden;background:#f8f7ff;color:#2c2537;font-family:'DM Sans',sans-serif}.path-notifications-main{display:flex;flex:1;min-width:0;flex-direction:column;overflow:hidden}.path-notifications-content{flex:1;overflow-y:auto;padding:30px 54px 48px;background:linear-gradient(180deg,#faf9ff,#f8f7ff);box-sizing:border-box}.notifications-view{width:100%;max-width:1380px;margin:0 auto}.notifications-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:148px;margin-bottom:18px;padding:29px 24px;border:1px solid #e6ddf5;border-left:2px solid #c4b5fd;border-radius:12px;background:linear-gradient(112deg,#fcfaff,#f5efff)}.date-kicker,.section-kicker{color:#8e8499;font:700 9px/1 'DM Sans';letter-spacing:.12em;text-transform:uppercase}.live-dot{display:inline-block;width:6px;height:6px;margin-right:8px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 4px #eee8ff}.notifications-hero h1{margin:9px 0 7px;color:#2c2537;font:700 31px/1.12 'Manrope',sans-serif;letter-spacing:-.045em}.notifications-hero p{margin:0;color:#83778b;font:400 13px/1.4 'DM Sans'}.notifications-hero-actions,.notifications-unread-count{display:flex;align-items:center;gap:12px}.notifications-unread-count{color:#7c3aed}.notifications-unread-count strong{font:700 22px/1 'Manrope',sans-serif}.notifications-unread-count span{color:#83778b;font-size:10px}.ghost-action{display:inline-flex;align-items:center;gap:7px;padding:10px 13px;border:1px solid #ddd6fe;border-radius:8px;background:#fff;color:#7c3aed;font:700 10px 'DM Sans';cursor:pointer}.notification-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:18px}.notification-summary article{min-height:112px;padding:18px 17px;border:1px solid #e5deed;border-radius:9px;background:#fff;box-shadow:0 8px 20px #39245d09}.notification-summary span{color:#8f8797;font:700 9px 'DM Sans';letter-spacing:.12em;text-transform:uppercase}.notification-summary strong{display:block;margin:16px 0 8px;color:#332c3e;font:700 28px/1 'Manrope',sans-serif;letter-spacing:-.04em}.notification-summary small{color:#a49aa9;font-size:10px}.notifications-layout{display:grid;align-items:start;grid-template-columns:minmax(0,1.65fr) minmax(310px,.8fr);gap:14px}.panel-card{border:1px solid #e5deed;border-radius:12px;background:#fff;box-shadow:0 12px 30px #39245d0b;overflow:hidden}.notifications-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:20px 21px 16px;border-bottom:1px solid #f0edf4}.notifications-toolbar h2{margin:6px 0 4px;color:#393341;font:700 17px/1.15 'Manrope',sans-serif;letter-spacing:-.025em}.notifications-toolbar h2 span{display:inline-block;margin-left:5px;padding:3px 7px;border-radius:999px;background:#eee8ff;color:#7c3aed;font:700 9px 'DM Sans'}.notifications-toolbar p,.notification-preferences>p{margin:0;color:#9b91a3;font-size:10px}.notifications-filter-controls{display:flex;gap:7px}.notifications-search{display:flex;align-items:center;gap:7px;min-width:190px;padding:8px 10px;border:1px solid #e7ddf1;border-radius:8px;background:#fff}.notifications-search input{width:100%;border:0;outline:0;font:400 10px 'DM Sans';color:#40364b}.notifications-filter-controls select{height:32px;padding:0 9px;border:1px solid #e7ddf1;border-radius:8px;background:#fff;color:#776b83;font:600 10px 'DM Sans'}.notification-group{padding:0 21px}.notification-group-label{padding:15px 0 8px;color:#a097a7;font:800 9px 'DM Sans';letter-spacing:.1em;text-transform:uppercase}.notification-row{display:flex;align-items:flex-start;gap:11px;width:100%;padding:15px 0;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer}.notification-icon{display:grid;width:32px;height:32px;flex:none;place-items:center;border-radius:9px;background:#f0eaff;color:#7c3aed}.notification-icon.red{background:#fff0f0;color:#c66a6a}.notification-icon.blue{background:#eef5ff;color:#4778ba}.notification-row-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:5px}.notification-row-copy>span{display:flex;justify-content:space-between;gap:10px}.notification-row-copy strong{color:#40364b;font:700 11px/1.3 'Manrope',sans-serif;letter-spacing:-.01em}.notification-row-copy small{color:#a49aa9;font-size:9px}.notification-row-copy em{align-self:flex-start;padding:3px 7px;border-radius:999px;background:#f5f0ff;color:#7c3aed;font:700 8px 'DM Sans';font-style:normal;text-transform:uppercase}.notification-row-copy p{margin:0;color:#776b83;font-size:10px;line-height:1.4}.notification-context{color:#a49aa9!important}.notification-unread-dot{width:6px;height:6px;margin-top:5px;border-radius:50%;background:#7c3aed}.notification-row.unread strong{color:#4c1d95}.notification-preferences{align-self:start;height:max-content;padding:20px 21px}.panel-topline{display:flex;justify-content:space-between}.panel-topline h3{margin:6px 0 0;color:#393341;font:700 16px/1.15 'Manrope',sans-serif;letter-spacing:-.025em}.notification-preference{display:flex;align-items:center;gap:10px;padding:14px 0;border-bottom:1px solid #f0edf4}.preference-icon{display:grid;width:30px;height:30px;flex:none;place-items:center;border-radius:9px;background:#f0eaff;color:#7c3aed}.notification-preference>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:4px}.notification-preference strong{color:#675a70;font:700 10px/1.2 'Manrope',sans-serif}.notification-preference small{font-size:9px;color:#a49aa9}.notification-toggle{width:34px;height:19px;padding:2px;border:0;border-radius:999px;background:#e5e0eb;cursor:pointer}.notification-toggle.on{background:#7c3aed}.notification-toggle i{display:block;width:15px;height:15px;border-radius:50%;background:#fff;transition:transform .15s}.notification-toggle.on i{transform:translateX(15px)}.notification-preference-note{display:flex;gap:8px;margin:15px 0;padding:11px;border:1px solid #e7ddf1;border-radius:8px;background:#fbfaff;color:#8f8499;font-size:9px;line-height:1.4}.text-action{display:inline-flex;align-items:center;gap:7px;padding:9px 0;border:0;background:none;color:#7c3aed;font:700 10px 'DM Sans';cursor:pointer}.notifications-empty{display:flex;align-items:center;flex-direction:column;gap:7px;padding:52px 20px;color:#a49aa9;text-align:center}.notifications-empty strong{font:700 12px/1.2 'Manrope',sans-serif;color:#675a70}.notifications-empty span{font-size:10px}.notification-toast-stack{position:fixed;top:16px;right:16px;z-index:200;display:flex;flex-direction:column;gap:8px}.notification-toast{display:flex;align-items:flex-start;gap:10px;min-width:260px;max-width:340px;padding:10px 14px;border:1px solid #e5deed;border-radius:10px;background:#fff;box-shadow:0 4px 20px #0002}.notification-toast.high{background:#fff5f5;border-color:#fecaca}.notification-toast-icon{display:grid;width:26px;height:26px;place-items:center;border-radius:7px;background:#ede9fe;color:#7c3aed}.notification-toast>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:3px}.notification-toast strong{font:700 11px/1.2 'Manrope',sans-serif}.notification-toast small{font-size:10px;color:#6b7280}.notification-toast button{border:0;background:none;color:#9ca3af;cursor:pointer}@media(max-width:1100px){.path-notifications-content{padding:24px 28px 40px}.notification-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.notifications-layout{grid-template-columns:1fr}}@media(max-width:760px){.path-notifications-content{padding:18px 14px 32px}.notifications-hero{align-items:flex-start;flex-direction:column;padding:22px 18px}.notifications-hero-actions,.notifications-filter-controls{align-items:stretch;flex-direction:column;width:100%}.notifications-hero-actions .ghost-action,.notifications-filter-controls select{width:100%}.notification-summary{gap:8px}.notification-summary article{min-height:108px;padding:16px 14px}.notifications-toolbar{align-items:stretch;flex-direction:column}.notifications-search{min-width:0}.notification-row-copy>span{flex-direction:column}.notification-preferences{order:-1}}",
  ].join("");
  return (
    <div className="path-notifications-shell">
      <style>{styles}</style>
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="path-notifications-main">

        <main className="path-notifications-content">
          <section className="notifications-view">
            <section className="notifications-hero">
              <div>
                <div className="date-kicker">
                  <span className="live-dot" /> Workspace alerts · live activity
                </div>
                <h1>Notifications</h1>
                <p>
                  Stay ahead of document decisions, SLA risks, assignments, and
                  access changes across the department.
                </p>
              </div>
              <div className="notifications-hero-actions">
                <div className="notifications-unread-count">
                  <Bell size={16} />
                  <strong>{unreadCount}</strong>
                  <span>unread alerts</span>
                </div>
                <button
                  className="ghost-action"
                  type="button"
                  onClick={markAllRead}
                >
                  Mark all as read <CheckCheck size={14} />
                </button>
              </div>
            </section>
            <section className="notification-summary">
              <article>
                <span>Unread</span>
                <strong>{String(unreadCount).padStart(2, "0")}</strong>
                <small>Needs your attention</small>
              </article>
              <article>
                <span>Action needed</span>
                <strong>{urgentCount}</strong>
                <small>Workflow follow-ups</small>
              </article>
              <article>
                <span>Today</span>
                <strong>{todayCount}</strong>
                <small>New activity</small>
              </article>
              <article>
                <span>Delivery health</span>
                <strong>99%</strong>
                <small>Alerts delivered</small>
              </article>
            </section>
            <section className="notifications-layout">
              <article className="notifications-feed panel-card">
                <div className="notifications-toolbar">
                  <div>
                    <div className="section-kicker">Activity inbox</div>
                    <h2>
                      All notifications <span>{filtered.length}</span>
                    </h2>
                    <p>
                      Click any alert to mark it as read and keep the queue
                      current.
                    </p>
                  </div>
                  <div className="notifications-filter-controls">
                    <div className="notifications-search">
                      <Search size={14} />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notifications"
                        aria-label="Search notifications"
                      />
                    </div>
                    <select
                      value={activeTab}
                      onChange={(e) => setActiveTab(e.target.value)}
                      aria-label="Filter notifications"
                    >
                      <option value="all">All notifications</option>
                      <option value="unread">Unread</option>
                      <option value="tasks">Tasks</option>
                      <option value="forms">Forms</option>
                      <option value="messages">Messages</option>
                      <option value="announcements">Announcements</option>
                    </select>
                    <button
                      className="ghost-action"
                      type="button"
                      onClick={clearAll}
                      disabled={!notifications.length}
                      style={{
                        minHeight: 32,
                        padding: "0 10px",
                        fontSize: 9,
                        whiteSpace: "nowrap",
                        opacity: notifications.length ? 1 : 0.45,
                        cursor: notifications.length
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      <Trash2 size={13} /> Clear all
                    </button>
                  </div>
                </div>
                {loading ? (
                  <div className="notifications-empty">
                    <Bell size={22} />
                    <strong>Loading notifications</strong>
                    <span>Syncing your latest workspace activity.</span>
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, items]) => (
                    <div className="notification-group" key={group}>
                      <div className="notification-group-label">{group}</div>
                      {items.map((n) => {
                        const NIcon = n.icon || Bell;
                        const tone = n.tags.some(
                          (tag) => tag.label === "HIGH PRIORITY",
                        )
                          ? "red"
                          : n.category === "messages"
                            ? "blue"
                            : "";
                        return (
                          <button
                            type="button"
                            className={
                              "notification-row " + (n.unread ? "unread" : "")
                            }
                            key={n.id}
                            onClick={() => markRead(n.id)}
                          >
                            <span className={"notification-icon " + tone}>
                              <NIcon size={15} />
                            </span>
                            <span className="notification-row-copy">
                              <span>
                                <strong>{n.title}</strong>
                                <small>{n.time}</small>
                              </span>
                              <em>{n.category}</em>
                              <p>{n.body}</p>
                              <small className="notification-context">
                                {n.tracking_id || "Workspace activity"}
                              </small>
                            </span>
                            {n.unread && (
                              <i className="notification-unread-dot" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
                {!loading && !filtered.length && (
                  <div className="notifications-empty">
                    <Bell size={22} />
                    <strong>No notifications match these filters</strong>
                    <span>
                      Try another search or switch back to all notifications.
                    </span>
                  </div>
                )}
                {!loading && filtered.length > 0 && (
                  <footer
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "13px 21px",
                      borderTop: "1px solid #f0edf4",
                      color: "#83778b",
                      fontSize: 10,
                    }}
                  >
                    <span>
                      Showing {visibleStart}–{visibleEnd} of {filtered.length}{" "}
                      notifications
                    </span>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 7 }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                        disabled={currentPage === 1}
                        aria-label="Previous notifications page"
                        style={{
                          display: "inline-grid",
                          width: 28,
                          height: 28,
                          placeItems: "center",
                          border: "1px solid #e7ddf1",
                          borderRadius: 7,
                          background: "white",
                          color: "#7c3aed",
                          cursor: currentPage === 1 ? "not-allowed" : "pointer",
                          opacity: currentPage === 1 ? 0.4 : 1,
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <span
                        style={{
                          minWidth: 62,
                          textAlign: "center",
                          color: "#776b83",
                          fontSize: 9,
                          fontWeight: 700,
                        }}
                      >
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((current) =>
                            Math.min(totalPages, current + 1),
                          )
                        }
                        disabled={currentPage === totalPages}
                        aria-label="Next notifications page"
                        style={{
                          display: "inline-grid",
                          width: 28,
                          height: 28,
                          placeItems: "center",
                          border: "1px solid #e7ddf1",
                          borderRadius: 7,
                          background: "white",
                          color: "#7c3aed",
                          cursor:
                            currentPage === totalPages
                              ? "not-allowed"
                              : "pointer",
                          opacity: currentPage === totalPages ? 0.4 : 1,
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </footer>
                )}
              </article>
              <aside className="notification-preferences panel-card">
                <div className="panel-topline">
                  <div>
                    <div className="section-kicker">Preferences</div>
                    <h3>Notification delivery</h3>
                  </div>
                  <Bell size={17} />
                </div>
                <p>
                  Choose how PATH keeps you informed without interrupting
                  focused review work.
                </p>
                <div className="notification-preference">
                  <span className="preference-icon">
                    <Bell size={15} />
                  </span>
                  <span>
                    <strong>SLA risk alerts</strong>
                    <small>When a document is within 25% of its deadline</small>
                  </span>
                  <Toggle
                    on={settings.alerts}
                    onChange={() =>
                      setSettings((s) => ({ ...s, alerts: !s.alerts }))
                    }
                  />
                </div>
                <div className="notification-preference">
                  <span className="preference-icon">
                    <MessageSquare size={15} />
                  </span>
                  <span>
                    <strong>Comments and mentions</strong>
                    <small>Replies and new discussion activity</small>
                  </span>
                  <Toggle
                    on={settings.push}
                    onChange={() =>
                      setSettings((s) => ({ ...s, push: !s.push }))
                    }
                  />
                </div>
                <div className="notification-preference">
                  <span className="preference-icon">
                    <Clock size={15} />
                  </span>
                  <span>
                    <strong>Daily digest</strong>
                    <small>One summary at 8:00 AM on weekdays</small>
                  </span>
                  <Toggle
                    on={settings.email}
                    onChange={() =>
                      setSettings((s) => ({ ...s, email: !s.email }))
                    }
                  />
                </div>
                <div className="notification-preference-note">
                  <Bell size={14} />
                  <span>
                    Critical workflow and access events always remain visible in
                    the audit trail.
                  </span>
                </div>
                <button
                  className="ghost-action"
                  type="button"
                  onClick={() =>
                    pushToast({
                      title: "Notification settings saved",
                      body: "Your delivery preferences are ready to connect to workspace notifications.",
                      icon: Bell,
                    })
                  }
                  style={{
                    justifyContent: "center",
                    width: "100%",
                    minHeight: 36,
                    marginTop: 15,
                    padding: "0 14px",
                    borderColor: "#7c3aed",
                    background: "#7c3aed",
                    color: "white",
                    fontSize: 10,
                  }}
                >
                  Save preferences <ChevronRight size={13} />
                </button>
              </aside>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}