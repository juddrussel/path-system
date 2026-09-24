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
  const [fileUploadStatus, setFileUploadStatus] = useState({}); // { fileName: 'uploading'|'success'|'error' }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load initial comments - moved inside useCallback to be stable
  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments?limit=50&offset=0`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 403) {
        // Not a collaborator - just show empty comments
        console.log("User is not a collaborator on this task");
        setComments([]);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.status}`);
      }
      
      const data = await res.json();
      setComments(data.comments || []);
      setLoading(false);
    } catch (err) {
      console.error("CollaborativeComments load error:", err);
      setError(null); // Don't show error to user, just empty state
      setLoading(false);
    }
  }, [taskId, token, apiUrl]);

  // Load initial comments
  useEffect(() => {
    if (taskId && token) {
      loadComments();
    }
  }, [taskId, token, loadComments]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!io) {
      console.log("[CollaborativeComments] Socket.io not available");
      return;
    }

    console.log(`[CollaborativeComments] Setting up socket listeners for taskId=${taskId}`);
    
    // Join the task room
    io.emit("join_task", { taskId });
    console.log(`[CollaborativeComments] Emitted join_task for taskId=${taskId}`);

    const handleNewComment = ({ taskId: eTaskId, comment }) => {
      console.log(`[CollaborativeComments] Received task:comment_added for taskId=${eTaskId}, current=${taskId}`, comment);
      if (eTaskId === taskId) {
        console.log(`[CollaborativeComments] Processing comment, parentCommentId=${comment.parentCommentId}`);
        setComments((prev) => {
          console.log(`[CollaborativeComments] Current state has ${prev.length} comments`);
          if (comment.parentCommentId) {
            // Reply to existing comment - find parent and add reply
            console.log(`[CollaborativeComments] Adding reply to parent ${comment.parentCommentId}`);
            const updated = prev.map(c => {
              if (c.id === comment.parentCommentId) {
                console.log(`[CollaborativeComments] Found parent comment ${c.id}, adding reply`);
                const newReplies = [...(c.replies || []), comment];
                console.log(`[CollaborativeComments] New replies count: ${newReplies.length}`);
                return {
                  ...c,
                  replies: newReplies
                };
              }
              // Also check in nested replies in case we need to go deeper
              if (c.replies && c.replies.length > 0) {
                return {
                  ...c,
                  replies: c.replies.map(reply => {
                    if (reply.id === comment.parentCommentId) {
                      return {
                        ...reply,
                        replies: [...(reply.replies || []), comment]
                      };
                    }
                    return reply;
                  })
                };
              }
              return c;
            });
            console.log(`[CollaborativeComments] Updated state, new total replies: ${updated.reduce((sum, c) => sum + (c.replies?.length || 0), 0)}`);
            return updated;
          } else {
            // Top-level comment
            console.log(`[CollaborativeComments] Adding top-level comment`);
            const newComment = { ...comment, replies: [] };
            return [...prev, newComment];
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
      console.log(`[CollaborativeComments] Received task:comment_deleted for taskId=${data.taskId}, current=${taskId}`);
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

    const handleCommentUpdated = (data) => {
      console.log(`[CollaborativeComments] Received task:comment_updated for taskId=${data.taskId}, commentId=${data.commentId}`);
      if (data.taskId === taskId) {
        console.log(`[CollaborativeComments] Updating comment ${data.commentId} with files:`, data.comment.files);
        setComments((prev) => {
          return prev.map((c) => {
            if (c.id === data.commentId) {
              console.log(`[CollaborativeComments] Found comment ${data.commentId}, updating with ${data.comment.files.length} files`);
              return {
                ...c,
                files: data.comment.files,
              };
            }
            // Also check replies
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: c.replies.map((reply) => {
                  if (reply.id === data.commentId) {
                    console.log(`[CollaborativeComments] Found reply ${data.commentId}, updating files`);
                    return {
                      ...reply,
                      files: data.comment.files,
                    };
                  }
                  return reply;
                })
              };
            }
            return c;
          });
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
    io.on("task:comment_updated", handleCommentUpdated);
    io.on("task:comment_deleted", handleCommentDeleted);
    io.on("task:user_typing", handleUserTyping);
    io.on("task:user_stop_typing", handleUserStopTyping);

    console.log(`[CollaborativeComments] Socket listeners registered`);

    return () => {
      console.log(`[CollaborativeComments] Cleaning up socket listeners for taskId=${taskId}`);
      io.off("task:comment_added", handleNewComment);
      io.off("task:comment_updated", handleCommentUpdated);
      io.off("task:comment_deleted", handleCommentDeleted);
      io.off("task:user_typing", handleUserTyping);
      io.off("task:user_stop_typing", handleUserStopTyping);
      io.emit("leave_task", { taskId });
    };
  }, [io, taskId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 0);
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
    
    // Validate files and set initial status
    const newStatus = {};
    files.forEach((file) => {
      // Check file size (limit to 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        newStatus[file.name] = 'error';
      } else {
        newStatus[file.name] = 'uploading';
      }
    });
    
    setFileUploadStatus(newStatus);
    setNewCommentFiles((prev) => [...prev, ...files]);

    // Simulate validation and mark as success (files are ready to be sent)
    // In a real scenario, you might validate with the server
    setTimeout(() => {
      setFileUploadStatus((prev) => {
        const updated = { ...prev };
        files.forEach((file) => {
          if (prev[file.name] !== 'error') {
            updated[file.name] = 'success';
          }
        });
        return updated;
      });
    }, 500);
  };

  const handleRemoveFile = (index) => {
    const removedFile = newCommentFiles[index];
    setNewCommentFiles((prev) => prev.filter((_, i) => i !== index));
    
    // Clear upload status for this file
    setFileUploadStatus((prev) => {
      const updated = { ...prev };
      delete updated[removedFile.name];
      return updated;
    });
  };

  const getFileUrl = (file) => {
    // Convert R2 key to proxy URL
    if (file.key) {
      return `${apiUrl}/api/files/proxy?key=${encodeURIComponent(file.key)}`;
    }
    // Fallback to direct URL if available (for backward compat)
    return file.url || null;
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

      console.log(`[CollaborativeComments] Submitting comment to task ${taskId}`);
      const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to submit comment");

      const newCommentData = await res.json();
      console.log(`[CollaborativeComments] Comment submitted, id=${newCommentData.id}`, newCommentData);

      setNewComment("");
      setNewCommentFiles([]);
      setFileUploadStatus({}); // Clear all upload statuses
      setReplyingTo(null);
      
      if (io) {
        io.emit("stop_typing", { taskId });
      }

      // Don't reload - let socket event update the state
      // The server will broadcast the comment via socket.io
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

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const CommentThread = ({ comment, depth = 0 }) => {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [replySubmitting, setReplySubmitting] = useState(false);

    const handleSubmitReply = async (e) => {
      e.preventDefault();
      if (!replyText.trim() || replySubmitting) return;

      try {
        setReplySubmitting(true);
        const formData = new FormData();
        formData.append("content", replyText.trim());
        formData.append("parentCommentId", comment.id);

        console.log(`[CommentThread] Submitting reply to comment ${comment.id}`);
        const res = await fetch(`${apiUrl}/api/tasks/${taskId}/comments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to submit reply");
        }

        const replyData = await res.json();
        console.log(`[CommentThread] Reply submitted successfully`, replyData);
        
        setReplyText("");
        setShowReplyInput(false);
      } catch (err) {
        console.error("[CommentThread] Submit reply error:", err);
      } finally {
        setReplySubmitting(false);
      }
    };

    return (
      <div key={comment.id} style={{ marginLeft: depth > 0 ? "32px" : "0", marginBottom: "10px" }}>
        <div className="cc-comment-item">
          <div className="cc-avatar" style={{ background: ["#f3d9fa", "#d9f0fa", "#fad9e8"][comment.userId % 3] }}>
            {getInitials(comment.userName)}
          </div>
          <div className="cc-comment-content">
            <div className="cc-comment-header">
              <strong>{comment.userName || "User"}</strong>
              <span className="cc-comment-role">{comment.userRole || "Faculty lead"}</span>
              <span className="cc-comment-dot">·</span>
              <span className="cc-comment-time">Today · {formatTime(comment.createdAt)}</span>
            </div>
            <div className="cc-comment-text">{comment.content}</div>
            {comment.files && comment.files.length > 0 && (
              <div className="cc-comment-files">
                {/* Render images inline, other files as badges */}
                {comment.files.map((file, idx) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
                  const isLoading = !file.key && !file.url; // Files without key/url are still uploading to R2
                  const fileUrl = getFileUrl(file);
                  
                  return isImage ? (
                    isLoading ? (
                      <div key={idx} className="cc-image-loading">
                        <div className="cc-image-spinner" />
                        <span className="cc-image-name">{file.name}</span>
                      </div>
                    ) : (
                      <img
                        key={idx}
                        src={fileUrl}
                        alt={file.name}
                        className="cc-image-preview"
                        title={file.name}
                        onLoad={() => console.log(`[Image loaded] ${fileUrl}`)}
                        onError={() => console.error(`[Image failed to load] ${fileUrl}`)}
                      />
                    )
                  ) : (
                    isLoading ? (
                      <div key={idx} className="cc-file-badge cc-file-loading">
                        <span>⏳ {file.name}</span>
                      </div>
                    ) : (
                      <a
                        key={idx}
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cc-file-badge"
                        title={file.name}
                      >
                        📎 {file.name}
                      </a>
                    )
                  );
                })}
              </div>
            )}
            <div className="cc-comment-actions">
              <button
                className="cc-action-btn"
                onClick={() => setShowReplyInput(!showReplyInput)}
              >
                ↩ Reply
              </button>
            </div>
            {showReplyInput && (
              <form onSubmit={handleSubmitReply} className="cc-inline-reply">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.userName.split(' ')[0]}...`}
                  rows={2}
                  disabled={replySubmitting}
                  autoFocus
                />
                <div className="cc-inline-reply-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyText("");
                    }}
                    disabled={replySubmitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={!replyText.trim() || replySubmitting}>
                    ↗ Reply
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div className="cc-replies-container">
            {comment.replies.map((reply) => (
              <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="cc-loading">Loading comments...</div>;

  const totalComments = comments.length + comments.reduce((sum, c) => sum + (c.replies?.length || 0), 0);

  return (
    <div className="cc-discussion-container">
      <div className="cc-meta-header">
        <span>{totalComments} messages · {comments.filter(c => c.replies?.length > 0).length} replies</span>
      </div>

      <div className="cc-thread" ref={scrollContainerRef}>
        {comments.length === 0 ? (
          <div className="cc-empty-state">
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          comments.map((comment) => <CommentThread key={comment.id} comment={comment} />)
        )}

        {typingUsers.size > 0 && (
          <div className="cc-typing-indicator">
            <em>{Array.from(typingUsers).length} typing...</em>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmitComment} className="cc-main-composer">
        <textarea
          value={newComment}
          onChange={handleCommentChange}
          placeholder="Write a note, ask a question, or mention what needs checking..."
          rows={3}
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
        {newCommentFiles.length > 0 && (
          <div className="cc-attached-files">
            {newCommentFiles.map((file, idx) => {
              const status = fileUploadStatus[file.name];
              return (
                <div key={idx} className={`cc-attached-file cc-attached-file-${status || 'pending'}`}>
                  <span>
                    {status === 'success' && '✓'}
                    {status === 'uploading' && '⟳'}
                    {status === 'error' && '✕'}
                    {!status && '📎'}
                    {' '}
                    {file.name}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveFile(idx)}
                    disabled={submitting}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <div className="cc-composer-footer">
          <small>Ctrl / Cmd + Enter to send</small>
          <div className="cc-composer-buttons">
            <button
              type="button"
              className="cc-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting}
            >
              📎 Add picture / PDF
            </button>
            <button type="submit" className="cc-send-btn" disabled={!newComment.trim() || submitting}>
              ↗ Send message
            </button>
          </div>
        </div>
      </form>

      {error && <div className="cc-error-message">{error}</div>}

      <style>{`
  /* Discussion Container */
  .cc-discussion-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: #fff;
    border-radius: 8px;
  }

  .cc-meta-header {
    padding: 0 0 10px 0;
    font-size: 10px;
    color: #9d91a5;
    letter-spacing: 0.02em;
  }

  /* Thread Area */
  .cc-thread {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 400px;
    overflow-y: auto;
    padding: 12px 0;
    margin-bottom: 16px;
  }

  .cc-thread::-webkit-scrollbar {
    width: 5px;
  }

  .cc-thread::-webkit-scrollbar-track {
    background: #f8f5fc;
    border-radius: 3px;
  }

  .cc-thread::-webkit-scrollbar-thumb {
    background: #d9cbe6;
    border-radius: 3px;
  }

  .cc-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #b0a0bd;
    font-size: 11px;
  }

  /* Comment Item */
  .cc-comment-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .cc-avatar {
    width: 32px;
    height: 32px;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 800;
    color: #5a4768;
    flex-shrink: 0;
  }

  .cc-comment-content {
    flex: 1;
    min-width: 0;
  }

  .cc-comment-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .cc-comment-header strong {
    font-size: 11px;
    font-weight: 700;
    color: #3a2a45;
  }

  .cc-comment-role {
    font-size: 10px;
    color: #9d8fa8;
  }

  .cc-comment-dot {
    font-size: 10px;
    color: #d0c4db;
  }

  .cc-comment-time {
    font-size: 10px;
    color: #b0a0bd;
  }

  .cc-comment-text {
    font-size: 11px;
    color: #5d4867;
    line-height: 1.5;
    margin-bottom: 6px;
    word-wrap: break-word;
  }

  .cc-comment-files {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .cc-image-preview {
    max-width: 100%;
    max-height: 300px;
    border-radius: 8px;
    border: 1px solid #e0d5ef;
    background: #f5f0fb;
    object-fit: cover;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  }

  .cc-image-preview:hover {
    border-color: #7c3aed;
    box-shadow: 0 4px 8px rgba(124, 58, 237, 0.15);
    transform: scale(1.02);
  }

  .cc-image-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    max-width: 200px;
    border-radius: 8px;
    border: 2px dashed #d9cbe6;
    background: #f5f0fb;
  }

  .cc-image-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #e0d5ef;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .cc-image-name {
    font-size: 10px;
    color: #7c3aed;
    font-weight: 600;
    word-break: break-word;
  }

  .cc-file-loading {
    opacity: 0.7;
    background: #fcf8fe;
  }

  .cc-file-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #f5f0fb;
    border: 1px solid #e5dff3;
    border-radius: 5px;
    font-size: 10px;
    color: #7c3aed;
    text-decoration: none;
    transition: all 0.2s;
  }

  .cc-file-badge:hover {
    background: #ede7fb;
    border-color: #7c3aed;
  }

  .cc-comment-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .cc-action-btn {
    padding: 3px 7px;
    border: 1px solid #e9ddfb;
    border-radius: 4px;
    background: #faf8fc;
    color: #8d7e98;
    font-size: 9px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cc-action-btn:hover {
    background: #f0ebfa;
    border-color: #dfc8f0;
    color: #6d5b7d;
  }

  /* Inline Reply Form */
  .cc-inline-reply {
    margin-top: 10px;
    padding: 10px;
    background: #fcfaff;
    border: 1px solid #e9ddfb;
    border-radius: 7px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cc-inline-reply textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e0d5ef;
    border-radius: 6px;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 10px;
    color: #5d4867;
    resize: none;
    outline: none;
    transition: all 0.2s;
    background: #fff;
  }

  .cc-inline-reply textarea:focus {
    border-color: #a78bfa;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
  }

  .cc-inline-reply-actions {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }

  .cc-inline-reply-actions button {
    padding: 5px 10px;
    border: 1px solid #e0d5ef;
    border-radius: 5px;
    background: #fff;
    color: #8d7e98;
    font-size: 9px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cc-inline-reply-actions button[type="submit"] {
    background: #7c3aed;
    border-color: #7c3aed;
    color: #fff;
  }

  .cc-inline-reply-actions button:hover:not(:disabled) {
    background: #6d28d9;
    border-color: #6d28d9;
    color: #fff;
  }

  .cc-inline-reply-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Replies Container */
  .cc-replies-container {
    margin-top: 10px;
  }

  /* Main Composer */
  .cc-main-composer {
    padding: 16px;
    background: #faf8fc;
    border: 1px solid #e9ddfb;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cc-main-composer textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e0d5ef;
    border-radius: 7px;
    font-family: 'DM Sans', -apple-system, sans-serif;
    font-size: 11px;
    color: #5d4867;
    resize: vertical;
    outline: none;
    transition: all 0.2s;
    background: #fff;
    min-height: 80px;
  }

  .cc-main-composer textarea::placeholder {
    color: #b0a0bd;
  }

  .cc-main-composer textarea:focus {
    border-color: #a78bfa;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
  }

  .cc-main-composer textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .cc-attached-files {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cc-attached-file {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: #fff;
    border: 1px solid #e9ddfb;
    border-radius: 5px;
    font-size: 10px;
    color: #5d4867;
    transition: all 0.2s;
  }

  .cc-attached-file-pending {
    border-color: #d9cbe6;
    background: #fcfaff;
  }

  .cc-attached-file-uploading {
    border-color: #a78bfa;
    background: #f5f0fb;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .cc-attached-file-uploading span {
    color: #7c3aed;
    font-weight: 600;
  }

  .cc-attached-file-success {
    border-color: #10b981;
    background: #f0fdf4;
  }

  .cc-attached-file-success span {
    color: #059669;
    font-weight: 600;
  }

  .cc-attached-file-error {
    border-color: #ef4444;
    background: #fef2f2;
  }

  .cc-attached-file-error span {
    color: #dc2626;
    font-weight: 600;
  }

  .cc-attached-file button {
    padding: 2px 5px;
    border: none;
    background: transparent;
    color: #9a8ba6;
    font-size: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: color 0.2s;
  }

  .cc-attached-file button:hover:not(:disabled) {
    color: #b55e51;
  }

  .cc-attached-file button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .cc-composer-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .cc-composer-footer small {
    font-size: 9px;
    color: #b0a0bd;
  }

  .cc-composer-buttons {
    display: flex;
    gap: 8px;
  }

  .cc-attach-btn,
  .cc-send-btn {
    padding: 7px 12px;
    border: 1px solid #d9cbe6;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cc-attach-btn {
    background: #fff;
    color: #7c3aed;
    border-color: #7c3aed;
  }

  .cc-attach-btn:hover:not(:disabled) {
    background: #f5f0fb;
    box-shadow: 0 2px 4px rgba(124, 58, 237, 0.15);
  }

  .cc-send-btn {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    border-color: #7c3aed;
    color: #fff;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.25);
  }

  .cc-send-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%);
    box-shadow: 0 3px 8px rgba(124, 58, 237, 0.35);
    transform: translateY(-1px);
  }

  .cc-attach-btn:disabled,
  .cc-send-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Typing Indicator */
  .cc-typing-indicator {
    padding: 6px 0;
    font-size: 10px;
    color: #9a88a6;
    font-style: italic;
  }

  /* Error Message */
  .cc-error-message {
    margin-top: 8px;
    padding: 8px 12px;
    border-radius: 6px;
    background: #fff9f8;
    border: 1px solid #f5d1cc;
    color: #b55e51;
    font-size: 10px;
  }

  /* Loading State */
  .cc-loading {
    padding: 40px 20px;
    text-align: center;
    color: #b0a0bd;
    font-size: 11px;
  }
`}</style>
    </div>
  );
}
