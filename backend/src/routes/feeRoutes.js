const express = require("express");
const router = express.Router();
const {
  createFee,
  previewFeeTargets,
  getFees,
  updateFee,
  archiveFee,
} = require("../controllers/feeController");
const { protect, authorize } = require("../middleware/authMiddileware");

// Route: /api/v1/fees
router
  .route("/")
  .post(protect, authorize("treasurer"), createFee)
  .get(protect, getFees);

router.get(
  "/target-preview",
  protect,
  authorize("treasurer"),
  previewFeeTargets,
);

router.route("/:id").patch(protect, authorize("treasurer"), updateFee);

router.patch("/:id/archive", protect, authorize("treasurer"), archiveFee);

module.exports = router;
