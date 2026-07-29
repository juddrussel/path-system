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
// runs hourly forever without ever double-emailing the same task+type.

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
    `SELECT t.id AS task_id, t.title, t.deadline, t.doc_type,
            r.id AS rule_id, r.priority, r.reminder_lead_hours,
            u.email AS faculty_email
     FROM tasks t
     JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
     LEFT JOIN users u ON u.id = t.faculty_id
     WHERE t.status NOT IN (${placeholders})
       AND t.deadline >= CURDATE()
       AND DATEDIFF(t.deadline, CURDATE()) <= CEIL(r.reminder_lead_hours / 24)
       AND NOT EXISTS (
         SELECT 1 FROM sla_alerts a WHERE a.task_id = t.id AND a.alert_type = 'reminder'
       )`,
    DONE_STATUSES
  );
  return rows;
}

async function getBreachCandidates() {
  const placeholders = DONE_STATUSES.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT t.id AS task_id, t.title, t.deadline, t.doc_type,
            r.id AS rule_id, r.priority,
            u.email AS faculty_email
     FROM tasks t
     JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
     LEFT JOIN users u ON u.id = t.faculty_id
     WHERE t.status NOT IN (${placeholders})
       AND t.deadline < CURDATE()
       AND NOT EXISTS (
         SELECT 1 FROM sla_alerts a WHERE a.task_id = t.id AND a.alert_type = 'breach'
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
  // Runs at the top of every hour. Adjust the cron expression if you want a
  // different cadence (e.g. "*/30 * * * *" for every 30 minutes).
  cron.schedule("0 * * * *", async () => {
    try {
      await runReminders();
      await runBreaches();
    } catch (err) {
      console.error("[slaCron] run failed:", err);
    }
  });
  console.log("[slaCron] scheduled: hourly reminder/breach checks");
}

module.exports = { startSlaCron, runReminders, runBreaches, getReminderCandidates, getBreachCandidates };