import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}
function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  const isSuccess = type === "success";
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 18px", borderRadius: 10, maxWidth: 360,
      background: isSuccess ? "#f0fdf4" : "#fff1f2",
      border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecdd3"}`,
      color: isSuccess ? "#14532d" : "#991b1b",
      boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
      animation: "sett-toast-in 0.25s ease",
    }}>
      <span style={{ fontSize: 16 }}>{isSuccess ? "✓" : "✕"}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft: "auto", border: 0, background: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}>×</button>
      <style>{`@keyframes sett-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#6b5f76", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#a095ab" }}>{hint}</span>}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder, disabled, readOnly }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      style={{
        width: "100%", padding: "9px 12px", borderRadius: 8,
        border: "1px solid #e2dbe9", background: disabled || readOnly ? "#f9f8fc" : "#fff",
        color: disabled || readOnly ? "#9080a0" : "#3b2a52",
        fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none",
        cursor: disabled || readOnly ? "not-allowed" : "text",
        boxSizing: "border-box",
      }}
    />
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "profile",    label: "Profile",    icon: "👤" },
  { key: "security",   label: "Security",   icon: "🔒" },
  { key: "appearance", label: "Appearance", icon: "🎨" },
];

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({ profile, onSaved, onToast }) {
  const [form, setForm] = useState({
    full_name:  profile?.full_name  || "",
    email:      profile?.email      || "",
    phone:      profile?.phone      || "",
    department: profile?.department || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { onToast("Please select an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024)    { onToast("Image must be under 5 MB.", "error"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res = await fetch(`${API}/upload`, {
        method: "POST", headers: authHeaders(), body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Upload failed.");

      const patch = await fetch(`${API}/users/${profile.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: data.url, avatar_key: data.key }),
      });
      if (!patch.ok) throw new Error("Could not save photo.");
      onSaved({ ...profile, avatar_url: fullAvatarUrl(data.url) });
      setAvatarFile(null);
      onToast("Photo updated successfully!", "success");
    } catch (err) {
      onToast(err.message || "Upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { onToast("Full name is required.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${profile.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Save failed.");
      }
      const updated = await res.json();
      onSaved({ ...profile, ...updated });
      onToast("Profile saved successfully!", "success");
    } catch (err) {
      onToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || fullAvatarUrl(profile?.avatar_url);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          {displayAvatar ? (
            <img src={displayAvatar} alt="Avatar" style={{ width: 80, height: 80, borderRadius: 16, objectFit: "cover", border: "3px solid #ede9fe" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 800, color: "#fff", border: "3px solid #ede9fe" }}>
              {initials(profile?.full_name)}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            style={{ position: "absolute", bottom: -6, right: -6, width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "#fff", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}
          >✎</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#27213a" }}>{profile?.full_name || "—"}</p>
          <p style={{ margin: "3px 0 10px", fontSize: 12, color: "#9080a0" }}>@{profile?.username} · {profile?.role}</p>
          {avatarFile && (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                style={{ padding: "5px 14px", borderRadius: 7, background: "#7c3aed", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: uploadingAvatar ? 0.6 : 1 }}
              >
                {uploadingAvatar ? "Uploading…" : "Upload photo"}
              </button>
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                style={{ padding: "5px 14px", borderRadius: 7, background: "transparent", color: "#9080a0", border: "1px solid #e2dbe9", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >Cancel</button>
            </div>
          )}
          {!avatarFile && (
            <p style={{ margin: 0, fontSize: 11, color: "#b0a3ba" }}>Click the pencil icon to change · JPG, PNG, GIF, WebP · max 5 MB</p>
          )}
        </div>
      </div>

      <div style={{ height: 1, background: "#f0eafc" }} />

      {/* Form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Full name">
          <Input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Full name" />
        </Field>
        <Field label="Username" hint="Username cannot be changed">
          <Input value={profile?.username || ""} readOnly />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+63 912 345 6789" />
        </Field>
        <Field label="Department" hint="Contact an admin to change your department">
          <Input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Information Systems" />
        </Field>
        <Field label="Role" hint="Role is assigned by an administrator">
          <Input value={profile?.role || ""} readOnly />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 28px", borderRadius: 9, background: "linear-gradient(135deg,#4c1d95,#7c3aed)", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ─── SECURITY TAB ─────────────────────────────────────────────────────────────
function SecurityTab({ profile, onToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k) => setShow(s => ({ ...s, [k]: !s[k] }));

  const handleSave = async () => {
    if (!form.current_password) { onToast("Current password is required.", "error"); return; }
    if (form.new_password.length < 8) { onToast("New password must be at least 8 characters.", "error"); return; }
    if (form.new_password !== form.confirm_password) { onToast("Passwords do not match.", "error"); return; }

    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${profile.id}/change-password`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to change password.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      onToast("Password changed successfully!", "success");
    } catch (err) {
      onToast(err.message || "Failed to change password.", "error");
    } finally {
      setSaving(false);
    }
  };

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)  s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const pw = form.new_password;
  const str = strength(pw);
  const strLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][str] || "";
  const strColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][str] || "#e2dbe9";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#27213a" }}>Change password</p>
        <p style={{ margin: 0, fontSize: 13, color: "#9080a0" }}>Make sure it's at least 8 characters and hard to guess.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
        {/* Current password */}
        <Field label="Current password">
          <div style={{ position: "relative" }}>
            <Input type={show.current ? "text" : "password"} value={form.current_password} onChange={e => set("current_password", e.target.value)} placeholder="Enter current password" />
            <button onClick={() => toggle("current")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", cursor: "pointer", color: "#9080a0", fontSize: 13 }}>
              {show.current ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        {/* New password */}
        <Field label="New password">
          <div style={{ position: "relative" }}>
            <Input type={show.new ? "text" : "password"} value={form.new_password} onChange={e => set("new_password", e.target.value)} placeholder="Enter new password" />
            <button onClick={() => toggle("new")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", cursor: "pointer", color: "#9080a0", fontSize: 13 }}>
              {show.new ? "Hide" : "Show"}
            </button>
          </div>
          {/* Strength meter */}
          {pw.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= str ? strColor : "#e2dbe9", transition: "background 0.2s" }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: strColor, fontWeight: 700 }}>{strLabel}</span>
            </div>
          )}
        </Field>

        {/* Confirm password */}
        <Field label="Confirm new password">
          <div style={{ position: "relative" }}>
            <Input type={show.confirm ? "text" : "password"} value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} placeholder="Re-enter new password" />
            <button onClick={() => toggle("confirm")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: 0, background: "none", cursor: "pointer", color: "#9080a0", fontSize: 13 }}>
              {show.confirm ? "Hide" : "Show"}
            </button>
          </div>
          {form.confirm_password && form.new_password !== form.confirm_password && (
            <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 600 }}>Passwords do not match</span>
          )}
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 28px", borderRadius: 9, background: "linear-gradient(135deg,#4c1d95,#7c3aed)", color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
        >
          {saving ? "Updating…" : "Update password"}
        </button>
        <button
          onClick={() => navigate("/forgot-password")}
          style={{ padding: "10px 18px", borderRadius: 9, background: "transparent", color: "#7c3aed", border: "1px solid #e2dbe9", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Forgot password?
        </button>
      </div>

      <div style={{ height: 1, background: "#f0eafc", margin: "4px 0" }} />

      {/* Session info */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#27213a" }}>Active session</p>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "#9080a0" }}>You are currently logged in. Sessions expire after 8 hours.</p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#14532d", fontSize: 12, fontWeight: 700 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          Session active
        </div>
      </div>
    </div>
  );
}

// ─── APPEARANCE TAB ───────────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { label: "Violet",    value: "#7c3aed", dark: "#4c1d95" },
  { label: "Indigo",    value: "#4f46e5", dark: "#312e81" },
  { label: "Blue",      value: "#2563eb", dark: "#1e3a8a" },
  { label: "Teal",      value: "#0d9488", dark: "#134e4a" },
  { label: "Rose",      value: "#e11d48", dark: "#881337" },
  { label: "Amber",     value: "#d97706", dark: "#78350f" },
];

function AppearanceTab({ onToast }) {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("path_prefs") || "{}"); } catch { return {}; }
  });

  const save = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("path_prefs", JSON.stringify(next));
    onToast("Preference saved!", "success");
  };

  const accent = prefs.accent || "#7c3aed";
  const density = prefs.density || "comfortable";
  const sidebarCollapsed = prefs.sidebarCollapsed || false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Accent color */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#27213a" }}>Accent color</p>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9080a0" }}>Used across buttons, active states, and highlights.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => save("accent", c.value)}
              title={c.label}
              style={{
                width: 36, height: 36, borderRadius: 10, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg, ${c.dark}, ${c.value})`,
                boxShadow: accent === c.value ? `0 0 0 3px #fff, 0 0 0 5px ${c.value}` : "none",
                transform: accent === c.value ? "scale(1.15)" : "scale(1)",
                transition: "all 0.15s",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "#f0eafc" }} />

      {/* Density */}
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#27213a" }}>Interface density</p>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9080a0" }}>Controls spacing and element sizes.</p>
        <div style={{ display: "flex", gap: 10 }}>
          {["compact", "comfortable", "spacious"].map(d => (
            <button
              key={d}
              onClick={() => save("density", d)}
              style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                border: density === d ? "2px solid #7c3aed" : "1px solid #e2dbe9",
                background: density === d ? "#f5f3ff" : "#fff",
                color: density === d ? "#7c3aed" : "#6b5f76",
                textTransform: "capitalize",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: "#f0eafc" }} />

      {/* Sidebar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 420 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#27213a" }}>Collapse sidebar by default</p>
          <p style={{ margin: 0, fontSize: 12, color: "#9080a0" }}>Start with the sidebar minimized on each visit.</p>
        </div>
        <button
          onClick={() => save("sidebarCollapsed", !sidebarCollapsed)}
          style={{
            width: 44, height: 24, borderRadius: 99, border: "none", cursor: "pointer",
            background: sidebarCollapsed ? "#7c3aed" : "#e2dbe9",
            position: "relative", transition: "background 0.2s", flexShrink: 0,
          }}
        >
          <div style={{
            position: "absolute", top: 2, left: sidebarCollapsed ? 22 : 2,
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)", transition: "left 0.2s",
          }} />
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 12, color: "#b0a3ba", fontStyle: "italic" }}>
        Appearance preferences are stored locally in your browser.
      </p>
    </div>
  );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────────────
export default function Settings() {
  const navigate  = useNavigate();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const decoded = getUser();

  useEffect(() => {
    if (!decoded?.id) { navigate("/login"); return; }
    fetch(`${API}/users/${decoded.id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setProfile(data || decoded))
      .catch(() => setProfile(decoded))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = "success") =>
    setToast({ message, type, id: Date.now() });

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif", padding: "32px 0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; outline: none !important; }
      `}</style>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: 5, border: 0, background: "none", color: "#7c3aed", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 14 }}
          >
            ← Back
          </button>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#27213a", fontFamily: "Manrope,'DM Sans',sans-serif", letterSpacing: "-0.04em" }}>
            Settings
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9080a0" }}>
            Manage your profile, security, and appearance preferences.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

          {/* Sidebar nav */}
          <nav style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e1f5", padding: 8, boxShadow: "0 4px 14px rgba(76,29,149,0.06)", position: "sticky", top: 24 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "10px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: tab === t.key ? "#f5f3ff" : "transparent",
                  color: tab === t.key ? "#7c3aed" : "#6b5f76",
                  fontSize: 13, fontWeight: tab === t.key ? 800 : 600,
                  textAlign: "left", transition: "all 0.15s",
                  borderLeft: tab === t.key ? "3px solid #7c3aed" : "3px solid transparent",
                }}
              >
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}

            {/* Profile quick view */}
            <div style={{ marginTop: 12, padding: "12px 10px", borderTop: "1px solid #f0eafc" }}>
              {loading ? (
                <div style={{ height: 40, borderRadius: 8, background: "#ede9fe", animation: "sett-pulse 1.5s ease-in-out infinite" }} />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {fullAvatarUrl(profile?.avatar_url) ? (
                    <img src={fullAvatarUrl(profile.avatar_url)} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                      {initials(profile?.full_name)}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#3b2a52", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name || "—"}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#9080a0", textTransform: "capitalize" }}>{profile?.role || "—"}</p>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Main content */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8e1f5", padding: 28, boxShadow: "0 4px 14px rgba(76,29,149,0.06)" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[80, 60, 90, 70, 60].map((w, i) => (
                  <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 7, background: "#ede9fe", animation: "sett-pulse 1.5s ease-in-out infinite" }} />
                ))}
              </div>
            ) : (
              <>
                {/* Tab heading */}
                <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: "1px solid #f0eafc" }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#27213a", fontFamily: "Manrope,'DM Sans',sans-serif", letterSpacing: "-0.03em" }}>
                    {TABS.find(t => t.key === tab)?.icon} {TABS.find(t => t.key === tab)?.label}
                  </h2>
                </div>

                {tab === "profile"    && <ProfileTab    profile={profile} onSaved={setProfile} onToast={showToast} />}
                {tab === "security"   && <SecurityTab   profile={profile} onToast={showToast} />}
                {tab === "appearance" && <AppearanceTab onToast={showToast} />}
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <style>{`
        @keyframes sett-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
