import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

// ─── API CONFIG ────────────────────────────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

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
  } catch { /* never crash UI for audit failures */ }
}

// ─── AVATAR HELPERS ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ["#ede9fe", "#5b21b6"], ["#dbeafe", "#1d4ed8"], ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#e0f2fe", "#0369a1"],
];
function avatarColor(name = "") {
  const i = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(firstName = "", lastName = "") {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "?";
}

// ─── SMALL COMPONENTS ─────────────────────────────────────────────────────────
function Avatar({ firstName, lastName }) {
  const [bg, text] = avatarColor(`${firstName}${lastName}`);
  return (
    <span
      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mr-2"
      style={{ background: bg, color: text }}
    >
      {initials(firstName, lastName)}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    admin:         "bg-violet-100 text-violet-700",
    program_chair: "bg-blue-100 text-blue-700",
    user:          "bg-blue-100 text-blue-700",
    guest:         "bg-gray-100 text-gray-600",
  };
  const labels = {
    admin:         "Admin",
    program_chair: "Program Chair",
    user:          "Faculty",
    guest:         "Guest",
  };
  const label = labels[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "Unknown");
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${map[role] || map.guest}`}>
      {label}
    </span>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Active</span>
  ) : (
    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Inactive</span>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!msg) return null;
  const cls = type === "error"
    ? "bg-red-50 text-red-700 border border-red-200"
    : "bg-emerald-50 text-emerald-700 border border-emerald-200";
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-xs font-medium ${cls}`}>
      <span>{msg}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 text-sm leading-none">✕</button>
    </div>
  );
}

// ─── ADD USER MODAL ────────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ first_name: "", last_name: "", username: "", email: "", role: "", password: "", is_active: "1" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({ ...form, is_active: form.is_active === "1" }),
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
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-[500px] bg-white rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-start mb-5">
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 shrink-0">
              <UserPlusIcon />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Add New System User</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create a real account and assign a role.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 rounded-md px-2 py-1 text-base">✕</button>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="First Name *"><input required value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="e.g. Maria" /></Field>
            <Field label="Last Name"><input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="e.g. Garcia" /></Field>
          </div>
          <Field label="Username *" className="mb-3"><input required value={form.username} onChange={e => set("username", e.target.value)} placeholder="e.g. mgarcia" /></Field>
          <Field label="Work Email" className="mb-3"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@company.com" /></Field>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Role *">
              <select required value={form.role} onChange={e => set("role", e.target.value)}>
                <option value="">Select role…</option>
                <option value="admin">Admin</option>
                <option value="program_chair">Program Chair</option>
                <option value="user">Faculty</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.is_active} onChange={e => set("is_active", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </Field>
          </div>
          <Field label="Password *" className="mb-4"><input required type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Minimum 8 characters" /></Field>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
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
    first_name: user.first_name || "",
    last_name:  user.last_name  || "",
    email:      user.email      || "",
    phone:      user.phone      || "",
    department: "Information Systems",
    role:       user.role       || "",
    is_active:  user.is_active  ? "1" : "0",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // program_chair has the same access as admin
  const canChangeRole   = currentUserRole === "admin" || currentUserRole === "program_chair";
  const canChangeStatus = currentUserRole === "admin" || currentUserRole === "program_chair";

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = {
        first_name:  form.first_name,
        last_name:   form.last_name,
        email:       form.email,
        phone:       form.phone,
        department:  form.department,
        ...(canChangeRole   ? { role: form.role }                       : {}),
        ...(canChangeStatus ? { is_active: form.is_active === "1" }     : {}),
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
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: bg, color: "#5b21b6" }}>
              {initials(user.first_name, user.last_name)}
            </span>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Edit User</h2>
              <p className="text-xs text-gray-400">@{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:bg-gray-100 rounded-md px-2 py-1 text-base leading-none">✕</button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-100">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name *">
              <input required value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name">
              <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Last name" />
            </Field>
          </div>

          {/* Email */}
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@example.com" />
          </Field>

          {/* Phone + Department */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+63 9XX XXX XXXX" />
            </Field>
            <Field label="Department">
              <input value="Information Systems" readOnly className="opacity-60 cursor-not-allowed" />
            </Field>
          </div>

          {/* Role + Status — admin only */}
          <div className="grid grid-cols-2 gap-3">
            <Field label={canChangeRole ? "Role *" : "Role (read-only)"}>
              <select value={form.role} onChange={e => set("role", e.target.value)} disabled={!canChangeRole}
                className={!canChangeRole ? "opacity-50 cursor-not-allowed" : ""}>
                <option value="">Select role…</option>
                <option value="admin">Admin</option>
                <option value="program_chair">Program Chair</option>
                <option value="user">Faculty</option>
              </select>
            </Field>
            <Field label={canChangeStatus ? "Status" : "Status (read-only)"}>
              <select value={form.is_active} onChange={e => set("is_active", e.target.value)} disabled={!canChangeStatus}
                className={!canChangeStatus ? "opacity-50 cursor-not-allowed" : ""}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5">
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
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children && React.cloneElement(children, {
        className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-violet-500 transition-colors",
      })}
    </div>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const EditIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M11 2l3 3-8 8H3v-3L11 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const UserPlusIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="15" height="15"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5M11 8v6M14 11h-6" /></svg>;
const CheckIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12"><path d="M13 5l-7 7-3-3" strokeLinecap="round" /></svg>;
const TrashIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4" strokeLinecap="round" /></svg>;
const ApproveIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M13 4l-7 8-3-3" strokeLinecap="round" /></svg>;
const RejectIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" /></svg>;
const ShieldIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>;
const UsersIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>;
const FilterIcon = () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z" /></svg>;
const SearchIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5L14 14" strokeLinecap="round" /></svg>;
const Spinner = () => <svg className="animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><circle cx="8" cy="8" r="6" strokeOpacity=".25" /><path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" /></svg>;
const EyeIcon = () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round"/><circle cx="8" cy="8" r="2"/></svg>;

// ─── SIDEBAR ICONS ─────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>,
  Inbox: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" /></svg>,
  Plus: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M8 1v14M1 8h14" /></svg>,
  Tasks: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" /></svg>,
  Forms: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" /></svg>,
  Workflow: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Reports: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" /></svg>,
  Users: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3" /><path d="M1 14c0-3 2-5 5-5s5 2 5 5" /><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" /></svg>,
  Shield: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" /></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" /></svg>,
  Tracking: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" width="14" height="14"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/><path d="M8 6V4M8 10v2M6 8H4M10 8h2" strokeLinecap="round"/></svg>,
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
};

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
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-[480px] bg-white rounded-xl p-6 shadow-2xl">
        <div className="flex gap-3 items-start mb-4">
          <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
            <TrashIcon />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Permanently Delete {user.name}?</h2>
            <p className="text-xs text-gray-400 mt-0.5">This cannot be undone. Choose how to handle content this user was involved in.</p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg mb-4 border border-red-100">{error}</div>}

        <div className="space-y-2.5 mb-5">
          <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "preserve" ? "border-violet-300 bg-violet-50/60" : "border-gray-200 hover:bg-gray-50"}`}>
            <input type="radio" name="delete-mode" checked={mode === "preserve"} onChange={() => setMode("preserve")} className="mt-0.5" />
            <div>
              <div className="text-xs font-bold text-gray-800">Preserve others' content <span className="text-violet-500 font-semibold">(recommended)</span></div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Comments, submissions, and tasks this user owns are deleted. If they only reviewed, assigned,
                or received something belonging to someone else, that record stays — just shown as "Unknown user."
              </p>
            </div>
          </label>

          <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mode === "cascade" ? "border-red-300 bg-red-50/60" : "border-gray-200 hover:bg-gray-50"}`}>
            <input type="radio" name="delete-mode" checked={mode === "cascade"} onChange={() => setMode("cascade")} className="mt-0.5" />
            <div>
              <div className="text-xs font-bold text-gray-800">Delete everything, including others' content</div>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Also deletes form submissions this user reviewed, tasks they assigned, and messages they received —
                even though that content may belong to other users.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading} className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
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
      <div className="fixed top-0 right-0 h-full w-[320px] bg-white z-40 flex flex-col shadow-2xl" style={{ borderLeft: "1px solid #f0f0f0" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <span className="text-sm font-bold text-gray-800">User Details</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">✕</button>
        </div>
        {/* Avatar hero */}
        <div className="flex flex-col items-center px-5 py-7 shrink-0" style={{ background: `linear-gradient(160deg, ${bg}88 0%, #fff 65%)` }}>
          <span className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: bg, color: fg }}>
            {initials(user.first_name, user.last_name)}
          </span>
          <h2 className="mt-3 text-base font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
          <div className="flex gap-2 mt-3">
            <RoleBadge role={user.role} />
            <StatusBadge active={user.is_active} />
          </div>
        </div>
        {/* Info rows */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {[
            { label: "Full Name",    value: `${user.first_name} ${user.last_name}` },
            { label: "Email",        value: user.email || "—" },
            { label: "Username",     value: `@${user.username}` },
            { label: "Phone",        value: user.phone || "—" },
            { label: "Department",   value: user.department || "—" },
            { label: "Role",         value: user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "—" },
            { label: "Status",       value: user.is_active ? "Active" : "Inactive" },
            { label: "Member Since", value: fmtDate(user.created_at) },
            { label: "Last Updated", value: fmtDate(user.updated_at) },
            { label: "User ID",      value: `#${user.id}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide shrink-0 mt-0.5">{label}</span>
              <span className="text-xs text-gray-800 font-medium text-right break-all">{value}</span>
            </div>
          ))}
        </div>
        {/* Footer action */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          {user.id !== currentUserId ? (
            <button
              onClick={() => { onDelete(user.id, `${user.first_name} ${user.last_name}`); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <TrashIcon /> Remove This User
            </button>
          ) : (
            <p className="text-center text-xs text-gray-400">This is your own account.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ─── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, iconBg, icon }) {
  return (
    <div className="bg-violet-50/60 rounded-xl px-4 py-3.5 relative overflow-hidden">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value ?? "—"}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
      <div className={`absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center ${iconBg}`}>{icon}</div>
    </div>
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
  const currentUserId = (() => { try { return JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || ""))?.id; } catch { return null; } })();
  const currentUserRole = (() => { try { return JSON.parse(atob(localStorage.getItem("token")?.split(".")[1] || ""))?.role; } catch { return null; } })();
  const canEdit = currentUserRole === "admin" || currentUserRole === "program_chair";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(currentUserRole);

  const notify = (msg, type = "success") => setToast({ msg, type });

  // ── Fetch all data ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, pendingData, resolvedData, statsData] = await Promise.all([
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

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Poll every 30 seconds for new pending registrations ──────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [pendingData, statsData] = await Promise.all([
          apiFetch("/users/pending"),
          apiFetch("/users/stats"),
        ]);
        setPending(pendingData);
        setStats(s => ({ ...s, ...statsData }));
        if (pendingData.length > 0) setTab("permissions");
      } catch { /* silently ignore */ }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── User actions ────────────────────────────────────────────────────────────
  // Called from DeleteUserModal after the user picks a mode and confirms.
  // Intentionally does NOT catch errors — the modal awaits this and shows
  // its own inline error message on failure, so it stays open to retry.
  async function handleDelete(userId, name, mode) {
    await apiFetch(`/users/${userId}`, { method: "DELETE", body: JSON.stringify({ mode }) });
    await logAction("USER_DELETE", `Admin permanently deleted user account: ${name} (ID: ${userId}, mode: ${mode})`);
    setUsers(u => u.filter(x => x.id !== userId));
    setStats(s => ({ ...s, total: (s.total ?? 1) - 1 }));
    if (selectedUser?.id === userId) setSelectedUser(null);
    notify(`${name} has been permanently deleted.`);
  }

  async function handleApprove(userId) {
    try {
      await apiFetch(`/users/${userId}/approve`, { method: "PATCH" });
      const approved = pending.find(u => u.id === userId);
      await logAction("USER_APPROVE", `Admin approved account: ${approved?.first_name} ${approved?.last_name} (@${approved?.username}, ID: ${userId})`);
      setPending(p => p.filter(u => u.id !== userId));
      if (approved) {
        setUsers(u => [...u, { ...approved, is_active: true }]);
        setResolved(r => [{ ...approved, decision: "approved", resolved_on: new Date().toISOString(), resolved_by: "You" }, ...r]);
      }
      setStats(s => ({ ...s, approved_this_month: (s.approved_this_month ?? 0) + 1 }));
      notify("Account approved and user notified via email.");
    } catch (err) { notify(err.message, "error"); }
  }

  async function handleReject(userId, name) {
    if (!window.confirm(`Reject ${name}'s account request?`)) return;
    try {
      await apiFetch(`/users/${userId}/reject`, { method: "PATCH" });
      const rejected = pending.find(u => u.id === userId);
      await logAction("USER_REJECT", `Admin rejected account request: ${name} (@${rejected?.username}, ID: ${userId})`);
      setPending(p => p.filter(u => u.id !== userId));
      if (rejected) {
        setResolved(r => [{ ...rejected, decision: "rejected", resolved_on: new Date().toISOString(), resolved_by: "You" }, ...r]);
      }
      setStats(s => ({ ...s, rejected_this_month: (s.rejected_this_month ?? 0) + 1 }));
      notify(`${name}'s request has been rejected.`);
    } catch (err) { notify(err.message, "error"); }
  }

  async function handleApproveAll() {
    if (!window.confirm("Approve all pending accounts?")) return;
    try {
      await Promise.all(pending.map(u => apiFetch(`/users/${u.id}/approve`, { method: "PATCH" })));
      await logAction("USER_APPROVE_ALL", `Admin bulk-approved ${pending.length} pending account(s): ${pending.map(u => u.username).join(", ")}`);
      const now = new Date().toISOString();
      setUsers(u => [...u, ...pending.map(p => ({ ...p, is_active: true }))]);
      setResolved(r => [...pending.map(p => ({ ...p, decision: "approved", resolved_on: now, resolved_by: "You" })), ...r]);
      setStats(s => ({ ...s, approved_this_month: (s.approved_this_month ?? 0) + pending.length }));
      setPending([]);
      notify("All pending accounts have been approved.");
    } catch (err) { notify(err.message, "error"); }
  }

  function handleUpdate(updated) {
    setUsers(u => u.map(x => x.id === updated.id ? { ...x, ...updated } : x));
    if (selectedUser?.id === updated.id) setSelectedUser(s => ({ ...s, ...updated }));
    logAction("USER_EDIT", `Admin updated user: ${updated.first_name} ${updated.last_name} (@${updated.username}, ID: ${updated.id})`);
    notify(`${updated.first_name} ${updated.last_name} has been updated.`);
  }

  // ── Filtered users ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${u.first_name} ${u.last_name} ${u.email} ${u.username}`.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "Active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const fmtDate = iso => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const SbItem = ({ icon, label, active, onClick }) => (
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

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 200, background: "#1e1b2e", color: "#c8c4e0", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.innerHTML = '<span style="color:white;font-size:12px;font-weight:bold">P</span>'; }} />
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
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={true} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>

        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7" /><path d="M8 7v4M8 5v1" /></svg>} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" /></svg>} label="Logout" onClick={handleLogout} />
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
                placeholder="Search user, email, role…"
                className="bg-transparent outline-none text-xs text-gray-700 w-full placeholder:text-gray-400"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap">
              <UserPlusIcon /> New User
            </button>
          </div>
        </TopBar>

        {/* Tab Nav */}
        <div className="flex border-b border-gray-100 bg-white">
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === "users" ? "text-violet-600 border-violet-600" : "text-gray-400 border-transparent hover:text-gray-700"}`}
          >
            <UsersIcon /> System Users
          </button>
          <button
            onClick={() => setTab("permissions")}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${tab === "permissions" ? "text-violet-600 border-violet-600" : "text-gray-400 border-transparent hover:text-gray-700"}`}
          >
            <ShieldIcon /> Permissions &amp; Approvals
            {pending.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === "permissions" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}>
                {pending.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 flex-1 overflow-y-auto">

          {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "" })} />}

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-sm text-gray-400">
              <Spinner /> Loading…
            </div>
          ) : (
            <>
              {/* ══ USERS TAB ══════════════════════════════════════════════════════ */}
              {tab === "users" && (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">User &amp; Role Management</h1>
                      <p className="text-xs text-gray-400 mt-0.5">Manage system accounts, assign roles, and control access levels.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="11" height="11"><path d="M8 1v14M1 8h14" /></svg>
                        Add User
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <StatCard label="Total Users" value={stats.total} sub="All accounts" iconBg="bg-violet-100" icon={<UsersIcon />} />
                    <StatCard label="Active" value={stats.active} sub="Currently enabled" iconBg="bg-emerald-100" icon={<CheckIcon />} />
                    <StatCard label="Inactive" value={stats.inactive} sub="Suspended accounts" iconBg="bg-red-100" icon={<svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 10v1" strokeLinecap="round" /></svg>} />
                    <StatCard label="Admins" value={stats.admins} sub="Full access roles" iconBg="bg-violet-100" icon={<ShieldIcon />} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <FilterIcon />
                    <span className="text-xs font-bold text-gray-600">Filters</span>
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-500">
                      <span>Role</span>
                      <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="bg-transparent text-xs text-gray-700 outline-none cursor-pointer">
                        <option value="all">All</option>
                        <option value="admin">Admin</option>
                        <option value="program_chair">Program Chair</option>
                        <option value="user">Faculty</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-500">
                      <span>Status</span>
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-transparent text-xs text-gray-700 outline-none cursor-pointer">
                        <option value="all">All</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">System Users</h2>
                        <p className="text-xs text-gray-400 mt-0.5">All registered accounts and their access levels</p>
                      </div>
                      <button onClick={() => setShowModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700">
                        + Add User
                      </button>
                    </div>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {["Name", "Email / Username", "Role", "Status", "Joined", "Actions"].map((h, i) => (
                            <th key={h} className={`text-[10px] text-gray-400 uppercase tracking-wide font-semibold px-4 py-2.5 text-left border-b border-gray-100 ${i === 5 ? "text-right" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found.</td></tr>
                        ) : filteredUsers.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/70 border-b border-gray-50 last:border-0 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center">
                                <Avatar firstName={u.first_name} lastName={u.last_name} />
                                <span className="text-gray-800 font-medium">{u.first_name} {u.last_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="text-gray-700">{u.email || "—"}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">@{u.username}</div>
                            </td>
                            <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                            <td className="px-4 py-2.5"><StatusBadge active={u.is_active} /></td>
                            <td className="px-4 py-2.5 text-gray-400">{fmtDate(u.date_joined || u.created_at)}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600 transition-colors"
                                  title="View details"
                                >
                                  <EyeIcon />
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={() => setEditUser(u)}
                                    className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                                    title="Edit user"
                                  >
                                    <EditIcon />
                                  </button>
                                )}
                                {u.id !== currentUserId ? (
                                  <button
                                    onClick={() => setDeleteTarget({ id: u.id, name: `${u.first_name} ${u.last_name}` })}
                                    className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                                    title="Remove user"
                                  >
                                    <TrashIcon />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-gray-400 leading-6">(you)</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-50">
                      Showing {filteredUsers.length} of {users.length} user{users.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </>
              )}

              {/* ══ PERMISSIONS TAB ════════════════════════════════════════════════ */}
              {tab === "permissions" && (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Permissions &amp; Approvals</h1>
                      <p className="text-xs text-gray-400 mt-0.5">Review and approve pending account registration requests.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      label="Pending Approval" value={pending.length} sub="Awaiting admin review"
                      iconBg="bg-amber-100"
                      icon={<svg viewBox="0 0 16 16" fill="#d97706" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5M8 10.5v1" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                    />
                    <StatCard label="Approved This Month" value={stats.approved_this_month ?? 0} sub="Accounts activated" iconBg="bg-emerald-100" icon={<CheckIcon />} />
                    <StatCard label="Rejected This Month" value={stats.rejected_this_month ?? 0} sub="Requests denied" iconBg="bg-red-100" icon={<RejectIcon />} />
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Pending Account Requests</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Users who registered and are awaiting approval</p>
                      </div>
                      {pending.length > 0 && (
                        <button onClick={handleApproveAll} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700">
                          <CheckIcon /> Approve All
                        </button>
                      )}
                    </div>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {["Applicant", "Email / Username", "Requested Role", "Requested On", "Status", "Actions"].map((h, i) => (
                            <th key={h} className={`text-[10px] text-gray-400 uppercase tracking-wide font-semibold px-4 py-2.5 text-left border-b border-gray-100 ${i === 5 ? "text-right" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pending.length === 0 ? (
                          <tr>
                            <td colSpan={6}>
                              <div className="text-center py-10">
                                <svg viewBox="0 0 40 40" fill="none" stroke="#d1d5db" strokeWidth="1.5" width="40" height="40" className="mx-auto mb-2">
                                  <circle cx="20" cy="20" r="17" />
                                  <path d="M13 20l5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <p className="text-gray-400 text-xs">All clear — no pending account requests.</p>
                              </div>
                            </td>
                          </tr>
                        ) : pending.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50/70 border-b border-gray-50 last:border-0 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center">
                                <Avatar firstName={u.first_name} lastName={u.last_name} />
                                <span className="text-gray-800 font-medium">{u.first_name} {u.last_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="text-gray-700">{u.email || "—"}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">@{u.username}</div>
                            </td>
                            <td className="px-4 py-2.5"><RoleBadge role={u.role} /></td>
                            <td className="px-4 py-2.5 text-gray-400">{fmtDate(u.date_joined || u.created_at)}</td>
                            <td className="px-4 py-2.5">
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Pending</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleApprove(u.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                  <ApproveIcon /> Approve
                                </button>
                                <button
                                  onClick={() => handleReject(u.id, `${u.first_name} ${u.last_name}`)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                >
                                  <RejectIcon /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="px-4 py-2.5 text-xs text-gray-400 border-t border-gray-50">
                      Showing {pending.length} pending request{pending.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* Recently Resolved — always show, even if empty */}
                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3.5 border-b border-gray-100">
                      <h2 className="text-sm font-bold text-gray-900">Recently Resolved</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Accounts approved or rejected in the last 30 days</p>
                    </div>
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          {["User", "Email / Username", "Role", "Resolved On", "Decision", "Resolved By"].map(h => (
                            <th key={h} className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold px-4 py-2.5 text-left border-b border-gray-100">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resolved.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-400 text-xs">No resolved requests yet.</td>
                          </tr>
                        ) : resolved.map((r, i) => (
                          <tr key={i} className="hover:bg-gray-50/70 border-b border-gray-50 last:border-0 transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center">
                                <Avatar firstName={r.first_name} lastName={r.last_name} />
                                <span className="text-gray-800 font-medium">{r.first_name} {r.last_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="text-gray-700">{r.email || "—"}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">@{r.username}</div>
                            </td>
                            <td className="px-4 py-2.5"><RoleBadge role={r.role} /></td>
                            <td className="px-4 py-2.5 text-gray-400">{fmtDate(r.resolved_on)}</td>
                            <td className="px-4 py-2.5">
                              {r.decision === "approved"
                                ? <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Approved</span>
                                : <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Rejected</span>
                              }
                            </td>
                            <td className="px-4 py-2.5 text-gray-400">{r.resolved_by || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <footer className="flex justify-between items-center px-5 py-2.5 border-t border-gray-100 text-[10px] text-gray-400 bg-white">
          <span>© 2024 PATH Document Management System. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />System Operational</span>
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
          </div>
        </footer>
      </main>

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onCreated={newUser => {
            setUsers(u => [...u, newUser]);
            setStats(s => ({ ...s, total: (s.total ?? 0) + 1 }));
            notify(`${newUser.first_name} ${newUser.last_name} has been created.`);
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
          onConfirm={(mode) => handleDelete(deleteTarget.id, deleteTarget.name, mode)}
        />
      )}
    </div>
  );
}
