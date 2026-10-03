import test from 'node:test';
import assert from 'node:assert/strict';
import { parseColor, compositeLayers, contrastRatio, minimumContrast, readableColor } from '../src/contrast.js';
import { THEMES } from '../src/themes.js';

test('sRGB parsing rejects unknown color spaces and invalid components', () => {
  assert.deepEqual(parseColor('#abc'), [170, 187, 204, 1]);
  assert.deepEqual(parseColor('rgb(10 20 30 / 50%)'), [10, 20, 30, 0.5]);
  assert.deepEqual(parseColor('rgba(10, 20, 30, 0.5)'), [10, 20, 30, 0.5]);
  for (const color of ['color(display-p3 1 0 0)', 'rgb(nope)', '#12345', 'rgb(300,0,0)']) assert.equal(parseColor(color), null);
});

test('alpha layers compose front to back and require a known opaque backing', () => {
  const layers = ['rgba(255,255,255,.25)', 'rgba(0,0,0,.5)', '#fff'].map(parseColor);
  assert.deepEqual(compositeLayers(layers), [159.375, 159.375, 159.375, 1]);
  assert.equal(compositeLayers(layers.slice(0, 2)), null);
  assert.equal(contrastRatio(parseColor('#fff'), parseColor('#000')), 21);
  assert.equal(contrastRatio(parseColor('#888'), parseColor('#888')), 1);
  assert.ok(contrastRatio(parseColor('rgba(0,0,0,.5)'), parseColor('#fff')) < 4.5);
});

test('foreground adjustment preserves passing colors and meets thresholds across light/dark surfaces', () => {
  for (const theme of Object.values(THEMES)) {
    for (let gray = 0; gray <= 255; gray += 5) {
      const background = [gray, gray, gray, 1];
      for (const foreground of [theme.colors.text, theme.colors.link]) {
        const result = readableColor(foreground, background);
        assert.ok(contrastRatio(parseColor(result), background) >= 4.5, `${foreground} on ${gray}: ${result}`);
        if (contrastRatio(parseColor(foreground), background) >= 4.5) assert.equal(result, foreground);
      }
    }
  }
  assert.equal(readableColor('#aaa', [0, 0, 0, 0]), null);
});

test('large text thresholds use CSS pixels and bold weight', () => {
  assert.equal(minimumContrast(16, 700), 4.5);
  assert.equal(minimumContrast(24, 400), 3);
  assert.equal(minimumContrast(19, 700), 3);
  assert.equal(minimumContrast(19, 400), 4.5);
});
