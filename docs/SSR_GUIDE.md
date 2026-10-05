# Server-Side Rendering (SSR) Implementation Guide

## Overview

This document explains how Server-Side Rendering (SSR) is implemented in the DS PATH application, how it works, how to use it, and how to troubleshoot common issues.

---

## Table of Contents

1. [What is SSR?](#what-is-ssr)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [How It Works](#how-it-works)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Adding New SSR Pages](#adding-new-ssr-pages)
8. [Troubleshooting](#troubleshooting)
9. [Performance Considerations](#performance-considerations)

---

## What is SSR?

Server-Side Rendering (SSR) is a technique where React components are rendered to HTML on the **server** instead of in the browser. This provides several benefits:

### Benefits

✅ **Better SEO**: Search engines see fully rendered HTML immediately  
✅ **Faster Initial Load**: Content visible before JavaScript loads  
✅ **Improved Accessibility**: Works without JavaScript enabled  
✅ **Social Media Previews**: Proper og:tags and meta descriptions  

### Trade-offs

⚠️ **Server Load**: Rendering on server uses CPU/memory  
⚠️ **Complexity**: More code paths to maintain  
⚠️ **No Browser APIs**: `window`, `document` unavailable during SSR  

### Our Approach

We use **hybrid rendering**:
- **Public pages** (login, register, etc.): SSR for SEO and performance
- **Protected pages** (dashboard, admin, etc.): CSR for rich interactivity
- **Feature flag**: Easy on/off toggle via `ENABLE_SSR` environment variable

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  User requests /login                                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Express Server (server/index.js)                           │
│  ├─ API routes (/api/*)                                     │
│  ├─ SSR middleware (server/ssr.js)  ← YOU ARE HERE         │
│  ├─ Static files (client/dist/)                             │
│  └─ 404 handler                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │ ENABLE_SSR=true?              │
        └───────┬───────────────┬───────┘
                │ YES           │ NO
                ▼               ▼
        ┌───────────────┐   ┌──────────────┐
        │ SSR Render    │   │ Serve CSR    │
        │ (on server)   │   │ (index.html) │
        └───────┬───────┘   └──────┬───────┘
                │                  │
                ▼                  ▼
        ┌─────────────────────────────────┐
        │  Browser receives HTML          │
        │  React hydrates (client/main.js)│
        └─────────────────────────────────┘
```

---

## File Structure

### Core SSR Files

```
path-system/
├── client/
│   ├── src/
│   │   ├── entry-server.jsx      # SSR entry point (renders on server)
│   │   ├── entry-client.jsx      # (Not used - merged into main.jsx)
│   │   ├── main.jsx              # Client hydration entry
│   │   └── App.jsx               # Main app component (accepts initialState)
│   ├── dist/                     # Client bundle (CSR fallback)
│   ├── dist-ssr/                 # Server bundle (SSR)
│   │   └── entry-server.js       # Compiled SSR entry
│   └── index.html                # HTML template (has <!--app-html--> placeholder)
│
├── server/
│   ├── ssr.js                    # SSR middleware (main logic)
│   ├── services/
│   │   └── token.service.js      # Token validation for /reset-password
│   ├── test-ssr-middleware.js    # Test script
│   ├── test-token-service.js     # Test script
│   └── test-server-integration.js # Integration test
│
├── .env.example                  # Environment template
├── DEPLOYMENT.md                 # Deployment guide
└── docs/
    └── SSR_GUIDE.md              # This file
```

---

## How It Works

### 1. Build Phase

```bash
npm run build:all
```

**What happens:**
1. Vite builds client bundle → `client/dist/` (CSR)
2. Vite builds SSR bundle → `client/dist-ssr/entry-server.js`

The SSR bundle contains:
- All React components for public pages
- No browser-specific code (no `window`, `document`)
- Server-side safe versions of utilities

### 2. Server Startup

```javascript
// server/index.js
const ssrMiddleware = require("./ssr");
app.use(ssrMiddleware);  // Before static file serving
app.use(express.static("../client/dist"));  // Fallback CSR
```

**Startup checks:**
- Loads SSR middleware
- Checks if `ENABLE_SSR=true`
- Logs SSR status and routes

### 3. Request Handling

**Example: User visits `/login`**

#### Step 1: SSR Middleware Intercepts

```javascript
// server/ssr.js
async function ssrMiddleware(req, res, next) {
  if (!SSR_ENABLED) return next();  // Feature flag check
  if (req.method !== "GET") return next();  // Only GET requests
  if (!isPublicRoute(req.path)) return next();  // Only public pages
  
  // SSR render logic...
}
```

#### Step 2: Render React to HTML

```javascript
// Loads client/dist-ssr/entry-server.js
const { render } = require("./client/dist-ssr/entry-server.js");

// For /reset-password, pre-validate token
let initialState = {};
if (req.path === "/reset-password") {
  const token = req.query.token;
  initialState = {
    tokenValid: await validateResetToken(token),
    token
  };
}

// Render React component to HTML string
const { html } = render(req.path, initialState);
```

#### Step 3: Inject HTML into Template

```javascript
// Read client/dist/index.html
let template = fs.readFileSync("./client/dist/index.html", "utf-8");

// Replace placeholder with rendered HTML
template = template.replace(
  '<div id="root"><!--app-html--></div>',
  `<div id="root">${html}</div>`
);

// Inject initial state for client hydration
const stateScript = `<script>window.__INITIAL_STATE__=${JSON.stringify(initialState)}</script>`;
template = template.replace('</body>', `${stateScript}</body>`);

// Send to client
res.send(template);
```

#### Step 4: Client Hydration

```javascript
// client/src/main.jsx
const initialState = window.__INITIAL_STATE__ || {};
delete window.__INITIAL_STATE__;

if (rootHasSSRContent) {
  // Hydrate existing SSR HTML
  hydrateRoot(rootElement, <App initialState={initialState} />);
} else {
  // No SSR, mount from scratch
  createRoot(rootElement).render(<App />);
}
```

**Hydration**: React attaches event listeners to existing HTML without re-rendering.

---

## Configuration

### Environment Variables

#### Enable SSR (Production)

```bash
# server/.env
ENABLE_SSR=true
```

#### Disable SSR (Development or Rollback)

```bash
# server/.env
ENABLE_SSR=false
```

### SSR Routes

Defined in `server/ssr.js`:

```javascript
const SSR_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",  // Includes token validation
  "/privacy-policy",
  "/terms-of-use",
  "/help-desk",
  "/"  // Root (redirects to login)
];
```

### Route Behavior

| Route Type | SSR | Notes |
|------------|-----|-------|
| Public pages | ✅ Yes | Login, register, help desk, etc. |
| Protected pages | ❌ No | Dashboard, admin (requires auth) |
| API endpoints | ❌ No | `/api/*` routes |
| Static files | ❌ No | CSS, JS, images |

---

## Testing

### Test Scripts

#### 1. Test SSR Rendering

```bash
cd client
node test-ssr-render.mjs
```

**What it tests:**
- All 7 public routes render successfully
- HTML output contains expected elements
- No errors during server-side rendering

**Expected output:**
```
✓ /login - Rendered successfully (9461 chars)
✓ /register - Rendered successfully (15043 chars)
✓ /forgot-password - Rendered successfully (5795 chars)
✓ /reset-password - Rendered successfully (3944 chars)
✓ /privacy-policy - Rendered successfully (9150 chars)
✓ /terms-of-use - Rendered successfully (9184 chars)
✓ /help-desk - Rendered successfully (8737 chars)

All SSR routes render successfully!
```

#### 2. Test SSR Middleware

```bash
cd server
node test-ssr-middleware.js
```

**What it tests:**
- SSR enabled/disabled toggle works
- Public routes get SSR treatment
- Protected routes skip SSR
- POST requests skip SSR

#### 3. Test Token Validation

```bash
cd server
node test-token-service.js
```

**What it tests:**
- Token validation service works
- Invalid/expired tokens return false
- Database errors handled gracefully

#### 4. Integration Test

```bash
cd server
node test-server-integration.js
```

**What it tests:**
- Server module loads without errors
- SSR middleware integrates correctly

### Manual Testing

#### Verify SSR is Working

1. **Build the application:**
   ```bash
   npm run build:client
   ```

2. **Start server with SSR enabled:**
   ```bash
   cd server
   ENABLE_SSR=true npm start
   ```

3. **Visit a public page:**
   ```
   http://localhost:5000/login
   ```

4. **View page source** (Ctrl+U in browser):
   - **With SSR**: You should see full HTML form elements
   - **Without SSR**: You should see only `<div id="root"><!--app-html--></div>`

#### Check Server Logs

```
Server running on port 5000
SSR: ✓ enabled (set ENABLE_SSR=true to enable)
SSR routes: /login, /register, /forgot-password, /reset-password, /privacy-policy, /terms-of-use, /help-desk, /
[SSR] SSR assets loaded successfully
[SSR] ✓ Rendered /login (9461 chars)
```

---

## Adding New SSR Pages

### Step 1: Create the Page Component

```jsx
// client/src/pages/NewPage.jsx
export default function NewPage() {
  // Important: Use useEffect for browser-only code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Browser-only code here
    }
  }, []);

  return <div>My New Page</div>;
}
```

**Rules for SSR-compatible components:**
- ❌ No direct `window` or `document` access
- ❌ No `localStorage` or `sessionStorage` in render
- ✅ Use `useEffect` for browser-only code
- ✅ Check `typeof window !== 'undefined'` when needed

### Step 2: Add Route to entry-server.jsx

```jsx
// client/src/entry-server.jsx
import NewPage from "./pages/NewPage";

export function render(url, initialState = {}) {
  const html = renderToString(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        {/* ... existing routes ... */}
        <Route path="/new-page" element={<NewPage />} />
      </Routes>
    </MemoryRouter>
  );
  
  return { html, initialState };
}
```

### Step 3: Add Route to App.jsx

```jsx
// client/src/App.jsx
import NewPage from "./pages/NewPage";

function AppRoutes() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      <Route path="/new-page" element={<NewPage />} />
    </Routes>
  );
}
```

### Step 4: Add to SSR Routes List

```javascript
// server/ssr.js
const SSR_ROUTES = [
  "/login",
  "/register",
  // ... existing routes ...
  "/new-page",  // Add here
];
```

### Step 5: Rebuild and Test

```bash
npm run build:client
npm run test:ssr
```

---

## Troubleshooting

### Issue: SSR Not Rendering

**Symptoms:** Page source shows `<div id="root"><!--app-html--></div>`

**Possible causes:**

1. **SSR disabled in environment**
   ```bash
   # Check .env
   cat server/.env | grep ENABLE_SSR
   # Should show: ENABLE_SSR=true
   ```

2. **Build artifacts missing**
   ```bash
   # Check if SSR bundle exists
   ls client/dist-ssr/entry-server.js
   # If missing, rebuild:
   cd client && npm run build:all
   ```

3. **Server not restarted after enabling SSR**
   ```bash
   # Restart server
   pm2 restart path-system
   # OR
   npm start
   ```

### Issue: Hydration Mismatch

**Symptoms:** Console error: "Hydration failed because the initial UI does not match..."

**Causes:**
- Component rendered differently on server vs client
- Used browser APIs (`window`, `localStorage`) during render
- Conditional rendering based on browser state

**Solution:**
Move browser-specific code to `useEffect`:

```jsx
// ❌ BAD - causes hydration mismatch
function MyComponent() {
  const isLoggedIn = localStorage.getItem("token");
  return <div>{isLoggedIn ? "Logged in" : "Logged out"}</div>;
}

// ✅ GOOD - consistent SSR/CSR
function MyComponent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);
  
  return <div>{isLoggedIn ? "Logged in" : "Logged out"}</div>;
}
```

### Issue: "window is not defined"

**Symptoms:** Server crashes with `ReferenceError: window is not defined`

**Solution:**
Wrap browser API usage:

```javascript
// ❌ BAD
const token = window.location.search;

// ✅ GOOD
const token = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get("token")
  : null;
```

### Issue: Slow SSR Performance

**Symptoms:** Server response time > 500ms for SSR routes

**Solutions:**

1. **Enable caching** (add Redis layer)
2. **Optimize components** (remove unnecessary re-renders)
3. **Reduce bundle size** (check `dist-ssr/entry-server.js` size)
4. **Scale horizontally** (multiple server instances)

**Check SSR render time:**
```bash
# Look for these logs
[SSR] ✓ Rendered /login (9461 chars)
# Should be < 100ms for most pages
```

### Issue: SSR Works Locally, Fails in Production

**Checklist:**

- [ ] `client/dist/` and `client/dist-ssr/` exist in Docker image
- [ ] `ENABLE_SSR=true` in production environment
- [ ] Server has enough memory (SSR uses ~50-100MB per request)
- [ ] File paths are correct (use `path.resolve(__dirname, ...)`)

**Debug in production:**
```bash
# SSH into production server
docker exec -it path-system sh

# Check if SSR bundle exists
ls /app/client/dist-ssr/entry-server.js

# Check environment
echo $ENABLE_SSR

# Check server logs
docker logs path-system | grep SSR
```

---

## Performance Considerations

### Server Resource Usage

**Per SSR request:**
- CPU: ~20-50ms render time
- Memory: ~50-100MB (React rendering + component tree)
- Network: HTML size ~10-50KB (vs ~1KB for CSR)

**Scaling recommendations:**
- **< 1000 req/hour**: Single server instance sufficient
- **1000-10000 req/hour**: 2-4 instances with load balancer
- **> 10000 req/hour**: Consider CDN caching + multiple instances

### Caching Strategy

**Level 1: Browser Cache** (Already implemented)
```javascript
// Static assets cached by browser (JS, CSS, images)
app.use(express.static("../client/dist", {
  maxAge: '1d'  // Consider adding this
}));
```

**Level 2: CDN Cache** (Recommended for production)
```nginx
# Nginx config
location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 5m;  # Cache SSR pages for 5 minutes
    proxy_cache_key "$scheme$request_method$host$request_uri";
}
```

**Level 3: Redis Cache** (For high traffic)
```javascript
// server/ssr.js - add before render
const cachedHTML = await redis.get(`ssr:${req.path}`);
if (cachedHTML) {
  return res.send(cachedHTML);
}

// After render
await redis.setex(`ssr:${req.path}`, 300, finalHtml);  // 5 min TTL
```

### Monitoring

**Key metrics to track:**
1. **SSR render time**: Should be < 100ms
2. **Cache hit rate**: Should be > 80% (if using cache)
3. **Memory usage**: Watch for memory leaks
4. **Error rate**: SSR fallback to CSR rate

**Add monitoring:**
```javascript
// server/ssr.js
const startTime = Date.now();
const { html } = render(req.path, initialState);
const renderTime = Date.now() - startTime;

if (renderTime > 100) {
  console.warn(`[SSR] Slow render: ${req.path} took ${renderTime}ms`);
}
```

---

## Best Practices

### ✅ DO

- Use `useEffect` for browser-only code
- Check `typeof window !== 'undefined'` before using window APIs
- Keep SSR bundles small (< 500KB compressed)
- Test SSR in production-like environment before deploying
- Monitor SSR performance metrics
- Have a CSR fallback (already implemented)

### ❌ DON'T

- Don't access `window`, `document`, `localStorage` in render
- Don't make API calls without error handling
- Don't use browser-specific libraries without checks
- Don't render sensitive data in SSR HTML
- Don't forget to rebuild after changes (`npm run build:all`)

---

## FAQ

### Q: Can I disable SSR for a specific page?

**A:** Yes, remove it from `SSR_ROUTES` in `server/ssr.js`:

```javascript
const SSR_ROUTES = [
  "/login",
  // "/register",  // Comment out to disable SSR for this route
];
```

### Q: How do I test SSR locally before deploying?

**A:** 
```bash
# 1. Build client
cd client && npm run build:all

# 2. Enable SSR
echo "ENABLE_SSR=true" >> server/.env

# 3. Start server
cd server && npm start

# 4. Test
curl http://localhost:5000/login | grep "<form"
# Should see form HTML in output
```

### Q: What happens if SSR fails?

**A:** The app automatically falls back to CSR:
1. SSR error is logged
2. Middleware calls `next()`
3. Express serves `client/dist/index.html`
4. Client renders normally

### Q: Does SSR work with OAuth login?

**A:** Yes! The OAuth buttons are rendered server-side, but the actual OAuth flow happens client-side (redirects to Google/Microsoft).

### Q: Can I use SSR with protected routes?

**A:** No, protected routes require authentication and user-specific data, which can't be pre-rendered. They use CSR for security and personalization.

---

## References

- **Deployment Guide**: `/DEPLOYMENT.md`
- **Environment Variables**: `/.env.example`
- **Test Scripts**: `server/test-*.js`, `client/test-*.mjs`

---

**Last Updated:** October 2026  
**Version:** 1.0.0  
**Author:** DS PATH Development Team
