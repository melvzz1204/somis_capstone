const { sendEmail } = require("../config/nodeMailer");
const { createSetupUrl } = require("../config/frontendUrl");

const sendOrgInviteEmail = async (toEmail, orgName, setupToken) => {
  const setupUrl = createSetupUrl(setupToken);

  await sendEmail({
    to: toEmail,
    subject: `[SOMIS] Set Up Account Credentials - ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Welcome to SOMIS!</h2>
        <p>Your student organization <strong>${orgName}</strong> has been registered by the OVPSAS Admin.</p>
        <p>Click the button below to set up your password and access your dashboard:</p>
        <a href="${setupUrl}" style="background-color: #0f172a; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin: 15px 0;">
          Set Up Account Password
        </a>
        <p style="font-size: 12px; color: #64748b;">If the button doesn't work, copy and paste this link:<br>${setupUrl}</p>
      </div>
    `,
  });

  return setupUrl;
};

module.exports = sendOrgInviteEmail;
