import { useState } from "react";

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "Information Systems",
    username: "",
    password: "",
    confirm_password: "",
    reason: "",
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "agree") {
      setFormData(p => ({ ...p, agree: checked }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
      if (name === "password") calcStrength(value);
    }
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const calcStrength = (pw) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    setPasswordStrength(s);
  };

  const strengthLabel = ["", "WEAK", "FAIR", "MEDIUM", "STRONG"][passwordStrength] || "";
  const strengthColor = ["", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"][passwordStrength] || "#e5e7eb";
  const strengthWidth = ["0%", "25%", "50%", "75%", "100%"][passwordStrength] || "0%";

  const validate = () => {
    const e = {};
    if (!formData.full_name.trim()) e.full_name = "Full name is required.";
    if (!formData.username.trim()) e.username = "Username is required.";
    else if (!/^[a-z0-9_]+$/.test(formData.username)) e.username = "Lowercase letters, numbers, and underscores only.";
    if (!formData.email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Enter a valid email.";
    if (!formData.department) e.department = "Department is required.";
    if (!formData.password) e.password = "Password is required.";
    else if (formData.password.length < 8) e.password = "Min. 8 characters.";
    if (!formData.confirm_password) e.confirm_password = "Please confirm.";
    else if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords do not match.";
    if (!formData.agree) e.agree = "You must agree to continue.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "Account created! Redirecting to login..." });
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Registration failed." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: #c4c4c4; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        .submit-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; background: #7c3aed; color: white; font-weight: 700; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s; }
        .submit-btn:hover:not(:disabled) { background: #6d28d9; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cancel-btn { padding: 13px 24px; border: 1px solid #e5e7eb; border-radius: 10px; font-size: 13px; color: #6b7280; background: white; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; transition: background 0.15s; font-family: 'DM Sans', sans-serif; }
        .cancel-btn:hover { background: #f9fafb; }
      `}</style>

      {/* ── LEFT HERO PANEL ── */}
      <div style={{ width: "38%", minHeight: "100vh", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 44px", background: "url('/images/office2.png') center/cover no-repeat" }}>
        {/* Overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(230,220,255,0.88)" }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 0 }}>
            <div style={{ width: 30, height: 30, border: "2px solid #7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#7c3aed", letterSpacing: 2 }}>PATH</span>
          </div>
        </div>

        {/* Middle text */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, background: "rgba(139,92,246,0.12)", color: "#7c3aed", padding: "4px 12px", borderRadius: 20, marginBottom: 16 }}>
            Enterprise Access Control
          </span>
          <h2 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.25, color: "#111827", margin: "0 0 16px" }}>
            Empowering Data,{" "}
            <span style={{ color: "#7c3aed" }}>Securing Progress.</span>
          </h2>
          <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, margin: 0 }}>
            Join the next generation of organizational intelligence. Request your workspace access to the Information Systems core.
          </p>
        </div>

        {/* Bottom feature pills */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z"/></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>Security First</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>Encryption and multi-factor authentication at every layer.</p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2"/></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>Smart Routing</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.5 }}>Automated approval workflows designed for efficiency.</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div style={{ width: "62%", background: "#f5f5f5", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", padding: "44px 48px", width: "100%", maxWidth: 600 }}>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Create Your Account</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 28px", lineHeight: 1.6 }}>
            Complete the form below to request access to the workspace.
          </p>

          {/* Alert */}
          {alertMsg && (
            <div style={{ marginBottom: 20, padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "white", background: alertMsg.type === "success" ? "#16a34a" : "#ef4444" }}>
              {alertMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── PERSONAL INFORMATION ── */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#9ca3af", borderBottom: "1px solid #f3f4f6", paddingBottom: 8, marginBottom: 16 }}>
              PERSONAL INFORMATION
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Full Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Full Name *</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2-5 6-5s6 2 6 5"/></svg>
                  <input
                    type="text" name="full_name" value={formData.full_name} onChange={handleChange}
                    placeholder="Juan dela Cruz"
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: `1px solid ${errors.full_name ? "#f87171" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, color: "#111827", transition: "border-color 0.15s" }}
                  />
                </div>
                {errors.full_name && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Email Address *</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z"/></svg>
                  <input
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="j.doe@company.com"
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: `1px solid ${errors.email ? "#f87171" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, color: "#111827", transition: "border-color 0.15s" }}
                  />
                </div>
                {errors.email && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{errors.email}</p>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {/* Phone */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Phone (Optional)</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><path d="M3 2h3l1.5 3.5-1.5 1.5c.9 1.8 2 3 4 4l1.5-1.5L15 11v3a1 1 0 01-1 1C5 14.5 1.5 11 1 4a1 1 0 011-1z"/></svg>
                  <input
                    type="text" name="phone" value={formData.phone} onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111827" }}
                  />
                </div>
              </div>

              {/* Department — locked */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Department</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="1" y="3" width="14" height="11" rx="1"/><path d="M5 3V2a1 1 0 011-1h4a1 1 0 011 1v1"/></svg>
                  <input
                    type="text"
                    value="Information Systems"
                    readOnly
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 80, paddingTop: 9, paddingBottom: 9, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#374151", background: "#f9fafb", cursor: "not-allowed" }}
                  />
                  <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 4, background: "#f3f4f6", borderRadius: 4, padding: "2px 6px" }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.5" width="10" height="10"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                    <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}>Locked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ACCESS CREDENTIALS ── */}
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#9ca3af", borderBottom: "1px solid #f3f4f6", paddingBottom: 8, marginBottom: 16 }}>
              ACCESS CREDENTIALS
            </div>

            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Username *</label>
              <div style={{ position: "relative" }}>
                <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2-5 6-5s6 2 6 5" strokeLinecap="round"/></svg>
                <input
                  type="text" name="username" value={formData.username} onChange={handleChange}
                  placeholder="e.g. jdelacruz"
                  style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: `1px solid ${errors.username ? "#f87171" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, color: "#111827", transition: "border-color 0.15s" }}
                />
              </div>
              {errors.username
                ? <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{errors.username}</p>
                : <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>This will be your login identifier. Lowercase letters and numbers only.</p>
              }
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
              {/* Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Password *</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                  <input
                    type="password" name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••"
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: `1px solid ${errors.password ? "#f87171" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, color: "#111827" }}
                  />
                </div>
                {errors.password && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Confirm Password *</label>
                <div style={{ position: "relative" }}>
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="3" y="7" width="10" height="8" rx="1"/><path d="M5 7V5a3 3 0 016 0v2"/></svg>
                  <input
                    type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange}
                    placeholder="••••••••"
                    style={{ width: "100%", paddingLeft: 30, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: `1px solid ${errors.confirm_password ? "#f87171" : "#e5e7eb"}`, borderRadius: 7, fontSize: 13, color: "#111827" }}
                  />
                </div>
                {errors.confirm_password
                  ? <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{errors.confirm_password}</p>
                  : <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Passwords must match exactly.</p>
                }
              </div>
            </div>

            {/* Password Strength Bar */}
            {formData.password && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: "#9ca3af" }}>SECURITY STRENGTH</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: strengthColor }}>{strengthLabel}</span>
                </div>
                <div style={{ height: 3, background: "#f3f4f6", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: strengthWidth, background: strengthColor, borderRadius: 2, transition: "width 0.3s, background 0.3s" }} />
                </div>
              </div>
            )}

            {/* ── Reason for Access ── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                Reason for Access Request *
              </label>
              <textarea
                name="reason" value={formData.reason} onChange={handleChange} rows={3}
                placeholder="Briefly describe your responsibilities and why access is required for your role..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#111827", resize: "vertical", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
              />
            </div>

            {/* ── reCAPTCHA placeholder ── */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, background: "#fafafa" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500 }}>
                <div style={{ width: 20, height: 20, border: "2px solid #d1d5db", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} />
                I'm not a robot
              </label>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, marginBottom: 2 }}>🔲</div>
                <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.5 }}>RECAPTCHA</div>
              </div>
            </div>

            {/* ── Important Note ── */}
            <div style={{ background: "#faf5ff", border: "1px solid #ede9fe", borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", gap: 10 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v1" strokeLinecap="round"/></svg>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: "0 0 3px" }}>Important Submission Note</p>
                <p style={{ fontSize: 11, color: "#6b7280", margin: 0, lineHeight: 1.6 }}>
                  All account requests are subject to manual review by the{" "}
                  <span style={{ color: "#7c3aed", fontWeight: 600 }}>Information Systems Administrator</span>.
                  {" "}Approval typically takes 24-48 business hours. You will receive an automated onboarding guide once confirmed.
                </p>
              </div>
            </div>

            {/* ── Agreement ── */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox" name="agree" checked={formData.agree} onChange={handleChange}
                  style={{ marginTop: 2, width: 14, height: 14, accentColor: "#7c3aed", flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
                  I agree to the Data Security Policy and Professional Conduct guidelines.
                </span>
              </label>
              {errors.agree && <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0 24px" }}>{errors.agree}</p>}
            </div>

            {/* ── Actions ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button type="submit" disabled={loading} className="submit-btn" style={{ flex: 1 }}>
                {loading ? "Registering..." : (
                  <>
                    Submit Access Request
                    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" width="14" height="14"><path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </>
                )}
              </button>
              <a href="/login" className="cancel-btn">Cancel</a>
            </div>
          </form>

          {/* ── Bottom Links ── */}
          <div style={{ textAlign: "center", fontSize: 13, color: "#6b7280", lineHeight: 2 }}>
            Already have an account?{" "}
            <a href="/login" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "none" }}>Sign in</a>
            <br />
            <a href="/forgot-password" style={{ color: "#7c3aed", fontWeight: 700, textDecoration: "underline", fontSize: 13 }}>Forgot your password?</a>
          </div>

          {/* ── Footer bar ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 28, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#22c55e", fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              SYSTEMS ONLINE
            </span>
            <span style={{ fontSize: 10, color: "#d1d5db" }}>|</span>
            <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>V 2.8.4-STABLE</span>
            <span style={{ fontSize: 10, color: "#d1d5db" }}>|</span>
            <a href="#" style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textDecoration: "none" }}>PRIVACY POLICY</a>
            <a href="#" style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textDecoration: "none" }}>TERMS OF USE</a>
            <a href="#" style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textDecoration: "none" }}>HELP DESK</a>
          </div>

        </div>
      </div>
    </div>
  );
}
