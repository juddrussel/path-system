// middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// Store for tracking suspicious IPs
const suspiciousIPs = new Map();

// Helper to log rate limit violations
function logRateLimitViolation(req, type) {
  const ip = req.ip || req.connection.remoteAddress;
  console.warn(`[SECURITY] Rate limit exceeded: ${type} | IP: ${ip} | Path: ${req.path}`);
  
  // Track suspicious behavior
  const count = suspiciousIPs.get(ip) || 0;
  suspiciousIPs.set(ip, count + 1);
  
  // Clear old entries every hour
  if (suspiciousIPs.size > 1000) {
    const sortedIPs = Array.from(suspiciousIPs.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);
    suspiciousIPs.clear();
    sortedIPs.forEach(([ip, count]) => suspiciousIPs.set(ip, count));
  }
}

// Standard handler for rate limit exceeded
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    message: "Too many requests. Please try again later.",
    retryAfter: res.getHeader("Retry-After")
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// STRICT LIMITERS - Authentication & sensitive operations
// ═══════════════════════════════════════════════════════════════════════════

// Login attempts: Very strict to prevent brute force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  handler: (req, res) => {
    logRateLimitViolation(req, "LOGIN");
    rateLimitHandler(req, res);
  },
  // Skip successful requests (only count failed attempts)
  skip: (req, res) => res.statusCode < 400,
});

// Register: Prevent automated account creation
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again later." },
  handler: (req, res) => {
    logRateLimitViolation(req, "REGISTER");
    rateLimitHandler(req, res);
  },
});

// Password reset: Prevent abuse
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset attempts. Please try again in 1 hour." },
  handler: (req, res) => {
    logRateLimitViolation(req, "PASSWORD_RESET");
    rateLimitHandler(req, res);
  },
});

// File upload: Prevent abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many file uploads. Please slow down." },
  handler: (req, res) => {
    logRateLimitViolation(req, "UPLOAD");
    rateLimitHandler(req, res);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// MODERATE LIMITERS - General API usage
// ═══════════════════════════════════════════════════════════════════════════

// Standard API limiter: Reasonable limits for authenticated API calls
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  handler: (req, res) => {
    logRateLimitViolation(req, "API");
    rateLimitHandler(req, res);
  },
});

// Read-only endpoints: More generous for GET requests
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  handler: (req, res) => {
    logRateLimitViolation(req, "READ");
    rateLimitHandler(req, res);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL LIMITER - Catch-all for all endpoints
// ═══════════════════════════════════════════════════════════════════════════

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes globally
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP. Please try again later." },
  handler: (req, res) => {
    logRateLimitViolation(req, "GLOBAL");
    rateLimitHandler(req, res);
  },
});

// Export function to get suspicious IPs (for monitoring)
function getSuspiciousIPs() {
  return Array.from(suspiciousIPs.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
}

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
  apiLimiter,
  readLimiter,
  globalLimiter,
  getSuspiciousIPs,
};
