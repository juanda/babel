const { getDb } = require('../database/db');
const { finishReadingSchema, parseSchema } = require('./validators');

function startReading(bookId) {
  const exists = getDb().prepare('SELECT id FROM books WHERE id = ?').get(bookId);
  if (!exists) {
    throw new Error('Libro no encontrado');
  }

  const today = new Date().toISOString().split('T')[0];
  getDb().prepare("UPDATE books SET read_status='reading', updated_at=CURRENT_TIMESTAMP WHERE id = ?").run(bookId);

  const activeEntry = getDb()
    .prepare('SELECT id FROM reading_history WHERE book_id = ? AND finish_date IS NULL ORDER BY id DESC LIMIT 1')
    .get(bookId);
  if (!activeEntry) {
    getDb().prepare('INSERT INTO reading_history (book_id, start_date) VALUES (?, ?)').run(bookId, today);
  }

  return { book_id: bookId, read_status: 'reading' };
}

function finishReading(bookId, input = {}) {
  const data = parseSchema(finishReadingSchema, input);
  const today = new Date().toISOString().split('T')[0];
  const finishDate = data.finish_date || today;

  const tx = getDb().transaction(() => {
    getDb()
      .prepare(
        `UPDATE books
         SET read_status='completed', rating=COALESCE(@rating, rating), updated_at=CURRENT_TIMESTAMP
         WHERE id=@bookId`
      )
      .run({ bookId, rating: data.rating });

    const active = getDb()
      .prepare('SELECT id FROM reading_history WHERE book_id = ? AND finish_date IS NULL ORDER BY id DESC LIMIT 1')
      .get(bookId);

    if (active) {
      getDb()
        .prepare('UPDATE reading_history SET finish_date = @finish_date, rating=@rating, review=@review WHERE id = @id')
        .run({ id: active.id, finish_date: finishDate, rating: data.rating, review: data.review });
    } else {
      getDb()
        .prepare(
          `INSERT INTO reading_history (book_id, start_date, finish_date, rating, review)
           VALUES (@book_id, @start_date, @finish_date, @rating, @review)`
        )
        .run({ book_id: bookId, start_date: finishDate, finish_date: finishDate, rating: data.rating, review: data.review });
    }
  });

  tx();
  return { book_id: bookId, read_status: 'completed', rating: data.rating || null };
}

function getHistory(bookId = null) {
  if (bookId) {
    return getDb()
      .prepare(
        `SELECT rh.*, b.title AS book_title
         FROM reading_history rh
         JOIN books b ON b.id = rh.book_id
         WHERE rh.book_id = ?
         ORDER BY rh.created_at DESC`
      )
      .all(bookId);
  }

  return getDb()
    .prepare(
      `SELECT rh.*, b.title AS book_title
       FROM reading_history rh
       JOIN books b ON b.id = rh.book_id
       ORDER BY rh.created_at DESC`
    )
    .all();
}

function getStatistics() {
  const totals = getDb()
    .prepare(
      `SELECT
        COUNT(*) AS total_sessions,
        COUNT(CASE WHEN finish_date IS NOT NULL THEN 1 END) AS finished_sessions,
        ROUND(AVG(rating), 2) AS avg_rating
      FROM reading_history`
    )
    .get();

  const byMonth = getDb()
    .prepare(
      `SELECT substr(finish_date, 1, 7) AS month, COUNT(*) AS count
       FROM reading_history
       WHERE finish_date IS NOT NULL
       GROUP BY substr(finish_date, 1, 7)
       ORDER BY month DESC
       LIMIT 12`
    )
    .all();

  return {
    ...totals,
    by_month: byMonth.reverse(),
  };
}

module.exports = { startReading, finishReading, getHistory, getStatistics };
