// ============================================================
// middleware/upload.js – Multer config for truck image uploads
// ============================================================
// ⚠️  RENDER NOTE: Render's filesystem is ephemeral — files
// saved to disk are deleted on every restart/redeploy.
// We use memoryStorage so the binary is available in req.file.buffer,
// then the controller converts it to a base64 Data URL and stores
// it directly in the database TEXT column (image_url).
// This is simple and works great for images ≤ 500 KB.
// For larger files migrate to Cloudinary or S3.
// ============================================================

const multer = require("multer");

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, or WebP images are allowed"));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),   // ← Keep in RAM, NOT disk
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
});

module.exports = upload;
