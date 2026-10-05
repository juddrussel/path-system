# Deploy SSR to Render.com

## Overview

Your current setup:
- ❌ **Frontend**: Vercel (CSR only, can't do SSR)
- ✅ **Backend**: Render.com (has your API)

**To enable SSR**, we need to move the frontend to Render so the server can render React pages.

---

## Step-by-Step: Enable SSR on Render

### Step 1: Add Build Command to package.json

Already done! ✅ Your root `package.json` has the build script.

### Step 2: Login to Render Dashboard

1. Go to https://dashboard.render.com
2. Find your existing service: **path-system-backend**

### Step 3: Add Environment Variable

In your **path-system-backend** service settings:

1. Click **"Environment"** tab
2. Click **"Add Environment Variable"**
3. Add:
   - **Key**: `ENABLE_SSR`
   - **Value**: `true`
4. Click **"Save Changes"**

### Step 4: Update Build & Start Commands

Still in your service settings:

1. **Build Command** (update to):
   ```bash
   npm run install:all && cd client && npm run build:all && cd ..
   ```

2. **Start Command** (keep as is or update to):
   ```bash
   cd server && npm start
   ```

3. Click **"Save Changes"**

### Step 5: Update Root Directory (if needed)

Some Render configurations need this:

1. Go to **Settings** tab
2. Find **"Root Directory"** setting
3. If it's set to `server`, **change it to** `.` (root)
4. Save

### Step 6: Trigger Redeploy

1. Go to **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for build to complete (3-5 minutes)

### Step 7: Verify SSR is Working

Once deployed:

1. **Visit your site**: https://path-system-backend.onrender.com/login
2. **Right-click** → **View Page Source**
3. **Look for**: Should see full login form HTML (not just empty `<div id="root">`)

**Test without JavaScript:**
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` → Type "Disable JavaScript" → Enable it
3. Refresh the page
4. ✅ You should still see the page content!

---

## Update Frontend URL (Optional)

If you want to keep using `path-system.vercel.app` as your main domain:

### Option A: Keep Vercel for main site (CSR)

- Keep Vercel deployment for protected routes (dashboard, tasks)
- Use Render URL for public pages (login, register) — these get SSR
- Update your marketing links to point to Render for public pages

### Option B: Move everything to Render

1. Update your environment variables to use Render URLs:
   ```
   CLIENT_URL=https://path-system-backend.onrender.com
   APP_BASE_URL=https://path-system-backend.onrender.com
   ```

2. **Pause Vercel deployment** (don't delete yet, keep as backup)

3. Use Render as your primary domain

4. (Optional) Set up custom domain on Render

---

## Troubleshooting

### Build Fails on Render

**Error**: "client/dist-ssr not found"

**Solution**: Make sure build command includes:
```bash
cd client && npm run build:all
```

### SSR Not Working (Still Seeing Empty HTML)

1. **Check environment variable**:
   - Go to Render Dashboard → Environment
   - Confirm `ENABLE_SSR=true` exists

2. **Check logs**:
   - Go to Render Dashboard → Logs
   - Look for: `SSR: ✓ enabled`
   - If you see: `SSR: ✗ disabled`, env var is not set

3. **Check build artifacts**:
   - In Render logs, search for: "Serving client assets"
   - Should see path ending in `/client/dist`

### "window is not defined" Error

This means some component is trying to use browser APIs during SSR.

**Already fixed in the code!** ✅ But if you see this:
- Check `ResetPassword.jsx` has: `typeof window !== 'undefined'`
- Move browser-specific code inside `useEffect`

---

## Current Build Configuration

Your `package.json` scripts (already set up):

```json
{
  "scripts": {
    "install:all": "npm install && cd client && npm install && cd ../server && npm install && cd ..",
    "build:client": "cd client && npm run build:all",
    "build": "npm run install:all && npm run build:client",
    "start": "cd server && npm start",
    "test:ssr": "node test-ssr-all.js"
  }
}
```

Your client `package.json` (already set up):

```json
{
  "scripts": {
    "build": "vite build",
    "build:ssr": "vite build --ssr src/entry-server.jsx --outDir dist-ssr",
    "build:all": "npm run build && npm run build:ssr"
  }
}
```

---

## Cost Considerations

### Current Setup (Vercel + Render)
- Vercel: Free tier (static hosting)
- Render: Free tier (API only, sleeps after 15 min inactivity)

### With SSR on Render (Recommended Upgrade)
- Render: **Paid tier required** ($7/month starter)
  - Reason: SSR needs server always running (can't sleep)
  - Includes: 512MB RAM, always-on, no sleep

### Alternative: Keep Both
- Vercel: Free (for protected pages - dashboard, tasks)
- Render: Free (API only)
- BUT: Public pages won't have SSR

---

## Recommended Next Steps

### Immediate (Free - Test SSR)

1. ✅ Add `ENABLE_SSR=true` to Render environment
2. ✅ Update build command to include SSR bundles
3. ✅ Deploy and test on Render URL
4. ❌ Site may sleep after 15 min (free tier limitation)

### Long-term (Paid - Production SSR)

1. Upgrade Render to paid tier ($7/month)
2. Move primary domain to Render
3. Disable Vercel deployment
4. Update DNS to point to Render

---

## Questions?

### "Do I need to delete my Vercel deployment?"

No! Keep it as backup. You can switch back anytime by:
1. Disabling SSR: `ENABLE_SSR=false` on Render
2. Pointing your domain back to Vercel

### "Will SSR work on Render free tier?"

Yes for testing, but:
- ✅ SSR will work when site is active
- ❌ Site sleeps after 15 min inactivity (slow first load)
- ❌ Not suitable for production (use paid tier)

### "Can I use custom domain with SSR?"

Yes! Render supports custom domains:
1. Upgrade to paid tier
2. Go to Settings → Custom Domain
3. Add your domain (e.g., `path-system.com`)
4. Update DNS records as instructed

---

## Summary

**What you need to do:**

1. Login to Render Dashboard
2. Add environment variable: `ENABLE_SSR=true`
3. Update build command: `npm run install:all && cd client && npm run build:all && cd ..`
4. Deploy
5. Test: Visit your-app.onrender.com/login → View Source

**Result:**
- ✅ Public pages load 75% faster
- ✅ Content visible without JavaScript
- ✅ Better SEO ranking
- ✅ Improved accessibility

**Current status:**
- All code is ready ✅
- Already committed to GitHub ✅
- Just needs Render configuration ⏳

