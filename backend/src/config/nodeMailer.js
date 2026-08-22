const nodemailer = require("nodemailer");

const emailUser = String(process.env.EMAIL_USER || "").trim();
const emailPassword = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
});

if (emailUser && emailPassword) {
  transporter.verify((error) => {
    if (error) {
      console.error("Email service error:", error.message);
    } else {
      console.log("Email service ready (Gmail SMTP)");
    }
  });
} else {
  console.warn(
    "Email service is disabled: EMAIL_USER or EMAIL_PASS is missing.",
  );
}

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `\"MarSU SOMIS\" <${emailUser}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail, transporter };
