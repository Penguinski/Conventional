import test from 'node:test';
import assert from 'node:assert/strict';
import { mergePostItRecord } from '../src/interactions/postItState.js';

const strokes = [{ points: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.5 }] }];

test('a positional post-it update preserves its owner and drawing', () => {
  const current = { id: 'note-1', owner_id: 'owner-1', strokes, x: 0.2, y: 0.3, z_index: 4 };
  const merged = mergePostItRecord(current, { id: 'note-1', x: 0.7, y: 0.8, z_index: 9 });
  assert.equal(merged.owner_id, 'owner-1');
  assert.deepEqual(merged.strokes, strokes);
  assert.deepEqual([merged.x, merged.y, merged.z_index], [0.7, 0.8, 9]);
});

test('an undefined realtime strokes field cannot erase a local drawing', () => {
  const current = { id: 'note-1', strokes, x: 0.2, y: 0.3 };
  const merged = mergePostItRecord(current, { id: 'note-1', x: 0.6, strokes: undefined });
  assert.deepEqual(merged.strokes, strokes);
});
