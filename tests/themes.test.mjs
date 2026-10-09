import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES } from '../src/themes.js';
import { assertThemeContract, themeContractErrors } from '../src/theme-contract.js';
import { buildStyles } from '../src/styles.js';
import { contrastRatio, parseColor } from '../src/contrast.js';

test('every registered theme satisfies the declarative treatment contract', () => {
  for (const [id, theme] of Object.entries(THEMES)) {
    assert.equal(theme.id, id);
    assert.deepEqual(themeContractErrors(theme), []);
    assert.equal(assertThemeContract(theme), theme);
    for (const color of Object.values(theme.colors)) assert.ok(parseColor(color), `${id} contains invalid color ${color}`);
  }
});

test('the contract rejects remote assets and unknown treatment targets', () => {
  const theme = structuredClone(THEMES['terminal-vision']);
  theme.assets.push({ path: 'https://example.com/theme.webp' });
  theme.treatments.motifs.push({ target: 'arbitrarySelector', declarations: { color: '#fff' } });
  const errors = themeContractErrors(theme).join('\n');
  assert.match(errors, /packaged relative path/);
  assert.match(errors, /unknown target arbitrarySelector/);
});

test('theme base pairs meet normal-text contrast', () => {
  for (const theme of Object.values(THEMES)) {
    for (const [foreground, background] of [
      ['text', 'surface'], ['link', 'surface'], ['accentText', 'accent']
    ]) {
      const ratio = contrastRatio(parseColor(theme.colors[foreground]), parseColor(theme.colors[background]));
      assert.ok(ratio >= 4.5, `${theme.id} ${foreground}/${background} contrast was ${ratio}`);
    }
  }
});

test('generated treatments stay static and within startup/full size budgets', () => {
  for (const theme of Object.values(THEMES)) {
    const full = buildStyles(theme);
    const startup = buildStyles(theme, { startup: true });
    assert.ok(full.length <= 35000, `${theme.id} full stylesheet exceeded 35 KB`);
    assert.ok(startup.length <= 12000, `${theme.id} startup stylesheet exceeded 12 KB`);
    assert.ok(startup.length < full.length, `${theme.id} startup stylesheet was not compact`);
    for (const css of [full, startup]) {
      assert.doesNotMatch(css, /(?:^|[;{])animation(?:-[a-z-]+)?:/i, `${theme.id} introduced animation`);
      assert.doesNotMatch(css, /position:fixed/i, `${theme.id} introduced fixed paint`);
      assert.doesNotMatch(css, /@keyframes/i, `${theme.id} introduced keyframes`);
    }
  }
});
