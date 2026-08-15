const express = require("express");
const router = express.Router();
const {
  createFee,
  previewFeeTargets,
  getFees,
  getClearanceFees,
  updateFee,
  archiveFee,
  restoreFee,
  deleteFee,
  archiveStudentFee,
  restoreStudentFee,
  deleteStudentFee,
  listStudentFeeArchive,
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

router.get("/clearance", protect, authorize("student"), getClearanceFees);

router.route("/:id").patch(protect, authorize("treasurer"), updateFee);

router.patch("/:id/archive", protect, authorize("treasurer"), archiveFee);
router.patch("/:id/restore", protect, authorize("treasurer"), restoreFee);
router.delete("/:id", protect, authorize("treasurer"), deleteFee);

router.get(
  "/student-archive",
  protect,
  authorize("student"),
  listStudentFeeArchive,
);
router.patch(
  "/:id/student-archive",
  protect,
  authorize("student"),
  archiveStudentFee,
);
router.patch(
  "/:id/student-restore",
  protect,
  authorize("student"),
  restoreStudentFee,
);
router.delete(
  "/:id/student-archive",
  protect,
  authorize("student"),
  deleteStudentFee,
);

module.exports = router;
