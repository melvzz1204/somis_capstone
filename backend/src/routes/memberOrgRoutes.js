const express = require("express");
const router = express.Router();
const memberController = require("../controllers/orgMemberController");
const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/authMiddileware");
const { sendMemberInvite } = require("../controllers/orgMemberController");

// 1. Fetch the logged-in student's organization, membership, and roster
router.get("/mine", protect, memberController.getMyOrganization);

// 2. Fetch members for the currently logged-in user's organization
router.get("/", protect, memberController.getMembersByOrg);

// 3. Add a new member (with avatar file upload support)
// Faculty advisers manage their org roster; class presidents manage their
// class roster (enforced per-organization in the controller).
router.post(
  "/",
  protect,
  authorize("adviser", "org_admin"),
  upload.single("avatar"),
  memberController.addMember,
);

// 4. Look up a registered student for roster prefill (class presidents).
// Declared before "/:orgId" so "student-lookup" is not mistaken for an ID.
router.get(
  "/student-lookup",
  protect,
  authorize("adviser", "org_admin"),
  memberController.lookupStudent,
);

// 5. Fetch members by specific organization ID
router.get("/:orgId", protect, memberController.getMembersByOrg);

// 5. Delete member by ID
router.delete(
  "/:id",
  protect,
  authorize("adviser", "org_admin"),
  memberController.deleteMember,
);

// 6. PUT update member (Handles text + optional new avatar image)
router.put(
  "/:id",
  protect,
  authorize("adviser", "org_admin"),
  upload.single("avatar"),
  memberController.updateMember,
);
router.post(
  "/:id/create-account",
  protect,
  authorize("adviser"),
  memberController.createOfficerAccount,
);
router.post(
  "/:id/send-invite",
  protect,
  authorize("adviser", "org_admin"),
  sendMemberInvite,
);

module.exports = router;
