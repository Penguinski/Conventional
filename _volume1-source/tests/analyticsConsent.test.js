import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyticsTrackerIds } from '../src/analytics/analyticsConsent.js';

test('analytics uses the approved Volume 0 tracker identifiers', () => {
  assert.deepEqual(analyticsTrackerIds, {
    googleAnalytics: 'G-S0KTLZF56G',
    microsoftClarity: 'wsxvrhi5hw',
  });
});

test('tracker scripts are not statically embedded before consent', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(html.includes('googletagmanager.com/gtag/js'), false);
  assert.equal(html.includes('clarity.ms/tag'), false);
});
