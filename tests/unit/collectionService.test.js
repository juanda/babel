const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('collectionService', () => {
  let db;
  let collectionService;

  beforeEach(() => {
    db = createInMemoryDb();
    collectionService = loadServiceWithDb('src/main/services/collectionService.js', db);

    db.prepare('INSERT INTO books (title, read_status, loanable) VALUES (?, ?, ?)').run('Libro A', 'unread', 1);
    db.prepare('INSERT INTO books (title, read_status, loanable) VALUES (?, ?, ?)').run('Libro B', 'unread', 1);
  });

  afterEach(() => {
    db.close();
  });

  test('create requiere nombre y persiste colección', () => {
    expect(() => collectionService.create({ name: '   ' })).toThrow('nombre de la colección');

    const created = collectionService.create({
      name: 'Favoritos',
      description: 'Libros destacados',
      color: '#ff0000',
      icon: 'star',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Favoritos');
    expect(created.description).toBe('Libros destacados');
  });

  test('update modifica colección existente', () => {
    const created = collectionService.create({ name: 'Pendientes' });
    const updated = collectionService.update(created.id, {
      name: 'Pendientes 2026',
      color: '#00aa00',
    });

    expect(updated.name).toBe('Pendientes 2026');
    expect(updated.color).toBe('#00aa00');
  });

  test('addBook/getBooks/removeBook gestiona relación many-to-many', () => {
    const created = collectionService.create({ name: 'Sci-Fi' });

    collectionService.addBook(created.id, 1);
    collectionService.addBook(created.id, 2);
    collectionService.addBook(created.id, 2);

    let books = collectionService.getBooks(created.id);
    expect(books.length).toBe(2);

    collectionService.removeBook(created.id, 1);
    books = collectionService.getBooks(created.id);
    expect(books.length).toBe(1);
    expect(books[0].title).toBe('Libro B');
  });

  test('getAll incluye contador de libros por colección', () => {
    const c1 = collectionService.create({ name: 'A' });
    const c2 = collectionService.create({ name: 'B' });

    collectionService.addBook(c1.id, 1);
    collectionService.addBook(c1.id, 2);
    collectionService.addBook(c2.id, 2);

    const rows = collectionService.getAll();
    const rowA = rows.find((r) => r.name === 'A');
    const rowB = rows.find((r) => r.name === 'B');

    expect(Number(rowA.book_count)).toBe(2);
    expect(Number(rowB.book_count)).toBe(1);
  });

  test('remove elimina colección', () => {
    const c = collectionService.create({ name: 'Eliminar' });
    const removed = collectionService.remove(c.id);

    expect(removed).toBe(true);
    expect(collectionService.getById(c.id)).toBe(null);
  });
});
