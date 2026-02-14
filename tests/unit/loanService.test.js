const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('loanService', () => {
  let db;
  let loanService;

  beforeEach(() => {
    db = createInMemoryDb();
    loanService = loadServiceWithDb('src/main/services/loanService.js', db);

    db.prepare('INSERT INTO books (title, loanable, read_status) VALUES (?, ?, ?)').run('Libro prestable', 1, 'unread');
    db.prepare('INSERT INTO books (title, loanable, read_status) VALUES (?, ?, ?)').run('Libro no prestable', 0, 'unread');
    db.prepare('INSERT INTO users (name, active) VALUES (?, ?)').run('Usuario Test', 1);
  });

  afterEach(() => {
    db.close();
  });

  test('createLoan crea préstamo activo cuando libro está disponible', () => {
    const loan = loanService.createLoan({
      book_id: 1,
      user_id: 1,
      loan_date: '2026-02-01',
      due_date: '2026-02-15',
      condition_on_loan: 'good',
    });

    expect(loan.id).toBeDefined();
    expect(loan.status).toBe('active');
    expect(loan.book_title).toBe('Libro prestable');
  });

  test('createLoan rechaza segundo préstamo activo del mismo libro', () => {
    loanService.createLoan({
      book_id: 1,
      user_id: 1,
      loan_date: '2026-02-01',
      due_date: '2026-02-15',
    });

    expect(() =>
      loanService.createLoan({
        book_id: 1,
        user_id: 1,
        loan_date: '2026-02-02',
        due_date: '2026-02-16',
      })
    ).toThrow('ya está prestado');
  });

  test('returnLoan marca préstamo como devuelto', () => {
    const loan = loanService.createLoan({
      book_id: 1,
      user_id: 1,
      loan_date: '2026-02-01',
      due_date: '2026-02-15',
    });

    const returned = loanService.returnLoan(loan.id, {
      condition_on_return: 'fair',
      notes: 'Tiene marcas en el lomo',
    });

    expect(returned.status).toBe('returned');
    expect(returned.return_date).toBeDefined();
    expect(returned.condition_on_return).toBe('fair');
  });

  test('updateOverdueStatuses mueve préstamos a overdue cuando vencen', () => {
    const loan = loanService.createLoan({
      book_id: 1,
      user_id: 1,
      loan_date: '2026-01-01',
      due_date: '2026-01-03',
    });

    loanService.updateOverdueStatuses();

    const refreshed = loanService.getById(loan.id);
    expect(refreshed.status).toBe('overdue');
  });

  test('createLoan falla si el libro no es prestable', () => {
    expect(() =>
      loanService.createLoan({
        book_id: 2,
        user_id: 1,
        loan_date: '2026-02-01',
        due_date: '2026-02-15',
      })
    ).toThrow('no está disponible para préstamo');
  });
});
