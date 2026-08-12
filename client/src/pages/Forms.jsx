import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import TopBar from "./TopBar";

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
};

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", color: active ? "white" : "#c8c4e0", fontSize: 12, cursor: "pointer", borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent", background: active ? "rgba(124,58,237,0.18)" : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
      {badge > 0 && (
        <span style={{ marginLeft: "auto", background: "#dc2626", color: "white", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "1px 6px", minWidth: 16, textAlign: "center" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Approved: { bg: "#d1fae5", color: "#065f46" },
    Pending: { bg: "#fef3c7", color: "#92400e" },
    Rejected: { bg: "#fee2e2", color: "#991b1b" },
    Draft: { bg: "#f3f4f6", color: "#374151" },
    Reviewing: { bg: "#ede9fe", color: "#5b21b6" },
    Revision: { bg: "#fef3c7", color: "#92400e" },
  };
  const s = map[status] || map.Draft;
  return <span style={{ ...s, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{status}</span>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaType, icon, bg }) {
  const deltaColor = deltaType === "up" ? "#059669" : deltaType === "down" ? "#dc2626" : "#6b7280";
  const deltaBg = deltaType === "up" ? "#d1fae5" : deltaType === "down" ? "#fee2e2" : "#f3f4f6";
  return (
    <div style={{ background: "white", borderRadius: 12, padding: "16px 18px", border: "1px solid #f3f4f6", position: "relative", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>{label}</div>
        {delta && <span style={{ background: deltaBg, color: deltaColor, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>{delta}</span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#111", marginBottom: 2 }}>{value}</div>
      <div style={{ position: "absolute", right: 14, bottom: 14, width: 32, height: 32, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
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
      // Program chair: listen for new submissions from faculty
      socket.on("new_form_submission", (newForm) => {
        // Refresh the review queue
        fetchForms();
        // Increment the sidebar badge
        setPendingBadge(prev => prev + 1);
        // Show a toast notification
        addToast(
          `New form submitted by ${newForm.submitter_name || newForm.full_name} — ${newForm.category}`,
          "info"
        );
      });
    } else {
      // Faculty: listen for their own form status updates from the program chair
      socket.on("form_status_update", (update) => {
        fetchForms();
        if (update.status === "Revision") {
          addToast(`Form ${update.tracking_id} needs revision: "${update.review_note}"`, "info");
        } else {
          const isApproved = update.status === "Approved";
          addToast(
            `Your form ${update.tracking_id} has been ${update.status.toLowerCase()}${update.review_note ? `: "${update.review_note}"` : ""}`,
            isApproved ? "success" : "error"
          );
        }
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
    addToast(`Form ${selectedForm.tracking_id || selectedForm.id} approved successfully.`, "success");
  };

  const handleReject = async () => {
    if (!selectedForm) return;
    if (!reviewNote.trim()) { alert("Please provide a reason for rejection."); return; }
    await fetch(`${API}/api/forms/${selectedForm.id}/reject`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ note: reviewNote }) });
    setReviewModal(false);
    fetchForms();
    fetchAllForms();
    addToast(`Form ${selectedForm.tracking_id || selectedForm.id} rejected.`, "error");
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
    addToast(`Revision requested for form ${selectedForm.tracking_id || selectedForm.id}.`, "info");
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

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
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
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={true} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
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

        {/* Bottom */}
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search document ID, student name, category..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }} />
            </div>
            {isProgramChair && (
              <button onClick={() => setAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151", whiteSpace: "nowrap" }}>
                <Icon.Plus /> Add Form Template
              </button>
            )}
            <button onClick={() => navigate("/documents/new")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Icon.Download /> Intake Document
            </button>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Page Header + Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 4px" }}>Forms Management</h1>
              <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
                {isProgramChair ? "Review, approve, and manage submitted student forms." : "Upload and submit student forms for program chair review."}
              </p>
            </div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 2, background: "#f3f4f6", borderRadius: 10, padding: 3 }}>
              {!isProgramChair && (
                <button onClick={() => setActiveTab("submit")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "submit" ? "white" : "transparent", color: activeTab === "submit" ? "#7c3aed" : "#888", boxShadow: activeTab === "submit" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                  Submit Form
                </button>
              )}
              <button
                onClick={() => { setActiveTab(isProgramChair ? "review" : "history"); setPendingBadge(0); }}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "review" || activeTab === "history" ? "white" : "transparent", color: activeTab === "review" || activeTab === "history" ? "#7c3aed" : "#888", boxShadow: activeTab === "review" || activeTab === "history" ? "0 1px 4px rgba(0,0,0,0.08)" : "none", position: "relative" }}>
                {isProgramChair ? "Review Queue" : "My Submissions"}
                {/* Inline badge on the tab button */}
                {isProgramChair && pendingBadge > 0 && (
                  <span style={{ marginLeft: 6, background: "#dc2626", color: "white", borderRadius: 20, fontSize: 9, fontWeight: 800, padding: "1px 6px", animation: "pulse 1.5s infinite" }}>
                    {pendingBadge}
                  </span>
                )}
              </button>
              {isProgramChair && (
                <button onClick={() => setActiveTab("templates")} style={{ padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: activeTab === "templates" ? "white" : "transparent", color: activeTab === "templates" ? "#7c3aed" : "#888", boxShadow: activeTab === "templates" ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
                  Form Templates
                </button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <StatCard label="Total Submissions" value={stats.total?.toLocaleString() || "1,284"} delta="+12%" deltaType="up"
              icon={<svg viewBox="0 0 16 16" fill="#7c3aed" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>} bg="#ede9fe" />
            <StatCard label="Pending Review" value={stats.pending || "0"} delta="Action Needed" deltaType="neutral"
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l2 2" strokeLinecap="round" /></svg>} bg="#fef3c7" />
            <StatCard label="Approved Forms" value={stats.approved?.toLocaleString() || "0"} delta="94.2%" deltaType="up"
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" width="14" height="14"><path d="M13 5l-7 7-3-3" strokeLinecap="round" /></svg>} bg="#d1fae5" />
            <StatCard label="Rejection Rate" value={stats.rejection_rate || "0%"} delta="-0.5%" deltaType="down"
              icon={<svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" /></svg>} bg="#fee2e2" />
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
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>1</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>Form Type Selection</h3>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Choose the specific form you wish to file from the list below.</p>

                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Form Type</label>
                    <select
                      value={wizardFormType}
                      onChange={e => {
                        setWizardFormType(e.target.value);
                        // Switching form types swaps the whole field set, so
                        // clear out any values/files entered for the previous type.
                        setWizardDocs({});
                        setWizardFieldValues({});
                      }}
                      disabled={categoriesLoading || categories.length === 0}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, color: wizardFormType ? "#111" : "#9ca3af", background: "white" }}>
                      <option value="" disabled>
                        {categoriesLoading ? "Loading…" : categories.length === 0 ? "No form types found" : "Select a form type..."}
                      </option>
                      {categories.map(c => <option key={c.id} value={c.name} style={{ color: "#111" }}>{c.name}</option>)}
                    </select>
                    {selectedCategory?.description && (
                      <p style={{ fontSize: 11, color: "#9ca3af", margin: "8px 0 0" }}>{selectedCategory.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STEP 2: FORM FIELDS (dynamic — driven by the selected template) ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>2</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>Form Fields</h3>
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

                    {selectedCategory && selectedFields.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {selectedFields.map((f, idx) => {
                          const isFile = isFileField(f);
                          const isTextArea = f.fieldType === "Text Area";
                          const isChoiceCheckbox = hasCheckboxChoices(f);
                          const isMultiCheckbox = isChoiceCheckbox && f.multiSelect !== false;
                          const stacked = isTextArea || isChoiceCheckbox;
                          const doc = isFile ? wizardDocs[f.id] : null;
                          const isDragOver = wizardDragOver === f.id;
                          const val = wizardFieldValues[f.id] ?? (isMultiCheckbox ? [] : "");
                          const controlStyle = { padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12.5, color: "#111", background: "white" };
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
                              style={{ border: `1px solid ${isDragOver ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 10, padding: "12px 14px", background: isDragOver ? "#faf5ff" : "#fafafa" }}
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
                                      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 180, justifyContent: "flex-end" }}>
                                        <div style={{ flex: 1, minWidth: 100 }}>
                                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#888", marginBottom: 3 }}>
                                            <span>{doc.status === "done" ? "Upload complete" : "Uploading..."}</span>
                                            <span>{doc.progress}%</span>
                                          </div>
                                          <div style={{ height: 5, background: "#e5e7eb", borderRadius: 20, overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${doc.progress}%`, background: "#7c3aed", borderRadius: 20, transition: "width 0.2s" }} />
                                          </div>
                                        </div>
                                        {doc.status === "done" && <Icon.Check />}
                                        <button onClick={() => removeWizardDoc(f.id)}
                                          style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", fontSize: 11, fontWeight: 700, color: "#374151", cursor: "pointer", whiteSpace: "nowrap" }}>
                                          Browse
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 11, color: "#9ca3af" }}>Click to upload or drag &amp; drop</span>
                                        <button onClick={() => wizardFileRefs.current[f.id]?.click()}
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
                                    placeholder={`Enter ${f.name.toLowerCase()}`} style={{ ...controlStyle, width: 220 }} />
                                )}

                                {/* ── Number ── */}
                                {f.fieldType === "Number" && (
                                  <input type="number" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
                                    placeholder="0" style={{ ...controlStyle, width: 140 }} />
                                )}

                                {/* ── Date ── */}
                                {f.fieldType === "Date" && (
                                  <input type="date" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
                                    style={{ ...controlStyle, width: 160 }} />
                                )}

                                {/* ── Dropdown (falls back to free text if the template has no options configured) ── */}
                                {f.fieldType === "Dropdown" && (
                                  Array.isArray(f.options) && f.options.length > 0 ? (
                                    <select value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)} style={{ ...controlStyle, width: 180 }}>
                                      <option value="" disabled>Select…</option>
                                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                  ) : (
                                    <input type="text" value={val} onChange={e => handleWizardFieldChange(f.id, e.target.value)}
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
                                    placeholder={`Enter ${f.name.toLowerCase()}`}
                                    style={{ ...controlStyle, width: "100%", resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
                                )}
                              </div>
                              {doc?.file && (
                                <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 6, fontWeight: 600, marginLeft: 26 }}>{doc.file.name}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, background: "#faf5ff", borderRadius: 8, padding: "10px 12px" }}>
                      <Icon.Tip />
                      <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                        These fields are pulled from the <strong>{selectedCategory ? selectedCategory.name : "selected"}</strong> template in Document Categories — edit them there to change what's asked for here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── STEP 3: ADDITIONAL INFORMATION ── */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>3</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>Additional Information</h3>
                    <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Provide any extra context for the program chair.</p>

                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Remarks / Special Notes</label>
                      <textarea value={wizardInfo.remarks} onChange={e => setWizardInfo(p => ({ ...p, remarks: e.target.value }))} rows={3}
                        placeholder="Enter any additional context for the program chair..."
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111", resize: "vertical", fontFamily: "'DM Sans',sans-serif" }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT: SUBMISSION SUMMARY ── */}
            <div style={{ position: "sticky", top: 20 }}>
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="15" height="15"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M10 2v4h4" /></svg>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", margin: 0 }}>Submission Summary</h3>
                </div>
                <p style={{ fontSize: 11, color: "#888", margin: "0 0 16px" }}>Step 3: Review details</p>

                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Form Type</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: wizardFormType ? "#7c3aed" : "#9ca3af" }}>{wizardFormType || "Not selected"}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {[
                    ["Required Fields", wizardRequiredCount],
                    ["Completed", wizardUploadedCount],
                    ["Uploading", wizardUploadingCount],
                    ["Missing", wizardMissingCount],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#6b7280" }}>{label}</span>
                      <span style={{ fontWeight: 700, color: label === "Missing" && val > 0 ? "#dc2626" : "#111" }}>{val}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: wizardStatusColor }}>{wizardStatusLabel}</div>
                </div>

                <button onClick={handleWizardSubmit} disabled={wizardSubmitting}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: wizardSubmitting ? "#a78bfa" : "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: wizardSubmitting ? "not-allowed" : "pointer", marginBottom: 8 }}>
                  {wizardSubmitting ? "Submitting..." : "Submit Form"} {!wizardSubmitting && "→"}
                </button>
                <button onClick={handleWizardSaveDraft} disabled={wizardSubmitting}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: "white", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: wizardSubmitting ? "not-allowed" : "pointer", marginBottom: 8 }}>
                  Save as Draft
                </button>
                <button onClick={handleWizardCancel}
                  style={{ width: "100%", padding: "8px", background: "transparent", color: "#9ca3af", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
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
            <>
            <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>
                      {isProgramChair ? "Review Queue" : "Document Repository"}
                    </h3>
                    {isProgramChair && stats.pending > 0 && (
                      <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>
                        {stats.pending} pending
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: "#888", margin: 0 }}>
                    {isProgramChair
                      ? "Pending forms from faculty — review, approve, or reject below."
                      : "Track the status of all your submitted forms."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                    <Icon.Filter /> Filter
                  </button>
                  <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                    <Icon.ExportCSV /> Export CSV
                  </button>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa" }}>
                    {["Document ID", "Name", "Category", "Filing Date", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
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
                    <tr key={row.id} style={{ borderBottom: "1px solid #f9f9f9" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "white"}>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 12 }}>{row.tracking_id || row.id}</span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{row.full_name}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{row.student_id}</div>
                        {isProgramChair && row.submitter_name && (
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 1 }}>by {row.submitter_name}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{row.category}</td>
                      <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{row.filing_date}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <StatusBadge status={row.status} />
                        {!isProgramChair && row.status === "Revision" && row.review_note && (
                          <div style={{ marginTop: 5, background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 6, padding: "5px 8px", maxWidth: 220 }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                              📝 Revision Note
                            </div>
                            <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.4 }}>{row.review_note}</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {isProgramChair && (row.status === "Pending" || row.status === "Reviewing") && (
                            <button onClick={() => handleReview(row)}
                              style={{ padding: "4px 10px", border: "1px solid #7c3aed", borderRadius: 6, background: "#ede9fe", cursor: "pointer", color: "#7c3aed", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
                              Review
                            </button>
                          )}
                          {!isProgramChair && row.status === "Revision" && (
                            <button onClick={() => { setResubmitForm(row); setResubmitFile(null); setResubmitModal(true); }}
                              style={{ padding: "4px 10px", border: "1px solid #d97706", borderRadius: 6, background: "#fef3c7", cursor: "pointer", color: "#92400e", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700 }}>
                              ↩ Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#888" }}>Showing page {page} of {totalPages} ({stats.pending || 0} pending)</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, color: "#374151" }}>Previous</button>
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)} style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, background: page === n ? "#7c3aed" : "white", color: page === n ? "white" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{n}</button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, color: "#374151" }}>Next</button>
                </div>
              </div>
            </div>

            {/* ── EXISTING FORMS (Program Chair): full history, any status ── */}
            {isProgramChair && (
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, overflow: "hidden", marginTop: 20 }}>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f3f4f6" }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 2px" }}>Existing Forms</h3>
                    <p style={{ fontSize: 11, color: "#888", margin: 0 }}>Every form ever submitted, regardless of status — approved, rejected, or in progress.</p>
                  </div>
                  <select value={allFormsStatusFilter} onChange={e => { setAllFormsStatusFilter(e.target.value); setAllFormsPage(1); }}
                    style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
                    {["All", "Pending", "Reviewing", "Approved", "Rejected", "Revision"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fafafa" }}>
                      {["Document ID", "Name", "Category", "Filing Date", "Status", "Submitted By"].map(h => (
                        <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>{h}</th>
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
                      <tr key={row.id} style={{ borderBottom: "1px solid #f9f9f9" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{ color: "#7c3aed", fontWeight: 700, fontSize: 12 }}>{row.tracking_id || row.id}</span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{row.full_name}</div>
                          <div style={{ fontSize: 11, color: "#aaa" }}>{row.student_id}</div>
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{row.category}</td>
                        <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{row.filing_date}</td>
                        <td style={{ padding: "12px 20px" }}><StatusBadge status={row.status} /></td>
                        <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{row.submitter_name || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{ padding: "12px 20px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Showing page {allFormsPage} of {allFormsTotalPages}</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => setAllFormsPage(p => Math.max(1, p - 1))} disabled={allFormsPage === 1} style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, color: "#374151" }}>Previous</button>
                    {Array.from({ length: Math.min(allFormsTotalPages, 3) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setAllFormsPage(n)} style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, background: allFormsPage === n ? "#7c3aed" : "white", color: allFormsPage === n ? "white" : "#374151", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{n}</button>
                    ))}
                    <button onClick={() => setAllFormsPage(p => Math.min(allFormsTotalPages, p + 1))} disabled={allFormsPage === allFormsTotalPages} style={{ padding: "4px 10px", border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", fontSize: 12, color: "#374151" }}>Next</button>
                  </div>
                </div>
              </div>
            )}
            </>
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

      {/* ── REVIEW MODAL ── */}
      {reviewModal && selectedForm && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setReviewModal(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40, backdropFilter: "blur(3px)" }}
          />

          {/* Centered panel — much larger */}
          <div style={{
            position: "fixed",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(1280px, 96vw)",
            height: "min(880px, 94vh)",
            background: "white", zIndex: 50,
            display: "flex", flexDirection: "column",
            boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
            borderRadius: 16,
            overflow: "hidden",
            animation: "fadeUp 0.2s ease",
          }}>

            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #e5e7eb", flexShrink: 0, background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: "#ede9fe", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon.Forms />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>Review Form Submission</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
                    {selectedForm.tracking_id || `Form #${selectedForm.id}`} · {selectedForm.category}
                  </div>
                </div>
              </div>
              <button onClick={() => setReviewModal(false)} style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer", padding: "6px 14px", color: "#666", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Panel body — two columns */}
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

              {/* LEFT — file preview (takes most space) */}
              <div style={{ flex: 1, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", overflow: "hidden", background: "#1e1e2e" }}>

                {/* Preview toolbar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #2d2d3e", background: "#16162a", flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: 1 }}>
                    File Preview
                  </span>
                  {selectedForm.file_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "#888", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        📎 {selectedForm.file_name || "attachment"}
                      </span>
                      <a
                        href={resolveFileUrl(selectedForm.file_url)}
                        download={selectedForm.file_name}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "white", textDecoration: "none", padding: "4px 12px", borderRadius: 6, background: "#7c3aed", whiteSpace: "nowrap" }}
                      >
                        ↓ Download
                      </a>
                      <a
                        href={resolveFileUrl(selectedForm.file_url)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textDecoration: "none", padding: "4px 12px", borderRadius: 6, border: "1px solid #4c3d7a", whiteSpace: "nowrap" }}
                      >
                        ↗ Open in new tab
                      </a>
                    </div>
                  )}
                </div>

                {/* File content */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "stretch", justifyContent: "center" }}>
                  {selectedForm.file_url ? (() => {
                    const url = resolveFileUrl(selectedForm.file_url);
                    const ext = (selectedForm.file_name || selectedForm.file_url || "").split(".").pop().toLowerCase();
                    const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
                    const isPdf = ext === "pdf";

                    if (isPdf) return (
                      <iframe
                        src={`${url}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                        title="Form Preview"
                        style={{ width: "100%", height: "100%", border: "none" }}
                      />
                    );
                    if (isImg) return (
                      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#1e1e2e" }}>
                        <img
                          src={url}
                          alt="Form Preview"
                          style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 4px 24px rgba(0,0,0,0.4)", objectFit: "contain" }}
                        />
                      </div>
                    );
                    return (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: "#888" }}>
                        <Icon.File />
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#aaa" }}>{selectedForm.file_name || "Attached file"}</div>
                        <div style={{ fontSize: 11, color: "#666" }}>Preview not available for this file type.</div>
                        <a
                          href={url} target="_blank" rel="noreferrer" download={selectedForm.file_name}
                          style={{ marginTop: 8, padding: "10px 22px", background: "#7c3aed", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}
                        >
                          Download File
                        </a>
                      </div>
                    );
                  })() : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: "#555" }}>
                      <Icon.File />
                      <div style={{ fontSize: 13 }}>No file attached</div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT — info + review actions (wider than before) */}
              <div style={{ width: 360, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>

                {/* Submission info */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Submission Details</div>
                  {[
                    ["Document ID", selectedForm.tracking_id || `#${selectedForm.id}`],
                    ["Submitted by", selectedForm.submitter_name || selectedForm.full_name || "—"],
                    ["Department", selectedForm.department || "—"],
                    ["Category", selectedForm.category || "—"],
                    ["Date Filed", selectedForm.filing_date || selectedForm.date || selectedForm.created_at
                      ? new Date(selectedForm.filing_date || selectedForm.date || selectedForm.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"],
                    ["Status", selectedForm.status || "Pending"],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #f9f9f9" }}>
                      <span style={{ fontSize: 11, color: "#888", fontWeight: 600, flexShrink: 0, marginRight: 8 }}>{label}</span>
                      <span style={{ fontSize: 12, color: "#111", fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>
                        {label === "Status" ? (
                          <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, ...({ Pending: { background: "#fef3c7", color: "#92400e" }, Approved: { background: "#d1fae5", color: "#065f46" }, Rejected: { background: "#fee2e2", color: "#991b1b" }, Reviewing: { background: "#ede9fe", color: "#5b21b6" }, Revision: { background: "#fef3c7", color: "#92400e" } }[value] || { background: "#f3f4f6", color: "#374151" }) }}>
                            {value}
                          </span>
                        ) : value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic fields the faculty filled in during Step 2 */}
                {(() => {
                  let fields = null;
                  try {
                    fields = typeof selectedForm.field_values === "string"
                      ? JSON.parse(selectedForm.field_values)
                      : selectedForm.field_values;
                  } catch { fields = null; }
                  let entries = fields ? Object.entries(fields) : [];
                  if (!entries.length) return null;

                  // Put file-upload fields (e.g. "Masterlist") after the regular
                  // text fields, regardless of the order they were stored in —
                  // matches the template's field types from Document Categories.
                  const tmpl = categories.find(c => c.name === selectedForm.category);
                  const fileFieldNames = new Set((tmpl?.formFields || []).filter(isFileField).map(f => f.name));
                  entries = [
                    ...entries.filter(([label]) => !fileFieldNames.has(label)),
                    ...entries.filter(([label]) => fileFieldNames.has(label)),
                  ];

                  return (
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Submitted Fields</div>
                      {entries.map(([label, value]) => {
                        const display = value === null || value === "" ? "—" : String(value);
                        const isLong = display.length > 18; // e.g. filenames — stack below the label instead of squeezing right-aligned
                        return (
                          <div key={label} style={{
                            display: "flex", flexDirection: isLong ? "column" : "row",
                            justifyContent: "space-between", alignItems: isLong ? "flex-start" : "flex-start",
                            gap: isLong ? 4 : 0, paddingBottom: 8, marginBottom: 8, borderBottom: "1px solid #f9f9f9",
                          }}>
                            <span style={{ fontSize: 11, color: "#888", fontWeight: 600, flexShrink: 0, marginRight: isLong ? 0 : 8 }}>{label}</span>
                            <span style={{ fontSize: 12, color: "#111", fontWeight: 600, textAlign: isLong ? "left" : "right", wordBreak: "break-word" }}>
                              {display}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Previous review note if any */}
                {selectedForm.review_note && (
                  <div style={{ margin: "10px 16px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Previous Review Note</div>
                    <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{selectedForm.review_note}</div>
                  </div>
                )}

                {/* Review note input */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Review Note
                    <span style={{ color: "#dc2626", fontWeight: 400, textTransform: "none", marginLeft: 4 }}>(required for rejection & revision)</span>
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    rows={4}
                    placeholder="Add comments, feedback, or reason for your decision..."
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, color: "#111", resize: "vertical", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, boxSizing: "border-box" }}
                  />
                </div>

                {/* Action buttons */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Decision</div>
                  <button
                    onClick={handleApprove}
                    style={{ width: "100%", padding: "10px", background: "#059669", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#047857"}
                    onMouseLeave={e => e.currentTarget.style.background = "#059669"}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={handleRevise}
                    style={{ width: "100%", padding: "10px", background: "#d97706", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onMouseEnter={e => e.currentTarget.style.background = "#b45309"}
                    onMouseLeave={e => e.currentTarget.style.background = "#d97706"}
                  >
                    ↩ Request Revision
                  </button>
                  <button
                    onClick={handleReject}
                    style={{ width: "100%", padding: "10px", background: "white", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "white"; }}
                  >
                    ✗ Reject
                  </button>
                </div>

              </div>
            </div>
          </div>
        </>
      )}

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