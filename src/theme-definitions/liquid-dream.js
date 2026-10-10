const LIQUID_WASH = 'linear-gradient(90deg,rgba(255,198,226,.58) 0%,rgba(255,229,163,.58) 24%,rgba(255,242,166,.54) 40%,rgba(163,236,218,.56) 60%,rgba(184,217,255,.58) 80%,rgba(223,197,255,.62) 100%)';
const LIQUID_SURFACE = 'linear-gradient(135deg,#fff1f7 0%,#fffdf8 48%,#f0fff9 100%)';
const ink = color => ({ color, '-webkit-text-fill-color': color });

export function createLiquidDreamTheme() {
  const theme = {
    version: 1, id: 'liquid-dream', name: 'Liquid Dream', scheme: 'light',
    description: 'Pastel currents, soft serif type, fluid surfaces.',
    colors: { background: '#f8f1e7', surface: '#fff9f1', raised: '#d9f5ef', text: '#201928', muted: '#51465c', line: '#9b859e', accent: '#ff6ab7', accentText: '#201928', link: '#274bb5', error: '#a01755', success: '#176244', warning: '#745000' },
    font: 'Georgia, "Times New Roman", serif', headingFont: 'Georgia, "Times New Roman", serif',
    border: '1px', radius: '28px', weight: '700',
    assets: [], icons: { style: 'flow', ink: '#342647', headings: true }
  };
  return { ...theme, treatments: {
    motifs: [
      { target: 'page', declarations: { 'background-image': 'none' } },
      { target: 'themedHeading', declarations: { ...ink('#4b235d'), 'letter-spacing': '-0.045em', 'text-shadow': '0 2px 0 rgba(255,255,255,.58)' } },
      { target: 'surface', declarations: { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', 'border-color': '#b9a5c2', 'box-shadow': '0 16px 42px rgba(78,64,104,.13)' } },
      { target: 'surfaceHover', declarations: { 'border-color': '#8f6da0', 'box-shadow': '0 20px 48px rgba(78,64,104,.19)' } },
      { target: 'control', declarations: { 'font-family': 'system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', 'border-radius': '999px', 'box-shadow': 'inset 0 1px 0 rgba(255,255,255,.8),0 12px 26px rgba(78,64,104,.12)' } },
      { target: 'controlHover', declarations: { 'background-image': LIQUID_WASH, 'border-color': '#7d5e8e' } },
      { target: 'linkHover', declarations: { ...ink('#8b245e'), 'text-decoration-thickness': '2px', 'text-shadow': '0 2px 12px rgba(255,106,183,.28)' } },
      { target: 'selection', declarations: { color: '#201928', 'background-color': '#a3ecda' } }
    ],
    purposes: {
      reading: { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', border: '1px solid #b5a0bd', 'border-radius': '18px', 'box-shadow': '0 12px 32px rgba(78,64,104,.12)' },
      section: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0', 'background-color': 'transparent', border: '0' },
      panel: { 'background-color': '#fff9f1', 'background-image': LIQUID_SURFACE, 'background-size': '100% 100%', border: '1px solid #a98bb5', 'box-shadow': '0 8px 24px rgba(78,64,104,.16)', 'border-radius': '16px' },
      data: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0', 'background-color': '#fff9f1', border: '1px solid #9b859e' },
      'table-body': { 'background-color': theme.colors.surface, 'border-color': theme.colors.line },
      'table-header': { 'background-color': theme.colors.raised, 'border-color': theme.colors.line },
      titleAndSectionHeading: { ...ink('#4b235d'), 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'border-bottom': '2px solid #8f6da0', 'border-radius': '8px', 'letter-spacing': '-0.025em' },
      navigation: { 'background-color': '#fff9f1', 'background-image': LIQUID_WASH, 'box-shadow': 'inset 0 -1px rgba(110,83,137,.36)' },
      field: { 'background-color': '#fff9f1', 'background-image': 'none', 'box-shadow': 'inset 0 1px 3px rgba(78,64,104,.18)' }
    },
    postlude: [], responsive: []
  } };
}
