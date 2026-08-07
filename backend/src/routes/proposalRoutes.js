const express = require("express");
const {
  createProposal,
  getProposals,
  updateProposal,
  getLeaderSignature,
  reviewProposal,
  deleteProposal,
} = require("../controllers/proposalController");
const { protect, authorize } = require("../middleware/authMiddileware");
const proposalUpload = require("../middleware/proposalUpload");

const router = express.Router();

router
  .route("/")
  .get(protect, getProposals)
  .post(
    protect,
    authorize("secretary"),
    proposalUpload.array("attachments", 5),
    createProposal,
  );

router.get(
  "/leader-signature",
  protect,
  authorize("org_admin"),
  getLeaderSignature,
);

router.patch("/:id/review", protect, authorize("org_admin"), reviewProposal);

router
  .route("/:id")
  .put(
    protect,
    authorize("secretary"),
    proposalUpload.array("attachments", 5),
    updateProposal,
  )
  .delete(protect, authorize("secretary"), deleteProposal);

module.exports = router;
