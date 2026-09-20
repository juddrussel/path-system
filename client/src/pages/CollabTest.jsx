import { useState, useEffect, useCallback } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";

const HOCUSPOCUS_URL = import.meta.env.VITE_HOCUSPOCUS_URL || "ws://localhost:1234";

// ─── Test users (DEV ONLY) ───────────────────────────────────────────────────
const TEST_USERS = [
  { id: 1, name: "Prof Alice", email: "alice@example.com", color: "#FF6B6B" },
  { id: 2, name: "Prof Bob", email: "bob@example.com", color: "#4ECDC4" },
  { id: 3, name: "Prof Charlie", email: "charlie@example.com", color: "#FFE66D" },
];

// ─── Dev-only token generator (NOT FOR PRODUCTION) ────────────────────────────
function generateDevToken(userId) {
  // Dummy JWT-like token for testing
  // In real app, this comes from your auth backend
  const payload = {
    id: userId,
    email: TEST_USERS[userId - 1]?.email || "test@example.com",
    role: "user",
    full_name: TEST_USERS[userId - 1]?.name || "Test User",
  };
  // Base64 encode (NOT secure, dev only)
  return `dev_${Buffer.from(JSON.stringify(payload)).toString("base64")}`;
}

// ─── Single Section Editor ────────────────────────────────────────────────────
function SectionEditor({ section, ydoc, currentUser }) {
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
          history: false, // Yjs handles history
        }),
        Collaboration.configure({
          document: ydoc,
          field: section,
        }),
      ],
      onCreate: handleCreate,
      content: `<h2>${section}</h2><p>Start editing...</p>`,
    },
    [ydoc, section]
  );

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "12px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#333" }}>{section}</h3>
      <EditorContent
        editor={editor_instance}
        style={{
          minHeight: "150px",
          padding: "8px",
          backgroundColor: "#fff",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          cursor: "text",
        }}
      />
    </div>
  );
}

// ─── Main Collab Test Page ───────────────────────────────────────────────────
export default function CollabTest() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [documentId, setDocumentId] = useState(1);
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [status, setStatus] = useState("disconnected");

  const currentUser = TEST_USERS.find((u) => u.id === currentUserId);
  const token = generateDevToken(currentUserId);

  // Initialize Hocuspocus provider
  useEffect(() => {
    const documentName = `doc-${documentId}`;
    const doc = new Y.Doc();

    const prov = new HocuspocusProvider({
      url: HOCUSPOCUS_URL,
      name: documentName,
      document: doc,
      token, // Custom token for auth
      awareness: true, // Enable presence/cursors
      connect: true,
      resyncInterval: 5000,

      onStatus({ status: newStatus }) {
        console.log("[Collab] Connection status:", newStatus);
        setStatus(newStatus);
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

    // Track connected users via awareness
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
        <h1 style={{ margin: "0 0 8px 0" }}>🧪 Collaborative Syllabus Editor (Phase 1)</h1>
        <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
          Real-time co-editing test page. Open this in multiple tabs/windows and switch users to test collaboration.
        </p>
      </div>

      {/* Status Banner */}
      <div
        style={{
          padding: "12px",
          marginBottom: "16px",
          borderRadius: "6px",
          backgroundColor: status === "connected" ? "#d4edda" : "#f8d7da",
          color: status === "connected" ? "#155724" : "#856404",
          border: `1px solid ${status === "connected" ? "#c3e6cb" : "#f5c6cb"}`,
          fontSize: "14px",
        }}
      >
        <strong>Status:</strong> {status.toUpperCase()} | <strong>Document ID:</strong> {documentId}
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
            Document ID:
          </label>
          <input
            type="number"
            value={documentId}
            onChange={(e) => setDocumentId(Number(e.target.value))}
            style={{
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
              width: "100px",
            }}
          />
        </div>

        <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
          💡 Tip: Open this page in 2 browser tabs. Set different users and documents to test real-time sync.
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

      {/* Section Editors */}
      <div>
        <h2 style={{ marginTop: 0 }}>📝 Syllabus Sections</h2>
        {ydoc && (
          <>
            <SectionEditor section="description" ydoc={ydoc} currentUser={currentUser} />
            <SectionEditor section="outcomes" ydoc={ydoc} currentUser={currentUser} />
            <SectionEditor section="grading" ydoc={ydoc} currentUser={currentUser} />
            <SectionEditor section="schedule" ydoc={ydoc} currentUser={currentUser} />
            <SectionEditor section="references" ydoc={ydoc} currentUser={currentUser} />
          </>
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
        <strong>📖 Testing Instructions:</strong>
        <ol style={{ margin: "8px 0" }}>
          <li>Open this page in 2 tabs (same or different windows)</li>
          <li>In Tab 1, set user to "Prof Alice" and start typing in a section</li>
          <li>In Tab 2, set user to "Prof Bob" and watch the text appear in real-time</li>
          <li>Edit the same paragraph in both tabs simultaneously—both edits should merge</li>
          <li>Close one tab mid-edit and reopen it—content should persist</li>
          <li>Check "Online" indicator updates as you connect/disconnect</li>
        </ol>
      </div>
    </div>
  );
}
