import { useState, useEffect, useCallback } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";

const HOCUSPOCUS_URL = import.meta.env.VITE_HOCUSPOCUS_URL || "ws://localhost:1234";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── Test users (DEV ONLY) ───────────────────────────────────────────────────
const TEST_USERS = [
  { id: 1, name: "Prof Alice", email: "alice@example.com", color: "#FF6B6B" },
  { id: 2, name: "Prof Bob", email: "bob@example.com", color: "#4ECDC4" },
  { id: 3, name: "Prof Charlie", email: "charlie@example.com", color: "#FFE66D" },
];

// ─── Dev-only token generator (NOT FOR PRODUCTION) ────────────────────────────
function generateDevToken(userId) {
  const payload = {
    id: userId,
    email: TEST_USERS[userId - 1]?.email || "test@example.com",
    role: "user",
    full_name: TEST_USERS[userId - 1]?.name || "Test User",
  };
  return `dev_${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

// ─── Single Section Editor ────────────────────────────────────────────────────
function SectionEditor({ section, ydoc, currentUser, readOnly }) {
  const [editor, setEditor] = useState(null);

  const handleCreate = useCallback(
    ({ editor: ed }) => {
      setEditor(ed);
    },
    []
  );

  const editor_instance = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Collaboration.configure({
          document: ydoc,
          field: section,
        }),
      ],
      onCreate: handleCreate,
      editable: !readOnly,
      content: `<h2>${section}</h2><p>Start editing...</p>`,
    },
    [ydoc, section, readOnly]
  );

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "12px",
        backgroundColor: readOnly ? "#f0f0f0" : "#f9f9f9",
        opacity: readOnly ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#333" }}>{section}</h3>
        {readOnly && <span style={{ fontSize: "11px", color: "#999" }}>🔒 Read-only</span>}
      </div>
      <EditorContent
        editor={editor_instance}
        style={{
          minHeight: "150px",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          cursor: readOnly ? "not-allowed" : "text",
        }}
      />
    </div>
  );
}

// ─── Version History Panel ────────────────────────────────────────────────────
function VersionPanel({ documentId, token }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId || !token) return;

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/collab-test/document/${documentId}/versions`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch versions");
        const data = await res.json();
        setVersions(data);
      } catch (err) {
        setError(err.message);
        console.error("[VersionPanel] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchVersions, 3000);
    fetchVersions();

    return () => clearInterval(interval);
  }, [documentId, token]);

  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #ddd",
        marginBottom: "12px",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "8px" }}>📜 Version History</h4>
      {loading && <p style={{ fontSize: "12px", color: "#666" }}>Loading...</p>}
      {error && (
        <p style={{ fontSize: "12px", color: "#d32f2f" }}>Error: {error}</p>
      )}
      {!loading && versions.length === 0 && (
        <p style={{ fontSize: "12px", color: "#666" }}>No versions yet</p>
      )}
      {!loading && versions.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px" }}>
          {versions.slice(0, 5).map((v) => (
            <li key={v.id} style={{ marginBottom: "6px", color: "#333" }}>
              <strong>v{v.version_no}</strong> ({v.kind}) — {v.full_name || "Unknown"}{" "}
              <span style={{ color: "#999" }}>
                {new Date(v.created_at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Workflow Control Panel ────────────────────────────────────────────────
function WorkflowPanel({ documentId, status, token, onStatusChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRequestReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/collab-test/document/${documentId}/request-review`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to request review");
      const data = await res.json();
      onStatusChange(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/collab-test/document/${documentId}/reopen`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to reopen document");
      const data = await res.json();
      onStatusChange(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/collab-test/document/${documentId}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to submit document");
      const data = await res.json();
      onStatusChange(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#fff3cd",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #ffc107",
        marginBottom: "12px",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "12px" }}>🔄 Workflow Controls</h4>
      {error && (
        <p style={{ fontSize: "12px", color: "#d32f2f", marginBottom: "8px" }}>
          Error: {error}
        </p>
      )}

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {status === "draft" && (
          <button
            onClick={handleRequestReview}
            disabled={loading}
            style={{
              padding: "8px 12px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Request Review
          </button>
        )}

        {status === "review_requested" && (
          <>
            <button
              onClick={handleReopen}
              disabled={loading}
              style={{
                padding: "8px 12px",
                backgroundColor: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Reopen for Editing
            </button>
            <span style={{ fontSize: "12px", color: "#666", alignSelf: "center" }}>
              ⏸️ Editing disabled until approvers review
            </span>
          </>
        )}

        {status === "approved" && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "8px 12px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Submit
          </button>
        )}

        {status === "submitted" && (
          <span style={{ fontSize: "12px", color: "#28a745", fontWeight: "600" }}>
            ✅ Document submitted
          </span>
        )}
      </div>

      <p style={{ fontSize: "11px", color: "#666", marginTop: "8px", margin: "8px 0 0 0" }}>
        Current status: <strong>{status}</strong>
      </p>
    </div>
  );
}

// ─── Audit Log Panel ──────────────────────────────────────────────────────────
function AuditPanel({ documentId, token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId || !token) return;

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_URL}/collab-test/document/${documentId}/audit?limit=10`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch audit log");
        const data = await res.json();
        setLogs(data.logs);
      } catch (err) {
        setError(err.message);
        console.error("[AuditPanel] Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const interval = setInterval(fetchLogs, 3000);
    fetchLogs();

    return () => clearInterval(interval);
  }, [documentId, token]);

  return (
    <div
      style={{
        backgroundColor: "#f0f7ff",
        padding: "12px",
        borderRadius: "6px",
        border: "1px solid #90caf9",
        marginBottom: "12px",
      }}
    >
      <h4 style={{ marginTop: 0, marginBottom: "8px" }}>📋 Audit Log</h4>
      {loading && <p style={{ fontSize: "12px", color: "#666" }}>Loading...</p>}
      {error && (
        <p style={{ fontSize: "12px", color: "#d32f2f" }}>Error: {error}</p>
      )}
      {!loading && logs.length === 0 && (
        <p style={{ fontSize: "12px", color: "#666" }}>No audit entries yet</p>
      )}
      {!loading && logs.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px" }}>
          {logs.slice(0, 5).map((log) => (
            <li key={log.id} style={{ marginBottom: "6px", color: "#333" }}>
              <strong>{log.action}</strong> — {log.summary || log.action}{" "}
              <span style={{ color: "#999" }}>
                by {log.full_name || "Unknown"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Collab Test Page ───────────────────────────────────────────────────
export default function CollabTest() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [taskId, setTaskId] = useState(1);
  const [documentId, setDocumentId] = useState(null);
  const [documentStatus, setDocumentStatus] = useState("draft");
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState(null);

  const currentUser = TEST_USERS.find((u) => u.id === currentUserId);
  const token = generateDevToken(currentUserId);

  // Fetch or create document on mount and when taskId changes
  useEffect(() => {
    if (!taskId || !token) return;

    const fetchDocument = async () => {
      setDocLoading(true);
      setDocError(null);
      try {
        const res = await fetch(
          `${API_URL}/collab-test/document/${taskId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch document");
        const data = await res.json();
        setDocumentId(data.id);
        setDocumentStatus(data.status);
        console.log("[CollabTest] Document:", data);
      } catch (err) {
        setDocError(err.message);
        console.error("[CollabTest] Error fetching document:", err);
      } finally {
        setDocLoading(false);
      }
    };

    fetchDocument();
  }, [taskId, token]);

  // Poll document status every 2 seconds
  useEffect(() => {
    if (!documentId || !token) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(
          `${API_URL}/collab-test/document/${documentId}/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setDocumentStatus(data.status);
      } catch (err) {
        console.error("[CollabTest] Status poll error:", err);
      }
    };

    const interval = setInterval(pollStatus, 2000);
    return () => clearInterval(interval);
  }, [documentId, token]);

  // Initialize Hocuspocus provider
  useEffect(() => {
    if (!documentId) return;

    const documentName = `doc-${documentId}`;
    const doc = new Y.Doc();

    const prov = new HocuspocusProvider({
      url: HOCUSPOCUS_URL,
      name: documentName,
      document: doc,
      token,
      awareness: true,
      connect: true,
      resyncInterval: 5000,

      onStatus({ status: newStatus }) {
        console.log("[Collab] Connection status:", newStatus);
        setConnectionStatus(newStatus);
      },

      onAuthenticate(context) {
        console.log("[Collab] Authenticated");
      },

      onConnect() {
        console.log("[Collab] Connected to Hocuspocus");
      },

      onDisconnect() {
        console.log("[Collab] Disconnected from Hocuspocus");
      },

      onSynced() {
        console.log("[Collab] Synced");
      },
    });

    const updateConnectedUsers = () => {
      const clients = Array.from(prov.awareness.getStates().values()).map(
        (state) => state.user || { id: "unknown", name: "Unknown" }
      );
      setConnectedUsers(clients);
    };

    prov.awareness.on("change", updateConnectedUsers);
    updateConnectedUsers();

    setYdoc(doc);
    setProvider(prov);

    return () => {
      prov.awareness.off("change", updateConnectedUsers);
      prov.destroy();
      doc.destroy();
    };
  }, [documentId, token]);

  // Publish current user to awareness
  useEffect(() => {
    if (!provider) return;
    provider.awareness.setLocalState({
      user: {
        id: currentUserId,
        name: currentUser?.name,
        color: currentUser?.color,
      },
    });
  }, [provider, currentUserId, currentUser]);

  const isReadOnly = documentStatus !== "draft";

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "20px",
          borderBottom: "2px solid #007bff",
          paddingBottom: "12px",
        }}
      >
        <h1 style={{ margin: "0 0 8px 0" }}>🧪 Collaborative Syllabus Editor (Phase 3)</h1>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Real-time co-editing with review workflow. Request review to freeze edits and test approval system.
        </p>
      </div>

      {/* Status Banner */}
      <div
        style={{
          padding: "12px",
          marginBottom: "16px",
          borderRadius: "6px",
          backgroundColor: connectionStatus === "connected" ? "#d4edda" : "#f8d7da",
          color: connectionStatus === "connected" ? "#155724" : "#856404",
          border: `1px solid ${connectionStatus === "connected" ? "#c3e6cb" : "#f5c6cb"}`,
          fontSize: "14px",
        }}
      >
        <strong>Connection:</strong> {connectionStatus.toUpperCase()} | <strong>Document ID:</strong>{" "}
        {documentId || "loading..."}
        {docError && (
          <div style={{ marginTop: "8px", color: "#d32f2f" }}>Error: {docError}</div>
        )}
      </div>

      {/* Dev Controls */}
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "20px",
          border: "2px dashed #ff6b6b",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#d32f2f" }}>🔧 DEV CONTROLS (Test Only)</h3>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>
            Switch User:
          </label>
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(Number(e.target.value))}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          >
            {TEST_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>
            Task ID (fetches/creates document):
          </label>
          <input
            type="number"
            value={taskId}
            onChange={(e) => setTaskId(Number(e.target.value))}
            disabled={docLoading}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
              width: "100px",
            }}
          />
          {docLoading && (
            <span style={{ marginLeft: "8px", color: "#666" }}>Fetching...</span>
          )}
        </div>

        <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
          💡 Tip: Click "Request Review" to freeze editing. Then switch users to test read-only enforcement.
        </p>
      </div>

      {/* Who's Online */}
      <div
        style={{
          backgroundColor: "#e3f2fd",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "20px",
          border: "1px solid #90caf9",
        }}
      >
        <strong style={{ display: "block", marginBottom: "8px" }}>👥 Online ({connectedUsers.length})</strong>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {connectedUsers.length === 0 ? (
            <span style={{ color: "#666" }}>Connecting...</span>
          ) : (
            connectedUsers.map((user, idx) => (
              <div
                key={idx}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  backgroundColor: user.color || "#ccc",
                  color: "#fff",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                  }}
                />
                {user.name || user.email || `User ${user.id}`}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Workflow Panel */}
      {documentId && (
        <WorkflowPanel
          documentId={documentId}
          status={documentStatus}
          token={token}
          onStatusChange={setDocumentStatus}
        />
      )}

      {/* Persistence Panels */}
      {documentId && (
        <>
          <VersionPanel documentId={documentId} token={token} />
          <AuditPanel documentId={documentId} token={token} />
        </>
      )}

      {/* Section Editors */}
      <div>
        <h2 style={{ marginTop: 0 }}>📝 Syllabus Sections</h2>
        {ydoc ? (
          <>
            <SectionEditor section="description" ydoc={ydoc} currentUser={currentUser} readOnly={isReadOnly} />
            <SectionEditor section="outcomes" ydoc={ydoc} currentUser={currentUser} readOnly={isReadOnly} />
            <SectionEditor section="grading" ydoc={ydoc} currentUser={currentUser} readOnly={isReadOnly} />
            <SectionEditor section="schedule" ydoc={ydoc} currentUser={currentUser} readOnly={isReadOnly} />
            <SectionEditor section="references" ydoc={ydoc} currentUser={currentUser} readOnly={isReadOnly} />
          </>
        ) : (
          <p style={{ color: "#666" }}>
            {docLoading ? "Fetching document..." : "Ready to edit"}
          </p>
        )}
      </div>

      {/* Instructions */}
      <div
        style={{
          marginTop: "24px",
          padding: "16px",
          backgroundColor: "#f5f5f5",
          borderRadius: "6px",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
      >
        <strong>📖 Phase 3 Testing Instructions:</strong>
        <ol style={{ margin: "8px 0" }}>
          <li>Open this page in 2 tabs (same or different windows)</li>
          <li>In Tab 1, set user to "Prof Alice" and start typing in a section</li>
          <li>In Tab 2, set user to "Prof Bob" and watch the text appear in real-time</li>
          <li>
            In Tab 1, click <strong>Request Review</strong> to change status to "review_requested"
          </li>
          <li>Verify that editors are now read-only (grayed out, "🔒 Read-only" badge)</li>
          <li>Try typing in Tab 2—edits should be rejected (status not "draft")</li>
          <li>In Tab 1, click <strong>Reopen for Editing</strong> to go back to "draft"</li>
          <li>Verify edits work again in both tabs</li>
          <li>Watch the <strong>Audit Log</strong> track all status changes</li>
        </ol>
      </div>
    </div>
  );
}
