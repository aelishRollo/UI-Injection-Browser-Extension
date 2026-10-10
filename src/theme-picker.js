import { THEMES } from './themes.js';

const HOST_ID = 'surface-theme-picker-v1';

const pickerStyles = `
  :host {
    color-scheme: dark;
    font-family: Arial, Helvetica, sans-serif;
    font-synthesis: none;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; }
  button:focus-visible { outline: 3px solid #9edfd1; outline-offset: 3px; }
  [hidden] { display: none !important; }
  .picker {
    --ui-bg: #11151a;
    --ui-panel: #1c232b;
    --ui-text: #f7f7f3;
    --ui-muted: #b8c0c8;
    --ui-accent: #9edfd1;
    --ui-border: rgba(255, 255, 255, .2);
    position: relative;
    color: var(--ui-text);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 16px;
    line-height: 1.35;
    pointer-events: auto;
  }
  .toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 42px;
    margin: 0;
    padding: 7px 12px 7px 8px;
    border: 1px solid var(--ui-border);
    border-radius: 13px;
    background: var(--ui-bg);
    box-shadow: 0 8px 24px rgba(0, 0, 0, .28);
    color: var(--ui-text);
    cursor: pointer;
  }
  .toggle:hover, .toggle[aria-expanded="true"] { background: var(--ui-panel); }
  .toggle-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: none;
    border-radius: 50%;
    background: var(--ui-accent);
    color: #101418;
    font-size: 13px;
  }
  .toggle-copy { display: grid; gap: 1px; text-align: left; }
  .toggle-kicker {
    color: var(--ui-accent);
    font-size: 8px;
    font-weight: 900;
    letter-spacing: .12em;
    line-height: 1;
    text-transform: uppercase;
  }
  .toggle-label {
    color: var(--ui-text);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .04em;
    line-height: 1.1;
  }
  .chevron {
    width: 6px;
    height: 6px;
    margin: 0 1px 3px 2px;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }
  .toggle[aria-expanded="true"] .chevron { margin-bottom: -3px; transform: rotate(225deg); }
  .panel {
    position: absolute;
    right: 0;
    bottom: calc(100% + 8px);
    width: min(264px, calc(100vw - 24px));
    padding: 14px;
    border: 1px solid var(--ui-border);
    border-radius: 15px;
    background: var(--ui-panel);
    box-shadow: 0 16px 52px rgba(0, 0, 0, .4);
    color: var(--ui-text);
  }
  .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 11px; }
  h2 { margin: 0 0 3px; color: var(--ui-text); font-size: 14px; line-height: 1.2; }
  .intro { margin: 0; color: var(--ui-muted); font-size: 10px; line-height: 1.4; }
  .close {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex: none;
    margin: -5px -5px 0 0;
    padding: 0 0 2px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ui-muted);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  .close:hover { background: var(--ui-bg); color: var(--ui-text); }
  .power {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    min-height: 42px;
    margin: 0 0 10px;
    padding: 7px 8px 7px 10px;
    border: 1px solid var(--ui-border);
    border-radius: 9px;
    background: #182225;
    color: var(--ui-text);
    text-align: left;
    cursor: pointer;
  }
  .power:hover { border-color: var(--ui-accent); }
  .power-copy { display: grid; gap: 1px; }
  .power-label { font-size: 11px; font-weight: 800; line-height: 1.2; }
  .power-state { color: var(--ui-muted); font-size: 9px; line-height: 1.2; }
  .power-track {
    position: relative;
    width: 32px;
    height: 18px;
    flex: none;
    border-radius: 999px;
    background: #5d6770;
  }
  .power-track::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--ui-text);
    transition: transform 140ms ease;
  }
  .power[aria-checked="true"] .power-track { background: var(--ui-accent); }
  .power[aria-checked="true"] .power-track::after { background: #101418; transform: translateX(14px); }
  .power:disabled { cursor: wait; opacity: .65; }
  .options { display: grid; gap: 6px; }
  .option {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) 14px;
    align-items: center;
    gap: 9px;
    width: 100%;
    min-height: 46px;
    margin: 0;
    padding: 6px 8px;
    border: 1px solid var(--ui-border);
    border-radius: 9px;
    background: var(--ui-bg);
    box-shadow: none;
    color: var(--ui-text);
    text-align: left;
    cursor: pointer;
  }
  .option:hover { border-color: var(--ui-accent); }
  .option[aria-pressed="true"] {
    border-color: var(--ui-accent);
    background: #202b2d;
  }
  .option:disabled { cursor: wait; opacity: .65; }
  .swatch {
    width: 32px;
    height: 32px;
    border: 1px solid rgba(255, 255, 255, .28);
    border-radius: 8px;
    background: var(--swatch);
    box-shadow: inset 0 0 0 4px var(--surface);
  }
  .option[data-theme-id="browser-archeology"] .swatch { border-radius: 1px; }
  .option[data-theme-id="liquid-dream"] .swatch { border-radius: 45% 55% 42% 58%; }
  .option[data-theme-id="monochrome-signal"] .swatch { border-color: #f03d3d; border-radius: 999px; }
  .option-copy { min-width: 0; }
  .option-name { display: block; font-size: 11px; font-weight: 800; line-height: 1.2; }
  .option-description {
    display: block;
    margin-top: 2px;
    overflow: hidden;
    color: var(--ui-muted);
    font-size: 9px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .selected {
    width: 12px;
    height: 12px;
    border: 2px solid var(--ui-muted);
    border-radius: 50%;
  }
  .option[aria-pressed="true"] .selected {
    border: 3px solid var(--ui-text);
    background: var(--ui-accent);
    box-shadow: 0 0 0 1px var(--ui-accent);
  }
  .status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 420px) {
    .panel { width: min(248px, calc(100vw - 16px)); }
    .toggle-kicker { display: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .power-track::after { transition: none; }
  }
`;

export function createThemePicker({ selectTheme, setEnabled }) {
  if (window.top !== window) return { render() {} };

  const host = document.createElement('surface-theme-picker-v1');
  host.id = HOST_ID;
  host.setAttribute('aria-label', 'Surface theme controls');
  for (const [property, value] of Object.entries({
    all: 'initial', position: 'fixed', right: 'max(12px, env(safe-area-inset-right))',
    bottom: 'max(12px, env(safe-area-inset-bottom))', zIndex: '2147483647',
    pointerEvents: 'none', display: 'none'
  })) host.style.setProperty(property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), value, 'important');

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style class="surface-picker-style-v1">${pickerStyles}</style>
    <aside class="picker" data-surface-picker-v1 aria-label="Theme controls">
      <button class="toggle" type="button" aria-expanded="false" aria-controls="surface-theme-panel-v1">
        <span class="toggle-icon" aria-hidden="true">✦</span>
        <span class="toggle-copy"><span class="toggle-kicker">${Object.keys(THEMES).length} themes</span><span class="toggle-label">Themes</span></span>
        <span class="chevron" aria-hidden="true"></span>
      </button>
      <section class="panel" id="surface-theme-panel-v1" aria-labelledby="surface-theme-heading-v1" hidden>
        <div class="header">
          <div><h2 id="surface-theme-heading-v1">Choose a theme</h2><p class="intro">Try a different look for this page.</p></div>
          <button class="close" type="button" aria-label="Close theme picker">×</button>
        </div>
        <button class="power" type="button" role="switch" aria-checked="true">
          <span class="power-copy"><span class="power-label">Surface themes</span><span class="power-state">On everywhere</span></span>
          <span class="power-track" aria-hidden="true"></span>
        </button>
        <div class="options" role="group" aria-label="Available themes"></div>
      </section>
      <p class="status" aria-live="polite"></p>
    </aside>`;

  const toggle = shadow.querySelector('.toggle');
  const panel = shadow.querySelector('.panel');
  const closeButton = shadow.querySelector('.close');
  const power = shadow.querySelector('.power');
  const powerState = shadow.querySelector('.power-state');
  const toggleKicker = shadow.querySelector('.toggle-kicker');
  const options = shadow.querySelector('.options');
  const status = shadow.querySelector('.status');
  const buttons = new Map();
  let currentSettings;
  let busy = false;

  for (const theme of Object.values(THEMES)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option';
    button.dataset.themeId = theme.id;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--swatch', theme.colors.background);
    button.style.setProperty('--surface', theme.colors.surface);
    button.innerHTML = '<span class="swatch" aria-hidden="true"></span><span class="option-copy"><span class="option-name"></span><span class="option-description"></span></span><span class="selected" aria-hidden="true"></span>';
    button.querySelector('.option-name').textContent = theme.name;
    button.querySelector('.option-description').textContent = theme.description;
    button.addEventListener('click', async () => {
      if (busy || currentSettings?.theme === theme.id) return;
      busy = true;
      power.disabled = true;
      for (const choice of buttons.values()) choice.disabled = true;
      status.textContent = `Applying ${theme.name}…`;
      try {
        const next = await selectTheme(theme.id);
        render(next, true);
        status.textContent = `${theme.name} is active.`;
      } catch (error) {
        status.textContent = `Could not apply ${theme.name}. ${error.message}`;
      } finally {
        busy = false;
        power.disabled = false;
        for (const choice of buttons.values()) choice.disabled = false;
      }
    });
    buttons.set(theme.id, button);
    options.append(button);
  }

  function mount() {
    if (!document.documentElement || host.isConnected) return Boolean(host.isConnected);
    document.documentElement.append(host);
    return true;
  }
  if (!mount()) {
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(document, { childList: true });
  }

  function setOpen(open, restoreFocus = false) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (open) buttons.get(currentSettings?.theme)?.focus();
    else if (restoreFocus) toggle.focus();
  }

  function render(nextSettings, visible) {
    currentSettings = nextSettings;
    host.style.setProperty('display', visible ? 'block' : 'none', 'important');
    host.setAttribute('aria-hidden', String(!visible));
    if (!visible) setOpen(false);
    for (const [id, button] of buttons) button.setAttribute('aria-pressed', String(id === nextSettings.theme));
    const active = THEMES[nextSettings.theme];
    power.setAttribute('aria-checked', String(nextSettings.enabled));
    powerState.textContent = nextSettings.enabled ? 'On everywhere' : 'Paused everywhere';
    toggleKicker.textContent = nextSettings.enabled ? `${Object.keys(THEMES).length} themes` : 'Surface paused';
    toggle.setAttribute('aria-label', `Choose theme. Current theme: ${active.name}. Surface is ${nextSettings.enabled ? 'on' : 'paused'}.`);
  }

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => setOpen(false, true));
  power.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    power.disabled = true;
    for (const choice of buttons.values()) choice.disabled = true;
    const enabling = !currentSettings.enabled;
    status.textContent = `${enabling ? 'Resuming' : 'Pausing'} Surface…`;
    try {
      const next = await setEnabled(enabling);
      render(next, true);
      status.textContent = `Surface is ${next.enabled ? 'on' : 'paused'} everywhere.`;
    } catch (error) {
      status.textContent = `Could not ${enabling ? 'resume' : 'pause'} Surface. ${error.message}`;
    } finally {
      busy = false;
      power.disabled = false;
      for (const choice of buttons.values()) choice.disabled = false;
    }
  });
  shadow.addEventListener('click', event => event.stopPropagation());
  shadow.addEventListener('pointerdown', event => event.stopPropagation());
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !event.composedPath().includes(host)) setOpen(false);
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) setOpen(false, true);
  });

  return { render };
}
