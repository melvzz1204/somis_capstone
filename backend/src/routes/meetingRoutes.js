const express = require("express");
const {
  getMeetings,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getUnreadCount,
  markMeetingViewed,
} = require("../controllers/meetingController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getMeetings)
  .post(protect, authorize("org_admin", "admin"), createMeeting);

// Notification endpoints (declared before "/:id" so "unread-count" is not
// mistaken for a meeting id).
router.get("/unread-count", protect, getUnreadCount);
router.patch("/:id/view", protect, markMeetingViewed);

router
  .route("/:id")
  .patch(protect, authorize("org_admin", "admin"), updateMeeting)
  .delete(protect, authorize("org_admin", "admin"), deleteMeeting);

module.exports = router;
