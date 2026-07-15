import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  FileText, Download, Calendar, Users, ClipboardList, CheckCircle2,
  Clock, AlertTriangle, XCircle, TrendingUp, TrendingDown, BarChart3,
  PieChart as PieIcon, FileSpreadsheet, Eye, RotateCcw, Layers, Shield,
  Activity, Gauge, ListTodo, ChevronRight, Printer, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RPie, Pie, Cell,
} from "recharts";

const ADMIN_NAV_ROLES = ["admin", "program_chair"];
const API = import.meta.env.VITE_API_URL || "";

/* ══════════════════════════════════════════════════════════════════════════
   Shared visual primitives — mirrored from Dashboard.jsx so this page stays
   pixel-consistent with the rest of PATH without importing internal,
   non-exported pieces of another page.
   ══════════════════════════════════════════════════════════════════════ */

const Icon = {
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Inbox: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" /></svg>),
  Plus: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M8 1v14M1 8h14" /></svg>),
  Tasks: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" /></svg>),
  Workflow: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>),
  Reports: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" /></svg>),
  Forms: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>),
  Users: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>),
  Shield: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>),
  Settings: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>),
  Help: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" /></svg>),
  Logout: () => (<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" /></svg>),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Tracking: () => (<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>),
};

function SbItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "8px 14px",
        color: active ? "white" : "#c8c4e0", fontSize: 12, cursor: "pointer",
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

function SectionCard({ title, subtitle, icon: IconCmp, children, action, noPad, footer }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 29, height: 29, borderRadius: 7, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconCmp style={{ width: 14, height: 14, color: "#7c3aed" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{title}</p>
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

const STATUS_CFG = {
  pending:   { color: "#92400e", bg: "#fef3c7" },
  approved:  { color: "#059669", bg: "#d1fae5" },
  completed: { color: "#059669", bg: "#d1fae5" },
  rejected:  { color: "#dc2626", bg: "#fee2e2" },
  returned:  { color: "#c2410c", bg: "#ffedd5" },
  delayed:   { color: "#c2410c", bg: "#ffedd5" },
  overdue:   { color: "#dc2626", bg: "#fef2f2" },
};
function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s?.toLowerCase()] ?? { color: "#374151", bg: "#f3f4f6" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {s}
    </span>
  );
}

const SEVERITY_CFG = {
  Low:      { color: "#0284c7", bg: "#e0f2fe" },
  Medium:   { color: "#d97706", bg: "#fffbeb" },
  High:     { color: "#c2410c", bg: "#ffedd5" },
  Critical: { color: "#dc2626", bg: "#fef2f2" },
};
function SeverityBadge({ level }) {
  const cfg = SEVERITY_CFG[level] ?? SEVERITY_CFG.Low;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {level === "Critical" && <AlertTriangle style={{ width: 10, height: 10 }} />}{level}
    </span>
  );
}

/* Flat rounded-rect badge for role/category-style values (e.g. table pills). */
function Pill({ text, color, bg }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: bg, color, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/* Colored initials avatar, used next to names/identities in tables. */
const AVATAR_PALETTE = [
  { bg: "#dcfce7", color: "#059669" }, { bg: "#fce7f3", color: "#db2777" },
  { bg: "#dbeafe", color: "#2563eb" }, { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#fef3c7", color: "#b45309" }, { bg: "#e0f2fe", color: "#0284c7" },
  { bg: "#fee2e2", color: "#dc2626" }, { bg: "#d1fae5", color: "#047857" },
];
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function Avatar({ name, size = 28 }) {
  const cfg = AVATAR_PALETTE[hashStr(name) % AVATAR_PALETTE.length];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: cfg.bg, color: cfg.color, fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </span>
  );
}
function NameCell({ name, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Avatar name={name} />
      <div>
        <div style={{ fontWeight: 600, color: "#111827" }}>{name}</div>
        {sub && <div style={{ fontSize: 10.5, color: "#9ca3af" }}>{sub}</div>}
      </div>
    </div>
  );
}

/* Shared table header/footer styling so every table in this file matches. */
const TH_STYLE = { padding: "12px 16px", fontSize: 10.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 };
const TD_STYLE = { padding: "12px 16px" };
function TableFoot({ count, total, label }) {
  return (
    <div style={{ padding: "10px 16px", fontSize: 11.5, color: "#9ca3af" }}>
      Showing {count} of {total} {label}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>{label}</label>
      <select
        value={value}
        onChange={onChange}
        style={{ fontSize: 12, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", cursor: "pointer", minWidth: 140 }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function KpiCard({ label, value, icon: IconCmp, color, delta, up }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconCmp style={{ width: 15, height: 15, color }} />
        </div>
        {delta && (
          <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 700, color: up ? "#059669" : "#dc2626" }}>
            {up ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}{delta}
          </span>
        )}
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{label}</p>
    </div>
  );
}

function ExportButtons({ onExport, size = "normal" }) {
  const pad = size === "small" ? "5px 10px" : "8px 14px";
  const fs = size === "small" ? 10 : 11;
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => onExport("PDF")}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: pad, borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontSize: fs, fontWeight: 700, cursor: "pointer" }}
      >
        <Download style={{ width: 12, height: 12 }} /> Export PDF
      </button>
      <button
        onClick={() => onExport("Excel")}
        style={{ display: "flex", alignItems: "center", gap: 5, padding: pad, borderRadius: 8, background: "#fff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: fs, fontWeight: 700, cursor: "pointer" }}
      >
        <FileSpreadsheet style={{ width: 12, height: 12 }} /> Export Excel
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Sample data — copied from the updated report mockup (App.tsx). Swap these
   for live fetches whenever you're ready to wire this page to real data.
   ══════════════════════════════════════════════════════════════════════ */

const KPI_DATA = [
  { label: "Total Transactions", value: 1284, icon: Layers,        color: "#7c3aed", delta: "+12.4%", up: true  },
  { label: "Pending",            value: 218,  icon: Clock,         color: "#d97706", delta: "+3.1%",  up: true  },
  { label: "Approved",           value: 396,  icon: CheckCircle2,  color: "#0284c7", delta: "+8.7%",  up: true  },
  { label: "Completed",          value: 541,  icon: TrendingUp,    color: "#059669", delta: "+15.2%", up: true  },
  { label: "Rejected",           value: 87,   icon: XCircle,       color: "#dc2626", delta: "-4.3%",  up: false },
  { label: "Delayed",            value: 42,   icon: AlertTriangle, color: "#f97316", delta: "-1.8%",  up: false },
];

const STATUS_PIE = [
  { name: "Pending",   value: 218, color: "#d97706" },
  { name: "Approved",  value: 396, color: "#0284c7" },
  { name: "Completed", value: 541, color: "#059669" },
  { name: "Rejected",  value: 87,  color: "#dc2626" },
  { name: "Delayed",   value: 42,  color: "#f97316" },
];

const DOC_TYPE_BAR = [
  { type: "Enrollment", count: 312 },
  { type: "Completion", count: 248 },
  { type: "Overload",   count: 187 },
  { type: "Leave",      count: 156 },
  { type: "Transfer",   count: 143 },
  { type: "Waiver",     count: 98  },
  { type: "Other",      count: 140 },
];

const MONTHLY_TREND = [
  { month: "Aug", submitted: 98,  completed: 74,  delayed: 8  },
  { month: "Sep", submitted: 143, completed: 118, delayed: 11 },
  { month: "Oct", submitted: 187, completed: 152, delayed: 14 },
  { month: "Nov", submitted: 162, completed: 131, delayed: 9  },
  { month: "Dec", submitted: 89,  completed: 79,  delayed: 4  },
  { month: "Jan", submitted: 201, completed: 164, delayed: 17 },
  { month: "Feb", submitted: 178, completed: 145, delayed: 12 },
  { month: "Mar", submitted: 226, completed: 188, delayed: 19 },
];

const DELAYED_TRANSACTIONS = [
  { id: "TXN-2024-0891", docType: "Enrollment Form",   faculty: "Dr. R. Santos",   status: "Delayed", stage: "Dean Approval",      days: 14, overdue: true  },
  { id: "TXN-2024-0876", docType: "Completion Form",   faculty: "Prof. M. Cruz",   status: "Pending", stage: "Registrar Review",   days: 11, overdue: true  },
  { id: "TXN-2024-0843", docType: "Overload Form",     faculty: "Dr. J. Reyes",    status: "Delayed", stage: "Adviser Sign-off",   days: 9,  overdue: true  },
  { id: "TXN-2024-0812", docType: "Leave of Absence",  faculty: "Dr. A. Flores",   status: "Pending", stage: "VPAA Review",        days: 7,  overdue: false },
  { id: "TXN-2024-0798", docType: "Transfer Form",     faculty: "Prof. L. Garcia", status: "Delayed", stage: "Dean Approval",      days: 6,  overdue: false },
  { id: "TXN-2024-0765", docType: "Waiver Request",    faculty: "Dr. R. Santos",   status: "Pending", stage: "Program Chair",      days: 5,  overdue: false },
];

const PROCESSING_TIME_DATA = [
  { type: "Enrollment", avg: 4.2, fastest: 1.1, slowest: 12.4 },
  { type: "Completion", avg: 5.8, fastest: 2.0, slowest: 14.7 },
  { type: "Overload",   avg: 3.1, fastest: 0.8, slowest: 9.2  },
  { type: "Leave",      avg: 6.4, fastest: 2.5, slowest: 18.1 },
  { type: "Transfer",   avg: 7.2, fastest: 3.0, slowest: 16.3 },
  { type: "Waiver",     avg: 4.9, fastest: 1.4, slowest: 11.8 },
];

const FACULTY_WORKLOAD = [
  { name: "Dr. R. Santos",     assigned: 52, pending: 18, completed: 34, rate: 65 },
  { name: "Prof. M. Cruz",     assigned: 47, pending: 12, completed: 35, rate: 74 },
  { name: "Dr. J. Reyes",      assigned: 61, pending: 21, completed: 40, rate: 66 },
  { name: "Dr. A. Flores",     assigned: 38, pending: 9,  completed: 29, rate: 76 },
  { name: "Prof. L. Garcia",   assigned: 44, pending: 14, completed: 30, rate: 68 },
  { name: "Dr. T. Mercado",    assigned: 29, pending: 6,  completed: 23, rate: 79 },
  { name: "Prof. C. Bautista", assigned: 55, pending: 24, completed: 31, rate: 56 },
];

const BOTTLENECKS = [
  { stage: "Dean Approval",          waiting: 38, avgWait: 4.8, severity: "Critical" },
  { stage: "VPAA Review",            waiting: 27, avgWait: 3.9, severity: "High"     },
  { stage: "Registrar Review",       waiting: 21, avgWait: 2.7, severity: "High"     },
  { stage: "Adviser Sign-off",       waiting: 14, avgWait: 1.8, severity: "Medium"   },
  { stage: "Program Chair",          waiting: 9,  avgWait: 1.2, severity: "Low"      },
  { stage: "Document Verification",  waiting: 6,  avgWait: 0.6, severity: "Low"      },
];

const REJECTED_DOCS = [
  { id: "TXN-2024-0834", type: "Enrollment Form",  reason: "Incomplete requirements",       date: "Mar 12, 2024" },
  { id: "TXN-2024-0821", type: "Overload Form",     reason: "Exceeded unit load limit",      date: "Mar 10, 2024" },
  { id: "TXN-2024-0809", type: "Waiver Request",    reason: "Missing faculty endorsement",   date: "Mar 8, 2024"  },
  { id: "TXN-2024-0795", type: "Transfer Form",     reason: "GWA below requirement",         date: "Mar 6, 2024"  },
  { id: "TXN-2024-0783", type: "Leave of Absence",  reason: "Insufficient documentation",    date: "Mar 4, 2024"  },
  { id: "TXN-2024-0771", type: "Completion Form",   reason: "Adviser not approved",          date: "Mar 1, 2024"  },
];

const REJECTION_TREND = [
  { month: "Aug", rejected: 6,  returned: 4 },
  { month: "Sep", rejected: 8,  returned: 5 },
  { month: "Oct", rejected: 11, returned: 7 },
  { month: "Nov", rejected: 9,  returned: 6 },
  { month: "Dec", rejected: 5,  returned: 3 },
  { month: "Jan", rejected: 12, returned: 8 },
  { month: "Feb", rejected: 10, returned: 7 },
  { month: "Mar", rejected: 14, returned: 9 },
];

const RETURNED_SUMMARY = [
  { label: "Total Processed",  value: "1,284", sub: "This academic year",                color: "#7c3aed" },
  { label: "Completion Rate",  value: "87.4%", sub: "vs 81.2% last year",                 color: "#059669" },
  { label: "Approval Rate",    value: "72.8%", sub: "Approved on first submission",       color: "#0284c7" },
];

const AUDIT_TRAIL = [
  { date: "Mar 15, 2024 09:14", user: "Admin J. Dela Cruz",     action: "Document Approved",   transaction: "TXN-2024-0901", remarks: "All requirements complete"     },
  { date: "Mar 15, 2024 08:52", user: "Dr. R. Santos",          action: "Forwarded to Dean",    transaction: "TXN-2024-0899", remarks: "Endorsed for review"           },
  { date: "Mar 14, 2024 16:30", user: "Registrar Office",       action: "Document Returned",    transaction: "TXN-2024-0891", remarks: "Missing TOR copy"              },
  { date: "Mar 14, 2024 15:18", user: "Prof. M. Cruz",          action: "Status Updated",       transaction: "TXN-2024-0887", remarks: "Changed to Pending VPAA"       },
  { date: "Mar 14, 2024 14:05", user: "Admin J. Dela Cruz",     action: "Document Rejected",    transaction: "TXN-2024-0883", remarks: "GWA requirement not met"       },
  { date: "Mar 14, 2024 11:47", user: "Dr. J. Reyes",           action: "Document Reviewed",    transaction: "TXN-2024-0879", remarks: "Approved at dept level"        },
  { date: "Mar 13, 2024 16:22", user: "Admin J. Dela Cruz",     action: "Report Generated",     transaction: "—",             remarks: "Monthly summary exported"      },
  { date: "Mar 13, 2024 10:09", user: "Program Chair Santos",   action: "Workflow Forwarded",   transaction: "TXN-2024-0871", remarks: "Sent to registrar"             },
];

const QUICK_REPORTS = [
  { title: "Transaction Summary",         icon: Layers,        desc: "Complete overview of all transactions",       color: "#7c3aed" },
  { title: "Pending Transactions",        icon: Clock,         desc: "All transactions awaiting action",            color: "#d97706" },
  { title: "Completed Transactions",      icon: CheckCircle2,  desc: "Successfully processed transactions",         color: "#059669" },
  { title: "Delayed Transactions",        icon: AlertTriangle, desc: "Transactions past SLA thresholds",            color: "#f97316" },
  { title: "Faculty Workload",            icon: Users,         desc: "Per-faculty load and completion rates",       color: "#0284c7" },
  { title: "Processing Time",             icon: Activity,      desc: "Average times per document type",             color: "#8b5cf6" },
  { title: "Monthly / Semestral Report",  icon: Calendar,      desc: "Aggregated performance by period",            color: "#ec4899" },
  { title: "Audit Trail",                 icon: Shield,        desc: "Full system activity log",                   color: "#64748b" },
];

/* ══════════════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════════ */

export default function Reports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [docTypeFilter, setDocTypeFilter] = useState("All Document Types");
  const [facultyFilter, setFacultyFilter] = useState("All Faculty");
  const [exportToast, setExportToast] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  const TABS = [
    "Overview",
    "Transactions",
    "Processing Time",
    "Faculty Workload",
    "Bottleneck",
    "Returned / Rejected",
    "Audit Trail",
    "Quick Reports",
  ];

  // Placeholder export handler — wire this to your actual PDF/Excel export
  // endpoint (e.g. POST /api/reports/export) whenever that's ready.
  const handleExport = (reportName, format) => {
    setExportToast(`Exporting "${reportName}" as ${format}…`);
    setTimeout(() => setExportToast(null), 2500);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: 200, background: "#1e1b2e", color: "#c8c4e0", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          <SbItem icon={<Icon.Reports />} label="Reports" active={true} onClick={() => navigate("/reports")} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-dashboard")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => {}} />
        </div>

        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => {}} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>PATH</span>
            <ChevronRight style={{ width: 12, height: 12, color: "#d1d5db" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Reports &amp; Analytics</span>
          </div>
        </TopBar>

        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto" }}>
          <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── 1. Header: title + export (no card) ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>Reports &amp; Analytics</h1>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Transaction performance, workload, and bottleneck insights across the department</p>
              </div>
              <ExportButtons onExport={(fmt) => handleExport("Full Analytics Report", fmt)} />
            </div>

            {/* ── 2. Filters card ── */}
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <FilterSelect label="Date Range" value={dateRange} onChange={e => setDateRange(e.target.value)}
                  options={["Last 7 Days", "Last 30 Days", "This Semester", "This Year", "Custom Range"]} />
                <FilterSelect label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  options={["All Statuses", "Pending", "Approved", "Completed", "Rejected", "Delayed"]} />
                <FilterSelect label="Document Type" value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)}
                  options={["All Document Types", "Enrollment", "Completion", "Overload", "Leave", "Transfer", "Waiver", "Other"]} />
                <FilterSelect label="Faculty" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}
                  options={["All Faculty", ...FACULTY_WORKLOAD.map(f => f.name)]} />
              </div>
            </div>

            {/* ── Tab Bar ── */}
            <div style={{ display: "flex", gap: 22, borderBottom: "1px solid rgba(0,0,0,0.08)", paddingLeft: 4 }}>
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 10px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: activeTab === t ? "#7c3aed" : "#6b7280",
                    borderBottom: activeTab === t ? "2px solid #7c3aed" : "2px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Overview & Transactions tabs ── */}
            {(activeTab === "Overview" || activeTab === "Transactions") && (
              <>
            {/* ── KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Transaction Overview ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 16 }}>
              <SectionCard title="By Status" icon={PieIcon}>
                <ResponsiveContainer width="100%" height={190}>
                  <RPie>
                    <Pie data={STATUS_PIE} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                      {STATUS_PIE.map(s => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                    <Tooltip />
                  </RPie>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 6 }}>
                  {STATUS_PIE.map(s => (
                    <span key={s.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#6b7280" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />{s.name}
                    </span>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="By Document Type" icon={BarChart3}>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={DOC_TYPE_BAR} barSize={22}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="type" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Monthly Transaction Trend" subtitle="AY 2023–2024" icon={TrendingUp}>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={MONTHLY_TREND}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="submitted" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Submitted" />
                    <Line type="monotone" dataKey="completed" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="Completed" />
                    <Line type="monotone" dataKey="delayed" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" name="Delayed" />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>

            {/* ── Delayed Transactions Table ── */}
            <SectionCard title="Delayed Transactions" subtitle={`${DELAYED_TRANSACTIONS.length} records currently past their expected processing time`} icon={Clock} noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Delayed Transactions Report", fmt)} />}
              footer={<TableFoot count={DELAYED_TRANSACTIONS.length} total={DELAYED_TRANSACTIONS.length} label="delayed transactions" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Transaction ID", "Document Type", "Assigned Faculty", "Status", "Current Stage", "Days Waiting"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Days Waiting" ? "center" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DELAYED_TRANSACTIONS.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: i < DELAYED_TRANSACTIONS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>{d.id}</td>
                      <td style={{ ...TD_STYLE, color: "#374151" }}>{d.docType}</td>
                      <td style={TD_STYLE}><NameCell name={d.faculty} /></td>
                      <td style={TD_STYLE}><StatusBadge s={d.status} /></td>
                      <td style={{ ...TD_STYLE, color: "#6b7280" }}>{d.stage}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: d.overdue ? "#dc2626" : "#d97706" }}>
                          {d.days}d{d.overdue && <AlertCircle style={{ width: 11, height: 11, marginLeft: 3, verticalAlign: "-2px" }} />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Processing Time tab ── */}
            {activeTab === "Processing Time" && (
              <>
            {/* ── Processing Time Summary ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <SectionCard title="Average Processing Time" icon={Activity}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>
                  {(PROCESSING_TIME_DATA.reduce((a, b) => a + b.avg, 0) / PROCESSING_TIME_DATA.length).toFixed(1)} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Across all document types</p>
              </SectionCard>
              <SectionCard title="Fastest Processing Time" icon={TrendingUp}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
                  {Math.min(...PROCESSING_TIME_DATA.map(d => d.fastest)).toFixed(1)} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Best-case turnaround recorded</p>
              </SectionCard>
              <SectionCard title="Slowest Processing Time" icon={Clock}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>
                  {Math.max(...PROCESSING_TIME_DATA.map(d => d.slowest)).toFixed(1)} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Worst-case turnaround recorded</p>
              </SectionCard>
            </div>

            <SectionCard title="Processing Time per Document Type" subtitle="Fastest, average, and slowest turnaround in days" icon={Gauge}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PROCESSING_TIME_DATA} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit="d" />
                  <Tooltip formatter={(v) => [`${v} days`]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="fastest" fill="#059669" radius={[3, 3, 0, 0]} name="Fastest" />
                  <Bar dataKey="avg" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Average" />
                  <Bar dataKey="slowest" fill="#dc2626" radius={[3, 3, 0, 0]} name="Slowest" />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* ── Processing Time Breakdown Table ── */}
            <SectionCard title="Processing Time Breakdown" subtitle="Fastest, average, and slowest turnaround per document type" icon={ClipboardList} noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Processing Time Report", fmt)} />}
              footer={<TableFoot count={PROCESSING_TIME_DATA.length} total={PROCESSING_TIME_DATA.length} label="document types" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Document Type", "Fastest", "Average", "Slowest"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Document Type" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROCESSING_TIME_DATA.map((p, i) => (
                    <tr key={p.type} style={{ borderBottom: i < PROCESSING_TIME_DATA.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{p.type}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{p.fastest.toFixed(1)}d</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#7c3aed", fontWeight: 600 }}>{p.avg.toFixed(1)}d</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>{p.slowest.toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Faculty Workload tab ── */}
            {activeTab === "Faculty Workload" && (
              <>
            {/* ── Workload Comparison ── */}
            <SectionCard title="Workload Comparison" subtitle="Completed vs. pending transactions per faculty member" icon={Users}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={FACULTY_WORKLOAD} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="completed" fill="#059669" radius={[0, 3, 3, 0]} name="Completed" stackId="a" />
                  <Bar dataKey="pending" fill="#d97706" radius={[0, 3, 3, 0]} name="Pending" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* ── Faculty Performance Table ── */}
            <SectionCard title="Faculty Performance Table" subtitle="Assigned transactions and completion rate per faculty member" icon={ClipboardList} noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Faculty Workload Report", fmt)} />}
              footer={<TableFoot count={FACULTY_WORKLOAD.length} total={FACULTY_WORKLOAD.length} label="faculty" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Faculty Name", "Assigned", "Pending", "Completed", "Completion Rate"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Faculty Name" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACULTY_WORKLOAD.map((f, i) => (
                    <tr key={f.name} style={{ borderBottom: i < FACULTY_WORKLOAD.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={TD_STYLE}><NameCell name={f.name} /></td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{f.assigned}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#d97706", fontWeight: 600 }}>{f.pending}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{f.completed}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 110 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                            <div style={{ height: 5, borderRadius: 3, width: `${f.rate}%`, background: f.rate >= 75 ? "#059669" : f.rate >= 60 ? "#d97706" : "#dc2626" }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{f.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Bottleneck tab ── */}
            {activeTab === "Bottleneck" && (
              <>
            {/* ── Documents Waiting by Stage ── */}
            <SectionCard title="Documents Waiting by Stage" icon={Activity}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={BOTTLENECKS} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 9.5 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="waiting" name="Docs Waiting" radius={[4, 4, 0, 0]}>
                    {BOTTLENECKS.map(b => (
                      <Cell key={b.stage} fill={b.severity === "Critical" ? "#dc2626" : b.severity === "High" ? "#f97316" : b.severity === "Medium" ? "#d97706" : "#059669"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* ── Bottleneck Summary ── */}
            <SectionCard title="Bottleneck Summary" subtitle="Workflow stages exceeding expected processing time" icon={AlertTriangle} noPad
              footer={<TableFoot count={BOTTLENECKS.length} total={BOTTLENECKS.length} label="stages" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Workflow Stage", "Docs Waiting", "Avg Wait Time", "Severity"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Workflow Stage" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOTTLENECKS.map((b, i) => (
                    <tr key={b.stage} style={{ borderBottom: i < BOTTLENECKS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{b.stage}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{b.waiting}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{b.avgWait}d avg</td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}><SeverityBadge level={b.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Returned / Rejected tab ── */}
            {activeTab === "Returned / Rejected" && (
              <>
            {/* ── Summary cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {RETURNED_SUMMARY.map(c => (
                <SectionCard key={c.label} title={c.label}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</p>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{c.sub}</p>
                </SectionCard>
              ))}
            </div>

            {/* ── Monthly Rejection & Return Trend ── */}
            <SectionCard title="Monthly Rejection & Return Trend" icon={RotateCcw}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={REJECTION_TREND} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="rejected" fill="#dc2626" radius={[3, 3, 0, 0]} name="Rejected" />
                  <Bar dataKey="returned" fill="#d97706" radius={[3, 3, 0, 0]} name="Returned" />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>

            {/* ── Rejection Log ── */}
            <SectionCard title="Rejection Log" icon={XCircle} noPad
              footer={<TableFoot count={REJECTED_DOCS.length} total={REJECTED_DOCS.length} label="rejected records" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Transaction ID", "Document Type", "Rejection Reason", "Date Returned"].map(h => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {REJECTED_DOCS.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < REJECTED_DOCS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>{r.id}</td>
                      <td style={{ ...TD_STYLE, color: "#374151" }}>{r.type}</td>
                      <td style={{ ...TD_STYLE, color: "#dc2626" }}>{r.reason}</td>
                      <td style={{ ...TD_STYLE, color: "#6b7280" }}>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Audit Trail tab ── */}
            {activeTab === "Audit Trail" && (
              <>
            {/* ── Audit Trail Table ── */}
            <SectionCard title="Audit Trail" subtitle="Immutable log of all system actions and document state changes" icon={Shield} noPad
              footer={<TableFoot count={AUDIT_TRAIL.length} total={AUDIT_TRAIL.length} label="log entries" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Date & Time", "User", "Action", "Transaction", "Remarks"].map(h => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_TRAIL.map((a, i) => (
                    <tr key={i} style={{ borderBottom: i < AUDIT_TRAIL.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", color: "#6b7280", whiteSpace: "nowrap", fontSize: 11 }}>{a.date}</td>
                      <td style={TD_STYLE}><NameCell name={a.user} /></td>
                      <td style={TD_STYLE}><Pill text={a.action} bg="#f3f4f6" color="#374151" /></td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", color: "#374151", fontSize: 11 }}>{a.transaction}</td>
                      <td style={{ ...TD_STYLE, color: "#6b7280" }}>{a.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Quick Reports tab ── */}
            {activeTab === "Quick Reports" && (
              <>
            {/* ── KPI Cards (top part, matching Overview) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Quick Report Center ── */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Quick Report Center</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {QUICK_REPORTS.map(r => (
                  <div key={r.title} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${r.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <r.icon style={{ width: 16, height: 16, color: r.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{r.title}</p>
                      <p style={{ fontSize: 10.5, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>{r.desc}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                      <button
                        onClick={() => handleExport(r.title, "View")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        <Eye style={{ width: 11, height: 11 }} /> View Report
                      </button>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleExport(r.title, "PDF")}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 8px", borderRadius: 7, background: "#fff", color: "#374151", border: "1px solid #e5e7eb", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}
                        >
                          <Printer style={{ width: 10, height: 10 }} /> PDF
                        </button>
                        <button
                          onClick={() => handleExport(r.title, "Excel")}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 8px", borderRadius: 7, background: "#fff", color: "#374151", border: "1px solid #e5e7eb", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}
                        >
                          <FileSpreadsheet style={{ width: 10, height: 10 }} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Export toast ── */}
      {exportToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 2000, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText style={{ width: 13, height: 13 }} />{exportToast}
        </div>
      )}
    </div>
  );
}
