// Repeated local lab measurements. No thresholds are inferred from one machine.
import { chromium } from 'playwright';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromiumPath } from './browser-path.mjs';
import { serveFixtures } from './serve.mjs';
import { THEME_IDS } from '../src/themes.js';

const fixture = await serveFixtures();
const profileDir = await mkdtemp(join(tmpdir(), 'surface-perf-'));
const out = resolve(process.env.SURFACE_PERF_OUTPUT || 'test-results/performance');
await mkdir(out, { recursive: true });
let context;
const samples = [];
const modes = [{ enabled: false, theme: null }, ...THEME_IDS.map(theme => ({ enabled: true, theme }))];
const repeatCount = Math.max(1, Math.min(20, Number.parseInt(process.env.SURFACE_PERF_REPEATS || '5', 10) || 5));
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(values.length * p))];
try {
  context = await chromium.launchPersistentContext(profileDir, {
    executablePath: await chromiumPath(), headless: true, viewport: { width: 1280, height: 960 },
    args: [`--disable-extensions-except=${resolve('dist')}`, `--load-extension=${resolve('dist')}`, '--no-first-run']
  });
  const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  for (let i = 0; i < 100; i++) {
    const installed = await worker.evaluate(async () => (await chrome.storage.local.get('settings')).settings?.version === 2);
    if (installed) break;
    if (i === 99) throw new Error('Extension installation did not initialize settings');
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  const page = await context.newPage();
  await page.exposeFunction('__surfaceTrustedClick', selector => page.locator(selector).click({ force: true, timeout: 2000 }));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  for (let repeat = 0; repeat < repeatCount; repeat++) {
    // Rotate order so later runs do not systematically favor one theme.
    const offset = repeat % modes.length;
    const ordered = [...modes.slice(offset), ...modes.slice(0, offset)];
    for (const mode of ordered) {
      await worker.evaluate(async mode => {
        await chrome.storage.local.set({ settings: { version: 2, enabled: mode.enabled, theme: mode.theme || 'terminal-vision', disabledHosts: [] } });
      }, mode);
      const loadStarted = Date.now();
      console.log(`Starting ${repeat + 1}/${repeatCount} ${mode.theme || 'original'}`);
      await page.goto(fixture.url, { waitUntil: 'load' });
      let active;
      const expectedState = mode.enabled ? 'active' : 'disabled';
      for (let i = 0; i < 100; i++) {
        active = await worker.evaluate(async () => {
          const tab = (await chrome.tabs.query({})).find(t => t.url?.startsWith('http://127.0.0.1:4173'));
          return chrome.tabs.sendMessage(tab.id, { type: 'status:get' }, { frameId: 0 });
        }).catch(() => null);
        if (active?.state === 'error') throw new Error(active.error);
        if (active?.state === expectedState) break;
        await page.waitForTimeout(50);
      }
      if (active?.state !== expectedState) throw new Error(`Renderer did not settle as ${expectedState}`);
      const loadToAppliedMs = Date.now() - loadStarted;
      await page.waitForTimeout(250);
      const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      await cdp.send('Profiler.start');
      const workload = await page.evaluate(async () => {
        const intervals = []; const interactionToTwoFrames = []; const longTasks = [];
        let trustedInputCount = 0; let untrustedInputCount = 0;
        const inputListener = event => event.isTrusted ? trustedInputCount++ : untrustedInputCount++;
        document.addEventListener('click', inputListener, true);
        let stalledFrames = 0;
        const observer = new PerformanceObserver(list => longTasks.push(...list.getEntries().map(e => e.duration)));
        observer.observe({ type: 'longtask' });
        const frame = () => new Promise(resolve => {
          const request = requestAnimationFrame(time => { clearTimeout(timer); resolve(time); });
          const timer = setTimeout(() => { cancelAnimationFrame(request); stalledFrames++; resolve(performance.now()); }, 250);
        });
        const deadline = performance.now() + 8000;
        let previous = await frame();
        for (let i = 0; i < 100; i++) {
          if (performance.now() > deadline) break;
          scrollTo(0, Math.round((Math.sin(i / 18) + 1) * 500));
          const now = await frame(); intervals.push(now - previous); previous = now;
          if (i % 10 === 0) {
            const started = performance.now();
            await globalThis.__surfaceTrustedClick('#menu-button');
            await globalThis.__surfaceTrustedClick('#inline-update');
            await globalThis.__surfaceTrustedClick('#add');
            await frame(); await frame();
            interactionToTwoFrames.push(performance.now() - started);
            previous = await frame();
          }
        }
        await new Promise(resolve => setTimeout(resolve, 0)); observer.disconnect();
        document.removeEventListener('click', inputListener, true);
        return { intervals, interactionToTwoFrames, longTasks, stalledFrames, completedFrames: intervals.length, trustedInputCount, untrustedInputCount };
      });
      const { profile } = await cdp.send('Profiler.stop');
      const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
      const nodes = new Map(profile.nodes.map(n => [n.id, n]));
      const parents = new Map(profile.nodes.flatMap(n => (n.children || []).map(id => [id, n.id])));
      const isEngine = id => {
        for (let current = id; current; current = parents.get(current)) {
          if (/^chrome-extension:\/\/[^/]+\/(content|contextual)\.js/.test(nodes.get(current)?.callFrame.url || '')) return true;
        }
        return false;
      };
      let sampledEngineMs = 0;
      profile.samples?.forEach((id, i) => { if (isEngine(id)) sampledEngineMs += (profile.timeDeltas[i] || 0) / 1000; });
      const metrics = Object.fromEntries(['TaskDuration', 'ScriptDuration', 'RecalcStyleDuration', 'LayoutDuration'].map(name => [name + 'Ms', Math.round((after[name] - before[name]) * 100000) / 100]));
      const frameMeasurementValid = workload.completedFrames === 100 && workload.stalledFrames === 0;
      samples.push({ ...mode, repeat, loadToAppliedMs, applyMs: active.applyMs, styleHandoff: active.renderer?.styleHandoff, metrics, sampledContentEngineMs: Math.round(sampledEngineMs * 100) / 100, frameMeasurementValid, p95FrameIntervalMs: frameMeasurementValid ? percentile(workload.intervals, .95) : null, p95SyntheticInteractionMs: frameMeasurementValid ? percentile(workload.interactionToTwoFrames, .95) : null, ...workload });
      await writeFile(join(out, 'partial-results.json'), JSON.stringify({ configuration: { repeatCount, modes }, samples }, null, 2));
      console.log(`${repeat + 1}/${repeatCount} ${mode.theme || 'original'}: ${metrics.TaskDurationMs} ms main-thread tasks, ${sampledEngineMs.toFixed(1)} ms sampled engine`);
    }
  }
  await writeFile(join(out, 'results.json'), JSON.stringify({ recordedAt: new Date().toISOString(), browser: context.browser()?.version(), configuration: { repeatCount, modes }, samples, limitations: ['Local fixture and headless browser; no product performance pass implied.', 'Playwright dispatches trusted click input, but click-to-two-rAF remains a laboratory rendering-opportunity measure rather than field INP.', 'CPU sampling covers page content engines, not extension worker CPU or all native rendering work.', 'Frame intervals and task duration include theme effects. Theme cost is not isolated by subtracting sampled engine values.', 'Navigations are warm-cache after the first run; loadToApplied includes automation and scheduling.', 'A verified equivalent-output frozen-style control, paint/composite traces, foreground runs, and real-site traces remain necessary for complete attribution.'] }, null, 2));
} finally {
  await context?.close(); await fixture.close(); await rm(profileDir, { recursive: true, force: true });
}
