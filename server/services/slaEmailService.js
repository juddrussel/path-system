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
 * Styled to match the PATH card-based SLA mockup: shield header, status
 * badge + task card with progress bar, primary CTA button, and standard footer.
 *
 * @param {Object} params
 * @param {string[]} params.recipientEmails - resolved email addresses
 * @param {"critical"|"warning"} params.tier
 * @param {string} params.title - task title, e.g. "Email Test"
 * @param {string} params.taskId - short ID shown top-right of the card, e.g. "TS-99341"
 * @param {string} params.documentType - e.g. "Masterlist of Section"
 * @param {string} params.deadlineText - pre-formatted deadline string, e.g. "Wednesday, July 29, 2026 at 12:00 AM UTC"
 * @param {number} params.percentElapsed - 0-100, how much of the SLA window has elapsed
 * @param {string} params.timeRemainingText - e.g. "80% Time Remaining (Approx. 4 days)"
 * @param {string} params.taskUrl - deep link to the task
 * @param {string} [params.allTasksUrl] - link to the user's assigned tasks list
 */
async function sendSlaAlertEmail({
  recipientEmails,
  tier,
  title,
  taskId,
  documentType,
  deadlineText,
  percentElapsed,
  timeRemainingText,
  taskUrl,
  allTasksUrl,
}) {
  const isCritical = tier === "critical";
  const accentColor = isCritical ? "#dc2626" : "#d97706";
  const accentColorLight = isCritical ? "#ef4444" : "#f59e0b";
  const iconBg = isCritical ? "#fee2e2" : "#fef3c7";
  const badgeLabel = isCritical ? "CRITICAL" : "WARNING";
  const statusLabel = isCritical ? "Overdue" : "Due Soon";
  const subject = `[SLA ${badgeLabel}] ${title}`;
  const elapsed = Math.max(0, Math.min(100, percentElapsed ?? 0));

  const htmlContent = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; background:#f4f4f6;">

    <!-- Header -->
    <div style="background:#7c3aed; padding: 28px 24px; text-align:center;">
      <div style="width:44px; height:44px; background:rgba(255,255,255,0.15); border-radius:10px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2 4 5v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3Z" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <p style="color:#ffffff; font-weight:700; font-size:15px; letter-spacing:1.5px; margin:0;">PATH</p>
      <p style="color:#ddd6fe; font-size:12px; margin:2px 0 0;">SLA Configuration</p>
    </div>

    <!-- Intro -->
    <div style="background:#f4f4f6; padding: 28px 24px 8px; text-align:center;">
      <div style="width:52px; height:52px; border-radius:50%; background:${iconBg}; display:flex; align-items:center; justify-content:center; margin: 0 auto 14px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                stroke="${accentColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 style="font-size:19px; color:#111827; letter-spacing:0.5px; margin: 0 0 8px;">SLA ${badgeLabel}</h1>
      <p style="font-size:13px; color:#6b7280; line-height:1.6; margin: 0 auto 24px; max-width:340px;">
        A task assigned to you in the <strong style="color:#374151;">PATH</strong> system is approaching its Service Level Agreement (SLA) deadline.
      </p>
    </div>

    <!-- Task card -->
    <div style="padding: 0 24px;">
      <div style="background:#ffffff; border-radius:10px; border-left:4px solid ${accentColorLight}; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:20px 22px;">

        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span style="font-size:11px; font-weight:700; color:${accentColor}; text-transform:uppercase; letter-spacing:0.5px;">${statusLabel}</span>
          <span style="font-size:11px; color:#9ca3af;">ID: ${taskId || "—"}</span>
        </div>
        <p style="font-size:17px; font-weight:700; color:#111827; margin: 4px 0 16px;">${title}</p>

        <table role="presentation" width="100%" style="border-collapse:collapse; font-size:13px;">
          <tr>
            <td style="padding:8px 0; border-top:1px solid #f0f0f0; color:#9ca3af; width:130px; vertical-align:top;">DOCUMENT TYPE</td>
            <td style="padding:8px 0; border-top:1px solid #f0f0f0; color:#374151; font-weight:600;">${documentType || "—"}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; border-top:1px solid #f0f0f0; color:#9ca3af; vertical-align:top;">DEADLINE</td>
            <td style="padding:8px 0; border-top:1px solid #f0f0f0; color:#374151; font-weight:600;">${deadlineText || "—"}</td>
          </tr>
        </table>

        <div style="margin-top:14px;">
          <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
            <span style="color:#6b7280;">SLA Timeline</span>
            <span style="color:${accentColor}; font-weight:600;">${elapsed}% Elapsed</span>
          </div>
          <div style="background:#e5e7eb; border-radius:6px; height:6px; overflow:hidden;">
            <div style="background:#7c3aed; height:6px; width:${elapsed}%;"></div>
          </div>
          <p style="text-align:center; font-size:12px; color:#6b7280; margin:10px 0 0;">${timeRemainingText || ""}</p>
        </div>

        <div style="background:#f9fafb; border-radius:8px; padding:12px 14px; margin-top:16px; display:flex; gap:10px; align-items:flex-start;">
          <span style="color:#7c3aed; font-size:14px; line-height:1;">&#9432;</span>
          <p style="margin:0; font-size:12.5px; color:#4b5563; line-height:1.5;">
            <strong style="color:#374151;">Next step:</strong> Please review this task in PATH and update its status before the deadline passes to maintain compliance.
          </p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    ${
      taskUrl
        ? `<div style="text-align:center; padding: 24px 24px 8px;">
            <a href="${taskUrl}" style="background:#7c3aed; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:13px 28px; border-radius:8px; display:inline-block;">
              Review Task in PATH &nbsp;→
            </a>
            <p style="font-size:11px; color:#9ca3af; margin:16px 0 4px;">Can't access the button? Copy and paste this link:</p>
            <a href="${taskUrl}" style="font-size:11px; color:#7c3aed; word-break:break-all;">${taskUrl}</a>
          </div>`
        : ""
    }
    ${
      allTasksUrl
        ? `<div style="text-align:center; padding: 8px 24px 24px; border-bottom:1px solid #e5e7eb;">
            <a href="${allTasksUrl}" style="font-size:12px; color:#6b7280; text-decoration:none;">&#8599; View All Assigned Tasks</a>
          </div>`
        : ""
    }

    <!-- Footer -->
    <div style="padding: 24px; text-align:center;">
      <p style="font-size:11px; color:#9ca3af; margin:0 0 4px; line-height:1.6;">
        This is an automated message sent by the <strong>PATH</strong> application. Please do not reply directly to this email.
      </p>
      <p style="font-size:11px; color:#c1c5cc; margin:8px 0;">© ${new Date().getFullYear()} PATH App. All rights reserved.</p>
      <p style="font-size:11px; margin:8px 0 0;">
        <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 6px;">Privacy Policy</a>
        <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 6px;">Terms of Service</a>
        <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 6px;">Unsubscribe</a>
      </p>
    </div>
  </div>
  `;

  return sendTransactionalEmail({ toList: recipientEmails, subject, htmlContent });
}

module.exports = { sendTransactionalEmail, sendSlaAlertEmail };