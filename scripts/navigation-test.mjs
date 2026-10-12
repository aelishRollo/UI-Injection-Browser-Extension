import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { chromiumPath } from './browser-path.mjs';
import { serveFixtures } from './serve.mjs';
import { THEME_IDS } from '../src/themes.js';

const fixture = await serveFixtures();
const profile = await mkdtemp(join(tmpdir(), 'surface-navigation-'));
let context;
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: await chromiumPath(),
    headless: true,
    viewport: { width: 1280, height: 960 },
    args: [
      `--disable-extensions-except=${resolve('dist')}`,
      `--load-extension=${resolve('dist')}`,
      '--no-first-run',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  for (let i = 0; i < 100; i++) {
    const installed = await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings?.version === 2);
    if (installed) break;
    if (i === 99) throw new Error('Extension installation did not initialize settings');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  const page = context.pages()[0] || await context.newPage();
  const waitStartupStyle = async (theme = null) => {
    for (let i = 0; i < 100; i++) {
      const registered = await worker.evaluate(async () => chrome.scripting.getRegisteredContentScripts({ ids: ['surface-theme-startup-v1'] }));
      if ((!theme && registered.length === 0) || (theme && registered[0]?.css?.includes(`startup-${theme}.css`))) return;
      await new Promise(resolve => setTimeout(resolve, 25));
    }
    throw new Error(`Startup style did not synchronize for ${theme || 'disabled state'}`);
  };
  const setMode = async (enabled, theme = 'terminal-vision') => {
    await worker.evaluate(async ({ enabled, theme }) => {
      await chrome.storage.local.set({ settings: {
        version: 2, enabled, theme, disabledHosts: []
      } });
    }, { enabled, theme });
    await waitStartupStyle(enabled ? theme : null);
  };
  const status = () => worker.evaluate(async fixtureUrl => {
    const tabs = await chrome.tabs.query({});
    const tab = tabs.find(candidate => candidate.url?.startsWith(fixtureUrl));
    if (!tab) throw new Error(`Fixture tab was not found for ${fixtureUrl}`);
    return chrome.tabs.sendMessage(tab.id, { type: 'status:get' }, { frameId: 0 });
  }, fixture.url);
  const waitStatus = async expectedState => {
    for (let i = 0; i < 100; i++) {
      const current = await status().catch(() => null);
      if (current?.state === 'error') throw new Error(current.error);
      if (current?.state === expectedState) return current;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Renderer did not settle as ${expectedState}`);
  };
  const waitDocumentState = enabled => page.waitForFunction(enabled => {
    const root = document.documentElement;
    return root.hasAttribute('data-surface-ready-v2') && (enabled
      ? root.getAttribute('data-surface-theme-v2') === 'terminal-vision'
      : !root.hasAttribute('data-surface-theme-v2'));
  }, enabled);

  const measureRoute = async enabled => {
    await setMode(enabled);
    await page.goto(`${fixture.url}/navigation.html`);
    await waitDocumentState(enabled);
    await waitStatus(enabled ? 'active' : 'disabled');
    await page.bringToFront();
    const before = enabled ? (await status()).renderer : null;
    await page.locator('#navigate').click();
    await page.waitForFunction(() => document.documentElement.dataset.routeFrameMs);
    const frameMs = Number(await page.locator('html').getAttribute('data-route-frame-ms'));
    const after = enabled ? (await status()).renderer : null;
    if (enabled) {
      assert.ok(after.incremental.largeAdditions > before.incremental.largeAdditions,
        'large route replacement must exercise the viewport-bounded large-addition path');
      assert.ok(after.incremental.lastLargeAdditionMs < 100,
        `large route renderer batch took ${after.incremental.lastLargeAdditionMs.toFixed(1)} ms`);
    }
    return { frameMs, before, after };
  };
  const routeControl = [];
  const routeTheme = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = attempt % 2 ? [true, false] : [false, true];
    for (const enabled of order) {
      const sample = await measureRoute(enabled);
      (enabled ? routeTheme : routeControl).push(sample);
    }
  }
  const routeControlMs = routeControl.map(sample => sample.frameMs);
  const routeThemeMs = routeTheme.map(sample => sample.frameMs);
  const routeControlMedian = median(routeControlMs);
  const routeThemeMedian = median(routeThemeMs);
  assert.ok(routeControlMedian < 200,
    `unhealthy unthemed large-route control median ${routeControlMedian.toFixed(1)} ms invalidated the 200 ms frame check`);
  assert.ok(routeThemeMedian < 200,
    `large route median ${routeThemeMedian.toFixed(1)} ms exceeded the 200 ms budget (control ${routeControlMedian.toFixed(1)} ms)`);
  console.log(`PASS large route frame median ${routeThemeMedian.toFixed(1)} ms versus ${routeControlMedian.toFixed(1)} ms control`);
  assert.equal(await page.locator('#route-section-0').getAttribute('data-surface-context-v1'), 'content');

  const deferred = page.locator('#route-section-799');
  assert.equal(await page.locator('#page').getAttribute('data-surface-deferred-reading-v1'), '', 'a deferred reading route must establish provisional paint continuity');
  assert.equal(await deferred.getAttribute('data-surface-context-v1'), null, 'offscreen ownership work should remain deferred');
  assert.equal(await deferred.getAttribute('data-surface-purpose-v1'), null, 'offscreen purpose work should remain deferred');
  assert.equal(await deferred.evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)', 'deferred route regions must not retain an authored light band');
  assert.equal(await deferred.locator('h2').getAttribute('data-surface-tone-v1'), null, 'offscreen foreground work should remain deferred');

  await deferred.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#route-section-799 h2')?.hasAttribute('data-surface-tone-v1'));
  console.log(`PASS large route renderer batches ${routeTheme.map(sample => sample.after.incremental.lastLargeAdditionMs.toFixed(1)).join('/')} ms (${routeThemeMs.map(value => value.toFixed(1)).join('/')} themed frames; ${routeControlMs.map(value => value.toFixed(1)).join('/')} control) and deferred paint remained coherent`);

  const resetScroll = async () => {
    await page.evaluate(() => new Promise(resolve => {
      scrollTo(0, 0);
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
    }));
    await page.waitForFunction(() => !document.body.classList.contains('article-below-title'));
  };
  const prepareScroll = async enabled => {
    await setMode(enabled);
    await page.goto(`${fixture.url}/deferred-scroll.html`);
    await waitDocumentState(enabled);
    await waitStatus(enabled ? 'active' : 'disabled');
    await page.bringToFront();
    if (enabled) {
      await page.waitForFunction(() => document.querySelector('#deferred-target p:last-child')?.hasAttribute('data-surface-tone-v1'));
    }
    await resetScroll();
  };
  const measureScroll = () => page.evaluate(async () => {
    const article = document.querySelector('#deferred-target');
    let surfaceWrites = 0;
    const markerObserver = new MutationObserver(records => {
      surfaceWrites += records.filter(record => record.attributeName?.startsWith('data-surface-')).length;
    });
    markerObserver.observe(article, { subtree: true, attributes: true });
    const started = performance.now();
    scrollTo(0, document.scrollingElement.scrollHeight);
    const frameMs = await new Promise(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve(performance.now() - started))));
    await new Promise(resolve => setTimeout(resolve, 0));
    markerObserver.disconnect();
    return { frameMs, surfaceWrites };
  });

  await prepareScroll(true);
  const classMutationBefore = (await status()).renderer;
  const toneBeforeClassMutation = await page.locator('#deferred-target p:last-child').getAttribute('data-surface-tone-v1');
  const classMutation = await page.evaluate(async () => {
    const article = document.querySelector('#deferred-target');
    let paintWrites = 0;
    const observer = new MutationObserver(records => {
      paintWrites += records.filter(record => record.attributeName?.startsWith('data-surface-')).length;
    });
    observer.observe(article, { subtree: true, attributes: true });
    scrollTo(0, 120);
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
    paintWrites = 0;
    document.documentElement.classList.add('script-ready');
    await new Promise(resolve => setTimeout(resolve, 0));
    const immediateWrites = paintWrites;
    paintWrites = 0;
    await new Promise(resolve => setTimeout(resolve, 250));
    observer.disconnect();
    return {
      immediateWrites,
      settledWrites: paintWrites,
      tone: article.querySelector('p:last-child').getAttribute('data-surface-tone-v1')
    };
  });
  const classMutationAfter = (await status()).renderer;
  assert.equal(classMutation.immediateWrites, 0,
    `a late class on a large ancestor repainted ${classMutation.immediateWrites} established article markers`);
  assert.equal(classMutation.settledWrites, 0,
    `a bounded class rescan repainted ${classMutation.settledWrites} offscreen article markers after settling`);
  assert.equal(classMutation.tone, toneBeforeClassMutation,
    'offscreen article paint should remain established during a bounded class rescan');
  assert.equal(classMutationAfter.incremental.largeAncestorChanges,
    classMutationBefore.incremental.largeAncestorChanges + 1,
    'the late document class must use one bounded large-ancestor scan');
  assert.ok(classMutationAfter.incremental.lastLargeAncestorMs < 100,
    `bounded large-ancestor scan took ${classMutationAfter.incremental.lastLargeAncestorMs.toFixed(1)} ms`);
  console.log(`PASS bounded ancestor class used one ${classMutationAfter.incremental.lastLargeAncestorMs.toFixed(1)} ms scan with zero article marker rewrites`);

  const measureScrollMode = async enabled => {
    await prepareScroll(enabled);
    const finalParagraph = page.locator('#deferred-target p:last-child');
    const toneBeforeScroll = enabled ? await finalParagraph.getAttribute('data-surface-tone-v1') : null;
    const before = enabled ? (await status()).renderer : null;
    const result = await measureScroll();
    assert.ok(await page.locator('body').evaluate(element => element.classList.contains('article-below-title')),
      'the measured scroll must exercise its root positional class');
    if (enabled) {
      const after = (await status()).renderer;
      assert.equal(result.surfaceWrites, 0,
        `scroll-triggered root state repainted ${result.surfaceWrites} established article markers`);
      assert.equal(after.incremental.positionalRootShortcuts,
        before.incremental.positionalRootShortcuts + 1,
        'scroll state must use exactly one positional-root shortcut');
      assert.equal(after.incremental.batches, before.incremental.batches,
        'scroll state must not schedule an incremental subtree scan');
      assert.deepEqual(after.initialStageMs, before.initialStageMs,
        'scroll state must not replay viewport classification stages');
      assert.ok(after.incremental.lastPositionalRootMs < 16,
        `scroll positional-root shortcut took ${after.incremental.lastPositionalRootMs.toFixed(1)} ms`);
      assert.equal(await page.locator('body').getAttribute('data-surface-context-v1'), 'page');
      assert.equal(await finalParagraph.getAttribute('data-surface-tone-v1'), toneBeforeScroll,
        'scroll state must retain the established foreground decision');
      return { ...result, before, after };
    }
    return result;
  };
  const scrollControl = [];
  const scrollTheme = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const order = attempt % 2 ? [true, false] : [false, true];
    for (const enabled of order) {
      const sample = await measureScrollMode(enabled);
      (enabled ? scrollTheme : scrollControl).push(sample);
    }
  }
  const scrollControlMs = scrollControl.map(sample => sample.frameMs);
  const scrollThemeMs = scrollTheme.map(sample => sample.frameMs);
  const scrollControlMedian = median(scrollControlMs);
  const scrollThemeMedian = median(scrollThemeMs);
  assert.ok(scrollControlMedian < 300,
    `unhealthy unthemed long-scroll control median ${scrollControlMedian.toFixed(1)} ms invalidated the 300 ms frame check`);
  assert.ok(scrollThemeMedian < 300,
    `long-scroll median ${scrollThemeMedian.toFixed(1)} ms exceeded the 300 ms budget (control ${scrollControlMedian.toFixed(1)} ms)`);
  console.log(`PASS long-scroll frame median ${scrollThemeMedian.toFixed(1)} ms versus ${scrollControlMedian.toFixed(1)} ms control`);
  console.log(`PASS long-scroll used ${scrollTheme.map(sample => sample.after.incremental.lastPositionalRootMs.toFixed(1)).join('/')} ms positional-root shortcuts with zero Surface marker writes (${scrollThemeMs.map(value => value.toFixed(1)).join('/')} themed frames; ${scrollControlMs.map(value => value.toFixed(1)).join('/')} control)`);

  for (const theme of THEME_IDS) {
    await setMode(true, theme);
    await page.goto(`${fixture.url}/deferred-table.html`);
    await page.waitForFunction(nextTheme => document.documentElement.getAttribute('data-surface-theme-v2') === nextTheme, theme);
    const table = page.locator('#aircraft');
    const lastRow = page.locator('#aircraft-body tr:last-child');
    await lastRow.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#aircraft')?.getAttribute('data-surface-purpose-v1') === 'data' &&
      document.querySelector('#aircraft-body tr:last-child')?.getAttribute('data-surface-table-part-v1') === 'body');
    await page.evaluate(() => scrollTo(0, 0));
    await page.evaluate(() => {
      const section = document.querySelector('#article');
      section.classList.add('updated');
      section.insertAdjacentHTML('beforeend', Array.from({ length: 80 }, (_, index) =>
        `<p>New article paragraph ${index + 1}.</p>`).join(''));
    });
    assert.equal(await table.getAttribute('data-surface-purpose-v1'), 'data',
      `${theme} large route growth must retain existing offscreen table purpose`);
    assert.equal(await lastRow.getAttribute('data-surface-table-part-v1'), 'body',
      `${theme} large route growth must retain existing offscreen row paint`);
    await lastRow.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#aircraft')?.getAttribute('data-surface-purpose-v1') === 'data' &&
      document.querySelector('#aircraft-body tr:last-child')?.getAttribute('data-surface-table-part-v1') === 'body');
    assert.equal(await table.getAttribute('data-surface-context-v1'), 'content', `${theme} table lost content ownership`);
    assert.notEqual(await table.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(248, 249, 250)',
      `${theme} deferred table exposed its original light surface after reentering the viewport`);
    assert.notEqual(await lastRow.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(239, 239, 239)',
      `${theme} last inline-gray data row lost the shared table paint`);
    console.log(`PASS ${theme} deferred table and inline-gray row retained purpose and paint through growth and scroll entry`);
  }
} finally {
  await context?.close().catch(() => {});
  await fixture.close().catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
