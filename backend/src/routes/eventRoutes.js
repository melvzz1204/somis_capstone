const express = require("express");
const {
  getEvents,
  createEvent,
  configureAttendanceSchedule,
  generateAttendanceQr,
  getCreatedAttendanceQrs,
  revokeAttendanceQr,
  scanAttendanceQr,
  getMyAttendance,
  getEventAttendance,
  joinEvent,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getEvents)
  .post(protect, authorize("secretary"), createEvent);

router.post(
  "/attendance/scan",
  protect,
  authorize("student"),
  scanAttendanceQr,
);
router.get("/attendance/mine", protect, authorize("student"), getMyAttendance);
router.post("/:id/join", protect, authorize("student"), joinEvent);
router.patch(
  "/:id/attendance/schedule",
  protect,
  authorize("secretary"),
  configureAttendanceSchedule,
);
router.get(
  "/:id/attendance/qr",
  protect,
  authorize("secretary"),
  getCreatedAttendanceQrs,
);
router.post(
  "/:id/attendance/qr",
  protect,
  authorize("secretary"),
  generateAttendanceQr,
);
router.delete(
  "/:id/attendance/qr",
  protect,
  authorize("secretary"),
  revokeAttendanceQr,
);
router.get(
  "/:id/attendance",
  protect,
  authorize("secretary"),
  getEventAttendance,
);

module.exports = router;
