import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileImage,
  FileText,
  ListChecks,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  ShieldCheck,
  UploadCloud,
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
  @keyframes spin{0%{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  /* PDF Reader Modal Styles - EXACT from TaskDetail.jsx */
  .td-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.td-reader{width:min(1120px,calc(100vw - 48px));max-height:calc(100vh - 36px);overflow:auto;border:1px solid #e1d8ea;border-radius:13px;background:#fff;box-shadow:0 28px 80px rgba(45,27,64,.32)}.td-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid #eee7f2}.td-reader-eyebrow{display:flex;align-items:center;gap:6px;color:#9c8da7;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-reader-eyebrow i{width:5px;height:5px;border-radius:50%;background:#a78bfa}.td-reader-head h2{margin:7px 0 0;color:#4b3757;font:800 18px Manrope,sans-serif;letter-spacing:-.04em}.td-reader-head p{margin:5px 0 0;color:#907f9a;font-size:11px}.td-reader-head-actions{display:flex;align-items:center;gap:11px;padding-top:4px}.td-reader-head-actions span{color:#8058a5;font-size:11px;font-weight:800}.td-reader-head-actions button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e2d9e8;border-radius:7px;background:#fff;color:#76568d;font-size:17px;cursor:pointer}.td-reader-stage{padding:18px;background:linear-gradient(135deg,#f2edf8,#faf9fd)}.td-reader-frame{width:min(680px,100%);margin:0 auto;border:1px solid #ded6e4;border-radius:8px;overflow:hidden;background:#27272a;box-shadow:0 16px 30px rgba(49,35,62,.22)}.td-reader-toolbar{display:flex;align-items:center;gap:9px;min-height:43px;padding:0 12px;background:#303035;color:#f7f4fb}.td-reader-toolbar b{display:grid;min-width:18px;height:20px;place-items:center;border-radius:3px;background:#171719;color:#fff;font-size:12px}.td-reader-toolbar span{font-size:12px;font-weight:800}.td-reader-toolbar button{display:grid;width:21px;height:21px;place-items:center;border:0;border-radius:3px;background:transparent;color:#f5f3f7;font-size:16px;cursor:pointer}.td-reader-toolbar button:hover{background:rgba(255,255,255,.12)}.td-reader-toolbar .td-reader-toolbar-spacer{flex:1}.td-reader-paper{display:flex;min-height:clamp(440px,67vh,720px);align-items:stretch;justify-content:center;background:#f7f7f7}.td-reader-paper iframe{width:100%;min-height:clamp(440px,67vh,720px);border:0;background:#fff}.td-reader-paper img{display:block;max-width:100%;max-height:clamp(440px,67vh,720px);object-fit:contain;background:#fff}.td-reader-fallback{display:flex;min-height:440px;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:24px;color:#806e89;text-align:center}.td-reader-fallback strong{color:#60496d;font-size:13px}.td-reader-fallback span{max-width:300px;font-size:12px;line-height:1.55}@media(max-width:720px){.td-reader{width:calc(100vw - 20px);max-height:calc(100vh - 20px)}.td-reader-head{padding:13px}.td-reader-head h2{font-size:16px}.td-reader-head-actions span{display:none}.td-reader-stage{padding:11px}.td-reader-toolbar{gap:5px;padding:0 8px}.td-reader-paper,.td-reader-paper iframe{min-height:58vh}.td-reader-paper img{max-height:58vh}}
  .collab-standalone{min-height:100vh;padding:32px;background:#f8f7ff;color:#4c3b58;font-family:'DM Sans','Manrope',system-ui,sans-serif;box-sizing:border-box}.collab-standalone *{box-sizing:border-box}.collab-shell{max-width:1180px;margin:0 auto}.collab-hero,.collab-card,.collab-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}.collab-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}.collab-top,.collab-hero-grid,.collab-heading,.collab-person,.collab-version,.collab-composer-footer,.collab-actions{display:flex;align-items:center;justify-content:space-between;gap:14px}.collab-back,.collab-link{border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.collab-live{color:#55957a;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-live i{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#50b084}.collab-hero-grid{align-items:end;margin-top:34px}.collab-eyebrow,.collab-kicker{display:block;color:#947fa4;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.collab-eyebrow svg{vertical-align:-2px;margin-right:5px}.collab-hero h1{max-width:650px;margin:10px 0 9px;color:#372541;font:800 38px/1.05 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.collab-hero p{max-width:650px;margin:0;color:#887995;font-size:12px;line-height:1.55}.collab-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;color:#887995;font-size:10px}.collab-meta span{display:flex;align-items:center;gap:5px}.collab-status{width:250px;padding:17px;border:1px solid #e2d6ef;border-radius:12px;background:rgba(255,255,255,.86)}.collab-status small,.collab-status strong{display:block}.collab-status small{color:#9888a1;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-status strong{margin-top:7px;color:#553d66;font:800 16px 'Manrope',Arial,sans-serif}.collab-progress{height:6px;margin-top:14px;border-radius:99px;background:#e9e0ef;overflow:hidden}.collab-progress i{display:block;height:100%;border-radius:inherit;background:#7c3aed}.collab-status em{display:block;margin-top:7px;color:#8b7b96;font-size:9px;font-style:normal}.collab-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:16px;margin-top:16px}.collab-main,.collab-side{display:flex;flex-direction:column;gap:16px}.collab-card,.collab-side-card{padding:22px}.collab-heading{align-items:flex-start}.collab-heading h2{margin:4px 0 0;color:#4b3858;font:800 18px 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.collab-count,.collab-badge{padding:6px 8px;border-radius:6px;background:#f0e7fc;color:#7546b5;font-size:9px;font-weight:800;white-space:nowrap}.collab-muted{margin:13px 0 0;color:#8f8199;font-size:10px;line-height:1.55}.collab-brief-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px;padding-top:16px;border-top:1px solid #f0ebf3}.collab-brief-grid small,.collab-brief-grid strong{display:block}.collab-brief-grid small{color:#9b8da2;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-brief-grid strong{margin-top:7px;color:#56405f;font-size:10px;line-height:1.35}.collab-version{margin-top:16px;padding:11px;border:1px solid #e1d5ef;border-radius:9px;background:#fbf8ff;display:flex;align-items:center;gap:9px}.collab-version>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee3fc;color:#7043b6;flex-shrink:0}.collab-version>div{min-width:0;flex:1}.collab-version strong,.collab-version small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-version strong{color:#5f456d;font-size:10px}.collab-version small{margin-top:3px;color:#978aa0;font-size:8px}.collab-version em{padding:5px 7px;border-radius:5px;background:#fff3d7;color:#966f22;font-size:8px;font-style:normal;font-weight:800}.collab-people{display:grid;gap:8px;margin-top:15px}.collab-person{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #eee8f2;border-radius:9px}.collab-avatar{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:8px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}.collab-avatar.rose{background:#fde9ef;color:#b45c77}.collab-avatar.blue{background:#e8f1ff;color:#5274a8}.collab-avatar.green{background:#e4f5ec;color:#4d966e}.collab-avatar.amber{background:#fef5e5;color:#9d6d2a}.collab-person-copy{min-width:0;flex:1}.collab-person-copy strong,.collab-person-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-person-copy strong{color:#5a4568;font-size:10px}.collab-person-copy small{margin-top:3px;color:#978ba1;font-size:8px}.collab-person-status{display:inline-flex;align-items:center;gap:4px;color:#8d8195;font-size:8px;font-weight:800}.collab-person-status.confirmed{color:#579574}.collab-toggle{padding:5px 7px;border:1px solid #ded2e8;border-radius:6px;background:#fff;color:#76558e;font-size:8px;font-weight:800;cursor:pointer}.collab-upload{display:flex;align-items:center;gap:10px;width:100%;margin-top:16px;padding:12px;border:1px dashed #cdbbe6;border-radius:9px;background:#fff;color:#7044a3;text-align:left;cursor:pointer;position:relative}.collab-upload.selected{border-style:solid;border-color:#bfe1cd;background:#f5fbf8;color:#4d8d6c}.collab-upload>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee5ff;flex-shrink:0}.collab-upload>div{min-width:0;flex:1}.collab-upload strong,.collab-upload small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-upload strong{font-size:10px}.collab-upload small{margin-top:3px;color:#9a8ba6;font-size:8px}.collab-label{display:block;margin-top:12px;color:#806f8b;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-label textarea,.collab-composer textarea,.collab-review textarea,.collab-modal textarea{display:block;width:100%;margin-top:7px;padding:10px;border:1px solid #e2d9e9;border-radius:8px;outline:0;resize:vertical;color:#5d4867;font:10px/1.5 DM Sans,Arial,sans-serif}.collab-primary,.collab-review button{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:11px;padding:9px 11px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:9px;font-weight:800;cursor:pointer}.collab-primary:disabled,.collab-review button:disabled{background:#ddd3e5;color:#9c91a5;cursor:not-allowed}.collab-history{display:grid;gap:7px;margin-top:17px}.collab-history>div{display:flex;align-items:center;gap:9px;padding:9px;border-top:1px solid #f0ebf3}.collab-history>div>span{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}.collab-history>div>div{min-width:0;flex:1}.collab-history strong,.collab-history small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-history strong{color:#5c4668;font-size:9px}.collab-history small{margin-top:3px;color:#998ba3;font-size:8px}.collab-history em{color:#7b5aa1;font-size:8px;font-style:normal;font-weight:800}.collab-messages{display:grid;gap:12px;margin-top:16px}.collab-message{display:flex;gap:9px;padding:11px;border:1px solid #f0ebf3;border-radius:9px;background:#fdfcff}.collab-message-content{min-width:0;flex:1}.collab-message header{display:flex;align-items:center;gap:7px}.collab-message header strong{color:#5b4766;font-size:9px}.collab-message header small{color:#a394a8;font-size:8px}.collab-message p{margin:6px 0 0;color:#75657d;font-size:9px;line-height:1.5}.collab-thread{display:flex;gap:9px;margin-top:8px}.collab-thread button{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:#7954a0;font-size:8px;font-weight:800;cursor:pointer}.collab-attachment{display:grid;grid-template-columns:28px minmax(0,1fr);gap:4px 7px;margin-top:8px;padding:8px;border:1px solid #e5d9ef;border-radius:8px;background:#fbf8ff}.collab-attachment span{display:grid;width:28px;height:28px;place-items:center;grid-row:span 2;border-radius:7px;background:#eee5fb;color:#7043b7}.collab-attachment strong,.collab-attachment small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-attachment strong{color:#60486f;font-size:9px}.collab-attachment small{color:#998ba3;font-size:7px}.collab-composer{margin-top:16px;border:1px solid #e4dce9;border-radius:10px;background:#fff;overflow:hidden}.collab-composer textarea{min-height:75px;margin:0;padding:11px;border:0}.collab-composer-footer{align-items:flex-end;padding:8px}.collab-composer-footer small{color:#998ba3;font-size:8px}.collab-composer-footer strong{color:#5d4867;font-size:9px}.collab-composer-actions{display:flex;gap:6px}.collab-composer-actions button{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:8px;font-weight:800;cursor:pointer}.collab-composer-actions button:first-child{border:1px solid #ddd1e8;background:#fff;color:#76538d}.collab-composer-actions button:disabled{opacity:.45;cursor:not-allowed}.collab-review h2,.collab-side-card h2{margin:8px 0;color:#51395d;font:800 18px/1.15 'Manrope',Arial,sans-serif;letter-spacing:-.05em}.collab-review p,.collab-side-card p{margin:0;color:#8a7996;font-size:9px;line-height:1.55}.collab-review textarea{margin-top:13px}.collab-review-actions{display:flex;gap:7px}.collab-review-actions button{flex:1}.collab-review-actions button:last-child{border:1px solid #d8c8e8;background:#fff;color:#76538d}.collab-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.collab-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}.collab-modal h2{margin:7px 0;color:#4b3656;font:800 19px 'Manrope',Arial,sans-serif}.collab-modal p{color:#8d7f97;font-size:10px;line-height:1.5}.collab-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}.collab-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:16px}.collab-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:9px;font-weight:800;cursor:pointer}.collab-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}@media(max-width:850px){.collab-standalone{padding:18px}.collab-layout{grid-template-columns:1fr}.collab-status{width:100%;max-width:330px}.collab-hero-grid{align-items:stretch;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.collab-hero{padding:20px}.collab-hero h1{font-size:29px}.collab-card,.collab-side-card{padding:17px}.collab-top{align-items:flex-start;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr}.collab-person{align-items:flex-start;flex-wrap:wrap}.collab-toggle{margin-left:38px}.collab-composer-footer{align-items:stretch;flex-direction:column}.collab-composer-actions{width:100%}.collab-composer-actions button{flex:1;justify-content:center}}
`;

export default function CollaborativeTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = useMemo(() => getUser(token), [token]);
  const isChair = ADMIN_ROLES.includes(user.role);
  const api = import.meta.env.VITE_API_URL || "";

  console.log("[CollaborativeTaskDetail] Component mounted. taskId:", taskId, "token exists:", !!token, "api:", api);

  // State
  const [task, setTask] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [versions, setVersions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Awaiting Confirmation");
  const [preview, setPreview] = useState(null);

  const [finalFile, setFinalFile] = useState(null);
  const [finalNote, setFinalNote] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [discussionAttachment, setDiscussionAttachment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [readerZoom, setReaderZoom] = useState("page-width");

  // Comment file upload state
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentFileProgress, setCommentFileProgress] = useState({});
  const [isCommentUploadingFiles, setIsCommentUploadingFiles] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyFileProgress, setReplyFileProgress] = useState({});
  const [isReplyUploadingFiles, setIsReplyUploadingFiles] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  const finalInputRef = useRef(null);
  const discussionInputRef = useRef(null);
  const commentFilesRef = useRef(null);
  const replyFilesRef = useRef(null);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        console.log("[CollaborativeTaskDetail] Loading task:", taskId);
        const response = await fetch(`${api}/api/collaborative-tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[CollaborativeTaskDetail] API Response status:", response.status);
        if (!response.ok) throw new Error("Failed to load task");
        const data = await response.json();
        console.log("[CollaborativeTaskDetail] Full API response:", data);
        console.log("[CollaborativeTaskDetail] Task:", data.task);
        console.log("[CollaborativeTaskDetail] Attachments:", data.attachments);
        setTask(data.task);
        setCollaborators((data.collaborators || []).map((c, i) => ({
          ...c,
          confirmed: data.confirmations?.some(conf => conf.user_id === c.user_id && conf.status === "confirmed") || false,
          tone: getTone(i),
        })));
        setVersions(data.versions || []);
        setMessages(data.comments || []);
        setAttachments(data.attachments || []);
        setStatus(data.task?.status || "Awaiting Confirmation");
        
        socket.emit("join_task", { taskId: parseInt(taskId) });
      } catch (err) {
        console.error("[CollaborativeTaskDetail] Error loading task:", err);
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
    if (!task) return;

    socket.on("collaborative:confirmed", (data) => {
      if (data.taskId === task.id) {
        setCollaborators((prev) =>
          prev.map(c => c.user_id === data.userId ? { ...c, confirmed: true } : c)
        );
      }
    });

    socket.on("collaborative:withdrawn", (data) => {
      if (data.taskId === task.id) {
        setCollaborators((prev) =>
          prev.map(c => c.user_id === data.userId ? { ...c, confirmed: false } : c)
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
        setCollaborators((prev) =>
          prev.map(c => ({ ...c, confirmed: false }))
        );
        setStatus("Awaiting Confirmation");
      }
    });

    socket.on("collaborative:comment_posted", (comment) => {
      if (comment.task_id === task.id) {
        setMessages((prev) => {
          if (comment.parent_comment_id) {
            // Find the parent comment (could be top-level or nested)
            const addReplyRecursive = (messages) => {
              return messages.map(msg => {
                // If this is the parent, add the reply
                if (msg.id === comment.parent_comment_id) {
                  return {
                    ...msg,
                    replies: [...(msg.replies || []), comment]
                  };
                }
                // If this message has replies, search in them too
                if (msg.replies && msg.replies.length > 0) {
                  return {
                    ...msg,
                    replies: addReplyRecursive(msg.replies)
                  };
                }
                return msg;
              });
            };
            return addReplyRecursive(prev);
          }
          // Root comment - add to top level
          return [{ ...comment, replies: [] }, ...prev];
        });
      }
    });

    return () => {
      socket.off("collaborative:confirmed");
      socket.off("collaborative:withdrawn");
      socket.off("collaborative:output_updated");
      socket.off("collaborative:comment_posted");
    };
  }, [task]);

  // Handlers
  const toggleConfirmation = (userId) => {
    const isConfirmed = collaborators.find(c => c.user_id === userId)?.confirmed;
    if (isConfirmed) {
      handleWithdraw(userId);
    } else {
      handleConfirm(userId);
    }
  };

  const handleConfirm = async (userId = user.id) => {
    try {
      await fetch(`${api}/api/collaborative-tasks/${taskId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators((prev) =>
        prev.map(c => c.user_id === userId ? { ...c, confirmed: true } : c)
      );
      const allConfirmed = collaborators.every(c => c.user_id === userId || c.confirmed);
      if (allConfirmed) setStatus("Submitted");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWithdraw = async (userId = user.id) => {
    try {
      await fetch(`${api}/api/collaborative-tasks/${taskId}/withdraw-confirmation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators((prev) =>
        prev.map(c => c.user_id === userId ? { ...c, confirmed: false } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadNewVersion = async () => {
    if (!finalFile) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      formData.append("file", finalFile);
      formData.append("note", finalNote);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFinalFile(null);
          setFinalNote("");
          setUploadProgress(0);
          if (finalInputRef.current) finalInputRef.current.value = "";
        } else {
          setError("Upload failed");
        }
        setIsUploading(false);
      });

      // Handle error
      xhr.addEventListener("error", () => {
        setError("Upload failed");
        setIsUploading(false);
      });

      xhr.open("POST", `${api}/api/collaborative-tasks/${taskId}/upload-final-output`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const postMessage = async () => {
    if (!messageDraft.trim() && commentFiles.length === 0) return;
    
    try {
      setIsCommentUploadingFiles(true);
      
      if (commentFiles.length > 0) {
        const formData = new FormData();
        commentFiles.forEach((file, idx) => {
          formData.append("files", file);
        });
        formData.append("content", messageDraft.trim());
        formData.append("taskId", taskId);
        
        // Create XMLHttpRequest with progress tracking
        const xhr = new XMLHttpRequest();
        let lastProgressTime = Date.now();
        let progressInterval = null;
        
        // Simulated progress if real progress doesn't fire
        const startTime = Date.now();
        const estimateProgress = () => {
          const elapsed = Date.now() - startTime;
          // Estimate: 100ms per 10% up to 90%
          const estimatedPercent = Math.min(Math.floor((elapsed / 100) * 10), 90);
          commentFiles.forEach((_, idx) => {
            setCommentFileProgress(prev => {
              const current = prev[idx] ?? 0;
              // Only update if estimate is higher
              return { ...prev, [idx]: Math.max(current, estimatedPercent) };
            });
          });
        };
        
        // Start simulation immediately
        progressInterval = setInterval(estimateProgress, 50);
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable && Date.now() - lastProgressTime > 50) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            commentFiles.forEach((_, idx) => {
              setCommentFileProgress(prev => ({ ...prev, [idx]: percentComplete }));
            });
            lastProgressTime = Date.now();
          }
        });
        
        xhr.addEventListener("load", () => {
          if (progressInterval) clearInterval(progressInterval);
          if (xhr.status === 200 || xhr.status === 201) {
            // Set to 100% immediately on success
            commentFiles.forEach((_, idx) => {
              setCommentFileProgress(prev => ({ ...prev, [idx]: 100 }));
            });
            // Clear after a short delay so user sees 100%
            setTimeout(() => {
              setMessageDraft("");
              setCommentFiles([]);
              setCommentFileProgress({});
              if (commentFilesRef.current) commentFilesRef.current.value = "";
            }, 300);
          } else {
            setError("File upload failed");
          }
          setIsCommentUploadingFiles(false);
        });
        
        xhr.addEventListener("error", () => {
          if (progressInterval) clearInterval(progressInterval);
          setError("File upload failed");
          setIsCommentUploadingFiles(false);
        });
        
        xhr.addEventListener("abort", () => {
          if (progressInterval) clearInterval(progressInterval);
          setIsCommentUploadingFiles(false);
        });
        
        xhr.open("POST", `${api}/api/collaborative-tasks/${taskId}/comment`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.send(formData);
      } else {
        // No files, just send text comment
        const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/comment`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: messageDraft.trim() }),
        });
        
        if (response.ok) {
          setMessageDraft("");
        }
        setIsCommentUploadingFiles(false);
      }
    } catch (err) {
      setError(err.message);
      setIsCommentUploadingFiles(false);
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
      setRevisionReason("");
      setShowRevision(false);
      setStatus("In Progress");
      setCollaborators((prev) => prev.map(c => ({ ...c, confirmed: false })));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div style={{ padding: "32px", textAlign: "center" }}>Loading...</div>;
  if (error) return <div style={{ padding: "32px", textAlign: "center", color: "#d32f2f" }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: "32px", textAlign: "center" }}>Task not found</div>;

  const confirmedCount = collaborators.filter(c => c.confirmed).length;
  const pendingNames = collaborators.filter(c => !c.confirmed).map(c => c.full_name.split(" ")[0]);

  return (
    <div className="collab-standalone">
      <style>{styles}</style>
      <div className="collab-shell">
        <header className="collab-hero">
          <div className="collab-top">
            <button className="collab-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} /> Back to task details
            </button>
            <span className="collab-live">
              <i /> Shared task workspace
            </span>
          </div>

          <div className="collab-hero-grid">
            <div>
              <span className="collab-eyebrow">
                <UsersRound size={12} /> Collaborative task · {task.tracking_id}
              </span>
              <h1>{task.title}</h1>
              <div className="collab-meta">
                <span>
                  <Clock3 size={13} /> Due checkpoint · {formatDate(task.deadline)}
                </span>
                <span>
                  <FileText size={13} /> {task.doc_type}
                </span>
                <span>
                  <ShieldCheck size={13} /> {task.priority} priority
                </span>
              </div>
            </div>

            <div className="collab-status">
              <small>Shared task status</small>
              <strong>{status}</strong>
              <div className="collab-progress">
                <i style={{ width: `${status === "Submitted" || status === "For Approval" ? 100 : (confirmedCount / collaborators.length) * 100}%` }} />
              </div>
              <em>
                {status === "Submitted" || status === "For Approval"
                  ? "Submitted to Program Chair / Admin"
                  : `${confirmedCount} / ${collaborators.length} confirmed`}
              </em>
            </div>
          </div>
        </header>

        <div className="collab-layout">
          <main className="collab-main">
            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Shared task brief</span>
                  <h2>Everyone works from the same context</h2>
                </div>
                <span className="collab-count">{collaborators.length} collaborators</span>
              </div>
              <div className="collab-brief-grid">
                <div>
                  <small>Document type</small>
                  <strong>{task.doc_type}</strong>
                </div>
                <div>
                  <small>Workflow owner</small>
                  <strong>Program chair</strong>
                </div>
                <div>
                  <small>Category</small>
                  <strong>{task.category || "General"}</strong>
                </div>
                <div>
                  <small>Due checkpoint</small>
                  <strong>{formatDate(task.deadline)}</strong>
                </div>
              </div>
            </section>

            {task?.notes && (
              <section className="collab-card">
                <div className="collab-heading">
                  <div>
                    <span className="collab-kicker">📋 Instructions from the Program Chair / Admin</span>
                    <h2>What the group needs to complete</h2>
                  </div>
                  <span className="collab-badge">Required before submission</span>
                </div>
                <div style={{ padding: "12px", border: "1px solid #e2d6ef", borderRadius: "9px", background: "#fbf8ff" }}>
                  <p style={{ margin: "0", color: "#5d4867", fontSize: "11px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {task.notes}
                  </p>
                </div>
                {attachments.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "8px" }}>
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
              </section>
            )}

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Confirmation gate</span>
                  <h2>Confirm the latest final output</h2>
                </div>
                <span className="collab-badge">
                  {status === "Submitted" || status === "For Approval"
                    ? status
                    : `${confirmedCount}/${collaborators.length} Confirmed`}
                </span>
              </div>
              <p className="collab-muted">
                Every collaborator confirms the current version. Uploading a new version resets this gate and starts confirmation again.
              </p>

              {versions.length > 0 && (
                <div className="collab-version">
                  <span>
                    <FileText size={15} />
                  </span>
                  <div>
                    <strong>v{versions[0].version} · {versions[0].file_name}</strong>
                    <small>{versions[0].uploaded_by} · {formatDate(versions[0].created_at)}</small>
                  </div>
                  <em>{status}</em>
                  <a
                    href={r2ToProxyUrl(api, versions[0].file_url)}
                    download={versions[0].file_name}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: "#eee5fb",
                      color: "#7043b6",
                      textDecoration: "none",
                      fontSize: "8px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <FileImage size={12} /> Open
                  </a>
                </div>
              )}

              <div className="collab-people">
                {collaborators.map((collab) => (
                  <div className="collab-person" key={collab.user_id}>
                    <span className={`collab-avatar ${collab.tone}`}>
                      {initials(collab.full_name)}
                    </span>
                    <span className="collab-person-copy">
                      <strong>{collab.full_name}</strong>
                      <small>{collab.role}</small>
                    </span>
                    <span className={`collab-person-status ${collab.confirmed ? "confirmed" : ""}`}>
                      {collab.confirmed ? (
                        <>
                          <Check size={12} /> Confirmed
                        </>
                      ) : (
                        <>
                          <Clock3 size={12} /> Waiting
                        </>
                      )}
                    </span>
                    {collab.user_id === user.id && (
                      <button
                        className="collab-toggle"
                        onClick={() => toggleConfirmation(collab.user_id)}
                      >
                        {collab.confirmed ? "Withdraw" : "Confirm"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="collab-muted">
                <strong>
                  {status === "Submitted" || status === "For Approval"
                    ? "All collaborators confirmed the latest version."
                    : pendingNames.length
                    ? `${pendingNames.join(" and ")} still need to confirm.`
                    : "Everyone is confirmed."}
                </strong>
              </p>
            </section>

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Final output</span>
                  <h2>Upload a new version</h2>
                </div>
                <span className="collab-count">v{versions.length || 0}</span>
              </div>
              <p className="collab-muted">
                Any collaborator can replace the current output. PATH will create the next version and reset every confirmation.
              </p>

              <input
                ref={finalInputRef}
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
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
                  <strong>
                    {finalFile ? finalFile.name : "Attach a new final output"}
                  </strong>
                  <small>
                    {finalFile
                      ? `${(finalFile.size / 1024 / 1024).toFixed(2)} MB selected`
                      : "PDF, DOCX, XLSX, or CSV"}
                  </small>
                </div>
                <Paperclip size={14} />
              </button>

              <label className="collab-label">
                Version note
                <textarea
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  placeholder="Explain what changed in this version…"
                  rows={2}
                />
              </label>

              {isUploading && (
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  border: "1px solid #e2d6ef",
                  borderRadius: "9px",
                  background: "#fbf8ff"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Uploading {finalFile?.name}...
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#7c3aed" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div style={{
                    height: "6px",
                    borderRadius: "99px",
                    background: "#e9e0ef",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      borderRadius: "inherit",
                      background: "#7c3aed",
                      transition: "width 0.2s ease"
                    }} />
                  </div>
                </div>
              )}

              <button
                className="collab-primary"
                onClick={uploadNewVersion}
                disabled={!finalFile || isUploading}
              >
                <UploadCloud size={14} /> Upload v{(versions.length || 0) + 1} and reset confirmations
              </button>

              {versions.length > 0 && (
                <div className="collab-history">
                  {versions.map((item) => (
                    <div key={`${item.version}-${item.file_name}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span>v{item.version}</span>
                        <div>
                          <strong>{item.file_name}</strong>
                          <small>{item.upload_note || "Version uploaded"}</small>
                        </div>
                        <em>{item.version === versions[0].version ? "Current" : "Previous"}</em>
                      </div>
                      <a
                        href={r2ToProxyUrl(api, item.file_url)}
                        download={item.file_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          background: "#eee5fb",
                          color: "#7043b6",
                          textDecoration: "none",
                          fontSize: "8px",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        <FileImage size={12} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>

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
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id}>
                      {/* Parent comment */}
                      <article className="collab-message">
                        <span className={`collab-avatar ${getTone(message.user_id || message.sender_id || 0)}`}>
                          {initials(message.full_name)}
                        </span>
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
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: "block", maxWidth: "280px" }}
                                    >
                                      <img 
                                        src={file.url}
                                        alt={file.name}
                                        onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        style={{ 
                                          maxWidth: "100%", 
                                          borderRadius: "6px", 
                                          border: "1px solid #e2d9e9", 
                                          cursor: "pointer",
                                          display: imageLoading ? "none" : "block"
                                        }}
                                      />
                                    </a>
                                  </div>
                                ) : (
                                  <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px" }}>📎</span>
                                    <a 
                                      href={file.url}
                                      target="_blank"
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
                        </div>
                      </article>

                      {/* Nested replies - flat display, no additional nesting */}
                      {message.replies && message.replies.length > 0 && (
                        <div style={{ marginLeft: "28px", borderLeft: "2px solid #e9ddfb", paddingTop: "8px" }}>
                          {message.replies.map((reply) => (
                            <div key={reply.id}>
                              <article className="collab-message" style={{ background: "#fcfaff", border: "1px solid #f0ebf3" }}>
                                <span className={`collab-avatar ${getTone(reply.user_id || reply.sender_id || 0)}`}>
                                  {initials(reply.full_name)}
                                </span>
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
                                              href={file.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ display: "block", maxWidth: "280px" }}
                                            >
                                              <img 
                                                src={file.url}
                                                alt={file.name}
                                                onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                                onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                                style={{ 
                                                  maxWidth: "100%", 
                                                  borderRadius: "6px", 
                                                  border: "1px solid #e2d9e9", 
                                                  cursor: "pointer",
                                                  display: imageLoading ? "none" : "block"
                                                }}
                                              />
                                            </a>
                                          </div>
                                        ) : (
                                          <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "12px" }}>📎</span>
                                            <a 
                                              href={file.url}
                                              target="_blank"
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

                              {/* Reply form for nested reply - appears inline, not nested deeper */}
                              {replyTo === reply.id && (
                                <div style={{ marginTop: "12px", padding: "12px", background: "#fbf8ff", borderRadius: "8px" }}>
                                  <div style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                                    ↳ Reply to {reply.full_name.split(" ")[0]}
                                  </div>
                                  <textarea
                                    key={`reply-to-reply-${reply.id}`}
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
                                          const isUploading = progress < 100;
                                          
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
                                                onClick={() => setReplyFiles(prev => prev.filter((_, i) => i !== idx))}
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
                                      accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                                      onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        if (replyFiles.length + files.length > 5) {
                                          setError("Maximum 5 files allowed");
                                          return;
                                        }
                                        setReplyFiles(prev => [...prev, ...files]);
                                        // Initialize progress for new files
                                        files.forEach((_, idx) => {
                                          setReplyFileProgress(prev => ({ ...prev, [replyFiles.length + idx]: 0 }));
                                        });
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
                                        border: "1px solid #ded2e8",
                                        borderRadius: "7px",
                                        background: "#fff",
                                        color: "#76538d",
                                        fontSize: "8px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                      }}
                                    >
                                      <Paperclip size={11} /> Add files ({replyFiles.length}/5)
                                    </button>
                                    <button
                                      className="collab-primary"
                                      onClick={async () => {
                                        if (!replyDraft.trim() && replyFiles.length === 0) return;
                                        try {
                                          setIsReplyUploadingFiles(true);
                                          
                                          if (replyFiles.length > 0) {
                                            const formData = new FormData();
                                            replyFiles.forEach((file) => {
                                              formData.append("files", file);
                                            });
                                            formData.append("content", replyDraft.trim());
                                            formData.append("taskId", taskId);
                                            formData.append("parentCommentId", reply.id);
                                            
                                            const xhr = new XMLHttpRequest();
                                            let lastProgressTime = Date.now();
                                            let progressInterval = null;
                                            
                                            // Simulated progress if real progress doesn't fire
                                            const startTime = Date.now();
                                            const estimateProgress = () => {
                                              const elapsed = Date.now() - startTime;
                                              const estimatedPercent = Math.min(Math.floor((elapsed / 100) * 10), 90);
                                              replyFiles.forEach((_, idx) => {
                                                setReplyFileProgress(prev => {
                                                  const current = prev[idx] ?? 0;
                                                  return { ...prev, [idx]: Math.max(current, estimatedPercent) };
                                                });
                                              });
                                            };
                                            
                                            progressInterval = setInterval(estimateProgress, 50);
                                            
                                            xhr.upload.addEventListener("progress", (event) => {
                                              if (event.lengthComputable && Date.now() - lastProgressTime > 50) {
                                                const percentComplete = Math.round((event.loaded / event.total) * 100);
                                                replyFiles.forEach((_, idx) => {
                                                  setReplyFileProgress(prev => ({ ...prev, [idx]: percentComplete }));
                                                });
                                                lastProgressTime = Date.now();
                                              }
                                            });
                                            
                                            xhr.addEventListener("load", () => {
                                              if (progressInterval) clearInterval(progressInterval);
                                              if (xhr.status === 200 || xhr.status === 201) {
                                                replyFiles.forEach((_, idx) => {
                                                  setReplyFileProgress(prev => ({ ...prev, [idx]: 100 }));
                                                });
                                                setTimeout(() => {
                                                  setReplyDraft("");
                                                  setReplyFiles([]);
                                                  setReplyFileProgress({});
                                                  setReplyTo(null);
                                                  if (replyFilesRef.current) replyFilesRef.current.value = "";
                                                }, 300);
                                              } else {
                                                setError("File upload failed");
                                              }
                                              setIsReplyUploadingFiles(false);
                                            });
                                            
                                            xhr.addEventListener("error", () => {
                                              if (progressInterval) clearInterval(progressInterval);
                                              setError("File upload failed");
                                              setIsReplyUploadingFiles(false);
                                            });
                                            
                                            xhr.addEventListener("abort", () => {
                                              if (progressInterval) clearInterval(progressInterval);
                                              setIsReplyUploadingFiles(false);
                                            });
                                            
                                            xhr.open("POST", `${api}/api/collaborative-tasks/${taskId}/comment`);
                                            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                                            xhr.send(formData);
                                          } else {
                                            const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/comment`, {
                                              method: "POST",
                                              headers: {
                                                Authorization: `Bearer ${token}`,
                                                "Content-Type": "application/json",
                                              },
                                              body: JSON.stringify({ 
                                                content: replyDraft.trim(),
                                                parentCommentId: reply.id
                                              }),
                                            });
                                            
                                            if (response.ok) {
                                              setReplyDraft("");
                                              setReplyTo(null);
                                            }
                                            setIsReplyUploadingFiles(false);
                                          }
                                        } catch (err) {
                                          setError(err.message);
                                          setIsReplyUploadingFiles(false);
                                        }
                                      }}
                                      disabled={(!replyDraft.trim() && replyFiles.length === 0) || isReplyUploadingFiles}
                                      style={{ marginTop: "0" }}
                                    >
                                      <Send size={13} /> Send reply
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyTo(null);
                                        setReplyDraft("");
                                        setReplyFiles([]);
                                        setReplyFileProgress({});
                                      }}
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "6px",
                                        padding: "9px 11px",
                                        border: "1px solid #ded2e8",
                                        borderRadius: "8px",
                                        background: "#fff",
                                        color: "#76538d",
                                        fontSize: "9px",
                                        fontWeight: "800",
                                        cursor: "pointer"
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
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
                        const isUploading = progress < 100;
                        
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
                              onClick={() => setCommentFiles(prev => prev.filter((_, i) => i !== idx))}
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
                      accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (commentFiles.length + files.length > 5) {
                          setError("Maximum 5 files allowed");
                          return;
                        }
                        setCommentFiles(prev => [...prev, ...files]);
                        // Initialize progress for new files
                        files.forEach((_, idx) => {
                          setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: 0 }));
                        });
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
                      disabled={(!messageDraft.trim() && commentFiles.length === 0) || isCommentUploadingFiles}
                    >
                      <Send size={14} /> Send message
                    </button>
                  </span>
                </div>
              </div>
            </section>
          </main>

          <aside className="collab-side">
            {isChair && status === "Submitted" && (
              <section className="collab-side-card collab-review">
                <span className="collab-kicker">Program Chair / Admin review</span>
                <h2>Final output is ready for review</h2>
                <p>All collaborators confirmed the latest version. The task has been automatically submitted for chair review.</p>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add an internal review note…"
                  rows={3}
                />
                <div className="collab-review-actions">
                  <button onClick={() => setStatus("Approved")}>
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => setShowRevision(true)}>
                    <X size={14} /> Request revision
                  </button>
                </div>
              </section>
            )}

            <section className="collab-side-card">
              <span className="collab-kicker">Revision control</span>
              <h2>Need another pass?</h2>
              <p>Request revision with a reason. The shared task returns to In Progress and collaborators can upload a new version.</p>
              <button
                className="collab-primary"
                onClick={() => setShowRevision(true)}
                disabled={status === "Approved"}
              >
                Request revision
              </button>
            </section>
          </aside>
        </div>
      </div>

      {showRevision && (
        <div className="collab-modal-backdrop">
          <div className="collab-modal">
            <button
              className="collab-modal-close"
              onClick={() => setShowRevision(false)}
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <span className="collab-kicker">Revision request</span>
            <h2>What should the group revisit?</h2>
            <p>Give collaborators a clear reason. The task will return to In Progress and reset the confirmation gate.</p>
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g. Update the section entries and upload a corrected final PDF…"
              rows={5}
            />
            <div className="collab-modal-actions">
              <button onClick={() => setShowRevision(false)}>Cancel</button>
              <button onClick={requestRevision} disabled={!revisionReason.trim()}>
                Send request
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
                <span>✦ AI Summary</span>
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
                    onClick={() =>
                      window.open(
                        r2ToProxyUrl(api, preview.file_url || preview.url),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    aria-label="Open file in a new tab"
                  >
                    ↗
                  </button>
                </div>
                <div className="td-reader-paper">
                  {(preview.file_url || preview.url) && /\.pdf($|\?)/i.test(preview.file_url || preview.url) ? (
                    <iframe
                      title={preview.file_name || preview.name}
                      src={pdfReadingUrl(r2ToProxyUrl(api, preview.file_url || preview.url), readerZoom)}
                    />
                  ) : (preview.file_url || preview.url) &&
                    /\.(png|jpe?g|gif|webp)($|\?)/i.test(preview.file_url || preview.url) ? (
                    <img src={r2ToProxyUrl(api, preview.file_url || preview.url)} alt={preview.file_name || preview.name} />
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
    </div>
  );
}

