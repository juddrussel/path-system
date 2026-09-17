import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

const colors = {
  ink: "#2f2638",
  muted: "#82768a",
  faint: "#a095a8",
  violet: "#7c3aed",
  violetDark: "#5b21b6",
  panel: "#f8f7ff",
  line: "#e9e1f1",
};

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: colors.panel, fontFamily: "'DM Sans', sans-serif", color: colors.ink }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: `1px solid ${colors.line}`, padding: "16px 24px", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
              color: colors.violet,
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.panel}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logoImg} alt="DS PATH" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, color: colors.ink, fontSize: 16, letterSpacing: "-0.02em" }}>DS PATH</span>
          </div>
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* Page Title */}
      <div style={{ padding: "40px 24px", borderBottom: `1px solid ${colors.line}`, background: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.ink, marginBottom: 8, letterSpacing: "-0.02em" }}>Terms of Use</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ lineHeight: 1.8, color: colors.muted }}>
          {[
            {
              title: "Agreement to Terms",
              content: "By accessing and using DS PATH, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree, please do not use this service.",
            },
            {
              title: "Use License",
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
            <section key={idx} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: idx < 7 ? `1px solid ${colors.line}` : "none" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.ink, marginBottom: 12 }}>
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: colors.muted }}>{section.content}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
