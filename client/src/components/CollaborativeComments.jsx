import React, { useState, useEffect, useRef, useCallback } from "react";

/**
 * CollaborativeComments
 * Real-time threaded discussion with file attachments and reply nesting.
 * Supports posting comments, uploading files, replying to specific comments.
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
  const [newCommentFiles, setNewCommentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

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

    const handleNewComment = ({ taskId: eTaskId, comment }) => {
      if (eTaskId === taskId) {
        setComments((prev) => {
          if (comment.parentCommentId) {
            // Reply to existing comment - insert into replies array
            return prev.map(c => {
              if (c.id === comment.parentCommentId) {
                return { ...c, replies: [...(c.replies || []), comment] };
              }
              return c;
            });
          } else {
            // Top-level comment
            return [...prev, { ...comment, replies: [] }];
          }
        });
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(comment.userId);
          return updated;
        });
      }
    };

    const handleCommentDeleted = (data) => {
      if (data.taskId === taskId) {
        setComments((prev) => {
          return prev
            .filter((c) => c.id !== data.commentId)
            .map((c) => ({
              ...c,
              replies: c.replies ? c.replies.filter((r) => r.id !== data.commentId) : [],
            }));
        });
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

    io.on("task:comment_added", handleNewComment);
    io.on("task:comment_deleted", handleCommentDeleted);
    io.on("task:user_typing", handleUserTyping);
    io.on("task:user_stop_typing", handleUserStopTyping);

    return () => {
      io.off("task:comment_added", handleNewComment);
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

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setNewCommentFiles((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setNewCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("content", newComment.trim());
      if (replyingTo) {
        formData.append("parentCommentId", replyingTo);
      }
      newCommentFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit comment");

      setNewComment("");
      setNewCommentFiles([]);
      setReplyingTo(null);
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

  const CommentThread = ({ comment, depth = 0 }) => (
    <div key={comment.id} style={{ marginLeft: depth > 0 ? "16px" : "0" }}>
      <div className={`cc-message ${comment.userId === currentUserId ? "cc-own" : ""}`}>
        <div className="cc-message-header">
          <strong>{comment.userName}</strong>
          <small>{formatTime(comment.createdAt)}</small>
        </div>
        <div className="cc-message-content">{comment.content}</div>
        {comment.files && comment.files.length > 0 && (
          <div className="cc-message-files">
            {comment.files.map((file, idx) => (
              <a
                key={idx}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cc-file-link"
                title={`${file.name} (${file.size} bytes)`}
              >
                📎 {file.name}
              </a>
            ))}
          </div>
        )}
        <div className="cc-message-actions">
          {comment.userId === currentUserId && (
            <button
              className="cc-delete-btn"
              onClick={() => handleDeleteComment(comment.id)}
              title="Delete this comment"
            >
              ✕
            </button>
          )}
          <button
            className="cc-reply-btn"
            onClick={() => setReplyingTo(comment.id)}
            title="Reply to this comment"
          >
            ↩ Reply
          </button>
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="cc-replies">
          {comment.replies.map((reply) => (
            <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) return <div className="cc-loading">Loading comments...</div>;

  const totalComments = comments.length + comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  return (
    <div className="cc-container">
      <div className="cc-header">
        <span>Collaboration Discussion</span>
        <em>{totalComments} comment{totalComments !== 1 ? "s" : ""}</em>
      </div>

      <div className="cc-messages" ref={scrollContainerRef}>
        {comments.length === 0 ? (
          <div className="cc-empty">No comments yet. Start the conversation!</div>
        ) : (
          comments.map((comment) => <CommentThread key={comment.id} comment={comment} />)
        )}

        {typingUsers.size > 0 && (
          <div className="cc-typing">
            <strong>{Array.from(typingUsers).length} typing...</strong>
          </div>
        )}
      </div>

      {replyingTo && (
        <div className="cc-reply-context">
          <span>Replying to comment #{replyingTo}</span>
          <button type="button" onClick={() => setReplyingTo(null)}>
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmitComment} className="cc-composer">
        <div className="cc-composer-input-group">
          <textarea
            value={newComment}
            onChange={handleCommentChange}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            rows={2}
            disabled={submitting}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="cc-file-picker-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            title="Attach files"
          >
            📎
          </button>
        </div>
        {newCommentFiles.length > 0 && (
          <div className="cc-file-list">
            {newCommentFiles.map((file, idx) => (
              <div key={idx} className="cc-file-item">
                <span>{file.name}</span>
                <button type="button" onClick={() => handleRemoveFile(idx)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="cc-composer-actions">
          <button type="submit" disabled={!newComment.trim() || submitting}>
            {submitting ? "Sending..." : replyingTo ? "Reply" : "Send"}
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
          margin-bottom: 6px;
        }

        .cc-message-files {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 8px 0 6px 0;
          padding: 6px;
          background: #f5f0fb;
          border-radius: 4px;
        }

        .cc-file-link {
          font-size: 10px;
          color: #7c3aed;
          text-decoration: none;
          word-break: break-all;
          transition: color 0.2s;
        }

        .cc-file-link:hover {
          color: #5b21b6;
          text-decoration: underline;
        }

        .cc-message-actions {
          display: flex;
          gap: 6px;
          margin-top: 4px;
        }

        .cc-delete-btn, .cc-reply-btn {
          padding: 2px 6px;
          border: 1px solid #e0d5ef;
          border-radius: 4px;
          background: #f0e8f8;
          color: #8d7e98;
          font-size: 9px;
          font-weight: 600;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s, color 0.2s;
        }

        .cc-message:hover .cc-delete-btn,
        .cc-message:hover .cc-reply-btn {
          opacity: 1;
        }

        .cc-delete-btn:hover, .cc-reply-btn:hover {
          background: #e9ddfb;
          color: #5d4867;
        }

        .cc-replies {
          margin-top: 8px;
          padding-left: 12px;
          border-left: 2px solid #e9ddfb;
        }

        .cc-reply-context {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 11px;
          color: #92400e;
        }

        .cc-reply-context button {
          padding: 2px 6px;
          border: 1px solid #fbbf24;
          border-radius: 3px;
          background: #fef3c7;
          color: #92400e;
          font-size: 9px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .cc-reply-context button:hover {
          background: #fbbf24;
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

        .cc-composer-input-group {
          display: flex;
          gap: 6px;
          align-items: flex-start;
        }

        .cc-composer textarea {
          flex: 1;
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

        .cc-file-picker-btn {
          padding: 8px 10px;
          border: 1px solid #7c3aed;
          border-radius: 6px;
          background: #7c3aed;
          color: #fff;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 1;
          font-weight: 600;
        }

        .cc-file-picker-btn:hover:not(:disabled) {
          background: #6d28d9;
          border-color: #6d28d9;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
        }

        .cc-file-picker-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cc-file-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 6px;
          background: #f5f0fb;
          border-radius: 4px;
          border: 1px solid #e9ddfb;
        }

        .cc-file-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 6px;
          background: #fff;
          border-radius: 3px;
          border: 1px solid #e0d5ef;
          font-size: 10px;
          color: #5d4867;
        }

        .cc-file-item button {
          padding: 0 4px;
          border: none;
          background: transparent;
          color: #9a8ba6;
          font-size: 10px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .cc-file-item button:hover {
          color: #5d4867;
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
