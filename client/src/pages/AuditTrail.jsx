import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FilterX,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const AUDIT_ROLES = ["admin", "program_chair"];

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

const ROLE_LABELS = {
  admin: "Administrator",
  program_chair: "Program Chair",
  faculty: "Faculty",
  staff: "Staff",
  dept_chair: "Dept. Chair",
};

const AVATAR_COLORS = [
  ["#e9ddff", "#5a00c6"],
  ["#e7deff", "#4a3d7c"],
  ["#eaddff", "#5516be"],
  ["#dad6ff", "#2d2a5b"],
  ["#f6f2ff", "#6b38d4"],
  ["#efebff", "#5f5293"],
];

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
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
}

function prettifyAction(action) {
  if (!action) return "Activity";
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function activityMeta(action) {
  return (
    ACTIVITY_META[action] || { icon: "history", label: prettifyAction(action) }
  );
}

function isFailedAction(action) {
  return /FAIL|REJECT|DELETE/i.test(action || "");
}

function formatRole(role) {
  if (!role) return "—";
  return ROLE_LABELS[role] || prettifyAction(role);
}

function timeSince(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return `${new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })} UTC`;
}

function getPageList(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const retained = new Set([
    1,
    2,
    total - 1,
    total,
    current - 1,
    current,
    current + 1,
  ]);
  const pages = Array.from(retained)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result = [];
  let previous = 0;
  pages.forEach((page) => {
    if (page - previous > 1) result.push("…");
    result.push(page);
    previous = page;
  });
  return result;
}

function exportCSV(rows, page) {
  const header = [
    "Timestamp",
    "User",
    "Username",
    "Role",
    "Activity Type",
    "Action Performed",
    "IP Address",
  ];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const body = rows.map((log) =>
    [
      fmtDate(log.timestamp),
      log.user?.full_name || log.user?.username || "System",
      log.user?.username || "",
      formatRole(log.user?.role),
      activityMeta(log.action).label,
      log.detail || "",
      log.ip_address || "",
    ]
      .map(escape)
      .join(","),
  );
  const blob = new Blob([[header.map(escape).join(","), ...body].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-log-page-${page}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Avatar({ firstName = "", lastName = "", avatarUrl }) {
  const colorIndex = (firstName.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [background, color] = AVATAR_COLORS[colorIndex];
  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
  const source = fullAvatarUrl(avatarUrl);
  if (source)
    return (
      <img
        src={source}
        alt={initials}
        className="path-audit-avatar"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  return (
    <span className="path-audit-avatar" style={{ background, color }}>
      {initials}
    </span>
  );
}

function StatCard({ label, value, note, icon, tone = "violet" }) {
  return (
    <article className={`path-audit-stat path-audit-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
      <small>{note}</small>
      <i className="material-symbols-outlined">{icon}</i>
    </article>
  );
}

function AccessDenied({ onBack }) {
  return (
    <div className="path-audit-denied">
      <ShieldCheck size={26} />
      <h2>Access restricted</h2>
      <p>You do not have permission to view the accountability ledger.</p>
      <button type="button" className="path-audit-primary" onClick={onBack}>
        <ArrowLeft size={14} /> Back to dashboard
      </button>
    </div>
  );
}

export default function AuditTrail() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const canViewAudit = AUDIT_ROLES.includes(currentUser?.role);
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({});
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterQ, setFilterQ] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const PAGE_SIZE = 10;

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
      const items = Array.isArray(logsData) ? logsData : logsData.logs || [];
      setLogs(items);
      setTotalLogs(logsData.total ?? items.length);
      setTotalPages(Math.max(1, logsData.pages ?? 1));
      setStats(statsData || {});
      setActions(actionsData || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [canViewAudit, filterAction, filterDate, filterQ, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    setPage(1);
  }, [filterAction, filterDate, filterQ]);
  useEffect(() => {
    if (logs.length && !logs.some((log) => log.id === selectedId))
      setSelectedId(logs[0].id);
  }, [logs, selectedId]);

  const userOptions = useMemo(
    () =>
      Array.from(
        new Map(
          logs
            .filter((log) => log.user?.username)
            .map((log) => [
              log.user.username,
              log.user.full_name || log.user.username,
            ]),
        ).entries(),
      ),
    [logs],
  );
  const roleOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((log) => log.user?.role).filter(Boolean))),
    [logs],
  );
  const displayed = useMemo(
    () =>
      logs.filter((log) => {
        if (filterUser && log.user?.username !== filterUser) return false;
        if (filterRole && log.user?.role !== filterRole) return false;
        const failed = isFailedAction(log.action);
        if (filterStatus === "failed" && !failed) return false;
        if (filterStatus === "success" && failed) return false;
        return true;
      }),
    [logs, filterRole, filterStatus, filterUser],
  );
  const selectedLog =
    displayed.find((log) => log.id === selectedId) || displayed[0] || null;
  const hasFilters =
    filterAction ||
    filterDate ||
    filterQ ||
    filterUser ||
    filterRole ||
    filterStatus;
  const clearFilters = () => {
    setFilterAction("");
    setFilterDate("");
    setFilterQ("");
    setFilterUser("");
    setFilterRole("");
    setFilterStatus("");
  };
  const pageItems = displayed;
  const rangeStart = totalLogs ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalLogs);

  return (
    <div className="path-audit-app">
      <style>{`${PATH_AUDIT_CSS}${PATH_AUDIT_COMPACT_DETAIL_CSS}`}</style>

      <main className="path-audit-main">
        {!canViewAudit ? (
          <AccessDenied onBack={() => navigate("/dashboard")} />
        ) : (
          <div className="path-audit-content">
            <section className="path-audit-view">
              <section className="path-audit-hero">
                <div>
                  <span className="path-audit-kicker">
                    <i /> ACCOUNTABILITY LEDGER · LIVE RECORD
                  </span>
                  <h1>Audit trail</h1>
                  <p>
                    Trace every document decision, handoff, and access change
                    across the department.
                  </p>
                </div>
                <div className="path-audit-hero-badge">
                  <ShieldCheck size={18} />
                  <span>
                    <strong>Immutable record</strong>
                    <small>
                      {loading ? "Refreshing records" : "Last synced just now"}
                    </small>
                  </span>
                </div>
              </section>

              <section className="path-audit-stat-grid">
                <StatCard
                  label="Total events"
                  value={
                    (stats.total ?? totalLogs)?.toLocaleString?.() ??
                    stats.total ??
                    totalLogs
                  }
                  note={
                    stats.total_yesterday
                      ? `+${Math.max(0, (stats.total ?? totalLogs) - stats.total_yesterday)} from yesterday`
                      : "All-time record"
                  }
                  icon="database"
                />
                <StatCard
                  label="Workflow actions"
                  value={stats.workflow_actions ?? stats.total_today ?? "—"}
                  note={
                    stats.avg_per_hour
                      ? `${stats.avg_per_hour}/hour average`
                      : "Today’s activity"
                  }
                  icon="history"
                  tone="blue"
                />
                <StatCard
                  label="Access changes"
                  value={stats.active_users_today ?? "—"}
                  note={
                    stats.active_users_yesterday != null
                      ? `${stats.active_users_yesterday} yesterday`
                      : "Unique users today"
                  }
                  icon="group"
                  tone="amber"
                />
                <StatCard
                  label="Security signals"
                  value={stats.security_events ?? "—"}
                  note="Review failed activity"
                  icon="shield"
                  tone="red"
                />
              </section>

              <section className="path-audit-toolbar">
                <div className="path-audit-search">
                  <Search size={15} />
                  <input
                    value={filterQ}
                    onChange={(event) => setFilterQ(event.target.value)}
                    placeholder="Search activity, people, or documents"
                    aria-label="Search audit activity"
                  />
                </div>
                <div className="path-audit-filter-group">
                  <button
                    type="button"
                    className={!filterStatus ? "active" : ""}
                    onClick={() => setFilterStatus("")}
                  >
                    All events
                  </button>
                  <button
                    type="button"
                    className={filterStatus === "success" ? "active" : ""}
                    onClick={() => setFilterStatus("success")}
                  >
                    Successful
                  </button>
                  <button
                    type="button"
                    className={filterStatus === "failed" ? "active" : ""}
                    onClick={() => setFilterStatus("failed")}
                  >
                    Needs review
                  </button>
                </div>
                <select
                  value={filterAction}
                  onChange={(event) => setFilterAction(event.target.value)}
                  aria-label="Filter audit events by activity"
                >
                  <option value="">All activity types</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {activityMeta(action).label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterUser}
                  onChange={(event) => setFilterUser(event.target.value)}
                  aria-label="Filter audit events by user"
                >
                  <option value="">All people</option>
                  {userOptions.map(([username, name]) => (
                    <option key={username} value={username}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  value={filterRole}
                  onChange={(event) => setFilterRole(event.target.value)}
                  aria-label="Filter audit events by role"
                >
                  <option value="">All roles</option>
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </select>
                <input
                  className="path-audit-date"
                  type="date"
                  value={filterDate}
                  onChange={(event) => setFilterDate(event.target.value)}
                  aria-label="Filter audit events by date"
                />
                <button
                  type="button"
                  className="path-audit-clear"
                  onClick={clearFilters}
                  disabled={!hasFilters}
                  aria-label="Clear audit filters"
                >
                  <FilterX size={15} />
                </button>
                <button
                  type="button"
                  className="path-audit-export"
                  onClick={() => exportCSV(pageItems, page)}
                >
                  <Download size={14} /> Export
                </button>
              </section>

              {error && (
                <div className="path-audit-error">
                  <span>{error}</span>
                  <button type="button" onClick={fetchData}>
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
              )}
              <section className="path-audit-layout">
                <article className="path-audit-ledger">
                  <header className="path-audit-ledger-heading">
                    <div>
                      <span className="path-audit-kicker">
                        Department activity
                      </span>
                      <h2>
                        Recent events{" "}
                        <b>{String(totalLogs).padStart(2, "0")}</b>
                      </h2>
                    </div>
                    <span className="path-audit-retention">
                      <History size={13} /> Retained securely
                    </span>
                  </header>
                  <div className="path-audit-table-head">
                    <span>Activity</span>
                    <span>Actor</span>
                    <span>Type</span>
                    <span>Time</span>
                  </div>
                  <div className="path-audit-records">
                    {loading ? (
                      <div className="path-audit-empty">
                        <RefreshCw className="path-audit-spin" size={18} />
                        <strong>Loading audit activity</strong>
                        <span>Retrieving the latest ledger records.</span>
                      </div>
                    ) : !pageItems.length ? (
                      <div className="path-audit-empty">
                        <History size={22} />
                        <strong>No audit events found</strong>
                        <span>
                          {hasFilters
                            ? "Try clearing or widening your filters."
                            : "New department activity will appear here."}
                        </span>
                      </div>
                    ) : (
                      pageItems.map((log) => {
                        const meta = activityMeta(log.action);
                        const failed = isFailedAction(log.action);
                        return (
                          <button
                            key={log.id}
                            type="button"
                            className={`path-audit-record ${selectedLog?.id === log.id ? "selected" : ""}`}
                            onClick={() => setSelectedId(log.id)}
                          >
                            <span className="path-audit-activity">
                              <i
                                className={`material-symbols-outlined ${failed ? "failed" : ""}`}
                              >
                                {meta.icon}
                              </i>
                              <span>
                                <strong>{meta.label}</strong>
                                <small>
                                  {log.detail ||
                                    "No additional activity detail."}
                                </small>
                              </span>
                            </span>
                            <span className="path-audit-actor">
                              <Avatar
                                firstName={log.user?.first_name}
                                lastName={log.user?.last_name}
                                avatarUrl={log.user?.avatar_url}
                              />
                              <span>
                                <strong>
                                  {log.user?.full_name ||
                                    log.user?.username ||
                                    "System"}
                                </strong>
                                <small>{formatRole(log.user?.role)}</small>
                              </span>
                            </span>
                            <span
                              className={`path-audit-type ${failed ? "failed" : ""}`}
                            >
                              {failed ? "Review" : meta.label}
                            </span>
                            <span className="path-audit-time">
                              <b>{timeSince(log.timestamp)}</b>
                              {fmtDate(log.timestamp)}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <footer className="path-audit-pagination">
                    <span>
                      Showing {rangeStart}–{rangeEnd} of{" "}
                      {totalLogs.toLocaleString()} events
                    </span>
                    <div>
                      <button
                        type="button"
                        className="path-audit-page-arrow"
                        onClick={() =>
                          setPage((current) => Math.max(1, current - 1))
                        }
                        disabled={page === 1}
                        aria-label="Previous audit page"
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <div className="path-audit-pages">
                        {getPageList(page, totalPages).map((pageItem, index) =>
                          pageItem === "…" ? (
                            <span key={`ellipsis-${index}`}>…</span>
                          ) : (
                            <button
                              type="button"
                              key={pageItem}
                              className={pageItem === page ? "active" : ""}
                              onClick={() => setPage(pageItem)}
                              aria-current={
                                pageItem === page ? "page" : undefined
                              }
                            >
                              {pageItem}
                            </button>
                          ),
                        )}
                      </div>
                      <button
                        type="button"
                        className="path-audit-page-arrow"
                        onClick={() =>
                          setPage((current) =>
                            Math.min(totalPages, current + 1),
                          )
                        }
                        disabled={page === totalPages}
                        aria-label="Next audit page"
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </footer>
                </article>

                <aside className="path-audit-detail">
                  {selectedLog ? (
                    (() => {
                      const meta = activityMeta(selectedLog.action);
                      const failed = isFailedAction(selectedLog.action);
                      return (
                        <>
                          <span className="path-audit-kicker">
                            Selected event
                          </span>
                          <div
                            className={`path-audit-detail-icon ${failed ? "failed" : ""}`}
                          >
                            <i className="material-symbols-outlined">
                              {meta.icon}
                            </i>
                          </div>
                          <h2>{meta.label}</h2>
                          <p>
                            {selectedLog.detail ||
                              "No additional event detail was recorded."}
                          </p>
                          <div className="path-audit-detail-status">
                            <span>Event status</span>
                            <strong className={failed ? "failed" : ""}>
                              {failed ? "Needs review" : "Recorded"}
                            </strong>
                          </div>
                          <div className="path-audit-detail-meta">
                            <div>
                              <span>Timestamp</span>
                              <strong>{fmtDate(selectedLog.timestamp)}</strong>
                            </div>
                            <div>
                              <span>Activity code</span>
                              <strong>{selectedLog.action || "—"}</strong>
                            </div>
                            <div>
                              <span>Role</span>
                              <strong>
                                {formatRole(selectedLog.user?.role)}
                              </strong>
                            </div>
                            <div>
                              <span>IP address</span>
                              <strong>
                                {selectedLog.ip_address || "Not recorded"}
                              </strong>
                            </div>
                          </div>
                          <div className="path-audit-detail-actor">
                            <Avatar
                              firstName={selectedLog.user?.first_name}
                              lastName={selectedLog.user?.last_name}
                              avatarUrl={selectedLog.user?.avatar_url}
                            />
                            <div>
                              <span>Performed by</span>
                              <strong>
                                {selectedLog.user?.full_name ||
                                  selectedLog.user?.username ||
                                  "System"}
                              </strong>
                            </div>
                          </div>
                          {selectedLog.document_id && (
                            <button
                              type="button"
                              className="path-audit-document-link"
                              onClick={() =>
                                navigate(
                                  `/documents/${selectedLog.document_id}`,
                                )
                              }
                            >
                              <FileText size={14} /> Open document #
                              {selectedLog.document_id}
                            </button>
                          )}
                          <div className="path-audit-detail-note">
                            <ShieldCheck size={14} /> This activity is retained
                            as part of the department’s traceable record.
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="path-audit-empty path-audit-detail-empty">
                      <History size={22} />
                      <strong>Select an event</strong>
                      <span>
                        Choose a ledger entry to inspect its audit details.
                      </span>
                    </div>
                  )}
                </aside>
              </section>
            </section>
          </div>
        )}
        <footer className="path-audit-footer">
        </footer>
      </main>
    </div>
  );
}

const PATH_AUDIT_COMPACT_DETAIL_CSS = `
.path-audit-layout{align-items:start}.path-audit-detail{align-self:start;height:max-content}
`;

const PATH_AUDIT_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
.path-audit-app{display:flex;min-height:100vh;background:#f8f7ff;color:#2c2537;font-family:'DM Sans',sans-serif}.path-audit-app *{box-sizing:border-box}.path-audit-app button,.path-audit-app input,.path-audit-app select{font-family:'DM Sans',sans-serif}.material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 20;vertical-align:middle}.path-audit-main{display:flex;min-width:0;flex:1;flex-direction:column;background:#f8f7ff}.path-audit-content{width:100%;max-width:none;min-height:calc(100vh - 56px);margin:0 auto;padding:32px clamp(34px,4vw,56px) 50px;overflow:auto;background:radial-gradient(circle at 94% 0,rgba(196,181,253,.2),transparent 30rem),#f8f7ff}.path-audit-view{width:100%;max-width:none;margin:0 auto}.path-audit-kicker{display:flex;align-items:center;gap:8px;color:#8e8499;font:700 12px/1 'DM Sans',sans-serif;letter-spacing:.12em;text-transform:uppercase}.path-audit-kicker i,.path-audit-hero .path-audit-kicker i{width:6px;height:6px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 4px #eee8ff;transform:none}.path-audit-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:148px;margin-bottom:20px;padding:29px 24px;border:1px solid #e6ddf5;border-left:2px solid #c4b5fd;border-radius:12px;background:linear-gradient(112deg,#fcfaff,#f5efff);box-shadow:0 12px 30px rgba(57,36,93,.04)}.path-audit-hero h1{margin:9px 0 7px;color:#2c2537;font:700 31px/1.12 Manrope,sans-serif;letter-spacing:-.045em}.path-audit-hero p{margin:0;color:#83778b;font:14px/1.4 'DM Sans',sans-serif}.path-audit-hero-badge{display:flex;align-items:center;gap:9px;padding:11px 13px;border:1px solid #dfd2f1;border-radius:8px;background:#fff;color:#6d3ec5}.path-audit-hero-badge span{display:flex;flex-direction:column;gap:2px}.path-audit-hero-badge strong{font:700 12px Manrope,sans-serif}.path-audit-hero-badge small{color:#a097a8;font:12px 'DM Sans',sans-serif}.path-audit-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:20px}.path-audit-stat{position:relative;overflow:hidden;padding:17px 18px;border:1px solid #e7e2ef;border-radius:9px;background:#fff;box-shadow:0 10px 28px #39245d0a}.path-audit-stat>span,.path-audit-stat small{color:#9990a1;font:12px 'DM Sans',sans-serif}.path-audit-stat strong{display:block;margin:9px 0 4px;color:#352d40;font:700 25px/1 Manrope,sans-serif;letter-spacing:-.04em}.path-audit-stat small{display:block;min-height:14px}.path-audit-stat>i{position:absolute;right:15px;top:16px;color:#a78bfa;font-size:19px}.path-audit-stat-blue>i{color:#6793c9}.path-audit-stat-amber>i{color:#c38b32}.path-audit-stat-red>i{color:#c56767}.path-audit-toolbar{display:flex;align-items:center;gap:9px;margin-bottom:14px}.path-audit-search{display:flex;align-items:center;gap:8px;min-width:210px;flex:1;height:35px;padding:0 10px;border:1px solid #e4deec;border-radius:7px;background:#fff;color:#9b90a2}.path-audit-search input{width:100%;border:0;outline:0;background:transparent;color:#665a70;font:12px 'DM Sans',sans-serif}.path-audit-toolbar select,.path-audit-date{height:35px;max-width:146px;border:1px solid #e4deec;border-radius:7px;padding:0 8px;outline:0;background:#fff;color:#786d81;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.path-audit-date{max-width:142px}.path-audit-filter-group{display:flex;gap:4px;flex-wrap:wrap}.path-audit-filter-group button{padding:9px 10px;border:1px solid #e5deed;border-radius:6px;background:#fff;color:#978c9e;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.path-audit-filter-group button.active,.path-audit-filter-group button:hover{border-color:#d5c0f5;background:#f3edff;color:#6d3ec5}.path-audit-clear{display:grid;width:34px;height:34px;flex:none;border:0;border-radius:7px;place-items:center;background:transparent;color:#958a9c;cursor:pointer}.path-audit-clear:hover{background:#f1ebff;color:#6d3ec5}.path-audit-clear:disabled{cursor:not-allowed;opacity:.4}.path-audit-export,.path-audit-primary{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:35px;flex:none;border:0;border-radius:7px;padding:0 11px;background:#7c3aed;color:#fff;font:800 12px 'DM Sans',sans-serif;cursor:pointer;box-shadow:0 7px 17px rgba(124,58,237,.16)}.path-audit-export:hover,.path-audit-primary:hover{background:#6d28d9}.path-audit-error{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;border:1px solid #f0c7c7;border-radius:8px;padding:10px 12px;background:#fff5f5;color:#a63e3e;font:12px 'DM Sans',sans-serif}.path-audit-error button{display:inline-flex;align-items:center;gap:5px;border:0;background:transparent;color:inherit;font:800 12px 'DM Sans',sans-serif;cursor:pointer}.path-audit-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.72fr);gap:14px}.path-audit-ledger,.path-audit-detail{overflow:hidden;border:1px solid #e5deed;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(57,36,93,.045)}.path-audit-ledger-heading{display:flex;align-items:center;justify-content:space-between;padding:19px}.path-audit-ledger-heading h2{margin:7px 0 0;color:#3b3245;font:700 19px/1 Manrope,sans-serif;letter-spacing:-.035em}.path-audit-ledger-heading h2 b{display:inline-grid;width:25px;height:20px;margin-left:5px;place-items:center;border-radius:5px;background:#f0e8fc;color:#7445c6;font:800 12px 'DM Sans',sans-serif;vertical-align:middle}.path-audit-retention{display:flex;align-items:center;gap:5px;color:#9b91a2;font:12px 'DM Sans',sans-serif}.path-audit-table-head,.path-audit-record{display:grid;grid-template-columns:minmax(240px,1.55fr) minmax(150px,1fr) 105px 125px;gap:14px;align-items:center}.path-audit-table-head{padding:9px 19px;border-top:1px solid #f0edf4;border-bottom:1px solid #f0edf4;color:#aaa0ad;font:800 11px 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase}.path-audit-record{width:100%;min-height:0;border:0;border-bottom:1px solid #f0edf4;padding:14px 19px;background:#fff;color:inherit;text-align:left;cursor:pointer}.path-audit-record:hover,.path-audit-record.selected{background:#fbf9ff}.path-audit-record.selected{box-shadow:inset 2px 0 #7c3aed}.path-audit-activity,.path-audit-actor{display:flex;min-width:0;align-items:center;gap:9px}.path-audit-activity>i{display:grid;width:31px;height:31px;flex:none;border-radius:9px;place-items:center;background:#eee7fd;color:#7547c9;font-size:18px}.path-audit-activity>i.failed{background:#fff0f0;color:#bb5959}.path-audit-activity>span:last-child,.path-audit-actor>span:last-child{display:flex;min-width:0;flex-direction:column;gap:3px}.path-audit-activity strong,.path-audit-actor strong{overflow:hidden;color:#5b4f64;font:700 12px/1.2 Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.path-audit-activity small,.path-audit-actor small{overflow:hidden;color:#a49aa8;font:11px/1.25 'DM Sans',sans-serif;text-overflow:ellipsis;white-space:nowrap}.path-audit-avatar{display:grid;width:29px;height:29px;flex:none;border:1px solid #ebe5f1;border-radius:8px;place-items:center;object-fit:cover;font:800 11px 'DM Sans',sans-serif}.path-audit-type{width:max-content;padding:5px 7px;border-radius:5px;background:#eee7fd;color:#7650be;font:800 11px 'DM Sans',sans-serif}.path-audit-type.failed{background:#fff0f0;color:#b54d4d}.path-audit-time{display:flex;flex-direction:column;gap:3px;color:#aaa0ad;font:11px/1.25 'DM Sans',sans-serif}.path-audit-time b{color:#908695;font:800 12px 'DM Sans',sans-serif}.path-audit-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;background:#fcfbfe;color:#9990a1;font:12px 'DM Sans',sans-serif}.path-audit-pagination>div{display:flex;align-items:center;gap:6px}.path-audit-pages{display:flex;gap:4px}.path-audit-page-arrow,.path-audit-pages button{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:28px;border:1px solid #e4deec;border-radius:6px;background:#fff;color:#83778d;font:700 12px 'DM Sans',sans-serif;cursor:pointer}.path-audit-page-arrow{padding:0 9px}.path-audit-pages button{width:28px}.path-audit-page-arrow:hover:not(:disabled),.path-audit-pages button:hover,.path-audit-pages button.active{border-color:#d4c0f5;background:#f2ebff;color:#6d3ec5}.path-audit-page-arrow:disabled{cursor:not-allowed;opacity:.42}.path-audit-detail{padding:20px}.path-audit-detail-icon{display:grid;width:43px;height:43px;margin:20px 0 12px;border-radius:12px;place-items:center;background:#eee7fd;color:#7044c5}.path-audit-detail-icon.failed{background:#fff0f0;color:#bb5959}.path-audit-detail h2{margin:0;color:#3b3245;font:700 18px/1.2 Manrope,sans-serif;letter-spacing:-.035em}.path-audit-detail>p{margin:6px 0 18px;color:#918696;font:12px/1.45 'DM Sans',sans-serif}.path-audit-detail-status{display:flex;align-items:center;justify-content:space-between;border-radius:7px;padding:11px 12px;background:#f8f4ff}.path-audit-detail-status span,.path-audit-detail-meta span,.path-audit-detail-actor span{color:#a39aa9;font:11px 'DM Sans',sans-serif}.path-audit-detail-status strong{color:#6d3ec5;font:700 12px Manrope,sans-serif}.path-audit-detail-status strong.failed{color:#b54d4d}.path-audit-detail-meta{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px;margin:20px 0;padding:16px 0;border-top:1px solid #f0edf4;border-bottom:1px solid #f0edf4}.path-audit-detail-meta div,.path-audit-detail-actor div{display:flex;min-width:0;flex-direction:column;gap:4px}.path-audit-detail-meta strong,.path-audit-detail-actor strong{overflow:hidden;color:#63566b;font:700 12px/1.3 Manrope,sans-serif;text-overflow:ellipsis}.path-audit-detail-actor{display:flex;align-items:center;gap:9px}.path-audit-document-link{display:inline-flex;align-items:center;gap:6px;margin-top:18px;border:0;background:transparent;color:#6e40c3;font:800 12px 'DM Sans',sans-serif;cursor:pointer}.path-audit-detail-note{display:flex;gap:7px;margin-top:19px;border-radius:7px;padding:10px;background:#fbf9ff;color:#8e82a3;font:11px/1.4 'DM Sans',sans-serif}.path-audit-empty{display:flex;align-items:center;flex-direction:column;gap:7px;padding:70px 20px;color:#a49aa8;text-align:center}.path-audit-empty strong{color:#62566c;font:700 13px Manrope,sans-serif}.path-audit-empty span{font:12px 'DM Sans',sans-serif}.path-audit-detail-empty{min-height:420px;justify-content:center}.path-audit-spin{animation:pathAuditSpin .8s linear infinite}@keyframes pathAuditSpin{to{transform:rotate(360deg)}}.path-audit-denied{display:flex;min-height:55vh;flex:1;align-items:center;flex-direction:column;justify-content:center;gap:10px;padding:40px;color:#827789;text-align:center}.path-audit-denied>svg{color:#7c3aed}.path-audit-denied h2{margin:0;color:#3b3245;font:700 19px Manrope,sans-serif}.path-audit-denied p{margin:0;font:12px 'DM Sans',sans-serif}.path-audit-footer{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #e5deed;padding:10px 20px;background:#fff;color:#9e95a6;font:11px 'DM Sans',sans-serif}.path-audit-footer>span:last-child{display:flex;align-items:center;gap:5px}.path-audit-footer i{width:6px;height:6px;border-radius:50%;background:#4fa174}
@media(min-width:1100px){.path-audit-content{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}
@media(max-width:1100px){.path-audit-toolbar{align-items:stretch;flex-wrap:wrap}.path-audit-search{min-width:45%}.path-audit-layout{grid-template-columns:1fr}.path-audit-detail{order:-1}.path-audit-detail-empty{min-height:220px}.path-audit-content{padding:28px 30px 42px}}
@media(max-width:900px){.path-audit-hero{align-items:flex-start;flex-direction:column;min-height:0}.path-audit-stat-grid{grid-template-columns:repeat(2,1fr)}.path-audit-table-head{display:none}.path-audit-record{grid-template-columns:minmax(0,1fr) auto;gap:10px}.path-audit-record>.path-audit-actor{grid-column:1;grid-row:2}.path-audit-record>.path-audit-type{grid-column:2;grid-row:2;justify-self:end}.path-audit-record>.path-audit-time{grid-column:2;grid-row:1;align-items:flex-end}.path-audit-retention{display:none}.path-audit-pagination{align-items:flex-start;flex-direction:column}.path-audit-pagination>div{width:100%;justify-content:space-between}}
@media(max-width:640px){.path-audit-content{padding:20px 16px 34px}.path-audit-hero{padding:22px 18px}.path-audit-hero h1{font-size:27px}.path-audit-hero-badge{width:100%}.path-audit-stat-grid{gap:9px}.path-audit-stat{padding:13px}.path-audit-stat strong{font-size:21px}.path-audit-toolbar{gap:7px}.path-audit-search{min-width:100%}.path-audit-filter-group{width:100%;overflow:auto;flex-wrap:nowrap;padding-bottom:3px}.path-audit-filter-group button{white-space:nowrap}.path-audit-toolbar select,.path-audit-date{max-width:calc(50% - 4px);flex:1}.path-audit-export{margin-left:auto}.path-audit-record{padding:13px 14px}.path-audit-activity strong{font-size:12px}.path-audit-pagination{padding:12px 14px}.path-audit-page-arrow{padding:0 7px;font-size:0}.path-audit-page-arrow svg{margin:0}.path-audit-pages{flex:1;justify-content:center}.path-audit-detail{padding:17px}.path-audit-footer{align-items:flex-start;flex-direction:column;gap:6px;padding:10px 16px}}
`;