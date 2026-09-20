/**
 * Hocuspocus Collaborative Server
 * Handles real-time Yjs synchronization with auth, persistence (Phase 2), and read-only enforcement (Phase 3)
 * 
 * Port: configured via HOCUSPOCUS_PORT env var (default 1234)
 * Auth: JWT token from Authorization header or query param
 */

const { Server } = require("@hocuspocus/server");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Y = require("yjs");

const HOCUSPOCUS_PORT = process.env.HOCUSPOCUS_PORT || 1234;
const JWT_SECRET = process.env.JWT_SECRET;
const DEBOUNCE_MS = 2000; // Save every 2 seconds if changed

// Track active editors per document for audit logging
const activeEditors = new Map(); // documentId -> Set of userId

// ─── Helper: Verify JWT and get user context ──────────────────────────────
async function authenticateConnection(token) {
  try {
    if (!token || !JWT_SECRET) {
      return null;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      full_name: decoded.full_name,
    };
  } catch (err) {
    console.error("[Hocuspocus] JWT verification failed:", err.message);
    return null;
  }
}

// ─── Helper: Check if user is a collaborator on this document's task ───────
async function isUserCollaborator(userId, documentId) {
  try {
    const [[doc]] = await db.query(
      "SELECT task_id FROM syllabus_documents WHERE id = ?",
      [documentId]
    );
    if (!doc) return false;

    const [[collab]] = await db.query(
      "SELECT id FROM task_collaborators WHERE task_id = ? AND user_id = ?",
      [doc.task_id, userId]
    );
    return !!collab;
  } catch (err) {
    console.error("[Hocuspocus] Collaborator check failed:", err.message);
    return false;
  }
}

// ─── Helper: Get document status (for read-only enforcement in Phase 3) ────
async function getDocumentStatus(documentId) {
  try {
    const [[doc]] = await db.query(
      "SELECT status FROM syllabus_documents WHERE id = ?",
      [documentId]
    );
    return doc?.status || "draft";
  } catch (err) {
    console.error("[Hocuspocus] Status check failed:", err.message);
    return "draft";
  }
}

// ─── Helper: Calculate SHA-256 hash of snapshot ────────────────────────────
function hashSnapshot(snapshot) {
  return crypto.createHash("sha256").update(snapshot).digest("hex");
}

// ─── Helper: Extract JSON content from Yjs document ────────────────────────
function extractSnapshot(ydoc) {
  const snapshot = {};
  for (const [key] of ydoc.share) {
    const type = ydoc.getMap().get(key) || ydoc.getArray(key) || ydoc.getText(key);
    if (type) {
      try {
        snapshot[key] = Y.encodeStateAsUpdate(ydoc);
      } catch (e) {
        snapshot[key] = ""; // Fallback
      }
    }
  }
  return JSON.stringify(snapshot);
}

// ─── Helper: Save document version to DB ──────────────────────────────────
async function saveVersion(documentId, ydocState, kind = "autosave", userId) {
  try {
    const snapshot = extractSnapshot(ydocState);
    const contentHash = hashSnapshot(snapshot);

    // Check if this content has already been saved (avoid duplicates)
    const [[lastVersion]] = await db.query(
      `SELECT id, content_hash FROM document_versions 
       WHERE document_id = ? 
       ORDER BY version_no DESC LIMIT 1`,
      [documentId]
    );

    if (lastVersion && lastVersion.content_hash === contentHash) {
      console.log(`[Hocuspocus] Content unchanged, skipping save for doc ${documentId}`);
      return null;
    }

    // Get next version number
    const nextVersionNo = (lastVersion?.version_no || 0) + 1;

    // Insert version
    const [result] = await db.query(
      `INSERT INTO document_versions 
       (document_id, version_no, kind, snapshot, content_hash, ydoc_state, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        documentId,
        nextVersionNo,
        kind,
        snapshot,
        contentHash,
        ydocState, // LONGBLOB
        userId,
      ]
    );

    console.log(`[Hocuspocus] Saved version ${nextVersionNo} for doc ${documentId}`);

    // Write audit entry
    await db.query(
      `INSERT INTO document_audit_log (document_id, user_id, action, summary, version_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        documentId,
        userId,
        "autosave",
        `Auto-saved version ${nextVersionNo}`,
        result.insertId,
      ]
    );

    return result.insertId;
  } catch (err) {
    console.error("[Hocuspocus] saveVersion failed:", err.message);
    return null;
  }
}

// ─── Helper: Load document state from DB ──────────────────────────────────
async function loadDocumentState(documentId) {
  try {
    const [[doc]] = await db.query(
      "SELECT ydoc_state FROM syllabus_documents WHERE id = ?",
      [documentId]
    );

    if (doc && doc.ydoc_state) {
      console.log(`[Hocuspocus] Loaded ydoc_state for doc ${documentId}`);
      return doc.ydoc_state;
    }

    console.log(`[Hocuspocus] No saved state for doc ${documentId}, using blank`);
    return null;
  } catch (err) {
    console.error("[Hocuspocus] loadDocumentState failed:", err.message);
    return null;
  }
}

// ─── Helper: Update document's ydoc_state in DB ────────────────────────────
async function updateDocumentState(documentId, ydocState) {
  try {
    await db.query(
      "UPDATE syllabus_documents SET ydoc_state = ?, updated_at = NOW() WHERE id = ?",
      [ydocState, documentId]
    );
  } catch (err) {
    console.error("[Hocuspocus] updateDocumentState failed:", err.message);
  }
}

// ─── Initialize Hocuspocus Server ──────────────────────────────────────────
const server = new Server({
  port: HOCUSPOCUS_PORT,
  timeout: 30000,
  debounce: DEBOUNCE_MS,
  
  async onAuthenticate(data) {
    console.log(`[Hocuspocus] onAuthenticate: documentName=${data.documentName}`);

    // Extract JWT from Authorization header or query
    let token =
      data.requestHeaders?.authorization?.replace("Bearer ", "") ||
      data.requestParameters?.token;

    if (!token) {
      console.warn("[Hocuspocus] No token provided");
      return false;
    }

    // Verify JWT
    const user = await authenticateConnection(token);
    if (!user) {
      console.warn("[Hocuspocus] Invalid token");
      return false;
    }

    console.log(`[Hocuspocus] User authenticated: ${user.email}`);

    // Extract documentId from documentName (format: "doc-{documentId}")
    const match = data.documentName.match(/^doc-(\d+)$/);
    if (!match) {
      console.warn("[Hocuspocus] Invalid document name format");
      return false;
    }

    const documentId = parseInt(match[1], 10);

    // Check if user is a collaborator
    const isCollab = await isUserCollaborator(user.id, documentId);
    if (!isCollab) {
      console.warn(
        `[Hocuspocus] User ${user.id} is not a collaborator on document ${documentId}`
      );
      return false;
    }

    // Phase 3: Check if document is in review/approved/submitted (read-only)
    const status = await getDocumentStatus(documentId);
    const readOnly = status !== "draft";

    console.log(
      `[Hocuspocus] Document ${documentId} status: ${status}, readOnly: ${readOnly}`
    );

    // Attach to connection for later reference
    data.connection.readOnly = readOnly;
    data.connection.user = user;
    data.connection.documentId = documentId;
    data.connection.status = status;

    console.log(`[Hocuspocus] Auth successful: ${user.email} (readOnly=${readOnly})`);
    return true;
  },

  async onChange(data) {
    const { connection, documentName } = data;
    if (!connection.user) return;

    // Phase 3: Reject edits if document is not in draft
    if (connection.readOnly) {
      console.warn(
        `[Hocuspocus] Edit rejected for ${connection.user.email}: document status is ${connection.status}, not editable`
      );
      // Yjs will not apply this update; connection will be force-reconnected in Phase 3
      return;
    }

    const documentId = connection.documentId;

    // Track this user as an active editor
    if (!activeEditors.has(documentId)) {
      activeEditors.set(documentId, new Set());
    }
    activeEditors.get(documentId).add(connection.user.id);

    console.log(
      `[Hocuspocus] onChange: ${documentName} by ${connection.user.email}`
    );
  },

  async onStoreDocument(data) {
    const { documentName, document, connection } = data;
    if (!connection || !connection.user) return;

    const documentId = connection.documentId;

    console.log(`[Hocuspocus] onStoreDocument: ${documentName}`);

    try {
      // Get Yjs state as binary update
      const state = Y.encodeStateAsUpdate(document);

      // Save version (Phase 2)
      await saveVersion(documentId, Buffer.from(state), "autosave", connection.user.id);

      // Update document's ydoc_state
      await updateDocumentState(documentId, Buffer.from(state));

      // Log edit session (all active editors for this interval)
      const editors = activeEditors.get(documentId) || new Set();
      if (editors.size > 0) {
        const editorsList = Array.from(editors).join(",");
        await db.query(
          `INSERT INTO document_audit_log (document_id, user_id, action, summary, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [documentId, connection.user.id, "edit_session", `Editors: ${editorsList}`]
        );
      }

      // Clear active editors after save
      activeEditors.delete(documentId);
    } catch (err) {
      console.error("[Hocuspocus] onStoreDocument failed:", err.message);
    }
  },

  async onLoadDocument(data) {
    const { documentName, document, connection } = data;
    if (!connection) return;

    const documentId = connection.documentId;

    console.log(`[Hocuspocus] onLoadDocument: ${documentName}`);

    try {
      // Load ydoc_state from DB
      const ydocState = await loadDocumentState(documentId);

      if (ydocState) {
        // Apply stored state to the document
        Y.applyUpdate(document, ydocState);
        console.log(`[Hocuspocus] Applied stored state to doc ${documentId}`);
      }
    } catch (err) {
      console.error("[Hocuspocus] onLoadDocument failed:", err.message);
    }
  },

  async onDisconnect(data) {
    const { documentName, connection } = data;
    if (connection && connection.user) {
      console.log(
        `[Hocuspocus] User disconnected: ${connection.user.email} from ${documentName}`
      );
    }
  },

  async onConnect(data) {
    const { documentName, connection } = data;
    if (connection && connection.user) {
      console.log(
        `[Hocuspocus] User connected: ${connection.user.email} to ${documentName}`
      );
    }
  },
});

console.log(`✅ Hocuspocus Server running on port ${HOCUSPOCUS_PORT}`);
