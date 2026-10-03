import { enable, disable, isEnabled, setFetchMethod } from 'darkreader';

let owned = false;
let fetchFailures = 0;
let preexistingStyles = new Set();
function allRoots(root = document) {
  const roots = [root];
  for (const element of root.querySelectorAll('*')) {
    if (element.shadowRoot) roots.push(...allRoots(element.shadowRoot));
  }
  return roots;
}
export function start(theme, corrections, fetchStylesheet) {
  // Do not take ownership of or disable another instance injected by the website/extension.
  if (!owned && document.querySelector('meta[name="darkreader"]')) throw new Error('Another Dark Reader instance is active. Disable it on this site before comparing renderers.');
  if (document.querySelector('meta[name="darkreader-lock"], [data-wp-dark-mode-preset]')) throw new Error('This page has a conflicting theme engine. Use renderer A here.');
  preexistingStyles = new Set(allRoots().flatMap(root => [...root.querySelectorAll('style.darkreader')]));
  setFetchMethod(async url => {
    try {
      const result = await fetchStylesheet(String(url));
      return new Response(result.text, { status: 200, headers: { 'Content-Type': result.contentType } });
    } catch (error) { fetchFailures++; throw error; }
  });
  enable({
    mode: theme.scheme === 'dark' ? 1 : 0,
    brightness: 100, contrast: 100, grayscale: 0, sepia: 0,
    useFont: false, textStroke: 0,
    darkSchemeBackgroundColor: theme.colors.background,
    darkSchemeTextColor: theme.colors.text,
    lightSchemeBackgroundColor: theme.colors.background,
    lightSchemeTextColor: theme.colors.text,
    styleSystemControls: true
  }, {
    invert: [], css: '', ignoreInlineStyle: corrections.preserve.flatMap(s => [s, `${s} *`]),
    ignoreImageAnalysis: ['*'], disableStyleSheetsProxy: true
  });
  owned = true;
  if (!isEnabled()) throw new Error('The adaptation engine did not start');
}

export async function stop() {
  if (!owned) return;
  disable();
  owned = false;
  // The pinned API leaves its shadow-root inversion sheet behind on disable.
  // Only remove styles absent before our enable, and drain its one-shot shadow
  // initialization observer before a second sweep. No persistent observer here.
  const roots = allRoots();
  const clean = () => {
    for (const root of roots) {
      for (const node of root.querySelectorAll('style.darkreader')) {
        if (!preexistingStyles.has(node)) node.remove();
      }
    }
  };
  clean();
  await Promise.resolve();
  clean();
  preexistingStyles.clear();
}

export function diagnostics() {
  return { adapter: 'darkreader', version: '4.9.133', enabled: owned && isEnabled(), fetchFailures, builtInSiteFixes: false, stylesheetProxy: false };
}
