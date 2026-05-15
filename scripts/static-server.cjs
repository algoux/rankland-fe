/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 极简静态文件服务器，专用于 E2E 测试。
 * - /dist/* -> 映射到本地 dist 目录
 * - 其余路径 -> 返回 dist/index.html （SPA 路由 fallback）
 * 不依赖 SSR / Redis，由 Playwright 自动启动。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 4321);

const mimeTypes = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.html': 'text/html; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end(`Not Found: ${filePath}`);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': mimeTypes[ext] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath.startsWith('/dist/')) {
    const rel = urlPath.slice('/dist/'.length);
    const filePath = path.join(root, rel);
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'content-type': 'text/plain' });
      res.end('Forbidden');
      return;
    }
    serveFile(res, filePath);
    return;
  }
  // SPA fallback
  serveFile(res, path.join(root, 'index.html'));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[e2e-static-server] listening on http://127.0.0.1:${port} (root=${root})`);
});
