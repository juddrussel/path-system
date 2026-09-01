import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Building2,
  Bell,
  Flag,
  Eye,
  BarChart3,
  AlertCircle,
  Calendar,
  Layers,
  TriangleAlert,
  ShieldAlert,
  Plus,
  Send,
  RotateCcw,
  UserCheck,
  ClipboardList,
  Inbox,
  MessageSquare,
  Megaphone,
  RefreshCw,
  Filter,
  Search,
  CircleCheck,
  Timer,
  ArrowUpRight,
  BookOpen,
  GraduationCap,
  Star,
  MoreHorizontal,
  ChevronDown,
  Sparkles,
  ListTodo,
  PieChart,
  X,
  Tag,
  ShieldCheck,
} from "lucide-react";

// ── Shell CSS ported from DashboardLayout.jsx (sidebar/topbar rules removed) ──
const DASHBOARD_LAYOUT_CSS = `
  .path-dashboard { min-height: 100vh; display: flex; background: #faf9fc; color: #3e3248; font-family: "DM Sans", Arial, sans-serif; }
  .path-dashboard-main { min-width: 0; flex: 1; }
  .path-content { max-width: 1170px; margin: 0 auto; padding: 42px 48px 28px; }
  .path-perspective { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; padding: 9px 13px; border: 1px solid #e7e1ec; border-radius: 10px; background: #fff; color: #8f8399; font-size: 8px; letter-spacing: .08em; text-transform: uppercase; }
  .path-perspective-options { display: flex; align-items: center; gap: 3px; padding: 3px; border-radius: 7px; background: #f8f6fb; }
  .path-perspective-options button { display: inline-flex; align-items: center; gap: 5px; border: 0; border-radius: 5px; padding: 7px 9px; background: transparent; color: #93889b; font-size: 8px; font-weight: 800; text-transform: none; cursor: pointer; }
  .path-perspective-options button.active { background: #fff; color: #6b35c4; box-shadow: 0 2px 7px rgba(56,35,92,.08); }
  .path-hero { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; min-height: 130px; border-left: 2px solid #c9b5f8; padding: 20px 0 17px 18px; }
  .path-kicker { color: #a59aac; font-size: 8px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
  .path-kicker::before { display: inline-block; width: 7px; height: 7px; margin-right: 8px; border-radius: 50%; background: #8c4be7; content: ""; vertical-align: 0; }
  .path-hero h1 { margin: 14px 0 8px; color: #2f2638; font-family: "Manrope", Arial, sans-serif; font-size: 35px; font-weight: 800; letter-spacing: -.065em; line-height: 1; }
  .path-hero p { margin: 0; color: #8e8297; font-size: 11px; }
  .path-primary-button { display: inline-flex; align-items: center; gap: 7px; border: 0; border-radius: 8px; padding: 12px 16px; background: #7c3aed; color: #fff; font-size: 10px; font-weight: 800; box-shadow: 0 8px 16px rgba(124,58,237,.18); cursor: pointer; }
  .path-primary-button:hover { background: #6d28d9; }
  .path-primary-button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; }
  .path-stat-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
  .path-stat-card, .path-panel { border: 1px solid #ece7f0; border-radius: 12px; background: #fff; box-shadow: 0 4px 18px rgba(58,42,77,.025); }
  .path-stat-card { min-width: 0; padding: 18px 18px 16px; }
  .path-stat-topline { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #948a9e; font-size: 9px; }
  .path-stat-icon { display: grid; width: 25px; height: 25px; place-items: center; border-radius: 7px; }
  .path-stat-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
  .path-stat-card.violet .path-stat-icon { background: #f0eaff; color: #7342cc; }
  .path-stat-card.amber .path-stat-icon { background: #fff6dc; color: #b28326; }
  .path-stat-card.mint .path-stat-icon { background: #e6f7ef; color: #4e9a77; }
  .path-stat-card.blue .path-stat-icon { background: #e9f3ff; color: #4784bd; }
  .path-stat-value { margin-top: 13px; color: #2f2738; font-family: "Manrope", Arial, sans-serif; font-size: 28px; font-weight: 800; letter-spacing: -.06em; line-height: 1; }
  .path-stat-detail { display: flex; align-items: center; gap: 5px; margin-top: 8px; color: #aca2b1; font-size: 8px; }
  .path-stat-change { color: #6c35c3; font-weight: 800; }
  .path-section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin: 34px 0 13px; }
  .path-section-heading h2 { margin: 5px 0 0; color: #44344f; font-family: "Manrope", Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.05em; }
  .path-section-heading h2 span { display: inline-block; margin-left: 5px; border-radius: 5px; padding: 3px 5px; background: #f0e8ff; color: #7941cd; font-family: "DM Sans", Arial, sans-serif; font-size: 9px; vertical-align: 3px; }
  .path-section-actions { display: flex; align-items: center; gap: 13px; }
  .path-ghost-button, .path-text-button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; font-family: "DM Sans", Arial, sans-serif; font-size: 9px; font-weight: 800; cursor: pointer; }
  .path-ghost-button { border: 1px solid #e2dce7; border-radius: 7px; padding: 8px 10px; color: #74677e; }
  .path-text-button { color: #7040c5; }
  .path-ghost-button svg, .path-text-button svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
  .path-filter-menu { position: absolute; z-index: 2; margin-top: 5px; min-width: 126px; border: 1px solid #ebe4f0; border-radius: 8px; padding: 5px; background: #fff; box-shadow: 0 12px 28px rgba(47,32,69,.12); }
  .path-filter-wrap { position: relative; }
  .path-filter-menu button { display: block; width: 100%; border: 0; border-radius: 5px; padding: 8px; background: transparent; color: #76687e; font-size: 9px; text-align: left; cursor: pointer; }
  .path-filter-menu button:hover { background: #f7f2ff; color: #6734bd; }
  .path-work-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(250px, .75fr); gap: 14px; }
  .path-queue-card { overflow: hidden; }
  .path-queue-row { display: grid; grid-template-columns: 25px 30px minmax(0, 1fr) auto 15px; width: 100%; min-height: 65px; align-items: center; gap: 10px; border: 0; border-bottom: 1px solid #f2eef4; padding: 0 18px; background: #fff; color: inherit; text-align: left; cursor: pointer; }
  .path-queue-row:hover { background: #fcfbff; }
  .path-queue-index { color: #b09fbf; font-size: 8px; }
  .path-person-avatar { display: grid; width: 30px; height: 30px; place-items: center; border-radius: 9px; background: #eee7ff; color: #7040c5; font-size: 8px; font-weight: 900; }
  .path-queue-main { min-width: 0; }
  .path-queue-main strong, .path-queue-main span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .path-queue-main strong { color: #55435f; font-size: 10px; font-weight: 800; }
  .path-queue-main span { margin-top: 4px; color: #a095aa; font-size: 8px; }
  .path-queue-main i { color: #c9becd; font-style: normal; }
  .path-queue-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
  .path-status-pill { border-radius: 999px; padding: 4px 7px; font-size: 7px; font-weight: 800; white-space: nowrap; }
  .path-status-pill.urgent { background: #fff0ed; color: #b65d51; }
  .path-status-pill.review { background: #fff9e9; color: #a27a2c; }
  .path-status-pill.progress { background: #eef3ff; color: #6579ba; }
  .path-status-pill.draft { background: #f3f1f4; color: #8c8290; }
  .path-due-label { color: #aaa0ae; font-size: 8px; white-space: nowrap; }
  .path-row-arrow { width: 14px; height: 14px; fill: none; stroke: #afa2b3; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
  .path-queue-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 18px; color: #9b8fa5; font-size: 8px; }
  .path-queue-footer span { display: inline-flex; align-items: center; gap: 5px; }
  .path-queue-footer svg { width: 14px; height: 14px; fill: none; stroke: #8f70d0; stroke-width: 1.5; }
  .path-sla-card { padding: 18px; }
  .path-panel-topline { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .path-panel-topline h3 { margin: 6px 0 0; color: #51405d; font-family: "Manrope", Arial, sans-serif; font-size: 15px; letter-spacing: -.035em; }
  .path-more { border: 0; background: transparent; color: #aa9fae; cursor: pointer; }
  .path-more svg { width: 15px; height: 15px; fill: currentColor; }
  .path-health-score { display: flex; align-items: center; gap: 14px; margin-top: 21px; }
  .path-score-ring { display: grid; width: 76px; height: 76px; place-items: center; border: 7px solid #f0eaff; border-top-color: #7c3aed; border-right-color: #8e52e3; border-radius: 50%; }
  .path-score-ring strong { color: #622cb6; font-family: "Manrope", Arial, sans-serif; font-size: 20px; letter-spacing: -.05em; }
  .path-score-ring span { color: #7955b0; font-size: 10px; }
  .path-health-score-copy strong { display: block; color: #594463; font-size: 12px; font-weight: 800; }
  .path-health-score-copy p { margin: 5px 0 0; color: #9b8fa4; font-size: 8px; }
  .path-health-bar { height: 5px; margin-top: 20px; overflow: hidden; border-radius: 99px; background: #eeeaf4; }
  .path-health-bar span { display: block; width: 92%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #a986ed, #7c3aed); }
  .path-health-caption { display: flex; justify-content: space-between; margin-top: 5px; color: #b2a8b7; font-size: 7px; }
  .path-sla-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 23px; padding-top: 14px; border-top: 1px solid #f0edf2; }
  .path-mini-label { display: block; color: #a69ba9; font-size: 7px; letter-spacing: .08em; text-transform: uppercase; }
  .path-sla-metrics strong { display: block; margin-top: 5px; color: #5b465f; font-family: "Manrope", Arial, sans-serif; font-size: 17px; letter-spacing: -.05em; }
  .path-sla-metrics small { display: inline-flex; align-items: center; gap: 3px; margin-top: 5px; color: #669b7d; font-size: 7px; }
  .path-sla-metrics small.negative { color: #b78442; }
  .path-sla-metrics small svg { width: 10px; height: 10px; fill: none; stroke: currentColor; stroke-width: 1.5; }
  .path-performance-panel { margin-top: 16px; padding: 22px 24px 20px; overflow: hidden; }
  .path-performance-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
  .path-performance-heading h2 { margin: 5px 0 0; color: #44344f; font-family: "Manrope", Arial, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -.045em; }
  .path-performance-heading p { max-width: 560px; margin: 7px 0 0; color: #8c8096; font-size: 10px; line-height: 1.55; }
  .path-performance-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; margin-top: 18px; }
  .path-performance-summary > div { min-width: 0; padding: 12px 13px; border: 1px solid #eee8f2; border-radius: 9px; background: #fcfbff; }
  .path-performance-summary span, .path-performance-summary small { display: block; color: #95899f; font-size: 8px; font-weight: 800; }
  .path-performance-summary span { letter-spacing: .07em; text-transform: uppercase; }
  .path-performance-summary strong { display: block; margin-top: 5px; color: #5523a8; font-family: "Manrope", Arial, sans-serif; font-size: 22px; letter-spacing: -.055em; line-height: 1; }
  .path-performance-summary small { margin-top: 5px; color: #a69aaf; font-size: 8px; font-weight: 500; letter-spacing: 0; text-transform: none; }
  .path-performance-content { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(190px, .75fr); gap: 18px; margin-top: 18px; }
  .path-performance-row { display: grid; grid-template-columns: minmax(145px, 1.15fr) minmax(150px, 1fr) auto; align-items: center; gap: 16px; min-height: 57px; border-top: 1px solid #f1edf4; }
  .path-performance-row:first-child { border-top: 0; }
  .path-performance-person { display: flex; min-width: 0; align-items: center; gap: 9px; }
  .path-performance-avatar { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; border-radius: 8px; background: #eee7ff; color: #7040c5; font-size: 8px; font-weight: 900; }
  .path-performance-person > div { min-width: 0; }
  .path-performance-person strong, .path-performance-person span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .path-performance-person strong { color: #584762; font-size: 10px; font-weight: 800; }
  .path-performance-person span { margin-top: 3px; color: #a095aa; font-size: 8px; }
  .path-performance-progress-top { display: flex; justify-content: space-between; gap: 8px; color: #a095aa; font-size: 8px; }
  .path-performance-progress-top b { color: #6840a6; font-size: 9px; }
  .path-performance-track { height: 6px; margin-top: 6px; overflow: hidden; border-radius: 999px; background: #eeeaf3; }
  .path-performance-track span { display: block; height: 100%; border-radius: inherit; background: #65a58a; }
  .path-performance-track span.risk { background: #ce7668; }
  .path-performance-status { min-width: 80px; border-radius: 999px; padding: 5px 8px; background: #edf8f2; color: #4c8b6e; font-size: 8px; font-weight: 800; text-align: center; white-space: nowrap; }
  .path-performance-status.risk { background: #fff0ed; color: #b45b50; }
  .path-performance-highlight { min-width: 0; border: 1px solid #e2d6f4; border-radius: 10px; padding: 16px; background: linear-gradient(145deg, #fcfbff 0%, #f4effe 100%); }
  .path-performance-highlight > strong { display: block; overflow: hidden; margin-top: 8px; color: #4d2b78; font-family: "Manrope", Arial, sans-serif; font-size: 16px; letter-spacing: -.04em; text-overflow: ellipsis; white-space: nowrap; }
  .path-performance-highlight > p { margin: 6px 0 0; color: #817391; font-size: 9px; line-height: 1.5; }
  .path-performance-highlight-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 22px; }
  .path-performance-highlight-metrics > div { border-top: 1px solid #e4d9f2; padding-top: 9px; }
  .path-performance-highlight-metrics span, .path-performance-highlight-metrics b { display: block; }
  .path-performance-highlight-metrics span { color: #9586a3; font-size: 8px; }
  .path-performance-highlight-metrics b { margin-top: 5px; color: #6334ad; font-family: "Manrope", Arial, sans-serif; font-size: 18px; letter-spacing: -.04em; }
  .path-lower-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(250px, .75fr); gap: 14px; margin-top: 16px; }
  .path-activity-card, .path-report-card { min-width: 0; padding: 18px; }
  .path-activity-list { margin-top: 14px; }
  .path-activity-row { display: flex; align-items: center; gap: 10px; min-height: 50px; border-top: 1px solid #f1edf4; }
  .path-activity-row:first-child { border-top: 0; }
  .path-activity-icon { display: grid; width: 28px; height: 28px; flex: 0 0 auto; place-items: center; border-radius: 8px; }
  .path-activity-icon svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.5; }
  .path-activity-icon.mint { background: #e8f8ef; color: #5ba17d; }
  .path-activity-icon.violet { background: #efe8ff; color: #7844cb; }
  .path-activity-icon.blue { background: #e9f3ff; color: #4889c4; }
  .path-activity-icon.amber { background: #fff5db; color: #b2832e; }
  .path-activity-copy { min-width: 0; flex: 1; }
  .path-activity-copy strong, .path-activity-copy span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .path-activity-copy strong { color: #5a4763; font-size: 9px; font-weight: 800; }
  .path-activity-copy span { margin-top: 4px; color: #a098a7; font-size: 8px; }
  .path-report-summary { margin: 18px 0 17px; }
  .path-report-summary strong { color: #5a3c67; font-family: "Manrope", Arial, sans-serif; font-size: 27px; letter-spacing: -.06em; }
  .path-report-summary span { margin-left: 7px; color: #9e93a7; font-size: 8px; }
  .path-report-summary small { display: block; margin-top: 5px; color: #5fa17c; font-size: 8px; }
  .path-report-bars { display: grid; gap: 10px; }
  .path-report-bar-row { display: grid; grid-template-columns: 56px minmax(0, 1fr) 22px; align-items: center; gap: 8px; color: #9a8fa4; font-size: 8px; }
  .path-report-bar-track { height: 6px; overflow: hidden; border-radius: 999px; background: #f0edf4; }
  .path-report-bar-track span { display: block; height: 100%; border-radius: inherit; background: #8854df; }
  .path-report-bar-row strong { color: #6c5a77; font-size: 8px; text-align: right; }
  .path-toast { position: fixed; right: 22px; bottom: 22px; z-index: 5; border: 1px solid #dfd3f3; border-radius: 9px; padding: 11px 14px; background: #fff; color: #6232ae; font-size: 9px; font-weight: 800; box-shadow: 0 14px 30px rgba(55,34,84,.14); }
  .path-footer { display: flex; justify-content: space-between; gap: 14px; margin-top: 24px; padding: 14px 0 0; border-top: 1px solid #eeeaf1; color: #aaa0b1; font-size: 8px; }
@media (max-width: 1040px) { .path-content { padding-right: 28px; padding-left: 28px; } .path-work-grid, .path-lower-grid { grid-template-columns: minmax(0, 1.35fr) minmax(230px, .8fr); } }
@media (max-width: 820px) { .path-content { padding: 24px 16px; } .path-perspective { align-items: flex-start; flex-direction: column; } .path-hero { display: block; } .path-hero h1 { font-size: 30px; } .path-primary-button { margin-top: 20px; } .path-stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .path-work-grid, .path-lower-grid, .path-performance-content { grid-template-columns: 1fr; } .path-performance-highlight { order: -1; } }
@media (max-width: 520px) { .path-section-heading { align-items: flex-start; flex-direction: column; } .path-section-actions { width: 100%; justify-content: space-between; } .path-stat-card { padding: 14px 12px; } .path-stat-value { font-size: 23px; } .path-performance-panel { padding: 18px 15px 16px; } .path-performance-heading { display: block; } .path-performance-heading .path-text-button { margin-top: 12px; } .path-performance-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .path-performance-row { grid-template-columns: minmax(0, 1fr) auto; gap: 9px; padding: 10px 0; } .path-performance-progress { grid-column: 1 / -1; grid-row: 2; } .path-performance-status { grid-column: 2; grid-row: 1; } .path-queue-row { grid-template-columns: 20px 28px minmax(0, 1fr) 14px; gap: 7px; padding: 0 11px; } .path-queue-meta { display: none; } .path-footer { flex-direction: column; } }
`;

// ── Role-based nav visibility ─────────────────────────────────────────────────
const ADMIN_NAV_ROLES = ["admin", "program_chair"];
const API = import.meta.env.VITE_API_URL || "";

// ── Sidebar SVG Icons ────────────────────────────────────────────────────────
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
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      width={size}
      height={size}
    >
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
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
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
      <path
        d="M8 1v2M8 13v2M1 8h2M13 8h2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  Help: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
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
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <circle cx="6.5" cy="6.5" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  ),
  Download: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
      width="12"
      height="12"
    >
      <path d="M8 1v9M4 7l4 4 4-4M2 13h12" />
    </svg>
  ),
  AssignTask: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path
        d="M2 2h8l3 3v9H2V2z"
        fillOpacity=".15"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M2 2h8l3 3v9H2V2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M5 7h6M5 9.5h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="12.5" cy="12.5" r="3" fill="#5e3bdb" />
      <path
        d="M11.5 12.5l.8.8 1.4-1.4"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  Tracking: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v4l3 2" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  Categories: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.2" />
      <rect
        x="9"
        y="1.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
      <rect
        x="1.5"
        y="9"
        width="5.5"
        height="5.5"
        rx="1.2"
        fillOpacity="0.55"
      />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.2" />
    </svg>
  ),
  SLA: () => (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      width="14"
      height="14"
    >
      <circle cx="8" cy="8" r="6.5" />
      <path
        d="M8 4.5v3.8l2.6 1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  Bell: () => (
    <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
      <path d="M8 1.5a1 1 0 011 1v.6c2 .4 3.5 2.2 3.5 4.4v2.4l1.2 1.9c.2.3 0 .8-.4.8H2.7c-.4 0-.6-.5-.4-.8L3.5 10V7.5c0-2.2 1.5-4 3.5-4.4v-.6a1 1 0 011-1z" />
      <path d="M6.2 13.5a1.8 1.8 0 003.6 0z" />
    </svg>
  ),
};

// ─── Sample Data (Program Chair layout) ────────────────────────────────────────
// Note: the "Document, Form & Task Tracking" table no longer uses sample data —
// it fetches real tasks, forms, and documents from the API (see fetchTrackedItems
// below). The arrays below still power the charts and the Task Overview widget.

// Note: monthly submissions, processing time, approval-rate, task-completion,
// and recent-activity chart data are no longer hardcoded here — they're
// derived live from trackedItems/facultyPerformance inside the component
// (see the "Charts, activity feed, workflow snapshot & department overview"
// block below the KPI strip).

// Maps raw backend status values to the display labels used by StatusBadge
const REAL_STATUS_DISPLAY = {
  pending: "Pending",
  "in review": "Under Review",
  "for approval": "For Approval",
  returned: "Returned",
  revision: "Returned",
  received: "Approved",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
  registered: "Approved",
  draft: "Pending",
};

const NOTIFICATIONS = [
  {
    id: 1,
    type: "submission",
    text: "New form submitted by Juan Reyes",
    sub: "Thesis Defense Schedule — FRM-2026-041",
    time: "5m ago",
    read: false,
  },
  {
    id: 2,
    type: "completed",
    text: "Task completed by Dr. Luisa Fernandez",
    sub: "Finalize Elective Subjects List",
    time: "22m ago",
    read: false,
  },
  {
    id: 3,
    type: "revision",
    text: "Revision requested by Records Office",
    sub: "FRM-2026-028 — Leave Application",
    time: "1h ago",
    read: false,
  },
  {
    id: 4,
    type: "announcement",
    text: "System Announcement",
    sub: "PATH Maintenance scheduled Jun 15, 10 PM",
    time: "2h ago",
    read: true,
  },
  {
    id: 5,
    type: "submission",
    text: "New form submitted by Prof. Mendoza",
    sub: "Overload Request — FRM-2026-037",
    time: "3h ago",
    read: true,
  },
  {
    id: 6,
    type: "completed",
    text: "Approval completed",
    sub: "FRM-2026-029 approved by Dean's Office",
    time: "4h ago",
    read: true,
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CFG = {
  Urgent: { color: "#dc2626", bg: "#fef2f2", dot: "#ef4444" },
  High: { color: "#d97706", bg: "#fffbeb", dot: "#f59e0b" },
  Normal: { color: "#0284c7", bg: "#e0f2fe", dot: "#38bdf8" },
  Low: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

// Dot-style status palette — mirrors Tracking.jsx's STATUS_STYLES, extended
// with the extra statuses used across forms, tasks, and documents here.
const STATUS_CFG = {
  pending: { color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  "pending review": { color: "#481bc6", bg: "#e6deff", dot: "#5e3bdb" },
  "under review": { color: "#0369a1", bg: "#f0f9ff", dot: "#38bdf8" },
  "for approval": { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  "in progress": { color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  "not started": { color: "#6b7280", bg: "#f9fafb", dot: "#9ca3af" },
  overdue: { color: "#991b1b", bg: "#fef2f2", dot: "#ef4444" },
  completed: { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  approved: { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  received: { color: "#065f46", bg: "#d1fae5", dot: "#10b981" },
  rejected: { color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  returned: { color: "#9a3412", bg: "#ffedd5", dot: "#f97316" },
  archived: { color: "#6b7280", bg: "#f3f4f6", dot: "#9ca3af" },
};

// Type badge — same Task/Form pattern as Tracking.jsx, extended with Document
const TYPE_CFG = {
  task: { label: "Task", bg: "#e6deff", color: "#5e3bdb" },
  form: { label: "Form", bg: "#dbeafe", color: "#1e40af" },
  document: { label: "Document", bg: "#d1fae5", color: "#065f46" },
};

const ACTIVITY_CFG = {
  approved: { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 },
  submitted: { color: "#5e3bdb", bg: "#f3f2ff", icon: FileText },
  completed: { color: "#059669", bg: "#ecfdf5", icon: CircleCheck },
  assigned: { color: "#0284c7", bg: "#e0f2fe", icon: UserCheck },
  revision: { color: "#d97706", bg: "#fffbeb", icon: RotateCcw },
  workflow: { color: "#5e3bdb", bg: "#e6deff", icon: Layers },
  overdue: { color: "#dc2626", bg: "#fef2f2", icon: AlertTriangle },
};

const NOTIF_CFG = {
  submission: { color: "#5e3bdb", bg: "#f3f2ff", icon: Inbox },
  completed: { color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 },
  revision: { color: "#d97706", bg: "#fffbeb", icon: RotateCcw },
  announcement: { color: "#0284c7", bg: "#e0f2fe", icon: Megaphone },
};

// Bottleneck & Alerts tier styling — mirrors Reports.jsx's ALERT_TIER_CFG so
// this widget's live alerts render consistently with the full report.
const ALERT_TIER_CFG = {
  critical: {
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    label: "Critical",
    showPill: true,
  },
  warning: {
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    label: "Warning",
    showPill: false,
  },
  info: {
    color: "#5e3bdb",
    bg: "#f3f2ff",
    border: "#cabeff",
    iconBg: "#e6deff",
    iconColor: "#5e3bdb",
    label: "Info",
    showPill: false,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ s }) {
  const cfg = STATUS_CFG[s?.toLowerCase()] ?? {
    color: "#374151",
    bg: "#f3f4f6",
    dot: "#9ca3af",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {s}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = TYPE_CFG[type] ?? {
    label: type,
    bg: "#f3f4f6",
    color: "#374151",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 4,
        background: cfg.bg,
        color: cfg.color,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function PriorityPill({ p }) {
  const cfg = PRIORITY_CFG[p] ?? PRIORITY_CFG.Normal;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 4,
        background: cfg.bg,
        color: cfg.color,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {p}
    </span>
  );
}

// ── Avatar (profile picture with initials fallback) ────────────────────────
// Renders a faculty member's real profile photo when a picture URL is
// available and loads successfully; otherwise falls back to the existing
// colored-initials circle look used throughout this file.
function AvatarCircle({
  name,
  pictureUrl,
  size = 32,
  background = "#e9ddff",
  color = "#5516be",
  fontSize,
  border,
  style,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (pictureUrl && !imgFailed) {
    return (
      <img
        src={pictureUrl}
        alt={name || "Avatar"}
        onError={() => setImgFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border,
          ...style,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: fontSize || Math.round(size * 0.35),
        fontWeight: 800,
        flexShrink: 0,
        border,
        ...style,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function FacultyPerformanceRow({ f, idx, delayedDocs, onClick, avatarUrlFor }) {
  const rate = Number(f.performance_score) || 0;
  const rateColor = rate >= 90 ? "#059669" : rate >= 80 ? "#d97706" : "#dc2626";
  const delayedCount = Array.isArray(delayedDocs)
    ? delayedDocs.filter((d) => d.faculty_name === f.full_name).length
    : 0;
  return (
    <div
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick(f);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px",
        borderRadius: 9,
        background: "#fafafa",
        border: "1px solid rgba(0,0,0,0.06)",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "#f3f0ff";
          e.currentTarget.style.boxShadow = "0 1px 6px rgba(124,58,237,0.12)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = "#fafafa";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {/* Rank */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: idx === 0 ? "#f59e0b" : "#9ca3af",
          width: 16,
          flexShrink: 0,
        }}
      >
        {idx === 0 ? "★" : `#${idx + 1}`}
      </span>
      {/* Avatar */}
      <AvatarCircle
        name={f.full_name}
        pictureUrl={avatarUrlFor?.(f.full_name)}
        size={32}
        background={`hsl(${idx * 55 + 250}, 60%, 92%)`}
        color={`hsl(${idx * 55 + 250}, 50%, 35%)`}
        fontSize={11}
        border={`2px solid hsl(${idx * 55 + 250}, 50%, 75%)`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
          {f.full_name}
        </p>
        <div
          style={{ display: "flex", gap: 10, marginTop: 2, flexWrap: "wrap" }}
        >
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            Active:{" "}
            <strong style={{ color: "#374151" }}>{f.active_count}</strong>
          </span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            Done:{" "}
            <strong style={{ color: "#059669" }}>{f.completed_count}</strong>
          </span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            Pending:{" "}
            <strong style={{ color: "#d97706" }}>{f.pending_count}</strong>
          </span>
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            Delayed:{" "}
            <strong style={{ color: delayedCount > 0 ? "#dc2626" : "#374151" }}>
              {delayedCount}
            </strong>
          </span>
        </div>
      </div>
      {/* Completion rate */}
      <div style={{ width: 80, textAlign: "right" }}>
        <p
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: rateColor,
            lineHeight: 1,
          }}
        >
          {rate}%
        </p>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: "#f3f4f6",
            marginTop: 4,
          }}
        >
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: rateColor,
              width: `${rate}%`,
            }}
          />
        </div>
      </div>
      {onClick && (
        <ChevronRight
          style={{ width: 14, height: 14, color: "#c4c4d4", flexShrink: 0 }}
        />
      )}
    </div>
  );
}

// ── Faculty Performance — table row (mirrors the "Faculty Performance
//    Summary" table from the DS PATH mockup: avatar+name/role cell,
//    Tasks Done / Active columns, and a Success Rate progress bar) ─────────
function FacultyPerformanceTableRow({ f, idx, delayedDocs, onClick, avatarUrlFor }) {
  const rate = Number(f.performance_score) || 0;
  const rateColor = rate >= 90 ? "#10b981" : rate >= 80 ? "#d97706" : "#dc2626";
  const delayedCount = Array.isArray(delayedDocs)
    ? delayedDocs.filter((d) => d.faculty_name === f.full_name).length
    : 0;

  return (
    <tr
      onClick={() => onClick && onClick(f)}
      style={{
        cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid #e3dfff",
        transition: "background-color 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.background = "rgba(246,242,255,0.6)";
      }}
      onMouseLeave={(e) => {
        if (onClick) e.currentTarget.style.background = "transparent";
      }}
    >
      <td style={{ padding: "16px 24px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AvatarCircle
            name={f.full_name}
            pictureUrl={avatarUrlFor?.(f.full_name)}
            size={32}
            background={`hsl(${idx * 55 + 250}, 60%, 92%)`}
            color={`hsl(${idx * 55 + 250}, 55%, 35%)`}
            fontSize={12}
            border={`2px solid hsl(${idx * 55 + 250}, 50%, 78%)`}
          />
          <div
            style={{ display: "flex", flexDirection: "column", minWidth: 0 }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#181445",
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {f.full_name}
            </span>
            <span style={{ fontSize: 11, color: "#7b7486" }}>
              {idx === 0 ? "Top performer" : "Faculty member"}
            </span>
          </div>
        </div>
      </td>
      <td
        style={{
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          color: "#181445",
        }}
      >
        {f.completed_count ?? 0}
      </td>
      <td
        style={{
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          color: "#6b38d4",
        }}
      >
        {f.active_count ?? 0}
      </td>
      <td
        style={{
          padding: "16px 24px",
          textAlign: "center",
          fontSize: 14,
          fontWeight: 600,
          color: delayedCount > 0 ? "#ba1a1a" : "#181445",
        }}
      >
        {f.pending_count ?? 0}
      </td>
      <td style={{ padding: "16px 24px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            width: 110,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: rateColor }}>
            {rate}%
          </span>
          <div
            style={{
              width: "100%",
              background: "#e3dfff",
              borderRadius: 999,
              height: 6,
            }}
          >
            <div
              style={{
                width: `${Math.min(rate, 100)}%`,
                background: rateColor,
                height: 6,
                borderRadius: 999,
              }}
            />
          </div>
        </div>
      </td>
      {onClick && (
        <td style={{ padding: "16px 24px", textAlign: "right" }}>
          <ChevronRight style={{ width: 14, height: 14, color: "#cbc3d7" }} />
        </td>
      )}
    </tr>
  );
}

// ── Faculty Performance — individual detail panel ───────────────────────────
const DONE_STATUSES = ["Approved", "Completed", "Archived"];

function FacultyDetailPanel({
  open,
  onClose,
  onBack,
  faculty,
  delayedDocs,
  trackedItems,
  avatarUrlFor,
}) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Reset the expanded category whenever a different faculty member is opened
  useEffect(() => {
    setSelectedCategory(null);
  }, [faculty?.id]);

  if (!open || !faculty) return null;

  const rate = Number(faculty.performance_score) || 0;
  const rateColor = rate >= 90 ? "#059669" : rate >= 80 ? "#d97706" : "#dc2626";

  // Items (documents/tasks/forms) belonging to this faculty member, pulled
  // from the same merged list that powers the tracking table.
  const facultyItems = Array.isArray(trackedItems)
    ? trackedItems.filter((t) => t.person === faculty.full_name)
    : [];

  const facultyDelayedDocs = Array.isArray(delayedDocs)
    ? delayedDocs.filter((d) => d.faculty_name === faculty.full_name)
    : [];

  const doneItems = facultyItems.filter((t) =>
    DONE_STATUSES.includes(t.status),
  );
  const pendingItems = facultyItems.filter((t) => t.status === "Pending");
  const delayedItems = facultyItems.filter((t) => t.status === "Overdue");
  // "Active" = everything still moving that isn't done, pending, or overdue
  // (e.g. Under Review, For Approval, Returned).
  const activeItems = facultyItems.filter(
    (t) =>
      !DONE_STATUSES.includes(t.status) &&
      t.status !== "Pending" &&
      t.status !== "Overdue",
  );

  const delayedCount = facultyDelayedDocs.length || delayedItems.length;

  const stats = [
    {
      label: "Active",
      value: faculty.active_count ?? activeItems.length,
      icon: Layers,
      color: "#5e3bdb",
      items: activeItems,
    },
    {
      label: "Done",
      value: faculty.completed_count ?? doneItems.length,
      icon: CheckCircle2,
      color: "#059669",
      items: doneItems,
    },
    {
      label: "Pending",
      value: faculty.pending_count ?? pendingItems.length,
      icon: Clock,
      color: "#d97706",
      items: pendingItems,
    },
    {
      label: "Delayed",
      value: delayedCount,
      icon: AlertCircle,
      color: "#dc2626",
      items: delayedItems,
    },
  ];

  const activeStat = stats.find((s) => s.label === selectedCategory);
  // Fall back to the faculty's delayed-documents list (richer info) when a
  // faculty member has delayed docs but no matching "Overdue" tracked item.
  const listToShow = activeStat
    ? activeStat.label === "Delayed" &&
      activeStat.items.length === 0 &&
      facultyDelayedDocs.length > 0
      ? facultyDelayedDocs.map((d) => ({
          id: d.tracking_id || d.document_id || d.id,
          title: d.title || d.document_type || "Delayed document",
          status: "Overdue",
          date: d.deadline || d.due_date || d.submitted_at || null,
        }))
      : activeStat.items
    : [];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 440,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              minWidth: 0,
            }}
          >
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  background: "#f3f4f6",
                  border: "none",
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <ChevronRight
                  style={{
                    width: 14,
                    height: 14,
                    color: "#374151",
                    transform: "rotate(180deg)",
                  }}
                />
              </button>
            )}
            <AvatarCircle
              name={faculty.full_name}
              pictureUrl={avatarUrlFor?.(faculty.full_name)}
              size={36}
              background="#e6deff"
              color="#481bc6"
              fontSize={12}
              border="2px solid #cabeff"
            />
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {faculty.full_name}
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
                Performance breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 15, height: 15, color: "#374151" }} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: "auto" }}>
          {/* Stat boxes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {stats.map((s) => {
              const isSelected = selectedCategory === s.label;
              return (
                <div
                  key={s.label}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : s.label)
                  }
                  style={{
                    padding: "12px 8px",
                    borderRadius: 10,
                    background: isSelected ? `${s.color}14` : `${s.color}09`,
                    border: `1px solid ${isSelected ? s.color : `${s.color}20`}`,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 7,
                      background: `${s.color}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 7px",
                    }}
                  >
                    <s.icon style={{ width: 13, height: 13, color: s.color }} />
                  </div>
                  <p
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: s.color,
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: 10, color: "#6b7280", marginTop: 4 }}>
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Completion rate */}
          <div style={{ marginBottom: selectedCategory ? 16 : 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span style={{ fontSize: 11, color: "#6b7280" }}>
                Completion Rate
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: rateColor }}>
                {rate}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#f3f4f6" }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: rateColor,
                  width: `${rate}%`,
                }}
              />
            </div>
          </div>

          {/* Expanded task list for the selected box */}
          {activeStat && (
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.08)",
                paddingTop: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <activeStat.icon
                    style={{ width: 13, height: 13, color: activeStat.color }}
                  />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}
                  >
                    {activeStat.label} tasks
                  </span>
                  <span style={{ fontSize: 10, color: "#9ca3af" }}>
                    ({listToShow.length})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#9ca3af",
                    fontSize: 11,
                    padding: 2,
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {listToShow.length === 0 ? (
                <p
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    textAlign: "center",
                    padding: "14px 0",
                  }}
                >
                  No {activeStat.label.toLowerCase()} items found.
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {listToShow.map((item, i) => (
                    <div
                      key={item.id || i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "9px 10px",
                        borderRadius: 8,
                        background: "#fafafa",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: activeStat.color,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 11.5,
                            fontWeight: 600,
                            color: "#111827",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title || "Untitled item"}
                        </p>
                        {item.date && (
                          <p
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              marginTop: 1,
                            }}
                          >
                            {item.date}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: activeStat.color,
                          background: `${activeStat.color}14`,
                          padding: "2px 7px",
                          borderRadius: 20,
                          flexShrink: 0,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Faculty Performance — full list modal ──────────────────────────────────
function FacultyPerformanceModal({
  open,
  onClose,
  faculty,
  delayedDocs,
  onSelectFaculty,
  avatarUrlFor,
}) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 14,
          width: "100%",
          maxWidth: 620,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            padding: "16px 20px 0",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 14,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                Faculty Performance
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                {`${faculty.length} faculty member${faculty.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "#f3f4f6",
                border: "none",
                borderRadius: 8,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X style={{ width: 15, height: 15, color: "#374151" }} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: 16,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {faculty.length === 0 ? (
            <p
              style={{
                padding: "16px 4px",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 12,
              }}
            >
              No faculty performance data yet.
            </p>
          ) : (
            faculty.map((f, idx) => (
              <FacultyPerformanceRow
                key={f.id}
                f={f}
                idx={idx}
                delayedDocs={delayedDocs}
                onClick={onSelectFaculty}
                avatarUrlFor={avatarUrlFor}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  action,
  noPad,
  accentColor,
  titleColor,
  footer,
}) {
  return (
    <div
      id={id}
      style={{
        background: "#ffffff",
        border: "1px solid #c9c4d7",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(25,27,36,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #c9c4d7",
          background: "#faf8ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: accentColor ? `${accentColor}18` : "#e6deff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              style={{ width: 15, height: 15, color: accentColor || "#5e3bdb" }}
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: titleColor || "#191b24",
                lineHeight: 1.3,
              }}
            >
              {title}
            </p>
            {subtitle && (
              <p style={{ fontSize: 12, color: "#484555", marginTop: 1 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
      <div style={{ padding: noPad ? 0 : "16px 20px", flex: 1 }}>
        {children}
      </div>
      {footer && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid #c9c4d7",
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// ── Empty state for dashboard tables — icon + message, replaces bare gray text ─
function TableEmptyState({ icon: Icon, message, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: "36px 20px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#f3f2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon style={{ width: 16, height: 16, color: "#a89cdb" }} />
          </div>
          <p style={{ fontSize: 12.5, color: "#9ca3af", fontWeight: 500 }}>
            {message}
          </p>
        </div>
      </td>
    </tr>
  );
}

function ListEmptyState({ icon: Icon, message }) {
  return (
    <div
      style={{
        padding: "36px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#f3f2ff",
          display: "grid",
          placeItems: "center",
        }}
      >
        <Icon size={16} color="#a89cdb" />
      </div>
      <p
        style={{ margin: 0, fontSize: 12.5, color: "#9ca3af", fontWeight: 500 }}
      >
        {message}
      </p>
    </div>
  );
}

// ── Table row with a subtle hover state (inline styles need JS for :hover) ──
function HoverRow({ children, style }) {
  return (
    <tr
      style={{
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        verticalAlign: "top",
        transition: "background-color 0.12s",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#faf9ff";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </tr>
  );
}

// ── Text-only action link with a hover underline, used for row-level "View"/"Track" links ──
function RowLinkButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "#5e3bdb",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = "underline";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = "none";
      }}
    >
      {children}
    </button>
  );
}

// ── Pagination footer shared by the faculty-side dashboard tables ──────────
function TablePagination({
  page,
  totalPages,
  start,
  end,
  total,
  onPrev,
  onNext,
}) {
  const btnStyle = (disabled) => ({
    padding: "5px 10px",
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    border: "1px solid #e5e7eb",
    background: disabled ? "#f9fafb" : "#fff",
    color: disabled ? "#c1c5cb" : "#374151",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background-color 0.12s, border-color 0.12s",
  });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        background: "#fcfcfd",
      }}
    >
      <span style={{ fontSize: 11, color: "#6b7280" }}>
        Showing {start}–{end} of {total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={onPrev}
          disabled={page === 1}
          style={btnStyle(page === 1)}
          onMouseEnter={(e) => {
            if (page !== 1) e.currentTarget.style.borderColor = "#ddd6fe";
          }}
          onMouseLeave={(e) => {
            if (page !== 1) e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        >
          Previous
        </button>
        <span
          style={{
            fontSize: 11,
            color: "#374151",
            fontWeight: 600,
            padding: "0 4px",
          }}
        >
          Page {page} of {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page === totalPages}
          style={btnStyle(page === totalPages)}
          onMouseEnter={(e) => {
            if (page !== totalPages)
              e.currentTarget.style.borderColor = "#ddd6fe";
          }}
          onMouseLeave={(e) => {
            if (page !== totalPages)
              e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── Quick Actions — compact shortcut list, used to fill out the right-hand
//    column under Bottlenecks & Alerts so it doesn't sit half-empty next to
//    the taller tracking table. ───────────────────────────────────────────
function QuickActionRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        border: "1px solid #ededf9",
        borderRadius: 10,
        cursor: "pointer",
        transition: "background-color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#faf8ff";
        e.currentTarget.style.borderColor = "#ddd6fe";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "#ededf9";
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: "#f3f2ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 16, height: 16, color: "#5e3bdb" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#191b24" }}>
          {title}
        </p>
        <p style={{ fontSize: 11.5, color: "#5d5e64", marginTop: 1 }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight
        style={{ width: 15, height: 15, color: "#c1c5dc", flexShrink: 0 }}
      />
    </div>
  );
}

const ADMIN_QUICK_ACTIONS = [
  {
    icon: UserCheck,
    title: "Assign Task",
    subtitle: "Delegate work to faculty",
    to: "/tasks",
  },
  {
    icon: PieChart,
    title: "View Tracking",
    subtitle: "Monitor submission progress",
    to: "/tracking",
  },
  {
    icon: Tag,
    title: "Manage Categories",
    subtitle: "Organize form categories",
    to: "/categories",
  },
  {
    icon: Users,
    title: "System Users",
    subtitle: "Manage accounts and roles",
    to: "/users",
  },
  {
    icon: Timer,
    title: "SLA Configuration",
    subtitle: "Set response and resolution targets",
    to: "/sla-configuration",
  },
];

const FACULTY_QUICK_ACTIONS = [
  {
    icon: ListTodo,
    title: "My Tasks",
    subtitle: "Review your current assignments",
    to: "/tasks",
  },
  {
    icon: FileText,
    title: "Submit Forms",
    subtitle: "Start a new form submission",
    to: "/forms",
  },
  {
    icon: Activity,
    title: "Tracking",
    subtitle: "Check the status of your items",
    to: "/tracking",
  },
  {
    icon: MessageSquare,
    title: "Messages",
    subtitle: "View your inbox",
    to: "/inbox",
  },
];

function QuickActionsPanel({ navigate, actions = ADMIN_QUICK_ACTIONS }) {
  return (
    <SectionCard
      title="Quick Actions"
      subtitle="Shortcuts to common tasks"
      icon={Zap}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map((a) => (
          <QuickActionRow
            key={a.title}
            icon={a.icon}
            title={a.title}
            subtitle={a.subtitle}
            onClick={() => navigate(a.to)}
          />
        ))}
      </div>
    </SectionCard>
  );
}

function FacultyDashboardOverview({ displayName, forms, loading, navigate }) {
  const statusOf = (row) => String(row.status || "").toLowerCase();
  const inReview = forms.filter((row) => /review|pending/.test(statusOf(row)));
  const returned = forms.filter((row) =>
    /returned|revision/.test(statusOf(row)),
  );
  const drafts = forms.filter((row) => /draft/.test(statusOf(row)));
  const approved = forms.filter((row) =>
    /approved|received/.test(statusOf(row)),
  );
  const active = forms.filter(
    (row) => !/approved|received|rejected|archived/.test(statusOf(row)),
  );
  const returnedForm = returned[0];
  const supportingAttentionItems = [
    ...returned.slice(1),
    ...inReview.filter((row) => row.id !== returnedForm?.id),
    ...drafts.filter((row) => row.id !== returnedForm?.id),
  ].slice(0, 3);
  const cards = [
    {
      label: "Active submissions",
      value: active.length,
      detail: "Across your current work",
      icon: FileText,
      color: "#7c3aed",
    },
    {
      label: "In review",
      value: inReview.length,
      detail: "With the review team",
      icon: Clock,
      color: "#b7791f",
    },
    {
      label: "Needs revision",
      value: returned.length,
      detail: "A response is required",
      icon: RotateCcw,
      color: "#c26b4d",
    },
    {
      label: "Completed",
      value: approved.length,
      detail: "Approved records",
      icon: CheckCircle2,
      color: "#27805d",
    },
  ];
  return (
    <div
      className="faculty-dashboard-canvas"
      style={{
        marginLeft: 72,
        marginRight: 48,
        padding: "28px 0 44px",
      }}
    >
      <section className="faculty-dashboard-hero">
        <div>
          <span>Faculty workspace · your document flow</span>
          <h1>Good morning, {displayName}.</h1>
          <p>
            Keep your submissions moving, respond to review requests, and see
            each handoff in one place.
          </p>
        </div>
        <button type="button" onClick={() => navigate("/forms?tab=submit")}>
          <Plus size={16} /> Start a submission
        </button>
      </section>
      <section className="faculty-dashboard-stats">
        {cards.map((card) => {
          const CardIcon = card.icon;
          return (
            <article key={card.label}>
              <div>
                <span>{card.label}</span>
                <strong>{String(card.value).padStart(2, "0")}</strong>
                <small>{card.detail}</small>
              </div>
              <i style={{ color: card.color, background: `${card.color}18` }}>
                <CardIcon size={16} />
              </i>
            </article>
          );
        })}
      </section>
      <section className="faculty-dashboard-focus">
        <div className="faculty-attention-stack">
          <article>
            {returnedForm ? (
              <>
                <span className="faculty-kicker">Needs your attention</span>
                <div className="faculty-return-title">
                  <i>
                    <RotateCcw size={17} />
                  </i>
                  <div>
                    <h2>{returnedForm.title}</h2>
                    <p>Returned for revision · {returnedForm.date}</p>
                  </div>
                </div>
                <div className="faculty-return-note">
                  Review the requested updates, attach the revised file, and
                  resubmit it for the next handoff.
                </div>
                <button type="button" onClick={() => navigate("/forms")}>
                  Review request <ArrowUpRight size={14} />
                </button>
              </>
            ) : (
              <>
                <span className="faculty-kicker">Your workflow</span>
                <h2>Everything is on track</h2>
                <p className="faculty-empty-copy">
                  No submissions currently need a revision from you.
                </p>
              </>
            )}
          </article>
          {supportingAttentionItems.length > 0 && (
            <div
              className="faculty-attention-list"
              aria-label="Additional submissions needing attention"
            >
              {supportingAttentionItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate("/forms")}
                >
                  <i>
                    <FileText size={13} />
                  </i>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.status} · {item.date}
                    </small>
                  </span>
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          )}
        </div>
        <article>
          <span className="faculty-kicker">Your workflow health</span>
          <h2>Every handoff is traceable</h2>
          <p>
            Your draft, file, reviewer notes, and status updates remain linked
            through PATH.
          </p>
          <div className="faculty-health-meta">
            <span>
              <ShieldCheck size={14} /> {inReview.length} records in review
            </span>
            <span>Live data</span>
          </div>
        </article>
      </section>
      <section className="faculty-dashboard-list">
        <header>
          <div>
            <span className="faculty-kicker">Your documents</span>
            <h2>Continue where you left off</h2>
          </div>
          <button type="button" onClick={() => navigate("/forms")}>
            Open My Submissions <ArrowUpRight size={14} />
          </button>
        </header>
        {loading ? (
          <p className="faculty-list-empty">Loading your submissions…</p>
        ) : (
          active.slice(0, 5).map((row) => (
            <button
              type="button"
              className="faculty-document-row"
              key={row.id}
              onClick={() => navigate("/forms")}
            >
              <i>
                <FileText size={15} />
              </i>
              <span>
                <strong>{row.title}</strong>
                <small>
                  {row.id} · {row.date}
                </small>
              </span>
              <StatusBadge s={row.status} />
              <ArrowUpRight size={15} color="#b3a6bd" />
            </button>
          ))
        )}
        {!loading && active.length === 0 && (
          <p className="faculty-list-empty">
            You have no active submissions. Start a new document to begin.
          </p>
        )}
      </section>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = (() => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return {};
    }
  })();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState("All");
  const isFacultyDashboard = !ADMIN_NAV_ROLES.includes(user.role);

  // ── Live data for the "Document, Form & Task Tracking" table ────────────────
  const [trackedItems, setTrackedItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [trackedPage, setTrackedPage] = useState(1);
  const TRACKED_PAGE_SIZE = 10;
  const [taskPage, setTaskPage] = useState(1);
  const TASK_PAGE_SIZE = 10;

  // ── Pagination for the faculty-side "My Tasks" / "My Forms" cards ───────────
  // Fixed at 5 rows per page so these cards stay a consistent height instead
  // of shrinking/growing with however many items happen to exist.
  const [myTasksPage, setMyTasksPage] = useState(1);
  const [myFormsPage, setMyFormsPage] = useState(1);
  const FACULTY_CARD_PAGE_SIZE = 5;

  // ── Live data for the "Faculty Performance Summary" widget ──────────────────
  const [facultyPerformance, setFacultyPerformance] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const [delayedDocs, setDelayedDocs] = useState([]);
  const [delayedLoading, setDelayedLoading] = useState(true);

  // Faculty profile pictures aren't included on the /api/faculty/performance
  // payload (it only carries names/counts), so we fetch the user directory
  // once and join on name wherever a faculty avatar is shown — same approach
  // as TaskAssigned.jsx.
  const [usersDirectory, setUsersDirectory] = useState([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data.users ?? data ?? [];
        if (!cancelled) setUsersDirectory(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setUsersDirectory([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);
  const avatarByName = {};
  usersDirectory.forEach((u) => {
    if (!u) return;
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();
    const name = fullName || u.full_name || u.name || u.username;
    if (name) avatarByName[name] = u.avatar_url || null;
    if (u.username) avatarByName[u.username] = u.avatar_url || null;
  });
  const avatarUrlFor = (name) => {
    const raw = avatarByName[name];
    if (!raw) return null;
    return /^https?:\/\//i.test(raw) ? raw : `${API}${raw}`;
  };

  // ── Live data for the "My Forms" widget ──────────────────────────────────
  // Uses /api/forms/my (the same server-filtered endpoint Forms.jsx calls
  // for non-program-chair users) instead of trying to match forms out of
  // /api/forms/all by submitter name — that name isn't reliably present on
  // every form record, so the match can silently come up empty.
  const [myFormsData, setMyFormsData] = useState([]);
  const [myFormsDataLoading, setMyFormsDataLoading] = useState(true);

  const fetchMyForms = useCallback(async () => {
    setMyFormsDataLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/forms/my`, { headers: authH });
      if (res.ok) {
        const data = await res.json();
        const forms = data.forms ?? data ?? [];
        const fmtDate = (d) =>
          d
            ? new Date(d).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "—";
        setMyFormsData(
          (Array.isArray(forms) ? forms : []).map((f) => ({
            id: f.tracking_id || `FRM-${f.id}`,
            title: f.category ? `${f.category} Form` : "Form Submission",
            date: fmtDate(f.filing_date || f.created_at),
            status:
              REAL_STATUS_DISPLAY[f.status?.toLowerCase()] ||
              f.status ||
              "Pending",
          })),
        );
      } else {
        console.error(
          "My forms fetch failed:",
          res.status,
          await res.text().catch(() => ""),
        );
      }
    } catch (err) {
      console.error("My forms fetch error:", err);
    } finally {
      setMyFormsDataLoading(false);
    }
  }, [token]);

  const fetchDelayedDocuments = useCallback(async () => {
    setDelayedLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/delayed-documents`, {
        headers: authH,
      });
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

  const fetchFacultyPerformance = useCallback(async () => {
    setFacultyLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API}/api/faculty/performance`, {
        headers: authH,
      });
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

  const fetchTrackedItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const authH = { Authorization: `Bearer ${token}` };
      const merged = [];
      const now = new Date();

      // Resolve user ids -> display names (same approach as Tracking.jsx)
      // IDs are normalized to strings on both write and read, since the
      // /api/users list and the faculty_id/user_id fields on tasks/forms
      // don't always agree on number vs. string, which was causing every
      // lookup to miss and fall back to "User #<id>".
      const userMap = {};
      try {
        const res = await fetch(`${API}/api/users/names`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const users = data.users ?? data ?? [];
          (Array.isArray(users) ? users : []).forEach((u) => {
            const name = u.full_name || u.name || u.username || u.email;
            if (u.id != null && name) userMap[String(u.id)] = name;
          });
        } else {
          console.error(
            "Users fetch failed:",
            res.status,
            await res.text().catch(() => ""),
          );
        }
      } catch (err) {
        console.error("Users fetch error:", err);
      }
      const nameOf = (id) =>
        (id != null && userMap[String(id)]) || (id ? `User #${id}` : "—");

      const fmtDate = (d) =>
        d
          ? new Date(d).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
      const daysSince = (d) =>
        d ? Math.max(0, Math.floor((now - new Date(d)) / 86400000)) : 0;
      const displayStatus = (s) =>
        REAL_STATUS_DISPLAY[s?.toLowerCase()] || s || "Pending";
      const priorityFor = (days, done) =>
        done ? "Low" : days >= 7 ? "Urgent" : days >= 4 ? "High" : "Normal";

      // ── Plain tracked documents ──────────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/tracking`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const documents = data.documents || data || [];
          (Array.isArray(documents) ? documents : []).forEach((d) => {
            const rawDate = d.submitted_at || d.created_at;
            const status = displayStatus(d.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            merged.push({
              id: d.tracking_id || d.document_id || `DOC-${d.id}`,
              sourceType: "document",
              title: d.title || d.document_type || "Document",
              person:
                d.submitted_by_name ||
                (d.submitted_by ? nameOf(d.submitted_by) : null) ||
                d.department ||
                "—",
              date: fmtDate(rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status,
              days: daysSince(rawDate),
              priority: priorityFor(daysSince(rawDate), done),
            });
          });
        }
      } catch (err) {
        console.error("Tracking fetch error:", err);
      }

      // ── Tasks assigned ────────────────────────────────────────────────────
      try {
        const res = await fetch(`${API}/api/tasks`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const tasks = data.tasks ?? data ?? [];
          (Array.isArray(tasks) ? tasks : []).forEach((t) => {
            const rawDate = t.created_at || t.deadline;
            const status = displayStatus(t.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            const overdue = t.deadline && new Date(t.deadline) < now && !done;
            // For overdue tasks, "days" should reflect how long past the deadline
            // it is — not how long ago the task was created.
            const taskDays = overdue
              ? daysSince(t.deadline)
              : daysSince(rawDate);
            merged.push({
              id: t.tracking_id || `TSK-${t.id}`,
              sourceType: "task",
              title: t.title,
              person: nameOf(t.faculty_id),
              date: fmtDate(t.deadline || rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status: overdue ? "Overdue" : status,
              days: taskDays,
              priority: overdue ? "Urgent" : priorityFor(taskDays, done),
            });
          });
        }
      } catch (err) {
        console.error("Tasks fetch error:", err);
      }

      // ── Forms submitted by faculty ───────────────────────────────────────
      // /api/forms/all is reviewer-only (admin / program_chair) on the
      // backend and 403s for everyone else, so faculty accounts must use
      // /api/forms/my instead — otherwise this block silently no-ops and
      // every stat card derived from form data (Submitted Forms, Pending
      // Approvals, Approved This Month, Returned/Revisions) reads 0.
      try {
        const formsEndpoint = ADMIN_NAV_ROLES.includes(user.role)
          ? "/api/forms/all"
          : "/api/forms/my";
        const res = await fetch(`${API}${formsEndpoint}`, { headers: authH });
        if (res.ok) {
          const data = await res.json();
          const forms = data.forms ?? data ?? [];
          (Array.isArray(forms) ? forms : []).forEach((f) => {
            const rawDate = f.filing_date || f.created_at;
            const status = displayStatus(f.status);
            const done = ["Approved", "Rejected", "Archived"].includes(status);
            // NOTE: f.full_name is the student the form is filed for (paired
            // with f.student_id), not who submitted it — so it must be the
            // last fallback, not the first, or every form on this dashboard
            // gets attributed to the student instead of the faculty member
            // who actually filed it.
            const facultySubmitter =
              f.submitter_name ||
              f.submitted_by_name ||
              (f.submitted_by ? nameOf(f.submitted_by) : null) ||
              f.faculty_name ||
              f.user_name ||
              f.username ||
              (f.user_id ? nameOf(f.user_id) : null) ||
              (f.faculty_id ? nameOf(f.faculty_id) : null) ||
              f.full_name ||
              "—";
            merged.push({
              id: f.tracking_id || `FRM-${f.id}`,
              sourceType: "form",
              title: f.category ? `${f.category} Form` : "Form Submission",
              person: facultySubmitter,
              date: fmtDate(rawDate),
              dateObj: rawDate ? new Date(rawDate) : null,
              status,
              days: daysSince(rawDate),
              priority: priorityFor(daysSince(rawDate), done),
            });
          });
        } else {
          console.error(
            "Forms fetch failed:",
            res.status,
            await res.text().catch(() => ""),
          );
        }
      } catch (err) {
        console.error("Forms fetch error:", err);
      }

      // Most urgent items first (Urgent > High > Normal > Low), then longest-waiting as tiebreaker
      const PRIORITY_RANK = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
      merged.sort((a, b) => {
        const rankDiff =
          (PRIORITY_RANK[a.priority] ?? 4) - (PRIORITY_RANK[b.priority] ?? 4);
        if (rankDiff !== 0) return rankDiff;
        return b.days - a.days;
      });
      setTrackedItems(merged);
    } finally {
      setItemsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTrackedItems();
    fetchFacultyPerformance();
    fetchDelayedDocuments();
    fetchMyForms();
  }, [
    token,
    fetchTrackedItems,
    fetchFacultyPerformance,
    fetchDelayedDocuments,
    fetchMyForms,
  ]);

  // Reset to page 1 whenever the tracked list is refreshed/changes size
  useEffect(() => {
    setTrackedPage(1);
  }, [trackedItems.length]);

  useEffect(() => {
    setMyTasksPage(1);
  }, [trackedItems.length]);

  useEffect(() => {
    setMyFormsPage(1);
  }, [myFormsData.length]);

  const trackedTotalPages = Math.max(
    1,
    Math.ceil(trackedItems.length / TRACKED_PAGE_SIZE),
  );
  const trackedPageItems = trackedItems.slice(
    (trackedPage - 1) * TRACKED_PAGE_SIZE,
    trackedPage * TRACKED_PAGE_SIZE,
  );

  const displayName =
    user.full_name || user.fullName || user.name || user.username || "User";
  const canViewAdminNav = ADMIN_NAV_ROLES.includes(user.role);
  const displayRole =
    (user.role || "")
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(" ") || "User";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  /* ════════════════════════════════════════════════════════════════════
     Bottleneck & Alerts — live, ported from Reports.jsx so this widget
     shows the same real-time alerts as the full Bottleneck report instead
     of static sample data. Derived from trackedItems / facultyPerformance
     (not scoped to any filter bar, since these are department-wide
     operational alerts). Each threshold below is the SLA/rule used to
     decide whether something gets flagged. ══════════════════════════ */
  const DONE_STATUSES = ["Approved", "Rejected", "Archived", "Completed"];

  const FACULTY_WORKLOAD = useMemo(() => {
    return facultyPerformance.map((f) => {
      const pending = f.pending_count ?? 0;
      const completed = f.completed_count ?? 0;
      const active = f.active_count ?? 0;
      const name = f.full_name || f.name || "—";
      const delayedFromEndpoint = delayedDocs.filter(
        (d) => d.faculty_name === name,
      ).length;
      const delayedFromItems = trackedItems.filter(
        (i) => i.person === name && i.status === "Overdue",
      ).length;
      return {
        name,
        assigned: active + pending + completed,
        pending,
        completed,
        delayed: delayedFromEndpoint || delayedFromItems,
        rate: Math.round(
          f.performance_score ??
            (active + pending + completed > 0
              ? (completed / (active + pending + completed)) * 100
              : 0),
        ),
      };
    });
  }, [facultyPerformance, delayedDocs, trackedItems]);

  // ── Faculty Performance Summary panel — aggregate stats + "team signal"
  //    highlight, derived live from FACULTY_WORKLOAD (mirrors the summary
  //    object from the DashboardLayout mockup, but computed from real data).
  const facultyPerformanceSummary = useMemo(() => {
    const totals = FACULTY_WORKLOAD.reduce(
      (sum, f) => ({
        assigned: sum.assigned + f.assigned,
        completed: sum.completed + f.completed,
        pending: sum.pending + f.pending,
        delayed: sum.delayed + f.delayed,
      }),
      { assigned: 0, completed: 0, pending: 0, delayed: 0 },
    );
    const top = [...FACULTY_WORKLOAD].sort((a, b) => b.rate - a.rate)[0];
    return {
      ...totals,
      open: totals.pending,
      onTimeRate: totals.assigned
        ? Math.max(
            0,
            Math.round(
              ((totals.assigned - totals.delayed) / totals.assigned) * 100,
            ),
          )
        : 0,
      atRisk: FACULTY_WORKLOAD.filter(
        (f) => f.delayed > 0 || f.rate < 80,
      ).length,
      top,
    };
  }, [FACULTY_WORKLOAD]);

  const ALERT_SLA = {
    approvalWaitDays: 5, // "For Approval" items waiting longer than this breach SLA
    workflowStagnantDays: 5, // non-task items sitting untouched this long count as a workflow delay
    pendingReviewDays: 5, // forms pending longer than this get bundled into one alert
    highWorkloadTasks: 6, // active (not-yet-completed) tasks per faculty before flagging
    returnedStagnantDays: 3, // items sent back for revision that haven't been resubmitted
  };

  const BOTTLENECK_ALERTS = useMemo(() => {
    const alerts = [];
    const active = trackedItems.filter(
      (i) => !DONE_STATUSES.includes(i.status),
    );

    // 1) Overdue Approvals
    active
      .filter(
        (i) =>
          i.status === "For Approval" && i.days >= ALERT_SLA.approvalWaitDays,
      )
      .sort((a, b) => b.days - a.days)
      .forEach((i) => {
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
      .filter((i) => i.sourceType === "task" && i.status === "Overdue")
      .sort((a, b) => b.days - a.days)
      .forEach((i) => {
        alerts.push({
          key: `task-${i.id}`,
          tier: "critical",
          title: "Overdue Task",
          message: `${i.id} (${i.title}) is ${i.days} day${i.days === 1 ? "" : "s"} past deadline.`,
          icon: AlertTriangle,
        });
      });

    // 3) High Workload — faculty carrying more active tasks than the threshold
    FACULTY_WORKLOAD.map((f) => ({
      ...f,
      active: Math.max(0, f.assigned - f.completed),
    }))
      .filter((f) => f.active >= ALERT_SLA.highWorkloadTasks)
      .sort((a, b) => b.active - a.active)
      .forEach((f) => {
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
      .filter(
        (i) =>
          i.sourceType !== "task" &&
          i.status !== "For Approval" &&
          i.days >= ALERT_SLA.workflowStagnantDays,
      )
      .sort((a, b) => b.days - a.days)
      .forEach((i) => {
        alerts.push({
          key: `workflow-${i.id}`,
          tier: "warning",
          title: "Workflow Delay",
          message: `${i.id} (${i.title}) has been stagnant for ${i.days} day${i.days === 1 ? "" : "s"}.`,
          icon: Clock,
        });
      });

    // 5) Pending Review — bundled into a single alert
    const pendingCount = active.filter(
      (i) => i.status === "Pending" && i.days >= ALERT_SLA.pendingReviewDays,
    ).length;
    if (pendingCount > 0) {
      alerts.push({
        key: "pending-review",
        tier: "info",
        title: "Pending Review",
        message: `${pendingCount} form${pendingCount === 1 ? "" : "s"} have been pending for more than ${ALERT_SLA.pendingReviewDays} days without action.`,
        icon: ClipboardList,
      });
    }

    // 6) Returned for Revision — sent back to the submitter and left untouched
    active
      .filter(
        (i) =>
          i.status === "Returned" && i.days >= ALERT_SLA.returnedStagnantDays,
      )
      .sort((a, b) => b.days - a.days)
      .forEach((i) => {
        alerts.push({
          key: `returned-${i.id}`,
          tier: "warning",
          title: "Returned for Revision",
          message: `${i.id} (${i.title}) was returned to ${i.person} ${i.days} day${i.days === 1 ? "" : "s"} ago and hasn't been resubmitted.`,
          icon: RotateCcw,
        });
      });

    const tierRank = { critical: 0, warning: 1, info: 2 };
    return alerts.sort((a, b) => tierRank[a.tier] - tierRank[b.tier]);
  }, [trackedItems, FACULTY_WORKLOAD]);

  // Tasks for the "Pending Tasks Overview" widget — pulled from the same
  // merged trackedItems used by the Document, Form & Task Tracking table
  // (sourceType === "task"), instead of mock data.
  const taskItems = trackedItems
    .filter((t) => t.sourceType === "task")
    .map((t) => {
      const overdue = t.status === "Overdue";
      const done = ["Approved", "Completed", "Archived"].includes(t.status);
      const progress = done
        ? 100
        : overdue
          ? 20
          : t.status === "Pending"
            ? 0
            : 50;
      return {
        id: t.id,
        name: t.title,
        assignedTo: t.person,
        deadline: t.date,
        status: t.status,
        overdue,
        progress,
      };
    });

  // "In Progress" is a bucket, not a single literal status — it covers tasks
  // that are actively moving: waiting for approval, sent back for revisions,
  // or still being worked on by faculty. "Not Started" stays narrow and only
  // matches tasks that haven't been touched yet.
  const IN_PROGRESS_STATUSES = [
    "In Progress",
    "Pending",
    "Under Review",
    "For Approval",
    "Returned",
  ];
  const isInProgress = (t) =>
    !t.overdue && IN_PROGRESS_STATUSES.includes(t.status);

  const filteredTasks = taskItems.filter((t) =>
    taskFilter === "All"
      ? true
      : taskFilter === "Overdue"
        ? t.overdue
        : taskFilter === "In Progress"
          ? isInProgress(t)
          : taskFilter === "Not Started"
            ? !t.overdue && t.status === "Not Started"
            : t.status === taskFilter,
  );

  const taskTotalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / TASK_PAGE_SIZE),
  );
  const taskPageItems = filteredTasks.slice(
    (taskPage - 1) * TASK_PAGE_SIZE,
    taskPage * TASK_PAGE_SIZE,
  );

  useEffect(() => {
    setTaskPage(1);
  }, [taskFilter, filteredTasks.length]);

  // ── KPI strip values — derived from the same live trackedItems / faculty
  // data used elsewhere on the dashboard, instead of hardcoded sample numbers.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // "Pending Approvals" should catch an approval both before it's submitted
  // (status "Pending", i.e. assigned/drafted but not yet sent in) and while
  // it's actively awaiting a decision after submission ("Under Review" /
  // "For Approval") — not just the pre-submission state.
  const pendingApprovalsCount = trackedItems.filter((t) =>
    ["Pending", "Under Review", "For Approval"].includes(t.status),
  ).length;

  const activeTasksCount = trackedItems.filter(
    (t) =>
      t.sourceType === "task" &&
      !["Approved", "Completed", "Archived", "Rejected"].includes(t.status),
  ).length;

  const documentsUnderReviewCount = trackedItems.filter(
    (t) => t.status === "Under Review" || t.status === "For Approval",
  ).length;

  const overdueItemsCount = trackedItems.filter(
    (t) => t.status === "Overdue",
  ).length;

  const approvedThisMonthCount = trackedItems.filter(
    (t) => t.status === "Approved" && t.dateObj && t.dateObj >= monthStart,
  ).length;

  const activeFacultyCount = facultyPerformance.length;

  const assignedTasksCount = trackedItems.filter(
    (t) => t.sourceType === "task",
  ).length;
  const submittedFormsCount = trackedItems.filter(
    (t) => t.sourceType === "form",
  ).length;
  const returnedRevisionsCount = trackedItems.filter(
    (t) => t.status === "Returned",
  ).length;

  const kpis = [
    {
      label: "Pending Approvals",
      value: String(pendingApprovalsCount),
      color: "#5e3bdb",
      tint: "#cabeff",
      icon: ClipboardList,
    },
    {
      label: "Active Tasks",
      value: String(activeTasksCount),
      color: "#d97706",
      tint: "#fde68a",
      icon: ListTodo,
    },
    {
      label: "Assigned Tasks",
      value: String(assignedTasksCount),
      color: "#0284c7",
      tint: "#7dd3fc",
      icon: Eye,
    },
    {
      label: "Overdue Items",
      value: String(overdueItemsCount),
      color: "#dc2626",
      tint: "#fca5a5",
      icon: AlertTriangle,
    },
    {
      label: "Approved This Month",
      value: String(approvedThisMonthCount),
      color: "#059669",
      tint: "#6ee7b7",
      icon: CheckCircle2,
    },
    {
      label: "Submitted Forms",
      value: String(submittedFormsCount),
      color: "#481bc6",
      tint: "#cabeff",
      icon: FileText,
    },
    {
      label: "Returned/Revisions",
      value: String(returnedRevisionsCount),
      color: "#ea580c",
      tint: "#fdba74",
      icon: RotateCcw,
    },
  ];

  const kpisLoading = itemsLoading || facultyLoading;
  // Used by the PATH Overview workflow-health card. Keep this derived from
  // the same live tracked items used by the KPI strip so the new layout never
  // references an undefined render-time value.
  const onTimeCompletionRate = trackedItems.length
    ? Math.round(
        ((trackedItems.length - overdueItemsCount) / trackedItems.length) * 100,
      )
    : 0;

  /* ── Faculty-side dashboard data ──────────────────────────────────────
     Everything below is scoped to the logged-in faculty member (matched
     by display name against trackedItems' `person` field, same approach
     FacultyDetailPanel uses) and only rendered when !canViewAdminNav. */
  const myItems = trackedItems.filter((t) => t.person === displayName);
  const myTasksFaculty = myItems.filter((t) => t.sourceType === "task");
  const myFormsFaculty = myItems.filter((t) => t.sourceType === "form");

  const myTasksTotalPages = Math.max(
    1,
    Math.ceil(myTasksFaculty.length / FACULTY_CARD_PAGE_SIZE),
  );
  const myTasksPageItems = myTasksFaculty.slice(
    (myTasksPage - 1) * FACULTY_CARD_PAGE_SIZE,
    myTasksPage * FACULTY_CARD_PAGE_SIZE,
  );
  const myFormsTotalPages = Math.max(
    1,
    Math.ceil(myFormsData.length / FACULTY_CARD_PAGE_SIZE),
  );
  const myFormsPageItems = myFormsData.slice(
    (myFormsPage - 1) * FACULTY_CARD_PAGE_SIZE,
    myFormsPage * FACULTY_CARD_PAGE_SIZE,
  );

  const trackingBucketOf = (status) => {
    if (["Approved", "Completed", "Archived", "Received"].includes(status))
      return "Approved";
    if (status === "Rejected") return "Rejected";
    if (status === "Returned") return "Returned";
    return "Pending";
  };
  const trackingBuckets = { Approved: 0, Pending: 0, Returned: 0, Rejected: 0 };
  myItems.forEach((t) => {
    trackingBuckets[trackingBucketOf(t.status)]++;
  });
  const trackingOverviewData = [
    { name: "Approved", value: trackingBuckets.Approved, color: "#22c55e" },
    { name: "Pending", value: trackingBuckets.Pending, color: "#f59e0b" },
    { name: "Returned", value: trackingBuckets.Returned, color: "#6366f1" },
    { name: "Rejected", value: trackingBuckets.Rejected, color: "#ef4444" },
  ];
  const trackingOverviewTotal = trackingOverviewData.reduce(
    (s, d) => s + d.value,
    0,
  );

  // Conic-gradient stops for the octagon "squircle" donut ring — each slice
  // gets a small gap on either side so segments read as distinct pieces.
  const TRACKING_RING_GAP_DEG = 5;
  let trackingRingAngle = 0;
  const trackingRingStops = [];
  trackingOverviewData.forEach((d) => {
    if (!d.value) return;
    const sweep = (d.value / (trackingOverviewTotal || 1)) * 360;
    const start =
      trackingRingAngle +
      (sweep < TRACKING_RING_GAP_DEG * 2 ? 0 : TRACKING_RING_GAP_DEG / 2);
    const end =
      trackingRingAngle +
      sweep -
      (sweep < TRACKING_RING_GAP_DEG * 2 ? 0 : TRACKING_RING_GAP_DEG / 2);
    trackingRingStops.push(`${d.color} ${start}deg ${end}deg`);
    trackingRingAngle += sweep;
  });
  const trackingRingGradient = `conic-gradient(${trackingRingStops.join(", ")})`;
  const OCTAGON_CLIP =
    "polygon(29% 0%, 71% 0%, 100% 29%, 100% 71%, 71% 100%, 29% 100%, 0% 71%, 0% 29%)";

  const DONE_FOR_DEADLINES = ["Approved", "Completed", "Archived", "Rejected"];
  const upcomingDeadlines = myItems
    .filter((t) => !DONE_FOR_DEADLINES.includes(t.status) && t.dateObj)
    .map((t) => ({ ...t, daysLeft: Math.ceil((t.dateObj - now) / 86400000) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  /* ════════════════════════════════════════════════════════════════════
     Charts, activity feed, workflow snapshot & department overview —
     all derived live from trackedItems / facultyPerformance / delayedDocs
     (the same fetched state powering the rest of the dashboard) instead
     of hardcoded sample data. Two notes on the data we don't have yet:
       • There's no completion/approval timestamp in the API responses,
         only a submission date — so "processing time" and "this month's
         completions" are approximated from the submission month + the
         item's current age. Add an `updated_at`/`resolved_at` column to
         documents/forms/tasks (and return it from /api/tracking,
         /api/tasks, /api/forms/all) to make these exact.
       • Recent Activity is reconstructed from the tracking/task/form
         rows themselves (most-recently-dated items), not a true audit
         log — so it shows the latest submissions/approvals/overdue
         items, but can't distinguish e.g. "assigned" from "created" the
         way a dedicated activity_log table + /api/activity endpoint
         could. ══════════════════════════════════════════════════════ */
  const DONE_ITEM_STATUSES = ["Approved", "Completed", "Archived"];
  const MONTH_ABBR = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    last6Months.push({
      label: MONTH_ABBR[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  // Approval Rate donut — status breakdown for items submitted this month
  const monthStartForCharts = new Date(now.getFullYear(), now.getMonth(), 1);
  const itemsThisMonth = trackedItems.filter(
    (t) => t.dateObj && t.dateObj >= monthStartForCharts,
  );
  const approvalRateData = [
    {
      name: "Approved",
      value: itemsThisMonth.filter(
        (t) => t.status === "Approved" || t.status === "Completed",
      ).length,
      color: "#059669",
    },
    {
      name: "Rejected",
      value: itemsThisMonth.filter((t) => t.status === "Rejected").length,
      color: "#dc2626",
    },
    {
      name: "Returned",
      value: itemsThisMonth.filter((t) => t.status === "Returned").length,
      color: "#d97706",
    },
    {
      name: "Pending",
      value: itemsThisMonth.filter(
        (t) =>
          !DONE_ITEM_STATUSES.includes(t.status) &&
          t.status !== "Rejected" &&
          t.status !== "Returned",
      ).length,
      color: "#5e3bdb",
    },
  ];

  // Task Completion — assigned vs completed tasks, last 6 calendar weeks
  const last6Weeks = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - now.getDay() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    last6Weeks.push({ label: `W${6 - i}`, start, end });
  }
  const allTaskItems = trackedItems.filter((t) => t.sourceType === "task");
  const taskCompletionData = last6Weeks.map(({ label, start, end }) => {
    const inWeek = allTaskItems.filter(
      (t) => t.dateObj && t.dateObj >= start && t.dateObj < end,
    );
    return {
      week: label,
      assigned: inWeek.length,
      completed: inWeek.filter((t) => DONE_ITEM_STATUSES.includes(t.status))
        .length,
    };
  });

  // Recent Activity — most recently dated documents/forms/tasks, newest first
  const ACTIVITY_PRESET_BY_STATUS = {
    Approved: { action: "Approved", type: "approved" },
    Completed: { action: "Completed task", type: "completed" },
    Rejected: { action: "Rejected", type: "revision" },
    Returned: { action: "Returned for revision", type: "revision" },
    Overdue: { action: "Overdue — no update", type: "overdue" },
  };
  const recentActivityData = [...trackedItems]
    .filter((t) => t.dateObj)
    .sort((a, b) => b.dateObj - a.dateObj)
    .slice(0, 8)
    .map((t) => {
      const preset = ACTIVITY_PRESET_BY_STATUS[t.status];
      const action = preset
        ? preset.action
        : t.sourceType === "task"
          ? "Assigned task"
          : "Submitted form";
      const type = preset
        ? preset.type
        : t.sourceType === "task"
          ? "assigned"
          : "submitted";
      return {
        id: `${t.sourceType}-${t.id}`,
        time: t.dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        actor: t.person || "—",
        action,
        target: t.title ? `${t.title}${t.id ? ` — ${t.id}` : ""}` : t.id,
        type,
      };
    });

  // Still used by Department Overview's "Active Workflows" stat
  const activeWorkflowItems = trackedItems.filter(
    (t) => !DONE_ITEM_STATUSES.includes(t.status) && t.status !== "Rejected",
  );

  // Department Overview — live faculty/workflow/form/task counts
  const formsSubmittedThisMonth = itemsThisMonth.filter(
    (t) => t.sourceType === "form",
  ).length;
  const tasksCompletedThisMonth = trackedItems.filter(
    (t) =>
      t.sourceType === "task" &&
      DONE_ITEM_STATUSES.includes(t.status) &&
      t.dateObj &&
      t.dateObj >= monthStartForCharts,
  ).length;
  const approvedItemsOnly = trackedItems.filter((t) => t.status === "Approved");
  const avgApprovalDays = approvedItemsOnly.length
    ? approvedItemsOnly.reduce((sum, t) => sum + t.days, 0) /
      approvedItemsOnly.length
    : 0;

  // Monthly Task Completion Trend — completed tasks per month, last 6 months,
  // powers the Department Overview mini bar chart (mirrors the DS PATH mockup).
  const monthlyTaskCompletionData = last6Months.map(
    ({ label, year, month }) => ({
      month: label,
      completed: allTaskItems.filter(
        (t) =>
          DONE_ITEM_STATUSES.includes(t.status) &&
          t.dateObj &&
          t.dateObj.getFullYear() === year &&
          t.dateObj.getMonth() === month,
      ).length,
    }),
  );
  const maxMonthlyTaskCompletion = Math.max(
    1,
    ...monthlyTaskCompletionData.map((d) => d.completed),
  );
  const prevMonthTaskCompletion =
    monthlyTaskCompletionData.length > 1
      ? monthlyTaskCompletionData[monthlyTaskCompletionData.length - 2]
          .completed
      : 0;
  const taskCompletionPctChange =
    prevMonthTaskCompletion > 0
      ? Math.round(
          ((tasksCompletedThisMonth - prevMonthTaskCompletion) /
            prevMonthTaskCompletion) *
            1000,
        ) / 10
      : null;

  return (
    <div
      className="path-overview-shell path-dashboard"
      style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 13,
        color: "#27213a",
        background: "#f8f7ff",
      }}
    >
      {/* Shell/container CSS ported from DashboardLayout.jsx (sidebar & topbar rules excluded) */}
      <style>{DASHBOARD_LAYOUT_CSS}</style>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@600;700;800&display=swap');
.path-overview-shell{--path-ink:#27213a;--path-muted:#776b83;--path-violet:#7c3aed;--path-violet-2:#8b5cf6;--path-lilac:#f1ebff;--path-paper:#f8f7ff;--path-border:#ebe4f4;background:var(--path-paper)!important;color:var(--path-ink)!important}
.path-overview-shell h1,.path-overview-shell h2,.path-overview-shell h3{font-family:Manrope,'DM Sans',sans-serif!important;letter-spacing:-.025em}
.path-overview-shell button{transition:transform .16s ease,box-shadow .16s ease,background .16s ease}
.path-overview-shell button:active{transform:scale(.97)}
.path-overview-shell input:focus{border-color:var(--path-violet-2)!important;box-shadow:0 0 0 3px rgba(139,92,246,.13)!important}
.path-overview-shell>div:last-child{background:var(--path-paper)!important}
.path-overview-shell>div:last-child>div:nth-child(2){background:var(--path-paper)!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:first-child{padding:42px 48px 30px!important;border-bottom:1px solid var(--path-border)!important;background:linear-gradient(135deg,#fbfaff 0%,#f8f7ff 58%,#f2ebff 100%)!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:first-child h1{font-size:36px!important;color:var(--path-ink)!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:first-child p{color:var(--path-muted)!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:first-child>div:last-child{margin-top:26px!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:first-child>div:last-child>div{background:#fff!important;border:1px solid var(--path-border)!important;border-radius:16px!important;box-shadow:0 8px 22px rgba(76,29,149,.06)!important;padding:18px!important}
.path-overview-shell>div:last-child>div:nth-child(2)>div:nth-child(3){padding:28px 48px!important;gap:22px!important}
.path-overview-shell table thead tr{background:#faf7ff!important;border-bottom-color:#e7def2!important}
.path-overview-shell table tbody tr{border-bottom-color:#f0eaf5!important}
.path-overview-shell table th{color:#8b7c96!important;font-weight:700!important;font-size:10px!important;letter-spacing:.08em!important}
.path-overview-shell table td{color:#51465e!important}
.path-hero{background:#fbfaff!important}
.path-stat-grid{grid-template-columns:1.18fr .92fr 1.08fr .92fr!important}
.path-stat-card strong{letter-spacing:-.04em}
.path-content-area{max-width:1500px;width:100%;margin:0 auto;box-sizing:border-box}
.path-main-grid{grid-template-columns:minmax(0,1.65fr) minmax(310px,.8fr)!important;gap:14px!important}
.path-main-grid>article:first-child{border-top:2px solid #7c3aed!important}
.path-lower-grid{grid-template-columns:minmax(0,1.65fr) minmax(310px,.8fr)!important;gap:14px!important}
.path-lower-grid>article{border-radius:10px 10px 26px 10px!important}
.faculty-dashboard-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:22px;margin:18px 48px 0;min-height:146px;padding:25px 22px;border-left:2px solid #bca5ef;border-bottom:1px solid #e6dfee;background:linear-gradient(105deg,#fbf9ff,#f4efff)}.faculty-dashboard-hero>div>span,.faculty-kicker{display:block;color:#978ca2;font-size:9px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.faculty-dashboard-hero h1,.faculty-dashboard-hero h2,.faculty-dashboard-focus h2,.faculty-dashboard-list h2{font-family:Manrope,'DM Sans',sans-serif}.faculty-dashboard-hero h1{margin:9px 0 7px;color:#34283d;font-size:clamp(30px,3vw,42px);line-height:1;letter-spacing:-.06em}.faculty-dashboard-hero p{max-width:620px;margin:0;color:#8f8398;font-size:11px;line-height:1.6}.faculty-dashboard-hero>button,.faculty-dashboard-focus article>button{display:inline-flex;align-items:center;justify-content:center;gap:7px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:10px;font-weight:800;cursor:pointer}.faculty-dashboard-hero>button{min-height:36px;padding:0 14px;box-shadow:0 8px 16px rgba(124,58,237,.22)}.faculty-dashboard-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:16px 48px}.faculty-dashboard-stats article{display:flex;justify-content:space-between;min-height:105px;padding:15px;border:1px solid #e6dfee;border-radius:11px;background:#fff;box-shadow:0 9px 22px rgba(54,36,87,.04)}.faculty-dashboard-stats span,.faculty-dashboard-stats small{display:block;color:#988d9f;font-size:8px}.faculty-dashboard-stats span{font-weight:800;letter-spacing:.08em;text-transform:uppercase}.faculty-dashboard-stats strong{display:block;margin-top:14px;color:#3e3047;font-family:Manrope,'DM Sans',sans-serif;font-size:26px;letter-spacing:-.06em}.faculty-dashboard-stats i{display:grid;width:28px;height:28px;place-items:center;border-radius:8px}.faculty-dashboard-focus{display:grid;grid-template-columns:minmax(0,1.18fr) minmax(280px,.82fr);gap:16px;margin:0 48px}.faculty-dashboard-focus article,.faculty-dashboard-list{border:1px solid #e5deed;border-radius:11px;background:#fff;box-shadow:0 12px 30px rgba(57,36,93,.045)}.faculty-dashboard-focus article{padding:19px}.faculty-dashboard-focus h2{margin:8px 0 0;color:#44354d;font-size:17px;letter-spacing:-.04em}.faculty-return-title{display:flex;align-items:center;gap:10px;margin-top:15px}.faculty-return-title>i{display:grid;width:33px;height:33px;place-items:center;border-radius:9px;background:#fff2e8;color:#b86f5c}.faculty-return-title h2{margin:0;font-size:14px}.faculty-return-title p,.faculty-dashboard-focus article>p{margin:4px 0 0;color:#9c92a3;font-size:9px;line-height:1.5}.faculty-return-note{margin:15px 0;padding:10px;border:1px solid #efe0c7;border-radius:8px;background:#fffdf8;color:#81634b;font-size:9px;line-height:1.55}.faculty-dashboard-focus article>button{width:100%;min-height:33px}.faculty-health-meta{display:flex;justify-content:space-between;gap:10px;margin-top:20px;padding-top:13px;border-top:1px solid #eee9f1;color:#978c9e;font-size:8px}.faculty-health-meta span:first-child{display:flex;align-items:center;gap:5px;color:#6a5c73;font-weight:800}.faculty-dashboard-list{margin:16px 48px 28px;overflow:hidden}.faculty-dashboard-list header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding:18px 19px;border-bottom:1px solid #eee9f1}.faculty-dashboard-list h2{margin:5px 0 0;color:#44354d;font-size:17px;letter-spacing:-.04em}.faculty-dashboard-list header button{display:flex;align-items:center;gap:5px;border:0;background:transparent;color:#7543c7;font-size:9px;font-weight:800;cursor:pointer}.faculty-document-row{display:grid;grid-template-columns:32px minmax(0,1fr) 100px 18px;gap:10px;align-items:center;width:100%;min-height:67px;padding:11px 19px;border:0;border-bottom:1px solid #f0edf4;background:#fff;text-align:left;cursor:pointer}.faculty-document-row:hover{background:#fbf9ff}.faculty-document-row>i{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;background:#eee8fb;color:#7750c4}.faculty-document-row>span{min-width:0}.faculty-document-row strong,.faculty-document-row small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.faculty-document-row strong{color:#51405a;font-family:Manrope,'DM Sans',sans-serif;font-size:10px}.faculty-document-row small{margin-top:4px;color:#a097a6;font-size:8px}.faculty-list-empty{padding:28px 19px;color:#978c9e;font-size:10px}
@media(max-width:1100px){.path-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.path-content-area{max-width:none}.path-main-grid,.path-lower-grid{grid-template-columns:1fr!important}}
@media(max-width:900px){.path-hero{padding:28px 20px 22px!important}.path-hero h1{font-size:29px!important}.path-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.path-stat-card{padding:15px!important}.path-stat-card strong{font-size:24px!important}.path-content-area{padding:20px 16px 30px!important;overflow-x:hidden}.path-content-area>section{grid-template-columns:1fr!important}.path-overview-heading{align-items:flex-start!important}.path-overview-shell table{min-width:760px}.path-overview-shell>div:last-child>div:nth-child(2)>div:nth-child(3)>div{overflow-x:auto}.faculty-dashboard-hero,.faculty-dashboard-stats,.faculty-dashboard-focus,.faculty-dashboard-list{margin-left:20px;margin-right:20px}.faculty-dashboard-hero{align-items:flex-start;flex-direction:column}.faculty-dashboard-stats{grid-template-columns:repeat(2,1fr);gap:10px}.faculty-dashboard-focus{grid-template-columns:1fr}.faculty-dashboard-list{margin-bottom:24px}}
`}</style>
      <style>{`
        .path-overview-shell .dashboard-workspace-canvas .path-hero {
          margin: 0 !important;
          border-radius: 16px !important;
        }
        .path-overview-shell .dashboard-workspace-canvas .path-content-area {
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .path-overview-shell .dashboard-workspace-canvas .faculty-dashboard-hero,
        .path-overview-shell .dashboard-workspace-canvas .faculty-dashboard-stats,
        .path-overview-shell .dashboard-workspace-canvas .faculty-dashboard-focus,
        .path-overview-shell .dashboard-workspace-canvas .faculty-dashboard-list {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }
        .path-overview-shell .faculty-dashboard-canvas {
          box-sizing: border-box;
          margin-left: 64px !important;
          margin-right: 48px !important;
          padding: 28px 0 44px !important;
        }
        @media (min-width: 1100px) {
          .path-overview-shell .faculty-dashboard-canvas {
            margin-left: clamp(64px, 5vw, 84px) !important;
            margin-right: clamp(48px, 5vw, 84px) !important;
          }
        }
        .path-overview-shell .faculty-dashboard-canvas .faculty-dashboard-hero {
          margin: 0 !important;
          border-left: 0 !important;
          border-radius: 16px !important;
        }
        .faculty-attention-stack { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
        .faculty-attention-list { display: flex; flex-direction: column; overflow: hidden; margin-top: 1px; padding-top: 8px; border-top: 1px solid #eee9f1; }
        .faculty-attention-list button { display: grid; grid-template-columns: 25px minmax(0, 1fr) 14px; align-items: center; gap: 8px; width: 100%; min-height: 42px; padding: 6px 1px; border: 0; border-bottom: 1px solid #f3f0f5; background: transparent; color: #51405a; text-align: left; cursor: pointer; }
        .faculty-attention-list button:last-child { border-bottom: 0; }
        .faculty-attention-list button:hover { color: #7543c7; }
        .faculty-attention-list button > i { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 7px; background: #f1ebff; color: #7951c7; }
        .faculty-attention-list button > span { min-width: 0; }
        .faculty-attention-list button strong, .faculty-attention-list button small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .faculty-attention-list button strong { font-family: Manrope, 'DM Sans', sans-serif; font-size: 9px; }
        .faculty-attention-list button small { margin-top: 3px; color: #9d93a4; font-size: 8px; }
        @media (max-width: 900px) {
          .path-overview-shell .dashboard-workspace-canvas {
            padding: 18px 20px 30px !important;
          }
          .path-overview-shell .dashboard-workspace-canvas .path-hero {
            border-radius: 12px !important;
          }
          .path-overview-shell .faculty-dashboard-canvas {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding: 18px 20px 30px !important;
          }
        }
      `}</style>
      <style>{`
        .path-overview-shell .dashboard-workspace-canvas{padding:28px 48px 44px 64px!important;background:#f8f7ff!important}@media(min-width:1100px){.path-overview-shell .dashboard-workspace-canvas{padding-left:clamp(64px,5vw,84px)!important;padding-right:clamp(48px,5vw,84px)!important}}.path-overview-shell .dashboard-workspace-canvas .path-hero{min-height:146px!important;padding:25px 28px!important;margin:0!important;border:1px solid #ebe4f4!important;border-radius:16px!important;background:#fbfaff!important}.path-overview-shell .dashboard-workspace-canvas .path-hero h1{margin:14px 0 6px!important;font-size:clamp(28px,3vw,34px)!important;line-height:1.15!important;letter-spacing:-.03em!important}.path-overview-shell .dashboard-workspace-canvas .path-hero p{font-size:14px!important;line-height:1.5!important;color:#615a6d!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-grid{gap:13px!important;margin-top:16px!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-card{min-height:105px!important;padding:15px!important;border-radius:11px!important;box-shadow:0 9px 22px rgba(54,36,87,.04)!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-card>div:first-child>span:first-child{font-size:8px!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-card strong{margin-top:14px!important;font-size:26px!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-card>div:last-child{margin-top:8px!important;font-size:8px!important}.path-overview-shell .dashboard-workspace-canvas .path-content-area{gap:16px!important}.path-overview-shell .dashboard-workspace-canvas .path-overview-heading>div:first-child>div{font-size:9px!important}.path-overview-shell .dashboard-workspace-canvas .path-overview-heading h2{margin-top:5px!important;font-size:17px!important;letter-spacing:-.04em!important}.path-overview-shell .dashboard-workspace-canvas .path-overview-heading button{font-size:9px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid,.path-overview-shell .dashboard-workspace-canvas .path-lower-grid{gap:16px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article,.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article{border-radius:11px!important;box-shadow:0 12px 30px rgba(57,36,93,.045)!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:first-child>div:first-child>button{min-height:67px!important;padding:11px 19px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:first-child>div:first-child>button strong{font-family:Manrope,'DM Sans',sans-serif!important;font-size:10px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:first-child>div:first-child>button small{font-size:8px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:first-child>div:last-child{padding:10px 19px!important;font-size:8px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:nth-child(2),.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article{padding:19px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid h3,.path-overview-shell .dashboard-workspace-canvas .path-lower-grid h3{margin-top:5px!important;font-size:17px!important;letter-spacing:-.04em!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:first-child>div>div:first-child{font-size:9px!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:first-child button{font-size:9px!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:nth-child(2){margin-top:15px!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:nth-child(2)>div{padding:11px 0!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:nth-child(2)>div strong{font-size:10px!important}.path-overview-shell .dashboard-workspace-canvas .path-lower-grid>article>div:nth-child(2)>div small{font-size:9px!important}@media(max-width:900px){.path-overview-shell .dashboard-workspace-canvas{padding:18px 20px 30px!important}.path-overview-shell .dashboard-workspace-canvas .path-hero{padding:22px 18px!important}.path-overview-shell .dashboard-workspace-canvas .path-stat-grid{gap:10px!important}.path-overview-shell .dashboard-workspace-canvas .path-main-grid,.path-overview-shell .dashboard-workspace-canvas .path-lower-grid{gap:10px!important}}
      `}</style>
      <style>{`
        .path-overview-shell .faculty-dashboard-canvas .faculty-dashboard-hero h1,.path-overview-shell .faculty-dashboard-canvas .faculty-dashboard-focus h2,.path-overview-shell .faculty-dashboard-canvas .faculty-dashboard-list h2{font-weight:800!important}
      `}</style>
      <style>{`
        .path-overview-shell .dashboard-workspace-canvas .path-overview-heading h2,.path-overview-shell .dashboard-workspace-canvas .path-main-grid>article:nth-child(2) h3,.path-overview-shell .dashboard-workspace-canvas .path-lower-grid h3{font-weight:800!important}
      `}</style>
      <style>{`
        html body .path-overview-shell.path-dashboard .path-dashboard-main .dashboard-workspace-canvas.path-content {
          max-width: none !important;
          margin: 0 !important;
        }
        html body .path-overview-shell.path-dashboard .path-dashboard-main .dashboard-workspace-canvas .path-content-area {
          max-width: none !important;
          margin: 0 !important;
        }
      `}</style>
      <style>{`
        #path-hero-vivid {
          background: linear-gradient(135deg, #2A1857 0%, #4C2889 48%, #7C3AED 100%) !important;
          border: none !important;
          padding: 30px 32px !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 40px rgba(76,29,149,.25) !important;
          margin: 0 !important;
        }
        #path-hero-vivid h1 {
          color: #fff !important;
          font-size: 34px !important;
        }
        #path-hero-vivid p {
          color: #D9CBFF !important;
          font-size: 14px !important;
        }
        #path-hero-vivid > div:last-child > div {
          background: rgba(255,255,255,.1) !important;
          border: 1px solid rgba(255,255,255,.16) !important;
          box-shadow: none !important;
          border-radius: 12px !important;
        }
        @media (max-width: 900px) {
          #path-hero-vivid { padding: 22px 18px !important; }
          #path-hero-vivid h1 { font-size: 26px !important; }
        }
        @media (max-width: 640px) {
          #path-hero-vivid { display: block !important; }
          #path-hero-vivid > div:last-child { margin-top: 20px !important; }
        }
      `}</style>

      {/* ── Main ── */}
      <div
        className="path-dashboard-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#f8f7ff",
          minWidth: 0,
        }}
      >
        {/* ── Content: Program Chair layout ── */}
        <div
          className="dashboard-workspace-canvas path-content"
          style={{
            minHeight: "calc(100vh - 56px)",
            background: "#f8f7ff",
            overflowY: "auto",
            padding: isFacultyDashboard ? 0 : "28px 48px 44px 64px",
            boxSizing: "border-box",
          }}
        >
          {isFacultyDashboard ? (
            <FacultyDashboardOverview
              displayName={displayName}
              forms={myFormsData}
              loading={myFormsDataLoading}
              navigate={navigate}
            />
          ) : (
            <>
              {/* ── Welcome Header ── */}
              <div
                id="path-hero-vivid"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 24,
                  flexWrap: "wrap",
                  background:
                    "linear-gradient(135deg, #2A1857 0%, #4C2889 48%, #7C3AED 100%)",
                  padding: "30px 32px",
                  margin: 0,
                  borderRadius: 20,
                  boxShadow: "0 20px 40px rgba(76,29,149,.25)",
                }}
              >
                {/* decorative texture — dot grid + soft color glows */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "radial-gradient(rgba(255,255,255,.14) 1.5px, transparent 1.5px)",
                    backgroundSize: "16px 16px",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -60,
                    right: -40,
                    width: 220,
                    height: 220,
                    borderRadius: "50%",
                    background: "#FF6B4C",
                    opacity: 0.35,
                    filter: "blur(60px)",
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: -70,
                    left: 120,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    background: "#F5A623",
                    opacity: 0.25,
                    filter: "blur(70px)",
                    pointerEvents: "none",
                  }}
                />

                <div style={{ position: "relative", minWidth: 0 }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "5px 12px",
                      borderRadius: 7,
                      background: "#F5A623",
                      color: "#3D2506",
                      transform: "rotate(-2deg)",
                      boxShadow: "0 4px 10px rgba(0,0,0,.18)",
                    }}
                  >
                    {dateStr}
                  </span>
                  <h1
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: "#fff",
                      lineHeight: 1.15,
                      letterSpacing: "-0.03em",
                      margin: "16px 0 6px",
                      fontFamily: "Manrope, 'DM Sans', sans-serif",
                    }}
                  >
                    Good morning, {displayName}.
                  </h1>
                  <p
                    style={{
                      fontSize: 14,
                      color: "#D9CBFF",
                      margin: 0,
                      maxWidth: 480,
                    }}
                  >
                    {pendingApprovalsCount} submission
                    {pendingApprovalsCount === 1 ? "" : "s"} need
                    {pendingApprovalsCount === 1 ? "s" : ""} review, and{" "}
                    {BOTTLENECK_ALERTS.length}{" "}
                    {BOTTLENECK_ALERTS.length === 1 ? "is" : "are"} at risk of
                    missing SLA today.
                  </p>
                </div>

                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    flexShrink: 0,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,.1)",
                      border: "1px solid rgba(255,255,255,.16)",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: "rgba(245,166,35,.22)",
                        color: "#FFC96B",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ClipboardList size={16} />
                    </span>
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#fff",
                          fontFamily: "Manrope, 'DM Sans', sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        {pendingApprovalsCount}
                      </strong>
                      <span style={{ fontSize: 10, color: "#C9B8EE" }}>
                        Awaiting review
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: "rgba(255,255,255,.1)",
                      border: "1px solid rgba(255,255,255,.16)",
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: "rgba(255,107,76,.22)",
                        color: "#FF9B85",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle size={16} />
                    </span>
                    <div>
                      <strong
                        style={{
                          display: "block",
                          fontSize: 20,
                          fontWeight: 800,
                          color: "#fff",
                          fontFamily: "Manrope, 'DM Sans', sans-serif",
                          lineHeight: 1,
                        }}
                      >
                        {BOTTLENECK_ALERTS.length}
                      </strong>
                      <span style={{ fontSize: 10, color: "#C9B8EE" }}>
                        At risk
                      </span>
                    </div>
                  </div>

                  <button
                    className="path-primary-button"
                    type="button"
                    onClick={() => navigate("/forms?tab=submit")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      border: 0,
                      borderRadius: 10,
                      padding: "13px 18px",
                      background: "#F5A623",
                      color: "#3D2506",
                      fontSize: 12,
                      fontWeight: 800,
                      boxShadow: "0 10px 20px rgba(245,166,35,.35)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Plus size={14} /> Start a submission
                  </button>
                </div>
              </div>

              {/* PATH Overview stat strip */}
              <div
                className="path-stat-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.18fr .92fr 1.08fr .92fr",
                  gap: 13,
                  marginTop: 16,
                }}
              >
                {[
                  {
                    label: "Open submissions",
                    value: trackedItems.length,
                    change: "Live queue",
                    detail: "across the department",
                    color: "#7c3aed",
                      icon: FileText,
                    },
                    {
                      label: "Awaiting review",
                      value: pendingApprovalsCount,
                      change: "Needs attention",
                      detail: "awaiting a decision",
                      color: "#d97706",
                      icon: Clock,
                    },
                    {
                      label: "On-time completion",
                      value: `${onTimeCompletionRate}%`,
                      change:
                        onTimeCompletionRate >= 90
                          ? "Healthy"
                          : "Needs attention",
                      detail: "across active workflows",
                      color: "#059669",
                      icon: CheckCircle2,
                    },
                    {
                      label: "Active faculty",
                      value: activeFacultyCount,
                      change: "Live directory",
                      detail: "across the department",
                      color: "#0284c7",
                      icon: Users,
                    },
                  ].map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <article
                        className="path-stat-card"
                        key={stat.label}
                        style={{
                          background: "#fff",
                          border: "1px solid #ebe4f4",
                          borderRadius: 16,
                          padding: "18px 18px 17px",
                          boxShadow: "0 8px 22px rgba(76,29,149,.06)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                          }}
                        >
                          <span
                            style={{
                              color: "#776b83",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: ".1em",
                              textTransform: "uppercase",
                            }}
                          >
                            {stat.label}
                          </span>
                          <span
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 9,
                              background: stat.color + "18",
                              color: stat.color,
                              display: "grid",
                              placeItems: "center",
                            }}
                          >
                            <StatIcon size={15} />
                          </span>
                        </div>
                        <strong
                          style={{
                            display: "block",
                            marginTop: 13,
                            color: "#2f2738",
                            fontFamily: "Manrope, 'DM Sans', sans-serif",
                            fontSize: 27,
                            fontWeight: 800,
                            letterSpacing: "-0.03em",
                            lineHeight: 1,
                          }}
                        >
                          {kpisLoading ? "—" : stat.value}
                        </strong>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            marginTop: 10,
                            color: "#8d8196",
                            fontSize: 11,
                          }}
                        >
                          <span style={{ color: stat.color, fontWeight: 800 }}>
                            {stat.change}
                          </span>
                          <span>{stat.detail}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>

              {/* Notification dropdown */}
              {notifOpen && (
                <div
                  style={{
                    position: "fixed",
                    top: 140,
                    right: 32,
                    width: 360,
                    background: "#fff",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.1)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                    zIndex: 200,
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(0,0,0,0.07)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        Notifications
                      </span>
                      {unread > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            background: "#5e3bdb",
                            color: "#fff",
                            padding: "1px 7px",
                            borderRadius: 20,
                          }}
                        >
                          {unread} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: "#f3f4f6",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <XCircle
                        style={{ width: 13, height: 13, color: "#6b7280" }}
                      />
                    </button>
                  </div>
                  {NOTIFICATIONS.map((n) => {
                    const cfg = NOTIF_CFG[n.type];
                    const NIcon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 16px",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                          background: n.read ? "#fff" : "#faf5ff",
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: cfg.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <NIcon
                            style={{ width: 13, height: 13, color: cfg.color }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: 12,
                              fontWeight: n.read ? 400 : 600,
                              color: "#111827",
                            }}
                          >
                            {n.text}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 1,
                            }}
                          >
                            {n.sub}
                          </p>
                          <p
                            style={{
                              fontSize: 10,
                              color: "#9ca3af",
                              marginTop: 2,
                            }}
                          >
                            {n.time}
                          </p>
                        </div>
                        {!n.read && (
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#5e3bdb",
                              marginTop: 4,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button
                      style={{
                        fontSize: 12,
                        color: "#5e3bdb",
                        fontWeight: 600,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                </div>
              )}

              {/* ── PATH Overview layout ── */}
              <div
                className="path-overview-content path-content-area"
                style={{
                  padding: "28px 48px 42px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                }}
              >
                <div
                  className="path-overview-heading"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "#9a8fa3",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                      }}
                    >
                      Needs your attention
                    </div>
                    <h2
                      style={{
                        margin: "7px 0 0",
                        color: "#27213a",
                        fontFamily: "Manrope, 'DM Sans', sans-serif",
                        fontSize: 22,
                        letterSpacing: "-.025em",
                      }}
                    >
                      Priority queue{" "}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 6,
                          minWidth: 27,
                          height: 22,
                          padding: "0 7px",
                          borderRadius: 7,
                          background: "#eee7ff",
                          color: "#7c3aed",
                          fontSize: 11,
                          verticalAlign: "middle",
                        }}
                      >
                        {String(Math.min(99, trackedItems.length)).padStart(
                          2,
                          "0",
                        )}
                      </span>
                    </h2>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 14 }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/tracking")}
                      style={{
                        border: "none",
                        background: "none",
                        color: "#7c3aed",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Review all items <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>

                <section
                  className="path-main-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.65fr) minmax(310px, .8fr)",
                    gap: 14,
                    alignItems: "stretch",
                  }}
                >
                  <article
                    style={{
                      background: "#fff",
                      border: "1px solid #ebe4f4",
                      borderRadius: 16,
                      boxShadow: "0 10px 26px rgba(76,29,149,.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div>
                      {itemsLoading ? (
                        <p
                          style={{
                            padding: 36,
                            color: "#776b83",
                            textAlign: "center",
                          }}
                        >
                          Loading priority queue…
                        </p>
                      ) : (
                        trackedPageItems.slice(0, 5).map((row, index) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => navigate("/tracking")}
                            style={{
                              width: "100%",
                              display: "grid",
                              gridTemplateColumns:
                                "28px 34px minmax(0,1fr) auto 18px",
                              gap: 12,
                              alignItems: "center",
                              padding: "16px 20px",
                              border: "none",
                              borderBottom: "1px solid #f0eaf5",
                              background: "#fff",
                              textAlign: "left",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                color: "#8b5cf6",
                                fontSize: 11,
                                fontWeight: 800,
                              }}
                            >
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: "#f1ebff",
                                color: "#7c3aed",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={15} />
                            </span>
                            <span style={{ minWidth: 0 }}>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#3b3045",
                                  fontSize: 13,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {row.title}
                              </strong>
                              <small
                                style={{
                                  display: "block",
                                  color: "#94879c",
                                  fontSize: 11,
                                  marginTop: 3,
                                }}
                              >
                                {row.person}{" "}
                                <i
                                  style={{
                                    fontStyle: "normal",
                                    margin: "0 4px",
                                  }}
                                >
                                  •
                                </i>{" "}
                                {row.sourceType}
                              </small>
                            </span>
                            <span style={{ textAlign: "right" }}>
                              <PriorityPill p={row.priority} />
                              <small
                                style={{
                                  display: "block",
                                  color: "#9a8fa3",
                                  fontSize: 10,
                                  marginTop: 5,
                                }}
                              >
                                {row.date}
                              </small>
                            </span>
                            <ArrowUpRight size={15} color="#b3a6bd" />
                          </button>
                        ))
                      )}
                      {!itemsLoading && trackedPageItems.length === 0 && (
                        <ListEmptyState
                          icon={Inbox}
                          message="No matching documents"
                        />
                      )}
                    </div>
                  </article>

                  <article
                    style={{
                      background: "#fff",
                      border: "1px solid #ebe4f4",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow: "0 10px 26px rgba(76,29,149,.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#9a8fa3",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                          }}
                        >
                          SLA monitoring
                        </div>
                        <h3
                          style={{
                            color: "#27213a",
                            fontFamily: "Manrope, 'DM Sans', sans-serif",
                            fontSize: 19,
                            margin: "7px 0 0",
                          }}
                        >
                          Workflow health
                        </h3>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        margin: "24px 0 20px",
                      }}
                    >
                      <div
                        style={{
                          width: 92,
                          height: 92,
                          borderRadius: "50%",
                          background: `conic-gradient(#7c3aed ${Math.min(100, Math.max(0, onTimeCompletionRate))}%, #eee7f4 0)`,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 70,
                            height: 70,
                            borderRadius: "50%",
                            background: "#fff",
                            display: "grid",
                            placeItems: "center",
                            color: "#5b21b6",
                            fontSize: 18,
                            fontWeight: 800,
                          }}
                        >
                          {kpisLoading ? (
                            "—"
                          ) : (
                            <>
                              <strong style={{ fontSize: 23 }}>
                                {onTimeCompletionRate}
                              </strong>
                              <span style={{ fontSize: 14 }}>%</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <strong
                          style={{
                            display: "block",
                            fontSize: 16,
                            color: "#27213a",
                          }}
                        >
                          {onTimeCompletionRate >= 90
                            ? "Healthy"
                            : "Needs attention"}
                        </strong>
                        <span style={{ color: "#8d8196", fontSize: 11 }}>
                          Across all active workflows
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 7,
                        background: "#eee7f4",
                        borderRadius: 20,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, onTimeCompletionRate))}%`,
                          height: "100%",
                          background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                          borderRadius: 20,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 7,
                        color: "#aaa0b2",
                        fontSize: 10,
                      }}
                    >
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                        marginTop: 22,
                        paddingTop: 18,
                        borderTop: "1px solid #eee8f1",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            color: "#9a8fa3",
                            fontSize: 10,
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: ".08em",
                          }}
                        >
                          Avg. turnaround
                        </span>
                        <strong
                          style={{
                            display: "block",
                            color: "#27213a",
                            fontSize: 18,
                            marginTop: 5,
                          }}
                        >
                          {avgApprovalDays.toFixed(1)} days
                        </strong>
                        <small style={{ color: "#059669", fontSize: 10 }}>
                          <ArrowUpRight size={11} /> 18% faster
                        </small>
                      </div>
                      <div>
                        <span
                          style={{
                            color: "#9a8fa3",
                            fontSize: 10,
                            display: "block",
                            textTransform: "uppercase",
                            letterSpacing: ".08em",
                          }}
                        >
                          At risk
                        </span>
                        <strong
                          style={{
                            display: "block",
                            color: "#27213a",
                            fontSize: 18,
                            marginTop: 5,
                          }}
                        >
                          {BOTTLENECK_ALERTS.length.toString().padStart(2, "0")}
                        </strong>
                        <small style={{ color: "#b45309", fontSize: 10 }}>
                          <Clock size={11} /> needs action
                        </small>
                      </div>
                    </div>
                  </article>
                </section>

                <section className="path-panel path-performance-panel">
                  <div className="path-performance-heading">
                    <div>
                      <div className="path-kicker">Faculty performance</div>
                      <h2>How faculty work is moving</h2>
                      <p>
                        A quick read of completion, open work, and
                        timeliness across the department.
                      </p>
                    </div>
                    <button
                      className="path-text-button"
                      type="button"
                      onClick={() => setFacultyModalOpen(true)}
                    >
                      View full report <ArrowUpRight size={13} />
                    </button>
                  </div>
                  <div className="path-performance-summary">
                    <div>
                      <span>Assigned</span>
                      <strong>{facultyPerformanceSummary.assigned}</strong>
                      <small>faculty transactions</small>
                    </div>
                    <div>
                      <span>Open queue</span>
                      <strong>{facultyPerformanceSummary.open}</strong>
                      <small>still in progress</small>
                    </div>
                    <div>
                      <span>Completed</span>
                      <strong>{facultyPerformanceSummary.completed}</strong>
                      <small>closed transactions</small>
                    </div>
                    <div>
                      <span>On-time rate</span>
                      <strong>{facultyPerformanceSummary.onTimeRate}%</strong>
                      <small>{facultyPerformanceSummary.delayed} delayed</small>
                    </div>
                  </div>
                  <div className="path-performance-content">
                    <div>
                      {facultyLoading ? (
                        <p
                          style={{
                            padding: "24px 0",
                            color: "#776b83",
                            textAlign: "center",
                          }}
                        >
                          Loading faculty performance…
                        </p>
                      ) : FACULTY_WORKLOAD.length === 0 ? (
                        <ListEmptyState
                          icon={Users}
                          message="No faculty performance data yet."
                        />
                      ) : (
                        FACULTY_WORKLOAD.slice(0, 6).map((f) => {
                          const risk = f.delayed > 0 || f.rate < 80;
                          const status = risk ? "Needs attention" : "Strong";
                          return (
                            <div
                              className="path-performance-row"
                              key={f.name}
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                const raw = facultyPerformance.find(
                                  (p) => (p.full_name || p.name) === f.name,
                                );
                                if (raw) setSelectedFaculty(raw);
                                else setFacultyModalOpen(true);
                              }}
                            >
                              <div className="path-performance-person">
                                <AvatarCircle
                                  name={f.name}
                                  pictureUrl={avatarUrlFor(f.name)}
                                  size={28}
                                  background="#eee7ff"
                                  color="#7040c5"
                                  fontSize={8}
                                  style={{ borderRadius: 8 }}
                                />
                                <div>
                                  <strong>{f.name}</strong>
                                  <span>
                                    {f.completed} completed · {f.pending} open
                                  </span>
                                </div>
                              </div>
                              <div className="path-performance-progress">
                                <div className="path-performance-progress-top">
                                  <span>Completion</span>
                                  <b>{f.rate}%</b>
                                </div>
                                <div className="path-performance-track">
                                  <span
                                    className={risk ? "risk" : ""}
                                    style={{
                                      width: `${Math.min(f.rate, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span
                                className={`path-performance-status ${risk ? "risk" : ""}`}
                              >
                                {status}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <aside className="path-performance-highlight">
                      <div className="path-kicker">Team signal</div>
                      <strong>
                        {facultyPerformanceSummary.top?.name ??
                          "No faculty data"}
                      </strong>
                      <p>
                        Highest completion rate across the active workload.
                      </p>
                      <div className="path-performance-highlight-metrics">
                        <div>
                          <span>At risk</span>
                          <b>{facultyPerformanceSummary.atRisk}</b>
                        </div>
                        <div>
                          <span>Faculty tracked</span>
                          <b>{FACULTY_WORKLOAD.length}</b>
                        </div>
                      </div>
                    </aside>
                  </div>
                </section>

                <section
                  className="path-lower-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.65fr) minmax(310px, .8fr)",
                    gap: 14,
                  }}
                >
                  <article
                    style={{
                      background: "#fff",
                      border: "1px solid #ebe4f4",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow: "0 10px 26px rgba(76,29,149,.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#9a8fa3",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                          }}
                        >
                          Recent activity
                        </div>
                        <h3
                          style={{
                            color: "#27213a",
                            fontFamily: "Manrope, 'DM Sans', sans-serif",
                            fontSize: 19,
                            margin: "7px 0 0",
                          }}
                        >
                          What’s moving
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/audit")}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#7c3aed",
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Open audit trail <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <div style={{ marginTop: 18 }}>
                      {recentActivityData.slice(0, 4).map((activity) => {
                        const ActivityIcon = activity.icon || Activity;
                        return (
                          <div
                            key={activity.id || activity.key || activity.title}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "13px 0",
                              borderBottom: "1px solid #f0eaf5",
                            }}
                          >
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 9,
                                background: activity.bg || "#f1ebff",
                                color: activity.color || "#7c3aed",
                                display: "grid",
                                placeItems: "center",
                                flexShrink: 0,
                              }}
                            >
                              <ActivityIcon size={14} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong
                                style={{
                                  display: "block",
                                  color: "#3b3045",
                                  fontSize: 12,
                                }}
                              >
                                {activity.title ||
                                  activity.text ||
                                  "Workflow activity"}
                              </strong>
                              <small style={{ color: "#94879c", fontSize: 11 }}>
                                {activity.subtitle ||
                                  activity.description ||
                                  activity.time ||
                                  "Recently"}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                      {recentActivityData.length === 0 && (
                        <ListEmptyState
                          icon={Activity}
                          message="No recent activity yet."
                        />
                      )}
                    </div>
                  </article>

                  <article
                    style={{
                      background: "#fff",
                      border: "1px solid #ebe4f4",
                      borderRadius: 16,
                      padding: 22,
                      boxShadow: "0 10px 26px rgba(76,29,149,.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: "#9a8fa3",
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: ".12em",
                            textTransform: "uppercase",
                          }}
                        >
                          This semester
                        </div>
                        <h3
                          style={{
                            color: "#27213a",
                            fontFamily: "Manrope, 'DM Sans', sans-serif",
                            fontSize: 19,
                            margin: "7px 0 0",
                          }}
                        >
                          Document flow
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate("/tracking")}
                        aria-label="More document flow options"
                        style={{
                          border: "none",
                          background: "#f1ebff",
                          color: "#7c3aed",
                          borderRadius: 8,
                          padding: 8,
                          cursor: "pointer",
                        }}
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 8,
                        margin: "20px 0 16px",
                      }}
                    >
                      <strong style={{ color: "#27213a", fontSize: 30 }}>
                        {" "}
                        {trackingOverviewTotal}
                      </strong>
                      <span style={{ color: "#8d8196", fontSize: 11 }}>
                        documents tracked
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      {trackingOverviewData.map((item) => {
                        const pct = trackingOverviewTotal
                          ? Math.round(
                              (item.value / trackingOverviewTotal) * 100,
                            )
                          : 0;
                        return (
                          <div key={item.name}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 6,
                              }}
                            >
                              <span
                                style={{
                                  color: "#554961",
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {item.name}
                              </span>
                              <strong
                                style={{ color: "#27213a", fontSize: 12 }}
                              >
                                {item.value}
                              </strong>
                            </div>
                            <div
                              style={{
                                height: 8,
                                borderRadius: 20,
                                background: "#eee7f4",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  borderRadius: 20,
                                  background: item.color || "#8b5cf6",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                </section>
              </div>
            </>
          )}

          <FacultyPerformanceModal
            open={facultyModalOpen}
            onClose={() => setFacultyModalOpen(false)}
            faculty={facultyPerformance}
            delayedDocs={delayedDocs}
            onSelectFaculty={setSelectedFaculty}
            avatarUrlFor={avatarUrlFor}
          />
          <FacultyDetailPanel
            open={!!selectedFaculty}
            onClose={() => setSelectedFaculty(null)}
            onBack={facultyModalOpen ? () => setSelectedFaculty(null) : null}
            faculty={selectedFaculty}
            delayedDocs={delayedDocs}
            trackedItems={trackedItems}
            avatarUrlFor={avatarUrlFor}
          />

          {/* All Alerts modal (Bottleneck & Alerts) */}
          {alertsModalOpen && (
            <div
              onClick={() => setAlertsModalOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(17,24,39,0.55)",
                zIndex: 2500,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
                padding: "40px 20px",
                overflowY: "auto",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  width: "100%",
                  maxWidth: 640,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "16px 22px",
                    borderBottom: "1px solid rgba(0,0,0,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexShrink: 0,
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      All Alerts
                    </p>
                    <p style={{ fontSize: 11.5, color: "#6b7280" }}>
                      {BOTTLENECK_ALERTS.length} items requiring immediate
                      attention
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertsModalOpen(false)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: "none",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "14px 22px",
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                >
                  {BOTTLENECK_ALERTS.map((a) => {
                    const cfg = ALERT_TIER_CFG[a.tier];
                    const AlertIcon = a.icon;
                    return (
                      <div
                        key={a.key}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          background: cfg.bg,
                          borderLeft: `3px solid ${cfg.border}`,
                          borderRadius: 10,
                          padding: "12px 14px",
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: cfg.iconBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AlertIcon
                            style={{
                              width: 14,
                              height: 14,
                              color: cfg.iconColor,
                            }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: "#111827",
                              }}
                            >
                              {a.title}
                            </p>
                            {cfg.showPill && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 5,
                                  background: "#dc2626",
                                  color: "#fff",
                                  letterSpacing: 0.3,
                                }}
                              >
                                CRITICAL
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 11.5,
                              color: "#4b5563",
                              marginTop: 3,
                              lineHeight: 1.4,
                            }}
                          >
                            {a.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "9px 20px",
              borderTop: "0.5px solid #e5e7eb",
              fontSize: 10,
              color: "#aaa",
              background: "white",
            }}
          >
            <span>
              © 2026 PATH Document Management System. All rights reserved.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#22c55e",
                    display: "inline-block",
                  }}
                />
                System Operational
              </span>
              <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>
                Privacy Policy
              </a>
              <a href="#" style={{ color: "#aaa", textDecoration: "none" }}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}