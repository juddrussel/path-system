import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket, connectSocket } from "./socket";

// Decodes the current user's id straight from the JWT — used to filter out
// a user's own messages from the incoming-message popup (send_message is
// echoed back to the sender too, see server.js's socket.emit to the sender).
function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id ?? payload?.userId ?? payload?.user_id ?? payload?.sub ?? null;
  } catch {
    return null;
  }
}

// Strips the invisible [[REPLY]]...[[/REPLY]] marker Inbox.jsx embeds in
// reply messages (see buildReplyContent/parseReplyContent there), so the
// popup preview shows the actual message text, not the raw marker.
const REPLY_MARKER_RE = /^\[\[REPLY\]\].*?\[\[\/REPLY\]\]\n?([\s\S]*)$/;
function previewText(content) {
  if (!content) return "";
  const m = content.match(REPLY_MARKER_RE);
  return m ? m[1] : content;
}

const API_BASE  = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api";
const SERVER_URL = import.meta.env.VITE_API_URL  || "http://localhost:5000";

function fullAvatarUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SERVER_URL}${url}`;
}

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const BellIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: "18px", height: "18px", display: "block", flexShrink: 0 }}>
    <path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 15.5a2 2 0 004 0" strokeLinecap="round" />
  </svg>
);

// Solid/filled variant with a notification dot — used on the incoming
// notification toast, matching the "New Task Assigned" popup style.
const BellFilledIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M12 2.2a1 1 0 011 1v.7c3.1.55 5.4 3.3 5.4 6.5v3.4l1.6 2.5a1 1 0 01-.85 1.5H5.85a1 1 0 01-.85-1.5l1.6-2.5V10.4c0-3.2 2.3-5.95 5.4-6.5v-.7a1 1 0 011-1z" />
    <path d="M9.3 19.2a2.7 2.7 0 005.4 0z" />
    <circle cx="17.6" cy="5.6" r="2.1" />
  </svg>
);

const CameraIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" width="16" height="16">
    <rect x="2" y="5" width="16" height="12" rx="2" />
    <circle cx="10" cy="11" r="3" />
    <path d="M7 5l1-2h4l1 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <path d="M11 2l3 3-8 8H3v-3L11 2z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l4-4-4-4M14 7H6" stroke="currentColor" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CheckIcon2 = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M13 4l-7 8-3-3" strokeLinecap="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <circle cx="10" cy="10" r="7.25" />
    <path d="M6.7 10.2l2.1 2.1 4.3-4.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M6 2.5h5.5L15 6v11a.75.75 0 01-.75.75H6a.75.75 0 01-.75-.75V3.25A.75.75 0 016 2.5z" strokeLinejoin="round" />
    <path d="M11 2.5V6h4" strokeLinejoin="round" />
  </svg>
);

const ClockIconSm = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <circle cx="10" cy="10" r="7.25" />
    <path d="M10 6v4.3l2.8 1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" width="10" height="10">
    <path d="M4 2.5l4 3.5-4 3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M3 4.5h14a1 1 0 011 1v8a1 1 0 01-1 1H8l-4 3v-3H3a1 1 0 01-1-1v-8a1 1 0 011-1z" strokeLinejoin="round" />
  </svg>
);

const PaperclipIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <path d="M13.5 6.5l-6 6a2.5 2.5 0 003.5 3.5l6-6a4.5 4.5 0 00-6.5-6.5l-6 6a6.5 6.5 0 009 9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="15" height="15">
    <rect x="3" y="4.5" width="14" height="12" rx="1.5" />
    <path d="M3 8h14M7 2.5v3M13 2.5v3" strokeLinecap="round" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
    <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
    <circle cx="7" cy="7" r="5" />
    <path d="M14 14l-3.2-3.2M5 7h4" strokeLinecap="round" />
  </svg>
);

const ZoomInIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
    <circle cx="7" cy="7" r="5" />
    <path d="M14 14l-3.2-3.2M7 5v4M5 7h4" strokeLinecap="round" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <circle cx="8" cy="8" r="6" strokeOpacity=".25" />
    <path d="M14 8a6 6 0 00-6-6" strokeLinecap="round" />
  </svg>
);

// ─── TOAST (success/error popup) ──────────────────────────────────────────────
const TOAST_DURATION = 2800;

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(t);
  }, [onClose]);

  const isSuccess = type === "success";
  const accent = isSuccess ? "#059669" : "#dc2626";
  const soft   = isSuccess ? "#d1fae5" : "#fee2e2";

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center pointer-events-none"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* dim backdrop — brief, and doesn't block clicks to what's underneath */}
      <div className="absolute inset-0 bg-black/10 animate-[toast-fade_0.25s_ease-out]" />

      <div
        className="relative pointer-events-auto flex flex-col items-center text-center bg-white rounded-2xl shadow-2xl px-8 pt-7 pb-5 overflow-hidden animate-[toast-pop_0.32s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{ width: 300 }}
      >
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <XIcon />
        </button>

        <span
          className="w-14 h-14 rounded-full flex items-center justify-center mb-3 animate-[toast-icon_0.4s_ease-out_0.05s_both]"
          style={{ background: soft, color: accent }}
        >
          <span className="scale-[1.8]">
            {isSuccess ? <CheckIcon2 /> : <XIcon />}
          </span>
        </span>

        <p className="text-sm font-bold text-gray-900 leading-snug px-2">{message}</p>

        {/* auto-dismiss progress bar */}
        <div className="w-full h-1 bg-gray-100 rounded-full mt-5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              background: accent,
              animation: `toast-progress ${TOAST_DURATION}ms linear forwards`,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes toast-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes toast-pop {
          from { opacity: 0; transform: scale(0.85) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes toast-icon {
          from { transform: scale(0); }
          to   { transform: scale(1); }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

const ROLE_LABELS = {
  admin:         "Admin",
  program_chair: "Program Chair",
  user:          "Faculty",
  guest:         "Guest",
};
function formatRole(role) {
  return ROLE_LABELS[role] || (role ? role.charAt(0).toUpperCase() + role.slice(1) : "User");
}
// Distinct accent per role so the badge (and avatar ring) carry real
// meaning at a glance instead of every role looking the same violet.
const ROLE_COLORS = {
  admin:         { fg: "#4c3f78", bg: "#edebf6", ring: "#4c3f78", dot: "#6f5fa3" },
  program_chair: { fg: "#1e4d8f", bg: "#e8f0fb", ring: "#1e4d8f", dot: "#3a6ea8" },
  user:          { fg: "#0f5c52", bg: "#e3f5f1", ring: "#0f5c52", dot: "#10a37f" },
  guest:         { fg: "#6b6f76", bg: "#eeece6", ring: "#8d8f83", dot: "#9a9690" },
};
function roleColors(role) {
  return ROLE_COLORS[role] || ROLE_COLORS.guest;
}
const AVATAR_COLORS = [
  ["#ccfbf1", "#115e59"], ["#dbeafe", "#1d4ed8"], ["#d1fae5", "#065f46"],
  ["#fef3c7", "#92400e"], ["#fce7f3", "#9d174d"], ["#e0f2fe", "#0369a1"],
];
function avatarBg(name = "") {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function initials(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// ─── IMAGE CROP MODAL ─────────────────────────────────────────────────────────
// Lets the user pan/zoom the image they just selected inside a circular frame,
// then bakes the visible region out to a square PNG blob for upload.
const CROP_SIZE = 260;       // px size of the visible circular crop viewport
const OUTPUT_SIZE = 480;     // px size of the exported square image
const MAX_ZOOM = 4;

function ImageCropModal({ src, onCancel, onConfirm }) {
  const [naturalSize, setNaturalSize] = useState(null); // { w, h }
  const [baseScale, setBaseScale]     = useState(1);     // scale that makes image just cover the viewport
  const [zoom, setZoom]               = useState(1);     // multiplier on top of baseScale, 1..MAX_ZOOM
  const [offset, setOffset]           = useState({ x: 0, y: 0 }); // pan, in viewport px
  const [exporting, setExporting]     = useState(false);

  const imgRef       = useRef(null);
  const draggingRef   = useRef(false);
  const lastPointRef  = useRef({ x: 0, y: 0 });

  // ── Once the image loads, figure out the scale that lets it fully cover the circle ──
  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth, h = img.naturalHeight;
    const cover = Math.max(CROP_SIZE / w, CROP_SIZE / h);
    setNaturalSize({ w, h });
    setBaseScale(cover);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const scale = baseScale * zoom;
  const dispW = naturalSize ? naturalSize.w * scale : 0;
  const dispH = naturalSize ? naturalSize.h * scale : 0;

  // ── Keep the image covering the viewport no matter how the user drags/zooms ──
  const clampOffset = useCallback((o, w = dispW, h = dispH) => {
    const maxX = Math.max(0, (w - CROP_SIZE) / 2);
    const maxY = Math.max(0, (h - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, o.x)),
      y: Math.min(maxY, Math.max(-maxY, o.y)),
    };
  }, [dispW, dispH]);

  // Re-clamp whenever zoom changes (the safe pan range shrinks/grows with it)
  useEffect(() => {
    setOffset(o => clampOffset(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, naturalSize]);

  // ── Dragging to reposition ──
  const handlePointerDown = (e) => {
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPointRef.current.x;
    const dy = e.clientY - lastPointRef.current.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }));
  };
  const handlePointerUp = () => { draggingRef.current = false; };

  // Let the scroll wheel zoom too, since people expect that
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(MAX_ZOOM, Math.max(1, +(z + delta).toFixed(2))));
  };

  // ── Bake the current pan/zoom into a square output image ──
  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !naturalSize) return;
    setExporting(true);

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");

    // Map the visible CROP_SIZE x CROP_SIZE viewport back to source-image pixels
    const sWidth  = CROP_SIZE / scale;
    const sHeight = CROP_SIZE / scale;
    const sx = (dispW / 2 - CROP_SIZE / 2 - offset.x) / scale;
    const sy = (dispH / 2 - CROP_SIZE / 2 - offset.y) / scale;

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    canvas.toBlob((blob) => {
      setExporting(false);
      if (blob) onConfirm(blob);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[300]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-4 pb-1">
          <h3 className="text-sm font-bold text-gray-900">Adjust your photo</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Drag to move, use the slider (or scroll) to zoom</p>
        </div>

        {/* ── Crop viewport ── */}
        <div className="flex items-center justify-center py-5">
          <div
            className="relative overflow-hidden rounded-full border-2 border-teal-200 shadow-inner bg-gray-100 select-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE, cursor: draggingRef.current ? "grabbing" : "grab", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            <img
              ref={imgRef}
              src={src}
              alt="Crop preview"
              onLoad={handleImgLoad}
              draggable={false}
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{
                width: naturalSize ? naturalSize.w * scale : "auto",
                height: naturalSize ? naturalSize.h * scale : "auto",
                maxWidth: "none",
                maxHeight: "none",
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              }}
            />
            {/* subtle ring to reinforce the circular crop edge */}
            <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
          </div>
        </div>

        {/* ── Zoom slider ── */}
        <div className="px-6 pb-1 flex items-center gap-2.5">
          <span className="text-gray-400"><ZoomOutIcon /></span>
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-teal-600"
          />
          <span className="text-gray-400"><ZoomInIcon /></span>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!naturalSize || exporting}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
          >
            {exporting ? <><Spinner /> Applying…</> : <><CheckIcon2 /> Use Photo</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE MODAL ───────────────────────────────────────────────────────────
function ProfileModal({ profile, onClose, onSaved, onToast }) {
  const [editing, setEditing]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess]     = useState(false);
  const [error, setError]                   = useState("");
  const [photoError, setPhotoError]         = useState("");

  const [form, setForm] = useState({
    full_name:  profile?.full_name  || "",
    email:      profile?.email      || "",
    phone:      profile?.phone      || "",
    department: profile?.department || "",
  });

  const [currentAvatar, setCurrentAvatar]     = useState(profile?.avatar_url || null);
  const [currentAvatarKey, setCurrentAvatarKey] = useState(profile?.avatar_key || null);
  const [pendingPreview, setPendingPreview] = useState(null); // object URL of the cropped result, ready to upload
  const [pendingFile, setPendingFile]       = useState(null); // cropped Blob/File, ready to upload
  const [cropSrc, setCropSrc]               = useState(null); // object URL of the raw selected file, shown in the cropper
  const fileInputRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Photo selection: open the cropper instead of previewing immediately ────
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)    { setPhotoError("Image must be under 5 MB."); return; }
    setPhotoError("");
    setPhotoSuccess(false);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  // ── Cropper confirmed: bake the crop into the pending file/preview ─────────
  const handleCropConfirm = (blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
    setPendingFile(croppedFile);
    setPendingPreview(URL.createObjectURL(blob));
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  // ── Upload photo ───────────────────────────────────────────────────────────
  // Uploads straight to R2 through the same /api/upload endpoint TaskAssignment
  // uses for attachments, then saves the returned url/key onto the user record.
  const handleUploadPhoto = async () => {
    if (!pendingFile) return;
    setUploadingPhoto(true);
    setPhotoError("");
    try {
      const token  = localStorage.getItem("token");
      const userId = profile?.id;

      // 1. Upload the image to R2
      const fd = new FormData();
      fd.append("file", pendingFile);

      const uploadRes  = await fetch(`${API_BASE}/upload`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    fd,
      });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok || !uploadData?.success) {
        throw new Error(uploadData?.message || "Upload failed.");
      }

      // 2. Persist the new avatar url/key on the user record
      const patchRes = await fetch(`${API_BASE}/users/${userId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar_url: uploadData.url, avatar_key: uploadData.key }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.message || "Could not save your new photo.");
      }

      // 3. Clean up the old R2 object so we don't leave orphaned files behind
      const staleKey = currentAvatarKey;
      if (staleKey) {
        fetch(`${API_BASE}/upload/${encodeURIComponent(staleKey)}`, {
          method:  "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {}); // non-fatal — a stray object in R2 isn't worth blocking the UI over
      }

      setCurrentAvatar(uploadData.url);
      setCurrentAvatarKey(uploadData.key);
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
      setPendingPreview(null);
      setPendingFile(null);
      setPhotoSuccess(true);
      onSaved({ ...profile, avatar_url: fullAvatarUrl(uploadData.url), avatar_key: uploadData.key });
      setTimeout(() => setPhotoSuccess(false), 3000);
      onToast?.("Photo updated successfully!", "success");
    } catch (err) {
      const msg = err.message || "Upload failed. Please try again.";
      setPhotoError(msg);
      onToast?.(msg, "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelPhoto = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingPreview(null);
    setPendingFile(null);
    setPhotoError("");
  };

  // ── Save profile details ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token  = localStorage.getItem("token");
      const userId = profile?.id;

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, avatar_url: currentAvatar, avatar_key: currentAvatarKey }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Update failed" }));
        throw new Error(err.message);
      }
      const updated = await res.json();
      onSaved({ ...updated, avatar_url: currentAvatar });
      setEditing(false);
      onToast?.("Profile changes saved successfully!", "success");
    } catch (err) {
      const msg = err.message || "Failed to save changes.";
      setError(msg);
      onToast?.(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const [bg, fg] = avatarBg(profile?.full_name || "");
  // pendingPreview is a local blob: URL (already absolute) — only currentAvatar (a server path) needs fullAvatarUrl
  const displayAvatar = pendingPreview || fullAvatarUrl(currentAvatar);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
      onClick={e => e.target === e.currentTarget && !pendingPreview && onClose()}
    >
      <div className="w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Hero / Avatar ── */}
        <div
          className="relative flex flex-col items-center pt-8 pb-5 px-6"
          style={{ background: `linear-gradient(160deg, ${bg}cc 0%, #f9f9ff 70%)` }}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-white/60 transition-colors"
          >
            <XIcon />
          </button>

          <div className="relative mb-3 group">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover shadow-lg border-[3px] border-white"
                style={{ outline: pendingPreview ? "3px solid #0f766e" : "none", outlineOffset: 2 }}
              />
            ) : (
              <span
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border-[3px] border-white"
                style={{ background: bg, color: fg }}
              >
                {initials(profile?.full_name)}
              </span>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <CameraIcon />
              <span className="text-white text-[10px] font-bold">Change</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md hover:bg-teal-700 transition-colors border-2 border-white"
            >
              <CameraIcon />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/gif, image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <h2 className="text-base font-bold text-gray-900">
            {profile?.full_name}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">@{profile?.username}</p>
          <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-700 capitalize">
            {formatRole(profile?.role)}
          </span>

          {pendingPreview && (
            <div className="mt-3 w-full bg-white/90 backdrop-blur rounded-xl px-4 py-2.5 flex items-center gap-2 shadow border border-teal-200">
              <span className="text-[11px] text-teal-700 font-bold flex-1">New photo selected — upload it?</span>
              <button onClick={handleCancelPhoto} className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleUploadPhoto}
                disabled={uploadingPhoto}
                className="px-3 py-1 rounded-lg text-[11px] font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 flex items-center gap-1.5 transition-colors"
              >
                {uploadingPhoto ? <><Spinner /> Uploading…</> : <><CheckIcon2 /> Upload</>}
              </button>
            </div>
          )}

          {photoError && <p className="mt-2 text-[11px] text-red-600 font-medium">{photoError}</p>}
          {photoSuccess && !pendingPreview && (
            <p className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
              <CheckIcon2 /> Photo updated successfully!
            </p>
          )}
          <p className="mt-2 text-[10px] text-gray-400">
            Click the camera icon to upload or replace your photo · JPG, PNG, GIF, WebP · max 5 MB
          </p>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">{error}</div>
          )}

          {editing ? (
            <div className="flex flex-col gap-3">
              <PField label="Full Name">
                <input value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Full name" />
              </PField>
              <PField label="Email">
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@company.com" />
              </PField>
              <PField label="Phone">
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+63 912 345 6789" />
              </PField>
              <PField label="Department">
                <input value={form.department} onChange={e => set("department", e.target.value)} placeholder="e.g. Finance" />
              </PField>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {[
                { label: "Email",      value: profile?.email      || "—" },
                { label: "Phone",      value: profile?.phone      || "—" },
                { label: "Department", value: profile?.department || "—" },
                { label: "Username",   value: `@${profile?.username || "—"}` },
                { label: "User ID",    value: `#${profile?.id || "—"}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
                  <span className="text-xs text-gray-800 font-medium text-right break-all">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 flex gap-2 border-t border-gray-50 pt-3">
          {editing ? (
            <>
              <button
                onClick={() => { setEditing(false); setError(""); }}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
              >
                {saving ? <><Spinner /> Saving…</> : <><CheckIcon2 /> Save Changes</>}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
            >
              <EditIcon /> Edit Profile
            </button>
          )}
        </div>

      </div>

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}

function PField({ label, children }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children && (() => {
        const child = children;
        return (
          <child.type
            {...child.props}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-900 bg-white outline-none focus:border-teal-500 transition-colors"
          />
        );
      })()}
    </div>
  );
}

// ─── INCOMING NOTIFICATION TOAST ──────────────────────────────────────────────
// Pops up top-right the instant a live "notification" socket event arrives
// (see the useEffect in TopBar below). Separate from the persistent bell
// panel — this is just the transient "heads up, something happened" popup.
const TOAST_AUTO_DISMISS_MS = 7000;

function NotificationToast({ n, onDismiss, onClick }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const style = NOTIF_TYPE_STYLE[n.type] || NOTIF_TYPE_STYLE.task_assigned;

  return (
    <div
      onClick={onClick}
      className="group pointer-events-auto relative w-[380px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 px-4 py-4 flex items-start gap-3.5 cursor-pointer animate-[notif-toast-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: style.bg, color: style.fg }}
      >
        <BellFilledIcon />
      </span>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-extrabold text-gray-900 leading-snug">{n.title}</p>
          <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">now</span>
        </div>
        <p className="text-[13px] text-gray-500 mt-1 leading-snug">{n.text}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-md flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-50 transition-all"
      >
        <XIcon />
      </button>
      <style>{`
        @keyframes notif-toast-in {
          from { opacity: 0; transform: translateX(28px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function NotificationToastStack({ toasts, onDismiss, onSelect }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-[300] flex flex-col gap-3 pointer-events-none">
      {toasts.map(n => (
        <NotificationToast
          key={n.id}
          n={n}
          onDismiss={() => onDismiss(n.id)}
          onClick={() => { onSelect(n); onDismiss(n.id); }}
        />
      ))}
    </div>
  );
}

// ─── INCOMING MESSAGE POPUP (bottom-right) ────────────────────────────────────
// Pops up whenever a "receive_message" socket event arrives for a chat
// message that isn't yours — separate from the notification toast above,
// which stays top-right and covers tasks/forms/etc. This one is scoped to
// Inbox chat messages and shows on every page (TopBar mounts everywhere),
// not just while the Inbox page happens to be open.
const MSG_TOAST_AUTO_DISMISS_MS = 7000;

function MessageToast({ m, onDismiss, onClick }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, MSG_TOAST_AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      onClick={onClick}
      className="group pointer-events-auto relative w-[340px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl border border-teal-100 px-4 py-3.5 flex items-start gap-3 cursor-pointer animate-[msg-toast-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
      style={{ fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px -4px rgba(15,118,110,0.14), 0 2px 6px -2px rgba(0,0,0,0.06)" }}
    >
      {m.photoUrl ? (
        <img src={m.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
      ) : (
        <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-teal-100 text-teal-700">
          {initials(m.name)}
        </span>
      )}
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[13px] font-extrabold text-gray-900 leading-snug truncate">{m.name}</p>
        <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug truncate">{m.preview}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-50 transition-all"
      >
        <XIcon />
      </button>
      <style>{`
        @keyframes msg-toast-in {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function MessageToastStack({ toasts, onDismiss, onSelect }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[300] flex flex-col-reverse gap-3 pointer-events-none">
      {toasts.map(m => (
        <MessageToast
          key={m.id}
          m={m}
          onDismiss={() => onDismiss(m.id)}
          onClick={() => { onSelect(m); onDismiss(m.id); }}
        />
      ))}
    </div>
  );
}

// ─── NOTIFICATION PANEL ───────────────────────────────────────────────────────
const NOTIF_FILTERS = [
  { key: "all",    label: "All" },
  { key: "unread", label: "Unread" },
  { key: "tasks",  label: "Tasks" },
  { key: "forms",  label: "Forms" },
];

// type -> { icon, bg, fg } used for the round icon chip on the left of each row.
// Keys match the `type` column notify() writes in task.routes.js.
const NOTIF_TYPE_STYLE = {
  task_assigned:         { Icon: CheckCircleIcon, bg: "#ccfbf1", fg: "#0f766e" }, // teal
  task_status_changed:   { Icon: CheckCircleIcon, bg: "#ccfbf1", fg: "#0f766e" }, // teal
  task_submitted:        { Icon: CheckCircleIcon, bg: "#d1fae5", fg: "#065f46" }, // green
  task_comment_added:    { Icon: MessageIcon,     bg: "#dbeafe", fg: "#2563eb" }, // blue
  task_attachment_added: { Icon: DocumentIcon,    bg: "#dbeafe", fg: "#2563eb" }, // blue
  task_deadline_changed: { Icon: CalendarIcon,    bg: "#fef3c7", fg: "#92400e" }, // amber
};

// Every current notification type is task-related; "forms" stays as a filter
// pill for when form-triggered notifications get added backend-side, it'll
// just show empty until then.
function categoryForType(type) {
  return "tasks";
}

// Compact relative-time label ("2m ago", "3h ago", falls back to a date).
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

// Converts a `notifications` DB row (from GET /api/notifications, or from a
// live "notification" socket event — notify() in task.routes.js builds both
// to the same shape) into what this panel renders.
function rowToPanelNotification(row) {
  const createdAt = new Date(row.created_at);
  return {
    id: row.id,
    type: row.type,
    category: categoryForType(row.type),
    title: row.title,
    text: row.message,
    time: timeAgo(createdAt),
    createdAt,
    unread: !row.is_read,
    taskId: row.task_id,
    tracking_id: row.tracking_id,
  };
}

function NotificationPanel({ notifications, loading, onMarkAllRead, onSelect, onViewAll, onClose }) {
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter(n => n.unread).length;

  const visible = notifications.filter(n => {
    if (filter === "all") return true;
    if (filter === "unread") return n.unread;
    return n.category === filter;
  });

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[150] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              {unreadCount} Unread
            </span>
          )}
        </div>
        <button
          onClick={onMarkAllRead}
          className="text-[11px] font-semibold text-gray-400 hover:text-teal-600 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        {NOTIF_FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="px-4 py-8 flex items-center justify-center text-gray-400">
            <Spinner />
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-gray-400">No notifications</div>
        )}
        {!loading && visible.map(n => {
          const style = NOTIF_TYPE_STYLE[n.type] || NOTIF_TYPE_STYLE.task_assigned;
          const { Icon } = style;
          return (
            <div
              key={n.id}
              onClick={() => onSelect(n)}
              className={`flex gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${n.unread ? "bg-teal-50/30" : ""}`}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: style.bg, color: style.fg }}
              >
                <Icon />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-xs leading-snug ${n.unread ? "font-bold text-teal-700" : "font-bold text-gray-800"}`}>
                    {n.title}
                  </p>
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400 shrink-0 mt-0.5">
                    <span className="scale-[0.65] origin-right"><ClockIconSm /></span>
                    {n.time}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{n.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs text-teal-600 font-bold hover:text-teal-700 transition-colors"
        >
          View All Notifications
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  );
}

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────
function ProfileDropdown({ profile, onViewProfile, onLogout, onClose }) {
  const [bg, fg] = avatarBg(profile?.full_name || "");

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-[150] overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="px-4 py-3.5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${bg}88, #fff)` }}>
        <div className="flex items-center gap-2.5">
          {profile?.avatar_url ? (
            <img src={fullAvatarUrl(profile.avatar_url)} alt="" className="w-9 h-9 rounded-full object-cover border border-white shadow-sm" />
          ) : (
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-white shadow-sm" style={{ background: bg, color: fg }}>
              {initials(profile?.full_name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">{profile?.full_name}</p>
            <p className="text-[10px] text-gray-400 truncate">@{profile?.username}</p>
          </div>
        </div>
      </div>
      <div className="py-1">
        <button
          onClick={() => { onViewProfile(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <UserIcon /> View / Edit Profile
        </button>
        <div className="border-t border-gray-50 my-1" />
        <button
          onClick={() => { onLogout(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogoutIcon /> Logout
        </button>
      </div>
    </div>
  );
}

// ─── HARDENED STYLE TOKENS ────────────────────────────────────────────────────
// Explicit px + hex values instead of Tailwind classes for anything that
// defines this bar's box model, typography, or color. Tailwind utility
// classes are `rem`-based (so they shift if a host page changes the root
// <html> font-size) and are low-specificity (so a host page's own CSS can
// override them, or — in a multi-build setup — the classes may not even be
// generated if that page's Tailwind content-scan misses this file). Inline
// styles are immune to all three: they don't reference the root font-size,
// they beat any external stylesheet rule, and they never depend on Tailwind
// having compiled a particular class. Hover/transition effects are left as
// Tailwind classes since they're cosmetic, not structural.
const TB = {
  bar: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "10px 24px 10px 20px",
    borderBottom: "1px solid #e9e6de",
    background: "linear-gradient(180deg, #fbfaf7 0%, #ffffff 55%)",
    boxShadow: "0 1px 0 rgba(20, 18, 14, 0.03), 0 6px 18px -10px rgba(15, 94, 82, 0.16)",
    position: "sticky", top: 0, zIndex: 10,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "16px", lineHeight: "normal", boxSizing: "border-box",
  },
  // thin solid rule glued to the very bottom edge — a quiet ledger-line touch
  // instead of a decorative animated sweep
  topAccent: {
    position: "absolute", left: 0, right: 0, bottom: "-1px", height: "2px",
    background: "#0f766e", opacity: 0.35,
  },
  childrenSlot: { flex: "1 1 0%", minWidth: 0 },
  rightGroup: { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  divider: {
    width: "1px", height: "24px", flexShrink: 0,
    background: "linear-gradient(180deg, transparent 0%, #e2ded2 50%, transparent 100%)",
  },
  bellWrap: { position: "relative" },
  iconBtn: {
    position: "relative", width: "36px", height: "36px", borderRadius: "9999px",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#6b6f76", background: "#f6f6f2", border: "1px solid #e8e6de", padding: 0,
    cursor: "pointer", boxSizing: "border-box",
    transition: "background-color .15s ease, color .15s ease, transform .15s ease, box-shadow .15s ease",
  },
  badge: {
    position: "absolute", top: "-2px", right: "-2px", minWidth: "17px", height: "17px",
    borderRadius: "9999px", background: "linear-gradient(135deg, #f472b6 0%, #db2777 100%)",
    color: "#ffffff", boxShadow: "0 0 0 2px #ffffff, 0 1px 4px rgba(219,39,119,0.45)",
    fontSize: "9px", fontWeight: 700, display: "flex", alignItems: "center",
    justifyContent: "center", lineHeight: 1, boxSizing: "border-box", padding: "0 3px",
  },
  badgePulse: {
    position: "absolute", top: "-2px", right: "-2px", width: "17px", height: "17px",
    borderRadius: "9999px", background: "#ec4899", opacity: 0.55,
  },
  profileWrap: { position: "relative" },
  profileBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "4px 12px 4px 4px", borderRadius: "9999px",
    background: "#f6f6f2", border: "1px solid #e8e6de", cursor: "pointer", boxSizing: "border-box",
    transition: "background-color .15s ease, box-shadow .15s ease",
  },
  avatarRing: {
    position: "relative", width: "32px", height: "32px", borderRadius: "9999px", padding: "2px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxSizing: "border-box",
  },
  avatarImg: {
    width: "100%", height: "100%", borderRadius: "9999px", objectFit: "cover",
    border: "1.5px solid #ffffff", boxSizing: "border-box", display: "block",
  },
  avatarFallback: {
    width: "100%", height: "100%", borderRadius: "9999px", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "10.5px",
    fontWeight: 700, border: "1.5px solid #ffffff", boxSizing: "border-box",
  },
  statusDot: {
    position: "absolute", bottom: "-1px", right: "-1px", width: "9px", height: "9px",
    borderRadius: "9999px", background: "#10b981", border: "2px solid #ffffff",
    boxSizing: "border-box",
  },
  nameBlock: { textAlign: "left", display: "flex", flexDirection: "column", gap: "2px" },
  name: { fontSize: "12.5px", fontWeight: 700, color: "#211d33", lineHeight: 1.1, margin: 0 },
  role: {
    fontSize: "9.5px", fontWeight: 700, lineHeight: 1,
    margin: 0, borderRadius: "9999px",
    padding: "2px 7px", width: "fit-content", letterSpacing: "0.01em",
  },
  chevron: { color: "#9a978d", flexShrink: 0, transition: "transform .18s ease" },
};

// ─── MAIN TOPBAR ─────────────────────────────────────────────────────────────
export default function TopBar({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotif,    setShowNotif]    = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [profile,      setProfile]      = useState(null);
  const [toast,        setToast]        = useState(null); // { message, type }

  const [notifications,   setNotifications]   = useState([]);
  const [notifLoading,    setNotifLoading]    = useState(true);
  const [toastQueue,      setToastQueue]      = useState([]);
  const [msgToastQueue,   setMsgToastQueue]   = useState([]);

  const notifRef = useRef();
  const dropRef  = useRef();

  // Kept fresh via effect below so the socket listener (registered once)
  // always knows the current route without needing to re-subscribe.
  const pathRef = useRef(location.pathname);
  useEffect(() => { pathRef.current = location.pathname; }, [location.pathname]);

  // ── Fetch full profile from API using JWT id ──────────────────────────────
  useEffect(() => {
    try {
      const token   = localStorage.getItem("token");
      if (!token) return;
      const decoded = JSON.parse(atob(token.split(".")[1]));

      fetch(`${API_BASE}/users/${decoded.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => setProfile(data || decoded))
        .catch(() => setProfile(decoded));
    } catch {
      setProfile({});
    }
  }, []);

  // ── Notifications: load history, then stay live over the socket ──────────
  // TopBar mounts on every page, so the bell badge/panel stay accurate
  // wherever the user is, not just on the dedicated Notifications page.
  // History comes from GET /api/notifications (see notification.routes.js);
  // new ones arrive via the same generic "notification" socket event that
  // notify() in task.routes.js emits for every notification-worthy action.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/notifications`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`GET /notifications failed: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setNotifications((data.notifications || []).map(rowToPanelNotification));
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        if (!cancelled) setNotifLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    connectSocket();
    const onNotification = (row) => {
      const converted = rowToPanelNotification(row);
      setNotifications(ns => {
        if (ns.some(n => n.id === row.id)) return ns;
        return [converted, ...ns];
      });
      setToastQueue(q => [...q, converted]);
    };
    socket.on("notification", onNotification);
    return () => socket.off("notification", onNotification);
  }, []);

  // ── Inbox messages: bottom-right popup, live everywhere ──────────────────
  // TopBar is mounted on every page, so this listener (and the popup it
  // triggers) works regardless of whether Inbox.jsx is currently mounted —
  // unlike a listener living inside Inbox.jsx, which only exists while
  // you're on that page.
  useEffect(() => {
    connectSocket();
    const currentUserId = getCurrentUserId();

    const onReceiveMessage = (msg) => {
      if (!msg || msg.pin_sync || msg.is_system) return;
      if (String(msg.sender_id) === String(currentUserId)) return; // your own message, echoed back
      if (pathRef.current?.startsWith("/inbox")) return; // already visible there in real time

      const preview = previewText(msg.content) || (msg.file_url ? "📎 File" : "New message");
      setMsgToastQueue(q => [...q.slice(-3), {
        id: Date.now() + Math.random(),
        senderId: msg.sender_id,
        name: msg.sender_name || "New message",
        photoUrl: msg.sender_photo ? fullAvatarUrl(msg.sender_photo) : null,
        preview,
      }]);
    };

    socket.on("receive_message", onReceiveMessage);
    return () => socket.off("receive_message", onReceiveMessage);
  }, []);

  const dismissMsgToast = useCallback((id) => {
    setMsgToastQueue(q => q.filter(t => t.id !== id));
  }, []);

  const handleSelectMessage = useCallback((m) => {
    navigate("/inbox", { state: { openConversationId: m.senderId } });
  }, [navigate]);

  const dismissToast = useCallback((id) => {
    setToastQueue(q => q.filter(t => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, unread: false })));
    fetch(`${API_BASE}/notifications/read-all`, { method: "PATCH", headers: authHeaders() })
      .catch(err => console.error("Failed to mark all notifications as read:", err));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(ns => ns.map(n => (n.id === id ? { ...n, unread: false } : n)));
    fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH", headers: authHeaders() })
      .catch(err => console.error("Failed to mark notification as read:", err));
  }, []);

  const handleSelectNotification = useCallback((n) => {
    if (n.unread) markRead(n.id);
    setShowNotif(false);
    navigate(
      n.tracking_id ? `/tracking?tracking_id=${encodeURIComponent(n.tracking_id)}` : "/tracking",
      { state: n.taskId ? { taskId: n.taskId, tracking_id: n.tracking_id } : undefined }
    );
  }, [markRead, navigate]);

  const handleViewAll = useCallback(() => {
    setShowNotif(false);
    navigate("/notifications");
  }, [navigate]);

  // ── Close dropdowns on outside click ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (dropRef.current  && !dropRef.current.contains(e.target))  setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;
  const [bg, fg] = avatarBg(profile?.full_name || "");
  const rc = roleColors(profile?.role);

  return (
    <>
      <div style={{ ...TB.bar, position: "sticky" }}>
        <div style={TB.topAccent} />

        <div style={TB.childrenSlot}>{children}</div>

        <div style={TB.rightGroup}>

          {/* Notification Bell */}
          <div style={TB.bellWrap} ref={notifRef}>
            <button
              onClick={() => { setShowNotif(v => !v); setShowDropdown(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#eaf5f2"; e.currentTarget.style.color = "#0f5c52"; e.currentTarget.style.borderColor = "#bfe3da"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 10px -4px rgba(15,94,82,0.28)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f6f6f2"; e.currentTarget.style.color = "#6b6f76"; e.currentTarget.style.borderColor = "#e8e6de"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              style={TB.iconBtn}
              title="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <>
                  <span style={TB.badgePulse} className="tb-badge-pulse" />
                  <span style={TB.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                </>
              )}
            </button>
            {showNotif && (
              <NotificationPanel
                notifications={notifications}
                loading={notifLoading}
                onMarkAllRead={markAllRead}
                onSelect={handleSelectNotification}
                onViewAll={handleViewAll}
                onClose={() => setShowNotif(false)}
              />
            )}
          </div>

          <div style={TB.divider} />

          {/* Profile Avatar Button */}
          <div style={TB.profileWrap} ref={dropRef}>
            <button
              onClick={() => { setShowDropdown(v => !v); setShowNotif(false); }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#eaf5f2"; e.currentTarget.style.boxShadow = "0 4px 10px -4px rgba(15,94,82,0.22)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f6f6f2"; e.currentTarget.style.boxShadow = "none"; }}
              style={TB.profileBtn}
              title="Account menu"
            >
              <span style={{ ...TB.avatarRing, background: rc.ring }}>
                {profile?.avatar_url ? (
                  <img src={fullAvatarUrl(profile.avatar_url)} alt="" style={TB.avatarImg} />
                ) : (
                  <span style={{ ...TB.avatarFallback, background: bg, color: fg }}>
                    {initials(profile?.full_name)}
                  </span>
                )}
                <span style={{ ...TB.statusDot, background: rc.dot }} title="Online" />
              </span>
              <div className="hidden sm:flex" style={TB.nameBlock}>
                <p style={TB.name}>
                  {profile?.full_name || profile?.username || "User"}
                </p>
                <span style={{ ...TB.role, color: rc.fg, background: rc.bg }}>{formatRole(profile?.role)}</span>
              </div>
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="hidden sm:block" style={{ ...TB.chevron, width: "10px", height: "10px", transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>
                <path d="M2 4l4 4 4-4" strokeLinecap="round" />
              </svg>
            </button>

            {showDropdown && (
              <ProfileDropdown
                profile={profile}
                onViewProfile={() => setShowProfile(true)}
                onLogout={onLogout}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tb-pulse {
          0%   { transform: scale(1);   opacity: 0.55; }
          70%  { transform: scale(1.9); opacity: 0; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .tb-badge-pulse { animation: tb-pulse 2.2s ease-out infinite; }
      `}</style>

      {showProfile && (
        <ProfileModal
          profile={profile}
          onClose={() => setShowProfile(false)}
          onSaved={(updated) => {
            setProfile(updated);
            // Keep the modal open on save so the user sees the toast confirmation;
            // they close it manually via the X button.
          }}
          onToast={(message, type) => setToast({ message, type, id: Date.now() })}
        />
      )}

      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <NotificationToastStack
        toasts={toastQueue}
        onDismiss={dismissToast}
        onSelect={handleSelectNotification}
      />

      <MessageToastStack
        toasts={msgToastQueue}
        onDismiss={dismissMsgToast}
        onSelect={handleSelectMessage}
      />
    </>
  );
}