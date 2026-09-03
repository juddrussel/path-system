import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, ChevronRight, CircleHelp, Clock3,
  Eye, FileText, Globe2, KeyRound, LockKeyhole, Mail,
  Monitor, Palette, Save, Settings as SettingsIcon,
  ShieldCheck, Smartphone, UserRound,
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
function SettingRow({ icon: Icon, title, description, children }) {
  return (
    <div className="path-settings-row">
      <div className="path-settings-row-icon"><Icon size={16} /></div>
      <div className="path-settings-row-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="path-settings-row-control">{children}</div>
    </div>
  );
}

// ─── Nav sections ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: "general",      label: "General",         description: "Workspace identity",  icon: SettingsIcon },
  { id: "notifications",label: "Notifications",   description: "Alerts and updates",  icon: Bell },
  { id: "security",     label: "Security & access",description: "Sign-in protection", icon: ShieldCheck },
  { id: "appearance",   label: "Appearance",      description: "Display preferences", icon: Palette },
];

// ─── PROFILE SECTION ──────────────────────────────────────────────────────────
function GeneralSection({ profile, onSaved, onToast }) {
  const [form, setForm] = useState({
    full_name:  profile?.full_name  || "",
    email:      profile?.email      || "",
    phone:      profile?.phone      || "",
    department: profile?.department || "",
  });
  const [saving, setSaving]               = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile]       = useState(null);
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
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Save failed."); }
      const updated = await res.json();
      onSaved({ ...profile, ...updated });
      onToast("Profile saved!", "success");
    } catch (err) {
      onToast(err.message || "Failed to save.", "error");
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = avatarPreview || fullAvatarUrl(profile?.avatar_url);

  return (
    <>
      {/* Profile header inside card */}
      <div className="path-settings-profile">
        <div
          className="path-settings-avatar"
          onClick={() => fileRef.current?.click()}
          title="Click to change photo"
          style={{ cursor: "pointer" }}
        >
          {displayAvatar
            ? <img src={displayAvatar} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover", display: "block" }} />
            : initials(profile?.full_name)}
        </div>
        <div className="path-settings-profile-copy">
          <strong>{profile?.full_name || "—"}</strong>
          <span>{profile?.role ? profile.role.replace(/_/g, " ") : "—"} · {profile?.department || "—"}</span>
          {avatarFile && (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                style={{ padding: "4px 12px", borderRadius: 7, background: "#7c3aed", color: "#fff", border: "none", fontSize: 10, fontWeight: 800, cursor: "pointer", opacity: uploadingAvatar ? 0.6 : 1 }}
              >{uploadingAvatar ? "Uploading…" : "Upload photo"}</button>
              <button
                onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                style={{ padding: "4px 12px", borderRadius: 7, background: "transparent", color: "#9080a0", border: "1px solid #e2dbe9", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
              >Cancel</button>
            </div>
          )}
        </div>
        <span className="path-settings-profile-badge"><i /> Active account</span>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
      </div>

      <SettingRow icon={Globe2} title="Department" description="The academic unit shown across your document records.">
        <input
          value={form.department}
          onChange={e => set("department", e.target.value)}
          aria-label="Department"
          placeholder="e.g. Information Systems"
        />
      </SettingRow>
      <SettingRow icon={Mail} title="Workspace email" description="Primary address for PATH workflow communication.">
        <input
          type="email"
          value={form.email}
          onChange={e => set("email", e.target.value)}
          aria-label="Workspace email"
          placeholder="email@example.com"
        />
      </SettingRow>
      <SettingRow icon={UserRound} title="Full name" description="Your display name across all documents and handoffs.">
        <input
          value={form.full_name}
          onChange={e => set("full_name", e.target.value)}
          aria-label="Full name"
          placeholder="Full name"
        />
      </SettingRow>
      <SettingRow icon={Eye} title="Username" description="Your login identifier — cannot be changed.">
        <input value={profile?.username || ""} readOnly aria-label="Username" style={{ color: "#a098a7" }} />
      </SettingRow>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 24px", borderTop: "1px solid #f4f1f7" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, background: saving ? "#9b8fc5" : "#7c3aed", color: "#fff", border: "none", fontSize: 11, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 6px 16px rgba(124,58,237,0.22)" }}
        >
          <Save size={13} /> {saving ? "Saving…" : "Save profile"}
        </button>
      </div>
    </>
  );
}

// ─── NOTIFICATIONS SECTION ────────────────────────────────────────────────────
function NotificationsSection({ onToast }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slaAlerts,   setSlaAlerts]   = useState(true);
  const [digest,      setDigest]      = useState(false);

  return (
    <>
      <SettingRow icon={Mail} title="Email workflow alerts" description="Receive updates when a document changes status.">
        <Toggle checked={emailAlerts} onChange={() => setEmailAlerts(v => !v)} label="Toggle email workflow alerts" />
      </SettingRow>
      <SettingRow icon={Bell} title="SLA risk notifications" description="Be alerted when a submission approaches its deadline.">
        <Toggle checked={slaAlerts} onChange={() => setSlaAlerts(v => !v)} label="Toggle SLA risk notifications" />
      </SettingRow>
      <SettingRow icon={FileText} title="Weekly activity digest" description="Receive a concise summary of workspace activity each Monday.">
        <Toggle checked={digest} onChange={() => setDigest(v => !v)} label="Toggle weekly activity digest" />
      </SettingRow>
    </>
  );
}

// ─── SECURITY SECTION ─────────────────────────────────────────────────────────
function SecuritySection({ profile, onToast }) {
  const navigate = useNavigate();
  const [form, setForm]   = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const set    = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (k)    => setShow(s => ({ ...s, [k]: !s[k] }));

  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8)          s++;
    if (pw.length >= 12)         s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };
  const str      = strength(form.new_password);
  const strLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][str] || "";
  const strColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][str] || "#e2dbe9";

  const handleSave = async () => {
    if (!form.current_password)                          { onToast("Current password is required.", "error"); return; }
    if (form.new_password.length < 8)                   { onToast("New password must be at least 8 characters.", "error"); return; }
    if (form.new_password !== form.confirm_password)    { onToast("Passwords do not match.", "error"); return; }
    setSaving(true);
    try {
      const res  = await fetch(`${API}/users/${profile.id}/change-password`, {
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

  return (
    <>
      <SettingRow icon={LockKeyhole} title="Current password" description="Required to verify your identity before changing.">
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type={show.current ? "text" : "password"}
            value={form.current_password}
            onChange={e => set("current_password", e.target.value)}
            placeholder="Current password"
            aria-label="Current password"
          />
          <button onClick={() => toggle("current")} style={{ border: "1px solid #e7e0f0", borderRadius: 7, background: "#fff", color: "#7c3aed", fontSize: 10, fontWeight: 800, cursor: "pointer", padding: "0 10px" }}>
            {show.current ? "Hide" : "Show"}
          </button>
        </div>
      </SettingRow>

      <SettingRow icon={KeyRound} title="New password" description="At least 8 characters. Mix letters, numbers and symbols.">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type={show.new ? "text" : "password"}
              value={form.new_password}
              onChange={e => set("new_password", e.target.value)}
              placeholder="New password"
              aria-label="New password"
            />
            <button onClick={() => toggle("new")} style={{ border: "1px solid #e7e0f0", borderRadius: 7, background: "#fff", color: "#7c3aed", fontSize: 10, fontWeight: 800, cursor: "pointer", padding: "0 10px" }}>
              {show.new ? "Hide" : "Show"}
            </button>
          </div>
          {form.new_password.length > 0 && (
            <div style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 24, height: 3, borderRadius: 99, background: i <= str ? strColor : "#e2dbe9", transition: "background 0.2s" }} />
              ))}
              <span style={{ fontSize: 9, color: strColor, fontWeight: 800, marginLeft: 4 }}>{strLabel}</span>
            </div>
          )}
        </div>
      </SettingRow>

      <SettingRow icon={ShieldCheck} title="Confirm new password" description="Re-enter your new password to confirm.">
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type={show.confirm ? "text" : "password"}
              value={form.confirm_password}
              onChange={e => set("confirm_password", e.target.value)}
              placeholder="Confirm password"
              aria-label="Confirm password"
            />
            <button onClick={() => toggle("confirm")} style={{ border: "1px solid #e7e0f0", borderRadius: 7, background: "#fff", color: "#7c3aed", fontSize: 10, fontWeight: 800, cursor: "pointer", padding: "0 10px" }}>
              {show.confirm ? "Hide" : "Show"}
            </button>
          </div>
          {form.confirm_password && form.new_password !== form.confirm_password && (
            <span style={{ fontSize: 9, color: "#ef4444", fontWeight: 700 }}>Passwords do not match</span>
          )}
        </div>
      </SettingRow>

      <SettingRow icon={Smartphone} title="Session timeout" description="Automatically sign out after a period of inactivity.">
        <select defaultValue="8 hours" aria-label="Session timeout">
          <option>30 minutes</option><option>1 hour</option><option>8 hours</option>
        </select>
      </SettingRow>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #f4f1f7" }}>
        <button
          onClick={() => navigate("/forgot-password")}
          style={{ padding: "9px 16px", borderRadius: 9, background: "transparent", color: "#7c3aed", border: "1px solid #e7e0f0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >Forgot password?</button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 9, background: saving ? "#9b8fc5" : "#7c3aed", color: "#fff", border: "none", fontSize: 11, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 6px 16px rgba(124,58,237,0.22)" }}
        >
          <Save size={13} /> {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </>
  );
}

// ─── APPEARANCE SECTION ───────────────────────────────────────────────────────
const ACCENT_COLORS = [
  { label: "Violet", value: "#7c3aed", dark: "#4c1d95" },
  { label: "Indigo", value: "#4f46e5", dark: "#312e81" },
  { label: "Blue",   value: "#2563eb", dark: "#1e3a8a" },
  { label: "Teal",   value: "#0d9488", dark: "#134e4a" },
  { label: "Rose",   value: "#e11d48", dark: "#881337" },
  { label: "Amber",  value: "#d97706", dark: "#78350f" },
];

function AppearanceSection({ onToast }) {
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("path_prefs") || "{}"); } catch { return {}; }
  });
  const save = (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    localStorage.setItem("path_prefs", JSON.stringify(next));
    onToast("Preference saved!", "success");
  };
  const accent   = prefs.accent   || "#7c3aed";
  const density  = prefs.density  || "comfortable";
  const presence = prefs.presence !== undefined ? prefs.presence : true;

  return (
    <>
      <SettingRow icon={Palette} title="Accent color" description="Used across buttons, active states, and highlights.">
        <div style={{ display: "flex", gap: 7 }}>
          {ACCENT_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => save("accent", c.value)}
              title={c.label}
              style={{
                width: 22, height: 22, borderRadius: 7, border: "none", cursor: "pointer",
                background: `linear-gradient(135deg,${c.dark},${c.value})`,
                boxShadow: accent === c.value ? `0 0 0 2px #fff,0 0 0 4px ${c.value}` : "none",
                transform: accent === c.value ? "scale(1.2)" : "scale(1)",
                transition: "all 0.15s",
              }}
            />
          ))}
        </div>
      </SettingRow>
      <SettingRow icon={Monitor} title="Interface density" description="Control how much information appears in lists and tables.">
        <select
          value={density}
          onChange={e => save("density", e.target.value)}
          aria-label="Interface density"
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
          <option value="spacious">Spacious</option>
        </select>
      </SettingRow>
      <SettingRow icon={UserRound} title="Show presence indicators" description="Display when collaborators are active in the workspace.">
        <Toggle checked={presence} onChange={() => save("presence", !presence)} label="Toggle presence indicators" />
      </SettingRow>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("general");
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);
  const [saved,    setSaved]    = useState(false);

  const decoded = getUser();

  useEffect(() => {
    if (!decoded?.id) { navigate("/login"); return; }
    fetch(`${API}/users/${decoded.id}`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => setProfile(data || decoded))
      .catch(() => setProfile(decoded))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
    if (type === "success") { setSaved(true); setTimeout(() => setSaved(false), 1800); }
  };

  const activityItems = [
    { label: "Active session",  value: "Current device",                   icon: Monitor },
    { label: "Last sign-in",    value: "Session active",                   icon: Clock3  },
    { label: "Role",            value: profile?.role?.replace(/_/g," ") || "—", icon: UserRound },
  ];

  return (
    <main className="path-settings-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');
        .path-settings-page{--violet:#7c3aed;--violet-2:#8b5cf6;--violet-soft:#f4efff;--ink:#30283b;--muted:#91889d;--line:#ece7f3;height:calc(100vh - 60px);overflow-y:auto;padding:42px 48px 58px;color:var(--ink);background:#f8f7ff;font-family:"Manrope","DM Sans",Arial,sans-serif;}
        .path-settings-header{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;max-width:1180px;margin:0 auto 28px;}
        .path-settings-kicker{display:flex;align-items:center;gap:8px;margin-bottom:9px;color:var(--violet);font-family:"DM Sans",Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;}
        .path-settings-kicker i{display:block;width:7px;height:7px;border:2px solid #ddd0ff;border-radius:50%;background:var(--violet-2);box-shadow:0 0 0 3px rgba(124,58,237,.08);}
        .path-settings-header h1{margin:0;color:var(--ink);font-family:Georgia,"Times New Roman",serif;font-size:clamp(30px,4vw,46px);font-weight:500;letter-spacing:-.045em;line-height:.98;}
        .path-settings-header p{max-width:510px;margin:12px 0 0;color:var(--muted);font-size:13px;line-height:1.6;}
        .path-settings-save{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 15px;border:1px solid var(--violet);border-radius:10px;background:var(--violet);color:white;cursor:pointer;font-family:"DM Sans",Arial,sans-serif;font-size:11px;font-weight:800;box-shadow:0 8px 18px rgba(124,58,237,.18);transition:transform .16s ease,background .16s ease;}
        .path-settings-save:hover{background:#6d28d9;}
        .path-settings-save:active{transform:scale(.97);}
        .path-settings-save.saved{background:#16835c;border-color:#16835c;}
        .path-settings-layout{display:grid;grid-template-columns:238px minmax(0,1fr);gap:22px;max-width:1180px;margin:0 auto;}
        .path-settings-nav,.path-settings-card{border:1px solid rgba(231,225,241,.9);border-radius:16px;background:rgba(255,255,255,.82);box-shadow:0 12px 30px rgba(59,39,88,.045);}
        .path-settings-nav{align-self:start;padding:10px;}
        .path-settings-nav-label{padding:10px 11px 8px;color:#aaa0b6;font-family:"DM Sans",Arial,sans-serif;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;}
        .path-settings-nav button{display:flex;align-items:center;width:100%;gap:10px;padding:11px;border:0;border-radius:10px;background:transparent;color:#746a80;cursor:pointer;text-align:left;font-family:"DM Sans",Arial,sans-serif;transition:background .18s ease,color .18s ease;}
        .path-settings-nav button:hover{background:#faf7ff;color:var(--violet);}
        .path-settings-nav button.active{background:var(--violet-soft);color:#6d28d9;}
        .path-settings-nav-copy{display:grid;gap:3px;min-width:0;}
        .path-settings-nav-copy strong{font-size:11px;font-weight:800;}
        .path-settings-nav-copy span{color:#aa9fb4;font-size:9px;}
        .path-settings-nav button.active .path-settings-nav-copy span{color:#9b83cf;}
        .path-settings-main{display:grid;gap:16px;min-width:0;}
        .path-settings-card{overflow:hidden;}
        .path-settings-card-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:21px 24px 18px;border-bottom:1px solid #f0ecf5;}
        .path-settings-card-heading h2{margin:0;color:#40364b;font-size:15px;font-weight:850;letter-spacing:-.02em;}
        .path-settings-card-heading p{margin:5px 0 0;color:#a096aa;font-size:11px;line-height:1.5;}
        .path-settings-card-heading>svg{color:#c0b0dc;}
        .path-settings-row{display:grid;grid-template-columns:34px minmax(0,1fr) auto;align-items:center;gap:12px;min-height:76px;padding:13px 24px;border-bottom:1px solid #f4f1f7;}
        .path-settings-row:last-child{border-bottom:0;}
        .path-settings-row-icon{display:grid;width:32px;height:32px;place-items:center;border-radius:9px;background:#f6f1ff;color:var(--violet-2);}
        .path-settings-row-copy{display:grid;gap:4px;min-width:0;}
        .path-settings-row-copy strong{color:#51475d;font-size:11px;font-weight:800;}
        .path-settings-row-copy span{color:#a098a7;font-size:10px;line-height:1.45;}
        .path-settings-row-control{display:flex;align-items:center;justify-content:flex-end;gap:8px;}
        .path-settings-row-control select,.path-settings-row-control input{min-height:34px;padding:0 10px;border:1px solid #e7e0f0;border-radius:8px;outline:0;background:#fff;color:#5f566b;font-family:"DM Sans",Arial,sans-serif;font-size:10px;}
        .path-settings-row-control select:focus,.path-settings-row-control input:focus{border-color:#bba6e8;box-shadow:0 0 0 3px rgba(124,58,237,.08);}
        .path-settings-row-control input[readonly]{background:#f9f8fc;color:#a098a7;cursor:not-allowed;}
        .path-settings-toggle{position:relative;width:36px;height:21px;padding:2px;border:0;border-radius:999px;background:#ddd7e5;cursor:pointer;transition:background .18s ease;}
        .path-settings-toggle span{display:block;width:17px;height:17px;border-radius:50%;background:white;box-shadow:0 2px 5px rgba(46,31,69,.16);transition:transform .18s ease;}
        .path-settings-toggle.is-on{background:var(--violet);}
        .path-settings-toggle.is-on span{transform:translateX(15px);}
        .path-settings-profile{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:14px;padding:22px 24px;background:linear-gradient(125deg,#f6f1ff,#fff 65%);}
        .path-settings-avatar{display:grid;width:48px;height:48px;place-items:center;border:3px solid white;border-radius:15px;background:linear-gradient(135deg,#8b5cf6,#5b21b6);color:white;font-family:Georgia,serif;font-size:18px;box-shadow:0 7px 16px rgba(91,33,182,.18);overflow:hidden;}
        .path-settings-profile-copy{display:grid;gap:4px;}
        .path-settings-profile-copy strong{color:#473c53;font-size:13px;font-weight:850;}
        .path-settings-profile-copy span{color:#988da3;font-size:10px;}
        .path-settings-profile-badge{display:inline-flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid #e8def9;border-radius:999px;background:white;color:#7c3aed;font-family:"DM Sans",Arial,sans-serif;font-size:9px;font-weight:800;white-space:nowrap;}
        .path-settings-profile-badge i{width:5px;height:5px;border-radius:50%;background:#22a36f;display:block;}
        .path-settings-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:16px 24px 22px;}
        .path-settings-metric{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #f0ebf6;border-radius:10px;background:#fff;}
        .path-settings-metric svg{color:#a48bcf;}
        .path-settings-metric span{display:grid;gap:3px;color:#aaa0ae;font-size:9px;}
        .path-settings-metric strong{color:#62576d;font-size:10px;font-weight:850;}
        .path-settings-help{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:15px 18px;border:1px solid #e7dcfa;border-radius:14px;background:#f4efff;color:#7158a0;font-size:10px;font-family:"DM Sans",Arial,sans-serif;}
        .path-settings-help-copy{display:flex;align-items:center;gap:10px;}
        .path-settings-help-copy svg{flex:0 0 auto;color:var(--violet);}
        .path-settings-help strong{display:block;margin-bottom:3px;color:#5d438c;font-size:11px;}
        .path-settings-help span{color:#8c78b1;}
        .path-settings-help button{border:0;background:transparent;color:var(--violet);cursor:pointer;font:inherit;font-weight:850;white-space:nowrap;}
        @keyframes sett-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes sett-pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @media(max-width:820px){.path-settings-page{padding:30px 22px 42px;}.path-settings-header{align-items:flex-start;flex-direction:column;}.path-settings-layout{grid-template-columns:1fr;}.path-settings-nav{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;}.path-settings-nav-label{grid-column:1/-1;}}
        @media(max-width:560px){.path-settings-page{padding:25px 15px 32px;}.path-settings-header h1{font-size:34px;}.path-settings-layout{gap:14px;}.path-settings-nav{grid-template-columns:1fr;}.path-settings-metrics{grid-template-columns:1fr;padding:12px 17px 18px;}.path-settings-help{align-items:flex-start;flex-direction:column;}.path-settings-profile{grid-template-columns:auto minmax(0,1fr);}.path-settings-profile-badge{display:none;}}
      `}</style>

      {/* Header */}
      <header className="path-settings-header">
        <div>
          <div className="path-settings-kicker"><i /> Workspace preferences</div>
          <h1>Settings</h1>
          <p>Shape how PATH keeps your department informed, secure, and ready for every document handoff.</p>
        </div>
        <button type="button" className={`path-settings-save ${saved ? "saved" : ""}`} onClick={() => {}}>
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? "Changes saved" : "Save changes"}
        </button>
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
              <Icon size={16} />
              <span className="path-settings-nav-copy">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              <ChevronRight size={14} style={{ marginLeft: "auto", opacity: .65 }} />
            </button>
          ))}
        </nav>

        {/* Main */}
        <section className="path-settings-main">
          <article className="path-settings-card">
            <div className="path-settings-card-heading">
              <div>
                <h2>{SECTIONS.find(s => s.id === activeSection)?.label}</h2>
                <p>These preferences apply to your PATH workspace.</p>
              </div>
              <SettingsIcon size={18} />
            </div>

            {loading ? (
              <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[70,55,80,60].map((w, i) => (
                  <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 7, background: "#ede9fe", animation: "sett-pulse 1.4s ease-in-out infinite" }} />
                ))}
              </div>
            ) : (
              <>
                {activeSection === "general"       && <GeneralSection       profile={profile} onSaved={setProfile} onToast={showToast} />}
                {activeSection === "notifications"  && <NotificationsSection onToast={showToast} />}
                {activeSection === "security"       && <SecuritySection      profile={profile} onToast={showToast} />}
                {activeSection === "appearance"     && <AppearanceSection    onToast={showToast} />}
              </>
            )}
          </article>

          {/* Account activity */}
          <article className="path-settings-card">
            <div className="path-settings-card-heading">
              <div><h2>Account activity</h2><p>A quiet record of your PATH access and security posture.</p></div>
              <ShieldCheck size={18} />
            </div>
            <div className="path-settings-metrics">
              {activityItems.map(({ label, value, icon: Icon }) => (
                <div className="path-settings-metric" key={label}>
                  <Icon size={15} />
                  <span>{label}<strong>{value}</strong></span>
                </div>
              ))}
            </div>
          </article>

          {/* Help */}
          <div className="path-settings-help">
            <div className="path-settings-help-copy">
              <CircleHelp size={18} />
              <div>
                <strong>Need help with a workspace setting?</strong>
                <span>Your administrator can help with access and policy questions.</span>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/notifications")}>
              View notifications <ChevronRight size={13} style={{ verticalAlign: "-2px" }} />
            </button>
          </div>
        </section>
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
