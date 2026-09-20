import { useState, useEffect } from "react";
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
  return `dev_${btoa(JSON.stringify(payload))}`;
}

// ─── Google Docs Style Editor ─────────────────────────────────────────────────
export default function CollabTest() {
  const [currentUserId, setCurrentUserId] = useState(1);
  const [taskId, setTaskId] = useState(1);
  const [documentId, setDocumentId] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("Untitled Syllabus");
  const [ydoc, setYdoc] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [docLoading, setDocLoading] = useState(false);

  const currentUser = TEST_USERS.find((u) => u.id === currentUserId);
  const token = generateDevToken(currentUserId);

  // Fetch or create document
  useEffect(() => {
    if (!taskId || !token) return;

    const fetchDocument = async () => {
      setDocLoading(true);
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
      } catch (err) {
        console.error("[CollabTest] Error:", err);
      } finally {
        setDocLoading(false);
      }
    };

    fetchDocument();
  }, [taskId, token]);

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
      connect: true,
      resyncInterval: 5000,

      onStatus({ status: newStatus }) {
        setConnectionStatus(newStatus);
      },

      onConnect() {
        console.log("[Collab] Connected");
      },

      onDisconnect() {
        console.log("[Collab] Disconnected");
      },
    });

    setYdoc(doc);

    return () => {
      prov.destroy();
      doc.destroy();
    };
  }, [documentId, token]);

  // Create TipTap editor with collaboration (only when ydoc is ready)
  const editor_instance = useEditor(
    {
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        ...(ydoc ? [Collaboration.configure({
          document: ydoc,
          field: "content",
        })] : []),
      ],
      content: `<h1>${documentTitle}</h1><p>Start typing your syllabus...</p>`,
    },
    [ydoc]
  );

  const isConnected = connectionStatus === "connected";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "#fff" }}>
      {/* Top Bar - Google Docs Style */}
      <div style={{
        borderBottom: "1px solid #e0e0e0",
        padding: "12px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "500", color: "#202124" }}>
            📄 {documentTitle}
          </h1>
          <span style={{
            fontSize: "13px",
            color: isConnected ? "#0f9d58" : "#d33b27",
            fontWeight: "500",
          }}>
            {isConnected ? "● All changes saved" : "● Connecting..."}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* User Selector */}
          <select
            value={currentUserId}
            onChange={(e) => setCurrentUserId(Number(e.target.value))}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              border: "1px solid #dadce0",
              fontSize: "13px",
              backgroundColor: "#f8f9fa",
              cursor: "pointer",
            }}
          >
            {TEST_USERS.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#fafafa",
        padding: "40px 20px",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "900px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          padding: "40px",
          fontFamily: "Roboto, system-ui, sans-serif",
          minHeight: "400px",
        }}>
          {ydoc && editor_instance ? (
            <EditorContent
              editor={editor_instance}
              style={{
                fontSize: "16px",
                lineHeight: "1.6",
                color: "#202124",
              }}
            />
          ) : (
            <p style={{ color: "#9aa0a6", textAlign: "center", marginTop: "50px" }}>
              {docLoading ? "Loading document..." : "Initializing editor..."}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div style={{
        borderTop: "1px solid #e0e0e0",
        padding: "12px 20px",
        backgroundColor: "#f8f9fa",
        fontSize: "12px",
        color: "#5f6368",
        display: "flex",
        justifyContent: "space-between",
      }}>
        <div>
          Task ID: <strong>{taskId}</strong> | Document ID: <strong>{documentId || "loading..."}</strong>
        </div>
        <div>
          {isConnected ? "✓ Connected" : "⟳ Connecting..."}
        </div>
      </div>
    </div>
  );
}
