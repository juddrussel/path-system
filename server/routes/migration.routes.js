/**
 * TEMPORARY Migration Routes
 * DELETE THIS FILE AFTER RUNNING THE MIGRATION
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

// Temporary endpoint to run migration
// DELETE THIS AFTER RUNNING ONCE
router.post("/run-remove-unique-constraint", requireAuth, async (req, res) => {
  try {
    // Only allow admin to run migrations
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    console.log("Running migration: Remove unique_task_version constraint");

    // Try to drop the index
    try {
      await db.query("ALTER TABLE task_final_outputs DROP INDEX unique_task_version");
      console.log("✅ Successfully dropped unique_task_version constraint");
      
      return res.json({ 
        success: true,
        message: "Migration completed successfully. The unique_task_version constraint has been removed."
      });
    } catch (err) {
      // If error is that index doesn't exist, that's okay
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        return res.json({
          success: true,
          message: "Migration already applied. The unique_task_version constraint does not exist."
        });
      }
      throw err;
    }
  } catch (err) {
    console.error("Migration error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Migration failed",
      error: err.message 
    });
  }
});

module.exports = router;
