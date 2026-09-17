import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket, connectSocket } from "./socket";

const API = import.meta.env.VITE_API_URL;

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function initials(name = "") {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const COLORS = ["#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2", "#7c3aed"];
function avatarColor(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

// Resolves a stored file/photo path to a usable URL.
// Some values are already full URLs (e.g. Cloudflare R2), others are relative
// paths served by our own backend — only prefix API in the latter case.
function resolveUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${API}${pathOrUrl}`;
}

// Reply metadata is embedded into the plain-text `content` field (the backend
// has no dedicated reply column) using an invisible marker so we can render a
// quoted "replied to" block above the real message text. Messages without the
// marker pass through untouched.
const REPLY_MARKER_RE = /^\[\[REPLY\]\](.*?)\[\[\/REPLY\]\]\n?([\s\S]*)$/;
function buildReplyContent(meta, text) {
  return `[[REPLY]]${JSON.stringify(meta)}[[/REPLY]]\n${text}`;
}
function parseReplyContent(content) {
  if (!content) return { replyMeta: null, text: content };
  const m = content.match(REPLY_MARKER_RE);
  if (!m) return { replyMeta: null, text: content };
  try {
    return { replyMeta: JSON.parse(m[1]), text: m[2] };
  } catch {
    return { replyMeta: null, text: content };
  }
}

// Messages can only be edited within this window after they were sent.
const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ── SVG Icons (from Dashboard) ────────────────────────────────────────────────
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
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}>
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
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
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
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Help: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
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
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12">
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" />
    </svg>
  ),
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
Categories:() => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.2"/></svg>,
SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // ── Chat settings menu icons ──
  Dots: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="16" height="16">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="8" cy="13" r="1.5" />
    </svg>
  ),
  Profile: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="5.2" r="3" />
      <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.2v4M8 5v.1" strokeLinecap="round" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="3" y="2" width="10" height="12" rx="1" />
      <path d="M6 5h1M9 5h1M6 8h1M9 8h1M6 11h1M9 11h1" strokeLinecap="round" />
    </svg>
  ),
  Pin: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M9.5 2l4.5 4.5-2 2-.7-.2-2.6 2.6.3 2.6-1 1-3-3-3 3-.2-.2 3-3-3-3 1-1 2.6.3 2.6-2.6-.2-.7 2-2z" strokeLinejoin="round" />
    </svg>
  ),
  BellOff: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M4 6.5a4 4 0 018 0v3l1.3 2H2.7L4 9.5v-3z" strokeLinejoin="round" />
      <path d="M6.3 13.5a1.8 1.8 0 003.4 0" strokeLinecap="round" />
      <line x1="2" y1="2" x2="14" y2="14" strokeLinecap="round" />
    </svg>
  ),
  MarkUnread: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
      <path d="M2.5 4.5L8 8.5l5.5-4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="3.5" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M6.5 7.5v4M9.5 7.5v4" strokeLinecap="round" />
      <path d="M4 4.5l.6 8.5a1 1 0 001 .9h4.8a1 1 0 001-.9l.6-8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Block: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <line x1="3.7" y1="3.7" x2="12.3" y2="12.3" />
    </svg>
  ),
  Flag: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M4 2v12" strokeLinecap="round" />
      <path d="M4 2.8h7.5l-2 2.7 2 2.7H4z" strokeLinejoin="round" />
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" />
      <path d="M5.2 7V5a2.8 2.8 0 015.6 0v2" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="2" y="2.5" width="12" height="3" rx="0.8" />
      <path d="M3 5.5v7a1 1 0 001 1h8a1 1 0 001-1v-7" />
      <path d="M6.5 8.5h3" strokeLinecap="round" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  ),
  Mail: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="2" y="3.5" width="12" height="9" rx="1.2" />
      <path d="M2.5 4.5L8 8.5l5.5-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 2.5c0-.3.2-.5.5-.5h2l1 2.5-1.5 1a7 7 0 003.5 3.5l1-1.5L12 8.5v2c0 .3-.2.5-.5.5A9.5 9.5 0 012.5 2.5z" />
    </svg>
  ),
  ChevronUp: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M3.5 10L8 5.5 12.5 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Media: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="2" y="2.5" width="12" height="9" rx="1.2" />
      <circle cx="5.2" cy="5.7" r="1.1" fill="currentColor" stroke="none" />
      <path d="M2.5 10.5l3.3-3.3a1 1 0 011.4 0l1.3 1.3 2-2a1 1 0 011.4 0l1.6 1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 14h8" strokeLinecap="round" />
    </svg>
  ),
  FileDoc: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M4 1.5h5l3 3v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-11.5a1 1 0 011-1z" strokeLinejoin="round" />
      <path d="M9 1.5v3h3" strokeLinejoin="round" />
      <path d="M5 8.5h6M5 11h4" strokeLinecap="round" />
    </svg>
  ),
  // ── Per-message hover action icons ──
  DotsHorizontal: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
    </svg>
  ),
  ReplyArrow: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M6.5 3.5L2 8l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 8h7a4.5 4.5 0 014.5 4.5V13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ForwardArrow: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M9.5 3.5L14 8l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8H7A4.5 4.5 0 002.5 12.5V13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  PinSmall: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
      <path d="M9.5 1.5l5 5-1.7 1.7-.9-.3-2.7 2.7.3 2.7-1 1-3-3-3.2 3.2-.3-.3 3.2-3.2-3-3 1-1 2.7.3 2.7-2.7-.3-.9 2 2z" />
    </svg>
  ),
  Remove: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 4.5h10M6.5 4.5V3a1 1 0 011-1h1a1 1 0 011 1v1.5M6.5 7.5v4M9.5 7.5v4" strokeLinecap="round" />
      <path d="M4 4.5l.6 8.5a1 1 0 001 .9h4.8a1 1 0 001-.9l.6-8.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M10.5 2.5l3 3-8 8-3.6.6.6-3.6 8-8z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36, online, photoUrl }) {
  const bg = avatarColor(name);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = photoUrl && !imgFailed;
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {showImg ? (
        <img
          src={photoUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: "bold", color: "white" }}>
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: online ? "#22c55e" : "#d1d5db", border: "2px solid white" }} />
      )}
    </div>
  );
}

// ── Profile & Settings Drawer ─────────────────────────────────────────────────
function ProfileDrawer({ open, onClose, faculty, prefs, onPrefsChange, isAdmin, mediaCount, fileCount, pinnedCount = 0, onAction }) {
  const PANEL_WIDTH = 300;
  return (
    // Outer flex item — width animates 0 → PANEL_WIDTH so it pushes the layout
    // instead of covering it. `overflow: hidden` clips the fixed-width inner
    // panel while it's collapsed/collapsing.
    <div
      aria-hidden={!open}
      style={{
        width: open ? PANEL_WIDTH : 0,
        flexShrink: 0,
        height: "100%",
        overflow: "hidden",
        background: "#1e1b2e",
        borderLeft: open ? "0.5px solid rgba(255,255,255,0.08)" : "none",
        transition: "width 0.22s ease-out",
      }}
    >
      {/* Fixed-width inner panel — keeps content from reflowing/squishing while the outer width animates */}
      <div
        role="region"
        aria-label="Profile and chat settings"
        style={{
          width: PANEL_WIDTH, height: "100%",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 12px 0", flexShrink: 0 }}>
          <button
            type="button"
            aria-label="Close profile drawer"
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Icon.Close />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 24px" }}>

          {/* Avatar / name / status */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Avatar name={faculty.full_name} size={92} online={faculty.online} photoUrl={faculty.photoUrl} />
            <div style={{ fontWeight: "bold", fontSize: 17, color: "white", textAlign: "center" }}>{faculty.full_name}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999,
              background: "rgba(255,255,255,0.08)", fontSize: 11.5, color: "#d1d5db",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: faculty.online ? "#22c55e" : "#6b7280", flexShrink: 0 }} />
              {faculty.online ? "Online" : (faculty.lastSeen ? `Last seen ${faculty.lastSeen}` : "Offline")}
            </div>
          </div>

          {/* Info card — replaces the profile/mute/search shortcut row */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "6px 14px", marginBottom: 8 }}>
            <UserInfoRow icon={<Icon.Building />} label="Department" value={faculty.department} />
            <UserInfoRow icon={<Icon.Info />} label="Position" value={faculty.position} />
            <UserInfoRow icon={<Icon.Mail />} label="Email" value={faculty.email} />
            <UserInfoRow icon={<Icon.Phone />} label="Contact" value={faculty.contact_number} last />
          </div>

          <DrawerAccordion title="Chat info" defaultOpen>
            <DrawerListItem
              icon={<Icon.Pin />}
              label="Pin conversation"
              active={prefs.pinned}
              onClick={() => onAction("pin")}
            />
            <DrawerListItem
              icon={<Icon.Search />}
              label="Search messages"
              onClick={() => onAction("search_messages")}
            />
            <DrawerListItem
              icon={<Icon.PinSmall />}
              label="Pinned messages"
              sublabel={`${pinnedCount} message${pinnedCount === 1 ? "" : "s"}`}
              onClick={() => onAction("pinned_messages")}
            />
          </DrawerAccordion>

          <DrawerAccordion title="Media & files" defaultOpen>
            <DrawerListItem icon={<Icon.Media />} label="Media" sublabel={`${mediaCount} item${mediaCount === 1 ? "" : "s"}`} />
            <DrawerListItem icon={<Icon.FileDoc />} label="Files" sublabel={`${fileCount} item${fileCount === 1 ? "" : "s"}`} />
          </DrawerAccordion>

          <DrawerAccordion title="Privacy & support" defaultOpen>
            <DrawerListItem
              icon={<Icon.BellOff />}
              label="Mute notifications"
              active={prefs.muted}
              onClick={() => onAction("mute")}
            />
            <DrawerListItem icon={<Icon.MarkUnread />} label="Mark as unread" onClick={() => onAction("mark_unread")} />
            <DrawerListItem icon={<Icon.Trash />} label="Clear chat history" danger onClick={() => onAction("clear_chat")} />
          </DrawerAccordion>

          {isAdmin && (
            <DrawerAccordion title="Administrative" defaultOpen>
              <DrawerListItem icon={<Icon.Activity />} label="View activity log" onClick={() => onAction("activity_log")} />
              <DrawerListItem icon={<Icon.Lock />} label="Disable chat access" danger onClick={() => onAction("disable_chat")} />
              <DrawerListItem icon={<Icon.Archive />} label="Archive conversation" onClick={() => onAction("archive")} />
            </DrawerAccordion>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact contact-card row used in place of the profile/mute/search shortcuts
function UserInfoRow({ icon, label, value, last }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ color: "#a78bfa", flexShrink: 0, display: "flex" }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color: "#8b87a3", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "white", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
      </div>
    </div>
  );
}

// Collapsible section, chevron-toggled, dark theme (mirrors the reference layout)
function DrawerAccordion({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "2px 0" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", cursor: "pointer", padding: "13px 4px",
          color: "white", fontSize: 13.5, fontWeight: 600,
        }}
      >
        {title}
        <span style={{ color: "#8b87a3", display: "flex", transform: open ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.18s" }}>
          <Icon.ChevronUp />
        </span>
      </button>
      {open && <div style={{ paddingBottom: 8, display: "flex", flexDirection: "column", gap: 1 }}>{children}</div>}
    </div>
  );
}

// Dark-themed row for accordion items — icon + label (+ optional sublabel / active check)
function DrawerListItem({ icon, label, sublabel, onClick, danger, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, width: "100%",
        background: "transparent", border: "none", borderRadius: 8, padding: "8px 6px",
        cursor: onClick ? "pointer" : "default", textAlign: "left",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: danger ? "#f87171" : "#e5e2f0",
      }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: danger ? "#f87171" : "white" }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: "#8b87a3", marginTop: 1 }}>{sublabel}</div>}
      </span>
      {active && <span style={{ color: "#a78bfa", display: "flex", flexShrink: 0 }}><Icon.Check /></span>}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
      <span style={{ color: "white" }}>{label}</span>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)}
        style={{ width: 38, height: 22, borderRadius: 11, border: "none", cursor: "pointer", background: checked ? "#7c3aed" : "rgba(255,255,255,0.15)", position: "relative", transition: "background 0.15s", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.35)" }} />
      </button>
    </div>
  );
}
function SelectRow({ label, value, options, onChange, disabled }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, opacity: disabled ? 0.5 : 1 }}>
      <span style={{ color: "white" }}>{label}</span>
      <select
        disabled={disabled} value={value} onChange={e => onChange(e.target.value)} aria-label={label}
        style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "#2a2740", color: "white", cursor: disabled ? "not-allowed" : "pointer" }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

// ── File Attachment ───────────────────────────────────────────────────────────
function FileAttachment({ url, name }) {
  const ext = name?.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  if (isImage) {
    return (
      <a href={resolveUrl(url)} target="_blank" rel="noreferrer">
        <img src={resolveUrl(url)} alt={name} style={{ maxWidth: 200, maxHeight: 150, borderRadius: 8, marginTop: 4, display: "block" }} />
      </a>
    );
  }
  return (
    <a href={resolveUrl(url)} target="_blank" rel="noreferrer" download={name} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "6px 10px", background: "rgba(0,0,0,0.07)", borderRadius: 8, fontSize: 12, color: "inherit", textDecoration: "none" }}>
      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M3 2h7l3 3v9H3V2zm7 0v3h3" /></svg>
      {name}
    </a>
  );
}

// ── Pinned Messages Modal ──────────────────────────────────────────────────────
// Themed to match the app's light chat surface + violet accent, rather than the
// generic light-grey template it was cloned from.
function PinnedMessagesModal({ onClose, pinnedMessages, currentUser, onUnpin, convName }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,13,26,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 16, width: 380, maxHeight: "75vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}
      >
        {/* Header — dark, matches sidebar/drawer chrome */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#1e1b2e", flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: "bold", fontSize: 14, color: "white" }}>
            <span style={{ color: "#a78bfa", display: "flex" }}><Icon.PinSmall /></span>
            Pinned messages
          </span>
          <button
            onClick={onClose}
            aria-label="Close pinned messages"
            style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#e5e2f0" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
          >
            <Icon.Close />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", background: "#fafafa" }}>
          {pinnedMessages.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "#aaa", fontSize: 12.5, lineHeight: 1.6 }}>
              <div style={{ color: "#c4b5fd", marginBottom: 8, display: "flex", justifyContent: "center" }}>
                <span style={{ transform: "scale(1.8)" }}><Icon.Pin /></span>
              </div>
              No pinned messages yet.<br />
              Hover a message and pin it to keep it here.
            </div>
          ) : pinnedMessages.map(msg => {
            const isMine = String(msg.sender_id) === String(currentUser.id);
            const { text } = parseReplyContent(msg.content);
            return (
              <div
                key={msg.id}
                style={{ padding: "12px 18px", borderBottom: "0.5px solid #ececf1", display: "flex", gap: 10, background: "white" }}
              >
                <Avatar name={isMine ? (currentUser.full_name || currentUser.username) : (msg.sender_name || convName)} size={30} photoUrl={msg.sender_photo ? resolveUrl(msg.sender_photo) : null} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: "bold", color: "#111" }}>{isMine ? "You" : (msg.sender_name || convName)}</span>
                    <span style={{ fontSize: 10, color: "#aaa", flexShrink: 0 }}>{formatTime(msg.created_at)}</span>
                  </div>
                  {text && (
                    <div style={{ fontSize: 12.5, color: "#333", marginTop: 3, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.45 }}>
                      {text}
                    </div>
                  )}
                  {msg.file_url && <FileAttachment url={msg.file_url} name={msg.file_name} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <button
                      onClick={() => onUnpin(msg)}
                      style={{ fontSize: 10.5, fontWeight: 600, background: "none", border: "none", color: "#7c3aed", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: 4 }}
                      onMouseEnter={e => e.currentTarget.style.color = "#5b21b6"}
                      onMouseLeave={e => e.currentTarget.style.color = "#7c3aed"}
                    >
                      <span style={{ transform: "scale(0.85)", display: "flex" }}><Icon.PinSmall /></span>
                      Unpin
                    </button>
                    {msg.pinned_by_name && (
                      <span style={{ fontSize: 10, color: "#aaa" }}>
                        Pinned by {String(msg.pinned_by) === String(currentUser.id) ? "you" : msg.pinned_by_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN INBOX
// ════════════════════════════════════════════════════════════════════════════
export default function Inbox() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getUser();
  const token = localStorage.getItem("token");
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(currentUser?.role);

  const [activeNav, setActiveNav] = useState("inbox");
  const [tab, setTab] = useState("dm"); // "dm" | "groups" | "documents"
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // ── Group chat state ──────────────────────────────────────────────────────
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupInput, setGroupInput] = useState("");
  const [groupFile, setGroupFile] = useState(null);
  const [groupTypingUsers, setGroupTypingUsers] = useState({}); // { groupId: [{senderId,senderName}] }
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupSearch, setNewGroupSearch] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState([]); // array of user objects
  const [groupCreating, setGroupCreating] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [groupMemberSearch, setGroupMemberSearch] = useState("");
  const groupMenuRef = useRef(null);
  const groupFileRef = useRef(null);
  const groupTypingTimeoutRef = useRef(null);
  const activeGroupRef = useRef(null);

  // DM state
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [dmInput, setDmInput] = useState("");
  const [dmFile, setDmFile] = useState(null);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [convFilter, setConvFilter] = useState("all"); // "all" | "unread" | "recent"

  // ── Per-message actions (reply / menu / pin / remove / forward) ──
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const [openMsgMenuId, setOpenMsgMenuId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null); // { id, sender_name, content, file_name }
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [forwardingMsg, setForwardingMsg] = useState(null); // message being forwarded
  const [editingMsgId, setEditingMsgId] = useState(null); // id of message currently being edited
  const [editInput, setEditInput] = useState("");
  const [now, setNow] = useState(() => Date.now()); // ticks so the edit window expires live in the UI
  const msgMenuRef = useRef(null);
  const editInputRef = useRef(null);

  // Document chat state
  const [documents, setDocuments] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [docComments, setDocComments] = useState([]);
  const [docInput, setDocInput] = useState("");
  const [docFile, setDocFile] = useState(null);

  // ── Call state ────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState(null);
  // callState: null | { type: "outgoing"|"incoming"|"active", callType: "audio"|"video", with: userObj }
  const [callMuted, setCallMuted] = useState(false);
  const [callCamOff, setCallCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null); // user-facing error string

  // ── Chat settings / profile drawer ──
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [convPrefs, setConvPrefs] = useState({}); // { [userId]: { pinned, muted, notifications, muteDuration, theme } }
  const [hoveredConvId, setHoveredConvId] = useState(null);
  const [menuOpenConvId, setMenuOpenConvId] = useState(null);
  const convMenuRef = useRef(null);
  const chatMenuBtnRef = useRef(null);
  const callTimerRef = useRef(null);
  const callStartTimeRef = useRef(null);

  // WebRTC refs
  const pcRef = useRef(null);              // RTCPeerConnection
  const localStreamRef = useRef(null);     // local MediaStream
  const localVideoRef = useRef(null);      // <video> for local feed
  const remoteVideoRef = useRef(null);     // <video> for remote video feed
  const remoteAudioRef = useRef(null);     // <audio> always mounted — catches remote audio reliably
  const pendingCandidatesRef = useRef([]); // ICE candidates queued before remote desc is set

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dmFileRef = useRef(null);
  const docFileRef = useRef(null);

  // The receive_message socket handler below is set up once on mount, so it
  // can't read activeConv directly (it would only ever see the value from
  // that first render). Keep it in a ref that's always current instead.
  const activeConvRef = useRef(null);
  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);
  useEffect(() => { activeGroupRef.current = activeGroup; }, [activeGroup]);

  // callStateRef keeps callState accessible from inside socket callbacks
  // (which close over the mount-time value of callState) without stale closures.
  const callStateRef = useRef(null);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  // ── Socket setup ─────────────────────────────────────────────────────────────
  // Uses the single shared socket (./socket) that TopBar and the rest of the
  // app also use — NOT a separate io() connection. A second, independent
  // connection here used to fight the shared one for the server's "which
  // socket does this user's messages go to" mapping, so events like
  // receive_message would land on whichever connection registered last —
  // sometimes this page, sometimes not — which is why live messages could
  // silently stop appearing here. Sharing one connection fixes that.
  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    connectSocket();

    const onConnect = () => { socket.emit("register", currentUser.id); };
    socket.on("connect", onConnect);
    // The shared socket may already be connected (e.g. TopBar connected it
    // first) — in that case "connect" won't fire again, so register now too.
    if (socket.connected) onConnect();

    socket.on("online_users", (ids) => setOnlineUserIds(ids.map(String)));

    const onReceiveMessage = (msg) => {
      // Only render this message into the open thread if it actually
      // belongs to that conversation — otherwise a message from someone
      // else leaks into whatever chat you currently have open.
      const conv = activeConvRef.current;
      const belongsToActiveConv = conv && (
        String(msg.sender_id) === String(conv.id) ||
        String(msg.receiver_id) === String(conv.id)
      );
      if (belongsToActiveConv) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
      // Pin/unpin notices piggyback their pin-state change on this same,
      // already-reliable channel (rather than a bespoke socket event the
      // server may not relay) so the other participant's pin indicator and
      // "Pinned messages" count update instantly, not just on next refetch.
      if (msg.pin_sync) {
        const { messageId, is_pinned, pinned_by, pinned_by_name } = msg.pin_sync;
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_pinned, pinned_by, pinned_by_name } : m));
      }
      setConversations(prev => prev.map(c =>
        c.id === msg.sender_id || c.id === msg.receiver_id
          ? { ...c, last_message: msg.content || "📎 File", last_time: msg.created_at }
          : c
      ));
      fetchUnreadCount();
    };
    socket.on("receive_message", onReceiveMessage);

    const onMessageEdited = ({ messageId, content }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content, is_edited: true, edited_at: new Date().toISOString() } : m));
    };
    socket.on("message_edited", onMessageEdited);

    const onReceiveDocComment = (comment) => {
      setDocComments(prev => {
        if (prev.find(c => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    };
    socket.on("receive_document_comment", onReceiveDocComment);

    const onUserTyping = ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(true);
    };
    const onUserStopTyping = ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(false);
    };
    socket.on("user_typing", onUserTyping);
    socket.on("user_stop_typing", onUserStopTyping);

    const onMessagesSeen = () => {
      setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
    };
    socket.on("messages_seen", onMessagesSeen);

    // ── WebRTC Signaling ─────────────────────────────────────────────────────
    // Callee receives offer → show incoming UI, store offer for later
    const onCallOffer = ({ from, callType, sdp }) => {
      setCallState({ type: "incoming", callType, with: from, remoteSdp: sdp });
    };
    socket.on("call_offer", onCallOffer);

    // Caller receives answer → set remote description, go active
    const onCallAnswer = async ({ sdp }) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
        // Flush any queued ICE candidates
        for (const c of pendingCandidatesRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
        }
        pendingCandidatesRef.current = [];
        setCallState(prev => prev ? { ...prev, type: "active" } : prev);
        callStartTimeRef.current = Date.now(); // ← track when call became active
        // Now the call is truly connected — send the system message
        const prev = callStateRef.current;
        if (prev?.with?.id) {
          const label = prev.callType === "video" ? "📹 Video call" : "📞 Audio call";
          sendSystemMessage(prev.with.id, `${label} started`);
        }
      } catch (e) { console.error("set remote answer:", e); }
    };
    socket.on("call_answer", onCallAnswer);

    // Both sides receive ICE candidates from the other peer
    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };
    socket.on("ice_candidate", onIceCandidate);

    const onCallRejected = () => {
      // Read state from ref (not from updater) so the side effect is clean
      const prev = callStateRef.current;
      if (prev?.with?.id) {
        const label = prev.callType === "video" ? "📹 Video call" : "📞 Audio call";
        sendSystemMessage(prev.with.id, `${label} · No answer`);
      }
      endCallCleanup();
    };
    socket.on("call_rejected", onCallRejected);

    const onCallEnded = () => {
      const prev = callStateRef.current;
      if (prev?.with?.id) {
        if (prev.type === "active" && callStartTimeRef.current) {
          const secs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          const mins = Math.floor(secs / 60);
          const remainSecs = secs % 60;
          const duration = mins > 0 ? `${mins}m ${remainSecs}s` : `${remainSecs}s`;
          const label = prev.callType === "video" ? "📹 Video call" : "📞 Audio call";
          sendSystemMessage(prev.with.id, `${label} ended · ${duration}`);
        }
      }
      endCallCleanup();
    };
    socket.on("call_ended", onCallEnded);

    // ── Group chat socket listeners ─────────────────────────────────────────
    const onReceiveGroupMessage = ({ groupId, message }) => {
      const activeGrp = activeGroupRef.current;
      if (activeGrp && String(activeGrp.id) === String(groupId)) {
        setGroupMessages(prev => {
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
      // Update last message preview in groups list
      setGroups(prev => prev.map(g =>
        String(g.id) === String(groupId)
          ? { ...g, last_message: message.content || "📎 File", last_time: message.created_at, last_sender_id: message.sender_id, last_sender_name: message.sender_name, unread_count: activeGrp && String(activeGrp.id) === String(groupId) ? 0 : (g.unread_count || 0) + 1 }
          : g
      ));
    };
    socket.on("receive_group_message", onReceiveGroupMessage);

    const onGroupUserTyping = ({ groupId, senderId, senderName }) => {
      setGroupTypingUsers(prev => {
        const existing = prev[groupId] || [];
        if (existing.find(u => String(u.senderId) === String(senderId))) return prev;
        return { ...prev, [groupId]: [...existing, { senderId, senderName }] };
      });
    };
    socket.on("group_user_typing", onGroupUserTyping);

    const onGroupUserStopTyping = ({ groupId, senderId }) => {
      setGroupTypingUsers(prev => ({
        ...prev,
        [groupId]: (prev[groupId] || []).filter(u => String(u.senderId) !== String(senderId))
      }));
    };
    socket.on("group_user_stop_typing", onGroupUserStopTyping);

    // Only remove the listeners this effect added — never disconnect the
    // shared socket, since TopBar and other pages still depend on it.
    return () => {
      socket.off("connect", onConnect);
      socket.off("online_users");
      socket.off("receive_message", onReceiveMessage);
      socket.off("message_edited", onMessageEdited);
      socket.off("receive_document_comment", onReceiveDocComment);
      socket.off("user_typing", onUserTyping);
      socket.off("user_stop_typing", onUserStopTyping);
      socket.off("messages_seen", onMessagesSeen);
      socket.off("call_offer", onCallOffer);
      socket.off("call_answer", onCallAnswer);
      socket.off("ice_candidate", onIceCandidate);
      socket.off("call_rejected", onCallRejected);
      socket.off("call_ended", onCallEnded);
      socket.off("receive_group_message", onReceiveGroupMessage);
      socket.off("group_user_typing", onGroupUserTyping);
      socket.off("group_user_stop_typing", onGroupUserStopTyping);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.off("user_typing");
    socket.off("user_stop_typing");
    socket.on("user_typing", ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(true);
    });
    socket.on("user_stop_typing", ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(false);
    });
  }, [activeConv, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, docComments, otherTyping]);

  useEffect(() => { fetchConversations(); fetchAllUsers(); fetchUnreadCount(); fetchDocuments(); fetchGroups(); }, []);

  // ── Arriving from TopBar's bottom-right "new message" popup ───────────────
  // TopBar navigates here with { openConversationId } in nav state when the
  // popup is clicked. Wait for allUsers to load so the opened conversation
  // has full profile info (name/photo), then clear the state so this doesn't
  // re-fire on a later re-render or back/forward navigation.
  useEffect(() => {
    const targetId = location.state?.openConversationId;
    if (!targetId || allUsers.length === 0) return;
    const target =
      conversations.find(c => String(c.id) === String(targetId)) ||
      allUsers.find(u => String(u.id) === String(targetId)) ||
      { id: targetId };
    openConversation(target);
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, allUsers]);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Close the profile/settings drawer on Escape ──
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setShowProfileDrawer(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // ── Tick every 15s so "can this message still be edited?" stays accurate ──
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // ── Close the per-message action menu when clicking outside it ──
  useEffect(() => {
    if (!openMsgMenuId) return;
    function handleClickOutside(e) {
      if (msgMenuRef.current && !msgMenuRef.current.contains(e.target)) {
        setOpenMsgMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMsgMenuId]);

  // ── Close the conversation 3-dot menu when clicking outside it ──
  useEffect(() => {
    if (!menuOpenConvId) return;
    function handleClickOutside(e) {
      if (convMenuRef.current && !convMenuRef.current.contains(e.target)) {
        setMenuOpenConvId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenConvId]);

  // ── Close the group 3-dot menu when clicking outside it ──
  useEffect(() => {
    if (!showGroupMenu) return;
    function handleClickOutside(e) {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setShowGroupMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showGroupMenu]);

  // ── Per-message action handlers ──
  const handleRemoveMessage = (msg) => {
    if (!window.confirm("Remove this message?")) return;
    setMessages(prev => prev.filter(m => m.id !== msg.id));
    setOpenMsgMenuId(null);
  };

  const togglePinMessage = async (msg) => {
    const wasPinned = !!msg.is_pinned;
    setOpenMsgMenuId(null);

    // Optimistic update — flips immediately, corrected/rolled back below.
    setMessages(prev => prev.map(m => m.id === msg.id
      ? { ...m, is_pinned: wasPinned ? 0 : 1, pinned_by: wasPinned ? null : currentUser.id, pinned_by_name: wasPinned ? null : (currentUser.full_name || currentUser.username) }
      : m
    ));

    try {
      const res = await fetch(`${API}/api/chat/messages/${msg.id}/pin`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("pin request failed");
      const updated = await res.json();

      // Reconcile with the server's copy (it's the source of truth).
      setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));

      // Inline system notice, persisted like the call-event messages so it
      // survives a refresh — and carries the pin-state change itself
      // (pin_sync) so the other participant's indicator/count update the
      // instant this arrives, over the same channel normal messages use.
      if (activeConv) {
        const actorName = currentUser.full_name || currentUser.username || "Someone";
        const label = updated.is_pinned ? "pinned a message" : "unpinned a message";
        sendSystemMessage(activeConv.id, `📌 ${actorName} ${label}`, {
          pin_sync: {
            messageId: updated.id,
            is_pinned: updated.is_pinned,
            pinned_by: updated.pinned_by,
            pinned_by_name: updated.pinned_by_name,
          },
        });
      }
    } catch (e) {
      console.error("togglePinMessage:", e);
      // Roll back the optimistic flip.
      setMessages(prev => prev.map(m => m.id === msg.id
        ? { ...m, is_pinned: wasPinned ? 1 : 0, pinned_by: wasPinned ? msg.pinned_by : null, pinned_by_name: wasPinned ? msg.pinned_by_name : null }
        : m
      ));
    }
  };

  const startReplyToMessage = (msg) => {
    setReplyingTo(msg);
    setOpenMsgMenuId(null);
  };

  // Only the sender can edit, and only within EDIT_WINDOW_MS of sending.
  const canEditMessage = (msg) => {
    if (!msg || msg.is_system || msg.file_url) return false;
    if (String(msg.sender_id) !== String(currentUser.id)) return false;
    const sentAt = new Date(msg.created_at).getTime();
    if (Number.isNaN(sentAt)) return false;
    return now - sentAt < EDIT_WINDOW_MS;
  };

  const startEditMessage = (msg) => {
    if (!canEditMessage(msg)) return;
    const { text } = parseReplyContent(msg.content);
    setEditingMsgId(msg.id);
    setEditInput(text || "");
    setOpenMsgMenuId(null);
    // Focus the edit field once it mounts
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const cancelEditMessage = () => {
    setEditingMsgId(null);
    setEditInput("");
  };

  const saveEditMessage = async (msg) => {
    const trimmed = editInput.trim();
    if (!trimmed) { cancelEditMessage(); return; }
    if (!canEditMessage(msg)) {
      // Window expired while the user was typing — silently discard.
      cancelEditMessage();
      return;
    }
    // Preserve any reply-quote metadata embedded in the original content.
    const { replyMeta } = parseReplyContent(msg.content);
    const newContent = replyMeta ? buildReplyContent(replyMeta, trimmed) : trimmed;

    // Optimistic local update
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: newContent, is_edited: true, edited_at: new Date().toISOString() } : m));
    cancelEditMessage();

    try {
      const res = await fetch(`${API}/api/chat/messages/${msg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newContent }),
      });
      if (res.ok) {
        socket?.emit("edit_message", {
          messageId: msg.id,
          senderId: currentUser.id,
          receiverId: activeConv?.id,
          content: newContent,
        });
      }
    } catch (e) {
      console.error("saveEditMessage:", e);
    }
  };

  const startForwardMessage = (msg) => {
    setForwardingMsg(msg);
    setOpenMsgMenuId(null);
  };

  const sendForward = async (toUser) => {
    if (!forwardingMsg || !toUser) return;
    const fd = new FormData();
    const { text: forwardText } = parseReplyContent(forwardingMsg.content);
    if (forwardText) fd.append("content", forwardText);
    if (forwardingMsg.file_url) {
      // Re-attach the original file by fetching it, then forwarding as a new upload
      try {
        const fileRes = await fetch(resolveUrl(forwardingMsg.file_url));
        const blob = await fileRes.blob();
        fd.append("file", blob, forwardingMsg.file_name || "file");
      } catch (e) { console.error("sendForward file fetch:", e); }
    }
    const res = await fetch(`${API}/api/chat/messages/${toUser.id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const msg = await res.json();
      socket?.emit("send_message", { senderId: currentUser.id, receiverId: toUser.id, message: msg });
      if (activeConv && String(activeConv.id) === String(toUser.id)) {
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      }
    }
    setForwardingMsg(null);
  };

  const DEFAULT_CONV_PREFS = { pinned: false, muted: false, notifications: true, muteDuration: "off", theme: "lavender" };
  const currentPrefs = (activeConv && convPrefs[activeConv.id]) || DEFAULT_CONV_PREFS;
  const updateConvPrefs = (patch) => {
    if (!activeConv) return;
    setConvPrefs(prev => ({ ...prev, [activeConv.id]: { ...(prev[activeConv.id] || DEFAULT_CONV_PREFS), ...patch } }));
  };

  // ── Chat settings action handler (used by the profile/settings drawer) ──
  const handleChatMenuAction = async (actionId) => {
    if (!activeConv) return;
    switch (actionId) {
      case "view_profile":
      case "view_faculty_info":
      case "view_department":
        setShowProfileDrawer(true);
        break;
      case "search_messages":
        setMessageSearchOpen(true);
        break;
      case "pinned_messages":
        setShowPinnedMessages(true);
        setShowProfileDrawer(false);
        break;
      case "pin":
        updateConvPrefs({ pinned: !currentPrefs.pinned });
        break;
      case "mute":
        updateConvPrefs({ muted: !currentPrefs.muted, muteDuration: !currentPrefs.muted ? "forever" : "off" });
        break;
      case "mark_unread":
        try {
          const res = await fetch(`${API}/api/chat/messages/${activeConv.id}/mark-unread`, { method: "PATCH", headers: authHeaders });
          if (res.ok) {
            const { marked } = await res.json();
            setConversations(prev => prev.map(c => (c.id === activeConv.id ? { ...c, unread_count: marked ? 1 : (c.unread_count || 1) } : c)));
          }
        } catch (e) { console.error("mark_unread:", e); }
        // Mirrors how opening a conversation clears unread state — leaving it
        // marks the conversation unread again in the sidebar until reopened.
        setActiveConv(null);
        setShowProfileDrawer(false);
        break;
      case "clear_chat":
        if (window.confirm(`Clear chat history with ${activeConv.full_name}? This cannot be undone.`)) {
          try {
            const res = await fetch(`${API}/api/chat/messages/${activeConv.id}/clear`, { method: "DELETE", headers: authHeaders });
            if (res.ok) {
              setMessages([]);
              setConversations(prev => prev.map(c => (c.id === activeConv.id ? { ...c, last_message: "", last_time: null, unread_count: 0 } : c)));
            }
          } catch (e) { console.error("clear_chat:", e); }
        }
        break;
      case "activity_log":
        // TODO: point this at the real admin activity-log route
        navigate(`/admin/activity-log/${activeConv.id}`);
        break;
      case "disable_chat":
        if (window.confirm(`Disable chat access for ${activeConv.full_name}?`)) {
          try {
            await fetch(`${API}/api/chat/disable-access/${activeConv.id}`, { method: "POST", headers: authHeaders });
          } catch (e) { console.error("disable_chat:", e); }
        }
        break;
      case "archive":
        try {
          await fetch(`${API}/api/chat/conversations/${activeConv.id}/archive`, { method: "POST", headers: authHeaders });
        } catch (e) { console.error("archive:", e); }
        setConversations(prev => prev.filter(c => c.id !== activeConv.id));
        setActiveConv(null);
        break;
      default:
        break;
    }
  };

  // ── Per-conversation 3-dot menu actions (works for any conv row, not just active) ──
  const handleConvRowAction = async (action, conv, e) => {
    e.stopPropagation();
    setMenuOpenConvId(null);
    if (action === "archive") {
      try {
        await fetch(`${API}/api/chat/conversations/${conv.id}/archive`, { method: "POST", headers: authHeaders });
      } catch (err) { console.error("conv archive:", err); }
      setConversations(prev => prev.filter(c => c.id !== conv.id));
      if (activeConv?.id === conv.id) setActiveConv(null);
    } else if (action === "delete") {
      if (!window.confirm(`Delete conversation with ${conv.full_name}? This cannot be undone.`)) return;
      try {
        await fetch(`${API}/api/chat/messages/${conv.id}/clear`, { method: "DELETE", headers: authHeaders });
      } catch (err) { console.error("conv delete:", err); }
      setConversations(prev => prev.filter(c => c.id !== conv.id));
      if (activeConv?.id === conv.id) { setActiveConv(null); setMessages([]); }
    }
  };

  const fetchConversations = async () => {
    const res = await fetch(`${API}/api/chat/conversations`, { headers: authHeaders });
    if (res.ok) setConversations(await res.json());
  };

  const fetchAllUsers = async () => {
    const res = await fetch(`${API}/api/chat/users`, { headers: authHeaders });
    if (res.ok) setAllUsers(await res.json());
  };

  const fetchUnreadCount = async () => {
    const res = await fetch(`${API}/api/chat/unread-count`, { headers: authHeaders });
    if (res.ok) { const d = await res.json(); setUnreadTotal(d.count); }
  };

  const fetchDocuments = async () => {
    const res = await fetch(`${API}/api/documents`, { headers: authHeaders });
    if (res.ok) setDocuments(await res.json());
  };

  // ── Group chat helpers ─────────────────────────────────────────────────────
  const fetchGroups = async () => {
    const res = await fetch(`${API}/api/chat/groups`, { headers: authHeaders });
    if (res.ok) setGroups(await res.json());
  };

  const openGroup = async (group) => {
    setActiveGroup(group);
    setActiveConv(null);
    setActiveDoc(null);
    setShowGroupInfo(false);
    setGroupInput("");
    setGroupFile(null);
    socket?.emit("join_group", group.id);
    const res = await fetch(`${API}/api/chat/groups/${group.id}/messages`, { headers: authHeaders });
    if (res.ok) {
      const msgs = await res.json();
      setGroupMessages(msgs);
      // Clear unread for this group
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, unread_count: 0 } : g));
    }
  };

  const sendGroupMessage = async () => {
    if (!activeGroup || (!groupInput.trim() && !groupFile)) return;
    const fd = new FormData();
    if (groupInput.trim()) fd.append("content", groupInput.trim());
    if (groupFile) fd.append("file", groupFile);
    setGroupInput("");
    setGroupFile(null);
    if (groupFileRef.current) groupFileRef.current.value = "";
    // Stop typing
    socket?.emit("group_stop_typing", { groupId: activeGroup.id, senderId: currentUser.id });
    const res = await fetch(`${API}/api/chat/groups/${activeGroup.id}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const msg = await res.json();
      setGroupMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
      socket?.emit("send_group_message", { groupId: activeGroup.id, message: msg });
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, last_message: msg.content || "📎 File", last_time: msg.created_at, last_sender_id: msg.sender_id } : g));
    }
  };

  const handleGroupInput = (val) => {
    setGroupInput(val);
    if (!activeGroup) return;
    socket?.emit("group_typing", { groupId: activeGroup.id, senderId: currentUser.id, senderName: currentUser.full_name || currentUser.username });
    clearTimeout(groupTypingTimeoutRef.current);
    groupTypingTimeoutRef.current = setTimeout(() => {
      socket?.emit("group_stop_typing", { groupId: activeGroup.id, senderId: currentUser.id });
    }, 1500);
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    setGroupCreating(true);
    try {
      const res = await fetch(`${API}/api/chat/groups`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName.trim(), description: newGroupDesc.trim(), memberIds: newGroupMembers.map(u => u.id) }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        setGroups(prev => [newGroup, ...prev]);
        socket?.emit("join_group", newGroup.id);
        setShowNewGroup(false);
        setNewGroupName(""); setNewGroupDesc(""); setNewGroupSearch(""); setNewGroupMembers([]);
        setTab("groups");
        openGroup(newGroup);
      }
    } finally { setGroupCreating(false); }
  };

  const leaveGroup = async (group) => {
    if (!window.confirm(`Leave "${group.name}"?`)) return;
    await fetch(`${API}/api/chat/groups/${group.id}/members/${currentUser.id}`, { method: "DELETE", headers: authHeaders });
    socket?.emit("leave_group", group.id);
    setGroups(prev => prev.filter(g => g.id !== group.id));
    if (activeGroup?.id === group.id) { setActiveGroup(null); setGroupMessages([]); }
  };

  const deleteGroup = async (group) => {
    if (!window.confirm(`Delete "${group.name}" permanently? This cannot be undone.`)) return;
    const res = await fetch(`${API}/api/chat/groups/${group.id}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) {
      socket?.emit("leave_group", group.id);
      setGroups(prev => prev.filter(g => g.id !== group.id));
      if (activeGroup?.id === group.id) { setActiveGroup(null); setGroupMessages([]); }
    }
  };

  const archiveGroup = (group) => {
    // Client-side archive: just remove from the list (same as leave for non-admins)
    setGroups(prev => prev.filter(g => g.id !== group.id));
    if (activeGroup?.id === group.id) { setActiveGroup(null); setGroupMessages([]); }
  };

  const addGroupMember = async (user) => {
    if (!activeGroup) return;
    const res = await fetch(`${API}/api/chat/groups/${activeGroup.id}/members`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      // Refresh group info to get updated members list
      const infoRes = await fetch(`${API}/api/chat/groups/${activeGroup.id}`, { headers: authHeaders });
      if (infoRes.ok) {
        const updated = await infoRes.json();
        setActiveGroup(updated);
        setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, members: updated.members } : g));
      }
      setGroupMemberSearch("");
      socket?.emit("join_group", activeGroup.id); // make sure new member's socket joins when they connect
    }
  };

  const removeGroupMember = async (memberId) => {
    if (!activeGroup) return;
    if (!window.confirm("Remove this member from the group?")) return;
    const res = await fetch(`${API}/api/chat/groups/${activeGroup.id}/members/${memberId}`, { method: "DELETE", headers: authHeaders });
    if (res.ok) {
      setActiveGroup(prev => prev ? { ...prev, members: prev.members.filter(m => m.user_id !== memberId) } : prev);
      setGroups(prev => prev.map(g => g.id === activeGroup.id ? { ...g, members: (g.members || []).filter(m => m.user_id !== memberId) } : g));
    }
  };

  const openConversation = async (user) => {
    // Conversation-list items are a lightweight preview (id, name, photo, last message, etc.)
    // and may be missing full profile fields like position/email/contact. Merge in the
    // complete record from allUsers (when we have it) so the settings panel always reflects
    // this user's real info instead of falling back to "—".
    const fullProfile = allUsers.find(u => String(u.id) === String(user.id));
    const merged = fullProfile ? { ...fullProfile, ...user } : user;

    setActiveConv(merged);
    setShowProfileDrawer(false);
    setMessageSearchOpen(false);
    setMessageSearchQuery("");
    setShowNewChat(false);
    setOtherTyping(false);
    const res = await fetch(`${API}/api/chat/messages/${user.id}`, { headers: authHeaders });
    if (res.ok) {
      const msgs = await res.json();
      setMessages(msgs);
      socket?.emit("messages_read", { readerId: currentUser.id, senderId: user.id });
      setConversations(prev => prev.map(c => c.id === user.id ? { ...c, unread_count: 0 } : c));
      fetchUnreadCount();
      setConversations(prev => prev.find(c => c.id === user.id) ? prev : [{ ...merged, unread_count: 0, last_message: "", last_time: null }, ...prev]);
    }
  };

  const sendDm = async () => {
    if (!activeConv || (!dmInput.trim() && !dmFile)) return;
    const fd = new FormData();
    let content = dmInput.trim();
    if (replyingTo) {
      const { text: originalText } = parseReplyContent(replyingTo.content);
      const quotedSnippet = (originalText || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : "")).slice(0, 140);
      const quotedSenderId = replyingTo.sender_id;
      const quotedName = String(quotedSenderId) === String(currentUser.id)
        ? (currentUser.full_name || currentUser.username || "You")
        : (replyingTo.sender_name || activeConv.full_name);
      content = buildReplyContent({ name: quotedName, senderId: quotedSenderId, snippet: quotedSnippet }, content);
    }
    if (content) fd.append("content", content);
    if (dmFile) fd.append("file", dmFile);
    const res = await fetch(`${API}/api/chat/messages/${activeConv.id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const msg = await res.json();
      socket?.emit("send_message", { senderId: currentUser.id, receiverId: activeConv.id, message: msg });
      setDmInput(""); setDmFile(null);
      setReplyingTo(null);
      if (dmFileRef.current) dmFileRef.current.value = "";
      socket?.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConv.id });
    }
  };

  const handleDmInput = (val) => {
    setDmInput(val);
    if (!typing) {
      setTyping(true);
      socket?.emit("typing", { senderId: currentUser.id, receiverId: activeConv?.id });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket?.emit("stop_typing", { senderId: currentUser.id, receiverId: activeConv?.id });
    }, 1500);
  };

  const openDocChat = async (doc) => {
    if (activeDoc) socket?.emit("leave_document", activeDoc.id);
    setActiveDoc(doc);
    socket?.emit("join_document", doc.id);
    const res = await fetch(`${API}/api/chat/document/${doc.id}/comments`, { headers: authHeaders });
    if (res.ok) setDocComments(await res.json());
  };

  const sendDocComment = async () => {
    if (!activeDoc || (!docInput.trim() && !docFile)) return;
    const fd = new FormData();
    if (docInput.trim()) fd.append("content", docInput.trim());
    if (docFile) fd.append("file", docFile);
    const res = await fetch(`${API}/api/chat/document/${activeDoc.id}/comments`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const comment = await res.json();
      socket?.emit("send_document_comment", { docId: activeDoc.id, comment });
      setDocInput(""); setDocFile(null);
      if (docFileRef.current) docFileRef.current.value = "";
    }
  };

  // ── WebRTC helpers ────────────────────────────────────────────────────────
  // ICE servers: STUN for address discovery + free TURN relays so calls work
  // behind symmetric NAT (common in university/corporate networks).
  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // Free public TURN relays (metered.ca) — covers NAT traversal failures
      { urls: "turn:a.relay.metered.ca:80",  username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:a.relay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:a.relay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    ]
  };

  const createPeerConnection = (toId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    pendingCandidatesRef.current = [];

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) socket?.emit("ice_candidate", { to: toId, candidate });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      // Always pipe into the always-mounted <audio> — fires before overlay is in DOM
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
      // Also pipe into <video> for video calls if already mounted
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) endCallCleanup();
    };

    return pc;
  };

  const getUserMedia = async (callType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  // ── Send a system/call event message into the chat ───────────────────────
  // `extra` is merged onto the message object emitted over the socket only
  // (never persisted) — used e.g. by pin/unpin notices to piggyback the
  // pin-state change onto this already-reliable channel.
  const sendSystemMessage = async (receiverId, content, extra = {}) => {
    try {
      const fd = new FormData();
      fd.append("content", content);
      fd.append("is_system", "1");
      const res = await fetch(`${API}/api/chat/messages/${receiverId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => prev.find(m => m.id === msg.id) ? prev : [...prev, msg]);
        socket?.emit("send_message", { senderId: currentUser.id, receiverId, message: { ...msg, ...extra } });
      }
    } catch (e) { console.error("sendSystemMessage:", e); }
  };

  const startCall = async (callType) => {
    if (!activeConv || !socket) return;
    setCallError(null);
    try {
      const stream = await getUserMedia(callType);
      const pc = createPeerConnection(activeConv.id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_offer", {
        to: activeConv.id,
        from: { id: currentUser.id, full_name: currentUser.full_name || currentUser.username, department: currentUser.department },
        callType,
        sdp: offer.sdp,
      });

      setCallState({ type: "outgoing", callType, with: activeConv });
      setCallMuted(false); setCallCamOff(false); setCallDuration(0);
      // System message is sent only once the callee answers (in onCallAnswer)
    } catch (e) {
      console.error("startCall:", e);
      const msg = e?.name === "NotAllowedError"
        ? "Microphone/camera access was denied. Please allow access and try again."
        : e?.name === "NotFoundError"
        ? "No microphone or camera found. Please check your devices."
        : "Could not start call. Please check your devices and try again.";
      setCallError(msg);
      endCallCleanup();
    }
  };

  const answerCall = async () => {
    if (!callState?.remoteSdp || !socket) return;
    setCallError(null);
    try {
      const stream = await getUserMedia(callState.callType);
      const pc = createPeerConnection(callState.with.id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: callState.remoteSdp }));

      // Flush any ICE candidates that arrived before we set remote desc
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => { });
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call_answer", { to: callState.with.id, sdp: answer.sdp });

      setCallState(prev => ({ ...prev, type: "active" }));
      setCallMuted(false); setCallCamOff(false); setCallDuration(0);
      callStartTimeRef.current = Date.now();
    } catch (e) {
      console.error("answerCall:", e);
      const msg = e?.name === "NotAllowedError"
        ? "Microphone/camera access was denied. Please allow access and try again."
        : e?.name === "NotFoundError"
        ? "No microphone or camera found. Please check your devices."
        : "Could not answer call. Please check your devices and try again.";
      setCallError(msg);
      endCallCleanup();
    }
  };

  const rejectCall = () => {
    const otherId = callState?.with?.id;
    socket?.emit("call_rejected", { to: otherId });
    if (otherId) sendSystemMessage(otherId, `📵 Call declined by ${currentUser.full_name || currentUser.username}`);
    endCallCleanup();
  };

  const endCall = () => {
    const otherId = callState?.with?.id;
    const callType = callState?.callType;
    const wasActive = callState?.type === "active";
    socket?.emit("call_ended", { to: otherId });

    if (otherId) {
      if (wasActive && callStartTimeRef.current) {
        // calculate duration
        const secs = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        const mins = Math.floor(secs / 60);
        const remainSecs = secs % 60;
        const duration = mins > 0
          ? `${mins}m ${remainSecs}s`
          : `${remainSecs}s`;
        const label = callType === "video" ? "📹 Video call" : "📞 Audio call";
        sendSystemMessage(otherId, `${label} ended · ${duration}`);
      } else {
        // caller cancelled before answer
        const label = callType === "video" ? "📹 Video call" : "📞 Audio call";
        sendSystemMessage(otherId, `${label} cancelled`);
      }
    }
    endCallCleanup();
  };

  const endCallCleanup = () => {
    // Stop all local tracks
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    // Close peer connection
    pcRef.current?.close();
    pcRef.current = null;
    // Clear video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
    callStartTimeRef.current = null;
    // Reset UI state
    setCallState(null);
    setCallDuration(0);
    setCallMuted(false);
    setCallCamOff(false);
    clearInterval(callTimerRef.current);
    // Don't clear callError here — keep the message visible until user dismisses
  };

  // Mute toggle: disable/enable audio tracks on the live stream
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const enabled = callMuted; // currently muted → we want to unmute
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = enabled; });
    setCallMuted(!enabled);
  };

  // Camera toggle: disable/enable video tracks
  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    const enabled = callCamOff; // cam is off → turn on
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = enabled; });
    setCallCamOff(!enabled);
  };

  // Attach local stream to video element once the active-call overlay mounts
  useEffect(() => {
    if (callState?.type !== "active") return;
    // Re-attach local stream to local <video> (pip)
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    // Re-attach remote stream to <video> in case ontrack fired before overlay mounted
    const remoteStream = remoteAudioRef.current?.srcObject;
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [callState?.type]);

  useEffect(() => {
    if (callState?.type === "active") {
      callTimerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState?.type]);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleKey = (e, sendFn) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendFn(); }
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Users not yet in the new group member list (for group creation picker)
  const newGroupFilteredUsers = allUsers.filter(u =>
    !newGroupMembers.find(m => m.id === u.id) && (
      u.full_name.toLowerCase().includes(newGroupSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(newGroupSearch.toLowerCase())
    )
  );

  const displayName = currentUser.username || "User";

  // ── Conversation list: search + filter pills (layout helpers) ──
  const visibleConversations = conversations
    .filter(c => !convSearch.trim() || c.full_name?.toLowerCase().includes(convSearch.trim().toLowerCase()))
    .filter(c => convFilter !== "unread" || c.unread_count > 0)
    .filter(c => convFilter !== "recent" || (c.last_time && (Date.now() - new Date(c.last_time)) < 86400000));

  // ── Group list: search filter ──
  const visibleGroups = groups.filter(g =>
    !convSearch.trim() || g.name?.toLowerCase().includes(convSearch.trim().toLowerCase())
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="path-inbox-app" style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

        /* ── Themed scrollbars ── */
        .path-inbox-app * {
          scrollbar-width: thin;                              /* Firefox */
          scrollbar-color: rgba(124,58,237,0.35) transparent; /* Firefox: thumb track */
        }
        .path-inbox-app *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .path-inbox-app *::-webkit-scrollbar-track {
          background: transparent;
        }
        .path-inbox-app *::-webkit-scrollbar-thumb {
          background-color: rgba(124,58,237,0.35);
          border-radius: 8px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .path-inbox-app *::-webkit-scrollbar-thumb:hover {
          background-color: rgba(124,58,237,0.6);
          background-clip: padding-box;
        }
        .path-inbox-app *::-webkit-scrollbar-corner {
          background: transparent;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "white" }}>

        {/* ── Inbox Body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── Left sidebar: conversation list ── */}
          <div style={{ width: 320, borderRight: "0.5px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", background: "white" }}>

            {/* Header */}
            <div style={{ padding: "16px 16px 12px", borderBottom: "0.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontWeight: "bold", fontSize: 17, color: "#181445" }}>
                  Messages
                  {unreadTotal > 0 && (
                    <span style={{ marginLeft: 8, background: "#7c3aed", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: "bold" }}>
                      {unreadTotal}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => tab === "groups" ? setShowNewGroup(true) : setShowNewChat(true)}
                  title={tab === "groups" ? "New group" : "New message"}
                  style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#494454" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#e9e5ff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {tab === "groups"
                    ? <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18"><path d="M10 4v12M4 10h12" /></svg>
                    : <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="16" cy="10" r="1.6" /></svg>
                  }
                </button>
              </div>

              {/* Tab bar: DM / Groups / Documents */}
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {[{ id: "dm", label: "Direct" }, { id: "groups", label: "Groups" }].map(t => (
                  <button key={t.id} onClick={() => { setTab(t.id); setActiveConv(null); setActiveDoc(null); setActiveGroup(null); }}
                    style={{
                      flex: 1, padding: "6px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                      fontSize: 12, fontWeight: 600,
                      background: tab === t.id ? "#6b38d4" : "transparent",
                      color: tab === t.id ? "white" : "#7b7486",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = "#f0ebff"; }}
                    onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = "transparent"; }}
                  >
                    {t.label}
                    {t.id === "groups" && groups.reduce((s, g) => s + (g.unread_count || 0), 0) > 0 && (
                      <span style={{ marginLeft: 5, background: "#ef4444", color: "white", borderRadius: 20, padding: "0 5px", fontSize: 9, fontWeight: 700 }}>
                        {groups.reduce((s, g) => s + (g.unread_count || 0), 0)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div style={{ position: "relative", background: "#f6f2ff", borderRadius: 10, border: "1px solid rgba(123,116,134,0.15)" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7b7486", display: "flex" }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="15" height="15"><circle cx="7" cy="7" r="5" /><path d="M14 14l-3-3" strokeLinecap="round" /></svg>
                </span>
                <input
                  type="text"
                  value={convSearch}
                  onChange={e => setConvSearch(e.target.value)}
                  placeholder="Search conversations..."
                  style={{ width: "100%", boxSizing: "border-box", background: "transparent", border: "none", outline: "none", padding: "9px 12px 9px 34px", fontSize: 13, color: "#181445" }}
                />
              </div>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
              {[{ id: "all", label: "All" }, { id: "unread", label: "Unread" }, { id: "recent", label: "Recent" }].map(f => (
                <button
                  key={f.id}
                  onClick={() => setConvFilter(f.id)}
                  style={{
                    padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                    fontSize: 11.5, fontWeight: 600,
                    background: convFilter === f.id ? "#6b38d4" : "transparent",
                    color: convFilter === f.id ? "white" : "#494454",
                    boxShadow: convFilter === f.id ? "0 2px 6px rgba(107,56,212,0.25)" : "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (convFilter !== f.id) e.currentTarget.style.background = "#e9e5ff"; }}
                  onMouseLeave={e => { if (convFilter !== f.id) e.currentTarget.style.background = "transparent"; }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* New Chat User Picker */}
            {showNewChat && (
              <div style={{ padding: "10px 12px", borderBottom: "0.5px solid #e5e7eb", background: "#faf5ff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: "bold", color: "#7c3aed" }}>New Message</span>
                  <button onClick={() => setShowNewChat(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 14 }}>×</button>
                </div>
                <input
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box" }}
                />
                <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 6 }}>
                  {filteredUsers.map(u => (
                    <div key={u.id} onClick={() => openConversation(u)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 4px", cursor: "pointer", borderRadius: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#ede9fe"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Avatar name={u.full_name} size={30} online={onlineUserIds.includes(String(u.id))} photoUrl={u.photo ? resolveUrl(u.photo) : null} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: "bold", color: "#111" }}>{u.full_name}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{u.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Group Creator */}
            {showNewGroup && (
              <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #e5e7eb", background: "#faf5ff", maxHeight: 360, overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: "bold", color: "#6b38d4" }}>New Group</span>
                  <button onClick={() => { setShowNewGroup(false); setNewGroupName(""); setNewGroupDesc(""); setNewGroupSearch(""); setNewGroupMembers([]); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
                <input
                  placeholder="Group name *"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 6 }}
                />
                <input
                  placeholder="Description (optional)"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
                />
                {/* Selected members chips */}
                {newGroupMembers.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {newGroupMembers.map(u => (
                      <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 4, background: "#ede9fe", borderRadius: 20, padding: "3px 8px", fontSize: 11 }}>
                        <span style={{ color: "#5b21b6", fontWeight: 600 }}>{u.full_name}</span>
                        <button onClick={() => setNewGroupMembers(prev => prev.filter(m => m.id !== u.id))} style={{ background: "none", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: 13, lineHeight: 1, padding: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  placeholder="Add members..."
                  value={newGroupSearch}
                  onChange={e => setNewGroupSearch(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 4 }}
                />
                <div style={{ maxHeight: 120, overflowY: "auto" }}>
                  {newGroupFilteredUsers.slice(0, 20).map(u => (
                    <div key={u.id} onClick={() => { setNewGroupMembers(prev => [...prev, u]); setNewGroupSearch(""); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer", borderRadius: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#ede9fe"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Avatar name={u.full_name} size={26} photoUrl={u.photo ? resolveUrl(u.photo) : null} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111" }}>{u.full_name}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{u.department}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={createGroup}
                  disabled={!newGroupName.trim() || groupCreating}
                  style={{ marginTop: 10, width: "100%", padding: "8px", borderRadius: 8, border: "none", background: newGroupName.trim() ? "#6b38d4" : "#e5e7eb", color: newGroupName.trim() ? "white" : "#aaa", cursor: newGroupName.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13 }}
                >
                  {groupCreating ? "Creating..." : "Create Group"}
                </button>
              </div>
            )}

            {/* Conversation / Document / Group list */}
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 72 }}>
              {tab === "groups" ? (
                visibleGroups.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                    No groups yet.<br />
                    <span onClick={() => setShowNewGroup(true)} style={{ color: "#7c3aed", cursor: "pointer", fontWeight: "bold" }}>Create one →</span>
                  </div>
                ) : visibleGroups.map(group => {
                  const isActive = activeGroup?.id === group.id;
                  const memberCount = group.members?.length || 0;
                  // Group avatar: initials from name
                  return (
                    <div key={group.id} onClick={() => openGroup(group)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px", margin: "4px 8px", borderRadius: 12,
                        cursor: "pointer", position: "relative",
                        background: isActive ? "rgba(107,56,212,0.05)" : "transparent",
                        border: isActive ? "1px solid rgba(107,56,212,0.2)" : "1px solid transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f6f2ff"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      {/* Group icon */}
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 700, color: "white", boxShadow: "0 2px 8px rgba(107,56,212,0.25)" }}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: "#181445" }}>{group.name}</span>
                          <span style={{ fontSize: 11, color: isActive ? "#6b38d4" : "#494454", flexShrink: 0 }}>
                            {group.last_time ? formatTime(group.last_time) : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#7b7486", marginBottom: 2 }}>{memberCount} member{memberCount !== 1 ? "s" : ""}</div>
                        <div style={{ fontSize: 12.5, color: "#181445", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: (group.unread_count || 0) > 0 ? 600 : 400 }}>
                          {group.last_message
                            ? <>{group.last_sender_id === currentUser.id ? "You: " : (group.last_sender_name ? `${group.last_sender_name.split(" ")[0]}: ` : "")}{group.last_message}</>
                            : <span style={{ color: "#bbb", fontStyle: "italic" }}>No messages yet</span>
                          }
                        </div>
                      </div>
                      {(group.unread_count || 0) > 0 && (
                        <div style={{ position: "absolute", right: 12, bottom: 14, minWidth: 20, height: 20, background: "#6b38d4", color: "white", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, padding: "0 5px" }}>
                          {group.unread_count}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : tab === "dm" ? (
                conversations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                    No conversations yet.<br />
                    <span onClick={() => setShowNewChat(true)} style={{ color: "#7c3aed", cursor: "pointer", fontWeight: "bold" }}>Start one →</span>
                  </div>
                ) : visibleConversations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 12 }}>No conversations match.</div>
                ) : visibleConversations.map(conv => {
                  const isActive = activeConv?.id === conv.id;
                  const isHovered = hoveredConvId === conv.id;
                  const isMenuOpen = menuOpenConvId === conv.id;
                  return (
                    <div key={conv.id} onClick={() => openConversation(conv)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px", margin: "4px 8px", borderRadius: 12,
                        cursor: "pointer", position: "relative",
                        background: isActive ? "rgba(107,56,212,0.05)" : isHovered ? "#f6f2ff" : "transparent",
                        border: isActive ? "1px solid rgba(107,56,212,0.2)" : "1px solid transparent",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={() => setHoveredConvId(conv.id)}
                      onMouseLeave={() => { setHoveredConvId(null); }}
                    >
                      <Avatar name={conv.full_name} size={48} online={onlineUserIds.includes(String(conv.id))} photoUrl={conv.photo ? resolveUrl(conv.photo) : null} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: "#181445" }}>{conv.full_name}</span>
                          <span style={{ fontSize: 11, color: isActive ? "#6b38d4" : "#494454", fontWeight: isActive ? 600 : 400, flexShrink: 0 }}>
                            {conv.last_time ? formatTime(conv.last_time) : ""}
                          </span>
                        </div>
                        {conv.department && (
                          <div style={{ fontSize: 11, color: "#7b7486", marginBottom: 2 }}>{conv.department}</div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13, color: "#181445", fontWeight: conv.unread_count > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                            {conv.last_sender_id === currentUser.id ? "You: " : ""}{parseReplyContent(conv.last_message).text || "📎 File"}
                          </span>
                        </div>
                      </div>

                      {/* 3-dot menu button — shown on hover or when menu is open */}
                      {(isHovered || isMenuOpen) && (
                        <div style={{ position: "absolute", top: 8, right: 8 }} ref={isMenuOpen ? convMenuRef : null}>
                          <button
                            onClick={e => { e.stopPropagation(); setMenuOpenConvId(isMenuOpen ? null : conv.id); }}
                            title="More options"
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: "none",
                              background: isMenuOpen ? "#ede9fe" : "rgba(107,56,212,0.08)",
                              color: "#6b38d4", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 16, fontWeight: 700, lineHeight: 1,
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = "#ede9fe"; }}
                            onMouseLeave={e => { if (!isMenuOpen) e.currentTarget.style.background = "rgba(107,56,212,0.08)"; }}
                          >
                            ⋯
                          </button>
                          {/* Dropdown */}
                          {isMenuOpen && (
                            <div style={{
                              position: "absolute", top: 32, right: 0, zIndex: 999,
                              background: "white", borderRadius: 10,
                              boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                              border: "1px solid rgba(107,56,212,0.1)",
                              minWidth: 170, overflow: "hidden",
                              animation: "fadeInDown 0.12s ease",
                            }}>
                              <button
                                onClick={e => handleConvRowAction("archive", conv, e)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  width: "100%", padding: "10px 14px", border: "none",
                                  background: "none", cursor: "pointer", textAlign: "left",
                                  fontSize: 13, color: "#374151",
                                  transition: "background 0.1s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg viewBox="0 0 20 20" fill="none" stroke="#6b38d4" strokeWidth="1.8" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 5h14M4 5l1 12h10L16 5M8 9v5M12 9v5M7 5V3h6v2" />
                                </svg>
                                Archive conversation
                              </button>
                              <div style={{ height: 1, background: "#f3f0ff", margin: "0 10px" }} />
                              <button
                                onClick={e => handleConvRowAction("delete", conv, e)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 10,
                                  width: "100%", padding: "10px 14px", border: "none",
                                  background: "none", cursor: "pointer", textAlign: "left",
                                  fontSize: 13, color: "#dc2626",
                                  transition: "background 0.1s",
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.8" width="16" height="16" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 5h14M4 5l1 12h10L16 5M8 9v5M12 9v5M7 5V3h6v2" />
                                </svg>
                                Delete conversation
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {conv.unread_count > 0 && !isHovered && !isMenuOpen && (
                        <div style={{ position: "absolute", right: 12, bottom: 12, width: 20, height: 20, background: "#6b38d4", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                          {conv.unread_count}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                documents.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 12 }}>No documents found.</div>
                ) : documents.map(doc => (
                  <div key={doc.id} onClick={() => openDocChat(doc)}
                    style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f5f5f5", background: activeDoc?.id === doc.id ? "#faf5ff" : "white" }}
                    onMouseEnter={e => { if (activeDoc?.id !== doc.id) e.currentTarget.style.background = "#fafafa"; }}
                    onMouseLeave={e => { if (activeDoc?.id !== doc.id) e.currentTarget.style.background = "white"; }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: 12, color: "#7c3aed" }}>{doc.tracking_id}</div>
                    <div style={{ fontSize: 11, color: "#333", marginTop: 2 }}>{(doc.title || "(No title)").slice(0, 35)}</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{doc.department} · {doc.status}</div>
                  </div>
                ))
              )}
            </div>

            {/* Floating Action Button (New Message / New Group) */}
            {(tab === "dm" || tab === "groups") && (
              <button
                onClick={() => tab === "groups" ? setShowNewGroup(true) : setShowNewChat(true)}
                title={tab === "groups" ? "New group" : "New message"}
                style={{
                  position: "absolute", right: 24, bottom: 24, width: 56, height: 56,
                  borderRadius: 16, border: "none", background: "#6b38d4", color: "white",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 16px rgba(107,56,212,0.3)", transition: "transform 0.15s, background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#5a2fb0"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#6b38d4"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                {tab === "groups"
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                }
              </button>
            )}
          </div>

          {/* ── Right: chat window ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* No active conversation */}
            {!activeConv && !activeDoc && !activeGroup && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#aaa", gap: 10 }}>
                <svg viewBox="0 0 40 40" fill="none" stroke="#d8b4fe" strokeWidth="2" width="48" height="48">
                  <path d="M5 8h30v20H5zM5 28l7 6v-6" />
                </svg>
                <div style={{ fontSize: 14, fontWeight: "bold", color: "#888" }}>Select a conversation</div>
                <div style={{ fontSize: 12 }}>Choose a message or document from the left panel</div>
              </div>
            )}

            {/* DM Chat window */}
            {tab === "dm" && activeConv && (
              <>
                {/* Chat header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "0.5px solid #e5e7eb", background: "white", boxShadow: "0 4px 12px rgba(107,56,212,0.04)", minHeight: 89, boxSizing: "border-box" }}>
                  <Avatar name={activeConv.full_name} size={48} online={onlineUserIds.includes(String(activeConv.id))} photoUrl={activeConv.photo ? resolveUrl(activeConv.photo) : null} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 16, color: "#181445" }}>{activeConv.full_name}</div>
                    <div style={{ fontSize: 11.5, color: "#494454", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: onlineUserIds.includes(String(activeConv.id)) ? "#22c55e" : "#cbc3d7", display: "inline-block", flexShrink: 0 }} />
                      {onlineUserIds.includes(String(activeConv.id)) ? "Online" : "Offline"}{activeConv.department ? ` · ${activeConv.department}` : ""}
                    </div>
                  </div>
                  {/* Call buttons */}
                  <button
                    onClick={() => startCall("audio")}
                    title="Audio Call"
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#059669" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 2.5c0-.3.2-.5.5-.5h2l1 2.5-1.5 1a7 7 0 003.5 3.5l1-1.5L12 8.5v2c0 .3-.2.5-.5.5A9.5 9.5 0 012.5 2.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startCall("video")}
                    title="Video Call"
                    style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="9" height="8" rx="1.5" />
                      <path d="M10 6.5l4-2v7l-4-2" />
                    </svg>
                  </button>

                  {/* Chat settings (⋮) button — opens the profile/settings drawer directly */}
                  <div style={{ position: "relative" }}>
                    <button
                      ref={chatMenuBtnRef}
                      onClick={() => setShowProfileDrawer(true)}
                      title="Conversation settings"
                      aria-label="Conversation settings"
                      aria-haspopup="dialog"
                      aria-expanded={showProfileDrawer}
                      style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: showProfileDrawer ? "#faf5ff" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                      onMouseLeave={e => e.currentTarget.style.background = showProfileDrawer ? "#faf5ff" : "white"}
                    >
                      <Icon.Dots />
                    </button>
                  </div>
                </div>

                {/* Inline message search bar */}
                {messageSearchOpen && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderBottom: "0.5px solid #e5e7eb", background: "#faf5ff" }}>
                    <span style={{ color: "#7c3aed", display: "flex" }}><Icon.Search /></span>
                    <input
                      autoFocus
                      value={messageSearchQuery}
                      onChange={e => setMessageSearchQuery(e.target.value)}
                      placeholder={`Search messages with ${activeConv.full_name}…`}
                      aria-label="Search messages"
                      style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 12.5, color: "#27223f" }}
                    />
                    <button
                      onClick={() => { setMessageSearchOpen(false); setMessageSearchQuery(""); }}
                      aria-label="Close search"
                      style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}
                    >
                      <Icon.Close />
                    </button>
                  </div>
                )}

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 4, background: "#fcf8ff" }}>
                  {messages.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#494454", background: "#f6f2ff", padding: "4px 16px", borderRadius: 20, border: "1px solid rgba(203,195,215,0.4)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                        Today
                      </span>
                    </div>
                  )}
                  {messages.map((msg, i) => {
                    const isMine = String(msg.sender_id) === String(currentUser.id);
                    const isFirstInGroup = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id;
                    const isSearchMatch = !messageSearchOpen || !messageSearchQuery || (parseReplyContent(msg.content).text || "").toLowerCase().includes(messageSearchQuery.toLowerCase());
                    const isLastInGroup = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;

                    // ── System / call event message ──────────────────────────
                    if (msg.is_system) {
                      const isPinEvent = msg.is_system && typeof msg.content === "string" && msg.content.startsWith("📌");
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: "center", marginTop: 10, marginBottom: 6 }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: isPinEvent ? "rgba(124,58,237,0.1)" : "#f0f0f5",
                            border: isPinEvent ? "1px solid rgba(124,58,237,0.18)" : "none",
                            borderRadius: 20, padding: "4px 14px", fontSize: 11,
                            color: isPinEvent ? "#7c3aed" : "#888",
                            fontStyle: isPinEvent ? "normal" : "italic",
                            fontWeight: isPinEvent ? 600 : 400,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          }}>
                            <span>{msg.content}</span>
                            <span style={{ fontSize: 9, color: isPinEvent ? "#a78bfa" : "#bbb", flexShrink: 0 }}>{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      );
                    }

                    const isPinned = !!msg.is_pinned;
                    const { replyMeta, text: msgText } = parseReplyContent(msg.content);
                    const showActions = hoveredMsgId === msg.id || openMsgMenuId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        onMouseEnter={() => setHoveredMsgId(msg.id)}
                        onMouseLeave={() => setHoveredMsgId(prev => (openMsgMenuId === msg.id ? prev : (prev === msg.id ? null : prev)))}
                        style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-start", gap: 8, marginTop: isFirstInGroup ? 10 : 2, opacity: isSearchMatch ? 1 : 0.32, transition: "opacity 0.15s" }}
                      >

                        {/* Avatar — only for received messages, aligned to top of bubble */}
                        {!isMine && (
                          <div style={{ width: 32, flexShrink: 0, paddingTop: isFirstInGroup ? 14 : 0 }}>
                            {isFirstInGroup && (
                              <Avatar name={msg.sender_name} size={30} online={onlineUserIds.includes(String(msg.sender_id))} photoUrl={msg.sender_photo ? resolveUrl(msg.sender_photo) : null} />
                            )}
                          </div>
                        )}

                        <div style={{ maxWidth: "60%" }}>
                          {isFirstInGroup && !isMine && (
                            <div style={{ fontSize: 10, color: "#888", marginBottom: 3, marginLeft: 2 }}>{msg.sender_name}</div>
                          )}
                          <div style={{ position: "relative" }}>
                            {isPinned && (
                              <span style={{ position: "absolute", top: -8, [isMine ? "left" : "right"]: -6, color: "#7c3aed", background: "white", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
                                <Icon.PinSmall />
                              </span>
                            )}
                            <div style={{ background: isMine ? "#6b38d4" : "white", color: isMine ? "white" : "#181445", padding: "10px 16px", borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.5, boxShadow: "0 4px 12px rgba(107,56,212,0.06)", border: isMine ? "none" : "1px solid #e3dfff", wordBreak: "break-word" }}>
                              {replyMeta && (() => {
                                const repliedToSelf = String(replyMeta.senderId) === String(msg.sender_id);
                                const repliedToViewer = !repliedToSelf && String(replyMeta.senderId) === String(currentUser.id);
                                const whoText = isMine ? "You" : msg.sender_name;
                                const targetText = repliedToSelf
                                  ? (isMine ? "yourself" : "themself")
                                  : (repliedToViewer ? "you" : replyMeta.name);
                                return (
                                  <div style={{ marginBottom: 4 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: "bold", color: isMine ? "rgba(255,255,255,0.85)" : "#7c3aed", marginBottom: 2, lineHeight: 1.2 }}>
                                      <span style={{ display: "flex", transform: "scale(0.7)", transformOrigin: "center" }}><Icon.ReplyArrow /></span>
                                      {whoText} replied to {targetText}
                                    </div>
                                    <div style={{
                                      background: isMine ? "rgba(255,255,255,0.16)" : "rgba(124,58,237,0.08)",
                                      borderLeft: `3px solid ${isMine ? "rgba(255,255,255,0.55)" : "#7c3aed"}`,
                                      borderRadius: 5, padding: "3px 7px", fontSize: 12, lineHeight: 1.35,
                                      color: isMine ? "rgba(255,255,255,0.85)" : "#555",
                                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                      {replyMeta.snippet}
                                    </div>
                                  </div>
                                );
                              })()}
                              {editingMsgId === msg.id ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
                                  <textarea
                                    ref={editInputRef}
                                    value={editInput}
                                    onChange={e => setEditInput(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditMessage(msg); }
                                      if (e.key === "Escape") { e.preventDefault(); cancelEditMessage(); }
                                    }}
                                    rows={Math.min(6, Math.max(1, editInput.split("\n").length))}
                                    style={{
                                      resize: "none", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 8,
                                      padding: "6px 8px", fontSize: 13, fontFamily: "inherit",
                                      background: isMine ? "rgba(255,255,255,0.95)" : "#fff",
                                      color: "#111", outline: "none",
                                    }}
                                  />
                                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                    <button
                                      onClick={cancelEditMessage}
                                      style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.08)", color: isMine ? "#3a2e6e" : "#555" }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => saveEditMessage(msg)}
                                      disabled={!editInput.trim()}
                                      style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: "#7c3aed", color: "white", opacity: editInput.trim() ? 1 : 0.5 }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {msgText && <div style={{ whiteSpace: "pre-wrap" }}>{msgText}</div>}
                                  {msg.file_url && <FileAttachment url={msg.file_url} name={msg.file_name} />}
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: "#bbb", marginTop: 2, textAlign: isMine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: isMine ? "flex-end" : "flex-start", gap: 4 }}>
                            {formatTime(msg.created_at)}
                            {!!msg.is_edited && <span style={{ fontStyle: "italic" }}>· edited</span>}
                            {isMine && (
                              <span style={{ color: msg.is_read ? "#7c3aed" : "#ccc" }}>
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover action toolbar — reply + 3-dot menu (no reactions) */}
                        {editingMsgId !== msg.id && (
                        <div style={{ display: "flex", alignItems: "center", gap: 2, paddingTop: 6, position: "relative", opacity: showActions ? 1 : 0, pointerEvents: showActions ? "auto" : "none", transition: "opacity 0.12s" }}>
                          <button
                            onClick={() => startReplyToMessage(msg)}
                            title="Reply"
                            aria-label="Reply to message"
                            style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f5f8"}
                            onMouseLeave={e => e.currentTarget.style.background = "white"}
                          >
                            <Icon.ReplyArrow />
                          </button>
                          <button
                            onClick={() => setOpenMsgMenuId(prev => (prev === msg.id ? null : msg.id))}
                            title="More options"
                            aria-label="More message options"
                            aria-haspopup="menu"
                            aria-expanded={openMsgMenuId === msg.id}
                            style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid #e5e7eb", background: openMsgMenuId === msg.id ? "#f0f0f5" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f5f8"}
                            onMouseLeave={e => e.currentTarget.style.background = openMsgMenuId === msg.id ? "#f0f0f5" : "white"}
                          >
                            <Icon.DotsHorizontal />
                          </button>

                          {/* Dropdown: Remove / Forward / Pin (no Report) */}
                          {openMsgMenuId === msg.id && (
                            <div
                              ref={msgMenuRef}
                              role="menu"
                              style={{
                                position: "absolute", top: 30, [isMine ? "left" : "right"]: 0,
                                background: "#1e293b", borderRadius: 10, padding: "6px 0", minWidth: 130,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 30,
                              }}
                            >
                              {canEditMessage(msg) && (
                                <button
                                  role="menuitem"
                                  onClick={() => startEditMessage(msg)}
                                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, textAlign: "left" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                  <Icon.Edit /> Edit
                                </button>
                              )}
                              <button
                                role="menuitem"
                                onClick={() => handleRemoveMessage(msg)}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, textAlign: "left" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <Icon.Remove /> Remove
                              </button>
                              <button
                                role="menuitem"
                                onClick={() => startForwardMessage(msg)}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, textAlign: "left" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <Icon.ForwardArrow /> Forward
                              </button>
                              <button
                                role="menuitem"
                                onClick={() => togglePinMessage(msg)}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#f1f5f9", fontSize: 12.5, fontWeight: 600, textAlign: "left" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                              >
                                <Icon.PinSmall /> {isPinned ? "Unpin" : "Pin"}
                              </button>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    );
                  })}
                  {otherTyping && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <Avatar name={activeConv.full_name} size={28} photoUrl={activeConv.photo ? resolveUrl(activeConv.photo) : null} />
                      <div style={{ background: "white", borderRadius: 14, padding: "8px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
                        <span style={{ fontSize: 18, letterSpacing: 2 }}>···</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply preview bar */}
                {replyingTo && (
                  <div style={{ padding: "8px 18px", background: "#faf5ff", borderTop: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#7c3aed", display: "flex", flexShrink: 0 }}><Icon.ReplyArrow /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: "bold", color: "#7c3aed" }}>
                        Replying to {String(replyingTo.sender_id) === String(currentUser.id) ? "yourself" : (replyingTo.sender_name || activeConv.full_name)}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {parseReplyContent(replyingTo.content).text || (replyingTo.file_name ? `📎 ${replyingTo.file_name}` : "")}
                      </div>
                    </div>
                    <button onClick={() => setReplyingTo(null)} aria-label="Cancel reply" style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>×</button>
                  </div>
                )}

                {/* File preview */}
                {dmFile && (
                  <div style={{ padding: "6px 18px", background: "#faf5ff", borderTop: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#7c3aed" }}>📎 {dmFile.name}</span>
                    <button onClick={() => { setDmFile(null); dmFileRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}

                {/* Input */}
                <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e5e7eb", background: "white" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#f6f2ff", border: "1px solid rgba(123,116,134,0.15)", borderRadius: 20, padding: 6 }}>
                    <input type="file" ref={dmFileRef} style={{ display: "none" }} onChange={e => setDmFile(e.target.files[0])} />
                    <button onClick={() => dmFileRef.current.click()} title="Attach file" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b7486", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#6b38d4"; e.currentTarget.style.background = "#e3dfff"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#7b7486"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16"><path d="M13 8l-5 5a3.5 3.5 0 01-5-5L8 3a2 2 0 013 3L7 10a.5.5 0 01-1-1l4-4" strokeLinecap="round" /></svg>
                    </button>
                    <textarea
                      value={dmInput}
                      onChange={e => handleDmInput(e.target.value)}
                      onKeyDown={e => handleKey(e, sendDm)}
                      placeholder="Type a message..."
                      rows={1}
                      style={{ flex: 1, padding: "9px 4px", border: "none", background: "transparent", borderRadius: 10, fontSize: 14, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
                    />
                    <button title="Emoji" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b7486", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#6b38d4"; e.currentTarget.style.background = "#e3dfff"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#7b7486"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20"><circle cx="12" cy="12" r="9" /><path d="M9 10h.01M15 10h.01M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" strokeLinecap="round" /></svg>
                    </button>
                    <button onClick={sendDm} disabled={!dmInput.trim() && !dmFile} style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "#6b38d4", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !dmInput.trim() && !dmFile ? 0.5 : 1, boxShadow: "0 2px 6px rgba(107,56,212,0.3)" }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15"><path d="M1 1l14 7-14 7V9l10-2L1 5V1z" /></svg>
                    </button>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 10.5, color: "#cbc3d7", marginTop: 8, marginBottom: 0 }}>
                    Press <kbd style={{ padding: "1px 5px", background: "#f6f2ff", border: "1px solid #e3dfff", borderRadius: 4 }}>Enter</kbd> to send, <kbd style={{ padding: "1px 5px", background: "#f6f2ff", border: "1px solid #e3dfff", borderRadius: 4 }}>Shift + Enter</kbd> for new line.
                  </p>
                </div>
              </>
            )}

            {/* Group Chat window */}
            {tab === "groups" && activeGroup && (
              <>
                {/* Group header */}
                {(() => {
                  const isGroupAdmin = (activeGroup.members || []).some(
                    m => String(m.user_id) === String(currentUser.id) && m.role === "admin"
                  );
                  const addableMember = allUsers.filter(u =>
                    !(activeGroup.members || []).find(m => String(m.user_id) === String(u.id)) &&
                    u.full_name.toLowerCase().includes(groupMemberSearch.toLowerCase())
                  );
                  return (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "0.5px solid #e5e7eb", background: "white", boxShadow: "0 4px 12px rgba(107,56,212,0.04)", minHeight: 89, boxSizing: "border-box" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20, fontWeight: 700, color: "white" }}>
                          {activeGroup.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 16, color: "#181445" }}>{activeGroup.name}</div>
                          <div style={{ fontSize: 11.5, color: "#7b7486", marginTop: 2 }}>
                            {(activeGroup.members || []).length} member{(activeGroup.members || []).length !== 1 ? "s" : ""}
                            {activeGroup.description ? ` · ${activeGroup.description}` : ""}
                          </div>
                        </div>

                        {/* Info toggle */}
                        <button
                          onClick={() => setShowGroupInfo(v => !v)}
                          title="Group members"
                          style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: showGroupInfo ? "#ede9fe" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b38d4" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                          onMouseLeave={e => e.currentTarget.style.background = showGroupInfo ? "#ede9fe" : "white"}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 110 2 1 1 0 010-2zm0 4a1 1 0 011 1v4a1 1 0 11-2 0v-4a1 1 0 011-1z"/></svg>
                        </button>

                        {/* 3-dot menu */}
                        <div style={{ position: "relative" }} ref={groupMenuRef}>
                          <button
                            onClick={() => setShowGroupMenu(v => !v)}
                            title="More options"
                            style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: showGroupMenu ? "#ede9fe" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b38d4", fontSize: 18, fontWeight: 700 }}
                            onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                            onMouseLeave={e => e.currentTarget.style.background = showGroupMenu ? "#ede9fe" : "white"}
                          >
                            ⋯
                          </button>
                          {showGroupMenu && (
                            <div style={{ position: "absolute", top: 40, right: 0, zIndex: 999, background: "white", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", border: "1px solid rgba(107,56,212,0.1)", minWidth: 180, overflow: "hidden", animation: "fadeInDown 0.12s ease" }}>
                              {/* Archive — available to everyone */}
                              <button
                                onClick={() => { setShowGroupMenu(false); archiveGroup(activeGroup); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#374151" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg viewBox="0 0 20 20" fill="none" stroke="#6b38d4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 6h14M5 6l1 11h8L15 6M8 10v4M12 10v4M7 6V4h6v2"/></svg>
                                Archive group
                              </button>
                              <div style={{ height: 1, background: "#f3f0ff", margin: "0 10px" }} />
                              {/* Leave — available to everyone */}
                              <button
                                onClick={() => { setShowGroupMenu(false); leaveGroup(activeGroup); }}
                                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#374151" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                              >
                                <svg viewBox="0 0 20 20" fill="none" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" width="16" height="16"><path d="M13 10H3m0 0l3-3m-3 3l3 3M17 4v12"/></svg>
                                Leave group
                              </button>
                              {/* Delete — admin only */}
                              {isGroupAdmin && (
                                <>
                                  <div style={{ height: 1, background: "#f3f0ff", margin: "0 10px" }} />
                                  <button
                                    onClick={() => { setShowGroupMenu(false); deleteGroup(activeGroup); }}
                                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "#dc2626" }}
                                    onMouseEnter={e => e.currentTarget.style.background = "#fff1f2"}
                                    onMouseLeave={e => e.currentTarget.style.background = "none"}
                                  >
                                    <svg viewBox="0 0 20 20" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 6h14M5 6l1 11h8L15 6M8 10v4M12 10v4M7 6V4h6v2"/></svg>
                                    Delete group
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Group info + manage members panel */}
                      {showGroupInfo && (
                        <div style={{ background: "#faf5ff", borderBottom: "0.5px solid #e5e7eb", padding: "14px 20px", maxHeight: 320, overflowY: "auto" }}>
                          {/* Members list */}
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            Members ({(activeGroup.members || []).length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                            {(activeGroup.members || []).map(m => (
                              <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 10, padding: "7px 10px", border: "1px solid #ede9fe" }}>
                                <Avatar name={m.full_name} size={28} photoUrl={m.photo ? resolveUrl(m.photo) : null} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#181445" }}>{m.full_name}</div>
                                  {m.department && <div style={{ fontSize: 10.5, color: "#7b7486" }}>{m.department}</div>}
                                </div>
                                {m.role === "admin" && (
                                  <span style={{ fontSize: 9, background: "#7c3aed", color: "white", borderRadius: 4, padding: "2px 6px", fontWeight: 700, flexShrink: 0 }}>ADMIN</span>
                                )}
                                {/* Remove button — admin only, can't remove yourself this way */}
                                {isGroupAdmin && String(m.user_id) !== String(currentUser.id) && (
                                  <button
                                    onClick={() => removeGroupMember(m.user_id)}
                                    title="Remove member"
                                    style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", flexShrink: 0, fontSize: 14, lineHeight: 1 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = "#fff1f2"; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                                  >×</button>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Add member — admin only */}
                          {isGroupAdmin && (
                            <>
                              <div style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Add Member</div>
                              <input
                                placeholder="Search users to add..."
                                value={groupMemberSearch}
                                onChange={e => setGroupMemberSearch(e.target.value)}
                                style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, outline: "none", background: "white" }}
                              />
                              {groupMemberSearch.trim() && (
                                <div style={{ marginTop: 6, background: "white", borderRadius: 8, border: "1px solid #ede9fe", overflow: "hidden" }}>
                                  {addableMember.slice(0, 8).length === 0
                                    ? <div style={{ padding: "8px 12px", fontSize: 12, color: "#aaa" }}>No users found</div>
                                    : addableMember.slice(0, 8).map(u => (
                                        <div key={u.id}
                                          onClick={() => addGroupMember(u)}
                                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", cursor: "pointer", borderBottom: "0.5px solid #f5f3ff" }}
                                          onMouseEnter={e => e.currentTarget.style.background = "#f5f3ff"}
                                          onMouseLeave={e => e.currentTarget.style.background = "white"}
                                        >
                                          <Avatar name={u.full_name} size={26} photoUrl={u.photo ? resolveUrl(u.photo) : null} />
                                          <div>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: "#181445" }}>{u.full_name}</div>
                                            <div style={{ fontSize: 10.5, color: "#7b7486" }}>{u.department}</div>
                                          </div>
                                          <div style={{ marginLeft: "auto", color: "#7c3aed", fontSize: 18, lineHeight: 1 }}>+</div>
                                        </div>
                                      ))
                                  }
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Group messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, background: "#fafafa" }}>
                  {groupMessages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 40 }}>No messages yet. Start the conversation!</div>
                  )}
                  {groupMessages.map((msg, idx) => {
                    const isMine = String(msg.sender_id) === String(currentUser.id);
                    const prevMsg = groupMessages[idx - 1];
                    const showSender = !isMine && (!prevMsg || String(prevMsg.sender_id) !== String(msg.sender_id));
                    return (
                      <div key={msg.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginTop: showSender ? 10 : 2 }}>
                        {!isMine && (
                          <div style={{ width: 32, flexShrink: 0, alignSelf: "flex-end" }}>
                            {showSender && <Avatar name={msg.sender_name} size={32} photoUrl={msg.sender_photo ? resolveUrl(msg.sender_photo) : null} />}
                          </div>
                        )}
                        <div style={{ maxWidth: "68%" }}>
                          {showSender && (
                            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, marginBottom: 3, marginLeft: 4 }}>{msg.sender_name}</div>
                          )}
                          <div style={{
                            padding: "9px 13px", borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            background: isMine ? "linear-gradient(135deg,#7c3aed,#6b38d4)" : "white",
                            color: isMine ? "white" : "#181445",
                            boxShadow: isMine ? "0 2px 8px rgba(107,56,212,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                            fontSize: 13.5, lineHeight: 1.5, wordBreak: "break-word",
                          }}>
                            {msg.file_url
                              ? <a href={msg.file_url} target="_blank" rel="noreferrer" download={msg.file_name} style={{ display: "flex", alignItems: "center", gap: 6, color: isMine ? "white" : "#6b38d4", textDecoration: "none", fontSize: 12 }}>
                                  <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M3 2h7l3 3v9H3V2z" /></svg>
                                  {msg.file_name || "File"}
                                </a>
                              : msg.content
                            }
                          </div>
                          <div style={{ fontSize: 10, color: "#bbb", marginTop: 3, textAlign: isMine ? "right" : "left", paddingLeft: 4 }}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {(groupTypingUsers[activeGroup.id] || []).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <div style={{ display: "flex", gap: 3, padding: "8px 12px", background: "white", borderRadius: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed", animation: "typing-dot 1s infinite", animationDelay: `${i * 0.2}s`, opacity: 0.6 }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: "#7b7486" }}>
                        {(groupTypingUsers[activeGroup.id] || []).map(u => u.senderName.split(" ")[0]).join(", ")} typing...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Group message input */}
                {groupFile && (
                  <div style={{ padding: "6px 18px", background: "#faf5ff", borderTop: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#7c3aed" }}>📎 {groupFile.name}</span>
                    <button onClick={() => { setGroupFile(null); if (groupFileRef.current) groupFileRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}
                <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e5e7eb", background: "white" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#f6f2ff", border: "1px solid rgba(123,116,134,0.15)", borderRadius: 20, padding: 6 }}>
                    <input type="file" ref={groupFileRef} style={{ display: "none" }} onChange={e => setGroupFile(e.target.files[0])} />
                    <button onClick={() => groupFileRef.current.click()} title="Attach file"
                      style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7b7486", flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.color = "#6b38d4"; e.currentTarget.style.background = "#e3dfff"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = "#7b7486"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" width="18" height="18"><path d="M15.5 11.5l-6 6a4 4 0 01-5.6-5.6l7-7a2.5 2.5 0 013.5 3.5l-7 7a1 1 0 01-1.4-1.4l6-6"/></svg>
                    </button>
                    <textarea
                      value={groupInput}
                      onChange={e => handleGroupInput(e.target.value)}
                      onKeyDown={e => handleKey(e, sendGroupMessage)}
                      placeholder="Message group..."
                      rows={1}
                      style={{ flex: 1, border: "none", background: "transparent", outline: "none", resize: "none", fontSize: 13.5, color: "#181445", padding: "9px 4px", lineHeight: 1.5, maxHeight: 100, overflowY: "auto", fontFamily: "inherit" }}
                    />
                    <button onClick={sendGroupMessage} disabled={!groupInput.trim() && !groupFile}
                      style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "#6b38d4", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !groupInput.trim() && !groupFile ? 0.5 : 1, boxShadow: "0 2px 6px rgba(107,56,212,0.3)" }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15"><path d="M1 1l14 7-14 7V9l10-2L1 5V1z" /></svg>
                    </button>
                  </div>
                  <p style={{ textAlign: "center", fontSize: 10.5, color: "#cbc3d7", marginTop: 8, marginBottom: 0 }}>
                    Press <kbd style={{ padding: "1px 5px", background: "#f6f2ff", border: "1px solid #e3dfff", borderRadius: 4 }}>Enter</kbd> to send, <kbd style={{ padding: "1px 5px", background: "#f6f2ff", border: "1px solid #e3dfff", borderRadius: 4 }}>Shift + Enter</kbd> for new line.
                  </p>
                </div>
              </>
            )}

            {/* Document Chat window */}
            {tab === "documents" && activeDoc && (
              <>
                {/* Doc header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "0.5px solid #e5e7eb", background: "white" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg viewBox="0 0 16 16" fill="#7c3aed" width="16" height="16"><path d="M3 2h7l3 3v9H3V2z" /></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 13, color: "#7c3aed" }}>{activeDoc.tracking_id}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>{activeDoc.title || "(No title)"} · {activeDoc.department}</div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: activeDoc.status === "Registered" ? "#d1fae5" : "#f3f4f6", color: activeDoc.status === "Registered" ? "#065f46" : "#374151", fontWeight: "bold" }}>
                      {activeDoc.status}
                    </span>
                  </div>
                </div>

                {/* Comments */}
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, background: "#fafafa" }}>
                  {docComments.length === 0 && (
                    <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 40 }}>No comments yet. Start the discussion.</div>
                  )}
                  {docComments.map((c) => {
                    const isMine = String(c.sender_id) === String(currentUser.id);
                    return (
                      <div key={c.id} style={{ display: "flex", gap: 10, flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-start" }}>
                        <Avatar name={c.sender_name} size={32} photoUrl={c.sender_photo ? resolveUrl(c.sender_photo) : null} />
                        <div style={{ maxWidth: "65%" }}>
                          <div style={{ fontSize: 10, color: "#888", marginBottom: 3, textAlign: isMine ? "right" : "left" }}>
                            {isMine ? "You" : c.sender_name} · {c.sender_dept} · {formatTime(c.created_at)}
                          </div>
                          <div style={{ background: isMine ? "#7c3aed" : "white", color: isMine ? "white" : "#111", padding: "8px 12px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 13, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", wordBreak: "break-word" }}>
                            {c.content && <div>{c.content}</div>}
                            {c.file_url && <FileAttachment url={c.file_url} name={c.file_name} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* File preview */}
                {docFile && (
                  <div style={{ padding: "6px 18px", background: "#faf5ff", borderTop: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#7c3aed" }}>📎 {docFile.name}</span>
                    <button onClick={() => { setDocFile(null); docFileRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}

                {/* Input */}
                <div style={{ padding: "10px 16px", borderTop: "0.5px solid #e5e7eb", display: "flex", gap: 8, alignItems: "flex-end", background: "white" }}>
                  <input type="file" ref={docFileRef} style={{ display: "none" }} onChange={e => setDocFile(e.target.files[0])} />
                  <button onClick={() => docFileRef.current.click()} title="Attach file" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", flexShrink: 0 }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M13 8l-5 5a3.5 3.5 0 01-5-5L8 3a2 2 0 013 3L7 10a.5.5 0 01-1-1l4-4" strokeLinecap="round" /></svg>
                  </button>
                  <textarea
                    value={docInput}
                    onChange={e => setDocInput(e.target.value)}
                    onKeyDown={e => handleKey(e, sendDocComment)}
                    placeholder="Add a comment... (Enter to send)"
                    rows={1}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
                  />
                  <button onClick={sendDocComment} disabled={!docInput.trim() && !docFile} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "#7c3aed", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !docInput.trim() && !docFile ? 0.5 : 1 }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 1l14 7-14 7V9l10-2L1 5V1z" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Profile & Chat Settings panel — flex sibling, pushes layout instead of overlaying it ── */}
          {activeConv && (
            <ProfileDrawer
              open={showProfileDrawer}
              onClose={() => setShowProfileDrawer(false)}
              faculty={{
                full_name: activeConv.full_name,
                department: activeConv.department,
                position: activeConv.role || activeConv.position || activeConv.role_label,
                email: activeConv.email,
                contact_number: activeConv.contact_number || activeConv.phone,
                photoUrl: activeConv.photo ? resolveUrl(activeConv.photo) : null,
                online: onlineUserIds.includes(String(activeConv.id)),
                lastSeen: activeConv.last_seen ? formatTime(activeConv.last_seen) : null,
                docsProcessed: activeConv.docs_processed,
                messagesSent: activeConv.messages_sent,
              }}
              prefs={currentPrefs}
              onPrefsChange={updateConvPrefs}
              isAdmin={canViewAdminNav}
              mediaCount={messages.filter(m => m.file_url && ["jpg", "jpeg", "png", "gif", "webp"].includes((m.file_name || "").split(".").pop()?.toLowerCase())).length}
              fileCount={messages.filter(m => m.file_url && !["jpg", "jpeg", "png", "gif", "webp"].includes((m.file_name || "").split(".").pop()?.toLowerCase())).length}
              pinnedCount={messages.filter(m => m.is_pinned).length}
              onAction={handleChatMenuAction}
            />
          )}
        </div>
      </div>

      {/* ── Always-mounted remote audio element — must exist before ontrack fires ── */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* ── Pinned Messages Modal ── */}
      {showPinnedMessages && activeConv && (
        <PinnedMessagesModal
          onClose={() => setShowPinnedMessages(false)}
          pinnedMessages={[...messages]
            .filter(m => m.is_pinned)
            .sort((a, b) => new Date(b.pinned_at || b.created_at) - new Date(a.pinned_at || a.created_at))}
          currentUser={currentUser}
          convName={activeConv.full_name}
          onUnpin={togglePinMessage}
        />
      )}

      {/* ── Forward Message Modal ── */}
      {forwardingMsg && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setForwardingMsg(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 16, width: 320, maxHeight: "70vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
              <span style={{ fontWeight: "bold", fontSize: 14, color: "#111" }}>Forward message</span>
              <button onClick={() => setForwardingMsg(null)} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: 16 }}>×</button>
            </div>
            <div style={{ padding: "10px 16px", fontSize: 11.5, color: "#666", background: "#faf5ff", borderBottom: "0.5px solid #e5e7eb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {parseReplyContent(forwardingMsg.content).text || (forwardingMsg.file_name ? `📎 ${forwardingMsg.file_name}` : "")}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px" }}>
              {allUsers.filter(u => String(u.id) !== String(currentUser.id)).map(u => (
                <div
                  key={u.id}
                  onClick={() => sendForward(u)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", cursor: "pointer", borderRadius: 8 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ede9fe"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <Avatar name={u.full_name} size={30} online={onlineUserIds.includes(String(u.id))} photoUrl={u.photo ? resolveUrl(u.photo) : null} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: "bold", color: "#111" }}>{u.full_name}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{u.department}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Call Error Toast ── */}
      {callError && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 2000, background: "#1e1b2e", color: "white", borderRadius: 12, padding: "14px 20px", boxShadow: "0 8px 30px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 12, maxWidth: 420, animation: "fadeInDown 0.2s ease" }}>
          <svg viewBox="0 0 20 20" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" width="20" height="20" flexShrink="0"><circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01"/></svg>
          <span style={{ fontSize: 13, flex: 1 }}>{callError}</span>
          <button onClick={() => setCallError(null)} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
      )}

      {/* ── Incoming Call Modal ── */}
      {callState?.type === "incoming" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1e1b2e", borderRadius: 24, padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatarColor(callState.with?.full_name || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", color: "white", boxShadow: "0 0 0 8px rgba(124,58,237,0.15)" }}>
              {initials(callState.with?.full_name || "")}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>{callState.with?.full_name || callState.with?.username || "Unknown"}</div>
              <div style={{ color: "#a78bfa", fontSize: 12, marginTop: 5 }}>
                Incoming {callState.callType === "video" ? "📹 Video" : "📞 Audio"} Call…
              </div>
            </div>
            <div style={{ display: "flex", gap: 28, marginTop: 8 }}>
              {/* Decline */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={rejectCall} style={{ width: 58, height: 58, borderRadius: "50%", background: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(220,38,38,0.5)" }}>
                  <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)" /></svg>
                </button>
                <span style={{ color: "#f87171", fontSize: 11 }}>Decline</span>
              </div>
              {/* Answer */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={answerCall} style={{ width: 58, height: 58, borderRadius: "50%", background: "#22c55e", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(34,197,94,0.5)" }}>
                  {callState.callType === "video"
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="24" height="24" strokeLinecap="round"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="M15 10l5.5-3v10L15 14" /></svg>
                    : <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" /></svg>
                  }
                </button>
                <span style={{ color: "#86efac", fontSize: 11 }}>Answer</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Outgoing Call Modal ── */}
      {callState?.type === "outgoing" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1e1b2e", borderRadius: 24, padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <style>{`@keyframes callpulse{0%,100%{box-shadow:0 0 0 0 rgba(124,58,237,0.5)}50%{box-shadow:0 0 0 20px rgba(124,58,237,0)}}`}</style>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatarColor(callState.with?.full_name || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", color: "white", animation: "callpulse 1.6s infinite" }}>
              {initials(callState.with?.full_name || "")}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>{callState.with?.full_name || callState.with?.username || "Unknown"}</div>
              <div style={{ color: "#a78bfa", fontSize: 12, marginTop: 5 }}>
                {callState.callType === "video" ? "📹 Video" : "📞 Audio"} calling…
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 8 }}>
              <button onClick={endCall} style={{ width: 58, height: 58, borderRadius: "50%", background: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(220,38,38,0.5)" }}>
                <svg viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)" /></svg>
              </button>
              <span style={{ color: "#f87171", fontSize: 11 }}>Cancel</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Call Overlay (video) ── */}
      {callState?.type === "active" && (
        <div style={{ position: "fixed", inset: 0, background: "#0f0d1a", zIndex: 1000, display: "flex", flexDirection: "column" }}>

          {/* Remote video — full screen */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#111" }}
          />

          {/* Fallback avatar when audio-only or no remote video yet */}
          {callState.callType === "audio" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: avatarColor(callState.with?.full_name || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: "bold", color: "white" }}>
                {initials(callState.with?.full_name || "")}
              </div>
              <div style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>{callState.with?.full_name || callState.with?.username || "Unknown"}</div>
              <div style={{ color: "#a78bfa", fontSize: 14 }}>{formatDuration(callDuration)}</div>
            </div>
          )}

          {/* Local video — picture-in-picture */}
          {callState.callType === "video" && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ position: "absolute", bottom: 100, right: 20, width: 140, height: 100, borderRadius: 12, objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)", background: "#222", zIndex: 10 }}
            />
          )}

          {/* Top info bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "20px 24px", background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)", display: "flex", alignItems: "center", gap: 12, zIndex: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: avatarColor(callState.with?.full_name || ""), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white", fontSize: 15 }}>
              {initials(callState.with?.full_name || "")}
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>{callState.with?.full_name || callState.with?.username || "Unknown"}</div>
              <div style={{ color: "#22c55e", fontSize: 12 }}>{formatDuration(callDuration)}</div>
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", display: "flex", alignItems: "center", justifyContent: "center", gap: 20, zIndex: 20 }}>

            {/* Mute */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button onClick={toggleMute} style={{ width: 54, height: 54, borderRadius: "50%", background: callMuted ? "#dc2626" : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                {callMuted
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" /><line x1="3" y1="3" x2="21" y2="21" /></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0014 0M12 19v3M9 22h6" /></svg>
                }
              </button>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{callMuted ? "Unmute" : "Mute"}</span>
            </div>

            {/* End Call */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <button onClick={endCall} style={{ width: 64, height: 64, borderRadius: "50%", background: "#dc2626", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(220,38,38,0.6)" }}>
                <svg viewBox="0 0 24 24" fill="white" width="26" height="26"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" transform="rotate(135 12 12)" /></svg>
              </button>
              <span style={{ color: "#f87171", fontSize: 11 }}>End Call</span>
            </div>

            {/* Camera (video only) */}
            {callState.callType === "video" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <button onClick={toggleCamera} style={{ width: 54, height: 54, borderRadius: "50%", background: callCamOff ? "#dc2626" : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                  {callCamOff
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22" strokeLinecap="round"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="M15 10l5.5-3v10L15 14" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" width="22" height="22" strokeLinecap="round"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="M15 10l5.5-3v10L15 14" /></svg>
                  }
                </button>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{callCamOff ? "Cam On" : "Cam Off"}</span>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
    
  );
}