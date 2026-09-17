import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function HelpDesk() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [openFaq, setOpenFaq] = useState(null);

  const categories = {
    general: "General Questions",
    documents: "Documents & Submissions",
    workflow: "Workflow & Tracking",
    technical: "Technical Support",
  };

  const faqs = {
    general: [
      { q: "What is DS PATH?", a: "DS PATH is a document processing and tracking hub designed to streamline academic document workflows. It helps manage submissions, reviews, approvals, and tracking all in one secure platform." },
      { q: "How do I create an account?", a: "You can create an account by clicking the 'Register' button on the login page and filling in your information, or by accepting an invitation from an administrator." },
      { q: "Can I change my password?", a: "Yes, you can change your password from the Settings page. Go to Settings and look for the 'Change Password' option." },
    ],
    documents: [
      { q: "How do I submit a document?", a: "Navigate to the Forms section, select the appropriate document category, fill in the required information, and attach your document. Click Submit when ready." },
      { q: "What file formats are accepted?", a: "We accept PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and image files (JPG, PNG, GIF)." },
      { q: "What is the file size limit?", a: "The maximum file size for a single document is 50MB. If you need to submit larger files, please contact support." },
      { q: "Can I edit after submitting?", a: "Once submitted, documents are locked. However, if a reviewer requests revisions, you can resubmit a new version." },
    ],
    workflow: [
      { q: "How do I track my submission?", a: "Use the Tracking page to see the current status of your documents. You can filter by date, status, and document type." },
      { q: "What does 'Pending' status mean?", a: "'Pending' means your document is waiting to be reviewed. You can see who currently has it assigned to them." },
      { q: "How long does review take?", a: "Review times vary by document type. Check the SLA Configuration page to see target completion times for each category." },
      { q: "Can I communicate with reviewers?", a: "Yes, use the Inbox section to send direct messages or participate in group chats with team members." },
    ],
    technical: [
      { q: "Website loading slowly?", a: "Try clearing your browser cache and cookies. If the problem persists, contact support with details about your browser." },
      { q: "Trouble uploading files?", a: "Ensure your file is not corrupted and is under 50MB. Try a different browser or device if possible." },
      { q: "Video call not working?", a: "Check that you have allowed camera and microphone permissions. Try refreshing and ensuring a stable internet connection." },
      { q: "Which browsers are supported?", a: "DS PATH works best on Chrome, Firefox, Safari, and Edge (latest versions). Mobile devices are also supported." },
    ],
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        .faq-item { animation: slideUp 0.4s ease-out forwards; opacity: 0; }
        .faq-item:nth-child(1) { animation-delay: 0.05s; }
        .faq-item:nth-child(2) { animation-delay: 0.1s; }
        .faq-item:nth-child(3) { animation-delay: 0.15s; }
        .faq-item:nth-child(4) { animation-delay: 0.2s; }
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
          
          <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: 20, marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase" }}>Support Center</span>
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
              Help Desk
            </h1>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: 0 }}>
              Find answers to common questions or get in touch with our support team.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 32px 80px" }}>
          {/* Category Pills */}
          <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
            {Object.entries(categories).map(([key, title]) => (
              <button
                key={key}
                onClick={() => { setSelectedCategory(key); setOpenFaq(null); }}
                style={{
                  padding: "10px 20px",
                  background: selectedCategory === key ? "#7c3aed" : "#fff",
                  color: selectedCategory === key ? "#fff" : "#5f5866",
                  border: selectedCategory === key ? "1px solid #7c3aed" : "1px solid #e9e1f1",
                  borderRadius: 24,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  transition: "all 0.2s",
                  boxShadow: selectedCategory === key ? "0 4px 12px rgba(124,58,237,0.2)" : "none",
                }}
                onMouseEnter={e => {
                  if (selectedCategory !== key) {
                    e.currentTarget.style.background = "#f8f7ff";
                    e.currentTarget.style.borderColor = "#7c3aed";
                  }
                }}
                onMouseLeave={e => {
                  if (selectedCategory !== key) {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#e9e1f1";
                  }
                }}
              >
                {title}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(500px, 100%), 1fr))", gap: 24 }}>
            {/* FAQs Column */}
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1f1533", marginBottom: 20, fontFamily: "'Manrope', sans-serif" }}>
                Frequently Asked Questions
              </h2>
              <div style={{ display: "grid", gap: 12 }}>
                {faqs[selectedCategory].map((item, idx) => (
                  <div
                    key={idx}
                    className="faq-item"
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #e9e1f1",
                      overflow: "hidden",
                      transition: "all 0.2s",
                    }}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1f1533", margin: 0 }}>{item.q}</h3>
                      <span style={{ fontSize: 12, color: "#7c3aed", transition: "transform 0.3s", transform: openFaq === idx ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>
                        ▼
                      </span>
                    </button>
                    {openFaq === idx && (
                      <div style={{ padding: "0 20px 16px", borderTop: "1px solid #e9e1f1", background: "#f8f7ff" }}>
                        <p style={{ fontSize: 13, color: "#5f5866", lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Card */}
            <div>
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e9e1f1", padding: "28px 24px", position: "sticky", top: 100 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1f1533", marginBottom: 8, fontFamily: "'Manrope', sans-serif" }}>
                  Need More Help?
                </h2>
                <p style={{ fontSize: 13, color: "#5f5866", marginBottom: 24, lineHeight: 1.6 }}>
                  Our support team is here to help. We typically respond within 24 hours during business hours.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href="mailto:support@dspath.com"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      background: "#7c3aed",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      transition: "all 0.2s",
                      border: "1px solid #7c3aed",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#6b21a8";
                      e.currentTarget.style.borderColor = "#6b21a8";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#7c3aed";
                      e.currentTarget.style.borderColor = "#7c3aed";
                    }}
                  >
                    Email Support
                  </a>
                  <a
                    href="tel:+1234567890"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px 20px",
                      background: "transparent",
                      color: "#7c3aed",
                      textDecoration: "none",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      transition: "all 0.2s",
                      border: "1px solid #e9e1f1",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#f8f7ff";
                      e.currentTarget.style.borderColor = "#7c3aed";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "#e9e1f1";
                    }}
                  >
                    Call Us
                  </a>
                </div>

                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #e9e1f1" }}>
                  <p style={{ fontSize: 11, color: "#82768a", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Business Hours</p>
                  <p style={{ fontSize: 12, color: "#5f5866", margin: 0 }}>Monday - Friday<br/>9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
