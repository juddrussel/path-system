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

// ── Stats ─────────────────────────────────────────────────────────────────
// NOTE: "Overdue Requests" and "Avg. Processing Time" ideally come from your
// actual document/request tracking table, which isn't part of this page's
// scope. These two are placeholders derived from sla_rules until that table
// is wired in — swap the marked queries once you have it.
async function getStats(req, res) {
  try {
    const [[{ total }]] = await db.query("SELECT COUNT(*) AS total FROM sla_rules");
    const [[{ active }]] = await db.query(
      "SELECT COUNT(*) AS active FROM sla_rules WHERE status = 'Active'"
    );
    const [[{ overdueAlerts }]] = await db.query(
      "SELECT COUNT(*) AS overdueAlerts FROM sla_alerts WHERE resolved = 0"
    );
    // TODO: replace with AVG(actual_completion_days) once request-tracking table exists
    const [[{ avgProcessing }]] = await db.query(
      "SELECT ROUND(AVG(processing_time), 1) AS avgProcessing FROM sla_rules WHERE processing_unit = 'Days'"
    );

    res.json({
      totalRules: total,
      activePolicies: active,
      overdueRequests: overdueAlerts, // placeholder: count of unresolved alerts, not real overdue requests
      avgProcessingDays: avgProcessing || 0,
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

async function createRule(req, res) {
  const {
    documentType, priority, processingTime, processingUnit,
    reviewerRole, escalationHours, remarks,
  } = req.body;

  if (!documentType || !reviewerRole) {
    return res.status(400).json({ message: "documentType and reviewerRole are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO sla_rules
        (document_type, priority, processing_time, processing_unit, reviewer_role, escalation_hours, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        documentType, priority || "Medium", processingTime || 0,
        processingUnit || "Days", reviewerRole, escalationHours || 24,
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
    documentType, priority, processingTime, processingUnit,
    reviewerRole, escalationHours, remarks, status,
  } = req.body;

  try {
    const [[existing]] = await db.query("SELECT * FROM sla_rules WHERE id = ?", [id]);
    if (!existing) return res.status(404).json({ message: "Rule not found." });

    await db.query(
      `UPDATE sla_rules SET
        document_type = ?, priority = ?, processing_time = ?, processing_unit = ?,
        reviewer_role = ?, escalation_hours = ?, remarks = ?, status = ?
       WHERE id = ?`,
      [
        documentType ?? existing.document_type,
        priority ?? existing.priority,
        processingTime ?? existing.processing_time,
        processingUnit ?? existing.processing_unit,
        reviewerRole ?? existing.reviewer_role,
        escalationHours ?? existing.escalation_hours,
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
    const [recipients] = await db.query(
      "SELECT id, role_name, email FROM sla_recipients ORDER BY role_name"
    );
    res.json({ ...settings, recipients });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load escalation settings." });
  }
}

async function updateEscalationSettings(req, res) {
  const { autoEscalation, notifyEmail, notifyDashboard, notifySms } = req.body;
  try {
    await db.query(
      `UPDATE sla_escalation_settings SET
        auto_escalation = ?, notify_email = ?, notify_dashboard = ?, notify_sms = ?, updated_by = ?
       WHERE id = 1`,
      [
        autoEscalation ? 1 : 0, notifyEmail ? 1 : 0,
        notifyDashboard ? 1 : 0, notifySms ? 1 : 0,
        req.user?.id ?? null,
      ]
    );
    await logActivity(req.user?.id, "Updated", "Escalation Settings");
    res.json({ message: "Escalation settings updated." });
  } catch (err) {
    console.error(err);
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

// Called by your own escalation logic (cron job, or another service) whenever
// an SLA breach / missing-role situation is detected.
async function createAlert(req, res) {
  const { ruleId, tier, title, message, actionLabel } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO sla_alerts (rule_id, tier, title, message, action_label)
       VALUES (?, ?, ?, ?, ?)`,
      [ruleId || null, tier || "warning", title, message, actionLabel || "Review Rule"]
    );

    const [[settings]] = await db.query(
      "SELECT notify_email FROM sla_escalation_settings WHERE id = 1"
    );

    let emailed = false;
    if (settings?.notify_email) {
      const recipientEmails = await resolveRecipientEmails();
      if (recipientEmails.length) {
        await sendSlaAlertEmail({ recipientEmails, tier: tier || "warning", title, message });
        emailed = true;
        await db.query("UPDATE sla_alerts SET emailed = 1 WHERE id = ?", [result.insertId]);
      }
    }

    await logActivity(req.user?.id, "Escalated", title);
    res.status(201).json({ id: result.insertId, emailed });
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
  listAlerts, createAlert, resolveAlert,
  listActivity,
};
