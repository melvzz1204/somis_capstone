const express = require("express");
const router = express.Router();
const memberController = require("../controllers/orgMemberController");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/authMiddileware");
const { sendMemberInvite } = require("../controllers/orgMemberController");

// 1. Fetch the logged-in student's organization, membership, and roster
router.get("/mine", protect, memberController.getMyOrganization);

// 2. Fetch members for the currently logged-in user's organization
router.get("/", protect, memberController.getMembersByOrg);

// 3. Add a new member (with avatar file upload support)
router.post("/", protect, upload.single("avatar"), memberController.addMember);

// 4. Fetch members by specific organization ID
router.get("/:orgId", protect, memberController.getMembersByOrg);

// 5. Delete member by ID
router.delete("/:id", protect, memberController.deleteMember);

// 6. PUT update member (Handles text + optional new avatar image)
router.put(
  "/:id",
  protect,
  upload.single("avatar"),
  memberController.updateMember,
);
router.post(
  "/:id/create-account",
  protect,
  memberController.createOfficerAccount,
);
router.post("/:id/send-invite", protect, sendMemberInvite);

module.exports = router;
