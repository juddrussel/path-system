// Unified skeleton loading component for all pages
export default function PageSkeleton() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 0", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes page-sk-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes page-sk-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes page-sk-spin { to { transform: rotate(360deg); } }
        .page-sk { background: linear-gradient(90deg,#ede9fe 0%,#f5f3ff 45%,#ede9fe 90%); background-size:600px 100%; animation: page-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .page-sk-dark { background: linear-gradient(90deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.22) 45%,rgba(255,255,255,0.1) 90%); background-size:600px 100%; animation: page-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .page-sk-wrap { width: min(1400px,95vw); display: flex; flex-direction: column; gap: 0; animation: page-sk-fadein 0.3s ease both; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(76,29,149,0.12); }
        .page-sk-hero { background: linear-gradient(135deg,#2d0a5e 0%,#4a1272 50%,#6b21a8 100%); padding:36px 40px; display:flex; flex-direction:column; gap:20px; }
        .page-sk-content { padding: 32px 40px; display: grid; grid-template-columns: 1fr 380px; gap: 32px; }
        .page-sk-left { display: flex; flex-direction: column; gap: 24px; }
        .page-sk-card { background:#faf8fc; border:1px solid #e8e1f5; border-radius:12px; padding:24px; display:flex; flex-direction:column; gap:14px; }
        .page-sk-right { display: flex; flex-direction: column; }
        .page-sk-discussion { background:#faf8fc; border:1px solid #e8e1f5; border-radius:12px; padding:24px; display:flex; flex-direction:column; gap:16px; min-height: 600px; }
        .page-sk-spin { width:16px; height:16px; border-radius:50%; flex-shrink:0; border:2px solid rgba(255,255,255,0.2); border-top-color:#c4b5fd; animation:page-sk-spin 0.75s linear infinite; }
      `}</style>
      <div className="page-sk-wrap">
        {/* Hero Section */}
        <div className="page-sk-hero">
          {/* Back button + Live indicator row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div className="page-sk-dark" style={{ height:32, width:180, borderRadius:8 }} />
            <div className="page-sk-dark" style={{ height:28, width:160, borderRadius:8 }} />
          </div>
          
          {/* Hero grid - title and status */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:32, marginTop:8 }}>
            {/* Left: Title section */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="page-sk-dark" style={{ height:14, width:240, borderRadius:6 }} />
              <div className="page-sk-dark" style={{ height:36, width:"75%", borderRadius:8 }} />
              <div style={{ display:"flex", gap:20, marginTop:8 }}>
                <div className="page-sk-dark" style={{ height:16, width:150, borderRadius:6 }} />
                <div className="page-sk-dark" style={{ height:16, width:120, borderRadius:6 }} />
                <div className="page-sk-dark" style={{ height:16, width:130, borderRadius:6 }} />
              </div>
            </div>
            
            {/* Right: Status card */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, background:"rgba(255,255,255,0.1)", borderRadius:12, padding:20, border:"1px solid rgba(255,255,255,0.15)" }}>
              <div className="page-sk-dark" style={{ height:12, width:100, borderRadius:4 }} />
              <div className="page-sk-dark" style={{ height:24, width:140, borderRadius:6 }} />
              <div className="page-sk-dark" style={{ height:8, width:"100%", borderRadius:99 }} />
              <div className="page-sk-dark" style={{ height:12, width:130, borderRadius:4 }} />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="page-sk-content">
          {/* Left Column */}
          <div className="page-sk-left">
            {/* Card 1 */}
            <div className="page-sk-card" style={{ minHeight:240 }}>
              <div className="page-sk" style={{ height:18, width:"40%", marginBottom:6 }} />
              {[70,65,58,63,52].map((w,i) => (
                <div key={i} className="page-sk" style={{ height:14, width:`${w}%` }} />
              ))}
            </div>

            {/* Card 2 */}
            <div className="page-sk-card" style={{ minHeight:200 }}>
              <div className="page-sk" style={{ height:18, width:"35%", marginBottom:8 }} />
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    <div className="page-sk" style={{ width:80, height:80, borderRadius:10 }} />
                    <div className="page-sk" style={{ width:70, height:10, borderRadius:4 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3 */}
            <div className="page-sk-card" style={{ minHeight:180 }}>
              <div className="page-sk" style={{ height:18, width:"32%", marginBottom:8 }} />
              {[1,2].map(i => (
                <div key={i} className="page-sk" style={{ height:70, borderRadius:8 }} />
              ))}
            </div>
          </div>

          {/* Right Column - Discussion Panel */}
          <div className="page-sk-right">
            <div className="page-sk-discussion">
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div className="page-sk-spin" />
                <div className="page-sk" style={{ height:18, width:120 }} />
              </div>
              
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display:"flex", gap:12, paddingTop:12, borderTop: i > 1 ? "1px solid #ede9fe" : "none" }}>
                  <div className="page-sk" style={{ width:42, height:42, borderRadius:"50%", flexShrink:0 }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div className="page-sk" style={{ height:14, width:"55%" }} />
                    <div className="page-sk" style={{ height:48, borderRadius:8 }} />
                    <div className="page-sk" style={{ height:10, width:"28%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
