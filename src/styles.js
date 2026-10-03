// Shared motifs keep all three renderers visually consistent without changing site layout.
function buildThemeMotifs(theme, rule, { page, heading, surface, control, link, chrome, animated }) {
  if (theme.id === 'browser-archeology') return [
    rule(page, { 'background-image': 'none' }),
    rule(heading, { 'letter-spacing': 'normal', 'text-shadow': 'none' }),
    rule(surface, { 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 0 3px 0 #000080,0 0 0 1px #808080,3px 3px 0 rgba(0,0,0,.35)', 'background-image': 'none' }),
    rule(chrome, { 'background-color': '#c0c0c0', 'box-shadow': 'inset 0 1px #fff,inset 0 -2px #808080' }),
    rule(control, { 'font-family': 'Arial, Helvetica, sans-serif', 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080' }),
    rule(`${control}:active`, { 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040,inset -1px -1px #dfdfdf' }),
    rule(link, { 'text-decoration-line': 'underline', 'text-underline-offset': '1px' })
  ];
  if (theme.id === 'liquid-dream') return [
    rule(page, { 'background-image': 'radial-gradient(circle at 8% 15%,rgba(255,228,108,.23),transparent 26%),radial-gradient(circle at 94% 7%,rgba(71,230,209,.16),transparent 24%)' }),
    rule(heading, { 'letter-spacing': '-0.045em', 'text-shadow': '0 2px 0 rgba(255,255,255,.42)' }),
    rule(surface, { 'background-image': 'repeating-radial-gradient(ellipse at 90% 10%,rgba(255,255,255,.22) 0 4px,transparent 5px 18px),linear-gradient(135deg,#ffc6e2,#ffed8e 48%,#67dfd1)', 'background-size': '180% 180%,100% 100%', 'box-shadow': '0 22px 52px rgba(78,64,104,.14)' }),
    rule(`${surface}:hover`, { 'box-shadow': '0 28px 62px rgba(78,64,104,.22)' }),
    rule(control, { 'font-family': 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', 'border-radius': '999px', 'box-shadow': 'inset 0 1px 0 rgba(255,255,255,.8),0 12px 26px rgba(78,64,104,.12)' }),
    rule(`${control}:hover`, { 'background-image': 'linear-gradient(105deg,#ffc6e2,#ffed8e 52%,#67dfd1)' }),
    rule(animated, { animation: 'surface-liquid-flow-v1 18s ease-in-out infinite alternate' }),
    '@keyframes surface-liquid-flow-v1{from{background-position:0% 0%,0 0}to{background-position:100% 100%,0 0}}'
  ];
  return [];
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
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, '--surface-control-ink-v1': c.accentText, 'background-image': 'none' }));
  css.push(`@media (prefers-reduced-motion:reduce){${context('content')}[data-surface-prominent-v1],${context('control')}[data-surface-prominent-v1]{animation:none !important;}}`);
  return `/* Surface v1 | ${theme.id} | contextual */\n${css.join('\n')}`;
}

export function buildStyles(theme, { renderer = 'simple', corrections = { roles: {}, preserve: [] } } = {}) {
  if (renderer === 'contextual') return buildContextualStyles(theme, corrections);
  const c = theme.colors;
  const protectedSelectors = ['svg', 'math', '[contenteditable="true"]', ...corrections.preserve];
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
  css.push(`@media (prefers-reduced-motion:reduce){${surface}{animation:none !important;}}`);
  // States come last so decorative treatments cannot erase essential distinctions.
  css.push(rule(selected, { 'background-color': c.accent, color: c.accentText, 'background-image': 'none' }));
  css.push(rule(`${selected} :where(span,strong,em)`, { color: 'inherit' }));
  if (corrections.roles['overlay-control']?.length) {
    css.push(rule(`:where(${corrections.roles['overlay-control'].join(',')})`, { 'background-color': 'transparent', color: '#ffffff', 'box-shadow': 'none', 'text-shadow': '0 1px 3px #000', 'border-color': 'transparent' }));
  }
  return `/* Surface v1 | ${theme.id} | ${renderer} */\n${css.join('\n')}`;
}
