import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

/*
  Router integration requirement (React Router v6):
  <Route path="/task-details/:id" element={<TaskDetail />} />

  Do not include a space before `:id`; `/task-details/ :id` does not match
  `/task-details/74` and results in a blank route.
*/

const ADMIN_ROLES = ["admin", "program_chair"];

const statusInfo = (status) => {
  const value = String(status || "Awaiting faculty submission").toLowerCase();
  if (/approved|received|completed|done/.test(value)) {
    return {
      label: "Approved",
      tone: "approved",
      note: "Closed successfully",
    };
  }
  if (/returned|revision/.test(value)) {
    return {
      label: "Returned for revision",
      tone: "returned",
      note: "Rework in progress",
    };
  }
  if (/approval|review|pending/.test(value)) {
    return {
      label: "In review",
      tone: "review",
      note: "Decision needed",
    };
  }
  return {
    label: "Awaiting faculty submission",
    tone: "waiting",
    note: "Waiting on evidence",
  };
};

const getUser = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
};

const initials = (value) =>
  String(value || "Faculty")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatSize = (value) => {
  const bytes = Number(value || 0);
  if (!bytes) return "File attached";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatDate = (value) => {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toDatetimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const resolveFileUrl = (api, value) =>
  !value ? "" : /^https?:\/\//i.test(value) ? value : `${api}${value}`;

const pdfReadingUrl = (value, zoom = "page-width") => {
  if (!value) return "";
  const [fileUrl, currentFragment = ""] = value.split("#");
  const params = new URLSearchParams(currentFragment);
  params.set("navpanes", "0");
  params.set("toolbar", "0");
  params.set("zoom", String(zoom));
  return `${fileUrl}#${params.toString()}`;
};

function Icon({ name, size = 15 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    back: (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h11" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 5 3.4 8.5 7 10 3.6-1.5 7-5 7-10V6l-7-3Z" />
        <path d="m9.5 12 1.7 1.7 3.5-3.5" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.6-3.1 2.8-5 6.5-5s5.9 1.9 6.5 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    return: (
      <>
        <path d="M8 7 4 11l4 4" />
        <path d="M4 11h10a5 5 0 0 1 0 10h-2" />
      </>
    ),
    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </>
    ),
    attach: (
      <path d="m16.5 7-7.8 7.8a3.5 3.5 0 1 1-5-5L11.1 2a2.5 2.5 0 0 1 3.5 3.5L7.3 12.8a1.4 1.4 0 0 1-2-2L12 4" />
    ),
    send: (
      <>
        <path d="m21 3-8.4 18-2.1-7.5L3 11.4 21 3Z" />
        <path d="m10.5 13.5 4-4" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </>
    ),
    preview: (
      <>
        <path d="M2.5 12s3.1-5.5 9.5-5.5S21.5 12 21.5 12 18.4 17.5 12 17.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    message: (
      <>
        <path d="M20 15a4 4 0 0 1-4 4H8l-4 3v-7a4 4 0 0 1-1-2.7V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8Z" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
  };
  return <svg {...common}>{paths[name] || paths.file}</svg>;
}

function Meta({ label, icon, children }) {
  return (
    <div className="td-meta">
      <span>
        <Icon name={icon} size={13} /> {label}
      </span>
      <strong>{children}</strong>
    </div>
  );
}

function FileCard({ file, api, onPreview, label = "Attached file" }) {
  if (!file) return null;
  const name =
    file.file_name || file.originalname || file.name || "Attached file";
  const url = resolveFileUrl(api, file.file_url || file.url || file.path);
  return (
    <button
      type="button"
      className="td-file-card"
      onClick={() => onPreview({ name, url, size: file.size, label })}
    >
      <span>
        <Icon name="attach" />
      </span>
      <div>
        <strong>{name}</strong>
        <small>{formatSize(file.size)} · Open inline preview</small>
      </div>
      <Icon name="preview" />
    </button>
  );
}

export default function TaskDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const taskId = params.taskId || params.id || params.task_id;
  const token = localStorage.getItem("token");
  const user = useMemo(() => getUser(token), [token]);
  const isChair = ADMIN_ROLES.includes(user.role);
  const api = import.meta.env.VITE_API_URL || "";
  const [task, setTask] = useState(location.state?.task || null);
  const [loading, setLoading] = useState(!location.state?.task);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);
  const [readerZoom, setReaderZoom] = useState("page-width");
  const [inlineReaderZoom, setInlineReaderZoom] = useState("page-width");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnInstruction, setReturnInstruction] = useState("");
  const [returnError, setReturnError] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [deadlineError, setDeadlineError] = useState("");
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [postingComment, setPostingComment] = useState(false);
  const fileInputRef = useRef(null);
  const submissionPanelRef = useRef(null);

  const loadTask = async () => {
    if (!taskId) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${api}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("The task could not be loaded.");
      const data = await response.json();
      const nextTask = data.task || data;
      setTask(nextTask);
      setComments(nextTask.comments || []);
      setDeadlineDraft(toDatetimeInput(nextTask.deadline || nextTask.due_date));
    } catch (loadError) {
      setError(loadError.message || "The task could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadTask();
    // The current task ID is the source of truth for direct links and refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, token]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const status = statusInfo(task?.status);
  const isFacultyView = !isChair;
  const viewerRoleLabel = isChair ? "Program Chair / Admin" : "Faculty";
  const taskOwner =
    task?.assigned_to_name ||
    task?.assignee_name ||
    task?.assigned_to ||
    "Faculty review group";
  const taskOwnerInitials = initials(taskOwner);
  const taskIdentifier =
    task?.tracking_id ||
    task?.trackingId ||
    (task?.id ? `TASK-${task.id}` : "TASK");
  const taskTitle = task?.title || "Task details";
  const assignedObjective =
    task?.notes ||
    task?.content ||
    task?.objective ||
    task?.objectives ||
    task?.instructions ||
    task?.description ||
    "";
  const taskDescription =
    assignedObjective ||
    "Review the task brief, attach the required evidence, and keep the decision trail with this handoff.";
  const taskInstructions =
    assignedObjective ||
    "Complete the requested work, check source records, and provide a concise submission note for the reviewer.";
  const hasAssignedObjective = Boolean(assignedObjective);
  const submissions =
    task?.submissions || task?.submitted_files || task?.submission_files || [];
  const attachments =
    task?.attachments || task?.task_attachments || task?.files || [];
  const latestSubmission = submissions.length
    ? submissions[submissions.length - 1]
    : null;
  const latestSubmissionName =
    latestSubmission?.file_name || latestSubmission?.name || "Submitted work";
  const latestSubmissionUrl = resolveFileUrl(
    api,
    latestSubmission?.file_url ||
      latestSubmission?.url ||
      latestSubmission?.path ||
      latestSubmission?.file_path,
  );
  const latestSubmissionExtension = latestSubmissionName
    .split(".")
    .pop()
    ?.toLowerCase();
  const isLatestSubmissionImage = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
  ].includes(latestSubmissionExtension || "");
  const isLatestSubmissionPdf = latestSubmissionExtension === "pdf";
  const isLatestSubmissionOffice = [
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ].includes(latestSubmissionExtension || "");
  const latestSubmissionEmbedUrl = isLatestSubmissionPdf
    ? pdfReadingUrl(latestSubmissionUrl)
    : isLatestSubmissionOffice && latestSubmissionUrl
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(latestSubmissionUrl)}`
      : latestSubmissionUrl;
  const hasFacultySubmission = Boolean(latestSubmission);
  const decisionStatus = status; // Always use the actual task status
  const canApprove =
    isChair && hasFacultySubmission && status.tone === "review";
  const canReturn = isChair && hasFacultySubmission && status.tone === "review";

  const updateTask = (patch) =>
    setTask((current) => (current ? { ...current, ...patch } : current));

  const goBack = () => navigate(location.state?.returnTo || "/tasks");

  const postStatus = async (endpoint, body) => {
    const response = await fetch(`${api}/api/tasks/${task.id}${endpoint}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error("The task update could not be saved.");
  };

  const approveTask = async () => {
    if (!canApprove || deciding) return;
    setDeciding(true);
    try {
      await postStatus("/approve");
      updateTask({ status: "Approved" });
      await loadTask();
    } catch (decisionError) {
      setError(decisionError.message || "The approval could not be saved.");
    } finally {
      setDeciding(false);
    }
  };

  const returnTask = async (event) => {
    event.preventDefault();
    if (!canReturn || deciding) return;
    if (returnInstruction.trim().length < 12) {
      setReturnError(
        "Add at least 12 characters of guidance before returning this task.",
      );
      return;
    }
    setDeciding(true);
    setReturnError("");
    try {
      await postStatus("/return", { instruction: returnInstruction.trim() });
      updateTask({
        status: "Returned for revision",
        revision_instruction: returnInstruction.trim(),
      });
      setReturnInstruction("");
      setReturnOpen(false);
      await loadTask();
    } catch (decisionError) {
      setReturnError(
        decisionError.message || "The return instruction could not be saved.",
      );
    } finally {
      setDeciding(false);
    }
  };

  const submitWork = async () => {
    if (!selectedFile) {
      setSubmissionError("Attach the completed file before submitting.");
      return;
    }
    if (!submissionNote.trim()) {
      setSubmissionError("Add a concise submission note before submitting.");
      return;
    }
    setSubmitting(true);
    setSubmissionError("");
    const groupId = `sub_${Date.now()}`;
    try {
      await postStatus("/status", { status: "For Approval" });
      await fetch(`${api}/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Task submitted: ${submissionNote.trim()}`,
        }),
      });
      const data = new FormData();
      data.append("files", selectedFile);
      data.append("submission_group_id", groupId);
      data.append("note", submissionNote.trim());
      const upload = await fetch(`${api}/api/tasks/${task.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!upload.ok)
        throw new Error("The completed file could not be uploaded.");
      setSelectedFile(null);
      setSubmissionNote("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadTask();
    } catch (submitError) {
      setSubmissionError(
        submitError.message || "The submission could not be sent.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const saveDeadline = async () => {
    if (!deadlineDraft) {
      setDeadlineError("Choose a due checkpoint before saving.");
      return;
    }
    setDeadlineSaving(true);
    setDeadlineError("");
    try {
      const response = await fetch(`${api}/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deadline: new Date(deadlineDraft).toISOString(),
        }),
      });
      if (!response.ok)
        throw new Error("The due checkpoint could not be saved.");
      updateTask({ deadline: new Date(deadlineDraft).toISOString() });
      setDeadlineOpen(false);
    } catch (saveError) {
      setDeadlineError(
        saveError.message || "The due checkpoint could not be saved.",
      );
    } finally {
      setDeadlineSaving(false);
    }
  };

  const postComment = async () => {
    const content = comment.trim();
    if (!content || postingComment) return;
    setPostingComment(true);
    try {
      const response = await fetch(`${api}/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error("The note could not be posted.");
      setComments((current) => [
        ...current,
        {
          content,
          sender_name: user.full_name || user.username || "You",
          created_at: new Date().toISOString(),
        },
      ]);
      setComment("");
    } catch (commentError) {
      setError(commentError.message || "The note could not be posted.");
    } finally {
      setPostingComment(false);
    }
  };

  const previewFile = (file) => {
    setReaderZoom("page-width");
    setPreview(file);
  };

  if (loading) {
    return (
      <div className="td-shell">
        <style>{`
          @keyframes td-spin { to { transform: rotate(360deg); } }
          @keyframes td-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
          .td-spinner {
            width: 44px; height: 44px; border-radius: 50%;
            border: 3px solid #ede9fe;
            border-top-color: #7c3aed;
            animation: td-spin 0.8s linear infinite;
          }
          .td-skel {
            background: linear-gradient(90deg, #ede9fe 25%, #f5f3ff 50%, #ede9fe 75%);
            background-size: 200% 100%;
            border-radius: 8px;
            animation: td-pulse 1.4s ease-in-out infinite;
          }
        `}</style>
        <main className="td-main">
          <div className="td-loading" style={{ padding: "20px" }}>
            {/* Header Skeleton */}
            <div style={{
              background: "#7c3aed",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px"
            }}>
              <div className="td-skel" style={{ width: 24, height: 24, borderRadius: "50%" }} />
              <div style={{ flex: 1 }}>
                <div className="td-skel" style={{ height: 14, width: "30%", marginBottom: "8px" }} />
                <div className="td-skel" style={{ height: 20, width: "40%" }} />
              </div>
              <div className="td-skel" style={{ width: 80, height: 32, borderRadius: "8px" }} />
              <div className="td-skel" style={{ width: 80, height: 32, borderRadius: "8px" }} />
            </div>

            {/* Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "16px",
                  border: "1px solid #e5e7eb"
                }}>
                  <div className="td-skel" style={{ height: 16, marginBottom: "12px" }} />
                  <div className="td-skel" style={{ height: 12, width: "80%", marginBottom: "8px" }} />
                  <div className="td-skel" style={{ height: 12, width: "60%" }} />
                </div>
              ))}
            </div>

            {/* Main Content Area */}
            <div style={{
              background: "#fff",
              borderRadius: "8px",
              padding: "20px",
              border: "1px solid #e5e7eb"
            }}>
              <div className="td-skel" style={{ height: 20, width: "25%", marginBottom: "16px" }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} style={{ display: "contents" }}>
                    <div className="td-skel" style={{ height: 12, gridColumn: "span 1" }} />
                    <div className="td-skel" style={{ height: 12, gridColumn: "span 1" }} />
                    <div className="td-skel" style={{ height: 12, gridColumn: "span 1" }} />
                    <div className="td-skel" style={{ height: 12, gridColumn: "span 1" }} />
                    <div className="td-skel" style={{ height: 12, gridColumn: "span 1" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="td-shell">
        <main className="td-main">
          
          <div className="td-loading">
            <strong>Task unavailable</strong>
            <span>{error || "This task could not be found."}</span>
            <button type="button" onClick={goBack}>
              Back to tasks
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="td-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
        .td-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#4a3a55;font-family:'DM Sans',sans-serif}.td-shell *{box-sizing:border-box}.td-main{display:flex;min-width:0;flex:1;flex-direction:column}.td-scroll{flex:1;overflow:auto;padding:28px 40px 44px}@media(min-width:1100px){.td-scroll{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.td-page{max-width:none;margin:0 auto}.td-loading{display:flex;min-height:64vh;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#9083a0;font-size:13px;font-family:'DM Sans',sans-serif}.td-loading strong{color:#3b2a52;font:800 18px Manrope,sans-serif;margin-top:4px}.td-loading>span{color:#a095ab;font-size:12px}.td-loading button{margin-top:8px;border:0;border-radius:8px;padding:9px 16px;background:#7c3aed;color:#fff;font:800 12px 'DM Sans',sans-serif;cursor:pointer}
        .td-hero{position:relative;overflow:hidden;padding:23px 25px 28px;border:1px solid #e3d9ee;border-radius:17px;background:linear-gradient(123deg,#fff,#fcfaff 52%,#efe7ff);box-shadow:0 18px 42px rgba(77,47,112,.06)}.td-hero:after{position:absolute;right:-62px;bottom:-92px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.16),transparent 66%);content:''}.td-hero-top,.td-hero-controls{display:flex;align-items:center}.td-hero-top{position:relative;z-index:1;justify-content:space-between;gap:16px}.td-back{display:inline-flex;align-items:center;gap:7px;border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.td-hero-controls{gap:10px}.td-role-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #e5d9ee;border-radius:8px;padding:7px 9px;background:#fff;color:#725394;font-size:11px;font-weight:800}.td-created{display:flex;align-items:center;gap:5px;color:#9b8da5;font-size:11px;font-weight:700}.td-hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 230px;gap:26px;margin-top:30px}.td-kicker{display:flex;align-items:center;gap:8px;color:#9680a8;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.td-kicker b{border-radius:6px;padding:5px 8px;background:#e9ddff;color:#7041b3;font-size:12px;letter-spacing:.03em}.td-kicker i{width:4px;height:4px;border-radius:50%;background:#a78bfa}.td-hero h1{max-width:690px;margin:10px 0 8px;color:#372541;font:800 34px Manrope,sans-serif;letter-spacing:-.062em;line-height:1.08}.td-hero p{max-width:630px;margin:0;color:#887995;font-size:13px;line-height:1.55}.td-status-card{align-self:end;padding:15px 16px;border:1px solid #e2d6ef;border-radius:12px;background:rgba(255,255,255,.85)}.td-status-card span{display:block;color:#9888a1;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.td-status-card strong{display:block;margin-top:5px;color:#553d66;font:800 13px Manrope,sans-serif;letter-spacing:-.04em}.td-status-card em{display:flex;align-items:center;gap:5px;margin-top:11px;color:#876f99;font-size:11px;font-style:normal;font-weight:700}.td-dot{width:6px;height:6px;border-radius:50%;background:#e1b347}.td-dot.review{background:#7c3aed}.td-dot.approved{background:#51ab83}.td-dot.returned{background:#dc7365}
        .td-layout{display:grid;grid-template-columns:minmax(0,1.48fr) minmax(280px,.56fr);align-items:start;gap:16px;margin-top:16px}.td-main-column{display:flex;flex-direction:column;gap:16px}.td-card,.td-side-card{border:1px solid #e8e1ed;border-radius:14px;background:#fff;box-shadow:0 10px 25px rgba(73,44,105,.035)}.td-card{padding:21px}.td-section-title{display:flex;align-items:center;gap:10px}.td-icon{display:grid;width:29px;height:29px;place-items:center;border-radius:8px;background:#eee7fb;color:#7043bb}.td-section-title>div>span,.td-side-label{display:block;color:#998b9f;font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.td-section-title h2{margin:3px 0 0;color:#4b3858;font:800 16px Manrope,sans-serif;letter-spacing:-.045em}.td-meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 20px;margin-top:21px;padding-top:18px;border-top:1px solid #f0ebf3}.td-meta>span{display:flex;align-items:center;gap:5px;color:#9b8da2;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.td-meta>strong{display:flex;align-items:center;gap:6px;margin-top:8px;color:#56405f;font-size:12px;line-height:1.35}.td-avatar{display:grid;width:20px;height:20px;place-items:center;border-radius:6px;background:#eee7fb;color:#7545bd;font-size:11px}.td-priority{color:#bd6257}.td-deadline-value{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.td-deadline-value button,.td-deadline-actions button{border:1px solid #dccdea;border-radius:5px;padding:4px 6px;background:#faf8fd;color:#7549a3;font-size:10px;font-weight:800;cursor:pointer}.td-deadline-editor{display:grid;gap:6px;margin-top:5px}.td-deadline-editor input{width:100%;padding:7px;border:1px solid #d9cbe6;border-radius:6px;color:#594668;font-size:11px}.td-deadline-actions{display:flex;gap:6px}.td-deadline-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}.td-field-error{margin:0;color:#b55e51;font-size:11px;line-height:1.4}
        .td-copy{padding:17px 0 2px;color:#6a5a73;font-size:12px;line-height:1.65}.td-copy p{margin:0}.td-brief-content{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}.td-copy ol{display:grid;gap:4px;margin:13px 0 0;padding-left:17px}.td-file-card{display:flex;align-items:center;gap:10px;width:100%;margin-top:15px;padding:11px;border:1px solid #e0d5ef;border-radius:10px;background:#fcfaff;color:#633f8b;text-align:left;cursor:pointer}.td-file-card>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#e9ddfb}.td-file-card>div{flex:1;min-width:0}.td-file-card strong,.td-file-card small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-file-card strong{font-size:12px;font-weight:800}.td-file-card small{margin-top:3px;color:#9a88a6;font-size:11px}.td-file-card>svg{color:#7e57b2}
        .td-submission-intro{margin:15px 0 0;color:#8d7e98;font-size:12px;line-height:1.55}.td-return-guidance{margin-top:13px;padding:11px;border:1px solid #edd9bb;border-left:3px solid #c58644;border-radius:8px;background:#fff9ef}.td-return-guidance span{display:block;color:#996d37;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.td-return-guidance p{margin:6px 0 0;color:#70543a;font-size:12px;line-height:1.55}.td-upload-button{display:flex;align-items:center;gap:10px;width:100%;margin-top:14px;padding:11px;border:1px dashed #cdbbe6;border-radius:9px;background:#fcfaff;color:#7044a3;text-align:left;cursor:pointer}.td-upload-button.selected{border-style:solid;border-color:#bee0cf;background:#f5fbf8;color:#478d6c}.td-upload-button>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#ece2fb}.td-upload-button>div{flex:1;min-width:0}.td-upload-button strong,.td-upload-button small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.td-upload-button strong{font-size:12px;font-weight:800}.td-upload-button small{margin-top:3px;color:#9a8ba6;font-size:11px}.td-note-label{display:block;margin-top:12px;color:#806f8b;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.td-note-label textarea,.td-composer textarea,.td-return-form textarea{display:block;width:100%;margin-top:7px;padding:10px;border:1px solid #e2d9e9;border-radius:9px;outline:0;resize:vertical;color:#5d4867;font:10px 'DM Sans',sans-serif;line-height:1.5}.td-submit{display:inline-flex;align-items:center;gap:6px;margin-top:12px;border:0;border-radius:8px;padding:9px 11px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 7px 14px rgba(124,58,237,.16)}.td-submit:disabled{opacity:.55;cursor:not-allowed}
        .td-submitted-intro{margin:13px 0 0;color:#8b7d96;font-size:12px;line-height:1.5}.td-note-block{margin-top:13px;padding:12px;border:1px solid #eadff3;border-left:3px solid #8b5cf6;border-radius:9px;background:#fcfaff}.td-note-block span{display:block;color:#8b759f;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.td-note-block p{margin:7px 0 0;color:#5e496b;font-size:12px;line-height:1.6}.td-file-preview{margin-top:14px;border:1px solid #e2d8ea;border-radius:10px;overflow:hidden;background:#faf8fc}.td-file-preview-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-bottom:1px solid #e7e0ec;background:#fff}.td-file-preview-head>span{display:flex;align-items:center;gap:5px;color:#8a7b94;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.td-file-preview-head div{display:flex;align-items:center;gap:7px;min-width:0}.td-file-preview-head strong{overflow:hidden;color:#594568;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.td-file-preview-head small{color:#9d91a5;font-size:11px;white-space:nowrap}.td-file-preview-frame{display:block;width:100%;height:420px;border:0;background:#f4eefb}.td-file-preview-image{display:block;width:100%;max-height:540px;object-fit:contain;background:#f4eefb}.td-file-preview-fallback{display:flex;min-height:176px;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:22px;background:linear-gradient(135deg,#f4eefb,#fbfaff);color:#84758f;text-align:center}.td-file-preview-fallback strong{color:#60496e;font-size:12px}.td-file-preview-fallback span{max-width:330px;font-size:11px;line-height:1.55}.td-file-preview button{display:block;width:100%;border:0;padding:9px;background:#fff;color:#7650a3;font-size:11px;font-weight:800;cursor:pointer}
        .td-lineage-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.td-lineage-count{padding-top:3px;color:#8c7e98;font-size:11px;font-weight:800}.td-lineage-copy{margin:12px 0 0;color:#8f8199;font-size:12px;line-height:1.5}.td-lineage{position:relative;display:grid;margin-top:16px}.td-lineage:before{position:absolute;top:14px;bottom:14px;left:14px;width:1px;background:#e2d8ea;content:''}.td-lineage-row{position:relative;display:grid;grid-template-columns:29px minmax(0,1fr) max-content;gap:11px;padding:11px 0}.td-lineage-row+.td-lineage-row{border-top:1px solid #f0ebf3}.td-version{position:relative;z-index:1;display:grid;width:29px;height:29px;place-items:center;border:1px solid #d9cdec;border-radius:50%;background:#faf8fc;color:#7650a3;font-size:11px;font-weight:800}.td-version.current{border-color:#9a75d4;background:#f0e7ff;box-shadow:0 0 0 4px #fff}.td-lineage-main h3{display:flex;align-items:center;gap:7px;margin:1px 0 0;color:#55405f;font-size:12px;font-weight:800}.td-badge{padding:3px 5px;border-radius:4px;background:#eee7fb;color:#7044ad;font-size:10px}.td-badge.returned{background:#fff0db;color:#956d22}.td-badge.approved{background:#e7f5ed;color:#4b8f6c}.td-lineage-main p{margin:5px 0 0;color:#8c7e97;font-size:11px;line-height:1.45}.td-lineage-meta{display:flex;align-items:center;gap:5px;margin-top:7px;color:#a093a8;font-size:11px}.td-preview-pill{display:inline-flex;align-items:center;gap:6px;min-height:28px;border:1px solid #ded4e6;border-radius:999px;padding:4px 5px 4px 8px;background:#fff;color:#746082;font-size:11px;cursor:pointer}.td-preview-pill span{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:#f1eafa;color:#7142aa}
        .td-discussion-empty{margin:17px 0 0;color:#9b8fa1;font-size:12px;font-style:italic}.td-comments{display:grid;gap:9px;margin-top:15px}.td-comment{display:flex;gap:8px;padding:10px;border:1px solid #f0ebf3;border-radius:9px;background:#fdfcff}.td-comment>span{display:grid;width:25px;height:25px;place-items:center;border-radius:7px;background:#ebe2fb;color:#7043ba;font-size:11px;font-weight:800}.td-comment div{flex:1}.td-comment strong{color:#5b4766;font-size:12px}.td-comment time{margin-left:7px;color:#a394a8;font-size:11px}.td-comment p{margin:5px 0 0;color:#75657d;font-size:12px;line-height:1.5}.td-composer{position:relative;margin-top:15px;border:1px solid #e4dce9;border-radius:10px;overflow:hidden}.td-composer textarea{margin:0;min-height:75px;padding-bottom:40px;border:0;border-radius:0}.td-composer button{position:absolute;right:7px;bottom:7px;display:inline-flex;align-items:center;gap:5px;border:0;border-radius:7px;padding:7px 9px;background:#7c3aed;color:#fff;font-size:11px;font-weight:800;cursor:pointer}
        .td-side{position:sticky;top:18px;display:flex;flex-direction:column;gap:13px}.td-decision{overflow:hidden;border:1px solid #decff0;border-radius:14px;background:linear-gradient(150deg,#f5efff,#fcfaff 58%,#fff);box-shadow:0 12px 26px rgba(79,44,119,.055)}.td-decision-head{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;border-bottom:1px solid #e6daef}.td-decision-head>span{color:#825c9b;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-state{display:inline-flex;align-items:center;gap:5px;border-radius:6px;padding:5px 7px;background:#f0e6ff;color:#7244ac;font-size:11px;font-weight:800}.td-state.waiting{background:#fff3da;color:#9a7225}.td-state.approved{background:#e7f6ed;color:#478d6c}.td-state.returned{background:#feeae6;color:#b05d51}.td-decision h2{margin:17px 15px 6px;color:#51395d;font:800 17px Manrope,sans-serif;letter-spacing:-.05em;line-height:1.16}.td-decision>p{margin:0 15px 16px;color:#8a7996;font-size:12px;line-height:1.55}.td-action-buttons{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 15px 15px}.td-action-buttons button{display:flex;align-items:center;justify-content:center;gap:6px;min-height:33px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer}.td-approve{border:1px solid #7c3aed;background:#7c3aed;color:#fff}.td-return{border:1px solid #d8c8e8;background:#fff;color:#76538d}.td-action-buttons button:disabled{background:#e7e1ea;border-color:#e7e1ea;color:#a89fad;cursor:not-allowed}.td-return-form{display:grid;gap:8px;margin:0 15px 15px;padding:11px;border:1px solid #ead5c2;border-radius:9px;background:#fffaf3}.td-return-form label{color:#8b693a;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.td-return-form textarea{min-height:76px;margin-top:0;border-color:#e7d8c8;font-size:12px}.td-return-form-actions{display:flex;justify-content:flex-end;gap:7px}.td-return-form-actions button{border-radius:6px;padding:7px 9px;font-size:11px;font-weight:800;cursor:pointer}.td-return-form-actions button:first-child{border:1px solid #e1d5ca;background:#fff;color:#8c7969}.td-return-form-actions button:last-child{border:1px solid #a95d44;background:#a95d44;color:#fff}.td-side-card{padding:15px}.td-readiness{display:grid;gap:8px;margin-top:12px}.td-readiness span{display:flex;align-items:center;gap:6px;color:#7f6f87;font-size:12px;font-weight:700}.td-readiness b{display:grid;width:12px;height:12px;place-items:center;border:1px solid #d7cddb;border-radius:50%;font-size:11px}.td-readiness span.complete{color:#549073}.td-readiness span.complete b{border-color:transparent;background:#e7f6ed;color:#4b8f6c}.td-side-card p{margin:9px 0 0;color:#93859d;font-size:12px;line-height:1.55}
        .td-modal{position:fixed;z-index:80;display:grid;place-items:center;inset:0;padding:20px;background:rgba(48,31,65,.4);backdrop-filter:blur(4px)}.td-dialog{width:min(780px,100%);max-height:calc(100vh - 40px);overflow:auto;border:1px solid #e4d9ec;border-radius:14px;background:#fff;box-shadow:0 25px 70px rgba(57,34,80,.28)}.td-dialog-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #eee7f2}.td-dialog-head div{min-width:0}.td-dialog-head span{display:block;color:#8e8099;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.td-dialog-head strong{display:block;overflow:hidden;margin-top:4px;color:#4f3c5d;font-size:13px;text-overflow:ellipsis;white-space:nowrap}.td-dialog-head button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e3d9e9;border-radius:7px;background:#fff;color:#715585;cursor:pointer}.td-dialog-meta{padding:8px 16px;border-bottom:1px solid #eee7f2;color:#9a8ea4;font-size:11px}.td-preview-content{min-height:345px;padding:20px;background:linear-gradient(135deg,#f3eef9,#fbfaff)}.td-preview-content iframe,.td-preview-content img{display:block;width:100%;min-height:390px;border:1px solid #e5dfeb;background:#fff;object-fit:contain}.td-paper{max-width:550px;min-height:320px;margin:0 auto;padding:25px;border:1px solid #ebe4ef;background:#fff;box-shadow:0 10px 20px rgba(78,49,104,.09)}.td-paper-head{display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:2px solid #8b5cf6;color:#9a8da4;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.td-paper h3{margin:18px 0 5px;color:#463451;font:800 22px Manrope,sans-serif;letter-spacing:-.05em}.td-paper p{margin:0;color:#9a8ea2;font-size:12px}.td-lines{display:grid;gap:8px;margin-top:22px}.td-lines i{display:block;height:7px;border-radius:4px;background:#e6e0eb}.td-lines i:nth-child(2){width:78%}.td-lines i:nth-child(3){width:89%}.td-lines i:nth-child(4){width:62%}.td-paper-note{margin-top:20px;padding:10px;border-left:2px solid #a78bfa;background:#f8f4ff;color:#76538f;font-size:11px;line-height:1.5}
        @media(max-width:1050px){.td-scroll{padding:24px}.td-layout{grid-template-columns:1fr}.td-side{position:static;display:grid;grid-template-columns:1.35fr .65fr .65fr}.td-decision{grid-row:span 2}}@media(max-width:720px){.td-scroll{padding:18px 14px 34px}.td-hero{padding:19px}.td-hero-top{align-items:flex-start;flex-direction:column}.td-hero-controls{align-items:flex-start;flex-direction:column}.td-hero-grid{grid-template-columns:1fr;margin-top:22px}.td-hero h1{font-size:28px}.td-card{padding:17px}.td-meta-grid{grid-template-columns:1fr 1fr}.td-side{display:flex}.td-decision{grid-row:auto}.td-action-buttons{grid-template-columns:1fr}.td-lineage-row{grid-template-columns:28px minmax(0,1fr)}.td-lineage-row>button{grid-column:2;justify-self:start}.td-file-preview-head{align-items:flex-start;flex-direction:column}.td-file-preview-head div{width:100%;justify-content:space-between}}@media(max-width:480px){.td-meta-grid{grid-template-columns:1fr}.td-dialog{max-height:calc(100vh - 24px)}.td-modal{padding:12px}.td-preview-content{padding:13px}.td-preview-content iframe,.td-preview-content img{min-height:250px}}
      `}</style>
      <style>{`.td-file-preview-frame{height:min(78vh,760px);min-height:620px;background:#f7f4fb}.td-preview-content iframe{width:min(100%,760px);min-height:640px;margin:0 auto;background:#fff}@media(max-width:720px){.td-file-preview-frame{height:68vh;min-height:460px}.td-preview-content iframe{min-height:520px}}`}</style>
      <style>{`.td-no-submission{display:flex;align-items:flex-start;gap:8px;margin:0 15px 15px;padding:10px;border:1px solid #e5d8ee;border-left:3px solid #a78bfa;border-radius:8px;background:#fbf9ff;color:#735989}.td-no-submission svg{flex:none;margin-top:1px}.td-no-submission strong{display:block;color:#614677;font-size:12px}.td-no-submission p{margin:4px 0 0;color:#8d7b99;font-size:11px;line-height:1.5}`}</style>
      <style>{`.td-reader{width:min(1120px,calc(100vw - 48px));max-height:calc(100vh - 36px);overflow:auto;border:1px solid #e1d8ea;border-radius:13px;background:#fff;box-shadow:0 28px 80px rgba(45,27,64,.32)}.td-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid #eee7f2}.td-reader-eyebrow{display:flex;align-items:center;gap:6px;color:#9c8da7;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-reader-eyebrow i{width:5px;height:5px;border-radius:50%;background:#a78bfa}.td-reader-head h2{margin:7px 0 0;color:#4b3757;font:800 18px Manrope,sans-serif;letter-spacing:-.04em}.td-reader-head p{margin:5px 0 0;color:#907f9a;font-size:11px}.td-reader-head-actions{display:flex;align-items:center;gap:11px;padding-top:4px}.td-reader-head-actions span{color:#8058a5;font-size:11px;font-weight:800}.td-reader-head-actions button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e2d9e8;border-radius:7px;background:#fff;color:#76568d;font-size:17px;cursor:pointer}.td-reader-stage{padding:18px;background:linear-gradient(135deg,#f2edf8,#faf9fd)}.td-reader-frame{width:min(680px,100%);margin:0 auto;border:1px solid #ded6e4;border-radius:8px;overflow:hidden;background:#27272a;box-shadow:0 16px 30px rgba(49,35,62,.22)}.td-reader-toolbar{display:flex;align-items:center;gap:9px;min-height:43px;padding:0 12px;background:#303035;color:#f7f4fb}.td-reader-toolbar b{display:grid;min-width:18px;height:20px;place-items:center;border-radius:3px;background:#171719;color:#fff;font-size:12px}.td-reader-toolbar span{font-size:12px;font-weight:800}.td-reader-toolbar button{display:grid;width:21px;height:21px;place-items:center;border:0;border-radius:3px;background:transparent;color:#f5f3f7;font-size:16px;cursor:pointer}.td-reader-toolbar button:hover{background:rgba(255,255,255,.12)}.td-reader-toolbar .td-reader-toolbar-spacer{flex:1}.td-reader-paper{display:flex;min-height:clamp(440px,67vh,720px);align-items:stretch;justify-content:center;background:#f7f7f7}.td-reader-paper iframe{width:100%;min-height:clamp(440px,67vh,720px);border:0;background:#fff}.td-reader-paper img{display:block;max-width:100%;max-height:clamp(440px,67vh,720px);object-fit:contain;background:#fff}.td-reader-fallback{display:flex;min-height:440px;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:24px;color:#806e89;text-align:center}.td-reader-fallback strong{color:#60496d;font-size:13px}.td-reader-fallback span{max-width:300px;font-size:12px;line-height:1.55}@media(max-width:720px){.td-reader{width:calc(100vw - 20px);max-height:calc(100vh - 20px)}.td-reader-head{padding:13px}.td-reader-head h2{font-size:16px}.td-reader-head-actions span{display:none}.td-reader-stage{padding:11px}.td-reader-toolbar{gap:5px;padding:0 8px}.td-reader-paper,.td-reader-paper iframe{min-height:58vh}.td-reader-paper img{max-height:58vh}}`}</style>
      <style>{`.td-inline-reader{margin-top:14px;border:1px solid #e2d8ea;border-radius:11px;overflow:hidden;background:#faf8fc}.td-inline-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid #e9e2ee;background:#fff}.td-inline-reader-head strong,.td-inline-reader-head small{display:block}.td-inline-reader-head strong{margin-top:6px;color:#564060;font:800 12px Manrope,sans-serif}.td-inline-reader-head small{margin-top:4px;color:#9b8d9f;font-size:11px}.td-inline-reader-head>div:last-child{display:flex;align-items:center;gap:8px;padding-top:3px}.td-inline-reader-head>div:last-child span{color:#8058a5;font-size:11px;font-weight:800}.td-inline-reader-head>div:last-child button{border:1px solid #ded4e7;border-radius:6px;padding:5px 7px;background:#fff;color:#735393;font-size:11px;font-weight:800;cursor:pointer}.td-inline-reader-frame{width:min(410px,calc(100% - 32px));margin:18px auto}.td-inline-reader .td-reader-paper,.td-inline-reader .td-reader-paper iframe{min-height:620px}@media(max-width:720px){.td-inline-reader-head{align-items:flex-start;flex-direction:column}.td-inline-reader-head>div:last-child span{display:none}.td-inline-reader-frame{width:calc(100% - 20px);margin:11px auto}.td-inline-reader .td-reader-paper,.td-inline-reader .td-reader-paper iframe{min-height:56vh}}`}</style>

      <main className="td-main">
        
        <div className="td-scroll">
          <div className="td-page">
            <header className="td-hero">
              <div className="td-hero-top">
                <button className="td-back" type="button" onClick={goBack}>
                  <Icon name="back" /> Back to task desk
                </button>
                <div className="td-hero-controls">
                  <span className="td-role-pill">
                    <Icon name={isChair ? "shield" : "user"} size={13} />
                    {viewerRoleLabel}
                  </span>
                  <span className="td-created">
                    <Icon name="clock" size={13} />{" "}
                    {formatDate(task.created_at || task.createdAt)}
                  </span>
                </div>
              </div>
              <div className="td-hero-grid">
                <div>
                  <div className="td-kicker">
                    <b>{taskIdentifier}</b>
                    <i /> Active handoff
                  </div>
                  <h1>{taskTitle}</h1>
                  {!hasAssignedObjective && <p>{taskDescription}</p>}
                </div>
                <div className="td-status-card">
                  <span>Current position</span>
                  <strong>{decisionStatus.label}</strong>
                  <em>
                    <i className={`td-dot ${decisionStatus.tone}`} />{" "}
                    {decisionStatus.note}
                  </em>
                </div>
              </div>
            </header>

            {error && (
              <p
                className="td-field-error"
                role="alert"
                style={{ margin: "12px 2px" }}
              >
                {error}
              </p>
            )}

            <div className="td-layout">
              <main className="td-main-column">
                <section className="td-card">
                  <div className="td-section-title">
                    <span className="td-icon">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <span>Decision brief</span>
                      <h2>What this handoff needs</h2>
                    </div>
                  </div>
                  <div className="td-meta-grid">
                    <Meta label="Assigned to" icon="user">
                      <span className="td-avatar">{taskOwnerInitials}</span>
                      {taskOwner}
                    </Meta>
                    <Meta label="Document type" icon="file">
                      {task.doc_type || task.document_type || "Document record"}
                    </Meta>
                    <Meta label="Due checkpoint" icon="calendar">
                      {isFacultyView ? (
                        formatDate(task.deadline || task.due_date)
                      ) : deadlineOpen ? (
                        <span className="td-deadline-editor">
                          <input
                            type="datetime-local"
                            value={deadlineDraft}
                            onChange={(event) => {
                              setDeadlineDraft(event.target.value);
                              setDeadlineError("");
                            }}
                          />
                          <span className="td-deadline-actions">
                            <button
                              type="button"
                              onClick={() => setDeadlineOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveDeadline}
                              disabled={deadlineSaving}
                            >
                              {deadlineSaving ? "Saving…" : "Save"}
                            </button>
                          </span>
                          {deadlineError && (
                            <p className="td-field-error">{deadlineError}</p>
                          )}
                        </span>
                      ) : (
                        <span className="td-deadline-value">
                          {formatDate(task.deadline || task.due_date)}
                          <button
                            type="button"
                            onClick={() => {
                              setDeadlineDraft(
                                toDatetimeInput(task.deadline || task.due_date),
                              );
                              setDeadlineOpen(true);
                            }}
                          >
                            Edit
                          </button>
                        </span>
                      )}
                    </Meta>
                    <Meta label="Priority" icon="clock">
                      <span className="td-priority">
                        {task.priority || "Standard"}
                      </span>
                    </Meta>
                    <Meta label="Workflow owner" icon="shield">
                      {task.assigned_by_name ||
                        task.created_by_name ||
                        "Program Chair"}
                    </Meta>
                    <Meta label="Category" icon="file">
                      {task.category || task.doc_type || "Academic operations"}
                    </Meta>
                  </div>
                </section>

                <section className="td-card">
                  <div className="td-section-title">
                    <span className="td-icon">
                      <Icon name="file" />
                    </span>
                    <div>
                      <span>
                        {hasAssignedObjective
                          ? "Chair/Admin task brief"
                          : "Instructions"}
                      </span>
                      <h2>
                        {hasAssignedObjective
                          ? "Content and objectives"
                          : "Complete the record with confidence"}
                      </h2>
                    </div>
                  </div>
                  <div className="td-copy">
                    <div className="td-brief-content">{taskInstructions}</div>
                    {!hasAssignedObjective && (
                      <ol>
                        <li>
                          {hasAssignedObjective
                            ? "Follow the content and objective set by the Program Chair/Admin above."
                            : "Review the task brief and any linked source record."}
                        </li>
                        <li>
                          Confirm the required information before sending a
                          response.
                        </li>
                        <li>
                          Use the submission note to identify exceptions or
                          final checks.
                        </li>
                      </ol>
                    )}
                  </div>
                  {attachments.length > 0 ? (
                    attachments.map((file, index) => (
                      <FileCard
                        file={file}
                        api={api}
                        onPreview={previewFile}
                        label="Task instruction attachment"
                        key={file.id || file.file_url || file.name || index}
                      />
                    ))
                  ) : (
                    <div className="td-file-card" style={{ cursor: "default" }}>
                      <span>
                        <Icon name="file" />
                      </span>
                      <div>
                        <strong>No instruction attachment</strong>
                        <small>
                          The instructions above are the active task brief.
                        </small>
                      </div>
                    </div>
                  )}
                </section>

                {isFacultyView && (
                  <section className="td-card" ref={submissionPanelRef}>
                    <div className="td-section-title">
                      <span className="td-icon">
                        <Icon name="send" />
                      </span>
                      <div>
                        <span>Faculty submission</span>
                        <h2>
                          {status.tone === "returned"
                            ? "Resubmit revised work"
                            : "Submit your completed work"}
                        </h2>
                      </div>
                    </div>
                    <p className="td-submission-intro">
                      {status.tone === "returned"
                        ? "Your previous version was returned for revision. Attach a corrected file and add a new note explaining what changed."
                        : "Attach the completed file and leave a concise note that helps the chair make a decision."}
                    </p>
                    {(task.revision_instruction ||
                      task.return_instruction ||
                      task.return_reason) && (
                      <div className="td-return-guidance">
                        <span>Chair’s revision instructions</span>
                        <p>
                          {task.revision_instruction ||
                            task.return_instruction ||
                            task.return_reason}
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      hidden
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                      onChange={(event) => {
                        setSelectedFile(event.target.files?.[0] || null);
                        setSubmissionError("");
                      }}
                    />
                    <button
                      className={`td-upload-button ${selectedFile ? "selected" : ""}`}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>
                        <Icon name="attach" />
                      </span>
                      <div>
                        <strong>
                          {selectedFile
                            ? selectedFile.name
                            : "Attach completed file"}
                        </strong>
                        <small>
                          {selectedFile
                            ? formatSize(selectedFile.size)
                            : "PDF, DOCX, XLSX, or CSV"}
                        </small>
                      </div>
                      <Icon name="preview" />
                    </button>
                    <label className="td-note-label">
                      Submission note
                      <textarea
                        value={submissionNote}
                        onChange={(event) => {
                          setSubmissionNote(event.target.value);
                          setSubmissionError("");
                        }}
                        rows={3}
                        placeholder="Summarize what was completed or flag any exception for review…"
                      />
                    </label>
                    {submissionError && (
                      <p
                        className="td-field-error"
                        role="alert"
                        style={{ marginTop: 8 }}
                      >
                        {submissionError}
                      </p>
                    )}
                    <button
                      className="td-submit"
                      type="button"
                      disabled={submitting}
                      onClick={submitWork}
                    >
                      <Icon name="send" size={14} />{" "}
                      {submitting
                        ? "Sending…"
                        : status.tone === "returned"
                          ? "Resubmit for chair review"
                          : "Submit for chair review"}
                    </button>
                  </section>
                )}

                {latestSubmission && (
                  <section className="td-card">
                    <div className="td-section-title">
                      <span className="td-icon">
                        <Icon name="check" />
                      </span>
                      <div>
                        <span>
                          {isFacultyView
                            ? "Your submission"
                            : "Faculty submission"}
                        </span>
                        <h2>Submitted work</h2>
                      </div>
                    </div>
                    <p className="td-submitted-intro">
                      The latest submission is retained with its note and file
                      metadata for the next workflow decision.
                    </p>
                    {(latestSubmission.note ||
                      latestSubmission.submission_note) && (
                      <div className="td-note-block">
                        <span>Submission note</span>
                        <p>
                          {latestSubmission.note ||
                            latestSubmission.submission_note}
                        </p>
                      </div>
                    )}
                    <div className="td-inline-reader">
                      <header className="td-inline-reader-head">
                        <div>
                          <span className="td-reader-eyebrow">
                            <i /> Inline preview
                          </span>
                          <strong>{latestSubmissionName}</strong>
                          <small>
                            {formatSize(latestSubmission.size)} · Submitted
                            document
                          </small>
                        </div>
                        <div>
                          <span>✦ AI Summary</span>
                          <span>▢ PDF</span>
                          <button
                            type="button"
                            onClick={() =>
                              previewFile({
                                name: latestSubmissionName,
                                url: latestSubmissionUrl,
                                size: latestSubmission.size,
                                label: "Latest submission",
                              })
                            }
                          >
                            Expand
                          </button>
                        </div>
                      </header>
                      <div className="td-reader-frame td-inline-reader-frame">
                        <div className="td-reader-toolbar">
                          <button type="button" aria-label="Reader menu">
                            ☰
                          </button>
                          <b>1</b>
                          <span>/ 1</span>
                          <button
                            type="button"
                            onClick={() =>
                              setInlineReaderZoom((value) =>
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
                              setInlineReaderZoom((value) =>
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
                            {typeof inlineReaderZoom === "number"
                              ? `${inlineReaderZoom}%`
                              : "Fit width"}
                          </span>
                          <span className="td-reader-toolbar-spacer" />
                          <button
                            type="button"
                            disabled={!latestSubmissionUrl}
                            onClick={() =>
                              window.open(
                                latestSubmissionUrl,
                                "_blank",
                                "noopener,noreferrer",
                              )
                            }
                            aria-label="Open submitted file in a new tab"
                          >
                            ↗
                          </button>
                        </div>
                        <div className="td-reader-paper">
                          {latestSubmissionUrl && isLatestSubmissionImage ? (
                            <img
                              src={latestSubmissionUrl}
                              alt={`Preview of ${latestSubmissionName}`}
                            />
                          ) : latestSubmissionUrl && isLatestSubmissionPdf ? (
                            <iframe
                              title={`Inline preview of ${latestSubmissionName}`}
                              src={pdfReadingUrl(
                                latestSubmissionUrl,
                                inlineReaderZoom,
                              )}
                            />
                          ) : latestSubmissionUrl &&
                            isLatestSubmissionOffice ? (
                            <iframe
                              title={`Inline preview of ${latestSubmissionName}`}
                              src={latestSubmissionEmbedUrl}
                            />
                          ) : (
                            <div className="td-reader-fallback">
                              <Icon name="file" size={28} />
                              <strong>
                                {latestSubmissionUrl
                                  ? "Preview available in a new tab"
                                  : "The uploaded file link is unavailable"}
                              </strong>
                              <span>
                                {latestSubmissionUrl
                                  ? "Use the open control to view the uploaded file."
                                  : "Refresh the task or ask the faculty member to upload the file again."}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {submissions.length > 0 && (
                  <section className="td-card">
                    <div className="td-lineage-top">
                      <div className="td-section-title">
                        <span className="td-icon">
                          <Icon name="file" />
                        </span>
                        <div>
                          <span>Document lineage</span>
                          <h2>Version history</h2>
                        </div>
                      </div>
                      <span className="td-lineage-count">
                        {submissions.length}{" "}
                        {submissions.length === 1 ? "version" : "versions"}
                      </span>
                    </div>
                    <p className="td-lineage-copy">
                      Every submission and revision stays traceable within the
                      task record before a final decision is made.
                    </p>
                    <div className="td-lineage">
                      {[...submissions].reverse().map((file, reverseIndex) => {
                        const actualIndex = submissions.length - reverseIndex;
                        const fileStatus = statusInfo(
                          file.status || task.status,
                        );
                        const name =
                          file.file_name ||
                          file.name ||
                          `Version ${actualIndex}`;
                        return (
                          <article
                            className="td-lineage-row"
                            key={file.id || `${name}-${actualIndex}`}
                          >
                            <span
                              className={`td-version ${reverseIndex === 0 ? "current" : ""}`}
                            >
                              v{actualIndex}
                            </span>
                            <div className="td-lineage-main">
                              <h3>
                                {reverseIndex === 0
                                  ? "Current submission"
                                  : "Prior submission"}
                                <span className={`td-badge ${fileStatus.tone}`}>
                                  {fileStatus.label}
                                </span>
                              </h3>
                              <p>
                                {file.note ||
                                  file.submission_note ||
                                  "No submission note recorded."}
                              </p>
                              <div className="td-lineage-meta">
                                <span>{name}</span>
                                <i>•</i>
                                <span>{formatSize(file.size)}</span>
                                {reverseIndex === 0 && (
                                  <>
                                    <i>•</i>
                                    <b>Latest</b>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              className="td-preview-pill"
                              type="button"
                              onClick={() =>
                                previewFile({
                                  name,
                                  url: resolveFileUrl(
                                    api,
                                    file.file_url || file.url,
                                  ),
                                  size: file.size,
                                  label: `Version ${actualIndex}`,
                                })
                              }
                            >
                              <time>
                                {formatDate(
                                  file.submitted_at || file.created_at,
                                )}
                              </time>
                              <span>
                                <Icon name="preview" size={12} />
                              </span>
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                )}

                <section className="td-card">
                  <div className="td-section-title">
                    <span className="td-icon">
                      <Icon name="message" />
                    </span>
                    <div>
                      <span>Discussion</span>
                      <h2>Keep decisions in the handoff</h2>
                    </div>
                  </div>
                  {comments.length ? (
                    <div className="td-comments">
                      {comments.map((item, index) => (
                        <article
                          className="td-comment"
                          key={item.id || `${item.created_at}-${index}`}
                        >
                          <span>
                            {initials(
                              item.sender_name ||
                                item.author_name ||
                                item.author,
                            )}
                          </span>
                          <div>
                            <strong>
                              {item.sender_name ||
                                item.author_name ||
                                item.author ||
                                "Workflow member"}
                            </strong>
                            <time>
                              {formatDate(item.created_at || item.createdAt)}
                            </time>
                            <p>{item.content || item.body}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="td-discussion-empty">
                      There are no discussion notes yet. Add guidance that
                      should remain with the task record.
                    </p>
                  )}
                  <div className="td-composer">
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      rows={3}
                      placeholder="Write a note for this handoff…"
                    />
                    <button
                      type="button"
                      disabled={!comment.trim() || postingComment}
                      onClick={postComment}
                    >
                      <Icon name="send" size={13} />{" "}
                      {postingComment ? "Posting…" : "Post note"}
                    </button>
                  </div>
                </section>
              </main>

              <aside className="td-side">
                <section className="td-decision">
                  <div className="td-decision-head">
                    <span>Decision station</span>
                    <div className={`td-state ${decisionStatus.tone}`}>
                      <Icon name="shield" size={13} /> {decisionStatus.label}
                    </div>
                  </div>
                  <h2>Move the handoff forward deliberately.</h2>
                  <p>
                    {isFacultyView
                      ? "Prepare the required file and note, then send the completed work for review."
                      : !hasFacultySubmission
                        ? "Faculty has not submitted a completed file and note yet. Approval and return actions remain locked until evidence is received."
                        : status.tone === "review"
                          ? "Review the evidence and record an approval or a clear revision instruction."
                          : "Decision controls unlock when the faculty submission is ready for review."}
                  </p>
                  <div className="td-action-buttons">
                    {isFacultyView ? (
                      <>
                        <button
                          className="td-approve"
                          type="button"
                          onClick={() =>
                            submissionPanelRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            })
                          }
                        >
                          <Icon name="send" size={14} /> Prepare submission
                        </button>
                        <button
                          className="td-return"
                          type="button"
                          onClick={goBack}
                        >
                          Save for later
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="td-approve"
                          type="button"
                          disabled={!canApprove || deciding}
                          title={
                            !canApprove
                              ? "Faculty submission is required before approval."
                              : undefined
                          }
                          onClick={approveTask}
                        >
                          <Icon name="check" size={14} />{" "}
                          {deciding ? "Saving…" : "Approve task"}
                        </button>
                        <button
                          className="td-return"
                          type="button"
                          disabled={!canReturn || deciding}
                          title={
                            !canReturn
                              ? "Faculty submission is required before a revision request."
                              : undefined
                          }
                          onClick={() => {
                            setReturnOpen(true);
                            setReturnError("");
                          }}
                        >
                          <Icon name="return" size={14} /> Return for revision
                        </button>
                      </>
                    )}
                  </div>
                  {!isFacultyView && !hasFacultySubmission && (
                    <div className="td-no-submission">
                      <Icon name="shield" size={15} />
                      <div>
                        <strong>Faculty submission required</strong>
                        <p>
                          Faculty has not submitted a completed file and note
                          yet. Approval and return actions will unlock after the
                          submission enters review.
                        </p>
                      </div>
                    </div>
                  )}
                  {!isFacultyView && returnOpen && (
                    <form className="td-return-form" onSubmit={returnTask}>
                      <label htmlFor="td-return-instruction">
                        Instructions for faculty
                      </label>
                      <textarea
                        id="td-return-instruction"
                        value={returnInstruction}
                        onChange={(event) => {
                          setReturnInstruction(event.target.value);
                          setReturnError("");
                        }}
                        placeholder="Explain what needs to be corrected before the next submission…"
                        autoFocus
                      />
                      {returnError && (
                        <p className="td-field-error">{returnError}</p>
                      )}
                      <div className="td-return-form-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setReturnOpen(false);
                            setReturnError("");
                          }}
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={deciding}>
                          Send instruction
                        </button>
                      </div>
                    </form>
                  )}
                </section>
                <section className="td-side-card">
                  <span className="td-side-label">Submission readiness</span>
                  <div className="td-readiness">
                    <span className="complete">
                      <b>✓</b> Brief shared
                    </span>
                    <span
                      className={
                        task.deadline || task.due_date ? "complete" : ""
                      }
                    >
                      <b>{task.deadline || task.due_date ? "✓" : ""}</b>{" "}
                      Deadline{" "}
                      {task.deadline || task.due_date ? "mapped" : "needed"}
                    </span>
                    <span
                      className={
                        latestSubmission || selectedFile ? "complete" : ""
                      }
                    >
                      <b>{latestSubmission || selectedFile ? "✓" : ""}</b>{" "}
                      Completed file{" "}
                      {latestSubmission
                        ? "submitted"
                        : selectedFile
                          ? "attached"
                          : "needed"}
                    </span>
                    <span
                      className={
                        latestSubmission?.note || submissionNote.trim()
                          ? "complete"
                          : ""
                      }
                    >
                      <b>
                        {latestSubmission?.note || submissionNote.trim()
                          ? "✓"
                          : ""}
                      </b>{" "}
                      Submission note{" "}
                      {latestSubmission?.note || submissionNote.trim()
                        ? "added"
                        : "needed"}
                    </span>
                  </div>
                </section>
                <section className="td-side-card">
                  <span className="td-side-label">Record integrity</span>
                  <p>
                    PATH retains task status, discussions, decisions, and linked
                    evidence in this handoff record.
                  </p>
                </section>
              </aside>
            </div>
          </div>
        </div>
      </main>
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
                <h2 id="td-preview-title">{preview.name}</h2>
                <p>{preview.name}</p>
              </div>
              <div className="td-reader-head-actions">
                <span>✦ AI Summary</span>
                <span>▢ PDF</span>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Close inline document preview"
                >
                  <Icon name="close" />
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
                    disabled={!preview.url}
                    onClick={() =>
                      window.open(preview.url, "_blank", "noopener,noreferrer")
                    }
                    aria-label="Open file in a new tab"
                  >
                    ↗
                  </button>
                </div>
                <div className="td-reader-paper">
                  {preview.url && /\.pdf($|\?)/i.test(preview.url) ? (
                    <iframe
                      title={preview.name}
                      src={pdfReadingUrl(preview.url, readerZoom)}
                    />
                  ) : preview.url &&
                    /\.(png|jpe?g|gif|webp)($|\?)/i.test(preview.url) ? (
                    <img src={preview.url} alt={preview.name} />
                  ) : (
                    <div className="td-reader-fallback">
                      <Icon name="file" size={28} />
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