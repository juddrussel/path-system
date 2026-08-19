import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

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

// ─── ACTIVITY TYPE META (icon + short label per action code) ─────────────────
const ACTIVITY_META = {
  LOGIN_SUCCESS: { icon: "login", label: "Login" },
  LOGIN_FAIL: { icon: "key", label: "Login" },
  LOGOUT: { icon: "logout", label: "Logout" },
  REGISTER: { icon: "person_add", label: "Registration" },
  DOCUMENT_CREATE: { icon: "description", label: "Document Created" },
  DOCUMENT_REGISTER: { icon: "description", label: "Registration" },
  DOCUMENT_UPDATE: { icon: "edit_document", label: "Update" },
  DOCUMENT_DRAFT: { icon: "draft", label: "Draft Saved" },
  DOCUMENT_DELETE: { icon: "delete", label: "Deletion" },
  ATTACHMENT_UPLOAD: { icon: "upload_file", label: "Upload" },
  ATTACHMENT_RENAME: { icon: "drive_file_rename_outline", label: "Rename" },
  ATTACHMENT_DELETE: { icon: "delete", label: "Deletion" },
  USER_CREATE: { icon: "person_add", label: "User Created" },
  USER_APPROVE: { icon: "how_to_reg", label: "Approval" },
  USER_REJECT: { icon: "person_remove", label: "Rejection" },
  USER_DELETE: { icon: "person_remove", label: "Deletion" },
};

function prettifyAction(action) {
  if (!action) return "Activity";
  return action
    .toLowerCase()
    .split("_")
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function activityMeta(action) {
  return ACTIVITY_META[action] || { icon: "history", label: prettifyAction(action) };
}

function isFailedAction(action) {
  return /FAIL|REJECT|DELETE/i.test(action || "");
}

// ─── ROLE LABELS ──────────────────────────────────────────────────────────────
const ROLE_LABELS = {
  admin: "Administrator",
  program_chair: "Program Chair",
  faculty: "Faculty",
  staff: "Staff",
  dept_chair: "Dept. Chair",
};
function formatRole(role) {
  if (!role) return "—";
  return ROLE_LABELS[role] || prettifyAction(role);
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#e9ddff", "#5a00c6"], ["#e7deff", "#4a3d7c"], ["#eaddff", "#5516be"],
  ["#dad6ff", "#2d2a5b"], ["#f6f2ff", "#6b38d4"], ["#efebff", "#5f5293"],
];
function Avatar({ firstName = "", lastName = "", avatarUrl }) {
  const i = (firstName.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [bg, color] = AVATAR_COLORS[i];
  const ini = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
  const src = fullAvatarUrl(avatarUrl);
  if (src) {
    return (
      <img
        src={src}
        alt={ini}
        className="inline-flex w-8 h-8 rounded-full object-cover shrink-0 border border-[#cbc3d7]"
        onError={e => { e.currentTarget.style.display = "none"; }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold shrink-0"
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " UTC";
}

// ─── PAGE NUMBER LIST (with ellipses) ─────────────────────────────────────────
function getPageList(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const arr = Array.from(keep).filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const p of arr) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportCSV(rows, page) {
  const header = ["Timestamp", "User", "Username", "Role", "Activity Type", "Action Performed", "IP Address"];
  const escape = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = rows.map(l => [
    fmtDate(l.timestamp),
    l.user?.full_name || l.user?.username || "System",
    l.user?.username || "",
    formatRole(l.user?.role),
    activityMeta(l.action).label,
    l.detail || "",
    l.ip_address || "",
  ].map(escape).join(","));
  const csv = [header.map(escape).join(","), ...body].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-page-${page}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── STAT CARD (bento style) ──────────────────────────────────────────────────
function StatCard({ label, value, delta, deltaTone = "neutral", accent, icon, danger }) {
  const deltaColor = deltaTone === "up" ? "text-[#6b38d4]" : deltaTone === "down" ? "text-[#ba1a1a]" : "text-[#494454]";
  return (
    <div className={`bg-white border ${danger ? "border-[#ba1a1a]/20" : "border-[#cbc3d7]"} rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:shadow-[0_12px_24px_-12px_rgba(107,56,212,0.15)] transition-all duration-300`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${accent}`} />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[11px] font-medium text-[#494454] uppercase tracking-wider">{label}</span>
        <span className={`material-symbols-outlined text-[20px] ${danger ? "text-[#ba1a1a]" : "text-[#7b7486]"}`}>{icon}</span>
      </div>
      <div className="relative z-10">
        <span className={`block text-4xl font-bold leading-tight ${danger ? "text-[#ba1a1a]" : "text-[#181445]"}`}>{value ?? "—"}</span>
        {delta && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${deltaColor}`}>
            {deltaTone !== "neutral" && (
              <span className="material-symbols-outlined text-[14px]">{deltaTone === "up" ? "trending_up" : "error"}</span>
            )}
            <span>{delta}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SMALL ICONS ──────────────────────────────────────────────────────────────
const SearchIcon = () => <span className="material-symbols-outlined text-[18px]">search</span>;
const Spinner = () => <svg className="animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="8" cy="8" r="6" strokeOpacity=".25" /><path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" /></svg>;

// ─── ACCESS DENIED SCREEN ─────────────────────────────────────────────────────
function AccessDenied({ onBack }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-24 gap-4">
      <div className="w-14 h-14 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-[#ba1a1a] text-[28px]">shield</span>
      </div>
      <div className="text-center">
        <h2 className="text-base font-bold text-[#181445]">Access Restricted</h2>
        <p className="text-xs text-[#494454] mt-1">You don't have permission to view the audit trail.</p>
        <p className="text-xs text-[#7b7486] mt-0.5">This page is only accessible to Admins and Program Chairs.</p>
      </div>
      <button
        onClick={onBack}
        className="mt-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#6b38d4] text-white hover:bg-[#6b38d4]/90"
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
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Server-side filters
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterQ, setFilterQ] = useState("");

  // Client-side filters (scoped to the current page of results)
  const [filterUser, setFilterUser] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState(""); // topbar quick search

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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
      if (filterDate) params.set("date", filterDate);
      if (filterQ) params.set("q", filterQ);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const [logsData, statsData, actionsData] = await Promise.all([
        apiFetch(`/audit?${params}`),
        apiFetch("/audit/stats"),
        apiFetch("/audit/actions"),
      ]);
      setLogs(Array.isArray(logsData) ? logsData : (logsData.logs || []));
      setTotalLogs(logsData.total ?? (Array.isArray(logsData) ? logsData.length : (logsData.logs || []).length));
      setTotalPages(Math.max(1, logsData.pages ?? 1));
      setStats(statsData);
      setActions(actionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterDate, filterQ, page, canViewAudit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Options for the User / Role selects, derived from the loaded page ──────
  const userOptions = useMemo(() => {
    const map = new Map();
    logs.forEach(l => {
      if (l.user?.username) map.set(l.user.username, l.user.full_name || l.user.username);
    });
    return Array.from(map.entries());
  }, [logs]);

  const roleOptions = useMemo(
    () => Array.from(new Set(logs.map(l => l.user?.role).filter(Boolean))),
    [logs]
  );

  // ── Client-side narrowing (search, user, role, status) on the current page ─
  const displayed = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        l.action?.toLowerCase().includes(q) ||
        l.detail?.toLowerCase().includes(q) ||
        l.user?.username?.toLowerCase().includes(q) ||
        l.user?.full_name?.toLowerCase().includes(q) ||
        String(l.document_id || "").includes(q);
      if (!matches) return false;
    }
    if (filterUser && l.user?.username !== filterUser) return false;
    if (filterRole && l.user?.role !== filterRole) return false;
    if (filterStatus) {
      const failed = isFailedAction(l.action);
      if (filterStatus === "failed" && !failed) return false;
      if (filterStatus === "success" && failed) return false;
    }
    return true;
  });

  const hasFilters = filterAction || filterDate || filterQ || filterUser || filterRole || filterStatus;

  const clearFilters = () => {
    setFilterAction("");
    setFilterDate("");
    setFilterQ("");
    setFilterUser("");
    setFilterRole("");
    setFilterStatus("");
  };

  // Reset to page 1 whenever a server-side filter changes (new result set)
  useEffect(() => { setPage(1); }, [filterAction, filterDate, filterQ]);

  const pageItems = displayed;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#fcf8ff]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20; vertical-align: middle; }
      `}</style>

      <Sidebar activePage="audit" />

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col bg-[#fcf8ff] min-w-0">

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#f6f2ff] border border-[#cbc3d7] rounded-lg px-3 py-1.5">
              <SearchIcon />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tracking #, user, keyword..."
                className="bg-transparent outline-none text-xs text-[#181445] w-full placeholder:text-[#7b7486]"
              />
            </div>
            <button
              onClick={() => navigate("/documents/new")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#6b38d4] text-white hover:bg-[#6b38d4]/90 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              Intake Document
            </button>
          </div>
        </TopBar>

        {/* ── ACCESS DENIED ── */}
        {!canViewAudit ? (
          <AccessDenied onBack={() => navigate("/dashboard")} />
        ) : (
          /* ── AUTHORIZED CONTENT ── */
          <div className="flex flex-col gap-6 p-8 overflow-y-auto flex-1">

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-[32px] leading-10 font-semibold text-[#181445] tracking-tight">Audit Logs</h1>
                <p className="text-sm text-[#494454] mt-2">Monitor and track all activities performed within the system.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 px-4 py-2 border border-[#cbc3d7] text-[#181445] text-sm font-medium rounded-lg hover:bg-[#efebff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Dashboard
                </button>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-[#cbc3d7] text-[#181445] text-sm font-medium rounded-lg hover:bg-[#efebff] transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>refresh</span>
                  Refresh
                </button>
                <button
                  onClick={() => exportCSV(pageItems, page)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#6b38d4] border border-[#d0bcff] text-sm font-medium rounded-lg hover:bg-[#6b38d4]/5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Export Logs
                </button>
              </div>
            </div>

            {/* Summary Cards (Bento Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Log Entries"
                value={(stats.total ?? totalLogs)?.toLocaleString?.() ?? (stats.total ?? totalLogs)}
                delta={stats.total_yesterday > 0 ? `vs ${stats.total_yesterday.toLocaleString()} yesterday` : "All-time count"}
                deltaTone="up"
                accent="bg-[#6b38d4]/5 group-hover:bg-[#6b38d4]/10"
                icon="database"
              />
              <StatCard
                label="Activities Today"
                value={stats.total_today ?? "—"}
                delta={stats.avg_per_hour ? `Avg ${stats.avg_per_hour}/hour` : "Since midnight"}
                deltaTone="neutral"
                accent="bg-[#5f5293]/5 group-hover:bg-[#5f5293]/10"
                icon="history"
              />
              <StatCard
                label="Active Users Today"
                value={stats.active_users_today ?? "—"}
                delta={stats.active_users_yesterday != null ? `vs ${stats.active_users_yesterday} yesterday` : "Unique sign-ins"}
                deltaTone="up"
                accent="bg-[#712ae2]/5 group-hover:bg-[#712ae2]/10"
                icon="group"
              />
              <StatCard
                label="Failed Activities"
                value={stats.security_events ?? "—"}
                delta="Requires attention"
                deltaTone="down"
                danger
                accent="bg-[#ba1a1a]/5 group-hover:bg-[#ba1a1a]/10"
                icon="warning"
              />
            </div>

            {/* Search and Filter Toolbar */}
            <div className="bg-white border border-[#cbc3d7] rounded-lg p-4 shadow-sm flex flex-col xl:flex-row gap-4 items-center">
              <div className="w-full xl:w-1/3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[#7b7486] text-[20px]">search</span>
                </div>
                <input
                  value={filterQ}
                  onChange={e => setFilterQ(e.target.value)}
                  placeholder="Search by activity, user, or IP..."
                  className="block w-full pl-10 pr-3 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] h-[40px]"
                />
              </div>

              <div className="w-full xl:w-2/3 flex flex-wrap lg:flex-nowrap gap-3 items-center">
                {/* User Filter */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={filterUser}
                    onChange={e => setFilterUser(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] appearance-none h-[40px] cursor-pointer"
                  >
                    <option value="">All Users</option>
                    {userOptions.map(([username, name]) => (
                      <option key={username} value={username}>{name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <span className="material-symbols-outlined text-[#7b7486] text-[20px]">expand_more</span>
                  </div>
                </div>

                {/* Role Filter */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] appearance-none h-[40px] cursor-pointer"
                  >
                    <option value="">All Roles</option>
                    {roleOptions.map(r => (
                      <option key={r} value={r}>{formatRole(r)}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <span className="material-symbols-outlined text-[#7b7486] text-[20px]">expand_more</span>
                  </div>
                </div>

                {/* Activity Type Filter */}
                <div className="relative flex-1 min-w-[140px]">
                  <select
                    value={filterAction}
                    onChange={e => setFilterAction(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] appearance-none h-[40px] cursor-pointer"
                  >
                    <option value="">Activity Type</option>
                    {actions.map(a => <option key={a} value={a}>{activityMeta(a).label}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <span className="material-symbols-outlined text-[#7b7486] text-[20px]">expand_more</span>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative flex-1 min-w-[120px]">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] appearance-none h-[40px] cursor-pointer"
                  >
                    <option value="">Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <span className="material-symbols-outlined text-[#7b7486] text-[20px]">expand_more</span>
                  </div>
                </div>

                {/* Date */}
                <div className="relative flex-1 min-w-[200px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-[#7b7486] text-[20px]">calendar_today</span>
                  </div>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-[#cbc3d7] rounded-md bg-[#fcf8ff] text-sm text-[#181445] focus:outline-none focus:border-[#6b38d4] focus:ring-1 focus:ring-[#6b38d4] h-[40px] cursor-pointer"
                  />
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  title="Clear Filters"
                  className="p-2 text-[#494454] hover:text-[#6b38d4] transition-colors hover:bg-[#6b38d4]/5 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ba1a1a]/5 border border-[#ba1a1a]/30 text-[#93000a] text-sm px-4 py-2.5 rounded-xl">{error}</div>
            )}

            {/* Audit Logs Table */}
            <div className="bg-white border border-[#cbc3d7] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f6f2ff] border-b border-[#cbc3d7] text-[11px] text-[#494454] uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Timestamp</th>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Activity Type</th>
                      <th className="px-6 py-4 font-medium">Action Performed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3dfff] text-sm text-[#181445]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <div className="flex items-center justify-center gap-2 text-[#7b7486] text-xs">
                            <Spinner /> Loading audit log…
                          </div>
                        </td>
                      </tr>
                    ) : pageItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-16">
                          <span className="material-symbols-outlined text-[36px] text-[#cbc3d7] block mb-2">manage_search</span>
                          <p className="text-[#7b7486] text-sm">No audit logs found.{hasFilters ? " Try clearing the filters." : ""}</p>
                        </td>
                      </tr>
                    ) : pageItems.map(log => {
                      const meta = activityMeta(log.action);
                      const failed = isFailedAction(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-[#f6f2ff]/60 transition-colors group">
                          {/* Timestamp */}
                          <td className="px-6 py-4 whitespace-nowrap text-[#494454]">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-[#5a00c6] bg-[#e9ddff] px-1.5 py-0.5 rounded-full mb-1">{timeSince(log.timestamp)}</span>
                            <div className="text-sm">{fmtDate(log.timestamp)}</div>
                          </td>

                          {/* User */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <Avatar firstName={log.user?.first_name} lastName={log.user?.last_name} avatarUrl={log.user?.avatar_url} />
                              <div>
                                <div className="font-medium leading-tight">{log.user?.full_name || log.user?.username || "System"}</div>
                                <div className="inline-block text-[10px] font-semibold text-[#5f5293] bg-[#e7deff] px-1.5 py-0.5 rounded-full mt-0.5">@{log.user?.username || "system"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="px-6 py-4 whitespace-nowrap text-[#494454]">{formatRole(log.user?.role)}</td>

                          {/* Activity Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`material-symbols-outlined text-[18px] ${failed ? "text-[#ba1a1a]" : "text-[#7b7486]"}`}>{meta.icon}</span>
                              <span className={failed ? "text-[#ba1a1a] font-medium" : ""}>{meta.label}</span>
                            </div>
                          </td>

                          {/* Action Performed */}
                          <td className="px-6 py-4 text-[#494454]">
                            <span>{log.detail || "—"}</span>
                            {log.document_id && (
                              <button
                                onClick={() => navigate(`/documents/${log.document_id}`)}
                                className="ml-2 inline-flex items-center text-[11px] font-bold text-[#6b38d4] bg-[#efebff] px-1.5 py-0.5 rounded-full hover:bg-[#e9ddff] hover:underline align-middle"
                              >
                                #{log.document_id}
                              </button>
                            )}
                            {log.ip_address && (
                              <span className="block w-fit text-[10px] font-semibold text-[#93000a] bg-[#ffdad6] font-mono px-1.5 py-0.5 rounded-full mt-1">IP: {log.ip_address}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Footer */}
              <div className="bg-white border-t border-[#cbc3d7] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-sm text-[#494454]">
                  Showing {totalLogs === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, totalLogs)} of {totalLogs.toLocaleString()} entries
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-[#cbc3d7] rounded-md text-[#494454] hover:bg-[#f6f2ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {getPageList(page, totalPages).map((p, idx) =>
                    p === "…" ? (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-[#7b7486]">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={p === page
                          ? "px-3 py-1 bg-[#6b38d4] text-white rounded-md"
                          : "px-3 py-1 border border-[#cbc3d7] rounded-md text-[#494454] hover:bg-[#f6f2ff]"}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-[#cbc3d7] rounded-md text-[#494454] hover:bg-[#f6f2ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <footer className="flex justify-between items-center px-8 py-2.5 border-t border-[#cbc3d7] text-[10px] text-[#7b7486] bg-white">
          <span>© 2026 PATH Document Management System. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />System Operational</span>
            <a href="#" className="hover:text-[#494454]">Privacy Policy</a>
            <a href="#" className="hover:text-[#494454]">Terms of Service</a>
          </div>
        </footer>
      </main>
    </div>
  );
}