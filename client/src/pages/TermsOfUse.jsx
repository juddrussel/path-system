import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #f0ebff 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .term-section { animation: slideIn 0.6s ease-out; }
        .term-section:nth-child(1) { animation-delay: 0.1s; }
        .term-section:nth-child(2) { animation-delay: 0.2s; }
        .term-section:nth-child(3) { animation-delay: 0.3s; }
        .term-section:nth-child(4) { animation-delay: 0.4s; }
        .term-section:nth-child(5) { animation-delay: 0.5s; }
        .term-section:nth-child(6) { animation-delay: 0.6s; }
        .term-section:nth-child(7) { animation-delay: 0.7s; }
        .term-section:nth-child(8) { animation-delay: 0.8s; }
      `}</style>

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
        color: "white",
        padding: "60px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "8px 16px", background: "rgba(255,255,255,0.15)", borderRadius: 50, backdropFilter: "blur(10px)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Legal</span>
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>Terms of Use</h1>
          <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.6 }}>Please read our terms carefully before using DS PATH.</p>
        </div>
      </div>

      {/* Navigation */}
      <header style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(5,150,105,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px" }}>
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
              color: "#059669",
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#ecfdf5"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logoImg} alt="DS PATH" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, color: "#1f1533" }}>DS PATH</span>
          </div>
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 24px" }}>
        <div style={{ lineHeight: 1.8, color: "#494454" }}>
          {[
            {
              title: "1. Agreement to Terms",
              content: "By accessing and using DS PATH, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree, please do not use this service.",
            },
            {
              title: "2. Use License",
              content: (
                <>
                  <p style={{ marginBottom: 12 }}>Permission is granted to use DS PATH for lawful purposes only. You may not:</p>
                  <ul style={{ marginLeft: 24, marginBottom: 0 }}>
                    <li style={{ marginBottom: 8 }}>Modify or copy the materials</li>
                    <li style={{ marginBottom: 8 }}>Use the materials for any commercial purpose</li>
                    <li style={{ marginBottom: 8 }}>Attempt to decompile or reverse engineer any software</li>
                    <li style={{ marginBottom: 8 }}>Remove any copyright or proprietary notations</li>
                    <li>Transfer the materials to another person</li>
                  </ul>
                </>
              ),
            },
            {
              title: "3. Disclaimer",
              content: "The materials on DS PATH are provided 'as is'. DS PATH makes no warranties, expressed or implied, and hereby disclaims all other warranties including merchantability and fitness for a particular purpose.",
            },
            {
              title: "4. Limitations",
              content: "In no event shall DS PATH or its suppliers be liable for any damages arising out of the use or inability to use the materials, even if notified of the possibility of such damage.",
            },
            {
              title: "5. Accuracy of Materials",
              content: "The materials appearing on DS PATH could include technical, typographical, or photographic errors. DS PATH may make changes to the materials at any time without notice.",
            },
            {
              title: "6. Links",
              content: "DS PATH is not responsible for the contents of any linked site. The inclusion of any link does not imply endorsement by DS PATH. Use of any such linked website is at the user's own risk.",
            },
            {
              title: "7. Modifications",
              content: "DS PATH may revise these terms at any time without notice. By using this service, you are agreeing to be bound by the then current version of these terms.",
            },
            {
              title: "8. Governing Law",
              content: "These terms and conditions are governed by and construed in accordance with applicable law, and you irrevocably submit to the exclusive jurisdiction of the courts.",
            },
          ].map((section, idx) => (
            <div
              key={idx}
              className="term-section"
              style={{
                marginBottom: 28,
                padding: "24px",
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(5,150,105,0.1)",
                boxShadow: "0 2px 8px rgba(5,150,105,0.05)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1f1533", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#059669" }} />
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{section.content}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 60, padding: "32px 24px", background: "linear-gradient(135deg, #06b6d418, #10b98118)", borderRadius: 16, border: "2px solid #d1fae5", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#494454", marginBottom: 16 }}>Questions about our terms?</p>
          <a
            href="mailto:legal@dspath.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #059669, #047857)",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(5,150,105,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(5,150,105,0.3)";
            }}
          >
            Contact Legal Team →
          </a>
        </div>
      </main>
    </div>
  );
}
