import React, { useState } from "react";
import logo from "../assets/logo.png";
import logowhite from "../assets/logowhite.png";

const API_BASE =
  (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

const violet = {
  ink: "#2f2638",
  muted: "#82768a",
  faint: "#a095a8",
  violet: "#7c3aed",
  violetDark: "#5b21b6",
  panel: "#f8f7ff",
  line: "#e9e1f1",
};

const styles = {
  page: {
    display: "grid",
    gridTemplateColumns: "minmax(330px, 42%) 1fr",
    minHeight: "100vh",
    overflow: "hidden",
    background: violet.panel,
    color: violet.ink,
    fontFamily: '"DM Sans", Arial, sans-serif',
  },
  aside: {
    position: "relative",
    display: "flex",
    minHeight: "100vh",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    padding: "38px 44px",
    background:
      "linear-gradient(145deg, #3b2054 0%, #6431a9 56%, #8439f0 100%)",
    color: "#fff",
  },
  asideOrb: {
    position: "absolute",
    width: 460,
    height: 460,
    right: -210,
    top: 110,
    border: "1px solid rgba(255,255,255,.17)",
    borderRadius: "50%",
  },
  asideOrbBottom: {
    position: "absolute",
    width: 380,
    height: 380,
    left: -220,
    bottom: -170,
    border: "1px solid rgba(255,255,255,.14)",
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
  },
  markImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 24px rgba(46, 19, 76, .2))",
  },
  markIcon: {
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  brandName: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".16em",
  },
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
    maxWidth: 410,
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
  kickerDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#c4b5fd",
  },
  asideTitle: {
    margin: "22px 0 12px",
    fontSize: "clamp(42px, 4.3vw, 64px)",
    fontWeight: 800,
    letterSpacing: "-.065em",
    lineHeight: 0.96,
  },
  asideText: {
    maxWidth: 360,
    margin: 0,
    color: "rgba(255,255,255,.74)",
    fontSize: 13,
    lineHeight: 1.65,
  },
  workflow: {
    position: "relative",
    zIndex: 1,
    maxWidth: 356,
    padding: "18px 18px 16px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 13,
    background: "rgba(255,255,255,.1)",
    backdropFilter: "blur(8px)",
  },
  workflowLabel: {
    display: "block",
    marginBottom: 13,
    color: "rgba(255,255,255,.66)",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: ".11em",
    textTransform: "uppercase",
  },
  workflowText: {
    display: "block",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
  },
  workflowLines: {
    display: "flex",
    gap: 6,
    marginTop: 14,
  },
  workflowLine: {
    width: 62,
    height: 4,
    borderRadius: 99,
    background: "rgba(255,255,255,.32)",
  },
  workflowLineActive: {
    background: "#fff",
  },
  main: {
    display: "flex",
    minWidth: 0,
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    padding: "54px 56px",
    overflowY: "auto",
  },
  formWrap: {
    width: "min(100%, 462px)",
  },
  mobileBrand: {
    display: "none",
    alignItems: "center",
    gap: 12,
    marginBottom: 42,
  },
  mobileMark: {
    display: "grid",
    width: 52,
    height: 52,
    placeItems: "center",
  },
  mobileBrandName: {
    color: violet.ink,
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: ".14em",
  },
  header: {
    marginBottom: 32,
  },
  headerKicker: {
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    color: violet.muted,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  headerTitle: {
    margin: "18px 0 12px",
    color: violet.ink,
    fontSize: 56,
    fontWeight: 800,
    letterSpacing: "-.06em",
    lineHeight: 1.02,
  },
  headerText: {
    maxWidth: 440,
    margin: 0,
    color: violet.muted,
    fontSize: 15,
    lineHeight: 1.6,
  },
  card: {
    border: `1px solid ${violet.line}`,
    borderRadius: 16,
    padding: 20,
    background: "rgba(255,255,255,.84)",
    boxShadow: "0 18px 42px rgba(76,46,102,.08)",
  },
  intro: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  introIcon: {
    display: "grid",
    flex: "0 0 auto",
    width: 34,
    height: 34,
    placeItems: "center",
    borderRadius: 10,
    background: "#f0eaff",
    color: "#7134d6",
  },
  introTitle: {
    display: "block",
    color: "#42334c",
    fontSize: 12,
    fontWeight: 800,
  },
  introText: {
    display: "block",
    maxWidth: 330,
    marginTop: 5,
    color: violet.muted,
    fontSize: 11,
    lineHeight: 1.55,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 22,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
    color: "#51405e",
    fontSize: 10,
    fontWeight: 800,
  },
  inputShell: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    minHeight: 42,
    border: "1px solid #ded6e5",
    borderRadius: 8,
    padding: "0 12px",
    background: "#fff",
    color: "#a096a8",
  },
  inputShellError: {
    border: "1px solid #f19a9a",
  },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: violet.ink,
    font: '500 12px "DM Sans", Arial, sans-serif',
  },
  fieldError: {
    margin: 0,
    color: "#d34848",
    fontSize: 10,
    fontWeight: 600,
  },
  passwordButton: {
    display: "grid",
    flex: "0 0 auto",
    width: 22,
    height: 22,
    placeItems: "center",
    border: 0,
    background: "transparent",
    color: "#7956a6",
    cursor: "pointer",
  },
  options: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: -1,
  },
  check: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: violet.muted,
    fontSize: 9,
    fontWeight: 600,
  },
  link: {
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#7144bf",
    font: '800 9px "DM Sans", Arial, sans-serif',
    cursor: "pointer",
    textDecoration: "none",
  },
  primary: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    minHeight: 46,
    marginTop: 7,
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #8439f0)",
    color: "#fff",
    font: '800 11px "DM Sans", Arial, sans-serif',
    boxShadow: "0 12px 22px rgba(124,58,237,.2)",
    cursor: "pointer",
  },
  primaryDisabled: {
    opacity: 0.65,
    cursor: "not-allowed",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: "20px 0 14px",
    color: violet.faint,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: ".06em",
    textTransform: "uppercase",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: "#ece6f0",
  },
  providers: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  provider: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 40,
    border: "1px solid #e2dbe8",
    borderRadius: 8,
    background: "#fff",
    color: "#554761",
    font: '800 10px "DM Sans", Arial, sans-serif',
    cursor: "pointer",
  },
  google: {
    color: "#4285f4",
    font: '800 14px "DM Sans", Arial, sans-serif',
  },
  microsoft: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 7px)",
    gridTemplateRows: "repeat(2, 7px)",
    gap: 1,
  },
  square: {
    width: 7,
    height: 7,
  },
  notice: {
    margin: "13px 0 0",
    border: "1px solid #e0d3f5",
    borderRadius: 8,
    padding: "9px 10px",
    background: "#faf7ff",
    color: "#6f5790",
    fontSize: 10,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  noticeSuccess: {
    border: "1px solid #bfe3c8",
    background: "#f2fbf4",
    color: "#2c7a43",
  },
  noticeError: {
    border: "1px solid #f1c3c3",
    background: "#fdf4f4",
    color: "#c23f3f",
  },
  trust: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px 18px",
    marginTop: 18,
    color: "#8d8195",
    fontSize: 9,
    fontWeight: 700,
  },
  switchText: {
    margin: "26px 0 0",
    color: violet.muted,
    fontSize: 10,
    textAlign: "center",
  },
};

function EyeIcon({ hidden = false }) {
  return (
    <svg viewBox="0 0 24 24" style={styles.markIcon} aria-hidden="true">
      {hidden ? (
        <>
          <path d="m4 4 16 16" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.2A11.7 11.7 0 0 1 12 5c5.2 0 8.6 4.9 9.5 7a16 16 0 0 1-2.1 3.2M6.1 6.1A16 16 0 0 0 2.5 12c.9 2.1 4.3 7 9.5 7 1 0 2-.2 2.9-.5" />
        </>
      ) : (
        <>
          <path d="M2.5 12s3.4-7 9.5-7 9.5 7 9.5 7-3.4 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="2.5" />
        </>
      )}
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" style={styles.markIcon} aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.8 7.9-7 9.3-4.2-1.4-7-4.9-7-9.3V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ ...styles.markIcon, width: 16, height: 16 }}
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Handle OAuth callback: pick up ?oauth_token= or ?oauth_error= ──────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get("oauth_token");
    const oauthError = params.get("oauth_error");

    if (oauthToken) {
      localStorage.setItem("token", oauthToken);
      window.history.replaceState({}, "", "/login");
      if (params.get("oauth_new") === "1") {
        // New account — send to setup flow
        window.location.href = "/setup";
      } else {
        setAlertMsg({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => (window.location.href = "/dashboard"), 1500);
      }
    } else if (oauthError) {
      window.history.replaceState({}, "", "/login");
      setAlertMsg({ type: "error", text: "Sign-in failed or account is pending approval. Please try again." });
    }
  }, []);

  const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (!formData.password) newErrors.password = "Password is required.";
    return newErrors;
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
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setAlertMsg({ type: "success", text: "Login successful! Redirecting..." });
        setTimeout(() => (window.location.href = "/dashboard"), 1500);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Invalid credentials." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap');`}</style>
      <aside style={styles.aside}>
        <span style={styles.asideOrb} aria-hidden="true" />
        <span style={styles.asideOrbBottom} aria-hidden="true" />
        <div style={styles.brand}>
          <span style={styles.mark}>
            <img src={logowhite} alt="DS PATH logo" style={styles.markImg} />
          </span>
          <span>
            <span style={styles.brandName}>DS PATH</span>
            <span style={styles.brandSub}>Processing &amp; Tracking Hub</span>
          </span>
        </div>
        <div style={styles.asideCopy}>
          <span style={styles.kicker}>
            <i style={styles.kickerDot} /> Academic workflow operations
          </span>
          <h1 style={styles.asideTitle}>Keep every academic handoff clear.</h1>
          <p style={styles.asideText}>
            DS PATH gives faculty and program chairs one place to submit, review,
            track, and act on the records that move the department forward.
          </p>
        </div>
        <div style={styles.workflow}>
          <span style={styles.workflowLabel}>Today&apos;s workflow</span>
          <strong style={styles.workflowText}>
            One secure workspace for every submission.
          </strong>
          <div style={styles.workflowLines} aria-hidden="true">
            <i
              style={{ ...styles.workflowLine, ...styles.workflowLineActive }}
            />
            <i style={styles.workflowLine} />
            <i style={styles.workflowLine} />
          </div>
        </div>
      </aside>

      <section style={styles.main}>
        <div style={styles.formWrap}>
          <div style={{ ...styles.mobileBrand, display: "flex" }}>
            <span style={styles.mobileMark}>
            </span>

          </div>
          <header style={styles.header}>
            <span style={{ ...styles.headerKicker, color: violet.muted }}>
              <i style={{ ...styles.kickerDot, background: violet.violet }} />{" "}
              Secure access
            </span>
            <h2 style={styles.headerTitle}>Welcome back</h2>
            <p style={styles.headerText}>
              Sign in to continue managing your department&apos;s document
              workflow.
            </p>
          </header>

          <div style={styles.card}>
            <div style={styles.intro}>
              <span style={styles.introIcon}>
                <ShieldIcon />
              </span>
              <span>
                <strong style={styles.introTitle}>
                  Choose how you&apos;ll sign in
                </strong>
                <small style={styles.introText}>
                  Use your DS PATH credentials to access your workspace.
                </small>
              </span>
            </div>

            {alertMsg && alertMsg.type === "error" && (
              <p
                role="status"
                style={{
                  ...styles.notice,
                  ...styles.noticeError,
                  marginTop: 14,
                }}
              >
                {alertMsg.text}
              </p>
            )}

            {alertMsg && alertMsg.type === "success" && (
              <div style={{
                position: "fixed", inset: 0, zIndex: 9999,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(15,10,30,0.55)", backdropFilter: "blur(4px)",
                fontFamily: "'DM Sans',sans-serif",
                animation: "login-overlay-in 0.2s ease both",
              }}>
                <div style={{
                  background: "#fff", borderRadius: 20, padding: "40px 36px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  boxShadow: "0 28px 70px rgba(76,29,149,0.22)", width: "min(360px,90vw)",
                  animation: "login-popup-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both",
                  textAlign: "center",
                }}>
                  {/* PATH logo fill animation */}
                  <div style={{ position: "relative", width: 80, height: 80, marginBottom: 4 }}>
                    {/* Filling logo — scaleY from 0 to 1, origin at bottom */}
                    <img
                      src={logo}
                      alt="PATH logo"
                      style={{
                        width: 80, height: 80, objectFit: "contain",
                        display: "block",
                        transformOrigin: "bottom center",
                        animation: "login-logo-fill 1.1s cubic-bezier(0.22,1,0.36,1) 0.2s both",
                        filter: "drop-shadow(0 4px 18px rgba(124,58,237,0.55))",
                      }}
                    />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#27213a", letterSpacing: "-0.03em" }}>
                      Welcome back!
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "#9080a0", lineHeight: 1.5 }}>
                      Login successful. Taking you to your dashboard…
                    </p>
                  </div>
                  {/* Progress bar */}
                  <div style={{ width: "100%", height: 4, borderRadius: 99, background: "#ede9fe", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      background: "linear-gradient(90deg,#a78bfa,#7c3aed)",
                      animation: "login-progress 1.5s linear forwards",
                    }} />
                  </div>
                </div>
                <style>{`
                  @keyframes login-overlay-in { from{opacity:0} to{opacity:1} }
                  @keyframes login-popup-in { from{opacity:0;transform:scale(0.88) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
                  @keyframes login-check-in { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
                  @keyframes login-logo-fill {
                    0%   { transform: scaleY(0) scaleX(0.8); opacity: 0; }
                    30%  { opacity: 1; }
                    80%  { transform: scaleY(1.08) scaleX(1.04); }
                    100% { transform: scaleY(1) scaleX(1); opacity: 1; }
                  }
                  @keyframes login-progress { from{width:0%} to{width:100%} }
                `}</style>
              </div>
            )}

            <form style={styles.form} onSubmit={handleSubmit} noValidate>
              <label style={styles.label}>
                Username
                <span
                  style={{
                    ...styles.inputShell,
                    ...(errors.username ? styles.inputShellError : {}),
                  }}
                >
                  <span aria-hidden="true">✉</span>
                  <input
                    style={styles.input}
                    type="text"
                    name="username"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </span>
                {errors.username && (
                  <p style={styles.fieldError}>{errors.username}</p>
                )}
              </label>
              <label style={styles.label}>
                Password
                <span
                  style={{
                    ...styles.inputShell,
                    ...(errors.password ? styles.inputShellError : {}),
                  }}
                >
                  <span aria-hidden="true">▣</span>
                  <input
                    style={styles.input}
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    style={styles.passwordButton}
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <EyeIcon hidden={showPassword} />
                  </button>
                </span>
                {errors.password && (
                  <p style={styles.fieldError}>{errors.password}</p>
                )}
              </label>
              <div style={styles.options}>
                <label style={styles.check}>
                  <input type="checkbox" defaultChecked /> Keep me signed in
                </label>
                <a style={styles.link} href="/forgot-password">
                  Forgot password?
                </a>
              </div>
              <button
                style={{
                  ...styles.primary,
                  ...(loading ? styles.primaryDisabled : {}),
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in with username"}
                {!loading && <ArrowIcon />}
              </button>
            </form>

            <div style={styles.divider} aria-hidden="true">
              <i style={styles.dividerLine} />
              <span>or continue with</span>
              <i style={styles.dividerLine} />
            </div>
            <div style={styles.providers}>
              <button style={styles.provider} type="button"
                onClick={() => window.location.href = `${BACKEND}/api/auth/google`}>
                <span style={styles.google}>G</span> Google
              </button>
              <button style={styles.provider} type="button"
                onClick={() => window.location.href = `${BACKEND}/api/auth/microsoft`}>
                <span style={styles.microsoft} aria-hidden="true">
                  <i style={{ ...styles.square, background: "#f35325" }} />
                  <i style={{ ...styles.square, background: "#81bc06" }} />
                  <i style={{ ...styles.square, background: "#05a6f0" }} />
                  <i style={{ ...styles.square, background: "#ffba08" }} />
                </span>
                Microsoft
              </button>
            </div>
          </div>

          <div style={styles.trust} aria-label="DS PATH security features">
            <span>✓ Encrypted session</span>
            <span>✓ Role-aware workspace</span>
          </div>
          <p style={styles.switchText}>
            New to DS PATH?{" "}
            <a style={styles.link} href="/register">
              Create an account
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}