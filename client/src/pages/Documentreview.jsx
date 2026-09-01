import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;
const fileUrl = (value) =>
  !value
    ? ""
    : /^https?:\/\//i.test(value)
      ? value
      : `${API || "http://localhost:5000"}${value}`;
const stamp = (value, fallback = "—") => {
  const date = value && new Date(value);
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : fallback;
};
const shortTime = (value, fallback = "Recorded") => {
  const date = value && new Date(value);
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : fallback;
};
const initials = (value = "PATH") =>
  String(value)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PA";
const isFileField = (field) => field.fieldType === "File Upload";
const statusTone = (status) =>
  /approved/i.test(status)
    ? "success"
    : /return|reject|revision/i.test(status)
      ? "danger"
      : /review/i.test(status)
        ? "violet"
        : "gold";
const DECISION_REASONS = {
  return: [
    "Missing information or supporting document",
    "Template or format correction required",
    "Content needs clarification",
    "Required approval or endorsement is missing",
    "Other revision needed",
  ],
  reject: [
    "Does not meet eligibility requirements",
    "Required evidence is missing",
    "Duplicate or superseded submission",
    "Outside the scope of this request",
    "Other rejection reason",
  ],
};
const VERSION_HISTORY_STORAGE_PREFIX = "path.document-review.lineage:";
const versionHistoryKeys = (form) => {
  const identifiers = [
    form?.tracking_id,
    form?.trackingId,
    form?.tracking_number,
    form?.trackingNumber,
    form?.document_id,
    form?.documentId,
    form?.id,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value));
  return [
    ...new Set(
      (identifiers.length ? identifiers : ["unknown"]).map(
        (identifier) => `${VERSION_HISTORY_STORAGE_PREFIX}${identifier}`,
      ),
    ),
  ];
};
const readPersistedVersions = (form) => {
  if (typeof window === "undefined") return [];
  try {
    return versionHistoryKeys(form).flatMap((key) => {
      const stored = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(stored)
        ? stored.filter((item) => item && typeof item === "object")
        : [];
    });
  } catch {
    return [];
  }
};
const persistVersions = (form, versions) => {
  if (typeof window === "undefined" || !Array.isArray(versions)) return;
  try {
    versionHistoryKeys(form).forEach((key) => {
      window.localStorage.setItem(key, JSON.stringify(versions));
    });
  } catch {}
};
const versionTimestamp = (item) =>
  item?.submitted_at || item?.created_at || item?.updated_at || "";
const versionFileUrl = (item) => {
  const embeddedFile = item?.file || item?.attachment || item?.document;
  return (
    item?.file_url ||
    item?.fileUrl ||
    item?.file_path ||
    item?.path ||
    item?.url ||
    item?.attachment_url ||
    (typeof embeddedFile === "string" ? embeddedFile : "") ||
    embeddedFile?.file_url ||
    embeddedFile?.url ||
    embeddedFile?.path ||
    ""
  );
};
const versionFileName = (item) => {
  const embeddedFile = item?.file || item?.attachment || item?.document;
  return (
    item?.file_name ||
    item?.filename ||
    item?.original_name ||
    item?.name ||
    embeddedFile?.file_name ||
    embeddedFile?.name ||
    ""
  );
};
const versionFileSize = (item) =>
  item?.file_size || item?.size || item?.bytes || item?.file?.size || "";
const displayStatus = (value, fallback = "Pending") => {
  const status = String(value || "").trim();
  if (/approved|completed|complete/i.test(status)) return "Approved";
  if (/returned|revision|revise/i.test(status)) return "Returned";
  if (/reject(?:ed)?/i.test(status)) return "Rejected";
  if (/review/i.test(status)) return "In review";
  if (/pending|draft/i.test(status)) return "Pending";
  return status || fallback;
};
const versionWorkflowStatus = (item, fallback = "Pending") => {
  const value =
    item?.status ||
    item?.workflow_status ||
    item?.review_status ||
    item?.decision ||
    item?.state ||
    "";
  const normalized = displayStatus(value, "");
  if (["Approved", "Returned", "Rejected"].includes(normalized)) {
    return normalized;
  }

  const reviewerDirection = String(
    item?.review_note ||
      item?.reviewer_note ||
      item?.reviewer_direction ||
      item?.review_direction ||
      item?.revision_instruction ||
      item?.return_instruction ||
      item?.return_reason ||
      item?.note ||
      item?.remarks ||
      "",
  ).trim();
  if (item?.rejection_reason || item?.rejected_reason) return "Rejected";
  if (
    reviewerDirection &&
    /\b(reviewer\s*(direction|instruction|feedback)|return(?:ed)?\s*(reason|instruction)|revision\s*(reason|instruction)|needs?\s+(revision|clarification|correction)|please\s+(revise|correct|update))\b/i.test(
      reviewerDirection,
    )
  ) {
    return "Returned";
  }
  return normalized || displayStatus(fallback);
};
const versionRecords = (...sources) => {
  const seen = new Set();
  const records = [];
  sources.forEach((source) => {
    if (!Array.isArray(source)) return;
    source.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const fileUrl = versionFileUrl(item);
      const fileName = versionFileName(item);
      const fileIdentity = String(fileUrl || fileName || "").toLowerCase();
      const key = fileIdentity
        ? `file:${fileIdentity}`
        : `record:${item.submission_id || item.version_id || item.id || index}`;
      if (seen.has(key)) return;
      seen.add(key);
      records.push({
        ...item,
        lineage_id: String(key),
        file_url: fileUrl,
        file_name: fileName,
        file_size: versionFileSize(item),
        submitted_at: versionTimestamp(item),
      });
    });
  });
  return records
    .sort((left, right) => {
      const leftTime = new Date(versionTimestamp(left)).getTime() || 0;
      const rightTime = new Date(versionTimestamp(right)).getTime() || 0;
      return leftTime - rightTime;
    })
    .map((item, index, items) => ({
      ...item,
      lineage_number: index + 1,
      is_current: index === items.length - 1,
    }));
};
const formLineageIdentifiers = (record) =>
  [
    record?.tracking_id,
    record?.trackingId,
    record?.tracking_number,
    record?.trackingNumber,
    record?.document_id,
    record?.documentId,
    record?.parent_form_id,
    record?.parentFormId,
    record?.form_id,
    record?.formId,
    record?.id,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value));
const belongsToFormLineage = (candidate, form) => {
  const formIdentifiers = new Set(formLineageIdentifiers(form));
  return formLineageIdentifiers(candidate).some((identifier) =>
    formIdentifiers.has(identifier),
  );
};

function Toasts({ items, remove }) {
  return items.length ? (
    <div className="doc-toasts">
      {items.map((item) => (
        <div className={`doc-toast ${item.type}`} key={item.id}>
          <span>{item.message}</span>
          <button type="button" onClick={() => remove(item.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  ) : null;
}

function Panel({ children, className = "" }) {
  return <article className={`doc-panel ${className}`}>{children}</article>;
}
function Label({ children }) {
  return (
    <div className="doc-label">
      <i />
      {children}
    </div>
  );
}

export default function DocumentReview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const [form, setForm] = useState(location.state?.form || null);
  const [loading, setLoading] = useState(!location.state?.form);
  const [loadError, setLoadError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [preview, setPreview] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [brief, setBrief] = useState("");
  const [version, setVersion] = useState(null);
  const [decisionForm, setDecisionForm] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [serverLineage, setServerLineage] = useState([]);
  const submissionFileRef = useRef(null);

  const currentUser = () => {
    try {
      return JSON.parse(atob(token?.split(".")[1] || ""));
    } catch {
      return {};
    }
  };
  const notify = (message, type = "info") => {
    const item = { id: Date.now(), message, type };
    setToasts((all) => [...all, item]);
    window.setTimeout(
      () => setToasts((all) => all.filter((toast) => toast.id !== item.id)),
      4000,
    );
  };
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);
  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API}/api/categories`, { headers });
        if (response.ok) {
          const data = await response.json();
          setCategories(
            (data.categories || []).filter(
              (item) => item.status === "Active" && item.type === "Form",
            ),
          );
        }
      } catch {}
    })();
  }, []);
  useEffect(() => {
    let isActive = true;
    (async () => {
      if (!form) setLoading(true);
      try {
        const response = await fetch(`${API}/api/forms/${id}`, { headers });
        if (!response.ok) throw new Error("not found");
        const data = await response.json();
        const latestForm = data.form || data;
        if (!isActive) return;
        const latestVersions = versionRecords(
          latestForm.submissions,
          latestForm.submitted_files,
          latestForm.submission_files,
          latestForm.versions,
          latestForm.version_history,
          latestForm.submission_versions,
          form?.submissions,
          form?.submitted_files,
          form?.submission_files,
          form?.versions,
          form?.version_history,
          form?.submission_versions,
          readPersistedVersions(latestForm),
        );
        setForm((current) => {
          return {
            ...current,
            ...latestForm,
            ...(latestVersions.length ? { submissions: latestVersions } : {}),
          };
        });
        if (latestVersions.length) persistVersions(latestForm, latestVersions);
        try {
          const role = String(currentUser()?.role || "").toLowerCase();
          const historyEndpoint = [
            "admin",
            "program_chair",
            "programchair",
            "chair",
          ].includes(role)
            ? "/api/forms/all?limit=100"
            : "/api/forms/my?limit=100";
          const historyResponse = await fetch(`${API}${historyEndpoint}`, {
            headers,
          });
          if (!historyResponse.ok || !isActive) return;
          const historyPayload = await historyResponse.json();
          const historyRows =
            historyPayload.forms ||
            historyPayload.items ||
            historyPayload.results ||
            historyPayload.data ||
            historyPayload;
          const matchingLineage = Array.isArray(historyRows)
            ? historyRows.filter((item) =>
                belongsToFormLineage(item, latestForm),
              )
            : [];
          setServerLineage(matchingLineage);
          const completeLineage = versionRecords(
            latestVersions,
            matchingLineage,
          );
          if (completeLineage.length)
            persistVersions(latestForm, completeLineage);
        } catch {
          if (isActive) setServerLineage([]);
        }
        setVersion(null);
      } catch {
        if (isActive && !form) setLoadError(true);
      } finally {
        if (isActive) setLoading(false);
      }
    })();
    return () => {
      isActive = false;
    };
  }, [id]);

  const decision = async (
    action,
    requiredNote,
    successMessage,
    noteOverride = note,
  ) => {
    if (/approved/i.test(form?.status || ""))
      return notify("This document is already approved.", "info");
    if (requiredNote && !noteOverride.trim())
      return notify(requiredNote, "error");
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/api/forms/${form.id}/${action}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteOverride }),
      });
      if (!response.ok) {
        let message = `Action failed (${response.status}).`;
        try {
          const data = await response.clone().json();
          message = data.message || data.error || message;
        } catch {}
        notify(message, "error");
        return;
      }
      let data = {};
      try {
        data = await response.json();
      } catch {}
      const updated = data.form || data;
      const statusAfterDecision =
        action === "approve"
          ? "Approved"
          : action === "revise"
            ? "Returned"
            : action === "reject"
              ? "Rejected"
              : form.status;
      setForm((current) => {
        const existingVersions = versionRecords(
          current.submissions,
          current.submitted_files,
          current.submission_files,
          current.versions,
          current.version_history,
          current.submission_versions,
          readPersistedVersions(current),
        );
        const fileValue =
          current.file_url ||
          current.file_path ||
          current.attachment_url ||
          current.uploaded_file;
        const priorVersions = existingVersions.length
          ? existingVersions
          : fileValue || current.file_name
            ? [
                {
                  id: `current-${current.id}`,
                  file_name: current.file_name,
                  file_url: fileValue || "",
                  status: current.status || "Pending",
                  note: current.review_note || "",
                  submitted_at:
                    current.submitted_at ||
                    current.updated_at ||
                    current.created_at,
                },
              ]
            : [];
        const decidedVersions = priorVersions.map((entry, index) =>
          index === priorVersions.length - 1
            ? {
                ...entry,
                status: statusAfterDecision,
                review_status: statusAfterDecision,
                note: noteOverride || entry.note || "",
                review_note: noteOverride || entry.review_note || "",
                updated_at: new Date().toISOString(),
              }
            : entry,
        );
        const nextForm = {
          ...current,
          ...updated,
          status: statusAfterDecision,
          review_note:
            updated.review_note || noteOverride || current.review_note,
          updated_at:
            updated.updated_at ||
            updated.reviewed_at ||
            new Date().toISOString(),
          submissions: decidedVersions,
        };
        persistVersions(nextForm, decidedVersions);
        return nextForm;
      });
      setDecisionForm(null);
      setNote("");
      notify(successMessage, "success");
    } catch {
      notify("Could not reach the server. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDecisionForm = (kind) => {
    setDecisionForm(kind);
    setDecisionReason("");
    setDecisionNote("");
  };
  const submitStructuredDecision = async (event) => {
    event.preventDefault();
    if (!decisionReason)
      return notify("Select a reason before continuing.", "error");
    if (!decisionNote.trim())
      return notify("Add clear direction for the submitter.", "error");
    const isReturn = decisionForm === "return";
    const structuredNote = `Reason: ${decisionReason}\n\nReviewer direction: ${decisionNote.trim()}`;
    await decision(
      isReturn ? "revise" : "reject",
      null,
      isReturn ? "Revision requested." : "Form rejected.",
      structuredNote,
    );
  };
  const submitFacultyFile = async () => {
    if (!submissionFile)
      return notify("Choose a file before sending your submission.", "error");
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("file", submissionFile);
      payload.append("student_id", form.student_id || "");
      payload.append("full_name", form.full_name || form.submitter_name || "");
      payload.append("category", form.category || form.document_type || "");
      payload.append("filing_date", form.filing_date || "");
      payload.append("college_year", form.college_year || "");
      payload.append("section", form.section || "");
      payload.append("original_id", form.id);
      if (submissionNote.trim()) payload.append("note", submissionNote.trim());

      const response = await fetch(`${API}/api/forms/${form.id}/resubmit`, {
        method: "POST",
        headers,
        body: payload,
      });
      if (!response.ok) {
        let message = `Submission failed (${response.status}).`;
        try {
          const data = await response.clone().json();
          message = data.message || data.error || message;
        } catch {}
        notify(message, "error");
        return;
      }
      let data = {};
      try {
        data = await response.json();
      } catch {}
      const updated = data.form || data;
      const responseSubmission =
        data.submission ||
        data.latest_submission ||
        data.submission_record ||
        data.version ||
        data.file ||
        null;
      setForm((current) => {
        const persistedSubmissions =
          [
            updated.submissions,
            updated.submitted_files,
            updated.submission_files,
            updated.versions,
            updated.version_history,
            updated.submission_versions,
          ].find((items) => Array.isArray(items) && items.length) || [];
        const recordedCurrentSubmissions =
          [
            current.submissions,
            current.submitted_files,
            current.submission_files,
            current.versions,
            current.version_history,
            current.submission_versions,
          ].find((items) => Array.isArray(items)) || [];
        const currentFileValue =
          current.file_url ||
          current.file_path ||
          current.attachment_url ||
          current.uploaded_file;
        const currentSubmissions = recordedCurrentSubmissions.length
          ? recordedCurrentSubmissions
          : currentFileValue || current.file_name
            ? [
                {
                  id: `record-${current.id}-${currentFileValue || current.file_name}`,
                  file_name: current.file_name,
                  file_url: current.file_url || current.file_path || "",
                  file_path: current.file_path || "",
                  size: current.file_size,
                  file_size: current.file_size,
                  status: current.status,
                  note: current.review_note,
                  submission_note: current.submission_note || "",
                  submitted_at:
                    current.submitted_at ||
                    current.updated_at ||
                    current.filing_date ||
                    current.created_at,
                  created_at:
                    current.submitted_at ||
                    current.updated_at ||
                    current.filing_date ||
                    current.created_at,
                  is_current: true,
                },
              ]
            : [];
        const returnedFileName = versionFileName(responseSubmission);
        const returnedFileUrl = versionFileUrl(responseSubmission);
        const formReturnedFileName = versionFileName(updated);
        const formReturnedFileUrl = versionFileUrl(updated);
        const submittedFileUrl =
          returnedFileUrl ||
          (formReturnedFileName === submissionFile.name
            ? formReturnedFileUrl
            : "");
        const submittedAt =
          responseSubmission?.submitted_at ||
          responseSubmission?.created_at ||
          responseSubmission?.updated_at ||
          new Date().toISOString();
        const nextSubmission = {
          id:
            responseSubmission?.submission_id ||
            responseSubmission?.version_id ||
            responseSubmission?.id ||
            `local-${submittedAt}-${submissionFile.name}`,
          file_name: submissionFile.name,
          file_url: submittedFileUrl,
          file_path: submittedFileUrl,
          size: versionFileSize(responseSubmission) || submissionFile.size,
          file_size: versionFileSize(responseSubmission) || submissionFile.size,
          status: updated.status || "Pending",
          note:
            updated.review_note || submissionNote.trim() || current.review_note,
          submission_note:
            updated.submission_note || submissionNote.trim() || "",
          submitted_at: submittedAt,
          created_at: submittedAt,
          is_current: true,
        };
        const nextVersions = versionRecords(
          currentSubmissions,
          persistedSubmissions,
          readPersistedVersions(current),
          [nextSubmission],
        );
        persistVersions(current, nextVersions);
        return {
          ...current,
          ...updated,
          file_name: submissionFile.name,
          file_url: submittedFileUrl || "",
          file_path: submittedFileUrl || "",
          status: updated.status || "Pending",
          review_note:
            updated.review_note || submissionNote.trim() || current.review_note,
          submissions: nextVersions,
        };
      });
      setSubmissionFile(null);
      setSubmissionNote("");
      setVersion(null);
      notify("Submission sent to the review queue.", "success");
    } catch {
      notify("Could not reach the server. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const withdrawFacultySubmission = async () => {
    setWithdrawing(true);
    try {
      const response = await fetch(`${API}/api/forms/${form.id}/withdraw`, {
        method: "POST",
        headers,
      });
      if (!response.ok) {
        let message = `Withdrawal failed (${response.status}).`;
        try {
          const data = await response.clone().json();
          message = data.message || data.error || message;
        } catch {}
        notify(message, "error");
        return;
      }
      let data = {};
      try {
        data = await response.json();
      } catch {}
      const updated = data.form || data;
      setForm((current) => ({
        ...current,
        ...updated,
        file_name: "",
        file_url: "",
        file_path: "",
        attachment_url: "",
        status: updated.status || "Draft",
      }));
      setSubmissionFile(null);
      setSubmissionNote("");
      setVersion(null);
      notify(
        "Submission withdrawn. You can now submit a different file.",
        "success",
      );
    } catch {
      notify("Could not reach the server. Please try again.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading)
    return (
      <div className="doc-shell">
  
        <main className="doc-main">
         
          <div className="doc-state">Loading document details…</div>
        </main>
      </div>
    );
  if (loadError || !form)
    return (
      <div className="doc-shell">

        <main className="doc-main">
         
          <div className="doc-state">
            <div>
              <b>Document unavailable</b>
              <p>This form could not be found.</p>
              <button
                className="doc-solid"
                type="button"
                onClick={() => navigate(-1)}
              >
                Back to Review Queue
              </button>
            </div>
          </div>
        </main>
      </div>
    );

  const user = currentUser();
  const isFacultyView = !["admin", "program_chair"].includes(user.role);
  const title =
    form.file_name || form.title || form.tracking_id || `Form #${form.id}`;
  const tracking = form.tracking_id || `FORM-${form.id}`;
  const submitter =
    form.submitter_name || form.full_name || "Faculty submitter";
  const reviewer = isFacultyView
    ? form.reviewer_name || form.current_owner || "Program Chair"
    : user.full_name || user.username || "Program Chair (You)";
  const rawStatus = form.status || "Pending";
  const status = displayStatus(rawStatus);
  const category = form.category || form.document_type || "Academic form";
  const submitted = form.filing_date || form.date || form.created_at;
  const deadline = form.review_due || form.deadline || form.due_date;
  const submittedFileValue =
    form.file_url ||
    form.file_path ||
    form.attachment_url ||
    form.uploaded_file;
  const hasSubmittedFile = Boolean(submittedFileValue || form.file_name);
  const isRevision = /revision|returned/i.test(rawStatus);
  const canSubmitReplacement = isFacultyView && isRevision;
  let valueMap = null;
  try {
    valueMap =
      typeof form.field_values === "string"
        ? JSON.parse(form.field_values)
        : form.field_values;
  } catch {}
  let fields = valueMap ? Object.entries(valueMap) : [];
  const template = categories.find((item) => item.name === form.category);
  const attachmentNames = new Set(
    (template?.formFields || []).filter(isFileField).map((field) => field.name),
  );
  fields = [
    ...fields.filter(([key]) => !attachmentNames.has(key)),
    ...fields.filter(([key]) => attachmentNames.has(key)),
  ];
  const mergedVersions = versionRecords(
    form.submissions,
    form.submitted_files,
    form.submission_files,
    form.versions,
    form.version_history,
    form.submission_versions,
    serverLineage,
    readPersistedVersions(form),
  );
  const versions = mergedVersions.length
    ? mergedVersions
    : hasSubmittedFile
      ? versionRecords([
          {
            id: "current",
            file_name: form.file_name,
            file_url: submittedFileValue,
            size: form.file_size,
            status,
            note: form.review_note,
            submitted_at: form.updated_at || submitted,
            created_at: form.updated_at || submitted,
            is_current: true,
          },
        ])
      : [];
  const activeVersion = version || versions[versions.length - 1] || null;
  const activeFileValue = activeVersion
    ? versionFileUrl(activeVersion)
    : submittedFileValue;
  const activeFileName = activeVersion
    ? versionFileName(activeVersion)
    : form.file_name;
  const url = activeFileValue ? fileUrl(activeFileValue) : "";
  const extension = (activeFileName || activeFileValue || "")
    .split(".")
    .pop()
    .toLowerCase();
  const pdf = extension === "pdf";
  const image = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
  const pageCount =
    Number(activeVersion?.page_count || form.page_count || form.pages) || 1;
  const fileMeta = `${extension ? extension.toUpperCase() : "FILE"}${versionFileSize(activeVersion) || form.file_size ? ` • ${versionFileSize(activeVersion) || form.file_size}` : ""}`;
  const audits = Array.isArray(form.audit_trail || form.audit || form.history)
    ? form.audit_trail || form.audit || form.history
    : [
        {
          id: "submitted",
          action: "Form submitted",
          user: submitter,
          timestamp: submitted,
          detail: "Initial submission received by PATH.",
        },
        {
          id: "assigned",
          action: "Review assigned",
          user: reviewer,
          timestamp: submitted,
          detail: "Document is currently in the review workspace.",
        },
        {
          id: "status",
          action: status,
          user: reviewer,
          timestamp: form.updated_at,
          detail: form.review_note || "Latest workflow status recorded.",
        },
      ];
  const comments = Array.isArray(form.comments || form.review_comments)
    ? form.comments || form.review_comments
    : [];
  const approved = /approved/i.test(status);
  const reviewStep = approved ? 3 : 2;
  const elapsed =
    deadline && submitted
      ? Math.max(
          8,
          Math.min(
            100,
            Math.round(
              ((Date.now() - new Date(submitted).getTime()) /
                Math.max(
                  1,
                  new Date(deadline).getTime() - new Date(submitted).getTime(),
                )) *
                100,
            ),
          ),
        )
      : 38;
  const generateBrief = () => {
    const details = fields
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${String(value || "—")}`)
      .join(" · ");
    setBrief(
      `This ${category.toLowerCase()} was submitted by ${submitter}${submitted ? ` on ${stamp(submitted)}` : ""}. Check the current evidence and ${details || "the submitted details"} before you record a decision.`,
    );
  };
  const share = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      notify("Document link copied to clipboard.");
    } catch {
      notify("Copy the browser URL to share this record.");
    }
  };
  const readerToolbar = (
    <div className="doc-reader-toolbar">
      <div className="doc-reader-group">
        <span className="doc-reader-menu">☰</span>
        <b>1</b>
        <span>/ {pageCount}</span>
        <i />
        <button
          type="button"
          onClick={() => setZoom((value) => Math.max(70, value - 10))}
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setZoom((value) => Math.min(140, value + 10))}
        >
          +
        </button>
        <i />
        <span className="doc-reader-document">▧</span>
        <button type="button" onClick={() => setZoom(100)}>
          ⟳
        </button>
      </div>
      <div className="doc-reader-group">
        <span>⌁</span>
        <button type="button" onClick={() => setZoom(100)}>
          ↶
        </button>
        <button type="button" onClick={() => setZoom(100)}>
          ↷
        </button>
        <i />
        {url && (
          <button type="button" onClick={() => window.open(url, "_blank")}>
            ⇩
          </button>
        )}
        {url && (
          <button type="button" onClick={() => window.open(url, "_blank")}>
            ▣
          </button>
        )}
        <span>⋮</span>
      </div>
    </div>
  );

  return (
    <div className="doc-shell">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap');*{box-sizing:border-box}.doc-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#42354b;font-family:'DM Sans',sans-serif}.doc-main{flex:1;min-width:0}.doc-page{max-width:none;margin:auto;padding:34px 28px 48px}@media(min-width:1100px){.doc-page{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.doc-back{border:0;background:none;padding:0;color:#7142c4;font-size:12px;font-weight:800;cursor:pointer}.doc-back span{color:#aaa0ae;font-weight:500}.doc-hero{display:flex;justify-content:space-between;align-items:center;gap:22px;margin-top:22px;padding:0 14px 20px;border-bottom:1px solid #e8e1ee}.doc-id{display:flex;align-items:center;gap:14px;min-width:0}.doc-file{display:grid;place-items:center;flex:0 0 auto;width:46px;height:46px;border:1px solid #ded1f4;border-radius:12px;background:#eee7fd;color:#7544c5;font-size:21px}.doc-kicker,.doc-label{display:flex;align-items:center;gap:7px;color:#9c91a4;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.doc-kicker{gap:10px;font-size:12px;letter-spacing:.12em}.doc-label i{width:6px;height:6px;border-radius:50%;background:#b99eea}.doc-id h1{margin:6px 0 4px;overflow:hidden;color:#302638;font-family:'Manrope',sans-serif;font-size:clamp(26px,3.1vw,38px);letter-spacing:-.055em;line-height:1;text-overflow:ellipsis;white-space:nowrap}.doc-id p{margin:0;color:#958a9b;font-size:12px}.doc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.doc-btn,.doc-solid{display:inline-flex;align-items:center;justify-content:center;min-height:33px;border:1px solid #e6dfee;border-radius:7px;padding:0 11px;background:#fff;color:#756a7e;font-size:12px;font-weight:800;cursor:pointer;text-decoration:none}.doc-solid{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 7px 15px rgba(124,58,237,.24)}.doc-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #e8e1ee;border-top:0;background:#fff}.doc-meta>div{min-width:0;padding:14px 16px;border-right:1px solid #eee9f1}.doc-meta>div:last-child{border-right:0}.doc-meta span{display:block;color:#aaa0ae;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}.doc-meta strong{display:block;overflow:hidden;margin-top:6px;color:#5b4d64;font-family:'Manrope',sans-serif;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.doc-meta strong.doc-person{display:flex;align-items:center;gap:6px}.doc-person i,.doc-avatar,.doc-owner-avatar{display:grid;place-items:center;background:#eee7fd;color:#7244c1;font-size:10px;font-weight:800}.doc-person i{width:18px;height:18px;border-radius:6px}.doc-layout{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(280px,.78fr);gap:16px;margin-top:16px}.doc-panel{border:1px solid #e5deed;border-radius:11px;background:#fff;box-shadow:0 10px 26px rgba(57,36,93,.04)}.doc-panel h2{margin:0;color:#46384f;font-family:'Manrope',sans-serif;font-size:19px;letter-spacing:-.045em}.doc-status,.doc-summary,.doc-comments,.doc-history,.doc-audit,.doc-fields,.doc-decision,.doc-sla,.doc-owners{padding:19px}.doc-head,.doc-status-head,.doc-sla-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-top:7px}.doc-head,.doc-sla-top{margin-top:0}.doc-pill{display:inline-flex;align-items:center;gap:5px;border-radius:5px;padding:4px 7px;background:#fff5df;color:#aa7928;font-size:11px;font-weight:800}.doc-pill i{width:5px;height:5px;border-radius:50%;background:currentColor}.doc-pill.violet{background:#f0e9fc;color:#7543c7}.doc-pill.success{background:#e8f5ee;color:#478c6e}.doc-pill.danger{background:#fff0eb;color:#b86f5c}.doc-timeline{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;align-items:center;gap:10px;margin:30px 16px 26px}.doc-step{display:flex;align-items:center;flex-direction:column;gap:6px;color:#a69bab;font-size:11px;text-align:center}.doc-step b{display:grid;width:27px;height:27px;place-items:center;border:1px solid #e6e0ec;border-radius:50%;background:#fff;color:#9c91a4;font-size:11px}.doc-step.active{color:#7543c7;font-weight:800}.doc-step.active b{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 0 0 5px #f0e9fc}.doc-step.complete b{border-color:#9b78e3;background:#f3ecff;color:#7543c7}.doc-line{height:1px;background:#e8e2ed}.doc-line.complete{background:#b692ed}.doc-callout{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px;border:1px solid #e4daf4;border-radius:8px;background:#fbf9ff}.doc-callout>div{display:flex;gap:9px;align-items:flex-start}.doc-callout b{display:grid;flex:0 0 auto;width:27px;height:27px;place-items:center;border-radius:8px;background:#eee7fd;color:#7543c7}.doc-callout strong{display:block;color:#65576e;font-size:12px}.doc-callout p{margin:3px 0 0;color:#9b90a1;font-size:11px}.doc-callout button{border:0;background:none;color:#7042c3;font-size:11px;font-weight:800;cursor:pointer}.doc-preview{margin-top:16px;overflow:hidden}.doc-preview-head{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:18px 20px;border-bottom:1px solid #f0edf4}.doc-preview-head p{margin:4px 0 0;color:#a299a8;font-size:11px}.doc-preview-actions,.doc-controls div{display:flex;align-items:center;gap:7px}.doc-preview-actions button,.doc-controls button,.doc-head button{display:inline-flex;align-items:center;justify-content:center;min-height:28px;border:1px solid #e5dced;border-radius:7px;padding:0 8px;background:#fff;color:#7a4bc2;font-size:11px;font-weight:800;cursor:pointer}.doc-controls{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;border-bottom:1px solid #f0edf4;color:#9b91a1;font-size:11px}.doc-controls button{display:grid;width:25px;height:25px;padding:0}.doc-canvas{min-height:380px;padding:28px;background:#f5f2f8}.doc-paper{min-height:325px;max-width:620px;margin:0 auto;padding:38px 46px;background:#fff;box-shadow:0 8px 20px rgba(45,29,66,.1);transform-origin:top center}.doc-paper-top{display:flex;justify-content:space-between;border-bottom:1px solid #dbc8f8;padding-bottom:12px;color:#9387a0;font-size:10px;letter-spacing:.08em}.doc-paper h3{margin:28px 0 5px;color:#3f3248;font-family:'Manrope',sans-serif;font-size:22px;letter-spacing:-.055em}.doc-paper p{margin:0;color:#9e93a3;font-size:11px}.doc-paper-line{height:7px;margin-top:15px;border-radius:5px;background:#ede8f3}.doc-paper-line.wide{width:74%}.doc-paper-line.mid{width:51%}.doc-paper-note{margin-top:27px;padding:12px;border-left:2px solid #a882ec;background:#faf8fe;color:#82758e;font-size:11px;line-height:1.55}.doc-frame{min-height:380px;background:#f5f2f8}.doc-frame iframe{width:100%;min-height:520px;border:0;background:#fff}.doc-image{display:grid;min-height:380px;place-items:center;background:#15121d}.doc-image img{display:block;max-width:100%;max-height:620px;object-fit:contain}.doc-summary,.doc-comments{margin-top:16px}.doc-summary p{margin:14px 0 0;color:#82768c;font-size:12px;line-height:1.65}.doc-empty-note{display:flex;align-items:center;gap:9px;margin-top:14px;padding:12px;border:1px dashed #ddd2ef;border-radius:8px;background:#fbf9ff;color:#94889d;font-size:12px;line-height:1.5}.doc-empty-note i{display:grid;flex:0 0 auto;width:25px;height:25px;place-items:center;border-radius:7px;background:#eee7fd;color:#7543c7}.doc-count,.doc-badge{display:grid;min-width:18px;height:18px;place-items:center;border-radius:5px;background:#f0e9fc;color:#7543c7;font-size:11px;font-weight:800}.doc-comment{display:flex;gap:9px;margin-top:15px}.doc-avatar{flex:0 0 auto;width:25px;height:25px;border-radius:7px}.doc-comment strong{display:block;color:#65576e;font-size:12px}.doc-comment strong span{margin-left:5px;color:#aaa0ae;font-size:11px;font-weight:500}.doc-comment p{margin:4px 0 0;color:#80758a;font-size:12px;line-height:1.55}.doc-comment-empty{margin:16px 0 0;color:#a69bab;font-size:12px}.doc-workflow{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(0,.98fr);gap:16px;margin-top:16px}.doc-history,.doc-audit{margin-top:0}.doc-version-list{display:flex;flex-direction:column;gap:8px;margin-top:15px}.doc-version{display:flex;align-items:center;justify-content:space-between;gap:9px;width:100%;border:1px solid #ece5f1;border-radius:8px;padding:10px;background:#fff;color:#6c5e75;text-align:left;cursor:pointer}.doc-version.active{border-color:#bda2ec;background:#fbf9ff;box-shadow:0 0 0 3px #f4effe}.doc-version strong{display:block;color:#5c4d66;font-size:12px}.doc-version span{display:block;margin-top:3px;color:#9e92a2;font-size:11px}.doc-badge{height:auto;padding:3px 5px}.doc-compare{margin-top:14px;border:1px solid #e6dcef;border-radius:8px;overflow:hidden}.doc-compare-head{display:flex;justify-content:space-between;gap:10px;padding:10px 11px;background:#fbf9ff;color:#695b73;font-size:12px;font-weight:800}.doc-compare p{margin:0;padding:12px;color:#9d92a1;font-size:11px;line-height:1.5}.doc-audit-list{position:relative;margin-top:15px;padding-left:19px}.doc-audit-list:before{position:absolute;left:4px;top:5px;bottom:5px;width:1px;background:#e3d8eb;content:''}.doc-audit-item{position:relative;margin-top:14px}.doc-audit-item:first-child{margin-top:0}.doc-audit-item:before{position:absolute;left:-18px;top:3px;width:8px;height:8px;border:2px solid #f8f7ff;border-radius:50%;background:#8b5cf6;box-shadow:0 0 0 1px #cbb8ec;content:''}.doc-audit-item strong{display:block;color:#67596f;font-size:12px}.doc-audit-item span{display:block;margin-top:3px;color:#a196a4;font-size:11px}.doc-audit-item p{margin:5px 0 0;color:#877b91;font-size:11px;line-height:1.45}.doc-sla h3{margin:24px 0 4px;color:#4c3f55;font-family:'Manrope',sans-serif;font-size:21px;letter-spacing:-.05em}.doc-sla p{margin:0;color:#aa7b2e;font-size:12px;font-weight:700}.doc-live{color:#579176;font-size:11px;font-weight:800}.doc-progress{height:7px;margin-top:19px;overflow:hidden;border-radius:99px;background:#eee8f4}.doc-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c3a8f7,#7c3aed)}.doc-progress-meta{display:flex;justify-content:space-between;margin-top:6px;color:#a59aa9;font-size:11px}.doc-sla-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-top:22px;padding-top:15px;border-top:1px solid #f0edf4}.doc-sla-grid span{display:block;color:#aaa0ae;font-size:11px}.doc-sla-grid strong{display:block;margin-top:4px;color:#61546a;font-family:'Manrope',sans-serif;font-size:12px}.doc-owners,.doc-fields,.doc-decision{margin-top:16px}.doc-owner-line{position:relative;display:flex;gap:10px;margin-top:15px}.doc-owner-line:not(:last-child):after{position:absolute;left:11px;top:25px;bottom:-15px;width:1px;background:#e5ddeb;content:''}.doc-owner-avatar{flex:0 0 auto;width:23px;height:23px;border-radius:7px}.doc-owner-copy strong{display:block;color:#65576e;font-size:12px}.doc-owner-copy span{display:block;margin-top:2px;color:#a69bab;font-size:11px}.doc-fields{display:flex;flex-direction:column;gap:9px}.doc-field{display:flex;justify-content:space-between;gap:12px;padding-bottom:9px;border-bottom:1px solid #f0edf4}.doc-field:last-child{padding-bottom:0;border-bottom:0}.doc-field span{color:#9c91a4;font-size:11px;font-weight:800}.doc-field strong{max-width:56%;overflow-wrap:anywhere;color:#65576e;font-size:12px;text-align:right}.doc-decision{border-color:#e1d2f7;background:linear-gradient(155deg,#fff 25%,#fbf9ff)}.doc-decision h2{margin-top:6px}.doc-decision-note{margin-top:15px;padding:11px;border-left:2px solid #d98a71;border-radius:0 7px 7px 0;background:#fff5f1;color:#876358;font-size:12px;line-height:1.55}.doc-decision label{display:block;margin-top:15px;color:#65576e;font-size:12px;font-weight:800}.doc-decision textarea{width:100%;min-height:105px;margin-top:7px;resize:vertical;border:1px solid #e5deed;border-radius:8px;padding:10px;color:#5b4e64;font-family:'DM Sans',sans-serif;font-size:12px;outline:0}.doc-decision textarea:focus{border-color:#bda1ec;box-shadow:0 0 0 3px #f4effe}.doc-decision-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px}.doc-decision-actions button{display:inline-flex;min-height:34px;align-items:center;justify-content:center;gap:5px;border:1px solid #e6dfee;border-radius:7px;background:#fff;color:#756a7e;font-size:12px;font-weight:800;cursor:pointer}.doc-decision-actions .approve{border-color:#7c3aed;background:#7c3aed;color:#fff}.doc-decision-actions .return{color:#a87b35;border-color:#eee0b9;background:#fffdf7}.doc-decision-actions .reject{color:#ad695f;border-color:#f1dedb}.doc-decision-actions button:disabled{cursor:not-allowed;opacity:.6}.doc-toasts{position:fixed;top:20px;right:20px;z-index:2000;display:flex;flex-direction:column;gap:10px}.doc-toast{display:flex;align-items:center;gap:12px;min-width:270px;max-width:360px;border-radius:10px;padding:12px 14px;box-shadow:0 12px 28px rgba(45,29,66,.2);color:#fff;font-size:13px;font-weight:700}.doc-toast.info{background:#7c3aed}.doc-toast.success{background:#3b8b68}.doc-toast.error{background:#bf5f57}.doc-toast span{flex:1;line-height:1.4}.doc-toast button{border:0;background:none;color:rgba(255,255,255,.8);font-size:18px;cursor:pointer}.doc-state{display:grid;min-height:calc(100vh - 64px);place-items:center;padding:40px;color:#a198a7;font-size:14px;text-align:center}.doc-state p{margin:7px 0 15px}@media(max-width:1060px){.doc-layout{grid-template-columns:1fr}.doc-side{display:grid;grid-template-columns:1fr 1fr;gap:16px}.doc-side .doc-decision,.doc-side .doc-fields{grid-column:1/-1}.doc-owners{margin-top:0}}@media(max-width:720px){.doc-page{padding:22px 14px 34px}.doc-hero{align-items:flex-start;flex-direction:column}.doc-actions{justify-content:flex-start}.doc-meta{grid-template-columns:1fr 1fr}.doc-meta>div:nth-child(2){border-right:0}.doc-meta>div:nth-child(-n+2){border-bottom:1px solid #eee9f1}.doc-side,.doc-workflow{grid-template-columns:1fr}.doc-side .doc-decision,.doc-side .doc-fields{grid-column:auto}.doc-id h1{font-size:28px}.doc-timeline{margin-right:0;margin-left:0;gap:5px}.doc-step{font-size:10px}.doc-preview-head{align-items:flex-start;flex-direction:column}.doc-canvas{padding:16px}.doc-paper{padding:28px 25px}.doc-frame iframe{min-height:390px}.doc-toasts{top:12px;right:12px;left:12px}.doc-toast{max-width:none;min-width:0}.doc-decision-actions{grid-template-columns:1fr}}`}</style>
      <style>{`.doc-preview{border-color:#e5deed}.doc-preview-head{padding:18px 20px 16px}.doc-preview-head h2{margin-top:6px;font-size:19px}.doc-preview-meta{display:flex;align-items:center;gap:10px;color:#a69bab;font-size:11px;font-weight:700;white-space:nowrap}.doc-preview-meta span{display:inline-flex;align-items:center;gap:5px}.doc-preview-meta span:before{width:7px;height:9px;border:1px solid #bfb4c9;border-radius:1px;content:''}.doc-ai-button{border-color:#d8c4f3!important;background:#fbf9ff!important;color:#7543c7!important;box-shadow:0 3px 8px rgba(124,58,237,.08)}.doc-controls{min-height:42px;padding:8px 20px}.doc-controls>span{font-size:11px}.doc-controls button{width:26px;height:26px;border-color:#e7e0ed;font-size:14px}.doc-controls button[disabled]{color:#cfc6d6;cursor:not-allowed}.doc-controls strong{min-width:31px;text-align:center;color:#7543c7;font-size:11px}.doc-canvas{min-height:368px;padding:21px 32px;background:#f6f3f8}.doc-paper{min-height:328px;max-width:620px;padding:29px 28px 18px}.doc-paper-top{padding-bottom:10px}.doc-paper h3{margin:24px 0 5px;font-size:21px}.doc-paper-line{height:6px;margin-top:12px}.doc-paper-line.full{width:100%}.doc-paper-line.short{width:44%}.doc-paper-lines{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;margin-top:20px}.doc-paper-lines .doc-paper-line{width:100%;margin-top:0}.doc-paper-abstract{margin-top:23px;padding:11px;border-left:2px solid #a882ec;background:#faf8fe;color:#82758e;font-size:11px;line-height:1.55}.doc-paper-abstract strong{display:block;margin-bottom:3px;color:#5d5267;font-size:11px}.doc-paper-footer{display:flex;justify-content:space-between;margin-top:27px;padding-top:10px;border-top:1px solid #eee8f3;color:#a399ad;font-size:10px}.doc-preview-footer{padding:10px 20px;color:#a99fac;font-size:11px}.doc-frame,.doc-image{min-height:368px}.doc-frame iframe{min-height:500px}@media(max-width:720px){.doc-preview-meta{align-items:flex-end;flex-direction:column}.doc-canvas{padding:16px}.doc-paper{padding:24px 20px}.doc-paper-lines{gap:9px 15px}.doc-preview-footer{padding:10px 14px}}`}</style>
      <style>{`.doc-preview{border-color:#e1dbe9}.doc-reader-stage{display:flex;min-height:500px;align-items:center;flex-direction:column;padding:18px 18px 12px;background:#f4f1fa}.doc-reader-toolbar{display:flex;align-items:center;justify-content:space-between;width:min(100%,456px);min-height:52px;padding:0 13px;border:1px solid #747477;border-bottom:0;border-radius:7px 7px 0 0;background:#363638;color:#e7e7e9;box-shadow:0 4px 10px rgba(28,24,35,.22);font-size:13px}.doc-reader-group{display:flex;align-items:center;gap:10px}.doc-reader-group b{display:grid;width:18px;height:19px;place-items:center;border-radius:2px;background:#151517;color:#fff;font-size:12px}.doc-reader-group i{width:1px;height:18px;background:#66666b}.doc-reader-group button{border:0;background:transparent;color:#e7e7e9;font-size:18px;line-height:1;cursor:pointer}.doc-reader-menu{font-size:13px}.doc-reader-document{font-size:14px}.doc-reader-scroll{width:min(100%,456px);height:442px;overflow:auto;background:#fff;box-shadow:0 7px 16px rgba(45,33,61,.16);scrollbar-color:#8b8b8b #f3f3f3;scrollbar-width:thin}.doc-reader-scroll iframe{display:block;width:100%;min-height:650px;border:0;background:#fff}.doc-reader-image{display:grid;place-items:center;background:#141317}.doc-reader-image img{max-width:100%;max-height:100%;object-fit:contain}.doc-reader-scroll .doc-paper{width:100%;min-height:650px;max-width:none;margin:0;padding:53px 61px 22px;box-shadow:none}.doc-reader-scroll .doc-paper h3{font-family:Georgia,serif;font-size:20px;letter-spacing:-.02em}.doc-reader-scroll .doc-paper p,.doc-reader-scroll .doc-paper-abstract{font-family:Georgia,serif}.doc-reader-bottom{display:flex;align-items:center;gap:15px;min-height:26px;padding:0 15px;border-radius:0 0 16px 16px;background:#473574;color:#fff;box-shadow:0 5px 12px rgba(60,41,102,.2);font-size:12px}.doc-reader-bottom span:first-child{display:grid;width:18px;height:18px;place-items:center;border-radius:50%;background:#5e4a92}.doc-preview-footer{display:none}@media(max-width:720px){.doc-reader-stage{min-height:440px;padding:12px 8px 9px}.doc-reader-toolbar{min-height:45px;padding:0 9px}.doc-reader-group{gap:7px}.doc-reader-group i,.doc-reader-group span:nth-last-child(2){display:none}.doc-reader-scroll{height:380px}.doc-reader-scroll .doc-paper{min-height:560px;padding:42px 31px 20px}.doc-reader-bottom{min-height:23px}}`}</style>
      <style>{`.doc-preview .doc-reader-stage{min-height:684px;padding:20px 16px 13px}.doc-preview .doc-reader-toolbar,.doc-preview .doc-reader-scroll{width:100%;max-width:780px}.doc-preview .doc-reader-toolbar{min-height:54px}.doc-preview .doc-reader-scroll{height:600px}.doc-preview .doc-reader-scroll iframe{min-height:900px}.doc-preview .doc-reader-scroll .doc-paper{min-height:900px;padding:66px 94px 28px}.doc-preview .doc-reader-bottom{min-height:29px}@media(max-width:900px){.doc-preview .doc-reader-stage{min-height:592px;padding:15px 12px 11px}.doc-preview .doc-reader-scroll{height:510px}.doc-preview .doc-reader-scroll .doc-paper{min-height:760px;padding:52px 58px 24px}}@media(max-width:720px){.doc-preview .doc-reader-stage{min-height:488px;padding:12px 8px 9px}.doc-preview .doc-reader-scroll{height:414px}.doc-preview .doc-reader-scroll .doc-paper{min-height:650px;padding:42px 31px 20px}}`}</style>
      <style>{`.doc-preview .doc-reader-stage{min-height:720px;padding:18px 18px 13px}.doc-preview .doc-reader-toolbar,.doc-preview .doc-reader-scroll{width:min(100%,456px);max-width:456px}.doc-preview .doc-reader-toolbar{min-height:52px}.doc-preview .doc-reader-scroll{height:640px}.doc-preview .doc-reader-scroll iframe{min-height:940px}.doc-preview .doc-reader-scroll .doc-paper{min-height:940px;padding:58px 61px 24px}.doc-preview .doc-reader-bottom{min-height:27px}@media(max-width:900px){.doc-preview .doc-reader-stage{min-height:638px;padding:15px 12px 11px}.doc-preview .doc-reader-scroll{height:556px}.doc-preview .doc-reader-scroll .doc-paper{min-height:820px;padding:50px 53px 22px}}@media(max-width:720px){.doc-preview .doc-reader-stage{min-height:530px;padding:12px 8px 9px}.doc-preview .doc-reader-scroll{height:452px}.doc-preview .doc-reader-scroll .doc-paper{min-height:690px;padding:42px 31px 20px}}`}</style>
      <style>{`.doc-reader-pdf{overflow:hidden;scrollbar-width:none}.doc-reader-pdf::-webkit-scrollbar{display:none}.doc-reader-pdf iframe{height:100%;min-height:0!important;overflow:hidden}`}</style>
      <style>{`.doc-kicker,.doc-label{font-weight:800;color:#958a9d}.doc-id h1{font-weight:800;letter-spacing:-.062em}.doc-id p{font-weight:600;color:#8f8498}.doc-meta span{font-weight:800;color:#9b90a2}.doc-meta strong{font-weight:800;color:#46384f}.doc-meta strong.doc-person{font-weight:800}.doc-status h2{font-weight:800;color:#372b40}.doc-status .doc-label{font-weight:800}.doc-status .doc-label span{font-weight:700;letter-spacing:0;text-transform:none;color:#4b9778}.doc-pill{font-weight:800}.doc-owner-copy strong,.doc-field strong{font-weight:800}`}</style>
      <style>{`.doc-preview-head p{font-weight:800;color:#5b4e64}.doc-panel h2,.doc-summary h2,.doc-comments h2,.doc-history h2,.doc-audit h2,.doc-owners h2,.doc-decision h2,.doc-sla h2{font-weight:800}.doc-sla h3{font-weight:800}.doc-sla p,.doc-sla-grid strong{font-weight:800}.doc-decision label{font-weight:800}.doc-compare-head{font-weight:800}.doc-empty-note strong{font-weight:800}`}</style>
      <style>{`.doc-decision-intro{margin:8px 0 16px;color:#877a90;font-size:12px;line-height:1.55}.doc-optional{margin-left:4px;color:#9b90a2;font-size:11px;font-weight:600;text-transform:none}.doc-decision-actions .approve{grid-column:1/-1}.doc-decision-actions .return,.doc-decision-actions .reject{min-height:38px}.doc-decision-actions .return{border-color:#e9d7a6;background:#fffcf4}.doc-decision-actions .reject{border-color:#edcfcb;background:#fff7f5}.doc-decision-modal-backdrop{position:fixed;z-index:1500;inset:0;display:grid;place-items:center;padding:20px;background:rgba(43,30,59,.38);backdrop-filter:blur(5px)}.doc-decision-modal{position:relative;width:min(100%,560px);max-height:calc(100vh - 40px);overflow:auto;border:1px solid #e3d8ed;border-radius:16px;padding:27px;background:#fff;box-shadow:0 24px 65px rgba(42,25,63,.28);color:#51435b}.doc-decision-modal.return{border-top:4px solid #c59335}.doc-decision-modal.reject{border-top:4px solid #bd665c}.doc-decision-modal-close{position:absolute;top:14px;right:15px;display:grid;width:29px;height:29px;place-items:center;border:1px solid #e6dfee;border-radius:8px;background:#fff;color:#8e8198;font-size:20px;line-height:1;cursor:pointer}.doc-decision-modal-kicker{display:flex;align-items:center;gap:8px;color:#8b7e95;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.doc-decision-modal-kicker span{display:grid;width:25px;height:25px;place-items:center;border-radius:7px;background:#f4ebff;color:#7742c6;font-size:15px}.doc-decision-modal.reject .doc-decision-modal-kicker span{background:#fff0ed;color:#b75f54}.doc-decision-modal h2{margin:15px 0 6px;color:#382b42;font-family:'Manrope',sans-serif;font-size:24px;font-weight:800;letter-spacing:-.05em}.doc-decision-modal>p{margin:0;color:#887b91;font-size:12px;line-height:1.6}.doc-decision-modal-record{display:flex;justify-content:space-between;gap:12px;margin:18px 0;padding:11px 12px;border:1px solid #ede6f2;border-radius:9px;background:#faf8fc;color:#6d5f75;font-size:12px}.doc-decision-modal-record span{overflow:hidden;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.doc-decision-modal-record b{flex:0 0 auto;color:#9a8da2;font-size:11px}.doc-decision-modal label{display:block;margin-top:16px;color:#605169;font-size:12px;font-weight:800}.doc-decision-modal label em{margin-left:4px;color:#b85f55;font-size:11px;font-style:normal;font-weight:800}.doc-decision-modal select,.doc-decision-modal textarea{width:100%;margin-top:7px;border:1px solid #ded4e7;border-radius:8px;padding:10px 11px;background:#fff;color:#55475f;font-family:'DM Sans',sans-serif;font-size:12px;outline:0}.doc-decision-modal select{height:39px;cursor:pointer}.doc-decision-modal textarea{min-height:110px;resize:vertical;line-height:1.55}.doc-decision-modal select:focus,.doc-decision-modal textarea:focus{border-color:#b79ae6;box-shadow:0 0 0 3px #f3edff}.doc-decision-modal-selection{margin-top:9px;padding:9px 10px;border-left:2px solid #9d78dd;border-radius:0 7px 7px 0;background:#faf8fd}.doc-decision-modal-selection span{display:block;color:#9d91a5;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.doc-decision-modal-selection strong{display:block;margin-top:3px;color:#62536c;font-size:12px;font-weight:800}.doc-decision-modal-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px;margin-top:19px}.doc-decision-modal-actions button{min-height:38px;border:1px solid #e1d7e9;border-radius:8px;background:#fff;color:#75677e;font-size:12px;font-weight:800;cursor:pointer}.doc-decision-modal-actions button[type='submit']{border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 7px 14px rgba(124,58,237,.2)}.doc-decision-modal.reject .doc-decision-modal-actions button[type='submit']{border-color:#b75f54;background:#b75f54;box-shadow:0 7px 14px rgba(183,95,84,.2)}.doc-decision-modal-actions button:disabled,.doc-decision-modal-close:disabled{cursor:not-allowed;opacity:.6}@media(max-width:560px){.doc-decision-modal-backdrop{padding:12px}.doc-decision-modal{max-height:calc(100vh - 24px);padding:22px 18px}.doc-decision-modal h2{font-size:21px}.doc-decision-modal-actions{grid-template-columns:1fr}.doc-decision-modal-actions button[type='submit']{grid-row:1}.doc-decision-actions{grid-template-columns:1fr}}`}</style>
      <style>{`.doc-faculty-submission{margin-top:16px;padding:19px;border-color:#dfd2f5;background:linear-gradient(150deg,#fff 18%,#fbf9ff)}.doc-faculty-submission h2{margin-top:6px}.doc-faculty-submission>p{margin:8px 0 0;color:#887b92;font-size:12px;line-height:1.55}.doc-submission-upload{display:grid;place-items:center;min-height:112px;margin-top:16px;border:1.5px dashed #cbb5ef;border-radius:10px;background:#fcfaff;color:#7647b2;text-align:center;cursor:pointer;transition:border-color .16s ease,background .16s ease}.doc-submission-upload:hover{border-color:#7c3aed;background:#f8f4ff}.doc-submission-upload b,.doc-submission-upload span{display:block}.doc-submission-upload b{font-size:12px}.doc-submission-upload span{max-width:210px;margin-top:4px;color:#9b8fa3;font-size:11px;line-height:1.45}.doc-submission-note{width:100%;min-height:78px;margin-top:10px;resize:vertical;border:1px solid #e5deed;border-radius:8px;padding:10px;color:#5b4e64;font-family:'DM Sans',sans-serif;font-size:12px;outline:0}.doc-submission-note:focus{border-color:#bda1ec;box-shadow:0 0 0 3px #f4effe}.doc-submission-primary,.doc-submission-withdraw{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:35px;margin-top:10px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer}.doc-submission-primary{border:1px solid #7c3aed;background:#7c3aed;color:#fff;box-shadow:0 7px 14px rgba(124,58,237,.18)}.doc-submission-primary:disabled,.doc-submission-withdraw:disabled{cursor:not-allowed;opacity:.6}.doc-submitted-file{display:flex;align-items:center;gap:9px;margin-top:16px;padding:11px;border:1px solid #ded1f4;border-radius:9px;background:#fbf9ff}.doc-submitted-file>i{display:grid;flex:0 0 auto;width:29px;height:29px;place-items:center;border-radius:8px;background:#eee7fd;color:#7543c7;font-style:normal}.doc-submitted-file strong,.doc-submitted-file span{display:block}.doc-submitted-file strong{overflow:hidden;color:#5e4e68;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.doc-submitted-file span{margin-top:3px;color:#9b90a1;font-size:11px}.doc-submission-locked{display:flex;gap:8px;margin-top:12px;padding:10px;border-left:2px solid #a882ec;border-radius:0 7px 7px 0;background:#faf8fe;color:#82758e;font-size:11px;line-height:1.5}.doc-submission-withdraw{border:1px solid #edcfcb;background:#fff8f7;color:#a85d55}`}</style>
      <style>{`.doc-lineage-card{overflow:visible}.doc-lineage-copy{margin:12px 0 0;color:#8f839a;font-size:11px;line-height:1.55}.doc-lineage{position:relative;margin-top:21px}.doc-lineage:before{position:absolute;left:15px;top:27px;bottom:27px;width:1px;background:#dfd3ec;content:''}.doc-lineage-row{position:relative;display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:9px;align-items:center;min-height:78px;padding:8px 0}.doc-lineage-version{position:relative;z-index:1;display:grid;width:31px;height:31px;place-items:center;border:1px solid #bea2e8;border-radius:50%;background:#f7f2ff;color:#7543c7;font-size:11px;font-weight:800}.doc-lineage-row.current .doc-lineage-version{border-color:#8b5cf6;background:#eee7fd;box-shadow:0 0 0 4px #fbf9ff}.doc-lineage-main{min-width:0}.doc-lineage-main h3{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0;color:#5a4b64;font-size:12px}.doc-lineage-status{display:inline-flex;border-radius:4px;padding:3px 5px;font-size:10px;font-weight:800;line-height:1}.doc-lineage-status.success{background:#e8f5ee;color:#478c6e}.doc-lineage-status.danger{background:#fff0eb;color:#b86f5c}.doc-lineage-status.violet{background:#f0e9fc;color:#7543c7}.doc-lineage-status.gold{background:#fff5df;color:#aa7928}.doc-lineage-main p{margin:5px 0 0;overflow:hidden;color:#877b91;font-size:11px;line-height:1.45;text-overflow:ellipsis;white-space:nowrap}.doc-lineage-meta{display:flex;align-items:center;gap:5px;min-width:0;margin-top:6px;color:#a196a5;font-size:10px}.doc-lineage-meta span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.doc-lineage-meta i{font-style:normal}.doc-lineage-meta b{color:#7543c7;font-size:10px}.doc-lineage-open{display:flex;align-items:center;gap:7px;border:1px solid #e5ddeb;border-radius:999px;padding:7px 8px 7px 10px;background:#fff;color:#918597;font-size:10px;cursor:pointer}.doc-lineage-open span{display:grid;width:16px;height:16px;place-items:center;border-radius:50%;background:#f0e9fc;color:#7543c7;font-size:11px}@media(max-width:560px){.doc-lineage-row{grid-template-columns:29px minmax(0,1fr)}.doc-lineage-version{width:28px;height:28px}.doc-lineage:before{left:13px}.doc-lineage-open{grid-column:2;justify-self:start;margin-top:-3px}.doc-lineage-main p{white-space:normal}.doc-lineage-copy{font-size:12px}}`}</style>
      <style>{`.doc-faculty-submission{margin-top:16px;padding:21px;border-color:#e1d6f0;background:linear-gradient(135deg,#fff 20%,#fbf9ff)}.doc-faculty-heading{display:flex;align-items:flex-start;gap:10px}.doc-faculty-heading-icon{display:grid;flex:0 0 auto;width:30px;height:30px;place-items:center;border-radius:8px;background:#f0e8ff;color:#7c3aed;font-size:15px}.doc-faculty-heading .doc-label{margin-top:1px}.doc-faculty-heading h2{margin-top:5px;color:#382d43;font-size:19px;font-weight:800}.doc-faculty-intro{margin:13px 0 0;color:#887b92;font-size:12px;line-height:1.55}.doc-submission-upload{display:grid;grid-template-columns:32px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:56px;margin-top:15px;border:1px dashed #cbb4ec;border-radius:9px;padding:8px 12px;background:#fdfbff;color:#7545b8;text-align:left}.doc-submission-upload-icon{display:grid!important;width:30px;height:30px;place-items:center;border-radius:8px;background:#eee5fb;color:#7543c7;font-size:13px;font-weight:800}.doc-submission-upload b{overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.doc-submission-upload span:not(.doc-submission-upload-icon):not(.doc-submission-upload-view){max-width:none;margin-top:2px;color:#998ba4;font-size:10px}.doc-submission-upload-view{color:#7543c7;font-size:13px}.doc-submission-note-label{display:block;margin-top:14px;color:#887b96;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.doc-submission-note{min-height:68px;margin-top:7px;border-color:#e0d9e8;font-size:12px;line-height:1.55}.doc-submission-primary{width:auto;min-height:34px;margin-top:11px;padding:0 13px;border-radius:7px;box-shadow:0 7px 14px rgba(124,58,237,.2)}@media(max-width:560px){.doc-faculty-submission{padding:17px}.doc-faculty-heading h2{font-size:17px}.doc-submission-upload{grid-template-columns:30px minmax(0,1fr) auto;padding:8px 10px}.doc-submission-primary{width:100%}}`}</style>
      <style>{`.doc-approved-notice{display:flex;align-items:flex-start;gap:10px;margin-top:15px;padding:12px;border:1px solid #bfe6cf;border-radius:9px;background:#f3fbf6;color:#4e8066}.doc-approved-notice>span{display:grid;flex:0 0 auto;width:28px;height:28px;place-items:center;border-radius:8px;background:#dff4e7;color:#378259;font-size:14px;font-weight:800}.doc-approved-notice strong{display:block;color:#397552;font-size:12px}.doc-approved-notice p{margin:3px 0 0;color:#6e927c;font-size:11px;line-height:1.5}.doc-approved-reviewer{margin-top:14px}.doc-approved-reviewer p{margin-bottom:0}.doc-faculty-submission .doc-approved-notice+.doc-submitted-file{margin-top:10px}`}</style>
      <Toasts
        items={toasts}
        remove={(toastId) =>
          setToasts((all) => all.filter((item) => item.id !== toastId))
        }
      />

      <main className="doc-main">
 
        <div className="doc-page">
          <button
            type="button"
            className="doc-back"
            onClick={() => navigate(-1)}
          >
            ← Back to Review Queue <span>/ Document details</span>
          </button>
          <section className="doc-hero">
            <div className="doc-id">
              <span className="doc-file">▤</span>
              <div>
                <div className="doc-kicker">
                  ◆ Form record <span>{tracking}</span>
                </div>
                <h1 title={title}>{title}</h1>
                <p>
                  {category} &nbsp;·&nbsp; Submitted by {submitter}
                </p>
              </div>
            </div>
            <div className="doc-actions">
              <button
                type="button"
                className="doc-btn"
                onClick={() => setPreview((value) => !value)}
              >
                {preview ? "Hide inline" : "Read inline"}
              </button>
              {url && (
                <a
                  className="doc-btn"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  download={form.file_name}
                >
                  Download
                </a>
              )}
              <button type="button" className="doc-btn" onClick={share}>
                Share
              </button>
              <button
                type="button"
                className="doc-solid"
                onClick={() =>
                  document
                    .getElementById("review-decision")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
              >
                Review decision
              </button>
            </div>
          </section>
          <section className="doc-meta">
            <div>
              <span>Current reviewer</span>
              <strong className="doc-person">
                <i>{initials(reviewer)}</i>
                {reviewer}
              </strong>
            </div>
            <div>
              <span>Priority</span>
              <strong>{form.priority || "Standard"}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{stamp(submitted)}</strong>
            </div>
            <div>
              <span>Last updated</span>
              <strong>{shortTime(form.updated_at, "Just now")}</strong>
            </div>
          </section>
          <section className="doc-layout">
            <div>
              <Panel className="doc-status">
                <Label>
                  Live status <span>● updated just now</span>
                </Label>
                <div className="doc-status-head">
                  <h2>{status}</h2>
                  <span className={`doc-pill ${statusTone(status)}`}>
                    <i />
                    {status}
                  </span>
                </div>
                <div className="doc-timeline">
                  <div className="doc-step complete">
                    <b>✓</b>
                    <span>Submitted</span>
                  </div>
                  <i className="doc-line complete" />
                  <div
                    className={`doc-step ${reviewStep === 2 ? "active" : "complete"}`}
                  >
                    <b>{reviewStep > 2 ? "✓" : "02"}</b>
                    <span>In review</span>
                  </div>
                  <i
                    className={`doc-line ${reviewStep > 2 ? "complete" : ""}`}
                  />
                  <div
                    className={`doc-step ${reviewStep === 3 ? "active" : ""}`}
                  >
                    <b>03</b>
                    <span>Decision</span>
                  </div>
                </div>
                <div className="doc-callout">
                  <div>
                    <b>⌁</b>
                    <span>
                      <strong>
                        {reviewStep === 2
                          ? "Review is with you"
                          : "Workflow update"}
                      </strong>
                      <p>
                        Check the record and move it before the next SLA
                        threshold.
                      </p>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .querySelector(".doc-preview")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Review now ↗
                  </button>
                </div>
              </Panel>
              {preview && (
                <Panel className="doc-preview" id="document-preview">
                  <div className="doc-preview-head">
                    <div>
                      <Label>Inline preview</Label>
                      <h2>{activeFileName || title}</h2>
                      <p>{activeFileName || "No attached file"}</p>
                    </div>
                    <div className="doc-preview-meta">
                      <button
                        type="button"
                        className="doc-ai-button"
                        onClick={generateBrief}
                      >
                        ✦ AI Summary
                      </button>
                      <span>{fileMeta}</span>
                    </div>
                  </div>
                  {url && pdf ? (
                    <div className="doc-reader-stage">
                      {readerToolbar}
                      <div className="doc-reader-scroll doc-reader-pdf">
                        <iframe
                          title={`Preview of ${activeFileName || title}`}
                          src={`${url}#toolbar=0`}
                        />
                      </div>
                      <div className="doc-reader-bottom">
                        <span>1</span>
                        <span>▣</span>
                        <span>▤</span>
                        <span>⌕</span>
                      </div>
                    </div>
                  ) : url && image ? (
                    <div className="doc-reader-stage">
                      {readerToolbar}
                      <div className="doc-reader-scroll doc-reader-image">
                        <img src={url} alt={`Preview of ${title}`} />
                      </div>
                      <div className="doc-reader-bottom">
                        <span>1</span>
                        <span>▣</span>
                        <span>▤</span>
                        <span>⌕</span>
                      </div>
                    </div>
                  ) : (
                    <div className="doc-reader-stage">
                      {readerToolbar}
                      <div className="doc-reader-scroll">
                        <div
                          className="doc-paper"
                          style={{
                            transform: `scale(${zoom / 100})`,
                            marginBottom: `${Math.max(0, (zoom - 100) * 2)}px`,
                          }}
                        >
                          <div className="doc-paper-top">
                            <span>DEPARTMENT OF COMPUTER SCIENCE</span>
                            <span>
                              {new Date().getFullYear()}–
                              {new Date().getFullYear() + 1}
                            </span>
                          </div>
                          <h3>{title}</h3>
                          <p>{category}</p>
                          <div className="doc-paper-line wide" />
                          <div className="doc-paper-line short" />
                          <div className="doc-paper-lines">
                            <div className="doc-paper-line" />
                            <div className="doc-paper-line" />
                            <div className="doc-paper-line full" />
                            <div className="doc-paper-line full" />
                            <div className="doc-paper-line" />
                            <div className="doc-paper-line" />
                          </div>
                          <div className="doc-paper-abstract">
                            <strong>Executive overview</strong>
                            {form.notes ||
                              form.description ||
                              "Key findings and supporting evidence for the current academic review cycle."}
                          </div>
                          <div className="doc-paper-footer">
                            <span>Computer Science · Internal document</span>
                            <span>1</span>
                          </div>
                        </div>
                      </div>
                      <div className="doc-reader-bottom">
                        <span>1</span>
                        <span>▣</span>
                        <span>▤</span>
                        <span>⌕</span>
                      </div>
                    </div>
                  )}
                </Panel>
              )}
              <Panel className="doc-summary">
                <div className="doc-head">
                  <div>
                    <Label>Document intelligence</Label>
                    <h2>Review brief</h2>
                  </div>
                  <button type="button" onClick={generateBrief}>
                    Generate brief
                  </button>
                </div>
                {brief ? (
                  <p>{brief}</p>
                ) : (
                  <div className="doc-empty-note">
                    <i>⌁</i>
                    <span>
                      Create a concise review brief from the available document
                      metadata and submitted fields. It supports your decision
                      without changing the original record.
                    </span>
                  </div>
                )}
              </Panel>
              <Panel className="doc-comments">
                <div className="doc-head">
                  <div>
                    <Label>Review discussion</Label>
                    <h2>Reviewer comments</h2>
                  </div>
                  <span className="doc-count">{comments.length}</span>
                </div>
                {comments.length ? (
                  comments.map((comment, index) => (
                    <div className="doc-comment" key={comment.id || index}>
                      <span className="doc-avatar">
                        {initials(
                          comment.sender_name || comment.user || "Reviewer",
                        )}
                      </span>
                      <div>
                        <strong>
                          {comment.sender_name || comment.user || "Reviewer"}
                          <span>{shortTime(comment.created_at)}</span>
                        </strong>
                        <p>
                          {comment.content || comment.note || comment.message}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="doc-comment-empty">
                    No threaded comments have been recorded. Use the decision
                    note to leave review direction for this form.
                  </p>
                )}
              </Panel>
              <section className="doc-workflow">
                <Panel className="doc-history doc-lineage-card">
                  <div className="doc-head">
                    <div>
                      <Label>Document lineage</Label>
                      <h2>Version history</h2>
                    </div>
                    <span className="doc-badge">
                      {versions.length} version
                      {versions.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="doc-lineage-copy">
                    Every submission and revision stays traceable within this
                    document record before a final decision is made.
                  </p>
                  <div className="doc-lineage">
                    {[...versions].reverse().map((item, reverseIndex) => {
                      const versionNumber = item.lineage_number;
                      const isCurrent =
                        activeVersion?.lineage_id === item.lineage_id;
                      const inferredVersionStatus = versionWorkflowStatus(
                        item,
                        reverseIndex === 0 ? status : "",
                      );
                      const isTerminalVersionStatus = [
                        "Approved",
                        "Returned",
                        "Rejected",
                      ].includes(inferredVersionStatus);
                      const versionStatus =
                        reverseIndex === 0
                          ? status
                          : !isTerminalVersionStatus
                            ? "Returned"
                            : inferredVersionStatus;
                      const rowFileName =
                        versionFileName(item) || `Version ${versionNumber}`;
                      const versionSize = versionFileSize(item);
                      return (
                        <article
                          className={`doc-lineage-row ${isCurrent ? "current" : ""}`}
                          key={item.lineage_id || reverseIndex}
                        >
                          <span className="doc-lineage-version">
                            v{versionNumber}
                          </span>
                          <div className="doc-lineage-main">
                            <h3>
                              {reverseIndex === 0
                                ? "Current submission"
                                : "Prior submission"}
                              <span
                                className={`doc-lineage-status ${statusTone(versionStatus)}`}
                              >
                                {versionStatus}
                              </span>
                            </h3>
                            <p>
                              {item.note ||
                                item.submission_note ||
                                (isCurrent && form.review_note) ||
                                "No submission note recorded."}
                            </p>
                            <div className="doc-lineage-meta">
                              <span>{rowFileName}</span>
                              {versionSize && <i>•</i>}
                              {versionSize && <span>{versionSize}</span>}
                              {reverseIndex === 0 && <b>Latest</b>}
                            </div>
                          </div>
                          <button
                            className="doc-lineage-open"
                            type="button"
                            aria-label={`View version ${versionNumber}`}
                            onClick={() => {
                              setVersion(item);
                              setPreview(true);
                              window.requestAnimationFrame(() =>
                                document
                                  .getElementById("document-preview")
                                  ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  }),
                              );
                            }}
                          >
                            <time>
                              {shortTime(
                                item.created_at || item.submitted_at,
                                "Current record",
                              )}
                            </time>
                            <span>◉</span>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </Panel>
                <Panel className="doc-audit">
                  <div className="doc-head">
                    <div>
                      <Label>Accountability</Label>
                      <h2>Audit trail</h2>
                    </div>
                    <span className="doc-badge">{audits.length} events</span>
                  </div>
                  <div className="doc-audit-list">
                    {audits.map((item, index) => (
                      <div className="doc-audit-item" key={item.id || index}>
                        <strong>
                          {item.action ||
                            item.event ||
                            item.status ||
                            "Form updated"}
                        </strong>
                        <span>
                          {item.user ||
                            item.actor ||
                            item.sender_name ||
                            "System"}{" "}
                          ·{" "}
                          {shortTime(
                            item.timestamp ||
                              item.created_at ||
                              item.updated_at,
                          )}
                        </span>
                        {(item.detail || item.description || item.note) && (
                          <p>{item.detail || item.description || item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Panel>
              </section>
            </div>
            <aside className="doc-side">
              <Panel className="doc-sla">
                <div className="doc-sla-top">
                  <div>
                    <Label>SLA tracking</Label>
                    <h2>{deadline ? "On track" : "No deadline"}</h2>
                  </div>
                  <span className="doc-live">● Live</span>
                </div>
                <h3>{deadline ? stamp(deadline) : "Not set"}</h3>
                <p>{deadline ? "Review deadline" : "Set a review deadline"}</p>
                <div className="doc-progress">
                  <i style={{ width: `${elapsed}%` }} />
                </div>
                <div className="doc-progress-meta">
                  <span>Started {stamp(submitted, "recently")}</span>
                  <span>{elapsed}% elapsed</span>
                </div>
                <div className="doc-sla-grid">
                  <div>
                    <span>Target</span>
                    <strong>{form.sla_target || "2 business days"}</strong>
                  </div>
                  <div>
                    <span>Current state</span>
                    <strong>{status}</strong>
                  </div>
                </div>
              </Panel>
              <Panel className="doc-owners">
                <Label>Workflow ownership</Label>
                <h2>Handoff map</h2>
                <div className="doc-owner-line">
                  <span className="doc-owner-avatar">
                    {initials(submitter)}
                  </span>
                  <div className="doc-owner-copy">
                    <strong>{submitter}</strong>
                    <span>Faculty submitter</span>
                  </div>
                </div>
                <div className="doc-owner-line">
                  <span className="doc-owner-avatar">{initials(reviewer)}</span>
                  <div className="doc-owner-copy">
                    <strong>{reviewer}</strong>
                    <span>Current reviewer</span>
                  </div>
                </div>
                <div className="doc-owner-line">
                  <span className="doc-owner-avatar">AP</span>
                  <div className="doc-owner-copy">
                    <strong>
                      {form.final_approver_name || "Academic Provost"}
                    </strong>
                    <span>Next approver</span>
                  </div>
                </div>
              </Panel>
              {fields.length > 0 && (
                <Panel className="doc-fields">
                  <div>
                    <Label>Submitted record</Label>
                    <h2>Form details</h2>
                  </div>
                  {fields.map(([key, value]) => (
                    <div className="doc-field" key={key}>
                      <span>{key}</span>
                      <strong>
                        {value === null || value === "" ? "—" : String(value)}
                      </strong>
                    </div>
                  ))}
                </Panel>
              )}
              {isFacultyView ? (
                <Panel
                  className="doc-faculty-submission"
                  id="faculty-submission"
                >
                  <div className="doc-faculty-heading">
                    <span className="doc-faculty-heading-icon">➤</span>
                    <div>
                      <Label>Faculty submission</Label>
                      <h2>
                        {canSubmitReplacement
                          ? "Submit your revised work"
                          : hasSubmittedFile
                            ? "Submission sent"
                            : "Submit your completed work"}
                      </h2>
                    </div>
                  </div>
                  <p className="doc-faculty-intro">
                    {canSubmitReplacement
                      ? "Attach the corrected file and add a concise handoff note for the Program Chair."
                      : hasSubmittedFile
                        ? "Your work is in the review workflow. Withdraw it before replacing the file."
                        : "Attach the completed file and leave a concise note that helps the chair make a decision."}
                  </p>
                  {approved ? (
                    <>
                      <div className="doc-approved-notice">
                        <span>✓</span>
                        <div>
                          <strong>Document approved</strong>
                          <p>
                            Your submission has been approved by the Program
                            Chair. No further action is required.
                          </p>
                        </div>
                      </div>
                      <div className="doc-submitted-file">
                        <i>▤</i>
                        <div>
                          <strong>
                            {form.file_name || "Approved document"}
                          </strong>
                          <span>
                            Approved · {shortTime(form.updated_at, "Recorded")}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : hasSubmittedFile && !canSubmitReplacement ? (
                    <>
                      <div className="doc-submitted-file">
                        <i>▤</i>
                        <div>
                          <strong>
                            {form.file_name || "Submitted document"}
                          </strong>
                          <span>
                            {status} ·{" "}
                            {shortTime(
                              form.updated_at || submitted,
                              "Submitted",
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="doc-submission-locked">
                        <span>✓</span>
                        <span>
                          Submitting another file is locked while this
                          submission is active.
                        </span>
                      </div>
                      <button
                        className="doc-submission-withdraw"
                        type="button"
                        disabled={withdrawing}
                        onClick={withdrawFacultySubmission}
                      >
                        {withdrawing ? "Withdrawing…" : "Withdraw submission"}
                      </button>
                    </>
                  ) : (
                    <>
                      {canSubmitReplacement && (
                        <div className="doc-submitted-file">
                          <i>↩</i>
                          <div>
                            <strong>
                              {form.file_name || "Current submission"}
                            </strong>
                            <span>Returned · attach a replacement below</span>
                          </div>
                        </div>
                      )}
                      <input
                        ref={submissionFileRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                        style={{ display: "none" }}
                        onChange={(event) =>
                          setSubmissionFile(event.target.files?.[0] || null)
                        }
                      />
                      <button
                        className="doc-submission-upload"
                        type="button"
                        onClick={() => submissionFileRef.current?.click()}
                      >
                        <span className="doc-submission-upload-icon">
                          {submissionFile ? "✓" : "⌁"}
                        </span>
                        <div>
                          <b>
                            {submissionFile
                              ? submissionFile.name
                              : "Attach completed file"}
                          </b>
                          <span>
                            {submissionFile
                              ? "Ready to send to the review team"
                              : "PDF, DOCX, XLSX, CSV, or image"}
                          </span>
                        </div>
                        <span className="doc-submission-upload-view">◉</span>
                      </button>
                      <label
                        className="doc-submission-note-label"
                        htmlFor="faculty-submission-note"
                      >
                        Submission note
                      </label>
                      <textarea
                        id="faculty-submission-note"
                        className="doc-submission-note"
                        value={submissionNote}
                        onChange={(event) =>
                          setSubmissionNote(event.target.value)
                        }
                        placeholder="Summarize what was completed or flag any exception for review…"
                      />
                      <button
                        className="doc-submission-primary"
                        type="button"
                        disabled={submitting || !submissionFile}
                        onClick={submitFacultyFile}
                      >
                        {submitting
                          ? "Submitting…"
                          : canSubmitReplacement
                            ? "➤ Submit revised work"
                            : "➤ Submit for chair review"}
                      </button>
                    </>
                  )}
                </Panel>
              ) : (
                <Panel className="doc-decision" id="review-decision">
                  <Label>Reviewer decision</Label>
                  <h2>
                    {approved ? "Document approved" : "Choose the next step"}
                  </h2>
                  {approved ? (
                    <div className="doc-approved-notice doc-approved-reviewer">
                      <span>✓</span>
                      <div>
                        <strong>Approval already recorded</strong>
                        <p>
                          This document was approved{" "}
                          {shortTime(form.updated_at, "recently")}. Reviewer
                          actions are now locked.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="doc-decision-intro">
                        Approve this submission, send it back with clear
                        revision direction, or record a formal rejection.
                      </p>
                      {/revision|rejected|returned/i.test(status) &&
                        form.review_note && (
                          <div className="doc-decision-note">
                            <strong>Previous review direction</strong>
                            <br />
                            {form.review_note}
                          </div>
                        )}
                      <label htmlFor="review-note">
                        Approval note{" "}
                        <span className="doc-optional">optional</span>
                      </label>
                      <textarea
                        id="review-note"
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder="Add an optional note for the approval audit trail."
                      />
                      <div className="doc-decision-actions">
                        <button
                          type="button"
                          className="approve"
                          disabled={submitting}
                          onClick={() =>
                            decision("approve", null, "Form approved.")
                          }
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          className="return"
                          disabled={submitting}
                          onClick={() => openDecisionForm("return")}
                        >
                          ↩ Return with feedback
                        </button>
                        <button
                          type="button"
                          className="reject"
                          disabled={submitting}
                          onClick={() => openDecisionForm("reject")}
                        >
                          × Reject submission
                        </button>
                      </div>
                    </>
                  )}
                </Panel>
              )}
            </aside>
          </section>
        </div>
      </main>
      {decisionForm && (
        <div className="doc-decision-modal-backdrop">
          <form
            className={`doc-decision-modal ${decisionForm}`}
            onSubmit={submitStructuredDecision}
          >
            <button
              type="button"
              className="doc-decision-modal-close"
              aria-label="Close decision form"
              onClick={() => setDecisionForm(null)}
              disabled={submitting}
            >
              ×
            </button>
            <div className="doc-decision-modal-kicker">
              <span>{decisionForm === "return" ? "↩" : "×"}</span>
              {decisionForm === "return"
                ? "Return for revision"
                : "Reject submission"}
            </div>
            <h2>
              {decisionForm === "return"
                ? "Set the revision path"
                : "Record a clear decision"}
            </h2>
            <p>
              {decisionForm === "return"
                ? "The submitter will receive your selected reason and direction, then can prepare a revised version."
                : "A rejection closes the current submission. Be specific so the audit trail clearly explains the decision."}
            </p>
            <div className="doc-decision-modal-record">
              <span>{title}</span>
              <b>{tracking}</b>
            </div>
            <label htmlFor="decision-reason">
              Reason <em>required</em>
            </label>
            <select
              id="decision-reason"
              value={decisionReason}
              onChange={(event) => setDecisionReason(event.target.value)}
              required
            >
              <option value="" disabled>
                Select a reason
              </option>
              {DECISION_REASONS[decisionForm].map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            {decisionReason && (
              <div className="doc-decision-modal-selection">
                <span>Selected reason</span>
                <strong>{decisionReason}</strong>
              </div>
            )}
            <label htmlFor="decision-direction">
              {decisionForm === "return"
                ? "Revision direction"
                : "Rejection explanation"}{" "}
              <em>required</em>
            </label>
            <textarea
              id="decision-direction"
              value={decisionNote}
              onChange={(event) => setDecisionNote(event.target.value)}
              placeholder={
                decisionForm === "return"
                  ? "State exactly what the submitter needs to correct or add before resubmitting."
                  : "Explain the decision in terms that are clear and appropriate for the submitter."
              }
              required
            />
            <div className="doc-decision-modal-actions">
              <button
                type="button"
                onClick={() => setDecisionForm(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : decisionForm === "return"
                    ? "Send revision request"
                    : "Confirm rejection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}