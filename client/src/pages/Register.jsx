import React, { useState, useEffect, useRef } from "react";

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
  ink: "#2f2638",
  muted: "#82768a",
  violet: "#7c3aed",
  purple: "#5b2a93",
  lavender: "#f8f7ff",
  line: "#e7dfed",
};

const s = {
  page: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 38%) 1fr",
    minHeight: "100vh",
    overflow: "hidden",
    background: colors.lavender,
    color: colors.ink,
    fontFamily: '"DM Sans", Arial, sans-serif',
  },
  aside: {
    position: "relative",
    display: "flex",
    minHeight: "100vh",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    padding: "38px 42px",
    background:
      "linear-gradient(145deg, #3b2054 0%, #6431a9 56%, #8439f0 100%)",
    color: "#fff",
  },
  orb: {
    position: "absolute",
    width: 470,
    height: 470,
    right: -235,
    top: 90,
    border: "1px solid rgba(255,255,255,.16)",
    borderRadius: "50%",
  },
  orbSmall: {
    position: "absolute",
    width: 340,
    height: 340,
    left: -210,
    bottom: -160,
    border: "1px solid rgba(255,255,255,.13)",
    borderRadius: "50%",
  },
  brand: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  mark: {
    display: "grid",
    width: 34,
    height: 34,
    placeItems: "center",
    borderRadius: 10,
    background: colors.violet,
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
  brandName: { fontSize: 18, fontWeight: 800, letterSpacing: ".16em" },
  brandSub: {
    display: "block",
    marginTop: 2,
    color: "rgba(255,255,255,.6)",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: ".11em",
    textTransform: "uppercase",
  },
  asideCopy: {
    position: "relative",
    zIndex: 1,
    maxWidth: 390,
    margin: "auto 0",
  },
  kicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,.78)",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#c4b5fd" },
  asideTitle: {
    margin: "22px 0 12px",
    fontSize: "clamp(39px, 4.1vw, 60px)",
    fontWeight: 800,
    letterSpacing: "-.065em",
    lineHeight: 0.98,
  },
  asideText: {
    maxWidth: 360,
    margin: 0,
    color: "rgba(255,255,255,.74)",
    fontSize: 13,
    lineHeight: 1.65,
  },
  note: {
    position: "relative",
    zIndex: 1,
    maxWidth: 350,
    padding: "16px 18px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 13,
    background: "rgba(255,255,255,.1)",
  },
  noteLabel: {
    display: "block",
    marginBottom: 9,
    color: "rgba(255,255,255,.62)",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: ".11em",
    textTransform: "uppercase",
  },
  noteText: { color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1.5 },
  main: {
    display: "flex",
    minWidth: 0,
    minHeight: "100vh",
    alignItems: "flex-start",
    justifyContent: "center",
    overflowY: "auto",
    padding: "40px 56px",
  },
  wrap: { width: "min(100%, 610px)" },
  mobileBrand: {
    display: "none",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  mobileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".14em",
  },
  header: { marginBottom: 20 },
  headerKicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: colors.muted,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: colors.violet,
  },
  title: {
    margin: "13px 0 8px",
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: "-.06em",
    lineHeight: 1.02,
  },
  subtitle: {
    maxWidth: 470,
    margin: 0,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 1.55,
  },
  card: {
    border: `1px solid ${colors.line}`,
    borderRadius: 16,
    padding: 20,
    background: "rgba(255,255,255,.88)",
    boxShadow: "0 18px 42px rgba(76,46,102,.08)",
  },
  section: { marginBottom: 19 },
  sectionLabel: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    marginBottom: 12,
    color: "#6d5a78",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  sectionLine: { flex: 1, height: 1, background: "#eee8f2" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    color: "#51405e",
    fontSize: 10,
    fontWeight: 800,
  },
  full: { gridColumn: "1 / -1" },
  inputShell: {
    display: "flex",
    alignItems: "center",
    minHeight: 40,
    border: "1px solid #ded6e5",
    borderRadius: 8,
    padding: "0 11px",
    background: "#fff",
  },
  inputShellError: { borderColor: "#f1a8a8" },
  inputShellLocked: { borderColor: "#dcd0f0", background: "#faf7ff" },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: colors.ink,
    font: '500 11px "DM Sans", Arial, sans-serif',
  },
  lock: { marginLeft: 8, color: colors.violet },
  passwordButton: {
    display: "grid",
    width: 22,
    height: 22,
    placeItems: "center",
    border: 0,
    background: "transparent",
    color: "#7956a6",
    cursor: "pointer",
  },
  fieldError: { margin: "5px 0 0", color: "#d34848", fontSize: 10, fontWeight: 600 },
  fieldHint: { margin: "5px 0 0", color: colors.muted, fontSize: 10, lineHeight: 1.4 },
  strengthRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  strengthLabel: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".08em",
    color: "#9a8ea1",
    textTransform: "uppercase",
  },
  strengthValue: { fontSize: 9, fontWeight: 800 },
  strengthTrack: { height: 4, background: "#efe9f5", borderRadius: 99 },
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
  captchaShell: {
    display: "flex",
    justifyContent: "center",
    borderRadius: 8,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid #e5ddea",
    padding: "8px 0",
  },
  agreeRow: { display: "flex", alignItems: "flex-start", gap: 9, marginTop: 4, cursor: "pointer" },
  agreeCheckbox: { marginTop: 2, width: 14, height: 14, accentColor: colors.violet, flexShrink: 0 },
  agreeText: { fontSize: 11, color: "#51405e", lineHeight: 1.55 },
  submit: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    border: 0,
    borderRadius: 8,
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
    minHeight: 44,
    padding: "0 20px",
    border: "1px solid #ded6e5",
    borderRadius: 8,
    background: "#fff",
    color: "#6d5a78",
    font: '800 11px "DM Sans", Arial, sans-serif',
    textDecoration: "none",
    cursor: "pointer",
  },
  actions: { display: "flex", alignItems: "center", gap: 12, marginTop: 20 },
  alert: {
    marginBottom: 14,
    border: "1px solid #e7d7f2",
    borderRadius: 8,
    padding: "9px 10px",
    background: "#fbf7ff",
    color: "#6d4b8a",
    fontSize: 10,
    fontWeight: 600,
    lineHeight: 1.45,
  },
  alertSuccess: { border: "1px solid #bfe3c8", background: "#f2fbf4", color: "#2c7a43" },
  alertError: { border: "1px solid #f1c3c3", background: "#fdf4f4", color: "#c23f3f" },
  important: {
    marginTop: 16,
    border: "1px solid #eadff3",
    borderRadius: 10,
    padding: "13px 14px",
    background: "#faf8ff",
  },
  importantTitle: {
    display: "block",
    marginBottom: 7,
    color: "#4d385d",
    fontSize: 10,
    fontWeight: 800,
  },
  importantText: {
    margin: 0,
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.55,
  },
  bottomLinks: {
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
    lineHeight: 2,
    marginTop: 24,
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
  footerDivider: { fontSize: 9, color: "#d9d0e0" },
  footerMuted: { fontSize: 9, color: "#9a8ea1", fontWeight: 700 },
  footerLink: { fontSize: 9, color: "#9a8ea1", fontWeight: 700, textDecoration: "none" },
};

function FileMark() {
  return (
    <svg viewBox="0 0 24 24" style={s.markSvg} aria-hidden="true">
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5v4h4M10 12h5M10 15.5h5" />
    </svg>
  );
}

function Eye({ hidden = false }) {
  return (
    <svg viewBox="0 0 24 24" style={s.markSvg} aria-hidden="true">
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
    <span
      style={{
        ...s.reqDot,
        border: `1.5px solid ${met ? "#22c55e" : "#d8cfe0"}`,
      }}
    >
      {met && (
        <svg viewBox="0 0 12 12" width="8" height="8" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6l2.5 2.5L10 3" />
        </svg>
      )}
    </span>
  );
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');`}</style>
      <aside style={s.aside}>
        <span style={s.orb} aria-hidden="true" />
        <span style={s.orbSmall} aria-hidden="true" />
        <div style={s.brand}>
          <span style={s.mark}>
            <FileMark />
          </span>
          <span>
            <span style={s.brandName}>PATH</span>
            <span style={s.brandSub}>Processing &amp; Tracking Hub</span>
          </span>
        </div>
        <div style={s.asideCopy}>
          <span style={s.kicker}>
            <i style={s.dot} /> Academic workflow operations
          </span>
          <h1 style={s.asideTitle}>
            A clear start for every academic handoff.
          </h1>
          <p style={s.asideText}>
            Create your PATH workspace access and keep every departmental
            submission visible, accountable, and ready to move.
          </p>
        </div>
        <div style={s.note}>
          <span style={s.noteLabel}>Account requests</span>
          <span style={s.noteText}>
            Every request is reviewed by the Information Systems Administrator.
          </span>
        </div>
      </aside>

      <section style={s.main}>
        <div style={s.wrap}>
          <div style={{ ...s.mobileBrand, display: "flex" }}>
            <span style={s.mark}>
              <FileMark />
            </span>
            <span style={s.mobileName}>PATH</span>
          </div>
          <header style={s.header}>
            <span style={s.headerKicker}>
              <i style={s.headerDot} /> Account request
            </span>
            <h2 style={s.title}>Create your PATH account</h2>
            <p style={s.subtitle}>
              Submit your details for review and access the department&apos;s
              document workflow workspace.
            </p>
          </header>

          <div style={s.card}>
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
                  Personal information <i style={s.sectionLine} />
                </div>
                <div style={s.grid}>
                  <label style={{ ...s.label, ...s.full }}>
                    Full Name
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.full_name ? s.inputShellError : {}),
                      }}
                    >
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
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.email ? s.inputShellError : {}),
                      }}
                    >
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
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.phone ? s.inputShellError : {}),
                      }}
                    >
                      <input
                        style={s.input}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        type="tel"
                        placeholder="+63 900 000 0000"
                        autoComplete="tel"
                      />
                    </span>
                    {errors.phone && <p style={s.fieldError}>{errors.phone}</p>}
                  </label>
                  <label style={{ ...s.label, ...s.full }}>
                    Department
                    <span style={{ ...s.inputShell, ...s.inputShellLocked }}>
                      <input
                        style={s.input}
                        value={formData.department}
                        readOnly
                        aria-readonly="true"
                      />
                      <span style={s.lock} aria-label="Department locked">
                        ▣
                      </span>
                    </span>
                  </label>
                </div>
              </section>

              <section style={s.section}>
                <div style={s.sectionLabel}>
                  Access credentials <i style={s.sectionLine} />
                </div>
                <div style={s.grid}>
                  <label style={{ ...s.label, ...s.full }}>
                    Username
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.username ? s.inputShellError : {}),
                      }}
                    >
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
                      <p style={s.fieldHint}>
                        This will be your login identifier. Lowercase letters, numbers, and underscores only.
                      </p>
                    )}
                  </label>
                  <label style={s.label}>
                    Password
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.password ? s.inputShellError : {}),
                      }}
                    >
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
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <Eye hidden={showPassword} />
                      </button>
                    </span>
                    {errors.password && <p style={s.fieldError}>{errors.password}</p>}
                  </label>
                  <label style={s.label}>
                    Confirm Password
                    <span
                      style={{
                        ...s.inputShell,
                        ...(errors.confirm_password ? s.inputShellError : {}),
                      }}
                    >
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
                </div>

                {formData.password && (
                  <div style={{ marginTop: 16 }}>
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
                        <div
                          key={req.label}
                          style={{ ...s.reqItem, color: req.met ? "#22c55e" : "#9a8ea1" }}
                        >
                          <CheckDot met={req.met} />
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section style={s.section}>
                <div style={s.sectionLabel}>
                  Verification <i style={s.sectionLine} />
                </div>
                <div ref={captchaWrapperRef} style={{ ...s.captchaShell, height: RECAPTCHA_BASE_HEIGHT * captchaScale + 16 }}>
                  <div style={{ transform: `scale(${captchaScale})`, transformOrigin: "top center", width: RECAPTCHA_BASE_WIDTH }}>
                    <div ref={captchaRef} />
                  </div>
                </div>
                {errors.captcha && <p style={s.fieldError}>{errors.captcha}</p>}
              </section>

              <aside style={s.important}>
                <strong style={s.importantTitle}>Important Submission Note</strong>
                <p style={s.importantText}>
                  All account requests are subject to manual review by the
                  Information Systems Administrator. Approval typically takes
                  24-48 business hours. You will receive an automated onboarding
                  guide once confirmed.
                </p>
              </aside>

              <label style={s.agreeRow}>
                <input
                  type="checkbox"
                  name="agree"
                  checked={formData.agree}
                  onChange={handleChange}
                  style={s.agreeCheckbox}
                />
                <span style={s.agreeText}>
                  I agree to the Data Security Policy and Professional Conduct guidelines.
                </span>
              </label>
              {errors.agree && <p style={{ ...s.fieldError, marginLeft: 23 }}>{errors.agree}</p>}

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
        </div>
      </section>
    </main>
  );
}