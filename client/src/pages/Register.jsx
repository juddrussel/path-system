import React, { useState, useEffect, useRef } from "react";
import logowhite from "../assets/logowhite.png";

// Replace with your own site key (get one at https://www.google.com/recaptcha/admin).
// The key below is Google's shared TEST key — it always passes and works on any domain,
// but should NEVER be used in production.
const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const RECAPTCHA_THEME = "light"; // "light" | "dark"
const RECAPTCHA_BASE_WIDTH = 304; // Google's fixed widget width at size="normal"
const RECAPTCHA_BASE_HEIGHT = 78; // Google's fixed widget height at size="normal"
const RECAPTCHA_MAX_SCALE = 0.85; // caps how large the widget can scale up

const colors = {
  ink: "#1e1826",
  muted: "#8f8397",
  faint: "#b7aec2",
  violet: "#7c3aed",
  line: "#e5e0ea",
  bg: "#fbfaff",
};

const s = {
  page: {
    display: "grid",
    gridTemplateColumns: "minmax(360px, 54%) 1fr",
    height: "100vh",
    overflow: "hidden",
    background: colors.bg,
    color: colors.ink,
    fontFamily: '"DM Sans", Arial, sans-serif',
  },
  main: {
    display: "flex",
    minWidth: 0,
    height: "100%",
    justifyContent: "center",
    overflowY: "auto",
    padding: "48px 64px 56px",
  },
  wrap: { width: "min(100%, 620px)" },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: colors.muted,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  dot: { width: 5, height: 5, borderRadius: "50%", background: colors.violet },
  title: {
    margin: "12px 0 8px",
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: "-.05em",
    lineHeight: 1.05,
  },
  subtitle: {
    maxWidth: 480,
    margin: "0 0 30px",
    color: colors.muted,
    fontSize: 12,
    lineHeight: 1.6,
  },
  section: { marginBottom: 22 },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 18,
    padding: "0 5px",
    borderRadius: 5,
    background: "#ede7fb",
    color: colors.violet,
    fontSize: 9,
    fontWeight: 800,
  },
  sectionLabelText: {
    color: "#4a3b57",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: ".1em",
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
  },
  full: { gridColumn: "1 / -1" },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    color: "#3d3247",
    fontSize: 10,
    fontWeight: 800,
    marginBottom: 14,
  },
  inputShell: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    border: `1px solid ${colors.line}`,
    borderRadius: 9,
    padding: "0 12px",
    background: "#fff",
    color: colors.faint,
  },
  inputShellError: { borderColor: "#f1a8a8" },
  inputShellLocked: { borderColor: "#ded0f2", background: "#f7f4fc" },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: colors.ink,
    font: '500 12px "DM Sans", Arial, sans-serif',
  },
  icon: {
    width: 15,
    height: 15,
    flex: "0 0 auto",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  lockRight: { marginLeft: "auto", color: colors.violet, flex: "0 0 auto" },
  passwordButton: {
    display: "grid",
    flex: "0 0 auto",
    width: 22,
    height: 22,
    marginLeft: "auto",
    placeItems: "center",
    border: 0,
    background: "transparent",
    color: colors.violet,
    cursor: "pointer",
  },
  fieldError: { margin: "6px 0 0", color: "#d34848", fontSize: 10, fontWeight: 600 },
  fieldHint: { margin: "6px 0 0", color: colors.muted, fontSize: 10, lineHeight: 1.4 },
  strengthWrap: { margin: "-4px 0 18px" },
  strengthRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  strengthLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".08em",
    color: colors.faint,
    textTransform: "uppercase",
  },
  strengthValue: { fontSize: 9, fontWeight: 800 },
  strengthTrack: { height: 4, background: "#f0ecf5", borderRadius: 99 },
  strengthFill: { height: "100%", borderRadius: 99, transition: "width .3s, background .3s" },
  reqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "6px 14px",
    marginTop: 10,
  },
  reqItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 10, transition: "color .2s" },
  reqDot: {
    display: "inline-flex",
    width: 14,
    height: 14,
    borderRadius: "50%",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  captchaBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    border: `1px solid ${colors.line}`,
    borderRadius: 9,
    padding: "10px 14px",
    background: "#fff",
  },
  captchaLeft: { display: "flex", alignItems: "center", gap: 12, minWidth: 0 },
  captchaText: { fontSize: 11, fontWeight: 800, color: "#3d3247" },
  captchaSub: { display: "block", marginTop: 2, fontSize: 9, color: colors.faint, fontWeight: 600 },
  captchaTag: {
    flex: "0 0 auto",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: ".08em",
    color: colors.faint,
    textAlign: "right",
    textTransform: "uppercase",
    lineHeight: 1.4,
  },
  agreeRow: { display: "flex", alignItems: "flex-start", gap: 9, marginTop: 14, cursor: "pointer" },
  agreeCheckbox: { marginTop: 2, width: 14, height: 14, accentColor: colors.violet, flexShrink: 0 },
  agreeText: { fontSize: 11, color: "#4a3f52", lineHeight: 1.55 },
  important: {
    marginTop: 16,
    border: "1px solid #e6d9f5",
    borderRadius: 10,
    padding: "13px 14px",
    background: "#f8f4fd",
  },
  importantTitle: {
    display: "block",
    marginBottom: 6,
    color: "#3f2d55",
    fontSize: 10,
    fontWeight: 800,
  },
  importantText: { margin: 0, color: colors.muted, fontSize: 9, lineHeight: 1.55 },
  actions: { display: "flex", alignItems: "center", gap: 12, marginTop: 22 },
  submit: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    border: 0,
    borderRadius: 9,
    background: "linear-gradient(135deg, #7c3aed, #8439f0)",
    color: "#fff",
    font: '800 11px "DM Sans", Arial, sans-serif',
    cursor: "pointer",
  },
  submitDisabled: { opacity: 0.65, cursor: "not-allowed" },
  cancel: {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    padding: "0 22px",
    border: `1px solid ${colors.line}`,
    borderRadius: 9,
    background: "#fff",
    color: "#6d5a78",
    font: '800 11px "DM Sans", Arial, sans-serif',
    textDecoration: "none",
    cursor: "pointer",
  },
  alert: {
    marginBottom: 18,
    border: "1px solid #e7d7f2",
    borderRadius: 9,
    padding: "10px 14px",
    background: "#fbf7ff",
    color: "#6d4b8a",
    fontSize: 11,
    fontWeight: 600,
    lineHeight: 1.45,
  },
  alertSuccess: { border: "1px solid #bfe3c8", background: "#f2fbf4", color: "#2c7a43" },
  alertError: { border: "1px solid #f1c3c3", background: "#fdf4f4", color: "#c23f3f" },
  bottomLinks: {
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
    lineHeight: 2,
    marginTop: 26,
  },
  bottomLink: { color: colors.violet, fontWeight: 800, textDecoration: "none" },
  footerBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 24,
    paddingTop: 16,
    borderTop: `1px solid ${colors.line}`,
  },
  footerStatus: { display: "flex", alignItems: "center", gap: 5, fontSize: 9, color: "#22c55e", fontWeight: 800 },
  footerDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e" },
  footerDivider: { fontSize: 9, color: "#dcd5e2" },
  footerMuted: { fontSize: 9, color: colors.faint, fontWeight: 700 },
  footerLink: { fontSize: 9, color: colors.faint, fontWeight: 700, textDecoration: "none" },

  // ── hero (right) ──
  aside: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    padding: "38px 44px",
    background: "linear-gradient(160deg, #3a1f52 0%, #6a35b0 55%, #8b3ff5 100%)",
    color: "#fff",
  },
  orb: {
    position: "absolute",
    width: 460,
    height: 460,
    right: -210,
    top: -120,
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: "50%",
  },
  brand: { position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 10 },
  mark: {
    display: "grid",
    width: 34,
    height: 34,
    placeItems: "center",
  },
  markImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  markSvg: {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  brandName: { fontSize: 15, fontWeight: 800, letterSpacing: ".14em" },
  brandSub: {
    display: "block",
    marginTop: 2,
    color: "rgba(255,255,255,.6)",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase",
  },
  heroKicker: {
    position: "relative",
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,.72)",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  heroDot: { width: 5, height: 5, borderRadius: "50%", background: "#c9b6fa" },
  heroTitle: {
    position: "relative",
    zIndex: 1,
    margin: "16px 0 14px",
    maxWidth: 420,
    fontSize: "clamp(34px, 3.6vw, 46px)",
    fontWeight: 800,
    letterSpacing: "-.04em",
    lineHeight: 1.08,
  },
  heroText: {
    position: "relative",
    zIndex: 1,
    maxWidth: 400,
    margin: 0,
    color: "rgba(255,255,255,.76)",
    fontSize: 13,
    lineHeight: 1.65,
  },
  features: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 16 },
  feature: { display: "flex", alignItems: "flex-start", gap: 12 },
  featureBadge: {
    display: "grid",
    flex: "0 0 auto",
    width: 24,
    height: 24,
    placeItems: "center",
    borderRadius: 7,
    background: "rgba(255,255,255,.14)",
    color: "#fff",
    fontSize: 9,
    fontWeight: 800,
  },
  featureTitle: { display: "block", color: "#fff", fontSize: 12, fontWeight: 800 },
  featureText: { display: "block", marginTop: 2, color: "rgba(255,255,255,.68)", fontSize: 10.5, lineHeight: 1.5 },
};

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={s.icon} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" style={s.icon} aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M17 6l3 3M14 9l2 2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" style={s.icon} aria-hidden="true">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
    </svg>
  );
}

function Eye({ hidden = false }) {
  return (
    <svg viewBox="0 0 24 24" style={s.icon} aria-hidden="true">
      {hidden ? (
        <path d="m4 4 16 16M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A11.7 11.7 0 0 1 12 5c5.2 0 8.6 4.9 9.5 7a16 16 0 0 1-2.1 3.2M6.1 6.1A16 16 0 0 0 2.5 12c.9 2.1 4.3 7 9.5 7 1 0 2-.2 2.9-.5" />
      ) : (
        <>
          <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

function CheckDot({ met }) {
  return (
    <span style={{ ...s.reqDot, border: `1.5px solid ${met ? "#22c55e" : "#ded6e5"}` }}>
      {met && (
        <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2.5 2.5L10 3" />
        </svg>
      )}
    </span>
  );
}

function Badge({ n }) {
  return <span style={s.badge}>{n}</span>;
}

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "Information Systems",
    username: "",
    password: "",
    confirm_password: "",
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaScale, setCaptchaScale] = useState(1);
  const captchaWrapperRef = useRef(null);
  const captchaRef = useRef(null);
  const widgetIdRef = useRef(null);

  // Load the Google reCAPTCHA script once, then render the real widget into captchaRef.
  useEffect(() => {
    let cancelled = false;

    // grecaptcha.render() can exist on window.grecaptcha before the library has
    // actually finished initializing — calling it too early sometimes fails
    // silently (no error, no widget). grecaptcha.ready() is Google's documented
    // way to guarantee the library is truly ready before you render into a node.
    const renderWidget = () => {
      if (cancelled) return;
      if (!captchaRef.current) return; // node not mounted yet — retry shortly
      if (widgetIdRef.current !== null) return; // already rendered

      window.grecaptcha.ready(() => {
        if (cancelled || widgetIdRef.current !== null || !captchaRef.current) return;
        widgetIdRef.current = window.grecaptcha.render(captchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: RECAPTCHA_THEME,
          callback: (token) => {
            setCaptchaToken(token);
            setErrors((p) => ({ ...p, captcha: "" }));
          },
          "expired-callback": () => setCaptchaToken(null),
          "error-callback": () => setCaptchaToken(null),
        });
      });
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
    } else {
      const existingScript = document.getElementById("recaptcha-script");
      if (existingScript) {
        existingScript.addEventListener("load", renderWidget);
      } else {
        const script = document.createElement("script");
        script.id = "recaptcha-script";
        script.src = "https://www.google.com/recaptcha/api.js";
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.body.appendChild(script);
      }
    }

    // Safety net: if for any reason the widget still hasn't rendered after a
    // beat (e.g. StrictMode's double-invoke swallowed the first onload), try
    // once more. This is a no-op once widgetIdRef.current is set.
    const retryTimer = setTimeout(renderWidget, 800);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  // reCAPTCHA's iframe has a fixed pixel width (304px at size="normal") and can't
  // be restyled directly since it's Google's cross-origin content. To make it
  // "fill" the form the way the other inputs do, we scale the whole widget with
  // a CSS transform based on the wrapper's actual rendered width.
  useEffect(() => {
    const el = captchaWrapperRef.current;
    if (!el) return;

    const updateScale = () => {
      const wrapperWidth = el.offsetWidth;
      if (!wrapperWidth) return;
      const nextScale = Math.min(wrapperWidth / RECAPTCHA_BASE_WIDTH, RECAPTCHA_MAX_SCALE);
      setCaptchaScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox" && name === "agree") {
      setFormData((p) => ({ ...p, agree: checked }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
      if (name === "password") calcStrength(value);
    }
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const calcStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    setPasswordStrength(score);
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
    if (!formData.phone.trim()) e.phone = "Phone number is required.";
    if (!formData.department) e.department = "Department is required.";
    if (!formData.password) e.password = "Password is required.";
    else if (formData.password.length < 8) e.password = "Min. 8 characters.";
    if (!formData.confirm_password) e.confirm_password = "Please confirm.";
    else if (formData.password !== formData.confirm_password) e.confirm_password = "Passwords do not match.";
    if (!formData.agree) e.agree = "You must agree to continue.";
    if (!captchaToken) e.captcha = "Please verify that you're not a robot.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, captchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "Account created! Redirecting to login..." });
        setTimeout(() => (window.location.href = "/login"), 2000);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Registration failed." });
        // Captcha tokens are single-use — reset the widget so the user can re-verify.
        if (window.grecaptcha && widgetIdRef.current !== null) {
          window.grecaptcha.reset(widgetIdRef.current);
        }
        setCaptchaToken(null);
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
      if (window.grecaptcha && widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
      }
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');
        .path-scroll-hide { scrollbar-width: none; -ms-overflow-style: none; }
        .path-scroll-hide::-webkit-scrollbar { display: none; width: 0; height: 0; }
      `}</style>

      <section style={s.main} className="path-scroll-hide">
        <div style={s.wrap}>
          <span style={s.kicker}>
            <i style={s.dot} /> Workspace access
          </span>
          <h2 style={s.title}>Create your account</h2>
          <p style={s.subtitle}>
            Join PATH to submit and coordinate academic documents with clear
            ownership and live status.
          </p>

          {alertMsg && (
            <div
              style={{
                ...s.alert,
                ...(alertMsg.type === "success" ? s.alertSuccess : s.alertError),
              }}
              role="status"
            >
              {alertMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <section style={s.section}>
              <div style={s.sectionLabel}>
                <Badge n="01" />
                <span style={s.sectionLabelText}>Personal information</span>
              </div>

              <label style={s.label}>
                Full Name
                <span style={{ ...s.inputShell, ...(errors.full_name ? s.inputShellError : {}) }}>
                  <input
                    style={s.input}
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </span>
                {errors.full_name && <p style={s.fieldError}>{errors.full_name}</p>}
              </label>

              <label style={s.label}>
                Email Address
                <span style={{ ...s.inputShell, ...(errors.email ? s.inputShellError : {}) }}>
                  <EnvelopeIcon />
                  <input
                    style={s.input}
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="name@university.edu"
                    autoComplete="email"
                  />
                </span>
                {errors.email && <p style={s.fieldError}>{errors.email}</p>}
              </label>

              <label style={s.label}>
                Phone
                <span style={{ ...s.inputShell, ...(errors.phone ? s.inputShellError : {}) }}>
                  <input
                    style={s.input}
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                    placeholder="Enter your phone number"
                    autoComplete="tel"
                  />
                </span>
                {errors.phone && <p style={s.fieldError}>{errors.phone}</p>}
              </label>

              <label style={{ ...s.label, marginBottom: 0 }}>
                Department
                <span style={{ ...s.inputShell, ...s.inputShellLocked }}>
                  <input style={s.input} value={formData.department} readOnly aria-readonly="true" />
                  <span style={s.lockRight} aria-label="Department locked">
                    <LockIcon />
                  </span>
                </span>
              </label>
            </section>

            <section style={s.section}>
              <div style={s.sectionLabel}>
                <Badge n="02" />
                <span style={s.sectionLabelText}>Access credentials</span>
              </div>

              <label style={s.label}>
                Username
                <span style={{ ...s.inputShell, ...(errors.username ? s.inputShellError : {}) }}>
                  <input
                    style={s.input}
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    autoComplete="username"
                  />
                </span>
                {errors.username ? (
                  <p style={s.fieldError}>{errors.username}</p>
                ) : (
                  <p style={s.fieldHint}>Lowercase letters, numbers, and underscores only.</p>
                )}
              </label>

              <label style={s.label}>
                Password
                <span style={{ ...s.inputShell, ...(errors.password ? s.inputShellError : {}) }}>
                  <KeyIcon />
                  <input
                    style={s.input}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    style={s.passwordButton}
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Eye hidden={showPassword} />
                  </button>
                </span>
                {errors.password && <p style={s.fieldError}>{errors.password}</p>}
              </label>

              {formData.password && (
                <div style={s.strengthWrap}>
                  <div style={s.strengthRow}>
                    <span style={s.strengthLabel}>Security strength</span>
                    <span style={{ ...s.strengthValue, color: strengthColor }}>{strengthLabel}</span>
                  </div>
                  <div style={s.strengthTrack}>
                    <div style={{ ...s.strengthFill, width: strengthWidth, background: strengthColor }} />
                  </div>
                  <div style={s.reqGrid}>
                    {[
                      { label: "At least 8 characters", met: formData.password.length >= 8 },
                      { label: "One uppercase letter", met: /[A-Z]/.test(formData.password) },
                      { label: "One number", met: /[0-9]/.test(formData.password) },
                      { label: "One special character", met: /[^A-Za-z0-9]/.test(formData.password) },
                    ].map((req) => (
                      <div key={req.label} style={{ ...s.reqItem, color: req.met ? "#22c55e" : colors.faint }}>
                        <CheckDot met={req.met} />
                        {req.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label style={{ ...s.label, marginBottom: 0 }}>
                Confirm Password
                <span style={{ ...s.inputShell, ...(errors.confirm_password ? s.inputShellError : {}) }}>
                  <LockIcon />
                  <input
                    style={s.input}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                </span>
                {errors.confirm_password ? (
                  <p style={s.fieldError}>{errors.confirm_password}</p>
                ) : (
                  <p style={s.fieldHint}>Passwords must match exactly.</p>
                )}
              </label>
            </section>

            <div ref={captchaWrapperRef} style={s.captchaBox}>
              <div style={s.captchaLeft}>
                <div
                  style={{
                    transform: `scale(${captchaScale})`,
                    transformOrigin: "left center",
                    width: RECAPTCHA_BASE_WIDTH,
                    height: RECAPTCHA_BASE_HEIGHT * captchaScale,
                  }}
                >
                  <div ref={captchaRef} />
                </div>
              </div>
              <span style={s.captchaTag}>
                reCAPTCHA
                <br />
                verification
              </span>
            </div>
            {errors.captcha && <p style={s.fieldError}>{errors.captcha}</p>}

            <label style={s.agreeRow}>
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                style={s.agreeCheckbox}
              />
              <span style={s.agreeText}>
                I am authorised to create an account for this academic workspace.
              </span>
            </label>
            {errors.agree && <p style={{ ...s.fieldError, marginLeft: 23 }}>{errors.agree}</p>}

            <aside style={s.important}>
              <strong style={s.importantTitle}>Important Submission Note</strong>
              <p style={s.importantText}>
                All account requests are subject to manual review by the
                Information Systems Administrator. Approval typically takes
                24-48 business hours. You will receive an automated onboarding
                guide once confirmed.
              </p>
            </aside>

            <div style={s.actions}>
              <button
                style={{ ...s.submit, ...(loading ? s.submitDisabled : {}) }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Registering..." : "Submit account request"}
              </button>
              <a style={s.cancel} href="/login">
                Cancel
              </a>
            </div>
          </form>

          <p style={s.bottomLinks}>
            Already have an account?{" "}
            <a style={s.bottomLink} href="/login">
              Sign in
            </a>
            <br />
            <a style={s.bottomLink} href="/forgot-password">
              Forgot your password?
            </a>
          </p>

          <div style={s.footerBar}>
            <span style={s.footerStatus}>
              <i style={s.footerDot} /> Systems online
            </span>
            <span style={s.footerDivider}>|</span>
            <span style={s.footerMuted}>V 2.8.4-stable</span>
            <span style={s.footerDivider}>|</span>
            <a style={s.footerLink} href="#">Privacy Policy</a>
            <a style={s.footerLink} href="#">Terms of Use</a>
            <a style={s.footerLink} href="#">Help Desk</a>
          </div>
        </div>
      </section>

      <aside style={s.aside}>
        <span style={s.orb} aria-hidden="true" />
        <div style={s.brand}>
          <span style={s.mark}>
            <img src={logowhite} alt="DS PATH logo" style={s.markImg} />
          </span>
          <span>
            <span style={s.brandName}>PATH</span>
            <span style={s.brandSub}>Processing &amp; Tracking Hub</span>
          </span>
        </div>

        <div>
          <span style={s.heroKicker}>
            <i style={s.heroDot} /> Set up once · track clearly
          </span>
          <h1 style={s.heroTitle}>Bring document work into focus.</h1>
          <p style={s.heroText}>
            From submission to approval, PATH keeps responsibilities, required
            evidence, and deadlines in one secure operational record.
          </p>
        </div>

        <div style={s.features}>
          <div style={s.feature}>
            <span style={s.featureBadge}>01</span>
            <span>
              <strong style={s.featureTitle}>Submit with context</strong>
              <span style={s.featureText}>Use forms that match the document category.</span>
            </span>
          </div>
          <div style={s.feature}>
            <span style={s.featureBadge}>02</span>
            <span>
              <strong style={s.featureTitle}>Review with clarity</strong>
              <span style={s.featureText}>Keep decisions and revision requests visible.</span>
            </span>
          </div>
          <div style={s.feature}>
            <span style={s.featureBadge}>03</span>
            <span>
              <strong style={s.featureTitle}>Track every handoff</strong>
              <span style={s.featureText}>See ownership and SLA status at a glance.</span>
            </span>
          </div>
        </div>
      </aside>
    </main>
  );
}