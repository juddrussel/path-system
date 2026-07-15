import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  FileText, Download, Calendar, Users, ClipboardList, CheckCircle2,
  Clock, AlertTriangle, XCircle, TrendingUp, TrendingDown, BarChart3,
  PieChart as PieIcon, FileSpreadsheet, Eye, RotateCcw, Layers, Shield,
  Activity, Gauge, ListTodo, ChevronRight, Printer,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

function SectionCard({ title, subtitle, icon: IconCmp, children, action, noPad, accentColor, footer }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderTop: accentColor ? `3px solid ${accentColor}` : "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: accentColor ? `0 1px 4px ${accentColor}14` : "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 29, height: 29, borderRadius: 7, background: accentColor ? `${accentColor}18` : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconCmp style={{ width: 14, height: 14, color: accentColor || "#7c3aed" }} />
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
  pending:   { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  approved:  { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  completed: { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  rejected:  { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  returned:  { color: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  overdue:   { color: "#991b1b", bg: "#fef2f2", dot: "#ef4444" },
};
function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s?.toLowerCase()] ?? { color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />{s}
    </span>
  );
}

const SEVERITY_CFG = {
  Low:      { color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
  Medium:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  High:     { color: "#c2410c", bg: "#ffedd5", border: "#fdba74" },
  Critical: { color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
};
function SeverityBadge({ level }) {
  const cfg = SEVERITY_CFG[level] ?? SEVERITY_CFG.Low;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, whiteSpace: "nowrap" }}>
      {level === "Critical" && <AlertTriangle style={{ width: 10, height: 10 }} />}{level}
    </span>
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
      <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{value}</p>
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
   Sample data — realistic placeholder figures for demo/defense purposes.
   Swap these for live fetches (e.g. GET /api/faculty/performance and
   GET /api/bottlenecks/report, both already built) whenever you're ready
   to wire this page to real data.
   ══════════════════════════════════════════════════════════════════════ */

const KPI_DATA = [
  { label: "Total Transactions",     value: 428, icon: Layers,        color: "#7c3aed", delta: "+12%", up: true  },
  { label: "Pending Transactions",   value: 56,  icon: Clock,         color: "#d97706", delta: "+4%",  up: false },
  { label: "Approved Transactions",  value: 214, icon: CheckCircle2,  color: "#059669", delta: "+9%",  up: true  },
  { label: "Completed Transactions", value: 189, icon: ClipboardList, color: "#0284c7", delta: "+6%",  up: true  },
  { label: "Rejected Transactions",  value: 25,  icon: XCircle,       color: "#dc2626", delta: "-2%",  up: true  },
  { label: "Delayed Transactions",   value: 34,  icon: AlertTriangle, color: "#c2410c", delta: "+3%",  up: false },
];

const STATUS_PIE = [
  { name: "Approved",  value: 214, color: "#10b981" },
  { name: "Pending",   value: 56,  color: "#f59e0b" },
  { name: "Completed", value: 189, color: "#0284c7" },
  { name: "Rejected",  value: 25,  color: "#ef4444" },
  { name: "Returned",  value: 18,  color: "#f97316" },
];

const DOC_TYPE_BAR = [
  { type: "Grade Change",       count: 96 },
  { type: "Leave Request",      count: 74 },
  { type: "Course Add/Drop",    count: 61 },
  { type: "Curriculum Proposal",count: 48 },
  { type: "Clearance Form",     count: 88 },
  { type: "Research Proposal",  count: 33 },
];

const MONTHLY_TREND = [
  { month: "Feb", submitted: 58, completed: 49 },
  { month: "Mar", submitted: 71, completed: 60 },
  { month: "Apr", submitted: 64, completed: 58 },
  { month: "May", submitted: 82, completed: 70 },
  { month: "Jun", submitted: 77, completed: 68 },
  { month: "Jul", submitted: 76, completed: 65 },
];

const PROCESSING_TIME = {
  average: "3.2 days",
  fastest: { time: "0.5 days", doc: "Leave Request — Prof. Ana Reyes" },
  slowest: { time: "14.8 days", doc: "Curriculum Proposal — Dr. Kenneth Tan" },
};

const FACULTY_WORKLOAD = [
  { name: "Dr. Kenneth Tan",      assigned: 24, pending: 4, completed: 18, rate: 92 },
  { name: "Prof. Ana Reyes",      assigned: 20, pending: 3, completed: 14, rate: 87 },
  { name: "Prof. Carlos Mendoza", assigned: 17, pending: 5, completed: 11, rate: 83 },
  { name: "Dr. Luisa Fernandez",  assigned: 22, pending: 2, completed: 20, rate: 96 },
  { name: "Ms. Grace Villanueva", assigned: 18, pending: 6, completed: 8,  rate: 71 },
  { name: "Mr. Jose Ramos",       assigned: 17, pending: 1, completed: 15, rate: 89 },
];

const BOTTLENECKS = [
  { stage: "Program Chair Approval",  waiting: 9, avgWait: "7.0 days", threshold: "2.0 days", severity: "Critical" },
  { stage: "Dean's Office Review",    waiting: 5, avgWait: "4.2 days", threshold: "3.0 days", severity: "High"     },
  { stage: "Registrar Processing",    waiting: 6, avgWait: "3.1 days", threshold: "2.0 days", severity: "Medium"   },
  { stage: "Department Endorsement",  waiting: 3, avgWait: "1.4 days", threshold: "2.0 days", severity: "Low"      },
];

const DELAYED_TRANSACTIONS = [
  { id: "TRX-2201", docType: "Curriculum Proposal", faculty: "Dr. Kenneth Tan",      stage: "Program Chair Approval", days: 9.5, status: "Pending"  },
  { id: "TRX-2198", docType: "Grade Change",         faculty: "Ms. Grace Villanueva", stage: "Dean's Office Review",   days: 7.2, status: "Pending"  },
  { id: "TRX-2189", docType: "Clearance Form",       faculty: "Prof. Carlos Mendoza", stage: "Registrar Processing",   days: 6.8, status: "Overdue"  },
  { id: "TRX-2177", docType: "Leave Request",        faculty: "Mr. Jose Ramos",       stage: "Program Chair Approval", days: 5.4, status: "Pending"  },
  { id: "TRX-2165", docType: "Research Proposal",    faculty: "Prof. Ana Reyes",      stage: "Dean's Office Review",   days: 4.9, status: "Overdue"  },
];

const REJECTION_REASONS = [
  { reason: "Incomplete Documentation",   count: 9 },
  { reason: "Missing Signature",          count: 6 },
  { reason: "Policy Non-compliance",      count: 4 },
  { reason: "Duplicate Submission",       count: 3 },
  { reason: "Incorrect Form Version",     count: 3 },
];

const SEMESTRAL_SUMMARY = {
  period: "1st Semester, A.Y. 2025–2026",
  totalProcessed: 403,
  approvalRate: 84,
  completionRate: 76,
};

const AUDIT_TRAIL = [
  { actor: "Dr. Kenneth Tan",      action: "approved",  item: "Grade Change — TRX-2210",      time: "12 min ago" },
  { actor: "Prof. Ana Reyes",      action: "submitted", item: "Leave Request — TRX-2209",     time: "48 min ago" },
  { actor: "Program Chair Office", action: "returned",  item: "Curriculum Proposal — TRX-2201", time: "2 hr ago"  },
  { actor: "Ms. Grace Villanueva", action: "assigned",  item: "Clearance Form — TRX-2205",    time: "3 hr ago"   },
  { actor: "Registrar's Office",   action: "completed", item: "Course Add/Drop — TRX-2190",   time: "5 hr ago"   },
];

const QUICK_REPORTS = [
  { title: "Transaction Summary Report",  icon: Layers,        color: "#7c3aed" },
  { title: "Pending Transactions Report", icon: Clock,         color: "#d97706" },
  { title: "Completed Transactions Report", icon: CheckCircle2, color: "#059669" },
  { title: "Delayed Transactions Report", icon: AlertTriangle, color: "#c2410c" },
  { title: "Faculty Workload Report",     icon: Users,         color: "#0284c7" },
  { title: "Processing Time Report",      icon: Gauge,         color: "#5b21b6" },
  { title: "Monthly/Semestral Report",    icon: BarChart3,     color: "#0369a1" },
  { title: "Audit Trail Report",          icon: Shield,        color: "#374151" },
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

            {/* ── 1. Header: title + filters + export ── */}
            <div style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <h1 style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>Reports &amp; Analytics</h1>
                  <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Transaction performance, workload, and bottleneck insights across the department</p>
                </div>
                <ExportButtons onExport={(fmt) => handleExport("Full Analytics Report", fmt)} />
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <FilterSelect label="Date Range" value={dateRange} onChange={e => setDateRange(e.target.value)}
                  options={["Last 7 Days", "Last 30 Days", "This Semester", "This Year", "Custom Range"]} />
                <FilterSelect label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  options={["All Statuses", "Pending", "Approved", "Completed", "Rejected", "Returned"]} />
                <FilterSelect label="Document Type" value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)}
                  options={["All Document Types", "Grade Change", "Leave Request", "Course Add/Drop", "Curriculum Proposal", "Clearance Form", "Research Proposal"]} />
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

            {/* ── Overview tab ── */}
            {activeTab === "Overview" && (
              <>
            {/* ── 2. KPI Cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── 3. Transaction Analytics ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 16 }}>
              <SectionCard title="Transactions by Status" icon={PieIcon} accentColor="#7c3aed">
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

              <SectionCard title="By Document Type" icon={BarChart3} accentColor="#0284c7">
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={DOC_TYPE_BAR} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="type" tick={{ fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Monthly Transaction Trend" icon={TrendingUp} accentColor="#059669">
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={MONTHLY_TREND}>
                    <defs>
                      <linearGradient id="gSubmitted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="submitted" stroke="#7c3aed" strokeWidth={2} fill="url(#gSubmitted)" name="Submitted" />
                    <Area type="monotone" dataKey="completed" stroke="#059669" strokeWidth={2} fill="url(#gCompleted)" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>
              </>
            )}

            {/* ── Transactions tab ── */}
            {activeTab === "Transactions" && (
              <>
            {/* ── 7. Delayed Transactions Table ── */}
            <SectionCard title="Delayed Transactions" subtitle="Documents currently past their expected processing time" icon={Clock} accentColor="#dc2626" noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Delayed Transactions Report", fmt)} />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                    {["Transaction ID", "Document Type", "Assigned Faculty", "Current Stage", "Days Waiting", "Status"].map(h => (
                      <th key={h} style={{ textAlign: (h === "Transaction ID" || h === "Document Type" || h === "Assigned Faculty" || h === "Current Stage") ? "left" : "center", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DELAYED_TRANSACTIONS.map((d, i) => (
                    <tr key={d.id} style={{ borderBottom: i < DELAYED_TRANSACTIONS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: 11 }}>{d.id}</td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>{d.docType}</td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>{d.faculty}</td>
                      <td style={{ padding: "10px 14px", color: "#374151" }}>{d.stage}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{d.days}d</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}><StatusBadge s={d.status} /></td>
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
            {/* ── 4. Processing Time Analytics ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <SectionCard title="Average Processing Time" icon={Gauge} accentColor="#7c3aed">
                <p style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>{PROCESSING_TIME.average}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Across all document types and stages</p>
              </SectionCard>
              <SectionCard title="Fastest Processing Time" icon={CheckCircle2} accentColor="#059669">
                <p style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>{PROCESSING_TIME.fastest.time}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{PROCESSING_TIME.fastest.doc}</p>
              </SectionCard>
              <SectionCard title="Slowest Processing Time" icon={AlertTriangle} accentColor="#dc2626">
                <p style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>{PROCESSING_TIME.slowest.time}</p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{PROCESSING_TIME.slowest.doc}</p>
              </SectionCard>
            </div>
              </>
            )}

            {/* ── Faculty Workload tab ── */}
            {activeTab === "Faculty Workload" && (
              <>
            {/* ── 5. Faculty Workload Report ── */}
            <SectionCard title="Faculty Workload Report" subtitle="Assigned transactions and completion rate per faculty member" icon={Users} accentColor="#0284c7" noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Faculty Workload Report", fmt)} />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                    {["Faculty Name", "Assigned", "Pending", "Completed", "Completion Rate"].map(h => (
                      <th key={h} style={{ textAlign: h === "Faculty Name" ? "left" : "center", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACULTY_WORKLOAD.map((f, i) => (
                    <tr key={f.name} style={{ borderBottom: i < FACULTY_WORKLOAD.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{f.name}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>{f.assigned}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#d97706", fontWeight: 600 }}>{f.pending}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#059669", fontWeight: 600 }}>{f.completed}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 110 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                            <div style={{ height: 5, borderRadius: 3, width: `${f.rate}%`, background: f.rate >= 90 ? "#059669" : f.rate >= 80 ? "#d97706" : "#dc2626" }} />
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
            {/* ── 6. Bottleneck Analysis ── */}
            <SectionCard title="Bottleneck Analysis" subtitle="Workflow stages exceeding expected processing time" icon={Activity} accentColor="#c2410c" noPad>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                    {["Workflow Stage", "Documents Waiting", "Avg Wait Time", "Threshold", "Severity"].map(h => (
                      <th key={h} style={{ textAlign: h === "Workflow Stage" ? "left" : "center", padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOTTLENECKS.map((b, i) => (
                    <tr key={b.stage} style={{ borderBottom: i < BOTTLENECKS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: b.severity === "Critical" ? "#fef2f2" : "transparent" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{b.stage}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#374151" }}>{b.waiting}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#dc2626", fontWeight: 700 }}>{b.avgWait}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#6b7280" }}>{b.threshold}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}><SeverityBadge level={b.severity} /></td>
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
            {/* ── 8. Returned/Rejection Analysis ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <SectionCard title="Rejection Analysis" subtitle="Most common reasons for returned or rejected transactions" icon={RotateCcw} accentColor="#dc2626">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={REJECTION_REASONS} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="reason" tick={{ fontSize: 9.5 }} width={140} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#dc2626" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </SectionCard>

              <SectionCard title="Monthly / Semestral Summary" subtitle={SEMESTRAL_SUMMARY.period} icon={BarChart3} accentColor="#5b21b6">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{SEMESTRAL_SUMMARY.totalProcessed}</p>
                    <p style={{ fontSize: 10, color: "#6b7280" }}>Total Processed</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>{SEMESTRAL_SUMMARY.approvalRate}%</p>
                    <p style={{ fontSize: 10, color: "#6b7280" }}>Approval Rate</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 800, color: "#0284c7" }}>{SEMESTRAL_SUMMARY.completionRate}%</p>
                    <p style={{ fontSize: 10, color: "#6b7280" }}>Completion Rate</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={MONTHLY_TREND}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="completed" stroke="#5b21b6" strokeWidth={2} dot={{ fill: "#5b21b6", r: 3 }} name="Completed" />
                  </LineChart>
                </ResponsiveContainer>
              </SectionCard>
            </div>
              </>
            )}

            {/* ── Audit Trail tab ── */}
            {activeTab === "Audit Trail" && (
              <>
            {/* ── 10. Audit Trail Summary ── */}
            <SectionCard title="Audit Trail Summary" subtitle="Recent activity across the workflow system" icon={Shield} accentColor="#374151"
              footer={<button onClick={() => navigate("/audit")} style={{ width: "100%", background: "none", border: "none", color: "#7c3aed", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>View Full Audit Trail <ChevronRight style={{ width: 12, height: 12 }} /></button>}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AUDIT_TRAIL.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", flexShrink: 0 }} />
                    <span style={{ color: "#111827", fontWeight: 600 }}>{a.actor}</span>
                    <span style={{ color: "#6b7280" }}>{a.action}</span>
                    <span style={{ color: "#374151", flex: 1 }}>{a.item}</span>
                    <span style={{ color: "#9ca3af", fontSize: 10, flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
              </>
            )}

            {/* ── Quick Reports tab ── */}
            {activeTab === "Quick Reports" && (
              <>
            {/* ── 11. Quick Report Center ── */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Quick Report Center</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {QUICK_REPORTS.map(r => (
                  <div key={r.title} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${r.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <r.icon style={{ width: 16, height: 16, color: r.color }} />
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{r.title}</p>
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
