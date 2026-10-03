import { THEMES } from './themes.js';
import { hostname } from './settings.js';

const $ = id => document.getElementById(id);
let tab;
let settings;
let latestStatus = {};
const preview = {
  'terminal-vision': ['terminal', '> hello_', 'SYSTEM READY'],
  'browser-archeology': ['archeology', 'www.', 'WELCOME'],
  'liquid-dream': ['liquid', 'flow', 'IN COLOR']
};

for (const theme of Object.values(THEMES)) {
  const [className, title, subtitle] = preview[theme.id];
  const label = document.createElement('label');
  label.className = 'theme-choice';
  label.innerHTML = `<input type="radio" name="theme" value="${theme.id}"><span class="theme-card"><span class="preview ${className}" aria-hidden="true"><strong></strong><small></small></span><span class="theme-copy"><strong></strong><small></small></span><span class="selected-dot" aria-hidden="true"></span></span>`;
  label.querySelector('.preview strong').textContent = title;
  label.querySelector('.preview small').textContent = subtitle;
  label.querySelector('.theme-copy strong').textContent = theme.name;
  label.querySelector('.theme-copy small').textContent = theme.description;
  label.querySelector('input').addEventListener('change', () => update({ theme: theme.id }));
  $('themes').append(label);
}

async function request(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw new Error(result?.error || 'The extension did not respond');
  return result;
}
function showError(error) {
  $('status').textContent = error.message;
  $('status-dot').className = 'dot error';
}
function render() {
  document.querySelector(`input[name="theme"][value="${settings.theme}"]`).checked = true;
  $('renderer').value = settings.renderer;
  $('corrections').checked = settings.corrections;
  $('pause').textContent = settings.enabled ? 'Pause all' : 'Resume all';
  $('pause').setAttribute('aria-pressed', String(!settings.enabled));
  const host = hostname(tab?.url);
  $('hostname').textContent = host || 'This page is unavailable';
  $('site-enabled').checked = Boolean(host && !settings.disabledHosts.includes(host));
  $('site-enabled').disabled = !host;
  $('renderer-help').textContent = {
    simple: 'Generic styling using recognizable page elements.',
    adaptive: 'Dark Reader adapts site colors underneath the same expressive styling. Experimental.',
    contextual: 'Checks text against solid and translucent surfaces while keeping the theme’s colors. Media remains conservative. Experimental.'
  }[settings.renderer];
}
async function update(patch) {
  try {
    settings = (await request({ type: 'settings:update', patch })).settings;
    render();
    $('status').textContent = 'Applying your choice…';
    setTimeout(refreshStatus, 150);
  } catch (error) { showError(error); }
}
async function refreshStatus() {
  if (!hostname(tab?.url)) {
    $('status').textContent = 'Open an ordinary website to try a theme.';
    $('status-dot').className = 'dot disabled';
    return;
  }
  try {
    latestStatus = await chrome.tabs.sendMessage(tab.id, { type: 'status:get' }, { frameId: 0 });
    if (!latestStatus) throw new Error('Reload this page to connect the extension.');
    const messages = {
      active: `${settings.renderer === 'adaptive' ? 'Adaptation + theme' : settings.renderer === 'contextual' ? 'Contextual theme' : 'Theme'} is active.`,
      disabled: settings.enabled ? 'Original appearance on this website.' : 'Paused on every website.',
      applying: 'Applying your choice…', starting: 'Connecting to this page…', error: latestStatus.error
    };
    $('status').textContent = messages[latestStatus.state] || 'Connecting…';
    $('status-dot').className = `dot ${latestStatus.state === 'error' ? 'error' : latestStatus.state === 'disabled' ? 'disabled' : ''}`;
    $('retry').hidden = latestStatus.state !== 'error';
    $('diagnostics').textContent = JSON.stringify(latestStatus, null, 2);
  } catch { $('status').textContent = 'Reload this page to connect the extension.'; }
}

$('pause').addEventListener('click', () => update({ enabled: !settings.enabled }));
$('site-enabled').addEventListener('change', () => update({ siteHost: hostname(tab?.url), siteEnabled: $('site-enabled').checked }));
$('renderer').addEventListener('change', () => update({ renderer: $('renderer').value }));
$('corrections').addEventListener('change', () => update({ corrections: $('corrections').checked }));
$('retry').addEventListener('click', async () => {
  try { await chrome.tabs.sendMessage(tab.id, { type: 'retry' }, { frameId: 0 }); await refreshStatus(); }
  catch (error) { showError(error); }
});
$('export').addEventListener('click', () => {
  const report = { version: 1, recordedAt: new Date().toISOString(), host: hostname(tab?.url), theme: settings.theme, renderer: settings.renderer, corrections: settings.corrections, note: $('note').value, diagnostics: latestStatus };
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = `surface-note-${report.host || 'page'}-${Date.now()}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try {
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  settings = (await request({ type: 'settings:get' })).settings;
  render();
  if (hostname(tab?.url)) await request({ type: 'tab:connect', tabId: tab.id }).catch(() => {});
  await refreshStatus();
  setInterval(refreshStatus, 1000);
} catch (error) { showError(error); }
