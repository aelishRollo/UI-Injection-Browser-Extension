// Read-only smoke pass, not an automated visual-quality or usability verdict.
import { chromium } from 'playwright';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { chromiumPath } from './browser-path.mjs';

const sites = [
  { id: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Chromium_(web_browser)', group: 'known' },
  { id: 'youtube', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', group: 'known' },
  { id: 'github', url: 'https://github.com/darkreader/darkreader', group: 'known' },
  { id: 'mdn', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', group: 'unfamiliar-article' },
  { id: 'ikea', url: 'https://www.ikea.com/us/en/', group: 'unfamiliar-commerce' },
  { id: 'excalidraw', url: 'https://excalidraw.com/', group: 'unfamiliar-application' }
];
const selectedSites = process.env.SURFACE_SITES ? sites.filter(site => process.env.SURFACE_SITES.split(',').includes(site.id)) : sites;
const renderers = process.env.SURFACE_RENDERERS ? ['simple', 'adaptive', 'contextual'].filter(renderer => process.env.SURFACE_RENDERERS.split(',').includes(renderer)) : ['simple', 'adaptive', 'contextual'];
const out = resolve(process.env.SURFACE_OUTPUT || 'test-results/live');
await mkdir(out, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'surface-live-'));
let context;
const results = [];
const hashes = Object.fromEntries(await Promise.all(['content.js', 'adaptive.js', 'contextual.js', 'background.js'].map(async name => [name, createHash('sha256').update(await readFile(`dist/${name}`)).digest('hex')])));
try {
  context = await chromium.launchPersistentContext(profile, {
    executablePath: await chromiumPath(), headless: true, viewport: { width: 1440, height: 1000 },
    args: [`--disable-extensions-except=${resolve('dist')}`, `--load-extension=${resolve('dist')}`, '--no-first-run', '--mute-audio']
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const set = patch => worker.evaluate(async patch => {
    const { settings = {} } = await chrome.storage.local.get('settings');
    await chrome.storage.local.set({ settings: { ...settings, ...patch } });
  }, patch);
  const getStatus = tabId => worker.evaluate(tabId => chrome.tabs.sendMessage(tabId, { type: 'status:get' }, { frameId: 0 }), tabId);
  for (const site of selectedSites) {
    const page = await context.newPage();
    const row = { ...site, combinations: [] };
    results.push(row);
    try {
      await set({ enabled: false, disabledHosts: [], corrections: false });
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1800);
      row.finalURL = page.url(); row.title = await page.title();
      row.bodyExcerpt = (await page.locator('body').innerText()).slice(0, 450);
      const tabId = await worker.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url)?.id, page.url());
      if (!tabId) throw new Error('No matching browser tab');
      await page.screenshot({ path: join(out, `${site.id}-original.png`), timeout: 30000 });
      for (const renderer of renderers) {
        for (const theme of ['terminal-vision', 'browser-archeology', 'liquid-dream']) {
          const result = { renderer, theme, qualityVerdict: 'requires human review' };
          row.combinations.push(result);
          try {
            await set({ enabled: true, renderer, theme });
            let active;
            for (let i = 0; i < 80; i++) {
              active = await getStatus(tabId).catch(() => null);
              if (active?.state === 'error') throw new Error(active.error);
              if (active?.state === 'active' && active.theme === theme && active.renderer === renderer) break;
              await page.waitForTimeout(100);
            }
            if (active?.state !== 'active' || active.theme !== theme || active.renderer !== renderer) throw new Error('Apply timed out');
            await page.waitForTimeout(700);
            result.status = await getStatus(tabId);
            result.document = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, darkreaderStyles: document.querySelectorAll('style.darkreader').length, elements: document.querySelectorAll('*').length, bodyColor: getComputedStyle(document.body).color, bodyBackground: getComputedStyle(document.body).backgroundColor }));
            await page.screenshot({ path: join(out, `${site.id}-${renderer}-${theme}.png`), timeout: 30000 });
            result.applied = true;
            console.log(`${site.id}: ${renderer}/${theme} captured`);
          } catch (error) { result.error = error.message; console.log(`${site.id}: ${renderer}/${theme}: ${error.message}`); }
        }
      }
      await set({ enabled: false });
      await page.waitForTimeout(500);
      row.finalStatus = await getStatus(tabId).catch(() => null);
    } catch (error) { row.error = error.message; console.log(`${site.id}: unavailable: ${error.message}`); }
    finally { await page.close(); }
    await writeFile(join(out, 'results.json'), JSON.stringify({ recordedAt: new Date().toISOString(), browser: context.browser()?.version(), hashes, corrections: false, results }, null, 2));
  }
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
console.log('Live-site captures saved. Applied is not a quality pass; review challenge pages and screenshots.');
