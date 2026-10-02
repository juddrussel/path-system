const express = require("express");
const jwt = require("jsonwebtoken");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const r2Client = require("../config/r2");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Store for temporary preview tokens (in production, use Redis)
const previewTokens = new Map();

// Clean up expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of previewTokens.entries()) {
    if (data.expiresAt < now) {
      previewTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * POST /api/files/preview-token
 * Generate a temporary token for viewing a file
 * Requires authentication
 */
router.post("/preview-token", requireAuth, async (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ message: "Missing 'key' parameter" });
    }

    // Generate a temporary token (valid for 5 minutes)
    const previewToken = jwt.sign(
      { key, userId: req.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Store token with expiry
    previewTokens.set(previewToken, {
      key,
      userId: req.user.id,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    console.log(`[Preview Token] Generated for user ${req.user.id}: ${key}`);

    res.json({ previewToken });
  } catch (err) {
    console.error("[Preview Token] Error:", err.message);
    res.status(500).json({ message: "Failed to generate preview token" });
  }
});

/**
 * GET /api/files/preview?token=...
 * View a file using a temporary preview token
 * No authentication required (token validates access)
 */
router.get("/preview", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Missing 'token' parameter" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired preview token" });
    }

    // Check if token exists in our store
    const tokenData = previewTokens.get(token);
    if (!tokenData) {
      return res.status(401).json({ message: "Preview token not found or expired" });
    }

    const { key } = decoded;

    if (!process.env.R2_BUCKET_NAME) {
      return res.status(500).json({ message: "R2 bucket not configured" });
    }

    console.log(`[Preview] User ${decoded.userId} viewing: ${key}`);

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
    res.setHeader("Cache-Control", "private, max-age=300"); // Cache for 5 minutes
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    // Stream the body directly to the response
    response.Body.pipe(res);

    // Handle stream errors
    response.Body.on("error", (err) => {
      console.error(`[Preview] Stream error for ${key}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to stream file" });
      }
    });
  } catch (err) {
    console.error(`[Preview] Error:`, err.message);

    if (err.Code === "NoSuchKey") {
      return res.status(404).json({ message: "File not found" });
    }

    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to retrieve file" });
    }
  }
});

module.exports = router;
