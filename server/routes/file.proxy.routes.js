const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * Authentication middleware - accepts JWT from either:
 * 1. Authorization header (Bearer token) - for regular API calls
 * 2. Query parameter 'token' - for iframe/img src compatibility
 */
function requireAuth(req, res, next) {
  let token = null;
  
  // Try to get token from Authorization header first
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.split(" ")[1];
  }
  
  // Fall back to query parameter for iframe compatibility
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
}

/**
 * GET /api/files/proxy?key=uploads/...&token=...
 * 
 * Proxies file requests from R2 through the server to bypass rate limits.
 * Browser never directly accesses R2, so no rate limit issues.
 * 
 * **REQUIRES AUTHENTICATION** - Users must be logged in to access files.
 * Accepts JWT token via Authorization header OR query parameter for iframe compatibility.
 * 
 * Query params:
 *   key: R2 object key (e.g., "uploads/uuid-filename.png")
 *   token: (optional) JWT token for iframe/img src authentication
 */
router.get("/proxy", requireAuth, async (req, res) => {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({ message: "Missing 'key' parameter" });
    }

    if (!process.env.R2_BUCKET_NAME) {
      return res.status(500).json({ message: "R2 bucket not configured" });
    }

    console.log(`[File Proxy] User ${req.user.username} (${req.user.role}) fetching: ${key}`);

    // Fetch file from R2
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);

    // Set appropriate headers
    const contentType = response.ContentType || "application/octet-stream";
    const fileName = key.split("/").pop();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", response.ContentLength || 0);
    res.setHeader("Cache-Control", "private, max-age=3600"); // Cache for 1 hour (private since authenticated)
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Stream the body directly to the response
    response.Body.pipe(res);

    // Handle stream errors
    response.Body.on("error", (err) => {
      console.error(`[File Proxy] Stream error for ${key}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream file" });
      }
    });
  } catch (err) {
    console.error(`[File Proxy] Error fetching ${req.query.key}:`, err.message);

    if (err.Code === "NoSuchKey") {
      return res.status(404).json({ message: "File not found" });
    }

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  }
});

module.exports = router;
