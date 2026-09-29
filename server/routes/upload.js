const express = require("express");
const multer = require("multer");
const express = require("express");
const { uploadToR2, deleteFromR2 } = require("../utils/uploadToR2");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the frontend's per-file cap
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }
    const { key, url } = await uploadToR2(req.file);
    res.json({ success: true, url, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// ─── POST /api/upload-files ─────────────────────────────────────────────────
// Upload multiple files for comments (pre-upload before posting)
router.post("/upload-files", upload.array("files", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    const fileUrls = [];
    for (const file of req.files) {
      try {
        const { url } = await uploadToR2(file);
        fileUrls.push({
          url,
          name: file.originalname,
          size: file.size,
          type: file.mimetype
        });
      } catch (uploadErr) {
        console.error("[File Upload Error]", uploadErr);
        return res.status(500).json({ message: "File upload to R2 failed", error: uploadErr.message });
      }
    }

    res.status(200).json({ files: fileUrls });
  } catch (err) {
    console.error("[Upload Files Error]", err);
    res.status(500).json({ message: "Failed to upload files", error: err.message });
  }
});

// key is URL-encoded on the way in since it contains slashes, e.g. "uploads/uuid-name.pdf"
router.delete("/upload/:key", async (req, res) => {
  try {
    await deleteFromR2(decodeURIComponent(req.params.key));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

module.exports = router;