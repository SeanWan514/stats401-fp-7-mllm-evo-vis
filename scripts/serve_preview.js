/* Dependency-free local preview. Run: node scripts/serve_preview.js [port] */
'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2] || 8769);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Usage: node scripts/serve_preview.js [port from 1 to 65535]');
  process.exit(1);
}
const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8',
  '.md':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.png':'image/png'};
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/final.html' : pathname));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      response.writeHead(403).end('Outside preview directory');
      return;
    }
    const content = await fs.readFile(file);
    response.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400).end('File unavailable');
  }
}).on('error', error => {console.error(error.message); process.exitCode = 1;})
  .listen(port, '127.0.0.1', () => console.log(`Open http://127.0.0.1:${port}/final.html (Ctrl+C to stop)`));
