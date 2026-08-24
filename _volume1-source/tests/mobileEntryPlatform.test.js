import test from 'node:test';
import assert from 'node:assert/strict';
import { needsIosSafariEntry } from '../src/interactions/mobileEntryPlatform.js';

test('enables the shutter entry on iPhone Safari', () => {
  assert.equal(needsIosSafariEntry({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    maxTouchPoints: 5,
  }), true);
});

test('does not enable the shutter entry on Android Chrome', () => {
  assert.equal(needsIosSafariEntry({
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    platform: 'Linux armv8l',
    maxTouchPoints: 5,
  }), false);
});

test('does not treat another iOS browser as Safari', () => {
  assert.equal(needsIosSafariEntry({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/139.0.0.0 Mobile/15E148 Safari/604.1',
    platform: 'iPhone',
    maxTouchPoints: 5,
  }), false);
});
