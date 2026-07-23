import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import {
  Plus, Eye, Pencil, Archive, Trash2, Search, ChevronDown,
  Layers, CheckCircle2, Inbox as InboxIcon, BarChart3,
  X, GripVertical, Check,
} from "lucide-react";

// ── Role-based nav visibility (matches Dashboard.jsx) ──────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Sidebar SVG Icons (kept identical to Dashboard.jsx) ─────────────────────
const Icon = {
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" />
    </svg>
  ),
  Plus: ({ color = "currentColor", size = 14 }) => (
    <svg viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" width={size} height={size}>
      <path d="M8 1v14M1 8h14" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  Workflow: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z" />
    </svg>
  ),
  Forms: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="6" cy="5" r="3" />
      <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  Help: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  Tracking: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),
};

// ── Sidebar Item (identical to Dashboard.jsx) ───────────────────────────────
function SbItem({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        color: active ? "white" : "#c8c4e0",
        fontSize: 12,
        cursor: "pointer",
        borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent",
        background: active ? "rgba(124,58,237,0.18)" : "transparent",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
      {label}
    </div>
  );
}

// ── Sample category data (mirrors the reference screenshot) ────────────────
const FIELD_TYPES = ["Text Input", "Text Area", "Date", "Dropdown", "Number", "Checkbox", "File Upload"];

let nextFieldId = 100;
const mkField = (name, fieldType, required) => ({ id: nextFieldId++, name, fieldType, required });

const CATEGORIES = [
  {
    id: 1,
    name: "Faculty Task Assignment",
    code: "FTA-004",
    description: "Template for assigning tasks and deliverables to faculty members.",
    type: "Document",
    fields: 6,
    status: "Active",
    dateCreated: "Feb 10, 2024",
    formFields: [
      mkField("Task Title", "Text Input", true),
      mkField("Assigned Faculty", "Dropdown", true),
      mkField("Due Date", "Date", true),
      mkField("Priority Level", "Dropdown", true),
      mkField("Instructions", "Text Area", true),
      mkField("Attachments", "File Upload", false),
    ],
  },
  {
    id: 2,
    name: "Clearance Request",
    code: "CLR-003",
    description: "Submission form for student clearance processing.",
    type: "Form",
    fields: 4,
    status: "Active",
    dateCreated: "Feb 1, 2024",
    formFields: [
      mkField("Student Name", "Text Input", true),
      mkField("Student ID", "Text Input", true),
      mkField("Program", "Dropdown", true),
      mkField("Remarks", "Text Area", false),
    ],
  },
  {
    id: 3,
    name: "Completion Form",
    code: "CPF-002",
    description: "Form used by students to request completion of incomplete grades.",
    type: "Form",
    fields: 5,
    status: "Active",
    dateCreated: "Jan 20, 2024",
    formFields: [
      mkField("Student Name", "Text Input", true),
      mkField("Course Code", "Text Input", true),
      mkField("Reason for Incomplete", "Text Area", true),
      mkField("Requested Completion Date", "Date", true),
      mkField("Instructor Endorsement", "Checkbox", false),
    ],
  },
  {
    id: 4,
    name: "Student Request Form",
    code: "SRF-001",
    description: "General student request form for academic-related concerns.",
    type: "Form",
    fields: 6,
    status: "Active",
    dateCreated: "Jan 15, 2024",
    formFields: [
      mkField("Student Name", "Text Input", true),
      mkField("Student ID", "Text Input", true),
      mkField("Request Type", "Dropdown", true),
      mkField("Details", "Text Area", true),
      mkField("Preferred Contact", "Text Input", false),
      mkField("Supporting Document", "File Upload", false),
    ],
  },
  {
    id: 5,
    name: "Document Endorsement",
    code: "DEN-005",
    description: "Endorsement form for routing documents through academic offices.",
    type: "Form",
    fields: 4,
    status: "Archived",
    dateCreated: "Nov 5, 2023",
    formFields: [
      mkField("Document Title", "Text Input", true),
      mkField("Originating Office", "Text Input", true),
      mkField("Endorsement Date", "Date", true),
      mkField("Remarks", "Text Area", false),
    ],
  },
];

const TYPE_CFG = {
  Document: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  Form: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
};

const STATUS_CFG = {
  Active: { bg: "#ecfdf5", color: "#059669", dot: "#10b981" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" },
  Archived: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
};

const STATUS_FILTERS = ["All", "Active", "Inactive", "Archived"];

function ActionBtn({ children, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 6, border: "1px solid transparent",
        background: "transparent", color: danger ? "#9ca3af" : "#6b7280",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = danger ? "#fef2f2" : "#f3f4f6";
        e.currentTarget.style.color = danger ? "#dc2626" : "#374151";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = danger ? "#9ca3af" : "#6b7280";
      }}
    >
      {children}
    </button>
  );
}

// ── Toggle switch (used for Required flag) ──────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 34, height: 19, borderRadius: 20, border: "none", cursor: "pointer",
        background: checked ? "#7c3aed" : "#e2e2e7", position: "relative", flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 17 : 2,
        width: 15, height: 15, borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.15s",
      }} />
    </button>
  );
}

// ── Segmented pill toggle (Transaction Type / Status) ───────────────────────
function SegButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
        cursor: "pointer", border: active ? "1px solid #7c3aed" : "1px solid #e5e7eb",
        background: active ? "#7c3aed" : "white", color: active ? "white" : "#374151",
      }}
    >
      {label}
    </button>
  );
}

// ── Edit Category Modal ──────────────────────────────────────────────────────
function EditCategoryModal({ category, onClose, onSave }) {
  const [name, setName] = useState(category.name);
  const [code, setCode] = useState(category.code);
  const [description, setDescription] = useState(category.description);
  const [type, setType] = useState(category.type);
  const [status, setStatus] = useState(category.status === "Archived" ? "Active" : category.status);
  const [fields, setFields] = useState(category.formFields || []);

  const updateField = (id, patch) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };
  const removeField = (id) => setFields(prev => prev.filter(f => f.id !== id));
  const addField = () => {
    nextFieldId += 1;
    setFields(prev => [...prev, { id: nextFieldId, name: "", fieldType: "Text Input", required: false }]);
  };

  const handleSave = () => {
    const savedFields = type === "Document" ? [] : fields;
    onSave({ ...category, name, code, description, type, status, formFields: savedFields, fields: savedFields.length });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", zIndex: 2000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "40px 20px", overflowY: "auto",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 16, width: "100%", maxWidth: 620,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column",
          maxHeight: "calc(100vh - 80px)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #eee", flexShrink: 0 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Edit Category</h2>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto" }}>

          {/* Name / Code */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Category Name <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 13, color: "#111827", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Category Code <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 13, color: "#111827", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 13, color: "#111827", outline: "none", resize: "vertical", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Transaction Type / Status */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Transaction Type <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <SegButton label="Form" active={type === "Form"} onClick={() => setType("Form")} />
                <SegButton label="Document" active={type === "Document"} onClick={() => setType("Document")} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                <SegButton label="Active" active={status === "Active"} onClick={() => setStatus("Active")} />
                <SegButton label="Inactive" active={status === "Inactive"} onClick={() => setStatus("Inactive")} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #eee", margin: "0 0 18px" }} />

          {/* Form Fields — only applicable when Transaction Type is "Form" */}
          {type === "Document" ? (
            <div style={{
              padding: "16px 18px", borderRadius: 10, background: "#f9fafb",
              border: "1px dashed #e5e7eb", textAlign: "center",
            }}>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>
                Document categories don't use custom form fields — only the description above is required for this category.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Form Fields</h3>
                <button
                  onClick={addField}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                    borderRadius: 8, border: "1px solid #ddd6fe", background: "#f5f3ff",
                    color: "#7c3aed", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Plus style={{ width: 13, height: 13 }} /> Add Field
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {fields.map((f, idx) => (
                  <div key={f.id} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    border: "1px solid #eee", borderRadius: 10, background: "#fafafa",
                  }}>
                    <GripVertical style={{ width: 14, height: 14, color: "#c4c4c4", cursor: "grab", flexShrink: 0 }} />
                    <span style={{
                      width: 20, height: 20, borderRadius: 6, background: "#e5e7eb", color: "#6b7280",
                      fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {idx + 1}
                    </span>
                    <input
                      value={f.name}
                      onChange={e => updateField(f.id, { name: e.target.value })}
                      placeholder="Field label"
                      style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12.5, color: "#111827", outline: "none", background: "white", fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <select
                      value={f.fieldType}
                      onChange={e => updateField(f.id, { fieldType: e.target.value })}
                      style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12.5, color: "#374151", outline: "none", background: "white", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}
                    >
                      {FIELD_TYPES.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <Toggle checked={f.required} onChange={() => updateField(f.id, { required: !f.required })} />
                      <span style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600 }}>Req.</span>
                    </div>
                    <button
                      onClick={() => removeField(f.id)}
                      style={{ background: "transparent", border: "none", color: "#c4c4c4", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                      onMouseLeave={e => e.currentTarget.style.color = "#c4c4c4"}
                    >
                      <X style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ))}
                {fields.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No fields yet — click "Add Field" to create one.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #eee", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563eb", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
            onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
          >
            <Check style={{ width: 14, height: 14 }} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{
      flex: 1, background: "white", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: "16px 18px",
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.6, textTransform: "uppercase" }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 800, color: valueColor || "#111827", margin: "6px 0 4px", lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{sub}</p>
    </div>
  );
}

export default function DocumentCategories() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Date Created");
  const [categories, setCategories] = useState(CATEGORIES);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleSaveCategory = (updated) => {
    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
    setEditingCategory(null);
  };

  const role = (typeof window !== "undefined" && localStorage.getItem("role")) || "admin";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(role);
  const displayName = (typeof window !== "undefined" && localStorage.getItem("name")) || "PATH Administrator";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.status === "Active").length;
  const archivedCategories = categories.filter(c => c.status === "Archived").length;
  const usedThisMonth = 113;

  const filtered = useMemo(() => {
    return categories.filter(c => {
      const matchesStatus = statusFilter === "All" ? true : c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q
        || c.name.toLowerCase().includes(q)
        || c.code.toLowerCase().includes(q)
        || c.description.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [search, statusFilter, categories]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 200, background: "#1e1b2e", color: "#c8c4e0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        {/* Nav */}
        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          {canViewAdminNav && <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => navigate("/reports")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-dashboard")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Categories />} label="Document Categories" active={true} onClick={() => navigate("/document-categories")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>

        {/* Bottom */}
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={handleLogout} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
              <Icon.Search />
              <input
                type="text"
                placeholder="Search categories..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <button onClick={() => {}} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 whitespace-nowrap" style={{ cursor: "pointer" }}>
              <Icon.Plus /> Add Category
            </button>
          </div>
        </TopBar>

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto", padding: "24px 28px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Document Categories</h1>
              <p style={{ fontSize: 13, color: "#6b7280" }}>Create and manage document categories with custom form fields.</p>
            </div>
            <button
              onClick={() => {}}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                borderRadius: 9, border: "none", background: "#7c3aed", color: "white",
                fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#6d28d9"}
              onMouseLeave={e => e.currentTarget.style.background = "#7c3aed"}
            >
              <Icon.Plus size={13} color="white" /> Add Category
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <StatCard label="Total Categories" value={totalCategories} sub={`${totalCategories - archivedCategories} non-archived`} />
            <StatCard label="Active Categories" value={activeCategories} valueColor="#059669" sub="Visible to users" />
            <StatCard label="Archived Categories" value={archivedCategories} valueColor="#d97706" sub="Hidden from users" />
            <StatCard label="Used This Month" value={usedThisMonth} valueColor="#2563eb" sub="Total submissions" />
          </div>

          {/* Search + filters */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{
              flex: "1 1 320px", display: "flex", alignItems: "center", gap: 8,
              background: "white", border: "1px solid #e5e7eb", borderRadius: 9,
              padding: "10px 14px", color: "#9ca3af",
            }}>
              <Search style={{ width: 15, height: 15 }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search category name, code, or description..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12.5, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Status:</span>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", whiteSpace: "nowrap",
                    border: statusFilter === s ? "1px solid #7c3aed" : "1px solid #e5e7eb",
                    background: statusFilter === s ? "#7c3aed" : "white",
                    color: statusFilter === s ? "white" : "#6b7280",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>Sort by:</span>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                border: "1px solid #e5e7eb", borderRadius: 8, background: "white",
                fontSize: 12, color: "#374151", fontWeight: 600, cursor: "pointer",
              }}>
                {sortBy} <ChevronDown style={{ width: 13, height: 13, color: "#9ca3af" }} />
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>{filtered.length} categories found</p>

          {/* Table */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
                  {["Category Name", "Code", "Description", "Type", "Fields", "Status", "Date Created", "Actions"].map((h, i) => (
                    <th key={h} style={{
                      textAlign: i === 7 ? "center" : "left", padding: "12px 16px",
                      fontSize: 10.5, fontWeight: 700, color: "#6b7280",
                      letterSpacing: 0.4, textTransform: "uppercase", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => {
                  const tCfg = TYPE_CFG[c.type];
                  const sCfg = STATUS_CFG[c.status];
                  return (
                    <tr key={c.id} style={{ borderBottom: idx === filtered.length - 1 ? "none" : "1px solid #f1f1f4" }}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#111827", maxWidth: 160 }}>{c.name}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, color: "#6b7280", background: "#f3f4f6",
                          border: "1px solid #e5e7eb", borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                        }}>
                          {c.code}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#6b7280", maxWidth: 280 }}>{c.description}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                          background: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.border}`,
                        }}>
                          {c.type}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "#374151", fontWeight: 600 }}>{c.fields}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                          background: sCfg.bg, color: sCfg.color,
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sCfg.dot, display: "inline-block" }} />
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#6b7280", whiteSpace: "nowrap" }}>{c.dateCreated}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                          <ActionBtn title="View"><Eye style={{ width: 14, height: 14 }} /></ActionBtn>
                          <ActionBtn title="Edit" onClick={() => setEditingCategory(c)}><Pencil style={{ width: 14, height: 14 }} /></ActionBtn>
                          {c.status !== "Archived" && (
                            <ActionBtn title="Archive"><Archive style={{ width: 14, height: 14 }} /></ActionBtn>
                          )}
                          <ActionBtn title="Delete" danger><Trash2 style={{ width: 14, height: 14 }} /></ActionBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No categories match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid #f1f1f4" }}>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>Last updated: July 23, 2026</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>PATH v2.4 · Document Categories Module</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px", borderTop: "0.5px solid #e5e7eb", fontSize: 10, color: "#aaa", background: "white" }}>
          <span>© 2026 PATH Document Management System. All rights reserved.</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
              System Operational
            </span>
            <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>Privacy Policy</a>
            <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>Terms of Service</a>
          </div>
        </div>

      </div>

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
}
