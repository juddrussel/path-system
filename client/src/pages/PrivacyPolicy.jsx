import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e1f5", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
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
              color: "#7c3aed",
              fontWeight: 600,
              padding: 0,
            }}
          >
            ← Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logoImg} alt="DS PATH" style={{ width: 36, height: 36, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, color: "#1f1533" }}>DS PATH</span>
          </div>
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1f1533", marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ color: "#7b6f8a", marginBottom: 32, fontSize: 14 }}>Last updated: {new Date().toLocaleDateString()}</p>

        <div style={{ lineHeight: 1.8, color: "#494454" }}>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>1. Introduction</h2>
            <p>
              DS PATH ("we," "us," "our," or "Company") operates the DS PATH website and application. This Privacy Policy explains our online information practices and the choices you can make about how your information is collected and used.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>2. Information We Collect</h2>
            <p style={{ marginBottom: 12 }}>We may collect information about you in a variety of ways, including:</p>
            <ul style={{ marginLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}><strong>Personal Information:</strong> Name, email address, phone number, and other information you provide when registering or using our services.</li>
              <li style={{ marginBottom: 8 }}><strong>Document Information:</strong> Files and documents you submit through our platform.</li>
              <li style={{ marginBottom: 8 }}><strong>Usage Data:</strong> Information about how you interact with our services, including access times, pages viewed, and actions taken.</li>
              <li style={{ marginBottom: 8 }}><strong>Device Information:</strong> IP address, browser type, operating system, and other technical information.</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>3. How We Use Your Information</h2>
            <p style={{ marginBottom: 12 }}>We use the information we collect to:</p>
            <ul style={{ marginLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Provide, maintain, and improve our services</li>
              <li style={{ marginBottom: 8 }}>Process your requests and communications</li>
              <li style={{ marginBottom: 8 }}>Send administrative information and updates</li>
              <li style={{ marginBottom: 8 }}>Respond to your inquiries and support requests</li>
              <li style={{ marginBottom: 8 }}>Monitor and analyze trends, usage, and activities</li>
              <li style={{ marginBottom: 8 }}>Detect, investigate, and prevent fraudulent activities</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>5. Your Rights</h2>
            <p style={{ marginBottom: 12 }}>Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul style={{ marginLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>The right to access your personal information</li>
              <li style={{ marginBottom: 8 }}>The right to correct or update your information</li>
              <li style={{ marginBottom: 8 }}>The right to request deletion of your information</li>
              <li style={{ marginBottom: 8 }}>The right to opt-out of certain processing activities</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at{" "}
              <a href="mailto:privacy@dspath.com" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                privacy@dspath.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
