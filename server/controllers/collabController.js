/**
 * Collaborative editing controller
 * Handles document lifecycle, versions, audit logs, and workflow
 */

const db = require("../config/db");

/**
 * GET /api/collab-test/document/:taskId
 * Fetch or create a syllabus document for a task
 */
async function getOrCreateDocument(req, res) {
  const { taskId } = req.params;
  const userId = req.user.id;

  try {
    // Check if document already exists
    const [[existingDoc]] = await db.query(
      "SELECT id, task_id, status FROM syllabus_documents WHERE task_id = ?",
      [taskId]
    );

    if (existingDoc) {
      return res.json({
        id: existingDoc.id,
        taskId: existingDoc.task_id,
        status: existingDoc.status,
        created: false,
      });
    }

    // Create new document
    const [result] = await db.query(
      `INSERT INTO syllabus_documents (task_id, status, created_by, created_at, updated_at)
       VALUES (?, 'draft', ?, NOW(), NOW())`,
      [taskId, userId]
    );

    // Log creation
    await db.query(
      `INSERT INTO document_audit_log (document_id, user_id, action, summary, created_at)
       VALUES (?, ?, 'created', 'Document created', NOW())`,
      [result.insertId, userId]
    );

    return res.json({
      id: result.insertId,
      taskId,
      status: "draft",
      created: true,
    });
  } catch (err) {
    console.error("[Collab] getOrCreateDocument failed:", err.message);
    res.status(500).json({ message: "Failed to create document" });
  }
}

/**
 * GET /api/collab-test/document/:documentId/versions
 * Fetch all versions of a document
 */
async function getVersions(req, res) {
  const { documentId } = req.params;

  try {
    const [versions] = await db.query(
      `SELECT v.id, v.document_id, v.version_no, v.kind, v.content_hash, v.created_by, 
              u.full_name, v.label, v.created_at
       FROM document_versions v
       LEFT JOIN users u ON v.created_by = u.id
       WHERE v.document_id = ?
       ORDER BY v.version_no DESC`,
      [documentId]
    );

    res.json(versions);
  } catch (err) {
    console.error("[Collab] getVersions failed:", err.message);
    res.status(500).json({ message: "Failed to fetch versions" });
  }
}

/**
 * GET /api/collab-test/document/:documentId/audit
 * Fetch audit log for a document
 */
async function getAuditLog(req, res) {
  const { documentId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  try {
    const [logs] = await db.query(
      `SELECT a.id, a.document_id, a.user_id, a.section_key, a.action, a.summary, 
              a.version_id, a.created_at, u.full_name, u.email
       FROM document_audit_log a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.document_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [documentId, parseInt(limit), parseInt(offset)]
    );

    // Get total count
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) as total FROM document_audit_log WHERE document_id = ?",
      [documentId]
    );

    res.json({
      logs,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error("[Collab] getAuditLog failed:", err.message);
    res.status(500).json({ message: "Failed to fetch audit log" });
  }
}

/**
 * GET /api/collab-test/document/:documentId/version/:versionId
 * Fetch a specific version's snapshot
 */
async function getVersionSnapshot(req, res) {
  const { documentId, versionId } = req.params;

  try {
    const [[version]] = await db.query(
      `SELECT id, version_no, kind, snapshot, created_by, created_at
       FROM document_versions
       WHERE id = ? AND document_id = ?`,
      [versionId, documentId]
    );

    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    res.json(version);
  } catch (err) {
    console.error("[Collab] getVersionSnapshot failed:", err.message);
    res.status(500).json({ message: "Failed to fetch version" });
  }
}

/**
 * GET /api/collab-test/document/:documentId/status
 * Fetch document status
 */
async function getDocumentStatus(req, res) {
  const { documentId } = req.params;

  try {
    const [[doc]] = await db.query(
      "SELECT id, task_id, status, current_version_id, updated_at FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(doc);
  } catch (err) {
    console.error("[Collab] getDocumentStatus failed:", err.message);
    res.status(500).json({ message: "Failed to fetch document status" });
  }
}

/**
 * POST /api/collab-test/document/:documentId/request-review
 * Change status from 'draft' to 'review_requested'
 * Creates a checkpoint version labeled 'submitted_for_review'
 */
async function requestReview(req, res) {
  const { documentId } = req.params;
  const userId = req.user.id;
  const io = req.app.get("io");

  try {
    // Fetch current document
    const [[doc]] = await db.query(
      "SELECT task_id, status FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (doc.status !== "draft") {
      return res
        .status(400)
        .json({ message: `Cannot request review: document is ${doc.status}` });
    }

    // Get latest version to snapshot
    const [[latestVersion]] = await db.query(
      `SELECT id, version_no FROM document_versions WHERE document_id = ? ORDER BY version_no DESC LIMIT 1`,
      [documentId]
    );

    const nextVersionNo = (latestVersion?.version_no || 0) + 1;

    // Create checkpoint version
    const [versionResult] = await db.query(
      `INSERT INTO document_versions (document_id, version_no, kind, label, created_by, created_at)
       SELECT ?, ?, 'checkpoint', 'submitted_for_review', ?, NOW()
       FROM document_versions WHERE id = ? LIMIT 1`,
      [documentId, nextVersionNo, userId, latestVersion?.id]
    );

    // Update document status
    await db.query(
      "UPDATE syllabus_documents SET status = 'review_requested', current_version_id = ?, updated_at = NOW() WHERE id = ?",
      [versionResult.insertId, documentId]
    );

    // Audit log
    await db.query(
      `INSERT INTO document_audit_log (document_id, user_id, action, summary, version_id, created_at)
       VALUES (?, ?, 'request_review', 'Submitted for review', ?, NOW())`,
      [documentId, userId, versionResult.insertId]
    );

    // Notify collaborators via Socket.io
    io.to(`task_${doc.task_id}`).emit("document_status_changed", {
      documentId,
      taskId: doc.task_id,
      status: "review_requested",
      changedBy: req.user.full_name,
      timestamp: new Date(),
    });

    res.json({
      documentId,
      status: "review_requested",
      versionId: versionResult.insertId,
    });
  } catch (err) {
    console.error("[Collab] requestReview failed:", err.message);
    res.status(500).json({ message: "Failed to request review" });
  }
}

/**
 * POST /api/collab-test/document/:documentId/reopen
 * Change status from 'review_requested' back to 'draft'
 * Allows further editing if review is incomplete
 */
async function reopenDocument(req, res) {
  const { documentId } = req.params;
  const userId = req.user.id;
  const io = req.app.get("io");

  try {
    // Fetch current document
    const [[doc]] = await db.query(
      "SELECT task_id, status FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (doc.status !== "review_requested") {
      return res
        .status(400)
        .json({ message: `Cannot reopen: document is ${doc.status}` });
    }

    // Update status back to draft
    await db.query(
      "UPDATE syllabus_documents SET status = 'draft', updated_at = NOW() WHERE id = ?",
      [documentId]
    );

    // Audit log
    await db.query(
      `INSERT INTO document_audit_log (document_id, user_id, action, summary, created_at)
       VALUES (?, ?, 'reopen', 'Document reopened for editing', NOW())`,
      [documentId, userId]
    );

    // Notify collaborators
    io.to(`task_${doc.task_id}`).emit("document_status_changed", {
      documentId,
      taskId: doc.task_id,
      status: "draft",
      changedBy: req.user.full_name,
      timestamp: new Date(),
    });

    res.json({ documentId, status: "draft" });
  } catch (err) {
    console.error("[Collab] reopenDocument failed:", err.message);
    res.status(500).json({ message: "Failed to reopen document" });
  }
}

/**
 * POST /api/collab-test/document/:documentId/submit
 * Change status from 'approved' to 'submitted'
 * Final submission after all approvals
 */
async function submitDocument(req, res) {
  const { documentId } = req.params;
  const userId = req.user.id;
  const io = req.app.get("io");

  try {
    // Fetch current document
    const [[doc]] = await db.query(
      "SELECT task_id, status FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (doc.status !== "approved") {
      return res
        .status(400)
        .json({ message: `Cannot submit: document must be 'approved', currently ${doc.status}` });
    }

    // Check all required approvals are in place
    const [[{ approvalCount }]] = await db.query(
      `SELECT COUNT(*) as approvalCount FROM approvals 
       WHERE task_id = ? AND version_id = (SELECT current_version_id FROM syllabus_documents WHERE id = ?)
       AND status = 'approved'`,
      [doc.task_id, documentId]
    );

    if (approvalCount === 0) {
      return res
        .status(400)
        .json({ message: "No approvals found for current version" });
    }

    // Update status to submitted
    await db.query(
      "UPDATE syllabus_documents SET status = 'submitted', updated_at = NOW() WHERE id = ?",
      [documentId]
    );

    // Audit log
    await db.query(
      `INSERT INTO document_audit_log (document_id, user_id, action, summary, created_at)
       VALUES (?, ?, 'submit', 'Syllabus submitted', NOW())`,
      [documentId, userId]
    );

    // Notify collaborators
    io.to(`task_${doc.task_id}`).emit("document_status_changed", {
      documentId,
      taskId: doc.task_id,
      status: "submitted",
      changedBy: req.user.full_name,
      timestamp: new Date(),
    });

    res.json({ documentId, status: "submitted" });
  } catch (err) {
    console.error("[Collab] submitDocument failed:", err.message);
    res.status(500).json({ message: "Failed to submit document" });
  }
}

/**
 * GET /api/collab-test/document/:documentId/approvals
 * Fetch approval status for current version
 */
async function getApprovals(req, res) {
  const { documentId } = req.params;

  try {
    const [[doc]] = await db.query(
      "SELECT task_id, current_version_id FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    const [approvals] = await db.query(
      `SELECT a.id, a.user_id, a.status, a.comment, a.decided_at, u.full_name, u.email
       FROM approvals a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.task_id = ? AND a.version_id = ?
       ORDER BY a.decided_at DESC`,
      [doc.task_id, doc.current_version_id]
    );

    res.json({ approvals, versionId: doc.current_version_id });
  } catch (err) {
    console.error("[Collab] getApprovals failed:", err.message);
    res.status(500).json({ message: "Failed to fetch approvals" });
  }
}

module.exports = {
  getOrCreateDocument,
  getVersions,
  getAuditLog,
  getVersionSnapshot,
  getDocumentStatus,
  requestReview,
  reopenDocument,
  submitDocument,
  getApprovals,
};
