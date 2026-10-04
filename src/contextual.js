import { parseColor, compositeLayers, contrastRatio, minimumContrast, readableColor } from './contrast.js';

// Renderer C is a bounded experiment: annotate understood regions, keep uncertain
// regions unchanged, and remove every annotation/custom property on teardown.
const ATTR_CONTEXT = 'data-surface-context-v1';
const ATTR_TEXT = 'data-surface-text-v1';
const ATTR_TONE = 'data-surface-tone-v1';
const ATTR_CONFIDENCE = 'data-surface-confidence-v1';
const ATTR_PROMINENT = 'data-surface-prominent-v1';
const ATTR_ICON = 'data-surface-ui-icon-v1';
const ATTR_PURPOSE = 'data-surface-purpose-v1';
const ATTR_PAIR = 'data-surface-pair-v1';
const ATTR_WINDOW = 'data-surface-window-v1';
const ATTR_WINDOW_TITLE = 'data-surface-window-title-v1';
const RESOLVED_COLOR = '--surface-readable-color-v1';
const ORIGINAL_COLOR = '--surface-original-color-v1';
const ORIGINAL_BACKGROUND = '--surface-original-background-v1';

let observer;
let readinessListener;
let running = false;
let activeTheme = '';
let palette;
let activeCorrections = { roles: {}, preserve: [] };
let touched = new Map();
let uncertainty = { media: 0, imageBackground: 0, unknownSurface: 0 };

function record(element) {
  let state = touched.get(element);
  if (!state) {
    state = { attrs: new Map(), properties: new Map() };
    touched.set(element, state);
  }
  return state;
}

function setAttribute(element, name, value) {
  const state = record(element);
  if (!state.attrs.has(name)) state.attrs.set(name, element.hasAttribute(name) ? element.getAttribute(name) : null);
  element.setAttribute(name, value);
}

function setProperty(element, name, value) {
  const state = record(element);
  if (!state.properties.has(name)) state.properties.set(name, { value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) });
  element.style.setProperty(name, value);
}

function restoreAll() {
  for (const [element, state] of touched) {
    for (const [name, value] of state.attrs) {
      if (value === null) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
    for (const [name, original] of state.properties) {
      if (original.value) element.style.setProperty(name, original.value, original.priority);
      else element.style.removeProperty(name);
    }
  }
  touched.clear();
}

function collect(root, selector) {
  const result = [];
  if (root instanceof Element && root.matches(selector)) result.push(root);
  result.push(...root.querySelectorAll(selector));
  return result;
}

function isVisible(element) {
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isOpaque(color) {
  if (!color || color === 'transparent') return false;
  const alpha = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)$/i)?.[1];
  return alpha === undefined || Number(alpha) > 0.98;
}

function backingFor(element) {
  for (let current = element; current instanceof Element; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (style.backgroundImage !== 'none') return { element: current, color: style.backgroundColor, image: true };
    if (isOpaque(style.backgroundColor)) return { element: current, color: style.backgroundColor, image: false };
  }
  return null;
}

function mediaRects() {
  return [...document.querySelectorAll('img,picture,video,canvas,object,embed,svg[role="img"],svg[aria-label]')]
    .filter(isVisible)
    .map(element => ({ element, rect: element.getBoundingClientRect() }));
}

function overlapsMedia(element, media) {
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  return media.some(item => item.element !== element && !element.contains(item.element) && x >= item.rect.left && x <= item.rect.right && y >= item.rect.top && y <= item.rect.bottom);
}

function selectorList(values = []) {
  return values.filter(Boolean).join(',');
}

function isProtected(element) {
  const selector = selectorList(['svg', 'math', '[contenteditable="true"]', ...activeCorrections.preserve]);
  return Boolean(selector && element.closest(selector));
}

function markBrands(root) {
  const candidates = collect(root, '[class*="logo" i],[id*="logo" i],[class*="brand" i],[id*="brand" i],[class*="wordmark" i],[id*="wordmark" i],img[alt*="logo" i],svg[aria-label*="logo" i]');
  for (const candidate of candidates) {
    if (!isVisible(candidate)) continue;
    const target = candidate.closest('a,button,[role="link"]') || candidate;
    if (target.closest(`[${ATTR_CONTEXT}="brand"]`) && target.getAttribute(ATTR_CONTEXT) !== 'brand') continue;
    const backing = backingFor(target);
    setAttribute(target, ATTR_CONTEXT, 'brand');
    setAttribute(target, ATTR_CONFIDENCE, 'high');
    setProperty(target, ORIGINAL_BACKGROUND, backing?.color && isOpaque(backing.color) ? backing.color : '#ffffff');
    setProperty(target, ORIGINAL_COLOR, getComputedStyle(target).color);
  }
}

function canOwnSurface(element) {
  if (!isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) return false;
  const style = getComputedStyle(element);
  const controlCount = element.querySelectorAll('button,input,select,textarea,[role="button"]:not([aria-hidden="true"])').length;
  // A large composite application region is not one coherent reading surface.
  // Its smaller, understood descendants can still be classified independently.
  return style.backgroundImage === 'none' && controlCount <= 6 && (element.innerText || '').trim().length >= 40;
}

function markSurface(element, context) {
  if (!canOwnSurface(element) || element.closest(`[${ATTR_CONTEXT}="content"],[${ATTR_CONTEXT}="chrome"]`)) return false;
  setAttribute(element, ATTR_CONTEXT, context);
  setAttribute(element, ATTR_CONFIDENCE, 'high');
  return true;
}

function markSurfaces(root) {
  const corrected = selectorList(activeCorrections.roles.surface);
  const primary = `article,aside,dialog,fieldset,[role="dialog"],[role="menu"],[role="listbox"],[role="region"]${corrected ? `,${corrected}` : ''}`;
  for (const element of collect(root, primary)) markSurface(element, 'content');
  for (const element of collect(root, 'section')) {
    if (!element.querySelector(`[${ATTR_CONTEXT}="content"]`) && element.querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]')) markSurface(element, 'content');
  }
  for (const element of collect(root, 'main,[role="main"]')) {
    if (!element.querySelector(`[${ATTR_CONTEXT}="content"]`)) markSurface(element, 'content');
  }
  for (const element of collect(root, 'header,footer,nav,[role="banner"],[role="navigation"],[role="contentinfo"]')) {
    if (!isVisible(element) || isProtected(element) || getComputedStyle(element).backgroundImage !== 'none') continue;
    if (element.closest(`[${ATTR_CONTEXT}="chrome"]`)) continue;
    setAttribute(element, ATTR_CONTEXT, 'chrome');
    setAttribute(element, ATTR_CONFIDENCE, 'high');
  }
}

// Theme-independent purpose, separate from paint ownership and text contrast.
// Every theme consumes the same recognized hierarchy.
function markPurposes(root) {
  const reading = `[${ATTR_PURPOSE}="reading"]`;
  const safe = element => isVisible(element) && !isProtected(element) &&
    !element.closest(`[${ATTR_CONTEXT}="brand"]`) &&
    getComputedStyle(element).backgroundImage === 'none';
  const assign = (element, purpose, context, evidence) => {
    if (!safe(element)) return;
    setAttribute(element, ATTR_PURPOSE, purpose);
    setAttribute(element, 'data-surface-evidence-v1', evidence);
    if (context) {
      setAttribute(element, ATTR_CONTEXT, context);
      setAttribute(element, ATTR_CONFIDENCE, 'high');
    }
  };
  const landmarks = collect(root, 'main,[role="main"],article');
  // display:contents supplies semantics but has no box to paint. Inspect only
  // its direct prose children, never turn its navigation rails into documents.
  const candidates = landmarks.flatMap(element => getComputedStyle(element).display === 'contents'
    ? [...element.children].filter(child => child.matches('div,section,article') && child.querySelector('h1,h2,[role="heading"]'))
    : [element]);
  for (const element of candidates) {
    const paragraphs = element.querySelectorAll('p').length;
    const controls = element.querySelectorAll('button,input,select,textarea,[role="button"]').length;
    if (paragraphs >= 3 && controls <= Math.max(6, paragraphs * 2) &&
        (element.innerText || '').length >= 300 && !element.parentElement?.closest(reading)) {
      assign(element, 'reading', 'content', landmarks.includes(element) ? 'prose-landmark' : 'boxless-landmark-prose');
    }
  }
  for (const element of collect(root, `[${ATTR_CONTEXT}="content"],section,article`)) {
    if (!element.hasAttribute(ATTR_CONTEXT) && (!element.closest(reading) || !element.querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]'))) continue;
    if (element.matches(reading)) continue;
    const inReading = element.parentElement?.closest(reading);
    const panel = element.matches('aside,dialog,fieldset,[role="dialog"],[role="menu"],[role="listbox"]');
    assign(element, inReading && !panel ? 'section' : 'panel', 'content', panel ? 'semantic-panel' : 'content-hierarchy');
  }
  // A floated, bordered key/value table is an auxiliary fact panel. Ordinary
  // data tables keep their own role; neither relies on a Wikipedia class name.
  for (const element of collect(root, 'table')) {
    if (!element.closest(reading)) continue;
    const style = getComputedStyle(element);
    const panel = style.cssFloat !== 'none' && parseFloat(style.borderTopWidth) > 0 &&
      element.querySelector('th') && element.querySelector('td');
    assign(element, panel ? 'panel' : 'data', 'content', panel ? 'floated-bordered-facts' : 'semantic-table');
  }
  for (const element of collect(root, `[${ATTR_CONTEXT}="chrome"]`)) assign(element, 'navigation', null, 'semantic-navigation');
  for (const element of collect(root, 'h1,h2,[role="heading"][aria-level="1"],[role="heading"][aria-level="2"]')) {
    const backing = backingFor(element);
    if (backing?.image && !backing.element.hasAttribute(ATTR_PURPOSE)) continue;
    const title = element.matches('h1,[aria-level="1"]');
    if (!title && !element.closest(reading)) continue;
    const parent = element.parentElement;
    const group = !title && parent?.matches('div,header') &&
      !parent.querySelector('p,table,img,input,button,h1,h3,h4,h5,h6') &&
      parent.querySelectorAll('h2,[role="heading"]').length === 1 &&
      parent.textContent.trim().length <= element.textContent.trim().length + 80;
    assign(group ? parent : element, title ? 'title' : 'section-heading', null, group ? 'heading-with-utilities' : 'heading-level');
  }
  for (const element of collect(root, `[${ATTR_CONTEXT}="control"]`)) {
    assign(element, element.matches('textarea,select,input:not([type="button"],[type="submit"],[type="reset"],[type="checkbox"],[type="radio"],[type="range"],[type="color"])') ? 'field' : 'action', null, 'native-control');
  }
}

// Only neutral, solid ancestor wrappers around a known document are page shells.
// Do not extrapolate from white to arbitrary cards, images or colored status UI.
function markShells(root) {
  for (const reading of collect(root, '[data-surface-purpose-v1="reading"]')) {
    for (let element = reading.parentElement; element && element !== document.body; element = element.parentElement) {
      if (element.hasAttribute(ATTR_CONTEXT) || !element.matches('div,main') || isProtected(element)) continue;
      const style = getComputedStyle(element);
      const color = parseColor(style.backgroundColor);
      if (!color || color[3] !== 1 || Math.min(...color.slice(0, 3)) < 230 ||
          Math.max(...color.slice(0, 3)) - Math.min(...color.slice(0, 3)) > 18 ||
          style.backgroundImage !== 'none' || hasUncertainPaint(style) ||
          element.getBoundingClientRect().width < innerWidth * .6) continue;
      setAttribute(element, ATTR_CONTEXT, 'shell');
      setAttribute(element, ATTR_CONFIDENCE, 'medium');
      setAttribute(element, 'data-surface-evidence-v1', 'neutral-document-ancestor');
    }
  }
}

function markUtilityPanels(root) {
  for (const element of collect(root, 'div,aside,nav,form')) {
    if (element.hasAttribute(ATTR_CONTEXT) || !isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    const style = getComputedStyle(element);
    const color = parseColor(style.backgroundColor);
    if (!color || color[3] !== 1 || Math.min(...color.slice(0,3)) < 230 ||
        Math.max(...color.slice(0,3)) - Math.min(...color.slice(0,3)) > 18 ||
        style.backgroundImage !== 'none' || hasUncertainPaint(style)) continue;
    const rect = element.getBoundingClientRect();
    if (rect.width < 100 || rect.width > 400 || rect.height < 100 || element.querySelector('img,video,canvas,article,main')) continue;
    const links = [...element.querySelectorAll('a[href]')];
    const textLength = element.textContent.replace(/\s+/g, '').length;
    const navigation = links.length >= 4 && links.reduce((sum, a) => sum + a.textContent.replace(/\s+/g, '').length, 0) / textLength >= .6;
    const settings = element.querySelectorAll('input[type="radio"]').length >= 3 && element.querySelectorAll('label').length >= 3;
    if (!navigation && !settings) continue;
    setAttribute(element, ATTR_CONTEXT, 'chrome');
    setAttribute(element, ATTR_PURPOSE, 'navigation');
    setAttribute(element, ATTR_CONFIDENCE, 'medium');
    setAttribute(element, 'data-surface-evidence-v1', navigation ? 'neutral-link-rail' : 'neutral-settings-rail');
  }
}

// Reuse actual document/panel headings as window chrome. The owner frame and
// title decoration add no DOM, actions or accessibility semantics.
function markWindows(root) {
  for (const owner of collect(root, `[${ATTR_PURPOSE}="reading"],[${ATTR_PURPOSE}="panel"],[${ATTR_PURPOSE}="navigation"][data-surface-evidence-v1^="neutral-"]`)) {
    if (!isVisible(owner) || isProtected(owner)) continue;
    let title = owner.querySelector(`[${ATTR_PURPOSE}="title"]`);
    if (!title && owner.matches('table')) {
      title = owner.querySelector(':scope > caption,:scope > thead > tr:first-child > th:only-child,:scope > tbody > tr:first-child > th:only-child,:scope > tr:first-child > th:only-child');
    }
    if (!title) title = owner.querySelector('legend,h1,h2,h3,[role="heading"]');
    if (title) {
      const ownerPurpose = owner.getAttribute(ATTR_PURPOSE);
      const closestOwner = title.closest(ownerPurpose === 'navigation'
        ? `[${ATTR_PURPOSE}="navigation"]`
        : `[${ATTR_PURPOSE}="reading"],[${ATTR_PURPOSE}="panel"]`);
      if (closestOwner !== owner) title = null;
    }
    // Reading regions already have a high-confidence title bar. Require a real
    // title for smaller panels so plain cards do not all become fake windows.
    if (!title && owner.getAttribute(ATTR_PURPOSE) === 'panel') continue;
    setAttribute(owner, ATTR_WINDOW, title ? 'titled' : 'frame');
    if (title) setAttribute(title, ATTR_WINDOW_TITLE, owner.getAttribute(ATTR_PURPOSE));
  }
}

function markGlyphs(root) {
  // Restrict replacement to empty, already-painted HTML icon slots. Labels and
  // ARIA supply meaning; no class-name, URL-name, logo or SVG-pixel guessing.
  for (const element of collect(root, 'span,i')) {
    if (element.children.length || element.textContent.trim() || !isVisible(element) || isProtected(element) ||
        element.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (rect.width < 10 || rect.width > 40 || rect.height < 10 || rect.height > 40 ||
        style.maskImage === 'none' || parseFloat(style.borderTopWidth) || parseFloat(style.borderLeftWidth)) continue;
    const control = element.closest('button,[role="button"],label[for]');
    const owner = control instanceof HTMLLabelElement ? control.control : control;
    const name = (owner?.getAttribute('aria-label') || control?.getAttribute('aria-label') || control?.textContent || '').trim();
    let role;
    if (/^(main )?menu$/i.test(name)) role = 'menu';
    else if (/^(search|find)(\s|$)/i.test(name)) role = 'search';
    else if (/^(\d+ )?languages?$/i.test(name)) role = 'language';
    else if (/^(tools|more|more options)$/i.test(name)) role = 'more';
    else if (/^(home|homepage)$/i.test(name)) role = 'home';
    else if (/^(history|view history)$/i.test(name)) role = 'history';
    else if (/^(settings|preferences|appearance)$/i.test(name)) role = 'settings';
    else if (/^(download|save|save file)$/i.test(name)) role = 'download';
    // An icon next to exactly one search input is another strong signal.
    if (!role && element.parentElement.querySelectorAll('input').length === 1 &&
        element.parentElement.querySelector('input[type="search"]')) role = 'search';
    if (!role || control?.closest(`[${ATTR_CONTEXT}="overlay"]`)) continue;
    setAttribute(element, 'data-surface-glyph-v1', role);
    if (control instanceof HTMLLabelElement && owner?.matches('input[role="button"]')) {
      setAttribute(control, ATTR_CONTEXT, 'control');
      setAttribute(control, ATTR_CONFIDENCE, 'high');
    }
  }
  if (activeTheme === 'terminal-vision') return;
  for (const heading of collect(root, 'h1,h2')) {
    if (!isVisible(heading) || isProtected(heading) || heading.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    if (activeTheme === 'browser-archeology' && heading.hasAttribute(ATTR_WINDOW_TITLE)) continue;
    const purpose = heading.closest(`[${ATTR_PURPOSE}="title"],[${ATTR_PURPOSE}="section-heading"]`);
    const before = getComputedStyle(heading, '::before');
    if (!purpose || !['none', 'normal'].includes(before.content) || before.backgroundImage !== 'none' || before.maskImage !== 'none') continue;
    setAttribute(heading, 'data-surface-heading-glyph-v1', purpose.getAttribute(ATTR_PURPOSE) === 'title' ? 'document' : 'section');
  }
}

function markPage() {
  const bodyStyle = getComputedStyle(document.body);
  const htmlStyle = getComputedStyle(document.documentElement);
  if (bodyStyle.backgroundImage !== 'none' || htmlStyle.backgroundImage !== 'none') {
    setAttribute(document.body, ATTR_CONTEXT, 'preserve');
    setAttribute(document.body, ATTR_CONFIDENCE, 'low');
    uncertainty.imageBackground++;
    return;
  }
  for (const element of [document.documentElement, document.body]) {
    setAttribute(element, ATTR_CONTEXT, 'page');
    setAttribute(element, ATTR_CONFIDENCE, 'high');
  }
}

function markControls(root, media) {
  const correctedButton = selectorList(activeCorrections.roles.button);
  const correctedOverlay = selectorList(activeCorrections.roles['overlay-control']);
  const selector = `button,[role="button"],input:not([type="hidden"]),textarea,select${correctedButton ? `,${correctedButton}` : ''}${correctedOverlay ? `,${correctedOverlay}` : ''}`;
  for (const element of collect(root, selector)) {
    if (!isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    const forcedOverlay = Boolean(correctedOverlay && element.matches(correctedOverlay));
    const backing = backingFor(element);
    const authoredImage = backing?.image && !backing.element.hasAttribute(ATTR_PURPOSE);
    if (forcedOverlay || authoredImage || overlapsMedia(element, media)) {
      setAttribute(element, ATTR_CONTEXT, 'overlay');
      setAttribute(element, ATTR_CONFIDENCE, 'low');
      setProperty(element, ORIGINAL_COLOR, getComputedStyle(element).color);
      uncertainty.media++;
    } else {
      setAttribute(element, ATTR_CONTEXT, 'control');
      setAttribute(element, ATTR_CONFIDENCE, 'high');
    }
    for (const icon of element.querySelectorAll('svg:not([aria-label*="logo" i])')) setAttribute(icon, ATTR_ICON, 'true');
  }
}

function directText(element) {
  return [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
}

function textRole(element) {
  if (element.closest('h1,h2,h3,h4,h5,h6,[role="heading"]')) return 'heading';
  if (element.closest('a[href],[role="link"]')) return 'link';
  if (element.closest('pre,code,kbd,samp')) return 'code';
  return 'text';
}

function hasUncertainPaint(style) {
  return Number(style.opacity) < 1 || style.mixBlendMode !== 'normal' || style.filter !== 'none' ||
    (style.backdropFilter && style.backdropFilter !== 'none') || style.backgroundClip === 'text' ||
    (style.maskImage && style.maskImage !== 'none');
}

function pseudoMayCoverText(owner, paint, textElement) {
  // In-flow icons are separate boxes, not text backdrops. Keep uncertain
  // transforms/negative spacing conservative, and retain true overlay paint.
  const margins = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'].map(key => parseFloat(paint[key]));
  if (paint.position === 'static' && paint.transform === 'none' && paint.float === 'none' && margins.every(n => n >= 0)) return false;
  if (paint.position === 'absolute' && paint.transform === 'none' && margins.every(n => n === 0) && getComputedStyle(owner).position !== 'static') {
    const [left, top, width, height] = ['left', 'top', 'width', 'height'].map(key => parseFloat(paint[key]));
    if ([left, top, width, height].every(Number.isFinite)) {
      const box = owner.getBoundingClientRect();
      const text = textElement.getBoundingClientRect();
      const style = getComputedStyle(owner);
      const x = box.left + parseFloat(style.borderLeftWidth) + left;
      const y = box.top + parseFloat(style.borderTopWidth) + top;
      return x < text.right && x + width > text.left && y < text.bottom && y + height > text.top;
    }
  }
  return true;
}

function backgroundForText(element) {
  const layers = [];
  let owner;
  let themed = false;
  let opaque = false;
  // Check ancestor effects even above an opaque background: opacity/filter apply
  // to the entire group, not just to that ancestor's own background paint.
  for (let current = element; current instanceof Element; current = current.parentElement) {
    const style = getComputedStyle(current);
    if (hasUncertainPaint(style)) return { reason: 'effects' };
    if (opaque) continue;
    const context = current.getAttribute(ATTR_CONTEXT);
    if (context === 'overlay' || context === 'preserve') return { reason: 'media' };
    const purpose = current.getAttribute(ATTR_PURPOSE);
    const headingPaint = (activeTheme === 'liquid-dream' && ['title', 'section-heading'].includes(purpose)) || (activeTheme === 'browser-archeology' && purpose === 'title');
    const windowTitlePaint = activeTheme === 'browser-archeology' && current.hasAttribute(ATTR_WINDOW_TITLE);
    const ownsTheme = headingPaint || windowTitlePaint || ['page', 'shell', 'content', 'chrome', 'control'].includes(context);
    for (const pseudo of ['::before', '::after']) {
      if (pseudo === '::before' && current.hasAttribute('data-surface-heading-glyph-v1')) continue;
      const paint = getComputedStyle(current, pseudo);
      if (!['none', 'normal'].includes(paint.content) && paint.display !== 'none' &&
          (paint.backgroundImage !== 'none' || (parseColor(paint.backgroundColor)?.[3] || 0) > 0) &&
          pseudoMayCoverText(current, paint, element)) return { reason: 'pseudo' };
    }
    let color;
    if (ownsTheme) {
      color = (headingPaint || windowTitlePaint) && activeTheme === 'browser-archeology' ? palette.accent : ['page', 'shell'].includes(context) ? palette.background : context === 'chrome' && activeTheme === 'browser-archeology' ? '#d4d0c8' : palette.surface;
      if (context === 'control') {
        const selected = current.matches('[aria-selected="true"],[aria-pressed="true"],[aria-current]:not([aria-current="false"])');
        color = selected ? palette.accent : purpose === 'field' ? palette.surface : (palette.control || palette.surface);
      }
    } else {
      if (style.backgroundImage !== 'none') return { reason: 'image' };
      color = style.backgroundColor;
      if (current.getAttribute(ATTR_TEXT) === 'code' && current.getAttribute(ATTR_TONE) === 'theme') color = palette.raised;
    }
    const parsed = parseColor(color);
    if (!parsed) return { reason: 'color-space' };
    if (parsed[3] > 0) {
      owner ||= current;
      layers.push(parsed);
      if (parsed[3] === 1) {
        opaque = true;
        // A translucent authored layer changes the effective surface too.
        themed = ownsTheme && layers.length === 1;
      }
    }
  }
  const color = compositeLayers(layers);
  return color ? { color, owner, themed } : { reason: 'canvas' };
}

function markText(root, media) {
  const candidates = collect(root, '*').filter(element =>
    element instanceof HTMLElement && isVisible(element) && directText(element) &&
    !element.matches('script,style,noscript,option') && !isProtected(element) &&
    !element.closest(`[${ATTR_CONTEXT}="brand"]`));
  // Snapshot all foregrounds before applying annotations: parent overrides must
  // not become a child's supposed original color during incremental scans.
  const originals = new Map(candidates.map(element => [element, getComputedStyle(element).color]));
  for (const element of candidates) {
    const role = textRole(element);
    const original = originals.get(element);
    const style = getComputedStyle(element);
    const backing = style.webkitTextFillColor && style.webkitTextFillColor !== style.color
      ? { reason: 'effects' } : backgroundForText(element);
    const mediaBacked = overlapsMedia(element, media);
    const control = element.closest(`[${ATTR_CONTEXT}="control"]`);
    // Native controls already own their foreground. Nested labels share it,
    // including interactive states, unless they have their own painted surface.
    if (control && backing.owner === control && !backing.reason && !mediaBacked) {
      if (element !== control) {
        setAttribute(element, ATTR_TEXT, role);
        setAttribute(element, ATTR_TONE, 'control');
        setAttribute(element, ATTR_CONFIDENCE, 'high');
      }
      setAttribute(element, ATTR_PAIR, 'control');
      continue;
    }
    setAttribute(element, ATTR_TEXT, role);
    setProperty(element, ORIGINAL_COLOR, original);
    if (backing.reason || mediaBacked) {
      setAttribute(element, ATTR_TONE, 'preserve');
      setAttribute(element, ATTR_CONFIDENCE, 'low');
      setAttribute(element, ATTR_PAIR, backing.reason || 'media');
      uncertainty[backing.reason === 'image' ? 'imageBackground' : mediaBacked ? 'media' : 'unknownSurface']++;
      continue;
    }
    const minimum = minimumContrast(parseFloat(style.fontSize), Number(style.fontWeight));
    const originalColor = parseColor(original);
    // Keep successful authored pairs on retained surfaces, including status ink.
    if (!backing.themed && originalColor && contrastRatio(originalColor, backing.color) >= minimum) {
      setAttribute(element, ATTR_TONE, 'preserve');
      setAttribute(element, ATTR_PAIR, 'retained');
      setAttribute(element, ATTR_CONFIDENCE, 'medium');
      continue;
    }
    const titleInk = activeTheme === 'browser-archeology' && element.closest(`[${ATTR_PURPOSE}="title"],[${ATTR_WINDOW_TITLE}]`);
    const preferred = titleInk ? palette.accentText : role === 'link' ? palette.link : palette.text;
    const background = role === 'code' && backing.themed ? parseColor(palette.raised) : backing.color;
    const foreground = readableColor(preferred, background, minimum);
    setAttribute(element, ATTR_TONE, foreground ? 'theme' : 'preserve');
    setAttribute(element, ATTR_CONFIDENCE, foreground ? 'high' : 'low');
    setAttribute(element, ATTR_PAIR, foreground ? (backing.themed ? 'theme' : 'adjusted') : 'color-space');
    if (foreground) setProperty(element, RESOLVED_COLOR, foreground);
    // Only give code a theme background when the underlying surface is themed.
    if (role === 'code' && !backing.themed) setAttribute(element, ATTR_TEXT, 'text');
  }
}

function markProminent() {
  if (document.querySelector(`[${ATTR_PROMINENT}]`)) return;
  if (activeTheme === 'terminal-vision' || activeTheme === 'liquid-dream') {
    const panels = activeTheme === 'liquid-dream' ? [...document.querySelectorAll(`[${ATTR_PURPOSE}="panel"]`)].filter(isVisible) : [];
    const candidates = panels.length ? panels : [...document.querySelectorAll(`[${ATTR_CONTEXT}="content"]`)].filter(isVisible);
    candidates.sort((a, b) => {
      const ar = a.getBoundingClientRect(); const br = b.getBoundingClientRect();
      return br.width * br.height - ar.width * ar.height;
    });
    if (candidates[0]) setAttribute(candidates[0], ATTR_PROMINENT, 'true');
  }
}

function scan(root = document) {
  if (!running || !document.body) return;
  const media = mediaRects();
  markBrands(root);
  markSurfaces(root);
  markControls(root, media);
  markPurposes(root);
  markShells(root);
  markUtilityPanels(root);
  markWindows(root);
  markGlyphs(root);
  markText(root, media);
  markProminent();
}

function initialize() {
  if (!running || !document.body || observer) return;
  markPage();
  scan(document);
  observer = new MutationObserver(records => {
    const roots = records.flatMap(record => [...record.addedNodes]).filter(node => node instanceof Element);
    if (!roots.length) return;
    queueMicrotask(() => roots.forEach(scan));
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

export function start(theme, corrections) {
  if (running) stop();
  running = true;
  activeTheme = theme.id;
  palette = theme.colors;
  activeCorrections = corrections;
  uncertainty = { media: 0, imageBackground: 0, unknownSurface: 0 };
  if (document.body) initialize();
  else {
    readinessListener = () => initialize();
    document.addEventListener('DOMContentLoaded', readinessListener, { once: true });
  }
}

export function stop() {
  observer?.disconnect();
  observer = undefined;
  if (readinessListener) document.removeEventListener('DOMContentLoaded', readinessListener);
  readinessListener = undefined;
  running = false;
  restoreAll();
}

export function diagnostics() {
  const count = value => document.querySelectorAll(`[${ATTR_CONTEXT}="${value}"]`).length;
  return {
    adapter: 'contextual-v5', enabled: running,
    regions: { page: count('page'), shells: count('shell'), content: count('content'), chrome: count('chrome'), controls: count('control'), overlays: count('overlay'), brands: count('brand') },
    text: { themed: document.querySelectorAll(`[${ATTR_TONE}="theme"]`).length, preserved: document.querySelectorAll(`[${ATTR_TONE}="preserve"]`).length },
    pairs: Object.fromEntries(['theme', 'control', 'retained', 'adjusted', 'image', 'media', 'effects', 'pseudo', 'color-space', 'canvas'].map(value => [value, document.querySelectorAll(`[${ATTR_PAIR}="${value}"]`).length])),
    purposes: Object.fromEntries(['reading', 'section', 'panel', 'data', 'navigation', 'title', 'section-heading', 'field', 'action'].map(value => [value, document.querySelectorAll(`[${ATTR_PURPOSE}="${value}"]`).length])),
    icons: { controls: document.querySelectorAll('[data-surface-glyph-v1]').length, headings: document.querySelectorAll('[data-surface-heading-glyph-v1]').length, windows: document.querySelectorAll(`[${ATTR_WINDOW}]`).length, titleBars: document.querySelectorAll(`[${ATTR_WINDOW_TITLE}]`).length },
    contrastModel: 'sRGB base colors; decorative theme paint excluded',
    uncertainty: { ...uncertainty }, decorationBudget: document.querySelectorAll(`[${ATTR_PROMINENT}]`).length
  };
}
