import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const API = import.meta.env.VITE_API_URL;
const resolveFileUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API || "http://localhost:5000"}${u}`);

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}

const isFileField = (f) => f.fieldType === "File Upload";

const FileIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="28" height="28">
    <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" />
    <path d="M10 2v4h4" />
  </svg>
);

const AVATAR_PALETTE = [
  { bg: "#e9ddff", color: "#4a1fb8" },
  { bg: "#eaddff", color: "#5a00c6" },
  { bg: "#dcecff", color: "#0b4a8f" },
  { bg: "#e3f5e8", color: "#0f6b3a" },
  { bg: "#ffe4e6", color: "#9d174d" },
  { bg: "#fef3c7", color: "#92400e" },
];
function Avatar({ name = "", src = null, size = 26 }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImgFailed(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: palette.bg, color: palette.color,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 800,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Toast (lightweight, local to this page) ────────────────────────────────
function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000, display: "flex", flexDirection: "column", gap: 10 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === "success" ? "#059669" : t.type === "info" ? "#7c3aed" : "#dc2626",
          color: "white", borderRadius: 10, padding: "12px 16px", fontSize: 13, fontWeight: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 10,
          minWidth: 280, maxWidth: 360,
        }}>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  );
}

const T = {
  primary: "#6b38d4",
  primaryFixed: "#e9ddff",
  tertiary: "#5f5293",
  onSurface: "#181445",
  onSurfaceVariant: "#494454",
  surface: "#fcf8ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f2ff",
  surfaceVariant: "#e3dfff",
  outline: "#7b7486",
  outlineVariant: "#cbc3d7",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  inverseSurface: "#2d2a5b",
  inverseOnSurface: "#f3eeff",
};

const statusColors = {
  Pending: { bg: "#fef9c3", color: "#854d0e" },
  Reviewing: { bg: "#ede9fe", color: "#5b21b6" },
  Approved: { bg: "#d1fae5", color: "#065f46" },
  Rejected: { bg: "#fee2e2", color: "#991b1b" },
  Revision: { bg: "#fee2e2", color: "#991b1b" },
};

export default function DocumentReview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = getUser();
  const authHeaders = { Authorization: `Bearer ${token}` };
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };

  const [form, setForm] = useState(location.state?.form || null);
  const [loading, setLoading] = useState(!location.state?.form);
  const [loadError, setLoadError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const tid = Date.now();
    setToasts(prev => [...prev, { id: tid, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), 4000);
  };
  const dismissToast = (tid) => setToasts(prev => prev.filter(t => t.id !== tid));

  useEffect(() => { if (!token) navigate("/login"); }, []);

  // Fetch categories (used to push required-attachment fields to the bottom of "Submitted Fields")
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/categories`, { headers: authHeaders });
        if (!res.ok) return;
        const data = await res.json();
        setCategories((data.categories || []).filter(c => c.status === "Active" && c.type === "Form"));
      } catch { /* non-critical */ }
    })();
  }, []);

  // If we weren't handed the form via navigation state (e.g. direct link / refresh), fetch it by id.
  useEffect(() => {
    if (form) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/forms/${id}`, { headers: authHeaders });
        if (!res.ok) throw new Error("not found");
        const data = await res.json();
        setForm(data.form || data);
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const goBack = () => navigate(-1);

  const postDecision = async (action, requireNote, successMessage) => {
    if (requireNote && !reviewNote.trim()) {
      alert(requireNote);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/forms/${form.id}/${action}`, {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ note: reviewNote }),
      });
      if (!res.ok) {
        let message = `Action failed (${res.status}).`;
        try { const d = await res.clone().json(); message = d.message || d.error || message; } catch { /* ignore */ }
        alert(message);
        return;
      }
      addToast(successMessage, "success");
      setTimeout(() => navigate(-1), 500);
    } catch (err) {
      alert("Could not reach the server. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = () => postDecision("approve", null, "Form approved.");
  const handleReject = () => postDecision("reject", "Please provide a reason for rejection.", "Form rejected.");
  const handleRevise = () => postDecision("revise", "Please provide revision instructions for the faculty.", "Revision requested.");

  // ── Loading / error states (still rendered inside the Sidebar/TopBar shell) ──
  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: T.surface }}>
        <Sidebar activePage="forms" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          <TopBar onLogout={handleLogout}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.onSurface }}>Document Review</div>
          </TopBar>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.onSurfaceVariant, fontSize: 14 }}>
            Loading document…
          </div>
        </div>
      </div>
    );
  }
  if (loadError || !form) {
    return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: T.surface }}>
        <Sidebar activePage="forms" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          <TopBar onLogout={handleLogout}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.onSurface }}>Document Review</div>
          </TopBar>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ fontSize: 14, color: T.onSurfaceVariant }}>This form could not be found.</div>
            <button onClick={goBack} style={{ padding: "10px 18px", background: T.primary, color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ← Back to Review Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = form.file_name || form.tracking_id || `Form #${form.id}`;
  const submitterName = form.submitter_name || form.full_name || "Unknown Submitter";
  const filingDateRaw = form.filing_date || form.date || form.created_at;
  const filingDateLabel = filingDateRaw
    ? new Date(filingDateRaw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  // Dynamic "Submitted Fields" from Step 2 of the wizard
  let dynFields = null;
  try {
    dynFields = typeof form.field_values === "string" ? JSON.parse(form.field_values) : form.field_values;
  } catch { dynFields = null; }
  let dynEntries = dynFields ? Object.entries(dynFields) : [];
  const tmpl = categories.find(c => c.name === form.category);
  const fileFieldNames = new Set((tmpl?.formFields || []).filter(isFileField).map(f => f.name));
  dynEntries = [
    ...dynEntries.filter(([label]) => !fileFieldNames.has(label)),
    ...dynEntries.filter(([label]) => fileFieldNames.has(label)),
  ];

  // Derived audit trail (built from the data actually available on the form)
  const auditSteps = [
    { label: "Submitted", by: `by ${submitterName}`, when: filingDateLabel, active: true },
    { label: "Assigned", by: `to ${user.full_name || "Program Chair (You)"}`, when: filingDateLabel, active: true },
  ];
  if (form.status === "Revision") {
    auditSteps.push({ label: "Revision Requested", by: form.review_note ? "Feedback provided" : "Awaiting resubmission", when: "—", active: true });
  } else if (form.status === "Approved") {
    auditSteps.push({ label: "Approved", by: "by Program Chair", when: "—", active: true });
  } else if (form.status === "Rejected") {
    auditSteps.push({ label: "Rejected", by: "by Program Chair", when: "—", active: true });
  } else {
    auditSteps.push({ label: "Under Review", by: "by Program Chair (You)", when: "—", active: true });
  }

  const sc = statusColors[form.status] || statusColors.Pending;

  const url = form.file_url ? resolveFileUrl(form.file_url) : null;
  const ext = (form.file_name || form.file_url || "").split(".").pop().toLowerCase();
  const isImg = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'DM Sans', sans-serif", background: T.surface }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* ── SIDEBAR (persistent, same as the rest of the app) ── */}
      <Sidebar activePage="forms" />

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.surface, minWidth: 0, minHeight: 0, overflow: "hidden" }}>

        {/* ── TOPBAR (persistent, same as the rest of the app) ── */}
        <div style={{ flexShrink: 0, position: "relative", zIndex: 1, boxShadow: "0 2px 6px rgba(24,20,69,0.08)" }}>
        <TopBar onLogout={handleLogout} />
        </div>

        {/* ── PAGE HEADER (specific to this Document Review screen, sits below the app topbar) ── */}
        <div style={{ flexShrink: 0, borderBottom: `1px solid ${T.surfaceVariant}`, background: T.surfaceContainerLowest, padding: "14px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
              <button onClick={goBack} title="Back to Review Queue"
                style={{ background: "none", border: "none", cursor: "pointer", color: T.onSurfaceVariant, fontSize: 20, display: "flex", alignItems: "center", padding: 4, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = T.primary}
                onMouseLeave={e => e.currentTarget.style.color = T.onSurfaceVariant}>
                ←
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 1 }}>
                  Submissions / Documents
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <h1 style={{ fontSize: 16, fontWeight: 700, color: T.onSurface, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{displayName}</h1>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, background: sc.bg, color: sc.color, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    🕓 {form.status || "Pending"} Review
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {url && (
                <a href={url} download={form.file_name} target="_blank" rel="noreferrer"
                  style={{ padding: "8px 16px", border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.onSurface, textDecoration: "none", whiteSpace: "nowrap" }}>
                  Download Copy
                </a>
              )}
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); addToast("Link copied to clipboard.", "info"); }}
                style={{ padding: "8px 16px", border: `1px solid ${T.outlineVariant}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: T.onSurface, background: "white", cursor: "pointer", whiteSpace: "nowrap" }}>
                Share
              </button>
            </div>
          </div>
        </div>

      {/* ── Content ── */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* LEFT: document preview + audit trail */}
        <div style={{ flex: 1, minHeight: 0, padding: 24, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", borderRight: `1px solid ${T.surfaceVariant}` }}>

          {/* Document preview card */}
          <div style={{ flex: 1, background: "#d9c9f7", border: `1px solid ${T.surfaceVariant}`, borderRadius: 12, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
            {url && isImg ? (
              // Photos/screenshots: full-bleed, no paper skeuomorph — the image IS the surface.
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
                <img src={url} alt="Form Preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
              </div>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 24 }}>
                {/* White "page" the document sits on top of */}
                <div style={{ background: "white", borderRadius: 6, boxShadow: "0 4px 10px rgba(24,20,69,0.10), 0 12px 28px rgba(24,20,69,0.14)", width: "100%", maxWidth: 640, height: "100%", display: "flex", overflow: "hidden" }}>
                  {url ? (
                    isPdf ? (
                      <iframe src={`${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`} title="Form Preview" style={{ width: "100%", height: "100%", border: "none" }} />
                    ) : (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, color: T.onSurfaceVariant }}>
                        <FileIcon />
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.onSurface }}>{form.file_name || "Attached file"}</div>
                        <div style={{ fontSize: 11, color: T.outline }}>Preview not available for this file type.</div>
                      </div>
                    )
                  ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10, color: T.outline }}>
                      <FileIcon />
                      <div style={{ fontSize: 13, color: T.onSurfaceVariant }}>No file attached</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floating toolbar */}
            {url && (
              <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(45,42,91,0.9)", backdropFilter: "blur(8px)", color: T.inverseOnSurface, borderRadius: 999, padding: "8px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
                <a href={url} target="_blank" rel="noreferrer" download={form.file_name}
                  title="Download" style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>⬇</a>
                <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.25)" }} />
                <button onClick={() => window.open(url, "_blank")?.print?.()} title="Print"
                  style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", fontSize: 14 }}>🖶</button>
                <a href={url} target="_blank" rel="noreferrer" title="Open in new tab"
                  style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center" }}>↗</a>
              </div>
            )}
          </div>

          {/* Document audit trail */}
          <div style={{ background: T.surfaceContainerLowest, border: `1px solid ${T.surfaceVariant}`, borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: T.onSurface, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              🕘 Document Audit Trail
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
              {auditSteps.map((step, i) => (
                <div key={i} style={{ flex: 1, minWidth: 180, borderLeft: `2px solid ${step.active ? T.primary : T.surfaceVariant}`, paddingLeft: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.onSurface, marginBottom: 3 }}>{step.label}</div>
                  <div style={{ fontSize: 13, color: T.onSurfaceVariant, marginBottom: 3 }}>{step.by}</div>
                  <div style={{ fontSize: 11, color: T.outline }}>{step.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: metadata + review action */}
        <aside style={{ width: 400, flexShrink: 0, minHeight: 0, background: T.surfaceContainerLowest, padding: 24, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

          {/* Metadata */}
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: "0 0 12px" }}>Metadata</h2>
            <div style={{ background: T.surfaceContainerLow, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Submitter</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={submitterName} src={form.submitter_avatar ? resolveFileUrl(form.submitter_avatar) : null} />
                  <span style={{ fontSize: 13, color: T.onSurface, fontWeight: 600 }}>{submitterName}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Submission Date</div>
                  <div style={{ fontSize: 13, color: T.onSurface }}>{filingDateLabel}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Category</div>
                  <div style={{ fontSize: 13, color: T.onSurface }}>{form.category || "—"}</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: sc.color, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: sc.color, display: "inline-block" }} />
                  {form.status || "Pending"}
                </div>
              </div>
            </div>
          </section>

          {/* Submitted fields (from Step 2 of the wizard) */}
          {dynEntries.length > 0 && (
            <section>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: "0 0 12px" }}>Submitted Fields</h2>
              <div style={{ background: T.surfaceContainerLow, borderRadius: 12, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {dynEntries.map(([label, value]) => {
                  const display = value === null || value === "" ? "—" : String(value);
                  return (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 8, borderBottom: `1px solid ${T.surfaceVariant}` }}>
                      <span style={{ fontSize: 11, color: T.onSurfaceVariant, fontWeight: 600, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 12, color: T.onSurface, fontWeight: 600, textAlign: "right", wordBreak: "break-word" }}>{display}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Previous review note, if any */}
          {form.review_note && (
            <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Previous Review Note</div>
              <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>{form.review_note}</div>
            </div>
          )}

          <div style={{ height: 1, background: T.surfaceVariant, width: "100%" }} />

          {/* Review action */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.onSurface, margin: 0 }}>Review Action</h2>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.onSurface, marginBottom: 6, display: "block" }}>
                Feedback &amp; Comments <span style={{ color: T.error }}>*</span>
              </label>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Required for rejections and revisions. Detail what needs to be changed or why the document was approved with conditions..."
                rows={5}
                style={{ width: "100%", background: "white", border: `1px solid ${T.outlineVariant}`, borderRadius: 10, padding: 12, fontSize: 13, color: T.onSurface, resize: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = T.primary; e.target.style.boxShadow = `0 0 0 3px ${T.primaryFixed}`; }}
                onBlur={e => { e.target.style.borderColor = T.outlineVariant; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <button onClick={handleApprove} disabled={submitting}
                style={{ width: "100%", background: T.inverseSurface, color: T.inverseOnSurface, border: "none", borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                ✓ Approve Document
              </button>
              <button onClick={handleRevise} disabled={submitting}
                style={{ width: "100%", background: "white", color: T.tertiary, border: `2px solid ${T.tertiary}`, borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                ↩ Request Revision
              </button>
              <button onClick={handleReject} disabled={submitting}
                style={{ width: "100%", background: "white", color: T.error, border: `1px solid ${T.error}`, borderRadius: 10, padding: "13px 18px", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1 }}>
                ✗ Reject &amp; Archive
              </button>
            </div>
          </section>
        </aside>
      </main>
      </div>
    </div>
  );
}