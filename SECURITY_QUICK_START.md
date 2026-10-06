# 🚀 Security Quick Start Guide

## 5-Minute Security Setup

### 1. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and add to `server/.env`:
```env
JWT_SECRET=<paste-generated-secret-here>
```

### 2. Configure CORS (Production Only)
In `server/.env`:
```env
# Replace with your actual frontend domain
CORS_ORIGIN=https://your-frontend-domain.com
```

### 3. Verify Security Packages Installed
```bash
cd server
npm install
```

### 4. Test Security Features

Start the server:
```bash
cd server
npm start
```

Test rate limiting (should block after 5 attempts):
```bash
# Try 6 login attempts rapidly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
```

Expected: Last request returns `429 Too Many Requests`

---

## 📊 Security Status Check

### Monitor Security Logs
```bash
# Real-time security events
tail -f server/logs/security.log

# Recent failed auth attempts
grep "AUTH_FAILURE" server/logs/security.log | tail -20

# SQL injection attempts
grep "SQL injection" server/logs/security.log

# Rate limit violations
grep "Rate limit exceeded" server/logs/security.log
```

---

## 🔧 Common Configurations

### Adjust Rate Limits
Edit `server/middleware/rateLimiter.js`:
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Change this number
  // ...
});
```

### Add CORS Origins
`server/.env`:
```env
# Single origin
CORS_ORIGIN=https://domain.com

# Multiple origins (comma-separated)
CORS_ORIGIN=https://domain1.com,https://domain2.com,https://app.domain.com
```

### Change Request Size Limit
Edit `server/index.js`:
```javascript
app.use(validateRequestSize(10 * 1024 * 1024)); // Change 10 to desired MB
```

---

## ✅ Production Deployment Checklist

Before going live:

- [ ] **JWT_SECRET** is set to 64+ character random string
- [ ] **CORS_ORIGIN** is set to your frontend domain (not `*`)
- [ ] **Database password** is strong and unique
- [ ] **HTTPS/SSL** is enabled on your hosting platform
- [ ] **NODE_ENV=production** is set
- [ ] **Security logs** directory exists and is writable
- [ ] **Backup strategy** is in place
- [ ] **Monitoring** is configured to alert on security events

---

## 🛡️ Active Security Features

| Feature | Status | Configuration |
|---------|--------|---------------|
| Rate Limiting | ✅ Active | `middleware/rateLimiter.js` |
| SQL Injection Protection | ✅ Active | `middleware/security.js` |
| XSS Protection | ✅ Active | Helmet + sanitization |
| CORS | ✅ Active | `index.js` (env-based) |
| Security Headers | ✅ Active | Helmet.js |
| Request Size Limits | ✅ Active | 10MB default |
| Security Logging | ✅ Active | `logs/` directory |
| JWT Authentication | ✅ Active | `middleware/auth.js` |

---

## 🚨 Emergency Response

### Someone is attacking the system:

1. **Block IP at firewall level** (if possible)
2. **Check logs**: `grep "<attacker-ip>" server/logs/security.log`
3. **Identify attack type**: SQL injection? Brute force? Rate limit bypass?
4. **Apply temporary fix**: Lower rate limits or add IP to blocklist
5. **Investigate thoroughly**: Review all affected endpoints
6. **Patch if needed**: Update vulnerable code
7. **Monitor**: Watch logs for similar patterns

### System compromised:

1. **Take site offline immediately**
2. **Change all secrets** (JWT_SECRET, database passwords, API keys)
3. **Review logs** for breach timeline
4. **Identify vulnerability** and patch it
5. **Notify affected users** if data was accessed
6. **Restore from clean backup** if needed
7. **Conduct security audit** before going live again

---

## 📞 Need Help?

- **Full Documentation**: See `SECURITY.md`
- **Security Issues**: Contact system administrator
- **False Positives**: Check `logs/security.log` for details

---

**Remember**: Security is an ongoing process, not a one-time setup. Monitor logs regularly and keep dependencies updated!
