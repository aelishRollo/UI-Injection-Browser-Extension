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

  await page.locator('#route-section-799').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#route-section-799')?.getAttribute('data-surface-context-v1') === 'content');
  console.log(`PASS large route navigation reached the next frame in ${routeFrameMs.toFixed(1)} ms and themed deferred content on entry`);
} finally {
  await context?.close().catch(() => {});
  await fixture.close().catch(() => {});
  await rm(profile, { recursive: true, force: true });
}
