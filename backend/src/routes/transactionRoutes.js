const express = require("express");
const {
  listTransactions,
  createTransaction,
} = require("../controllers/transactionController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("treasurer"), listTransactions)
  .post(protect, authorize("treasurer"), createTransaction);

module.exports = router;
