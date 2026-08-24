import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldUseMobileElevatorFocus } from '../src/interactions/mobileElevatorPlatform.js';

test('keeps the mobile elevator focus enabled for a coarse pointer in landscape', () => {
  assert.equal(shouldUseMobileElevatorFocus({ coarsePointer: true, landscape: true }), true);
});

test('does not enable mobile elevator focus for a desktop fine pointer', () => {
  assert.equal(shouldUseMobileElevatorFocus({ coarsePointer: false, landscape: true }), false);
});

test('does not open the landscape elevator focus while the phone is in portrait', () => {
  assert.equal(shouldUseMobileElevatorFocus({ coarsePointer: true, landscape: false }), false);
});
