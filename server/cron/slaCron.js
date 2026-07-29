// server/cron/slaCron.js
//
// Hourly job that fires the two SLA email triggers the dashboard is
// currently missing:
//   - "reminder"  — deadline is approaching (within the rule's reminder_lead_hours)
//   - "breach"    — deadline has passed and the task still isn't done
//
// Idempotency: relies on the UNIQUE KEY uniq_task_alert(task_id, alert_type)
// on sla_alerts. createAlertInternal() catches the resulting ER_DUP_ENTRY
// and treats it as "already alerted" rather than an error, so this file
// runs on schedule forever without ever double-emailing the same task+type.

const cron = require("node-cron");
const db = require("../config/db");
const { createAlertInternal } = require("../controllers/slaController");

// Task statuses that mean "done" — excluded from both reminder and breach checks.
const DONE_STATUSES = ["Completed", "Released", "Approved"];

function tierForPriority(priority) {
  return priority === "High" ? "critical" : "warning";
}

async function getReminderCandidates() {
  const placeholders = DONE_STATUSES.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT t.id AS task_id, t.title, t.deadline, t.doc_type, t.created_at,
            r.id AS rule_id, r.priority, r.reminder_lead_hours,
            u.email AS faculty_email
     FROM tasks t
     JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
     LEFT JOIN users u ON u.id = t.faculty_id
     WHERE t.status NOT IN (${placeholders})
       AND t.deadline >= CURDATE()
       AND DATEDIFF(t.deadline, CURDATE()) <= CEIL(r.reminder_lead_hours / 24)
       AND NOT EXISTS (
         SELECT 1 FROM sla_alerts a
         WHERE a.task_id = t.id AND a.alert_type = 'reminder' AND a.emailed = 1
       )`,
    DONE_STATUSES
  );
  return rows;
}

async function getBreachCandidates() {
  const placeholders = DONE_STATUSES.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT t.id AS task_id, t.title, t.deadline, t.doc_type, t.created_at,
            r.id AS rule_id, r.priority,
            u.email AS faculty_email
     FROM tasks t
     JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
     LEFT JOIN users u ON u.id = t.faculty_id
     WHERE t.status NOT IN (${placeholders})
       AND t.deadline < CURDATE()
       AND NOT EXISTS (
         SELECT 1 FROM sla_alerts a
         WHERE a.task_id = t.id AND a.alert_type = 'breach' AND a.emailed = 1
       )`,
    DONE_STATUSES
  );
  return rows;
}

async function runReminders() {
  const candidates = await getReminderCandidates();
  for (const c of candidates) {
    const result = await createAlertInternal({
      ruleId: c.rule_id,
      taskId: c.task_id,
      alertType: "reminder",
      tier: tierForPriority(c.priority),
      title: `SLA Reminder: "${c.title}" due ${c.deadline}`,
      message: `Task "${c.title}" (${c.doc_type}) is due on ${c.deadline}. Please review before the deadline.`,
      actionLabel: "Review Task",
      extraRecipients: c.faculty_email ? [c.faculty_email] : [],
      // Feeds the task card + progress bar in the email template.
      documentType: c.doc_type,
      deadlineAt: c.deadline,
      slaStartAt: c.created_at,
    });
    if (result.created) {
      console.log(`[slaCron] reminder sent — task ${c.task_id}`);
    } else if (result.duplicate) {
      console.log(`[slaCron] reminder skipped (already alerted) — task ${c.task_id}`);
    }
  }
  return candidates.length;
}

async function runBreaches() {
  const candidates = await getBreachCandidates();
  for (const c of candidates) {
    const result = await createAlertInternal({
      ruleId: c.rule_id,
      taskId: c.task_id,
      alertType: "breach",
      tier: "critical",
      title: `SLA Breach: "${c.title}" overdue`,
      message: `Task "${c.title}" (${c.doc_type}) missed its deadline of ${c.deadline}.`,
      actionLabel: "Escalate",
      extraRecipients: c.faculty_email ? [c.faculty_email] : [],
      // Feeds the task card + progress bar in the email template.
      // For a breached task the bar should read as fully elapsed, which
      // computeSlaProgress() already handles once deadlineAt is in the past.
      documentType: c.doc_type,
      deadlineAt: c.deadline,
      slaStartAt: c.created_at,
    });
    if (result.created) {
      console.log(`[slaCron] breach alert sent — task ${c.task_id}`);
    } else if (result.duplicate) {
      console.log(`[slaCron] breach skipped (already alerted) — task ${c.task_id}`);
    }
  }
  return candidates.length;
}

function startSlaCron() {
  // TESTING SCHEDULE: every 5 minutes, so you don't have to wait up to an
  // hour to see results. Switch this back to "0 * * * *" (hourly, on the
  // hour) before this goes to real production use — every 5 minutes is fine
  // for a quick verification pass, but is unnecessary DB/email load long-term.
  cron.schedule("*/5 * * * *", async () => {
    try {
      await runReminders();
      await runBreaches();
    } catch (err) {
      console.error("[slaCron] run failed:", err);
    }
  });
  console.log("[slaCron] scheduled: every 5 minutes (TESTING — switch to hourly before production)");
}

module.exports = { startSlaCron, runReminders, runBreaches, getReminderCandidates, getBreachCandidates };