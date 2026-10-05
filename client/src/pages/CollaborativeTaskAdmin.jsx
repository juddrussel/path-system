import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  ListChecks,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket.js";
import { r2ToProxyUrl, resolveFileUrl, createAuthenticatedBlobUrl } from "../utils/r2ProxyHelper.js";
import AlertModal from "../components/AlertModal";

const SERVER_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const api = SERVER_URL;

const ADMIN_ROLES = ["admin", "program_chair"];

function getUser(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function initials(value) {
  return String(value || "Faculty")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// Helper to construct full avatar URL - use resolveFileUrl which handles R2 URLs properly
function fullAvatarUrl(url) {
  if (!url) return null;
  return resolveFileUrl(SERVER_URL, url);
}

// Avatar component that shows profile picture if available, otherwise initials
function Avatar({ profilePicture, fullName, userId, size = "40px" }) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const src = fullAvatarUrl(profilePicture);
  
  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={fullName}
        className="collab-avatar-img"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0
        }}
        onError={() => setImgFailed(true)}
      />
    );
  }
  
  // Fallback to initials
  return (
    <span className={`collab-avatar ${getTone(userId || 0)}`}>
      {initials(fullName)}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const tones = ["violet", "rose", "blue", "green", "amber"];
const getTone = (index) => tones[index % tones.length];

// PDF reading URL formatter (matching TaskDetail.jsx pattern)
const pdfReadingUrl = (value, zoom = "page-width") => {
  if (!value) return "";
  const [fileUrl, currentFragment = ""] = value.split("#");
  const params = new URLSearchParams(currentFragment);
  params.set("navpanes", "0");
  params.set("toolbar", "0");
  params.set("zoom", String(zoom));
  return `${fileUrl}#${params.toString()}`;
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Manrope:wght@400;600;700;800&display=swap');
  /* PDF Reader Modal Styles - EXACT from TaskDetail.jsx */
  /* Decision Station Styles - from TaskDetail.jsx */
  .td-decision{overflow:hidden;border:1px solid #decff0;border-radius:14px;background:linear-gradient(150deg,#f5efff,#fcfaff 58%,#fff);box-shadow:0 12px 26px rgba(79,44,119,.055)}.td-decision-head{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-bottom:1px solid #e6daef}.td-decision-head>span{color:#825c9b;font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-state{display:inline-flex;align-items:center;gap:5px;border-radius:6px;padding:5px 7px;background:#f0e6ff;color:#7244ac;font-size:12px;font-weight:800}.td-state.waiting{background:#fff3da;color:#9a7225}.td-state.approved{background:#e7f6ed;color:#478d6c}.td-state.returned{background:#feeae6;color:#b05d51}.td-state.review{background:#f0e6ff;color:#7244ac}.td-decision h2{margin:17px 15px 6px;color:#51395d;font:800 17px Manrope,sans-serif;letter-spacing:-.05em;line-height:1.16}.td-decision>p{margin:0 15px 16px;color:#8a7996;font-size:12px;line-height:1.55}.td-action-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 15px 15px}.td-action-buttons button{display:flex;align-items:center;justify-content:center;gap:6px;min-height:33px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer}.td-approve{border:1px solid #7c3aed;background:#7c3aed;color:#fff}.td-return{border:1px solid #d8c8e8;background:#fff;color:#76538d}.td-action-buttons button:disabled{background:#e7e1ea;border-color:#e7e1ea;color:#a89fad;cursor:not-allowed}.td-no-submission{display:flex;align-items:flex-start;gap:8px;margin:0 15px 15px;padding:10px;border:1px solid #e5d8ee;border-left:3px solid #a78bfa;border-radius:8px;background:#fbf9ff;color:#735989}.td-no-submission svg{flex:none;margin-top:1px}.td-no-submission strong{display:block;color:#614677;font-size:12px}.td-no-submission p{margin:4px 0 0;color:#8d7b99;font-size:11px;line-height:1.5}
  .td-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.td-reader{width:min(1120px,calc(100vw - 48px));max-height:calc(100vh - 36px);overflow:auto;border:1px solid #e1d8ea;border-radius:13px;background:#fff;box-shadow:0 28px 80px rgba(45,27,64,.32)}.td-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid #eee7f2}.td-reader-eyebrow{display:flex;align-items:center;gap:6px;color:#9c8da7;font-size:12px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-reader-eyebrow i{width:5px;height:5px;border-radius:50%;background:#a78bfa}.td-reader-head h2{margin:7px 0 0;color:#4b3757;font:800 18px Manrope,sans-serif;letter-spacing:-.04em}.td-reader-head p{margin:5px 0 0;color:#907f9a;font-size:12px}.td-reader-head-actions{display:flex;align-items:center;gap:11px;padding-top:4px}.td-reader-head-actions span{color:#8058a5;font-size:12px;font-weight:800}.td-reader-head-actions button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e2d9e8;border-radius:7px;background:#fff;color:#76568d;font-size:17px;cursor:pointer}.td-reader-stage{padding:18px;background:linear-gradient(135deg,#f2edf8,#faf9fd)}.td-reader-frame{width:min(680px,100%);margin:0 auto;border:1px solid #ded6e4;border-radius:8px;overflow:hidden;background:#27272a;box-shadow:0 16px 30px rgba(49,35,62,.22)}.td-reader-toolbar{display:flex;align-items:center;gap:9px;min-height:43px;padding:0 12px;background:#303035;color:#f7f4fb}.td-reader-toolbar b{display:grid;min-width:18px;height:20px;place-items:center;border-radius:3px;background:#171719;color:#fff;font-size:12px}.td-reader-toolbar span{font-size:12px;font-weight:800}.td-reader-toolbar button{display:grid;width:21px;height:21px;place-items:center;border:0;border-radius:3px;background:transparent;color:#f5f3f7;font-size:16px;cursor:pointer}.td-reader-toolbar button:hover{background:rgba(255,255,255,.12)}.td-reader-toolbar .td-reader-toolbar-spacer{flex:1}.td-reader-paper{display:flex;min-height:clamp(440px,67vh,720px);align-items:stretch;justify-content:center;background:#f7f7f7}.td-reader-paper iframe{width:100%;min-height:clamp(440px,67vh,720px);border:0;background:#fff}.td-reader-paper img{display:block;max-width:100%;max-height:clamp(440px,67vh,720px);object-fit:contain;background:#fff}.td-reader-fallback{display:flex;min-height:440px;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:24px;color:#806e89;text-align:center}.td-reader-fallback strong{color:#60496d;font-size:13px}.td-reader-fallback span{max-width:300px;font-size:12px;line-height:1.55}@media(max-width:720px){.td-reader{width:calc(100vw - 20px);max-height:calc(100vh - 20px)}.td-reader-head{padding:13px}.td-reader-head h2{font-size:16px}.td-reader-head-actions span{display:none}.td-reader-stage{padding:11px}.td-reader-toolbar{gap:5px;padding:0 8px}.td-reader-paper,.td-reader-paper iframe{min-height:58vh}.td-reader-paper img{max-height:58vh}}
  /* Collab Styles - EXACT from CollaborativeTaskDetail.jsx for Discussion Section */
  .collab-standalone{min-height:100vh;background:#f8f7ff;color:#4c3b58;font-family:'DM Sans','Manrope',system-ui,sans-serif;box-sizing:border-box;display:flex;flex-direction:column}.collab-standalone *{box-sizing:border-box}.collab-wrapper{flex:1;overflow:auto;padding:28px 40px 44px}@media(min-width:1100px){.collab-wrapper{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.collab-shell{max-width:none;margin:0 auto}.collab-hero,.collab-card,.collab-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}.collab-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}.collab-top,.collab-hero-grid,.collab-heading,.collab-person,.collab-version,.collab-composer-footer,.collab-actions{display:flex;align-items:center;justify-content:space-between;gap:14px}.collab-back,.collab-link{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.collab-live{color:#55957a;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-live i{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#50b084}.collab-hero-grid{align-items:end;margin-top:34px}.collab-eyebrow,.collab-kicker{display:inline-flex;align-items:center;gap:5px;color:#947fa4;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.collab-eyebrow svg{flex-shrink:0}.collab-hero h1{max-width:650px;margin:10px 0 9px;color:#372541;font:800 38px/1.05 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.collab-hero p{max-width:650px;margin:0;color:#887995;font-size:12px;line-height:1.55}.collab-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;color:#887995;font-size:12px}.collab-meta span{display:flex;align-items:center;gap:5px}.collab-status{width:250px;padding:17px;border:1px solid #e2d6ef;border-radius:12px;background:rgba(255,255,255,.86)}.collab-status small,.collab-status strong{display:block}.collab-status small{color:#9888a1;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-status strong{margin-top:7px;color:#553d66;font:800 16px 'Manrope',Arial,sans-serif}.collab-progress{height:6px;margin-top:14px;border-radius:99px;background:#e9e0ef;overflow:hidden}.collab-progress i{display:block;height:100%;border-radius:inherit;background:#7c3aed}.collab-status em{display:block;margin-top:7px;color:#8b7b96;font-size:12px;font-style:normal}.collab-layout{display:grid;grid-template-columns:minmax(0,1.48fr) minmax(280px,.56fr);align-items:start;gap:16px;margin-top:16px}.collab-main,.collab-side{display:flex;flex-direction:column;gap:16px}.collab-card,.collab-side-card{padding:22px}.collab-heading{align-items:flex-start}.collab-heading h2{margin:4px 0 0;color:#4b3858;font:800 18px 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.collab-count,.collab-badge{padding:6px 8px;border-radius:6px;background:#f0e7fc;color:#7546b5;font-size:12px;font-weight:800;white-space:nowrap}.collab-muted{margin:13px 0 0;color:#8f8199;font-size:12px;line-height:1.55}.collab-brief-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px;padding-top:16px;border-top:1px solid #f0ebf3}.collab-brief-grid small,.collab-brief-grid strong{display:block}.collab-brief-grid small{color:#9b8da2;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-brief-grid strong{margin-top:7px;color:#56405f;font-size:12px;line-height:1.35}.collab-version{margin-top:16px;padding:11px;border:1px solid #e1d5ef;border-radius:9px;background:#fbf8ff;display:flex;align-items:center;gap:9px}.collab-version>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee3fc;color:#7043b6;flex-shrink:0}.collab-version>div{min-width:0;flex:1}.collab-version strong,.collab-version small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-version strong{color:#5f456d;font-size:12px}.collab-version small{margin-top:3px;color:#978aa0;font-size:12px}.collab-version em{padding:5px 7px;border-radius:5px;background:#fff3d7;color:#966f22;font-size:12px;font-style:normal;font-weight:800}.collab-people{display:grid;gap:8px;margin-top:15px}.collab-person{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #eee8f2;border-radius:9px}.collab-avatar{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:8px;background:#eee5fb;color:#7043b7;font-size:12px;font-weight:800}.collab-avatar.rose{background:#fde9ef;color:#b45c77}.collab-avatar.blue{background:#e8f1ff;color:#5274a8}.collab-avatar.green{background:#e4f5ec;color:#4d966e}.collab-avatar.amber{background:#fef5e5;color:#9d6d2a}.collab-person-copy{min-width:0;flex:1}.collab-person-copy strong,.collab-person-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-person-copy strong{color:#5a4568;font-size:12px}.collab-person-copy small{margin-top:3px;color:#978ba1;font-size:12px}.collab-person-status{display:inline-flex;align-items:center;gap:4px;color:#8d8195;font-size:12px;font-weight:800}.collab-person-status.confirmed{color:#579574}.collab-toggle{padding:5px 7px;border:1px solid #ded2e8;border-radius:6px;background:#fff;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.collab-upload{display:flex;align-items:center;gap:10px;width:100%;margin-top:16px;padding:12px;border:1px dashed #cdbbe6;border-radius:9px;background:#fff;color:#7044a3;text-align:left;cursor:pointer;position:relative}.collab-upload.selected{border-style:solid;border-color:#bfe1cd;background:#f5fbf8;color:#4d8d6c}.collab-upload>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee5ff;flex-shrink:0}.collab-upload>div{min-width:0;flex:1}.collab-upload strong,.collab-upload small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-upload strong{font-size:12px}.collab-upload small{margin-top:3px;color:#9a8ba6;font-size:12px}.collab-label{display:block;margin-top:12px;color:#806f8b;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-label textarea,.collab-composer textarea,.collab-review textarea,.collab-modal textarea{display:block;width:100%;margin-top:7px;padding:10px;border:1px solid #e2d9e9;border-radius:8px;outline:0;resize:vertical;color:#5d4867;font:12px/1.5 DM Sans,Arial,sans-serif}.collab-primary,.collab-review button{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:11px;padding:9px 11px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer}.collab-primary:disabled,.collab-review button:disabled{background:#ddd3e5;color:#9c91a5;cursor:not-allowed}.collab-history{display:grid;gap:7px;margin-top:17px}.collab-history>div{display:flex;align-items:center;gap:9px;padding:9px;border-top:1px solid #f0ebf3}.collab-history>div>span{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:12px;font-weight:800}.collab-history>div>div{min-width:0;flex:1}.collab-history strong,.collab-history small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-history strong{color:#5c4668;font-size:12px}.collab-history small{margin-top:3px;color:#998ba3;font-size:12px}.collab-history em{color:#7b5aa1;font-size:12px;font-style:normal;font-weight:800}.collab-messages{display:grid;gap:12px;margin-top:16px}.collab-message{display:flex;gap:9px;padding:11px;border:1px solid #f0ebf3;border-radius:9px;background:#fdfcff}.collab-message-content{min-width:0;flex:1}.collab-message header{display:flex;align-items:center;gap:7px}.collab-message header strong{color:#5b4766;font-size:13px}.collab-message header small{color:#a394a8;font-size:11px}.collab-message p{margin:6px 0 0;color:#75657d;font-size:13px;line-height:1.5}.collab-thread{display:flex;gap:9px;margin-top:8px}.collab-thread button{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:#7954a0;font-size:12px;font-weight:800;cursor:pointer}.collab-attachment{display:grid;grid-template-columns:28px minmax(0,1fr);gap:4px 7px;margin-top:8px;padding:8px;border:1px solid #e5d9ef;border-radius:8px;background:#fbf8ff}.collab-attachment span{display:grid;width:28px;height:28px;place-items:center;grid-row:span 2;border-radius:7px;background:#eee5fb;color:#7043b7}.collab-attachment strong,.collab-attachment small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-attachment strong{color:#60486f;font-size:12px}.collab-attachment small{color:#998ba3;font-size:12px}.collab-composer{margin-top:16px;border:1px solid #e4dce9;border-radius:10px;background:#fff;overflow:hidden}.collab-composer textarea{min-height:75px;margin:0;padding:11px;border:0}.collab-composer-footer{align-items:flex-end;padding:8px}.collab-composer-footer small{color:#998ba3;font-size:12px}.collab-composer-footer strong{color:#5d4867;font-size:12px}.collab-composer-actions{display:flex;gap:6px}.collab-composer-actions button{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer}.collab-composer-actions button:first-child{border:1px solid #ddd1e8;background:#fff;color:#76538d}.collab-composer-actions button:disabled{opacity:.45;cursor:not-allowed}.collab-review h2,.collab-side-card h2{margin:8px 0;color:#51395d;font:800 18px/1.15 'Manrope',Arial,sans-serif;letter-spacing:-.05em}.collab-review p,.collab-side-card p{margin:0;color:#8a7996;font-size:12px;line-height:1.55}.collab-review textarea{margin-top:13px}.collab-review-actions{display:flex;gap:7px}.collab-review-actions button{flex:1}.collab-review-actions button:last-child{border:1px solid #d8c8e8;background:#fff;color:#76538d}.collab-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.collab-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}.collab-modal h2{margin:7px 0;color:#4b3656;font:800 19px 'Manrope',Arial,sans-serif}.collab-modal p{color:#8d7f97;font-size:12px;line-height:1.5}.collab-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}.collab-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:16px}.collab-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:12px;font-weight:800;cursor:pointer}.collab-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}@media(max-width:850px){.collab-wrapper{padding:18px}.collab-layout{grid-template-columns:1fr}.collab-status{width:100%;max-width:330px}.collab-hero-grid{align-items:stretch;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.collab-hero{padding:20px}.collab-hero h1{font-size:29px}.collab-card,.collab-side-card{padding:17px}.collab-top{align-items:flex-start;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr}.collab-person{align-items:flex-start;flex-wrap:wrap}.collab-toggle{margin-left:38px}.collab-composer-footer{align-items:stretch;flex-direction:column}.collab-composer-actions{width:100%}.collab-composer-actions button{flex:1;justify-content:center}}
  .admin-collab{min-height:100vh;background:#f8f7ff;color:#40344b;font-family:'DM Sans','Manrope',system-ui,sans-serif;box-sizing:border-box;display:flex;flex-direction:column}.admin-collab *{box-sizing:border-box}.admin-wrapper{flex:1;overflow:auto;padding:28px 40px 44px}@media(min-width:1100px){.admin-wrapper{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.admin-shell{max-width:none;margin:0 auto}.admin-hero,.admin-card,.admin-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}.admin-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}.admin-top,.admin-heading,.admin-person,.admin-file,.admin-file-actions,.admin-version-head,.admin-thread-actions,.admin-reply,.admin-decision-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.admin-back{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.admin-role{display:inline-flex;align-items:center;gap:6px;color:#6f47a9;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.admin-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:34px;align-items:end;margin-top:32px}.admin-eyebrow,.admin-kicker{display:flex;align-items:center;gap:6px;color:#927da5;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.admin-eyebrow svg{color:#7c3aed}.admin-hero h1{margin:11px 0 9px;color:#372541;font:800 38px/1.05 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.admin-hero p{max-width:620px;margin:0;color:#887995;font-size:12px;line-height:1.55}.admin-meta{display:flex;flex-wrap:wrap;gap:13px;margin-top:18px;color:#887995;font-size:12px}.admin-meta span{display:flex;align-items:center;gap:5px}.admin-status{padding:17px;border:1px solid #c7e6d1;border-radius:12px;background:#f8fdf9}.admin-status small,.admin-status strong,.admin-status em{display:block}.admin-status small{color:#6e947d;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.admin-status strong{margin-top:8px;color:#3f805e;font:800 17px 'Manrope',Arial,sans-serif}.admin-status em{margin-top:8px;color:#7b9a87;font-size:12px;font-style:normal}.admin-progress{height:6px;margin-top:13px;border-radius:99px;background:#deeee3;overflow:hidden}.admin-progress i{display:block;width:100%;height:100%;border-radius:inherit;background:#55a879}.admin-layout{display:grid;grid-template-columns:minmax(0,1.48fr) minmax(280px,.56fr);align-items:start;gap:16px;margin-top:16px}.admin-main,.admin-side{display:grid;align-content:start;gap:16px}.admin-card,.admin-side-card{padding:22px}.admin-heading{align-items:flex-start}.admin-heading h2{margin:5px 0 0;color:#4b3858;font:800 18px 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.admin-id{padding:6px 8px;border-radius:6px;background:#f4eff9;color:#9b8ba5;font-size:12px;font-weight:800}.admin-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:17px}.admin-metrics div{padding:12px;border:1px solid #eee8f2;border-radius:9px;background:#fdfcff}.admin-metrics strong,.admin-metrics small{display:block}.admin-metrics strong{color:#5d3d76;font:800 21px 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.admin-metrics small{margin-top:4px;color:#998ca3;font-size:12px}.admin-brief{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:17px;padding-top:15px;border-top:1px solid #f0ebf3}.admin-brief small,.admin-brief strong{display:block}.admin-brief small{color:#9b8da2;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.admin-brief strong{margin-top:6px;color:#56405f;font-size:12px}.admin-brief .high{color:#bb6d58}.admin-success,.admin-file-status{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border-radius:7px;background:#e7f6ed;color:#4d946f;font-size:12px;font-weight:800;white-space:nowrap}.admin-muted{margin:11px 0 0;color:#8b7d96;font-size:12px;line-height:1.55}.admin-people{display:grid;gap:7px;margin-top:16px}.admin-person{padding:10px;border:1px solid #eee8f2;border-radius:9px;background:#fdfcff;display:flex;align-items:center;gap:9px}.admin-avatar{display:grid;width:30px;height:30px;flex:none;place-items:center;border-radius:8px;font-size:12px;font-weight:800}.admin-avatar.rose{background:#fde9ef;color:#b45c77}.admin-avatar.blue{background:#e8f1ff;color:#5274a8}.admin-avatar.green{background:#e4f5ec;color:#4d966e}.admin-avatar.amber{background:#fff0d6;color:#a67526}.admin-avatar.violet{background:#eee5fb;color:#7043b7}.admin-person>div{min-width:0;flex:1}.admin-person strong,.admin-person small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-person strong{color:#5a4567;font-size:12px}.admin-person small{margin-top:3px;color:#9c8fa4;font-size:12px}.admin-confirmed{display:inline-flex;align-items:center;gap:4px;color:#4d946f;font-size:12px;font-weight:800}.admin-file{margin-top:16px;padding:12px;border:1px solid #e2d8eb;border-radius:9px;background:#fbf8ff;display:flex;align-items:flex-start;gap:12px}.admin-file-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:9px;background:#eee5ff;color:#7043b7;flex-shrink:0}.admin-file>div:nth-child(2){min-width:0;flex:1}.admin-file strong,.admin-file small,.admin-file p{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-file strong{color:#5a4567;font-size:12px}.admin-file small{margin-top:4px;color:#9689a0;font-size:12px}.admin-file p{margin:6px 0 0;color:#806e8a;font-size:12px}.admin-file>button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #decfea;border-radius:7px;background:#fff;color:#76538d;cursor:pointer;flex-shrink:0}.admin-file-actions{justify-content:flex-start;margin-top:9px}.admin-outline,.admin-primary{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border-radius:7px;font-size:12px;font-weight:800;cursor:pointer}.admin-outline{border:1px solid #e1d6eb;background:#fff;color:#76538d}.admin-primary{border:0;background:#7c3aed;color:#fff}.admin-versions{margin-top:18px}.admin-version-head{display:flex;align-items:center;justify-content:space-between;color:#60486f;font-size:12px;font-weight:800}.admin-version-head small{color:#9c8ea4;font-size:12px;font-weight:500}.admin-version{display:flex;align-items:flex-start;gap:9px;margin-top:7px;padding:9px;border-top:1px solid #f0ebf3}.admin-version.current{border:1px solid #cfe7d8;border-radius:8px;background:#f8fdf9;margin-top:0;padding:11px}.admin-version-number{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:12px;font-weight:800;flex-shrink:0}.admin-version>div{min-width:0;flex:1}.admin-version strong,.admin-version small,.admin-version p{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-version strong{color:#5c4668;font-size:12px}.admin-version small{margin-top:3px;color:#998ba3;font-size:12px}.admin-version p{margin:4px 0 0;color:#806f8b;font-size:12px}.admin-version em{color:#7b5aa1;font-size:12px;font-style:normal;font-weight:800}.admin-message{display:grid;grid-template-columns:30px 1fr;gap:10px;margin-top:17px}.admin-message header{display:flex;align-items:center;gap:7px}.admin-message header strong{color:#5a4567;font-size:13px}.admin-message header small{color:#a095a8;font-size:11px}.admin-message p{margin:6px 0 0;color:#746681;font-size:13px;line-height:1.55}.admin-thread-actions{justify-content:flex-start;margin-top:8px}.admin-thread-actions button{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:#7953a0;font-size:12px;font-weight:800;cursor:pointer}.admin-thread-actions span{color:#a095a8;font-size:12px}.admin-reply{display:flex;align-items:flex-end;margin-top:9px;padding:9px;border:1px solid #e7d9f3;border-radius:8px;background:#faf7ff;gap:9px}.admin-reply textarea,.admin-review-note textarea,.admin-modal textarea{min-width:0;flex:1;padding:9px;border:1px solid #e3dbe9;border-radius:8px;outline:0;resize:vertical;color:#5e496b;font:12px/1.5 'DM Sans',Arial,sans-serif}.admin-reply button,.admin-decision-actions button{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer;flex-shrink:0}.admin-reply button:disabled{opacity:.45;cursor:not-allowed}.admin-side-card h2{margin:8px 0 7px;color:#493358;font:800 18px/1.12 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.admin-side-card>p{margin:0;color:#897b93;font-size:12px;line-height:1.55}.admin-review-note{display:block;margin-top:13px;color:#806f8b;font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.admin-review-note textarea{display:block;width:100%;margin-top:7px;font-size:12px}.admin-decision-actions{margin-top:9px;display:flex;gap:7px;flex-direction:column}.admin-decision-actions button:last-child{border:1px solid #dccfe8;background:#fff;color:#76538d}.admin-timeline{position:relative;display:grid;gap:16px;margin-top:19px}.admin-timeline:before{position:absolute;top:13px;bottom:13px;left:12px;width:1px;background:#e8dff0;content:""}.admin-timeline>div{position:relative;display:grid;grid-template-columns:25px 1fr;gap:8px}.admin-timeline span{z-index:1;display:grid;width:25px;height:25px;place-items:center;border:1px solid #e2d7ec;border-radius:50%;background:#fff;color:#9f8daf}.admin-timeline span.done{border-color:#bfe3ce;background:#ebf8f0;color:#4d946f}.admin-timeline span.current{border-color:#c1a5e4;background:#f3eaff;color:#7344b4}.admin-timeline p{margin:2px 0 0}.admin-timeline strong,.admin-timeline small{display:block}.admin-timeline strong{color:#60486f;font-size:12px}.admin-timeline small{margin-top:3px;color:#9b8da3;font-size:12px}.admin-policy{display:grid;gap:13px;background:linear-gradient(145deg,#f4edff,#fff);padding:14px;border-radius:9px}.admin-policy>div{display:flex;align-items:flex-start;gap:8px;color:#7041b5}.admin-policy strong,.admin-policy small{display:block}.admin-policy strong{color:#604477;font-size:12px}.admin-policy small{margin-top:3px;color:#978aa0;font-size:12px;line-height:1.4}.admin-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.admin-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}.admin-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}.admin-modal h2{margin:7px 0;color:#4b3656;font:800 19px 'Manrope',Arial,sans-serif}.admin-modal p{color:#8d7f97;font-size:12px;line-height:1.5}.admin-modal textarea{display:block;width:100%;margin-top:14px;font-size:12px}.admin-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:11px}.admin-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:12px;font-weight:800;cursor:pointer}.admin-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}.admin-modal-actions button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:850px){.admin-wrapper{padding:18px}.admin-hero-grid,.admin-layout{grid-template-columns:1fr}.admin-status{max-width:350px}}@media(max-width:560px){.admin-hero{padding:20px}.admin-top{align-items:flex-start;flex-direction:column}.admin-hero h1{font-size:29px}.admin-card,.admin-side-card{padding:17px}.admin-metrics{grid-template-columns:1fr 1fr}.admin-brief{grid-template-columns:1fr 1fr}.admin-person{align-items:flex-start;flex-wrap:wrap}.admin-confirmed{margin-left:40px}.admin-file-actions,.admin-decision-actions{align-items:stretch;flex-direction:column}.admin-outline,.admin-primary,.admin-decision-actions button{justify-content:center}.admin-reply{align-items:stretch;flex-direction:column}.admin-reply button{justify-content:center}}
`;

const MAX_VISUAL_DEPTH = 6;

function RenderReplies({ 
  replies, 
  depth, 
  replyTo, 
  setReplyTo, 
  getTone, 
  initials, 
  formatDate,
  imageLoadingStates,
  setImageLoadingStates,
  replyDraft,
  setReplyDraft,
  replyFiles,
  setReplyFiles,
  replyFileProgress,
  setReplyFileProgress,
  replyUploadedFiles,
  setReplyUploadedFiles,
  isReplyUploadingFiles,
  setIsReplyUploadingFiles,
  replyFilesRef,
  setError,
  api,
  token,
  taskId
}) {
  // Only indent if we haven't reached max visual depth
  const shouldIndent = depth <= MAX_VISUAL_DEPTH;
  
  return (
    <div style={{ 
      marginLeft: shouldIndent ? "28px" : "0", 
      borderLeft: shouldIndent ? "2px solid #e9ddfb" : "none", 
      paddingTop: "8px" 
    }}>
      {replies.map((reply) => (
        <div key={reply.id}>
          <article className="collab-message" style={{ background: "#fcfaff", border: "1px solid #f0ebf3" }}>
            <Avatar 
              profilePicture={reply.profilePicture || reply.profile_picture}
              fullName={reply.full_name}
              userId={reply.user_id || reply.sender_id || reply.userId}
            />
            <div className="collab-message-content">
              <header>
                <strong>{reply.full_name}</strong>
                <small>{formatDate(reply.created_at)}</small>
              </header>
              <p style={{ margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{reply.content}</p>
              {reply.files && reply.files.length > 0 && (
                <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                  {reply.files.map((file, idx) => {
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                    const imageKey = `reply-${reply.id}-file-${idx}`;
                    const imageLoading = imageLoadingStates[imageKey] ?? true;
                    return isImage ? (
                      <div 
                        key={idx}
                        style={{ 
                          position: "relative",
                          display: "inline-block",
                          maxWidth: "280px"
                        }}
                      >
                        {imageLoading && (
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f5f0fb",
                            borderRadius: "6px",
                            border: "1px solid #e2d9e9",
                            zIndex: 1
                          }}>
                            <div style={{
                              width: "24px",
                              height: "24px",
                              border: "2px solid #e2d9e9",
                              borderTopColor: "#7c3aed",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite"
                            }} />
                          </div>
                        )}
                        <a 
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const blobUrl = await createAuthenticatedBlobUrl(api, file.url);
                              window.open(blobUrl, "_blank");
                              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                            } catch (error) {
                              console.error("Failed to open file:", error);
                              setAlertModal({ isOpen: true, message: "Failed to open file. Please try again." });
                            }
                          }}
                          rel="noopener noreferrer"
                          style={{ display: "block", maxWidth: "280px" }}
                        >
                          <img 
                            src={imageBlobUrls[imageKey] || ""}
                            alt={file.name}
                            onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                            onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                            style={{ 
                              maxWidth: "100%", 
                              borderRadius: "6px", 
                              border: "1px solid #e2d9e9", 
                              cursor: "pointer",
                              display: imageLoading || !imageBlobUrls[imageKey] ? "none" : "block"
                            }}
                          />
                        </a>
                      </div>
                    ) : (
                      <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px" }}>📎</span>
                        <a 
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              const blobUrl = await createAuthenticatedBlobUrl(api, file.url);
                              window.open(blobUrl, "_blank");
                              setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                            } catch (error) {
                              console.error("Failed to open file:", error);
                              setAlertModal({ isOpen: true, message: "Failed to open file. Please try again." });
                            }
                          }}
                          rel="noopener noreferrer"
                          style={{ flex: 1, minWidth: 0, color: "#7043b6", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline" }}
                        >
                          {file.name}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="collab-thread">
                <button type="button" onClick={() => setReplyTo(replyTo === reply.id ? null : reply.id)}>
                  <Reply size={12} /> Reply
                </button>
              </div>
            </div>
          </article>

          {/* Reply form for this nested reply */}
          {replyTo === reply.id && (
            <ReplyForm
              reply={reply}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              replyFileProgress={replyFileProgress}
              setReplyFileProgress={setReplyFileProgress}
              replyUploadedFiles={replyUploadedFiles}
              setReplyUploadedFiles={setReplyUploadedFiles}
              isReplyUploadingFiles={isReplyUploadingFiles}
              setIsReplyUploadingFiles={setIsReplyUploadingFiles}
              replyFilesRef={replyFilesRef}
              setReplyTo={setReplyTo}
              setError={setError}
              api={api}
              token={token}
              taskId={taskId}
            />
          )}

          {/* Recursively render this reply's replies (unlimited threading depth) */}
          {reply.replies && reply.replies.length > 0 && (
            <RenderReplies 
              replies={reply.replies}
              depth={depth + 1}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              getTone={getTone}
              initials={initials}
              formatDate={formatDate}
              imageLoadingStates={imageLoadingStates}
              setImageLoadingStates={setImageLoadingStates}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              replyFileProgress={replyFileProgress}
              setReplyFileProgress={setReplyFileProgress}
              replyUploadedFiles={replyUploadedFiles}
              setReplyUploadedFiles={setReplyUploadedFiles}
              isReplyUploadingFiles={isReplyUploadingFiles}
              setIsReplyUploadingFiles={setIsReplyUploadingFiles}
              replyFilesRef={replyFilesRef}
              setError={setError}
              api={api}
              token={token}
              taskId={taskId}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Reply form component (extracted for reuse)
function ReplyForm({
  reply,
  replyDraft,
  setReplyDraft,
  replyFiles,
  setReplyFiles,
  replyFileProgress,
  setReplyFileProgress,
  replyUploadedFiles,
  setReplyUploadedFiles,
  isReplyUploadingFiles,
  setIsReplyUploadingFiles,
  replyFilesRef,
  setReplyTo,
  setError,
  api,
  token,
  taskId
}) {
  
  const uploadReplyFiles = async (filesToUpload) => {
    try {
      setIsReplyUploadingFiles(true);
      const uploadedUrls = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch(`${api}/api/collab-task/${taskId}/upload-message-file`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error("File upload failed");
        }
        
        const data = await response.json();
        uploadedUrls.push({ name: file.name, url: data.fileUrl });
        
        setReplyFileProgress(prev => ({ ...prev, [replyFiles.length - filesToUpload.length + i]: 100 }));
      }
      
      setReplyUploadedFiles(prev => [...prev, ...uploadedUrls]);
      setIsReplyUploadingFiles(false);
    } catch (err) {
      console.error("Reply file upload error:", err);
      setError("Failed to upload reply files");
      setIsReplyUploadingFiles(false);
    }
  };
  
  const postReply = async () => {
    if (!replyDraft.trim() && replyUploadedFiles.length === 0) return;
    
    try {
      const response = await fetch(`${api}/api/collab-task/${taskId}/messages`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          content: replyDraft.trim(),
          parent_id: reply.id,
          files: replyUploadedFiles
        }),
      });
      
      if (!response.ok) throw new Error("Failed to post reply");
      
      setReplyDraft("");
      setReplyTo(null);
      setReplyFiles([]);
      setReplyFileProgress({});
      setReplyUploadedFiles([]);
      
      // Refresh messages - trigger a re-fetch from parent component
      window.location.reload();
    } catch (err) {
      console.error("Post reply error:", err);
      setError("Failed to post reply");
    }
  };
  
  return (
    <div style={{ marginTop: "12px", padding: "12px", background: "#fbf8ff", borderRadius: "8px" }}>
      <div style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
        ↳ Reply to {reply.full_name.split(" ")[0]}
      </div>
      <textarea
        key={`reply-to-${reply.id}`}
        value={replyDraft}
        onChange={(e) => setReplyDraft(e.target.value)}
        placeholder={`Write your reply…`}
        rows={2}
        autoFocus
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          border: "1px solid #e2d9e9",
          borderRadius: "8px",
          outline: "0",
          resize: "vertical",
          color: "#5d4867",
          font: "10px/1.5 DM Sans,Arial,sans-serif",
          boxSizing: "border-box",
          marginBottom: "8px"
        }}
      />
      {replyFiles.length > 0 && (
        <div style={{ marginBottom: "8px", padding: "8px", background: "#fff", borderRadius: "6px", borderTop: "1px solid #e2d6ef" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            {replyFiles.length} file(s) attached
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {replyFiles.map((file, idx) => {
              const isPdf = /\.pdf$/i.test(file.name);
              const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
              const progress = replyFileProgress[idx] ?? 0;
              const isUploading = isReplyUploadingFiles && progress < 100;
              
              return (
                <div key={idx} style={{ padding: "8px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "grid", width: "32px", height: "32px", placeItems: "center", borderRadius: "6px", background: isPdf ? "#fef5e5" : isImage ? "#e8f1ff" : "#f0e7fc", color: isPdf ? "#9d6d2a" : isImage ? "#5274a8" : "#7043b7", fontSize: "14px", flexShrink: 0 }}>
                    {isPdf ? "PDF" : isImage ? "🖼" : "📎"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#5d4867", fontSize: "9px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </div>
                    <div style={{ marginTop: "4px", height: "4px", background: "#e9e0ef", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#7c3aed", width: `${progress}%`, transition: "width 0.2s" }} />
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "8px", color: isUploading ? "#8b7b96" : "#579574", fontWeight: 800 }}>
                      {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReplyFiles(prev => prev.filter((_, i) => i !== idx));
                      setReplyFileProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[idx];
                        return newProgress;
                      });
                    }}
                    disabled={isReplyUploadingFiles}
                    style={{ background: "none", border: "none", color: "#806f8b", cursor: isReplyUploadingFiles ? "not-allowed" : "pointer", fontSize: "16px", opacity: isReplyUploadingFiles ? 0.5 : 1 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={replyFilesRef}
          type="file"
          hidden
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (replyFiles.length + files.length > 5) {
              setError("Maximum 5 files allowed");
              return;
            }
            
            setReplyFiles(prev => [...prev, ...files]);
            await uploadReplyFiles(files);
            if (replyFilesRef.current) replyFilesRef.current.value = "";
          }}
        />
        <button 
          onClick={() => replyFilesRef.current?.click()}
          disabled={isReplyUploadingFiles || replyFiles.length >= 5}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "7px 9px",
            border: "1px solid #ddd1e8",
            borderRadius: "7px",
            background: "#fff",
            color: "#76538d",
            fontSize: "8px",
            fontWeight: 800,
            cursor: isReplyUploadingFiles || replyFiles.length >= 5 ? "not-allowed" : "pointer",
            opacity: isReplyUploadingFiles || replyFiles.length >= 5 ? 0.5 : 1
          }}
        >
          <Paperclip size={11} /> Add files ({replyFiles.length}/5)
        </button>
        <button 
          onClick={postReply} 
          disabled={(!replyDraft.trim() && replyUploadedFiles.length === 0) || isReplyUploadingFiles}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "7px 9px",
            border: "0",
            borderRadius: "7px",
            background: "#7c3aed",
            color: "#fff",
            fontSize: "8px",
            fontWeight: 800,
            cursor: ((!replyDraft.trim() && replyUploadedFiles.length === 0) || isReplyUploadingFiles) ? "not-allowed" : "pointer",
            opacity: ((!replyDraft.trim() && replyUploadedFiles.length === 0) || isReplyUploadingFiles) ? 0.5 : 1
          }}
        >
          <Send size={12} /> Post reply
        </button>
      </div>
    </div>
  );
}

export default function CollaborativeTaskAdmin() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = useMemo(() => getUser(token), [token]);
  const api = import.meta.env.VITE_API_URL || "";

  // State
  const [task, setTask] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentFileProgress, setCommentFileProgress] = useState({});
  const [commentUploadedFiles, setCommentUploadedFiles] = useState([]);
  const [isCommentUploadingFiles, setIsCommentUploadingFiles] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyFileProgress, setReplyFileProgress] = useState({});
  const [replyUploadedFiles, setReplyUploadedFiles] = useState([]);
  const [isReplyUploadingFiles, setIsReplyUploadingFiles] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageBlobUrls, setImageBlobUrls] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Submitted");

  const [reviewNote, setReviewNote] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionInstruction, setRevisionInstruction] = useState("");
  const [revisionFiles, setRevisionFiles] = useState([]);
  const [revisionFileProgress, setRevisionFileProgress] = useState({});
  const [revisionUploadedFiles, setRevisionUploadedFiles] = useState([]);
  const [isRevisionUploadingFiles, setIsRevisionUploadingFiles] = useState(false);
  const [showRevision, setShowRevision] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const revisionFilesRef = useRef(null);
  const commentFilesRef = useRef(null);
  const replyFilesRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [readerZoom, setReaderZoom] = useState("page-width");
  const [expandedVersions, setExpandedVersions] = useState(new Set([]));
  const [submissionBlobUrl, setSubmissionBlobUrl] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: "" });

  // Create blob URLs for all message and reply images
  useEffect(() => {
    const createBlobUrls = async () => {
      const urlsToCreate = [];
      
      // Collect all image files from messages and replies
      messages.forEach(message => {
        if (message.files && message.files.length > 0) {
          message.files.forEach((file, idx) => {
            const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
            if (isImage) {
              const imageKey = `msg-${message.id}-file-${idx}`;
              urlsToCreate.push({ key: imageKey, url: file.url });
            }
          });
        }
        
        // Check replies
        if (message.replies && message.replies.length > 0) {
          message.replies.forEach(reply => {
            if (reply.files && reply.files.length > 0) {
              reply.files.forEach((file, idx) => {
                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                if (isImage) {
                  const imageKey = `reply-${reply.id}-file-${idx}`;
                  urlsToCreate.push({ key: imageKey, url: file.url });
                }
              });
            }
          });
        }
      });
      
      // Create blob URLs for all images
      for (const { key, url } of urlsToCreate) {
        try {
          const blobUrl = await createAuthenticatedBlobUrl(api, url);
          setImageBlobUrls(prev => ({ ...prev, [key]: blobUrl }));
        } catch (error) {
          console.error(`Failed to create blob URL for ${key}:`, error);
        }
      }
    };
    
    if (messages.length > 0) {
      createBlobUrls();
    }
    
    // Cleanup blob URLs on unmount
    return () => {
      Object.values(imageBlobUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [messages]);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${api}/api/collaborative-tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to load task");
        const data = await response.json();
        setTask(data.task);
        setCollaborators((data.collaborators || []).map((c, i) => ({
          ...c,
          tone: getTone(i),
        })));
        setConfirmations(data.confirmations || []);
        setVersions(data.versions || []);
        setComments(data.comments || []);
        setMessages(data.comments || []); // Set messages same as comments for discussion section
        setAttachments(data.attachments || []);
        setStatus(data.task?.status || "Submitted");
        
        socket.emit("join_task", { taskId: parseInt(taskId) });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadTask();
    
    return () => {
      socket.emit("leave_task", { taskId: parseInt(taskId) });
    };
  }, [taskId, token, api]);

  // Socket listeners
  useEffect(() => {
    socket.on("collaborative:comment_posted", (comment) => {
      if (comment.task_id === task?.id) {
        setMessages((prev) => {
          // Skip if comment already exists (by real ID)
          if (prev.some(msg => msg.id === comment.id)) {
            console.log("[Socket] Comment already exists, skipping duplicate");
            return prev;
          }

          // Skip if we have a pending optimistic comment (temp ID exists) from same user
          const hasPendingComment = prev.some(msg => 
            typeof msg.id === 'string' && 
            msg.id.startsWith('temp-') && 
            (msg.user_id === comment.user_id || msg.sender_id === comment.sender_id)
          );
          
          if (hasPendingComment) {
            console.log("[Socket] Skipping socket update - we have a pending optimistic comment from same user");
            return prev;
          }

          // Add the comment (support threading if needed in future)
          if (comment.parent_comment_id) {
            // For now, threading not fully implemented on admin side
            console.log("[Socket] Reply comment received:", comment.id);
          }
          
          return [...prev, { ...comment, replies: comment.replies || [] }];
        });
        
        setComments((prev) => {
          // Skip if comment already exists
          if (prev.some(msg => msg.id === comment.id)) {
            return prev;
          }
          return [...prev, { ...comment, replies: comment.replies || [] }];
        });
      }
    });

    socket.on("collaborative:auto_submitted", (data) => {
      if (data.taskId === task?.id) {
        console.log("[Admin] Task auto-submitted, updating status");
        setStatus("For Approval");
        // Reload task to get latest data
        window.location.reload();
      }
    });

    return () => {
      socket.off("collaborative:comment_posted");
      socket.off("collaborative:auto_submitted");
    };
  }, [task?.id]);

  // Create authenticated blob URL for file preview modal
  useEffect(() => {
    let isMounted = true;
    let currentPreviewBlobUrl = null;

    const loadPreviewBlobUrl = async () => {
      const fileUrl = preview?.file_url || preview?.url;
      if (!fileUrl) {
        setPreviewBlobUrl(null);
        return;
      }

      // Create blob URLs for all file types
      try {
        const url = await createAuthenticatedBlobUrl(api, fileUrl);
        if (isMounted) {
          currentPreviewBlobUrl = url;
          setPreviewBlobUrl(url);
        }
      } catch (error) {
        console.error("Failed to load preview file:", error);
        if (isMounted) setPreviewBlobUrl(null);
      }
    };

    loadPreviewBlobUrl();

    return () => {
      isMounted = false;
      if (currentPreviewBlobUrl) {
        URL.revokeObjectURL(currentPreviewBlobUrl);
      }
    };
  }, [preview, api]);

  // Upload comment files with progress tracking
  const uploadCommentFiles = async (files) => {
    setIsCommentUploadingFiles(true);
    const uploadedUrls = [];
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const formData = new FormData();
        formData.append("files", file);
        
        setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: 10 }));
        
        const xhr = new XMLHttpRequest();
        let progressInterval = null;
        
        const startTime = Date.now();
        const estimateProgress = () => {
          const elapsed = Date.now() - startTime;
          const estimatedPercent = Math.min(10 + Math.floor((elapsed / 50) * 2), 90);
          setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: estimatedPercent }));
        };
        
        progressInterval = setInterval(estimateProgress, 20);
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: percentComplete }));
          }
        });
        
        await new Promise((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (progressInterval) clearInterval(progressInterval);
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              uploadedUrls.push(response.files[0]);
              setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: 100 }));
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          
          xhr.addEventListener("error", () => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error("Upload failed"));
          });
          
          xhr.open("POST", `${api}/api/upload-files`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error("File upload error:", err);
        setError(`Failed to upload ${file.name}`);
      }
    }
    
    setCommentUploadedFiles(prev => [...prev, ...uploadedUrls]);
    setIsCommentUploadingFiles(false);
  };

  // Post new message to discussion
  const postMessage = async () => {
    if (!messageDraft.trim() && commentUploadedFiles.length === 0) return;
    
    try {
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        task_id: parseInt(taskId),
        user_id: user.id,
        sender_id: user.id,
        content: messageDraft.trim(),
        full_name: user.full_name,
        parent_comment_id: null,
        files: commentUploadedFiles,
        created_at: new Date().toISOString(),
        replies: []
      };

      setMessages(prev => [...prev, optimisticComment]);

      const savedDraft = messageDraft;
      const savedFiles = commentUploadedFiles;
      setMessageDraft("");
      setCommentFiles([]);
      setCommentFileProgress({});
      setCommentUploadedFiles([]);
      if (commentFilesRef.current) commentFilesRef.current.value = "";

      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content: savedDraft.trim(),
          files: savedFiles
        }),
      });

      if (response.ok) {
        const realComment = await response.json();
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticComment.id ? { ...realComment, replies: [] } : msg
        ));
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== optimisticComment.id));
        setMessageDraft(savedDraft);
        setCommentUploadedFiles(savedFiles);
        setError("Failed to post comment");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const approveTask = async () => {
    try {
      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewNote }),
      });

      if (response.ok) {
        setStatus("Approved");
        setReviewNote("");
        setAlertModal({ isOpen: true, message: "✓ Task approved successfully!" });
      } else {
        const data = await response.json();
        setError(data.message || "Failed to approve task");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadRevisionFiles = async (files) => {
    setIsRevisionUploadingFiles(true);
    const uploadedUrls = [];
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const formData = new FormData();
        formData.append("files", file);
        
        setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: 10 }));
        
        const xhr = new XMLHttpRequest();
        let progressInterval = null;
        
        const startTime = Date.now();
        const estimateProgress = () => {
          const elapsed = Date.now() - startTime;
          const estimatedPercent = Math.min(10 + Math.floor((elapsed / 50) * 2), 90);
          setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: estimatedPercent }));
        };
        
        progressInterval = setInterval(estimateProgress, 20);
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: percentComplete }));
          }
        });
        
        await new Promise((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (progressInterval) clearInterval(progressInterval);
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              uploadedUrls.push(response.files[0]);
              setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: 100 }));
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          
          xhr.addEventListener("error", () => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error("Upload failed"));
          });
          
          xhr.open("POST", `${api}/api/upload-files`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error("File upload error:", err);
        setError(`Failed to upload ${file.name}`);
      }
    }
    
    setRevisionUploadedFiles(prev => [...prev, ...uploadedUrls]);
    setIsRevisionUploadingFiles(false);
  };

  const requestRevision = async () => {
    if (!revisionReason.trim()) return;
    
    try {
      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/request-revision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          reason: revisionReason,
          instructions: revisionInstruction,
          files: revisionUploadedFiles
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request revision");
      }
      
      setStatus("Revision Requested");
      setRevisionReason("");
      setRevisionInstruction("");
      setRevisionFiles([]);
      setRevisionUploadedFiles([]);
      setRevisionFileProgress({});
      setShowRevision(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const postReply = () => {
    if (!replyDraft.trim()) return;
    // In a real app, this would post to the API
    setComments((prev) => [
      {
        id: Date.now(),
        task_id: task.id,
        user_id: user.id,
        full_name: user.name || "You",
        content: replyDraft,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setReplyDraft("");
    setReplyTo(null);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 0", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes collab-sk-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes collab-sk-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes collab-sk-spin { to { transform: rotate(360deg); } }
        .collab-sk { background: linear-gradient(90deg,#ede9fe 0%,#f5f3ff 45%,#ede9fe 90%); background-size:600px 100%; animation: collab-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .collab-sk-dark { background: linear-gradient(90deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.22) 45%,rgba(255,255,255,0.1) 90%); background-size:600px 100%; animation: collab-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .collab-sk-wrap { width: min(1400px,95vw); display: flex; flex-direction: column; gap: 0; animation: collab-sk-fadein 0.3s ease both; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(76,29,149,0.12); }
        .collab-sk-hero { background: linear-gradient(135deg,#2d0a5e 0%,#4a1272 50%,#6b21a8 100%); padding:36px 40px; display:flex; flex-direction:column; gap:20px; }
        .collab-sk-content { padding: 32px 40px; display: grid; grid-template-columns: 1fr 380px; gap: 32px; }
        .collab-sk-left { display: flex; flex-direction: column; gap: 24px; }
        .collab-sk-card { background:#faf8fc; border:1px solid #e8e1f5; border-radius:12px; padding:24px; display:flex; flex-direction:column; gap:14px; }
        .collab-sk-right { display: flex; flex-direction: column; }
        .collab-sk-discussion { background:#faf8fc; border:1px solid #e8e1f5; border-radius:12px; padding:24px; display:flex; flex-direction:column; gap:16px; min-height: 600px; }
        .collab-sk-spin { width:16px; height:16px; border-radius:50%; flex-shrink:0; border:2px solid rgba(255,255,255,0.2); border-top-color:#c4b5fd; animation:collab-sk-spin 0.75s linear infinite; }
      `}</style>
      <div className="collab-sk-wrap">
        {/* Hero Section - matches collab-hero */}
        <div className="collab-sk-hero">
          {/* Back button + Live indicator row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div className="collab-sk-dark" style={{ height:32, width:180, borderRadius:8 }} />
            <div className="collab-sk-dark" style={{ height:28, width:160, borderRadius:8 }} />
          </div>
          
          {/* Hero grid - title and status */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:32, marginTop:8 }}>
            {/* Left: Title section */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div className="collab-sk-dark" style={{ height:14, width:240, borderRadius:6 }} />
              <div className="collab-sk-dark" style={{ height:36, width:"75%", borderRadius:8 }} />
              <div style={{ display:"flex", gap:20, marginTop:8 }}>
                <div className="collab-sk-dark" style={{ height:16, width:150, borderRadius:6 }} />
                <div className="collab-sk-dark" style={{ height:16, width:120, borderRadius:6 }} />
                <div className="collab-sk-dark" style={{ height:16, width:130, borderRadius:6 }} />
              </div>
            </div>
            
            {/* Right: Status card */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, background:"rgba(255,255,255,0.1)", borderRadius:12, padding:20, border:"1px solid rgba(255,255,255,0.15)" }}>
              <div className="collab-sk-dark" style={{ height:12, width:100, borderRadius:4 }} />
              <div className="collab-sk-dark" style={{ height:24, width:140, borderRadius:6 }} />
              <div className="collab-sk-dark" style={{ height:8, width:"100%", borderRadius:99 }} />
              <div className="collab-sk-dark" style={{ height:12, width:130, borderRadius:4 }} />
            </div>
          </div>
        </div>

        {/* Content Area - matches collab-layout */}
        <div className="collab-sk-content">
          {/* Left Column - matches collab-main */}
          <div className="collab-sk-left">
            {/* Task Info Card - "Shared task at a glance" */}
            <div className="collab-sk-card" style={{ minHeight:240 }}>
              <div className="collab-sk" style={{ height:18, width:"40%", marginBottom:6 }} />
              {[70,65,58,63,52].map((w,i) => (
                <div key={i} className="collab-sk" style={{ height:14, width:`${w}%` }} />
              ))}
            </div>

            {/* Collaborators Card */}
            <div className="collab-sk-card" style={{ minHeight:200 }}>
              <div className="collab-sk" style={{ height:18, width:"35%", marginBottom:8 }} />
              <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    <div className="collab-sk" style={{ width:80, height:80, borderRadius:10 }} />
                    <div className="collab-sk" style={{ width:70, height:10, borderRadius:4 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Output Versions Card */}
            <div className="collab-sk-card" style={{ minHeight:180 }}>
              <div className="collab-sk" style={{ height:18, width:"32%", marginBottom:8 }} />
              {[1,2].map(i => (
                <div key={i} className="collab-sk" style={{ height:70, borderRadius:8 }} />
              ))}
            </div>
          </div>

          {/* Right Column - Discussion Panel */}
          <div className="collab-sk-right">
            <div className="collab-sk-discussion">
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <div className="collab-sk-spin" />
                <div className="collab-sk" style={{ height:18, width:120 }} />
              </div>
              
              {[1,2,3,4].map(i => (
                <div key={i} style={{ display:"flex", gap:12, paddingTop:12, borderTop: i > 1 ? "1px solid #ede9fe" : "none" }}>
                  <div className="collab-sk" style={{ width:42, height:42, borderRadius:"50%", flexShrink:0 }} />
                  <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                    <div className="collab-sk" style={{ height:14, width:"55%" }} />
                    <div className="collab-sk" style={{ height:48, borderRadius:8 }} />
                    <div className="collab-sk" style={{ height:10, width:"28%" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (error) return <div style={{ padding: "32px", textAlign: "center", color: "#d32f2f" }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: "32px", textAlign: "center" }}>Task not found</div>;

  // Count confirmed collaborators from the confirmations data
  const confirmedCount = collaborators.filter(c => 
    confirmations.some(conf => conf.user_id === c.user_id && conf.status === "confirmed")
  ).length;
  
  // Find the current version based on task.current_output_version
  const currentVersion = versions.find(v => v.version === task?.current_output_version) || versions[0];
  
  const allConfirmed = confirmedCount === collaborators.length && collaborators.length > 0;
  const isReadyForReview = task.status === "For Approval" && allConfirmed;

  return (
    <div className="admin-collab">
      <style>{styles}</style>
      <div className="admin-wrapper">
        <div className="admin-shell">
        <header className="admin-hero">
          <div className="admin-top">
            <button className="admin-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} /> Back to task details
            </button>
            <span className="admin-role">
              <ShieldCheck size={13} /> Program Chair / Admin view
            </span>
          </div>

          <div className="admin-hero-grid">
            <div>
              <span className="admin-eyebrow">
                <UsersRound size={12} /> Collaborative task · {task.tracking_id}
              </span>
              <h1>{task.title}</h1>
              <p>Monitor the shared handoff, inspect the latest group output, and make the final workflow decision.</p>
              <div className="admin-meta">
                <span>
                  <FileText size={13} /> {task.doc_type}
                </span>
                <span>
                  <Clock3 size={13} /> Due checkpoint · {formatDate(task.deadline)}
                </span>
                <span>
                  <ShieldCheck size={13} /> Owned by Program Chair office
                </span>
              </div>
            </div>

            <div className="admin-status">
              <small>Review status</small>
              <strong>{status}</strong>
              <div className="admin-progress">
                <i style={{ width: status === "Approved" ? "100%" : "66.7%" }} />
              </div>
              <em>
                {status === "Submitted"
                  ? "Ready for your decision"
                  : status === "Approved"
                  ? "Decision recorded"
                  : "Workflow updated"}
              </em>
            </div>
          </div>
        </header>

        <div className="admin-layout">
          <main className="admin-main">
            <section className="admin-card">
              <div className="admin-heading">
                <div>
                  <span className="admin-kicker">Oversight snapshot</span>
                  <h2>Shared task at a glance</h2>
                </div>
                <span className="admin-id">{task.tracking_id}</span>
              </div>
              <div className="admin-metrics">
                <div>
                  <strong>{collaborators.length}</strong>
                  <small>Collaborators</small>
                </div>
                <div>
                  <strong>{confirmedCount}/{collaborators.length}</strong>
                  <small>Confirmed</small>
                </div>
                <div>
                  <strong>{versions.length}</strong>
                  <small>File versions</small>
                </div>
                <div>
                  <strong>{comments.length}</strong>
                  <small>Discussion notes</small>
                </div>
              </div>
              <div className="admin-brief">
                <div>
                  <small>Document type</small>
                  <strong>{task.doc_type}</strong>
                </div>
                <div>
                  <small>Category</small>
                  <strong>{task.category || "General"}</strong>
                </div>
                <div>
                  <small>Priority</small>
                  <strong className={task.priority === "High" ? "high" : ""}>
                    {task.priority || "Medium"}
                  </strong>
                </div>
                <div>
                  <small>Workflow owner</small>
                  <strong>Program Chair</strong>
                </div>
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-heading">
                <div>
                  <span className="admin-kicker"><ListChecks size={12} /> Instructions from the Program Chair / Admin</span>
                  <h2>What the group needs to complete</h2>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "6px", background: "#7c3aed", color: "#fff", fontSize: "9px", fontWeight: 800, whiteSpace: "nowrap" }}>
                  Required before submission
                </span>
              </div>

              <p style={{ maxWidth: "620px", margin: "0 0 16px", color: "#887995", fontSize: "12px", lineHeight: "1.55" }}>
                Program Chair / Admin instructions for this collaborative task.
              </p>

              <div style={{ padding: "14px", borderRadius: "8px", border: "1px solid #dccfe8", background: "#faf7ff" }}>
                <p style={{ margin: "0", color: "#5d4867", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {task?.notes || "No instructions provided."}
                </p>
              </div>

              {attachments.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "8px" }}>
                    Instruction attachments
                  </span>
                  <div style={{ display: "grid", gap: "8px" }}>
                    {attachments.map((file, index) => (
                      <div key={file.id || file.file_url || file.name || index} style={{ padding: "8px", border: "1px solid #e2d6ef", borderRadius: "7px", background: "#fbf8ff", display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "12px" }}>📄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: "block", color: "#5a4567", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.file_name || file.name}
                          </strong>
                          <small style={{ display: "block", marginTop: "2px", color: "#978ba1", fontSize: "8px" }}>
                            {file.size_kb || Math.round((file.file_size || 0) / 1024)} KB
                          </small>
                        </div>
                        <a
                          onClick={() => setPreview(file)}
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "5px", background: "#eee5fb", color: "#7043b6", textDecoration: "none", fontSize: "8px", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}
                        >
                          <Download size={12} /> Preview
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "16px", padding: "14px", borderRadius: "8px", border: "1px solid #dccfe8", background: "#faf7ff", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <ShieldCheck size={16} style={{ color: "#7043b7", flexShrink: 0 }} />
                <div>
                  <strong style={{ display: "block", color: "#604477", fontSize: "9px", fontWeight: 800, marginBottom: "4px" }}>SUBMISSION NOTE</strong>
                  <small style={{ display: "block", color: "#978aa0", fontSize: "9px", lineHeight: "1.4" }}>The task will be submitted to the Program Chair / Admin only after every collaborator confirms the latest version.</small>
                </div>
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-heading">
                <div>
                  <span className="admin-kicker">Collaborator oversight</span>
                  <h2>{allConfirmed ? "Everyone has confirmed the latest output" : "Waiting for collaborator confirmations"}</h2>
                </div>
                <span className="admin-success">
                  <CheckCircle2 size={13} /> {confirmedCount}/{collaborators.length} confirmed
                </span>
              </div>
              <p className="admin-muted">
                Confirmation is locked from the admin view. Use Request revision if the submitted output needs another pass.
              </p>
              <div className="admin-people">
                {collaborators.map((collab) => {
                  const isConfirmed = confirmations.some(conf => conf.user_id === collab.user_id && conf.status === "confirmed");
                  return (
                    <div className="admin-person" key={collab.user_id}>
                      <Avatar 
                        profilePicture={collab.profile_picture}
                        fullName={collab.full_name}
                        userId={collab.user_id}
                      />
                      <div>
                        <strong>{collab.full_name}</strong>
                        <small>{collab.role}</small>
                      </div>
                      <span className={isConfirmed ? "admin-confirmed" : "admin-confirmed"} style={{ color: isConfirmed ? "#4d946f" : "#998ba3" }}>
                        {isConfirmed ? (
                          <>
                            <Check size={12} /> Confirmed
                          </>
                        ) : (
                          <>
                            <Clock3 size={12} /> Pending
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {(isReadyForReview || status === "Approved") && currentVersion && (
              <section className="admin-card">
                <div className="admin-heading">
                  <div>
                    <span className="admin-kicker">Submitted final output</span>
                    <h2>
                      {currentVersion.files && currentVersion.files.length > 1
                        ? `Version ${currentVersion.version} · ${currentVersion.files.length} files`
                        : currentVersion.file_name}
                    </h2>
                  </div>
                  <span className="admin-file-status">
                    <CheckCircle2 size={12} /> Latest version
                  </span>
                </div>

                {/* Display all files */}
                {currentVersion.files && currentVersion.files.length > 0 ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {currentVersion.files.map((file, idx) => (
                      <div key={idx} className="admin-file">
                        <span className="admin-file-icon">
                          <FileText size={21} />
                        </span>
                        <div>
                          <strong>{file.file_name}</strong>
                          <small>
                            PDF · {formatDate(currentVersion.created_at)} · Uploaded by {currentVersion.uploaded_by}
                          </small>
                          {idx === 0 && <p>{currentVersion.upload_note || "Final group output"}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            type="button" 
                            aria-label="Preview file"
                            onClick={() => setPreview({ ...currentVersion, file_url: file.file_url, file_name: file.file_name })}
                            style={{
                              display: 'grid',
                              placeItems: 'center',
                              width: '36px',
                              height: '36px',
                              border: '1px solid #e2d9e8',
                              borderRadius: '8px',
                              background: '#fff',
                              color: '#76568d',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#f8f5fb';
                              e.currentTarget.style.borderColor = '#d0c4dd';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.borderColor = '#e2d9e8';
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            type="button" 
                            aria-label="Download submitted file"
                            onClick={() => {
                              const url = r2ToProxyUrl(api, file.file_url);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = file.file_name;
                              a.target = '_blank';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="admin-file">
                      <span className="admin-file-icon">
                        <FileText size={21} />
                      </span>
                      <div>
                        <strong>{currentVersion.file_name}</strong>
                        <small>
                          PDF · {formatDate(currentVersion.created_at)} · Uploaded by {currentVersion.uploaded_by}
                        </small>
                        <p>{currentVersion.upload_note || "Final group output"}</p>
                      </div>
                      <button 
                        type="button" 
                        aria-label="Download submitted file"
                        onClick={() => {
                          const url = r2ToProxyUrl(api, currentVersion.file_url);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = currentVersion.file_name;
                          a.target = '_blank';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      >
                        <Download size={15} />
                      </button>
                    </div>

                    <div className="admin-file-actions">
                      <button 
                        className="admin-outline" 
                        type="button"
                        onClick={() => setPreview(currentVersion)}
                      >
                        <FileText size={13} /> Open inline preview
                      </button>
                    </div>
                  </>
                )}

                {versions.length > 0 && (
                  <div className="admin-versions">
                    <div className="admin-version-head">
                      <span>Version history</span>
                      <small>Latest first</small>
                    </div>
                    {versions.map((item) => {
                      const isExpanded = expandedVersions.has(item.version);
                      const toggleExpand = () => {
                        setExpandedVersions(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.version)) {
                            newSet.delete(item.version);
                          } else {
                            newSet.add(item.version);
                          }
                          return newSet;
                        });
                      };
                      
                      return (
                        <div
                          className={`admin-version ${item.version === task?.current_output_version ? "current" : ""}`}
                          key={`${item.version}`}
                          style={{ flexDirection: 'column', gap: '8px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: '100%' }} onClick={toggleExpand}>
                            <span className="admin-version-number">v{item.version}</span>
                            <div style={{ flex: 1 }}>
                              <strong>
                                {item.files && item.files.length > 1
                                  ? `${item.files.length} files`
                                  : item.file_name}
                              </strong>
                              <small>
                                {formatDate(item.created_at)} · {item.uploaded_by}
                              </small>
                              <p>{item.upload_note || "Version uploaded"}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <em>{item.version === task?.current_output_version ? "Current" : "Previous"}</em>
                              {item.files && item.files.length > 0 && (
                                isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                              )}
                            </div>
                          </div>
                          
                          {isExpanded && item.files && item.files.length > 0 && (
                            <div style={{ 
                              marginTop: '8px', 
                              marginLeft: '40px',
                              display: 'grid', 
                              gap: '8px',
                              paddingLeft: '12px',
                              borderLeft: '2px solid #e9e0ef'
                            }}>
                              {item.files.map((file, idx) => {
                                const isPdf = /\.pdf$/i.test(file.file_name);
                                return (
                                  <div key={idx} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '8px 12px',
                                    background: '#fbf8ff',
                                    borderRadius: '6px',
                                    border: '1px solid #e9e0ef'
                                  }}>
                                    <div style={{
                                      display: 'grid',
                                      width: '32px',
                                      height: '32px',
                                      placeItems: 'center',
                                      borderRadius: '5px',
                                      background: isPdf ? '#fef5e5' : '#e8f1ff',
                                      color: isPdf ? '#9d6d2a' : '#5274a8',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      flexShrink: 0
                                    }}>
                                      {isPdf ? 'PDF' : 'FILE'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#44354f',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        {file.file_name}
                                      </div>
                                      <div style={{ fontSize: '10px', color: '#8d7f97', marginTop: '2px' }}>
                                        {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : ''}
                                      </div>
                                    </div>
                                    <a
                                      href={r2ToProxyUrl(api, file.file_url)}
                                      download={file.file_name}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '5px',
                                        background: '#7c3aed',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        flexShrink: 0
                                      }}
                                    >
                                      <Download size={11} />
                                    </a>
                                    <button
                                      onClick={() => setPreview({
                                        file_url: file.file_url,
                                        file_name: file.file_name,
                                        name: file.file_name
                                      })}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '5px',
                                        background: '#fff',
                                        border: '1px solid #e9e0ef',
                                        color: '#7c3aed',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                      }}
                                    >
                                      <Eye size={11} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">
                    <MessageCircle size={12} /> Discussion
                  </span>
                  <h2>Working notes & questions</h2>
                </div>
                <span className="collab-count">{messages.length} messages</span>
              </div>

              <div className="collab-messages">
                {(() => {
                  console.log("[Render] Messages count:", messages.length, "Messages:", messages);
                  return null;
                })()}
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id}>
                      {/* Parent comment */}
                      <article className="collab-message">
                        <Avatar 
                          profilePicture={message.profilePicture || message.profile_picture}
                          fullName={message.full_name}
                          userId={message.user_id || message.sender_id || message.userId}
                        />
                        <div className="collab-message-content">
                          <header>
                            <strong>{message.full_name}</strong>
                            <small>{formatDate(message.created_at)}</small>
                          </header>
                          <p style={{ margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message.content}</p>
                          {message.files && message.files.length > 0 && (
                            <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                              {message.files.map((file, idx) => {
                                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                                const imageKey = `msg-${message.id}-file-${idx}`;
                                const imageLoading = imageLoadingStates[imageKey] ?? true;
                                return isImage ? (
                                  <div 
                                    key={idx}
                                    style={{ 
                                      position: "relative",
                                      display: "inline-block",
                                      maxWidth: "280px"
                                    }}
                                  >
                                    {imageLoading && (
                                      <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "#f5f0fb",
                                        borderRadius: "6px",
                                        border: "1px solid #e2d9e9",
                                        zIndex: 1
                                      }}>
                                        <div style={{
                                          width: "24px",
                                          height: "24px",
                                          border: "2px solid #e2d9e9",
                                          borderTopColor: "#7c3aed",
                                          borderRadius: "50%",
                                          animation: "spin 0.8s linear infinite"
                                        }} />
                                      </div>
                                    )}
                                    <a 
                                      href="#"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        try {
                                          const blobUrl = await createAuthenticatedBlobUrl(api, file.url);
                                          window.open(blobUrl, "_blank");
                                          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                        } catch (error) {
                                          console.error("Failed to open file:", error);
                                          setAlertModal({ isOpen: true, message: "Failed to open file. Please try again." });
                                        }
                                      }}
                                      rel="noopener noreferrer"
                                      style={{ display: "block", maxWidth: "280px" }}
                                    >
                                      <img 
                                        src={imageBlobUrls[imageKey] || ""}
                                        alt={file.name}
                                        onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        style={{ 
                                          maxWidth: "100%", 
                                          borderRadius: "6px", 
                                          border: "1px solid #e2d9e9", 
                                          cursor: "pointer",
                                          display: imageLoading || !imageBlobUrls[imageKey] ? "none" : "block"
                                        }}
                                      />
                                    </a>
                                  </div>
                                ) : (
                                  <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px" }}>📎</span>
                                    <a 
                                      href="#"
                                      onClick={async (e) => {
                                        e.preventDefault();
                                        try {
                                          const blobUrl = await createAuthenticatedBlobUrl(api, file.url);
                                          window.open(blobUrl, "_blank");
                                          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                        } catch (error) {
                                          console.error("Failed to open file:", error);
                                          setAlertModal({ isOpen: true, message: "Failed to open file. Please try again." });
                                        }
                                      }}
                                      rel="noopener noreferrer"
                                      style={{ flex: 1, minWidth: 0, color: "#7043b6", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline" }}
                                    >
                                      {file.name}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="collab-thread">
                            <button type="button" onClick={() => setReplyTo(replyTo === message.id ? null : message.id)}>
                              <Reply size={12} /> Reply
                            </button>
                          </div>
                        </div>
                      </article>

                      {/* Reply form for parent comment */}
                      {replyTo === message.id && (
                        <ReplyForm
                          reply={message}
                          replyDraft={replyDraft}
                          setReplyDraft={setReplyDraft}
                          replyFiles={replyFiles}
                          setReplyFiles={setReplyFiles}
                          replyFileProgress={replyFileProgress}
                          setReplyFileProgress={setReplyFileProgress}
                          replyUploadedFiles={replyUploadedFiles}
                          setReplyUploadedFiles={setReplyUploadedFiles}
                          isReplyUploadingFiles={isReplyUploadingFiles}
                          setIsReplyUploadingFiles={setIsReplyUploadingFiles}
                          replyFilesRef={replyFilesRef}
                          setReplyTo={setReplyTo}
                          setError={setError}
                          api={api}
                          token={token}
                          taskId={taskId}
                        />
                      )}

                      {/* Render nested replies recursively to support unlimited threading depth */}
                      {message.replies && message.replies.length > 0 && (
                        <RenderReplies 
                          replies={message.replies} 
                          depth={1}
                          replyTo={replyTo}
                          setReplyTo={setReplyTo}
                          getTone={getTone}
                          initials={initials}
                          formatDate={formatDate}
                          imageLoadingStates={imageLoadingStates}
                          setImageLoadingStates={setImageLoadingStates}
                          replyDraft={replyDraft}
                          setReplyDraft={setReplyDraft}
                          replyFiles={replyFiles}
                          setReplyFiles={setReplyFiles}
                          replyFileProgress={replyFileProgress}
                          setReplyFileProgress={setReplyFileProgress}
                          replyUploadedFiles={replyUploadedFiles}
                          setReplyUploadedFiles={setReplyUploadedFiles}
                          isReplyUploadingFiles={isReplyUploadingFiles}
                          setIsReplyUploadingFiles={setIsReplyUploadingFiles}
                          replyFilesRef={replyFilesRef}
                          setError={setError}
                          api={api}
                          token={token}
                          taskId={taskId}
                        />
                      )}


                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", color: "#8d7f97", fontSize: "12px" }}>
                    No messages yet. Start the discussion!
                  </div>
                )}
              </div>

              <div className="collab-composer">
                <textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postMessage();
                  }}
                  placeholder="Write a note, ask a question, or mention what needs checking…"
                  rows={3}
                />
                {commentFiles.length > 0 && (
                  <div style={{ marginTop: "8px", padding: "8px", background: "#fbf8ff", borderRadius: "6px", borderTop: "1px solid #e2d6ef" }}>
                    <div style={{ fontSize: "8px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
                      {commentFiles.length} file(s) attached
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {commentFiles.map((file, idx) => {
                        const isPdf = /\.pdf$/i.test(file.name);
                        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                        const progress = commentFileProgress[idx] ?? 0;
                        const isUploading = isCommentUploadingFiles && progress < 100;
                        
                        return (
                          <div key={idx} style={{ padding: "8px", background: "#fff", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ display: "grid", width: "32px", height: "32px", placeItems: "center", borderRadius: "6px", background: isPdf ? "#fef5e5" : isImage ? "#e8f1ff" : "#f0e7fc", color: isPdf ? "#9d6d2a" : isImage ? "#5274a8" : "#7043b7", fontSize: "14px", flexShrink: 0 }}>
                              {isPdf ? "PDF" : isImage ? "🖼" : "📎"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: "#5d4867", fontSize: "9px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {file.name}
                              </div>
                              <div style={{ marginTop: "4px", height: "4px", background: "#e9e0ef", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ height: "100%", background: "#7c3aed", width: `${progress}%`, transition: "width 0.2s" }} />
                              </div>
                              <div style={{ marginTop: "4px", fontSize: "8px", color: isUploading ? "#8b7b96" : "#579574", fontWeight: 800 }}>
                                {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setCommentFiles(prev => prev.filter((_, i) => i !== idx));
                                setCommentFileProgress(prev => {
                                  const newProgress = { ...prev };
                                  delete newProgress[idx];
                                  return newProgress;
                                });
                              }}
                              disabled={isCommentUploadingFiles}
                              style={{ background: "none", border: "none", color: "#806f8b", cursor: isCommentUploadingFiles ? "not-allowed" : "pointer", fontSize: "16px", opacity: isCommentUploadingFiles ? 0.5 : 1 }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="collab-composer-footer">
                  <small>Ctrl / Cmd + Enter to send</small>
                  <span className="collab-composer-actions">
                    <input
                      ref={commentFilesRef}
                      type="file"
                      hidden
                      multiple
                      accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (commentFiles.length + files.length > 5) {
                          setError("Maximum 5 files allowed");
                          return;
                        }
                        setCommentFiles(prev => [...prev, ...files]);
                        // Start uploading immediately
                        await uploadCommentFiles(files);
                        if (commentFilesRef.current) commentFilesRef.current.value = "";
                      }}
                    />
                    <button 
                      onClick={() => commentFilesRef.current?.click()}
                      disabled={isCommentUploadingFiles || commentFiles.length >= 5}
                    >
                      <Paperclip size={13} /> Add files ({commentFiles.length}/5)
                    </button>
                    <button 
                      onClick={postMessage} 
                      disabled={(!messageDraft.trim() && commentUploadedFiles.length === 0) || isCommentUploadingFiles}
                    >
                      <Send size={14} /> Send message
                    </button>
                  </span>
                </div>
              </div>
            </section>
          </main>

          <aside className="admin-side">            {/* Decision Station - adapted from TaskDetail.jsx */}
            <section className="td-decision">
              <div className="td-decision-head">
                <span>Decision station</span>
                <div className={`td-state ${status === "Approved" ? "approved" : status === "For Approval" ? "review" : "waiting"}`}>
                  <ShieldCheck size={13} /> {status === "Approved" ? "Approved" : status === "For Approval" ? "In review" : "Waiting"}
                </div>
              </div>
              <h2>Move the handoff forward deliberately.</h2>
              <p>
                {status === "For Approval"
                  ? "Review the evidence and record an approval or a clear revision instruction."
                  : status === "Approved"
                  ? "Decision recorded. The task workflow is complete."
                  : "Faculty has not submitted a completed file yet. Approval and return actions remain locked until evidence is received."}
              </p>
              <div className="td-action-buttons">
                <button
                  className="td-approve"
                  type="button"
                  disabled={status !== "For Approval"}
                  onClick={approveTask}
                >
                  <CheckCircle2 size={14} /> Approve task
                </button>
                <button
                  className="td-return"
                  type="button"
                  disabled={status !== "For Approval"}
                  onClick={() => setShowRevision(true)}
                >
                  <ArrowLeft size={14} /> Return for revision
                </button>
              </div>
              {status !== "For Approval" && status !== "Approved" && (
                <div className="td-no-submission">
                  <ShieldCheck size={15} />
                  <div>
                    <strong>Faculty submission required</strong>
                    <p>
                      Faculty has not submitted a completed file and note yet. Approval and return actions will unlock after the submission enters review.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="admin-side-card">
              <span className="admin-kicker">Workflow timeline</span>
              <h2>Handoff history</h2>
              <div className="admin-timeline">
                <div>
                  <span className="done">
                    <Check size={12} />
                  </span>
                  <p>
                    <strong>Task assigned</strong>
                    <small>{formatDate(task.created_at)}</small>
                  </p>
                </div>
                <div>
                  <span className="done">
                    <Check size={12} />
                  </span>
                  <p>
                    <strong>Output uploaded</strong>
                    <small>{currentVersion ? formatDate(currentVersion.created_at) : "Pending"}</small>
                  </p>
                </div>
                <div>
                  <span className="done">
                    <Check size={12} />
                  </span>
                  <p>
                    <strong>All confirmations received</strong>
                    <small>Today</small>
                  </p>
                </div>
                <div>
                  <span className={status === "Approved" ? "done" : "current"}>
                    {status === "Approved" ? <Check size={12} /> : <Clock3 size={12} />}
                  </span>
                  <p>
                    <strong>Admin review</strong>
                    <small>{status === "Approved" ? "Decision recorded" : "Waiting for decision"}</small>
                  </p>
                </div>
              </div>
            </section>

            <section className="admin-side-card admin-policy">
              <span className="admin-kicker">Admin controls</span>
              <div>
                <ShieldCheck size={16} />
                <p>
                  <strong>Confirmation gate locked</strong>
                  <small>Faculty confirmations cannot be changed from this view.</small>
                </p>
              </div>
              <div>
                <Paperclip size={16} />
                <p>
                  <strong>Audit trail enabled</strong>
                  <small>Decisions and revision reasons are logged to the task.</small>
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showRevision && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-revision-title">
            <button
              className="admin-modal-close"
              type="button"
              onClick={() => setShowRevision(false)}
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <span className="admin-kicker">Request revision</span>
            <h2 id="admin-revision-title">Send the group a revision instruction</h2>
            <p>
              This changes the task status to Revision Requested and notifies every collaborator to upload a new
              version.
            </p>
            <label htmlFor="admin-return-reason" style={{ display: 'block', marginTop: '14px', color: '#806f8b', fontSize: '11px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Reason <em style={{ color: '#dc2626', fontStyle: 'normal', fontWeight: 700 }}>required</em>
            </label>
            <select
              id="admin-return-reason"
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              required
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2dbe9', borderRadius: '8px', fontSize: '12px', fontFamily: 'inherit', color: revisionReason ? '#44354f' : '#9a8fa3', background: '#fff', outline: 'none', marginTop: '7px', marginBottom: '10px', cursor: 'pointer' }}
            >
              <option value="" disabled>Select a reason</option>
              <option>Missing information or supporting document</option>
              <option>Template or format correction required</option>
              <option>Content needs clarification</option>
              <option>Required approval or endorsement is missing</option>
              <option>Other revision needed</option>
            </select>
            <label htmlFor="admin-return-instruction" style={{ display: 'block', marginTop: '8px', color: '#806f8b', fontSize: '12px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Instructions for faculty
            </label>
            <textarea
              id="admin-return-instruction"
              value={revisionInstruction}
              onChange={(e) => setRevisionInstruction(e.target.value)}
              placeholder="Explain what needs to be corrected before the next submission…"
              rows={4}
              style={{ marginTop: '7px' }}
            />
            <label htmlFor="admin-revision-file" style={{ display: 'block', marginTop: '14px', color: '#806f8b', fontSize: '11px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Attach file (optional)
            </label>
            
            {revisionFiles.length > 0 && (
              <div style={{ marginTop: '12px', marginBottom: '12px', padding: '12px', background: '#fbf8ff', borderRadius: '6px', border: '1px solid #e2d6ef' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#806f8b', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                  {revisionFiles.length} file(s) attached
                </div>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {revisionFiles.map((file, idx) => {
                    const isPdf = /\.pdf$/i.test(file.name);
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                    const progress = revisionFileProgress[idx] ?? 0;
                    const isUploading = isRevisionUploadingFiles && progress < 100;
                    
                    return (
                      <div key={idx} style={{ padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e2d9e9', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'grid', width: '36px', height: '36px', placeItems: 'center', borderRadius: '6px', background: isPdf ? '#fef5e5' : isImage ? '#e8f1ff' : '#f0e7fc', color: isPdf ? '#9d6d2a' : isImage ? '#5274a8' : '#7043b7', fontSize: '16px', flexShrink: 0 }}>
                          {isPdf ? 'PDF' : isImage ? '🖼' : '📎'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#5d4867', fontSize: '10px', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.name}
                          </div>
                          <div style={{ marginTop: '6px', height: '5px', background: '#e9e0ef', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: '#7c3aed', width: `${progress}%`, transition: 'width 0.2s' }} />
                          </div>
                          <div style={{ marginTop: '4px', fontSize: '9px', color: isUploading ? '#8b7b96' : '#579574', fontWeight: 800 }}>
                            {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setRevisionFiles(prev => prev.filter((_, i) => i !== idx));
                            setRevisionFileProgress(prev => {
                              const newProgress = { ...prev };
                              delete newProgress[idx];
                              return newProgress;
                            });
                          }}
                          disabled={isRevisionUploadingFiles}
                          style={{ background: 'none', border: 'none', color: '#806f8b', cursor: isRevisionUploadingFiles ? 'not-allowed' : 'pointer', fontSize: '18px', opacity: isRevisionUploadingFiles ? 0.5 : 1 }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <input
              ref={revisionFilesRef}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (revisionFiles.length + files.length > 5) {
                  setError("Maximum 5 files allowed for revision request");
                  return;
                }
                setRevisionFiles(prev => [...prev, ...files]);
                await uploadRevisionFiles(files);
                if (revisionFilesRef.current) revisionFilesRef.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => revisionFilesRef.current?.click()}
              disabled={isRevisionUploadingFiles || revisionFiles.length >= 5}
              style={{ width: '100%', padding: '10px', border: '1px solid #e2dbe9', borderRadius: '8px', fontSize: '12px', background: '#fff', color: '#44354f', cursor: revisionFiles.length >= 5 ? 'not-allowed' : 'pointer', marginTop: '10px', opacity: revisionFiles.length >= 5 ? 0.6 : 1 }}
            >
              {revisionFiles.length > 0 ? `Add more files (${revisionFiles.length}/5)` : "Choose files to attach"}
            </button>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => {
                setShowRevision(false);
                setRevisionReason('');
                setRevisionInstruction('');
                setRevisionFiles([]);
                setRevisionUploadedFiles([]);
                setRevisionFileProgress({});
              }}>
                Cancel
              </button>
              <button type="button" onClick={requestRevision} disabled={!revisionReason.trim() || isRevisionUploadingFiles}>
                Send revision request
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="td-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <section
            className="td-reader"
            role="dialog"
            aria-modal="true"
            aria-labelledby="td-preview-title"
          >
            <header className="td-reader-head">
              <div>
                <span className="td-reader-eyebrow">
                  <i /> Inline preview
                </span>
                <h2 id="td-preview-title">{preview.file_name || preview.name}</h2>
                <p>{preview.file_name || preview.name}</p>
              </div>
              <div className="td-reader-head-actions">
                <span>▢ PDF</span>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Close inline document preview"
                >
                  ✕
                </button>
              </div>
            </header>
            <div className="td-reader-stage">
              <div className="td-reader-frame">
                <div className="td-reader-toolbar">
                  <button type="button" aria-label="Reader menu">
                    ☰
                  </button>
                  <b>1</b>
                  <span>/ 1</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReaderZoom((value) =>
                        typeof value === "number"
                          ? Math.max(60, value - 10)
                          : 90,
                      )
                    }
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReaderZoom((value) =>
                        typeof value === "number"
                          ? Math.min(150, value + 10)
                          : 110,
                      )
                    }
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <span>
                    {typeof readerZoom === "number"
                      ? `${readerZoom}%`
                      : "Fit width"}
                  </span>
                  <span className="td-reader-toolbar-spacer" />
                  <button
                    type="button"
                    disabled={!preview.file_url && !preview.url}
                    onClick={() => {
                      const urlToOpen = previewBlobUrl || r2ToProxyUrl(api, preview.file_url || preview.url);
                      window.open(
                        urlToOpen,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                    aria-label="Open file in a new tab"
                  >
                    ↗
                  </button>
                </div>
                <div className="td-reader-paper">
                  {(preview.file_url || preview.url) && /\.pdf($|\?)/i.test(preview.file_url || preview.url) ? (
                    <iframe
                      title={preview.file_name || preview.name}
                      src={previewBlobUrl ? pdfReadingUrl(previewBlobUrl, readerZoom) : ""}
                    />
                  ) : (preview.file_url || preview.url) &&
                    /\.(png|jpe?g|gif|webp)($|\?)/i.test(preview.file_url || preview.url) ? (
                    <img src={previewBlobUrl || r2ToProxyUrl(api, preview.file_url || preview.url)} alt={preview.file_name || preview.name} />
                  ) : (
                    <div className="td-reader-fallback">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
                        <path d="M6 3h8l4 4v14H6z" />
                        <path d="M14 3v5h5M9 13h6M9 17h6" />
                      </svg>
                      <strong>Preview available in a new tab</strong>
                      <span>
                        This document type does not support an embedded reader.
                        Use the open control to view the uploaded file.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      
      {/* Alert Modal */}
      <AlertModal
        message={alertModal.isOpen ? alertModal.message : null}
        onClose={() => setAlertModal({ isOpen: false, message: "" })}
      />
      </div>
    </div>
  );
}
