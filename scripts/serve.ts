// Minimal static file server for dist/ — `npm run serve`.
//
// The live demos and editable playground load their runtimes (CodeMirror, Vue, React)
// as ES modules from our own origin. A sandboxed, null-origin iframe can only fetch those
// local modules when the response carries CORS headers, which a file:// path does not
// provide — so the built site must be viewed over http(s) locally, not by opening files
// directly. This server fills that gap (GitHub Pages does it in production). No deps:
// node:http / node:fs / node:path only, to stay runtime-portable.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = join(__dirname, '..', 'dist');
const port = Number(process.env.PORT ?? 8080);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer((req, res) => {
  let path = join(dist, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  if (!existsSync(path)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }
  // Mirror GitHub Pages, which serves assets with an open CORS header — required for the
  // null-origin demo iframes to load /assets/*.js modules.
  res.writeHead(200, {
    'content-type': MIME[extname(path)] ?? 'application/octet-stream',
    'access-control-allow-origin': '*',
  });
  res.end(readFileSync(path));
});

server.listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}/`);
});
