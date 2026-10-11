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

try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: await chromiumPath(),
    headless: true,
    viewport: { width: 1280, height: 960 },
    args: [`--disable-extensions-except=${resolve('dist')}`, `--load-extension=${resolve('dist')}`, '--no-first-run']
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  await worker.evaluate(async () => {
    await chrome.storage.local.set({ settings: { version: 2, enabled: true, theme: 'terminal-vision', disabledHosts: [] } });
  });
  const page = await context.newPage();
  await page.goto(`${fixture.url}/navigation.html`);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-surface-ready-v2'));

  await page.locator('#navigate').click();
  await page.waitForFunction(() => document.documentElement.dataset.routeFrameMs);
  const routeFrameMs = Number(await page.locator('html').getAttribute('data-route-frame-ms'));
  assert.ok(routeFrameMs < 200, `large route navigation blocked the next frame for ${routeFrameMs.toFixed(1)} ms`);
  assert.equal(await page.locator('#route-section-0').getAttribute('data-surface-context-v1'), 'content');

  const deferred = page.locator('#route-section-799');
  assert.equal(await page.locator('#page').getAttribute('data-surface-deferred-reading-v1'), '', 'a deferred reading route must establish provisional paint continuity');
  assert.equal(await deferred.getAttribute('data-surface-context-v1'), null, 'offscreen ownership work should remain deferred');
  assert.equal(await deferred.getAttribute('data-surface-purpose-v1'), null, 'offscreen purpose work should remain deferred');
  assert.equal(await deferred.evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)', 'deferred route regions must not retain an authored light band');
  assert.equal(await deferred.locator('h2').getAttribute('data-surface-tone-v1'), null, 'offscreen foreground work should remain deferred');

  await deferred.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#route-section-799 h2')?.hasAttribute('data-surface-tone-v1'));
  console.log(`PASS large route navigation reached the next frame in ${routeFrameMs.toFixed(1)} ms, kept deferred paint coherent, and themed deferred foregrounds on entry`);

  await page.goto(`${fixture.url}/deferred-scroll.html`);
  await page.waitForFunction(() => document.querySelector('#deferred-target p:last-child')?.hasAttribute('data-surface-tone-v1'));
  const finalParagraph = page.locator('#deferred-target p:last-child');
  const toneBeforeScroll = await finalParagraph.getAttribute('data-surface-tone-v1');
  const scrollFrameMs = await page.evaluate(() => new Promise(resolve => {
    const started = performance.now();
    scrollTo(0, document.scrollingElement.scrollHeight);
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now() - started)));
  }));
  assert.ok(scrollFrameMs < 300, `scroll-triggered root state or stale deferred work blocked content for ${scrollFrameMs.toFixed(1)} ms`);
  assert.ok(await page.locator('body').evaluate(element => element.classList.contains('article-below-title')),
    'the fixture must exercise its scroll-triggered root class');
  assert.equal(await page.locator('body').getAttribute('data-surface-context-v1'), 'page');
  assert.equal(await finalParagraph.getAttribute('data-surface-tone-v1'), toneBeforeScroll,
    'scroll state must retain the established foreground decision');
  console.log(`PASS long article scroll painted within ${scrollFrameMs.toFixed(1)} ms and retained foreground ownership`);

  for (const theme of THEME_IDS) {
    await worker.evaluate(async nextTheme => chrome.storage.local.set({ settings: {
      version: 2, enabled: true, theme: nextTheme, disabledHosts: []
    } }), theme);
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
    await page.waitForFunction(() => !document.querySelector('#aircraft')?.hasAttribute('data-surface-purpose-v1'));
    await lastRow.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('#aircraft')?.getAttribute('data-surface-purpose-v1') === 'data' &&
      document.querySelector('#aircraft-body tr:last-child')?.getAttribute('data-surface-table-part-v1') === 'body');
    assert.equal(await table.getAttribute('data-surface-context-v1'), 'content', `${theme} table lost content ownership`);
    assert.notEqual(await table.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(248, 249, 250)',
      `${theme} deferred table exposed its original light surface after reentering the viewport`);
    assert.notEqual(await lastRow.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(239, 239, 239)',
      `${theme} last inline-gray data row lost the shared table paint`);
    console.log(`PASS ${theme} deferred table and inline-gray row regained purpose and paint on scroll entry`);
  }
} finally {
  await context?.close().catch(() => {});
  await fixture.close().catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
