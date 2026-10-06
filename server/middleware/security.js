// middleware/security.js
const mongoSanitize = require("express-mongo-sanitize");

// ═══════════════════════════════════════════════════════════════════════════
// SQL INJECTION PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

// Common SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|UNION|CONCAT|DECLARE)\b)/i,
  /(;|\-\-|\/\*|\*\/|xp_|sp_)/i,
  /('|(\\')|(\")|(\\\")|(;)|(<)|(>)|(\+)|(%27)|(%22)|(%3C)|(%3E)|(%00))/i,
  /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
  /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
  /((\%27)|(\'))union/i,
  /exec(\s|\+)+(s|x)p\w+/i,
];

// Suspicious keywords that might indicate SQL injection
const SUSPICIOUS_KEYWORDS = [
  "union", "select", "insert", "update", "delete", "drop", "create", "alter",
  "exec", "execute", "script", "javascript", "concat", "char", "declare",
  "cast", "convert", "benchmark", "sleep", "waitfor", "delay",
  "information_schema", "mysql.user", "pg_sleep", "load_file", "outfile",
  "into dumpfile", "into outfile", "xp_cmdshell", "sp_executesql"
];

// Check if string contains SQL injection patterns
function containsSQLInjection(value) {
  if (typeof value !== "string") return false;
  
  const lowerValue = value.toLowerCase();
  
  // Check against regex patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  
  // Check for multiple suspicious keywords
  const foundKeywords = SUSPICIOUS_KEYWORDS.filter(keyword => 
    lowerValue.includes(keyword)
  );
  
  // If 2+ suspicious keywords found, likely SQL injection
  if (foundKeywords.length >= 2) {
    return true;
  }
  
  // Check for encoded SQL injection attempts
  if (value.includes("%27") || value.includes("%22") || value.includes("%3B")) {
    return true;
  }
  
  return false;
}

// Recursively scan object for SQL injection attempts
function scanForSQLInjection(obj, path = "") {
  if (obj === null || obj === undefined) return null;
  
  if (typeof obj === "string") {
    if (containsSQLInjection(obj)) {
      return path || "string value";
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = scanForSQLInjection(obj[i], `${path}[${i}]`);
      if (result) return result;
    }
  } else if (typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      // Also check the key itself
      if (containsSQLInjection(key)) {
        return `${path}.${key} (key)`;
      }
      const result = scanForSQLInjection(value, path ? `${path}.${key}` : key);
      if (result) return result;
    }
  }
  
  return null;
}

// Middleware to detect and block SQL injection attempts
function sqlInjectionProtection(req, res, next) {
  try {
    // Skip health check endpoint
    if (req.path === "/api/health") {
      return next();
    }

    // Check query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      const suspiciousField = scanForSQLInjection(req.query, "query");
      if (suspiciousField) {
        console.error(`[SECURITY] SQL injection attempt detected in ${suspiciousField} | IP: ${req.ip} | Path: ${req.path}`);
        return res.status(400).json({ 
          message: "Invalid request parameters detected.",
          field: suspiciousField.split(".")[0] // Don't expose full path
        });
      }
    }
    
    // Check request body
    if (req.body && Object.keys(req.body).length > 0) {
      const suspiciousField = scanForSQLInjection(req.body, "body");
      if (suspiciousField) {
        console.error(`[SECURITY] SQL injection attempt detected in ${suspiciousField} | IP: ${req.ip} | Path: ${req.path}`);
        return res.status(400).json({ 
          message: "Invalid request data detected.",
          field: suspiciousField.split(".")[1] || suspiciousField // Remove 'body.' prefix
        });
      }
    }
    
    // Check URL parameters
    if (req.params && Object.keys(req.params).length > 0) {
      const suspiciousField = scanForSQLInjection(req.params, "params");
      if (suspiciousField) {
        console.error(`[SECURITY] SQL injection attempt detected in ${suspiciousField} | IP: ${req.ip} | Path: ${req.path}`);
        return res.status(400).json({ 
          message: "Invalid URL parameters detected.",
          field: suspiciousField.split(".")[1] || suspiciousField
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("[SECURITY] Error in SQL injection protection middleware:", error);
    // Don't block request on middleware error
    next();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// XSS PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

// Sanitize string to prevent XSS
function sanitizeXSS(value) {
  if (typeof value !== "string") return value;
  
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Recursively sanitize object
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === "string") {
    return sanitizeXSS(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  } else if (typeof obj === "object") {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// ═══════════════════════════════════════════════════════════════════════════
// HTTP PARAMETER POLLUTION PROTECTION
// ═══════════════════════════════════════════════════════════════════════════

// Detect duplicate parameters (HPP attack)
function hppProtection(req, res, next) {
  // Check for duplicate query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (Array.isArray(value)) {
        console.warn(`[SECURITY] HTTP Parameter Pollution detected: ${key} | IP: ${req.ip} | Path: ${req.path}`);
        // Take only the first value
        req.query[key] = value[0];
      }
    }
  }
  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST SIZE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

// Prevent extremely large requests (DoS protection)
function validateRequestSize(maxSize = 10 * 1024 * 1024) { // 10MB default
  return (req, res, next) => {
    const contentLength = parseInt(req.headers["content-length"] || "0");
    
    if (contentLength > maxSize) {
      console.error(`[SECURITY] Request too large: ${contentLength} bytes | IP: ${req.ip} | Path: ${req.path}`);
      return res.status(413).json({ 
        message: "Request entity too large.",
        maxSize: `${Math.round(maxSize / 1024 / 1024)}MB`
      });
    }
    
    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  sqlInjectionProtection,
  hppProtection,
  validateRequestSize,
  sanitizeObject,
  mongoSanitize: mongoSanitize(),
};
