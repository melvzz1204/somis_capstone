const express = require("express");
const {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getMeetings)
  .post(protect, authorize("org_admin", "admin"), createMeeting);

router
  .route("/:id")
  .patch(protect, authorize("org_admin", "admin"), updateMeeting)
  .delete(protect, authorize("org_admin", "admin"), deleteMeeting);

module.exports = router;
