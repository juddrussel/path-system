// middleware/auth.js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  try {
    req.user = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

/**
 * requireRole(...roles)
 * Middleware factory — restricts access to one or more role strings.
 *
 * Usage:
 *   router.use(requireAuth, requireRole("admin", "Program Chair"));
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access forbidden. Required role(s): ${roles.join(", ")}.`,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireAdmin, requireRole };