import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSettings, updateSettings, isEnabled, hostname } from '../src/settings.js';

test('invalid persisted values recover to usable settings', () => {
  const settings = normalizeSettings({ version: 999, enabled: 'yes', theme: 'missing', renderer: 'missing', disabledHosts: ['EXAMPLE.COM', 'example.com', null, 'example.com/path'] });
  assert.equal(settings.version, 1);
  assert.equal(settings.theme, 'terminal-vision');
  assert.equal(settings.renderer, 'simple');
  assert.equal(settings.enabled, true);
  assert.deepEqual(settings.disabledHosts, ['example.com']);
});

test('site disable persists through unrelated changes and has exact-host scope', () => {
  let settings = updateSettings(normalizeSettings(), { siteHost: 'example.com', siteEnabled: false });
  settings = updateSettings(settings, { theme: 'liquid-dream', renderer: 'adaptive' });
  assert.equal(isEnabled(settings, 'example.com'), false);
  assert.equal(isEnabled(settings, 'sub.example.com'), true);
  assert.equal(isEnabled(settings, ''), false);
  settings = updateSettings(settings, { siteHost: 'example.com', siteEnabled: true });
  assert.equal(isEnabled(settings, 'example.com'), true);
  assert.equal(isEnabled({ ...settings, enabled: false }, 'example.com'), false);
});

test('only supported settings and HTTP hosts are accepted', () => {
  assert.equal(hostname('chrome://extensions'), '');
  assert.equal(hostname('https://example.com/a?b=c'), 'example.com');
  assert.equal(hostname('javascript:alert(1)'), '');
  assert.deepEqual(updateSettings(normalizeSettings(), { siteHost: 'example.com/path', siteEnabled: false, arbitraryCSS: '*{}' }).disabledHosts, []);
  assert.equal(updateSettings(normalizeSettings(), { renderer: 'contextual' }).renderer, 'contextual');
});
