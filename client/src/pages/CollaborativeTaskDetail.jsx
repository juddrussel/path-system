import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  FileImage,
  FileText,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  ShieldCheck,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { socket } from "./socket.js";

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

const collaborativeTaskStyles = `
  .collab-standalone{min-height:100vh;padding:32px;background:#f8f7ff;color:#4c3b58;font-family:DM Sans,Arial,sans-serif;box-sizing:border-box}
  .collab-standalone *{box-sizing:border-box}
  .collab-shell{max-width:1180px;margin:0 auto}
  .collab-hero,.collab-card,.collab-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}
  .collab-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}
  .collab-top,.collab-hero-grid,.collab-heading,.collab-person,.collab-version,.collab-composer-footer,.collab-actions{display:flex;align-items:center;justify-content:space-between;gap:14px}
  .collab-back,.collab-link{border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}
  .collab-live{color:#55957a;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .collab-live i{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#50b084}
  .collab-hero-grid{align-items:end;margin-top:34px}
  .collab-eyebrow,.collab-kicker{display:block;color:#947fa4;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}
  .collab-eyebrow svg{vertical-align:-2px;margin-right:5px}
  .collab-hero h1{max-width:650px;margin:10px 0 9px;color:#372541;font:800 38px/1.05 Manrope,Arial,sans-serif;letter-spacing:-.06em}
  .collab-hero p{max-width:650px;margin:0;color:#887995;font-size:12px;line-height:1.55}
  .collab-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;color:#887995;font-size:10px}
  .collab-meta span{display:flex;align-items:center;gap:5px}
  .collab-status{width:250px;padding:17px;border:1px solid #e2d6ef;border-radius:12px;background:rgba(255,255,255,.86)}
  .collab-status small,.collab-status strong{display:block}
  .collab-status small{color:#9888a1;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
  .collab-status strong{margin-top:7px;color:#553d66;font:800 16px Manrope,Arial,sans-serif}
  .collab-progress{height:6px;margin-top:14px;border-radius:99px;background:#e9e0ef;overflow:hidden}
  .collab-progress i{display:block;height:100%;border-radius:inherit;background:#7c3aed}
  .collab-status em{display:block;margin-top:7px;color:#8b7b96;font-size:9px;font-style:normal}
  .collab-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;margin-top:16px}
  .collab-main,.collab-side{display:flex;flex-direction:column;gap:16px}
  .collab-card,.collab-side-card{padding:22px}
  .collab-heading{align-items:flex-start}
  .collab-heading h2{margin:4px 0 0;color:#4b3858;font:800 18px Manrope,Arial,sans-serif;letter-spacing:-.045em}
  .collab-count,.collab-badge{padding:6px 8px;border-radius:6px;background:#f0e7fc;color:#7546b5;font-size:9px;font-weight:800;white-space:nowrap}
  .collab-muted{margin:13px 0 0;color:#8f8199;font-size:10px;line-height:1.55}
  .collab-people{display:grid;gap:8px;margin-top:15px}
  .collab-person{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border:1px solid #eee8f2;border-radius:9px}
  .collab-avatar{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:8px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}
  .collab-person-copy{min-width:0;flex:1}
  .collab-person-copy strong,.collab-person-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .collab-person-copy strong{color:#5a4568;font-size:10px}
  .collab-person-copy small{margin-top:3px;color:#978ba1;font-size:8px}
  .collab-person-status{display:inline-flex;align-items:center;gap:4px;color:#8d8195;font-size:8px;font-weight:800}
  .collab-person-status.confirmed{color:#579574}
  .collab-toggle{padding:5px 7px;border:1px solid #ded2e8;border-radius:6px;background:#fff;color:#76558e;font-size:8px;font-weight:800;cursor:pointer}
  .collab-upload{display:flex;align-items:center;gap:10px;width:100%;margin-top:16px;padding:12px;border:1px dashed #cdbbe6;border-radius:9px;background:#fff;color:#7044a3;text-align:left;cursor:pointer}
  .collab-upload.selected{border-style:solid;border-color:#bfe1cd;background:#f5fbf8;color:#4d8d6c}
  .collab-upload>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee5ff}
  .collab-upload>div{min-width:0;flex:1}
  .collab-upload strong,.collab-upload small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .collab-upload strong{font-size:10px}
  .collab-upload small{margin-top:3px;color:#9a8ba6;font-size:8px}
  .collab-label{display:block;margin-top:12px;color:#806f8b;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}
  .collab-label textarea,.collab-composer textarea{display:block;width:100%;margin-top:7px;padding:10px;border:1px solid #e2d9e9;border-radius:8px;outline:0;resize:vertical;color:#5d4867;font:10px/1.5 DM Sans,Arial,sans-serif}
  .collab-primary{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:11px;padding:9px 11px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:9px;font-weight:800;cursor:pointer}
  .collab-primary:disabled{background:#ddd3e5;color:#9c91a5;cursor:not-allowed}
  .collab-history{display:grid;gap:7px;margin-top:17px}
  .collab-history>div{display:flex;align-items:center;gap:9px;padding:9px;border-top:1px solid #f0ebf3}
  .collab-history>div>span{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}
  .collab-history>div>div{min-width:0;flex:1}
  .collab-history strong,.collab-history small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .collab-history strong{color:#5c4668;font-size:9px}
  .collab-history small{margin-top:3px;color:#998ba3;font-size:8px}
  .collab-history em{color:#7b5aa1;font-size:8px;font-style:normal;font-weight:800}
  .collab-messages{display:grid;gap:12px;margin-top:16px;max-height:400px;overflow-y:auto}
  .collab-message{display:flex;gap:9px;padding:11px;border:1px solid #f0ebf3;border-radius:9px;background:#fdfcff}
  .collab-message-content{min-width:0;flex:1}
  .collab-message header{display:flex;align-items:center;gap:7px}
  .collab-message header strong{color:#5b4766;font-size:9px}
  .collab-message header small{color:#a394a8;font-size:8px}
  .collab-message p{margin:6px 0 0;color:#75657d;font-size:9px;line-height:1.5}
  .collab-composer{margin-top:16px;border:1px solid #e4dce9;border-radius:10px;background:#fff;overflow:hidden}
  .collab-composer textarea{min-height:75px;margin:0;padding:11px;border:0}
  .collab-composer-footer{align-items:flex-end;padding:8px}
  .collab-composer-footer small{color:#998ba3;font-size:8px}
  .collab-composer-actions{display:flex;gap:6px}
  .collab-composer-actions button{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:8px;font-weight:800;cursor:pointer}
  .collab-composer-actions button:first-child{border:1px solid #ddd1e8;background:#fff;color:#76538d}
  .collab-composer-actions button:disabled{opacity:.45;cursor:not-allowed}
  .collab-side-card h2{margin:8px 0;color:#51395d;font:800 18px/1.15 Manrope,Arial,sans-serif;letter-spacing:-.05em}
  .collab-side-card p{margin:0;color:#8a7996;font-size:9px;line-height:1.55}
  .collab-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}
  .collab-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}
  .collab-modal h2{margin:7px 0;color:#4b3656;font:800 19px Manrope,Arial,sans-serif}
  .collab-modal p{color:#8d7f97;font-size:10px;line-height:1.5}
  .collab-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}
  .collab-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:16px}
  .collab-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:9px;font-weight:800;cursor:pointer}
  .collab-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}
  @media(max-width:850px){.collab-layout{grid-template-columns:1fr}.collab-hero-grid{align-items:stretch;flex-direction:column}}
  @media(max-width:560px){.collab-hero{padding:20px}.collab-hero h1{font-size:29px}.collab-card,.collab-side-card{padding:17px}}
`;

export default function CollaborativeTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = useMemo(() => getUser(token), [token]);
  const isChair = ADMIN_ROLES.includes(user.role);
  const api = import.meta.env.VITE_API_URL || "";

  // State
  const [task, setTask] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [confirmations, setConfirmations] = useState([]);
  const [versions, setVersions] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [finalFile, setFinalFile] = useState(null);
  const [finalNote, setFinalNote] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");

  const finalInputRef = useRef(null);
  const discussionInputRef = useRef(null);

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
        setCollaborators(data.collaborators || []);
        setConfirmations(data.confirmations || []);
        setVersions(data.versions || []);
        setComments(data.comments || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadTask();
  }, [taskId, token, api]);

  // Socket listeners
  useEffect(() => {
    if (!task) return;

    socket.on("collaborative:confirmed", (data) => {
      if (data.taskId === task.id) {
        setConfirmations((prev) => 
          prev.map(c => 
            c.user_id === data.userId && c.output_version === task.current_output_version
              ? { ...c, status: "confirmed", confirmed_at: new Date() }
              : c
          )
        );
      }
    });

    socket.on("collaborative:withdrawn", (data) => {
      if (data.taskId === task.id) {
        setConfirmations((prev) =>
          prev.map(c =>
            c.user_id === data.userId && c.output_version === task.current_output_version
              ? { ...c, status: "pending", confirmed_at: null }
              : c
          )
        );
      }
    });

    socket.on("collaborative:output_updated", (data) => {
      if (data.taskId === task.id) {
        setVersions((prev) => [
          {
            version: data.version,
            file_name: data.fileName,
            uploaded_by: data.uploadedBy,
            created_at: data.uploadedAt,
          },
          ...prev,
        ]);
        setTask((prev) => ({ ...prev, current_output_version: data.version }));
        setConfirmations((prev) =>
          prev.map(c => ({ ...c, status: "pending", confirmed_at: null }))
        );
      }
    });

    return () => {
      socket.off("collaborative:confirmed");
      socket.off("collaborative:withdrawn");
      socket.off("collaborative:output_updated");
    };
  }, [task]);

  // Handlers
  const handleConfirm = async () => {
    try {
      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to confirm");
      const data = await response.json();
      if (data.autoSubmitted) {
        setTask((prev) => ({ ...prev, status: "For Approval" }));
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWithdraw = async () => {
    try {
      await fetch(`${api}/api/collaborative-tasks/${taskId}/withdraw-confirmation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setTask((prev) => ({ ...prev, status: "Pending" }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadFinalOutput = async () => {
    if (!finalFile) return;
    try {
      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("note", finalNote);

      const response = await fetch(
        `${api}/api/collaborative-tasks/${taskId}/upload-final-output`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (!response.ok) throw new Error("Failed to upload");
      setFinalFile(null);
      setFinalNote("");
      if (finalInputRef.current) finalInputRef.current.value = "";
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRequestRevision = async () => {
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
      setRevisionReason("");
      setShowRevisionModal(false);
      setTask((prev) => ({ ...prev, status: "Pending" }));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ padding: "32px", textAlign: "center", color: "#d32f2f" }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: "32px", textAlign: "center" }}>Task not found</div>;

  const confirmedCount = confirmations.filter(c => c.status === "confirmed").length;
  const collaboratorCount = collaborators.length;
  const currentUserConfirmed = confirmations.find(c => c.user_id === user.id)?.status === "confirmed";
  const isCollaborator = collaborators.some(c => c.user_id === user.id);

  return (
    <div className="collab-standalone">
      <style>{collaborativeTaskStyles}</style>
      <div className="collab-shell">
        <header className="collab-hero">
          <div className="collab-top">
            <button className="collab-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} /> Back
            </button>
            <span className="collab-live">
              <i /> Shared task workspace
            </span>
          </div>

          <div className="collab-hero-grid">
            <div>
              <span className="collab-eyebrow">
                <UsersRound size={12} /> Collaborative Task · {task.tracking_id}
              </span>
              <h1>{task.title}</h1>
              <p>{task.notes || "Shared task for collaborative work"}</p>
              <div className="collab-meta">
                <span>
                  <Clock3 size={13} /> Due {formatDate(task.deadline)}
                </span>
                <span>
                  <FileText size={13} /> {task.doc_type}
                </span>
              </div>
            </div>

            <div className="collab-status">
              <small>Task Status</small>
              <strong>{task.status}</strong>
              <div className="collab-progress">
                <i
                  style={{
                    width: `${task.status === "For Approval" ? 100 : (confirmedCount / collaboratorCount) * 100}%`,
                  }}
                />
              </div>
              <em>
                {task.status === "For Approval"
                  ? "Submitted to Program Chair/Admin"
                  : `${confirmedCount} / ${collaboratorCount} confirmed`}
              </em>
            </div>
          </div>
        </header>

        <div className="collab-layout">
          <main className="collab-main">
            {/* Confirmation Gate */}
            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Confirmation Gate</span>
                  <h2>Confirm the latest final output</h2>
                </div>
                <span className="collab-badge">{confirmedCount}/{collaboratorCount} Confirmed</span>
              </div>

              <p className="collab-muted">Every collaborator confirms the current version.</p>

              <div className="collab-people">
                {collaborators.map((collab) => {
                  const confirmation = confirmations.find(
                    c => c.user_id === collab.user_id && c.output_version === task.current_output_version
                  );
                  const isConfirmed = confirmation?.status === "confirmed";

                  return (
                    <div className="collab-person" key={collab.user_id}>
                      <span className="collab-avatar">{initials(collab.full_name)}</span>
                      <div className="collab-person-copy">
                        <strong>{collab.full_name}</strong>
                        <small>{collab.role}</small>
                      </div>
                      <span className={`collab-person-status ${isConfirmed ? "confirmed" : ""}`}>
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

              {isCollaborator && task.status !== "For Approval" && (
                <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                  {!currentUserConfirmed ? (
                    <button className="collab-primary" onClick={handleConfirm}>
                      <Check size={14} /> Confirm Final Output
                    </button>
                  ) : (
                    <button className="collab-primary" onClick={handleWithdraw} style={{ background: "#f97316" }}>
                      <X size={14} /> Withdraw Confirmation
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Final Output Versions */}
            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Final Output</span>
                  <h2>Upload a new version</h2>
                </div>
                <span className="collab-count">v{task.current_output_version}</span>
              </div>

              {isCollaborator && (
                <>
                  <input
                    ref={finalInputRef}
                    type="file"
                    hidden
                    onChange={(e) => setFinalFile(e.target.files?.[0])}
                  />
                  <button
                    className={`collab-upload ${finalFile ? "selected" : ""}`}
                    onClick={() => finalInputRef.current?.click()}
                  >
                    <span>
                      <UploadCloud size={16} />
                    </span>
                    <div>
                      <strong>{finalFile?.name || "Attach final output"}</strong>
                      <small>{finalFile ? `${(finalFile.size / 1024 / 1024).toFixed(2)} MB` : "PDF, DOCX, etc."}</small>
                    </div>
                  </button>

                  <label className="collab-label">
                    Version note
                    <textarea
                      value={finalNote}
                      onChange={(e) => setFinalNote(e.target.value)}
                      placeholder="What changed in this version?"
                      rows={2}
                    />
                  </label>

                  <button
                    className="collab-primary"
                    onClick={handleUploadFinalOutput}
                    disabled={!finalFile}
                  >
                    <UploadCloud size={14} /> Upload v{task.current_output_version + 1}
                  </button>
                </>
              )}

              {versions.length > 0 && (
                <div className="collab-history">
                  {versions.map((v) => (
                    <div key={`v${v.version}`}>
                      <span>v{v.version}</span>
                      <div>
                        <strong>{v.file_name}</strong>
                        <small>by {v.uploaded_by}</small>
                      </div>
                      <em>{v.version === task.current_output_version ? "Current" : "Previous"}</em>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Discussion */}
            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">
                    <MessageCircle size={12} /> Discussion
                  </span>
                  <h2>Working notes</h2>
                </div>
              </div>

              <div className="collab-messages">
                {comments.map((comment) => (
                  <div className="collab-message" key={comment.id}>
                    <span className="collab-avatar">{initials(comment.full_name)}</span>
                    <div className="collab-message-content">
                      <header>
                        <strong>{comment.full_name}</strong>
                        <small>{formatDate(comment.created_at)}</small>
                      </header>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {isCollaborator && (
                <div className="collab-composer">
                  <textarea
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder="Write a note or ask a question..."
                    rows={3}
                  />
                  <div className="collab-composer-footer">
                    <small>Ctrl / Cmd + Enter to send</small>
                    <span className="collab-composer-actions">
                      <button
                        onClick={() => setMessageDraft("")}
                        disabled={!messageDraft.trim()}
                      >
                        <Send size={14} /> Send
                      </button>
                    </span>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Sidebar */}
          <aside className="collab-side">
            {isChair && task.status === "For Approval" && (
              <section className="collab-side-card">
                <span className="collab-kicker">Program Chair Review</span>
                <h2>Task ready for review</h2>
                <p>All collaborators confirmed the latest version.</p>
                <button className="collab-primary" style={{ width: "100%", marginTop: "12px" }}>
                  <CheckCircle2 size={14} /> Review
                </button>
              </section>
            )}

            {(isChair || isCollaborator) && (
              <section className="collab-side-card">
                <span className="collab-kicker">Actions</span>
                <h2>Manage workflow</h2>
                <button
                  className="collab-primary"
                  onClick={() => setShowRevisionModal(true)}
                  style={{ width: "100%", marginTop: "12px" }}
                  disabled={task.status === "For Approval"}
                >
                  Request Revision
                </button>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="collab-modal-backdrop">
          <div className="collab-modal">
            <button
              className="collab-modal-close"
              onClick={() => setShowRevisionModal(false)}
            >
              <X size={15} />
            </button>
            <span className="collab-kicker">Revision Request</span>
            <h2>What should the group revisit?</h2>
            <p>Give collaborators a clear reason. The task returns to In Progress.</p>
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g., Update section 3 and upload corrected version..."
              rows={5}
            />
            <div className="collab-modal-actions">
              <button onClick={() => setShowRevisionModal(false)}>Cancel</button>
              <button onClick={handleRequestRevision} disabled={!revisionReason.trim()}>
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 16px",
            background: "#fee2e2",
            color: "#dc2626",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
