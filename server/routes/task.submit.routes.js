// ── POST /api/tasks/:id/submit ────────────────────────────────────────────────
// Dedicated endpoint for faculty task submission.
// Saves uploaded files to the task_submissions table (NOT task_attachments),
// so submitted files are kept completely separate from the original task brief.
//
// Add this route to your existing tasks router (e.g. routes/tasks.js)
// alongside your other task routes.

const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");

// Re-use your existing multer config, or define one here:
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/submissions");
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/:id/submit", authMiddleware, upload.array("files"), async (req, res) => {
  const taskId           = req.params.id;
  const facultyId        = req.user.id;
  const note             = req.body.note            || null;
  const submissionGroupId = req.body.submission_group_id || `sub_${Date.now()}`;
  const submittedAt      = new Date();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update task status → For Approval
    await conn.query(
      "UPDATE tasks SET status = 'For Approval', updated_at = NOW() WHERE id = ?",
      [taskId]
    );

    // 2. Insert each uploaded file into task_submissions (separate from task_attachments)
    const savedFiles = [];
    for (const file of req.files || []) {
      const fileUrl = `/uploads/submissions/${file.filename}`;
      const [result] = await conn.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [taskId, facultyId, file.originalname, fileUrl, file.size, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:              result.insertId,
        originalname:    file.originalname,
        url:             fileUrl,
        size:            file.size,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:    submittedAt.toISOString(),
      });
    }

    // 3. If note only (no files), still record the submission event
    if (req.files?.length === 0 && note) {
      const [result] = await conn.query(
        `INSERT INTO task_submissions
           (task_id, faculty_id, file_name, file_url, size, note, submission_group_id, submitted_at)
         VALUES (?, ?, NULL, NULL, 0, ?, ?, ?)`,
        [taskId, facultyId, note, submissionGroupId, submittedAt]
      );
      savedFiles.push({
        id:              result.insertId,
        originalname:    null,
        url:             null,
        size:            0,
        note,
        submission_group_id: submissionGroupId,
        submitted_at:    submittedAt.toISOString(),
        _noteOnly:       true,
      });
    }

    await conn.commit();

    // 4. Emit real-time event to the assigning officer
    const faculty = req.user;
    const [[task]] = await conn.query("SELECT title, assigned_by FROM tasks WHERE id = ?", [taskId]);
    if (task?.assigned_by) {
      io.to(`user_${task.assigned_by}`).emit("task:submitted", {
        taskId,
        taskTitle:       task.title,
        facultyName:     faculty.full_name || faculty.username,
        attachmentCount: savedFiles.filter(f => f.url).length,
        files:           savedFiles,
        submission_group_id: submissionGroupId,
      });
    }

    res.json({ success: true, files: savedFiles });
  } catch (err) {
    await conn.rollback();
    console.error("Submit task error:", err);
    res.status(500).json({ error: "Failed to submit task" });
  } finally {
    conn.release();
  }
});

