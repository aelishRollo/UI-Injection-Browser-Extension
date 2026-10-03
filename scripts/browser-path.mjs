import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export async function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  if (existsSync(chromium.executablePath())) return chromium.executablePath();
  const cache = join(homedir(), 'Library/Caches/ms-playwright');
  for (const dir of (await readdir(cache).catch(() => [])).filter(d => /^chromium-\d+$/.test(d)).sort().reverse()) {
    for (const arch of ['x64', 'arm64']) {
      const candidate = join(cache, dir, `chrome-mac-${arch}/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`);
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error('Install a test browser with npx playwright install chromium, or set CHROMIUM_PATH.');
}
