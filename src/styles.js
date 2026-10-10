import { buildIconStyles } from './icons.js';

const ink = color => ({ color, '-webkit-text-fill-color': color });

function buildTreatmentRules(entries, targets, rule) {
  return (entries || []).map(({ target, declarations }) => {
    const selector = targets[target];
    if (!selector) throw new Error(`Unknown theme treatment target: ${target}`);
    return rule(selector, declarations);
  });
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
  // Large SPA routes keep expensive offscreen classification deferred. Their
  // semantic reading children inherit one continuous canvas in the meantime;
  // authored background images remain intact, and normal recognized purpose
  // rules below replace this provisional color when each region is scanned.
  css.push(rule('[data-surface-deferred-reading-v1] > :where(section,article,[role="region"])', { 'background-color': 'transparent' }));
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

  const purpose = value => `[data-surface-purpose-v1="${value}"]`;
  const windowOwner = '[data-surface-window-v1]';
  const windowTitle = '[data-surface-window-title-v1]';
  const link = `${tone('theme')}${text('link')}`;
  const targets = {
    page: context('page'),
    themedHeading,
    surface: context('content'),
    surfaceHover: `${context('content')}:hover`,
    chrome: context('chrome'),
    control: context('control'),
    controlHover: `${context('control')}:hover`,
    controlActive: `${context('control')}:active`,
    controlDisabled: `${context('control')}:where(:disabled,[aria-disabled="true"])`,
    controlAndLinkHover: `${context('control')}:hover,${link}:hover`,
    link,
    linkHover: `${link}:hover`,
    linkVisited: `${link}:visited`,
    linkHoverFocus: `${link}:hover,${link}:focus-visible`,
    selection: '::selection',
    windowOwner,
    windowTitle,
    windowTitleReading: `${windowTitle}[data-surface-window-title-v1="reading"]`,
    windowTitleContents: `${windowTitle},${windowTitle} *`,
    windowFrame: `${windowOwner}[data-surface-window-v1="frame"]`,
    titlePurpose: purpose('title'),
    note: 'blockquote,[role="note"]',
    divider: 'hr'
  };
  const purposeTargets = {
    reading: purpose('reading'),
    section: purpose('section'),
    panel: purpose('panel'),
    data: purpose('data'),
    'table-body': '[data-surface-table-part-v1="body"]',
    'table-header': '[data-surface-table-part-v1="header"]',
    title: purpose('title'),
    titleContents: `${purpose('title')} :where(span,strong,em,small)`,
    'section-heading': purpose('section-heading'),
    titleAndSectionHeading: `${purpose('title')},${purpose('section-heading')}`,
    navigation: purpose('navigation'),
    field: purpose('field'),
    fieldFocus: `${purpose('field')}:focus-visible`
  };

  css.push(...buildTreatmentRules(theme.treatments.prelude, targets, rule));
  if (!startup && theme.treatments.dataScale) {
    for (const [level, color] of theme.treatments.dataScale.colors.entries()) {
      css.push(rule(`[role="grid"] [role="gridcell"][data-level="${level}"]`, { 'background-color': color, ...theme.treatments.dataScale.declarations }));
    }
  }
  css.push(...buildTreatmentRules(theme.treatments.motifs, targets, rule));
  css.push(...buildTreatmentRules(
    Object.entries(theme.treatments.purposes).map(([target, declarations]) => ({ target, declarations })),
    purposeTargets,
    rule
  ));
  if (!startup) css.push(...buildIconStyles(theme, rule));
  css.push(rule(context('shell'), { 'background-color': c.background }));
  css.push(rule('[data-surface-navigation-fade-v1="before"]::before,[data-surface-navigation-fade-v1="after"]::after', { 'background-color': 'transparent', 'background-image': `linear-gradient(rgba(0,0,0,0),${theme.treatments.navigationFade})` }));
  if (!startup) {
    css.push(...buildTreatmentRules(theme.treatments.postlude, targets, rule));
    for (const responsive of theme.treatments.responsive) {
      css.push(`@media ${responsive.query}{${buildTreatmentRules(responsive.rules, targets, rule).join('')}}`);
    }
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
