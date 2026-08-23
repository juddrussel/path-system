import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import {
  FileText, Clock, AlertTriangle, CheckCircle2, XCircle, Users,
  ChevronRight, TrendingUp, TrendingDown, Activity, Zap, Building2,
  Bell, Flag, Eye, BarChart3, AlertCircle, Calendar, Layers,
  TriangleAlert, ShieldAlert, Plus, Send, RotateCcw, UserCheck,
  ClipboardList, Inbox, MessageSquare, Megaphone, RefreshCw,
  Filter, Search, CircleCheck, Timer, ArrowUpRight, BookOpen,
  GraduationCap, Star, MoreHorizontal, ChevronDown, Sparkles,
  ListTodo, PieChart, X, Tag,
} from "lucide-react";
import {
  Tooltip, ResponsiveContainer,
  PieChart as RPie, Pie, Cell,
} from "recharts";

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];
const API = import.meta.env.VITE_API_URL || "";

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
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#5e3bdb" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1.5a1 1 0 011 1v.6c2 .4 3.5 2.2 3.5 4.4v2.4l1.2 1.9c.2.3 0 .8-.4.8H2.7c-.4 0-.6-.5-.4-.8L3.5 10V7.5c0-2.2 1.5-4 3.5-4.4v-.6a1 1 0 011-1z" />
      <path d="M6.2 13.5a1.8 1.8 0 003.6 0z" />
    </svg>
  ),
};

// ─── Sample Data (Program Chair layout) ────────────────────────────────────────
// Note: the "Document, Form & Task Tracking" table no longer uses sample data —
// it fetches real tasks, forms, and documents from the API (see fetchTrackedItems
// below). The arrays below still power the charts and the Task Overview widget.

// Note: monthly submissions, processing time, approval-rate, task-completion,
// and recent-activity chart data are no longer hardcoded here — they're
// derived live from trackedItems/facultyPerformance inside the component
// (see the "Charts, activity feed, workflow snapshot & department overview"
// block below the KPI strip).

// Maps raw backend status values to the display labels used by StatusBadge
const REAL_STATUS_DISPLAY = {
  "pending":        "Pending",
  "in review":      "Under Review",
  "for approval":   "For Approval",
  "returned":       "Returned",
  "revision":       "Returned",
  "received":       "Approved",
  "approved":       "Approved",
  "rejected":       "Rejected",
  "archived":       "Archived",
  "registered":     "Approved",
  "draft":          "Pending",
};

const NOTIFICATIONS = [
  { id: 1,  type: "submission",   text: "New form submitted by Juan Reyes",          sub: "Thesis Defense Schedule — FRM-2026-041", time: "5m ago",  read: false },
  { id: 2,  type: "completed",    text: "Task completed by Dr. Luisa Fernandez",     sub: "Finalize Elective Subjects List",         time: "22m ago", read: false },
  { id: 3,  type: "revision",     text: "Revision requested by Records Office",      sub: "FRM-2026-028 — Leave Application",        time: "1h ago",  read: false },
  { id: 4,  type: "announcement", text: "System Announcement",                       sub: "PATH Maintenance scheduled Jun 15, 10 PM",time: "2h ago",  read: true  },
  { id: 5,  type: "submission",   text: "New form submitted by Prof. Mendoza",       sub: "Overload Request — FRM-2026-037",         time: "3h ago",  read: true  },
  { id: 6,  type: "completed",    text: "Approval completed",                        sub: "FRM-2026-029 approved by Dean's Office",  time: "4h ago",  read: true  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CFG = {
  Urgent: { color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  High:   { color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  Normal: { color: "#0284c7", bg: "#e0f2fe", dot: "#38bdf8" },
  Low:    { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

// Dot-style status palette — mirrors Tracking.jsx's STATUS_STYLES, extended
// with the extra statuses used across forms, tasks, and documents here.
const STATUS_CFG = {
  "pending":        { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  "pending review": { color: "#481bc6", bg: "#e6deff", dot: "#5e3bdb" },
  "under review":   { color: "#0369a1", bg: "#f0f9ff", dot: "#38bdf8" },
  "for approval":   { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  "in progress":    { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  "not started":    { color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
  "overdue":        { color: "#991b1b", bg: "#fef2f2", dot: "#ef4444" },
  "completed":      { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  "approved":       { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  "received":       { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  "rejected":       { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  "returned":       { color: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  "archived":       { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

// Type badge — same Task/Form pattern as Tracking.jsx, extended with Document
const TYPE_CFG = {
  task:     { label: "Task",     bg: "#e6deff", color: "#5e3bdb" },
  form:     { label: "Form",     bg: "#dbeafe", color: "#1e40af" },
  document: { label: "Document", bg: "#d1fae5", color: "#065f46" },
};

const ACTIVITY_CFG = {
  approved:  { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2  },
  submitted: { color: "#5e3bdb", bg: "#f3f2ff", icon: FileText      },
  completed: { color: "#059669", bg: "#ecfdf5", icon: CircleCheck   },
  assigned:  { color: "#0284c7", bg: "#e0f2fe", icon: UserCheck     },
  revision:  { color: "#d97706", bg: "#fffbeb", icon: RotateCcw     },
  workflow:  { color: "#5e3bdb", bg: "#e6deff", icon: Layers        },
  overdue:   { color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
};

const NOTIF_CFG = {
  submission:   { color: "#5e3bdb", bg: "#f3f2ff", icon: Inbox        },
  completed:    { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 },
  revision:     { color: "#d97706", bg: "#fffbeb", icon: RotateCcw    },
  announcement: { color: "#0284c7", bg: "#e0f2fe", icon: Megaphone    },
};

// Bottleneck & Alerts tier styling — mirrors Reports.jsx's ALERT_TIER_CFG so
// this widget's live alerts render consistently with the full report.
const ALERT_TIER_CFG = {
  critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", iconBg: "#fee2e2", iconColor: "#dc2626", label: "Critical", showPill: true },
  warning:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", iconBg: "#fef3c7", iconColor: "#d97706", label: "Warning",  showPill: false },
  info:     { color: "#5e3bdb", bg: "#f3f2ff", border: "#cabeff", iconBg: "#e6deff", iconColor: "#5e3bdb", label: "Info",     showPill: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s?.toLowerCase()] ?? { color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = TYPE_CFG[type] ?? { label: type, bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.4, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function PriorityPill({ p }) {
  const cfg = PRIORITY_CFG[p] ?? PRIORITY_CFG.Normal;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: cfg.bg, color: cfg.color, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {p}
    </span>
  );
}

const CustomTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#191b24", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fff" }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: "#cabeff" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color ?? "#fff" }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

function FacultyPerformanceRow({ f, idx, delayedDocs, onClick }) {
  const rate = Number(f.performance_score) || 0;
  const rateColor = rate >= 90 ? "#059669" : rate >= 80 ? "#d97706" : "#dc2626";
  const initials = (f.full_name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
  const delayedCount = Array.isArray(delayedDocs)
    ? delayedDocs.filter(d => d.faculty_name === f.full_name).length
    : 0;
  return (
    <div
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick(f);
      }}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 9, background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)", cursor: onClick ? "pointer" : "default", transition: "background 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.background = "#f3f0ff"; e.currentTarget.style.boxShadow = "0 1px 6px rgba(124,58,237,0.12)"; } }}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.boxShadow = "none"; } }}
    >
      {/* Rank */}
      <span style={{ fontSize: 11, fontWeight: 700, color: idx === 0 ? "#f59e0b" : "#9ca3af", width: 16, flexShrink: 0 }}>
        {idx === 0 ? "★" : `#${idx + 1}`}
      </span>
      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `hsl(${idx * 55 + 250}, 60%, 92%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid hsl(${idx * 55 + 250}, 50%, 75%)` }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: `hsl(${idx * 55 + 250}, 50%, 35%)` }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{f.full_name}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#6b7280" }}>Active: <strong style={{ color: "#374151" }}>{f.active_count}</strong></span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>Done: <strong style={{ color: "#059669" }}>{f.completed_count}</strong></span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>Pending: <strong style={{ color: "#d97706" }}>{f.pending_count}</strong></span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>Delayed: <strong style={{ color: delayedCount > 0 ? "#dc2626" : "#374151" }}>{delayedCount}</strong></span>
        </div>
      </div>
      {/* Completion rate */}
      <div style={{ width: 80, textAlign: "right" }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: rateColor, lineHeight: 1 }}>{rate}%</p>
        <div style={{ height: 4, borderRadius: 2, background: "#f3f4f6", marginTop: 4 }}>
          <div style={{ height: 4, borderRadius: 2, background: rateColor, width: `${rate}%` }} />
        </div>
      </div>
      {onClick && (
        <ChevronRight style={{ width: 14, height: 14, color: "#c4c4d4", flexShrink: 0 }} />
      )}
    </div>
  );
}

// ── Faculty Performance — table row (mirrors the "Faculty Performance
//    Summary" table from the DS PATH mockup: avatar+name/role cell,
//    Tasks Done / Active columns, and a Success Rate progress bar) ─────────
function FacultyPerformanceTableRow({ f, idx, delayedDocs, onClick }) {
  const rate = Number(f.performance_score) || 0;
  const rateColor = rate >= 90 ? "#10b981" : rate >= 80 ? "#d97706" : "#dc2626";
  const initials = (f.full_name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();
  const delayedCount = Array.isArray(delayedDocs)
    ? delayedDocs.filter(d => d.faculty_name === f.full_name).length
    : 0;

  return (
    <tr
      onClick={() => onClick && onClick(f)}
      style={{ cursor: onClick ? "pointer" : "default", borderBottom: "1px solid #e3dfff", transition: "background-color 0.15s" }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "rgba(246,242,255,0.6)"; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.background = "transparent"; }}
    >
      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `hsl(${idx * 55 + 250}, 60%, 92%)`,
              border: `2px solid hsl(${idx * 55 + 250}, 50%, 78%)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: `hsl(${idx * 55 + 250}, 55%, 35%)` }}>{initials}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#181445", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.full_name}</span>
            <span style={{ fontSize: 11, color: "#7b7486" }}>{idx === 0 ? "Top performer" : "Faculty member"}</span>
          </div>
        </div>
      </td>
      <td style={{ padding: "16px 24px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#181445" }}>
        {f.completed_count ?? 0}
      </td>
      <td style={{ padding: "16px 24px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#6b38d4" }}>
        {f.active_count ?? 0}
      </td>
      <td style={{ padding: "16px 24px", textAlign: "center", fontSize: 14, fontWeight: 600, color: delayedCount > 0 ? "#ba1a1a" : "#181445" }}>
        {f.pending_count ?? 0}
      </td>
      <td style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: 110 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: rateColor }}>{rate}%</span>
          <div style={{ width: "100%", background: "#e3dfff", borderRadius: 999, height: 6 }}>
            <div style={{ width: `${Math.min(rate, 100)}%`, background: rateColor, height: 6, borderRadius: 999 }} />
          </div>
        </div>
      </td>
      {onClick && (
        <td style={{ padding: "16px 24px", textAlign: "right" }}>
          <ChevronRight style={{ width: 14, height: 14, color: "#cbc3d7" }} />
        </td>
      )}
    </tr>
  );
}

// ── Faculty Performance — individual detail panel ───────────────────────────
const DONE_STATUSES = ["Approved", "Completed", "Archived"];

function FacultyDetailPanel({ open, onClose, onBack, faculty, delayedDocs, trackedItems }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Reset the expanded category whenever a different faculty member is opened
  useEffect(() => {
    setSelectedCategory(null);
  }, [faculty?.id]);

  if (!open || !faculty) return null;

  const rate = Number(faculty.performance_score) || 0;
  const rateColor = rate >= 90 ? "#059669" : rate >= 80 ? "#d97706" : "#dc2626";
  const initials = (faculty.full_name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase();

  // Items (documents/tasks/forms) belonging to this faculty member, pulled
  // from the same merged list that powers the tracking table.
  const facultyItems = Array.isArray(trackedItems)
    ? trackedItems.filter(t => t.person === faculty.full_name)
    : [];

  const facultyDelayedDocs = Array.isArray(delayedDocs)
    ? delayedDocs.filter(d => d.faculty_name === faculty.full_name)
    : [];

  const doneItems    = facultyItems.filter(t => DONE_STATUSES.includes(t.status));
  const pendingItems = facultyItems.filter(t => t.status === "Pending");
  const delayedItems = facultyItems.filter(t => t.status === "Overdue");
  // "Active" = everything still moving that isn't done, pending, or overdue
  // (e.g. Under Review, For Approval, Returned).
  const activeItems = facultyItems.filter(
    t => !DONE_STATUSES.includes(t.status) && t.status !== "Pending" && t.status !== "Overdue"
  );

  const delayedCount = facultyDelayedDocs.length || delayedItems.length;

  const stats = [
    { label: "Active",  value: faculty.active_count ?? activeItems.length,    icon: Layers,       color: "#5e3bdb", items: activeItems  },
    { label: "Done",    value: faculty.completed_count ?? doneItems.length,   icon: CheckCircle2, color: "#059669", items: doneItems    },
    { label: "Pending", value: faculty.pending_count ?? pendingItems.length,  icon: Clock,        color: "#d97706", items: pendingItems },
    { label: "Delayed", value: delayedCount,                                  icon: AlertCircle,  color: "#dc2626", items: delayedItems },
  ];

  const activeStat = stats.find(s => s.label === selectedCategory);
  // Fall back to the faculty's delayed-documents list (richer info) when a
  // faculty member has delayed docs but no matching "Overdue" tracked item.
  const listToShow = activeStat
    ? (activeStat.label === "Delayed" && activeStat.items.length === 0 && facultyDelayedDocs.length > 0
        ? facultyDelayedDocs.map(d => ({
            id: d.tracking_id || d.document_id || d.id,
            title: d.title || d.document_type || "Delayed document",
            status: "Overdue",
            date: d.deadline || d.due_date || d.submitted_at || null,
          }))
        : activeStat.items)
    : [];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 440, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            {onBack && (
              <button
                onClick={onBack}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
              >
                <ChevronRight style={{ width: 14, height: 14, color: "#374151", transform: "rotate(180deg)" }} />
              </button>
            )}
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e6deff", border: "2px solid #cabeff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#481bc6" }}>{initials}</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{faculty.full_name}</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>Performance breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <X style={{ width: 15, height: 15, color: "#374151" }} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto" }}>
          {/* Stat boxes */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 18 }}>
            {stats.map(s => {
              const isSelected = selectedCategory === s.label;
              return (
                <div
                  key={s.label}
                  onClick={() => setSelectedCategory(isSelected ? null : s.label)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 10,
                    background: isSelected ? `${s.color}14` : `${s.color}09`,
                    border: `1px solid ${isSelected ? s.color : `${s.color}20`}`,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px" }}>
                    <s.icon style={{ width: 13, height: 13, color: s.color }} />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Completion rate */}
          <div style={{ marginBottom: selectedCategory ? 16 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "#6b7280" }}>Completion Rate</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: rateColor }}>{rate}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#f3f4f6" }}>
              <div style={{ height: 6, borderRadius: 3, background: rateColor, width: `${rate}%` }} />
            </div>
          </div>

          {/* Expanded task list for the selected box */}
          {activeStat && (
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <activeStat.icon style={{ width: 13, height: 13, color: activeStat.color }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{activeStat.label} tasks</span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>({listToShow.length})</span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 11, padding: 2 }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {listToShow.length === 0 ? (
                <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "14px 0" }}>
                  No {activeStat.label.toLowerCase()} items found.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {listToShow.map((item, i) => (
                    <div
                      key={item.id || i}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: activeStat.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.title || "Untitled item"}
                        </p>
                        {item.date && (
                          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>{item.date}</p>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: activeStat.color,
                          background: `${activeStat.color}14`,
                          padding: "2px 7px",
                          borderRadius: 20,
                          flexShrink: 0,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Faculty Performance — full list modal ──────────────────────────────────
function FacultyPerformanceModal({ open, onClose, faculty, delayedDocs, onSelectFaculty }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 620, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        <div style={{ padding: "16px 20px 0", borderBottom: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Faculty Performance</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {`${faculty.length} faculty member${faculty.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X style={{ width: 15, height: 15, color: "#374151" }} />
            </button>
          </div>
        </div>

        <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {faculty.length === 0 ? (
            <p style={{ padding: "16px 4px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No faculty performance data yet.</p>
          ) : (
            faculty.map((f, idx) => (
              <FacultyPerformanceRow key={f.id} f={f} idx={idx} delayedDocs={delayedDocs} onClick={onSelectFaculty} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ id, title, subtitle, icon: Icon, children, action, noPad, accentColor, titleColor, footer }) {
  return (
    <div id={id} style={{ background: "#ffffff", border: "1px solid #c9c4d7", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(25,27,36,0.05)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #c9c4d7", background: "#faf8ff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: accentColor ? `${accentColor}18` : "#e6deff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon style={{ width: 15, height: 15, color: accentColor || "#5e3bdb" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: titleColor || "#191b24", lineHeight: 1.3 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 12, color: "#484555", marginTop: 1 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: noPad ? 0 : "16px 20px", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: "12px 20px", borderTop: "1px solid #c9c4d7", flexShrink: 0 }}>{footer}</div>}
    </div>
  );
}

// ── Quick Actions — compact shortcut list, used to fill out the right-hand
//    column under Bottlenecks & Alerts so it doesn't sit half-empty next to
//    the taller tracking table. ───────────────────────────────────────────
function QuickActionRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        border: "1px solid #ededf9", borderRadius: 10, cursor: "pointer",
        transition: "background-color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#faf8ff"; e.currentTarget.style.borderColor = "#ddd6fe"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#ededf9"; }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f3f2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: "#5e3bdb" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#191b24" }}>{title}</p>
        <p style={{ fontSize: 11.5, color: "#5d5e64", marginTop: 1 }}>{subtitle}</p>
      </div>
      <ChevronRight style={{ width: 15, height: 15, color: "#c1c5dc", flexShrink: 0 }} />
    </div>
  );
}

const ADMIN_QUICK_ACTIONS = [
  { icon: UserCheck, title: "Assign Task", subtitle: "Delegate work to faculty", to: "/tasks" },
  { icon: PieChart, title: "View Tracking", subtitle: "Monitor submission progress", to: "/tracking" },
  { icon: Tag, title: "Manage Categories", subtitle: "Organize form categories", to: "/categories" },
  { icon: Users, title: "System Users", subtitle: "Manage accounts and roles", to: "/users" },
  { icon: Timer, title: "SLA Configuration", subtitle: "Set response and resolution targets", to: "/sla-configuration" },
];

const FACULTY_QUICK_ACTIONS = [
  { icon: ListTodo, title: "My Tasks", subtitle: "Review your current assignments", to: "/tasks" },
  { icon: FileText, title: "Submit Forms", subtitle: "Start a new form submission", to: "/forms" },
  { icon: Activity, title: "Tracking", subtitle: "Check the status of your items", to: "/tracking" },
  { icon: MessageSquare, title: "Messages", subtitle: "View your inbox", to: "/inbox" },
];

function QuickActionsPanel({ navigate, actions = ADMIN_QUICK_ACTIONS }) {
  return (
    <SectionCard title="Quick Actions" subtitle="Shortcuts to common tasks" icon={Zap}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map(a => (
          <QuickActionRow key={a.title} icon={a.icon} title={a.title} subtitle={a.subtitle} onClick={() => navigate(a.to)} />
        ))}
      </div>
    </SectionCard>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("All");

  // ── Live data for the "Document, Form & Task Tracking" table ────────────────
  const [trackedItems, setTrackedItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [trackedPage, setTrackedPage] = useState(1);
  const TRACKED_PAGE_SIZE = 10;
  const [taskPage, setTaskPage] = useState(1);
  const TASK_PAGE_SIZE = 10;

  // ── Live data for the "Faculty Performance Summary" widget ──────────────────
  const [facultyPerformance, setFacultyPerformance] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [delayedDocs, setDelayedDocs] = useState([]);
  const [delayedLoading, setDelayedLoading] = useState(true);

  // ── Live data for the "My Forms" widget ──────────────────────────────────
  // Uses /api/forms/my (the same server-filtered endpoint Forms.jsx calls
  // for non-program-chair users) instead of trying to match forms out of
  // /api/forms/all by submitter name — that name isn't reliably present on
  // every form record, so the match can silently come up empty.
  const [myFormsData, setMyFormsData] = useState([]);
  const [myFormsDataLoading, setMyFormsDataLoading] = useState(true);

  const fetchMyForms = useCallback(async () => {
    setMyFormsDataLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/forms/my`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const forms = data.forms ?? data ?? [];
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
        setMyFormsData(
          (Array.isArray(forms) ? forms : []).map(f => ({
            id: f.tracking_id || `FRM-${f.id}`,
            title: f.category ? `${f.category} Form` : "Form Submission",
            date: fmtDate(f.filing_date || f.created_at),
            status: REAL_STATUS_DISPLAY[f.status?.toLowerCase()] || f.status || "Pending",
          }))
        );
      } else {
        console.error("My forms fetch failed:", res.status, await res.text().catch(() => ""));
      }
    } catch (err) {
      console.error("My forms fetch error:", err);
    } finally {
      setMyFormsDataLoading(false);
    }
  }, [token]);

  const fetchDelayedDocuments = useCallback(async () => {
    setDelayedLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/delayed-documents`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const rows = data.delayed ?? [];
        setDelayedDocs(Array.isArray(rows) ? rows : []);
      } else {
        setDelayedDocs([]);
      }
    } catch (err) {
      console.error("Delayed documents fetch error:", err);
      setDelayedDocs([]);
    } finally {
      setDelayedLoading(false);
    }
  }, [token]);

  const fetchFacultyPerformance = useCallback(async () => {
    setFacultyLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/performance`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const rows = data.faculty ?? data ?? [];
        setFacultyPerformance(Array.isArray(rows) ? rows : []);
      } else {
        setFacultyPerformance([]);
      }
    } catch (err) {
      console.error("Faculty performance fetch error:", err);
      setFacultyPerformance([]);
    } finally {
      setFacultyLoading(false);
    }
  }, [token]);

  const fetchTrackedItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const merged = [];
      const now = new Date();

      // Resolve user ids -> display names (same approach as Tracking.jsx)
      // IDs are normalized to strings on both write and read, since the
      // /api/users list and the faculty_id/user_id fields on tasks/forms
      // don't always agree on number vs. string, which was causing every
      // lookup to miss and fall back to "User #<id>".
      const userMap = {};
      try {
        const res = await fetch(`${API}/api/users/names`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const users = data.users ?? data ?? [];
          (Array.isArray(users) ? users : []).forEach(u => {
            const name = u.full_name || u.name || u.username || u.email;
            if (u.id != null && name) userMap[String(u.id)] = name;
          });
        } else {
          console.error("Users fetch failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (err) { console.error("Users fetch error:", err); }
      const nameOf = (id) => (id != null && userMap[String(id)]) || (id ? `User #${id}` : "—");

      const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
      const daysSince = (d) => d ? Math.max(0, Math.floor((now - new Date(d)) / 86400000)) : 0;
      const displayStatus = (s) => REAL_STATUS_DISPLAY[s?.toLowerCase()] || s || "Pending";
      const priorityFor = (days, done) => done ? "Low" : days >= 7 ? "Urgent" : days >= 4 ? "High" : "Normal";

      // ── Plain tracked documents ──────────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/tracking`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const documents = data.documents || data || [];
          (Array.isArray(documents) ? documents : []).forEach(d => {
            const rawDate = d.submitted_at || d.created_at;
            const status = displayStatus(d.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            merged.push({
              id: d.tracking_id || d.document_id || `DOC-${d.id}`,
              sourceType: "document",
              title: d.title || d.document_type || "Document",
              person: d.submitted_by_name || (d.submitted_by ? nameOf(d.submitted_by) : null) || d.department || "—",
              date: fmtDate(rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status,
              days: daysSince(rawDate),
              priority: priorityFor(daysSince(rawDate), done),
            });
          });
        }
      } catch (err) { console.error("Tracking fetch error:", err); }

      // ── Tasks assigned ────────────────────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/tasks`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks ?? data ?? [];
          (Array.isArray(tasks) ? tasks : []).forEach(t => {
            const rawDate = t.created_at || t.deadline;
            const status = displayStatus(t.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            const overdue = t.deadline && new Date(t.deadline) < now && !done;
            // For overdue tasks, "days" should reflect how long past the deadline
            // it is — not how long ago the task was created.
            const taskDays = overdue ? daysSince(t.deadline) : daysSince(rawDate);
            merged.push({
              id: t.tracking_id || `TSK-${t.id}`,
              sourceType: "task",
              title: t.title,
              person: nameOf(t.faculty_id),
              date: fmtDate(t.deadline || rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status: overdue ? "Overdue" : status,
              days: taskDays,
              priority: overdue ? "Urgent" : priorityFor(taskDays, done),
            });
          });
        }
      } catch (err) { console.error("Tasks fetch error:", err); }

      // ── Forms submitted by faculty ───────────────────────────────────────
      // /api/forms/all is reviewer-only (admin / program_chair) on the
      // backend and 403s for everyone else, so faculty accounts must use
      // /api/forms/my instead — otherwise this block silently no-ops and
      // every stat card derived from form data (Submitted Forms, Pending
      // Approvals, Approved This Month, Returned/Revisions) reads 0.
      try {
        const formsEndpoint = ADMIN_NAV_ROLES.includes(user.role) ? "/api/forms/all" : "/api/forms/my";
        const res = await fetch(`${API}${formsEndpoint}`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const forms = data.forms ?? data ?? [];
          (Array.isArray(forms) ? forms : []).forEach(f => {
            const rawDate = f.filing_date || f.created_at;
            const status = displayStatus(f.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            // NOTE: f.full_name is the student the form is filed for (paired
            // with f.student_id), not who submitted it — so it must be the
            // last fallback, not the first, or every form on this dashboard
            // gets attributed to the student instead of the faculty member
            // who actually filed it.
            const facultySubmitter =
              f.submitter_name || f.submitted_by_name ||
              (f.submitted_by ? nameOf(f.submitted_by) : null) ||
              f.faculty_name || f.user_name || f.username ||
              (f.user_id    ? nameOf(f.user_id)    : null) ||
              (f.faculty_id ? nameOf(f.faculty_id) : null) ||
              f.full_name || "—";
            merged.push({
              id: f.tracking_id || `FRM-${f.id}`,
              sourceType: "form",
              title: f.category ? `${f.category} Form` : "Form Submission",
              person: facultySubmitter,
              date: fmtDate(rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status,
              days: daysSince(rawDate),
              priority: priorityFor(daysSince(rawDate), done),
            });
          });
        } else {
          console.error("Forms fetch failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (err) { console.error("Forms fetch error:", err); }

      // Most urgent items first (Urgent > High > Normal > Low), then longest-waiting as tiebreaker
      const PRIORITY_RANK = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
      merged.sort((a, b) => {
        const rankDiff = (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
        if (rankDiff !== 0) return rankDiff;
        return b.days - a.days;
      });
      setTrackedItems(merged);
    } finally {
      setItemsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTrackedItems();
    fetchFacultyPerformance();
    fetchDelayedDocuments();
    fetchMyForms();
  }, [token, fetchTrackedItems, fetchFacultyPerformance, fetchDelayedDocuments, fetchMyForms]);

  // Reset to page 1 whenever the tracked list is refreshed/changes size
  useEffect(() => {
    setTrackedPage(1);
  }, [trackedItems.length]);

  const trackedTotalPages = Math.max(1, Math.ceil(trackedItems.length / TRACKED_PAGE_SIZE));
  const trackedPageItems = trackedItems.slice(
    (trackedPage - 1) * TRACKED_PAGE_SIZE,
    trackedPage * TRACKED_PAGE_SIZE
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName = user.full_name || user.fullName || user.name || user.username || "User";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);
  const displayRole = (user.role || "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || "User";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const unread = NOTIFICATIONS.filter(n => !n.read).length;

  /* ════════════════════════════════════════════════════════════════════
     Bottleneck & Alerts — live, ported from Reports.jsx so this widget
     shows the same real-time alerts as the full Bottleneck report instead
     of static sample data. Derived from trackedItems / facultyPerformance
     (not scoped to any filter bar, since these are department-wide
     operational alerts). Each threshold below is the SLA/rule used to
     decide whether something gets flagged. ══════════════════════════ */
  const DONE_STATUSES = ["Approved", "Rejected", "Archived", "Completed"];

  const FACULTY_WORKLOAD = useMemo(() => {
    return facultyPerformance.map(f => {
      const pending = f.pending_count ?? 0;
      const completed = f.completed_count ?? 0;
      const active = f.active_count ?? 0;
      const name = f.full_name || f.name || "—";
      const delayedFromEndpoint = delayedDocs.filter(d => d.faculty_name === name).length;
      const delayedFromItems = trackedItems.filter(i => i.person === name && i.status === "Overdue").length;
      return {
        name,
        assigned: active + pending + completed,
        pending,
        completed,
        delayed: delayedFromEndpoint || delayedFromItems,
        rate: Math.round(f.performance_score ?? (active + pending + completed > 0 ? (completed / (active + pending + completed)) * 100 : 0)),
      };
    });
  }, [facultyPerformance, delayedDocs, trackedItems]);

  const ALERT_SLA = {
    approvalWaitDays: 5,     // "For Approval" items waiting longer than this breach SLA
    workflowStagnantDays: 5, // non-task items sitting untouched this long count as a workflow delay
    pendingReviewDays: 5,    // forms pending longer than this get bundled into one alert
    highWorkloadTasks: 6,    // active (not-yet-completed) tasks per faculty before flagging
    returnedStagnantDays: 3, // items sent back for revision that haven't been resubmitted
  };

  const BOTTLENECK_ALERTS = useMemo(() => {
    const alerts = [];
    const active = trackedItems.filter(i => !DONE_STATUSES.includes(i.status));

    // 1) Overdue Approvals
    active
      .filter(i => i.status === "For Approval" && i.days >= ALERT_SLA.approvalWaitDays)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        const over = i.days - ALERT_SLA.approvalWaitDays;
        alerts.push({
          key: `approval-${i.id}`,
          tier: "critical",
          title: "Overdue Approval",
          message: `${i.id} has been waiting for ${i.days} day${i.days === 1 ? "" : "s"}. SLA exceeded by ${over} day${over === 1 ? "" : "s"}.`,
          icon: AlertTriangle,
        });
      });

    // 2) Overdue Tasks
    active
      .filter(i => i.sourceType === "task" && i.status === "Overdue")
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        alerts.push({
          key: `task-${i.id}`,
          tier: "critical",
          title: "Overdue Task",
          message: `${i.id} (${i.title}) is ${i.days} day${i.days === 1 ? "" : "s"} past deadline.`,
          icon: AlertTriangle,
        });
      });

    // 3) High Workload — faculty carrying more active tasks than the threshold
    FACULTY_WORKLOAD
      .map(f => ({ ...f, active: Math.max(0, f.assigned - f.completed) }))
      .filter(f => f.active >= ALERT_SLA.highWorkloadTasks)
      .sort((a, b) => b.active - a.active)
      .forEach(f => {
        alerts.push({
          key: `workload-${f.name}`,
          tier: "warning",
          title: "High Workload",
          message: `${f.name} has ${f.active} active task${f.active === 1 ? "" : "s"}. May need rebalancing.`,
          icon: Users,
        });
      });

    // 4) Workflow Delay — non-task items stagnant in their current stage
    active
      .filter(i => i.sourceType !== "task" && i.status !== "For Approval" && i.days >= ALERT_SLA.workflowStagnantDays)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        alerts.push({
          key: `workflow-${i.id}`,
          tier: "warning",
          title: "Workflow Delay",
          message: `${i.id} (${i.title}) has been stagnant for ${i.days} day${i.days === 1 ? "" : "s"}.`,
          icon: Clock,
        });
      });

    // 5) Pending Review — bundled into a single alert
    const pendingCount = active.filter(i => i.status === "Pending" && i.days >= ALERT_SLA.pendingReviewDays).length;
    if (pendingCount > 0) {
      alerts.push({
        key: "pending-review",
        tier: "info",
        title: "Pending Review",
        message: `${pendingCount} form${pendingCount === 1 ? "" : "s"} have been pending for more than ${ALERT_SLA.pendingReviewDays} days without action.`,
        icon: ClipboardList,
      });
    }

    // 6) Returned for Revision — sent back to the submitter and left untouched
    active
      .filter(i => i.status === "Returned" && i.days >= ALERT_SLA.returnedStagnantDays)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        alerts.push({
          key: `returned-${i.id}`,
          tier: "warning",
          title: "Returned for Revision",
          message: `${i.id} (${i.title}) was returned to ${i.person} ${i.days} day${i.days === 1 ? "" : "s"} ago and hasn't been resubmitted.`,
          icon: RotateCcw,
        });
      });

    const tierRank = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  }, [trackedItems, FACULTY_WORKLOAD]);

  // Tasks for the "Pending Tasks Overview" widget — pulled from the same
  // merged trackedItems used by the Document, Form & Task Tracking table
  // (sourceType === "task"), instead of mock data.
  const taskItems = trackedItems
    .filter(t => t.sourceType === "task")
    .map(t => {
      const overdue = t.status === "Overdue";
      const done = ["Approved", "Completed", "Archived"].includes(t.status);
      const progress = done ? 100 : overdue ? 20 : t.status === "Pending" ? 0 : 50;
      return {
        id: t.id,
        name: t.title,
        assignedTo: t.person,
        deadline: t.date,
        status: t.status,
        overdue,
        progress,
      };
    });

  // "In Progress" is a bucket, not a single literal status — it covers tasks
  // that are actively moving: waiting for approval, sent back for revisions,
  // or still being worked on by faculty. "Not Started" stays narrow and only
  // matches tasks that haven't been touched yet.
  const IN_PROGRESS_STATUSES = ["In Progress", "Pending", "Under Review", "For Approval", "Returned"];
  const isInProgress = t => !t.overdue && IN_PROGRESS_STATUSES.includes(t.status);

  const filteredTasks = taskItems.filter(t =>
    taskFilter === "All" ? true :
    taskFilter === "Overdue" ? t.overdue :
    taskFilter === "In Progress" ? isInProgress(t) :
    taskFilter === "Not Started" ? (!t.overdue && t.status === "Not Started") :
    t.status === taskFilter
  );

  const taskTotalPages = Math.max(1, Math.ceil(filteredTasks.length / TASK_PAGE_SIZE));
  const taskPageItems = filteredTasks.slice(
    (taskPage - 1) * TASK_PAGE_SIZE,
    taskPage * TASK_PAGE_SIZE
  );

  useEffect(() => {
    setTaskPage(1);
  }, [taskFilter, filteredTasks.length]);

  // ── KPI strip values — derived from the same live trackedItems / faculty
  // data used elsewhere on the dashboard, instead of hardcoded sample numbers.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // "Pending Approvals" should catch an approval both before it's submitted
  // (status "Pending", i.e. assigned/drafted but not yet sent in) and while
  // it's actively awaiting a decision after submission ("Under Review" /
  // "For Approval") — not just the pre-submission state.
  const pendingApprovalsCount = trackedItems.filter(
    t => ["Pending", "Under Review", "For Approval"].includes(t.status)
  ).length;

  const activeTasksCount = trackedItems.filter(
    t => t.sourceType === "task" && !["Approved", "Completed", "Archived", "Rejected"].includes(t.status)
  ).length;

  const documentsUnderReviewCount = trackedItems.filter(
    t => t.status === "Under Review" || t.status === "For Approval"
  ).length;

  const overdueItemsCount = trackedItems.filter(t => t.status === "Overdue").length;

  const approvedThisMonthCount = trackedItems.filter(
    t => t.status === "Approved" && t.dateObj && t.dateObj >= monthStart
  ).length;

  const activeFacultyCount = facultyPerformance.length;

  const assignedTasksCount = trackedItems.filter(t => t.sourceType === "task").length;
  const submittedFormsCount = trackedItems.filter(t => t.sourceType === "form").length;
  const returnedRevisionsCount = trackedItems.filter(t => t.status === "Returned").length;

  const kpis = [
    { label: "Pending Approvals",   value: String(pendingApprovalsCount),   color: "#5e3bdb", tint: "#cabeff", icon: ClipboardList },
    { label: "Active Tasks",        value: String(activeTasksCount),        color: "#d97706", tint: "#fde68a", icon: ListTodo      },
    { label: "Assigned Tasks",      value: String(assignedTasksCount),      color: "#0284c7", tint: "#7dd3fc", icon: Eye           },
    { label: "Overdue Items",       value: String(overdueItemsCount),       color: "#dc2626", tint: "#fca5a5", icon: AlertTriangle },
    { label: "Approved This Month", value: String(approvedThisMonthCount),  color: "#059669", tint: "#6ee7b7", icon: CheckCircle2  },
    { label: "Submitted Forms",     value: String(submittedFormsCount),     color: "#481bc6", tint: "#cabeff", icon: FileText      },
    { label: "Returned/Revisions",  value: String(returnedRevisionsCount),  color: "#ea580c", tint: "#fdba74", icon: RotateCcw     },
  ];

  const kpisLoading = itemsLoading || facultyLoading;

  /* ── Faculty-side dashboard data ──────────────────────────────────────
     Everything below is scoped to the logged-in faculty member (matched
     by display name against trackedItems' `person` field, same approach
     FacultyDetailPanel uses) and only rendered when !canViewAdminNav. */
  const myItems = trackedItems.filter(t => t.person === displayName);
  const myTasksFaculty = myItems.filter(t => t.sourceType === "task");
  const myFormsFaculty = myItems.filter(t => t.sourceType === "form");

  const trackingBucketOf = (status) => {
    if (["Approved", "Completed", "Archived", "Received"].includes(status)) return "Approved";
    if (status === "Rejected") return "Rejected";
    if (status === "Returned") return "Returned";
    return "Pending";
  };
  const trackingBuckets = { Approved: 0, Pending: 0, Returned: 0, Rejected: 0 };
  myItems.forEach(t => { trackingBuckets[trackingBucketOf(t.status)]++; });
  const trackingOverviewData = [
    { name: "Approved", value: trackingBuckets.Approved, color: "#22c55e" },
    { name: "Pending",  value: trackingBuckets.Pending,  color: "#5e3bdb" },
    { name: "Returned", value: trackingBuckets.Returned, color: "#f59e0b" },
    { name: "Rejected", value: trackingBuckets.Rejected, color: "#ef4444" },
  ];
  const trackingOverviewTotal = trackingOverviewData.reduce((s, d) => s + d.value, 0);

  const DONE_FOR_DEADLINES = ["Approved", "Completed", "Archived", "Rejected"];
  const upcomingDeadlines = myItems
    .filter(t => !DONE_FOR_DEADLINES.includes(t.status) && t.dateObj)
    .map(t => ({ ...t, daysLeft: Math.ceil((t.dateObj - now) / 86400000) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  /* ════════════════════════════════════════════════════════════════════
     Charts, activity feed, workflow snapshot & department overview —
     all derived live from trackedItems / facultyPerformance / delayedDocs
     (the same fetched state powering the rest of the dashboard) instead
     of hardcoded sample data. Two notes on the data we don't have yet:
       • There's no completion/approval timestamp in the API responses,
         only a submission date — so "processing time" and "this month's
         completions" are approximated from the submission month + the
         item's current age. Add an `updated_at`/`resolved_at` column to
         documents/forms/tasks (and return it from /api/tracking,
         /api/tasks, /api/forms/all) to make these exact.
       • Recent Activity is reconstructed from the tracking/task/form
         rows themselves (most-recently-dated items), not a true audit
         log — so it shows the latest submissions/approvals/overdue
         items, but can't distinguish e.g. "assigned" from "created" the
         way a dedicated activity_log table + /api/activity endpoint
         could. ══════════════════════════════════════════════════════ */
  const DONE_ITEM_STATUSES = ["Approved", "Completed", "Archived"];
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({ label: MONTH_ABBR[d.getMonth()], year: d.getFullYear(), month: d.getMonth() });
  }

  // Approval Rate donut — status breakdown for items submitted this month
  const monthStartForCharts = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemsThisMonth = trackedItems.filter(t => t.dateObj && t.dateObj >= monthStartForCharts);
  const approvalRateData = [
    { name: "Approved", value: itemsThisMonth.filter(t => t.status === "Approved" || t.status === "Completed").length, color: "#059669" },
    { name: "Rejected", value: itemsThisMonth.filter(t => t.status === "Rejected").length, color: "#dc2626" },
    { name: "Returned", value: itemsThisMonth.filter(t => t.status === "Returned").length, color: "#d97706" },
    { name: "Pending",  value: itemsThisMonth.filter(t => !DONE_ITEM_STATUSES.includes(t.status) && t.status !== "Rejected" && t.status !== "Returned").length, color: "#5e3bdb" },
  ];

  // Task Completion — assigned vs completed tasks, last 6 calendar weeks
  const last6Weeks = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    last6Weeks.push({ label: `W${6 - i}`, start, end });
  }
  const allTaskItems = trackedItems.filter(t => t.sourceType === "task");
  const taskCompletionData = last6Weeks.map(({ label, start, end }) => {
    const inWeek = allTaskItems.filter(t => t.dateObj && t.dateObj >= start && t.dateObj < end);
    return {
      week: label,
      assigned: inWeek.length,
      completed: inWeek.filter(t => DONE_ITEM_STATUSES.includes(t.status)).length,
    };
  });

  // Recent Activity — most recently dated documents/forms/tasks, newest first
  const ACTIVITY_PRESET_BY_STATUS = {
    "Approved":  { action: "Approved",              type: "approved"  },
    "Completed": { action: "Completed task",         type: "completed" },
    "Rejected":  { action: "Rejected",               type: "revision"  },
    "Returned":  { action: "Returned for revision",  type: "revision"  },
    "Overdue":   { action: "Overdue — no update",    type: "overdue"   },
  };
  const recentActivityData = [...trackedItems]
    .filter(t => t.dateObj)
    .sort((a, b) => b.dateObj - a.dateObj)
    .slice(0, 8)
    .map(t => {
      const preset = ACTIVITY_PRESET_BY_STATUS[t.status];
      const action = preset ? preset.action : t.sourceType === "task" ? "Assigned task" : "Submitted form";
      const type = preset ? preset.type : t.sourceType === "task" ? "assigned" : "submitted";
      return {
        id: `${t.sourceType}-${t.id}`,
        time: t.dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        actor: t.person || "—",
        action,
        target: t.title ? `${t.title}${t.id ? ` — ${t.id}` : ""}` : t.id,
        type,
      };
    });

  // Still used by Department Overview's "Active Workflows" stat
  const activeWorkflowItems = trackedItems.filter(t => !DONE_ITEM_STATUSES.includes(t.status) && t.status !== "Rejected");

  // Department Overview — live faculty/workflow/form/task counts
  const formsSubmittedThisMonth = itemsThisMonth.filter(t => t.sourceType === "form").length;
  const tasksCompletedThisMonth = trackedItems.filter(t =>
    t.sourceType === "task" && DONE_ITEM_STATUSES.includes(t.status) && t.dateObj && t.dateObj >= monthStartForCharts
  ).length;
  const approvedItemsOnly = trackedItems.filter(t => t.status === "Approved");
  const avgApprovalDays = approvedItemsOnly.length ? approvedItemsOnly.reduce((sum, t) => sum + t.days, 0) / approvedItemsOnly.length : 0;

  // Monthly Task Completion Trend — completed tasks per month, last 6 months,
  // powers the Department Overview mini bar chart (mirrors the DS PATH mockup).
  const monthlyTaskCompletionData = last6Months.map(({ label, year, month }) => ({
    month: label,
    completed: allTaskItems.filter(t =>
      DONE_ITEM_STATUSES.includes(t.status) && t.dateObj && t.dateObj.getFullYear() === year && t.dateObj.getMonth() === month
    ).length,
  }));
  const maxMonthlyTaskCompletion = Math.max(1, ...monthlyTaskCompletionData.map(d => d.completed));
  const prevMonthTaskCompletion = monthlyTaskCompletionData.length > 1
    ? monthlyTaskCompletionData[monthlyTaskCompletionData.length - 2].completed
    : 0;
  const taskCompletionPctChange = prevMonthTaskCompletion > 0
    ? Math.round(((tasksCompletedThisMonth - prevMonthTaskCompletion) / prevMonthTaskCompletion) * 1000) / 10
    : null;


  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      <Sidebar activePage="dashboard" />

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        {/* Topbar */}
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
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus /> New Document
            </button>
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#5e3bdb] text-white hover:bg-[#481bc6] whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Download /> Intake Document
            </button>
          </div>
        </TopBar>

        {/* ── Content: Program Chair layout ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#faf8ff", overflowY: "auto" }}>

          {/* ── Welcome Header ── */}
          <div style={{ background: "#faf8ff", borderBottom: "1px solid #c9c4d7", padding: "24px 32px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 700, color: "#191b24", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 4 }}>
                  Good morning, {displayName}
                </h1>
                <p style={{ fontSize: 14, color: "#484555" }}>{displayRole} — Bachelor of Science in Information Systems, College of Information Technology</p>
                <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "#e6deff", color: "#1c0062" }}>
                  <ShieldAlert style={{ width: 13, height: 13 }} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>PATH Administrator</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Notification bell */}
                <button
                  onClick={() => setNotifOpen(v => !v)}
                  style={{ position: "relative", width: 38, height: 38, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#484555" }}
                >
                  <Bell style={{ width: 18, height: 18 }} />
                  {unread > 0 && (
                    <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ba1a1a", border: "2px solid #faf8ff" }} />
                  )}
                </button>

                {/* Quick refresh */}
                <button style={{ width: 30, height: 30, borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#484555" }}>
                  <RefreshCw style={{ width: 16, height: 16 }} />
                </button>

                {/* Date/time */}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#191b24" }}>{dateStr}</p>
                  <p style={{ fontSize: 11, color: "#484555" }}>{timeStr}</p>
                </div>
              </div>
            </div>

            {/* KPI strip — rounded-xl cards with a top icon chip, matching the mockup's stat-card style */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 20 }}>
              {kpis.map(k => (
                <div key={k.label} style={{ background: "#ffffff", border: "1px solid #c9c4d7", borderRadius: 12, padding: 16, boxShadow: "0 1px 3px rgba(25,27,36,0.05)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <k.icon style={{ width: 15, height: 15, color: k.color }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#484555", textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: k.color, lineHeight: 1.3, marginTop: 2 }}>{kpisLoading ? "—" : k.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notification dropdown */}
          {notifOpen && (
            <div style={{ position: "fixed", top: 140, right: 32, width: 360, background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 12px 40px rgba(0,0,0,0.14)", zIndex: 200 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</span>
                  {unread > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: "#5e3bdb", color: "#fff", padding: "1px 7px", borderRadius: 20 }}>{unread} new</span>}
                </div>
                <button onClick={() => setNotifOpen(false)} style={{ width: 26, height: 26, borderRadius: 6, background: "#f3f4f6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle style={{ width: 13, height: 13, color: "#6b7280" }} />
                </button>
              </div>
              {NOTIFICATIONS.map(n => {
                const cfg = NOTIF_CFG[n.type];
                const NIcon = cfg.icon;
                return (
                  <div key={n.id} style={{ display: "flex", gap: 10, padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", background: n.read ? "#fff" : "#faf5ff" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <NIcon style={{ width: 13, height: 13, color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: "#111827" }}>{n.text}</p>
                      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>{n.sub}</p>
                      <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{n.time}</p>
                    </div>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#5e3bdb", marginTop: 4, flexShrink: 0 }} />}
                  </div>
                );
              })}
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
                <button style={{ fontSize: 12, color: "#5e3bdb", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All Notifications</button>
              </div>
            </div>
          )}

          {/* ── Main grid ── */}
          <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

            {canViewAdminNav ? (
            <>
            {/* Row 1: Approval Queue + Alerts (75% / 25%, mirrors the mockup's 4-col grid) */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16 }}>

              {/* Document, Form & Task Tracking — merges forms, tasks, and
                  documents into one table, the same way Tracking.jsx does */}
              <SectionCard
                title="Document, Form & Task Tracking"
                subtitle="All forms, tasks, and documents currently in your workflow"
                icon={ClipboardList}
                noPad
                action={
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#fef2f2", color: "#dc2626", padding: "3px 10px", borderRadius: 20, border: "1px solid #fecaca" }}>
                    {itemsLoading ? "…" : trackedItems.length} tracked
                  </span>
                }
              >
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ background: "#f6f2ff", borderBottom: "1px solid #cbc3d7" }}>
                      {["ID", "Type", "Title", "Submitted By / Assigned To", "Date", "Priority", "Status", "Actions"].map(col => (
                        <th key={col} style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsLoading ? (
                      <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#7b7486", fontSize: 14 }}>Loading tasks, forms, and documents…</td></tr>
                    ) : trackedItems.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#7b7486", fontSize: 14 }}>Nothing in the system yet.</td></tr>
                    ) : trackedPageItems.map((row, idx) => {
                      const rowBg = row.days >= 7 && !["Approved", "Rejected", "Archived"].includes(row.status)
                        ? "rgba(220,38,38,0.025)"
                        : row.priority === "Urgent" ? "rgba(220,38,38,0.015)" : "#ffffff";
                      return (
                        <tr
                          key={row.id}
                          style={{ borderBottom: "1px solid #e3dfff", background: rowBg, transition: "background-color 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(246,242,255,0.6)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                        >
                          <td style={{ padding: "16px 24px", fontFamily: "monospace", fontWeight: 700, color: "#5e3bdb", fontSize: 12, whiteSpace: "nowrap" }}>{row.id}</td>
                          <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}><TypeBadge type={row.sourceType} /></td>
                          <td style={{ padding: "16px 24px", fontSize: 14, fontWeight: 500, color: "#181445" }}>{row.title}</td>
                          <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454", whiteSpace: "nowrap" }}>{row.person}</td>
                          <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454", whiteSpace: "nowrap" }}>{row.date}</td>
                          <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}><PriorityPill p={row.priority} /></td>
                          <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <StatusBadge s={row.status} />
                              {row.days >= 5 && !["Approved", "Rejected", "Archived"].includes(row.status) && <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle style={{ width: 9, height: 9 }} />{row.days}d</span>}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                            <button onClick={() => navigate("/tracking")} style={{ padding: "4px 9px", borderRadius: 6, background: "#f3f2ff", color: "#5e3bdb", fontSize: 11, fontWeight: 600, border: "1px solid #ddd6fe", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <Eye style={{ width: 11, height: 11 }} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination controls */}
                {!itemsLoading && trackedItems.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderTop: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      Showing {(trackedPage - 1) * TRACKED_PAGE_SIZE + 1}
                      –{Math.min(trackedPage * TRACKED_PAGE_SIZE, trackedItems.length)} of {trackedItems.length}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => setTrackedPage(p => Math.max(1, p - 1))}
                        disabled={trackedPage === 1}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "1px solid #e5e7eb", background: trackedPage === 1 ? "#f9fafb" : "#fff",
                          color: trackedPage === 1 ? "#c1c5cb" : "#374151",
                          cursor: trackedPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: 11, color: "#374151", fontWeight: 600, padding: "0 4px" }}>
                        Page {trackedPage} of {trackedTotalPages}
                      </span>
                      <button
                        onClick={() => setTrackedPage(p => Math.min(trackedTotalPages, p + 1))}
                        disabled={trackedPage === trackedTotalPages}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "1px solid #e5e7eb", background: trackedPage === trackedTotalPages ? "#f9fafb" : "#fff",
                          color: trackedPage === trackedTotalPages ? "#c1c5cb" : "#374151",
                          cursor: trackedPage === trackedTotalPages ? "not-allowed" : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Right column: Bottleneck & Delay Alerts stacked above Quick
                  Actions, so the column fills out next to the taller
                  tracking table instead of leaving empty space below. */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Bottleneck & Delay Alerts — live data, same source/logic as
                    the Bottleneck tab on Reports.jsx. Solid alert-tinted card,
                    matching the DS PATH mockup's "Bottlenecks & Alerts" panel. */}
                <div
                  onClick={() => BOTTLENECK_ALERTS.length > 0 && setAlertsModalOpen(true)}
                  style={{
                    background: "#ffdad6", border: "1px solid #ffb4ab", borderRadius: 12,
                    padding: 20, boxShadow: "0 1px 3px rgba(25,27,36,0.05)", position: "relative",
                    overflow: "hidden", display: "flex", flexDirection: "column", gap: 20,
                    cursor: BOTTLENECK_ALERTS.length > 0 ? "pointer" : "default",
                  }}
                >
                  <TriangleAlert style={{ position: "absolute", right: -14, top: -14, width: 100, height: 100, color: "#ba1a1a", opacity: 0.1 }} />

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#93000a" }}>Bottlenecks &amp; Alerts</h3>
                    <p style={{ fontSize: 12, color: "#93000a", opacity: 0.8, marginTop: 2 }}>
                      {BOTTLENECK_ALERTS.length === 0 ? "Everything is moving smoothly" : "Immediate attention required"}
                    </p>
                  </div>

                  {itemsLoading ? (
                    <p style={{ fontSize: 12, color: "#93000a", opacity: 0.7, textAlign: "center", padding: "16px 0", position: "relative", zIndex: 1 }}>Loading alerts…</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
                      {Object.entries(ALERT_TIER_CFG).map(([tier, cfg]) => {
                        const count = BOTTLENECK_ALERTS.filter(a => a.tier === tier).length;
                        return (
                          <div key={tier} style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, display: "inline-block" }} />
                              <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                            </div>
                            <span style={{ fontSize: tier === "critical" ? 24 : 18, fontWeight: 700, color: cfg.color, lineHeight: 1 }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Actions — shortcut list to fill the remaining space
                    in this column, matching the DS PATH shortcuts panel. */}
                <QuickActionsPanel navigate={navigate} />
              </div>
            </div>

            {/* Row 2: Faculty Performance (60%) + Department Overview (40%),
                mirrors the mockup's lg:col-span-3 / lg:col-span-2 of 5 split */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16 }}>

              {/* Left column: Faculty Performance + Approval Rate, stacked */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Faculty Performance — table layout mirroring the DS PATH
                    mockup's "Faculty Performance Summary" card: header with
                    a "View All" link, then a table with avatar/name, Tasks
                    Done, Active, Pending, and a Success Rate progress bar. */}
                <SectionCard
                  title="Faculty Performance Summary"
                  subtitle="Activity and completion rates across department faculty"
                  icon={Users}
                  noPad
                  action={
                    facultyPerformance.length > 0 && (
                      <button
                        onClick={() => setFacultyModalOpen(true)}
                        style={{ background: "none", border: "none", color: "#5e3bdb", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        View All
                      </button>
                    )
                  }
                >
                  {facultyLoading ? (
                    <p style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading faculty performance…</p>
                  ) : facultyPerformance.length === 0 ? (
                    <p style={{ padding: "24px 16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No faculty performance data yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ background: "#f6f2ff", borderBottom: "1px solid #cbc3d7" }}>
                            <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em" }}>Faculty Member</th>
                            <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Tasks Done</th>
                            <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Active</th>
                            <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Pending</th>
                            <th style={{ padding: "16px 24px", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em" }}>Success Rate</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {facultyPerformance.slice(0, 4).map((f, idx) => (
                            <FacultyPerformanceTableRow key={f.id} f={f} idx={idx} delayedDocs={delayedDocs} onClick={setSelectedFaculty} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </SectionCard>

                <FacultyPerformanceModal
                  open={facultyModalOpen}
                  onClose={() => setFacultyModalOpen(false)}
                  faculty={facultyPerformance}
                  delayedDocs={delayedDocs}
                  onSelectFaculty={setSelectedFaculty}
                />

                <FacultyDetailPanel
                  open={!!selectedFaculty}
                  onClose={() => setSelectedFaculty(null)}
                  onBack={facultyModalOpen ? () => setSelectedFaculty(null) : null}
                  faculty={selectedFaculty}
                  delayedDocs={delayedDocs}
                  trackedItems={trackedItems}
                />
              </div>

              {/* Right column: Department Overview — solid primary card with an
                  approval-rate ring up top, mirrors the DS PATH mockup */}
              <div style={{ background: "#5e3bdb", color: "#ffffff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(25,27,36,0.08)", position: "relative", overflow: "hidden" }}>
                <Building2 style={{ position: "absolute", right: -16, bottom: -16, width: 120, height: 120, opacity: 0.15 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Department Overview</h3>
                  <p style={{ fontSize: 11, color: "#cabeff", marginBottom: 14 }}>Bachelor of Science in Information Systems - College of Information Technology</p>

                  {/* Approval-rate ring */}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(0,0,0,0.1)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="16" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${itemsThisMonth.length ? Math.round((approvalRateData.find(d => d.name === "Approved")?.value ?? 0) / itemsThisMonth.length * 100) : 0}, 100`}
                        />
                      </svg>
                      <span style={{ position: "absolute", fontSize: 11, fontWeight: 700 }}>
                        {itemsThisMonth.length ? Math.round((approvalRateData.find(d => d.name === "Approved")?.value ?? 0) / itemsThisMonth.length * 100) : 0}%
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: "#cabeff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Approval Rate</p>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>This month</p>
                    </div>
                  </div>

                  {/* Monthly Task Completion Trend — mirrors the DS PATH mockup's
                      bar chart, driven by live completed-task counts per month */}
                  <div style={{ background: "rgba(0,0,0,0.1)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "#cabeff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Monthly Task Completion Trend</p>
                        <p style={{ fontSize: 18, fontWeight: 700 }}>{tasksCompletedThisMonth} Tasks Completed</p>
                      </div>
                      {taskCompletionPctChange !== null && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,255,255,0.2)", padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                          {taskCompletionPctChange >= 0 ? "+" : ""}{taskCompletionPctChange}%
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 56 }}>
                      {monthlyTaskCompletionData.map((d, i) => {
                        const isLast = i === monthlyTaskCompletionData.length - 1;
                        const heightPct = Math.max(8, Math.round((d.completed / maxMonthlyTaskCompletion) * 100));
                        return (
                          <div key={d.month} style={{ flex: 1, height: "100%", display: "flex", alignItems: "flex-end" }}>
                            <div
                              title={`${d.month}: ${d.completed} completed`}
                              style={{ width: "100%", height: `${heightPct}%`, background: "#ffffff", opacity: isLast ? 1 : 0.3 + (i / monthlyTaskCompletionData.length) * 0.4, borderRadius: "3px 3px 0 0" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      {monthlyTaskCompletionData.map(d => (
                        <span key={d.month} style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.03em", flex: 1, textAlign: "center" }}>{d.month}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <div style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 12 }}>
                      <p style={{ fontSize: 10, color: "#cabeff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Faculty</p>
                      <p style={{ fontSize: 24, fontWeight: 700 }}>{facultyPerformance.length}</p>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 12 }}>
                      <p style={{ fontSize: 10, color: "#cabeff", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Active Workflows</p>
                      <p style={{ fontSize: 24, fontWeight: 700 }}>{activeWorkflowItems.length}</p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#cabeff" }}>Avg Approval Time</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{avgApprovalDays.toFixed(1)} Days</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: "#cabeff" }}>Forms Submitted (mo.)</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{formsSubmittedThisMonth}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#cabeff" }}>Monthly Completions</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{tasksCompletedThisMonth}</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr", gap: 16, alignItems: "start" }}>

                {/* Left column: Upcoming Deadlines + My Tasks + My Forms */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <SectionCard
                    title="Upcoming Deadlines"
                    subtitle="Stay ahead of your closest due dates"
                    icon={Calendar}
                    noPad
                    action={
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "#f3f2ff", border: "1px solid #ddd6fe", borderRadius: 20, padding: "5px 12px" }}>
                        {upcomingDeadlines.length} Upcoming
                      </span>
                    }
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                          {["Task Title", "Due Date", "Status", "Action"].map(col => (
                            <th key={col} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingDeadlines.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No upcoming deadlines.</td></tr>
                        ) : upcomingDeadlines.map(t => {
                          const overdue = t.daysLeft < 0;
                          const dueSoon = !overdue && t.daysLeft <= 3;
                          const pillColor = overdue ? "#991b1b" : dueSoon ? "#92400e" : "#0369a1";
                          const pillBg    = overdue ? "#fef2f2" : dueSoon ? "#fef3c7" : "#f0f9ff";
                          const pillDot   = overdue ? "#ef4444" : dueSoon ? "#f59e0b" : "#38bdf8";
                          const label = overdue ? "Overdue" : `${t.daysLeft} Day${t.daysLeft === 1 ? "" : "s"} Left`;
                          return (
                            <tr key={t.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{t.title}</td>
                              <td style={{ padding: "10px 14px", color: overdue ? "#dc2626" : "#6b7280", fontWeight: overdue ? 700 : 400, whiteSpace: "nowrap" }}>{t.date}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: pillBg, color: pillColor }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: pillDot }} />
                                  {label}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <button onClick={() => navigate("/tasks")} style={{ fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "none", border: "none", cursor: "pointer" }}>View Task</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </SectionCard>

                  <SectionCard
                    title="My Tasks"
                    subtitle="Review and manage your current administrative assignments"
                    icon={ListTodo}
                    noPad
                    action={
                      <button onClick={() => navigate("/tasks")} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "#f3f2ff", border: "1px solid #ddd6fe", borderRadius: 20, padding: "5px 12px", cursor: "pointer" }}>
                        View All Tasks <ChevronRight style={{ width: 12, height: 12 }} />
                      </button>
                    }
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                          {["Task Title", "Priority", "Due Date", "Status", "Action"].map(col => (
                            <th key={col} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {itemsLoading ? (
                          <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading…</td></tr>
                        ) : myTasksFaculty.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No tasks assigned to you yet.</td></tr>
                        ) : myTasksFaculty.slice(0, 6).map(t => {
                          const pCfg = PRIORITY_CFG[t.priority] || PRIORITY_CFG.Normal;
                          const sCfg = STATUS_CFG[t.status?.toLowerCase()] || STATUS_CFG["pending"];
                          return (
                            <tr key={t.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{t.title}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: pCfg.bg, color: pCfg.color }}>{t.priority}</span>
                              </td>
                              <td style={{ padding: "10px 14px", color: t.status === "Overdue" ? "#dc2626" : "#6b7280", fontWeight: t.status === "Overdue" ? 700 : 400, whiteSpace: "nowrap" }}>{t.date}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: sCfg.bg, color: sCfg.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: sCfg.dot }} />
                                  {t.status}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <button onClick={() => navigate("/tasks")} style={{ fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "none", border: "none", cursor: "pointer" }}>View Task</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </SectionCard>

                  <SectionCard
                    title="My Forms"
                    subtitle="Tracking your recently submitted document requests"
                    icon={FileText}
                    noPad
                    action={
                      <button onClick={() => navigate("/forms")} style={{ fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "none", border: "none", cursor: "pointer" }}>Manage All Forms</button>
                    }
                  >
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                          {["Form Name", "Submission Date", "Current Status", "Action"].map(col => (
                            <th key={col} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {myFormsDataLoading ? (
                          <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading…</td></tr>
                        ) : myFormsData.length === 0 ? (
                          <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>You haven't submitted any forms yet.</td></tr>
                        ) : myFormsData.slice(0, 6).map(f => {
                          const sCfg = STATUS_CFG[f.status?.toLowerCase()] || STATUS_CFG["pending"];
                          return (
                            <tr key={f.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{f.title}</td>
                              <td style={{ padding: "10px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{f.date}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: sCfg.bg, color: sCfg.color }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: sCfg.dot }} />
                                  {f.status}
                                </span>
                              </td>
                              <td style={{ padding: "10px 14px" }}>
                                <button onClick={() => navigate("/tracking")} style={{ fontSize: 11, fontWeight: 700, color: "#5e3bdb", background: "#f3f2ff", border: "1px solid #ddd6fe", borderRadius: 20, padding: "3px 10px", cursor: "pointer" }}>Track</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </SectionCard>
                </div>

                {/* Right column: Tracking Overview donut + Notifications + Upcoming Deadlines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <SectionCard title="Tracking Overview" subtitle="Status distribution of all your documents" icon={PieChart}>
                    {trackingOverviewTotal === 0 ? (
                      <p style={{ padding: "30px 0", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No tracked items yet.</p>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <RPie>
                            <Pie data={trackingOverviewData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                              {trackingOverviewData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTip />} />
                          </RPie>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 14px", marginTop: 4 }}>
                          {trackingOverviewData.map(d => (
                            <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7280" }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} /> {d.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </SectionCard>

                  <QuickActionsPanel navigate={navigate} actions={FACULTY_QUICK_ACTIONS} />

                </div>
              </div>
              </div>
            )}

          </div>

          {/* All Alerts modal (Bottleneck & Alerts) */}
          {alertsModalOpen && (
            <div
              onClick={() => setAlertsModalOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", zIndex: 2500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>All Alerts</p>
                    <p style={{ fontSize: 11.5, color: "#6b7280" }}>{BOTTLENECK_ALERTS.length} items requiring immediate attention</p>
                  </div>
                  <button
                    onClick={() => setAlertsModalOpen(false)}
                    style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f3f4f6", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 22px", maxHeight: "70vh", overflowY: "auto" }}>
                  {BOTTLENECK_ALERTS.map(a => {
                    const cfg = ALERT_TIER_CFG[a.tier];
                    const AlertIcon = a.icon;
                    return (
                      <div
                        key={a.key}
                        style={{ display: "flex", alignItems: "flex-start", gap: 12, background: cfg.bg, borderLeft: `3px solid ${cfg.border}`, borderRadius: 10, padding: "12px 14px" }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AlertIcon style={{ width: 14, height: 14, color: cfg.iconColor }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{a.title}</p>
                            {cfg.showPill && (
                              <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#dc2626", color: "#fff", letterSpacing: 0.3 }}>
                                CRITICAL
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: 11.5, color: "#4b5563", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
    </div>
  );
}