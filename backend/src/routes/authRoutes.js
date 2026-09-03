// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddileware");
const upload = require("../middleware/upload");

const { login, setupAccount, getMe } = authController;

router.post("/login", login);
router.post("/setup-account", setupAccount);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", protect, getMe);
router.put(
  "/student-account",
  protect,
  upload.single("avatar"),
  authController.updateStudentAccount,
);
router.post("/register-student", authController.registerStudent);

module.exports = router;
