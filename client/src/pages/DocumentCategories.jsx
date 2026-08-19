import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import {
  Plus, Eye, Pencil, Archive, Trash2, Search, ChevronDown,
  Layers, CheckCircle2, Inbox as InboxIcon, BarChart3,
  X, GripVertical, Check,
} from "lucide-react";

// ── Role-based nav visibility (matches Dashboard.jsx) ──────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── API base URL ────────────────────────────────────────────────────────────
// Points at your Render backend. Set VITE_API_URL (Vite) or
// REACT_APP_API_URL (CRA) in Vercel's project env vars to your Render URL,
// e.g. https://path-backend.onrender.com — falls back to same-origin "/api"
// if neither is set, which only works if you're proxying through Vercel.
const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_URL) ||
  "";

async function apiFetch(path, options = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let body = null;
  try { body = await res.json(); } catch { /* no JSON body */ }

  if (!res.ok) {
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body;
}

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
  SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// ── Sample category data (mirrors the reference screenshot) ────────────────
const FIELD_TYPES = ["Text Input", "Text Area", "Date", "Dropdown", "Number", "Checkbox", "File Upload"];

let nextFieldId = 100;
const mkField = (name, fieldType, required) => ({ id: nextFieldId++, name, fieldType, required });

// ── Auto-generate a category code from the name (e.g. "Student Request Form" → SRF-006) ──
function generateCategoryCode(name, existingCodes) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let letters = words.map(w => w[0]).join("").toUpperCase().replace(/[^A-Z]/g, "");
  if (letters.length < 2) letters = (name.replace(/[^a-zA-Z]/g, "").toUpperCase() + "XXX").slice(0, 3);
  letters = letters.slice(0, 4) || "CAT";

  let n = 1;
  let candidate;
  do {
    candidate = `${letters}-${String(n).padStart(3, "0")}`;
    n += 1;
  } while (existingCodes.includes(candidate));
  return candidate;
}


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

// ── PATH admin palette (matches the Document Categories reference layout) ───
const PAGE = {
  primary: "#6b38d4",
  primaryHover: "#5c2fb8",
  onBackground: "#181445",
  onSurfaceVariant: "#494454",
  outline: "#7b7486",
  outlineVariant: "#cbc3d7",
  surface: "#fcf8ff",
  surfaceContainerLow: "#f6f2ff",
  surfaceContainerLowest: "#ffffff",
  background: "#f8f6ff",
  borderSoft: "rgba(107,56,212,0.16)",
  shadow: "0 4px 12px rgba(139,92,246,0.05)",
};

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

// ── Multi-select / Single-select segmented toggle (Checkbox fields only) ────
// Lets the program chair / admin decide whether respondents can tick more
// than one choice (classic checkbox group) or only one at a time (radio-style).
function MultiSelectToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.4, textTransform: "uppercase", flexShrink: 0 }}>
        Selection Mode
      </span>
      <div style={{ display: "flex", gap: 4, background: "white", border: "1px solid #ddd6fe", borderRadius: 7, padding: 2 }}>
        {[
          { key: true, label: "Multiple" },
          { key: false, label: "Single" },
        ].map(opt => (
          <button
            key={String(opt.key)}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              padding: "4px 10px", borderRadius: 5, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              background: value === opt.key ? "#7c3aed" : "transparent",
              color: value === opt.key ? "white" : "#7c3aed",
              transition: "background 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <span style={{ fontSize: 10.5, color: "#a78bfa" }}>
        {value ? "Respondents can check more than one" : "Respondents can check only one"}
      </span>
    </div>
  );
}

// ── Choices Editor (lets faculty define the options for a Dropdown or
//    Checkbox field). `children`, if provided, renders above the choice
//    list — used by Checkbox fields to show the Multi/Single select toggle. ──
function ChoicesEditor({ options = [], onChange, title = "Choices", children }) {
  const [draft, setDraft] = useState("");

  const addOption = () => {
    const val = draft.trim();
    if (!val) return;
    if (options.some(o => o.toLowerCase() === val.toLowerCase())) { setDraft(""); return; }
    onChange([...options, val]);
    setDraft("");
  };

  const updateOption = (idx, val) => onChange(options.map((o, i) => (i === idx ? val : o)));
  const removeOption = (idx) => onChange(options.filter((_, i) => i !== idx));

  return (
    <div style={{
      marginLeft: 30, padding: "12px 14px", borderRadius: 9,
      background: "#f5f3ff", border: "1px solid #ddd6fe",
    }}>
      <p style={{ fontSize: 10.5, fontWeight: 700, color: "#7c3aed", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
        {title}
      </p>

      {children}

      {options.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
          {options.map((opt, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, fontSize: 10.5, color: "#a78bfa", flexShrink: 0 }}>{idx + 1}.</span>
              <input
                value={opt}
                onChange={e => updateOption(idx, e.target.value)}
                style={{
                  flex: 1, minWidth: 0, padding: "6px 9px", borderRadius: 7,
                  border: "1px solid #e5e7eb", fontSize: 12, color: "#111827",
                  outline: "none", background: "white", fontFamily: "'DM Sans', sans-serif",
                }}
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                style={{ background: "transparent", border: "none", color: "#c4b5fd", cursor: "pointer", padding: 2, flexShrink: 0, display: "flex" }}
                onMouseEnter={e => e.currentTarget.style.color = "#dc2626"}
                onMouseLeave={e => e.currentTarget.style.color = "#c4b5fd"}
              >
                <X style={{ width: 12, height: 12 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {options.length === 0 && (
        <p style={{ fontSize: 11.5, color: "#a78bfa", fontStyle: "italic", marginBottom: 8 }}>
          No choices yet — add the options faculty will pick from below.
        </p>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
          placeholder="Add a choice…"
          style={{
            flex: 1, minWidth: 0, padding: "6px 9px", borderRadius: 7,
            border: "1px solid #e5e7eb", fontSize: 12, color: "#111827",
            outline: "none", background: "white", fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          type="button"
          onClick={addOption}
          style={{
            display: "flex", alignItems: "center", gap: 4, padding: "6px 11px",
            borderRadius: 7, border: "1px solid #7c3aed", background: "#7c3aed",
            color: "white", fontSize: 11.5, fontWeight: 700, cursor: "pointer", flexShrink: 0,
          }}
        >
          <Plus style={{ width: 11, height: 11 }} /> Add Choice
        </button>
      </div>
    </div>
  );
}

// ── Edit Category Modal ──────────────────────────────────────────────────────
function EditCategoryModal({ category, onClose, onSave, error }) {
  const [name, setName] = useState(category.name);
  const code = category.code;
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
                readOnly
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb",
                  fontSize: 13, color: "#6b7280", outline: "none", background: "#f3f4f6",
                  fontFamily: "'DM Sans', sans-serif", cursor: "not-allowed",
                }}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>Can't be changed after creation</p>
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
                  <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{
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
                        onChange={e => updateField(f.id, {
                          fieldType: e.target.value,
                          ...(e.target.value === "Dropdown" && !f.options ? { options: [] } : {}),
                          ...(e.target.value === "Checkbox" && !f.options ? { options: [], multiSelect: true } : {}),
                        })}
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
                    {(f.fieldType === "Dropdown" || f.fieldType === "Checkbox") && (
                      <ChoicesEditor
                        title={f.fieldType === "Dropdown" ? "Dropdown Choices" : "Checkbox Choices"}
                        options={f.options || []}
                        onChange={(opts) => updateField(f.id, { options: opts })}
                      >
                        {f.fieldType === "Checkbox" && (
                          <MultiSelectToggle
                            value={f.multiSelect !== false}
                            onChange={(val) => updateField(f.id, { multiSelect: val })}
                          />
                        )}
                      </ChoicesEditor>
                    )}
                  </div>
                ))}
                {fields.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "#9ca3af", textAlign: "center", padding: "16px 0" }}>No fields yet — click "Add Field" to create one.</p>
                )}
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
            borderRadius: 9, padding: "10px 14px", fontSize: 12.5,
            margin: "0 24px 14px",
          }}>
            {error}
          </div>
        )}

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
// ── Add Category Modal ───────────────────────────────────────────────────────
function AddCategoryModal({ onClose, onCreate, existingCodes = [], error }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Form");
  const [status, setStatus] = useState("Active");
  const [fields, setFields] = useState([]);

  // Code is derived automatically from the name and can't be hand-edited.
  useEffect(() => {
    setCode(name.trim() ? generateCategoryCode(name, existingCodes) : "");
  }, [name, existingCodes]);

  const updateField = (id, patch) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  };
  const removeField = (id) => setFields(prev => prev.filter(f => f.id !== id));
  const addField = () => {
    nextFieldId += 1;
    setFields(prev => [...prev, { id: nextFieldId, name: "", fieldType: "Text Input", required: false }]);
  };

  const canCreate = name.trim().length > 0 && code.trim().length > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    const savedFields = type === "Document" ? [] : fields;
    onCreate({
      id: Date.now(),
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      type,
      status,
      formFields: savedFields,
      fields: savedFields.length,
      dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Add New Category</h2>
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
                placeholder="e.g. Student Request Form"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb", fontSize: 13, color: "#111827", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Category Code
              </label>
              <input
                value={code}
                readOnly
                placeholder="Auto-generated from name"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e7eb",
                  fontSize: 13, color: "#6b7280", outline: "none", background: "#f3f4f6",
                  fontFamily: "'DM Sans', sans-serif", cursor: "not-allowed",
                }}
              />
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>Auto-generated, can't be edited</p>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe the purpose of this category..."
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

              {fields.length === 0 ? (
                <div style={{
                  padding: "28px 18px", borderRadius: 10, background: "#fafafa",
                  border: "1px dashed #e5e7eb", textAlign: "center",
                }}>
                  <p style={{ fontSize: 12.5, color: "#9ca3af" }}>
                    No fields added yet. Click "Add Field" to start building your form.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {fields.map((f, idx) => (
                    <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{
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
                          onChange={e => updateField(f.id, {
                            fieldType: e.target.value,
                            ...(e.target.value === "Dropdown" && !f.options ? { options: [] } : {}),
                            ...(e.target.value === "Checkbox" && !f.options ? { options: [], multiSelect: true } : {}),
                          })}
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
                      {(f.fieldType === "Dropdown" || f.fieldType === "Checkbox") && (
                        <ChoicesEditor
                          title={f.fieldType === "Dropdown" ? "Dropdown Choices" : "Checkbox Choices"}
                          options={f.options || []}
                          onChange={(opts) => updateField(f.id, { options: opts })}
                        >
                          {f.fieldType === "Checkbox" && (
                            <MultiSelectToggle
                              value={f.multiSelect !== false}
                              onChange={(val) => updateField(f.id, { multiSelect: val })}
                            />
                          )}
                        </ChoicesEditor>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
            borderRadius: 9, padding: "10px 14px", fontSize: 12.5,
            margin: "0 24px 14px",
          }}>
            {error}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #eee", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none",
              background: canCreate ? "#2563eb" : "#93c5fd", color: "white", fontSize: 12.5, fontWeight: 700,
              cursor: canCreate ? "pointer" : "not-allowed",
            }}
            onMouseEnter={e => { if (canCreate) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={e => { if (canCreate) e.currentTarget.style.background = "#2563eb"; }}
          >
            <Check style={{ width: 14, height: 14 }} /> Create Category
          </button>
        </div>
      </div>
    </div>
  );
}

// ── View Category Modal (read-only) ──────────────────────────────────────────
function ViewCategoryModal({ category, onClose, onEdit }) {
  const tCfg = TYPE_CFG[category.type];
  const sCfg = STATUS_CFG[category.status] || STATUS_CFG.Active;

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
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{category.name}</h2>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#6b7280", background: "#f3f4f6",
              border: "1px solid #e5e7eb", borderRadius: 6, padding: "2px 7px", marginTop: 4, display: "inline-block",
            }}>
              {category.code}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto" }}>

          {/* Type / Status badges */}
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <span style={{
              fontSize: 11.5, fontWeight: 700, padding: "4px 12px", borderRadius: 6,
              background: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.border}`,
            }}>
              {category.type}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11.5, fontWeight: 700, padding: "4px 12px", borderRadius: 20,
              background: sCfg.bg, color: sCfg.color,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sCfg.dot, display: "inline-block" }} />
              {category.status}
            </span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Description</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              {category.description || "No description provided."}
            </p>
          </div>

          {/* Meta */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Date Created</p>
              <p style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{category.dateCreated}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>Fields</p>
              <p style={{ fontSize: 13, color: "#111827", fontWeight: 600 }}>{category.fields}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #eee", margin: "0 0 18px" }} />

          {/* Form Fields (read-only) */}
          {category.type === "Document" ? (
            <div style={{
              padding: "16px 18px", borderRadius: 10, background: "#f9fafb",
              border: "1px dashed #e5e7eb", textAlign: "center",
            }}>
              <p style={{ fontSize: 12.5, color: "#6b7280", lineHeight: 1.5 }}>
                Document categories don't use custom form fields.
              </p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 12 }}>Form Fields</h3>
              {(!category.formFields || category.formFields.length === 0) ? (
                <div style={{
                  padding: "28px 18px", borderRadius: 10, background: "#fafafa",
                  border: "1px dashed #e5e7eb", textAlign: "center",
                }}>
                  <p style={{ fontSize: 12.5, color: "#9ca3af" }}>No fields defined for this category.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {category.formFields.map((f, idx) => (
                    <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                        border: "1px solid #eee", borderRadius: 10, background: "#fafafa",
                      }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: 6, background: "#e5e7eb", color: "#6b7280",
                          fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: "#111827", fontWeight: 600 }}>
                          {f.name || "Untitled field"}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                          background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", flexShrink: 0,
                        }}>
                          {f.fieldType}
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, flexShrink: 0,
                          background: f.required ? "#fef2f2" : "#f3f4f6",
                          color: f.required ? "#dc2626" : "#9ca3af",
                        }}>
                          {f.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      {(f.fieldType === "Dropdown" || f.fieldType === "Checkbox") && (
                        <div style={{ marginLeft: 30, display: "flex", flexDirection: "column", gap: 6 }}>
                          {f.fieldType === "Checkbox" && (
                            <span style={{
                              alignSelf: "flex-start", fontSize: 10.5, fontWeight: 700, padding: "3px 9px",
                              borderRadius: 20, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe",
                            }}>
                              {f.multiSelect !== false ? "Multiple selection" : "Single selection"}
                            </span>
                          )}
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(f.options && f.options.length > 0) ? (
                              f.options.map((opt, oi) => (
                                <span key={oi} style={{
                                  fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                                  background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe",
                                }}>
                                  {opt}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: 11.5, color: "#c4c4c4", fontStyle: "italic" }}>No choices defined yet</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: "1px solid #eee", flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ padding: "9px 18px", borderRadius: 9, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
          >
            Close
          </button>
          <button
            onClick={onEdit}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 9, border: "none", background: "#2563eb", color: "white", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "#1d4ed8"}
            onMouseLeave={e => e.currentTarget.style.background = "#2563eb"}
          >
            <Pencil style={{ width: 13, height: 13 }} /> Edit Category
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, iconBg, iconColor }) {
  return (
    <div
      style={{
        flex: 1, background: PAGE.surfaceContainerLowest, border: `1px solid ${PAGE.borderSoft}`,
        borderRadius: 12, padding: "20px 22px", boxShadow: PAGE.shadow,
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 24px rgba(139,92,246,0.10)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = PAGE.shadow}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9, background: iconBg, color: iconColor,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: PAGE.onSurfaceVariant }}>{label}</span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 700, color: PAGE.onBackground, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ fontSize: 11.5, color: PAGE.outline, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

export default function DocumentCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Date Created");
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, archived: 0, usedThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Auto-open "Add New Category" when navigated here from Forms → "Add Form Type"
  useEffect(() => {
    if (location.state?.openAddModal) {
      setShowAddModal(true);
      // Clear the nav state so refreshing or navigating back doesn't reopen it
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  // Auto-open "Edit Category" for a specific template when navigated here from
  // Forms → "Edit" on a form template card. Waits until categories have loaded
  // so the target record can actually be found.
  useEffect(() => {
    if (location.state?.editCategoryId != null && categories.length > 0) {
      const target = categories.find(
        c => c.id === location.state.editCategoryId || c.name === location.state.editCategoryName
      );
      if (target) setEditingCategory(target);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, categories]);

  const loadCategories = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch("/api/categories");
      setCategories(data.categories || []);
      setStats(data.stats || { total: 0, active: 0, archived: 0, usedThisMonth: 0 });
    } catch (err) {
      console.error("Failed to load categories:", err);
      setLoadError(err.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveCategory = async (updated) => {
    setActionError(null);
    try {
      const saved = await apiFetch(`/api/categories/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: updated.name,
          description: updated.description,
          type: updated.type,
          status: updated.status,
          formFields: updated.formFields,
        }),
      });
      setCategories(prev => prev.map(c => c.id === saved.id ? saved : c));
      setEditingCategory(null);
    } catch (err) {
      console.error("Failed to save category:", err);
      setActionError(err.message || "Failed to save category.");
    }
  };

  const handleCreateCategory = async (newCategory) => {
    setActionError(null);
    try {
      const created = await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCategory.name,
          description: newCategory.description,
          type: newCategory.type,
          status: newCategory.status,
          formFields: newCategory.formFields,
        }),
      });
      setCategories(prev => [created, ...prev]);
      setStats(prev => ({ ...prev, total: prev.total + 1, active: created.status === "Active" ? prev.active + 1 : prev.active }));
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to create category:", err);
      setActionError(err.message || "Failed to create category.");
    }
  };

  const handleArchiveCategory = async (category) => {
    setActionError(null);
    try {
      await apiFetch(`/api/categories/${category.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Archived" }),
      });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, status: "Archived" } : c));
    } catch (err) {
      console.error("Failed to archive category:", err);
      setActionError(err.message || "Failed to archive category.");
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"? This can't be undone.`)) return;
    setActionError(null);
    try {
      await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
      setCategories(prev => prev.filter(c => c.id !== category.id));
    } catch (err) {
      console.error("Failed to delete category:", err);
      setActionError(err.message || "Failed to delete category.");
    }
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
  const usedThisMonth = stats.usedThisMonth ?? 0;

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
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: PAGE.onBackground, background: PAGE.background }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      <Sidebar activePage="document-categories" />

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: PAGE.surfaceContainerLowest, minWidth: 0 }}>

        {/* Topbar */}
        <TopBar onLogout={handleLogout} />

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: PAGE.background, overflowY: "auto", padding: "28px 32px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: PAGE.onBackground, marginBottom: 4, letterSpacing: "-0.01em" }}>Document Categories</h1>
              <p style={{ fontSize: 13, color: PAGE.onSurfaceVariant }}>Manage document types available within the PATH System.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 20px",
                borderRadius: 9, border: "none", background: PAGE.primary, color: "white",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                boxShadow: "0 2px 6px rgba(107,56,212,0.25)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = PAGE.primaryHover}
              onMouseLeave={e => e.currentTarget.style.background = PAGE.primary}
            >
              <Icon.Plus size={14} color="white" /> Add Category
            </button>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            <StatCard
              label="Total Categories"
              value={totalCategories}
              sub={`${totalCategories - archivedCategories} non-archived`}
              icon={<Layers style={{ width: 17, height: 17 }} />}
              iconBg="rgba(107,56,212,0.10)"
              iconColor={PAGE.primary}
            />
            <StatCard
              label="Active"
              value={activeCategories}
              sub="Visible to users"
              icon={<CheckCircle2 style={{ width: 17, height: 17 }} />}
              iconBg="#d1fae5"
              iconColor="#059669"
            />
            <StatCard
              label="Archived"
              value={archivedCategories}
              sub="Hidden from users"
              icon={<InboxIcon style={{ width: 17, height: 17 }} />}
              iconBg="#ffe4e6"
              iconColor="#e11d48"
            />
            <StatCard
              label="Used This Month"
              value={usedThisMonth}
              sub="Total submissions"
              icon={<BarChart3 style={{ width: 17, height: 17 }} />}
              iconBg="rgba(138,76,252,0.12)"
              iconColor="#8a4cfc"
            />
          </div>

          {/* Search + filters */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap",
            background: PAGE.surfaceContainerLowest, border: `1px solid ${PAGE.borderSoft}`,
            borderRadius: 12, padding: "14px 16px", boxShadow: PAGE.shadow,
          }}>
            <div style={{
              flex: "1 1 320px", display: "flex", alignItems: "center", gap: 8,
              background: PAGE.surfaceContainerLow, border: `1px solid ${PAGE.outlineVariant}`, borderRadius: 9,
              padding: "10px 14px", color: PAGE.outline,
            }}>
              <Search style={{ width: 15, height: 15 }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search category name, code, or description..."
                style={{ border: "none", background: "transparent", outline: "none", fontSize: 12.5, color: PAGE.onBackground, width: "100%", fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: 2, background: PAGE.surfaceContainerLow,
              border: `1px solid ${PAGE.outlineVariant}`, borderRadius: 9, padding: 3,
            }}>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap", border: "none",
                    background: statusFilter === s ? PAGE.surfaceContainerLowest : "transparent",
                    color: statusFilter === s ? PAGE.primary : PAGE.onSurfaceVariant,
                    boxShadow: statusFilter === s ? "0 1px 3px rgba(107,56,212,0.15)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
                border: `1px solid ${PAGE.outlineVariant}`, borderRadius: 9, background: PAGE.surfaceContainerLowest,
                fontSize: 12, color: PAGE.onSurfaceVariant, fontWeight: 600, cursor: "pointer",
              }}>
                {sortBy} <ChevronDown style={{ width: 13, height: 13, color: PAGE.outline }} />
              </div>
            </div>
          </div>

          {actionError && !editingCategory && !showAddModal && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
              borderRadius: 9, padding: "10px 14px", fontSize: 12.5, marginBottom: 12,
            }}>
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}

          <p style={{ fontSize: 12, color: PAGE.outline, marginBottom: 10 }}>
            {loading ? "Loading categories…" : `${filtered.length} categories found`}
          </p>

          {loadError && !loading && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626",
              borderRadius: 9, padding: "12px 14px", fontSize: 12.5, marginBottom: 12,
            }}>
              <span>Couldn't load categories: {loadError}</span>
              <button
                onClick={loadCategories}
                style={{ background: "white", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div style={{
            background: PAGE.surfaceContainerLowest, border: `1px solid ${PAGE.borderSoft}`,
            borderRadius: 12, overflow: "hidden", boxShadow: PAGE.shadow,
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: PAGE.surfaceContainerLow, borderBottom: `1px solid ${PAGE.outlineVariant}` }}>
                    {["Category Name", "Code", "Description", "Type", "Fields", "Status", "Date Created", "Actions"].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 7 ? "right" : "left", padding: "14px 20px",
                        fontSize: 10.5, fontWeight: 600, color: PAGE.onSurfaceVariant,
                        letterSpacing: 0.4, whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: PAGE.outline, fontSize: 13 }}>
                        Loading categories…
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.map((c, idx) => {
                    const tCfg = TYPE_CFG[c.type];
                    const sCfg = STATUS_CFG[c.status];
                    return (
                      <tr
                        key={c.id}
                        className="table-row-hover"
                        style={{
                          borderBottom: idx === filtered.length - 1 ? "none" : `1px solid ${PAGE.outlineVariant}55`,
                          transition: "background-color 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = PAGE.surfaceContainerLow}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <td style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: PAGE.onBackground, maxWidth: 160 }}>{c.name}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: PAGE.onSurfaceVariant, background: PAGE.surfaceContainerLow,
                            border: `1px solid ${PAGE.outlineVariant}`, borderRadius: 6, padding: "3px 8px", whiteSpace: "nowrap",
                          }}>
                            {c.code}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 12.5, color: PAGE.onSurfaceVariant, maxWidth: 280 }}>{c.description}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                            background: tCfg.bg, color: tCfg.color, border: `1px solid ${tCfg.border}`,
                          }}>
                            {c.type}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 13, color: PAGE.onSurfaceVariant, fontWeight: 600 }}>{c.fields}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                            background: sCfg.bg, color: sCfg.color, border: `1px solid ${sCfg.dot}33`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: sCfg.dot, display: "inline-block" }} />
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: 12.5, color: PAGE.onSurfaceVariant, whiteSpace: "nowrap" }}>{c.dateCreated}</td>
                        <td style={{ padding: "16px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                            <ActionBtn title="View" onClick={() => setViewingCategory(c)}><Eye style={{ width: 14, height: 14 }} /></ActionBtn>
                            <ActionBtn title="Edit" onClick={() => setEditingCategory(c)}><Pencil style={{ width: 14, height: 14 }} /></ActionBtn>
                            {c.status !== "Archived" && (
                              <ActionBtn title="Archive" onClick={() => handleArchiveCategory(c)}><Archive style={{ width: 14, height: 14 }} /></ActionBtn>
                            )}
                            <ActionBtn title="Delete" danger onClick={() => handleDeleteCategory(c)}><Trash2 style={{ width: 14, height: 14 }} /></ActionBtn>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: PAGE.outline, fontSize: 13 }}>
                        No categories match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 20px", borderTop: `1px solid ${PAGE.outlineVariant}55`, background: PAGE.surfaceContainerLowest,
            }}>
              <span style={{ fontSize: 11, color: PAGE.outline }}>
                Showing {filtered.length} of {totalCategories} categories
              </span>
              <span style={{ fontSize: 11, color: PAGE.outline }}>PATH v2.4 · Document Categories Module</span>
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

      {viewingCategory && (
        <ViewCategoryModal
          category={viewingCategory}
          onClose={() => setViewingCategory(null)}
          onEdit={() => { setEditingCategory(viewingCategory); setViewingCategory(null); }}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => { setEditingCategory(null); setActionError(null); }}
          onSave={handleSaveCategory}
          error={actionError}
        />
      )}

      {showAddModal && (
        <AddCategoryModal
          onClose={() => { setShowAddModal(false); setActionError(null); }}
          onCreate={handleCreateCategory}
          existingCodes={categories.map(c => c.code)}
          error={actionError}
        />
      )}
    </div>
  );
}