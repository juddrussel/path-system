/**
 * Collaborative Task Routes
 * 
 * Handles multi-faculty collaborative task workflow:
 * - Creation and assignment to multiple faculty
 * - Final output uploads (versioned)
 * - Confirmation tracking per collaborator per version
 * - Revision requests and status transitions
 * - Automatic submission when all confirm latest version
 */

const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { requireAuth, requireChairOrAdmin } = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_ROLES = ["admin", "program_chair"];

// ─── POST /api/collaborative-tasks ────────────────────────────────────────
// Create a new collaborative task for multiple faculty
router.post("/", requireAuth, requireChairOrAdmin, upload.array("files", 5), async (req, res) => {
  try {
    const { title, doc_type, priority, deadline, notes, faculty_ids, description } = req.body;
    const assignedBy = req.user.id;
    const now = new Date();

    // Validate required fields
    if (!title || !Array.isArray(faculty_ids) || faculty_ids.length < 2) {
      return res.status(400).json({
        message: "Collaborative tasks require title and minimum 2 faculty members.",
      });
    }

    // Generate tracking ID
    const [[{ nextId }]] = await db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(tracking_id, 11) AS UNSIGNED)), 0) + 1 AS nextId
       FROM tasks WHERE YEAR(created_at) = YEAR(NOW())`
    );
    const year = new Date().getFullYear();
    const tracking_id = `TASK-${year}-${String(nextId).padStart(5, "0")}`;

    // Create task record
    const [taskResult] = await db.query(
      `INSERT INTO tasks (
        tracking_id, assigned_by, title, doc_type, priority, deadline, notes,
        status, assignment_type, is_collaborative, collaboration_type,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tracking_id, assignedBy, title, doc_type || "General", priority || "Medium",
        deadline || null, description || notes || "",
        "Pending", "collaborative", 1, "together",
        now, now
      ]
    );

    const taskId = taskResult.insertId;

    // Add collaborators to task_collaborators
    const collaboratorPromises = faculty_ids.map((facultyId) =>
      db.query(
        `INSERT INTO task_collaborators (task_id, user_id, role, created_at)
         VALUES (?, ?, ?, ?)`,
        [taskId, facultyId, "contributor", now]
      )
    );
    await Promise.all(collaboratorPromises);

    // Create initial confirmation records (all pending)
    const confirmationPromises = faculty_ids.map((facultyId) =>
      db.query(
        `INSERT INTO task_confirmations (task_id, user_id, output_version, status, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [taskId, facultyId, 0, "pending", now]
      )
    );
    await Promise.all(confirmationPromises);

    // Handle file attachments (if any)
    if (req.files && req.files.length > 0) {
      const attachmentPromises = req.files.map((file) =>
        db.query(
          `INSERT INTO task_attachments (task_id, file_url, file_name, uploaded_by, uploaded_at)
           VALUES (?, ?, ?, ?, ?)`,
          [taskId, file.location || `s3://${file.bucket}/${file.key}`, file.originalname, assignedBy, now]
        )
      );
      await Promise.all(attachmentPromises);
    }

    // Fetch enriched task data
    const [[task]] = await db.query(
      `SELECT t.*, 
              COUNT(DISTINCT tc.user_id) as collaborator_count,
              GROUP_CONCAT(CONCAT(u.full_name, ' (', u.username, ')')) as collaborators
       FROM tasks t
       LEFT JOIN task_collaborators tc ON t.id = tc.task_id
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE t.id = ?
       GROUP BY t.id`,
      [taskId]
    );

    // Notify collaborators
    const io = req.app.get("io");
    if (io) {
      faculty_ids.forEach((facultyId) => {
        io.to(`user_${facultyId}`).emit("task_assigned", {
          taskId,
          tracking_id,
          title,
          type: "collaborative",
          message: `You've been added to a collaborative task: ${title}`,
        });
      });
    }

    return res.json({
      message: "Collaborative task created successfully.",
      task,
      tracking_id,
    });
  } catch (err) {
    console.error("POST /api/collaborative-tasks error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/collaborative-tasks/:id/upload-final-output ─────────────────
// Upload a new final output version (any collaborator can do this)
router.post("/:id/upload-final-output", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { note } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "File is required." });
    }

    // Verify user is a collaborator
    const [[collab]] = await db.query(
      `SELECT tc.id FROM task_collaborators tc
       WHERE tc.task_id = ? AND tc.user_id = ?`,
      [taskId, userId]
    );

    if (!collab) {
      return res.status(403).json({ message: "You are not a collaborator on this task." });
    }

    // Get current version and increment
    const [[{ currentVersion }]] = await db.query(
      `SELECT COALESCE(current_output_version, 0) as currentVersion FROM tasks WHERE id = ?`,
      [taskId]
    );

    const nextVersion = currentVersion + 1;

    // Create file URL (assuming S3/R2 upload)
    const fileUrl = req.file.location || `s3://${req.file.bucket}/${req.file.key}`;

    // Insert final output record
    await db.query(
      `INSERT INTO task_final_outputs (task_id, version, file_url, file_name, file_size, uploaded_by, upload_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, nextVersion, fileUrl, req.file.originalname, req.file.size, userId, note || ""]
    );

    // Update task's current version
    await db.query(
      `UPDATE tasks SET current_output_version = ?, updated_at = NOW() WHERE id = ?`,
      [nextVersion, taskId]
    );

    // Reset all confirmations for new version (all become pending)
    await db.query(
      `DELETE FROM task_confirmations WHERE task_id = ? AND output_version = ?`,
      [taskId, nextVersion]
    );

    const [[{ collaboratorCount }]] = await db.query(
      `SELECT COUNT(*) as collaboratorCount FROM task_collaborators WHERE task_id = ?`,
      [taskId]
    );

    for (let i = 0; i < collaboratorCount; i++) {
      const [[collab]] = await db.query(
        `SELECT user_id FROM task_collaborators WHERE task_id = ? LIMIT 1 OFFSET ?`,
        [taskId, i]
      );
      if (collab) {
        await db.query(
          `INSERT INTO task_confirmations (task_id, user_id, output_version, status)
           VALUES (?, ?, ?, ?)`,
          [taskId, collab.user_id, nextVersion, "pending"]
        );
      }
    }

    // Reset task status to "In Progress"
    await db.query(
      `UPDATE tasks SET status = 'Pending', confirmation_status = 'awaiting' WHERE id = ?`,
      [taskId]
    );

    // Broadcast update
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:output_updated", {
        taskId,
        version: nextVersion,
        fileName: req.file.originalname,
        uploadedBy: req.user.full_name,
        uploadedAt: new Date().toISOString(),
        message: `New final output v${nextVersion} uploaded. All confirmations reset.`,
      });
    }

    return res.json({
      message: "Final output uploaded successfully.",
      version: nextVersion,
      fileUrl,
    });
  } catch (err) {
    console.error("POST /upload-final-output error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/collaborative-tasks/:id/confirm ──────────────────────────────
// Confirm the current final output version
router.post("/:id/confirm", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const now = new Date();

    // Verify user is a collaborator
    const [[collab]] = await db.query(
      `SELECT tc.id FROM task_collaborators tc WHERE tc.task_id = ? AND tc.user_id = ?`,
      [taskId, userId]
    );

    if (!collab) {
      return res.status(403).json({ message: "You are not a collaborator on this task." });
    }

    // Get current task version
    const [[task]] = await db.query(
      `SELECT current_output_version FROM tasks WHERE id = ?`,
      [taskId]
    );

    const currentVersion = task.current_output_version;

    // Update or create confirmation
    await db.query(
      `INSERT INTO task_confirmations (task_id, user_id, output_version, status, confirmed_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = 'confirmed',
         confirmed_at = ?,
         withdrawn_at = NULL`,
      [taskId, userId, currentVersion, "confirmed", now, now]
    );

    // Check if all collaborators have confirmed
    const [[{ collaboratorCount }]] = await db.query(
      `SELECT COUNT(*) as collaboratorCount FROM task_collaborators WHERE task_id = ?`,
      [taskId]
    );

    const [[{ confirmedCount }]] = await db.query(
      `SELECT COUNT(*) as confirmedCount FROM task_confirmations 
       WHERE task_id = ? AND output_version = ? AND status = 'confirmed'`,
      [taskId, currentVersion]
    );

    const allConfirmed = confirmedCount >= collaboratorCount;

    if (allConfirmed) {
      // Automatically submit task
      await db.query(
        `UPDATE tasks SET status = 'For Approval', confirmation_status = 'both_confirmed', 
                         all_confirmed_at = ?, submitted_at = ? WHERE id = ?`,
        [now, now, taskId]
      );

      // Broadcast automatic submission
      const io = req.app.get("io");
      if (io) {
        io.to(`task_${taskId}`).emit("collaborative:auto_submitted", {
          taskId,
          message: "All collaborators confirmed. Task automatically submitted for review.",
        });
      }

      return res.json({
        message: "Confirmed. All collaborators confirmed - task automatically submitted!",
        status: "For Approval",
        autoSubmitted: true,
      });
    }

    // Partial confirmation
    await db.query(
      `UPDATE tasks SET confirmation_status = 'partial' WHERE id = ?`,
      [taskId]
    );

    // Broadcast confirmation
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:confirmed", {
        taskId,
        userId,
        userName: req.user.full_name,
        confirmedCount,
        collaboratorCount,
        message: `${req.user.full_name} confirmed. (${confirmedCount}/${collaboratorCount})`,
      });
    }

    return res.json({
      message: "You confirmed the latest output.",
      confirmedCount,
      collaboratorCount,
      allConfirmed: false,
    });
  } catch (err) {
    console.error("POST /confirm error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/collaborative-tasks/:id/withdraw-confirmation ────────────────
// Withdraw confirmation for current version
router.post("/:id/withdraw-confirmation", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const now = new Date();

    // Get current version
    const [[task]] = await db.query(
      `SELECT current_output_version FROM tasks WHERE id = ?`,
      [taskId]
    );

    // Update confirmation to withdrawn
    await db.query(
      `UPDATE task_confirmations SET status = 'withdrawn', withdrawn_at = ? 
       WHERE task_id = ? AND user_id = ? AND output_version = ?`,
      [now, taskId, userId, task.current_output_version]
    );

    // Update task status back to awaiting
    await db.query(
      `UPDATE tasks SET confirmation_status = 'awaiting' WHERE id = ?`,
      [taskId]
    );

    // Broadcast withdrawal
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:withdrawn", {
        taskId,
        userId,
        userName: req.user.full_name,
        message: `${req.user.full_name} withdrew their confirmation.`,
      });
    }

    return res.json({
      message: "Confirmation withdrawn.",
      status: "Awaiting Confirmation",
    });
  } catch (err) {
    console.error("POST /withdraw-confirmation error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/collaborative-tasks/:id/request-revision ────────────────────
// Request revision from collaborators
router.post("/:id/request-revision", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        message: "Revision reason must be at least 10 characters.",
      });
    }

    // Verify user is chair/admin or collaborator
    const [[isCollab]] = await db.query(
      `SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?`,
      [taskId, userId]
    );

    const isChair = ADMIN_ROLES.includes(req.user.role);

    if (!isCollab && !isChair) {
      return res.status(403).json({ message: "You cannot request revision on this task." });
    }

    // Reset task to pending and clear confirmations
    await db.query(
      `UPDATE tasks SET status = 'Pending', confirmation_status = 'awaiting' WHERE id = ?`,
      [taskId]
    );

    await db.query(
      `UPDATE task_confirmations SET status = 'pending', confirmed_at = NULL, withdrawn_at = NULL
       WHERE task_id = ? AND output_version = (SELECT current_output_version FROM tasks WHERE id = ?)`,
      [taskId, taskId]
    );

    // Add revision request comment
    await db.query(
      `INSERT INTO task_comments (task_id, user_id, content, created_at)
       VALUES (?, ?, ?, NOW())`,
      [taskId, userId, `📝 Revision requested: ${reason}`]
    );

    // Broadcast revision request
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:revision_requested", {
        taskId,
        reason,
        requestedBy: req.user.full_name,
        message: `Revision requested: ${reason}`,
      });
    }

    return res.json({
      message: "Revision requested. Task reset to In Progress.",
      status: "Pending",
    });
  } catch (err) {
    console.error("POST /request-revision error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/collaborative-tasks/:id ───────────────────────────────────────
// Get full collaborative task details with confirmations and versions
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;

    // Fetch task
    const [[task]] = await db.query(
      `SELECT * FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Verify access (collaborator, chair, or admin)
    const isCollab = await db.query(
      `SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?`,
      [taskId, userId]
    );

    const isChair = ADMIN_ROLES.includes(req.user.role);

    if (isCollab.length === 0 && !isChair) {
      return res.status(403).json({ message: "You don't have access to this task." });
    }

    // Fetch collaborators with confirmation status
    const [collaborators] = await db.query(
      `SELECT 
         tc.user_id, u.full_name, u.username,
         tc.role, tc.created_at,
         tc.confirmed_at, tc.current_version_confirmed
       FROM task_collaborators tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ?
       ORDER BY u.full_name ASC`,
      [taskId]
    );

    // Fetch confirmation details for current version
    const [confirmations] = await db.query(
      `SELECT 
         tc.user_id, u.full_name, u.username,
         tc.status, tc.confirmed_at, tc.withdrawn_at
       FROM task_confirmations tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ? AND tc.output_version = ?`,
      [taskId, task.current_output_version]
    );

    // Fetch all final output versions
    const [versions] = await db.query(
      `SELECT 
         tfo.version, tfo.file_url, tfo.file_name, tfo.file_size,
         tfo.uploaded_by, u.full_name, tfo.upload_note, tfo.created_at
       FROM task_final_outputs tfo
       JOIN users u ON tfo.uploaded_by = u.id
       WHERE tfo.task_id = ?
       ORDER BY tfo.version DESC`,
      [taskId]
    );

    // Fetch comments
    const [comments] = await db.query(
      `SELECT tc.*, u.full_name, u.username FROM task_comments tc
       JOIN users u ON tc.user_id = u.id
       WHERE tc.task_id = ?
       ORDER BY tc.created_at ASC`,
      [taskId]
    );

    return res.json({
      task,
      collaborators,
      confirmations,
      versions,
      comments,
    });
  } catch (err) {
    console.error("GET /collaborative-tasks/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
