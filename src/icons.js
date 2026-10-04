// Original, local SVG glyphs. Reuse the site's icon slot and accessible control;
// these assets never add a new action, replace a logo, or load remote content.
export const ICON_ROLES = ['menu', 'search', 'language', 'more', 'document', 'section'];

export function iconImage(theme, role) {
  const pixel = theme === 'browser-archeology';
  const ink = theme === 'terminal-vision' ? '#9dffb0' : '#342647';
  const pixelShapes = {
    menu: '<path fill="#fff" stroke="#000" d="M2 3h15v14H2z"/><path stroke="#000080" stroke-width="2" d="M6 7h8M6 10h8M6 13h8"/><path stroke="#008080" d="M3 6h1v2H3zM3 9h1v2H3zM3 12h1v2H3z"/>',
    search: '<path fill="#9fffff" stroke="#000" d="M3 2h7v2h2v7h-2v2H3v-2H1V4h2z"/><path fill="#c0c0c0" stroke="#000" d="m11 12 2-2 6 6-2 2z"/><path stroke="#fff" d="M4 4h5M3 5v4"/>',
    language: '<path fill="#008080" stroke="#000" d="M6 1h8v2h3v3h2v8h-2v3h-3v2H6v-2H3v-3H1V6h2V3h3z"/><path stroke="#9fffff" fill="none" d="M1 10h18M4 5h12M4 15h12M8 2v16M12 2v16"/>',
    more: '<path fill="#c0c0c0" stroke="#000" d="M2 3h16v14H2z"/><path stroke="#fff" d="M3 16V4h14"/><path fill="#000080" d="M5 9h2v2H5zM9 9h2v2H9zM13 9h2v2h-2z"/>',
    document: '<path fill="#fff" stroke="#111" d="M3 1h10l4 4v14H3z"/><path fill="#c0c0c0" stroke="#111" d="M13 1v5h4"/><path stroke="#000080" d="M6 9h8M6 12h8M6 15h6"/>',
    section: '<path fill="#ffff80" stroke="#111" d="M1 5V3h7l2 2h8v12H1z"/><path fill="#ffdc55" stroke="#111" d="M1 8h18l-3 10H1z"/><path stroke="#fff" d="M3 9h13"/>'
  };
  const paths = {
    menu: '<path d="M4 5h12M4 10h12M4 15h12"/>',
    search: '<circle cx="8" cy="8" r="5.5"/><path d="m12 12 5.5 5.5"/>',
    language: '<circle cx="10" cy="10" r="8"/><ellipse cx="10" cy="10" rx="3.5" ry="8"/><path d="M2 10h16M4 5.5h12M4 14.5h12"/>',
    more: '<circle cx="4" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
    document: '<path d="M5 2h7l4 4v12H5zM12 2v5h4M8 10h5M8 14h5"/>',
    section: '<path d="M2 6V4h6l2 2h8v11H2zM2 9h16"/>'
  };
  if (theme === 'liquid-dream') {
    paths.menu = '<path d="M3 5c4-3 10 3 14 0M3 10c4-3 10 3 14 0M3 15c4-3 10 3 14 0"/>';
    paths.document = '<rect x="4" y="2" width="12" height="16" rx="4"/><path d="M7 7c2-2 4 2 6 0M7 11c2-2 4 2 6 0M7 15h4"/>';
    paths.section = '<path d="M10 2c2 4 7 5 7 10a7 7 0 0 1-14 0c0-4 4-7 7-10zM6 13c2 3 6 2 7-1"/>';
  }
  const shape = pixel ? pixelShapes[role] : `<defs><linearGradient id="flow"><stop stop-color="#b82d77"/><stop offset=".48" stop-color="#116e68"/><stop offset="1" stop-color="#55319c"/></linearGradient></defs><g fill="none" stroke="${theme === 'liquid-dream' ? 'url(#flow)' : ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[role]}</g>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"${pixel ? ' shape-rendering="crispEdges"' : ''}>${shape}</svg>`)}")`;
}

export function buildIconStyles(theme, rule) {
  const css = [];
  for (const role of ICON_ROLES) {
    css.push(rule(`[data-surface-glyph-v1="${role}"]`, {
      'mask-image': 'none', '-webkit-mask-image': 'none', 'background-color': 'transparent',
      'background-image': iconImage(theme.id, role), 'background-size': 'contain', 'background-position': 'center', 'background-repeat': 'no-repeat'
    }));
  }
  // Only unused ::before slots are annotated. Existing site pseudo-icons survive.
  if (theme.id !== 'terminal-vision') for (const role of ['document', 'section']) {
    css.push(rule(`[data-surface-heading-glyph-v1="${role}"]::before`, {
      content: '""', display: 'inline-block', width: '0.85em', height: '0.85em', 'margin-inline-end': '0.35em', 'vertical-align': '-0.05em',
      'background-image': iconImage(theme.id, role), 'background-size': 'contain', 'background-repeat': 'no-repeat'
    }));
  }
  return css;
}
