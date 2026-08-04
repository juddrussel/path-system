// server/services/slaEmailService.js
//
// Self-contained Brevo (Sendinblue) transactional email sender.
// If you already have a shared Brevo utility elsewhere in /services or /utils,
// just replace the body of sendTransactionalEmail() with a call to that instead
// — everything that calls this file (slaController.js) doesn't need to change.

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Formats a raw timestamp (Date, ISO string, or epoch ms) into Philippine
 * Time (Asia/Manila, UTC+8), e.g. "Wednesday, July 29, 2026 at 5:00 PM PHT".
 * Returns null if the input can't be parsed, so callers can fall back to
 * whatever string they already have.
 */
function formatDeadlinePHT(deadlineAt) {
  if (!deadlineAt) return null;
  const date = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  if (Number.isNaN(date.getTime())) return null;

  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${formatted} PHT`;
}


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
 * Layout note: this template is built entirely with <table> elements instead
 * of flexbox/gap, and icons are plain HTML/CSS shapes instead of inline SVG.
 * Outlook desktop, and many mobile mail clients, silently drop flexbox and
 * inline SVG, and don't reliably stretch a `width:100%` table to fill its
 * container — that's what was causing the empty icon boxes and the
 * "DUE SOONID: TS-37" / "SLA Timeline100% Elapsed" text collisions (the two
 * cells in each of those rows were shrinking to content-width and sitting
 * flush against each other). Two-column rows now use explicit width="50%"
 * attributes on each <td>, which every mail client — including legacy
 * Outlook — respects, so the columns stay evenly split and never collide.
 *
 * @param {Object} params
 * @param {string[]} params.recipientEmails - resolved email addresses
 * @param {"critical"|"warning"} params.tier
 * @param {string} params.title - task title, e.g. "Email Test"
 * @param {string} params.taskId - short ID shown top-right of the card, e.g. "TS-99341"
 * @param {string} params.documentType - e.g. "Masterlist of Section"
 * @param {string} params.deadlineText - pre-formatted deadline string, used only if deadlineAt isn't provided, e.g. "Wednesday, July 29, 2026 at 12:00 AM UTC"
 * @param {Date|string|number} [params.deadlineAt] - raw deadline timestamp (Date, ISO string, or epoch ms). When provided, this is formatted into Philippine Time and takes priority over deadlineText.
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
  deadlineAt,
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
  const resolvedDeadlineText = formatDeadlinePHT(deadlineAt) || deadlineText;


  const htmlContent = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; background:#f4f4f6;">

    <!-- Header -->
    <table role="presentation" width="100%" style="background:#7c3aed;">
      <tr>
        <td align="center" style="padding: 32px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="44" height="44" align="center" valign="middle"
                  style="background:rgba(255,255,255,0.15); border-radius:10px; font-size:20px; font-weight:700; color:#ffffff; line-height:44px; text-align:center;">
                P
              </td>
            </tr>
          </table>
          <p style="color:#ffffff; font-weight:700; font-size:15px; letter-spacing:1.5px; margin:14px 0 0;">DS PATH</p>
          <p style="color:#ddd6fe; font-size:12px; margin:4px 0 0;">SLA Configuration</p>
        </td>
      </tr>
    </table>

    <!-- Intro -->
    <table role="presentation" width="100%" style="background:#f4f4f6;">
      <tr>
        <td align="center" style="padding: 32px 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td width="52" height="52" align="center" valign="middle"
                  style="background:${iconBg}; border-radius:50%; font-size:24px; font-weight:800; color:${accentColor}; line-height:52px; text-align:center;">
                !
              </td>
            </tr>
          </table>
          <h1 style="font-size:19px; color:#111827; letter-spacing:0.5px; margin: 18px 0 8px;">SLA ${badgeLabel}</h1>
          <p style="font-size:13px; color:#6b7280; line-height:1.6; margin: 0 auto 28px; max-width:340px;">
            A task assigned to you in the <strong style="color:#374151;">DS PATH</strong> system is approaching its Service Level Agreement (SLA) deadline.
          </p>
        </td>
      </tr>
    </table>

    <!-- Task card -->
    <table role="presentation" width="100%">
      <tr>
        <td style="padding: 0 24px;">
          <table role="presentation" width="100%" style="background:#ffffff; border-radius:10px; border-left:4px solid ${accentColorLight}; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:24px 26px;">

                <!-- status row -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
                  <tr>
                    <td width="50%" align="left" valign="middle" style="font-size:11px; font-weight:700; color:${accentColor}; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap;">
                      ${statusLabel}
                    </td>
                    <td width="50%" align="right" valign="middle" style="font-size:11px; color:#9ca3af; white-space:nowrap;">
                      ID: ${taskId || "—"}
                    </td>
                  </tr>
                </table>

                <p style="font-size:17px; font-weight:700; color:#111827; margin: 12px 0 18px; line-height:1.4;">${title}</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:13px;">
                  <tr>
                    <td style="padding:10px 0; border-top:1px solid #f0f0f0; color:#9ca3af; width:130px; vertical-align:top;">DOCUMENT TYPE</td>
                    <td style="padding:10px 0; border-top:1px solid #f0f0f0; color:#374151; font-weight:600;">${documentType || "—"}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0; border-top:1px solid #f0f0f0; color:#9ca3af; vertical-align:top;">DEADLINE</td>
                    <td style="padding:10px 0; border-top:1px solid #f0f0f0; color:#374151; font-weight:600;">${resolvedDeadlineText || "—"}</td>
                  </tr>
                </table>

                <!-- SLA timeline -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; margin-top:20px;">
                  <tr>
                    <td width="50%" align="left" valign="middle" style="font-size:12px; font-weight:600; color:#374151; padding-bottom:8px; white-space:nowrap;">SLA Timeline</td>
                    <td width="50%" align="right" valign="middle" style="font-size:12px; color:${accentColor}; font-weight:700; padding-bottom:8px; white-space:nowrap;">${elapsed}% Elapsed</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:2px 0;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; background:#e5e7eb; border-radius:6px;">
                        <tr>
                          <td style="background:#7c3aed; border-radius:6px; height:6px; width:${elapsed}%; font-size:0; line-height:6px;">&nbsp;</td>
                          <td style="height:6px; font-size:0; line-height:6px;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" align="center" style="font-size:12px; color:#6b7280; padding-top:12px;">
                      ${timeRemainingText || ""}
                    </td>
                  </tr>
                </table>

                <!-- next step callout -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; background:#f9fafb; border-radius:8px; margin-top:20px;">
                  <tr>
                    <td width="32" valign="top" align="center" style="padding:14px 0 14px 14px; color:#7c3aed; font-size:14px;">&#9432;</td>
                    <td valign="top" style="padding:14px 14px 14px 8px; font-size:12.5px; color:#4b5563; line-height:1.55;">
                      <strong style="color:#374151;">Next step:</strong> Please review this task in DS PATH and update its status before the deadline passes to maintain compliance.
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    ${
      taskUrl
        ? `<table role="presentation" width="100%">
            <tr>
              <td align="center" style="padding: 28px 24px 8px;">
                <a href="${taskUrl}" style="background:#7c3aed; color:#ffffff; text-decoration:none; font-size:14px; font-weight:600; padding:13px 28px; border-radius:8px; display:inline-block;">
                  Review Task in DS PATH &nbsp;→
                </a>
                <p style="font-size:11px; color:#9ca3af; margin:18px 0 4px;">Can't access the button? Copy and paste this link:</p>
                <a href="${taskUrl}" style="font-size:11px; color:#7c3aed; word-break:break-all;">${taskUrl}</a>
              </td>
            </tr>
          </table>`
        : ""
    }
    ${
      allTasksUrl
        ? `<table role="presentation" width="100%" style="border-bottom:1px solid #e5e7eb;">
            <tr>
              <td align="center" style="padding: 12px 24px 28px;">
                <a href="${allTasksUrl}" style="font-size:12px; color:#6b7280; text-decoration:none;">&#8599; View All Assigned Tasks</a>
              </td>
            </tr>
          </table>`
        : ""
    }

    <!-- Footer -->
    <table role="presentation" width="100%">
      <tr>
        <td align="center" style="padding: 28px 24px;">
          <p style="font-size:11px; color:#9ca3af; margin:0 0 10px; line-height:1.6; max-width:360px;">
            This is an automated message sent by the <strong>DS PATH</strong> application. Please do not reply directly to this email.
          </p>
          <p style="font-size:11px; color:#c1c5cc; margin:0 0 10px;">© ${new Date().getFullYear()} DS PATH App. All rights reserved.</p>
          <p style="font-size:11px; margin:0;">
            <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 8px;">Privacy Policy</a>
            <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 8px;">Terms of Service</a>
            <a href="#" style="color:#9ca3af; text-decoration:underline; margin:0 8px;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
  `;

  return sendTransactionalEmail({ toList: recipientEmails, subject, htmlContent });
}

module.exports = { sendTransactionalEmail, sendSlaAlertEmail, formatDeadlinePHT };