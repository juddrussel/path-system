import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Check, ChevronRight, CircleHelp, Clock3,
  FileText, KeyRound, LockKeyhole, Mail,
  Save, Settings as SettingsIcon, ShieldCheck,
  Smartphone, UserRound, Camera, Shield, Info, Calendar,
  Plus, Trash2, CheckCircle,
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
  {
    id: "academic",
    label: "Academic Calendar",
    description: "Semestral periods",
    icon: Calendar,
    adminOnly: true,
  },
  {
    id: "archive",
    label: "Archived Tasks",
    description: "Completed & archived",
    icon: Shield,
    adminOnly: true,
  },
];

// ─── Image Crop Modal ─────────────────────────────────────────────────────────
const CROP_SIZE  = 260;
const OUTPUT_SIZE = 480;
const MAX_ZOOM   = 4;

function ImageCropModal({ src, onCancel, onConfirm }) {
  const [naturalSize, setNaturalSize] = useState(null);
  const [baseScale, setBaseScale]     = useState(1);
  const [zoom, setZoom]               = useState(1);
  const [offset, setOffset]           = useState({ x: 0, y: 0 });
  const [exporting, setExporting]     = useState(false);
  const imgRef      = useRef(null);
  const draggingRef = useRef(false);
  const lastPt      = useRef({ x: 0, y: 0 });

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const cover = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setBaseScale(cover); setZoom(1); setOffset({ x: 0, y: 0 });
  };

  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  const clampOffset = useCallback((o, w = dispW, h = dispH) => {
    const mx = Math.max(0, (w - CROP_SIZE) / 2);
    const my = Math.max(0, (h - CROP_SIZE) / 2);
    return { x: Math.min(mx, Math.max(-mx, o.x)), y: Math.min(my, Math.max(-my, o.y)) };
  }, [dispW, dispH]);

  useEffect(() => { setOffset(o => clampOffset(o)); }, [zoom, naturalSize]); // eslint-disable-line

  const onPointerDown = (e) => { draggingRef.current = true; lastPt.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onPointerMove = (e) => { if (!draggingRef.current) return; const dx = e.clientX - lastPt.current.x, dy = e.clientY - lastPt.current.y; lastPt.current = { x: e.clientX, y: e.clientY }; setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy })); };
  const onPointerUp   = () => { draggingRef.current = false; };
  const onWheel       = (e) => { e.preventDefault(); setZoom(z => Math.min(MAX_ZOOM, Math.max(1, +(z + (e.deltaY > 0 ? -0.1 : 0.1)).toFixed(2)))); };

  const handleConfirm = () => {
    if (!imgRef.current || !naturalSize) return;
    setExporting(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE; canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    const sW = CROP_SIZE / scale, sH = CROP_SIZE / scale;
    const sx = (dispW / 2 - CROP_SIZE / 2 - offset.x) / scale;
    const sy = (dispH / 2 - CROP_SIZE / 2 - offset.y) / scale;
    ctx.drawImage(imgRef.current, sx, sy, sW, sH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => { setExporting(false); if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: 360, background: "#fff", borderRadius: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 6px" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1f1533" }}>Adjust your photo</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9080a0" }}>Drag to move, use the slider (or scroll) to zoom</p>
        </div>
        {/* Crop circle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <div
            style={{ width: CROP_SIZE, height: CROP_SIZE, borderRadius: "50%", border: "2px solid #ddd6fe", overflow: "hidden", background: "#f3f4f6", cursor: "grab", touchAction: "none", position: "relative", userSelect: "none" }}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} onWheel={onWheel}
          >
            <img
              ref={imgRef} src={src} alt="Crop preview" onLoad={handleImgLoad} draggable={false}
              style={{ position: "absolute", top: "50%", left: "50%", width: naturalSize ? naturalSize.w * scale : "auto", height: naturalSize ? naturalSize.h * scale : "auto", maxWidth: "none", maxHeight: "none", transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`, pointerEvents: "none" }}
            />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)", pointerEvents: "none" }} />
          </div>
        </div>
        {/* Zoom slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 24px 8px" }}>
          <span style={{ color: "#9ca3af", fontSize: 14 }}>−</span>
          <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "#7c3aed" }} />
          <span style={{ color: "#9ca3af", fontSize: 14 }}>+</span>
        </div>
        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "12px 20px 18px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#4b5563", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!naturalSize || exporting} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", opacity: (!naturalSize || exporting) ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            ✓ {exporting ? "Applying…" : "Use Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      className={`path-settings-toggle ${checked ? "is-on" : ""}`}
      onClick={disabled ? undefined : onChange}
      aria-pressed={checked}
      aria-label={label}
      style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
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
  const [cropSrc, setCropSrc]             = useState(null);
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
    // Open crop modal instead of previewing immediately
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropConfirm = (blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(blob));
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
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
      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </>
  );
}

// ─── NOTIFICATION SETTINGS ────────────────────────────────────────────────────
function NotificationsSection({ profile, onToast }) {
  const DEFAULT_PREFS = { email: true, inapp: true, approval: true, docUpdates: true };
  const [prefs, setPrefs]     = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null); // key being saved

  // Load from API on mount
  useEffect(() => {
    if (!profile?.id) return;
    fetch(`${API}/users/${profile.id}/preferences`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPrefs({ ...DEFAULT_PREFS, ...data }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const save = async (key, val) => {
    const next = { ...prefs, [key]: val };
    setPrefs(next); // optimistic
    setSaving(key);
    try {
      const res = await fetch(`${API}/users/${profile.id}/preferences`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });
      if (!res.ok) throw new Error("Failed to save.");
      onToast("Preference saved!", "success");
    } catch {
      setPrefs(prefs); // revert on error
      onToast("Failed to save preference.", "error");
    } finally {
      setSaving(null);
    }
  };

  const get = (key) => prefs[key] !== undefined ? prefs[key] : DEFAULT_PREFS[key];

  if (loading) {
    return (
      <div style={{ padding: "32px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        {[60, 80, 55, 75].map((w, i) => (
          <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 7, background: "#ede9fe", animation: "sett-pulse 1.4s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <>
      <SectionHeading title="Email Notifications" subtitle="Control which updates are sent to your email address." />
      <SettingRow icon={Mail} title="Enable email notifications" description="Receive PATH workflow updates via email.">
        <Toggle
          checked={get("email")}
          onChange={() => save("email", !get("email"))}
          label="Toggle email notifications"
          disabled={saving === "email"}
        />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="In-App Notifications" subtitle="Control the real-time popup toast. Notifications always remain visible in your bell panel and Notifications page." />
      </div>
      <SettingRow icon={Bell} title="Enable in-app notifications" description="Show real-time popup alerts within PATH. Notifications still appear in your bell panel and Notifications page.">
        <Toggle
          checked={get("inapp")}
          onChange={() => save("inapp", !get("inapp"))}
          label="Toggle in-app notifications"
          disabled={saving === "inapp"}
        />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Approval Status Alerts" subtitle="Get notified when a document or form is approved, rejected, or returned." />
      </div>
      <SettingRow icon={FileText} title="Approval status alerts" description="Notify me when my submissions change status.">
        <Toggle
          checked={get("approval")}
          onChange={() => save("approval", !get("approval"))}
          label="Toggle approval status alerts"
          disabled={saving === "approval"}
        />
      </SettingRow>

      <div style={{ borderTop: "2px solid #f4f1f7" }}>
        <SectionHeading title="Document Update Alerts" subtitle="Get notified when documents you are involved in are updated." />
      </div>
      <SettingRow icon={FileText} title="Document update alerts" description="Notify me when tracked documents are modified." noBorder>
        <Toggle
          checked={get("docUpdates")}
          onChange={() => save("docUpdates", !get("docUpdates"))}
          label="Toggle document update alerts"
          disabled={saving === "docUpdates"}
        />
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

// ─── ACADEMIC CALENDAR SECTION ───────────────────────────────────────────────
function AcademicSection({ onToast }) {
  const [periods, setPeriods]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null); // period being edited
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const EMPTY = { name: "", semester: "1st Semester", academic_year: "", start_date: "", end_date: "", is_active: false };
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const load = async () => {
    try {
      const res = await fetch(`${API}/academic`, { headers: authHeaders() });
      if (res.ok) setPeriods(await res.json());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({
      name: p.name, semester: p.semester, academic_year: p.academic_year,
      start_date: p.start_date?.slice(0,10) || "",
      end_date:   p.end_date?.slice(0,10)   || "",
      is_active: !!p.is_active,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.academic_year.trim() || !form.start_date || !form.end_date) {
      onToast("Please fill in all required fields.", "error"); return;
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      onToast("End date must be after start date.", "error"); return;
    }
    setSaving(true);
    try {
      const url    = editing ? `${API}/academic/${editing}` : `${API}/academic`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Save failed."); }
      onToast(editing ? "Period updated!" : "Period added!", "success");
      setShowForm(false); setEditing(null);
      await load();
    } catch (e) { onToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const res = await fetch(`${API}/academic/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Delete failed.");
      onToast("Period deleted.", "success");
      await load();
    } catch (e) { onToast(e.message, "error"); }
    finally { setDeleting(null); }
  };

  const handleSetActive = async (id) => {
    try {
      await fetch(`${API}/academic/${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
      onToast("Active period updated!", "success");
      await load();
    } catch { onToast("Failed to update.", "error"); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <>
      <SectionHeading title="Academic Calendar" subtitle="Define semestral periods to scope reports and document workflows." />

      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 22px 0" }}>
        <button
          onClick={showForm && !editing ? () => setShowForm(false) : openAdd}
          className="path-settings-btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px" }}
        >
          {showForm && !editing
            ? "Cancel"
            : <><Plus size={14} /> Add period</>}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div style={{ margin: "14px 22px", padding: "18px 20px", background: "#faf8ff", border: "1px solid #ede9fe", borderRadius: 12 }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: "#3b2a52", fontFamily: "Manrope,'DM Sans',sans-serif" }}>
            {editing ? "Edit period" : "New academic period"}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="as-label" style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b5f76", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Period name <span style={{color:"#dc2626"}}>*</span>
              </label>
              <input className="path-settings-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. First Semester 2026" />
            </div>
            <div>
              <label className="as-label" style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b5f76", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Semester <span style={{color:"#dc2626"}}>*</span>
              </label>
              <select className="path-settings-input" value={form.semester} onChange={e => set("semester", e.target.value)}>
                <option>1st Semester</option>
                <option>2nd Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <div>
              <label className="as-label" style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b5f76", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                Academic year <span style={{color:"#dc2626"}}>*</span>
              </label>
              <input className="path-settings-input" value={form.academic_year} onChange={e => set("academic_year", e.target.value)} placeholder="e.g. 2026-2027" />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}>
                <label className="as-label" style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b5f76", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  Start date <span style={{color:"#dc2626"}}>*</span>
                </label>
                <input className="path-settings-input" type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} style={{ colorScheme:"light" }} />
              </div>
              <div style={{ flex:1 }}>
                <label className="as-label" style={{ display:"block", fontSize:11, fontWeight:700, color:"#6b5f76", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  End date <span style={{color:"#dc2626"}}>*</span>
                </label>
                <input className="path-settings-input" type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} style={{ colorScheme:"light" }} />
              </div>
            </div>
          </div>
          {/* Set as active toggle */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14 }}>
            <button
              type="button"
              className={`path-settings-toggle ${form.is_active ? "is-on" : ""}`}
              onClick={() => set("is_active", !form.is_active)}
              aria-pressed={form.is_active}
              aria-label="Set as active period"
            ><span /></button>
            <span style={{ fontSize:12, color:"#6b5f76", fontWeight:600 }}>Set as active period</span>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button onClick={handleSave} disabled={saving} className="path-settings-btn-primary" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 20px" }}>
              <Save size={13} /> {saving ? "Saving…" : editing ? "Update" : "Save period"}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="path-settings-btn-ghost" style={{ padding:"8px 16px" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Periods list */}
      {loading ? (
        <div style={{ padding:"24px 22px", display:"flex", flexDirection:"column", gap:10 }}>
          {[80,65,75].map((w,i) => <div key={i} style={{ height:12, width:`${w}%`, borderRadius:7, background:"#ede9fe", animation:"sett-pulse 1.4s ease-in-out infinite" }} />)}
        </div>
      ) : periods.length === 0 ? (
        <div style={{ padding:"32px 22px", textAlign:"center", color:"#b0a3ba", fontSize:13 }}>
          No academic periods configured yet. Click <strong>Add period</strong> to get started.
        </div>
      ) : (
        <div style={{ padding:"12px 22px 20px", display:"flex", flexDirection:"column", gap:10 }}>
          {periods.map(p => (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, border:`1.5px solid ${p.is_active ? "#a78bfa" : "#ede9fe"}`, background: p.is_active ? "#faf8ff" : "#fff", transition:"all 0.15s" }}>
              {/* Active indicator */}
              <div style={{ width:10, height:10, borderRadius:"50%", flexShrink:0, background: p.is_active ? "#7c3aed" : "#e2dbe9", boxShadow: p.is_active ? "0 0 0 3px rgba(124,58,237,0.2)" : "none" }} />
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ fontSize:13, fontWeight:800, color:"#27213a" }}>{p.name}</span>
                  <span style={{ fontSize:10, fontWeight:700, color: p.is_active ? "#7c3aed" : "#9080a0", background: p.is_active ? "#ede9fe" : "#f4f0fc", borderRadius:99, padding:"2px 8px", border:`1px solid ${p.is_active ? "#c4b5fd" : "#e8e1f5"}` }}>
                    {p.semester}
                  </span>
                  <span style={{ fontSize:10, color:"#b0a3ba" }}>{p.academic_year}</span>
                  {p.is_active && (
                    <span style={{ fontSize:10, fontWeight:800, color:"#059669", background:"#f0fdf4", borderRadius:99, padding:"2px 8px", border:"1px solid #bbf7d0" }}>
                      Active
                    </span>
                  )}
                </div>
                <p style={{ margin:"3px 0 0", fontSize:11, color:"#9080a0" }}>
                  {fmtDate(p.start_date)} — {fmtDate(p.end_date)}
                </p>
              </div>
              {/* Actions */}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                {!p.is_active && (
                  <button
                    onClick={() => handleSetActive(p.id)}
                    title="Set as active"
                    style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"5px 10px", borderRadius:7, border:"1px solid #c4b5fd", background:"#f5f3ff", color:"#7c3aed", fontSize:11, fontWeight:700, cursor:"pointer" }}
                  >
                    <CheckCircle size={12} /> Set active
                  </button>
                )}
                <button
                  onClick={() => openEdit(p)}
                  style={{ padding:"5px 10px", borderRadius:7, border:"1px solid #e8e1f5", background:"#fff", color:"#6b5f76", fontSize:11, fontWeight:700, cursor:"pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  title="Delete"
                  style={{ display:"inline-flex", alignItems:"center", padding:"5px 8px", borderRadius:7, border:"1px solid #fecdd3", background:"#fff1f2", color:"#dc2626", cursor:"pointer", opacity: deleting === p.id ? 0.5 : 1 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─── ARCHIVE SECTION ─────────────────────────────────────────────────────────
function ArchiveSection({ onToast }) {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [restoring, setRestoring] = useState(null);
  const [search, setSearch]     = useState("");

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tasks`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        const all = data.tasks ?? data ?? [];
        setTasks(all.filter(t => /archived/i.test(t.status || "")));
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRestore = async (id) => {
    setRestoring(id);
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Pending" }),
      });
      if (!res.ok) throw new Error("Restore failed.");
      onToast("Task restored to Pending.", "success");
      await load();
    } catch (e) { onToast(e.message || "Failed.", "error"); }
    finally { setRestoring(null); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const filtered = tasks.filter(t =>
    !search.trim() ||
    `${t.title} ${t.tracking_id} ${t.faculty_name || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <SectionHeading title="Archived Tasks" subtitle="Tasks that have been archived after completion or review." />

      {/* Search */}
      <div style={{ padding: "12px 22px 0" }}>
        <input
          className="path-settings-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, tracking ID, or faculty…"
        />
      </div>

      {loading ? (
        <div style={{ padding: "24px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[80, 65, 75].map((w, i) => (
            <div key={i} style={{ height: 12, width: `${w}%`, borderRadius: 7, background: "#ede9fe", animation: "sett-pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "32px 22px", textAlign: "center", color: "#b0a3ba", fontSize: 13 }}>
          {tasks.length === 0 ? "No archived tasks yet." : "No tasks match your search."}
        </div>
      ) : (
        <div style={{ padding: "12px 22px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "1px solid #ede9fe", background: "#faf8ff" }}>
              {/* Icon */}
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "#f0e9fc", color: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15">
                  <rect x="2" y="2" width="12" height="12" rx="2"/>
                  <path d="M5 8.3l2 2 4-4.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#27213a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.title || "Untitled task"}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#9080a0" }}>
                  {t.tracking_id} · {t.faculty_name || "—"} · Archived {fmtDate(t.updated_at)}
                </p>
              </div>
              {/* Status badge */}
              <span style={{ fontSize: 10, fontWeight: 800, color: "#6b7280", background: "#f4f0fc", border: "1px solid #e8e1f5", borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>
                Archived
              </span>
              {/* Restore button */}
              <button
                onClick={() => handleRestore(t.id)}
                disabled={restoring === t.id}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #c4b5fd", background: "#f5f3ff", color: "#7c3aed", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0, opacity: restoring === t.id ? 0.5 : 1, fontFamily: "'DM Sans',sans-serif" }}
              >
                {restoring === t.id ? "Restoring…" : "Restore"}
              </button>
            </div>
          ))}
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b0a3ba", textAlign: "right" }}>
            {filtered.length} archived task{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
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
        .path-settings-input{width:100%;padding:9px 12px;border:1.5px solid #e8e1f5;border-radius:9px;font-size:13px;font-family:"DM Sans",Arial,sans-serif;color:#27213a;outline:none;background:#fff;box-sizing:border-box;transition:border-color .15s,box-shadow .15s;}
        .path-settings-input:focus{border-color:#a78bfa;box-shadow:0 0 0 3px rgba(124,58,237,.12);}
        select.path-settings-input{cursor:pointer;}
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
          {SECTIONS.filter(s => !s.adminOnly || ["admin","program_chair"].includes(decoded?.role)).map(({ id, label, description, icon: Icon }) => (
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
              {activeSection === "notifications"  && <NotificationsSection profile={profile} onToast={showToast} />}
              {activeSection === "privacy"        && <PrivacySection       profile={profile} />}
              {activeSection === "academic"       && <AcademicSection      onToast={showToast} />}
              {activeSection === "archive"        && <ArchiveSection       onToast={showToast} />}
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
