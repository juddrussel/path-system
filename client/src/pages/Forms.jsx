import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const API = import.meta.env.VITE_API_URL;
// Attachments/submissions now store full R2 URLs (https://...). Older rows
// created before the R2 migration may still have local paths like
// "/uploads/forms/xyz.pdf" — those still need the API host prepended.
const resolveFileUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API || "http://localhost:5000"}${u}`);

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>,
  Inbox: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" /></svg>,
  Plus: ({ color = "currentColor", size = 14 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}><path d="M8 1v14M1 8h14" /></svg>,
  Tasks: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" /></svg>,
  Workflow: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Reports: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" /></svg>,
  Users: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>,
  Shield: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>,
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Settings: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Help: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" /></svg>,
  Logout: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" /></svg>,
  Search: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5L14 14" strokeLinecap="round" /></svg>,
  Download: () => <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" /></svg>,
  Upload: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M8 10V2M5 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" /></svg>,
  Forms: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>,
  Check: () => <svg viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="2" width="14" height="14"><path d="M13 5l-7 7-3-3" strokeLinecap="round" /></svg>,
  X: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" /></svg>,
  Eye: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" /><circle cx="8" cy="8" r="2" /></svg>,
  Pencil: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M11 2l3 3-8 8-3.5.5.5-3.5 8-8z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  File: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="28" height="28"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M10 2v4h4" /></svg>,
  ExportCSV: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" /><path d="M9 2v4h4" /><path d="M5 9h6M5 11.5h4" /></svg>,
  Filter: () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" /></svg>,
  Info: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" strokeLinecap="round" /></svg>,
  Tip: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" strokeLinecap="round" /></svg>,
  Bell: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0H6.5z" /></svg>,
  Tracking: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>,
  Categories:() => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/></svg>,
  SLA: () => 
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>,
  InfoCircle: ({ color = "#7c3aed", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><circle cx="8" cy="8" r="6.5" /><path d="M8 7.2v4M8 5v.2" strokeLinecap="round" /></svg>,
  DynamicForm: ({ color = "#7c3aed", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><rect x="1.5" y="2.5" width="13" height="11" rx="1.5" /><path d="M4 6h4M4 8.5h6M4 11h3" strokeLinecap="round" /></svg>,
  AttachFile: ({ color = "#7c3aed", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><path d="M11.5 5.5l-5 5a2 2 0 102.8 2.8l5-5a3.5 3.5 0 10-5-5l-5 5a5 5 0 007 7" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Notes: ({ color = "#7c3aed", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M5 6h6M5 8.5h6M5 11h3" strokeLinecap="round" /></svg>,
  Send: ({ color = "white", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><path d="M14.5 1.5L7 9M14.5 1.5L10 14.5l-3-5.5-5.5-3 13-4.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Chevron: ({ color = "#6b7280", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Trash: ({ color = "currentColor", size = 16 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" width={size} height={size}><path d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4m1.5 0l-.6 9.4a1 1 0 01-1 .9H5.1a1 1 0 01-1-.9L3.5 4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  CloudUpload: ({ color = "#7c3aed", size = 26 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" width={size} height={size}><path d="M4.5 11.5a2.5 2.5 0 01-.5-4.95A3.5 3.5 0 0111 5.6a2.75 2.75 0 01-.3 5.9" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 9.5V5M6.2 6.8L8 5l1.8 1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

// ── Shared field styling helpers (outline / focus-ring to match the design system) ─────────────
const fieldBase = { border: "1px solid #e5e7eb", background: "white", transition: "border-color .15s, box-shadow .15s" };
const onFieldFocus = e => { e.target.style.borderColor = "#7c3aed"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)"; };
const onFieldBlur = e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.boxShadow = "none"; };

// File-type badge (icon + color) for attachment cards, mirroring the mockup's PDF/DOCX styling
function fileTypeMeta(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { bg: "#ffdad6", color: "#ba1a1a", icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" /> };
  if (["doc", "docx"].includes(ext)) return { bg: "#eaddff", color: "#5a00c6", icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" /> };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return { bg: "#d1fae5", color: "#065f46", icon: <path d="M2 3h12v10H2z M5 8l2 2 3-4 4 5H2z" /> };
  return { bg: "#f3f4f6", color: "#6b7280", icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" /> };
}
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Approved: { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0", dot: "#10b981" },
    Pending: { bg: "#fef9c3", color: "#854d0e", border: "#fef08a", dot: "#eab308" },
    Rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca", dot: "#ef4444" },
    Draft: { bg: "#f3f4f6", color: "#374151", border: "#e5e7eb", dot: "#9ca3af" },
    Reviewing: { bg: "#ede9fe", color: "#5b21b6", border: "#ddd6fe", dot: "#8b5cf6" },
    Revision: { bg: "#fee2e2", color: "#991b1b", border: "#fecaca", dot: "#ef4444" },
  };
  const s = map[status] || map.Draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "3px 10px 3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── Avatar chip (initials) — mirrors the mockup's colored submitter avatars ──
const AVATAR_PALETTE = [
  { bg: "#e9ddff", color: "#4a1fb8" },
  { bg: "#eaddff", color: "#5a00c6" },
  { bg: "#dcecff", color: "#0b4a8f" },
  { bg: "#e3f5e8", color: "#0f6b3a" },
  { bg: "#ffe4e6", color: "#9d174d" },
  { bg: "#fef3c7", color: "#92400e" },
];
function Avatar({ name = "" }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", background: palette.bg, color: palette.color,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Stat Card (bento style, matches Audit Logs overview cards) ────────────────
function StatCard({ label, value, delta, deltaType = "neutral", icon, bg, iconColor, danger }) {
  const deltaColor = deltaType === "up" ? "#6b38d4" : deltaType === "down" ? "#ba1a1a" : "#494454";
  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid ${danger ? "rgba(186,26,26,0.2)" : "#cbc3d7"}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow .3s, transform .3s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 12px 24px -12px rgba(107,56,212,0.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Accent blur */}
      <div style={{ position: "absolute", right: -16, top: -16, width: 96, height: 96, borderRadius: "50%", background: bg, filter: "blur(32px)", opacity: 0.7, pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
        <span style={{ color: danger ? "#ba1a1a" : iconColor, display: "flex" }}>{icon}</span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <span style={{ display: "block", fontSize: 36, fontWeight: 700, lineHeight: 1.15, color: danger ? "#ba1a1a" : "#181445" }}>{value ?? "—"}</span>
        {delta && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 12, fontWeight: 500, color: deltaColor }}>
            {deltaType === "up" && (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M2 12l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /><path d="M11 5h4v4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            {deltaType === "down" && (
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M8 1.5l7 12h-14l7-12z" strokeLinejoin="round" /><path d="M8 6.5v3.5M8 11.75h.01" strokeLinecap="round" /></svg>
            )}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 14, padding: 28, width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", padding: 4 }}><Icon.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Toast Notification ────────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "success" ? "#059669" : t.type === "info" ? "#7c3aed" : "#dc2626",
          color: "white", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10,
          minWidth: 280, maxWidth: 360, animation: "slideIn 0.2s ease"
        }}>
          <span style={{ fontSize: 16 }}>
            {t.type === "success" ? "✓" : t.type === "info" ? "🔔" : "✕"}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
export default function Forms() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = getUser();
  const isProgramChair = user.role === "program_chair" || user.role === "admin";

  const [activeNav, setActiveNav] = useState("forms");
  const [activeTab, setActiveTab] = useState(isProgramChair ? "review" : "submit");
  const [search, setSearch] = useState("");

  const ACADEMIC_YEARS = (() => {
    const startYear = new Date().getFullYear();
    return [-1, 0, 1].map(offset => {
      const y = startYear + offset;
      return `A.Y. ${y} - ${y + 1}`;
    });
  })();

  const [wizardFormType, setWizardFormType] = useState("");
  const [wizardDocs, setWizardDocs] = useState({}); // { [fieldId]: { file, progress, status: 'uploading'|'done'|'error' } } — for "File Upload" type fields
  const [wizardFieldValues, setWizardFieldValues] = useState({}); // { [fieldId]: value } — for Text/Text Area/Date/Number/Dropdown/Checkbox fields
  const [wizardDragOver, setWizardDragOver] = useState(null); // slot id currently being dragged over
  const [wizardInfo, setWizardInfo] = useState({
    student_number: "",
    full_name: "",
    semester: "1st Semester",
    academic_year: ACADEMIC_YEARS[1],
    remarks: "",
  });
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardSuccess, setWizardSuccess] = useState(false);
  const wizardFileRefs = useRef({});

  // Repository / review state
  const [forms, setForms] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejection_rate: "0%" });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedForm, setSelectedForm] = useState(null);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [resubmitModal, setResubmitModal] = useState(false);
  const [resubmitForm, setResubmitForm] = useState(null);
  const [resubmitFile, setResubmitFile] = useState(null);
  const resubmitFileRef = useRef();

  // Existing Forms (program chair): full history, any status — separate
  // from the Review Queue above, which only ever shows Pending items.
  const [allForms, setAllForms] = useState([]);
  const [allFormsLoading, setAllFormsLoading] = useState(true);
  const [allFormsPage, setAllFormsPage] = useState(1);
  const [allFormsTotalPages, setAllFormsTotalPages] = useState(1);
  const [allFormsStatusFilter, setAllFormsStatusFilter] = useState("All");

  // Program chair: add form template
  const [addModal, setAddModal] = useState(false);
  const [templateData, setTemplateData] = useState({ name: "", description: "", category: "", required_fields: "" });

  // Document categories — pulled from the database (same /api/categories
  // source as DocumentCategories.jsx) so the dropdown only ever lists
  // categories that actually exist and are Active, instead of a hardcoded list.
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // ── Real-time: pending badge count & toast queue ──────────────────────────
  const [pendingBadge, setPendingBadge] = useState(0);
  const [toasts, setToasts] = useState([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Dynamic Step 2 fields — driven by the selected form type's template ──
  // (mirrors the "Form Fields" defined per category in Document Categories)
  const selectedCategory = categories.find(c => c.name === wizardFormType) || null;
  const selectedFields = selectedCategory?.formFields || [];
  const isFileField = (f) => f.fieldType === "File Upload";
  // Required file-upload fields get pulled into their own "Required Attachments"
  // panel; everything else (including any optional file fields) stays in Form Fields.
  const requiredFileFields = selectedFields.filter(f => isFileField(f) && f.required);
  const otherFields = selectedFields.filter(f => !(isFileField(f) && f.required));
  // A Checkbox field only becomes a choice group (checkboxes or radios) once
  // the reviewer has defined choices for it in Document Categories; otherwise
  // it stays the legacy single "Confirm" toggle.
  const hasCheckboxChoices = (f) => f.fieldType === "Checkbox" && Array.isArray(f.options) && f.options.length > 0;
  const isFieldComplete = (f) => {
    if (isFileField(f)) return wizardDocs[f.id]?.status === "done";
    const v = wizardFieldValues[f.id];
    if (f.fieldType === "Checkbox") {
      if (hasCheckboxChoices(f)) {
        return f.multiSelect === false
          ? (v !== undefined && v !== null && v !== "")
          : (Array.isArray(v) && v.length > 0);
      }
      return v === true;
    }
    return v !== undefined && v !== null && String(v).trim() !== "";
  };

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => { if (!token) navigate("/login"); }, []);
  useEffect(() => { fetchForms(); }, [page, search, activeTab]);

  // ── Socket.IO setup ───────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketIO(API, { auth: { token } });

    // Tell the server which role room to join
    socket.on("connect", () => {
      socket.emit("join_role_room", { role: user.role });
      // Also register user ID for direct notifications (approve/reject)
      socket.emit("register", user.id);
    });

    if (isProgramChair) {
      // Program chair: a new submission came in from faculty. This is now
      // just a Forms-page state refresh (queue + sidebar badge) — the
      // actual "New Form Submitted" notification/toast lives in
      // Notifications.jsx, which listens for the persisted "notification"
      // event (see notifyReviewersOfFormSubmission() in form.routes.js) so
      // it shows up consistently everywhere, not just while this page is open.
      socket.on("new_form_submission", () => {
        // Refresh the review queue
        fetchForms();
        // Increment the sidebar badge
        setPendingBadge(prev => prev + 1);
      });
    } else {
      // Faculty: their form's status changed. Just refresh the list here —
      // the "Your form has been approved/rejected/needs revision" toast now
      // lives in Notifications.jsx, driven by the persisted form_approved /
      // form_rejected / form_revision notifications (see notify() calls in
      // form.routes.js), so it's shown consistently regardless of which
      // page is open, not just while Forms.jsx happens to be mounted.
      socket.on("form_status_update", () => {
        fetchForms();
      });
    }

    return () => socket.disconnect();
  }, [isProgramChair, token]);

  // ── Clear badge when program chair opens the review tab ──────────────────
  useEffect(() => {
    if (isProgramChair && activeTab === "review") {
      setPendingBadge(0);
    }
  }, [activeTab, isProgramChair]);

  // ── Load Document Categories from the database ───────────────────────────
  // Same /api/categories endpoint DocumentCategories.jsx uses. Only "Active"
  // categories whose Type is "Form" are surfaced here — "Document" type
  // categories (e.g. Masterlist of Section) aren't things faculty submit
  // as a form, so they're excluded.
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch(`${API}/api/categories`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      // Keep the full category objects (not just names) — each Form-type
      // category carries a `formFields` array (name, fieldType, required)
      // defined in Document Categories, which drives Step 2 of the wizard.
      const formCategories = (data.categories || [])
        .filter(c => c.status === "Active" && c.type === "Form");
      setCategories(formCategories);
      // If the currently selected form type no longer exists / isn't a Form
      // type, reset the field back to the placeholder rather than guessing.
      setWizardFormType(prev => (formCategories.some(c => c.name === prev) ? prev : ""));
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const statusParam = isProgramChair ? "&status=Pending" : "";
      const params = new URLSearchParams({ page, q: search, per_page: 5 }).toString();
      const endpoint = isProgramChair ? `/api/forms/all?${params}${statusParam}` : `/api/forms/my?${params}`;
      const res = await fetch(`${API}${endpoint}`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setForms(data.forms || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejection_rate: "0%" });
      setTotalPages(data.total_pages || 1);
    } catch { setForms([]); } finally { setLoading(false); }
  };

  const fetchAllForms = async () => {
    setAllFormsLoading(true);
    try {
      const statusParam = allFormsStatusFilter !== "All" ? `&status=${allFormsStatusFilter}` : "";
      const params = new URLSearchParams({ page: allFormsPage, q: search, per_page: 5 }).toString();
      const res = await fetch(`${API}/api/forms/all?${params}${statusParam}`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setAllForms(data.forms || []);
      setAllFormsTotalPages(data.total_pages || 1);
    } catch { setAllForms([]); } finally { setAllFormsLoading(false); }
  };

  useEffect(() => {
    if (isProgramChair && activeTab === "review") fetchAllForms();
  }, [isProgramChair, activeTab, allFormsPage, allFormsStatusFilter, search]);

  // ── Wizard: per-slot document upload ──────────────────────────────────────
  const simulateSlotUpload = (slotId) => {
    let progress = 0;
    const tick = () => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        setWizardDocs(prev => ({ ...prev, [slotId]: { ...prev[slotId], progress: 100, status: "done" } }));
        return;
      }
      setWizardDocs(prev => ({ ...prev, [slotId]: { ...prev[slotId], progress: Math.round(progress) } }));
      setTimeout(tick, 200 + Math.random() * 200);
    };
    setTimeout(tick, 150);
  };

  const handleWizardFile = (fieldId, file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { alert("Only PDF, JPG, or PNG files are allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File exceeds 5MB limit."); return; }
    setWizardDocs(prev => ({ ...prev, [fieldId]: { file, progress: 0, status: "uploading" } }));
    simulateSlotUpload(fieldId);
  };

  const handleWizardDrop = (fieldId, e) => {
    e.preventDefault(); setWizardDragOver(null);
    handleWizardFile(fieldId, e.dataTransfer.files[0]);
  };

  const removeWizardDoc = (fieldId) => {
    setWizardDocs(prev => { const next = { ...prev }; delete next[fieldId]; return next; });
  };

  const handleWizardFieldChange = (fieldId, value) => {
    setWizardFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const buildWizardFormData = (status) => {
    const fd = new FormData();
    fd.append("category", wizardFormType);
    fd.append("student_id", wizardInfo.student_number);
    fd.append("full_name", wizardInfo.full_name);
    fd.append("semester", wizardInfo.semester);
    fd.append("academic_year", wizardInfo.academic_year);
    fd.append("remarks", wizardInfo.remarks);
    fd.append("filing_date", new Date().toISOString().split("T")[0]);
    if (status) fd.append("status", status);
    const fieldSummary = {};
    selectedFields.forEach(f => {
      const key = `field_${f.id}`;
      if (isFileField(f)) {
        const doc = wizardDocs[f.id];
        if (doc?.file) fd.append(key, doc.file);
        fieldSummary[f.name] = doc?.file?.name || null;
      } else {
        const value = wizardFieldValues[f.id];
        if (hasCheckboxChoices(f) && f.multiSelect !== false) {
          // Multi-select checkbox group — value is an array of chosen options
          const arr = Array.isArray(value) ? value : [];
          if (arr.length) fd.append(key, JSON.stringify(arr));
          fieldSummary[f.name] = arr.length ? arr.join(", ") : null;
        } else if (hasCheckboxChoices(f)) {
          // Single-select checkbox group (radio-style) — value is one option string
          if (value !== undefined && value !== null && value !== "") fd.append(key, value);
          fieldSummary[f.name] = value || null;
        } else {
          if (value !== undefined && value !== null && value !== "") fd.append(key, value);
          fieldSummary[f.name] = f.fieldType === "Checkbox" ? (value === true ? "Yes" : "No") : (value ?? null);
        }
      }
    });
    fd.append("field_values", JSON.stringify(fieldSummary));
    // Keep a primary "file" field for backward compatibility with the
    // existing /api/forms/submit and /api/forms/draft endpoints, which
    // currently expect one file.
    const primaryDoc = Object.values(wizardDocs)[0]?.file;
    if (primaryDoc) fd.append("file", primaryDoc);
    return fd;
  };

  const resetWizard = () => {
    setWizardFormType("");
    setWizardDocs({});
    setWizardFieldValues({});
    setWizardInfo({ student_number: "", full_name: "", semester: "1st Semester", academic_year: ACADEMIC_YEARS[1], remarks: "" });
  };

  const handleWizardSubmit = async () => {
    if (!wizardFormType) { alert("Please select a Form Type."); return; }
    const missingRequired = selectedFields.filter(f => f.required && !isFieldComplete(f));
    if (missingRequired.length > 0) { alert(`Please complete: ${missingRequired.map(f => f.name).join(", ")}`); return; }
    if (Object.values(wizardDocs).some(d => d.status === "uploading")) { alert("Please wait for all documents to finish uploading."); return; }

    setWizardSubmitting(true);
    try {
      const res = await fetch(`${API}/api/forms/submit`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: buildWizardFormData() });
      if (res.ok) {
        setWizardSuccess(true);
        resetWizard();
        fetchForms();
        setTimeout(() => setWizardSuccess(false), 4000);
      } else {
        // The server responded, but with an error — try to read its message
        // as JSON first, then fall back to plain text so we don't hide the
        // real cause behind a generic alert.
        let message = `Submission failed (${res.status}).`;
        try {
          const d = await res.clone().json();
          message = d.message || d.error || message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = text.slice(0, 300);
          } catch { /* ignore */ }
        }
        console.error("Form submit failed:", res.status, message);
        alert(message);
      }
    } catch (err) {
      // This branch only runs on genuine network/CORS failures — the request
      // never got a response at all.
      console.error("Form submit network error:", err);
      alert("Could not reach the server. Please check your connection and try again.");
    } finally { setWizardSubmitting(false); }
  };

  const handleWizardSaveDraft = async () => {
    setWizardSubmitting(true);
    try {
      const res = await fetch(`${API}/api/forms/draft`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: buildWizardFormData("Draft") });
      if (!res.ok) {
        let message = `Could not save draft (${res.status}).`;
        try {
          const d = await res.clone().json();
          message = d.message || d.error || message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = text.slice(0, 300);
          } catch { /* ignore */ }
        }
        console.error("Draft save failed:", res.status, message);
        alert(message);
        return;
      }
      addToast("Draft saved successfully.", "success");
      fetchForms();
    } catch (err) {
      console.error("Draft save network error:", err);
      alert("Could not reach the server. Please check your connection and try again.");
    } finally { setWizardSubmitting(false); }
  };

  const handleWizardCancel = () => {
    if (Object.keys(wizardDocs).length > 0 || Object.keys(wizardFieldValues).length > 0 || wizardFormType || wizardInfo.remarks) {
      if (!window.confirm("Discard this form? Your uploaded documents and entered details will be lost.")) return;
    }
    resetWizard();
  };

  const handleReview = (form) => { setSelectedForm(form); setReviewNote(""); setReviewModal(true); };

  const handleApprove = async () => {
    if (!selectedForm) return;
    await fetch(`${API}/api/forms/${selectedForm.id}/approve`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ note: reviewNote }) });
    setReviewModal(false);
    fetchForms();
    fetchAllForms();
  };

  const handleReject = async () => {
    if (!selectedForm) return;
    if (!reviewNote.trim()) { alert("Please provide a reason for rejection."); return; }
    await fetch(`${API}/api/forms/${selectedForm.id}/reject`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ note: reviewNote }) });
    setReviewModal(false);
    fetchForms();
    fetchAllForms();
  };

  const handleRevise = async () => {
    if (!selectedForm) return;
    if (!reviewNote.trim()) { alert("Please provide revision instructions for the faculty."); return; }
    await fetch(`${API}/api/forms/${selectedForm.id}/revise`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ note: reviewNote }),
    });
    setReviewModal(false);
    fetchForms();
    fetchAllForms();
  };

  const handleAddTemplate = async () => {
    if (!templateData.name || !templateData.category) { alert("Name and category are required."); return; }
    await fetch(`${API}/api/forms/templates`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify(templateData) });
    setAddModal(false);
    setTemplateData({ name: "", description: "", category: "", required_fields: "" });
    alert("Form template added successfully.");
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };
  const canViewAdminNav = ["admin", "program_chair"].includes(user.role);

  // ── Submission Summary (derived from wizard state) ────────────────────────
  const wizardRequiredCount = selectedFields.filter(f => f.required).length;
  const wizardUploadedCount = selectedFields.filter(f => f.required && isFieldComplete(f)).length;
  const wizardUploadingCount = Object.values(wizardDocs).filter(d => d.status === "uploading").length;
  const wizardMissingCount = selectedFields.filter(f => f.required && !isFieldComplete(f)).length;
  const wizardAttachmentsCompleteCount = requiredFileFields.filter(f => isFieldComplete(f)).length;
  let wizardStatusLabel, wizardStatusColor;
  if (wizardMissingCount > 0) {
    wizardStatusLabel = wizardUploadingCount > 0 ? "Incomplete / Uploading" : "Incomplete";
    wizardStatusColor = "#dc2626";
  } else if (wizardUploadingCount > 0) {
    wizardStatusLabel = "Uploading";
    wizardStatusColor = "#d97706";
  } else if (!wizardFormType) {
    wizardStatusLabel = "Incomplete";
    wizardStatusColor = "#dc2626";
  } else {
    wizardStatusLabel = "Ready to Submit";
    wizardStatusColor = "#059669";
  }

  // ── Renders a single dynamic field row (shared between "Form Fields" and "Required Attachments") ──
  const renderFieldRow = (f, idx) => {
    const isFile = isFileField(f);
    const isTextArea = f.fieldType === "Text Area";
    const isChoiceCheckbox = hasCheckboxChoices(f);
    const isMultiCheckbox = isChoiceCheckbox && f.multiSelect !== false;
    const stacked = isTextArea || isChoiceCheckbox;
    const doc = isFile ? wizardDocs[f.id] : null;
    const isDragOver = wizardDragOver === f.id;
    const val = wizardFieldValues[f.id] ?? (isMultiCheckbox ? [] : "");
    const controlStyle = { ...fieldBase, padding: "8px 12px", borderRadius: 7, fontSize: 12.5, color: "#111" };
    const hint = isChoiceCheckbox
      ? (isMultiCheckbox ? "Select all that apply" : "Select one option")
      : ({
          "File Upload": "PDF, JPG, or PNG (Max 5MB)",
          "Text Input": "Short text answer",
          "Text Area": "Long-form text answer",
          "Date": "Select a date",
          "Number": "Numeric value",
          "Dropdown": "Choose from the options",
          "Checkbox": "Check to confirm",
        }[f.fieldType] || f.fieldType);

    return (
      <div key={f.id}
        style={{ border: `1px solid ${isDragOver ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px", background: isDragOver ? "#faf5ff" : "#fafafa", boxShadow: isDragOver ? "0 0 0 3px rgba(124,58,237,0.12)" : "none", transition: "border-color .15s, box-shadow .15s" }}
        onDragOver={isFile ? (e => { e.preventDefault(); setWizardDragOver(f.id); }) : undefined}
        onDragLeave={isFile ? (() => setWizardDragOver(null)) : undefined}
        onDrop={isFile ? (e => handleWizardDrop(f.id, e)) : undefined}>
        <div style={{ display: "flex", flexDirection: stacked ? "column" : "row", justifyContent: "space-between", alignItems: stacked ? "stretch" : "flex-start", gap: stacked ? 8 : 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, background: "#e5e7eb", color: "#6b7280",
                fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{idx + 1}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{f.name}</span>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "1px 8px", borderRadius: 20, textTransform: "uppercase",
                background: f.required ? "#ede9fe" : "#f3f4f6", color: f.required ? "#5b21b6" : "#6b7280",
              }}>{f.required ? "Required" : "Optional"}</span>
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, marginLeft: 26 }}>{hint}</div>
          </div>

          {/* ── File Upload ── */}
          {isFile && (
            <>
              <input ref={el => (wizardFileRefs.current[f.id] = el)} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                onChange={e => handleWizardFile(f.id, e.target.files[0])} />
              {doc ? (
                doc.status === "done" ? (
                  // ── Attached file card (matches mockup's file-item styling) ──
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flex: 1, minWidth: 220, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      {(() => { const meta = fileTypeMeta(doc.file?.name); return (
                        <div style={{ width: 34, height: 34, borderRadius: 7, background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">{meta.icon}</svg>
                        </div>
                      ); })()}
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                        <span style={{ fontSize: 11.5, color: "#111", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{doc.file?.name}</span>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>{formatFileSize(doc.file?.size)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeWizardDoc(f.id)} title="Remove file"
                      style={{ background: "transparent", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", cursor: "pointer", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#ba1a1a"; e.currentTarget.style.background = "#ffdad6"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}>
                      <Icon.Trash size={15} />
                    </button>
                  </div>
                ) : (
                  // ── Uploading progress ──
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 180, justifyContent: "flex-end" }}>
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 3 }}>
                        <span>Uploading...</span>
                        <span>{doc.progress}%</span>
                      </div>
                      <div style={{ height: 5, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${doc.progress}%`, background: "#7c3aed", borderRadius: 20, transition: "width 0.2s" }} />
                      </div>
                    </div>
                    <button onClick={() => removeWizardDoc(f.id)}
                      style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", whiteSpace: "nowrap" }}>
                      Cancel
                    </button>
                  </div>
                )
              ) : (
                // ── Empty dropzone (matches mockup's "Drag & drop files here" style) ──
                <div onClick={() => wizardFileRefs.current[f.id]?.click()}
                  style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 8, border: `1.5px dashed ${isDragOver ? "#7c3aed" : "#cbc3d7"}`, background: isDragOver ? "#faf5ff" : "#fcf8ff", cursor: "pointer", transition: "border-color .15s, background .15s" }}
                  onMouseEnter={e => { if (!isDragOver) e.currentTarget.style.borderColor = "#7c3aed"; }}
                  onMouseLeave={e => { if (!isDragOver) e.currentTarget.style.borderColor = "#cbc3d7"; }}>
                  <Icon.CloudUpload size={20} />
                  <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>Drag &amp; drop or click to browse</span>
                  <button onClick={e => { e.stopPropagation(); wizardFileRefs.current[f.id]?.click(); }}
                    style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", whiteSpace: "nowrap" }}>
                    Browse
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Text Input ── */}
          {f.fieldType === "Text Input" && (
            <input type="text" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus} onBlur={onFieldBlur}
              placeholder={`Enter ${f.name.toLowerCase()}`} style={{ ...controlStyle, width: 220 }} />
          )}

          {/* ── Number ── */}
          {f.fieldType === "Number" && (
            <input type="number" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus} onBlur={onFieldBlur}
              placeholder="0" style={{ ...controlStyle, width: 140 }} />
          )}

          {/* ── Date ── */}
          {f.fieldType === "Date" && (
            <input type="date" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus} onBlur={onFieldBlur}
              style={{ ...controlStyle, width: 160 }} />
          )}

          {/* ── Dropdown (falls back to free text if the template has no options configured) ── */}
          {f.fieldType === "Dropdown" && (
            Array.isArray(f.options) && f.options.length > 0 ? (
              <div style={{ position: "relative", width: 180 }}>
                <select value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
                  onFocus={onFieldFocus} onBlur={onFieldBlur}
                  style={{ ...controlStyle, width: "100%", padding: "8px 28px 8px 12px", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
                  <option value="" disabled>Select…</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <Icon.Chevron size={14} />
                </span>
              </div>
            ) : (
              <input type="text" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
                onFocus={onFieldFocus} onBlur={onFieldBlur}
                placeholder="Enter value" style={{ ...controlStyle, width: 220 }} />
            )
          )}

          {/* ── Checkbox ── */}
          {f.fieldType === "Checkbox" && (
            isChoiceCheckbox ? (
              isMultiCheckbox ? (
                // Multiple selection — checkbox group, value is an array of chosen options
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.options.map(opt => {
                    const arr = Array.isArray(val) ? val : [];
                    const checked = arr.includes(opt);
                    return (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => {
                            const next = e.target.checked ? [...arr, opt] : arr.filter(o => o !== opt);
                            handleWizardFieldChange(f.id, next);
                          }}
                          style={{ width: 15, height: 15, accentColor: "#7c3aed" }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              ) : (
                // Single selection — radio group, value is one option string
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.options.map(opt => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={`field-${f.id}`}
                        checked={val === opt}
                        onChange={() => handleWizardFieldChange(f.id, opt)}
                        style={{ width: 15, height: 15, accentColor: "#7c3aed" }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )
            ) : (
              // Legacy Checkbox field with no choices configured — plain confirm toggle
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#374151", cursor: "pointer" }}>
                <input type="checkbox" checked={val === true} onChange={e => handleWizardFieldChange(f.id, e.target.checked)}
                  style={{ width: 15, height: 15, accentColor: "#7c3aed" }} />
                Confirm
              </label>
            )
          )}

          {/* ── Text Area (full width, stacked below the label) ── */}
          {isTextArea && (
            <textarea value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)} rows={3}
              onFocus={onFieldFocus} onBlur={onFieldBlur}
              placeholder={`Enter ${f.name.toLowerCase()}`}
              style={{ ...controlStyle, width: "100%", resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#181445", background: "#fcf8ff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        @keyframes slideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes fadeUp { from { transform: translate(-50%, -46%); opacity:0; } to { transform: translate(-50%, -50%); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>

      {/* Toast container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── SIDEBAR ── */}
      <Sidebar activePage="forms" />

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fcf8ff", minWidth: 0 }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search document ID, student name, category..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }} />
            </div>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ flex: 1, padding: 32, overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Page Header + Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div>
              {activeTab === "submit" && !isProgramChair && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>
                  <span>Dashboard</span>
                  <span style={{ fontSize: 13 }}>›</span>
                  <span>Forms</span>
                  <span style={{ fontSize: 13 }}>›</span>
                  <span style={{ color: "#7c3aed", fontWeight: 700 }}>Submit Form</span>
                </div>
              )}
              <h1 style={{ fontSize: 32, lineHeight: "40px", fontWeight: 600, color: "#181445", margin: 0, letterSpacing: "-0.025em" }}>
                {activeTab === "submit" && !isProgramChair ? "Submit Form" : "Forms Management"}
              </h1>
              <p style={{ fontSize: 14, color: "#494454", margin: "8px 0 0" }}>
                {activeTab === "submit" && !isProgramChair
                  ? "Complete the required information and submit your form for review."
                  : isProgramChair ? "Review, approve, and manage submitted student forms." : "Upload and submit student forms for program chair review."}
              </p>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, background: "#efebff", borderRadius: 10, padding: 3 }}>
              {!isProgramChair && (
                <button onClick={() => setActiveTab("submit")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "submit" ? "white" : "transparent", color: activeTab === "submit" ? "#6d3bd7" : "#7b7486", boxShadow: activeTab === "submit" ? "0 1px 4px rgba(109,59,215,0.1)" : "none" }}>
                  Submit Form
                </button>
              )}
              <button
                onClick={() => { setActiveTab(isProgramChair ? "review" : "history"); setPendingBadge(0); }}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "review" || activeTab === "history" ? "white" : "transparent", color: activeTab === "review" || activeTab === "history" ? "#6d3bd7" : "#7b7486", boxShadow: activeTab === "review" || activeTab === "history" ? "0 1px 4px rgba(109,59,215,0.1)" : "none", position: "relative" }}>
                {isProgramChair ? "Review Queue" : "My Submissions"}
                {/* Inline badge on the tab button */}
                {isProgramChair && pendingBadge > 0 && (
                  <span style={{ marginLeft: 6, background: "#dc2626", color: "white", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "1px 6px", animation: "pulse 1.5s infinite" }}>
                    {pendingBadge}
                  </span>
                )}
              </button>
              {isProgramChair && (
                <button onClick={() => setActiveTab("templates")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "templates" ? "white" : "transparent", color: activeTab === "templates" ? "#6d3bd7" : "#7b7486", boxShadow: activeTab === "templates" ? "0 1px 4px rgba(109,59,215,0.1)" : "none" }}>
                  Form Templates
                </button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24 }}>
            <StatCard label="Total Submissions" value={stats.total?.toLocaleString() || "1,284"} delta="+12% this week" deltaType="up"
              icon={<svg viewBox="0 0 16 16" fill="currentColor" width="20" height="20"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>} bg="#6b38d4" iconColor="#7b7486" />
            <StatCard label="Pending Review" value={stats.pending || "0"} delta="Action needed" deltaType="neutral"
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l2 2" strokeLinecap="round" /></svg>} bg="#5f5293" iconColor="#7b7486" />
            <StatCard label="Approved Forms" value={stats.approved?.toLocaleString() || "0"} delta="+8% this week" deltaType="up"
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><path d="M13 5l-7 7-3-3" strokeLinecap="round" /></svg>} bg="#712ae2" iconColor="#7b7486" />
            <StatCard label="Rejection Rate" value={stats.rejection_rate || "0%"} delta="Requires attention" deltaType="down" danger
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20"><circle cx="8" cy="8" r="6" /><path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" /></svg>} bg="#ba1a1a" />
          </div>

          {/* ── FACULTY: SUBMIT TAB (Submit New Form wizard) ── */}
          {activeTab === "submit" && !isProgramChair && (
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 24, alignItems: "start" }}>
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Submit New Form</h2>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Select a form type and upload the required documents to begin your request.</p>
              </div>

              {wizardSuccess && (
                <div style={{ marginBottom: 20, background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon.Check /> Form submitted! The program chair has been notified in real time.
                </div>
              )}

              {/* ── STEP 1: FORM TYPE SELECTION ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 12px rgba(124,58,237,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f3f4f6", paddingBottom: 12, marginBottom: 16 }}>
                  <Icon.InfoCircle />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Form Type Selection</h3>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Choose the specific form you wish to file from the list below.</p>

                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Form Type</label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={wizardFormType}
                        onChange={e => {
                          setWizardFormType(e.target.value);
                          // Switching form types swaps the whole field set, so
                          // clear out any values/files entered for the previous type.
                          setWizardDocs({});
                          setWizardFieldValues({});
                        }}
                        onFocus={onFieldFocus}
                        onBlur={onFieldBlur}
                        disabled={categoriesLoading || categories.length === 0}
                        style={{ ...fieldBase, width: "100%", padding: "10px 34px 10px 12px", borderRadius: 8, fontSize: 13, color: wizardFormType ? "#111" : "#9ca3af", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
                        <option value="" disabled>
                          {categoriesLoading ? "Loading…" : categories.length === 0 ? "No form types found" : "Select a form type..."}
                        </option>
                        {categories.map(c => <option key={c.id} value={c.name} style={{ color: "#111" }}>{c.name}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                        <Icon.Chevron />
                      </span>
                    </div>
                    {selectedCategory?.description && (
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>{selectedCategory.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STEP 2: FORM FIELDS (dynamic — driven by the selected template) ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 12px rgba(124,58,237,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f3f4f6", paddingBottom: 12, marginBottom: 16 }}>
                  <Icon.DynamicForm />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Form Fields</h3>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>2</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 18px" }}>
                      {selectedCategory ? "Fill in the fields required for this form type." : "Select a form type in Step 1 to load its required fields."}
                    </p>

                    {!selectedCategory && (
                      <div style={{ padding: "24px 18px", borderRadius: 10, background: "#fafafa", border: "1px dashed #e5e7eb", textAlign: "center" }}>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>No form type selected yet.</p>
                      </div>
                    )}

                    {selectedCategory && selectedFields.length === 0 && (
                      <div style={{ padding: "24px 18px", borderRadius: 10, background: "#fafafa", border: "1px dashed #e5e7eb", textAlign: "center" }}>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>This form type has no fields defined yet. Add some in Document Categories.</p>
                      </div>
                    )}

                    {selectedCategory && otherFields.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {otherFields.map((f, idx) => renderFieldRow(f, idx))}
                      </div>
                    )}

                    {selectedCategory && selectedFields.length > 0 && otherFields.length === 0 && (
                      <div style={{ padding: "24px 18px", borderRadius: 10, background: "#fafafa", border: "1px dashed #e5e7eb", textAlign: "center" }}>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>All fields for this form type are required attachments — see the panel below.</p>
                      </div>
                    )}

                    {selectedCategory && selectedFields.length > 0 && (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, background: "#faf5ff", borderRadius: 8, padding: "10px 12px" }}>
                        <Icon.Tip />
                        <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                          These fields are pulled from the <strong>{selectedCategory.name}</strong> template in Document Categories — edit them there to change what's asked for here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STEP 3: REQUIRED ATTACHMENTS (dedicated panel for mandatory File Upload fields) ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 12px rgba(124,58,237,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f3f4f6", paddingBottom: 12, marginBottom: 16 }}>
                  <Icon.AttachFile />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Required Attachments</h3>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>3</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 18px" }}>
                      {selectedCategory ? "These documents are mandatory — the form can't be submitted until each one is attached." : "Select a form type in Step 1 to see which documents are required."}
                    </p>

                    {!selectedCategory && (
                      <div style={{ padding: "24px 18px", borderRadius: 10, background: "#fafafa", border: "1px dashed #e5e7eb", textAlign: "center" }}>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>No form type selected yet.</p>
                      </div>
                    )}

                    {selectedCategory && requiredFileFields.length === 0 && (
                      <div style={{ padding: "24px 18px", borderRadius: 10, background: "#fafafa", border: "1px dashed #e5e7eb", textAlign: "center" }}>
                        <p style={{ fontSize: 12.5, color: "#9ca3af" }}>This form type has no required attachments.</p>
                      </div>
                    )}

                    {selectedCategory && requiredFileFields.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {requiredFileFields.map((f, idx) => renderFieldRow(f, idx))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STEP 4: ADDITIONAL INFORMATION ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 4px 12px rgba(124,58,237,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #f3f4f6", paddingBottom: 12, marginBottom: 16 }}>
                  <Icon.Notes />
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Additional Information</h3>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>4</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Provide any extra context for the program chair.</p>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Remarks / Special Notes</label>
                      <textarea value={wizardInfo.remarks} onChange={e => setWizardInfo(p => ({ ...p, remarks: e.target.value }))} rows={3}
                        onFocus={onFieldFocus} onBlur={onFieldBlur}
                        placeholder="Enter any additional context for the program chair..."
                        style={{ ...fieldBase, width: "100%", padding: "8px 12px", borderRadius: 7, fontSize: 13, color: "#111", resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: SUBMISSION SUMMARY ── */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 16, padding: 20, boxShadow: "0 4px 12px rgba(124,58,237,0.05)" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>Submission Summary</h3>
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 14px" }}>Step 4: Review details</p>

                <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Form Type</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: wizardFormType ? "#7c3aed" : "#9ca3af" }}>{wizardFormType || "Not selected"}</span>
                  </div>
                  {requiredFileFields.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ fontSize: 11, color: "#6b7280" }}>Attachments</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: wizardAttachmentsCompleteCount === requiredFileFields.length ? "#059669" : "#111" }}>
                        {wizardAttachmentsCompleteCount} of {requiredFileFields.length} Files
                      </span>
                    </div>
                  )}
                  {[
                    ["Required Fields", wizardRequiredCount],
                    ["Completed", wizardUploadedCount],
                    ["Uploading", wizardUploadingCount],
                    ["Missing", wizardMissingCount],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: 12 }}>
                      <span style={{ color: "#6b7280" }}>{label}</span>
                      <span style={{ fontWeight: 700, color: label === "Missing" && val > 0 ? "#dc2626" : "#111" }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Status</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: wizardStatusColor, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: wizardStatusColor, display: "inline-block" }} />
                      {wizardStatusLabel}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button onClick={handleWizardSubmit} disabled={wizardSubmitting}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px", background: wizardSubmitting ? "#a78bfa" : "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: wizardSubmitting ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(124,58,237,0.25)" }}>
                    <Icon.Send /> {wizardSubmitting ? "Submitting..." : "Submit Form"}
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleWizardSaveDraft} disabled={wizardSubmitting}
                      style={{ flex: 1, padding: "9px", background: "transparent", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: wizardSubmitting ? "not-allowed" : "pointer" }}>
                      Save as Draft
                    </button>
                    <button onClick={handleWizardCancel}
                      style={{ flex: 1, padding: "9px", background: "transparent", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fee2e2"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "transparent"; }}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Icon.Info />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Need Help?</div>
                  <div style={{ fontSize: 11, color: "#7c3aed", cursor: "pointer" }}>Contact Registrar Support</div>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* ── REVIEW QUEUE (Program Chair) / MY SUBMISSIONS (Faculty) ── */}
          {(activeTab === "history" || activeTab === "review") && (
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
            <div style={{ background: "white", border: "1px solid #cbc3d7", borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 12px rgba(139,92,246,0.05)" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #cbc3d7", background: "#fcf8ff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#181445", margin: "0 0 2px" }}>
                        {isProgramChair ? "Review Queue" : "Document Repository"}
                      </h3>
                      {isProgramChair && stats.pending > 0 && (
                        <span style={{ background: "#fef9c3", color: "#854d0e", border: "1px solid #fef08a", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                          {stats.pending} pending
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: "#7b7486", margin: 0 }}>
                      {isProgramChair
                        ? "Pending forms from faculty — review, approve, or reject below."
                        : "Track the status of all your submitted forms."}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #cbc3d7", borderRadius: 10, background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#494454" }}>
                      <Icon.Filter /> More Filters
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #cbc3d7", borderRadius: 10, background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#494454" }}>
                      <Icon.ExportCSV /> Export
                    </button>
                  </div>
                </div>

                {/* Search (mirrors the mockup's filters bar) */}
                <div style={{ position: "relative", maxWidth: 420 }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7b7486" }}><Icon.Search /></span>
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search forms by ID, title, or submitter..."
                    style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #cbc3d7", borderRadius: 8, fontSize: 13, color: "#181445", background: "white", fontFamily: "'Inter', sans-serif" }} />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr style={{ background: "#f6f2ff" }}>
                    {["Document ID", "Name", "Category", "Filing Date", "Status", "Actions"].map((h, i) => (
                      <th key={h} style={{ padding: "16px 24px", textAlign: i === 5 ? "right" : "left", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbc3d7", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>Loading...</td></tr>
                  ) : forms.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: "center" }}>
                        <div style={{ color: "#aaa", fontSize: 13 }}>
                          {isProgramChair ? "No pending forms to review." : "No submissions yet."}
                        </div>
                      </td>
                    </tr>
                  ) : forms.map(row => (
                    <tr key={row.id} className="group" style={{ borderBottom: "1px solid #e3dfff", transition: "background .15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f6f2ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ color: "#7b7486", fontWeight: 500, fontSize: 12, fontFamily: "monospace" }}>{row.tracking_id || row.id}</span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={row.full_name || row.student_id || "?"} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 500, color: "#181445" }}>{row.full_name}</div>
                            {row.student_id && (
                              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, color: "#5f5293", background: "#e7deff", padding: "2px 6px", borderRadius: 999, marginTop: 2 }}>{row.student_id}</span>
                            )}
                            {isProgramChair && row.submitter_name && (
                              <div style={{ fontSize: 10, color: "#7b7486", marginTop: 2 }}>by {row.submitter_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454" }}>{row.category}</td>
                      <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454" }}>{row.filing_date}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <StatusBadge status={row.status} />
                        {!isProgramChair && row.status === "Revision" && row.review_note && (
                          <div style={{ marginTop: 5, background: "#fef9c3", border: "1px solid #fef08a", borderRadius: 6, padding: "5px 8px", maxWidth: 220 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: "#854d0e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                              📝 Revision Note
                            </div>
                            <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.4 }}>{row.review_note}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {isProgramChair && (row.status === "Pending" || row.status === "Reviewing") && (
                            <button onClick={() => handleReview(row)}
                              style={{ padding: "5px 12px", border: "1px solid #6d3bd7", borderRadius: 8, background: "#ede9fe", cursor: "pointer", color: "#6d3bd7", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
                              Review
                            </button>
                          )}
                          {!isProgramChair && row.status === "Revision" && (
                            <button onClick={() => { setResubmitForm(row); setResubmitFile(null); setResubmitModal(true); }}
                              style={{ padding: "5px 12px", border: "1px solid #d97706", borderRadius: 8, background: "#fef9c3", cursor: "pointer", color: "#854d0e", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
                              ↩ Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Pagination */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid #cbc3d7", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
                <span style={{ fontSize: 14, color: "#494454" }}>Showing page {page} of {totalPages} ({stats.pending || 0} pending)</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 10px", border: "1px solid #cbc3d7", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 12, color: "#494454" }}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: "1px solid #cbc3d7", borderRadius: 8, background: page === n ? "#6d3bd7" : "white", color: page === n ? "white" : "#494454", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 10px", border: "1px solid #cbc3d7", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 12, color: "#494454" }}>Next</button>
                </div>
              </div>
            </div>

            {/* ── EXISTING FORMS (Program Chair): full history, any status ── */}
            {isProgramChair && (
              <div style={{ background: "white", border: "1px solid #cbc3d7", borderRadius: 16, overflow: "hidden", marginTop: 20, boxShadow: "0 4px 12px rgba(139,92,246,0.05)" }}>
                <div style={{ padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #cbc3d7", background: "#fcf8ff", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#181445", margin: "0 0 2px" }}>Existing Forms</h3>
                    <p style={{ fontSize: 12, color: "#7b7486", margin: 0 }}>Every form ever submitted, regardless of status — approved, rejected, or in progress.</p>
                  </div>
                  <div style={{ position: "relative" }}>
                    <select value={allFormsStatusFilter} onChange={e => { setAllFormsStatusFilter(e.target.value); setAllFormsPage(1); }}
                      style={{ padding: "8px 30px 8px 12px", border: "1px solid #cbc3d7", borderRadius: 10, background: "white", fontSize: 12, fontWeight: 600, color: "#494454", cursor: "pointer", appearance: "none", WebkitAppearance: "none", MozAppearance: "none" }}>
                      {["All", "Pending", "Reviewing", "Approved", "Rejected", "Revision"].map(s => <option key={s} value={s}>{s === "All" ? "Status: All" : s}</option>)}
                    </select>
                    <span style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Icon.Chevron size={13} /></span>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#f6f2ff" }}>
                      {["Document ID", "Name", "Category", "Filing Date", "Status", "Submitted By"].map(h => (
                        <th key={h} style={{ padding: "16px 24px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#494454", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #cbc3d7", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFormsLoading ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#aaa", fontSize: 13 }}>Loading...</td></tr>
                    ) : allForms.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 48, textAlign: "center" }}>
                          <div style={{ color: "#aaa", fontSize: 13 }}>No forms found{allFormsStatusFilter !== "All" ? ` with status "${allFormsStatusFilter}"` : ""}.</div>
                        </td>
                      </tr>
                    ) : allForms.map(row => (
                      <tr key={row.id} style={{ borderBottom: "1px solid #e3dfff", transition: "background .15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f6f2ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        <td style={{ padding: "16px 24px" }}>
                          <span style={{ color: "#7b7486", fontWeight: 500, fontSize: 12, fontFamily: "monospace" }}>{row.tracking_id || row.id}</span>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <Avatar name={row.full_name || row.student_id || "?"} />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 500, color: "#181445" }}>{row.full_name}</div>
                              {row.student_id && (
                                <span style={{ display: "inline-block", fontSize: 10, fontWeight: 600, color: "#5f5293", background: "#e7deff", padding: "2px 6px", borderRadius: 999, marginTop: 2 }}>{row.student_id}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454" }}>{row.category}</td>
                        <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454" }}>{row.filing_date}</td>
                        <td style={{ padding: "16px 24px" }}><StatusBadge status={row.status} /></td>
                        <td style={{ padding: "16px 24px", fontSize: 14, color: "#494454" }}>{row.submitter_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* Pagination */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #cbc3d7", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white" }}>
                  <span style={{ fontSize: 14, color: "#494454" }}>Showing page {allFormsPage} of {allFormsTotalPages}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => setAllFormsPage(p => Math.max(1, p - 1))} disabled={allFormsPage === 1} style={{ padding: "4px 10px", border: "1px solid #cbc3d7", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 12, color: "#494454" }}>Previous</button>
                    {Array.from({ length: Math.min(allFormsTotalPages, 3) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setAllFormsPage(n)} style={{ width: 28, height: 28, border: "1px solid #cbc3d7", borderRadius: 8, background: allFormsPage === n ? "#6d3bd7" : "white", color: allFormsPage === n ? "white" : "#494454", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{n}</button>
                    ))}
                    <button onClick={() => setAllFormsPage(p => Math.min(allFormsTotalPages, p + 1))} disabled={allFormsPage === allFormsTotalPages} style={{ padding: "4px 10px", border: "1px solid #cbc3d7", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 12, color: "#494454" }}>Next</button>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* ── PROGRAM CHAIR: FORM TEMPLATES TAB ── */}
          {activeTab === "templates" && isProgramChair && (
            <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>Form Templates</h3>
                  <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Define which form types students and faculty can submit.</p>
                </div>
                <button onClick={() => navigate("/document-categories", { state: { openAddModal: true } })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Icon.Plus /> Add Form Type
                </button>
              </div>

              {categoriesLoading && (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>Loading categories…</p>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>No active document categories found. Create one in Document Categories first.</p>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {categories.map((cat) => (
                  <div key={cat.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", position: "relative" }}>
                    <button
                      onClick={() => navigate("/document-categories", { state: { editCategoryId: cat.id, editCategoryName: cat.name } })}
                      title="Edit this form template"
                      style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", background: "white", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer" }}
                    >
                      <Icon.Pencil /> Edit
                    </button>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <Icon.Forms />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4, paddingRight: 60 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>{cat.description || "Standard submission form"}</div>
                    <div style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Active</span>
                      <span style={{ background: "#f3f4f6", color: "#6b7280", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                        {(cat.formFields || []).length} field{(cat.formFields || []).length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: "center", fontSize: 11, color: "#ccc", paddingTop: 8 }}>
            © 2026 PATH Document Management System. All Rights Reserved.
          </div>
        </div>
      </div>

      {/* ── DOCUMENT REVIEW PANEL (full-page style, replaces the old centered popup) ── */}
      {reviewModal && selectedForm && (() => {
        const T = {
          primary: "#6b38d4",
          primaryFixed: "#e9ddff",
          secondary: "#712ae2",
          tertiary: "#5f5293",
          onSurface: "#181445",
          onSurfaceVariant: "#494454",
          surface: "#fcf8ff",
          surfaceContainerLowest: "#ffffff",
          surfaceContainerLow: "#f6f2ff",
          surfaceContainer: "#efebff",
          surfaceContainerHigh: "#e9e5ff",
          surfaceVariant: "#e3dfff",
          outline: "#7b7486",
          outlineVariant: "#cbc3d7",
          error: "#ba1a1a",
          errorContainer: "#ffdad6",
          inverseSurface: "#2d2a5b",
          inverseOnSurface: "#f3eeff",
        };

        const displayName = selectedForm.file_name || selectedForm.tracking_id || `Form #${selectedForm.id}`;
        const submitterName = selectedForm.submitter_name || selectedForm.full_name || "Unknown Submitter";
        const filingDateRaw = selectedForm.filing_date || selectedForm.date || selectedForm.created_at;
        const filingDateLabel = filingDateRaw
          ? new Date(filingDateRaw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "—";

        // Dynamic "Submitted Fields" from Step 2 of the wizard
        let dynFields = null;
        try {
          dynFields = typeof selectedForm.field_values === "string" ? JSON.parse(selectedForm.field_values) : selectedForm.field_values;
        } catch { dynFields = null; }
        let dynEntries = dynFields ? Object.entries(dynFields) : [];
        const tmpl = categories.find(c => c.name === selectedForm.category);
        const fileFieldNames = new Set((tmpl?.formFields || []).filter(isFileField).map(f => f.name));
        dynEntries = [
          ...dynEntries.filter(([label]) => !fileFieldNames.has(label)),
          ...dynEntries.filter(([label]) => fileFieldNames.has(label)),
        ];

        // Derived audit trail (built from the data actually available on the form)
        const auditSteps = [
          { label: "Submitted", by: `by ${submitterName}`, when: filingDateLabel, active: true },
        ];
        auditSteps.push({ label: "Assigned", by: "to Program Chair (You)", when: filingDateLabel, active: true });
        if (selectedForm.status === "Revision") {
          auditSteps.push({ label: "Revision Requested", by: selectedForm.review_note ? "Feedback provided" : "Awaiting resubmission", when: "—", active: true });
        } else if (selectedForm.status === "Approved") {
          auditSteps.push({ label: "Approved", by: "by Program Chair", when: "—", active: true });
        } else if (selectedForm.status === "Rejected") {
          auditSteps.push({ label: "Rejected", by: "by Program Chair", when: "—", active: true });
        } else {
          auditSteps.push({ label: "Under Review", by: "by Program Chair (You)", when: "—", active: true });
        }

        const statusColors = {
          Pending: { bg: "#fef9c3", color: "#854d0e" },
          Reviewing: { bg: "#ede9fe", color: "#5b21b6" },
          Approved: { bg: "#d1fae5", color: "#065f46" },
          Rejected: { bg: "#fee2e2", color: "#991b1b" },
          Revision: { bg: "#fee2e2", color: "#991b1b" },
        };
        const sc = statusColors[selectedForm.status] || statusColors.Pending;

        const url = selectedForm.file_url ? resolveFileUrl(selectedForm.file_url) : null;
        const ext = (selectedForm.file_name || selectedForm.file_url || "").split(".").pop().toLowerCase();
        const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
        const isPdf = ext === "pdf";

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: T.surface, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif", animation: "fadeUp 0.15s ease" }}>

            {/* ── Top bar ── */}
            <header style={{ background: T.surfaceContainerLowest, borderBottom: `1px solid ${T.surfaceVariant}`, position: "sticky", top: 0, zIndex: 10, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button onClick={() => setReviewModal(false)} title="Back to Review Queue"
                  style={{ background: "none", border: "none", cursor: "pointer", color: T.onSurfaceVariant, fontSize: 20, display: "flex", alignItems: "center", padding: 4 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.primary}
                  onMouseLeave={e => e.currentTarget.style.color = T.onSurfaceVariant}>
                  ←
                </button>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 1 }}>
                    Submissions / Documents
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 700, color: T.onSurface, margin: 0 }}>{displayName}</h1>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700 }}>
                      🕓 {selectedForm.status || "Pending"} Review
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {url && (
                  <a href={url} download={selectedForm.file_name} target="_blank" rel="noreferrer"
                    style={{ padding: "8px 16px", border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.onSurface, textDecoration: "none" }}>
                    Download Copy
                  </a>
                )}
                <button onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast("Link copied to clipboard.", "info"); }}
                  style={{ padding: "8px 16px", border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.onSurface, background: "white", cursor: "pointer" }}>
                  Share
                </button>
                <button onClick={() => setReviewModal(false)}
                  style={{ padding: "8px 12px", border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 16, color: T.onSurfaceVariant, background: "white", cursor: "pointer", lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </header>

            {/* ── Main ── */}
            <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* LEFT: document preview + audit trail */}
              <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", borderRight: `1px solid ${T.surfaceVariant}` }}>

                {/* Document preview card */}
                <div style={{ flex: 1, minHeight: 500, background: "#1e1e2e", border: `1px solid ${T.surfaceVariant}`, borderRadius: 12, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "stretch", justifyContent: "center", overflow: "hidden" }}>
                    {url ? (
                      isPdf ? (
                        <iframe src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`} title="Form Preview" style={{ width: "100%", height: "100%", border: "none" }} />
                      ) : isImg ? (
                        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
                          <img src={url} alt="Form Preview" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", objectFit: "contain" }} />
                        </div>
                      ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#888" }}>
                          <Icon.File />
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>{selectedForm.file_name || "Attached file"}</div>
                          <div style={{ fontSize: 11, color: "#666" }}>Preview not available for this file type.</div>
                        </div>
                      )
                    ) : (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#555" }}>
                        <Icon.File />
                        <div style={{ fontSize: 13 }}>No file attached</div>
                      </div>
                    )}
                  </div>

                  {/* Floating toolbar */}
                  {url && (
                    <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(45,42,91,0.9)", backdropFilter: "blur(8px)", color: T.inverseOnSurface, borderRadius: 999, padding: "8px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                      <a href={url} target="_blank" rel="noreferrer" download={selectedForm.file_name}
                        title="Download" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>⬇</a>
                      <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.25)" }} />
                      <button onClick={() => window.open(url, "_blank")?.print?.()} title="Print"
                        style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 14 }}>🖶</button>
                      <a href={url} target="_blank" rel="noreferrer" title="Open in new tab"
                        style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>↗</a>
                    </div>
                  )}
                </div>

                {/* Document audit trail */}
                <div style={{ background: T.surfaceContainerLowest, border: `1px solid ${T.surfaceVariant}`, borderRadius: 12, padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: T.onSurface, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    🕘 Document Audit Trail
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
                    {auditSteps.map((step, i) => (
                      <div key={i} style={{ flex: 1, minWidth: 180, borderLeft: `2px solid ${step.active ? T.primary : T.surfaceVariant}`, paddingLeft: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.onSurface, marginBottom: 3 }}>{step.label}</div>
                        <div style={{ fontSize: 13, color: T.onSurfaceVariant, marginBottom: 3 }}>{step.by}</div>
                        <div style={{ fontSize: 11, color: T.outline }}>{step.when}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: metadata + review action */}
              <aside style={{ width: 400, flexShrink: 0, background: T.surfaceContainerLowest, padding: 24, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

                {/* Metadata */}
                <section>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: "0 0 12px" }}>Metadata</h2>
                  <div style={{ background: T.surfaceContainerLow, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Submitter</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={submitterName} />
                        <span style={{ fontSize: 13, color: T.onSurface, fontWeight: 600 }}>{submitterName}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Submission Date</div>
                        <div style={{ fontSize: 13, color: T.onSurface }}>{filingDateLabel}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Category</div>
                        <div style={{ fontSize: 13, color: T.onSurface }}>{selectedForm.category || "—"}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Status</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sc.color, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.color, display: "inline-block" }} />
                        {selectedForm.status || "Pending"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Submitted fields (from Step 2 of the wizard) */}
                {dynEntries.length > 0 && (
                  <section>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: "0 0 12px" }}>Submitted Fields</h2>
                    <div style={{ background: T.surfaceContainerLow, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                      {dynEntries.map(([label, value]) => {
                        const display = value === null || value === "" ? "—" : String(value);
                        return (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 8, borderBottom: `1px solid ${T.surfaceVariant}` }}>
                            <span style={{ fontSize: 11, color: T.onSurfaceVariant, fontWeight: 600, flexShrink: 0 }}>{label}</span>
                            <span style={{ fontSize: 12, color: T.onSurface, fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Previous review note, if any */}
                {selectedForm.review_note && (
                  <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Previous Review Note</div>
                    <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{selectedForm.review_note}</div>
                  </div>
                )}

                <div style={{ height: 1, background: T.surfaceVariant, width: "100%" }} />

                {/* Review action */}
                <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: 0 }}>Review Action</h2>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.onSurface, marginBottom: 6, display: "block" }}>
                      Feedback &amp; Comments <span style={{ color: T.error }}>*</span>
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={e => setReviewNote(e.target.value)}
                      placeholder="Required for rejections and revisions. Detail what needs to be changed or why the document was approved with conditions..."
                      rows={5}
                      style={{ width: "100%", background: "white", border: `1px solid ${T.outlineVariant}`, borderRadius: 10, padding: 12, fontSize: 13, color: T.onSurface, resize: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                      onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primaryFixed}`; }}
                      onBlur={e => { e.target.style.borderColor = T.outlineVariant; e.target.style.boxShadow = "none"; }}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <button onClick={handleApprove}
                      style={{ width: "100%", background: T.inverseSurface, color: T.inverseOnSurface, border: "none", borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
                      onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                      ✓ Approve Document
                    </button>
                    <button onClick={handleRevise}
                      style={{ width: "100%", background: "white", color: T.tertiary, border: `2px solid ${T.tertiary}`, borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f3f1fb"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      ↩ Request Revision
                    </button>
                    <button onClick={handleReject}
                      style={{ width: "100%", background: "white", color: T.error, border: `1px solid ${T.error}`, borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.errorContainer}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      ✗ Reject &amp; Archive
                    </button>
                  </div>
                </section>
              </aside>
            </main>
          </div>
        );
      })()}

      {/* ── RESUBMIT MODAL (Faculty) ── */}
      {resubmitModal && resubmitForm && (
        <Modal title="Resubmit Form" onClose={() => setResubmitModal(false)} width={500}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Reviewer's note */}
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Revision Instructions from Program Chair</div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>{resubmitForm.review_note || "Please update and resubmit your form."}</div>
            </div>

            {/* Current file info */}
            {resubmitForm.file_name && (
              <div style={{ fontSize: 12, color: "#666", background: "#f9fafb", padding: "8px 12px", borderRadius: 7 }}>
                Current file: <strong>{resubmitForm.file_name}</strong>
              </div>
            )}

            {/* New file upload */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Upload Revised Document</label>
              <div
                onClick={() => resubmitFileRef.current?.click()}
                style={{ border: "2px dashed #e5e7eb", borderRadius: 10, padding: "20px", textAlign: "center", cursor: "pointer", background: "#fafafa" }}>
                <input ref={resubmitFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={e => setResubmitFile(e.target.files[0])} />
                {resubmitFile ? (
                  <div style={{ color: "#7c3aed", fontWeight: 700, fontSize: 13 }}>✓ {resubmitFile.name}</div>
                ) : (
                  <div style={{ color: "#888", fontSize: 12 }}>Click to select a new file (PDF, JPG, PNG — max 10MB)</div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={async () => {
                  if (!resubmitFile) { alert("Please upload a revised file."); return; }
                  const fd = new FormData();
                  fd.append("file", resubmitFile);
                  fd.append("student_id", resubmitForm.student_id);
                  fd.append("full_name", resubmitForm.full_name);
                  fd.append("category", resubmitForm.category);
                  fd.append("filing_date", resubmitForm.filing_date);
                  fd.append("college_year", resubmitForm.college_year || "");
                  fd.append("section", resubmitForm.section || "");
                  fd.append("original_id", resubmitForm.id);
                  const res = await fetch(`${API}/api/forms/${resubmitForm.id}/resubmit`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                  });
                  if (res.ok) {
                    setResubmitModal(false);
                    fetchForms();
                    addToast("Form resubmitted successfully. Program chair has been notified.", "success");
                  } else {
                    const d = await res.json();
                    alert(d.message || "Resubmit failed.");
                  }
                }}
                style={{ flex: 1, padding: "10px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Submit Revised Form
              </button>
              <button onClick={() => setResubmitModal(false)}
                style={{ padding: "10px 16px", background: "white", color: "#555", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD TEMPLATE MODAL ── */}
      {addModal && (
        <Modal title="Add Form Template" onClose={() => setAddModal(false)} width={460}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Form Name *</label>
              <input type="text" value={templateData.name} onChange={e => setTemplateData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Thesis Defense Application"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Category *</label>
              <select value={templateData.category} onChange={e => setTemplateData(p => ({ ...p, category: e.target.value }))}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111", background: "white" }}>
                <option value="">{categoriesLoading ? "Loading categories..." : "Select category..."}</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Description</label>
              <textarea value={templateData.description} onChange={e => setTemplateData(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Briefly describe this form type and when to use it..."
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111", resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Required Fields <span style={{ fontWeight: 400, color: "#888" }}>(comma-separated)</span></label>
              <input type="text" value={templateData.required_fields} onChange={e => setTemplateData(p => ({ ...p, required_fields: e.target.value }))} placeholder="e.g. student_id, full_name, adviser_signature"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: "#111" }} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={handleAddTemplate} style={{ flex: 1, padding: "10px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Save Template
              </button>
              <button onClick={() => setAddModal(false)} style={{ padding: "10px 16px", background: "white", color: "#555", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}