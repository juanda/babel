const db = require('../database/db').getDb;
const { authorSchema, parseSchema } = require('./validators');

function getAll() {
  return db().prepare('SELECT * FROM authors ORDER BY name COLLATE NOCASE').all();
}

function getById(id) {
  return db().prepare('SELECT * FROM authors WHERE id = ?').get(id) || null;
}

function create(input) {
  const data = parseSchema(authorSchema, input);
  const stmt = db().prepare(`
    INSERT INTO authors (name, biography, birth_date, death_date, nationality, photo_url, website, notes)
    VALUES (@name, @biography, @birth_date, @death_date, @nationality, @photo_url, @website, @notes)
  `);
  const result = stmt.run(data);
  return getById(result.lastInsertRowid);
}

function update(id, input) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Autor no encontrado');
  }

  const data = parseSchema(authorSchema, { ...existing, ...input });
  db()
    .prepare(`
      UPDATE authors
      SET name=@name, biography=@biography, birth_date=@birth_date, death_date=@death_date,
          nationality=@nationality, photo_url=@photo_url, website=@website, notes=@notes,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=@id
    `)
    .run({ ...data, id });

  return getById(id);
}

function remove(id) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Autor no encontrado');
  }

  db().prepare('DELETE FROM authors WHERE id = ?').run(id);
  return true;
}

function search(query) {
  const q = `%${(query || '').trim()}%`;
  if (!q || q === '%%') return [];
  return db()
    .prepare(
      `SELECT * FROM authors
       WHERE name LIKE ? OR nationality LIKE ? OR biography LIKE ?
       ORDER BY name COLLATE NOCASE
       LIMIT 20`
    )
    .all(q, q, q);
}

module.exports = { getAll, getById, create, update, remove, search };
