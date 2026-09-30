import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileImage,
  FileText,
  ListChecks,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  ShieldCheck,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "./socket.js";
import { r2ToProxyUrl } from "../utils/r2ProxyHelper.js";

const ADMIN_ROLES = ["admin", "program_chair"];

function getUser(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return {};
  }
}

function initials(value) {
  return String(value || "Faculty")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const tones = ["violet", "rose", "blue", "green", "amber"];
const getTone = (index) => tones[index % tones.length];

// PDF reading URL formatter (matching TaskDetail.jsx pattern)
const pdfReadingUrl = (value, zoom = "page-width") => {
  if (!value) return "";
  const [fileUrl, currentFragment = ""] = value.split("#");
  const params = new URLSearchParams(currentFragment);
  params.set("navpanes", "0");
  params.set("toolbar", "0");
  params.set("zoom", String(zoom));
  return `${fileUrl}#${params.toString()}`;
};

// Recursive component to render threaded replies
// Maximum visual nesting depth is 6 levels to prevent UI from getting too narrow
const MAX_VISUAL_DEPTH = 6;

function RenderReplies({ 
  replies, 
  depth, 
  replyTo, 
  setReplyTo, 
  getTone, 
  initials, 
  formatDate,
  imageLoadingStates,
  setImageLoadingStates,
  replyDraft,
  setReplyDraft,
  replyFiles,
  setReplyFiles,
  replyFileProgress,
  setReplyFileProgress,
  replyUploadedFiles,
  setReplyUploadedFiles,
  isReplyUploadingFiles,
  setIsReplyUploadingFiles,
  replyFilesRef,
  setError,
  api,
  token,
  taskId
}) {
  // Only indent if we haven't reached max visual depth
  const shouldIndent = depth <= MAX_VISUAL_DEPTH;
  
  return (
    <div style={{ 
      marginLeft: shouldIndent ? "28px" : "0", 
      borderLeft: shouldIndent ? "2px solid #e9ddfb" : "none", 
      paddingTop: "8px" 
    }}>
      {replies.map((reply) => (
        <div key={reply.id}>
          <article className="collab-message" style={{ background: "#fcfaff", border: "1px solid #f0ebf3" }}>
            <span className={`collab-avatar ${getTone(reply.user_id || reply.sender_id || 0)}`}>
              {initials(reply.full_name)}
            </span>
            <div className="collab-message-content">
              <header>
                <strong>{reply.full_name}</strong>
                <small>{formatDate(reply.created_at)}</small>
              </header>
              <p style={{ margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{reply.content}</p>
              {reply.files && reply.files.length > 0 && (
                <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                  {reply.files.map((file, idx) => {
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                    const imageKey = `reply-${reply.id}-file-${idx}`;
                    const imageLoading = imageLoadingStates[imageKey] ?? true;
                    return isImage ? (
                      <div 
                        key={idx}
                        style={{ 
                          position: "relative",
                          display: "inline-block",
                          maxWidth: "280px"
                        }}
                      >
                        {imageLoading && (
                          <div style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#f5f0fb",
                            borderRadius: "6px",
                            border: "1px solid #e2d9e9",
                            zIndex: 1
                          }}>
                            <div style={{
                              width: "24px",
                              height: "24px",
                              border: "2px solid #e2d9e9",
                              borderTopColor: "#7c3aed",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite"
                            }} />
                          </div>
                        )}
                        <a 
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "block", maxWidth: "280px" }}
                        >
                          <img 
                            src={file.url}
                            alt={file.name}
                            onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                            onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                            style={{ 
                              maxWidth: "100%", 
                              borderRadius: "6px", 
                              border: "1px solid #e2d9e9", 
                              cursor: "pointer",
                              display: imageLoading ? "none" : "block"
                            }}
                          />
                        </a>
                      </div>
                    ) : (
                      <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px" }}>📎</span>
                        <a 
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ flex: 1, minWidth: 0, color: "#7043b6", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline" }}
                        >
                          {file.name}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="collab-thread">
                <button type="button" onClick={() => setReplyTo(replyTo === reply.id ? null : reply.id)}>
                  <Reply size={12} /> Reply
                </button>
              </div>
            </div>
          </article>

          {/* Reply form for this nested reply */}
          {replyTo === reply.id && (
            <ReplyForm
              reply={reply}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              replyFileProgress={replyFileProgress}
              setReplyFileProgress={setReplyFileProgress}
              replyUploadedFiles={replyUploadedFiles}
              setReplyUploadedFiles={setReplyUploadedFiles}
              isReplyUploadingFiles={isReplyUploadingFiles}
              setIsReplyUploadingFiles={setIsReplyUploadingFiles}
              replyFilesRef={replyFilesRef}
              setReplyTo={setReplyTo}
              setError={setError}
              api={api}
              token={token}
              taskId={taskId}
            />
          )}

          {/* Recursively render this reply's replies (unlimited threading depth) */}
          {reply.replies && reply.replies.length > 0 && (
            <RenderReplies 
              replies={reply.replies}
              depth={depth + 1}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              getTone={getTone}
              initials={initials}
              formatDate={formatDate}
              imageLoadingStates={imageLoadingStates}
              setImageLoadingStates={setImageLoadingStates}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              replyFiles={replyFiles}
              setReplyFiles={setReplyFiles}
              replyFileProgress={replyFileProgress}
              setReplyFileProgress={setReplyFileProgress}
              replyUploadedFiles={replyUploadedFiles}
              setReplyUploadedFiles={setReplyUploadedFiles}
              isReplyUploadingFiles={isReplyUploadingFiles}
              setIsReplyUploadingFiles={setIsReplyUploadingFiles}
              replyFilesRef={replyFilesRef}
              setError={setError}
              api={api}
              token={token}
              taskId={taskId}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Reply form component (extracted for reuse)
function ReplyForm({
  reply,
  replyDraft,
  setReplyDraft,
  replyFiles,
  setReplyFiles,
  replyFileProgress,
  setReplyFileProgress,
  replyUploadedFiles,
  setReplyUploadedFiles,
  isReplyUploadingFiles,
  setIsReplyUploadingFiles,
  replyFilesRef,
  setReplyTo,
  setError,
  api,
  token,
  taskId
}) {
  return (
    <div style={{ marginTop: "12px", padding: "12px", background: "#fbf8ff", borderRadius: "8px" }}>
      <div style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
        ↳ Reply to {reply.full_name.split(" ")[0]}
      </div>
      <textarea
        key={`reply-to-${reply.id}`}
        value={replyDraft}
        onChange={(e) => setReplyDraft(e.target.value)}
        placeholder={`Write your reply…`}
        rows={2}
        autoFocus
        style={{
          display: "block",
          width: "100%",
          padding: "10px",
          border: "1px solid #e2d9e9",
          borderRadius: "8px",
          outline: "0",
          resize: "vertical",
          color: "#5d4867",
          font: "10px/1.5 DM Sans,Arial,sans-serif",
          boxSizing: "border-box",
          marginBottom: "8px"
        }}
      />
      {replyFiles.length > 0 && (
        <div style={{ marginBottom: "8px", padding: "8px", background: "#fff", borderRadius: "6px", borderTop: "1px solid #e2d6ef" }}>
          <div style={{ fontSize: "8px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
            {replyFiles.length} file(s) attached
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {replyFiles.map((file, idx) => {
              const isPdf = /\.pdf$/i.test(file.name);
              const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
              const progress = replyFileProgress[idx] ?? 0;
              const isUploading = isReplyUploadingFiles && progress < 100;
              
              return (
                <div key={idx} style={{ padding: "8px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ display: "grid", width: "32px", height: "32px", placeItems: "center", borderRadius: "6px", background: isPdf ? "#fef5e5" : isImage ? "#e8f1ff" : "#f0e7fc", color: isPdf ? "#9d6d2a" : isImage ? "#5274a8" : "#7043b7", fontSize: "14px", flexShrink: 0 }}>
                    {isPdf ? "PDF" : isImage ? "🖼" : "📎"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "#5d4867", fontSize: "9px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </div>
                    <div style={{ marginTop: "4px", height: "4px", background: "#e9e0ef", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#7c3aed", width: `${progress}%`, transition: "width 0.2s" }} />
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "8px", color: isUploading ? "#8b7b96" : "#579574", fontWeight: 800 }}>
                      {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setReplyFiles(prev => prev.filter((_, i) => i !== idx));
                      setReplyFileProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[idx];
                        return newProgress;
                      });
                    }}
                    disabled={isReplyUploadingFiles}
                    style={{ background: "none", border: "none", color: "#806f8b", cursor: isReplyUploadingFiles ? "not-allowed" : "pointer", fontSize: "16px", opacity: isReplyUploadingFiles ? 0.5 : 1 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          ref={replyFilesRef}
          type="file"
          hidden
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (replyFiles.length + files.length > 5) {
              setError("Maximum 5 files allowed");
              return;
            }
            
            // Add files to the list
            setReplyFiles(prev => [...prev, ...files]);
            
            // Start uploading immediately
            setIsReplyUploadingFiles(true);
            const uploadedUrls = [];
            
            for (let idx = 0; idx < files.length; idx++) {
              const file = files[idx];
              try {
                const formData = new FormData();
                formData.append("files", file);
                
                setReplyFileProgress(prev => ({ ...prev, [replyFiles.length + idx]: 10 }));
                
                const xhr = new XMLHttpRequest();
                let progressInterval = null;
                
                const startTime = Date.now();
                const estimateProgress = () => {
                  const elapsed = Date.now() - startTime;
                  const estimatedPercent = Math.min(10 + Math.floor((elapsed / 50) * 2), 90);
                  setReplyFileProgress(prev => ({ ...prev, [replyFiles.length + idx]: estimatedPercent }));
                };
                
                progressInterval = setInterval(estimateProgress, 20);
                
                xhr.upload.addEventListener("progress", (event) => {
                  if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    setReplyFileProgress(prev => ({ ...prev, [replyFiles.length + idx]: percentComplete }));
                  }
                });
                
                await new Promise((resolve, reject) => {
                  xhr.addEventListener("load", () => {
                    if (progressInterval) clearInterval(progressInterval);
                    if (xhr.status === 200 || xhr.status === 201) {
                      const response = JSON.parse(xhr.responseText);
                      uploadedUrls.push(response.files[0]);
                      setReplyFileProgress(prev => ({ ...prev, [replyFiles.length + idx]: 100 }));
                      resolve();
                    } else {
                      reject(new Error("Upload failed"));
                    }
                  });
                  
                  xhr.addEventListener("error", () => {
                    if (progressInterval) clearInterval(progressInterval);
                    reject(new Error("Upload failed"));
                  });
                  
                  xhr.open("POST", `${api}/api/upload-files`);
                  xhr.setRequestHeader("Authorization", `Bearer ${token}`);
                  xhr.send(formData);
                });
              } catch (err) {
                console.error("File upload error:", err);
                setError(`Failed to upload ${file.name}`);
              }
            }
            
            setReplyUploadedFiles(prev => [...prev, ...uploadedUrls]);
            setIsReplyUploadingFiles(false);
            
            if (replyFilesRef.current) replyFilesRef.current.value = "";
          }}
        />
        <button
          onClick={() => replyFilesRef.current?.click()}
          disabled={isReplyUploadingFiles || replyFiles.length >= 5}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "7px 9px",
            border: "1px solid #ded2e8",
            borderRadius: "7px",
            background: "#fff",
            color: "#76538d",
            fontSize: "8px",
            fontWeight: "800",
            cursor: "pointer"
          }}
        >
          <Paperclip size={11} /> Add files ({replyFiles.length}/5)
        </button>
        <button
          className="collab-primary"
          onClick={async () => {
            if (!replyDraft.trim() && replyUploadedFiles.length === 0) return;
            
            try {
              const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/comment`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                  content: replyDraft.trim(),
                  parentCommentId: reply.id,
                  files: replyUploadedFiles
                }),
              });
              
              if (response.ok) {
                setReplyDraft("");
                setReplyFiles([]);
                setReplyFileProgress({});
                setReplyTo(null);
                setReplyUploadedFiles([]);
                if (replyFilesRef.current) replyFilesRef.current.value = "";
              } else {
                setError("Failed to post reply");
              }
            } catch (err) {
              setError(err.message);
            }
          }}
          disabled={(!replyDraft.trim() && replyUploadedFiles.length === 0) || isReplyUploadingFiles}
          style={{ marginTop: "0" }}
        >
          <Send size={13} /> Send reply
        </button>
        <button
          onClick={() => {
            setReplyTo(null);
            setReplyDraft("");
            setReplyFiles([]);
            setReplyFileProgress({});
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            padding: "9px 11px",
            border: "1px solid #ded2e8",
            borderRadius: "8px",
            background: "#fff",
            color: "#76538d",
            fontSize: "9px",
            fontWeight: "800",
            cursor: "pointer"
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Manrope:wght@400;600;700;800&display=swap');
  @keyframes spin{0%{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  /* PDF Reader Modal Styles - EXACT from TaskDetail.jsx */
  .td-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.td-reader{width:min(1120px,calc(100vw - 48px));max-height:calc(100vh - 36px);overflow:auto;border:1px solid #e1d8ea;border-radius:13px;background:#fff;box-shadow:0 28px 80px rgba(45,27,64,.32)}.td-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:16px 18px;border-bottom:1px solid #eee7f2}.td-reader-eyebrow{display:flex;align-items:center;gap:6px;color:#9c8da7;font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.td-reader-eyebrow i{width:5px;height:5px;border-radius:50%;background:#a78bfa}.td-reader-head h2{margin:7px 0 0;color:#4b3757;font:800 18px Manrope,sans-serif;letter-spacing:-.04em}.td-reader-head p{margin:5px 0 0;color:#907f9a;font-size:11px}.td-reader-head-actions{display:flex;align-items:center;gap:11px;padding-top:4px}.td-reader-head-actions span{color:#8058a5;font-size:11px;font-weight:800}.td-reader-head-actions button{display:grid;width:28px;height:28px;place-items:center;border:1px solid #e2d9e8;border-radius:7px;background:#fff;color:#76568d;font-size:17px;cursor:pointer}.td-reader-stage{padding:18px;background:linear-gradient(135deg,#f2edf8,#faf9fd)}.td-reader-frame{width:min(680px,100%);margin:0 auto;border:1px solid #ded6e4;border-radius:8px;overflow:hidden;background:#27272a;box-shadow:0 16px 30px rgba(49,35,62,.22)}.td-reader-toolbar{display:flex;align-items:center;gap:9px;min-height:43px;padding:0 12px;background:#303035;color:#f7f4fb}.td-reader-toolbar b{display:grid;min-width:18px;height:20px;place-items:center;border-radius:3px;background:#171719;color:#fff;font-size:12px}.td-reader-toolbar span{font-size:12px;font-weight:800}.td-reader-toolbar button{display:grid;width:21px;height:21px;place-items:center;border:0;border-radius:3px;background:transparent;color:#f5f3f7;font-size:16px;cursor:pointer}.td-reader-toolbar button:hover{background:rgba(255,255,255,.12)}.td-reader-toolbar .td-reader-toolbar-spacer{flex:1}.td-reader-paper{display:flex;min-height:clamp(440px,67vh,720px);align-items:stretch;justify-content:center;background:#f7f7f7}.td-reader-paper iframe{width:100%;min-height:clamp(440px,67vh,720px);border:0;background:#fff}.td-reader-paper img{display:block;max-width:100%;max-height:clamp(440px,67vh,720px);object-fit:contain;background:#fff}.td-reader-fallback{display:flex;min-height:440px;flex-direction:column;align-items:center;justify-content:center;gap:9px;padding:24px;color:#806e89;text-align:center}.td-reader-fallback strong{color:#60496d;font-size:13px}.td-reader-fallback span{max-width:300px;font-size:12px;line-height:1.55}@media(max-width:720px){.td-reader{width:calc(100vw - 20px);max-height:calc(100vh - 20px)}.td-reader-head{padding:13px}.td-reader-head h2{font-size:16px}.td-reader-head-actions span{display:none}.td-reader-stage{padding:11px}.td-reader-toolbar{gap:5px;padding:0 8px}.td-reader-paper,.td-reader-paper iframe{min-height:58vh}.td-reader-paper img{max-height:58vh}}
  .collab-standalone{min-height:100vh;background:#f8f7ff;color:#4c3b58;font-family:'DM Sans','Manrope',system-ui,sans-serif;box-sizing:border-box;display:flex;flex-direction:column}.collab-standalone *{box-sizing:border-box}.collab-wrapper{flex:1;overflow:auto;padding:28px 40px 44px}@media(min-width:1100px){.collab-wrapper{padding-left:clamp(48px,5vw,84px);padding-right:clamp(48px,5vw,84px)}}.collab-shell{max-width:none;margin:0 auto}.collab-hero,.collab-card,.collab-side-card{border:1px solid #e6dcef;border-radius:16px;background:#fff;box-shadow:0 12px 28px rgba(73,44,105,.045)}.collab-hero{padding:24px 28px;background:linear-gradient(125deg,#fff,#fbf9ff 48%,#f0e8ff)}.collab-top,.collab-hero-grid,.collab-heading,.collab-person,.collab-version,.collab-composer-footer,.collab-actions{display:flex;align-items:center;justify-content:space-between;gap:14px}.collab-back,.collab-link{border:0;background:transparent;color:#76558e;font-size:12px;font-weight:800;cursor:pointer}.collab-live{color:#55957a;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-live i{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#50b084}.collab-hero-grid{align-items:end;margin-top:34px}.collab-eyebrow,.collab-kicker{display:block;color:#947fa4;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.collab-eyebrow svg{vertical-align:-2px;margin-right:5px}.collab-hero h1{max-width:650px;margin:10px 0 9px;color:#372541;font:800 38px/1.05 'Manrope',Arial,sans-serif;letter-spacing:-.06em}.collab-hero p{max-width:650px;margin:0;color:#887995;font-size:12px;line-height:1.55}.collab-meta{display:flex;flex-wrap:wrap;gap:12px;margin-top:18px;color:#887995;font-size:10px}.collab-meta span{display:flex;align-items:center;gap:5px}.collab-status{width:250px;padding:17px;border:1px solid #e2d6ef;border-radius:12px;background:rgba(255,255,255,.86)}.collab-status small,.collab-status strong{display:block}.collab-status small{color:#9888a1;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.collab-status strong{margin-top:7px;color:#553d66;font:800 16px 'Manrope',Arial,sans-serif}.collab-progress{height:6px;margin-top:14px;border-radius:99px;background:#e9e0ef;overflow:hidden}.collab-progress i{display:block;height:100%;border-radius:inherit;background:#7c3aed}.collab-status em{display:block;margin-top:7px;color:#8b7b96;font-size:9px;font-style:normal}.collab-layout{display:grid;grid-template-columns:minmax(0,1.48fr) minmax(280px,.56fr);align-items:start;gap:16px;margin-top:16px}.collab-main,.collab-side{display:flex;flex-direction:column;gap:16px}.collab-card,.collab-side-card{padding:22px}.collab-heading{align-items:flex-start}.collab-heading h2{margin:4px 0 0;color:#4b3858;font:800 18px 'Manrope',Arial,sans-serif;letter-spacing:-.045em}.collab-count,.collab-badge{padding:6px 8px;border-radius:6px;background:#f0e7fc;color:#7546b5;font-size:9px;font-weight:800;white-space:nowrap}.collab-muted{margin:13px 0 0;color:#8f8199;font-size:10px;line-height:1.55}.collab-brief-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px;padding-top:16px;border-top:1px solid #f0ebf3}.collab-brief-grid small,.collab-brief-grid strong{display:block}.collab-brief-grid small{color:#9b8da2;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-brief-grid strong{margin-top:7px;color:#56405f;font-size:10px;line-height:1.35}.collab-version{margin-top:16px;padding:11px;border:1px solid #e1d5ef;border-radius:9px;background:#fbf8ff;display:flex;align-items:center;gap:9px}.collab-version>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee3fc;color:#7043b6;flex-shrink:0}.collab-version>div{min-width:0;flex:1}.collab-version strong,.collab-version small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-version strong{color:#5f456d;font-size:10px}.collab-version small{margin-top:3px;color:#978aa0;font-size:8px}.collab-version em{padding:5px 7px;border-radius:5px;background:#fff3d7;color:#966f22;font-size:8px;font-style:normal;font-weight:800}.collab-people{display:grid;gap:8px;margin-top:15px}.collab-person{display:flex;align-items:center;gap:9px;padding:10px;border:1px solid #eee8f2;border-radius:9px}.collab-avatar{display:grid;width:29px;height:29px;flex:none;place-items:center;border-radius:8px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}.collab-avatar.rose{background:#fde9ef;color:#b45c77}.collab-avatar.blue{background:#e8f1ff;color:#5274a8}.collab-avatar.green{background:#e4f5ec;color:#4d966e}.collab-avatar.amber{background:#fef5e5;color:#9d6d2a}.collab-person-copy{min-width:0;flex:1}.collab-person-copy strong,.collab-person-copy small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-person-copy strong{color:#5a4568;font-size:10px}.collab-person-copy small{margin-top:3px;color:#978ba1;font-size:8px}.collab-person-status{display:inline-flex;align-items:center;gap:4px;color:#8d8195;font-size:8px;font-weight:800}.collab-person-status.confirmed{color:#579574}.collab-toggle{padding:5px 7px;border:1px solid #ded2e8;border-radius:6px;background:#fff;color:#76558e;font-size:8px;font-weight:800;cursor:pointer}.collab-upload{display:flex;align-items:center;gap:10px;width:100%;margin-top:16px;padding:12px;border:1px dashed #cdbbe6;border-radius:9px;background:#fff;color:#7044a3;text-align:left;cursor:pointer;position:relative}.collab-upload.selected{border-style:solid;border-color:#bfe1cd;background:#f5fbf8;color:#4d8d6c}.collab-upload>span{display:grid;width:31px;height:31px;place-items:center;border-radius:8px;background:#eee5ff;flex-shrink:0}.collab-upload>div{min-width:0;flex:1}.collab-upload strong,.collab-upload small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-upload strong{font-size:10px}.collab-upload small{margin-top:3px;color:#9a8ba6;font-size:8px}.collab-label{display:block;margin-top:12px;color:#806f8b;font-size:8px;font-weight:800;letter-spacing:.07em;text-transform:uppercase}.collab-label textarea,.collab-composer textarea,.collab-review textarea,.collab-modal textarea{display:block;width:100%;margin-top:7px;padding:10px;border:1px solid #e2d9e9;border-radius:8px;outline:0;resize:vertical;color:#5d4867;font:10px/1.5 DM Sans,Arial,sans-serif}.collab-primary,.collab-review button{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:11px;padding:9px 11px;border:0;border-radius:8px;background:#7c3aed;color:#fff;font-size:9px;font-weight:800;cursor:pointer}.collab-primary:disabled,.collab-review button:disabled{background:#ddd3e5;color:#9c91a5;cursor:not-allowed}.collab-history{display:grid;gap:7px;margin-top:17px}.collab-history>div{display:flex;align-items:center;gap:9px;padding:9px;border-top:1px solid #f0ebf3}.collab-history>div>span{display:grid;width:27px;height:27px;place-items:center;border-radius:7px;background:#eee5fb;color:#7043b7;font-size:8px;font-weight:800}.collab-history>div>div{min-width:0;flex:1}.collab-history strong,.collab-history small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-history strong{color:#5c4668;font-size:9px}.collab-history small{margin-top:3px;color:#998ba3;font-size:8px}.collab-history em{color:#7b5aa1;font-size:8px;font-style:normal;font-weight:800}.collab-messages{display:grid;gap:12px;margin-top:16px}.collab-message{display:flex;gap:9px;padding:11px;border:1px solid #f0ebf3;border-radius:9px;background:#fdfcff}.collab-message-content{min-width:0;flex:1}.collab-message header{display:flex;align-items:center;gap:7px}.collab-message header strong{color:#5b4766;font-size:9px}.collab-message header small{color:#a394a8;font-size:8px}.collab-message p{margin:6px 0 0;color:#75657d;font-size:9px;line-height:1.5}.collab-thread{display:flex;gap:9px;margin-top:8px}.collab-thread button{display:inline-flex;align-items:center;gap:4px;border:0;background:transparent;color:#7954a0;font-size:8px;font-weight:800;cursor:pointer}.collab-attachment{display:grid;grid-template-columns:28px minmax(0,1fr);gap:4px 7px;margin-top:8px;padding:8px;border:1px solid #e5d9ef;border-radius:8px;background:#fbf8ff}.collab-attachment span{display:grid;width:28px;height:28px;place-items:center;grid-row:span 2;border-radius:7px;background:#eee5fb;color:#7043b7}.collab-attachment strong,.collab-attachment small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.collab-attachment strong{color:#60486f;font-size:9px}.collab-attachment small{color:#998ba3;font-size:7px}.collab-composer{margin-top:16px;border:1px solid #e4dce9;border-radius:10px;background:#fff;overflow:hidden}.collab-composer textarea{min-height:75px;margin:0;padding:11px;border:0}.collab-composer-footer{align-items:flex-end;padding:8px}.collab-composer-footer small{color:#998ba3;font-size:8px}.collab-composer-footer strong{color:#5d4867;font-size:9px}.collab-composer-actions{display:flex;gap:6px}.collab-composer-actions button{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:0;border-radius:7px;background:#7c3aed;color:#fff;font-size:8px;font-weight:800;cursor:pointer}.collab-composer-actions button:first-child{border:1px solid #ddd1e8;background:#fff;color:#76538d}.collab-composer-actions button:disabled{opacity:.45;cursor:not-allowed}.collab-review h2,.collab-side-card h2{margin:8px 0;color:#51395d;font:800 18px/1.15 'Manrope',Arial,sans-serif;letter-spacing:-.05em}.collab-review p,.collab-side-card p{margin:0;color:#8a7996;font-size:9px;line-height:1.55}.collab-review textarea{margin-top:13px}.collab-review-actions{display:flex;gap:7px}.collab-review-actions button{flex:1}.collab-review-actions button:last-child{border:1px solid #d8c8e8;background:#fff;color:#76538d}.collab-modal-backdrop{position:fixed;inset:0;z-index:20;display:grid;place-items:center;padding:20px;background:rgba(44,26,62,.24)}.collab-modal{position:relative;width:min(480px,100%);padding:24px;border:1px solid #e4d7ef;border-radius:15px;background:#fff;box-shadow:0 22px 50px rgba(46,25,67,.18)}.collab-modal h2{margin:7px 0;color:#4b3656;font:800 19px 'Manrope',Arial,sans-serif}.collab-modal p{color:#8d7f97;font-size:10px;line-height:1.5}.collab-modal-close{position:absolute;top:13px;right:13px;border:0;background:transparent;color:#8d7c99;cursor:pointer}.collab-modal-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:16px}.collab-modal-actions button{padding:9px 11px;border:1px solid #ded2e8;border-radius:7px;background:#fff;color:#76538d;font-size:9px;font-weight:800;cursor:pointer}.collab-modal-actions button:last-child{border-color:#7c3aed;background:#7c3aed;color:#fff}@media(max-width:850px){.collab-wrapper{padding:18px}.collab-layout{grid-template-columns:1fr}.collab-status{width:100%;max-width:330px}.collab-hero-grid{align-items:stretch;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.collab-hero{padding:20px}.collab-hero h1{font-size:29px}.collab-card,.collab-side-card{padding:17px}.collab-top{align-items:flex-start;flex-direction:column}.collab-brief-grid{grid-template-columns:1fr}.collab-person{align-items:flex-start;flex-wrap:wrap}.collab-toggle{margin-left:38px}.collab-composer-footer{align-items:stretch;flex-direction:column}.collab-composer-actions{width:100%}.collab-composer-actions button{flex:1;justify-content:center}}
`;

export default function CollaborativeTaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = useMemo(() => getUser(token), [token]);
  const isChair = ADMIN_ROLES.includes(user.role);
  const api = import.meta.env.VITE_API_URL || "";

  console.log("[CollaborativeTaskDetail] Component mounted. taskId:", taskId, "token exists:", !!token, "api:", api);

  // State
  const [task, setTask] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [versions, setVersions] = useState([]);
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [revisionFiles, setRevisionFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Awaiting Confirmation");
  const [preview, setPreview] = useState(null);

  const [finalFiles, setFinalFiles] = useState([]);
  const [finalNote, setFinalNote] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [discussionAttachment, setDiscussionAttachment] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionInstructions, setRevisionInstructions] = useState("");
  const [revisionFileProgress, setRevisionFileProgress] = useState({});
  const [revisionUploadedFiles, setRevisionUploadedFiles] = useState([]);
  const [isRevisionUploadingFiles, setIsRevisionUploadingFiles] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [readerZoom, setReaderZoom] = useState("page-width");

  // Comment file upload state
  const [commentFiles, setCommentFiles] = useState([]);
  const [commentFileProgress, setCommentFileProgress] = useState({});
  const [commentUploadedFiles, setCommentUploadedFiles] = useState([]); // Store uploaded file URLs
  const [isCommentUploadingFiles, setIsCommentUploadingFiles] = useState(false);
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyFileProgress, setReplyFileProgress] = useState({});
  const [replyUploadedFiles, setReplyUploadedFiles] = useState([]); // Store uploaded file URLs
  const [isReplyUploadingFiles, setIsReplyUploadingFiles] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState({});

  const finalInputRef = useRef(null);
  const discussionInputRef = useRef(null);
  const commentFilesRef = useRef(null);
  const replyFilesRef = useRef(null);
  const revisionFilesRef = useRef(null);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      try {
        setLoading(true);
        console.log("[CollaborativeTaskDetail] Loading task:", taskId);
        const response = await fetch(`${api}/api/collaborative-tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[CollaborativeTaskDetail] API Response status:", response.status);
        if (!response.ok) throw new Error("Failed to load task");
        const data = await response.json();
        console.log("[CollaborativeTaskDetail] Full API response:", data);
        console.log("[CollaborativeTaskDetail] Task:", data.task);
        console.log("[CollaborativeTaskDetail] Attachments:", data.attachments);
        setTask(data.task);
        setCollaborators((data.collaborators || []).map((c, i) => ({
          ...c,
          confirmed: data.confirmations?.some(conf => conf.user_id === c.user_id && conf.status === "confirmed") || false,
          tone: getTone(i),
        })));
        setVersions(data.versions || []);
        setMessages(data.comments || []);
        setAttachments(data.attachments || []);
        setRevisionFiles(data.revisionFiles || []);
        setStatus(data.task?.status || "Awaiting Confirmation");
        
        socket.emit("join_task", { taskId: parseInt(taskId) });
      } catch (err) {
        console.error("[CollaborativeTaskDetail] Error loading task:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (taskId && token) loadTask();
    
    return () => {
      socket.emit("leave_task", { taskId: parseInt(taskId) });
    };
  }, [taskId, token, api]);

  // Socket listeners
  useEffect(() => {
    if (!task) return;

    console.log("[Socket] Setting up listeners for task", task.id);

    socket.on("collaborative:confirmed", (data) => {
      if (data.taskId === task.id) {
        console.log("[Socket] Received confirmation event", data);
        setCollaborators((prev) =>
          prev.map(c => c.user_id === data.userId ? { ...c, confirmed: true } : c)
        );
      }
    });

    socket.on("collaborative:withdrawn", (data) => {
      if (data.taskId === task.id) {
        console.log("[Socket] Received withdrawn event", data);
        setCollaborators((prev) =>
          prev.map(c => c.user_id === data.userId ? { ...c, confirmed: false } : c)
        );
      }
    });

    socket.on("collaborative:output_updated", (data) => {
      if (data.taskId === task.id) {
        console.log("[Socket] Received output_updated event", data);
        setVersions((prev) => [
          {
            version: data.version,
            file_name: data.fileName,
            uploaded_by: data.uploadedBy,
            created_at: data.uploadedAt,
          },
          ...prev,
        ]);
        setCollaborators((prev) =>
          prev.map(c => ({ ...c, confirmed: false }))
        );
        setStatus("Awaiting Confirmation");
      }
    });

    socket.on("collaborative:auto_submitted", (data) => {
      if (data.taskId === task.id) {
        console.log("[Socket] Received auto_submitted event", data);
        setStatus("For Approval");
        setCollaborators((prev) =>
          prev.map(c => ({ ...c, confirmed: true }))
        );
        // Show success message
        alert("🎉 All collaborators confirmed! Task automatically submitted to Program Chair/Admin for review.");
      }
    });

    socket.on("collaborative:revision_requested", (data) => {
      if (data.taskId === task.id) {
        console.log("[Socket] Received revision_requested event", data);
        setStatus("Pending");
        setCollaborators((prev) =>
          prev.map(c => ({ ...c, confirmed: false }))
        );
        // Update task with revision details
        setTask((prev) => ({
          ...prev,
          return_reason: data.reason,
          revision_instructions: data.instructions,
          status: "Pending"
        }));
        // Set revision files from socket data
        if (data.files && data.files.length > 0) {
          setRevisionFiles(data.files.map(f => ({
            file_url: f.url,
            file_name: f.name,
            file_size: f.size
          })));
        }
      }
    });

    socket.on("collaborative:comment_posted", (comment) => {
      console.log("[Socket] Received comment_posted event", comment);
      if (comment.task_id === parseInt(taskId)) {
        setMessages((prev) => {
          // Skip if comment already exists (by real ID)
          if (prev.some(msg => msg.id === comment.id)) {
            console.log("[Socket] Comment already exists, skipping duplicate");
            return prev;
          }

          // Skip if we have a pending optimistic comment (temp ID exists)
          // This prevents socket from adding our own comment before HTTP response completes
          const hasPendingComment = prev.some(msg => typeof msg.id === 'string' && msg.id.startsWith('temp-'));
          if (hasPendingComment && comment.user_id === prev.find(msg => typeof msg.id === 'string' && msg.id.startsWith('temp-'))?.user_id) {
            console.log("[Socket] Skipping socket update - we have a pending optimistic comment");
            return prev;
          }

          if (comment.parent_comment_id) {
            console.log("[Socket] Processing reply with parent_id:", comment.parent_comment_id);
            // Recursively find and update the parent comment at ANY depth
            const findAndAddReply = (comments) => {
              for (let i = 0; i < comments.length; i++) {
                if (comments[i].id === comment.parent_comment_id) {
                  // Found the parent at this level - add reply to it
                  console.log("[Socket] ✓ Found parent comment", comment.parent_comment_id, "adding reply", comment.id);
                  const updatedComments = [...comments];
                  updatedComments[i] = {
                    ...updatedComments[i],
                    replies: [...(updatedComments[i].replies || []), { ...comment, replies: [] }]
                  };
                  return updatedComments;
                }
                // Check nested replies recursively
                if (comments[i].replies && comments[i].replies.length > 0) {
                  const updated = findAndAddReply(comments[i].replies);
                  // Check if array was actually modified by comparing length or checking deep
                  const foundMatch = updated.some((r, idx) => {
                    if (!comments[i].replies[idx]) return true;
                    return r.id !== comments[i].replies[idx].id;
                  });
                  
                  if (foundMatch || updated.length > comments[i].replies.length) {
                    // Found it in nested replies - update this comment's replies
                    console.log("[Socket] ✓ Found parent in nested level, updating comment", comments[i].id);
                    const updatedComments = [...comments];
                    updatedComments[i] = { ...updatedComments[i], replies: updated };
                    return updatedComments;
                  }
                }
              }
              console.log("[Socket] ✗ Parent not found in current level");
              return comments;
            };
            const result = findAndAddReply(prev);
            console.log("[Socket] After update, messages count:", result.length);
            return result;
          }
          // Root comment
          console.log("[Socket] Adding root comment", comment.id);
          return [...prev, { ...comment, replies: [] }];
        });
      }
    });

    return () => {
      console.log("[Socket] Cleaning up listeners for task", task.id);
      socket.off("collaborative:confirmed");
      socket.off("collaborative:withdrawn");
      socket.off("collaborative:output_updated");
      socket.off("collaborative:auto_submitted");
      socket.off("collaborative:revision_requested");
      socket.off("collaborative:comment_posted");
    };
  }, [taskId]);

  // Handlers
  const toggleConfirmation = (userId) => {
    const isConfirmed = collaborators.find(c => c.user_id === userId)?.confirmed;
    if (isConfirmed) {
      handleWithdraw(userId);
    } else {
      handleConfirm(userId);
    }
  };

  const handleConfirm = async (userId = user.id) => {
    try {
      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      setCollaborators((prev) =>
        prev.map(c => c.user_id === userId ? { ...c, confirmed: true } : c)
      );
      
      // Check if auto-submitted
      if (data.autoSubmitted) {
        setStatus("For Approval");
        alert("🎉 All collaborators confirmed! Task automatically submitted to Program Chair/Admin for review.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleWithdraw = async (userId = user.id) => {
    try {
      await fetch(`${api}/api/collaborative-tasks/${taskId}/withdraw-confirmation`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollaborators((prev) =>
        prev.map(c => c.user_id === userId ? { ...c, confirmed: false } : c)
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const uploadNewVersion = async () => {
    if (finalFiles.length === 0) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const formData = new FormData();
      
      // Append all files
      finalFiles.forEach(file => {
        formData.append("files", file);
      });
      
      formData.append("note", finalNote);

      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          setFinalFiles([]);
          setFinalNote("");
          setUploadProgress(0);
          if (finalInputRef.current) finalInputRef.current.value = "";
        } else {
          setError("Upload failed");
        }
        setIsUploading(false);
      });

      // Handle error
      xhr.addEventListener("error", () => {
        setError("Upload failed");
        setIsUploading(false);
      });

      xhr.open("POST", `${api}/api/collaborative-tasks/${taskId}/upload-final-output`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setIsUploading(false);
    }
  };

  const uploadCommentFiles = async (files) => {
    setIsCommentUploadingFiles(true);
    const uploadedUrls = [];
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const formData = new FormData();
        formData.append("files", file);
        
        // Initialize progress
        setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: 10 }));
        
        const xhr = new XMLHttpRequest();
        let progressInterval = null;
        
        const startTime = Date.now();
        const estimateProgress = () => {
          const elapsed = Date.now() - startTime;
          const estimatedPercent = Math.min(10 + Math.floor((elapsed / 50) * 2), 90);
          setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: estimatedPercent }));
        };
        
        progressInterval = setInterval(estimateProgress, 20);
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: percentComplete }));
          }
        });
        
        await new Promise((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (progressInterval) clearInterval(progressInterval);
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              uploadedUrls.push(response.files[0]); // Get the uploaded file URL
              setCommentFileProgress(prev => ({ ...prev, [commentFiles.length + idx]: 100 }));
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          
          xhr.addEventListener("error", () => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error("Upload failed"));
          });
          
          xhr.open("POST", `${api}/api/upload-files`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error("File upload error:", err);
        setError(`Failed to upload ${file.name}`);
      }
    }
    
    setCommentUploadedFiles(prev => [...prev, ...uploadedUrls]);
    setIsCommentUploadingFiles(false);
  };

  const uploadRevisionFiles = async (files) => {
    setIsRevisionUploadingFiles(true);
    const uploadedUrls = [];
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      try {
        const formData = new FormData();
        formData.append("files", file);
        
        // Initialize progress
        setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: 10 }));
        
        const xhr = new XMLHttpRequest();
        let progressInterval = null;
        
        const startTime = Date.now();
        const estimateProgress = () => {
          const elapsed = Date.now() - startTime;
          const estimatedPercent = Math.min(10 + Math.floor((elapsed / 50) * 2), 90);
          setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: estimatedPercent }));
        };
        
        progressInterval = setInterval(estimateProgress, 20);
        
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: percentComplete }));
          }
        });
        
        await new Promise((resolve, reject) => {
          xhr.addEventListener("load", () => {
            if (progressInterval) clearInterval(progressInterval);
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              uploadedUrls.push(response.files[0]); // Get the uploaded file URL
              setRevisionFileProgress(prev => ({ ...prev, [revisionFiles.length + idx]: 100 }));
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          });
          
          xhr.addEventListener("error", () => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error("Upload failed"));
          });
          
          xhr.open("POST", `${api}/api/upload-files`);
          xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (err) {
        console.error("File upload error:", err);
        setError(`Failed to upload ${file.name}`);
      }
    }
    
    setRevisionUploadedFiles(prev => [...prev, ...uploadedUrls]);
    setIsRevisionUploadingFiles(false);
  };

  const postMessage = async () => {
    if (!messageDraft.trim() && commentUploadedFiles.length === 0) return;
    
    console.log("[postMessage] Starting with:", { messageDraft, files: commentUploadedFiles.length, user });
    
    try {
      // Create optimistic comment object
      const optimisticComment = {
        id: `temp-${Date.now()}`, // Temporary ID
        task_id: parseInt(taskId),
        user_id: user.id,
        sender_id: user.id,
        content: messageDraft.trim(),
        full_name: user.full_name,
        parent_comment_id: null,
        files: commentUploadedFiles,
        created_at: new Date().toISOString(),
        replies: []
      };

      console.log("[postMessage] Created optimistic comment:", optimisticComment);

      // Optimistically add to UI immediately (at the end)
      setMessages(prev => {
        console.log("[postMessage] Adding to messages. Current count:", prev.length);
        const updated = [...prev, optimisticComment];
        console.log("[postMessage] New count:", updated.length);
        return updated;
      });

      // Clear form immediately for better UX
      const savedDraft = messageDraft;
      const savedFiles = commentUploadedFiles;
      setMessageDraft("");
      setCommentFiles([]);
      setCommentFileProgress({});
      setCommentUploadedFiles([]);
      if (commentFilesRef.current) commentFilesRef.current.value = "";

      console.log("[postMessage] Sending to server...");

      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          content: savedDraft.trim(),
          files: savedFiles
        }),
      });
      
      console.log("[postMessage] Server response:", response.status);

      if (response.ok) {
        const realComment = await response.json();
        console.log("[postMessage] Got real comment from server:", realComment);
        // Replace optimistic comment with real one from server
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticComment.id ? { ...realComment, replies: [] } : msg
        ));
      } else {
        console.error("[postMessage] Server error:", response.status);
        // Rollback on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticComment.id));
        setMessageDraft(savedDraft);
        setCommentUploadedFiles(savedFiles);
        setError("Failed to post comment");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const requestRevision = async () => {
    if (!revisionReason.trim()) return;
    try {
      // Send revision request with reason, instructions, and files (v2)
      const response = await fetch(`${api}/api/collaborative-tasks/${taskId}/request-revision`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          reason: revisionReason,
          instructions: revisionInstructions,
          files: revisionUploadedFiles
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to request revision");
      }
      setRevisionReason("");
      setRevisionInstructions("");
      setRevisionFiles([]);
      setRevisionUploadedFiles([]);
      setRevisionFileProgress({});
      setShowRevision(false);
      setStatus("In Progress");
      setCollaborators((prev) => prev.map(c => ({ ...c, confirmed: false })));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#f8f7ff", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes collab-sk-shimmer { 0% { background-position: -600px 0; } 100% { background-position: 600px 0; } }
        @keyframes collab-sk-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes collab-sk-spin { to { transform: rotate(360deg); } }
        .collab-sk { background: linear-gradient(90deg,#ede9fe 0%,#f5f3ff 45%,#ede9fe 90%); background-size:600px 100%; animation: collab-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .collab-sk-dark { background: linear-gradient(90deg,rgba(255,255,255,0.1) 0%,rgba(255,255,255,0.22) 45%,rgba(255,255,255,0.1) 90%); background-size:600px 100%; animation: collab-sk-shimmer 1.5s ease-in-out infinite; border-radius: 7px; }
        .collab-sk-wrap { width: 100%; display: flex; flex-direction: column; animation: collab-sk-fadein 0.3s ease both; }
        .collab-sk-hero { background: linear-gradient(135deg,#2d0a5e 0%,#4a1272 50%,#6b21a8 100%); padding:32px 48px; display:flex; flex-direction:column; gap:12px; }
        .collab-sk-content { padding: 32px 48px; display: flex; flex-direction: column; gap: 24px; }
        .collab-sk-grid { display:grid; grid-template-columns:1fr 420px; gap:32px; }
        .collab-sk-card { background:#fff; border:1px solid #e8e1f5; border-radius:12px; padding:28px; display:flex; flex-direction:column; gap:16px; box-shadow:0 4px 14px rgba(76,29,149,0.06); }
        .collab-sk-spin { width:16px; height:16px; border-radius:50%; flex-shrink:0; border:2px solid rgba(255,255,255,0.2); border-top-color:#c4b5fd; animation:collab-sk-spin 0.75s linear infinite; }
      `}</style>
      <div className="collab-sk-wrap">
        {/* Hero Section - Full Width */}
        <div className="collab-sk-hero">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="collab-sk-spin" />
            <span style={{ color:"rgba(196,181,253,0.7)", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase" }}>Loading Collaborative Task</span>
          </div>
          <div className="collab-sk-dark" style={{ height:32, width:"50%", maxWidth:"600px" }} />
          <div className="collab-sk-dark" style={{ height:18, width:"30%", maxWidth:"350px" }} />
        </div>

        {/* Content Area */}
        <div className="collab-sk-content">
          {/* Main Content Grid */}
          <div className="collab-sk-grid">
            {/* Left Column */}
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {/* Task Info Card */}
              <div className="collab-sk-card" style={{ minHeight:320 }}>
                <div className="collab-sk" style={{ height:22, width:"32%" }} />
                {[65,75,58,68,52,48,55].map((w,i) => (
                  <div key={i} className="collab-sk" style={{ height:16, width:`${w}%` }} />
                ))}
              </div>

              {/* Collaborators Card */}
              <div className="collab-sk-card" style={{ minHeight:220 }}>
                <div className="collab-sk" style={{ height:22, width:"38%" }} />
                <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} className="collab-sk" style={{ width:100, height:100, borderRadius:10 }} />
                  ))}
                </div>
              </div>

              {/* Versions Card */}
              <div className="collab-sk-card" style={{ minHeight:200 }}>
                <div className="collab-sk" style={{ height:22, width:"28%" }} />
                {[1,2].map(i => (
                  <div key={i} className="collab-sk" style={{ height:80, borderRadius:10 }} />
                ))}
              </div>
            </div>

            {/* Right Column - Discussion */}
            <div>
              <div className="collab-sk-card" style={{ minHeight:"calc(100vh - 250px)", position:"sticky", top:"24px" }}>
                <div className="collab-sk" style={{ height:22, width:"48%" }} />
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display:"flex", gap:14, marginTop:14 }}>
                    <div className="collab-sk" style={{ width:46, height:46, borderRadius:"50%", flexShrink:0 }} />
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10 }}>
                      <div className="collab-sk" style={{ height:15, width:"62%" }} />
                      <div className="collab-sk" style={{ height:55, borderRadius:8 }} />
                      <div className="collab-sk" style={{ height:11, width:"32%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  if (error) return <div style={{ padding: "32px", textAlign: "center", color: "#d32f2f" }}>Error: {error}</div>;
  if (!task) return <div style={{ padding: "32px", textAlign: "center" }}>Task not found</div>;

  const confirmedCount = collaborators.filter(c => c.confirmed).length;
  const pendingNames = collaborators.filter(c => !c.confirmed).map(c => c.full_name.split(" ")[0]);

  return (
    <div className="collab-standalone">
      <style>{styles}</style>
      <div className="collab-wrapper">
        <div className="collab-shell">
        <header className="collab-hero">
          <div className="collab-top">
            <button className="collab-back" onClick={() => navigate(-1)}>
              <ArrowLeft size={15} /> Back to task details
            </button>
            <span className="collab-live">
              <i /> Shared task workspace
            </span>
          </div>

          <div className="collab-hero-grid">
            <div>
              <span className="collab-eyebrow">
                <UsersRound size={12} /> Collaborative task · {task.tracking_id}
              </span>
              <h1>{task.title}</h1>
              <div className="collab-meta">
                <span>
                  <Clock3 size={13} /> Due checkpoint · {formatDate(task.deadline)}
                </span>
                <span>
                  <FileText size={13} /> {task.doc_type}
                </span>
                <span>
                  <ShieldCheck size={13} /> {task.priority} priority
                </span>
              </div>
            </div>

            <div className="collab-status">
              <small>Shared task status</small>
              <strong>{status}</strong>
              <div className="collab-progress">
                <i style={{ width: `${status === "Submitted" || status === "For Approval" ? 100 : (confirmedCount / collaborators.length) * 100}%` }} />
              </div>
              <em>
                {status === "Submitted" || status === "For Approval"
                  ? "Submitted to Program Chair / Admin"
                  : `${confirmedCount} / ${collaborators.length} confirmed`}
              </em>
            </div>
          </div>
        </header>

        <div className="collab-layout">
          <main className="collab-main">
            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Shared task brief</span>
                  <h2>Everyone works from the same context</h2>
                </div>
                <span className="collab-count">{collaborators.length} collaborators</span>
              </div>
              <div className="collab-brief-grid">
                <div>
                  <small>Document type</small>
                  <strong>{task.doc_type}</strong>
                </div>
                <div>
                  <small>Workflow owner</small>
                  <strong>Program chair</strong>
                </div>
                <div>
                  <small>Category</small>
                  <strong>{task.category || "General"}</strong>
                </div>
                <div>
                  <small>Due checkpoint</small>
                  <strong>{formatDate(task.deadline)}</strong>
                </div>
              </div>
            </section>

            {task?.notes && (
              <section className="collab-card">
                <div className="collab-heading">
                  <div>
                    <span className="collab-kicker">📋 Instructions from the Program Chair / Admin</span>
                    <h2>What the group needs to complete</h2>
                  </div>
                  <span className="collab-badge">Required before submission</span>
                </div>
                <div style={{ padding: "12px", border: "1px solid #e2d6ef", borderRadius: "9px", background: "#fbf8ff" }}>
                  <p style={{ margin: "0", color: "#5d4867", fontSize: "11px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                    {task.notes}
                  </p>
                </div>
                {attachments.length > 0 && (
                  <div style={{ marginTop: "12px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "8px" }}>
                      Instruction attachments
                    </span>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {attachments.map((file, index) => (
                        <div key={file.id || file.file_url || file.name || index} style={{ padding: "8px", border: "1px solid #e2d6ef", borderRadius: "7px", background: "#fbf8ff", display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px" }}>📄</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ display: "block", color: "#5a4567", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {file.file_name || file.name}
                            </strong>
                            <small style={{ display: "block", marginTop: "2px", color: "#978ba1", fontSize: "8px" }}>
                              {file.size_kb || Math.round((file.file_size || 0) / 1024)} KB
                            </small>
                          </div>
                          <a
                            onClick={() => setPreview(file)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "5px", background: "#eee5fb", color: "#7043b6", textDecoration: "none", fontSize: "8px", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer" }}
                          >
                            <Download size={12} /> Preview
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Revision Notice Section */}
            {(task.return_reason || task.revision_instructions || revisionFiles.length > 0) && status !== "Approved" && status !== "For Approval" && (
              <section className="collab-card" style={{ border: '2px solid #fbbf24', background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e3 100%)' }}>
                <div className="collab-heading">
                  <div>
                    <span className="collab-kicker" style={{ color: '#92400e' }}>⚠️ Revision Required</span>
                    <h2 style={{ color: '#92400e' }}>Admin/Program Chair has requested revisions</h2>
                  </div>
                </div>
                <div style={{ marginTop: '12px', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                  {task.return_reason && (
                    <div style={{ marginBottom: task.revision_instructions || revisionFiles.length > 0 ? '12px' : '0' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        Reason
                      </div>
                      <p style={{ color: '#78350f', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {task.return_reason}
                      </p>
                    </div>
                  )}
                  
                  {task.revision_instructions && (
                    <div style={{ marginBottom: revisionFiles.length > 0 ? '12px' : '0', padding: '12px', background: '#fff', border: '1px solid #fde68a', borderRadius: '6px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        Instructions for Faculty
                      </div>
                      <p style={{ color: '#78350f', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {task.revision_instructions}
                      </p>
                    </div>
                  )}
                  
                  {revisionFiles.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                        Attached Files ({revisionFiles.length})
                      </div>
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {revisionFiles.map((file, idx) => {
                          const isPdf = /\.pdf$/i.test(file.file_name);
                          const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.file_name);
                          
                          return (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#fff', border: '1px solid #fde68a', borderRadius: '6px' }}>
                              <div style={{ display: 'grid', width: '36px', height: '36px', placeItems: 'center', borderRadius: '6px', background: isPdf ? '#fef5e5' : isImage ? '#e8f1ff' : '#f0e7fc', color: isPdf ? '#9d6d2a' : isImage ? '#5274a8' : '#7043b7', fontSize: '16px', flexShrink: 0 }}>
                                {isPdf ? 'PDF' : isImage ? '🖼' : '📎'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ display: 'block', color: '#92400e', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.file_name}
                                </strong>
                                <small style={{ display: 'block', marginTop: '2px', color: '#a16207', fontSize: '10px' }}>
                                  {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Attachment from admin'}
                                </small>
                              </div>
                              <a
                                href={r2ToProxyUrl(api, file.file_url)}
                                download={file.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: '#fbbf24',
                                  color: '#78350f',
                                  textDecoration: 'none',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                              >
                                <Download size={12} /> Download
                              </a>
                              <button
                                onClick={() => setPreview({
                                  file_url: file.file_url,
                                  file_name: file.file_name,
                                  name: file.file_name
                                })}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  background: '#fef3c7',
                                  border: '1px solid #fbbf24',
                                  color: '#78350f',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  whiteSpace: 'nowrap',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                <FileImage size={12} /> Preview
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Confirmation gate</span>
                  <h2>Confirm the latest final output</h2>
                </div>
                <span className="collab-badge">
                  {status === "Submitted" || status === "For Approval"
                    ? status
                    : `${confirmedCount}/${collaborators.length} Confirmed`}
                </span>
              </div>
              <p className="collab-muted">
                Every collaborator confirms the current version. Uploading a new version resets this gate and starts confirmation again.
              </p>

              {/* Display current version files being confirmed */}
              {versions.length > 0 && (
                <div style={{ 
                  marginTop: '16px', 
                  marginBottom: '16px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #faf5ff 0%, #fefbff 100%)',
                  border: '1px solid #e9d5ff',
                  borderRadius: '10px'
                }}>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: 800, 
                    color: '#7c3aed', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    marginBottom: '10px'
                  }}>
                    Current version (v{versions[0].version}) - {versions[0].files?.length || 1} file(s)
                  </div>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {versions[0].files && versions[0].files.length > 0 ? (
                      versions[0].files.map((file, idx) => {
                        const isPdf = /\.pdf$/i.test(file.file_name);
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              background: "#fff",
                              border: "1px solid #e9d5ff",
                              borderRadius: "8px"
                            }}
                          >
                            <div style={{
                              display: 'grid',
                              width: '32px',
                              height: '32px',
                              placeItems: 'center',
                              borderRadius: '6px',
                              background: isPdf ? '#fef5e5' : '#e8f1ff',
                              color: isPdf ? '#9d6d2a' : '#5274a8',
                              fontSize: '9px',
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              {isPdf ? 'PDF' : 'FILE'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                fontSize: "11px",
                                fontWeight: 700,
                                color: '#44354f'
                              }}>
                                {file.file_name}
                              </div>
                              <div style={{
                                fontSize: '9px',
                                color: '#8d7f97',
                                marginTop: '2px'
                              }}>
                                {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : ''}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(file.file_url, '_blank');
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 10px',
                                border: '1px solid #e9d5ff',
                                borderRadius: '6px',
                                background: '#fff',
                                color: '#7c3aed',
                                fontSize: '9px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <Download size={12} /> Download
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 12px",
                        background: "#fff",
                        border: "1px solid #e9d5ff",
                        borderRadius: "8px"
                      }}>
                        <div style={{
                          display: 'grid',
                          width: '32px',
                          height: '32px',
                          placeItems: 'center',
                          borderRadius: '6px',
                          background: /\.pdf$/i.test(versions[0].file_name) ? '#fef5e5' : '#e8f1ff',
                          color: /\.pdf$/i.test(versions[0].file_name) ? '#9d6d2a' : '#5274a8',
                          fontSize: '9px',
                          fontWeight: 800,
                          flexShrink: 0
                        }}>
                          {/\.pdf$/i.test(versions[0].file_name) ? 'PDF' : 'FILE'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            whiteSpace: 'nowrap',
                            fontSize: "11px",
                            fontWeight: 700,
                            color: '#44354f'
                          }}>
                            {versions[0].file_name}
                          </div>
                          <div style={{
                            fontSize: '9px',
                            color: '#8d7f97',
                            marginTop: '2px'
                          }}>
                            {versions[0].file_size ? `${Math.round(versions[0].file_size / 1024)} KB` : ''}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(versions[0].file_url, '_blank');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 10px',
                            border: '1px solid #e9d5ff',
                            borderRadius: '6px',
                            background: '#fff',
                            color: '#7c3aed',
                            fontSize: '9px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <Download size={12} /> Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="collab-people">
                {collaborators.map((collab) => (
                  <div className="collab-person" key={collab.user_id}>
                    <span className={`collab-avatar ${collab.tone}`}>
                      {initials(collab.full_name)}
                    </span>
                    <span className="collab-person-copy">
                      <strong>{collab.full_name}</strong>
                      <small>{collab.role}</small>
                    </span>
                    <span className={`collab-person-status ${collab.confirmed ? "confirmed" : ""}`}>
                      {collab.confirmed ? (
                        <>
                          <Check size={12} /> Confirmed
                        </>
                      ) : (
                        <>
                          <Clock3 size={12} /> Waiting
                        </>
                      )}
                    </span>
                    {collab.user_id === user.id && (
                      <button
                        className="collab-toggle"
                        onClick={() => toggleConfirmation(collab.user_id)}
                      >
                        {collab.confirmed ? "Withdraw" : "Confirm"}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <p className="collab-muted">
                <strong>
                  {status === "Submitted" || status === "For Approval"
                    ? "All collaborators confirmed the latest version."
                    : pendingNames.length
                    ? `${pendingNames.join(" and ")} still need to confirm.`
                    : "Everyone is confirmed."}
                </strong>
              </p>
            </section>

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">Final output</span>
                  <h2>Upload a new version</h2>
                </div>
                <span className="collab-count">v{versions.length || 0}</span>
              </div>
              
              {(status === "For Approval" || status === "Approved") ? (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e3 100%)',
                  border: '1px solid #fde68a',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <ShieldCheck size={20} style={{ color: '#92400e', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
                        {status === "Approved" ? "Task Approved" : "Under Review"}
                      </div>
                      <div style={{ fontSize: '11px', color: '#78350f', lineHeight: 1.5 }}>
                        {status === "Approved" 
                          ? "This task has been approved. New versions cannot be uploaded."
                          : "This task is currently under review by the Program Chair/Admin. New versions cannot be uploaded until a revision is requested."}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="collab-muted">
                    Any collaborator can replace the current output. PATH will create the next version and reset every confirmation.
                  </p>

                  <input
                    ref={finalInputRef}
                    type="file"
                    multiple
                    hidden
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files || []);
                      setFinalFiles(prev => {
                        const combined = [...prev, ...newFiles];
                        // Limit to 5 files
                        return combined.slice(0, 5);
                      });
                      // Reset input so the same file can be selected again if needed
                      e.target.value = '';
                    }}
                  />
                  <button
                    className={`collab-upload ${finalFiles.length > 0 ? "selected" : ""}`}
                    onClick={() => finalInputRef.current?.click()}
                    disabled={finalFiles.length >= 5}
                    style={finalFiles.length >= 5 ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  >
                <span>
                  <UploadCloud size={16} />
                </span>
                <div>
                  <strong>
                    {finalFiles.length >= 5
                      ? "Maximum 5 files reached"
                      : finalFiles.length > 0
                      ? `${finalFiles.length} file${finalFiles.length > 1 ? 's' : ''} selected`
                      : "Attach a new final output"}
                  </strong>
                  <small>
                    {finalFiles.length >= 5
                      ? "Remove a file to add more"
                      : finalFiles.length > 0
                      ? "Click to add more files (up to 5 total)"
                      : "PDF, DOCX, XLSX, or CSV (up to 5 files)"}
                  </small>
                </div>
                {finalFiles.length > 0 ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#7c3aed',
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 700,
                    lineHeight: 1
                  }}>+</span>
                ) : (
                  <Paperclip size={14} />
                )}
              </button>

              {/* Display selected files with individual remove buttons */}
              {finalFiles.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  display: 'grid',
                  gap: '8px'
                }}>
                  {finalFiles.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      background: '#f8f5ff',
                      border: '1px solid #e2d6ef',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '16px' }}>📎</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{
                          display: 'block',
                          fontSize: '11px',
                          color: '#5a4567',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {file.name}
                        </strong>
                        <small style={{
                          display: 'block',
                          marginTop: '2px',
                          fontSize: '9px',
                          color: '#978ba1'
                        }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFinalFiles(prev => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '24px',
                          height: '24px',
                          border: 'none',
                          borderRadius: '50%',
                          background: '#fee',
                          color: '#c33',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: 0
                        }}
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="collab-label">
                Version note
                <textarea
                  value={finalNote}
                  onChange={(e) => setFinalNote(e.target.value)}
                  placeholder="Explain what changed in this version…"
                  rows={2}
                />
              </label>

              {isUploading && (
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  border: "1px solid #e2d6ef",
                  borderRadius: "9px",
                  background: "#fbf8ff"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Uploading {finalFiles.length} file{finalFiles.length > 1 ? 's' : ''}...
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#7c3aed" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <div style={{
                    height: "6px",
                    borderRadius: "99px",
                    background: "#e9e0ef",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${uploadProgress}%`,
                      height: "100%",
                      borderRadius: "inherit",
                      background: "#7c3aed",
                      transition: "width 0.2s ease"
                    }} />
                  </div>
                </div>
              )}

              <button
                className="collab-primary"
                onClick={uploadNewVersion}
                disabled={finalFiles.length === 0 || isUploading}
              >
                <UploadCloud size={14} /> Upload v{(versions.length || 0) + 1} and reset confirmations
              </button>
                </>
              )}

              {versions.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '14px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #e9e0ef'
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#44354f' }}>Version history</span>
                    <small style={{ fontSize: '10px', color: '#8d7f97', fontWeight: 600 }}>Latest first</small>
                  </div>
                  {versions.map((item) => {
                    const isExpanded = expandedVersions.has(item.version);
                    const toggleExpand = () => {
                      setExpandedVersions(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(item.version)) {
                          newSet.delete(item.version);
                        } else {
                          newSet.add(item.version);
                        }
                        return newSet;
                      });
                    };
                    
                    return (
                      <div 
                        key={`output-${item.version}`} 
                        style={{ 
                          padding: '14px 16px',
                          border: item.version === task?.current_output_version ? '2px solid #7c3aed' : '1px solid #e9e0ef',
                          borderRadius: '10px',
                          marginBottom: '10px',
                          background: '#fff',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {/* Version header - clickable */}
                        <div 
                          style={{ 
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            cursor: 'pointer'
                          }}
                          onClick={toggleExpand}
                        >
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            background: item.version === task?.current_output_version ? '#7c3aed' : '#e9e0ef',
                            color: item.version === task?.current_output_version ? '#fff' : '#44354f',
                            fontSize: '12px',
                            fontWeight: 800,
                            flexShrink: 0
                          }}>
                            v{item.version}
                          </span>
                          
                          <div style={{ 
                            flex: 1,
                            minWidth: 0
                          }}>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#44354f', marginBottom: '4px' }}>
                              {item.files && item.files.length > 1
                                ? `${item.files.length} files`
                                : item.file_name}
                            </strong>
                            <small style={{ display: 'block', fontSize: '11px', color: '#8d7f97' }}>
                              {formatDate(item.created_at)} · {item.uploaded_by}
                            </small>
                            {item.upload_note && (
                              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#978ba1', lineHeight: 1.4 }}>
                                {item.upload_note}
                              </p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                            <em style={{ 
                              fontSize: '11px', 
                              color: item.version === task?.current_output_version ? '#7c3aed' : '#8d7f97',
                              fontWeight: item.version === task?.current_output_version ? 700 : 500,
                              fontStyle: 'normal'
                            }}>
                              {item.version === task?.current_output_version ? "Current" : "Previous"}
                            </em>
                            {item.files && item.files.length > 0 && (
                              isExpanded ? <ChevronDown size={18} color="#7c3aed" /> : <ChevronRight size={18} color="#8d7f97" />
                            )}
                          </div>
                        </div>
                        
                        {/* Collapsible files section */}
                        {isExpanded && item.files && item.files.length > 0 && (
                          <div style={{ 
                            marginTop: '14px', 
                            marginLeft: '52px',
                            display: 'grid',
                            gap: '10px',
                            paddingLeft: '14px',
                            borderLeft: '3px solid #e9e0ef'
                          }}>
                            {item.files.map((file, idx) => {
                              const isPdf = /\.pdf$/i.test(file.file_name);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 14px",
                                    background: "#fbf8ff",
                                    border: "1px solid #e9e0ef",
                                    borderRadius: "8px"
                                  }}
                                >
                                  <div style={{
                                    display: 'grid',
                                    width: '36px',
                                    height: '36px',
                                    placeItems: 'center',
                                    borderRadius: '6px',
                                    background: isPdf ? '#fef5e5' : '#e8f1ff',
                                    color: isPdf ? '#9d6d2a' : '#5274a8',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    flexShrink: 0,
                                    letterSpacing: '0.02em'
                                  }}>
                                    {isPdf ? 'PDF' : 'FILE'}
                                  </div>
                                  <div style={{ 
                                    flex: 1, 
                                    minWidth: 0
                                  }}>
                                    <div style={{ 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis', 
                                      whiteSpace: 'nowrap',
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      color: '#44354f',
                                      marginBottom: '3px'
                                    }}>
                                      {file.file_name}
                                    </div>
                                    <div style={{
                                      fontSize: '10px',
                                      color: '#8d7f97'
                                    }}>
                                      {file.file_size ? `${Math.round(file.file_size / 1024)} KB` : ''}
                                    </div>
                                  </div>
                                  <a
                                    href={r2ToProxyUrl(api, file.file_url)}
                                    download={file.file_name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      padding: '7px 12px',
                                      borderRadius: '6px',
                                      background: '#7c3aed',
                                      color: '#fff',
                                      textDecoration: 'none',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      flexShrink: 0
                                    }}
                                  >
                                    <Download size={12} />
                                  </a>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreview({
                                        file_url: file.file_url,
                                        file_name: file.file_name,
                                        name: file.file_name
                                      });
                                    }}
                                    style={{
                                      padding: '7px 12px',
                                      borderRadius: '6px',
                                      background: '#fff',
                                      border: '1px solid #e9e0ef',
                                      color: '#7c3aed',
                                      fontSize: '10px',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    <FileImage size={12} /> Open
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="collab-card">
              <div className="collab-heading">
                <div>
                  <span className="collab-kicker">
                    <MessageCircle size={12} /> Discussion
                  </span>
                  <h2>Working notes & questions</h2>
                </div>
                <span className="collab-count">{messages.length} messages</span>
              </div>

              <div className="collab-messages">
                {(() => {
                  console.log("[Render] Messages count:", messages.length, "Messages:", messages);
                  return null;
                })()}
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message.id}>
                      {/* Parent comment */}
                      <article className="collab-message">
                        <span className={`collab-avatar ${getTone(message.user_id || message.sender_id || 0)}`}>
                          {initials(message.full_name)}
                        </span>
                        <div className="collab-message-content">
                          <header>
                            <strong>{message.full_name}</strong>
                            <small>{formatDate(message.created_at)}</small>
                          </header>
                          <p style={{ margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{message.content}</p>
                          {message.files && message.files.length > 0 && (
                            <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
                              {message.files.map((file, idx) => {
                                const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                                const imageKey = `msg-${message.id}-file-${idx}`;
                                const imageLoading = imageLoadingStates[imageKey] ?? true;
                                return isImage ? (
                                  <div 
                                    key={idx}
                                    style={{ 
                                      position: "relative",
                                      display: "inline-block",
                                      maxWidth: "280px"
                                    }}
                                  >
                                    {imageLoading && (
                                      <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "#f5f0fb",
                                        borderRadius: "6px",
                                        border: "1px solid #e2d9e9",
                                        zIndex: 1
                                      }}>
                                        <div style={{
                                          width: "24px",
                                          height: "24px",
                                          border: "2px solid #e2d9e9",
                                          borderTopColor: "#7c3aed",
                                          borderRadius: "50%",
                                          animation: "spin 0.8s linear infinite"
                                        }} />
                                      </div>
                                    )}
                                    <a 
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ display: "block", maxWidth: "280px" }}
                                    >
                                      <img 
                                        src={file.url}
                                        alt={file.name}
                                        onLoad={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        onError={() => setImageLoadingStates(prev => ({ ...prev, [imageKey]: false }))}
                                        style={{ 
                                          maxWidth: "100%", 
                                          borderRadius: "6px", 
                                          border: "1px solid #e2d9e9", 
                                          cursor: "pointer",
                                          display: imageLoading ? "none" : "block"
                                        }}
                                      />
                                    </a>
                                  </div>
                                ) : (
                                  <div key={idx} style={{ padding: "6px", background: "#f5f0fb", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px" }}>📎</span>
                                    <a 
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ flex: 1, minWidth: 0, color: "#7043b6", fontSize: "9px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "underline" }}
                                    >
                                      {file.name}
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="collab-thread">
                            <button type="button" onClick={() => setReplyTo(replyTo === message.id ? null : message.id)}>
                              <Reply size={12} /> Reply
                            </button>
                          </div>
                        </div>
                      </article>

                      {/* Reply form for parent comment */}
                      {replyTo === message.id && (
                        <ReplyForm
                          reply={message}
                          replyDraft={replyDraft}
                          setReplyDraft={setReplyDraft}
                          replyFiles={replyFiles}
                          setReplyFiles={setReplyFiles}
                          replyFileProgress={replyFileProgress}
                          setReplyFileProgress={setReplyFileProgress}
                          replyUploadedFiles={replyUploadedFiles}
                          setReplyUploadedFiles={setReplyUploadedFiles}
                          isReplyUploadingFiles={isReplyUploadingFiles}
                          setIsReplyUploadingFiles={setIsReplyUploadingFiles}
                          replyFilesRef={replyFilesRef}
                          setReplyTo={setReplyTo}
                          setError={setError}
                          api={api}
                          token={token}
                          taskId={taskId}
                        />
                      )}

                      {/* Render nested replies recursively to support unlimited threading depth */}
                      {message.replies && message.replies.length > 0 && (
                        <RenderReplies 
                          replies={message.replies} 
                          depth={1}
                          replyTo={replyTo}
                          setReplyTo={setReplyTo}
                          getTone={getTone}
                          initials={initials}
                          formatDate={formatDate}
                          imageLoadingStates={imageLoadingStates}
                          setImageLoadingStates={setImageLoadingStates}
                          replyDraft={replyDraft}
                          setReplyDraft={setReplyDraft}
                          replyFiles={replyFiles}
                          setReplyFiles={setReplyFiles}
                          replyFileProgress={replyFileProgress}
                          setReplyFileProgress={setReplyFileProgress}
                          replyUploadedFiles={replyUploadedFiles}
                          setReplyUploadedFiles={setReplyUploadedFiles}
                          isReplyUploadingFiles={isReplyUploadingFiles}
                          setIsReplyUploadingFiles={setIsReplyUploadingFiles}
                          replyFilesRef={replyFilesRef}
                          setError={setError}
                          api={api}
                          token={token}
                          taskId={taskId}
                        />
                      )}


                    </div>
                  ))
                ) : (
                  <div style={{ padding: "12px", color: "#8d7f97", fontSize: "12px" }}>
                    No messages yet. Start the discussion!
                  </div>
                )}
              </div>

              <div className="collab-composer">
                <textarea
                  value={messageDraft}
                  onChange={(e) => setMessageDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) postMessage();
                  }}
                  placeholder="Write a note, ask a question, or mention what needs checking…"
                  rows={3}
                />
                {commentFiles.length > 0 && (
                  <div style={{ marginTop: "8px", padding: "8px", background: "#fbf8ff", borderRadius: "6px", borderTop: "1px solid #e2d6ef" }}>
                    <div style={{ fontSize: "8px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
                      {commentFiles.length} file(s) attached
                    </div>
                    <div style={{ display: "grid", gap: "6px" }}>
                      {commentFiles.map((file, idx) => {
                        const isPdf = /\.pdf$/i.test(file.name);
                        const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                        const progress = commentFileProgress[idx] ?? 0;
                        const isUploading = isCommentUploadingFiles && progress < 100;
                        
                        return (
                          <div key={idx} style={{ padding: "8px", background: "#fff", borderRadius: "5px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ display: "grid", width: "32px", height: "32px", placeItems: "center", borderRadius: "6px", background: isPdf ? "#fef5e5" : isImage ? "#e8f1ff" : "#f0e7fc", color: isPdf ? "#9d6d2a" : isImage ? "#5274a8" : "#7043b7", fontSize: "14px", flexShrink: 0 }}>
                              {isPdf ? "PDF" : isImage ? "🖼" : "📎"}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: "#5d4867", fontSize: "9px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {file.name}
                              </div>
                              <div style={{ marginTop: "4px", height: "4px", background: "#e9e0ef", borderRadius: "2px", overflow: "hidden" }}>
                                <div style={{ height: "100%", background: "#7c3aed", width: `${progress}%`, transition: "width 0.2s" }} />
                              </div>
                              <div style={{ marginTop: "4px", fontSize: "8px", color: isUploading ? "#8b7b96" : "#579574", fontWeight: 800 }}>
                                {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setCommentFiles(prev => prev.filter((_, i) => i !== idx));
                                setCommentFileProgress(prev => {
                                  const newProgress = { ...prev };
                                  delete newProgress[idx];
                                  return newProgress;
                                });
                              }}
                              disabled={isCommentUploadingFiles}
                              style={{ background: "none", border: "none", color: "#806f8b", cursor: isCommentUploadingFiles ? "not-allowed" : "pointer", fontSize: "16px", opacity: isCommentUploadingFiles ? 0.5 : 1 }}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="collab-composer-footer">
                  <small>Ctrl / Cmd + Enter to send</small>
                  <span className="collab-composer-actions">
                    <input
                      ref={commentFilesRef}
                      type="file"
                      hidden
                      multiple
                      accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (commentFiles.length + files.length > 5) {
                          setError("Maximum 5 files allowed");
                          return;
                        }
                        setCommentFiles(prev => [...prev, ...files]);
                        // Start uploading immediately
                        await uploadCommentFiles(files);
                        if (commentFilesRef.current) commentFilesRef.current.value = "";
                      }}
                    />
                    <button 
                      onClick={() => commentFilesRef.current?.click()}
                      disabled={isCommentUploadingFiles || commentFiles.length >= 5}
                    >
                      <Paperclip size={13} /> Add files ({commentFiles.length}/5)
                    </button>
                    <button 
                      onClick={postMessage} 
                      disabled={(!messageDraft.trim() && commentUploadedFiles.length === 0) || isCommentUploadingFiles}
                    >
                      <Send size={14} /> Send message
                    </button>
                  </span>
                </div>
              </div>
            </section>
          </main>

          <aside className="collab-side">
            {status === "For Approval" && (
              <section className="collab-side-card" style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #fefbff 100%)', border: '1px solid #e9d5ff' }}>
                <span className="collab-kicker" style={{ color: '#7c3aed' }}>Program Chair / Admin review</span>
                <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Review unlocks after submission</h2>
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#6b7280' }}>
                  Once the latest output reaches 100% confirmation, the review gate opens automatically.
                </p>
              </section>
            )}

            <section className="collab-side-card" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <span className="collab-kicker" style={{ color: '#6b7280' }}>Version policy</span>
              <h2 style={{ fontSize: '16px', marginBottom: '14px', color: '#374151' }}>Version policy</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>New upload creates v2</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>Confirmations reset per version</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Check size={16} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#4b5563', lineHeight: '1.5' }}>Auto-submit at 4/4</span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {showRevision && (
        <div className="collab-modal-backdrop">
          <div className="collab-modal">
            <button
              className="collab-modal-close"
              onClick={() => setShowRevision(false)}
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <span className="collab-kicker">Revision request</span>
            <h2>What should the group revisit?</h2>
            <p>Give collaborators a clear reason. The task will return to In Progress and reset the confirmation gate.</p>
            
            <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#5d4867", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Reason <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <textarea
              value={revisionReason}
              onChange={(e) => setRevisionReason(e.target.value)}
              placeholder="e.g. Missing information or supporting document"
              rows={3}
              style={{ marginBottom: "16px" }}
            />
            
            <label style={{ display: "block", marginBottom: "8px", fontSize: "11px", fontWeight: 700, color: "#5d4867", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Instructions for Faculty
            </label>
            <textarea
              value={revisionInstructions}
              onChange={(e) => setRevisionInstructions(e.target.value)}
              placeholder="Explain what needs to be corrected before the next submission…"
              rows={4}
            />
            
            {revisionFiles.length > 0 && (
              <div style={{ marginTop: "12px", padding: "12px", background: "#fbf8ff", borderRadius: "6px", border: "1px solid #e2d6ef" }}>
                <div style={{ fontSize: "9px", fontWeight: 800, color: "#806f8b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
                  {revisionFiles.length} file(s) attached
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {revisionFiles.map((file, idx) => {
                    const isPdf = /\.pdf$/i.test(file.name);
                    const isImage = /\.(png|jpe?g|gif|webp)$/i.test(file.name);
                    const progress = revisionFileProgress[idx] ?? 0;
                    const isUploading = isRevisionUploadingFiles && progress < 100;
                    
                    return (
                      <div key={idx} style={{ padding: "10px", background: "#fff", borderRadius: "6px", border: "1px solid #e2d9e9", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "grid", width: "36px", height: "36px", placeItems: "center", borderRadius: "6px", background: isPdf ? "#fef5e5" : isImage ? "#e8f1ff" : "#f0e7fc", color: isPdf ? "#9d6d2a" : isImage ? "#5274a8" : "#7043b7", fontSize: "16px", flexShrink: 0 }}>
                          {isPdf ? "PDF" : isImage ? "🖼" : "📎"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: "#5d4867", fontSize: "10px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </div>
                          <div style={{ marginTop: "6px", height: "5px", background: "#e9e0ef", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", background: "#7c3aed", width: `${progress}%`, transition: "width 0.2s" }} />
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "9px", color: isUploading ? "#8b7b96" : "#579574", fontWeight: 800 }}>
                            {isUploading ? `Uploading - ${progress}%` : "✓ Ready"}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setRevisionFiles(prev => prev.filter((_, i) => i !== idx));
                            setRevisionFileProgress(prev => {
                              const newProgress = { ...prev };
                              delete newProgress[idx];
                              return newProgress;
                            });
                          }}
                          disabled={isRevisionUploadingFiles}
                          style={{ background: "none", border: "none", color: "#806f8b", cursor: isRevisionUploadingFiles ? "not-allowed" : "pointer", fontSize: "18px", opacity: isRevisionUploadingFiles ? 0.5 : 1 }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <input
              ref={revisionFilesRef}
              type="file"
              hidden
              multiple
              accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (revisionFiles.length + files.length > 5) {
                  setError("Maximum 5 files allowed for revision request");
                  return;
                }
                setRevisionFiles(prev => [...prev, ...files]);
                await uploadRevisionFiles(files);
                if (revisionFilesRef.current) revisionFilesRef.current.value = "";
              }}
            />
            
            <div className="collab-modal-actions">
              <button 
                onClick={() => revisionFilesRef.current?.click()}
                disabled={isRevisionUploadingFiles || revisionFiles.length >= 5}
                style={{ marginRight: "auto" }}
              >
                <Paperclip size={14} /> {revisionFiles.length > 0 ? `Add more (${revisionFiles.length}/5)` : "Attach files"}
              </button>
              <button onClick={() => {
                setShowRevision(false);
                setRevisionReason("");
                setRevisionInstructions("");
                setRevisionFiles([]);
                setRevisionUploadedFiles([]);
                setRevisionFileProgress({});
              }}>Cancel</button>
              <button 
                onClick={requestRevision} 
                disabled={!revisionReason.trim() || isRevisionUploadingFiles}
              >
                Send request
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div
          className="td-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <section
            className="td-reader"
            role="dialog"
            aria-modal="true"
            aria-labelledby="td-preview-title"
          >
            <header className="td-reader-head">
              <div>
                <span className="td-reader-eyebrow">
                  <i /> Inline preview
                </span>
                <h2 id="td-preview-title">{preview.file_name || preview.name}</h2>
                <p>{preview.file_name || preview.name}</p>
              </div>
              <div className="td-reader-head-actions">
                <span>▢ PDF</span>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  aria-label="Close inline document preview"
                >
                  ✕
                </button>
              </div>
            </header>
            <div className="td-reader-stage">
              <div className="td-reader-frame">
                <div className="td-reader-toolbar">
                  <button type="button" aria-label="Reader menu">
                    ☰
                  </button>
                  <b>1</b>
                  <span>/ 1</span>
                  <button
                    type="button"
                    onClick={() =>
                      setReaderZoom((value) =>
                        typeof value === "number"
                          ? Math.max(60, value - 10)
                          : 90,
                      )
                    }
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReaderZoom((value) =>
                        typeof value === "number"
                          ? Math.min(150, value + 10)
                          : 110,
                      )
                    }
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <span>
                    {typeof readerZoom === "number"
                      ? `${readerZoom}%`
                      : "Fit width"}
                  </span>
                  <span className="td-reader-toolbar-spacer" />
                  <button
                    type="button"
                    disabled={!preview.file_url && !preview.url}
                    onClick={() =>
                      window.open(
                        r2ToProxyUrl(api, preview.file_url || preview.url),
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    aria-label="Open file in a new tab"
                  >
                    ↗
                  </button>
                </div>
                <div className="td-reader-paper">
                  {(preview.file_url || preview.url) && /\.pdf($|\?)/i.test(preview.file_url || preview.url) ? (
                    <iframe
                      title={preview.file_name || preview.name}
                      src={pdfReadingUrl(r2ToProxyUrl(api, preview.file_url || preview.url), readerZoom)}
                    />
                  ) : (preview.file_url || preview.url) &&
                    /\.(png|jpe?g|gif|webp)($|\?)/i.test(preview.file_url || preview.url) ? (
                    <img src={r2ToProxyUrl(api, preview.file_url || preview.url)} alt={preview.file_name || preview.name} />
                  ) : (
                    <div className="td-reader-fallback">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
                        <path d="M6 3h8l4 4v14H6z" />
                        <path d="M14 3v5h5M9 13h6M9 17h6" />
                      </svg>
                      <strong>Preview available in a new tab</strong>
                      <span>
                        This document type does not support an embedded reader.
                        Use the open control to view the uploaded file.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      </div>
    </div>
  );
}

