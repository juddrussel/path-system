// routes/notification.routes.js
//
// Read/manage the persisted history behind the Notifications page. Rows are
// written by notify() in task.routes.js at the same moment the live socket
// event fires (see that file) — this router is just the "catch up on what
// I missed" side of it.

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

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

// ─── GET /api/notifications — history for the current user ───────────────────
// Optional ?unread=1 to only fetch unread rows. Capped at 100 most recent —
// this is a notification feed, not an archive browser.
router.get("/", requireAuth, async (req, res) => {
  try {
    const onlyUnread = req.query.unread === "1";
    const [rows] = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = ? ${onlyUnread ? "AND is_read = 0" : ""}
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    const [[{ unread_count }]] = await db.query(
      "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
      [req.user.id]
    );
    return res.json({ notifications: rows, unreadCount: unread_count });
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/notifications/read-all ────────────────────────────────────────
router.patch("/read-all", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [req.user.id]);
    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("PATCH /api/notifications/read-all error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Notification not found." });
    return res.json({ message: "Marked as read." });
  } catch (err) {
    console.error("PATCH /api/notifications/:id/read error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/notifications — clear all for the current user ──────────────
router.delete("/", requireAuth, async (req, res) => {
  try {
    await db.query("DELETE FROM notifications WHERE user_id = ?", [req.user.id]);
    return res.json({ message: "All notifications cleared." });
  } catch (err) {
    console.error("DELETE /api/notifications error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM notifications WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: "Notification not found." });
    return res.json({ message: "Notification deleted." });
  } catch (err) {
    console.error("DELETE /api/notifications/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = { router };