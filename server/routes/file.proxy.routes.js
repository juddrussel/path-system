const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const jwt = require("jsonwebtoken");

const router = express.Router();

/**
 * Authentication middleware - ONLY accepts JWT from Authorization header
 * This prevents URL-based token sharing
 */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - Authentication required" });
  }
  
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
}

/**
 * GET /api/files/proxy?key=uploads/...
 * 
 * Proxies file requests from R2 through the server to bypass rate limits.
 * Browser never directly accesses R2, so no rate limit issues.
 * 
 * **REQUIRES AUTHENTICATION** - Users must send valid JWT in Authorization header.
 * Does NOT accept tokens in query parameters to prevent URL sharing.
 * 
 * For iframe compatibility, the frontend should use a proxy component that
 * fetches the file with proper headers and creates a blob URL.
 * 
 * Query params:
 *   key: R2 object key (e.g., "uploads/uuid-filename.png")
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
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate"); // Prevent caching
    res.setHeader("Pragma", "no-cache"); // HTTP 1.0 compatibility
    res.setHeader("Expires", "0"); // Proxies
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
    res.setHeader("X-Content-Type-Options", "nosniff");

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
