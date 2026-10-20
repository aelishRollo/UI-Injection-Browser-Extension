import test from 'node:test';
import assert from 'node:assert/strict';
import { _testHelpers } from '../src/contextual.js';

test('captureAuthoredCanvasBackground handles getComputedStyle errors safely', () => {
  const originalDocument = global.document;
  const originalElement = global.Element;
  const originalGetComputedStyle = global.getComputedStyle;
  const originalWindow = global.window;

  try {
    let removeAttributeCalled = false;
    const root = {
      hasAttribute: () => false,
      setAttribute: () => {},
      removeAttribute: (attr) => {
        if (attr === 'data-surface-ready-v2') {
          removeAttributeCalled = true;
        }
      }
    };

    class MockElement {}
    const body = new MockElement();

    global.document = {
      documentElement: root,
      body: body
    };

    global.window = {
        document: global.document
    }

    global.Element = MockElement;

    global.getComputedStyle = () => {
      throw new Error("mock error in getComputedStyle");
    };

    _testHelpers.captureAuthoredCanvasBackground();

    assert.equal(_testHelpers.authoredCanvasBackground, '#ffffff');
    assert.equal(removeAttributeCalled, true);
  } finally {
    global.document = originalDocument;
    global.Element = originalElement;
    global.getComputedStyle = originalGetComputedStyle;
    global.window = originalWindow;
  }
});
