/**
 * scoreCron.js
 *
 * Schedules a nightly recalculation of every faculty member's performance
 * score. Requires `node-cron`:  npm install node-cron
 *
 * Wire this into your server entrypoint (e.g. index.js / server.js):
 *   const startScoreCron = require('./jobs/scoreCron');
 *   startScoreCron(pool);
 */

const cron = require("node-cron");
const { recalculateAllScores } = require("../services/facultyScoreService");

module.exports = function startScoreCron(pool) {
  // Runs every day at 2:00 AM server time. Adjust the cron expression as needed.
  cron.schedule("0 2 * * *", async () => {
    try {
      const result = await recalculateAllScores(pool, { keepHistory: true });
      console.log(`[scoreCron] Faculty scores recalculated:`, result);
    } catch (err) {
      console.error("[scoreCron] Failed to recalculate faculty scores:", err);
    }
  });

  console.log("[scoreCron] Nightly faculty score recalculation scheduled (2:00 AM).");
};
