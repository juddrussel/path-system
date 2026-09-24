const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");

const router = express.Router();

// ── Auth middleware ───────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "Unauthorized." });
  try {
    const jwt = require("jsonwebtoken");
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized." });
  }
};

/**
 * GET /api/files/proxy?key=uploads/...
 * 
 * Proxies file requests from R2 through the server to bypass rate limits.
 * Browser never directly accesses R2, so no rate limit issues.
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

    console.log(`[File Proxy] Fetching key: ${key}`);

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
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    console.log(`[File Proxy] Streaming ${key} (${response.ContentLength} bytes)`);

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
    console.error(`[File Proxy] Error fetching file:`, {
      message: err.message,
      code: err.Code,
      key: req.query.key,
    });

    if (err.Code === "NoSuchKey") {
      return res.status(404).json({ message: "File not found" });
    }

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  }
});

module.exports = router;
