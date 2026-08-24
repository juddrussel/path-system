import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import { socket, connectSocket } from "./socket";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

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

// ─── AUDIT LOG HELPER ──────────────────────────────────────────────────────────
// Silently posts to audit log — never blocks the UI if it fails
async function logAction(action, detail) {
  try {
    await fetch(`${API_BASE}/audit/log`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ action, detail }),
    });
  } catch {
    /* never crash UI for audit failures */
  }
}

// ─── AVATAR HELPERS ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#ede9fe", "#5b21b6"],
  ["#dbeafe", "#1d4ed8"],
  ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"],
  ["#fce7f3", "#9d174d"],
  ["#e0f2fe", "#0369a1"],
];
function avatarColor(name = "") {
  const i = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(firstName = "", lastName = "") {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Avatar({ firstName, lastName, pictureUrl }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = fullAvatarUrl(pictureUrl);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 object-cover"
        onError={() => setImgFailed(true)}
      />
    );
  }
  return (
    <span
      className="path-um-avatar-fallback inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0"
      aria-label={`${firstName} ${lastName}`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        width="13"
        height="13"
        aria-hidden="true"
      >
        <circle cx="8" cy="5.25" r="2.45" />
        <path
          d="M3.1 14c.45-2.55 2.25-4.15 4.9-4.15s4.45 1.6 4.9 4.15"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function RoleBadge({ role, variant }) {
  const map =
    variant === "audit"
      ? {
          admin: "bg-[#e9ddff] text-[#5a00c6]",
          program_chair: "bg-[#efebff] text-[#6b38d4]",
          faculty: "bg-[#efebff] text-[#6b38d4]",
          guest: "bg-gray-100 text-gray-600",
        }
      : {
          admin: "bg-violet-100 text-violet-700",
          program_chair: "bg-blue-100 text-blue-700",
          faculty: "bg-blue-100 text-blue-700",
          guest: "bg-gray-100 text-gray-600",
        };
  const labels = {
    admin: "Admin",
    program_chair: "Program Chair",
    faculty: "Faculty",
    guest: "Guest",
  };
  const label =
    labels[role] ||
    (role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown");
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${map[role] || map.guest}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ active, variant }) {
  if (variant === "audit") {
    return active ? (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#efebff] text-[#5a00c6] text-[11px] font-bold border border-[#cbc3d7]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#6b38d4]" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[11px] font-bold border border-[#cbc3d7]">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Inactive
      </span>
    );
  }
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-50 text-gray-700 text-[11px] font-bold border border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-gray-500 text-[11px] font-bold border border-gray-100">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Inactive
    </span>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!msg) return null;
  const cls =
    type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : "bg-emerald-50 text-emerald-700 border border-emerald-200";
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-xs font-medium ${cls}`}
    >
      <span>{msg}</span>
      <button
        onClick={onClose}
        className="opacity-50 hover:opacity-100 text-sm leading-none"
      >
        ✕
      </button>
    </div>
  );
}

// ─── ADD USER MODAL ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    is_active: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { full_name, ...rest } = form;
      const trimmed = full_name.trim();
      const spaceIdx = trimmed.indexOf(" ");
      const first_name = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const last_name = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1);
      const user = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          ...rest,
          first_name,
          last_name,
          is_active: form.is_active === "1",
        }),
      });
      onCreated(user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[500px] bg-white rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 shrink-0">
              <UserPlusIcon />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Add New System User
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Create a real account and assign a role.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 rounded-md px-2 py-1 text-base"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Full Name *" className="mb-3">
            <input
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="e.g. Maria Garcia"
            />
          </Field>
          <Field label="Username *" className="mb-3">
            <input
              required
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="e.g. mgarcia"
            />
          </Field>
          <Field label="Work Email" className="mb-3">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@company.com"
            />
          </Field>
          <Field label="Contact Number *" className="mb-3">
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+63 9XX XXX XXXX"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Role *">
              <select
                required
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
              >
                <option value="">Select role…</option>
                <option value="admin">Admin</option>
                <option value="program_chair">Program Chair</option>
                <option value="faculty">Faculty</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.is_active}
                onChange={(e) => set("is_active", e.target.value)}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Password *" className="mb-4">
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? <Spinner /> : <CheckIcon />}
              {loading ? "Creating…" : "Create User Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── EDIT USER MODAL ───────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onUpdated, currentUserRole }) {
  const [form, setForm] = useState({
    full_name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    email: user.email || "",
    phone: user.phone || "",
    department: "Information Systems",
    role: user.role || "",
    is_active: user.is_active ? "1" : "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // program_chair has the same access as admin
  const canChangeRole =
    currentUserRole === "admin" || currentUserRole === "program_chair";
  const canChangeStatus =
    currentUserRole === "admin" || currentUserRole === "program_chair";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const trimmed = form.full_name.trim();
      const spaceIdx = trimmed.indexOf(" ");
      const first_name = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const last_name = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1);
      const payload = {
        first_name,
        last_name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        ...(canChangeRole ? { role: form.role } : {}),
        ...(canChangeStatus ? { is_active: form.is_active === "1" } : {}),
      };
      const updated = await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [bg] = avatarColor(`${user.first_name}${user.last_name}`);

  return (
    <div
      className="fixed inset-0 bg-black/35 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: bg, color: "#5b21b6" }}
            >
              {initials(user.first_name, user.last_name)}
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:bg-gray-100 rounded-md px-2 py-1 text-base leading-none"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <Field label="Full Name *">
            <input
              required
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Full name"
            />
          </Field>

          {/* Email */}
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="user@example.com"
            />
          </Field>

          {/* Phone + Department */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </Field>
            <Field label="Department">
              <input
                value="Information Systems"
                readOnly
                className="opacity-60 cursor-not-allowed"
              />
            </Field>
          </div>

          {/* Role + Status — admin only */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={canChangeRole ? "Role *" : "Role (read-only)"}>
              <select
                value={form.role}
                onChange={(e) => set("role", e.target.value)}
                disabled={!canChangeRole}
                className={
                  !canChangeRole ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                <option value="">Select role…</option>
                <option value="admin">Admin</option>
                <option value="program_chair">Program Chair</option>
                <option value="faculty">Faculty</option>
              </select>
            </Field>
            <Field label={canChangeStatus ? "Status" : "Status (read-only)"}>
              <select
                value={form.is_active}
                onChange={(e) => set("is_active", e.target.value)}
                disabled={!canChangeStatus}
                className={
                  !canChangeStatus ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5"
            >
              {loading ? <Spinner /> : <CheckIcon />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children &&
        React.cloneElement(children, {
          className:
            "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-violet-500 transition-colors",
        })}
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    width="12"
    height="12"
  >
    <path
      d="M11 2l3 3-8 8H3v-3L11 2z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const UserPlusIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15">
    <circle cx="6" cy="5" r="3" />
    <path d="M1 14c0-3 2-5 5-5s5 2 5 5M11 8v6M14 11h-6" />
  </svg>
);
const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="white"
    strokeWidth="1.5"
    width="12"
    height="12"
  >
    <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
  </svg>
);
const TrashIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    width="12"
    height="12"
  >
    <path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4" strokeLinecap="round" />
  </svg>
);
const ApproveIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="11"
    height="11"
  >
    <path d="M13 4l-7 8-3-3" strokeLinecap="round" />
  </svg>
);
const RejectIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="11"
    height="11"
  >
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
  </svg>
);
const ShieldIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <circle cx="6" cy="5" r="3" />
    <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
    <path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
    <path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" />
  </svg>
);
const SearchIcon = () => (
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
);
const Spinner = () => (
  <svg
    className="animate-spin"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="12"
    height="12"
  >
    <circle cx="8" cy="8" r="6" strokeOpacity=".25" />
    <path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" />
  </svg>
);
const EyeIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    width="12"
    height="12"
  >
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);
const DownloadIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    width="13"
    height="13"
  >
    <path
      d="M8 2v8M5 7l3 3 3-3M3 13h10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
    <circle cx="8" cy="3" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="8" cy="13" r="1.3" />
  </svg>
);

// ─── USER DETAIL PANEL ────────────────────────────────────────────────────────
// ─── DELETE USER MODAL ─────────────────────────────────────────────────────────
function DeleteUserModal({ user, onClose, onConfirm }) {
  const [mode, setMode] = useState("preserve");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return null;

  async function handleConfirm() {
    setLoading(true);
    setError("");
    try {
      await onConfirm(mode);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-[480px] bg-white rounded-xl p-6 shadow-2xl">
        <div className="flex gap-3 items-start mb-4">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
            <TrashIcon />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Permanently Delete {user.name}?
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              This cannot be undone. Choose how to handle content this user was
              involved in.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-2.5 mb-5">
          <label
            className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "preserve" ? "border-violet-300 bg-violet-50/60" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="delete-mode"
              checked={mode === "preserve"}
              onChange={() => setMode("preserve")}
              className="mt-0.5"
            />
            <div>
              <div className="text-xs font-bold text-gray-800">
                Preserve others' content{" "}
                <span className="text-violet-500 font-semibold">
                  (recommended)
                </span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Comments, submissions, and tasks this user owns are deleted. If
                they only reviewed, assigned, or received something belonging to
                someone else, that record stays — just shown as "Unknown user."
              </p>
            </div>
          </label>

          <label
            className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "cascade" ? "border-red-300 bg-red-50/60" : "border-gray-200 hover:bg-gray-50"}`}
          >
            <input
              type="radio"
              name="delete-mode"
              checked={mode === "cascade"}
              onChange={() => setMode("cascade")}
              className="mt-0.5"
            />
            <div>
              <div className="text-xs font-bold text-gray-800">
                Delete everything, including others' content
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Also deletes form submissions this user reviewed, tasks they
                assigned, and messages they received — even though that content
                may belong to other users.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Permanently Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailPanel({ user, onClose, onDelete, currentUserId, fmtDate }) {
  if (!user) return null;
  const [bg, fg] = avatarColor(`${user.first_name}${user.last_name}`);
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div
        className="fixed top-0 right-0 h-full w-[320px] bg-white z-40 flex flex-col shadow-2xl"
        style={{ borderLeft: "1px solid #f0f0f0" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-800">User Details</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Avatar hero */}
        <div
          className="flex flex-col items-center px-5 py-7 shrink-0"
          style={{
            background: `linear-gradient(160deg, ${bg}88 0%, #fff 65%)`,
          }}
        >
          {fullAvatarUrl(user.avatar_url) ? (
            <img
              src={fullAvatarUrl(user.avatar_url)}
              alt={`${user.first_name} ${user.last_name}`}
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: bg, color: fg }}
            >
              {initials(user.first_name, user.last_name)}
            </span>
          )}
          <h2 className="mt-3 text-base font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
          <div className="flex gap-2 mt-3">
            <RoleBadge role={user.role} />
            <StatusBadge active={user.is_active} />
          </div>
        </div>
        {/* Info rows */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {[
            {
              label: "Full Name",
              value: `${user.first_name} ${user.last_name}`,
            },
            { label: "Email", value: user.email || "—" },
            { label: "Username", value: `@${user.username}` },
            { label: "Phone", value: user.phone || "—" },
            { label: "Department", value: user.department || "—" },
            {
              label: "Role",
              value: user.role
                ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                : "—",
            },
            { label: "Status", value: user.is_active ? "Active" : "Inactive" },
            { label: "Member Since", value: fmtDate(user.created_at) },
            { label: "Last Updated", value: fmtDate(user.updated_at) },
            { label: "User ID", value: `#${user.id}` },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-3"
            >
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0 mt-0.5">
                {label}
              </span>
              <span className="text-xs text-gray-800 font-medium text-right break-all">
                {value}
              </span>
            </div>
          ))}
        </div>
        {/* Footer action */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          {user.id !== currentUserId ? (
            <button
              onClick={() => {
                onDelete(user.id, `${user.first_name} ${user.last_name}`);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <TrashIcon /> Remove This User
            </button>
          ) : (
            <p className="text-center text-xs text-gray-400">
              This is your own account.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, iconBg, icon, badge, variant }) {
  if (variant === "audit") {
    // Audit Trail–style card: border-[#cbc3d7], rounded-2xl, shadow-sm, larger value type
    return (
      <div className="bg-white border border-[#cbc3d7] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
          >
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-bold text-[#5a00c6] bg-[#efebff] px-2 py-1 rounded-md">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-[#494454] uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-4xl font-bold text-[#181445] leading-tight">
          {value ?? "—"}
        </p>
        {sub && !badge && <p className="text-xs text-[#7b7486] mt-2">{sub}</p>}
      </div>
    );
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        {badge && (
          <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-md">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value ?? "—"}</p>
      {sub && !badge && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function PathDirectoryList({
  users,
  total,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  canEdit,
  currentUserId,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="path-um-directory">
      <header className="path-um-directory-head">
        <div>
          <div className="path-um-kicker">Workspace directory</div>
          <h2>
            All people <span>{total}</span>
          </h2>
          <p>Roles, access, and workload at a glance.</p>
        </div>
        <div className="path-um-directory-controls">
          <label className="path-um-directory-search">
            <SearchIcon />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people"
              aria-label="Search people"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="program_chair">Program Chair</option>
            <option value="faculty">Faculty</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </header>
      <div className="path-um-list-head">
        <span>Person</span>
        <span>Role &amp; department</span>
        <span>Access</span>
        <span>Assignments</span>
        <span />
      </div>
      {users.length === 0 ? (
        <div className="path-um-empty">
          <UsersIcon />
          <strong>No users match these filters</strong>
          <span>Try a different role, status, or search term.</span>
        </div>
      ) : (
        users.map((u) => (
          <div className="path-um-person-row" key={u.id}>
            <div className="path-um-person">
              <Avatar
                firstName={u.first_name}
                lastName={u.last_name}
                pictureUrl={u.avatar_url}
              />
              <div>
                <strong>
                  {u.first_name} {u.last_name}
                </strong>
                <span>{u.email || `@${u.username}`}</span>
              </div>
            </div>
            <div className="path-um-role">
              <strong>
                {u.role
                  ? u.role
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (letter) => letter.toUpperCase())
                  : "Unassigned"}
              </strong>
              <span>{u.department || "Workspace member"}</span>
            </div>
            <div
              className={`path-um-access ${u.is_active ? "active" : "inactive"}`}
            >
              <strong>
                <i />
                {u.is_active ? "Active" : "Inactive"}
              </strong>
              <small>
                {u.last_active ||
                  u.last_login ||
                  (u.is_active ? "Active now" : "Access paused")}
              </small>
            </div>
            <div className="path-um-assignment">
              <strong>
                {u.assignments ?? u.assignment_count ?? u.task_count ?? 0}
              </strong>
              <span>
                {(u.assignments ?? u.assignment_count ?? u.task_count ?? 0) ===
                1
                  ? "assignment"
                  : "assignments"}
              </span>
            </div>
            <div className="path-um-row-actions">
              <button onClick={() => onView(u)} title="View user details">
                <MoreIcon />
              </button>
              {canEdit && (
                <button onClick={() => onEdit(u)} title="Edit user">
                  <EditIcon />
                </button>
              )}
              {u.id !== currentUserId ? (
                <button
                  onClick={() =>
                    onDelete({
                      id: u.id,
                      name: `${u.first_name} ${u.last_name}`,
                    })
                  }
                  title="Remove user"
                  className="danger"
                >
                  <TrashIcon />
                </button>
              ) : (
                <span className="path-um-self">you</span>
              )}
            </div>
          </div>
        ))
      )}
      <div className="path-um-list-foot">
        Showing {users.length} of {total} user{total !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

function PathRequestList({
  pending,
  onApprove,
  onReject,
  onApproveAll,
  fmtDate,
}) {
  return (
    <section className="path-um-request-review">
      <header className="path-um-request-review-head">
        <div>
          <div className="path-um-kicker">Access review</div>
          <h2>
            Pending account requests <span>{pending.length}</span>
          </h2>
          <p>
            Approve to grant the requested workspace role, or decline when
            access is not yet appropriate.
          </p>
        </div>
        {pending.length > 1 && (
          <button
            type="button"
            className="path-um-approve-all"
            onClick={onApproveAll}
          >
            Approve all
          </button>
        )}
      </header>
      <div className="path-um-request-list">
        {pending.length === 0 ? (
          <div className="path-um-empty">
            <ShieldIcon />
            <strong>All clear</strong>
            <span>There are no pending account requests to review.</span>
          </div>
        ) : (
          pending.map((u) => (
            <article className="path-um-request-row" key={u.id}>
              <div className="path-um-request-person">
                <Avatar
                  firstName={u.first_name}
                  lastName={u.last_name}
                  pictureUrl={u.avatar_url}
                />
                <div>
                  <strong>
                    {u.first_name} {u.last_name}
                  </strong>
                  <span>{u.email || "No email provided"}</span>
                  <small>
                    {u.department || "Workspace member"} · Requested{" "}
                    {fmtDate(u.date_joined || u.created_at)}
                  </small>
                </div>
              </div>
              <div className="path-um-request-role">
                <span>Requested role</span>
                <strong>
                  {u.role
                    ? u.role
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (letter) => letter.toUpperCase())
                    : "Faculty"}
                </strong>
              </div>
              <p>
                {u.request_reason ||
                  u.reason ||
                  "Requesting access to submit and track department documents."}
              </p>
              <div className="path-um-request-actions">
                <button
                  onClick={() =>
                    onReject(u.id, `${u.first_name} ${u.last_name}`)
                  }
                  className="path-um-decline"
                >
                  <RejectIcon /> Decline
                </button>
                <button
                  onClick={() => onApprove(u.id)}
                  className="path-um-approve"
                >
                  <ApproveIcon /> Approve
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function PathResolvedRequestList({ resolved, fmtDate }) {
  return (
    <div className="path-um-resolved-list">
      {resolved.length === 0 ? (
        <div className="path-um-empty">
          <CheckIcon />
          <strong>No resolved requests yet</strong>
          <span>Approved and declined account decisions will appear here.</span>
        </div>
      ) : (
        resolved.map((request, index) => (
          <article
            className="path-um-resolved-row"
            key={`${request.id}-${index}`}
          >
            <Avatar
              firstName={request.first_name}
              lastName={request.last_name}
              pictureUrl={request.avatar_url}
            />
            <div className="path-um-request-person">
              <strong>
                {request.first_name} {request.last_name}
              </strong>
              <span>{request.email || "No email provided"}</span>
              <small>@{request.username}</small>
            </div>
            <div className="path-um-request-role">
              <span>Role</span>
              <RoleBadge role={request.role} variant="audit" />
            </div>
            <div className="path-um-resolution">
              <span
                className={
                  request.decision === "approved" ? "approved" : "rejected"
                }
              >
                {request.decision === "approved" ? "Approved" : "Rejected"}
              </span>
              <small>
                {fmtDate(request.resolved_on)} · {request.resolved_by || "—"}
              </small>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function PathAccessManagement({ users, onManageRoles }) {
  const roleCount = (role) => users.filter((user) => user.role === role).length;
  return (
    <aside className="path-um-access-card">
      <div className="path-um-access-card-head">
        <div>
          <div className="path-um-kicker">Management</div>
          <h3>Access at a glance</h3>
        </div>
        <ShieldIcon />
      </div>
      <p>
        Use roles to keep submissions and approvals accountable across the
        department.
      </p>
      <div className="path-um-role-summary">
        <span className="path-um-role-icon violet">
          <ShieldIcon />
        </span>
        <div>
          <strong>Program Chairs</strong>
          <span>Review, approve, and assign</span>
        </div>
        <b>{roleCount("program_chair")}</b>
      </div>
      <div className="path-um-role-summary">
        <span className="path-um-role-icon blue">
          <UsersIcon />
        </span>
        <div>
          <strong>Faculty</strong>
          <span>Submit and track documents</span>
        </div>
        <b>{roleCount("faculty")}</b>
      </div>
      <div className="path-um-role-summary">
        <span className="path-um-role-icon amber">
          <ShieldIcon />
        </span>
        <div>
          <strong>Administrators</strong>
          <span>Manage workspace access</span>
        </div>
        <b>{roleCount("admin")}</b>
      </div>
      <button
        type="button"
        className="path-um-role-action"
        onClick={onManageRoles}
      >
        Manage role permissions ↗
      </button>
    </aside>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function UserManagement() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [resolved, setResolved] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name } — controls DeleteUserModal
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const currentUserId = (() => {
    try {
      return JSON.parse(
        atob(localStorage.getItem("token")?.split(".")[1] || ""),
      )?.id;
    } catch {
      return null;
    }
  })();
  const currentUserRole = (() => {
    try {
      return JSON.parse(
        atob(localStorage.getItem("token")?.split(".")[1] || ""),
      )?.role;
    } catch {
      return null;
    }
  })();
  const canEdit =
    currentUserRole === "admin" || currentUserRole === "program_chair";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(currentUserRole);

  const notify = (msg, type = "success") => setToast({ msg, type });

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, pendingData, resolvedData, statsData] =
        await Promise.all([
          apiFetch("/users"),
          apiFetch("/users/pending"),
          apiFetch("/users/resolved"),
          apiFetch("/users/stats"),
        ]);
      setUsers(usersData);
      setPending(pendingData);
      setResolved(resolvedData);
      setStats(statsData);
      if (pendingData.length > 0) setTab("permissions");
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Poll every 30 seconds for new pending registrations ──────────────────────
  // Kept as a fallback in case the socket connection drops, so a missed
  // real-time event still surfaces within 30s.
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [pendingData, statsData] = await Promise.all([
          apiFetch("/users/pending"),
          apiFetch("/users/stats"),
        ]);
        setPending(pendingData);
        setStats((s) => ({ ...s, ...statsData }));
        if (pendingData.length > 0) setTab("permissions");
      } catch {
        /* silently ignore */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Real-time: new account registration ───────────────────────────────────
  // The register route emits a "user_registered" notification (see
  // notifyAdminsOfPendingRegistration() on the backend) to every admin /
  // program_chair the moment someone signs up. Catching it here refreshes
  // the pending list immediately and pops a toast, instead of waiting on
  // the 30s poll above.
  useEffect(() => {
    if (!canViewAdminNav) return;
    connectSocket();

    const onNotification = async (row) => {
      if (row.type !== "user_registered") return;
      try {
        const [pendingData, statsData] = await Promise.all([
          apiFetch("/users/pending"),
          apiFetch("/users/stats"),
        ]);
        setPending(pendingData);
        setStats((s) => ({ ...s, ...statsData }));
        setTab("permissions");
        notify(row.message || "A new account is awaiting approval.");
      } catch {
        /* next poll will catch it */
      }
    };

    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, [canViewAdminNav]);

  // ── User actions ────────────────────────────────────────────────────────────
  // Called from DeleteUserModal after the user picks a mode and confirms.
  // Intentionally does NOT catch errors — the modal awaits this and shows
  // its own inline error message on failure, so it stays open to retry.
  async function handleDelete(userId, name, mode) {
    await apiFetch(`/users/${userId}`, {
      method: "DELETE",
      body: JSON.stringify({ mode }),
    });
    await logAction(
      "USER_DELETE",
      `Admin permanently deleted user account: ${name} (ID: ${userId}, mode: ${mode})`,
    );
    setUsers((u) => u.filter((x) => x.id !== userId));
    setStats((s) => ({ ...s, total: (s.total ?? 1) - 1 }));
    if (selectedUser?.id === userId) setSelectedUser(null);
    notify(`${name} has been permanently deleted.`);
  }

  async function handleApprove(userId) {
    try {
      await apiFetch(`/users/${userId}/approve`, { method: "PATCH" });
      const approved = pending.find((u) => u.id === userId);
      await logAction(
        "USER_APPROVE",
        `Admin approved account: ${approved?.first_name} ${approved?.last_name} (@${approved?.username}, ID: ${userId})`,
      );
      setPending((p) => p.filter((u) => u.id !== userId));
      if (approved) {
        setUsers((u) => [...u, { ...approved, is_active: true }]);
        setResolved((r) => [
          {
            ...approved,
            decision: "approved",
            resolved_on: new Date().toISOString(),
            resolved_by: "You",
          },
          ...r,
        ]);
      }
      setStats((s) => ({
        ...s,
        approved_this_month: (s.approved_this_month ?? 0) + 1,
      }));
      notify("Account approved and user notified via email.");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function handleReject(userId, name) {
    if (!window.confirm(`Reject ${name}'s account request?`)) return;
    try {
      await apiFetch(`/users/${userId}/reject`, { method: "PATCH" });
      const rejected = pending.find((u) => u.id === userId);
      await logAction(
        "USER_REJECT",
        `Admin rejected account request: ${name} (@${rejected?.username}, ID: ${userId})`,
      );
      setPending((p) => p.filter((u) => u.id !== userId));
      if (rejected) {
        setResolved((r) => [
          {
            ...rejected,
            decision: "rejected",
            resolved_on: new Date().toISOString(),
            resolved_by: "You",
          },
          ...r,
        ]);
      }
      setStats((s) => ({
        ...s,
        rejected_this_month: (s.rejected_this_month ?? 0) + 1,
      }));
      notify(`${name}'s request has been rejected.`);
    } catch (err) {
      notify(err.message, "error");
    }
  }

  async function handleApproveAll() {
    if (!window.confirm("Approve all pending accounts?")) return;
    try {
      await Promise.all(
        pending.map((u) =>
          apiFetch(`/users/${u.id}/approve`, { method: "PATCH" }),
        ),
      );
      await logAction(
        "USER_APPROVE_ALL",
        `Admin bulk-approved ${pending.length} pending account(s): ${pending.map((u) => u.username).join(", ")}`,
      );
      const now = new Date().toISOString();
      setUsers((u) => [
        ...u,
        ...pending.map((p) => ({ ...p, is_active: true })),
      ]);
      setResolved((r) => [
        ...pending.map((p) => ({
          ...p,
          decision: "approved",
          resolved_on: now,
          resolved_by: "You",
        })),
        ...r,
      ]);
      setStats((s) => ({
        ...s,
        approved_this_month: (s.approved_this_month ?? 0) + pending.length,
      }));
      setPending([]);
      notify("All pending accounts have been approved.");
    } catch (err) {
      notify(err.message, "error");
    }
  }

  function handleUpdate(updated) {
    setUsers((u) =>
      u.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
    );
    if (selectedUser?.id === updated.id)
      setSelectedUser((s) => ({ ...s, ...updated }));
    logAction(
      "USER_EDIT",
      `Admin updated user: ${updated.first_name} ${updated.last_name} (@${updated.username}, ID: ${updated.id})`,
    );
    notify(`${updated.first_name} ${updated.last_name} has been updated.`);
  }

  // ── Filtered users ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${u.first_name} ${u.last_name} ${u.email} ${u.username}`
        .toLowerCase()
        .includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "Active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      className="path-um-page flex min-h-screen bg-[#f8f7ff]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
        .path-um-page { color:#51455b; }
        .path-um-page, .path-um-page button, .path-um-page input, .path-um-page select { font-family:'DM Sans',sans-serif; }
        .path-um-main { background:#f8f7ff; }
        .path-um-tabs { max-width:1500px; width:100%; margin:0 auto; padding-left:48px; padding-right:48px; }
        .path-um-content { max-width:1500px; width:100%; margin:0 auto; padding-left:48px; padding-right:48px; }
        .path-um-hero { display:flex; align-items:flex-end; justify-content:space-between; gap:28px; min-height:160px; padding:24px 26px; border:1px solid #e6ddf5; border-left:2px solid #c4b5fd; border-radius:12px; background:linear-gradient(118deg,#fbf9ff,#f4edff); box-shadow:0 12px 30px rgba(57,36,93,.04); }
        .path-um-kicker { display:flex; align-items:center; gap:7px; margin-bottom:10px; color:#968b9f; font-size:9px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
        .path-um-kicker::before { width:6px; height:6px; border-radius:50%; background:#8b5cf6; content:''; box-shadow:0 0 0 3px #eee7fd; }
        .path-um-hero h1 { margin:0; color:#302638; font-family:'Manrope',sans-serif; font-size:clamp(36px,4.6vw,52px); font-weight:800; letter-spacing:-.055em; line-height:.98; }
        .path-um-hero p { max-width:650px; margin:10px 0 0; color:#756a7e; font-size:13px; line-height:1.5; }
        .path-um-hero-actions { display:flex; align-items:center; gap:12px; }
        .path-um-insight { display:flex; align-items:center; gap:9px; padding:10px 12px; border:1px solid #e1d6f2; border-radius:8px; background:#fff; }
        .path-um-insight-icon { display:grid; width:29px; height:29px; place-items:center; border-radius:8px; background:#eee7fd; color:#7044c5; }
        .path-um-insight strong { display:block; color:#5b4f64; font-family:'Manrope',sans-serif; font-size:10px; }
        .path-um-insight small { display:block; margin-top:2px; color:#9a90a2; font-size:8px; }
        .path-um-primary { display:inline-flex; min-height:40px; align-items:center; justify-content:center; gap:8px; border-radius:9px; padding:0 15px; background:#7c3aed; color:#fff; font-size:10px; font-weight:800; box-shadow:0 7px 17px rgba(124,58,237,.2); }
        .path-um-stat-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; margin-top:22px; }
        .path-um-stat-card { min-height:116px; padding:20px 21px; border:1px solid #e7e2ec; border-radius:9px; background:#fff; box-shadow:0 5px 20px rgba(67,44,89,.03); }
        .path-um-stat-card span { color:#a198a7; font-size:10px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .path-um-stat-card strong { display:block; margin-top:7px; color:#40344b; font-family:'Manrope',sans-serif; font-size:34px; letter-spacing:-.06em; line-height:1; }
        .path-um-stat-card small { display:block; margin-top:5px; color:#9c92a3; font-size:10px; }
        .path-um-panel { border-color:#e5deed !important; border-radius:12px !important; box-shadow:0 12px 30px rgba(57,36,93,.045) !important; }
        .path-um-panel h2, .path-um-panel h3 { font-family:'Manrope',sans-serif; letter-spacing:-.04em; }
        .path-um-directory-layout { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(290px,.72fr); gap:18px; align-items:start; }
        .path-um-access-card { padding:21px; border:1px solid #e5deed; border-radius:12px; background:#fff; box-shadow:0 12px 30px rgba(57,36,93,.045); }
        .path-um-access-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }.path-um-access-card-head h3 { margin:3px 0 0; color:#4d3f55; font-family:'Manrope',sans-serif; font-size:15px; letter-spacing:-.035em; }.path-um-access-card-head > svg { color:#a398aa; }.path-um-access-card > p { margin:17px 0 11px; padding:12px 13px; border-radius:8px; background:#faf8ff; color:#8c8197; font-size:9px; line-height:1.55; }.path-um-role-summary { display:flex; align-items:center; gap:10px; padding:13px 0; border-bottom:1px solid #f0edf4; }.path-um-role-summary > div { display:flex; min-width:0; flex:1; flex-direction:column; gap:4px; }.path-um-role-summary strong { color:#65586d; font-family:'Manrope',sans-serif; font-size:9px; }.path-um-role-summary div span { color:#9d92a4; font-size:8px; }.path-um-role-summary b { color:#5d4d66; font-family:'Manrope',sans-serif; font-size:15px; }.path-um-role-icon { display:grid; width:28px; height:28px; place-items:center; border-radius:8px; }.path-um-role-icon.violet { background:#eee7fd; color:#7044c5; }.path-um-role-icon.blue { background:#e8f1fc; color:#5e86ae; }.path-um-role-icon.amber { background:#fcf0d6; color:#a27a1d; }.path-um-role-action { margin-top:16px; color:#7543c7; font-size:9px; font-weight:800; }
        .path-um-directory { background:#fff; }.path-um-directory-head { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; padding:20px 22px 16px; border-bottom:1px solid #f1edf5; background:linear-gradient(180deg,#fff,#fdfbff); }.path-um-directory-head h2 { margin:3px 0 0; color:#40344b; font-family:'Manrope',sans-serif; font-size:18px; letter-spacing:-.04em; }.path-um-directory-head h2 span { display:inline-grid; min-width:19px; height:17px; margin-left:5px; place-items:center; border-radius:5px; background:#f0e9fc; color:#7543c7; font-family:'DM Sans',sans-serif; font-size:8px; vertical-align:middle; }.path-um-directory-head p { margin:5px 0 0; color:#a098a7; font-size:9px; }.path-um-directory-controls { display:flex; align-items:center; gap:10px; }.path-um-directory-search { display:flex; width:174px; align-items:center; gap:7px; padding:0 3px; color:#6e6475; }.path-um-directory-search input { width:100%; border:0; outline:0; background:transparent; color:#5c5164; font-size:9px; }.path-um-directory-search input::placeholder { color:#aaa0ad; }.path-um-directory-controls select { min-width:94px; padding:4px 22px 4px 3px; border:0; outline:0; background:#fff; color:#64596c; font-size:9px; cursor:pointer; }
        .path-um-list-head, .path-um-person-row { display:grid; grid-template-columns:minmax(230px,1.55fr) minmax(145px,.9fr) minmax(125px,.75fr) 82px 32px; gap:14px; align-items:center; }
        .path-um-list-head { padding:10px 22px; border-bottom:1px solid #f0edf4; background:#fbf9fd; color:#8f8597; font-size:8px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
        .path-um-person-row { min-height:74px; padding:13px 22px; border-bottom:1px solid #f0edf4; background:#fff; transition:background .16s ease,box-shadow .16s ease; }
        .path-um-person-row:hover { background:#fbf9ff; box-shadow:inset 2px 0 #a78bfa; }
        .path-um-person, .path-um-role, .path-um-access, .path-um-assignment { display:flex; min-width:0; align-items:center; gap:8px; }
        .path-um-person > div, .path-um-role, .path-um-access, .path-um-assignment { flex-direction:column; align-items:flex-start; gap:4px; }
        .path-um-person > div { display:flex; min-width:0; justify-content:center; }
        .path-um-person > span, .path-um-person > img { flex:0 0 28px; width:28px; height:28px; margin:0 !important; }
        .path-um-person strong { display:block; overflow:hidden; width:100%; color:#40344b; font-family:'Manrope',sans-serif; font-size:10px; line-height:1.2; text-overflow:ellipsis; white-space:nowrap; }
        .path-um-person span, .path-um-role > span, .path-um-access small, .path-um-assignment span { display:block; overflow:hidden; max-width:100%; color:#a095a5; font-size:8px; line-height:1.25; text-overflow:ellipsis; white-space:nowrap; }
        .path-um-role strong { color:#55475c; font-family:'Manrope',sans-serif; font-size:9px; }.path-um-role > span { margin-top:2px; }.path-um-access strong { display:flex; align-items:center; gap:5px; color:#564b5b; font-size:9px; }.path-um-access strong i { width:6px; height:6px; border-radius:50%; background:#37303d; }.path-um-access.inactive strong i { background:#b18720; }.path-um-assignment strong { color:#6844af; font-family:'Manrope',sans-serif; font-size:16px; line-height:1; }
        .path-um-row-actions { position:relative; display:flex; align-items:center; justify-content:flex-end; gap:4px; }.path-um-row-actions button { display:grid; width:26px; height:26px; place-items:center; border-radius:6px; color:#897e90; }.path-um-row-actions button:hover { background:#f0e9fc; color:#6d3ec5; }.path-um-row-actions button.danger:hover { background:#fff0f0; color:#b65d61; }.path-um-row-actions button:not(:first-child) { position:absolute; right:28px; opacity:0; pointer-events:none; transition:opacity .16s ease; }.path-um-person-row:hover .path-um-row-actions button:not(:first-child) { opacity:1; pointer-events:auto; }.path-um-row-actions button:nth-child(3) { right:54px; }.path-um-self { color:#a095a5; font-size:8px; font-weight:800; }
        .path-um-list-foot { padding:12px 22px; background:#fcfbfe; color:#9c92a3; font-size:9px; }
        .path-um-request-list { display:flex; flex-direction:column; }.path-um-request-row { display:grid; grid-template-columns:32px minmax(185px,1.1fr) 132px minmax(160px,1fr) auto; gap:14px; align-items:center; min-height:88px; padding:15px 22px; border-bottom:1px solid #f0edf4; background:#fff; }.path-um-request-row:last-child { border-bottom:0; }.path-um-request-row > span { margin-right:0 !important; }.path-um-request-person, .path-um-request-role { display:flex; min-width:0; flex-direction:column; gap:4px; }.path-um-request-person strong { overflow:hidden; color:#56465f; font-family:'Manrope',sans-serif; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.path-um-request-person span, .path-um-request-person small, .path-um-request-role > span { overflow:hidden; color:#a095a5; font-size:8px; text-overflow:ellipsis; white-space:nowrap; }.path-um-request-role > span { font-weight:800; letter-spacing:.07em; text-transform:uppercase; }.path-um-request-row > p { margin:0; color:#847889; font-size:9px; line-height:1.45; }.path-um-request-actions { display:flex; align-items:center; justify-content:flex-end; gap:7px; }.path-um-request-actions button { display:inline-flex; min-height:31px; align-items:center; gap:5px; border-radius:6px; padding:0 9px; font-size:8px; font-weight:800; }.path-um-decline { border:1px solid #f0d9da; background:#fff; color:#a26061; }.path-um-approve { background:#7c3aed; color:#fff; box-shadow:0 5px 12px rgba(124,58,237,.16); }
        .path-um-resolved-list { display:flex; flex-direction:column; }.path-um-resolved-row { display:grid; grid-template-columns:32px minmax(190px,1fr) 132px minmax(145px,.8fr); gap:14px; align-items:center; min-height:78px; padding:14px 22px; border-bottom:1px solid #f0edf4; background:#fff; }.path-um-resolved-row:last-child { border-bottom:0; }.path-um-resolved-row > span { margin-right:0 !important; }.path-um-resolution { display:flex; min-width:0; flex-direction:column; align-items:flex-start; gap:5px; }.path-um-resolution > span { padding:4px 7px; border-radius:99px; font-size:7px; font-weight:900; }.path-um-resolution > span.approved { background:#e6f5ed; color:#3b8c68; }.path-um-resolution > span.rejected { background:#fff0ef; color:#b45f59; }.path-um-resolution small { overflow:hidden; color:#a095a5; font-size:8px; text-overflow:ellipsis; white-space:nowrap; }
        .path-um-empty { display:flex; min-height:230px; align-items:center; flex-direction:column; justify-content:center; gap:7px; padding:28px; color:#a095a5; text-align:center; }.path-um-empty strong { color:#5d5067; font-family:'Manrope',sans-serif; font-size:12px; }.path-um-empty span { font-size:9px; }
        @media (max-width:1180px) { .path-um-tabs, .path-um-content { padding-left:30px; padding-right:30px; }.path-um-hero { align-items:flex-start; flex-direction:column; }.path-um-hero-actions { width:100%; justify-content:space-between; }.path-um-stat-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }.path-um-directory-layout { grid-template-columns:1fr; } }
        @media (max-width:900px) { .path-um-directory-head { align-items:flex-start; flex-direction:column; }.path-um-directory-controls { width:100%; }.path-um-directory-search { flex:1; width:auto; }.path-um-list-head { display:none; }.path-um-person-row { grid-template-columns:minmax(0,1fr) minmax(110px,.7fr) auto; }.path-um-access { grid-column:2; }.path-um-assignment { display:none; }.path-um-row-actions { grid-column:3; grid-row:1 / span 2; }.path-um-request-row { grid-template-columns:32px minmax(0,1fr) auto; gap:10px; }.path-um-request-role { grid-column:2; }.path-um-request-row > p { grid-column:2 / -1; }.path-um-request-actions { grid-column:3; grid-row:1 / span 2; align-self:center; } }
        @media (max-width:620px) { .path-um-tabs, .path-um-content { padding-left:15px; padding-right:15px; }.path-um-hero { min-height:0; padding:20px 17px 22px; }.path-um-hero h1 { font-size:36px; }.path-um-hero-actions { align-items:stretch; flex-direction:column; }.path-um-insight, .path-um-primary { width:100%; }.path-um-stat-grid { grid-template-columns:1fr; gap:10px; }.path-um-stat-card { min-height:105px; padding:16px; }.path-um-stat-card span { font-size:9px; }.path-um-stat-card strong { font-size:29px; }.path-um-stat-card small { font-size:9px; }.path-um-directory-head { padding:18px 16px 14px; }.path-um-directory-controls { align-items:stretch; flex-wrap:wrap; gap:7px; }.path-um-directory-search { flex-basis:100%; padding:5px 2px; }.path-um-directory-controls select { flex:1; min-width:0; padding-left:0; }.path-um-person-row { grid-template-columns:minmax(0,1fr) auto; padding:14px 16px; }.path-um-role, .path-um-access { grid-column:1; }.path-um-row-actions { grid-column:2; grid-row:1 / span 3; }.path-um-request-row { grid-template-columns:32px minmax(0,1fr); padding:15px 16px; }.path-um-request-role, .path-um-request-row > p { grid-column:2; }.path-um-request-actions { grid-column:1 / -1; grid-row:auto; justify-content:stretch; }.path-um-request-actions button { flex:1; justify-content:center; }.path-um-resolved-row { grid-template-columns:32px minmax(0,1fr); padding:14px 16px; }.path-um-resolved-row .path-um-request-role, .path-um-resolution { grid-column:2; } }
      `}</style>
      <style>{`
        .path-um-request-review{margin-top:24px;overflow:hidden;border:1px solid #e5deed;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(57,36,93,.045)}
        .path-um-request-review-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:20px 22px 17px;border-bottom:1px solid #f0edf4;background:linear-gradient(180deg,#fff,#fdfbff)}
        .path-um-request-review-head h2{margin:3px 0 0;color:#43364c;font:700 16px/1.2 Manrope,sans-serif;letter-spacing:-.04em}.path-um-request-review-head h2 span{display:inline-grid;min-width:18px;height:17px;margin-left:5px;place-items:center;border-radius:5px;background:#f0e9fc;color:#7543c7;font:700 8px/1 'DM Sans',sans-serif;vertical-align:middle}.path-um-request-review-head p{margin:7px 0 0;color:#9a91a2;font:400 9px/1.45 'DM Sans',sans-serif}.path-um-approve-all{height:32px;padding:0 11px;border-radius:7px;background:#7c3aed;color:#fff;font:800 8px/1 'DM Sans',sans-serif;box-shadow:0 5px 12px rgba(124,58,237,.16)}
        .path-um-request-review .path-um-request-row{display:grid;grid-template-columns:minmax(250px,1.25fr) 120px minmax(210px,1fr) auto;gap:18px;align-items:center;min-height:82px;padding:14px 22px;border-bottom:1px solid #f0edf4;background:#fff}.path-um-request-review .path-um-request-row:last-child{border-bottom:0}.path-um-request-review .path-um-request-person{display:flex;min-width:0;align-items:center;gap:11px}.path-um-request-review .path-um-request-person>span,.path-um-request-review .path-um-request-person>img{width:30px;height:30px;flex:0 0 30px;margin:0!important}.path-um-request-review .path-um-request-person>div{display:flex;min-width:0;flex-direction:column;gap:3px}.path-um-request-review .path-um-request-person strong{display:block;overflow:hidden;max-width:100%;color:#4e414f;font:700 9px/1.25 Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.path-um-request-review .path-um-request-person span,.path-um-request-review .path-um-request-person small{display:block;overflow:hidden;max-width:100%;color:#9c92a3;font:400 8px/1.2 'DM Sans',sans-serif;text-overflow:ellipsis;white-space:nowrap}.path-um-request-review .path-um-request-role{display:flex;min-width:0;flex-direction:column;align-items:flex-start;gap:5px}.path-um-request-review .path-um-request-role>span{color:#aaa0ae;font:800 7px/1 'DM Sans',sans-serif;letter-spacing:.08em;text-transform:uppercase}.path-um-request-review .path-um-request-role strong{color:#58495f;font:700 9px/1.2 Manrope,sans-serif}.path-um-request-review .path-um-request-row>p{margin:0;color:#887d8f;font:400 8px/1.45 'DM Sans',sans-serif}.path-um-request-review .path-um-request-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px}.path-um-request-review .path-um-request-actions button{display:inline-flex;height:30px;align-items:center;gap:5px;border-radius:7px;padding:0 10px;font:800 8px/1 'DM Sans',sans-serif}.path-um-request-review .path-um-decline{border:1px solid #e8e1ed;background:#fff;color:#9a6d71}.path-um-request-review .path-um-approve{background:#7c3aed;color:#fff;box-shadow:0 6px 13px rgba(124,58,237,.19)}
        @media(max-width:900px){.path-um-request-review .path-um-request-row{grid-template-columns:minmax(0,1fr) 120px auto;gap:12px}.path-um-request-review .path-um-request-row>p{grid-column:1 / -1}.path-um-request-review .path-um-request-actions{grid-column:3;grid-row:1 / span 2}}
        @media(max-width:620px){.path-um-request-review-head{align-items:stretch;flex-direction:column;padding:18px 16px}.path-um-approve-all{width:100%}.path-um-request-review .path-um-request-row{grid-template-columns:minmax(0,1fr);gap:10px;padding:15px 16px}.path-um-request-review .path-um-request-actions{grid-column:auto;grid-row:auto;justify-content:stretch}.path-um-request-review .path-um-request-actions button{flex:1;justify-content:center}.path-um-request-review .path-um-request-role{grid-column:auto}.path-um-request-review .path-um-request-row>p{grid-column:auto}}
      `}</style>

      <style>{`
        .path-um-avatar-fallback{background:#f0edff!important;color:#8876ad!important;border:1px solid #e6dff6!important}
        .path-um-request-review{margin-top:24px!important;border-radius:10px!important}.path-um-request-review-head{min-height:96px;padding:20px 20px 16px!important}.path-um-request-review-head h2{font-size:17px!important}.path-um-request-review-head p{max-width:690px;margin-top:8px!important;font-size:9px!important}.path-um-approve-all{height:30px!important;border-radius:6px!important}
        .path-um-request-review .path-um-request-row{grid-template-columns:minmax(360px,1.42fr) 116px minmax(310px,1.22fr) 118px!important;gap:18px!important;min-height:82px!important;padding:14px 18px!important}.path-um-request-review .path-um-request-person{gap:10px!important}.path-um-request-review .path-um-request-person>span,.path-um-request-review .path-um-request-person>img{width:32px!important;height:32px!important;flex-basis:32px!important}.path-um-request-review .path-um-request-person strong{font-size:9px!important}.path-um-request-review .path-um-request-person span,.path-um-request-review .path-um-request-person small{font-size:7.5px!important}.path-um-request-review .path-um-request-role{gap:6px!important}.path-um-request-review .path-um-request-role>span{font-size:7px!important}.path-um-request-review .path-um-request-role strong{font-size:9px!important}.path-um-request-review .path-um-request-row>p{font-size:8px!important;line-height:1.4!important}.path-um-request-review .path-um-request-actions{gap:7px!important}.path-um-request-review .path-um-request-actions button{height:29px!important;min-width:45px;padding:0 9px!important;border-radius:6px!important;font-size:8px!important}.path-um-request-review .path-um-decline{border-color:#e3dce8!important;color:#a0676e!important}
        @media(max-width:1020px){.path-um-request-review .path-um-request-row{grid-template-columns:minmax(250px,1fr) 112px minmax(170px,.8fr) 112px!important;gap:12px!important}}
        @media(max-width:760px){.path-um-request-review .path-um-request-row{grid-template-columns:minmax(0,1fr) 112px auto!important}.path-um-request-review .path-um-request-row>p{grid-column:1/-1}.path-um-request-review .path-um-request-actions{grid-column:3;grid-row:1/span 2}}
        @media(max-width:620px){.path-um-request-review .path-um-request-row{grid-template-columns:minmax(0,1fr)!important}.path-um-request-review .path-um-request-actions{grid-column:auto;grid-row:auto}.path-um-request-review .path-um-request-row>p{grid-column:auto}}
      `}</style>

      <style>{`
        .path-um-request-review .path-um-request-row{align-items:center!important}.path-um-request-review .path-um-request-person{flex-direction:row!important;align-items:center!important;justify-self:start}.path-um-request-review .path-um-request-person>div{justify-content:center}.path-um-request-review .path-um-request-role,.path-um-request-review .path-um-request-row>p,.path-um-request-review .path-um-request-actions{align-self:center}.path-um-request-review .path-um-request-actions{justify-self:end}.path-um-request-review .path-um-avatar-fallback{display:inline-flex!important;align-items:center!important;justify-content:center!important}
      `}</style>

      <Sidebar activePage="users" />

      {/* ── MAIN ── */}
      <main className="path-um-main flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <SearchIcon />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, email, role…"
                className="bg-transparent outline-none text-xs text-gray-700 w-full placeholder:text-gray-400"
              />
            </div>
          </div>
        </TopBar>

        {/* Tab Nav */}
        <div className="bg-white border-b border-[#e6e0ee]">
          <div className="path-um-tabs flex items-center gap-3">
            <button
              onClick={() => setTab("users")}
              className={`flex items-center gap-1.5 py-3 px-3 my-2 text-[10px] font-bold rounded-md transition-colors ${tab === "users" ? "text-[#6b38d4] bg-[#f1ebff]" : "text-[#7b7486] hover:text-[#181445] hover:bg-[#faf8fd]"}`}
            >
              System Users
            </button>
            <button
              onClick={() => setTab("permissions")}
              className={`flex items-center gap-1.5 py-3 px-3 my-2 text-[10px] font-bold rounded-md transition-colors ${tab === "permissions" ? "text-[#6b38d4] bg-[#f1ebff]" : "text-[#7b7486] hover:text-[#181445] hover:bg-[#faf8fd]"}`}
            >
              Account Requests
              {pending.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === "permissions" ? "bg-[#e9ddff] text-[#5a00c6]" : "bg-amber-100 text-amber-700"}`}
                >
                  {pending.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="path-um-content py-6 md:py-8 flex flex-col gap-6 flex-1 overflow-y-auto">
          {toast.msg && (
            <Toast
              msg={toast.msg}
              type={toast.type}
              onClose={() => setToast({ msg: "", type: "" })}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-sm text-gray-400">
              <Spinner /> Loading…
            </div>
          ) : (
            <>
              {/* ══ USERS TAB ══════════════════════════════════════════════════════ */}
              {tab === "users" && (
                <div>
                  <section className="path-um-hero">
                    <div>
                      <div className="path-um-kicker">
                        Department directory · access control
                      </div>
                      <h1>People &amp; management</h1>
                      <p>
                        Keep every system user visible, assigned, and working
                        with the right level of access.
                      </p>
                    </div>
                    <div className="path-um-hero-actions">
                      <div className="path-um-insight">
                        <span className="path-um-insight-icon">
                          <ShieldIcon />
                        </span>
                        <span>
                          <strong>Access health</strong>
                          <small>
                            {stats.active ?? 0} active members ·{" "}
                            {pending.length} pending
                          </small>
                        </span>
                      </div>
                      <button
                        onClick={() => setShowModal(true)}
                        className="path-um-primary"
                      >
                        <UserPlusIcon /> Invite user
                      </button>
                    </div>
                  </section>
                  <div className="path-um-stat-grid">
                    <article className="path-um-stat-card">
                      <span>Directory members</span>
                      <strong>
                        {String(stats.total ?? users.length).padStart(2, "0")}
                      </strong>
                      <small>Across your workspace</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Active today</span>
                      <strong>
                        {String(stats.active ?? 0).padStart(2, "0")}
                      </strong>
                      <small>Currently enabled</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Reviewers</span>
                      <strong>
                        {String(stats.admins ?? 0).padStart(2, "0")}
                      </strong>
                      <small>Chair and admin roles</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Account requests</span>
                      <strong>{String(pending.length).padStart(2, "0")}</strong>
                      <small>Awaiting review</small>
                    </article>
                  </div>

                  <div className="path-um-directory-layout mt-6">
                    <section className="path-um-panel bg-white border border-[#cbc3d7] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                      <PathDirectoryList
                        users={filteredUsers}
                        total={users.length}
                        search={search}
                        setSearch={setSearch}
                        roleFilter={roleFilter}
                        setRoleFilter={setRoleFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        canEdit={canEdit}
                        currentUserId={currentUserId}
                        onView={setSelectedUser}
                        onEdit={setEditUser}
                        onDelete={setDeleteTarget}
                      />
                    </section>
                    <PathAccessManagement
                      users={users}
                      onManageRoles={() =>
                        notify(
                          "Role permission settings are ready to configure.",
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* ══ PERMISSIONS TAB ════════════════════════════════════════════════ */}
              {tab === "permissions" && (
                <div>
                  <section className="path-um-hero">
                    <div>
                      <div className="path-um-kicker">
                        Workspace access · review queue
                      </div>
                      <h1>Account requests</h1>
                      <p>
                        Review each request before a person becomes a system
                        user in this department.
                      </p>
                    </div>
                    <div className="path-um-hero-actions">
                      <div className="path-um-insight">
                        <span className="path-um-insight-icon">
                          <ShieldIcon />
                        </span>
                        <span>
                          <strong>Review queue</strong>
                          <small>
                            {pending.length} request
                            {pending.length === 1 ? "" : "s"} awaiting a
                            decision
                          </small>
                        </span>
                      </div>
                      <button
                        onClick={() => setTab("users")}
                        className="path-um-primary"
                      >
                        <UsersIcon /> View system users
                      </button>
                    </div>
                  </section>
                  <div className="path-um-stat-grid">
                    <article className="path-um-stat-card">
                      <span>Pending requests</span>
                      <strong>{String(pending.length).padStart(2, "0")}</strong>
                      <small>Awaiting review</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Approved this month</span>
                      <strong>
                        {String(stats.approved_this_month ?? 0).padStart(
                          2,
                          "0",
                        )}
                      </strong>
                      <small>Accounts activated</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Rejected this month</span>
                      <strong>
                        {String(stats.rejected_this_month ?? 0).padStart(
                          2,
                          "0",
                        )}
                      </strong>
                      <small>Requests denied</small>
                    </article>
                    <article className="path-um-stat-card">
                      <span>Active users</span>
                      <strong>
                        {String(stats.active ?? 0).padStart(2, "0")}
                      </strong>
                      <small>Current system access</small>
                    </article>
                  </div>

                  <PathRequestList
                    pending={pending}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onApproveAll={handleApproveAll}
                    fmtDate={fmtDate}
                  />

                  {/* Recently Resolved — always show, even if empty */}
                  <div className="path-um-panel bg-white border border-[#cbc3d7] rounded-2xl shadow-sm overflow-hidden mt-6">
                    <div className="px-6 py-4 border-b border-[#cbc3d7] bg-[#fcf8ff]">
                      <h2 className="text-sm font-bold text-[#181445]">
                        Recently Resolved
                      </h2>
                      <p className="text-xs text-[#7b7486] mt-0.5">
                        Accounts approved or rejected in the last 30 days
                      </p>
                    </div>
                    <PathResolvedRequestList
                      resolved={resolved}
                      fmtDate={fmtDate}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="flex justify-between items-center px-5 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 bg-white">
          <span>
            © 2024 PATH Document Management System. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />
              System Operational
            </span>
            <a href="#" className="hover:text-gray-600">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gray-600">
              Terms of Service
            </a>
          </div>
        </footer>
      </main>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={(newUser) => {
            setUsers((u) => [...u, newUser]);
            setStats((s) => ({ ...s, total: (s.total ?? 0) + 1 }));
            notify(
              `${newUser.first_name} ${newUser.last_name} has been created.`,
            );
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          currentUserRole={currentUserRole}
          onClose={() => setEditUser(null)}
          onUpdated={handleUpdate}
        />
      )}

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={(id, name) => setDeleteTarget({ id, name })}
          currentUserId={currentUserId}
          fmtDate={fmtDate}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={(mode) =>
            handleDelete(deleteTarget.id, deleteTarget.name, mode)
          }
        />
      )}
    </div>
  );
}
