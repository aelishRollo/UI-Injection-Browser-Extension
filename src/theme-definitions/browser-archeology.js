import { iconImage, windowControlsImage } from '../icons.js';

const ink = color => ({ color, '-webkit-text-fill-color': color });

export function createBrowserArcheologyTheme() {
  const theme = {
    version: 1, id: 'browser-archeology', name: 'Browser Archeology', scheme: 'light',
    description: 'Teal desktops, beveled buttons, classic blue links.',
    colors: { background: '#008080', surface: '#ffffff', raised: '#d4d0c8', control: '#c0c0c0', text: '#000000', muted: '#404040', line: '#808080', accent: '#000080', accentText: '#ffffff', link: '#0000ee', error: '#a01735', success: '#176244', warning: '#745000' },
    font: '"Times New Roman", Times, serif', headingFont: 'Arial, Helvetica, sans-serif',
    border: '2px', radius: '0', weight: '700',
    assets: [], icons: { style: 'pixel', ink: '#342647', headings: true }
  };
  const controls = windowControlsImage();
  return { ...theme, treatments: {
    motifs: [
      { target: 'page', declarations: { 'background-image': 'repeating-conic-gradient(rgba(255,255,255,.035) 0 25%,rgba(0,0,0,.025) 0 50%)', 'background-size': '4px 4px' } },
      { target: 'themedHeading', declarations: { ...ink('#000080'), 'letter-spacing': 'normal', 'text-shadow': 'none' } },
      { target: 'surface', declarations: { 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.35)', 'background-image': 'none' } },
      { target: 'chrome', declarations: { 'background-color': '#c0c0c0', 'background-image': 'repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 1px,transparent 1px 3px)', 'box-shadow': 'inset 0 1px #fff,inset 0 -2px #808080', 'font-family': 'Arial, Helvetica, sans-serif' } },
      { target: 'control', declarations: { 'font-family': 'Arial, Helvetica, sans-serif', 'border-color': '#ffffff #404040 #404040 #ffffff', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080' } },
      { target: 'controlActive', declarations: { 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040,inset -1px -1px #dfdfdf' } },
      { target: 'link', declarations: { 'text-decoration-line': 'underline', 'text-underline-offset': '1px' } },
      { target: 'linkHover', declarations: { ...ink('#ffffff'), 'background-color': '#000080', 'text-decoration-color': '#ffffff', 'box-shadow': '0 0 0 1px #000080' } },
      { target: 'selection', declarations: { color: '#ffffff', 'background-color': '#000080' } }
    ],
    purposes: {
      reading: { 'background-image': 'none', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.28)', 'border-radius': '0', 'background-color': '#ffffff', border: '3px solid #c0c0c0', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000' },
      section: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0', 'background-color': 'transparent', border: '0' },
      panel: { 'background-color': '#ffffff', border: '3px solid #c0c0c0', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,2px 2px 0 rgba(0,0,0,.25)', 'background-image': 'none' },
      data: { 'background-image': 'none', 'box-shadow': 'none', 'border-radius': '0', 'background-color': '#ffffff', border: '1px solid #808080' },
      'table-body': { 'background-color': theme.colors.surface, 'border-color': theme.colors.line },
      'table-header': { 'background-color': theme.colors.raised, 'border-color': theme.colors.line },
      title: { ...ink(theme.colors.accentText), 'font-family': 'Arial,Helvetica,sans-serif', 'font-size': 'clamp(20px,2.4vw,32px)', 'line-height': '1.15', 'min-height': '22px', 'padding-block': '3px', 'padding-inline': '26px 62px', 'border-bottom': '0', 'text-shadow': 'none', 'background-color': '#000080', 'background-image': `${iconImage(theme, 'document')},${controls},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '4px 3px,calc(100% - 3px) 3px,0 0', 'background-size': '18px 18px,54px 18px,100% 100%', 'background-repeat': 'no-repeat' },
      titleContents: ink(theme.colors.accentText),
      'section-heading': { 'font-family': 'Arial,Helvetica,sans-serif', 'border-bottom': '1px solid #808080', 'text-shadow': 'none' },
      navigation: { 'background-color': '#d4d0c8', 'box-shadow': 'inset 0 1px #fff,inset 0 -1px #808080', 'font-family': 'Arial,Helvetica,sans-serif' },
      field: { 'background-color': '#ffffff', 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040', 'border-radius': '0' },
      fieldFocus: { outline: '2px dotted #000000', 'outline-offset': '-4px' }
    },
    navigationFade: '#d4d0c8',
    postlude: [
      { target: 'windowOwner', declarations: { 'border-width': '3px', 'border-style': 'solid', 'border-color': '#ffffff #404040 #404040 #ffffff', outline: '1px solid #000000', 'box-shadow': 'inset 1px 1px #dfdfdf,inset -1px -1px #808080,3px 3px 0 rgba(0,0,0,.28)' } },
      { target: 'windowTitle', declarations: { 'min-height': '20px', 'margin-block': '0', 'padding-inline': '24px 60px', ...ink(theme.colors.accentText), 'font-family': 'Arial,Helvetica,sans-serif', 'font-weight': '700', 'text-shadow': 'none', 'background-color': theme.colors.accent, 'background-image': `${iconImage(theme, 'panel')},${controls},linear-gradient(90deg,#000080,#1084d0)`, 'background-position': '3px 2px,calc(100% - 2px) 2px,0 0', 'background-size': '17px 17px,54px 18px,100% 100%', 'background-repeat': 'no-repeat', 'border-color': '#000080' } },
      { target: 'windowTitleReading', declarations: { 'background-image': `${iconImage(theme, 'document')},${controls},linear-gradient(90deg,#000080,#1084d0)` } },
      { target: 'windowTitleContents', declarations: ink(theme.colors.accentText) },
      { target: 'titlePurpose', declarations: { ...ink(theme.colors.accentText), 'box-shadow': 'inset 1px 1px rgba(255,255,255,.55),inset -1px -1px rgba(0,0,0,.4)' } },
      { target: 'windowFrame', declarations: { 'padding-top': '25px', 'background-color': '#ffffff', 'background-image': `${controls},linear-gradient(90deg,#808080,#a9a9a9)`, 'background-position': 'calc(100% - 4px) 4px,4px 4px', 'background-size': '54px 18px,calc(100% - 8px) 18px', 'background-repeat': 'no-repeat' } },
      { target: 'linkVisited', declarations: { ...ink('#551a8b'), 'text-decoration-color': '#551a8b' } },
      { target: 'linkHoverFocus', declarations: { ...ink('#ff0000'), 'background-color': 'transparent', 'text-decoration-color': '#ff0000', 'box-shadow': 'none' } },
      { target: 'controlDisabled', declarations: { color: '#808080', '--surface-control-ink-v1': '#808080', 'border-style': 'solid', opacity: '1', 'text-shadow': '1px 1px #ffffff' } },
      { target: 'note', declarations: { 'background-color': '#ffffcc', border: '2px solid', 'border-color': '#808080 #ffffff #ffffff #808080', 'box-shadow': 'inset 1px 1px #404040', 'border-radius': '0' } },
      { target: 'divider', declarations: { height: '0', border: '0', 'border-top': '1px solid #808080', 'border-bottom': '1px solid #ffffff' } }
    ],
    responsive: [{ query: '(max-width:520px)', rules: [
      { target: 'windowTitle', declarations: { 'padding-inline-end': '48px', 'background-position': '3px 2px,calc(100% - 2px) 2px,0 0', 'background-size': '16px 16px,42px 14px,100% 100%' } },
      { target: 'windowFrame', declarations: { 'background-position': 'calc(100% - 4px) 4px,4px 4px', 'background-size': '42px 14px,calc(100% - 8px) 18px' } }
    ] }]
  } };
}
