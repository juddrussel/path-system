// routes/task.routes.js
//
// ─── REQUIRED: run this SQL once to create the submissions table ──────────────
// CREATE TABLE IF NOT EXISTS task_submissions (
//   id                   INT AUTO_INCREMENT PRIMARY KEY,
//   task_id              INT          NOT NULL,
//   faculty_id           INT          NOT NULL,
//   file_name            VARCHAR(512),
//   file_url             VARCHAR(1024),
//   size                 BIGINT       DEFAULT 0,
//   note                 TEXT,
//   submission_group_id  VARCHAR(128),
//   submitted_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   INDEX idx_task_id (task_id),
//   INDEX idx_group   (submission_group_id)
// );
// ─────────────────────────────────────────────────────────────────────────────
const express  = require("express");
const router   = express.Router();
const jwt      = require("jsonwebtoken");
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const db       = require("../config/db");
const { writeLog } = require("./audit.routes");

// ─── UPLOAD CONFIG ────────────────────────────────────────────────────────────
fs.mkdirSync("./uploads/tasks", { recursive: true });

const storage = multer.diskStorage({
  destination: "./uploads/tasks/",
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
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

function requireChairOrAdmin(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Program Chair or Admin access required." });
  next();
}

// ─── HELPER: generate tracking ID ────────────────────────────────────────────
async function generateTrackingId() {
  const year = new Date().getFullYear();
  const [[{ count }]] = await db.query(
    "SELECT COUNT(*) AS count FROM tasks WHERE YEAR(created_at) = ?", [year]
  );
  const seq = String(count + 1).padStart(4, "0");
  const candidate = `TASK-${year}-${seq}`;
  const [[{ id_count }]] = await db.query(
    "SELECT COUNT(*) AS id_count FROM tasks WHERE tracking_id = ?", [candidate]
  );
  if (id_count) return `TASK-${year}-${String(count + 2).padStart(4, "0")}`;
  return candidate;
}

// ─── HELPER: attach comments + attachments + submissions to tasks ─────────────
async function enrichTasks(rows) {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);

  const [attachments] = await db.query(
    "SELECT * FROM task_attachments WHERE task_id IN (?)", [ids]
  );
  const [comments] = await db.query(
    `SELECT tc.*, u.full_name AS sender_name
     FROM task_comments tc
     LEFT JOIN users u ON u.id = tc.sender_id
     WHERE tc.task_id IN (?)
     ORDER BY tc.created_at ASC`, [ids]
  );

  // Submissions = files faculty upload when submitting their work.
  // Kept separate from task_attachments so they never mix with the task brief.
  let submissions = [];
  try {
    [submissions] = await db.query(
      `SELECT ts.*, u.full_name AS submitted_by_name
       FROM task_submissions ts
       LEFT JOIN users u ON u.id = ts.faculty_id
       WHERE ts.task_id IN (?)
       ORDER BY ts.submitted_at ASC`, [ids]
    );
  } catch (_) { /* table may not exist yet — safe to ignore */ }

  const attachMap     = {};
  const commentMap    = {};
  const submissionMap = {};
  attachments.forEach(a => {
    if (!attachMap[a.task_id])     attachMap[a.task_id]     = [];
    attachMap[a.task_id].push(a);
  });
  comments.forEach(c => {
    if (!commentMap[c.task_id])    commentMap[c.task_id]    = [];
    commentMap[c.task_id].push(c);
  });
  submissions.forEach(s => {
    if (!submissionMap[s.task_id]) submissionMap[s.task_id] = [];
    submissionMap[s.task_id].push(s);
  });

  return rows.map(r => ({
    ...r,
    attachments: attachMap[r.id]     || [],
    comments:    commentMap[r.id]    || [],
    submissions: submissionMap[r.id] || [],
  }));
}

// ─── SOCKET.IO: TYPING INDICATOR SETUP ───────────────────────────────────────
// Call this once from your server entry point (e.g. app.js / server.js):
//
//   const { setupTypingEvents } = require("./routes/task.routes");
//   setupTypingEvents(io);
//
// Make sure socket.userId is set in your Socket.IO auth middleware or
// inside your existing "register" handler:
//
//   socket.on("register", (userId) => {
//     socket.userId = userId;          // ← required
//     socket.join(`user_${userId}`);
//   });
// ─────────────────────────────────────────────────────────────────────────────
function setupTypingEvents(io) {
  io.on("connection", (socket) => {

    // ── Join a task's discussion room (call from frontend when panel opens) ──
    socket.on("join_task", ({ taskId }) => {
      if (!taskId) return;
      socket.join(`task_${taskId}`);
    });

    // ── Leave a task's discussion room (call from frontend when panel closes) ─
    socket.on("leave_task", ({ taskId }) => {
      if (!taskId) return;
      socket.leave(`task_${taskId}`);
      // Clear stale typing indicator for other users in the room
      socket.to(`task_${taskId}`).emit("task:user_stop_typing", {
        taskId,
        userId: socket.userId,
      });
    });

    // ── User started typing in the comment box ───────────────────────────────
    socket.on("typing", ({ taskId, name }) => {
      if (!socket.userId || !taskId) return;
      socket.to(`task_${taskId}`).emit("task:user_typing", {
        taskId,
        userId: socket.userId,
        name,
      });
    });

    // ── User stopped typing (timeout or message sent) ────────────────────────
    socket.on("stop_typing", ({ taskId }) => {
      if (!socket.userId || !taskId) return;
      socket.to(`task_${taskId}`).emit("task:user_stop_typing", {
        taskId,
        userId: socket.userId,
      });
    });

    // ── Clean up on disconnect ───────────────────────────────────────────────
    socket.on("disconnecting", () => {
      // Broadcast stop_typing to every task room this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith("task_")) {
          socket.to(room).emit("task:user_stop_typing", {
            taskId: parseInt(room.replace("task_", "")),
            userId: socket.userId,
          });
        }
      });
    });
  });
}

// ─── GET /api/tasks/next-tracking-id ─────────────────────────────────────────
router.get("/next-tracking-id", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    return res.json({ tracking_id: await generateTrackingId() });
  } catch (err) {
    console.error("GET /next-tracking-id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/my — tasks assigned to the current user (faculty view) ───
router.get("/my", requireAuth, async (req, res) => {
  try {
    const { q = "", status = "", priority = "", doc_type = "", date = "" } = req.query;

    const conditions = ["t.faculty_id = ?"];
    const params     = [req.user.id];

    if (status)   { conditions.push("t.status = ?");              params.push(status); }
    if (priority) { conditions.push("t.priority = ?");            params.push(priority); }
    if (doc_type) { conditions.push("t.doc_type = ?");            params.push(doc_type); }
    if (date)     { conditions.push("DATE(t.created_at) = ?");    params.push(date); }
    if (q)        {
      conditions.push("(t.title LIKE ? OR t.tracking_id LIKE ? OR u2.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT
         t.*,
         u1.full_name AS faculty_name,
         u1.email     AS faculty_email,
         u2.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    const tasks = await enrichTasks(rows);

    const now      = new Date();
    const today    = now.toISOString().slice(0, 10);
    const total    = tasks.length;
    const dueToday = tasks.filter(t => t.deadline && new Date(t.deadline).toISOString().slice(0, 10) === today).length;
    const overdue  = tasks.filter(t => t.deadline && new Date(t.deadline).toISOString().slice(0, 10) < today && t.status !== "Received").length;
    const pendingApproval = tasks.filter(t => t.status === "For Approval").length;

    return res.json({ tasks, stats: { total, dueToday, overdue, pendingApproval } });
  } catch (err) {
    console.error("GET /api/tasks/my error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks — all tasks (admin/chair) ─────────────────────────────────
router.get("/", requireAuth, async (req, res) => {
  try {
    let rows;
    if (["admin", "program_chair"].includes(req.user.role)) {
      [rows] = await db.query(
        `SELECT t.*, u1.full_name AS faculty_name, u1.email AS faculty_email, u2.full_name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users u1 ON u1.id = t.faculty_id
         LEFT JOIN users u2 ON u2.id = t.assigned_by
         ORDER BY t.created_at DESC`
      );
    } else {
      [rows] = await db.query(
        `SELECT t.*, u2.full_name AS assigned_by_name
         FROM tasks t
         LEFT JOIN users u2 ON u2.id = t.assigned_by
         WHERE t.faculty_id = ?
         ORDER BY t.created_at DESC`,
        [req.user.id]
      );
    }
    return res.json(await enrichTasks(rows));
  } catch (err) {
    console.error("GET /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/assigned-by-me ───────────────────────────────────────────
router.get("/assigned-by-me", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const { q = "", status = "", priority = "", date = "" } = req.query;

    const conditions = ["t.assigned_by = ?"];
    const params     = [req.user.id];

    if (status)   { conditions.push("t.status = ?");              params.push(status); }
    if (priority) { conditions.push("t.priority = ?");            params.push(priority); }
    if (date)     { conditions.push("DATE(t.deadline) = ?");      params.push(date); }
    if (q) {
      conditions.push("(t.title LIKE ? OR t.tracking_id LIKE ? OR u1.full_name LIKE ?)");
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    const [rows] = await db.query(
      `SELECT
         t.*,
         u1.full_name  AS assigned_to_name,
         u1.email      AS assigned_to_email,
         u2.full_name  AS assigned_by_name,
         u2.email      AS assigned_by_email
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       ${where}
       ORDER BY t.created_at DESC`,
      params
    );

    const tasks = await enrichTasks(rows);

    const now   = new Date();
    const total           = tasks.length;
    const pendingApproval = tasks.filter(t => t.status === "For Approval").length;
    const submitted       = tasks.filter(t => ["Received", "For Approval"].includes(t.status)).length;
    const overdue         = tasks.filter(t =>
      t.deadline && new Date(t.deadline) < now && !["Received", "Archived"].includes(t.status)
    ).length;

    return res.json({ tasks, stats: { total, pendingApproval, submitted, overdue } });
  } catch (err) {
    console.error("GET /api/tasks/assigned-by-me error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/tasks/:id ───────────────────────────────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u1.full_name AS faculty_name, u1.email AS faculty_email, u2.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    const canView = ["admin", "program_chair"].includes(req.user.role) || task.faculty_id === req.user.id;
    if (!canView) return res.status(403).json({ message: "Access denied." });
    const [enriched] = await enrichTasks([task]);
    // Return as { task: ... } so frontend fetchSelectedTask can read data.task || data
    return res.json({ task: enriched });
  } catch (err) {
    console.error("GET /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks — create & assign a task ────────────────────────────────
router.post("/", requireAuth, requireChairOrAdmin, upload.array("attachments"), async (req, res) => {
  const { faculty_id, title, doc_type, priority = "Medium", deadline, notes } = req.body;
  if (!faculty_id || !title || !deadline)
    return res.status(400).json({ message: "faculty_id, title, and deadline are required." });

  try {
    const tracking_id = await generateTrackingId();
    const [result] = await db.query(
      `INSERT INTO tasks (tracking_id, faculty_id, assigned_by, title, doc_type, priority, deadline, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [tracking_id, faculty_id, req.user.id, title, doc_type || null, priority, deadline, notes || null]
    );
    const taskId = result.insertId;

    if (req.files?.length > 0) {
      const attachRows = req.files.map(f => [taskId, `/uploads/tasks/${f.filename}`, f.originalname]);
      await db.query("INSERT INTO task_attachments (task_id, file_url, file_name) VALUES ?", [attachRows]);
    }

    await writeLog({
      userId:    req.user.id,
      action:    "TASK_ASSIGN",
      detail:    `Assigned task "${title}" (${tracking_id}) to user ID ${faculty_id}`,
      ipAddress: req.ip,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`user_${faculty_id}`).emit("task_assigned", {
        message: `You have been assigned a new task: ${title}`,
        tracking_id,
        taskId,
      });
    }

    const [rows] = await db.query(
      `SELECT t.*, u1.full_name AS faculty_name, u2.full_name AS assigned_by_name
       FROM tasks t
       LEFT JOIN users u1 ON u1.id = t.faculty_id
       LEFT JOIN users u2 ON u2.id = t.assigned_by
       WHERE t.id = ?`, [taskId]
    );
    const [enriched] = await enrichTasks(rows);
    return res.status(201).json(enriched);
  } catch (err) {
    console.error("POST /api/tasks error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/draft ───────────────────────────────────────────────────
router.post("/draft", requireAuth, requireChairOrAdmin, upload.array("attachments"), async (req, res) => {
  const { faculty_id, title, doc_type, priority = "Medium", deadline, notes } = req.body;
  try {
    const tracking_id = await generateTrackingId();
    const [result] = await db.query(
      `INSERT INTO tasks (tracking_id, faculty_id, assigned_by, title, doc_type, priority, deadline, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW(), NOW())`,
      [tracking_id, faculty_id || null, req.user.id, title || "Untitled Draft", doc_type || null, priority, deadline || null, notes || null]
    );
    const taskId = result.insertId;
    if (req.files?.length > 0) {
      const attachRows = req.files.map(f => [taskId, `/uploads/tasks/${f.filename}`, f.originalname]);
      await db.query("INSERT INTO task_attachments (task_id, file_url, file_name) VALUES ?", [attachRows]);
    }
    return res.status(201).json({ message: "Draft saved.", tracking_id, id: taskId });
  } catch (err) {
    console.error("POST /api/tasks/draft error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/status ─────────────────────────────────────────────
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["Pending", "In Review", "For Approval", "Received", "Returned", "Draft"];
  if (!validStatuses.includes(status))
    return res.status(400).json({ message: "Invalid status." });

  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    const canUpdate = ["admin", "program_chair"].includes(req.user.role) || task.faculty_id === req.user.id;
    if (!canUpdate) return res.status(403).json({ message: "Access denied." });

    await db.query("UPDATE tasks SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_STATUS_UPDATE", detail: `Updated task ${task.tracking_id} status to "${status}"`, ipAddress: req.ip });

    const io = req.app.get("io");
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: status, updatedBy: req.user.full_name || req.user.username };
      io.to(`user_${task.faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${task.assigned_by}`).emit("task:status_changed", payload);
    }

    return res.json({ message: "Status updated.", status });
  } catch (err) {
    console.error("PATCH /api/tasks/:id/status error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/approve ────────────────────────────────────────────
router.patch("/:id/approve", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    await db.query("UPDATE tasks SET status = 'Received', updated_at = NOW() WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_APPROVE", detail: `Approved task ${rows[0].tracking_id}`, ipAddress: req.ip });

    const io = req.app.get("io");
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: "Received", updatedBy: req.user.full_name || req.user.username };
      io.to(`user_${rows[0].faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${rows[0].assigned_by}`).emit("task:status_changed", payload);
    }

    return res.json({ message: "Task approved." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/return ─────────────────────────────────────────────
router.patch("/:id/return", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    await db.query("UPDATE tasks SET status = 'Returned', updated_at = NOW() WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_RETURN", detail: `Returned task ${rows[0].tracking_id}`, ipAddress: req.ip });

    const io = req.app.get("io");
    if (io) {
      const payload = { taskId: parseInt(req.params.id), newStatus: "Returned", updatedBy: req.user.full_name || req.user.username };
      io.to(`user_${rows[0].faculty_id}`).emit("task:status_changed", payload);
      io.to(`user_${rows[0].assigned_by}`).emit("task:status_changed", payload);
    }

    return res.json({ message: "Task returned." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/done ────────────────────────────────────────────────
router.patch("/:id/done", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE tasks SET status = 'For Approval', updated_at = NOW() WHERE id = ?", [req.params.id]);
    return res.json({ message: "Marked as done." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id/archive ────────────────────────────────────────────
router.patch("/:id/archive", requireAuth, async (req, res) => {
  try {
    await db.query("UPDATE tasks SET status = 'Archived', updated_at = NOW() WHERE id = ?", [req.params.id]);
    return res.json({ message: "Task archived." });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── PATCH /api/tasks/:id — edit task details ────────────────────────────────
router.patch("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  const { title, doc_type, priority, deadline, notes, faculty_id } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });

    await db.query(
      `UPDATE tasks
       SET title      = COALESCE(?, title),
           doc_type   = COALESCE(?, doc_type),
           priority   = COALESCE(?, priority),
           deadline   = COALESCE(?, deadline),
           notes      = COALESCE(?, notes),
           faculty_id = COALESCE(?, faculty_id),
           updated_at = NOW()
       WHERE id = ?`,
      [title, doc_type, priority, deadline, notes, faculty_id, req.params.id]
    );
    await writeLog({ userId: req.user.id, action: "TASK_EDIT", detail: `Edited task ${rows[0].tracking_id}`, ipAddress: req.ip });
    return res.json({ message: "Task updated." });
  } catch (err) {
    console.error("PATCH /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/comments ────────────────────────────────────────────
router.post("/:id/comments", requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ message: "content is required." });
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const canAccess = ["admin", "program_chair"].includes(req.user.role) || rows[0].faculty_id === req.user.id;
    if (!canAccess) return res.status(403).json({ message: "Access denied." });

    const [result] = await db.query(
      "INSERT INTO task_comments (task_id, sender_id, content, created_at) VALUES (?, ?, ?, NOW())",
      [req.params.id, req.user.id, content.trim()]
    );

    const [[savedComment]] = await db.query(
      `SELECT tc.*, u.full_name AS sender_name
       FROM task_comments tc
       LEFT JOIN users u ON u.id = tc.sender_id
       WHERE tc.id = ?`,
      [result.insertId]
    );

    const io = req.app.get("io");
    if (io) {
      const taskId  = parseInt(req.params.id);
      const otherId = req.user.id === rows[0].faculty_id ? rows[0].assigned_by : rows[0].faculty_id;
      const payload = { taskId, comment: savedComment };

      io.to(`user_${otherId}`).emit("task:comment_added", payload);
      io.to(`user_${req.user.id}`).emit("task:comment_added", payload);

      // Clear the sender's typing indicator for everyone else in the task room
      io.to(`task_${taskId}`).emit("task:user_stop_typing", {
        taskId,
        userId: req.user.id,
      });
    }

    return res.status(201).json({ message: "Comment posted.", comment: savedComment });
  } catch (err) {
    console.error("POST /api/tasks/:id/comments error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/comment-upload ──────────────────────────────────────
// Uploads a file for use in a comment WITHOUT adding it to task_attachments.
// Returns the saved file URL so the frontend can embed it in a comment body.
router.post("/:id/comment-upload", requireAuth, upload.array("files"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const canAccess = ["admin", "program_chair"].includes(req.user.role) || rows[0].faculty_id === req.user.id;
    if (!canAccess) return res.status(403).json({ message: "Access denied." });
    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded." });

    const files = req.files.map(f => ({
      url: `/uploads/tasks/${f.filename}`,
      originalname: f.originalname,
      name: f.filename,
    }));
    return res.status(201).json({ message: "Files uploaded.", files });
  } catch (err) {
    console.error("POST /api/tasks/:id/comment-upload error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/attachments ─────────────────────────────────────────
router.post("/:id/attachments", requireAuth, upload.array("files"), async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const canAccess = ["admin", "program_chair"].includes(req.user.role) || rows[0].faculty_id === req.user.id;
    if (!canAccess) return res.status(403).json({ message: "Access denied." });

    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded." });

    const attachRows = req.files.map(f => [req.params.id, `/uploads/tasks/${f.filename}`, f.originalname]);
    await db.query("INSERT INTO task_attachments (task_id, file_url, file_name) VALUES ?", [attachRows]);

    const io = req.app.get("io");
    if (io) {
      const notifyId = req.user.id === rows[0].faculty_id ? rows[0].assigned_by : rows[0].faculty_id;
      req.files.forEach(f => {
        io.to(`user_${notifyId}`).emit("task:attachment_added", {
          taskId: parseInt(req.params.id),
          fileName: f.originalname,
        });
      });
    }

    // Return the saved file info so the frontend can build correct URLs
    const files = req.files.map(f => ({
      url: `/uploads/tasks/${f.filename}`,
      originalname: f.originalname,
      name: f.filename,
    }));

    return res.status(201).json({ message: "Attachments uploaded.", count: req.files.length, files });
  } catch (err) {
    console.error("POST /api/tasks/:id/attachments error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/tasks/:id/submit ──────────────────────────────────────────────
// Faculty submits their completed work. Files go to task_submissions (NOT
// task_attachments), so they always render as a separate post from the task brief.
router.post("/:id/submit", requireAuth, upload.array("files"), async (req, res) => {
  const taskId            = parseInt(req.params.id);
  const note              = req.body.note              || null;
  const submissionGroupId = req.body.submission_group_id || `sub_${Date.now()}`;
  const submittedAt       = new Date();

  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [taskId]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });
    const task = rows[0];
    if (task.faculty_id !== req.user.id)
      return res.status(403).json({ message: "Only the assigned faculty can submit this task." });

    // Update task status → For Approval
    await db.query(
      "UPDATE tasks SET status = 'For Approval', updated_at = NOW() WHERE id = ?",
      [taskId]
    );

    // Save each uploaded file to task_submissions
    const savedFiles = [];
    for (const file of req.files || []) {
      const fileUrl = `/uploads/tasks/${file.filename}`;
      const [result] = await db.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, req.user.id, file.originalname, fileUrl, file.size, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:                  result.insertId,
        originalname:        file.originalname,
        file_name:           file.originalname,
        url:                 fileUrl,
        file_url:            fileUrl,
        size:                file.size,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:        submittedAt.toISOString(),
      });
    }

    // If no files but there's a note, still record the submission event
    if (!req.files?.length) {
      const [result] = await db.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, NULL, NULL, 0, ?, ?, ?)`,
        [taskId, req.user.id, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:                  result.insertId,
        originalname:        null,
        file_name:           null,
        url:                 null,
        file_url:            null,
        size:                0,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:        submittedAt.toISOString(),
        _noteOnly:           true,
      });
    }

    await writeLog({
      userId:    req.user.id,
      action:    "TASK_SUBMIT",
      detail:    `Submitted task ${task.tracking_id} with ${savedFiles.length} file(s)`,
      ipAddress: req.ip,
    });

    // Notify the assigning officer in real-time
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${task.assigned_by}`).emit("task:submitted", {
        taskId,
        taskTitle:           task.title,
        facultyName:         req.user.full_name || req.user.username,
        attachmentCount:     savedFiles.filter(f => f.url).length,
        files:               savedFiles,
        submission_group_id: submissionGroupId,
      });
    }

    return res.status(201).json({ success: true, files: savedFiles });
  } catch (err) {
    console.error("POST /api/tasks/:id/submit error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/tasks/:id ────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Task not found." });

    const [attachments] = await db.query("SELECT * FROM task_attachments WHERE task_id = ?", [req.params.id]);
    attachments.forEach(a => {
      const filePath = `.${a.file_url}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    await db.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "TASK_DELETE", detail: `Deleted task "${rows[0].title}" (${rows[0].tracking_id})`, ipAddress: req.ip });
    return res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("DELETE /api/tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = { router, setupTypingEvents };