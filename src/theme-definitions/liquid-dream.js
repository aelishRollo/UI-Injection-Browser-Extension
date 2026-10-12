const LIQUID_SURFACE = 'linear-gradient(135deg,#2c1c45 0%,#211936 52%,#1a2948 100%)';
const LIQUID_PANEL = 'linear-gradient(130deg,#35204f 0%,#22284d 100%)';
const LIQUID_HEADING = 'linear-gradient(100deg,#5b247d 0%,#423a8c 52%,#176579 100%)';
const LIQUID_NAV = 'linear-gradient(110deg,#3a2058 0%,#242550 52%,#173b51 100%)';
const LIQUID_RAINBOW = 'linear-gradient(90deg,#ff78bb 0%,#ffc56b 24%,#b7ec92 48%,#67e0e8 72%,#b692ff 100%)';
const ink = color => ({ color, '-webkit-text-fill-color': color });

export function createLiquidDreamTheme() {
  const theme = {
    version: 1, id: 'liquid-dream', name: 'Liquid Dream', scheme: 'dark',
    description: 'Iridescent color on deep violet glass.',
    colors: {
      background: '#100c22', surface: '#211936', raised: '#3b2b55', control: '#30234e',
      text: '#f9f4ff', muted: '#d5c5ea', line: '#78648f', accent: '#ee8bff',
      accentText: '#1b1030', link: '#83e8f1', error: '#ff8baf', success: '#8ce9c8', warning: '#f5d47e'
    },
    font: 'Georgia, "Times New Roman", serif', headingFont: 'Georgia, "Times New Roman", serif',
    border: '1px', radius: '22px', weight: '700',
    assets: [], icons: { style: 'flow', ink: '#83e8f1', headings: true }
  };
  return { ...theme, treatments: {
    motifs: [
      { target: 'page', declarations: { 'background-image': 'none' } },
      { target: 'themedHeading', declarations: { 'letter-spacing': '-0.045em', 'text-shadow': '0 2px 14px rgba(10,4,28,.35)' } },
      { target: 'surface', declarations: { 'background-color': theme.colors.surface, 'background-image': LIQUID_SURFACE, 'border-color': theme.colors.line, 'box-shadow': 'none' } },
      { target: 'surfaceHover', declarations: { 'border-color': '#bc91e8', 'box-shadow': 'none' } },
      { target: 'control', declarations: { 'font-family': 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', 'border-color': '#b18acb', 'border-radius': '999px', 'box-shadow': 'inset 0 1px 0 rgba(255,255,255,.16)' } },
      { target: 'controlHover', declarations: { ...ink(theme.colors.accentText), '--surface-control-ink-v1': theme.colors.accentText, 'background-color': theme.colors.accent, 'background-image': LIQUID_RAINBOW, 'border-color': theme.colors.accent } },
      { target: 'linkHover', declarations: { ...ink('#ffa3de'), 'text-decoration-thickness': '2px', 'text-shadow': '0 0 12px rgba(255,125,208,.35)' } },
      { target: 'selection', declarations: { color: theme.colors.accentText, 'background-color': theme.colors.link } }
    ],
    purposes: {
      reading: { 'background-color': theme.colors.surface, 'background-image': 'none', border: '1px solid #8f73ae', 'border-radius': '18px', 'box-shadow': 'none' },
      section: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0', 'background-color': 'transparent', border: '0' },
      panel: { 'background-color': theme.colors.surface, 'background-image': LIQUID_PANEL, border: '1px solid #a779c6', 'box-shadow': 'none', 'border-radius': '18px' },
      data: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '8px', 'background-color': theme.colors.surface, border: `1px solid ${theme.colors.line}` },
      'table-body': { 'background-color': theme.colors.surface, 'border-color': theme.colors.line },
      'table-header': { 'background-color': theme.colors.raised, 'border-color': theme.colors.line },
      titleAndSectionHeading: { ...ink(theme.colors.text), 'background-color': theme.colors.surface, 'background-image': `${LIQUID_RAINBOW},${LIQUID_HEADING}`, 'background-size': '100% 3px,100% 100%', 'background-position': 'bottom,center', 'background-repeat': 'no-repeat', 'border-bottom': '0', 'border-radius': '9px', 'letter-spacing': '-0.025em' },
      'section-heading': { 'background-image': LIQUID_HEADING, 'background-size': 'auto', 'background-position': '0% 0%', 'background-repeat': 'repeat', 'border-bottom': '2px solid #83e8f1' },
      navigation: { 'background-color': theme.colors.surface, 'background-image': LIQUID_NAV, 'box-shadow': 'inset 0 -2px 0 rgba(131,232,241,.48)' },
      field: { ...ink(theme.colors.text), '--surface-control-ink-v1': theme.colors.text, 'background-color': '#18122d', 'background-image': 'none', 'border-color': theme.colors.line, 'box-shadow': 'inset 0 2px 5px rgba(0,0,0,.26)' }
    },
    postlude: [
      { target: 'note', declarations: { 'background-color': theme.colors.raised, 'border-left': `4px solid ${theme.colors.accent}`, 'border-radius': '8px' } },
      { target: 'divider', declarations: { 'border-color': theme.colors.line } }
    ], responsive: []
  } };
}
