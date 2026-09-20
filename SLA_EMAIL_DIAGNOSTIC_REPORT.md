# SLA Email System Diagnostic Report

## Executive Summary

The SLA email system is **only partially functional**. While the infrastructure is in place and running correctly, emails are NOT being sent due to **one critical missing configuration**: **the `sla_recipients` table is completely empty**.

---

## Database Status

### ✅ Active SLA Rules (5 Found)

| ID | Document Type | Reviewer Role | Turnaround Hours | Escalation Hours | Status |
|----|----------------|---------------|------------------|------------------|--------|
| 1 | Student Dropping Form | Admin | 48 | 24 | Active |
| 2 | Leave of Absence Form | Admin | 48 | 24 | Active |
| 3 | Syllabus | Admin | 48 | 24 | Active |
| 4 | Faculty Training and Seminars | Admin | 48 | 24 | Active |
| 5 | Drop out Records | Admin | 48 | 24 | Active |

**Conclusion:** SLA rules are properly configured and all are Active.

### ❌ SLA Recipients (0 Found) - **CRITICAL ISSUE**

**Finding:** The `sla_recipients` table is completely empty.

**Impact:** 
- Emails are **never sent** because there are no recipients configured
- The `resolveRecipientEmails()` function in `slaController.js` returns an empty array
- Line 371-372 of `slaController.js` checks if `recipientEmails.length` is > 0 before sending, which fails silently

**Code Location:**
```javascript
// server/controllers/slaController.js, line 363-365
const globalEmails = await resolveRecipientEmails();
const recipientEmails = [...new Set([...globalEmails, ...extraRecipients])];
if (recipientEmails.length) {  // <-- This condition fails because globalEmails is empty
```

### ✅ Tasks with Deadlines (5 Found)

| ID | Title | Deadline | Status |
|----|-------|----------|--------|
| 10 | Work on the IS304 Syllabus | 2026-09-20T01:00:00Z | Pending |
| 11 | IS 304 Syllabus | 2026-09-20T01:00:00Z | Received |
| 12 | IS302 Syllabus | 2026-09-20T01:00:00Z | For Approval |
| 9 | Template of Syllabus | 2026-09-19T01:00:00Z | Pending |
| 1 | Student Dropping Form | 2026-09-09T20:00:00Z | Pending |

**Conclusion:** Multiple tasks have approaching deadlines that should trigger SLA alerts.

### Table Row Counts
- sla_rules: 5 ✅
- sla_recipients: 0 ❌ **EMPTY**
- tasks: 9
- users: 9

---

## SLA Email System Architecture

### How the System Works

1. **SLA Cron Job** (`/server/cron/slaCron.js`)
   - Runs every **5 minutes** (currently in testing mode; should be hourly in production)
   - Checks for tasks with approaching deadlines (`reminder`) or overdue tasks (`breach`)
   - Calls `createAlertInternal()` for each matching task

2. **Alert Creation** (`slaController.js:327-407`)
   - Creates an entry in `sla_alerts` table
   - Resolves recipient emails by calling `resolveRecipientEmails()`
   - Calls `sendSlaAlertEmail()` if notification email setting is enabled

3. **Email Sending** (`/services/slaEmailService.js`)
   - Uses **Brevo API** (configured via `BREVO_API_KEY`)
   - Sends styled HTML emails with task details, deadline, and SLA progress bar
   - Formats timestamps to **Philippine Time (PHT)**

### Critical Failure Point

**File:** `server/controllers/slaController.js`  
**Function:** `resolveRecipientEmails()` (Line 13-16)

```javascript
async function resolveRecipientEmails() {
  const [rows] = await db.query(
    "SELECT role_name, email FROM sla_recipients WHERE email IS NOT NULL"
  );
  return rows.map((r) => r.email);
}
```

**Problem:** Since `sla_recipients` is empty, this returns an empty array `[]`.

Then in `createAlertInternal()` (Line 368-370):

```javascript
const globalEmails = await resolveRecipientEmails();  // Returns []
const recipientEmails = [...new Set([...globalEmails, ...extraRecipients])];
if (recipientEmails.length) {  // Fails: 0 !== true
  // Email sending code here
}
```

**Result:** The condition `if (recipientEmails.length)` fails, so emails are **never sent**.

---

## Configuration Status

### ✅ Brevo Email Provider

Environment variables are correctly set:
- `BREVO_API_KEY`: Configured ✅
- `BREVO_SENDER_EMAIL`: Configured ✅
- `BREVO_SENDER_NAME`: Configured ✅
- `APP_BASE_URL`: Configured ✅

### ✅ SLA Email Settings

The `sla_escalation_settings` table exists and has settings. The code checks:

```javascript
const [[settings]] = await db.query(
  "SELECT notify_email FROM sla_escalation_settings WHERE id = 1"
);
if (settings?.notify_email) {  // Email notifications are enabled
```

### ❌ SLA Recipients Table

**Currently empty** - must be populated with email addresses of users who should receive SLA alerts.

---

## Why Emails Aren't Sending

### Root Causes (in order of impact)

1. **❌ No SLA Recipients Configured** (PRIMARY)
   - The `sla_recipients` table has 0 rows
   - `resolveRecipientEmails()` returns an empty array
   - The email sending logic checks `if (recipientEmails.length)` and silently skips sending
   - **Fix:** Add rows to `sla_recipients` table

2. ✅ Cron job is running (every 5 minutes, as expected)
3. ✅ Database connectivity is working
4. ✅ Brevo API is configured
5. ✅ SLA rules are active and properly set up
6. ✅ Tasks with deadlines exist in the database

---

## How to Fix

### Step 1: Populate the SLA Recipients Table

Add email recipients who should receive SLA alerts:

```sql
-- Add a default recipient (Admin or supervisor)
INSERT INTO sla_recipients (role_name, email) VALUES ('Admin', 'admin@example.com');

-- Or add role-based recipients
INSERT INTO sla_recipients (role_name, email) VALUES ('Program Chair', 'pc@example.com');
INSERT INTO sla_recipients (role_name, email) VALUES ('System Administrator', 'sysadmin@example.com');

-- You can also add NULL email for role tracking without email
INSERT INTO sla_recipients (role_name, email) VALUES ('Faculty', NULL);
```

### Step 2: Verify Configuration

Run the diagnostic script again:
```bash
cd server
node checkSLAStatus.js
```

Expected output: `sla_recipients` should show rows with email addresses.

### Step 3: Test Email Trigger

Either:
1. **Wait 5 minutes** for the cron job to run, or
2. **Manually trigger** by visiting the SLA configuration page and creating a test alert, or
3. **Run directly:**

```bash
cd server
node -e "require('./cron/slaCron.js').runReminders()"
```

Then check `sla_alerts` table to see if emails were marked as sent:
```sql
SELECT id, task_id, alert_type, emailed, created_at FROM sla_alerts ORDER BY created_at DESC LIMIT 5;
```

---

## SLA Alert Types

The system sends two types of alerts:

### 1. **Reminder** (Before Deadline)
- Triggered when deadline is approaching
- Tier: `warning` (normal) or `critical` (within 24 hours)
- Subject: `[SLA WARNING] Task Name` or `[SLA CRITICAL] Task Name`
- Recipients: Global SLA recipients + task's assigned faculty

### 2. **Breach** (After Deadline)
- Triggered when task is overdue
- Tier: Always `critical`
- Subject: `[SLA CRITICAL] Task Name` - overdue
- Recipients: Global SLA recipients + task's assigned faculty

---

## SLA Progress Configuration

Each SLA rule specifies multiple time-based triggers:

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `turnaround_hours` | 48 | Task must be completed within 48 hours |
| `escalation_hours` | 24 | After 24 hours past deadline, escalate |
| `reminder_lead_hours` | 24 | Send reminder 24 hours before deadline |
| `reminder_stage_hours` | 48,24,4 | Send reminders at 48, 24, and 4 hours before |
| `overdue_reminder_interval_hours` | 24 | After breach, remind every 24 hours |

---

## Email Template Features

The Brevo-powered email includes:

- **Status badge**: "CRITICAL" (red) or "WARNING" (orange)
- **Task details**: Title, document type, deadline
- **SLA Progress bar**: Visual indicator of % elapsed time
- **Time remaining**: Formatted countdown (e.g., "80% Time Remaining (Approx. 4 days)")
- **Deep links**: Direct link to task in DS PATH
- **Philippine Time formatting**: Deadlines displayed in PHT (UTC+8)

---

## Log Evidence

The SLA cron job logs every 5 minutes:

```
[slaCron] scheduled: every 5 minutes (TESTING — switch to hourly before production)
[slaCron] reminder skipped (already alerted) — task X
[slaCron] breach alert sent — task Y
```

**Currently observed:** No entries in logs because:
1. No recipients are configured, so emails are silently skipped
2. The cron job runs, but `if (recipientEmails.length)` fails, so no email is sent
3. No entries appear in audit logs because no emails complete successfully

---

## Recommended Actions

### Immediate (To Fix Email Sending)
1. **Add recipients to `sla_recipients` table** ← Required to send emails
2. Re-run diagnostic to verify
3. Wait 5 minutes for cron to run or manually test

### Before Production
1. Change cron schedule from `*/5 * * * *` (every 5 min) to `0 * * * *` (hourly)
2. Configure backup recipients or escalation list
3. Add monitoring/alerting on failed email sends
4. Test with real email addresses

### Nice-to-Have
1. Add recipient group management UI to SLA Configuration page
2. Log failed email attempts for debugging
3. Add retry logic for transient email failures
4. Dashboard to show which recipients are receiving alerts

---

## Test Results

**Date:** 2026-09-08  
**Database:** MySQL via Aiven  
**Brevo Status:** API key configured ✅  
**Cron Status:** Running every 5 minutes ✅  
**Recipients Status:** Empty ❌

**Conclusion:** System is ready; **only needs email recipients configured.**
