import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  FileText, Clock, AlertTriangle, CheckCircle2, XCircle, Users,
  ChevronRight, TrendingUp, TrendingDown, Activity, Zap, Building2,
  Bell, Flag, Eye, BarChart3, AlertCircle, Calendar, Layers,
  TriangleAlert, ShieldAlert, Plus, Send, RotateCcw, UserCheck,
  ClipboardList, Inbox, MessageSquare, Megaphone, RefreshCw,
  Filter, Search, CircleCheck, Timer, ArrowUpRight, BookOpen,
  GraduationCap, Star, MoreHorizontal, ChevronDown, Sparkles,
  ListTodo, Gauge, PieChart, X,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),
};

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

// ─── Sample Data (Program Chair layout) ────────────────────────────────────────
// Note: the "Document, Form & Task Tracking" table no longer uses sample data —
// it fetches real tasks, forms, and documents from the API (see fetchTrackedItems
// below). The arrays below still power the charts and the Task Overview widget.

const MONTHLY_SUBMISSIONS = [
  { month: "Jan", submitted: 22, approved: 18, rejected: 2 },
  { month: "Feb", submitted: 28, approved: 23, rejected: 3 },
  { month: "Mar", submitted: 31, approved: 26, rejected: 4 },
  { month: "Apr", submitted: 25, approved: 21, rejected: 2 },
  { month: "May", submitted: 38, approved: 32, rejected: 4 },
  { month: "Jun", submitted: 41, approved: 31, rejected: 5 },
];


const TASK_TREND = [
  { week: "W1", assigned: 8, completed: 6 },
  { week: "W2", assigned: 11, completed: 9 },
  { week: "W3", assigned: 7, completed: 10 },
  { week: "W4", assigned: 13, completed: 8 },
  { week: "W5", assigned: 9, completed: 12 },
  { week: "W6", assigned: 15, completed: 11 },
];

const PROCESSING_TREND = [
  { month: "Jan", days: 5.8 },
  { month: "Feb", days: 5.2 },
  { month: "Mar", days: 4.9 },
  { month: "Apr", days: 6.1 },
  { month: "May", days: 4.5 },
  { month: "Jun", days: 4.2 },
];

const APPROVAL_PIE = [
  { name: "Approved",   value: 31, color: "#059669" },
  { name: "Rejected",   value: 5,  color: "#dc2626" },
  { name: "Returned",   value: 4,  color: "#d97706" },
  { name: "Pending",    value: 6,  color: "#7c3aed" },
];

// Maps raw backend status values to the display labels used by StatusBadge
const REAL_STATUS_DISPLAY = {
  "pending":        "Pending",
  "in review":      "Under Review",
  "for approval":   "For Approval",
  "returned":       "Returned",
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

const ACTIVITY_FEED = [
  { id: 1,  time: "9:48 AM",  actor: "You",                   action: "Approved",               target: "FRM-2026-029",                   type: "approved"   },
  { id: 2,  time: "9:31 AM",  actor: "Juan Miguel Reyes",     action: "Submitted form",          target: "Thesis Defense Schedule",         type: "submitted"  },
  { id: 3,  time: "9:15 AM",  actor: "Dr. Luisa Fernandez",   action: "Completed task",          target: "Finalize Elective Subjects List", type: "completed"  },
  { id: 4,  time: "8:52 AM",  actor: "You",                   action: "Assigned task",           target: "TSK-006 → Self",                  type: "assigned"   },
  { id: 5,  time: "8:40 AM",  actor: "Records Office",        action: "Returned for revision",   target: "FRM-2026-028",                    type: "revision"   },
  { id: 6,  time: "8:22 AM",  actor: "Prof. Ana Reyes",       action: "Submitted form",          target: "Leave of Absence",                type: "submitted"  },
  { id: 7,  time: "Yesterday", actor: "You",                  action: "Created workflow",        target: "Q3 Thesis Defense Flow",          type: "workflow"   },
  { id: 8,  time: "Yesterday", actor: "Ms. Grace Villanueva", action: "Overdue — no update",   target: "TSK-004",                         type: "overdue"    },
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
  "pending review": { color: "#5b21b6", bg: "#ede9fe", dot: "#7c3aed" },
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
  task:     { label: "Task",     bg: "#ede9fe", color: "#6d28d9" },
  form:     { label: "Form",     bg: "#dbeafe", color: "#1e40af" },
  document: { label: "Document", bg: "#d1fae5", color: "#065f46" },
};

const ACTIVITY_CFG = {
  approved:  { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2  },
  submitted: { color: "#7c3aed", bg: "#f5f3ff", icon: FileText      },
  completed: { color: "#059669", bg: "#ecfdf5", icon: CircleCheck   },
  assigned:  { color: "#0284c7", bg: "#e0f2fe", icon: UserCheck     },
  revision:  { color: "#d97706", bg: "#fffbeb", icon: RotateCcw     },
  workflow:  { color: "#7c3aed", bg: "#ede9fe", icon: Layers        },
  overdue:   { color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
};

const NOTIF_CFG = {
  submission:   { color: "#7c3aed", bg: "#f5f3ff", icon: Inbox        },
  completed:    { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 },
  revision:     { color: "#d97706", bg: "#fffbeb", icon: RotateCcw    },
  announcement: { color: "#0284c7", bg: "#e0f2fe", icon: Megaphone    },
};

// Bottleneck & Alerts tier styling — mirrors Reports.jsx's ALERT_TIER_CFG so
// this widget's live alerts render consistently with the full report.
const ALERT_TIER_CFG = {
  critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", iconBg: "#fee2e2", iconColor: "#dc2626", label: "Critical", showPill: true },
  warning:  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", iconBg: "#fef3c7", iconColor: "#d97706", label: "Warning",  showPill: false },
  info:     { color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd", iconBg: "#ede9fe", iconColor: "#7c3aed", label: "Info",     showPill: false },
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
    <div style={{ background: "#1e1b4b", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#fff" }}>
      <p style={{ fontWeight: 700, marginBottom: 4, color: "#c4b5fd" }}>{label}</p>
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
    { label: "Active",  value: faculty.active_count ?? activeItems.length,    icon: Layers,       color: "#7c3aed", items: activeItems  },
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
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ede9fe", border: "2px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#5b21b6" }}>{initials}</span>
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

function SectionCard({ title, subtitle, icon: Icon, children, action, noPad, accentColor, titleColor, footer }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderTop: accentColor ? `3px solid ${accentColor}` : "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: accentColor ? `0 1px 4px ${accentColor}14` : "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 29, height: 29, borderRadius: 7, background: accentColor ? `${accentColor}18` : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon style={{ width: 14, height: 14, color: accentColor || "#7c3aed" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: titleColor || "#111827", lineHeight: 1.2 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 11, color: "#6b7280" }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: noPad ? 0 : "14px 18px", flex: 1 }}>{children}</div>
      {footer && <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>{footer}</div>}
    </div>
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
      const userMap = {};
      try {
        const res = await fetch(`${API}/api/users`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const users = data.users ?? data ?? [];
          (Array.isArray(users) ? users : []).forEach(u => {
            userMap[u.id] = u.full_name || u.name || u.username || `User #${u.id}`;
          });
        }
      } catch (err) { console.error("Users fetch error:", err); }
      const nameOf = (id) => userMap[id] || (id ? `User #${id}` : "—");

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
            merged.push({
              id: t.tracking_id || `TSK-${t.id}`,
              sourceType: "task",
              title: t.title,
              person: nameOf(t.faculty_id),
              date: fmtDate(t.deadline || rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status: overdue ? "Overdue" : status,
              days: daysSince(rawDate),
              priority: overdue ? "Urgent" : priorityFor(daysSince(rawDate), done),
            });
          });
        }
      } catch (err) { console.error("Tasks fetch error:", err); }

      // ── Forms submitted by faculty ───────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/forms/all`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const forms = data.forms ?? data ?? [];
          (Array.isArray(forms) ? forms : []).forEach(f => {
            const rawDate = f.filing_date || f.created_at;
            const status = displayStatus(f.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            const facultySubmitter =
              f.full_name || f.submitter_name || f.submitted_by || f.faculty_name ||
              f.user_name || f.username ||
              (f.user_id    ? nameOf(f.user_id)    : null) ||
              (f.faculty_id ? nameOf(f.faculty_id) : null) ||
              "—";
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
  }, [token, fetchTrackedItems, fetchFacultyPerformance, fetchDelayedDocuments]);

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

  const filteredTasks = taskItems.filter(t =>
    taskFilter === "All" ? true :
    taskFilter === "Overdue" ? t.overdue :
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

  const pendingApprovalsCount = trackedItems.filter(
    t => t.status === "Pending"
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

  const kpis = [
    { label: "Pending Approvals",      value: String(pendingApprovalsCount),      color: "#7c3aed", icon: ClipboardList },
    { label: "Active Tasks",           value: String(activeTasksCount),           color: "#d97706", icon: ListTodo      },
    { label: "Documents Under Review", value: String(documentsUnderReviewCount),  color: "#0284c7", icon: Eye           },
    { label: "Overdue Items",          value: String(overdueItemsCount),          color: "#dc2626", icon: AlertTriangle },
    { label: "Approved This Month",    value: String(approvedThisMonthCount),     color: "#059669", icon: CheckCircle2  },
    { label: "Active Faculty Members", value: String(activeFacultyCount),         color: "#5b21b6", icon: Users         },
  ];

  const kpisLoading = itemsLoading || facultyLoading;

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

          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => navigate("/reports")} />
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

        {/* ── Content: Program Chair layout ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto" }}>

          {/* ── Welcome Banner ── */}
          <div style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #3b1fa8 60%, #5b21b6 100%)",
            padding: "24px 32px",
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", bottom: -60, right: 120, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                {/* Avatar */}
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{displayName.slice(0, 2).toUpperCase()}</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <Sparkles style={{ width: 14, height: 14, color: "#c4b5fd" }} />
                    <span style={{ fontSize: 12, color: "#c4b5fd", fontWeight: 500 }}>Good morning</span>
                  </div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 2 }}>
                    {displayName}
                  </h1>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{displayRole} — Bachelor of Science in Information Systems, College of Information Technology</span>
                    <span style={{ fontSize: 11, color: "#a78bfa", background: "rgba(167,139,250,0.15)", padding: "2px 8px", borderRadius: 20, border: "1px solid rgba(167,139,250,0.3)" }}>
                      PATH Administrator
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Date/time */}
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Today</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{dateStr}</p>
                  <p style={{ fontSize: 12, color: "#c4b5fd" }}>{timeStr}</p>
                </div>

                {/* Notification bell */}
                <button
                  onClick={() => setNotifOpen(v => !v)}
                  style={{ position: "relative", width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Bell style={{ width: 18, height: 18, color: "#fff" }} />
                  {unread > 0 && (
                    <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#ef4444", border: "2px solid #1e1b4b" }} />
                  )}
                </button>

                {/* Quick refresh */}
                <button style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshCw style={{ width: 16, height: 16, color: "#c4b5fd" }} />
                </button>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginTop: 20, position: "relative", zIndex: 1 }}>
              {kpis.map(k => (
                <div key={k.label} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", backdropFilter: "blur(4px)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${k.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <k.icon style={{ width: 13, height: 13, color: k.color === "#7c3aed" || k.color === "#5b21b6" ? "#c4b5fd" : k.color === "#059669" ? "#6ee7b7" : k.color === "#0284c7" ? "#7dd3fc" : k.color === "#d97706" ? "#fde68a" : "#fca5a5" }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{kpisLoading ? "—" : k.value}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 3, lineHeight: 1.3 }}>{k.label}</p>
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
                  {unread > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: "#7c3aed", color: "#fff", padding: "1px 7px", borderRadius: 20 }}>{unread} new</span>}
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
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#7c3aed", marginTop: 4, flexShrink: 0 }} />}
                  </div>
                );
              })}
              <div style={{ padding: "10px 16px", textAlign: "center" }}>
                <button style={{ fontSize: 12, color: "#7c3aed", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View All Notifications</button>
              </div>
            </div>
          )}

          {/* ── Main grid ── */}
          <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Quick Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Create Task",          icon: Plus,        color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Assign Task",           icon: UserCheck,   color: "#0284c7", bg: "#e0f2fe" },
                { label: "View Pending",          icon: ClipboardList,color: "#d97706",bg: "#fffbeb" },
                { label: "Workflow Monitor",      icon: Gauge,       color: "#059669", bg: "#ecfdf5" },
                { label: "Generate Report",       icon: BarChart3,   color: "#5b21b6", bg: "#ede9fe" },
                { label: "Send Announcement",     icon: Megaphone,   color: "#0369a1", bg: "#e0f2fe" },
              ].map(a => (
                <button
                  key={a.label}
                  style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "12px 8px", borderRadius: 10, background: "#fff", border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 3px rgba(91,33,182,0.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = a.bg; e.currentTarget.style.borderColor = `${a.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <a.icon style={{ width: 16, height: 16, color: a.color }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3 }}>{a.label}</span>
                </button>
              ))}
            </div>

            {/* Row 1: Approval Queue + Alerts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>

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
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                      {["ID", "Type", "Title", "Submitted By / Assigned To", "Date", "Priority", "Status", "Actions"].map(col => (
                        <th key={col} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itemsLoading ? (
                      <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading tasks, forms, and documents…</td></tr>
                    ) : trackedItems.length === 0 ? (
                      <tr><td colSpan={8} style={{ padding: 28, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Nothing in the system yet.</td></tr>
                    ) : trackedPageItems.map((row, idx) => {
                      return (
                        <tr
                          key={row.id}
                          style={{
                            borderBottom: idx < trackedPageItems.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                            background: row.days >= 7 && !["Approved", "Rejected", "Archived"].includes(row.status) ? "rgba(220,38,38,0.025)" : row.priority === "Urgent" ? "rgba(220,38,38,0.015)" : "#fff",
                          }}
                        >
                          <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>{row.id}</td>
                          <td style={{ padding: "12px 14px" }}><TypeBadge type={row.sourceType} /></td>
                          <td style={{ padding: "12px 14px", fontWeight: 500, color: "#111827" }}>{row.title}</td>
                          <td style={{ padding: "12px 14px", color: "#374151" }}>{row.person}</td>
                          <td style={{ padding: "12px 14px", color: "#6b7280", whiteSpace: "nowrap" }}>{row.date}</td>
                          <td style={{ padding: "12px 14px" }}><PriorityPill p={row.priority} /></td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                              <StatusBadge s={row.status} />
                              {row.days >= 5 && !["Approved", "Rejected", "Archived"].includes(row.status) && <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}><AlertTriangle style={{ width: 9, height: 9 }} />{row.days}d</span>}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <button onClick={() => navigate("/tracking")} style={{ padding: "4px 9px", borderRadius: 6, background: "#f5f3ff", color: "#7c3aed", fontSize: 11, fontWeight: 600, border: "1px solid #ddd6fe", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
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

              {/* Bottleneck & Delay Alerts — live data, same source/logic as
                  the Bottleneck tab on Reports.jsx */}
              <SectionCard
                title="Bottleneck & Alerts"
                subtitle="Items requiring immediate attention"
                icon={ShieldAlert}
                accentColor="#dc2626"
                titleColor="#dc2626"
                footer={
                  <button
                    onClick={() => (BOTTLENECK_ALERTS.length > 5 ? setAlertsModalOpen(true) : navigate("/reports"))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "transparent", color: "#dc2626", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", letterSpacing: "0.03em" }}
                  >
                    {BOTTLENECK_ALERTS.length > 5 ? `VIEW ALL ALERTS (${BOTTLENECK_ALERTS.length})` : "VIEW ALL CRITICAL ALERTS"}
                  </button>
                }
              >
                {itemsLoading ? (
                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Loading alerts…</p>
                ) : BOTTLENECK_ALERTS.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, height: "100%", padding: "24px 0" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 style={{ width: 20, height: 20, color: "#059669" }} />
                    </div>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>No active alerts</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>Everything is moving smoothly.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Severity breakdown strip — quick read on the mix of
                        alerts without having to scan the whole list */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                      {Object.entries(ALERT_TIER_CFG).map(([tier, cfg]) => {
                        const count = BOTTLENECK_ALERTS.filter(a => a.tier === tier).length;
                        return (
                          <div key={tier} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "7px 9px", borderRadius: 8, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{count}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, opacity: 0.85 }}>{cfg.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {BOTTLENECK_ALERTS.slice(0, 5).map(a => {
                        const cfg = ALERT_TIER_CFG[a.tier];
                        const AlertIcon = a.icon;
                        return (
                          <div key={a.key} style={{ display: "flex", gap: 9, padding: "9px 11px", borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              <AlertIcon style={{ width: 11, height: 11, color: cfg.iconColor }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 1, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{a.title}</span>
                                {cfg.showPill && (
                                  <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20, background: cfg.color, color: "#fff" }}>CRITICAL</span>
                                )}
                              </div>
                              <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{a.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* When there are only one or two alerts, the card would
                        otherwise trail off into dead space before the footer
                        (it stretches to match the taller table card next to
                        it). Fill that leftover room with a calm status note
                        instead of leaving it blank. */}
                    {BOTTLENECK_ALERTS.length <= 2 && (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, padding: "14px 0", borderRadius: 9, background: "#fafafa", border: "1px dashed #e5e7eb" }}>
                        <CheckCircle2 style={{ width: 16, height: 16, color: "#059669" }} />
                        <p style={{ fontSize: 11, color: "#6b7280", textAlign: "center" }}>
                          No other bottlenecks detected — the rest of the workflow is on track.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>
            </div>

            {/* Row 2: Tasks + Activity */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

              {/* Task Overview */}
              <SectionCard title="Pending Tasks Overview" subtitle="Tasks assigned to you and your faculty" icon={ListTodo}
                action={
                  <div style={{ display: "flex", gap: 4 }}>
                    {["All", "In Progress", "Not Started", "Overdue"].map(f => (
                      <button key={f} onClick={() => setTaskFilter(f)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: taskFilter === f ? 600 : 400, background: taskFilter === f ? "#7c3aed" : "#f3f4f6", color: taskFilter === f ? "#fff" : "#6b7280", border: "none", cursor: "pointer" }}>{f}</button>
                    ))}
                  </div>
                }
              >
                {/* Summary chips */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                  {[
                    { label: "Assigned",    value: taskItems.length,                                          color: "#7c3aed" },
                    { label: "In Progress", value: taskItems.filter(t => t.status === "In Progress").length,  color: "#0284c7" },
                    { label: "Completed",   value: taskItems.filter(t => t.status === "Completed" || t.status === "Approved").length, color: "#059669" },
                    { label: "Overdue",     value: taskItems.filter(t => t.overdue).length,                    color: "#dc2626" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "8px 10px", borderRadius: 8, background: `${s.color}10`, border: `1px solid ${s.color}20`, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ overflowX: "auto", borderRadius: 8, border: "1px solid rgba(0,0,0,0.07)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                        {["Task", "Assigned To", "Deadline", "Progress", "Status"].map(col => (
                          <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {itemsLoading ? (
                        <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading tasks…</td></tr>
                      ) : filteredTasks.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No tasks found.</td></tr>
                      ) : taskPageItems.map((task, idx) => (
                        <tr key={task.id} style={{ borderBottom: idx < taskPageItems.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none", background: task.overdue ? "rgba(220,38,38,0.03)" : "#fff" }}>
                          <td style={{ padding: "8px 12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {task.overdue && <AlertTriangle style={{ width: 11, height: 11, color: "#dc2626", flexShrink: 0 }} />}
                              <span style={{ fontWeight: 500, color: "#111827" }}>{task.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "8px 12px", color: "#374151", whiteSpace: "nowrap" }}>{task.assignedTo}</td>
                          <td style={{ padding: "8px 12px", color: task.overdue ? "#dc2626" : "#6b7280", fontWeight: task.overdue ? 700 : 400, whiteSpace: "nowrap" }}>{task.deadline}</td>
                          <td style={{ padding: "8px 12px", width: 120 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                                <div style={{ height: 5, borderRadius: 3, width: `${task.progress}%`, background: task.overdue ? "#dc2626" : task.progress > 70 ? "#059669" : "#7c3aed", transition: "width 0.3s" }} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, color: "#374151", width: 26, textAlign: "right" }}>{task.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: "8px 12px" }}><StatusBadge s={task.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination controls */}
                {!itemsLoading && filteredTasks.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 4px 0",
                  }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                      Showing {(taskPage - 1) * TASK_PAGE_SIZE + 1}
                      –{Math.min(taskPage * TASK_PAGE_SIZE, filteredTasks.length)} of {filteredTasks.length}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                        disabled={taskPage === 1}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "1px solid #e5e7eb", background: taskPage === 1 ? "#f9fafb" : "#fff",
                          color: taskPage === 1 ? "#c1c5cb" : "#374151",
                          cursor: taskPage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: 11, color: "#374151", fontWeight: 600, padding: "0 4px" }}>
                        Page {taskPage} of {taskTotalPages}
                      </span>
                      <button
                        onClick={() => setTaskPage(p => Math.min(taskTotalPages, p + 1))}
                        disabled={taskPage === taskTotalPages}
                        style={{
                          padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                          border: "1px solid #e5e7eb", background: taskPage === taskTotalPages ? "#f9fafb" : "#fff",
                          color: taskPage === taskTotalPages ? "#c1c5cb" : "#374151",
                          cursor: taskPage === taskTotalPages ? "not-allowed" : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Activity Feed */}
              <SectionCard title="Recent Activity" subtitle="Latest actions in your department" icon={Activity}
                action={<span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px #a7f3d050", display: "inline-block" }} />}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {ACTIVITY_FEED.map((a, idx) => {
                    const cfg = ACTIVITY_CFG[a.type];
                    const AIcon = cfg.icon;
                    return (
                      <div key={a.id} style={{ display: "flex", gap: 9, padding: "8px 0", borderBottom: idx < ACTIVITY_FEED.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AIcon style={{ width: 12, height: 12, color: cfg.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
                            <span style={{ color: a.actor === "You" ? "#7c3aed" : "#111827" }}>{a.actor}</span>
                            {" "}<span style={{ fontWeight: 400, color: "#374151" }}>{a.action}</span>
                          </p>
                          <p style={{ fontSize: 10, color: "#6b7280", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.target}</p>
                        </div>
                        <span style={{ fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", marginTop: 1 }}>{a.time}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>

            {/* Row 3: Faculty + Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Faculty Performance */}
              <SectionCard
                title="Faculty Performance Summary"
                subtitle="Activity and completion rates across department faculty"
                icon={Users}
                footer={
                  facultyPerformance.length > 0 && (
                    <button
                      onClick={() => setFacultyModalOpen(true)}
                      style={{ width: "100%", background: "none", border: "none", color: "#7c3aed", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "2px 0" }}
                    >
                      View all <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                  )
                }
              >
                <div
                  onClick={() => facultyPerformance.length > 0 && setFacultyModalOpen(true)}
                  style={{ display: "flex", flexDirection: "column", gap: 8, cursor: facultyPerformance.length > 0 ? "pointer" : "default" }}
                >
                  {facultyLoading ? (
                    <p style={{ padding: "16px 4px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>Loading faculty performance…</p>
                  ) : facultyPerformance.length === 0 ? (
                    <p style={{ padding: "16px 4px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No faculty performance data yet.</p>
                  ) : (
                    facultyPerformance.slice(0, 4).map((f, idx) => (
                      <FacultyPerformanceRow key={f.id} f={f} idx={idx} delayedDocs={delayedDocs} onClick={setSelectedFaculty} />
                    ))
                  )}
                </div>
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

              {/* Analytics charts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Monthly submissions area */}
                <SectionCard title="Monthly Form Submissions" subtitle="Jun 2026 — Submitted vs Approved" icon={BarChart3}>
                  <ResponsiveContainer width="100%" height={130}>
                    <AreaChart data={MONTHLY_SUBMISSIONS} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gSub" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gApp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTip />} />
                      <Area type="monotone" dataKey="submitted" stroke="#7c3aed" strokeWidth={2} fill="url(#gSub)" name="Submitted" />
                      <Area type="monotone" dataKey="approved"  stroke="#059669" strokeWidth={2} fill="url(#gApp)"  name="Approved"  />
                    </AreaChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* Approval pie + task trend */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <SectionCard title="Approval Rate" icon={PieChart} subtitle="This month">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ResponsiveContainer width={90} height={90}>
                        <RPie>
                          <Pie data={APPROVAL_PIE} cx="50%" cy="50%" innerRadius={26} outerRadius={42} paddingAngle={2} dataKey="value">
                            {APPROVAL_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                        </RPie>
                      </ResponsiveContainer>
                      <div style={{ flex: 1 }}>
                        {APPROVAL_PIE.map(d => (
                          <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                            <div style={{ width: 7, height: 7, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: "#374151", flex: 1 }}>{d.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Task Completion" icon={TrendingUp} subtitle="6-week trend">
                    <ResponsiveContainer width="100%" height={90}>
                      <LineChart data={TASK_TREND} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTip />} />
                        <Line type="monotone" dataKey="assigned"  stroke="#7c3aed" strokeWidth={1.5} dot={false} name="Assigned"  />
                        <Line type="monotone" dataKey="completed" stroke="#059669" strokeWidth={1.5} dot={false} name="Completed" />
                      </LineChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>
              </div>
            </div>

            {/* Row 4: Workflow Snapshot + Dept Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16 }}>

              {/* Workflow monitoring snapshot */}
              <SectionCard title="Workflow Monitoring Snapshot" subtitle="Live status of all documents currently in workflow" icon={Gauge}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "In Workflow",     value: 34, icon: Layers,        color: "#7c3aed" },
                    { label: "Awaiting Approval",value: 12, icon: Clock,        color: "#d97706" },
                    { label: "Delayed",          value: 7,  icon: AlertCircle,  color: "#dc2626" },
                    { label: "Avg. Proc. Time",  value: "4.8d", icon: Timer,    color: "#059669" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "12px", borderRadius: 9, background: `${s.color}09`, border: `1px solid ${s.color}20`, textAlign: "center" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 7px" }}>
                        <s.icon style={{ width: 14, height: 14, color: s.color }} />
                      </div>
                      <p style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={MONTHLY_SUBMISSIONS} margin={{ top: 0, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTip />} />
                    <Bar dataKey="submitted" name="Submitted" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="approved"  name="Approved"  fill="#059669" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="rejected"  name="Rejected"  fill="#dc2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              {/* Department Overview */}
              <SectionCard title="Department Overview" subtitle="College of Information Technology" icon={Building2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Total Faculty Members",     value: "6",    icon: Users,        color: "#5b21b6" },
                    { label: "Active Workflows",          value: "11",   icon: Layers,       color: "#7c3aed" },
                    { label: "Forms Submitted This Month",value: "41",   icon: FileText,     color: "#0284c7" },
                    { label: "Tasks Completed This Month",value: "27",   icon: CheckCircle2, color: "#059669" },
                    { label: "Average Approval Time",     value: "4.2d", icon: Timer,        color: "#d97706" },
                  ].map(s => (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: "#fafafa", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <s.icon style={{ width: 15, height: 15, color: s.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</p>
                      </div>
                      <p style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{s.value}</p>
                    </div>
                  ))}

                  {/* Processing time trend mini */}
                  <div style={{ marginTop: 4 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Processing Time Trend</p>
                    <ResponsiveContainer width="100%" height={60}>
                      <LineChart data={PROCESSING_TREND} margin={{ top: 2, right: 4, left: -28, bottom: 0 }}>
                        <Line type="monotone" dataKey="days" stroke="#7c3aed" strokeWidth={2} dot={{ fill: "#7c3aed", r: 3 }} name="Avg Days" />
                        <Tooltip content={<CustomTip />} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </SectionCard>
            </div>

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
