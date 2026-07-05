// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ── Auth middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ── File upload setup ─────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads/chat");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB


// ════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ════════════════════════════════════════════════════════════════════════════

// GET all users to start a conversation with
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, full_name, username, department FROM users WHERE id != ? AND role != 'pending' ORDER BY full_name",
      [req.user.id]
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET conversation list (all users I've chatted with + unread counts)
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id, u.full_name, u.username, u.department,
        m.content AS last_message,
        m.created_at AS last_time,
        m.sender_id AS last_sender_id,
        COUNT(CASE WHEN m2.is_read = 0 AND m2.receiver_id = ? THEN 1 END) AS unread_count
      FROM users u
      JOIN messages m ON (
        (m.sender_id = u.id AND m.receiver_id = ?)
        OR (m.sender_id = ? AND m.receiver_id = u.id)
      )
      LEFT JOIN messages m2 ON (m2.sender_id = u.id AND m2.receiver_id = ? AND m2.is_read = 0)
      WHERE u.id != ?
      GROUP BY u.id, m.id
      ORDER BY m.created_at DESC
    `, [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]);

    // deduplicate by user id, keep latest
    const seen = new Set();
    const conversations = rows.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET messages between me and another user
router.get("/messages/:userId", authMiddleware, async (req, res) => {
  const otherId = parseInt(req.params.userId);
  try {
    const [messages] = await db.query(`
      SELECT m.*, u.full_name AS sender_name
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [req.user.id, otherId, otherId, req.user.id]);

    // Mark all received messages as read
    await db.query(
      "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [otherId, req.user.id]
    );

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST send a direct message (text or file)
router.post("/messages/:userId", authMiddleware, upload.single("file"), async (req, res) => {
  const receiverId = parseInt(req.params.userId);
  const { content, is_system } = req.body;
  const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;
  const fileName = req.file ? req.file.originalname : null;
  const systemFlag = is_system === "1" || is_system === true ? 1 : 0;

  if (!content && !fileUrl) {
    return res.status(400).json({ message: "Message or file required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, content, file_url, file_name, is_system) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, receiverId, content || null, fileUrl, fileName, systemFlag]
    );
    const [rows] = await db.query(
      "SELECT m.*, u.full_name AS sender_name FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET total unread count (for notification badge)
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [req.user.id]
    );
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ════════════════════════════════════════════════════════════════════════════
// DOCUMENT COMMENTS
// ════════════════════════════════════════════════════════════════════════════

// GET comments for a document
router.get("/document/:docId/comments", authMiddleware, async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT dc.*, u.full_name AS sender_name, u.department AS sender_dept
      FROM document_comments dc
      JOIN users u ON u.id = dc.sender_id
      WHERE dc.document_id = ?
      ORDER BY dc.created_at ASC
    `, [req.params.docId]);
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST add a comment to a document
router.post("/document/:docId/comments", authMiddleware, upload.single("file"), async (req, res) => {
  const { content } = req.body;
  const fileUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;
  const fileName = req.file ? req.file.originalname : null;

  if (!content && !fileUrl) {
    return res.status(400).json({ message: "Comment or file required." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO document_comments (document_id, sender_id, content, file_url, file_name) VALUES (?, ?, ?, ?, ?)",
      [req.params.docId, req.user.id, content || null, fileUrl, fileName]
    );
    const [rows] = await db.query(`
      SELECT dc.*, u.full_name AS sender_name, u.department AS sender_dept
      FROM document_comments dc
      JOIN users u ON u.id = dc.sender_id
      WHERE dc.id = ?
    `, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;