import { build } from 'esbuild';
import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { THEMES } from '../src/themes.js';
import { buildStyles } from '../src/styles.js';

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('extension', 'dist', { recursive: true });
const options = { bundle: true, target: 'chrome120', sourcemap: true, legalComments: 'eof' };
await Promise.all([
  build({ ...options, entryPoints: ['src/content.js'], outfile: 'dist/content.js', format: 'iife' }),
  build({ ...options, entryPoints: ['src/background.js'], outfile: 'dist/background.js', format: 'esm' }),
  build({ ...options, entryPoints: ['src/popup.js'], outfile: 'dist/popup.js', format: 'esm' })
]);
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
await writeFile('dist/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await Promise.all(Object.values(THEMES).map(theme => writeFile(
  `dist/startup-${theme.id}.css`,
  `:root{--surface-startup-theme:${theme.id}}\n` +
  `:root:not([data-surface-ready-v2]){--surface-startup-background:${theme.colors.background};--surface-startup-color-scheme:${theme.scheme}}\n` +
  buildStyles(theme, { startup: true }) + '\n'
)));
await cp('docs/ASSETS.md', 'dist/ASSETS.md');
console.log('Built dist/ — load this folder as an unpacked Chromium extension.');
