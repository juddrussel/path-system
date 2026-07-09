import React, { useState, useEffect, useRef } from "react";
import { Component } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";

const API = import.meta.env.VITE_API_URL;

function getUser() {
  try {
    const token = localStorage.getItem("token");
    return JSON.parse(atob(token.split(".")[1]));
  } catch { return {}; }
}


class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: "sans-serif" }}>
          <h2 style={{ color: "#dc2626" }}>Something went wrong</h2>
          <pre style={{ background: "#fee2e2", padding: 16, borderRadius: 8, fontSize: 12, overflow: "auto" }}>
            {this.state.error.message}\n{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = {
  Grid:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  Inbox:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 3h12v1.5L8 9 2 4.5V3zm0 3.5l6 4 6-4V13H2V6.5z"/></svg>,
  Plus:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14"><path d="M8 1v14M1 8h14"/></svg>,
  Tasks:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 3h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>,
  Workflow: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Reports:  () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 12h2V7H2zm4 0h2V4H6zm4 0h2V9h-2z"/></svg>,
  Users:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5s5 2 5 5"/><path d="M11 3c1.7 0 3 1.3 3 3s-1.3 3-3 3M13 12c1 .5 2 1.5 2 3"/></svg>,
  Shield:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7 3.5-.6 6-3.7 6-7V4L8 1z"/></svg>,
  Settings: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5"/></svg>,
  Help:     () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v1"/></svg>,
  Logout:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6"/></svg>,
  Forms:    () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm1 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg>,
  Assign: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M2 2h8l3 3v9H2V2z" fillOpacity=".15" stroke="currentColor" strokeWidth="1" fill="none"/>
      <path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12.5" cy="12.5" r="3" fill="#7c3aed"/>
      <path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  Search:   () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/></svg>,
  Clip:     () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="22" height="22"><path d="M13 7l-5.5 5.5a3.5 3.5 0 01-4.95-4.95l5.5-5.5a2 2 0 012.83 2.83L5.38 10.4a.5.5 0 01-.71-.71L10 4.5" strokeLinecap="round"/></svg>,
  Calendar: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13"><rect x="1" y="3" width="14" height="12" rx="1"/><path d="M5 1v4M11 1v4M1 7h14" strokeLinecap="round"/></svg>,
  X:        () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/></svg>,
  Filter:   () => <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12"><path d="M2 4h12v1.5L9 9v5l-2-1V9L2 5.5V4z"/></svg>,
  Dots:     () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>,
  Check:    () => <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" width="11" height="11"><path d="M13 4l-7.5 7.5L2 8" strokeLinecap="round"/></svg>,
  Info:     () => <svg viewBox="0 0 16 16" fill="none" stroke="#7c3aed" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="7"/><path d="M8 7v4M8 5v1" strokeLinecap="round"/></svg>,
  AssignTask: () => <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M2 2h8l3 3v9H2V2z" fill="none" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><circle cx="12.5" cy="12.5" r="3" fill="#7c3aed"/><path d="M11.5 12.5l.8.8 1.4-1.4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  Tracking: () => <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2" strokeLinecap="round"/></svg>,
};

function SbItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px", color: active?"white":"#c8c4e0", fontSize:12, cursor:"pointer", borderLeft: active?"2px solid #7c3aed":"2px solid transparent", background: active?"rgba(124,58,237,0.18)":"transparent" }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}>
      <span style={{ opacity: active?1:0.7 }}>{icon}</span>
      {label}
      {badge > 0 && <span style={{ marginLeft:"auto", background:"#dc2626", color:"white", borderRadius:20, fontSize:9, fontWeight:800, padding:"1px 6px" }}>{badge}</span>}
    </div>
  );
}

const PRIORITY_CONFIG = {
  High:   { bg:"#fee2e2", color:"#991b1b", dot:"#dc2626" },
  Medium: { bg:"#fef3c7", color:"#92400e", dot:"#f59e0b" },
  Low:    { bg:"#d1fae5", color:"#065f46", dot:"#10b981" },
};

const STATUS_CONFIG = {
  "In Review":   { bg:"#ede9fe", color:"#5b21b6" },
  "For Approval":{ bg:"#fef3c7", color:"#92400e" },
  "Returned":    { bg:"#fee2e2", color:"#991b1b" },
  "Received":    { bg:"#d1fae5", color:"#065f46" },
  "Pending":     { bg:"#f3f4f6", color:"#374151" },
};

function PriorityBadge({ p }) {
  const c = PRIORITY_CONFIG[p] || PRIORITY_CONFIG.Medium;
  return (
    <span style={{ ...c, display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700 }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:c.dot, display:"inline-block" }}/>
      {p}
    </span>
  );
}

function StatusBadge({ s }) {
  const c = STATUS_CONFIG[s] || STATUS_CONFIG.Pending;
  return <span style={{ ...c, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700 }}>{s}</span>;
}

// Workload bar component
function WorkloadBar({ name, role, percent, isOver }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0" }}>
      <div style={{ width:28, height:28, borderRadius:"50%", background: isOver ? "#fee2e2" : "#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:800, color: isOver ? "#dc2626" : "#7c3aed", flexShrink:0 }}>
        {name.split(" ").map(n=>n[0]).join("").slice(0,2)}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontSize:11, fontWeight:700, color:"#111", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:100 }}>{name}</span>
          <span style={{ fontSize:10, fontWeight:800, color: isOver ? "#dc2626" : "#7c3aed" }}>{percent}% {isOver ? "Over" : "Load"}</span>
        </div>
        <div style={{ height:4, background:"#f3f4f6", borderRadius:4, overflow:"hidden" }}>
          <div style={{ height:"100%", width:`${Math.min(percent,100)}%`, background: isOver ? "#dc2626" : "#7c3aed", borderRadius:4, transition:"width 0.5s ease" }}/>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
function TaskAssignmentInner() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const user     = getUser();
  const authH    = { Authorization: `Bearer ${token}` };
  const canViewAdminNav = ["admin", "program_chair"].includes(user?.role);

  const [facultyList,    setFacultyList]    = useState([]);
  const [roleOptions,    setRoleOptions]    = useState([]);
  const [assignMode,     setAssignMode]     = useState("individual"); // "individual" | "role"
  const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);
  const [selectedRole,   setSelectedRole]   = useState("");
  const [facultyDropdownOpen, setFacultyDropdownOpen] = useState(false);
  const facultyDropdownRef = useRef();
  const [assignments,    setAssignments]    = useState([]);
  const [assignSearch,   setAssignSearch]   = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [successMsg,     setSuccessMsg]     = useState(false);
  const [attachments,    setAttachments]    = useState([]);
  const attachRef = useRef();
  const [lastTrackingId,    setLastTrackingId]    = useState("");
  const [previewTrackingId, setPreviewTrackingId] = useState("Loading…");

  const fetchNextTrackingId = async () => {
    try {
      const res  = await fetch(`${API}/api/tasks/next-tracking-id`, { headers: authH });
      const data = await res.json();
      setPreviewTrackingId(data.tracking_id || "—");
    } catch { setPreviewTrackingId("—"); }
  };

  const [form, setForm] = useState({
    title: "", doc_type: "",
    priority: "Medium", deadline: "", notes: "",
  });

  useEffect(() => { if (!token) navigate("/login"); }, []);
  useEffect(() => { fetchFaculty(); fetchAssignments(); fetchNextTrackingId(); fetchRoles(); }, []);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(e.target)) {
        setFacultyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const fetchFaculty = async () => {
    try {
      const res  = await fetch(`${API}/api/users?role=faculty`, { headers: authH });
      const data = await res.json();
      setFacultyList(data.users || data || []);
    } catch { setFacultyList([]); }
  };

  const fetchRoles = async () => {
    try {
      const res  = await fetch(`${API}/api/users`, { headers: authH });
      const data = await res.json();
      const users = data.users || data || [];
      const roles = [...new Set(users.map(u => u.role).filter(Boolean))];
      setRoleOptions(roles);
    } catch { setRoleOptions(["faculty"]); }
  };

  const fetchAssignments = async () => {
    try {
      const res  = await fetch(`${API}/api/tasks`, { headers: authH });
      const data = await res.json();
      const result = data.tasks ?? data;
      setAssignments(Array.isArray(result) ? result : []);
    } catch { setAssignments([]); }
  };

  const handleAttach = (files) => {
    const arr = Array.from(files).filter(f => f.size <= 10*1024*1024);
    setAttachments(prev => [...prev, ...arr]);
  };

  const handleSubmit = async () => {
    if (assignMode === "individual" && selectedFacultyIds.length === 0)
      return alert("Please select at least one faculty member.");
    if (assignMode === "role" && !selectedRole)
      return alert("Please select a role to assign this task to.");
    if (!form.title || !form.deadline)
      return alert("Please fill in Task Title and Deadline.");
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (assignMode === "individual") {
        selectedFacultyIds.forEach(id => fd.append("faculty_ids", id));
      } else {
        fd.append("assign_role", selectedRole);
      }
      attachments.forEach(f => fd.append("attachments", f));

      const res = await fetch(`${API}/api/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const created = await res.json();
        setLastTrackingId(created.tracking_id || "");
        setSuccessMsg(true);
        setForm({ title:"", doc_type:"", priority:"Medium", deadline:"", notes:"" });
        setSelectedFacultyIds([]);
        setSelectedRole("");
        setAssignMode("individual");
        setAttachments([]);
        fetchAssignments();
        fetchNextTrackingId(); // refresh the preview for the next task
        setTimeout(() => setSuccessMsg(false), 4000);
      } else {
        const d = await res.json();
        alert(d.message || "Failed to assign task.");
      }
    } catch { alert("Server error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const handleSaveDraft = async () => {
    try {
      const fd = new FormData();
      Object.entries({...form, status:"Draft"}).forEach(([k,v]) => fd.append(k, v));
      if (assignMode === "individual") {
        selectedFacultyIds.forEach(id => fd.append("faculty_ids", id));
      } else {
        fd.append("assign_role", selectedRole);
      }
      attachments.forEach(f => fd.append("attachments", f));
      await fetch(`${API}/api/tasks/draft`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body: fd });
      alert("Draft saved.");
    } catch { alert("Could not save draft."); }
  };

  const toggleFacultyId = (id) => {
    setSelectedFacultyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllFaculty = () => {
    setSelectedFacultyIds(prev =>
      prev.length === facultyList.length ? [] : facultyList.map(f => f.id)
    );
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/login"); };
  const canAdmin = ["admin","program_chair"].includes(user.role);

  const filtered = assignments.filter(a =>
    !assignSearch ||
    (a.tracking_id||"").toLowerCase().includes(assignSearch.toLowerCase()) ||
    (a.title||"").toLowerCase().includes(assignSearch.toLowerCase()) ||
    (a.faculty_name||"").toLowerCase().includes(assignSearch.toLowerCase())
  );

  // Derive workload from assignments
  const workloadMap = {};
  assignments.forEach(a => {
    if (!a.faculty_name) return;
    workloadMap[a.faculty_name] = (workloadMap[a.faculty_name] || 0) + 1;
  });
  const maxLoad = Object.values(workloadMap).length > 0 ? Math.max(...Object.values(workloadMap)) : 1;
  const workloadList = Object.entries(workloadMap)
    .map(([name, count]) => ({ name, percent: Math.round((count/maxLoad)*100), isOver: count > 3 }))
    .sort((a,b) => b.percent - a.percent)
    .slice(0, 4);

  const docTypes = ["Select Type…","Internship","Capstone Proposal","Medical Certificate","Transfer Credential","Intent to Graduate","Clearance","Enrollment","Grade Appeal","Lab Report","Other"];

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans', sans-serif", fontSize:13, color:"#111", background:"#f4f4f8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
        input:focus, select:focus, textarea:focus { border-color: #7c3aed !important; outline: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width:200, background:"#1e1b2e", color:"#c8c4e0", display:"flex", flexDirection:"column", flexShrink:0, minHeight:"100vh", position:"sticky", top:0, height:"100vh", overflowY:"auto" }}>
        <div style={{ padding:16, display:"flex", alignItems:"center", gap:10, borderBottom:"0.5px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width:28, height:28, background:"#7c3aed", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            <img src="/images/path.png" alt="PATH" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <span style={{ fontSize:15, fontWeight:"bold", color:"white", letterSpacing:2 }}>PATH</span>
        </div>
        <div style={{ padding:"8px 0", flex:1 }}>
          <SbItem icon={<Icon.Grid />} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} />
          <SbItem icon={<Icon.Inbox />} label="Inbox / Received" active={false} onClick={() => navigate("/inbox")} />
          <SbItem icon={<Icon.Plus />} label="New Document" active={false} onClick={() => navigate("/documents/new")} />
          <SbItem icon={<Icon.Tasks />} label="My Tasks" active={false} onClick={() => navigate("/tasks")} />
          <SbItem icon={<Icon.Forms />} label="Forms" active={false} onClick={() => navigate("/forms")} />
          <SbItem icon={<Icon.Tracking />} label="Tracking" active={false} onClick={() => navigate("/tracking")} />
          <div style={{ fontSize: 10, color: "rgba(200,196,224,0.4)", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>Administration</div>
          
          <SbItem icon={<Icon.Reports />} label="Reports" active={false} onClick={() => { }} />
          {canViewAdminNav && <SbItem icon={<Icon.Workflow />} label="Workflow Designer" active={false} onClick={() => navigate("/workflow-designer")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Users />} label="Users & Roles" active={false} onClick={() => navigate("/users")} />}
          {canViewAdminNav && <SbItem icon={<Icon.Shield />} label="Audit Trail" active={false} onClick={() => navigate("/audit")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Assign Task" active={true} onClick={() => navigate("/assign-task")} />}
          {canViewAdminNav && <SbItem icon={<Icon.AssignTask />} label="Tasks Assigned" active={false} onClick={() => navigate("/task-assigned")} />}
          <SbItem icon={<Icon.Settings />} label="Settings" active={false} onClick={() => { }} />
        </div>
        <div style={{ paddingTop:10, borderTop:"0.5px solid rgba(255,255,255,0.08)" }}>
          <SbItem icon={<Icon.Help />}   label="Help & Support" onClick={() => {}} />
          <SbItem icon={<Icon.Logout />} label="Logout"         onClick={handleLogout} />
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        <TopBar onLogout={handleLogout}>
          <div style={{ display:"flex", alignItems:"center", gap:8, width:"100%" }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 12px", color:"#9ca3af" }}>
              <Icon.Search />
              <input type="text" placeholder="Search tasks, faculty, tracking ID..." value={assignSearch} onChange={e=>setAssignSearch(e.target.value)}
                style={{ border:"none", background:"transparent", outline:"none", fontSize:12, color:"#374151", width:"100%", fontFamily:"'DM Sans', sans-serif" }} />
            </div>
          </div>
        </TopBar>

        <div style={{ flex:1, padding:24, overflowY:"auto", display:"flex", flexDirection:"column", gap:20 }}>

          {/* Page header */}
          <div>
            <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>Department Admin / Chair Assignments</div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#111", margin:"0 0 4px" }}>Faculty Task Assignment</h1>
            <p style={{ fontSize:12, color:"#666", margin:0 }}>Delegate incoming documents and administrative tasks to department faculty members.</p>
          </div>

          {/* ── TOP SECTION: Form + Workload ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>

            {/* Assignment Configuration Card */}
            <div style={{ background:"white", borderRadius:14, border:"1px solid #f3f4f6", padding:24, animation:"fadeUp 0.3s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:800, color:"#111", margin:"0 0 2px" }}>Assignment Configuration</h3>
                  <p style={{ fontSize:11, color:"#888", margin:0 }}>Fill in the details to route this task to a faculty member.</p>
                </div>
                <span style={{ fontSize:11, color:"#7c3aed", fontWeight:700, cursor:"pointer" }}>Routing Assignment</span>
              </div>

              {/* Tracking ID banner — auto-generated, read-only */}
              <div style={{ background:"#faf5ff", border:"1px solid #ede9fe", borderRadius:9, padding:"10px 14px", marginBottom:18, display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Icon.Info />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", textTransform:"uppercase", letterSpacing:1, marginBottom:2 }}>Tracking ID (Auto-generated)</div>
                  <div style={{ fontSize:13, fontWeight:800, color:"#7c3aed" }}>
                    {previewTrackingId}
                  </div>
                </div>
              </div>

              {/* Row 1: Assign To + Tracking */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>
                    Assign To <span style={{ color:"#dc2626" }}>*</span>
                  </label>

                  {/* Mode toggle */}
                  <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                    <button type="button"
                      onClick={() => { setAssignMode("individual"); setSelectedRole(""); }}
                      style={{ flex:1, padding:"6px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer",
                        border: assignMode==="individual" ? "1px solid #7c3aed" : "1px solid #e5e7eb",
                        background: assignMode==="individual" ? "#faf5ff" : "white",
                        color: assignMode==="individual" ? "#7c3aed" : "#6b7280" }}>
                      Specific Faculty
                    </button>
                    <button type="button"
                      onClick={() => { setAssignMode("role"); setSelectedFacultyIds([]); setFacultyDropdownOpen(false); }}
                      style={{ flex:1, padding:"6px 8px", borderRadius:7, fontSize:11, fontWeight:700, cursor:"pointer",
                        border: assignMode==="role" ? "1px solid #7c3aed" : "1px solid #e5e7eb",
                        background: assignMode==="role" ? "#faf5ff" : "white",
                        color: assignMode==="role" ? "#7c3aed" : "#6b7280" }}>
                      Entire Role
                    </button>
                  </div>

                  {assignMode === "individual" ? (
                    <div ref={facultyDropdownRef} style={{ position:"relative" }}>
                      <div onClick={() => setFacultyDropdownOpen(o => !o)}
                        style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13,
                          color: selectedFacultyIds.length ? "#111" : "#9ca3af", background:"white", cursor:"pointer",
                          display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box" }}>
                        <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {selectedFacultyIds.length === 0
                            ? "— Select faculty (multiple allowed) —"
                            : selectedFacultyIds.length === 1
                              ? (facultyList.find(f => f.id === selectedFacultyIds[0])?.full_name || "1 selected")
                              : `${selectedFacultyIds.length} faculty selected`}
                        </span>
                        <span style={{ fontSize:10, color:"#9ca3af", marginLeft:6 }}>▾</span>
                      </div>

                      {facultyDropdownOpen && (
                        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:20,
                          background:"white", border:"1px solid #e5e7eb", borderRadius:8, boxShadow:"0 8px 20px rgba(0,0,0,0.1)",
                          maxHeight:220, overflowY:"auto" }}>
                          <label style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", fontSize:12,
                            fontWeight:700, color:"#7c3aed", cursor:"pointer", borderBottom:"1px solid #f3f4f6" }}>
                            <input type="checkbox"
                              checked={facultyList.length > 0 && selectedFacultyIds.length === facultyList.length}
                              onChange={toggleAllFaculty} />
                            Select all
                          </label>
                          {facultyList.map(f => (
                            <label key={f.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px",
                              fontSize:12.5, color:"#374151", cursor:"pointer" }}
                              onMouseEnter={e=>e.currentTarget.style.background="#faf5ff"}
                              onMouseLeave={e=>e.currentTarget.style.background="white"}>
                              <input type="checkbox"
                                checked={selectedFacultyIds.includes(f.id)}
                                onChange={() => toggleFacultyId(f.id)} />
                              {f.full_name}
                            </label>
                          ))}
                          {facultyList.length === 0 && (
                            <div style={{ padding:"10px 12px", fontSize:12, color:"#9ca3af" }}>No faculty found.</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}
                      style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13,
                        color: selectedRole ? "#111" : "#9ca3af", background:"white", boxSizing:"border-box" }}>
                      <option value="">— Select a role —</option>
                      {roleOptions.map(r => (
                        <option key={r} value={r}>{r.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>Task / Tracking #</label>
                  <div style={{ width:"100%", padding:"8px 12px", border:"1px solid #ede9fe", borderRadius:8, fontSize:13, color:"#7c3aed", fontWeight:700, background:"#faf5ff", minHeight:37, display:"flex", alignItems:"center" }}>
                    {previewTrackingId}
                  </div>
                </div>
              </div>

              {/* Task Title */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>
                  Task Title / Subject <span style={{ color:"#dc2626" }}>*</span>
                </label>
                <input type="text" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}
                  placeholder="Write a descriptive title for this assignment..."
                  style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color:"#111" }} />
              </div>

              {/* Row 2: Doc Type + Priority + Deadline */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>Document Type</label>
                  <select value={form.doc_type} onChange={e=>setForm(p=>({...p,doc_type:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color: form.doc_type?"#111":"#9ca3af", background:"white" }}>
                    {docTypes.map(d => <option key={d} value={d==="Select Type…"?"":d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>Priority</label>
                  <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color:"#111", background:"white" }}>
                    {["High","Medium","Low"].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>
                    Deadline / Due Date <span style={{ color:"#dc2626" }}>*</span>
                  </label>
                  <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))}
                    style={{ width:"100%", padding:"8px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color: form.deadline?"#111":"#9ca3af" }} />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom:18 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#374151", marginBottom:5 }}>Notes / Instructions</label>
                <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  placeholder="Detailed instructions for the faculty member..."
                  rows={3}
                  style={{ width:"100%", padding:"9px 12px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, color:"#111", resize:"vertical", fontFamily:"'DM Sans',sans-serif" }} />
              </div>

              {/* Attachments */}
              <div style={{ marginBottom:18 }}>
                <div
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{ e.preventDefault(); handleAttach(e.dataTransfer.files); }}
                  onClick={()=>attachRef.current?.click()}
                  style={{ border:"2px dashed #e5e7eb", borderRadius:10, padding:"18px", textAlign:"center", cursor:"pointer", background:"#fafafa", transition:"border-color 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#7c3aed"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                  <input ref={attachRef} type="file" multiple style={{ display:"none" }} onChange={e=>handleAttach(e.target.files)} />
                  <Icon.Clip />
                  <p style={{ fontSize:12, color:"#888", margin:"6px 0 2px" }}>Click to upload files</p>
                  <p style={{ fontSize:10, color:"#bbb", margin:0 }}>PDF, JPG, PNG — max 10MB each</p>
                </div>
                {attachments.length > 0 && (
                  <div style={{ marginTop:10, display:"flex", flexWrap:"wrap", gap:6 }}>
                    {attachments.map((f,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:5, background:"#ede9fe", borderRadius:6, padding:"3px 8px 3px 6px", fontSize:11, color:"#5b21b6" }}>
                        <span>📎</span> {f.name}
                        <button onClick={()=>setAttachments(prev=>prev.filter((_,j)=>j!==i))}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"#7c3aed", padding:0, marginLeft:2, lineHeight:1 }}>
                          <Icon.X />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SLA note */}
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:16, color:"#7c3aed", fontSize:11 }}>
                <Icon.Info />
                <span>SLA Preview: 5 Days (Calculated)</span>
              </div>

              {successMsg && (
                <div style={{ marginBottom:12, background:"#d1fae5", border:"1px solid #6ee7b7", borderRadius:8, padding:"10px 14px", fontSize:12, fontWeight:700, color:"#065f46", display:"flex", alignItems:"center", gap:8 }}>
                  <Icon.Check />
                  <span>Task assigned! Tracking ID: <span style={{ color:"#7c3aed", fontFamily:"monospace" }}>{lastTrackingId}</span></span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleSaveDraft}
                  style={{ flex:1, padding:"10px", background:"white", color:"#555", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  Save Draft
                </button>
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ flex:2, padding:"10px", background: submitting?"#a78bfa":"#7c3aed", color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:800, cursor: submitting?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <Icon.Assign /> {submitting ? "Assigning…" : "Assign Task"}
                </button>
              </div>
            </div>

            {/* Right column: Workload + Faculty Attachments */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Current Workload */}
              <div style={{ background:"white", borderRadius:14, border:"1px solid #f3f4f6", padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:"#111" }}>Current Workload Indicators</div>
                  <span style={{ fontSize:10, color:"#7c3aed", fontWeight:700, cursor:"pointer" }}>View Live</span>
                </div>
                {workloadList.length > 0 ? (
                  workloadList.map((w,i) => <WorkloadBar key={i} {...w} />)
                ) : (
                  // Placeholder bars when no assignments yet
                  [
                    { name:"Dr. Sarah Jenkins", percent:80, isOver:false },
                    { name:"Prof. Michael Chen", percent:95, isOver:true },
                    { name:"Dr. Maria Rodriguez", percent:60, isOver:false },
                    { name:"Dr. James Wilson", percent:45, isOver:false },
                  ].map((w,i) => <WorkloadBar key={i} {...w} />)
                )}
              </div>

              {/* Faculty Attachments */}
              <div style={{ background:"white", borderRadius:14, border:"1px solid #f3f4f6", padding:20 }}>
                <div style={{ fontSize:13, fontWeight:800, color:"#111", marginBottom:14 }}>Faculty Attachments</div>
                <div
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>{ e.preventDefault(); handleAttach(e.dataTransfer.files); }}
                  onClick={()=>attachRef.current?.click()}
                  style={{ border:"2px dashed #e5e7eb", borderRadius:10, padding:"24px 16px", textAlign:"center", cursor:"pointer", background:"#fafafa" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#7c3aed"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="#e5e7eb"}>
                  <Icon.Clip />
                  <p style={{ fontSize:11, color:"#888", margin:"6px 0 1px", fontWeight:600 }}>Click to upload files</p>
                  <p style={{ fontSize:10, color:"#bbb", margin:0 }}>PDF, JPG, PNG — max 10MB each</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Current Assignments Table ── */}
          <div style={{ background:"white", borderRadius:14, border:"1px solid #f3f4f6", overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <h3 style={{ fontSize:14, fontWeight:800, color:"#111", margin:"0 0 2px" }}>Current Assignments</h3>
                <p style={{ fontSize:11, color:"#888", margin:0 }}>Review and manage tasks currently assigned to department faculty.</p>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:"6px 12px" }}>
                  <Icon.Search />
                  <input type="text" placeholder="Search assignments..." value={assignSearch} onChange={e=>setAssignSearch(e.target.value)}
                    style={{ border:"none", background:"transparent", outline:"none", fontSize:12, color:"#374151", width:160, fontFamily:"'DM Sans', sans-serif" }} />
                </div>
                <button style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", border:"1px solid #e5e7eb", borderRadius:8, background:"white", fontSize:12, fontWeight:600, cursor:"pointer", color:"#374151" }}>
                  <Icon.Filter /> Filters
                </button>
                <button style={{ padding:"7px 10px", border:"1px solid #e5e7eb", borderRadius:8, background:"white", cursor:"pointer", color:"#374151" }}>
                  <Icon.Dots />
                </button>
              </div>
            </div>

            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:"#fafafa" }}>
                  {["Tracking #","Subject / Description","Assigned Faculty","Priority","Status","Due Date"].map(h => (
                    <th key={h} style={{ padding:"10px 20px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", borderBottom:"1px solid #f3f4f6", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  // Sample rows when no real data
                  [
                    { id:1, tracking_id:"2026-Ce-00752", title:"Curriculum Revision: Data Structures", subtitle:"Assign task to faculty", faculty_name:"Dr. Sarah Jenkins", priority:"High",   status:"In Review",    deadline:"2026-03-25" },
                    { id:2, tracking_id:"2026-Ce-00748", title:"Budget Proposal: AI Research Lab",    subtitle:"Assign task to faculty", faculty_name:"Prof. Michael Chen",  priority:"Urgent",  status:"For Approval", deadline:"2026-04-18" },
                    { id:3, tracking_id:"2026-Ce-00743", title:"Faculty Tenure Review – Q1",          subtitle:"Tenure review",          faculty_name:"Dr. Maria Rodriguez", priority:"Medium",  status:"Received",     deadline:"2026-03-21" },
                    { id:4, tracking_id:"2026-Ce-00738", title:"Student Internship MOU – Tech Corp",  subtitle:"Assign task to faculty", faculty_name:"Dr. Sarah Jenkins",   priority:"Low",     status:"Returned",     deadline:"2026-03-22" },
                    { id:5, tracking_id:"2026-Ce-00730", title:"Lab Equipment Procurement",           subtitle:"Assign task to faculty", faculty_name:"Dr. James Wilson",    priority:"High",    status:"In Review",    deadline:"2026-03-20" },
                  ].filter(r =>
                    !assignSearch ||
                    r.tracking_id.toLowerCase().includes(assignSearch.toLowerCase()) ||
                    r.title.toLowerCase().includes(assignSearch.toLowerCase()) ||
                    r.faculty_name.toLowerCase().includes(assignSearch.toLowerCase())
                  ).map(row => <AssignRow key={row.id} row={row} />)
                ) : (
                  filtered.map(row => <AssignRow key={row.id} row={row} />)
                )}
              </tbody>
            </table>

            <div style={{ padding:"12px 20px", borderTop:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:11, color:"#888" }}>Showing {Math.min(filtered.length || 5, 5)} of {filtered.length || 5} active assignments</span>
              <div style={{ display:"flex", gap:4 }}>
                <button style={{ padding:"4px 10px", border:"1px solid #e5e7eb", borderRadius:6, background:"white", cursor:"pointer", fontSize:12, color:"#374151" }}>Previous</button>
                <button style={{ padding:"4px 10px", border:"1px solid #e5e7eb", borderRadius:6, background:"white", cursor:"pointer", fontSize:12, color:"#374151" }}>Next</button>
              </div>
            </div>
          </div>

          <div style={{ textAlign:"center", fontSize:11, color:"#ccc" }}>
            © 2026 PATH Document Management System. All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

function AssignRow({ row }) {
  const priorityColor = {
    High:"#dc2626", Urgent:"#dc2626", Medium:"#f59e0b", Low:"#10b981"
  };
  return (
    <tr style={{ borderBottom:"1px solid #f9f9f9" }}
      onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
      onMouseLeave={e=>e.currentTarget.style.background="white"}>
      <td style={{ padding:"12px 20px" }}>
        {row.tracking_id
          ? <span style={{ color:"#7c3aed", fontWeight:700, fontSize:12, fontFamily:"monospace" }}>{row.tracking_id}</span>
          : <span style={{ color:"#d1d5db", fontSize:11, fontStyle:"italic" }}>—</span>
        }
      </td>
      <td style={{ padding:"12px 20px" }}>
        <div style={{ fontSize:13, fontWeight:600, color:"#111" }}>{row.title}</div>
        <div style={{ fontSize:11, color:"#aaa" }}>{row.subtitle || row.doc_type || ""}</div>
      </td>
      <td style={{ padding:"12px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:"#ede9fe", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:800, color:"#7c3aed", flexShrink:0 }}>
            {(row.faculty_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
          </div>
          <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{row.faculty_name || "—"}</span>
        </div>
      </td>
      <td style={{ padding:"12px 20px" }}>
        <PriorityBadge p={row.priority} />
      </td>
      <td style={{ padding:"12px 20px" }}>
        <StatusBadge s={row.status} />
      </td>
      <td style={{ padding:"12px 20px", fontSize:12, color:"#374151" }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <Icon.Calendar />
          {row.deadline || row.due_date || "—"}
        </div>
        {row.subtitle && <div style={{ fontSize:10, color:"#dc2626", marginTop:1 }}>Due soon</div>}
      </td>
    </tr>
  );
}

export default function TaskAssignment() {
  return (
    <ErrorBoundary>
      <TaskAssignmentInner />
    </ErrorBoundary>
  );
}
