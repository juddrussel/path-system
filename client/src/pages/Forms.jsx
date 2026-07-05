import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import TopBar from "./TopBar";

const API = import.meta.env.VITE_API_URL;

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
  File: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="28" height="28"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M10 2v4h4" /></svg>,
  ExportCSV: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" /><path d="M9 2v4h4" /><path d="M5 9h6M5 11.5h4" /></svg>,
  Filter: () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" /></svg>,
  Info: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" strokeLinecap="round" /></svg>,
  Tip: () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" strokeLinecap="round" /></svg>,
  Bell: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0H6.5z" /></svg>,
  Tracking: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>,
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

  // Faculty submit state
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [formData, setFormData] = useState({ student_id: "", full_name: "", category: "Internship", filing_date: new Date().toISOString().split("T")[0], college_year: "1st Year", section: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef();

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

  // Program chair: add form template
  const [addModal, setAddModal] = useState(false);
  const [templateData, setTemplateData] = useState({ name: "", description: "", category: "", required_fields: "" });

  // ── Real-time: pending badge count & toast queue ──────────────────────────
  const [pendingBadge, setPendingBadge] = useState(0);
  const [toasts, setToasts] = useState([]);

  const authHeaders = { Authorization: `Bearer ${token}` };

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

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) { alert("Only PDF, JPG, or PNG files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("File exceeds 10MB limit."); return; }
    setUploadedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmitForm = async () => {
    if (!uploadedFile) { alert("Please upload a file first."); return; }
    if (!formData.student_id || !formData.full_name) { alert("Please fill in all required fields."); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadedFile);
      fd.append("student_id", formData.student_id);
      fd.append("full_name", formData.full_name);
      fd.append("category", formData.category);
      fd.append("filing_date", formData.filing_date);
      fd.append("college_year", formData.college_year);
      fd.append("section", formData.section);
      const res = await fetch(`${API}/api/forms/submit`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        setSubmitSuccess(true);
        setUploadedFile(null);
        setFormData({ student_id: "", full_name: "", category: "Internship", filing_date: new Date().toISOString().split("T")[0], college_year: "1st Year", section: "" });
        fetchForms();
        setTimeout(() => setSubmitSuccess(false), 4000);
        // Socket.IO will notify the program chair automatically via the backend emit
      } else { const d = await res.json(); alert(d.message || "Submission failed."); }
    } catch { alert("Server error. Please try again."); } finally { setSubmitting(false); }
  };

  const handleSaveDraft = async () => {
    try {
      const fd = new FormData();
      if (uploadedFile) fd.append("file", uploadedFile);
      fd.append("student_id", formData.student_id);
      fd.append("full_name", formData.full_name);
      fd.append("category", formData.category);
      fd.append("filing_date", formData.filing_date);
      fd.append("college_year", formData.college_year);
      fd.append("section", formData.section);
      fd.append("status", "Draft");
      await fetch(`${API}/api/forms/draft`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      alert("Draft saved successfully.");
      fetchForms();
    } catch { alert("Could not save draft."); }
  };

  const handleReview = (form) => { setSelectedForm(form); setReviewNote(""); setReviewModal(true); };

  const handleApprove = async () => {
    if (!selectedForm) return;
    await fetch(`${API}/api/forms/${selectedForm.id}/approve`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ note: reviewNote }) });
    setReviewModal(false);
    fetchForms();
    addToast(`Form ${selectedForm.tracking_id || selectedForm.id} approved successfully.`, "success");
  };

  const handleReject = async () => {
    if (!selectedForm) return;
    if (!reviewNote.trim()) { alert("Please provide a reason for rejection."); return; }
    await fetch(`${API}/api/forms/${selectedForm.id}/reject`, { method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ note: reviewNote }) });
    setReviewModal(false);
    fetchForms();
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

  const categories = ["Internship", "Capstone Proposal", "Medical Certificate", "Transfer Credential", "Intent to Graduate", "Clearance", "Enrollment", "Grade Appeal"];

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
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={true} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>
          
          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-designer")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
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

          {/* ── FACULTY: SUBMIT TAB ── */}
          {activeTab === "submit" && !isProgramChair && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>Document Upload</h3>
                    <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Upload your student forms in PDF or High-Res JPG format.</p>
                  </div>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="18" height="18"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M10 2v4h4" /></svg>
                </div>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? "#7c3aed" : "#e5e7eb"}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "#faf5ff" : "#fafafa", transition: "all 0.2s", marginTop: 16 }}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
                  {uploadedFile ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                      <Icon.File />
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", margin: 0 }}>{uploadedFile.name}</p>
                      <p style={{ fontSize: 11, color: "#888", margin: 0 }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button onClick={e => { e.stopPropagation(); setUploadedFile(null); }} style={{ fontSize: 11, color: "#dc2626", background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>Remove file</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <Icon.Upload />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>Drag and drop files here</p>
                      <p style={{ fontSize: 11, color: "#aaa", margin: "0 0 14px" }}>Max file size: 10MB. Accepted formats: .pdf, .jpg, .png</p>
                      <button style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Select Files</button>
                    </>
                  )}
                </div>

                {/* Pro Tip */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 14, background: "#faf5ff", borderRadius: 8, padding: "10px 12px" }}>
                  <Icon.Tip />
                  <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                    <strong>Pro Tip:</strong> Ensure documents are properly oriented and scanned at 300dpi for faster OCR processing and approval.
                  </p>
                </div>

                {submitSuccess && (
                  <div style={{ marginTop: 12, background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 8, padding: "10px 14px", fontSize: 12, fontWeight: 700, color: "#065f46", display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon.Check /> Form submitted! The program chair has been notified in real time.
                  </div>
                )}
              </div>

              {/* Form Details */}
              <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: "0 0 4px" }}>Form Details</h3>
                <p style={{ fontSize: 12, color: "#888", margin: "0 0 16px" }}>Complete the metadata for proper document indexing.</p>

                <div style={{ background: "#ede9fe", borderRadius: 8, padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="13" height="13"><rect x="1" y="3" width="14" height="11" rx="1" /><path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1" /></svg>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#7c3aed", textTransform: "uppercase" }}>Department Context</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>Bachelor of Science in Information Systems (BSIS)</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Student ID Number</label>
                    <input type="text" value={formData.student_id} onChange={e => setFormData(p => ({ ...p, student_id: e.target.value }))}
                      placeholder="e.g. 2021-12345"
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Full Legal Name</label>
                    <input type="text" value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Last Name, First Name M.I."
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>College Year</label>
                      <select value={formData.college_year} onChange={e => setFormData(p => ({ ...p, college_year: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111", background: "white" }}>
                        {["1st Year", "2nd Year", "3rd Year", "4th Year"].map(y => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Section</label>
                      <input type="text" value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                        placeholder="e.g. BSIS 3-A"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111" }} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Document Category</label>
                      <select value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111", background: "white" }}>
                        {categories.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5 }}>Filing Date</label>
                      <input type="date" value={formData.filing_date} onChange={e => setFormData(p => ({ ...p, filing_date: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111" }} />
                    </div>
                  </div>
                  <button onClick={handleSubmitForm} disabled={submitting}
                    style={{ width: "100%", padding: "11px", background: submitting ? "#a78bfa" : "#7c3aed", color: "white", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: submitting ? "not-allowed" : "pointer" }}>
                    {submitting ? "Submitting..." : "Process & Submit Form"}
                  </button>
                  <button onClick={handleSaveDraft}
                    style={{ width: "100%", padding: "9px", background: "transparent", color: "#555", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── REVIEW QUEUE (Program Chair) / MY SUBMISSIONS (Faculty) ── */}
          {(activeTab === "history" || activeTab === "review") && (
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
                    {["Document ID", "Student Name", "Category", "Filing Date", "Status", "Actions"].map(h => (
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
          )}

          {/* ── PROGRAM CHAIR: FORM TEMPLATES TAB ── */}
          {activeTab === "templates" && isProgramChair && (
            <div style={{ background: "white", border: "1px solid #f3f4f6", borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}>Form Templates</h3>
                  <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Define which form types students and faculty can submit.</p>
                </div>
                <button onClick={() => setAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#7c3aed", color: "white", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <Icon.Plus /> Add Form Type
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {categories.map((cat) => (
                  <div key={cat} style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 18px", position: "relative" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                      <Icon.Forms />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 4 }}>{cat}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>Standard submission form</div>
                    <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Active</span>
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
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedForm.file_url}`}
                        download={selectedForm.file_name}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 11, fontWeight: 700, color: "white", textDecoration: "none", padding: "4px 12px", borderRadius: 6, background: "#7c3aed", whiteSpace: "nowrap" }}
                      >
                        ↓ Download
                      </a>
                      <a
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedForm.file_url}`}
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
                    const url = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${selectedForm.file_url}`;
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
                <option value="">Select category...</option>
                {categories.map(c => <option key={c}>{c}</option>)}
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
