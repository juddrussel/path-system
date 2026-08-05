const express = require("express");
const multer = require("multer");
const { uploadToR2 } = require("../utils/uploadToR2");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // store in memory, send to R2

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { key, url } = await uploadToR2(req.file);
    res.json({ success: true, url, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

module.exports = router;