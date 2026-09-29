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
const { requireAuth } = require("../middleware/auth");
const multer = require("multer");
const { uploadToR2 } = require("../utils/uploadToR2");
const upload = multer({ storage: multer.memoryStorage() });

const ADMIN_ROLES = ["admin", "program_chair"];

// Local middleware for chair/admin authorization
function requireChairOrAdmin(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Program Chair or Admin access required." });
  next();
}

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
router.post("/:id/upload-final-output", requireAuth, upload.array("files", 5), async (req, res) => {
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

    // Upload file to R2
    const { url: fileUrl } = await uploadToR2(req.file);

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

    // Set task status to awaiting confirmation (NOT submitted yet)
    await db.query(
      `UPDATE tasks SET status = 'Pending', confirmation_status = 'awaiting', submitted_at = NULL WHERE id = ?`,
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

    console.log(`[Confirm] Task ${taskId} v${currentVersion}: ${confirmedCount}/${collaboratorCount} confirmed`);

    const allConfirmed = confirmedCount >= collaboratorCount;

    if (allConfirmed) {
      console.log(`[Confirm] ALL CONFIRMED! Auto-submitting task ${taskId}`);
      // Automatically submit task
      await db.query(
        `UPDATE tasks SET status = 'For Approval', confirmation_status = 'confirmed', 
                         all_confirmed_at = ?, submitted_at = ? WHERE id = ?`,
        [now, now, taskId]
      );

      // Broadcast automatic submission
      const io = req.app.get("io");
      if (io) {
        console.log(`[Confirm] Broadcasting auto_submitted event for task ${taskId}`);
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
// Request revision from collaborators (with optional file attachment)
router.post("/:id/request-revision", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { reason } = req.body;
    const userId = req.user.id;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        message: "Revision reason must be at least 10 characters.",
      });
    }

    // Upload file to R2 if provided
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    
    if (req.file) {
      const r2Result = await uploadToR2(req.file);
      fileUrl = r2Result.url;
      fileName = req.file.originalname;
      fileSize = req.file.size;
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
      `UPDATE tasks SET status = 'Pending', confirmation_status = 'awaiting', 
       revision_file_url = ?, revision_file_name = ?, revision_file_size = ? WHERE id = ?`,
      [fileUrl, fileName, fileSize, taskId]
    );

    await db.query(
      `UPDATE task_confirmations SET status = 'pending', confirmed_at = NULL, withdrawn_at = NULL
       WHERE task_id = ? AND output_version = (SELECT current_output_version FROM tasks WHERE id = ?)`,
      [taskId, taskId]
    );

    // Add revision request comment with file attachment if present
    const commentContent = fileUrl 
      ? `📝 Revision requested: ${reason}\n[Attached file: ${fileName}]`
      : `📝 Revision requested: ${reason}`;
      
    await db.query(
      `INSERT INTO task_comments (task_id, sender_id, content, created_at)
       VALUES (?, ?, ?, NOW())`,
      [taskId, userId, commentContent]
    );

    // Broadcast revision request
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:revision_requested", {
        taskId,
        reason,
        fileUrl,
        fileName,
        fileSize,
        requestedBy: req.user.full_name,
        message: `Revision requested: ${reason}`,
      });
    }

    return res.json({
      message: "Revision requested. Task reset to In Progress.",
      status: "Pending",
      fileUrl,
      fileName,
    });
  } catch (err) {
    console.error("POST /request-revision error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});


// ─── POST /api/collaborative-tasks/:id/approve ──────────────────────────────
// Approve a submitted collaborative task
router.post("/:id/approve", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;
    const { reviewNote } = req.body;

    // Verify user is admin or program chair
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Only Program Chair or Admin can approve tasks." });
    }

    // Verify task is in "For Approval" status
    const [[task]] = await db.query(
      `SELECT status FROM tasks WHERE id = ?`,
      [taskId]
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    if (task.status !== "For Approval") {
      return res.status(400).json({ 
        message: `Task must be in "For Approval" status. Current status: ${task.status}` 
      });
    }

    // Update task status to Approved
    await db.query(
      `UPDATE tasks SET status = 'Approved' WHERE id = ?`,
      [taskId]
    );

    // Add approval comment if note provided
    if (reviewNote && reviewNote.trim()) {
      await db.query(
        `INSERT INTO task_comments (task_id, sender_id, content, created_at)
         VALUES (?, ?, ?, NOW())`,
        [taskId, userId, `✅ Task approved: ${reviewNote}`]
      );
    }

    // Broadcast approval
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:approved", {
        taskId,
        approvedBy: req.user.full_name,
        reviewNote,
        message: `Task approved by ${req.user.full_name}`,
      });
    }

    return res.json({
      message: "Task approved successfully.",
      status: "Approved",
    });
  } catch (err) {
    console.error("POST /approve error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/collaborative-tasks/:id ───────────────────────────────────────
// Get full collaborative task details with confirmations and versions
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user.id;

    console.log(`[GET /collaborative-tasks/${taskId}] User ${userId} (role: ${req.user.role}) requesting task`);

    // Fetch task
    let task;
    try {
      const result = await db.query(
        `SELECT * FROM tasks WHERE id = ?`,
        [taskId]
      );
      task = result[0]?.[0];
    } catch (e) {
      console.error("Error fetching task:", e.message);
      throw e;
    }

    if (!task) {
      console.log(`Task ${taskId} not found`);
      return res.status(404).json({ message: "Task not found." });
    }

    console.log(`Task ${taskId} found:`, { id: task.id, title: task.title, is_collaborative: task.is_collaborative });

    // Verify access (collaborator, chair, or admin)
    let collabCheck = [];
    try {
      const result = await db.query(
        `SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?`,
        [taskId, userId]
      );
      collabCheck = result[0] || [];
    } catch (e) {
      console.error("Error checking collaborator status:", e.message);
    }

    const isChair = ADMIN_ROLES.includes(req.user.role);
    console.log(`Access check: isCollab=${collabCheck.length > 0}, isChair=${isChair}`);

    if (collabCheck.length === 0 && !isChair) {
      console.log(`User ${userId} denied access to task ${taskId}`);
      return res.status(403).json({ message: "You don't have access to this task." });
    }

    // Fetch collaborators
    let collaborators = [];
    try {
      const result = await db.query(
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
      collaborators = result[0] || [];
      console.log(`[GET Task ${taskId}] Found ${collaborators.length} collaborators`);
      if (collaborators.length === 0) {
        console.log(`[GET Task ${taskId}] WARNING: No collaborators found! Checking task_collaborators table...`);
        const [debugCollabs] = await db.query(`SELECT * FROM task_collaborators WHERE task_id = ?`, [taskId]);
        console.log(`[GET Task ${taskId}] Raw task_collaborators rows:`, debugCollabs);
      }
    } catch (e) {
      console.error("Error fetching collaborators:", e.message);
      collaborators = [];
    }

    // Fetch confirmation details for current version
    let confirmations = [];
    try {
      // Check if task_confirmations table exists first
      const tableCheck = await db.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_confirmations'
      `);
      
      if (tableCheck[0] && tableCheck[0].length > 0) {
        const result = await db.query(
          `SELECT 
             tc.user_id, u.full_name, u.username,
             tc.status, tc.confirmed_at, tc.withdrawn_at
           FROM task_confirmations tc
           JOIN users u ON tc.user_id = u.id
           WHERE tc.task_id = ? AND tc.output_version = ?`,
          [taskId, task.current_output_version || 0]
        );
        confirmations = result[0] || [];
      }
      console.log(`Found ${confirmations.length} confirmations`);
    } catch (e) {
      console.error("Error fetching confirmations:", e.message);
      confirmations = [];
    }

    // Fetch versions
    let versions = [];
    try {
      // Check if task_final_outputs table exists first
      const tableCheck = await db.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_final_outputs'
      `);
      
      if (tableCheck[0] && tableCheck[0].length > 0) {
        const result = await db.query(
          `SELECT 
             tfo.version, tfo.file_url, tfo.file_name, tfo.file_size,
             tfo.uploaded_by, u.full_name, tfo.upload_note, tfo.created_at
           FROM task_final_outputs tfo
           JOIN users u ON tfo.uploaded_by = u.id
           WHERE tfo.task_id = ?
           ORDER BY tfo.version DESC`,
          [taskId]
        );
        versions = result[0] || [];
      }
      console.log(`Found ${versions.length} versions`);
    } catch (e) {
      console.error("Error fetching versions:", e.message);
      versions = [];
    }

    // Fetch comments with threading support
    let comments = [];
    try {
      const result = await db.query(
        `SELECT 
           tc.id, tc.task_id, tc.sender_id as user_id, tc.parent_comment_id, 
           tc.content, tc.files, tc.created_at,
           u.full_name
         FROM task_comments tc
         LEFT JOIN users u ON tc.sender_id = u.id
         WHERE tc.task_id = ?
         ORDER BY tc.created_at ASC`,
        [taskId]
      );
      const allComments = result[0] || [];
      
      // Parse files JSON and build parent-child hierarchy
      const commentMap = {};
      const rootComments = [];
      
      allComments.forEach(comment => {
        // Files might be already parsed by MySQL or still JSON string
        let files = [];
        if (comment.files) {
          try {
            files = typeof comment.files === 'string' ? JSON.parse(comment.files) : comment.files;
          } catch (e) {
            console.warn(`Could not parse files for comment ${comment.id}:`, e.message);
            files = [];
          }
        }
        
        commentMap[comment.id] = { 
          ...comment, 
          files,
          replies: [] 
        };
      });
      
      allComments.forEach(comment => {
        if (comment.parent_comment_id) {
          if (commentMap[comment.parent_comment_id]) {
            commentMap[comment.parent_comment_id].replies.push(commentMap[comment.id]);
          }
        } else {
          rootComments.push(commentMap[comment.id]);
        }
      });
      
      comments = rootComments;
      console.log(`Found ${allComments.length} comments (${rootComments.length} root, ${allComments.length - rootComments.length} replies)`);
    } catch (e) {
      console.error("Error fetching comments:", e.message);
      comments = [];
    }

    // Fetch task attachments (instruction files from assigner)
    let attachments = [];
    try {
      const result = await db.query(
        `SELECT ta.* FROM task_attachments ta
         WHERE ta.task_id = ?
         ORDER BY ta.uploaded_at DESC`,
        [taskId]
      );
      attachments = result[0] || [];
      console.log(`Found ${attachments.length} task attachments`);
    } catch (e) {
      console.error("Error fetching attachments:", e.message);
      attachments = [];
    }

    console.log(`Successfully loaded collaborative task ${taskId}`);
    return res.json({
      task,
      collaborators,
      confirmations,
      versions,
      comments,
      attachments,
    });
  } catch (err) {
    console.error("GET /collaborative-tasks/:id FATAL error:", err);
    return res.status(500).json({ message: "Internal server error.", error: err.message });
  }
});

module.exports = router;
// Debug endpoint to see raw data in database
router.get("/:id/debug", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    // Raw check: what's in task_collaborators?
    const [collabs] = await db.query(
      `SELECT * FROM task_collaborators WHERE task_id = ?`,
      [taskId]
    );
    
    // Raw check: what's in tasks? (only basic columns)
    const [tasks] = await db.query(
      `SELECT id, title, is_collaborative FROM tasks WHERE id = ?`,
      [taskId]
    );
    
    // Raw check: what's in task_confirmations?
    const [confs] = await db.query(
      `SELECT * FROM task_confirmations WHERE task_id = ?`,
      [taskId]
    );
    
    // Raw check: what's in task_final_outputs?
    const [outs] = await db.query(
      `SELECT * FROM task_final_outputs WHERE task_id = ?`,
      [taskId]
    );

    res.json({
      task: tasks[0],
      task_collaborators_count: collabs.length,
      task_collaborators: collabs,
      task_confirmations_count: confs.length,
      task_confirmations: confs.slice(0, 3),
      task_final_outputs_count: outs.length,
      task_final_outputs: outs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/collaborative-tasks/:id/comment ──────────────────────────────
// Add a comment/working note to a collaborative task (supports threading/replies and file attachments)
router.post("/:id/comment", requireAuth, async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { content, parentCommentId, files } = req.body; // files are now pre-uploaded URLs

    console.log(`[Comment] taskId=${taskId}, userId=${userId}, parentId=${parentCommentId}, contentLength=${content?.length || 0}, preUploadedFiles=${files?.length || 0}`);

    if ((!content || !content.trim()) && (!files || files.length === 0)) {
      return res.status(400).json({ message: "Comment cannot be empty and must have content or files" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if user is a collaborator on this task
    const [[collabCheck]] = await db.query(
      "SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?",
      [taskId, userId]
    );
    
    if (!collabCheck) {
      console.log(`[Comment] User ${userId} is not a collaborator on task ${taskId}`);
      return res.status(403).json({ message: "Only collaborators can comment" });
    }

    // If replying to a comment, verify the parent comment exists and belongs to this task
    if (parentCommentId) {
      const [[parentCheck]] = await db.query(
        "SELECT id FROM task_comments WHERE id = ? AND task_id = ?",
        [parentCommentId, taskId]
      );
      if (!parentCheck) {
        return res.status(400).json({ message: "Parent comment not found" });
      }
    }

    // Insert comment into task_comments using sender_id (files are already uploaded)
    const filesJson = files && files.length > 0 ? JSON.stringify(files) : null;
    const [result] = await db.query(
      `INSERT INTO task_comments (task_id, sender_id, parent_comment_id, content, files, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [taskId, userId, parentCommentId || null, content || "", filesJson]
    );

    console.log(`[Comment] Inserted comment id=${result.insertId} with ${files?.length || 0} pre-uploaded files`);

    // Fetch user details for response
    const [[user]] = await db.query("SELECT id, full_name FROM users WHERE id = ?", [userId]);

    const comment = {
      id: result.insertId,
      task_id: taskId,
      user_id: userId,
      sender_id: userId,
      content: content || "",
      full_name: user?.full_name || "Unknown",
      parent_comment_id: parentCommentId || null,
      files: files || [],
      created_at: new Date().toISOString(),
    };

    console.log(`[Comment] Broadcasting to room task_${taskId}:`, JSON.stringify(comment, null, 2));

    // Broadcast to all collaborators
    const io = req.app.get("io");
    if (io) {
      io.to(`task_${taskId}`).emit("collaborative:comment_posted", comment);
      console.log(`[Comment] ✓ Emitted collaborative:comment_posted event`);
    } else {
      console.log(`[Comment] ✗ Socket.io instance not found!`);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error("[Comment Error]", err);
    res.status(500).json({ message: "Failed to post comment", error: err.message });
  }
});


// ─── POST /api/collaborative-tasks/migrate (Admin only) ───────────────────────
// Runs the collaborative tasks database migration
// This endpoint exists to set up the schema without manual SQL access
// Can be authenticated via:
// 1. JWT token (Authorization: Bearer <token>) for admin/program chair users
// 2. Internal migration key (X-Migration-Key header) for automated deployments
router.post("/migrate", async (req, res) => {
  // Check authentication: either JWT token or internal migration key
  const auth = req.headers.authorization;
  const migrationKey = req.headers["x-migration-key"];
  
  // Allow migration key from environment for automated deployments
  const MIGRATION_KEY = process.env.MIGRATION_KEY || "ds-path-migration-2026";
  
  let isAuthorized = false;
  
  // Check migration key first
  if (migrationKey === MIGRATION_KEY) {
    isAuthorized = true;
  }
  // Otherwise check JWT + role
  else if (auth && auth.startsWith("Bearer ")) {
    try {
      const token = auth.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (["admin", "program_chair"].includes(decoded.role)) {
        isAuthorized = true;
      }
    } catch (err) {
      // Token verification failed, will reject below
    }
  }
  
  if (!isAuthorized) {
    return res.status(401).json({ message: "Unauthorized. Provide valid JWT or X-Migration-Key header." });
  }
  try {
    console.log("[Migrate] Starting collaborative tasks schema update...");

    // 1. Update tasks table
    await db.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assignment_type ENUM('individual','collaborative') DEFAULT 'individual' AFTER is_collaborative,
      ADD COLUMN IF NOT EXISTS current_output_version INT DEFAULT 0 AFTER assignment_type,
      ADD COLUMN IF NOT EXISTS all_confirmed_at DATETIME AFTER current_output_version,
      ADD COLUMN IF NOT EXISTS submitted_at DATETIME AFTER all_confirmed_at
    `);
    console.log("✓ tasks table updated");

    // 2. Create task_final_outputs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_final_outputs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        version INT NOT NULL,
        file_url VARCHAR(1024) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        uploaded_by INT NOT NULL,
        upload_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_task_version (task_id, version),
        INDEX idx_task_id (task_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ task_final_outputs table created");

    // 3. Create task_confirmations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_confirmations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        output_version INT NOT NULL,
        confirmed_at DATETIME,
        withdrawn_at DATETIME,
        status ENUM('pending','confirmed','withdrawn') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_version (task_id, user_id, output_version),
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("✓ task_confirmations table created");

    // 4. Update task_collaborators table
    await db.query(`
      ALTER TABLE task_collaborators 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'contributor' AFTER user_id,
      ADD COLUMN IF NOT EXISTS current_version_confirmed TINYINT DEFAULT 0 AFTER confirmed_at
    `);
    console.log("✓ task_collaborators table updated");

    console.log("[Migrate] ✓ All schema updates completed successfully!");
    return res.json({
      message: "Migration completed successfully!",
      updates: [
        "tasks table updated with assignment_type, current_output_version, all_confirmed_at, submitted_at",
        "task_final_outputs table created",
        "task_confirmations table created",
        "task_collaborators table updated with role and current_version_confirmed"
      ]
    });
  } catch (err) {
    console.error("[Migrate] Error:", err);
    return res.status(500).json({ message: "Migration failed.", error: err.message });
  }
});

module.exports = router;
