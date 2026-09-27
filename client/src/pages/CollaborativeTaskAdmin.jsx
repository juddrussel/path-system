import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
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
import { r2ToProxyUrl } from "../utils/r2ProxyHelper.js";

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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Manrope:wght@400;600;700;800&display=swap');
  .admin-collab{min-height:100vh;padding:32px;background:#f8f7ff;color:#40344b;font-family:'DM Sans','Manrope',system-ui,sans-serif;box-sizing:border-box}.admin-collab *{box-sizing:border-box}.admin-shell{max-width:1180px;margin:0 auto}.admin-hero,.admin-card,.admin-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}.admin-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}.admin-top,.admin-heading,.admin-person,.admin-file,.admin-file-actions,.admin-version-head,.admin-thread-actions,.admin-reply,.admin-decision-actions{display:flex;align-items:center;justify-content:space-between;gap:12px}.admin-back{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.admin-role{display:inline-flex;align-items:center;gap:6px;color:#6f47a9;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.admin-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:34px;align-items:end;margin-top:32px}.admin-eyebrow,.admin-kicker{display:flex;align-items:center;gap:6px;color:#927da5;font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.admin-eyebrow svg{color:#7c3aed}.admin-hero h1{margin:11px 0 9px;color:#372541;font:800 38px/1.05 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.admin-hero p{max-width:620px;margin:0;color:#887995;font-size:12px;line-height:1.55}.admin-meta{display:flex;flex-wrap:wrap;gap:13px;margin-top:18px;color:#887995;font-size:10px}.admin-meta span{display:flex;align-items:center;gap:5px}.admin-status{padding:17px;border:1px solid #c7e6d1;border-radius:12px;background:#f8fdf9}.admin-status small,.admin-status strong,.admin-status em{display:block}.admin-status small{color:#6e947d;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.admin-status strong{margin-top:8px;color:#3f805e;font:800 17px 'Manrope',Arial,sans-serif}.admin-status em{margin-top:8px;color:#7b9a87;font-size:9px;font-style:normal}.admin-progress{height:6px;margin-top:13px;border-radius:99px;background:#deeee3;overflow:hidden}.admin-progress i{display:block;width:100%;height:100%;border-radius:inherit;background:#55a879}.admin-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;margin-top:16px}.admin-main,.admin-side{display:grid;align-content:start;gap:16px}.admin-card,.admin-side-card{padding:22px}.admin-heading{align-items:flex-start}.admin-heading h2{margin:5px 0 0;color:#4b3858;font:800 18px 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.admin-id{padding:6px 8px;border-radius:6px;background:#f4eff9;color:#9b8ba5;font-size:8px;font-weight:800}.admin-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:17px}.admin-metrics div{padding:12px;border:1px solid #eee8f2;border-radius:9px;background:#fdfcff}.admin-metrics strong,.admin-metrics small{display:block}.admin-metrics strong{color:#5d3d76;font:800 21px 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.admin-metrics small{margin-top:4px;color:#998ca3;font-size:8px}.admin-brief{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:17px;padding-top:15px;border-top:1px solid #f0ebf3}.admin-brief small,.admin-brief strong{display:block}.admin-brief small{color:#9b8da2;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.admin-brief strong{margin-top:6px;color:#56405f;font-size:10px}.admin-brief .high{color:#bb6d58}.admin-success,.admin-file-status{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border-radius:7px;background:#e7f6ed;color:#4d946f;font-size:8px;font-weight:800;white-space:nowrap}.admin-muted{margin:11px 0 0;color:#8b7d96;font-size:10px;line-height:1.55}.admin-people{display:grid;gap:7px;margin-top:16px}.admin-person{padding:10px;border:1px solid #eee8f2;border-radius:9px;background:#fdfcff;display:flex;align-items:center;gap:9px}.admin-avatar{display:grid;width:30px;height:30px;flex:none;place-items:center;border-radius:8px;font-size:8px;font-weight:800}.admin-avatar.rose{background:#fde9ef;color:#b45c77}.admin-avatar.blue{background:#e8f1ff;color:#5274a8}.admin-avatar.green{background:#e4f5ec;color:#4d966e}.admin-avatar.amber{background:#fff0d6;color:#a67526}.admin-avatar.violet{background:#eee5fb;color:#7043b7}.admin-person>div{min-width:0;flex:1}.admin-person strong,.admin-person small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-person strong{color:#5a4567;font-size:10px}.admin-person small{margin-top:3px;color:#9c8fa4;font-size:8px}.admin-confirmed{display:inline-flex;align-items:center;gap:4px;color:#4d946f;font-size:8px;font-weight:800}.admin-file{margin-top:16px;padding:12px;border:1px solid #e2d8eb;border-radius:9px;background:#fbf8ff;display:flex;align-items:flex-start;gap:12px}.admin-file-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:9px;background:#eee5ff;color:#7043b7;flex-shrink:0}.admin-file>div:nth-child(2){min-width:0;flex:1}.admin-file strong,.admin-file small,.admin-file p{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-file strong{color:#5a4567;font-size:10px}.admin-file small{margin-top:4px;color:#9689a0;font-size:8px}.admin-file p{margin:6px 0 0;color:#806e8a;font-size:8px}.admin-file>button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #decfea;border-radius:7px;background:#fff;color:#76538d;cursor:pointer;flex-shrink:0}.admin-file-actions{justify-content:flex-start;margin-top:9px}.admin-outline,.admin-primary{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border-radius:7px;font-size:8px;font-weight:800;cursor:pointer}.admin-outline{border:1px solid #e1d6eb;background:#fff;color:#76538d}.admin-primary{border:0;background:#7c3aed;color:#fff}.admin-versions{margin-top:18px}.admin-version-head{display:flex;align-items:center;justify-content:space-between;color:#60486f;font-size:9px;font-weight:800}.admin-version-head small{color:#9c8ea4;font-size:8px;font-weight:500}.admin-version{display:flex;align-items:flex-start;gap:9px;margin-top:7px;padding:9px;border-top:1px solid #f0ebf3}.admin-version.current{border:1px solid #cfe7d8;border-radius:8px;background:#f8fdf9;margin-top:0;padding:11px}.admin-version-number{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800;flex-shrink:0}.admin-version>div{min-width:0;flex:1}.admin-version strong,.admin-version small,.admin-version p{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.admin-version strong{color:#5c4668;font-size:9px}.admin-version small{margin-top:3px;color:#998ba3;font-size:8px}.admin-version p{margin:4px 0 0;color:#806f8b;font-size:8px}.admin-version em{color:#7b5aa1;font-size:8px;font-style:normal;font-weight:800}.admin-message{display:grid;grid-template-columns:30px 1fr;gap:10px;margin-top:17px}.admin-message header{display:flex;align-items:center;gap:7px}.admin-message header strong{color:#5a4567;font-size:10px}.admin-message header small{color:#a095a8;font-size:8px}.admin-message p{margin:6px 0 0;color:#746681;font-size:10px;line-height:1.55}.admin-thread-actions{justify-content:flex-start;margin-top:8px}.admin-thread-actions button{display:inline-flex;align-items:center;gap:5px;padding:0;border:0;background:transparent;color:#7953a0;font-size:8px;font-weight:800;cursor:pointer}.admin-thread-actions span{color:#a095a8;font-size:8px}.admin-reply{display:flex;align-items:flex-end;margin-top:9px;padding:9px;border:1px solid #e7d9f3;border-radius:8px;background:#faf7ff;gap:9px}.admin-reply textarea,.admin-review-note textarea,.admin-modal textarea{min-width:0;flex:1;padding:9px;border:1px solid #e3dbe9;border-radius:8px;outline:0;resize:vertical;color:#5e496b;font:9px/1.5 'DM Sans',Arial,sans-serif}.admin-reply button,.admin-decision-actions button{display:inline-flex;align-items:center;gap:5px;padding:8px 10px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:8px;font-weight:800;cursor:pointer;flex-shrink:0}.admin-reply button:disabled{opacity:.45;cursor:not-allowed}.admin-side-card h2{margin:8px 0 7px;color:#493358;font:800 18px/1.12 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.admin-side-card>p{margin:0;color:#897b93;font-size:10px;line-height:1.55}.admin-review-note{display:block;margin-top:13px;color:#806f8b;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.admin-review-note textarea{display:block;width:100%;margin-top:7px;font-size:10px}.admin-decision-actions{margin-top:9px;display:flex;gap:7px;flex-direction:column}.admin-decision-actions button:last-child{border:1px solid #dccfe8;background:#fff;color:#76538d}.admin-timeline{position:relative;display:grid;gap:16px;margin-top:19px}.admin-timeline:before{position:absolute;top:13px;bottom:13px;left:12px;width:1px;background:#e8dff0;content:""}.admin-timeline>div{position:relative;display:grid;grid-template-columns:25px 1fr;gap:8px}.admin-timeline span{z-index:1;display:grid;width:25px;height:25px;place-items:center;border:1px solid #e2d7ec;border-radius:50%;background:#fff;color:#9f8daf}.admin-timeline span.done{border-color:#bfe3ce;background:#ebf8f0;color:#4d946f}.admin-timeline span.current{border-color:#c1a5e4;background:#f3eaff;color:#7344b4}.admin-timeline p{margin:2px 0 0}.admin-timeline strong,.admin-timeline small{display:block}.admin-timeline strong{color:#60486f;font-size:9px}.admin-timeline small{margin-top:3px;color:#9b8da3;font-size:8px}.admin-policy{display:grid;gap:13px;background:linear-gradient(145deg,#f4edff,#fff);padding:14px;border-radius:9px}.admin-policy>div{display:flex;align-items:flex-start;gap:8px;color:#7041b5}.admin-policy strong,.admin-policy small{display:block}.admin-policy strong{color:#604477;font-size:9px}.admin-policy small{margin-top:3px;color:#978aa0;font-size:8px;line-height:1.4}.admin-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.admin-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}.admin-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}.admin-modal h2{margin:7px 0;color:#4b3656;font:800 19px 'Manrope',Arial,sans-serif}.admin-modal p{color:#8d7f97;font-size:10px;line-height:1.5}.admin-modal textarea{display:block;width:100%;margin-top:14px;font-size:10px}.admin-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:11px}.admin-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:9px;font-weight:800;cursor:pointer}.admin-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}.admin-modal-actions button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:850px){.admin-collab{padding:18px}.admin-hero-grid,.admin-layout{grid-template-columns:1fr}.admin-status{max-width:350px}}@media(max-width:560px){.admin-hero{padding:20px}.admin-top{align-items:flex-start;flex-direction:column}.admin-hero h1{font-size:29px}.admin-card,.admin-side-card{padding:17px}.admin-metrics{grid-template-columns:1fr 1fr}.admin-brief{grid-template-columns:1fr 1fr}.admin-person{align-items:flex-start;flex-wrap:wrap}.admin-confirmed{margin-left:40px}.admin-file-actions,.admin-decision-actions{align-items:stretch;flex-direction:column}.admin-outline,.admin-primary,.admin-decision-actions button{justify-content:center}.admin-reply{align-items:stretch;flex-direction:column}.admin-reply button{justify-content:center}}
`;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Submitted");

  const [reviewNote, setReviewNote] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");

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
        setComments((prev) => [comment, ...prev]);
      }
    });

    return () => {
      socket.off("collaborative:comment_posted");
    };
  }, [task?.id]);

  const approveTask = async () => {
    try {
      setStatus("Approved");
    } catch (err) {
      setError(err.message);
    }
  };

  const requestRevision = async () => {
    if (!revisionReason.trim()) return;
    try {
      await fetch(`${api}/api/collaborative-tasks/${taskId}/request-revision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: revisionReason }),
      });
      setStatus("Revision Requested");
      setRevisionReason("");
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

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ padding: "32px", textAlign: "center", color: "#d32f2f" }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: "32px", textAlign: "center" }}>Task not found</div>;

  // Count confirmed collaborators from the confirmations data
  const confirmedCount = collaborators.filter(c => 
    confirmations.some(conf => conf.user_id === c.user_id && conf.status === "confirmed")
  ).length;
  const currentVersion = versions[0];
  const allConfirmed = confirmedCount === collaborators.length && collaborators.length > 0;
  const isReadyForReview = task.status === "For Approval" && allConfirmed;

  return (
    <div className="admin-collab">
      <style>{styles}</style>
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
                      <span className={`admin-avatar ${collab.tone}`}>
                        {initials(collab.full_name)}
                      </span>
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

            {isReadyForReview && currentVersion && (
              <section className="admin-card">
                <div className="admin-heading">
                  <div>
                    <span className="admin-kicker">Submitted final output</span>
                    <h2>{currentVersion.file_name}</h2>
                  </div>
                  <span className="admin-file-status">
                    <CheckCircle2 size={12} /> Latest version
                  </span>
                </div>

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
                  <button className="admin-outline" type="button">
                    <FileText size={13} /> Open inline preview
                  </button>
                  <button className="admin-outline" type="button">
                    <ArrowUpRight size={13} /> View submission record
                  </button>
                </div>

                {versions.length > 0 && (
                  <div className="admin-versions">
                    <div className="admin-version-head">
                      <span>Version history</span>
                      <small>Latest first</small>
                    </div>
                    {versions.map((item, idx) => (
                      <div
                        className={`admin-version ${idx === 0 ? "current" : ""}`}
                        key={`${item.version}-${item.file_name}`}
                      >
                        <span className="admin-version-number">v{item.version}</span>
                        <div>
                          <strong>{item.file_name}</strong>
                          <small>
                            {formatDate(item.created_at)} · {item.uploaded_by}
                          </small>
                          <p>{item.upload_note || "Version uploaded"}</p>
                        </div>
                        <em>{idx === 0 ? "Current" : "Previous"}</em>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            <section className="admin-card">
              <div className="admin-heading">
                <div>
                  <span className="admin-kicker">
                    <MessageCircle size={12} /> Shared discussion
                  </span>
                  <h2>Group conversation</h2>
                </div>
                <span className="admin-id">{comments.length} notes</span>
              </div>

              {comments.length > 0 ? (
                comments.map((comment) => (
                  <article className="admin-message" key={comment.id}>
                    <span className={`admin-avatar ${getTone(comments.indexOf(comment))}`}>
                      {initials(comment.full_name)}
                    </span>
                    <div>
                      <header>
                        <strong>{comment.full_name}</strong>
                        <small>{formatDate(comment.created_at)}</small>
                      </header>
                      <p>{comment.content}</p>
                      <div className="admin-thread-actions">
                        <button
                          type="button"
                          onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        >
                          <Reply size={12} /> Reply internally
                        </button>
                      </div>
                      {replyTo === comment.id && (
                        <div className="admin-reply">
                          <textarea
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder={`Reply to ${comment.full_name}…`}
                            rows={2}
                          />
                          <button
                            type="button"
                            onClick={postReply}
                            disabled={!replyDraft.trim()}
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div style={{ padding: "12px", color: "#8d7f97", fontSize: "12px" }}>
                  No discussion yet.
                </div>
              )}
            </section>
          </main>

          <aside className="admin-side">
            <section className="admin-side-card">
              <span className="admin-kicker">Reviewer decision</span>
              <h2>
                {status === "Approved"
                  ? "Task approved"
                  : status === "Submitted"
                  ? "Your review is needed"
                  : "Workflow decision"}
              </h2>
              <p>
                {status === "Submitted"
                  ? "All collaborators confirmed v2. Review the final output before recording a decision."
                  : status === "Approved"
                  ? "The decision has been recorded and the task is closed."
                  : "The group has been notified of the latest workflow decision."}
              </p>

              {status === "Submitted" && (
                <>
                  <label className="admin-review-note">
                    Internal review note
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add a note for the audit trail…"
                      rows={4}
                    />
                  </label>
                  <div className="admin-decision-actions">
                    <button type="button" onClick={approveTask}>
                      <CheckCircle2 size={14} /> Approve output
                    </button>
                    <button type="button" onClick={() => setShowRevision(true)}>
                      <X size={14} /> Request revision
                    </button>
                  </div>
                </>
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
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g. Please correct the HIST 204 totals and resubmit the PDF…"
              rows={5}
            />
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setShowRevision(false)}>
                Cancel
              </button>
              <button type="button" onClick={requestRevision} disabled={!revisionReason.trim()}>
                Send revision request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
