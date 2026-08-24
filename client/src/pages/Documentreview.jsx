import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

const Icon = {
  Back: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      width="13"
      height="13"
    >
      <path
        d="M10.5 3 5.5 8l5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  File: ({ size = 18 }) => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width={size}
      height={size}
    >
      <path d="M4 1.5h5L12.5 5v9.5H4z" strokeLinejoin="round" />
      <path d="M9 1.5V5h3.5M6 8h4M6 10.5h4" strokeLinecap="round" />
    </svg>
  ),
  Book: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width="14"
      height="14"
    >
      <path
        d="M2.5 3.1c1.9-.5 3.7-.1 5.5 1.1v9.1c-1.8-1.2-3.6-1.6-5.5-1.1zM13.5 3.1c-1.9-.5-3.7-.1-5.5 1.1v9.1c1.8-1.2 3.6-1.6 5.5-1.1z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Check: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      width="13"
      height="13"
    >
      <path
        d="m3 8 3.1 3.1L13 4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Return: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      width="13"
      height="13"
    >
      <path
        d="M12.5 4.5H6.8a3.5 3.5 0 0 0 0 7h1.7M6 9.8l-2.8 1.7L6 13.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Reject: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      width="13"
      height="13"
    >
      <path d="m5 5 6 6m0-6-6 6" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width="14"
      height="14"
    >
      <path d="M8 1.5 2.5 4v3.7c0 3.2 2.3 5.8 5.5 6.8 3.2-1 5.5-3.6 5.5-6.8V4z" />
      <path
        d="m5.7 8 1.5 1.5 3.2-3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  ZoomIn: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width="13"
      height="13"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.3 10.3 14 14M7 4.7v4.6M4.7 7h4.6" strokeLinecap="round" />
    </svg>
  ),
  ZoomOut: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width="13"
      height="13"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.3 10.3 14 14M4.7 7h4.6" strokeLinecap="round" />
    </svg>
  ),
  Expand: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      width="13"
      height="13"
    >
      <path
        d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Send: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="13"
      height="13"
    >
      <path
        d="m14 2-5.8 12-1.6-5.1L2 7.2zM6.6 8.9 10 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const resolveUrl = (api, value) =>
  !value ? "" : /^https?:\/\//i.test(value) ? value : `${api}${value}`;
const nameOf = (value, fallback = "—") =>
  typeof value === "string"
    ? value
    : value?.full_name || value?.name || value?.username || fallback;
const dateLabel = (value, fallback = "—") =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : fallback;
const initials = (value) =>
  nameOf(value, "PATH")
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function StatusPill({ status }) {
  const normalized = String(status || "In review").toLowerCase();
  const tone =
    normalized.includes("approved") || normalized.includes("received")
      ? "approved"
      : normalized.includes("return") || normalized.includes("reject")
        ? "returned"
        : normalized.includes("review")
          ? "review"
          : "pending";
  return (
    <span className={`document-status-pill ${tone}`}>
      <i />
      {status || "In review"}
    </span>
  );
}

export default function DocumentDetails({
  documentId: documentIdProp,
  onBack,
}) {
  const { id: routeId } = useParams();
  const id = documentIdProp || routeId;
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");
  const user = useMemo(() => {
    try {
      return JSON.parse(atob(token?.split(".")[1] || ""));
    } catch {
      return {};
    }
  }, [token]);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(100);
  const [inlineOpen, setInlineOpen] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [actioning, setActioning] = useState("");
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [resubmissionNote, setResubmissionNote] = useState("");
  const [resubmissionFiles, setResubmissionFiles] = useState([]);
  const [resubmitting, setResubmitting] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  const loadRecord = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("Document unavailable");
      const payload = await response.json();
      setRecord(payload.document || payload.data || payload);
    } catch (err) {
      setError(err.message || "Unable to load this document.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    loadRecord();
  }, [id]);

  const updateStatus = async (status) => {
    setActioning(status);
    try {
      const response = await fetch(`${API}/api/documents/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) setRecord((current) => ({ ...current, status }));
    } finally {
      setActioning("");
    }
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    const content = comment.trim();
    setComment("");
    setPosting(true);
    const optimistic = {
      content,
      sender_name: user.full_name || user.username || "You",
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setRecord((current) => ({
      ...current,
      comments: [...(current?.comments || []), optimistic],
    }));
    try {
      const response = await fetch(`${API}/api/documents/${id}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      if (response.ok) await loadRecord();
    } finally {
      setPosting(false);
    }
  };

  const requestSummary = async () => {
    setSummarizing(true);
    try {
      const response = await fetch(`${API}/api/documents/${id}/summary`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Summary unavailable");
      const payload = await response.json();
      setSummary(
        payload.summary ||
          payload.data?.summary ||
          "No summary was returned for this document.",
      );
    } catch (err) {
      setSummary(
        "An AI summary is not available for this document yet. Upload a readable file or try again after the document text has been processed.",
      );
    } finally {
      setSummarizing(false);
    }
  };

  const resubmitDocument = async () => {
    if (!resubmissionNote.trim() && !resubmissionFiles.length) return;
    setResubmitting(true);
    try {
      const formData = new FormData();
      formData.append("note", resubmissionNote.trim());
      resubmissionFiles.forEach((file) => formData.append("files", file));
      const response = await fetch(`${API}/api/documents/${id}/resubmit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Unable to resubmit");
      const payload = await response.json();
      setRecord(
        payload.document || payload.data || { ...record, status: "Submitted" },
      );
      setResubmissionNote("");
      setResubmissionFiles([]);
    } catch (err) {
      setError("The resubmission could not be completed. Please try again.");
    } finally {
      setResubmitting(false);
    }
  };

  const fileList =
    record?.files ||
    record?.attachments ||
    (record?.file_url
      ? [{ url: record.file_url, name: record.file_name || record.title }]
      : []);
  const primaryFile = fileList[0];
  const fileUrl = resolveUrl(
    API,
    primaryFile?.url || primaryFile?.file_url || primaryFile?.path,
  );
  const fileName =
    primaryFile?.name ||
    primaryFile?.file_name ||
    record?.file_name ||
    "Document file";
  const extension = fileName.split(".").pop()?.toLowerCase();
  const isPdf =
    extension === "pdf" || /pdf/i.test(primaryFile?.mime_type || "");
  const comments = record?.comments || [];
  const stage = String(record?.status || "In review").toLowerCase();
  const currentStep = stage.includes("approved")
    ? 3
    : stage.includes("review")
      ? 2
      : 1;
  const owner = nameOf(
    record?.current_owner || record?.assigned_to || record?.handler,
    nameOf(
      record?.assigned_to_name || record?.current_handler,
      "Sarah Bennett",
    ),
  );
  const submitter = nameOf(
    record?.submitted_by || record?.submitter,
    record?.submitted_by_name || "Faculty submitter",
  );
  const title = record?.title || record?.document_type || "Document details";
  const documentId = record?.tracking_id || record?.document_id || `DOC-${id}`;
  const due = record?.review_due || record?.deadline || record?.due_date;
  const isReturned = ["returned", "rejected", "revision"].some((value) =>
    stage.includes(value),
  );
  const returnReason =
    record?.return_reason ||
    record?.revision_reason ||
    record?.rejection_reason ||
    record?.revision_note;
  const versions = record?.versions ||
    record?.version_history ||
    record?.submission_versions || [
      {
        id: "current",
        version: record?.version || 1,
        created_at: record?.updated_at || record?.created_at,
        label: "Current submission",
        is_current: true,
      },
    ];
  const auditTrail =
    record?.audit_trail || record?.audit || record?.history || [];
  const activeVersion =
    selectedVersion ||
    versions.find((version) => version.is_current) ||
    versions[0];
  const comparison =
    record?.version_comparisons?.find(
      (item) =>
        String(item.version_id || item.version) ===
        String(activeVersion?.id || activeVersion?.version),
    ) ||
    record?.comparison ||
    null;
  const visibleAudit = auditTrail.length
    ? auditTrail
    : [
        {
          id: "submitted",
          action: "Document submitted",
          user: submitter,
          timestamp: record?.submitted_at || record?.created_at,
          detail: "Initial document record created.",
        },
        {
          id: "review",
          action: record?.status || "Review in progress",
          user: owner,
          timestamp: record?.updated_at,
          detail: "Current workflow handoff.",
        },
      ];

  return (
    <div className="document-details-shell">
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');
      .document-ai-summary{margin-top:16px;padding:19px}.document-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.document-section-head h2{margin:6px 0 0;color:#46384f;font-family:'Manrope',sans-serif;font-size:18px;letter-spacing:-.045em}.document-section-head button{display:inline-flex;align-items:center;gap:5px;min-height:29px;border:1px solid #e3d7f3;border-radius:7px;padding:0 9px;background:#fbf9ff;color:#7244c1;font-size:8px;font-weight:800;cursor:pointer}.document-ai-summary p{margin:14px 0 0;color:#82768c;font-size:10px;line-height:1.65}.document-summary-placeholder{display:flex;align-items:center;gap:9px;margin-top:14px;padding:12px;border:1px dashed #ddd2ef;border-radius:8px;background:#fbf9ff;color:#94889d;font-size:9px;line-height:1.5}.document-summary-placeholder i{display:grid;flex:0 0 auto;width:25px;height:25px;place-items:center;border-radius:7px;background:#eee7fd;color:#7543c7}.document-return-panel{margin-top:16px;padding:19px;border-color:#f0ddd5;background:#fffdfb}.document-return-panel .document-section-head h2{color:#7d5046}.document-return-reason{margin-top:14px;padding:11px;border-left:2px solid #d98a71;border-radius:0 7px 7px 0;background:#fff5f1;color:#876358;font-size:9px;line-height:1.55}.document-resubmit-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.document-resubmit-grid textarea{min-height:76px;resize:vertical;border:1px solid #eadfd9;border-radius:8px;padding:10px;color:#5e4f59;font-family:'DM Sans',sans-serif;font-size:9px;outline:0}.document-upload-slot{display:flex;align-items:center;justify-content:center;min-height:76px;border:1px dashed #d9c8ef;border-radius:8px;background:#fbf9ff;color:#7950bf;font-size:9px;font-weight:800;cursor:pointer;text-align:center}.document-upload-slot input{display:none}.document-upload-name{margin-top:7px;color:#988b9d;font-size:8px}.document-resubmit-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}.document-resubmit-actions span{color:#a195a4;font-size:8px}.document-resubmit-actions button{min-height:31px;border:0;border-radius:7px;padding:0 11px;background:#7c3aed;color:#fff;font-size:9px;font-weight:800;cursor:pointer}.document-workflow-grid{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:16px;margin-top:16px}.document-history,.document-audit{padding:19px}.document-version-list{display:flex;flex-direction:column;gap:8px;margin-top:15px}.document-version-item{display:flex;align-items:center;justify-content:space-between;gap:9px;width:100%;border:1px solid #ece5f1;border-radius:8px;padding:10px;background:#fff;color:#6c5e75;text-align:left;cursor:pointer}.document-version-item.active{border-color:#bda2ec;background:#fbf9ff;box-shadow:0 0 0 3px #f4effe}.document-version-item strong{display:block;color:#5c4d66;font-size:9px}.document-version-item span{display:block;margin-top:3px;color:#9e92a2;font-size:8px}.document-version-badge{border-radius:5px;padding:3px 5px;background:#eee7fd;color:#7244c1;font-size:7px;font-weight:800}.document-compare{margin-top:14px;border:1px solid #e6dcef;border-radius:8px;overflow:hidden}.document-compare-head{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;background:#fbf9ff;color:#695b73;font-size:9px;font-weight:800}.document-compare-lines{padding:11px}.document-compare-line{display:flex;gap:7px;margin-top:7px;color:#877b91;font-size:8px;line-height:1.45}.document-compare-line:first-child{margin-top:0}.document-compare-line i{width:5px;height:5px;flex:0 0 auto;margin-top:3px;border-radius:50%;background:#8b5cf6}.document-compare-empty{padding:12px;color:#9d92a1;font-size:8px;line-height:1.5}.document-audit-list{position:relative;margin-top:15px;padding-left:19px}.document-audit-list:before{position:absolute;left:4px;top:5px;bottom:5px;width:1px;background:#e3d8eb;content:''}.document-audit-item{position:relative;margin-top:14px}.document-audit-item:first-child{margin-top:0}.document-audit-item:before{position:absolute;left:-18px;top:3px;width:8px;height:8px;border:2px solid #f8f7ff;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 1px #cbb8ec;content:''}.document-audit-item strong{display:block;color:#67596f;font-size:9px}.document-audit-item span{display:block;margin-top:3px;color:#a196a4;font-size:8px}.document-audit-item p{margin:5px 0 0;color:#877b91;font-size:8px;line-height:1.45}.document-review-guide{margin-top:16px;padding:19px}.document-guide-list{display:flex;flex-direction:column;gap:10px;margin-top:15px}.document-guide-list div{display:flex;align-items:flex-start;gap:8px;color:#84778d;font-size:9px;line-height:1.45}.document-guide-list i{display:grid;flex:0 0 auto;width:19px;height:19px;place-items:center;border-radius:6px;background:#eee7fd;color:#7543c7;font-size:8px;font-style:normal;font-weight:800}@media(max-width:720px){.document-workflow-grid{grid-template-columns:1fr}.document-resubmit-grid{grid-template-columns:1fr}.document-resubmit-actions{align-items:flex-start;flex-direction:column}}
      *{box-sizing:border-box}.document-details-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#42354b;font-family:'DM Sans',sans-serif}.document-details-main{flex:1;min-width:0;background:#f8f7ff}.document-details-page{max-width:1340px;margin:0 auto;padding:34px 28px 48px}.document-back{display:inline-flex;align-items:center;gap:6px;border:0;padding:0;background:none;color:#7142c4;font-size:10px;font-weight:800;cursor:pointer}.document-back span{color:#aaa0ae;font-weight:500}.document-hero{display:flex;align-items:center;justify-content:space-between;gap:22px;margin-top:22px;padding:0 14px 20px;border-bottom:1px solid #e8e1ee}.document-identity{display:flex;align-items:center;gap:14px;min-width:0}.document-file-icon{display:grid;flex:0 0 auto;width:46px;height:46px;place-items:center;border:1px solid #ded1f4;border-radius:12px;background:#eee7fd;color:#7544c5}.document-kicker{display:flex;gap:10px;color:#9c90a5;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.document-identity h1{margin:6px 0 4px;color:#302638;font-family:'Manrope',sans-serif;font-size:clamp(26px,3.1vw,38px);letter-spacing:-.055em;line-height:1}.document-identity p{margin:0;color:#958a9b;font-size:9px}.document-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.document-button{display:inline-flex;min-height:33px;align-items:center;justify-content:center;gap:6px;border:1px solid #e6dfee;border-radius:7px;padding:0 11px;background:#fff;color:#756a7e;font-size:9px;font-weight:800;cursor:pointer}.document-button.reject{color:#ad695f;border-color:#f1dedb}.document-button.return{color:#a87b35;border-color:#eee0b9;background:#fffdf7}.document-button.approve{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 7px 15px rgba(124,58,237,.24)}.document-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #e8e1ee;border-top:0;background:#fff}.document-meta div{min-width:0;padding:14px 16px;border-right:1px solid #eee9f1}.document-meta div:last-child{border-right:0}.document-meta span{display:block;color:#aaa0ae;font-size:8px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.document-meta strong{display:block;overflow:hidden;margin-top:6px;color:#5b4d64;font-family:'Manrope',sans-serif;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.document-meta-owner{display:flex;align-items:center;gap:6px}.document-meta-avatar{display:grid;width:18px;height:18px;place-items:center;border-radius:6px;background:#eee7fd;color:#7244c1;font-size:7px;font-weight:800}.document-layout{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(280px,.78fr);gap:16px;margin-top:16px}.document-card{border:1px solid #e5deed;border-radius:11px;background:#fff;box-shadow:0 10px 26px rgba(57,36,93,.04)}.document-status{padding:19px 20px}.card-eyebrow{display:flex;align-items:center;gap:7px;color:#9c91a4;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.card-eyebrow i{width:6px;height:6px;border-radius:50%;background:#b99eea}.document-status-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:7px}.document-status h2,.document-sla h2,.document-owners h2,.document-preview h2,.document-comments h2{margin:0;color:#46384f;font-family:'Manrope',sans-serif;font-size:18px;letter-spacing:-.045em}.document-status-pill{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:4px 7px;background:#f0e9fc;color:#7543c7;font-size:8px;font-weight:800}.document-status-pill i{width:5px;height:5px;border-radius:50%;background:currentColor}.document-status-pill.approved{background:#e8f5ee;color:#478c6e}.document-status-pill.returned{background:#fff0eb;color:#b86f5c}.document-status-pill.pending{background:#fff5df;color:#aa7928}.document-timeline{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:10px;margin:30px 16px 26px}.timeline-step{display:flex;align-items:center;flex-direction:column;gap:6px;color:#a69bab;font-size:8px;text-align:center}.timeline-step b{display:grid;width:27px;height:27px;place-items:center;border:1px solid #e6e0ec;border-radius:50%;background:#fff;color:#9c91a4;font-size:8px}.timeline-step.active{color:#7543c7;font-weight:800}.timeline-step.active b{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 0 0 5px #f0e9fc}.timeline-step.complete b{border-color:#9b78e3;background:#f3ecff;color:#7543c7}.timeline-line{height:1px;background:#e8e2ed}.timeline-line.complete{background:#b692ed}.document-review-callout{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px;border:1px solid #e4daf4;border-radius:8px;background:#fbf9ff}.document-review-callout>div{display:flex;gap:9px;align-items:flex-start}.document-review-icon{display:grid;flex:0 0 auto;width:27px;height:27px;place-items:center;border-radius:8px;background:#eee7fd;color:#7543c7}.document-review-callout strong{display:block;color:#65576e;font-size:9px}.document-review-callout p{margin:3px 0 0;color:#9b90a1;font-size:8px}.document-review-callout button{border:0;background:none;color:#7042c3;font-size:8px;font-weight:800;cursor:pointer}.document-sla,.document-owners{padding:19px}.document-sla-top{display:flex;align-items:flex-start;justify-content:space-between}.document-live{color:#579176;font-size:8px;font-weight:800}.document-sla h3{margin:24px 0 4px;color:#4c3f55;font-family:'Manrope',sans-serif;font-size:20px;letter-spacing:-.05em}.document-sla p{margin:0;color:#aa7b2e;font-size:9px;font-weight:700}.document-progress{height:7px;margin-top:19px;overflow:hidden;border-radius:99px;background:#eee8f4}.document-progress i{display:block;width:72%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c3a8f7,#7c3aed)}.document-progress-meta{display:flex;justify-content:space-between;margin-top:6px;color:#a59aa9;font-size:8px}.document-sla-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:22px;padding-top:15px;border-top:1px solid #f0edf4}.document-sla-grid span{display:block;color:#aaa0ae;font-size:8px}.document-sla-grid strong{display:block;margin-top:4px;color:#61546a;font-family:'Manrope',sans-serif;font-size:9px}.document-owners{margin-top:16px}.owner-line{position:relative;display:flex;gap:10px;margin-top:15px}.owner-line:not(:last-child):after{position:absolute;left:11px;top:25px;bottom:-15px;width:1px;background:#e5ddeb;content:''}.owner-avatar{display:grid;flex:0 0 auto;width:23px;height:23px;place-items:center;border-radius:7px;background:#eee7fd;color:#7244c1;font-size:7px;font-weight:800}.owner-line:nth-child(4) .owner-avatar{background:#edf2f8;color:#6f849d}.owner-copy strong{display:block;color:#65576e;font-size:9px}.owner-copy span{display:block;margin-top:2px;color:#a69bab;font-size:8px}.document-preview{margin-top:16px;overflow:hidden}.document-preview-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:18px 20px;border-bottom:1px solid #f0edf4}.document-preview-head p{margin:4px 0 0;color:#a299a8;font-size:8px}.document-preview-actions{display:flex;align-items:center;gap:7px}.document-preview-actions button{display:inline-flex;align-items:center;gap:5px;min-height:28px;border:1px solid #e5dced;border-radius:7px;padding:0 8px;background:#fff;color:#7a4bc2;font-size:8px;font-weight:800;cursor:pointer}.document-preview-controls{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid #f0edf4;color:#9b91a1;font-size:8px}.document-preview-controls div{display:flex;align-items:center;gap:6px}.document-preview-controls button{display:grid;width:25px;height:25px;place-items:center;border:1px solid #e7e0ed;border-radius:6px;background:#fff;color:#7650c2;cursor:pointer}.document-canvas{min-height:380px;padding:28px;background:#f5f2f8}.document-paper{min-height:325px;max-width:620px;margin:0 auto;padding:38px 46px;background:#fff;box-shadow:0 8px 20px rgba(45,29,66,.1);transform-origin:top center}.document-paper-kicker{display:flex;justify-content:space-between;border-bottom:1px solid #dbc8f8;padding-bottom:12px;color:#9387a0;font-size:7px;letter-spacing:.08em}.document-paper h3{margin:28px 0 5px;color:#3f3248;font-family:'Manrope',sans-serif;font-size:22px;letter-spacing:-.055em}.document-paper p{margin:0;color:#9e93a3;font-size:8px}.document-paper-line{height:7px;margin-top:15px;border-radius:5px;background:#ede8f3}.document-paper-line.wide{width:74%}.document-paper-line.mid{width:51%}.document-paper-note{margin-top:27px;padding:12px;border-left:2px solid #a882ec;background:#faf8fe;color:#82758e;font-size:8px;line-height:1.55}.document-file-frame{min-height:380px;background:#f5f2f8}.document-file-frame iframe{width:100%;min-height:520px;border:0;background:#fff}.document-comments{margin-top:16px;padding:19px}.document-comments-head{display:flex;align-items:center;justify-content:space-between}.document-comment-count{display:grid;min-width:18px;height:18px;place-items:center;border-radius:5px;background:#f0e9fc;color:#7543c7;font-size:8px;font-weight:800}.document-comment{display:flex;gap:9px;margin-top:15px}.comment-avatar{display:grid;flex:0 0 auto;width:25px;height:25px;place-items:center;border-radius:7px;background:#eee7fd;color:#7244c1;font-size:7px;font-weight:800}.comment-copy strong{display:block;color:#65576e;font-size:9px}.comment-copy span{margin-left:5px;color:#aaa0ae;font-size:8px;font-weight:500}.comment-copy p{margin:4px 0 0;color:#80758a;font-size:9px;line-height:1.55}.comment-compose{display:flex;align-items:flex-end;gap:8px;margin-top:17px}.comment-compose textarea{min-height:56px;flex:1;resize:vertical;border:1px solid #e5deed;border-radius:8px;padding:10px;color:#5b4e64;font-family:'DM Sans',sans-serif;font-size:9px;outline:0}.comment-compose textarea:focus{border-color:#bda1ec}.comment-compose button{display:grid;width:33px;height:33px;place-items:center;border:0;border-radius:8px;background:#7c3aed;color:#fff;cursor:pointer}.document-empty{display:grid;min-height:60vh;place-items:center;padding:40px;color:#a198a7;font-size:13px}.document-error{display:flex;flex-direction:column;align-items:center;gap:9px}.document-error button{border:0;border-radius:7px;padding:9px 12px;background:#7c3aed;color:#fff;font-size:10px;font-weight:800;cursor:pointer}@media(max-width:1060px){.document-layout{grid-template-columns:1fr}.document-side{display:grid;grid-template-columns:1fr 1fr;gap:16px}.document-owners{margin-top:0}}@media(max-width:720px){.document-details-page{padding:22px 14px 34px}.document-hero{align-items:flex-start;flex-direction:column}.document-actions{justify-content:flex-start}.document-meta{grid-template-columns:1fr 1fr}.document-meta div:nth-child(2){border-right:0}.document-meta div:nth-child(-n+2){border-bottom:1px solid #eee9f1}.document-side{grid-template-columns:1fr}.document-identity h1{font-size:28px}.document-timeline{margin-left:0;margin-right:0;gap:5px}.timeline-step{font-size:7px}.document-paper{padding:28px 25px}.document-preview-head{align-items:flex-start;flex-direction:column}.document-canvas{padding:16px}.document-file-frame iframe{min-height:390px}}
    `}</style>
      <Sidebar activePage="tasks" />
      <main className="document-details-main">
        <TopBar
          onLogout={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        />
        {loading ? (
          <div className="document-empty">Loading document details…</div>
        ) : error ? (
          <div className="document-empty">
            <div className="document-error">
              <Icon.File size={34} />
              <strong>{error}</strong>
              <button onClick={loadRecord}>Try again</button>
            </div>
          </div>
        ) : (
          <div className="document-details-page">
            <button
              className="document-back"
              type="button"
              onClick={() => (onBack ? onBack() : navigate("/tasks"))}
            >
              <Icon.Back /> Back to priority queue{" "}
              <span>/ Document details</span>
            </button>
            <section className="document-hero">
              <div className="document-identity">
                <span className="document-file-icon">
                  <Icon.File size={22} />
                </span>
                <div>
                  <div className="document-kicker">
                    ◆ Document record <span>{documentId}</span>
                  </div>
                  <h1>{title}</h1>
                  <p>
                    {record?.document_type ||
                      record?.category ||
                      "Program review"}{" "}
                    &nbsp;·&nbsp; Submitted by {submitter}
                  </p>
                </div>
              </div>
              <div className="document-actions">
                <button
                  className="document-button"
                  type="button"
                  onClick={() => setInlineOpen((value) => !value)}
                >
                  <Icon.Book /> {inlineOpen ? "Hide inline" : "Read inline"}
                </button>
                <button
                  className="document-button reject"
                  type="button"
                  disabled={!!actioning}
                  onClick={() => updateStatus("Rejected")}
                >
                  <Icon.Reject /> Reject
                </button>
                <button
                  className="document-button return"
                  type="button"
                  disabled={!!actioning}
                  onClick={() => updateStatus("Returned for revision")}
                >
                  <Icon.Return /> Return for revision
                </button>
                <button
                  className="document-button approve"
                  type="button"
                  disabled={!!actioning}
                  onClick={() => updateStatus("Approved")}
                >
                  <Icon.Check />{" "}
                  {actioning === "Approved" ? "Approving…" : "Approve"}
                </button>
              </div>
            </section>
            <section className="document-meta">
              <div>
                <span>Current owner</span>
                <strong className="document-meta-owner">
                  <i className="document-meta-avatar">{initials(owner)}</i>
                  {owner}
                </strong>
              </div>
              <div>
                <span>Priority</span>
                <strong>{record?.priority || "Standard"}</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>
                  {dateLabel(record?.submitted_at || record?.created_at)}
                </strong>
              </div>
              <div>
                <span>Last updated</span>
                <strong>{dateLabel(record?.updated_at, "Just now")}</strong>
              </div>
            </section>
            <section className="document-layout">
              <div>
                <article className="document-card document-status">
                  <div className="card-eyebrow">
                    <i /> Live status <span>● updated just now</span>
                  </div>
                  <div className="document-status-head">
                    <h2>{record?.status || "In review"}</h2>
                    <StatusPill status={record?.status} />
                  </div>
                  <div className="document-timeline">
                    <div
                      className={`timeline-step ${currentStep >= 1 ? "complete" : ""}`}
                    >
                      <b>{currentStep > 1 ? <Icon.Check /> : "01"}</b>
                      <span>Submitted</span>
                    </div>
                    <i
                      className={`timeline-line ${currentStep > 1 ? "complete" : ""}`}
                    />
                    <div
                      className={`timeline-step ${currentStep === 2 ? "active" : currentStep > 2 ? "complete" : ""}`}
                    >
                      <b>{currentStep > 2 ? <Icon.Check /> : "02"}</b>
                      <span>In review</span>
                    </div>
                    <i
                      className={`timeline-line ${currentStep > 2 ? "complete" : ""}`}
                    />
                    <div
                      className={`timeline-step ${currentStep === 3 ? "active" : ""}`}
                    >
                      <b>03</b>
                      <span>Approval</span>
                    </div>
                  </div>
                  <div className="document-review-callout">
                    <div>
                      <span className="document-review-icon">
                        <Icon.Shield />
                      </span>
                      <span>
                        <strong>
                          {currentStep === 2
                            ? "Review is with you"
                            : "Workflow update"}
                        </strong>
                        <p>
                          Keep this document moving before the next SLA
                          threshold.
                        </p>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        document
                          .querySelector(".document-preview")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Review now ↗
                    </button>
                  </div>
                </article>
                {inlineOpen && (
                  <article className="document-card document-preview">
                    <div className="document-preview-head">
                      <div>
                        <div className="card-eyebrow">
                          <i /> Inline preview
                        </div>
                        <h2>{title}</h2>
                        <p>
                          {fileName}
                          {primaryFile?.size
                            ? ` · ${Math.round(primaryFile.size / 1024)} KB`
                            : ""}
                        </p>
                      </div>
                      <div className="document-preview-actions">
                        <button type="button" onClick={() => setZoom(100)}>
                          <Icon.Shield /> AI Summary
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            primaryFile && window.open(fileUrl, "_blank")
                          }
                        >
                          Open file
                        </button>
                      </div>
                    </div>
                    <div className="document-preview-controls">
                      <span>Page 1 of {record?.page_count || "—"}</span>
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((value) => Math.max(70, value - 10))
                          }
                        >
                          <Icon.ZoomOut />
                        </button>
                        <strong>{zoom}%</strong>
                        <button
                          type="button"
                          onClick={() =>
                            setZoom((value) => Math.min(140, value + 10))
                          }
                        >
                          <Icon.ZoomIn />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            primaryFile && window.open(fileUrl, "_blank")
                          }
                        >
                          <Icon.Expand />
                        </button>
                      </div>
                    </div>
                    {fileUrl && isPdf ? (
                      <div className="document-file-frame">
                        <iframe
                          title={`Preview of ${title}`}
                          src={`${fileUrl}#toolbar=0`}
                        />
                      </div>
                    ) : (
                      <div className="document-canvas">
                        <div
                          className="document-paper"
                          style={{
                            transform: `scale(${zoom / 100})`,
                            marginBottom: `${Math.max(0, (zoom - 100) * 2)}px`,
                          }}
                        >
                          <div className="document-paper-kicker">
                            <span>DEPARTMENT OF COMPUTER SCIENCE</span>
                            <span>
                              {new Date().getFullYear()}–
                              {new Date().getFullYear() + 1}
                            </span>
                          </div>
                          <h3>{title}</h3>
                          <p>{record?.document_type || "Academic document"}</p>
                          <div className="document-paper-line wide" />
                          <div className="document-paper-line mid" />
                          <div className="document-paper-note">
                            <strong>Executive overview</strong>
                            <br />
                            {record?.notes ||
                              "Supporting documentation and review context are recorded in the document workflow."}
                          </div>
                        </div>
                      </div>
                    )}
                  </article>
                )}
                <article className="document-card document-ai-summary">
                  <div className="document-section-head">
                    <div>
                      <div className="card-eyebrow">
                        <i /> Document intelligence
                      </div>
                      <h2>AI summary</h2>
                    </div>
                    <button
                      type="button"
                      disabled={summarizing}
                      onClick={requestSummary}
                    >
                      <Icon.Shield />{" "}
                      {summarizing ? "Summarizing…" : "Generate summary"}
                    </button>
                  </div>
                  {summary ? (
                    <p>{summary}</p>
                  ) : (
                    <div className="document-summary-placeholder">
                      <i>
                        <Icon.Shield />
                      </i>
                      <span>
                        Generate a concise review brief from the current
                        document file. The result is shown here and never
                        replaces the original record.
                      </span>
                    </div>
                  )}
                </article>

                {isReturned && (
                  <article className="document-card document-return-panel">
                    <div className="document-section-head">
                      <div>
                        <div className="card-eyebrow">
                          <i /> Submitter workspace
                        </div>
                        <h2>Return for revision</h2>
                      </div>
                      <StatusPill status={record?.status} />
                    </div>
                    <div className="document-return-reason">
                      <strong>Reviewer direction</strong>
                      <br />
                      {returnReason ||
                        "Review the highlighted feedback, update the document, and submit a new version when it is ready."}
                    </div>
                    <div className="document-resubmit-grid">
                      <textarea
                        value={resubmissionNote}
                        onChange={(event) =>
                          setResubmissionNote(event.target.value)
                        }
                        placeholder="Explain what changed in this revision…"
                      />
                      <label className="document-upload-slot">
                        <input
                          type="file"
                          multiple
                          onChange={(event) =>
                            setResubmissionFiles(
                              Array.from(event.target.files || []),
                            )
                          }
                        />
                        <span>
                          Choose revised files
                          <br />
                          or drop them here
                        </span>
                      </label>
                    </div>
                    {resubmissionFiles.length > 0 && (
                      <div className="document-upload-name">
                        {resubmissionFiles.map((file) => file.name).join(", ")}
                      </div>
                    )}
                    <div className="document-resubmit-actions">
                      <span>
                        Your original document remains in version history after
                        resubmission.
                      </span>
                      <button
                        type="button"
                        disabled={
                          resubmitting ||
                          (!resubmissionNote.trim() &&
                            !resubmissionFiles.length)
                        }
                        onClick={resubmitDocument}
                      >
                        {resubmitting
                          ? "Submitting…"
                          : "Submit revised version"}
                      </button>
                    </div>
                  </article>
                )}

                <article className="document-card document-comments">
                  <div className="document-comments-head">
                    <div>
                      <div className="card-eyebrow">
                        <i /> Review discussion
                      </div>
                      <h2>Reviewer comments</h2>
                    </div>
                    <span className="document-comment-count">
                      {comments.length}
                    </span>
                  </div>
                  {comments.length ? (
                    comments.map((item, index) => (
                      <div className="document-comment" key={item.id || index}>
                        <span className="comment-avatar">
                          {initials(item.sender_name || item.user)}
                        </span>
                        <div className="comment-copy">
                          <strong>
                            {nameOf(item.sender_name || item.user, "Reviewer")}
                            <span>
                              {dateLabel(item.created_at, "Just now")}
                            </span>
                          </strong>
                          <p>{item.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#a69bab", fontSize: 9, marginTop: 16 }}>
                      No comments yet. Add a note for the review team.
                    </p>
                  )}
                  <div className="comment-compose">
                    <textarea
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Add a note for the review team…"
                    />
                    <button
                      type="button"
                      disabled={posting}
                      onClick={postComment}
                      aria-label="Post comment"
                    >
                      <Icon.Send />
                    </button>
                  </div>
                </article>

                <section className="document-workflow-grid">
                  <article className="document-card document-history">
                    <div className="document-section-head">
                      <div>
                        <div className="card-eyebrow">
                          <i /> Submission history
                        </div>
                        <h2>Version history</h2>
                      </div>
                      <span className="document-version-badge">
                        {versions.length} version
                        {versions.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="document-version-list">
                      {versions.map((version, index) => (
                        <button
                          type="button"
                          key={version.id || version.version || index}
                          className={`document-version-item ${(activeVersion?.id || activeVersion?.version) === (version.id || version.version) ? "active" : ""}`}
                          onClick={() => setSelectedVersion(version)}
                        >
                          <span>
                            <strong>
                              {version.label ||
                                `Version ${version.version || versions.length - index}`}
                            </strong>
                            <span>
                              {dateLabel(
                                version.created_at || version.submitted_at,
                                "Current record",
                              )}
                            </span>
                          </span>
                          <i className="document-version-badge">
                            {version.is_current ? "Current" : "View"}
                          </i>
                        </button>
                      ))}
                    </div>
                    <div className="document-compare">
                      <div className="document-compare-head">
                        <span>Version comparison</span>
                        <span>
                          {activeVersion?.label ||
                            `Version ${activeVersion?.version || "—"}`}
                        </span>
                      </div>
                      {comparison?.summary ? (
                        <div className="document-compare-lines">
                          {String(comparison.summary)
                            .split("\n")
                            .filter(Boolean)
                            .map((line, index) => (
                              <div
                                className="document-compare-line"
                                key={index}
                              >
                                <i />
                                {line}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="document-compare-empty">
                          Select a version to inspect its submitted date and
                          workflow context. Detailed text comparison appears
                          when version analysis is available.
                        </div>
                      )}
                    </div>
                  </article>
                  <article className="document-card document-audit">
                    <div className="document-section-head">
                      <div>
                        <div className="card-eyebrow">
                          <i /> Accountability
                        </div>
                        <h2>Audit trail</h2>
                      </div>
                      <span className="document-version-badge">
                        {visibleAudit.length} events
                      </span>
                    </div>
                    <div className="document-audit-list">
                      {visibleAudit.map((item, index) => (
                        <div
                          className="document-audit-item"
                          key={item.id || index}
                        >
                          <strong>
                            {item.action ||
                              item.event ||
                              item.status ||
                              "Document updated"}
                          </strong>
                          <span>
                            {nameOf(
                              item.user || item.actor || item.sender_name,
                              "System",
                            )}{" "}
                            ·{" "}
                            {dateLabel(
                              item.timestamp ||
                                item.created_at ||
                                item.updated_at,
                              "Recorded",
                            )}
                          </span>
                          {(item.detail || item.description || item.note) && (
                            <p>
                              {item.detail || item.description || item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </article>
                </section>
              </div>
              <aside className="document-side">
                <article className="document-card document-sla">
                  <div className="document-sla-top">
                    <div>
                      <div className="card-eyebrow">
                        <i /> SLA tracking
                      </div>
                      <h2>On track</h2>
                    </div>
                    <span className="document-live">● Live</span>
                  </div>
                  <h3>{due ? dateLabel(due) : "No deadline"}</h3>
                  <p>{due ? "Review deadline" : "Set a review deadline"}</p>
                  <div className="document-progress">
                    <i />
                  </div>
                  <div className="document-progress-meta">
                    <span>
                      Started{" "}
                      {dateLabel(
                        record?.submitted_at || record?.created_at,
                        "recently",
                      )}
                    </span>
                    <span>72% elapsed</span>
                  </div>
                  <div className="document-sla-grid">
                    <div>
                      <span>Target</span>
                      <strong>{record?.sla_target || "2 business days"}</strong>
                    </div>
                    <div>
                      <span>Elapsed</span>
                      <strong>{record?.elapsed || "1d 6h"}</strong>
                    </div>
                  </div>
                </article>
                <article className="document-card document-owners">
                  <div className="card-eyebrow">
                    <i /> Workflow ownership
                  </div>
                  <h2>Handoff map</h2>
                  <div className="owner-line">
                    <span className="owner-avatar">{initials(submitter)}</span>
                    <div className="owner-copy">
                      <strong>{submitter}</strong>
                      <span>Faculty submitter</span>
                    </div>
                  </div>
                  <div className="owner-line">
                    <span className="owner-avatar">{initials(owner)}</span>
                    <div className="owner-copy">
                      <strong>{owner}</strong>
                      <span>Current reviewer</span>
                    </div>
                  </div>
                  <div className="owner-line">
                    <span className="owner-avatar">AP</span>
                    <div className="owner-copy">
                      <strong>
                        {record?.final_approver_name || "Academic Provost"}
                      </strong>
                      <span>Final approver</span>
                    </div>
                  </div>
                </article>
                <article className="document-card document-review-guide">
                  <div className="card-eyebrow">
                    <i /> Review workflow
                  </div>
                  <h2>Decision checklist</h2>
                  <div className="document-guide-list">
                    <div>
                      <i>1</i>
                      <span>
                        Read the current file and confirm the required evidence
                        is present.
                      </span>
                    </div>
                    <div>
                      <i>2</i>
                      <span>
                        Use comments for discussion; return for revision when
                        the submitter needs to update the record.
                      </span>
                    </div>
                    <div>
                      <i>3</i>
                      <span>
                        Approve only when the document is ready for the next
                        owner in the handoff map.
                      </span>
                    </div>
                  </div>
                </article>
              </aside>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
