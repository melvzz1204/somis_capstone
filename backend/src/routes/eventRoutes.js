const express = require("express");
const { getEvents, createEvent } = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getEvents)
  .post(protect, authorize("secretary"), createEvent);

module.exports = router;
