import test from 'node:test';
import assert from 'node:assert/strict';
import { themeContractErrors, assertThemeContract } from '../src/theme-contract.js';

test('themeContractErrors returns errors for missing required string fields', () => {
  const emptyTheme = {};
  const errors = themeContractErrors(emptyTheme);
  for (const field of ['id', 'name', 'description', 'scheme', 'font', 'headingFont', 'border', 'radius', 'weight']) {
    assert.ok(errors.includes(`${field} must be a non-empty string`));
  }
});

test('themeContractErrors validates scheme', () => {
  assert.ok(themeContractErrors({ scheme: 'invalid' }).includes('scheme must be light or dark'));
  assert.ok(themeContractErrors({ scheme: null }).includes('scheme must be light or dark'));
});

test('themeContractErrors validates version', () => {
  assert.ok(themeContractErrors({ version: '1' }).includes('version must be a positive integer'));
  assert.ok(themeContractErrors({ version: 0 }).includes('version must be a positive integer'));
  assert.ok(themeContractErrors({ version: -1 }).includes('version must be a positive integer'));
  assert.ok(themeContractErrors({ version: 1.5 }).includes('version must be a positive integer'));
});

test('themeContractErrors validates color tokens', () => {
  const REQUIRED_COLOR_TOKENS = ['background', 'surface', 'raised', 'text', 'muted', 'line', 'accent', 'accentText', 'link', 'error', 'success', 'warning'];

  assert.ok(themeContractErrors({ colors: null }).includes('colors.background must be a non-empty string'));

  const missingColorsTheme = { colors: { background: '#000' } };
  const errors = themeContractErrors(missingColorsTheme);

  for (const token of REQUIRED_COLOR_TOKENS.slice(1)) {
    assert.ok(errors.includes(`colors.${token} must be a non-empty string`));
  }
});

test('themeContractErrors validates assets', () => {
  assert.ok(themeContractErrors({ assets: null }).includes('assets must be an array'));

  const invalidPathAssets = { assets: [{ path: 'https://example.com/asset.png' }] };
  assert.ok(themeContractErrors(invalidPathAssets).includes('assets[0].path must be a packaged relative path'));

  const invalidPathAssets2 = { assets: [{ path: '/absolute/path.png' }] };
  assert.ok(themeContractErrors(invalidPathAssets2).includes('assets[0].path must be a packaged relative path'));

  const invalidPathAssets3 = { assets: [{ path: '../up/path.png' }] };
  assert.ok(themeContractErrors(invalidPathAssets3).includes('assets[0].path must be a packaged relative path'));
});

test('themeContractErrors validates icons configuration', () => {
  assert.ok(themeContractErrors({ icons: null }).includes('icons.style must be pixel, flow, or line'));
  assert.ok(themeContractErrors({ icons: { style: 'invalid' } }).includes('icons.style must be pixel, flow, or line'));

  assert.ok(themeContractErrors({ icons: { style: 'pixel', ink: null } }).includes('icons.ink must be a non-empty string'));
  assert.ok(themeContractErrors({ icons: { style: 'pixel', ink: '#fff', headings: 'yes' } }).includes('icons.headings must be boolean'));
});

test('themeContractErrors validates treatments structure', () => {
  assert.ok(themeContractErrors({ treatments: null }).includes('treatments must be an object'));
  assert.ok(themeContractErrors({ treatments: 'invalid' }).includes('treatments must be an object'));
});

test('themeContractErrors validates treatments rules and targets', () => {
  const baseTheme = { treatments: {} };

  const invalidPrelude = { treatments: { prelude: 'not array' } };
  assert.ok(themeContractErrors(invalidPrelude).includes('treatments.prelude must be an array'));

  const invalidMotifTarget = { treatments: { motifs: [{ target: 'unknown', declarations: { color: 'red' } }] } };
  assert.ok(themeContractErrors(invalidMotifTarget).includes('treatments.motifs[0] uses unknown target unknown'));

  const invalidMotifDeclarations = { treatments: { motifs: [{ target: 'surface', declarations: [] }] } };
  assert.ok(themeContractErrors(invalidMotifDeclarations).includes('treatments.motifs[0].declarations must contain CSS declarations'));
});

test('themeContractErrors validates treatments.purposes', () => {
  assert.ok(themeContractErrors({ treatments: { purposes: 'invalid' } }).includes('treatments.purposes must be an object'));
  assert.ok(themeContractErrors({ treatments: { purposes: [] } }).includes('treatments.purposes must be an object'));

  const invalidPurposeTarget = { treatments: { purposes: { unknown: { color: 'red' } } } };
  assert.ok(themeContractErrors(invalidPurposeTarget).includes('treatments.purposes uses unknown target unknown'));

  const invalidPurposeDeclarations = { treatments: { purposes: { reading: [] } } };
  assert.ok(themeContractErrors(invalidPurposeDeclarations).includes('treatments.purposes.reading must contain CSS declarations'));
});

test('themeContractErrors validates treatments.responsive', () => {
  assert.ok(themeContractErrors({ treatments: { purposes: {}, responsive: 'invalid' } }).includes('treatments.responsive must be an array'));

  const invalidQuery = { treatments: { purposes: {}, responsive: [{ query: null, rules: [] }] } };
  assert.ok(themeContractErrors(invalidQuery).includes('treatments.responsive[0].query must be a non-empty string'));
});

test('themeContractErrors validates treatments.dataScale', () => {
  const invalidColors = { treatments: { purposes: {}, responsive: [], dataScale: { colors: ['#fff'] } } };
  assert.ok(themeContractErrors(invalidColors).includes('treatments.dataScale.colors must contain at least two colors'));

  const invalidDeclarations = { treatments: { purposes: {}, responsive: [], dataScale: { colors: ['#000', '#fff'], declarations: [] } } };
  assert.ok(themeContractErrors(invalidDeclarations).includes('treatments.dataScale.declarations must contain CSS declarations'));
});

test('assertThemeContract throws on invalid theme', () => {
  assert.throws(() => assertThemeContract({ id: 'test' }), /Invalid theme test/);
});

test('assertThemeContract returns theme on success', () => {
  // A minimal valid theme
  const validTheme = {
    id: 'test',
    name: 'Test',
    description: 'Test theme',
    scheme: 'light',
    version: 1,
    font: 'sans-serif',
    headingFont: 'serif',
    border: '1px solid',
    radius: '4px',
    weight: '400',
    colors: {
      background: '#fff',
      surface: '#eee',
      raised: '#ddd',
      text: '#000',
      muted: '#444',
      line: '#ccc',
      accent: '#00f',
      accentText: '#fff',
      link: '#00c',
      error: '#f00',
      success: '#0f0',
      warning: '#fc0'
    },
    assets: [],
    icons: {
      style: 'pixel',
      ink: '#000',
      headings: false
    },
    treatments: {
      prelude: [],
      motifs: [],
      postlude: [],
      purposes: {},
      responsive: []
    }
  };

  assert.equal(assertThemeContract(validTheme), validTheme);
});
