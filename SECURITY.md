# 🔒 DS PATH System - Security Documentation

## Overview

This document outlines the comprehensive security measures implemented in the DS PATH system to protect against common web vulnerabilities and attacks.

---

## 🛡️ Security Features

### 1. **HTTP Security Headers (Helmet.js)**

Automatic security headers are applied to all responses:

- **Content-Security-Policy (CSP)**: Prevents XSS attacks by controlling resource loading
- **Strict-Transport-Security (HSTS)**: Forces HTTPS connections for 1 year
- **X-Frame-Options**: Prevents clickjacking by disabling iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-XSS-Protection**: Enables browser XSS filtering

**Configuration**: `server/index.js` (Helmet middleware)

---

### 2. **Rate Limiting**

Protects against brute force attacks and API abuse with tiered rate limits:

| Endpoint Type | Limit | Window | Purpose |
|--------------|-------|--------|---------|
| **Login** | 5 requests | 15 minutes | Prevent brute force attacks |
| **Register** | 3 requests | 1 hour | Prevent automated account creation |
| **Password Reset** | 3 requests | 1 hour | Prevent abuse of reset feature |
| **File Upload** | 30 requests | 15 minutes | Prevent storage abuse |
| **API Calls** | 100 requests | 15 minutes | Standard API rate limiting |
| **Global** | 300 requests | 15 minutes | Catch-all limiter |

**Features**:
- Automatic suspicious IP tracking
- Security event logging for rate limit violations
- Standard `Retry-After` headers

**Configuration**: `server/middleware/rateLimiter.js`

---

### 3. **SQL Injection Protection**

Multi-layered defense against SQL injection attacks:

#### Detection Patterns:
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, DROP, UNION, etc.)
- Dangerous operators (`;`, `--`, `/*`, `*/`)
- Common injection patterns (`' OR 1=1--`, `UNION SELECT`, etc.)
- URL-encoded injection attempts (`%27`, `%22`, `%3B`)
- Multiple suspicious keywords in a single request

#### Protected Areas:
- Query parameters (`req.query`)
- Request body (`req.body`)
- URL parameters (`req.params`)
- Object keys (prevents injection in field names)

**Response**: 400 Bad Request with sanitized error message (doesn't expose detection logic)

**Configuration**: `server/middleware/security.js`

---

### 4. **Cross-Origin Resource Sharing (CORS)**

Production-grade CORS configuration with origin whitelisting:

#### Features:
- Environment-based origin whitelist (via `CORS_ORIGIN` env variable)
- Comma-separated origin support for multiple domains
- Credentials support for authenticated requests
- Method and header restrictions
- Blocks unauthorized origins with security logging

#### Configuration:
```env
# Single origin
CORS_ORIGIN=https://yourdomain.com

# Multiple origins
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Development (allow all)
CORS_ORIGIN=*
```

**Configuration**: `server/index.js` (CORS middleware)

---

### 5. **Authentication Security**

#### JWT Token Security:
- **8-hour token expiration** (configurable)
- **Strong secret key** required via `JWT_SECRET` environment variable
- **Bearer token format** enforced
- **No dev token bypass** (removed for production security)

#### Auth Middleware:
- `requireAuth()`: Validates JWT on all protected routes
- `requireAdmin()`: Admin-only access
- `requireRole(...roles)`: Multi-role authorization

#### Security Logging:
- All unauthorized access attempts logged
- Invalid/expired token attempts logged with IP and path

**Configuration**: `server/middleware/auth.js`

---

### 6. **Input Validation & Sanitization**

#### NoSQL/SQL Injection Protection:
- `express-mongo-sanitize`: Removes `$` and `.` from user input
- Custom SQL injection detection middleware

#### HTTP Parameter Pollution (HPP) Protection:
- Detects duplicate query parameters
- Takes first value, logs suspicious activity

#### XSS Protection:
- HTML entity encoding for user input
- Recursive object sanitization
- Sanitizes both values and keys

**Configuration**: `server/middleware/security.js`

---

### 7. **Request Size Limits**

Prevents DoS attacks via payload bombs:

- **JSON body limit**: 10MB
- **URL-encoded body limit**: 10MB
- **Content-Length validation**: Blocks requests exceeding 10MB
- **Response**: 413 Payload Too Large

**Configuration**: `server/index.js` (body parsing middleware)

---

### 8. **Security Logging & Monitoring**

Comprehensive logging system for security events:

#### Log Types:

1. **Access Log** (`logs/access.log`):
   - All API requests (method, path, IP, user ID)
   - Excludes health checks and static files

2. **Security Log** (`logs/security.log`):
   - Authentication failures (401, 403)
   - Rate limit violations
   - SQL injection attempts
   - CORS violations
   - Suspicious activity patterns

#### Features:
- **Automatic log rotation**: Daily or at 10MB file size
- **Sensitive data redaction**: Passwords, tokens automatically redacted
- **Suspicious IP tracking**: Alerts after 10 failed attempts
- **Archived logs**: Timestamped for forensics

**Configuration**: `server/middleware/securityLogger.js`

---

## 🔧 Environment Configuration

Required environment variables for security features:

```env
# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=your-super-secure-random-string-here

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Optional: Database credentials (use strong passwords)
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=strong_database_password
DB_NAME=path_system

# Optional: Email service (for password resets)
BREVO_API_KEY=your-brevo-api-key
BREVO_FROM=noreply@yourdomain.com

# Optional: OAuth (optional security enhancement)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Optional: reCAPTCHA (prevents bot registrations)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Generate strong `JWT_SECRET` (64+ character random string)
- [ ] Set `CORS_ORIGIN` to your frontend domain(s)
- [ ] Ensure database uses strong passwords
- [ ] Enable HTTPS/SSL on your hosting platform
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall rules (allow only 80, 443)
- [ ] Set up database backups
- [ ] Review logs directory permissions
- [ ] Test rate limiting behavior
- [ ] Verify CORS policy with frontend

---

## 🔍 Security Monitoring

### Viewing Security Logs:

```bash
# View recent security events
tail -f server/logs/security.log

# View recent access logs
tail -f server/logs/access.log

# Search for SQL injection attempts
grep "SQL injection" server/logs/security.log

# Search for rate limit violations
grep "Rate limit exceeded" server/logs/security.log

# Find suspicious IPs
grep "SUSPICIOUS_ACTIVITY" server/logs/security.log
```

### Monitoring Suspicious IPs:

The system automatically tracks IPs with repeated failures. Check the logs for:
- Multiple failed login attempts
- Rate limit violations
- SQL injection attempts
- CORS violations

---

## 🐛 Common Issues & Solutions

### Issue: Rate limit triggering too aggressively

**Solution**: Adjust limits in `server/middleware/rateLimiter.js`:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increase from 5 to 10
  // ...
});
```

### Issue: CORS blocking legitimate requests

**Solution**: Add your domain to `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Issue: SQL injection protection blocking valid input

**Solution**: The detection is aggressive by design. If false positives occur:
1. Review the logged pattern in `security.log`
2. Adjust detection patterns in `server/middleware/security.js`
3. Consider whitelisting specific patterns for your use case

### Issue: Large file uploads failing

**Solution**: Increase size limit in `server/index.js`:
```javascript
app.use(validateRequestSize(50 * 1024 * 1024)); // 50MB
```

---

## 📊 Security Best Practices

1. **Regularly rotate JWT_SECRET** (every 90 days recommended)
2. **Monitor security logs daily** for suspicious patterns
3. **Keep dependencies updated**: Run `npm audit` regularly
4. **Use HTTPS in production** (free with Let's Encrypt)
5. **Enable database encryption** at rest and in transit
6. **Implement backup strategy** (daily automated backups)
7. **Regular penetration testing** (annual recommended)
8. **Train users** on password security and phishing

---

## 🔐 Password Security

The system uses:
- **bcrypt** with 10 salt rounds for password hashing
- **Minimum 8 characters** password requirement
- **Password reset tokens** valid for 1 hour only
- **Single-use tokens** (automatically deleted after use)

---

## 📝 Security Incident Response

If you detect a security incident:

1. **Isolate**: Block the attacking IP at firewall level
2. **Investigate**: Check `logs/security.log` for full attack pattern
3. **Patch**: Apply security updates if vulnerability found
4. **Notify**: Inform affected users if data breach occurred
5. **Document**: Record incident details and response actions
6. **Review**: Update security policies based on lessons learned

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

## 📞 Security Contact

For security vulnerabilities, please contact your system administrator or security team directly. Do not open public issues for security concerns.

---

**Last Updated**: December 2024  
**Maintained By**: DS PATH Development Team
