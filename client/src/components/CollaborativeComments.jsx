import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * CollaborativeComments
 * Real-time discussion thread with WebSocket support.
 * Shows who commented when, allows deletion of own comments, auto-updates on new comments.
 */
export default function CollaborativeComments({
  taskId,
  token,
  apiUrl,
  io,
  currentUserId,
  currentUserName,
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Load initial comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments?limit=50&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load comments");
        const data = await res.json();
        setComments(data.comments || []);
      } catch (err) {
        setError(err.message);
        console.error("CollaborativeComments load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadComments();
  }, [taskId, token, apiUrl]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!io) return;

    io.emit("join_task", { taskId });

    const handleNewComment = (comment) => {
      if (comment.taskId === taskId) {
        setComments((prev) => [...prev, comment]);
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(comment.userId);
          return updated;
        });
      }
    };

    const handleCommentDeleted = (data) => {
      if (data.taskId === taskId) {
        setComments((prev) => prev.filter((c) => c.id !== data.commentId));
      }
    };

    const handleUserTyping = (data) => {
      if (data.taskId === taskId) {
        setTypingUsers((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.taskId === taskId) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(data.userId);
          return updated;
        });
      }
    };

    io.on("task:new_comment", handleNewComment);
    io.on("task:comment_deleted", handleCommentDeleted);
    io.on("task:user_typing", handleUserTyping);
    io.on("task:user_stop_typing", handleUserStopTyping);

    return () => {
      io.off("task:new_comment", handleNewComment);
      io.off("task:comment_deleted", handleCommentDeleted);
      io.off("task:user_typing", handleUserTyping);
      io.off("task:user_stop_typing", handleUserStopTyping);
      io.emit("leave_task", { taskId });
    };
  }, [io, taskId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const handleTyping = useCallback(() => {
    if (io) {
      io.emit("typing", { taskId, name: currentUserName });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (io) {
        io.emit("stop_typing", { taskId });
      }
    }, 1500);
  }, [io, taskId, currentUserName]);

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
    handleTyping();
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) throw new Error("Failed to submit comment");

      setNewComment("");
      if (io) {
        io.emit("stop_typing", { taskId });
      }
    } catch (err) {
      console.error("Submit comment error:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${apiUrl}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete comment");
    } catch (err) {
      console.error("Delete comment error:", err);
      setError(err.message);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) return <div className="cc-loading">Loading comments...</div>;

  return (
    <div className="cc-container">
      <div className="cc-header">
        <span>Collaboration Discussion</span>
        <em>{comments.length} comment{comments.length !== 1 ? "s" : ""}</em>
      </div>

      <div className="cc-messages" ref={scrollContainerRef}>
        {comments.length === 0 ? (
          <div className="cc-empty">No comments yet. Start the conversation!</div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`cc-message ${comment.userId === currentUserId ? "cc-own" : ""}`}
            >
              <div className="cc-message-header">
                <strong>{comment.userName}</strong>
                <small>{formatTime(comment.createdAt)}</small>
              </div>
              <div className="cc-message-content">{comment.content}</div>
              {comment.userId === currentUserId && (
                <button
                  className="cc-delete-btn"
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Delete this comment"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}

        {typingUsers.size > 0 && (
          <div className="cc-typing">
            <strong>{Array.from(typingUsers).length} typing...</strong>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="cc-composer">
        <textarea
          value={newComment}
          onChange={handleCommentChange}
          placeholder="Add a comment..."
          rows={2}
          disabled={submitting}
        />
        <div className="cc-composer-actions">
          <button type="submit" disabled={!newComment.trim() || submitting}>
            {submitting ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {error && <div className="cc-error">{error}</div>}

      <style>{`
        .cc-container {
          margin-top: 20px;
          padding: 14px 16px;
          border: 1px solid #e0d5ef;
          border-radius: 10px;
          background: #fcfaff;
          display: flex;
          flex-direction: column;
          height: 400px;
        }

        .cc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 12px;
          font-weight: 800;
          color: #4a3a55;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          border-bottom: 1px solid #e9ddfb;
          padding-bottom: 8px;
        }

        .cc-header em {
          font-style: normal;
          color: #9a8ba6;
        }

        .cc-loading {
          padding: 20px;
          text-align: center;
          color: #9a88a6;
          font-size: 12px;
        }

        .cc-messages {
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
          display: grid;
          gap: 8px;
          align-content: start;
        }

        .cc-empty {
          padding: 20px;
          text-align: center;
          color: #9a88a6;
          font-size: 12px;
        }

        .cc-message {
          position: relative;
          padding: 10px;
          border-radius: 8px;
          background: #fff;
          border: 1px solid #e9ddfb;
          font-size: 12px;
        }

        .cc-message.cc-own {
          background: #eef6fb;
          border-color: #d4e4f0;
        }

        .cc-message-header {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .cc-message-header strong {
          font-size: 11px;
          color: #4a3a55;
        }

        .cc-message-header small {
          font-size: 10px;
          color: #9a8ba6;
        }

        .cc-message-content {
          color: #5d4867;
          line-height: 1.4;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .cc-delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 4px;
          background: #f0e8f8;
          color: #8d7e98;
          font: 10px Arial;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .cc-message:hover .cc-delete-btn {
          opacity: 1;
        }

        .cc-delete-btn:hover {
          background: #e9ddfb;
          color: #5d4867;
        }

        .cc-typing {
          padding: 4px 10px;
          font-size: 11px;
          color: #9a88a6;
          font-style: italic;
        }

        .cc-composer {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e9ddfb;
          display: grid;
          gap: 6px;
        }

        .cc-composer textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #e0d5ef;
          border-radius: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #5d4867;
          resize: none;
          outline: none;
        }

        .cc-composer textarea:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
        }

        .cc-composer textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cc-composer-actions {
          display: flex;
          gap: 6px;
        }

        .cc-composer button {
          padding: 6px 12px;
          border: 1px solid #d9cbe6;
          border-radius: 6px;
          background: #fff;
          color: #5d4867;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cc-composer button:hover:not(:disabled) {
          border-color: #7c3aed;
          background: #7c3aed;
          color: #fff;
        }

        .cc-composer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cc-error {
          margin-top: 8px;
          padding: 8px;
          border-radius: 6px;
          background: #fff9f8;
          border: 1px solid #f5d1cc;
          color: #b55e51;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}
