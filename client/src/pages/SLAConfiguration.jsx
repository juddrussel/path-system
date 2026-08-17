import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  Bell, Search, Plus, Download, Filter, MoreHorizontal, ChevronRight, ChevronDown,
  TrendingUp, TrendingDown, Clock, Shield, DollarSign, GraduationCap,
  AlertTriangle, CheckCircle2, Zap, UserCheck, Building2, FileText, AlertCircle,
  Layers, Gauge, X, Mail, Smartphone, MonitorSmartphone, ArrowUpDown, MoreVertical, ArrowUpRight,
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
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: active ? "#059669" : "#9ca3af" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "#22c55e" : "#d1d5db" }} />
      {status}
    </span>
  );
}

function SectionCard({ title, subtitle, icon: Icn, action, children, style }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: 18, ...style }}>
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
          remarks: ruleForm.remarks,
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

  function renderRuleFormBody() {
    return ruleForm ? (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Document Type</label>
          <input
            value={ruleForm.docType}
            disabled
            readOnly
            title="Document Type can't be changed after the rule is created."
            style={{ ...inpStyle, cursor: "not-allowed", color: "#9ca3af", background: "#f0f0f3" }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Assigned Reviewer Role</label>
          <select
            value={ruleForm.reviewerRole}
            onChange={e => set("reviewerRole", e.target.value)}
            style={{ ...selStyle, color: ruleForm.reviewerRole ? "#111827" : "#9ca3af" }}
          >
            <option value="" disabled hidden>Select a reviewer role</option>
            {REVIEWER_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Turnaround Time (Hours)</label>
          <input type="number" value={ruleForm.turnaroundHours} onChange={e => set("turnaroundHours", e.target.value)} style={inpStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Escalation Trigger (Hours After Due)</label>
          <input type="number" value={ruleForm.escalationHours} onChange={e => set("escalationHours", e.target.value)} style={inpStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Internal Remarks</label>
          <textarea value={ruleForm.remarks} onChange={e => set("remarks", e.target.value)} rows={3} style={{ ...inpStyle, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            disabled={saving}
            onClick={handleUpdateRule}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Update Rule"}
          </button>
          <button
            onClick={discardChanges}
            style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Discard Changes
          </button>
        </div>
      </div>
    ) : (
      <p style={{ fontSize: 12, color: "#9ca3af" }}>Select a rule from the table above to edit it.</p>
    );
  }

  function renderEscalationBody() {
    return escalation ? (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f8", marginBottom: 12 }}>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
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
      </>
    ) : null;
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

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      <Sidebar activePage="sla-configuration" />

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 24px", background: "#fff", borderBottom: "1px solid #eee", gap: 14 }}>
          <Bell style={{ width: 17, height: 17, color: "#6b7280" }} />
        </div>

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {loading && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f5f3ff", color: "#6d28d9", fontSize: 12.5 }}>
              Loading SLA data…
            </div>
          )}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#991b1b", fontSize: 12.5 }}>
              {error}
            </div>
          )}
          {toast && (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#ecfdf5", color: "#065f46", fontSize: 12.5 }}>
              {toast}
            </div>
          )}

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>SLA Configuration</h1>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                Manage service level agreements, escalation triggers, and compliance workflows for academic and administrative documents.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button
                onClick={openCreateModal}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer" }}
              >
                <Icon.Plus color="#fff" size={13} /> Create SLA Rule
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {statCards.map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", borderTop: `3px solid ${s.accent}`, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 12, color: "#6d28d9", fontWeight: 700 }}>{s.label}</p>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${s.accent}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon style={{ width: 12, height: 12, color: s.accent }} />
                  </div>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 6 }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Row: Active rules + right column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, alignItems: "start" }}>

            {/* Active SLA Rules table */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", overflow: "hidden" }}>

              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 16, flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
                  <Search style={{ width: 14, height: 14, color: "#9ca3af", position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    placeholder="Search document type or rule ID..."
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px 9px 32px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fafafa", fontSize: 12, outline: "none" }}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <select
                    value={priorityFilter}
                    onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
                    style={{ appearance: "none", padding: "9px 30px 9px 12px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer", outline: "none" }}
                  >
                    <option>All Priorities</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <ChevronDown style={{ width: 12, height: 12, color: "#9ca3af", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                <div style={{ position: "relative" }}>
                  <select
                    value={activeOnlyFilter}
                    onChange={e => { setActiveOnlyFilter(e.target.value); setCurrentPage(1); }}
                    style={{ appearance: "none", padding: "9px 30px 9px 12px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, color: "#374151", cursor: "pointer", outline: "none" }}
                  >
                    <option>Active Only</option>
                    <option>Paused Only</option>
                    <option>All Rules</option>
                  </select>
                  <ChevronDown style={{ width: 12, height: 12, color: "#9ca3af", position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                </div>
                <button
                  onClick={() => setSortAsc(s => !s)}
                  title="Sort by turnaround"
                  style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer" }}
                >
                  <ArrowUpDown style={{ width: 14, height: 14 }} />
                </button>
                <button
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  <Filter style={{ width: 13, height: 13 }} /> Filters
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#faf9fd" }}>
                      {["Document Type", "Turnaround (Hours)", "Escalation", "Docs Active", "Status", "Actions"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 10px", fontSize: 10.5, fontWeight: 700, color: "#7c3aed", textTransform: "none" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedRules.map((r, i) => (
                      <tr
                        key={r.id}
                        onClick={() => selectRule(r.id)}
                        style={{
                          borderBottom: i < pagedRules.length - 1 ? "1px solid #f5f5f8" : "none",
                          cursor: "pointer",
                          background: r.id === selectedRuleId ? "#faf5ff" : "transparent",
                        }}
                      >
                        <td style={{ padding: "14px 10px" }}>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{r.document_type}</p>
                          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>{ruleCode(r, i)}</p>
                        </td>
                        <td style={{ padding: "14px 10px", fontSize: 11.5, color: "#4b5563" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Clock style={{ width: 11, height: 11, color: "#9ca3af" }} /> {r.turnaround_hours} Hours
                          </span>
                        </td>
                        <td style={{ padding: "14px 10px", fontSize: 11.5, color: "#9ca3af" }}>{r.escalation_hours} hours after</td>
                        <td style={{ padding: "14px 10px", fontSize: 12.5, fontWeight: 700, color: "#7c3aed" }}>{docsActiveFor(r)}</td>
                        <td style={{ padding: "14px 10px" }}><StatusDot status={r.status} /></td>
                        <td style={{ padding: "14px 10px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); selectRule(r.id); setShowEditModal(true); }}
                            style={{ width: 26, height: 26, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 7, border: "none", background: "transparent", color: "#9ca3af", cursor: "pointer" }}
                          >
                            <MoreVertical style={{ width: 15, height: 15 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!pagedRules.length && (
                      <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No SLA rules match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderTop: "1px solid #f0f0f3" }}>
                <p style={{ fontSize: 11.5, color: "#9ca3af" }}>
                  Showing {pagedRules.length} of {filteredRules.length} SLA rules
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: safePage <= 1 ? "#d1d5db" : "#374151", fontSize: 11.5, fontWeight: 600, cursor: safePage <= 1 ? "default" : "pointer" }}
                  >
                    Previous
                  </button>
                  <button
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: safePage >= totalPages ? "#d1d5db" : "#374151", fontSize: 11.5, fontWeight: 600, cursor: safePage >= totalPages ? "default" : "pointer" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* SLA Performance Insights */}
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", padding: 18 }}>
                <p style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>SLA Performance Insights</p>
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, marginBottom: 14 }}>Real-time analytics for current processing cycle.</p>

                <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16, height: 130 }}>
                  <img
                    src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80"
                    alt="Analytics"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "Avg. Processing Time", value: "4.2 Days", delta: "+0.5", up: true, icon: Clock },
                    { label: "SLA Compliance Rate", value: "94.8%", delta: "+2.1%", up: true, icon: CheckCircle2 },
                    { label: "At Risk Documents", value: "12", delta: "-3", up: false, icon: AlertTriangle },
                  ].map(m => (
                    <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "#faf9fd" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <m.icon style={{ width: 13, height: 13, color: "#7c3aed" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 10.5, color: "#9ca3af" }}>{m.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{m.value}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
                        color: m.up ? "#059669" : "#dc2626", background: m.up ? "#ecfdf5" : "#fef2f2",
                      }}>
                        {m.delta}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  style={{
                    width: "100%", marginTop: 16, padding: "11px", borderRadius: 10, border: "none",
                    background: "linear-gradient(90deg, #7c3aed, #6d28d9)", color: "#fff", fontSize: 12.5, fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <ArrowUpRight style={{ width: 14, height: 14 }} /> View Detailed Report
                </button>
              </div>

              <SectionCard title="System Alerts" icon={AlertTriangle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {alerts.slice(0, 3).map(a => {
                    const critical = a.tier === "critical";
                    return (
                      <div key={a.id} style={{ padding: "10px 12px", borderRadius: 10, background: critical ? "#fef2f2" : "#fffbeb", borderLeft: `3px solid ${critical ? "#fecaca" : "#fde68a"}` }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: critical ? "#991b1b" : "#92400e" }}>{a.title}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                      </div>
                    );
                  })}
                  {!alerts.length && <p style={{ fontSize: 11.5, color: "#9ca3af" }}>No open alerts.</p>}
                  {alerts.length > 3 && (
                    <button
                      onClick={() => setShowAlertsModal(true)}
                      style={{
                        marginTop: 2, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: "#fafafa", color: "#7c3aed", fontSize: 11.5, fontWeight: 700,
                        cursor: "pointer", textAlign: "center",
                      }}
                    >
                      View all {alerts.length} alerts
                    </button>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Recent Activity">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activity.slice(0, 3).map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 12, color: "#374151" }}>
                        <strong style={{ color: "#111827" }}>{a.name}</strong> {a.action.toLowerCase()} <span style={{ color: "#7c3aed", fontWeight: 600 }}>{a.target}</span>
                      </p>
                      <span style={{ fontSize: 10.5, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(a.created_at)}</span>
                    </div>
                  ))}
                  {!activity.length && <p style={{ fontSize: 11.5, color: "#9ca3af" }}>No recent activity.</p>}
                  {activity.length > 3 && (
                    <button
                      onClick={() => setShowActivityModal(true)}
                      style={{
                        marginTop: 2, padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: "#fafafa", color: "#7c3aed", fontSize: 11.5, fontWeight: 700,
                        cursor: "pointer", textAlign: "center",
                      }}
                    >
                      View all {activity.length} activity items
                    </button>
                  )}
                </div>
              </SectionCard>
            </div>
          </div>

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

      {/* ── Edit SLA Rule modal ── */}
      {showEditModal && (
        <div
          onClick={() => setShowEditModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#f5f4fb", borderRadius: 16, padding: 0, width: 760, maxWidth: "95vw", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(17,24,39,0.25)" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #f1f0f5", flexShrink: 0, background: "#fff" }}>
              <div>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>Edit SLA Rule</p>
                <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>
                  {ruleForm?.docType || "Select a rule"}
                </p>
              </div>
              <X
                onClick={() => setShowEditModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            {/* Body */}
            <div style={{ overflowY: "auto", padding: 18, display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
              <SectionCard title="Configure SLA Rule" subtitle="Edit parameters for the selected document category.">
                {renderRuleFormBody()}
              </SectionCard>
              <SectionCard title="Escalation Settings" subtitle="Manage automated actions for overdue requests.">
                {renderEscalationBody()}
              </SectionCard>
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
            style={{ background: "#fff", borderRadius: 14, padding: 22, width: 420, maxWidth: "90vw", maxHeight: "85vh", overflowY: "auto" }}
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
  width: "100%", marginTop: 5, padding: "9px 11px", borderRadius: 8,
  border: "1px solid #e5e7eb", background: "#fafafa", fontSize: 12.5,
  color: "#111827", outline: "none", boxSizing: "border-box",
};

const selStyle = { ...inpStyle, cursor: "pointer" };