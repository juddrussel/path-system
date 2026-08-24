import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import {
  Search, Plus, Download, Filter, MoreHorizontal, ChevronRight, ChevronDown, Pencil,
  TrendingUp, TrendingDown, Clock, Shield, DollarSign, GraduationCap,
  AlertTriangle, CheckCircle2, Zap, UserCheck, Building2, FileText, AlertCircle,
  Layers, Gauge, X, Mail, Smartphone, MonitorSmartphone, ArrowUpDown, MoreVertical, ArrowUpRight, SlidersHorizontal,
} from "lucide-react";

// ── API base ─────────────────────────────────────────────────────────────
// Set VITE_API_URL in client/.env to your Render backend URL, e.g.
// VITE_API_URL=https://path-system-api.onrender.com/api
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

// ── Sidebar SVG Icons (copied from Dashboard.jsx) ──────────────────────────
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
  Download: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" width="12" height="12">
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" />
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
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.2" fillOpacity="0.55" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  SLA: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v3.8l2.6 1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

const PRIORITY_CFG = {
  High:   { bg: "#ede9fe", color: "#6d28d9" },
  Medium: { bg: "#f3f4f6", color: "#4b5563" },
  Low:    { bg: "#ecfdf5", color: "#059669" },
};

const REVIEWER_ROLES = ["Program Chair", "Admin", "Faculty"];

// ── Small building blocks ───────────────────────────────────────────────
function StatusDot({ status }) {
  const active = status === "Active";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: active ? "#059669" : "#9ca3af" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: active ? "#22c55e" : "#d1d5db" }} />
      {status}
    </span>
  );
}

function SectionCard({ title, subtitle, icon: Icn, action, children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #cbc3d7", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)", padding: 18, ...style }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {Icn && (
            <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icn style={{ width: 13, height: 13, color: "#7c3aed" }} />
            </div>
          )}
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{title}</p>
            {subtitle && <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// Chip-style editor for a comma-separated "hours before deadline" list
// (e.g. "48,24,4") — renders each value as a removable pill plus a trailing
// "+ Add hours" pill that turns into a small number input when clicked.
// Keeps the underlying value as the same CSV string the rest of the form
// already reads/writes (`onChange(csv)`), sorted descending with duplicates
// removed, so it's a drop-in replacement for the old plain text input.
function HourChipsInput({ value, onChange, placeholder = "Add hours…" }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const hours = String(value ?? "")
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isInteger(n) && n > 0);

  function commit(next) {
    const unique = [...new Set(next)].sort((a, b) => b - a);
    onChange(unique.join(","));
  }

  function addDraft() {
    const n = parseInt(draft, 10);
    if (Number.isInteger(n) && n > 0) commit([...hours, n]);
    setDraft("");
    setAdding(false);
  }

  function removeAt(n) {
    commit(hours.filter(h => h !== n));
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center", marginTop: 5 }}>
      {hours.map(h => (
        <span
          key={h}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 8px 5px 12px", borderRadius: 999,
            background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 600,
          }}
        >
          {h} h
          <button
            type="button"
            onClick={() => removeAt(h)}
            aria-label={`Remove ${h} hours`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 15, height: 15, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.25)", color: "#fff", cursor: "pointer", padding: 0,
            }}
          >
            <X size={10} strokeWidth={3} />
          </button>
        </span>
      ))}

      {adding ? (
        <input
          autoFocus
          type="number"
          min={1}
          value={draft}
          placeholder="hrs"
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); addDraft(); }
            if (e.key === "Escape") { setDraft(""); setAdding(false); }
          }}
          onBlur={addDraft}
          style={{
            width: 60, padding: "5px 8px", borderRadius: 999,
            border: "1px solid #c4b5fd", background: "#faf5ff", fontSize: 12,
            color: "#111827", outline: "none", boxSizing: "border-box",
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 10px", borderRadius: 999,
            border: "1px dashed #c4b5fd", background: "#faf5ff",
            color: "#7c3aed", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >
          + {placeholder}
        </button>
      )}
    </div>
  );
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

// ── Main component ──────────────────────────────────────────────────────
export default function SLAConfiguration() {
  const navigate = useNavigate();
  // TODO: replace with your real auth/role check (e.g. from context or a decoded JWT)
  const canViewAdminNav = true;
  const [stats, setStats] = useState(null);
  const [rules, setRules] = useState([]);
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState(null);
  const [escalation, setEscalation] = useState(null); // { auto_escalation, notify_email, notify_dashboard, notify_sms, recipients }
  const [alerts, setAlerts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createForm, setCreateForm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [docTypesError, setDocTypesError] = useState("");

  // ── Table toolbar state (search / priority filter / active-only / sort / pagination) ──
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [activeOnlyFilter, setActiveOnlyFilter] = useState("Active Only");
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 5;

  const set = (k, v) => setRuleForm(f => ({ ...f, [k]: v }));
  const setCreate = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));

  const emptyCreateForm = () => ({
    docType: "",
    priority: "Medium",
    reviewerRole: "",
    turnaroundHours: 48,
    escalationHours: 24,
    reminderStageDays: "48,24,4",
    overdueIntervalDays: 24,
    remarks: "",
  });

  function openCreateModal() {
    setCreateForm(emptyCreateForm());
    setShowCreateModal(true);
  }

  async function handleCreateRule() {
    if (!createForm?.docType || !createForm?.reviewerRole) {
      setError("Document Type and Reviewer Role are required.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const { id } = await apiFetch("/sla/rules", {
        method: "POST",
        body: JSON.stringify({
          documentType: createForm.docType,
          priority: createForm.priority,
          reviewerRole: createForm.reviewerRole,
          turnaroundHours: Number(createForm.turnaroundHours),
          escalationHours: Number(createForm.escalationHours),
          reminderStageDays: createForm.reminderStageDays,
          overdueReminderIntervalDays: Number(createForm.overdueIntervalDays),
          remarks: createForm.remarks,
        }),
      });
      setShowCreateModal(false);
      setToast("SLA rule created.");
      await loadAll();
      setSelectedRuleId(id);
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      setError(err.message || "Failed to create SLA rule.");
    } finally {
      setCreating(false);
    }
  }

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, rulesRes, escRes, alertsRes, activityRes] = await Promise.all([
        apiFetch("/sla/stats"),
        apiFetch("/sla/rules"),
        apiFetch("/sla/escalation-settings"),
        apiFetch("/sla/alerts"),
        apiFetch("/sla/activity"),
      ]);
      setStats(statsRes);
      setRules(rulesRes);
      setEscalation(escRes);
      setAlerts(alertsRes);
      setActivity(activityRes);

      if (rulesRes.length) {
        setSelectedRuleId(rulesRes[0].id);
        setRuleForm(toFormShape(rulesRes[0]));
      }
    } catch (err) {
      setError(err.message || "Failed to load SLA Configuration data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Pull the list of existing document/form categories for the "Document Type" dropdown
  const loadDocumentTypes = useCallback(async () => {
    setLoadingDocTypes(true);
    setDocTypesError("");
    try {
      const data = await apiFetch("/categories");
      const list = Array.isArray(data) ? data : (data?.categories || []);
      const names = Array.from(new Set(
        list
          .filter(c => c.status !== "Archived")
          .map(c => c.name)
          .filter(Boolean)
      )).sort((a, b) => a.localeCompare(b));
      setDocumentTypes(names);
    } catch (err) {
      setDocTypesError(err.message || "Failed to load document types.");
    } finally {
      setLoadingDocTypes(false);
    }
  }, []);

  useEffect(() => { loadDocumentTypes(); }, [loadDocumentTypes]);

  function toFormShape(r) {
    return {
      docType: r.document_type,
      priority: r.priority,
      reviewerRole: r.reviewer_role,
      turnaroundHours: r.turnaround_hours,
      escalationHours: r.escalation_hours,
      // Falls back to the default 48/24/4-hour schedule and a 24-hour
      // overdue cadence if this rule predates the reminder-schedule columns
      // (or a value came back null for any reason).
      reminderStageDays: r.reminder_stage_hours || "48,24,4",
      overdueIntervalDays: r.overdue_reminder_interval_hours ?? 24,
      remarks: r.remarks || "",
      status: r.status,
    };
  }

  function selectRule(id) {
    const r = rules.find(x => x.id === id);
    if (!r) return;
    setSelectedRuleId(id);
    setRuleForm(toFormShape(r));
  }

  async function handleUpdateRule() {
    if (!selectedRuleId || !ruleForm) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/sla/rules/${selectedRuleId}`, {
        method: "PUT",
        body: JSON.stringify({
          documentType: ruleForm.docType,
          priority: ruleForm.priority,
          reviewerRole: ruleForm.reviewerRole,
          turnaroundHours: Number(ruleForm.turnaroundHours),
          escalationHours: Number(ruleForm.escalationHours),
          reminderStageDays: ruleForm.reminderStageDays,
          overdueReminderIntervalDays: Number(ruleForm.overdueIntervalDays),
          remarks: ruleForm.remarks,
          status: ruleForm.status,
        }),
      });
      setToast("Rule updated.");
      setShowEditModal(false);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to update rule.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  function discardChanges() {
    const r = rules.find(x => x.id === selectedRuleId);
    if (r) setRuleForm(toFormShape(r));
  }

  async function handleDeleteRule() {
    if (!selectedRuleId) return;
    if (!window.confirm("Delete this SLA rule? This can't be undone.")) return;
    setSaving(true);
    setError("");
    try {
      await apiFetch(`/sla/rules/${selectedRuleId}`, { method: "DELETE" });
      setToast("Rule deleted.");
      setShowEditModal(false);
      setSelectedRuleId(null);
      setRuleForm(null);
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to delete rule.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 2500);
    }
  }

  async function toggleAutoEscalation() {
    if (!escalation) return;
    const next = { ...escalation, auto_escalation: escalation.auto_escalation ? 0 : 1 };
    setEscalation(next);
    try {
      await apiFetch("/sla/escalation-settings", {
        method: "PUT",
        body: JSON.stringify({
          autoEscalation: next.auto_escalation,
          notifyEmail: next.notify_email,
          notifyDashboard: next.notify_dashboard,
          notifySms: next.notify_sms,
        }),
      });
    } catch (err) {
      setError(err.message || "Failed to update escalation settings.");
    }
  }

  async function toggleReminder(key) {
    if (!escalation) return;
    const map = { email: "notify_email", dashboard: "notify_dashboard", sms: "notify_sms" };
    const field = map[key];
    const next = { ...escalation, [field]: escalation[field] ? 0 : 1 };
    setEscalation(next);
    try {
      await apiFetch("/sla/escalation-settings", {
        method: "PUT",
        body: JSON.stringify({
          autoEscalation: next.auto_escalation,
          notifyEmail: next.notify_email,
          notifyDashboard: next.notify_dashboard,
          notifySms: next.notify_sms,
        }),
      });
    } catch (err) {
      setError(err.message || "Failed to update reminder settings.");
    }
  }

  // ── Edit-drawer field cards (left column) ──────────────────────────────
  function renderIdentityCard() {
    return ruleForm ? (
      <div style={drawerCardStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={drawerLabelStyle}>Document Type</label>
            <input
              value={ruleForm.docType}
              disabled
              readOnly
              title="Document Type can't be changed after the rule is created."
              style={{ ...inpStyle, marginTop: 5, cursor: "not-allowed", color: "#9ca3af", background: "#f0f0f3" }}
            />
          </div>
          <div>
            <label style={drawerLabelStyle}>Assigned Reviewer Role</label>
            <select
              value={ruleForm.reviewerRole}
              onChange={e => set("reviewerRole", e.target.value)}
              style={{ ...selStyle, marginTop: 5, color: ruleForm.reviewerRole ? "#111827" : "#9ca3af" }}
            >
              <option value="" disabled hidden>Select a reviewer role</option>
              {REVIEWER_ROLES.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    ) : null;
  }

  function renderTurnaroundCard() {
    return ruleForm ? (
      <div style={drawerCardStyle}>
        <h3 style={drawerCardTitleStyle}>Turnaround Time</h3>
        <div>
          <label style={drawerLabelStyle}>Hours</label>
          <input
            type="number"
            value={ruleForm.turnaroundHours}
            onChange={e => set("turnaroundHours", e.target.value)}
            style={{ ...inpStyle, marginTop: 5 }}
          />
        </div>
      </div>
    ) : null;
  }

  function renderEscalationTriggerCard() {
    return ruleForm ? (
      <div style={drawerCardStyle}>
        <h3 style={drawerCardTitleStyle}>Escalation</h3>
        <div>
          <label style={drawerLabelStyle}>Escalation Trigger (Hours After Due)</label>
          <input
            type="number"
            value={ruleForm.escalationHours}
            onChange={e => set("escalationHours", e.target.value)}
            style={{ ...inpStyle, marginTop: 5 }}
          />
        </div>
      </div>
    ) : null;
  }

  // Configurable version of what used to be the hardcoded 7/3/1-day
  // DEADLINE_REMINDER_STAGES / APPROVAL_REMINDER_STAGES schedule in
  // task.routes.js — checkDeadlineReminders() now reads these two values
  // per task (matched by document type) instead of a fixed schedule.
  function renderReminderScheduleCard() {
    return ruleForm ? (
      <div style={drawerCardStyle}>
        <h3 style={drawerCardTitleStyle}>Deadline Reminder Schedule</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={drawerLabelStyle}>Reminder Hours Before Deadline</label>
            <HourChipsInput
              value={ruleForm.reminderStageDays}
              onChange={v => set("reminderStageDays", v)}
            />
            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
              Hours before the deadline to remind faculty and the reviewer. "Due today" always fires in addition to these.
            </p>
          </div>
          <div>
            <label style={drawerLabelStyle}>Overdue Reminder Interval (Hours)</label>
            <input
              type="number"
              min={1}
              value={ruleForm.overdueIntervalDays}
              onChange={e => set("overdueIntervalDays", e.target.value)}
              style={{ ...inpStyle, marginTop: 5 }}
            />
            <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
              How often (in hours) to repeat "still overdue" nags once the deadline has passed.
            </p>
          </div>
        </div>
      </div>
    ) : null;
  }

  function renderRemarksCard() {
    return ruleForm ? (
      <div style={drawerCardStyle}>
        <label style={drawerLabelStyle}>Internal Remarks</label>
        <textarea
          value={ruleForm.remarks}
          onChange={e => set("remarks", e.target.value)}
          rows={3}
          style={{ ...inpStyle, marginTop: 5, resize: "vertical" }}
        />
      </div>
    ) : null;
  }

  // ── Edit-drawer side cards (right column) ───────────────────────────────
  function renderStatusCard() {
    if (!ruleForm) return null;
    const active = ruleForm.status !== "Paused";
    return (
      <div style={{ ...drawerCardStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>Rule Status</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{active ? "Active" : "Paused"}</p>
        </div>
        <div
          onClick={() => set("status", active ? "Paused" : "Active")}
          style={{ width: 38, height: 21, borderRadius: 20, background: active ? "#7c3aed" : "#e5e7eb", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
        >
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2.5, left: active ? 19 : 3, transition: "left 0.15s" }} />
        </div>
      </div>
    );
  }

  function renderEscalationSettingsCard() {
    return escalation ? (
      <div style={drawerCardStyle}>
        <h3 style={drawerCardTitleStyle}>Escalation Settings</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0 10px", borderBottom: "1px solid #f5f5f8", marginBottom: 10 }}>
          <div style={{ paddingRight: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Auto-Escalation</p>
            <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>Automatically reassign to senior management if SLA fails.</p>
          </div>
          <div
            onClick={toggleAutoEscalation}
            style={{ width: 38, height: 21, borderRadius: 20, background: escalation.auto_escalation ? "#7c3aed" : "#e5e7eb", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
          >
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2.5, left: escalation.auto_escalation ? 19 : 3, transition: "left 0.15s" }} />
          </div>
        </div>

        <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Reminder Notifications</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { key: "email", label: "Email Notifications", field: "notify_email" },
            { key: "dashboard", label: "In-App Dashboard Alerts", field: "notify_dashboard" },
            { key: "sms", label: "Mobile SMS (Urgent Only)", field: "notify_sms" },
          ].map(o => (
            <label key={o.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#374151", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!escalation[o.field]}
                onChange={() => toggleReminder(o.key)}
                style={{ width: 14, height: 14, accentColor: "#7c3aed" }}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    ) : null;
  }

  function renderPreviewCard() {
    if (!ruleForm) return null;
    const activeChannels = [
      escalation?.notify_email && "Email",
      escalation?.notify_dashboard && "Dashboard",
      escalation?.notify_sms && "SMS",
    ].filter(Boolean);
    return (
      <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: BOX_RADIUS, padding: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "#7c3aed" }} />
        <h3 style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 12 }}>
          Configuration Preview
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Document</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{ruleForm.docType}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Turnaround</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{ruleForm.turnaroundHours} Hours</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>Reviewer</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{ruleForm.reviewerRole || "—"}</span>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(124,58,237,0.15)", paddingTop: 12 }}>
          <h4 style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>Escalation Timeline</h4>
          <div style={{ position: "relative", borderLeft: "2px solid #ddd6fe", marginLeft: 6, display: "flex", flexDirection: "column", gap: 10 }}>
            {(ruleForm.reminderStageDays || "")
              .split(",")
              .map(s => parseInt(s.trim(), 10))
              .filter(n => Number.isInteger(n) && n > 0)
              .sort((a, b) => b - a)
              .map(hours => (
                <div key={hours} style={{ position: "relative", paddingLeft: 14 }}>
                  <div style={{ position: "absolute", width: 10, height: 10, background: "#faf5ff", border: "2px solid #a78bfa", borderRadius: "50%", left: -7, top: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", display: "block" }}>
                    {hours} Hour{hours === 1 ? "" : "s"} Before Deadline
                  </span>
                  <span style={{ fontSize: 10.5, color: "#9ca3af" }}>Reminder to faculty + reviewer</span>
                </div>
              ))}
            <div style={{ position: "relative", paddingLeft: 14 }}>
              <div style={{ position: "absolute", width: 10, height: 10, background: "#f5f3ff", border: "2px solid #7c3aed", borderRadius: "50%", left: -7, top: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#7c3aed", display: "block" }}>Due in {ruleForm.turnaroundHours} Hours</span>
              <span style={{ fontSize: 10.5, color: "#9ca3af" }}>Turnaround deadline</span>
            </div>
            <div style={{ position: "relative", paddingLeft: 14 }}>
              <div style={{ position: "absolute", width: 10, height: 10, background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "50%", left: -7, top: 2 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#ef4444", display: "block" }}>Overdue (+{ruleForm.escalationHours}h)</span>
              <span style={{ fontSize: 10.5, color: "#9ca3af" }}>
                {activeChannels.length ? `Alert via ${activeChannels.join(", ")}` : "Escalate to Chair"} · repeats every {ruleForm.overdueIntervalDays || 24}h
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function ruleCode(r, idx) {
    return `SLA-${String(r.id ?? idx + 1).padStart(3, "0")}`;
  }

  // Deterministic pseudo-count used when the API doesn't return a docs-active figure
  function docsActiveFor(r) {
    if (r.docs_active != null) return r.docs_active;
    const seed = String(r.document_type || r.id || "");
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return (h % 260) + 8;
  }

  const isNearDeadline = (r) => r.status === "Active" && Number(r.escalation_hours) <= 24;
  const isOverdue = (r) => r.status === "Overdue" || r.status === "Breached";

  const draftCount = rules.filter(r => r.status === "Draft").length;
  const activeCount = rules.filter(r => r.status === "Active").length;
  const nearDeadlineCount = rules.filter(isNearDeadline).length;
  const overdueCount = rules.filter(isOverdue).length || (stats?.overdueRequests ?? 0);

  const statCards = [
    {
      label: "Total Rules", value: stats?.totalRules ?? rules.length, icon: FileText,
      accent: "#7c3aed", sub: `${stats?.activePolicies ?? activeCount} Active, ${draftCount} Draft`,
    },
    {
      label: "Active Rules", value: stats?.activePolicies ?? activeCount, icon: CheckCircle2,
      accent: "#059669", sub: "Monitoring current load",
    },
    {
      label: "Near Deadline", value: nearDeadlineCount, icon: AlertCircle,
      accent: "#d97706", sub: "Requires attention",
    },
    {
      label: "Overdue", value: String(overdueCount).padStart(2, "0"), icon: AlertTriangle,
      accent: "#dc2626", sub: "SLA breach occured",
    },
  ];

  const filteredRules = rules
    .filter(r => (r.document_type || "").toLowerCase().includes(searchQuery.toLowerCase()) || ruleCode(r).toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(r => priorityFilter === "All Priorities" || r.priority === priorityFilter)
    .filter(r => activeOnlyFilter === "All Rules" || r.status === "Active" || (activeOnlyFilter === "Paused Only" && r.status === "Paused"))
    .sort((a, b) => sortAsc ? a.turnaround_hours - b.turnaround_hours : b.turnaround_hours - a.turnaround_hours);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRules = filteredRules.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const COLORS = {
    primary: "#8b5cf6",
    primaryLight: "#a78bfa",
    surface: "#fcf8ff",
    surfaceContainer: "#ffffff",
    textPrimary: "#1e1b4b",
    textSecondary: "#8b7cf6",
    textTertiary: "#b3a3f7",
    border: "#cbc3d7",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };
  // Matches the Audit Trail page's card look (border-[#cbc3d7], shadow-sm)
  const cardShadow = "0 1px 2px 0 rgba(0,0,0,0.05)";
  const RADIUS = 8; // inputs, buttons, filter bar (Audit's rounded-md/rounded-lg)
  const BOX_RADIUS = 16; // stat cards, table, side cards, modals (Audit's rounded-2xl)

  const statAccent = { "Total Rules": COLORS.primary, "Active Rules": COLORS.success, "Near Deadline": COLORS.warning, "Overdue": COLORS.danger };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textPrimary, background: COLORS.surface }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap');

        .sla-row { transition: background-color 0.15s; }
        .sla-row:hover { background-color: rgba(246,242,255,0.6); }

* { box-sizing: border-box; }
.sla-config-view { width: 100%; max-width: 1380px; margin: 0 auto; }
.panel-card { border: 1px solid #e7e2ef; border-radius: 10px; background: #fff; box-shadow: 0 10px 28px rgba(57,36,93,.04); }
.date-kicker,.section-kicker { display:flex; align-items:center; gap:8px; color:#8f879c; font:10px "DM Sans",sans-serif; letter-spacing:.08em; text-transform:uppercase; }
.date-kicker { margin-bottom:12px; }
.section-kicker { gap:7px; margin-bottom:7px; color:#9d95a8; font-size:9px; }
.section-kicker::before { width:5px; height:5px; border-radius:1px; background:#c4b5fd; content:""; transform:rotate(45deg); }
.live-dot { width:6px; height:6px; border-radius:50%; background:#7c3aed; box-shadow:0 0 0 4px #eee8ff; }
.task-avatar,.tracking-detail-avatar { display:grid; flex:0 0 auto; place-items:center; border-radius:7px; background:#eee7ff; color:#7547c9; font:900 8px "DM Sans",sans-serif; }
.task-avatar { width:25px; height:25px; }
.tracking-detail-avatar { width:48px; height:48px; font-size:12px; }
.icon-button { position:relative; display:grid; width:34px; height:34px; place-items:center; border:1px solid transparent; border-radius:9px; background:transparent; color:#817a8d; cursor:pointer; }
.icon-button.compact { width:28px; height:28px; }
.primary-action { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 16px; border:0; border-radius:9px; background:#7c3aed; color:#fff; cursor:pointer; box-shadow:0 7px 17px rgba(124,58,237,.2); font:800 11px "DM Sans",sans-serif; }
.text-action { border:0; background:transparent; color:#7c3aed; cursor:pointer; }
.people-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:220px; color:#a39aa9; text-align:center; }
.people-empty strong { color:#62566c; font-size:13px; }
.people-empty span { font-size:10px; }
.sla-list-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px 18px; border-top:1px solid #f0edf4; color:#9d93a4; font:9px "DM Sans",sans-serif; }
.sla-list-footer>div { display:flex; gap:8px; }
.sla-list-footer button { padding:7px 11px; border:1px solid #e3dceb; border-radius:7px; background:#fff; color:#766a80; font:10px "DM Sans",sans-serif; cursor:pointer; }
.sla-list-footer button:disabled { opacity:.45; cursor:default; }
.sla-preserved-editor-controls { display:flex; flex-direction:column; gap:12px; }
.sla-preserved-editor-controls > div { padding:14px !important; border:1px solid #eee8f4; border-radius:8px; background:#fff; }
.sla-delete-document { width:100%; margin:0 0 14px; padding:9px; color:#dc2626; font-size:10px; }
@media (max-width:900px) { .sla-config-view { max-width:none; } }
/* Per-document SLA management */
.sla-document-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.sla-document-stats article{padding:16px 17px;border:1px solid #e5deed;border-radius:9px;background:#fff;box-shadow:0 10px 25px rgba(57,36,93,.04)}.sla-document-stats span{display:block;color:#958b9d;font:9px "DM Sans",sans-serif}.sla-document-stats strong{display:block;margin:8px 0 3px;color:#332c3e;font:700 25px Manrope,sans-serif}.sla-document-stats small{color:#a49aa9;font:9px "DM Sans",sans-serif}.sla-document-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.72fr);gap:15px;align-items:start}.sla-document-list,.sla-document-detail{border-color:#e5deed;box-shadow:0 12px 30px rgba(57,36,93,.045)}.sla-list-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 21px 16px;border-bottom:1px solid #f0edf4}.sla-list-heading h2{margin:7px 0 4px;color:#3b3245;font:700 18px Manrope,sans-serif}.sla-list-heading h2 span{display:inline-grid;width:23px;height:19px;margin-left:4px;place-items:center;border-radius:5px;background:#eee7fd;color:#7044c5;font:800 9px "DM Sans",sans-serif;vertical-align:middle}.sla-list-heading p{margin:0;color:#9a90a2;font:10px "DM Sans",sans-serif}.sla-list-heading select{height:34px;padding:0 9px;border:1px solid #e3dceb;border-radius:7px;background:#fff;color:#766a80;font:10px "DM Sans",sans-serif}.sla-document-table-head{display:grid;grid-template-columns:minmax(220px,1.7fr) minmax(110px,1fr) 58px 95px 112px;gap:12px;padding:10px 18px;background:#faf8fd;color:#9d93a4;font:800 8px "DM Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase}.sla-document-row{display:grid;grid-template-columns:minmax(220px,1.7fr) minmax(110px,1fr) 58px 95px 112px;align-items:center;gap:12px;width:100%;min-height:69px;padding:11px 18px;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer;transition:background .16s ease,box-shadow .16s ease}.sla-document-row:hover,.sla-document-row.selected{background:#fbf9ff;box-shadow:inset 3px 0 #8b5cf6}.sla-document-cell{display:flex;align-items:center;gap:9px;min-width:0}.sla-document-cell>span:last-child{display:flex;min-width:0;flex-direction:column;gap:4px}.sla-document-cell strong{overflow:hidden;color:#51465b;font:700 10px Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.sla-document-cell small,.sla-owner-cell,.sla-due-cell{overflow:hidden;color:#9e94a4;font:9px "DM Sans",sans-serif;text-overflow:ellipsis;white-space:nowrap}.sla-target-cell{color:#63429c;font:800 11px Manrope,sans-serif}.sla-state{display:inline-flex;align-items:center;gap:5px;width:max-content;padding:5px 7px;border-radius:5px;font:800 8px "DM Sans",sans-serif;white-space:nowrap}.sla-state i{width:5px;height:5px;border-radius:50%;background:currentColor}.sla-state.healthy{background:#eaf6ee;color:#4c9b70}.sla-state.risk{background:#fbefda;color:#ae7a1f}.sla-state.closed{background:#efedf1;color:#8c8392}.sla-document-detail{padding:20px}.sla-document-detail .panel-topline{margin-bottom:20px}.sla-selected-document{display:flex;align-items:center;gap:10px;margin-bottom:19px}.sla-selected-document>div{display:flex;min-width:0;flex-direction:column;gap:4px}.sla-selected-document strong{overflow:hidden;color:#50445b;font:700 13px Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.sla-selected-document small{color:#a097a7;font:9px "DM Sans",sans-serif}.sla-detail-progress{margin-bottom:20px}.sla-detail-progress>div:first-child{height:7px;overflow:hidden;border-radius:9px;background:#eee8f5}.sla-detail-progress>div:first-child span{display:block;height:100%;border-radius:9px;background:linear-gradient(90deg,#9b74e8,#7c3aed)}.sla-detail-progress>div:last-child{display:flex;justify-content:space-between;margin-top:7px;color:#9b91a2;font:9px "DM Sans",sans-serif}.sla-document-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:17px}.sla-detail-setting{display:flex;align-items:center;gap:9px;padding:13px 0;border-top:1px solid #f0edf4;border-bottom:1px solid #f0edf4}.sla-detail-setting>span:nth-child(2){display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.sla-detail-setting strong{color:#62566c;font:700 10px Manrope,sans-serif}.sla-detail-setting small{color:#9b91a2;font:9px "DM Sans",sans-serif;line-height:1.35}.sla-detail-facts{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px 0}.sla-detail-facts div{display:flex;flex-direction:column;gap:5px}.sla-detail-facts span{color:#9d93a4;font:8px "DM Sans",sans-serif;text-transform:uppercase}.sla-detail-facts strong{overflow:hidden;color:#62566c;font:700 10px Manrope,sans-serif;text-overflow:ellipsis;white-space:nowrap}.sla-save-document{justify-content:center;width:100%;margin-bottom:15px}.sla-document-detail .sla-preview-callout{margin-top:0}.sla-document-detail .sla-state{margin-left:auto}
@media (max-width:900px){.sla-document-stats{grid-template-columns:repeat(2,1fr)}.sla-document-layout{grid-template-columns:1fr}.sla-document-table-head{display:none}.sla-document-row{grid-template-columns:minmax(0,1fr) auto auto;gap:10px}.sla-owner-cell{display:none}.sla-target-cell{grid-column:2}.sla-state{grid-column:3}.sla-due-cell{grid-column:1/-1;padding-left:40px}.sla-list-heading{align-items:stretch;flex-direction:column}.sla-list-heading select{width:max-content}}
@media (max-width:560px){.sla-document-stats{gap:8px}.sla-document-stats article{padding:13px}.sla-document-stats strong{font-size:21px}.sla-list-heading,.sla-document-detail{padding:16px}.sla-document-row{padding:12px 14px}.sla-document-cell strong{font-size:9px}.sla-document-fields{grid-template-columns:1fr}.sla-due-cell{padding-left:0}.sla-selected-document strong{font-size:11px}}

/* Document-type SLA policy catalog */
.sla-policy-table-head{display:grid;grid-template-columns:minmax(220px,1.45fr) minmax(150px,1fr) 58px minmax(130px,1fr) 82px;gap:12px;padding:10px 18px;background:#faf8fd;color:#9d93a4;font:800 8px "DM Sans",sans-serif;letter-spacing:.08em;text-transform:uppercase}.sla-policy-row{display:grid;grid-template-columns:minmax(220px,1.45fr) minmax(150px,1fr) 58px minmax(130px,1fr) 82px;align-items:center;gap:12px;width:100%;min-height:72px;padding:11px 18px;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer;transition:background .16s ease,box-shadow .16s ease}.sla-policy-row:hover,.sla-policy-row.selected{background:#fbf9ff;box-shadow:inset 3px 0 #8b5cf6}.sla-category-cell{overflow:hidden;color:#897d92;font:9px "DM Sans",sans-serif;text-overflow:ellipsis;white-space:nowrap}.sla-coverage-cell{display:flex;flex-direction:column;gap:3px}.sla-coverage-cell strong{color:#63429c;font:800 13px Manrope,sans-serif}.sla-coverage-cell small{color:#a39aa9;font:8px "DM Sans",sans-serif}.sla-inheritance-banner{display:flex;gap:9px;margin-bottom:18px;padding:11px;border:1px solid #e1d5f4;border-radius:8px;background:#faf7ff;color:#7750b8}.sla-inheritance-banner svg{flex:none}.sla-inheritance-banner div{display:flex;flex-direction:column;gap:4px}.sla-inheritance-banner strong{color:#685080;font:700 10px Manrope,sans-serif}.sla-inheritance-banner small{color:#9b91a2;font:9px "DM Sans",sans-serif;line-height:1.4}.sla-owner-select{margin-bottom:17px}.sla-owner-select select{height:39px;padding:0 10px;border:1px solid #e3dceb;border-radius:7px;background:#fff;color:#5d5167;font:10px "DM Sans",sans-serif}.sla-owner-select select:focus{border-color:#b99af1;box-shadow:0 0 0 3px #eee7fd;outline:0}
@media (max-width:900px){.sla-policy-table-head{display:none}.sla-policy-row{grid-template-columns:minmax(0,1fr) auto auto;gap:8px}.sla-category-cell,.sla-owner-cell{display:none}.sla-target-cell{grid-column:2}.sla-coverage-cell{grid-column:3}.sla-policy-row .sla-document-cell{grid-column:1}}
@media (max-width:560px){.sla-policy-row{min-height:70px;padding:11px 14px}.sla-policy-row .sla-document-cell strong{font-size:9px}.sla-inheritance-banner{margin-bottom:15px}}

/* Policy row reminder and escalation columns */
.sla-policy-table-head,.sla-policy-row{grid-template-columns:minmax(205px,1.45fr) minmax(135px,1fr) 52px 70px 75px minmax(115px,1fr) 70px}.sla-policy-reminder,.sla-policy-escalation{font:800 9px "DM Sans",sans-serif;white-space:nowrap}.sla-policy-reminder.enabled{color:#4c9b70}.sla-policy-reminder.disabled{color:#aaa0ad}.sla-policy-escalation{color:#63429c}.sla-policy-row .sla-owner-cell{grid-column:auto}.sla-policy-row .sla-coverage-cell{grid-column:auto}@media (max-width:1100px) and (min-width:901px){.sla-policy-table-head,.sla-policy-row{grid-template-columns:minmax(180px,1.4fr) 95px 45px 58px 60px 95px 58px}.sla-category-cell,.sla-owner-cell{font-size:8px}}@media (max-width:900px){.sla-policy-table-head{display:none}.sla-policy-row{grid-template-columns:minmax(0,1fr) auto auto;gap:8px}.sla-policy-row .sla-category-cell,.sla-policy-row .sla-owner-cell{display:none}.sla-policy-row .sla-target-cell{grid-column:2}.sla-policy-row .sla-policy-reminder,.sla-policy-row .sla-policy-escalation{display:inline-flex;grid-column:3}.sla-policy-row .sla-coverage-cell{grid-column:3}.sla-policy-row .sla-policy-escalation{display:none}.sla-policy-row .sla-document-cell{grid-column:1}.sla-policy-row .sla-coverage-cell{grid-column:3}}@media (max-width:560px){.sla-policy-row{min-height:70px;padding:11px 14px}.sla-policy-row .sla-target-cell{font-size:10px}}

@media (max-width:900px){.sla-policy-row{grid-template-columns:minmax(0,1fr) auto auto auto;align-items:center}.sla-policy-row .sla-target-cell{grid-column:2}.sla-policy-row .sla-policy-reminder{grid-column:3}.sla-policy-row .sla-policy-escalation{display:inline-flex;grid-column:4}.sla-policy-row .sla-coverage-cell{grid-column:4;grid-row:2}.sla-policy-row .sla-document-cell{grid-column:1;grid-row:1 / span 2}.sla-policy-row .sla-target-cell,.sla-policy-row .sla-policy-reminder,.sla-policy-row .sla-policy-escalation{align-self:start;margin-top:4px}.sla-policy-row .sla-policy-reminder:before{content:"R ";font-weight:400;color:#a39aa9}.sla-policy-row .sla-policy-escalation:before{content:"E ";font-weight:400;color:#a39aa9}}
@media (max-width:560px){.sla-policy-row{grid-template-columns:minmax(0,1fr) auto auto auto;gap:5px}.sla-policy-row .sla-target-cell{font-size:9px}.sla-policy-row .sla-policy-reminder,.sla-policy-row .sla-policy-escalation{font-size:8px}.sla-policy-row .sla-coverage-cell{font-size:8px}}

/* SLA reminder schedule and configuration preview */
.sla-reminder-schedule{margin:0 0 18px;padding:14px;border:1px solid #dfd5e8;border-radius:10px;background:#fff}.sla-subsection-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.sla-subsection-heading>div{display:flex;flex-direction:column;gap:4px}.sla-subsection-heading strong{color:#4d4059;font:700 11px Manrope,sans-serif}.sla-subsection-heading small{color:#9d93a4;font:9px "DM Sans",sans-serif}.sla-subsection-heading>svg{color:#8b5cf6}.sla-field-label{display:block;margin-bottom:8px;color:#766a80;font:800 9px "DM Sans",sans-serif}.sla-reminder-chips{display:flex;flex-wrap:wrap;gap:7px}.sla-reminder-chips button{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:0;border-radius:16px;background:linear-gradient(135deg,#8b5cf6,#6d35d7);color:#fff;font:800 9px "DM Sans",sans-serif;cursor:pointer}.sla-reminder-chips button svg{opacity:.7}.sla-reminder-chips .add-reminder-chip{border:1px dashed #bba3e9;background:#faf7ff;color:#7c3aed}.sla-helper-copy{margin:9px 0 15px;color:#a198a8;font:9px "DM Sans",sans-serif;line-height:1.45}.sla-config-preview-card{margin:17px 0;padding:14px;border-left:3px solid #8b5cf6;border-radius:0 10px 10px 0;background:linear-gradient(135deg,#fbf9ff,#f4efff)}.sla-preview-card-kicker{margin-bottom:13px;color:#7c3aed;font:900 9px "DM Sans",sans-serif;letter-spacing:.07em;text-transform:uppercase}.sla-preview-summary{display:grid;gap:8px}.sla-preview-summary>div{display:flex;align-items:baseline;justify-content:space-between;gap:10px}.sla-preview-summary span{color:#897f93;font:9px "DM Sans",sans-serif}.sla-preview-summary strong{max-width:70%;overflow:hidden;color:#4a3e55;font:700 10px Manrope,sans-serif;text-align:right;text-overflow:ellipsis;white-space:nowrap}.sla-preview-divider{height:1px;margin:13px 0;border-top:1px solid #ded5ea}.sla-preview-timeline-title{margin-bottom:11px;color:#8a7e96;font:900 9px "DM Sans",sans-serif;text-transform:capitalize}.sla-config-timeline{position:relative;padding-left:8px}.sla-config-timeline:before{position:absolute;top:4px;bottom:7px;left:4px;border-left:1px solid #cbb8e9;content:""}.sla-config-timeline-item{position:relative;display:flex;gap:10px;min-height:43px}.sla-config-timeline-item>i{z-index:1;width:9px;height:9px;flex:none;margin-top:3px;border:2px solid #a78bfa;border-radius:50%;background:#fff}.sla-config-timeline-item>div{display:flex;flex-direction:column;gap:4px}.sla-config-timeline-item strong{color:#7b4dc7;font:700 10px Manrope,sans-serif}.sla-config-timeline-item small{color:#a49aa9;font:9px "DM Sans",sans-serif}.sla-config-timeline-item.due>i{border-color:#8b5cf6}.sla-config-timeline-item.due strong{color:#7c3aed}.sla-config-timeline-item.overdue>i{border-color:#e05a5a}.sla-config-timeline-item.overdue strong{color:#db5d5d}.sla-config-timeline-item.overdue:before{display:none}.sla-document-detail .sla-reminder-schedule .sla-form-field{gap:7px}.sla-document-detail .sla-reminder-schedule .sla-form-field small{line-height:1.4}
@media (max-width:560px){.sla-reminder-schedule{padding:12px}.sla-reminder-chips button{padding:6px 8px}.sla-config-preview-card{padding:13px}.sla-preview-summary strong{max-width:62%}}

/* SLA policy slide-over editor */
.sla-document-layout{position:relative}.sla-side-panel{position:fixed;z-index:40;top:72px;right:18px;bottom:18px;width:min(430px,calc(100vw - 36px));overflow-y:auto;box-shadow:0 24px 70px rgba(48,26,81,.22);animation:sla-panel-in .22s cubic-bezier(.23,1,.32,1)}.sla-side-panel .panel-topline{position:sticky;top:-1px;z-index:2;padding-bottom:12px;background:rgba(255,255,255,.94);backdrop-filter:blur(10px)}.sla-panel-close{margin-left:auto;margin-right:8px}.sla-side-panel .panel-topline .sla-state{margin-left:0}@keyframes sla-panel-in{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
@media (max-width:720px){.sla-side-panel{top:46px;right:0;bottom:0;width:min(100vw,430px);border-radius:16px 0 0 0}.sla-side-panel:before{position:fixed;z-index:-1;top:0;right:100%;bottom:0;width:100vw;background:rgba(33,18,49,.22);content:""}.sla-side-panel .panel-topline{padding-top:14px}.sla-side-panel .sla-config-preview-card{margin-bottom:12px}}

        /* Canonical PATH page composition: full-width canvas and catalog, compact editorial rhythm. */
        .sla-config-view { width: 100%; max-width: 1380px !important; padding: 16px 18px 48px; margin: 0 auto; }
        .sla-config-hero { min-height: 146px; margin-bottom: 22px !important; padding: 30px 24px 28px !important; border: 1px solid #e6ddf5 !important; border-left: 2px solid #c4b5fd !important; border-radius: 12px !important; background: linear-gradient(118deg,#fbf9ff,#f4edff) !important; }
        .sla-config-hero h1 { margin: 9px 0 6px !important; font: 700 32px Manrope,sans-serif !important; color: #2c2537 !important; letter-spacing: -.045em !important; }
        .sla-config-hero p { margin: 0 !important; color: #83778b !important; font: 13px "DM Sans",sans-serif !important; }
        .sla-document-stats { grid-template-columns: repeat(4,minmax(0,1fr)) !important; gap: 12px !important; margin-bottom: 18px !important; }
        .sla-document-stats article { min-height: 116px; padding: 18px 17px !important; }
        .sla-document-layout { display: block !important; }
        .sla-document-list { width: 100% !important; max-width: none !important; }
        .sla-list-heading { min-height: 98px; padding: 21px 21px 17px !important; }
        .sla-policy-table-head, .sla-policy-row { grid-template-columns: minmax(250px,1.8fr) minmax(170px,1.25fr) 70px 90px 100px minmax(135px,1.1fr) 82px 72px !important; }
        .sla-policy-row { min-height: 72px; padding: 12px 18px !important; }
        .sla-row-edit { min-width: 62px; }
        .sla-list-footer { min-height: 58px; padding: 15px 18px !important; }
        @media (max-width: 1200px) { .sla-document-stats { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } .sla-policy-table-head, .sla-policy-row { grid-template-columns: minmax(220px,1.6fr) minmax(150px,1fr) 62px 82px 88px minmax(110px,1fr) 72px 68px !important; } }
        @media (max-width: 900px) { .sla-config-view { padding: 12px 12px 32px; } .sla-config-hero { min-height: 0; } .sla-document-stats { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } }
        @media (max-width: 560px) { .sla-config-view { padding: 8px 8px 28px; } .sla-document-stats { grid-template-columns: 1fr 1fr !important; gap: 8px !important; } .sla-document-stats article { min-height: 96px; padding: 13px !important; } }

        /* Final reference alignment: match the PATH canvas and keep the action in the eighth desktop column instead of creating a second row. */
        .sla-config-view { max-width: 1380px !important; padding: 24px 0 48px; font-family: "DM Sans", sans-serif; }
        .sla-config-hero { min-height: 106px; margin-bottom: 22px !important; }
        .sla-document-stats article { min-height: 104px; }
        .sla-document-layout { grid-template-columns: minmax(0, 912px) minmax(0, 1fr) !important; }
        .sla-document-list { width: 100%; max-width: 912px; }
        .sla-list-heading { min-height: 89px; }
        .sla-policy-row { min-height: 72px; }
        .sla-list-footer { min-height: 57px; }
        .sla-policy-table-head span, .sla-policy-row > span, .sla-policy-row strong { font-family: "DM Sans", sans-serif; }
        .sla-policy-table-head span { white-space: nowrap; }
        @media (max-width: 1200px) { .sla-document-layout { grid-template-columns: minmax(0, 1fr) !important; } .sla-document-list { max-width: none; } }
        @media (max-width: 560px) { .sla-config-view { padding: 18px 0 32px; } .sla-config-hero { min-height: 0; } }

        /* Final reference alignment: keep the action in the eighth desktop column instead of creating a second row. */
        @media (min-width: 901px) {
          .sla-policy-table-head, .sla-policy-row {
            grid-template-columns: minmax(210px, 1.55fr) minmax(120px, 1fr) 52px 64px 72px minmax(90px, .9fr) 70px 72px !important;
          }
          .sla-policy-row .sla-row-edit { grid-column: 8; grid-row: 1; justify-self: start; }
          .sla-policy-table-head span:last-child { text-align: left; }
        }
        @media (max-width: 900px) {
          .sla-policy-row .sla-row-edit { grid-column: 4; grid-row: 1 / span 2; justify-self: end; }
        }
      /* Canonical PATH reference wins over all earlier legacy overrides. */
        .sla-config-view { width: 100% !important; max-width: 1380px !important; padding: 16px 18px 48px !important; margin: 0 auto !important; }
        .sla-config-hero { min-height: 146px !important; padding: 30px 24px 28px !important; margin-bottom: 22px !important; }
        .sla-document-stats { grid-template-columns: repeat(4,minmax(0,1fr)) !important; gap: 12px !important; margin-bottom: 18px !important; }
        .sla-document-stats article { min-height: 116px !important; padding: 18px 17px !important; }
        .sla-document-layout { display: block !important; }
        .sla-document-list { width: 100% !important; max-width: none !important; }
        .sla-list-heading { min-height: 98px !important; padding: 21px 21px 17px !important; }
        .sla-policy-table-head, .sla-policy-row { grid-template-columns: minmax(250px,1.8fr) minmax(170px,1.25fr) 70px 90px 100px minmax(135px,1.1fr) 82px 72px !important; }
        .sla-policy-row { min-height: 72px !important; padding: 12px 18px !important; }
        .sla-policy-row .sla-row-edit { grid-column: 8 !important; grid-row: 1 !important; justify-self: start !important; }
        @media (max-width: 1200px) { .sla-document-stats { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } .sla-policy-table-head, .sla-policy-row { grid-template-columns: minmax(220px,1.6fr) minmax(150px,1fr) 62px 82px 88px minmax(110px,1fr) 72px 68px !important; } }
        @media (max-width: 900px) { .sla-config-view { padding: 12px 12px 32px !important; } .sla-config-hero { min-height: 0 !important; } .sla-document-stats { grid-template-columns: repeat(2,minmax(0,1fr)) !important; } .sla-policy-row .sla-row-edit { grid-column: 4 !important; grid-row: 1 / span 2 !important; justify-self: end !important; } }
        @media (max-width: 560px) { .sla-config-view { padding: 8px 8px 28px !important; } .sla-document-stats { grid-template-columns: 1fr 1fr !important; gap: 8px !important; } .sla-document-stats article { min-height: 96px !important; padding: 13px !important; } }
      /* PATH typography: Manrope for display/value hierarchy, DM Sans for interface copy. */
        .sla-config-view, .sla-config-view button, .sla-config-view select, .sla-config-view input, .sla-config-view textarea { font-family: "DM Sans", sans-serif !important; }
        .sla-config-view h1, .sla-config-view h2, .sla-config-view h3, .sla-config-view strong, .sla-config-view .sla-document-stats strong, .sla-config-view .sla-target-cell, .sla-config-view .sla-policy-escalation, .sla-config-view .sla-coverage-cell strong { font-family: Manrope, sans-serif !important; }
        .sla-config-hero h1 { font-weight: 700 !important; letter-spacing: -.045em !important; }
        .sla-list-heading h2 { font-family: Manrope, sans-serif !important; font-weight: 700 !important; }
        .sla-document-stats strong { font-weight: 700 !important; }
        .sla-policy-table-head, .sla-policy-table-head span { font-family: "DM Sans", sans-serif !important; font-weight: 800 !important; letter-spacing: .08em; }
        .sla-document-cell strong, .sla-selected-document strong, .sla-inheritance-banner strong, .sla-detail-setting strong { font-family: Manrope, sans-serif !important; font-weight: 700 !important; }
      /* Exact PATH hero alignment from the supplied reference. */
        .sla-config-hero { display:flex !important; align-items:center !important; justify-content:space-between !important; width:100% !important; min-height:148px !important; padding:29px 24px 27px !important; margin:0 0 22px !important; border:1px solid #e6ddf5 !important; border-radius:12px !important; background:linear-gradient(112deg,#fcfaff 0%,#f5efff 100%) !important; }
        .sla-config-hero > div:first-child { min-width:0; }
        .sla-config-hero .date-kicker { margin:0 0 13px !important; color:#8e8499 !important; font:700 10px/1 "DM Sans",sans-serif !important; letter-spacing:.11em !important; text-transform:uppercase !important; }
        .sla-config-hero .live-dot { width:6px !important; height:6px !important; box-shadow:0 0 0 4px #eee8ff !important; }
        .sla-config-hero h1 { margin:0 0 7px !important; color:#2c2537 !important; font:700 31px/1.12 Manrope,sans-serif !important; letter-spacing:-.045em !important; }
        .sla-config-hero p { margin:0 !important; color:#83778b !important; font:400 13px/1.4 "DM Sans",sans-serif !important; }
        .sla-policy-status { display:flex !important; align-items:center !important; gap:10px !important; min-width:240px !important; height:54px !important; padding:10px 13px !important; margin-left:24px !important; border:1px solid #ddd1ed !important; border-radius:9px !important; background:rgba(255,255,255,.82) !important; }
        .sla-policy-status > span:last-child { display:flex !important; flex-direction:column !important; gap:3px !important; }
        .sla-policy-status strong { color:#5f536c !important; font:700 10px/1.1 Manrope,sans-serif !important; }
        .sla-policy-status small { color:#9b91a3 !important; font:400 9px/1.2 "DM Sans",sans-serif !important; white-space:nowrap !important; }
        @media (max-width:700px) { .sla-config-hero { align-items:flex-start !important; flex-direction:column !important; gap:18px !important; padding:22px 18px !important; } .sla-policy-status { width:100% !important; min-width:0 !important; margin-left:0 !important; } .sla-config-hero h1 { font-size:26px !important; } }
      /* Final PATH sizing scale: match the canonical SLA Configuration page. */
        .sla-config-view { width:100% !important; max-width:1380px !important; margin:0 auto !important; padding:16px 0 48px !important; }
        .sla-config-hero { width:100% !important; min-height:148px !important; height:148px !important; padding:29px 24px 27px !important; margin:0 0 22px !important; }
        .sla-document-stats { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:12px !important; margin:0 0 18px !important; }
        .sla-document-stats article { min-height:116px !important; height:116px !important; padding:18px 17px !important; }
        .sla-document-layout { display:block !important; width:100% !important; }
        .sla-document-list { width:100% !important; max-width:none !important; }
        .sla-list-heading { min-height:98px !important; padding:22px 22px 18px !important; }
        .sla-policy-table-head, .sla-policy-row { grid-template-columns:minmax(250px,1.8fr) minmax(170px,1.25fr) 70px 90px 100px minmax(135px,1.1fr) 82px 72px !important; }
        .sla-policy-table-head { min-height:42px !important; padding:0 18px !important; }
        .sla-policy-row { min-height:72px !important; height:72px !important; padding:12px 18px !important; }
        .sla-list-footer { min-height:56px !important; padding:0 18px !important; }
        .sla-side-panel { width:min(430px,calc(100vw - 36px)) !important; }
        @media (max-width:1200px) { .sla-document-stats { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } .sla-policy-table-head,.sla-policy-row { grid-template-columns:minmax(220px,1.6fr) minmax(150px,1fr) 62px 82px 88px minmax(110px,1fr) 72px 68px !important; } }
        @media (max-width:900px) { .sla-config-view { padding:12px 12px 32px !important; } .sla-config-hero { height:auto !important; min-height:0 !important; } .sla-document-stats { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }
        @media (max-width:560px) { .sla-config-view { padding:8px 8px 28px !important; } .sla-document-stats { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:8px !important; } .sla-document-stats article { height:96px !important; min-height:96px !important; padding:13px !important; } .sla-list-heading { min-height:0 !important; padding:18px 14px !important; } .sla-policy-row { height:auto !important; min-height:70px !important; padding:11px 14px !important; } }
      /* Final PATH policy-catalog row treatment. */
        .sla-document-list { overflow:hidden !important; border-radius:12px !important; background:#fff !important; }
        .sla-list-heading { display:flex !important; align-items:center !important; justify-content:space-between !important; }
        .sla-list-heading h2 { margin:4px 0 5px !important; font:700 18px/1.15 Manrope,sans-serif !important; letter-spacing:-.025em !important; }
        .sla-list-heading p { margin:0 !important; font:400 10px/1.35 "DM Sans",sans-serif !important; color:#9b91a3 !important; }
        .sla-policy-table-head { align-items:center !important; border-top:1px solid #f0ebf5 !important; border-bottom:1px solid #f0ebf5 !important; background:#fcfaff !important; color:#93879b !important; font:800 9px/1 "DM Sans",sans-serif !important; letter-spacing:.09em !important; text-transform:uppercase !important; }
        .sla-policy-row { align-items:center !important; border-bottom:1px solid #f0edf3 !important; background:#fff !important; transition:background .16s ease,box-shadow .16s ease !important; }
        .sla-policy-row:hover { background:#fcfaff !important; }
        .sla-policy-row.selected { background:#fbf9ff !important; box-shadow:inset 3px 0 0 #8b5cf6 !important; }
        .sla-document-cell { display:flex !important; align-items:center !important; min-width:0 !important; gap:10px !important; }
        .sla-document-cell > span:last-child { display:flex !important; flex-direction:column !important; min-width:0 !important; gap:3px !important; }
        .sla-document-cell strong { overflow:hidden !important; color:#40364b !important; font:700 11px/1.15 Manrope,sans-serif !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
        .sla-document-cell small { overflow:hidden !important; color:#aaa0ae !important; font:400 9px/1.2 "DM Sans",sans-serif !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
        .sla-category-cell, .sla-policy-row > span:not(.sla-coverage-cell) { color:#93899b !important; font:400 10px/1.25 "DM Sans",sans-serif !important; }
        .sla-target-cell, .sla-policy-escalation { color:#65429b !important; font:700 11px/1 Manrope,sans-serif !important; }
        .sla-policy-reminder { font:700 10px/1 "DM Sans",sans-serif !important; }
        .sla-policy-reminder.enabled { color:#3d9270 !important; }
        .sla-policy-reminder.disabled { color:#9d96a2 !important; }
        .sla-coverage-cell { display:flex !important; flex-direction:column !important; align-items:flex-start !important; gap:3px !important; }
        .sla-coverage-cell strong { color:#62419a !important; font:700 14px/1 Manrope,sans-serif !important; }
        .sla-coverage-cell small { color:#aaa0ae !important; font:400 9px/1 "DM Sans",sans-serif !important; }
        .sla-row-edit { display:flex !important; flex-direction:column !important; align-items:center !important; justify-content:center !important; gap:4px !important; width:48px !important; padding:0 !important; border:0 !important; background:transparent !important; color:#332045 !important; font:500 12px/1 "DM Sans",sans-serif !important; cursor:pointer !important; }
        .sla-row-edit svg { color:#39204f !important; stroke-width:1.7 !important; }
        .sla-row-edit:hover { color:#7c3aed !important; }
        .sla-list-footer { border-top:0 !important; background:#fff !important; color:#a69dab !important; font:400 9px/1 "DM Sans",sans-serif !important; }
        .sla-list-footer button { min-width:62px !important; height:30px !important; border:1px solid #eeeaf1 !important; border-radius:7px !important; background:#fff !important; color:#a69dab !important; font:500 10px/1 "DM Sans",sans-serif !important; }
        @media (max-width:900px) { .sla-list-heading { align-items:flex-start !important; gap:14px !important; } .sla-policy-row { min-height:78px !important; height:auto !important; } }
        @media (max-width:560px) { .sla-list-heading { flex-direction:column !important; align-items:stretch !important; } .sla-policy-table-head { display:none !important; } .sla-policy-row { grid-template-columns:minmax(0,1fr) 58px 58px !important; min-height:84px !important; padding:14px !important; } .sla-policy-row .sla-document-cell { grid-column:1 !important; grid-row:1 / span 2 !important; } .sla-policy-row .sla-category-cell { grid-column:2 / span 2 !important; grid-row:2 !important; } .sla-policy-row .sla-target-cell { grid-column:2 !important; grid-row:1 !important; } .sla-policy-row .sla-policy-reminder, .sla-policy-row .sla-policy-escalation, .sla-policy-row .sla-coverage-cell { display:none !important; } .sla-policy-row .sla-row-edit { grid-column:3 !important; grid-row:1 / span 2 !important; justify-self:end !important; } }
      `}</style>

      <Sidebar activePage="sla-configuration" />

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar onLogout={handleLogout} />

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: COLORS.surface, overflowY: "auto", padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>

          {loading && (
            <div style={{ padding: "10px 14px", borderRadius: RADIUS, background: "#f5f3ff", color: "#6d28d9", fontSize: 12.5 }}>
              Loading SLA data…
            </div>
          )}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: RADIUS, background: "#fef2f2", color: "#991b1b", fontSize: 12.5 }}>
              {error}
            </div>
          )}
          {toast && (
            <div style={{ padding: "10px 14px", borderRadius: RADIUS, background: "#ecfdf5", color: "#065f46", fontSize: 12.5 }}>
              {toast}
            </div>
          )}

          <section className="sla-config-view">
            <section className="sla-config-hero">
              <div>
                <div className="date-kicker"><span className="live-dot" /> Document-type policies · inheritance rules</div>
                <h1>SLA configuration</h1>
                <p>Set the service level once per document type and apply it automatically to every matching submission.</p>
              </div>
              <div className="sla-policy-status">
                <span className="sla-status-icon"><Shield size={17} /></span>
                <span><strong>{rules.length} {rules.length === 1 ? "type policy" : "type policies"}</strong><small>Applied to matching submissions</small></span>
              </div>
            </section>

            <section className="sla-document-stats">
              {[
                ["Document types", rules.length, "Configured policies"],
                ["Documents covered", rules.reduce((total, r) => total + Number(docsActiveFor(r) || 0), 0), "Across active records"],
                ["Reminder coverage", rules.length ? `${Math.round((rules.filter(r => !!r.reminder_stage_hours).length / rules.length) * 100)}%` : "0%", "Policies with reminders"],
                ["Default fallback", String(rules.filter(r => r.status === "Fallback").length || 1).padStart(2, "0"), "For uncategorized documents"],
              ].map(([label, value, sub]) => (
                <article key={label}><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>
              ))}
            </section>

            <div className="sla-document-layout">
              <section className="sla-document-list panel-card">
                <div className="sla-list-heading">
                  <div>
                    <div className="section-kicker">Policy catalog</div>
                    <h2>SLA by document type <span>{filteredRules.length}</span></h2>
                    <p>Matching documents inherit the target, reminders, escalation, and owner shown below.</p>
                  </div>
                  <select value={activeOnlyFilter === "All Rules" ? "All categories" : activeOnlyFilter} onChange={e => { setActiveOnlyFilter(e.target.value === "All categories" ? "All Rules" : e.target.value); setCurrentPage(1); }} aria-label="Filter SLA policies">
                    <option>Active Only</option><option>Paused Only</option><option>All Rules</option>
                  </select>
                </div>
                <div className="sla-policy-table-head"><span>Document type</span><span>Category</span><span>Target</span><span>Reminder</span><span>Escalation</span><span>Owner</span><span>Coverage</span><span>Action</span></div>
                <div className="sla-policy-rows">
                  {pagedRules.map((r, i) => {
                    const reminder = String(r.reminder_stage_hours || "").split(",").filter(Boolean).length > 0;
                    const initials = (r.document_type || "SLA").split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase();
                    return <div key={r.id} className={`sla-policy-row ${showEditModal && r.id === selectedRuleId ? "selected" : ""}`}>
                      <div className="sla-document-cell"><span className="task-avatar violet">{initials}</span><span><strong>{r.document_type}</strong><small>{r.remarks || "Workflow policy"} · {ruleCode(r, i)}</small></span></div>
                      <span className="sla-category-cell">{r.category || "Document workflow"}</span>
                      <strong className="sla-target-cell">{r.turnaround_hours}h</strong>
                      <span className={`sla-policy-reminder ${reminder ? "enabled" : "disabled"}`}>{reminder ? "On" : "Off"}</span>
                      <span className="sla-policy-escalation">{r.escalation_hours}h</span>
                      <span className="sla-owner-cell">{r.reviewer_role || "Program Chair"}</span>
                      <span className="sla-coverage-cell"><strong>{docsActiveFor(r)}</strong><small>documents</small></span>
                      <button type="button" className="sla-row-edit" onClick={() => { selectRule(r.id); setShowEditModal(true); }} aria-label={`Edit ${r.document_type} SLA policy`}><Pencil size={13} /> Edit</button>
                    </div>;
                  })}
                  {!pagedRules.length && <div className="people-empty"><SlidersHorizontal size={22} /><strong>No policies match the selected filters</strong><span>Try changing the filters to view available policies.</span></div>}
                </div>
                <div className="sla-list-footer"><span>Showing {pagedRules.length} of {filteredRules.length} SLA policies</span><div><button type="button" disabled={safePage <= 1} onClick={() => setCurrentPage(page => Math.max(1, page - 1))}>Previous</button><button type="button" disabled={safePage >= totalPages} onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}>Next</button></div></div>
              </section>

              {showEditModal && ruleForm ? <aside className="sla-document-detail sla-side-panel panel-card">
                <div className="panel-topline"><div><div className="section-kicker">Selected policy</div><h3>Configure inheritance</h3></div><button type="button" className="icon-button compact sla-panel-close" onClick={() => setShowEditModal(false)} aria-label="Close SLA policy editor"><X size={15} /></button><span className={`sla-state ${ruleForm.status === "Active" ? "healthy" : "closed"}`}><i />{ruleForm.status}</span></div>
                <div className="sla-panel-body">
                  <div className="sla-selected-document"><span className="tracking-detail-avatar violet">{(ruleForm.docType || "SLA").split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{ruleForm.docType}</strong><small>{ruleForm.reviewerRole || "Program Chair"} · policy configuration</small></div></div>
                  <div className="sla-inheritance-banner"><Shield size={15} /><div><strong>Automatic inheritance</strong><small>New “{ruleForm.docType}” documents receive this policy at submission.</small></div></div>
                  <div className="sla-document-fields"><label className="sla-form-field"><span>Target window</span><div className="sla-input-with-unit"><input value={ruleForm.turnaroundHours} onChange={e => set("turnaroundHours", e.target.value)} type="number" min="1" /><span>hours</span></div></label><label className="sla-form-field"><span>Escalate after</span><div className="sla-input-with-unit"><input value={ruleForm.escalationHours} onChange={e => set("escalationHours", e.target.value)} type="number" min="1" /><span>hours</span></div></label></div>
                  <div className="sla-detail-setting"><span className="sla-setting-icon"><Clock size={15} /></span><span><strong>Reminder schedule</strong><small>{ruleForm.reminderStageDays ? `${ruleForm.reminderStageDays} hours before deadline` : "No reminder stages configured"}</small></span></div>
                  <label className="sla-form-field sla-owner-select"><span>Assigned reviewer role</span><select value={ruleForm.reviewerRole || ""} onChange={e => set("reviewerRole", e.target.value)}>{REVIEWER_ROLES.map(role => <option key={role}>{role}</option>)}</select></label>
                  <div className="sla-detail-facts"><div><span>Status</span><strong>{ruleForm.status}</strong></div><div><span>Coverage</span><strong>{selectedRuleId ? docsActiveFor(rules.find(r => r.id === selectedRuleId) || {}) : 0} active records</strong></div></div>
                  <div className="sla-config-preview-card">{renderPreviewCard()}</div>
                  <button type="button" className="primary-action sla-save-document" onClick={handleUpdateRule} disabled={saving}>{saving ? "Saving…" : "Save policy"} <CheckCircle2 size={14} /></button>
                  <div className="sla-preview-callout"><Shield size={15} /><div><strong>Applied to matching documents</strong><p>Reviewers see this policy’s target and escalation on every matching document.</p></div></div>
                </div>
              </aside> : null}
            </div>
          </section>
        </div>
      </div>

      {/* ── Recent Activity modal ── */}
      {showActivityModal && (
        <div
          onClick={() => setShowActivityModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 0, width: 480, maxWidth: "90vw", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(17,24,39,0.25)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f0f5", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock style={{ width: 15, height: 15, color: "#7c3aed" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>Recent Activity</p>
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>{activity.length} event{activity.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <X
                onClick={() => setShowActivityModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", padding: "10px 14px 16px" }}>
              {activity.map((a, i) => {
                const initials = (a.name || "?").split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 11, padding: "9px 8px",
                      borderBottom: i === activity.length - 1 ? "none" : "1px solid #f5f4f8",
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", background: "#ede9fe", color: "#6d28d9",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 800,
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.5, margin: 0 }}>
                        <strong style={{ color: "#111827" }}>{a.name}</strong> {a.action.toLowerCase()}{" "}
                        <span style={{ color: "#6d28d9", fontWeight: 700 }}>{a.target}</span>
                      </p>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}>
                      <Clock style={{ width: 10, height: 10 }} />
                      {timeAgo(a.created_at)}
                    </span>
                  </div>
                );
              })}
              {!activity.length && <p style={{ fontSize: 11.5, color: "#9ca3af", padding: "10px 8px" }}>No recent activity.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── System Alerts modal ── */}
      {showAlertsModal && (
        <div
          onClick={() => setShowAlertsModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 0, width: 480, maxWidth: "90vw", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(17,24,39,0.25)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f0f5", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AlertTriangle style={{ width: 15, height: 15, color: "#dc2626" }} />
                </div>
                <div>
                  <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>System Alerts</p>
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>{alerts.length} open alert{alerts.length === 1 ? "" : "s"}</p>
                </div>
              </div>
              <X
                onClick={() => setShowAlertsModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", padding: "10px 14px 16px" }}>
              {alerts.map((a, i) => {
                const critical = a.tier === "critical";
                const cleanTitle = a.title.replace(/^SLA Breach:\s*/i, "");
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 11, padding: "10px 8px",
                      borderBottom: i === alerts.length - 1 ? "none" : "1px solid #f5f4f8",
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: critical ? "#fef2f2" : "#fffbeb",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: critical ? "#dc2626" : "#d97706" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827", margin: 0 }}>{cleanTitle}</p>
                        <span style={{
                          fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.3,
                          padding: "1.5px 6px", borderRadius: 20,
                          color: critical ? "#991b1b" : "#92400e",
                          background: critical ? "#fee2e2" : "#fef3c7",
                        }}>
                          {critical ? "Critical" : "Warning"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11.5, color: "#6b7280", marginTop: 4, marginBottom: 0, lineHeight: 1.5 }}>{a.message}</p>
                    </div>
                  </div>
                );
              })}
              {!alerts.length && <p style={{ fontSize: 11.5, color: "#9ca3af", padding: "10px 8px" }}>No open alerts.</p>}
            </div>
          </div>
        </div>
      )}


      {/* ── Create SLA Rule modal ── */}
      {showCreateModal && createForm && (
        <div
          onClick={() => !creating && setShowCreateModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: 22, width: 420, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto", border: "1px solid #cbc3d7" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827" }}>Create SLA Rule</p>
              <X
                onClick={() => !creating && setShowCreateModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Document Type</label>
                <select
                  value={createForm.docType}
                  onChange={e => setCreate("docType", e.target.value)}
                  disabled={loadingDocTypes || documentTypes.length === 0}
                  style={{ ...selStyle, color: createForm.docType ? "#111827" : "#9ca3af" }}
                >
                  <option value="" disabled hidden>
                    {loadingDocTypes ? "Loading document types…" : "Select a document type"}
                  </option>
                  {documentTypes.map(dt => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
                {docTypesError && (
                  <p style={{ fontSize: 10.5, color: "#dc2626", marginTop: 5 }}>
                    Couldn't load document types: {docTypesError}
                  </p>
                )}
                {!loadingDocTypes && !docTypesError && documentTypes.length === 0 && (
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 5 }}>
                    No active document types found. Add one in Document Categories first.
                  </p>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Rule Priority</label>
                <select value={createForm.priority} onChange={e => setCreate("priority", e.target.value)} style={selStyle}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Assigned Reviewer Role</label>
                <select
                  value={createForm.reviewerRole}
                  onChange={e => setCreate("reviewerRole", e.target.value)}
                  style={{ ...selStyle, color: createForm.reviewerRole ? "#111827" : "#9ca3af" }}
                >
                  <option value="" disabled hidden>Select a reviewer role</option>
                  {REVIEWER_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Turnaround Time (Hours)</label>
                <input type="number" value={createForm.turnaroundHours} onChange={e => setCreate("turnaroundHours", e.target.value)} style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Escalation Trigger (Hours After Due)</label>
                <input type="number" value={createForm.escalationHours} onChange={e => setCreate("escalationHours", e.target.value)} style={inpStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Reminder Hours Before Deadline</label>
                <HourChipsInput
                  value={createForm.reminderStageDays}
                  onChange={v => setCreate("reminderStageDays", v)}
                />
                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                  Hours before the deadline to remind faculty and the reviewer. "Due today" always fires too.
                </p>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Overdue Reminder Interval (Hours)</label>
                <input
                  type="number"
                  min={1}
                  value={createForm.overdueIntervalDays}
                  onChange={e => setCreate("overdueIntervalDays", e.target.value)}
                  style={inpStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Internal Remarks</label>
                <textarea value={createForm.remarks} onChange={e => setCreate("remarks", e.target.value)} rows={3} style={{ ...inpStyle, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  disabled={creating}
                  onClick={handleCreateRule}
                  style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: creating ? "default" : "pointer", opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? "Creating…" : "Create Rule"}
                </button>
                <button
                  disabled={creating}
                  onClick={() => setShowCreateModal(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inpStyle = {
  width: "100%", marginTop: 5, padding: "9px 11px", borderRadius: 6,
  border: "1px solid #cbc3d7", background: "#fcf8ff", fontSize: 13,
  fontFamily: "'DM Sans', sans-serif", color: "#181445", outline: "none", boxSizing: "border-box",
};

const selStyle = { ...inpStyle, cursor: "pointer" };

// ── Edit-drawer card styles (right-side "Edit SLA Configuration" drawer) ──
const drawerCardStyle = {
  background: "#fff", border: "1px solid #cbc3d7", borderRadius: 16,
  padding: 16, boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
};

const drawerCardTitleStyle = {
  fontSize: 11.5, fontWeight: 700, color: "#181445", marginBottom: 12,
};

const drawerLabelStyle = {
  fontSize: 11, fontWeight: 600, color: "#6b7280",
};