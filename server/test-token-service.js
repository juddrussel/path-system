/**
 * Simple test script for token validation service
 * 
 * This tests the token validation logic
 * Run with: node test-token-service.js
 */

const { validateResetToken, getTokenInfo } = require("./services/token.service");

console.log("Testing Token Validation Service...\n");

async function runTests() {
  // Test 1: Null token
  console.log("Test 1: Null/Undefined Token");
  const result1 = await validateResetToken(null);
  console.log("  Result:", result1);
  console.log(result1 === false ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  // Test 2: Empty string
  console.log("Test 2: Empty String Token");
  const result2 = await validateResetToken("");
  console.log("  Result:", result2);
  console.log(result2 === false ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  // Test 3: Invalid token (doesn't exist in DB)
  console.log("Test 3: Non-existent Token");
  const result3 = await validateResetToken("fake-token-12345");
  console.log("  Result:", result3);
  console.log(result3 === false ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  // Test 4: Get info for non-existent token
  console.log("Test 4: Get Info for Non-existent Token");
  const info = await getTokenInfo("fake-token-12345");
  console.log("  Result:", info);
  console.log(info === null ? "  ✓ PASS\n" : "  ✗ FAIL\n");

  console.log("--- Test Complete ---");
  console.log("Note: Valid token test requires a real token in the database");
  console.log("To test with a real token:");
  console.log("1. Request password reset via /api/auth/forgot-password");
  console.log("2. Copy the token from the email");
  console.log("3. Run: node -e \"require('./services/token.service').validateResetToken('YOUR_TOKEN').then(console.log)\"");
  
  process.exit(0);
}

runTests().catch((error) => {
  console.error("Test failed with error:", error);
  process.exit(1);
});
