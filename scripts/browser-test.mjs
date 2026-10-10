import { chromium } from 'playwright';
import { parseColor, contrastRatio } from '../src/contrast.js';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { serveFixtures } from './serve.mjs';
import { chromiumPath } from './browser-path.mjs';
import { THEME_IDS as REGISTERED_THEME_IDS } from '../src/themes.js';

const results = [];
const errors = [];
const themeIds = ['terminal-vision', ...REGISTERED_THEME_IDS.filter(theme => theme !== 'terminal-vision')];
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
  for (let i = 0; i < 100; i++) {
    const installed = await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings?.version === 2);
    if (installed) break;
    if (i === 99) throw new Error('Extension installation did not initialize settings');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  const extensionId = new URL(worker.url()).host;
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('crash', () => console.error('Chromium renderer crashed during browser test'));
  const set = patch => worker.evaluate(async patch => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, ...patch } });
  }, patch);
  const waitStartupStyle = async (theme = null) => {
    for (let i = 0; i < 100; i++) {
      const registered = await worker.evaluate(async () => chrome.scripting.getRegisteredContentScripts({ ids: ['surface-theme-startup-v1'] }));
      if ((!theme && registered.length === 0) || (theme && registered[0]?.css?.includes(`startup-${theme}.css`))) return registered[0] || null;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error(`Startup style did not synchronize for ${theme || 'disabled state'}`);
  };
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
  await set({ enabled: false });
  await waitStartupStyle();
  await page.goto(fixture.url);
  await waitStatus({ state: 'disabled' });
  const original = await appearance();
  const originalBrandBacking = await page.locator('.masthead').evaluate(element => getComputedStyle(element).backgroundColor);
  await page.screenshot({ path: join(out, 'original.png') });

  await check('full navigation starts with the selected theme treatment', async () => {
    await page.addInitScript(() => {
      window.__surfaceStartupFrames = [];
      const sample = () => {
        const root = document.documentElement;
        if (!root) return requestAnimationFrame(sample);
        const body = document.body;
        const title = document.querySelector('h1');
        const article = document.querySelector('article');
        const leftRail = document.querySelector('#startup-left-rail');
        const rightRail = document.querySelector('#startup-right-rail');
        window.__surfaceStartupFrames.push({
          time: Math.round(performance.now()),
          rootBackground: getComputedStyle(root).backgroundColor,
          bodyOpacity: body ? getComputedStyle(body).opacity : null,
          ready: root.hasAttribute('data-surface-ready-v2'),
          residentTheme: getComputedStyle(root).getPropertyValue('--surface-startup-theme').trim(),
          residentStyles: getComputedStyle(root).getPropertyValue('--surface-startup-styles-resident').trim(),
          activeTheme: root.getAttribute('data-surface-theme-v2'),
          userStyles: root.hasAttribute('data-surface-user-styles-v2'),
          themed: root.getAttribute('data-surface-context-v1') === 'page',
          shell: document.querySelector('#startup-shell')?.getAttribute('data-surface-context-v1') || null,
          shellBackground: document.querySelector('#startup-shell') ? getComputedStyle(document.querySelector('#startup-shell')).backgroundColor : null,
          leftRailContext: leftRail?.getAttribute('data-surface-context-v1') || null,
          leftRailPurpose: leftRail?.getAttribute('data-surface-purpose-v1') || null,
          leftRailBackground: leftRail ? getComputedStyle(leftRail).backgroundColor : null,
          rightRailContext: rightRail?.getAttribute('data-surface-context-v1') || null,
          rightRailPurpose: rightRail?.getAttribute('data-surface-purpose-v1') || null,
          rightRailBackground: rightRail ? getComputedStyle(rightRail).backgroundColor : null,
          articleContext: article?.getAttribute('data-surface-context-v1') || null,
          articlePresent: Boolean(article),
          titlePresent: Boolean(title),
          titlePurpose: title?.getAttribute('data-surface-purpose-v1') || null,
          titleTone: title?.getAttribute('data-surface-tone-v1') || null,
          titleBackground: title ? getComputedStyle(title).backgroundColor : null,
          titleBackgroundImage: title ? getComputedStyle(title).backgroundImage : null
        });
        if (!root.hasAttribute('data-surface-ready-v2')) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const expected = {
      'terminal-vision': { canvas: 'rgb(6, 17, 11)', rail: 'rgb(9, 26, 17)' },
      'browser-archeology': { canvas: 'rgb(0, 128, 128)', rail: 'rgb(255, 255, 255)', title: 'rgb(0, 0, 128)' },
      'liquid-dream': { canvas: 'rgb(248, 241, 231)', rail: 'rgb(255, 249, 241)', liquidTitle: true },
      'monochrome-signal': { canvas: 'rgb(5, 5, 5)', rail: 'rgb(242, 242, 242)' }
    };
    for (const [theme, colors] of Object.entries(expected)) {
      await set({ enabled: true, theme });
      await waitStartupStyle(theme);
      let navigationError;
      const navigation = page.goto(`${fixture.url}/slow.html`, { waitUntil: 'domcontentloaded' }).catch(error => { navigationError = error; });
      await page.waitForFunction(() => window.__surfaceStartupFrames?.some(frame => frame.ready));
      const firstVisible = await page.evaluate(() => window.__surfaceStartupFrames.find(frame => frame.ready));
      assert.equal(await page.evaluate(() => document.readyState), 'loading', `${theme} should reveal before a parser-blocking script finishes`);
      assert.equal(firstVisible.themed, true, `${theme} page context missing at reveal`);
      assert.equal(firstVisible.residentTheme, theme, `${theme} startup treatment was not resident at document_start`);
      assert.equal(firstVisible.residentStyles === '1' || firstVisible.userStyles, true, `${theme} had neither first-paint styles nor USER-origin styles at reveal`);
      assert.equal(firstVisible.activeTheme === theme || firstVisible.userStyles, true, `${theme} had neither its resident stylesheet nor USER-origin handoff active at reveal`);
      assert.equal(firstVisible.shell, 'shell', `${theme} shell context missing at reveal`);
      assert.equal(firstVisible.shellBackground, colors.canvas, `${theme} shell paint missing at reveal`);
      for (const side of ['left', 'right']) {
        assert.equal(firstVisible[`${side}RailContext`], 'chrome', `${theme} ${side} rail context missing at reveal`);
        assert.equal(firstVisible[`${side}RailPurpose`], 'navigation', `${theme} ${side} rail purpose missing at reveal`);
        assert.equal(firstVisible[`${side}RailBackground`], colors.rail, `${theme} ${side} rail paint missing at reveal`);
      }
      assert.equal(firstVisible.articleContext, 'content', `${theme} content classification missing at reveal`);
      assert.equal(firstVisible.titlePurpose, 'title', `${theme} title classification missing at reveal`);
      assert.equal(firstVisible.titleTone, 'theme', `${theme} title foreground missing at reveal`);
      if (colors.title) assert.equal(firstVisible.titleBackground, colors.title, `${theme} title motif missing at reveal`);
      if (colors.liquidTitle) assert.notEqual(firstVisible.titleBackgroundImage, 'none', `${theme} title motif missing at reveal`);
      await navigation;
      if (navigationError) throw navigationError;
      await waitStatus({ state: 'active', theme });
      const frames = await page.evaluate(() => window.__surfaceStartupFrames);
      assert.equal(frames.filter(frame => !frame.ready).every(frame => frame.residentTheme === theme), true, `${theme} selected startup token was not resident throughout startup: ${JSON.stringify(frames)}`);
      assert.equal(frames.filter(frame => frame.bodyOpacity !== '0').every(frame => frame.residentStyles === '1' || frame.userStyles), true, `${theme} exposed content without active theme styles: ${JSON.stringify(frames)}`);
      assert.equal(frames.filter(frame => !frame.ready).every(frame => frame.rootBackground === colors.canvas), true, `${theme} used the wrong startup canvas: ${JSON.stringify(frames)}`);
      assert.equal(frames.filter(frame => (frame.titlePresent || frame.articlePresent) && frame.bodyOpacity !== '0').some(frame =>
        !frame.themed || !frame.articleContext || !frame.titlePurpose || !frame.titleTone
      ), false, `${theme} exposed a placeholder or unclassified content frame: ${JSON.stringify(frames)}`);
      assert.equal(frames.at(-1).ready, true);
      assert.equal(frames.at(-1).themed, true);
    }
    await set({ enabled: false });
    await waitStartupStyle();
    await waitStatus({ state: 'disabled' });
    await page.goto(fixture.url);
    await waitStatus({ state: 'disabled' });
  });

  for (const theme of themeIds) {
      await check(`${theme}: apply, preserve media, isolate CSS, restore`, async () => {
        await set({ enabled: true, theme });
        const active = await waitStatus({ state: 'active', theme });
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
        assert.equal(await page.locator('#article').evaluate(el => getComputedStyle(el).animationName), 'none', `${theme} must not continuously animate semantic surfaces`);
        assert.equal(await page.locator('.grid > aside').evaluate(el => getComputedStyle(el).animationName), 'none', `${theme} must not continuously animate semantic surfaces`);
        assert.equal(await page.locator('.wordmark').evaluate(el => getComputedStyle(el).backgroundColor), originalBrandBacking,
          `${theme} brand backing must start from authored paint`);
        await page.locator('.wordmark').evaluate(element => element.classList.toggle('refresh-probe'));
        await page.waitForTimeout(100);
        assert.equal(await page.locator('.wordmark').evaluate(el => getComputedStyle(el).backgroundColor), originalBrandBacking,
          `${theme} brand backing must survive an incremental rescan`);
        const expected = { 'terminal-vision': 'rgb(215, 255, 78)', 'browser-archeology': 'rgb(0, 0, 128)', 'liquid-dream': 'rgb(255, 106, 183)', 'monochrome-signal': 'rgb(240, 61, 61)' }[theme];
        assert.equal(themed['#selected'].backgroundColor, expected);
        await page.screenshot({ path: join(out, `${theme}.png`) });
        results.push({ name: 'apply timing (includes worker/import wait)', theme, milliseconds: active.applyMs });
        await set({ enabled: false });
        await waitStatus({ state: 'disabled' });
        await page.waitForTimeout(100);
        assert.deepEqual(await appearance(), original, 'Disable did not restore original computed styles');
      });
  }

  await check('in-page theme changes keep content visible and hand off directly', async () => {
    await set({ enabled: true, theme: 'terminal-vision' });
    await waitStatus({ state: 'active', theme: 'terminal-vision' });
    assert.equal(await page.evaluate(() => typeof document.startViewTransition), 'function');
    const handoffTimes = [];
    let previous = 'terminal-vision';
    for (const theme of ['browser-archeology', 'liquid-dream', 'monochrome-signal', 'terminal-vision']) {
      await page.evaluate(() => {
        window.__surfaceSwitchFrames = [];
        window.__surfaceSamplingSwitch = true;
        const sample = () => {
          const root = document.documentElement;
          const body = document.body;
          window.__surfaceSwitchFrames.push({
            bodyOpacity: getComputedStyle(body).opacity,
            rootBackground: getComputedStyle(root).backgroundColor,
            switching: root.getAttribute('data-surface-switching-v2'),
            theme: root.getAttribute('data-surface-theme-v2'),
            pageContext: root.getAttribute('data-surface-context-v1')
          });
          if (window.__surfaceSamplingSwitch) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      });
      await set({ theme });
      const active = await waitStatus({ state: 'active', theme });
      handoffTimes.push({ theme, milliseconds: active.timings.revealedMs });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
        window.__surfaceSamplingSwitch = false;
        requestAnimationFrame(resolve);
      })));
      const frames = await page.evaluate(() => window.__surfaceSwitchFrames);
      assert.ok(frames.length >= 2, `${theme} switch sampling was incomplete: ${JSON.stringify(frames)}`);
      assert.equal(frames.every(frame => frame.bodyOpacity === '1'), true,
        `${theme} switch hid the page body: ${JSON.stringify(frames)}`);
      assert.equal(frames.every(frame => frame.switching === theme ||
        (frame.pageContext === 'page' && [previous, theme].includes(frame.theme))), true,
      `${theme} switch escaped the atomic handoff: ${JSON.stringify(frames)}`);
      assert.equal(frames.at(-1).bodyOpacity, '1');
      assert.equal(frames.at(-1).theme, theme);
      assert.equal(frames.at(-1).pageContext, 'page');
      previous = theme;
    }
    results.push({ name: 'visible theme handoff timing', samples: handoffTimes });
  });

  await check('unified renderer pairs known surfaces and preserves uncertain regions', async () => {
    await set({ enabled: true, theme: 'terminal-vision' });
    const active = await waitStatus({ state: 'active', theme: 'terminal-vision' });
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#retained-card').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#retained-text').evaluate(el => getComputedStyle(el).color), 'rgb(21, 21, 21)');
    assert.equal(await page.locator('#overlay-heading').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#media-solid-action').getAttribute('data-surface-context-v1'), 'control');
    assert.equal(await page.locator('#media-solid-action').getAttribute('data-surface-pair-v1'), 'control');
    assert.equal(await page.locator('#authored-color-title').getAttribute('data-surface-purpose-v1'), null);
    assert.equal(await page.locator('#authored-color-title').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#gradient-text').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('main').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(9, 26, 17)');
    assert.equal(await page.locator('#article').evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    assert.equal(await page.locator('#article p').evaluate(el => getComputedStyle(el).color), 'rgb(157, 255, 176)');
    assert.equal(await page.locator('#black-logo').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(246, 244, 239)');
    assert.equal(active.renderer.enabled, true);
    assert.ok(active.renderer.regions.content > 0);
    assert.ok(active.renderer.text.preserved >= 3);
    await page.locator('#add').click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#dynamic article').getAttribute('data-surface-context-v1'), 'content');
    assert.equal(await page.locator('#dynamic article h3').getAttribute('data-surface-tone-v1'), 'theme');
    await page.locator('#dynamic').evaluate(element => element.replaceChildren());
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    assert.equal(await page.locator('[data-surface-context-v1],[data-surface-text-v1],[data-surface-tone-v1],[data-surface-confidence-v1],[data-surface-ui-icon-v1]').count(), 0);
    assert.equal(await page.locator('[style*="--surface-original-"]').count(), 0);
  });

  await check('unified foregrounds pass contrast on retained and alpha surfaces in every theme', async () => {
    const colorOf = selector => page.locator(selector).evaluate(el => getComputedStyle(el).color);
    for (const theme of themeIds) {
      await set({ enabled: true, theme });
      await waitStatus({ state: 'active', theme });
      for (const [selector, background] of [['#low-contrast', '#fff'], ['#dark-contrast', '#111'], ['#alpha-contrast', 'rgb(159.375,159.375,159.375)']]) {
        const foreground = await colorOf(selector);
        assert.ok(contrastRatio(parseColor(foreground), parseColor(background)) >= 4.5, `${theme} ${selector}: ${foreground}`);
        assert.equal(await page.locator(selector).getAttribute('data-surface-pair-v1'), 'adjusted');
      }
      for (const [selector, reason] of [['#effect-text', 'effects'], ['#wide-color', 'color-space'], ['#gradient-text', 'image'], ['#pseudo-text', 'pseudo'], ['#fill-text', 'effects']]) {
        assert.equal(await page.locator(selector).getAttribute('data-surface-pair-v1'), reason);
      }
      assert.equal(await page.locator('#authored-color-title').getAttribute('data-surface-tone-v1'), 'preserve');
      assert.equal(await colorOf('#authored-color-title'), 'rgb(255, 255, 255)', `${theme} must preserve a readable heading on an authored colored card`);
      assert.equal(await page.locator('#filled-chrome').getAttribute('data-surface-purpose-v1'), 'navigation');
      for (const selector of ['#filled-chrome-link', '#filled-chrome-copy']) {
        const pair = await page.locator(selector).evaluate(element => {
          const style = getComputedStyle(element);
          return { color: style.color, fill: style.webkitTextFillColor, background: getComputedStyle(element.closest('#filled-chrome')).backgroundColor };
        });
        assert.equal(pair.fill, pair.color, `${theme} ${selector} glyph fill must follow its resolved foreground`);
        assert.ok(contrastRatio(parseColor(pair.fill), parseColor(pair.background)) >= 4.5, `${theme} ${selector}: ${pair.fill} on ${pair.background}`);
        assert.equal(await page.locator(selector).getAttribute('data-surface-pair-v1'), 'theme');
      }
      await page.locator('#filled-chrome-link').evaluate(element => { element.textContent = 'Updated support'; });
      await page.waitForTimeout(100);
      const updatedChromeLink = await page.locator('#filled-chrome-link').evaluate(element => {
        const style = getComputedStyle(element);
        return { color: style.color, fill: style.webkitTextFillColor, background: getComputedStyle(element.closest('#filled-chrome')).backgroundColor };
      });
      assert.equal(updatedChromeLink.fill, updatedChromeLink.color, `${theme} incrementally rescanned glyph fill`);
      assert.ok(contrastRatio(parseColor(updatedChromeLink.fill), parseColor(updatedChromeLink.background)) >= 4.5,
        `${theme} incrementally rescanned chrome text: ${updatedChromeLink.fill} on ${updatedChromeLink.background}`);
      assert.equal(await page.locator('#filled-chrome-link').getAttribute('data-surface-pair-v1'), 'theme');
      await page.locator('#filled-chrome').evaluate(element => {
        element.style.opacity = '.5';
        element.querySelector('#filled-chrome-copy').textContent += ' Updated during animation.';
      });
      await page.waitForTimeout(100);
      await page.locator('#filled-chrome').evaluate(element => { element.style.opacity = '1'; });
      await page.waitForTimeout(350);
      const settledChromeCopy = await page.locator('#filled-chrome-copy').evaluate(element => {
        const style = getComputedStyle(element);
        return { color: style.color, fill: style.webkitTextFillColor, background: getComputedStyle(element.closest('#filled-chrome')).backgroundColor };
      });
      assert.equal(settledChromeCopy.fill, settledChromeCopy.color, `${theme} settled animation glyph fill`);
      assert.ok(contrastRatio(parseColor(settledChromeCopy.fill), parseColor(settledChromeCopy.background)) >= 4.5,
        `${theme} settled animation chrome text: ${settledChromeCopy.fill} on ${settledChromeCopy.background}`);
      assert.equal(await page.locator('#filled-chrome-copy').getAttribute('data-surface-pair-v1'), 'theme');
      const placeholder = await page.locator('#email').evaluate(el => ({ color: getComputedStyle(el, '::placeholder').color, background: getComputedStyle(el).backgroundColor }));
      assert.ok(contrastRatio(parseColor(placeholder.color), parseColor(placeholder.background)) >= 4.5);
      const selectedBackground = await page.locator('#nested-selected').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.ok(contrastRatio(parseColor(await colorOf('#nested-selected span')), parseColor(selectedBackground)) >= 4.5);
      await page.locator('#nested-hover').hover();
      const hoveredBackground = await page.locator('#nested-hover').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.ok(contrastRatio(parseColor(await colorOf('#nested-hover span')), parseColor(hoveredBackground)) >= 4.5);
      assert.equal(await page.locator('#nested-hover span').evaluate(el => getComputedStyle(el).webkitTextFillColor), await colorOf('#nested-hover span'));
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
      assert.equal(await page.locator('#filled-chrome').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(17, 17, 17)');
      assert.equal(await page.locator('#filled-chrome-copy').evaluate(el => getComputedStyle(el).webkitTextFillColor), 'rgb(255, 255, 255)');
      assert.equal(await page.locator('[data-surface-pair-v1],[style*="--surface-readable-color-v1"]').count(), 0);
    }
  });

  await check('reading hierarchy separates sections, fact panels, data and fields', async () => {
    await set({ enabled: false });
    await page.goto(`${fixture.url}/roles.html`);
    await waitStatus({ state: 'disabled' });
    const snapshot = () => page.locator('#reading,#chapter,#heading-group,#facts,#data,#visualization,#visualization-title,#visualization-summary,#input,#painted-title,#untitled-panel,#composite-shell,#composite-landing,#neutral-panel-one,#neutral-panel-two,#neutral-gradient-section,#transparent-gradient-section,#neutral-linked-card,#large-mark-card,.product-logo').evaluateAll(elements => elements.map(el => {
      const s = getComputedStyle(el);
      return [el.id, s.backgroundColor, s.backgroundImage, s.borderTopWidth, s.boxShadow, s.color];
    }));
    const baseline = await snapshot();
    const baselineTableParts = await page.locator('#data thead,#data tbody,#data th,#data td').evaluateAll(elements =>
      elements.map(element => [element.tagName, element.textContent.trim(), getComputedStyle(element).backgroundColor, getComputedStyle(element).color]));
    const baselineButtons = await page.locator('button').count();
    const originalIcon = await page.locator('#menu-icon').evaluate(el => getComputedStyle(el).maskImage);
    for (const theme of themeIds) {
      await page.locator('#settling-neutral-panel').evaluate(element => { element.style.opacity = '.5'; });
      await set({ enabled: true, theme });
      await waitStatus({ state: 'active', theme });
      for (const [id, purpose] of Object.entries({ reading: 'reading', chapter: 'section', facts: 'panel', 'untitled-panel': 'panel', data: 'data', input: 'field', 'heading-group': 'section-heading', 'composite-landing': 'panel', 'neutral-panel-one': 'panel', 'neutral-panel-two': 'panel' })) {
        assert.equal(await page.locator(`#${id}`).getAttribute('data-surface-purpose-v1'), purpose);
      }
      const tableColors = {
        'terminal-vision': { body: 'rgb(9, 26, 17)', header: 'rgb(16, 45, 29)' },
        'browser-archeology': { body: 'rgb(255, 255, 255)', header: 'rgb(212, 208, 200)' },
        'liquid-dream': { body: 'rgb(255, 249, 241)', header: 'rgb(217, 245, 239)' },
        'monochrome-signal': { body: 'rgb(242, 242, 242)', header: 'rgb(191, 191, 191)' }
      }[theme];
      for (const selector of ['#data thead', '#data th']) {
        assert.equal(await page.locator(selector).first().getAttribute('data-surface-table-part-v1'), 'header');
        assert.equal(await page.locator(selector).first().evaluate(element => getComputedStyle(element).backgroundColor), tableColors.header);
      }
      assert.notEqual(await page.locator('#data th').first().evaluate(element => getComputedStyle(element).backgroundImage), 'none',
        'compact sortable-header imagery must survive neutral backing treatment');
      for (const selector of ['#data tbody', '#data td:not(.encoded-cell)']) {
        assert.equal(await page.locator(selector).first().getAttribute('data-surface-table-part-v1'), 'body');
        assert.equal(await page.locator(selector).first().evaluate(element => getComputedStyle(element).backgroundColor), tableColors.body);
      }
      assert.equal(await page.locator('#data .encoded-cell').getAttribute('data-surface-table-part-v1'), null,
        'chromatic data cells must stay outside neutral table-paint ownership');
      assert.equal(await page.locator('#data .encoded-cell').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(161, 38, 54)');
      for (const selector of ['#data th', '#data td:not(.encoded-cell)']) {
        const pair = await page.locator(selector).first().evaluate(element => [getComputedStyle(element).color, getComputedStyle(element).backgroundColor]);
        assert.ok(contrastRatio(parseColor(pair[0]), parseColor(pair[1])) >= 4.5, `${theme} ${selector}: ${pair.join(' on ')}`);
      }
      assert.equal(await page.locator('#composite-shell').getAttribute('data-surface-context-v1'), 'shell');
      for (const selector of ['#neutral-panel-one', '#neutral-panel-two']) {
        assert.equal(await page.locator(selector).getAttribute('data-surface-context-v1'), 'content');
        assert.equal(await page.locator(selector).getAttribute('data-surface-evidence-v1'), 'neutral-heading-panel');
      }
      assert.equal(await page.locator('#neutral-gradient-section').getAttribute('data-surface-context-v1'), 'content');
      assert.equal(await page.locator('#neutral-gradient-section').getAttribute('data-surface-purpose-v1'), 'section');
      assert.equal(await page.locator('#transparent-gradient-section').getAttribute('data-surface-context-v1'), null,
        'an all-translucent gradient must not become a theme-owned surface');
      assert.equal(await page.locator('#neutral-linked-card').getAttribute('data-surface-context-v1'), 'content');
      assert.equal(await page.locator('#neutral-linked-card').getAttribute('data-surface-evidence-v1'), 'neutral-heading-card');
      assert.equal(await page.locator('#large-mark-card').getAttribute('data-surface-context-v1'), null, 'a large labelled card containing a logo-like icon must not become a brand');
      assert.equal(await page.locator('.product-logo').getAttribute('data-surface-context-v1'), 'brand');
      assert.equal(await page.locator('#settling-neutral-panel').getAttribute('data-surface-context-v1'), null, 'an active opacity effect stays authored');
      await page.locator('#settling-neutral-panel p').evaluate(element => { element.textContent += ' Updated while revealing.'; });
      await page.waitForTimeout(50);
      await page.locator('#settling-neutral-panel').evaluate(element => { element.style.opacity = '1'; });
      await page.waitForTimeout(350);
      assert.equal(await page.locator('#settling-neutral-panel').getAttribute('data-surface-context-v1'), 'content');
      assert.equal(await page.locator('#settling-neutral-panel').getAttribute('data-surface-evidence-v1'), 'neutral-heading-panel');
      assert.equal(await page.locator('#visualization').getAttribute('data-surface-context-v1'), 'visualization');
      assert.equal(await page.locator('#visualization').getAttribute('data-surface-purpose-v1'), 'visualization');
      assert.equal(await page.locator('#visualization').getAttribute('data-surface-evidence-v1'), 'labelled-data-graphic');
      assert.equal(await page.locator('#visualization').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      for (const selector of ['#visualization-title', '#visualization-summary']) {
        const pair = await page.locator(selector).evaluate(el => [getComputedStyle(el).color, getComputedStyle(el.closest('#visualization')).backgroundColor]);
        assert.ok(contrastRatio(parseColor(pair[0]), parseColor(pair[1])) >= 4.5, `${theme} ${selector}: ${pair.join(' on ')}`);
      }
      assert.equal(await page.locator('#visualization svg text').first().evaluate(el => getComputedStyle(el).fill), 'rgb(32, 33, 34)');
      assert.equal(await page.locator('#chapter').evaluate(el => getComputedStyle(el).boxShadow), 'none');
      assert.equal(await page.locator('#chapter').evaluate(el => getComputedStyle(el).borderTopWidth), '0px');
      assert.equal(await page.locator('#painted-title').getAttribute('data-surface-purpose-v1'), null);
      assert.equal(await page.locator('#protected [data-surface-purpose-v1]').count(), 0);
      if (theme === 'liquid-dream') {
        for (const selector of ['#shell > header', '#heading-group', '#facts']) {
          assert.match(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundImage), /linear-gradient/);
        }
        // All light rainbow stops must support theme ink, including links.
        for (const stop of ['#ffc6e2','#ffe5a3','#fff2a6','#a3ecda','#b8d9ff','#dfc5ff']) {
          for (const ink of ['#201928', '#274bb5']) assert.ok(contrastRatio(parseColor(ink), parseColor(stop)) >= 4.5);
        }
      } else if (theme === 'browser-archeology') {
        assert.equal(await page.locator('#input').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
        assert.equal(await page.locator('#brand-module-button').getAttribute('data-surface-context-v1'), 'control', 'design-system Brand class must not imply a protected brand mark');
        assert.equal(await page.locator('#brand-module-label').getAttribute('data-surface-tone-v1'), 'control');
        assert.equal(await page.locator('#styled-action').getAttribute('data-surface-context-v1'), 'control', 'visually button-like links should own a control foreground/background pair');
        assert.equal(await page.locator('#styled-action span').getAttribute('data-surface-tone-v1'), 'control');
        const pair = await page.locator('#brand-module-button').evaluate(el => [getComputedStyle(el.querySelector('span')).color, getComputedStyle(el).backgroundColor]);
        assert.ok(contrastRatio(parseColor(pair[0]), parseColor(pair[1])) >= 4.5, `unified nested control label: ${pair.join(' on ')}`);
      }
      assert.equal(await page.locator('#shell').getAttribute('data-surface-context-v1'), 'shell');
      assert.equal(await page.locator('#utility-fade').getAttribute('data-surface-navigation-fade-v1'), 'after');
      const fadeColor = { 'terminal-vision': 'rgb(9, 26, 17)', 'browser-archeology': 'rgb(212, 208, 200)', 'liquid-dream': 'rgb(255, 249, 241)', 'monochrome-signal': 'rgb(242, 242, 242)' }[theme];
      assert.ok((await page.locator('#utility-fade').evaluate(el => getComputedStyle(el, '::after').backgroundImage)).includes(fadeColor), `${theme} navigation fade should end in ${fadeColor}`);
      for (const role of ['menu', 'language', 'search', 'more', 'home', 'history', 'settings', 'download']) {
        assert.equal(await page.locator(`#${role}-icon`).getAttribute('data-surface-glyph-v1'), role);
        assert.equal(await page.locator(`#${role}-icon`).evaluate(el => getComputedStyle(el).maskImage), 'none');
      }
      assert.equal(await page.locator('#unknown-icon').getAttribute('data-surface-glyph-v1'), null);
      assert.equal(await page.locator('#brand-icon').getAttribute('data-surface-glyph-v1'), null);
      assert.equal(await page.locator('.original-heading').evaluate(el => getComputedStyle(el, '::before').content), '"☆"');
      const titlePair = await page.locator('h1').evaluate(el => ({color:getComputedStyle(el.querySelector('span')).color,background:getComputedStyle(el).backgroundColor}));
      if (theme === 'browser-archeology') {
        assert.equal(titlePair.background, 'rgb(0, 0, 128)');
        assert.ok(contrastRatio(parseColor(titlePair.color),parseColor(titlePair.background)) >= 4.5, `title contrast: ${titlePair.color} on ${titlePair.background}`);
        assert.equal(await page.locator('#reading').getAttribute('data-surface-window-v1'), 'titled');
        assert.equal(await page.locator('#facts').getAttribute('data-surface-window-v1'), 'titled');
        assert.equal(await page.locator('#untitled-panel').getAttribute('data-surface-window-v1'), 'frame');
        assert.equal(await page.locator('#utility-rail').getAttribute('data-surface-window-v1'), 'frame');
        assert.equal(await page.locator('#utility-navigation').getAttribute('data-surface-window-v1'), null, 'nested navigation must not create a second window');
        assert.equal(await page.locator('h1').getAttribute('data-surface-window-title-v1'), 'reading');
        assert.equal(await page.locator('#facts th').first().getAttribute('data-surface-window-title-v1'), 'panel');
        assert.match(await page.locator('h1').evaluate(el => getComputedStyle(el).backgroundImage), /data:image\/svg\+xml/);
        assert.equal(await page.locator('h1').evaluate(el => getComputedStyle(el).backgroundPosition.split(', ')[1]), 'calc(100% - 2px) 2px', 'window controls stay at the top of a tall title region');
        assert.equal(await page.locator('#untitled-panel').evaluate(el => getComputedStyle(el).paddingTop), '25px');
        assert.equal(await page.locator('button').count(), baselineButtons, 'window decoration must not create fake controls');
        await page.setViewportSize({ width: 320, height: 640 });
        assert.equal(await page.locator('h1').evaluate(el => (getComputedStyle(el).backgroundImage.match(/url\(/g) || []).length), 2, 'narrow title bars retain scaled inactive window furniture');
        await page.setViewportSize({ width: 1280, height: 960 });
      }
      if (theme === 'terminal-vision') {
        assert.equal(await page.locator('#utility-rail').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(9, 26, 17)');
        assert.equal(await page.locator('h1 span').getAttribute('data-surface-tone-v1'), 'theme');
        assert.ok(contrastRatio(parseColor(titlePair.color),parseColor('#091a11')) >= 4.5);
        assert.equal(await page.locator('#shell').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(6, 17, 11)');
        assert.equal(await page.locator('#reading').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(9, 26, 17)');
        assert.equal(await page.locator('#composite-shell').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(6, 17, 11)');
        for (const selector of ['#neutral-panel-one', '#neutral-panel-two']) {
          assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(9, 26, 17)');
        }
        await page.locator('#composite-landing').evaluate(element => element.classList.add('stateful-composite'));
        await page.waitForTimeout(100);
        assert.equal(await page.locator('#composite-landing').getAttribute('data-surface-purpose-v1'), 'panel', 'class-driven rescans must ignore Surface-owned background paint');
        assert.deepEqual(await page.locator('#activity-grid [data-level]').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundColor)), ['rgb(16, 45, 29)','rgb(23, 98, 68)','rgb(47, 158, 85)','rgb(126, 234, 148)','rgb(215, 255, 78)']);
        assert.equal(await page.locator('#activity-summary').getAttribute('data-surface-context-v1'), 'control');
        const pair = await page.locator('#activity-summary').evaluate(el => [getComputedStyle(el.querySelector('span')).color, getComputedStyle(el).backgroundColor]);
        assert.ok(contrastRatio(parseColor(pair[0]), parseColor(pair[1])) >= 4.5, `unified activity summary: ${pair.join(' on ')}`);
      }
      await page.locator('#menu').click();
      assert.equal(await page.locator('#menu').getAttribute('aria-expanded'), 'true');
      await page.locator('#menu').click();
      await page.locator('label[for="language-toggle"]').click();
      assert.equal(await page.locator('#language-toggle').isChecked(), true);
      await page.locator('label[for="language-toggle"]').click();
      await page.locator('#dynamic').evaluate(el => { el.innerHTML = '<section id="late-section"><h2>Added chapter</h2><p>A new article section should join the existing document without becoming another framed panel.</p><button id="late-action">New action</button></section>'; });
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#late-section').getAttribute('data-surface-purpose-v1'), 'section');
      assert.equal(await page.locator('#late-action').getAttribute('data-surface-context-v1'), 'control');
      await page.locator('#dynamic').evaluate(el => el.replaceChildren());
      const ownershipSnapshot = await page.evaluate(() => {
        const shell = document.querySelector('#shell');
        const rail = document.querySelector('#utility-rail');
        return {
          theme: document.documentElement.getAttribute('data-surface-theme-v2'),
          userStyles: document.documentElement.hasAttribute('data-surface-user-styles-v2'),
          rootContext: document.documentElement.getAttribute('data-surface-context-v1'),
          bodyContext: document.body.getAttribute('data-surface-context-v1'),
          shellContext: shell.getAttribute('data-surface-context-v1'),
          railPurpose: rail.getAttribute('data-surface-purpose-v1'),
          rootBackground: getComputedStyle(document.documentElement).backgroundColor,
          shellBackground: getComputedStyle(shell).backgroundColor,
          railBackground: getComputedStyle(rail).backgroundColor
        };
      });
      await page.evaluate(() => {
        document.documentElement.removeAttribute('data-surface-theme-v2');
        document.documentElement.removeAttribute('data-surface-user-styles-v2');
        document.documentElement.removeAttribute('data-surface-context-v1');
        document.body.removeAttribute('data-surface-context-v1');
        document.querySelector('#shell').removeAttribute('data-surface-context-v1');
        document.querySelector('#utility-rail').removeAttribute('data-surface-purpose-v1');
      });
      await page.waitForFunction(theme =>
        document.documentElement.getAttribute('data-surface-theme-v2') === theme &&
        document.documentElement.hasAttribute('data-surface-user-styles-v2') &&
        document.documentElement.getAttribute('data-surface-context-v1') === 'page' &&
        document.body.getAttribute('data-surface-context-v1') === 'page' &&
        document.querySelector('#shell')?.getAttribute('data-surface-context-v1') === 'shell' &&
        document.querySelector('#utility-rail')?.getAttribute('data-surface-purpose-v1') === 'navigation', theme);
      assert.deepEqual(await page.evaluate(() => {
        const shell = document.querySelector('#shell');
        const rail = document.querySelector('#utility-rail');
        return {
          theme: document.documentElement.getAttribute('data-surface-theme-v2'),
          userStyles: document.documentElement.hasAttribute('data-surface-user-styles-v2'),
          rootContext: document.documentElement.getAttribute('data-surface-context-v1'),
          bodyContext: document.body.getAttribute('data-surface-context-v1'),
          shellContext: shell.getAttribute('data-surface-context-v1'),
          railPurpose: rail.getAttribute('data-surface-purpose-v1'),
          rootBackground: getComputedStyle(document.documentElement).backgroundColor,
          shellBackground: getComputedStyle(shell).backgroundColor,
          railBackground: getComputedStyle(rail).backgroundColor
        };
      }), ownershipSnapshot, `${theme} must repair stripped outer paint ownership before the next frame`);
      await page.evaluate(() => document.body.removeAttribute('data-surface-context-v1'));
      await page.waitForFunction(() => document.body.getAttribute('data-surface-context-v1') === 'page');
      assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), ownershipSnapshot.rootBackground,
        `${theme} must not treat surviving theme canvas paint as an authored body background`);
      await page.screenshot({ path: join(out, `hierarchy-${theme}.png`) });
      await set({ enabled: false });
      await waitStatus({ state: 'disabled' });
      assert.deepEqual(await snapshot(), baseline);
      assert.deepEqual(await page.locator('#data thead,#data tbody,#data th,#data td').evaluateAll(elements =>
        elements.map(element => [element.tagName, element.textContent.trim(), getComputedStyle(element).backgroundColor, getComputedStyle(element).color])), baselineTableParts);
      assert.equal(await page.locator('[data-surface-purpose-v1],[data-surface-evidence-v1],[data-surface-heading-glyph-v1],[data-surface-window-v1],[data-surface-window-title-v1],[data-surface-navigation-fade-v1],[data-surface-table-part-v1]').count(), 0);
      assert.equal(await page.locator('#menu-icon').getAttribute('data-surface-glyph-v1'), 'authored');
      assert.equal(await page.locator('#menu-icon').evaluate(el => getComputedStyle(el).maskImage), originalIcon);
      assert.equal(await page.locator('[data-surface-glyph-v1]').count(), 1);
    }
    await page.goto(fixture.url);
    await waitStatus({ state: 'disabled' });
  });

  await check('dynamic DOM, SPA navigation, keyboard focus and working controls', async () => {
    await set({ enabled: true, theme: 'terminal-vision' });
    await waitStatus({ state: 'active', theme: 'terminal-vision' });
    await page.locator('#add').click();
    assert.equal(await page.locator('#dynamic article h3').evaluate(el => getComputedStyle(el).color), 'rgb(157, 255, 176)');
    await page.locator('#navigate').click();
    assert.match(page.url(), /\/next$/);
    assert.equal(await page.locator('#article h2').textContent(), 'A different chapter');
    await page.locator('#dynamic').evaluate(root => {
      const state = document.createElement('div');
      state.id = 'dynamic-state';
      state.className = 'dynamic-light';
      state.textContent = 'Stateful surface';
      root.append(state);
    });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#dynamic-state').getAttribute('data-surface-pair-v1'), 'retained');
    await page.locator('#dynamic-state').evaluate(element => { element.className = 'dynamic-dark'; });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('#dynamic-state').evaluate(el => getComputedStyle(el).color), 'rgb(238, 238, 238)');
    assert.equal(await page.locator('#dynamic-state').getAttribute('data-surface-pair-v1'), 'retained');
    const trackedBeforeRemoval = (await status()).renderer.trackedElements;
    await page.locator('#dynamic-state').evaluate(element => element.remove());
    await page.waitForTimeout(100);
    assert.ok((await status()).renderer.trackedElements < trackedBeforeRemoval, 'detached themed nodes must be released');
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
  await check('one role correction works across all themes', async () => {
    for (const theme of themeIds) {
      await set({ theme });
      await waitStatus({ state: 'active', theme });
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
  await check('in-page theme picker stays readable, persistent and synchronized', async () => {
    await set({ enabled: true, theme: 'terminal-vision', disabledHosts: [] });
    await page.goto(fixture.url);
    await waitStatus({ state: 'active', theme: 'terminal-vision' });
    const picker = page.locator('#surface-theme-picker-v1');
    await picker.locator('.toggle').click();
    assert.equal(await picker.locator('.panel').isVisible(), true);
    assert.equal(await picker.locator('.option').count(), themeIds.length);
    const swatchBox = await picker.locator('.swatch').first().boundingBox();
    assert.equal(Math.round(swatchBox?.width || 0), 32);
    assert.equal(Math.round(swatchBox?.height || 0), 32);

    for (const theme of themeIds) {
        await set({ enabled: true, theme });
        await waitStatus({ state: 'active', theme });
        const pairs = await picker.evaluate(host => {
          const root = host.shadowRoot;
          const pair = (foreground, background) => [getComputedStyle(root.querySelector(foreground)).color, getComputedStyle(root.querySelector(background)).backgroundColor];
          return [
            ['heading', ...pair('h2', '.panel')],
            ['intro', ...pair('.intro', '.panel')],
            ['power label', ...pair('.power-label', '.power')],
            ['power state', ...pair('.power-state', '.power')],
            ...[...root.querySelectorAll('.option')].flatMap((option, index) => {
              const background = getComputedStyle(option).backgroundColor;
              return [
                [`option ${index + 1} name`, getComputedStyle(option.querySelector('.option-name')).color, background],
                [`option ${index + 1} description`, getComputedStyle(option.querySelector('.option-description')).color, background]
              ];
            })
          ];
        });
        for (const [label, foreground, background] of pairs) {
          const foregroundColor = parseColor(foreground);
          const backgroundColor = parseColor(background);
          assert.ok(foregroundColor && backgroundColor, `${theme} ${label}: unsupported ${foreground} on ${background}`);
          assert.ok(contrastRatio(foregroundColor, backgroundColor) >= 4.5, `${theme} ${label}: ${foreground} on ${background}`);
        }
        await page.screenshot({ path: join(out, `theme-picker-${theme}.png`) });
    }

    await set({ enabled: true, theme: 'terminal-vision' });
    await waitStatus({ state: 'active', theme: 'terminal-vision' });
    assert.equal(await picker.locator('[data-theme-id="terminal-vision"]').getAttribute('aria-pressed'), 'true');
    await picker.locator('[data-theme-id="liquid-dream"]').click();
    await waitStatus({ state: 'active', theme: 'liquid-dream' });
    assert.equal(await picker.locator('[data-theme-id="liquid-dream"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await picker.locator('.power').getAttribute('aria-checked'), 'true');
    await picker.locator('.power').click();
    await waitStatus({ state: 'disabled' });
    assert.equal(await picker.evaluate(element => getComputedStyle(element).display), 'block');
    assert.equal(await picker.locator('.panel').isVisible(), true);
    assert.equal(await picker.locator('.power').getAttribute('aria-checked'), 'false');
    await picker.locator('.power').click();
    await waitStatus({ state: 'active', theme: 'liquid-dream' });
    assert.equal(await picker.locator('.panel').isVisible(), true);
    assert.equal(await picker.locator('.power').getAttribute('aria-checked'), 'true');

    const panelBox = await picker.locator('.panel').boundingBox();
    assert.ok(panelBox && panelBox.x >= 0 && panelBox.y >= 0 && panelBox.x + panelBox.width <= 1280 && panelBox.y + panelBox.height <= 960);
    await page.screenshot({ path: join(out, 'theme-picker-open.png') });
    await page.setViewportSize({ width: 320, height: 640 });
    const narrowPanelBox = await picker.locator('.panel').boundingBox();
    assert.ok(narrowPanelBox && narrowPanelBox.x >= 0 && narrowPanelBox.y >= 0 && narrowPanelBox.x + narrowPanelBox.width <= 320 && narrowPanelBox.y + narrowPanelBox.height <= 640);
    await page.setViewportSize({ width: 1280, height: 960 });
    const frame = page.frames().find(item => item.url().includes('frame.html'));
    assert.equal(await frame.locator('#surface-theme-picker-v1').count(), 0);
    await page.keyboard.press('Escape');
    assert.equal(await picker.locator('.panel').isHidden(), true);
  });
  await check('20 switches leave no residual style nodes and restore the current page', async () => {
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    const baseline = await appearance();
    const styleCount = await page.locator('style,link[rel="stylesheet"]').count();
    for (let i = 0; i < 20; i++) {
      const theme = themeIds[i % themeIds.length];
      await set({ enabled: true, theme });
      await waitStatus({ state: 'active', theme });
    }
    await set({ enabled: false });
    await waitStatus({ state: 'disabled' });
    await page.waitForTimeout(200);
    assert.deepEqual(await appearance(), baseline);
    assert.equal(await page.locator('style,link[rel="stylesheet"]').count(), styleCount);
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
    assert.ok(await popup.locator('#feedback > summary').evaluate(el => el.getBoundingClientRect().bottom <= 600), 'Feedback controls must be visible in the initial popup');
    await popup.locator('#feedback > summary').click();
    await popup.locator('input[value="browser-archeology"]').check();
    const stored = await waitStored({ theme: 'browser-archeology' });
    assert.equal(stored.theme, 'browser-archeology');
    assert.equal('renderer' in stored, false);
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
