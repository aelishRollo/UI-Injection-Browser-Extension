import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function serveFixtures(port = 4173) {
  const root = resolve('tests/fixtures');
  const server = http.createServer(async (req, res) => {
    try {
      let pathname = new URL(req.url, 'http://localhost').pathname;
      if (['/', '/next'].includes(pathname)) pathname = '/index.html';
      const file = resolve(root, '.' + pathname);
      if (!file.startsWith(root + sep)) throw new Error('Invalid path');
      const body = await readFile(file);
      res.setHeader('Content-Type', { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[extname(file)] || 'application/octet-stream');
      res.end(body);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  const remote = http.createServer((_req, res) => {
    res.setHeader('Content-Type', 'text/css');
    // Intentionally no CORS header: exercises the extension stylesheet fetch bridge.
    res.end('.remote-surface{background:#f7eeee;color:#661122}');
  });
  await Promise.all([new Promise(r => server.listen(port, '127.0.0.1', r)), new Promise(r => remote.listen(port + 1, '127.0.0.1', r))]);
  return { url: `http://127.0.0.1:${port}`, close: () => Promise.all([new Promise(r => server.close(r)), new Promise(r => remote.close(r))]) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = await serveFixtures();
  console.log(`Fixture running at ${server.url}. Enable the extension there to preview themes.`);
}
