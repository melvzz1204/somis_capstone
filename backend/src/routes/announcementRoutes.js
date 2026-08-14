const express = require("express");
const {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");
const { protect, authorize } = require("../middleware/authMiddileware");

const router = express.Router();

router
  .route("/")
  .get(protect, getAnnouncements)
  .post(protect, authorize("pio", "org_admin", "admin"), createAnnouncement);

router
  .route("/:id")
  .put(protect, authorize("pio", "org_admin", "admin"), updateAnnouncement)
  .delete(protect, authorize("pio", "org_admin", "admin"), deleteAnnouncement);

module.exports = router;
