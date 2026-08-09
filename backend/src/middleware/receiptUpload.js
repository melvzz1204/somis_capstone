const multer = require("multer");

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Checks common image magic bytes instead of trusting only the multipart MIME type.
 *
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const hasValidImageSignature = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer
    .subarray(0, 8)
    .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isJpeg || isPng || isWebp;
};

const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RECEIPT_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new Error("Receipt must be a JPEG, PNG, or WebP image."));
      return;
    }

    callback(null, true);
  },
});

const validateReceiptSignature = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "A receipt image is required in the 'receipt' field.",
    });
  }

  if (!hasValidImageSignature(req.file.buffer)) {
    return res.status(400).json({
      success: false,
      message: "The uploaded file is not a valid JPEG, PNG, or WebP image.",
    });
  }

  return next();
};

module.exports = {
  receiptUpload,
  validateReceiptSignature,
  MAX_RECEIPT_SIZE_BYTES,
  hasValidImageSignature,
};
