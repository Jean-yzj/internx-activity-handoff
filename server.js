// Static preview server for the handoff mockup + a tiny persistence API for the
// 串接進度 checklist (/checklist). Everything except the checklist stays static.
// Usage: node server.js   →   http://localhost:4178
const http = require('http');
const fs = require('fs');
const path = require('path');
const store = require('./lib/store');

const PORT = process.env.PORT || 4178;
const ROOT = __dirname;
// Optional shared passcode for WRITES (reads are always open). Unset = open writes.
const WRITE_KEY = process.env.HANDOFF_KEY || '';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.json': 'application/json',
};

const STATUSES = ['todo', 'doing', 'done', 'blocked'];

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 64 * 1024) { reject(new Error('payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(new Error('invalid json')); }
    });
    req.on('error', reject);
  });
}

function authed(req, body) {
  if (!WRITE_KEY) return true;
  const given = req.headers['x-handoff-key'] || (body && body.key) || '';
  return String(given) === WRITE_KEY;
}

const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

async function api(req, res, urlPath) {
  if (req.method === 'GET' && urlPath === '/api/state') {
    const state = await store.getState();
    return json(res, 200, { ...state, writeProtected: !!WRITE_KEY });
  }

  if (req.method === 'POST' && urlPath === '/api/check-key') {
    const body = await readBody(req);
    const ok = authed(req, body);
    return json(res, ok ? 200 : 403, { ok });
  }

  if (req.method === 'POST' && urlPath === '/api/status') {
    const body = await readBody(req);
    if (!authed(req, body)) return json(res, 403, { error: 'bad_key' });
    const itemId = str(body.itemId, 80);
    const status = str(body.status, 16);
    const by = str(body.by, 40) || '匿名';
    if (!itemId || !STATUSES.includes(status)) return json(res, 400, { error: 'bad_input' });
    const item = await store.setStatus(itemId, status, by);
    return json(res, 200, { ok: true, item });
  }

  if (req.method === 'POST' && urlPath === '/api/assignee') {
    const body = await readBody(req);
    if (!authed(req, body)) return json(res, 403, { error: 'bad_key' });
    const itemId = str(body.itemId, 80);
    const assignee = str(body.assignee, 40);   // 空字串 = 取消指派
    const by = str(body.by, 40) || '匿名';
    if (!itemId) return json(res, 400, { error: 'bad_input' });
    const item = await store.setAssignee(itemId, assignee, by);
    return json(res, 200, { ok: true, item });
  }

  if (req.method === 'POST' && urlPath === '/api/note') {
    const body = await readBody(req);
    if (!authed(req, body)) return json(res, 403, { error: 'bad_key' });
    const itemId = str(body.itemId, 80) || '_general';
    const text = str(body.body, 4000);
    const author = str(body.author, 40) || '匿名';
    const kind = body.kind === 'blocker' ? 'blocker' : 'note';
    if (!text) return json(res, 400, { error: 'empty' });
    const note = await store.addNote(itemId, text, author, kind);
    return json(res, 200, { ok: true, note });
  }

  if (req.method === 'POST' && urlPath === '/api/note/resolve') {
    const body = await readBody(req);
    if (!authed(req, body)) return json(res, 403, { error: 'bad_key' });
    const id = Number(body.id);
    if (!Number.isFinite(id)) return json(res, 400, { error: 'bad_input' });
    await store.resolveNote(id, body.resolved !== false);
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'not_found' });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);

  if (p.startsWith('/api/')) {
    api(req, res, p).catch((err) => {
      console.error('[api]', p, err && err.message);
      json(res, 500, { error: 'server_error', message: String((err && err.message) || err) });
    });
    return;
  }

  if (p === '/') p = '/index.html';
  let file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  // resolve extensionless clean URLs (e.g. /creator, /blog-editor) → .html
  if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found'); }
    const ext = path.extname(file);
    // HTML/CSS/JS change every deploy — force revalidation so visitors never see a stale mockup.
    // Images rarely change, so allow a short cache.
    const cache = ['.html', '.css', '.js', '.md', '.json'].includes(ext)
      ? 'no-cache, must-revalidate'
      : 'public, max-age=3600';
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': cache });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`InternX handoff mockup → http://localhost:${PORT}`);
  store.init()
    .then((mode) => console.log(`[store] ${mode}`))
    .catch((e) => console.error('[store] init failed:', e && e.message));
});
