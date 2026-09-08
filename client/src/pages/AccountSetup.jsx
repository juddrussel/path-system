import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logoImg from "../assets/logo.png";
import logowhite from "../assets/logowhite.png";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

function authHeaders() {
  const t = localStorage.getItem("token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function getUser() {
  try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); }
  catch { return {}; }
}

// ── Password strength helpers (matches Register.jsx) ──────────────────────────
function calcStrength(pw) {
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  return score;
}
const STRENGTH_LABEL = ["", "WEAK", "FAIR", "MEDIUM", "STRONG"];
const STRENGTH_COLOR = ["#e5e7eb", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"];
const STRENGTH_WIDTH = ["0%", "25%", "50%", "75%", "100%"];

export default function AccountSetup() {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const inviteToken     = searchParams.get("invite");

  // ── Page state ──────────────────────────────────────────────────────────────
  // invited: page 1 = profile, page 2 = credentials, redirect on save
  // oauth:   page 1 = profile, page 2 = pending screen
  const [page, setPage]           = useState(1);

  // Page 1 — profile
  const [fullName, setFullName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  // Page 2 — credentials (invited only)
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [showPw, setShowPw]             = useState(false);
  const [credSaving, setCredSaving]     = useState(false);
  const [credError, setCredError]       = useState("");
  const pwStrength  = calcStrength(password);
  const pwReqs = [
    { label: "At least 8 characters",  met: password.length >= 8 },
    { label: "One uppercase letter",    met: /[A-Z]/.test(password) },
    { label: "One number",             met: /[0-9]/.test(password) },
    { label: "One special character",  met: /[^A-Za-z0-9]/.test(password) },
  ];

  // Invite token validation
  const [tokenLoading, setTokenLoading] = useState(!!inviteToken);
  const [tokenError, setTokenError]     = useState("");
  const [isInvited, setIsInvited]       = useState(false);

  // ── On mount: validate invite token if present ──────────────────────────────
  useEffect(() => {
    if (!inviteToken) {
      if (!localStorage.getItem("token")) navigate("/login");
      else setFullName(getUser().full_name || "");
      return;
    }
    (async () => {
      try {
        const res  = await fetch(`${API}/auth/invite/${inviteToken}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Invalid or expired invite link.");
        localStorage.setItem("token", data.token);
        setIsInvited(true);
        const emailLocal = (data.email || "").split("@")[0].replace(/[._-]/g, " ");
        setFullName(emailLocal);
      } catch (e) {
        setTokenError(e.message);
      } finally {
        setTokenLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Page 1 submit: save profile + finalize ──────────────────────────────────
  const handleSubmit = async () => {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim())    { setError("Contact number is required."); return; }
    setSaving(true); setError("");
    try {
      const user = getUser();

      // 1. Save name + phone
      const patchRes = await fetch(`${API}/users/${user.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });
      if (!patchRes.ok) {
        const e = await patchRes.json().catch(() => ({}));
        throw new Error(e.message || "Failed to save profile.");
      }

      // 2. Finalize — auto-approves invited users and returns a fresh JWT
      const finalRes  = await fetch(`${API}/users/${user.id}/finalize-setup`, {
        method: "POST",
        headers: authHeaders(),
      });
      const finalData = await finalRes.json().catch(() => ({}));

      // Store updated JWT if returned
      if (finalData.token) localStorage.setItem("token", finalData.token);

      if (isInvited) {
        // Invited: move to credentials step (page 2)
        setPage(2);
        return;
      }

      // Regular OAuth user — show pending approval screen
      setPage(2);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Page 2 submit (invited only): set username + password ───────────────────
  const handleCredentials = async () => {
    if (!username.trim()) { setCredError("Username is required."); return; }
    if (!/^[a-z0-9_]+$/.test(username.trim())) { setCredError("Lowercase letters, numbers, and underscores only."); return; }
    if (!password)         { setCredError("Password is required."); return; }
    if (password.length < 8) { setCredError("Password must be at least 8 characters."); return; }
    if (password !== confirmPw) { setCredError("Passwords do not match."); return; }

    setCredSaving(true); setCredError("");
    try {
      const user = getUser();
      const res  = await fetch(`${API}/users/${user.id}/set-credentials`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to set credentials.");

      // Swap in the final JWT (now has the real username)
      if (data.token) localStorage.setItem("token", data.token);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setCredError(e.message);
    } finally {
      setCredSaving(false);
    }
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (tokenLoading) {
    return (
      <main style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f8f7ff", fontFamily:"'DM Sans',sans-serif" }}>
        <style>{`@keyframes as-spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:48, height:48, border:"3px solid #ede9fe", borderTopColor:"#7c3aed", borderRadius:"50%", animation:"as-spin 0.7s linear infinite", margin:"0 auto 16px" }} />
          <p style={{ color:"#7b6f8a", fontSize:14 }}>Validating your invitation…</p>
        </div>
      </main>
    );
  }

  // ── Invalid / expired invite token ─────────────────────────────────────────
  if (tokenError) {
    return (
      <main style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f8f7ff", fontFamily:"'DM Sans',sans-serif", padding:24 }}>
        <div style={{ width:"min(420px,100%)", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#fff1f2", border:"2px solid #fecdd3", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" width="32" height="32">
              <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
          <h1 style={{ margin:"0 0 8px", fontSize:22, fontWeight:800, color:"#1f1533" }}>Invite link expired</h1>
          <p style={{ margin:"0 0 24px", fontSize:14, color:"#7b6f8a", lineHeight:1.6 }}>{tokenError}</p>
          <p style={{ margin:"0 0 24px", fontSize:13, color:"#9b8eaa" }}>Please ask an administrator to send you a new invite.</p>
          <button onClick={() => navigate("/login")} style={{ padding:"11px 28px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#4c1d95,#7c3aed)", color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
            Back to login
          </button>
        </div>
      </main>
    );
  }

  // ── Step count: invited = 3 steps (profile / credentials / done→redirect), oauth = 2 ──
  const totalSteps = isInvited ? 3 : 2;

  return (
    <main style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        .as-aside { position:relative; overflow:hidden; width:420px; flex-shrink:0; background:linear-gradient(160deg,#1a0533 0%,#2d0a5e 40%,#4a1272 70%,#6b21a8 100%); display:flex; flex-direction:column; justify-content:space-between; padding:48px 44px 44px; }
        @media(max-width:820px){.as-aside{display:none;}}
        .as-orb { position:absolute; border-radius:50%; background:rgba(167,139,250,0.12); pointer-events:none; }
        .as-main { flex:1; display:flex; align-items:center; justify-content:center; background:#f8f7ff; padding:40px 24px; }
        .as-card { width:min(440px,100%); animation:as-in 0.35s ease both; }
        @keyframes as-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .as-steps { display:flex; align-items:center; gap:8px; margin-bottom:32px; }
        .as-step { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; transition:all 0.3s; }
        .as-step.done    { background:linear-gradient(135deg,#a78bfa,#7c3aed); color:#fff; box-shadow:0 4px 12px rgba(124,58,237,0.35); }
        .as-step.active  { background:linear-gradient(135deg,#4c1d95,#7c3aed); color:#fff; box-shadow:0 0 0 4px rgba(124,58,237,0.18); }
        .as-step.pending { background:#ede9fe; color:#c4b5fd; }
        .as-connector { flex:1; height:2px; border-radius:99px; transition:background 0.3s; }
        .as-connector.done { background:linear-gradient(90deg,#a78bfa,#7c3aed); }
        .as-connector.pending { background:#ede9fe; }
        .as-heading { margin:0 0 4px; font-size:26px; font-weight:800; color:#1f1533; font-family:Manrope,'DM Sans',sans-serif; letter-spacing:-0.045em; line-height:1.1; }
        .as-sub     { margin:0 0 28px; font-size:13px; color:#9080a0; line-height:1.6; }
        .as-label   { display:block; font-size:11px; font-weight:800; color:#6b5f76; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.07em; }
        .as-input   { width:100%; padding:12px 14px; border:1.5px solid #e8e1f5; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#27213a; outline:none; background:#fff; transition:border-color 0.15s,box-shadow 0.15s; }
        .as-input:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(124,58,237,0.12); }
        .as-input::placeholder { color:#c4b5d1; }
        .as-input-wrap { position:relative; }
        .as-input-wrap .as-input { padding-left:38px; }
        .as-input-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:#c4b5d1; display:flex; pointer-events:none; }
        .as-input-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#b0a3ba; padding:0; display:flex; }
        .as-input-eye:hover { color:#7c3aed; }
        .as-btn { width:100%; padding:13px; border-radius:11px; border:none; background:linear-gradient(135deg,#4c1d95,#7c3aed); color:#fff; font-size:14px; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; box-shadow:0 6px 20px rgba(124,58,237,0.3); transition:opacity 0.15s,transform 0.12s; }
        .as-btn:hover:not(:disabled) { opacity:0.92; transform:translateY(-1px); }
        .as-btn:disabled { opacity:0.55; cursor:not-allowed; }
        .as-err { display:flex; align-items:center; gap:8px; margin-top:14px; padding:10px 13px; border-radius:9px; background:#fff1f2; border:1px solid #fecdd3; }
        .as-err span { font-size:12px; color:#dc2626; font-weight:600; }
        .as-field-err { margin:5px 0 0; font-size:10px; color:#d34848; font-weight:600; }
        .as-strength-track { height:4px; background:#f0ecf5; border-radius:99px; margin:8px 0 10px; }
        .as-strength-fill  { height:100%; border-radius:99px; transition:width .3s,background .3s; }
        .as-req-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 12px; margin-top:2px; }
        .as-req-item { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:600; }
        @keyframes as-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        .as-pending-icon { animation:as-pulse 2.5s ease-in-out infinite; }
        .as-step-row { display:flex; align-items:center; gap:12px; padding:13px 16px; border-bottom:1px solid #f0eafc; }
        .as-step-row:last-child { border-bottom:none; }
        .as-step-dot { width:30px; height:30px; border-radius:50%; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:13px; }
      `}</style>

      {/* ── Left brand panel ── */}
      <aside className="as-aside">
        <div className="as-orb" style={{ width:280, height:280, top:-80, right:-80 }} />
        <div className="as-orb" style={{ width:180, height:180, bottom:40, left:-60 }} />
        <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 1.5px)", backgroundSize:"18px 18px", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:52 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src={logowhite} alt="DS PATH" style={{ width:26, height:26, objectFit:"contain" }} />
            </div>
            <div>
              <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#f5f3ff", letterSpacing:"0.06em" }}>DS PATH</p>
              <p style={{ margin:0, fontSize:9, color:"rgba(216,180,254,0.6)", letterSpacing:"0.12em", textTransform:"uppercase" }}>Processing & Tracking Hub</p>
            </div>
          </div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"5px 10px", borderRadius:99, background:"rgba(167,139,250,0.15)", border:"1px solid rgba(167,139,250,0.25)", marginBottom:18 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#a78bfa", display:"inline-block" }} />
            <span style={{ fontSize:10, fontWeight:700, color:"rgba(216,180,254,0.8)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Account setup</span>
          </div>
          <h1 style={{ margin:"0 0 14px", fontSize:32, fontWeight:800, color:"#f5f3ff", fontFamily:"Manrope,'DM Sans',sans-serif", letterSpacing:"-0.05em", lineHeight:1.1 }}>
            {isInvited ? "You've been invited!" : "Welcome to DS PATH."}
          </h1>
          <p style={{ margin:0, fontSize:13, color:"rgba(216,180,254,0.7)", lineHeight:1.7 }}>
            {isInvited
              ? "Complete your profile and set your login credentials to activate your account instantly."
              : "Set up your profile so the department knows who you are. Your account will be reviewed before you gain access."
            }
          </p>
        </div>
        <div style={{ position:"relative", zIndex:1 }}>
          {[
            { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><path d="M4 1.5h6l3 3V13a1 1 0 01-1 1H4a1 1 0 01-1-1V2.5a1 1 0 011-1z" strokeLinejoin="round"/><path d="M5.5 7.5h5M5.5 10h5M5.5 5h2.5" strokeLinecap="round"/></svg>, text:"Submit and track academic documents" },
            { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><path d="M8 1.8a1 1 0 011 1v.5c2 .4 3.4 2.1 3.4 4.2v2.3l1.1 1.8c.2.3 0 .8-.4.8H2.9c-.4 0-.6-.5-.4-.8L3.6 9.8V7.5c0-2.1 1.4-3.8 3.4-4.2v-.5a1 1 0 011-1z" strokeLinejoin="round"/><path d="M6.3 13.4a1.7 1.7 0 003.4 0" strokeLinecap="round"/></svg>, text:"Get notified on every handoff" },
            { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><path d="M8 1.5l5.2 1.9v3.8c0 3.4-2.2 6-5.2 7-3-.9-5.2-3.6-5.2-7V3.4L8 1.5z" strokeLinejoin="round"/><path d="M5.7 8l1.6 1.6 3-3.2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text:"Secure, role-based access control" },
          ].map((f, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:i < 2 ? 14 : 0 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(216,180,254,0.85)", flexShrink:0 }}>{f.icon}</div>
              <span style={{ fontSize:12, color:"rgba(216,180,254,0.75)", lineHeight:1.5 }}>{f.text}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right form panel ── */}
      <div className="as-main">
        <div className="as-card">

          {/* Step indicators */}
          <div className="as-steps">
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepNum = i + 1;
              const cls = page > stepNum ? "done" : page === stepNum ? "active" : "pending";
              return (
                <>
                  <div key={stepNum} className={`as-step ${cls}`}>{page > stepNum ? "✓" : stepNum}</div>
                  {i < totalSteps - 1 && <div key={`c${i}`} className={`as-connector ${page > stepNum ? "done" : "pending"}`} />}
                </>
              );
            })}
            <div style={{ flex:1 }} />
            <span style={{ fontSize:11, color:"#b0a3ba", fontWeight:600 }}>Step {page} of {totalSteps}</span>
          </div>

          {/* ── PAGE 1: Profile ── */}
          {page === 1 && (
            <div style={{ animation:"as-in 0.3s ease both" }}>
              <h1 className="as-heading">Complete your profile</h1>
              <p className="as-sub">
                {isInvited
                  ? "First, tell us your name and contact number."
                  : "Tell us your name and contact number so we can set up your account."
                }
              </p>

              {isInvited && (
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, padding:"9px 13px", borderRadius:9, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M13 4l-7 8-3-3"/></svg>
                  <span style={{ fontSize:12, color:"#166534", fontWeight:600 }}>You were invited — your account activates instantly after setup.</span>
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                <div>
                  <label className="as-label">Full name <span style={{color:"#dc2626"}}>*</span></label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round"/></svg></span>
                    <input className="as-input" value={fullName} onChange={e => { setFullName(e.target.value); setError(""); }} placeholder="e.g. Juan dela Cruz" autoFocus />
                  </div>
                </div>
                <div>
                  <label className="as-label">Contact number <span style={{color:"#dc2626"}}>*</span></label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><path d="M3 2h3l1.5 3.5-1.8 1a9 9 0 004.8 4.8l1-1.8L15 11v3a1 1 0 01-1 1A13 13 0 012 3a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                    <input className="as-input" value={phone} onChange={e => { setPhone(e.target.value); setError(""); }} placeholder="+63 912 345 6789" type="tel" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="as-err">
                  <svg viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="2" width="12" height="12" strokeLinecap="round"><path d="M12 4L4 12M4 4l8 8"/></svg>
                  <span>{error}</span>
                </div>
              )}

              <button className="as-btn" style={{ marginTop:28 }} onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : isInvited ? "Next: set credentials →" : "Submit & continue →"}
              </button>

              {!isInvited && (
                <p style={{ margin:"16px 0 0", textAlign:"center", fontSize:11, color:"#c4b5d1" }}>
                  Your account will be reviewed by an administrator before activation.
                </p>
              )}
            </div>
          )}

          {/* ── PAGE 2 (invited): Set username + password ── */}
          {page === 2 && isInvited && (
            <div style={{ animation:"as-in 0.3s ease both" }}>
              <h1 className="as-heading">Set your login</h1>
              <p className="as-sub">Choose a username and a strong password to log in with.</p>

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

                {/* Username */}
                <div>
                  <label className="as-label">Username <span style={{color:"#dc2626"}}>*</span></label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round"/></svg></span>
                    <input
                      className="as-input"
                      value={username}
                      onChange={e => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setCredError(""); }}
                      placeholder="e.g. jdelacruz"
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  <p style={{ margin:"5px 0 0", fontSize:10, color:"#9b8eaa" }}>Lowercase letters, numbers, and underscores only.</p>
                </div>

                {/* Password */}
                <div>
                  <label className="as-label">Password <span style={{color:"#dc2626"}}>*</span></label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><rect x="3" y="7" width="10" height="7" rx="1" strokeLinejoin="round"/><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/></svg></span>
                    <input
                      className="as-input"
                      style={{ paddingRight:40 }}
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setCredError(""); }}
                      placeholder="Create a password"
                      autoComplete="new-password"
                    />
                    <button className="as-input-eye" type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? "Hide" : "Show"}>
                      {showPw
                        ? <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16" strokeLinecap="round"><path d="M3 3l14 14M10 4C5.5 4 2 10 2 10s1.2 1.8 3 3.3M10 16c4.5 0 8-6 8-6s-1-1.6-2.7-3"/><path d="M10 13a3 3 0 01-2.8-4M12.8 7.2A3 3 0 0110 7"/></svg>
                        : <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16" strokeLinecap="round"><path d="M2 10s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z"/><circle cx="10" cy="10" r="2.5"/></svg>
                      }
                    </button>
                  </div>
                  {/* Strength meter */}
                  {password && (
                    <div style={{ marginTop:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:9, fontWeight:800, color:"#a095a8", textTransform:"uppercase", letterSpacing:".08em" }}>Security strength</span>
                        <span style={{ fontSize:9, fontWeight:800, color: STRENGTH_COLOR[pwStrength] }}>{STRENGTH_LABEL[pwStrength]}</span>
                      </div>
                      <div className="as-strength-track">
                        <div className="as-strength-fill" style={{ width: STRENGTH_WIDTH[pwStrength], background: STRENGTH_COLOR[pwStrength] }} />
                      </div>
                      <div className="as-req-grid">
                        {pwReqs.map(r => (
                          <div key={r.label} className="as-req-item" style={{ color: r.met ? "#22c55e" : "#a095a8" }}>
                            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              {r.met ? <path d="M2 6l3 3 5-5"/> : <circle cx="6" cy="6" r="4"/>}
                            </svg>
                            {r.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="as-label">Confirm password <span style={{color:"#dc2626"}}>*</span></label>
                  <div className="as-input-wrap">
                    <span className="as-input-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" width="15" height="15"><rect x="3" y="7" width="10" height="7" rx="1" strokeLinejoin="round"/><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/></svg></span>
                    <input
                      className="as-input"
                      type={showPw ? "text" : "password"}
                      value={confirmPw}
                      onChange={e => { setConfirmPw(e.target.value); setCredError(""); }}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                  </div>
                  {/* Inline match indicator */}
                  {confirmPw && (
                    <p style={{ margin:"5px 0 0", fontSize:10, fontWeight:600, color: confirmPw === password ? "#22c55e" : "#ef4444" }}>
                      {confirmPw === password ? "✓ Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>
              </div>

              {credError && (
                <div className="as-err" style={{ marginTop:14 }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="2" width="12" height="12" strokeLinecap="round"><path d="M12 4L4 12M4 4l8 8"/></svg>
                  <span>{credError}</span>
                </div>
              )}

              <button className="as-btn" style={{ marginTop:24 }} onClick={handleCredentials} disabled={credSaving}>
                {credSaving ? "Activating…" : "Activate my account →"}
              </button>
            </div>
          )}

          {/* ── PAGE 2 (non-invited OAuth): Pending approval ── */}
          {page === 2 && !isInvited && (
            <div style={{ animation:"as-in 0.3s ease both", textAlign:"center" }}>
              <div className="as-pending-icon" style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 20px", background:"linear-gradient(135deg,#ede9fe,#ddd6fe)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 28px rgba(124,58,237,0.18)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h1 className="as-heading" style={{ marginBottom:8 }}>You're all set!</h1>
              <p className="as-sub" style={{ marginBottom:24 }}>
                Your profile has been submitted. An administrator will review and activate your account shortly.
              </p>
              <div style={{ background:"#faf8ff", border:"1px solid #ede9fe", borderRadius:14, overflow:"hidden", marginBottom:24, textAlign:"left" }}>
                {[
                  { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M13 4l-7 8-3-3" strokeLinecap="round"/></svg>, iconBg:"linear-gradient(135deg,#a78bfa,#7c3aed)", iconColor:"#fff", label:"Account created",        sub:"Profile saved successfully",      done:true  },
                  { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6.3"/><path d="M8 4.6v3.6l2.5 1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>, iconBg:"#fff7ed", iconColor:"#c2410c", label:"Awaiting admin approval", sub:"Your request is being reviewed",  done:false, active:true },
                  { icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M8 1.5l5.2 1.9v3.8c0 3.4-2.2 6-5.2 7-3-.9-5.2-3.6-5.2-7V3.4L8 1.5z" strokeLinejoin="round"/></svg>, iconBg:"#f4f0fc", iconColor:"#c4b5d1", label:"Access granted",          sub:"You'll be notified by email",      done:false },
                ].map((s, i) => (
                  <div key={i} className="as-step-row">
                    <div className="as-step-dot" style={{ background:s.iconBg, color:s.iconColor }}>{s.icon}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontSize:13, fontWeight:700, color:s.done ? "#3b2a52" : s.active ? "#92400e" : "#b0a3ba" }}>{s.label}</p>
                      <p style={{ margin:"2px 0 0", fontSize:11, color:s.done ? "#7c3aed" : s.active ? "#b45309" : "#c4b5d1" }}>{s.sub}</p>
                    </div>
                    {s.active && <span style={{ fontSize:10, fontWeight:800, color:"#f97316", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:99, padding:"2px 9px", flexShrink:0 }}>Pending</span>}
                  </div>
                ))}
              </div>
              <div style={{ padding:"12px 14px", borderRadius:10, background:"#f5f3ff", border:"1px solid #ede9fe", marginBottom:24 }}>
                <p style={{ margin:0, fontSize:12, color:"#7c3aed", fontWeight:700 }}>
                  Need help? Contact your administrator at{" "}
                  <a href="mailto:dspathsystem@gmail.com" style={{ color:"#7c3aed" }}>dspathsystem@gmail.com</a>
                </p>
              </div>
              <button className="as-btn" style={{ background:"linear-gradient(135deg,#2d0a5e,#6b21a8)" }} onClick={() => { localStorage.removeItem("token"); navigate("/login"); }}>
                Back to login
              </button>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
