import { useState, useEffect, useCallback } from "react";
import {
  Bell, Search, Plus, Download, Filter, MoreHorizontal, ChevronRight,
  TrendingUp, TrendingDown, Clock, Shield, DollarSign, GraduationCap,
  AlertTriangle, CheckCircle2, Zap, Users, UserCheck, Building2,
  Layers, Gauge, X, Info, Mail, Smartphone, MonitorSmartphone,
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

// ── Sidebar Item ─────────────────────────────────────────────────────────
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

const PRIORITY_CFG = {
  High:   { bg: "#ede9fe", color: "#6d28d9" },
  Medium: { bg: "#f3f4f6", color: "#4b5563" },
  Low:    { bg: "#ecfdf5", color: "#059669" },
};

const STAGES = ["Submission", "Faculty Review", "Program Chair", "Final Approval", "Completed"];
const REVIEWER_ROLES = ["Program Chair", "Admin", "Faculty"];

// ── Small building blocks ───────────────────────────────────────────────
function PriorityPill({ priority }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.Medium;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, letterSpacing: 0.3, textTransform: "uppercase" }}>
      {priority}
    </span>
  );
}

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
  const [createForm, setCreateForm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loadingDocTypes, setLoadingDocTypes] = useState(true);
  const [docTypesError, setDocTypesError] = useState("");

  const set = (k, v) => setRuleForm(f => ({ ...f, [k]: v }));
  const setCreate = (k, v) => setCreateForm(f => ({ ...f, [k]: v }));

  const emptyCreateForm = () => ({
    docType: "",
    priority: "Medium",
    procTime: 5,
    procUnit: "Days",
    reviewerRole: "",
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
          processingTime: Number(createForm.procTime),
          processingUnit: createForm.procUnit,
          reviewerRole: createForm.reviewerRole,
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
      procTime: r.processing_time,
      procUnit: r.processing_unit,
      reviewerRole: r.reviewer_role,
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
          processingTime: Number(ruleForm.procTime),
          processingUnit: ruleForm.procUnit,
          reviewerRole: ruleForm.reviewerRole,
          escalationHours: Number(ruleForm.escalationHours),
          remarks: ruleForm.remarks,
        }),
      });
      setToast("Rule updated.");
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

  async function addRecipientRole() {
    const roleName = window.prompt("Role/team name (e.g. Registrar's Office):");
    if (!roleName) return;
    const email = window.prompt("Notification email for this role:");
    try {
      await apiFetch("/sla/escalation-settings/recipients", {
        method: "POST",
        body: JSON.stringify({ roleName, email }),
      });
      await loadAll();
    } catch (err) {
      setError(err.message || "Failed to add recipient.");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 200, background: "#1e1b2e", color: "#c8c4e0",
        display: "flex", flexDirection: "column", flexShrink: 0,
        minHeight: "100vh", position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 28, height: 28, background: "#7c3aed", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <Icon.Shield />
          </div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "white", letterSpacing: 2 }}>PATH</span>
        </div>

        <div style={{ padding: "8px 0", flex: 1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => {}} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>

          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Categories />} label="Document Categories" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => {}} />
          <SbItem icon={<Icon.SLA />} label="SLA Configuration" active={true} onClick={() => {}} />
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => {}} />
        </div>

        <div style={{ paddingTop: 10, borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />} label="Help & Support" onClick={() => {}} />
          <SbItem icon={<Icon.Logout />} label="Logout" onClick={() => {}} />
        </div>
      </div>

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
            {stats && [
              { label: "Total SLA Rules", value: stats.totalRules, icon: Shield, color: "#7c3aed" },
              { label: "Active Policies", value: stats.activePolicies, icon: CheckCircle2, color: "#059669" },
              { label: "Open Alerts", value: stats.overdueRequests, icon: AlertTriangle, color: "#dc2626" },
              { label: "Avg. Processing Time", value: `${stats.avgProcessingDays}d`, icon: Clock, color: "#0284c7" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon style={{ width: 13, height: 13, color: s.color }} />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Row: Active rules + right column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

            {/* Active SLA Rules table */}
            <SectionCard title="Active SLA Rules" subtitle="Definitions for document turnaround and automatic escalation. Click a row to edit below.">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f0f0f3" }}>
                      {["Document Type", "Proc. Time", "Priority", "Escalation", "Owner Role", "Status"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0 10px 10px 0", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((r, i) => (
                      <tr
                        key={r.id}
                        onClick={() => selectRule(r.id)}
                        style={{
                          borderBottom: i < rules.length - 1 ? "1px solid #f5f5f8" : "none",
                          cursor: "pointer",
                          background: r.id === selectedRuleId ? "#faf5ff" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px 10px 12px 0", fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{r.document_type}</td>
                        <td style={{ padding: "12px 10px", fontSize: 12, color: "#4b5563" }}>{r.processing_time} {r.processing_unit}</td>
                        <td style={{ padding: "12px 10px" }}><PriorityPill priority={r.priority} /></td>
                        <td style={{ padding: "12px 10px", fontSize: 11.5, color: "#9ca3af" }}>{r.escalation_hours}h Overdue</td>
                        <td style={{ padding: "12px 10px", fontSize: 12, color: "#4b5563" }}>{r.reviewer_role}</td>
                        <td style={{ padding: "12px 10px" }}><StatusDot status={r.status} /></td>
                      </tr>
                    ))}
                    {!rules.length && (
                      <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No SLA rules yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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

          {/* Row: Configure rule + workflow visualizer + escalation settings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16 }}>

            {/* Configure SLA Rule */}
            <SectionCard title="Configure SLA Rule" subtitle="Edit parameters for the selected document category.">
              {ruleForm ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Document Type</label>
                    <input value={ruleForm.docType} onChange={e => set("docType", e.target.value)} style={inpStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Rule Priority</label>
                    <select value={ruleForm.priority} onChange={e => set("priority", e.target.value)} style={selStyle}>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Processing Time</label>
                      <input type="number" value={ruleForm.procTime} onChange={e => set("procTime", e.target.value)} style={inpStyle} />
                    </div>
                    <div style={{ width: 90 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>&nbsp;</label>
                      <select value={ruleForm.procUnit} onChange={e => set("procUnit", e.target.value)} style={selStyle}>
                        <option>Days</option><option>Hours</option>
                      </select>
                    </div>
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
              )}
            </SectionCard>

            {/* Workflow visualizer */}
            <SectionCard title="Workflow Visualizer" subtitle="Current stage progression for this rule type." icon={Info}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 4px 8px" }}>
                {STAGES.map((s, i) => {
                  const state = i < 2 ? "done" : i === 2 ? "current" : "todo";
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", flex: i < STAGES.length - 1 ? 1 : "none" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: state === "todo" ? "#f3f4f6" : "#7c3aed",
                          border: state === "current" ? "3px solid #ddd6fe" : "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {state === "done" && <CheckCircle2 style={{ width: 13, height: 13, color: "#fff" }} />}
                          {state === "current" && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: state === "todo" ? "#9ca3af" : "#374151", whiteSpace: "nowrap" }}>{s}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: i < 2 ? "#7c3aed" : "#f3f4f6", margin: "0 4px 20px" }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 10.5, color: "#9ca3af" }}>
                Note: stage progress here is illustrative until this rule is linked to your actual workflow engine.
              </p>
            </SectionCard>

            {/* Escalation settings */}
            <SectionCard title="Escalation Settings" subtitle="Manage automated actions for overdue requests.">
              {escalation && (
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
                      { key: "email", label: "Email Primary Stakeholders", field: "notify_email" },
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

                  <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Default Recipients</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {(escalation.recipients || []).map(r => (
                      <span key={r.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#f5f3ff", color: "#6d28d9" }}>
                        <Users style={{ width: 11, height: 11 }} /> {r.role_name}
                      </span>
                    ))}
                    <a href="#" onClick={(e) => { e.preventDefault(); addRecipientRole(); }} style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>+ Add Role</a>
                  </div>
                </>
              )}
            </SectionCard>
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
            style={{ background: "#fff", borderRadius: 14, padding: 22, width: 460, maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
              <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827" }}>Recent Activity ({activity.length})</p>
              <X
                onClick={() => setShowActivityModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
              {activity.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <p style={{ fontSize: 12, color: "#374151" }}>
                    <strong style={{ color: "#111827" }}>{a.name}</strong> {a.action.toLowerCase()} <span style={{ color: "#7c3aed", fontWeight: 600 }}>{a.target}</span>
                  </p>
                  <span style={{ fontSize: 10.5, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>{timeAgo(a.created_at)}</span>
                </div>
              ))}
              {!activity.length && <p style={{ fontSize: 11.5, color: "#9ca3af" }}>No recent activity.</p>}
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
            style={{ background: "#fff", borderRadius: 14, padding: 22, width: 460, maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: "#7c3aed" }} />
                <p style={{ fontSize: 14.5, fontWeight: 800, color: "#111827" }}>System Alerts ({alerts.length})</p>
              </div>
              <X
                onClick={() => setShowAlertsModal(false)}
                style={{ width: 16, height: 16, color: "#9ca3af", cursor: "pointer" }}
              />
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
              {alerts.map(a => {
                const critical = a.tier === "critical";
                return (
                  <div key={a.id} style={{ padding: "10px 12px", borderRadius: 10, background: critical ? "#fef2f2" : "#fffbeb", borderLeft: `3px solid ${critical ? "#fecaca" : "#fde68a"}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: critical ? "#991b1b" : "#92400e" }}>{a.title}</p>
                    <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                  </div>
                );
              })}
              {!alerts.length && <p style={{ fontSize: 11.5, color: "#9ca3af" }}>No open alerts.</p>}
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
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Processing Time</label>
                  <input type="number" value={createForm.procTime} onChange={e => setCreate("procTime", e.target.value)} style={inpStyle} />
                </div>
                <div style={{ width: 90 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>&nbsp;</label>
                  <select value={createForm.procUnit} onChange={e => setCreate("procUnit", e.target.value)} style={selStyle}>
                    <option>Days</option><option>Hours</option>
                  </select>
                </div>
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
