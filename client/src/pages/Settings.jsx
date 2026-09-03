import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, ChevronRight, CircleHelp, Clock3,
  FileText, KeyRound, LockKeyhole, Mail,
  Save, Settings as SettingsIcon, ShieldCheck,
  Smartphone, UserRound, Camera, Shield, Info,
} from "lucide-react";

const API        = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL =  import.meta.env.VITE_API_URL  || "http://localhost:5000";

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

// ─── Nav sections ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: "account",
    label: "Account Settings",
    description: "Profile & password",
    icon: UserRound,
    items: ["Edit Profile", "Change Password", "Update Profile Picture"],
  },
  {
    id: "notifications",
    label: "Notification Settings",
    description: "Alerts and updates",
    icon: Bell,
    items: ["Email Notifications", "In-App Notifications", "Approval Status Alerts", "Document Update Alerts"],
  },
  {
    id: "privacy",
    label: "Privacy",
    description: "Data & personal info",
    icon: Shield,
    items: ["Manage Personal Information", "Data Privacy Notice"],
  },
];

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`path-settings-toggle ${checked ? "is-on" : ""}`}
      onClick={onChange}
      aria-pressed={checked}
      aria-label={label}
    >
      <span />
    </button>
  );
}

// ─── SettingRow ───────────────────────────────────────────────────────────────
function SettingRow({ icon: Icon, title, description, children, noBorder }) {
  return (
    <div className="path-settings-row" style={noBorder ? { borderBottom: "none" } : undefined}>
      <div className="path-settings-row-icon"><Icon size={15} /></div>
      <div className="path-settings-row-copy">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <div className="path-settings-row-control">{children}</div>
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ title, subtitle }) {
  return (
    <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #f0ecf5" }}>
      <h2 style={{ margin: 0, color: "#40364b", fontSize: 16, fontWeight: 800, fontFamily: "Manrope,'DM Sans',sans-serif", letterSpacing: "-0.03em" }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", color: "#a096aa", fontSize: 12, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{subtitle}</p>}
    </div>
  );
}

// ─── ACCOUNT SETTINGS ─────────────────────────────────────────────────────────
function AccountSection({ profile, onSaved, onToast }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name  || "",
    email:     profile?.email      || "",
    phone:     profile?.phone      || "",
  });
  const [editing, setEditing]             = useState(false);
  const [saving, setSaving]               = useState(false);
  const [pwForm, setPwForm]               = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [pwEditing, setPwEditing]         = useState(false);
  const [pwSaving, setPwSaving]           = useState(false);
  const [showPw, setShowPw]               = useState({ current: false, new: false, confirm: false });
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading]         = useState(false);
  const fileRef = useRef();

  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));
  const togglePw = (k) => setShowPw(s => ({ ...s, [k]: !s[k] }));

  const pwStrength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)          s++;
    if (pw.length >= 12)         s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const str      = pwStrength(pwForm.new_password);
  const strLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][str] || "";
  const strColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][str] || "#e2dbe9";

  const handleSaveProfile = async () => {
    if (!form.full_name.trim()) { onToast("Full name is required.", "error"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${profile.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Save failed."); }
      const updated = await res.json();
      onSaved({ ...profile, ...updated });
      setEditing(false);
      onToast("Profile updated successfully!", "success");
    } catch (err) { onToast(err.message || "Failed to save.", "error"); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current_password)                         { onToast("Current password is required.", "error"); return; }
    if (pwForm.new_password.length < 8)                  { onToast("New password must be at least 8 characters.", "error"); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { onToast("Passwords do not match.", "error"); return; }
    setPwSaving(true);
    try {
      const res = await fetch(`${API}/users/${profile.id}/change-password`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: pwForm.current_password, new_password: pwForm.new_password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setPwEditing(false);
      onToast("Password changed successfully!", "success");
    } catch (err) { onToast(err.message || "Failed.", "error"); }
    finally { setPwSaving(false); }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { onToast("Please select an image file.", "error"); return; }
    if (file.size > 5 * 1024 * 1024)    { onToast("Image must be under 5 MB.", "error"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleUploadPhoto = async () => {
    if (!avatarFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", avatarFile);
      const res  = await fetch(`${API}/upload`, { method: "POST", headers: authHeaders(), body: fd });
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
      setAvatarPreview(null);
      onToast("Profile picture updated!", "success");
    } catch (err) { onToast(err.message || "Upload failed.", "error"); }
    finally { setUploading(false); }
  };

  const displayAvatar = avatarPreview || fullAvatarUrl(profile?.avatar_url);

  return (
    <>
      {/* ── Edit Profile ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 16px", borderBottom: "1px solid #f0ecf5" }}>
        <div>
          <h2 style={{ margin: 0, color: "#40364b", fontSize: 16, fontWeight: 800, fontFamily: "Manrope,'DM Sans',sans-serif", letterSpacing: "-0.03em" }}>Edit Profile</h2>
          <p style={{ margin: "4px 0 0", color: "#a096aa", fontSize: 12, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>
            {editing ? "Make your changes below and click Save." : "Update your name, email address, and contact number."}
          </p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="path-settings-btn-ghost"
            style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
          >
            ✎ Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                setForm({ full_name: profile?.full_name || "", email: profile?.email || "", phone: profile?.phone || "" });
                setEditing(false);
              }}
              className="path-settings-btn-ghost"
            >
              Cancel
            </button>
            <button onClick={handleSaveProfile} disabled={saving} className="path-settings-btn-primary">
              <Save size={13} /> {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      <SettingRow icon={UserRound} title="Full name" description="Your display name across all documents and handoffs.">
        <input
          value={form.full_name}
          onChange={e => set("full_name", e.target.value)}
          placeholder="Full name"
          aria-label="Full name"
          readOnly={!editing}
          style={!editing ? { color: "#3b2a52", background: "#f9f8fc", cursor: "default" } : undefined}
        />
      </SettingRow>
      <SettingRow icon={Mail} title="Email address" description="Primary address for PATH workflow communication.">
        <input
          type="email"
          value={form.email}
          onChange={e => set("email", e.target.value)}
          placeholder="email@example.com"
          aria-label="Email address"
          readOnly={!editing}
          style={!editing ? { color: "#3b2a52", background: "#f9f8fc", cursor: "default" } : undefined}
        />
      </SettingRow>
      <SettingRow icon={Smartphone} title="Contact number" description="Your phone number for account and workflow notifications.">
        <input
          value={form.phone}
          onChange={e => set("phone", e.target.value)}
          placeholder="+63 912 345 6789"
          aria-label="Contact number"
          readOnly={!editing}
          style={!editing ? { color: "#3b2a52", background: "#f9f8fc", cursor: "default" } : undefined}
        />
      </SettingRow>

      {/* ── Change Password ── */}
      <div style={{ borderTop: "2px solid #f4f1f7", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 16px", borderBottom: "1px solid #f0ecf5" }}>
        <div>
          <h2 style={{ margin: 0, color: "#40364b", fontSize: 16, fontWeight: 800, fontFamily: "Manrope,'DM Sans',sans-serif", letterSpacing: "-0.03em" }}>Change Password</h2>
          <p style={{ margin: "4px 0 0", color: "#a096aa", fontSize: 12, lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>
            {pwEditing ? "Enter your current password and choose a new one." : "Make sure it's at least 8 characters and hard to guess."}
          </p>
        </div>
        {!pwEditing ? (
          <button onClick={() => setPwEditing(true)} className="path-settings-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            ✎ Edit
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setPwForm({ current_password: "", new_password: "", confirm_password: "" }); setPwEditing(false); }}
              className="path-settings-btn-ghost"
            >
              Cancel
            </button>
            <button onClick={handleChangePassword} disabled={pwSaving} className="path-settings-btn-primary">
              <KeyRound size={13} /> {pwSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        )}
      </div>

      {pwEditing && (
        <>
          <SettingRow icon={LockKeyhole} title="Current password" description="Required to verify your identity.">
            <div style={{ display: "flex", gap: 6 }}>
              <input
                type={showPw.current ? "text" : "password"}
                value={pwForm.current_password}
                onChange={e => setPw("current_password", e.target.value)}
                placeholder="Current password"
                aria-label="Current password"
              />
              <button onClick={() => togglePw("current")} className="path-settings-btn-ghost">{showPw.current ? "Hide" : "Show"}</button>
            </div>
          </SettingRow>
          <SettingRow icon={KeyRound} title="New password" description="At least 8 characters with letters, numbers, and symbols.">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type={showPw.new ? "text" : "password"}
                  value={pwForm.new_password}
                  onChange={e => setPw("new_password", e.target.value)}
                  placeholder="New password"
                  aria-label="New password"
                />
                <button onClick={() => togglePw("new")} className="path-settings-btn-ghost">{showPw.new ? "Hide" : "Show"}</button>
              </div>
              {pwForm.new_password.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ width: 22, height: 3, borderRadius: 99, background: i <= str ? strColor : "#e2dbe9", transition: "background 0.2s" }} />
                  ))}
                  <span style={{ fontSize: 10, color: strColor, fontWeight: 700, marginLeft: 4 }}>{strLabel}</span>
                </div>
              )}
            </div>
          </SettingRow>
          <SettingRow icon={ShieldCheck} title="Confirm new password" description="Re-enter your new password to confirm.">
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type={showPw.confirm ? "text" : "password"}
                  value={pwForm.confirm_password}
                  onChange={e => setPw("confirm_password", e.target.value)}
                  placeholder="Confirm password"
                  aria-label="Confirm password"
                />
                <button onClick={() => togglePw("confirm")} className="path-settings-btn-ghost">{showPw.confirm ? "Hide" : "Show"}</button>
              </div>
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600 }}>Passwords do not match</span>
              )}
            </div>
          </SettingRow>
        </>
      )}

      {/* ── Profile Picture ── */}
      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Update Profile Picture" subtitle="Upload a new photo — JPG, PNG, GIF or WebP, max 5 MB." />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "18px 22px" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, overflow: "hidden", border: "3px solid #ede9fe", background: "linear-gradient(135deg,#a78bfa,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", fontFamily: "Manrope,sans-serif" }}>
            {displayAvatar
              ? <img src={displayAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials(profile?.full_name)}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ position: "absolute", bottom: -4, right: -4, width: 26, height: 26, borderRadius: "50%", background: "#7c3aed", color: "#fff", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Camera size={12} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: "none" }} />
        </div>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#3b2a52", fontFamily: "'DM Sans',sans-serif" }}>{profile?.full_name || "—"}</p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: "#9080a0", fontFamily: "'DM Sans',sans-serif" }}>@{profile?.username}</p>
          {avatarFile ? (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleUploadPhoto} disabled={uploading} className="path-settings-btn-primary" style={{ fontSize: 11, padding: "6px 14px" }}>
                <Camera size={12} /> {uploading ? "Uploading…" : "Upload photo"}
              </button>
              <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="path-settings-btn-ghost">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} className="path-settings-btn-ghost">
              Choose new photo
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── NOTIFICATION SETTINGS ────────────────────────────────────────────────────
function NotificationsSection({ onToast }) {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("path_notif_prefs") || "{}"); } catch { return {}; }
  });
  const save = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("path_notif_prefs", JSON.stringify(next));
    onToast("Preference saved!", "success");
  };
  const get = (key, def = true) => prefs[key] !== undefined ? prefs[key] : def;

  return (
    <>
      <SectionHeading title="Email Notifications" subtitle="Control which updates are sent to your email address." />
      <SettingRow icon={Mail} title="Enable email notifications" description="Receive PATH workflow updates via email.">
        <Toggle checked={get("email")} onChange={() => save("email", !get("email"))} label="Toggle email notifications" />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="In-App Notifications" subtitle="Control alerts that appear inside the PATH platform." />
      </div>
      <SettingRow icon={Bell} title="Enable in-app notifications" description="Show real-time alerts and updates within PATH.">
        <Toggle checked={get("inapp")} onChange={() => save("inapp", !get("inapp"))} label="Toggle in-app notifications" />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Approval Status Alerts" subtitle="Get notified when a document or form is approved, rejected, or returned." />
      </div>
      <SettingRow icon={FileText} title="Approval status alerts" description="Notify me when my submissions change status.">
        <Toggle checked={get("approval")} onChange={() => save("approval", !get("approval"))} label="Toggle approval status alerts" />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Document Update Alerts" subtitle="Get notified when documents you are involved in are updated." />
      </div>
      <SettingRow icon={FileText} title="Document update alerts" description="Notify me when tracked documents are modified." noBorder>
        <Toggle checked={get("docUpdates")} onChange={() => save("docUpdates", !get("docUpdates"))} label="Toggle document update alerts" />
      </SettingRow>
    </>
  );
}

// ─── PRIVACY ──────────────────────────────────────────────────────────────────
function PrivacySection({ profile }) {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <>
      <SectionHeading title="Manage Personal Information" subtitle="Review the personal data stored in your PATH account." />

      <div style={{ padding: "16px 22px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { label: "Full name",   value: profile?.full_name  || "—" },
          { label: "Username",    value: `@${profile?.username || "—"}` },
          { label: "Email",       value: profile?.email      || "—" },
          { label: "Phone",       value: profile?.phone      || "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f4f1f7" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#6b5f76", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
            <span style={{ fontSize: 13, color: "#3b2a52", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Data Privacy Notice" subtitle="How PATH collects, stores, and uses your personal information." />
      </div>

      <div style={{ padding: "16px 22px 20px" }}>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f6ff", border: "1px solid #ede9fe", marginBottom: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#3b2a52", fontFamily: "'DM Sans',sans-serif" }}>What data do we collect?</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b5f76", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
            PATH collects your name, email, phone number, department, and document activity (submissions, approvals, revisions) to facilitate the academic document workflow process.
          </p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f6ff", border: "1px solid #ede9fe", marginBottom: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#3b2a52", fontFamily: "'DM Sans',sans-serif" }}>How is your data used?</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b5f76", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
            Your data is used solely for document tracking, review workflows, notifications, and audit trail purposes within your department. It is not shared with third parties.
          </p>
        </div>
        <div style={{ padding: "14px 16px", borderRadius: 10, background: "#f8f6ff", border: "1px solid #ede9fe" }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700, color: "#3b2a52", fontFamily: "'DM Sans',sans-serif" }}>Data retention</p>
          <p style={{ margin: 0, fontSize: 12, color: "#6b5f76", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
            Your account data is retained for as long as your account is active. Document records and audit logs are retained for institutional compliance purposes. Contact your system administrator to request data deletion.
          </p>
        </div>
      </div>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("account");
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [toast,   setToast]     = useState(null);

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
    <main className="path-settings-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        .path-settings-page{--violet:#7c3aed;--violet-2:#8b5cf6;--violet-soft:#f4efff;--ink:#30283b;--muted:#91889d;height:calc(100vh - 60px);overflow-y:auto;padding:28px 48px 44px 64px;color:var(--ink);background:#f8f7ff;font-family:"DM Sans",Arial,sans-serif;}
        .path-settings-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin:0 0 28px;}
        .path-settings-kicker{display:flex;align-items:center;gap:8px;margin-bottom:9px;color:var(--violet);font-family:"DM Sans",Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;}
        .path-settings-kicker i{display:block;width:7px;height:7px;border:2px solid #ddd0ff;border-radius:50%;background:var(--violet-2);box-shadow:0 0 0 3px rgba(124,58,237,.08);}
        .path-settings-header h1{margin:0;color:var(--ink);font-family:Manrope,"DM Sans",Arial,sans-serif;font-size:clamp(26px,3vw,36px);font-weight:800;letter-spacing:-.04em;line-height:1.05;}
        .path-settings-header p{max-width:510px;margin:8px 0 0;color:var(--muted);font-size:13px;line-height:1.6;}
        .path-settings-layout{display:grid;grid-template-columns:228px minmax(0,1fr);gap:18px;}
        .path-settings-nav{border:1px solid rgba(231,225,241,.9);border-radius:14px;background:rgba(255,255,255,.88);box-shadow:0 8px 24px rgba(59,39,88,.04);align-self:start;padding:8px;}
        .path-settings-nav-label{padding:9px 10px 7px;color:#aaa0b6;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
        .path-settings-nav button{display:flex;align-items:center;width:100%;gap:10px;padding:10px;border:0;border-radius:9px;background:transparent;color:#746a80;cursor:pointer;text-align:left;font-family:"DM Sans",Arial,sans-serif;font-size:12px;transition:background .18s,color .18s;}
        .path-settings-nav button:hover{background:#faf7ff;color:var(--violet);}
        .path-settings-nav button.active{background:var(--violet-soft);color:#6d28d9;}
        .path-settings-nav-copy{display:grid;gap:2px;min-width:0;}
        .path-settings-nav-copy strong{font-size:12px;font-weight:800;}
        .path-settings-nav-copy span{color:#aa9fb4;font-size:10px;}
        .path-settings-nav button.active .path-settings-nav-copy span{color:#9b83cf;}
        .path-settings-card{border:1px solid rgba(231,225,241,.9);border-radius:14px;background:rgba(255,255,255,.88);box-shadow:0 8px 24px rgba(59,39,88,.04);overflow:hidden;}
        .path-settings-row{display:grid;grid-template-columns:30px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:68px;padding:11px 22px;border-bottom:1px solid #f4f1f7;}
        .path-settings-row:last-child{border-bottom:0;}
        .path-settings-row-icon{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;background:#f6f1ff;color:var(--violet-2);}
        .path-settings-row-copy{display:grid;gap:3px;min-width:0;}
        .path-settings-row-copy strong{color:#51475d;font-size:13px;font-weight:700;}
        .path-settings-row-copy span{color:#a098a7;font-size:11px;line-height:1.4;}
        .path-settings-row-control{display:flex;align-items:center;justify-content:flex-end;gap:6px;}
        .path-settings-row-control input{min-height:32px;padding:0 10px;border:1px solid #e7e0f0;border-radius:8px;outline:0;background:#fff;color:#5f566b;font-family:"DM Sans",Arial,sans-serif;font-size:12px;min-width:200px;}
        .path-settings-row-control input:focus{border-color:#bba6e8;box-shadow:0 0 0 3px rgba(124,58,237,.08);}
        .path-settings-toggle{position:relative;width:38px;height:22px;padding:2px;border:0;border-radius:999px;background:#ddd7e5;cursor:pointer;transition:background .18s;}
        .path-settings-toggle span{display:block;width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 2px 5px rgba(46,31,69,.16);transition:transform .18s;}
        .path-settings-toggle.is-on{background:var(--violet);}
        .path-settings-toggle.is-on span{transform:translateX(16px);}
        .path-settings-btn-primary{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:9px;background:#7c3aed;color:#fff;border:none;font-size:12px;font-weight:800;font-family:"DM Sans",Arial,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(124,58,237,.25);transition:background .15s;}
        .path-settings-btn-primary:hover{background:#6d28d9;}
        .path-settings-btn-primary:disabled{opacity:.6;cursor:not-allowed;}
        .path-settings-btn-ghost{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;border-radius:8px;background:transparent;color:#7c3aed;border:1px solid #e7e0f0;font-size:11px;font-weight:700;font-family:"DM Sans",Arial,sans-serif;cursor:pointer;transition:background .15s;}
        .path-settings-btn-ghost:hover{background:#f5f0ff;}
        @keyframes sett-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:1040px){.path-settings-page{padding-left:28px;padding-right:28px;}}
        @media(max-width:820px){.path-settings-page{padding:24px 16px 32px;}.path-settings-layout{grid-template-columns:1fr;}.path-settings-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;}.path-settings-nav-label{grid-column:1/-1;}}
        @media(max-width:560px){.path-settings-nav{grid-template-columns:1fr;}}
      `}</style>

      {/* Header */}
      <header className="path-settings-header">
        <div>
          <div className="path-settings-kicker"><i /> Workspace preferences</div>
          <h1>Settings</h1>
          <p>Manage your account, notifications, and privacy preferences.</p>
        </div>
      </header>

      <div className="path-settings-layout">
        {/* Nav */}
        <nav className="path-settings-nav" aria-label="Settings sections">
          <div className="path-settings-nav-label">Manage PATH</div>
          {SECTIONS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeSection === id ? "active" : ""}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={15} />
              <span className="path-settings-nav-copy">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ChevronRight size={13} style={{ marginLeft: "auto", opacity: .5 }} />
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="path-settings-card">
          {loading ? (
            <div style={{ padding: "32px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              {[70,55,80,60,70].map((w, i) => (
                <div key={i} style={{ height: 13, width: `${w}%`, borderRadius: 7, background: "#ede9fe", animation: "sett-pulse 1.4s ease-in-out infinite" }} />
              ))}
              <style>{`@keyframes sett-pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
            </div>
          ) : (
            <>
              {activeSection === "account"       && <AccountSection       profile={profile} onSaved={setProfile} onToast={showToast} />}
              {activeSection === "notifications"  && <NotificationsSection onToast={showToast} />}
              {activeSection === "privacy"        && <PrivacySection       profile={profile} />}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 18px", borderRadius: 10, maxWidth: 360,
          background: toast.type === "success" ? "#f0fdf4" : "#fff1f2",
          border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecdd3"}`,
          color: toast.type === "success" ? "#14532d" : "#991b1b",
          boxShadow: "0 8px 28px rgba(0,0,0,0.10)",
          fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600,
          animation: "sett-toast-in 0.25s ease",
        }}>
          <span>{toast.type === "success" ? "✓" : "✕"}</span>
          {toast.message}
          <button onClick={() => setToast(null)} style={{ marginLeft: "auto", border: 0, background: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}>×</button>
        </div>
      )}
    </main>
  );
}
