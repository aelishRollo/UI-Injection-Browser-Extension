import { THEMES } from './themes.js';
import { isEnabled } from './settings.js';
import { getCorrections } from './corrections.js';
import { buildStyles } from './styles.js';

// executeScript can reconnect a tab opened before installation; initialization is idempotent.
if (!globalThis.__surfaceExperimentV1) {
  globalThis.__surfaceExperimentV1 = true;
  let currentCSS = '';
  let adapter;
  let contextual;
  let pending = false;
  let applying = false;
  let lastSignature = '';
  let status = { state: 'starting', theme: null, renderer: null, error: null, corrections: [], applyCount: 0, applyMs: 0 };
  // Dark Reader's website bundle wraps runtime.sendMessage without returning its
  // Promise. Capture the real extension transport before lazy-loading that bundle.
  const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);

  async function request(message) {
    const result = await sendMessage(message);
    if (!result?.ok) throw new Error(result?.error || 'Extension service worker unavailable');
    return result;
  }
  async function replaceCSS(next) {
    if (next === currentCSS) return;
    await request({ type: 'styles:replace', previous: currentCSS, next });
    currentCSS = next;
  }
  async function reconcile() {
    pending = true;
    if (applying) return;
    applying = true;
    while (pending) {
      pending = false;
      try {
        const { settings, topHost, frameHost } = await request({ type: 'settings:get' });
        const enabled = isEnabled(settings, topHost || frameHost);
        const signature = JSON.stringify([enabled, settings.theme, settings.renderer, settings.corrections, frameHost]);
        if (signature === lastSignature) continue;
        const started = performance.now();
        status = { ...status, state: 'applying', error: null, theme: settings.theme, renderer: settings.renderer, topHost, frameHost };
        await contextual?.stop();
        await adapter?.stop();
        if (!enabled) {
          await replaceCSS('');
          status = { ...status, state: 'disabled', corrections: [] };
        } else {
          const theme = THEMES[settings.theme];
          const corrections = getCorrections(frameHost, settings.corrections);
          if (settings.renderer === 'adaptive') {
            adapter ||= await import(chrome.runtime.getURL('adaptive.js'));
            adapter.start(theme, corrections, url => request({ type: 'stylesheet:fetch', url }));
          } else if (settings.renderer === 'contextual') {
            // Classification must inspect the author's treatment, not the outgoing theme.
            await replaceCSS('');
            contextual ||= await import(chrome.runtime.getURL('contextual.js'));
            contextual.start(theme, corrections);
          }
          await replaceCSS(buildStyles(theme, { renderer: settings.renderer, corrections }));
          status = { ...status, state: 'active', corrections: corrections.ids };
        }
        status.applyMs = Math.round((performance.now() - started) * 100) / 100;
        status.applyCount++;
        lastSignature = signature;
      } catch (error) {
        await contextual?.stop();
        await adapter?.stop();
        await replaceCSS('').catch(() => {});
        lastSignature = '';
        status = { ...status, state: 'error', error: error.message };
      }
    }
    applying = false;
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings) void reconcile();
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'status:get') {
      sendResponse({ ...status, adapter: adapter?.diagnostics() || null, contextual: contextual?.diagnostics() || null, stylesheetBytes: currentCSS.length });
    } else if (message?.type === 'retry') {
      lastSignature = '';
      void reconcile();
      sendResponse({ retrying: true });
    }
  });
  // CSS selectors automatically cover new DOM. Variant A needs no DOM observer or polling.
  void reconcile();
}
