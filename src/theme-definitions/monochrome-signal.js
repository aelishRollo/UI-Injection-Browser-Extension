const ink = color => ({ color, '-webkit-text-fill-color': color });

export function createMonochromeSignalTheme() {
  const theme = {
    version: 1, id: 'monochrome-signal', name: 'Monochrome Signal', scheme: 'dark',
    description: 'Engineered black and white with coral signals.',
    colors: {
      background: '#050505', surface: '#101313', raised: '#292d2d', control: '#f2f2f2',
      text: '#f2f2f2', muted: '#b9c0bf', line: '#626968', accent: '#f03d3d',
      accentText: '#090909', link: '#ff7777', error: '#ff7b92', success: '#91dfb9', warning: '#ffd488'
    },
    font: 'Arial, Helvetica, sans-serif',
    headingFont: 'Arial, Helvetica, sans-serif',
    border: '1px', radius: '10px', weight: '600',
    assets: [], icons: { style: 'line', ink: '#f03d3d', headings: false }
  };

  return { ...theme, treatments: {
    prelude: [
      { target: 'page', declarations: {
        'background-image': 'repeating-linear-gradient(90deg,transparent 0 159px,rgba(255,255,255,.055) 159px 160px)',
        'background-size': '160px 100%'
      } },
      { target: 'themedHeading', declarations: {
        'letter-spacing': '-0.045em', 'line-height': '1.04', 'text-shadow': 'none'
      } },
      { target: 'surface', declarations: {
        'background-image': 'none', 'border-color': theme.colors.line,
        'box-shadow': 'none'
      } },
      { target: 'surfaceHover', declarations: {
        'border-color': theme.colors.accent, 'box-shadow': 'inset 0 -3px 0 rgba(240,61,61,.9)'
      } },
      { target: 'chrome', declarations: {
        'background-color': theme.colors.background, 'border-color': theme.colors.line,
        'box-shadow': 'inset 0 -1px 0 #626968',
        'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      } },
      { target: 'control', declarations: {
        ...ink(theme.colors.accentText), '--surface-control-ink-v1': theme.colors.accentText,
        'border-color': theme.colors.control, 'border-radius': '999px',
        'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        'font-weight': '600', 'letter-spacing': '.055em',
        'text-transform': 'uppercase', 'box-shadow': 'none'
      } },
      { target: 'controlHover', declarations: {
        ...ink(theme.colors.accentText), '--surface-control-ink-v1': theme.colors.accentText,
        'background-color': theme.colors.accent, 'border-color': theme.colors.accent
      } },
      { target: 'controlActive', declarations: { transform: 'translateY(1px)' } },
      { target: 'link', declarations: {
        'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        'text-decoration-line': 'underline',
        'text-decoration-thickness': '1px', 'text-underline-offset': '.24em'
      } },
      { target: 'linkHover', declarations: {
        ...ink('#ff9191'), 'text-decoration-color': '#ff9191'
      } },
      { target: 'selection', declarations: {
        color: theme.colors.accentText, 'background-color': theme.colors.accent
      } }
    ],
    motifs: [],
    purposes: {
      reading: {
        'background-color': theme.colors.surface, 'background-image': 'none',
        border: `1px solid ${theme.colors.line}`, 'border-radius': '0', 'box-shadow': 'none'
      },
      section: {
        'background-color': 'transparent', 'background-image': 'none',
        border: '0', 'border-radius': '0', 'box-shadow': 'none'
      },
      panel: {
        'background-color': theme.colors.raised,
        'background-image': 'linear-gradient(145deg,#292d2d 0%,#1b1e1e 100%)',
        border: `1px solid ${theme.colors.line}`, 'border-radius': '10px', 'box-shadow': 'none'
      },
      data: {
        'background-color': theme.colors.surface, 'background-image': 'none',
        border: `1px solid ${theme.colors.line}`, 'border-radius': '0', 'box-shadow': 'none'
      },
      'table-body': { 'background-color': theme.colors.surface, 'border-color': theme.colors.line },
      'table-header': { 'background-color': theme.colors.raised, 'border-color': theme.colors.line },
      titleAndSectionHeading: {
        'font-family': theme.headingFont, 'font-weight': theme.weight,
        'letter-spacing': '-0.045em', 'border-bottom': `1px solid ${theme.colors.line}`,
        'border-radius': '0', 'padding-bottom': '.18em'
      },
      navigation: {
        'background-color': theme.colors.background, 'background-image': 'none',
        'border-bottom': `1px solid ${theme.colors.line}`, 'box-shadow': 'none'
      },
      field: {
        ...ink(theme.colors.text), '--surface-control-ink-v1': theme.colors.text,
        'background-color': theme.colors.raised, 'background-image': 'none',
        'border-color': theme.colors.line, 'border-radius': '999px', 'box-shadow': 'none',
        'letter-spacing': 'normal', 'text-transform': 'none'
      },
      fieldFocus: { outline: `3px solid ${theme.colors.accent}`, 'outline-offset': '2px' }
    },
    dataScale: {
      colors: ['#101313', '#292d2d', '#443436', '#663638', '#89393c'],
      declarations: { 'border-color': theme.colors.line, 'box-shadow': 'none' }
    },
    postlude: [
      { target: 'controlDisabled', declarations: {
        ...ink('#b9c0bf'), '--surface-control-ink-v1': '#b9c0bf',
        'background-color': '#353939', 'border-color': '#626968', opacity: '1'
      } },
      { target: 'note', declarations: {
        'background-color': theme.colors.raised, 'border': `1px solid ${theme.colors.line}`,
        'border-left': `6px solid ${theme.colors.accent}`, 'border-radius': '0', 'box-shadow': 'none'
      } },
      { target: 'divider', declarations: {
        height: '1px', border: '0', 'background-color': theme.colors.line
      } }
    ],
    responsive: [{ query: '(max-width:520px)', rules: [
      { target: 'page', declarations: {
        'background-image': 'repeating-linear-gradient(90deg,transparent 0 79px,rgba(255,255,255,.055) 79px 80px)',
        'background-size': '80px 100%'
      } },
      { target: 'control', declarations: { 'letter-spacing': '.03em' } }
    ] }]
  } };
}
