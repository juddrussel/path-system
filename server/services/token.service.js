const db = require("../config/db");

/**
 * Token Validation Service
 * 
 * Provides server-side validation for password reset tokens.
 * This is used by SSR to pre-validate tokens before rendering,
 * eliminating the client-side loading flash.
 */

/**
 * Validate a password reset token
 * 
 * @param {string} token - The reset token to validate
 * @returns {Promise<boolean>} - true if token is valid and not expired, false otherwise
 */
async function validateResetToken(token) {
  if (!token || typeof token !== "string") {
    return false;
  }

  try {
    // Query the users table for the reset token
    // Token is valid if:
    // 1. It exists in the database (reset_token column)
    // 2. It hasn't expired (reset_token_expires > NOW())
    const [rows] = await db.query(
      `SELECT id, email 
       FROM users 
       WHERE reset_token = ? 
       AND reset_token_expires > NOW()
       LIMIT 1`,
      [token]
    );

    // If we found a row, the token is valid
    return rows.length > 0;
  } catch (error) {
    console.error("[TokenService] Error validating reset token:", error.message);
    // On database error, return false (fail closed for security)
    return false;
  }
}

/**
 * Get token information (for debugging/logging)
 * 
 * @param {string} token - The reset token
 * @returns {Promise<object|null>} - Token info or null if not found
 */
async function getTokenInfo(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        id,
        email,
        full_name,
        reset_token_expires
       FROM users
       WHERE reset_token = ?
       LIMIT 1`,
      [token]
    );

    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error("[TokenService] Error getting token info:", error.message);
    return null;
  }
}

module.exports = {
  validateResetToken,
  getTokenInfo,
};
