# SLA Email System - Fix Instructions

## Problem Summary

**Emails are not being sent because the `sla_recipients` table is empty.**

The system cannot send SLA alerts without knowing who to send them to. The cron job runs every 5 minutes and attempts to create alerts, but silently fails at the recipient resolution step.

---

## Root Cause Analysis

### Code Flow

1. **Cron job triggers** (`/server/cron/slaCron.js`)
   ```javascript
   // Every 5 minutes:
   await runReminders();  // Checks for approaching deadlines
   await runBreaches();   // Checks for overdue tasks
   ```

2. **Alert creation is attempted** (`/server/controllers/slaController.js`)
   ```javascript
   const result = await createAlertInternal({...});
   ```

3. **Recipients are resolved** (Line 363)
   ```javascript
   const globalEmails = await resolveRecipientEmails();
   // This queries: SELECT role_name, email FROM sla_recipients WHERE email IS NOT NULL
   // Result: [] (empty array)
   ```

4. **Email send is skipped** (Line 369)
   ```javascript
   if (recipientEmails.length) {  // Evaluates to: if (0) — FALSE
     // Email sending code here
   }
   // Falls through without sending
   ```

5. **No error is raised** - the system silently continues
   - No email is sent ✗
   - No alert is marked as `emailed = 1` ✗
   - No error in logs ✗

---

## Solution: Add SLA Recipients

### Option 1: Single Global Administrator (Simplest)

```sql
INSERT INTO sla_recipients (role_name, email) VALUES ('Administrator', 'admin@your-domain.com');
```

This sends all SLA alerts to one email address. **Recommended for testing.**

### Option 2: Multiple Role-Based Recipients

```sql
INSERT INTO sla_recipients (role_name, email) VALUES ('Program Chair', 'program-chair@your-domain.com');
INSERT INTO sla_recipients (role_name, email) VALUES ('Admin', 'admin@your-domain.com');
INSERT INTO sla_recipients (role_name, email) VALUES ('Faculty Support', 'faculty-support@your-domain.com');
```

### Option 3: Role Without Email (Just for Tracking)

```sql
INSERT INTO sla_recipients (role_name, email) VALUES ('Faculty', NULL);
```

This row won't receive emails, but documents the role in the audit trail.

---

## Implementation Steps

### Step 1: Connect to Database

#### Using MySQL Client (Command Line)

```bash
mysql -h mysql-3d18e6f5-judacutey-77d8.i.aivencloud.com \
       -u avnadmin \
       -p'AVNS_t3_7MRHIB4NQRaIPVwR' \
       -P 26028 \
       defaultdb
```

(Note: These credentials are from `.env` — in production, use a secrets manager)

#### Using a GUI Tool

- **MySQL Workbench**: Configure new connection with host, port, user, password
- **DataGrip**: Connect via JDBC with SSL/TLS enabled
- **phpMyAdmin**: Use Aiven's web console if available

### Step 2: Insert Recipients

At the MySQL prompt, run:

```sql
-- Verify the table is empty
SELECT COUNT(*) as recipient_count FROM sla_recipients;

-- Add recipient(s)
INSERT INTO sla_recipients (role_name, email) VALUES ('Administrator', 'your-email@example.com');

-- Verify insertion
SELECT id, role_name, email FROM sla_recipients;
```

### Step 3: Verify the Fix

```bash
cd server
node checkSLAStatus.js
```

Expected output:

```
✅ Found 0 SLA recipient(s):  ← Should now show > 0

QUERY 2: SLA Recipients
================================================================================
✅ Found 1 SLA recipient(s):

┌─────────┬────┬───────────────┬──────────────────────────┐
│ (index) │ id │ role_name     │ email                    │
├─────────┼────┼───────────────┼──────────────────────────┤
│ 0       │ 1  │ Administrator │ your-email@example.com   │
└─────────┴────┴───────────────┴──────────────────────────┘
```

### Step 4: Wait for Next Cron Run

The cron job runs every **5 minutes**. After adding recipients:

1. **Wait up to 5 minutes** for the next scheduled run
2. **Or immediately trigger** (see below)
3. **Check logs** for confirmation:
   ```
   [slaCron] reminder sent — task 10
   [slaCron] breach alert sent — task 1
   ```

### Step 5: Verify Email Was Sent

Check the `sla_alerts` table to see if emails were successfully sent:

```sql
SELECT id, task_id, alert_type, emailed, created_at 
FROM sla_alerts 
ORDER BY created_at DESC 
LIMIT 5;
```

Expected columns:
- `emailed = 1` ✅ (email was sent)
- `emailed = 0` ❌ (email send failed)
- `created_at` = recent timestamp

---

## Manual Testing (Optional)

### Trigger the Cron Immediately

```bash
cd /path/to/server
node -e "
require('dotenv').config();
const db = require('./config/db');
const { runReminders, runBreaches } = require('./cron/slaCron.js');
(async () => {
  console.log('Running reminders...');
  await runReminders();
  console.log('Running breaches...');
  await runBreaches();
  process.exit(0);
})();
"
```

### Manually Create a Test Alert

```bash
curl -X POST http://localhost:5000/api/sla/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test SLA Alert",
    "message": "This is a test alert",
    "ruleId": 1,
    "taskId": 1,
    "alertType": "reminder",
    "tier": "warning",
    "documentType": "Student Dropping Form",
    "deadlineAt": "2026-09-09T20:00:00Z"
  }'
```

Check your email for the alert (may take a few seconds to arrive).

---

## Troubleshooting

### Email Still Not Sending?

#### Check 1: Is `sla_recipients` populated?

```sql
SELECT COUNT(*) FROM sla_recipients WHERE email IS NOT NULL;
```

If result is `0`, go back to **Step 2** above.

#### Check 2: Is the email setting enabled?

```sql
SELECT notify_email FROM sla_escalation_settings WHERE id = 1;
```

Expected: `notify_email = 1` (true). If it's `0`, enable it:

```sql
UPDATE sla_escalation_settings SET notify_email = 1 WHERE id = 1;
```

#### Check 3: Is the Brevo API key configured?

Check `.env`:
```bash
echo $BREVO_API_KEY
```

Should output a key like `xkeysib-xxx...xxx`. If empty:

```bash
grep BREVO_API_KEY server/.env
```

#### Check 4: Are there any alerts in the table?

```sql
SELECT id, task_id, emailed, error_message, created_at 
FROM sla_alerts 
ORDER BY created_at DESC 
LIMIT 5;
```

- If no rows: Tasks haven't reached their reminder window yet
- If `emailed = 0`: Email failed; check Brevo API logs
- If `emailed = 1`: Email was sent successfully ✅

#### Check 5: Server Logs

```bash
tail -f path-system-backend.log
```

Look for:
- `[slaCron] reminder sent — task X` ✅
- `[slaCron] breach alert sent — task Y` ✅
- `[slaCron] run failed: ...` ❌

---

## Email Recipients for Different Scenarios

### For Admins Only

```sql
DELETE FROM sla_recipients;
INSERT INTO sla_recipients (role_name, email) VALUES 
  ('System Admin', 'admin@institution.edu');
```

### For Multiple Departments

```sql
DELETE FROM sla_recipients;
INSERT INTO sla_recipients (role_name, email) VALUES 
  ('Program Chair', 'chairs@institution.edu'),
  ('Academic Dean', 'dean@institution.edu'),
  ('Quality Assurance', 'qa@institution.edu');
```

### For Individual Faculty (In Addition to Global)

The system also sends to the task's assigned faculty email (`extraRecipients`), so they get notified regardless of global recipients.

---

## Before Going to Production

### 1. Change Cron Schedule

Current: Every 5 minutes (testing)  
Production: Hourly

**File:** `server/cron/slaCron.js` (Line 57)

```javascript
// BEFORE (testing)
cron.schedule("*/5 * * * *", async () => {

// AFTER (production)
cron.schedule("0 * * * *", async () => {
```

### 2. Set Up Email Forwarding/Distribution List

Instead of hardcoding individual emails, use:
- A distribution list: `sla-alerts@institution.edu`
- Or a shared mailbox that multiple admins can access

```sql
INSERT INTO sla_recipients (role_name, email) VALUES 
  ('SLA Distribution List', 'sla-alerts@institution.edu');
```

### 3. Add Monitoring

Log email failures:

```bash
tail -f path-system-backend.log | grep -E "\[slaCron\]|Email send failed"
```

### 4. Test with Real Deadlines

Don't rely on the test schedule. Create a task with a deadline 30 minutes in the future and verify:
1. Reminder is sent at appropriate time
2. Email format is correct
3. Links work
4. All details are accurate

---

## FAQ

### Q: Why aren't old reminders sending?

**A:** SLA alerts have idempotency built in via a UNIQUE KEY on `(task_id, alert_type)`. Once a reminder is created for a task, it won't be created again. If it wasn't emailed the first time (because recipients were empty), it stays at `emailed = 0` and never retries.

**Fix:** Either delete and recreate the alert, or wait for the daily/weekly digest if you implement one.

### Q: Can I send to a different email for different SLA rules?

**A:** Currently, all alerts go to all recipients in `sla_recipients`. To differentiate:
- Option A: Implement rule-specific recipients (enhancement)
- Option B: Use forwarding rules in your email provider
- Option C: Create multiple notification flows (complex)

### Q: What if Brevo API key is wrong?

**A:** Emails will fail silently in the current setup. The error is caught and the alert stays at `emailed = 0`. Next time the cron runs (or you manually retry), it will attempt again. Check logs for:
```
[slaCron] run failed: Brevo send failed (401): Invalid API key
```

### Q: How do I test without waiting for a deadline?

**A:** Use the manual test step in **Manual Testing (Optional)** section above, or:

```sql
-- Set a task's deadline to 5 minutes from now
UPDATE tasks SET deadline = DATE_ADD(NOW(), INTERVAL 5 MINUTE) WHERE id = 1;

-- Wait 5 minutes for cron to trigger, or manually trigger immediately
```

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Check if `sla_recipients` is empty | ✅ Done — Found 0 recipients |
| 2 | **Add email recipient(s) to `sla_recipients`** | 🔴 **TODO** |
| 3 | Verify recipients were inserted | ⏳ After Step 2 |
| 4 | Wait 5 minutes for cron (or manually trigger) | ⏳ After Step 2 |
| 5 | Check email inbox | ⏳ After Step 4 |
| 6 | Verify `sla_alerts.emailed = 1` | ⏳ After Step 5 |

---

**Once you add the recipients, emails will start sending immediately. No code changes needed.**
