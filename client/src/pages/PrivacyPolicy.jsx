import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, LockKeyhole, ShieldCheck, CircleHelp } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  const handleBack = () => navigate(-1);
  const handleHelpDesk = () => navigate("/help-desk");

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
          <button type="button" className="active">Privacy</button>
          <button type="button" onClick={handleHelpDesk}>Help desk</button>
        </nav>
        <button className="path-info-back" type="button" onClick={handleBack}>
          <ArrowLeft size={14} /> Back
        </button>
      </header>

      <section className="path-info-hero">
        <span className="path-info-kicker"><i /> Privacy policy</span>
        <h1>A clear record deserves careful stewardship.</h1>
        <p>This policy explains what PATH collects, why it is used, and the controls available to members of your academic department.</p>
      </section>

      <section className="path-info-body">
        <div className="path-info-meta">
          <span>Last updated · September 2026</span>
          <span>Reading time · 4 minutes</span>
        </div>

        <div className="path-info-layout">
          <div className="path-info-stack">
            <Article 
              icon={<LockKeyhole size={18} />} 
              title="Information we collect"
            >
              PATH collects account details such as your name, university email, phone number, department, role, and profile picture. The workspace also stores documents, review decisions, assignments, messages, notifications, timestamps, and audit events that you or authorized members create.
            </Article>

            <Article 
              icon={<ShieldCheck size={18} />} 
              title="How we use information"
            >
              We use this information to authenticate members, route submissions, track ownership and service deadlines, send workflow notifications, maintain an audit trail, and help program chairs and faculty coordinate academic records.
            </Article>

            <Article 
              icon={<FileText size={18} />} 
              title="Access, retention, and security"
            >
              Access is role-aware and limited to authorized workspace members. Records are retained according to department and university requirements. PATH uses administrative, technical, and organizational safeguards designed to protect information from unauthorized access, alteration, or disclosure.
            </Article>

            <Article 
              icon={<CircleHelp size={18} />} 
              title="Your choices and questions"
            >
              You may request corrections to your profile information or ask how a record is being used. For privacy questions, contact the Information Systems Administrator through the Help Desk.
            </Article>
          </div>

          <aside className="path-info-aside">
            <span>At a glance</span>
            <strong>Responsible by design.</strong>
            <p>PATH keeps the people, files, decisions, and timestamps around a document in one accountable record.</p>
            <hr />
            <small>Need help with a privacy request?</small>
            <button type="button" onClick={handleHelpDesk}>
              Open the Help Desk <ArrowRight size={13} />
            </button>
          </aside>
        </div>
      </section>

      <footer className="path-info-footer">
        © 2026 DS PATH. All rights reserved.
      </footer>
    </main>
  );
}

function Article({ icon, title, children }) {
  return (
    <article className="path-info-card">
      <span className="path-info-icon">{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{children}</p>
      </div>
    </article>
  );
}

const pageStyles = `
.path-info-page{min-height:100vh;background:#faf9ff;color:#40344b;font-family:"DM Sans",Arial,sans-serif}.path-info-topbar{display:flex;align-items:center;gap:28px;padding:24px clamp(20px,5vw,72px);border-bottom:1px solid #eee8f4;background:#fff}.path-info-brand{display:grid;grid-template-columns:35px auto;column-gap:9px;align-items:center}.path-info-brand>span{display:grid;width:35px;height:35px;grid-row:span 2;place-items:center;border-radius:10px;background:#7c3aed;color:#fff}.path-info-brand strong{font:800 17px Manrope,sans-serif;letter-spacing:.11em}.path-info-brand small{color:#a095a8;font-size:7px;letter-spacing:.1em;text-transform:uppercase}.path-info-topbar nav{display:flex;gap:8px;margin-left:auto}.path-info-topbar button{border:0;background:none;color:#776987;font:800 10px "DM Sans",sans-serif;cursor:pointer}.path-info-topbar nav button{padding:9px 12px;border-radius:8px}.path-info-topbar nav button:hover,.path-info-topbar nav .active{background:#f1eaff;color:#7134d6}.path-info-back{display:inline-flex;align-items:center;gap:6px}.path-info-hero,.path-info-body{max-width:1100px;margin:auto;padding-left:24px;padding-right:24px}.path-info-hero{padding-top:clamp(58px,8vw,96px);padding-bottom:52px}.path-info-kicker{display:flex;align-items:center;gap:7px;color:#8d729e;font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.path-info-kicker i{width:6px;height:6px;border-radius:50%;background:#7c3aed}.path-info-hero h1{max-width:760px;margin:16px 0 14px;color:#33293c;font:800 clamp(38px,5.2vw,66px)/1 Manrope,sans-serif;letter-spacing:-.065em}.path-info-hero>p{max-width:590px;margin:0;color:#82768a;font-size:14px;line-height:1.7}.path-info-meta{display:flex;justify-content:space-between;margin-bottom:17px;color:#a095a8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.path-info-layout{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px}.path-info-stack{display:grid;gap:11px}.path-info-card{display:grid;grid-template-columns:38px 1fr;gap:15px;padding:23px;border:1px solid #e9e2f0;border-radius:15px;background:#fff;box-shadow:0 10px 24px rgba(76,46,102,.04)}.path-info-icon{display:grid;width:35px;height:35px;place-items:center;border-radius:11px;background:#f0eaff;color:#7134d6}.path-info-card h2{margin:0;color:#493358;font:800 14px Manrope,sans-serif}.path-info-card p{margin:8px 0 0;color:#756783;font-size:12px;line-height:1.7}.path-info-aside{align-self:start;padding:22px;border:1px solid #dfd1f0;border-radius:15px;background:#f3edff}.path-info-aside>span{color:#8e73a7;font-size:9px;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.path-info-aside strong{display:block;margin-top:13px;color:#553477;font:800 19px/1.18 Manrope,sans-serif}.path-info-aside p{margin:12px 0;color:#78658a;font-size:11px;line-height:1.6}.path-info-aside hr{border:0;border-top:1px solid #ddcef0;margin:20px 0 16px}.path-info-aside small{display:block;color:#9a88a6;font-size:9px}.path-info-aside button{display:inline-flex;align-items:center;gap:5px;margin-top:8px;border:0;background:none;color:#7134d6;font-size:10px;font-weight:800;cursor:pointer}@media(max-width:700px){.path-info-topbar{flex-wrap:wrap;gap:14px;padding:18px 20px}.path-info-topbar nav{order:3;width:100%;margin:0}.path-info-topbar nav button{padding-left:0;margin-right:10px}.path-info-back{margin-left:auto}.path-info-hero{padding:50px 20px 35px}.path-info-body{padding:0 20px 55px}.path-info-meta{display:grid;gap:5px}.path-info-layout{grid-template-columns:1fr}.path-info-aside{order:-1}.path-info-card{padding:18px}}
.path-info-footer{margin-top:60px;padding:40px clamp(20px,5vw,72px);border-top:1px solid #eee8f4;background:#fff;text-align:center;color:#a095a8;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}
`;
