const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// ── DEBUG: confirm .env is loaded ──
console.log("ENV CHECK:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
});

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");

const { router: auditRoutes } = require("./routes/audit.routes");
const { router: taskRoutes, setupTypingEvents } = require("./routes/task.routes");
const formRoutes = require("./routes/form.routes");
const categoryRoutes = require("./routes/category.routes");
const workflowRoutes = require("./routes/workflow.routes");
const facultyRoutes = require("./routes/facultyRoutes");
const startScoreCron = require("./jobs/scoreCron");
const { recalculateAllScores } = require("./services/facultyScoreService");
const db = require("./config/db");
const jwt = require("jsonwebtoken");


// ── Inline requireAuth (used only for avatar upload route here) ──
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized." });
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

const app = express();
const server = http.createServer(app);

// ── CORS origin (env-driven, falls back to local dev URL) ──
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── Socket.IO setup ──
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// ── Make sure uploads folders exist ──
fs.mkdirSync("./uploads/avatars", { recursive: true });
fs.mkdirSync("./uploads/chat", { recursive: true });
fs.mkdirSync("./uploads/tasks", { recursive: true });
fs.mkdirSync("./uploads/forms", { recursive: true });
fs.mkdirSync("./uploads/workflows", { recursive: true });

// ── Multer config (avatars) ──
const storage = multer.diskStorage({
  destination: "./uploads/avatars/",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.params.id}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Images only (JPG, PNG, GIF, WebP)"));
  },
});

// ── Middleware ──
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static("./uploads"));

// ── DEBUG: log every incoming request ──
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`, req.body);
  next();
});

// ── Avatar upload route ──
app.post("/api/users/:id/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    const avatar_url = `/uploads/avatars/${req.file.filename}`;
    await db.query("UPDATE users SET avatar_url = ? WHERE id = ?", [avatar_url, req.params.id]);
    res.json({ avatar_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Make io accessible to route files via app ──
app.set("io", io);

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/faculty", facultyRoutes(db));

// ── Catch unmatched routes ──
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// ════════════════════════════════════════════════════════════════════════════
// SOCKET.IO — Real-time chat
// ════════════════════════════════════════════════════════════════════════════

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", (userId) => {
    socket.userId = String(userId);   // ← required by setupTypingEvents
    onlineUsers.set(String(userId), socket.id);
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered, joined user_${userId}`);
    io.emit("online_users", Array.from(onlineUsers.keys()));
  });

  // ── Program chair joins their notification room ──────────────────────────
  socket.on("join_role_room", ({ role }) => {
    if (["program_chair", "admin"].includes(role)) {
      socket.join("program_chairs");
      console.log(`Socket ${socket.id} joined program_chairs room`);
    }
  });

  // ── Direct message ──────────────────────────────────────────────────────
  socket.on("send_message", (data) => {
    const receiverSocketId = onlineUsers.get(String(data.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", data.message);
    }
    socket.emit("receive_message", data.message);
  });

  // ── Document comment ────────────────────────────────────────────────────
  socket.on("send_document_comment", (data) => {
    io.to(`doc_${data.docId}`).emit("receive_document_comment", data.comment);
  });

  socket.on("join_document", (docId) => {
    socket.join(`doc_${docId}`);
    console.log(`Socket ${socket.id} joined doc_${docId}`);
  });

  socket.on("leave_document", (docId) => {
    socket.leave(`doc_${docId}`);
  });

  // ── Workflow real-time collaboration ────────────────────────────────────
  socket.on("join_workflow", (workflowId) => {
    socket.join(`workflow_${workflowId}`);
    console.log(`Socket ${socket.id} joined workflow_${workflowId}`);
  });

  socket.on("leave_workflow", (workflowId) => {
    socket.leave(`workflow_${workflowId}`);
  });

  // ── Typing indicators ───────────────────────────────────────────────────
  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_typing", { senderId });
    }
  });

  socket.on("stop_typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(String(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("user_stop_typing", { senderId });
    }
  });

  // ── Read receipt ────────────────────────────────────────────────────────
  socket.on("messages_read", ({ readerId, senderId }) => {
    const senderSocketId = onlineUsers.get(String(senderId));
    if (senderSocketId) {
      io.to(senderSocketId).emit("messages_seen", { readerId });
    }
  });

  // ── WebRTC Signaling ─────────────────────────────────────────────────────
  // Caller → Callee: send offer SDP + call metadata
  socket.on("call_offer", ({ to, from, callType, sdp }) => {
    const toSocketId = onlineUsers.get(String(to));
    if (toSocketId) {
      io.to(toSocketId).emit("call_offer", { from, callType, sdp });
    }
  });

  // Callee → Caller: send answer SDP
  socket.on("call_answer", ({ to, sdp }) => {
    const toSocketId = onlineUsers.get(String(to));
    if (toSocketId) {
      io.to(toSocketId).emit("call_answer", { sdp });
    }
  });

  // Both sides: relay ICE candidates to the other peer
  socket.on("ice_candidate", ({ to, candidate }) => {
    const toSocketId = onlineUsers.get(String(to));
    if (toSocketId) {
      io.to(toSocketId).emit("ice_candidate", { candidate });
    }
  });

  // Callee rejects the incoming call
  socket.on("call_rejected", ({ to }) => {
    const toSocketId = onlineUsers.get(String(to));
    if (toSocketId) {
      io.to(toSocketId).emit("call_rejected");
    }
  });

  // Either side hangs up
  socket.on("call_ended", ({ to }) => {
    const toSocketId = onlineUsers.get(String(to));
    if (toSocketId) {
      io.to(toSocketId).emit("call_ended");
    }
  });

  // ── Disconnect ──────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online_users", Array.from(onlineUsers.keys()));
    console.log("Socket disconnected:", socket.id);
  });
});

// ── Typing indicators for task discussions ────────────────────────────────────
setupTypingEvents(io);

// ── Faculty performance scoring: seed once at boot, then nightly via cron ──────
startScoreCron(db);
recalculateAllScores(db, { keepHistory: false })
  .then((result) => console.log("[facultyScore] Initial score seed complete:", result))
  .catch((err) => console.error("[facultyScore] Initial score seed failed:", err));

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));