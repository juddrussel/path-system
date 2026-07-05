import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

// ── Theme tokens ────────────────────────────────────────────────────────────
const COLORS = {
  purple: "#7c3aed",
  purpleSoft: "#ede9fe",
  purpleBorder: "#c4b5fd",
  ink: "#1e1b2e",
  faded: "#c8c4e0",
  green: "#059669",
  greenSoft: "#d1fae5",
  amber: "#d97706",
  amberSoft: "#fef3c7",
  red: "#dc2626",
  redSoft: "#fee2e2",
  border: "#e5e7eb",
  textMuted: "#888",
};

// ── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
  Plus: (p) => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={p.size || 14} height={p.size || 14}>
      <path d="M8 1v14M1 8h14" />
    </svg>
  ),
  Inbox: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z" />
    </svg>
  ),
  Form: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z" />
    </svg>
  ),
  Task: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M13 5l-7 7-3-3" strokeLinecap="round" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  ),
  Revise: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M2 8a6 6 0 0110-4.2M14 8a6 6 0 01-10 4.2" strokeLinecap="round" />
      <path d="M12 1v3h-3M4 15v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Assign: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="6" cy="5" r="2.5" />
      <path d="M2 14c0-2.5 1.8-4 4-4s4 1.5 4 4" />
      <path d="M10.5 6.5l1.2 1.2L14 5.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Branch: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="4" cy="3" r="1.5" />
      <circle cx="4" cy="13" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <path d="M4 4.5v3a3 3 0 003 3h3.5M4 11.5V8" />
    </svg>
  ),
  Status: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 2" strokeLinecap="round" />
    </svg>
  ),
  DocType: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M4 2h6l2 2v10H4z" />
      <path d="M10 2v2h2" />
    </svg>
  ),
  Priority: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 13V8M8 13V5M13 13V3" strokeLinecap="round" />
    </svg>
  ),
  Archive: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="2" y="3" width="12" height="3" rx="0.5" />
      <path d="M3 6v7h10V6M6.5 9h3" strokeLinecap="round" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  ZoomIn: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3M7 4.5v5M4.5 7h5" strokeLinecap="round" />
    </svg>
  ),
  ZoomOut: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <circle cx="7" cy="7" r="5" />
      <path d="M11 11l3 3M4.5 7h5" strokeLinecap="round" />
    </svg>
  ),
  Fit: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M1 5.5h14M1 10.5h14M5.5 1v14M10.5 1v14" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M2 2h9l3 3v9H2z" />
      <path d="M5 2v4h6V2M5 14v-4h6v4" />
    </svg>
  ),
  Publish: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <path d="M8 1v9M4.5 4.5L8 1l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11v3h12v-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Chevron: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
      <path d="M5 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
      <path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4" strokeLinecap="round" />
    </svg>
  ),
  Templates: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
  Route: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="3" cy="3" r="1.5" />
      <circle cx="13" cy="13" r="1.5" />
      <path d="M3 4.5V8a3 3 0 003 3h4" strokeLinecap="round" />
      <path d="M8.5 9.5L10 11l1.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3M8 10.5v.5" strokeLinecap="round" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  ),

  // ── Sidebar icons (shared with Dashboard) ──
  DashGrid: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  ),
  Tasks: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z" />
    </svg>
  ),
  WorkflowNav: () => (
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
  Users: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="6" cy="5" r="3" />
      <path d="M1 14c0-3 2-5 5-5s5 2 5 5" />
      <path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3" />
    </svg>
  ),
  SettingsGear: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  HelpCircle: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v1" />
    </svg>
  ),
  LogoutIcon: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" />
    </svg>
  ),
  TrackingNav: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6" /><path d="M8 4v4l3 2" strokeLinecap="round" /><circle cx="8" cy="8" r="1" fill="currentColor" /></svg>
  ),
  AssignTaskNav: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed" />
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
};

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];

// ── Sidebar Item (shared with Dashboard) ──────────────────────────────────────
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

// ── Node type definitions ─────────────────────────────────────────────────────
const NODE_TYPES = {
  document_intake: { label: "Document Intake", group: "start", icon: Icon.Inbox, color: COLORS.purple, kind: "start" },
  form_submission: { label: "Form Submission", group: "start", icon: Icon.Form, color: COLORS.purple, kind: "start" },
  task_assignment: { label: "Task Assignment", group: "start", icon: Icon.Assign, color: COLORS.purple, kind: "start" },

  review_document: { label: "Review Document", group: "action", icon: Icon.Eye, color: COLORS.purple, kind: "action" },
  approve: { label: "Approve", group: "action", icon: Icon.Check, color: COLORS.green, kind: "action" },
  reject: { label: "Reject", group: "action", icon: Icon.X, color: COLORS.red, kind: "action" },
  request_revision: { label: "Request Revision", group: "action", icon: Icon.Revise, color: COLORS.amber, kind: "action" },
  assign_task: { label: "Assign Task", group: "action", icon: Icon.Assign, color: COLORS.purple, kind: "action" },
  submit_form: { label: "Submit Form", group: "action", icon: Icon.Form, color: COLORS.purple, kind: "action" },
  complete_task: { label: "Complete Task", group: "action", icon: Icon.Check, color: COLORS.green, kind: "action" },

  conditional_branch: { label: "Conditional Branch", group: "decision", icon: Icon.Branch, color: COLORS.amber, kind: "decision" },
  status_check: { label: "Status Check", group: "decision", icon: Icon.Status, color: COLORS.amber, kind: "decision" },
  document_type_check: { label: "Document Type Check", group: "decision", icon: Icon.DocType, color: COLORS.amber, kind: "decision" },
  priority_check: { label: "Priority Check", group: "decision", icon: Icon.Priority, color: COLORS.amber, kind: "decision" },

  approved: { label: "Approved", group: "end", icon: Icon.Check, color: COLORS.green, kind: "end" },
  rejected: { label: "Rejected", group: "end", icon: Icon.X, color: COLORS.red, kind: "end" },
  completed: { label: "Completed", group: "end", icon: Icon.Check, color: COLORS.green, kind: "end" },
  archived: { label: "Archived", group: "end", icon: Icon.Archive, color: COLORS.textMuted, kind: "end" },
};

const PANEL_GROUPS = [
  { key: "start", label: "Start Nodes", types: ["document_intake", "form_submission", "task_assignment"] },
  { key: "action", label: "Actions", types: ["review_document", "approve", "reject", "request_revision", "assign_task", "submit_form", "complete_task"] },
  { key: "decision", label: "Decisions", types: ["conditional_branch", "status_check", "document_type_check", "priority_check"] },
  { key: "end", label: "End States", types: ["approved", "rejected", "completed", "archived"] },
];

const ASSIGNEE_OPTIONS = ["Program Chair / Administrator", "Faculty"];
const REQUIRED_ACTIONS = ["Review", "Approval", "Rejection", "Request Revision", "Task Completion", "Form Submission", "Archiving"];
const CONNECTOR_LABELS = ["", "Approved", "Rejected", "Revision Requested", "Completed", "Yes", "No"];

const CONNECTOR_COLOR = {
  "": "#b9b6cf",
  Approved: COLORS.green,
  Rejected: COLORS.red,
  "Revision Requested": COLORS.amber,
  Completed: COLORS.green,
  Yes: COLORS.green,
  No: COLORS.red,
};

// ── Templates ───────────────────────────────────────────────────────────────
const GRID = 24;
const snap = (v) => Math.round(v / GRID) * GRID;

function makeNode(id, type, x, y, overrides = {}) {
  const def = NODE_TYPES[type];
  return {
    id,
    type,
    x, y,
    name: overrides.name || def.label,
    description: overrides.description || "",
    assignedTo: overrides.assignedTo || (def.kind === "end" ? "" : "Program Chair / Administrator"),
    requiredAction: overrides.requiredAction || defaultAction(type),
    slaDays: overrides.slaDays ?? (def.kind === "start" || def.kind === "end" ? null : 2),
    priority: overrides.priority || "Normal",
    notifyFaculty: overrides.notifyFaculty ?? true,
    notifyAdmin: overrides.notifyAdmin ?? true,
  };
}

function defaultAction(type) {
  switch (type) {
    case "review_document": return "Review";
    case "approve": case "approved": return "Approval";
    case "reject": case "rejected": return "Rejection";
    case "request_revision": return "Request Revision";
    case "complete_task": case "completed": return "Task Completion";
    case "submit_form": case "form_submission": return "Form Submission";
    case "archived": return "Archiving";
    default: return "Review";
  }
}

const TEMPLATES = {
  student_form_approval: {
    name: "Student Form Approval",
    description: "Faculty submits a form, Program Chair reviews, then approves or rejects.",
    build: () => {
      const nodes = [
        makeNode("n1", "form_submission", 120, 60, { name: "Faculty Submits Form", assignedTo: "Faculty" }),
        makeNode("n2", "review_document", 120, 220, { name: "Program Chair Reviews", assignedTo: "Program Chair / Administrator" }),
        makeNode("n3", "conditional_branch", 120, 380, { name: "Decision", assignedTo: "" }),
        makeNode("n4", "approved", -40, 540, { name: "Approved", assignedTo: "" }),
        makeNode("n5", "rejected", 320, 540, { name: "Rejected", assignedTo: "" }),
      ];
      const edges = [
        { from: "n1", to: "n2", label: "" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "Approved" },
        { from: "n3", to: "n5", label: "Rejected" },
      ];
      return { nodes, edges };
    },
  },
  faculty_request: {
    name: "Faculty Request Workflow",
    description: "Faculty creates a request, Program Chair reviews and decides.",
    build: () => {
      const nodes = [
        makeNode("n1", "form_submission", 120, 60, { name: "Faculty Creates Request", assignedTo: "Faculty" }),
        makeNode("n2", "review_document", 120, 220, { name: "Program Chair Reviews", assignedTo: "Program Chair / Administrator" }),
        makeNode("n3", "conditional_branch", 120, 380, { name: "Decision", assignedTo: "" }),
        makeNode("n4", "approved", -40, 540, { name: "Approved", assignedTo: "" }),
        makeNode("n5", "rejected", 320, 540, { name: "Rejected", assignedTo: "" }),
      ];
      const edges = [
        { from: "n1", to: "n2", label: "" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "Approved" },
        { from: "n3", to: "n5", label: "Rejected" },
      ];
      return { nodes, edges };
    },
  },
  task_assignment: {
    name: "Task Assignment Workflow",
    description: "Program Chair assigns a task, Faculty completes it, Program Chair verifies the output.",
    build: () => {
      const nodes = [
        makeNode("n1", "task_assignment", 120, 60, { name: "Program Chair Assigns Task", assignedTo: "Program Chair / Administrator" }),
        makeNode("n2", "complete_task", 120, 220, { name: "Faculty Completes Task", assignedTo: "Faculty" }),
        makeNode("n3", "review_document", 120, 380, { name: "Program Chair Verifies Output", assignedTo: "Program Chair / Administrator" }),
        makeNode("n4", "completed", 120, 540, { name: "Completed", assignedTo: "" }),
      ];
      const edges = [
        { from: "n1", to: "n2", label: "" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "Completed" },
      ];
      return { nodes, edges };
    },
  },
  document_approval: {
    name: "Document Approval Workflow",
    description: "Document intake, Faculty review, Program Chair approval, then archiving.",
    build: () => {
      const nodes = [
        makeNode("n1", "document_intake", 120, 60, { name: "Document Intake", assignedTo: "Program Chair / Administrator" }),
        makeNode("n2", "review_document", 120, 220, { name: "Faculty Review", assignedTo: "Faculty" }),
        makeNode("n3", "review_document", 120, 380, { name: "Program Chair Approval", assignedTo: "Program Chair / Administrator", requiredAction: "Approval" }),
        makeNode("n4", "archived", 120, 540, { name: "Archived", assignedTo: "" }),
      ];
      const edges = [
        { from: "n1", to: "n2", label: "" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "Approved" },
      ];
      return { nodes, edges };
    },
  },
  approval_with_revision: {
    name: "Document Approval with Revision Loop",
    description: "Faculty review feeds a decision branch with an approval path and a revision loop back to Faculty.",
    build: () => {
      const nodes = [
        makeNode("n1", "document_intake", 240, 40, { name: "Document Intake", assignedTo: "Program Chair / Administrator" }),
        makeNode("n2", "review_document", 240, 180, { name: "Faculty Review", assignedTo: "Faculty" }),
        makeNode("n3", "conditional_branch", 240, 320, { name: "Decision", assignedTo: "" }),
        makeNode("n4", "approve", 60, 460, { name: "Registrar Approval", assignedTo: "Program Chair / Administrator", requiredAction: "Approval" }),
        makeNode("n5", "request_revision", 440, 460, { name: "Return to Faculty", assignedTo: "Faculty" }),
        makeNode("n6", "approved", 60, 600, { name: "Approved", assignedTo: "" }),
      ];
      const edges = [
        { from: "n1", to: "n2", label: "" },
        { from: "n2", to: "n3", label: "" },
        { from: "n3", to: "n4", label: "Approved" },
        { from: "n3", to: "n5", label: "Revision Requested" },
        { from: "n5", to: "n2", label: "" },
        { from: "n4", to: "n6", label: "" },
      ];
      return { nodes, edges };
    },
  },
};

// ── Smart routing rules (static reference set) ────────────────────────────────
const SMART_ROUTING_RULES = [
  { condition: "Document Type = Form", action: "Route to Program Chair / Administrator" },
  { condition: "Document Type = Task", action: "Assign to Faculty" },
  { condition: "Status = Revision Requested", action: "Return to Faculty" },
  { condition: "Status = Approved", action: "Archive Document" },
];

// ── Geometry helpers ───────────────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 76;

function portPos(node, side) {
  if (side === "top") return { x: node.x + NODE_W / 2, y: node.y };
  if (side === "bottom") return { x: node.x + NODE_W / 2, y: node.y + NODE_H };
  if (side === "left") return { x: node.x, y: node.y + NODE_H / 2 };
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
}

function edgePath(from, to) {
  // Decide ports based on relative position
  let fromSide, toSide;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dy) >= Math.abs(dx)) {
    fromSide = dy >= 0 ? "bottom" : "top";
    toSide = dy >= 0 ? "top" : "bottom";
  } else {
    fromSide = dx >= 0 ? "right" : "left";
    toSide = dx >= 0 ? "left" : "right";
  }
  const p1 = portPos(from, fromSide);
  const p2 = portPos(to, toSide);

  let path;
  if (fromSide === "bottom" || fromSide === "top") {
    const midY = (p1.y + p2.y) / 2;
    path = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;
  } else {
    const midX = (p1.x + p2.x) / 2;
    path = `M ${p1.x} ${p1.y} C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
  }
  const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  return { path, p1, p2, mid };
}

// ── Reusable bits ───────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: "bold", color: "#999", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
  fontSize: 12, color: "#333", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
};

function ToggleSwitch({ on, onClick, label }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
      <div style={{
        width: 32, height: 18, borderRadius: 10, background: on ? COLORS.purple : "#e5e7eb",
        position: "relative", transition: "background 0.15s", flexShrink: 0,
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: "white", position: "absolute",
          top: 2, left: on ? 16 : 2, transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function WorkflowDesigner() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

  const [workflowName, setWorkflowName] = useState("");
  const [status, setStatus] = useState("Draft");
  const [version, setVersion] = useState("v1.0");
  const [workflowId, setWorkflowId] = useState(null); // null = not yet saved to DB
  const [isSaving, setIsSaving] = useState(false);

  const API = "http://localhost:5000/api";

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 60, y: 20 });
  const [showTemplates, setShowTemplates] = useState(false);
  const [showRouting, setShowRouting] = useState(true);
  const [validation, setValidation] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const dragRef = useRef(null); // { id, offsetX, offsetY }
  const panRef = useRef(null); // { startX, startY, panX, panY }
  const connectRef = useRef(null); // { fromId, fromSide }
  const [tempLine, setTempLine] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Node operations ──────────────────────────────────────────────────────
  const addNode = (type) => {
    const id = "n" + Date.now();
    const def = NODE_TYPES[type];
    // place near center of current viewport
    const x = snap(200 - pan.x / zoom + Math.random() * 80);
    const y = snap(120 - pan.y / zoom + Math.random() * 80);
    const node = makeNode(id, type, x, y);
    setNodes((ns) => [...ns, node]);
    setSelectedId(id);
    setSelectedEdgeIdx(null);
  };

  const updateNode = (id, patch) => {
    setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const deleteNode = (id) => {
    setNodes((ns) => ns.filter((n) => n.id !== id));
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id));
    setSelectedId(null);
  };

  const deleteEdge = (idx) => {
    setEdges((es) => es.filter((_, i) => i !== idx));
    setSelectedEdgeIdx(null);
  };

  const selectedNode = nodes.find((n) => n.id === selectedId) || null;
  const selectedEdge = selectedEdgeIdx !== null ? edges[selectedEdgeIdx] : null;

  // ── Canvas dragging / panning ────────────────────────────────────────────
  const onNodeMouseDown = (e, node) => {
    e.stopPropagation();
    setSelectedId(node.id);
    setSelectedEdgeIdx(null);
    const rect = canvasRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left - pan.x) / zoom;
    const py = (e.clientY - rect.top - pan.y) / zoom;
    dragRef.current = { id: node.id, offsetX: px - node.x, offsetY: py - node.y };
  };

  const onCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.dataset?.bg === "1") {
      setSelectedId(null);
      setSelectedEdgeIdx(null);
      panRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
    }
  };

  const onMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (dragRef.current) {
      const px = (e.clientX - rect.left - pan.x) / zoom;
      const py = (e.clientY - rect.top - pan.y) / zoom;
      const { id, offsetX, offsetY } = dragRef.current;
      updateNode(id, { x: snap(px - offsetX), y: snap(py - offsetY) });
    } else if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setPan({ x: panRef.current.panX + dx, y: panRef.current.panY + dy });
    } else if (connectRef.current) {
      const px = (e.clientX - rect.left - pan.x) / zoom;
      const py = (e.clientY - rect.top - pan.y) / zoom;
      setTempLine((tl) => (tl ? { ...tl, x2: px, y2: py } : tl));
    }
  }, [pan, zoom]);

  const onMouseUp = useCallback((e) => {
    if (connectRef.current) {
      // check if released over a node
      const rect = canvasRef.current.getBoundingClientRect();
      const px = (e.clientX - rect.left - pan.x) / zoom;
      const py = (e.clientY - rect.top - pan.y) / zoom;
      const target = nodes.find((n) => px >= n.x && px <= n.x + NODE_W && py >= n.y && py <= n.y + NODE_H);
      const fromId = connectRef.current.fromId;
      if (target && target.id !== fromId) {
        setEdges((es) => [...es, { from: fromId, to: target.id, label: "" }]);
      }
      connectRef.current = null;
      setTempLine(null);
    }
    dragRef.current = null;
    panRef.current = null;
  }, [nodes, pan, zoom]);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const startConnect = (e, node) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const p = portPos(node, "right");
    connectRef.current = { fromId: node.id };
    setTempLine({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  // ── Zoom controls ──────────────────────────────────────────────────────
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.4, +(z - 0.1).toFixed(2)));
  const zoomFit = () => { setZoom(1); setPan({ x: 60, y: 20 }); };

  // ── Templates ─────────────────────────────────────────────────────────
  const applyTemplate = (key) => {
    const t = TEMPLATES[key];
    const built = t.build();
    setNodes(built.nodes);
    setEdges(built.edges);
    setWorkflowName(t.name);
    setWorkflowId(null);   // reset — template loads as a new unsaved workflow
    setStatus("Draft");
    setVersion("v1.0");
    setSelectedId(null);
    setSelectedEdgeIdx(null);
    setShowTemplates(false);
    setValidation(null);
    showToast(`Loaded template: ${t.name} — click Save to create it.`);
  };

  // ── Validation ────────────────────────────────────────────────────────
  const runValidation = () => {
    const issues = [];
    const warnings = [];

    // Missing assignees on non-end, non-decision nodes
    nodes.forEach((n) => {
      const def = NODE_TYPES[n.type];
      if (def.kind === "action" || def.kind === "start") {
        if (!n.assignedTo) issues.push(`"${n.name}" has no assignee (Program Chair / Administrator or Faculty).`);
      }
    });

    // Connectivity
    const connectedIds = new Set();
    edges.forEach((e) => { connectedIds.add(e.from); connectedIds.add(e.to); });
    nodes.forEach((n) => {
      if (!connectedIds.has(n.id) && nodes.length > 1) {
        issues.push(`"${n.name}" is not connected to any other node.`);
      }
    });

    // Missing end states
    const hasEnd = nodes.some((n) => NODE_TYPES[n.type].kind === "end");
    if (!hasEnd) issues.push("Workflow has no end state (Approved, Rejected, Completed, or Archived).");

    // Start node check
    const hasStart = nodes.some((n) => NODE_TYPES[n.type].kind === "start");
    if (!hasStart) issues.push("Workflow has no start node (Document Intake, Form Submission, or Task Assignment).");

    // Decision nodes must have at least 2 outgoing edges with distinct labels
    nodes.forEach((n) => {
      if (NODE_TYPES[n.type].kind === "decision") {
        const out = edges.filter((e) => e.from === n.id);
        if (out.length < 2) {
          issues.push(`Decision node "${n.name}" needs at least two outgoing paths (e.g. Approved / Rejected).`);
        } else if (out.some((e) => !e.label)) {
          warnings.push(`Decision node "${n.name}" has an unlabeled outgoing path. Add a condition label.`);
        }
      }
    });

    // Missing approval actions
    const hasApproval = nodes.some((n) => n.requiredAction === "Approval");
    if (!hasApproval) warnings.push("Workflow has no step with Required Action = Approval.");

    // Dangling edges (referencing missing nodes) — defensive
    const ids = new Set(nodes.map((n) => n.id));
    edges.forEach((e) => {
      if (!ids.has(e.from) || !ids.has(e.to)) issues.push("An invalid connection references a missing node.");
    });

    setValidation({ issues, warnings, ok: issues.length === 0, checkedAt: new Date() });
  };

  // ── Derive ordered step names + payload for persistence ─────────────────
  const getOrderedSteps = () => {
    if (nodes.length === 0) return [];
    const startIds = nodes.filter((n) => NODE_TYPES[n.type].kind === "start").map((n) => n.id);
    const visited = new Set();
    const order = [];
    const queue = startIds.length ? [...startIds] : [nodes[0].id];
    while (queue.length) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.find((n) => n.id === id);
      if (node) order.push(node.name);
      edges.filter((e) => e.from === id).forEach((e) => { if (!visited.has(e.to)) queue.push(e.to); });
    }
    // Append any nodes not reachable from a start node
    nodes.forEach((n) => { if (!visited.has(n.id)) order.push(n.name); });
    return order;
  };

  const buildWorkflowPayload = () => ({
    nodes,
    edges,
    steps: getOrderedSteps(),
    sla: `${nodes.reduce((sum, n) => sum + (n.slaDays || 0), 0)}d`,
  });

  // ── Save / Publish ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!workflowName.trim()) {
      showToast("Please enter a workflow name before saving.");
      return;
    }
    setIsSaving(true);
    try {
      let res, data;
      if (!workflowId) {
        // First save — CREATE a new workflow in the DB
        res = await fetch(`${API}/workflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: workflowName.trim(), description: "", status: "Draft", ...buildWorkflowPayload() }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create workflow.");
        setWorkflowId(data.data.id);
        setStatus("Draft");
        showToast("Workflow created and saved as Draft.");
      } else {
        // Subsequent saves — UPDATE existing record
        res = await fetch(`${API}/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: workflowName.trim(), status: "Draft", ...buildWorkflowPayload() }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to save workflow.");
        setStatus("Draft");
        showToast("Workflow saved as Draft.");
      }
    } catch (err) {
      showToast(err.message || "Save failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    // Run client-side validation first
    runValidation();
    const issues = [];
    nodes.forEach((n) => {
      const def = NODE_TYPES[n.type];
      if ((def.kind === "action" || def.kind === "start") && !n.assignedTo) issues.push(true);
    });
    const hasEnd = nodes.some((n) => NODE_TYPES[n.type].kind === "end");
    const hasStart = nodes.some((n) => NODE_TYPES[n.type].kind === "start");
    if (issues.length > 0 || !hasEnd || !hasStart) {
      showToast("Resolve validation issues before publishing.");
      return;
    }
    if (!workflowName.trim()) {
      showToast("Please enter a workflow name before publishing.");
      return;
    }
    setIsSaving(true);
    try {
      let res, data;
      if (!workflowId) {
        // Never saved — create then publish in one go
        res = await fetch(`${API}/workflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: workflowName.trim(), description: "", status: "Published", ...buildWorkflowPayload() }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to publish workflow.");
        setWorkflowId(data.data.id);
      } else {
        // Already exists — update status to Published
        res = await fetch(`${API}/workflows/${workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: workflowName.trim(), status: "Published", ...buildWorkflowPayload() }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to publish workflow.");
      }
      setStatus("Published");
      setVersion((v) => {
        const num = parseFloat(v.replace("v", ""));
        return "v" + (num + 1).toFixed(1);
      });
      showToast("Workflow published successfully.");
    } catch (err) {
      showToast(err.message || "Publish failed. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Analytics ─────────────────────────────────────────────────────────
  const totalSteps = nodes.length;
  const approvalLevels = nodes.filter((n) => n.requiredAction === "Approval").length;
  const estProcessing = nodes.reduce((sum, n) => sum + (n.slaDays || 0), 0);
  const activeBranches = nodes.filter((n) => NODE_TYPES[n.type].kind === "decision").reduce((sum, n) => sum + edges.filter((e) => e.from === n.id).length, 0);

  // ── Filtering nodes list for search ──────────────────────────────────
  const filteredGroups = PANEL_GROUPS.map((g) => ({
    ...g,
    types: g.types.filter((t) => !search || NODE_TYPES[t].label.toLowerCase().includes(search.toLowerCase())),
  })).filter((g) => g.types.length > 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar (shared with Dashboard) ── */}
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
          <SbItem icon={<Icon.DashGrid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.TrackingNav />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.WorkflowNav />} label="Workflow Designer" active={true} onClick={() => navigate("/workflow-dashboard")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTaskNav />} label="Assign Task" active={false} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTaskNav />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.SettingsGear />} label="Settings" active={false} onClick={() => { }} />
        </div>

        {/* Bottom */}
        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.HelpCircle />} label="Help & Support" onClick={() => { }} />
          <SbItem icon={<Icon.LogoutIcon />} label="Logout" onClick={() => { localStorage.removeItem("token"); navigate("/login"); }} />
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        <TopBar onLogout={() => { localStorage.removeItem("token"); navigate("/login"); }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {/* ← Back to workflows list */}
            <button
              onClick={() => navigate("/workflow-dashboard")}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                border: `1px solid ${COLORS.border}`, borderRadius: 8, background: "white",
                color: "#555", fontSize: 12, fontWeight: 500, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.purpleSoft; e.currentTarget.style.color = COLORS.purple; e.currentTarget.style.borderColor = COLORS.purpleBorder; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = COLORS.border; }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                <path d="M10 3L5 8l5 5" />
              </svg>
              Workflows
            </button>

            <div style={{ width: 1, height: 20, background: COLORS.border, flexShrink: 0 }} />

            <Icon.Route />
            <input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Untitled Workflow"
              style={{ fontSize: 16, fontWeight: "bold", color: "#111", border: "none", outline: "none", background: "transparent", fontFamily: "'DM Sans', sans-serif", minWidth: 200 }}
            />
            <span style={{
              fontSize: 10, fontWeight: "bold", padding: "3px 10px", borderRadius: 20,
              background: status === "Published" ? COLORS.greenSoft : COLORS.amberSoft,
              color: status === "Published" ? "#065f46" : "#92400e",
            }}>
              {status}
            </span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowTemplates(true)} style={btnStyle("white", "#333", COLORS.border)}>
              <Icon.Templates /> Templates
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 4, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "4px 6px" }}>
              <IconBtn onClick={zoomOut} title="Zoom out"><Icon.ZoomOut /></IconBtn>
              <span style={{ fontSize: 11, color: "#666", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
              <IconBtn onClick={zoomIn} title="Zoom in"><Icon.ZoomIn /></IconBtn>
              <IconBtn onClick={zoomFit} title="Reset view"><Icon.Fit /></IconBtn>
            </div>
            <button onClick={runValidation} style={btnStyle("white", "#333", COLORS.border)}>
              <Icon.Shield /> Validate
            </button>
            <button onClick={handleSave} disabled={isSaving} style={btnStyle("white", isSaving ? "#aaa" : "#333", COLORS.border)}>
              <Icon.Save /> {isSaving ? "Saving..." : workflowId ? "Save" : "Save as Draft"}
            </button>
            <button onClick={handlePublish} disabled={isSaving} style={btnStyle(isSaving ? "#a78bfa" : COLORS.purple, "white", isSaving ? "#a78bfa" : COLORS.purple)}>
              <Icon.Publish /> {isSaving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </TopBar>

        {/* Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Components Panel ── */}
          <div style={{ width: 230, borderRight: `0.5px solid ${COLORS.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
            <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#111", marginBottom: 8 }}>Components</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 10px", color: "#9ca3af" }}>
                <Icon.Search />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search components..."
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: 11, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
                />
              </div>
            </div>
            <div style={{ padding: "4px 0", flex: 1 }}>
              {filteredGroups.map((g) => (
                <div key={g.key} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: "#999", letterSpacing: 1, padding: "10px 14px 6px", textTransform: "uppercase", fontWeight: "bold" }}>{g.label}</div>
                  {g.types.map((t) => {
                    const def = NODE_TYPES[t];
                    const I = def.icon;
                    return (
                      <div
                        key={t}
                        onClick={() => addNode(t)}
                        title="Click to add to canvas"
                        style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 14px", fontSize: 12, color: "#444", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.purpleSoft)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ width: 22, height: 22, borderRadius: 6, background: `${def.color}1a`, color: def.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <I />
                        </span>
                        {def.label}
                        <span style={{ marginLeft: "auto", color: COLORS.purple, opacity: 0.5 }}><Icon.Plus size={11} /></span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: `0.5px solid ${COLORS.border}`, fontSize: 10, color: "#aaa" }}>
              Click a component to drop it onto the canvas. Drag node edges to connect steps.
            </div>

            {/* ── Smart Routing Rules ── */}
            <div style={{ borderTop: `0.5px solid ${COLORS.border}` }}>
              <div
                onClick={() => setShowRouting((v) => !v)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.purpleSoft)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: COLORS.purple }}><Icon.Route /></span>
                  <span style={{ fontSize: 12, fontWeight: "bold", color: "#111" }}>Smart Routing Rules</span>
                </div>
                <span style={{ color: "#aaa", transform: showRouting ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
                  <Icon.Chevron />
                </span>
              </div>
              {showRouting && (
                <div style={{ padding: "0 10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#aaa", lineHeight: 1.5, marginBottom: 8, padding: "0 4px" }}>
                    How documents are auto-routed as they move through a workflow.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {SMART_ROUTING_RULES.map((r, i) => (
                      <div key={i} style={{ borderRadius: 8, border: `1px solid ${COLORS.purpleBorder}`, background: COLORS.purpleSoft, padding: "8px 10px", fontSize: 11 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          <span style={{ fontSize: 9, fontWeight: "bold", color: COLORS.purple, background: "white", border: `1px solid ${COLORS.purpleBorder}`, padding: "1px 6px", borderRadius: 4 }}>IF</span>
                          <span style={{ color: "#444", flex: 1 }}>{r.condition}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 2 }}>
                          <span style={{ width: 14, borderTop: `1.5px dashed ${COLORS.purpleBorder}`, display: "inline-block" }} />
                          <span style={{ color: COLORS.purple, fontWeight: "bold" }}>{r.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Canvas ── */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#fafafa" }}>
            {/* top stat bar */}
            <div style={{ position: "absolute", top: 12, right: 16, zIndex: 5, fontSize: 11, color: "#888", background: "white", border: `0.5px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px" }}>
              {nodes.length} nodes · {edges.length} connections
            </div>

            <div
              ref={canvasRef}
              data-bg="1"
              onMouseDown={onCanvasMouseDown}
              style={{
                position: "absolute", inset: 0, cursor: panRef.current ? "grabbing" : "default",
                backgroundImage: `radial-gradient(circle, #e2e0ee 1px, transparent 1px)`,
                backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
                backgroundPosition: `${pan.x}px ${pan.y}px`,
              }}
            >
              <div style={{ position: "absolute", left: pan.x, top: pan.y, transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
                {/* edges */}
                <svg width={2400} height={2000} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                      <path d="M0,0 L6,3 L0,6 Z" fill="#9b97b8" />
                    </marker>
                  </defs>
                  {edges.map((e, idx) => {
                    const from = nodes.find((n) => n.id === e.from);
                    const to = nodes.find((n) => n.id === e.to);
                    if (!from || !to) return null;
                    const { path, mid } = edgePath(from, to);
                    const color = CONNECTOR_COLOR[e.label] || CONNECTOR_COLOR[""];
                    const isSel = selectedEdgeIdx === idx;
                    return (
                      <g key={idx} style={{ pointerEvents: "all", cursor: "pointer" }} onMouseDown={(ev) => { ev.stopPropagation(); setSelectedEdgeIdx(idx); setSelectedId(null); }}>
                        <path d={path} fill="none" stroke={isSel ? COLORS.purple : color} strokeWidth={isSel ? 2.5 : 2} markerEnd="url(#arrow)" />
                        <path d={path} fill="none" stroke="transparent" strokeWidth={14} />
                        {e.label && (
                          <g transform={`translate(${mid.x}, ${mid.y})`}>
                            <rect x={-(e.label.length * 3.3 + 8)} y={-10} width={e.label.length * 6.6 + 16} height={20} rx={10} fill="white" stroke={color} strokeWidth={1} />
                            <text x={0} y={4} textAnchor="middle" fontSize={10} fontWeight="bold" fill={color} fontFamily="'DM Sans', sans-serif">{e.label}</text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                  {tempLine && (
                    <path d={`M ${tempLine.x1} ${tempLine.y1} L ${tempLine.x2} ${tempLine.y2}`} stroke={COLORS.purple} strokeWidth={2} strokeDasharray="4 4" fill="none" />
                  )}
                </svg>

                {/* nodes */}
                {nodes.map((node) => {
                  const def = NODE_TYPES[node.type];
                  const I = def.icon;
                  const isSel = selectedId === node.id;
                  const isEnd = def.kind === "end";
                  return (
                    <div
                      key={node.id}
                      onMouseDown={(e) => onNodeMouseDown(e, node)}
                      style={{
                        position: "absolute", left: node.x, top: node.y, width: NODE_W, minHeight: NODE_H,
                        background: "white", borderRadius: 10, cursor: "grab", userSelect: "none",
                        border: isSel ? `2px solid ${COLORS.purple}` : `1px solid ${COLORS.border}`,
                        boxShadow: isSel ? "0 4px 14px rgba(124,58,237,0.18)" : "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ height: 5, borderRadius: "10px 10px 0 0", background: def.color }} />
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 24, height: 24, borderRadius: 6, background: `${def.color}1a`, color: def.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <I />
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: "bold", color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.name}</div>
                            {node.assignedTo && <div style={{ fontSize: 10, color: "#999" }}>{node.assignedTo}</div>}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                          {node.slaDays != null && (
                            <span style={{ fontSize: 10, color: "#999", display: "flex", alignItems: "center", gap: 3 }}>
                              <Icon.Status /> {node.slaDays}d
                            </span>
                          )}
                          {isEnd ? (
                            <span style={{ fontSize: 9, fontWeight: "bold", letterSpacing: 0.5, color: def.color, textTransform: "uppercase" }}>END</span>
                          ) : def.kind === "start" ? (
                            <span style={{ fontSize: 9, fontWeight: "bold", letterSpacing: 0.5, color: COLORS.purple, textTransform: "uppercase" }}>START</span>
                          ) : def.kind === "decision" ? (
                            <span style={{ fontSize: 9, fontWeight: "bold", letterSpacing: 0.5, color: COLORS.amber, background: COLORS.amberSoft, padding: "2px 7px", borderRadius: 20 }}>BRANCH</span>
                          ) : null}
                        </div>
                      </div>
                      {/* connection handle (right side) */}
                      <div
                        onMouseDown={(e) => startConnect(e, node)}
                        title="Drag to connect"
                        style={{
                          position: "absolute", right: -7, top: NODE_H / 2 - 7, width: 14, height: 14, borderRadius: "50%",
                          background: COLORS.purple, border: "2px solid white", cursor: "crosshair", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                      {/* input port (left) */}
                      <div style={{ position: "absolute", left: -5, top: NODE_H / 2 - 5, width: 10, height: 10, borderRadius: "50%", background: "white", border: `2px solid ${def.color}` }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div style={{ position: "absolute", bottom: 12, left: 16, display: "flex", gap: 14, fontSize: 11, color: "#888", background: "white", border: `0.5px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 12px" }}>
              <LegendItem color={CONNECTOR_COLOR[""]} label="Flow" />
              <LegendItem color={COLORS.green} label="Approved" />
              <LegendItem color={COLORS.amber} label="Revision" />
              <LegendItem color={COLORS.red} label="Rejected" />
            </div>

            {/* Validation panel */}
            {validation && (
              <div style={{ position: "absolute", bottom: 50, left: 16, right: 16, maxWidth: 480, background: "white", border: `1px solid ${validation.ok ? COLORS.green : COLORS.red}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: validation.ok ? COLORS.greenSoft : COLORS.redSoft }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: "bold", color: validation.ok ? "#065f46" : "#991b1b" }}>
                    {validation.ok ? <Icon.Check /> : <Icon.Alert />}
                    {validation.ok ? "Workflow is valid" : `${validation.issues.length} issue(s) found`}
                  </div>
                  <span onClick={() => setValidation(null)} style={{ cursor: "pointer", color: "#999" }}><Icon.Close /></span>
                </div>
                {(validation.issues.length > 0 || validation.warnings.length > 0) && (
                  <div style={{ padding: "10px 14px", maxHeight: 160, overflowY: "auto" }}>
                    {validation.issues.map((msg, i) => (
                      <div key={"i" + i} style={{ display: "flex", gap: 8, fontSize: 11, color: "#991b1b", marginBottom: 6 }}>
                        <span style={{ flexShrink: 0 }}><Icon.Alert /></span>{msg}
                      </div>
                    ))}
                    {validation.warnings.map((msg, i) => (
                      <div key={"w" + i} style={{ display: "flex", gap: 8, fontSize: 11, color: "#92400e", marginBottom: 6 }}>
                        <span style={{ flexShrink: 0 }}><Icon.Alert /></span>{msg}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Toast */}
            {toast && (
              <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", background: COLORS.ink, color: "white", fontSize: 12, padding: "8px 18px", borderRadius: 20, boxShadow: "0 4px 14px rgba(0,0,0,0.2)", zIndex: 10 }}>
                {toast}
              </div>
            )}
          </div>

          {/* ── Right panel: Properties / Analytics ── */}
          <div style={{ width: 260, borderLeft: `0.5px solid ${COLORS.border}`, flexShrink: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {selectedEdge ? (
              <ConnectorPanel edge={selectedEdge} idx={selectedEdgeIdx} setEdges={setEdges} onDelete={() => deleteEdge(selectedEdgeIdx)} />
            ) : selectedNode ? (
              <NodePanel node={selectedNode} onChange={(patch) => updateNode(selectedNode.id, patch)} onDelete={() => deleteNode(selectedNode.id)} />
            ) : (
              <AnalyticsPanel
                totalSteps={totalSteps}
                approvalLevels={approvalLevels}
                estProcessing={estProcessing}
                activeBranches={activeBranches}
                version={version}
                status={status}
              />
            )}
          </div>
        </div>



        {/* Footer status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 20px", borderTop: `0.5px solid ${COLORS.border}`, fontSize: 11, color: "#aaa", background: "white" }}>
          <div style={{ display: "flex", gap: 18 }}>
            <FooterStat icon={<Icon.Status />} value={totalSteps} label="Total Steps" />
            <FooterStat icon={<Icon.Shield />} value={approvalLevels} label="Approval Levels" />
            <FooterStat icon={<Icon.Status />} value={`${estProcessing}d`} label="Est. Processing" />
            <FooterStat icon={<Icon.Branch />} value={activeBranches} label="Active Branches" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontWeight: "bold", color: "#666" }}>{version}</span>
            <span style={{
              display: "flex", alignItems: "center", gap: 5, fontWeight: "bold",
              color: status === "Published" ? "#059669" : "#92400e",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: status === "Published" ? "#22c55e" : "#f59e0b", display: "inline-block" }} />
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Templates Modal ── */}
      {showTemplates && (
        <Modal onClose={() => setShowTemplates(false)} title="Workflow Templates" width={680}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {Object.entries(TEMPLATES).map(([key, t]) => (
              <div
                key={key}
                onClick={() => applyTemplate(key)}
                style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14, cursor: "pointer" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.purple; e.currentTarget.style.background = COLORS.purpleSoft; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = "white"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.purpleSoft, color: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.Templates />
                  </span>
                  <div style={{ fontSize: 13, fontWeight: "bold", color: "#111" }}>{t.name}</div>
                </div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.5 }}>{t.description}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 14, height: 2, background: color, display: "inline-block" }} />
      {label}
    </div>
  );
}

function FooterStat({ icon, value, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: COLORS.purple }}>{icon}</span>
      <span style={{ fontWeight: "bold", color: "#333" }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 22, height: 22, border: "none", background: "transparent", color: "#666", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

function btnStyle(bg, color, border) {
  return {
    display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
    fontSize: 12, fontWeight: "bold", cursor: "pointer", border: `1px solid ${border}`,
    background: bg, color, whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
  };
}

function Modal({ children, onClose, title, width = 600 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onMouseDown={onClose}>
      <div style={{ background: "white", borderRadius: 14, width, maxWidth: "90vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `0.5px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: "bold", color: "#111" }}>{title}</div>
          <span onClick={onClose} style={{ cursor: "pointer", color: "#999" }}><Icon.Close /></span>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

function NodePanel({ node, onChange, onDelete }) {
  const def = NODE_TYPES[node.type];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 28, height: 28, borderRadius: 8, background: `${def.color}1a`, color: def.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <def.icon />
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: "bold", color: "#111" }}>Node Properties</div>
          <div style={{ fontSize: 10, color: "#999" }}>{def.label}</div>
        </div>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: "bold", color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>General Information</div>
        <FormField label="Node Name">
          <input style={inputStyle} value={node.name} onChange={(e) => onChange({ name: e.target.value })} />
        </FormField>
        <FormField label="Description">
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 56 }} value={node.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="What happens at this step..." />
        </FormField>

        {def.kind !== "end" && (
          <>
            <div style={{ fontSize: 10, fontWeight: "bold", color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>Assignment</div>
            <FormField label="Assigned To">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={node.assignedTo} onChange={(e) => onChange({ assignedTo: e.target.value })}>
                <option value="">Select role...</option>
                {ASSIGNEE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </FormField>

            <FormField label="Required Action">
              <select style={{ ...inputStyle, cursor: "pointer" }} value={node.requiredAction} onChange={(e) => onChange({ requiredAction: e.target.value })}>
                {REQUIRED_ACTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </FormField>

            <div style={{ fontSize: 10, fontWeight: "bold", color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>SLA</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <FormField label="Number of Days">
                <input type="number" min="0" style={inputStyle} value={node.slaDays ?? ""} onChange={(e) => onChange({ slaDays: e.target.value === "" ? null : +e.target.value })} />
              </FormField>
              <FormField label="Priority Level">
                <select style={{ ...inputStyle, cursor: "pointer" }} value={node.priority} onChange={(e) => onChange({ priority: e.target.value })}>
                  {["Low", "Normal", "High", "Urgent"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </FormField>
            </div>

            <div style={{ fontSize: 10, fontWeight: "bold", color: "#999", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10, marginTop: 16 }}>Notifications</div>
            <ToggleSwitch on={node.notifyFaculty} onClick={() => onChange({ notifyFaculty: !node.notifyFaculty })} label="Notify Faculty" />
            <ToggleSwitch on={node.notifyAdmin} onClick={() => onChange({ notifyAdmin: !node.notifyAdmin })} label="Notify Program Chair / Administrator" />
          </>
        )}

        {def.kind === "end" && (
          <div style={{ fontSize: 11, color: "#888", background: "#fafafa", borderRadius: 8, padding: 10, lineHeight: 1.5 }}>
            This is an end state. The workflow terminates here and the document status is set to <strong>{node.name}</strong>.
          </div>
        )}

        {def.kind === "decision" && (
          <div style={{ fontSize: 11, color: "#888", background: "#fafafa", borderRadius: 8, padding: 10, lineHeight: 1.5, marginTop: 12 }}>
            Connect this node to two or more steps, then select each connector to set its condition label (e.g. Approved, Rejected, Revision Requested).
          </div>
        )}
      </div>

      <div style={{ padding: 14, borderTop: `0.5px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
        <button style={{ ...btnStyle(COLORS.purple, "white", COLORS.purple), justifyContent: "center" }} onClick={() => {}}>
          <Icon.Check /> Save Changes
        </button>
        <button style={{ ...btnStyle(COLORS.redSoft, "#991b1b", "#fca5a5"), justifyContent: "center" }} onClick={onDelete}>
          <Icon.Trash /> Delete Node
        </button>
      </div>
    </div>
  );
}

function ConnectorPanel({ edge, idx, setEdges, onDelete }) {
  const setLabel = (label) => {
    setEdges((es) => es.map((e, i) => (i === idx ? { ...e, label } : e)));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#111" }}>Connector Properties</div>
        <div style={{ fontSize: 10, color: "#999" }}>Decision condition</div>
      </div>
      <div style={{ padding: 16, flex: 1 }}>
        <FormField label="Condition Label">
          <select style={{ ...inputStyle, cursor: "pointer" }} value={edge.label} onChange={(e) => setLabel(e.target.value)}>
            {CONNECTOR_LABELS.map((l) => <option key={l} value={l}>{l || "No condition (default path)"}</option>)}
          </select>
        </FormField>
        <div style={{ fontSize: 11, color: "#888", background: "#fafafa", borderRadius: 8, padding: 10, lineHeight: 1.6, marginTop: 8 }}>
          {edge.label ? (
            <>IF Status = <strong>{edge.label}</strong> → continue along this path.</>
          ) : (
            <>This connector has no condition and is treated as the default next step.</>
          )}
        </div>
      </div>
      <div style={{ padding: 14, borderTop: `0.5px solid ${COLORS.border}` }}>
        <button style={{ ...btnStyle(COLORS.redSoft, "#991b1b", "#fca5a5"), justifyContent: "center", width: "100%" }} onClick={onDelete}>
          <Icon.Trash /> Remove Connector
        </button>
      </div>
    </div>
  );
}

function AnalyticsPanel({ totalSteps, approvalLevels, estProcessing, activeBranches, version, status }) {
  const items = [
    { label: "Total Workflow Steps", value: totalSteps, icon: <Icon.Status /> },
    { label: "Approval Levels", value: approvalLevels, icon: <Icon.Shield /> },
    { label: "Estimated Processing Time", value: `${estProcessing} days`, icon: <Icon.Status /> },
    { label: "Active Branches", value: activeBranches, icon: <Icon.Branch /> },
    { label: "Workflow Version", value: version, icon: <Icon.Templates /> },
    { label: "Current Status", value: status, icon: <Icon.Publish /> },
  ];
  return (
    <div>
      <div style={{ padding: "14px 16px", borderBottom: `0.5px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 13, fontWeight: "bold", color: "#111" }}>Workflow Analytics</div>
        <div style={{ fontSize: 10, color: "#999" }}>Select a node or connector to edit its properties</div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => (
          <div key={it.label} style={{ background: "#f8f5ff", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.purpleSoft, color: COLORS.purple, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{it.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>{it.label}</div>
              <div style={{ fontSize: 15, fontWeight: "bold", color: "#111" }}>{it.value}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 16px 16px", fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>
        Tip: drag a component from the left panel onto the canvas to add it. Drag the purple handle on a node's right edge to connect it to another step.
      </div>
    </div>
  );
}
