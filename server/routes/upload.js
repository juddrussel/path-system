const express = require("express");
const multer = require("multer");
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