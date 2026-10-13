import test from 'node:test';
import assert from 'node:assert/strict';

global.chrome = {
  storage: {
    local: {
      get: async () => ({ settings: {} }),
      set: async () => {},
    },
    onChanged: { addListener: () => {} }
  },
  runtime: {
    id: 'test-ext-id',
    getURL: path => `chrome-extension://test-ext-id/${path}`,
    onMessage: { addListener: () => {} },
    onInstalled: { addListener: () => {} }
  },
  scripting: {
    getRegisteredContentScripts: async () => [],
    registerContentScripts: async () => {},
    unregisterContentScripts: async () => {},
    updateContentScripts: async () => {},
    insertCSS: async () => {},
    removeCSS: async () => {}
  },
  tabs: {
    get: async () => ({ id: 1, url: 'https://example.com' })
  }
};

const messageListeners = [];
global.chrome.runtime.onMessage.addListener = (listener) => {
  messageListeners.push(listener);
};

await import('../src/background.js');

test('styles:replace handles removal error and rolls back inserted css', async () => {
  let removeError = null;
  const calls = [];

  global.chrome.scripting.insertCSS = async (args) => {
    calls.push({ method: 'insertCSS', args });
  };
  global.chrome.scripting.removeCSS = async (args) => {
    calls.push({ method: 'removeCSS', args });
    if (args.css === 'previous-css') {
      throw new Error('Simulated removal error');
    }
  };

  const listener = messageListeners[0];
  const sender = {
    id: 'test-ext-id',
    tab: { id: 10, url: 'https://example.com' },
    url: 'https://example.com',
    documentId: 'doc-1'
  };

  const message = {
    type: 'styles:replace',
    previous: 'previous-css',
    next: 'next-css'
  };

  let response;
  const sendResponse = (res) => { response = res; };

  await new Promise(resolve => {
    const originalSendResponse = sendResponse;
    const interceptedSendResponse = (res) => {
      originalSendResponse(res);
      resolve();
    };
    listener(message, sender, interceptedSendResponse);
  });

  assert.equal(response.ok, false);
  assert.equal(response.error, 'Simulated removal error');

  assert.deepEqual(calls, [
    {
      method: 'insertCSS',
      args: { target: { tabId: 10, documentIds: ['doc-1'] }, css: 'next-css', origin: 'USER' }
    },
    {
      method: 'removeCSS',
      args: { target: { tabId: 10, documentIds: ['doc-1'] }, css: 'previous-css', origin: 'USER' }
    },
    {
      method: 'removeCSS',
      args: { target: { tabId: 10, documentIds: ['doc-1'] }, css: 'next-css', origin: 'USER' }
    }
  ]);
});
