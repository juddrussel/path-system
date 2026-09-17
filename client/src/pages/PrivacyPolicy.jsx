import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #f0ebff 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .policy-section { animation: slideIn 0.6s ease-out; }
        .policy-section:nth-child(1) { animation-delay: 0.1s; }
        .policy-section:nth-child(2) { animation-delay: 0.2s; }
        .policy-section:nth-child(3) { animation-delay: 0.3s; }
        .policy-section:nth-child(4) { animation-delay: 0.4s; }
        .policy-section:nth-child(5) { animation-delay: 0.5s; }
        .policy-section:nth-child(6) { animation-delay: 0.6s; }
      `}</style>

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%)",
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
          <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 12, letterSpacing: "-0.02em" }}>Privacy Policy</h1>
          <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.6 }}>Your privacy is important to us. Learn how we collect and protect your data.</p>
        </div>
      </div>

      {/* Navigation */}
      <header style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(124,58,237,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
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
              color: "#7c3aed",
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0ebff"}
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
              title: "1. Introduction",
              content: "DS PATH ('we,' 'us,' 'our,' or 'Company') operates the DS PATH website and application. This Privacy Policy explains our online information practices and the choices you can make about how your information is collected and used.",
            },
            {
              title: "2. Information We Collect",
              content: (
                <>
                  <p style={{ marginBottom: 12 }}>We may collect information about you in a variety of ways, including:</p>
                  <ul style={{ marginLeft: 24, marginBottom: 0 }}>
                    <li style={{ marginBottom: 8 }}><strong>Personal Information:</strong> Name, email address, phone number, and other information you provide when registering.</li>
                    <li style={{ marginBottom: 8 }}><strong>Document Information:</strong> Files and documents you submit through our platform.</li>
                    <li style={{ marginBottom: 8 }}><strong>Usage Data:</strong> Information about how you interact with our services.</li>
                    <li><strong>Device Information:</strong> IP address, browser type, and technical information.</li>
                  </ul>
                </>
              ),
            },
            {
              title: "3. How We Use Your Information",
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
              title: "4. Data Security",
              content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access. However, no method of transmission over the Internet is 100% secure.",
            },
            {
              title: "5. Your Rights",
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
              title: "6. Contact Us",
              content: (
                <>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us at{" "}
                  <a href="mailto:privacy@dspath.com" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 700 }}>
                    privacy@dspath.com
                  </a>
                </>
              ),
            },
          ].map((section, idx) => (
            <div
              key={idx}
              className="policy-section"
              style={{
                marginBottom: 28,
                padding: "24px",
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(124,58,237,0.1)",
                boxShadow: "0 2px 8px rgba(91,33,182,0.05)",
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1f1533", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#7c3aed" }} />
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{section.content}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 60, padding: "32px 24px", background: "linear-gradient(135deg, #7c3aed18, #6b38d418)", borderRadius: 16, border: "2px solid #ddd6fe", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#494454", marginBottom: 16 }}>Questions about your privacy?</p>
          <a
            href="mailto:privacy@dspath.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 24px",
              background: "linear-gradient(135deg, #7c3aed, #6b38d4)",
              color: "white",
              textDecoration: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              transition: "all 0.2s",
              boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(124,58,237,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.3)";
            }}
          >
            Contact Privacy Team →
          </a>
        </div>
      </main>
    </div>
  );
}
