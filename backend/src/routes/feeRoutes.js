const express = require("express");
const router = express.Router();
const { createFee, getFees } = require("../controllers/feeController");

// Optional: Import your authentication/role middleware if applicable
// const { protect, authorize } = require("../middleware/authMiddleware");

// Route: /api/fees
router
  .route("/")
  .post(createFee) // Add fee to DB
  .get(getFees); // Fetch list of fees

module.exports = router;
