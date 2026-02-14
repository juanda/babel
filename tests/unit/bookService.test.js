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
  });

  afterEach(() => {
    db.close();
  });

  test('crea libro y persiste relación many-to-many con autores', () => {
    const created = bookService.create({
      title: 'Libro de prueba',
      language: 'es',
      authors: [
        { id: 1, role: 'author', author_order: 1 },
        { id: 2, role: 'translator', author_order: 2 },
      ],
      read_status: 'unread',
    });

    expect(created.id).toBeDefined();
    const loaded = bookService.getById(created.id);
    expect(loaded.title).toBe('Libro de prueba');
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
      authors: [{ id: 2, role: 'editor', author_order: 1 }],
      read_status: 'reading',
    });

    expect(updated.title).toBe('Libro actualizado');
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
});
