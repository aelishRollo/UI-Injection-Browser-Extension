import { buildIconStyles, iconImage, windowControlsImage } from './icons.js';

const LIQUID_WASH = 'linear-gradient(90deg,rgba(255,198,226,.58) 0%,rgba(255,229,163,.58) 24%,rgba(255,242,166,.54) 40%,rgba(163,236,218,.56) 60%,rgba(184,217,255,.58) 80%,rgba(223,197,255,.62) 100%)';
const LIQUID_SURFACE = 'radial-gradient(circle at 4% 8%,rgba(255,198,226,.32),transparent 30%),radial-gradient(circle at 96% 92%,rgba(163,236,218,.28),transparent 32%),linear-gradient(135deg,#fff9f1,#fffdf8 48%,#f6f2ff)';

// Shared motifs keep all three renderers visually consistent without changing site layout.
function buildThemeMotifs(theme, rule, { page, heading, surface, control, link, chrome, animated }) {
  if (theme.id === 'browser-archeology') return [
    rule(page, { 'background-image': 'repeating-conic-gradient(rgba(255,255,255,.035) 0 25%,rgba(0,0,0,.025) 0 50%)', 'background-size': '4px 4px' }),
    rule(heading, { color: '#000080', 'letter-spacing': 'normal', 'text-shadow': 'none' }),
    rule(surface, { 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.35)', 'background-image': 'none' }),
    rule(chrome, { 'background-color': '#c0c0c0', 'background-image': 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 3px)', 'box-shadow': 'inset 0 1px #fff,inset 0 -2px #808080', 'font-family': 'Arial, Helvetica, sans-serif' }),
    rule(control, { 'font-family': 'Arial, Helvetica, sans-serif', 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080' }),
    rule(`${control}:active`, { 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040,inset -1px -1px #dfdfdf' }),
    rule(link, { 'text-decoration-line': 'underline', 'text-underline-offset': '1px' }),
    rule(`${link}:hover`, { color: '#ffffff', 'background-color': '#000080', 'text-decoration-color': '#ffffff', 'box-shadow': '0 0 0 1px #000080' }),
    rule('::selection', { color: '#ffffff', 'background-color': '#000080' })
  ];
  if (theme.id === 'liquid-dream') return [
    rule(page, { 'background-image': 'radial-gradient(circle at 8% 15%,rgba(255,228,108,.24),transparent 28%),radial-gradient(circle at 94% 7%,rgba(71,230,209,.18),transparent 26%),radial-gradient(circle at 72% 88%,rgba(223,197,255,.24),transparent 30%)', 'background-attachment': 'fixed' }),
    rule(heading, { color: '#4b235d', 'letter-spacing': '-0.045em', 'text-shadow': '0 2px 0 rgba(255,255,255,.58)' }),
    rule(surface, { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', 'border-color': '#b9a5c2', 'box-shadow': '0 16px 42px rgba(78,64,104,.13)' }),
    rule(`${surface}:hover`, { 'border-color': '#8f6da0', 'box-shadow': '0 20px 48px rgba(78,64,104,.19)' }),
    rule(control, { 'font-family': 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', 'border-radius': '999px', 'box-shadow': 'inset 0 1px 0 rgba(255,255,255,.8),0 12px 26px rgba(78,64,104,.12)' }),
    rule(`${control}:hover`, { 'background-image': LIQUID_WASH, 'border-color': '#7d5e8e' }),
    rule(`${link}:hover`, { color: '#8b245e', 'text-decoration-thickness': '2px', 'text-shadow': '0 2px 12px rgba(255,106,183,.28)' }),
    rule('::selection', { color: '#201928', 'background-color': '#a3ecda' }),
    rule(animated, { animation: 'surface-liquid-flow-v1 18s ease-in-out infinite alternate' }),
    '@keyframes surface-liquid-flow-v1{from{background-position:0% 0%,100% 100%,0 0}to{background-position:18% 12%,82% 86%,0 0}}'
  ];
  return [];
}

// Assign decoration by visual purpose instead of repeating a card on every region.
function buildPurposeMotifs(theme, rule, { reading, section, panel, data, title, sectionHeading, navigation, field }) {
  if (theme.id === 'terminal-vision') return [
    rule(reading, { 'background-color': theme.colors.surface, color: theme.colors.text }),
    rule(section, { 'background-color': 'transparent', border: '0', 'box-shadow': 'none', 'background-image': 'none' }),
    rule(data, { 'background-color': theme.colors.surface, color: theme.colors.text })
  ];
  const reset = { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0' };
  if (theme.id === 'browser-archeology') return [
    rule(reading, { ...reset, 'background-color': '#ffffff', border: '3px solid #c0c0c0', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.28)' }),
    rule(section, { ...reset, 'background-color': 'transparent', border: '0' }),
    rule(panel, { 'background-color': '#ffffff', border: '3px solid #c0c0c0', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,2px 2px 0 rgba(0,0,0,.25)', 'background-image': 'none' }),
    rule(data, { ...reset, 'background-color': '#ffffff', border: '1px solid #808080' }),
    rule(title, { color: theme.colors.accentText, 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': 'clamp(20px,2.4vw,32px)', 'line-height': '1.15', 'min-height': '22px', 'padding-block': '3px', 'padding-inline': '26px 62px', 'border-bottom': '0', 'text-shadow': 'none', 'background-color': '#000080', 'background-image': `${iconImage(theme.id, 'document')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '4px center,calc(100% - 3px) center,0 0', 'background-size': '18px 18px,54px 18px,100% 100%', 'background-repeat': 'no-repeat' }),
    rule(`${title} :where(span,strong,em,small)`, { color: theme.colors.accentText }),
    rule(sectionHeading, { 'font-family': 'Arial,Helvetica,sans-serif', 'border-bottom': '1px solid #808080', 'text-shadow': 'none' }),
    rule(navigation, { 'background-color': '#d4d0c8', 'box-shadow': 'inset 0 1px #fff,inset 0 -1px #808080', 'font-family': 'Arial,Helvetica,sans-serif' }),
    rule(field, { 'background-color': '#ffffff', 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040', 'border-radius': '0' })
  ];
  return [
    rule(reading, { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', border: '1px solid #b5a0bd', 'border-radius': '18px', 'box-shadow': '0 12px 32px rgba(78,64,104,.12)' }),
    rule(section, { ...reset, 'background-color': 'transparent', border: '0' }),
    rule(panel, { 'background-color': '#fff9f1', 'background-image': 'repeating-radial-gradient(ellipse at 96% 5%,rgba(139,36,94,.08) 0 2px,transparent 3px 18px),radial-gradient(circle at 8% 18%,rgba(255,198,226,.45),transparent 38%),radial-gradient(circle at 92% 84%,rgba(163,236,218,.4),transparent 40%),linear-gradient(#fff9f1,#fffdf8)', 'background-size': '180% 180%,100% 100%,100% 100%,100% 100%', border: '1px solid #a98bb5', 'box-shadow': '0 8px 24px rgba(78,64,104,.16)', 'border-radius': '16px' }),
    rule(data, { ...reset, 'background-color': '#fff9f1', border: '1px solid #9b859e' }),
    rule(`${title},${sectionHeading}`, { color: '#4b235d', 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'border-bottom': '2px solid #8f6da0', 'border-radius': '8px', 'letter-spacing': '-0.025em' }),
    rule(navigation, { 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'box-shadow': 'inset 0 -1px rgba(110,83,137,.36)' }),
    rule(field, { 'background-color': '#fff9f1', 'background-image': 'none', 'box-shadow': 'inset 0 1px 3px rgba(78,64,104,.18)' })
  ];
}

// USER-origin CSS is injected by the service worker, so the adapter cannot transform
// our output. A/B do not annotate the DOM; C uses temporary namespaced attributes.
function buildContextualStyles(theme, corrections) {
  const c = theme.colors;
  const rule = (selector, declarations) => `${selector}{${Object.entries(declarations).map(([property, value]) => `${property}:${value} !important;`).join('')}}`;
  const context = value => `[data-surface-context-v1="${value}"]`;
  const text = value => `[data-surface-text-v1="${value}"]`;
  const tone = value => `[data-surface-tone-v1="${value}"]`;
  const highOrMedium = ':where([data-surface-confidence-v1="high"],[data-surface-confidence-v1="medium"])';
  const selected = `${context('control')}:where([aria-selected="true"],[aria-pressed="true"],[aria-current]:not([aria-current="false"]))`;
  const errorSelectors = ['[aria-invalid="true"]', ...(corrections.roles.error || [])].join(',');
  const successSelectors = corrections.roles.success || [];
  const css = [];

  css.push(rule(':root', { 'color-scheme': theme.scheme, 'accent-color': c.accent }));
  css.push(rule(`${context('page')}`, { 'background-color': c.background }));
  css.push(rule(`${context('content')}`, { 'background-color': c.surface, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius }));
  css.push(rule(`${context('chrome')}`, { 'background-color': c.surface, 'border-color': c.line }));
  css.push(rule(`${context('control')}`, { 'background-color': c.control || c.surface, color: c.text, '--surface-control-ink-v1': c.text, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius, 'font-family': theme.font }));
  css.push(rule(`${context('control')}:hover`, { 'background-color': c.raised, color: c.text, '--surface-control-ink-v1': c.text, 'border-color': c.accent }));
  css.push(rule(`${text('heading')}${highOrMedium}`, { 'font-family': theme.headingFont, 'font-weight': theme.weight, 'letter-spacing': '-0.035em' }));
  css.push(rule(`:where(${text('text')},${text('link')},${text('code')})${highOrMedium}`, { 'font-family': theme.font }));
  css.push(rule(`${tone('theme')}:where(${text('heading')},${text('text')})`, { color: `var(--surface-readable-color-v1,${c.text})` }));
  css.push(rule(`${tone('theme')}${text('link')}`, { color: `var(--surface-readable-color-v1,${c.link})`, 'text-decoration-color': 'currentColor', 'text-underline-offset': '0.18em' }));
  css.push(rule(`${tone('theme')}${text('code')}`, { color: `var(--surface-readable-color-v1,${c.text})`, 'background-color': c.raised }));
  css.push(rule(`${context('control')}::placeholder`, { color: 'currentColor', opacity: '1' }));
  css.push(rule(`${tone('control')}`, { color: 'var(--surface-control-ink-v1)' }));
  css.push(rule(`${tone('preserve')}`, { color: 'var(--surface-original-color-v1)' }));
  css.push(rule(`${context('brand')}`, { color: 'var(--surface-original-color-v1)', 'background-color': 'var(--surface-original-background-v1)', isolation: 'isolate' }));
  css.push(rule(':focus-visible', { outline: `3px solid ${c.accent}`, 'outline-offset': '3px' }));
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, 'box-shadow': `inset 0 -3px 0 ${c.accentText}`, 'background-image': 'none' }));
  css.push(rule(`${context('control')}:where(:disabled,[aria-disabled="true"])`, { 'border-style': 'dashed', opacity: '0.65' }));
  css.push(rule(`:where(${errorSelectors})[data-surface-context-v1],:where(${errorSelectors})[data-surface-text-v1]`, { 'border-color': c.error, 'outline-color': c.error, 'border-style': 'double', 'border-width': '3px', 'text-decoration-line': 'underline', 'text-decoration-style': 'wavy', 'text-decoration-color': c.error }));
  if (successSelectors.length) css.push(rule(`:where(${successSelectors.join(',')})[data-surface-context-v1],:where(${successSelectors.join(',')})[data-surface-text-v1]`, { 'border-bottom': `3px solid ${c.success}`, 'text-decoration-line': 'underline', 'text-decoration-style': 'solid', 'text-decoration-color': c.success }));

  if (theme.id === 'terminal-vision') {
    css.push(rule(`${context('page')}`, { 'background-image': 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(157,255,176,.035) 3px 4px)' }));
    css.push(rule(`${text('heading')}${highOrMedium}`, { 'text-shadow': '0 0 12px rgba(157,255,176,.5)' }));
    css.push(rule(`${context('content')}`, { 'background-image': 'repeating-linear-gradient(90deg,transparent 0 12px,rgba(157,255,176,.055) 12px 13px),repeating-linear-gradient(0deg,transparent 0 12px,rgba(157,255,176,.04) 12px 13px)', 'box-shadow': 'inset 0 0 26px rgba(0,0,0,.28),0 0 18px rgba(157,255,176,.1)' }));
    css.push(rule(`${context('content')}[data-surface-prominent-v1]`, { animation: 'surface-context-terminal-drift-v1 12s linear infinite' }));
    css.push(rule(`${context('control')}:hover,${tone('theme')}${text('link')}:hover`, { 'text-shadow': '0 0 9px rgba(215,255,78,.75)', 'box-shadow': '0 0 12px rgba(215,255,78,.18)' }));
    css.push('@keyframes surface-context-terminal-drift-v1{to{background-position:90px 180px}}');
  }
  css.push(...buildThemeMotifs(theme, rule, {
    page: context('page'), heading: `${text('heading')}${highOrMedium}`, surface: context('content'),
    control: context('control'), link: `${tone('theme')}${text('link')}`, chrome: context('chrome'),
    animated: `${context('content')}[data-surface-prominent-v1]`
  }));
  const purpose = value => `[data-surface-purpose-v1="${value}"]`;
  css.push(...buildPurposeMotifs(theme, rule, {
    reading: purpose('reading'), section: purpose('section'), panel: purpose('panel'), data: purpose('data'),
    title: purpose('title'), sectionHeading: purpose('section-heading'), navigation: purpose('navigation'), field: purpose('field')
  }));
  css.push(...buildIconStyles(theme, rule));
  css.push(rule(context('shell'), { 'background-color': c.background }));
  if (theme.id === 'browser-archeology') {
    const windowOwner = '[data-surface-window-v1]';
    const windowTitle = '[data-surface-window-title-v1]';
    css.push(rule(windowOwner, { 'border-width': '3px', 'border-style': 'solid', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.28)' }));
    css.push(rule(windowTitle, { 'min-height': '20px', 'margin-block': '0', 'padding-inline': '24px 60px', color: c.accentText, 'font-family': 'Arial,Helvetica,sans-serif', 'font-weight': '700', 'text-shadow': 'none', 'background-color': c.accent, 'background-image': `${iconImage(theme.id, 'panel')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '3px center,calc(100% - 2px) center,0 0', 'background-size': '17px 17px,54px 18px,100% 100%', 'background-repeat': 'no-repeat', 'border-color': '#000080' }));
    css.push(rule(`${windowTitle}[data-surface-window-title-v1="reading"]`, { 'background-image': `${iconImage(theme.id, 'document')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)` }));
    css.push(rule(`${windowTitle},${windowTitle} *`, { color: c.accentText }));
    css.push(rule(purpose('title'), { color: c.accentText, 'box-shadow': 'inset 1px 1px rgba(255,255,255,.55),inset -1px -1px rgba(0,0,0,.4)' }));
    css.push(`@media (max-width:520px){${windowTitle}{padding-inline-end:8px !important;background-image:${iconImage(theme.id, 'panel')},linear-gradient(90deg,#000080,#1084d0) !important;background-position:3px center,0 0 !important;background-size:17px 17px,100% 100% !important;}${windowTitle}[data-surface-window-title-v1="reading"]{background-image:${iconImage(theme.id, 'document')},linear-gradient(90deg,#000080,#1084d0) !important;}}`);
  }
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, '--surface-control-ink-v1': c.accentText, 'background-image': 'none' }));
  css.push(`@media (prefers-reduced-motion:reduce){${context('content')}[data-surface-prominent-v1],${context('control')}[data-surface-prominent-v1]{animation:none !important;}}`);
  return `/* Surface v1 | ${theme.id} | contextual */\n${css.join('\n')}`;
}

export function buildStyles(theme, { renderer = 'simple', corrections = { roles: {}, preserve: [] } } = {}) {
  if (renderer === 'contextual') return buildContextualStyles(theme, corrections);
  const c = theme.colors;
  const protectedSelectors = ['svg', 'math', '[contenteditable="true"]', '[data-surface-picker-v1]', ...corrections.preserve];
  const exclusion = protectedSelectors.flatMap(s => [s, `${s} *`]).join(',');
  const select = (selectors, role) => {
    const list = [...selectors, ...(corrections.roles[role] || [])];
    return `:where(${list.join(',')}):not(:where(${exclusion}))`;
  };
  const heading = select(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', '[role="heading"]'], 'heading');
  const text = select(['p', 'li', 'dt', 'dd', 'label', 'legend', 'figcaption', 'caption', 'td', 'th'], 'text');
  const link = select(['a[href]', '[role="link"]'], 'link');
  const surface = select(['article', 'aside', 'dialog', '[role="dialog"]', '[role="menu"]', '[role="listbox"]', 'fieldset'], 'surface');
  const button = select(['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]', 'input[type="reset"]'], 'button');
  const field = select(['textarea', 'select', 'input:not([type="hidden"],[type="checkbox"],[type="radio"],[type="range"],[type="color"],[type="image"],[type="button"],[type="submit"],[type="reset"])'], 'field');
  const reading = select([
    'main', '[role="main"]',
    'main > :where(article,section,div):has(> h1):has(> p,> section,> article)',
    'main > :where(article,section,div):has(> header h1):has(> p,> section,> article)',
    '[role="main"] > :where(article,section,div):has(> h1):has(> p,> section,> article)',
    '[role="main"] > :where(article,section,div):has(> header h1):has(> p,> section,> article)'
  ], 'reading');
  const selected = select(['[aria-selected="true"]', '[aria-pressed="true"]', '[aria-current]:not([aria-current="false"])'], 'selected');
  const error = select(['[aria-invalid="true"]'], 'error');
  const success = corrections.roles.success?.length ? select([], 'success') : null;
  const rule = (selector, declarations) => `${selector}{${Object.entries(declarations).map(([p,v]) => `${p}:${v} !important;`).join('')}}`;
  const css = [];
  css.push(rule(':root', { 'color-scheme': theme.scheme, 'accent-color': c.accent }));
  // No blanket backgrounds on divs: the simple variant deliberately tests semantic CSS.
  css.push(rule('html,body', { 'background-color': c.background, color: c.text }));
  css.push(rule('body', { 'font-family': theme.font }));
  css.push(rule(select(['header', 'footer', 'nav', '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'], 'navigation'), { 'background-color': c.surface, color: c.text, 'border-color': c.line }));
  css.push(rule(heading, { color: c.text, 'font-family': theme.headingFont, 'font-weight': theme.weight, 'letter-spacing': '-0.035em' }));
  css.push(rule(text, { color: c.text, 'font-family': theme.font }));
  css.push(rule(link, { color: c.link, 'text-decoration-color': c.link, 'text-underline-offset': '0.18em' }));
  css.push(rule(surface, { 'background-color': c.surface, color: c.text, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius }));
  css.push(rule(`${button},${field}`, { 'background-color': c.control || c.surface, color: c.text, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius, 'font-family': theme.font }));
  css.push(rule(button, { 'font-weight': theme.weight }));
  css.push(rule(`${button}:hover`, { 'background-color': c.raised, color: c.text, 'border-color': c.accent }));
  css.push(rule(`${link}:hover`, { 'text-decoration-line': 'underline' }));
  css.push(rule(`${field}::placeholder`, { color: c.muted, opacity: '1' }));
  css.push(rule(select(['pre', 'code', 'kbd', 'samp'], 'code'), { color: c.text, 'background-color': c.raised }));
  css.push(rule(select(['hr', 'th', 'td'], 'rule'), { 'border-color': c.line }));
  css.push(rule(select([':focus-visible'], 'focus'), { outline: `3px solid ${c.accent}`, 'outline-offset': '3px' }));
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, 'box-shadow': `inset 0 -3px 0 ${c.accentText}` }));
  css.push(rule(select([':disabled', '[aria-disabled="true"]'], 'disabled'), { 'border-style': 'dashed', opacity: '0.65' }));
  css.push(rule(error, { 'border-color': c.error, 'outline-color': c.error, 'border-style': 'double', 'border-width': '3px', 'text-decoration-line': 'underline', 'text-decoration-style': 'wavy', 'text-decoration-color': c.error }));
  if (success) css.push(rule(success, { color: c.success, 'border-bottom': `3px solid ${c.success}`, 'text-decoration-line': 'underline', 'text-decoration-style': 'solid' }));

  if (theme.id === 'terminal-vision') {
    css.push(rule('body', { 'background-image': 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(157,255,176,.035) 3px 4px)' }));
    css.push(rule(heading, { 'text-shadow': '0 0 12px rgba(157,255,176,.5)' }));
    css.push(rule(surface, { 'background-image': 'repeating-linear-gradient(90deg,transparent 0 12px,rgba(157,255,176,.055) 12px 13px),repeating-linear-gradient(0deg,transparent 0 12px,rgba(157,255,176,.04) 12px 13px)', 'box-shadow': 'inset 0 0 26px rgba(0,0,0,.28),0 0 18px rgba(157,255,176,.1)', animation: 'surface-terminal-drift-v1 12s linear infinite' }));
    css.push(rule(`${button}:hover,${link}:hover`, { 'text-shadow': '0 0 9px rgba(215,255,78,.75)', 'box-shadow': '0 0 12px rgba(215,255,78,.18)' }));
    css.push('@keyframes surface-terminal-drift-v1{to{background-position:90px 180px}}');
  }
  css.push(...buildThemeMotifs(theme, rule, {
    page: 'body', heading, surface, control: `:is(${button},${field})`, link,
    chrome: select(['header', 'footer', 'nav', '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'], 'navigation'),
    animated: surface
  }));
  css.push(...buildPurposeMotifs(theme, rule, {
    reading,
    // A/B never decorated sections, so retain their authored paint.
    section: ':not(*)', panel: surface,
    data: select(['table'], 'data'), title: select(['h1', '[role="heading"][aria-level="1"]'], 'title'),
    sectionHeading: select(['main h2', 'article h2', '[role="main"] [role="heading"][aria-level="2"]'], 'section-heading'),
    navigation: select(['header', 'footer', 'nav', '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]'], 'navigation'), field
  }));
  css.push(`@media (prefers-reduced-motion:reduce){${surface}{animation:none !important;}}`);
  if (theme.id === 'browser-archeology') css.push(`@media (max-width:520px){${select(['h1', '[role="heading"][aria-level="1"]'], 'title')}{padding-inline-end:8px !important;background-image:${iconImage(theme.id, 'document')},linear-gradient(90deg,#000080,#1084d0) !important;background-position:4px center,0 0 !important;background-size:18px 18px,100% 100% !important;}}`);
  // States come last so decorative treatments cannot erase essential distinctions.
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, 'background-image': 'none' }));
  css.push(rule(`${selected} :where(span,strong,em)`, { color: 'inherit' }));
  if (corrections.roles['overlay-control']?.length) {
    css.push(rule(`:where(${corrections.roles['overlay-control'].join(',')})`, { 'background-color': 'transparent', color: '#ffffff', 'box-shadow': 'none', 'text-shadow': '0 1px 3px #000', 'border-color': 'transparent' }));
  }
  return `/* Surface v1 | ${theme.id} | ${renderer} */\n${css.join('\n')}`;
}
