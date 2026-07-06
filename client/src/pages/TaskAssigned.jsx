import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TopBar from "./TopBar";

const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Grid:       () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  Inbox:      () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z"/></svg>,
  Plus:       ({ color="currentColor", size=14 }) => <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}><path d="M8 1v14M1 8h14"/></svg>,
  Tasks:      () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>,
  Workflow:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Reports:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z"/></svg>,
  Forms:      () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg>,
  Users:      () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5s5 2 5 5"/><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3"/></svg>,
  Shield:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z"/></svg>,
  Settings:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Help:       () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v1"/></svg>,
  Logout:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6"/></svg>,
  Search:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/></svg>,
  Filter:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z"/></svg>,
  Check:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M13 5l-7 7-3-3" strokeLinecap="round"/></svg>,
  Close:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M12 4L4 12M4 4l8 8" strokeLinecap="round"/></svg>,
  Share:      () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="12" cy="3" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="12" cy="13" r="2"/><path d="M6 7l4-3M6 9l4 3" strokeLinecap="round"/></svg>,
  More:       () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>,
  Download:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" strokeLinecap="round"/></svg>,
  Attach:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M13 7l-5 5a4 4 0 01-5.7-5.7l5-5a2.5 2.5 0 013.5 3.5l-5 5a1 1 0 01-1.4-1.4l4-4" strokeLinecap="round"/></svg>,
  AssignTask: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12.5" cy="12.5" r="3" fill="#7c3aed"/><path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Reassign:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5M11 8l3 3-3 3M14 11H9" strokeLinecap="round"/></svg>,
  Return:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M12 4H6a4 4 0 000 8h2M9 11l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  Bell:       ({ dot }) => (
    <div style={{ position: "relative" }}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15"><path d="M8 1a5 5 0 00-5 5v3l-1 2h12l-1-2V6a5 5 0 00-5-5zM6 13a2 2 0 004 0"/></svg>
      {dot && <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, background: "#ef4444", borderRadius: "50%", border: "1.5px solid white" }} />}
    </div>
  ),
  Live:       () => <svg viewBox="0 0 16 16" fill="currentColor" width="8" height="8"><circle cx="8" cy="8" r="8"/></svg>,
  Submitted:  () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M2 12V4l6-2 6 2v8l-6 2-6-2z"/><path d="M8 2v12M2 6l6 2 6-2" strokeLinecap="round"/></svg>,
  Tracking:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="14" height="14"><path d="M2 8h2.5l1.5-4 3 8 1.5-4H14" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ── Badge system ──────────────────────────────────────────────────────────────
const BADGE = {
  "pending":          { bg: "#fef3c7", color: "#92400e" },
  "for approval":     { bg: "#ede9fe", color: "#5b21b6" },
  "in progress":      { bg: "#dbeafe", color: "#1e40af" },
  "done":             { bg: "#d1fae5", color: "#065f46" },
  "approved":         { bg: "#d1fae5", color: "#065f46" },
  "overdue":          { bg: "#fee2e2", color: "#991b1b" },
  "returned":         { bg: "#fce7f3", color: "#9d174d" },
  "high":             { bg: "#fee2e2", color: "#991b1b" },
  "medium":           { bg: "#fef3c7", color: "#92400e" },
  "low":              { bg: "#d1fae5", color: "#065f46" },
};

function Badge({ label }) {
  const s = BADGE[label?.toLowerCase()] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ ...s, display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: "bold", textTransform: "capitalize" }}>
      {label}
    </span>
  );
}

// ── Sidebar Item ──────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", color: active ? "white" : "#c8c4e0", fontSize: 12, cursor: "pointer", borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent", background: active ? "rgba(124,58,237,0.18)" : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? "rgba(124,58,237,0.18)" : "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────
function TimelineItem({ label, value, sub, dot = "#7c3aed", isLast }) {
  return (
    <div style={{ display: "flex", gap: 10, paddingBottom: isLast ? 0 : 16, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0, marginTop: 3 }} />
        {!isLast && <div style={{ width: 1, flex: 1, background: "#e5e7eb", marginTop: 4 }} />}
      </div>
      <div>
        <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: "bold", color: "#111", marginTop: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: "#aaa", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Live Indicator ────────────────────────────────────────────────────────────
function LiveDot({ connected }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: connected ? "#059669" : "#d97706" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: connected ? "#10b981" : "#f59e0b", display: "inline-block", boxShadow: connected ? "0 0 0 2px #d1fae5" : "0 0 0 2px #fef3c7" }} />
      {connected ? "Live" : "Reconnecting..."}
    </div>
  );
}

// ── Realtime Toast ────────────────────────────────────────────────────────────
function Toast({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "submission" ? "#1e1b2e" : t.type === "error" ? "#fef2f2" : "white",
          color: t.type === "submission" ? "white" : t.type === "error" ? "#dc2626" : "#111",
          border: `1px solid ${t.type === "submission" ? "#7c3aed" : t.type === "error" ? "#fecaca" : "#e5e7eb"}`,
          borderRadius: 10, padding: "10px 14px", fontSize: 12, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 260, maxWidth: 340,
          display: "flex", alignItems: "flex-start", gap: 10,
          animation: "slideIn 0.2s ease",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>
            {t.type === "submission" ? "📥" : t.type === "error" ? "⚠️" : "ℹ️"}
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 1 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 400 }}>{t.body}</div>}
          </div>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: 0, color: "inherit" }}>
            <Icon.Close />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TaskAssigned() {
  const navigate  = useNavigate();
  const token     = localStorage.getItem("token");
  const user      = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);
  const API       = import.meta.env.VITE_API_URL;

  // ── State ──────────────────────────────────────────────────────────────────
  const [tasks,          setTasks]          = useState([]);
  const [stats,          setStats]          = useState({ total: 0, pendingApproval: 0, submitted: 0, overdue: 0 });
  const [loading,        setLoading]        = useState(true);
  const [selected,       setSelected]       = useState(null);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateRange,      setDateRange]      = useState("");
  const [docTypeFilter,  setDocTypeFilter]  = useState("All");
  const [taskPage,       setTaskPage]       = useState(1);
  const [checkedIds,     setCheckedIds]     = useState([]);
  const [selectAll,      setSelectAll]      = useState(false);
  const [comment,        setComment]        = useState("");
  const [commentFiles,        setCommentFiles]        = useState([]);
  const [commentFilePreviews, setCommentFilePreviews] = useState([]); // object URLs, one per commentFile
  const commentFileInputRef = useRef(null);
  const [fileViewer,     setFileViewer]     = useState(null);
  const [toasts,         setToasts]         = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [newSubmissions, setNewSubmissions] = useState({});   // taskId → true
  const [actionLoading,  setActionLoading]  = useState(null); // "approve"|"return"|"reassign"
  const [returnNote,         setReturnNote]         = useState("");
  const [showReturnBox,      setShowReturnBox]      = useState(false);
  const [returnFiles,        setReturnFiles]        = useState([]);
  const [returnFilePreviews, setReturnFilePreviews] = useState([]);
  const [returnDragOver,     setReturnDragOver]     = useState(false);
  const returnFileInputRef = useRef(null);
  const [activeTab,      setActiveTab]      = useState("info"); // "info"|"documents"|"activity"
  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  const PER_PAGE = 8;

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const pushToast = useCallback((title, body, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, title, body, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q:        search,
        status:   statusFilter  === "All" ? "" : statusFilter,
        priority: priorityFilter === "All" ? "" : priorityFilter,
        date:     dateRange,
        docType:  docTypeFilter === "All" ? "" : docTypeFilter,
      }).toString();
      const res  = await fetch(`${API}/api/tasks/assigned-by-me?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { navigate("/login"); return; }
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setStats(data.stats || { total: 0, pendingApproval: 0, submitted: 0, overdue: 0 });
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, dateRange, docTypeFilter]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTasks();
  }, [fetchTasks]);

  // ── Re-fetch selected task detail on tasks update ─────────────────────────
  useEffect(() => {
    if (selected) {
      const fresh = tasks.find(t => t.id === selected.id);
      if (fresh) setSelected(prev => ({ ...fresh, comments: prev?.comments || fresh.comments, submissions: prev?.submissions || fresh.submissions }));
    }
  }, [tasks]);

  // ── Fetch full task detail (gets all fields like document_type, due_date) ─
  const fetchSelectedTask = useCallback(async (taskId) => {
    try {
      const res = await fetch(`${API}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) return;
      const data = await res.json();
      const detail = data.task || data;
      setSelected(prev => ({
        ...prev,
        ...detail,
        doc_type: detail.doc_type || prev?.doc_type,
        deadline: detail.deadline || prev?.deadline,
      }));
    } catch (err) {
      console.error("Failed to load task detail:", err);
    }
  }, [API, token]);

  // ── Socket.IO real-time ────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = io(API, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      // Register this socket into the user's personal room so
      // server-side io.to(`user_${id}`) emits reach this client
      socket.emit("register", user.id);
      // Also join the role room so admin/chair notifications work
      if (user.role) socket.emit("join_role_room", { role: user.role });
    });

    socket.on("disconnect", () => setSocketConnected(false));

    // Faculty submitted a task
    socket.on("task:submitted", ({ taskId, taskTitle, facultyName, attachmentCount, files }) => {
      setNewSubmissions(prev => ({ ...prev, [taskId]: true }));
      pushToast(
        `📥 ${facultyName} submitted a task`,
        `"${taskTitle}"${attachmentCount ? ` · ${attachmentCount} document${attachmentCount > 1 ? "s" : ""} attached` : ""}`,
        "submission"
      );
      // Inject submitted files into the open task's submissions array in real-time
      if (files?.length) {
        const realtimeGroupId = `sub_rt_${taskId}_${Date.now()}`;
        setSelected(prev => {
          if (!prev || prev.id !== taskId) return prev;
          const existing = prev.submissions || [];
          const newFiles = files.map(f => ({
            file_name: f.originalname || f.name,
            name: f.originalname || f.name,
            file_url: f.url || f.path || "",
            url: f.url || f.path || "",
            size: f.size,
            submitted_at: new Date().toISOString(),
            submission_group_id: realtimeGroupId,
          }));
          return { ...prev, status: "For Approval", submissions: [...existing, ...newFiles] };
        });
      }
      fetchTasks();
    });

    // Task status changed
    socket.on("task:status_changed", ({ taskId, newStatus, updatedBy }) => {
      pushToast(`Status updated`, `Task moved to "${newStatus}" by ${updatedBy}`);
      fetchTasks();
    });

    // New comment — append in real-time without a page refresh
    socket.on("task:comment_added", ({ taskId, comment: incoming }) => {
      setSelected(prev => {
        if (!prev || prev.id !== taskId) return prev;
        // 1. Already confirmed by id — ignore echo entirely
        const alreadyExists = prev.comments.some(c => c.id && c.id === incoming.id);
        if (alreadyExists) return prev;
        // 2. Replace a matching _pending optimistic entry sent by us
        const pendingIdx = prev.comments.findIndex(
          c => c._pending && c.content === incoming.content
        );
        if (pendingIdx !== -1) {
          const updated = [...prev.comments];
          updated[pendingIdx] = incoming;          // swap pending → confirmed
          return { ...prev, comments: updated };
        }
        // 3. New comment from someone else — append
        return { ...prev, comments: [...prev.comments, incoming] };
      });
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        const alreadyExists = (t.comments || []).some(c => c.id && c.id === incoming.id);
        if (alreadyExists) return t;
        return { ...t, comments: [...(t.comments || []), incoming] };
      }));
    });

    // Typing indicators
    socket.on("task:user_typing", ({ taskId, userId, name }) => {
      if (!selectedRef.current || selectedRef.current.id !== taskId) return;
      if (userId === user.id) return;
      setTypingUsers(prev => prev.some(u => u.userId === userId) ? prev : [...prev, { userId, name }]);
    });

    socket.on("task:user_stop_typing", ({ taskId, userId }) => {
      if (!selectedRef.current || selectedRef.current.id !== taskId) return;
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    });

    // New attachment added to an open task
    socket.on("task:attachment_added", ({ taskId, fileName, file }) => {
      pushToast("New document received", fileName, "submission");
      // Inject the new file into submissions immediately without waiting for fetchTasks
      if (file) {
        const attachGroupId = `sub_att_${taskId}_${Date.now()}`;
        setSelected(prev => {
          if (!prev || prev.id !== taskId) return prev;
          const newFile = {
            file_name: file.originalname || file.name || fileName,
            name: file.originalname || file.name || fileName,
            file_url: file.url || file.path || "",
            url: file.url || file.path || "",
            size: file.size,
            submitted_at: new Date().toISOString(),
            submission_group_id: attachGroupId,
          };
          return { ...prev, submissions: [...(prev.submissions || []), newFile] };
        });
      }
      fetchTasks();
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.disconnect();
    };
  }, [token]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (taskId) => {
    setActionLoading("approve");
    try {
      await fetch(`${API}/api/tasks/${taskId}/approve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      pushToast("Task approved", "Faculty has been notified.");
      setNewSubmissions(prev => { const n = { ...prev }; delete n[taskId]; return n; });
      fetchTasks();
    } catch { pushToast("Error", "Could not approve task.", "error"); }
    finally   { setActionLoading(null); }
  };

  const handleReturn = async (taskId) => {
    setActionLoading("return");
    try {
      // 1. Mark task as returned (with note)
      await fetch(`${API}/api/tasks/${taskId}/return`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ note: returnNote }),
      });

      // 2. Build revision post payload — upload files first, then post one rich comment
      const uploadedFiles = [];
      for (const file of returnFiles) {
        const fd = new FormData();
        fd.append("files", file);
        try {
          const res = await fetch(`${API}/api/tasks/${taskId}/comment-upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            const saved = data.files?.[0];
            if (saved) uploadedFiles.push({
              name: saved.originalname || file.name,
              url: saved.url || "",
              isImg: /\.(jpg|jpeg|png|gif|webp)$/i.test(saved.originalname || file.name),
              size: file.size,
            });
          }
        } catch { /* skip individual failed upload */ }
      }

      // 3. Post a single __revision__ comment carrying note + file metadata
      const revisionPayload = { note: returnNote.trim(), files: uploadedFiles };
      await fetch(`${API}/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: `__revision__${JSON.stringify(revisionPayload)}` }),
      });

      // Socket echo (task:comment_added) will deliver the confirmed comment in real-time.
      // No optimistic insert needed here — the POST already completed before we reach this line,
      // so adding a _pending copy would always appear AFTER the real one arrives.

      setReturnNote(""); setShowReturnBox(false);
      returnFilePreviews.forEach(u => URL.revokeObjectURL(u));
      setReturnFiles([]); setReturnFilePreviews([]);
      pushToast("Task returned", "Faculty has been notified to revise.");
      fetchTasks();
    } catch { pushToast("Error", "Could not return task.", "error"); }
    finally   { setActionLoading(null); }
  };

  const handlePostComment = async () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    if (!selected) return;
    const content = comment.trim();
    setComment("");
    const filesToSend = [...commentFiles];
    commentFilePreviews.forEach(url => URL.revokeObjectURL(url));
    setCommentFiles([]);
    setCommentFilePreviews([]);

    // Optimistic append for text
    if (content) {
      const optimistic = { content, sender_name: user.full_name || user.username || "You", created_at: new Date().toISOString(), _pending: true };
      setSelected(prev => ({ ...prev, comments: [...(prev.comments || []), optimistic] }));
    }

    try {
      if (content) {
        await fetch(`${API}/api/tasks/${selected.id}/comments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
      }
      for (const file of filesToSend) {
        const fd = new FormData();
        fd.append("files", file);
        try {
          const uploadRes = await fetch(`${API}/api/tasks/${selected.id}/comment-upload`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const saved    = uploadData.files?.[0];
            const fileUrl  = saved?.url          || `/uploads/tasks/${file.name}`;
            const fileName = saved?.originalname || file.name;
            const isImg    = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
            const attachContent = `__attachment__${JSON.stringify({ name: fileName, isImg, url: fileUrl })}`;

            // Optimistically show the attachment in the discussion immediately
            const optimisticAttach = {
              content: attachContent,
              sender_name: user.full_name || user.username || "You",
              created_at: new Date().toISOString(),
              _pending: true,
            };
            setSelected(prev => prev ? { ...prev, comments: [...(prev.comments || []), optimisticAttach] } : prev);

            await fetch(`${API}/api/tasks/${selected.id}/comments`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ content: attachContent }),
            });
          } else {
            pushToast("Upload failed", `Could not upload ${file.name}`, "error");
          }
        } catch {
          pushToast("Upload error", `Failed to send ${file.name}`, "error");
        }
      }
      // Single fetchTasks after all files are done to sync state cleanly
      if (filesToSend.length > 0) fetchTasks();
    } catch { pushToast("Error", "Comment could not be sent.", "error"); }
  };

  // Join/leave task room so typing events are scoped correctly
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (selected?.id) socket.emit("join_task", { taskId: selected.id });
    setTypingUsers([]);
    return () => { if (selected?.id) socket.emit("leave_task", { taskId: selected.id }); };
  }, [selected?.id]);

  const emitTyping = useCallback((isTyping) => {
    const socket = socketRef.current;
    if (!socket || !selected) return;
    socket.emit(isTyping ? "typing" : "stop_typing", {
      taskId: selected.id,
      name: user.full_name || user.username || "Someone",
    });
  }, [selected, user]);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2500);
  };

  const handleMarkDone = async () => {
    if (!checkedIds.length) return;
    await Promise.all(checkedIds.map(id =>
      fetch(`${API}/api/tasks/${id}/done`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
    ));
    setCheckedIds([]); setSelectAll(false); fetchTasks();
  };

  const handleArchive = async () => {
    if (!checkedIds.length) return;
    await Promise.all(checkedIds.map(id =>
      fetch(`${API}/api/tasks/${id}/archive`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
    ));
    setCheckedIds([]); setSelectAll(false); fetchTasks();
  };

  const toggleCheck  = (id) => setCheckedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const fmtDate      = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const fmtDateTime  = d => d ? new Date(d).toLocaleString("en-US",  { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  const filteredTasks = tasks.filter(t => {
    const q = search.toLowerCase();
    return !q || `${t.tracking_id} ${t.title} ${t.assigned_to_name}`.toLowerCase().includes(q);
  });
  const pagedTasks      = filteredTasks.slice((taskPage - 1) * PER_PAGE, taskPage * PER_PAGE);
  const totalTaskPages  = Math.max(1, Math.ceil(filteredTasks.length / PER_PAGE));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-4px); opacity:1; } }
        .task-row:hover { background: #fafafa !important; }
        .action-btn:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        * { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
      `}</style>

      {/* Toast stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

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
          
          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-designer")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={true} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />}   label="Help & Support" onClick={() => {}} />
          <SbItem icon={<Icon.Logout />} label="Logout"         onClick={handleLogout} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "white" }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, width: "100%" }}>
            <LiveDot connected={socketConnected} />
          </div>
        </TopBar>

        {/* Page Body */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header + Stats + Filters */}
          <div style={{ padding: "20px 24px 0", background: "white", borderBottom: "1px solid #f3f4f6" }}>

            {/* Page Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 3px" }}>Tasks Assigned</h1>
                <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Track tasks you assigned to faculty — review submissions, approve, or return for revision.</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                  <Icon.Download /> Export CSV
                </button>
                <button onClick={() => navigate("/assign-task")}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 16px", borderRadius: 8, border: "none", background: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "white" }}>
                  <Icon.Plus color="white" size={12} /> Assign New Task
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
              {[
                { label: "Total Assigned",  value: stats.total,           icon: <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed"  strokeWidth="1.5" width="16" height="16"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>,                                                                           bg: "#ede9fe" },
                { label: "For Approval",    value: stats.pendingApproval, icon: <svg viewBox="0 0 16 16" fill="none" stroke="#d97706"  strokeWidth="1.5" width="16" height="16"><circle cx="8" cy="8" r="6"/><path d="M8 4v4l2 2" strokeLinecap="round"/></svg>,                                                  bg: "#fef3c7" },
                { label: "Submitted",       value: stats.submitted,       icon: <svg viewBox="0 0 16 16" fill="none" stroke="#059669"  strokeWidth="1.5" width="16" height="16"><path d="M2 12V4l6-2 6 2v8l-6 2-6-2z"/><path d="M8 2v12M2 6l6 2 6-2" strokeLinecap="round"/></svg>,                            bg: "#d1fae5" },
                { label: "Overdue",         value: stats.overdue,         icon: <svg viewBox="0 0 16 16" fill="none" stroke="#dc2626"  strokeWidth="1.5" width="16" height="16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10v1" strokeLinecap="round"/></svg>,                                              bg: "#fee2e2" },
              ].map(({ label, value, icon, bg }) => (
                <div key={label} style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#111" }}>{loading ? "—" : (value ?? 0)}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "7px 12px" }}>
                <Icon.Search />
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setTaskPage(1); }} placeholder="Search by tracking #, keyword..."
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12, color: "#374151" }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><rect x="2" y="3" width="12" height="11" rx="1"/><path d="M5 1v3M11 1v3M2 7h12"/></svg>
                <span style={{ color: "#888" }}>Date Range</span>
                <input type="date" value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", cursor: "pointer", color: "#374151" }} />
              </div>
              {[
                { label: "Priority", value: priorityFilter, set: setPriorityFilter, opts: ["All","High","Medium","Low"] },
                { label: "Status",   value: statusFilter,   set: setStatusFilter,   opts: ["All","Pending","For Approval","In Progress","Approved","Returned","Overdue","Done"] },
                { label: "Doc Type", value: docTypeFilter,  set: setDocTypeFilter,  opts: ["All","Financial","Legal","Sales","HR","Operations"] },
              ].map(({ label, value, set, opts }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", fontSize: 12 }}>
                  <Icon.Filter />
                  <select value={value} onChange={e => { set(e.target.value); setTaskPage(1); }} style={{ border: "none", background: "transparent", fontSize: 12, outline: "none", cursor: "pointer", color: "#374151" }}>
                    {opts.map(o => <option key={o} value={o}>{o === "All" ? label : o}</option>)}
                  </select>
                </div>
              ))}
              {(statusFilter !== "All" || priorityFilter !== "All" || docTypeFilter !== "All" || dateRange) && (
                <button onClick={() => { setStatusFilter("All"); setPriorityFilter("All"); setDocTypeFilter("All"); setDateRange(""); }}
                  style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, background: "none", border: "none", cursor: "pointer", padding: "7px 10px" }}>
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Task Feed + Detail */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* LEFT: Task Feed */}
            <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid #f0f0f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Feed header */}
              <div style={{ padding: "14px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>Assigned Tasks</span>
                  <span style={{ background: "#7c3aed", color: "white", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20 }}>{filteredTasks.length}</span>
                  {Object.keys(newSubmissions).length > 0 && (
                    <span style={{ background: "#ef4444", color: "white", fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, animation: "pulse 1.5s infinite" }}>
                      {Object.keys(newSubmissions).length} new
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid #f5f5f5", background: "#fafafa" }}>
                <input type="checkbox" checked={selectAll}
                  onChange={e => { setSelectAll(e.target.checked); setCheckedIds(e.target.checked ? filteredTasks.map(t => t.id) : []); }}
                  style={{ accentColor: "#7c3aed" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: 0.5 }}>SELECT ALL</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                  <button onClick={handleMarkDone} disabled={!checkedIds.length}
                    style={{ fontSize: 11, fontWeight: 700, color: checkedIds.length ? "#059669" : "#bbb", background: "none", border: "none", cursor: checkedIds.length ? "pointer" : "default" }}>Mark Done</button>
                  <button onClick={handleArchive} disabled={!checkedIds.length}
                    style={{ fontSize: 11, fontWeight: 700, color: checkedIds.length ? "#374151" : "#bbb", background: "none", border: "none", cursor: checkedIds.length ? "pointer" : "default" }}>Archive</button>
                </div>
              </div>

              {/* Task rows */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? (
                  <div style={{ padding: 32, textAlign: "center", color: "#aaa", fontSize: 12 }}>Loading tasks...</div>
                ) : pagedTasks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                    <div style={{ fontSize: 13, color: "#aaa", fontWeight: 600 }}>No assigned tasks found</div>
                    <div style={{ fontSize: 11, color: "#ccc", marginTop: 4 }}>Try adjusting your filters or assign a new task</div>
                  </div>
                ) : pagedTasks.map(task => {
                  const hasNew = !!newSubmissions[task.id];
                  const isForApproval = task.status?.toLowerCase() === "for approval";
                  return (
                    <div key={task.id}
                      className="task-row"
                      onClick={() => { setSelected(task); fetchSelectedTask(task.id); setNewSubmissions(prev => { const n = { ...prev }; delete n[task.id]; return n; }); setActiveTab("info"); setShowReturnBox(false); }}
                      style={{
                        padding: "12px 16px",
                        borderBottom: "1px solid #f5f5f5",
                        cursor: "pointer",
                        background: selected?.id === task.id ? "#faf5ff" : "white",
                        borderLeft: selected?.id === task.id ? "3px solid #7c3aed" : hasNew ? "3px solid #ef4444" : "3px solid transparent",
                        transition: "all 0.1s",
                        position: "relative",
                      }}
                    >
                      {hasNew && (
                        <div style={{ position: "absolute", top: 10, right: 10, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div onClick={e => { e.stopPropagation(); toggleCheck(task.id); }} style={{ paddingTop: 2 }}>
                          <input type="checkbox" checked={checkedIds.includes(task.id)} onChange={() => toggleCheck(task.id)} style={{ accentColor: "#7c3aed" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <span style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700 }}>{task.tracking_id}</span>
                            <span style={{ fontSize: 10, color: task.deadline && new Date(task.deadline) < new Date() ? "#dc2626" : "#aaa" }}>
                              {fmtDate(task.deadline || task.created_at)}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111", marginBottom: 4, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {task.title || "(No title)"}
                          </div>
                          {/* Assigned to faculty */}
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
                              {(task.assigned_to_name?.[0] || "?").toUpperCase()}
                            </div>
                            <span style={{ fontSize: 11, color: "#666" }}>{task.assigned_to_name || "Unassigned"}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {task.priority && <Badge label={task.priority} />}
                            {task.status   && (
                              <Badge label={isForApproval ? "For Approval" : task.status} />
                            )}
                            {isForApproval && (
                              <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                NEEDS REVIEW
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "#888" }}>
                  {filteredTasks.length === 0 ? "0 tasks" : `${Math.min((taskPage-1)*PER_PAGE+1, filteredTasks.length)}–${Math.min(taskPage*PER_PAGE, filteredTasks.length)} of ${filteredTasks.length}`}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setTaskPage(p => Math.max(1,p-1))} disabled={taskPage===1}
                    style={{ width: 24, height: 24, border: "1px solid #e5e7eb", borderRadius: 5, background: "white", cursor: taskPage===1?"not-allowed":"pointer", display:"flex",alignItems:"center",justifyContent:"center", opacity: taskPage===1?0.4:1 }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M10 12L6 8l4-4"/></svg>
                  </button>
                  <button onClick={() => setTaskPage(p => Math.min(totalTaskPages,p+1))} disabled={taskPage===totalTaskPages}
                    style={{ width: 24, height: 24, border: "1px solid #e5e7eb", borderRadius: 5, background: "white", cursor: taskPage===totalTaskPages?"not-allowed":"pointer", display:"flex",alignItems:"center",justifyContent:"center", opacity: taskPage===totalTaskPages?0.4:1 }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M6 12l4-4-4-4"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Task Detail Panel */}
            <div style={{ flex: 1, overflow: "hidden", background: "white", display: "flex", flexDirection: "column" }}>
              {!selected ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                  <svg viewBox="0 0 48 48" fill="none" stroke="#e5e7eb" strokeWidth="1.5" width="56" height="56"><rect x="6" y="8" width="36" height="32" rx="3"/><path d="M14 16h20M14 22h20M14 28h12"/><circle cx="36" cy="34" r="8" fill="white" stroke="#e5e7eb"/><path d="M33 34l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                  <div style={{ fontSize: 14, color: "#aaa", fontWeight: 600 }}>Select a task to review</div>
                  <div style={{ fontSize: 12, color: "#ccc" }}>You'll see task details, submitted documents, and faculty activity here</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>

                  {/* Detail top bar */}
                  <div style={{ padding: "14px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, background: "#ede9fe", color: "#7c3aed", padding: "3px 10px", borderRadius: 20, fontWeight: 700 }}>{selected.tracking_id}</span>
                      <span style={{ fontSize: 11, color: "#aaa" }}>Created on {fmtDate(selected.created_at)}</span>
                      {newSubmissions[selected.id] && (
                        <span style={{ fontSize: 10, background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: 20, fontWeight: 700, animation: "pulse 1.5s infinite" }}>
                          📥 New submission
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon.Share /></button>
                      <button style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Icon.More /></button>
                    </div>
                  </div>

                  {/* Detail body — MyTasks-style flat layout */}
                  <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

                    {/* Center content — only this column scrolls */}
                    <div style={{ flex: 1, padding: "20px 24px", minWidth: 0, borderRight: "1px solid #f0f0f0", overflowY: "auto", height: "100%" }}>
                      <h2 style={{ fontSize: 19, fontWeight: 800, color: "#111", margin: "0 0 18px", lineHeight: 1.35 }}>{selected.title || "(No title)"}</h2>

                      {/* TASK INFORMATION */}
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>Task Information</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 24, padding: "0 0 24px", borderBottom: "1px solid #f0f0f0" }}>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Assigned To</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                              {(selected.assigned_to_name?.[0] || "?").toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{selected.assigned_to_name || "—"}</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Document Type</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{selected.doc_type || "—"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Priority Level</div>
                          <Badge label={selected.priority || "—"} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Status</div>
                          <Badge label={selected.status || "—"} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Due Date</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{fmtDate(selected.deadline)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "#aaa", marginBottom: 5 }}>Project Category</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{selected.category || "—"}</div>
                        </div>
                      </div>

                      {/* ── ACTIVITY FEED ─────────────────────────────────────── */}
                      {/* Section label */}
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>Activity</div>

                      {/* POST 1 — Initial task brief (posted by the assigning officer) */}
                      {selected.attachments?.length > 0 && (() => {
                        const assignerName    = selected.assigned_by_name || user.full_name || user.username || "You";
                        const assignerInitial = (assignerName[0] || "?").toUpperCase();
                        const assignedAt      = selected.created_at;
                        const docType         = selected.doc_type || null;
                        return (
                          <div style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            background: "white",
                            marginBottom: 12,
                            overflow: "hidden",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          }}>
                            {/* Post header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: "50%",
                                  background: "#1e1b2e", color: "white",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 13, fontWeight: 700, flexShrink: 0,
                                  border: "2px solid #ede9fe",
                                }}>
                                  {assignerInitial}
                                </div>
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{assignerName}</span>
                                    <span style={{ fontSize: 10, background: "#1e1b2e", color: "white", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                                      {user.role === "program_chair" ? "Program Chair" : "Admin"}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                    <span style={{ fontSize: 10, color: "#888" }}>
                                      {assignedAt ? fmtDateTime(assignedAt) : "Just now"}
                                    </span>
                                    <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                      Version 1.0
                                    </span>
                                    <span style={{ fontSize: 9, background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                      Status: Pending
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4, display: "flex", alignItems: "center" }}>
                                <Icon.More />
                              </button>
                            </div>

                            {/* Divider */}
                            <div style={{ height: 1, background: "#f3f4f6", margin: "0 16px" }} />

                            {/* Document name as body text */}
                            {(selected.notes || docType) && (
                              <div style={{ padding: "10px 16px 2px", fontSize: 13, color: "#374151", lineHeight: 1.65, whiteSpace: selected.notes ? "pre-wrap" : "normal" }}>
                                {selected.notes ? selected.notes : (
                                  <>Task brief attached for <strong>{docType}</strong>. Please review and submit your completed document by the due date.</>
                                )}
                              </div>
                            )}

                            {/* File chips */}
                            <div style={{ padding: "12px 16px 14px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                              {selected.attachments.map((a, i) => {
                                const url  = `${API}${a.file_url || a.url || ""}`;
                                const name = a.file_name || a.name || "file";
                                const ext  = name.split(".").pop().toLowerCase();
                                const isPdf  = ext === "pdf";
                                const isXlsx = ["xlsx","xls","csv"].includes(ext);
                                const isImg  = ["jpg","jpeg","png","gif","webp"].includes(ext);
                                const sizeBytes = a.size || a.file_size || 0;
                                const sizeLabel = sizeBytes >= 1_048_576
                                  ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
                                  : sizeBytes > 0 ? `${(sizeBytes / 1024).toFixed(0)} KB` : null;
                                return (
                                  <button key={i} onClick={() => setFileViewer({ url, name, isPdf, isImg })}
                                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fafafa", cursor: "pointer", textAlign: "left", minWidth: 180, transition: "border-color 0.15s" }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = "#e5e7eb"}
                                  >
                                    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: isPdf ? "#fee2e2" : isXlsx ? "#d1fae5" : isImg ? "#dbeafe" : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <span style={{ fontSize: 14 }}>{isPdf ? "📄" : isXlsx ? "📊" : isImg ? "🖼️" : "📎"}</span>
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: "#111", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                                      <div style={{ fontSize: 10, color: "#7c3aed", marginTop: 2, fontWeight: 600 }}>{sizeLabel || "Click to preview"}</div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* POSTS 2+ — Faculty submissions & revision requests, interleaved chronologically */}
                      {(() => {
                        const submissions = selected.submissions || [];
                        const revisionComments = (selected.comments || []).filter(c => c.content?.startsWith("__revision__"));
                        // Note-only submissions (no files) are persisted only as "📤 Task submitted:" comments
                        const submissionNoteComments = (selected.comments || []).filter(c => c.content?.startsWith("📤 Task submitted:"));

                        if (submissions.length === 0 && revisionComments.length === 0 && submissionNoteComments.length === 0) return null;

                        // Group submissions by submission_group_id or minute-level timestamp
                        const subGroups = submissions.reduce((acc, s) => {
                          const key = s.submission_group_id
                            || (s.submitted_at ? new Date(s.submitted_at).toISOString().slice(0, 16) : "initial");
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(s);
                          return acc;
                        }, {});

                        const facultyName = selected.assigned_to_name || "Faculty";
                        const facultyInitial = (facultyName[0] || "?").toUpperCase();

                        // Determine which submission-note comments already correspond to a file group
                        // (so we don't double-post the same note both standalone AND inside a file post)
                        const usedCommentIds = new Set();
                        Object.values(subGroups).forEach(files => {
                          const firstFile = files[0];
                          const groupTs = firstFile?.submitted_at ? new Date(firstFile.submitted_at).getTime() : null;
                          if (groupTs == null) return;
                          let best = null;
                          submissionNoteComments.forEach(c => {
                            if (usedCommentIds.has(c.id)) return;
                            const cts = c.created_at ? new Date(c.created_at).getTime() : null;
                            if (cts == null) return;
                            if (Math.abs(cts - groupTs) <= 60000) {
                              if (!best || Math.abs(cts - groupTs) < Math.abs(best.cts - groupTs)) best = { c, cts };
                            }
                          });
                          if (best) usedCommentIds.add(best.c.id);
                        });

                        // Build a unified chronological event list
                        const events = [];

                        Object.entries(subGroups).forEach(([groupKey, files], gi) => {
                          const firstFile = files[0];
                          const ts = firstFile?.submitted_at ? new Date(firstFile.submitted_at).getTime() : 0;
                          events.push({ type: "submission", groupKey, files, gi, ts });
                        });

                        // Remaining submission-note comments (no associated file group) become note-only posts
                        submissionNoteComments.forEach((c, ci) => {
                          if (usedCommentIds.has(c.id)) return;
                          const ts = c._pending ? Date.now() : (c.created_at ? new Date(c.created_at).getTime() : 0);
                          const note = c.content.replace("📤 Task submitted:", "").trim();
                          events.push({
                            type: "submission",
                            groupKey: `note_${c.id || ci}`,
                            files: [{
                              file_name: null, name: null, file_url: null, url: null, size: 0,
                              note: note || null,
                              submitted_at: c.created_at,
                              _noteOnly: true,
                            }],
                            gi: -1,
                            ts,
                          });
                        });

                        revisionComments.forEach((c, i) => {
                          const ts = c._pending ? Date.now() : (c.created_at ? new Date(c.created_at).getTime() : 0);
                          events.push({ type: "revision", comment: c, i, ts });
                        });

                        events.sort((a, b) => a.ts - b.ts);

                        // Track submission index across sorted events for version numbering
                        let subVersionCounter = 0;

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                            {events.map((event, eventIdx) => {
                              if (event.type === "revision") {
                                const c = event.comment;
                                let revisionMeta = null;
                                try { revisionMeta = JSON.parse(c.content.replace("__revision__", "")); } catch {}
                                if (!revisionMeta) return null;
                                const senderInitial = (c.sender_name?.[0] || "?").toUpperCase();
                                return (
                                  <div key={`rev-${event.i}`} style={{
                                    border: "1px solid #fecaca",
                                    borderRadius: 12,
                                    background: "#fff8f8",
                                    overflow: "hidden",
                                    boxShadow: "0 1px 4px rgba(220,38,38,0.07)",
                                    opacity: c._pending ? 0.6 : 1,
                                    transition: "opacity 0.3s",
                                  }}>
                                    {/* Card header */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0, border: "2px solid #fecaca" }}>
                                          {senderInitial}
                                        </div>
                                        <div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{c.sender_name}</span>
                                            <span style={{ fontSize: 10, background: "#dc2626", color: "white", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                                              {user.role === "program_chair" ? "Program Chair" : "Admin"}
                                            </span>
                                            <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>
                                              ↺ Revision Request
                                            </span>
                                          </div>
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                            <span style={{ fontSize: 10, color: "#888" }}>{c._pending ? "Sending..." : fmtDateTime(c.created_at)}</span>
                                            <span style={{ fontSize: 9, background: "#fee2e2", color: "#991b1b", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>Status: Returned</span>
                                          </div>
                                        </div>
                                      </div>
                                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4, display: "flex", alignItems: "center" }}>
                                        <Icon.More />
                                      </button>
                                    </div>
                                    {/* Divider */}
                                    <div style={{ height: 1, background: "#fecaca", margin: "0 16px" }} />
                                    {/* Note body */}
                                    {revisionMeta.note && (
                                      <div style={{ padding: "10px 16px 2px", fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                                        {revisionMeta.note}
                                      </div>
                                    )}
                                    {/* Attached reference files */}
                                    {revisionMeta.files?.length > 0 && (
                                      <div style={{ padding: "8px 16px 14px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                                        {revisionMeta.files.map((f, fi) => {
                                          const url = `${API}${f.url}`;
                                          const ext = f.name?.split(".").pop().toLowerCase();
                                          const isPdf  = ext === "pdf";
                                          const isXlsx = ["xlsx","xls","csv"].includes(ext);
                                          const isImg  = f.isImg || ["jpg","jpeg","png","gif","webp"].includes(ext);
                                          const sizeLabel = f.size >= 1_048_576 ? `${(f.size/1_048_576).toFixed(1)} MB` : f.size > 0 ? `${(f.size/1024).toFixed(0)} KB` : null;
                                          return isImg ? (
                                            <img key={fi} src={url} alt={f.name}
                                              style={{ maxWidth: 160, maxHeight: 120, borderRadius: 8, border: "1px solid #fecaca", cursor: "pointer", objectFit: "cover" }}
                                              onClick={() => setFileViewer({ url, name: f.name, isPdf: false, isImg: true })} />
                                          ) : (
                                            <button key={fi}
                                              onClick={() => setFileViewer({ url, name: f.name, isPdf, isImg: false })}
                                              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid #fecaca", borderRadius: 10, background: "white", cursor: "pointer", textAlign: "left", minWidth: 176, transition: "border-color 0.15s" }}
                                              onMouseEnter={e => e.currentTarget.style.borderColor="#dc2626"}
                                              onMouseLeave={e => e.currentTarget.style.borderColor="#fecaca"}
                                            >
                                              <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: isPdf ? "#fee2e2" : isXlsx ? "#d1fae5" : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <span style={{ fontSize: 14 }}>{isPdf ? "📄" : isXlsx ? "📊" : "📎"}</span>
                                              </div>
                                              <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, color: "#111", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                                                <div style={{ fontSize: 10, color: "#dc2626", marginTop: 2, fontWeight: 600 }}>{sizeLabel || "Click to preview"}</div>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {!revisionMeta.note && !revisionMeta.files?.length && (
                                      <div style={{ padding: "10px 16px 14px", fontSize: 12, color: "#aaa", fontStyle: "italic" }}>No additional notes provided.</div>
                                    )}
                                  </div>
                                );
                              }

                              // type === "submission"
                              const { groupKey, files } = event;
                              subVersionCounter += 1;
                              const versionNum = subVersionCounter;
                                const firstFile = files[0];
                                const submittedAt = firstFile?.submitted_at;
                                const note = firstFile?.note || selected.submit_note || null;
                                const isNew = submittedAt && (Date.now() - new Date(submittedAt).getTime()) < 3_600_000;
                                const isNoteOnly = firstFile?._noteOnly;

                                // Resolve version label with document name if present
                                const docVersionLabel = firstFile?.version_label || null;

                                return (
                                  <div key={groupKey} style={{
                                    border: `1px solid ${isNew ? "#d8b4fe" : "#e9d5ff"}`,
                                    borderRadius: 12,
                                    background: isNew ? "#fdf9ff" : "white",
                                    overflow: "hidden",
                                    boxShadow: isNew ? "0 0 0 3px rgba(124,58,237,0.07)" : "0 1px 4px rgba(0,0,0,0.04)",
                                    transition: "box-shadow 0.2s",
                                  }}>
                                    {/* Post header — faculty avatar + name + role + timestamp */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        {/* Avatar */}
                                        <div style={{
                                          width: 36, height: 36, borderRadius: "50%",
                                          background: "#ede9fe", color: "#5b21b6",
                                          display: "flex", alignItems: "center", justifyContent: "center",
                                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                                          border: "2px solid #f3f0ff",
                                        }}>
                                          {facultyInitial}
                                        </div>
                                        <div>
                                          {/* Name + role badge */}
                                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{facultyName}</span>
                                            <span style={{ fontSize: 10, background: "#ede9fe", color: "#5b21b6", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>Faculty</span>
                                            {isNew && (
                                              <span style={{ fontSize: 9, background: "#ef4444", color: "white", padding: "2px 7px", borderRadius: 20, fontWeight: 700 }}>NEW</span>
                                            )}
                                          </div>
                                          {/* Timestamp + version + status */}
                                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                                            <span style={{ fontSize: 10, color: "#888" }}>
                                              {submittedAt ? fmtDateTime(submittedAt) : "Just now"}
                                            </span>
                                            <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                              {docVersionLabel || `Version ${versionNum}.0`}
                                            </span>
                                            <span style={{ fontSize: 9, background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: 20, fontWeight: 700 }}>
                                              Status: {selected.status || "Pending"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <button style={{ background: "none", border: "none", cursor: "pointer", color: "#aaa", padding: 4, display: "flex", alignItems: "center" }}>
                                        <Icon.More />
                                      </button>
                                    </div>

                                    {/* Divider */}
                                    <div style={{ height: 1, background: "#f3f0ff", margin: "0 16px" }} />

                                    {/* Submission body — note or default submission message */}
                                    <div style={{ padding: "10px 16px 2px", fontSize: 13, color: "#374151", lineHeight: 1.65 }}>
                                      {note || (
                                        <span>Submitted completed document{files.length > 1 ? "s" : ""} for review.</span>
                                      )}
                                    </div>

                                    {/* File attachment cards inside the post — hidden for note-only entries */}
                                    {!isNoteOnly && (
                                    <div style={{ padding: "12px 16px 14px", display: "flex", flexWrap: "wrap", gap: 10 }}>
                                      {files.map((a, i) => {
                                        const url  = a._pending ? null : `${API}${a.file_url || a.url || ""}`;
                                        const name = a.file_name || a.name || "file";
                                        const ext  = name.split(".").pop().toLowerCase();
                                        const isPdf  = ext === "pdf";
                                        const isXlsx = ["xlsx","xls","csv"].includes(ext);
                                        const isImg  = ["jpg","jpeg","png","gif","webp"].includes(ext);
                                        const sizeBytes = a.size || a.file_size || 0;
                                        const sizeLabel = sizeBytes >= 1_048_576
                                          ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
                                          : sizeBytes > 0 ? `${(sizeBytes / 1024).toFixed(0)} KB` : null;
                                        return (
                                          <button key={i}
                                            onClick={() => !a._pending && url && setFileViewer({ url, name, isPdf, isImg })}
                                            style={{
                                              display: "flex", alignItems: "center", gap: 10,
                                              padding: "10px 14px",
                                              border: `1px solid ${a._pending ? "#e9d5ff" : "#e5e7eb"}`,
                                              borderRadius: 10,
                                              background: a._pending ? "#faf5ff" : "#fafafa",
                                              cursor: a._pending ? "default" : "pointer",
                                              textAlign: "left", minWidth: 176,
                                              opacity: a._pending ? 0.7 : 1,
                                              transition: "border-color 0.15s",
                                            }}
                                            onMouseEnter={e => { if (!a._pending) e.currentTarget.style.borderColor = "#7c3aed"; }}
                                            onMouseLeave={e => { if (!a._pending) e.currentTarget.style.borderColor = "#e5e7eb"; }}
                                          >
                                            <div style={{
                                              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                              background: isPdf ? "#fee2e2" : isXlsx ? "#d1fae5" : isImg ? "#dbeafe" : "#ede9fe",
                                              display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                              <span style={{ fontSize: 14 }}>{isPdf ? "📄" : isXlsx ? "📊" : isImg ? "🖼️" : "📎"}</span>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                              <div style={{ fontSize: 12, fontWeight: 700, color: "#111", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                                              <div style={{ fontSize: 10, color: a._pending ? "#a78bfa" : "#7c3aed", marginTop: 2, fontWeight: 600 }}>
                                                {a._pending ? "Uploading…" : (sizeLabel || "Click to preview")}
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    )}
                                    {isNoteOnly && <div style={{ paddingBottom: 4 }} />}
                                  </div>
                                );
                            })}
                          </div>
                        );
                      })()}

                      {/* APPROVE / RETURN ACTIONS */}
                      {(() => {
                        const submittedStatus = ["for approval", "submitted"].includes(selected.status?.toLowerCase());
                        const actionsLocked = !submittedStatus;
                        return (
                      <div style={{ marginBottom: 24, padding: "16px", background: actionsLocked ? "#f9fafb" : "#f8f5ff", border: `1px solid ${actionsLocked ? "#e5e7eb" : "#e9d5ff"}`, borderRadius: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: actionsLocked ? "#9ca3af" : "#7c3aed", textTransform: "uppercase" }}>Task Actions</div>
                          {actionsLocked && (
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#9ca3af", background: "#f3f4f6", border: "1px solid #e5e7eb", borderRadius: 20, padding: "3px 10px" }}>
                              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11"><rect x="4" y="7" width="8" height="7" rx="1"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round"/></svg>
                              Awaiting faculty submission
                            </span>
                          )}
                        </div>
                        {actionsLocked && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 12 }}>
                            <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10v1" strokeLinecap="round"/></svg>
                            <span style={{ fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
                              These actions are locked until the assigned faculty member submits their work. Current status: <strong>{selected.status || "—"}</strong>
                            </span>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: showReturnBox ? 14 : 0 }}>
                          <button
                            onClick={() => !actionsLocked && handleApprove(selected.id)}
                            disabled={actionsLocked || actionLoading === "approve"}
                            title={actionsLocked ? "Faculty must submit before you can approve" : "Approve this task"}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: actionsLocked ? "#d1d5db" : "#7c3aed", color: "white", fontSize: 13, fontWeight: 700, cursor: actionsLocked || actionLoading === "approve" ? "not-allowed" : "pointer", opacity: actionLoading === "approve" ? 0.7 : 1 }}
                            onMouseEnter={e => { if (!actionsLocked && actionLoading !== "approve") e.currentTarget.style.background = "#6d28d9"; }}
                            onMouseLeave={e => { if (!actionsLocked && actionLoading !== "approve") e.currentTarget.style.background = "#7c3aed"; }}
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" width="13" height="13"><path d="M13 5l-7 7-3-3" strokeLinecap="round"/></svg>
                            {actionLoading === "approve" ? "Approving..." : "Approve Task"}
                          </button>
                          <button
                            onClick={() => { if (!actionsLocked) { setShowReturnBox(v => !v); setReturnNote(""); } }}
                            disabled={actionsLocked || actionLoading === "return"}
                            title={actionsLocked ? "Faculty must submit before you can return" : "Return to faculty for revision"}
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: `1px solid ${actionsLocked ? "#e5e7eb" : "#fecaca"}`, background: actionsLocked ? "#f9fafb" : showReturnBox ? "#fef2f2" : "white", color: actionsLocked ? "#9ca3af" : "#dc2626", fontSize: 13, fontWeight: 700, cursor: actionsLocked ? "not-allowed" : "pointer" }}
                          >
                            <Icon.Return /> Return to Faculty
                          </button>
                          <button
                            title="Reassign this task to another faculty member"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                          >
                            <Icon.Reassign /> Reassign
                          </button>
                        </div>

                        {/* Return note inline */}
                        {showReturnBox && !actionsLocked && (
                          <div style={{ marginTop: 4 }}>
                            <textarea
                              value={returnNote}
                              onChange={e => setReturnNote(e.target.value)}
                              rows={3}
                              placeholder="Explain what the faculty needs to revise or resubmit..."
                              style={{ width: "100%", padding: "10px 12px", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#111", resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, background: "white", boxSizing: "border-box", outline: "none", marginBottom: 10 }}
                            />

                            {/* File drop zone */}
                            <div
                              onDragOver={e => { e.preventDefault(); setReturnDragOver(true); }}
                              onDragLeave={() => setReturnDragOver(false)}
                              onDrop={e => {
                                e.preventDefault(); setReturnDragOver(false);
                                const dropped = Array.from(e.dataTransfer.files);
                                const urls = dropped.map(f => URL.createObjectURL(f));
                                setReturnFiles(prev => [...prev, ...dropped]);
                                setReturnFilePreviews(prev => [...prev, ...urls]);
                              }}
                              onClick={() => returnFileInputRef.current?.click()}
                              style={{
                                border: `2px dashed ${returnDragOver ? "#dc2626" : "#fca5a5"}`,
                                borderRadius: 8, padding: "12px", background: returnDragOver ? "#fff1f2" : "#fff",
                                cursor: "pointer", textAlign: "center", marginBottom: 10, transition: "all 0.15s",
                              }}
                            >
                              <input
                                ref={returnFileInputRef}
                                type="file"
                                multiple
                                style={{ display: "none" }}
                                onChange={e => {
                                  const picked = Array.from(e.target.files);
                                  const urls = picked.map(f => URL.createObjectURL(f));
                                  setReturnFiles(prev => [...prev, ...picked]);
                                  setReturnFilePreviews(prev => [...prev, ...urls]);
                                  e.target.value = "";
                                }}
                              />
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#dc2626" }}>
                                <Icon.Attach />
                                <span style={{ fontSize: 12, fontWeight: 600 }}>Attach revision notes / reference files</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#fca5a5", marginTop: 3 }}>PDF, Word, images — drag & drop or click</div>
                            </div>

                            {/* Staged file chips */}
                            {returnFiles.length > 0 && (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                                {returnFiles.map((f, i) => {
                                  const ext = f.name.split(".").pop().toLowerCase();
                                  const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
                                  const objUrl = returnFilePreviews[i];
                                  return (
                                    <div key={i} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, background: "#fff1f2", border: "1px solid #fecaca", borderRadius: 8, padding: "4px 8px 4px 6px", fontSize: 11, maxWidth: 200 }}>
                                      {isImg ? (
                                        <img src={objUrl} alt={f.name} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                                      ) : (
                                        <>
                                          <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                                          <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151", fontWeight: 600 }}>{f.name}</span>
                                        </>
                                      )}
                                      <button
                                        onClick={e => { e.stopPropagation(); URL.revokeObjectURL(returnFilePreviews[i]); setReturnFiles(p => p.filter((_, idx) => idx !== i)); setReturnFilePreviews(p => p.filter((_, idx) => idx !== i)); }}
                                        style={{ position: "absolute", top: -6, right: -6, background: "#fff", border: "1px solid #fecaca", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.15)", zIndex: 1 }}
                                      >
                                        <Icon.Close />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button onClick={() => { setShowReturnBox(false); setReturnNote(""); returnFilePreviews.forEach(u => URL.revokeObjectURL(u)); setReturnFiles([]); setReturnFilePreviews([]); }}
                                style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #e5e7eb", background: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                                Cancel
                              </button>
                              <button onClick={() => handleReturn(selected.id)} disabled={actionLoading === "return"}
                                style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#dc2626", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: actionLoading === "return" ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                                <Icon.Return />
                                {actionLoading === "return" ? "Returning..." : `Confirm Return${returnFiles.length ? ` · ${returnFiles.length} file${returnFiles.length > 1 ? "s" : ""}` : ""}`}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                        );
                      })()}

                      {/* DISCUSSION */}
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>Discussion</div>
                      <div ref={el => { if (el) el.scrollTop = el.scrollHeight; }} style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16, maxHeight: 320, overflowY: "auto" }}>
                        {(selected.comments || []).length === 0
                          ? <div style={{ fontSize: 12, color: "#ccc", fontStyle: "italic" }}>No comments yet.</div>
                          : (selected.comments || []).map((c, i) => {
                          const isAttachment = c.content?.startsWith("__attachment__");
                          const isRevision   = c.content?.startsWith("__revision__");
                          // Revision posts are shown in the Activity feed above — skip in Discussion
                          if (isRevision) return null;
                          let attachMeta  = null;
                          if (isAttachment) { try { attachMeta  = JSON.parse(c.content.replace("__attachment__", "")); } catch {} }

                          const isSubmission = c.content?.startsWith("📤 Task submitted:");

                          // If this submission was later returned for revision, show a "Returned" indicator
                          let wasReturned = false;
                          if (isSubmission && c.created_at) {
                            const cts = new Date(c.created_at).getTime();
                            wasReturned = (selected.comments || []).some(rc => {
                              if (!rc.content?.startsWith("__revision__") || !rc.created_at) return false;
                              return new Date(rc.created_at).getTime() > cts;
                            });
                          }

                          return (
                            <div key={i} style={{ display: "flex", gap: 10, opacity: c._pending ? 0.55 : 1, transition: "opacity 0.3s" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {(c.sender_name?.[0] || "?").toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{c.sender_name}</span>
                                  <span style={{ fontSize: 11, color: "#aaa" }}>{c._pending ? "Sending..." : fmtDateTime(c.created_at)}</span>
                                </div>
                                {isAttachment && attachMeta ? (
                                  attachMeta.isImg ? (
                                    <img
                                      src={`${API}${attachMeta.url}`}
                                      alt={attachMeta.name}
                                      style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "1px solid #e5e7eb", display: "block", cursor: "pointer" }}
                                      onClick={() => setFileViewer({ url: `${API}${attachMeta.url}`, name: attachMeta.name, isPdf: false, isImg: true })}
                                    />
                                  ) : (
                                    <div
                                      onClick={() => setFileViewer({ url: `${API}${attachMeta.url}`, name: attachMeta.name, isPdf: attachMeta.name?.toLowerCase().endsWith(".pdf"), isImg: false })}
                                      style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f5f3ff", border: "1px solid #e9d5ff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", maxWidth: 280 }}
                                    >
                                      <div style={{ width: 30, height: 30, background: "#ede9fe", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon.Attach />
                                      </div>
                                      <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{attachMeta.name}</div>
                                        <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 600 }}>Click to preview</div>
                                      </div>
                                    </div>
                                  )
                                ) : isSubmission ? (
                                  <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                                    fontSize: 13, color: "#374151", lineHeight: 1.6,
                                    background: wasReturned ? "#fff8f8" : "#f0fdf4",
                                    border: `1px solid ${wasReturned ? "#fecaca" : "#bbf7d0"}`,
                                    borderRadius: 8, padding: "8px 12px",
                                  }}>
                                    <span>{c.content}</span>
                                    {wasReturned && (
                                      <span style={{ flexShrink: 0, fontSize: 9, background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 20, fontWeight: 700, whiteSpace: "nowrap" }}>
                                        ↺ Returned
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{
                                    fontSize: 13, color: "#374151", lineHeight: 1.6,
                                    background: c.content?.startsWith("↺") ? "#fef2f2" : "transparent",
                                    padding: c.content?.startsWith("↺") ? "8px 12px" : 0,
                                    borderRadius: 8,
                                  }}>
                                    {c.content}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                        }
                      </div>

                      {/* Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                            {[0,1,2].map(i => (
                              <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#7c3aed", animation: "typingBounce 1.2s infinite ease-in-out", animationDelay: `${i * 0.2}s` }} />
                            ))}
                          </div>
                          <span style={{ fontSize: 11, color: "#7c3aed", fontStyle: "italic" }}>
                            {typingUsers.length === 1
                              ? `${typingUsers[0].name} is typing…`
                              : typingUsers.length === 2
                              ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
                              : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing…`}
                          </span>
                        </div>
                      )}

                      {/* Comment input */}
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                          {(user.full_name?.[0] || user.username?.[0] || "?").toUpperCase()}
                        </div>
                        <div style={{ flex: 1, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
                          <input type="text" value={comment} onChange={handleCommentChange}
                            onKeyDown={e => { if (e.key === "Enter") { emitTyping(false); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); handlePostComment(); } }}
                            placeholder="Write a comment..."
                            style={{ width: "100%", padding: "10px 14px", border: "none", outline: "none", fontSize: 13, background: "transparent", borderRadius: "10px 10px 0 0" }} />

                          {/* Staged file previews */}
                          {commentFiles.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 10px", borderTop: "1px solid #f0f0f0", background: "#fafafa" }}>
                              {commentFiles.map((f, i) => {
                                const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
                                const objUrl = commentFilePreviews[i];
                                return (
                                  <div key={i} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "4px 8px 4px 6px", fontSize: 11, maxWidth: 180 }}>
                                    {isImg ? (
                                      <img src={objUrl} alt={f.name} style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, display: "block", flexShrink: 0 }} />
                                    ) : (
                                      <>
                                        <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                                        <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#374151", fontWeight: 600, fontSize: 11 }}>{f.name}</span>
                                      </>
                                    )}
                                    <button
                                      onClick={() => {
                                        URL.revokeObjectURL(commentFilePreviews[i]);
                                        setCommentFiles(prev => prev.filter((_, idx) => idx !== i));
                                        setCommentFilePreviews(prev => prev.filter((_, idx) => idx !== i));
                                      }}
                                      style={{ position: "absolute", top: -6, right: -6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.15)", zIndex: 1 }}
                                    >
                                      <Icon.Close />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderTop: "1px solid #f0f0f0", background: "#fafafa", borderRadius: "0 0 10px 10px" }}>
                            <input
                              ref={commentFileInputRef}
                              type="file"
                              multiple
                              style={{ display: "none" }}
                              onChange={e => {
                                const newFiles = Array.from(e.target.files);
                                const newUrls  = newFiles.map(f => URL.createObjectURL(f));
                                setCommentFiles(prev => [...prev, ...newFiles]);
                                setCommentFilePreviews(prev => [...prev, ...newUrls]);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={() => commentFileInputRef.current?.click()}
                              title="Attach image or file"
                              style={{ background: "none", border: "none", cursor: "pointer", color: commentFiles.length > 0 ? "#7c3aed" : "#888", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600 }}
                            >
                              <Icon.Attach />
                              {commentFiles.length > 0 && <span style={{ fontSize: 10, background: "#7c3aed", color: "white", borderRadius: 10, padding: "1px 5px" }}>{commentFiles.length}</span>}
                            </button>
                            <button onClick={() => { emitTyping(false); if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); handlePostComment(); }}
                              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 16px", borderRadius: 7, border: "none", background: "#7c3aed", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                              ↑ Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right sidebar — timeline + faculty info */}
                    <div style={{ width: 260, flexShrink: 0, padding: "20px", overflowY: "auto", position: "sticky", top: 0, alignSelf: "flex-start", maxHeight: "100%", borderLeft: "1px solid #f0f0f0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase", marginBottom: 14 }}>Task Timeline</div>
                      <TimelineItem label="Task Created"        value={`by ${selected.assigned_by_name || "—"}`}  sub={fmtDate(selected.created_at)} dot="#7c3aed" />
                      <TimelineItem label="Assigned to Faculty" value={selected.assigned_to_name || "—"}          sub={fmtDate(selected.assigned_at || selected.created_at)} dot="#7c3aed" />
                      {selected.submitted_at && <TimelineItem label="Submitted by Faculty" value={selected.assigned_to_name || "—"} sub={fmtDateTime(selected.submitted_at)} dot="#059669" />}
                      {selected.approved_at  && <TimelineItem label="Approved"   value={`by ${selected.approved_by_name || "You"}`} sub={fmtDateTime(selected.approved_at)} dot="#059669" />}
                      {selected.returned_at  && <TimelineItem label="Returned"   value={`by ${selected.returned_by_name || "You"}`} sub={fmtDateTime(selected.returned_at)} dot="#dc2626" />}
                      <TimelineItem label="Current Status" value={selected.status || "—"} dot={selected.status?.toLowerCase() === "approved" || selected.status?.toLowerCase() === "received" ? "#059669" : selected.status?.toLowerCase() === "overdue" || selected.status?.toLowerCase() === "returned" ? "#dc2626" : "#d1d5db"} isLast />

                      {/* Faculty info card */}
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#aaa", textTransform: "uppercase", marginTop: 24, marginBottom: 10 }}>Faculty Member</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 10, border: "1px solid #f0f0f0", marginBottom: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ede9fe", color: "#5b21b6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {(selected.assigned_to_name?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>{selected.assigned_to_name || "—"}</div>
                          <div style={{ fontSize: 10, color: "#aaa" }}>{selected.assigned_to_email || "—"}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 16 }}>
                        <div style={{ padding: "8px 10px", background: "#f9fafb", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Documents</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed" }}>{selected.attachments?.length || 0}</div>
                        </div>
                        <div style={{ padding: "8px 10px", background: "#f9fafb", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                          <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>Comments</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed" }}>{selected.comments?.length || 0}</div>
                        </div>
                      </div>


                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 24px", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#aaa", background: "white", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="#aaa" strokeWidth="1.2" width="12" height="12"><path d="M8 1L1 4v5c0 4 3 6 7 7 4-1 7-3 7-7V4L8 1z"/></svg>
           © 2026 PATH Document Management System. All rights reserved.
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["HELP CENTER","API STATUS","PRIVACY POLICY","TERMS"].map(l => (
              <a key={l} href="#" style={{ color: "#aaa", textDecoration: "none", fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>

      {/* ── File Viewer Modal ── */}
      {fileViewer && (
        <>
          <div onClick={() => setFileViewer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 60, backdropFilter: "blur(3px)" }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(1000px, 94vw)", height: "min(680px, 92vh)", background: "white", zIndex: 70, display: "flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: "#1e1b2e", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{fileViewer.isPdf ? "📄" : fileViewer.isImg ? "🖼️" : "📎"}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{fileViewer.name}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={fileViewer.url} target="_blank" rel="noreferrer" style={{ padding: "6px 14px", background: "#7c3aed", color: "white", borderRadius: 7, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>↗ Open</a>
                <a href={fileViewer.url} download={fileViewer.name} style={{ padding: "6px 14px", background: "#ede9fe", color: "#7c3aed", borderRadius: 7, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>↓ Download</a>
                <button onClick={() => setFileViewer(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, color: "white", cursor: "pointer", padding: "6px 10px", fontSize: 16 }}>×</button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {fileViewer.isPdf ? (
                <iframe src={fileViewer.url} title={fileViewer.name} style={{ width: "100%", height: "100%", border: "none" }} />
              ) : fileViewer.isImg ? (
                <img src={fileViewer.url} alt={fileViewer.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 20 }} />
              ) : (
                <div style={{ textAlign: "center", color: "#aaa" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📎</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 8 }}>{fileViewer.name}</div>
                  <a href={fileViewer.url} download={fileViewer.name} style={{ padding: "10px 24px", background: "#7c3aed", color: "white", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>↓ Download File</a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}