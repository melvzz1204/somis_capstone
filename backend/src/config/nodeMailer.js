const nodemailer = require("nodemailer");
const dns = require("dns");

const lookupIpv4 = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, family: 4, all: false }, callback);
};

// Render may prefer Gmail's IPv6 address even when IPv6 routing is unavailable.
// Prefer IPv4 for all DNS lookups used by Nodemailer.
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const emailUser = String(process.env.EMAIL_USER || "").trim();
const emailPassword = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const emailHost = String(process.env.EMAIL_HOST || "smtp.gmail.com").trim();
const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailSecure =
  String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  family: 4,
  lookup: lookupIpv4,
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
  if (!emailUser || !emailPassword) {
    throw new Error("EMAIL_USER and EMAIL_PASS are not configured.");
  }

  return transporter.sendMail({
    from: `\"MarSU SOMIS\" <${emailUser}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail, transporter };
