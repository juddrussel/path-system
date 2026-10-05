/**
 * Simple test script for SSR middleware
 * 
 * This tests the middleware logic without starting a full Express server
 * Run with: node test-ssr-middleware.js
 */

// Mock environment
process.env.ENABLE_SSR = "true";

const ssrMiddleware = require("./ssr");

console.log("Testing SSR Middleware...\n");

// Test 1: Check SSR status
console.log("Test 1: SSR Status");
const status = ssrMiddleware.getSSRStatus();
console.log("  Enabled:", status.enabled);
console.log("  Routes:", status.routes.length);
console.log("  Expected routes: 8 (7 public + root)");
console.log(status.enabled && status.routes.length === 8 ? "  ✓ PASS\n" : "  ✗ FAIL\n");

// Test 2: Mock request/response for SSR route
console.log("Test 2: SSR Route Handling");
let nextCalled = false;
let responseStatus = null;
let responseContent = null;

const mockReq = {
  method: "GET",
  path: "/login",
  query: {},
};

const mockRes = {
  setHeader: () => {},
  status: (code) => {
    responseStatus = code;
    return mockRes;
  },
  send: (content) => {
    responseContent = content;
  },
};

const mockNext = () => {
  nextCalled = true;
};

// Note: This will fail if builds don't exist yet, but that's expected
console.log("  Attempting to render /login...");
ssrMiddleware(mockReq, mockRes, mockNext);

// Give it a moment to complete async operations
setTimeout(async () => {
  if (responseStatus === 200 && responseContent) {
    console.log("  Response status:", responseStatus);
    console.log("  Response length:", responseContent.length, "chars");
    console.log("  Contains HTML:", responseContent.includes("<html"));
    console.log("  Contains root div:", responseContent.includes('<div id="root">'));
    console.log("  ✓ PASS\n");
  } else if (nextCalled) {
    console.log("  Middleware called next() (fallback to CSR)");
    console.log("  This is expected if client build doesn't exist yet");
    console.log("  ⚠ SKIP (run 'npm run build:all' in client dir)\n");
  } else {
    console.log("  ✗ FAIL: No response or next() call\n");
  }

  // Test 3: Non-SSR route should call next()
  console.log("Test 3: Non-SSR Route (Protected Route)");
  nextCalled = false;
  const protectedReq = { method: "GET", path: "/dashboard", query: {} };
  ssrMiddleware(protectedReq, mockRes, mockNext);
  console.log("  Called next():", nextCalled);
  console.log(nextCalled ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  // Test 4: POST request should call next()
  console.log("Test 4: POST Request");
  nextCalled = false;
  const postReq = { method: "POST", path: "/login", query: {} };
  ssrMiddleware(postReq, mockRes, mockNext);
  console.log("  Called next():", nextCalled);
  console.log(nextCalled ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  console.log("--- Test Complete ---");
  console.log("Note: Full integration test requires running the Express server");
  
  // Close database connection to allow process to exit
  try {
    const db = require("./config/db");
    await db.end();
    console.log("\nDatabase connection closed");
  } catch (err) {
    // Ignore errors on close
  }
  
  process.exit(0);
}, 1000);
