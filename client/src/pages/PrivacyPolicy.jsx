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

export default function PrivacyPolicy() {
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
          <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.ink, marginBottom: 8, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ lineHeight: 1.8, color: colors.muted }}>
          {[
            {
              title: "Introduction",
              content: "DS PATH ('we,' 'us,' 'our,' or 'Company') operates the DS PATH website and application. This Privacy Policy explains our online information practices and the choices you can make about how your information is collected and used.",
            },
            {
              title: "Information We Collect",
              content: (
                <>
                  <p style={{ marginBottom: 12 }}>We may collect information about you in a variety of ways, including:</p>
                  <ul style={{ marginLeft: 24, marginBottom: 0 }}>
                    <li style={{ marginBottom: 8 }}><strong>Personal Information:</strong> Name, email, phone number, and other information provided during registration.</li>
                    <li style={{ marginBottom: 8 }}><strong>Document Information:</strong> Files and documents you submit through our platform.</li>
                    <li style={{ marginBottom: 8 }}><strong>Usage Data:</strong> Information about how you interact with our services.</li>
                    <li><strong>Device Information:</strong> IP address, browser type, and technical information.</li>
                  </ul>
                </>
              ),
            },
            {
              title: "How We Use Your Information",
              content: (
                <>
                  <p style={{ marginBottom: 12 }}>We use the information we collect to:</p>
                  <ul style={{ marginLeft: 24, marginBottom: 0 }}>
                    <li style={{ marginBottom: 8 }}>Provide, maintain, and improve our services</li>
                    <li style={{ marginBottom: 8 }}>Process your requests and communications</li>
                    <li style={{ marginBottom: 8 }}>Send administrative information and updates</li>
                    <li style={{ marginBottom: 8 }}>Respond to your inquiries and support requests</li>
                    <li>Detect, investigate, and prevent fraudulent activities</li>
                  </ul>
                </>
              ),
            },
            {
              title: "Data Security",
              content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.",
            },
            {
              title: "Your Rights",
              content: (
                <>
                  <p style={{ marginBottom: 12 }}>Depending on your location, you may have certain rights regarding your personal information:</p>
                  <ul style={{ marginLeft: 24, marginBottom: 0 }}>
                    <li style={{ marginBottom: 8 }}>The right to access your personal information</li>
                    <li style={{ marginBottom: 8 }}>The right to correct or update your information</li>
                    <li style={{ marginBottom: 8 }}>The right to request deletion of your information</li>
                    <li>The right to opt-out of certain processing activities</li>
                  </ul>
                </>
              ),
            },
            {
              title: "Contact Us",
              content: (
                <>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us at{" "}
                  <a href="mailto:privacy@dspath.com" style={{ color: colors.violet, textDecoration: "none", fontWeight: 700 }}>
                    privacy@dspath.com
                  </a>
                </>
              ),
            },
          ].map((section, idx) => (
            <section key={idx} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: idx < 5 ? `1px solid ${colors.line}` : "none" }}>
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
