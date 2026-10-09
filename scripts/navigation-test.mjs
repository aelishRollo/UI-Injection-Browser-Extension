import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { chromiumPath } from './browser-path.mjs';
import { serveFixtures } from './serve.mjs';

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
} finally {
  await context?.close().catch(() => {});
  await fixture.close().catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
