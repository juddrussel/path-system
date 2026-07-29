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
 * Styled to match the PATH Account Recovery template (purple header, icon
 * badge, card body, light footer).
 *
 * @param {Object} params
 * @param {string[]} params.recipientEmails - resolved email addresses
 * @param {"critical"|"warning"} params.tier
 * @param {string} params.title
 * @param {string} params.message
 */
async function sendSlaAlertEmail({ recipientEmails, tier, title, message }) {
  const isCritical = tier === "critical";
  const accentColor = isCritical ? "#dc2626" : "#d97706";
  const accentBg = isCritical ? "#fef2f2" : "#fffbeb";
  const iconBg = isCritical ? "#fee2e2" : "#fef3c7";
  const badgeLabel = isCritical ? "CRITICAL" : "WARNING";
  const subject = `[SLA ${badgeLabel}] ${title}`;

  // Same clock/alert glyph style as the lock icon in the reset-password email
  const iconSvg = isCritical
    ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
               stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`
    : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="12" cy="12" r="9" stroke="${accentColor}" stroke-width="2"/>
         <path d="M12 7v5l3.5 2" stroke="${accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
       </svg>`;

  const htmlContent = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; background:#f4f4f7; padding: 24px 0;">
    <div style="background:#ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 32px 24px; text-align:center;">
        <div style="display:inline-block; border:1px solid rgba(255,255,255,0.6); border-radius:6px; padding:6px 16px;">
          <span style="color:#ffffff; font-weight:700; font-size:15px; letter-spacing:2px;">PATH</span>
        </div>
        <p style="color:#e9d5ff; font-size:14px; margin:12px 0 0;">SLA Configuration</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 28px;">
        <div style="width:56px; height:56px; border-radius:50%; background:${iconBg}; display:flex; align-items:center; justify-content:center; margin: 0 auto 20px;">
          ${iconSvg}
        </div>

        <h1 style="text-align:center; font-size:20px; color:#111827; margin: 0 0 8px;">
          SLA ${badgeLabel}
        </h1>
        <p style="text-align:center; font-size:14px; color:#6b7280; margin: 0 0 24px;">
          ${title}
        </p>

        <div style="background:${accentBg}; border-left: 4px solid ${accentColor}; border-radius: 6px; padding: 14px 18px;">
          <p style="margin:0; font-size:13px; color:#374151; line-height:1.6;">${message}</p>
        </div>

        <div style="background:#f9fafb; border-radius:8px; padding:16px 18px; margin-top:20px;">
          <p style="margin:0; font-size:13px; color:#4b5563; line-height:1.5;">
            <strong>Next step:</strong> Please review this task in PATH and update its status before the deadline passes.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:16px 24px; text-align:center; border-top:1px solid #f0f0f0;">
        <p style="font-size:11px; color:#9ca3af; margin:0;">
          © ${new Date().getFullYear()} PATH App · This is an automated message, please do not reply.
        </p>
      </div>
    </div>
  </div>
  `;

  return sendTransactionalEmail({ toList: recipientEmails, subject, htmlContent });
}

module.exports = { sendTransactionalEmail, sendSlaAlertEmail };