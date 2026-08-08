import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TopBar from "./TopBar";

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
};

// ── Sidebar Item (from Dashboard) ─────────────────────────────────────────────
function SbItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        color: active ? "white" : "#c8c4e0",
        fontSize: 12,
        cursor: "pointer",
        borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent",
        background: active ? "rgba(124,58,237,0.18)" : "transparent",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

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
function ProfileDrawer({ open, onClose, faculty, prefs, onPrefsChange, isAdmin, mediaCount, fileCount, onAction }) {
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
            <UserInfoRow icon={<Icon.Profile />} label="Employee ID" value={faculty.employee_id} />
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
          </DrawerAccordion>

          <DrawerAccordion title="Customize chat">
            <div style={{ padding: "4px 6px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
              <SelectRow
                label="Chat theme" value={prefs.theme}
                options={[["lavender", "Lavender (default)"], ["ocean", "Ocean"], ["sunset", "Sunset"], ["mono", "Monochrome"]]}
                onChange={v => onPrefsChange({ theme: v })}
              />
              <ToggleRow label="Notifications" checked={prefs.notifications} onChange={v => onPrefsChange({ notifications: v })} />
              <SelectRow
                label="Mute duration" value={prefs.muteDuration} disabled={!prefs.muted}
                options={[["off", "Not muted"], ["1h", "1 hour"], ["8h", "8 hours"], ["24h", "24 hours"], ["forever", "Until turned on"]]}
                onChange={v => onPrefsChange({ muteDuration: v, muted: v !== "off" })}
              />
            </div>
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
            <DrawerListItem icon={<Icon.Block />} label="Block user" danger onClick={() => onAction("block")} />
            <DrawerListItem icon={<Icon.Flag />} label="Report user" danger onClick={() => onAction("report")} />
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

// ════════════════════════════════════════════════════════════════════════════
// MAIN INBOX
// ════════════════════════════════════════════════════════════════════════════
export default function Inbox() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const token = localStorage.getItem("token");
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(currentUser?.role);

  const [activeNav, setActiveNav] = useState("inbox");
  const [tab, setTab] = useState("dm"); // "dm" | "documents"
  const [socket, setSocket] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

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

  // ── Chat settings / profile drawer ──
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [convPrefs, setConvPrefs] = useState({}); // { [userId]: { pinned, muted, notifications, muteDuration, theme } }
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

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    const s = io(API, { auth: { token } });
    setSocket(s);

    s.on("connect", () => { s.emit("register", currentUser.id); });
    s.on("online_users", (ids) => setOnlineUserIds(ids.map(String)));

    s.on("receive_message", (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev => prev.map(c =>
        c.id === msg.sender_id || c.id === msg.receiver_id
          ? { ...c, last_message: msg.content || "📎 File", last_time: msg.created_at }
          : c
      ));
      fetchUnreadCount();
    });

    s.on("receive_document_comment", (comment) => {
      setDocComments(prev => {
        if (prev.find(c => c.id === comment.id)) return prev;
        return [...prev, comment];
      });
    });

    s.on("user_typing", ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(true);
    });
    s.on("user_stop_typing", ({ senderId }) => {
      if (String(senderId) === String(activeConv?.id)) setOtherTyping(false);
    });
    s.on("messages_seen", () => {
      setMessages(prev => prev.map(m => ({ ...m, is_read: 1 })));
    });

    // ── WebRTC Signaling ─────────────────────────────────────────────────────
    // Callee receives offer → show incoming UI, store offer for later
    s.on("call_offer", ({ from, callType, sdp }) => {
      setCallState({ type: "incoming", callType, with: from, remoteSdp: sdp });
    });

    // Caller receives answer → set remote description, go active
    s.on("call_answer", async ({ sdp }) => {
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
      } catch (e) { console.error("set remote answer:", e); }
    });

    // Both sides receive ICE candidates from the other peer
    s.on("ice_candidate", async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current?.remoteDescription) {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    });

    s.on("call_rejected", () => {
      // The person we called rejected — show missed call message
      setCallState(prev => {
        if (prev?.with?.id) {
          const label = prev.callType === "video" ? "📹 Video call" : "📞 Audio call";
          sendSystemMessage(prev.with.id, `${label} · No answer`);
        }
        return prev;
      });
      endCallCleanup();
    });

    s.on("call_ended", () => {
      // Other side ended — show duration if call was active
      setCallState(prev => {
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
        return prev;
      });
      endCallCleanup();
    });

    return () => s.disconnect();
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

  useEffect(() => { fetchConversations(); fetchAllUsers(); fetchUnreadCount(); fetchDocuments(); }, []);

  const authHeaders = { Authorization: `Bearer ${token}` };

  // ── Close the profile/settings drawer on Escape ──
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") setShowProfileDrawer(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

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
      case "pin":
        updateConvPrefs({ pinned: !currentPrefs.pinned });
        break;
      case "mute":
        updateConvPrefs({ muted: !currentPrefs.muted, muteDuration: !currentPrefs.muted ? "forever" : "off" });
        break;
      case "mark_unread":
        // TODO: wire to a backend "mark unread" endpoint once available
        setConversations(prev => prev.map(c => (c.id === activeConv.id ? { ...c, unread_count: Math.max(1, c.unread_count || 0) } : c)));
        break;
      case "clear_chat":
        if (window.confirm(`Clear chat history with ${activeConv.full_name}? This cannot be undone.`)) {
          try {
            await fetch(`${API}/api/chat/messages/${activeConv.id}/clear`, { method: "DELETE", headers: authHeaders });
          } catch (e) { console.error("clear_chat:", e); }
          setMessages([]);
        }
        break;
      case "block":
        if (window.confirm(`Block ${activeConv.full_name}? You will no longer receive messages from them.`)) {
          try {
            await fetch(`${API}/api/chat/block/${activeConv.id}`, { method: "POST", headers: authHeaders });
          } catch (e) { console.error("block:", e); }
        }
        break;
      case "report": {
        const reason = window.prompt(`Report ${activeConv.full_name} — briefly describe the issue:`);
        if (reason) {
          try {
            await fetch(`${API}/api/chat/report`, {
              method: "POST",
              headers: { ...authHeaders, "Content-Type": "application/json" },
              body: JSON.stringify({ userId: activeConv.id, reason }),
            });
          } catch (e) { console.error("report:", e); }
        }
        break;
      }
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

  const openConversation = async (user) => {
    setActiveConv(user);
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
      setConversations(prev => prev.find(c => c.id === user.id) ? prev : [{ ...user, unread_count: 0, last_message: "", last_time: null }, ...prev]);
    }
  };

  const sendDm = async () => {
    if (!activeConv || (!dmInput.trim() && !dmFile)) return;
    const fd = new FormData();
    if (dmInput.trim()) fd.append("content", dmInput.trim());
    if (dmFile) fd.append("file", dmFile);
    const res = await fetch(`${API}/api/chat/messages/${activeConv.id}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const msg = await res.json();
      socket?.emit("send_message", { senderId: currentUser.id, receiverId: activeConv.id, message: msg });
      setDmInput(""); setDmFile(null);
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
  const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

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
  const sendSystemMessage = async (receiverId, content) => {
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
        socket?.emit("send_message", { senderId: currentUser.id, receiverId, message: msg });
      }
    } catch (e) { console.error("sendSystemMessage:", e); }
  };

  const startCall = async (callType) => {
    if (!activeConv || !socket) return;
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

      // ← system message: call initiated
      const callTypeLabel = callType === "video" ? "📹 Video call" : "📞 Audio call";
      await sendSystemMessage(activeConv.id, `${callTypeLabel} started`);
    } catch (e) {
      console.error("startCall:", e);
      endCallCleanup();
    }
  };

  const answerCall = async () => {
    if (!callState?.remoteSdp || !socket) return;
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
      callStartTimeRef.current = Date.now(); // ← track when call became active
    } catch (e) {
      console.error("answerCall:", e);
      endCallCleanup();
    }
  };

  const rejectCall = () => {
    const otherId = callState?.with?.id;
    const otherName = callState?.with?.full_name || callState?.with?.username || "User";
    socket?.emit("call_rejected", { to: otherId });
    // system message to both sides
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
    callStartTimeRef.current = null; // ← reset call start time
    // Reset UI state
    setCallState(null);
    setCallDuration(0);
    setCallMuted(false);
    setCallCamOff(false);
    clearInterval(callTimerRef.current);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const displayName = currentUser.username || "User";

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="path-inbox-app" style={{ display: "flex", height: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
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
      `}</style>

      {/* ── Dashboard Sidebar ── */}
      <div style={{
        width: 200, background: "#1e1b2e", color: "#c8c4e0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        {/* Nav */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={true} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
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

      {/* ── Main content area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "white" }}>

        {/* ── Top Bar ── */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f5f5f8", border: "0.5px solid #e5e7eb", borderRadius: 8, padding: "7px 12px", fontSize: 12, color: "#999" }}>
              <Icon.Search />
              <input
                type="text"
                placeholder="Search messages, documents..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#333", width: "100%" }}
              />
            </div>
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus /> New Document
            </button>
            <button onClick={() => navigate("/documents/new")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Download /> Intake Document
            </button>
          </div>
        </TopBar>

        {/* ── Inbox Body ── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* ── Left sidebar: conversation list ── */}
          <div style={{ width: 280, borderRight: "0.5px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0 }}>

            {/* Header */}
            <div style={{ padding: "14px 16px", borderBottom: "0.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontWeight: "bold", fontSize: 15, color: "#111" }}>
                  Inbox
                  {unreadTotal > 0 && (
                    <span style={{ marginLeft: 8, background: "#7c3aed", color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 10, fontWeight: "bold" }}>
                      {unreadTotal}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setShowNewChat(true)}
                  title="New message"
                  style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="12" height="12"><path d="M8 1v14M1 8h14" /></svg>
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {[["dm", "💬 Messages"], ["documents", "📄 Documents"]].map(([key, label]) => (
                  <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: "bold", background: tab === key ? "#ede9fe" : "transparent", color: tab === key ? "#7c3aed" : "#888" }}>
                    {label}
                  </button>
                ))}
              </div>
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

            {/* Conversation / Document list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {tab === "dm" ? (
                conversations.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                    No conversations yet.<br />
                    <span onClick={() => setShowNewChat(true)} style={{ color: "#7c3aed", cursor: "pointer", fontWeight: "bold" }}>Start one →</span>
                  </div>
                ) : conversations.map(conv => (
                  <div key={conv.id} onClick={() => openConversation(conv)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", borderBottom: "0.5px solid #f5f5f5", background: activeConv?.id === conv.id ? "#faf5ff" : "white" }}
                    onMouseEnter={e => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = "#fafafa"; }}
                    onMouseLeave={e => { if (activeConv?.id !== conv.id) e.currentTarget.style.background = "white"; }}
                  >
                    <Avatar name={conv.full_name} size={36} online={onlineUserIds.includes(String(conv.id))} photoUrl={conv.photo ? resolveUrl(conv.photo) : null} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", fontSize: 12, color: "#111" }}>{conv.full_name}</span>
                        <span style={{ fontSize: 10, color: "#aaa" }}>{conv.last_time ? formatTime(conv.last_time) : ""}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                          {conv.last_sender_id === currentUser.id ? "You: " : ""}{conv.last_message || "📎 File"}
                        </span>
                        {conv.unread_count > 0 && (
                          <span style={{ background: "#7c3aed", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: 9, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
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
          </div>

          {/* ── Right: chat window ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

            {/* No active conversation */}
            {!activeConv && !activeDoc && (
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
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: "0.5px solid #e5e7eb", background: "white" }}>
                  <Avatar name={activeConv.full_name} size={36} online={onlineUserIds.includes(String(activeConv.id))} photoUrl={activeConv.photo ? resolveUrl(activeConv.photo) : null} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 13, color: "#111" }}>{activeConv.full_name}</div>
                    <div style={{ fontSize: 11, color: onlineUserIds.includes(String(activeConv.id)) ? "#22c55e" : "#aaa" }}>
                      {onlineUserIds.includes(String(activeConv.id)) ? "Online" : "Offline"} · {activeConv.department}
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
                <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, background: "#fafafa" }}>
                  {messages.map((msg, i) => {
                    const isMine = String(msg.sender_id) === String(currentUser.id);
                    const isFirstInGroup = i === 0 || messages[i - 1]?.sender_id !== msg.sender_id;
                    const isSearchMatch = !messageSearchOpen || !messageSearchQuery || (msg.content || "").toLowerCase().includes(messageSearchQuery.toLowerCase());
                    const isLastInGroup = i === messages.length - 1 || messages[i + 1]?.sender_id !== msg.sender_id;

                    // ── System / call event message ──────────────────────────
                    if (msg.is_system) {
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: "center", marginTop: 10, marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0f0f5", borderRadius: 20, padding: "4px 14px", fontSize: 11, color: "#888", fontStyle: "italic", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                            <span>{msg.content}</span>
                            <span style={{ fontSize: 9, color: "#bbb", flexShrink: 0 }}>{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} style={{ display: "flex", flexDirection: isMine ? "row-reverse" : "row", alignItems: "flex-start", gap: 8, marginTop: isFirstInGroup ? 10 : 2, opacity: isSearchMatch ? 1 : 0.32, transition: "opacity 0.15s" }}>

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
                          <div style={{ background: isMine ? "#7c3aed" : "white", color: isMine ? "white" : "#111", padding: "8px 12px", borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 13, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", wordBreak: "break-word" }}>
                            {msg.content && <div>{msg.content}</div>}
                            {msg.file_url && <FileAttachment url={msg.file_url} name={msg.file_name} />}
                          </div>
                          <div style={{ fontSize: 10, color: "#bbb", marginTop: 2, textAlign: isMine ? "right" : "left", display: "flex", alignItems: "center", justifyContent: isMine ? "flex-end" : "flex-start", gap: 4 }}>
                            {formatTime(msg.created_at)}
                            {isMine && (
                              <span style={{ color: msg.is_read ? "#7c3aed" : "#ccc" }}>
                                {msg.is_read ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
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

                {/* File preview */}
                {dmFile && (
                  <div style={{ padding: "6px 18px", background: "#faf5ff", borderTop: "0.5px solid #e5e7eb", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ color: "#7c3aed" }}>📎 {dmFile.name}</span>
                    <button onClick={() => { setDmFile(null); dmFileRef.current.value = ""; }} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 }}>×</button>
                  </div>
                )}

                {/* Input */}
                <div style={{ padding: "10px 16px", borderTop: "0.5px solid #e5e7eb", display: "flex", gap: 8, alignItems: "flex-end", background: "white" }}>
                  <input type="file" ref={dmFileRef} style={{ display: "none" }} onChange={e => setDmFile(e.target.files[0])} />
                  <button onClick={() => dmFileRef.current.click()} title="Attach file" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e5e7eb", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", flexShrink: 0 }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M13 8l-5 5a3.5 3.5 0 01-5-5L8 3a2 2 0 013 3L7 10a.5.5 0 01-1-1l4-4" strokeLinecap="round" /></svg>
                  </button>
                  <textarea
                    value={dmInput}
                    onChange={e => handleDmInput(e.target.value)}
                    onKeyDown={e => handleKey(e, sendDm)}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    style={{ flex: 1, padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, outline: "none", resize: "none", fontFamily: "inherit", lineHeight: 1.5, maxHeight: 100, overflowY: "auto" }}
                  />
                  <button onClick={sendDm} disabled={!dmInput.trim() && !dmFile} style={{ width: 34, height: 34, borderRadius: 8, border: "none", background: "#7c3aed", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !dmInput.trim() && !dmFile ? 0.5 : 1 }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M1 1l14 7-14 7V9l10-2L1 5V1z" /></svg>
                  </button>
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
                employee_id: activeConv.employee_id,
                department: activeConv.department,
                position: activeConv.position || activeConv.role_label,
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
              onAction={handleChatMenuAction}
            />
          )}
        </div>
      </div>

      {/* ── Always-mounted remote audio element — must exist before ontrack fires ── */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* ── Incoming Call Modal ── */}
      {callState?.type === "incoming" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1e1b2e", borderRadius: 24, padding: "40px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minWidth: 300, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: avatarColor(callState.with?.full_name || ""), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: "bold", color: "white", boxShadow: "0 0 0 8px rgba(124,58,237,0.15)" }}>
              {initials(callState.with?.full_name || "")}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>{callState.with?.full_name}</div>
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
              <div style={{ color: "white", fontWeight: "bold", fontSize: 17 }}>{callState.with?.full_name}</div>
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
              <div style={{ color: "white", fontWeight: "bold", fontSize: 20 }}>{callState.with?.full_name}</div>
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
              <div style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>{callState.with?.full_name}</div>
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