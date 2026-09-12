const express = require("express");
const {
  createResolution,
  getResolutions,
  getResolution,
  updateResolution,
  submitResolution,
  reviewResolution,
  getPresidentSignature,
  getAdviserSignature,
  getDeanSignature,
  deleteResolution,
  getAdoptableResolutions,
} = require("../controllers/resolutionController");
const { protect, authorize } = require("../middleware/authMiddileware");
const resolutionUpload = require("../middleware/resolutionUpload");

const router = express.Router();

const resolutionAttachmentFields = resolutionUpload.fields([
  { name: "attachments", maxCount: 5 },
  { name: "proposalAttachments", maxCount: 5 },
]);

router
  .route("/")
  .get(protect, getResolutions)
  .post(
    protect,
    authorize("secretary"),
    resolutionAttachmentFields,
    createResolution,
  );

router.get(
  "/president-signature",
  protect,
  authorize("org_admin"),
  getPresidentSignature,
);

router.get(
  "/adviser-signature",
  protect,
  authorize("adviser"),
  getAdviserSignature,
);

router.get("/dean-signature", protect, authorize("dean"), getDeanSignature);

router.get(
  "/adopted",
  protect,
  authorize("secretary", "org_admin", "treasurer"),
  getAdoptableResolutions,
);

router.patch(
  "/:id/submit",
  protect,
  authorize("secretary"),
  submitResolution,
);

router.patch(
  "/:id/review",
  protect,
  authorize("org_admin", "adviser", "dean"),
  reviewResolution,
);

router
  .route("/:id")
  .get(protect, getResolution)
  .put(
    protect,
    authorize("secretary"),
    resolutionAttachmentFields,
    updateResolution,
  )
  .delete(protect, authorize("secretary"), deleteResolution);

module.exports = router;
