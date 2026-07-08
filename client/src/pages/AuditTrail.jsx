import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── ROLE CONSTANTS ───────────────────────────────────────────────────────────
const AUDIT_ROLES = ["admin", "program_chair"];   // can view full audit trail
const ADMIN_ROLES = ["admin", "program_chair"];   // can see Users & Roles + Audit Trail nav items

// ─── DECODE JWT (no extra library needed) ────────────────────────────────────
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function getCurrentUser() {
  const token = localStorage.getItem("token");
  return token ? decodeToken(token) : null;
}

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

// ─── ACTION PILL ──────────────────────────────────────────────────────────────
const ACTION_STYLES = {
  DOCUMENT_CREATE: "bg-violet-100 text-violet-700",
  REGISTER: "bg-violet-100 text-violet-700",
  DOCUMENT_UPDATE: "bg-blue-100 text-blue-800",
  DOCUMENT_DELETE: "bg-[#1e1b2e] text-purple-300",
  ATTACHMENT_DELETE: "bg-[#1e1b2e] text-purple-300",
  USER_DELETE: "bg-[#1e1b2e] text-purple-300",
  DOCUMENT_DRAFT: "bg-gray-100 text-gray-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  DOCUMENT_REGISTER: "bg-emerald-100 text-emerald-800",
  USER_APPROVE: "bg-emerald-100 text-emerald-800",
  LOGIN_SUCCESS: "bg-emerald-100 text-emerald-800",
  ATTACHMENT_UPLOAD: "bg-amber-100 text-amber-800",
  ATTACHMENT_RENAME: "bg-amber-100 text-amber-800",
  USER_REJECT: "bg-red-100 text-red-700",
  USER_CREATE: "bg-violet-100 text-violet-700",
  LOGIN_FAIL: "bg-red-100 text-red-700",
};

function ActionPill({ action }) {
  const cls = ACTION_STYLES[action] || "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide whitespace-nowrap ${cls}`}>
      {action}
    </span>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#ede9fe", "#5b21b6"], ["#dbeafe", "#1d4ed8"], ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#e0f2fe", "#0369a1"],
];
function Avatar({ firstName = "", lastName = "", avatarUrl }) {
  const i = ((firstName.charCodeAt(0) || 0)) % AVATAR_COLORS.length;
  const [bg, color] = AVATAR_COLORS[i];
  const ini = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
  const src = fullAvatarUrl(avatarUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={ini}
        className="inline-flex w-6 h-6 rounded-full object-cover shrink-0 border border-gray-100"
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold shrink-0"
      style={{ background: bg, color }}
    >
      {ini}
    </span>
  );
}

// ─── TIMESINCE ────────────────────────────────────────────────────────────────
function timeSince(iso) {
  const secs = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, delta, iconBg, icon }) {
  return (
    <div className="bg-violet-50/60 rounded-xl px-4 py-3.5 relative overflow-hidden">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? "—"}</div>
      <div className="text-xs text-gray-400 mt-1">{delta}</div>
      <div className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ShieldIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>;
const UsersIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>;
const SearchIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5L14 14" strokeLinecap="round" /></svg>;
const FilterIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" /></svg>;
const Spinner = () => <svg className="animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="8" cy="8" r="6" strokeOpacity=".25" /><path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" /></svg>;

// ─── SIDEBAR ICONS ────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>,
  Inbox: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" /></svg>,
  Plus: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M8 1v14M1 8h14" /></svg>,
  Tasks: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" /></svg>,
  Workflow: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Reports: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" /></svg>,
  Forms: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>,
  Users: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>,
  Shield: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  AssignTask: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" /><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" /><path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>,
  Tracking: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="14" height="14"><path d="M2 8h2.5l1.5-4 3 8 1.5-4H14" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  Help: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" /></svg>,
  Logout: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" /></svg>,
};

// ─── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SbItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "8px 14px",
        color: active ? "white" : "#c8c4e0",
        fontSize: 12, cursor: "pointer",
        borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent",
        background: active ? "rgba(124,58,237,0.18)" : "transparent",
        fontWeight: active ? "500" : "normal",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

// ─── ACCESS DENIED SCREEN ─────────────────────────────────────────────────────
function AccessDenied({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" width="28" height="28">
          <path d="M12 2L3 7v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7L12 2z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-base font-bold text-gray-900">Access Restricted</h2>
        <p className="text-xs text-gray-500 mt-1">You don't have permission to view the audit trail.</p>
        <p className="text-xs text-gray-400 mt-0.5">This page is only accessible to Admins and Program Chairs.</p>
      </div>
      <button
        onClick={onBack}
        className="mt-2 px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700"
      >
        ← Back to Dashboard
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AuditTrail() {
  const navigate = useNavigate();

  // ── Role guard ──────────────────────────────────────────────────────────────
  const currentUser = getCurrentUser();
  const canViewAudit = AUDIT_ROLES.includes(currentUser?.role);
  const canViewAdminNav = ADMIN_ROLES.includes(currentUser?.role);

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterAction, setFilterAction] = useState("");
  const [filterDocument, setFilterDocument] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [search, setSearch] = useState(""); // topbar search

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ── Fetch (only runs when role is allowed) ─────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!canViewAudit) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterAction) params.set("action", filterAction);
      if (filterDocument) params.set("document", filterDocument);
      if (filterDate) params.set("date", filterDate);
      if (filterQ) params.set("q", filterQ);

      const [logsData, statsData, actionsData] = await Promise.all([
        apiFetch(`/audit?${params}`),
        apiFetch("/audit/stats"),
        apiFetch("/audit/actions"),
      ]);
      setLogs(Array.isArray(logsData) ? logsData : (logsData.logs || []));
      setStats(statsData);
      setActions(actionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterDocument, filterDate, filterQ, canViewAudit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Client-side topbar search (on top of server filters) ──────────────────
  const displayed = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.detail?.toLowerCase().includes(q) ||
      l.user?.username?.toLowerCase().includes(q) ||
      l.user?.full_name?.toLowerCase().includes(q) ||
      String(l.document_id || "").includes(q)
    );
  });

  const hasFilters = filterAction || filterDocument || filterDate || filterQ;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 200, background: "#1e1b2e", color: "#c8c4e0", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }}
              onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.innerHTML = '<span style="color:white;font-size:12px;font-weight:bold">P</span>'; }} />
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
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={true} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>

        {/* Bottom */}
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col bg-white min-w-0">

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <SearchIcon />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracking #, user, keyword..."
                className="bg-transparent outline-none text-xs text-gray-700 w-full placeholder:text-gray-400"
              />
            </div>
            <button
              onClick={() => navigate("/documents/new")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="11" height="11"><path d="M8 1v9M4 7l4 4 4-4M2 13h12" /></svg>
              Intake Document
            </button>
          </div>
        </TopBar>

        {/* ── ACCESS DENIED ── */}
        {!canViewAudit ? (
          <AccessDenied onBack={() => navigate("/dashboard")} />
        ) : (
          /* ── AUTHORIZED CONTENT ── */
          <div className="flex flex-col gap-4 p-5 overflow-y-auto flex-1">

            {/* Page header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Audit Trail &amp; Versions</h1>
                <p className="text-xs text-gray-500 mt-0.5">Comprehensive activity monitoring for all system events.</p>
              </div>
              <button onClick={() => navigate("/dashboard")} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                ← Back to Dashboard
              </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-3">
              <StatCard
                label="Total Logs (Today)" value={stats.total_today ?? "—"}
                delta={stats.total_yesterday > 0 ? `vs ${stats.total_yesterday} yesterday` : "No data yesterday"}
                iconBg="bg-violet-100"
                icon={<svg viewBox="0 0 16 16" fill="#7c3aed" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" /></svg>}
              />
              <StatCard
                label="Security Events (Today)" value={stats.security_events ?? "—"}
                delta="Deletions &amp; login fails"
                iconBg="bg-red-100"
                icon={<svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>}
              />
              <StatCard
                label="Total Log Entries" value={stats.total_entries ?? displayed.length}
                delta="Showing (max 100)"
                iconBg="bg-emerald-100"
                icon={<svg viewBox="0 0 16 16" fill="none" stroke="#059669" strokeWidth="1.5" width="14" height="14"><path d="M13 5l-7 7-3-3" strokeLinecap="round" /></svg>}
              />
              <StatCard
                label="Retention Period" value="365d"
                delta="Compliance policy"
                iconBg="bg-amber-100"
                icon={<svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l2 2" strokeLinecap="round" /></svg>}
              />
            </div>

            {/* Filters bar */}
            <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-xl px-3.5 py-2.5">
              <FilterIcon />
              <span className="text-xs font-bold text-gray-700">Filters</span>

              {/* Action */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                <span>Action</span>
                <select
                  value={filterAction}
                  onChange={e => setFilterAction(e.target.value)}
                  className="border-none bg-transparent text-xs text-gray-800 outline-none cursor-pointer"
                >
                  <option value="">All</option>
                  {actions.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* Document */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                <span>Document ID</span>
                <input
                  type="text"
                  value={filterDocument}
                  onChange={e => setFilterDocument(e.target.value)}
                  placeholder="e.g. 42"
                  className="border-none bg-transparent text-xs text-gray-800 outline-none w-16"
                />
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                <span>Date</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="border-none bg-transparent text-xs text-gray-800 outline-none cursor-pointer"
                />
              </div>

              {/* Quick search */}
              <div className="flex-1 flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">
                <SearchIcon />
                <input
                  type="text"
                  value={filterQ}
                  onChange={e => setFilterQ(e.target.value)}
                  placeholder="Quick search events..."
                  className="border-none bg-transparent text-xs text-gray-800 outline-none w-full"
                />
              </div>

              {/* Clear */}
              {hasFilters && (
                <button
                  onClick={() => { setFilterAction(""); setFilterDocument(""); setFilterDate(""); setFilterQ(""); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50"
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-2.5 rounded-xl">{error}</div>
            )}

            {/* Log table */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Activity Log</h2>
                  <p className="text-xs text-gray-400 mt-0.5">All system actions — documents, users, auth events</p>
                </div>
                <span className="text-xs text-gray-400">
                  {loading ? "Loading…" : `${displayed.length} ${displayed.length === 1 ? "entry" : "entries"}`}
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-xs">
                  <Spinner /> Loading audit log…
                </div>
              ) : (
                <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
                  <thead>
                    <tr className="bg-gray-50">
                      {[
                        ["Timestamp", "16%"],
                        ["User", "17%"],
                        ["Action", "18%"],
                        ["Document", "14%"],
                        ["Detail", "25%"],
                        ["IP Address", "10%"],
                      ].map(([h, w]) => (
                        <th
                          key={h}
                          style={{ width: w }}
                          className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold px-4 py-2.5 text-left border-b border-gray-100"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12">
                          <svg viewBox="0 0 40 40" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="36" height="36" className="mx-auto mb-2">
                            <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" transform="translate(12 8) scale(1.1)" />
                          </svg>
                          <p className="text-gray-400 text-xs">No audit logs found.{hasFilters ? " Try clearing the filters." : ""}</p>
                        </td>
                      </tr>
                    ) : displayed.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/70 border-b border-gray-50 last:border-0 transition-colors">

                        {/* Timestamp */}
                        <td className="px-4 py-2.5">
                          <div className="text-[11px] font-bold text-gray-900">{timeSince(log.timestamp)}</div>
                          <div className="text-[10px] text-gray-400">{fmtDate(log.timestamp)}</div>
                        </td>

                        {/* User */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <Avatar firstName={log.user?.first_name} lastName={log.user?.last_name} avatarUrl={log.user?.avatar_url} />
                            <div>
                              <div className="text-[11px] font-bold text-gray-900 leading-tight">
                                {log.user?.full_name || log.user?.username || "System"}
                              </div>
                              <div className="text-[10px] text-gray-400">@{log.user?.username || "—"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-2.5">
                          <ActionPill action={log.action} />
                        </td>

                        {/* Document */}
                        <td className="px-4 py-2.5">
                          {log.document_id ? (
                            <span className="text-violet-600 font-bold text-[11px] cursor-pointer hover:underline"
                              onClick={() => navigate(`/documents/${log.document_id}`)}>
                              #{log.document_id}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-300 italic">—</span>
                          )}
                        </td>

                        {/* Detail */}
                        <td className="px-4 py-2.5 text-[11px] text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap" title={log.detail || ""}>
                          {log.detail || "—"}
                        </td>

                        {/* IP */}
                        <td className="px-4 py-2.5 text-[10px] text-gray-400 font-mono">
                          {log.ip_address || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-50">
                Showing {displayed.length} log {displayed.length === 1 ? "entry" : "entries"} · Logs are retained for 365 days per compliance policy.
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <footer className="flex justify-between items-center px-5 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 bg-white">
          <span>© 2026 PATH Document Management System. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />System Operational</span>
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
}
