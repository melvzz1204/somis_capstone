const express = require("express");
const {
  createPayment,
  recordCashPayment,
  verifyBatchPdf,
  getMyPayment,
  listMyPayments,
  listPaymentAudit,
  verifyPayment,
} = require("../controllers/paymentController");
const {
  recordClassPayment,
  listClassCollected,
  remitClassPayment,
} = require("../controllers/classCollectionController");
const { uploadReceipt } = require("../controllers/receiptController");
const { protect, authorize } = require("../middleware/authMiddileware");
const {
  receiptUpload,
  validateReceiptSignature,
} = require("../middleware/receiptUpload");

const {
  statementUpload,
  validatePdfSignature,
} = require("../middleware/statementUpload");

const router = express.Router();

router.get("/audit", protect, authorize("treasurer"), listPaymentAudit);
router.post("/cash", protect, authorize("treasurer"), recordCashPayment);
// Class collection flow: class treasurers record and remit classmate
// payments; the organization treasurer verifies them afterwards.
router.post(
  "/class-collect",
  protect,
  authorize("treasurer"),
  recordClassPayment,
);
router.get(
  "/class-collected",
  protect,
  authorize("treasurer"),
  listClassCollected,
);
router.patch("/:id/remit", protect, authorize("treasurer"), remitClassPayment);
router.patch("/:id/verify", protect, authorize("treasurer"), verifyPayment);
router.post(
  "/verify-batch-pdf",
  protect,
  authorize("treasurer"),
  statementUpload.single("statement"),
  validatePdfSignature,
  verifyBatchPdf,
);
router.get("/mine", protect, authorize("student"), listMyPayments);
router.post(
  "/upload-receipt",
  protect,
  authorize("student"),
  receiptUpload.single("receipt"),
  validateReceiptSignature,
  uploadReceipt,
);
router.post("/", protect, authorize("student"), createPayment);
router.get("/:paymentId", protect, authorize("student"), getMyPayment);

module.exports = router;
