// server/services/slaEmailService.js
//
// Self-contained Brevo (Sendinblue) transactional email sender.
// If you already have a shared Brevo utility elsewhere in /services or /utils,
// just replace the body of sendTransactionalEmail() with a call to that instead
// — everything that calls this file (slaController.js) doesn't need to change.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendTransactionalEmail({ toList, subject, htmlContent }) {
  if (!process.env.BREVO_API_KEY) {
    console.warn("⚠️  BREVO_API_KEY not set — skipping email send:", subject);
    return { skipped: true };
  }
  if (!toList?.length) return { skipped: true, reason: "no recipients" };

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_SENDER_NAME || "PATH System",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: toList.map((email) => ({ email })),
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * Sends an SLA escalation/alert email to the configured default recipients.
 * @param {Object} params
 * @param {string[]} params.recipientEmails - resolved email addresses
 * @param {"critical"|"warning"} params.tier
 * @param {string} params.title
 * @param {string} params.message
 */
async function sendSlaAlertEmail({ recipientEmails, tier, title, message }) {
  const badgeColor = tier === "critical" ? "#dc2626" : "#d97706";
  const subject = `[SLA ${tier === "critical" ? "CRITICAL" : "WARNING"}] ${title}`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="padding: 14px 18px; border-radius: 8px; background:${tier === "critical" ? "#fef2f2" : "#fffbeb"}; border-left: 4px solid ${badgeColor};">
        <p style="margin:0; font-size:13px; font-weight:700; color:${badgeColor};">${title}</p>
        <p style="margin:8px 0 0; font-size:13px; color:#374151; line-height:1.5;">${message}</p>
      </div>
      <p style="font-size:11px; color:#9ca3af; margin-top:16px;">
        This is an automated notification from the PATH SLA Configuration system.
      </p>
    </div>
  `;
  return sendTransactionalEmail({ toList: recipientEmails, subject, htmlContent });
}

module.exports = { sendTransactionalEmail, sendSlaAlertEmail };
