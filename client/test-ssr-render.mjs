// Simple test script to verify SSR render() function works
// Run with: node test-ssr-render.mjs

import { render } from './dist-ssr/entry-server.js';

console.log('Testing SSR render function...\n');

const testRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/privacy-policy',
  '/terms-of-use',
  '/help-desk',
];

let passCount = 0;
let failCount = 0;

for (const route of testRoutes) {
  try {
    const { html, initialState } = render(route, {});
    
    // Basic validation - check if HTML contains expected elements
    const hasContent = html.length > 100;
    const hasDiv = html.includes('<div');
    
    if (hasContent && hasDiv) {
      console.log(`✓ ${route} - Rendered successfully (${html.length} chars)`);
      passCount++;
    } else {
      console.log(`✗ ${route} - Rendered but missing expected content`);
      failCount++;
    }
  } catch (error) {
    console.log(`✗ ${route} - Failed: ${error.message}`);
    failCount++;
  }
}

console.log(`\n--- Test Results ---`);
console.log(`Passed: ${passCount}/${testRoutes.length}`);
console.log(`Failed: ${failCount}/${testRoutes.length}`);

if (failCount === 0) {
  console.log('\n✓ All SSR routes render successfully!');
  process.exit(0);
} else {
  console.log('\n✗ Some routes failed to render');
  process.exit(1);
}
