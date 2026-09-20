# Email Reminder Troubleshooting Guide

## Problem: Not Receiving Task Reminder Emails

You've added the missing environment variables, but emails still might not be sending. Here's how to diagnose:

---

## Step 1: Verify Environment Variables Are Set

**File:** `server/.env`

Check that these are present:
```
BREVO_API_KEY=xkeysib-[YOUR_KEY]
BREVO_SENDER_EMAIL=dspathsystem@gmail.com
BREVO_SENDER_NAME=DS PATH System
APP_BASE_URL=https://path-system.vercel.app
```

✅ **I just added these to your `.env`** - Restart your server after this change.

---

## Step 2: Check SLA Rules Are Configured

**Database Query:**
```sql
SELECT id, document_type, status, reminder_lead_hours, turnaround_hours 
FROM sla_rules 
WHERE status = 'Active';
```

**What to look for:**
- ✅ At least one rule with `status = 'Active'`
- ✅ `reminder_lead_hours` is set (e.g., 48, 24, or 4 hours)
- ✅ `document_type` matches your task types (e.g., "Faculty Review", "Masterlist")

**If NO rules exist:**
→ Go to **SLA Configuration** page in the app and create at least one active rule.

---

## Step 3: Check SLA Recipients Are Set Up

**Database Query:**
```sql
SELECT role_name, email FROM sla_recipients;
```

**What to look for:**
- ✅ At least one recipient email configured
- ✅ Valid email addresses

**If EMPTY:**
→ Go to **SLA Configuration → Escalation Settings** and add email recipients.

---

## Step 4: Check Task Setup

**Database Query:**
```sql
SELECT id, title, doc_type, faculty_id, deadline, status 
FROM tasks 
WHERE deadline IS NOT NULL 
ORDER BY deadline ASC 
LIMIT 10;
```

**What to look for:**
- ✅ Tasks have `deadline` set (not NULL)
- ✅ Task `status` is NOT "Completed", "Released", or "Approved"
- ✅ Task has `faculty_id` (assigned to someone)
- ✅ Task doc_type matches an active SLA rule
- ✅ Deadline is TODAY or in the future

**If NO tasks exist:**
→ Create a test task with:
- A deadline set to TODAY or tomorrow
- Document type matching your SLA rule
- Status = "Pending" or "In Review"

---

## Step 5: Check Faculty Has Email Address

**Database Query:**
```sql
SELECT id, full_name, email, role 
FROM users 
WHERE role = 'faculty' 
LIMIT 5;
```

**What to look for:**
- ✅ Faculty members have `email` field populated (not NULL)
- ✅ Valid email format

**If NULL:**
→ Faculty members need to set their email in **Account Settings**.

---

## Step 6: Check Alert History

**Database Query:**
```sql
SELECT task_id, alert_type, tier, created_at, emailed 
FROM sla_alerts 
ORDER BY created_at DESC 
LIMIT 20;
```

**What to look for:**
- ✅ Rows exist (means cron job is finding candidates)
- ✅ `emailed = 1` (email was attempted)
- ✅ Check timestamps - are they recent?

**If NO rows:**
→ Cron job hasn't run yet, or no tasks match criteria. Wait 5 minutes and check again.

---

## Step 7: Check Server Logs

**What to look for in server console:**

```
[slaCron] scheduled: every 5 minutes (TESTING — switch to hourly before production)
[slaCron] reminder sent — task 123
[slaCron] breach alert sent — task 456
```

**Or error messages:**
```
[slaCron] run failed: Error details...
⚠️  BREVO_API_KEY not set — skipping email send
```

---

## Step 8: Manual Test

**Run this in server console to test without waiting:**

```javascript
const { runReminders, runBreaches } = require('./cron/slaCron');
await runReminders();   // Check for approaching deadlines
await runBreaches();    // Check for overdue tasks
```

**Or use test script:**
```bash
node server/testSlaCron.js
```

---

## Common Issues & Solutions

### ❌ "BREVO_API_KEY not set"
**Solution:** Add to `.env`:
```
BREVO_API_KEY=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
BREVO_SENDER_EMAIL=dspathsystem@gmail.com
BREVO_SENDER_NAME=DS PATH System
```
Then restart server.

### ❌ "No recipients"
**Solution:** Add email recipients in **SLA Configuration → Escalation Settings**

### ❌ No SLA rules found
**Solution:** Create an active SLA rule in **SLA Configuration**
- Set `reminder_lead_hours` (e.g., 48, 24, 4)
- Match it to your document types
- Set status to "Active"

### ❌ Task not found in reminder candidates
**Possible causes:**
- Task status is "Completed" (cron ignores completed tasks)
- No deadline set
- Deadline is in the past (check breach alerts instead)
- Document type doesn't match any active rule
- Faculty doesn't have email address

### ❌ Email sent but not received
**Check:**
- Faculty's email address in database is correct
- Email went to spam folder
- Check Brevo dashboard for bounced/failed emails
- Verify faculty email can receive external emails

---

## Complete Checklist

Before expecting emails, verify ALL of these:

- [ ] `BREVO_API_KEY` in `.env` ✅ **DONE**
- [ ] `BREVO_SENDER_EMAIL` in `.env` ✅ **DONE**
- [ ] `BREVO_SENDER_NAME` in `.env` ✅ **DONE**
- [ ] At least one **Active** SLA rule created
- [ ] SLA rule has `reminder_lead_hours` set
- [ ] SLA rule `document_type` matches task types
- [ ] At least one recipient email in SLA recipients
- [ ] Task has deadline set
- [ ] Task status is NOT completed/released/approved
- [ ] Task assigned faculty has email address
- [ ] Server restarted after `.env` changes
- [ ] 5 minutes passed since task deadline became close
- [ ] Check `sla_alerts` table for alert records

---

## Testing Workflow

1. **Create a test task:**
   - Title: "Test Task"
   - Type: Match an active SLA rule type
   - Deadline: Tomorrow at 9:00 AM
   - Assign to: A faculty member

2. **Wait 5 minutes** (cron runs every 5 minutes in testing)

3. **Check results:**
   ```sql
   SELECT * FROM sla_alerts ORDER BY created_at DESC LIMIT 1;
   ```
   Should see a new row with `alert_type = 'reminder'`

4. **Check faculty email:**
   - Should receive email with subject: `[SLA WARNING] Test Task`
   - Check spam folder if not in inbox

5. **If still no email:**
   - Check server logs for `[slaCron]` messages
   - Run manual test: `node server/testSlaCron.js`
   - Verify Brevo API key is valid

---

## What Should Happen

### Timeline:
- **Day 1 (Deadline - 48 hours):** Reminder email sent (if `reminder_lead_hours = 48`)
- **Day 2 (Deadline - 24 hours):** Second reminder email NOT sent (duplicate prevention)
- **Day 3 (Deadline - 4 hours):** No new email (duplicate already sent)
- **Day 4 (Deadline + 1 day):** Breach email sent once (if task still not complete)

### Email Contents:
- **Subject:** `[SLA WARNING] Task Title` or `[SLA CRITICAL] Task Title`
- **From:** `dspathsystem@gmail.com` (DS PATH System)
- **Content:** Task card with deadline, SLA progress bar, action button
- **Recipients:** Faculty + configured escalation recipients

---

## Next Steps After Fix

1. Verify email comes through
2. Test with actual deadline (create task, set deadline to tomorrow)
3. Wait 5 minutes for cron
4. Check email
5. When confirmed working, change cron schedule from testing (5-min) to production (hourly)
   - File: `server/cron/slaCron.js` line 135
   - Change: `"*/5 * * * *"` → `"0 * * * *"`

---

## Getting Help

If emails still don't arrive after checking all items:

1. **Check Brevo dashboard:**
   - Log in to Brevo.com
   - Check email logs for failed sends
   - Verify sender email is verified

2. **Check database directly:**
   - Verify sla_rules, sla_recipients, and task deadlines are configured
   - Run manual test with `node server/testSlaCron.js`

3. **Check server logs:**
   - Look for `[slaCron]` messages
   - Look for email errors in console

4. **Verify connectivity:**
   - Test BREVO_API_KEY is valid
   - Confirm server can reach api.brevo.com
