// socket.js
//
// Single shared socket.io-client connection for the whole app.
//
// The backend (routes/task.routes.js -> setupTypingEvents, plus the
// io.to(`user_${facultyId}`).emit(...) calls in POST /api/tasks etc.) expects
// every connected client to send a "register" event with the user's id so
// the server can socket.join(`user_${userId}`) them into their personal room.
// Without that registration step, room-targeted emits (task_assigned,
// task:status_changed, task:comment_added, ...) never reach the client.
//
// Import { socket, connectSocket } anywhere you need real-time updates.
// Call connectSocket() once you know a token exists (e.g. on app mount, or
// right after login) — it's safe to call multiple times.

import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "";

// The REST API is mounted under /api (see task.routes.js), but Socket.IO
// attaches directly to the same HTTP server at the root, so strip a
// trailing "/api" if present before using it as the socket URL.
const SOCKET_URL = API.replace(/\/api\/?$/, "");

function decodeUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Support whichever claim name the backend actually signs the JWT with.
    return payload?.id ?? payload?.userId ?? payload?.user_id ?? payload?.sub ?? null;
  } catch {
    return null;
  }
}

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
});

function registerCurrentUser() {
  const userId = decodeUserId();
  if (userId != null) socket.emit("register", userId);
}

// Re-register on every (re)connect — covers page load, token refresh,
// and network drops/reconnects, so the client never silently falls out
// of its room after a hiccup.
socket.on("connect", registerCurrentUser);

// Opens the connection if a token is present and we're not already
// connected. No-op otherwise (e.g. logged-out state).
export function connectSocket() {
  if (!localStorage.getItem("token")) return;
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}