import assert from 'node:assert/strict';
import test from 'node:test';
import { windowControlsImage } from '../src/icons.js';

test('decorative window furniture uses disabled system colors', () => {
  const decoded = decodeURIComponent(windowControlsImage());
  assert.match(decoded, /stroke="#808080"/);
  assert.match(decoded, /stroke="#a0a0a0"/);
  assert.match(decoded, /stroke="#dfdfdf"/);
  assert.doesNotMatch(decoded, /stroke="#000"/);
});
