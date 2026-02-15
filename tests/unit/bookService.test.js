const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('bookService', () => {
  let db;
  let bookService;

  beforeEach(() => {
    db = createInMemoryDb();
    bookService = loadServiceWithDb('src/main/services/bookService.js', db);

    db.prepare('INSERT INTO authors (name) VALUES (?)').run('Autor Uno');
    db.prepare('INSERT INTO authors (name) VALUES (?)').run('Autor Dos');
    db.prepare('INSERT INTO users (name, active) VALUES (?, ?)').run('Usuario Test', 1);
  });

  afterEach(() => {
    db.close();
  });

  test('crea libro y persiste relación many-to-many con autores', () => {
    const created = bookService.create({
      title: 'Libro de prueba',
      language: 'es',
      cdu: '82',
      signature: '82 AUT LIB',
      authors: [
        { id: 1, role: 'author', author_order: 1 },
        { id: 2, role: 'translator', author_order: 2 },
      ],
      read_status: 'unread',
    });

    expect(created.id).toBeDefined();
    const loaded = bookService.getById(created.id);
    expect(loaded.title).toBe('Libro de prueba');
    expect(loaded.cdu).toBe('82');
    expect(loaded.signature).toBe('82 AUT LIB');
    expect(loaded.bookAuthors.length).toBe(2);
    expect(loaded.bookAuthors[1].role).toBe('translator');
  });

  test('update reemplaza autores y mantiene datos del libro', () => {
    const created = bookService.create({
      title: 'Libro original',
      language: 'es',
      authors: [{ id: 1, role: 'author', author_order: 1 }],
      read_status: 'unread',
    });

    const updated = bookService.update(created.id, {
      title: 'Libro actualizado',
      cdu: '93/94',
      signature: '93/94 AUT LIB',
      authors: [{ id: 2, role: 'editor', author_order: 1 }],
      read_status: 'reading',
    });

    expect(updated.title).toBe('Libro actualizado');
    expect(updated.cdu).toBe('93/94');
    expect(updated.signature).toBe('93/94 AUT LIB');
    expect(updated.read_status).toBe('reading');

    const loaded = bookService.getById(created.id);
    expect(loaded.bookAuthors.length).toBe(1);
    expect(loaded.bookAuthors[0].author_id).toBe(2);
    expect(loaded.bookAuthors[0].role).toBe('editor');
  });

  test('getAll concatena nombres de autores', () => {
    bookService.create({
      title: 'Libro A',
      language: 'es',
      authors: [{ id: 1, role: 'author', author_order: 1 }],
    });

    const all = bookService.getAll({});
    expect(all.length).toBe(1);
    expect(all[0].authors).toBe('Autor Uno');
  });

  test('getAll y getById incluyen estado de préstamo', () => {
    const created = bookService.create({
      title: 'Libro prestado',
      language: 'es',
      authors: [{ id: 1, role: 'author', author_order: 1 }],
    });

    db.prepare(
      `INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
       VALUES (?, ?, ?, ?, ?)`
    ).run(created.id, 1, '2026-01-01', '2026-01-10', 'active');

    const list = bookService.getAll({});
    const row = list.find((b) => b.id === created.id);
    expect(row.is_loaned).toBe(1);
    expect(row.loan_status).toBe('active');
    expect(row.loaned_to).toBe('Usuario Test');

    const detail = bookService.getById(created.id);
    expect(detail.is_loaned).toBe(1);
    expect(detail.loan_status).toBe('active');
    expect(detail.loaned_to).toBe('Usuario Test');
  });
});
