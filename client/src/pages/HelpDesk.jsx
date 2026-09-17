import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoImg from "../assets/logo.png";

export default function HelpDesk() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("general");

  const categories = {
    general: {
      title: "General Questions",
      items: [
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
    },
    documents: {
      title: "Documents & Submissions",
      items: [
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
          q: "Can I edit a document after submitting?",
          a: "Once submitted, documents are locked. However, if a reviewer requests revisions, you can resubmit a new version.",
        },
      ],
    },
    workflow: {
      title: "Workflow & Tracking",
      items: [
        {
          q: "How do I track my submission status?",
          a: "Use the Tracking page to see the current status of your documents. You can filter by date, status, and document type.",
        },
        {
          q: "What does 'Pending' status mean?",
          a: "'Pending' means your document is waiting to be reviewed by someone. You can see who currently has it assigned to them.",
        },
        {
          q: "How long does review take?",
          a: "Review times vary by document type. Check the SLA Configuration page to see target completion times for each document category.",
        },
        {
          q: "Can I communicate with reviewers?",
          a: "Yes, use the Inbox section to send direct messages or participate in group chats with team members.",
        },
      ],
    },
    technical: {
      title: "Technical Support",
      items: [
        {
          q: "The website is loading slowly. What should I do?",
          a: "Try clearing your browser cache and cookies. If the problem persists, contact support with details about your browser and internet connection.",
        },
        {
          q: "I'm having trouble uploading files.",
          a: "Ensure your file is not corrupted and is under 50MB. Try a different browser or device if possible.",
        },
        {
          q: "My video call isn't working.",
          a: "Check that you have allowed camera and microphone permissions for the website. Try refreshing the page and ensuring you have a stable internet connection.",
        },
        {
          q: "Which browsers are supported?",
          a: "DS PATH works best on Chrome, Firefox, Safari, and Edge (latest versions). Mobile devices are also supported.",
        },
      ],
    },
  };

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
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1f1533", marginBottom: 12 }}>Help Desk</h1>
        <p style={{ color: "#7b6f8a", marginBottom: 32, fontSize: 14 }}>
          Find answers to common questions or contact our support team for assistance.
        </p>

        {/* Category Navigation */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
          {Object.entries(categories).map(([key, { title }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                border: "2px solid transparent",
                background: selectedCategory === key ? "#7c3aed" : "#fff",
                color: selectedCategory === key ? "#fff" : "#494454",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: selectedCategory === key ? "0 4px 12px rgba(124,58,237,0.3)" : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              {title}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
          {categories[selectedCategory].items.map((item, idx) => (
            <div key={idx} style={{ borderBottom: idx < categories[selectedCategory].items.length - 1 ? "1px solid #e5e1f5" : "none", padding: "20px 24px" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1f1533", marginBottom: 8 }}>{item.q}</h3>
              <p style={{ fontSize: 14, color: "#7b6f8a", lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div style={{ marginTop: 48, padding: "32px 24px", background: "linear-gradient(135deg, #7c3aed18, #6b38d418)", borderRadius: 16, border: "1px solid #ddd6fe" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1f1533", marginBottom: 12 }}>Didn't find what you need?</h2>
          <p style={{ color: "#7b6f8a", marginBottom: 16, fontSize: 14 }}>
            Our support team is here to help. Reach out to us via email or use the contact form below.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Email Support</p>
              <a href="mailto:support@dspath.com" style={{ fontSize: 14, fontWeight: 600, color: "#1f1533", textDecoration: "none" }}>
                support@dspath.com
              </a>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Response Time</p>
              <p style={{ fontSize: 14, color: "#1f1533", fontWeight: 600 }}>Within 24 hours</p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Available</p>
              <p style={{ fontSize: 14, color: "#1f1533", fontWeight: 600 }}>Monday - Friday, 9AM - 5PM</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
