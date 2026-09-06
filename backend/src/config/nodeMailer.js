const nodemailer = require("nodemailer");
const RESEND_API_URL = "https://api.resend.com/emails";
const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
const resendFromEmail = String(process.env.RESEND_FROM_EMAIL || "").trim();
const smtpUser = String(process.env.EMAIL_USER || "").trim();
const smtpPassword = String(process.env.EMAIL_PASS || "").trim();
const smtpHost = String(process.env.EMAIL_HOST || "smtp.gmail.com").trim();
const smtpPort = Number(process.env.EMAIL_PORT || 465);
const smtpSecure =
  String(process.env.EMAIL_SECURE || "true").toLowerCase() === "true";

const smtpTransporter =
  !resendApiKey && smtpUser && smtpPassword
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPassword },
      })
    : null;

if (resendApiKey && resendFromEmail) {
  console.log(`Email service configured with Resend sender ${resendFromEmail}`);
} else if (smtpTransporter) {
  console.log(`Email service configured with SMTP sender ${smtpUser}`);
} else {
  console.warn(
    "Email service is disabled: configure Resend or EMAIL_USER and EMAIL_PASS.",
  );
}

const sendEmail = async ({ to, subject, html }) => {
  if (!resendApiKey || !resendFromEmail) {
    if (!smtpTransporter) {
      throw new Error(
        "Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL, or EMAIL_USER and EMAIL_PASS.",
      );
    }

    await smtpTransporter.sendMail({
      from: smtpUser,
      to,
      subject,
      html,
    });
    return { provider: "smtp" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [to],
      subject,
      html,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const responseBody = await response.text();
  let result;
  try {
    result = responseBody ? JSON.parse(responseBody) : {};
  } catch {
    result = { message: responseBody };
  }

  if (!response.ok) {
    throw new Error(
      `Resend API ${response.status}: ${result.message || "email request failed"}`,
    );
  }

  return result;
};

module.exports = { sendEmail };
