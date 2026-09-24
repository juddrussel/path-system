// routes/task.routes.js
//
// ─── REQUIRED: run this SQL once to create the submissions table ──────────────
// CREATE TABLE IF NOT EXISTS task_submissions (
//   id                   INT AUTO_INCREMENT PRIMARY KEY,
//   task_id              INT          NOT NULL,
//   faculty_id           INT          NOT NULL,
//   file_name            VARCHAR(512),
//   file_url             VARCHAR(1024),
//   size                 BIGINT       DEFAULT 0,
//   note                 TEXT,
//   submission_group_id  VARCHAR(128),
//   submitted_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   INDEX idx_task_id (task_id),
//   INDEX idx_group   (submission_group_id)
// );
//
// ─── REQUIRED: run this SQL once to support multi-faculty / role assignment ───
// ALTER TABLE tasks ADD COLUMN assignment_group_id VARCHAR(128) NULL;
// (Lets the frontend/backend group multiple task rows created from a single
//  "assign to several faculty" or "assign to a whole role" submission.)
//
// ─── REQUIRED: run sql/003_notifications.sql once ─────────────────────────────
// Adds the `notifications` table that notify() below writes to. Without it,
// every notify() call below will throw and get swallowed (logged, not
// fatal) — notifications will just silently stop persisting again.
//
// ─── NOTE: tracking_id generation fix (no new table required) ────────────────
// The old generator derived the next sequence number from COUNT(*) of tasks
// created this year. That breaks the moment a row is deleted (COUNT drops but
// the highest tracking_id already issued doesn't), which is exactly what
// caused "Duplicate entry 'TASK-2026-0018'" — a row had been deleted earlier,
// so COUNT(*) produced a sequence number that had already been used.
//
// This version derives the next number from MAX(sequence number already used
// this year) instead of COUNT(*), so deleted rows can never cause reuse — it
// reads straight from your existing `tasks` table, no schema changes needed.
// The actual INSERT is also wrapped in a small retry loop that regenerates
// the id and tries again if it ever collides (e.g. two requests landing at
// the same instant), so this is safe under concurrency too.
//
// ─── FIX (this version): POST /api/tasks/draft was silently dropping
// attachments ────────────────────────────────────────────────────────────────
// The frontend uploads files to R2 as soon as they're selected and, on both
// "Assign Task" and "Save Draft", sends references to those already-uploaded
// files as a JSON string in the `attachments` form field — not raw file
// blobs. POST /api/tasks already handled this correctly, but POST
// /api/tasks/draft only ever looked at req.files (raw multipart uploads),
// which is always empty in the normal flow. The JSON reference was silently
// ignored, so drafts saved with attachments lost them with no error.
// /draft now parses req.body.attachments the same way /api/tasks does,
// with req.files kept as a fallback for genuine multipart uploads.
//
// ─── FIX (this version): notifications were fire-and-forget over the socket
// only ──────────────────────────────────────────────────────────────────────
// Every io.to(`user_${id}`).emit(...) call below only reached a client that
// happened to be connected and registered into that room at the literal
// instant of the emit. If they weren't (page not open yet, tab in the
// background reconnecting, server had just restarted, etc.) the event was
// gone forever — nothing recorded it. notify() now writes a row to the new
// `notifications` table right alongside each of those emits, and also emits
// a generic "notification" event carrying that saved row (with its real DB
// id) so the frontend can both catch up via GET /api/notifications on load
// and receive new ones live without needing a bespoke listener per event
// type. The original specific-event emits (task_assigned, task:status_changed,
// etc.) are left in place untouched, in case anything else in the app still
// listens for them directly for live UI updates.
//
// ─── NEW (this version): full deadline-reminder schedule ─────────────────────
// Adds checkDeadlineReminders() / startDeadlineReminderJob() — a periodic
// sweep that walks every active task's deadline and notifies the assigned
// faculty member at each configured milestone via the same notify() helper
// everything else in this file already uses:
//   48 hours before → task_deadline_48h "Upcoming Deadline"
//   24 hours before → task_deadline_24h "Deadline Tomorrow"    (most important)
//   4 hours before  → task_deadline_4h  "Deadline in 4 Hours"
//   on deadline day → task_due_today     "Due Today" (fires once per calendar
//                      day, independent of the hour list above)
//   at the exact deadline timestamp
//                    → task_deadline_now "Deadline Reached" (first sweep at
//                      or after the deadline's actual time, not just its day)
//   after deadline  → task_overdue       repeats every
//                      OVERDUE_REMINDER_INTERVAL_HOURS hours (default: 24)
// Every stage except the overdue one fires exactly once per task (checked
// against the notifications table); the overdue stage instead re-fires on
// an interval so it keeps nagging until the task moves out of an active
// status. No schema changes; it reuses the `notifications` table. Call
// startDeadlineReminderJob(io) once from your server entry point after `io`
// is created — see the bottom of this file for where it's exported.
//
// UPDATE: reminder stages and the overdue cadence are now configured in
// HOURS, not days (see SLAConfiguration.jsx's "Deadline Reminder Schedule"
// card). Backed by sla_rules.reminder_stage_hours / .overdue_reminder_interval_hours
// (added via migrations/add_reminder_schedule_columns.sql — these columns
// didn't previously exist on the table).
// ─────────────────────────────────────────────────────────────────────────────
const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const db       = require("../config/db");
const { writeLog } = require("./audit.routes");
const { uploadToR2, deleteFromR2 } = require("../utils/uploadToR2");

// ─── UPLOAD CONFIG ────────────────────────────────────────────────────────────
// Files land in memory (not disk) so they can be streamed straight to R2.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

// Uploads every file in req.files to R2 in parallel and returns
// [{ key, url, originalname, size }] — key is what deleteFromR2 needs later.
async function uploadFilesToR2(files) {
  return Promise.all(
    (files || []).map(async (f) => {
      const { key, url } = await uploadToR2(f);
      return { key, url, originalname: f.originalname, size: f.size };
    })
  );
}

// task_attachments/task_submissions only store file_url, not the R2 key,
// so on delete we recover the key by stripping the public URL prefix back off.
function r2KeyFromUrl(url) {
  if (!url || !process.env.R2_PUBLIC_URL) return null;
  const prefix = `${process.env.R2_PUBLIC_URL}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

// ─── HELPER: persist + push a notification ────────────────────────────────────
// Writes to the `notifications` table and, if a socket instance was passed,
// emits a generic "notification" event to that user's room with the saved
// row (real DB id + created_at included). Never throws — a notification
// failing to save should never take down the request that triggered it.
//
// Checks the recipient's notification preferences before sending:
//   inapp:false    → skip everything (no DB insert, no socket emit)
//   approval:false → skip approval/rejection/revision/status-change types
//   docUpdates:false → skip assignment/comment/attachment/deadline types
const APPROVAL_TYPES  = new Set(["task_status_changed", "task_submitted", "form_approved", "form_rejected", "form_revision"]);
const DOC_UPDATE_TYPES = new Set(["task_assigned", "task_comment_added", "task_attachment_added", "task_deadline_changed"]);

async function notify(io, { userId, type, title, message, taskId = null, trackingId = null }) {
  if (userId == null) return null;
  try {
    // Load recipient preferences (default all ON if not set)
    let prefs = { inapp: true, approval: true, docUpdates: true };
    try {
      const [rows] = await db.query("SELECT preferences FROM users WHERE id = ?", [userId]);
      if (rows.length && rows[0].preferences) prefs = { ...prefs, ...JSON.parse(rows[0].preferences) };
    } catch { /* non-fatal — default to sending */ }

    // Respect approval toggle — skip DB insert entirely for approval types
    if (prefs.approval === false && APPROVAL_TYPES.has(type)) return null;
    // Respect document updates toggle — skip DB insert entirely for doc update types
    if (prefs.docUpdates === false && DOC_UPDATE_TYPES.has(type)) return null;

    const [result] = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, task_id, tracking_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [userId, type, title, message, taskId, trackingId]
    );
    const payload = {
      id: result.insertId,
      user_id: userId,
      type,
      title,
      message,
      task_id: taskId,
      tracking_id: trackingId,
      is_read: 0,
      created_at: new Date().toISOString(),
    };
    // Only emit the socket event (which triggers the popup toast) if inapp is enabled
    if (io && prefs.inapp !== false) io.to(`user_${userId}`).emit("notification", payload);
    return payload;
  } catch (err) {
    console.error("notify() failed to persist notification:", err);
    return null;
  }
}

// ─── DEADLINE REMINDERS: notify faculty when a task's deadline is near ───────
// Tasks in these statuses have nothing left to warn about — not started
// (Draft), already done (Received), or no longer active (Archived).
const DEADLINE_REMINDER_EXCLUDED_STATUSES = ["Draft", "Received", "Archived"];

// ─── Reminder schedule: now configurable per SLA rule, not hardcoded ─────────
// The 48/24/4-hour-before schedule used to be fixed for every task. It's now
// read per-task from that task's SLA rule (matched by doc_type, same join
// slaCron.js already uses) — see sla_rules.reminder_stage_hours and
// .overdue_reminder_interval_hours, editable from SLAConfiguration.jsx's
// Escalation Settings. These two constants are only the fallback used when
// a task's doc_type has no matching *active* SLA rule.
const DEFAULT_REMINDER_STAGE_HOURS = [48, 24, 4];
const DEFAULT_OVERDUE_REMINDER_INTERVAL_HOURS = parseInt(process.env.OVERDUE_REMINDER_INTERVAL_HOURS || "24", 10);

// Parses the CSV reminder_stage_hours column (e.g. "72,24,4") into a
// sorted-descending array of positive integers — hours before the deadline.
// Falls back to DEFAULT_REMINDER_STAGE_HOURS if the value is missing,
// empty, or every entry turns out to be malformed — a bad value in the DB
// should never silently turn reminders off.
function parseStageHours(csv) {
  if (!csv) return DEFAULT_REMINDER_STAGE_HOURS;
  const hours = String(csv)
    .split(",")
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isInteger(n) && n > 0);
  const unique = [...new Set(hours)].sort((a, b) => b - a);
  return unique.length ? unique : DEFAULT_REMINDER_STAGE_HOURS;
}

// Builds the title text for a stage, given how many hours out it fires and
// which track it's for. "Due today" gets its own phrasing, 24-hours-before
// reads as "Tomorrow" for readability, everything else reads as "Deadline
// in N Hours" — this lets an admin configure ANY hour count and still get a
// sensible title instead of only a few hardcoded strings.
function stageTitle(hoursBefore, approval) {
  const suffix = approval ? " — Awaiting Your Approval" : "";
  if (hoursBefore === 0) return `Due Today${suffix}`;
  if (hoursBefore === 24) return `Deadline Tomorrow${suffix}`;
  return `Deadline in ${hoursBefore} Hour${hoursBefore === 1 ? "" : "s"}${suffix}`;
}

// Returns the { type, title, hoursBefore } stage object for the given
// hours-until-deadline, or null if that hour count isn't one of the task's
// configured stages. "Due today" always fires once per calendar day
// regardless of what's configured — it was never part of the editable list,
// it's driven by `isDueToday` (a same-PHT-calendar-day check) instead of the
// hour countdown. `type` encodes the hour count directly (e.g.
// "task_deadline_24h") so any admin-configured schedule still dedupes
// correctly against the `notifications` table without needing a schema change.
function buildStage(stageHours, hoursUntil, isDueToday, approval) {
  if (isDueToday) {
    // Keeps the original exact type names ("task_due_today" /
    // "task_approval_due_today") since "due today" was never part of the
    // configurable hour list — only the hour-based stages below vary.
    return {
      type: approval ? "task_approval_due_today" : "task_due_today",
      title: stageTitle(0, approval),
      hoursBefore: 0,
    };
  }
  if (!stageHours.includes(hoursUntil)) return null;
  const prefix = approval ? "task_approval_due_" : "task_deadline_";
  return { type: `${prefix}${hoursUntil}h`, title: stageTitle(hoursUntil, approval), hoursBefore: hoursUntil };
}

// Deletes every reminder-stage notification row for a task, regardless of
// which day counts were configured when they were sent — used when a
// deadline moves, so stale reminders (any of them) get cleared and
// checkDeadlineReminders() is free to send fresh ones against the new
// date. Matched by prefix/exact-type since the day-count suffix is no
// longer a fixed, enumerable set (an admin could configure "14,7,3,1" or
// anything else).
async function clearDeadlineReminderRows(taskId) {
  await db.query(
    `DELETE FROM notifications
     WHERE task_id = ?
       AND (
         type LIKE 'task_deadline_%'
         OR type LIKE 'task_approval_due_%'
         OR type IN ('task_due_today', 'task_overdue', 'task_approval_overdue')
       )`,
    [taskId]
  );
}

// Timezone used for anything date/time-related shown to users — deadline
// reminder messages, "due today" / "overdue" comparisons, etc. Without this,
// JS date formatting/comparison falls back to the server process's own
// timezone (usually UTC on a cloud host), which silently produces the wrong
// clock time or the wrong day for users in any other timezone — e.g. a
// 5:00 PM Manila deadline (stored as 9:00 AM UTC) would show up as "9:00 AM",
// and a task due at 3:00 AM Manila time could get miscounted as "not due
// today" or "overdue a day early" when compared using UTC dates.
const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Manila";

// Returns a date as "YYYY-MM-DD" IN APP_TIMEZONE (not the server's local/UTC
// day), so day-based comparisons (dueToday, overdue, etc.) line up with what
// the user actually sees on their clock, not the server's.
function phtDateKey(date) {
  return new Date(date).toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

// Formats a date/time (deadline, etc.) for display in user-facing messages,
// always rendered in APP_TIMEZONE regardless of how the value was stored or
// what shape it arrived in (Date object, MySQL DATETIME string, ISO string).
// Used anywhere a deadline gets embedded into a notification's message text,
// e.g. "changed the deadline for task X to <this>" — without this, that text
// showed the raw/UTC value instead of the user's local (PHT) time.
function formatDeadlineDisplay(date) {
  return new Date(date).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
    timeZone: APP_TIMEZONE,
  });
}

// Walks every active task with a deadline and fires whichever reminder (if
// any) applies to it right now: the configured hours-before and due-today
// stages each fire once per task; once the deadline has passed, an overdue
// notification repeats every OVERDUE_REMINDER_INTERVAL_HOURS hours. Unlike
// the old version this has to look at BOTH upcoming and already-passed
// deadlines, so there's no longer a narrow time-window filter in the SQL —
// the hour-based math below decides what (if anything) to send.
async function checkDeadlineReminders(io) {
  try {
    const placeholders = DEADLINE_REMINDER_EXCLUDED_STATUSES.map(() => "?").join(", ");

    // Fetched once per sweep (not per task) — every unapproved task shares
    // the same admin/program_chair audience, same recipient-lookup pattern
    // used in POST /:id/submit above, so a chair who's since gone inactive
    // or lost the role stops getting paged without a code change.
    const [chairsAndAdmins] = await db.query(
      "SELECT id FROM users WHERE role IN ('admin', 'program_chair') AND is_active = 1"
    );

    // LEFT JOIN sla_rules on doc_type (same match slaCron.js uses for its
    // email reminders) so each task carries its own configured reminder
    // schedule. `r.status = 'Active'` means a paused/deleted rule silently
    // falls back to the default schedule below rather than going stale.
    const [tasks] = await db.query(
      `SELECT t.*, u.full_name AS faculty_name,
              r.reminder_stage_hours, r.overdue_reminder_interval_hours
       FROM tasks t
       LEFT JOIN users u ON u.id = t.faculty_id
       LEFT JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
       WHERE t.deadline IS NOT NULL
         AND t.faculty_id IS NOT NULL
         AND t.status NOT IN (${placeholders})`,
      DEADLINE_REMINDER_EXCLUDED_STATUSES
    );

    const todayKey = phtDateKey(new Date());

    for (const task of tasks) {
      const stageHours = parseStageHours(task.reminder_stage_hours);
      const overdueIntervalHours = task.overdue_reminder_interval_hours > 0
        ? task.overdue_reminder_interval_hours
        : DEFAULT_OVERDUE_REMINDER_INTERVAL_HOURS;

      const deadlineTime = new Date(task.deadline).getTime();
      const nowTime = Date.now();
      const msUntil = deadlineTime - nowTime;

      // Hour-precision countdown (rounded to the nearest hour) so the
      // configured stages ("48,24,4") match on an exact hour count
      // regardless of the deadline's minute/second. "Due today" stays a
      // separate, calendar-day concept (isDueToday below) since it was
      // never part of the configurable list.
      const hoursUntil = Math.round(msUntil / 3600000);
      const deadlineKey = phtDateKey(task.deadline);
      const isDueToday = deadlineKey === todayKey;

      const deadlineStr = new Date(task.deadline).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        timeZone: APP_TIMEZONE,
      });

      // Exact-time "deadline reached" ping — separate from the hour-based
      // stages below. Fires once, the first sweep where the clock has
      // actually passed the deadline's timestamp (not just its calendar
      // day), so a 5:00 PM deadline notifies close to 5:00 PM rather than
      // whenever "due today" happened to fire earlier that day. Runs
      // regardless of hoursUntil, since it can be true on the due date
      // itself or any day after.
      if (nowTime >= deadlineTime) {
        await sendDeadlineReachedReminder(io, task, deadlineStr);
      }

      if (msUntil <= 0) {
        // Hours overdue, floored (not rounded) and clamped to at least 1 so
        // the very first sweep after the deadline reads as "1 hour overdue"
        // rather than "0 hours overdue".
        const hoursOverdue = Math.max(1, Math.floor(-msUntil / 3600000));
        await sendOverdueReminder(io, task, deadlineStr, hoursOverdue, overdueIntervalHours);
        await sendApprovalOverdueReminder(io, task, deadlineStr, hoursOverdue, chairsAndAdmins, overdueIntervalHours);
        continue;
      }

      const stage = buildStage(stageHours, hoursUntil, isDueToday, false);
      if (!stage) continue; // not one of this task's configured stages — nothing to send yet

      // Admin/program_chair track runs independently of the faculty one
      // below — it has its own notification type and its own per-recipient
      // dedup check, so it can't be skipped by the faculty "already sent"
      // guard (or vice versa) even though they fire on the same tick.
      const approvalStage = buildStage(stageHours, hoursUntil, isDueToday, true);
      if (approvalStage) {
        await sendApprovalStageReminder(io, task, approvalStage, deadlineStr, chairsAndAdmins);
      }

      const [[existing]] = await db.query(
        `SELECT id FROM notifications
         WHERE task_id = ? AND user_id = ? AND type = ?
         LIMIT 1`,
        [task.id, task.faculty_id, stage.type]
      );
      if (existing) continue; // already sent this milestone for the current deadline

      if (io) {
        io.to(`user_${task.faculty_id}`).emit("task:deadline_near", {
          taskId: task.id,
          deadline: task.deadline,
          stage: stage.type,
        });
      }

      await notify(io, {
        userId: task.faculty_id,
        type: stage.type,
        title: stage.title,
        message: stage.hoursBefore === 0
          ? `Task ${task.tracking_id} ("${task.title}") is due today (${deadlineStr}).`
          : `Task ${task.tracking_id} ("${task.title}") is due in ${stage.hoursBefore} hour${stage.hoursBefore === 1 ? "" : "s"} (${deadlineStr}).`,
        taskId: task.id,
        trackingId: task.tracking_id,
      });
    }
  } catch (err) {
    // Never let a failed sweep crash the interval — log and try again next tick.
    console.error("checkDeadlineReminders() failed:", err);
  }
}

// Sends the one-time "the deadline moment has actually arrived" ping for a
// task. Distinct from task_due_today (which fires once for the calendar
// day, whenever the sweep first runs that day) — this one fires on the
// first sweep at or after the deadline's exact timestamp, so it lands
// close to the real due time instead of just "sometime that day". Only
// ever sent once per deadline; checked the same way as the day-based
// stages above.
async function sendDeadlineReachedReminder(io, task, deadlineStr) {
  const [[existing]] = await db.query(
    `SELECT id FROM notifications
     WHERE task_id = ? AND user_id = ? AND type = 'task_deadline_now'
     LIMIT 1`,
    [task.id, task.faculty_id]
  );
  if (existing) return; // already sent for this deadline

  if (io) {
    io.to(`user_${task.faculty_id}`).emit("task:deadline_now", {
      taskId: task.id,
      deadline: task.deadline,
    });
  }

  await notify(io, {
    userId: task.faculty_id,
    type: "task_deadline_now",
    title: "Deadline Reached",
    message: `Task ${task.tracking_id} ("${task.title}") is due right now (${deadlineStr}).`,
    taskId: task.id,
    trackingId: task.tracking_id,
  });
}

// Notifies every admin/program_chair (plus the original assigner, same
// belt-and-suspenders reasoning as POST /:id/submit above) that an
// unapproved task is approaching its deadline. Every task passed in here
// is already unapproved by construction — checkDeadlineReminders() only
// queries tasks outside DEADLINE_REMINDER_EXCLUDED_STATUSES, which
// includes "Received" — so there's no additional status check to make.
// Fires once per recipient per stage per deadline, same guard pattern as
// the faculty-facing reminder, just checked per-user since each admin's
// "already sent" state is independent.
async function sendApprovalStageReminder(io, task, stage, deadlineStr, chairsAndAdmins) {
  const recipientIds = new Set(chairsAndAdmins.map(u => u.id));
  if (task.assigned_by) recipientIds.add(task.assigned_by);

  const message = stage.hoursBefore === 0
    ? `Task ${task.tracking_id} ("${task.title}", assigned to ${task.faculty_name || "faculty"}) is due today (${deadlineStr}) and still awaiting your approval.`
    : `Task ${task.tracking_id} ("${task.title}", assigned to ${task.faculty_name || "faculty"}) is due in ${stage.hoursBefore} hour${stage.hoursBefore === 1 ? "" : "s"} (${deadlineStr}) and still awaiting your approval.`;

  for (const recipientId of recipientIds) {
    const [[existing]] = await db.query(
      `SELECT id FROM notifications
       WHERE task_id = ? AND user_id = ? AND type = ?
       LIMIT 1`,
      [task.id, recipientId, stage.type]
    );
    if (existing) continue; // already sent this milestone to this recipient for the current deadline

    if (io) {
      io.to(`user_${recipientId}`).emit("task:approval_due_near", {
        taskId: task.id,
        deadline: task.deadline,
        stage: stage.type,
      });
    }

    await notify(io, {
      userId: recipientId,
      type: stage.type,
      title: stage.title,
      message,
      taskId: task.id,
      trackingId: task.tracking_id,
    });
  }
}

// Sends (or re-sends) the overdue notification for one task. Looks at the
// most recent task_overdue row for this task/user and only sends a new one
// once intervalHours (the task's SLA rule's overdue_reminder_interval_hours
// column — value now interpreted as hours — or
// DEFAULT_OVERDUE_REMINDER_INTERVAL_HOURS if it has no active rule) have
// passed since it, so faculty get a standing nag at a controlled cadence
// instead of either silence or a fresh notification every sweep.
async function sendOverdueReminder(io, task, deadlineStr, hoursOverdue, intervalHours = DEFAULT_OVERDUE_REMINDER_INTERVAL_HOURS) {
  const [[lastOverdue]] = await db.query(
    `SELECT created_at FROM notifications
     WHERE task_id = ? AND user_id = ? AND type = 'task_overdue'
     ORDER BY created_at DESC LIMIT 1`,
    [task.id, task.faculty_id]
  );

  if (lastOverdue) {
    const hoursSinceLast = (Date.now() - new Date(lastOverdue.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < intervalHours) return; // not due for another nag yet
  }

  if (io) {
    io.to(`user_${task.faculty_id}`).emit("task:overdue", {
      taskId: task.id,
      deadline: task.deadline,
      hoursOverdue,
    });
  }

  await notify(io, {
    userId: task.faculty_id,
    type: "task_overdue",
    title: "Task Overdue",
    message: `Task ${task.tracking_id} ("${task.title}") was due ${deadlineStr} and is now ${hoursOverdue} hour${hoursOverdue === 1 ? "" : "s"} overdue.`,
    taskId: task.id,
    trackingId: task.tracking_id,
  });
}

// Admin/program_chair equivalent of sendOverdueReminder() above — same
// per-recipient cadence gate (intervalHours since THAT recipient's last
// task_approval_overdue row, not the faculty one), sent to
// admins/program_chairs plus the original assigner. Independent of
// sendOverdueReminder(): a chair's nag cadence isn't tied to whenever the
// faculty member's own overdue reminder last fired.
async function sendApprovalOverdueReminder(io, task, deadlineStr, hoursOverdue, chairsAndAdmins, intervalHours = DEFAULT_OVERDUE_REMINDER_INTERVAL_HOURS) {
  const recipientIds = new Set(chairsAndAdmins.map(u => u.id));
  if (task.assigned_by) recipientIds.add(task.assigned_by);

  const message = `Task ${task.tracking_id} ("${task.title}", assigned to ${task.faculty_name || "faculty"}) was due ${deadlineStr} and is now ${hoursOverdue} hour${hoursOverdue === 1 ? "" : "s"} overdue, still awaiting your approval.`;

  for (const recipientId of recipientIds) {
    const [[lastOverdue]] = await db.query(
      `SELECT created_at FROM notifications
       WHERE task_id = ? AND user_id = ? AND type = 'task_approval_overdue'
       ORDER BY created_at DESC LIMIT 1`,
      [task.id, recipientId]
    );

    if (lastOverdue) {
      const hoursSinceLast = (Date.now() - new Date(lastOverdue.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceLast < intervalHours) continue; // not due for another nag yet
    }

    if (io) {
      io.to(`user_${recipientId}`).emit("task:approval_overdue", {
        taskId: task.id,
        deadline: task.deadline,
        hoursOverdue,
      });
    }

    await notify(io, {
      userId: recipientId,
      type: "task_approval_overdue",
      title: "Task Overdue — Awaiting Your Approval",
      message,
      taskId: task.id,
      trackingId: task.tracking_id,
    });
  }
}

// Kicks off the periodic sweep: runs once immediately (so a server restart
// doesn't wait a full interval before catching up), then on a fixed
// interval after that. Call once from your server entry point after `io`
// is created, e.g.:
//   const { router, setupTypingEvents, startDeadlineReminderJob } = require("./routes/task.routes");
//   startDeadlineReminderJob(io);
function startDeadlineReminderJob(io, intervalMs = 5 * 60 * 1000) {
  checkDeadlineReminders(io);
  const handle = setInterval(() => checkDeadlineReminders(io), intervalMs);
  return handle; // returned in case you ever want to clearInterval() in tests
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized." });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireChairOrAdmin(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Program Chair or Admin access required." });
  next();
}

// ─── HELPER: generate tracking ID ────────────────────────────────────────────
// Looks at the highest sequence number already used THIS YEAR (parsed out of
// existing tracking_id values) and returns the next one. Unlike COUNT(*),
// this is unaffected by deleted rows — MAX only ever goes up.
//
// `offset` lets callers skip ahead when retrying after a collision (see
// insertTaskWithUniqueTrackingId below) without needing a re-query loop here.
async function generateTrackingId(offset = 0) {
  const year = new Date().getFullYear();
  const [[{ max_seq }]] = await db.query(
    `SELECT MAX(CAST(SUBSTRING_INDEX(tracking_id, '-', -1) AS UNSIGNED)) AS max_seq
     FROM tasks
     WHERE tracking_id LIKE ?`,
    [`TASK-${year}-%`]
  );
  const seq = (max_seq || 0) + 1 + offset;
  return `TASK-${year}-${String(seq).padStart(4, "0")}`;
}

// ─── HELPER: insert a task row with a guaranteed-unique tracking_id ──────────
// Generates a tracking_id, attempts the insert, and if it ever collides
// (ER_DUP_ENTRY — e.g. two requests landing at the same instant before either
// commits) regenerates a higher number and retries, up to maxAttempts times.
// `runInsert(tracking_id)` should perform the INSERT and return its result.
async function insertTaskWithUniqueTrackingId(runInsert, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tracking_id = await generateTrackingId(attempt);
    try {
      const result = await runInsert(tracking_id);
      return { tracking_id, result };
    } catch (err) {
      const isDup = err.code === "ER_DUP_ENTRY" && /tracking_id/.test(err.sqlMessage || "");
      if (isDup && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }
}

// ─── HELPER: attach comments + attachments + submissions to tasks ─────────────
async function enrichTasks(rows) {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);

  let attachments = [];
  try {
    const [result] = await db.query(
      `SELECT ta.*, COALESCE(u.full_name, 'Unknown') AS uploaded_by_name
       FROM task_attachments ta
       LEFT JOIN users u ON u.id = ta.uploaded_by
       WHERE ta.task_id IN (?)`, [ids]
    );
    attachments = result;
  } catch (err) {
    // Fallback if uploaded_by column doesn't exist yet
    try {
      const [result] = await db.query(
        `SELECT ta.* FROM task_attachments ta WHERE ta.task_id IN (?)`, [ids]
      );
      attachments = result.map(a => ({ ...a, uploaded_by_name: 'Unknown' }));
    } catch (_) { /* table may not exist yet — safe to ignore */ }
  }
  const [comments] = await db.query(
    `SELECT tc.*, u.full_name AS sender_name
     FROM task_comments tc
     LEFT JOIN users u ON u.id = tc.sender_id
     WHERE tc.task_id IN (?)
     ORDER BY tc.created_at ASC`, [ids]
  );

  // Submissions = files faculty upload when submitting their work.
  // Kept separate from task_attachments so they never mix with the task brief.
  let submissions = [];
  try {
    [submissions] = await db.query(
      `SELECT ts.*, u.full_name AS submitted_by_name
       FROM task_submissions ts
       LEFT JOIN users u ON u.id = ts.faculty_id
       WHERE ts.task_id IN (?)
       ORDER BY ts.submitted_at ASC`, [ids]
    );
  } catch (_) { /* table may not exist yet — safe to ignore */ }

  // Fetch collaborators for collaborative tasks
  let collaborators = [];
  try {
    const [collabRows] = await db.query(
      `SELECT tc.task_id, tc.user_id, tc.confirmed_at, u.full_name, u.email
       FROM task_collaborators tc
       JOIN users u ON u.id = tc.user_id
       WHERE tc.task_id IN (?)`,
      [ids]
    );
    collaborators = collabRows;
  } catch (_) { /* table may not exist yet — safe to ignore */ }

  const attachMap     = {};
  const commentMap    = {};
  const submissionMap = {};
  const collaboratorMap = {};
  attachments.forEach(a => {
    if (!attachMap[a.task_id])     attachMap[a.task_id]     = [];
    attachMap[a.task_id].push(a);
  });
  comments.forEach(c => {
    if (!commentMap[c.task_id])    commentMap[c.task_id]    = [];
    commentMap[c.task_id].push(c);
  });
  submissions.forEach(s => {
    if (!submissionMap[s.task_id]) submissionMap[s.task_id] = [];
    submissionMap[s.task_id].push(s);
  });
  collaborators.forEach(c => {
    if (!collaboratorMap[c.task_id]) collaboratorMap[c.task_id] = [];
    collaboratorMap[c.task_id].push({
      user_id: c.user_id,
      confirmed_at: c.confirmed_at,
      full_name: c.full_name,
      email: c.email,
    });
  });

  return rows.map(r => ({
    ...r,
    attachments: attachMap[r.id]     || [],
    comments:    commentMap[r.id]    || [],
    submissions: submissionMap[r.id] || [],
    collaborators: collaboratorMap[r.id] || [],
  }));
}

// ─── HELPER: normalize faculty_ids from FormData (may arrive as a single
// value, a repeated field, or a JSON string) into a clean array of ids ────────
function normalizeFacultyIds(body) {
  let raw = body.faculty_ids ?? body.faculty_id ?? null;
  if (raw == null) return [];
  if (!Array.isArray(raw)) {
    // A single repeated FormData field arrives as a string; try JSON first
    // (in case the caller sent a JSON-encoded array), then fall back to
    // treating it as one id.
    if (typeof raw === "string" && raw.trim().startsWith("[")) {
      try { raw = JSON.parse(raw); } catch { raw = [raw]; }
    } else {
      raw = [raw];
    }
  }
  return [...new Set(raw.map(id => parseInt(id, 10)).filter(id => !Number.isNaN(id)))];
}

// ─── HELPER: resolve the target faculty id list for a create/draft request.
// Supports two input shapes from the client:
//   - faculty_ids: [1,2,3]      → assign to those specific users
//   - assign_role: "faculty"    → assign to every active user with that role
// Returns { facultyIds, error } — error is a user-facing message if invalid.
// ─────────────────────────────────────────────────────────────────────────────
async function resolveTargetFacultyIds(body) {
  const assignRole = (body.assign_role || "").trim();

  if (assignRole) {
    const [users] = await db.query(
      "SELECT id FROM users WHERE role = ? AND is_active = 1", [assignRole]
    );
    if (users.length === 0) {
      return { facultyIds: [], error: `No active users found with role "${assignRole}".` };
    }
    return { facultyIds: users.map(u => u.id), error: null };
  }

  const facultyIds = normalizeFacultyIds(body);
  if (facultyIds.length === 0) {
    return { facultyIds: [], error: "faculty_ids (or assign_role) is required." };
  }
  return { facultyIds, error: null };
}

// ─── SOCKET.IO: TYPING INDICATOR SETUP ───────────────────────────────────────
// Call this once from your server entry point (e.g. app.js / server.js):
//
//   const { setupTypingEvents } = require("./routes/task.routes");
//   setupTypingEvents(io);
//
// Make sure socket.userId is set in your Socket.IO auth middleware or
// inside your existing "register" handler:
//
//   socket.on("register", (userId) => {
//     socket.userId = userId;          // ← required
//     socket.join(`user_${userId}`);
//   });
// ─────────────────────────────────────────────────────────────────────────────
function setupTypingEvents(io) {
  io.on("connection", (socket) => {

    // ── Join a task's discussion room (call from frontend when panel opens) ──
    socket.on("join_task", ({ taskId }) => {
      if (!taskId) return;
      socket.join(`task_${taskId}`);
    });

    // ── Leave a task's discussion room (call from frontend when panel closes) ─
    socket.on("leave_task", ({ taskId }) => {
      if (!taskId) return;
      socket.leave(`task_${taskId}`);
      // Clear stale typing indicator for other users in the room
      socket.to(`task_${taskId}`).emit("task:user_stop_typing", {
        taskId,
        userId: socket.userId,
      });
    });

    // ── User started typing in the comment box ───────────────────────────────
    socket.on("typing", ({ taskId, name }) => {
      if (!socket.userId || !taskId) return;
      socket.to(`task_${taskId}`).emit("task:user_typing", {
        taskId,
        userId: socket.userId,
        name,
      });
    });

    // ── User stopped typing (timeout or message sent) ────────────────────────
    socket.on("stop_typing", ({ taskId }) => {
      if (!socket.userId || !taskId) return;
      socket.to(`task_${taskId}`).emit("task:user_stop_typing", {
        taskId,
        userId: socket.userId,
      });
    });

    // ── Clean up on disconnect ───────────────────────────────────────────────
    socket.on("disconnecting", () => {
      // Broadcast stop_typing to every task room this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith("task_")) {
          socket.to(room).emit("task:user_stop_typing", {
            taskId: parseInt(room.replace("task_", "")),
            userId: socket.userId,
          });
        }
      });
    });
  });
}

// ─── GET /api/tasks/next-tracking-id ─────────────────────────────────────────
router.get("/next-tracking-id", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    return res.json({ tracking_id: await generateTrackingId() });
  } catch (err) {
    console.error("GET /next-tracking-id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/my — tasks assigned to the current user (faculty view) ───
router.get("/my", requireAuth, async (req, res) => {
  try {
    const { q = "", status = "", priority = "", doc_type = "", date = "" } = req.query;

    const conditions = ["(t.faculty_id = ? OR t.collaborator_id = ? OR t.id IN (SELECT task_id FROM task_collaborators WHERE user_id = ?))"];
    const params     = [req.user.id, req.user.id, req.user.id];

    if (status)   { conditions.push("t.status = ?");              params.push(status); }
    if (priority) { conditions.push("t.priority = ?");            params.push(priority); }
    if (doc_type) { conditions.push("t.doc_type = ?");            params.push(doc_type); }
    if (date)     { conditions.push("DATE(t.created_at) = ?");    params.push(date); }
    if (q)        {
      conditions.push("(t.title LIKE ? OR t.tracking_id LIKE ? OR u2.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
         t.*,
         u1.full_name AS faculty_name,
         u1.email     AS faculty_email,
         u2.full_name AS assigned_by_name,
         u3.full_name AS collaborator_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       LEFT JOIN users u3 ON u3.id = t.collaborator_id
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    const tasks = await enrichTasks(rows);

    const now      = new Date();
    const today    = phtDateKey(now);
    const total    = tasks.length;
    const dueToday = tasks.filter(t => t.deadline && phtDateKey(t.deadline) === today).length;
    const overdue  = tasks.filter(t => t.deadline && phtDateKey(t.deadline) < today && t.status !== "Received").length;
    const pendingApproval = tasks.filter(t => t.status === "For Approval").length;

    return res.json({ tasks, stats: { total, dueToday, overdue, pendingApproval } });
  } catch (err) {
    console.error("GET /api/tasks/my error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks — all tasks (admin/chair) ─────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    let rows;
    if (["admin", "program_chair"].includes(req.user.role)) {
      [rows] = await db.query(
        `SELECT t.*, u1.full_name AS faculty_name, u1.email AS faculty_email, u2.full_name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users u1 ON u1.id = t.faculty_id
         LEFT JOIN users u2 ON u2.id = t.assigned_by
         ORDER BY t.created_at DESC`
      );
    } else {
      [rows] = await db.query(
        `SELECT t.*, u2.full_name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users u2 ON u2.id = t.assigned_by
         WHERE t.faculty_id = ?
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    }
    return res.json(await enrichTasks(rows));
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/assigned-by-me ───────────────────────────────────────────
router.get("/assigned-by-me", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const { q = "", status = "", priority = "", date = "" } = req.query;

    const conditions = ["t.assigned_by = ?"];
    const params     = [req.user.id];

    if (status)   { conditions.push("t.status = ?");              params.push(status); }
    if (priority) { conditions.push("t.priority = ?");            params.push(priority); }
    if (date)     { conditions.push("DATE(t.deadline) = ?");      params.push(date); }
    if (q) {
      conditions.push("(t.title LIKE ? OR t.tracking_id LIKE ? OR u1.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT
         t.*,
         u1.full_name  AS assigned_to_name,
         u1.email      AS assigned_to_email,
         u2.full_name  AS assigned_by_name,
         u2.email      AS assigned_by_email
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    const tasks = await enrichTasks(rows);

    const now   = new Date();
    const total           = tasks.length;
    const pendingApproval = tasks.filter(t => t.status === "For Approval").length;
    const submitted       = tasks.filter(t => ["Received", "For Approval"].includes(t.status)).length;
    const overdue         = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < now && !["Received", "Archived"].includes(t.status)
    ).length;

    return res.json({ tasks, stats: { total, pendingApproval, submitted, overdue } });
  } catch (err) {
    console.error("GET /api/tasks/assigned-by-me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u1.full_name AS faculty_name, u1.email AS faculty_email, u2.full_name AS assigned_by_name, u3.full_name AS collaborator_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       LEFT JOIN users u3 ON u3.id = t.collaborator_id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    
    // Check if user has access
    let canView = ["admin", "program_chair"].includes(req.user.role) || 
                  task.faculty_id === req.user.id || 
                  task.collaborator_id === req.user.id;
    
    // Also check task_collaborators table for collaborative tasks
    if (!canView && task.is_collaborative) {
      const [collab] = await db.query(
        "SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );
      canView = collab.length > 0;
    }
    
    if (!canView) return res.status(403).json({ message: "Access denied." });
    const enriched = await enrichTasks([task]);
    const responseTask = enriched[0];
    // Return as { task: ... } so frontend fetchSelectedTask can read data.task || data
    return res.json({ task: responseTask });
  } catch (err) {
    console.error("GET /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks — create & assign a task ────────────────────────────────
// Accepts either:
//   faculty_ids  (repeated field or JSON array) → creates one task per faculty
//   assign_role  (e.g. "faculty")                → creates one task per every
//                                                   active user with that role
router.post("/", requireAuth, requireChairOrAdmin, upload.array("attachments"), async (req, res) => {
  const { title, doc_type, priority = "Medium", deadline, notes } = req.body;
  if (!title || !deadline)
    return res.status(400).json({ message: "title and deadline are required." });

  try {
    const { facultyIds, error } = await resolveTargetFacultyIds(req.body);
    if (error) return res.status(400).json({ message: error });

    const assignmentGroupId = facultyIds.length > 1 ? `grp_${Date.now()}` : null;
    const io = req.app.get("io");
    const createdTasks = [];

    // Sequential so each generateTrackingId() call sees the previous
    // iteration's insert when it re-reads MAX(...) from the tasks table.
    for (const facultyId of facultyIds) {
      const { tracking_id, result } = await insertTaskWithUniqueTrackingId((tid) =>
        db.query(
          `INSERT INTO tasks (tracking_id, faculty_id, assigned_by, title, doc_type, priority, deadline, notes, status, assignment_group_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, NOW(), NOW())`,
          [tid, facultyId, req.user.id, title, doc_type || null, priority, deadline, notes || null, assignmentGroupId]
        ).then(([r]) => r)
      );
      const taskId = result.insertId;

      // The frontend uploads files to R2 as soon as they're selected (for
      // progress bars) and, on submit, sends references to those already-
      // uploaded files as a JSON string in `attachments` — not raw file
      // blobs. So req.files will normally be empty here; read the JSON
      // references instead. Still honor req.files as a fallback in case a
      // caller does send real multipart files under this field.
      let preUploaded = [];
      try {
        preUploaded = JSON.parse(req.body.attachments || "[]");
      } catch { preUploaded = []; }
      preUploaded = Array.isArray(preUploaded) ? preUploaded.filter(a => a?.url) : [];

      const attachRows = [];
      if (preUploaded.length > 0) {
        preUploaded.forEach(a => attachRows.push([taskId, a.url, a.name || "file", req.user.id, new Date()]));
      }
      if (req.files?.length > 0) {
        const uploaded = await uploadFilesToR2(req.files);
        uploaded.forEach(f => attachRows.push([taskId, f.url, f.originalname, req.user.id, new Date()]));
      }
      if (attachRows.length > 0) {
        await db.query("INSERT INTO task_attachments (task_id, file_url, file_name, uploaded_by, uploaded_at) VALUES ?", [attachRows]);
      }

      const assignMessage = `You have been assigned a new task: ${title}`;

      if (io) {
        io.to(`user_${facultyId}`).emit("task_assigned", {
          message: assignMessage,
          tracking_id,
          taskId,
        });
      }
      await notify(io, {
        userId: facultyId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: assignMessage,
        taskId,
        trackingId: tracking_id,
      });

      // Add all collaborators to task_collaborators table (for multi-faculty collaboration)
      if (facultyIds.length >= 2) {
        const collaboratorRows = facultyIds.map(fId => [taskId, fId]);
        await db.query("INSERT INTO task_collaborators (task_id, user_id) VALUES ?", [collaboratorRows]);
      }

      createdTasks.push({ taskId, tracking_id, facultyId });
    }

    await writeLog({
      userId:    req.user.id,
      action:    "TASK_ASSIGN",
      detail:    req.body.assign_role
        ? `Assigned task "${title}" to all users with role "${req.body.assign_role}" (${facultyIds.length} recipient(s))`
        : `Assigned task "${title}" to ${facultyIds.length} faculty member(s): ${facultyIds.join(", ")}`,
      ipAddress: req.ip,
    });

    const taskIds = createdTasks.map(t => t.taskId);
    const [rows] = await db.query(
      `SELECT t.*, u1.full_name AS faculty_name, u2.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       WHERE t.id IN (?)`, [taskIds]
    );
    const enriched = await enrichTasks(rows);

    // Keep the response shape close to the original single-task version
    // (tracking_id = first one) while also exposing the full set.
    return res.status(201).json({
      ...enriched[0],
      tracking_id:  createdTasks[0]?.tracking_id,
      count:        createdTasks.length,
      tracking_ids: createdTasks.map(t => t.tracking_id),
      tasks:        enriched,
    });
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/draft ───────────────────────────────────────────────────
router.post("/draft", requireAuth, requireChairOrAdmin, upload.array("attachments"), async (req, res) => {
  const { title, doc_type, priority = "Medium", deadline, notes } = req.body;
  try {
    // Drafts are allowed to have no target yet — only resolve if something was given
    let facultyIds = [];
    if (req.body.assign_role || req.body.faculty_ids || req.body.faculty_id) {
      const resolved = await resolveTargetFacultyIds(req.body);
      if (resolved.error) return res.status(400).json({ message: resolved.error });
      facultyIds = resolved.facultyIds;
    }
    if (facultyIds.length === 0) facultyIds = [null]; // single draft with no assignee yet

    const assignmentGroupId = facultyIds.length > 1 ? `grp_${Date.now()}` : null;
    const createdDrafts = [];

    // FIX: the frontend's "Save Draft" sends already-uploaded R2 file
    // references as a JSON string in `attachments` — the exact same shape
    // POST /api/tasks reads. This route previously only checked req.files
    // (raw multipart uploads), which is always empty in that flow, so the
    // JSON reference was silently dropped and drafts lost their attachments.
    let preUploaded = [];
    try {
      preUploaded = JSON.parse(req.body.attachments || "[]");
    } catch { preUploaded = []; }
    preUploaded = Array.isArray(preUploaded) ? preUploaded.filter(a => a?.url) : [];

    for (const facultyId of facultyIds) {
      const { tracking_id, result } = await insertTaskWithUniqueTrackingId((tid) =>
        db.query(
          `INSERT INTO tasks (tracking_id, faculty_id, assigned_by, title, doc_type, priority, deadline, notes, status, assignment_group_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, NOW(), NOW())`,
          [tid, facultyId, req.user.id, title || "Untitled Draft", doc_type || null, priority, deadline || null, notes || null, assignmentGroupId]
        ).then(([r]) => r)
      );
      const taskId = result.insertId;

      const attachRows = [];
      if (preUploaded.length > 0) {
        preUploaded.forEach(a => attachRows.push([taskId, a.url, a.name || "file", req.user.id, new Date()]));
      }
      if (req.files?.length > 0) {
        const uploaded = await uploadFilesToR2(req.files);
        uploaded.forEach(f => attachRows.push([taskId, f.url, f.originalname, req.user.id, new Date()]));
      }
      if (attachRows.length > 0) {
        await db.query("INSERT INTO task_attachments (task_id, file_url, file_name, uploaded_by, uploaded_at) VALUES ?", [attachRows]);
      }
    }

    return res.status(201).json({
      message:      "Draft saved.",
      tracking_id:  createdDrafts[0]?.tracking_id,
      id:           createdDrafts[0]?.id,
      count:        createdDrafts.length,
      drafts:       createdDrafts,
    });
  } catch (err) {
    console.error("POST /api/tasks/draft error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/collaborative ──────────────────────────────────────────────
// Assigns a task to 2 or more faculty members with collaborative workflow.
// All users must confirm before the task moves to "For Approval" status.
// Request body:
//   title, doc_type, priority, deadline, notes (same as regular assignment)
//   faculty_ids: [id1, id2, id3, ...] (minimum 2)
//   collaboration_mode: "together" (if not "together", falls back to regular assignment)
//   attachments: JSON string of pre-uploaded files
router.post("/collaborative", requireAuth, requireChairOrAdmin, upload.array("attachments"), async (req, res) => {
  const { title, doc_type, priority = "Medium", deadline, notes, collaboration_mode } = req.body;
  if (!title || !deadline) {
    return res.status(400).json({ message: "title and deadline are required." });
  }
  
  // Parse faculty_ids from request
  let facultyIds = req.body.faculty_ids;
  if (typeof facultyIds === "string") {
    facultyIds = [facultyIds];
  }
  facultyIds = Array.isArray(facultyIds) ? facultyIds.map(id => parseInt(id, 10)).filter(Number.isInteger) : [];
  
  // For collaborative workflow, we need at least 2 faculty members
  if (facultyIds.length < 2) {
    return res.status(400).json({ message: "Collaborative assignment requires at least 2 faculty members." });
  }

  if (collaboration_mode !== "together") {
    return res.status(400).json({ message: "Only collaboration_mode='together' is supported for this endpoint." });
  }

  try {
    const io = req.app.get("io");
    
    // Verify all faculty members exist and are active
    const [facultyCheckResult] = await db.query(
      `SELECT id, full_name FROM users WHERE id IN (${facultyIds.map(() => '?').join(',')}) AND is_active = 1`,
      facultyIds
    );

    if (facultyCheckResult.length !== facultyIds.length) {
      return res.status(400).json({ message: "One or more faculty members are invalid or inactive." });
    }

    // Generate tracking ID for the collaborative task
    const { tracking_id, result } = await insertTaskWithUniqueTrackingId((tid) => {
      return db.query(
        `INSERT INTO tasks (
          tracking_id, faculty_id, assigned_by, 
          title, doc_type, priority, deadline, notes, status, 
          is_collaborative, collaboration_type, confirmation_status,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 1, 'together', 'awaiting', NOW(), NOW())`,
        [tid, facultyIds[0], req.user.id, title, doc_type || null, priority, deadline, notes || null]
      ).then(([r]) => r);
    });

    const taskId = result.insertId;

    // Add all collaborators to task_collaborators table
    const collaboratorRows = facultyIds.map(fId => [taskId, fId]);
    await db.query("INSERT INTO task_collaborators (task_id, user_id) VALUES ?", [collaboratorRows]);

    // Handle attachments
    let preUploaded = [];
    try {
      preUploaded = JSON.parse(req.body.attachments || "[]");
    } catch { preUploaded = []; }
    preUploaded = Array.isArray(preUploaded) ? preUploaded.filter(a => a?.url) : [];

    const attachRows = [];
    if (preUploaded.length > 0) {
      preUploaded.forEach(a => attachRows.push([taskId, a.url, a.name || "file", req.user.id, new Date()]));
    }
    if (req.files?.length > 0) {
      const uploaded = await uploadFilesToR2(req.files);
      uploaded.forEach(f => attachRows.push([taskId, f.url, f.originalname, req.user.id, new Date()]));
    }
    if (attachRows.length > 0) {
      await db.query("INSERT INTO task_attachments (task_id, file_url, file_name, uploaded_by, uploaded_at) VALUES ?", [attachRows]);
    }

    // Notify all users
    const assignMessage = `You have been assigned a collaborative task: ${title}`;
    
    for (const facultyId of facultyIds) {
      if (io) {
        io.to(`user_${facultyId}`).emit("task_assigned", {
          message: assignMessage,
          tracking_id,
          taskId,
          isCollaborative: true,
        });
      }
      await notify(io, {
        userId: facultyId,
        type: "task_assigned",
        title: "New Collaborative Task Assigned",
        message: assignMessage,
        taskId,
        trackingId: tracking_id,
      });
    }

    // Log the action
    const facultyNames = facultyCheckResult.map(u => u.full_name).join(", ");
    await writeLog({
      userId: req.user.id,
      action: "TASK_ASSIGN_COLLABORATIVE",
      detail: `Assigned collaborative task "${title}" to ${facultyCheckResult.length} collaborators: ${facultyNames}`,
      ipAddress: req.ip,
    });

    // Return the created task
    const [rows] = await db.query(
      `SELECT t.*, u1.full_name AS faculty_name, u2.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       WHERE t.id = ?`,
      [taskId]
    );

    const enriched = await enrichTasks(rows);
    return res.status(201).json({
      ...enriched[0],
      tracking_id,
      isCollaborative: true,
      collaboration_mode: "together",
    });
  } catch (err) {
    console.error("POST /api/tasks/collaborative error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/confirm-collaboration ──────────────────────────────
// Confirms that a faculty member on a collaborative task has completed their edits.
// Both users must confirm before the task can be submitted.
router.post("/:id/confirm-collaboration", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = taskRows[0];

    // Verify this is a collaborative task
    if (!task.is_collaborative) {
      return res.status(400).json({ message: "This task is not a collaborative task." });
    }

    // Verify the user is one of the collaborators
    const [collaboratorCheck] = await db.query(
      "SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (collaboratorCheck.length === 0) {
      return res.status(403).json({ message: "You are not assigned to this collaborative task." });
    }

    // Update the collaborator's confirmation timestamp
    await db.query(
      `UPDATE task_collaborators SET confirmed_at = NOW() WHERE task_id = ? AND user_id = ?`,
      [taskId, userId]
    );

    // Check if ALL collaborators have confirmed
    const [allCollaborators] = await db.query(
      "SELECT id, user_id, confirmed_at FROM task_collaborators WHERE task_id = ?",
      [taskId]
    );

    const allConfirmed = allCollaborators.every(c => c.confirmed_at !== null);

    // Update confirmation_status if all have confirmed
    let newConfirmationStatus = "awaiting";
    if (allConfirmed) {
      newConfirmationStatus = "confirmed";
      await db.query(
        "UPDATE tasks SET confirmation_status = 'confirmed' WHERE id = ?",
        [taskId]
      );
    }

    // Notify all other collaborators via WebSocket
    const io = req.app.get("io");
    const userName = req.user.full_name || req.user.username;
    const otherCollaborators = allCollaborators.filter(c => c.user_id !== userId);
    const confirmedCount = allCollaborators.filter(c => c.confirmed_at).length;

    // Log the confirmation action
    await writeLog({
      userId: req.user.id,
      action: "TASK_CONFIRM_COLLABORATION",
      detail: `${userName} confirmed edits on collaborative task ${task.tracking_id}. ${confirmedCount}/${allCollaborators.length} collaborators confirmed.`,
      ipAddress: req.ip,
      documentId: taskId
    });

    for (const collaborator of otherCollaborators) {
      if (io) {
        io.to(`user_${collaborator.user_id}`).emit("collaboration:user_confirmed", {
          taskId,
          trackingId: task.tracking_id,
          confirmedBy: userName,
          confirmedByUserId: userId,
          allConfirmed: allConfirmed,
          confirmedCount: confirmedCount,
          totalCount: allCollaborators.length,
        });
      }

      // Persist notification
      await notify(io, {
        userId: collaborator.user_id,
        type: "collaboration_user_confirmed",
        title: "Collaborator Confirmed",
        message: `${userName} has confirmed their edits. ${allConfirmed ? "All collaborators confirmed - ready for submission!" : `${confirmedCount}/${allCollaborators.length} confirmed...`}`,
        taskId,
        trackingId: task.tracking_id,
      });
    }

    // Return the updated confirmation status
    return res.json({
      message: "Confirmation saved.",
      confirmation_status: newConfirmationStatus,
      user1_confirmed_at: updatedTask.user1_confirmed_at,
      user2_confirmed_at: updatedTask.user2_confirmed_at,
      bothConfirmed: newConfirmationStatus === "confirmed",
    });
  } catch (err) {
    console.error("POST /api/tasks/:id/confirm-collaboration error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/cancel-confirmation ──────────────────────────────────
// Cancels a faculty member's confirmation on a collaborative task.
// Sets their confirmed_at back to NULL and resets confirmation_status to 'awaiting'.
router.post("/:id/cancel-confirmation", requireAuth, async (req, res) => {
  const taskId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    // Get the task
    const [taskRows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = taskRows[0];

    // Verify user is a collaborator on this task
    const [collabCheck] = await db.query(
      "SELECT * FROM task_collaborators WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );

    if (collabCheck.length === 0) {
      return res.status(403).json({ message: "You are not a collaborator on this task." });
    }

    // Cancel the confirmation by setting confirmed_at to NULL
    await db.query(
      `UPDATE task_collaborators SET confirmed_at = NULL WHERE task_id = ? AND user_id = ?`,
      [taskId, userId]
    );

    // Reset confirmation_status to 'awaiting' since not all are confirmed now
    await db.query(
      "UPDATE tasks SET confirmation_status = 'awaiting' WHERE id = ?",
      [taskId]
    );

    // Log the cancellation action
    const userName = req.user.full_name || req.user.username;
    await writeLog({
      userId: req.user.id,
      action: "TASK_CANCEL_CONFIRMATION",
      detail: `${userName} cancelled confirmation on collaborative task ${task.tracking_id}.`,
      taskId: taskId,
      ipAddress: req.ip,
      documentId: taskId
    });

    // Notify other collaborators
    const [allCollaborators] = await db.query(
      "SELECT id, user_id FROM task_collaborators WHERE task_id = ?",
      [taskId]
    );

    for (const collaborator of allCollaborators) {
      if (collaborator.user_id !== userId && io) {
        io.to(`user_${collaborator.user_id}`).emit("collaboration:confirmation_cancelled", {
          taskId,
          trackingId: task.tracking_id,
          cancelledBy: userName,
          cancelledByUserId: userId,
        });
      }
    }

    // Notify via notification system
    for (const collaborator of allCollaborators) {
      if (collaborator.user_id !== userId) {
        await notify(io, {
          userId: collaborator.user_id,
          type: "collaboration_confirmation_cancelled",
          title: "Collaborator Cancelled Confirmation",
          message: `${userName} has cancelled their confirmation. All collaborators must confirm again before submission.`,
          taskId,
          trackingId: task.tracking_id,
        });
      }
    }

    return res.json({
      message: "Confirmation cancelled.",
      confirmation_status: "awaiting",
    });
  } catch (err) {
    console.error("POST /api/tasks/:id/cancel-confirmation error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "In Review", "For Approval", "Received", "Returned", "Draft"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status." });

  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    const canUpdate = ["admin", "program_chair"].includes(req.user.role) || 
                      task.faculty_id === req.user.id || 
                      (task.is_collaborative && task.collaborator_id === req.user.id);
    if (!canUpdate) return res.status(403).json({ message: "Access denied." });

    await db.query("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_STATUS_UPDATE", detail: `Updated task ${task.tracking_id} status to "${status}"`, ipAddress: req.ip });

    const io = req.app.get("io");
    const actorName = req.user.full_name || req.user.username;
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: status, updatedBy: actorName };
      io.to(`user_${task.faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${task.assigned_by}`).emit("task:status_changed", payload);
      if (task.is_collaborative && task.collaborator_id) {
        io.to(`user_${task.collaborator_id}`).emit("task:status_changed", payload);
      }
    }
    // Notify whichever party didn't make the change themselves.
    let notifyIds = [task.faculty_id, task.assigned_by];
    if (task.is_collaborative && task.collaborator_id) {
      notifyIds.push(task.collaborator_id);
    }
    for (const uid of new Set(notifyIds)) {
      if (!uid || uid === req.user.id) continue;
      await notify(io, {
        userId: uid,
        type: "task_status_changed",
        title: "Task Status Updated",
        message: `${actorName} changed task ${task.tracking_id} status to "${status}"`,
        taskId: task.id,
        trackingId: task.tracking_id,
      });
    }

    return res.json({ message: "Status updated.", status });
  } catch (err) {
    console.error("PATCH /api/tasks/:id/status error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/approve ────────────────────────────────────────────
router.patch("/:id/approve", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    await db.query("UPDATE tasks SET status = 'Received', updated_at = NOW() WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_APPROVE", detail: `Approved task ${rows[0].tracking_id}`, ipAddress: req.ip });

    const io = req.app.get("io");
    const actorName = req.user.full_name || req.user.username;
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: "Received", updatedBy: actorName };
      io.to(`user_${rows[0].faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${rows[0].assigned_by}`).emit("task:status_changed", payload);
    }
    for (const uid of new Set([rows[0].faculty_id, rows[0].assigned_by])) {
      if (!uid || uid === req.user.id) continue;
      await notify(io, {
        userId: uid,
        type: "task_status_changed",
        title: "Task Approved",
        message: `${actorName} approved task "${rows[0].title}" (${rows[0].tracking_id})`,
        taskId: rows[0].id,
        trackingId: rows[0].tracking_id,
      });
    }

    return res.json({ message: "Task approved." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/return ─────────────────────────────────────────────
router.patch("/:id/return", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    const instruction = req.body?.instruction || "";
    
    // For collaborative tasks, reset confirmation status so both users must confirm again
    const resetConfirmation = task.is_collaborative ? ", confirmation_status = 'awaiting', user1_confirmed_at = NULL, user2_confirmed_at = NULL" : "";
    
    await db.query(
      `UPDATE tasks SET status = 'Returned', return_reason = ?, updated_at = NOW()${resetConfirmation} WHERE id = ?`,
      [instruction || null, req.params.id]
    );
    await writeLog({ userId: req.user.id, action: "TASK_RETURN", detail: `Returned task ${task.tracking_id}`, ipAddress: req.ip });

    const io = req.app.get("io");
    const actorName = req.user.full_name || req.user.username;
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: "Returned", updatedBy: actorName };
      io.to(`user_${task.faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${task.assigned_by}`).emit("task:status_changed", payload);
      
      // For collaborative tasks, also notify the collaborator
      if (task.is_collaborative && task.collaborator_id) {
        io.to(`user_${task.collaborator_id}`).emit("task:status_changed", payload);
      }
    }
    
    for (const uid of new Set([task.faculty_id, task.assigned_by, task.is_collaborative ? task.collaborator_id : null].filter(Boolean))) {
      if (!uid || uid === req.user.id) continue;
      await notify(io, {
        userId: uid,
        type: "task_status_changed",
        title: "Task Returned",
        message: `${actorName} returned task "${task.title}" (${task.tracking_id})${task.is_collaborative ? " - confirmation required from both collaborators" : ""}`,
        taskId: task.id,
        trackingId: task.tracking_id,
      });
    }

    return res.json({ message: "Task returned." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/done ────────────────────────────────────────────────
// FIX: this used to blindly set status = 'For Approval' on any task id it
// was given, with no check on the task's current status. That meant a bulk
// "Mark Done" click after "Select All" — which selects every task in the
// feed regardless of status — would silently reset tasks that were already
// approved (status = 'Received') or archived back to "For Approval".
//
// Only tasks that are actually still in progress should ever move to
// "For Approval" here. Anything else is a no-op (reported back as
// skipped: true) instead of an error, so bulk actions can safely include a
// mix of statuses without corrupting already-approved tasks.
const DONE_ELIGIBLE_STATUSES = ["Pending", "In Review", "Returned"];

router.patch("/:id/done", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];

    if (!DONE_ELIGIBLE_STATUSES.includes(task.status)) {
      return res.json({
        message: "Skipped — task is not in a state that can be marked done.",
        status: task.status,
        skipped: true,
      });
    }

    // For collaborative tasks coming from "Returned", reset confirmation
    const resetConfirmation = task.is_collaborative ? ", confirmation_status = 'awaiting', user1_confirmed_at = NULL, user2_confirmed_at = NULL" : "";
    
    await db.query(
      `UPDATE tasks SET status = 'For Approval', updated_at = NOW()${resetConfirmation} WHERE id = ?`,
      [req.params.id]
    );
    return res.json({ message: "Marked as done." });
  } catch (err) {
    console.error("PATCH /api/tasks/:id/done error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/archive ────────────────────────────────────────────
router.patch("/:id/archive", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE tasks SET status = 'Archived', updated_at = NOW() WHERE id = ?", [req.params.id]);
    return res.json({ message: "Task archived." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/deadline ───────────────────────────────────────────
// Dedicated endpoint used by the "Change" deadline control on the
// Tasks Assigned detail panel. Frontend calls PATCH /api/tasks/:id/deadline
// with { deadline: "YYYY-MM-DD" } and reads body.error on failure.
router.patch("/:id/deadline", requireAuth, requireChairOrAdmin, async (req, res) => {
  const { deadline } = req.body;
  if (!deadline) return res.status(400).json({ error: "deadline is required." });

  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Task not found." });
    const task = rows[0];

    await db.query(
      "UPDATE tasks SET deadline = ?, updated_at = NOW() WHERE id = ?",
      [deadline, req.params.id]
    );
    await writeLog({
      userId:    req.user.id,
      action:    "TASK_DEADLINE_UPDATE",
      detail:    `Updated deadline for task ${task.tracking_id} to ${deadline}`,
      ipAddress: req.ip,
    });

    // The deadline changed, so any earlier reminders (any configured
    // stage, due-today, or overdue) no longer reflect reality — clear them
    // all so checkDeadlineReminders() is free to send fresh ones against
    // the new date on its next sweep.
    await clearDeadlineReminderRows(req.params.id);

    const io = req.app.get("io");
    const actorName = req.user.full_name || req.user.username;
    if (io) {
      const payload = { taskId: parseInt(req.params.id), deadline, updatedBy: actorName };
      io.to(`user_${task.faculty_id}`).emit("task:deadline_changed", payload);
      io.to(`user_${task.assigned_by}`).emit("task:deadline_changed", payload);
    }
    for (const uid of new Set([task.faculty_id, task.assigned_by])) {
      if (!uid || uid === req.user.id) continue;
      await notify(io, {
        userId: uid,
        type: "task_deadline_changed",
        title: "Deadline Changed",
        message: `${actorName} changed the deadline for task ${task.tracking_id} to ${formatDeadlineDisplay(deadline)}`,
        taskId: task.id,
        trackingId: task.tracking_id,
      });
    }

    return res.json({ message: "Deadline updated.", deadline });
  } catch (err) {
    console.error("PATCH /api/tasks/:id/deadline error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id — edit task details ────────────────────────────────
router.patch("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  const { title, doc_type, priority, deadline, notes, faculty_id } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });

    const task = rows[0];
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const now = new Date();

    // Track changes in changelog before updating
    const trackedFields = ["title", "doc_type", "priority", "deadline", "notes", "faculty_id"];
    const changeLog = [];

    for (const field of trackedFields) {
      const reqField = field;
      if (req.body[reqField] !== undefined && req.body[reqField] !== null) {
        const oldValue = task[field];
        const newValue = req.body[reqField];
        
        // Only log if value actually changed
        if (oldValue !== newValue) {
          changeLog.push({
            taskId,
            fieldName: field,
            oldValue: oldValue ? String(oldValue) : null,
            newValue: String(newValue),
            changedBy: userId,
            changedAt: now,
          });
        }
      }
    }

    // Update the task
    await db.query(
      `UPDATE tasks
       SET title      = COALESCE(?, title),
           doc_type   = COALESCE(?, doc_type),
           priority   = COALESCE(?, priority),
           deadline   = COALESCE(?, deadline),
           notes      = COALESCE(?, notes),
           faculty_id = COALESCE(?, faculty_id),
           updated_at = NOW()
       WHERE id = ?`,
      [title, doc_type, priority, deadline, notes, faculty_id, taskId]
    );

    // Insert changelog entries
    for (const change of changeLog) {
      await db.query(
        `INSERT INTO task_changelog (task_id, field_name, old_value, new_value, changed_by, changed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [change.taskId, change.fieldName, change.oldValue, change.newValue, change.changedBy, change.changedAt]
      );
    }

    await writeLog({ userId: req.user.id, action: "TASK_EDIT", detail: `Edited task ${task.tracking_id}`, ipAddress: req.ip });

    // If the deadline moved via this general edit endpoint too, clear any
    // stale reminders so they can re-fire for the new date — same as the
    // dedicated /:id/deadline route above.
    if (deadline) {
      await clearDeadlineReminderRows(taskId);
    }

    // Broadcast changes via WebSocket
    const io = req.app.get("io");
    if (io && changeLog.length > 0) {
      io.to(`task_${taskId}`).emit("task:fields_updated", {
        taskId,
        changes: changeLog.map(c => ({
          fieldName: c.fieldName,
          oldValue: c.oldValue,
          newValue: c.newValue,
          changedBy: userId,
          changedAt: c.changedAt,
        })),
      });
    }

    return res.json({ message: "Task updated." });
  } catch (err) {
    console.error("PATCH /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});
// [DEPRECATED: Duplicate old POST /api/tasks/:id/comments handler - replaced by new collaborative handler below]
// [DEPRECATED: Duplicate POST /api/tasks/:id/comment-upload handler - replaced by new collaborative handler below]

// ─── POST /api/tasks/:id/attachments ─────────────────────────────────────────
router.post("/:id/attachments", requireAuth, upload.array("files"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    const canAccess = ["admin", "program_chair"].includes(req.user.role) || 
                      task.faculty_id === req.user.id || 
                      task.collaborator_id === req.user.id;
    if (!canAccess) return res.status(403).json({ message: "Access denied." });

    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded." });

    const uploaded = await uploadFilesToR2(req.files);
    const fileNames = uploaded.map(f => f.originalname).join(", ");
    const attachRows = uploaded.map(f => [req.params.id, f.url, f.originalname, req.user.id, new Date()]);
    await db.query("INSERT INTO task_attachments (task_id, file_url, file_name, uploaded_by, uploaded_at) VALUES ?", [attachRows]);

    // Log the attachment upload action
    await writeLog({
      userId: req.user.id,
      action: "TASK_ATTACHMENT_UPLOADED",
      detail: `${req.user.full_name || req.user.username} uploaded ${uploaded.length} attachment(s) to task ${task.tracking_id}: ${fileNames}`,
      ipAddress: req.ip,
      documentId: req.params.id
    });

    const io = req.app.get("io");
    if (io) {
      // For collaborative tasks, notify both collaborators
      let notifyIds = [];
      if (task.is_collaborative) {
        notifyIds = [task.faculty_id, task.collaborator_id].filter(id => id !== req.user.id);
      } else {
        const notifyId = req.user.id === task.faculty_id ? task.assigned_by : task.faculty_id;
        notifyIds = notifyId ? [notifyId] : [];
      }

      // Notify all relevant parties
      for (const notifyId of notifyIds) {
        if (!notifyId) continue;
        
        io.to(`user_${notifyId}`).emit("task:attachment_added", {
          taskId: parseInt(req.params.id),
          fileName: uploaded.map(f => f.originalname).join(", "),
          uploadedBy: req.user.full_name || req.user.username,
        });

        const fileWord = uploaded.length === 1 ? "attachment" : "attachments";
        await notify(io, {
          userId: notifyId,
          type: "task_attachment_added",
          title: "New Attachment",
          message: `${req.user.full_name || req.user.username} added ${uploaded.length} ${fileWord} to task ${task.tracking_id}`,
          taskId: parseInt(req.params.id),
          trackingId: task.tracking_id,
        });
      }
    }

    // Return the saved file info so the frontend can build correct URLs
    const files = uploaded.map(f => ({
      url: f.url,
      originalname: f.originalname,
      name: f.originalname,
      key: f.key,
    }));

    return res.status(201).json({ message: "Attachments uploaded.", count: files.length, files });
  } catch (err) {
    console.error("POST /api/tasks/:id/attachments error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/submit ──────────────────────────────────────────────
// Faculty submits their completed work. Files go to task_submissions (NOT
// task_attachments), so they always render as a separate post from the task brief.
//
// Wrapped in a transaction so the status update and the file/note inserts
// either all land or none do — e.g. if a file insert fails partway through,
// the task never gets stuck at "For Approval" with only some files recorded.
// Re-uses the existing `upload` middleware (buffers in memory, uploaded to
// R2 same as every other upload route in this file) and req.app.get("io")
// for the socket instance, consistent with the rest of the router.
router.post("/:id/submit", requireAuth, upload.array("files"), async (req, res) => {
  const taskId            = parseInt(req.params.id);
  const note              = req.body.note              || null;
  const submissionGroupId = req.body.submission_group_id || `sub_${Date.now()}`;
  const submittedAt       = new Date();

  const conn = await db.getConnection();
  try {
    const [rows] = await conn.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (rows.length === 0) { conn.release(); return res.status(404).json({ message: "Task not found." }); }
    const task = rows[0];
    
    // Check if user is assigned to this task
    let canSubmit = task.faculty_id === req.user.id || task.collaborator_id === req.user.id;
    
    // For collaborative tasks, also check task_collaborators
    if (!canSubmit && task.is_collaborative) {
      const [collab] = await conn.query(
        "SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?",
        [taskId, req.user.id]
      );
      canSubmit = collab.length > 0;
    }
    
    if (!canSubmit) {
      conn.release();
      return res.status(403).json({ message: "Only the assigned faculty can submit this task." });
    }

    // For collaborative tasks, verify all collaborators have confirmed
    if (task.is_collaborative && task.confirmation_status !== "confirmed") {
      conn.release();
      return res.status(400).json({ 
        message: "All collaborators must confirm their edits before submission.",
        confirmation_status: task.confirmation_status
      });
    }

    // Upload to R2 before opening the transaction — network calls have no
    // business sitting inside a DB transaction (holds the connection/locks
    // open for however long R2 takes to respond).
    const uploaded = await uploadFilesToR2(req.files);

    await conn.beginTransaction();

    // 1. Update task status → For Approval
    await conn.query(
      "UPDATE tasks SET status = 'For Approval', updated_at = NOW() WHERE id = ?",
      [taskId]
    );

    // 2. Save each uploaded file to task_submissions
    const savedFiles = [];
    for (const file of uploaded) {
      const [result] = await conn.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, req.user.id, file.originalname, file.url, file.size, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:                  result.insertId,
        originalname:        file.originalname,
        file_name:           file.originalname,
        url:                 file.url,
        file_url:            file.url,
        size:                file.size,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:        submittedAt.toISOString(),
      });
    }

    // 3. If no files but there's a note, still record the submission event
    if (!uploaded.length) {
      const [result] = await conn.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, NULL, NULL, 0, ?, ?, ?)`,
        [taskId, req.user.id, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:                  result.insertId,
        originalname:        null,
        file_name:           null,
        url:                 null,
        file_url:            null,
        size:                0,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:        submittedAt.toISOString(),
        _noteOnly:           true,
      });
    }

    await conn.commit();

    await writeLog({
      userId:    req.user.id,
      action:    "TASK_SUBMIT",
      detail:    `Submitted task ${task.tracking_id} with ${savedFiles.length} file(s)`,
      ipAddress: req.ip,
    });

    // Notify every program chair / admin — not just whoever originally
    // assigned this task — so a submission is always seen by the people who
    // need to review/approve it, even if the assigner has since left that
    // role, gone inactive, or the task was reassigned.
    const io = req.app.get("io");
    if (io) {
      const [chairsAndAdmins] = await db.query(
        "SELECT id FROM users WHERE role IN ('admin', 'program_chair') AND is_active = 1"
      );
      // Always include the original assigner too, in case they're not
      // flagged admin/program_chair in the users table for some reason.
      const recipientIds = new Set(chairsAndAdmins.map(u => u.id));
      if (task.assigned_by) recipientIds.add(task.assigned_by);
      
      // For collaborative tasks, also notify the other collaborator
      if (task.is_collaborative && task.collaborator_id && task.collaborator_id !== req.user.id) {
        recipientIds.add(task.collaborator_id);
      }

      const submitPayload = {
        taskId,
        taskTitle:           task.title,
        facultyName:         req.user.full_name || req.user.username,
        attachmentCount:     savedFiles.filter(f => f.url).length,
        files:               savedFiles,
        submission_group_id: submissionGroupId,
      };
      const submitMessage = `${req.user.full_name || req.user.username} submitted task ${task.tracking_id}`;

      for (const recipientId of recipientIds) {
        io.to(`user_${recipientId}`).emit("task:submitted", submitPayload);
        await notify(io, {
          userId: recipientId,
          type: "task_submitted",
          title: "Task Submitted",
          message: submitMessage,
          taskId,
          trackingId: task.tracking_id,
        });
      }
    }

    return res.status(201).json({ success: true, files: savedFiles });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    console.error("POST /api/tasks/:id/submit error:", err);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    conn.release();
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });

    const [attachments] = await db.query("SELECT * FROM task_attachments WHERE task_id = ?", [req.params.id]);
    await Promise.all(
      attachments.map(async (a) => {
        const key = r2KeyFromUrl(a.file_url);
        if (!key) return;
        try {
          await deleteFromR2(key);
        } catch (err) {
          // Don't let a missing/already-deleted R2 object block the task delete
          console.error(`Failed to delete R2 object ${key}:`, err.message);
        }
      })
    );

    await db.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_DELETE", detail: `Deleted task "${rows[0].title}" (${rows[0].tracking_id})`, ipAddress: req.ip });
    return res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/archived-by-me ───────────────────────────────────────────
// Returns tasks the current user has personally archived (per-user, not global)
router.get("/archived-by-me", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, uta.archived_at,
              u.full_name AS faculty_name, u.email AS faculty_email
       FROM user_task_archives uta
       JOIN tasks t ON t.id = uta.task_id
       LEFT JOIN users u ON u.id = t.faculty_id
       WHERE uta.user_id = ?
       ORDER BY uta.archived_at DESC`,
      [req.user.id]
    );
    return res.json({ tasks: rows });
  } catch (err) {
    console.error("GET /tasks/archived-by-me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/archive-for-me ──────────────────────────────────────
// Archives a task only for the current user — does NOT change the task status
router.post("/:id/archive-for-me", requireAuth, async (req, res) => {
  try {
    const [tasks] = await db.query("SELECT id FROM tasks WHERE id = ?", [req.params.id]);
    if (!tasks.length) return res.status(404).json({ message: "Task not found." });
    await db.query(
      `INSERT IGNORE INTO user_task_archives (user_id, task_id) VALUES (?, ?)`,
      [req.user.id, req.params.id]
    );
    return res.json({ message: "Task archived for you." });
  } catch (err) {
    console.error("POST /tasks/:id/archive-for-me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/tasks/:id/archive-for-me ────────────────────────────────────
// Removes the per-user archive entry (restores to normal view for this user)
router.delete("/:id/archive-for-me", requireAuth, async (req, res) => {
  try {
    await db.query(
      "DELETE FROM user_task_archives WHERE user_id = ? AND task_id = ?",
      [req.user.id, req.params.id]
    );
    return res.json({ message: "Task unarchived for you." });
  } catch (err) {
    console.error("DELETE /tasks/:id/archive-for-me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ──────────────── COLLABORATIVE FEATURES: Comments, Changelog ───────────────
// ─────────────────────────────────────────────────────────────────────────────

// ─── POST /api/tasks/:id/comments ────────────────────────────────────────────
// Add a comment to a task's discussion thread with optional file attachments and threading
router.post("/:id/comments", requireAuth, upload.array("files", 5), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { content, parentCommentId } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    // Verify user is a collaborator on this task (not just task creator)
    const [collabRows] = await db.query(
      `SELECT tc.id FROM task_collaborators tc
       WHERE tc.task_id = ? AND tc.user_id = ?`,
      [taskId, userId]
    );

    if (collabRows.length === 0) {
      return res.status(403).json({ message: "Only collaborators can post comments." });
    }

    // If replying to a comment, verify it exists
    let parentId = null;
    if (parentCommentId) {
      const [parentRows] = await db.query(
        "SELECT id FROM task_comments WHERE id = ? AND task_id = ?",
        [parseInt(parentCommentId), taskId]
      );
      if (parentRows.length === 0) {
        return res.status(404).json({ message: "Parent comment not found." });
      }
      parentId = parseInt(parentCommentId);
    }

    // Collect file metadata for immediate response (without R2 upload)
    let pendingFiles = [];
    const fileUploadPromises = [];
    const now = new Date();

    if (req.files && req.files.length > 0) {
      pendingFiles = req.files.map((f, idx) => ({
        name: f.originalname || f.name,
        size: f.size,
        key: `pending_${Date.now()}_${idx}`, // Temp key until R2 upload completes
      }));

      // Start R2 uploads in background (don't await)
      fileUploadPromises.push(
        uploadFilesToR2(req.files)
          .then(async (uploaded) => {
            // Update comment with real R2 keys (not URLs) for proxying
            const updatedFiles = uploaded.map(f => ({
              name: f.originalname || f.name,
              key: f.key, // Store the R2 key instead of URL
              size: f.size
            }));
            const filesJson = JSON.stringify(updatedFiles);
            
            await db.query(
              "UPDATE task_comments SET files = ? WHERE id = ?",
              [filesJson, commentId]
            );

            // Broadcast updated comment with keys (not URLs)
            const [updatedRows] = await db.query(
              `SELECT tc.id, tc.task_id, tc.sender_id, tc.parent_comment_id, tc.content, tc.files, tc.created_at,
                      u.full_name, u.email
               FROM task_comments tc
               JOIN users u ON u.id = tc.sender_id
               WHERE tc.id = ?`,
              [commentId]
            );

            if (updatedRows.length > 0) {
              const updatedComment = updatedRows[0];
              let parsedFiles = [];
              try {
                if (updatedComment.files) {
                  parsedFiles = typeof updatedComment.files === 'string' 
                    ? JSON.parse(updatedComment.files) 
                    : updatedComment.files;
                }
              } catch (e) {
                console.error(`Failed to parse files for comment ${commentId}:`, e.message);
              }

              console.log(`[File Proxy] Updated files for comment ${commentId}:`, JSON.stringify(parsedFiles));

              const updatedObj = {
                id: updatedComment.id,
                taskId: updatedComment.task_id,
                userId: updatedComment.sender_id,
                userName: updatedComment.full_name,
                userEmail: updatedComment.email,
                userRole: "Faculty lead",
                parentCommentId: updatedComment.parent_comment_id,
                content: updatedComment.content,
                files: parsedFiles,
                createdAt: updatedComment.created_at,
              };

              const io = req.app.get("io");
              if (io) {
                console.log(`[POST /tasks/:id/comments] Broadcasting file update to task_${taskId} with files:`, JSON.stringify(parsedFiles));
                io.to(`task_${taskId}`).emit("task:comment_updated", {
                  taskId,
                  commentId,
                  comment: updatedObj,
                });
              }
            }
          })
          .catch((err) => {
            console.error(`Failed to upload files for comment ${commentId}:`, err.message);
          })
      );
    }

    // Insert comment immediately with pending files (no R2 URLs yet)
    const filesJson = pendingFiles.length > 0 ? JSON.stringify(pendingFiles) : null;
    
    const [result] = await db.query(
      `INSERT INTO task_comments (task_id, sender_id, parent_comment_id, content, files, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, userId, parentId, content.trim(), filesJson, now]
    );

    const commentId = result.insertId;

    // Fetch the newly created comment with user info
    const [comments] = await db.query(
      `SELECT tc.id, tc.task_id, tc.sender_id, tc.parent_comment_id, tc.content, tc.files, tc.created_at, 
              u.full_name, u.email
       FROM task_comments tc
       JOIN users u ON u.id = tc.sender_id
       WHERE tc.id = ?`,
      [commentId]
    );

    const comment = comments[0];
    const commentObj = {
      id: comment.id,
      taskId: comment.task_id,
      userId: comment.sender_id,
      userName: comment.full_name,
      userEmail: comment.email,
      userRole: "Faculty lead",
      parentCommentId: comment.parent_comment_id,
      content: comment.content,
      files: pendingFiles, // Show pending files immediately
      createdAt: comment.created_at,
    };

    // Broadcast immediately with pending files (before R2 upload completes)
    const io = req.app.get("io");
    if (io) {
      console.log(`[POST /tasks/:id/comments] Broadcasting task:comment_added to task_${taskId} (files uploading in background)`);
      io.to(`task_${taskId}`).emit("task:comment_added", {
        taskId,
        comment: commentObj,
      });
      console.log(`[POST /tasks/:id/comments] Broadcast sent for taskId=${taskId}, commentId=${commentId}`);
    } else {
      console.error(`[POST /tasks/:id/comments] Socket.io instance not found!`);
    }

    // Track in changelog with file information
    const changelogDetail = {
      comment_id: commentId,
      author: comment.full_name,
      type: parentId ? 'reply' : 'comment',
      content_preview: content.trim().substring(0, 100) + (content.trim().length > 100 ? '...' : ''),
      files: pendingFiles,
      files_count: pendingFiles.length,
      is_reply: !!parentId,
      parent_comment_id: parentId
    };
    
    await db.query(
      `INSERT INTO task_changelog (task_id, field_name, new_value, changed_by, changed_at)
       VALUES (?, ?, ?, ?, ?)`,
      [taskId, 'collaboration_comment', JSON.stringify(changelogDetail), userId, now]
    );

    // Don't await R2 uploads — let them happen in background
    // Fire and forget to keep response fast
    Promise.all(fileUploadPromises).catch(err => 
      console.error(`Background file upload failed:`, err.message)
    );

    return res.json(commentObj);
  } catch (err) {
    console.error("POST /api/tasks/:id/comments error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/:id/comments ────────────────────────────────────────────
// Fetch comments for a task with threading support
router.get("/:id/comments", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    console.log(`[GET /tasks/:id/comments] taskId=${taskId}, userId=${userId}`);

    // Verify task exists
    const [taskRows] = await db.query(
      `SELECT id, is_collaborative FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (taskRows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const task = taskRows[0];

    // If it's a collaborative task, verify user is a collaborator
    if (task.is_collaborative) {
      const [collabRows] = await db.query(
        `SELECT tc.id FROM task_collaborators tc
         WHERE tc.task_id = ? AND tc.user_id = ?`,
        [taskId, userId]
      );

      if (collabRows.length === 0) {
        console.log(`[GET /tasks/:id/comments] User ${userId} is not a collaborator on task ${taskId}`);
        return res.status(403).json({ message: "Only collaborators can view comments." });
      }
    }

    // Fetch all top-level comments with their replies
    const [allComments] = await db.query(
      `SELECT tc.id, tc.task_id, tc.sender_id, tc.parent_comment_id, tc.content, tc.files, tc.created_at, 
              u.full_name, u.email
       FROM task_comments tc
       JOIN users u ON u.id = tc.sender_id
       WHERE tc.task_id = ?
       ORDER BY COALESCE(tc.parent_comment_id, tc.id) ASC, tc.created_at ASC`,
      [taskId]
    );

    console.log(`[GET /tasks/:id/comments] Fetched ${allComments.length} comments for task ${taskId}`);

    // Build nested structure
    const commentMap = new Map();
    const topLevel = [];

    allComments.forEach(comment => {
      let parsedFiles = [];
      try {
        if (comment.files) {
          // Check if files is already an object or a string
          if (typeof comment.files === 'string') {
            parsedFiles = JSON.parse(comment.files);
          } else if (typeof comment.files === 'object') {
            parsedFiles = comment.files;
          }
        }
      } catch (e) {
        console.error(`Failed to parse files for comment ${comment.id}:`, e.message, comment.files);
        parsedFiles = [];
      }

      const commentObj = {
        id: comment.id,
        taskId: comment.task_id,
        userId: comment.sender_id,
        userName: comment.full_name,
        userEmail: comment.email,
        userRole: "Faculty lead",
        parentCommentId: comment.parent_comment_id,
        content: comment.content,
        files: parsedFiles,
        createdAt: comment.created_at,
        replies: []
      };

      commentMap.set(comment.id, commentObj);

      if (!comment.parent_comment_id) {
        // Top-level comment
        topLevel.push(commentObj);
      } else {
        // Reply to another comment
        const parent = commentMap.get(comment.parent_comment_id);
        if (parent) {
          parent.replies.push(commentObj);
        }
      }
    });

    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM task_comments WHERE task_id = ?",
      [taskId]
    );

    return res.json({
      comments: topLevel,
      total: countRows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("GET /api/tasks/:id/comments error:", err.message, err.stack);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

// ─── DELETE /api/comments/:id ───────────────────────────────────────────────
// Delete a comment (only by author or admin) - also deletes all child replies
router.delete("/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = req.user.id;

    const [comments] = await db.query(
      `SELECT tc.id, tc.task_id, tc.sender_id, u.full_name
       FROM task_comments tc
       JOIN users u ON u.id = tc.sender_id
       WHERE tc.id = ?`,
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const comment = comments[0];

    // Only allow deletion by comment author or admins
    if (comment.sender_id !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own comments." });
    }

    // Delete the comment and all its replies (cascading delete via FK)
    await db.query("DELETE FROM task_comments WHERE id = ? OR parent_comment_id = ?", [commentId, commentId]);

    // Broadcast deletion via WebSocket
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${comment.task_id}`).emit("task:comment_deleted", {
        commentId,
        taskId: comment.task_id,
      });
    }

    return res.json({ message: "Comment and replies deleted." });
  } catch (err) {
    console.error("DELETE /api/comments/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/:id/changelog ───────────────────────────────────────────
// Fetch change history for a task with pagination
router.get("/:id/changelog", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    console.log(`[GET /changelog] taskId=${taskId}, userId=${userId}`);

    // Verify access - only collaborators can view changelog
    const [taskRows] = await db.query(
      `SELECT t.id FROM tasks t
       WHERE t.id = ? AND t.id IN (SELECT task_id FROM task_collaborators WHERE user_id = ?)`,
      [taskId, userId]
    );

    console.log(`[GET /changelog] Access check result: ${taskRows.length} rows`);
    if (taskRows.length === 0) {
      const [debugRows] = await db.query(
        `SELECT user_id FROM task_collaborators WHERE task_id = ?`,
        [taskId]
      );
      console.log(`[GET /changelog] User ${userId} is NOT a collaborator. Task ${taskId} collaborators: ${debugRows.map(r => r.user_id).join(',')}`);
      return res.status(403).json({ message: "Only collaborators can view the collaboration discussion." });
    }

    const [changes] = await db.query(
      `SELECT tc.id, tc.task_id, tc.field_name, tc.old_value, tc.new_value, tc.changed_by, tc.changed_at, u.full_name
       FROM task_changelog tc
       JOIN users u ON u.id = tc.changed_by
       WHERE tc.task_id = ?
       ORDER BY tc.changed_at DESC
       LIMIT ? OFFSET ?`,
      [taskId, limit, offset]
    );

    const [countRows] = await db.query(
      "SELECT COUNT(*) AS total FROM task_changelog WHERE task_id = ?",
      [taskId]
    );

    return res.json({
      changes: changes.map(c => ({
        id: c.id,
        taskId: c.task_id,
        fieldName: c.field_name,
        oldValue: c.old_value,
        newValue: c.new_value,
        changedBy: c.changed_by,
        changedByName: c.full_name,
        changedAt: c.changed_at,
      })),
      total: countRows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    console.error("GET /api/tasks/:id/changelog error:", err.message, err.stack);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/:id/collaborators ───────────────────────────────────────
// Fetch list of collaborators with confirmation status
router.get("/:id/collaborators", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log(`[GET /collaborators] taskId=${taskId}, userId=${userId}`);

    // Verify access - allow if user is a collaborator OR is the task creator (for oversight)
    const [taskRows] = await db.query(
      `SELECT t.id, t.faculty_id, t.collaborator_id, t.is_collaborative, t.assigned_by
       FROM tasks t
       WHERE t.id = ? AND (
         t.assigned_by = ? OR
         t.id IN (SELECT task_id FROM task_collaborators WHERE user_id = ?)
       )`,
      [taskId, userId, userId]
    );

    console.log(`[GET /collaborators] Access check result: ${taskRows.length} rows`);
    if (taskRows.length === 0) {
      const [debugRows] = await db.query(
        `SELECT user_id FROM task_collaborators WHERE task_id = ?`,
        [taskId]
      );
      console.log(`[GET /collaborators] User ${userId} is NOT authorized. Task ${taskId} collaborators: ${debugRows.map(r => r.user_id).join(',')}`);
      return res.status(403).json({ message: "You don't have access to this information." });
    }

    const task = taskRows[0];
    const collaborators = [];

    // Add primary faculty
    if (task.faculty_id) {
      const [facultyRows] = await db.query(
        "SELECT id, full_name, email FROM users WHERE id = ?",
        [task.faculty_id]
      );
      if (facultyRows.length > 0) {
        const user = facultyRows[0];
        collaborators.push({
          userId: user.id,
          fullName: user.full_name,
          email: user.email,
          role: "primary",
          confirmedAt: null,
        });
      }
    }

    // Add secondary faculty (if any)
    if (task.collaborator_id) {
      const [facultyRows] = await db.query(
        "SELECT id, full_name, email FROM users WHERE id = ?",
        [task.collaborator_id]
      );
      if (facultyRows.length > 0) {
        const user = facultyRows[0];
        collaborators.push({
          userId: user.id,
          fullName: user.full_name,
          email: user.email,
          role: "secondary",
          confirmedAt: null,
        });
      }
    }

    // Add multi-collaborators from task_collaborators table
    if (task.is_collaborative) {
      const [multisRows] = await db.query(
        `SELECT tc.user_id, tc.confirmed_at, u.full_name, u.email
         FROM task_collaborators tc
         JOIN users u ON u.id = tc.user_id
         WHERE tc.task_id = ?`,
        [taskId]
      );

      multisRows.forEach(row => {
        collaborators.push({
          userId: row.user_id,
          fullName: row.full_name,
          email: row.email,
          role: "collaborator",
          confirmedAt: row.confirmed_at,
        });
      });
    }

    return res.json({ collaborators });
  } catch (err) {
    console.error("GET /api/tasks/:id/collaborators error:", err.message, err.stack);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = { router, setupTypingEvents, startDeadlineReminderJob };