const nodemailer = require("nodemailer");
const dns = require("dns");
const net = require("net");

const emailUser = String(process.env.EMAIL_USER || "").trim();
const emailPassword = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");
const emailHost = String(process.env.EMAIL_HOST || "smtp.gmail.com").trim();
const emailPort = Number(process.env.EMAIL_PORT || 587);
const emailSecure =
  String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";

// Nodemailer 9 resolves hostnames with resolve4 and resolve6 internally. Give
// it a literal IPv4 endpoint so it cannot select Render's unreachable IPv6 path.
const resolveSmtpEndpoint = async () => {
  if (net.isIP(emailHost)) {
    return { host: emailHost, servername: undefined };
  }

  try {
    const [ipv4Address] = await dns.promises.resolve4(emailHost);
    if (ipv4Address) {
      return { host: ipv4Address, servername: emailHost };
    }
  } catch (error) {
    throw new Error(`Could not resolve ${emailHost} to IPv4: ${error.message}`);
  }

  throw new Error(`Could not resolve ${emailHost} to IPv4.`);
};

let transporter;
const transporterReady = resolveSmtpEndpoint().then((smtpEndpoint) => {
  console.log(
    `Email SMTP endpoint: ${smtpEndpoint.host}:${emailPort}${
      smtpEndpoint.servername ? ` (SNI ${smtpEndpoint.servername})` : ""
    }`,
  );

  transporter = nodemailer.createTransport({
    host: smtpEndpoint.host,
    port: emailPort,
    secure: emailSecure,
    ...(smtpEndpoint.servername
      ? { tls: { servername: smtpEndpoint.servername } }
      : {}),
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
});

if (emailUser && emailPassword) {
  transporterReady
    .then((readyTransporter) => {
      readyTransporter.verify((error) => {
        if (error) {
          console.error("Email service error:", error.message);
        } else {
          console.log("Email service ready (Gmail SMTP)");
        }
      });
    })
    .catch((error) => {
      console.error("Email service error:", error.message);
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

  const readyTransporter = await transporterReady;

  return readyTransporter.sendMail({
    from: `\"MarSU SOMIS\" <${emailUser}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail, transporterReady };
