const express = require("express");
const router = express.Router();
const { login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddileware");

// Public routes
router.post("/login", login);

// Protected routes (Requires valid JWT token)
router.get("/me", protect, getMe);

module.exports = router;
