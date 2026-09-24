import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" />
    </svg>
  ),
  Plus: ({ color = "currentColor", size = 14 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      width={size}
      height={size}
    >
      <path d="M8 1v14M1 8h14" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  Workflow: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="3" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="6" cy="5" r="3" />
      <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="2" />
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Help: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" />
    </svg>
  ),
  Search: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
      <path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="12"
      height="12"
    >
      <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
    </svg>
  ),
  Share: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="12" cy="3" r="2" />
      <circle cx="4" cy="8" r="2" />
      <circle cx="12" cy="13" r="2" />
      <path d="M6 7l4-3M6 9l4 3" strokeLinecap="round" />
    </svg>
  ),
  More: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="4" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
    </svg>
  ),
  Download: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" strokeLinecap="round" />
    </svg>
  ),
  Attach: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <path
        d="M13 7l-5 5a4 4 0 01-5.7-5.7l5-5a2.5 2.5 0 013.5 3.5l-5 5a1 1 0 01-1.4-1.4l4-4"
        strokeLinecap="round"
      />
    </svg>
  ),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path
        d="M2 2h8l3 3v9H2V2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5 7h6M5 9.5h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="12.5" r="3" fill="#6b38d4" />
      <path
        d="M11.5 12.5l.8.8 1.4-1.4"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  Reassign: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <circle cx="6" cy="5" r="3" />
      <path d="M1 14c0-3 2-5 5-5M11 8l3 3-3 3M14 11H9" strokeLinecap="round" />
    </svg>
  ),
  Return: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path
        d="M12 4H6a4 4 0 000 8h2M9 11l3 3 3-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bell: ({ dot }) => (
    <div style={{ position: "relative" }}>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        width="15"
        height="15"
      >
        <path d="M8 1a5 5 0 00-5 5v3l-1 2h12l-1-2V6a5 5 0 00-5-5zM6 13a2 2 0 004 0" />
      </svg>
      {dot && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 7,
            height: 7,
            background: "#ba1a1a",
            borderRadius: "50%",
            border: "1.5px solid white",
          }}
        />
      )}
    </div>
  ),
  Live: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="8" height="8">
      <circle cx="8" cy="8" r="8" />
    </svg>
  ),
  Submitted: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <path d="M2 12V4l6-2 6 2v8l-6 2-6-2z" />
      <path d="M8 2v12M2 6l6 2 6-2" strokeLinecap="round" />
    </svg>
  ),
  Tracking: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l3 2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect
        x="9"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
      <rect
        x="1.5"
        y="9"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  SLA: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path
        d="M8 4.5v3.8l2.6 1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ── Badge system ──────────────────────────────────────────────────────────────
const BADGE = {
  pending: { bg: "#e7deff", color: "#5f5293" },
  "for approval": { bg: "#e7deff", color: "#5f5293" },
  "in progress": { bg: "#e3dfff", color: "#494454" },
  done: { bg: "#e9ddff", color: "#5516be" },
  approved: { bg: "#e9ddff", color: "#5516be" },
  overdue: { bg: "#ffdad6", color: "#93000a" },
  returned: { bg: "#fce7f3", color: "#9d174d" },
  high: { bg: "#ffdad6", color: "#93000a" },
  medium: { bg: "#efe0ff", color: "#712ae2" },
  low: { bg: "#f3edff", color: "#6b38d4" },
  received: { bg: "#e9ddff", color: "#5516be" },
};

// Statuses that mean the task is complete/approved — shown in primary purple
// with an "Approved" label regardless of the raw status string ("Received").
const APPROVED_STATUSES = ["received", "approved"];

function Badge({ label }) {
  const key = label?.toLowerCase();
  const isApproved = APPROVED_STATUSES.includes(key);
  const s = isApproved
    ? BADGE["received"]
    : BADGE[key] || { bg: "#efebff", color: "#494454" };
  return (
    <span
      style={{
        ...s,
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: "bold",
        textTransform: "capitalize",
      }}
    >
      {isApproved ? "Approved" : label}
    </span>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────
function TimelineItem({ label, value, sub, dot = "#6b38d4", isLast }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        paddingBottom: isLast ? 0 : 16,
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dot,
            flexShrink: 0,
            marginTop: 3,
          }}
        />
        {!isLast && (
          <div
            style={{ width: 1, flex: 1, background: "#cbc3d7", marginTop: 4 }}
          />
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, color: "#7b7486" }}>{label}</div>
        <div
          style={{
            fontSize: 13,
            fontWeight: "bold",
            color: "#181445",
            marginTop: 1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "#7b7486", marginTop: 1 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Live Indicator ────────────────────────────────────────────────────────────
function LiveDot({ connected }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        fontSize: 12,
        fontWeight: 700,
        color: connected ? "#059669" : "#d97706",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: connected ? "#10b981" : "#f59e0b",
          display: "inline-block",
          boxShadow: connected ? "0 0 0 2px #d1fae5" : "0 0 0 2px #fef3c7",
        }}
      />
      {connected ? "Live" : "Reconnecting..."}
    </div>
  );
}

// ── Realtime Toast ────────────────────────────────────────────────────────────
// Icon-badge style (matches the one now used on the Notifications page)
// instead of a plain emoji glyph — a colored square icon, bold title, gray
// subtitle, and an X to dismiss.
function Toast({ toasts, onDismiss }) {
  const TOAST_ICON = {
    info: () => (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 7v4M8 5v.01" strokeLinecap="round" />
      </svg>
    ),
    error: () => (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 5v4M8 11v.01" strokeLinecap="round" />
      </svg>
    ),
    submission: () => (
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        width="14"
        height="14"
      >
        <path
          d="M8 1v9M4 7l4 4 4-4M2 13h12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };
  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => {
        const isError = t.type === "error";
        const ToastIcon = TOAST_ICON[t.type] || TOAST_ICON.info;
        return (
          <div
            key={t.id}
            style={{
              background: "white",
              border: `1px solid ${isError ? "#fecaca" : "#cbc3d7"}`,
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
              minWidth: 260,
              maxWidth: 340,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              animation: "slideIn 0.2s ease",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 7,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isError ? "#ffdad6" : "#e9ddff",
                color: isError ? "#ba1a1a" : "#6b38d4",
              }}
            >
              <ToastIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 1, color: "#181445" }}>{t.title}</div>
              {t.body && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.75,
                    fontWeight: 400,
                    color: "#494454",
                  }}
                >
                  {t.body}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                opacity: 0.5,
                padding: 0,
                color: "inherit",
              }}
            >
              <Icon.Close />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Avatar (profile picture with initials fallback) ────────────────────────────
// Renders a person's real profile photo when a picture URL is available and
// loads successfully; otherwise falls back to the existing colored-initial
// circle look used throughout this file. Pass through the same
// size/background/color/border/fontSize props each call site already used
// for its initials circle so the visual footprint doesn't change.
function AvatarCircle({
  name,
  pictureUrl,
  size = 32,
  background = "#e9ddff",
  color = "#5516be",
  fontSize,
  border,
  className,
  style,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (name || "?")[0]?.toUpperCase() || "?";

  if (pictureUrl && !imgFailed) {
    return (
      <img
        src={pictureUrl}
        alt={name || "Avatar"}
        onError={() => setImgFailed(true)}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border,
          ...style,
        }}
      />
    );
  }
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSize || Math.round(size * 0.4),
        fontWeight: 700,
        flexShrink: 0,
        border,
        ...style,
      }}
    >
      {initial}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TaskAssigned() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  })();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);
  const API = import.meta.env.VITE_API_URL;
  // Attachments/submissions now store full R2 URLs (https://...). Older rows
  // created before the R2 migration may still have local paths like
  // "/uploads/tasks/xyz.pdf" — those still need the API host prepended.
  const resolveFileUrl = (u) =>
    !u ? "" : /^https?:\/\//i.test(u) ? u : `${API}${u}`;

  // Faculty/staff profile pictures aren't included on task/comment payloads
  // (those only carry a name), so we fetch the user directory once and join
  // on name wherever an avatar is shown.
  const [usersDirectory, setUsersDirectory] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.users ?? data ?? [];
        if (!cancelled) setUsersDirectory(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setUsersDirectory([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, token]);
  const avatarByName = {};
  usersDirectory.forEach((u) => {
    if (!u) return;
    // Task/comment payloads carry names as "First Last" strings, so the
    // directory must be keyed the same way. The /api/users endpoint returns
    // first_name/last_name (not full_name) - see UserManagement.jsx, which
    // builds its own display name the same way (first_name + " " + last_name).
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    const name = fullName || u.full_name || u.name || u.username;
    if (name) {
      avatarByName[name] = u.avatar_url || null;
    }
    // Also key by username as a fallback in case a caller passes that instead.
    if (u.username) {
      avatarByName[u.username] = u.avatar_url || null;
    }
  });
  const avatarUrlFor = (name) => {
    const raw = avatarByName[name];
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `${API}${raw}`;
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pendingApproval: 0,
    submitted: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dateRange, setDateRange] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("All");
  const [taskPage, setTaskPage] = useState(1);
  const [checkedIds, setCheckedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [comment, setComment] = useState("");
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentFilePreviews, setCommentFilePreviews] = useState([]); // object URLs, one per commentFile
  const commentFileInputRef = useRef(null);
  const [fileViewer, setFileViewer] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [newSubmissions, setNewSubmissions] = useState({}); // taskId → true
  const [actionLoading, setActionLoading] = useState(null); // "approve"|"return"|"reassign"
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [deadlineTimeDraft, setDeadlineTimeDraft] = useState("17:00");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [returnFiles, setReturnFiles] = useState([]);
  const [returnFilePreviews, setReturnFilePreviews] = useState([]);
  const [returnDragOver, setReturnDragOver] = useState(false);
  const returnFileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("info"); // "info"|"documents"|"activity"
  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const PER_PAGE = 8;

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const pushToast = useCallback((title, body, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, title, body, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      6000,
    );
  }, []);

  const dismissToast = useCallback(
    (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  // ── Fetch tasks ────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: search,
        status: statusFilter === "All" ? "" : statusFilter,
        priority: priorityFilter === "All" ? "" : priorityFilter,
        date: dateRange,
        docType: docTypeFilter === "All" ? "" : docTypeFilter,
      }).toString();
      const res = await fetch(`${API}/api/tasks/assigned-by-me?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        navigate("/login");
        return;
      }
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setStats(
        data.stats || {
          total: 0,
          pendingApproval: 0,
          submitted: 0,
          overdue: 0,
        },
      );
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, priorityFilter, dateRange, docTypeFilter]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [fetchTasks]);

  // ── Re-fetch selected task detail on tasks update ─────────────────────────
  useEffect(() => {
    if (selected) {
      const fresh = tasks.find((t) => t.id === selected.id);
      if (fresh)
        setSelected((prev) => ({
          ...fresh,
          comments: prev?.comments || fresh.comments,
          submissions: prev?.submissions || fresh.submissions,
        }));
    }
  }, [tasks]);

  // ── Fetch full task detail (gets all fields like document_type, due_date) ─
  const fetchSelectedTask = useCallback(
    async (taskId) => {
      try {
        const res = await fetch(`${API}/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          navigate("/login");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const detail = data.task || data;
        setSelected((prev) => ({
          ...prev,
          ...detail,
          doc_type: detail.doc_type || prev?.doc_type,
          deadline: detail.deadline || prev?.deadline,
        }));
      } catch (err) {
        console.error("Failed to load task detail:", err);
      }
    },
    [API, token],
  );

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
    socket.on(
      "task:submitted",
      ({ taskId, taskTitle, facultyName, attachmentCount, files }) => {
        setNewSubmissions((prev) => ({ ...prev, [taskId]: true }));
        pushToast(
          `📥 ${facultyName} submitted a task`,
          `"${taskTitle}"${attachmentCount ? ` · ${attachmentCount} document${attachmentCount > 1 ? "s" : ""} attached` : ""}`,
          "submission",
        );
        // Inject submitted files into the open task's submissions array in real-time
        if (files?.length) {
          const realtimeGroupId = `sub_rt_${taskId}_${Date.now()}`;
          setSelected((prev) => {
            if (!prev || prev.id !== taskId) return prev;
            const existing = prev.submissions || [];
            const newFiles = files.map((f) => ({
              file_name: f.originalname || f.name,
              name: f.originalname || f.name,
              file_url: f.url || f.path || "",
              url: f.url || f.path || "",
              size: f.size,
              submitted_at: new Date().toISOString(),
              submission_group_id: realtimeGroupId,
            }));
            return {
              ...prev,
              status: "For Approval",
              submissions: [...existing, ...newFiles],
            };
          });
        }
        fetchTasks();
      },
    );

    // Task status changed — no local toast here anymore; this is now
    // surfaced through the Notifications page's generic "notification"
    // feed (task_status_changed in Notifications.jsx's TYPE_CFG) instead
    // of duplicating it as a page-local toast.
    socket.on("task:status_changed", () => {
      fetchTasks();
    });

    // New comment — append in real-time without a page refresh
    socket.on("task:comment_added", ({ taskId, comment: incoming }) => {
      setSelected((prev) => {
        if (!prev || prev.id !== taskId) return prev;
        // 1. Already confirmed by id — ignore echo entirely
        const alreadyExists = prev.comments.some(
          (c) => c.id && c.id === incoming.id,
        );
        if (alreadyExists) return prev;
        // 2. Replace a matching _pending optimistic entry sent by us
        const pendingIdx = prev.comments.findIndex(
          (c) => c._pending && c.content === incoming.content,
        );
        if (pendingIdx !== -1) {
          const updated = [...prev.comments];
          updated[pendingIdx] = incoming; // swap pending → confirmed
          return { ...prev, comments: updated };
        }
        // 3. New comment from someone else — append
        return { ...prev, comments: [...prev.comments, incoming] };
      });
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          const alreadyExists = (t.comments || []).some(
            (c) => c.id && c.id === incoming.id,
          );
          if (alreadyExists) return t;
          return { ...t, comments: [...(t.comments || []), incoming] };
        }),
      );
    });

    // Typing indicators
    socket.on("task:user_typing", ({ taskId, userId, name }) => {
      if (!selectedRef.current || selectedRef.current.id !== taskId) return;
      if (userId === user.id) return;
      setTypingUsers((prev) =>
        prev.some((u) => u.userId === userId)
          ? prev
          : [...prev, { userId, name }],
      );
    });

    socket.on("task:user_stop_typing", ({ taskId, userId }) => {
      if (!selectedRef.current || selectedRef.current.id !== taskId) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // New attachment added to an open task
    socket.on("task:attachment_added", ({ taskId, fileName, file }) => {
      pushToast("New document received", fileName, "submission");
      // Inject the new file into submissions immediately without waiting for fetchTasks
      if (file) {
        const attachGroupId = `sub_att_${taskId}_${Date.now()}`;
        setSelected((prev) => {
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
          return {
            ...prev,
            submissions: [...(prev.submissions || []), newFile],
          };
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
      await fetch(`${API}/api/tasks/${taskId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      // No local toast here anymore — approval is a status change, so it
      // now surfaces through the Notifications page's generic feed instead.
      setNewSubmissions((prev) => {
        const n = { ...prev };
        delete n[taskId];
        return n;
      });
      fetchTasks();
    } catch {
      pushToast("Error", "Could not approve task.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveSingle = async (taskId) => {
    setActionLoading("archive");
    try {
      await fetch(`${API}/api/tasks/${taskId}/archive-for-me`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
    } catch {
      // non-fatal
    } finally {
      setActionLoading(null);
    }
  };

  // Combines the date + time inputs (entered as Philippines local time) into
  // a "YYYY-MM-DD HH:mm:ss" string converted to UTC — same convention as
  // TaskAssignment.jsx's create form, since deadline is stored in UTC and
  // only converted to Manila time for display (see formatDeadlineText in
  // slaController.js). Manila is a fixed UTC+8, no DST.
  const combineDeadlineToUTC = (dateStr, timeStr) => {
    if (!dateStr) return "";
    const [h, m] = (timeStr || "00:00").split(":").map(Number);
    const [y, mo, d] = dateStr.split("-").map(Number);
    const utcMs = Date.UTC(y, mo - 1, d, h, m) - 8 * 60 * 60 * 1000;
    return new Date(utcMs).toISOString().slice(0, 19).replace("T", " ");
  };

  const handleUpdateDeadline = async (taskId) => {
    if (!deadlineDraft) {
      pushToast("Error", "Please pick a date.", "error");
      return;
    }
    setSavingDeadline(true);
    try {
      const deadlineUTC = combineDeadlineToUTC(
        deadlineDraft,
        deadlineTimeDraft,
      );
      const res = await fetch(`${API}/api/tasks/${taskId}/deadline`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deadline: deadlineUTC }),
      });
      if (!res.ok) {
        let msg = `Server returned ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      // No local toast here anymore — the deadline change now surfaces
      // through the Notifications page's generic feed instead
      // (task_deadline_changed in Notifications.jsx's TYPE_CFG).
      setSelected((prev) => (prev ? { ...prev, deadline: deadlineUTC } : prev));
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, deadline: deadlineUTC } : t,
        ),
      );
      setEditingDeadline(false);
      fetchTasks();
    } catch (err) {
      pushToast(
        "Error",
        err.message || "Could not update the deadline.",
        "error",
      );
    } finally {
      setSavingDeadline(false);
    }
  };

  const handleReturn = async (taskId) => {
    setActionLoading("return");
    try {
      // 1. Mark task as returned (with note)
      await fetch(`${API}/api/tasks/${taskId}/return`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
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
            if (saved)
              uploadedFiles.push({
                name: saved.originalname || file.name,
                url: saved.url || "",
                isImg: /\.(jpg|jpeg|png|gif|webp)$/i.test(
                  saved.originalname || file.name,
                ),
                size: file.size,
              });
          }
        } catch {
          /* skip individual failed upload */
        }
      }

      // 3. Post a single __revision__ comment carrying note + file metadata
      const revisionPayload = { note: returnNote.trim(), files: uploadedFiles };
      await fetch(`${API}/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `__revision__${JSON.stringify(revisionPayload)}`,
        }),
      });

      // Socket echo (task:comment_added) will deliver the confirmed comment in real-time.
      // No optimistic insert needed here — the POST already completed before we reach this line,
      // so adding a _pending copy would always appear AFTER the real one arrives.

      setReturnNote("");
      setShowReturnBox(false);
      returnFilePreviews.forEach((u) => URL.revokeObjectURL(u));
      setReturnFiles([]);
      setReturnFilePreviews([]);
      // No local toast here anymore — the return is a status change, so
      // it now surfaces through the Notifications page's generic feed
      // instead of stacking a duplicate toast on top of "Status updated".
      fetchTasks();
    } catch {
      pushToast("Error", "Could not return task.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostComment = async () => {
    if (!comment.trim() && commentFiles.length === 0) return;
    if (!selected) return;
    const content = comment.trim();
    setComment("");
    const filesToSend = [...commentFiles];
    commentFilePreviews.forEach((url) => URL.revokeObjectURL(url));
    setCommentFiles([]);
    setCommentFilePreviews([]);

    // Optimistic append for text
    if (content) {
      const optimistic = {
        content,
        sender_name: user.full_name || user.username || "You",
        created_at: new Date().toISOString(),
        _pending: true,
      };
      setSelected((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), optimistic],
      }));
    }

    try {
      if (content) {
        await fetch(`${API}/api/tasks/${selected.id}/comments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });
      }
      for (const file of filesToSend) {
        const fd = new FormData();
        fd.append("files", file);
        try {
          const uploadRes = await fetch(
            `${API}/api/tasks/${selected.id}/comment-upload`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            },
          );
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            const saved = uploadData.files?.[0];
            const fileUrl = saved?.url || `/uploads/tasks/${file.name}`;
            const fileName = saved?.originalname || file.name;
            const isImg = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
            const attachContent = `__attachment__${JSON.stringify({ name: fileName, isImg, url: fileUrl })}`;

            // Optimistically show the attachment in the discussion immediately
            const optimisticAttach = {
              content: attachContent,
              sender_name: user.full_name || user.username || "You",
              created_at: new Date().toISOString(),
              _pending: true,
            };
            setSelected((prev) =>
              prev
                ? {
                    ...prev,
                    comments: [...(prev.comments || []), optimisticAttach],
                  }
                : prev,
            );

            await fetch(`${API}/api/tasks/${selected.id}/comments`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ content: attachContent }),
            });
          } else {
            pushToast(
              "Upload failed",
              `Could not upload ${file.name}`,
              "error",
            );
          }
        } catch {
          pushToast("Upload error", `Failed to send ${file.name}`, "error");
        }
      }
      // Single fetchTasks after all files are done to sync state cleanly
      if (filesToSend.length > 0) fetchTasks();
    } catch {
      pushToast("Error", "Comment could not be sent.", "error");
    }
  };

  // Join/leave task room so typing events are scoped correctly
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    if (selected?.id) socket.emit("join_task", { taskId: selected.id });
    setTypingUsers([]);
    return () => {
      if (selected?.id) socket.emit("leave_task", { taskId: selected.id });
    };
  }, [selected?.id]);

  const emitTyping = useCallback(
    (isTyping) => {
      const socket = socketRef.current;
      if (!socket || !selected) return;
      socket.emit(isTyping ? "typing" : "stop_typing", {
        taskId: selected.id,
        name: user.full_name || user.username || "Someone",
      });
    },
    [selected, user],
  );

  const handleCommentChange = (e) => {
    setComment(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2500);
  };

  const handleArchive = async () => {
    if (!checkedIds.length) return;
    await Promise.all(
      checkedIds.map((id) =>
        fetch(`${API}/api/tasks/${id}/archive`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }),
      ),
    );
    setCheckedIds([]);
    setSelectAll(false);
    fetchTasks();
  };

  const toggleCheck = (id) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—";
  const fmtDateTime = (d) =>
    d
      ? new Date(d).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "—";
  // Deadlines are stored in UTC; show date + time in Manila local time (PHT) so it matches the SLA emails.
  const fmtDeadline = (d) =>
    d
      ? `${new Date(d).toLocaleString("en-US", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} PHT`
      : "—";

  const filteredTasks = tasks.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${t.tracking_id} ${t.title} ${t.assigned_to_name}`
        .toLowerCase()
        .includes(q)
    );
  });
  const pagedTasks = filteredTasks.slice(
    (taskPage - 1) * PER_PAGE,
    taskPage * PER_PAGE,
  );
  const totalTaskPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / PER_PAGE),
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PathTasksAssignedLayout
      navigate={navigate}
      user={user}
      avatarUrlFor={avatarUrlFor}
      tasks={tasks}
      stats={stats}
      loading={loading}
      selected={selected}
      search={search}
      statusFilter={statusFilter}
      priorityFilter={priorityFilter}
      dateRange={dateRange}
      docTypeFilter={docTypeFilter}
      taskPage={taskPage}
      totalTaskPages={totalTaskPages}
      pagedTasks={pagedTasks}
      filteredTasks={filteredTasks}
      checkedIds={checkedIds}
      selectAll={selectAll}
      newSubmissions={newSubmissions}
      socketConnected={socketConnected}
      actionLoading={actionLoading}
      returnNote={returnNote}
      showReturnBox={showReturnBox}
      toasts={toasts}
      onDismissToast={dismissToast}
      onSearchChange={(value) => {
        setSearch(value);
        setTaskPage(1);
      }}
      onStatusChange={(value) => {
        setStatusFilter(value);
        setTaskPage(1);
      }}
      onPriorityChange={(value) => {
        setPriorityFilter(value);
        setTaskPage(1);
      }}
      onDateChange={(value) => {
        setDateRange(value);
        setTaskPage(1);
      }}
      onDocTypeChange={(value) => {
        setDocTypeFilter(value);
        setTaskPage(1);
      }}
      onClearFilters={() => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setDateRange("");
        setDocTypeFilter("All");
        setTaskPage(1);
      }}
      onPageChange={setTaskPage}
      onSelectTask={(task) => {
        setSelected(task);
        fetchSelectedTask(task.id);
        setNewSubmissions((prev) => {
          const next = { ...prev };
          delete next[task.id];
          return next;
        });
        setActiveTab("info");
        setShowReturnBox(false);
        setEditingDeadline(false);
      }}
      onToggleCheck={toggleCheck}
      onToggleSelectAll={(checked) => {
        setSelectAll(checked);
        setCheckedIds(checked ? filteredTasks.map((task) => task.id) : []);
      }}
      onArchive={handleArchive}
      onArchiveSingle={handleArchiveSingle}
      onApprove={handleApprove}
      onSetReturnNote={setReturnNote}
      onToggleReturn={() => setShowReturnBox((value) => !value)}
      onReturn={handleReturn}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        color: "#181445",
        background: "#fcf8ff",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #6b38d4 !important; outline: none; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes typingBounce { 0%,60%,100% { transform:translateY(0); opacity:0.4; } 30% { transform:translateY(-4px); opacity:1; } }
        .task-row:hover { background: #f6f2ff !important; }
        .action-btn:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbc3d7; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
        * { scrollbar-width: thin; scrollbar-color: #cbc3d7 transparent; }
      `}</style>

      {/* Toast stack */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── Main ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "white",
        }}
      >
        

        {/* Page Body */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header + Stats + Filters */}
          <div
            style={{
              padding: "20px 24px 0",
              background: "white",
              borderBottom: "1px solid #efebff",
            }}
          >
            {/* Page Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#181445",
                    margin: "0 0 3px",
                  }}
                >
                  Tasks Assigned
                </h1>
                <p style={{ fontSize: 13, color: "#7b7486", margin: 0 }}>
                  Track tasks you assigned to faculty — review submissions,
                  approve, or return for revision.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: "1px solid #cbc3d7",
                    background: "white",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#494454",
                  }}
                >
                  <Icon.Download /> Export CSV
                </button>
                <button
                  onClick={() => navigate("/assign-task")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6b38d4",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "white",
                  }}
                >
                  <Icon.Plus color="white" size={12} /> Assign New Task
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 12,
                marginBottom: 18,
              }}
            >
              {[
                {
                  label: "Total Assigned",
                  value: stats.total,
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#6b38d4"
                      strokeWidth="1.5"
                      width="16"
                      height="16"
                    >
                      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
                    </svg>
                  ),
                  bg: "#e9ddff",
                },
                {
                  label: "For Approval",
                  value: stats.pendingApproval,
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#d97706"
                      strokeWidth="1.5"
                      width="16"
                      height="16"
                    >
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 4v4l2 2" strokeLinecap="round" />
                    </svg>
                  ),
                  bg: "#fef3c7",
                },
                {
                  label: "Submitted",
                  value: stats.submitted,
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.5"
                      width="16"
                      height="16"
                    >
                      <path d="M2 12V4l6-2 6 2v8l-6 2-6-2z" />
                      <path d="M8 2v12M2 6l6 2 6-2" strokeLinecap="round" />
                    </svg>
                  ),
                  bg: "#d1fae5",
                },
                {
                  label: "Overdue",
                  value: stats.overdue,
                  icon: (
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="#ba1a1a"
                      strokeWidth="1.5"
                      width="16"
                      height="16"
                    >
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3M8 10v1" strokeLinecap="round" />
                    </svg>
                  ),
                  bg: "#ffdad6",
                },
              ].map(({ label, value, icon, bg }) => (
                <div
                  key={label}
                  style={{
                    background: "white",
                    border: "1px solid #cbc3d7",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#7b7486",
                        marginBottom: 4,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#181445",
                      }}
                    >
                      {loading ? "—" : (value ?? 0)}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#f6f2ff",
                  border: "1px solid #cbc3d7",
                  borderRadius: 8,
                  padding: "7px 12px",
                }}
              >
                <Icon.Search />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setTaskPage(1);
                  }}
                  placeholder="Search by tracking #, keyword..."
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13,
                    color: "#494454",
                    width: "100%",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 12px",
                  border: "1px solid #cbc3d7",
                  borderRadius: 8,
                  background: "white",
                  fontSize: 13,
                  color: "#494454",
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="12"
                  height="12"
                >
                  <rect x="2" y="3" width="12" height="11" rx="1" />
                  <path d="M5 1v3M11 1v3M2 7h12" />
                </svg>
                <span style={{ color: "#7b7486" }}>Date Range</span>
                <input
                  type="date"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    outline: "none",
                    cursor: "pointer",
                    color: "#494454",
                  }}
                />
              </div>
              {[
                {
                  label: "Priority",
                  value: priorityFilter,
                  set: setPriorityFilter,
                  opts: ["All", "High", "Medium", "Low"],
                },
                {
                  label: "Status",
                  value: statusFilter,
                  set: setStatusFilter,
                  opts: [
                    "All",
                    "Pending",
                    "For Approval",
                    "In Progress",
                    "Approved",
                    "Returned",
                    "Overdue",
                    "Done",
                  ],
                },
                {
                  label: "Doc Type",
                  value: docTypeFilter,
                  set: setDocTypeFilter,
                  opts: [
                    "All",
                    "Financial",
                    "Legal",
                    "Sales",
                    "HR",
                    "Operations",
                  ],
                },
              ].map(({ label, value, set, opts }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 12px",
                    border: "1px solid #cbc3d7",
                    borderRadius: 8,
                    background: "white",
                    fontSize: 13,
                  }}
                >
                  <Icon.Filter />
                  <select
                    value={value}
                    onChange={(e) => {
                      set(e.target.value);
                      setTaskPage(1);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 13,
                      outline: "none",
                      cursor: "pointer",
                      color: "#494454",
                    }}
                  >
                    {opts.map((o) => (
                      <option key={o} value={o}>
                        {o === "All" ? label : o}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {(statusFilter !== "All" ||
                priorityFilter !== "All" ||
                docTypeFilter !== "All" ||
                dateRange) && (
                <button
                  onClick={() => {
                    setStatusFilter("All");
                    setPriorityFilter("All");
                    setDocTypeFilter("All");
                    setDateRange("");
                  }}
                  style={{
                    fontSize: 13,
                    color: "#6b38d4",
                    fontWeight: 700,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "7px 10px",
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Task Feed + Detail */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {/* LEFT: Task Feed */}
            <div
              style={{
                width: 340,
                flexShrink: 0,
                borderRight: "1px solid #cbc3d7",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Feed header */}
              <div
                style={{
                  padding: "14px 16px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #efebff",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: "#181445" }}
                  >
                    Assigned Tasks
                  </span>
                  <span
                    style={{
                      background: "#6b38d4",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "1px 7px",
                      borderRadius: 20,
                    }}
                  >
                    {filteredTasks.length}
                  </span>
                  {Object.keys(newSubmissions).length > 0 && (
                    <span
                      style={{
                        background: "#ba1a1a",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "1px 7px",
                        borderRadius: 20,
                        animation: "pulse 1.5s infinite",
                      }}
                    >
                      {Object.keys(newSubmissions).length} new
                    </span>
                  )}
                </div>
              </div>

              {/* Bulk actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderBottom: "1px solid #efebff",
                  background: "#f6f2ff",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => {
                    setSelectAll(e.target.checked);
                    setCheckedIds(
                      e.target.checked ? filteredTasks.map((t) => t.id) : [],
                    );
                  }}
                  style={{ accentColor: "#6b38d4" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#7b7486",
                    letterSpacing: 0.5,
                  }}
                >
                  SELECT ALL
                </span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
                  <button
                    onClick={handleArchive}
                    disabled={!checkedIds.length}
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: checkedIds.length ? "#494454" : "#a39aad",
                      background: "none",
                      border: "none",
                      cursor: checkedIds.length ? "pointer" : "default",
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>

              {/* Task rows */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {loading ? (
                  <div
                    style={{
                      padding: 32,
                      textAlign: "center",
                      color: "#7b7486",
                      fontSize: 13,
                    }}
                  >
                    Loading tasks...
                  </div>
                ) : pagedTasks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#7b7486",
                        fontWeight: 600,
                      }}
                    >
                      No assigned tasks found
                    </div>
                    <div
                      style={{ fontSize: 13, color: "#a39aad", marginTop: 4 }}
                    >
                      Try adjusting your filters or assign a new task
                    </div>
                  </div>
                ) : (
                  pagedTasks.map((task) => {
                    const hasNew = !!newSubmissions[task.id];
                    const isForApproval =
                      task.status?.toLowerCase() === "for approval";
                    return (
                      <div
                        key={task.id}
                        className="task-row"
                        onClick={() => {
                          setSelected(task);
                          fetchSelectedTask(task.id);
                          setNewSubmissions((prev) => {
                            const n = { ...prev };
                            delete n[task.id];
                            return n;
                          });
                          setActiveTab("info");
                          setShowReturnBox(false);
                          setEditingDeadline(false);
                        }}
                        style={{
                          padding: "12px 16px",
                          borderBottom: "1px solid #efebff",
                          cursor: "pointer",
                          background:
                            selected?.id === task.id ? "#f6f2ff" : "white",
                          borderLeft:
                            selected?.id === task.id
                              ? "3px solid #6b38d4"
                              : hasNew
                                ? "3px solid #ba1a1a"
                                : "3px solid transparent",
                          transition: "all 0.1s",
                          position: "relative",
                        }}
                      >
                        {hasNew && (
                          <div
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              width: 8,
                              height: 8,
                              background: "#ba1a1a",
                              borderRadius: "50%",
                              animation: "pulse 1.5s infinite",
                            }}
                          />
                        )}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                          }}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCheck(task.id);
                            }}
                            style={{ paddingTop: 2 }}
                          >
                            <input
                              type="checkbox"
                              checked={checkedIds.includes(task.id)}
                              onChange={() => toggleCheck(task.id)}
                              style={{ accentColor: "#6b38d4" }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 3,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#6b38d4",
                                  fontWeight: 700,
                                }}
                              >
                                {task.tracking_id}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  color:
                                    task.deadline &&
                                    new Date(task.deadline) < new Date()
                                      ? "#ba1a1a"
                                      : "#7b7486",
                                }}
                              >
                                {fmtDate(task.deadline || task.created_at)}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#181445",
                                marginBottom: 4,
                                lineHeight: 1.3,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {task.title || "(No title)"}
                            </div>
                            {/* Assigned to faculty */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                marginBottom: 5,
                              }}
                            >
                              <AvatarCircle
                                name={task.assigned_to_name}
                                pictureUrl={avatarUrlFor(
                                  task.assigned_to_name,
                                )}
                                size={18}
                                background="#e9ddff"
                                color="#5516be"
                                fontSize={11}
                              />
                              <span style={{ fontSize: 13, color: "#494454" }}>
                                {task.assigned_to_name || "Unassigned"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                                alignItems: "center",
                              }}
                            >
                              {task.priority && <Badge label={task.priority} />}
                              {task.status && (
                                <Badge
                                  label={
                                    isForApproval ? "For Approval" : task.status
                                  }
                                />
                              )}
                              {isForApproval && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    background: "#fef3c7",
                                    color: "#92400e",
                                    padding: "1px 6px",
                                    borderRadius: 20,
                                    fontWeight: 700,
                                  }}
                                >
                                  NEEDS REVIEW
                                </span>
                              )}
                              {task.is_collaborative && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                    backgroundColor:
                                      task.confirmation_status === "completed"
                                        ? "#d4edda"
                                        : "#fff3cd",
                                    color:
                                      task.confirmation_status === "completed"
                                        ? "#155724"
                                        : "#856404",
                                  }}
                                >
                                  {task.confirmation_status === "completed"
                                    ? "✓ All confirmed"
                                    : "⏳ Confirming"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid #cbc3d7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13, color: "#7b7486" }}>
                  {filteredTasks.length === 0
                    ? "0 tasks"
                    : `${Math.min((taskPage - 1) * PER_PAGE + 1, filteredTasks.length)}–${Math.min(taskPage * PER_PAGE, filteredTasks.length)} of ${filteredTasks.length}`}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                    disabled={taskPage === 1}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid #cbc3d7",
                      borderRadius: 5,
                      background: "white",
                      cursor: taskPage === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: taskPage === 1 ? 0.4 : 1,
                    }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="10"
                      height="10"
                    >
                      <path d="M10 12L6 8l4-4" />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setTaskPage((p) => Math.min(totalTaskPages, p + 1))
                    }
                    disabled={taskPage === totalTaskPages}
                    style={{
                      width: 24,
                      height: 24,
                      border: "1px solid #cbc3d7",
                      borderRadius: 5,
                      background: "white",
                      cursor:
                        taskPage === totalTaskPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: taskPage === totalTaskPages ? 0.4 : 1,
                    }}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="10"
                      height="10"
                    >
                      <path d="M6 12l4-4-4-4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: Task Detail Panel */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                background: "white",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {!selected ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    gap: 12,
                  }}
                >
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="#cbc3d7"
                    strokeWidth="1.5"
                    width="56"
                    height="56"
                  >
                    <rect x="6" y="8" width="36" height="32" rx="3" />
                    <path d="M14 16h20M14 22h20M14 28h12" />
                    <circle
                      cx="36"
                      cy="34"
                      r="8"
                      fill="white"
                      stroke="#cbc3d7"
                    />
                    <path
                      d="M33 34l2 2 4-4"
                      stroke="#6b38d4"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <div
                    style={{ fontSize: 15, color: "#7b7486", fontWeight: 600 }}
                  >
                    Select a task to review
                  </div>
                  <div style={{ fontSize: 13, color: "#a39aad" }}>
                    You'll see task details, submitted documents, and faculty
                    activity here
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    overflow: "hidden",
                  }}
                >
                  {/* Detail top bar */}
                  <div
                    style={{
                      padding: "14px 24px",
                      borderBottom: "1px solid #cbc3d7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          background: "#e9ddff",
                          color: "#6b38d4",
                          padding: "3px 10px",
                          borderRadius: 20,
                          fontWeight: 700,
                        }}
                      >
                        {selected.tracking_id}
                      </span>
                      <span style={{ fontSize: 13, color: "#7b7486" }}>
                        Created on {fmtDate(selected.created_at)}
                      </span>
                      {newSubmissions[selected.id] && (
                        <span
                          style={{
                            fontSize: 12,
                            background: "#fef3c7",
                            color: "#92400e",
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontWeight: 700,
                            animation: "pulse 1.5s infinite",
                          }}
                        >
                          📥 New submission
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid #cbc3d7",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Icon.Share />
                      </button>
                      <button
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          border: "1px solid #cbc3d7",
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Icon.More />
                      </button>
                    </div>
                  </div>

                  {/* Detail body — scrollable center column + separate sticky Task Timeline panel */}
                  <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                    <div
                      style={{
                        flex: 1,
                        padding: "20px 24px",
                        overflowY: "auto",
                        height: "100%",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#181445",
                          margin: "0 0 18px",
                          lineHeight: 1.35,
                        }}
                      >
                        {selected.title || "(No title)"}
                      </h2>

                      {/* TASK INFORMATION card */}
                      <div
                        style={{
                          background: "#faf8ff",
                          border: "1px solid #cbc3d7",
                          borderRadius: 14,
                          padding: "20px 22px",
                          marginBottom: 28,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            letterSpacing: 1,
                            color: "#7b7486",
                            textTransform: "uppercase",
                            marginBottom: 14,
                            paddingBottom: 10,
                            borderBottom: "1px solid #cbc3d7",
                          }}
                        >
                          Task Information
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 18,
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Assigned To
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <AvatarCircle
                                name={selected.assigned_to_name}
                                pictureUrl={avatarUrlFor(
                                  selected.assigned_to_name,
                                )}
                                size={24}
                                background="#e9ddff"
                                color="#5516be"
                                fontSize={12}
                              />
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#181445",
                                }}
                              >
                                {selected.assigned_to_name || "—"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Document Type
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#181445",
                              }}
                            >
                              {selected.doc_type || "—"}
                            </div>
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Priority Level
                            </div>
                            <Badge label={selected.priority || "—"} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Status
                            </div>
                            <Badge label={selected.status || "—"} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Due Date
                            </div>
                            {editingDeadline ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  flexWrap: "wrap",
                                }}
                              >
                                <input
                                  type="date"
                                  value={deadlineDraft}
                                  onChange={(e) =>
                                    setDeadlineDraft(e.target.value)
                                  }
                                  style={{
                                    fontSize: 13,
                                    padding: "5px 8px",
                                    border: "1px solid #cbc3d7",
                                    borderRadius: 6,
                                    color: "#181445",
                                  }}
                                />
                                <input
                                  type="time"
                                  value={deadlineTimeDraft}
                                  onChange={(e) =>
                                    setDeadlineTimeDraft(e.target.value)
                                  }
                                  style={{
                                    fontSize: 13,
                                    padding: "5px 8px",
                                    border: "1px solid #cbc3d7",
                                    borderRadius: 6,
                                    color: "#181445",
                                  }}
                                />
                                <button
                                  onClick={() =>
                                    handleUpdateDeadline(selected.id)
                                  }
                                  disabled={savingDeadline}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "white",
                                    background: "#6b38d4",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "5px 10px",
                                    cursor: savingDeadline
                                      ? "not-allowed"
                                      : "pointer",
                                  }}
                                >
                                  {savingDeadline ? "Saving…" : "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingDeadline(false)}
                                  disabled={savingDeadline}
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#494454",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#181445",
                                  }}
                                >
                                  {fmtDeadline(selected.deadline)}
                                </div>
                                <button
                                  onClick={() => {
                                    const d = selected.deadline
                                      ? new Date(selected.deadline)
                                      : null;
                                    // selected.deadline is UTC; seed the pickers with Manila local
                                    // date/time so "Change" starts from what's actually displayed.
                                    if (d) {
                                      const manila = new Date(
                                        d.getTime() + 8 * 60 * 60 * 1000,
                                      );
                                      setDeadlineDraft(
                                        manila.toISOString().split("T")[0],
                                      );
                                      setDeadlineTimeDraft(
                                        manila.toISOString().slice(11, 16),
                                      );
                                    } else {
                                      setDeadlineDraft("");
                                      setDeadlineTimeDraft("17:00");
                                    }
                                    setEditingDeadline(true);
                                  }}
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#6b38d4",
                                    background: "#e9ddff",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "3px 8px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Change
                                </button>
                              </div>
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "#7b7486",
                                marginBottom: 5,
                              }}
                            >
                              Project Category
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#181445",
                              }}
                            >
                              {selected.category || "—"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ── ACTIVITY FEED ─────────────────────────────────────── */}
                      {/* Section label */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: "#7b7486",
                          textTransform: "uppercase",
                          marginBottom: 14,
                        }}
                      >
                        Activity
                      </div>

                      {/* POST 1 — Initial task brief (posted by the assigning officer) */}
                      {(selected.attachments?.length > 0 ||
                        selected.notes ||
                        selected.doc_type) &&
                        (() => {
                          const assignerName =
                            selected.assigned_by_name ||
                            user.full_name ||
                            user.username ||
                            "You";
                          const assignedAt = selected.created_at;
                          const docType = selected.doc_type || null;
                          return (
                            <div
                              style={{
                                border: "1px solid #cbc3d7",
                                borderRadius: 12,
                                background: "white",
                                marginBottom: 12,
                                overflow: "hidden",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                              }}
                            >
                              {/* Post header */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "12px 16px 10px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                  }}
                                >
                                  <AvatarCircle
                                    name={assignerName}
                                    pictureUrl={avatarUrlFor(assignerName)}
                                    size={36}
                                    background="#1e1b2e"
                                    color="white"
                                    fontSize={14}
                                    border="2px solid #e9ddff"
                                  />
                                  <div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 7,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 14,
                                          fontWeight: 700,
                                          color: "#181445",
                                        }}
                                      >
                                        {assignerName}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          background: "#1e1b2e",
                                          color: "white",
                                          padding: "2px 8px",
                                          borderRadius: 20,
                                          fontWeight: 700,
                                        }}
                                      >
                                        {user.role === "program_chair"
                                          ? "Program Chair"
                                          : "Admin"}
                                      </span>
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        marginTop: 3,
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: "#7b7486",
                                        }}
                                      >
                                        {assignedAt
                                          ? fmtDateTime(assignedAt)
                                          : "Just now"}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          background: "#fef3c7",
                                          color: "#92400e",
                                          padding: "1px 6px",
                                          borderRadius: 20,
                                          fontWeight: 700,
                                        }}
                                      >
                                        Version 1.0
                                      </span>
                                      <span
                                        style={{
                                          fontSize: 12,
                                          background: "#dbeafe",
                                          color: "#1e40af",
                                          padding: "1px 6px",
                                          borderRadius: 20,
                                          fontWeight: 700,
                                        }}
                                      >
                                        Status: Pending
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#7b7486",
                                    padding: 4,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Icon.More />
                                </button>
                              </div>

                              {/* Divider */}
                              <div
                                style={{
                                  height: 1,
                                  background: "#efebff",
                                  margin: "0 16px",
                                }}
                              />

                              {/* Document name as body text */}
                              {(selected.notes || docType) && (
                                <div
                                  style={{
                                    padding: "10px 16px 2px",
                                    fontSize: 14,
                                    color: "#494454",
                                    lineHeight: 1.65,
                                    whiteSpace: selected.notes
                                      ? "pre-wrap"
                                      : "normal",
                                  }}
                                >
                                  {selected.notes ? (
                                    selected.notes
                                  ) : (
                                    <>
                                      Task brief attached for{" "}
                                      <strong>{docType}</strong>. Please review
                                      and submit your completed document by the
                                      due date.
                                    </>
                                  )}
                                </div>
                              )}

                              {/* File chips */}
                              {selected.attachments?.length > 0 && (
                                <div
                                  style={{
                                    padding: "12px 16px 14px",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 10,
                                  }}
                                >
                                  {selected.attachments.map((a, i) => {
                                    const url = resolveFileUrl(
                                      a.file_url || a.url,
                                    );
                                    const name =
                                      a.file_name || a.name || "file";
                                    const ext = name
                                      .split(".")
                                      .pop()
                                      .toLowerCase();
                                    const isPdf = ext === "pdf";
                                    const isXlsx = [
                                      "xlsx",
                                      "xls",
                                      "csv",
                                    ].includes(ext);
                                    const isImg = [
                                      "jpg",
                                      "jpeg",
                                      "png",
                                      "gif",
                                      "webp",
                                    ].includes(ext);
                                    const sizeBytes =
                                      a.size || a.file_size || 0;
                                    const sizeLabel =
                                      sizeBytes >= 1_048_576
                                        ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
                                        : sizeBytes > 0
                                          ? `${(sizeBytes / 1024).toFixed(0)} KB`
                                          : null;
                                    return (
                                      <button
                                        key={i}
                                        onClick={() =>
                                          setFileViewer({
                                            url,
                                            name,
                                            isPdf,
                                            isImg,
                                          })
                                        }
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                          padding: "10px 14px",
                                          border: "1px solid #cbc3d7",
                                          borderRadius: 10,
                                          background: "#f6f2ff",
                                          cursor: "pointer",
                                          textAlign: "left",
                                          minWidth: 180,
                                          transition: "border-color 0.15s",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.borderColor =
                                            "#6b38d4")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.borderColor =
                                            "#cbc3d7")
                                        }
                                      >
                                        <div
                                          style={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: 8,
                                            flexShrink: 0,
                                            background: isPdf
                                              ? "#ffdad6"
                                              : isXlsx
                                                ? "#d1fae5"
                                                : isImg
                                                  ? "#dbeafe"
                                                  : "#e9ddff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <span style={{ fontSize: 15 }}>
                                            {isPdf
                                              ? "📄"
                                              : isXlsx
                                                ? "📊"
                                                : isImg
                                                  ? "🖼️"
                                                  : "📎"}
                                          </span>
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: "#181445",
                                              maxWidth: 160,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {name}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: "#6b38d4",
                                              marginTop: 2,
                                              fontWeight: 600,
                                            }}
                                          >
                                            {sizeLabel || "Click to preview"}
                                          </div>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* POSTS 2+ — Faculty submissions & revision requests, interleaved chronologically */}
                      {(() => {
                        const submissions = selected.submissions || [];
                        const revisionComments = (
                          selected.comments || []
                        ).filter((c) => c.content?.startsWith("__revision__"));
                        // Note-only submissions (no files) are persisted only as "📤 Task submitted:" comments
                        const submissionNoteComments = (
                          selected.comments || []
                        ).filter((c) =>
                          c.content?.startsWith("📤 Task submitted:"),
                        );

                        if (
                          submissions.length === 0 &&
                          revisionComments.length === 0 &&
                          submissionNoteComments.length === 0
                        )
                          return null;

                        // Group submissions by submission_group_id or minute-level timestamp
                        const subGroups = submissions.reduce((acc, s) => {
                          const key =
                            s.submission_group_id ||
                            (s.submitted_at
                              ? new Date(s.submitted_at)
                                  .toISOString()
                                  .slice(0, 16)
                              : "initial");
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(s);
                          return acc;
                        }, {});

                        const facultyName =
                          selected.assigned_to_name || "Faculty";

                        // Determine which submission-note comments already correspond to a file group
                        // (so we don't double-post the same note both standalone AND inside a file post)
                        const usedCommentIds = new Set();
                        Object.values(subGroups).forEach((files) => {
                          const firstFile = files[0];
                          const groupTs = firstFile?.submitted_at
                            ? new Date(firstFile.submitted_at).getTime()
                            : null;
                          if (groupTs == null) return;
                          let best = null;
                          submissionNoteComments.forEach((c) => {
                            if (usedCommentIds.has(c.id)) return;
                            const cts = c.created_at
                              ? new Date(c.created_at).getTime()
                              : null;
                            if (cts == null) return;
                            if (Math.abs(cts - groupTs) <= 60000) {
                              if (
                                !best ||
                                Math.abs(cts - groupTs) <
                                  Math.abs(best.cts - groupTs)
                              )
                                best = { c, cts };
                            }
                          });
                          if (best) usedCommentIds.add(best.c.id);
                        });

                        // Build a unified chronological event list
                        const events = [];

                        Object.entries(subGroups).forEach(
                          ([groupKey, files], gi) => {
                            const firstFile = files[0];
                            const ts = firstFile?.submitted_at
                              ? new Date(firstFile.submitted_at).getTime()
                              : 0;
                            events.push({
                              type: "submission",
                              groupKey,
                              files,
                              gi,
                              ts,
                            });
                          },
                        );

                        // Remaining submission-note comments (no associated file group) become note-only posts
                        submissionNoteComments.forEach((c, ci) => {
                          if (usedCommentIds.has(c.id)) return;
                          const ts = c._pending
                            ? Date.now()
                            : c.created_at
                              ? new Date(c.created_at).getTime()
                              : 0;
                          const note = c.content
                            .replace("📤 Task submitted:", "")
                            .trim();
                          events.push({
                            type: "submission",
                            groupKey: `note_${c.id || ci}`,
                            files: [
                              {
                                file_name: null,
                                name: null,
                                file_url: null,
                                url: null,
                                size: 0,
                                note: note || null,
                                submitted_at: c.created_at,
                                _noteOnly: true,
                              },
                            ],
                            gi: -1,
                            ts,
                          });
                        });

                        revisionComments.forEach((c, i) => {
                          const ts = c._pending
                            ? Date.now()
                            : c.created_at
                              ? new Date(c.created_at).getTime()
                              : 0;
                          events.push({ type: "revision", comment: c, i, ts });
                        });

                        events.sort((a, b) => a.ts - b.ts);

                        // Track submission index across sorted events for version numbering
                        let subVersionCounter = 0;

                        return (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                              marginBottom: 24,
                            }}
                          >
                            {events.map((event, eventIdx) => {
                              if (event.type === "revision") {
                                const c = event.comment;
                                let revisionMeta = null;
                                try {
                                  revisionMeta = JSON.parse(
                                    c.content.replace("__revision__", ""),
                                  );
                                } catch {}
                                if (!revisionMeta) return null;
                                return (
                                  <div
                                    key={`rev-${event.i}`}
                                    style={{
                                      border: "1px solid #fecaca",
                                      borderRadius: 12,
                                      background: "#fff8f8",
                                      overflow: "hidden",
                                      boxShadow:
                                        "0 1px 4px rgba(220,38,38,0.07)",
                                      opacity: c._pending ? 0.6 : 1,
                                      transition: "opacity 0.3s",
                                    }}
                                  >
                                    {/* Card header */}
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "12px 16px 10px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 10,
                                        }}
                                      >
                                        <AvatarCircle
                                          name={c.sender_name}
                                          pictureUrl={avatarUrlFor(
                                            c.sender_name,
                                          )}
                                          size={36}
                                          background="#ffdad6"
                                          color="#ba1a1a"
                                          fontSize={14}
                                          border="2px solid #fecaca"
                                        />
                                        <div>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 7,
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: "#181445",
                                              }}
                                            >
                                              {c.sender_name}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                background: "#ba1a1a",
                                                color: "white",
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                fontWeight: 700,
                                              }}
                                            >
                                              {user.role === "program_chair"
                                                ? "Program Chair"
                                                : "Admin"}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                background: "#ffdad6",
                                                color: "#ba1a1a",
                                                padding: "2px 8px",
                                                borderRadius: 20,
                                                fontWeight: 700,
                                              }}
                                            >
                                              ↺ Revision Request
                                            </span>
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 6,
                                              marginTop: 3,
                                            }}
                                          >
                                            <span
                                              style={{
                                                fontSize: 12,
                                                color: "#7b7486",
                                              }}
                                            >
                                              {c._pending
                                                ? "Sending..."
                                                : fmtDateTime(c.created_at)}
                                            </span>
                                            <span
                                              style={{
                                                fontSize: 12,
                                                background: "#ffdad6",
                                                color: "#93000a",
                                                padding: "1px 6px",
                                                borderRadius: 20,
                                                fontWeight: 700,
                                              }}
                                            >
                                              Status: Returned
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        style={{
                                          background: "none",
                                          border: "none",
                                          cursor: "pointer",
                                          color: "#7b7486",
                                          padding: 4,
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        <Icon.More />
                                      </button>
                                    </div>
                                    {/* Divider */}
                                    <div
                                      style={{
                                        height: 1,
                                        background: "#fecaca",
                                        margin: "0 16px",
                                      }}
                                    />
                                    {/* Note body */}
                                    {revisionMeta.note && (
                                      <div
                                        style={{
                                          padding: "10px 16px 2px",
                                          fontSize: 14,
                                          color: "#494454",
                                          lineHeight: 1.65,
                                        }}
                                      >
                                        {revisionMeta.note}
                                      </div>
                                    )}
                                    {/* Attached reference files */}
                                    {revisionMeta.files?.length > 0 && (
                                      <div
                                        style={{
                                          padding: "8px 16px 14px",
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 10,
                                        }}
                                      >
                                        {revisionMeta.files.map((f, fi) => {
                                          const url = resolveFileUrl(f.url);
                                          const ext = f.name
                                            ?.split(".")
                                            .pop()
                                            .toLowerCase();
                                          const isPdf = ext === "pdf";
                                          const isXlsx = [
                                            "xlsx",
                                            "xls",
                                            "csv",
                                          ].includes(ext);
                                          const isImg =
                                            f.isImg ||
                                            [
                                              "jpg",
                                              "jpeg",
                                              "png",
                                              "gif",
                                              "webp",
                                            ].includes(ext);
                                          const sizeLabel =
                                            f.size >= 1_048_576
                                              ? `${(f.size / 1_048_576).toFixed(1)} MB`
                                              : f.size > 0
                                                ? `${(f.size / 1024).toFixed(0)} KB`
                                                : null;
                                          return isImg ? (
                                            <img
                                              key={fi}
                                              src={url}
                                              alt={f.name}
                                              style={{
                                                maxWidth: 160,
                                                maxHeight: 120,
                                                borderRadius: 8,
                                                border: "1px solid #fecaca",
                                                cursor: "pointer",
                                                objectFit: "cover",
                                              }}
                                              onClick={() =>
                                                setFileViewer({
                                                  url,
                                                  name: f.name,
                                                  isPdf: false,
                                                  isImg: true,
                                                })
                                              }
                                            />
                                          ) : (
                                            <button
                                              key={fi}
                                              onClick={() =>
                                                setFileViewer({
                                                  url,
                                                  name: f.name,
                                                  isPdf,
                                                  isImg: false,
                                                })
                                              }
                                              style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 10,
                                                padding: "10px 14px",
                                                border: "1px solid #fecaca",
                                                borderRadius: 10,
                                                background: "white",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                minWidth: 176,
                                                transition:
                                                  "border-color 0.15s",
                                              }}
                                              onMouseEnter={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                  "#ba1a1a")
                                              }
                                              onMouseLeave={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                  "#fecaca")
                                              }
                                            >
                                              <div
                                                style={{
                                                  width: 34,
                                                  height: 34,
                                                  borderRadius: 8,
                                                  flexShrink: 0,
                                                  background: isPdf
                                                    ? "#ffdad6"
                                                    : isXlsx
                                                      ? "#d1fae5"
                                                      : "#e9ddff",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <span style={{ fontSize: 15 }}>
                                                  {isPdf
                                                    ? "📄"
                                                    : isXlsx
                                                      ? "📊"
                                                      : "📎"}
                                                </span>
                                              </div>
                                              <div style={{ minWidth: 0 }}>
                                                <div
                                                  style={{
                                                    fontSize: 13,
                                                    fontWeight: 700,
                                                    color: "#181445",
                                                    maxWidth: 150,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  {f.name}
                                                </div>
                                                <div
                                                  style={{
                                                    fontSize: 12,
                                                    color: "#ba1a1a",
                                                    marginTop: 2,
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {sizeLabel ||
                                                    "Click to preview"}
                                                </div>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {!revisionMeta.note &&
                                      !revisionMeta.files?.length && (
                                        <div
                                          style={{
                                            padding: "10px 16px 14px",
                                            fontSize: 13,
                                            color: "#7b7486",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          No additional notes provided.
                                        </div>
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
                              const note =
                                firstFile?.note || selected.submit_note || null;
                              const isNew =
                                submittedAt &&
                                Date.now() - new Date(submittedAt).getTime() <
                                  3_600_000;
                              const isNoteOnly = firstFile?._noteOnly;

                              // Resolve version label with document name if present
                              const docVersionLabel =
                                firstFile?.version_label || null;

                              return (
                                <div
                                  key={groupKey}
                                  style={{
                                    border: `1px solid ${isNew ? "#d0bcff" : "#e9ddff"}`,
                                    borderRadius: 12,
                                    background: isNew ? "#fcf8ff" : "white",
                                    overflow: "hidden",
                                    boxShadow: isNew
                                      ? "0 0 0 3px rgba(124,58,237,0.07)"
                                      : "0 1px 4px rgba(0,0,0,0.04)",
                                    transition: "box-shadow 0.2s",
                                  }}
                                >
                                  {/* Post header — faculty avatar + name + role + timestamp */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      padding: "12px 16px 10px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                      }}
                                    >
                                      {/* Avatar */}
                                      <AvatarCircle
                                        name={facultyName}
                                        pictureUrl={avatarUrlFor(
                                          facultyName,
                                        )}
                                        size={36}
                                        background="#e9ddff"
                                        color="#5516be"
                                        fontSize={14}
                                        border="2px solid #efebff"
                                      />
                                      <div>
                                        {/* Name + role badge */}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 7,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 14,
                                              fontWeight: 700,
                                              color: "#181445",
                                            }}
                                          >
                                            {facultyName}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 12,
                                              background: "#e9ddff",
                                              color: "#5516be",
                                              padding: "2px 8px",
                                              borderRadius: 20,
                                              fontWeight: 700,
                                            }}
                                          >
                                            Faculty
                                          </span>
                                          {isNew && (
                                            <span
                                              style={{
                                                fontSize: 12,
                                                background: "#ba1a1a",
                                                color: "white",
                                                padding: "2px 7px",
                                                borderRadius: 20,
                                                fontWeight: 700,
                                              }}
                                            >
                                              NEW
                                            </span>
                                          )}
                                        </div>
                                        {/* Timestamp + version + status */}
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6,
                                            marginTop: 3,
                                          }}
                                        >
                                          <span
                                            style={{
                                              fontSize: 12,
                                              color: "#7b7486",
                                            }}
                                          >
                                            {submittedAt
                                              ? fmtDateTime(submittedAt)
                                              : "Just now"}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 12,
                                              background: "#fef3c7",
                                              color: "#92400e",
                                              padding: "1px 6px",
                                              borderRadius: 20,
                                              fontWeight: 700,
                                            }}
                                          >
                                            {docVersionLabel ||
                                              `Version ${versionNum}.0`}
                                          </span>
                                          <span
                                            style={{
                                              fontSize: 12,
                                              background: "#d1fae5",
                                              color: "#065f46",
                                              padding: "1px 6px",
                                              borderRadius: 20,
                                              fontWeight: 700,
                                            }}
                                          >
                                            Status:{" "}
                                            {selected.status || "Pending"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#7b7486",
                                        padding: 4,
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      <Icon.More />
                                    </button>
                                  </div>

                                  {/* Divider */}
                                  <div
                                    style={{
                                      height: 1,
                                      background: "#efebff",
                                      margin: "0 16px",
                                    }}
                                  />

                                  {/* Submission body — note or default submission message */}
                                  <div
                                    style={{
                                      padding: "10px 16px 2px",
                                      fontSize: 14,
                                      color: "#494454",
                                      lineHeight: 1.65,
                                    }}
                                  >
                                    {note || (
                                      <span>
                                        Submitted completed document
                                        {files.length > 1 ? "s" : ""} for
                                        review.
                                      </span>
                                    )}
                                  </div>

                                  {/* File attachment cards inside the post — hidden for note-only entries */}
                                  {!isNoteOnly && (
                                    <div
                                      style={{
                                        padding: "12px 16px 14px",
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 10,
                                      }}
                                    >
                                      {files.map((a, i) => {
                                        const url = a._pending
                                          ? null
                                          : resolveFileUrl(a.file_url || a.url);
                                        const name =
                                          a.file_name || a.name || "file";
                                        const ext = name
                                          .split(".")
                                          .pop()
                                          .toLowerCase();
                                        const isPdf = ext === "pdf";
                                        const isXlsx = [
                                          "xlsx",
                                          "xls",
                                          "csv",
                                        ].includes(ext);
                                        const isImg = [
                                          "jpg",
                                          "jpeg",
                                          "png",
                                          "gif",
                                          "webp",
                                        ].includes(ext);
                                        const sizeBytes =
                                          a.size || a.file_size || 0;
                                        const sizeLabel =
                                          sizeBytes >= 1_048_576
                                            ? `${(sizeBytes / 1_048_576).toFixed(1)} MB`
                                            : sizeBytes > 0
                                              ? `${(sizeBytes / 1024).toFixed(0)} KB`
                                              : null;
                                        return (
                                          <button
                                            key={i}
                                            onClick={() =>
                                              !a._pending &&
                                              url &&
                                              setFileViewer({
                                                url,
                                                name,
                                                isPdf,
                                                isImg,
                                              })
                                            }
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 10,
                                              padding: "10px 14px",
                                              border: `1px solid ${a._pending ? "#e9ddff" : "#cbc3d7"}`,
                                              borderRadius: 10,
                                              background: a._pending
                                                ? "#f6f2ff"
                                                : "#f6f2ff",
                                              cursor: a._pending
                                                ? "default"
                                                : "pointer",
                                              textAlign: "left",
                                              minWidth: 176,
                                              opacity: a._pending ? 0.7 : 1,
                                              transition: "border-color 0.15s",
                                            }}
                                            onMouseEnter={(e) => {
                                              if (!a._pending)
                                                e.currentTarget.style.borderColor =
                                                  "#6b38d4";
                                            }}
                                            onMouseLeave={(e) => {
                                              if (!a._pending)
                                                e.currentTarget.style.borderColor =
                                                  "#cbc3d7";
                                            }}
                                          >
                                            <div
                                              style={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 8,
                                                flexShrink: 0,
                                                background: isPdf
                                                  ? "#ffdad6"
                                                  : isXlsx
                                                    ? "#d1fae5"
                                                    : isImg
                                                      ? "#dbeafe"
                                                      : "#e9ddff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                              }}
                                            >
                                              <span style={{ fontSize: 15 }}>
                                                {isPdf
                                                  ? "📄"
                                                  : isXlsx
                                                    ? "📊"
                                                    : isImg
                                                      ? "🖼️"
                                                      : "📎"}
                                              </span>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                              <div
                                                style={{
                                                  fontSize: 13,
                                                  fontWeight: 700,
                                                  color: "#181445",
                                                  maxWidth: 150,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                }}
                                              >
                                                {name}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: 12,
                                                  color: a._pending
                                                    ? "#8455ef"
                                                    : "#6b38d4",
                                                  marginTop: 2,
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {a._pending
                                                  ? "Uploading…"
                                                  : sizeLabel ||
                                                    "Click to preview"}
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                  {isNoteOnly && (
                                    <div style={{ paddingBottom: 4 }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* APPROVE / RETURN ACTIONS */}
                      {(() => {
                        const submittedStatus = [
                          "for approval",
                          "submitted",
                        ].includes(selected.status?.toLowerCase());
                        const actionsLocked = !submittedStatus;
                        return (
                          <div
                            style={{
                              marginBottom: 24,
                              padding: "16px",
                              background: actionsLocked ? "#f6f2ff" : "#f6f2ff",
                              border: `1px solid ${actionsLocked ? "#cbc3d7" : "#e9ddff"}`,
                              borderRadius: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  letterSpacing: 1,
                                  color: actionsLocked ? "#7b7486" : "#6b38d4",
                                  textTransform: "uppercase",
                                }}
                              >
                                Task Actions
                              </div>
                              {actionsLocked && (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#7b7486",
                                    background: "#efebff",
                                    border: "1px solid #cbc3d7",
                                    borderRadius: 20,
                                    padding: "3px 10px",
                                  }}
                                >
                                  <svg
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    width="11"
                                    height="11"
                                  >
                                    <rect
                                      x="4"
                                      y="7"
                                      width="8"
                                      height="7"
                                      rx="1"
                                    />
                                    <path
                                      d="M5.5 7V5a2.5 2.5 0 015 0v2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  Awaiting faculty submission
                                </span>
                              )}
                            </div>
                            {actionsLocked && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "10px 12px",
                                  background: "#fffbeb",
                                  border: "1px solid #fde68a",
                                  borderRadius: 8,
                                  marginBottom: 12,
                                }}
                              >
                                <svg
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="#d97706"
                                  strokeWidth="1.5"
                                  width="14"
                                  height="14"
                                >
                                  <circle cx="8" cy="8" r="6" />
                                  <path
                                    d="M8 5v3M8 10v1"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: "#92400e",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  These actions are locked until the assigned
                                  faculty member submits their work. Current
                                  status:{" "}
                                  <strong>{selected.status || "—"}</strong>
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: showReturnBox ? 14 : 0,
                              }}
                            >
                              <button
                                onClick={() =>
                                  !actionsLocked && handleApprove(selected.id)
                                }
                                disabled={
                                  actionsLocked || actionLoading === "approve"
                                }
                                title={
                                  actionsLocked
                                    ? "Faculty must submit before you can approve"
                                    : "Approve this task"
                                }
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  padding: "10px 18px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: actionsLocked
                                    ? "#d1d5db"
                                    : "#6b38d4",
                                  color: "white",
                                  fontSize: 14,
                                  fontWeight: 700,
                                  cursor:
                                    actionsLocked || actionLoading === "approve"
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    actionLoading === "approve" ? 0.7 : 1,
                                }}
                                onMouseEnter={(e) => {
                                  if (
                                    !actionsLocked &&
                                    actionLoading !== "approve"
                                  )
                                    e.currentTarget.style.background =
                                      "#5a16be";
                                }}
                                onMouseLeave={(e) => {
                                  if (
                                    !actionsLocked &&
                                    actionLoading !== "approve"
                                  )
                                    e.currentTarget.style.background =
                                      "#6b38d4";
                                }}
                              >
                                <svg
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="2"
                                  width="13"
                                  height="13"
                                >
                                  <path
                                    d="M13 5l-7 7-3-3"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                {actionLoading === "approve"
                                  ? "Approving..."
                                  : "Approve Task"}
                              </button>
                              <button
                                onClick={() => {
                                  if (!actionsLocked) {
                                    setShowReturnBox((v) => !v);
                                    setReturnNote("");
                                  }
                                }}
                                disabled={
                                  actionsLocked || actionLoading === "return"
                                }
                                title={
                                  actionsLocked
                                    ? "Faculty must submit before you can return"
                                    : "Return to faculty for revision"
                                }
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  padding: "10px 16px",
                                  borderRadius: 8,
                                  border: `1px solid ${actionsLocked ? "#cbc3d7" : "#fecaca"}`,
                                  background: actionsLocked
                                    ? "#f6f2ff"
                                    : showReturnBox
                                      ? "#fef2f2"
                                      : "white",
                                  color: actionsLocked ? "#7b7486" : "#ba1a1a",
                                  fontSize: 14,
                                  fontWeight: 700,
                                  cursor: actionsLocked
                                    ? "not-allowed"
                                    : "pointer",
                                }}
                              >
                                <Icon.Return /> Return to Faculty
                              </button>
                              <button
                                title="Reassign this task to another faculty member"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  padding: "10px 16px",
                                  borderRadius: 8,
                                  border: "1px solid #cbc3d7",
                                  background: "white",
                                  color: "#494454",
                                  fontSize: 14,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                }}
                              >
                                <Icon.Reassign /> Reassign
                              </button>
                            </div>

                            {/* Return note inline */}
                            {showReturnBox && !actionsLocked && (
                              <div style={{ marginTop: 4 }}>
                                <textarea
                                  value={returnNote}
                                  onChange={(e) =>
                                    setReturnNote(e.target.value)
                                  }
                                  rows={3}
                                  placeholder="Explain what the faculty needs to revise or resubmit..."
                                  style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #fecaca",
                                    borderRadius: 8,
                                    fontSize: 14,
                                    color: "#181445",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                    lineHeight: 1.5,
                                    background: "white",
                                    boxSizing: "border-box",
                                    outline: "none",
                                    marginBottom: 10,
                                  }}
                                />

                                {/* File drop zone */}
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setReturnDragOver(true);
                                  }}
                                  onDragLeave={() => setReturnDragOver(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setReturnDragOver(false);
                                    const dropped = Array.from(
                                      e.dataTransfer.files,
                                    );
                                    const urls = dropped.map((f) =>
                                      URL.createObjectURL(f),
                                    );
                                    setReturnFiles((prev) => [
                                      ...prev,
                                      ...dropped,
                                    ]);
                                    setReturnFilePreviews((prev) => [
                                      ...prev,
                                      ...urls,
                                    ]);
                                  }}
                                  onClick={() =>
                                    returnFileInputRef.current?.click()
                                  }
                                  style={{
                                    border: `2px dashed ${returnDragOver ? "#ba1a1a" : "#fca5a5"}`,
                                    borderRadius: 8,
                                    padding: "12px",
                                    background: returnDragOver
                                      ? "#fff1f2"
                                      : "#fff",
                                    cursor: "pointer",
                                    textAlign: "center",
                                    marginBottom: 10,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  <input
                                    ref={returnFileInputRef}
                                    type="file"
                                    multiple
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const picked = Array.from(e.target.files);
                                      const urls = picked.map((f) =>
                                        URL.createObjectURL(f),
                                      );
                                      setReturnFiles((prev) => [
                                        ...prev,
                                        ...picked,
                                      ]);
                                      setReturnFilePreviews((prev) => [
                                        ...prev,
                                        ...urls,
                                      ]);
                                      e.target.value = "";
                                    }}
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 6,
                                      color: "#ba1a1a",
                                    }}
                                  >
                                    <Icon.Attach />
                                    <span
                                      style={{ fontSize: 13, fontWeight: 600 }}
                                    >
                                      Attach revision notes / reference files
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#fca5a5",
                                      marginTop: 3,
                                    }}
                                  >
                                    PDF, Word, images — drag & drop or click
                                  </div>
                                </div>

                                {/* Staged file chips */}
                                {returnFiles.length > 0 && (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 8,
                                      marginBottom: 10,
                                    }}
                                  >
                                    {returnFiles.map((f, i) => {
                                      const ext = f.name
                                        .split(".")
                                        .pop()
                                        .toLowerCase();
                                      const isImg =
                                        /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                          f.name,
                                        );
                                      const objUrl = returnFilePreviews[i];
                                      return (
                                        <div
                                          key={i}
                                          style={{
                                            position: "relative",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: 6,
                                            background: "#fff1f2",
                                            border: "1px solid #fecaca",
                                            borderRadius: 8,
                                            padding: "4px 8px 4px 6px",
                                            fontSize: 13,
                                            maxWidth: 200,
                                          }}
                                        >
                                          {isImg ? (
                                            <img
                                              src={objUrl}
                                              alt={f.name}
                                              style={{
                                                width: 44,
                                                height: 44,
                                                objectFit: "cover",
                                                borderRadius: 6,
                                                flexShrink: 0,
                                              }}
                                            />
                                          ) : (
                                            <>
                                              <span
                                                style={{
                                                  fontSize: 19,
                                                  flexShrink: 0,
                                                }}
                                              >
                                                📄
                                              </span>
                                              <span
                                                style={{
                                                  maxWidth: 120,
                                                  overflow: "hidden",
                                                  textOverflow: "ellipsis",
                                                  whiteSpace: "nowrap",
                                                  color: "#494454",
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {f.name}
                                              </span>
                                            </>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              URL.revokeObjectURL(
                                                returnFilePreviews[i],
                                              );
                                              setReturnFiles((p) =>
                                                p.filter((_, idx) => idx !== i),
                                              );
                                              setReturnFilePreviews((p) =>
                                                p.filter((_, idx) => idx !== i),
                                              );
                                            }}
                                            style={{
                                              position: "absolute",
                                              top: -6,
                                              right: -6,
                                              background: "#fff",
                                              border: "1px solid #fecaca",
                                              borderRadius: "50%",
                                              width: 18,
                                              height: 18,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              cursor: "pointer",
                                              padding: 0,
                                              boxShadow:
                                                "0 1px 3px rgba(0,0,0,0.15)",
                                              zIndex: 1,
                                            }}
                                          >
                                            <Icon.Close />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setShowReturnBox(false);
                                      setReturnNote("");
                                      returnFilePreviews.forEach((u) =>
                                        URL.revokeObjectURL(u),
                                      );
                                      setReturnFiles([]);
                                      setReturnFilePreviews([]);
                                    }}
                                    style={{
                                      padding: "7px 14px",
                                      borderRadius: 7,
                                      border: "1px solid #cbc3d7",
                                      background: "white",
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      color: "#494454",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleReturn(selected.id)}
                                    disabled={actionLoading === "return"}
                                    style={{
                                      padding: "7px 16px",
                                      borderRadius: 7,
                                      border: "none",
                                      background: "#ba1a1a",
                                      color: "white",
                                      fontSize: 13,
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      opacity:
                                        actionLoading === "return" ? 0.7 : 1,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <Icon.Return />
                                    {actionLoading === "return"
                                      ? "Returning..."
                                      : `Confirm Return${returnFiles.length ? ` · ${returnFiles.length} file${returnFiles.length > 1 ? "s" : ""}` : ""}`}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* DISCUSSION */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: "#7b7486",
                          textTransform: "uppercase",
                          marginBottom: 14,
                        }}
                      >
                        Discussion
                      </div>
                      <div
                        ref={(el) => {
                          if (el) el.scrollTop = el.scrollHeight;
                        }}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 14,
                          marginBottom: 16,
                          maxHeight: 320,
                          overflowY: "auto",
                        }}
                      >
                        {(selected.comments || []).length === 0 ? (
                          <div
                            style={{
                              fontSize: 13,
                              color: "#a39aad",
                              fontStyle: "italic",
                            }}
                          >
                            No comments yet.
                          </div>
                        ) : (
                          (selected.comments || []).map((c, i) => {
                            const isAttachment =
                              c.content?.startsWith("__attachment__");
                            const isRevision =
                              c.content?.startsWith("__revision__");
                            // Revision posts are shown in the Activity feed above — skip in Discussion
                            if (isRevision) return null;
                            let attachMeta = null;
                            if (isAttachment) {
                              try {
                                attachMeta = JSON.parse(
                                  c.content.replace("__attachment__", ""),
                                );
                              } catch {}
                              // Recompute isImg from the filename rather than trusting the stored flag —
                              // older/backend-echoed comments may omit or lose this field.
                              if (attachMeta)
                                attachMeta.isImg =
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                    attachMeta.name || "",
                                  );
                            }

                            const isSubmission =
                              c.content?.startsWith("📤 Task submitted:");

                            // If this submission was later returned for revision, show a "Returned" indicator
                            let wasReturned = false;
                            if (isSubmission && c.created_at) {
                              const cts = new Date(c.created_at).getTime();
                              wasReturned = (selected.comments || []).some(
                                (rc) => {
                                  if (
                                    !rc.content?.startsWith("__revision__") ||
                                    !rc.created_at
                                  )
                                    return false;
                                  return (
                                    new Date(rc.created_at).getTime() > cts
                                  );
                                },
                              );
                            }

                            return (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: 10,
                                  opacity: c._pending ? 0.55 : 1,
                                  transition: "opacity 0.3s",
                                }}
                              >
                                <AvatarCircle
                                  name={c.sender_name}
                                  pictureUrl={avatarUrlFor(c.sender_name)}
                                  size={32}
                                  background="#e9ddff"
                                  color="#5516be"
                                  fontSize={13}
                                />
                                <div style={{ flex: 1 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "center",
                                      marginBottom: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: "#181445",
                                      }}
                                    >
                                      {c.sender_name}
                                    </span>
                                    <span
                                      style={{ fontSize: 13, color: "#7b7486" }}
                                    >
                                      {c._pending
                                        ? "Sending..."
                                        : fmtDateTime(c.created_at)}
                                    </span>
                                  </div>
                                  {isAttachment && attachMeta ? (
                                    attachMeta.isImg ? (
                                      <img
                                        src={resolveFileUrl(attachMeta.url)}
                                        alt={attachMeta.name}
                                        style={{
                                          maxWidth: "100%",
                                          maxHeight: 220,
                                          borderRadius: 8,
                                          border: "1px solid #cbc3d7",
                                          display: "block",
                                          cursor: "pointer",
                                        }}
                                        onClick={() =>
                                          setFileViewer({
                                            url: resolveFileUrl(attachMeta.url),
                                            name: attachMeta.name,
                                            isPdf: false,
                                            isImg: true,
                                          })
                                        }
                                      />
                                    ) : (
                                      <div
                                        onClick={() =>
                                          setFileViewer({
                                            url: resolveFileUrl(attachMeta.url),
                                            name: attachMeta.name,
                                            isPdf: attachMeta.name
                                              ?.toLowerCase()
                                              .endsWith(".pdf"),
                                            isImg: false,
                                          })
                                        }
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: 8,
                                          background: "#efebff",
                                          border: "1px solid #e9ddff",
                                          borderRadius: 8,
                                          padding: "8px 12px",
                                          cursor: "pointer",
                                          maxWidth: 280,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: 30,
                                            height: 30,
                                            background: "#e9ddff",
                                            borderRadius: 6,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                          }}
                                        >
                                          <Icon.Attach />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontSize: 13,
                                              fontWeight: 700,
                                              color: "#494454",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              maxWidth: 200,
                                            }}
                                          >
                                            {attachMeta.name}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              color: "#6b38d4",
                                              fontWeight: 600,
                                            }}
                                          >
                                            Click to preview
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  ) : isSubmission ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: 10,
                                        fontSize: 14,
                                        color: "#494454",
                                        lineHeight: 1.6,
                                        background: wasReturned
                                          ? "#fff8f8"
                                          : "#f0fdf4",
                                        border: `1px solid ${wasReturned ? "#fecaca" : "#bbf7d0"}`,
                                        borderRadius: 8,
                                        padding: "8px 12px",
                                      }}
                                    >
                                      <span>{c.content}</span>
                                      {wasReturned && (
                                        <span
                                          style={{
                                            flexShrink: 0,
                                            fontSize: 12,
                                            background: "#ffdad6",
                                            color: "#93000a",
                                            padding: "2px 8px",
                                            borderRadius: 20,
                                            fontWeight: 700,
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          ↺ Returned
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        fontSize: 14,
                                        color: "#494454",
                                        lineHeight: 1.6,
                                        background: c.content?.startsWith("↺")
                                          ? "#fef2f2"
                                          : "transparent",
                                        padding: c.content?.startsWith("↺")
                                          ? "8px 12px"
                                          : 0,
                                        borderRadius: 8,
                                      }}
                                    >
                                      {c.content}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Typing indicator */}
                      {typingUsers.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 3,
                              alignItems: "center",
                            }}
                          >
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: "#6b38d4",
                                  animation:
                                    "typingBounce 1.2s infinite ease-in-out",
                                  animationDelay: `${i * 0.2}s`,
                                }}
                              />
                            ))}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              color: "#6b38d4",
                              fontStyle: "italic",
                            }}
                          >
                            {typingUsers.length === 1
                              ? `${typingUsers[0].name} is typing…`
                              : typingUsers.length === 2
                                ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing…`
                                : `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing…`}
                          </span>
                        </div>
                      )}

                      {/* Comment input */}
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-start",
                        }}
                      >
                        <AvatarCircle
                          name={user.full_name || user.username}
                          pictureUrl={avatarUrlFor(
                            user.full_name || user.username,
                          )}
                          size={32}
                          background="#e9ddff"
                          color="#5516be"
                          fontSize={13}
                          style={{ marginTop: 2 }}
                        />
                        <div
                          style={{
                            flex: 1,
                            border: "1px solid #cbc3d7",
                            borderRadius: 10,
                            background: "white",
                          }}
                        >
                          <input
                            type="text"
                            value={comment}
                            onChange={handleCommentChange}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                emitTyping(false);
                                if (typingTimeoutRef.current)
                                  clearTimeout(typingTimeoutRef.current);
                                handlePostComment();
                              }
                            }}
                            placeholder="Write a comment..."
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              border: "none",
                              outline: "none",
                              fontSize: 14,
                              background: "transparent",
                              borderRadius: "10px 10px 0 0",
                            }}
                          />

                          {/* Staged file previews */}
                          {commentFiles.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 8,
                                padding: "8px 10px",
                                borderTop: "1px solid #cbc3d7",
                                background: "#f6f2ff",
                              }}
                            >
                              {commentFiles.map((f, i) => {
                                const isImg =
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name);
                                const objUrl = commentFilePreviews[i];
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      position: "relative",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 6,
                                      background: "#efebff",
                                      border: "1px solid #e9ddff",
                                      borderRadius: 8,
                                      padding: "4px 8px 4px 6px",
                                      fontSize: 13,
                                      maxWidth: 180,
                                    }}
                                  >
                                    {isImg ? (
                                      <img
                                        src={objUrl}
                                        alt={f.name}
                                        style={{
                                          width: 52,
                                          height: 52,
                                          objectFit: "cover",
                                          borderRadius: 6,
                                          display: "block",
                                          flexShrink: 0,
                                        }}
                                      />
                                    ) : (
                                      <>
                                        <span
                                          style={{
                                            fontSize: 19,
                                            flexShrink: 0,
                                          }}
                                        >
                                          📄
                                        </span>
                                        <span
                                          style={{
                                            maxWidth: 110,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            color: "#494454",
                                            fontWeight: 600,
                                            fontSize: 13,
                                          }}
                                        >
                                          {f.name}
                                        </span>
                                      </>
                                    )}
                                    <button
                                      onClick={() => {
                                        URL.revokeObjectURL(
                                          commentFilePreviews[i],
                                        );
                                        setCommentFiles((prev) =>
                                          prev.filter((_, idx) => idx !== i),
                                        );
                                        setCommentFilePreviews((prev) =>
                                          prev.filter((_, idx) => idx !== i),
                                        );
                                      }}
                                      style={{
                                        position: "absolute",
                                        top: -6,
                                        right: -6,
                                        background: "#fff",
                                        border: "1px solid #cbc3d7",
                                        borderRadius: "50%",
                                        width: 18,
                                        height: 18,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: 0,
                                        flexShrink: 0,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                                        zIndex: 1,
                                      }}
                                    >
                                      <Icon.Close />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderTop: "1px solid #cbc3d7",
                              background: "#f6f2ff",
                              borderRadius: "0 0 10px 10px",
                            }}
                          >
                            <input
                              ref={commentFileInputRef}
                              type="file"
                              multiple
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const newFiles = Array.from(e.target.files);
                                const newUrls = newFiles.map((f) =>
                                  URL.createObjectURL(f),
                                );
                                setCommentFiles((prev) => [
                                  ...prev,
                                  ...newFiles,
                                ]);
                                setCommentFilePreviews((prev) => [
                                  ...prev,
                                  ...newUrls,
                                ]);
                                e.target.value = "";
                              }}
                            />
                            <button
                              onClick={() =>
                                commentFileInputRef.current?.click()
                              }
                              title="Attach image or file"
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color:
                                  commentFiles.length > 0
                                    ? "#6b38d4"
                                    : "#7b7486",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              <Icon.Attach />
                              {commentFiles.length > 0 && (
                                <span
                                  style={{
                                    fontSize: 12,
                                    background: "#6b38d4",
                                    color: "white",
                                    borderRadius: 10,
                                    padding: "1px 5px",
                                  }}
                                >
                                  {commentFiles.length}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                emitTyping(false);
                                if (typingTimeoutRef.current)
                                  clearTimeout(typingTimeoutRef.current);
                                handlePostComment();
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "5px 16px",
                                borderRadius: 7,
                                border: "none",
                                background: "#6b38d4",
                                color: "white",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              ↑ Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right sidebar — Faculty card + separate Task Timeline panel */}
                    <div
                      style={{
                        width: 260,
                        flexShrink: 0,
                        padding: "20px",
                        overflowY: "auto",
                        position: "sticky",
                        top: 0,
                        alignSelf: "flex-start",
                        maxHeight: "100vh",
                        borderLeft: "1px solid #cbc3d7",
                      }}
                    >
                      {/* Faculty card (compact) */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: "#7b7486",
                          textTransform: "uppercase",
                          marginBottom: 10,
                        }}
                      >
                        Faculty
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            background: "#8b3ff2",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                            marginBottom: 6,
                          }}
                        >
                          {(selected.assigned_to_name || "?")
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join("") || "?"}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: "#181445",
                          }}
                        >
                          {selected.assigned_to_name || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8b3ff2",
                            fontWeight: 600,
                            marginTop: 2,
                          }}
                        >
                          {selected.assigned_to_email || "—"}
                        </div>
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: 6,
                            padding: "2px 10px",
                            borderRadius: 20,
                            background: "#e9ddff",
                            color: "#6b38d4",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          Faculty
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 8,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            padding: "9px 6px",
                            background: "#f6f2ff",
                            borderRadius: 10,
                            textAlign: "center",
                          }}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="#6b38d4"
                            strokeWidth="1.4"
                            width="15"
                            height="15"
                            style={{ margin: "0 auto 4px" }}
                          >
                            <path d="M4 1.5h6l3 3v10a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-12a.5.5 0 01.5-.5z" />
                            <path d="M10 1.5V4a.5.5 0 00.5.5H13" />
                            <path d="M6 8.5h4M6 11h4" strokeLinecap="round" />
                          </svg>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#6b38d4",
                            }}
                          >
                            {selected.attachments?.length || 0}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#7b7486",
                              marginTop: 1,
                              letterSpacing: 0.4,
                            }}
                          >
                            DOCUMENTS
                          </div>
                        </div>
                        <div
                          style={{
                            padding: "9px 6px",
                            background: "#f6f2ff",
                            borderRadius: 10,
                            textAlign: "center",
                          }}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            fill="#6b38d4"
                            width="15"
                            height="15"
                            style={{ margin: "0 auto 4px" }}
                          >
                            <path d="M2 2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5v6A1.5 1.5 0 0112.5 10H7l-3 3v-3H3.5A1.5 1.5 0 012 8.5v-6z" />
                          </svg>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 800,
                              color: "#6b38d4",
                            }}
                          >
                            {selected.comments?.length || 0}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#7b7486",
                              marginTop: 1,
                              letterSpacing: 0.4,
                            }}
                          >
                            COMMENTS
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          height: 1,
                          background: "#e9e2f7",
                          marginBottom: 20,
                        }}
                      />

                      {/* Task Timeline */}
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 1,
                          color: "#7b7486",
                          textTransform: "uppercase",
                          marginBottom: 14,
                        }}
                      >
                        Task Timeline
                      </div>
                      <TimelineItem
                        label="Task Created"
                        value={`by ${selected.assigned_by_name || "—"}`}
                        sub={fmtDate(selected.created_at)}
                        dot="#6b38d4"
                      />
                      <TimelineItem
                        label="Assigned to Faculty"
                        value={selected.assigned_to_name || "—"}
                        sub={fmtDate(
                          selected.assigned_at || selected.created_at,
                        )}
                        dot="#6b38d4"
                      />
                      {selected.submitted_at && (
                        <TimelineItem
                          label="Submitted by Faculty"
                          value={selected.assigned_to_name || "—"}
                          sub={fmtDateTime(selected.submitted_at)}
                          dot="#6b38d4"
                        />
                      )}
                      {selected.approved_at && (
                        <TimelineItem
                          label="Approved"
                          value={`by ${selected.approved_by_name || "You"}`}
                          sub={fmtDateTime(selected.approved_at)}
                          dot="#6b38d4"
                        />
                      )}
                      {selected.returned_at && (
                        <TimelineItem
                          label="Returned"
                          value={`by ${selected.returned_by_name || "You"}`}
                          sub={fmtDateTime(selected.returned_at)}
                          dot="#ba1a1a"
                        />
                      )}
                      <TimelineItem
                        label="Current Status"
                        value={
                          APPROVED_STATUSES.includes(
                            selected.status?.toLowerCase(),
                          )
                            ? "Approved"
                            : selected.status || "—"
                        }
                        dot={
                          APPROVED_STATUSES.includes(
                            selected.status?.toLowerCase(),
                          )
                            ? "#6b38d4"
                            : selected.status?.toLowerCase() === "overdue" ||
                                selected.status?.toLowerCase() === "returned"
                              ? "#ba1a1a"
                              : "#d1d5db"
                        }
                        isLast
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer removed */}
      </div>

      {/* ── File Viewer Modal ── */}
      {fileViewer && (
        <>
          <div
            onClick={() => setFileViewer(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 60,
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "min(1000px, 94vw)",
              height: "min(680px, 92vh)",
              background: "white",
              zIndex: 70,
              display: "flex",
              flexDirection: "column",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 18px",
                background: "#1e1b2e",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 17 }}>
                  {fileViewer.isPdf ? "📄" : fileViewer.isImg ? "🖼️" : "📎"}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "white" }}>
                  {fileViewer.name}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={fileViewer.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "6px 14px",
                    background: "#6b38d4",
                    color: "white",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ↗ Open
                </a>
                <a
                  href={fileViewer.url}
                  download={fileViewer.name}
                  style={{
                    padding: "6px 14px",
                    background: "#e9ddff",
                    color: "#6b38d4",
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  ↓ Download
                </a>
                <button
                  onClick={() => setFileViewer(null)}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: 7,
                    color: "white",
                    cursor: "pointer",
                    padding: "6px 10px",
                    fontSize: 17,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                background: "#1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {fileViewer.isPdf ? (
                <iframe
                  src={fileViewer.url}
                  title={fileViewer.name}
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : fileViewer.isImg ? (
                <img
                  src={fileViewer.url}
                  alt={fileViewer.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    padding: 20,
                  }}
                />
              ) : (
                <div style={{ textAlign: "center", color: "#7b7486" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📎</div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "white",
                      marginBottom: 8,
                    }}
                  >
                    {fileViewer.name}
                  </div>
                  <a
                    href={fileViewer.url}
                    download={fileViewer.name}
                    style={{
                      padding: "10px 24px",
                      background: "#6b38d4",
                      color: "white",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    ↓ Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PathTasksAssignedLayout({
  navigate,
  user,
  avatarUrlFor,
  tasks,
  stats,
  loading,
  selected,
  search,
  statusFilter,
  priorityFilter,
  dateRange,
  docTypeFilter,
  taskPage,
  totalTaskPages,
  pagedTasks,
  filteredTasks,
  checkedIds,
  selectAll,
  newSubmissions,
  socketConnected,
  actionLoading,
  returnNote,
  showReturnBox,
  toasts,
  onDismissToast,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onDateChange,
  onDocTypeChange,
  onClearFilters,
  onPageChange,
  onSelectTask,
  onToggleCheck,
  onToggleSelectAll,
  onArchive,
  onArchiveSingle,
  onApprove,
  onSetReturnNote,
  onToggleReturn,
  onReturn,
}) {
  const total = stats.total ?? tasks.length;
  const active = tasks.filter(
    (task) => !/approved|done|received/i.test(task.status || ""),
  ).length;
  const submitted =
    stats.submitted ??
    tasks.filter((task) => /submitted|for approval/i.test(task.status || ""))
      .length;
  const review =
    stats.pendingApproval ??
    tasks.filter((task) => /approval|review/i.test(task.status || "")).length;
  const overdue =
    stats.overdue ??
    tasks.filter(
      (task) => task.deadline && new Date(task.deadline) < new Date(),
    ).length;
  const selectedIsReviewable = /for approval|submitted|in review/i.test(
    selected?.status || "",
  );
  const statusTone = (statusValue) => {
    const value = String(statusValue || "").toLowerCase();
    if (/approved|done|received/.test(value)) return "approved";
    if (/returned/.test(value)) return "returned";
    if (/approval|review|submitted/.test(value)) return "review";
    if (/overdue/.test(value)) return "risk";
    return "progress";
  };
  const initials = (name) =>
    String(name || "?")
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const deadline = (value) =>
    value
      ? new Date(value).toLocaleString("en-US", {
          timeZone: "Asia/Manila",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "No checkpoint";
  const isLate = (task) =>
    task?.deadline &&
    new Date(task.deadline) < new Date() &&
    !/approved|done|received/i.test(task.status || "");
  const openTask = (task) =>
    navigate(`/task-details/${task.id}`, {
      state: { task, returnTo: "/task-assigned" },
    });

  return (
    <div className="path-assigned-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        .path-assigned-filter input[type="date"]{min-width:0;width:132px;border:0;outline:0;background:transparent;color:#73647e;font-size:11px!important;font-weight:700}.path-assigned-filter input[type="date"]::-webkit-datetime-edit,.path-assigned-filter input[type="date"]::-webkit-datetime-edit-fields-wrapper,.path-assigned-filter input[type="date"]::-webkit-datetime-edit-text,.path-assigned-filter input[type="date"]::-webkit-datetime-edit-month-field,.path-assigned-filter input[type="date"]::-webkit-datetime-edit-day-field,.path-assigned-filter input[type="date"]::-webkit-datetime-edit-year-field{font-size:11px!important;font-weight:700}
        .path-assigned-shell{display:flex;height:100vh;overflow:hidden;background:#f8f7ff;color:#51405e;font-family:'DM Sans',sans-serif}.path-assigned-shell *{box-sizing:border-box}.path-assigned-shell button,.path-assigned-shell input,.path-assigned-shell select,.path-assigned-shell textarea{font-family:inherit}.path-assigned-main{display:flex;min-width:0;flex:1;flex-direction:column;background:#f8f7ff}.path-assigned-body{flex:1;overflow:auto;padding:28px 30px 20px}@media(min-width:1100px){.path-assigned-body{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.path-assigned-content{max-width:none;margin:0 auto}.path-assigned-hero{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:148px;padding:29px 24px;border:1px solid #e6ddf5;border-left:2px solid #c4b5fd;border-radius:12px;background:linear-gradient(112deg,#fcfaff,#f5efff);box-shadow:0 12px 30px rgba(57,36,93,.04)}.path-assigned-kicker{display:flex;align-items:center;gap:8px;color:#8e8499;font-size:12px;font-weight:700;letter-spacing:.12em}.path-assigned-kicker i{width:6px;height:6px;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 4px #eee8ff}.path-assigned-hero h1{margin:9px 0 7px;color:#2c2537;font:700 31px/1.12 Manrope,sans-serif;letter-spacing:-.045em}.path-assigned-hero p{max-width:650px;margin:0;color:#83778b;font-size:14px;line-height:1.4}.path-assigned-hero-actions{display:flex;align-items:center;gap:10px}.path-assigned-live{display:flex;align-items:center;gap:7px;padding:9px 10px;border:1px solid #e7dfee;border-radius:9px;background:#fff;color:#8c7c97;font-size:12px;font-weight:700}.path-assigned-live i{width:7px;height:7px;border-radius:50%;background:#d49145}.path-assigned-live i.online{background:#4da276;box-shadow:0 0 0 3px #e4f6ec}.path-assigned-primary,.path-assigned-open{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 9px 18px rgba(124,58,237,.2)}.path-assigned-primary{min-height:38px;padding:0 13px}.path-assigned-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:21px}.path-assigned-metric{position:relative;display:flex;gap:11px;min-height:108px;overflow:hidden;padding:15px;border:1px solid #e8e0ee;border-radius:12px;background:#fff;box-shadow:0 10px 24px rgba(58,35,90,.04)}.path-assigned-metric:after{position:absolute;right:-27px;top:-31px;width:92px;height:92px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.28),transparent 69%);content:''}.path-assigned-metric>span{position:relative;z-index:1;display:grid;width:31px;height:31px;flex:0 0 auto;place-items:center;border-radius:9px;background:#eee7fd;color:#744ab2;font-size:16px;font-weight:800}.path-assigned-metric.review>span{background:#fff4dc;color:#a97826}.path-assigned-metric.submitted>span{background:#e9f1ff;color:#557dc4}.path-assigned-metric.risk>span{background:#fff0ed;color:#b45d52}.path-assigned-metric small{display:block;color:#9b8ea2;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.path-assigned-metric strong{display:block;margin-top:7px;color:#4c3857;font:800 23px Manrope,sans-serif;letter-spacing:-.06em}.path-assigned-metric p{margin:5px 0 0;color:#9b8fa1;font-size:11px}.path-assigned-controls{display:flex;align-items:center;gap:9px;margin-top:20px;padding:12px 14px;border:1px solid #e8e1ee;border-radius:11px;background:#fff}.path-assigned-search,.path-assigned-filter{display:flex;align-items:center;gap:7px;border:1px solid #e8e1ed;border-radius:7px;color:#93869d}.path-assigned-search{width:260px;padding:8px 10px}.path-assigned-search input{width:100%;border:0;outline:0;background:transparent;color:#5e4b69;font-size:12px}.path-assigned-filter{padding:0 8px}.path-assigned-filter select{min-height:31px;border:0;outline:0;background:#fff;color:#73647e;font-size:11px;font-weight:700;cursor:pointer}.path-assigned-count{margin-left:auto;color:#978b9e;font-size:11px;font-weight:700}.path-assigned-layout{display:grid;grid-template-columns:minmax(0,1.56fr) minmax(294px,.64fr);align-items:start;gap:16px;margin-top:15px}.path-assigned-panel{overflow:hidden;border:1px solid #e7dfed;border-radius:12px;background:#fff;box-shadow:0 12px 28px rgba(58,36,88,.045)}.path-assigned-register-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:17px 18px}.path-assigned-register-head span,.path-assigned-selected-label{display:block;color:#a195a7;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.path-assigned-register-head h2,.path-assigned-detail h2{margin:5px 0 0;color:#4a3756;font:800 18px Manrope,sans-serif;letter-spacing:-.045em}.path-assigned-register-head p{max-width:215px;margin:0;color:#9b90a0;font-size:11px;line-height:1.5;text-align:right}.path-assigned-head,.path-assigned-row{display:grid;grid-template-columns:minmax(185px,1.45fr) minmax(126px,1fr) minmax(105px,.78fr) minmax(100px,.72fr);gap:10px;align-items:center}.path-assigned-head{padding:10px 18px;border-top:1px solid #f1edf3;border-bottom:1px solid #f1edf3;background:#fbfafe;color:#a79dac;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}.path-assigned-row{width:100%;min-height:73px;padding:10px 18px;border:0;border-bottom:1px solid #f1edf4;background:#fff;color:inherit;text-align:left;cursor:pointer;transition:background .16s ease,box-shadow .16s ease}.path-assigned-row:hover,.path-assigned-row.selected{background:#fcfaff}.path-assigned-row.selected{box-shadow:inset 3px 0 #7c3aed}.path-assigned-task{display:flex;min-width:0;align-items:center;gap:9px}.path-assigned-priority{display:grid;width:25px;height:25px;flex:0 0 25px;place-items:center;border-radius:7px;background:#eee7fa;color:#7448b2;font-size:12px;font-style:normal;font-weight:800}.path-assigned-priority.high{background:#fff0ed;color:#b45d52}.path-assigned-priority.medium{background:#fff4dc;color:#aa7727}.path-assigned-task-copy,.path-assigned-owner-copy{display:flex;min-width:0;flex-direction:column;gap:4px}.path-assigned-task-copy strong,.path-assigned-owner-copy strong{overflow:hidden;color:#55405f;font:800 12px Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.path-assigned-task-copy small,.path-assigned-owner-copy small{overflow:hidden;color:#9d91a2;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.path-assigned-owner{display:flex;min-width:0;align-items:center;gap:8px}.path-assigned-avatar{display:grid;width:27px;height:27px;flex:0 0 auto;place-items:center;border-radius:8px;background:#efe8fc;color:#7044ae;font-size:11px;font-weight:800}.path-assigned-state{display:flex;min-width:0;align-items:center;gap:5px;color:#765d85;font-size:11px;font-weight:800;white-space:nowrap}.path-assigned-state i,.path-assigned-selected-label i{width:6px;height:6px;flex:0 0 auto;border-radius:50%;background:#8b5cf6}.path-assigned-state i.review,.path-assigned-selected-label i.review{background:#6192d4}.path-assigned-state i.approved,.path-assigned-selected-label i.approved{background:#58a17b}.path-assigned-state i.returned,.path-assigned-selected-label i.returned{background:#d78660}.path-assigned-state i.risk,.path-assigned-selected-label i.risk{background:#cf6656}.path-assigned-due{display:flex;min-width:0;flex-direction:column;gap:3px}.path-assigned-due strong,.path-assigned-due small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.path-assigned-due strong{color:#74657c;font-size:11px}.path-assigned-due small{color:#579172;font-size:11px;font-weight:700}.path-assigned-due small.late{color:#b76757}.path-assigned-pagination{display:flex;align-items:center;justify-content:space-between;padding:10px 15px;color:#9b8fa2;font-size:11px}.path-assigned-pagination div{display:flex;gap:5px}.path-assigned-pagination button{display:grid;width:25px;height:25px;place-items:center;border:1px solid #e6deeb;border-radius:6px;background:#fff;color:#76548c;cursor:pointer}.path-assigned-pagination button:disabled{cursor:not-allowed;opacity:.4}.path-assigned-empty{display:flex;min-height:250px;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:28px;color:#9e92a3;text-align:center}.path-assigned-empty strong{color:#695a72;font:800 13px Manrope,sans-serif}.path-assigned-empty span{font-size:12px}.path-assigned-empty button{margin-top:5px;border:0;border-radius:7px;padding:7px 9px;background:#efe7fb;color:#7044ac;font-size:11px;font-weight:800;cursor:pointer}.path-assigned-detail{padding:18px}.path-assigned-selected-label{display:flex;align-items:center;justify-content:space-between}.path-assigned-detail h2{margin-top:11px;font-size:21px;line-height:1.18}.path-assigned-detail>p{margin:8px 0 0;color:#988b9d;font-size:12px;line-height:1.5}.path-assigned-owner-card{display:flex;align-items:center;gap:9px;margin-top:16px;padding:10px;border:1px solid #e8e0ee;border-radius:9px;background:#fbf9fe}.path-assigned-owner-card>span:nth-child(2){display:flex;flex:1;flex-direction:column;gap:3px}.path-assigned-owner-card small{color:#9d91a2;font-size:11px}.path-assigned-owner-card strong{color:#5c4867;font-size:12px}.path-assigned-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px 10px;margin-top:17px}.path-assigned-info-grid span{display:block;color:#a397a8;font-size:11px}.path-assigned-info-grid strong{display:block;overflow:hidden;margin-top:4px;color:#66536f;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.path-assigned-return-box{display:grid;gap:7px;margin-top:15px;padding:10px;border:1px solid #edcfbf;border-radius:9px;background:#fff9f4}.path-assigned-return-box label{color:#93653c;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.path-assigned-return-box textarea{width:100%;min-height:58px;resize:vertical;border:1px solid #e6d8ce;border-radius:7px;padding:8px;color:#5e4a3f;font-size:12px;outline:0}.path-assigned-return-actions{display:flex;justify-content:flex-end;gap:7px}.path-assigned-return-actions button{border-radius:6px;padding:6px 8px;font-size:11px;font-weight:800;cursor:pointer}.path-assigned-return-actions button:first-child{border:1px solid #e1d5ca;background:#fff;color:#8c7969}.path-assigned-return-actions button:last-child{border:1px solid #ad6047;background:#ad6047;color:#fff}.path-assigned-detail-actions{display:grid;gap:8px;margin-top:15px}.path-assigned-open{width:100%;min-height:34px}.path-assigned-secondary{min-height:32px;border:1px solid #dcd2e6;border-radius:8px;background:#fff;color:#745589;font-size:12px;font-weight:800;cursor:pointer}.path-assigned-approve{min-height:32px;border:1px solid #bfe3cd;border-radius:8px;background:#eef9f2;color:#428164;font-size:12px;font-weight:800;cursor:pointer}.path-assigned-approve:disabled{cursor:not-allowed;opacity:.55}.path-assigned-check{margin:0 7px 0 0;accent-color:#7c3aed}@media(max-width:1080px){.path-assigned-layout{grid-template-columns:1fr}.path-assigned-detail{min-height:0}}@media(max-width:780px){.path-assigned-body{padding:20px 16px}.path-assigned-hero{align-items:flex-start;flex-direction:column;min-height:0;padding:22px 18px}.path-assigned-hero-actions{width:100%;justify-content:space-between}.path-assigned-metrics{grid-template-columns:1fr 1fr;gap:9px}.path-assigned-metric{min-height:95px;padding:12px}.path-assigned-controls{align-items:stretch;flex-wrap:wrap}.path-assigned-search{width:100%}.path-assigned-count{width:100%;margin-left:0}.path-assigned-head{display:none}.path-assigned-row{grid-template-columns:minmax(0,1fr) minmax(96px,.56fr);gap:8px}.path-assigned-task{grid-column:1;grid-row:1}.path-assigned-owner{grid-column:1;grid-row:2}.path-assigned-state{grid-column:2;grid-row:1;justify-self:end}.path-assigned-due{grid-column:2;grid-row:2;align-items:flex-end}.path-assigned-due strong,.path-assigned-due small{text-align:right;white-space:normal}.path-assigned-register-head{align-items:flex-start;flex-direction:column}.path-assigned-register-head p{text-align:left}}@media(max-width:470px){.path-assigned-hero-actions{align-items:stretch;flex-direction:column}.path-assigned-primary{width:100%}.path-assigned-metrics{grid-template-columns:1fr}.path-assigned-filter{flex:1}.path-assigned-filter select{width:100%}.path-assigned-info-grid{grid-template-columns:1fr}}
      `}</style>
      <Toast toasts={toasts} onDismiss={onDismissToast} />
      <main className="path-assigned-main">
        <div className="path-assigned-body">
          <div className="path-assigned-content">
            <header className="path-assigned-hero">
              <div>
                <span className="path-assigned-kicker">
                  <i /> PROGRAM CHAIR WORKSPACE · HANDOFF REGISTER
                </span>
                <h1>Tasks assigned</h1>
                <p>
                  Track the tasks you routed to faculty, monitor their workflow
                  position, and open the full task detail when a decision is
                  needed.
                </p>
              </div>
              <div className="path-assigned-hero-actions">
                <span className="path-assigned-live">
                  <i className="online" />
                  {active} active handoffs
                </span>
                <button
                  className="path-assigned-primary"
                  type="button"
                  onClick={() => navigate("/assign-task")}
                >
                  <Icon.Plus color="white" size={13} /> Assign task
                </button>
              </div>
            </header>

            <section
              className="path-assigned-metrics"
              aria-label="Assigned task summary"
            >
              <MetricCard
                icon="≡"
                label="Total assigned"
                value={total}
                detail="Across all active handoffs"
                tone="violet"
              />
              <MetricCard
                icon="◷"
                label="In chair review"
                value={review}
                detail="Ready for a decision"
                tone="review"
              />
              <MetricCard
                icon="⇧"
                label="Submitted work"
                value={submitted}
                detail="Faculty evidence received"
                tone="submitted"
              />
              <MetricCard
                icon="!"
                label="At SLA risk"
                value={overdue}
                detail="Needs proactive follow-up"
                tone="risk"
              />
            </section>

            <section
              className="path-assigned-controls"
              aria-label="Tasks Assigned controls"
            >
              <label className="path-assigned-search">
                <Icon.Search />
                <input
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Search title, tracking ID, or faculty"
                />
              </label>
              <label className="path-assigned-filter">
                <Icon.Filter />
                <select
                  value={statusFilter}
                  onChange={(event) => onStatusChange(event.target.value)}
                  aria-label="Filter by workflow state"
                >
                  <option value="All">All states</option>
                  <option value="Pending">Awaiting submission</option>
                  <option value="In Progress">In progress</option>
                  <option value="For Approval">In review</option>
                  <option value="Returned">Returned</option>
                  <option value="Approved">Approved</option>
                </select>
              </label>
              <label className="path-assigned-filter">
                <Icon.Filter />
                <select
                  value={priorityFilter}
                  onChange={(event) => onPriorityChange(event.target.value)}
                  aria-label="Filter by priority"
                >
                  <option value="All">All priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <label className="path-assigned-filter">
                <span>◷</span>
                <input
                  type="date"
                  value={dateRange}
                  onChange={(event) => onDateChange(event.target.value)}
                  aria-label="Filter by due date"
                />
              </label>
              {(search ||
                statusFilter !== "All" ||
                priorityFilter !== "All" ||
                dateRange ||
                docTypeFilter !== "All") && (
                <button
                  className="path-assigned-secondary"
                  type="button"
                  onClick={onClearFilters}
                >
                  Clear filters
                </button>
              )}
              <span className="path-assigned-count">
                {filteredTasks.length} of {tasks.length} assigned tasks
              </span>
            </section>

            <div className="path-assigned-layout">
              <section
                className="path-assigned-panel"
                aria-label="Tasks assigned register"
              >
                <header className="path-assigned-register-head">
                  <div>
                    <span>Assigned-out register</span>
                    <h2>Faculty handoffs</h2>
                  </div>
                  <p>
                    Select a task to inspect its progress, owner, and next
                    decision.
                  </p>
                </header>
                <div className="path-assigned-head">
                  <span>Task</span>
                  <span>Assigned to</span>
                  <span>Workflow state</span>
                  <span>Due checkpoint</span>
                </div>
                <div>
                  {loading ? (
                    <div className="path-assigned-empty">
                      <strong>Loading assigned tasks…</strong>
                      <span>Refreshing the latest workflow data.</span>
                    </div>
                  ) : pagedTasks.length ? (
                    pagedTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className={`path-assigned-row ${selected?.id === task.id ? "selected" : ""}`}
                        onClick={() => onSelectTask(task)}
                      >
                        <span className="path-assigned-task">
                          <i
                            className={`path-assigned-priority ${String(task.priority || "low").toLowerCase()}`}
                          >
                            {String(task.priority || "L").slice(0, 1)}
                          </i>
                          <span className="path-assigned-task-copy">
                            <strong>{task.title || "Untitled task"}</strong>
                            <small>
                              {task.tracking_id || `TASK-${task.id}`} ·{" "}
                              {task.doc_type || "Workflow handoff"}
                            </small>
                          </span>
                        </span>
                        <span className="path-assigned-owner">
                          <AvatarCircle
                            name={task.assigned_to_name}
                            pictureUrl={avatarUrlFor(task.assigned_to_name)}
                            size={27}
                            background="#efe8fc"
                            color="#7044ae"
                            fontSize={11}
                            style={{ borderRadius: 8 }}
                          />
                          <span className="path-assigned-owner-copy">
                            <strong>
                              {task.assigned_to_name || "Unassigned"}
                            </strong>
                            <small>Faculty owner</small>
                          </span>
                        </span>
                        <span className="path-assigned-state">
                          <i className={statusTone(task.status)} />
                          {task.status || "Pending"}
                          {newSubmissions[task.id] ? " · New" : ""}
                        </span>
                        <span className="path-assigned-due">
                          <strong>
                            {deadline(task.deadline || task.created_at)}
                          </strong>
                          <small className={isLate(task) ? "late" : ""}>
                            {isLate(task)
                              ? "Overdue"
                              : task.priority
                                ? `${task.priority} priority`
                                : "On track"}
                          </small>
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="path-assigned-empty">
                      <strong>No assigned tasks match these filters</strong>
                      <span>
                        Try another workflow state, priority, or search term.
                      </span>
                      <button type="button" onClick={onClearFilters}>
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
                <footer className="path-assigned-pagination">
                  <span>
                    {filteredTasks.length
                      ? `Page ${taskPage} of ${totalTaskPages}`
                      : "No tasks"}
                  </span>
                  <div>
                    <button
                      type="button"
                      disabled={taskPage === 1}
                      onClick={() =>
                        onPageChange((page) => Math.max(1, page - 1))
                      }
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      disabled={taskPage === totalTaskPages}
                      onClick={() =>
                        onPageChange((page) =>
                          Math.min(totalTaskPages, page + 1),
                        )
                      }
                    >
                      ›
                    </button>
                  </div>
                </footer>
              </section>

              <aside className="path-assigned-panel path-assigned-detail">
                {selected ? (
                  <>
                    <div className="path-assigned-selected-label">
                      <span>Selected handoff</span>
                      <i className={statusTone(selected.status)} />
                    </div>
                    <h2>{selected.title || "Untitled task"}</h2>
                    <p>{selected.doc_type || "Workflow handoff"}</p>
                    <div className="path-assigned-owner-card">
                      <AvatarCircle
                        name={selected.assigned_to_name}
                        pictureUrl={avatarUrlFor(selected.assigned_to_name)}
                        size={27}
                        background="#efe8fc"
                        color="#7044ae"
                        fontSize={11}
                        style={{ borderRadius: 8 }}
                      />
                      <span>
                        <small>Assigned to</small>
                        <strong>
                          {selected.assigned_to_name || "Unassigned"}
                        </strong>
                      </span>
                      <span style={{ color: "#8d67c4", fontSize: 16 }}>⌁</span>
                    </div>
                    <div className="path-assigned-info-grid">
                      <InfoCell
                        label="Workflow state"
                        value={selected.status || "Pending"}
                      />
                      <InfoCell
                        label="Due checkpoint"
                        value={deadline(selected.deadline)}
                      />
                      <InfoCell
                        label="Priority"
                        value={selected.priority || "Normal"}
                      />
                      <InfoCell
                        label="Submitted files"
                        value={String(selected.submissions?.length || 0)}
                      />
                    </div>
                    {showReturnBox && (
                      <div className="path-assigned-return-box">
                        <label>Revision instruction</label>
                        <textarea
                          value={returnNote}
                          onChange={(event) =>
                            onSetReturnNote(event.target.value)
                          }
                          placeholder="Tell the faculty member what needs to change before resubmission."
                        />
                        <div className="path-assigned-return-actions">
                          <button type="button" onClick={onToggleReturn}>
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === "return"}
                            onClick={() => onReturn(selected.id)}
                          >
                            {actionLoading === "return"
                              ? "Sending…"
                              : "Return for revision"}
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="path-assigned-detail-actions">
                      <button
                        className="path-assigned-open"
                        type="button"
                        onClick={() => openTask(selected)}
                      >
                        ↗ Open task details
                      </button>
                      {selectedIsReviewable && (
                        <button
                          className="path-assigned-approve"
                          type="button"
                          disabled={actionLoading === "approve"}
                          onClick={() => onApprove(selected.id)}
                        >
                          {actionLoading === "approve"
                            ? "Approving…"
                            : "Approve task"}
                        </button>
                      )}
                      <button
                        className="path-assigned-secondary"
                        type="button"
                        onClick={
                          /approved|received/i.test(selected?.status || "")
                            ? () => onArchiveSingle(selected.id)
                            : onToggleReturn
                        }
                        disabled={actionLoading === "archive"}
                      >
                        {/approved|received/i.test(selected?.status || "")
                          ? actionLoading === "archive"
                            ? "Archiving…"
                            : "Archive task"
                          : showReturnBox
                            ? "Hide return form"
                            : "Return for revision"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="path-assigned-empty">
                    <strong>Select a task to review</strong>
                    <span>
                      Its owner, SLA context, files, and decision options will
                      appear here.
                    </span>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, tone }) {
  return (
    <article className={`path-assigned-metric ${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{String(value ?? 0).padStart(2, "0")}</strong>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function InfoCell({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}