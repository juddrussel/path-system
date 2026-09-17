import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function TermsOfUse() {
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1f1533", marginBottom: 12 }}>Terms of Use</h1>
        <p style={{ color: "#7b6f8a", marginBottom: 32, fontSize: 14 }}>Last updated: {new Date().toLocaleDateString()}</p>

        <div style={{ lineHeight: 1.8, color: "#494454" }}>
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>1. Agreement to Terms</h2>
            <p>
              By accessing and using DS PATH ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>2. Use License</h2>
            <p style={{ marginBottom: 12 }}>Permission is granted to temporarily download one copy of the materials (information or software) on DS PATH for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
            <ul style={{ marginLeft: 24, marginBottom: 12 }}>
              <li style={{ marginBottom: 8 }}>Modify or copy the materials</li>
              <li style={{ marginBottom: 8 }}>Use the materials for any commercial purpose or for any public display</li>
              <li style={{ marginBottom: 8 }}>Attempt to decompile or reverse engineer any software contained on the Service</li>
              <li style={{ marginBottom: 8 }}>Remove any copyright or other proprietary notations from the materials</li>
              <li style={{ marginBottom: 8 }}>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>3. Disclaimer</h2>
            <p>
              The materials on DS PATH are provided "as is". DS PATH makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>4. Limitations</h2>
            <p>
              In no event shall DS PATH or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the DS PATH website, even if DS PATH or an authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>5. Accuracy of Materials</h2>
            <p>
              The materials appearing on DS PATH could include technical, typographical, or photographic errors. DS PATH does not warrant that any of the materials on the Service are accurate, complete, or current. DS PATH may make changes to the materials contained on the Service at any time without notice.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>6. Links</h2>
            <p>
              DS PATH has not reviewed all of the sites linked to its Internet web site and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by DS PATH of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>7. Modifications</h2>
            <p>
              DS PATH may revise these terms of service for the Service at any time without notice. By using this Service, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which DS PATH operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>9. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Use, please contact us at{" "}
              <a href="mailto:support@dspath.com" style={{ color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>
                support@dspath.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
