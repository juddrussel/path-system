import { useState, useEffect, useRef } from "react";

const API_BASE  = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL  || "http://localhost:5000";

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
    <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 15.5a2 2 0 004 0" strokeLinecap="round" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
    <rect x="2" y="5" width="16" height="12" rx="2" />
    <circle cx="10" cy="11" r="3" />
    <path d="M7 5l1-2h4l1 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <path d="M11 2l3 3-8 8H3v-3L11 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon2 = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M13 4l-7 8-3-3" strokeLinecap="round" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <circle cx="8" cy="8" r="6" strokeOpacity=".25" />
    <path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" />
  </svg>
);

const ROLE_LABELS = {
  admin:         "Admin",
  program_chair: "Program Chair",
  user:          "Faculty",
  guest:         "Guest",
};
function formatRole(role) {
  return ROLE_LABELS[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User");
}
const AVATAR_COLORS = [
  ["#ede9fe", "#5b21b6"], ["#dbeafe", "#1d4ed8"], ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#e0f2fe", "#0369a1"],
];
function avatarBg(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function initials(first = "", last = "") {
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase() || "?";
}

// ─── PROFILE MODAL ───────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onSaved }) {
  const [editing, setEditing]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess]     = useState(false);
  const [error, setError]                   = useState("");
  const [photoError, setPhotoError]         = useState("");

  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name:  profile?.last_name  || "",
    email:      profile?.email      || "",
    phone:      profile?.phone      || "",
    department: profile?.department || "",
  });

  const [currentAvatar, setCurrentAvatar]   = useState(profile?.avatar_url || null);
  const [pendingPreview, setPendingPreview] = useState(null);
  const [pendingFile, setPendingFile]       = useState(null);
  const fileInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Photo selection ────────────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setPhotoError("Image must be under 5 MB."); return; }
    setPhotoError("");
    setPhotoSuccess(false);
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPendingPreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Upload photo ───────────────────────────────────────────────────────────
  const handleUploadPhoto = async () => {
    if (!pendingFile) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const token  = localStorage.getItem("token");
      const userId = profile?.id;
      const fd = new FormData();
      fd.append("avatar", pendingFile);

      const uploadRes = await fetch(`${API_BASE}/users/${userId}/avatar`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });

      let avatar_url = pendingPreview;
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        avatar_url = fullAvatarUrl(data.avatar_url) || pendingPreview;
      }

      setCurrentAvatar(avatar_url);
      setPendingPreview(null);
      setPendingFile(null);
      setPhotoSuccess(true);
      onSaved({ ...profile, avatar_url: fullAvatarUrl(avatar_url) });
      setTimeout(() => setPhotoSuccess(false), 3000);
    } catch {
      setPhotoError("Upload failed. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    setPendingPreview(null);
    setPendingFile(null);
    setPhotoError("");
  };

  // ── Save profile details ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token  = localStorage.getItem("token");
      const userId = profile?.id;

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, avatar_url: currentAvatar }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Update failed" }));
        throw new Error(err.message);
      }
      const updated = await res.json();
      onSaved({ ...updated, avatar_url: currentAvatar });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const [bg, fg] = avatarBg(`${profile?.first_name || ""}${profile?.last_name || ""}`);
  const displayAvatar = pendingPreview || currentAvatar;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
      onClick={e => e.target === e.currentTarget && !pendingPreview && onClose()}
    >
      <div className="w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Hero / Avatar ── */}
        <div
          className="relative flex flex-col items-center pt-8 pb-5 px-6"
          style={{ background: `linear-gradient(160deg, ${bg}cc 0%, #f9f9ff 70%)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/60 transition-colors"
          >
            <XIcon />
          </button>

          <div className="relative mb-3 group">
            {displayAvatar ? (
              <img
                src={fullAvatarUrl(displayAvatar)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover shadow-lg border-[3px] border-white"
                style={{ outline: pendingPreview ? "3px solid #7c3aed" : "none", outlineOffset: 2 }}
              />
            ) : (
              <span
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-[3px] border-white"
                style={{ background: bg, color: fg }}
              >
                {initials(profile?.first_name, profile?.last_name)}
              </span>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <CameraIcon />
              <span className="text-white text-[10px] font-bold">Change</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors border-2 border-white"
            >
              <CameraIcon />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <h2 className="text-base font-bold text-gray-900">
            {profile?.first_name} {profile?.last_name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">@{profile?.username}</p>
          <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 capitalize">
            {formatRole(profile?.role)}
          </span>

          {pendingPreview && (
            <div className="mt-3 w-full bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2 shadow border border-violet-200">
              <span className="text-[11px] text-violet-700 font-bold flex-1">New photo selected — upload it?</span>
              <button onClick={handleCancelPhoto} className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
              >
                {uploadingPhoto ? <><Spinner /> Uploading…</> : <><CheckIcon2 /> Upload</>}
              </button>
            </div>
          )}

          {photoError && <p className="mt-2 text-[11px] text-red-600 font-medium">{photoError}</p>}
          {photoSuccess && !pendingPreview && (
            <p className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckIcon2 /> Photo updated successfully!
            </p>
          )}
          <p className="mt-2 text-[10px] text-gray-400">
            Click the camera icon to upload or replace your photo · JPG, PNG, GIF, WebP · max 5 MB
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>
          )}

          {editing ? (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <PField label="First Name">
                  <input value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="First name" />
                </PField>
                <PField label="Last Name">
                  <input value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Last name" />
                </PField>
              </div>
              <PField label="Email">
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@company.com" />
              </PField>
              <PField label="Phone">
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+63 912 345 6789" />
              </PField>
              <PField label="Department">
                <input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Finance" />
              </PField>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {[
                { label: "Email",      value: profile?.email      || "—" },
                { label: "Phone",      value: profile?.phone      || "—" },
                { label: "Department", value: profile?.department || "—" },
                { label: "Username",   value: `@${profile?.username || "—"}` },
                { label: "User ID",    value: `#${profile?.id || "—"}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                  <span className="text-xs text-gray-800 font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 flex gap-2 border-t border-gray-50 pt-3">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setError(""); }}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
              >
                {saving ? <><Spinner /> Saving…</> : <><CheckIcon2 /> Save Changes</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              <EditIcon /> Edit Profile
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function PField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children && (() => {
        const child = children;
        return (
          <child.type
            {...child.props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 bg-white outline-none focus:border-violet-500 transition-colors"
          />
        );
      })()}
    </div>
  );
}

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────
function NotificationPanel({ onClose }) {
  const notifications = [
    { id: 1, type: "approval", text: "New account request from Maria Santos", time: "2m ago", unread: true },
    { id: 2, type: "document", text: "Document TRACK-0042 has been registered", time: "15m ago", unread: true },
    { id: 3, type: "alert",    text: "Login failure detected for user jdoe",   time: "1h ago",  unread: false },
    { id: 4, type: "document", text: "Document TRACK-0039 was updated",         time: "3h ago",  unread: false },
  ];
  const typeColor = { approval: "#7c3aed", document: "#059669", alert: "#dc2626" };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl z-[150] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-900">Notifications</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? "bg-violet-50/40" : ""}`}
          >
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: n.unread ? typeColor[n.type] || "#7c3aed" : "#d1d5db" }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 font-medium leading-snug">{n.text}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
        <span className="text-xs text-violet-600 font-bold cursor-pointer hover:text-violet-700">View all notifications</span>
      </div>
    </div>
  );
}

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────
function ProfileDropdown({ profile, onViewProfile, onLogout, onClose }) {
  const [bg, fg] = avatarBg(`${profile?.first_name || ""}${profile?.last_name || ""}`);

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-[150] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${bg}88, #fff)` }}>
        <div className="flex items-center gap-2.5">
          {profile?.avatar_url ? (
            <img src={fullAvatarUrl(profile.avatar_url)} alt="" className="w-9 h-9 rounded-full object-cover border border-white shadow-sm" />
          ) : (
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-white shadow-sm" style={{ background: bg, color: fg }}>
              {initials(profile?.first_name, profile?.last_name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-[10px] text-gray-400 truncate">@{profile?.username}</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        <button
          onClick={() => { onViewProfile(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <UserIcon /> View / Edit Profile
        </button>
        <div className="border-t border-gray-50 my-1" />
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogoutIcon /> Logout
        </button>
      </div>
    </div>
  );
}

// ─── MAIN TOPBAR ─────────────────────────────────────────────────────────────
export default function TopBar({ children, onLogout }) {
  const [showNotif,    setShowNotif]    = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [profile,      setProfile]      = useState(null);

  const notifRef = useRef();
  const dropRef  = useRef();

  // ── Fetch full profile from API using JWT id ──────────────────────────────
  useEffect(() => {
    try {
      const token   = localStorage.getItem("token");
      if (!token) return;
      const decoded = JSON.parse(atob(token.split(".")[1]));

      fetch(`${API_BASE}/users/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => setProfile(data || decoded))
        .catch(() => setProfile(decoded));
    } catch {
      setProfile({});
    }
  }, []);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (dropRef.current  && !dropRef.current.contains(e.target))  setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = 2;
  const [bg, fg] = avatarBg(`${profile?.first_name || ""}${profile?.last_name || ""}`);

  return (
    <>
      <div
        className="flex items-center gap-2.5 px-5 py-2.5 border-b border-gray-100 bg-white sticky top-0 z-10"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex-1 min-w-0">{children}</div>

        <div className="flex items-center gap-1.5 shrink-0">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotif(v => !v); setShowDropdown(false); }}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}
          </div>

          {/* Profile Avatar Button */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => { setShowDropdown(v => !v); setShowNotif(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={fullAvatarUrl(profile.avatar_url)} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
              ) : (
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border border-gray-200" style={{ background: bg, color: fg }}>
                  {initials(profile?.first_name, profile?.last_name)}
                </span>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-800 leading-tight">
                  {profile?.first_name ? `${profile.first_name}!` : (profile?.username || "User")}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight">{formatRole(profile?.role)}</p>
              </div>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" width="10" height="10" className="text-gray-400 hidden sm:block">
                <path d="M2 4l4 4 4-4" strokeLinecap="round" />
              </svg>
            </button>

            {showDropdown && (
              <ProfileDropdown
                profile={profile}
                onViewProfile={() => setShowProfile(true)}
                onLogout={onLogout}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>

      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => {
            setProfile(updated);
            setShowProfile(false);
          }}
        />
      )}
    </>
  );
}
