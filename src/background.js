import { normalizeSettings, updateSettings, hostname } from './settings.js';

let writes = Promise.resolve();
const readSettings = async () => normalizeSettings((await chrome.storage.local.get('settings')).settings);
// Extension-owned pages are trusted whether opened as the toolbar popup or in a
// normal extension tab (the latter is how the isolated browser suite exercises it).
const fromExtensionPage = sender => sender.url?.startsWith(chrome.runtime.getURL(''));

async function handle(message, sender) {
  if (sender.id !== chrome.runtime.id) throw new Error('Unknown sender');
  switch (message?.type) {
    case 'settings:get':
      return { settings: await readSettings(), topHost: hostname(sender.tab?.url || sender.url), frameHost: hostname(sender.url) };
    case 'settings:update': {
      if (!fromExtensionPage(sender)) throw new Error('Settings are editable only from the extension');
      const operation = writes.then(async () => {
        const settings = updateSettings(await readSettings(), message.patch || {});
        await chrome.storage.local.set({ settings });
        return { settings };
      });
      writes = operation.catch(() => {});
      return operation;
    }
    case 'styles:replace': {
      if (!sender.tab || !hostname(sender.url) || !sender.documentId) throw new Error('Unsupported document');
      const { previous = '', next = '' } = message;
      if ([previous, next].some(css => typeof css !== 'string' || css.length > 100000)) throw new Error('Invalid stylesheet');
      if (previous === next) return { applied: true };
      const target = { tabId: sender.tab.id, documentIds: [sender.documentId] };
      if (next) await chrome.scripting.insertCSS({ target, css: next, origin: 'USER' });
      try {
        if (previous) await chrome.scripting.removeCSS({ target, css: previous, origin: 'USER' });
      } catch (error) {
        if (next) await chrome.scripting.removeCSS({ target, css: next, origin: 'USER' }).catch(() => {});
        throw error;
      }
      return { applied: true };
    }
    case 'stylesheet:fetch': {
      // No page-facing bridge; only this extension's isolated content script can request this.
      if (!sender.tab || !hostname(sender.url)) throw new Error('Unsupported document');
      const url = new URL(message.url);
      if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new Error('Unsupported stylesheet URL');
      const response = await fetch(url.href, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Stylesheet request failed (${response.status})`);
      const type = response.headers.get('content-type') || 'text/css';
      if (!/^(text\/|application\/(css|octet-stream))/i.test(type)) throw new Error('Only stylesheet text is fetched');
      const reader = response.body.getReader();
      const chunks = []; let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 3 * 1024 * 1024) throw new Error('Stylesheet exceeds the experiment’s 3 MB limit');
          chunks.push(value);
        }
      } finally { await reader.cancel().catch(() => {}); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      return { text: new TextDecoder().decode(bytes), contentType: type };
    }
    case 'tab:connect': {
      if (!fromExtensionPage(sender) || !Number.isInteger(message.tabId)) throw new Error('Invalid tab');
      const tab = await chrome.tabs.get(message.tabId);
      if (!hostname(tab.url)) throw new Error('This page cannot be themed');
      await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['content.js'] });
      return { connected: true };
    }
    default: throw new Error('Unknown request');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handle(message, sender).then(result => sendResponse({ ok: true, ...result }), error => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({ settings: await readSettings() });
});
