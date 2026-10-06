// middleware/securityLogger.js
const fs = require("fs");
const path = require("path");

// Ensure logs directory exists (with error handling for read-only filesystems)
const LOG_DIR = path.join(__dirname, "../logs");
let LOG_ENABLED = true;
try {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  // Test write access
  const testFile = path.join(LOG_DIR, ".write-test");
  fs.writeFileSync(testFile, "test");
  fs.unlinkSync(testFile);
} catch (err) {
  console.warn("[SECURITY] Cannot write to logs directory, logging disabled:", err.message);
  LOG_ENABLED = false;
}

const SECURITY_LOG_FILE = path.join(LOG_DIR, "security.log");
const ACCESS_LOG_FILE = path.join(LOG_DIR, "access.log");

// ═══════════════════════════════════════════════════════════════════════════
// LOG FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function writeLog(file, message) {
  if (!LOG_ENABLED) return; // Skip if logging is disabled
  
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(file, logEntry);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

function logSecurityEvent(type, details) {
  const message = `${type} | ${JSON.stringify(details)}`;
  writeLog(SECURITY_LOG_FILE, message);
  console.warn(`[SECURITY] ${message}`);
}

function logAccessEvent(req) {
  const details = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    userId: req.user?.id,
    username: req.user?.username,
  };
  const message = `ACCESS | ${JSON.stringify(details)}`;
  writeLog(ACCESS_LOG_FILE, message);
}

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════

// Log all requests to sensitive endpoints
function securityAuditLogger(req, res, next) {
  // Sensitive endpoints to monitor
  const sensitivePatterns = [
    /\/api\/auth\/login/,
    /\/api\/auth\/register/,
    /\/api\/auth\/reset-password/,
    /\/api\/users\/\d+\/avatar/,
    /\/api\/admin/,
    /\/api\/audit/,
  ];

  const isSensitive = sensitivePatterns.some(pattern => pattern.test(req.path));

  if (isSensitive) {
    logSecurityEvent("SENSITIVE_ACCESS", {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.id,
      body: sanitizeBody(req.body),
    });
  }

  // Log failed authentication attempts
  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent("AUTH_FAILURE", {
        status: res.statusCode,
        path: req.path,
        ip: req.ip,
        userId: req.user?.id,
      });
    }
    originalJson.call(this, data);
  };

  next();
}

// Sanitize request body for logging (remove sensitive fields)
function sanitizeBody(body) {
  if (!body || typeof body !== "object") return body;
  
  const sensitiveFields = ["password", "confirm_password", "token", "captchaToken"];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });
  
  return sanitized;
}

// Log all access to API endpoints
function accessLogger(req, res, next) {
  // Skip health checks and static files
  if (req.path === "/api/health" || req.path.startsWith("/uploads/")) {
    return next();
  }

  logAccessEvent(req);
  next();
}

// Monitor suspicious activity
const suspiciousActivity = new Map(); // IP -> count

function suspiciousActivityMonitor(req, res, next) {
  const ip = req.ip;
  
  // Track failed auth attempts
  const originalJson = res.json;
  res.json = function (data) {
    if (res.statusCode === 401 || res.statusCode === 403 || res.statusCode === 429) {
      const count = (suspiciousActivity.get(ip) || 0) + 1;
      suspiciousActivity.set(ip, count);
      
      // Alert on multiple failures
      if (count >= 10) {
        logSecurityEvent("SUSPICIOUS_ACTIVITY", {
          ip,
          failureCount: count,
          lastPath: req.path,
          userAgent: req.headers["user-agent"],
        });
        
        // Reset count after alert
        if (count >= 20) {
          suspiciousActivity.delete(ip);
        }
      }
    }
    originalJson.call(this, data);
  };
  
  next();
}

// Clean up old entries periodically (every 30 minutes)
setInterval(() => {
  if (suspiciousActivity.size > 500) {
    const sortedEntries = Array.from(suspiciousActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 100);
    suspiciousActivity.clear();
    sortedEntries.forEach(([ip, count]) => suspiciousActivity.set(ip, count));
  }
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════
// LOG ROTATION
// ═══════════════════════════════════════════════════════════════════════════

function rotateLogs() {
  if (!LOG_ENABLED) return; // Skip if logging is disabled
  
  const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB
  
  [SECURITY_LOG_FILE, ACCESS_LOG_FILE].forEach(logFile => {
    try {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        
        if (stats.size > MAX_LOG_SIZE) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const archiveFile = logFile.replace(".log", `.${timestamp}.log`);
          fs.renameSync(logFile, archiveFile);
          console.log(`[SECURITY] Log rotated: ${path.basename(logFile)} -> ${path.basename(archiveFile)}`);
        }
      }
    } catch (err) {
      console.error(`Failed to rotate log ${logFile}:`, err);
    }
  });
}

// Rotate logs daily at midnight
const now = new Date();
const midnight = new Date(now);
midnight.setHours(24, 0, 0, 0);
const msUntilMidnight = midnight - now;

setTimeout(() => {
  rotateLogs();
  setInterval(rotateLogs, 24 * 60 * 60 * 1000); // Daily
}, msUntilMidnight);

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  securityAuditLogger,
  accessLogger,
  suspiciousActivityMonitor,
  logSecurityEvent,
  rotateLogs,
};
