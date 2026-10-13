import test from 'node:test';
import assert from 'node:assert/strict';
import { getCorrections } from '../src/corrections.js';

test('getCorrections returns empty result for unknown host', () => {
  const result = getCorrections('example.com');
  assert.deepEqual(result, {
    ids: [],
    roles: {},
    preserve: []
  });
});

test('getCorrections returns correct result for single matched host', () => {
  const result = getCorrections('youtube.com');
  assert.deepEqual(result, {
    ids: ['youtube-player-controls'],
    roles: {
      'overlay-control': ['.ytp-button', '.ytp-menuitem']
    },
    preserve: ['.html5-video-player']
  });
});

test('getCorrections returns correct result for localhost', () => {
  const result = getCorrections('localhost');
  assert.deepEqual(result, {
    ids: ['fixture-custom-components'],
    roles: {
      button: ['.fixture-action'],
      surface: ['.fixture-panel'],
      error: ['.fixture-error'],
      success: ['.fixture-success']
    },
    preserve: []
  });
});
