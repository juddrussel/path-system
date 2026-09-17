import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, MessageCircle, Headphones, Clock } from "lucide-react";

export default function HelpDesk() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("general");

  const handleBack = () => navigate(-1);

  const categories = {
    general: {
      label: "General",
      items: [
        { q: "What is PATH?", a: "PATH is a document processing and tracking hub designed to streamline academic document workflows for faculty, program chairs, and administrators." },
        { q: "How do I create an account?", a: "You can create an account by clicking 'Register' on the login page and submitting your information, or by accepting an invitation from an administrator." },
      ],
    },
    documents: {
      label: "Documents",
      items: [
        { q: "How do I submit a document?", a: "Navigate to Forms, select the appropriate document category, fill in the required information, and attach your document. Click Submit when ready." },
        { q: "What file formats are accepted?", a: "We accept PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, and image files (JPG, PNG, GIF)." },
      ],
    },
    workflow: {
      label: "Workflow",
      items: [
        { q: "How do I track my submission?", a: "Use the Tracking page to see the current status of your documents. You can filter by date, status, and document type." },
        { q: "What does 'Pending' status mean?", a: "'Pending' means your document is waiting to be reviewed. You can see who currently has it assigned to them." },
      ],
    },
  };

  return (
    <main className="path-info-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        ${pageStyles}
      `}</style>
      <header className="path-info-topbar">
        <div className="path-info-brand">
          <span><FileText size={18} /></span>
          <strong>PATH</strong>
          <small>Processing &amp; Tracking Hub</small>
        </div>
        <nav>
          <button type="button" onClick={() => navigate("/privacy-policy")}>Privacy</button>
          <button type="button" onClick={() => navigate("/terms-of-use")}>Terms</button>
          <button type="button" className="active">Help desk</button>
        </nav>
        <button className="path-info-back" type="button" onClick={handleBack}>
          <ArrowLeft size={14} /> Back
        </button>
      </header>

      <section className="path-info-hero">
        <span className="path-info-kicker"><i /> Support center</span>
        <h1>We're here to help.</h1>
        <p>Find answers to common questions or reach out to our support team for help with PATH.</p>
      </section>

      <section className="path-info-body">
        <div className="path-info-meta">
          <span>Last updated · September 2026</span>
        </div>

        <div className="path-info-layout">
          <div className="path-info-stack">
            {/* Category Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {Object.entries(categories).map(([key, data]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
                  style={{
                    padding: "8px 16px",
                    border: selectedCategory === key ? "1px solid #7134d6" : "1px solid #e9e2f0",
                    background: selectedCategory === key ? "#f1eaff" : "#fff",
                    color: selectedCategory === key ? "#7134d6" : "#776987",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: '"DM Sans", Arial, sans-serif',
                    transition: "all 0.2s",
                  }}
                >
                  {data.label}
                </button>
              ))}
            </div>

            {/* FAQs for selected category */}
            {categories[selectedCategory].items.map((item, idx) => (
              <article key={idx} className="path-info-card">
                <span className="path-info-icon">
                  <MessageCircle size={18} />
                </span>
                <div>
                  <h2>{item.q}</h2>
                  <p>{item.a}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className="path-info-aside">
            <span>Still need help?</span>
            <strong>Contact support</strong>
            <p>Our team typically responds within 24 hours during business hours.</p>
            <hr />
            
            <div style={{ marginBottom: 16 }}>
              <small style={{ display: "block", marginBottom: 8 }}>Email</small>
              <a href="mailto:support@dspath.com" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "#7134d6",
                textDecoration: "none",
                fontSize: 10,
                fontWeight: 800,
              }}>
                support@dspath.com
              </a>
            </div>

            <div style={{ marginBottom: 16 }}>
              <small style={{ display: "block", marginBottom: 8 }}>Phone</small>
              <a href="tel:+1234567890" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                color: "#7134d6",
                textDecoration: "none",
                fontSize: 10,
                fontWeight: 800,
              }}>
                +1 (234) 567-890
              </a>
            </div>

            <hr />
            <small style={{ display: "block", marginBottom: 8, color: "#9a88a6", fontWeight: 800 }}>Business hours</small>
            <p style={{ margin: 0, color: "#78658a", fontSize: 11 }}>
              Monday – Friday<br />9:00 AM – 5:00 PM ET
            </p>
          </aside>
        </div>
      </section>

      <footer className="path-info-footer">
        © 2026 DS PATH. All rights reserved.
      </footer>
    </main>
  );
}

const pageStyles = `
.path-info-page{min-height:100vh;background:#faf9ff;color:#40344b;font-family:"DM Sans",Arial,sans-serif}.path-info-topbar{display:flex;align-items:center;gap:28px;padding:24px clamp(20px,5vw,72px);border-bottom:1px solid #eee8f4;background:#fff}.path-info-brand{display:grid;grid-template-columns:35px auto;column-gap:9px;align-items:center}.path-info-brand>span{display:grid;width:35px;height:35px;grid-row:span 2;place-items:center;border-radius:10px;background:#7c3aed;color:#fff}.path-info-brand strong{font:800 17px Manrope,sans-serif;letter-spacing:.11em}.path-info-brand small{color:#a095a8;font-size:7px;letter-spacing:.1em;text-transform:uppercase}.path-info-topbar nav{display:flex;gap:8px;margin-left:auto}.path-info-topbar button{border:0;background:none;color:#776987;font:800 10px "DM Sans",sans-serif;cursor:pointer}.path-info-topbar nav button{padding:9px 12px;border-radius:8px}.path-info-topbar nav button:hover,.path-info-topbar nav .active{background:#f1eaff;color:#7134d6}.path-info-back{display:inline-flex;align-items:center;gap:6px}.path-info-hero,.path-info-body{max-width:1100px;margin:auto;padding-left:24px;padding-right:24px}.path-info-hero{padding-top:clamp(58px,8vw,96px);padding-bottom:52px}.path-info-kicker{display:flex;align-items:center;gap:7px;color:#8d729e;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.path-info-kicker i{width:6px;height:6px;border-radius:50%;background:#7c3aed}.path-info-hero h1{max-width:760px;margin:16px 0 14px;color:#33293c;font:800 clamp(38px,5.2vw,66px)/1 Manrope,sans-serif;letter-spacing:-.065em}.path-info-hero>p{max-width:590px;margin:0;color:#82768a;font-size:14px;line-height:1.7}.path-info-meta{display:flex;justify-content:space-between;margin-bottom:17px;color:#a095a8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.path-info-layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px}.path-info-stack{display:grid;gap:11px}.path-info-card{display:grid;grid-template-columns:38px 1fr;gap:15px;padding:23px;border:1px solid #e9e2f0;border-radius:15px;background:#fff;box-shadow:0 10px 24px rgba(76,46,102,.04)}.path-info-icon{display:grid;width:35px;height:35px;place-items:center;border-radius:11px;background:#f0eaff;color:#7134d6}.path-info-card h2{margin:0;color:#493358;font:800 14px Manrope,sans-serif}.path-info-card p{margin:8px 0 0;color:#756783;font-size:12px;line-height:1.7}.path-info-aside{align-self:start;padding:22px;border:1px solid #dfd1f0;border-radius:15px;background:#f3edff}.path-info-aside>span{color:#8e73a7;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.path-info-aside strong{display:block;margin-top:13px;color:#553477;font:800 19px/1.18 Manrope,sans-serif}.path-info-aside p{margin:12px 0;color:#78658a;font-size:11px;line-height:1.6}.path-info-aside hr{border:0;border-top:1px solid #ddcef0;margin:20px 0 16px}.path-info-aside small{display:block;color:#9a88a6;font-size:9px}.path-info-aside button{display:inline-flex;align-items:center;gap:5px;margin-top:8px;border:0;background:none;color:#7134d6;font-size:10px;font-weight:800;cursor:pointer}@media(max-width:700px){.path-info-topbar{flex-wrap:wrap;gap:14px;padding:18px 20px}.path-info-topbar nav{order:3;width:100%;margin:0}.path-info-topbar nav button{padding-left:0;margin-right:10px}.path-info-back{margin-left:auto}.path-info-hero{padding:50px 20px 35px}.path-info-body{padding:0 20px 55px}.path-info-meta{display:grid;gap:5px}.path-info-layout{grid-template-columns:1fr}.path-info-aside{order:-1}.path-info-card{padding:18px}}
.path-info-footer{margin-top:60px;padding:40px clamp(20px,5vw,72px);border-top:1px solid #eee8f4;background:#fff;text-align:center;color:#a095a8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
`;
