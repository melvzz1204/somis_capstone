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
  archiveStudentFee,
  restoreStudentFee,
  deleteStudentFee,
  listStudentFeeArchive,
} = require("../controllers/feeController");
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

router.get("/clearance", protect, authorize("student"), getClearanceFees);

router.route("/:id").patch(protect, authorize("org_admin"), updateFee);

router.patch("/:id/review", protect, authorize("adviser"), reviewFee);

router.patch("/:id/archive", protect, authorize("org_admin"), archiveFee);
router.patch("/:id/restore", protect, authorize("org_admin"), restoreFee);
router.delete("/:id", protect, authorize("org_admin"), deleteFee);

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
