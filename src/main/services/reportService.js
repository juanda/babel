const { getDb } = require('../database/db');

function getDashboardMetrics() {
  const totals = getDb()
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM books) AS total_books,
        (SELECT COUNT(*) FROM authors) AS total_authors,
        (SELECT COUNT(*) FROM users WHERE active = 1) AS total_users,
        (SELECT COUNT(*) FROM loans WHERE status IN ('active', 'overdue')) AS active_loans,
        (SELECT COUNT(*) FROM loans WHERE status = 'overdue') AS overdue_loans,
        (SELECT COUNT(*) FROM books WHERE read_status = 'completed') AS completed_books`
    )
    .get();

  return totals;
}

function getGenreDistribution() {
  return getDb()
    .prepare(
      `SELECT COALESCE(NULLIF(genre, ''), 'Sin género') AS genre, COUNT(*) AS count
       FROM books
       GROUP BY COALESCE(NULLIF(genre, ''), 'Sin género')
       ORDER BY count DESC`
    )
    .all();
}

function getReadingTrend() {
  return getDb()
    .prepare(
      `SELECT substr(finish_date, 1, 7) AS month, COUNT(*) AS count
       FROM reading_history
       WHERE finish_date IS NOT NULL
       GROUP BY substr(finish_date, 1, 7)
       ORDER BY month DESC
       LIMIT 12`
    )
    .all()
    .reverse();
}

function getTopAuthors(limit = 10) {
  return getDb()
    .prepare(
      `SELECT a.id, a.name, COUNT(ba.book_id) AS book_count
       FROM authors a
       JOIN book_authors ba ON ba.author_id = a.id
       GROUP BY a.id
       ORDER BY book_count DESC, a.name COLLATE NOCASE
       LIMIT ?`
    )
    .all(limit);
}

function getLoanStats() {
  return getDb()
    .prepare(
      `SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) AS overdue,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) AS returned
       FROM loans`
    )
    .get();
}

module.exports = {
  getDashboardMetrics,
  getGenreDistribution,
  getReadingTrend,
  getTopAuthors,
  getLoanStats,
};
