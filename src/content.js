import { THEMES } from './themes.js';
import { isEnabled } from './settings.js';
import { getCorrections } from './corrections.js';
import { buildStyles } from './styles.js';
import { createThemePicker } from './theme-picker.js';

// executeScript can reconnect a tab opened before installation; initialization is idempotent.
if (!globalThis.__surfaceUnifiedV2) {
  globalThis.__surfaceUnifiedV2 = true;
  const READY_ATTRIBUTE = 'data-surface-ready-v2';
  let currentCSS = '';
  let renderer;
  let pending = false;
  let applying = false;
  let lastSignature = '';
  let status = { state: 'starting', theme: null, error: null, corrections: [], applyCount: 0, applyMs: 0 };
  const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);

  async function request(message) {
    const result = await sendMessage(message);
    if (!result?.ok) throw new Error(result?.error || 'Extension service worker unavailable');
    return result;
  }
  const themePicker = createThemePicker({
    selectTheme: async theme => (await request({ type: 'theme:select', theme })).settings,
    setEnabled: async enabled => (await request({ type: 'enabled:set', enabled })).settings
  });
  async function replaceCSS(next) {
    if (next === currentCSS) return;
    await request({ type: 'styles:replace', previous: currentCSS, next });
    currentCSS = next;
  }
  async function revealDocument() {
    if (!document.documentElement) {
      await new Promise(resolve => {
        const observer = new MutationObserver(() => {
          if (!document.documentElement) return;
          observer.disconnect();
          resolve();
        });
        observer.observe(document, { childList: true });
      });
    }
    document.documentElement.setAttribute(READY_ATTRIBUTE, '');
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
        // Keep the picker available so a paused extension can be resumed in place.
        themePicker.render(settings, Boolean(topHost || frameHost));
        const signature = JSON.stringify([enabled, settings.theme, frameHost]);
        if (signature === lastSignature) continue;
        const started = performance.now();
        status = { ...status, state: 'applying', error: null, theme: settings.theme, topHost, frameHost };
        await renderer?.stop();
        if (!enabled) {
          await replaceCSS('');
          status = { ...status, state: 'disabled', corrections: [] };
        } else {
          const theme = THEMES[settings.theme];
          const corrections = getCorrections(frameHost);
          // Classification inspects the author's treatment before expressive CSS.
          await replaceCSS('');
          renderer ||= await import(chrome.runtime.getURL('contextual.js'));
          const { completion } = await renderer.start(theme, corrections);
          await replaceCSS(buildStyles(theme, { corrections }));
          await renderer.prepareReveal();
          await revealDocument();
          await completion;
          status = { ...status, state: 'active', corrections: corrections.ids };
        }
        if (!enabled) await revealDocument();
        status.applyMs = Math.round((performance.now() - started) * 100) / 100;
        status.applyCount++;
        lastSignature = signature;
      } catch (error) {
        await renderer?.stop();
        await replaceCSS('').catch(() => {});
        await revealDocument().catch(() => {});
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
      sendResponse({ ...status, renderer: renderer?.diagnostics() || null, stylesheetBytes: currentCSS.length });
    } else if (message?.type === 'retry') {
      lastSignature = '';
      void reconcile();
      sendResponse({ retrying: true });
    }
  });
  void reconcile();
}
