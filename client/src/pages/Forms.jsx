import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io as socketIO } from "socket.io-client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const API = import.meta.env.VITE_API_URL;
// Attachments/submissions now store full R2 URLs (https://...). Older rows
// created before the R2 migration may still have local paths like
// "/uploads/forms/xyz.pdf" — those still need the API host prepended.
const resolveFileUrl = (u) =>
  !u
    ? ""
    : /^https?:\/\//i.test(u)
      ? u
      : `${API || "http://localhost:5000"}${u}`;

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

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
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path
        d="M2 2h8l3 3v9H2V2z"
        fillOpacity=".15"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
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
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
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
  Download: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" />
    </svg>
  ),
  Upload: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="20"
      height="20"
    >
      <path
        d="M8 10V2M5 5l3-3 3 3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" strokeLinecap="round" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="#059669"
      strokeWidth="2"
      width="14"
      height="14"
    >
      <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
    </svg>
  ),
  X: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="12"
      height="12"
    >
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  ),
  Eye: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  Pencil: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <path
        d="M11 2l3 3-8 8-3.5.5.5-3.5 8-8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  File: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="#7c3aed"
      strokeWidth="1.5"
      width="28"
      height="28"
    >
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M10 2v4h4" />
    </svg>
  ),
  ExportCSV: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path d="M9 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V6L9 2z" />
      <path d="M9 2v4h4" />
      <path d="M5 9h6M5 11.5h4" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
      <path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" />
    </svg>
  ),
  Info: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="#7c3aed"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" strokeLinecap="round" />
    </svg>
  ),
  Tip: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="#7c3aed"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" strokeLinecap="round" />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1a5 5 0 015 5v3l1.5 2H1.5L3 9V6a5 5 0 015-5zM6.5 13a1.5 1.5 0 003 0H6.5z" />
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
  InfoCircle: ({ color = "#7c3aed", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 7.2v4M8 5v.2" strokeLinecap="round" />
    </svg>
  ),
  DynamicForm: ({ color = "#7c3aed", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M4 6h4M4 8.5h6M4 11h3" strokeLinecap="round" />
    </svg>
  ),
  AttachFile: ({ color = "#7c3aed", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <path
        d="M11.5 5.5l-5 5a2 2 0 102.8 2.8l5-5a3.5 3.5 0 10-5-5l-5 5a5 5 0 007 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Notes: ({ color = "#7c3aed", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M5 6h6M5 8.5h6M5 11h3" strokeLinecap="round" />
    </svg>
  ),
  Send: ({ color = "white", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <path
        d="M14.5 1.5L7 9M14.5 1.5L10 14.5l-3-5.5-5.5-3 13-4.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Chevron: ({ color = "#6b7280", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trash: ({ color = "currentColor", size = 16 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      width={size}
      height={size}
    >
      <path
        d="M2.5 4h11M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4m1.5 0l-.6 9.4a1 1 0 01-1 .9H5.1a1 1 0 01-1-.9L3.5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  CloudUpload: ({ color = "#7c3aed", size = 26 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      width={size}
      height={size}
    >
      <path
        d="M4.5 11.5a2.5 2.5 0 01-.5-4.95A3.5 3.5 0 0111 5.6a2.75 2.75 0 01-.3 5.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 9.5V5M6.2 6.8L8 5l1.8 1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ── Shared field styling helpers (outline / focus-ring to match the design system) ─────────────
const fieldBase = {
  border: "1px solid #e5e7eb",
  background: "white",
  transition: "border-color .15s, box-shadow .15s",
};
const onFieldFocus = (e) => {
  e.target.style.borderColor = "#7c3aed";
  e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15)";
};
const onFieldBlur = (e) => {
  e.target.style.borderColor = "#e5e7eb";
  e.target.style.boxShadow = "none";
};

// File-type badge (icon + color) for attachment cards, mirroring the mockup's PDF/DOCX styling
function fileTypeMeta(name = "") {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf")
    return {
      bg: "#ffdad6",
      color: "#ba1a1a",
      icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" />,
    };
  if (["doc", "docx"].includes(ext))
    return {
      bg: "#eaddff",
      color: "#5a00c6",
      icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" />,
    };
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return {
      bg: "#d1fae5",
      color: "#065f46",
      icon: <path d="M2 3h12v10H2z M5 8l2 2 3-4 4 5H2z" />,
    };
  return {
    bg: "#f3f4f6",
    color: "#6b7280",
    icon: <path d="M4 2h5l3 3v9H4V2z M9 2v3h3" />,
  };
}
function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initialsFor(name = "Faculty") {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("") || "FA"
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Approved: {
      bg: "#d1fae5",
      color: "#065f46",
      border: "#a7f3d0",
      dot: "#10b981",
    },
    Pending: {
      bg: "#fef9c3",
      color: "#854d0e",
      border: "#fef08a",
      dot: "#eab308",
    },
    Rejected: {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
      dot: "#ef4444",
    },
    Draft: {
      bg: "#f3f4f6",
      color: "#374151",
      border: "#e5e7eb",
      dot: "#9ca3af",
    },
    Reviewing: {
      bg: "#ede9fe",
      color: "#5b21b6",
      border: "#ddd6fe",
      dot: "#8b5cf6",
    },
    Revision: {
      bg: "#fee2e2",
      color: "#991b1b",
      border: "#fecaca",
      dot: "#ef4444",
    },
  };
  const s = map[status] || map.Draft;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        padding: "3px 10px 3px 8px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
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
function Avatar({ name = "", src = null, size = 26 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: "1px solid #cbc3d7",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: palette.bg,
        color: palette.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Stat Card (bento style, matches Audit Logs overview cards) ────────────────
function StatCard({
  label,
  value,
  delta,
  deltaType = "neutral",
  icon,
  bg,
  iconColor,
  danger,
}) {
  const deltaColor =
    deltaType === "up"
      ? "#6b38d4"
      : deltaType === "down"
        ? "#ba1a1a"
        : "#494454";
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
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          "0 12px 24px -12px rgba(107,56,212,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Accent blur */}
      <div
        style={{
          position: "absolute",
          right: -16,
          top: -16,
          width: 96,
          height: 96,
          borderRadius: "50%",
          background: bg,
          filter: "blur(32px)",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#494454",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <span
          style={{ color: danger ? "#ba1a1a" : iconColor, display: "flex" }}
        >
          {icon}
        </span>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <span
          style={{
            display: "block",
            fontSize: 36,
            fontWeight: 700,
            lineHeight: 1.15,
            color: danger ? "#ba1a1a" : "#181445",
          }}
        >
          {value ?? "—"}
        </span>
        {delta && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              fontSize: 12,
              fontWeight: 500,
              color: deltaColor,
            }}
          >
            {deltaType === "up" && (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path
                  d="M2 12l4-4 3 3 5-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 5h4v4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {deltaType === "down" && (
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                width="12"
                height="12"
              >
                <path d="M8 1.5l7 12h-14l7-12z" strokeLinejoin="round" />
                <path d="M8 6.5v3.5M8 11.75h.01" strokeLinecap="round" />
              </svg>
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: 28,
          width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3
            style={{ fontSize: 16, fontWeight: 800, color: "#111", margin: 0 }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
              padding: 4,
            }}
          >
            <Icon.X />
          </button>
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
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === "success"
                ? "#059669"
                : t.type === "info"
                  ? "#7c3aed"
                  : "#dc2626",
            color: "white",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 280,
            maxWidth: 360,
            animation: "slideIn 0.2s ease",
          }}
        >
          <span style={{ fontSize: 16 }}>
            {t.type === "success" ? "✓" : t.type === "info" ? "🔔" : "✕"}
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function FacultySubmissionsWorkspace({
  forms,
  stats,
  loading,
  search,
  onSearch,
  onStartSubmission,
  onResubmit,
  onActivity,
  page,
  totalPages,
  onPageChange,
  onLogout,
  toasts,
  onDismissToast,
}) {
  const [filter, setFilter] = useState("All");
  const [selectedId, setSelectedId] = useState("");
  const matchesFilter = (row) => {
    if (filter === "All") return true;
    if (filter === "In review") return /pending|review/i.test(row.status || "");
    if (filter === "Returned") return /revision|return/i.test(row.status || "");
    return new RegExp(filter, "i").test(row.status || "");
  };
  const visible = forms.filter(matchesFilter);
  const selected =
    visible.find((row) => String(row.id) === String(selectedId)) ||
    visible[0] ||
    forms[0] ||
    null;
  const titleFor = (row) =>
    row?.file_name ||
    row?.title ||
    row?.tracking_id ||
    `Submission #${row?.id}`;
  const typeFor = (row) =>
    row?.category || row?.document_type || "Academic form";
  const statusFor = (row) => row?.status || "Draft";
  const nextStep = (row) => {
    const status = statusFor(row);
    if (/revision|return/i.test(status)) return "Update and resubmit";
    if (/approved/i.test(status)) return "Workflow complete";
    if (/reject/i.test(status)) return "Decision recorded";
    if (/review|pending/i.test(status)) return "With reviewer";
    return "Complete draft";
  };
  const statusClass = (status) =>
    /revision|return/i.test(status)
      ? "returned"
      : /approved/i.test(status)
        ? "approved"
        : /reject/i.test(status)
          ? "rejected"
          : /review|pending/i.test(status)
            ? "review"
            : "draft";

  return (
    <div className="faculty-submissions-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        *{box-sizing:border-box}.faculty-submissions-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#46394f;font-family:'DM Sans',sans-serif}.faculty-submissions-main{min-width:0;flex:1}.faculty-submissions-page{max-width:1360px;margin:0 auto;padding:30px 28px 48px}.faculty-submissions-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:0 13px 24px;border-bottom:1px solid #e6dfee}.faculty-submissions-kicker{display:flex;align-items:center;gap:8px;color:#988da0;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.faculty-submissions-kicker i{width:6px;height:6px;border-radius:50%;background:#b595e8}.faculty-submissions-hero h1{margin:8px 0 7px;color:#34283d;font:800 clamp(31px,3vw,42px) Manrope,sans-serif;letter-spacing:-.06em;line-height:1}.faculty-submissions-hero p{max-width:620px;margin:0;color:#8f8398;font-size:11px;line-height:1.6}.faculty-submissions-insight{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #e9e0f2;border-radius:10px;background:#fff}.faculty-submissions-insight>i{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#eee6fc;color:#7543c7;font-style:normal}.faculty-submissions-insight strong,.faculty-submissions-insight small{display:block}.faculty-submissions-insight strong{color:#5d4e66;font-size:9px;font-weight:800}.faculty-submissions-insight small{margin-top:3px;color:#9e92a4;font-size:8px}.faculty-submissions-start{display:inline-flex;min-height:36px;align-items:center;gap:7px;border:0;border-radius:8px;padding:0 13px;background:#7c3aed;color:#fff;font-size:10px;font-weight:800;box-shadow:0 8px 16px rgba(124,58,237,.22);cursor:pointer}.faculty-submissions-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-top:20px}.faculty-submissions-stat{position:relative;min-height:105px;overflow:hidden;border:1px solid #e6dfee;border-radius:11px;padding:15px;background:#fff;box-shadow:0 9px 22px rgba(54,36,87,.04)}.faculty-submissions-stat:after{position:absolute;right:-24px;top:-29px;width:88px;height:88px;border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,.42),rgba(196,181,253,.08) 58%,transparent 70%);content:''}.faculty-submissions-stat.returned:after{background:radial-gradient(circle,rgba(224,168,104,.32),rgba(255,239,210,.1) 58%,transparent 70%)}.faculty-submissions-stat span{display:block;color:#988d9f;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.faculty-submissions-stat strong{display:block;margin-top:16px;color:#3e3047;font:800 26px Manrope,sans-serif;letter-spacing:-.06em}.faculty-submissions-stat small{display:block;margin-top:5px;color:#8f8399;font-size:8px}.faculty-submissions-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:21px;padding:18px 20px;border:1px solid #e6dfee;border-radius:11px;background:#fff}.faculty-submissions-toolbar-label{color:#978b9e;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.faculty-submissions-toolbar h2{margin:5px 0 0;color:#44354d;font:800 18px Manrope,sans-serif;letter-spacing:-.04em}.faculty-submissions-toolbar h2 span{display:inline-grid;min-width:20px;height:18px;margin-left:5px;place-items:center;border-radius:5px;background:#f0e9fc;color:#7543c7;font:800 8px 'DM Sans',sans-serif;vertical-align:middle}.faculty-submissions-toolbar p{margin:5px 0 0;color:#9c92a3;font-size:9px}.faculty-submissions-controls{display:flex;align-items:center;gap:9px}.faculty-submissions-search{display:flex;width:205px;align-items:center;gap:7px;padding:8px 10px;border:1px solid #ebe5f0;border-radius:7px;color:#8b8292}.faculty-submissions-search input{width:100%;border:0;outline:0;background:transparent;color:#5d5265;font-size:9px}.faculty-submissions-filters{display:flex;gap:4px}.faculty-submissions-filters button{min-height:30px;border:1px solid #e8e2ed;border-radius:6px;padding:0 8px;background:#fff;color:#978c9e;font-size:8px;font-weight:700;cursor:pointer}.faculty-submissions-filters button.active{border-color:#d9c8f4;background:#faf8fe;color:#7543c7}.faculty-submissions-layout{display:grid;grid-template-columns:minmax(0,1.58fr) minmax(285px,.72fr);gap:16px;margin-top:16px}.faculty-submissions-ledger,.faculty-submissions-detail{overflow:hidden;border:1px solid #e5deed;border-radius:11px;background:#fff;box-shadow:0 12px 30px rgba(57,36,93,.045)}.faculty-submissions-table-head,.faculty-submission-row{display:grid;grid-template-columns:minmax(220px,1.35fr) minmax(110px,.66fr) 120px 18px;gap:12px;align-items:center}.faculty-submissions-table-head{padding:10px 19px;border-bottom:1px solid #f0edf4;background:#fbf9fd;color:#aaa0ad;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.faculty-submission-row{width:100%;min-height:79px;padding:12px 19px;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer;transition:background .16s ease,box-shadow .16s ease}.faculty-submission-row:hover,.faculty-submission-row.selected{background:#fbf9ff}.faculty-submission-row.selected{box-shadow:inset 2px 0 #7c3aed}.faculty-submission-document{display:flex;min-width:0;align-items:center;gap:10px}.faculty-submission-icon{display:grid;flex:0 0 auto;width:32px;height:32px;place-items:center;border-radius:9px;background:#eee8fb;color:#7750c4;font-size:14px}.faculty-submission-icon.returned{background:#fff1e9;color:#c2745a}.faculty-submission-copy{display:flex;min-width:0;flex-direction:column;gap:4px}.faculty-submission-copy strong{overflow:hidden;color:#51405a;font:800 10px Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.faculty-submission-copy small{overflow:hidden;color:#a097a6;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.faculty-submission-copy small i{font-style:normal;color:#7a4bc1}.faculty-submission-status{display:flex;flex-direction:column;gap:5px}.faculty-submission-status b{width:max-content;border-radius:5px;padding:4px 6px;font-size:7px}.faculty-submission-status b.review{background:#f0e9fc;color:#7543c7}.faculty-submission-status b.returned{background:#fff4df;color:#a2762c}.faculty-submission-status b.approved{background:#e9f6ef;color:#4b8e70}.faculty-submission-status b.rejected{background:#fff0ed;color:#b5685d}.faculty-submission-status b.draft{background:#f1eef4;color:#7d7187}.faculty-submission-status small{color:#a095a5;font-size:8px}.faculty-submission-next strong{display:block;color:#6a5c73;font-size:9px}.faculty-submission-next small{display:block;margin-top:4px;color:#a198a5;font-size:8px}.faculty-submission-chevron{color:#a797b0;font-size:15px}.faculty-submissions-empty{display:flex;min-height:205px;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:25px;color:#9d92a2;text-align:center}.faculty-submissions-empty strong{color:#6a5d73;font:800 12px Manrope,sans-serif}.faculty-submissions-empty span{font-size:9px}.faculty-submissions-detail{padding:19px}.faculty-submissions-detail-head{display:flex;align-items:flex-start;justify-content:space-between}.faculty-submissions-detail h3{margin:6px 0 0;color:#44354d;font:800 17px Manrope,sans-serif;letter-spacing:-.04em}.faculty-submissions-detail>p{margin:9px 0 0;color:#9c92a3;font-size:9px;line-height:1.5}.faculty-submissions-title{display:flex;align-items:center;gap:10px;margin-top:18px;padding-bottom:15px;border-bottom:1px solid #eee9f1}.faculty-submissions-avatar{display:grid;width:31px;height:31px;place-items:center;border-radius:9px;background:#eee7fd;color:#7543c7;font-size:8px;font-weight:800}.faculty-submissions-title strong{display:block;color:#51405a;font:800 10px Manrope,sans-serif}.faculty-submissions-title span{display:block;margin-top:3px;color:#9c92a3;font-size:8px}.faculty-submissions-status-card{margin-top:14px;padding:12px;border:1px solid #e8dff0;border-radius:8px;background:#fbf9ff}.faculty-submissions-status-card span{display:block;color:#a198a6;font-size:8px}.faculty-submissions-status-card strong{display:block;margin-top:5px;color:#614f6b;font:800 12px Manrope,sans-serif}.faculty-submissions-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.faculty-submissions-meta span{display:block;color:#aaa0ad;font-size:8px}.faculty-submissions-meta strong{display:block;margin-top:4px;overflow:hidden;color:#695b72;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.faculty-submissions-note{display:flex;gap:8px;margin-top:15px;padding:10px;border:1px solid #e3d8f3;border-radius:8px;background:#fbf9ff;color:#7543c7}.faculty-submissions-note i{display:grid;flex:0 0 auto;width:23px;height:23px;place-items:center;border-radius:7px;background:#eee7fd;font-style:normal}.faculty-submissions-note strong{display:block;color:#6a5c73;font-size:9px}.faculty-submissions-note span{display:block;margin-top:3px;color:#958b9d;font-size:8px;line-height:1.4}.faculty-submissions-actions{display:flex;flex-direction:column;gap:7px;margin-top:16px}.faculty-submissions-actions button{min-height:32px;border:1px solid #e2d7ee;border-radius:7px;background:#fff;color:#725f7e;font-size:9px;font-weight:800;cursor:pointer}.faculty-submissions-actions button.primary{border-color:#7c3aed;background:#7c3aed;color:#fff}.faculty-submissions-actions button.return{border-color:#edd9c0;background:#fffdf8;color:#a47b3a}@media(max-width:1050px){.faculty-submissions-layout{grid-template-columns:1fr}.faculty-submissions-detail{min-height:0}}@media(max-width:760px){.faculty-submissions-page{padding:22px 14px 34px}.faculty-submissions-hero{align-items:flex-start;flex-direction:column}.faculty-submissions-insight{max-width:100%}.faculty-submissions-stats{grid-template-columns:1fr 1fr;gap:9px}.faculty-submissions-stat{min-height:96px;padding:12px}.faculty-submissions-stat strong{margin-top:11px;font-size:23px}.faculty-submissions-toolbar{align-items:stretch;flex-direction:column}.faculty-submissions-controls{flex-wrap:wrap}.faculty-submissions-search{width:100%}.faculty-submissions-filters{overflow-x:auto;padding-bottom:2px}.faculty-submissions-table-head{display:none}.faculty-submission-row{grid-template-columns:minmax(0,1fr) auto;gap:8px}.faculty-submission-status{grid-column:2;grid-row:1}.faculty-submission-next{grid-column:1}.faculty-submission-chevron{display:none}}
      `}</style>
      <Toast toasts={toasts} onDismiss={onDismissToast} />
      <Sidebar activePage="forms" />
      <main className="faculty-submissions-main">
        <TopBar onLogout={onLogout} />
        <div className="faculty-submissions-page">
          <section className="faculty-submissions-hero">
            <div>
              <div className="faculty-submissions-kicker">
                <i /> Faculty workspace · your document register
              </div>
              <h1>Submissions</h1>
              <p>
                Create, monitor, and prepare the forms that move through your
                department’s review workflow.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div className="faculty-submissions-insight">
                <i>▤</i>
                <span>
                  <strong>Submission health</strong>
                  <small>
                    {
                      forms.filter((row) =>
                        /revision|return/i.test(row.status || ""),
                      ).length
                    }{" "}
                    record needs an update
                  </small>
                </span>
              </div>
              <button
                className="faculty-submissions-start"
                type="button"
                onClick={onStartSubmission}
              >
                <Icon.Plus color="white" size={15} /> Start a submission
              </button>
            </div>
          </section>
          <section className="faculty-submissions-stats">
            <article className="faculty-submissions-stat">
              <span>All submissions</span>
              <strong>
                {String(stats.total || forms.length).padStart(2, "0")}
              </strong>
              <small>Across your active and completed work</small>
            </article>
            <article className="faculty-submissions-stat">
              <span>In review</span>
              <strong>
                {String(
                  stats.pending ||
                    forms.filter((row) =>
                      /pending|review/i.test(row.status || ""),
                    ).length,
                ).padStart(2, "0")}
              </strong>
              <small>Currently with a reviewer</small>
            </article>
            <article className="faculty-submissions-stat">
              <span>Approved</span>
              <strong>
                {String(
                  stats.approved ||
                    forms.filter((row) => /approved/i.test(row.status || ""))
                      .length,
                ).padStart(2, "0")}
              </strong>
              <small>Completed workflow records</small>
            </article>
            <article className="faculty-submissions-stat returned">
              <span>Returned</span>
              <strong>
                {String(
                  forms.filter((row) =>
                    /revision|return/i.test(row.status || ""),
                  ).length,
                ).padStart(2, "0")}
              </strong>
              <small>Needs your update</small>
            </article>
          </section>
          <section className="faculty-submissions-toolbar">
            <div>
              <div className="faculty-submissions-toolbar-label">
                Your document register
              </div>
              <h2>
                All submissions <span>{visible.length}</span>
              </h2>
              <p>
                Choose a record to see its status, next handoff, and available
                action.
              </p>
            </div>
            <div className="faculty-submissions-controls">
              <label className="faculty-submissions-search">
                <Icon.Search />
                <input
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder="Search submissions"
                />
              </label>
              <div className="faculty-submissions-filters">
                {["All", "In review", "Returned", "Approved"].map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={filter === item ? "active" : ""}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section className="faculty-submissions-layout">
            <article className="faculty-submissions-ledger">
              <div className="faculty-submissions-table-head">
                <span>Document</span>
                <span>Status</span>
                <span>Next handoff</span>
                <span />
              </div>
              {loading ? (
                <div className="faculty-submissions-empty">
                  <strong>Loading your submissions…</strong>
                </div>
              ) : visible.length ? (
                visible.map((row) => {
                  const status = statusFor(row);
                  const tone = statusClass(status);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`faculty-submission-row ${String(selected?.id) === String(row.id) ? "selected" : ""}`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <span className="faculty-submission-document">
                        <i className={`faculty-submission-icon ${tone}`}>▤</i>
                        <span className="faculty-submission-copy">
                          <strong>{titleFor(row)}</strong>
                          <small>
                            <i>{row.tracking_id || `FORM-${row.id}`}</i> ·{" "}
                            {typeFor(row)}
                          </small>
                        </span>
                      </span>
                      <span className="faculty-submission-status">
                        <b className={tone}>{status}</b>
                        <small>
                          {row.updated_at ||
                            row.filing_date ||
                            "Recently updated"}
                        </small>
                      </span>
                      <span className="faculty-submission-next">
                        <strong>{nextStep(row)}</strong>
                        <small>
                          {row.review_due || row.deadline || "No deadline"}
                        </small>
                      </span>
                      <span className="faculty-submission-chevron">›</span>
                    </button>
                  );
                })
              ) : (
                <div className="faculty-submissions-empty">
                  <strong>No submissions match this view</strong>
                  <span>Try another status or clear your search.</span>
                </div>
              )}
            </article>
            <aside className="faculty-submissions-detail">
              {selected ? (
                <>
                  <div className="faculty-submissions-detail-head">
                    <div>
                      <div className="faculty-submissions-toolbar-label">
                        Selected submission
                      </div>
                      <h3>Submission details</h3>
                    </div>
                  </div>
                  <p>
                    Keep each submission complete and ready for its next
                    workflow handoff.
                  </p>
                  <div className="faculty-submissions-title">
                    <span className="faculty-submissions-avatar">
                      {initialsFor(
                        selected.full_name ||
                          selected.submitter_name ||
                          "Faculty",
                      )}
                    </span>
                    <div>
                      <strong>{titleFor(selected)}</strong>
                      <span>
                        {selected.tracking_id || selected.id} ·{" "}
                        {selected.file_name || "Document record"}
                      </span>
                    </div>
                  </div>
                  <div className="faculty-submissions-status-card">
                    <span>Current status</span>
                    <strong>{statusFor(selected)}</strong>
                  </div>
                  <div className="faculty-submissions-meta">
                    <div>
                      <span>Submitter</span>
                      <strong>
                        {selected.full_name || selected.submitter_name || "You"}
                      </strong>
                    </div>
                    <div>
                      <span>Reviewer</span>
                      <strong>
                        {selected.reviewer_name ||
                          selected.current_owner ||
                          "Review team"}
                      </strong>
                    </div>
                    <div>
                      <span>Form type</span>
                      <strong>{typeFor(selected)}</strong>
                    </div>
                    <div>
                      <span>Next handoff</span>
                      <strong>{nextStep(selected)}</strong>
                    </div>
                  </div>
                  <div className="faculty-submissions-note">
                    <i>i</i>
                    <div>
                      <strong>Submission note</strong>
                      <span>
                        {selected.review_note ||
                          selected.remarks ||
                          "Your document remains connected to its workflow history and review updates."}
                      </span>
                    </div>
                  </div>
                  <div className="faculty-submissions-actions">
                    {statusClass(statusFor(selected)) === "returned" ? (
                      <button
                        className="return"
                        type="button"
                        onClick={() => onResubmit(selected)}
                      >
                        Update and resubmit
                      </button>
                    ) : (
                      <button
                        className="primary"
                        type="button"
                        onClick={() => onActivity(selected)}
                      >
                        View activity
                      </button>
                    )}
                    <button type="button" onClick={onStartSubmission}>
                      Start another submission
                    </button>
                  </div>
                </>
              ) : (
                <div className="faculty-submissions-empty">
                  <strong>Your register is clear</strong>
                  <span>
                    Start a submission to create your first document record.
                  </span>
                </div>
              )}
            </aside>
          </section>
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 18,
              }}
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                Previous
              </button>
              <span style={{ fontSize: 10, color: "#85798e", paddingTop: 8 }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
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
  const [activeTab, setActiveTab] = useState(
    isProgramChair ? "review" : "submit",
  );
  const [search, setSearch] = useState("");

  const ACADEMIC_YEARS = (() => {
    const startYear = new Date().getFullYear();
    return [-1, 0, 1].map((offset) => {
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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejection_rate: "0%",
  });
  const [loading, setLoading] = useState(true);
  const [selectedQueueForm, setSelectedQueueForm] = useState(null);
  const [reviewViewFilter, setReviewViewFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "",
    required_fields: "",
  });

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
  const selectedCategory =
    categories.find((c) => c.name === wizardFormType) || null;
  const selectedFields = selectedCategory?.formFields || [];
  const isFileField = (f) => f.fieldType === "File Upload";
  // File-upload fields live together in the attachment step, where their
  // required/optional state remains visible on each individual attachment row.
  const requiredFileFields = selectedFields.filter(
    (f) => isFileField(f) && f.required,
  );
  const attachmentFields = selectedFields.filter((f) => isFileField(f));
  const otherFields = selectedFields.filter((f) => !isFileField(f));
  const nextAttachmentField = attachmentFields.find(
    (field) => !wizardDocs[field.id],
  );
  // A Checkbox field only becomes a choice group (checkboxes or radios) once
  // the reviewer has defined choices for it in Document Categories; otherwise
  // it stays the legacy single "Confirm" toggle.
  const hasCheckboxChoices = (f) =>
    f.fieldType === "Checkbox" &&
    Array.isArray(f.options) &&
    f.options.length > 0;
  const isFieldComplete = (f) => {
    if (isFileField(f)) return wizardDocs[f.id]?.status === "done";
    const v = wizardFieldValues[f.id];
    if (f.fieldType === "Checkbox") {
      if (hasCheckboxChoices(f)) {
        return f.multiSelect === false
          ? v !== undefined && v !== null && v !== ""
          : Array.isArray(v) && v.length > 0;
      }
      return v === true;
    }
    return v !== undefined && v !== null && String(v).trim() !== "";
  };

  // ── Toast helpers ─────────────────────────────────────────────────────────
  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      5000,
    );
  };
  const dismissToast = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (!token) navigate("/login");
  }, []);
  useEffect(() => {
    fetchForms();
  }, [page, search, activeTab]);
  useEffect(() => {
    if (!isProgramChair || activeTab !== "review") return;
    setSelectedQueueForm(
      (previous) =>
        forms.find((form) => form.id === previous?.id) || forms[0] || null,
    );
  }, [forms, isProgramChair, activeTab]);

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
        setPendingBadge((prev) => prev + 1);
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
      const res = await fetch(`${API}/api/categories`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      // Keep the full category objects (not just names) — each Form-type
      // category carries a `formFields` array (name, fieldType, required)
      // defined in Document Categories, which drives Step 2 of the wizard.
      const formCategories = (data.categories || []).filter(
        (c) => c.status === "Active" && c.type === "Form",
      );
      setCategories(formCategories);
      // If the currently selected form type no longer exists / isn't a Form
      // type, reset the field back to the placeholder rather than guessing.
      setWizardFormType((prev) =>
        formCategories.some((c) => c.name === prev) ? prev : "",
      );
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const statusParam = isProgramChair ? "&status=Pending" : "";
      const params = new URLSearchParams({
        page,
        q: search,
        per_page: 5,
      }).toString();
      const endpoint = isProgramChair
        ? `/api/forms/all?${params}${statusParam}`
        : `/api/forms/my?${params}`;
      const res = await fetch(`${API}${endpoint}`, { headers: authHeaders });
      if (!res.ok) return;
      const data = await res.json();
      setForms(data.forms || []);
      setStats(
        data.stats || {
          total: 0,
          pending: 0,
          approved: 0,
          rejection_rate: "0%",
        },
      );
      setTotalPages(data.total_pages || 1);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllForms = async () => {
    setAllFormsLoading(true);
    try {
      const statusParam =
        allFormsStatusFilter !== "All" ? `&status=${allFormsStatusFilter}` : "";
      const params = new URLSearchParams({
        page: allFormsPage,
        q: search,
        per_page: 5,
      }).toString();
      const res = await fetch(`${API}/api/forms/all?${params}${statusParam}`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      setAllForms(data.forms || []);
      setAllFormsTotalPages(data.total_pages || 1);
    } catch {
      setAllForms([]);
    } finally {
      setAllFormsLoading(false);
    }
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
        setWizardDocs((prev) => ({
          ...prev,
          [slotId]: { ...prev[slotId], progress: 100, status: "done" },
        }));
        return;
      }
      setWizardDocs((prev) => ({
        ...prev,
        [slotId]: { ...prev[slotId], progress: Math.round(progress) },
      }));
      setTimeout(tick, 200 + Math.random() * 200);
    };
    setTimeout(tick, 150);
  };

  const handleWizardFile = (fieldId, file) => {
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.type)) {
      alert("Only PDF, JPG, or PNG files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File exceeds 5MB limit.");
      return;
    }
    setWizardDocs((prev) => ({
      ...prev,
      [fieldId]: { file, progress: 0, status: "uploading" },
    }));
    simulateSlotUpload(fieldId);
  };

  const handleWizardDrop = (fieldId, e) => {
    e.preventDefault();
    setWizardDragOver(null);
    handleWizardFile(fieldId, e.dataTransfer.files[0]);
  };

  const removeWizardDoc = (fieldId) => {
    setWizardDocs((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleWizardFieldChange = (fieldId, value) => {
    setWizardFieldValues((prev) => ({ ...prev, [fieldId]: value }));
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
    selectedFields.forEach((f) => {
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
          if (value !== undefined && value !== null && value !== "")
            fd.append(key, value);
          fieldSummary[f.name] = value || null;
        } else {
          if (value !== undefined && value !== null && value !== "")
            fd.append(key, value);
          fieldSummary[f.name] =
            f.fieldType === "Checkbox"
              ? value === true
                ? "Yes"
                : "No"
              : (value ?? null);
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
    setWizardInfo({
      student_number: "",
      full_name: "",
      semester: "1st Semester",
      academic_year: ACADEMIC_YEARS[1],
      remarks: "",
    });
  };

  const handleWizardSubmit = async () => {
    if (!wizardFormType) {
      alert("Please select a Form Type.");
      return;
    }
    const missingRequired = selectedFields.filter(
      (f) => f.required && !isFieldComplete(f),
    );
    if (missingRequired.length > 0) {
      alert(
        `Please complete: ${missingRequired.map((f) => f.name).join(", ")}`,
      );
      return;
    }
    if (Object.values(wizardDocs).some((d) => d.status === "uploading")) {
      alert("Please wait for all documents to finish uploading.");
      return;
    }

    setWizardSubmitting(true);
    try {
      const res = await fetch(`${API}/api/forms/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildWizardFormData(),
      });
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
          } catch {
            /* ignore */
          }
        }
        console.error("Form submit failed:", res.status, message);
        alert(message);
      }
    } catch (err) {
      // This branch only runs on genuine network/CORS failures — the request
      // never got a response at all.
      console.error("Form submit network error:", err);
      alert(
        "Could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleWizardSaveDraft = async () => {
    setWizardSubmitting(true);
    try {
      const res = await fetch(`${API}/api/forms/draft`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildWizardFormData("Draft"),
      });
      if (!res.ok) {
        let message = `Could not save draft (${res.status}).`;
        try {
          const d = await res.clone().json();
          message = d.message || d.error || message;
        } catch {
          try {
            const text = await res.text();
            if (text) message = text.slice(0, 300);
          } catch {
            /* ignore */
          }
        }
        console.error("Draft save failed:", res.status, message);
        alert(message);
        return;
      }
      addToast("Draft saved successfully.", "success");
      fetchForms();
    } catch (err) {
      console.error("Draft save network error:", err);
      alert(
        "Could not reach the server. Please check your connection and try again.",
      );
    } finally {
      setWizardSubmitting(false);
    }
  };

  const handleWizardCancel = () => {
    if (
      Object.keys(wizardDocs).length > 0 ||
      Object.keys(wizardFieldValues).length > 0 ||
      wizardFormType ||
      wizardInfo.remarks
    ) {
      if (
        !window.confirm(
          "Discard this form? Your uploaded documents and entered details will be lost.",
        )
      )
        return;
    }
    resetWizard();
  };

  // Review now opens as its own page (see DocumentReview.jsx / route
  // "/document-review/:id") instead of a popup modal. We hand the row data
  // over via navigation state so the review page doesn't need a refetch;
  // it falls back to fetching by id if that state isn't present (e.g. a
  // direct link or a page refresh while on the review page).
  const handleReview = (form) => {
    navigate(`/document-review/${form.id}`, { state: { form } });
  };

  const handleAddTemplate = async () => {
    if (!templateData.name || !templateData.category) {
      alert("Name and category are required.");
      return;
    }
    await fetch(`${API}/api/forms/templates`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(templateData),
    });
    setAddModal(false);
    setTemplateData({
      name: "",
      description: "",
      category: "",
      required_fields: "",
    });
    alert("Form template added successfully.");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  const canViewAdminNav = ["admin", "program_chair"].includes(user.role);

  // ── Submission Summary (derived from wizard state) ────────────────────────
  const wizardRequiredCount = selectedFields.filter((f) => f.required).length;
  const wizardUploadedCount = selectedFields.filter(
    (f) => f.required && isFieldComplete(f),
  ).length;
  const wizardUploadingCount = Object.values(wizardDocs).filter(
    (d) => d.status === "uploading",
  ).length;
  const wizardMissingCount = selectedFields.filter(
    (f) => f.required && !isFieldComplete(f),
  ).length;
  const wizardAttachmentsCompleteCount = requiredFileFields.filter((f) =>
    isFieldComplete(f),
  ).length;
  let wizardStatusLabel, wizardStatusColor;
  if (wizardMissingCount > 0) {
    wizardStatusLabel =
      wizardUploadingCount > 0 ? "Incomplete / Uploading" : "Incomplete";
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
    const controlStyle = {
      ...fieldBase,
      padding: "8px 12px",
      borderRadius: 7,
      fontSize: 12.5,
      color: "#111",
    };
    const hint = isChoiceCheckbox
      ? isMultiCheckbox
        ? "Select all that apply"
        : "Select one option"
      : {
          "File Upload": "PDF, JPG, or PNG (Max 5MB)",
          "Text Input": "Short text answer",
          "Text Area": "Long-form text answer",
          Date: "Select a date",
          Number: "Numeric value",
          Dropdown: "Choose from the options",
          Checkbox: "Check to confirm",
        }[f.fieldType] || f.fieldType;

    return (
      <div
        key={f.id}
        className={`path-faculty-dynamic-field ${isFile ? "is-file" : ""} ${f.required ? "is-required" : ""} ${isChoiceCheckbox ? "is-choice" : ""} ${isTextArea ? "is-textarea" : ""}`}
        style={{
          border: `1px solid ${isDragOver ? "#7c3aed" : "#e5e7eb"}`,
          borderRadius: 10,
          padding: "12px 14px",
          background: isDragOver ? "#faf5ff" : "#fafafa",
          boxShadow: isDragOver ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
          transition: "border-color .15s, box-shadow .15s",
        }}
        onDragOver={
          isFile
            ? (e) => {
                e.preventDefault();
                setWizardDragOver(f.id);
              }
            : undefined
        }
        onDragLeave={isFile ? () => setWizardDragOver(null) : undefined}
        onDrop={isFile ? (e) => handleWizardDrop(f.id, e) : undefined}
      >
        <div
          style={{
            display: "flex",
            flexDirection: stacked ? "column" : "row",
            justifyContent: "space-between",
            alignItems: stacked ? "stretch" : "flex-start",
            gap: stacked ? 8 : 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  background: "#e5e7eb",
                  color: "#6b7280",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isFile ? <Icon.AttachFile size={12} /> : idx + 1}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#111" }}>
                {f.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "1px 8px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  background: f.required ? "#ede9fe" : "#f3f4f6",
                  color: f.required ? "#5b21b6" : "#6b7280",
                }}
              >
                {f.required ? "Required" : "Optional"}
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#9ca3af",
                marginTop: 2,
                marginLeft: 26,
              }}
            >
              {hint}
            </div>
          </div>

          {/* ── File Upload ── */}
          {isFile && (
            <>
              <input
                ref={(el) => (wizardFileRefs.current[f.id] = el)}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                style={{ display: "none" }}
                onChange={(e) => handleWizardFile(f.id, e.target.files[0])}
              />
              {doc ? (
                doc.status === "done" ? (
                  // ── Attached file card (matches mockup's file-item styling) ──
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      flex: 1,
                      minWidth: 220,
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      background: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        minWidth: 0,
                      }}
                    >
                      {(() => {
                        const meta = fileTypeMeta(doc.file?.name);
                        return (
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 7,
                              background: meta.bg,
                              color: meta.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <svg
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              width="16"
                              height="16"
                            >
                              {meta.icon}
                            </svg>
                          </div>
                        );
                      })()}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "#111",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 180,
                          }}
                        >
                          {doc.file?.name}
                        </span>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>
                          {formatFileSize(doc.file?.size)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeWizardDoc(f.id)}
                      title="Remove file"
                      style={{
                        background: "transparent",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ba1a1a";
                        e.currentTarget.style.background = "#ffdad6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#9ca3af";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <Icon.Trash size={15} />
                    </button>
                  </div>
                ) : (
                  // ── Uploading progress ──
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                      minWidth: 180,
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 100 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: "#888",
                          marginBottom: 3,
                        }}
                      >
                        <span>Uploading...</span>
                        <span>{doc.progress}%</span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: "#e5e7eb",
                          borderRadius: 20,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${doc.progress}%`,
                            background: "#7c3aed",
                            borderRadius: 20,
                            transition: "width 0.2s",
                          }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeWizardDoc(f.id)}
                      style={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "7px 12px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )
              ) : (
                // ── Empty dropzone (matches mockup's "Drag & drop files here" style) ──
                <div
                  className="path-faculty-file-attach-trigger"
                  onClick={() => wizardFileRefs.current[f.id]?.click()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flex: 1,
                    minWidth: 220,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1.5px dashed ${isDragOver ? "#7c3aed" : "#cbc3d7"}`,
                    background: isDragOver ? "#faf5ff" : "#fcf8ff",
                    cursor: "pointer",
                    transition: "border-color .15s, background .15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDragOver)
                      e.currentTarget.style.borderColor = "#7c3aed";
                  }}
                  onMouseLeave={(e) => {
                    if (!isDragOver)
                      e.currentTarget.style.borderColor = "#cbc3d7";
                  }}
                >
                  <Icon.CloudUpload size={20} />
                  <span style={{ fontSize: 11, color: "#6b7280", flex: 1 }}>
                    Attach a file
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      wizardFileRefs.current[f.id]?.click();
                    }}
                    style={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "7px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#374151",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Attach
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── Text Input ── */}
          {f.fieldType === "Text Input" && (
            <input
              type="text"
              value={val}
              onChange={(e) => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              placeholder={`Enter ${f.name.toLowerCase()}`}
              style={{ ...controlStyle, width: 220 }}
            />
          )}

          {/* ── Number ── */}
          {f.fieldType === "Number" && (
            <input
              type="number"
              value={val}
              onChange={(e) => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              placeholder="0"
              style={{ ...controlStyle, width: 140 }}
            />
          )}

          {/* ── Date ── */}
          {f.fieldType === "Date" && (
            <input
              type="date"
              value={val}
              onChange={(e) => handleWizardFieldChange(f.id, e.target.value)}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              style={{ ...controlStyle, width: 160 }}
            />
          )}

          {/* ── Dropdown (falls back to free text if the template has no options configured) ── */}
          {f.fieldType === "Dropdown" &&
            (Array.isArray(f.options) && f.options.length > 0 ? (
              <div style={{ position: "relative", width: 180 }}>
                <select
                  value={val}
                  onChange={(e) =>
                    handleWizardFieldChange(f.id, e.target.value)
                  }
                  onFocus={onFieldFocus}
                  onBlur={onFieldBlur}
                  style={{
                    ...controlStyle,
                    width: "100%",
                    padding: "8px 28px 8px 12px",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    position: "absolute",
                    right: 9,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                  }}
                >
                  <Icon.Chevron size={14} />
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={val}
                onChange={(e) => handleWizardFieldChange(f.id, e.target.value)}
                onFocus={onFieldFocus}
                onBlur={onFieldBlur}
                placeholder="Enter value"
                style={{ ...controlStyle, width: 220 }}
              />
            ))}

          {/* ── Checkbox ── */}
          {f.fieldType === "Checkbox" &&
            (isChoiceCheckbox ? (
              isMultiCheckbox ? (
                // Multiple selection — checkbox group, value is an array of chosen options
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {f.options.map((opt) => {
                    const arr = Array.isArray(val) ? val : [];
                    const checked = arr.includes(opt);
                    return (
                      <label
                        key={opt}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "#374151",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...arr, opt]
                              : arr.filter((o) => o !== opt);
                            handleWizardFieldChange(f.id, next);
                          }}
                          style={{
                            width: 15,
                            height: 15,
                            accentColor: "#7c3aed",
                          }}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              ) : (
                // Single selection — radio group, value is one option string
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {f.options.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`field-${f.id}`}
                        checked={val === opt}
                        onChange={() => handleWizardFieldChange(f.id, opt)}
                        style={{
                          width: 15,
                          height: 15,
                          accentColor: "#7c3aed",
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )
            ) : (
              // Legacy Checkbox field with no choices configured — plain confirm toggle
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={val === true}
                  onChange={(e) =>
                    handleWizardFieldChange(f.id, e.target.checked)
                  }
                  style={{ width: 15, height: 15, accentColor: "#7c3aed" }}
                />
                Confirm
              </label>
            ))}

          {/* ── Text Area (full width, stacked below the label) ── */}
          {isTextArea && (
            <textarea
              value={val}
              onChange={(e) => handleWizardFieldChange(f.id, e.target.value)}
              rows={3}
              onFocus={onFieldFocus}
              onBlur={onFieldBlur}
              placeholder={`Enter ${f.name.toLowerCase()}`}
              style={{
                ...controlStyle,
                width: "100%",
                resize: "vertical",
                fontFamily: "'DM Sans',sans-serif",
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  const reviewVisibleForms = forms.filter(
    (form) =>
      reviewViewFilter === "All" ||
      String(form.status || "Pending").toLowerCase() ===
        reviewViewFilter.toLowerCase(),
  );
  const reviewSelected =
    reviewVisibleForms.find((form) => form.id === selectedQueueForm?.id) ||
    selectedQueueForm;
  const reviewRiskCount = reviewVisibleForms.filter(
    (form) =>
      String(form.status || "")
        .toLowerCase()
        .includes("revision") ||
      String(form.priority || "").toLowerCase() === "urgent",
  ).length;

  return (
    <div
      className={`path-forms-shell ${isProgramChair && activeTab === "review" ? "path-forms-queue-active" : ""} ${!isProgramChair && activeTab === "submit" ? "path-forms-start-active" : ""}`}
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: "#181445",
        background: "#fcf8ff",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap');
        .path-forms-shell{background:#f8f7ff!important;color:#40344b!important}.path-forms-main{background:#f8f7ff!important}.path-forms-page{background:#f8f7ff!important;padding:24px 28px 34px!important;gap:18px!important}.path-forms-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;min-height:156px;padding:25px 27px;border:1px solid #e3d8f2;border-left:2px solid #bda7ef;border-radius:12px;background:linear-gradient(118deg,#fbf9ff,#f2ecff);box-shadow:0 12px 30px rgba(57,36,93,.04)}.path-forms-kicker{display:flex;align-items:center;gap:7px;color:#978ca2;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.path-forms-kicker i{width:7px;height:7px;border-radius:50%;background:#7c3aed;box-shadow:0 0 0 4px #eee7fd}.path-forms-hero h1{margin:9px 0 7px;color:#302638;font-family:'Manrope',sans-serif;font-size:clamp(34px,4.2vw,49px);font-weight:800;line-height:.98;letter-spacing:-.055em}.path-forms-hero p{max-width:610px;margin:0;color:#766b7f;font-size:13px;line-height:1.5}.path-forms-health{display:flex;align-items:center;gap:9px;padding:11px 13px;border:1px solid #e2d7f2;border-radius:8px;background:#fff;color:#6e45b9}.path-forms-health>i{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#eee7fd;font-style:normal}.path-forms-health span{display:flex;flex-direction:column;gap:2px}.path-forms-health strong{color:#5b4f64;font-family:'Manrope',sans-serif;font-size:10px}.path-forms-health small{color:#9a90a2;font-size:8px}.path-forms-tab-actions{display:flex;gap:8px;margin-top:16px}.path-forms-tab-actions button{min-height:31px;border:1px solid #e1d5f1;border-radius:7px;padding:0 10px;background:#fff;color:#715f7c;font-size:9px;font-weight:800;cursor:pointer}.path-forms-tab-actions button.active{border-color:#7c3aed;background:#7c3aed;color:#fff}.path-review-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.path-review-stat{min-height:108px;padding:18px 19px;border:1px solid #e7e2ec;border-radius:10px;background:#fff;box-shadow:0 8px 23px rgba(57,36,93,.035)}.path-review-stat>span{display:flex;align-items:center;justify-content:space-between;color:#a098a7;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.path-review-stat>span i{font-style:normal;color:#8b62d2}.path-review-stat strong{display:block;margin-top:10px;color:#40344b;font-family:'Manrope',sans-serif;font-size:29px;line-height:1;letter-spacing:-.06em}.path-review-stat small{display:block;margin-top:6px;color:#9b91a3;font-size:9px}.path-review-stat.risk strong{color:#9a6534}.path-review-stat.complete strong{color:#397d65}.path-review-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:18px 20px;border:1px solid #e6dfee;border-radius:11px;background:#fff}.path-review-toolbar h2{margin:5px 0 0;color:#44354d;font-family:'Manrope',sans-serif;font-size:18px;letter-spacing:-.04em}.path-review-toolbar h2 span{display:inline-grid;min-width:20px;height:18px;margin-left:5px;place-items:center;border-radius:5px;background:#f0e9fc;color:#7543c7;font-family:'DM Sans',sans-serif;font-size:8px;vertical-align:middle}.path-review-toolbar p{margin:5px 0 0;color:#9c92a3;font-size:9px}.path-review-controls{display:flex;align-items:center;gap:9px}.path-review-search{display:flex;width:205px;align-items:center;gap:7px;padding:8px 10px;border:1px solid #ebe5f0;border-radius:7px;color:#8b8292}.path-review-search input{width:100%;border:0;outline:0;background:transparent;color:#5d5265;font-size:9px}.path-review-filter{min-height:31px;border:1px solid #e8e2ed;border-radius:6px;padding:0 8px;background:#fff;color:#978c9e;font-size:8px;font-weight:700;cursor:pointer}.path-review-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(295px,.72fr);gap:16px;align-items:start}.path-review-ledger,.path-review-detail{overflow:hidden;border:1px solid #e5deed;border-radius:11px;background:#fff;box-shadow:0 12px 30px rgba(57,36,93,.045)}.path-review-table-head,.path-review-row{display:grid;grid-template-columns:minmax(235px,1.35fr) minmax(120px,.68fr) 112px 110px 18px;gap:12px;align-items:center}.path-review-table-head{padding:10px 19px;border-bottom:1px solid #f0edf4;background:#fbf9fd;color:#aaa0ad;font-size:8px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.path-review-row{width:100%;min-height:80px;padding:13px 19px;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer;transition:background .16s ease,box-shadow .16s ease}.path-review-row:hover,.path-review-row.selected{background:#fbf9ff}.path-review-row.selected{box-shadow:inset 2px 0 #7c3aed}.path-review-doc{display:flex;min-width:0;align-items:center;gap:10px}.path-review-doc-icon{display:grid;flex:0 0 auto;width:32px;height:32px;place-items:center;border-radius:9px;background:#eee8fb;color:#7750c4}.path-review-doc-icon.risk{background:#fff1ec;color:#c2745a}.path-review-doc-copy{display:flex;min-width:0;flex-direction:column;gap:4px}.path-review-doc-copy strong{overflow:hidden;color:#51405a;font-family:'Manrope',sans-serif;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.path-review-doc-copy small{overflow:hidden;color:#a097a6;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.path-review-doc-copy small i{font-style:normal;color:#7a4bc1}.path-review-owner{display:flex;min-width:0;align-items:center;gap:7px;color:#75697d;font-size:9px}.path-review-owner i{display:grid;flex:0 0 auto;width:23px;height:23px;place-items:center;border-radius:7px;background:#e8f1fc;color:#527fae;font-size:7px;font-style:normal;font-weight:800}.path-review-owner span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.path-review-status{display:flex;flex-direction:column;gap:5px}.path-review-status b{width:max-content;padding:4px 6px;border-radius:5px;background:#f0e9fc;color:#7543c7;font-size:7px}.path-review-status small{color:#a095a5;font-size:8px}.path-review-sla{display:flex;align-items:center;gap:5px;color:#579176;font-size:8px;font-weight:800}.path-review-sla i{width:6px;height:6px;border-radius:50%;background:currentColor}.path-review-sla.risk{color:#c47a52}.path-review-chevron{color:#a797b0;font-size:15px}.path-review-empty{display:flex;min-height:200px;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:25px;color:#9d92a2;text-align:center}.path-review-empty strong{color:#6a5d73;font-family:'Manrope',sans-serif;font-size:12px}.path-review-empty span{font-size:9px}.path-review-detail{padding:19px}.path-review-detail-head{display:flex;align-items:flex-start;justify-content:space-between}.path-review-detail-head h3{margin:6px 0 0;color:#44354d;font-family:'Manrope',sans-serif;font-size:17px;letter-spacing:-.04em}.path-review-detail p{margin:9px 0 0;color:#9c92a3;font-size:9px;line-height:1.5}.path-review-detail-title{display:flex;align-items:center;gap:10px;margin-top:18px;padding-bottom:15px;border-bottom:1px solid #eee9f1}.path-review-detail-avatar{display:grid;width:31px;height:31px;place-items:center;border-radius:9px;background:#eee7fd;color:#7543c7;font-size:8px;font-weight:800}.path-review-detail-title strong{display:block;color:#51405a;font-family:'Manrope',sans-serif;font-size:10px}.path-review-detail-title span{display:block;margin-top:3px;color:#9c92a3;font-size:8px}.path-review-deadline{margin-top:14px;padding:12px;border:1px solid #e8dff0;border-radius:8px;background:#fbf9ff}.path-review-deadline span{display:block;color:#a198a6;font-size:8px}.path-review-deadline strong{display:block;margin-top:5px;color:#614f6b;font-family:'Manrope',sans-serif;font-size:12px}.path-review-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.path-review-meta span{display:block;color:#aaa0ad;font-size:8px}.path-review-meta strong{display:block;margin-top:4px;overflow:hidden;color:#695b72;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.path-review-focus{display:flex;gap:8px;margin-top:15px;padding:10px;border:1px solid #e3d8f3;border-radius:8px;background:#fbf9ff;color:#7543c7}.path-review-focus i{display:grid;flex:0 0 auto;width:23px;height:23px;place-items:center;border-radius:7px;background:#eee7fd;font-style:normal}.path-review-focus strong{display:block;font-size:9px}.path-review-focus span{display:block;margin-top:3px;color:#958b9d;font-size:8px;line-height:1.4}.path-review-actions{display:flex;flex-direction:column;gap:7px;margin-top:16px}.path-review-actions button{min-height:32px;border:1px solid #e2d7ee;border-radius:7px;background:#fff;color:#725f7e;font-size:9px;font-weight:800;cursor:pointer}.path-review-actions button.primary{border-color:#7c3aed;background:#7c3aed;color:#fff}.path-review-actions button.return{border-color:#edd9c0;background:#fffdf8;color:#a47b3a}@media(max-width:1050px){.path-review-layout{grid-template-columns:1fr}.path-review-detail{min-height:0}}@media(max-width:760px){.path-forms-page{padding:16px 14px 26px!important}.path-forms-hero{align-items:flex-start;flex-direction:column;padding:21px 18px}.path-forms-hero h1{font-size:32px}.path-review-stats{grid-template-columns:1fr 1fr;gap:9px}.path-review-toolbar{align-items:stretch;flex-direction:column}.path-review-controls{flex-wrap:wrap}.path-review-search{width:100%}.path-review-table-head{display:none}.path-review-row{grid-template-columns:minmax(0,1fr) auto;gap:8px}.path-review-owner{grid-column:1}.path-review-status{grid-column:2;grid-row:1}.path-review-sla,.path-review-chevron{display:none}}
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        @keyframes slideIn { from { transform: translateX(40px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes fadeUp { from { transform: translate(-50%, -46%); opacity:0; } to { transform: translate(-50%, -50%); opacity:1; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        .path-forms-queue-active .path-forms-default-header,.path-forms-queue-active .path-forms-default-stats{display:none!important}
        /* Final PATH Review Queue rhythm: match the dashboard's page gutters, type hierarchy, and compact operational density. */
        .path-forms-shell,.path-forms-main,.path-forms-page{font-family:'DM Sans',sans-serif!important}
        .path-forms-page{padding:26px 28px 36px!important;gap:20px!important}
        .path-forms-queue-active .path-forms-page{max-width:none;margin:0 auto;width:100%}
        .path-forms-queue-active .path-forms-hero{min-height:132px;padding:23px 20px;border-width:0 0 0 2px;border-radius:0;background:linear-gradient(105deg,#fbf9ff,#f5f1ff);box-shadow:none}
        .path-forms-queue-active .path-forms-hero h1{font-size:42px;line-height:1;letter-spacing:-.06em}
        .path-forms-queue-active .path-forms-hero p{max-width:560px;font-size:12px;line-height:1.5}
        .path-forms-queue-active .path-forms-kicker{font-size:9px;letter-spacing:.13em}
        .path-forms-queue-active .path-forms-tab-actions{margin-top:14px}
        .path-forms-queue-active .path-review-stats{gap:14px}
        .path-forms-queue-active .path-review-stat{min-height:106px;padding:17px 18px}
        .path-forms-queue-active .path-review-stat strong{font-size:29px}
        .path-forms-queue-active .path-review-toolbar{padding:17px 19px}
        .path-forms-queue-active .path-review-toolbar h2{font-size:18px}
        .path-forms-queue-active .path-review-layout{gap:14px}
        .path-forms-queue-active .path-review-ledger,.path-forms-queue-active .path-review-detail{border-radius:10px}
        .path-forms-queue-active .path-review-row{min-height:78px;padding:12px 18px}
        .path-forms-queue-active .path-review-detail{padding:18px}
        /* Preserve the generous quiet margin from the supplied reference on wide review workspaces. */
        @media(min-width:1100px){.path-forms-queue-active .path-forms-page{padding-left:clamp(48px,5vw,84px)!important;padding-right:clamp(48px,5vw,84px)!important}}
        @media(max-width:760px){.path-forms-page{padding:17px 14px 28px!important;gap:14px!important}.path-forms-queue-active .path-forms-hero{min-height:auto;padding:21px 17px}.path-forms-queue-active .path-forms-hero h1{font-size:33px}.path-forms-queue-active .path-review-stats{gap:10px}.path-forms-queue-active .path-review-toolbar{padding:15px}.path-forms-queue-active .path-review-row{padding:12px 14px}}
      `}</style>

      <style>{`
        .path-forms-start-active .path-forms-default-stats{display:none!important}
        .path-forms-start-active .path-forms-page{gap:16px!important;padding:29px clamp(28px,5vw,84px) 50px!important}
        .path-forms-start-active .path-forms-default-header{min-height:134px;padding:21px 13px 24px!important;border-bottom:1px solid #e6dfee;align-items:flex-end!important}
        .path-forms-start-active .path-forms-default-header>div:first-child{padding-left:13px;border-left:2px solid #bca5ef}
        .path-forms-start-active .path-forms-default-header h1{margin:8px 0 7px!important;color:#34283d!important;font-family:'Manrope',sans-serif!important;font-size:clamp(31px,3vw,42px)!important;font-weight:800!important;letter-spacing:-.06em!important;line-height:1!important}
        .path-forms-start-active .path-forms-default-header p{max-width:610px;margin:0!important;color:#8f8398!important;font-size:11px!important;line-height:1.6!important}
        .path-forms-start-active .path-start-breadcrumb{gap:8px!important;margin:0!important;color:#988da0!important;font-size:9px!important;font-weight:800!important;letter-spacing:.12em;text-transform:uppercase}
        .path-forms-start-active .path-start-breadcrumb span:nth-child(even){display:none}
        .path-forms-start-active .path-start-breadcrumb span:last-child{color:#988da0!important;font-weight:800!important}
        .path-forms-start-active .path-forms-default-header>div:last-child{padding:3px;border:1px solid #e8e0f0!important;background:#fff!important;box-shadow:0 6px 18px rgba(57,36,93,.04)}
        .path-faculty-start-shell{width:100%}
        .path-faculty-start-shell>div{gap:18px!important}
        .path-faculty-start-shell h2{font-family:'Manrope',sans-serif!important;letter-spacing:-.04em}
        .path-faculty-start-shell{grid-template-columns:minmax(0,1.7fr) minmax(260px,.56fr)!important;gap:16px!important}
        .path-faculty-intake-main{display:flex;flex-direction:column;gap:14px;min-width:0}
        .path-faculty-intake-intro{display:none}
        .path-faculty-intake-step{margin:0!important;padding:20px!important;border:1px solid #e6dfee!important;border-radius:12px!important;background:#fff!important;box-shadow:0 10px 26px rgba(54,36,87,.04)!important}
        .path-faculty-intake-step.is-muted{background:#fdfcff!important}
        .path-faculty-intake-step>div:first-child{display:flex!important;align-items:flex-start!important;gap:11px!important;margin:0 0 17px!important;padding:0!important;border:0!important}
        .path-faculty-intake-step>div:first-child>svg{display:none!important}
        .path-faculty-intake-step>div:first-child h3{display:flex!important;align-items:center!important;gap:11px!important;margin:0!important;color:#4a3a54!important;font-family:Manrope,sans-serif!important;font-size:15px!important;font-weight:800!important;letter-spacing:-.04em!important;line-height:25px!important}
        .path-faculty-intake-step>div:first-child h3:before{display:grid;width:25px;height:25px;place-items:center;flex:0 0 auto;border-radius:50%;background:#7c3aed;color:#fff;font:800 9px Manrope,sans-serif;box-shadow:0 0 0 5px #f2ecff;content:"01"}
        .path-faculty-intake-step>div:nth-child(2){display:block!important}
        .path-faculty-intake-step>div:nth-child(2)>div:first-child{display:none!important}
        .path-faculty-intake-step>div:nth-child(2)>div:last-child{width:100%!important}
        .path-faculty-intake-step>div:nth-child(2)>div:last-child>p:first-child{margin:4px 0 17px 36px!important;color:#928699!important;font-size:9px!important;line-height:1.5!important}
        .path-faculty-step-02>div:first-child h3:before{content:"02"}
        .path-faculty-step-03>div:first-child h3:before{content:"03"}
        .path-faculty-step-04>div:first-child h3:before{content:"04"}
        .path-faculty-intake-step select{height:41px!important;border:1px solid #e2d9ea!important;border-radius:8px!important;color:#5f5069!important;font:700 10px 'DM Sans',sans-serif!important;box-shadow:none!important}
        .path-faculty-intake-step label{color:#66576f!important;font-size:9px!important;font-weight:800!important}
        .path-faculty-step-01>div:nth-child(2)>div:last-child>label{display:none!important}
        .path-faculty-step-01>div:nth-child(2)>div:last-child>div{margin-top:0!important}
        .path-faculty-intake-step textarea{min-height:98px!important;border-color:#e2d9ea!important;border-radius:8px!important;color:#5f5069!important;font:500 10px 'DM Sans',sans-serif!important}
        .path-faculty-intake-step [style*="border: 1px dashed"]{display:flex!important;min-height:72px;align-items:center!important;justify-content:center!important;background:#fdfcff!important;border-color:#e5ddea!important;border-radius:8px!important}
        .path-faculty-intake-step [style*="border: 1px dashed"] p{display:flex;align-items:center;justify-content:center;gap:9px;margin:0!important;color:#a094a8!important;font-size:10px!important}
        .path-faculty-intake-step [style*="border: 1px dashed"] svg{width:17px;color:#a982e9}
        .path-faculty-details-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}
        .path-faculty-dynamic-field:not(.is-file){padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child{display:block!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child{min-width:0!important;margin:0 0 6px!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child>div:first-child{gap:5px!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child>div:first-child>span:first-child{display:none!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child>div:first-child>span:nth-child(2){color:#66576f!important;font-size:9px!important;font-weight:800!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child>div:first-child>span:last-child{padding:0!important;border-radius:0!important;background:transparent!important;color:#b56a68!important;font-size:7px!important}
        .path-faculty-dynamic-field:not(.is-file)>div:first-child>div:first-child>div:last-child{display:none!important}
        .path-faculty-dynamic-field:not(.is-file) input:not([type=checkbox]):not([type=radio]),.path-faculty-dynamic-field:not(.is-file) select,.path-faculty-dynamic-field:not(.is-file) textarea{width:100%!important;min-height:34px!important;border-color:#dfd8e6!important;border-radius:7px!important;background:#fff!important;color:#5f5069!important;font-size:9px!important;box-shadow:none!important}
        .path-faculty-dynamic-field.is-choice{grid-column:1/-1!important;padding:0!important;border:0!important;background:transparent!important}
        .path-faculty-dynamic-field.is-choice>div:first-child{display:block!important}
        .path-faculty-dynamic-field.is-choice>div:first-child>div:first-child{min-width:0!important;margin:0 0 7px!important}
        .path-faculty-dynamic-field.is-choice>div:first-child>div:first-child>div:first-child>span:first-child{display:none!important}
        .path-faculty-dynamic-field.is-choice>div:first-child>div:first-child>div:last-child{display:none!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file{min-height:51px;padding:8px 11px!important;border:1px solid #e5dfea!important;border-radius:8px!important;background:#fff!important;box-shadow:none!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file.is-required{border-color:#e7ddb6!important;background:#fffefa!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child{align-items:center!important;gap:12px!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child>div:first-child{min-width:0!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child>div:first-child>div:first-child>span:first-child{width:25px!important;height:25px!important;border-radius:7px!important;background:#f1ebff!important;color:#8656d3!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child>div:first-child>div:first-child>span:nth-child(2){color:#5f5069!important;font-size:9px!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child>div:first-child>div:first-child>span:last-child{padding:0!important;border-radius:0!important;background:transparent!important;color:#b56a68!important;font-size:7px!important}
        .path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child>div:first-child>div:last-child{margin:2px 0 0 33px!important;color:#998e9e!important;font-size:7px!important}
        .path-faculty-step-03 .path-faculty-file-attach-trigger{min-width:auto!important;flex:0 0 auto!important;padding:7px 10px!important;border:1px solid #e0d9e8!important;border-radius:6px!important;background:#fff!important;color:#7346c4!important}
        .path-faculty-step-03 .path-faculty-file-attach-trigger svg{width:15px!important;color:#8757d4!important}
        .path-faculty-step-03 .path-faculty-file-attach-trigger>span{color:#7346c4!important;font-size:8px!important;font-weight:800!important}
        .path-faculty-step-03 .path-faculty-file-attach-trigger button{display:none!important}
        .path-faculty-support-dropzone{display:flex;min-height:88px;align-items:center;justify-content:center;flex-direction:column;gap:4px;padding:14px;border:1px dashed #cfc4db;border-radius:8px;background:#fdfcff;color:#7f648f;text-align:center;cursor:pointer}
        .path-faculty-support-dropzone svg{color:#8a5bd7}.path-faculty-support-dropzone strong{font-size:9px}.path-faculty-support-dropzone span{color:#9c91a1;font-size:7px}.path-faculty-support-dropzone b{color:#7747c7;font-size:8px}.path-faculty-support-dropzone.is-complete{cursor:default;opacity:.72}
        .path-faculty-summary-aside{align-self:start!important}
        .path-faculty-summary-card{border-color:#e6dfee!important;border-radius:12px!important;box-shadow:0 10px 26px rgba(54,36,87,.04)!important}
        .path-faculty-summary-kicker{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px;color:#978c9e;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
        .path-faculty-summary-kicker b{border-radius:4px;padding:4px 7px;background:#fff4d9;color:#a57524;font-size:8px;letter-spacing:0;text-transform:none}
        .path-faculty-summary-card>h3{margin:0 0 9px!important;color:#4a3a54!important;font-family:Manrope,sans-serif!important;font-size:16px!important;font-weight:800!important;letter-spacing:-.045em!important}
        .path-faculty-summary-card>p{margin:0 0 13px!important;padding-bottom:13px;border-bottom:1px solid #eee8f3;color:#9b90a2!important;font-size:9px!important;line-height:1.5!important}
        .path-faculty-summary-card [style*="padding: 8px 0"]{padding:10px 0!important;border-color:#eee8f3!important}
        .path-faculty-summary-card [style*="padding: 8px 0"]>span:first-child{color:#928699!important;font-size:9px!important}
        .path-faculty-missing-note{display:flex;align-items:center;gap:7px;margin:5px 0 16px;color:#9d711f;font-size:9px;font-weight:800}
        .path-faculty-missing-note i{width:6px;height:6px;border-radius:50%;background:#a97724}
        .path-faculty-summary-card button{border-radius:7px!important;font-family:'DM Sans',sans-serif!important;font-size:10px!important}
        .path-faculty-summary-card .path-faculty-submit-button{background:#a976e7!important;box-shadow:none!important}
        .path-faculty-summary-card .path-faculty-draft-button,.path-faculty-summary-card .path-faculty-cancel-button{background:#fff!important;border-color:#e5dfea!important;box-shadow:none!important}
        .path-faculty-summary-card button:active{transform:scale(.97)}
        .path-faculty-summary-aside>div:last-child{margin-top:12px!important;padding:12px 0 0!important;border:0!important;border-top:1px solid #eee8f3!important;border-radius:0!important;background:transparent!important}
        .path-faculty-summary-aside>div:last-child>svg{width:15px!important;height:15px!important;padding:3px!important;border-radius:50%;background:#f3edff!important;color:#8555d4!important}
        .path-faculty-summary-aside>div:last-child div:first-child{color:#6c5e75!important;font-size:9px!important;letter-spacing:0!important;text-transform:none!important}
        .path-faculty-summary-aside>div:last-child div:last-child{color:#9b90a2!important;font-size:8px!important;cursor:default!important}
        @media(max-width:900px){.path-faculty-start-shell{grid-template-columns:1fr!important}.path-faculty-summary-aside{position:static!important}.path-faculty-intake-step{padding:17px!important}.path-faculty-details-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:620px){.path-forms-start-active .path-forms-page{padding:20px 14px 32px!important}.path-faculty-details-grid{grid-template-columns:1fr!important}.path-faculty-step-03 .path-faculty-dynamic-field.is-file>div:first-child{align-items:flex-start!important;flex-direction:column!important}.path-faculty-step-03 .path-faculty-file-attach-trigger{width:100%;justify-content:center!important}}
      `}</style>

      {/* Toast container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── SIDEBAR ── */}
      <Sidebar activePage="forms" />

      {/* ── MAIN ── */}
      <div
        className="path-forms-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#fcf8ff",
          minWidth: 0,
        }}
      >
        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#9ca3af",
              }}
            >
              <Icon.Search />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search document ID, student name, category..."
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: 12,
                  color: "#374151",
                  width: "100%",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>
        </TopBar>

        {/* Content */}
        <div
          className="path-forms-page"
          style={{
            flex: 1,
            padding: 32,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {isProgramChair && activeTab === "review" && (
            <>
              <section className="path-forms-hero">
                <div>
                  <div className="path-forms-kicker">
                    <i /> Review operations · live queue
                  </div>
                  <h1>Review queue</h1>
                  <p>
                    Review assigned form submissions, clarify the next handoff,
                    and record an accountable decision.
                  </p>
                  <div className="path-forms-tab-actions">
                    <button className="active" type="button">
                      Review queue {pendingBadge > 0 ? `(${pendingBadge})` : ""}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("templates")}
                    >
                      Form templates
                    </button>
                  </div>
                </div>
                <div className="path-forms-health">
                  <i>
                    <Icon.Shield />
                  </i>
                  <span>
                    <strong>Queue health</strong>
                    <small>
                      {stats.pending || 0} submission
                      {Number(stats.pending) === 1 ? "" : "s"} awaiting review
                    </small>
                  </span>
                </div>
              </section>
              <section className="path-review-stats">
                <article className="path-review-stat">
                  <span>
                    Ready to review <i>◆</i>
                  </span>
                  <strong>
                    {String(reviewVisibleForms.length).padStart(2, "0")}
                  </strong>
                  <small>Awaiting your decision</small>
                </article>
                <article className="path-review-stat">
                  <span>
                    Due today <i>◷</i>
                  </span>
                  <strong>
                    {String(
                      Math.min(reviewVisibleForms.length, stats.pending || 0),
                    ).padStart(2, "0")}
                  </strong>
                  <small>Keep the handoff moving</small>
                </article>
                <article className="path-review-stat risk">
                  <span>
                    SLA risk <i>!</i>
                  </span>
                  <strong>{String(reviewRiskCount).padStart(2, "0")}</strong>
                  <small>Within the attention window</small>
                </article>
                <article className="path-review-stat complete">
                  <span>
                    Completed <i>✓</i>
                  </span>
                  <strong>
                    {String(stats.approved || 0).padStart(2, "0")}
                  </strong>
                  <small>Review decisions recorded</small>
                </article>
              </section>
            </>
          )}

          {/* Page Header + Tabs */}
          <div
            className="path-forms-default-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
            }}
          >
            <div>
              {activeTab === "submit" && !isProgramChair && (
                <div
                  className="path-start-breadcrumb"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#9ca3af",
                    marginBottom: 6,
                  }}
                >
                  <span>Faculty intake</span>
                  <span style={{ fontSize: 13 }}>›</span>
                  <span style={{ color: "#7c3aed", fontWeight: 700 }}>
                    Guided submission
                  </span>
                </div>
              )}
              <h1
                style={{
                  fontSize: 32,
                  lineHeight: "40px",
                  fontWeight: 600,
                  color: "#181445",
                  margin: 0,
                  letterSpacing: "-0.025em",
                }}
              >
                {activeTab === "submit" && !isProgramChair
                  ? "Start a submission"
                  : "Forms Management"}
              </h1>
              <p style={{ fontSize: 14, color: "#494454", margin: "8px 0 0" }}>
                {activeTab === "submit" && !isProgramChair
                  ? "Choose a form type, add the required files and context, then send the submission into review."
                  : isProgramChair
                    ? "Review, approve, and manage submitted student forms."
                    : "Upload and submit student forms for program chair review."}
              </p>
            </div>
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 2,
                background: "#efebff",
                borderRadius: 10,
                padding: 3,
              }}
            >
              {!isProgramChair && (
                <button
                  onClick={() => setActiveTab("submit")}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      activeTab === "submit" ? "white" : "transparent",
                    color: activeTab === "submit" ? "#6d3bd7" : "#7b7486",
                    boxShadow:
                      activeTab === "submit"
                        ? "0 1px 4px rgba(109,59,215,0.1)"
                        : "none",
                  }}
                >
                  Start a submission
                </button>
              )}
              <button
                onClick={() => {
                  setActiveTab(isProgramChair ? "review" : "history");
                  setPendingBadge(0);
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    activeTab === "review" || activeTab === "history"
                      ? "white"
                      : "transparent",
                  color:
                    activeTab === "review" || activeTab === "history"
                      ? "#6d3bd7"
                      : "#7b7486",
                  boxShadow:
                    activeTab === "review" || activeTab === "history"
                      ? "0 1px 4px rgba(109,59,215,0.1)"
                      : "none",
                  position: "relative",
                }}
              >
                {isProgramChair ? "Review Queue" : "My Submissions"}
                {/* Inline badge on the tab button */}
                {isProgramChair && pendingBadge > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: "#dc2626",
                      color: "white",
                      borderRadius: 20,
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "1px 6px",
                      animation: "pulse 1.5s infinite",
                    }}
                  >
                    {pendingBadge}
                  </span>
                )}
              </button>
              {isProgramChair && (
                <button
                  onClick={() => setActiveTab("templates")}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    background:
                      activeTab === "templates" ? "white" : "transparent",
                    color: activeTab === "templates" ? "#6d3bd7" : "#7b7486",
                    boxShadow:
                      activeTab === "templates"
                        ? "0 1px 4px rgba(109,59,215,0.1)"
                        : "none",
                  }}
                >
                  Form Templates
                </button>
              )}
            </div>
          </div>

          {/* Stat Cards */}
          <div
            className="path-forms-default-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 24,
            }}
          >
            <StatCard
              label="Total Submissions"
              value={stats.total?.toLocaleString() || "1,284"}
              delta="+12% this week"
              deltaType="up"
              icon={
                <svg
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
                </svg>
              }
              bg="#6b38d4"
              iconColor="#7b7486"
            />
            <StatCard
              label="Pending Review"
              value={stats.pending || "0"}
              delta="Action needed"
              deltaType="neutral"
              icon={
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="20"
                  height="20"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 4v4l2 2" strokeLinecap="round" />
                </svg>
              }
              bg="#5f5293"
              iconColor="#7b7486"
            />
            <StatCard
              label="Approved Forms"
              value={stats.approved?.toLocaleString() || "0"}
              delta="+8% this week"
              deltaType="up"
              icon={
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="20"
                  height="20"
                >
                  <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
                </svg>
              }
              bg="#712ae2"
              iconColor="#7b7486"
            />
            <StatCard
              label="Rejection Rate"
              value={stats.rejection_rate || "0%"}
              delta="Requires attention"
              deltaType="down"
              danger
              icon={
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  width="20"
                  height="20"
                >
                  <circle cx="8" cy="8" r="6" />
                  <path d="M5 5l6 6M11 5l-6 6" strokeLinecap="round" />
                </svg>
              }
              bg="#ba1a1a"
            />
          </div>

          {/* ── FACULTY: SUBMIT TAB (Submit New Form wizard) ── */}
          {activeTab === "submit" && !isProgramChair && (
            <div
              className="path-faculty-start-shell"
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 300px",
                gap: 24,
                alignItems: "start",
              }}
            >
              <div className="path-faculty-intake-main">
                <div
                  className="path-faculty-intake-intro"
                  style={{ marginBottom: 20 }}
                >
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#111",
                      margin: "0 0 4px",
                    }}
                  >
                    Start a submission
                  </h2>
                  <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                    Select a form type and upload the required documents to
                    begin your request.
                  </p>
                </div>

                {wizardSuccess && (
                  <div
                    style={{
                      marginBottom: 20,
                      background: "#d1fae5",
                      border: "1px solid #6ee7b7",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#065f46",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Icon.Check /> Form submitted! The program chair has been
                    notified in real time.
                  </div>
                )}

                {/* ── STEP 1: FORM TYPE SELECTION ── */}
                <div
                  className="path-faculty-intake-step path-faculty-step-01"
                  style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 20,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderBottom: "1px solid #f3f4f6",
                      paddingBottom: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Icon.InfoCircle />
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111",
                        margin: 0,
                      }}
                    >
                      Choose a form type
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      1
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888",
                          margin: "0 0 16px",
                        }}
                      >
                        Select the workflow that matches your department
                        document.
                      </p>

                      <label
                        style={{
                          display: "block",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#374151",
                          marginBottom: 6,
                        }}
                      >
                        Form Type
                      </label>
                      <div style={{ position: "relative" }}>
                        <select
                          value={wizardFormType}
                          onChange={(e) => {
                            setWizardFormType(e.target.value);
                            // Switching form types swaps the whole field set, so
                            // clear out any values/files entered for the previous type.
                            setWizardDocs({});
                            setWizardFieldValues({});
                          }}
                          onFocus={onFieldFocus}
                          onBlur={onFieldBlur}
                          disabled={
                            categoriesLoading || categories.length === 0
                          }
                          style={{
                            ...fieldBase,
                            width: "100%",
                            padding: "10px 34px 10px 12px",
                            borderRadius: 8,
                            fontSize: 13,
                            color: wizardFormType ? "#111" : "#9ca3af",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "none",
                          }}
                        >
                          <option value="" disabled>
                            {categoriesLoading
                              ? "Loading…"
                              : categories.length === 0
                                ? "No form types found"
                                : "Select a form type"}
                          </option>
                          {categories.map((c) => (
                            <option
                              key={c.id}
                              value={c.name}
                              style={{ color: "#111" }}
                            >
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <span
                          style={{
                            position: "absolute",
                            right: 12,
                            top: "50%",
                            transform: "translateY(-50%)",
                            pointerEvents: "none",
                          }}
                        >
                          <Icon.Chevron />
                        </span>
                      </div>
                      {selectedCategory?.description && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            margin: "8px 0 0",
                          }}
                        >
                          {selectedCategory.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── STEP 2: FORM FIELDS (dynamic — driven by the selected template) ── */}
                <div
                  className={`path-faculty-intake-step path-faculty-step-02 ${!selectedCategory ? "is-muted" : ""}`}
                  style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 20,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderBottom: "1px solid #f3f4f6",
                      paddingBottom: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Icon.DynamicForm />
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111",
                        margin: 0,
                      }}
                    >
                      Complete the details
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      2
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888",
                          margin: "0 0 18px",
                        }}
                      >
                        {selectedCategory
                          ? "These fields help the review team route your document accurately."
                          : "Choose a form type to load the information PATH needs."}
                      </p>

                      {!selectedCategory && (
                        <div
                          style={{
                            padding: "24px 18px",
                            borderRadius: 10,
                            background: "#fafafa",
                            border: "1px dashed #e5e7eb",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                            No form type selected yet.
                          </p>
                        </div>
                      )}

                      {selectedCategory && selectedFields.length === 0 && (
                        <div
                          style={{
                            padding: "24px 18px",
                            borderRadius: 10,
                            background: "#fafafa",
                            border: "1px dashed #e5e7eb",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                            This form type has no fields defined yet. Add some
                            in Document Categories.
                          </p>
                        </div>
                      )}

                      {selectedCategory && otherFields.length > 0 && (
                        <div
                          className="path-faculty-details-grid"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {otherFields.map((f, idx) => renderFieldRow(f, idx))}
                        </div>
                      )}

                      {selectedCategory &&
                        selectedFields.length > 0 &&
                        otherFields.length === 0 && (
                          <div
                            style={{
                              padding: "24px 18px",
                              borderRadius: 10,
                              background: "#fafafa",
                              border: "1px dashed #e5e7eb",
                              textAlign: "center",
                            }}
                          >
                            <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                              All fields for this form type are required
                              attachments — see the panel below.
                            </p>
                          </div>
                        )}

                      {selectedCategory && selectedFields.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            marginTop: 14,
                            background: "#faf5ff",
                            borderRadius: 8,
                            padding: "10px 12px",
                          }}
                        >
                          <Icon.Tip />
                          <p
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              margin: 0,
                              lineHeight: 1.6,
                            }}
                          >
                            These fields are pulled from the{" "}
                            <strong>{selectedCategory.name}</strong> template in
                            Document Categories — edit them there to change
                            what's asked for here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── STEP 3: REQUIRED ATTACHMENTS (dedicated panel for mandatory File Upload fields) ── */}
                <div
                  className={`path-faculty-intake-step path-faculty-step-03 ${!selectedCategory ? "is-muted" : ""}`}
                  style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 20,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderBottom: "1px solid #f3f4f6",
                      paddingBottom: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Icon.AttachFile />
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111",
                        margin: 0,
                      }}
                    >
                      Attach your documents
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      3
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888",
                          margin: "0 0 18px",
                        }}
                      >
                        {selectedCategory
                          ? "Upload the primary document and supporting evidence requested for this workflow."
                          : "Required attachments will appear after you select a form type."}
                      </p>

                      {!selectedCategory && (
                        <div
                          style={{
                            padding: "24px 18px",
                            borderRadius: 10,
                            background: "#fafafa",
                            border: "1px dashed #e5e7eb",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                            No form type selected yet.
                          </p>
                        </div>
                      )}

                      {selectedCategory && attachmentFields.length === 0 && (
                        <div
                          style={{
                            padding: "24px 18px",
                            borderRadius: 10,
                            background: "#fafafa",
                            border: "1px dashed #e5e7eb",
                            textAlign: "center",
                          }}
                        >
                          <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                            This form type has no required attachments.
                          </p>
                        </div>
                      )}

                      {selectedCategory && attachmentFields.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          {attachmentFields.map((f, idx) =>
                            renderFieldRow(f, idx),
                          )}
                          <div
                            className={`path-faculty-support-dropzone ${nextAttachmentField ? "" : "is-complete"}`}
                            onDragOver={(event) => {
                              if (nextAttachmentField) event.preventDefault();
                            }}
                            onDrop={(event) => {
                              if (!nextAttachmentField) return;
                              handleWizardDrop(nextAttachmentField.id, event);
                            }}
                            onClick={() =>
                              nextAttachmentField &&
                              wizardFileRefs.current[
                                nextAttachmentField.id
                              ]?.click()
                            }
                          >
                            <Icon.CloudUpload size={20} />
                            <strong>
                              {nextAttachmentField
                                ? "Drop an additional supporting file"
                                : "All attachment slots are complete"}
                            </strong>
                            <span>
                              {nextAttachmentField
                                ? "or browse your computer · PDF, JPG, or PNG · max 5 MB"
                                : "Remove or replace a listed file to make changes."}
                            </span>
                            {nextAttachmentField && <b>Browse files</b>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── STEP 4: ADDITIONAL INFORMATION ── */}
                <div
                  className="path-faculty-intake-step path-faculty-step-04"
                  style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 16,
                    padding: 24,
                    marginBottom: 20,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.05)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      borderBottom: "1px solid #f3f4f6",
                      paddingBottom: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Icon.Notes />
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#111",
                        margin: 0,
                      }}
                    >
                      Add context for the reviewer
                    </h3>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "#7c3aed",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      4
                    </div>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#888",
                          margin: "0 0 16px",
                        }}
                      >
                        Optional notes help the next reviewer understand the
                        purpose of your submission.
                      </p>

                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#374151",
                            marginBottom: 5,
                          }}
                        >
                          Reviewer notes
                        </label>
                        <textarea
                          value={wizardInfo.remarks}
                          onChange={(e) =>
                            setWizardInfo((p) => ({
                              ...p,
                              remarks: e.target.value,
                            }))
                          }
                          rows={3}
                          onFocus={onFieldFocus}
                          onBlur={onFieldBlur}
                          placeholder="Add a short note, context, or special instructions for the review team..."
                          style={{
                            ...fieldBase,
                            width: "100%",
                            padding: "8px 12px",
                            borderRadius: 7,
                            fontSize: 13,
                            color: "#111",
                            resize: "vertical",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: SUBMISSION SUMMARY ── */}
              <div
                className="path-faculty-summary-aside"
                style={{ position: "sticky", top: 20 }}
              >
                <div
                  className="path-faculty-summary-card"
                  style={{
                    background: "white",
                    border: "1px solid #f3f4f6",
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: "0 4px 12px rgba(124,58,237,0.05)",
                  }}
                >
                  <div className="path-faculty-summary-kicker">
                    <span>Submission summary</span>
                    <b>
                      {wizardFormType && wizardMissingCount === 0
                        ? "Ready"
                        : "In progress"}
                    </b>
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111",
                      margin: "0 0 2px",
                    }}
                  >
                    Ready when you are
                  </h3>
                  <p
                    style={{ fontSize: 11, color: "#888", margin: "0 0 14px" }}
                  >
                    Complete the required details and attachments to send this
                    document into review.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "#6b7280" }}>
                        Form type
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: wizardFormType ? "#7c3aed" : "#9ca3af",
                        }}
                      >
                        {wizardFormType || "Not selected"}
                      </span>
                    </div>
                    {[
                      ["Required fields", wizardRequiredCount],
                      ["Completed", wizardUploadedCount],
                      ["Uploaded", wizardAttachmentsCompleteCount],
                    ].map(([label, val]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 0",
                          borderBottom: "1px solid #f3f4f6",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "#6b7280" }}>{label}</span>
                        <span
                          style={{
                            fontWeight: 700,
                            color: "#111",
                          }}
                        >
                          {val}
                        </span>
                      </div>
                    ))}
                    <div className="path-faculty-missing-note">
                      <i />
                      <span>
                        {wizardMissingCount === 0 && wizardFormType
                          ? "Everything needed is ready."
                          : `${wizardMissingCount || 1} item${(wizardMissingCount || 1) === 1 ? "" : "s"} missing`}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <button
                      className="path-faculty-submit-button"
                      onClick={handleWizardSubmit}
                      disabled={wizardSubmitting}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "11px",
                        background: wizardSubmitting ? "#a78bfa" : "#7c3aed",
                        color: "white",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: wizardSubmitting ? "not-allowed" : "pointer",
                        boxShadow: "0 2px 6px rgba(124,58,237,0.25)",
                      }}
                    >
                      <Icon.Send />{" "}
                      {wizardSubmitting ? "Submitting..." : "Submit for review"}
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="path-faculty-draft-button"
                        onClick={handleWizardSaveDraft}
                        disabled={wizardSubmitting}
                        style={{
                          flex: 1,
                          padding: "9px",
                          background: "transparent",
                          color: "#374151",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: wizardSubmitting ? "not-allowed" : "pointer",
                        }}
                      >
                        Save as Draft
                      </button>
                      <button
                        className="path-faculty-cancel-button"
                        onClick={handleWizardCancel}
                        style={{
                          flex: 1,
                          padding: "9px",
                          background: "transparent",
                          color: "#9ca3af",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#dc2626";
                          e.currentTarget.style.borderColor = "#fecaca";
                          e.currentTarget.style.background = "#fee2e2";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#9ca3af";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 14,
                    background: "#faf5ff",
                    border: "1px solid #ede9fe",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <Icon.Info />
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#5b21b6",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 2,
                      }}
                    >
                      Need Help?
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#7c3aed",
                        cursor: "pointer",
                      }}
                    >
                      Contact Registrar Support
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isProgramChair && activeTab === "review" && (
            <>
              <section className="path-review-toolbar">
                <div>
                  <div className="path-forms-kicker">
                    <i /> Assigned review work
                  </div>
                  <h2>
                    Forms in your queue <span>{reviewVisibleForms.length}</span>
                  </h2>
                  <p>
                    Select a form to review its submission context and next
                    decision.
                  </p>
                </div>
                <div className="path-review-controls">
                  <label className="path-review-search">
                    <Icon.Search />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search forms or submitters"
                    />
                  </label>
                  {["All", "Pending", "Reviewing"].map((filter) => (
                    <button
                      key={filter}
                      className="path-review-filter"
                      type="button"
                      onClick={() => setReviewViewFilter(filter)}
                      style={
                        reviewViewFilter === filter
                          ? {
                              borderColor: "#d5c0f5",
                              background: "#f3edff",
                              color: "#6d3ec5",
                            }
                          : undefined
                      }
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </section>
              <section className="path-review-layout">
                <article className="path-review-ledger">
                  <div className="path-review-table-head">
                    <span>Form submission</span>
                    <span>Submitter</span>
                    <span>Review status</span>
                    <span>SLA</span>
                    <span />
                  </div>
                  {loading ? (
                    <div className="path-review-empty">
                      <strong>Loading review queue</strong>
                      <span>Fetching assigned form submissions.</span>
                    </div>
                  ) : reviewVisibleForms.length ? (
                    reviewVisibleForms.map((form) => {
                      const name =
                        form.full_name ||
                        form.submitter_name ||
                        form.student_id ||
                        "Unknown submitter";
                      const initials =
                        name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "?";
                      const isSelected = reviewSelected?.id === form.id;
                      const isRisk =
                        String(form.priority || "").toLowerCase() ===
                          "urgent" ||
                        String(form.status || "").toLowerCase() === "revision";
                      return (
                        <button
                          className={`path-review-row ${isSelected ? "selected" : ""}`}
                          type="button"
                          key={form.id}
                          onClick={() => setSelectedQueueForm(form)}
                        >
                          <span className="path-review-doc">
                            <i
                              className={`path-review-doc-icon ${isRisk ? "risk" : ""}`}
                            >
                              <Icon.Forms />
                            </i>
                            <span className="path-review-doc-copy">
                              <strong>
                                {form.category || "Form submission"}
                              </strong>
                              <small>
                                <i>{form.tracking_id || `FORM-${form.id}`}</i> ·{" "}
                                {form.filing_date || "Submitted recently"}
                              </small>
                            </span>
                          </span>
                          <span className="path-review-owner">
                            <i>{initials}</i>
                            <span>{name}</span>
                          </span>
                          <span className="path-review-status">
                            <b>{form.status || "Pending"}</b>
                            <small>
                              {form.student_id || "Faculty submission"}
                            </small>
                          </span>
                          <span
                            className={`path-review-sla ${isRisk ? "risk" : ""}`}
                          >
                            <i />
                            {isRisk ? "Needs attention" : "On track"}
                          </span>
                          <span className="path-review-chevron">›</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="path-review-empty">
                      <strong>No forms match this view</strong>
                      <span>
                        Try another review status or clear your search.
                      </span>
                    </div>
                  )}
                </article>
                <aside className="path-review-detail">
                  {reviewSelected ? (
                    (() => {
                      const name =
                        reviewSelected.full_name ||
                        reviewSelected.submitter_name ||
                        reviewSelected.student_id ||
                        "Unknown submitter";
                      const initials =
                        name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase() || "?";
                      return (
                        <>
                          <div className="path-review-detail-head">
                            <div>
                              <div className="path-forms-kicker">
                                <i /> Selected review
                              </div>
                              <h3>Decision context</h3>
                            </div>
                          </div>
                          <p>
                            Confirm submission information before you record the
                            next workflow decision.
                          </p>
                          <div className="path-review-detail-title">
                            <span className="path-review-detail-avatar">
                              {initials}
                            </span>
                            <div>
                              <strong>
                                {reviewSelected.category || "Form submission"}
                              </strong>
                              <span>
                                {reviewSelected.tracking_id ||
                                  `FORM-${reviewSelected.id}`}{" "}
                                ·{" "}
                                {reviewSelected.student_id ||
                                  "Faculty submission"}
                              </span>
                            </div>
                          </div>
                          <div className="path-review-deadline">
                            <span>Review deadline</span>
                            <strong>
                              {reviewSelected.filing_date || "Review due soon"}
                            </strong>
                          </div>
                          <div className="path-review-meta">
                            <div>
                              <span>Submitter</span>
                              <strong>{name}</strong>
                            </div>
                            <div>
                              <span>Form type</span>
                              <strong>
                                {reviewSelected.category || "Unclassified"}
                              </strong>
                            </div>
                            <div>
                              <span>Current status</span>
                              <strong>
                                {reviewSelected.status || "Pending"}
                              </strong>
                            </div>
                            <div>
                              <span>Student ID</span>
                              <strong>
                                {reviewSelected.student_id || "—"}
                              </strong>
                            </div>
                          </div>
                          <div className="path-review-focus">
                            <i>✓</i>
                            <div>
                              <strong>Reviewer focus</strong>
                              <span>
                                {reviewSelected.review_note ||
                                  "Confirm required fields and attached evidence before approving this handoff."}
                              </span>
                            </div>
                          </div>
                          <div className="path-review-actions">
                            <button
                              className="primary"
                              type="button"
                              onClick={() => handleReview(reviewSelected)}
                            >
                              Open form record →
                            </button>
                            <button
                              className="return"
                              type="button"
                              onClick={() => handleReview(reviewSelected)}
                            >
                              Return for revision
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReview(reviewSelected)}
                            >
                              Review & decide
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="path-review-empty">
                      <strong>Your review queue is clear</strong>
                      <span>
                        New assigned form submissions will appear here.
                      </span>
                    </div>
                  )}
                </aside>
              </section>
            </>
          )}

          {/* ── REVIEW QUEUE (Program Chair) / MY SUBMISSIONS (Faculty) ── */}
          {(activeTab === "history" || activeTab === "review") && (
            <div
              style={{
                display:
                  isProgramChair && activeTab === "review" ? "none" : undefined,
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
              }}
            >
              <div
                style={{
                  background: "white",
                  border: "1px solid #cbc3d7",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.05)",
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #cbc3d7",
                    background: "#fcf8ff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <h3
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#181445",
                            margin: "0 0 2px",
                          }}
                        >
                          {isProgramChair
                            ? "Review Queue"
                            : "Document Repository"}
                        </h3>
                        {isProgramChair && stats.pending > 0 && (
                          <span
                            style={{
                              background: "#fef9c3",
                              color: "#854d0e",
                              border: "1px solid #fef08a",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 10px",
                              borderRadius: 20,
                            }}
                          >
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
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          border: "1px solid #cbc3d7",
                          borderRadius: 10,
                          background: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "#494454",
                        }}
                      >
                        <Icon.Filter /> More Filters
                      </button>
                      <button
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          border: "1px solid #cbc3d7",
                          borderRadius: 10,
                          background: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "#494454",
                        }}
                      >
                        <Icon.ExportCSV /> Export
                      </button>
                    </div>
                  </div>

                  {/* Search (mirrors the mockup's filters bar) */}
                  <div style={{ position: "relative", maxWidth: 420 }}>
                    <span
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#7b7486",
                      }}
                    >
                      <Icon.Search />
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search forms by ID, title, or submitter..."
                      style={{
                        width: "100%",
                        padding: "9px 12px 9px 34px",
                        border: "1px solid #cbc3d7",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#181445",
                        background: "white",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      minWidth: 760,
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f6f2ff" }}>
                        {[
                          "Document ID",
                          "Name",
                          "Category",
                          "Filing Date",
                          "Status",
                          "Actions",
                        ].map((h, i) => (
                          <th
                            key={h}
                            style={{
                              padding: "16px 24px",
                              textAlign: i === 5 ? "right" : "left",
                              fontSize: 11,
                              fontWeight: 500,
                              color: "#494454",
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                              borderBottom: "1px solid #cbc3d7",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              padding: 40,
                              textAlign: "center",
                              color: "#aaa",
                              fontSize: 13,
                            }}
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : forms.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ padding: 48, textAlign: "center" }}
                          >
                            <div style={{ color: "#aaa", fontSize: 13 }}>
                              {isProgramChair
                                ? "No pending forms to review."
                                : "No submissions yet."}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        forms.map((row) => (
                          <tr
                            key={row.id}
                            className="group"
                            style={{
                              borderBottom: "1px solid #e3dfff",
                              transition: "background .15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#f6f2ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "white")
                            }
                          >
                            <td style={{ padding: "16px 24px" }}>
                              <span
                                style={{
                                  color: "#7b7486",
                                  fontWeight: 500,
                                  fontSize: 12,
                                  fontFamily: "monospace",
                                }}
                              >
                                {row.tracking_id || row.id}
                              </span>
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <Avatar
                                  name={row.full_name || row.student_id || "?"}
                                  src={
                                    row.submitter_avatar
                                      ? resolveFileUrl(row.submitter_avatar)
                                      : null
                                  }
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 500,
                                      color: "#181445",
                                    }}
                                  >
                                    {row.full_name}
                                  </div>
                                  {row.student_id && (
                                    <span
                                      style={{
                                        display: "inline-block",
                                        fontSize: 10,
                                        fontWeight: 600,
                                        color: "#5f5293",
                                        background: "#e7deff",
                                        padding: "2px 6px",
                                        borderRadius: 999,
                                        marginTop: 2,
                                      }}
                                    >
                                      {row.student_id}
                                    </span>
                                  )}
                                  {isProgramChair && row.submitter_name && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: "#7b7486",
                                        marginTop: 2,
                                      }}
                                    >
                                      by {row.submitter_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: 14,
                                color: "#494454",
                              }}
                            >
                              {row.category}
                            </td>
                            <td
                              style={{
                                padding: "16px 24px",
                                fontSize: 14,
                                color: "#494454",
                              }}
                            >
                              {row.filing_date}
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <StatusBadge status={row.status} />
                              {!isProgramChair &&
                                row.status === "Revision" &&
                                row.review_note && (
                                  <div
                                    style={{
                                      marginTop: 5,
                                      background: "#fef9c3",
                                      border: "1px solid #fef08a",
                                      borderRadius: 6,
                                      padding: "5px 8px",
                                      maxWidth: 220,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 9,
                                        fontWeight: 800,
                                        color: "#854d0e",
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        marginBottom: 2,
                                      }}
                                    >
                                      📝 Revision Note
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#78350f",
                                        lineHeight: 1.4,
                                      }}
                                    >
                                      {row.review_note}
                                    </div>
                                  </div>
                                )}
                            </td>
                            <td style={{ padding: "16px 24px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  justifyContent: "flex-end",
                                }}
                              >
                                {isProgramChair &&
                                  (row.status === "Pending" ||
                                    row.status === "Reviewing") && (
                                    <button
                                      onClick={() => handleReview(row)}
                                      style={{
                                        padding: "5px 12px",
                                        border: "1px solid #6d3bd7",
                                        borderRadius: 8,
                                        background: "#ede9fe",
                                        cursor: "pointer",
                                        color: "#6d3bd7",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    >
                                      Review
                                    </button>
                                  )}
                                {!isProgramChair &&
                                  row.status === "Revision" && (
                                    <button
                                      onClick={() => {
                                        setResubmitForm(row);
                                        setResubmitFile(null);
                                        setResubmitModal(true);
                                      }}
                                      style={{
                                        padding: "5px 12px",
                                        border: "1px solid #d97706",
                                        borderRadius: 8,
                                        background: "#fef9c3",
                                        cursor: "pointer",
                                        color: "#854d0e",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 700,
                                      }}
                                    >
                                      ↩ Resubmit
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #cbc3d7",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "white",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#494454" }}>
                    Showing page {page} of {totalPages} ({stats.pending || 0}{" "}
                    pending)
                  </span>
                  <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid #cbc3d7",
                        borderRadius: 8,
                        background: "white",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#494454",
                      }}
                    >
                      Previous
                    </button>
                    {Array.from(
                      { length: Math.min(totalPages, 3) },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        style={{
                          width: 28,
                          height: 28,
                          border: "1px solid #cbc3d7",
                          borderRadius: 8,
                          background: page === n ? "#6d3bd7" : "white",
                          color: page === n ? "white" : "#494454",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid #cbc3d7",
                        borderRadius: 8,
                        background: "white",
                        cursor: "pointer",
                        fontSize: 12,
                        color: "#494454",
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              {/* ── EXISTING FORMS (Program Chair): full history, any status ── */}
              {isProgramChair && (
                <div
                  style={{
                    background: "white",
                    border: "1px solid #cbc3d7",
                    borderRadius: 16,
                    overflow: "hidden",
                    marginTop: 20,
                    boxShadow: "0 4px 12px rgba(139,92,246,0.05)",
                  }}
                >
                  <div
                    style={{
                      padding: "16px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #cbc3d7",
                      background: "#fcf8ff",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#181445",
                          margin: "0 0 2px",
                        }}
                      >
                        Existing Forms
                      </h3>
                      <p style={{ fontSize: 12, color: "#7b7486", margin: 0 }}>
                        Every form ever submitted, regardless of status —
                        approved, rejected, or in progress.
                      </p>
                    </div>
                    <div style={{ position: "relative" }}>
                      <select
                        value={allFormsStatusFilter}
                        onChange={(e) => {
                          setAllFormsStatusFilter(e.target.value);
                          setAllFormsPage(1);
                        }}
                        style={{
                          padding: "8px 30px 8px 12px",
                          border: "1px solid #cbc3d7",
                          borderRadius: 10,
                          background: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#494454",
                          cursor: "pointer",
                          appearance: "none",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                        }}
                      >
                        {[
                          "All",
                          "Pending",
                          "Reviewing",
                          "Approved",
                          "Rejected",
                          "Revision",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s === "All" ? "Status: All" : s}
                          </option>
                        ))}
                      </select>
                      <span
                        style={{
                          position: "absolute",
                          right: 9,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      >
                        <Icon.Chevron size={13} />
                      </span>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 720,
                      }}
                    >
                      <thead>
                        <tr style={{ background: "#f6f2ff" }}>
                          {[
                            "Document ID",
                            "Name",
                            "Category",
                            "Filing Date",
                            "Status",
                            "Submitted By",
                          ].map((h) => (
                            <th
                              key={h}
                              style={{
                                padding: "16px 24px",
                                textAlign: "left",
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#494454",
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                                borderBottom: "1px solid #cbc3d7",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allFormsLoading ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{
                                padding: 40,
                                textAlign: "center",
                                color: "#aaa",
                                fontSize: 13,
                              }}
                            >
                              Loading...
                            </td>
                          </tr>
                        ) : allForms.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              style={{ padding: 48, textAlign: "center" }}
                            >
                              <div style={{ color: "#aaa", fontSize: 13 }}>
                                No forms found
                                {allFormsStatusFilter !== "All"
                                  ? ` with status "${allFormsStatusFilter}"`
                                  : ""}
                                .
                              </div>
                            </td>
                          </tr>
                        ) : (
                          allForms.map((row) => (
                            <tr
                              key={row.id}
                              style={{
                                borderBottom: "1px solid #e3dfff",
                                transition: "background .15s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f6f2ff")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "white")
                              }
                            >
                              <td style={{ padding: "16px 24px" }}>
                                <span
                                  style={{
                                    color: "#7b7486",
                                    fontWeight: 500,
                                    fontSize: 12,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {row.tracking_id || row.id}
                                </span>
                              </td>
                              <td style={{ padding: "16px 24px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <Avatar
                                    name={
                                      row.full_name || row.student_id || "?"
                                    }
                                    src={
                                      row.submitter_avatar
                                        ? resolveFileUrl(row.submitter_avatar)
                                        : null
                                    }
                                  />
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: "#181445",
                                      }}
                                    >
                                      {row.full_name}
                                    </div>
                                    {row.student_id && (
                                      <span
                                        style={{
                                          display: "inline-block",
                                          fontSize: 10,
                                          fontWeight: 600,
                                          color: "#5f5293",
                                          background: "#e7deff",
                                          padding: "2px 6px",
                                          borderRadius: 999,
                                          marginTop: 2,
                                        }}
                                      >
                                        {row.student_id}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "16px 24px",
                                  fontSize: 14,
                                  color: "#494454",
                                }}
                              >
                                {row.category}
                              </td>
                              <td
                                style={{
                                  padding: "16px 24px",
                                  fontSize: 14,
                                  color: "#494454",
                                }}
                              >
                                {row.filing_date}
                              </td>
                              <td style={{ padding: "16px 24px" }}>
                                <StatusBadge status={row.status} />
                              </td>
                              <td
                                style={{
                                  padding: "16px 24px",
                                  fontSize: 14,
                                  color: "#494454",
                                }}
                              >
                                {row.submitter_name || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div
                    style={{
                      padding: "16px 24px",
                      borderTop: "1px solid #cbc3d7",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "white",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "#494454" }}>
                      Showing page {allFormsPage} of {allFormsTotalPages}
                    </span>
                    <div
                      style={{ display: "flex", gap: 4, alignItems: "center" }}
                    >
                      <button
                        onClick={() =>
                          setAllFormsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={allFormsPage === 1}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #cbc3d7",
                          borderRadius: 8,
                          background: "white",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#494454",
                        }}
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: Math.min(allFormsTotalPages, 3) },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <button
                          key={n}
                          onClick={() => setAllFormsPage(n)}
                          style={{
                            width: 28,
                            height: 28,
                            border: "1px solid #cbc3d7",
                            borderRadius: 8,
                            background:
                              allFormsPage === n ? "#6d3bd7" : "white",
                            color: allFormsPage === n ? "white" : "#494454",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setAllFormsPage((p) =>
                            Math.min(allFormsTotalPages, p + 1),
                          )
                        }
                        disabled={allFormsPage === allFormsTotalPages}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid #cbc3d7",
                          borderRadius: 8,
                          background: "white",
                          cursor: "pointer",
                          fontSize: 12,
                          color: "#494454",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PROGRAM CHAIR: FORM TEMPLATES TAB ── */}
          {activeTab === "templates" && isProgramChair && (
            <div
              style={{
                background: "white",
                border: "1px solid #f3f4f6",
                borderRadius: 14,
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <h3
                    style={{ fontSize: 15, fontWeight: 700, margin: "0 0 3px" }}
                  >
                    Form Templates
                  </h3>
                  <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                    Define which form types students and faculty can submit.
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate("/document-categories", {
                      state: { openAddModal: true },
                    })
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    background: "#7c3aed",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon.Plus /> Add Form Type
                </button>
              </div>

              {categoriesLoading && (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  Loading categories…
                </p>
              )}
              {!categoriesLoading && categories.length === 0 && (
                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  No active document categories found. Create one in Document
                  Categories first.
                </p>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: 14,
                }}
              >
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "16px 18px",
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={() =>
                        navigate("/document-categories", {
                          state: {
                            editCategoryId: cat.id,
                            editCategoryName: cat.name,
                          },
                        })
                      }
                      title="Edit this form template"
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 9px",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <Icon.Pencil /> Edit
                    </button>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#ede9fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Icon.Forms />
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#111",
                        marginBottom: 4,
                        paddingRight: 60,
                      }}
                    >
                      {cat.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#888" }}>
                      {cat.description || "Standard submission form"}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          background: "#d1fae5",
                          color: "#065f46",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        Active
                      </span>
                      <span
                        style={{
                          background: "#f3f4f6",
                          color: "#6b7280",
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 20,
                        }}
                      >
                        {(cat.formFields || []).length} field
                        {(cat.formFields || []).length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "#ccc",
              paddingTop: 8,
            }}
          >
            © 2026 PATH Document Management System. All Rights Reserved.
          </div>
        </div>
      </div>

      {/* ── RESUBMIT MODAL (Faculty) ── */}
      {resubmitModal && resubmitForm && (
        <Modal
          title="Resubmit Form"
          onClose={() => setResubmitModal(false)}
          width={500}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Reviewer's note */}
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fcd34d",
                borderRadius: 8,
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#92400e",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Revision Instructions from Program Chair
              </div>
              <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.5 }}>
                {resubmitForm.review_note ||
                  "Please update and resubmit your form."}
              </div>
            </div>

            {/* Current file info */}
            {resubmitForm.file_name && (
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  background: "#f9fafb",
                  padding: "8px 12px",
                  borderRadius: 7,
                }}
              >
                Current file: <strong>{resubmitForm.file_name}</strong>
              </div>
            )}

            {/* New file upload */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Upload Revised Document
              </label>
              <div
                onClick={() => resubmitFileRef.current?.click()}
                style={{
                  border: "2px dashed #e5e7eb",
                  borderRadius: 10,
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                <input
                  ref={resubmitFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={(e) => setResubmitFile(e.target.files[0])}
                />
                {resubmitFile ? (
                  <div
                    style={{ color: "#7c3aed", fontWeight: 700, fontSize: 13 }}
                  >
                    ✓ {resubmitFile.name}
                  </div>
                ) : (
                  <div style={{ color: "#888", fontSize: 12 }}>
                    Click to select a new file (PDF, JPG, PNG — max 10MB)
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={async () => {
                  if (!resubmitFile) {
                    alert("Please upload a revised file.");
                    return;
                  }
                  const fd = new FormData();
                  fd.append("file", resubmitFile);
                  fd.append("student_id", resubmitForm.student_id);
                  fd.append("full_name", resubmitForm.full_name);
                  fd.append("category", resubmitForm.category);
                  fd.append("filing_date", resubmitForm.filing_date);
                  fd.append("college_year", resubmitForm.college_year || "");
                  fd.append("section", resubmitForm.section || "");
                  fd.append("original_id", resubmitForm.id);
                  const res = await fetch(
                    `${API}/api/forms/${resubmitForm.id}/resubmit`,
                    {
                      method: "POST",
                      headers: { Authorization: `Bearer ${token}` },
                      body: fd,
                    },
                  );
                  if (res.ok) {
                    setResubmitModal(false);
                    fetchForms();
                    addToast(
                      "Form resubmitted successfully. Program chair has been notified.",
                      "success",
                    );
                  } else {
                    const d = await res.json();
                    alert(d.message || "Resubmit failed.");
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Submit Revised Form
              </button>
              <button
                onClick={() => setResubmitModal(false)}
                style={{
                  padding: "10px 16px",
                  background: "white",
                  color: "#555",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ADD TEMPLATE MODAL ── */}
      {addModal && (
        <Modal
          title="Add Form Template"
          onClose={() => setAddModal(false)}
          width={460}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Form Name *
              </label>
              <input
                type="text"
                value={templateData.name}
                onChange={(e) =>
                  setTemplateData((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Thesis Defense Application"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#111",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Category *
              </label>
              <select
                value={templateData.category}
                onChange={(e) =>
                  setTemplateData((p) => ({ ...p, category: e.target.value }))
                }
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#111",
                  background: "white",
                }}
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "Select category..."}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Description
              </label>
              <textarea
                value={templateData.description}
                onChange={(e) =>
                  setTemplateData((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Briefly describe this form type and when to use it..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#111",
                  resize: "vertical",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 6,
                }}
              >
                Required Fields{" "}
                <span style={{ fontWeight: 400, color: "#888" }}>
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                value={templateData.required_fields}
                onChange={(e) =>
                  setTemplateData((p) => ({
                    ...p,
                    required_fields: e.target.value,
                  }))
                }
                placeholder="e.g. student_id, full_name, adviser_signature"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#111",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={handleAddTemplate}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Template
              </button>
              <button
                onClick={() => setAddModal(false)}
                style={{
                  padding: "10px 16px",
                  background: "white",
                  color: "#555",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
