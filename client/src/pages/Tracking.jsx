import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const API = import.meta.env.VITE_API_URL || "";

// ── Icons (same set as TaskAssigned) ─────────────────────────────────────────
const Icon = {
  Grid:      () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  Inbox:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z"/></svg>,
  Plus:      ({ color = "currentColor", size = 14 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}><path d="M8 1v14M1 8h14"/></svg>,
  Tasks:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>,
  Workflow:  () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Reports:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z"/></svg>,
  Forms:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg>,
  Users:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5s5 2 5 5"/><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3"/></svg>,
  Shield:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z"/></svg>,
  Settings:  () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Help:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v1"/></svg>,
  Logout:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6"/></svg>,
  Search:    () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/></svg>,
  AssignTask:() => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12.5" cy="12.5" r="3" fill="#7c3aed"/><path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Tracking:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  Eye:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><ellipse cx="8" cy="8" rx="6" ry="4"/><circle cx="8" cy="8" r="2"/></svg>,
  ChevronR:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M6 4l4 4-4 4" strokeLinecap="round"/></svg>,
  ChevronL:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M10 4L6 8l4 4" strokeLinecap="round"/></svg>,
  Refresh:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M13 8A5 5 0 112 6" strokeLinecap="round"/><path d="M2 2v4h4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Close:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M12 4L4 12M4 4l8 8" strokeLinecap="round"/></svg>,
  Doc:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M3 2h7l3 3v9H3V2z" strokeLinejoin="round"/><path d="M10 2v3h3M5 8h6M5 10.5h4" strokeLinecap="round"/></svg>,
  Categories:() => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/></svg>,
  SLA: () => 
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
};

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  "pending":        { bg: "#fef3c7", color: "#92400e", dot: "#f59e0b" }, // In Progress group
  "in review":      { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" }, // In Progress group
  "for approval":   { bg: "#ede9fe", color: "#5b21b6", dot: "#7c3aed" }, // Pending Review
  "returned":       { bg: "#ffedd5", color: "#9a3412", dot: "#f97316" },
  "received":       { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "approved":       { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  "rejected":       { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  "archived":       { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
};

function StatusBadge({ status }) {
  const key = status?.toLowerCase() || "";
  const s = STATUS_STYLES[key] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── Status filter groups ──────────────────────────────────────────────────────
// "In Progress" and "Pending Review" aren't literal status values from the API —
// they're groupings over the real raw statuses ("Pending", "In Review", "For
// Approval", ...). This is the single source of truth for that grouping, used by
// the filter pills, the doc-list filtering, and the stat cards, so they can't
// drift out of sync with each other.
const STATUS_FILTER_MATCH = {
  "In Progress":    ["pending", "in review"],  // assigned, not yet submitted / faculty still working
  "Pending Review": ["for approval"],           // submitted, awaiting program chair approval
};

// ── Stage progress bar ────────────────────────────────────────────────────────
const STAGES = ["Task Assigned", "Submitted", "Under Review", "For Approval", "Approved"];

// Maps a task's status to a human-readable stage label shown in the table
const TASK_STAGE_BY_STATUS = {
  "Pending":      "Awaiting Faculty Submission",
  "In Review":    "Faculty Working on Task",
  "For Approval": "Pending Program Chair Approval",
  "Returned":     "Returned to Faculty for Revision",
  "Received":     "Approved",
  "Approved":     "Approved",
};

function StageBar({ stage, status }) {
  const idx = STAGES.findIndex(s => s.toLowerCase() === stage?.toLowerCase());
  const current = idx >= 0 ? idx : 0;
  const lowerStatus = status?.toLowerCase();
  const rejected = lowerStatus === "rejected";
  const approved = lowerStatus === "approved";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", minWidth: 120 }}>
      {STAGES.map((s, i) => {
        const done    = approved ? true : i < current;
        const active  = approved ? i === STAGES.length - 1 : i === current;
        const isLast  = i === STAGES.length - 1;
        const barColor = rejected && active ? "#ef4444"
          : approved ? "#10b981"
          : done || active ? "#8B5CF6" : "#e5e7eb";
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div title={s} style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: barColor,
              border: active ? `2px solid ${rejected ? "#ef4444" : approved ? "#10b981" : "#7c3aed"}` : "none",
              boxShadow: active ? `0 0 0 2px ${rejected ? "#fecaca" : approved ? "#d1fae5" : "#ede9fe"}` : "none",
            }} />
            {!isLast && <div style={{ flex: 1, height: 2, background: approved ? "#10b981" : done ? "#7c3aed" : "#e5e7eb", minWidth: 6 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ name, size = 28, color = "#7c3aed" }) {
  const initials = String(name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({ label, active, count, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "6px 13px", borderRadius: 20, border: active ? "none" : "1px solid #E9D5FF", cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
      background: active ? "#8B5CF6" : "white",
      color: active ? "white" : "#494454",
      transition: "all 0.15s",
    }}>
      {label}
      {count != null && (
        <span style={{ background: active ? "rgba(255,255,255,0.25)" : "#f3f4f6", color: active ? "white" : "#374151", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Type badge (Task / Form) ──────────────────────────────────────────────────
function TypeBadge({ type }) {
  const isTask = type === "task";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
      background: isTask ? "#ede9fe" : "#dbeafe",
      color: isTask ? "#6d28d9" : "#1e40af",
      textTransform: "uppercase", letterSpacing: 0.4,
    }}>
      {isTask ? "Task" : "Form"}
    </span>
  );
}


const STATUS_PROGRESS = {
  "pending":        { pct: 10,  color: "#f59e0b", trail: "#fef3c7" },
  "pending review": { pct: 25,  color: "#7c3aed", trail: "#ede9fe" },
  "in progress":    { pct: 50,  color: "#7c3aed", trail: "#ede9fe" },
  "in review":      { pct: 50,  color: "#7c3aed", trail: "#ede9fe" },
  "for approval":   { pct: 75,  color: "#3b82f6", trail: "#dbeafe" },
  "returned":       { pct: 30,  color: "#f97316", trail: "#ffedd5" },
  "received":       { pct: 100, color: "#10b981", trail: "#d1fae5" },
  "approved":       { pct: 100, color: "#10b981", trail: "#d1fae5" },
  "completed":      { pct: 100, color: "#10b981", trail: "#d1fae5" },
  "rejected":       { pct: 60,  color: "#ef4444", trail: "#fee2e2" },
  "archived":       { pct: 100, color: "#9ca3af", trail: "#f3f4f6" },
};

function CircleProgress({ pct, color, trail, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trail} strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

// ── Full-page detail view (slide-over) ────────────────────────────────────────
function DetailDrawer({ doc, onClose }) {
  const [tab, setTab] = useState("summary");
  if (!doc) return null;

  const lowerStatus = doc.status?.toLowerCase() || "";
  const prog = STATUS_PROGRESS[lowerStatus] || { pct: 50, color: "#7c3aed", trail: "#ede9fe" };
  const isComplete  = lowerStatus === "approved";
  const isRejectedStatus = ["rejected", "returned"].includes(lowerStatus);

  // ── Build timeline steps with accurate actor + role context ─────────────────
  // Step 0 — Task Assigned: admin/chair assigns task to faculty
  // Step 1 — Submitted:     faculty submits their document
  // Step 2 — Under Review:  program chair reviews
  // Step 3 — For Approval:  department-level approval
  // Step 4 — Completed:     final sign-off

  const STATUS_TO_ACTIVE = {
    "pending":        0,
    "pending review": 1,
    "in progress":    1,
    "in review":      2,
    "for approval":   3,
    "returned":       1,
    "rejected":       2,
    "approved":       4,
    "archived":       4,
  };
  const activeIdx  = STATUS_TO_ACTIVE[lowerStatus] ?? 1;
  const isRejected = isRejectedStatus;

  // Explicit named fields — assigned_by_name = chair/admin, faculty_name = faculty member
  const chairName   = doc.assigned_by_name || doc.current_handler || "Program Chair";
  const facultyName = doc.faculty_name     || doc.submitted_by    || "Faculty";

  const isReturned = lowerStatus === "returned";
  const isRejectedFinal = lowerStatus === "rejected";

  // Base steps — always the same order
  const BASE_STEPS = [
    {
      stage:   "Task Assigned",
      roleTag: "Assigned by",
      actor:   chairName,
      date:    doc.assigned_at || doc.submitted_at,
      doneAt:  0,
    },
    {
      stage:   "Submitted",
      roleTag: "Submitted by",
      actor:   facultyName,
      date:    doc.submitted_at,
      doneAt:  1,
    },
    {
      stage:   "Under Review",
      roleTag: "Reviewed by",
      actor:   chairName,
      date:    null,
      doneAt:  2,
    },
    {
      stage:   "For Approval",
      roleTag: "Approved by",
      actor:   doc.approver || chairName,
      date:    null,
      doneAt:  3,
    },
    {
      stage:   "Approved",
      roleTag: "Approved by",
      actor:   doc.finalized_by || chairName,
      date:    isComplete ? (doc.updated_at || doc.submitted_at) : null,
      doneAt:  4,
    },
  ];

  // For returned/rejected: inject a "Returned to Faculty" step after Submitted
  // Submitted stays green (done), the Returned step gets the orange/red warning style
  let TPLSTEPS = BASE_STEPS;
  if (isReturned || isRejectedFinal) {
    TPLSTEPS = [
      BASE_STEPS[0], // Task Assigned — done ✓
      BASE_STEPS[1], // Submitted — done ✓ (faculty did submit; it was returned AFTER)
      {
        stage:    isRejectedFinal ? "Rejected" : "Returned to Faculty",
        roleTag:  "Returned by",
        actor:    chairName,
        date:     doc.updated_at || null,
        returned: true,   // special flag — orange/red style, not an X on a prior step
      },
      { ...BASE_STEPS[2], date: null }, // Under Review — pending (will happen after re-submission)
      { ...BASE_STEPS[3], date: null }, // For Approval — pending
      { ...BASE_STEPS[4], date: null }, // Approved — pending
    ];
  }

  const timeline = doc.timeline || TPLSTEPS.map((step, i) => {
    if (isReturned || isRejectedFinal) {
      // Steps 0 and 1 are done (assigned + submitted happened before return)
      // Step 2 is the Returned/Rejected step — active warning
      // Steps 3+ are pending
      return {
        ...step,
        done:     i < 2,
        active:   i === 2,
        returned: step.returned || false,
      };
    }
    return {
      ...step,
      done:   isComplete ? true : (step.doneAt != null ? step.doneAt < activeIdx : i < activeIdx),
      active: !isComplete && (step.doneAt != null ? step.doneAt === activeIdx : i === activeIdx),
    };
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
  const fmtDateTime = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const STATUS_REF = [
    { label: "Pending",      dot: "#f59e0b" },
    { label: "In Progress",  dot: "#7c3aed" },
    { label: "In Review",    dot: "#7c3aed" },
    { label: "For Approval", dot: "#3b82f6" },
    { label: "Returned",     dot: "#f97316" },
    { label: "Received",     dot: "#10b981" },
    { label: "Approved",     dot: "#10b981" },
    { label: "Rejected",     dot: "#ef4444" },
    { label: "Archived",     dot: "#9ca3af" },
  ];

  const attachment = doc.attachments?.[0];
  const fileName = attachment?.file_name || attachment?.name || "approval_form.pdf";
  const fileUrl  = attachment?.file_url  || attachment?.url  || "#";
  const fileSize = attachment?.size ? `${(attachment.size / (1024 * 1024)).toFixed(1)} MB` : "1.4 MB";
  const filePages = attachment?.pages ? `${attachment.pages} page${attachment.pages !== 1 ? "s" : ""}` : null;
  const fileExt = (fileName.split(".").pop() || "PDF").toUpperCase();

  const TABS = [
    { id: "summary",  label: "Document Summary" },
    { id: "routing",  label: "Routing Timeline" },
    { id: "activity", label: "Activity History" },
  ];

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,34,0.45)", backdropFilter: "blur(3px)", fontFamily: "'DM Sans', sans-serif", animation: "backdropIn 0.2s ease" }}>
      <style>{`
        @keyframes backdropIn { from { opacity:0; } to { opacity:1; } }
        @keyframes detailIn   { from { opacity:0; transform:translateY(16px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      {/* ── Modal container ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "min(92vw, 1100px)", height: "min(90vh, 820px)", background: "#f8f7ff", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "detailIn 0.22s ease" }}>

      {/* ── Top breadcrumb bar ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", padding: "10px 28px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#9ca3af", flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", border: "none", borderRadius: 7, padding: "5px 12px", cursor: "pointer", color: "#374151", fontSize: 12, fontWeight: 600 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12"><path d="M10 4L6 8l4 4" strokeLinecap="round"/></svg>
          Back to Documents
        </button>
        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10" style={{ color: "#d1d5db" }}><path d="M6 4l4 4-4 4" /></svg>
        <span>Dashboard</span>
        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10" style={{ color: "#d1d5db" }}><path d="M6 4l4 4-4 4" /></svg>
        <span>Document Tracking</span>
        <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10" style={{ color: "#d1d5db" }}><path d="M6 4l4 4-4 4" /></svg>
        <span style={{ color: "#7c3aed", fontWeight: 700 }}>{doc.document_id}</span>
        {/* Close button */}
        <button onClick={onClose} style={{ marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", color: "#6b7280" }}>
          <Icon.Close />
        </button>
      </div>

      {/* ── Document hero header ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", padding: "16px 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ background: "#ede9fe", color: "#7c3aed", fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6, letterSpacing: 0.5 }}>{doc.document_id}</span>
          <StatusBadge status={doc.status} />
          <div style={{ marginLeft: "auto" }}>
            <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 7, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon.Eye /> View Only
            </span>
          </div>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>{doc.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 12, color: "#6b7280", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 14V6l6-4 6 4v8H10V9H6v5H2z"/></svg>
            {doc.department}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>
            {doc.submitted_by}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v4M11 1v4M2 7h12"/></svg>
            Submitted {fmtDate(doc.submitted_at)}
          </span>
          {doc.updated_at && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="12" height="12"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/></svg>
              Updated {fmtDateTime(doc.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* ── 4 info cards ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", padding: "14px 28px", flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {[
            { eyebrow: "CURRENT STAGE",   icon: <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round"/></svg>, value: doc.stage || "—",            bg: "#faf9ff" },
            { eyebrow: "CURRENT HANDLER", icon: <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5"/></svg>, value: doc.current_handler || "—", bg: "#faf9ff" },
            { eyebrow: "CATEGORY",        icon: <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><path d="M3 2h7l3 3v9H3V2z"/><path d="M10 2v3h3"/></svg>,                                 value: doc.department || "—",        bg: "#faf9ff" },
            { eyebrow: "LAST UPDATED",    icon: <svg viewBox="0 0 16 16" fill="none" stroke="#f59e0b" strokeWidth="1.5" width="14" height="14"><rect x="2" y="3" width="12" height="11" rx="1.5"/><path d="M5 1v4M11 1v4M2 7h12"/></svg>, value: doc.updated_at ? new Date(doc.updated_at).toLocaleDateString("en-US",{month:"long",day:"numeric"}) : (doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString("en-US",{month:"long",day:"numeric"}) : "—"), bg: "#fffbeb" },
          ].map(({ eyebrow, icon, value, bg }) => (
            <div key={eyebrow} style={{ background: bg, border: "1px solid #f0f0f0", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, marginBottom: 6, textTransform: "uppercase" }}>
                {icon} {eyebrow}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body: tabs + sidebar ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* Left: tabbed content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Tab bar */}
          <div style={{ background: "white", borderBottom: "1px solid #f0f0f0", padding: "0 28px", display: "flex", gap: 0, flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: "none", border: "none", cursor: "pointer", padding: "12px 18px",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "#7c3aed" : "#6b7280",
                borderBottom: tab === t.id ? "2px solid #7c3aed" : "2px solid transparent",
                marginBottom: -1, transition: "all 0.15s",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab body */}
          <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>

            {/* ─── Document Summary tab ─── */}
            {tab === "summary" && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", padding: 24, maxWidth: 720 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.Doc />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Document Summary</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Complete metadata for this document</div>
                  </div>
                </div>

                {[
                  { label: "DOCUMENT ID",    value: doc.document_id, wide: false, bold: true },
                  { label: "STATUS",         value: doc.status,      wide: false },
                  { label: "DOCUMENT TITLE", value: doc.title,       wide: true  },
                  { label: "CATEGORY",       value: doc.department,  wide: false },
                  { label: "DEPARTMENT",     value: doc.department,  wide: false },
                  { label: "SUBMITTED BY",   value: doc.submitted_by, wide: false },
                  { label: "DATE SUBMITTED", value: fmtDate(doc.submitted_at), wide: false },
                  { label: "CURRENT HANDLER",value: doc.current_handler || "—", wide: false },
                  { label: "WORKFLOW STAGE", value: doc.stage || "—", wide: false },
                  { label: "LAST UPDATED",   value: fmtDateTime(doc.updated_at || doc.submitted_at), wide: true },
                ].reduce((rows, field, i, arr) => {
                  if (field.wide) {
                    rows.push([field]);
                  } else {
                    const prev = rows[rows.length - 1];
                    if (prev && prev.length === 1 && !prev[0].wide) {
                      prev.push(field);
                    } else {
                      rows.push([field]);
                    }
                  }
                  return rows;
                }, []).map((row, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: row.length === 2 ? "1fr 1fr" : "1fr", borderBottom: "1px solid #f9f9f9", padding: "12px 0" }}>
                    {row.map(f => (
                      <div key={f.label} style={{ paddingRight: 16 }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: 13, color: f.bold ? "#7c3aed" : "#111", fontWeight: f.bold ? 700 : 500 }}>{f.value || "—"}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* ─── Routing Timeline tab ─── */}
            {tab === "routing" && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", padding: 24, maxWidth: 600 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 18 }}>Routing Timeline</div>
                {timeline.map((step, i) => {
                  const isLast      = i === timeline.length - 1;
                  const isActive    = step.active;
                  const isRetStep   = step.returned;   // the dedicated Returned/Rejected step

                  const dotBg     = step.done    ? "#7c3aed"
                                  : isRetStep    ? "#f97316"
                                  : isActive     ? "white"
                                  : "#f3f4f6";
                  const dotBorder = step.done    ? "#7c3aed"
                                  : isRetStep    ? "#f97316"
                                  : isActive     ? "#7c3aed"
                                  : "#e5e7eb";
                  const dotShadow = isRetStep    ? "0 0 0 4px #ffedd5"
                                  : isActive     ? "0 0 0 4px #ede9fe"
                                  : "none";
                  const lineBg    = step.done    ? "#7c3aed" : "#e5e7eb";

                  return (
                    <div key={i} style={{ display: "flex", gap: 14 }}>
                      {/* spine */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          background: dotBg, border: `2px solid ${dotBorder}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: dotShadow,
                        }}>
                          {step.done
                            ? <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" width="11" height="11"><path d="M2 6l3 3 5-5" strokeLinecap="round"/></svg>
                            : isRetStep
                              ? <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" width="11" height="11"><path d="M9 3L4 8M2 6l2 2" strokeLinecap="round"/><path d="M9 3H6M9 3v3" strokeLinecap="round"/></svg>
                              : isActive
                                ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />
                                : null
                          }
                        </div>
                        {!isLast && <div style={{ width: 2, flex: 1, minHeight: 28, background: lineBg, margin: "3px 0" }} />}
                      </div>
                      <div style={{ paddingBottom: 22 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: step.done || isActive || isRetStep ? "#111" : "#9ca3af" }}>{step.stage}</div>
                        {step.actor && (
                          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            <span style={{ fontWeight: 600, color: step.done || isActive || isRetStep ? "#6b7280" : "#bbb" }}>{step.roleTag}:</span>{" "}
                            <span style={{ color: step.done || isActive || isRetStep ? "#374151" : "#bbb" }}>{step.actor}</span>
                          </div>
                        )}
                        {step.date
                          ? <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{fmtDate(step.date)}</div>
                          : isRetStep
                            ? <div style={{ fontSize: 11, color: "#f97316", marginTop: 2, fontWeight: 600 }}>Awaiting resubmission</div>
                            : isActive
                              ? <div style={{ fontSize: 11, color: "#7c3aed", marginTop: 2, fontWeight: 600 }}>In progress</div>
                              : step.done
                                ? <div style={{ fontSize: 11, color: "#10b981", marginTop: 2, fontWeight: 600 }}>Completed</div>
                                : <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 2 }}>Pending</div>
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Activity History tab ─── */}
            {tab === "activity" && (
              <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0f0", padding: 24, maxWidth: 600 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 18 }}>Activity History</div>
                {[
                  { action: "Document submitted",       actor: doc.submitted_by,    date: doc.submitted_at, color: "#7c3aed", icon: "📄" },
                  { action: "Assigned to handler",      actor: doc.current_handler, date: doc.submitted_at, color: "#3b82f6", icon: "👤" },
                  { action: `Status set to ${doc.status}`, actor: "System",         date: doc.updated_at || doc.submitted_at, color: "#10b981", icon: "✅" },
                ].filter(a => a.actor && a.date).map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${a.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{a.action}</div>
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>by {a.actor}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{fmtDateTime(a.date)}</div>
                    </div>
                  </div>
                ))}
                {doc.attachments?.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 16, borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Attachments</div>
                    {doc.attachments.map((att, i) => (
                      <a key={i} href={att.file_url || att.url || "#"} target="_blank" rel="noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "#fafafa", border: "1px solid #f0f0f0", marginBottom: 6, textDecoration: "none", color: "#374151" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon.Doc /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.file_name || att.name}</div>
                          {att.size > 0 && <div style={{ fontSize: 10, color: "#9ca3af" }}>{(att.size / 1024).toFixed(1)} KB</div>}
                        </div>
                        <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="13" height="13"><path d="M8 2v8M4 7l4 4 4-4" strokeLinecap="round"/><path d="M2 13h12"/></svg>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ width: 300, borderLeft: "1px solid #f0f0f0", background: "white", overflowY: "auto", flexShrink: 0, padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Status Overview card */}
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 12, overflow: "visible" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#111" }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/></svg>
              Status Overview
            </div>
            <div style={{ padding: "16px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Circle with status inside */}
              <div style={{ position: "relative", width: 80, height: 80, marginBottom: 10 }}>
                <CircleProgress pct={prog.pct} color={prog.color} trail={prog.trail} size={80} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 46, height: 46, borderRadius: "50%", background: `${prog.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isComplete
                      ? <svg viewBox="0 0 16 16" fill="none" stroke={prog.color} strokeWidth="2" width="20" height="20"><path d="M3 8l4 4 6-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : isRejectedStatus
                        ? <svg viewBox="0 0 16 16" fill="none" stroke={prog.color} strokeWidth="2" width="18" height="18"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>
                        : lowerStatus === "for approval"
                          ? <svg viewBox="0 0 16 16" fill="none" stroke={prog.color} strokeWidth="1.5" width="18" height="18"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l3 2" strokeLinecap="round"/></svg>
                          : <svg viewBox="0 0 16 16" fill="none" stroke={prog.color} strokeWidth="1.5" width="18" height="18"><path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round"/></svg>
                    }
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: prog.color, marginBottom: 2, textTransform: "capitalize" }}>{doc.status}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Current Status</div>

              {/* Progress bar */}
              <div style={{ width: "100%", marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, color: "#6b7280" }}>
                  <span>Workflow Progress</span>
                  <span style={{ fontWeight: 700, color: "#111" }}>{prog.pct}%</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: prog.trail }}>
                  <div style={{ width: `${prog.pct}%`, height: "100%", borderRadius: 3, background: prog.color, transition: "width 0.5s ease" }} />
                </div>
              </div>

              {/* Status reference list */}
              <div style={{ width: "100%", marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>STATUS REFERENCE</div>
                {STATUS_REF.map(s => {
                  const isCurrentStatus = doc.status?.toLowerCase() === s.label.toLowerCase();
                  return (
                    <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
                        <span style={{ color: isCurrentStatus ? "#111" : "#6b7280", fontWeight: isCurrentStatus ? 700 : 400 }}>{s.label}</span>
                      </div>
                      {isCurrentStatus && <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, flexShrink: 0 }}>◆ Current</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Document Preview card */}
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 12, overflow: "visible" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#111" }}>
                <Icon.Eye />
                Document Preview
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginTop: 2 }}>Uploaded file attachment</div>
            </div>
            <div style={{ padding: 16 }}>
              {/* File preview box */}
              <div style={{ background: "#f8f7ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "white", border: "1px solid #ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, boxShadow: "0 2px 6px rgba(124,58,237,0.08)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="22" height="22"><path d="M4 4h10l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"/><path d="M14 4v5h5M8 13h8M8 17h5" strokeLinecap="round"/></svg>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", textAlign: "center", wordBreak: "break-word" }}>{fileName}</div>
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 3 }}>{fileExt} · {fileSize}{filePages ? ` · ${filePages}` : ""}</div>
              </div>
              <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "9px 0", background: "#7c3aed", color: "white", borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: "none", marginBottom: 8 }}>
                <Icon.Eye /> View Document
              </a>
              <a href={fileUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, width: "100%", padding: "9px 0", background: "white", color: "#374151", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid #e5e7eb" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M8 2v8M4 7l4 4 4-4" strokeLinecap="round"/><path d="M2 13h12"/></svg>
                Download Copy
              </a>
              <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", gap: 5, color: "#9ca3af", fontSize: 10 }}>
                <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.5v.5" stroke="white" strokeWidth="1.5"/></svg>
                Read-only access. Download subject to your permission level.
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Tracking() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const user     = (() => { try { return JSON.parse(atob(token?.split(".")[1] || "")); } catch { return {}; } })();
  const canViewAdminNav = ["admin", "program_chair"].includes(user?.role);

  const [docs,        setDocs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [searchBy,    setSearchBy]    = useState("all");
  const [statusFilter,setStatusFilter]= useState("All");
  const [selected,    setSelected]    = useState(null);
  const [page,        setPage]        = useState(1);
  const PER_PAGE = 8;

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const merged = [];

      // ── User id -> name lookup ───────────────────────────────────────────
      // Uses /api/users/names (any authenticated user), not /api/users
      // (admin/program_chair only), and normalizes ids to strings on both
      // sides since number/string id mismatches were causing every lookup
      // to miss and fall back to "User #<id>".
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
      } catch (err) {
        console.error("Users fetch error:", err);
      }
      const nameOf = (id) => (id != null && userMap[String(id)]) || (id ? `User #${id}` : "—");

      // ── Base tracking documents ─────────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/tracking`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          merged.push(...(data.documents || data || []));
        }
      } catch (err) {
        console.error("Tracking fetch error:", err);
      }

      // ── Tasks assigned (from TaskAssignment) ────────────────────────────
      try {
        const res = await fetch(`${API}/api/tasks`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks ?? data ?? [];
          (Array.isArray(tasks) ? tasks : []).forEach(t => {
            merged.push({
              id: `task-${t.id}`,
              source_type: "task",
              document_id: t.tracking_id,
              title: t.title,
              department: t.doc_type || "Task Assignment",
              assigned_by_name: nameOf(t.assigned_by || t.created_by),   // chair/admin who assigned
              faculty_name:     nameOf(t.faculty_id),                     // faculty who submits
              submitted_by: nameOf(t.assigned_by || t.created_by),        // kept for table display
              current_handler: nameOf(t.faculty_id),
              stage: t.stage || TASK_STAGE_BY_STATUS[t.status] || "Awaiting Faculty Submission",
              status: t.status === "Received" ? "Approved" : (t.status || "Pending"),
              submitted_at: t.created_at || t.deadline,
              assigned_at: t.created_at,
              attachments: t.attachments || [],
            });
          });
        }
      } catch (err) {
        console.error("Tasks fetch error:", err);
      }

      // ── Forms submitted by faculty ───────────────────────────────────────
      // /api/forms/all is reviewer-only (admin / program_chair) on the
      // backend and returns 403 for everyone else, so faculty accounts must
      // use /api/forms/my (their own submissions) instead — otherwise this
      // whole block silently no-ops and forms never show up in the table.
      try {
        const formsEndpoint = canViewAdminNav ? "/api/forms/all" : "/api/forms/my";
        const res = await fetch(`${API}${formsEndpoint}`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const forms = data.forms ?? data ?? [];
          if (forms.length > 0) console.log("[Tracking] form sample fields:", Object.keys(forms[0]), forms[0]);
          (Array.isArray(forms) ? forms : []).forEach(f => {
            const reviewerName = typeof f.reviewed_by === "number" ? nameOf(f.reviewed_by) : (f.reviewed_by || "Program Chair");
            // Faculty who uploaded the form — try every possible field the API might return
            const facultySubmitter =
              f.full_name ||
              f.submitter_name ||
              f.submitted_by ||
              f.faculty_name ||
              f.user_name ||
              f.username ||
              (f.user_id    ? nameOf(f.user_id)    : null) ||
              (f.faculty_id ? nameOf(f.faculty_id) : null) ||
              "—";
            merged.push({
              id: `form-${f.id}`,
              source_type: "form",
              document_id: f.tracking_id || f.id,
              title: f.category ? `${f.category} Form` : "Form Submission",
              department: f.category || "Forms",
              faculty_name:     facultySubmitter,
              assigned_by_name: reviewerName,
              submitted_by: facultySubmitter,
              current_handler: reviewerName,
              stage: f.stage || (["Approved", "Received"].includes(f.status) ? "Approved" : "Submitted"),
              status: f.status === "Received" ? "Approved" : (f.status || "Pending"),
              submitted_at: f.filing_date || f.created_at,
              assigned_at: f.assigned_at || f.created_at,
              attachments: f.file_name ? [{ file_name: f.file_name, file_url: f.file_url }] : [],
            });
          });
        } else {
          console.error("Forms fetch failed:", res.status, await res.text().catch(() => ""));
        }
      } catch (err) {
        console.error("Forms fetch error:", err);
      }

      // ── Sort: latest submitted_at first ─────────────────────────────────
      merged.sort((a, b) => {
        const da = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
        const db = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
        return db - da;
      });

      setDocs(merged);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ── Filter + search ────────────────────────────────────────────────────────
  const SEARCH_BY_FIELDS = {
    all:          ["document_id", "title", "submitted_by", "current_handler", "department"],
    document_id:  ["document_id"],
    title:        ["title"],
    submitted_by: ["submitted_by"],
    current_handler: ["current_handler"],
    department:   ["department"],
  };

  const filtered = docs.filter(d => {
    const q = search.toLowerCase();
    const fields = SEARCH_BY_FIELDS[searchBy] || SEARCH_BY_FIELDS.all;
    const matchSearch = !q || fields.some(field => d[field]?.toLowerCase().includes(q));
    const filterDef  = STATUS_FILTER_MATCH[statusFilter];
    const matchStatus = statusFilter === "All"
      || (filterDef
        ? filterDef.includes(d.status?.toLowerCase())
        : d.status?.toLowerCase() === statusFilter.toLowerCase());
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  // ── Stat counts ────────────────────────────────────────────────────────────
  const stats = {
    total:         docs.length,
    inProgress:    docs.filter(d => STATUS_FILTER_MATCH["In Progress"].includes(d.status?.toLowerCase())).length,
    pendingReview: docs.filter(d => STATUS_FILTER_MATCH["Pending Review"].includes(d.status?.toLowerCase())).length,
    completed:     docs.filter(d => d.status?.toLowerCase() === "approved").length,
  };

  // ── Status filter pills ────────────────────────────────────────────────────
  const STATUS_FILTERS = [
    { label: "All",            value: "All" },
    { label: "In Progress",    value: "In Progress" },
    { label: "Pending Review", value: "Pending Review" },
    { label: "Approved",       value: "Approved" },
    { label: "Rejected",       value: "Rejected" },
    { label: "Archived",       value: "Archived" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f8f7ff", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .doc-row:hover { background: #F8F7FF !important; cursor: pointer; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #cbc3d7; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #8B5CF6; }
      `}</style>

      <Sidebar activePage="tracking" />

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <button onClick={fetchDocs} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center" }}>
              <Icon.Refresh />
            </button>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32, background: "#F8F7FF" }}>

          {/* Page title */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 32, lineHeight: "2.5rem", fontWeight: 600, color: "#181445", margin: 0, letterSpacing: "-0.025em" }}>Document Tracking</h1>
              <p style={{ fontSize: 14, color: "#494454", margin: "8px 0 0" }}>Monitor document progress and routing history — read-only access</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={fetchDocs} style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #E9D5FF", color: "#1E1B4B", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Icon.Refresh /> Refresh
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #E9D5FF", color: "#1E1B4B", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 2v8M4 7l4 4 4-4" strokeLinecap="round"/><path d="M2 13h12"/></svg>
                Export
              </button>
            </div>
          </div>

          {/* Bento stat grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, marginBottom: 24 }}>
            {[
              { label: "Total Documents",      value: stats.total,         icon: <Icon.Doc />,      accent: "rgba(107,56,212,0.12)", iconColor: "#7b7486", tag: null,               tagColor: "#494454" },
              { label: "In Progress",          value: stats.inProgress,    icon: <Icon.Tracking />, accent: "rgba(37,99,235,0.12)",  iconColor: "#7b7486", tag: "Active",           tagColor: "#6b38d4" },
              { label: "Pending Review",       value: stats.pendingReview, icon: <Icon.Eye />,      accent: "rgba(217,119,6,0.12)",  iconColor: "#7b7486", tag: "Needs Action",     tagColor: "#ba1a1a" },
              { label: "Completed / Approved", value: stats.completed,     icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4" strokeLinecap="round"/></svg>, accent: "rgba(22,163,74,0.12)", iconColor: "#7b7486", tag: "Last 30 days", tagColor: "#6b38d4" },
            ].map(({ label, value, icon, accent, iconColor, tag, tagColor }) => (
              <div key={label} style={{
                position: "relative", overflow: "hidden",
                background: "white", border: "1px solid #cbc3d7", borderRadius: 16, padding: 24,
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "box-shadow 0.3s",
              }}>
                <div style={{ position: "absolute", top: -16, right: -16, width: 96, height: 96, borderRadius: "50%", background: accent, filter: "blur(24px)" }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ color: iconColor, display: "flex" }}>{icon}</span>
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <span style={{ display: "block", fontSize: 36, fontWeight: 700, lineHeight: 1.2, color: "#181445" }}>{loading ? "—" : value}</span>
                  {tag && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontWeight: 500, color: tagColor }}>
                      <span>{tag}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table card */}
          <div style={{
            background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)",
            borderRadius: 12, border: "1px solid #E9D5FF", overflow: "hidden",
            boxShadow: "0 4px 12px rgba(107, 56, 212, 0.03)",
          }}>

            {/* Filter bar */}
            <div style={{ padding: 16, borderBottom: "1px solid #E9D5FF", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "space-between", background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fcf8ff", border: "1px solid #E9D5FF", borderRadius: 8, padding: "8px 12px", color: "#9ca3af" }}>
                  <Icon.Search />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search by ID, Title, or Submitter..."
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: 200 }}
                  />
                </div>
                <select
                  value={searchBy}
                  onChange={e => { setSearchBy(e.target.value); setPage(1); }}
                  style={{ border: "1px solid #E9D5FF", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#374151", background: "#fcf8ff", cursor: "pointer" }}
                >
                  <option value="all">Search by: All Fields</option>
                  <option value="document_id">Document ID</option>
                  <option value="title">Title</option>
                  <option value="submitted_by">Submitted By</option>
                  <option value="current_handler">Current Handler</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginRight: 4 }}>Filter:</span>
                {STATUS_FILTERS.map(f => (
                  <FilterPill
                    key={f.value}
                    label={f.value === "All" ? `All (${docs.length})` : f.label}
                    count={f.value !== "All" ? docs.filter(d => {
                      const group = STATUS_FILTER_MATCH[f.value];
                      return group ? group.includes(d.status?.toLowerCase()) : d.status?.toLowerCase() === f.value.toLowerCase();
                    }).length : undefined}
                    active={statusFilter === f.value}
                    onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  />
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto", background: "white" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f6f2ff", borderBottom: "1px solid #cbc3d7" }}>
                    {["Document ID", "Title / Department", "Submitted By", "Current Handler", "Stage", "Status"].map(col => (
                      <th key={col} style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: "64px 24px", textAlign: "center", color: "#9ca3af" }}>
                      <div style={{ display: "inline-block", width: 20, height: 20, border: "2px solid #e5e7eb", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: "64px 24px", textAlign: "center", color: "#7b7486", fontSize: 14 }}>
                      No documents found{search ? ` for "${search}"` : ""}.
                    </td></tr>
                  ) : paginated.map(doc => (
                    <tr key={doc.id || doc.document_id} className="doc-row"
                      onClick={() => setSelected(doc)}
                      style={{ borderBottom: "1px solid #e3dfff", transition: "background 0.1s" }}>

                      {/* Document ID */}
                      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                        <div style={{ color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>{doc.document_id}</div>
                        <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>
                          {doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </div>
                      </td>

                      {/* Title / Dept */}
                      <td style={{ padding: "16px 24px", maxWidth: 220 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</span>
                          {doc.source_type && <TypeBadge type={doc.source_type} />}
                        </div>
                        <div style={{ color: "#9ca3af", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <svg viewBox="0 0 16 16" fill="currentColor" width="10" height="10"><path d="M2 14V6l6-4 6 4v8H10V9H6v5H2z"/></svg>
                          {doc.department}
                        </div>
                      </td>

                      {/* Submitted By */}
                      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                        {doc.submitted_by
                          ? <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <Avatar name={doc.submitted_by} size={24} color="#7c3aed" />
                              <span style={{ color: "#374151", fontWeight: 500 }}>{doc.submitted_by}</span>
                            </div>
                          : <span style={{ color: "#d1d5db" }}>—</span>
                        }
                      </td>

                      {/* Current Handler */}
                      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                        {doc.current_handler
                          ? <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <Avatar name={doc.current_handler} size={24} color="#059669" />
                              <span style={{ color: "#374151", fontWeight: 500 }}>{doc.current_handler}</span>
                            </div>
                          : <span style={{ color: "#d1d5db" }}>—</span>
                        }
                      </td>

                      {/* Stage bar */}
                      <td style={{ padding: "16px 24px", minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 5, fontWeight: 500 }}>{doc.stage || "—"}</div>
                        <StageBar stage={doc.stage} status={doc.status} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
                        <StatusBadge status={doc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #cbc3d7", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white" }}>
              <span style={{ fontSize: 14, color: "#494454" }}>
                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} document{filtered.length !== 1 ? "s" : ""}
                {filtered.length > 0 && <span style={{ marginLeft: 8, color: "#6b38d4" }}>· Click a row to view full tracking details</span>}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E9D5FF", background: page === 1 ? "#F8F7FF" : "white", color: page === 1 ? "#d1d5db" : "#494454", cursor: page === 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon.ChevronL />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: p === page ? "none" : "1px solid #E9D5FF", background: p === page ? "#8B5CF6" : "white", color: p === page ? "white" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: p === page ? 700 : 500 }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                  style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E9D5FF", background: page === totalPages || totalPages === 0 ? "#F8F7FF" : "white", color: page === totalPages || totalPages === 0 ? "#d1d5db" : "#494454", cursor: page >= totalPages ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon.ChevronR />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && <DetailDrawer doc={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}