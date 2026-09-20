/**
 * Hocuspocus Collaborative Server
 * Handles real-time Yjs synchronization with auth, persistence (Phase 2), and read-only enforcement (Phase 3)
 * 
 * Port: configured via HOCUSPOCUS_PORT env var (default 1234)
 * Auth: JWT token from Authorization header or query param
 */

const { Server } = require("@hocuspocus/server");
const { Database } = require("@hocuspocus/extension-database");
const db = require("../config/db");
const jwt = require("jsonwebtoken");

const HOCUSPOCUS_PORT = process.env.HOCUSPOCUS_PORT || 1234;
const JWT_SECRET = process.env.JWT_SECRET;

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

// ─── Initialize Hocuspocus Server ──────────────────────────────────────────
const server = Server.create({
  port: HOCUSPOCUS_PORT,
  timeout: 30000,
  debounce: 2000, // Debounce saves to DB every 2 seconds
  
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

    console.log(`[Hocuspocus] Auth successful: ${user.email} (readOnly=${readOnly})`);
    return true;
  },

  async onChange(data) {
    const { connection, documentName } = data;
    if (!connection.user) return;

    console.log(
      `[Hocuspocus] onChange: ${documentName} by ${connection.user.email}`
    );

    // Track active editors (Phase 2: write to audit log)
    // TODO: aggregate per save interval, then log in onStoreDocument
  },

  async onStoreDocument(data) {
    const { documentName, document, connection } = data;
    if (!connection || !connection.user) return;

    console.log(`[Hocuspocus] onStoreDocument: ${documentName}`);

    // Phase 2: persist ydoc_state and create autosave version
    // TODO: implement persistence logic here
  },

  async onLoadDocument(data) {
    const { documentName } = data;
    console.log(`[Hocuspocus] onLoadDocument: ${documentName}`);

    // Phase 2: fetch ydoc_state from DB
    // TODO: implement load logic here
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
