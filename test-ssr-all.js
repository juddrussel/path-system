/**
 * Comprehensive SSR Test Suite
 * 
 * Runs all SSR-related tests and provides a summary report.
 * Run with: node test-ssr-all.js
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("═══════════════════════════════════════════════════════════════");
console.log("  DS PATH - Comprehensive SSR Test Suite");
console.log("═══════════════════════════════════════════════════════════════\n");

const tests = [
  {
    name: "SSR Rendering (Client)",
    cwd: path.join(__dirname, "client"),
    command: "node",
    args: ["test-ssr-render.mjs"],
    description: "Tests that all 7 public routes render to HTML successfully"
  },
  {
    name: "Token Validation Service",
    cwd: path.join(__dirname, "server"),
    command: "node",
    args: ["test-token-service.js"],
    description: "Tests password reset token validation logic"
  },
  {
    name: "SSR Middleware",
    cwd: path.join(__dirname, "server"),
    command: "node",
    args: ["test-ssr-middleware.js"],
    description: "Tests SSR middleware with feature flag and route filtering"
  },
  {
    name: "Server Integration",
    cwd: path.join(__dirname, "server"),
    command: "node",
    args: ["test-server-integration.js"],
    description: "Tests server module loads correctly with SSR middleware"
  }
];

let currentTest = 0;
const results = [];

function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n┌─ Test ${currentTest + 1}/${tests.length}: ${test.name}`);
    console.log(`│  ${test.description}`);
    console.log(`└─ Running: ${test.command} ${test.args.join(" ")}\n`);

    const startTime = Date.now();
    const proc = spawn(test.command, test.args, {
      cwd: test.cwd,
      shell: true,
      stdio: "inherit"
    });

    proc.on("close", (code) => {
      const duration = Date.now() - startTime;
      const passed = code === 0;
      
      results.push({
        name: test.name,
        passed,
        duration,
        exitCode: code
      });

      console.log(`\n${passed ? "✓" : "✗"} ${test.name} ${passed ? "PASSED" : "FAILED"} (${duration}ms)\n`);
      resolve();
    });

    proc.on("error", (error) => {
      console.error(`✗ Failed to start test: ${error.message}\n`);
      results.push({
        name: test.name,
        passed: false,
        duration: 0,
        error: error.message
      });
      resolve();
    });
  });
}

async function runAllTests() {
  console.log("Starting test suite...\n");
  console.log("Prerequisites:");
  console.log("  - Client build exists (run 'npm run build:all' in client directory)");
  console.log("  - Database is accessible");
  console.log("  - Environment variables are set\n");

  for (const test of tests) {
    await runTest(test);
    currentTest++;
  }

  // Print summary
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  Test Summary");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach((result, index) => {
    const status = result.passed ? "✓ PASS" : "✗ FAIL";
    const time = `${result.duration}ms`;
    console.log(`  ${status}  ${tests[index].name.padEnd(30)} ${time}`);
  });

  console.log("\n───────────────────────────────────────────────────────────────");
  console.log(`  Total: ${tests.length} tests`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Duration: ${totalTime}ms`);
  console.log("───────────────────────────────────────────────────────────────\n");

  if (failed > 0) {
    console.log("⚠️  Some tests failed. See output above for details.\n");
    console.log("Common issues:");
    console.log("  - Client build missing: Run 'npm run build:all' in client directory");
    console.log("  - Database unavailable: Check DB_HOST in server/.env");
    console.log("  - Missing dependencies: Run 'npm install' in client and server\n");
    process.exit(1);
  } else {
    console.log("✓ All tests passed!\n");
    console.log("Next steps:");
    console.log("  1. Set ENABLE_SSR=true in server/.env");
    console.log("  2. Run: cd server && npm start");
    console.log("  3. Visit: http://localhost:5000/login");
    console.log("  4. View page source to verify SSR HTML\n");
    process.exit(0);
  }
}

runAllTests().catch((error) => {
  console.error("\n✗ Test suite failed with error:", error.message);
  process.exit(1);
});
