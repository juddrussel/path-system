import React, { useState, useEffect } from "react";

const colors = {
  ink: "#2f2638",
  muted: "#82768a",
  violet: "#7c3aed",
  panel: "#f8f7ff",
  line: "#e7dfed",
};

const s = {
  page: {
    display: "grid",
    gridTemplateColumns: "minmax(320px, 42%) 1fr",
    minHeight: "100vh",
    overflow: "hidden",
    background: colors.panel,
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
    padding: "38px 44px",
    background:
      "linear-gradient(145deg, #3b2054 0%, #6431a9 56%, #8439f0 100%)",
    color: "#fff",
  },
  orb: {
    position: "absolute",
    width: 460,
    height: 460,
    right: -210,
    top: 110,
    border: "1px solid rgba(255,255,255,.17)",
    borderRadius: "50%",
  },
  orbBottom: {
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
  dot: { width: 6, height: 6, borderRadius: "50%", background: "#c4b5fd" },
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
  asideNote: {
    position: "relative",
    zIndex: 1,
    maxWidth: 356,
    padding: "18px",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 13,
    background: "rgba(255,255,255,.1)",
  },
  noteLabel: {
    display: "block",
    marginBottom: 9,
    color: "rgba(255,255,255,.65)",
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: ".11em",
    textTransform: "uppercase",
  },
  noteText: { color: "#fff", fontSize: 12, fontWeight: 700, lineHeight: 1.5 },
  main: {
    display: "flex",
    minWidth: 0,
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    overflowY: "auto",
    padding: "54px 56px",
  },
  wrap: { width: "min(100%, 462px)" },
  mobileBrand: {
    display: "none",
    alignItems: "center",
    gap: 10,
    marginBottom: 42,
  },
  mobileName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: ".14em",
  },
  header: { marginBottom: 27 },
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
    margin: "14px 0 8px",
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: "-.06em",
    lineHeight: 1.02,
  },
  subtitle: {
    maxWidth: 390,
    margin: 0,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 1.55,
  },
  card: {
    border: `1px solid ${colors.line}`,
    borderRadius: 16,
    padding: 20,
    background: "rgba(255,255,255,.86)",
    boxShadow: "0 18px 42px rgba(76,46,102,.08)",
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
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
    minHeight: 43,
    border: "1px solid #ded6e5",
    borderRadius: 8,
    padding: "0 12px",
    background: "#fff",
    color: "#a096a8",
  },
  inputShellError: {
    borderColor: "#e6a5a5",
  },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: colors.ink,
    font: "500 12px Arial, sans-serif",
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
  fieldError: {
    margin: "-3px 0 0",
    color: "#c0392b",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  hint: {
    margin: "-3px 0 0",
    color: "#95899c",
    fontSize: 9,
    fontWeight: 600,
    lineHeight: 1.5,
  },
  submit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    minHeight: 46,
    marginTop: 4,
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #8439f0)",
    color: "#fff",
    font: "800 11px Arial, sans-serif",
    cursor: "pointer",
  },
  submitDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  back: {
    display: "block",
    margin: "20px auto 0",
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#7144bf",
    font: "800 10px Arial, sans-serif",
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
  },
  help: {
    margin: "22px 0 0",
    color: "#95899c",
    fontSize: 9,
    textAlign: "center",
  },
  alertBase: {
    marginBottom: 12,
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 10,
    lineHeight: 1.45,
    fontWeight: 700,
  },
  alertSuccess: {
    border: "1px solid #bfe3c8",
    background: "#eefaf1",
    color: "#2f7a45",
  },
  alertError: {
    border: "1px solid #f0c2c2",
    background: "#fdf2f2",
    color: "#b03a3a",
  },
  success: { textAlign: "center" },
  successIcon: {
    display: "grid",
    width: 42,
    height: 42,
    margin: "0 auto 13px",
    placeItems: "center",
    borderRadius: "50%",
    background: "#efe8ff",
    color: colors.violet,
  },
  successTitle: {
    display: "block",
    color: "#43334c",
    fontSize: 15,
    fontWeight: 800,
  },
  successText: {
    margin: "9px auto 0",
    color: colors.muted,
    fontSize: 11,
    lineHeight: 1.55,
  },
  successButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    width: "100%",
    minHeight: 44,
    marginTop: 19,
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #8439f0)",
    color: "#fff",
    font: "800 11px Arial, sans-serif",
    cursor: "pointer",
    textDecoration: "none",
  },
  checking: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
    padding: "8px 0",
  },
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

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ ...s.markSvg, width: 16, height: 16 }}
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function Shield() {
  return (
    <svg viewBox="0 0 24 24" style={s.markSvg} aria-hidden="true">
      <path d="M12 3.5 19 6v5.2c0 4.4-2.8 7.9-7 9.3-4.2-1.4-7-4.9-7-9.3V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function ResetPassword() {
  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null=checking, true=valid, false=invalid
  const [showPassword, setShowPassword] = useState(false);

  // Load DM Sans via real <link> tags (more reliable than an inline
  // <style>@import, which can get stripped or blocked and silently
  // fall back to the browser's default bold sans-serif).
  useEffect(() => {
    if (document.getElementById("dm-sans-font")) return;

    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";

    const stylesheet = document.createElement("link");
    stylesheet.id = "dm-sans-font";
    stylesheet.rel = "stylesheet";
    stylesheet.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700;9..40,800&display=swap";

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(stylesheet);
  }, []);

  const token = new URLSearchParams(window.location.search).get("token");

  // Verify token on mount
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-reset-token?token=${token}`)
      .then(res => setTokenValid(res.ok))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (!form.confirm_password) errs.confirm_password = "Please confirm your password.";
    else if (form.password !== form.confirm_password) errs.confirm_password = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "Password reset successfully! Redirecting to login..." });
        setTimeout(() => (window.location.href = "/login"), 2500);
      } else {
        setAlertMsg({ type: "error", text: data.message || "Failed to reset password." });
      }
    } catch {
      setAlertMsg({ type: "error", text: "Server error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={s.page}>
      <aside style={s.aside}>
        <span style={s.orb} aria-hidden="true" />
        <span style={s.orbBottom} aria-hidden="true" />
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
            <i style={s.dot} /> Access recovery
          </span>
          <h1 style={s.asideTitle}>Return to work with confidence.</h1>
          <p style={s.asideText}>
            Set a secure new password and continue managing the
            department&apos;s document workflow.
          </p>
        </div>
        <div style={s.asideNote}>
          <span style={s.noteLabel}>Secure reset</span>
          <span style={s.noteText}>
            A stronger password keeps every handoff protected.
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
              <i style={s.headerDot} /> Secure reset
            </span>
            <h2 style={s.title}>
              {tokenValid === false ? "Link expired" : "Reset your password"}
            </h2>
            <p style={s.subtitle}>
              {tokenValid === false
                ? "This password reset link is invalid or has expired (links expire after 1 hour)."
                : "Choose a new password for your PATH account. Use at least eight characters so your workspace stays protected."}
            </p>
          </header>

          <div style={s.card}>
            {/* Token checking state */}
            {tokenValid === null && (
              <p style={s.checking}>Verifying reset link...</p>
            )}

            {/* Invalid token */}
            {tokenValid === false && (
              <div style={s.success} role="status">
                <span style={s.successIcon}>
                  <Shield />
                </span>
                <strong style={s.successTitle}>Link expired</strong>
                <p style={s.successText}>
                  Request a new reset link to continue.
                </p>
                <a href="/forgot-password" style={s.successButton}>
                  Request new reset link <Arrow />
                </a>
              </div>
            )}

            {/* Valid token — show form */}
            {tokenValid === true && (
              <form style={s.form} onSubmit={handleSubmit} noValidate>
                {alertMsg && (
                  <div
                    style={{
                      ...s.alertBase,
                      ...(alertMsg.type === "success"
                        ? s.alertSuccess
                        : s.alertError),
                    }}
                    role="alert"
                  >
                    {alertMsg.text}
                  </div>
                )}

                <label style={s.label}>
                  New Password
                  <span
                    style={{
                      ...s.inputShell,
                      ...(errors.password ? s.inputShellError : {}),
                    }}
                  >
                    <span aria-hidden="true">▣</span>
                    <input
                      style={s.input}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      autoFocus
                    />
                    <button
                      style={s.passwordButton}
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <Eye hidden={showPassword} />
                    </button>
                  </span>
                  {errors.password && (
                    <p style={s.fieldError}>{errors.password}</p>
                  )}
                </label>

                <label style={s.label}>
                  Confirm New Password
                  <span
                    style={{
                      ...s.inputShell,
                      ...(errors.confirm_password ? s.inputShellError : {}),
                    }}
                  >
                    <span aria-hidden="true">▣</span>
                    <input
                      style={s.input}
                      type={showPassword ? "text" : "password"}
                      name="confirm_password"
                      value={form.confirm_password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                    />
                  </span>
                  {errors.confirm_password ? (
                    <p style={s.fieldError}>{errors.confirm_password}</p>
                  ) : (
                    <p style={s.hint}>Passwords must match exactly.</p>
                  )}
                </label>

                <button
                  style={{
                    ...s.submit,
                    ...(loading ? s.submitDisabled : {}),
                  }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Update password"}{" "}
                  {!loading && <Arrow />}
                </button>
              </form>
            )}
          </div>

          {tokenValid === true && (
            <a href="/login" style={s.back}>
              ← Back to login
            </a>
          )}

          <p style={s.help}>
            Need help? Contact the Information Systems Administrator.
          </p>
        </div>
      </section>
    </main>
  );
}