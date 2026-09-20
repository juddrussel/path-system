/**
 * Collaborative editing controller
 * Handles document lifecycle, versions, and audit logs
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

module.exports = {
  getOrCreateDocument,
  getVersions,
  getAuditLog,
  getVersionSnapshot,
  getDocumentStatus,
};
