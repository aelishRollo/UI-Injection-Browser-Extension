// Original, local SVG glyphs. Reuse the site's icon slot and accessible control;
// these assets never add a new action, replace a logo, or load remote content.
export const ICON_ROLES = ['menu', 'search', 'language', 'more', 'home', 'history', 'settings', 'download', 'document', 'panel', 'section'];

export function iconImage(theme, role) {
  const pixel = theme.icons.style === 'pixel';
  const flow = theme.icons.style === 'flow';
  const ink = theme.icons.ink;
  const pixelShapes = {
    menu: '<path fill="#fff" stroke="#000" d="M2 3h15v14H2z"/><path stroke="#000080" stroke-width="2" d="M6 7h8M6 10h8M6 13h8"/><path stroke="#008080" d="M3 6h1v2H3zM3 9h1v2H3zM3 12h1v2H3z"/>',
    search: '<path fill="#9fffff" stroke="#000" d="M3 2h7v2h2v7h-2v2H3v-2H1V4h2z"/><path fill="#c0c0c0" stroke="#000" d="m11 12 2-2 6 6-2 2z"/><path stroke="#fff" d="M4 4h5M3 5v4"/>',
    language: '<path fill="#008080" stroke="#000" d="M6 1h8v2h3v3h2v8h-2v3h-3v2H6v-2H3v-3H1V6h2V3h3z"/><path stroke="#9fffff" fill="none" d="M1 10h18M4 5h12M4 15h12M8 2v16M12 2v16"/>',
    more: '<path fill="#c0c0c0" stroke="#000" d="M2 3h16v14H2z"/><path stroke="#fff" d="M3 16V4h14"/><path fill="#000080" d="M5 9h2v2H5zM9 9h2v2H9zM13 9h2v2h-2z"/>',
    home: '<path fill="#ffff80" stroke="#000" d="m2 9 8-7 8 7-2 2v7H4v-7z"/><path fill="#008080" stroke="#000" d="M8 12h4v6H8z"/><path stroke="#fff" d="M5 10v6"/>',
    history: '<path fill="#fff" stroke="#000" d="M3 2h13v16H3z"/><path stroke="#000080" d="M6 6h7M6 9h7M6 12h5"/><path fill="#008080" d="M1 14h8v5H1z"/><path stroke="#fff" d="M2 15h6"/>',
    settings: '<path fill="#c0c0c0" stroke="#000" d="M8 1h4l1 3 3-1 2 3-2 2 3 1v4l-3 1 2 2-2 3-3-1-1 3H8l-1-3-3 1-2-3 2-2-3-1V9l3-1-2-2 2-3 3 1z"/><path fill="#008080" stroke="#000" d="M7 7h6v6H7z"/>',
    download: '<path fill="#fff" stroke="#000" d="M3 2h14v16H3z"/><path fill="#000080" d="M8 3h4v7h3l-5 5-5-5h3z"/><path stroke="#008080" d="M6 16h8"/>',
    document: '<path fill="#fff" stroke="#111" d="M3 1h10l4 4v14H3z"/><path fill="#c0c0c0" stroke="#111" d="M13 1v5h4"/><path stroke="#000080" d="M6 9h8M6 12h8M6 15h6"/>',
    panel: '<path fill="#c0c0c0" stroke="#111" d="M1 2h18v16H1z"/><path fill="#000080" d="M3 4h14v3H3z"/><path fill="#fff" stroke="#808080" d="M3 9h6v6H3zM11 9h6v6h-6z"/>',
    section: '<path fill="#ffff80" stroke="#111" d="M1 5V3h7l2 2h8v12H1z"/><path fill="#ffdc55" stroke="#111" d="M1 8h18l-3 10H1z"/><path stroke="#fff" d="M3 9h13"/>'
  };
  const paths = {
    menu: '<path d="M4 5h12M4 10h12M4 15h12"/>',
    search: '<circle cx="8" cy="8" r="5.5"/><path d="m12 12 5.5 5.5"/>',
    language: '<circle cx="10" cy="10" r="8"/><ellipse cx="10" cy="10" rx="3.5" ry="8"/><path d="M2 10h16M4 5.5h12M4 14.5h12"/>',
    more: '<circle cx="4" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/><circle cx="16" cy="10" r="1.2"/>',
    home: '<path d="m3 9 7-6 7 6v8H3zM8 17v-5h4v5"/>',
    history: '<path d="M4 3h12v14H4zM7 7h6M7 10h6M7 13h4"/>',
    settings: '<circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4"/>',
    download: '<path d="M10 2v11M6 9l4 4 4-4M4 17h12"/>',
    document: '<path d="M5 2h7l4 4v12H5zM12 2v5h4M8 10h5M8 14h5"/>',
    panel: '<rect x="2" y="3" width="16" height="14" rx="2"/><path d="M2 7h16M7 7v10"/>',
    section: '<path d="M2 6V4h6l2 2h8v11H2zM2 9h16"/>'
  };
  if (flow) {
    paths.menu = '<path d="M3 5c4-3 10 3 14 0M3 10c4-3 10 3 14 0M3 15c4-3 10 3 14 0"/>';
    paths.document = '<rect x="4" y="2" width="12" height="16" rx="4"/><path d="M7 7c2-2 4 2 6 0M7 11c2-2 4 2 6 0M7 15h4"/>';
    paths.section = '<path d="M10 2c2 4 7 5 7 10a7 7 0 0 1-14 0c0-4 4-7 7-10zM6 13c2 3 6 2 7-1"/>';
  }
  const shape = pixel ? pixelShapes[role] : `<defs><linearGradient id="flow"><stop stop-color="#b82d77"/><stop offset=".48" stop-color="#116e68"/><stop offset="1" stop-color="#55319c"/></linearGradient></defs><g fill="none" stroke="${flow ? 'url(#flow)' : ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[role]}</g>`;
  return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"${pixel ? ' shape-rendering="crispEdges"' : ''}>${shape}</svg>`)}")`;
}

// A single decorative image makes classic title-bar furniture recognizable
// without creating focusable controls or taking over an existing pseudo-slot.
// Muted outlines and glyphs deliberately read as disabled, not clickable.
export function windowControlsImage() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 18" shape-rendering="crispEdges"><g fill="#c0c0c0" stroke="#808080"><path d="M1 1h16v16H1zM19 1h16v16H19zM37 1h16v16H37z"/></g><path fill="none" stroke="#dfdfdf" d="M2 16V2h14M20 16V2h14M38 16V2h14"/><path stroke="#a0a0a0" d="M2 16h14V2M20 16h14V2M38 16h14V2"/><path fill="none" stroke="#f4f4f4" stroke-width="2" d="M6 13h8M24 6h8v8h-8zM42 6l8 8m0-8-8 8"/><path fill="none" stroke="#808080" stroke-width="2" d="M5 12h8M23 5h8v8h-8zM41 5l8 8m0-8-8 8"/></svg>';
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function buildIconStyles(theme, rule) {
  const css = [];
  for (const role of ICON_ROLES) {
    css.push(rule(`[data-surface-glyph-v1="${role}"]`, {
      'mask-image': 'none', '-webkit-mask-image': 'none', 'background-color': 'transparent',
      'background-image': iconImage(theme, role), 'background-size': 'contain', 'background-position': 'center', 'background-repeat': 'no-repeat'
    }));
  }
  // Only unused ::before slots are annotated. Existing site pseudo-icons survive.
  if (theme.icons.headings) for (const role of ['document', 'section']) {
    css.push(rule(`[data-surface-heading-glyph-v1="${role}"]::before`, {
      content: '""', display: 'inline-block', width: '0.85em', height: '0.85em', 'margin-inline-end': '0.35em', 'vertical-align': '-0.05em',
      'background-image': iconImage(theme, role), 'background-size': 'contain', 'background-repeat': 'no-repeat'
    }));
  }
  return css;
}
