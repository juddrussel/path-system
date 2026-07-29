// scratch/testSlaCron.js
//
// One-off dry run — call this manually before wiring startSlaCron() into
// your real server startup, so you can see exactly which tasks get flagged
// and confirm the emails/rows look right on real data first.
//
// Usage: node scratch/testSlaCron.js
// (adjust the require path below to wherever you actually place this file
// relative to server/cron/slaCron.js)
require("dotenv").config();
const { runReminders, runBreaches } = require("../server/cron/slaCron");

(async () => {
  console.log("Running SLA reminder check...");
  const reminderCount = await runReminders();
  console.log(`Reminder candidates processed: ${reminderCount}`);

  console.log("Running SLA breach check...");
  const breachCount = await runBreaches();
  console.log(`Breach candidates processed: ${breachCount}`);

  console.log("Done. Check sla_alerts table and inbox for results.");
  process.exit(0);
})().catch((err) => {
  console.error("Dry run failed:", err);
  process.exit(1);
});
