const { getDb } = require('../database/db');

function getAll() {
  return getDb()
    .prepare(
      `SELECT c.*, COUNT(bc.book_id) AS book_count
       FROM collections c
       LEFT JOIN book_collections bc ON bc.collection_id = c.id
       GROUP BY c.id
       ORDER BY c.name COLLATE NOCASE`
    )
    .all();
}

function getById(id) {
  return getDb().prepare('SELECT * FROM collections WHERE id = ?').get(id) || null;
}

function create(data) {
  if (!data?.name?.trim()) {
    throw new Error('El nombre de la colección es obligatorio');
  }

  const result = getDb()
    .prepare('INSERT INTO collections (name, description, color, icon) VALUES (?, ?, ?, ?)')
    .run(data.name.trim(), data.description || null, data.color || null, data.icon || null);

  return getById(result.lastInsertRowid);
}

function update(id, data) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Colección no encontrada');
  }

  const name = data.name?.trim() || existing.name;
  getDb()
    .prepare(
      `UPDATE collections
       SET name=@name, description=@description, color=@color, icon=@icon, updated_at=CURRENT_TIMESTAMP
       WHERE id=@id`
    )
    .run({
      id,
      name,
      description: data.description ?? existing.description,
      color: data.color ?? existing.color,
      icon: data.icon ?? existing.icon,
    });

  return getById(id);
}

function remove(id) {
  getDb().prepare('DELETE FROM collections WHERE id = ?').run(id);
  return true;
}

function addBook(collectionId, bookId) {
  getDb()
    .prepare('INSERT OR IGNORE INTO book_collections (book_id, collection_id) VALUES (?, ?)')
    .run(bookId, collectionId);
  return true;
}

function removeBook(collectionId, bookId) {
  getDb()
    .prepare('DELETE FROM book_collections WHERE collection_id = ? AND book_id = ?')
    .run(collectionId, bookId);
  return true;
}

function getBooks(collectionId) {
  return getDb()
    .prepare(
      `SELECT b.*
       FROM book_collections bc
       JOIN books b ON b.id = bc.book_id
       WHERE bc.collection_id = ?
       ORDER BY b.title COLLATE NOCASE`
    )
    .all(collectionId);
}

module.exports = { getAll, getById, create, update, remove, addBook, removeBook, getBooks };
