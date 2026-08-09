const multer = require("multer");

const MAX_STATEMENT_SIZE = 15 * 1024 * 1024;
const PDF_SIGNATURE = Buffer.from("%PDF-");

const statementUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_STATEMENT_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(
        new multer.MulterError("LIMIT_UNEXPECTED_FILE", "statement"),
      );
    }
    callback(null, true);
  },
});

const validatePdfSignature = (req, res, next) => {
  if (!req.file?.buffer || req.file.buffer.length < PDF_SIGNATURE.length) {
    return res.status(400).json({
      success: false,
      message: "A readable PDF statement is required.",
    });
  }

  if (
    !req.file.buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)
  ) {
    return res.status(400).json({
      success: false,
      message: "The uploaded file is not a valid PDF.",
    });
  }

  next();
};

module.exports = {
  statementUpload,
  validatePdfSignature,
  MAX_STATEMENT_SIZE,
};
