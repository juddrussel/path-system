// services/workflowExecution.service.js
//
// Workflow execution engine — walks a workflow_nodes/workflow_edges
// DEFINITION at runtime, tracked via workflow_instances /
// workflow_instance_transitions.
//
// This file does NOT reimplement approve / reject / return-for-revision /
// task assignment. Those stay exactly as they are in form.routes.js and
// task.routes.js. This service is CALLED FROM those existing handlers
// (a few extra lines placed after their existing DB update — see the
// try/catch blocks added there), so:
//   - a form/task never attached to any workflow behaves identically to
//     today, because findActiveInstance() returns null and advanceWorkflow
//     short-circuits to a no-op
//   - a workflow error can never roll back or block an approval/rejection/
//     return that already succeeded in form_submissions/tasks, because the
//     hook is wrapped in try/catch on the caller side and this service
//     never touches form_submissions/tasks itself
//
// No import from ../routes/task.routes.js or ../routes/form.routes.js on
// purpose — see utils/taskTrackingId.js for why (circular-require).

const db = require("../config/db");
const { writeLog } = require("../routes/audit.routes");
const { insertTaskWithUniqueTrackingId } = require("../utils/taskTrackingId");

// ─── internal: read one node definition row ──────────────────────────────
async function getNode(workflowId, nodeKey) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_nodes WHERE workflow_id = ? AND node_key = ?",
    [workflowId, nodeKey]
  );
  return rows[0] || null;
}

// ─── internal: find the (single) start node of a workflow ───────────────
async function getStartNode(workflowId) {
  const [rows] = await db.query(
    "SELECT * FROM workflow_nodes WHERE workflow_id = ? AND node_kind = 'start' LIMIT 1",
    [workflowId]
  );
  return rows[0] || null;
}

// ─── internal: pick the outgoing edge for a node given an edgeLabel ──────
// Decision nodes have multiple labeled edges (e.g. 'Approved' / 'Rejected').
// Action/start nodes normally have exactly one, often-unlabeled, outgoing
// edge — if no label matches but there's exactly one edge, take it, so
// action nodes work without callers needing to know/pass a label.
async function pickOutgoingEdge(workflowId, sourceNodeKey, edgeLabel) {
  const [edges] = await db.query(
    "SELECT * FROM workflow_edges WHERE workflow_id = ? AND source_node_key = ?",
    [workflowId, sourceNodeKey]
  );
  if (edges.length === 0) return null;

  if (edgeLabel) {
    const match = edges.find(e => (e.label || "").toLowerCase() === edgeLabel.toLowerCase());
    if (match) return match;
  }
  return edges.length === 1 ? edges[0] : null;
}

// ─── internal: which workflow_instances column a subject type maps to ───
function subjectColumn(subjectType) {
  if (subjectType === "form_submission") return "form_submission_id";
  if (subjectType === "task") return "task_id";
  throw new Error(`Unknown subject_type "${subjectType}". Expected "form_submission" or "task".`);
}

// ═══════════════════════════════════════════════════════════════════════
// findAutoTriggerWorkflow
// Look up a Published workflow whose auto_trigger_category matches the
// given category (e.g. a form_submission's category). Returns null if
// none match — the normal case for any category that hasn't had a
// workflow configured for it, or when auto-trigger isn't used at all.
// If more than one Published workflow somehow shares a category, the most
// recently published one wins rather than erroring — auto-start should
// never block a form submission over an ambiguous workflow config.
// ═══════════════════════════════════════════════════════════════════════
async function findAutoTriggerWorkflow(category) {
  if (!category) return null;
  const [rows] = await db.query(
    `SELECT * FROM workflows
     WHERE status = 'Published' AND auto_trigger_category = ?
     ORDER BY published_at DESC LIMIT 1`,
    [category]
  );
  return rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════
// findActiveInstance
// Look up the Active workflow_instances row for a given form_submission or
// task, if any. Returns null if this record isn't attached to a workflow —
// the normal case for anything created before the designer existed, or
// created without a workflow attached.
// ═══════════════════════════════════════════════════════════════════════
async function findActiveInstance(subjectType, subjectId) {
  const col = subjectColumn(subjectType);
  const [rows] = await db.query(
    `SELECT * FROM workflow_instances WHERE status = 'Active' AND ${col} = ? ORDER BY id DESC LIMIT 1`,
    [subjectId]
  );
  return rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════
// startWorkflowInstance
// Begin executing a workflow definition against a real form_submission or
// task row. Places the instance at the workflow's start node and writes
// the initial transition row (from_node_key = NULL). Idempotent — calling
// it again for a subject that already has an Active instance just returns
// that instance rather than creating a second one.
// ═══════════════════════════════════════════════════════════════════════
async function startWorkflowInstance({ workflowId, subjectType, subjectId, initiatedBy }) {
  const col = subjectColumn(subjectType);

  const existing = await findActiveInstance(subjectType, subjectId);
  if (existing) return existing;

  const startNode = await getStartNode(workflowId);
  if (!startNode) {
    throw new Error(`Workflow ${workflowId} has no start node — cannot begin execution.`);
  }

  const conn = await db.getConnection();
  let instanceId;
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO workflow_instances (workflow_id, ${col}, current_node_key, status, initiated_by, started_at)
       VALUES (?, ?, ?, 'Active', ?, NOW())`,
      [workflowId, subjectId, startNode.node_key, initiatedBy || null]
    );
    instanceId = result.insertId;

    await conn.query(
      `INSERT INTO workflow_instance_transitions (instance_id, from_node_key, to_node_key, edge_label, action_taken, performed_by)
       VALUES (?, NULL, ?, NULL, 'Workflow Started', ?)`,
      [instanceId, startNode.node_key, initiatedBy || null]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  await writeLog({
    userId: initiatedBy || null,
    action: "WORKFLOW_START",
    detail: `Started workflow ${workflowId} for ${subjectType} #${subjectId} at node "${startNode.name}"`,
  });

  const [rows] = await db.query("SELECT * FROM workflow_instances WHERE id = ?", [instanceId]);
  const instance = rows[0];

  // A start node can itself carry an entry action (e.g. auto-assign a
  // task) — run it the same way any other node's arrival would.
  await runNodeEntryAction(instance, startNode, initiatedBy);

  return instance;
}

// ═══════════════════════════════════════════════════════════════════════
// advanceWorkflow
// Move an instance from its current node to the next one, along the edge
// matching edgeLabel. This is what form.routes.js / task.routes.js call
// right after their existing approve/reject/return logic runs — it never
// runs instead of that logic, and never blocks it (callers wrap this in
// try/catch).
//
// If the record isn't attached to an Active instance, this is a no-op
// (returns null).
// ═══════════════════════════════════════════════════════════════════════
async function advanceWorkflow({ subjectType, subjectId, edgeLabel, actionTaken, performedBy, notes }) {
  const instance = await findActiveInstance(subjectType, subjectId);
  if (!instance) return null;

  const edge = await pickOutgoingEdge(instance.workflow_id, instance.current_node_key, edgeLabel);

  const conn = await db.getConnection();
  let targetNode = null;
  let isEndNode  = false;

  try {
    await conn.beginTransaction();

    if (!edge) {
      // No matching outgoing edge from here → dead end. A "Rejected"-style
      // label ends the instance as Rejected; anything else (e.g. reaching
      // an End node with no further edges) just completes it.
      const finalStatus = /reject/i.test(edgeLabel || "") ? "Rejected" : "Completed";

      await conn.query(
        "UPDATE workflow_instances SET status = ?, completed_at = NOW(), updated_at = NOW() WHERE id = ?",
        [finalStatus, instance.id]
      );
      await conn.query(
        `INSERT INTO workflow_instance_transitions (instance_id, from_node_key, to_node_key, edge_label, action_taken, performed_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [instance.id, instance.current_node_key, instance.current_node_key, edgeLabel || null, actionTaken || null, performedBy || null, notes || null]
      );

      await conn.commit();
      return { instance: { ...instance, status: finalStatus }, node: null, ended: true };
    }

    targetNode = await getNode(instance.workflow_id, edge.target_node_key);
    isEndNode  = targetNode?.node_kind === "end";

    await conn.query(
      `UPDATE workflow_instances
       SET current_node_key = ?, status = ?, completed_at = ?, updated_at = NOW()
       WHERE id = ?`,
      [edge.target_node_key, isEndNode ? "Completed" : "Active", isEndNode ? new Date() : null, instance.id]
    );

    await conn.query(
      `INSERT INTO workflow_instance_transitions (instance_id, from_node_key, to_node_key, edge_label, action_taken, performed_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [instance.id, instance.current_node_key, edge.target_node_key, edge.label || null, actionTaken || null, performedBy || null, notes || null]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [rows] = await db.query("SELECT * FROM workflow_instances WHERE id = ?", [instance.id]);
  const updatedInstance = rows[0];

  if (!isEndNode) {
    // Side effect (e.g. auto-creating a task) runs after commit, so a
    // failure here never rolls back the state transition that already
    // reflects the real-world approve/reject/return that just happened.
    await runNodeEntryAction(updatedInstance, targetNode, performedBy);
  }

  return { instance: updatedInstance, node: targetNode, ended: isEndNode };
}

// ═══════════════════════════════════════════════════════════════════════
// runNodeEntryAction
// Side effects that fire when an instance ARRIVES at a node. Currently
// handles auto-creating a `tasks` row for a 'task_assignment' node, using
// the same collision-safe tracking-id logic your POST /api/tasks route
// uses (imported from utils/taskTrackingId.js, not reimplemented here).
//
// Extend this for other node types (e.g. a 'notification' kind) as those
// are added to NODE_TYPES on the frontend.
// ═══════════════════════════════════════════════════════════════════════
async function runNodeEntryAction(instance, node, actorUserId) {
  if (!node) return;

  if (node.node_kind === "action" && node.node_type === "task_assignment") {
    await createTaskForNode(node, actorUserId);
  }
}

// ─── internal: resolve a workflow node's assigned_to ROLE into a user id ─
// workflow_nodes.assigned_to stores a role label (e.g. 'Faculty'), same as
// the designer's assignee picker — not a specific user — so this picks the
// first active user with that role. If your NODE_TYPES/ConnectorPanel later
// lets a node target a specific user instead of a role, prefer that id
// directly rather than going through this lookup.
async function resolveAssigneeUserId(assignedToRole) {
  if (!assignedToRole) return null;
  const [rows] = await db.query(
    "SELECT id FROM users WHERE role = ? AND is_active = 1 ORDER BY id LIMIT 1",
    [assignedToRole]
  );
  return rows[0]?.id || null;
}

// ─── internal: create a `tasks` row for a task_assignment node ──────────
async function createTaskForNode(node, actorUserId) {
  const facultyId = await resolveAssigneeUserId(node.assigned_to);
  if (!facultyId) {
    console.warn(`[workflow] node "${node.name}" has assigned_to="${node.assigned_to}" but no matching active user — task not created.`);
    return null;
  }

  const deadline = node.sla_days
    ? new Date(Date.now() + node.sla_days * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day fallback if the node has no SLA set

  const { tracking_id, result } = await insertTaskWithUniqueTrackingId((tid) =>
    db.query(
      `INSERT INTO tasks (tracking_id, faculty_id, assigned_by, title, priority, deadline, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
      [tid, facultyId, actorUserId || null, node.name, node.priority || "Medium", deadline, node.description || null]
    ).then(([r]) => r)
  );

  const taskId = result.insertId;

  await writeLog({
    userId: actorUserId || null,
    action: "TASK_ASSIGN",
    detail: `Workflow auto-assigned task "${node.name}" (${tracking_id}) to user ${facultyId}`,
  });

  return { taskId, tracking_id, facultyId };
}

module.exports = {
  startWorkflowInstance,
  advanceWorkflow,
  findActiveInstance,
  findAutoTriggerWorkflow,
};