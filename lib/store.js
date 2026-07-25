/* Persistence for the 串接進度 checklist.
 *
 * Primary: PostgreSQL (Zeabur `postgresql-unbed`, same project/env as this service),
 * tables prefixed `handoff_` so they don't collide with career-quest's tables.
 * Fallback: a local JSON file — used for `node server.js` on a laptop, and as a
 * safety net so the page still works if the DB is unreachable. The active mode is
 * reported to the client (`storage` in /api/state) and surfaced in the UI, so a
 * silent downgrade to the ephemeral file store is visible instead of invisible.
 */
const fs = require('fs');
const path = require('path');

const FILE = process.env.HANDOFF_STATE_FILE || path.join(process.env.DATA_DIR || __dirname, '..', '.handoff-state.json');
const DATABASE_URL = process.env.DATABASE_URL || '';

let mode = 'file';
let pool = null;

/* ---------------- file fallback ---------------- */

function fileRead() {
  try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch (e) { return { items: {}, notes: [], nextNoteId: 1 }; }
}
function fileWrite(data) {
  try { fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); }
  catch (e) { console.error('[store] file write failed:', e.message); }
}

/* ---------------- init ---------------- */

async function init() {
  if (!DATABASE_URL) { mode = 'file'; return 'file store (no DATABASE_URL)'; }
  let Pool;
  try { ({ Pool } = require('pg')); }
  catch (e) { mode = 'file'; return 'file store (pg module missing)'; }

  pool = new Pool({ connectionString: DATABASE_URL, max: 4, connectionTimeoutMillis: 8000 });
  pool.on('error', (e) => console.error('[store] pool error:', e.message));
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS handoff_item_status (
        item_id    text PRIMARY KEY,
        status     text NOT NULL,
        updated_by text,
        updated_at timestamptz NOT NULL DEFAULT now()
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS handoff_notes (
        id         serial PRIMARY KEY,
        item_id    text NOT NULL,
        body       text NOT NULL,
        author     text,
        kind       text NOT NULL DEFAULT 'note',
        resolved   boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS handoff_notes_item_idx ON handoff_notes (item_id)`);
    mode = 'pg';
    return 'postgres';
  } catch (e) {
    console.error('[store] postgres init failed, falling back to file:', e.message);
    mode = 'file';
    pool = null;
    return `file store (postgres failed: ${e.message})`;
  }
}

/* ---------------- reads ---------------- */

async function getState() {
  if (mode === 'pg') {
    try {
      const [s, n] = await Promise.all([
        pool.query('SELECT item_id, status, updated_by, updated_at FROM handoff_item_status'),
        pool.query('SELECT id, item_id, body, author, kind, resolved, created_at FROM handoff_notes ORDER BY id ASC'),
      ]);
      const items = {};
      s.rows.forEach((r) => { items[r.item_id] = { status: r.status, by: r.updated_by, at: r.updated_at }; });
      const notes = n.rows.map((r) => ({
        id: r.id, itemId: r.item_id, body: r.body, author: r.author,
        kind: r.kind, resolved: r.resolved, at: r.created_at,
      }));
      return { storage: 'pg', items, notes };
    } catch (e) {
      console.error('[store] read failed:', e.message);
      return { storage: 'error', items: {}, notes: [], error: e.message };
    }
  }
  const d = fileRead();
  return { storage: 'file', items: d.items, notes: d.notes };
}

/* ---------------- writes ---------------- */

async function setStatus(itemId, status, by) {
  const at = new Date().toISOString();
  if (mode === 'pg') {
    await pool.query(
      `INSERT INTO handoff_item_status (item_id, status, updated_by, updated_at)
       VALUES ($1,$2,$3, now())
       ON CONFLICT (item_id) DO UPDATE SET status = EXCLUDED.status,
                                           updated_by = EXCLUDED.updated_by,
                                           updated_at = now()`,
      [itemId, status, by]
    );
    return { itemId, status, by, at };
  }
  const d = fileRead();
  d.items[itemId] = { status, by, at };
  fileWrite(d);
  return { itemId, status, by, at };
}

async function addNote(itemId, body, author, kind) {
  if (mode === 'pg') {
    const r = await pool.query(
      `INSERT INTO handoff_notes (item_id, body, author, kind)
       VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
      [itemId, body, author, kind]
    );
    return { id: r.rows[0].id, itemId, body, author, kind, resolved: false, at: r.rows[0].created_at };
  }
  const d = fileRead();
  const id = d.nextNoteId || (d.notes.length + 1);
  const note = { id, itemId, body, author, kind, resolved: false, at: new Date().toISOString() };
  d.notes.push(note);
  d.nextNoteId = id + 1;
  fileWrite(d);
  return note;
}

async function resolveNote(id, resolved) {
  if (mode === 'pg') {
    await pool.query('UPDATE handoff_notes SET resolved = $2 WHERE id = $1', [id, !!resolved]);
    return;
  }
  const d = fileRead();
  const note = d.notes.find((x) => x.id === id);
  if (note) { note.resolved = !!resolved; fileWrite(d); }
}

module.exports = { init, getState, setStatus, addNote, resolveNote };
