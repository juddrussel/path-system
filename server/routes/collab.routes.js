/**
 * Collaborative editing routes
 * Endpoints for document management, versions, audit logs, and workflow
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

/**
 * POST /api/collab-test/document/:documentId/request-review
 * Change status from 'draft' to 'review_requested'
 */
router.post(
  "/document/:documentId/request-review",
  collabController.requestReview
);

/**
 * POST /api/collab-test/document/:documentId/reopen
 * Change status from 'review_requested' back to 'draft'
 */
router.post("/document/:documentId/reopen", collabController.reopenDocument);

/**
 * POST /api/collab-test/document/:documentId/submit
 * Change status from 'approved' to 'submitted'
 */
router.post("/document/:documentId/submit", collabController.submitDocument);

/**
 * GET /api/collab-test/document/:documentId/approvals
 * Fetch approval status for current version
 */
router.get("/document/:documentId/approvals", collabController.getApprovals);

module.exports = router;
