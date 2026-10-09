import { parseColor, compositeLayers, contrastRatio, minimumContrast, readableColor } from './contrast.js';

// Surface's unified renderer annotates understood regions, keeps uncertain
// regions unchanged, and removes every annotation/custom property on teardown.
const ATTR_CONTEXT = 'data-surface-context-v1';
const ATTR_TEXT = 'data-surface-text-v1';
const ATTR_TONE = 'data-surface-tone-v1';
const ATTR_CONFIDENCE = 'data-surface-confidence-v1';
const ATTR_ICON = 'data-surface-ui-icon-v1';
const ATTR_PURPOSE = 'data-surface-purpose-v1';
const ATTR_PAIR = 'data-surface-pair-v1';
const ATTR_WINDOW = 'data-surface-window-v1';
const ATTR_WINDOW_TITLE = 'data-surface-window-title-v1';
const ATTR_STARTING = 'data-surface-starting-v2';
const ATTR_THEME = 'data-surface-theme-v2';
const ATTR_USER_STYLES = 'data-surface-user-styles-v2';
const ATTR_SWITCHING = 'data-surface-switching-v2';
const ATTR_NAVIGATION_FADE = 'data-surface-navigation-fade-v1';
const ATTR_EFFECT_OWNER = 'data-surface-effect-owner-v1';
const ATTR_DEFERRED_READING = 'data-surface-deferred-reading-v1';
const RESOLVED_COLOR = '--surface-readable-color-v1';
const ORIGINAL_COLOR = '--surface-original-color-v1';
const ORIGINAL_BACKGROUND = '--surface-original-background-v1';

let observer;
let deferredMutationObserver;
let readinessListener;
let visualEffectListener;
let effectSettleTimer;
const pendingEffectOwners = new Map();
let scanScheduled = false;
let queuedRoots = new Set();
let queuedRemovedRoots = new Set();
let queuedAddedElements = 0;
const deferredMutationRoots = new Set();
const deferredLargeMutationRoots = new WeakSet();
let running = false;
let activeTheme = '';
let userStylesReady = false;
let scanViewportBottom = 0;
let scanViewportMembership;
let initialViewportScanMs = 0;
let parserScanCompleted = false;
let initialStageMs = {};
let palette;
let activeCorrections = { roles: {}, preserve: [] };
let touched = new Map();
let brandPaint = new WeakMap();
let refreshBrandPaint = false;
let authoredCanvasBackground = '#ffffff';
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

function restoreElement(element) {
  const state = touched.get(element);
  if (!state) return;
  for (const [name, value] of state.attrs) {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
  }
  for (const [name, original] of state.properties) {
    if (original.value) element.style.setProperty(name, original.value, original.priority);
    else element.style.removeProperty(name);
  }
  touched.delete(element);
}

function restoreSubtree(root) {
  if (!(root instanceof Element)) return;
  restoreElement(root);
  for (const element of root.querySelectorAll('*')) restoreElement(element);
}

function restoreAll() {
  for (const element of [...touched.keys()]) restoreElement(element);
  touched.clear();
}

function collect(root, selector) {
  const result = [];
  if (root instanceof Element && root.matches(selector)) result.push(root);
  result.push(...root.querySelectorAll(selector));
  if (!scanViewportBottom) return result;
  return result.filter(element => {
    if (element === document.documentElement || element === document.body) return true;
    if (scanViewportMembership?.has(element)) return scanViewportMembership.get(element);
    const rect = element.getBoundingClientRect();
    const included = rect.width > 0 && rect.height > 0 && rect.bottom >= -64 && rect.top <= scanViewportBottom &&
      rect.right >= -64 && rect.left <= innerWidth + 64;
    scanViewportMembership?.set(element, included);
    return included;
  });
}

function descendantCount(element, selector) {
  if (!scanViewportBottom) return element.querySelectorAll(selector).length;
  return collect(element, selector).filter(candidate => candidate !== element).length;
}

function scopedTextLength(element, threshold) {
  if (!scanViewportBottom) return (element.innerText || '').trim().length;
  let length = 0;
  for (const candidate of [element, ...collect(element, '*')]) {
    for (const node of candidate.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      length += node.textContent.trim().length;
      if (length >= threshold) return length;
    }
  }
  return length;
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

function isNeutralSolidSurface(style) {
  const color = parseColor(style.backgroundColor);
  return Boolean(color && color[3] === 1 && Math.min(...color.slice(0, 3)) >= 230 &&
    Math.max(...color.slice(0, 3)) - Math.min(...color.slice(0, 3)) <= 25 &&
    style.backgroundImage === 'none' && !hasUncertainPaint(style));
}

function isNeutralLinearGradient(style) {
  const image = style.backgroundImage;
  if (!image.startsWith('linear-gradient(') || image.indexOf('linear-gradient(', 1) !== -1 || hasUncertainPaint(style)) return false;
  const colors = [...image.matchAll(/rgba?\([^)]*\)/gi)].map(match => parseColor(match[0]));
  return colors.length >= 2 && colors.every(color => color &&
    Math.min(...color.slice(0, 3)) >= 230 &&
    Math.max(...color.slice(0, 3)) - Math.min(...color.slice(0, 3)) <= 25) &&
    colors.some(color => color[3] >= .98);
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
  return collect(document, 'img,picture,video,canvas,object,embed,svg[role="img"],svg[aria-label]')
    .filter(isVisible)
    .map(element => ({ element, rect: element.getBoundingClientRect() }));
}

function overlapsMedia(element, media) {
  const localFigure = element.closest('figure,picture');
  if (localFigure && (element.matches('figcaption') || ['absolute', 'fixed'].includes(getComputedStyle(element).position)) &&
      media.some(item => localFigure.contains(item.element))) return true;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const stack = document.elementsFromPoint(x, y);
  return media.some(item => {
    if (item.element === element || element.contains(item.element) || x < item.rect.left || x > item.rect.right || y < item.rect.top || y > item.rect.bottom) return false;
    let common = element.parentElement;
    while (common && !common.contains(item.element)) common = common.parentElement;
    const locallyRelated = common && common !== document.body && common !== document.documentElement;
    const mediaX = item.rect.left + item.rect.width / 2;
    const mediaY = item.rect.top + item.rect.height / 2;
    const mediaIsPainted = document.elementsFromPoint(mediaX, mediaY).some(hit => hit === item.element || item.element.contains(hit));
    return stack.some(hit => hit === item.element || item.element.contains(hit)) ||
      (locallyRelated && (mediaIsPainted || common.matches('figure,picture')));
  });
}

function selectorList(values = []) {
  return values.filter(Boolean).join(',');
}

function isProtected(element) {
  const selector = selectorList(['svg', 'math', '[contenteditable="true"]', ...activeCorrections.preserve]);
  return Boolean(selector && element.closest(selector));
}

function markBrands(root) {
  // Treat logo/wordmark names as strong evidence. A bare "brand" substring is
  // too broad: design systems commonly use it for ordinary navigation text.
  const candidates = collect(root, '[class*="logo" i],[id*="logo" i],[class*="wordmark" i],[id*="wordmark" i],[class~="brand" i],[id="brand" i],[class*="branding" i],[id*="branding" i],[class*="brand-logo" i],[id*="brand-logo" i],img[alt*="logo" i],svg[aria-label*="logo" i]');
  for (const candidate of candidates) {
    if (!isVisible(candidate)) continue;
    const interactive = candidate.closest('a,button,[role="link"]');
    const interactiveRect = interactive?.getBoundingClientRect();
    // A logo-like icon inside a substantial labelled card does not make the
    // entire card a protected brand. Keep the compact mark protected while
    // leaving the surrounding content available to normal contrast handling.
    const target = interactive && interactiveRect.width <= 400 && interactiveRect.height <= 120
      ? interactive
      : candidate;
    if (target.closest(`[${ATTR_CONTEXT}="brand"]`) && target.getAttribute(ATTR_CONTEXT) !== 'brand') continue;
    let paint = brandPaint.get(target);
    if (!paint || refreshBrandPaint) {
      const backing = backingFor(target);
      const themedBacking = backing?.element?.hasAttribute(ATTR_CONTEXT);
      paint = {
        background: backing?.color && isOpaque(backing.color) && !themedBacking
          ? backing.color
          : authoredCanvasBackground,
        color: getComputedStyle(target).color
      };
      brandPaint.set(target, paint);
    }
    setAttribute(target, ATTR_CONTEXT, 'brand');
    setAttribute(target, ATTR_CONFIDENCE, 'high');
    setProperty(target, ORIGINAL_BACKGROUND, paint.background);
    setProperty(target, ORIGINAL_COLOR, paint.color);
  }
}

function canOwnSurface(element) {
  if (!isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) return false;
  const style = getComputedStyle(element);
  const controlCount = descendantCount(element, 'button,input,select,textarea,[role="button"]:not([aria-hidden="true"])');
  // A large composite application region is not one coherent reading surface.
  // Its smaller, understood descendants can still be classified independently.
  return (style.backgroundImage === 'none' || isNeutralLinearGradient(style)) &&
    controlCount <= 6 && scopedTextLength(element, 40) >= 40;
}

function markSurface(element, context) {
  if (!canOwnSurface(element)) return false;
  const existingOwner = element.parentElement?.closest(`[${ATTR_CONTEXT}="content"],[${ATTR_CONTEXT}="chrome"]`);
  // A restrained near-white gradient is explicit authored paint, so it can
  // own a nested section even when an earlier parser pass already recognized
  // the surrounding main landmark. Transparent nested sections remain part
  // of their parent document hierarchy.
  if (existingOwner && !isNeutralLinearGradient(getComputedStyle(element))) return false;
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
  // Composite landing pages often use a semantic content region around several
  // substantial, pale, heading-led panels instead of article/aside elements.
  // Recognize those authored panel boundaries without painting arbitrary cards.
  const neutralPanels = collect(root, 'div,a[href]').filter(element => {
    if (element.hasAttribute(ATTR_CONTEXT) || !element.parentElement?.closest(`[${ATTR_CONTEXT}="content"]`) ||
        !isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const heading = element.querySelector('h1,h2,h3,h4,h5,h6,[role="heading"]');
    const controls = descendantCount(element, 'button,input,select,textarea,[role="button"]');
    return (isNeutralSolidSurface(style) || isNeutralLinearGradient(style)) && heading && rect.width >= 180 && rect.height >= 80 &&
      scopedTextLength(element, 100) >= 100 && controls <= 6;
  });
  for (const element of neutralPanels.filter(candidate => !neutralPanels.some(other => other !== candidate && other.contains(candidate)))) {
    setAttribute(element, ATTR_CONTEXT, 'content');
    setAttribute(element, ATTR_CONFIDENCE, 'medium');
    setAttribute(element, 'data-surface-evidence-v1', element.matches('a[href]') ? 'neutral-heading-card' : 'neutral-heading-panel');
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
    (getComputedStyle(element).backgroundImage === 'none' ||
      ['page', 'shell', 'content', 'chrome', 'control'].includes(element.getAttribute(ATTR_CONTEXT)));
  const assign = (element, purpose, context, evidence) => {
    if (!safe(element)) return;
    setAttribute(element, ATTR_PURPOSE, purpose);
    if (!element.hasAttribute('data-surface-evidence-v1')) setAttribute(element, 'data-surface-evidence-v1', evidence);
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
    const paragraphs = descendantCount(element, 'p');
    const controls = descendantCount(element, 'button,input,select,textarea,[role="button"]');
    if (paragraphs >= 3 && controls <= Math.max(6, paragraphs * 2) &&
        scopedTextLength(element, 300) >= 300 && !element.parentElement?.closest(reading)) {
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
    const backingColor = parseColor(backing?.color);
    const authoredColoredBacking = backingColor?.[3] === 1 &&
      Math.max(...backingColor.slice(0, 3)) - Math.min(...backingColor.slice(0, 3)) > 35 &&
      !backing.element.matches('html,body') &&
      !backing.element.hasAttribute(ATTR_CONTEXT) && !backing.element.hasAttribute(ATTR_PURPOSE);
    // A level-one heading on an authored promo/status card is not a page title.
    // Preserve that foreground/background pair instead of painting a title band.
    if (title && authoredColoredBacking) continue;
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

// Preserve a chart and its supporting labels as one authored visual unit. Large,
// labelled SVG/canvas graphics are stronger evidence than generic white cards,
// and requiring a solid owner keeps decorative media and arbitrary divs out.
function markVisualizations(root) {
  const graphics = collect(root, 'canvas,svg[role="img"],svg[aria-label],svg[aria-labelledby],[role="img"]:not(img)');
  for (const graphic of graphics) {
    if (!isVisible(graphic) || graphic.closest('a,button,nav,[role="navigation"],[role="button"],[data-surface-context-v1="brand"]')) continue;
    const rect = graphic.getBoundingClientRect();
    const labelled = graphic.matches('canvas,[role="img"],[aria-label],[aria-labelledby]') || graphic.querySelectorAll('text').length >= 2;
    if (!labelled || rect.width < 160 || rect.height < 80) continue;
    let owner = graphic.closest('figure,[role="figure"]');
    if (!owner) {
      let candidate = graphic.parentElement;
      for (let depth = 0; candidate && depth < 5; depth++, candidate = candidate.parentElement) {
        if (candidate.matches('body,html,main,article,[role="main"]') || candidate.hasAttribute(ATTR_WINDOW)) break;
        const hasLabel = candidate.matches('[aria-label],[aria-labelledby]') || Boolean(candidate.querySelector('h1,h2,h3,h4,h5,h6,figcaption'));
        const style = getComputedStyle(candidate);
        if (hasLabel && isOpaque(style.backgroundColor) && style.backgroundImage === 'none' && !hasUncertainPaint(style)) {
          owner = candidate;
          break;
        }
      }
    }
    if (!owner || !isVisible(owner) || isProtected(owner) || owner.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    const style = getComputedStyle(owner);
    const ownerRect = owner.getBoundingClientRect();
    if (!isOpaque(style.backgroundColor) || style.backgroundImage !== 'none' || hasUncertainPaint(style) ||
        ownerRect.width < 160 || ownerRect.height < 100 || descendantCount(owner, 'button,input,select,textarea,[role="button"]') > 6) continue;
    setAttribute(owner, ATTR_CONTEXT, 'visualization');
    setAttribute(owner, ATTR_PURPOSE, 'visualization');
    setAttribute(owner, ATTR_CONFIDENCE, 'high');
    setAttribute(owner, 'data-surface-evidence-v1', 'labelled-data-graphic');
  }
}

// Only neutral, solid ancestor wrappers around a substantial known content
// region are page shells. Do not extrapolate from white to arbitrary cards,
// images or colored status UI.
function markShells(root) {
  const sources = collect(root, `[${ATTR_PURPOSE}="reading"],[${ATTR_CONTEXT}="content"]`).filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width >= innerWidth * .5 && rect.height >= 240 && scopedTextLength(element, 300) >= 300;
  });
  for (const source of sources) {
    for (let element = source.parentElement; element && element !== document.body; element = element.parentElement) {
      if (element.hasAttribute(ATTR_CONTEXT) || !element.matches('div,main') || isProtected(element)) continue;
      const style = getComputedStyle(element);
      if (!isNeutralSolidSurface(style) ||
          element.getBoundingClientRect().width < innerWidth * .6) continue;
      setAttribute(element, ATTR_CONTEXT, 'shell');
      setAttribute(element, ATTR_CONFIDENCE, 'medium');
      setAttribute(element, 'data-surface-evidence-v1', source.getAttribute(ATTR_PURPOSE) === 'reading'
        ? 'neutral-document-ancestor' : 'neutral-content-ancestor');
    }
  }
}

// The first visible frame needs only the page canvas and any neutral wrapper
// spanning that canvas. Full purpose and contrast classification remains the
// authoritative pass, but it must not hold script-heavy pages behind the
// pre-paint guard. A semantic content landmark inside a large neutral ancestor
// is enough to recognize this temporary shell without a host selector.
function markInitialCanvas() {
  markPage();
  const candidates = new Set();
  const landmarkAncestors = new Set();
  const landmark = document.querySelector('main,[role="main"],article');
  for (let element = landmark?.parentElement; element && element !== document.body; element = element.parentElement) {
    candidates.add(element);
    landmarkAncestors.add(element);
  }
  const edgeAncestors = x => {
    const result = new Set();
    for (let element = document.elementFromPoint(x, innerHeight / 2); element && element !== document.body; element = element.parentElement) result.add(element);
    return result;
  };
  const left = edgeAncestors(2);
  const right = edgeAncestors(Math.max(2, innerWidth - 2));
  for (const element of left) if (right.has(element)) candidates.add(element);
  for (const element of candidates) {
    if (!element.matches('div,main') || isProtected(element)) continue;
    const rect = element.getBoundingClientRect();
    // During parsing a viewport shell may not have reached its final height
    // yet. Full-width neutral ownership plus landmark/edge evidence is enough;
    // the authoritative pass will re-evaluate it after parsing completes.
    if ((rect.width < innerWidth * .8 && !landmarkAncestors.has(element)) || !isNeutralSolidSurface(getComputedStyle(element))) continue;
    setAttribute(element, ATTR_CONTEXT, 'shell');
    setAttribute(element, ATTR_CONFIDENCE, 'medium');
    setAttribute(element, 'data-surface-evidence-v1', 'neutral-viewport-ancestor');
  }
}

function layoutOpportunity() {
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    requestAnimationFrame(finish);
    setTimeout(finish, 50);
  });
}

export async function prepareReveal() {
  if (!running || !document.body) return;
  // Let the parser populate and lay out the first viewport while the authored
  // body is still guarded. The timeout keeps background tabs from waiting on
  // a throttled animation frame.
  await layoutOpportunity();
  if (!document.documentElement.hasAttribute(ATTR_STARTING)) return;
  // Usually the parser observer has already run the unified recognizers over
  // every node that can paint in this frame. Avoid repeating that work over a
  // large document. executeScript on an already-loaded page has no parser
  // mutations to observe, so it retains the bounded viewport fallback.
  if (parserScanCompleted && initialViewportHasTheme()) markInitialCanvas();
  else finishInitialViewportScan();
}

function initialViewportHasTheme() {
  if (document.documentElement.getAttribute(ATTR_CONTEXT) !== 'page') return false;
  const inViewport = element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= innerHeight;
  };
  const landmarks = [...document.querySelectorAll('main,[role="main"],article')].filter(inViewport);
  if (landmarks.some(element => !element.hasAttribute(ATTR_CONTEXT) && !element.hasAttribute(ATTR_PURPOSE))) return false;
  const titles = [...document.querySelectorAll('h1,[role="heading"][aria-level="1"]')].filter(inViewport);
  return titles.every(element => element.hasAttribute(ATTR_PURPOSE) &&
    (element.hasAttribute(ATTR_TONE) || element.querySelector(`[${ATTR_TONE}]`)));
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

// Some sticky navigation rails use a short, pointer-transparent generated
// gradient at their bottom edge to suggest more scrollable content. Once the
// rail is themed, retaining a light-site fade produces a conspicuous white
// strip. Recognize only that narrow structural shape and map its paint through
// the active theme instead of rewriting arbitrary pseudo-elements.
function markNavigationFades(root) {
  for (const navigation of collect(root, `[${ATTR_PURPOSE}="navigation"]`)) {
    let owner = navigation.parentElement;
    for (let depth = 0; owner && owner !== document.body && depth < 4; depth++, owner = owner.parentElement) {
      for (const pseudo of ['::before', '::after']) {
        const paint = getComputedStyle(owner, pseudo);
        const height = parseFloat(paint.height);
        const width = parseFloat(paint.width);
        if (['none', 'normal'].includes(paint.content) || paint.position !== 'sticky' || paint.pointerEvents !== 'none' ||
            paint.bottom !== '0px' || !paint.backgroundImage.startsWith('linear-gradient(') ||
            !Number.isFinite(height) || height <= 0 || height > 64 || !Number.isFinite(width) || width < 80) continue;
        setAttribute(owner, ATTR_NAVIGATION_FADE, pseudo === '::before' ? 'before' : 'after');
        break;
      }
      if (owner.hasAttribute(ATTR_NAVIGATION_FADE)) break;
    }
  }
}

// Reuse actual document/panel headings as window chrome. The owner frame and
// title decoration add no DOM, actions or accessibility semantics.
function markWindows(root) {
  for (const owner of collect(root, `[${ATTR_PURPOSE}="reading"],[${ATTR_PURPOSE}="panel"],[${ATTR_PURPOSE}="navigation"]`)) {
    if (!isVisible(owner) || isProtected(owner)) continue;
    const ownerPurpose = owner.getAttribute(ATTR_PURPOSE);
    const ownerEvidence = owner.getAttribute('data-surface-evidence-v1') || '';
    if (ownerPurpose === 'navigation' && !ownerEvidence.startsWith('neutral-')) {
      const rect = owner.getBoundingClientRect();
      const neutralSelector = `[${ATTR_PURPOSE}="navigation"][data-surface-evidence-v1^="neutral-"]`;
      const neutralRelative = owner.parentElement?.closest(neutralSelector) || owner.querySelector(neutralSelector);
      if (neutralRelative || rect.width < 100 || rect.width > 400 || rect.height < 100 || owner.querySelectorAll('a[href]').length < 4) continue;
    }
    let title = owner.querySelector(`[${ATTR_PURPOSE}="title"]`);
    if (!title && owner.matches('table')) {
      title = owner.querySelector(':scope > caption,:scope > thead > tr:first-child > th:only-child,:scope > tbody > tr:first-child > th:only-child,:scope > tr:first-child > th:only-child');
    }
    if (!title) title = owner.querySelector('legend,h1,h2,h3,[role="heading"]');
    if (title) {
      const closestOwner = title.closest(ownerPurpose === 'navigation'
        ? `[${ATTR_PURPOSE}="navigation"]`
        : `[${ATTR_PURPOSE}="reading"],[${ATTR_PURPOSE}="panel"]`);
      if (closestOwner !== owner) title = null;
    }
    // Untitled, already-recognized panels still receive a thin inactive strip;
    // no label or interactive control is invented for them.
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

function captureAuthoredCanvasBackground() {
  const root = document.documentElement;
  const ready = root.hasAttribute('data-surface-ready-v2');
  const switching = root.hasAttribute(ATTR_SWITCHING) ? root.getAttribute(ATTR_SWITCHING) : null;
  // The registered preload sheet owns the root canvas until ready. Suppress
  // that one selector synchronously so this snapshot sees authored CSS; the
  // body is still guarded and no rendering opportunity occurs in this task.
  if (!ready) root.setAttribute('data-surface-ready-v2', '');
  // The switch guard is extension paint, not authored canvas evidence. Remove
  // it only for this synchronous computed-style read; no paint can occur here.
  if (switching !== null) root.removeAttribute(ATTR_SWITCHING);
  try {
    for (const element of [document.body, root]) {
      if (!(element instanceof Element)) continue;
      const color = getComputedStyle(element).backgroundColor;
      if (isOpaque(color)) {
        authoredCanvasBackground = color;
        return;
      }
    }
    authoredCanvasBackground = '#ffffff';
  } finally {
    if (switching !== null) root.setAttribute(ATTR_SWITCHING, switching);
    if (!ready) root.removeAttribute('data-surface-ready-v2');
  }
}

function markTheme() {
  if (!document.documentElement) return;
  setAttribute(document.documentElement, ATTR_THEME, activeTheme);
  if (userStylesReady) setAttribute(document.documentElement, ATTR_USER_STYLES, '');
}

export function confirmUserStyles() {
  if (!running || !document.documentElement) return;
  userStylesReady = true;
  markTheme();
}

function markControls(root, media) {
  const correctedButton = selectorList(activeCorrections.roles.button);
  const correctedOverlay = selectorList(activeCorrections.roles['overlay-control']);
  const selector = `button,summary,a[href],[role="button"],input:not([type="hidden"]),textarea,select${correctedButton ? `,${correctedButton}` : ''}${correctedOverlay ? `,${correctedOverlay}` : ''}`;
  for (const element of collect(root, selector)) {
    if (!isVisible(element) || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    // A substantial heading-led linked card is an editorial surface, not one
    // oversized button. Surface recognition runs first and owns that decision.
    if (element.getAttribute(ATTR_CONTEXT) === 'content') continue;
    if (element.matches('a[href]:not([role="button"])')) {
      const style = getComputedStyle(element);
      const bordered = ['borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'].some(property => parseFloat(style[property]) >= 1);
      const padded = parseFloat(style.paddingLeft) >= 4 && parseFloat(style.paddingRight) >= 4;
      if (!bordered || !padded || !['block', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid'].includes(style.display)) continue;
    }
    const forcedOverlay = Boolean(correctedOverlay && element.matches(correctedOverlay));
    const backing = backingFor(element);
    const authoredImage = backing?.image && !backing.element.hasAttribute(ATTR_PURPOSE);
    const style = getComputedStyle(element);
    const ownBackground = parseColor(style.backgroundColor);
    const ownsSolidPaint = ownBackground?.[3] > .9 && style.backgroundImage === 'none' && !hasUncertainPaint(style);
    if (forcedOverlay || authoredImage || (!ownsSolidPaint && overlapsMedia(element, media))) {
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
    // preload.css makes the body transparent until the first complete parsed-
    // DOM pass is ready. That extension-owned guard must not be mistaken for
    // authored opacity and force every text pair down the preservation path.
    const guardedElement = (current === document.documentElement || current === document.body) && Number(style.opacity) === 0 &&
      (!document.documentElement.hasAttribute('data-surface-ready-v2') || document.documentElement.hasAttribute(ATTR_SWITCHING));
    if (!guardedElement && hasUncertainPaint(style)) return { reason: 'effects', owner: current };
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

function textCandidates(root) {
  return collect(root, '*').filter(element =>
    element instanceof HTMLElement && isVisible(element) && directText(element) &&
    !element.matches('script,style,noscript,option') && !isProtected(element) &&
    !element.closest(`[${ATTR_CONTEXT}="brand"]`));
}

function snapshotForegrounds(root) {
  const candidates = textCandidates(root);
  const originals = new Map(candidates.map(element => {
    const style = getComputedStyle(element);
    return [element, {
      color: style.color,
      fill: style.webkitTextFillColor,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight
    }];
  }));
  return { candidates, originals };
}

function scheduleEffectSettlement(owner) {
  if (!pendingEffectOwners.has(owner)) pendingEffectOwners.set(owner, 0);
  if (effectSettleTimer) return;
  effectSettleTimer = setTimeout(function checkSettledEffects() {
    effectSettleTimer = undefined;
    if (!running) return pendingEffectOwners.clear();
    for (const [element, attempts] of pendingEffectOwners) {
      if (!element.isConnected || attempts >= 5) {
        pendingEffectOwners.delete(element);
      } else if (!hasUncertainPaint(getComputedStyle(element))) {
        pendingEffectOwners.delete(element);
        scheduleScans([{ type: 'visual-effect', target: element }]);
      } else {
        pendingEffectOwners.set(element, attempts + 1);
      }
    }
    if (pendingEffectOwners.size) effectSettleTimer = setTimeout(checkSettledEffects, 250);
  }, 250);
}

function markText(root, media, snapshot) {
  const { candidates, originals } = snapshot;
  for (const element of candidates) {
    // Brand ownership is established after the authored foreground snapshot.
    // Recheck it here without repeating the full candidate query and layout
    // visibility pass.
    if (!element.isConnected || isProtected(element) || element.closest(`[${ATTR_CONTEXT}="brand"]`)) continue;
    const role = textRole(element);
    const original = originals.get(element) || (() => {
      const style = getComputedStyle(element);
      return { color: style.color, fill: style.webkitTextFillColor, fontSize: style.fontSize, fontWeight: style.fontWeight };
    })();
    // Compare the authored foreground pair from the shared snapshot. An
    // earlier candidate can theme an ancestor and change this element's live
    // inherited color before its turn, creating a mismatch that the page did
    // not author.
    const backing = original.fill && original.fill !== original.color
      ? { reason: 'effects' } : backgroundForText(element);
    // An already-uncertain backing wins the preservation decision. Avoid the
    // more expensive hit-testing path when it cannot change the result.
    const mediaBacked = !backing.reason && overlapsMedia(element, media);
    const control = element.closest(`[${ATTR_CONTEXT}="control"]`);
    // Native controls already own their foreground. Nested labels share it,
    // including interactive states, unless they have their own painted surface.
    if (control) {
      if (element !== control) {
        setAttribute(element, ATTR_TEXT, role);
        setAttribute(element, ATTR_TONE, 'control');
        setAttribute(element, ATTR_CONFIDENCE, 'high');
      }
      setAttribute(element, ATTR_PAIR, 'control');
      continue;
    }
    setAttribute(element, ATTR_TEXT, role);
    setProperty(element, ORIGINAL_COLOR, original.color);
    if (backing.reason || mediaBacked) {
      if (backing.reason === 'effects' && backing.owner) {
        setAttribute(backing.owner, ATTR_EFFECT_OWNER, '');
        scheduleEffectSettlement(backing.owner);
      }
      setAttribute(element, ATTR_TONE, 'preserve');
      setAttribute(element, ATTR_CONFIDENCE, 'low');
      setAttribute(element, ATTR_PAIR, backing.reason || 'media');
      uncertainty[backing.reason === 'image' ? 'imageBackground' : mediaBacked ? 'media' : 'unknownSurface']++;
      continue;
    }
    const minimum = minimumContrast(parseFloat(original.fontSize), Number(original.fontWeight));
    const originalColor = parseColor(original.color);
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

function scan(root = document, media = mediaRects()) {
  if (!running || !document.body) return;
  // Capture authored foreground pairs before surface and purpose annotations
  // activate their CSS. A later parent annotation must not become a child's
  // supposed original foreground within this same scan.
  const foregroundSnapshot = snapshotForegrounds(root);
  const run = (name, operation) => {
    if (!scanViewportBottom) return operation();
    const started = performance.now();
    operation();
    initialStageMs[name] = Math.round(((initialStageMs[name] || 0) + performance.now() - started) * 100) / 100;
  };
  if (root === document || root === document.documentElement || root === document.body) {
    // A parser mutation rooted at <html> can restore the entire tracked
    // subtree before reclassification. Reassert theme activation in that same
    // task so the resident stylesheet never becomes inert for a paint.
    markTheme();
    run('page', markPage);
  }
  run('brands', () => markBrands(root));
  run('surfaces', () => markSurfaces(root));
  run('controls', () => markControls(root, media));
  run('purposes', () => markPurposes(root));
  run('visualizations', () => markVisualizations(root));
  run('shells', () => markShells(root));
  run('utilityPanels', () => markUtilityPanels(root));
  run('navigationFades', () => markNavigationFades(root));
  run('windows', () => markWindows(root));
  run('glyphs', () => markGlyphs(root));
  run('text', () => markText(root, media, foregroundSnapshot));
}

const LARGE_ADDITION_LIMIT = 80;

function nearViewport(rect) {
  const margin = Math.min(innerHeight, 960);
  return rect.width > 0 && rect.height > 0 && rect.bottom >= -margin && rect.top <= innerHeight + margin;
}

function deferMutationRoot(root, large = false) {
  if (!('IntersectionObserver' in window) || !root.isConnected) return false;
  if (!deferredMutationObserver) {
    deferredMutationObserver = new IntersectionObserver(entries => {
      const records = [];
      for (const entry of entries) {
        if (!entry.isIntersecting || !entry.target.isConnected) continue;
        deferredMutationObserver.unobserve(entry.target);
        deferredMutationRoots.delete(entry.target);
        const type = deferredLargeMutationRoots.has(entry.target) ? 'deferred-large-mutation' : 'deferred-mutation';
        deferredLargeMutationRoots.delete(entry.target);
        records.push({ type, target: entry.target });
      }
      if (records.length) scheduleScans(records);
    }, { rootMargin: '100% 0px' });
  }
  deferredMutationObserver.observe(root);
  deferredMutationRoots.add(root);
  if (large) deferredLargeMutationRoots.add(root);
  return true;
}

function hasTextContent(element, threshold) {
  let length = 0;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    length += node.textContent.trim().length;
    if (length >= threshold) return true;
  }
  return false;
}

function classifyLargeSemanticRoot(root) {
  if (!isVisible(root) || isProtected(root) || root.closest(`[${ATTR_CONTEXT}="brand"]`)) return;
  if (root.matches('header,footer,nav,[role="banner"],[role="navigation"],[role="contentinfo"]')) {
    if (getComputedStyle(root).backgroundImage === 'none') {
      setAttribute(root, ATTR_CONTEXT, 'chrome');
      setAttribute(root, ATTR_CONFIDENCE, 'high');
      setAttribute(root, ATTR_PURPOSE, 'navigation');
      setAttribute(root, 'data-surface-evidence-v1', 'semantic-navigation');
    }
    return;
  }
  if (!root.matches('main,[role="main"],article,aside,section,[role="region"]')) return;
  const style = getComputedStyle(root);
  if (style.backgroundImage !== 'none') return;
  const controls = root.querySelectorAll('button,input,select,textarea,[role="button"]');
  const paragraphs = root.querySelectorAll('p').length;
  if (root.matches('main,[role="main"],article') && paragraphs >= 3 &&
      controls.length <= Math.max(6, paragraphs * 2) && hasTextContent(root, 300)) {
    setAttribute(root, ATTR_CONTEXT, 'content');
    setAttribute(root, ATTR_CONFIDENCE, 'high');
    setAttribute(root, ATTR_PURPOSE, 'reading');
    setAttribute(root, 'data-surface-evidence-v1', 'prose-landmark');
  } else {
    if (controls.length > 6 || !hasTextContent(root, 40)) return;
    setAttribute(root, ATTR_CONTEXT, 'content');
    setAttribute(root, ATTR_CONFIDENCE, 'high');
    setAttribute(root, ATTR_PURPOSE, root.parentElement?.closest(`[${ATTR_PURPOSE}="reading"]`) ? 'section' : 'panel');
    setAttribute(root, 'data-surface-evidence-v1', 'content-hierarchy');
  }
}

function scanLargeAddition(root, media) {
  const largeSubtree = root.querySelectorAll('*').length >= LARGE_ADDITION_LIMIT;
  const rect = root.getBoundingClientRect();
  if (!nearViewport(rect)) {
    if (!deferMutationRoot(root, largeSubtree)) scan(root, media);
    return;
  }
  if (!largeSubtree) {
    scan(root, media);
    return;
  }
  classifyLargeSemanticRoot(root);
  // Full foreground and descendant classification stays viewport-bounded, but
  // a recognized reading route must not expose alternating authored surface
  // bands below the fold. One owner marker supplies temporary paint continuity
  // without synchronously styling every deferred child.
  if (root.getAttribute(ATTR_PURPOSE) === 'reading') setAttribute(root, ATTR_DEFERRED_READING, '');
  for (const child of root.children) scanLargeAddition(child, media);
}

function scheduleScans(records) {
  for (const record of records) {
    if (record.type === 'childList') {
      for (const node of record.addedNodes) if (node instanceof Element) {
        queuedRoots.add(node);
        queuedAddedElements++;
      }
      for (const node of record.removedNodes) if (node instanceof Element) queuedRemovedRoots.add(node);
    } else {
      const target = record.target.nodeType === Node.TEXT_NODE ? record.target.parentElement : record.target;
      if (target instanceof Element) queuedRoots.add(target);
      if (record.type === 'deferred-large-mutation') queuedAddedElements += LARGE_ADDITION_LIMIT;
    }
  }
  if ((!queuedRoots.size && !queuedRemovedRoots.size) || scanScheduled) return;
  scanScheduled = true;
  queueMicrotask(() => {
    scanScheduled = false;
    if (!running) {
      queuedRoots.clear();
      queuedRemovedRoots.clear();
      queuedAddedElements = 0;
      return;
    }
    for (const root of queuedRemovedRoots) if (!root.isConnected) {
      for (const deferred of deferredMutationRoots) if (deferred === root || root.contains(deferred)) {
        deferredMutationObserver?.unobserve(deferred);
        deferredMutationRoots.delete(deferred);
        deferredLargeMutationRoots.delete(deferred);
      }
      restoreSubtree(root);
    }
    queuedRemovedRoots.clear();
    const roots = [...queuedRoots].filter(root => root.isConnected).map(root =>
      // A previously themed text ancestor changes the inherited foreground
      // seen by a child. Restore from that nearest owner so an incremental
      // scan compares the child with authored color/fill, not with our own
      // surviving ancestor treatment. This stays bounded to the affected text
      // group rather than turning every mutation into a document rescan.
      root.parentElement?.closest(`[${ATTR_TONE}],[${ATTR_CONTEXT}="control"]`) || root);
    queuedRoots.clear();
    const addedElements = queuedAddedElements;
    queuedAddedElements = 0;
    const outermost = roots.filter(root => !roots.some(other => other !== root && other.contains(root)));
    if (!outermost.length) return;
    const largeAddition = addedElements >= LARGE_ADDITION_LIMIT ||
      (addedElements > 0 && outermost.some(root => root.querySelectorAll('*').length >= LARGE_ADDITION_LIMIT));
    const media = mediaRects();
    for (const root of outermost) {
      // Recompute the affected subtree from authored state. This covers common
      // SPA class/state/text updates without repeatedly rescanning the document.
      if (!largeAddition || touched.has(root)) restoreSubtree(root);
      if (largeAddition) scanLargeAddition(root, media);
      else scan(root, media);
    }
    if (document.documentElement.hasAttribute(ATTR_STARTING)) parserScanCompleted = true;
    // Parser-driven growth can turn an initially short neutral wrapper into the
    // viewport canvas. Refresh this bounded evidence in the same pre-paint
    // mutation batch while startup treatment is active.
    if (document.documentElement.hasAttribute(ATTR_STARTING)) markInitialCanvas();
  });
}

function observe() {
  if (!running || !document.body || observer) return;
  observer = new MutationObserver(scheduleScans);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'role', 'aria-label', 'aria-labelledby', 'aria-expanded', 'aria-selected', 'aria-pressed', 'aria-current', 'aria-invalid', 'data-level']
  });
  visualEffectListener = event => {
    const target = event.target;
    if (!(target instanceof Element) || !target.hasAttribute(ATTR_EFFECT_OWNER) || hasUncertainPaint(getComputedStyle(target))) return;
    if (event.type === 'transitionend' && !['opacity', 'filter', 'backdrop-filter', '-webkit-backdrop-filter', 'mask-image', '-webkit-mask-image'].includes(event.propertyName)) return;
    scheduleScans([{ type: 'visual-effect', target }]);
    pendingEffectOwners.delete(target);
  };
  for (const type of ['transitionend', 'transitioncancel', 'animationend', 'animationcancel']) {
    document.addEventListener(type, visualEffectListener, true);
  }
}

function finishInitialScan() {
  if (!running || !document.body) return;
  // Re-evaluate the complete document from authored state. This happens in one
  // task, so the temporary canvas treatment is replaced without an in-between
  // authored paint.
  restoreAll();
  markTheme();
  uncertainty = { media: 0, imageBackground: 0, unknownSurface: 0 };
  refreshBrandPaint = true;
  try {
    scan(document);
  } finally {
    refreshBrandPaint = false;
  }
  observe();
}

function finishInitialViewportScan() {
  if (!running || !document.body) return;
  const started = performance.now();
  restoreAll();
  markTheme();
  // Use the authoritative recognizers on only the content that can contribute
  // to the first frame. This bounds startup cost on long documents without a
  // separate renderer or a broad temporary recoloring rule.
  scanViewportBottom = innerHeight + Math.min(240, innerHeight * .25);
  scanViewportMembership = new WeakMap();
  initialStageMs = {};
  refreshBrandPaint = true;
  try {
    scan(document);
  } finally {
    refreshBrandPaint = false;
    scanViewportBottom = 0;
    scanViewportMembership = undefined;
  }
  // Sparse documents may not meet the full shell's content thresholds, while
  // their shared neutral viewport wrapper is still strong canvas evidence.
  markInitialCanvas();
  // Retain exact theme base paint while the parser continues. The final full
  // pass removes this startup marker in the same task that replaces it with
  // complete authoritative annotations.
  setAttribute(document.documentElement, ATTR_STARTING, '');
  initialViewportScanMs = Math.round((performance.now() - started) * 100) / 100;
  observe();
}

function initialize() {
  if (!running || !document.body || observer || readinessListener) return;
  setAttribute(document.documentElement, ATTR_STARTING, '');
  markInitialCanvas();
  // Start the same mutation pipeline while the parser is building the page.
  // Parser additions are classified in microtasks before a rendering
  // opportunity instead of appearing under a temporary generic treatment.
  observe();
  let resolveCompletion;
  let rejectCompletion;
  const completion = new Promise((resolve, reject) => {
    resolveCompletion = resolve;
    rejectCompletion = reject;
  });
  const finishAfterPaint = () => requestAnimationFrame(() => setTimeout(() => {
    try {
      finishInitialScan();
      resolveCompletion();
    } catch (error) {
      rejectCompletion(error);
    }
  }, 0));
  if (document.readyState === 'loading') {
    readinessListener = () => {
      readinessListener = undefined;
      finishAfterPaint();
    };
    document.addEventListener('DOMContentLoaded', readinessListener, { once: true });
  } else {
    finishAfterPaint();
  }
  return completion;
}

export async function start(theme, corrections) {
  if (running) stop();
  running = true;
  activeTheme = theme.id;
  userStylesReady = false;
  palette = theme.colors;
  activeCorrections = corrections;
  uncertainty = { media: 0, imageBackground: 0, unknownSurface: 0 };
  initialViewportScanMs = 0;
  parserScanCompleted = false;
  initialStageMs = {};
  brandPaint = new WeakMap();
  refreshBrandPaint = false;
  if (!document.body) {
    await new Promise(resolve => {
      const bodyObserver = new MutationObserver(() => {
        if (!document.body) return;
        bodyObserver.disconnect();
        resolve();
      });
      bodyObserver.observe(document, { childList: true, subtree: true });
    });
  }
  // Capture the author's base canvas before activating the selected treatment.
  // Dynamic transparent brands can then retain a stable backing even when
  // their nearest ancestor is already owned by Surface during a later rescan.
  captureAuthoredCanvasBackground();
  markTheme();
  return { completion: initialize() };
}

export function stop() {
  observer?.disconnect();
  observer = undefined;
  deferredMutationObserver?.disconnect();
  deferredMutationObserver = undefined;
  deferredMutationRoots.clear();
  if (visualEffectListener) for (const type of ['transitionend', 'transitioncancel', 'animationend', 'animationcancel']) {
    document.removeEventListener(type, visualEffectListener, true);
  }
  visualEffectListener = undefined;
  if (effectSettleTimer) clearTimeout(effectSettleTimer);
  effectSettleTimer = undefined;
  pendingEffectOwners.clear();
  brandPaint = new WeakMap();
  refreshBrandPaint = false;
  queuedRoots.clear();
  queuedRemovedRoots.clear();
  queuedAddedElements = 0;
  scanScheduled = false;
  if (readinessListener) document.removeEventListener('DOMContentLoaded', readinessListener);
  readinessListener = undefined;
  running = false;
  restoreAll();
  userStylesReady = false;
}

export function diagnostics() {
  const count = value => document.querySelectorAll(`[${ATTR_CONTEXT}="${value}"]`).length;
  return {
    adapter: 'unified-v1', enabled: running,
    styleHandoff: {
      residentTheme: document.documentElement?.getAttribute(ATTR_THEME) || null,
      userStyles: document.documentElement?.hasAttribute(ATTR_USER_STYLES) || false
    },
    trackedElements: touched.size,
    regions: { page: count('page'), shells: count('shell'), content: count('content'), visualizations: count('visualization'), chrome: count('chrome'), controls: count('control'), overlays: count('overlay'), brands: count('brand') },
    text: { themed: document.querySelectorAll(`[${ATTR_TONE}="theme"]`).length, preserved: document.querySelectorAll(`[${ATTR_TONE}="preserve"]`).length },
    pairs: Object.fromEntries(['theme', 'control', 'retained', 'adjusted', 'image', 'media', 'effects', 'pseudo', 'color-space', 'canvas'].map(value => [value, document.querySelectorAll(`[${ATTR_PAIR}="${value}"]`).length])),
    purposes: Object.fromEntries(['reading', 'section', 'panel', 'data', 'visualization', 'navigation', 'title', 'section-heading', 'field', 'action'].map(value => [value, document.querySelectorAll(`[${ATTR_PURPOSE}="${value}"]`).length])),
    icons: { controls: document.querySelectorAll('[data-surface-glyph-v1]').length, headings: document.querySelectorAll('[data-surface-heading-glyph-v1]').length, windows: document.querySelectorAll(`[${ATTR_WINDOW}]`).length, titleBars: document.querySelectorAll(`[${ATTR_WINDOW_TITLE}]`).length, navigationFades: document.querySelectorAll(`[${ATTR_NAVIGATION_FADE}]`).length },
    contrastModel: 'sRGB base colors; decorative theme paint excluded',
    initialViewportScanMs,
    initialStageMs: { ...initialStageMs },
    uncertainty: { ...uncertainty }
  };
}
