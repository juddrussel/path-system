import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        
        .privacy-content strong { color: #2f2638; font-weight: 700; }
        .privacy-section { animation: slideUp 0.4s ease-out; }
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
              Privacy Policy
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
              Your privacy is important to us. Learn how we collect, use, and protect your information.
            </p>
          </div>
        </div>

        {/* Content */}
        <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 32px 80px" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "40px", boxShadow: "0 4px 24px rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.08)" }}>
            <div className="privacy-content" style={{ lineHeight: 1.8, color: "#494454" }}>
              {[
                {
                  title: "Introduction",
                  content: "DS PATH ('we,' 'us,' 'our,' or 'Company') operates the DS PATH website and application. This Privacy Policy explains our online information practices and the choices you can make about how your information is collected and used.",
                },
                {
                  title: "Information We Collect",
                  content: (
                    <>
                      <p style={{ marginBottom: 14 }}>We may collect information about you in a variety of ways, including:</p>
                      <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                        <li style={{ marginBottom: 10 }}><strong>Personal Information:</strong> Name, email, phone number, and other information provided during registration.</li>
                        <li style={{ marginBottom: 10 }}><strong>Document Information:</strong> Files and documents you submit through our platform.</li>
                        <li style={{ marginBottom: 10 }}><strong>Usage Data:</strong> Information about how you interact with our services.</li>
                        <li><strong>Device Information:</strong> IP address, browser type, and technical information.</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: "How We Use Your Information",
                  content: (
                    <>
                      <p style={{ marginBottom: 14 }}>We use the information we collect to:</p>
                      <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                        <li style={{ marginBottom: 10 }}>Provide, maintain, and improve our services</li>
                        <li style={{ marginBottom: 10 }}>Process your requests and communications</li>
                        <li style={{ marginBottom: 10 }}>Send administrative information and updates</li>
                        <li style={{ marginBottom: 10 }}>Respond to your inquiries and support requests</li>
                        <li>Detect, investigate, and prevent fraudulent activities</li>
                      </ul>
                    </>
                  ),
                },
                {
                  title: "Data Security",
                  content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.",
                },
                {
                  title: "Your Rights",
                  content: (
                    <>
                      <p style={{ marginBottom: 14 }}>Depending on your location, you may have certain rights regarding your personal information:</p>
                      <ul style={{ marginLeft: 20, marginBottom: 0, lineHeight: 1.9 }}>
                        <li style={{ marginBottom: 10 }}>The right to access your personal information</li>
                        <li style={{ marginBottom: 10 }}>The right to correct or update your information</li>
                        <li style={{ marginBottom: 10 }}>The right to request deletion of your information</li>
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
                      <a href="mailto:privacy@dspath.com" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 700, borderBottom: "1px solid #7c3aed" }}>
                        privacy@dspath.com
                      </a>
                    </>
                  ),
                },
              ].map((section, idx) => (
                <section key={idx} className="privacy-section" style={{ marginBottom: idx < 5 ? 36 : 0, paddingBottom: idx < 5 ? 36 : 0, borderBottom: idx < 5 ? "1px solid #e9e1f1" : "none" }}>
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
