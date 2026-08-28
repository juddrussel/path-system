import { useState, useEffect } from "react";
import logowhite from "../assets/logowhite.png";

const colors = {
  ink: "#2f2638",
  muted: "#82768a",
  violet: "#7c3aed",
  panel: "#f8f7ff",
  line: "#e7dfed",
};

const fontStack =
  '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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
    fontSize: "clamp(38px, 4vw, 56px)",
    fontWeight: 800,
    letterSpacing: "-.02em",
    lineHeight: 1.08,
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
    letterSpacing: "-.02em",
    lineHeight: 1.1,
  },
  subtitle: {
    maxWidth: 380,
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
  inputShellError: { borderColor: "#f1a8a8" },
  input: {
    width: "100%",
    minWidth: 0,
    border: 0,
    outline: 0,
    background: "transparent",
    color: colors.ink,
    font: `500 12px ${fontStack}`,
  },
  fieldError: { margin: "6px 0 0", color: "#d34848", fontSize: 10, fontWeight: 600 },
  alert: {
    marginBottom: 16,
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
  submit: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    minHeight: 46,
    marginTop: 18,
    border: 0,
    borderRadius: 8,
    background: "linear-gradient(135deg, #7c3aed, #8439f0)",
    color: "#fff",
    font: `800 11px ${fontStack}`,
    cursor: "pointer",
  },
  submitDisabled: { opacity: 0.65, cursor: "not-allowed" },
  back: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    margin: "20px auto 0",
    border: 0,
    padding: 0,
    background: "transparent",
    color: "#7144bf",
    font: `800 10px ${fontStack}`,
    textDecoration: "none",
    cursor: "pointer",
  },
  help: {
    margin: "22px 0 0",
    color: "#95899c",
    fontSize: 9,
    textAlign: "center",
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

function BackArrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      style={{ ...s.markSvg, width: 14, height: 14 }}
      aria-hidden="true"
    >
      <path d="M10 12L6 8l4-4" strokeLinecap="round" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, flex: "0 0 auto", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [alertMsg, setAlertMsg] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }

    setLoading(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: "success", text: "If that email is registered, a reset link has been sent. Check your inbox." });
        setEmail("");
      } else {
        setAlertMsg({ type: "error", text: data.message || "Something went wrong. Please try again." });
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
          <span style={styles.mark}>
            <img src={logowhite} alt="DS PATH logo" style={styles.markImg} />
          </span>
          <span>
            <span style={s.brandName}>DS PATH</span>
            <span style={s.brandSub}>Processing &amp; Tracking Hub</span>
          </span>
        </div>
        <div style={s.asideCopy}>
          <span style={s.kicker}>
            <i style={s.dot} /> Access recovery
          </span>
          <h1 style={s.asideTitle}>Get back to the work that matters.</h1>
          <p style={s.asideText}>
            Use your verified university email to regain access and continue
            managing the department&apos;s document workflow.
          </p>
        </div>
        <div style={s.asideNote}>
          <span style={s.noteLabel}>Account recovery</span>
          <span style={s.noteText}>
            One verified email can reopen your workflow.
          </span>
        </div>
      </aside>

      <section style={s.main}>
        <div style={s.wrap}>


          <header style={s.header}>
            <span style={s.headerKicker}>
              <i style={s.headerDot} /> Account recovery
            </span>
            <h2 style={s.title}>Forgot your password?</h2>
            <p style={s.subtitle}>
              Enter your university email and we&apos;ll send instructions to
              help you regain access to DS PATH.
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

            <form onSubmit={handleSubmit}>
              <label style={s.label}>
                Email Address
                <span style={{ ...s.inputShell, ...(error ? s.inputShellError : {}) }}>
                  <EnvelopeIcon />
                  <input
                    style={s.input}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    autoComplete="email"
                    placeholder="name@university.edu"
                    autoFocus
                  />
                </span>
                {error && <p style={s.fieldError}>{error}</p>}
              </label>

              <button
                style={{ ...s.submit, ...(loading ? s.submitDisabled : {}) }}
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset instructions"} <Arrow />
              </button>

              <a style={s.back} href="/login">
                <BackArrow /> Back to sign in
              </a>
            </form>
          </div>

          <p style={s.help}>
            Need help? Contact the Information Systems Administrator.
          </p>
        </div>
      </section>
    </main>
  );
}