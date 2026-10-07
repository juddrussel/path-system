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

// ── SSR Middleware ──
const ssrMiddleware = require("./ssr");
const SSR_ENABLED = process.env.ENABLE_SSR === "true";

// ── DEBUG: confirm .env is loaded ──
console.log("ENV CHECK:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? "✓ set" : "✗ missing",
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? "✓ set" : "✗ missing",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? "✓ set" : "✗ missing",
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "✗ missing",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "✗ missing",
  ENABLE_SSR: SSR_ENABLED ? "✓ enabled" : "✗ disabled",
});

const authRoutes = require("./routes/auth.routes");
const passport   = require("passport");
// Passport strategies are registered inside auth.routes.js on require
const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");

const { router: auditRoutes } = require("./routes/audit.routes");
const { router: taskRoutes, setupTypingEvents, startDeadlineReminderJob } = require("./routes/task.routes");
const { router: notificationRoutes } = require("./routes/notification.routes");
const collaborativeRoutes = require("./routes/collaborative.routes");
const formRoutes = require("./routes/form.routes");
const migrationRoutes = require("./routes/migration.routes"); // TEMPORARY - DELETE AFTER MIGRATION
const categoryRoutes = require("./routes/category.routes");
const workflowRoutes = require("./routes/workflow.routes");
const facultyRoutes = require("./routes/facultyRoutes");
const slaRoutes = require("./routes/slaRoutes");
const trackingRoutes = require("./routes/tracking.routes");
const academicRoutes = require("./routes/academic.routes");
const fileProxyRoutes = require("./routes/file.proxy.routes");
const startScoreCron = require("./jobs/scoreCron");
const { startSlaCron } = require("./cron/slaCron");
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
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// ── Socket.IO setup ──
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
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
app.use(cors({
  origin: "*",  // Allow all origins in dev
  credentials: false
}));
app.use(express.json({ charset: 'utf-8' }));
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.type('application/json; charset=utf-8');
  next();
});
app.use(passport.initialize());
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

// ── Health check endpoint (for Docker/Fly.io) ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Make io accessible to route files via app ──
app.set("io", io);

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/collaborative-tasks", collaborativeRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/migration", migrationRoutes); // TEMPORARY - DELETE AFTER RUNNING MIGRATION
app.use("/api/categories", categoryRoutes);
app.use("/api/workflows", workflowRoutes);
app.use("/api/faculty", facultyRoutes(db));
app.use("/api/sla", slaRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/files", fileProxyRoutes);

// ── Collaborative editing (Phase 2+) – persistence & audit ──
// REMOVED: Collab editing no longer needed

// ── R2 file upload ──
const uploadRoute = require("./routes/upload");
app.use("/api", uploadRoute);

// ════════════════════════════════════════════════════════════════════════════
// SSR & STATIC FILE SERVING
// ════════════════════════════════════════════════════════════════════════════

// SSR Middleware - handles server-side rendering of public pages
// Must come BEFORE static file serving so SSR can intercept public routes
// Falls through to next() if SSR is disabled or route is not SSR-enabled
app.use(ssrMiddleware);

// Static file serving for client assets (JS, CSS, images)
// This serves the built client files (dist folder)
const clientDistPath = path.resolve(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  console.log(`[Static] Serving client assets from: ${clientDistPath}`);
} else {
  console.warn(`[Static] Client dist folder not found at: ${clientDistPath}`);
  console.warn(`[Static] Run 'npm run build' in client directory to generate production files`);
}

// ════════════════════════════════════════════════════════════════════════════
// 404 HANDLER (must be last)
// ════════════════════════════════════════════════════════════════════════════

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

  socket.on("register", async (userId) => {
    socket.userId = String(userId);   // ← required by setupTypingEvents
    onlineUsers.set(String(userId), socket.id);
    socket.join(`user_${userId}`);
    console.log(`User ${userId} registered, joined user_${userId}`);
    io.emit("online_users", Array.from(onlineUsers.keys()));

    // Auto-join all group rooms this user belongs to so broadcasts reach them
    try {
      const [groups] = await db.query(
        "SELECT group_id FROM chat_group_members WHERE user_id = ?",
        [userId]
      );
      for (const { group_id } of groups) {
        socket.join(`group_${group_id}`);
      }
      if (groups.length > 0) {
        console.log(`User ${userId} auto-joined ${groups.length} group room(s)`);
      }
    } catch (err) {
      console.error(`Failed to auto-join group rooms for user ${userId}:`, err.message);
    }
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

  // ── Edit message ─────────────────────────────────────────────────────────
  // The REST PATCH call already persisted + authorized the edit; this just
  // relays the new content to the other participant in real time.
  socket.on("edit_message", (data) => {
    const receiverSocketId = onlineUsers.get(String(data.receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message_edited", { messageId: data.messageId, content: data.content });
    }
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

  // ── Task collaboration: real-time comment updates ──────────────────────────
  socket.on("join_task", ({ taskId }) => {
    socket.join(`task_${taskId}`);
    console.log(`Socket ${socket.id} joined task_${taskId}`);
  });

  socket.on("leave_task", ({ taskId }) => {
    socket.leave(`task_${taskId}`);
    console.log(`Socket ${socket.id} left task_${taskId}`);
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

  // ── Group chat ───────────────────────────────────────────────────────────
  // Explicit join (called when user opens a group — ensures they're in the room
  // even if the auto-join on register happened before the group was created).
  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  socket.on("leave_group", (groupId) => {
    socket.leave(`group_${groupId}`);
  });

  // Broadcast a new group message to all online members in the room.
  // The REST POST already persisted the message; this just delivers it live.
  socket.on("send_group_message", ({ groupId, message }) => {
    io.to(`group_${groupId}`).emit("receive_group_message", { groupId, message });
  });

  // Group typing indicators
  socket.on("group_typing", ({ groupId, senderId, senderName }) => {
    socket.to(`group_${groupId}`).emit("group_user_typing", { groupId, senderId, senderName });
  });

  socket.on("group_stop_typing", ({ groupId, senderId }) => {
    socket.to(`group_${groupId}`).emit("group_user_stop_typing", { groupId, senderId });
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

// ── Deadline reminders: periodic sweep for tasks with an approaching deadline ──
startDeadlineReminderJob(io);

// ── Faculty performance scoring: seed once at boot, then nightly via cron ──────
startScoreCron(db);
recalculateAllScores(db, { keepHistory: false })
  .then((result) => console.log("[facultyScore] Initial score seed complete:", result))
  .catch((err) => console.error("[facultyScore] Initial score seed failed:", err));

// ── SLA email alerts: hourly before/after-deadline check ───────────────────────
startSlaCron();

// ── Auto-run collaborative tasks migration on startup ──────────────────────────
async function runCollaborativeMigration() {
  try {
    console.log("[Startup] Checking collaborative tasks schema...");
    
    // Check if tables exist
    const [tables] = await db.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('task_final_outputs', 'task_confirmations')
    `);
    
    if (tables.length === 2) {
      console.log("[Startup] ✓ Collaborative tasks schema already exists");
      return;
    }
    
    console.log("[Startup] Running collaborative tasks schema migration...");
    
    // 1. Update tasks table
    await db.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS assignment_type ENUM('individual','collaborative') DEFAULT 'individual' AFTER is_collaborative,
      ADD COLUMN IF NOT EXISTS current_output_version INT DEFAULT 0 AFTER assignment_type,
      ADD COLUMN IF NOT EXISTS all_confirmed_at DATETIME AFTER current_output_version,
      ADD COLUMN IF NOT EXISTS submitted_at DATETIME AFTER all_confirmed_at
    `);
    console.log("[Startup] ✓ tasks table updated");

    // 2. Create task_final_outputs table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_final_outputs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        version INT NOT NULL,
        file_url VARCHAR(1024) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT,
        uploaded_by INT NOT NULL,
        upload_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_task_version (task_id, version),
        INDEX idx_task_id (task_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[Startup] ✓ task_final_outputs table created");

    // 3. Create task_confirmations table
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_confirmations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        output_version INT NOT NULL,
        confirmed_at DATETIME,
        withdrawn_at DATETIME,
        status ENUM('pending','confirmed','withdrawn') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_version (task_id, user_id, output_version),
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[Startup] ✓ task_confirmations table created");

    // 4. Update task_collaborators table
    await db.query(`
      ALTER TABLE task_collaborators 
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'contributor' AFTER user_id,
      ADD COLUMN IF NOT EXISTS current_version_confirmed TINYINT DEFAULT 0 AFTER confirmed_at,
      ADD KEY idx_role (role)
    `);
    console.log("[Startup] ✓ task_collaborators table updated");

    // 5. Create task_comments table (if it doesn't exist)
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content LONGTEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_task_id (task_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("[Startup] ✓ task_comments table created");

    console.log("[Startup] ✓ Collaborative tasks schema migration completed successfully!");
  } catch (err) {
    console.error("[Startup] Migration error:", err.message);
    // Don't exit — let server start anyway; schema may already exist
  }
}

// Run migration before starting server
runCollaborativeMigration();

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SSR: ${SSR_ENABLED ? "✓ enabled" : "✗ disabled"} (set ENABLE_SSR=true to enable)`);
  if (SSR_ENABLED) {
    const ssrStatus = ssrMiddleware.getSSRStatus();
    console.log(`SSR routes: ${ssrStatus.routes.join(", ")}`);
  }
});