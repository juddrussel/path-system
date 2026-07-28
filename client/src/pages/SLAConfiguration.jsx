import { useState } from "react";
import {
  Bell, Search, Plus, Download, Filter, MoreHorizontal, ChevronRight,
  TrendingUp, TrendingDown, Clock, Shield, DollarSign, GraduationCap,
  AlertTriangle, CheckCircle2, Zap, Users, UserCheck, Building2,
  Layers, Gauge, X, Info, Mail, Smartphone, MonitorSmartphone,
} from "lucide-react";

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

// ── Data ─────────────────────────────────────────────────────────────────
const STATS = [
  { label: "Total SLA Rules", value: "48", delta: "+3.2%", up: true, icon: Shield, color: "#7c3aed" },
  { label: "Active Policies", value: "42", delta: "+2.1%", up: true, icon: CheckCircle2, color: "#059669" },
  { label: "Overdue Requests", value: "12", delta: "-10.5%", up: false, icon: AlertTriangle, color: "#dc2626" },
  { label: "Avg. Processing Time", value: "8.4d", delta: "+0.4d", up: true, icon: Clock, color: "#0284c7" },
];

const PRIORITY_CFG = {
  High:     { bg: "#ede9fe", color: "#6d28d9" },
  Critical: { bg: "#1f2937", color: "#fff" },
  Medium:   { bg: "#f3f4f6", color: "#4b5563" },
};

const RULES = [
  { type: "Tuition Refund Policy",     proc: "5 Days",  priority: "High",     escalation: "24h Overdue",     owner: "Finance Officer",       status: "Active" },
  { type: "Research Grant Submission", proc: "14 Days", priority: "Critical", escalation: "48h Overdue",     owner: "Dean of Research",      status: "Active" },
  { type: "Thesis Defense Timeline",   proc: "30 Days", priority: "Medium",   escalation: "7 Days Overdue",  owner: "Program Coordinator",   status: "Inactive" },
  { type: "Grade Appeal Processing",   proc: "7 Days",  priority: "High",     escalation: "12h Overdue",     owner: "Department Head",       status: "Active" },
  { type: "Faculty Recruitment",       proc: "21 Days", priority: "Medium",   escalation: "3 Days Overdue",  owner: "HR Director",           status: "Active" },
];

const EFFICIENCY_LEADERS = [
  { label: "Fastest Completion", name: "Admissions Processing Dept.", value: "2.1 Days", color: "#059669" },
  { label: "Slowest Completion", name: "Graduate Thesis Committee",   value: "28.6 Days", color: "#dc2626" },
  { label: "Highest Compliance", name: "Finance Tuition Services",    value: "99.2%",     color: "#7c3aed" },
];

const ALERTS = [
  { tier: "critical", title: "Critical Overdue", message: "Rule #102 (Research Grant) has reached the 48h overdue limit.", action: "Review Rule" },
  { tier: "warning",  title: "Assigned Role Missing", message: "Faculty Recruitment rule has no assigned Program Chair.", action: "Assign Role" },
];

const ACTIVITY = [
  { name: "Elena Thorne",  action: "Updated",   target: "Tuition Policy",     time: "20m ago" },
  { name: "Admin System",  action: "Escalated", target: "Grant #822",         time: "20m ago" },
  { name: "Marcus Vane",   action: "Created",   target: "New Hire Policy",    time: "Yesterday" },
  { name: "Elena Thorne",  action: "Paused",    target: "Legacy Appeals",     time: "2 days ago" },
];

const STAGES = ["Submission", "Faculty Review", "Program Chair", "Final Approval", "Completed"];

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

// ── Main component ──────────────────────────────────────────────────────
export default function SLAConfiguration() {
  const [ruleForm, setRuleForm] = useState({
    docType: "Research Grant Submission",
    priority: "Critical",
    procTime: 14,
    reviewerRole: "Dean of Faculty",
    escalationHours: 48,
    remarks: "Standard research grant review cycle. Requires Dean's sign-off before final routing.",
  });
  const [autoEscalation, setAutoEscalation] = useState(true);
  const [reminders, setReminders] = useState({ email: true, dashboard: true, sms: false });

  const set = (k, v) => setRuleForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');`}</style>

      {/* ── Sidebar (from Dashboard.jsx) ── */}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>

        {/* ── Topbar (from Dashboard.jsx pattern) ── */}
        <div style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 20px", borderBottom: "0.5px solid #e5e7eb", background: "#fff", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 12px", color: "#9ca3af" }}>
            <Icon.Search />
            <input
              type="text"
              placeholder="Search SLA rules, roles, document types..."
              style={{ border: "none", background: "transparent", outline: "none", fontSize: 12, color: "#374151", width: "100%", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <button style={{ position: "relative", width: 34, height: 34, borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell style={{ width: 15, height: 15, color: "#6b7280" }} />
            <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
          </button>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>ET</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>SLA Configuration</h1>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                Manage service level agreements, escalation triggers, and compliance workflows for academic and administrative documents.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", cursor: "pointer" }}>
                Save Changes
              </button>
              <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer" }}>
                <Icon.Plus color="#fff" size={13} /> Create SLA Rule
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ background: "#fff", borderRadius: 14, border: "1px solid rgba(0,0,0,0.06)", padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 11.5, color: "#6b7280", fontWeight: 600 }}>{s.label}</p>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon style={{ width: 13, height: 13, color: s.color }} />
                  </div>
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{s.value}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                  {s.up ? <TrendingUp style={{ width: 12, height: 12, color: s.label === "Overdue Requests" ? "#dc2626" : "#059669" }} /> : <TrendingDown style={{ width: 12, height: 12, color: "#059669" }} />}
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.label === "Overdue Requests" ? "#059669" : (s.up ? "#059669" : "#dc2626") }}>{s.delta}</span>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Row: Active rules + right column */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

            {/* Active SLA Rules table */}
            <SectionCard
              title="Active SLA Rules"
              subtitle="Definitions for document turnaround and automatic escalation."
              action={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px" }}>
                    <Search style={{ width: 12, height: 12, color: "#9ca3af" }} />
                    <input placeholder="Filter rules..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 11, width: 110 }} />
                  </div>
                  <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Filter style={{ width: 13, height: 13, color: "#6b7280" }} />
                  </button>
                </div>
              }
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f0f0f3" }}>
                      {["Document Type", "Proc. Time", "Priority", "Escalation", "Owner Role", "Status", ""].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "0 10px 10px 0", fontSize: 10.5, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RULES.map((r, i) => (
                      <tr key={r.type} style={{ borderBottom: i < RULES.length - 1 ? "1px solid #f5f5f8" : "none" }}>
                        <td style={{ padding: "12px 10px 12px 0", fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{r.type}</td>
                        <td style={{ padding: "12px 10px", fontSize: 12, color: "#4b5563" }}>{r.proc}</td>
                        <td style={{ padding: "12px 10px" }}><PriorityPill priority={r.priority} /></td>
                        <td style={{ padding: "12px 10px", fontSize: 11.5, color: "#9ca3af" }}>{r.escalation}</td>
                        <td style={{ padding: "12px 10px", fontSize: 12, color: "#4b5563" }}>{r.owner}</td>
                        <td style={{ padding: "12px 10px" }}><StatusDot status={r.status} /></td>
                        <td style={{ padding: "12px 0 12px 10px", textAlign: "right" }}>
                          <MoreHorizontal style={{ width: 15, height: 15, color: "#9ca3af", cursor: "pointer" }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <SectionCard title="Efficiency Leaders" icon={Zap}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {EFFICIENCY_LEADERS.map(e => (
                    <div key={e.label}>
                      <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{e.label}</p>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: "#374151" }}>{e.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: e.color }}>{e.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="System Alerts" icon={AlertTriangle}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {ALERTS.map(a => {
                    const critical = a.tier === "critical";
                    return (
                      <div key={a.title} style={{ padding: "10px 12px", borderRadius: 10, background: critical ? "#fef2f2" : "#fffbeb", borderLeft: `3px solid ${critical ? "#fecaca" : "#fde68a"}` }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: critical ? "#991b1b" : "#92400e" }}>{a.title}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                        <a href="#" style={{ fontSize: 11, fontWeight: 700, color: critical ? "#dc2626" : "#d97706", textDecoration: "none", marginTop: 6, display: "inline-block" }}>{a.action} →</a>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Recent Activity">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ fontSize: 12, color: "#374151" }}>
                        <strong style={{ color: "#111827" }}>{a.name}</strong> {a.action.toLowerCase()} <span style={{ color: "#7c3aed", fontWeight: 600 }}>{a.target}</span>
                      </p>
                      <span style={{ fontSize: 10.5, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          {/* Row: Configure rule + workflow visualizer + escalation settings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 300px", gap: 16 }}>

            {/* Configure SLA Rule */}
            <SectionCard title="Configure SLA Rule" subtitle="Edit parameters for the selected document category.">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Document Type</label>
                  <select value={ruleForm.docType} onChange={e => set("docType", e.target.value)} style={selStyle}>
                    <option>Research Grant Submission</option>
                    <option>Tuition Refund Policy</option>
                    <option>Thesis Defense Timeline</option>
                    <option>Grade Appeal Processing</option>
                    <option>Faculty Recruitment</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Rule Priority</label>
                  <select value={ruleForm.priority} onChange={e => set("priority", e.target.value)} style={selStyle}>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Processing Time</label>
                    <input type="number" value={ruleForm.procTime} onChange={e => set("procTime", e.target.value)} style={inpStyle} />
                  </div>
                  <div style={{ width: 90 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>&nbsp;</label>
                    <select style={selStyle}><option>Days</option><option>Hours</option></select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>Assigned Reviewer Role</label>
                  <select value={ruleForm.reviewerRole} onChange={e => set("reviewerRole", e.target.value)} style={selStyle}>
                    <option>Dean of Faculty</option>
                    <option>Finance Officer</option>
                    <option>Program Coordinator</option>
                    <option>Department Head</option>
                    <option>HR Director</option>
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
                  <button style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Update Rule</button>
                  <button style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Discard Changes</button>
                </div>
              </div>
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
            </SectionCard>

            {/* Escalation settings */}
            <SectionCard title="Escalation Settings" subtitle="Manage automated actions for overdue requests.">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f8", marginBottom: 12 }}>
                <div style={{ paddingRight: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Auto-Escalation</p>
                  <p style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 2 }}>Automatically reassign to senior management if SLA fails.</p>
                </div>
                <div
                  onClick={() => setAutoEscalation(v => !v)}
                  style={{ width: 38, height: 21, borderRadius: 20, background: autoEscalation ? "#7c3aed" : "#e5e7eb", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2.5, left: autoEscalation ? 19 : 3, transition: "left 0.15s" }} />
                </div>
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Reminder Notifications</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                {[
                  { key: "email", label: "Email Primary Stakeholders", icon: Mail },
                  { key: "dashboard", label: "In-App Dashboard Alerts", icon: MonitorSmartphone },
                  { key: "sms", label: "Mobile SMS (Urgent Only)", icon: Smartphone },
                ].map(o => (
                  <label key={o.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={reminders[o.key]}
                      onChange={() => setReminders(r => ({ ...r, [o.key]: !r[o.key] }))}
                      style={{ width: 14, height: 14, accentColor: "#7c3aed" }}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Default Recipients</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                {["Compliance Team", "Dept. Heads"].map(t => (
                  <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#f5f3ff", color: "#6d28d9" }}>
                    <Users style={{ width: 11, height: 11 }} /> {t}
                  </span>
                ))}
                <a href="#" style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>+ Add Role</a>
              </div>
            </SectionCard>
          </div>

        </div>
      </div>
    </div>
  );
}

const inpStyle = {
  width: "100%", marginTop: 5, padding: "9px 11px", borderRadius: 8,
  border: "1px solid #e5e7eb", background: "#fafafa", fontSize: 12.5,
  color: "#111827", outline: "none", boxSizing: "border-box",
};

const selStyle = { ...inpStyle, cursor: "pointer" };
