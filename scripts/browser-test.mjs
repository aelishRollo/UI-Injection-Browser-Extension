import { chromium } from 'playwright';
import { parseColor, contrastRatio } from '../src/contrast.js';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { serveFixtures } from './serve.mjs';
import { chromiumPath } from './browser-path.mjs';

const results = [];
const errors = [];
const out = resolve('test-results');
await mkdir(out, { recursive: true });
const fixture = await serveFixtures();
const profile = await mkdtemp(join(tmpdir(), 'surface-browser-'));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: await chromiumPath(), headless: true, viewport: { width: 1280, height: 960 },
    args: [`--disable-extensions-except=${resolve('dist')}`, `--load-extension=${resolve('dist')}`, '--no-first-run']
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker', { timeout: 15000 });
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const set = patch => worker.evaluate(async patch => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, ...patch } });
  }, patch);
  const status = () => worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find(t => t.url?.startsWith('http://127.0.0.1:4173'));
    return chrome.tabs.sendMessage(tab.id, { type: 'status:get' }, { frameId: 0 });
  });
  const waitStatus = async expected => {
    for (let i = 0; i < 100; i++) {
      const actual = await status().catch(() => ({}));
      if (actual.state === 'error') throw new Error(actual.error);
      if (Object.entries(expected).every(([k, v]) => actual[k] === v)) return actual;
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Status timed out: ${JSON.stringify(await status())}; wanted ${JSON.stringify(expected)}`);
  };
  const check = async (name, run) => {
    const start = Date.now();
    await run(); results.push({ name, passed: true, durationMs: Date.now() - start });
    console.log(`PASS ${name}`);
  };
  const appearance = () => page.evaluate(() => {
    const properties = ['color', 'backgroundColor', 'fontFamily', 'borderTopWidth', 'borderTopStyle', 'boxShadow', 'display', 'position', 'transform', 'filter'];
    return Object.fromEntries(['body', 'h1', '#article', 'aside', '#selected', '#invalid', '#photo', '#logo', '#inline-logo', '#editor'].map(selector => {
      const style = getComputedStyle(document.querySelector(selector));
      return [selector, Object.fromEntries(properties.map(p => [p, style[p]]))];
    }));
  });
  await set({ enabled: false, corrections: false });
  await page.goto(fixture.url);
  await waitStatus({ state: 'disabled' });
  const original = await appearance();
  await page.screenshot({ path: join(out, 'original.png') });

  for (const renderer of ['simple', 'adaptive', 'contextual']) {
    for (const theme of ['terminal-vision', 'browser-archeology', 'liquid-dream']) {
      await check(`${renderer}/${theme}: apply, preserve media, isolate CSS, restore`, async () => {
        await set({ enabled: true, renderer, theme, corrections: false });
        const active = await waitStatus({ state: 'active', renderer, theme });
        await page.waitForTimeout(500);
        const themed = await appearance();
        assert.notEqual(themed.body.backgroundColor, original.body.backgroundColor);
        for (const selector of ['#photo', '#logo', '#inline-logo', '#editor']) {
          assert.equal(themed[selector].filter, original[selector].filter, `${selector} filter changed`);
        }
        assert.equal(themed['#article'].display, original['#article'].display);
        assert.equal(themed['#article'].position, original['#article'].position);
        assert.equal(themed['#article'].transform, original['#article'].transform);
        assert.equal(await page.locator('#icon-button').evaluate(el => getComputedStyle(el, '::before').content), '"☆"');
        assert.equal(await page.locator('#invalid').evaluate(el => getComputedStyle(el).borderTopStyle), 'double');
        assert.equal(await page.evaluate(() => [...document.styleSheets].some(sheet => {
          try { return [...sheet.cssRules].some(rule => /surface-terminal-drift-v1|surface-liquid-flow-v1|inset 0 3px 0/.test(rule.cssText)); } catch { return false; }
        })), false);
        // The exact accent must survive the adaptation engine's later updates.
        const expected = { 'terminal-vision': 'rgb(215, 255, 78)', 'browser-archeology': 'rgb(0, 0, 128)', 'liquid-dream': 'rgb(255, 106, 183)' }[theme];
        assert.equal(themed['#selected'].backgroundColor, expected);
        await page.screenshot({ path: join(out, `${renderer}-${theme}.png`) });
        results.push({ name: 'apply timing (includes worker/import wait)', renderer, theme, milliseconds: active.applyMs });
        await set({ enabled: false });
        await waitStatus({ state: 'disabled' });
        await page.waitForTimeout(100);
        assert.deepEqual(await appearance(), original, 'Disable did not restore original computed styles');
        assert.equal(await page.locator('style.darkreader').count(), 0, await page.locator('style.darkreader').evaluateAll(elements => elements.map(el => el.outerHTML).join('\n')));
      });
    }
  }

  await check('contextual renderer pairs known surfaces and preserves uncertain regions', async () => {
    await set({ enabled: true, renderer: 'contextual', theme: 'terminal-vision', corrections: false });
    const active = await waitStatus({ state: 'active', renderer: 'contextual', theme: 'terminal-vision' });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#retained-card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#retained-text').evaluate(el => getComputedStyle(el).color), 'rgb(21, 21, 21)');
    assert.equal(await page.locator('#overlay-heading').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#gradient-text').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#article').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(9, 26, 17)');
    assert.equal(await page.locator('#article p').evaluate(el => getComputedStyle(el).color), 'rgb(157, 255, 176)');
    assert.equal(await page.locator('#black-logo').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(246, 244, 239)');
    assert.equal(active.contextual.enabled, true);
    assert.ok(active.contextual.regions.content > 0);
    assert.ok(active.contextual.text.preserved >= 3);
    assert.equal(active.contextual.decorationBudget, 1);
    assert.equal(await page.locator('[data-surface-prominent-v1]').count(), 1);
    await page.locator('#add').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#dynamic article').getAttribute('data-surface-context-v1'), 'content');
    assert.equal(await page.locator('#dynamic article h3').getAttribute('data-surface-tone-v1'), 'theme');
    await page.locator('#dynamic').evaluate(element => element.replaceChildren());
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    assert.equal(await page.locator('[data-surface-context-v1],[data-surface-text-v1],[data-surface-tone-v1],[data-surface-confidence-v1],[data-surface-prominent-v1],[data-surface-ui-icon-v1]').count(), 0);
    assert.equal(await page.locator('[style*="--surface-original-"]').count(), 0);
  });

  await check('contextual foregrounds pass contrast on retained and alpha surfaces in every theme', async () => {
    const colorOf = selector => page.locator(selector).evaluate(el => getComputedStyle(el).color);
    for (const theme of ['terminal-vision', 'browser-archeology', 'liquid-dream']) {
      await set({ enabled: true, renderer: 'contextual', theme, corrections: false });
      await waitStatus({ state: 'active', renderer: 'contextual', theme });
      for (const [selector, background] of [['#low-contrast', '#fff'], ['#dark-contrast', '#111'], ['#alpha-contrast', 'rgb(159.375,159.375,159.375)']]) {
        const foreground = await colorOf(selector);
        assert.ok(contrastRatio(parseColor(foreground), parseColor(background)) >= 4.5, `${theme} ${selector}: ${foreground}`);
        assert.equal(await page.locator(selector).getAttribute('data-surface-pair-v1'), 'adjusted');
      }
      for (const [selector, reason] of [['#effect-text', 'effects'], ['#wide-color', 'color-space'], ['#gradient-text', 'image'], ['#pseudo-text', 'pseudo'], ['#fill-text', 'effects']]) {
        assert.equal(await page.locator(selector).getAttribute('data-surface-pair-v1'), reason);
      }
      const placeholder = await page.locator('#email').evaluate(el => ({ color: getComputedStyle(el, '::placeholder').color, background: getComputedStyle(el).backgroundColor }));
      assert.ok(contrastRatio(parseColor(placeholder.color), parseColor(placeholder.background)) >= 4.5);
      const selectedBackground = await page.locator('#nested-selected').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.ok(contrastRatio(parseColor(await colorOf('#nested-selected span')), parseColor(selectedBackground)) >= 4.5);
      await page.locator('#nested-hover').hover();
      const hoveredBackground = await page.locator('#nested-hover').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.ok(contrastRatio(parseColor(await colorOf('#nested-hover span')), parseColor(hoveredBackground)) >= 4.5);
      await page.locator('#nested-hover').evaluate(el => el.setAttribute('aria-pressed', 'true'));
      const pressedBackground = await page.locator('#nested-hover').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.ok(contrastRatio(parseColor(await colorOf('#nested-hover span')), parseColor(pressedBackground)) >= 4.5);
      await page.locator('#nested-hover').evaluate(el => el.removeAttribute('aria-pressed'));
      await page.mouse.move(0, 0);
      await page.locator('#dynamic').evaluate(el => {
        el.innerHTML = '<div style="background:white;color:#eee"><b id="dynamic-low">Dynamic retained surface text</b></div><p id="dynamic-page">Dynamic themed page text</p>';
      });
      await page.waitForTimeout(100);
      assert.ok(contrastRatio(parseColor(await colorOf('#dynamic-low')), parseColor('#fff')) >= 4.5);
      assert.equal(await page.locator('#dynamic-page').getAttribute('data-surface-tone-v1'), 'theme');
      await page.locator('#dynamic').evaluate(el => el.replaceChildren());
      await set({ enabled: false });
      await waitStatus({ state: 'disabled' });
      assert.equal(await colorOf('#low-contrast'), 'rgb(238, 238, 238)');
      assert.equal(await page.locator('[data-surface-pair-v1],[style*="--surface-readable-color-v1"]').count(), 0);
    }
  });

  await check('dynamic DOM, SPA navigation, keyboard focus and working controls', async () => {
    await set({ enabled: true, renderer: 'adaptive', theme: 'terminal-vision' });
    await waitStatus({ state: 'active', renderer: 'adaptive' });
    await page.locator('#add').click();
    assert.equal(await page.locator('#dynamic article h3').evaluate(el => getComputedStyle(el).color), 'rgb(157, 255, 176)');
    await page.locator('#navigate').click();
    assert.match(page.url(), /\/next$/);
    assert.equal(await page.locator('#article h2').textContent(), 'A different chapter');
    await page.locator('#email').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await page.locator('#subscribe').click();
    assert.equal(await page.locator('#email').getAttribute('aria-invalid'), 'true');
    await page.locator('#open-dialog').click();
    assert.equal(await page.locator('#dialog').evaluate(el => el.open), true);
    await page.locator('#close-dialog').click();
    assert.equal(await page.locator('#dialog').evaluate(el => el.open), false);
    for (const id of ['inline-update', 'sheet-update', 'adopted-update', 'new-shadow']) await page.locator(`#${id}`).click();
    await page.waitForTimeout(500);
    assert.equal(await page.locator('#selected').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(215, 255, 78)');
    assert.equal(await page.locator('#later-shadow-host article').count(), 1);
  });
  await check('one role correction works across all three themes', async () => {
    for (const theme of ['terminal-vision', 'browser-archeology', 'liquid-dream']) {
      await set({ renderer: 'simple', theme, corrections: true });
      await waitStatus({ state: 'active', theme, renderer: 'simple' });
      assert.equal(await page.locator('.fixture-error').evaluate(el => getComputedStyle(el).borderTopStyle), 'double');
      assert.equal(await page.locator('.fixture-success').evaluate(el => getComputedStyle(el).textDecorationStyle), 'solid');
      assert.equal(await page.locator('.fixture-action').evaluate(el => getComputedStyle(el).borderTopStyle), 'solid');
    }
  });
  await check('site disable propagates into HTTP frames and survives navigation', async () => {
    await set({ disabledHosts: ['127.0.0.1'] });
    await waitStatus({ state: 'disabled' });
    await page.waitForTimeout(200);
    const frame = page.frames().find(f => f.url().includes('frame.html'));
    assert.equal(await frame.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await page.reload();
    await waitStatus({ state: 'disabled' });
    await set({ disabledHosts: [] });
    await waitStatus({ state: 'active' });
  });
  await check('20 switches leave no residual style nodes and restore the current page', async () => {
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    const baseline = await appearance();
    const styleCount = await page.locator('style,link[rel="stylesheet"]').count();
    for (let i = 0; i < 20; i++) {
      const theme = ['terminal-vision', 'browser-archeology', 'liquid-dream'][i % 3];
      const renderer = ['simple', 'adaptive', 'contextual'][i % 3];
      await set({ enabled: true, theme, renderer });
      await waitStatus({ state: 'active', theme, renderer });
    }
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    await page.waitForTimeout(200);
    assert.deepEqual(await appearance(), baseline);
    assert.equal(await page.locator('style,link[rel="stylesheet"]').count(), styleCount);
    assert.equal(await page.evaluate(() => document.querySelector('#shadow-host').shadowRoot.querySelectorAll('.darkreader').length), 0);
  });
  await check('popup loads and changes persisted settings', async () => {
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 376, height: 600 });
    await popup.goto(`chrome-extension://${extensionId}/popup.html`);
    const waitStored = async expected => {
      for (let i = 0; i < 50; i++) {
        const value = await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings);
        if (Object.entries(expected).every(([key, expectedValue]) => value[key] === expectedValue)) return value;
        await page.waitForTimeout(50);
      }
      throw new Error(`Stored popup settings did not settle: ${JSON.stringify(expected)}`);
    };
    assert.ok(await popup.locator('#experiment > summary').evaluate(el => el.getBoundingClientRect().bottom <= 600), 'Experiment controls must be visible in the initial popup');
    await popup.locator('#experiment > summary').click();
    await popup.locator('#renderer').selectOption('contextual');
    await waitStored({ renderer: 'contextual' });
    await popup.locator('input[value="browser-archeology"]').check();
    const stored = await waitStored({ theme: 'browser-archeology', renderer: 'contextual' });
    assert.equal(stored.theme, 'browser-archeology');
    assert.equal(stored.renderer, 'contextual');
    await popup.screenshot({ path: join(out, 'popup.png') });
    await popup.close();
  });
  assert.deepEqual(errors, [], 'Page errors occurred');
  await writeFile(join(out, 'browser-results.json'), JSON.stringify({ browser: context.browser()?.version(), recordedAt: new Date().toISOString(), results, pageErrors: errors, limitations: ['Local fixture only; not evidence of broad website coverage.', 'Full expressive CSS does not cross shadow roots.', 'Performance timings include scheduling and do not isolate engine CPU.'] }, null, 2));
  await rm(join(out, 'browser-failure.json'), { force: true });
  console.log(`Completed ${results.filter(r => r.passed).length} browser checks. Artifacts in test-results/.`);
} catch (error) {
  await writeFile(join(out, 'browser-failure.json'), JSON.stringify({ error: error.stack, results, pageErrors: errors }, null, 2));
  throw error;
} finally {
  await context?.close();
  await fixture.close();
  await rm(profile, { recursive: true, force: true });
}
