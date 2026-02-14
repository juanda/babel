const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('readingService', () => {
  let db;
  let readingService;

  beforeEach(() => {
    db = createInMemoryDb();
    readingService = loadServiceWithDb('src/main/services/readingService.js', db);

    db.prepare('INSERT INTO books (title, read_status, loanable) VALUES (?, ?, ?)').run('Libro lectura 1', 'unread', 1);
    db.prepare('INSERT INTO books (title, read_status, loanable) VALUES (?, ?, ?)').run('Libro lectura 2', 'unread', 1);
  });

  afterEach(() => {
    db.close();
  });

  test('startReading cambia estado a reading y crea sesión activa', () => {
    const result = readingService.startReading(1);
    expect(result.read_status).toBe('reading');

    const book = db.prepare('SELECT read_status FROM books WHERE id = 1').get();
    expect(book.read_status).toBe('reading');

    const entries = db.prepare('SELECT * FROM reading_history WHERE book_id = 1').all();
    expect(entries.length).toBe(1);
    expect(entries[0].finish_date).toBe(null);
  });

  test('startReading no duplica sesión activa existente', () => {
    readingService.startReading(1);
    readingService.startReading(1);

    const count = db.prepare('SELECT COUNT(*) AS c FROM reading_history WHERE book_id = 1').get().c;
    expect(count).toBe(1);
  });

  test('finishReading cierra sesión activa y setea rating/review', () => {
    readingService.startReading(1);

    const finished = readingService.finishReading(1, {
      finish_date: '2026-02-10',
      rating: 4,
      review: 'Muy bueno',
    });

    expect(finished.read_status).toBe('completed');
    expect(finished.rating).toBe(4);

    const book = db.prepare('SELECT read_status, rating FROM books WHERE id = 1').get();
    expect(book.read_status).toBe('completed');
    expect(book.rating).toBe(4);

    const entry = db.prepare('SELECT finish_date, rating, review FROM reading_history WHERE book_id = 1').get();
    expect(entry.finish_date).toBe('2026-02-10');
    expect(entry.rating).toBe(4);
    expect(entry.review).toBe('Muy bueno');
  });

  test('finishReading crea sesión si no existe activa', () => {
    readingService.finishReading(2, {
      finish_date: '2026-02-11',
      rating: 5,
    });

    const entries = db.prepare('SELECT * FROM reading_history WHERE book_id = 2').all();
    expect(entries.length).toBe(1);
    expect(entries[0].start_date).toBe('2026-02-11');
    expect(entries[0].finish_date).toBe('2026-02-11');
  });

  test('getHistory y getStatistics devuelven agregados coherentes', () => {
    readingService.finishReading(1, { finish_date: '2026-01-10', rating: 3 });
    readingService.finishReading(2, { finish_date: '2026-02-10', rating: 5 });

    const historyAll = readingService.getHistory();
    expect(historyAll.length).toBe(2);

    const historyOne = readingService.getHistory(1);
    expect(historyOne.length).toBe(1);
    expect(historyOne[0].book_title).toBe('Libro lectura 1');

    const stats = readingService.getStatistics();
    expect(stats.total_sessions).toBe(2);
    expect(stats.finished_sessions).toBe(2);
    expect(Number(stats.avg_rating)).toBe(4);
    expect(stats.by_month.length).toBe(2);
    expect(stats.by_month[0].month).toBe('2026-01');
    expect(stats.by_month[1].month).toBe('2026-02');
  });
});
