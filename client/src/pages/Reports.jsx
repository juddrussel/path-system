import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import {
  FileText, Calendar, Users, ClipboardList, CheckCircle2,
  Clock, AlertTriangle, XCircle, TrendingUp, TrendingDown, BarChart3,
  PieChart as PieIcon, Eye, RotateCcw, Layers, Shield,
  Activity, Gauge, ListTodo, ChevronRight, AlertCircle,
  X, Percent, Paperclip, History, MessageSquare, Search,
} from "lucide-react";
import { exportReportToPDF, exportReportToExcel } from "./reportExport";

const ADMIN_NAV_ROLES = ["admin", "program_chair"];
const API = import.meta.env.VITE_API_URL || "";
const AUDIT_PREVIEW_LIMIT = 8; // rows shown on the Reports "Audit Trail" tab before linking to /audit

const PATH_REPORTS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
  .path-reports-shell { background:#f8f7ff !important; color:#4c3e56 !important; }
  .path-reports-main { background:#f8f7ff !important; }
  .path-reports-content { width:min(1480px,100%); margin:0 auto; padding:28px 30px 42px !important; gap:18px !important; }
  .path-reports-hero { min-height:148px; padding:28px 24px !important; border:1px solid #e4dbf2; border-left:2px solid #c4b5fd; border-radius:12px; background:linear-gradient(112deg,#fcfaff 0%,#f5efff 100%); }
  .path-reports-hero h1 { margin:9px 0 7px !important; color:#302638 !important; font-family:'Manrope',sans-serif !important; font-size:clamp(30px,4vw,43px) !important; letter-spacing:-.06em; }
  .path-reports-hero p { color:#91859d !important; font-size:12px !important; }
  .path-reports-filter { padding:15px 18px !important; border:1px solid #e6e0ec !important; border-radius:10px !important; box-shadow:0 7px 20px rgba(67,44,89,.035) !important; }
  .path-report-tabs { gap:26px !important; overflow-x:auto; padding:0 0 10px !important; border-bottom:1px solid #e3ddec !important; scrollbar-width:none; }
  .path-report-tabs button { position:relative; padding:0 0 9px !important; color:#8d8297 !important; font-family:'DM Sans',sans-serif !important; font-size:10px !important; font-weight:800 !important; }
  .path-report-tabs button::after { position:absolute; right:0; bottom:-11px; left:0; height:2px; border-radius:2px; background:transparent; content:''; }
  .path-report-tabs button:hover,.path-report-tabs button.path-tab-active { color:#6d28d9 !important; border-bottom-color:transparent !important; }
  .path-report-tabs button.path-tab-active::after { background:#7c3aed; }
  .path-report-card { border:1px solid #e6e0eb !important; border-radius:10px 10px 18px 10px !important; box-shadow:0 7px 20px rgba(67,44,89,.035) !important; }
  .path-report-card-head { padding:15px 17px !important; border-bottom-color:#f0edf4 !important; }
  .path-report-card-head p { color:#46384f !important; font-family:'Manrope',sans-serif !important; font-size:13px !important; letter-spacing:-.025em; }
  .path-report-card-head p + p { margin-top:3px !important; color:#9b91a3 !important; font-family:'DM Sans',sans-serif !important; font-size:8px !important; }
  .path-report-card-body { padding:16px 17px !important; }
  .path-report-card-foot { padding:10px 17px !important; border-top-color:#f0edf4 !important; }
  .path-kpi-card { border:1px solid #e6e0eb !important; border-radius:10px 10px 18px 10px !important; box-shadow:0 7px 20px rgba(67,44,89,.035) !important; }
  .path-kpi-card p { color:#43344e !important; font-family:'Manrope',sans-serif !important; font-size:26px !important; letter-spacing:-.055em; }
  .path-kpi-card p + p { color:#9e95a5 !important; font-family:'DM Sans',sans-serif !important; font-size:9px !important; letter-spacing:0 !important; }
  .path-filter-label { color:#9b91a3 !important; font-family:'DM Sans',sans-serif !important; font-size:8px !important; font-weight:800 !important; letter-spacing:.08em; text-transform:uppercase; }
  .path-filter-select { height:38px; border-color:#e4dced !important; border-radius:8px !important; color:#645970 !important; font-family:'DM Sans',sans-serif !important; font-size:10px !important; font-weight:700 !important; }
  .path-export-buttons button { border-radius:8px !important; font-family:'DM Sans',sans-serif !important; font-size:10px !important; }
  .path-reports-content table thead tr { background:#faf8fd !important; border-bottom-color:#eeeaf3 !important; }
  .path-reports-content table th { color:#a098a6 !important; font-family:'DM Sans',sans-serif !important; font-size:8px !important; letter-spacing:.08em !important; }
  .path-reports-content table td { color:#62536b; font-family:'DM Sans',sans-serif; }
  @media (max-width:760px) { .path-reports-content { padding:20px 15px 32px !important; }.path-reports-hero { padding:22px 18px !important; }.path-reports-filter { overflow-x:auto; }.path-report-tabs { gap:18px !important; }.path-report-tabs button { font-size:9px !important; }.path-report-card-head { align-items:flex-start !important; }.path-export-buttons { width:100%; }.path-export-buttons button { flex:1; justify-content:center; } }
`;

const PATH_REPORTS_EXACT_CSS = `
  .path-kpi-grid { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:14px !important; }
  .path-transactions-kpi-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; }
  .path-kpi-card { min-height:116px !important; padding:17px 18px !important; }
  .path-kpi-card > div:first-child { margin-bottom:12px !important; }
  .path-kpi-card > div:first-child > div:first-child { width:25px !important; height:25px !important; border-radius:7px !important; }
  .path-kpi-card > div:first-child > span { font-family:'DM Sans',sans-serif !important; font-size:8px !important; font-weight:800 !important; letter-spacing:.1em !important; text-transform:uppercase !important; }
  .path-overview-chart-grid { display:grid !important; grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr) !important; gap:14px !important; }
  .path-overview-chart-grid > :last-child { grid-column:1 / -1; }
  .path-overview-detail-grid { display:grid !important; grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr) !important; gap:14px !important; }
  .path-processing-summary-grid { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:14px !important; }
  .path-processing-summary-grid .path-report-card { min-height:121px; }
  .path-transactions-visuals { display:grid !important; grid-template-columns:minmax(220px,.82fr) minmax(280px,.95fr) minmax(340px,1.35fr) !important; gap:14px !important; }
  .path-transactions-visuals .path-report-card { min-width:0; min-height:330px; }
  .path-transactions-visuals .path-report-card-head { padding-bottom:14px !important; }
  .path-transactions-visuals .path-report-card-body { padding-top:17px !important; }
  .path-bottleneck-grid,.path-returned-chart-grid { display:grid !important; grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr) !important; gap:14px !important; }
  .path-returned-summary-grid { display:grid !important; grid-template-columns:repeat(4,minmax(0,1fr)) !important; gap:14px !important; }
  .path-returned-summary-grid .path-kpi-card { min-height:102px !important; }
  .path-report-card-body-no-pad { padding:0 !important; }
  .path-reports-content .path-report-card-body-no-pad table { min-width:760px; }
  .path-reports-content .path-report-card-body-no-pad { overflow-x:auto; }
  .path-reports-content .path-report-card-body:not(.path-report-card-body-no-pad) .recharts-wrapper { margin-top:4px; }
  .path-reports-content .recharts-cartesian-grid-horizontal line,.path-reports-content .recharts-cartesian-grid-vertical line { stroke:#f0edf4 !important; }
  .path-reports-content .recharts-text { fill:#a097a7 !important; font-family:'DM Sans',sans-serif !important; font-size:9px !important; }
  .path-reports-content .recharts-legend-item-text { color:#82758b !important; font-family:'DM Sans',sans-serif !important; font-size:9px !important; }
  .path-reports-content .recharts-tooltip-wrapper { font-family:'DM Sans',sans-serif; font-size:10px; }
  @media (max-width:1100px) { .path-overview-chart-grid,.path-overview-detail-grid { grid-template-columns:1fr !important; }.path-overview-chart-grid > :last-child { grid-column:auto; }.path-transactions-visuals { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }.path-transactions-visuals > :last-child { grid-column:1 / -1; }.path-returned-chart-grid { grid-template-columns:1fr !important; } }
  @media (max-width:760px) { .path-kpi-grid,.path-transactions-kpi-grid,.path-processing-summary-grid,.path-returned-summary-grid { grid-template-columns:1fr !important; gap:8px !important; }.path-kpi-card { min-height:96px !important; padding:14px !important; }.path-transactions-visuals { grid-template-columns:1fr !important; }.path-transactions-visuals > :last-child { grid-column:auto; }.path-transactions-visuals .path-report-card { min-height:305px; }.path-bottleneck-grid { grid-template-columns:1fr !important; }.path-returned-chart-grid { grid-template-columns:1fr !important; }.path-reports-content .path-report-card-body-no-pad table { min-width:640px; } }
`;

const PATH_REPORTS_LIVE_CSS = `
  .path-chart-empty { display:grid; min-height:176px; place-items:center; margin:0; color:#9e94a5; font-family:'DM Sans',sans-serif; font-size:10px; text-align:center; }
  .path-status-ledger { display:flex; flex-direction:column; gap:17px; padding-top:5px; }.path-status-total { display:flex; align-items:baseline; gap:9px; padding:13px 14px; border-left:3px solid #8b5cf6; border-radius:0 10px 10px 0; background:#f6f1ff; }.path-status-total strong { color:#4a3566; font-family:'Manrope',sans-serif; font-size:30px; letter-spacing:-.07em; }.path-status-total span { color:#968aa0; font-family:'DM Sans',sans-serif; font-size:8px; }.path-status-ledger-rows { display:flex; flex-direction:column; gap:10px; }.path-status-ledger-row > div { display:flex; align-items:center; justify-content:space-between; margin-bottom:5px; color:#73657d; font-family:'DM Sans',sans-serif; font-size:8px; }.path-status-ledger-row > div strong { color:#524160; font-size:9px; }.path-status-ledger-row > i { display:block; overflow:hidden; height:7px; border-radius:999px; background:#f0ecf5; }.path-status-ledger-row > i b { display:block; min-width:4px; height:100%; border-radius:inherit; }
  .path-rank-bars { display:flex; flex-direction:column; gap:14px; padding-top:8px; }.path-rank-row > div { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:6px; }.path-rank-row span { overflow:hidden; color:#71647b; font-family:'DM Sans',sans-serif; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.path-rank-row strong { color:#554361; font-family:'Manrope',sans-serif; font-size:10px; }.path-rank-row > i { display:block; overflow:hidden; height:8px; border-radius:999px; background:#f2eef7; }.path-rank-row > i b { display:block; min-width:4px; height:100%; border-radius:inherit; }
  .path-trend { position:relative; min-height:220px; padding:6px 0 0 26px; }.path-trend-scale { position:absolute; top:9px; bottom:38px; left:0; display:flex; flex-direction:column; justify-content:space-between; color:#aaa0b0; font-family:'DM Sans',sans-serif; font-size:8px; }.path-trend-plot { height:174px; border-bottom:1px solid #eeeaf3; background:repeating-linear-gradient(to bottom,transparent 0,transparent 32.5%,#f0edf4 33%,transparent 33.5%); }.path-trend-plot svg { width:100%; height:100%; overflow:visible; filter:drop-shadow(0 3px 3px rgba(124,58,237,.08)); }.path-trend-labels { display:flex; justify-content:space-between; padding-top:7px; color:#aaa0b0; font-family:'DM Sans',sans-serif; font-size:8px; }.path-chart-legend { display:flex; flex-wrap:wrap; justify-content:center; gap:11px; padding-top:12px; }.path-chart-legend span { display:inline-flex; align-items:center; gap:5px; color:#82758b; font-family:'DM Sans',sans-serif; font-size:8px; }.path-chart-legend i { display:inline-block; width:6px; height:6px; border-radius:50%; }
  .path-processing-ranges { display:flex; flex-direction:column; gap:14px; padding-top:9px; }.path-range-scale { display:flex; justify-content:space-between; margin-left:174px; color:#aaa0b0; font-family:'DM Sans',sans-serif; font-size:8px; }.path-range-row { display:grid; grid-template-columns:158px minmax(0,1fr); gap:16px; align-items:center; min-height:43px; }.path-range-row > strong { overflow:hidden; color:#4b3b55; font-family:'Manrope',sans-serif; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.path-range-row > div { position:relative; height:14px; border-radius:999px; background:repeating-linear-gradient(to right,#f2eef7 0,#f2eef7 calc(25% - 1px),#e7e0ef 25%); }.path-range-row > div > i { position:absolute; top:4px; height:6px; border-radius:999px; background:linear-gradient(90deg,#c4b5fd,#8b5cf6); }.path-range-row > div > b { position:absolute; top:1px; width:12px; height:12px; transform:translateX(-50%); border:2px solid #fff; border-radius:50%; box-shadow:0 2px 6px rgba(67,44,89,.18); }.path-range-fast { background:#159d77; }.path-range-average { z-index:2; background:#7c3aed; }.path-range-slow { background:#d64550; }.path-range-row > div > span { position:absolute; top:-18px; transform:translateX(-50%); color:#6b3fc2; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; }
  .path-faculty-pulse { display:flex; flex-direction:column; gap:16px; padding-top:7px; }.path-faculty-pulse-row { display:grid; grid-template-columns:180px minmax(0,1fr) 30px; gap:14px; align-items:center; }.path-faculty-pulse-row > div { display:flex; min-width:0; align-items:center; gap:8px; }.path-faculty-pulse-row > div strong { overflow:hidden; color:#51415b; font-family:'Manrope',sans-serif; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.path-faculty-pulse-row section { display:flex; flex-direction:column; gap:5px; }.path-faculty-pulse-row section > i { display:flex; overflow:hidden; height:10px; border-radius:999px; background:#f1edf6; }.path-faculty-pulse-row section b,.path-faculty-pulse-row section em { display:block; height:100%; min-width:0; }.path-faculty-pulse-row section b { background:#159d77; }.path-faculty-pulse-row section em { background:#d58a00; }.path-faculty-pulse-row section small { color:#9a90a2; font-family:'DM Sans',sans-serif; font-size:8px; }.path-faculty-pulse-row > span { color:#76687e; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; text-align:right; }
  @media (max-width:760px) { .path-trend { min-height:205px; }.path-range-scale { margin-left:121px; }.path-range-row { grid-template-columns:108px minmax(0,1fr); gap:10px; }.path-range-row > strong { font-size:8px; white-space:normal; }.path-faculty-pulse-row { grid-template-columns:112px minmax(110px,1fr) 23px; gap:8px; }.path-faculty-pulse-row > div strong { font-size:8px; white-space:normal; }.path-faculty-pulse-row section small { font-size:7px; } }
`;

const PATH_OVERVIEW_CSS = `
  .path-overview-workspace { display:flex; flex-direction:column; gap:14px; }.path-overview-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }.path-overview-metric { min-height:116px; padding:17px 18px; border:1px solid #e6e0eb; border-radius:10px; background:#fff; box-shadow:0 7px 20px rgba(67,44,89,.035); }.path-overview-metric > div { display:flex; align-items:center; justify-content:space-between; color:#9b91a1; }.path-overview-metric > div span,.path-overview-panel header > div > span { font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; letter-spacing:.11em; text-transform:uppercase; }.path-overview-metric > div svg { width:25px; height:25px; padding:5px; border-radius:7px; background:#f1ebff; color:#7c3aed; }.path-overview-metric.green > div svg { background:#e5f8ef; color:#32926c; }.path-overview-metric.blue > div svg { background:#e9f2ff; color:#4b7fc4; }.path-overview-metric.amber > div svg { background:#fff4dc; color:#bd8130; }.path-overview-metric strong { display:block; margin-top:14px; color:#3e3248; font-family:'Manrope',sans-serif; font-size:27px; letter-spacing:-.055em; }.path-overview-metric small { display:block; margin-top:6px; color:#9e95a5; font-family:'DM Sans',sans-serif; font-size:9px; }
  .path-overview-main-grid,.path-overview-bottom-grid { display:grid; grid-template-columns:minmax(0,1.1fr) minmax(340px,.9fr); gap:14px; }.path-overview-panel { min-width:0; padding:20px 21px; border:1px solid #e6e0eb; border-radius:10px 10px 18px 10px; background:#fff; box-shadow:0 7px 20px rgba(67,44,89,.035); }.path-overview-panel header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }.path-overview-panel header h2 { margin:6px 0 4px; color:#403448; font-family:'Manrope',sans-serif; font-size:16px; letter-spacing:-.035em; }.path-overview-panel header p { margin:0; color:#9a90a2; font-family:'DM Sans',sans-serif; font-size:9px; line-height:1.45; }.path-overview-panel header > button { display:inline-flex; align-items:center; gap:4px; padding:0; border:0; background:transparent; color:#7c3aed; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; }.path-overview-panel header > button svg { width:13px; height:13px; }.path-flow-total { display:flex; align-items:baseline; gap:9px; margin:24px 0 18px; }.path-flow-total strong { color:#3d2d4b; font-family:'Manrope',sans-serif; font-size:34px; letter-spacing:-.07em; }.path-flow-total span { color:#887c92; font-family:'DM Sans',sans-serif; font-size:10px; }.path-flow-bars { display:flex; flex-direction:column; gap:14px; }.path-flow-bars > div > div { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; color:#82758b; font-family:'DM Sans',sans-serif; font-size:9px; }.path-flow-bars > div > div strong { color:#5d4c68; font-size:9px; }.path-flow-bars i { display:block; overflow:hidden; height:8px; border-radius:999px; background:#f0ecf5; }.path-flow-bars b { display:block; min-width:4px; height:100%; border-radius:inherit; }
  .path-health-state { display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:999px; background:#e8f8ef; color:#3b9675; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; }.path-health-state i { width:5px; height:5px; border-radius:50%; background:#4aae83; }.path-health-main { display:flex; align-items:center; gap:18px; margin:24px 0 22px; }.path-health-ring { display:flex; width:92px; height:92px; flex:0 0 auto; align-items:center; justify-content:center; flex-direction:column; border-radius:50%; background:conic-gradient(#7c3aed calc(var(--health) * 1%),#e8e0fa 0); position:relative; }.path-health-ring::after { position:absolute; width:76px; height:76px; border-radius:50%; background:#fff; content:''; }.path-health-ring strong,.path-health-ring small { position:relative; z-index:1; }.path-health-ring strong { color:#5d32a7; font-family:'Manrope',sans-serif; font-size:21px; letter-spacing:-.06em; }.path-health-ring small { color:#9a8fac; font-family:'DM Sans',sans-serif; font-size:8px; }.path-health-main > div:last-child { min-width:0; }.path-health-main > div:last-child > strong { color:#4b3a57; font-family:'Manrope',sans-serif; font-size:12px; }.path-health-main p { margin:6px 0 8px; color:#9a90a2; font-family:'DM Sans',sans-serif; font-size:9px; line-height:1.45; }.path-health-main button { display:inline-flex; align-items:center; gap:4px; padding:0; border:0; background:transparent; color:#6d28d9; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; }.path-health-main button svg { width:12px; height:12px; }.path-health-panel footer { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; padding-top:16px; border-top:1px solid #f0edf4; }.path-health-panel footer div { display:flex; flex-direction:column; gap:4px; }.path-health-panel footer span { color:#9a90a2; font-family:'DM Sans',sans-serif; font-size:8px; }.path-health-panel footer strong { color:#55445f; font-family:'Manrope',sans-serif; font-size:17px; letter-spacing:-.04em; }.path-health-panel footer small { color:#a79cab; font-family:'DM Sans',sans-serif; font-size:8px; }
  .path-category-table { margin-top:22px; }.path-category-head,.path-category-row { display:grid; grid-template-columns:minmax(0,1.7fr) 80px 80px 70px; gap:12px; align-items:center; }.path-category-head { padding:0 0 9px; border-bottom:1px solid #eeeaf3; color:#a096a6; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }.path-category-row { min-height:49px; border-bottom:1px solid #f1eef4; color:#65576d; font-family:'DM Sans',sans-serif; font-size:9px; }.path-category-row > strong { display:flex; align-items:center; gap:8px; min-width:0; color:#4d4057; font-family:'Manrope',sans-serif; font-size:10px; }.path-category-row > strong i { width:7px; height:7px; flex:0 0 auto; border-radius:50%; background:#8b5cf6; }.path-category-row > strong i.dot-1 { background:#6d9fe0; }.path-category-row > strong i.dot-2 { background:#edbb59; }.path-category-row > strong i.dot-3 { background:#58b78d; }.path-category-row > span { color:#61536a; font-family:'Manrope',sans-serif; font-size:10px; }.path-category-row em { color:#399273; font-style:normal; font-weight:800; }.path-category-row em:not(:empty) { color:#399273; }
  .path-library-panel { display:flex; flex-direction:column; }.path-library-list { display:flex; flex-direction:column; margin-top:16px; }.path-library-list > button { display:grid; grid-template-columns:30px minmax(0,1fr) auto 14px; gap:9px; align-items:center; padding:12px 0; border:0; border-bottom:1px solid #f1eef4; background:transparent; color:inherit; cursor:pointer; text-align:left; }.path-library-list > button:hover { background:#fbf9ff; }.path-library-icon { display:grid; width:29px; height:29px; place-items:center; border-radius:8px; background:#f0eaff; color:#7c3aed; }.path-library-icon.item-1 { background:#eaf2ff; color:#4c80c4; }.path-library-icon.item-2 { background:#fff3dc; color:#bd8130; }.path-library-icon svg { width:14px; height:14px; }.path-library-list > button > span { display:flex; min-width:0; flex-direction:column; gap:4px; }.path-library-list strong { overflow:hidden; color:#55465f; font-family:'Manrope',sans-serif; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.path-library-list small { overflow:hidden; color:#a097a7; font-family:'DM Sans',sans-serif; font-size:8px; text-overflow:ellipsis; white-space:nowrap; }.path-library-list em { padding:4px 7px; border-radius:999px; background:#e7f7ee; color:#3c9675; font-family:'DM Sans',sans-serif; font-size:8px; font-style:normal; font-weight:800; }.path-library-list > button > svg { color:#b1a8b8; width:14px; height:14px; }.path-library-create { align-self:flex-start; margin-top:auto; padding:8px 10px; border:1px solid #e6def1; border-radius:8px; background:#faf8ff; color:#67428f; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; }
  @media (max-width:1100px) { .path-overview-metrics { grid-template-columns:repeat(2,minmax(0,1fr)); }.path-overview-main-grid,.path-overview-bottom-grid { grid-template-columns:1fr; } }.path-overview-metrics + .path-overview-main-grid { margin-top:0; } @media (max-width:760px) { .path-overview-metrics { gap:8px; }.path-overview-metric { min-height:106px; padding:15px 14px; }.path-overview-metric strong { font-size:23px; }.path-overview-main-grid,.path-overview-bottom-grid { gap:10px; }.path-overview-panel { padding:17px 15px; }.path-health-main { align-items:flex-start; flex-direction:column; }.path-category-head,.path-category-row { grid-template-columns:minmax(0,1fr) 55px 55px; }.path-category-head span:last-child,.path-category-row em { display:none; }.path-library-list > button { grid-template-columns:30px minmax(0,1fr) 14px; }.path-library-list em { display:none; } }
`;

const PATH_TRANSACTION_REGISTER_CSS = `
  .path-transactions-kpi-grid { grid-template-columns:repeat(7,minmax(0,1fr)) !important; }.path-transactions-kpi-grid .path-kpi-card { min-width:0; min-height:108px !important; padding:15px 14px !important; }.path-transactions-kpi-grid .path-kpi-card p { font-size:23px !important; }.path-transactions-kpi-grid .path-kpi-card p + p { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .path-delay-register { overflow:hidden; border:1px solid #e6e0eb; border-radius:10px 10px 18px 10px; background:#fff; box-shadow:0 7px 20px rgba(67,44,89,.035); }.path-delay-register > header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 18px 15px; border-bottom:1px solid #eeeaf3; }.path-delay-register > header > div:first-child > span { color:#9b91a1; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; letter-spacing:.11em; text-transform:uppercase; }.path-delay-register h2 { margin:7px 0 4px; color:#403448; font-family:'Manrope',sans-serif; font-size:15px; letter-spacing:-.035em; }.path-delay-register p { margin:0; color:#9a90a2; font-family:'DM Sans',sans-serif; font-size:9px; }.path-delay-header-actions { display:flex; align-items:flex-start; gap:9px; }.path-delay-header-actions > aside { display:flex; min-width:68px; align-items:flex-end; flex-direction:column; padding:7px 9px; border-radius:8px; background:#fff4e7; }.path-delay-header-actions > aside strong { color:#bd7020; font-family:'Manrope',sans-serif; font-size:16px; }.path-delay-header-actions > aside small { color:#a47c54; font-family:'DM Sans',sans-serif; font-size:8px; white-space:nowrap; }.path-delay-table-wrap { overflow-x:auto; }.path-delay-table { display:grid; grid-template-columns:minmax(100px,.75fr) minmax(220px,1.7fr) minmax(180px,1.45fr) minmax(120px,.9fr) minmax(155px,1.15fr) minmax(90px,.65fr); gap:14px; align-items:center; min-width:930px; }.path-delay-head { min-height:34px; padding:0 18px; color:#a098a6; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }.path-delay-row { min-height:58px; padding:0 18px; border-top:1px solid #f0edf4; }.path-delay-row > strong { color:#6740a4; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; }.path-delay-title { display:flex; min-width:0; flex-direction:column; gap:4px; }.path-delay-title b { overflow:hidden; color:#493950; font-family:'Manrope',sans-serif; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }.path-delay-title small { color:#9b91a2; font-family:'DM Sans',sans-serif; font-size:8px; }.path-delay-faculty { display:flex; min-width:0; align-items:center; gap:8px; overflow:hidden; color:#5e5068; font-family:'DM Sans',sans-serif; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.path-delay-status { justify-self:start; padding:6px 8px; border-radius:7px; background:#f2eff6; color:#665a70; font-family:'DM Sans',sans-serif; font-size:8px; font-weight:800; }.path-delay-status.delayed { background:#fff5df; color:#b67829; }.path-delay-status.overdue { background:#fff0ef; color:#c33e43; }.path-delay-stage { overflow:hidden; color:#74677d; font-family:'DM Sans',sans-serif; font-size:9px; text-overflow:ellipsis; white-space:nowrap; }.path-delay-days { display:flex; align-items:center; gap:7px; color:#bd7020; font-family:'Manrope',sans-serif; font-size:10px; font-weight:800; }.path-delay-days i { width:7px; height:7px; border:1px solid currentColor; border-radius:50%; }.path-delay-days.overdue { color:#c9343b; }.path-delay-days.overdue i { background:#c9343b; box-shadow:0 0 0 3px #ffe1e1; }.path-delay-empty { display:grid; min-height:105px; place-items:center; margin:0; color:#9b91a2; font-family:'DM Sans',sans-serif; font-size:10px; text-align:center; }.path-delay-register > footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 18px; border-top:1px solid #f0edf4; color:#a097a7; font-family:'DM Sans',sans-serif; font-size:8px; }.path-delay-pagination { display:flex; align-items:center; gap:5px; }.path-delay-pagination button { display:grid; width:27px; height:27px; place-items:center; border:1px solid #e6dfef; border-radius:7px; background:#fff; color:#796b84; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:9px; font-weight:800; }.path-delay-pagination button svg { width:13px; height:13px; }.path-delay-pagination button.active { border-color:#7c3aed; background:#7c3aed; color:#fff; }.path-delay-pagination button:disabled { cursor:not-allowed; opacity:.42; }
  @media (max-width:1320px) { .path-transactions-kpi-grid { grid-template-columns:repeat(4,minmax(0,1fr)) !important; } } @media (max-width:760px) { .path-transactions-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }.path-delay-register > header { align-items:stretch; flex-direction:column; }.path-delay-header-actions { align-items:stretch; justify-content:space-between; }.path-delay-header-actions .path-export-buttons { width:auto; }.path-delay-table { min-width:830px; }.path-delay-register > footer { align-items:flex-start; flex-direction:column; }.path-delay-pagination { align-self:flex-end; } }
`;


function SectionCard({ title, subtitle, icon: IconCmp, children, action, noPad, footer }) {
  return (
    <div className="path-report-card" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column" }}>
      <div className="path-report-card-head" style={{ padding: "13px 18px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 29, height: 29, borderRadius: 7, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconCmp style={{ width: 14, height: 14, color: "#7c3aed" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{title}</p>
            {subtitle && <p style={{ fontSize: 11, color: "#6b7280" }}>{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={`path-report-card-body ${noPad ? "path-report-card-body-no-pad" : ""}`} style={{ padding: noPad ? 0 : "14px 18px", flex: 1 }}>{children}</div>
      {footer && <div className="path-report-card-foot" style={{ padding: "10px 18px", borderTop: "1px solid rgba(0,0,0,0.07)", flexShrink: 0 }}>{footer}</div>}
    </div>
  );
}

const STATUS_CFG = {
  pending:   { color: "#92400e", bg: "#fef3c7" },
  approved:  { color: "#059669", bg: "#d1fae5" },
  completed: { color: "#059669", bg: "#d1fae5" },
  rejected:  { color: "#dc2626", bg: "#fee2e2" },
  returned:  { color: "#c2410c", bg: "#ffedd5" },
  delayed:   { color: "#c2410c", bg: "#ffedd5" },
  overdue:   { color: "#dc2626", bg: "#fef2f2" },
};
function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s?.toLowerCase()] ?? { color: "#374151", bg: "#f3f4f6" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {s}
    </span>
  );
}

// ── Type badge (Task / Form / Document) — mirrors Tracking.jsx's TypeBadge ──
const TYPE_BADGE_CFG = {
  task:     { label: "Task",     bg: "#ede9fe", color: "#6d28d9" },
  form:     { label: "Form",     bg: "#dbeafe", color: "#1e40af" },
  document: { label: "Document", bg: "#dcfce7", color: "#15803d" },
};
function TypeBadge({ type }) {
  const cfg = TYPE_BADGE_CFG[type?.toLowerCase()] ?? TYPE_BADGE_CFG.document;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
      background: cfg.bg, color: cfg.color,
      textTransform: "uppercase", letterSpacing: 0.4, flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

const SEVERITY_CFG = {
  Low:      { color: "#0284c7", bg: "#e0f2fe" },
  Medium:   { color: "#d97706", bg: "#fffbeb" },
  High:     { color: "#c2410c", bg: "#ffedd5" },
  Critical: { color: "#dc2626", bg: "#fef2f2" },
};
function SeverityBadge({ level }) {
  const cfg = SEVERITY_CFG[level] ?? SEVERITY_CFG.Low;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: cfg.bg, color: cfg.color, whiteSpace: "nowrap" }}>
      {level === "Critical" && <AlertTriangle style={{ width: 10, height: 10 }} />}{level}
    </span>
  );
}

/* Audit-trail action → readable label + color, so the programchair/admin can
   scan the "Action" column and immediately see what changed on a document
   (approved, rejected, returned, updated, etc). Backend sends codes like
   "TASK_APPROVE", "TASK_STATUS_UPDATE" — we strip the entity prefix so the
   base verb (approve, return, status_update...) matches regardless of
   whether it's a TASK_/DOCUMENT_/FORM_ action. Falls back gracefully for
   anything not explicitly mapped. */
const ACTION_CFG = {
  approve:        { label: "Approved",        color: "#059669", bg: "#d1fae5" },
  approved:       { label: "Approved",        color: "#059669", bg: "#d1fae5" },
  reject:         { label: "Rejected",        color: "#dc2626", bg: "#fee2e2" },
  rejected:       { label: "Rejected",        color: "#dc2626", bg: "#fee2e2" },
  return:         { label: "Returned",        color: "#c2410c", bg: "#ffedd5" },
  returned:       { label: "Returned",        color: "#c2410c", bg: "#ffedd5" },
  complete:       { label: "Completed",       color: "#059669", bg: "#d1fae5" },
  completed:      { label: "Completed",       color: "#059669", bg: "#d1fae5" },
  create:         { label: "Created",         color: "#0284c7", bg: "#e0f2fe" },
  created:        { label: "Created",         color: "#0284c7", bg: "#e0f2fe" },
  submit:         { label: "Submitted",       color: "#0284c7", bg: "#e0f2fe" },
  submitted:      { label: "Submitted",       color: "#0284c7", bg: "#e0f2fe" },
  update:         { label: "Updated",         color: "#374151", bg: "#f3f4f6" },
  updated:        { label: "Updated",         color: "#374151", bg: "#f3f4f6" },
  status_change:  { label: "Status Updated",  color: "#374151", bg: "#f3f4f6" },
  status_update:  { label: "Status Updated",  color: "#374151", bg: "#f3f4f6" },
  forward:        { label: "Forwarded",       color: "#7c3aed", bg: "#ede9fe" },
  forwarded:      { label: "Forwarded",       color: "#7c3aed", bg: "#ede9fe" },
  assign:         { label: "Assigned",        color: "#7c3aed", bg: "#ede9fe" },
  assigned:       { label: "Assigned",        color: "#7c3aed", bg: "#ede9fe" },
  delete:         { label: "Deleted",         color: "#dc2626", bg: "#fee2e2" },
  deleted:        { label: "Deleted",         color: "#dc2626", bg: "#fee2e2" },
};
// Entity prefixes the backend uses on action codes (TASK_APPROVE,
// DOCUMENT_SUBMIT, FORM_DELETE...). Stripped before matching ACTION_CFG.
const ACTION_ENTITY_PREFIXES = ["task_", "document_", "doc_", "form_"];
function formatAuditAction(raw) {
  if (!raw) return { label: "—", color: "#6b7280", bg: "#f3f4f6" };
  let key = String(raw).toLowerCase().trim().replace(/\s+/g, "_");
  const prefix = ACTION_ENTITY_PREFIXES.find(p => key.startsWith(p));
  if (prefix) key = key.slice(prefix.length);
  if (ACTION_CFG[key]) return ACTION_CFG[key];
  // Unrecognized action from the backend: title-case it rather than
  // showing a raw snake_case/enum value.
  const label = String(raw).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return { label, color: "#374151", bg: "#f3f4f6" };
}

/* Standard reason buckets for the Returned / Rejected report's "Common Reasons
   Analysis". Backends rarely send a clean enum for why something bounced, so
   free-text (rejection_reason / return_reason / remarks / notes) is matched
   against keywords and sorted into one of these categories. Anything that
   doesn't match, or has no reason text at all, falls into "Other Reasons". */
const REASON_CATEGORIES = [
  { name: "Missing Requirements",              color: "#dc2626", keywords: ["missing", "requirement", "lacking", "not attached", "not submitted"] },
  { name: "Incomplete Information",            color: "#d97706", keywords: ["incomplete", "information", "detail", "field", "unfilled", "blank"] },
  { name: "Incorrect Document Format",         color: "#7c3aed", keywords: ["format", "template", "layout", "wrong file", "file type"] },
  { name: "Invalid Supporting Documents",      color: "#0284c7", keywords: ["supporting document", "attachment", "invalid document", "proof", "unreadable", "expired document"] },
  { name: "Policy/Guideline Non-Compliance",   color: "#c2410c", keywords: ["policy", "guideline", "non-compliance", "noncompliant", "violat", "not compliant"] },
  { name: "Other Reasons",                     color: "#6b7280", keywords: [] },
];
function classifyReason(raw) {
  if (!raw) return "Other Reasons";
  const s = String(raw).toLowerCase();
  for (const cat of REASON_CATEGORIES) {
    if (cat.keywords.some(k => s.includes(k))) return cat.name;
  }
  return "Other Reasons";
}

/* Flat rounded-rect badge for role/category-style values (e.g. table pills). */
function Pill({ text, color, bg }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, background: bg, color, whiteSpace: "nowrap" }}>
      {text}
    </span>
  );
}

/* Colored initials avatar, used next to names/identities in tables. */
const AVATAR_PALETTE = [
  { bg: "#dcfce7", color: "#059669" }, { bg: "#fce7f3", color: "#db2777" },
  { bg: "#dbeafe", color: "#2563eb" }, { bg: "#ede9fe", color: "#7c3aed" },
  { bg: "#fef3c7", color: "#b45309" }, { bg: "#e0f2fe", color: "#0284c7" },
  { bg: "#fee2e2", color: "#dc2626" }, { bg: "#d1fae5", color: "#047857" },
];
function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function Avatar({ name, size = 28 }) {
  const cfg = AVATAR_PALETTE[hashStr(name) % AVATAR_PALETTE.length];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "50%", background: cfg.bg, color: cfg.color, fontSize: size * 0.36, fontWeight: 700, flexShrink: 0 }}>
      {initials(name)}
    </span>
  );
}
function NameCell({ name, sub }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <Avatar name={name} />
      <div>
        <div style={{ fontWeight: 500, color: "#1f2937" }}>{name}</div>
        {sub && <div style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</div>}
      </div>
    </div>
  );
}

/* Shared table header/footer styling so every table in this file matches. */
const TH_STYLE = { padding: "10px 16px", fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 };
const TD_STYLE = { padding: "10px 16px", fontSize: 12 };
function TableFoot({ count, total, label }) {
  return (
    <div style={{ padding: "10px 16px", fontSize: 12, color: "#9ca3af" }}>
      Showing {count} of {total} {label}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label className="path-filter-label" style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>{label}</label>
      <select
        className="path-filter-select"
        value={value}
        onChange={onChange}
        style={{ fontSize: 12, padding: "7px 10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#111827", cursor: "pointer", minWidth: 140 }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function KpiCard({ label, value, icon: IconCmp, color, delta, up }) {
  return (
    <div className="path-kpi-card" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconCmp style={{ width: 15, height: 15, color }} />
        </div>
        {delta && (
          <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 10, fontWeight: 700, color: up ? "#059669" : "#dc2626" }}>
            {up ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}{delta}
          </span>
        )}
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{label}</p>
    </div>
  );
}

function PathStatusLedger({ data, total }) {
  const denominator = Math.max(1, total || data.reduce((sum, item) => sum + (item.value || 0), 0));
  return <div className="path-status-ledger"><div className="path-status-total"><strong>{total || 0}</strong><span>documents in workflow</span></div><div className="path-status-ledger-rows">{data.map((item) => <div className="path-status-ledger-row" key={item.name}><div><span>{item.name}</span><strong>{item.value}</strong></div><i><b style={{ width: `${((item.value || 0) / denominator) * 100}%`, background: item.color }} /></i></div>)}</div></div>;
}

function PathRankBars({ data, labelKey = "type", valueKey = "count", color = "#7c3aed", emptyText = "No report data available." }) {
  const max = Math.max(1, ...data.map((item) => Number(item[valueKey]) || 0));
  if (!data.length) return <p className="path-chart-empty">{emptyText}</p>;
  return <div className="path-rank-bars">{data.map((item) => <div className="path-rank-row" key={item[labelKey]}><div><span>{item[labelKey]}</span><strong>{item[valueKey]}</strong></div><i><b style={{ width: `${((Number(item[valueKey]) || 0) / max) * 100}%`, background: color }} /></i></div>)}</div>;
}

function PathTrendChart({ data, series, xKey = "month", emptyText = "No monthly activity available." }) {
  if (data.length < 2) return <p className="path-chart-empty">{emptyText}</p>;
  const values = data.flatMap((item) => series.map((line) => Number(item[line.key]) || 0));
  const max = Math.max(1, ...values);
  const toPoints = (key) => data.map((item, index) => `${18 + (index * 484) / Math.max(1, data.length - 1)},${184 - ((Number(item[key]) || 0) / max) * 154}`).join(" ");
  return <div className="path-trend"><div className="path-trend-scale"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div><div className="path-trend-plot"><svg viewBox="0 0 520 205" preserveAspectRatio="none" role="img" aria-label="Live report trend">{series.map((line) => <polyline key={line.key} points={toPoints(line.key)} fill="none" stroke={line.color} strokeWidth={line.dashed ? "2" : "3"} strokeDasharray={line.dashed ? "5 4" : undefined} strokeLinecap="round" strokeLinejoin="round" />)}{series.slice(0, 2).flatMap((line) => data.map((item, index) => { const x = 18 + (index * 484) / Math.max(1, data.length - 1); const y = 184 - ((Number(item[line.key]) || 0) / max) * 154; return <circle key={`${line.key}-${index}`} cx={x} cy={y} r="3.5" fill="#fff" stroke={line.color} strokeWidth="2" />; }))}</svg></div><div className="path-trend-labels">{data.map((item) => <span key={item[xKey]}>{item[xKey]}</span>)}</div><div className="path-chart-legend">{series.map((line) => <span key={line.key}><i style={{ background: line.color }} />{line.label}</span>)}</div></div>;
}

function PathProcessingRanges({ data }) {
  const max = Math.max(1, ...data.flatMap((item) => [item.fastest, item.avg, item.slowest]).map(Number));
  if (!data.length) return <p className="path-chart-empty">No completed documents are available for processing-time analysis.</p>;
  return <div className="path-processing-ranges"><div className="path-range-scale"><span>0d</span><span>{Math.round(max / 2)}d</span><span>{max}d</span></div>{data.map((item) => <div className="path-range-row" key={item.type}><strong>{item.type}</strong><div><i style={{ left: `${(item.fastest / max) * 100}%`, width: `${Math.max(1, ((item.slowest - item.fastest) / max) * 100)}%` }} /><b className="path-range-fast" style={{ left: `${(item.fastest / max) * 100}%` }} /><b className="path-range-average" style={{ left: `${(item.avg / max) * 100}%` }} /><b className="path-range-slow" style={{ left: `${(item.slowest / max) * 100}%` }} /><span style={{ left: `${(item.avg / max) * 100}%` }}>{item.avg.toFixed(1)}d</span></div></div>)}</div>;
}

function PathFacultyPulse({ data }) {
  const max = Math.max(1, ...data.map((item) => item.assigned || 0));
  if (!data.length) return <p className="path-chart-empty">No faculty workload data available.</p>;
  return <div className="path-faculty-pulse">{data.map((item) => <div className="path-faculty-pulse-row" key={item.name}><div><Avatar name={item.name} size={25} /><strong>{item.name}</strong></div><section><i><b style={{ width: `${((item.completed || 0) / max) * 100}%` }} /><em style={{ width: `${((item.pending || 0) / max) * 100}%` }} /></i><small>{item.completed} complete · {(item.pending || 0) + (item.delayed || 0)} open</small></section><span>{item.assigned}</span></div>)}</div>;
}

function PathOverview({ items, processing, bottlenecks, quickReports, onSelectTab, onExport, onNavigate }) {
  const completed = items.filter((item) => item.done);
  const onTime = completed.length ? Math.round((completed.filter((item) => !item.overdue).length / completed.length) * 1000) / 10 : 0;
  const returned = items.filter((item) => item.status === "Returned").length;
  const approved = items.filter((item) => item.status === "Approved" || item.status === "Completed").length;
  const reviewing = items.filter((item) => item.status === "Under Review" || item.status === "For Approval").length;
  const atRisk = items.filter((item) => item.overdue || item.status === "Delayed").length;
  const average = processing.length ? processing.reduce((sum, item) => sum + item.avg, 0) / processing.length : 0;
  const flow = [
    { label: "Submitted", value: items.length, color: "#8b5cf6" },
    { label: "In review", value: reviewing, color: "#a78bfa" },
    { label: "Approved", value: approved, color: "#7c3aed" },
    { label: "Returned", value: returned, color: "#c4b5fd" },
  ];
  const maxFlow = Math.max(1, ...flow.map((item) => item.value));
  const categories = Object.entries(items.reduce((acc, item) => {
    const key = item.docType || "Other";
    acc[key] ??= { type: key, processed: 0, done: 0, onTime: 0, atRisk: 0 };
    acc[key].processed += 1;
    if (item.done) { acc[key].done += 1; if (!item.overdue) acc[key].onTime += 1; }
    if (item.overdue || item.status === "Delayed") acc[key].atRisk += 1;
    return acc;
  }, {})).map(([, item]) => ({ ...item, onTimeRate: item.done ? Math.round((item.onTime / item.done) * 100) : 0 })).sort((a, b) => b.processed - a.processed).slice(0, 4);
  const library = quickReports.slice(0, 3);
  const cards = [
    { label: "Documents processed", value: items.length, note: "Live reporting window", icon: FileText, tone: "violet" },
    { label: "On-time completion", value: `${onTime}%`, note: completed.length ? `${completed.length} completed records` : "No completed records yet", icon: CheckCircle2, tone: "green" },
    { label: "Average turnaround", value: `${average.toFixed(1)} days`, note: "Across completed document types", icon: Clock, tone: "blue" },
    { label: "Returned for revision", value: returned, note: items.length ? `${((returned / items.length) * 100).toFixed(1)}% of processed records` : "No processed records yet", icon: RotateCcw, tone: "amber" },
  ];
  return <div className="path-overview-workspace">
    <div className="path-overview-metrics">{cards.map(({ label, value, note, icon: Icon, tone }) => <article className={`path-overview-metric ${tone}`} key={label}><div><span>{label}</span><Icon /></div><strong>{value}</strong><small>{note}</small></article>)}</div>
    <div className="path-overview-main-grid">
      <section className="path-overview-panel path-flow-panel"><header><div><span>Workflow health</span><h2>Document flow</h2><p>Shares of records by current lifecycle stage.</p></div><button onClick={() => onSelectTab("Transactions")} aria-label="Open Transactions"><ChevronRight /></button></header><div className="path-flow-total"><strong>{items.length}</strong><span>documents processed</span></div><div className="path-flow-bars">{flow.map((item) => <div key={item.label}><div><span>{item.label}</span><strong>{item.value}</strong></div><i><b style={{ width: `${(item.value / maxFlow) * 100}%`, background: item.color }} /></i></div>)}</div></section>
      <section className="path-overview-panel path-health-panel"><header><div><span>SLA monitoring</span><h2>Service level health</h2><p>How consistently active workflows close within target.</p></div><div className="path-health-state"><i />Healthy</div></header><div className="path-health-main"><div className="path-health-ring" style={{ "--health": String(onTime) }}><strong>{onTime}%</strong><small>on time</small></div><div><strong>Healthy workflow</strong><p>Service health is calculated from the completed records in the active filter window.</p><button onClick={() => onNavigate("/sla-configuration")}>Review SLA policies <ChevronRight /></button></div></div><footer><div><span>At risk</span><strong>{String(atRisk).padStart(2, "0")}</strong><small>Needs attention</small></div><div><span>Avg. turnaround</span><strong>{average.toFixed(1)}d</strong><small>Live average</small></div><div><span>Escalations</span><strong>{String(bottlenecks.filter((item) => item.severity === "Critical").length).padStart(2, "0")}</strong><small>Critical stages</small></div></footer></section>
    </div>
    <div className="path-overview-bottom-grid">
      <section className="path-overview-panel path-category-panel"><header><div><span>Document mix</span><h2>Category performance</h2><p>Throughput and on-time completion by document type.</p></div><button onClick={() => onExport("Full Analytics Report", "Excel")}>Export data <ChevronRight /></button></header><div className="path-category-table"><div className="path-category-head"><span>Document type</span><span>Processed</span><span>On time</span><span>At risk</span></div>{categories.map((item, index) => <div className="path-category-row" key={item.type}><strong><i className={`dot-${index % 4}`} />{item.type}</strong><span>{item.processed}</span><span>{item.onTimeRate}%</span><em>{item.atRisk ? `${item.atRisk} risk` : "Clear"}</em></div>)}{!categories.length && <p className="path-chart-empty">No category data matches these filters.</p>}</div></section>
      <section className="path-overview-panel path-library-panel"><header><div><span>Saved reports</span><h2>Report library</h2></div><button aria-label="More reports"><Activity /></button></header><div className="path-library-list">{library.map((report, index) => { const Icon = report.icon; return <button key={report.title} onClick={() => report.title === "Audit Trail" ? onNavigate("/audit") : onExport(report.title, "View")}><i className={`path-library-icon item-${index}`}><Icon /></i><span><strong>{report.title}</strong><small>{report.desc}</small></span><em>Open</em><ChevronRight /></button>; })}</div><button className="path-library-create" onClick={() => onExport("Full Analytics Report", "PDF")}>＋ Create custom report</button></section>
    </div>
  </div>;
}

function PdfFileIcon({ size = 14, color }) {
  return (
    <svg viewBox="0 0 460 512" width={size} height={size} style={{ flexShrink: 0 }} fill={color || "currentColor"}>
      <g transform="translate(-25.992746,511.947698) scale(0.1,-0.1)">
        <path d="M1082 5100 c-95 -25 -162 -62 -236 -130 -73 -67 -129 -152 -159 -239 l-22 -66 -5 -975 -5 -975 -55 -7 c-72 -8 -108 -20 -156 -50 -91 -58 -154 -151 -174 -257 -13 -72 -14 -1320 0 -1391 19 -103 91 -206 176 -256 49 -29 133 -54 182 -54 l32 0 0 -98 c0 -185 58 -330 176 -443 76 -71 153 -114 250 -139 75 -19 113 -20 1474 -20 1361 0 1399 1 1474 20 97 25 174 68 250 139 118 113 176 258 176 443 l0 98 33 0 c17 0 56 7 85 14 141 38 248 157 272 303 13 79 13 1315 0 1384 -20 106 -83 199 -174 257 -48 30 -84 42 -156 50 l-55 7 -5 650 -5 650 -26 66 c-50 129 -72 154 -468 550 -380 380 -387 387 -471 427 -47 22 -112 45 -144 51 -40 7 -410 11 -1125 10 -1017 0 -1069 -1 -1139 -19z m2170 -622 l3 -343 26 -56 c15 -32 46 -76 69 -99 23 -23 67 -54 99 -69 l56 -26 328 -3 327 -3 0 -580 0 -579 -1600 0 -1600 0 0 939 c0 685 3 947 12 972 27 80 90 144 173 176 22 8 299 12 1067 12 l1037 1 3 -342z m527 -296 c-140 -2 -206 1 -215 9 -11 9 -14 55 -14 218 l0 206 215 -215 215 -215 -201 -3z m753 -1790 l23 -23 3 -642 c1 -353 0 -652 -3 -665 -3 -12 -14 -31 -25 -42 -20 -20 -42 -20 -1970 -20 -1928 0 -1950 0 -1970 20 -11 11 -22 30 -25 42 -3 13 -4 312 -3 664 3 609 4 643 22 662 10 12 30 23 45 25 14 2 893 4 1953 3 l1927 -1 23 -23z m-374 -1794 c-2 -77 -8 -113 -23 -143 -25 -50 -80 -105 -130 -130 -39 -20 -68 -20 -1445 -20 -1377 0 -1406 0 -1445 20 -50 25 -105 80 -130 130 -15 30 -21 66 -23 143 l-4 102 1602 0 1602 0 -4 -102z"/>
        <path d="M1417 2260 c-58 -18 -56 -1 -57 -556 l0 -511 25 -23 c50 -47 176 -35 205 19 6 11 10 92 10 190 l0 171 119 0 c205 0 310 50 373 177 32 65 33 72 33 183 0 103 -3 121 -26 170 -49 104 -132 160 -264 180 -84 12 -378 12 -418 0z m409 -218 c43 -23 58 -62 59 -147 0 -134 -37 -165 -195 -165 l-90 0 0 166 0 167 103 -5 c56 -2 111 -10 123 -16z"/>
        <path d="M2306 2260 c-15 -5 -37 -17 -47 -26 -18 -16 -19 -40 -19 -536 l0 -518 33 -20 c29 -18 50 -20 214 -20 197 0 261 9 337 47 62 31 101 73 135 143 26 55 26 56 29 340 5 371 -7 424 -104 508 -79 67 -146 84 -364 88 -102 2 -198 -1 -214 -6z m389 -224 c50 -33 55 -64 55 -331 0 -261 -4 -289 -50 -330 -18 -17 -39 -21 -121 -23 l-99 -4 0 357 0 358 95 -5 c65 -4 102 -10 120 -22z"/>
        <path d="M3211 2260 c-70 -17 -66 13 -69 -539 -2 -324 1 -507 8 -525 28 -75 211 -72 231 4 4 14 7 112 8 218 l1 192 113 0 c136 0 154 5 172 41 22 41 18 84 -9 116 -24 28 -26 28 -150 31 l-126 4 0 129 0 129 209 0 c234 0 232 0 251 69 13 51 -5 111 -40 128 -28 14 -540 17 -599 3z"/>
      </g>
    </svg>
  );
}

function ExcelFileIcon({ size = 14, color }) {
  return (
    <svg viewBox="0 0 511 480" width={size} height={size} style={{ flexShrink: 0 }} fill={color || "currentColor"}>
      <g transform="translate(-0.5,495.594586) scale(0.1,-0.1)">
        <path d="M1390 4715 c-955 -181 -1301 -249 -1319 -263 -14 -10 -34 -31 -45 -46 l-21 -27 0 -1818 0 -1818 28 -36 c15 -20 37 -42 48 -48 36 -19 2621 -500 2662 -495 47 5 105 48 123 92 11 26 14 93 14 289 l0 255 1069 2 c1063 3 1070 3 1097 24 15 11 37 33 48 48 l21 27 0 1659 0 1659 -21 27 c-11 15 -33 37 -48 48 -27 21 -34 21 -1096 24 l-1069 2 -3 269 c-3 254 -4 271 -24 297 -34 46 -69 67 -121 70 -32 2 -481 -79 -1343 -241z m1168 -3178 l-3 -1022 -545 102 c-300 56 -803 150 -1117 209 l-573 108 0 1627 0 1627 38 7 c56 10 2057 384 2132 398 l65 13 3 -1023 c1 -563 1 -1483 0 -2046z m2242 1023 l0 -1440 -960 0 -960 0 0 160 0 159 269 3 c254 3 271 4 297 24 53 39 69 71 69 134 0 63 -16 95 -69 134 -26 20 -43 21 -297 24 l-269 3 0 159 0 159 269 3 c254 3 271 4 297 24 53 39 69 71 69 134 0 63 -16 95 -69 134 -26 20 -43 21 -297 24 l-269 3 0 159 0 159 269 3 c254 3 271 4 297 24 53 39 69 71 69 134 0 63 -16 95 -69 134 -26 20 -43 21 -297 24 l-269 3 0 159 0 160 960 0 960 0 0 -1440z"/>
        <path d="M2010 3502 c-25 -12 -88 -85 -218 -252 -101 -129 -212 -272 -248 -318 l-64 -82 -215 244 c-231 263 -244 274 -328 263 -99 -13 -164 -124 -126 -214 12 -28 108 -142 401 -474 l68 -77 -235 -302 c-245 -315 -254 -331 -240 -407 9 -48 71 -109 120 -119 43 -8 93 1 123 22 12 8 115 134 228 280 113 145 209 266 214 269 5 3 119 -120 254 -274 198 -226 252 -281 282 -291 130 -43 256 89 201 212 -7 15 -127 158 -267 318 -140 160 -256 295 -258 300 -2 5 116 163 262 350 188 242 267 351 272 376 25 132 -107 236 -226 176z"/>
        <path d="M3935 3666 c-68 -30 -105 -106 -90 -183 8 -47 71 -109 117 -118 18 -4 119 -5 225 -3 210 3 218 5 267 72 29 39 29 133 0 172 -50 67 -55 69 -282 71 -157 2 -214 0 -237 -11z"/>
        <path d="M3935 3026 c-68 -30 -105 -106 -90 -183 8 -47 71 -109 117 -118 18 -4 119 -5 225 -3 210 3 218 5 267 72 29 39 29 133 0 172 -50 67 -55 69 -282 71 -157 2 -214 0 -237 -11z"/>
        <path d="M3935 2386 c-68 -30 -105 -106 -90 -183 8 -47 71 -109 117 -118 18 -4 119 -5 225 -3 210 3 218 5 267 72 29 39 29 133 0 172 -50 67 -55 69 -282 71 -157 2 -214 0 -237 -11z"/>
        <path d="M3935 1746 c-68 -30 -105 -106 -90 -183 8 -47 71 -109 117 -118 18 -4 119 -5 225 -3 210 3 218 5 267 72 29 39 29 133 0 172 -50 67 -55 69 -282 71 -157 2 -214 0 -237 -11z"/>
      </g>
    </svg>
  );
}

function ExportButtons({ onExport, size = "normal" }) {
  const pad = size === "small" ? "5px 10px" : "8px 14px";
  const fs = size === "small" ? 10 : 11;
  const iconSize = size === "small" ? 13 : 15;
  return (
    <div className="path-export-buttons" style={{ display: "flex", gap: 6 }}>
      <button
        onClick={() => onExport("PDF")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: pad, borderRadius: 8, background: "#7c3aed", color: "#fff", border: "none", fontSize: fs, fontWeight: 700, cursor: "pointer" }}
      >
        <PdfFileIcon size={iconSize} /> Export PDF
      </button>
      <button
        onClick={() => onExport("Excel")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: pad, borderRadius: 8, background: "#fff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: fs, fontWeight: 700, cursor: "pointer" }}
      >
        <ExcelFileIcon size={iconSize} /> Export Excel
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Sample data — copied from the updated report mockup (App.tsx). Swap these
   for live fetches whenever you're ready to wire this page to real data.
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════════
   NOTE: KPI_DATA, STATUS_PIE, DOC_TYPE_BAR, MONTHLY_TREND, DELAYED_TRANSACTIONS,
   PROCESSING_TIME_DATA, FACULTY_WORKLOAD, BOTTLENECKS, REJECTED_DOCS,
   REJECTION_TREND, RETURNED_SUMMARY, and AUDIT_TRAIL are no longer static
   sample arrays — they are computed inside the Reports() component below
   from live API data (see the fetch* functions and useMemo blocks).
   ══════════════════════════════════════════════════════════════════════ */


const QUICK_REPORTS = [
  { title: "Transaction Summary",         icon: Layers,        desc: "Complete overview of all transactions",       color: "#7c3aed" },
  { title: "Pending Transactions",        icon: Clock,         desc: "All transactions awaiting action",            color: "#d97706" },
  { title: "Completed Transactions",      icon: CheckCircle2,  desc: "Successfully processed transactions",         color: "#059669" },
  { title: "Delayed Transactions",        icon: AlertTriangle, desc: "Transactions past SLA thresholds",            color: "#f97316" },
  { title: "Faculty Workload",            icon: Users,         desc: "Per-faculty load and completion rates",       color: "#0284c7" },
  { title: "Processing Time",             icon: Activity,      desc: "Average times per document type",             color: "#8b5cf6" },
  { title: "Monthly / Semestral Report",  icon: Calendar,      desc: "Aggregated performance by period",            color: "#ec4899" },
  { title: "Audit Trail",                 icon: Shield,        desc: "Full system activity log",                   color: "#64748b" },
];

/* ══════════════════════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════════════════ */

export default function Reports() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(atob(token.split(".")[1])); } catch { return {}; } })();
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [docTypeFilter, setDocTypeFilter] = useState("All Document Types");
  const [facultyFilter, setFacultyFilter] = useState("All Faculty");
  const [exportToast, setExportToast] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [delayedPage, setDelayedPage] = useState(1);

  // ── Returned / Rejected report — detail-view modal state ──
  const [rrSelected, setRrSelected] = useState(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [alertsTierFilter, setAlertsTierFilter] = useState("all");
  const [alertsSearch, setAlertsSearch] = useState("");

  /* ════════════════════════════════════════════════════════════════════
     Live data — same fetch pattern as Dashboard.jsx (fetchTrackedItems /
     fetchFacultyPerformance / fetchDelayedDocuments), plus an audit-log
     fetch. Everything below this block (KPI_DATA, STATUS_PIE, etc.) is
     derived from these via useMemo instead of hard-coded sample data.
     ════════════════════════════════════════════════════════════════════ */

  const [rawItems, setRawItems] = useState([]);       // merged documents + tasks + forms
  const [itemsLoading, setItemsLoading] = useState(true);
  const [facultyPerformance, setFacultyPerformance] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [delayedDocs, setDelayedDocs] = useState([]);
  const [delayedLoading, setDelayedLoading] = useState(true);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditUnavailable, setAuditUnavailable] = useState(false);

  const REAL_STATUS_DISPLAY = {
    "pending":        "Pending",
    "in review":      "Under Review",
    "for approval":   "For Approval",
    "returned":       "Returned",
    "received":       "Approved",
    "approved":       "Approved",
    "rejected":       "Rejected",
    "archived":       "Completed",
    "registered":     "Approved",
    "completed":      "Completed",
    "draft":          "Pending",
  };

  const fetchFacultyPerformance = useCallback(async () => {
    setFacultyLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/performance`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const rows = data.faculty ?? data ?? [];
        setFacultyPerformance(Array.isArray(rows) ? rows : []);
      } else {
        setFacultyPerformance([]);
      }
    } catch (err) {
      console.error("Faculty performance fetch error:", err);
      setFacultyPerformance([]);
    } finally {
      setFacultyLoading(false);
    }
  }, [token]);

  const fetchDelayedDocuments = useCallback(async () => {
    setDelayedLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/delayed-documents`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const rows = data.delayed ?? [];
        setDelayedDocs(Array.isArray(rows) ? rows : []);
      } else {
        setDelayedDocs([]);
      }
    } catch (err) {
      console.error("Delayed documents fetch error:", err);
      setDelayedDocs([]);
    } finally {
      setDelayedLoading(false);
    }
  }, [token]);

  // Audit log fetch — same endpoint AuditTrail.jsx uses (GET /api/audit,
  // response is either a bare array or { logs: [...] }).
  const fetchAuditTrail = useCallback(async () => {
    if (!canViewAdminNav) { setAuditLoading(false); return; } // matches AUDIT_ROLES in AuditTrail.jsx
    setAuditLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/audit`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const rows = Array.isArray(data) ? data : (data.logs || []);
        setAuditTrail(Array.isArray(rows) ? rows : []);
        setAuditUnavailable(false);
      } else {
        setAuditTrail([]);
        setAuditUnavailable(true);
      }
    } catch (err) {
      console.error("Audit trail fetch error:", err);
      setAuditTrail([]);
      setAuditUnavailable(true);
    } finally {
      setAuditLoading(false);
    }
  }, [token, canViewAdminNav]);

  const fetchTrackedItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const merged = [];
      const now = new Date();

      const userMap = {};
      try {
        const res = await fetch(`${API}/api/users`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const users = data.users ?? data ?? [];
          (Array.isArray(users) ? users : []).forEach(u => {
            userMap[u.id] = u.full_name || u.name || u.username || `User #${u.id}`;
          });
        }
      } catch (err) { console.error("Users fetch error:", err); }
      const nameOf = (id) => userMap[id] || (id ? `User #${id}` : "—");

      const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
      const monthOf = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short" }) : null;
      const daysSince = (d) => d ? Math.max(0, Math.floor((now - new Date(d)) / 86400000)) : 0;
      const displayStatus = (s) => REAL_STATUS_DISPLAY[s?.toLowerCase()] || s || "Pending";
      const DONE = ["Approved", "Rejected", "Completed"];

      // ── Documents ──
      try {
        const res = await fetch(`${API}/api/tracking`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const documents = data.documents || data || [];
          (Array.isArray(documents) ? documents : []).forEach(d => {
            const rawDate = d.submitted_at || d.created_at;
            const status = displayStatus(d.status);
            const reasonRaw = d.rejection_reason || d.return_reason || d.reason || d.remarks || d.notes || null;
            const actionDateRaw = d.reviewed_at || d.action_date || d.updated_at || rawDate;
            merged.push({
              id: d.tracking_id || d.document_id || `DOC-${d.id}`,
              sourceType: "document",
              docType: d.document_type || d.category || "Other",
              title: d.title || d.document_type || "Document",
              person: d.submitted_by_name || (d.submitted_by ? nameOf(d.submitted_by) : null) || d.department || "—",
              department: d.department || d.dept || "—",
              rawDate, date: fmtDate(rawDate), month: monthOf(rawDate),
              status, done: DONE.includes(status),
              days: daysSince(rawDate),
              stage: d.current_stage || d.stage || status,
              reasonRaw, reasonCategory: classifyReason(reasonRaw),
              actionDate: fmtDate(actionDateRaw),
              reviewerRemarks: d.reviewer_remarks || d.remarks || null,
              attachments: d.attachments || d.documents || d.files || [],
            });
          });
        }
      } catch (err) { console.error("Tracking fetch error:", err); }

      // ── Tasks ──
      try {
        const res = await fetch(`${API}/api/tasks`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks ?? data ?? [];
          (Array.isArray(tasks) ? tasks : []).forEach(t => {
            const rawDate = t.created_at || t.deadline;
            const status = displayStatus(t.status);
            const done = DONE.includes(status);
            // A task's status only gets relabeled "Delayed" while it's still
            // awaiting the faculty's own submission — once it's sitting in
            // "For Approval" or "Under Review" it stays in that bucket so it
            // doesn't disappear from those counts. But the `overdue` flag
            // itself is independent of that: a task whose deadline has
            // passed is overdue regardless of what stage it's now in, so
            // "For Approval"/"Under Review" items past their deadline still
            // count toward Overdue KPIs and tables.
            const alreadySubmitted = ["For Approval", "Under Review"].includes(status);
            const overdue = t.deadline && new Date(t.deadline) < now && !done;
            const relabelDelayed = overdue && !alreadySubmitted;
            const reasonRaw = t.rejection_reason || t.return_reason || t.reason || t.remarks || null;
            const actionDateRaw = t.reviewed_at || t.updated_at || rawDate;
            merged.push({
              id: t.tracking_id || `TSK-${t.id}`,
              sourceType: "task",
              docType: t.doc_type || t.category || "Task",
              title: t.title,
              person: nameOf(t.faculty_id),
              department: t.department || "—",
              rawDate, date: fmtDate(t.deadline || rawDate), month: monthOf(rawDate),
              status: relabelDelayed ? "Delayed" : status, done,
              days: daysSince(rawDate),
              stage: relabelDelayed ? "Delayed" : status,
              overdue,
              reasonRaw, reasonCategory: classifyReason(reasonRaw),
              actionDate: fmtDate(actionDateRaw),
              reviewerRemarks: t.reviewer_remarks || t.remarks || null,
              attachments: t.attachments || [],
            });
          });
        }
      } catch (err) { console.error("Tasks fetch error:", err); }

      // ── Forms ──
      try {
        const res = await fetch(`${API}/api/forms/all`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const forms = data.forms ?? data ?? [];
          (Array.isArray(forms) ? forms : []).forEach(f => {
            const rawDate = f.filing_date || f.created_at;
            const status = displayStatus(f.status);
            const facultySubmitter =
              f.full_name || f.submitter_name || f.submitted_by || f.faculty_name ||
              f.user_name || f.username ||
              (f.user_id    ? nameOf(f.user_id)    : null) ||
              (f.faculty_id ? nameOf(f.faculty_id) : null) ||
              "—";
            const reasonRaw = f.rejection_reason || f.return_reason || f.reason || f.remarks || null;
            const actionDateRaw = f.reviewed_at || f.updated_at || rawDate;
            merged.push({
              id: f.tracking_id || `FRM-${f.id}`,
              sourceType: "form",
              docType: f.category || "Form",
              title: f.category ? `${f.category} Form` : "Form Submission",
              person: facultySubmitter,
              department: f.department || "—",
              rawDate, date: fmtDate(rawDate), month: monthOf(rawDate),
              status, done: DONE.includes(status),
              days: daysSince(rawDate),
              stage: status,
              reasonRaw, reasonCategory: classifyReason(reasonRaw),
              actionDate: fmtDate(actionDateRaw),
              reviewerRemarks: f.reviewer_remarks || f.remarks || null,
              attachments: f.attachments || [],
            });
          });
        }
      } catch (err) { console.error("Forms fetch error:", err); }

      setRawItems(merged);
    } finally {
      setItemsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchTrackedItems();
    fetchFacultyPerformance();
    fetchDelayedDocuments();
    fetchAuditTrail();
  }, [token, fetchTrackedItems, fetchFacultyPerformance, fetchDelayedDocuments, fetchAuditTrail]);

  // ── Apply the filter bar to the merged item list ──
  //
  // NOTE on the date range vs. "open" statuses: the date range is meant to
  // answer "what happened in this window" (things that were resolved —
  // approved/rejected/completed — in the last N days). It is NOT meant to
  // hide items that are still sitting in the queue right now just because
  // they were *created* outside that window. A task assigned 45 days ago
  // that got submitted for approval yesterday is very much a *current*
  // "For Approval" item, even under a "Last 30 Days" filter — its `days`
  // reflects created_at, not when it entered its current status. So
  // still-open statuses (Pending / For Approval / Under Review / Delayed /
  // Returned) always pass the date filter; only closed/resolved statuses
  // (Approved / Completed / Rejected) get gated by it.
  const RANGE_DAYS = { "Last 7 Days": 7, "Last 30 Days": 30, "This Semester": 120, "This Year": 365 };
  const OPEN_STATUSES = ["Pending", "For Approval", "Under Review", "Delayed", "Returned"];
  const items = useMemo(() => {
    const cutoffDays = RANGE_DAYS[dateRange];
    return rawItems.filter(it => {
      const isOpen = OPEN_STATUSES.includes(it.status);
      if (cutoffDays && !isOpen && it.days > cutoffDays) return false;
      if (statusFilter !== "All Statuses" && it.status !== statusFilter) return false;
      if (docTypeFilter !== "All Document Types" && it.docType !== docTypeFilter) return false;
      if (facultyFilter !== "All Faculty" && it.person !== facultyFilter) return false;
      return true;
    });
  }, [rawItems, dateRange, statusFilter, docTypeFilter, facultyFilter]);

  // ── KPI cards ──
  const KPI_DATA = useMemo(() => {
    const count = (pred) => items.filter(pred).length;
    return [
      { label: "Total Transactions", value: items.length, icon: Layers,        color: "#7c3aed" },
      { label: "Pending",            value: count(i => i.status === "Pending"),          icon: Clock,         color: "#d97706" },
      { label: "For Approval",       value: count(i => i.status === "For Approval"),     icon: ClipboardList, color: "#0891b2" },
      { label: "Approved",           value: count(i => i.status === "Approved"),         icon: CheckCircle2,  color: "#0284c7" },
      { label: "Rejected",           value: count(i => i.status === "Rejected"),         icon: XCircle,       color: "#dc2626" },
      { label: "Delayed",            value: count(i => i.status === "Delayed"),          icon: AlertTriangle, color: "#f97316" },
      { label: "Overdue",            value: count(i => i.overdue),                       icon: AlertCircle, color: "#dc2626" },
    ];
  }, [items]);

  // ── By-status pie ──
  const STATUS_PIE = useMemo(() => {
    const cfg = [
      { name: "Pending",   color: "#d97706" },
      { name: "Approved",  color: "#0284c7" },
      { name: "Completed", color: "#059669" },
      { name: "Rejected",  color: "#dc2626" },
      { name: "Delayed",   color: "#f97316" },
    ];
    return cfg.map(c => ({ ...c, value: items.filter(i => i.status === c.name).length }));
  }, [items]);

  // ── By document type bar ──
  const DOC_TYPE_BAR = useMemo(() => {
    const counts = {};
    items.forEach(i => { counts[i.docType] = (counts[i.docType] || 0) + 1; });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // ── Monthly submitted / completed / delayed trend (last 7 months present in the data) ──
  const MONTHLY_TREND = useMemo(() => {
    const byMonth = {};
    rawItems.forEach(i => {
      if (!i.month) return;
      byMonth[i.month] ??= { month: i.month, submitted: 0, completed: 0, delayed: 0, order: new Date(i.rawDate).getTime() };
      byMonth[i.month].submitted += 1;
      if (i.status === "Completed" || i.status === "Approved") byMonth[i.month].completed += 1;
      if (i.status === "Delayed") byMonth[i.month].delayed += 1;
    });
    return Object.values(byMonth).sort((a, b) => a.order - b.order).slice(-7);
  }, [rawItems]);

  // ── Delayed transactions table (dedicated delayed-documents endpoint,
  //    merged with overdue TASK items so the table always reflects every
  //    overdue transaction — the same set the "Overdue" KPI card counts —
  //    not just the document-scoped subset that endpoint returns) ──
  const DELAYED_TRANSACTIONS = useMemo(() => {
    const now = new Date();
    const fromEndpoint = delayedDocs.map(d => {
      const rawDate = d.deadline || d.due_date || d.submitted_at;
      const days = rawDate ? Math.max(0, Math.floor((now - new Date(rawDate)) / 86400000)) : 0;
      return {
        id: d.tracking_id || d.document_id || d.id,
        docType: d.document_type || d.title || "Document",
        title: d.title || d.document_type || "Document",
        // The delayed-documents endpoint doesn't always label its source —
        // try the common field names first, fall back to "document".
        sourceType: (d.source_type || d.sourceType || d.type || "document").toLowerCase(),
        department: d.department || d.dept || d.category || "—",
        faculty: d.faculty_name || "—",
        status: d.status || "Delayed",
        stage: d.stage || d.current_stage || "—",
        days,
        overdue: days >= 7,
      };
    });

    // Merge in any overdue task items not already covered by the endpoint above.
    const seenIds = new Set(fromEndpoint.map(r => String(r.id)));
    const fromItems = items
      .filter(i => i.overdue && !seenIds.has(String(i.id)))
      .map(i => ({
        id: i.id, docType: i.docType, title: i.title || i.docType,
        sourceType: i.sourceType, department: i.department || "—",
        faculty: i.person, status: i.status,
        stage: i.stage, days: i.days, overdue: i.days >= 7,
      }));

    return [...fromEndpoint, ...fromItems];
  }, [delayedDocs, items]);

  const DELAYED_PAGE_SIZE = 2;
  const delayedPageCount = Math.max(1, Math.ceil(DELAYED_TRANSACTIONS.length / DELAYED_PAGE_SIZE));
  const safeDelayedPage = Math.min(delayedPage, delayedPageCount);
  const delayedStart = (safeDelayedPage - 1) * DELAYED_PAGE_SIZE;
  const pagedDelayedTransactions = DELAYED_TRANSACTIONS.slice(delayedStart, delayedStart + DELAYED_PAGE_SIZE);

  // Purely cosmetic: some tracking_id values come back from the backend as
  // plain numbers (e.g. from /api/faculty/delayed-documents) while others
  // are already formatted like "TASK-2026-0039" (e.g. from /api/tasks).
  // Since DELAYED_TRANSACTIONS merges both sources, format the plain-numeric
  // ones so every row reads consistently — this only affects what's
  // rendered, not the underlying id used for keys/matching.
  const formatTxnId = (id) => {
    const s = String(id ?? "");
    return /^\d+$/.test(s) ? `DOC-${s.padStart(4, "0")}` : s;
  };

  // ── Processing time per document type ──
  // Approximated from elapsed days (submission → now) for items already
  // marked done, since the API doesn't expose an explicit completion
  // timestamp. Treat this as an estimate, not an exact turnaround metric.
  const PROCESSING_TIME_DATA = useMemo(() => {
    const byType = {};
    rawItems.filter(i => i.done).forEach(i => {
      byType[i.docType] ??= [];
      byType[i.docType].push(i.days);
    });
    return Object.entries(byType).map(([type, arr]) => ({
      type,
      avg: arr.reduce((a, b) => a + b, 0) / arr.length,
      fastest: Math.min(...arr),
      slowest: Math.max(...arr),
    }));
  }, [rawItems]);

  // ── Faculty workload (from /api/faculty/performance), with delayed count
  //    matched from /api/faculty/delayed-documents (falls back to counting
  //    "Delayed" items in the merged tracked list for that faculty member). ──
  const FACULTY_WORKLOAD = useMemo(() => {
    return facultyPerformance.map(f => {
      const pending = f.pending_count ?? 0;
      const completed = f.completed_count ?? 0;
      const active = f.active_count ?? 0;
      const name = f.full_name || f.name || "—";
      const delayedFromEndpoint = delayedDocs.filter(d => d.faculty_name === name).length;
      const delayedFromItems = rawItems.filter(i => i.person === name && i.status === "Delayed").length;
      const assigned = active + pending + completed;
      return {
        name,
        assigned,
        pending,
        completed,
        // Only fall back to the merged-items count when the delayed-documents
        // endpoint returned nothing at all — a genuine "0" from that endpoint
        // must NOT be overridden (0 is falsy, so `||` was wrongly treating a
        // real zero the same as "no data").
        delayed: delayedDocs.length > 0 ? delayedFromEndpoint : delayedFromItems,
        // Completion rate is always derived from the same completed/assigned
        // counts shown in this row, so the percentage never contradicts the
        // numbers next to it. (Previously this preferred a raw
        // `performance_score` from the API when present, which could be an
        // unrelated/stale metric and made the bar disagree with the table —
        // e.g. 0 completed showing 98%.)
        rate: Math.round(assigned > 0 ? (completed / assigned) * 100 : 0),
      };
    });
  }, [facultyPerformance, delayedDocs, rawItems]);

  // ── Bottleneck view — grouped by current status/stage since the API doesn't
  //    expose a distinct workflow-stage field beyond status. "Pending",
  //    "Returned", and "For Approval" are statuses rather than true workflow
  //    stages, so we show a friendlier label for them here without touching
  //    the underlying status value used for grouping/filtering elsewhere. ──
  const BOTTLENECK_STAGE_LABELS = {
    "Pending":      "Awaiting Faculty Submission",
    "Returned":     "Awaiting for Revision/Resubmission",
    "For Approval": "Waiting for Approval",
  };
  const BOTTLENECKS = useMemo(() => {
    const groups = {};
    items.filter(i => !i.done).forEach(i => {
      groups[i.stage] ??= { stage: i.stage, waiting: 0, totalDays: 0 };
      groups[i.stage].waiting += 1;
      groups[i.stage].totalDays += i.days;
    });
    return Object.values(groups)
      .map(g => {
        const avgWait = g.waiting ? g.totalDays / g.waiting : 0;
        const severity = avgWait >= 6 ? "Critical" : avgWait >= 4 ? "High" : avgWait >= 2 ? "Medium" : "Low";
        return {
          stage: g.stage,
          label: BOTTLENECK_STAGE_LABELS[g.stage] || g.stage,
          waiting: g.waiting,
          avgWait: Number(avgWait.toFixed(1)),
          severity,
        };
      })
      .sort((a, b) => b.waiting - a.waiting);
  }, [items]);

  // ── Bottleneck & Alerts — real-time list of items requiring immediate
  //    attention, derived straight from rawItems/FACULTY_WORKLOAD (not
  //    scoped to the date/status filter bar, since these are department-
  //    wide operational alerts). Each threshold below is the SLA/rule
  //    used to decide whether something gets flagged. ──
  const ALERT_SLA = {
    approvalWaitDays: 5,   // "For Approval" items waiting longer than this breach SLA
    workflowStagnantDays: 5, // non-task items sitting untouched this long count as a workflow delay
    pendingReviewDays: 5,  // forms pending longer than this get bundled into one alert
    highWorkloadTasks: 6,  // active (not-yet-completed) tasks per faculty before flagging
  };

  const BOTTLENECK_ALERTS = useMemo(() => {
    const alerts = [];
    const active = rawItems.filter(i => !i.done);

    // 1) Overdue Approvals
    active
      .filter(i => i.status === "For Approval" && i.days >= ALERT_SLA.approvalWaitDays)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        const over = i.days - ALERT_SLA.approvalWaitDays;
        alerts.push({
          key: `approval-${i.id}`,
          tier: "critical",
          title: "Overdue Approval",
          message: `${i.id} has been waiting for ${i.days} day${i.days === 1 ? "" : "s"}. SLA exceeded by ${over} day${over === 1 ? "" : "s"}.`,
          icon: AlertTriangle,
        });
      });

    // 2) Overdue Tasks
    active
      .filter(i => i.sourceType === "task" && i.overdue)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        alerts.push({
          key: `task-${i.id}`,
          tier: "critical",
          title: "Overdue Task",
          message: `${i.id} (${i.title || i.docType}) is ${i.days} day${i.days === 1 ? "" : "s"} past deadline.`,
          icon: AlertTriangle,
        });
      });

    // 3) High Workload — faculty carrying more active tasks than the threshold
    FACULTY_WORKLOAD
      .map(f => ({ ...f, active: Math.max(0, f.assigned - f.completed) }))
      .filter(f => f.active >= ALERT_SLA.highWorkloadTasks)
      .sort((a, b) => b.active - a.active)
      .forEach(f => {
        alerts.push({
          key: `workload-${f.name}`,
          tier: "warning",
          title: "High Workload",
          message: `${f.name} has ${f.active} active task${f.active === 1 ? "" : "s"}. May need rebalancing.`,
          icon: Users,
        });
      });

    // 4) Workflow Delay — non-task items stagnant in their current stage
    active
      .filter(i => i.sourceType !== "task" && i.status !== "For Approval" && i.days >= ALERT_SLA.workflowStagnantDays)
      .sort((a, b) => b.days - a.days)
      .forEach(i => {
        alerts.push({
          key: `workflow-${i.id}`,
          tier: "warning",
          title: "Workflow Delay",
          message: `${i.id} (${i.title || i.docType}) has been stagnant for ${i.days} day${i.days === 1 ? "" : "s"}.`,
          icon: Clock,
        });
      });

    // 5) Pending Review — bundled into a single alert
    const pendingCount = active.filter(i => i.status === "Pending" && i.days >= ALERT_SLA.pendingReviewDays).length;
    if (pendingCount > 0) {
      alerts.push({
        key: "pending-review",
        tier: "info",
        title: "Pending Review",
        message: `${pendingCount} form${pendingCount === 1 ? "" : "s"} have been pending for more than ${ALERT_SLA.pendingReviewDays} days without action.`,
        icon: ClipboardList,
      });
    }

    const tierRank = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  }, [rawItems, FACULTY_WORKLOAD]);

  const ALERT_TIER_CFG = {
    critical: { bg: "#fef2f2", border: "#dc2626", iconBg: "#fee2e2", iconColor: "#dc2626", showPill: true },
    warning:  { bg: "#fffbeb", border: "#d97706", iconBg: "#fef3c7", iconColor: "#d97706", showPill: false },
    info:     { bg: "#f5f3ff", border: "#7c3aed", iconBg: "#ede9fe", iconColor: "#7c3aed", showPill: false },
  };

  // ── All Alerts modal: tier counts (for the filter tabs) + the filtered/
  //    searched list actually rendered. Lets someone jump straight to just
  //    the Critical items, or type a task ID, instead of scrolling all 11+. ──
  const ALERT_TIER_COUNTS = useMemo(() => ({
    critical: BOTTLENECK_ALERTS.filter(a => a.tier === "critical").length,
    warning: BOTTLENECK_ALERTS.filter(a => a.tier === "warning").length,
    info: BOTTLENECK_ALERTS.filter(a => a.tier === "info").length,
  }), [BOTTLENECK_ALERTS]);

  const FILTERED_ALERTS = useMemo(() => {
    const q = alertsSearch.trim().toLowerCase();
    return BOTTLENECK_ALERTS.filter(a => {
      if (alertsTierFilter !== "all" && a.tier !== alertsTierFilter) return false;
      if (q && !`${a.title} ${a.message}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [BOTTLENECK_ALERTS, alertsTierFilter, alertsSearch]);

  /* ════════════════════════════════════════════════════════════════════
     Returned / Rejected Transactions Report — dedicated dataset. Built
     from rawItems, scoped to only Returned/Rejected records — every card,
     chart, and table on this tab is specific to that pool.
     ════════════════════════════════════════════════════════════════ */

  const RR_ALL = useMemo(() => (
    rawItems.filter(i => i.status === "Returned" || i.status === "Rejected")
  ), [rawItems]);

  // ── KPI summary: totals + rates + most common reason (computed off the
  //    full Returned/Rejected pool, not the filtered table, so the cards
  //    read as department-wide health metrics while the table below can
  //    still be sliced by the filter row). ──
  const RR_KPI = useMemo(() => {
    const totalReturned = RR_ALL.filter(i => i.status === "Returned").length;
    const totalRejected = RR_ALL.filter(i => i.status === "Rejected").length;
    const totalAll = rawItems.length || 1;
    const reasonCounts = {};
    RR_ALL.forEach(i => { reasonCounts[i.reasonCategory] = (reasonCounts[i.reasonCategory] || 0) + 1; });
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    return {
      totalReturned,
      totalRejected,
      returnRate: ((totalReturned / totalAll) * 100).toFixed(1),
      rejectionRate: ((totalRejected / totalAll) * 100).toFixed(1),
      mostCommonReason: topReason ? topReason[0] : "—",
    };
  }, [RR_ALL, rawItems]);

  // ── Common Reasons Analysis (bar + pie) ──
  const RR_REASON_BREAKDOWN = useMemo(() => (
    REASON_CATEGORIES.map(c => ({ name: c.name, color: c.color, value: RR_ALL.filter(i => i.reasonCategory === c.name).length }))
  ), [RR_ALL]);

  // ── Trends & Analytics: returned/rejected per month + combined rate ──
  const RR_MONTHLY_TREND = useMemo(() => {
    const byMonth = {};
    RR_ALL.forEach(i => {
      if (!i.month) return;
      byMonth[i.month] ??= { month: i.month, returned: 0, rejected: 0, order: new Date(i.rawDate).getTime(), totalThatMonth: 0 };
      if (i.status === "Returned") byMonth[i.month].returned += 1;
      if (i.status === "Rejected") byMonth[i.month].rejected += 1;
    });
    rawItems.forEach(i => { if (i.month && byMonth[i.month]) byMonth[i.month].totalThatMonth += 1; });
    return Object.values(byMonth)
      .sort((a, b) => a.order - b.order)
      .slice(-8)
      .map(m => ({ ...m, rate: m.totalThatMonth ? Number((((m.returned + m.rejected) / m.totalThatMonth) * 100).toFixed(1)) : 0 }));
  }, [RR_ALL, rawItems]);

  // ── Most affected document types ──
  const RR_DOC_TYPE_AFFECTED = useMemo(() => {
    const counts = {};
    RR_ALL.forEach(i => { counts[i.docType] = (counts[i.docType] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [RR_ALL]);

  // ── Audit trail — sourced from GET /api/audit (see fetchAuditTrail) ──
  // Only document/task/form activity (TASK_APPROVE, TASK_SUBMIT, etc) shows
  // here — every entry that's ever been logged with one of those action
  // codes, old and new alike. Login and user-account events (LOGIN,
  // USER_DELETE, USER_DEACTIVATE, etc) are always excluded.
  const isDocumentRelated = (a) => {
    const entity = (a.entity_type || a.entity || a.target_type || "").toLowerCase();
    if (entity) return ["task", "document", "doc", "form"].includes(entity);
    const action = String(a.action || "").toLowerCase();
    return ["task_", "document_", "doc_", "form_"].some(p => action.startsWith(p));
  };

  const AUDIT_TRAIL = useMemo(() => {
    return auditTrail
      .filter(isDocumentRelated)
      .map(a => {
      const oldStatus = a.old_status || a.previous_status || a.from_status || null;
      const newStatus = a.new_status || a.current_status || a.to_status || a.status || null;

      // Remarks: prefer an explicit change (old → new status), then any
      // free-text detail from the backend, then a plain fallback.
      let remarks = a.detail || "";
      if (oldStatus && newStatus && oldStatus !== newStatus) {
        remarks = `Status changed: ${oldStatus} → ${newStatus}${a.detail ? ` — ${a.detail}` : ""}`;
      } else if (!remarks && newStatus) {
        remarks = `Status set to ${newStatus}`;
      } else if (!remarks) {
        remarks = "—";
      }

      return {
        date: a.timestamp
          ? new Date(a.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
          : "—",
        user: a.user?.full_name || a.user?.username || "System",
        action: formatAuditAction(a.action),
        transaction: a.document_id ? `#${a.document_id}` : "—",
        remarks,
      };
    });
  }, [auditTrail]);

  // Best-effort match of a transaction's workflow history from the global
  // audit trail (audit rows only carry a document_id, not the tracking_id
  // shown in this table, so we match on the numeric id when possible).
  const rrWorkflowHistory = (item) => {
    if (!item) return [];
    const idDigits = String(item.id).replace(/\D/g, "");
    if (!idDigits) return [];
    return AUDIT_TRAIL.filter(a => a.transaction && a.transaction.replace(/\D/g, "") === idDigits);
  };

  /* ════════════════════════════════════════════════════════════════════
     Overview-tab-only data. Kept separate from KPI_DATA / STATUS_PIE /
     DOC_TYPE_BAR / MONTHLY_TREND above so the Transactions tab (and every
     other tab) keeps behaving exactly as before — only Overview reads
     from these.
     ════════════════════════════════════════════════════════════════ */

  // ── KPI cards: Total / Pending / Completed / Rejected+Returned / Delayed / Avg Processing Time ──
  const OVERVIEW_KPI_DATA = useMemo(() => {
    const count = (pred) => items.filter(pred).length;
    const avgProcessing = PROCESSING_TIME_DATA.length
      ? PROCESSING_TIME_DATA.reduce((a, b) => a + b.avg, 0) / PROCESSING_TIME_DATA.length
      : 0;
    return [
      { label: "Total Transactions",   value: items.length,                                          icon: Layers,        color: "#7c3aed" },
      { label: "Pending",              value: count(i => i.status === "Pending"),                     icon: Clock,         color: "#d97706" },
      { label: "For Approval",         value: count(i => i.status === "For Approval"),                icon: ClipboardList, color: "#0891b2" },
      { label: "Approved",             value: count(i => i.status === "Approved" || i.status === "Completed"), icon: CheckCircle2, color: "#059669" },
      { label: "Rejected / Returned",  value: count(i => i.status === "Rejected") + count(i => i.status === "Returned"), icon: XCircle, color: "#dc2626" },
      { label: "Delayed",              value: count(i => i.status === "Delayed"),                     icon: AlertTriangle, color: "#f97316" },
      { label: "Overdue",              value: count(i => i.overdue),                                  icon: AlertCircle,   color: "#dc2626" },
      { label: "Avg. Processing Time", value: `${avgProcessing.toFixed(1)}d`,                         icon: Gauge,         color: "#0284c7" },
    ];
  }, [items, PROCESSING_TIME_DATA]);

  // ── Transaction Status Overview donut: full status distribution, including
  //    Delayed and For Approval alongside the standard workflow statuses ──
  const OVERVIEW_STATUS_DONUT = useMemo(() => {
    const cfg = [
      { name: "Pending",      color: "#d97706" },
      { name: "For Approval", color: "#0891b2" },
      { name: "Under Review", color: "#0ea5e9" },
      { name: "Approved",     color: "#0284c7" },
      { name: "Delayed",      color: "#f97316" },
      { name: "Returned",     color: "#c2410c" },
      { name: "Rejected",     color: "#dc2626" },
      { name: "Completed",    color: "#059669" },
    ];
    return cfg.map(c => ({ ...c, value: items.filter(i => i.status === c.name).length })).filter(c => c.value > 0);
  }, [items]);

  // ── Monthly trend growth indicator (first vs. last month in view) ──
  const OVERVIEW_TREND_GROWTH = useMemo(() => {
    if (MONTHLY_TREND.length < 2) return null;
    const first = MONTHLY_TREND[0].submitted;
    const last = MONTHLY_TREND[MONTHLY_TREND.length - 1].submitted;
    if (!first) return null;
    return Number((((last - first) / first) * 100).toFixed(1));
  }, [MONTHLY_TREND]);

  // ── Faculty Workload Snapshot: top 5 by assigned load ──
  const FACULTY_SNAPSHOT = useMemo(() => (
    [...FACULTY_WORKLOAD].sort((a, b) => b.assigned - a.assigned).slice(0, 5)
  ), [FACULTY_WORKLOAD]);

  // ── Bottleneck Snapshot: top 3 stages by transactions waiting ──
  const BOTTLENECK_SNAPSHOT = useMemo(() => BOTTLENECKS.slice(0, 3), [BOTTLENECKS]);

  // ── Processing Performance: fastest / average / slowest across all document types ──
  const PROCESSING_SUMMARY = useMemo(() => {
    if (!PROCESSING_TIME_DATA.length) return { fastest: 0, avg: 0, slowest: 0 };
    return {
      fastest: Math.min(...PROCESSING_TIME_DATA.map(d => d.fastest)),
      avg: PROCESSING_TIME_DATA.reduce((a, b) => a + b.avg, 0) / PROCESSING_TIME_DATA.length,
      slowest: Math.max(...PROCESSING_TIME_DATA.map(d => d.slowest)),
    };
  }, [PROCESSING_TIME_DATA]);

  // ── Recent Activity Feed: latest workflow activity ──
  const RECENT_ACTIVITY = useMemo(() => AUDIT_TRAIL.slice(0, 6), [AUDIT_TRAIL]);

  const TABS = [
    "Overview",
    "Transactions",
    "Processing Time",
    "Faculty Workload",
    "Bottleneck",
    "Returned / Rejected",
  ];

  // ── Export engine ──────────────────────────────────────────────────
  // Every "Export PDF" / "Export Excel" button on this page calls
  // handleExport(reportName, format[, context]). buildReportPayload()
  // turns whichever report was requested into the shared
  // { title, subtitle, meta, kpis, tables } shape that reportExport.js
  // knows how to render into a branded PDF or a multi-sheet workbook.
  const activeFilterSummary = [
    `Date range: ${dateRange}`,
    `Status: ${statusFilter}`,
    `Document type: ${docTypeFilter}`,
    `Faculty: ${facultyFilter}`,
  ];

  const buildReportPayload = (reportName, context) => {
    switch (reportName) {
      case "Full Analytics Report":
      case "Monthly / Semestral Report":
        return {
          title: "Full Analytics Report",
          subtitle: "Complete overview of transaction analytics",
          meta: activeFilterSummary,
          kpis: OVERVIEW_KPI_DATA.map(k => ({ label: k.label, value: k.value })),
          tables: [
            { title: "Status Breakdown", columns: ["Status", "Count"], rows: OVERVIEW_STATUS_DONUT.map(s => [s.name, s.value]) },
            { title: "By Document Type", columns: ["Document Type", "Count"], rows: DOC_TYPE_BAR.map(d => [d.type, d.count]) },
            { title: "Monthly Trend", columns: ["Month", "Submitted", "Completed", "Delayed"], rows: MONTHLY_TREND.map(m => [m.month, m.submitted, m.completed, m.delayed]) },
          ],
        };

      case "Delayed Transactions Report":
      case "Delayed Transactions":
        return {
          title: "Delayed Transactions Report",
          subtitle: "Transactions past SLA thresholds",
          meta: activeFilterSummary,
          kpis: [
            { label: "Total Delayed", value: DELAYED_TRANSACTIONS.length },
            { label: "Overdue (7+ days)", value: DELAYED_TRANSACTIONS.filter(d => d.overdue).length },
          ],
          tables: [{
            title: "Delayed Transactions",
            columns: ["Transaction ID", "Document Type", "Faculty", "Status", "Stage", "Days Delayed", "Overdue"],
            rows: DELAYED_TRANSACTIONS.map(d => [formatTxnId(d.id), d.docType, d.faculty, d.status, d.stage, d.days, d.overdue ? "Yes" : "No"]),
          }],
        };

      case "Processing Time Report":
      case "Processing Time":
        return {
          title: "Processing Time Report",
          subtitle: "Average, fastest, and slowest turnaround per document type",
          meta: activeFilterSummary,
          kpis: [
            { label: "Fastest", value: `${PROCESSING_SUMMARY.fastest}d` },
            { label: "Average", value: `${PROCESSING_SUMMARY.avg.toFixed(1)}d` },
            { label: "Slowest", value: `${PROCESSING_SUMMARY.slowest}d` },
          ],
          tables: [{
            title: "Processing Time by Document Type",
            columns: ["Document Type", "Avg (days)", "Fastest (days)", "Slowest (days)"],
            rows: PROCESSING_TIME_DATA.map(p => [p.type, p.avg.toFixed(1), p.fastest, p.slowest]),
          }],
        };

      case "Faculty Workload Report":
      case "Faculty Workload":
        return {
          title: "Faculty Workload Report",
          subtitle: "Per-faculty load and completion rates",
          meta: activeFilterSummary,
          kpis: [
            { label: "Faculty Tracked", value: FACULTY_WORKLOAD.length },
            {
              label: "Avg Completion Rate",
              value: `${FACULTY_WORKLOAD.length ? Math.round(FACULTY_WORKLOAD.reduce((a, b) => a + b.rate, 0) / FACULTY_WORKLOAD.length) : 0}%`,
            },
          ],
          tables: [{
            title: "Faculty Workload",
            columns: ["Faculty", "Assigned", "Pending", "Completed", "Delayed", "Completion Rate"],
            rows: FACULTY_WORKLOAD.map(f => [f.name, f.assigned, f.pending, f.completed, f.delayed, `${f.rate}%`]),
          }],
        };

      case "Transaction Summary":
        return {
          title: "Transaction Summary",
          subtitle: "Complete overview of all transactions",
          meta: activeFilterSummary,
          kpis: KPI_DATA.map(k => ({ label: k.label, value: k.value })),
          tables: [{
            title: "All Transactions",
            columns: ["ID", "Document Type", "Person", "Status", "Stage", "Date", "Days"],
            rows: items.map(i => [i.id, i.docType, i.person, i.status, i.stage, i.date, i.days]),
          }],
        };

      case "Pending Transactions":
      case "Completed Transactions": {
        const statusWanted = reportName === "Pending Transactions" ? "Pending" : "Completed";
        const filtered = items.filter(i => i.status === statusWanted);
        return {
          title: reportName,
          subtitle: `All transactions currently ${statusWanted.toLowerCase()}`,
          meta: activeFilterSummary,
          kpis: [{ label: `Total ${statusWanted}`, value: filtered.length }],
          tables: [{
            title: reportName,
            columns: ["ID", "Document Type", "Person", "Status", "Stage", "Date", "Days"],
            rows: filtered.map(i => [i.id, i.docType, i.person, i.status, i.stage, i.date, i.days]),
          }],
        };
      }

      case "Audit Trail":
        return {
          title: "Audit Trail",
          subtitle: "Full system activity log",
          meta: activeFilterSummary,
          kpis: [{ label: "Total Log Entries", value: AUDIT_TRAIL.length }],
          tables: [{
            title: "Audit Trail",
            columns: ["Date & Time", "User", "Action", "Transaction", "Remarks"],
            rows: AUDIT_TRAIL.map(a => [a.date, a.user, a.action.label, a.transaction, a.remarks]),
          }],
        };

      default: {
        // Single "Transaction {id}" export from the Returned/Rejected detail modal.
        if (reportName.startsWith("Transaction ") && context) {
          const r = context;
          const history = rrWorkflowHistory(r);
          return {
            title: `Transaction ${r.id}`,
            subtitle: `${r.docType} — ${r.status}`,
            meta: [
              `Submitted by: ${r.person}`,
              `Department: ${r.department || "—"}`,
              `Date submitted: ${r.date}`,
              `Date ${(r.status || "").toLowerCase()}: ${r.actionDate}`,
            ],
            kpis: [],
            tables: [
              {
                title: "Return / Rejection Reason",
                columns: ["Category", "Details"],
                rows: [[r.reasonCategory, r.reasonRaw || "No specific reason text was recorded for this transaction."]],
              },
              {
                title: "Reviewer Remarks",
                columns: ["Remarks"],
                rows: [[r.reviewerRemarks || "No additional remarks left by the reviewer."]],
              },
              {
                title: "Complete Workflow History",
                columns: ["Date", "Action", "User", "Remarks"],
                rows: history.length
                  ? history.map(h => [h.date, h.action.label, h.user, h.remarks])
                  : [["—", "—", "—", "No detailed workflow history available for this transaction."]],
              },
            ],
          };
        }
        return null;
      }
    }
  };

  // Quick Reports "View" jumps straight to the tab that already renders
  // that data live, instead of duplicating the view in a new place.
  const QUICK_REPORT_TAB = {
    "Transaction Summary": "Transactions",
    "Pending Transactions": "Transactions",
    "Completed Transactions": "Transactions",
    "Delayed Transactions": "Transactions",
    "Faculty Workload": "Faculty Workload",
    "Processing Time": "Processing Time",
    "Monthly / Semestral Report": "Overview",
    "Audit Trail": "Audit Trail",
  };

  const handleExport = async (reportName, format, context) => {
    if (format === "View") {
      if (QUICK_REPORT_TAB[reportName]) setActiveTab(QUICK_REPORT_TAB[reportName]);
      return;
    }

    setExportToast(`Exporting "${reportName}" as ${format}…`);
    try {
      const payload = buildReportPayload(reportName, context);
      if (!payload) throw new Error(`No data available for "${reportName}"`);
      if (format === "PDF") await exportReportToPDF(payload);
      else await exportReportToExcel(payload);
      setExportToast(`"${reportName}" exported as ${format}.`);
    } catch (err) {
      console.error("Export error:", err);
      setExportToast(`Couldn't export "${reportName}". Please try again.`);
    } finally {
      setTimeout(() => setExportToast(null), 2500);
    }
  };

  return (
    <div className="path-reports-shell" style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#111", background: "#f4f4f8" }}>
      <style>{`${PATH_REPORTS_CSS}${PATH_REPORTS_EXACT_CSS}${PATH_REPORTS_LIVE_CSS}${PATH_OVERVIEW_CSS}${PATH_TRANSACTION_REGISTER_CSS}`}</style>

      {/* ── Sidebar ── */}
      <Sidebar activePage="reports" />
      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "white", minWidth: 0 }}>
        <TopBar onLogout={handleLogout}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>PATH</span>
            <ChevronRight style={{ width: 12, height: 12, color: "#d1d5db" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Reports</span>
          </div>
        </TopBar>

        <div className="path-reports-main" style={{ minHeight: "calc(100vh - 56px)", background: "#f5f4fb", overflowY: "auto" }}>
          <div className="path-reports-content" style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ── 1. Header: title + export (no card) ── */}
            <div className="path-reports-hero" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b5cf6" }}>Decision support · reporting workspace</div>
                <h1 style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>Reports</h1>
                <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>Turn document activity into a clear view of throughput, service levels, and department performance.</p>
              </div>
              <ExportButtons onExport={(fmt) => handleExport("Full Analytics Report", fmt)} />
            </div>

            {(itemsLoading || facultyLoading || delayedLoading) && (
              <div style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 8, padding: "8px 14px" }}>
                Loading live report data…
              </div>
            )}
            {auditUnavailable && activeTab === "Audit Trail" && (
              <div style={{ fontSize: 11, color: "#9a3412", background: "#ffedd5", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 14px" }}>
                Couldn't reach the audit-log endpoint (/api/audit). Check that the API is reachable and the token has admin/program_chair access.
              </div>
            )}

            {/* ── 2. Filters card ── */}
            <div className="path-reports-filter" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 4px rgba(91,33,182,0.05)" }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <FilterSelect label="Date Range" value={dateRange} onChange={e => setDateRange(e.target.value)}
                  options={["Last 7 Days", "Last 30 Days", "This Semester", "This Year", "Custom Range"]} />
                <FilterSelect label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  options={["All Statuses", "Pending", "Approved", "Completed", "Rejected", "Delayed"]} />
                <FilterSelect label="Document Type" value={docTypeFilter} onChange={e => setDocTypeFilter(e.target.value)}
                  options={["All Document Types", "Enrollment", "Completion", "Overload", "Leave", "Transfer", "Waiver", "Other"]} />
                <FilterSelect label="Faculty" value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}
                  options={["All Faculty", ...FACULTY_WORKLOAD.map(f => f.name)]} />
              </div>
            </div>

            {/* ── Tab Bar ── */}
            <div className="path-report-tabs" style={{ display: "flex", gap: 22, borderBottom: "1px solid rgba(0,0,0,0.08)", paddingLeft: 4 }}>
              {TABS.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "0 0 10px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: activeTab === t ? "#7c3aed" : "#6b7280",
                    borderBottom: activeTab === t ? "2px solid #7c3aed" : "2px solid transparent",
                    whiteSpace: "nowrap",
                  }}
                  className={activeTab === t ? "path-tab-active" : ""}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === "Overview__legacy" && (
              <>
            {/* ── KPI Summary Cards ── */}
            <div className="path-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {OVERVIEW_KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Transaction Status Overview · Most Requested Transaction Types · Monthly Transaction Trend ── */}
            <div className="path-overview-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 16 }}>
              <SectionCard title="Transaction Status Overview" subtitle="Live distribution across the workflow" icon={PieIcon}>
                <PathStatusLedger data={OVERVIEW_STATUS_DONUT} total={items.length} />
              </SectionCard>

              <SectionCard title="Most Requested Transaction Types" subtitle="Document/form type by volume" icon={BarChart3}>
                <PathRankBars data={DOC_TYPE_BAR.slice(0, 6)} emptyText="No requested transaction types are available." />
              </SectionCard>

              <SectionCard
                title="Monthly Transaction Trend"
                subtitle="Total transactions per month"
                icon={TrendingUp}
                action={OVERVIEW_TREND_GROWTH !== null && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: OVERVIEW_TREND_GROWTH >= 0 ? "#059669" : "#dc2626", background: OVERVIEW_TREND_GROWTH >= 0 ? "#d1fae5" : "#fee2e2", padding: "3px 8px", borderRadius: 6 }}>
                    {OVERVIEW_TREND_GROWTH >= 0 ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
                    {Math.abs(OVERVIEW_TREND_GROWTH)}%
                  </span>
                )}
              >
                <PathTrendChart data={MONTHLY_TREND} series={[{ key: "submitted", label: "Submitted", color: "#7c3aed" }]} />
              </SectionCard>
            </div>

            {/* ── Faculty Workload Snapshot · Bottleneck Snapshot ── */}
            <div className="path-overview-detail-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start" }}>
              <SectionCard title="Faculty Workload Snapshot" subtitle="Top faculty by assigned transaction volume" icon={Users} noPad
                footer={
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing {FACULTY_SNAPSHOT.length} of {FACULTY_WORKLOAD.length} faculty</span>
                    <button
                      onClick={() => setActiveTab("Faculty Workload")}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      View Full Report <ChevronRight style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                }>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                      {["Faculty Name", "Assigned", "Pending", "Completed", "Completion Rate"].map(h => (
                        <th key={h} style={{ ...TH_STYLE, textAlign: h === "Faculty Name" ? "left" : "center" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {FACULTY_SNAPSHOT.map((f, i) => (
                      <tr key={f.name} style={{ borderBottom: i < FACULTY_SNAPSHOT.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                        <td style={TD_STYLE}><NameCell name={f.name} /></td>
                        <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{f.assigned}</td>
                        <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#d97706", fontWeight: 600 }}>{f.pending}</td>
                        <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{f.completed}</td>
                        <td style={{ ...TD_STYLE, textAlign: "center" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 100 }}>
                            <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                              <div style={{ height: 5, borderRadius: 3, width: `${f.rate}%`, background: f.rate >= 75 ? "#059669" : f.rate >= 60 ? "#d97706" : "#dc2626" }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{f.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {FACULTY_SNAPSHOT.length === 0 && (
                      <tr><td colSpan={5} style={{ ...TD_STYLE, textAlign: "center", color: "#9ca3af", padding: "20px 16px" }}>No faculty workload data yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </SectionCard>

              <SectionCard title="Bottleneck Snapshot" subtitle="Slowest workflow stages right now" icon={AlertTriangle}
                footer={
                  <button
                    onClick={() => setActiveTab("Bottleneck")}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "7px 12px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    View Full Bottleneck Report <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                }>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {BOTTLENECK_SNAPSHOT.map(b => (
                    <div key={b.stage} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "#f8f8fb", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{b.stage}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{b.waiting} waiting · {b.avgWait}d avg wait</p>
                      </div>
                      <SeverityBadge level={b.severity} />
                    </div>
                  ))}
                  {BOTTLENECK_SNAPSHOT.length === 0 && (
                    <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>No active bottlenecks — everything is moving smoothly.</p>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* ── Processing Performance ── */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Processing Performance</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <SectionCard title="Fastest Processing Time" icon={TrendingUp}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>{PROCESSING_SUMMARY.fastest.toFixed(1)}d</p>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "3px 8px", borderRadius: 6 }}>
                      <TrendingUp style={{ width: 10, height: 10 }} /> Best
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Best-case turnaround recorded</p>
                </SectionCard>
                <SectionCard title="Average Processing Time" icon={Gauge}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>{PROCESSING_SUMMARY.avg.toFixed(1)}d</p>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#ede9fe", padding: "3px 8px", borderRadius: 6 }}>
                      <Activity style={{ width: 10, height: 10 }} /> Typical
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Across all document types</p>
                </SectionCard>
                <SectionCard title="Slowest Processing Time" icon={Clock}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 26, fontWeight: 800, color: "#dc2626" }}>{PROCESSING_SUMMARY.slowest.toFixed(1)}d</p>
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "3px 8px", borderRadius: 6 }}>
                      <TrendingDown style={{ width: 10, height: 10 }} /> Watch
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Worst-case turnaround recorded</p>
                </SectionCard>
              </div>
            </div>

            {/* ── Recent Activity Feed ── */}
            <SectionCard title="Recent Activity Feed" subtitle="Latest submissions, approvals, rejections, and workflow updates" icon={ListTodo} noPad
              footer={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>Showing {RECENT_ACTIVITY.length} of {AUDIT_TRAIL.length} log entries</span>
                  <button
                    onClick={() => navigate("/audit")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Open Audit Trail <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              }>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 18px", borderBottom: i < RECENT_ACTIVITY.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <NameCell name={a.user} />
                      <Pill text={a.action.label} bg={a.action.bg} color={a.action.color} />
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#374151" }}>{a.transaction}</span>
                    </div>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap" }}>{a.date}</span>
                  </div>
                ))}
                {RECENT_ACTIVITY.length === 0 && (
                  <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No recent activity to show yet.</p>
                )}
              </div>
            </SectionCard>
              </>
            )}

            {activeTab === "Overview" && (
              <PathOverview
                items={items}
                processing={PROCESSING_TIME_DATA}
                bottlenecks={BOTTLENECKS}
                quickReports={QUICK_REPORTS}
                onSelectTab={setActiveTab}
                onExport={handleExport}
                onNavigate={navigate}
              />
            )}

            {/* ── Transactions tab ── */}
            {activeTab === "Transactions" && (
              <>
            {/* ── KPI Cards ── */}
            <div className="path-kpi-grid path-transactions-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
              {KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Transaction Overview ── */}
            <div className="path-transactions-visuals" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 16 }}>
              <SectionCard title="By Status" icon={PieIcon}>
                <PathStatusLedger data={STATUS_PIE} total={items.length} />
              </SectionCard>

              <SectionCard title="By Document Type" icon={BarChart3}>
                <PathRankBars data={DOC_TYPE_BAR.slice(0, 6)} emptyText="No document-type data matches these filters." />
              </SectionCard>

              <SectionCard title="Monthly Transaction Trend" subtitle="AY 2023–2024" icon={TrendingUp}>
                <PathTrendChart data={MONTHLY_TREND} series={[{ key: "submitted", label: "Submitted", color: "#7c3aed" }, { key: "completed", label: "Completed", color: "#159d77" }, { key: "delayed", label: "Delayed", color: "#d64550", dashed: true }]} />
              </SectionCard>
            </div>

            {/* ── Delayed Transactions Table ── */}
            <section className="path-delay-register">
              <header>
                <div><span>Needs attention</span><h2>Delayed and overdue documents</h2><p>Records waiting beyond their expected workflow window.</p></div>
                <div className="path-delay-header-actions"><ExportButtons size="small" onExport={(fmt) => handleExport("Delayed Transactions Report", fmt)} /><aside><strong>{DELAYED_TRANSACTIONS.length}</strong><small>open exceptions</small></aside></div>
              </header>
              <div className="path-delay-table-wrap">
                <div className="path-delay-table path-delay-head"><span>Transaction ID</span><span>Title / Department</span><span>Assigned faculty</span><span>Status</span><span>Current stage</span><span>Days waiting</span></div>
                {pagedDelayedTransactions.map((d) => <div className="path-delay-table path-delay-row" key={d.id}>
                  <strong>{formatTxnId(d.id)}</strong>
                  <span className="path-delay-title"><b>{d.title || d.docType}</b><small>{d.department || d.docType}</small></span>
                  <span className="path-delay-faculty"><Avatar name={d.faculty} size={25} />{d.faculty}</span>
                  <span className={`path-delay-status ${d.overdue ? "overdue" : "delayed"}`}>{d.status}</span>
                  <span className="path-delay-stage">{d.stage}</span>
                  <span className={`path-delay-days ${d.overdue ? "overdue" : ""}`}><i />{d.days}d</span>
                </div>)}
                {!pagedDelayedTransactions.length && <p className="path-delay-empty">No delayed or overdue documents match the current filters.</p>}
              </div>
              <footer>
                <span>{DELAYED_TRANSACTIONS.length ? `Showing ${delayedStart + 1}–${Math.min(delayedStart + DELAYED_PAGE_SIZE, DELAYED_TRANSACTIONS.length)} of ${DELAYED_TRANSACTIONS.length} exceptions` : "No open exceptions"}</span>
                <div className="path-delay-pagination"><button onClick={() => setDelayedPage(Math.max(1, safeDelayedPage - 1))} disabled={safeDelayedPage === 1} aria-label="Previous page"><ChevronRight style={{ transform: "rotate(180deg)" }} /></button>{Array.from({ length: delayedPageCount }, (_, index) => index + 1).map((page) => <button key={page} className={page === safeDelayedPage ? "active" : ""} onClick={() => setDelayedPage(page)}>{page}</button>)}<button onClick={() => setDelayedPage(Math.min(delayedPageCount, safeDelayedPage + 1))} disabled={safeDelayedPage === delayedPageCount} aria-label="Next page"><ChevronRight /></button></div>
              </footer>
            </section>
              </>
            )}

            {/* ── Processing Time tab ── */}
            {activeTab === "Processing Time" && (
              <>
            {/* ── Processing Time Summary ── */}
            <div className="path-processing-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <SectionCard title="Average Processing Time" icon={Activity}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>
                  {PROCESSING_TIME_DATA.length ? (PROCESSING_TIME_DATA.reduce((a, b) => a + b.avg, 0) / PROCESSING_TIME_DATA.length).toFixed(1) : "0.0"} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Across all document types</p>
              </SectionCard>
              <SectionCard title="Fastest Processing Time" icon={TrendingUp}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#059669" }}>
                  {PROCESSING_TIME_DATA.length ? Math.min(...PROCESSING_TIME_DATA.map(d => d.fastest)).toFixed(1) : "0.0"} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Best-case turnaround recorded</p>
              </SectionCard>
              <SectionCard title="Slowest Processing Time" icon={Clock}>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#dc2626" }}>
                  {PROCESSING_TIME_DATA.length ? Math.max(...PROCESSING_TIME_DATA.map(d => d.slowest)).toFixed(1) : "0.0"} days
                </p>
                <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Worst-case turnaround recorded</p>
              </SectionCard>
            </div>

            <SectionCard title="Processing Time per Document Type" subtitle="Fastest, average, and slowest turnaround in days" icon={Gauge}>
              <PathProcessingRanges data={PROCESSING_TIME_DATA} />
            </SectionCard>

            {/* ── Processing Time Breakdown Table ── */}
            <SectionCard title="Processing Time Breakdown" subtitle="Fastest, average, and slowest turnaround per document type" icon={ClipboardList} noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Processing Time Report", fmt)} />}
              footer={<TableFoot count={PROCESSING_TIME_DATA.length} total={PROCESSING_TIME_DATA.length} label="document types" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Document Type", "Fastest", "Average", "Slowest"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Document Type" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PROCESSING_TIME_DATA.map((p, i) => (
                    <tr key={p.type} style={{ borderBottom: i < PROCESSING_TIME_DATA.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{p.type}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{p.fastest.toFixed(1)}d</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#7c3aed", fontWeight: 600 }}>{p.avg.toFixed(1)}d</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#dc2626", fontWeight: 600 }}>{p.slowest.toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Faculty Workload tab ── */}
            {activeTab === "Faculty Workload" && (
              <>
            {/* ── Workload Comparison ── */}
            <SectionCard title="Workload Comparison" subtitle="Completed vs. pending transactions per faculty member" icon={Users}>
              <PathFacultyPulse data={FACULTY_WORKLOAD} />
            </SectionCard>

            {/* ── Faculty Performance Table ── */}
            <SectionCard title="Faculty Performance Table" subtitle="Assigned transactions, delays, and completion rate per faculty member" icon={ClipboardList} noPad
              action={<ExportButtons size="small" onExport={(fmt) => handleExport("Faculty Workload Report", fmt)} />}
              footer={<TableFoot count={FACULTY_WORKLOAD.length} total={FACULTY_WORKLOAD.length} label="faculty" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Faculty Name", "Assigned", "Pending", "Completed", "Delayed", "Completion Rate"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Faculty Name" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FACULTY_WORKLOAD.map((f, i) => (
                    <tr key={f.name} style={{ borderBottom: i < FACULTY_WORKLOAD.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={TD_STYLE}><NameCell name={f.name} /></td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{f.assigned}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#d97706", fontWeight: 600 }}>{f.pending}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#059669", fontWeight: 600 }}>{f.completed}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: f.delayed > 0 ? "#dc2626" : "#9ca3af", fontWeight: 600 }}>{f.delayed}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 110 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: "#f3f4f6" }}>
                            <div style={{ height: 5, borderRadius: 3, width: `${f.rate}%`, background: f.rate >= 75 ? "#059669" : f.rate >= 60 ? "#d97706" : "#dc2626" }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>{f.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Bottleneck tab ── */}
            {activeTab === "Bottleneck" && (
              <>
            {/* ── Bottleneck & Alerts + Documents Waiting by Stage (side by side) ── */}
            <div className="path-bottleneck-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 18, alignItems: "stretch" }}>
            <SectionCard title="Bottleneck & Alerts" subtitle="Items requiring immediate attention" icon={Shield} noPad>
              {BOTTLENECK_ALERTS.length === 0 ? (
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "24px 18px" }}>No active alerts — everything is moving smoothly.</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 18px" }}>
                    {BOTTLENECK_ALERTS.slice(0, 5).map(a => {
                      const cfg = ALERT_TIER_CFG[a.tier];
                      const AlertIcon = a.icon;
                      return (
                        <div
                          key={a.key}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: 12,
                            background: cfg.bg, borderLeft: `3px solid ${cfg.border}`,
                            borderRadius: 10, padding: "12px 14px",
                          }}
                        >
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <AlertIcon style={{ width: 14, height: 14, color: cfg.iconColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{a.title}</p>
                              {cfg.showPill && (
                                <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#dc2626", color: "#fff", letterSpacing: 0.3 }}>
                                  CRITICAL
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11.5, color: "#4b5563", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {BOTTLENECK_ALERTS.length > 5 && (
                    <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "10px 18px", textAlign: "center" }}>
                      <button
                        onClick={() => setAlertsModalOpen(true)}
                        style={{ background: "none", border: "none", color: "#dc2626", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, cursor: "pointer" }}
                      >
                        {`VIEW ALL ALERTS (${BOTTLENECK_ALERTS.length})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </SectionCard>

            {/* ── Documents Waiting by Stage ── */}
            <SectionCard title="Documents Waiting by Stage" subtitle="Where documents are piling up right now" icon={Activity}>
              {(() => {
                // Show every known workflow stage, not just the ones that
                // currently have a backlog — stages with nothing waiting
                // are still worth seeing (confirms that stage is clear).
                const knownStages = Object.keys(BOTTLENECK_STAGE_LABELS);
                const byStage = new Map(BOTTLENECKS.filter(b => b.stage !== "Delayed").map(b => [b.stage, b]));
                const extraStages = [...byStage.keys()].filter(s => !knownStages.includes(s));
                const stageData = [...knownStages, ...extraStages].map(stage =>
                  byStage.get(stage) || { stage, label: BOTTLENECK_STAGE_LABELS[stage] || stage, waiting: 0, avgWait: 0, severity: "Low" }
                );
                const maxWaiting = Math.max(1, ...stageData.map(b => b.waiting));
                const severityColor = { Critical: "#dc2626", High: "#f97316", Medium: "#d97706", Low: "#059669" };
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {stageData.map(b => {
                      const isEmpty = b.waiting === 0;
                      const color = severityColor[b.severity] || "#6b7280";
                      return (
                        <div key={b.stage} style={{ opacity: isEmpty ? 0.55 : 1 }}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>{b.label}</p>
                            <p style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {isEmpty ? "Nothing waiting" : (<><span style={{ fontWeight: 800, color: "#111827" }}>{b.waiting}</span> waiting · {b.avgWait}d avg</>)}
                            </p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ flex: 1, height: 8, borderRadius: 5, background: "#f3f4f6", overflow: "hidden" }}>
                              <div style={{ height: 8, borderRadius: 5, width: isEmpty ? "0%" : `${Math.max(6, (b.waiting / maxWaiting) * 100)}%`, background: color, transition: "width 0.3s" }} />
                            </div>
                            {!isEmpty && <SeverityBadge level={b.severity} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </SectionCard>
            </div>

            {/* ── Bottleneck Summary ── */}
            <SectionCard title="Bottleneck Summary" subtitle="Workflow stages exceeding expected processing time" icon={AlertTriangle} noPad
              footer={<TableFoot count={BOTTLENECKS.length} total={BOTTLENECKS.length} label="stages" />}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Workflow Stage", "Docs Waiting", "Avg Wait Time", "Severity"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: h === "Workflow Stage" ? "left" : "center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {BOTTLENECKS.map((b, i) => (
                    <tr key={b.stage} style={{ borderBottom: i < BOTTLENECKS.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontWeight: 600, color: "#111827" }}>{b.label}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{b.waiting}</td>
                      <td style={{ ...TD_STYLE, textAlign: "center", fontFamily: "monospace", color: "#374151" }}>{b.avgWait}d avg</td>
                      <td style={{ ...TD_STYLE, textAlign: "center" }}><SeverityBadge level={b.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Returned / Rejected tab ── */}
            {activeTab === "Returned / Rejected" && (
              <>
            {/* ── KPI Summary Cards ── */}
            <div className="path-returned-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              <KpiCard label="Total Returned"   value={RR_KPI.totalReturned}          icon={RotateCcw}   color="#c2410c" />
              <KpiCard label="Total Rejected"   value={RR_KPI.totalRejected}           icon={XCircle}     color="#dc2626" />
              <KpiCard label="Return Rate"      value={`${RR_KPI.returnRate}%`}        icon={Percent}     color="#d97706" />
              <KpiCard label="Rejection Rate"   value={`${RR_KPI.rejectionRate}%`}     icon={Gauge}       color="#7c3aed" />
              <KpiCard label="Most Common Reason" value={RR_KPI.mostCommonReason}      icon={AlertCircle} color="#0284c7" />
            </div>

            {/* ── Returned / Rejected Transactions Table ── */}
            <SectionCard title="Returned / Rejected Transactions" subtitle="Every document, task, or form bounced back for revision or rejected" icon={RotateCcw} noPad
              footer={<TableFoot count={Math.min(RR_ALL.length, 12)} total={RR_ALL.length} label="returned/rejected transactions" />}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                      {["Transaction ID", "Document Type", "Submitted By", "Assigned Faculty", "Date Submitted", "Date Returned/Rejected", "Status", "Reason", "Workflow Stage", "Actions"].map(h => (
                        <th key={h} style={{ ...TH_STYLE, textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RR_ALL.slice(0, 12).map((r, i, arr) => (
                      <tr key={r.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                        <td style={{ ...TD_STYLE, fontFamily: "monospace", fontWeight: 700, color: "#7c3aed", fontSize: 11, whiteSpace: "nowrap" }}>{r.id}</td>
                        <td style={{ ...TD_STYLE, color: "#374151" }}>{r.docType}</td>
                        <td style={TD_STYLE}>{r.person}</td>
                        <td style={TD_STYLE}>{r.person}</td>
                        <td style={{ ...TD_STYLE, color: "#6b7280", whiteSpace: "nowrap" }}>{r.date}</td>
                        <td style={{ ...TD_STYLE, color: "#6b7280", whiteSpace: "nowrap" }}>{r.actionDate}</td>
                        <td style={TD_STYLE}><StatusBadge s={r.status} /></td>
                        <td style={{ ...TD_STYLE, color: "#374151" }}>{r.reasonRaw || r.reasonCategory}</td>
                        <td style={{ ...TD_STYLE, color: "#6b7280" }}>{r.stage}</td>
                        <td style={TD_STYLE}>
                          <button
                            onClick={() => setRrSelected(r)}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 10.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            <Eye style={{ width: 11, height: 11 }} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {RR_ALL.length === 0 && (
                      <tr><td colSpan={10} style={{ ...TD_STYLE, textAlign: "center", color: "#9ca3af", padding: "24px 16px" }}>No returned or rejected transactions match these filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* ── Common Reasons Analysis ── */}
            <div className="path-returned-chart-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <SectionCard title="Common Reasons Analysis" subtitle="Distribution of return/rejection causes" icon={BarChart3}>
                <PathRankBars data={RR_REASON_BREAKDOWN} labelKey="name" valueKey="value" color="#d64550" emptyText="No return or rejection reasons are available." />
              </SectionCard>
              <SectionCard title="Reason Share" subtitle="Proportion of total cases" icon={PieIcon}>
                <PathStatusLedger data={RR_REASON_BREAKDOWN} total={RR_ALL.length} />
              </SectionCard>
            </div>

            {/* ── Trends & Analytics ── */}
            <div className="path-returned-chart-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <SectionCard title="Returned vs Rejected per Month" icon={Activity}>
                <PathTrendChart data={RR_MONTHLY_TREND} series={[{ key: "returned", label: "Returned", color: "#d97706" }, { key: "rejected", label: "Rejected", color: "#d64550", dashed: true }]} emptyText="No returned or rejected monthly activity is available." />
              </SectionCard>
              <SectionCard title="Return / Rejection Rate Trend" icon={TrendingUp}>
                <PathTrendChart data={RR_MONTHLY_TREND} series={[{ key: "rate", label: "Combined rate", color: "#7c3aed" }]} emptyText="No rate history is available." />
              </SectionCard>
            </div>
            <SectionCard title="Most Affected Document Types" icon={FileText}>
              <PathRankBars data={RR_DOC_TYPE_AFFECTED} emptyText="No affected document types are available." />
            </SectionCard>

              </>
            )}

            {/* ── Audit Trail tab ── */}
            {activeTab === "Audit Trail" && (
              <>
            {/* ── Audit Trail Table (preview — full filterable log lives on /audit) ── */}
            <SectionCard title="Audit Trail" subtitle="Immutable log of all system actions and document state changes" icon={Shield} noPad
              footer={
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Showing {Math.min(AUDIT_TRAIL.length, AUDIT_PREVIEW_LIMIT)} of {AUDIT_TRAIL.length} log entries
                  </span>
                  <button
                    onClick={() => navigate("/audit")}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    View More <ChevronRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              }>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f8fb", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                    {["Date & Time", "User", "Action", "Transaction", "Remarks"].map(h => (
                      <th key={h} style={{ ...TH_STYLE, textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AUDIT_TRAIL.slice(0, AUDIT_PREVIEW_LIMIT).map((a, i, arr) => (
                    <tr key={i} style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", color: "#6b7280", whiteSpace: "nowrap", fontSize: 11 }}>{a.date}</td>
                      <td style={TD_STYLE}><NameCell name={a.user} /></td>
                      <td style={TD_STYLE}><Pill text={a.action.label} bg={a.action.bg} color={a.action.color} /></td>
                      <td style={{ ...TD_STYLE, fontFamily: "monospace", color: "#374151", fontSize: 11 }}>{a.transaction}</td>
                      <td style={{ ...TD_STYLE, color: "#6b7280" }}>{a.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
              </>
            )}

            {/* ── Quick Reports tab ── */}
            {activeTab === "Quick Reports" && (
              <>
            {/* ── KPI Cards (top part, matching Overview) ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {KPI_DATA.map(k => <KpiCard key={k.label} {...k} />)}
            </div>

            {/* ── Quick Report Center ── */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>Quick Report Center</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {QUICK_REPORTS.map(r => (
                  <div key={r.title} style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 16, boxShadow: "0 1px 4px rgba(91,33,182,0.05)", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `${r.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <r.icon style={{ width: 16, height: 16, color: r.color }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>{r.title}</p>
                      <p style={{ fontSize: 10.5, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>{r.desc}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: "auto" }}>
                      <button
                        onClick={() => handleExport(r.title, "View")}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 10px", borderRadius: 7, background: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        <Eye style={{ width: 11, height: 11 }} /> View Report
                      </button>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => handleExport(r.title, "PDF")}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 8px", borderRadius: 7, background: "#fff", color: "#374151", border: "1px solid #e5e7eb", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}
                        >
                          <PdfFileIcon size={12} /> PDF
                        </button>
                        <button
                          onClick={() => handleExport(r.title, "Excel")}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px 8px", borderRadius: 7, background: "#fff", color: "#374151", border: "1px solid #e5e7eb", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}
                        >
                          <ExcelFileIcon size={12} /> Excel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ── Export toast ── */}
      {exportToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", zIndex: 2000, display: "flex", alignItems: "center", gap: 8 }}>
          <FileText style={{ width: 13, height: 13 }} />{exportToast}
        </div>
      )}

      {/* ── All Alerts modal (Bottleneck & Alerts) ── */}
      {alertsModalOpen && (
        <div
          onClick={() => { setAlertsModalOpen(false); setAlertsTierFilter("all"); setAlertsSearch(""); }}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", zIndex: 2500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>All Alerts</p>
                <p style={{ fontSize: 11.5, color: "#6b7280" }}>{BOTTLENECK_ALERTS.length} items requiring immediate attention</p>
              </div>
              <button
                onClick={() => { setAlertsModalOpen(false); setAlertsTierFilter("all"); setAlertsSearch(""); }}
                style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f3f4f6", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Tier filter tabs + search — lets you jump straight to just the
                Critical items or find a specific task instead of scrolling everything */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 22px", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0, flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All", count: BOTTLENECK_ALERTS.length, color: "#374151", bg: "#f3f4f6" },
                { key: "critical", label: "Critical", count: ALERT_TIER_COUNTS.critical, color: "#dc2626", bg: "#fef2f2" },
                { key: "warning", label: "Warning", count: ALERT_TIER_COUNTS.warning, color: "#d97706", bg: "#fffbeb" },
                { key: "info", label: "Info", count: ALERT_TIER_COUNTS.info, color: "#7c3aed", bg: "#f5f3ff" },
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setAlertsTierFilter(t.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 999,
                    border: alertsTierFilter === t.key ? `1.5px solid ${t.color}` : "1.5px solid transparent",
                    background: t.bg, color: t.color, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                    opacity: alertsTierFilter === t.key ? 1 : 0.55, transition: "opacity 0.15s",
                  }}
                >
                  {t.label} <span style={{ fontWeight: 800 }}>{t.count}</span>
                </button>
              ))}
              <div style={{ position: "relative", marginLeft: "auto", flex: "1 1 160px", minWidth: 140 }}>
                <Search style={{ width: 13, height: 13, color: "#9ca3af", position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={alertsSearch}
                  onChange={e => setAlertsSearch(e.target.value)}
                  placeholder="Search task ID or type…"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 11.5, padding: "6px 10px 6px 28px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px 22px", maxHeight: "70vh", overflowY: "auto" }}>
              {FILTERED_ALERTS.length === 0 && (
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>No alerts match this filter.</p>
              )}
              {FILTERED_ALERTS.map(a => {
                const cfg = ALERT_TIER_CFG[a.tier];
                const AlertIcon = a.icon;
                return (
                  <div
                    key={a.key}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      background: cfg.bg, borderLeft: `3px solid ${cfg.border}`,
                      borderRadius: 10, padding: "12px 14px",
                    }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <AlertIcon style={{ width: 14, height: 14, color: cfg.iconColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>{a.title}</p>
                        {cfg.showPill && (
                          <span style={{ display: "inline-flex", alignItems: "center", fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#dc2626", color: "#fff", letterSpacing: 0.3 }}>
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11.5, color: "#4b5563", marginTop: 3, lineHeight: 1.4 }}>{a.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Detailed Transaction View modal (Returned/Rejected report) ── */}
      {rrSelected && (
        <div
          onClick={() => setRrSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)", zIndex: 2500, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 640, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden" }}
          >
            {/* Header */}
            <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5 }}>Transaction Detail</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#111827", fontFamily: "monospace" }}>{rrSelected.id}</p>
              </div>
              <button
                onClick={() => setRrSelected(null)}
                style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "#f3f4f6", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18, maxHeight: "70vh", overflowY: "auto" }}>
              {/* Transaction Information */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Transaction Information</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    ["Document Type", rrSelected.docType],
                    ["Submitted By", rrSelected.person],
                    ["Assigned Faculty", rrSelected.person],
                    ["Department", rrSelected.department || "—"],
                    ["Date Submitted", rrSelected.date],
                    ["Date Returned/Rejected", rrSelected.actionDate],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p style={{ fontSize: 10, color: "#9ca3af" }}>{label}</p>
                      <p style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{val}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize: 10, color: "#9ca3af" }}>Status</p>
                    <StatusBadge s={rrSelected.status} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: "#9ca3af" }}>Current Workflow Stage</p>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: "#111827" }}>{rrSelected.stage}</p>
                  </div>
                </div>
              </div>

              {/* Return / Rejection Reason + Reviewer Remarks */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Return / Rejection Reason</p>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px" }}>
                  <Pill text={rrSelected.reasonCategory} color={REASON_CATEGORIES.find(c => c.name === rrSelected.reasonCategory)?.color || "#6b7280"} bg="#fff" />
                  <p style={{ fontSize: 12, color: "#374151", marginTop: 8 }}>{rrSelected.reasonRaw || "No specific reason text was recorded for this transaction."}</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginTop: 10 }}>
                  <MessageSquare style={{ width: 13, height: 13, color: "#9ca3af", marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 10, color: "#9ca3af" }}>Reviewer Remarks</p>
                    <p style={{ fontSize: 12, color: "#374151" }}>{rrSelected.reviewerRemarks || "No additional remarks left by the reviewer."}</p>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Supporting Documents</p>
                {rrSelected.attachments && rrSelected.attachments.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {rrSelected.attachments.map((a, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#374151" }}>
                        <Paperclip style={{ width: 12, height: 12, color: "#9ca3af" }} />
                        {typeof a === "string" ? a : (a.name || a.filename || `Attachment ${idx + 1}`)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>No supporting documents on record.</p>
                )}
              </div>

              {/* Complete Workflow History */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Complete Workflow History</p>
                {rrWorkflowHistory(rrSelected).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {rrWorkflowHistory(rrSelected).map((h, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 10 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed", flexShrink: 0, marginTop: 4 }} />
                          {idx < rrWorkflowHistory(rrSelected).length - 1 && <div style={{ width: 1, flex: 1, background: "#e5e7eb", marginTop: 2 }} />}
                        </div>
                        <div style={{ paddingBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <Pill text={h.action.label} bg={h.action.bg} color={h.action.color} />
                            <span style={{ fontSize: 10.5, color: "#9ca3af" }}>{h.date}</span>
                          </div>
                          <p style={{ fontSize: 11.5, color: "#6b7280", marginTop: 3 }}>{h.user} — {h.remarks}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#9ca3af" }}>
                    <History style={{ width: 13, height: 13 }} /> No detailed workflow history available for this transaction.
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "14px 22px", borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setRrSelected(null)}
                style={{ padding: "8px 16px", borderRadius: 8, background: "#f3f4f6", color: "#374151", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
              <ExportButtons onExport={(fmt) => handleExport(`Transaction ${rrSelected.id}`, fmt, rrSelected)} size="small" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
