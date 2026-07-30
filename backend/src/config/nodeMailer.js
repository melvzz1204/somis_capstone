const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
  },
});

// Verify connection on startup (great for debugging)
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("🚀 Email service ready (Gmail SMTP)");
  }
});

module.exports = transporter;
