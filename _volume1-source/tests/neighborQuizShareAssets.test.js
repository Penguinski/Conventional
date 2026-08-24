import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { neighborProfiles } from '../src/content/neighborQuiz.js';

const expected = {
  fantasma: 'il-fantasma.png',
  impiccione: 'l-impiccione.png',
  proprietario: 'il-proprietario-morale.png',
  sociale: 'l-iper-sociale.png',
  minimalista: 'il-minimalista-accidentale.png',
  rumoroso: 'il-rumoroso.png',
  incasinato: 'l-incasinato.png',
  ordine: 'il-maniaco-dell-ordine.png',
};

test('maps every quiz result to one distinct supplied 1080x1920 PNG', async () => {
  assert.equal(Object.keys(neighborProfiles).length, 8);
  assert.equal(new Set(Object.values(neighborProfiles).map(({ shareImage }) => shareImage)).size, 8);
  for (const [key, fileName] of Object.entries(expected)) {
    assert.equal(neighborProfiles[key].shareImage, `assets/quiz/share/${fileName}`);
    const png = await readFile(new URL(`../public/assets/quiz/share/${fileName}`, import.meta.url));
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(png.readUInt32BE(16), 1080);
    assert.equal(png.readUInt32BE(20), 1920);
  }
});
