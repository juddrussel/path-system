// routes/workflow.routes.js
//
// React Flow save/load APIs for the Workflow Designer, plus the endpoints
// that start a workflow instance and check its status. Node/edge
// persistence follows the agreed architecture: workflows / workflow_nodes /
// workflow_edges are the single live DEFINITION (no versioning);
// workflow_instances / workflow_instance_transitions (via
// workflowExecution.service.js) track RUNTIME execution and are never
// touched by these save/load routes.

const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");
const { writeLog } = require("./audit.routes");
const workflowExecution = require("../services/workflowExecution.service");

// ─── AUTH MIDDLEWARE (same pattern as form.routes.js / task.routes.js) ───────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
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

// ─── HELPER: workflow_nodes row → the flat shape WorkflowDesigner.jsx
// already works with (x/y instead of position, assignedTo instead of
// assigned_to, etc.), so the frontend load path needs no reshaping. ───────
function nodeRowToFrontend(row) {
  return {
    id:              row.node_key,
    type:            row.node_type,
    kind:            row.node_kind,
    x:               row.position_x,
    y:               row.position_y,
    name:            row.name,
    description:     row.description,
    assignedTo:      row.assigned_to,
    requiredAction:  row.required_action,
    slaDays:         row.sla_days,
    priority:        row.priority,
    notifyFaculty:   !!row.notify_faculty,
    notifyAdmin:     !!row.notify_admin,
    executionConfig: row.execution_config,
  };
}

function edgeRowToFrontend(row) {
  return {
    id:    row.edge_key,
    from:  row.source_node_key,
    to:    row.target_node_key,
    label: row.label,
  };
}

// ─── HELPER: replace all nodes/edges for a workflow inside a transaction ──
// Full-replace (delete-then-insert) rather than diffing, matching the
// "one live definition, no versioning" decision — a Save/Publish click
// means the canvas state IS the new definition. total_sla_days is
// recomputed server-side from each node's sla_days rather than trusting
// whatever aggregate the client sends.
//
// IMPORTANT: expects each node to include `kind` (start/action/decision/
// end) — send NODE_TYPES[node.type].kind alongside the rest of the node
// fields in WorkflowDesigner.jsx's save payload. Falls back to 'action' if
// omitted so a save never 500s, but node_kind drives execution routing
// (see workflowExecution.service.js), so it should be sent correctly.
async function replaceNodesAndEdges(conn, workflowId, nodes = [], edges = []) {
  await conn.query("DELETE FROM workflow_edges WHERE workflow_id = ?", [workflowId]);
  await conn.query("DELETE FROM workflow_nodes WHERE workflow_id = ?", [workflowId]);

  let totalSlaDays = 0;

  for (const n of nodes) {
    if (!n.id || !n.type) continue; // skip malformed rows rather than failing the whole save
    const kind = n.kind || "action";
    totalSlaDays += Number(n.slaDays) || 0;

    await conn.query(
      `INSERT INTO workflow_nodes
         (workflow_id, node_key, node_type, node_kind, name, description, position_x, position_y,
          assigned_to, required_action, sla_days, priority, notify_faculty, notify_admin, execution_config)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        workflowId, n.id, n.type, kind, n.name || n.type, n.description || null,
        Math.round(n.x) || 0, Math.round(n.y) || 0,
        n.assignedTo || null, n.requiredAction || null, n.slaDays || null,
        n.priority || "Normal", n.notifyFaculty ? 1 : 0, n.notifyAdmin ? 1 : 0,
        n.executionConfig ? JSON.stringify(n.executionConfig) : null,
      ]
    );
  }

  for (const e of edges) {
    if (!e.from || !e.to) continue;
    const edgeKey = e.id || `e-${e.from}-${e.to}`;
    await conn.query(
      `INSERT INTO workflow_edges (workflow_id, edge_key, source_node_key, target_node_key, label)
       VALUES (?, ?, ?, ?, ?)`,
      [workflowId, edgeKey, e.from, e.to, e.label || null]
    );
  }

  await conn.query(
    "UPDATE workflows SET total_sla_days = ?, updated_at = NOW() WHERE id = ?",
    [totalSlaDays, workflowId]
  );
}

// ══════════════════════════════════════════════════════════════════════
// DEFINITION — save / load (React Flow)
// ══════════════════════════════════════════════════════════════════════

// ─── GET /api/workflows — list, for a picker / management screen ─────────
router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, description, status, version, total_sla_days, created_by, published_at, created_at, updated_at
       FROM workflows ORDER BY updated_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("GET /api/workflows error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/workflows/:id — full definition for the designer canvas ────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [wfRows] = await db.query("SELECT * FROM workflows WHERE id = ?", [req.params.id]);
    if (!wfRows.length) return res.status(404).json({ message: "Workflow not found." });

    const [nodeRows] = await db.query(
      "SELECT * FROM workflow_nodes WHERE workflow_id = ? ORDER BY id", [req.params.id]
    );
    const [edgeRows] = await db.query(
      "SELECT * FROM workflow_edges WHERE workflow_id = ? ORDER BY id", [req.params.id]
    );

    return res.json({
      ...wfRows[0],
      nodes: nodeRows.map(nodeRowToFrontend),
      edges: edgeRows.map(edgeRowToFrontend),
    });
  } catch (err) {
    console.error("GET /api/workflows/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/workflows — save as a NEW workflow ─────────────────────────
router.post("/", requireAuth, requireChairOrAdmin, async (req, res) => {
  const { name, description = "", status = "Draft", nodes = [], edges = [] } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: "name is required." });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO workflows (name, description, status, created_by, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [name.trim(), description, status, req.user.id]
    );
    const workflowId = result.insertId;

    await replaceNodesAndEdges(conn, workflowId, nodes, edges);

    await conn.commit();

    await writeLog({ userId: req.user.id, action: "WORKFLOW_CREATE", detail: `Created workflow "${name}" (#${workflowId})`, ipAddress: req.ip });

    const [rows] = await db.query("SELECT * FROM workflows WHERE id = ?", [workflowId]);
    return res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error("POST /api/workflows error:", err);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/workflows/:id — save (overwrite) an existing definition ────
// This is what the designer's "Save" button calls on every edit — full
// replace of nodes/edges, matching the "single live definition" decision.
router.put("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  const { name, description, nodes = [], edges = [] } = req.body;

  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query("SELECT * FROM workflows WHERE id = ?", [req.params.id]);
    if (!existing.length) { conn.release(); return res.status(404).json({ message: "Workflow not found." }); }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE workflows SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = NOW() WHERE id = ?`,
      [name?.trim() || null, description ?? null, req.params.id]
    );

    await replaceNodesAndEdges(conn, req.params.id, nodes, edges);

    await conn.commit();

    await writeLog({ userId: req.user.id, action: "WORKFLOW_UPDATE", detail: `Updated workflow "${existing[0].name}" (#${req.params.id})`, ipAddress: req.ip });

    const [rows] = await db.query("SELECT * FROM workflows WHERE id = ?", [req.params.id]);
    return res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error("PUT /api/workflows/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    conn.release();
  }
});

// ─── PATCH /api/workflows/:id/publish ─────────────────────────────────────
router.patch("/:id/publish", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM workflows WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Workflow not found." });

    const [nodeCount] = await db.query("SELECT COUNT(*) AS c FROM workflow_nodes WHERE workflow_id = ?", [req.params.id]);
    if (nodeCount[0].c === 0)
      return res.status(400).json({ message: "Cannot publish an empty workflow — add at least a start node." });

    await db.query(
      "UPDATE workflows SET status = 'Published', published_at = NOW(), updated_at = NOW() WHERE id = ?",
      [req.params.id]
    );
    await writeLog({ userId: req.user.id, action: "WORKFLOW_PUBLISH", detail: `Published workflow "${rows[0].name}" (#${req.params.id})`, ipAddress: req.ip });

    return res.json({ message: "Workflow published." });
  } catch (err) {
    console.error("PATCH /api/workflows/:id/publish error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/workflows/:id ────────────────────────────────────────────
router.delete("/:id", requireAuth, requireChairOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM workflows WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Workflow not found." });

    // workflow_instances.workflow_id is ON DELETE RESTRICT — a workflow
    // with execution history can't be deleted outright, by design. Catch
    // that below and tell the caller to archive instead.
    await db.query("DELETE FROM workflows WHERE id = ?", [req.params.id]);
    await writeLog({ userId: req.user.id, action: "WORKFLOW_DELETE", detail: `Deleted workflow "${rows[0].name}" (#${req.params.id})`, ipAddress: req.ip });
    return res.json({ message: "Workflow deleted." });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
      return res.status(409).json({ message: "This workflow has execution history and can't be deleted. Archive it instead." });
    }
    console.error("DELETE /api/workflows/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ══════════════════════════════════════════════════════════════════════
// EXECUTION — start an instance, check status
// ══════════════════════════════════════════════════════════════════════

// ─── POST /api/workflows/instances/start ──────────────────────────────────
// body: { workflow_id, subject_type: 'form_submission'|'task', subject_id }
router.post("/instances/start", requireAuth, async (req, res) => {
  const { workflow_id, subject_type, subject_id } = req.body;
  if (!workflow_id || !subject_type || !subject_id)
    return res.status(400).json({ message: "workflow_id, subject_type, and subject_id are required." });

  try {
    const instance = await workflowExecution.startWorkflowInstance({
      workflowId:  workflow_id,
      subjectType: subject_type,
      subjectId:   subject_id,
      initiatedBy: req.user.id,
    });
    return res.status(201).json(instance);
  } catch (err) {
    console.error("POST /api/workflows/instances/start error:", err);
    return res.status(400).json({ message: err.message || "Could not start workflow." });
  }
});

// ─── GET /api/workflows/instances/:subjectType/:subjectId — current status ─
router.get("/instances/:subjectType/:subjectId", requireAuth, async (req, res) => {
  try {
    const instance = await workflowExecution.findActiveInstance(req.params.subjectType, req.params.subjectId);
    if (!instance) return res.status(404).json({ message: "No active workflow instance for this record." });

    const [nodeRows] = await db.query(
      "SELECT * FROM workflow_nodes WHERE workflow_id = ? AND node_key = ?",
      [instance.workflow_id, instance.current_node_key]
    );

    return res.json({ instance, currentNode: nodeRows[0] ? nodeRowToFrontend(nodeRows[0]) : null });
  } catch (err) {
    console.error("GET /api/workflows/instances/:subjectType/:subjectId error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;