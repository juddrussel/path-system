// models/Workflow.js
const db = require("../config/db");

const VALID_STATUSES = ["Draft", "Published", "Archived"];

const WorkflowModel = {
  // ── Create ────────────────────────────────────────────────────────────────
  async create({ name, description, status = "Draft", created_by }) {
    const [result] = await db.execute(
      `INSERT INTO workflows (name, description, status, created_by)
       VALUES (?, ?, ?, ?)`,
      [name, description ?? null, status, created_by]
    );
    return this.findById(result.insertId);
  },

  // ── Read: list (paginated + filterable) ──────────────────────────────────
  async findAll({ status, search, limit = 20, offset = 0 } = {}) {
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }
    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await db.execute(
      `SELECT id, name, description, status, created_by, created_at, updated_at
       FROM workflows
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );
    return rows;
  },

  // ── Read: single ─────────────────────────────────────────────────────────
  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, description, status, created_by, created_at, updated_at
       FROM workflows WHERE id = ?`,
      [id]
    );
    return rows[0] ?? null;
  },

  // ── Count (for pagination) ───────────────────────────────────────────────
  async count({ status, search } = {}) {
    const conditions = [];
    const params = [];
    if (status) { conditions.push("status = ?"); params.push(status); }
    if (search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total FROM workflows ${where}`, params
    );
    return rows[0].total;
  },

  // ── Update ────────────────────────────────────────────────────────────────
  async update(id, { name, description, status }) {
    const fields = [];
    const params = [];
    if (name !== undefined)        { fields.push("name = ?");        params.push(name); }
    if (description !== undefined) { fields.push("description = ?"); params.push(description); }
    if (status !== undefined)      { fields.push("status = ?");      params.push(status); }
    if (!fields.length) return this.findById(id);
    params.push(id);
    await db.execute(
      `UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`, params
    );
    return this.findById(id);
  },

  // ── Delete ────────────────────────────────────────────────────────────────
  async delete(id) {
    const [result] = await db.execute("DELETE FROM workflows WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  VALID_STATUSES,
};

module.exports = WorkflowModel;
