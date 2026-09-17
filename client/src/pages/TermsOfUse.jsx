import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        
        .terms-content strong { color: #2f2638; font-weight: 700; }
        .terms-section { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header */}
        <header style={{ 
          background: "rgba(255,255,255,0.95)", 
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(124,58,237,0.08)", 
          padding: "16px 0",
          position: "sticky", 
          top: 0, 
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                color: "#7c3aed",
                fontWeight: 700,
                padding: "8px 14px",
                borderRadius: 8,
                transition: "all 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#f0ebff"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              ← Back
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logoImg} alt="DS PATH" style={{ width: 34, height: 34, borderRadius: 9 }} />
              <span style={{ fontWeight: 800, color: "#1f1533", fontSize: 16, letterSpacing: "0.02em", fontFamily: "'Manrope', sans-serif" }}>DS PATH</span>
            </div>
            <div style={{ width: 80 }} />
          </div>
        </header>

        {/* Hero Section */}
        <div style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%)",
          padding: "64px 32px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: -50, left: -50, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
          
          <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: 20, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Legal</span>
            </div>
            <h1 style={{ 
              fontSize: 42, 
              fontWeight: 800, 
              color: "#fff", 
              marginBottom: 12,
              letterSpacing: "-0.03em",
              fontFamily: "'Manrope', sans-serif",
              lineHeight: 1.1
            }}>
              Terms of Use
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
              Please read these terms carefully before using DS PATH services.
            </p>
          </div>
        </div>

        {/* Content */}
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 32px 80px" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px", boxShadow: "0 4px 24px rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.08)" }}>
            <div className="terms-content" style={{ lineHeight: 1.8, color: "#494454" }}>
              {[
                {
                  title: "Agreement to Terms",
                  content: "By accessing and using DS PATH, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree, please do not use this service.",
                },
                {
                  title: "Use License",
                  content: (
                    <>
                      <p style={{ marginBottom: 14 }}>Permission is granted to use DS PATH for lawful purposes only. You may not:</p>
                      <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                        <li style={{ marginBottom: 10 }}>Modify or copy the materials</li>
                        <li style={{ marginBottom: 10 }}>Use the materials for any commercial purpose</li>
                        <li style={{ marginBottom: 10 }}>Attempt to decompile or reverse engineer any software</li>
                        <li style={{ marginBottom: 10 }}>Remove any copyright or proprietary notations</li>
                        <li>Transfer the materials to another person</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: "Disclaimer",
                  content: "The materials on DS PATH are provided 'as is'. DS PATH makes no warranties, expressed or implied, and hereby disclaims all other warranties including merchantability and fitness for a particular purpose.",
                },
                {
                  title: "Limitations",
                  content: "In no event shall DS PATH or its suppliers be liable for any damages arising out of the use or inability to use the materials, even if notified of the possibility of such damage.",
                },
                {
                  title: "Accuracy of Materials",
                  content: "The materials appearing on DS PATH could include technical, typographical, or photographic errors. DS PATH may make changes to the materials at any time without notice.",
                },
                {
                  title: "Links",
                  content: "DS PATH is not responsible for the contents of any linked site. The inclusion of any link does not imply endorsement by DS PATH. Use of any such linked website is at the user's own risk.",
                },
                {
                  title: "Modifications",
                  content: "DS PATH may revise these terms at any time without notice. By using this service, you are agreeing to be bound by the then current version of these terms.",
                },
                {
                  title: "Governing Law",
                  content: "These terms and conditions are governed by and construed in accordance with applicable law, and you irrevocably submit to the exclusive jurisdiction of the courts.",
                },
              ].map((section, idx) => (
                <section key={idx} className="terms-section" style={{ marginBottom: idx < 7 ? 36 : 0, paddingBottom: idx < 7 ? 36 : 0, borderBottom: idx < 7 ? "1px solid #e9e1f1" : "none" }}>
                  <h2 style={{ 
                    fontSize: 20, 
                    fontWeight: 800, 
                    color: "#1f1533", 
                    marginBottom: 16,
                    fontFamily: "'Manrope', sans-serif",
                    letterSpacing: "-0.01em"
                  }}>
                    {section.title}
                  </h2>
                  <div style={{ fontSize: 14, lineHeight: 1.8, color: "#5f5866" }}>{section.content}</div>
                </section>
              ))}

              <div style={{ marginTop: 40, padding: "24px 28px", background: "#f8f7ff", borderRadius: 12, border: "1px solid #e9e1f1", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "#82768a", marginBottom: 0 }}>
                  Last updated: <strong style={{ color: "#2f2638" }}>{new Date().toLocaleDateString()}</strong>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
