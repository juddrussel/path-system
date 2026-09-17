import { useState } from "react";
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
          <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.ink, marginBottom: 8, letterSpacing: "-0.02em" }}>Help Desk</h1>
          <p style={{ color: colors.muted, fontSize: 14, margin: 0 }}>Find answers to common questions or contact our support team.</p>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Category Tabs */}
        <div style={{ display: "flex", gap: 24, marginBottom: 40, borderBottom: `1px solid ${colors.line}`, paddingBottom: 0 }}>
          {Object.entries(categories).map(([key, title]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                setOpenFaq(null);
              }}
              style={{
                padding: "12px 0",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                color: selectedCategory === key ? colors.violet : colors.muted,
                borderBottom: selectedCategory === key ? `2px solid ${colors.violet}` : "2px solid transparent",
                transition: "all 0.2s",
                marginBottom: -1,
              }}
            >
              {title}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
          {faqs[selectedCategory].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "#fff",
                borderRadius: 12,
                border: `1px solid ${colors.line}`,
                overflow: "hidden",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.08)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
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
                <h3 style={{ fontSize: 14, fontWeight: 700, color: colors.ink, margin: 0 }}>{item.q}</h3>
                <span style={{ fontSize: 16, color: colors.violet, transition: "transform 0.3s", transform: openFaq === idx ? "rotate(180deg)" : "rotate(0)", flexShrink: 0 }}>
                  ▼
                </span>
              </button>
              {openFaq === idx && (
                <div style={{ padding: "0 20px 16px", borderTop: `1px solid ${colors.line}`, background: colors.panel }}>
                  <p style={{ fontSize: 13, color: colors.muted, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${colors.line}`, padding: "32px 28px", textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: colors.ink, marginBottom: 8 }}>Still need help?</h2>
          <p style={{ fontSize: 14, color: colors.muted, marginBottom: 24, maxWidth: 500, margin: "0 auto 24px" }}>
            Our support team is here to help. We typically respond within 24 hours during business hours.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:support@dspath.com"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                background: colors.violet,
                color: "white",
                textDecoration: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                transition: "all 0.2s",
                border: `1px solid ${colors.violet}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = colors.violetDark;
                e.currentTarget.style.borderColor = colors.violetDark;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = colors.violet;
                e.currentTarget.style.borderColor = colors.violet;
              }}
            >
              Email Support
            </a>
            <a
              href="tel:+1234567890"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                background: "transparent",
                color: colors.violet,
                textDecoration: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                transition: "all 0.2s",
                border: `1px solid ${colors.line}`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = colors.panel;
                e.currentTarget.style.borderColor = colors.violet;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = colors.line;
              }}
            >
              Call Us
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
