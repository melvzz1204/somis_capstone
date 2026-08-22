const RESEND_API_URL = "https://api.resend.com/emails";
const resendApiKey = String(process.env.RESEND_API_KEY || "").trim();
const resendFromEmail = String(process.env.RESEND_FROM_EMAIL || "").trim();

if (!resendApiKey || !resendFromEmail) {
  console.warn(
    "Email service is disabled: RESEND_API_KEY or RESEND_FROM_EMAIL is missing.",
  );
} else {
  console.log(`Email service configured with Resend sender ${resendFromEmail}`);
}

const sendEmail = async ({ to, subject, html }) => {
  if (!resendApiKey || !resendFromEmail) {
    throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are not configured.");
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
