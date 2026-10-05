const fs = require("fs");
const path = require("path");
const { validateResetToken } = require("./services/token.service");

/**
 * Express SSR Middleware with Feature Flag
 * 
 * This middleware handles server-side rendering of public React pages.
 * It can be easily toggled on/off via the ENABLE_SSR environment variable.
 * 
 * When ENABLE_SSR=false: Falls through to static file serving (CSR)
 * When ENABLE_SSR=true: Renders React components to HTML on the server
 */

// Feature flag - default to false for safety
const SSR_ENABLED = process.env.ENABLE_SSR === "true";

// List of routes that support SSR (public pages only)
const SSR_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy-policy",
  "/terms-of-use",
  "/help-desk",
  "/", // Root redirects to login, so it's public
];

// Cache for template and render function (loaded once)
let templateCache = null;
let renderFn = null;

/**
 * Load the SSR render function and HTML template
 * This is done lazily on first SSR request to avoid startup errors if SSR disabled
 */
function loadSSRAssets() {
  if (!SSR_ENABLED) return null;

  try {
    // Load the SSR entry point (built by Vite)
    const ssrEntryPath = path.resolve(__dirname, "../client/dist-ssr/entry-server.js");
    
    if (!fs.existsSync(ssrEntryPath)) {
      console.error("[SSR] SSR bundle not found at:", ssrEntryPath);
      console.error("[SSR] Run 'npm run build:all' in client directory to generate SSR bundle");
      return null;
    }

    // Load the HTML template
    const templatePath = path.resolve(__dirname, "../client/dist/index.html");
    
    if (!fs.existsSync(templatePath)) {
      console.error("[SSR] HTML template not found at:", templatePath);
      console.error("[SSR] Run 'npm run build' in client directory first");
      return null;
    }

    // Load render function
    const { render } = require(ssrEntryPath);
    const template = fs.readFileSync(templatePath, "utf-8");

    console.log("[SSR] SSR assets loaded successfully");
    return { render, template };
  } catch (error) {
    console.error("[SSR] Failed to load SSR assets:", error.message);
    return null;
  }
}

/**
 * SSR Middleware
 * 
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 */
async function ssrMiddleware(req, res, next) {
  // Feature flag check - if disabled, skip SSR and use CSR
  if (!SSR_ENABLED) {
    return next();
  }

  // Only handle GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Check if this route supports SSR
  const isSSRRoute = SSR_ROUTES.includes(req.path);

  if (!isSSRRoute) {
    // Not a public route - skip SSR, let client handle it
    return next();
  }

  try {
    // Lazy load SSR assets on first request
    if (!renderFn || !templateCache) {
      const assets = loadSSRAssets();
      
      if (!assets) {
        // SSR assets failed to load - fall back to CSR
        console.warn(`[SSR] Falling back to CSR for ${req.path}`);
        return next();
      }

      renderFn = assets.render;
      templateCache = assets.template;
    }

    // Prepare initial state (pre-fetched data for specific routes)
    let initialState = {};

    // Special handling for /reset-password: validate token server-side
    if (req.path === "/reset-password") {
      const token = req.query.token;
      
      if (token) {
        // Validate the token on the server before rendering
        const tokenValid = await validateResetToken(token);
        
        // Pass validation result and token to the client
        initialState = {
          tokenValid,
          token,
        };
        
        console.log(`[SSR] Reset password token validation: ${tokenValid ? "✓ valid" : "✗ invalid"}`);
      } else {
        // No token provided - invalid
        initialState = {
          tokenValid: false,
          token: null,
        };
        
        console.log("[SSR] Reset password: no token provided");
      }
    }

    // Render the React app to HTML
    const { html, initialState: returnedState } = renderFn(req.path, initialState);

    // Use the returned state (render function may modify it)
    initialState = returnedState;

    // Inject the rendered HTML into the template
    // Replace the SSR placeholder comment with actual content
    let finalHtml = templateCache.replace(
      '<div id="root"><!--app-html--></div>',
      `<div id="root">${html}</div>`
    );

    // Inject initial state as a global variable for client hydration
    const stateScript = `<script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState).replace(/</g, '\\u003c')};</script>`;
    
    // Insert the state script before the closing </body> tag
    finalHtml = finalHtml.replace('</body>', `${stateScript}</body>`);

    // Send the complete HTML to the client
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(finalHtml);

    console.log(`[SSR] ✓ Rendered ${req.path} (${html.length} chars)`);
  } catch (error) {
    // SSR failed - log error and fall back to CSR
    console.error(`[SSR] ✗ Error rendering ${req.path}:`, error.message);
    console.error(error.stack);
    
    // Fall back to static file serving (CSR)
    console.warn(`[SSR] Falling back to CSR for ${req.path}`);
    return next();
  }
}

/**
 * Get SSR status (for health checks or debugging)
 */
function getSSRStatus() {
  return {
    enabled: SSR_ENABLED,
    routes: SSR_ROUTES,
    assetsLoaded: renderFn !== null && templateCache !== null,
  };
}

module.exports = ssrMiddleware;
module.exports.getSSRStatus = getSSRStatus;
module.exports.SSR_ENABLED = SSR_ENABLED;
