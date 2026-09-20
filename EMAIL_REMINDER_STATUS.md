# Email Reminder System Status Report

**Status:** ✅ **IMPLEMENTED & ACTIVE**

---

## Overview

The system has a **comprehensive automated email reminder system** for task deadlines. It runs on a scheduled cron job that checks for:
1. **Deadline Reminders** - Tasks approaching their deadline
2. **Breach Alerts** - Tasks that have missed their deadline

---

## Current Implementation

### 1. Cron Job Configuration
**File:** `server/cron/slaCron.js`

**Schedule:** Every 5 minutes (TESTING MODE)
```javascript
cron.schedule("*/5 * * * *", async () => {
  await runReminders();    // Check for approaching deadlines
  await runBreaches();     // Check for overdue tasks
});
```

⚠️ **NOTE:** Currently running every 5 minutes for testing. Should be changed to hourly (`0 * * * *`) for production.

### 2. Email Types

#### **REMINDER EMAILS** (Deadline Approaching)
- **Trigger:** When deadline is within the SLA rule's `reminder_lead_hours`
- **Urgency Tier:**
  - `critical` - Within 24 hours of deadline
  - `warning` - More than 24 hours away
- **Recipients:** Assigned faculty member
- **Sent:** Once per task (idempotent)
- **Info Included:**
  - Task title and type
  - Due date
  - SLA progress bar
  - "Review Task" action button

**Example:**
```
Subject: SLA Reminder: "Program Review" due 2026-09-25
Message: Task "Program Review" (Faculty Review) is due on 2026-09-25. 
Please review before the deadline.
```

#### **BREACH EMAILS** (Deadline Missed)
- **Trigger:** When deadline has passed and task not yet completed
- **Urgency Tier:** `critical` (always)
- **Recipients:** Assigned faculty member
- **Sent:** Once per task (idempotent)
- **Info Included:**
  - Task title and type
  - Missed deadline
  - SLA progress bar (shows as 100% elapsed)
  - "Escalate" action button

**Example:**
```
Subject: SLA Breach: "Program Review" overdue
Message: Task "Program Review" (Faculty Review) missed its deadline of 2026-09-25.
```

### 3. Email Trigger Rules

Tasks are included if:
- ✅ Status is NOT "Completed", "Released", or "Approved"
- ✅ Has an associated SLA rule (matched by document_type)
- ✅ SLA rule status is "Active"
- ✅ Assigned faculty member has an email address
- ✅ Email not already sent for this alert type

Prevents duplicate emails using database UNIQUE KEY:
```sql
UNIQUE KEY uniq_task_alert(task_id, alert_type)
```

### 4. SLA Rule Configuration

Rules are configured in `sla_rules` table with:
- `reminder_lead_hours` - How many hours before deadline to send reminder
- `document_type` - Which task types this rule applies to
- `turnaround_hours` - How long task should take (computes deadline)
- `escalation_hours` - How long until escalation after deadline missed

Editable via: **SLA Configuration → Escalation Settings**

---

## Integration Points

### Where It's Started
**File:** `server/index.js` (Line 364)
```javascript
const { startSlaCron } = require("./cron/slaCron");
startSlaCron();  // Starts automatically when server boots
```

### Email Service Used
**File:** `server/services/slaEmailService.js`
```javascript
const { sendSlaAlertEmail } = require("../services/slaEmailService");
```

Handles:
- Email template rendering
- Recipient list building
- Escalation recipient lookup
- Email sending via configured SMTP

### Database Tables Involved
1. **tasks** - Task details, deadline, status
2. **sla_rules** - SLA rules per document type
3. **sla_alerts** - Tracks sent alerts (prevents duplicates)
4. **sla_recipients** - Escalation email recipients
5. **users** - Faculty email addresses

---

## How It Works (Step-by-Step)

### Reminder Flow
```
1. Cron job runs every 5 minutes
   ↓
2. Query: Find tasks with deadline within SLA rule's reminder_lead_hours
   ↓
3. For each matching task:
   - Calculate urgency tier (critical if <24 hours)
   - Create sla_alert record (if not duplicate)
   - Send email to faculty + escalation recipients
   ↓
4. Log result: "reminder sent" or "already alerted"
```

### Breach Flow
```
1. Cron job runs every 5 minutes
   ↓
2. Query: Find tasks with deadline in the PAST that aren't done
   ↓
3. For each matching task:
   - Create sla_alert record (if not duplicate)
   - Send email with "critical" urgency
   - "Escalate" button included
   ↓
4. Log result: "breach alert sent" or "already alerted"
```

---

## Example Query Output

The system finds tasks like this:

```sql
SELECT 
  t.id AS task_id,
  t.title,
  t.deadline,
  t.doc_type,
  r.reminder_lead_hours,
  u.email AS faculty_email
FROM tasks t
JOIN sla_rules r ON r.document_type = t.doc_type AND r.status = 'Active'
LEFT JOIN users u ON u.id = t.faculty_id
WHERE t.status NOT IN ('Completed', 'Released', 'Approved')
  AND t.deadline >= CURDATE()
  AND DATEDIFF(t.deadline, CURDATE()) <= CEIL(r.reminder_lead_hours / 24)
  AND NOT EXISTS (
    SELECT 1 FROM sla_alerts a
    WHERE a.task_id = t.id AND a.alert_type = 'reminder' AND a.emailed = 1
  )
```

---

## Testing Mode

Currently in **TESTING MODE** - runs every 5 minutes instead of hourly.

**To verify it's working:**

1. Check server logs for:
   ```
   [slaCron] scheduled: every 5 minutes (TESTING — switch to hourly before production)
   [slaCron] reminder sent — task 123
   [slaCron] breach alert sent — task 456
   ```

2. Run test script (one-time):
   ```bash
   node server/testSlaCron.js
   ```
   Shows which tasks would be flagged without sending emails.

3. Manually trigger:
   ```javascript
   const { runReminders, runBreaches } = require('./cron/slaCron');
   await runReminders();  // Check for approaching deadlines
   await runBreaches();   // Check for overdue tasks
   ```

---

## Before Production

**⚠️ MUST CHANGE:**

```javascript
// Current (TESTING):
cron.schedule("*/5 * * * *", async () => {  // Every 5 minutes

// Should be (PRODUCTION):
cron.schedule("0 * * * *", async () => {    // Every hour on the hour
```

**File to change:** `server/cron/slaCron.js` (Line 135)

---

## Troubleshooting

### Emails Not Sending

**Check:**
1. ✅ Server logs show `[slaCron]` messages
2. ✅ SLA rules exist and are "Active"
3. ✅ Tasks have deadlines set
4. ✅ Faculty members have email addresses in `users.email`
5. ✅ Email service credentials configured in `.env`
6. ✅ Task status is NOT completed/released/approved
7. ✅ No previous alert already sent (check `sla_alerts` table)

### Double-Sending

**Prevented by:** UNIQUE KEY on `(task_id, alert_type)` in `sla_alerts` table

If duplicate attempts occur, the second is silently skipped with log:
```
[slaCron] reminder skipped (already alerted) — task 123
```

---

## Email Template Features

The email includes:
- Task card with title, type, deadline
- Progress bar showing time until/past deadline
- Color-coded urgency (warning = yellow, critical = red)
- Action buttons ("Review Task" or "Escalate")
- Responsive HTML design

---

## Summary

| Aspect | Status |
|--------|--------|
| **System Status** | ✅ Implemented |
| **Active** | ✅ Running |
| **Schedule** | ✅ Every 5 min (testing) |
| **Reminder Emails** | ✅ Working |
| **Overdue Emails** | ✅ Working |
| **Duplicate Prevention** | ✅ Idempotent |
| **Production Ready** | ⚠️ Change to hourly schedule |

**Last Verified:** Current codebase  
**Next Action:** Change cron schedule from 5-minute testing to hourly for production
