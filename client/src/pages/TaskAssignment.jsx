import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


const API = import.meta.env.VITE_API_URL;

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#ba1a1a" }}>Something went wrong</h2>
          <pre
            style={{
              background: "#ffdad6",
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
            }}
          >
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Icon = {
  Search: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5 14 14" strokeLinecap="round" />
    </svg>
  ),
  Arrow: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M9.5 3.5 5 8l4.5 4.5M5.5 8h8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Users: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="6" cy="5" r="2.7" />
      <path
        d="M1.5 14c0-2.8 1.8-4.5 4.5-4.5S10.5 11.2 10.5 14M11 3.3c2.2.1 3.4 1.3 3.4 3.1 0 1.5-.8 2.5-2.3 2.9M12 10c1.5.5 2.3 1.7 2.3 4"
        strokeLinecap="round"
      />
    </svg>
  ),
  File: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 1.5h6.3L13 5.2v9.3H3z" />
      <path d="M9 1.7v3.6h3.6M5.3 8h5.2M5.3 10.5h5.2" strokeLinecap="round" />
    </svg>
  ),
  Spark: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="m8 1 1.1 4.1L13 6.2 9.1 7.4 8 11.5 6.9 7.4 3 6.2l3.9-1.1L8 1ZM12.4 10l.5 1.9 1.8.5-1.8.5-.5 1.9-.5-1.9-1.8-.5 1.8-.5.5-1.9Z"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Clock: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="8" cy="8" r="6.3" />
      <path d="M8 4.3V8l2.6 1.7" strokeLinecap="round" />
    </svg>
  ),
  Clip: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        d="m13 7-5.5 5.5a3.5 3.5 0 0 1-5-5L8 2a2 2 0 0 1 2.8 2.8L5.4 10.3a.55.55 0 0 1-.8-.8L10 4.1"
        strokeLinecap="round"
      />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        d="m3.2 8.3 3.1 3.1 6.5-6.8"
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
      strokeWidth="1.6"
    >
      <path d="m14.2 1.8-5.5 12-2-5-4.9-2 12.4-5Z" strokeLinejoin="round" />
      <path d="m6.7 8.8 3-3" strokeLinecap="round" />
    </svg>
  ),
  Close: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
    >
      <path d="m3.5 3.5 9 9m0-9-9 9" strokeLinecap="round" />
    </svg>
  ),
};

const FALLBACK_SLA = {
  High: {
    hours: 24,
    turnaround: "24-hour response window",
    escalation: "After 6 hours",
  },
  Medium: {
    hours: 72,
    turnaround: "72-hour response window",
    escalation: "After 24 hours",
  },
  Low: {
    hours: 120,
    turnaround: "5 business days",
    escalation: "After 48 hours",
  },
};

function toManilaParts(date) {
  const value = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = (number) => String(number).padStart(2, "0");
  return {
    date: `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`,
    time: `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`,
  };
}

function combineDeadlineToUTC(dateStr, timeStr) {
  if (!dateStr) return "";
  const [hours, minutes] = (timeStr || "00:00").split(":").map(Number);
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hours, minutes) - 8 * 60 * 60 * 1000,
  )
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

function initials(name = "?") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fileKind(name = "") {
  const extension = (name.split(".").pop() || "").toLowerCase();
  if (extension === "pdf") return "PDF";
  if (["doc", "docx"].includes(extension)) return "DOC";
  if (["xls", "xlsx", "csv"].includes(extension)) return "XLS";
  if (["jpg", "jpeg", "png", "webp"].includes(extension)) return "IMG";
  return extension ? extension.slice(0, 4).toUpperCase() : "FILE";
}

function TaskAssignmentInner() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = getUser();
  const authHeaders = { Authorization: `Bearer ${token}` };
  const [facultyList, setFacultyList] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [slaRules, setSlaRules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignMode, setAssignMode] = useState("individual");
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [facultyPickerOpen, setFacultyPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successTrackingId, setSuccessTrackingId] = useState("");
  const [previewTrackingId, setPreviewTrackingId] = useState("Loading…");
  const [search, setSearch] = useState("");
  const pickerRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    doc_type: "",
    priority: "Medium",
    deadline: "",
    deadlineTime: "17:00",
    notes: "",
  });

  const fetchNextTrackingId = async () => {
    try {
      const response = await fetch(`${API}/api/tasks/next-tracking-id`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setPreviewTrackingId(data.tracking_id || "—");
    } catch {
      setPreviewTrackingId("—");
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await fetch(`${API}/api/users?role=faculty`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setFacultyList(data.users || data || []);
    } catch {
      setFacultyList([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API}/api/users`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setRoleOptions([
        ...new Set(
          (data.users || data || [])
            .map((member) => member.role)
            .filter(Boolean),
        ),
      ]);
    } catch {
      setRoleOptions([]);
    }
  };

  const fetchDocTypes = async () => {
    try {
      const response = await fetch(
        `${API}/api/categories?status=Active&type=Document`,
        { headers: authHeaders },
      );
      const data = await response.json();
      setDocTypes((data.categories || []).map((category) => category.name));
    } catch {
      setDocTypes([]);
    }
  };

  const fetchSlaRules = async () => {
    try {
      const response = await fetch(`${API}/api/sla/rules`, {
        headers: authHeaders,
      });
      const data = await response.json();
      setSlaRules(Array.isArray(data) ? data : data.rules || []);
    } catch {
      setSlaRules([]);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API}/api/tasks`, {
        headers: authHeaders,
      });
      const data = await response.json();
      const tasks = data.tasks ?? data;
      setAssignments(Array.isArray(tasks) ? tasks : []);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    if (!token) navigate("/login");
  }, [navigate, token]);

  useEffect(() => {
    fetchFaculty();
    fetchRoles();
    fetchDocTypes();
    fetchSlaRules();
    fetchAssignments();
    fetchNextTrackingId();
  }, []);

  useEffect(() => {
    const closePicker = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target))
        setFacultyPickerOpen(false);
    };
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, []);

  const uploadFileToR2 = (entry) =>
    new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/api/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setAttachments((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, progress } : item,
          ),
        );
      };
      const finish = (success) => {
        setAttachments((current) =>
          current.map((item) =>
            item.id === entry.id
              ? {
                  ...item,
                  status: success ? "done" : "error",
                  progress: success ? 100 : item.progress,
                  ...(success || {}),
                }
              : item,
          ),
        );
        resolve();
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          finish(
            xhr.status >= 200 && xhr.status < 300 && data.success
              ? { key: data.key, url: data.url }
              : false,
          );
        } catch {
          finish(false);
        }
      };
      xhr.onerror = () => finish(false);
      const payload = new FormData();
      payload.append("file", entry.file);
      xhr.send(payload);
    });

  const handleAttach = (files) => {
    const entries = Array.from(files || [])
      .filter((file) => file.size <= 10 * 1024 * 1024)
      .map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "uploading",
        progress: 0,
        key: null,
        url: null,
      }));
    if (!entries.length) return;
    setAttachments((current) => [...current, ...entries]);
    entries.forEach(uploadFileToR2);
  };

  const removeAttachment = async (id) => {
    const target = attachments.find((item) => item.id === id);
    setAttachments((current) => current.filter((item) => item.id !== id));
    if (!target?.key) return;
    try {
      await fetch(`${API}/api/upload/${encodeURIComponent(target.key)}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    } catch {}
  };

  const selectedFaculty = facultyList.filter((member) =>
    selectedFacultyIds.includes(member.id),
  );
  const documentSlaRule = form.doc_type
    ? slaRules.find(
        (rule) =>
          rule.document_type === form.doc_type &&
          (rule.status ?? "Active") === "Active",
      )
    : null;
  const fallbackSla = FALLBACK_SLA[form.priority] || FALLBACK_SLA.Medium;
  const turnaroundHours = documentSlaRule
    ? Number(documentSlaRule.turnaround_hours)
    : fallbackSla.hours;
  const activeSla = documentSlaRule
    ? {
        turnaround:
          documentSlaRule.turnaround_hours != null
            ? `${documentSlaRule.turnaround_hours}-hour response window`
            : "Not configured",
        escalation:
          documentSlaRule.escalation_hours != null
            ? `After ${documentSlaRule.escalation_hours} hours`
            : "Not configured",
        review: documentSlaRule.reviewer_role || "Not configured",
      }
    : {
        turnaround: form.doc_type
          ? "No active SLA rule"
          : "Select document type",
        escalation: "—",
        review: "—",
      };
  const windowStart = toManilaParts(new Date());
  const windowEnd = toManilaParts(
    new Date(Date.now() + turnaroundHours * 60 * 60 * 1000),
  );
  const incompleteSteps = [
    !form.title.trim(),
    !form.doc_type,
    assignMode === "individual" ? selectedFaculty.length === 0 : !selectedRole,
    !form.deadline,
  ].filter(Boolean).length;
  const readySteps = 4 - incompleteSteps;

  const workloadRows = useMemo(() => {
    const counts = assignments.reduce((result, assignment) => {
      if (assignment.faculty_name)
        result[assignment.faculty_name] =
          (result[assignment.faculty_name] || 0) + 1;
      return result;
    }, {});
    return facultyList.map((member) => {
      const count = counts[member.full_name] || 0;
      return { ...member, active: count, load: Math.min(100, count * 25) };
    });
  }, [assignments, facultyList]);
  const routingMembers =
    assignMode === "individual"
      ? workloadRows.filter((member) => selectedFacultyIds.includes(member.id))
      : workloadRows;
  const routingLoad = routingMembers.length
    ? Math.round(
        routingMembers.reduce((sum, member) => sum + member.load, 0) /
          routingMembers.length,
      )
    : 0;
  const filteredActivity = assignments
    .filter(
      (task) =>
        !search ||
        `${task.tracking_id || ""} ${task.title || ""} ${task.faculty_name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .slice(0, 4);

  const toggleFaculty = (id) =>
    setSelectedFacultyIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  const selectAllFaculty = () =>
    setSelectedFacultyIds((current) =>
      current.length === facultyList.length
        ? []
        : facultyList.map((member) => member.id),
    );
  const resetForm = () => {
    setForm({
      title: "",
      doc_type: "",
      priority: "Medium",
      deadline: "",
      deadlineTime: "17:00",
      notes: "",
    });
    setSelectedFacultyIds([]);
    setSelectedRole("");
    setAssignMode("individual");
    setAttachments([]);
  };

  const saveDraft = async () => {
    try {
      const payload = new FormData();
      Object.entries({ ...form, status: "Draft" }).forEach(([key, value]) =>
        payload.append(key, value),
      );
      if (assignMode === "individual")
        selectedFacultyIds.forEach((id) => payload.append("faculty_ids", id));
      else payload.append("assign_role", selectedRole);
      payload.append(
        "attachments",
        JSON.stringify(
          attachments
            .filter((item) => item.status === "done")
            .map((item) => ({
              key: item.key,
              url: item.url,
              name: item.file.name,
              size: item.file.size,
            })),
        ),
      );
      await fetch(`${API}/api/tasks/draft`, {
        method: "POST",
        headers: authHeaders,
        body: payload,
      });
      alert("Draft saved.");
    } catch {
      alert("Could not save draft.");
    }
  };

  const submitAssignment = async (event) => {
    event.preventDefault();
    if (assignMode === "individual" && !selectedFaculty.length)
      return alert("Please select at least one faculty member.");
    if (assignMode === "role" && !selectedRole)
      return alert("Please select a role to assign this task to.");
    if (!form.title.trim() || !form.doc_type || !form.deadline)
      return alert(
        "Add a title, document type, and deadline before assigning.",
      );
    const deadline = `${form.deadline}T${form.deadlineTime || "00:00"}`;
    const earliest = `${windowStart.date}T${windowStart.time}`;
    const latest = `${windowEnd.date}T${windowEnd.time}`;
    if (deadline < earliest || deadline > latest)
      return alert(
        `Deadline must fall within the configured ${turnaroundHours}h SLA window.`,
      );
    if (attachments.some((item) => item.status === "uploading"))
      return alert("Please wait for attachments to finish uploading.");
    if (attachments.some((item) => item.status === "error"))
      return alert("Remove or retry failed attachments before assigning.");
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        payload.append(
          key,
          key === "deadline"
            ? combineDeadlineToUTC(form.deadline, form.deadlineTime)
            : value,
        ),
      );
      if (assignMode === "individual")
        selectedFacultyIds.forEach((id) => payload.append("faculty_ids", id));
      else payload.append("assign_role", selectedRole);
      payload.append(
        "attachments",
        JSON.stringify(
          attachments.map((item) => ({
            key: item.key,
            url: item.url,
            name: item.file.name,
            size: item.file.size,
          })),
        ),
      );
      const response = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: authHeaders,
        body: payload,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign task.");
      }
      const created = await response.json();
      setSuccessTrackingId(created.tracking_id || previewTrackingId);
      resetForm();
      fetchAssignments();
      fetchNextTrackingId();
      setTimeout(() => setSuccessTrackingId(""), 4500);
    } catch (error) {
      alert(error.message || "Server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="path-assignment-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');
        .path-assignment-shell{display:flex;min-height:100vh;background:#f8f7ff;color:#463750;font-family:'DM Sans',sans-serif}.path-assignment-shell *{box-sizing:border-box}.path-assignment-shell button,.path-assignment-shell input,.path-assignment-shell select,.path-assignment-shell textarea{font:inherit}.path-assignment-main{display:flex;min-width:0;flex:1;flex-direction:column;min-height:100vh}.path-assignment-content{width:min(1350px,100%);margin:0 auto;padding:28px 44px 42px}.path-assignment-search{display:flex;align-items:center;gap:8px;width:min(420px,100%);padding:0 11px;border:1px solid #e2dbe9;border-radius:8px;background:#fff;color:#93879d}.path-assignment-search svg{width:13px;height:13px}.path-assignment-search input{width:100%;height:34px;border:0;outline:0;background:transparent;color:#53425f;font-size:10px}.path-assignment-hero{display:flex;justify-content:space-between;gap:26px;padding:29px 31px 27px;border:1px solid #e4ddef;border-radius:18px;background:linear-gradient(120deg,#fff 0%,#fcfbff 61%,#f1eaff 100%);box-shadow:0 18px 42px rgba(77,47,112,.055)}.path-assignment-back{display:inline-flex;align-items:center;gap:6px;margin:0 0 21px;padding:0;border:0;background:none;color:#75548f;font-size:10px;font-weight:700;cursor:pointer}.path-assignment-back svg{width:14px}.path-assignment-eyebrow{display:flex;align-items:center;gap:7px;color:#8d7d99;font-size:8px;font-weight:800;letter-spacing:.12em}.path-assignment-eyebrow i{width:6px;height:6px;border-radius:50%;background:#7c3aed}.path-assignment-hero h1{margin:10px 0 7px;color:#41324c;font-family:'Manrope',sans-serif;font-size:32px;font-weight:800;letter-spacing:-.065em;line-height:1.08}.path-assignment-hero p{max-width:610px;margin:0;color:#8e809a;font-size:11px;line-height:1.55}.path-assignment-ticket{align-self:flex-start;min-width:170px;padding:14px 15px;border:1px solid #ddd0ef;border-radius:11px;background:#fff;text-align:right}.path-assignment-ticket>span{display:block;color:#8870a4;font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.path-assignment-ticket strong{display:block;margin-top:4px;color:#603e84;font-family:'Manrope',sans-serif;font-size:13px;font-weight:800;letter-spacing:-.04em}.path-assignment-ticket small{display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:12px;color:#9b8ca4;font-size:8px}.path-assignment-ticket small i{width:5px;height:5px;border-radius:50%;background:#5cb891}.path-assignment-layout{display:grid;grid-template-columns:minmax(0,1.52fr) minmax(285px,.48fr);align-items:start;gap:16px;margin-top:16px}.path-assignment-form,.path-assignment-aside{border:1px solid #e5dfee;border-radius:15px;background:#fff;box-shadow:0 12px 26px rgba(78,49,112,.035)}.path-assignment-stages{display:flex;align-items:center;gap:8px;padding:17px 23px;border-bottom:1px solid #eee8f2;color:#a196a6;font-size:9px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.path-assignment-stages span{display:flex;align-items:center;gap:5px}.path-assignment-stages span.done{color:#55a27f}.path-assignment-stages span.active{color:#703ccd}.path-assignment-stages i{flex:1;height:1px;background:#e6dff0}.path-assignment-section{padding:22px 23px;border-bottom:1px solid #eee9f3}.path-assignment-section:last-of-type{border:0}.path-assignment-section-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}.path-assignment-section-icon{display:grid;width:28px;height:28px;place-items:center;border-radius:8px;background:#eee8fb;color:#7542c2}.path-assignment-section-icon svg{width:15px}.path-assignment-section-head small{display:block;color:#9b8ca3;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.path-assignment-section-head h2{margin:3px 0 0;color:#4a3a56;font-family:'Manrope',sans-serif;font-size:16px;font-weight:800;letter-spacing:-.045em}.path-assignment-mode{display:flex;gap:7px;margin-bottom:11px}.path-assignment-mode button{display:inline-flex;align-items:center;gap:7px;padding:8px 10px;border:1px solid #e2dbe9;border-radius:8px;background:#fff;color:#806e8d;font-size:9px;font-weight:700;cursor:pointer}.path-assignment-mode button span{width:7px;height:7px;border:1.5px solid #b9adbf;border-radius:50%}.path-assignment-mode button.active{border-color:#c9b4ef;background:#f9f6ff;color:#6b39be}.path-assignment-mode button.active span{border-color:#7c3aed;box-shadow:inset 0 0 0 2px #fff;background:#7c3aed}.path-assignment-picker{position:relative}.path-assignment-picker-trigger{display:flex;align-items:center;justify-content:space-between;width:100%;height:39px;padding:0 11px;border:1px solid #e0d9e7;border-radius:8px;background:#fff;color:#5e4e6b;font-size:10px;cursor:pointer}.path-assignment-picker-trigger strong{font-size:9px}.path-assignment-picker-menu{position:absolute;z-index:10;top:calc(100% + 5px);left:0;right:0;max-height:240px;overflow:auto;border:1px solid #d6c8e7;border-radius:10px;background:#fff;box-shadow:0 14px 24px rgba(56,31,87,.13)}.path-assignment-picker-all,.path-assignment-picker-option{display:flex;align-items:center;gap:9px;padding:9px 11px;border-bottom:1px solid #f0ebf3;color:#5a4965;font-size:9px;cursor:pointer}.path-assignment-picker-all{position:sticky;top:0;background:#fff;color:#703ccd;font-weight:800}.path-assignment-picker-option:last-child{border-bottom:0}.path-assignment-picker-option small{color:#9b8e9f}.path-assignment-picker-option input,.path-assignment-picker-all input{accent-color:#7c3aed}.path-assignment-avatar{display:grid;width:27px;height:27px;place-items:center;border-radius:8px;background:#eee8fb;color:#7541c1;font-size:8px;font-weight:800}.path-assignment-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.path-assignment-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 5px 4px 8px;border-radius:6px;background:#f0eafb;color:#6e49a0;font-size:8px;font-weight:700}.path-assignment-chip button{display:grid;width:15px;height:15px;place-items:center;padding:0;border:0;border-radius:50%;background:#dfd0f6;color:#77539e;cursor:pointer}.path-assignment-chip button svg{width:9px}.path-assignment-role-select,.path-assignment-field select,.path-assignment-field input,.path-assignment-notes textarea{display:block;width:100%;border:1px solid #e0d9e7;border-radius:8px;background:#fff;color:#51405d;outline:0}.path-assignment-role-select,.path-assignment-field select,.path-assignment-field input{height:38px;padding:0 10px;font-size:10px}.path-assignment-field-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(120px,.62fr) minmax(105px,.45fr);gap:9px}.path-assignment-field-grid.title{display:block;margin-bottom:10px}.path-assignment-field{display:block;color:#75647f;font-size:8px;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.path-assignment-notes{display:block;margin-top:12px;color:#75647f;font-size:8px;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.path-assignment-notes textarea{min-height:104px;margin-top:7px;padding:11px;font-size:10px;line-height:1.5;resize:vertical}.path-assignment-role-select:focus,.path-assignment-field select:focus,.path-assignment-field input:focus,.path-assignment-notes textarea:focus{border-color:#a77ee4;box-shadow:0 0 0 3px rgba(124,58,237,.09)}.path-assignment-sla-hint{margin:7px 0 0;color:#8263a6;font-size:8px;line-height:1.45}.path-assignment-priorities{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.path-assignment-priorities button{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:10px;border:1px solid #e4dce9;border-radius:9px;background:#fff;color:#705f7b;font-size:9px;font-weight:800;text-align:left;cursor:pointer}.path-assignment-priorities button i{width:6px;height:6px;border-radius:50%;background:#b2a8ba}.path-assignment-priorities button small{display:block;width:100%;color:#9c90a4;font-size:8px;font-weight:500}.path-assignment-priorities button.active.high{border-color:#efb9ad;background:#fff8f6;color:#b25e53}.path-assignment-priorities button.active.high i{background:#df695b}.path-assignment-priorities button.active.medium{border-color:#d7ba55;background:#fffbec;color:#876a16}.path-assignment-priorities button.active.medium i{background:#e8af20}.path-assignment-priorities button.active.low{border-color:#b8e0cf;background:#f4fcf8;color:#438c6b}.path-assignment-priorities button.active.low i{background:#4db487}.path-assignment-sla{display:grid;grid-template-columns:auto 1fr 1fr 1fr;align-items:center;gap:10px;margin-top:12px;padding:12px;border:1px solid #e4d8f3;border-radius:9px;background:#faf7ff;color:#7553a0}.path-assignment-sla svg{width:15px}.path-assignment-sla span{display:block}.path-assignment-sla small{display:block;color:#9b8ea2;font-size:7px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.path-assignment-sla strong{display:block;margin-top:4px;color:#5c456d;font-size:9px;font-weight:800}.path-assignment-dropzone{display:flex;align-items:center;gap:10px;width:100%;margin-top:12px;padding:13px;border:1px dashed #cbb9e6;border-radius:9px;background:#fcfaff;color:#79559d;text-align:left;cursor:pointer}.path-assignment-dropzone.drag{border-color:#7c3aed;background:#f6f0ff}.path-assignment-dropzone svg{width:17px}.path-assignment-dropzone span{flex:1}.path-assignment-dropzone strong,.path-assignment-dropzone small{display:block}.path-assignment-dropzone strong{font-size:9px;font-weight:800}.path-assignment-dropzone small{margin-top:3px;color:#a194aa;font-size:8px}.path-assignment-attachments{display:flex;flex-direction:column;gap:6px;margin-top:9px}.path-assignment-attachment{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:8px;padding:8px;border:1px solid #ece6f2;border-radius:8px;background:#fff}.path-assignment-file-kind{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee8fb;color:#7049a4;font-size:8px;font-weight:800}.path-assignment-attachment strong,.path-assignment-attachment small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.path-assignment-attachment strong{color:#5c4a68;font-size:9px}.path-assignment-attachment small{margin-top:3px;color:#9a8d9f;font-size:8px}.path-assignment-attachment small.error{color:#be6557}.path-assignment-attachment button{display:grid;width:22px;height:22px;place-items:center;padding:0;border:0;border-radius:50%;background:#f4f1f7;color:#7f6b8b;cursor:pointer}.path-assignment-attachment button svg{width:11px}.path-assignment-actions{display:flex;align-items:center;gap:8px;padding:17px 23px}.path-assignment-actions>div{display:flex;align-items:center;gap:7px;flex:1;color:#93859d;font-size:8px;line-height:1.4}.path-assignment-actions>div svg{width:15px;color:#8052b7}.path-assignment-actions>button{min-height:34px;padding:0 11px;border:1px solid #e1d9e9;border-radius:8px;background:#fff;color:#705e7c;font-size:9px;font-weight:800;cursor:pointer}.path-assignment-actions>button.violet{display:inline-flex;align-items:center;gap:6px;border-color:#7c3aed;background:#7c3aed;color:#fff;box-shadow:0 8px 16px rgba(124,58,237,.16)}.path-assignment-actions>button:disabled{opacity:.65;cursor:not-allowed}.path-assignment-aside{position:sticky;top:20px;overflow:hidden}.path-assignment-aside-hero{padding:21px;background:linear-gradient(145deg,#5720bc,#8c5ce5 63%,#b899ef);color:#fff}.path-assignment-aside-hero>span{display:flex;align-items:center;gap:6px;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.82}.path-assignment-aside-hero>span svg{width:15px}.path-assignment-aside-hero h2{margin:12px 0 7px;font-family:'Manrope',sans-serif;font-size:19px;font-weight:800;letter-spacing:-.055em;line-height:1.12}.path-assignment-aside-hero p{margin:0;font-size:9px;line-height:1.5;opacity:.84}.path-assignment-aside-hero>div{display:flex;align-items:baseline;gap:6px;margin-top:19px}.path-assignment-aside-hero>div strong{font-family:'Manrope',sans-serif;font-size:29px;font-weight:800;letter-spacing:-.07em}.path-assignment-aside-hero>div span{font-size:8px;font-weight:700;opacity:.85}.path-assignment-capacity{margin:13px;padding:13px;border:1px solid #e8e1ed;border-radius:10px;background:#fff}.path-assignment-capacity>div:first-child{display:flex;align-items:center;justify-content:space-between;color:#8f8099;font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.path-assignment-capacity>div:first-child strong{color:#529275;font-family:'Manrope',sans-serif;font-size:12px}.path-assignment-capacity-bar{height:6px;margin:10px 0 7px;border-radius:999px;background:#eee8f3;overflow:hidden}.path-assignment-capacity-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#43ab82,#8cdbbb)}.path-assignment-capacity small{color:#9b8e9f;font-size:8px;line-height:1.4}.path-assignment-aside-section{padding:14px 16px;border-top:1px solid #eee8f1}.path-assignment-aside-heading{display:flex;justify-content:space-between;margin-bottom:8px}.path-assignment-aside-heading span{color:#574663;font-family:'Manrope',sans-serif;font-size:10px;font-weight:800}.path-assignment-aside-heading small{color:#998ca0;font-size:8px;font-weight:700}.path-assignment-workload-row{display:grid;grid-template-columns:27px minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 0;border-top:1px solid #f3eff5}.path-assignment-workload-row>span:nth-child(2){min-width:0}.path-assignment-workload-row strong,.path-assignment-workload-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.path-assignment-workload-row strong{color:#594867;font-size:9px;font-weight:800}.path-assignment-workload-row small{margin-top:3px;color:#9a8e9f;font-size:7px}.path-assignment-workload-row em{padding:4px 5px;border-radius:5px;background:#e8f6ef;color:#4d9474;font-size:8px;font-style:normal;font-weight:800}.path-assignment-workload-row em.busy{background:#fff0ec;color:#ba6859}.path-assignment-empty{margin:0;color:#9b8e9f;font-size:9px;line-height:1.5}.path-assignment-quality>div:not(.path-assignment-aside-heading){display:flex;align-items:center;gap:7px;padding:6px 0;color:#71607d}.path-assignment-quality>div>span{display:grid;width:17px;height:17px;place-items:center;border:1px solid #dfd6e8;border-radius:50%;color:#9c90a1;font-size:8px;font-weight:800}.path-assignment-quality>div>span.complete{border-color:#c8eadb;background:#eaf7f0;color:#4e9a76}.path-assignment-quality>div strong{font-size:8px;font-weight:700}.path-assignment-success{display:flex;align-items:center;gap:7px;margin:14px 0 -2px;padding:10px;border:1px solid #bce7d1;border-radius:8px;background:#f2fcf6;color:#3c8866;font-size:9px;font-weight:700}.path-assignment-success svg{width:14px}.path-assignment-footer{display:flex;justify-content:space-between;gap:12px;margin-top:14px;color:#a195a7;font-size:8px}.path-assignment-footer button{border:0;background:none;color:#7442b9;font-size:8px;font-weight:800;cursor:pointer}@media(max-width:1080px){.path-assignment-content{padding:24px}.path-assignment-layout{grid-template-columns:1fr}.path-assignment-aside{position:static;display:grid;grid-template-columns:1.1fr .9fr .9fr}.path-assignment-aside-hero{grid-row:span 2}.path-assignment-aside-section{border-left:1px solid #eee8f1}.path-assignment-quality{grid-column:2 / 4}}@media(max-width:720px){.path-assignment-content{padding:18px 16px 28px}.path-assignment-hero{flex-direction:column;padding:22px}.path-assignment-hero h1{font-size:28px}.path-assignment-ticket{align-self:stretch;text-align:left}.path-assignment-ticket small{justify-content:flex-start}.path-assignment-field-grid{grid-template-columns:1fr}.path-assignment-aside{display:block}.path-assignment-aside-section{border-left:0}.path-assignment-stages{padding-inline:17px}.path-assignment-section{padding:19px 17px}.path-assignment-actions{flex-wrap:wrap;padding:16px 17px}.path-assignment-actions>div{min-width:100%;margin-bottom:2px}.path-assignment-sla{grid-template-columns:auto 1fr}.path-assignment-sla span:nth-of-type(n+2){grid-column:2}.path-assignment-priorities{grid-template-columns:1fr}.path-assignment-aside-hero{padding:19px}}
      `}</style>
      <style>{`
        .path-assignment-picker-trigger,.path-assignment-picker-trigger>span,.path-assignment-picker-trigger>strong{font-family:'DM Sans',sans-serif !important}.path-assignment-picker-trigger{font-size:10px !important;font-weight:600 !important;letter-spacing:-.01em;line-height:1.2}.path-assignment-picker-trigger>span{font-size:10px !important;font-weight:600 !important;line-height:1.2}.path-assignment-picker-trigger>strong{font-size:12px !important;font-weight:700 !important;line-height:1;color:#806e8d}
        .path-assignment-section:first-of-type .path-assignment-section-head small{font-size:7px!important;line-height:1!important;letter-spacing:.12em}.path-assignment-section:first-of-type .path-assignment-section-head h2{font-size:13px!important;line-height:1.15!important;letter-spacing:-.035em}.path-assignment-section:first-of-type .path-assignment-mode button{min-height:31px!important;padding:0 10px!important;font-size:8px!important;line-height:1!important}.path-assignment-section:first-of-type .path-assignment-role-select{height:34px!important;padding:0 10px!important;font-size:9px!important;line-height:1.1!important}.path-assignment-section:first-of-type .path-assignment-role-select option{font-size:9px!important}
        .path-assignment-section:first-of-type .path-assignment-mode{gap:6px!important;margin-bottom:10px!important}.path-assignment-section:first-of-type .path-assignment-mode button{border-color:#e2dbe9!important;border-radius:7px!important;background:#fff!important;color:#806e8d!important;box-shadow:none!important;transition:border-color .16s ease,background .16s ease,color .16s ease}.path-assignment-section:first-of-type .path-assignment-mode button.active{border-color:#c9b4ef!important;background:#fbf9ff!important;color:#6b39be!important}.path-assignment-section:first-of-type .path-assignment-mode button span{width:7px!important;height:7px!important}.path-assignment-section:first-of-type .path-assignment-picker-trigger{height:39px!important;padding:0 12px!important;border-color:#e0d9e7!important;border-radius:8px!important;background:#fff!important;color:#5e4e6b!important;font-size:9px!important;font-weight:600!important;box-shadow:none!important}.path-assignment-section:first-of-type .path-assignment-picker-trigger>span{font-size:9px!important}.path-assignment-section:first-of-type .path-assignment-picker-trigger>strong{font-size:10px!important}
      `}</style>
      <main className="path-assignment-main">
        <div className="path-assignment-content">
          <header className="path-assignment-hero">
            <div>
              <span className="path-assignment-eyebrow">
                <i /> WORKFLOW CONTROL · NEW HANDOFF
              </span>
              <h1>Assign work with context.</h1>
              <p>
                Build a clear, accountable handoff with the right reviewer, a
                deliberate due date, and the evidence they need to act.
              </p>
            </div>
            <div className="path-assignment-ticket">
              <span>Tracking ID</span>
              <strong>{previewTrackingId}</strong>
              <small>
                <i /> Draft is private until assigned
              </small>
            </div>
          </header>

          <div className="path-assignment-layout">
            <form className="path-assignment-form" onSubmit={submitAssignment}>
              <div className="path-assignment-stages">
                <span className="done">
                  <Icon.Check /> Route
                </span>
                <i />
                <span className="active">2 · Brief</span>
                <i />
                <span>3 · Confirm</span>
              </div>
              <section className="path-assignment-section">
                <div className="path-assignment-section-head">
                  <span className="path-assignment-section-icon">
                    <Icon.Users />
                  </span>
                  <div>
                    <small>01 · Assignment</small>
                    <h2>Choose who owns this handoff</h2>
                  </div>
                </div>
                <div
                  className="path-assignment-mode"
                  role="group"
                  aria-label="Recipient mode"
                >
                  <button
                    className={assignMode === "individual" ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setAssignMode("individual");
                      setSelectedRole("");
                    }}
                  >
                    <span /> Specific faculty
                  </button>
                  <button
                    className={assignMode === "role" ? "active" : ""}
                    type="button"
                    onClick={() => {
                      setAssignMode("role");
                      setSelectedFacultyIds([]);
                      setFacultyPickerOpen(false);
                    }}
                  >
                    <span /> Entire role group
                  </button>
                </div>
                {assignMode === "individual" ? (
                  <div className="path-assignment-picker" ref={pickerRef}>
                    <button
                      className="path-assignment-picker-trigger"
                      type="button"
                      onClick={() => setFacultyPickerOpen((open) => !open)}
                    >
                      <span>
                        {selectedFaculty.length
                          ? `${selectedFaculty.length} faculty member${selectedFaculty.length === 1 ? "" : "s"} selected`
                          : "Select faculty members (multiple allowed)"}
                      </span>
                      <strong>⌄</strong>
                    </button>
                    {facultyPickerOpen && (
                      <div className="path-assignment-picker-menu">
                        <label className="path-assignment-picker-all">
                          <input
                            type="checkbox"
                            checked={
                              facultyList.length > 0 &&
                              selectedFaculty.length === facultyList.length
                            }
                            onChange={selectAllFaculty}
                          />{" "}
                          Select all faculty
                        </label>
                        {facultyList.map((member) => (
                          <label
                            key={member.id}
                            className="path-assignment-picker-option"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFacultyIds.includes(member.id)}
                              onChange={() => toggleFaculty(member.id)}
                            />
                            <span className="path-assignment-avatar">
                              {initials(member.full_name)}
                            </span>
                            <span>
                              {member.full_name}
                              <small> · Faculty reviewer</small>
                            </span>
                          </label>
                        ))}
                        {!facultyList.length && (
                          <p
                            className="path-assignment-empty"
                            style={{ padding: 12 }}
                          >
                            No faculty members are currently available.
                          </p>
                        )}
                      </div>
                    )}
                    {!!selectedFaculty.length && (
                      <div className="path-assignment-chips">
                        {selectedFaculty.map((member) => (
                          <span
                            className="path-assignment-chip"
                            key={member.id}
                          >
                            {member.full_name}
                            <button
                              type="button"
                              onClick={() => toggleFaculty(member.id)}
                              aria-label={`Remove ${member.full_name}`}
                            >
                              <Icon.Close />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <select
                    className="path-assignment-role-select"
                    value={selectedRole}
                    onChange={(event) => setSelectedRole(event.target.value)}
                  >
                    <option value="">Choose a role group</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              <section className="path-assignment-section">
                <div className="path-assignment-section-head">
                  <span className="path-assignment-section-icon">
                    <Icon.File />
                  </span>
                  <div>
                    <small>02 · Brief</small>
                    <h2>Make the work easy to understand</h2>
                  </div>
                </div>
                <div className="path-assignment-field-grid title">
                  <label className="path-assignment-field">
                    Task title
                    <input
                      value={form.title}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="e.g. Validate the annual assessment evidence"
                    />
                  </label>
                </div>
                <div className="path-assignment-field-grid">
                  <label className="path-assignment-field">
                    Document type
                    <select
                      value={form.doc_type}
                      onChange={(event) => {
                        const docType = event.target.value;
                        const matched = slaRules.find(
                          (rule) =>
                            rule.document_type === docType &&
                            (rule.status ?? "Active") === "Active",
                        );
                        setForm((current) => ({
                          ...current,
                          doc_type: docType,
                          priority: matched?.priority || current.priority,
                        }));
                      }}
                    >
                      <option value="">Choose a workflow type</option>
                      {docTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="path-assignment-field">
                    Due date
                    <input
                      type="date"
                      value={form.deadline}
                      min={windowStart.date}
                      max={windowEnd.date}
                      disabled={!form.doc_type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          deadline: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="path-assignment-field">
                    Due time
                    <input
                      type="time"
                      value={form.deadlineTime}
                      min={
                        form.deadline === windowStart.date
                          ? windowStart.time
                          : "00:00"
                      }
                      max={
                        form.deadline === windowEnd.date
                          ? windowEnd.time
                          : "23:59"
                      }
                      disabled={!form.doc_type || !form.deadline}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          deadlineTime: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <p className="path-assignment-sla-hint">
                  {form.doc_type
                    ? `The due date must stay within the current ${turnaroundHours}-hour SLA window, in Philippines time (UTC+8).`
                    : "Select a document type to unlock its SLA-aware deadline window."}
                </p>
                <label className="path-assignment-notes">
                  Context and objectives
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="What should the reviewer check, decide, or return? Add decision context so the handoff can move without a follow-up."
                  />
                </label>
              </section>

              <section className="path-assignment-section">
                <div className="path-assignment-section-head">
                  <span className="path-assignment-section-icon">
                    <Icon.Spark />
                  </span>
                  <div>
                    <small>03 · Routing</small>
                    <h2>Set the urgency and evidence</h2>
                  </div>
                </div>
                <div
                  className="path-assignment-priorities"
                  role="group"
                  aria-label="Task priority"
                >
                  {["High", "Medium", "Low"].map((priority) => (
                    <button
                      className={
                        form.priority === priority
                          ? `active ${priority.toLowerCase()}`
                          : ""
                      }
                      type="button"
                      key={priority}
                      onClick={() =>
                        setForm((current) => ({ ...current, priority }))
                      }
                    >
                      <i /> {priority}
                      <small>
                        {priority === "High"
                          ? "Decision needed"
                          : priority === "Medium"
                            ? "Standard review"
                            : "Background work"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="path-assignment-sla">
                  <Icon.Clock />
                  <span>
                    <small>
                      {documentSlaRule
                        ? "Configured review window"
                        : "PATH review window"}
                    </small>
                    <strong>{activeSla.turnaround}</strong>
                  </span>
                  <span>
                    <small>Escalation</small>
                    <strong>{activeSla.escalation}</strong>
                  </span>
                  <span>
                    <small>Review gate</small>
                    <strong>{activeSla.review}</strong>
                  </span>
                </div>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  multiple
                  style={{ display: "none" }}
                  onChange={(event) => handleAttach(event.target.files)}
                />
                <button
                  className={`path-assignment-dropzone ${dragOver ? "drag" : ""}`}
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragOver(false);
                    handleAttach(event.dataTransfer.files);
                  }}
                >
                  <Icon.Clip />
                  <span>
                    <strong>Attach supporting files</strong>
                    <small>
                      Briefs, evidence, or related documents · maximum 10 MB
                      each
                    </small>
                  </span>
                  <span>↗</span>
                </button>
                {!!attachments.length && (
                  <div className="path-assignment-attachments">
                    {attachments.map((item) => (
                      <div className="path-assignment-attachment" key={item.id}>
                        <span className="path-assignment-file-kind">
                          {fileKind(item.file.name)}
                        </span>
                        <span>
                          <strong>{item.file.name}</strong>
                          <small
                            className={item.status === "error" ? "error" : ""}
                          >
                            {item.status === "uploading"
                              ? `Uploading · ${item.progress}%`
                              : item.status === "error"
                                ? "Upload failed — remove and try again"
                                : `Uploaded · ${(item.file.size / 1024 / 1024).toFixed(2)} MB`}
                          </small>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(item.id)}
                          aria-label={`Remove ${item.file.name}`}
                        >
                          <Icon.Close />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {!!successTrackingId && (
                  <div className="path-assignment-success">
                    <Icon.Check /> Task assigned successfully ·{" "}
                    {successTrackingId}
                  </div>
                )}
              </section>

              <footer className="path-assignment-actions">
                <div>
                  <Icon.Spark />
                  <span>
                    {incompleteSteps
                      ? `${readySteps} of 4 required details are ready.`
                      : "Your assignment has the essentials to route."}
                  </span>
                </div>
                <button type="button" onClick={saveDraft}>
                  Save draft
                </button>
                <button
                  className="violet"
                  type="submit"
                  disabled={
                    submitting ||
                    attachments.some((item) => item.status === "uploading")
                  }
                >
                  <Icon.Send />{" "}
                  {submitting
                    ? "Assigning…"
                    : attachments.some((item) => item.status === "uploading")
                      ? "Uploading files…"
                      : "Assign task"}
                </button>
              </footer>
            </form>

            <aside className="path-assignment-aside">
              <section className="path-assignment-aside-hero">
                <span>
                  <Icon.Spark /> Routing lens
                </span>
                <h2>Balance intent with availability.</h2>
                <p>
                  PATH surfaces live assignment load before you route a
                  deadline-sensitive handoff.
                </p>
                <div>
                  <strong>{routingLoad}%</strong>
                  <span>current routing load</span>
                </div>
              </section>
              <section className="path-assignment-capacity">
                <div>
                  <span>Available capacity</span>
                  <strong>{Math.max(0, 100 - routingLoad)}%</strong>
                </div>
                <div className="path-assignment-capacity-bar">
                  <i style={{ width: `${routingLoad}%` }} />
                </div>
                <small>
                  {routingMembers.length} reviewer
                  {routingMembers.length === 1 ? "" : "s"} in the current
                  routing set.
                </small>
              </section>
              <section className="path-assignment-aside-section">
                <div className="path-assignment-aside-heading">
                  <span>Current routing set</span>
                  <small>
                    {assignMode === "individual" ? "Selected" : "Role pool"}
                  </small>
                </div>
                {routingMembers.length ? (
                  routingMembers.slice(0, 5).map((member) => (
                    <div
                      className="path-assignment-workload-row"
                      key={member.id}
                    >
                      <span className="path-assignment-avatar">
                        {initials(member.full_name)}
                      </span>
                      <span>
                        <strong>{member.full_name}</strong>
                        <small>
                          {member.active} active handoff
                          {member.active === 1 ? "" : "s"} · Faculty reviewer
                        </small>
                      </span>
                      <em className={member.load >= 75 ? "busy" : ""}>
                        {member.load}%
                      </em>
                    </div>
                  ))
                ) : (
                  <p className="path-assignment-empty">
                    Select a recipient to review their active workload.
                  </p>
                )}
              </section>
              <section className="path-assignment-aside-section path-assignment-quality">
                <div className="path-assignment-aside-heading">
                  <span>Handoff quality</span>
                  <small>{incompleteSteps ? "In progress" : "Ready"}</small>
                </div>
                {[
                  "Clear owner",
                  "Document context",
                  "Due date",
                  "Review guidance",
                ].map((label, index) => (
                  <div key={label}>
                    <span className={index < readySteps ? "complete" : ""}>
                      {index < readySteps ? <Icon.Check /> : index + 1}
                    </span>
                    <strong>{label}</strong>
                  </div>
                ))}
              </section>
            </aside>
          </div>
          <footer className="path-assignment-footer">
            <span>PATH keeps every handoff visible and accountable.</span>
            <button type="button" onClick={() => navigate("/tasks")}>
              View task desk ↗
            </button>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default function TaskAssignment() {
  return (
    <ErrorBoundary>
      <TaskAssignmentInner />
    </ErrorBoundary>
  );
}
