import { buildIconStyles, iconImage, windowControlsImage } from './icons.js';

const LIQUID_WASH = 'linear-gradient(90deg,rgba(255,198,226,.58) 0%,rgba(255,229,163,.58) 24%,rgba(255,242,166,.54) 40%,rgba(163,236,218,.56) 60%,rgba(184,217,255,.58) 80%,rgba(223,197,255,.62) 100%)';
const LIQUID_SURFACE = 'linear-gradient(135deg,#fff1f7 0%,#fffdf8 48%,#f0fff9 100%)';
const ink = color => ({ color, '-webkit-text-fill-color': color });

// Shared motifs keep all three themes visually consistent without changing site layout.
function buildThemeMotifs(theme, rule, { page, heading, surface, control, link, chrome }) {
  if (theme.id === 'browser-archeology') return [
    rule(page, { 'background-image': 'repeating-conic-gradient(rgba(255,255,255,.035) 0 25%,rgba(0,0,0,.025) 0 50%)', 'background-size': '4px 4px' }),
    rule(heading, { ...ink('#000080'), 'letter-spacing': 'normal', 'text-shadow': 'none' }),
    rule(surface, { 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.35)', 'background-image': 'none' }),
    rule(chrome, { 'background-color': '#c0c0c0', 'background-image': 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 3px)', 'box-shadow': 'inset 0 1px #fff,inset 0 -2px #808080', 'font-family': 'Arial, Helvetica, sans-serif' }),
    rule(control, { 'font-family': 'Arial, Helvetica, sans-serif', 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080' }),
    rule(`${control}:active`, { 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040,inset -1px -1px #dfdfdf' }),
    rule(link, { 'text-decoration-line': 'underline', 'text-underline-offset': '1px' }),
    rule(`${link}:hover`, { ...ink('#ffffff'), 'background-color': '#000080', 'text-decoration-color': '#ffffff', 'box-shadow': '0 0 0 1px #000080' }),
    rule('::selection', { color: '#ffffff', 'background-color': '#000080' })
  ];
  if (theme.id === 'liquid-dream') return [
    rule(page, { 'background-image': 'none' }),
    rule(heading, { ...ink('#4b235d'), 'letter-spacing': '-0.045em', 'text-shadow': '0 2px 0 rgba(255,255,255,.58)' }),
    rule(surface, { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', 'border-color': '#b9a5c2', 'box-shadow': '0 16px 42px rgba(78,64,104,.13)' }),
    rule(`${surface}:hover`, { 'border-color': '#8f6da0', 'box-shadow': '0 20px 48px rgba(78,64,104,.19)' }),
    rule(control, { 'font-family': 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', 'border-radius': '999px', 'box-shadow': 'inset 0 1px 0 rgba(255,255,255,.8),0 12px 26px rgba(78,64,104,.12)' }),
    rule(`${control}:hover`, { 'background-image': LIQUID_WASH, 'border-color': '#7d5e8e' }),
    rule(`${link}:hover`, { ...ink('#8b245e'), 'text-decoration-thickness': '2px', 'text-shadow': '0 2px 12px rgba(255,106,183,.28)' }),
    rule('::selection', { color: '#201928', 'background-color': '#a3ecda' })
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
    rule(title, { ...ink(theme.colors.accentText), 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': 'clamp(20px,2.4vw,32px)', 'line-height': '1.15', 'min-height': '22px', 'padding-block': '3px', 'padding-inline': '26px 62px', 'border-bottom': '0', 'text-shadow': 'none', 'background-color': '#000080', 'background-image': `${iconImage(theme.id, 'document')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '4px 3px,calc(100% - 3px) 3px,0 0', 'background-size': '18px 18px,54px 18px,100% 100%', 'background-repeat': 'no-repeat' }),
    rule(`${title} :where(span,strong,em,small)`, ink(theme.colors.accentText)),
    rule(sectionHeading, { 'font-family': 'Arial,Helvetica,sans-serif', 'border-bottom': '1px solid #808080', 'text-shadow': 'none' }),
    rule(navigation, { 'background-color': '#d4d0c8', 'box-shadow': 'inset 0 1px #fff,inset 0 -1px #808080', 'font-family': 'Arial,Helvetica,sans-serif' }),
    rule(field, { 'background-color': '#ffffff', 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040', 'border-radius': '0' }),
    rule(`${field}:focus-visible`, { outline: '2px dotted #000000', 'outline-offset': '-4px' })
  ];
  return [
    rule(reading, { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', border: '1px solid #b5a0bd', 'border-radius': '18px', 'box-shadow': '0 12px 32px rgba(78,64,104,.12)' }),
    rule(section, { ...reset, 'background-color': 'transparent', border: '0' }),
    rule(panel, { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', border: '1px solid #a98bb5', 'box-shadow': '0 8px 24px rgba(78,64,104,.16)', 'border-radius': '16px' }),
    rule(data, { ...reset, 'background-color': '#fff9f1', border: '1px solid #9b859e' }),
    rule(`${title},${sectionHeading}`, { ...ink('#4b235d'), 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'border-bottom': '2px solid #8f6da0', 'border-radius': '8px', 'letter-spacing': '-0.025em' }),
    rule(navigation, { 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'box-shadow': 'inset 0 -1px rgba(110,83,137,.36)' }),
    rule(field, { 'background-color': '#fff9f1', 'background-image': 'none', 'box-shadow': 'inset 0 1px 3px rgba(78,64,104,.18)' })
  ];
}

// USER-origin CSS is injected by the service worker. The unified renderer uses
// temporary namespaced attributes to bind these rules to understood page roles.
export function buildStyles(theme, { corrections = { roles: {}, preserve: [] }, startup = false } = {}) {
  const c = theme.colors;
  const themeRoot = `:root[data-surface-theme-v2="${theme.id}"]${startup ? ':not([data-surface-user-styles-v2])' : ''}`;
  const rule = (selector, declarations) => `${selector}{${Object.entries(declarations).map(([property, value]) => `${property}:${value} !important;`).join('')}}`;
  const context = value => `[data-surface-context-v1="${value}"]`;
  const text = value => `[data-surface-text-v1="${value}"]`;
  const tone = value => `[data-surface-tone-v1="${value}"]`;
  const highOrMedium = ':where([data-surface-confidence-v1="high"],[data-surface-confidence-v1="medium"])';
  const themedHeading = `${tone('theme')}${text('heading')}${highOrMedium}:not(:where([data-surface-purpose-v1="title"],[data-surface-purpose-v1="title"] *,[data-surface-window-title-v1],[data-surface-window-title-v1] *))`;
  const selected = `${context('control')}:where([aria-selected="true"],[aria-pressed="true"],[aria-current]:not([aria-current="false"]))`;
  const errorSelectors = ['[aria-invalid="true"]', ...(corrections.roles.error || [])].join(',');
  const successSelectors = corrections.roles.success || [];
  const css = [];

  // While the document is still parsing, the unified renderer exposes a small
  // canvas-first phase instead of waiting for the full purpose/contrast pass.
  // These rules disappear with data-surface-starting-v2 at DOMContentLoaded.
  const starting = ':root[data-surface-starting-v2]';
  css.push(rule(`${starting},${starting} body`, { 'background-color': c.background, color: c.text, 'font-family': theme.font, 'color-scheme': theme.scheme }));
  css.push(rule(`${starting} a`, { color: c.link }));

  css.push(rule(':root', { 'color-scheme': theme.scheme, 'accent-color': c.accent, ...(startup ? { '--surface-startup-styles-resident': '1' } : {}) }));
  css.push(rule(`${context('page')}`, { 'background-color': c.background }));
  css.push(rule(`${context('content')}`, { 'background-color': c.surface, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius }));
  css.push(rule(`${context('chrome')}`, { 'background-color': c.surface, 'border-color': c.line }));
  css.push(rule(`${context('control')}`, { 'background-color': c.control || c.surface, color: c.text, '-webkit-text-fill-color': 'currentColor', '--surface-control-ink-v1': c.text, border: `${theme.border} solid ${c.line}`, 'border-radius': theme.radius, 'font-family': theme.font }));
  css.push(rule(`${context('control')}:hover`, { 'background-color': c.raised, color: c.text, '-webkit-text-fill-color': 'currentColor', '--surface-control-ink-v1': c.text, 'border-color': c.accent }));
  css.push(rule(`${text('heading')}${highOrMedium}`, { 'font-family': theme.headingFont, 'font-weight': theme.weight, 'letter-spacing': '-0.035em' }));
  css.push(rule(`:where(${text('text')},${text('link')},${text('code')})${highOrMedium}`, { 'font-family': theme.font }));
  // Once Surface owns a foreground/background pair, each declaration owns
  // both CSS color channels. An authored fill that originally matched color
  // must not stay stale after the surrounding surface changes.
  css.push(rule(`${tone('theme')}:where(${text('heading')},${text('text')})`, ink(`var(--surface-readable-color-v1,${c.text})`)));
  css.push(rule(`${tone('theme')}${text('link')}`, { ...ink(`var(--surface-readable-color-v1,${c.link})`), 'text-decoration-color': 'currentColor', 'text-underline-offset': '0.18em' }));
  css.push(rule(`${tone('theme')}${text('code')}`, { ...ink(`var(--surface-readable-color-v1,${c.text})`), 'background-color': c.raised }));
  css.push(rule(`${context('control')}::placeholder`, { color: 'currentColor', opacity: '1' }));
  css.push(rule(`${tone('control')}`, { color: 'var(--surface-control-ink-v1)', '-webkit-text-fill-color': 'currentColor' }));
  css.push(rule(`${tone('preserve')}`, { color: 'var(--surface-original-color-v1)' }));
  css.push(rule(`${context('brand')}`, { color: 'var(--surface-original-color-v1)', 'background-color': 'var(--surface-original-background-v1)', isolation: 'isolate' }));
  if (!startup) {
    css.push(rule(':focus-visible', { outline: `3px solid ${c.accent}`, 'outline-offset': '3px' }));
    css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, 'box-shadow': `inset 0 -3px 0 ${c.accentText}`, 'background-image': 'none' }));
    css.push(rule(`${context('control')}:where(:disabled,[aria-disabled="true"])`, { 'border-style': 'dashed', opacity: '0.65' }));
    css.push(rule(`:where(${errorSelectors})[data-surface-context-v1],:where(${errorSelectors})[data-surface-text-v1]`, { 'border-color': c.error, 'outline-color': c.error, 'border-style': 'double', 'border-width': '3px', 'text-decoration-line': 'underline', 'text-decoration-style': 'wavy', 'text-decoration-color': c.error }));
    if (successSelectors.length) css.push(rule(`:where(${successSelectors.join(',')})[data-surface-context-v1],:where(${successSelectors.join(',')})[data-surface-text-v1]`, { 'border-bottom': `3px solid ${c.success}`, 'text-decoration-line': 'underline', 'text-decoration-style': 'solid', 'text-decoration-color': c.success }));
  }

  if (theme.id === 'terminal-vision') {
    css.push(rule(`${context('page')}`, { 'background-image': 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(157,255,176,.035) 3px 4px)' }));
    css.push(rule(themedHeading, { 'text-shadow': '0 0 12px rgba(157,255,176,.5)' }));
    css.push(rule(`${context('content')}`, { 'background-image': 'repeating-linear-gradient(90deg,transparent 0 12px,rgba(157,255,176,.055) 12px 13px),repeating-linear-gradient(0deg,transparent 0 12px,rgba(157,255,176,.04) 12px 13px)', 'box-shadow': 'inset 0 0 26px rgba(0,0,0,.28),0 0 18px rgba(157,255,176,.1)' }));
    css.push(rule(`${context('control')}:hover,${tone('theme')}${text('link')}:hover`, { 'text-shadow': '0 0 9px rgba(215,255,78,.75)', 'box-shadow': '0 0 12px rgba(215,255,78,.18)' }));
    if (!startup) for (const [level, color] of ['#102d1d','#176244','#2f9e55','#7eea94','#d7ff4e'].entries()) {
      css.push(rule(`[role="grid"] [role="gridcell"][data-level="${level}"]`, { 'background-color': color, 'border-color': '#06110b', 'box-shadow': 'inset 0 0 0 1px rgba(157,255,176,.12)' }));
    }
  }
  css.push(...buildThemeMotifs(theme, rule, {
    page: context('page'), heading: themedHeading, surface: context('content'),
    control: context('control'), link: `${tone('theme')}${text('link')}`, chrome: context('chrome')
  }));
  const purpose = value => `[data-surface-purpose-v1="${value}"]`;
  css.push(...buildPurposeMotifs(theme, rule, {
    reading: purpose('reading'), section: purpose('section'), panel: purpose('panel'), data: purpose('data'),
    title: purpose('title'), sectionHeading: purpose('section-heading'), navigation: purpose('navigation'), field: purpose('field')
  }));
  if (!startup) css.push(...buildIconStyles(theme, rule));
  css.push(rule(context('shell'), { 'background-color': c.background }));
  const navigationFadeColor = theme.id === 'browser-archeology' ? '#d4d0c8' : c.surface;
  css.push(rule('[data-surface-navigation-fade-v1="before"]::before,[data-surface-navigation-fade-v1="after"]::after', { 'background-color': 'transparent', 'background-image': `linear-gradient(rgba(0,0,0,0),${navigationFadeColor})` }));
  if (theme.id === 'browser-archeology' && !startup) {
    const windowOwner = '[data-surface-window-v1]';
    const windowTitle = '[data-surface-window-title-v1]';
    css.push(rule(windowOwner, { 'border-width': '3px', 'border-style': 'solid', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.28)' }));
    css.push(rule(windowTitle, { 'min-height': '20px', 'margin-block': '0', 'padding-inline': '24px 60px', ...ink(c.accentText), 'font-family': 'Arial,Helvetica,sans-serif', 'font-weight': '700', 'text-shadow': 'none', 'background-color': c.accent, 'background-image': `${iconImage(theme.id, 'panel')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '3px 2px,calc(100% - 2px) 2px,0 0', 'background-size': '17px 17px,54px 18px,100% 100%', 'background-repeat': 'no-repeat', 'border-color': '#000080' }));
    css.push(rule(`${windowTitle}[data-surface-window-title-v1="reading"]`, { 'background-image': `${iconImage(theme.id, 'document')},${windowControlsImage()},linear-gradient(90deg,#000080,#1084d0)` }));
    css.push(rule(`${windowTitle},${windowTitle} *`, ink(c.accentText)));
    css.push(rule(purpose('title'), { ...ink(c.accentText), 'box-shadow': 'inset 1px 1px rgba(255,255,255,.55),inset -1px -1px rgba(0,0,0,.4)' }));
    css.push(rule(`${windowOwner}[data-surface-window-v1="frame"]`, { 'padding-top': '25px', 'background-color': '#ffffff', 'background-image': `${windowControlsImage()},linear-gradient(90deg,#808080,#a9a9a9)`, 'background-position': 'calc(100% - 4px) 4px,4px 4px', 'background-size': '54px 18px,calc(100% - 8px) 18px', 'background-repeat': 'no-repeat' }));
    css.push(rule(`${tone('theme')}${text('link')}:visited`, { ...ink('#551a8b'), 'text-decoration-color': '#551a8b' }));
    css.push(rule(`${tone('theme')}${text('link')}:hover,${tone('theme')}${text('link')}:focus-visible`, { ...ink('#ff0000'), 'background-color': 'transparent', 'text-decoration-color': '#ff0000', 'box-shadow': 'none' }));
    css.push(rule(`${context('control')}:where(:disabled,[aria-disabled="true"])`, { color: '#808080', '--surface-control-ink-v1': '#808080', 'border-style': 'solid', opacity: '1', 'text-shadow': '1px 1px #ffffff' }));
    css.push(rule('blockquote,[role="note"]', { 'background-color': '#ffffcc', border: '2px solid', 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040', 'border-radius': '0' }));
    css.push(rule('hr', { height: '0', border: '0', 'border-top': '1px solid #808080', 'border-bottom': '1px solid #ffffff' }));
    css.push(`@media (max-width:520px){${windowTitle}{padding-inline-end:48px !important;background-position:3px 2px,calc(100% - 2px) 2px,0 0 !important;background-size:16px 16px,42px 14px,100% 100% !important;}${windowOwner}[data-surface-window-v1="frame"]{background-position:calc(100% - 4px) 4px,4px 4px !important;background-size:42px 14px,calc(100% - 8px) 18px !important;}}`);
  }
  if (!startup) css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, '--surface-control-ink-v1': c.accentText, 'background-image': 'none' }));
  const output = css.join('\n');
  // Only the browser-registered startup copy needs a root gate because it
  // remains in an already-loaded document after a setting change. Keep the
  // authoritative USER-origin sheet unscoped: carrying every selector through
  // @scope measurably increased style-matching cost on dynamic pages.
  return startup
    ? `/* Surface v2 | ${theme.id} | unified startup */\n@scope (${themeRoot}) {\n${output}\n}`
    : `/* Surface v2 | ${theme.id} | unified */\n${output}`;
}
