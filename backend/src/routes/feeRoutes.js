const express = require("express");
const router = express.Router();
const { createFee, getFees } = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/authMiddileware");

// Route: /api/v1/fees
router
  .route("/")
  .post(protect, authorize("treasurer"), createFee)
  .get(protect, getFees);

module.exports = router;
