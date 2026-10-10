export function createTerminalVisionTheme() {
  const theme = {
    version: 1, id: 'terminal-vision', name: 'Terminal Vision', scheme: 'dark',
    description: 'Phosphor green, a quiet grid, electric edges.',
    colors: { background: '#06110b', surface: '#091a11', raised: '#102d1d', text: '#9dffb0', muted: '#86c796', line: '#4f8a61', accent: '#d7ff4e', accentText: '#06110b', link: '#d7ff4e', error: '#ff9595', success: '#9dffb0', warning: '#ffe68a' },
    font: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFont: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    border: '1px', radius: '0', weight: '800',
    assets: [], icons: { style: 'line', ink: '#9dffb0', headings: false }
  };
  return { ...theme, treatments: {
    prelude: [
      { target: 'page', declarations: { 'background-image': 'repeating-linear-gradient(0deg,transparent 0 3px,rgba(157,255,176,.035) 3px 4px)' } },
      { target: 'themedHeading', declarations: { 'text-shadow': '0 0 12px rgba(157,255,176,.5)' } },
      { target: 'surface', declarations: { 'background-image': 'repeating-linear-gradient(90deg,transparent 0 12px,rgba(157,255,176,.055) 12px 13px),repeating-linear-gradient(0deg,transparent 0 12px,rgba(157,255,176,.04) 12px 13px)', 'box-shadow': 'inset 0 0 26px rgba(0,0,0,.28),0 0 18px rgba(157,255,176,.1)' } },
      { target: 'controlAndLinkHover', declarations: { 'text-shadow': '0 0 9px rgba(215,255,78,.75)', 'box-shadow': '0 0 12px rgba(215,255,78,.18)' } }
    ],
    motifs: [],
    purposes: {
      reading: { 'background-color': theme.colors.surface, color: theme.colors.text },
      section: { 'background-color': 'transparent', border: '0', 'box-shadow': 'none', 'background-image': 'none' },
      data: { 'background-color': theme.colors.surface, color: theme.colors.text },
      'table-body': { 'background-color': theme.colors.surface, 'border-color': theme.colors.line },
      'table-header': { 'background-color': theme.colors.raised, 'border-color': theme.colors.line }
    },
    dataScale: {
      colors: ['#102d1d','#176244','#2f9e55','#7eea94','#d7ff4e'],
      declarations: { 'border-color': '#06110b', 'box-shadow': 'inset 0 0 0 1px rgba(157,255,176,.12)' }
    },
    navigationFade: theme.colors.surface,
    postlude: [], responsive: []
  } };
}
