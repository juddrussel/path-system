import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const resolveUrl = (value) =>
  !value ? "" : /^https?:\/\//i.test(value) ? value : `${API}${value}`;
const personName = (value, fallback = "—") =>
  typeof value === "string"
    ? value
    : value?.full_name || value?.name || value?.username || fallback;
const initials = (value) =>
  personName(value, "PATH")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
const displayDate = (value, fallback = "—") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
};
const statusTone = (status) => {
  const value = String(status || "In review").toLowerCase();
  if (value.includes("approved") || value.includes("completed"))
    return "approved";
  if (value.includes("return") || value.includes("revision")) return "returned";
  if (value.includes("reject")) return "rejected";
  if (value.includes("review")) return "review";
  return "pending";
};

function StatusChip({ status }) {
  return (
    <span className={`faculty-status ${statusTone(status)}`}>
      <i />
      {status || "In review"}
    </span>
  );
}

function Card({ children, className = "" }) {
  return <section className={`faculty-card ${className}`}>{children}</section>;
}

export default function FacultyDocumentDetails({ documentId, onBack }) {
  const { id: routeId } = useParams();
  const id = documentId || routeId;
  const navigate = useNavigate();
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
  const [preview, setPreview] = useState(true);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitNote, setResubmitNote] = useState("");
  const [resubmitFiles, setResubmitFiles] = useState([]);
  const [resubmitting, setResubmitting] = useState(false);
  const [activeVersion, setActiveVersion] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };
  const loadRecord = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/documents/${id}`, { headers });
      if (response.status === 401) {
        navigate("/login");
        return;
      }
      if (!response.ok) throw new Error("Document unavailable");
      const payload = await response.json();
      setRecord(payload.document || payload.data || payload);
    } catch (requestError) {
      setError(requestError.message || "Unable to load this document.");
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
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) await loadRecord();
    } finally {
      setPosting(false);
    }
  };

  const resubmit = async (event) => {
    event.preventDefault();
    if (!resubmitNote.trim() && !resubmitFiles.length) {
      setError(
        "Add a short resubmission note or an updated file before submitting.",
      );
      return;
    }
    setResubmitting(true);
    setError("");
    try {
      const data = new FormData();
      data.append("note", resubmitNote.trim());
      resubmitFiles.forEach((file) => data.append("files", file));
      const response = await fetch(`${API}/api/documents/${id}/resubmit`, {
        method: "POST",
        headers,
        body: data,
      });
      if (!response.ok)
        throw new Error("The resubmission could not be completed.");
      const payload = await response.json();
      setRecord(
        payload.document || payload.data || { ...record, status: "Submitted" },
      );
      setResubmitNote("");
      setResubmitFiles([]);
      setResubmitOpen(false);
    } catch (submitError) {
      setError(
        submitError.message || "The resubmission could not be completed.",
      );
    } finally {
      setResubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="faculty-shell">

        <main className="faculty-main">
         
          <div className="faculty-state">
            <div>
              <b>Document unavailable</b>
              <p>{error}</p>
              <button onClick={() => navigate(-1)}>Back to documents</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const title = record?.title || record?.document_type || "Document details";
  const tracking = record?.tracking_id || record?.document_id || `DOC-${id}`;
  const status = record?.status || "In review";
  const stage = String(status).toLowerCase();
  const returned = /return|revision/.test(stage);
  const rejected = /reject/.test(stage);
  const approved = /approved|completed/.test(stage);
  const canResubmit = returned;
  const reviewDirection =
    record?.return_reason ||
    record?.revision_reason ||
    record?.rejection_reason ||
    record?.review_note ||
    record?.decision_note ||
    "";
  const reviewer = personName(
    record?.current_owner || record?.assigned_to || record?.handler,
    record?.assigned_to_name || record?.current_handler || "Review team",
  );
  const submittedAt =
    record?.submitted_at || record?.created_at || record?.filing_date;
  const deadline = record?.review_due || record?.deadline || record?.due_date;
  const files =
    record?.files ||
    record?.attachments ||
    (record?.file_url
      ? [{ url: record.file_url, name: record.file_name || title }]
      : []);
  const primaryFile = files[0];
  const documentUrl = resolveUrl(
    primaryFile?.url || primaryFile?.file_url || primaryFile?.path,
  );
  const fileName =
    primaryFile?.name ||
    primaryFile?.file_name ||
    record?.file_name ||
    "Document file";
  const isPdf =
    /\.pdf$/i.test(fileName) || /pdf/i.test(primaryFile?.mime_type || "");
  const comments = Array.isArray(record?.comments || record?.review_comments)
    ? record.comments || record.review_comments
    : [];
  const versions = Array.isArray(
    record?.versions || record?.version_history || record?.submission_versions,
  )
    ? record.versions || record.version_history || record.submission_versions
    : [
        {
          id: "current",
          version: record?.version || 1,
          label: "Current submission",
          created_at: record?.updated_at || submittedAt,
          is_current: true,
        },
      ];
  const selectedVersion =
    activeVersion || versions.find((item) => item.is_current) || versions[0];
  const audit = Array.isArray(
    record?.audit_trail || record?.audit || record?.history,
  )
    ? record.audit_trail || record.audit || record.history
    : [];
  const responseTitle = returned
    ? "Your update is needed"
    : rejected
      ? "A decision has been recorded"
      : approved
        ? "Your document is approved"
        : "Your document is being reviewed";
  const responseCopy = returned
    ? "Review the direction below, prepare an updated version, and resubmit when it is ready."
    : rejected
      ? "Review the decision details and contact the review team if you need clarification."
      : approved
        ? "The review workflow is complete. Keep this record for your department files."
        : "The review team will update this record as the document moves through its workflow.";

  return (
    <div className="faculty-shell">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');*{box-sizing:border-box}.faculty-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#47394f;font-family:'DM Sans',sans-serif}.faculty-main{min-width:0;flex:1}.faculty-page{max-width:1320px;margin:auto;padding:32px 28px 48px}.faculty-back{border:0;padding:0;background:transparent;color:#7545c3;font-size:12px;font-weight:800;cursor:pointer}.faculty-back span{color:#aaa0ae;font-weight:600}.faculty-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:22px;margin-top:22px;padding:0 13px 22px;border-bottom:1px solid #e7dfed}.faculty-identity{display:flex;gap:14px;min-width:0}.faculty-file{display:grid;flex:0 0 auto;width:48px;height:48px;place-items:center;border:1px solid #dfd1f5;border-radius:13px;background:#efe8fd;color:#7844c5;font-size:21px}.faculty-kicker,.faculty-label{display:flex;align-items:center;gap:7px;color:#9a8fa1;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.faculty-kicker{gap:10px;font-size:12px}.faculty-label i{width:6px;height:6px;border-radius:50%;background:#b89be9}.faculty-identity h1{margin:6px 0 5px;overflow:hidden;color:#302638;font-family:'Manrope',sans-serif;font-size:clamp(27px,3vw,39px);font-weight:800;letter-spacing:-.06em;line-height:1;text-overflow:ellipsis;white-space:nowrap}.faculty-identity p{margin:0;color:#918599;font-size:12px;font-weight:600}.faculty-hero-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.faculty-button{display:inline-flex;min-height:33px;align-items:center;justify-content:center;gap:6px;border:1px solid #e6deed;border-radius:8px;padding:0 12px;background:#fff;color:#71657a;font-size:12px;font-weight:800;cursor:pointer;text-decoration:none}.faculty-button.primary{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 8px 16px rgba(124,58,237,.22)}.faculty-button.return{border-color:#e6d39d;background:#fffdf7;color:#9f742a}.faculty-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #e7dfed;border-top:0;background:#fff}.faculty-meta div{min-width:0;padding:14px 16px;border-right:1px solid #eee9f2}.faculty-meta div:last-child{border-right:0}.faculty-meta span{display:block;color:#9e93a4;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.faculty-meta strong{display:block;overflow:hidden;margin-top:6px;color:#4a3d53;font-family:'Manrope',sans-serif;font-size:12px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.faculty-owner{display:flex;align-items:center;gap:7px}.faculty-owner i,.faculty-avatar{display:grid;place-items:center;background:#eee6fb;color:#7544c5;font-style:normal;font-weight:800}.faculty-owner i{width:19px;height:19px;border-radius:6px;font-size:10px}.faculty-grid{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(285px,.78fr);gap:16px;margin-top:16px}.faculty-card{border:1px solid #e5ddec;border-radius:12px;background:#fff;box-shadow:0 11px 27px rgba(56,36,91,.045)}.faculty-card h2{margin:6px 0 0;color:#43354d;font-family:'Manrope',sans-serif;font-size:20px;font-weight:800;letter-spacing:-.045em}.faculty-card p{color:#877b91}.faculty-outcome{padding:20px}.faculty-outcome-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.faculty-status{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:5px 8px;font-size:11px;font-weight:800}.faculty-status i{width:5px;height:5px;border-radius:50%;background:currentColor}.faculty-status.pending{background:#f7f1ff;color:#7946c2}.faculty-status.review{background:#f0eaff;color:#7544c5}.faculty-status.returned{background:#fff5df;color:#a2762c}.faculty-status.rejected{background:#fff0ed;color:#b5685d}.faculty-status.approved{background:#e9f6ef;color:#4b8e70}.faculty-outcome p{margin:9px 0 0;font-size:12px;line-height:1.65}.faculty-steps{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:9px;margin:26px 15px 20px}.faculty-step{display:flex;flex-direction:column;align-items:center;gap:6px;color:#a398a8;font-size:11px;text-align:center}.faculty-step b{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e5ddec;border-radius:50%;background:#fff;color:#a398a8;font-size:11px}.faculty-step.done{color:#7544c5;font-weight:800}.faculty-step.done b{border-color:#a785e3;background:#f2eaff;color:#7544c5}.faculty-step.active{color:#7544c5;font-weight:800}.faculty-step.active b{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 0 0 5px #f0e9fc}.faculty-step-line{height:1px;background:#e6dfee}.faculty-step-line.done{background:#b996ee}.faculty-direction{margin-top:14px;border:1px solid #ead8a9;border-radius:9px;padding:13px;background:#fffdf7}.faculty-direction.reject{border-color:#efd6d1;background:#fff8f6}.faculty-direction strong{display:block;color:#6b5a40;font-size:12px;font-weight:800}.faculty-direction.reject strong{color:#935c53}.faculty-direction p{margin:5px 0 0;color:#816f59;font-size:12px;line-height:1.6}.faculty-preview{margin-top:16px;overflow:hidden}.faculty-preview-head{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid #f0edf4}.faculty-preview-head p{margin:4px 0 0;color:#675a70;font-size:12px;font-weight:800}.faculty-preview-actions{display:flex;gap:7px}.faculty-preview-actions button{border:1px solid #dfd5e8;border-radius:7px;padding:7px 9px;background:#fff;color:#7445c1;font-size:11px;font-weight:800;cursor:pointer}.faculty-preview-body{min-height:445px;background:#f4f1f9}.faculty-preview-body iframe{display:block;width:100%;min-height:590px;border:0;background:#fff}.faculty-preview-image{display:grid;place-items:center;min-height:445px;background:#18151e}.faculty-preview-image img{max-width:100%;max-height:620px;object-fit:contain}.faculty-preview-empty{display:grid;min-height:360px;place-items:center;padding:28px;color:#9c92a1;font-size:12px;text-align:center}.faculty-preview-empty b{display:block;margin-bottom:5px;color:#685b71;font-size:13px}.faculty-side{display:flex;flex-direction:column;gap:16px}.faculty-sla,.faculty-resubmit,.faculty-comments,.faculty-versions,.faculty-audit{padding:19px}.faculty-sla h3{margin:18px 0 4px;color:#4b3e54;font-family:'Manrope',sans-serif;font-size:21px;font-weight:800;letter-spacing:-.05em}.faculty-sla p{margin:0;color:#977131;font-size:12px;font-weight:800}.faculty-progress{height:7px;margin-top:17px;overflow:hidden;border-radius:99px;background:#eee8f4}.faculty-progress i{display:block;width:52%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c5aaf6,#7c3aed)}.faculty-sla-meta{display:flex;justify-content:space-between;margin-top:7px;color:#a198a6;font-size:11px}.faculty-resubmit{border-color:#e7d5aa;background:linear-gradient(155deg,#fff 28%,#fffaf0)}.faculty-resubmit p{margin:9px 0 0;font-size:12px;line-height:1.6}.faculty-resubmit-form{margin-top:15px;padding-top:13px;border-top:1px solid #f0e2bc}.faculty-resubmit-form label{display:block;margin-top:10px;color:#65566e;font-size:12px;font-weight:800}.faculty-resubmit-form textarea,.faculty-resubmit-form input{width:100%;margin-top:6px;border:1px solid #e2d8e9;border-radius:8px;padding:9px;background:#fff;color:#594a62;font-family:'DM Sans',sans-serif;font-size:12px;outline:0}.faculty-resubmit-form textarea{min-height:82px;resize:vertical}.faculty-resubmit-form textarea:focus,.faculty-resubmit-form input:focus{border-color:#ba9ae7;box-shadow:0 0 0 3px #f3edff}.faculty-file-note{margin-top:6px;color:#94879a;font-size:11px}.faculty-resubmit-actions{display:flex;gap:8px;margin-top:12px}.faculty-resubmit-actions button{min-height:32px;border:1px solid #e0d5b5;border-radius:7px;padding:0 10px;background:#fff;color:#85662c;font-size:12px;font-weight:800;cursor:pointer}.faculty-resubmit-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}.faculty-resubmit-actions button:disabled{cursor:not-allowed;opacity:.6}.faculty-comments{margin-top:16px}.faculty-comments-head{display:flex;align-items:center;justify-content:space-between}.faculty-count{display:grid;min-width:20px;height:20px;place-items:center;border-radius:6px;background:#f0e9fc;color:#7543c7;font-size:11px;font-weight:800}.faculty-comment{display:flex;gap:9px;margin-top:15px}.faculty-avatar{flex:0 0 auto;width:27px;height:27px;border-radius:8px;font-size:11px}.faculty-comment strong{display:block;color:#64566c;font-size:12px;font-weight:800}.faculty-comment strong span{margin-left:5px;color:#a89daa;font-size:11px;font-weight:500}.faculty-comment p{margin:4px 0 0;font-size:12px;line-height:1.55}.faculty-comment-compose{display:flex;gap:8px;align-items:flex-end;margin-top:16px}.faculty-comment-compose textarea{min-height:56px;flex:1;resize:vertical;border:1px solid #e4ddea;border-radius:8px;padding:9px;color:#5f5068;font-family:'DM Sans',sans-serif;font-size:12px;outline:0}.faculty-comment-compose button{display:grid;width:34px;height:34px;place-items:center;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-weight:800;cursor:pointer}.faculty-comment-compose button:disabled{opacity:.6;cursor:not-allowed}.faculty-workflow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;margin-top:16px}.faculty-version-list{display:flex;flex-direction:column;gap:8px;margin-top:14px}.faculty-version{display:flex;align-items:center;justify-content:space-between;gap:9px;width:100%;border:1px solid #ebe4f0;border-radius:8px;padding:10px;background:#fff;color:#6b5d74;text-align:left;cursor:pointer}.faculty-version.active{border-color:#bda4e9;background:#fbf9ff;box-shadow:0 0 0 3px #f4effe}.faculty-version strong{display:block;font-size:12px}.faculty-version span{display:block;margin-top:3px;color:#a197a5;font-size:11px}.faculty-version b{color:#7844c5;font-size:11px}.faculty-audit-list{position:relative;margin-top:15px;padding-left:19px}.faculty-audit-list:before{position:absolute;top:5px;bottom:5px;left:4px;width:1px;background:#e1d8e9;content:''}.faculty-audit-item{position:relative;margin-top:14px}.faculty-audit-item:first-child{margin-top:0}.faculty-audit-item:before{position:absolute;top:3px;left:-18px;width:8px;height:8px;border:2px solid #f8f7ff;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 1px #cbb8ec;content:''}.faculty-audit-item strong{display:block;color:#66576f;font-size:12px;font-weight:800}.faculty-audit-item span{display:block;margin-top:3px;color:#a298a6;font-size:11px}.faculty-audit-item p{margin:4px 0 0;font-size:11px;line-height:1.5}.faculty-state{display:grid;min-height:calc(100vh - 70px);place-items:center;padding:40px;color:#93899a;font-size:14px;text-align:center}.faculty-state b{color:#594c63;font-family:'Manrope',sans-serif}.faculty-state button{border:0;border-radius:7px;padding:9px 12px;background:#7c3aed;color:#fff;font-size:12px;font-weight:800;cursor:pointer}.faculty-error{margin:14px 0 0;color:#b66258;font-size:12px}@media(max-width:1060px){.faculty-grid{grid-template-columns:1fr}.faculty-side{display:grid;grid-template-columns:1fr 1fr}.faculty-resubmit{grid-column:1/-1}.faculty-comments{grid-column:1/-1}}@media(max-width:720px){.faculty-page{padding:22px 14px 34px}.faculty-hero{flex-direction:column}.faculty-hero-actions{justify-content:flex-start}.faculty-meta{grid-template-columns:1fr 1fr}.faculty-meta div:nth-child(2){border-right:0}.faculty-meta div:nth-child(-n+2){border-bottom:1px solid #eee9f2}.faculty-side,.faculty-workflow{grid-template-columns:1fr}.faculty-resubmit,.faculty-comments{grid-column:auto}.faculty-identity h1{font-size:29px}.faculty-preview-head{align-items:flex-start;flex-direction:column}.faculty-preview-body iframe{min-height:435px}.faculty-steps{margin-right:0;margin-left:0;gap:5px}.faculty-step{font-size:10px}}`}</style>

      <main className="faculty-main">

        <div className="faculty-page">
          <button
            className="faculty-back"
            type="button"
            onClick={onBack || (() => navigate(-1))}
          >
            ← Back to My documents <span>/ Document details</span>
          </button>
          <section className="faculty-hero">
            <div className="faculty-identity">
              <span className="faculty-file">▤</span>
              <div>
                <div className="faculty-kicker">
                  ◆ Your submission <span>{tracking}</span>
                </div>
                <h1 title={title}>{title}</h1>
                <p>
                  {record?.category ||
                    record?.document_type ||
                    "Academic document"}{" "}
                  &nbsp;·&nbsp; Submitted {displayDate(submittedAt, "recently")}
                </p>
              </div>
            </div>
            <div className="faculty-hero-actions">
              <button
                className="faculty-button"
                type="button"
                onClick={() => setPreview((value) => !value)}
              >
                {preview ? "Hide preview" : "Preview document"}
              </button>
              {documentUrl && (
                <a
                  className="faculty-button"
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={fileName}
                >
                  Download
                </a>
              )}
              {canResubmit && (
                <button
                  className="faculty-button return"
                  type="button"
                  onClick={() => setResubmitOpen(true)}
                >
                  ↩ Prepare resubmission
                </button>
              )}
            </div>
          </section>
          <section className="faculty-meta">
            <div>
              <span>Review owner</span>
              <strong className="faculty-owner">
                <i>{initials(reviewer)}</i>
                {reviewer}
              </strong>
            </div>
            <div>
              <span>Current status</span>
              <strong>{status}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{displayDate(submittedAt)}</strong>
            </div>
            <div>
              <span>{deadline ? "Review target" : "Review timing"}</span>
              <strong>
                {deadline ? displayDate(deadline) : "No deadline"}
              </strong>
            </div>
          </section>
          {error && <p className="faculty-error">{error}</p>}
          <section className="faculty-grid">
            <div>
              <Card className="faculty-outcome">
                <div className="faculty-label">
                  <i /> Submission status
                </div>
                <div className="faculty-outcome-head">
                  <div>
                    <h2>{responseTitle}</h2>
                    <p>{responseCopy}</p>
                  </div>
                  <StatusChip status={status} />
                </div>
                <div className="faculty-steps">
                  <div className="faculty-step done">
                    <b>✓</b>
                    <span>Submitted</span>
                  </div>
                  <i className="faculty-step-line done" />
                  <div
                    className={`faculty-step ${approved || returned || rejected ? "done" : "active"}`}
                  >
                    <b>{approved || returned || rejected ? "✓" : "02"}</b>
                    <span>In review</span>
                  </div>
                  <i
                    className={`faculty-step-line ${approved || returned || rejected ? "done" : ""}`}
                  />
                  <div
                    className={`faculty-step ${approved || returned || rejected ? "active" : ""}`}
                  >
                    <b>{approved || returned || rejected ? "✓" : "03"}</b>
                    <span>Outcome</span>
                  </div>
                </div>
                {(returned || rejected) && (
                  <div
                    className={`faculty-direction ${rejected ? "reject" : ""}`}
                  >
                    <strong>
                      {returned ? "Reviewer direction" : "Decision explanation"}
                    </strong>
                    <p>
                      {reviewDirection ||
                        "The review team has updated the submission outcome. Use the discussion below to request clarification if needed."}
                    </p>
                  </div>
                )}
              </Card>
              {preview && (
                <Card className="faculty-preview">
                  <div className="faculty-preview-head">
                    <div>
                      <div className="faculty-label">
                        <i /> Document preview
                      </div>
                      <h2>{fileName}</h2>
                      <p>{isPdf ? "PDF document" : "Attached submission"}</p>
                    </div>
                    <div className="faculty-preview-actions">
                      {documentUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(documentUrl, "_blank")}
                        >
                          Open file ↗
                        </button>
                      )}
                    </div>
                  </div>
                  {documentUrl && isPdf ? (
                    <div className="faculty-preview-body">
                      <iframe
                        title={`Preview of ${title}`}
                        src={`${documentUrl}#toolbar=0`}
                      />
                    </div>
                  ) : documentUrl ? (
                    <div className="faculty-preview-image">
                      <img src={documentUrl} alt={`Preview of ${title}`} />
                    </div>
                  ) : (
                    <div className="faculty-preview-empty">
                      <div>
                        <b>No attached preview</b>
                        <span>
                          The original document file will appear here when it is
                          available.
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              )}
              <Card className="faculty-comments">
                <div className="faculty-comments-head">
                  <div>
                    <div className="faculty-label">
                      <i /> Review discussion
                    </div>
                    <h2>Comments & clarification</h2>
                  </div>
                  <span className="faculty-count">{comments.length}</span>
                </div>
                {comments.length ? (
                  comments.map((item, index) => (
                    <div
                      className="faculty-comment"
                      key={item.id || `${item.created_at}-${index}`}
                    >
                      <span className="faculty-avatar">
                        {initials(item.sender || item.sender_name || item.user)}
                      </span>
                      <div>
                        <strong>
                          {personName(
                            item.sender || item.sender_name || item.user,
                            "Review team",
                          )}
                          <span>
                            {displayDate(
                              item.created_at || item.timestamp,
                              "Just now",
                            )}
                          </span>
                        </strong>
                        <p>{item.content || item.message || item.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>
                    There are no discussion messages on this submission yet.
                  </p>
                )}
                <div className="faculty-comment-compose">
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Ask the review team for clarification…"
                  />
                  <button
                    type="button"
                    onClick={postComment}
                    disabled={posting || !comment.trim()}
                  >
                    {posting ? "…" : "↑"}
                  </button>
                </div>
              </Card>
            </div>
            <aside className="faculty-side">
              <Card className="faculty-sla">
                <div className="faculty-label">
                  <i /> Review timing
                </div>
                <h2>{deadline ? "Review target" : "Status monitoring"}</h2>
                <h3>{deadline ? displayDate(deadline) : "No deadline"}</h3>
                <p>
                  {returned
                    ? "Resubmit when your revision is ready."
                    : approved
                      ? "Review workflow complete."
                      : "The review team will update this record."}
                </p>
                <div className="faculty-progress">
                  <i />
                </div>
                <div className="faculty-sla-meta">
                  <span>Submitted</span>
                  <span>
                    {approved || returned || rejected
                      ? "Outcome recorded"
                      : "In progress"}
                  </span>
                </div>
              </Card>
              {canResubmit && (
                <Card className="faculty-resubmit">
                  <div className="faculty-label">
                    <i /> Submitter workspace
                  </div>
                  <h2>Send an updated version</h2>
                  <p>
                    Attach a revised file or explain the changes you made. Your
                    original submission remains in version history.
                  </p>
                  {resubmitOpen ? (
                    <form className="faculty-resubmit-form" onSubmit={resubmit}>
                      <label htmlFor="faculty-resubmit-note">
                        What changed?
                      </label>
                      <textarea
                        id="faculty-resubmit-note"
                        value={resubmitNote}
                        onChange={(event) =>
                          setResubmitNote(event.target.value)
                        }
                        placeholder="Briefly describe how you addressed the reviewer direction."
                      />
                      <label htmlFor="faculty-resubmit-file">
                        Updated file
                      </label>
                      <input
                        id="faculty-resubmit-file"
                        type="file"
                        multiple
                        onChange={(event) =>
                          setResubmitFiles(Array.from(event.target.files || []))
                        }
                      />
                      <div className="faculty-file-note">
                        {resubmitFiles.length
                          ? `${resubmitFiles.length} file${resubmitFiles.length === 1 ? "" : "s"} selected`
                          : "You can submit a note, a new file, or both."}
                      </div>
                      <div className="faculty-resubmit-actions">
                        <button
                          type="button"
                          onClick={() => setResubmitOpen(false)}
                          disabled={resubmitting}
                        >
                          Cancel
                        </button>
                        <button type="submit" disabled={resubmitting}>
                          {resubmitting ? "Sending…" : "Submit revision"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="faculty-resubmit-actions">
                      <button
                        type="button"
                        onClick={() => setResubmitOpen(true)}
                      >
                        Prepare resubmission
                      </button>
                    </div>
                  )}
                </Card>
              )}
              <Card className="faculty-versions">
                <div className="faculty-label">
                  <i /> Submission history
                </div>
                <h2>Version history</h2>
                <div className="faculty-version-list">
                  {versions.map((item, index) => {
                    const selected =
                      String(
                        selectedVersion?.id || selectedVersion?.version,
                      ) === String(item.id || item.version);
                    return (
                      <button
                        className={`faculty-version ${selected ? "active" : ""}`}
                        type="button"
                        onClick={() => setActiveVersion(item)}
                        key={item.id || item.version || index}
                      >
                        <div>
                          <strong>
                            {item.label ||
                              `Version ${item.version || versions.length - index}`}
                          </strong>
                          <span>
                            {displayDate(item.created_at || item.submitted_at)}
                          </span>
                        </div>
                        {item.is_current && <b>Current</b>}
                      </button>
                    );
                  })}
                </div>
              </Card>
              <Card className="faculty-audit">
                <div className="faculty-label">
                  <i /> Accountability
                </div>
                <h2>Activity trail</h2>
                {audit.length ? (
                  <div className="faculty-audit-list">
                    {audit.slice(0, 6).map((item, index) => (
                      <div
                        className="faculty-audit-item"
                        key={item.id || index}
                      >
                        <strong>
                          {item.action || item.event || "Document updated"}
                        </strong>
                        <span>
                          {personName(item.user || item.actor, "PATH")} ·{" "}
                          {displayDate(item.timestamp || item.created_at)}
                        </span>
                        {(item.detail || item.description) && (
                          <p>{item.detail || item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No activity entries have been recorded yet.</p>
                )}
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}