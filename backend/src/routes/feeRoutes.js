const express = require("express");
const router = express.Router();
const {
  createFee,
  previewFeeTargets,
  getFees,
  getClearanceFees,
  updateFee,
  reviewFee,
  archiveFee,
  restoreFee,
  deleteFee,
} = require("../controllers/feeController");
const {
  listCollectibleFees,
} = require("../controllers/classCollectionController");
const { protect, authorize } = require("../middleware/authMiddileware");

// Route: /api/v1/fees
// The Organization President initiates and sets dues; the Faculty Adviser
// must approve a collection before it is finalized.
router
  .route("/")
  .post(protect, authorize("org_admin"), createFee)
  .get(protect, getFees);

router.get(
  "/target-preview",
  protect,
  authorize("org_admin"),
  previewFeeTargets,
);

// Approved parent dues a class treasurer may collect from classmates.
router.get(
  "/collectible",
  protect,
  authorize("treasurer"),
  listCollectibleFees,
);

router.get("/clearance", protect, authorize("student"), getClearanceFees);

router.route("/:id").patch(protect, authorize("org_admin"), updateFee);

router.patch("/:id/review", protect, authorize("adviser"), reviewFee);

router.patch("/:id/archive", protect, authorize("org_admin"), archiveFee);
router.patch("/:id/restore", protect, authorize("org_admin"), restoreFee);
router.delete("/:id", protect, authorize("org_admin"), deleteFee);

module.exports = router;
