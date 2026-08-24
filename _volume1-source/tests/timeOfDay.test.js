import test from 'node:test';
import assert from 'node:assert/strict';
import { apartmentWindows, getApartmentState, getTimePeriod, resolveTimePeriod } from '../src/state/timeOfDay.js';

test('maps every boundary hour to the intended period', () => {
  assert.equal(getTimePeriod(5), 'night');
  assert.equal(getTimePeriod(6), 'morning');
  assert.equal(getTimePeriod(11), 'morning');
  assert.equal(getTimePeriod(12), 'afternoon');
  assert.equal(getTimePeriod(17), 'afternoon');
  assert.equal(getTimePeriod(18), 'evening');
  assert.equal(getTimePeriod(21), 'evening');
  assert.equal(getTimePeriod(22), 'night');
});

test('supports a valid URL override and ignores an invalid one', () => {
  const date = new Date('2026-08-16T09:00:00');
  assert.equal(resolveTimePeriod('?time=night', date), 'night');
  assert.equal(resolveTimePeriod('?time=unknown', date), 'morning');
});

test('defines six apartments and gives each one four complete states', () => {
  assert.equal(apartmentWindows.length, 6);
  for (const apartment of apartmentWindows) {
    for (const period of ['morning', 'afternoon', 'evening', 'night']) {
      const state = getApartmentState(apartment, period);
      assert.equal(typeof state.light, 'boolean');
      assert.equal(typeof state.shutter, 'number');
      assert.equal(typeof state.open, 'boolean');
      assert.equal(typeof state.curtain, 'string');
    }
  }
});

test('keeps Arturo lit at night as an apartment-specific exception', () => {
  const arturo = apartmentWindows.find((apartment) => apartment.resident === 'Arturo');
  assert.equal(getApartmentState(arturo, 'night').light, true);
});
