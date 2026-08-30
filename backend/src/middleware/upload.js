const multer = require("multer");

// Keep avatar bytes in memory so production deployments do not depend on an
// ephemeral local filesystem (for example, Render's instance disk). The
// controller persists the resulting data URI in MongoDB with the member.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
