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

// Shared SELECT fragment for a message row + its sender's display info and,
// when the message is pinned, who pinned it. Used by every route that
// returns one or more message rows so the shape is always consistent.
const MESSAGE_SELECT = `
  SELECT m.*, u.full_name AS sender_name, u.avatar_url AS sender_photo,
         pu.full_name AS pinned_by_name
  FROM messages m
  JOIN users u ON u.id = m.sender_id
  LEFT JOIN users pu ON pu.id = m.pinned_by
`;


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
        COUNT(CASE WHEN m2.is_read = 0 AND m2.receiver_id = ? AND m2.deleted_for_receiver = 0 THEN 1 END) AS unread_count
      FROM users u
      JOIN messages m ON (
        (m.sender_id = u.id AND m.receiver_id = ? AND m.deleted_for_receiver = 0)
        OR (m.sender_id = ? AND m.receiver_id = u.id AND m.deleted_for_sender = 0)
      )
      LEFT JOIN messages m2 ON (m2.sender_id = u.id AND m2.receiver_id = ? AND m2.is_read = 0 AND m2.deleted_for_receiver = 0)
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
      ${MESSAGE_SELECT}
      WHERE (m.sender_id = ? AND m.receiver_id = ? AND m.deleted_for_sender = 0)
         OR (m.sender_id = ? AND m.receiver_id = ? AND m.deleted_for_receiver = 0)
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
    const [rows] = await db.query(`${MESSAGE_SELECT} WHERE m.id = ?`, [result.insertId]);
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

    const [updatedRows] = await db.query(`${MESSAGE_SELECT} WHERE m.id = ?`, [messageId]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH toggle pin status on a direct message
// Pin state is shared between both participants (either side can pin/unpin,
// and both see the result) — same as most chat apps' "pin for everyone"
// behaviour, matching the client, which broadcasts a pin/unpin notice to
// both sides over the socket.
router.patch("/messages/:messageId/pin", authMiddleware, async (req, res) => {
  const messageId = parseInt(req.params.messageId);
  try {
    const [rows] = await db.query("SELECT * FROM messages WHERE id = ?", [messageId]);
    const message = rows[0];
    if (!message) return res.status(404).json({ message: "Message not found." });

    // Only the two participants in this conversation may pin/unpin.
    if (message.sender_id !== req.user.id && message.receiver_id !== req.user.id) {
      return res.status(403).json({ message: "You don't have access to this conversation." });
    }

    const nextPinned = message.is_pinned ? 0 : 1;
    await db.query(
      "UPDATE messages SET is_pinned = ?, pinned_by = ?, pinned_at = ? WHERE id = ?",
      [nextPinned, nextPinned ? req.user.id : null, nextPinned ? new Date() : null, messageId]
    );

    const [updatedRows] = await db.query(`${MESSAGE_SELECT} WHERE m.id = ?`, [messageId]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all pinned messages in a conversation with another user
// (Not strictly required since /messages/:userId already returns is_pinned
// on every row, but handy for a lighter-weight fetch if the pinned-messages
// panel is ever opened before the full thread has loaded.)
router.get("/messages/:userId/pinned", authMiddleware, async (req, res) => {
  const otherId = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(`
      ${MESSAGE_SELECT}
      WHERE m.is_pinned = 1
        AND (
          (m.sender_id = ? AND m.receiver_id = ? AND m.deleted_for_sender = 0)
          OR (m.sender_id = ? AND m.receiver_id = ? AND m.deleted_for_receiver = 0)
        )
      ORDER BY m.pinned_at DESC
    `, [req.user.id, otherId, otherId, req.user.id]);
    res.json(rows);
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
      "SELECT id FROM messages WHERE sender_id = ? AND receiver_id = ? AND deleted_for_receiver = 0 ORDER BY created_at DESC LIMIT 1",
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

// DELETE (soft) chat history — hides the thread only for the requesting
// user. Messages aren't actually removed from the DB: we flag them as
// deleted "for sender" or "for receiver" depending on which side of each
// message the current user was on, and every read query filters those out
// for that user specifically. The other participant's copy is untouched —
// if they haven't also cleared the thread, they still see everything.
router.delete("/messages/:userId/clear", authMiddleware, async (req, res) => {
  const otherId = parseInt(req.params.userId);
  try {
    // Messages I sent to them → hide on my (sender) side.
    await db.query(
      "UPDATE messages SET deleted_for_sender = 1 WHERE sender_id = ? AND receiver_id = ?",
      [req.user.id, otherId]
    );
    // Messages they sent to me → hide on my (receiver) side.
    await db.query(
      "UPDATE messages SET deleted_for_receiver = 1 WHERE sender_id = ? AND receiver_id = ?",
      [otherId, req.user.id]
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


// ════════════════════════════════════════════════════════════════════════════
// GROUP CHAT
// ════════════════════════════════════════════════════════════════════════════

const GROUP_MSG_SELECT = `
  SELECT gm.*, u.full_name AS sender_name, u.avatar_url AS sender_photo
  FROM group_messages gm
  JOIN users u ON u.id = gm.sender_id
`;

// POST /api/chat/groups — create a group and add creator + selected members
router.post("/groups", authMiddleware, async (req, res) => {
  const { name, description, memberIds } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ message: "Group name is required." });

  const members = Array.isArray(memberIds) ? memberIds.map(Number).filter(Boolean) : [];

  try {
    const [result] = await db.query(
      "INSERT INTO chat_groups (name, description, created_by) VALUES (?, ?, ?)",
      [name.trim(), description || null, req.user.id]
    );
    const groupId = result.insertId;

    // Always add the creator as admin
    const memberSet = [...new Set([req.user.id, ...members])];
    const memberValues = memberSet.map(uid => [groupId, uid, uid === req.user.id ? "admin" : "member"]);
    await db.query("INSERT INTO chat_group_members (group_id, user_id, role) VALUES ?", [memberValues]);

    const [group] = await db.query(
      `SELECT g.*, u.full_name AS creator_name
       FROM chat_groups g JOIN users u ON u.id = g.created_by
       WHERE g.id = ?`, [groupId]
    );
    const [members_] = await db.query(
      `SELECT cgm.user_id, cgm.role, u.full_name, u.avatar_url AS photo, u.department
       FROM chat_group_members cgm JOIN users u ON u.id = cgm.user_id
       WHERE cgm.group_id = ?`, [groupId]
    );
    res.status(201).json({ ...group[0], members: members_, unread_count: 0, last_message: null, last_time: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/chat/groups — list all groups the current user belongs to
router.get("/groups", authMiddleware, async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT g.id, g.name, g.description, g.avatar_url, g.created_by, g.created_at,
             u.full_name AS creator_name,
             gm_last.content AS last_message,
             gm_last.created_at AS last_time,
             gm_last.sender_id AS last_sender_id,
             gm_last.sender_name AS last_sender_name,
             COALESCE(unread.cnt, 0) AS unread_count
      FROM chat_groups g
      JOIN chat_group_members cgm ON cgm.group_id = g.id AND cgm.user_id = ?
      JOIN users u ON u.id = g.created_by
      LEFT JOIN (
        SELECT gm2.group_id, gm2.content, gm2.created_at, gm2.sender_id, u2.full_name AS sender_name
        FROM group_messages gm2
        JOIN users u2 ON u2.id = gm2.sender_id
        WHERE gm2.id = (
          SELECT MAX(gm3.id) FROM group_messages gm3 WHERE gm3.group_id = gm2.group_id
        )
      ) gm_last ON gm_last.group_id = g.id
      LEFT JOIN (
        SELECT gm4.group_id, COUNT(*) AS cnt
        FROM group_messages gm4
        WHERE gm4.id NOT IN (
          SELECT message_id FROM group_message_reads WHERE user_id = ?
        )
        AND gm4.sender_id != ?
        GROUP BY gm4.group_id
      ) unread ON unread.group_id = g.id
      ORDER BY COALESCE(gm_last.created_at, g.created_at) DESC
    `, [req.user.id, req.user.id, req.user.id]);

    // Attach member list to each group
    const groupIds = groups.map(g => g.id);
    if (groupIds.length === 0) return res.json([]);

    const [allMembers] = await db.query(`
      SELECT cgm.group_id, cgm.user_id, cgm.role, u.full_name, u.avatar_url AS photo, u.department
      FROM chat_group_members cgm
      JOIN users u ON u.id = cgm.user_id
      WHERE cgm.group_id IN (?)
    `, [groupIds]);

    const membersByGroup = {};
    for (const m of allMembers) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = [];
      membersByGroup[m.group_id].push(m);
    }

    res.json(groups.map(g => ({ ...g, members: membersByGroup[g.id] || [] })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/chat/groups/:groupId — single group info + members
router.get("/groups/:groupId", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    // Verify membership
    const [[membership]] = await db.query(
      "SELECT * FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!membership) return res.status(403).json({ message: "Not a member of this group." });

    const [[group]] = await db.query(
      `SELECT g.*, u.full_name AS creator_name FROM chat_groups g JOIN users u ON u.id = g.created_by WHERE g.id = ?`,
      [groupId]
    );
    const [members] = await db.query(
      `SELECT cgm.user_id, cgm.role, u.full_name, u.avatar_url AS photo, u.department, u.email
       FROM chat_group_members cgm JOIN users u ON u.id = cgm.user_id WHERE cgm.group_id = ?`,
      [groupId]
    );
    res.json({ ...group, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/chat/groups/:groupId/messages — fetch messages (marks all as read)
router.get("/groups/:groupId/messages", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    // Verify membership
    const [[membership]] = await db.query(
      "SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!membership) return res.status(403).json({ message: "Not a member of this group." });

    const [messages] = await db.query(
      `${GROUP_MSG_SELECT} WHERE gm.group_id = ? ORDER BY gm.created_at ASC`,
      [groupId]
    );

    // Mark all messages in this group as read for the current user
    if (messages.length > 0) {
      const unreadIds = messages
        .filter(m => m.sender_id !== req.user.id)
        .map(m => m.id);
      if (unreadIds.length > 0) {
        const readValues = unreadIds.map(id => [id, req.user.id]);
        await db.query(
          "INSERT IGNORE INTO group_message_reads (message_id, user_id) VALUES ?",
          [readValues]
        );
      }
    }

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/chat/groups/:groupId/messages — send a group message
router.post("/groups/:groupId/messages", authMiddleware, upload.single("file"), async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const { content } = req.body;

  if (!content && !req.file) return res.status(400).json({ message: "Message or file required." });

  try {
    const [[membership]] = await db.query(
      "SELECT 1 FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!membership) return res.status(403).json({ message: "Not a member of this group." });

    const fileUrl = await uploadToR2(req.file);
    const fileName = req.file ? req.file.originalname : null;

    const [result] = await db.query(
      "INSERT INTO group_messages (group_id, sender_id, content, file_url, file_name) VALUES (?, ?, ?, ?, ?)",
      [groupId, req.user.id, content || null, fileUrl, fileName]
    );

    // Mark as read for sender immediately
    await db.query(
      "INSERT IGNORE INTO group_message_reads (message_id, user_id) VALUES (?, ?)",
      [result.insertId, req.user.id]
    );

    const [[msg]] = await db.query(`${GROUP_MSG_SELECT} WHERE gm.id = ?`, [result.insertId]);
    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/chat/groups/:groupId/members — add a member (admin only)
router.post("/groups/:groupId/members", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const { userId } = req.body;

  try {
    const [[myRole]] = await db.query(
      "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!myRole || myRole.role !== "admin") return res.status(403).json({ message: "Only admins can add members." });

    await db.query(
      "INSERT IGNORE INTO chat_group_members (group_id, user_id, role) VALUES (?, ?, 'member')",
      [groupId, userId]
    );
    res.json({ added: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/chat/groups/:groupId/members/:userId — remove member or leave
router.delete("/groups/:groupId/members/:userId", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const targetUserId = parseInt(req.params.userId);
  const isSelf = targetUserId === req.user.id;

  try {
    if (!isSelf) {
      const [[myRole]] = await db.query(
        "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?",
        [groupId, req.user.id]
      );
      if (!myRole || myRole.role !== "admin") return res.status(403).json({ message: "Only admins can remove members." });
    }

    await db.query(
      "DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, targetUserId]
    );
    res.json({ removed: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/chat/groups/:groupId — rename group (admin only)
router.patch("/groups/:groupId", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const { name, description } = req.body;

  try {
    const [[myRole]] = await db.query(
      "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!myRole || myRole.role !== "admin") return res.status(403).json({ message: "Only admins can edit this group." });

    await db.query(
      "UPDATE chat_groups SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?",
      [name || null, description || null, groupId]
    );
    res.json({ updated: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/chat/groups/:groupId — delete group (admin only)
router.delete("/groups/:groupId", authMiddleware, async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  try {
    const [[myRole]] = await db.query(
      "SELECT role FROM chat_group_members WHERE group_id = ? AND user_id = ?",
      [groupId, req.user.id]
    );
    if (!myRole || myRole.role !== "admin") return res.status(403).json({ message: "Only admins can delete this group." });

    await db.query("DELETE FROM chat_groups WHERE id = ?", [groupId]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
