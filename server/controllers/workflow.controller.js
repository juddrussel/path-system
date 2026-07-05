// controllers/workflow.controller.js
const WorkflowModel = require("../models/Workflow");

// ── POST /api/workflows ───────────────────────────────────────────────────────
const createWorkflow = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Workflow name is required." });
    }
    if (status && !WorkflowModel.VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${WorkflowModel.VALID_STATUSES.join(", ")}.`,
      });
    }

    const workflow = await WorkflowModel.create({
      name:        name.trim(),
      description: description?.trim() ?? null,
      status:      status ?? "Draft",
      created_by:  req.user.id,
    });

    // Notify all clients watching the workflow list
    req.app.get("io")?.emit("workflow_created", workflow);

    return res.status(201).json({ message: "Workflow created successfully.", data: workflow });
  } catch (err) {
    console.error("[createWorkflow]", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── GET /api/workflows ────────────────────────────────────────────────────────
const getAllWorkflows = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    if (status && !WorkflowModel.VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status filter. Must be one of: ${WorkflowModel.VALID_STATUSES.join(", ")}.`,
      });
    }

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const [workflows, total] = await Promise.all([
      WorkflowModel.findAll({ status, search, limit: limitNum, offset }),
      WorkflowModel.count({ status, search }),
    ]);

    return res.status(200).json({
      data: workflows,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error("[getAllWorkflows]", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── GET /api/workflows/:id ────────────────────────────────────────────────────
const getWorkflowById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid workflow ID." });

    const workflow = await WorkflowModel.findById(id);
    if (!workflow) return res.status(404).json({ message: "Workflow not found." });

    return res.status(200).json({ data: workflow });
  } catch (err) {
    console.error("[getWorkflowById]", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── PUT /api/workflows/:id ────────────────────────────────────────────────────
const updateWorkflow = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid workflow ID." });

    const existing = await WorkflowModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Workflow not found." });

    const { name, description, status } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ message: "Workflow name cannot be empty." });
    }
    if (status !== undefined && !WorkflowModel.VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${WorkflowModel.VALID_STATUSES.join(", ")}.`,
      });
    }

    const updated = await WorkflowModel.update(id, {
      name:        name?.trim(),
      description: description?.trim(),
      status,
    });

    // Notify anyone viewing this workflow in real-time
    req.app.get("io")?.to(`workflow_${id}`).emit("workflow_updated", updated);

    return res.status(200).json({ message: "Workflow updated successfully.", data: updated });
  } catch (err) {
    console.error("[updateWorkflow]", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ── DELETE /api/workflows/:id ─────────────────────────────────────────────────
const deleteWorkflow = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid workflow ID." });

    const existing = await WorkflowModel.findById(id);
    if (!existing) return res.status(404).json({ message: "Workflow not found." });

    if (existing.status === "Published") {
      return res.status(409).json({
        message: "Cannot delete a Published workflow. Archive it first.",
      });
    }

    await WorkflowModel.delete(id);

    req.app.get("io")?.emit("workflow_deleted", { id });

    return res.status(200).json({ message: `Workflow "${existing.name}" deleted successfully.` });
  } catch (err) {
    console.error("[deleteWorkflow]", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { createWorkflow, getAllWorkflows, getWorkflowById, updateWorkflow, deleteWorkflow };
