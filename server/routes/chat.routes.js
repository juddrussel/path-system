// routes/chat.routes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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

// Messages can only be edited within this window after they were sent.
// Kept in sync with the frontend's EDIT_WINDOW_MS — but enforced here too,
// since the client-side check can be bypassed.
const EDIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// ── Cloudflare R2 setup ────────────────────────────────────────────────────────
// R2 speaks the S3 API, so the regular AWS SDK v3 S3 client works against it —
// just point `endpoint` at the account-scoped R2 endpoint instead of AWS.
// Required env vars:
//   R2_ACCOUNT_ID        Cloudflare account ID
//   R2_ACCESS_KEY_ID     R2 API token access key
//   R2_SECRET_ACCESS_KEY R2 API token secret key
//   R2_BUCKET_NAME       target bucket name
//   R2_PUBLIC_URL        public base URL for the bucket (r2.dev subdomain or
//                        a custom domain you've mapped to the bucket) — no
//                        trailing slash, e.g. https://pub-xxxx.r2.dev
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// multer keeps the file in memory (as a Buffer) instead of writing to local
// disk — we stream that buffer straight up to R2 below.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Uploads a multer file buffer to R2 under chat/, returns its public URL (or
// null if there was no file). Original filename is preserved separately in
// the DB (file_name), so the storage key just needs to be unique.
async function uploadToR2(file) {
  if (!file) return null;
  const ext = file.originalname.includes(".") ? file.originalname.split(".").pop() : "";
  const key = `chat/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext ? `.${ext}` : ""}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}


// ════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGES
// ════════════════════════════════════════════════════════════════════════════

// GET all users to start a conversation with
router.get("/users", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT
        id, full_name, username, department, avatar_url AS photo,
        role, email, phone AS contact_number
       FROM users
       WHERE id != ? AND role != 'pending'
       ORDER BY full_name`,
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
        u.id, u.full_name, u.username, u.department, u.avatar_url AS photo,
        u.role, u.email, u.phone AS contact_number,
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
      SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_photo
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
  const systemFlag = is_system === "1" || is_system === true ? 1 : 0;

  if (!content && !req.file) {
    return res.status(400).json({ message: "Message or file required." });
  }

  try {
    const fileUrl = await uploadToR2(req.file);
    const fileName = req.file ? req.file.originalname : null;

    const [result] = await db.query(
      "INSERT INTO messages (sender_id, receiver_id, content, file_url, file_name, is_system) VALUES (?, ?, ?, ?, ?, ?)",
      [req.user.id, receiverId, content || null, fileUrl, fileName, systemFlag]
    );
    const [rows] = await db.query(
      "SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_photo FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?",
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH edit a direct message's text content
// Only the original sender may edit, only within EDIT_WINDOW_MS of sending,
// and only messages that aren't system messages or file-only attachments
// (file messages carry no editable text — re-send instead).
router.patch("/messages/:messageId", authMiddleware, async (req, res) => {
  const messageId = parseInt(req.params.messageId);
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Content is required." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM messages WHERE id = ?", [messageId]);
    const message = rows[0];
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }
    if (message.is_system) {
      return res.status(400).json({ message: "System messages can't be edited." });
    }

    const sentAt = new Date(message.created_at).getTime();
    if (Date.now() - sentAt > EDIT_WINDOW_MS) {
      return res.status(403).json({ message: "The edit window for this message has expired." });
    }

    await db.query(
      "UPDATE messages SET content = ?, is_edited = 1, edited_at = NOW() WHERE id = ?",
      [content.trim(), messageId]
    );

    const [updatedRows] = await db.query(
      "SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_photo FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?",
      [messageId]
    );
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH mark a conversation unread — flips the latest message *received*
// from this user back to unread, so it reappears as unread in the sidebar
// until the conversation is opened again (which marks it read as normal).
router.patch("/messages/:userId/mark-unread", authMiddleware, async (req, res) => {
  const otherId = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(
      "SELECT id FROM messages WHERE sender_id = ? AND receiver_id = ? ORDER BY created_at DESC LIMIT 1",
      [otherId, req.user.id]
    );
    if (!rows[0]) {
      // No message from them to mark unread (e.g. you started the thread).
      return res.json({ marked: false });
    }
    await db.query("UPDATE messages SET is_read = 0 WHERE id = ?", [rows[0].id]);
    res.json({ marked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE all messages between me and another user (clear chat history)
router.delete("/messages/:userId/clear", authMiddleware, async (req, res) => {
  const otherId = parseInt(req.params.userId);
  try {
    await db.query(
      "DELETE FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
      [req.user.id, otherId, otherId, req.user.id]
    );
    res.json({ cleared: true });
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
      SELECT dc.*, u.full_name AS sender_name, u.department AS sender_dept, u.avatar_url AS sender_photo
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

  if (!content && !req.file) {
    return res.status(400).json({ message: "Comment or file required." });
  }

  try {
    const fileUrl = await uploadToR2(req.file);
    const fileName = req.file ? req.file.originalname : null;

    const [result] = await db.query(
      "INSERT INTO document_comments (document_id, sender_id, content, file_url, file_name) VALUES (?, ?, ?, ?, ?)",
      [req.params.docId, req.user.id, content || null, fileUrl, fileName]
    );
    const [rows] = await db.query(`
      SELECT dc.*, u.full_name AS sender_name, u.department AS sender_dept, u.avatar_url AS sender_photo
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