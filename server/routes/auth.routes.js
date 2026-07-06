// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const db = require("../config/db");
const { writeLog } = require("./audit.routes");

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { full_name, email, phone, department, username, password, confirm_password } = req.body;

  if (!full_name || !email || !department || !username || !password || !confirm_password) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Username or email already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (full_name, email, phone, department, username, password, role, status, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'faculty', 'pending', 0, NOW())`,
      [full_name, email, phone || null, department, username, hashedPassword]
    );

    await writeLog({
      userId:    null,
      action:    "REGISTER",
      detail:    `New account registered: ${username} (${department}) — awaiting approval`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ message: "Account created successfully. Awaiting admin approval." });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = rows[0];

    if (user.status === "pending") {
      return res.status(403).json({ message: "Your account is pending admin approval." });
    }
    if (user.status === "rejected") {
      return res.status(403).json({ message: "Your account registration was rejected. Please contact the administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await writeLog({
      userId:    user.id,
      action:    "LOGIN",
      detail:    `${user.username} (${user.role}) logged in successfully`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        department: user.department,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── VERIFY RESET TOKEN ───────────────────────────────────────────────────────
router.get("/verify-reset-token", async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).json({ message: "Token is required." });

  try {
    const [rows] = await db.query(
      "SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    return res.status(200).json({ message: "Token is valid." });
  } catch (err) {
    console.error("Verify reset token error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    // Always return success to prevent email enumeration
    if (rows.length === 0) {
      return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token directly to users table
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [token, expiresAt, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: `PATH App <onboarding@resend.dev>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
          <body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:36px 40px;text-align:center;">
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                          <tr>
                            <td style="background:rgba(255,255,255,0.15);border:2px solid rgba(255,255,255,0.6);border-radius:8px;padding:6px 10px;">
                              <span style="color:#ffffff;font-size:15px;font-weight:800;letter-spacing:3px;">PATH</span>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;">Account Recovery</p>
                      </td>
                    </tr>

                    <!-- Icon + Heading -->
                    <tr>
                      <td align="center" style="padding:36px 40px 0;">
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                          <tr>
                            <td align="center" valign="middle" style="width:64px;height:64px;background:#ede9fe;border-radius:16px;text-align:center;">
                              <img src="https://fonts.gstatic.com/s/i/materialicons/lock/v17/24px.svg" width="32" height="32" alt="lock" style="display:block;margin:16px auto;filter:invert(27%) sepia(90%) saturate(1200%) hue-rotate(245deg) brightness(85%);" />
                            </td>
                          </tr>
                        </table>
                        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Password Reset Request</h1>
                        <p style="margin:0;font-size:14px;color:#6b7280;">Hi <strong style="color:#111827;">${user.full_name}</strong>, we received a request to reset your password.</p>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding:28px 40px;">
                        <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
                          Click the button below to create a new password. This link is valid for <strong>1 hour</strong> and can only be used once.
                        </p>

                        <!-- CTA Button -->
                        <table cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center">
                              <a href="${resetLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.3px;">
                                Reset My Password
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- Fallback link -->
                        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
                          Button not working? Copy and paste this link into your browser:
                        </p>
                        <p style="margin:6px 0 0;font-size:11px;color:#7c3aed;word-break:break-all;text-align:center;">
                          ${resetLink}
                        </p>
                      </td>
                    </tr>

                    <!-- Warning -->
                    <tr>
                      <td style="padding:0 40px 32px;">
                        <table cellpadding="0" cellspacing="0" width="100%" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;">
                          <tr>
                            <td style="padding:14px 18px;">
                              <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6;">
                                <strong style="color:#374151;">Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#9ca3af;">
                          &copy; ${new Date().getFullYear()} PATH App &middot; This is an automated message, please do not reply.
                        </p>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    await writeLog({
      userId:    user.id,
      action:    "FORGOT_PASSWORD",
      detail:    `Password reset requested for ${user.email}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({ message: "If that email is registered, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and new password are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    // Look up token directly from users table
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }

    const user = rows[0];
    const hashed = await bcrypt.hash(password, 10);

    // Update password and clear the token
    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashed, user.id]
    );

    await writeLog({
      userId:    user.id,
      action:    "RESET_PASSWORD",
      detail:    "Password was successfully reset",
      ipAddress: req.ip,
    });

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;