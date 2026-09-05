import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

const API        = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL =  import.meta.env.VITE_API_URL  || "http://localhost:5000";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function getUser() {
  try { return JSON.parse(atob(localStorage.getItem("token").split(".")[1])); }
  catch { return {}; }
}
function fullAvatarUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${SERVER_URL}${url}`;
}
function initials(name = "") {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0][0].toUpperCase();
  return (p[0][0] + p[p.length-1][0]).toUpperCase();
}

// ─── Image crop (same as TopBar) ─────────────────────────────────────────────
const CROP_SIZE = 240, OUTPUT_SIZE = 480, MAX_ZOOM = 4;

function ImageCropModal({ src, onCancel, onConfirm }) {
  const [nat, setNat]       = useState(null);
  const [base, setBase]     = useState(1);
  const [zoom, setZoom]     = useState(1);
  const [off, setOff]       = useState({ x:0, y:0 });
  const [exporting, setExp] = useState(false);
  const imgRef = useRef(); const drag = useRef(false); const lp = useRef({x:0,y:0});

  const onLoad = () => {
    const img = imgRef.current; if (!img) return;
    const cover = Math.max(CROP_SIZE/img.naturalWidth, CROP_SIZE/img.naturalHeight);
    setNat({w:img.naturalWidth,h:img.naturalHeight}); setBase(cover); setZoom(1); setOff({x:0,y:0});
  };
  const sc = base*zoom, dw = nat?nat.w*sc:0, dh = nat?nat.h*sc:0;
  const clamp = useCallback((o,w=dw,h=dh)=>({
    x:Math.min(Math.max(0,(w-CROP_SIZE)/2),(Math.max(0,(w-CROP_SIZE)/2)-Math.max(-Math.max(0,(w-CROP_SIZE)/2),Math.min(Math.max(0,(w-CROP_SIZE)/2),o.x)))==0?o.x:o.x),
    y:Math.min(Math.max(0,(h-CROP_SIZE)/2),(Math.max(0,(h-CROP_SIZE)/2)-Math.max(-Math.max(0,(h-CROP_SIZE)/2),Math.min(Math.max(0,(h-CROP_SIZE)/2),o.y)))==0?o.y:o.y),
  }),[dw,dh]);
  const clampSimple = (o,w=dw,h=dh)=>{
    const mx=Math.max(0,(w-CROP_SIZE)/2), my=Math.max(0,(h-CROP_SIZE)/2);
    return {x:Math.min(mx,Math.max(-mx,o.x)),y:Math.min(my,Math.max(-my,o.y))};
  };
  useEffect(()=>{setOff(o=>clampSimple(o));},[zoom,nat]); // eslint-disable-line
  const onPD=(e)=>{drag.current=true;lp.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture?.(e.pointerId);};
  const onPM=(e)=>{if(!drag.current)return;const dx=e.clientX-lp.current.x,dy=e.clientY-lp.current.y;lp.current={x:e.clientX,y:e.clientY};setOff(o=>clampSimple({x:o.x+dx,y:o.y+dy}));};
  const onPU=()=>{drag.current=false;};
  const onW=(e)=>{e.preventDefault();setZoom(z=>Math.min(MAX_ZOOM,Math.max(1,+(z+(e.deltaY>0?-0.1:0.1)).toFixed(2))));};
  const confirm=()=>{
    if(!imgRef.current||!nat)return; setExp(true);
    const cv=document.createElement("canvas"); cv.width=OUTPUT_SIZE; cv.height=OUTPUT_SIZE;
    const ctx=cv.getContext("2d");
    const sW=CROP_SIZE/sc,sH=CROP_SIZE/sc,sx=(dw/2-CROP_SIZE/2-off.x)/sc,sy=(dh/2-CROP_SIZE/2-off.y)/sc;
    ctx.drawImage(imgRef.current,sx,sy,sW,sH,0,0,OUTPUT_SIZE,OUTPUT_SIZE);
    cv.toBlob(b=>{setExp(false);if(b)onConfirm(b);},"image/jpeg",0.92);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{width:340,background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 24px 60px rgba(0,0,0,0.22)"}}>
        <div style={{padding:"16px 20px 6px"}}>
          <p style={{margin:0,fontSize:14,fontWeight:800,color:"#1f1533"}}>Adjust your photo</p>
          <p style={{margin:"2px 0 0",fontSize:11,color:"#9080a0"}}>Drag to move · scroll or slider to zoom</p>
        </div>
        <div style={{display:"flex",justifyContent:"center",padding:"16px 0"}}>
          <div style={{width:CROP_SIZE,height:CROP_SIZE,borderRadius:"50%",border:"2px solid #ddd6fe",overflow:"hidden",background:"#f3f4f6",cursor:"grab",touchAction:"none",position:"relative",userSelect:"none"}}
            onPointerDown={onPD} onPointerMove={onPM} onPointerUp={onPU} onPointerLeave={onPU} onWheel={onW}>
            <img ref={imgRef} src={src} alt="" onLoad={onLoad} draggable={false}
              style={{position:"absolute",top:"50%",left:"50%",width:nat?nat.w*sc:"auto",height:nat?nat.h*sc:"auto",maxWidth:"none",maxHeight:"none",transform:`translate(calc(-50% + ${off.x}px),calc(-50% + ${off.y}px))`,pointerEvents:"none"}}/>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",boxShadow:"inset 0 0 0 1px rgba(0,0,0,0.1)",pointerEvents:"none"}}/>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"0 20px 8px"}}>
          <span style={{color:"#9ca3af",fontSize:14}}>−</span>
          <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={zoom} onChange={e=>setZoom(parseFloat(e.target.value))} style={{flex:1,accentColor:"#7c3aed"}}/>
          <span style={{color:"#9ca3af",fontSize:14}}>+</span>
        </div>
        <div style={{display:"flex",gap:8,padding:"10px 20px 16px"}}>
          <button onClick={onCancel} style={{flex:1,padding:"9px",borderRadius:9,border:"1px solid #e5e7eb",background:"#fff",color:"#4b5563",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Cancel</button>
          <button onClick={confirm} disabled={!nat||exporting} style={{flex:1,padding:"9px",borderRadius:9,border:"none",background:"#7c3aed",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:(!nat||exporting)?0.6:1}}>
            ✓ {exporting?"Applying…":"Use Photo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Setup Page ──────────────────────────────────────────────────────────
export default function AccountSetup() {
  const navigate  = useNavigate();
  const user      = getUser();
  const [page, setPage]           = useState(1);
  const [fullName, setFullName]   = useState(user.full_name || "");
  const [phone, setPhone]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [cropSrc, setCropSrc]     = useState(null);
  const [preview, setPreview]     = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, []);

  // ── Page 1: Save name + phone ─────────────────────────────────────────────
  const handlePage1 = async () => {
    if (!fullName.trim()) { setError("Full name is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save.");
      setPage(2);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  // ── Page 2: Upload photo ──────────────────────────────────────────────────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image."); return; }
    if (file.size > 5*1024*1024) { setError("Image must be under 5 MB."); return; }
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };
  const handleCropConfirm = (blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (preview) URL.revokeObjectURL(preview);
    setPhotoFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    setPreview(URL.createObjectURL(blob));
  };

  const handleUploadAndFinish = async () => {
    if (!photoFile) { navigate("/dashboard"); return; }
    setUploading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", photoFile);
      const res  = await fetch(`${API}/upload`, { method:"POST", headers: authHeaders(), body: fd });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.message || "Upload failed.");
      await fetch(`${API}/users/${user.id}`, {
        method:"PATCH",
        headers: { ...authHeaders(), "Content-Type":"application/json" },
        body: JSON.stringify({ avatar_url: data.url, avatar_key: data.key }),
      });
      navigate("/dashboard");
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#1a0533 0%,#4a1272 50%,#6b21a8 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@700;800&display=swap');
        @keyframes setup-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .setup-input { width:100%; padding:11px 14px; border:1.5px solid #e8e1f5; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#27213a; outline:none; background:#fff; box-sizing:border-box; transition:border-color 0.15s,box-shadow 0.15s; }
        .setup-input:focus { border-color:#a78bfa; box-shadow:0 0 0 3px rgba(124,58,237,0.12); }
        .setup-btn-primary { width:100%; padding:13px; border-radius:11px; border:none; background:linear-gradient(135deg,#4c1d95,#7c3aed); color:#fff; font-size:14px; font-weight:800; font-family:'DM Sans',sans-serif; cursor:pointer; box-shadow:0 6px 20px rgba(124,58,237,0.35); transition:opacity 0.15s; }
        .setup-btn-primary:hover { opacity:0.9; }
        .setup-btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
        .setup-btn-ghost { width:100%; padding:12px; border-radius:11px; border:1.5px solid rgba(255,255,255,0.2); background:transparent; color:rgba(255,255,255,0.7); font-size:13px; font-weight:700; font-family:'DM Sans',sans-serif; cursor:pointer; transition:all 0.15s; }
        .setup-btn-ghost:hover { background:rgba(255,255,255,0.08); color:#fff; }
      `}</style>

      <div style={{ width:"min(460px,100%)", animation:"setup-in 0.35s ease both" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginBottom:32 }}>
          <img src={logoImg} alt="DS PATH" style={{ width:40, height:40, filter:"drop-shadow(0 4px 10px rgba(196,181,253,0.5))" }} />
          <div>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:"#f5f3ff", letterSpacing:"0.06em" }}>DS PATH</p>
            <p style={{ margin:0, fontSize:10, color:"rgba(216,180,254,0.7)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Processing & Tracking Hub</p>
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, marginBottom:28 }}>
          {[1,2].map(s => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800,
                background: page >= s ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "rgba(255,255,255,0.1)",
                color: page >= s ? "#fff" : "rgba(255,255,255,0.4)",
                boxShadow: page === s ? "0 0 0 4px rgba(167,139,250,0.3)" : "none",
                transition:"all 0.3s",
              }}>{page > s ? "✓" : s}</div>
              {s < 2 && <div style={{ width:40, height:2, borderRadius:99, background: page > s ? "#a78bfa" : "rgba(255,255,255,0.15)", transition:"background 0.3s" }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background:"#fff", borderRadius:20, padding:"36px 32px 32px", boxShadow:"0 28px 70px rgba(0,0,0,0.25)" }}>

          {page === 1 && (
            <>
              <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:800, color:"#27213a", fontFamily:"Manrope,'DM Sans',sans-serif", letterSpacing:"-0.04em" }}>
                Set up your account
              </p>
              <p style={{ margin:"0 0 28px", fontSize:13, color:"#9080a0", lineHeight:1.6 }}>
                Let's get a few details to personalise your PATH workspace.
              </p>

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6b5f76", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Full name <span style={{color:"#dc2626"}}>*</span></label>
                  <input className="setup-input" value={fullName} onChange={e=>{setFullName(e.target.value);setError("");}} placeholder="e.g. Juan dela Cruz" autoFocus />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"#6b5f76", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Contact number</label>
                  <input className="setup-input" value={phone} onChange={e=>{setPhone(e.target.value);setError("");}} placeholder="+63 912 345 6789" type="tel" />
                  <p style={{ margin:"5px 0 0", fontSize:11, color:"#b0a3ba" }}>Optional — used for account and workflow notifications.</p>
                </div>
              </div>

              {error && <p style={{ margin:"14px 0 0", fontSize:12, color:"#dc2626", fontWeight:600 }}>{error}</p>}

              <button className="setup-btn-primary" style={{ marginTop:24 }} onClick={handlePage1} disabled={saving}>
                {saving ? "Saving…" : "Continue →"}
              </button>
            </>
          )}

          {page === 2 && (
            <>
              <p style={{ margin:"0 0 4px", fontSize:22, fontWeight:800, color:"#27213a", fontFamily:"Manrope,'DM Sans',sans-serif", letterSpacing:"-0.04em" }}>
                Add a profile picture
              </p>
              <p style={{ margin:"0 0 28px", fontSize:13, color:"#9080a0", lineHeight:1.6 }}>
                Put a face to your name across the PATH workspace.
              </p>

              {/* Avatar preview */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, marginBottom:24 }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ width:96, height:96, borderRadius:"50%", overflow:"hidden", cursor:"pointer", border:"3px solid #ede9fe", background:"linear-gradient(135deg,#a78bfa,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, color:"#fff", fontFamily:"Manrope,sans-serif", position:"relative" }}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : initials(fullName)
                  }
                  <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"rgba(0,0,0,0)", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(0,0,0,0.35)"}
                    onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0)"}
                  >
                    <span style={{ color:"#fff", fontSize:11, fontWeight:800, opacity:0 }} className="hover-label">Change</span>
                  </div>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{ fontSize:13, fontWeight:700, color:"#7c3aed", background:"none", border:"1px solid #ede9fe", borderRadius:8, padding:"7px 18px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                >
                  {preview ? "Change photo" : "Choose photo"}
                </button>
                <p style={{ margin:0, fontSize:11, color:"#b0a3ba", textAlign:"center" }}>JPG, PNG, GIF or WebP · max 5 MB</p>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display:"none" }} />
              </div>

              {error && <p style={{ margin:"0 0 14px", fontSize:12, color:"#dc2626", fontWeight:600 }}>{error}</p>}

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <button className="setup-btn-primary" onClick={handleUploadAndFinish} disabled={uploading}>
                  {uploading ? "Uploading…" : preview ? "Save & go to dashboard →" : "Skip & go to dashboard →"}
                </button>
                {!preview && (
                  <button className="setup-btn-ghost" style={{ color:"rgba(107,33,168,0.7)", border:"1.5px solid #e8e1f5", background:"transparent" }} onClick={() => navigate("/dashboard")}>
                    Not now
                  </button>
                )}
              </div>

              <button onClick={() => setPage(1)} style={{ display:"block", margin:"16px auto 0", fontSize:12, color:"#b0a3ba", background:"none", border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                ← Back
              </button>
            </>
          )}
        </div>

        <p style={{ margin:"20px 0 0", textAlign:"center", fontSize:11, color:"rgba(216,180,254,0.5)" }}>
          DS PATH · Document Processing &amp; Tracking Hub
        </p>
      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null); }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
