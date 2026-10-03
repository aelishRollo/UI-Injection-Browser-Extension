// Internal v1 authoring data, not a public package specification.
export const THEMES = {
  'browser-archeology': {
    version: 1, id: 'browser-archeology', name: 'Browser Archeology', scheme: 'light',
    description: 'Teal desktops, beveled buttons, classic blue links.',
    colors: { background: '#008080', surface: '#ffffff', raised: '#d4d0c8', control: '#c0c0c0', text: '#000000', muted: '#404040', line: '#808080', accent: '#000080', accentText: '#ffffff', link: '#0000ee', error: '#a01735', success: '#176244', warning: '#745000' },
    font: '"Times New Roman", Times, serif', headingFont: 'Arial, Helvetica, sans-serif',
    border: '2px', radius: '0', weight: '700'
  },
  'liquid-dream': {
    version: 1, id: 'liquid-dream', name: 'Liquid Dream', scheme: 'light',
    description: 'Pastel currents, soft serif type, fluid surfaces.',
    colors: { background: '#f8f1e7', surface: '#fff9f1', raised: '#d9f5ef', text: '#201928', muted: '#51465c', line: '#9b859e', accent: '#ff6ab7', accentText: '#201928', link: '#274bb5', error: '#a01755', success: '#176244', warning: '#745000' },
    font: 'Georgia, "Times New Roman", serif', headingFont: 'Georgia, "Times New Roman", serif',
    border: '1px', radius: '28px', weight: '700'
  },
  'terminal-vision': {
    version: 1, id: 'terminal-vision', name: 'Terminal Vision', scheme: 'dark',
    description: 'Phosphor green, a quiet grid, electric edges.',
    colors: { background: '#06110b', surface: '#091a11', raised: '#102d1d', text: '#9dffb0', muted: '#86c796', line: '#4f8a61', accent: '#d7ff4e', accentText: '#06110b', link: '#d7ff4e', error: '#ff9595', success: '#9dffb0', warning: '#ffe68a' },
    font: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFont: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    border: '1px', radius: '0', weight: '800'
  }
};
export const THEME_IDS = Object.keys(THEMES);
export const RENDERERS = ['simple', 'adaptive', 'contextual'];
