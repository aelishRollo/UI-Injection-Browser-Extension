import { createBrowserArcheologyTheme } from './theme-definitions/browser-archeology.js';
import { createLiquidDreamTheme } from './theme-definitions/liquid-dream.js';
import { createTerminalVisionTheme } from './theme-definitions/terminal-vision.js';

// Internal v1 authoring data, not a public package specification. The renderer
// owns recognition; independent theme modules provide declarative treatments
// for its stable roles.
export const THEMES = {
  'browser-archeology': createBrowserArcheologyTheme(),
  'liquid-dream': createLiquidDreamTheme(),
  'terminal-vision': createTerminalVisionTheme()
};
export const THEME_IDS = Object.keys(THEMES);
