const express = require("express");
const {
  getEvents,
  createEvent,
  generateAttendanceQr,
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
router.post(
  "/:id/attendance/qr",
  protect,
  authorize("secretary"),
  generateAttendanceQr,
);
router.get(
  "/:id/attendance",
  protect,
  authorize("secretary"),
  getEventAttendance,
);

module.exports = router;
