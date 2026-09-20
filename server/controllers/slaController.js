// server/controllers/slaController.js
const db = require("../config/db");
const { sendSlaAlertEmail } = require("../services/slaEmailService");

// ── helpers ───────────────────────────────────────────────────────────────
async function logActivity(userId, action, target) {
  await db.query(
    "INSERT INTO sla_activity_log (user_id, action, target) VALUES (?, ?, ?)",
    [userId ?? null, action, target]
  );
}

async function resolveRecipientEmails() {
  const [rows] = await db.query(
    "SELECT role_name, email FROM sla_recipients WHERE email IS NOT NULL"
  );
  return rows.map((r) => r.email);
}

// Formats a Date/ISO string the way the email template expects, e.g.
// "Wednesday, July 29, 2026 at 12:00 AM UTC". Falls back to null if
// no deadline was given, so the template can show "—" instead.
function formatDeadlineText(deadlineAt) {
  if (!deadlineAt) return null;
  const date = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  if (Number.isNaN(date.getTime())) return null;

  const datePart = date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });
  return `${datePart} at ${timePart} UTC`;
}

// Computes how far through the SLA window a task is, given when the SLA
// clock started and when it's due. Returns null (rather than throwing)
// when either timestamp is missing, so callers can omit them safely.
function computeSlaProgress(slaStartAt, deadlineAt) {
  if (!slaStartAt || !deadlineAt) return null;

  const start = slaStartAt instanceof Date ? slaStartAt : new Date(slaStartAt);
  const end = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  const totalMs = end.getTime() - start.getTime();
  if (totalMs <= 0) return { percentElapsed: 100, timeRemainingText: "Deadline passed" };

  const elapsedMs = Date.now() - start.getTime();
  const percentElapsed = Math.max(0, Math.min(100, Math.round((elapsedMs / totalMs) * 100)));
  const remainingMs = Math.max(0, end.getTime() - Date.now());
  const remainingDays = Math.round(remainingMs / (1000 * 60 * 60 * 24));

  const timeRemainingText =
    remainingMs <= 0
      ? "Deadline passed"
      : `${100 - percentElapsed}% Time Remaining (Approx. ${remainingDays} day${remainingDays === 1 ? "" : "s"})`;

  return { percentElapsed, timeRemainingText };
}

// Given when a task started and the rule's turnaround_hours, returns the
// actual due Date. This is what feeds deadlineAt in createAlertInternal
// and slaCron.js — the missing link between "turnaround" (this) and
// "escalation" (escalation_hours, counted from this deadline).
function computeDeadline(slaStartAt, turnaroundHours) {
  if (!slaStartAt || !turnaroundHours) return null;
  const start = slaStartAt instanceof Date ? slaStartAt : new Date(slaStartAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + Number(turnaroundHours) * 60 * 60 * 1000);
}

// ── Stats ─────────────────────────────────────────────────────────────────
// NOTE: "Overdue Requests" ideally comes from your actual document/request
// tracking table, which isn't part of this page's scope. It's currently a
// placeholder derived from unresolved sla_alerts until that table is wired in.
async function getStats(req, res) {
  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM sla_rules");
    const [[{ active }]] = await db.query(
      "SELECT COUNT(*) AS active FROM sla_rules WHERE status = 'Active'"
    );
    const [[{ overdueAlerts }]] = await db.query(
      "SELECT COUNT(*) AS overdueAlerts FROM sla_alerts WHERE resolved = 0"
    );

    res.json({
      totalRules: total,
      activePolicies: active,
      overdueRequests: overdueAlerts, // placeholder: count of unresolved alerts, not real overdue requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load SLA stats." });
  }
}

// ── Rules ─────────────────────────────────────────────────────────────────
async function listRules(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sla_rules ORDER BY updated_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load SLA rules." });
  }
}

async function getRule(req, res) {
  try {
    const [[rule]] = await db.query("SELECT * FROM sla_rules WHERE id = ?", [
      req.params.id,
    ]);
    if (!rule) return res.status(404).json({ message: "Rule not found." });
    res.json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load SLA rule." });
  }
}

// Validates/normalizes the "hours before deadline" reminder schedule coming
// from the client (either a real array, e.g. [72, 24, 4], or a raw CSV
// string like "72,24,4" from a plain text input) into a clean CSV string
// for storage. Non-positive or non-numeric entries are dropped; duplicates
// are removed. Falls back to "48,24,4" if nothing valid is left, so a
// blank/garbled field can never disable reminders entirely.
function normalizeStageHours(input) {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(",");
  const hours = raw
    .map((v) => parseInt(String(v).trim(), 10))
    .filter((n) => Number.isInteger(n) && n > 0);
  const unique = [...new Set(hours)].sort((a, b) => b - a);
  return (unique.length ? unique : [48, 24, 4]).join(",");
}

async function createRule(req, res) {
  const {
    documentType,
    reviewerRole, turnaroundHours, escalationHours, reminderLeadHours,
    reminderStageDays, overdueReminderIntervalDays, remarks,
  } = req.body;

  if (!documentType || !reviewerRole) {
    return res.status(400).json({ message: "documentType and reviewerRole are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO sla_rules
        (document_type, reviewer_role, turnaround_hours, escalation_hours, reminder_lead_hours,
         reminder_stage_hours, overdue_reminder_interval_hours, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentType, reviewerRole, turnaroundHours || 48,
        escalationHours || 24, reminderLeadHours || 24,
        normalizeStageHours(reminderStageDays),
        Number(overdueReminderIntervalDays) > 0 ? Number(overdueReminderIntervalDays) : 24,
        remarks || null, req.user?.id ?? null,
      ]
    );
    await logActivity(req.user?.id, "Created", documentType);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create SLA rule." });
  }
}

async function updateRule(req, res) {
  const { id } = req.params;
  const {
    documentType,
    reviewerRole, turnaroundHours, escalationHours, reminderLeadHours,
    reminderStageDays, overdueReminderIntervalDays, remarks, status,
  } = req.body;

  try {
    const [[existing]] = await db.query("SELECT * FROM sla_rules WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ message: "Rule not found." });

    await db.query(
      `UPDATE sla_rules SET
        document_type = ?,
        reviewer_role = ?, turnaround_hours = ?, escalation_hours = ?, reminder_lead_hours = ?,
        reminder_stage_hours = ?, overdue_reminder_interval_hours = ?, remarks = ?, status = ?
       WHERE id = ?`,
      [
        documentType ?? existing.document_type,
        reviewerRole ?? existing.reviewer_role,
        turnaroundHours ?? existing.turnaround_hours,
        escalationHours ?? existing.escalation_hours,
        reminderLeadHours ?? existing.reminder_lead_hours,
        reminderStageDays !== undefined ? normalizeStageHours(reminderStageDays) : existing.reminder_stage_hours,
        Number(overdueReminderIntervalDays) > 0 ? Number(overdueReminderIntervalDays) : existing.overdue_reminder_interval_hours,
        remarks ?? existing.remarks,
        status ?? existing.status,
        id,
      ]
    );

    await logActivity(req.user?.id, "Updated", documentType ?? existing.document_type);
    res.json({ message: "Rule updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update SLA rule." });
  }
}

async function deleteRule(req, res) {
  try {
    const [[existing]] = await db.query("SELECT document_type FROM sla_rules WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ message: "Rule not found." });

    await db.query("DELETE FROM sla_rules WHERE id = ?", [req.params.id]);
    await logActivity(req.user?.id, "Deleted", existing.document_type);
    res.json({ message: "Rule deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete SLA rule." });
  }
}

// ── Escalation settings ──────────────────────────────────────────────────
async function getEscalationSettings(req, res) {
  try {
    const [[settings]] = await db.query(
      "SELECT * FROM sla_escalation_settings WHERE id = 1"
    );
    console.log(`[SLA] getEscalationSettings raw result:`, settings);
    if (!settings) {
      console.warn(`[SLA] No escalation settings found for id=1, returning defaults`);
      // Return default settings if none exist
      return res.json({
        id: 1,
        auto_escalation: 0,
        notify_email: 0,
        notify_dashboard: 0,
        notify_sms: 0,
        recipients: []
      });
    }
    const [recipients] = await db.query(
      "SELECT id, role_name, email FROM sla_recipients ORDER BY role_name"
    );
    console.log(`[SLA] Sending escalation settings:`, { ...settings, recipients });
    res.json({ ...settings, recipients });
  } catch (err) {
    console.error("[SLA] getEscalationSettings error:", err);
    res.status(500).json({ message: "Failed to load escalation settings." });
  }
}

async function updateEscalationSettings(req, res) {
  const { autoEscalation, notifyEmail, notifyDashboard, notifySms } = req.body;
  console.log(`[SLA] updateEscalationSettings called with:`, { autoEscalation, notifyEmail, notifyDashboard, notifySms });
  try {
    const result = await db.query(
      `UPDATE sla_escalation_settings SET
        auto_escalation = ?, notify_email = ?, notify_dashboard = ?, notify_sms = ?, updated_by = ?
       WHERE id = 1`,
      [
        autoEscalation ? 1 : 0, notifyEmail ? 1 : 0,
        notifyDashboard ? 1 : 0, notifySms ? 1 : 0,
        req.user?.id ?? null,
      ]
    );
    console.log(`[SLA] updateEscalationSettings result:`, result);
    console.log(`[SLA] updateEscalationSettings successful`);
    
    // Verify the update by reading back the values
    const [[updated]] = await db.query(
      "SELECT auto_escalation, notify_email, notify_dashboard, notify_sms FROM sla_escalation_settings WHERE id = 1"
    );
    console.log(`[SLA] Verified values in DB:`, updated);
    
    await logActivity(req.user?.id, "Updated", "Escalation Settings");
    res.json({ message: "Escalation settings updated." });
  } catch (err) {
    console.error("[SLA] updateEscalationSettings error:", err);
    res.status(500).json({ message: "Failed to update escalation settings." });
  }
}

async function addRecipient(req, res) {
  const { roleName, email } = req.body;
  if (!roleName) return res.status(400).json({ message: "roleName is required." });
  try {
    await db.query(
      "INSERT INTO sla_recipients (role_name, email) VALUES (?, ?)",
      [roleName, email || null]
    );
    res.status(201).json({ message: "Recipient added." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add recipient." });
  }
}

async function removeRecipient(req, res) {
  try {
    await db.query("DELETE FROM sla_recipients WHERE id = ?", [req.params.id]);
    res.json({ message: "Recipient removed." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove recipient." });
  }
}

// ── Alerts (also where email notifications fire from) ───────────────────
async function listAlerts(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT * FROM sla_alerts WHERE resolved = 0 ORDER BY created_at DESC LIMIT 20"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load alerts." });
  }
}

/**
 * Core alert-creation logic — no req/res dependency, so it can be called
 * from an HTTP route (createAlert below) OR from slaCron.js on a schedule.
 *
 * Relies on the UNIQUE KEY uniq_task_alert (task_id, alert_type) on
 * sla_alerts to make repeated calls for the same task/alert_type safe:
 * a duplicate insert throws ER_DUP_ENTRY, which we catch and treat as
 * "already alerted, nothing to do" rather than an error.
 *
 * @param {Object} params
 * @param {number|null} params.ruleId
 * @param {number|null} params.taskId
 * @param {"reminder"|"breach"} params.alertType
 * @param {"critical"|"warning"} params.tier
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.actionLabel]
 * @param {string[]} [params.extraRecipients] - e.g. the task's assigned faculty email
 * @param {number|null} [params.userId] - for activity log attribution; null = "System"
 * @param {string} [params.documentType] - e.g. "Masterlist of Section", shown on the email card
 * @param {string|Date} [params.deadlineAt] - the task's actual due timestamp
 * @param {string|Date} [params.slaStartAt] - when the SLA clock started, used to compute % elapsed
 * @param {string} [params.taskUrl] - deep link to the task; defaults to APP_BASE_URL + /tasks?taskId={taskId}
 * @param {string} [params.allTasksUrl] - link to the recipient's assigned tasks list
 */
async function createAlertInternal({
  ruleId, taskId, alertType, tier, title, message, actionLabel,
  extraRecipients = [], userId = null,
  documentType = null, deadlineAt = null, slaStartAt = null,
  taskUrl = null, allTasksUrl = null,
}) {
  let alertId;
  let isRetry = false;

  try {
    const [result] = await db.query(
      `INSERT INTO sla_alerts (rule_id, task_id, alert_type, tier, title, message, action_label)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ruleId || null, taskId || null, alertType || "breach", tier || "warning", title, message, actionLabel || "Review Rule"]
    );
    alertId = result.insertId;
  } catch (err) {
    if (err.code !== "ER_DUP_ENTRY") throw err;

    // A row for this task_id + alert_type already exists. If it was never
    // successfully emailed (e.g. a prior Brevo failure), retry sending on
    // that same row instead of giving up — this is what makes the cron
    // self-healing after a transient email-provider error.
    const [[existing]] = await db.query(
      "SELECT id, emailed FROM sla_alerts WHERE task_id = ? AND alert_type = ?",
      [taskId, alertType]
    );
    if (!existing) throw err; // shouldn't happen, but don't swallow silently
    if (existing.emailed) {
      return { created: false, duplicate: true }; // genuinely already sent — nothing to do
    }
    alertId = existing.id;
    isRetry = true;
  }

  try {
    const [[settings]] = await db.query(
      "SELECT notify_email FROM sla_escalation_settings WHERE id = 1"
    );

    let emailed = false;
    if (settings?.notify_email) {
      const globalEmails = await resolveRecipientEmails();
      const recipientEmails = [...new Set([...globalEmails, ...extraRecipients])];
      if (recipientEmails.length) {
        const progress = computeSlaProgress(slaStartAt, deadlineAt);
        let baseUrl = process.env.APP_BASE_URL;
        if (!baseUrl) {
          console.warn(
            "⚠️  APP_BASE_URL is not set — SLA email links will be broken relative paths. " +
            "Set APP_BASE_URL (e.g. https://path-system.vercel.app) in your environment."
          );
          baseUrl = ""; // still fall through, but the warning makes the cause obvious in logs
        }
        baseUrl = baseUrl.replace(/\/+$/, ""); // strip any trailing slash so we never get "//"

        const resolvedTaskUrl =
          taskUrl || (baseUrl && taskId ? `${baseUrl}/tasks?taskId=${taskId}` : null);

        await sendSlaAlertEmail({
          recipientEmails,
          tier: tier || "warning",
          title,
          message,
          taskId: taskId ? `TS-${taskId}` : null,
          documentType,
          deadlineText: formatDeadlineText(deadlineAt),
          deadlineAt,
          percentElapsed: progress?.percentElapsed,
          timeRemainingText: progress?.timeRemainingText,
          taskUrl: resolvedTaskUrl,
          allTasksUrl: allTasksUrl || (baseUrl ? `${baseUrl}/tasks` : undefined),
        });
        emailed = true;
        await db.query("UPDATE sla_alerts SET emailed = 1 WHERE id = ?", [alertId]);
      }
    }

    if (!isRetry) await logActivity(userId, "Escalated", title);
    return { id: alertId, emailed, created: !isRetry, retried: isRetry };
  } catch (err) {
    // Email send failed again — row stays at emailed = 0, ready for another
    // retry on the next cron tick. Not a duplicate, not a success.
    throw err;
  }
}

// Called by your own escalation logic (manual/admin action via HTTP).
// For scheduled alerts, slaCron.js calls createAlertInternal directly.
async function createAlert(req, res) {
  const {
    ruleId, taskId, alertType, tier, title, message, actionLabel,
    documentType, deadlineAt, slaStartAt, taskUrl, allTasksUrl,
  } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required." });
  }

  try {
    const result = await createAlertInternal({
      ruleId, taskId, alertType, tier, title, message, actionLabel,
      documentType, deadlineAt, slaStartAt, taskUrl, allTasksUrl,
      userId: req.user?.id,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create alert." });
  }
}

async function resolveAlert(req, res) {
  try {
    await db.query("UPDATE sla_alerts SET resolved = 1 WHERE id = ?", [req.params.id]);
    res.json({ message: "Alert resolved." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to resolve alert." });
  }
}

// ── Activity feed ─────────────────────────────────────────────────────────
async function listActivity(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT sal.id, sal.action, sal.target, sal.created_at,
              COALESCE(u.full_name, 'System') AS name
       FROM sla_activity_log sal
       LEFT JOIN users u ON u.id = sal.user_id
       ORDER BY sal.created_at DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load activity." });
  }
}

module.exports = {
  getStats,
  listRules, getRule, createRule, updateRule, deleteRule,
  getEscalationSettings, updateEscalationSettings, addRecipient, removeRecipient,
  listAlerts, createAlert, createAlertInternal, resolveAlert,
  listActivity,
  computeDeadline,
};