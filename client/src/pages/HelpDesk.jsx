import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function HelpDesk() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [openFaq, setOpenFaq] = useState(null);

  const categories = {
    general: { icon: "❓", color: "#3b82f6", title: "General Questions" },
    documents: { icon: "📄", color: "#10b981", title: "Documents & Submissions" },
    workflow: { icon: "⚙️", color: "#f59e0b", title: "Workflow & Tracking" },
    technical: { icon: "🔧", color: "#ef4444", title: "Technical Support" },
  };

  const faqs = {
    general: [
      {
        q: "What is DS PATH?",
        a: "DS PATH is a document processing and tracking hub designed to streamline academic document workflows. It helps manage submissions, reviews, approvals, and tracking all in one secure platform.",
      },
      {
        q: "How do I create an account?",
        a: "You can create an account by clicking the 'Register' button on the login page and filling in your information, or by accepting an invitation from an administrator.",
      },
      {
        q: "Can I change my password?",
        a: "Yes, you can change your password from the Settings page. Go to Settings and look for the 'Change Password' option.",
      },
    ],
    documents: [
      {
        q: "How do I submit a document?",
        a: "Navigate to the Forms section, select the appropriate document category, fill in the required information, and attach your document. Click Submit when ready.",
      },
      {
        q: "What file formats are accepted?",
        a: "We accept PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and image files (JPG, PNG, GIF).",
      },
      {
        q: "What is the file size limit?",
        a: "The maximum file size for a single document is 50MB. If you need to submit larger files, please contact support.",
      },
      {
        q: "Can I edit after submitting?",
        a: "Once submitted, documents are locked. However, if a reviewer requests revisions, you can resubmit a new version.",
      },
    ],
    workflow: [
      {
        q: "How do I track my submission?",
        a: "Use the Tracking page to see the current status of your documents. You can filter by date, status, and document type.",
      },
      {
        q: "What does 'Pending' status mean?",
        a: "'Pending' means your document is waiting to be reviewed. You can see who currently has it assigned to them.",
      },
      {
        q: "How long does review take?",
        a: "Review times vary by document type. Check the SLA Configuration page to see target completion times for each category.",
      },
      {
        q: "Can I communicate with reviewers?",
        a: "Yes, use the Inbox section to send direct messages or participate in group chats with team members.",
      },
    ],
    technical: [
      {
        q: "Website loading slowly?",
        a: "Try clearing your browser cache and cookies. If the problem persists, contact support with details about your browser.",
      },
      {
        q: "Trouble uploading files?",
        a: "Ensure your file is not corrupted and is under 50MB. Try a different browser or device if possible.",
      },
      {
        q: "Video call not working?",
        a: "Check that you have allowed camera and microphone permissions. Try refreshing and ensuring a stable internet connection.",
      },
      {
        q: "Which browsers are supported?",
        a: "DS PATH works best on Chrome, Firefox, Safari, and Edge (latest versions). Mobile devices are also supported.",
      },
    ],
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f8f7ff 0%, #f0ebff 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .faq-item { animation: slideIn 0.6s ease-out forwards; opacity: 0; }
        .faq-item:nth-child(1) { animation-delay: 0.1s; }
        .faq-item:nth-child(2) { animation-delay: 0.2s; }
        .faq-item:nth-child(3) { animation-delay: 0.3s; }
        .faq-item:nth-child(4) { animation-delay: 0.4s; }
      `}</style>

      {/* Hero Section */}
      <div style={{
        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        color: "white",
        padding: "80px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ position: "absolute", bottom: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "10px 20px", background: "rgba(255,255,255,0.15)", borderRadius: 50, backdropFilter: "blur(10px)" }}>
            <span style={{ fontSize: 20 }}>🆘</span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Support Center</span>
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.2 }}>How Can We Help?</h1>
          <p style={{ fontSize: 18, opacity: 0.95, lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>Find answers to common questions or get in touch with our support team.</p>
        </div>
      </div>

      {/* Navigation */}
      <header style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(59,130,246,0.1)", position: "sticky", top: 0, zIndex: 100 }}>
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
              color: "#3b82f6",
              fontWeight: 700,
              padding: "8px 12px",
              borderRadius: 8,
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
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

      {/* Main Content */}
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 24px" }}>
        {/* Category Buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 60 }}>
          {Object.entries(categories).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setOpenFaq(null);
              }}
              style={{
                padding: "20px 24px",
                borderRadius: 14,
                border: "2px solid transparent",
                background: selectedCategory === key ? cat.color : "#fff",
                color: selectedCategory === key ? "#fff" : "#1f1533",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: selectedCategory === key ? `0 8px 24px ${cat.color}40` : "0 2px 8px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                fontSize: 16,
              }}
              onMouseEnter={e => {
                if (selectedCategory !== key) {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)";
                }
              }}
              onMouseLeave={e => {
                if (selectedCategory !== key) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                }
              }}
            >
              <span style={{ fontSize: 32 }}>{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ display: "grid", gap: 16, marginBottom: 60 }}>
          {faqs[selectedCategory].map((item, idx) => (
            <div
              key={idx}
              className="faq-item"
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(59,130,246,0.1)",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(59,130,246,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1f1533", margin: 0 }}>{item.q}</h3>
                <span style={{ fontSize: 20, transition: "transform 0.3s", transform: openFaq === idx ? "rotate(180deg)" : "rotate(0)" }}>
                  ▼
                </span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: "0 24px 20px", borderTop: "1px solid #f0ebff", animation: "slideIn 0.3s ease-out" }}>
                  <p style={{ fontSize: 14, color: "#7b6f8a", lineHeight: 1.8, margin: 0 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div style={{
          padding: "48px 32px",
          background: `linear-gradient(135deg, ${categories[selectedCategory].color}18, ${categories[selectedCategory].color}08)`,
          borderRadius: 16,
          border: `2px solid ${categories[selectedCategory].color}30`,
          textAlign: "center",
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1f1533", marginBottom: 12 }}>Still need help?</h2>
          <p style={{ fontSize: 15, color: "#7b6f8a", marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Our support team is here to help. We typically respond within 24 hours during business hours.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:support@dspath.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                background: `linear-gradient(135deg, ${categories[selectedCategory].color}, ${categories[selectedCategory].color}cc)`,
                color: "white",
                textDecoration: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                transition: "all 0.3s",
                boxShadow: `0 4px 12px ${categories[selectedCategory].color}40`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 8px 24px ${categories[selectedCategory].color}50`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${categories[selectedCategory].color}40`;
              }}
            >
              📧 Email Support
            </a>
            <a
              href="tel:+1234567890"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 28px",
                background: "#f3f4f6",
                color: "#1f1533",
                textDecoration: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                transition: "all 0.3s",
                border: "1px solid #e5e7eb",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#e5e7eb";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              📞 Call Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
