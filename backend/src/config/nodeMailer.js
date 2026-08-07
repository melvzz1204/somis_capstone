const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your 16-character Google App Password
  },
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("🚀 Email service ready (Gmail SMTP)");
  }
});

// Wrapper function that handles sending mail via transporter
const sendEmail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: `"MarSU SOMIS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail, transporter };
