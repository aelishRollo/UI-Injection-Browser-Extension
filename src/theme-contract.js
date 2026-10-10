const REQUIRED_COLOR_TOKENS = ['background', 'surface', 'raised', 'text', 'muted', 'line', 'accent', 'accentText', 'link', 'error', 'success', 'warning'];
const TREATMENT_TARGETS = new Set([
  'page', 'themedHeading', 'surface', 'surfaceHover', 'chrome', 'control', 'controlHover',
  'controlActive', 'controlDisabled', 'controlAndLinkHover', 'link', 'linkHover',
  'linkVisited', 'linkHoverFocus', 'selection', 'windowOwner', 'windowTitle',
  'windowTitleReading', 'windowTitleContents', 'windowFrame', 'titlePurpose', 'note', 'divider'
]);
const PURPOSE_TARGETS = new Set([
  'reading', 'section', 'panel', 'data', 'table-body', 'table-header', 'title', 'titleContents', 'section-heading',
  'titleAndSectionHeading', 'navigation', 'field', 'fieldFocus'
]);

function validateDeclarations(value, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0) {
    errors.push(`${label} must contain CSS declarations`);
    return;
  }
  for (const [property, declaration] of Object.entries(value)) {
    if (!property || !['string', 'number'].includes(typeof declaration)) errors.push(`${label}.${property || '(empty)'} has an invalid value`);
  }
}

function validateRules(rules, label, allowedTargets, errors) {
  if (!Array.isArray(rules)) {
    errors.push(`${label} must be an array`);
    return;
  }
  for (const [index, entry] of rules.entries()) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`${label}[${index}] must be an object`);
      continue;
    }
    if (!allowedTargets.has(entry.target)) errors.push(`${label}[${index}] uses unknown target ${entry.target}`);
    validateDeclarations(entry.declarations, `${label}[${index}].declarations`, errors);
  }
}

export function themeContractErrors(theme) {
  const errors = [];
  for (const field of ['id', 'name', 'description', 'scheme', 'font', 'headingFont', 'border', 'radius', 'weight']) {
    if (typeof theme?.[field] !== 'string' || !theme[field]) errors.push(`${field} must be a non-empty string`);
  }
  if (!['light', 'dark'].includes(theme?.scheme)) errors.push('scheme must be light or dark');
  if (!Number.isInteger(theme?.version) || theme.version < 1) errors.push('version must be a positive integer');
  for (const token of REQUIRED_COLOR_TOKENS) {
    if (typeof theme?.colors?.[token] !== 'string' || !theme.colors[token]) errors.push(`colors.${token} must be a non-empty string`);
  }
  if (!Array.isArray(theme?.assets)) errors.push('assets must be an array');
  else for (const [index, asset] of theme.assets.entries()) {
    if (!asset || typeof asset.path !== 'string' || !asset.path || /^(?:https?:|data:|\/)/i.test(asset.path) || /(^|\/)\.\.(\/|$)|\\/.test(asset.path)) errors.push(`assets[${index}].path must be a packaged relative path`);
  }
  if (!theme?.icons || !['pixel', 'flow', 'line'].includes(theme.icons.style)) errors.push('icons.style must be pixel, flow, or line');
  if (typeof theme?.icons?.ink !== 'string' || !theme.icons.ink) errors.push('icons.ink must be a non-empty string');
  if (typeof theme?.icons?.headings !== 'boolean') errors.push('icons.headings must be boolean');

  const treatments = theme?.treatments;
  if (!treatments || typeof treatments !== 'object') {
    errors.push('treatments must be an object');
    return errors;
  }
  validateRules(treatments.prelude || [], 'treatments.prelude', TREATMENT_TARGETS, errors);
  validateRules(treatments.motifs, 'treatments.motifs', TREATMENT_TARGETS, errors);
  validateRules(treatments.postlude, 'treatments.postlude', TREATMENT_TARGETS, errors);
  if (!treatments.purposes || typeof treatments.purposes !== 'object' || Array.isArray(treatments.purposes)) errors.push('treatments.purposes must be an object');
  else for (const [target, declarations] of Object.entries(treatments.purposes)) {
    if (!PURPOSE_TARGETS.has(target)) errors.push(`treatments.purposes uses unknown target ${target}`);
    validateDeclarations(declarations, `treatments.purposes.${target}`, errors);
  }
  if (typeof treatments.navigationFade !== 'string' || !treatments.navigationFade) errors.push('treatments.navigationFade must be a non-empty string');
  if (!Array.isArray(treatments.responsive)) errors.push('treatments.responsive must be an array');
  else for (const [index, responsive] of treatments.responsive.entries()) {
    if (typeof responsive?.query !== 'string' || !responsive.query) errors.push(`treatments.responsive[${index}].query must be a non-empty string`);
    validateRules(responsive?.rules, `treatments.responsive[${index}].rules`, TREATMENT_TARGETS, errors);
  }
  if (treatments.dataScale) {
    if (!Array.isArray(treatments.dataScale.colors) || treatments.dataScale.colors.length < 2 || treatments.dataScale.colors.some(color => typeof color !== 'string' || !color)) errors.push('treatments.dataScale.colors must contain at least two colors');
    validateDeclarations(treatments.dataScale.declarations, 'treatments.dataScale.declarations', errors);
  }
  return errors;
}

export function assertThemeContract(theme) {
  const errors = themeContractErrors(theme);
  if (errors.length) throw new Error(`Invalid theme ${theme?.id || '(unknown)'}:\n- ${errors.join('\n- ')}`);
  return theme;
}
