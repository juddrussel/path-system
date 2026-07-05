// routes/workflow.routes.js
const express  = require("express");
const router   = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  createWorkflow,
  getAllWorkflows,
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow,
} = require("../controllers/workflow.controller");

// All workflow endpoints require a valid JWT + Admin or Program Chair role
const guard = [requireAuth, requireRole("admin", "Program Chair")];

// POST   /api/workflows
router.post("/",     ...guard, createWorkflow);

// GET    /api/workflows          ?status=Draft&search=foo&page=1&limit=20
router.get("/",      ...guard, getAllWorkflows);

// GET    /api/workflows/:id
router.get("/:id",   ...guard, getWorkflowById);

// PUT    /api/workflows/:id
router.put("/:id",   ...guard, updateWorkflow);

// DELETE /api/workflows/:id
router.delete("/:id", ...guard, deleteWorkflow);

module.exports = router;
