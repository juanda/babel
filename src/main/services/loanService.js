const { getDb } = require('../database/db');
const { loanSchema, parseSchema } = require('./validators');

function isBookLoanable(bookId) {
  const row = getDb().prepare('SELECT loanable FROM books WHERE id = ?').get(bookId);
  return !!row && row.loanable === 1;
}

function hasActiveLoan(bookId) {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS count FROM loans WHERE book_id = ? AND status IN ('active', 'overdue')")
    .get(bookId);
  return row?.count > 0;
}

function getAll(filters = {}) {
  const clauses = [];
  const params = {};

  if (filters.status) {
    clauses.push('l.status = @status');
    params.status = filters.status;
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  return getDb()
    .prepare(
      `SELECT l.*, b.title AS book_title, u.name AS user_name
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN users u ON u.id = l.user_id
       ${where}
       ORDER BY l.loan_date DESC, l.created_at DESC`
    )
    .all(params);
}

function getById(id) {
  return getDb()
    .prepare(
      `SELECT l.*, b.title AS book_title, u.name AS user_name
       FROM loans l
       JOIN books b ON b.id = l.book_id
       JOIN users u ON u.id = l.user_id
       WHERE l.id = ?`
    )
    .get(id);
}

function createLoan(input) {
  const data = parseSchema(loanSchema, input);

  if (!isBookLoanable(data.book_id)) {
    throw new Error('El libro no está disponible para préstamo');
  }
  if (hasActiveLoan(data.book_id)) {
    throw new Error('El libro ya está prestado');
  }

  const result = getDb()
    .prepare(
      `INSERT INTO loans (book_id, user_id, loan_date, due_date, status, condition_on_loan, notes)
       VALUES (@book_id, @user_id, @loan_date, @due_date, 'active', @condition_on_loan, @notes)`
    )
    .run(data);

  return getById(result.lastInsertRowid);
}

function returnLoan(id, data = {}) {
  const loan = getById(id);
  if (!loan) {
    throw new Error('Préstamo no encontrado');
  }
  if (loan.status === 'returned') {
    throw new Error('El préstamo ya fue devuelto');
  }

  const returnDate = new Date().toISOString().split('T')[0];
  getDb()
    .prepare(
      `UPDATE loans
       SET status='returned', return_date=@returnDate, condition_on_return=@condition_on_return,
           notes=COALESCE(@notes, notes), updated_at=CURRENT_TIMESTAMP
       WHERE id=@id`
    )
    .run({
      id,
      returnDate,
      condition_on_return: data.condition_on_return || null,
      notes: data.notes || null,
    });

  return getById(id);
}

function getActiveLoans() {
  return getAll({ status: 'active' });
}

function getOverdueLoans() {
  return getAll({ status: 'overdue' });
}

function getByUser(userId) {
  return getDb()
    .prepare(
      `SELECT l.*, b.title AS book_title
       FROM loans l
       JOIN books b ON b.id = l.book_id
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`
    )
    .all(userId);
}

function getByBook(bookId) {
  return getDb()
    .prepare(
      `SELECT l.*, u.name AS user_name
       FROM loans l
       JOIN users u ON u.id = l.user_id
       WHERE l.book_id = ?
       ORDER BY l.created_at DESC`
    )
    .all(bookId);
}

function updateOverdueStatuses() {
  const today = new Date().toISOString().split('T')[0];

  getDb()
    .prepare(
      `UPDATE loans
       SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'active' AND due_date < ?`
    )
    .run(today);

  getDb()
    .prepare(
      `UPDATE loans
       SET status = 'active', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'overdue' AND due_date >= ?`
    )
    .run(today);
}

module.exports = {
  getAll,
  getById,
  createLoan,
  returnLoan,
  getActiveLoans,
  getOverdueLoans,
  getByUser,
  getByBook,
  updateOverdueStatuses,
};
