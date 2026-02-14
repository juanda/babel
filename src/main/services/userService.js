const { getDb } = require('../database/db');
const { userSchema, parseSchema } = require('./validators');

function getAll() {
  return getDb().prepare('SELECT * FROM users ORDER BY name COLLATE NOCASE').all();
}

function getById(id) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
}

function create(input) {
  const data = parseSchema(userSchema, input);
  const result = getDb()
    .prepare(
      `INSERT INTO users (name, email, phone, address, notes, trust_level, active)
       VALUES (@name, @email, @phone, @address, @notes, @trust_level, @active)`
    )
    .run(data);
  return getById(result.lastInsertRowid);
}

function update(id, input) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Usuario no encontrado');
  }

  const data = parseSchema(userSchema, { ...existing, ...input });
  getDb()
    .prepare(
      `UPDATE users
       SET name=@name, email=@email, phone=@phone, address=@address,
           notes=@notes, trust_level=@trust_level, active=@active,
           updated_at=CURRENT_TIMESTAMP
       WHERE id=@id`
    )
    .run({ ...data, id });

  return getById(id);
}

function remove(id) {
  const activeLoans = getDb()
    .prepare("SELECT COUNT(*) AS count FROM loans WHERE user_id = ? AND status IN ('active','overdue')")
    .get(id);
  if (activeLoans?.count > 0) {
    throw new Error('No puedes eliminar un usuario con préstamos activos');
  }

  getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  return true;
}

function search(query) {
  const q = `%${(query || '').trim()}%`;
  if (!q || q === '%%') return [];
  return getDb()
    .prepare(
      `SELECT * FROM users
       WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY name COLLATE NOCASE
       LIMIT 20`
    )
    .all(q, q, q);
}

module.exports = { getAll, getById, create, update, remove, search };
