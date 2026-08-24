import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldShowAndroidFullscreenFallback } from '../src/interactions/androidFullscreenFallback.js';

const android = 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36';
const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1';
const desktop = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';

test('shows only on Android landscape outside the Fullscreen API', () => {
  assert.equal(shouldShowAndroidFullscreenFallback({ userAgent: android, landscape: true, fullscreenElement: null }), true);
  assert.equal(shouldShowAndroidFullscreenFallback({ userAgent: android, landscape: true, fullscreenElement: {} }), false);
  assert.equal(shouldShowAndroidFullscreenFallback({ userAgent: android, landscape: false, fullscreenElement: null }), false);
  assert.equal(shouldShowAndroidFullscreenFallback({ userAgent: iphone, landscape: true, fullscreenElement: null }), false);
  assert.equal(shouldShowAndroidFullscreenFallback({ userAgent: desktop, landscape: true, fullscreenElement: null }), false);
});
