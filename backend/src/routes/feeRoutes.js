const express = require("express");
const router = express.Router();
const { createFee, getFees } = require("../controllers/feeController");
<<<<<<< HEAD

// Optional: Import your authentication/role middleware if applicable
// const { protect, authorize } = require("../middleware/authMiddleware");

// Route: /api/fees
router
  .route("/")
  .post(createFee) // Add fee to DB
  .get(getFees); // Fetch list of fees
=======
const { protect, authorize } = require("../middleware/authMiddileware");

// Route: /api/v1/fees
router
  .route("/")
  .post(protect, authorize("treasurer"), createFee)
  .get(protect, getFees);
>>>>>>> origin/module-1

module.exports = router;
