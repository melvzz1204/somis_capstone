const express = require("express");
const {
  getMeetings,
  createMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getMeetings)
  .post(protect, authorize("org_admin", "admin"), createMeeting);

router.delete("/:id", protect, authorize("org_admin", "admin"), deleteMeeting);

module.exports = router;
