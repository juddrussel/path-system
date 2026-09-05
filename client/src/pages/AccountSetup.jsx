import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function getUser() {
  try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); }
  catch { return {}; }
}

export default function AccountSetup() {
  const navigate  = useNavigate();
  const user      = getUser();
  const [page, setPage]         = useState(1); // 1 = setup form, 2 = pending approval
  const [fullName, setFullName] = useState(user.full_name || "");
  const [phone, setPhone]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, []);

  const handleSubmit = async () => {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    if (!phone.trim())    { setError("Contact number is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });
      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || "Save failed."); }
      setPage(2);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a0533 0%,#4a1272 50%,#6b21a8 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@700;800&display=swap');
        @keyframes setup-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes setup-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:0.85} }
        .setup-input { width:100%; padding:12px 14px; border:1.5px solid #e8e1f5; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#27213a; outline:none; background:#fff; box-sizing:border-box; transition:border-color 0.15s,box-shadow 0.15s; }
        .setup-input:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(124,58,237,0.12); }
        .setup-btn { width:100%; padding:13px; border-radius:11px; border:none; background:linear-gradient(135deg,#4c1d95,#7c3aed); color:#fff; font-size:14px; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; box-shadow:0 6px 20px rgba(124,58,237,0.35); transition:opacity 0.15s; }
        .setup-btn:hover { opacity:0.9; }
        .setup-btn:disabled { opacity:0.55; cursor:not-allowed; }
      `}</style>

      <div style={{ width:"min(440px,100%)", animation:"setup-in 0.35s ease both" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:32 }}>
          <img src={logoImg} alt="DS PATH" style={{ width:40, height:40, filter:"drop-shadow(0 4px 10px rgba(196,181,253,0.5))" }} />
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#f5f3ff", letterSpacing:"0.06em" }}>DS PATH</p>
            <p style={{ margin:0, fontSize:10, color:"rgba(216,180,254,0.7)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Processing & Tracking Hub</p>
          </div>
        </div>

        {/* Card */}
        <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px 32px", boxShadow:"0 28px 70px rgba(0,0,0,0.25)" }}>

          {page === 1 && (
            <>
              <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:800, color:"#27213a", fontFamily:"Manrope,'DM Sans',sans-serif", letterSpacing:"-0.04em" }}>
                Set up your account
              </p>
              <p style={{ margin:"0 0 28px", fontSize:13, color:"#9080a0", lineHeight:1.6 }}>
                Complete your profile to get started with DS PATH.
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6b5f76", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    Full name <span style={{color:"#dc2626"}}>*</span>
                  </label>
                  <input
                    className="setup-input"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(""); }}
                    placeholder="e.g. Juan dela Cruz"
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6b5f76", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                    Contact number <span style={{color:"#dc2626"}}>*</span>
                  </label>
                  <input
                    className="setup-input"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setError(""); }}
                    placeholder="+63 912 345 6789"
                    type="tel"
                  />
                </div>
              </div>

              {error && (
                <p style={{ margin:"14px 0 0", fontSize:12, color:"#dc2626", fontWeight:600 }}>{error}</p>
              )}

              <button className="setup-btn" style={{ marginTop:26 }} onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving…" : "Submit →"}
              </button>
            </>
          )}

          {page === 2 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:0 }}>
              {/* Animated clock/pending icon */}
              <div style={{
                width:68, height:68, borderRadius:"50%", marginBottom:20,
                background:"linear-gradient(135deg,#ede9fe,#ddd6fe)",
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 8px 24px rgba(124,58,237,0.2)",
                animation:"setup-pulse 2.5s ease-in-out infinite",
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>

              <p style={{ margin:"0 0 8px", fontSize:20, fontWeight:800, color:"#27213a", fontFamily:"Manrope,'DM Sans',sans-serif", letterSpacing:"-0.04em" }}>
                Account submitted!
              </p>
              <p style={{ margin:"0 0 20px", fontSize:13, color:"#9080a0", lineHeight:1.65 }}>
                Your account is now <strong style={{color:"#7c3aed"}}>pending approval</strong>. An administrator will review and activate your account shortly.
              </p>

              {/* Status steps */}
              <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:0, margin:"4px 0 24px", background:"#faf8ff", borderRadius:12, border:"1px solid #ede9fe", overflow:"hidden" }}>
                {[
                  { icon:"✓", label:"Account created",        done:true  },
                  { icon:"⏳", label:"Awaiting admin approval", done:false },
                  { icon:"🎉", label:"Access granted",          done:false },
                ].map((step, i, arr) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom: i < arr.length-1 ? "1px solid #ede9fe" : "none" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13,
                      background: step.done ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "#f4f0fc",
                      color: step.done ? "#fff" : "#b0a3ba",
                    }}>
                      {step.icon}
                    </div>
                    <span style={{ fontSize:13, fontWeight: step.done ? 700 : 500, color: step.done ? "#3b2a52" : "#b0a3ba" }}>
                      {step.label}
                    </span>
                    {i === 1 && (
                      <span style={{ marginLeft:"auto", fontSize:10, fontWeight:800, color:"#f97316", background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:99, padding:"2px 8px" }}>
                        Pending
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <p style={{ margin:"0 0 20px", fontSize:12, color:"#b0a3ba", lineHeight:1.6 }}>
                You'll receive a notification once your account has been approved. Please check back later or contact your department administrator.
              </p>

              <button
                className="setup-btn"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/login");
                }}
                style={{ background:"linear-gradient(135deg,#2d0a5e,#6b21a8)" }}
              >
                Back to login
              </button>
            </div>
          )}
        </div>

        <p style={{ margin:"20px 0 0", textAlign:"center", fontSize:11, color:"rgba(216,180,254,0.4)" }}>
          DS PATH · Document Processing &amp; Tracking Hub
        </p>
      </div>
    </div>
  );
}
