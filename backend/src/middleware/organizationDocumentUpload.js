const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");

const MAX_DOCUMENT_FILES = 10;
const MAX_DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;
const uploadDir = path.join(process.cwd(), "uploads", "organization-documents");

const allowedFileTypes = new Map([
  [".pdf", new Set(["application/pdf"])],
  [
    ".doc",
    new Set([
      "application/msword",
      "application/octet-stream",
      "application/x-tika-msoffice",
    ]),
  ],
  [
    ".docx",
    new Set([
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "application/zip",
    ]),
  ],
  [
    ".xls",
    new Set([
      "application/vnd.ms-excel",
      "application/octet-stream",
      "application/x-tika-msoffice",
    ]),
  ],
  [
    ".xlsx",
    new Set([
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream",
      "application/zip",
    ]),
  ],
  [".png", new Set(["image/png"])],
  [".jpg", new Set(["image/jpeg"])],
  [".jpeg", new Set(["image/jpeg"])],
  [".gif", new Set(["image/gif"])],
  [".webp", new Set(["image/webp"])],
]);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `organization-document-${randomUUID()}${extension}`);
  },
});

const organizationDocumentUpload = multer({
  storage,
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE,
    files: MAX_DOCUMENT_FILES,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = allowedFileTypes.get(extension);

    if (!acceptedMimeTypes || !acceptedMimeTypes.has(file.mimetype)) {
      callback(
        new Error(
          "Unsupported attachment type. Use PDF, Word, Excel, PNG, JPG, GIF, or WEBP files.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

module.exports = organizationDocumentUpload;
module.exports.MAX_DOCUMENT_FILES = MAX_DOCUMENT_FILES;
module.exports.MAX_DOCUMENT_FILE_SIZE = MAX_DOCUMENT_FILE_SIZE;
module.exports.allowedFileTypes = allowedFileTypes;
