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
// Keep the original Terminal experiment stable while evaluating this role model.
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
  for (const element of collect(root, `[${ATTR_CONTEXT}="content"],section`)) {
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
    const headingPaint = activeTheme === 'liquid-dream' && ['title', 'section-heading'].includes(purpose);
    const ownsTheme = headingPaint || ['page', 'content', 'chrome', 'control'].includes(context);
    for (const pseudo of ['::before', '::after']) {
      const paint = getComputedStyle(current, pseudo);
      if (!['none', 'normal'].includes(paint.content) && paint.display !== 'none' &&
          (paint.backgroundImage !== 'none' || (parseColor(paint.backgroundColor)?.[3] || 0) > 0)) return { reason: 'pseudo' };
    }
    let color;
    if (ownsTheme) {
      color = context === 'page' ? palette.background : context === 'chrome' && activeTheme === 'browser-archeology' ? '#d4d0c8' : palette.surface;
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
    const preferred = role === 'link' ? palette.link : palette.text;
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
  if (activeTheme !== 'terminal-vision') markPurposes(root);
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
    adapter: 'contextual-v3', enabled: running,
    regions: { page: count('page'), content: count('content'), chrome: count('chrome'), controls: count('control'), overlays: count('overlay'), brands: count('brand') },
    text: { themed: document.querySelectorAll(`[${ATTR_TONE}="theme"]`).length, preserved: document.querySelectorAll(`[${ATTR_TONE}="preserve"]`).length },
    pairs: Object.fromEntries(['theme', 'control', 'retained', 'adjusted', 'image', 'media', 'effects', 'pseudo', 'color-space', 'canvas'].map(value => [value, document.querySelectorAll(`[${ATTR_PAIR}="${value}"]`).length])),
    purposes: Object.fromEntries(['reading', 'section', 'panel', 'data', 'navigation', 'title', 'section-heading', 'field', 'action'].map(value => [value, document.querySelectorAll(`[${ATTR_PURPOSE}="${value}"]`).length])),
    contrastModel: 'sRGB base colors; decorative theme paint excluded',
    uncertainty: { ...uncertainty }, decorationBudget: document.querySelectorAll(`[${ATTR_PROMINENT}]`).length
  };
}
