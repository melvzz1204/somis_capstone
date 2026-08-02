// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// 👈 Debug log
console.log("Loaded Controller Handlers:", authController);

const { login, setupAccount, getMe } = authController;

router.post("/login", login);
router.post("/setup-account", setupAccount);
router.get("/me", getMe);

module.exports = router;
