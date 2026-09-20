/**
 * Collaborative editing routes
 * Endpoints for document management, versions, and audit logs
 */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const collabController = require("../controllers/collabController");

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/collab-test/document/:taskId
 * Fetch or create a syllabus document for a task
 */
router.get("/document/:taskId", collabController.getOrCreateDocument);

/**
 * GET /api/collab-test/document/:documentId/versions
 * Fetch all versions of a document
 */
router.get("/document/:documentId/versions", collabController.getVersions);

/**
 * GET /api/collab-test/document/:documentId/audit
 * Fetch audit log for a document
 */
router.get("/document/:documentId/audit", collabController.getAuditLog);

/**
 * GET /api/collab-test/document/:documentId/version/:versionId
 * Fetch a specific version's snapshot
 */
router.get(
  "/document/:documentId/version/:versionId",
  collabController.getVersionSnapshot
);

/**
 * GET /api/collab-test/document/:documentId/status
 * Fetch document status
 */
router.get("/document/:documentId/status", collabController.getDocumentStatus);

module.exports = router;
