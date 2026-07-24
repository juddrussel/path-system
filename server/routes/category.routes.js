// routes/category.routes.js
const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const db      = require("../config/db");

// ─── AUTH MIDDLEWARE (same pattern as routes/form.routes.js) ────────────────
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

function requireReviewer(req, res, next) {
  if (!["admin", "program_chair"].includes(req.user?.role))
    return res.status(403).json({ message: "Reviewer access required." });
  next();
}

const FIELD_TYPES = ["Text Input", "Text Area", "Date", "Dropdown", "Number", "Checkbox", "File Upload"];
const VALID_TYPES   = ["Document", "Form"];
const VALID_STATUSES = ["Active", "Inactive", "Archived"];

// ─── CODE GENERATOR (mirrors the old frontend generateCategoryCode, but
//     checks the DB for uniqueness instead of an in-memory array) ────────────
async function generateUniqueCode(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let letters = words.map(w => w[0]).join("").toUpperCase().replace(/[^A-Z]/g, "");
  if (letters.length < 2) letters = (name.replace(/[^a-zA-Z]/g, "").toUpperCase() + "XXX").slice(0, 3);
  letters = letters.slice(0, 4) || "CAT";

  let n = 1;
  let candidate;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    candidate = `${letters}-${String(n).padStart(3, "0")}`;
    const [rows] = await db.query("SELECT id FROM document_categories WHERE code = ?", [candidate]);
    if (!rows.length) return candidate;
    n += 1;
  }
}

// ─── HELPER: attach formFields[] to a list of category rows ─────────────────
async function attachFields(categories) {
  if (!categories.length) return categories;
  const ids = categories.map(c => c.id);
  const [fieldRows] = await db.query(
    `SELECT * FROM category_fields WHERE category_id IN (?) ORDER BY category_id, sort_order, id`,
    [ids]
  );
  const byCategory = {};
  for (const f of fieldRows) {
    (byCategory[f.category_id] ||= []).push({
      id: f.id,
      name: f.name,
      fieldType: f.field_type,
      required: !!f.required,
    });
  }
  return categories.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    description: c.description || "",
    type: c.type,
    status: c.status,
    fields: (byCategory[c.id] || []).length,
    formFields: byCategory[c.id] || [],
    dateCreated: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }));
}

async function buildStats() {
  const [[{ total }]]    = await db.query("SELECT COUNT(*) AS total FROM document_categories");
  const [[{ active }]]   = await db.query("SELECT COUNT(*) AS active FROM document_categories WHERE status = 'Active'");
  const [[{ archived }]] = await db.query("SELECT COUNT(*) AS archived FROM document_categories WHERE status = 'Archived'");

  // "Used this month" = submissions this month whose `category` text
  // matches one of our category names (form_submissions.category stores
  // the category name as free text, same as routes/form.routes.js).
  let usedThisMonth = 0;
  try {
    const [[row]] = await db.query(
      `SELECT COUNT(*) AS used FROM form_submissions fs
       INNER JOIN document_categories dc ON dc.name = fs.category
       WHERE MONTH(fs.created_at) = MONTH(CURRENT_DATE())
         AND YEAR(fs.created_at) = YEAR(CURRENT_DATE())`
    );
    usedThisMonth = row.used;
  } catch (err) {
    // form_submissions may not exist in every environment; don't fail the whole request over it
    console.error("buildStats() usedThisMonth lookup failed:", err.message);
  }

  return { total, active, archived, usedThisMonth };
}

function validatePayload(body) {
  const { name, type, status, formFields } = body;
  if (!name || !name.trim()) return "name is required.";
  if (type && !VALID_TYPES.includes(type)) return `type must be one of ${VALID_TYPES.join(", ")}.`;
  if (status && !VALID_STATUSES.includes(status)) return `status must be one of ${VALID_STATUSES.join(", ")}.`;
  if (formFields) {
    if (!Array.isArray(formFields)) return "formFields must be an array.";
    for (const f of formFields) {
      if (!f.name || !f.name.trim()) return "Every form field needs a name.";
      if (f.fieldType && !FIELD_TYPES.includes(f.fieldType)) return `Invalid field type: ${f.fieldType}`;
    }
  }
  return null;
}

// ─── GET /api/categories — list (with optional ?status=&q=) ─────────────────
router.get("/", requireAuth, async (req, res) => {
  const { status = "", q = "" } = req.query;
  const like = `%${q}%`;

  try {
    const statusFilter = status && status !== "All" ? "AND status = ?" : "";
    const statusParam  = status && status !== "All" ? [status] : [];

    const [rows] = await db.query(
      `SELECT * FROM document_categories
       WHERE (name LIKE ? OR code LIKE ? OR description LIKE ?)
       ${statusFilter}
       ORDER BY created_at DESC`,
      [like, like, like, ...statusParam]
    );

    const categories = await attachFields(rows);
    const stats = await buildStats();

    return res.json({ categories, stats });
  } catch (err) {
    console.error("GET /categories error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── GET /api/categories/:id — single category ───────────────────────────────
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM document_categories WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Category not found." });

    const [full] = await attachFields(rows);
    return res.json(full);
  } catch (err) {
    console.error("GET /categories/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── POST /api/categories — create (reviewer only) ───────────────────────────
router.post("/", requireAuth, requireReviewer, async (req, res) => {
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ message: err });

  const { name, description = "", type = "Form", status = "Active" } = req.body;
  const formFields = type === "Document" ? [] : (req.body.formFields || []);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const code = await generateUniqueCode(name.trim());

    const [result] = await conn.query(
      `INSERT INTO document_categories (name, code, description, type, status, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name.trim(), code, description.trim(), type, status, req.user.id]
    );
    const categoryId = result.insertId;

    for (let i = 0; i < formFields.length; i++) {
      const f = formFields[i];
      await conn.query(
        `INSERT INTO category_fields (category_id, name, field_type, required, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [categoryId, f.name.trim(), f.fieldType || "Text Input", f.required ? 1 : 0, i]
      );
    }

    await conn.commit();

    const [rows] = await db.query("SELECT * FROM document_categories WHERE id = ?", [categoryId]);
    const [created] = await attachFields(rows);

    return res.status(201).json(created);
  } catch (err) {
    await conn.rollback();
    console.error("POST /categories error:", err);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    conn.release();
  }
});

// ─── PUT /api/categories/:id — update (reviewer only) ────────────────────────
router.put("/:id", requireAuth, requireReviewer, async (req, res) => {
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ message: err });

  const { name, description = "", type = "Form", status = "Active" } = req.body;
  const formFields = type === "Document" ? [] : (req.body.formFields || []);

  const conn = await db.getConnection();
  try {
    const [existing] = await conn.query("SELECT * FROM document_categories WHERE id = ?", [req.params.id]);
    if (!existing.length) {
      conn.release();
      return res.status(404).json({ message: "Category not found." });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE document_categories
       SET name = ?, description = ?, type = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [name.trim(), description.trim(), type, status, req.params.id]
    );

    // Replace fields wholesale — simplest way to keep sort_order in sync
    await conn.query("DELETE FROM category_fields WHERE category_id = ?", [req.params.id]);
    for (let i = 0; i < formFields.length; i++) {
      const f = formFields[i];
      await conn.query(
        `INSERT INTO category_fields (category_id, name, field_type, required, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, f.name.trim(), f.fieldType || "Text Input", f.required ? 1 : 0, i]
      );
    }

    await conn.commit();

    const [rows] = await db.query("SELECT * FROM document_categories WHERE id = ?", [req.params.id]);
    const [updated] = await attachFields(rows);

    return res.json(updated);
  } catch (err) {
    await conn.rollback();
    console.error("PUT /categories/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  } finally {
    conn.release();
  }
});

// ─── PATCH /api/categories/:id/status — archive / activate / deactivate ──────
router.patch("/:id/status", requireAuth, requireReviewer, async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({ message: `status must be one of ${VALID_STATUSES.join(", ")}.` });

  try {
    const [rows] = await db.query("SELECT id FROM document_categories WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Category not found." });

    await db.query("UPDATE document_categories SET status = ?, updated_at = NOW() WHERE id = ?", [status, req.params.id]);

    return res.json({ message: `Category ${status.toLowerCase()}.` });
  } catch (err) {
    console.error("PATCH /categories/:id/status error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── DELETE /api/categories/:id — permanently delete (reviewer only) ─────────
router.delete("/:id", requireAuth, requireReviewer, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id FROM document_categories WHERE id = ?", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Category not found." });

    await db.query("DELETE FROM document_categories WHERE id = ?", [req.params.id]); // category_fields cascade

    return res.json({ message: "Category deleted." });
  } catch (err) {
    console.error("DELETE /categories/:id error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
