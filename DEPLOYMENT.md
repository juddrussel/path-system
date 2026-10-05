# DS PATH - Deployment Guide

This guide covers deploying the DS PATH application with Server-Side Rendering (SSR) enabled.

## Prerequisites

- Node.js 18+ installed
- Docker installed (for containerized deployment)
- MySQL database accessible
- Environment variables configured

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Install all dependencies (root, client, server)
npm run install:all
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example server/.env

# Edit server/.env and fill in your values
# Important: Set ENABLE_SSR=true to enable server-side rendering
```

### 3. Build Client Assets

```bash
# Build both client (CSR) and SSR bundles
npm run build:client
```

This creates:
- `client/dist/` - Client-side bundle (CSR fallback)
- `client/dist-ssr/` - Server-side rendering bundle

### 4. Start the Server

```bash
npm start
```

The server will:
- Start on port 5000 (or PORT from .env)
- Serve SSR-rendered pages for public routes if ENABLE_SSR=true
- Fall back to CSR if SSR is disabled or fails
- Log SSR status on startup

### 5. Verify SSR is Working

```bash
# Test SSR middleware
npm run test:ssr
```

Visit http://localhost:5000/login and view page source:
- **With SSR**: Should see full HTML content in source
- **Without SSR**: Should see only `<div id="root"><!--app-html--></div>`

---

## Production Deployment

### Option 1: Docker Deployment (Recommended)

#### Build Docker Image

```bash
# Build the Docker image with multi-stage build
npm run docker:build

# Or manually:
docker build -t path-system .
```

The Dockerfile:
1. **Stage 1**: Builds client assets (CSR + SSR bundles)
2. **Stage 2**: Installs server dependencies
3. **Stage 3**: Combines everything into a minimal runtime image

#### Run Docker Container

```bash
# Run with environment file
npm run docker:run

# Or manually with specific environment variables:
docker run -p 5000:5000 \
  -e DB_HOST=your_db_host \
  -e DB_USER=your_db_user \
  -e DB_PASS=your_db_password \
  -e DB_NAME=your_db_name \
  -e JWT_SECRET=your_jwt_secret \
  -e ENABLE_SSR=true \
  path-system
```

#### Docker Compose (Production)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - ENABLE_SSR=true
      - DB_HOST=${DB_HOST}
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/health')"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Start with:
```bash
docker-compose up -d
```

---

### Option 2: Traditional VPS Deployment

#### 1. Prepare Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Application

```bash
# Clone repository
git clone <your-repo-url> /var/www/path-system
cd /var/www/path-system

# Install dependencies
npm run install:all

# Build client assets
npm run build:client

# Configure environment
cp .env.example server/.env
nano server/.env  # Edit with your production values
```

#### 3. Start with PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'path-system',
    cwd: './server',
    script: 'index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      ENABLE_SSR: 'true'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
```

Start the application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable auto-start
```

#### 4. Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/path-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Environment Variables

### Required Variables

```env
# Database
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name

# Application
JWT_SECRET=your_secret_key_min_32_chars
PORT=5000

# SSR Feature Flag
ENABLE_SSR=true  # Set to 'false' to disable SSR
```

### Optional Variables

See `.env.example` for full list including:
- OAuth credentials (Google, Microsoft)
- Email service (Brevo)
- File storage (Cloudflare R2)
- reCAPTCHA

---

## SSR Configuration

### Enable/Disable SSR

In `server/.env`:
```env
ENABLE_SSR=true   # Enable server-side rendering
ENABLE_SSR=false  # Disable (use client-side rendering only)
```

### SSR Routes

The following routes support SSR:
- `/` (root/login)
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/privacy-policy`
- `/terms-of-use`
- `/help-desk`

Protected routes (dashboard, admin, etc.) always use client-side rendering.

### Verify SSR Status

When the server starts, check logs:
```
Server running on port 5000
SSR: ✓ enabled (set ENABLE_SSR=true to enable)
SSR routes: /login, /register, /forgot-password, ...
```

---

## Troubleshooting

### SSR Not Working

1. **Check build artifacts exist:**
   ```bash
   ls client/dist/
   ls client/dist-ssr/
   ```
   If missing, run: `npm run build:client`

2. **Check ENABLE_SSR is set:**
   ```bash
   echo $ENABLE_SSR  # Should output "true"
   ```

3. **Check server logs:**
   Look for "[SSR]" prefixed messages

4. **Test SSR middleware:**
   ```bash
   cd server && node test-ssr-middleware.js
   ```

### Build Failures

If client build fails:
```bash
cd client
rm -rf node_modules dist dist-ssr
npm install
npm run build:all
```

### Docker Build Issues

Clear Docker cache and rebuild:
```bash
docker system prune -a
docker build --no-cache -t path-system .
```

---

## Performance Optimization

### Enable SSR in Production

SSR provides:
- ⚡ **Faster initial page load** (content visible before JS loads)
- 🔍 **Better SEO** (search engines see real HTML)
- ♿ **Improved accessibility** (works without JavaScript)

### Caching Strategy

Consider adding:
1. **CDN caching** for static assets (`/assets/*`)
2. **Redis caching** for SSR-rendered pages (5-minute TTL)
3. **Browser caching** headers for images/fonts

### Load Balancing

For high traffic, use multiple instances:
```bash
# PM2 cluster mode (already configured in ecosystem.config.js)
pm2 start ecosystem.config.js

# Or Docker with multiple replicas
docker-compose up --scale app=3
```

---

## Security Checklist

- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Use HTTPS in production (configure Nginx/CDN)
- [ ] Enable CORS only for your domain (not `*`)
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use environment variables (never commit `.env`)
- [ ] Enable database SSL if available
- [ ] Configure firewall (allow only 80/443)
- [ ] Set up automated backups

---

## Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{"status":"ok","timestamp":"2026-10-05T..."}
```

### PM2 Monitoring

```bash
pm2 monit        # Real-time monitoring
pm2 logs         # View logs
pm2 status       # Check status
```

### Docker Health Check

```bash
docker ps  # Check HEALTH status
docker logs path-system
```

---

## Rollback Strategy

### Quick Rollback (Disable SSR)

If SSR causes issues, immediately disable it:

```bash
# Update environment
echo "ENABLE_SSR=false" >> server/.env

# Restart server
pm2 restart path-system
# OR
docker-compose restart
```

The app will automatically fall back to client-side rendering.

### Full Rollback (Previous Version)

```bash
# With Git
git checkout <previous-commit>
npm run build:client
pm2 restart path-system

# With Docker
docker run previous-image-tag
```

---

## Support

For issues or questions:
- Check logs: `pm2 logs` or `docker logs`
- Test SSR: `npm run test:ssr`
- Verify build: Check `client/dist/` and `client/dist-ssr/` exist

---

**Last Updated:** October 2026  
**Version:** 1.0.0 (SSR Enabled)
