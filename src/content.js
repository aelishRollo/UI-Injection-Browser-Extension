import { THEMES } from './themes.js';
import { isEnabled, normalizeSettings } from './settings.js';
import { getCorrections } from './corrections.js';
import { buildStyles } from './styles.js';
import { createThemePicker } from './theme-picker.js';
import * as unifiedRenderer from './contextual.js';

// executeScript can reconnect a tab opened before installation; initialization is idempotent.
if (!globalThis.__surfaceUnifiedV2) {
  globalThis.__surfaceUnifiedV2 = true;
  const READY_ATTRIBUTE = 'data-surface-ready-v2';
  const SWITCHING_ATTRIBUTE = 'data-surface-switching-v2';
  const SWITCH_BACKGROUND = '--surface-switch-background-v2';
  const SWITCH_COLOR_SCHEME = '--surface-switch-color-scheme-v2';
  let currentCSS = '';
  const renderer = unifiedRenderer;
  const registeredTheme = window === top && document.documentElement
    ? getComputedStyle(document.documentElement).getPropertyValue('--surface-startup-theme').trim()
    : '';
  let bootstrapTheme = THEMES[registeredTheme] ? registeredTheme : '';
  let bootstrapStart = bootstrapTheme
    ? renderer.start(THEMES[bootstrapTheme], getCorrections(location.hostname.toLowerCase()))
    : null;
  let bootstrapTreatment;
  let pending = false;
  let applying = false;
  let lastSignature = '';
  let switchGuardState;
  let status = { state: 'starting', theme: null, error: null, corrections: [], applyCount: 0, applyMs: 0 };
  const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime);
  const elapsed = started => Math.round((performance.now() - started) * 100) / 100;

  async function request(message) {
    const result = await sendMessage(message);
    if (!result?.ok) throw new Error(result?.error || 'Extension service worker unavailable');
    return result;
  }
  async function settingsContext() {
    // The top document can read extension storage directly. Avoid waking the
    // service worker just to rediscover its own host and selected theme during
    // the first-paint critical path. Cross-origin frames still ask the worker
    // for the top-level host so exact-site exceptions propagate correctly.
    const settings = normalizeSettings((await chrome.storage.local.get('settings')).settings);
    const frameHost = location.hostname.toLowerCase();
    if (window === top) return { settings, topHost: frameHost, frameHost };
    return request({ type: 'settings:get' });
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
  function beginThemeSwitch(theme) {
    const root = document.documentElement;
    if (!root || switchGuardState) return;
    switchGuardState = {
      attribute: root.hasAttribute(SWITCHING_ATTRIBUTE) ? root.getAttribute(SWITCHING_ATTRIBUTE) : null,
      background: { value: root.style.getPropertyValue(SWITCH_BACKGROUND), priority: root.style.getPropertyPriority(SWITCH_BACKGROUND) },
      colorScheme: { value: root.style.getPropertyValue(SWITCH_COLOR_SCHEME), priority: root.style.getPropertyPriority(SWITCH_COLOR_SCHEME) }
    };
    root.style.setProperty(SWITCH_BACKGROUND, theme.colors.background);
    root.style.setProperty(SWITCH_COLOR_SCHEME, theme.scheme);
    root.setAttribute(SWITCHING_ATTRIBUTE, theme.id);
  }
  function finishThemeSwitch() {
    const root = document.documentElement;
    if (!root || !switchGuardState) return;
    const restoreProperty = (name, original) => {
      if (original.value) root.style.setProperty(name, original.value, original.priority);
      else root.style.removeProperty(name);
    };
    if (switchGuardState.attribute === null) root.removeAttribute(SWITCHING_ATTRIBUTE);
    else root.setAttribute(SWITCHING_ATTRIBUTE, switchGuardState.attribute);
    restoreProperty(SWITCH_BACKGROUND, switchGuardState.background);
    restoreProperty(SWITCH_COLOR_SCHEME, switchGuardState.colorScheme);
    switchGuardState = undefined;
  }
  async function reconcile() {
    pending = true;
    if (applying) return;
    applying = true;
    while (pending) {
      pending = false;
      try {
        const started = performance.now();
        const timings = { reconcileAtMs: Math.round(started * 100) / 100 };
        const { settings, topHost, frameHost } = await settingsContext();
        timings.settingsMs = elapsed(started);
        const enabled = isEnabled(settings, topHost || frameHost);
        // Keep the picker available so a paused extension can be resumed in place.
        themePicker.render(settings, Boolean(topHost || frameHost));
        const signature = JSON.stringify([enabled, settings.theme, frameHost]);
        if (signature === lastSignature) continue;
        const theme = THEMES[settings.theme];
        const switchingTheme = Boolean(enabled && theme && status.state === 'active' && status.theme !== settings.theme);
        if (switchingTheme) beginThemeSwitch(theme);
        status = { ...status, state: 'applying', error: null, theme: settings.theme, topHost, frameHost, timings };
        const reuseBootstrap = Boolean(bootstrapStart && enabled && settings.theme === bootstrapTheme && window === top);
        if (!reuseBootstrap) {
          bootstrapStart = null;
          bootstrapTheme = '';
          await renderer.stop();
        }
        if (!enabled) {
          await replaceCSS('');
          status = { ...status, state: 'disabled', corrections: [] };
        } else {
          const corrections = getCorrections(frameHost);
          // Classification inspects the author's treatment before expressive CSS.
          await replaceCSS('');
          const { completion } = reuseBootstrap
            ? await bootstrapStart
            : await renderer.start(theme, corrections);
          timings.rendererStartedMs = elapsed(started);
          // The selected first-paint treatment is already parsed in the
          // persisted document_start sheet. Install the full USER-origin sheet
          // in parallel with recognition instead of serializing the first
          // visible frame behind a worker round trip.
          await Promise.all([
            replaceCSS(buildStyles(theme, { corrections })).then(() => {
              renderer.confirmUserStyles();
              timings.userStylesReadyMs = elapsed(started);
            }),
            (reuseBootstrap ? bootstrapTreatment : renderer.prepareReveal()).then(() => { timings.recognitionReadyMs = elapsed(started); })
          ]);
          await revealDocument();
          finishThemeSwitch();
          bootstrapStart = null;
          bootstrapTheme = '';
          bootstrapTreatment = null;
          timings.revealedMs = elapsed(started);
          await completion;
          timings.completeMs = elapsed(started);
          status = { ...status, state: 'active', corrections: corrections.ids };
        }
        if (!enabled) await revealDocument();
        status.applyMs = elapsed(started);
        status.applyCount++;
        lastSignature = signature;
      } catch (error) {
        await renderer.stop();
        await replaceCSS('').catch(() => {});
        await revealDocument().catch(() => {});
        finishThemeSwitch();
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
      sendResponse({ ...status, renderer: renderer.diagnostics(), stylesheetBytes: currentCSS.length });
    } else if (message?.type === 'retry') {
      lastSignature = '';
      void reconcile();
      sendResponse({ retrying: true });
    }
  });
  if (bootstrapStart) {
    const expectedTheme = bootstrapTheme;
    bootstrapTreatment = bootstrapStart.then(async () => {
      await renderer.prepareReveal();
      if (bootstrapTheme === expectedTheme) await revealDocument();
    });
  }
  void reconcile();
}
