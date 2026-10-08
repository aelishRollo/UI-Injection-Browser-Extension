import { normalizeSettings, updateSettings, hostname } from './settings.js';
import { THEME_IDS } from './themes.js';

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
    case 'theme:select': {
      if (!sender.tab || sender.frameId !== 0 || !hostname(sender.url) || !THEME_IDS.includes(message.theme)) throw new Error('Invalid theme selection');
      const operation = writes.then(async () => {
        const settings = updateSettings(await readSettings(), { theme: message.theme });
        await chrome.storage.local.set({ settings });
        return { settings };
      });
      writes = operation.catch(() => {});
      return operation;
    }
    case 'enabled:set': {
      if (!sender.tab || sender.frameId !== 0 || !hostname(sender.url) || typeof message.enabled !== 'boolean') throw new Error('Invalid enabled state');
      const operation = writes.then(async () => {
        const settings = updateSettings(await readSettings(), { enabled: message.enabled });
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
