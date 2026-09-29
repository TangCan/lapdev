import { test, expect } from '@playwright/test';

test.skip('AC-1..AC-2: npx CLI starts a clean local runtime', async ({}, testInfo) => {
  testInfo.annotations.push({ type: 'red-phase', description: 'Activate after CLI/runtime implementation.' });
  expect(true).toBe(false);
});
