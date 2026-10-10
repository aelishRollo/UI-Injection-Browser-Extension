// Read-only smoke pass, not an automated visual-quality or usability verdict.
import { chromium } from 'playwright';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { chromiumPath } from './browser-path.mjs';
import { THEME_IDS } from '../src/themes.js';

const sites = [
  { id: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Chromium_(web_browser)', group: 'known' },
  { id: 'youtube', url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', group: 'known' },
  { id: 'github', url: 'https://github.com/darkreader/darkreader', group: 'known' },
  { id: 'mdn', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', group: 'unfamiliar-article' },
  { id: 'ikea', url: 'https://www.ikea.com/us/en/', group: 'unfamiliar-commerce' },
  { id: 'excalidraw', url: 'https://excalidraw.com/', group: 'unfamiliar-application' },
  { id: 'mdmi', url: 'https://mdmi.com/', group: 'visual-reference' }
];
const selectedSites = process.env.SURFACE_SITES ? sites.filter(site => process.env.SURFACE_SITES.split(',').includes(site.id)) : sites;
const out = resolve(process.env.SURFACE_OUTPUT || 'test-results/live');
await mkdir(out, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'surface-live-'));
let context;
const results = [];
const hashes = Object.fromEntries(await Promise.all(['content.js', 'background.js'].map(async name => [name, createHash('sha256').update(await readFile(`dist/${name}`)).digest('hex')])));
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
      await set({ enabled: false, disabledHosts: [] });
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1800);
      row.finalURL = page.url(); row.title = await page.title();
      row.bodyExcerpt = (await page.locator('body').innerText()).slice(0, 450);
      const tabId = await worker.evaluate(async url => (await chrome.tabs.query({})).find(t => t.url === url)?.id, page.url());
      if (!tabId) throw new Error('No matching browser tab');
      await page.screenshot({ path: join(out, `${site.id}-original.png`), timeout: 30000 });
      for (const theme of THEME_IDS) {
          const result = { theme, qualityVerdict: 'requires human review' };
          row.combinations.push(result);
          try {
            await set({ enabled: true, theme });
            let active;
            for (let i = 0; i < 80; i++) {
              active = await getStatus(tabId).catch(() => null);
              if (active?.state === 'error') throw new Error(active.error);
              if (active?.state === 'active' && active.theme === theme) break;
              await page.waitForTimeout(100);
            }
            if (active?.state !== 'active' || active.theme !== theme) throw new Error('Apply timed out');
            await page.waitForTimeout(700);
            result.status = await getStatus(tabId);
            result.document = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: innerWidth, elements: document.querySelectorAll('*').length, bodyColor: getComputedStyle(document.body).color, bodyBackground: getComputedStyle(document.body).backgroundColor }));
            result.purposeSamples = await page.locator('[data-surface-purpose-v1]').evaluateAll(elements => elements.slice(0, 60).map(element => ({
              tag: element.tagName.toLowerCase(), purpose: element.getAttribute('data-surface-purpose-v1'),
              evidence: element.getAttribute('data-surface-evidence-v1'), label: element.textContent.trim().replace(/\s+/g, ' ').slice(0, 80)
            })));
            result.visualProbes = await page.locator('h1,h1 span,[data-surface-glyph-v1],label[data-surface-context-v1="control"] span').evaluateAll(elements => elements.slice(0, 30).map(el => ({
              tag: el.tagName, label: el.textContent.trim().slice(0, 60), tone: el.getAttribute('data-surface-tone-v1'), pair: el.getAttribute('data-surface-pair-v1'),
              glyph: el.getAttribute('data-surface-glyph-v1'), color: getComputedStyle(el).color, background: getComputedStyle(el).backgroundColor,
              ancestors: [...(function* () { for (let n=el;n;n=n.parentElement) yield n; })()].slice(0, 5).map(n => ({tag:n.tagName,context:n.getAttribute('data-surface-context-v1'),background:getComputedStyle(n).backgroundColor,before:getComputedStyle(n,'::before').content,beforePaint:getComputedStyle(n,'::before').backgroundImage,after:getComputedStyle(n,'::after').content,afterPaint:getComputedStyle(n,'::after').backgroundImage}))
            })));
            result.controlProbes = await page.locator('button,[role="button"]').evaluateAll(elements => elements.filter(el => el.textContent.trim()).slice(0, 120).map(el => ({
              label: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80),
              context: el.getAttribute('data-surface-context-v1'),
              tone: el.getAttribute('data-surface-tone-v1'),
              pair: el.getAttribute('data-surface-pair-v1'),
              color: getComputedStyle(el).color,
              textFill: getComputedStyle(el).webkitTextFillColor,
              controlInk: getComputedStyle(el).getPropertyValue('--surface-control-ink-v1'),
              background: getComputedStyle(el).backgroundColor,
              shadowRoot: Boolean(el.shadowRoot),
              html: el.outerHTML.slice(0, 500)
            })));
            await page.screenshot({ path: join(out, `${site.id}-${theme}.png`), timeout: 30000 });
            result.applied = true;
            console.log(`${site.id}: ${theme} captured`);
          } catch (error) { result.error = error.message; console.log(`${site.id}: ${theme}: ${error.message}`); }
      }
      await set({ enabled: false });
      await page.waitForTimeout(500);
      row.finalStatus = await getStatus(tabId).catch(() => null);
    } catch (error) { row.error = error.message; console.log(`${site.id}: unavailable: ${error.message}`); }
    finally { await page.close(); }
    await writeFile(join(out, 'results.json'), JSON.stringify({ recordedAt: new Date().toISOString(), browser: context.browser()?.version(), hashes, results }, null, 2));
  }
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
console.log('Live-site captures saved. Applied is not a quality pass; review challenge pages and screenshots.');
