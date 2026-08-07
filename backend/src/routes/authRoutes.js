// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddileware");

const { login, setupAccount, getMe } = authController;

router.post("/login", login);
router.post("/setup-account", setupAccount);
router.get("/me", protect, getMe);
router.post("/register-student", authController.registerStudent);

module.exports = router;
