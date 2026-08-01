const mysql = require('mysql2/promise');

let pool;

function config() {
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || '',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || '',
  };
}

async function getPool() {
  if (pool) return pool;
  const options = config();
  if (!options.user || !options.password || !options.database) {
    throw new Error('MySQL configuration is missing. Set MYSQL_DATABASE, MYSQL_USER, and MYSQL_PASSWORD in Hostinger.');
  }
  pool = mysql.createPool({ ...options, waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4' });
  await pool.query(`CREATE TABLE IF NOT EXISTS app_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    document JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  await pool.query(`CREATE TABLE IF NOT EXISTS app_projects (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,
    document JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  return pool;
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const same = (a, b) => String(a) === String(b);
function matches(doc, query) {
  return Object.entries(query).every(([key, value]) => {
    if (key === '_id') return same(doc._id, value);
    if (key === 'user_id') return same(doc.user_id, value);
    if (key === 'email') return doc.email === value;
    if (key === 'columns._id') return (doc.columns || []).some((c) => same(c._id, value));
    if (key === 'columns.tasks._id') return (doc.columns || []).some((c) => (c.tasks || []).some((t) => same(t._id, value)));
    if (key === 'collaborators') return (doc.collaborators || []).some((c) => same(c.user_id, value.$elemMatch?.user_id));
    return true;
  });
}
async function all(type) {
  const db = await getPool();
  const table = type === 'users' ? 'app_users' : 'app_projects';
  const [rows] = await db.query(`SELECT document FROM ${table}`);
  return rows.map((r) => typeof r.document === 'string' ? JSON.parse(r.document) : r.document);
}
async function save(type, doc) {
  const db = await getPool();
  const json = JSON.stringify(doc);
  if (type === 'users') await db.execute('REPLACE INTO app_users (id,email,document) VALUES (?,?,?)', [doc._id, doc.email, json]);
  else await db.execute('REPLACE INTO app_projects (id,owner_id,document) VALUES (?,?,?)', [doc._id, doc.user_id, json]);
}
class Cursor {
  constructor(type, query) { this.type = type; this.query = query; this.direction = 0; }
  sort(spec) { this.direction = spec.created_at || 0; return this; }
  async toArray() { const rows = (await all(this.type)).filter((d) => matches(d, this.query)); if (this.direction) rows.sort((a,b) => this.direction < 0 ? String(b.created_at).localeCompare(String(a.created_at)) : String(a.created_at).localeCompare(String(b.created_at))); return rows; }
}
class Collection {
  constructor(type) { this.type = type; }
  async createIndex() { return true; }
  async findOne(query) { return (await all(this.type)).find((d) => matches(d, query)) || null; }
  find(query) { return new Cursor(this.type, query); }
  async insertOne(doc) { await save(this.type, clone(doc)); return { insertedId: doc._id }; }
  async replaceOne(query, doc) { const old = await this.findOne(query); if (!old) return { matchedCount: 0 }; await save(this.type, clone(doc)); return { matchedCount: 1 }; }
  async deleteOne(query) { const doc = await this.findOne(query); if (!doc) return { deletedCount: 0 }; const db = await getPool(); await db.execute(`DELETE FROM ${this.type === 'users' ? 'app_users' : 'app_projects'} WHERE id=?`, [doc._id]); return { deletedCount: 1 }; }
  async updateOne(query, update) {
    const doc = await this.findOne(query); if (!doc) return { matchedCount: 0 };
    for (const [key, value] of Object.entries(update.$set || {})) {
      if (key === 'columns.$.name') { const c = doc.columns.find((x) => same(x._id, query['columns._id'])); if (c) c.name = value; }
      else doc[key] = value;
    }
    for (const [key, value] of Object.entries(update.$push || {})) {
      if (key === 'collaborators') (doc.collaborators ||= []).push(value);
      if (key === 'columns') (doc.columns ||= []).push(value);
      if (key === 'columns.$.tasks') { const c = doc.columns.find((x) => same(x._id, query['columns._id'])); if (c) (c.tasks ||= []).push(value); }
    }
    if (update.$pull?.columns) doc.columns = doc.columns.filter((c) => !same(c._id, update.$pull.columns._id));
    await save(this.type, doc); return { matchedCount: 1 };
  }
}
async function getDb() {
  await getPool();
  return { collection: (name) => new Collection(name === 'users' ? 'users' : 'projects'), command: async () => { await (await getPool()).query('SELECT 1'); } };
}
async function checkDatabase() { await (await getPool()).query('SELECT 1'); return true; }

module.exports = { getDb, checkDatabase, config };
