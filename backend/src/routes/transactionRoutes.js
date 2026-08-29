const express = require("express");
const {
  listTransactions,
  createTransaction,
  reviewExpenseTransaction,
} = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/authMiddileware");
const {
  receiptUpload,
  validateReceiptSignature,
} = require("../middleware/receiptUpload");

const router = express.Router();

router.get("/", protect, authorize("treasurer"), listTransactions);
router.post(
  "/",
  protect,
  authorize("treasurer"),
  receiptUpload.single("receipt"),
  (req, res, next) => {
    if (String(req.body?.type || "").toLowerCase() !== "expense") return next();
    return validateReceiptSignature(req, res, next);
  },
  createTransaction,
);
router.patch(
  "/:id/review",
  protect,
  authorize("treasurer"),
  reviewExpenseTransaction,
);

module.exports = router;
