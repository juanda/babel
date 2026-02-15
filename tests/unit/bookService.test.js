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
      label_printed: 1,
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
    expect(loaded.label_printed).toBe(1);
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
      label_printed: 0,
      authors: [{ id: 2, role: 'editor', author_order: 1 }],
      read_status: 'reading',
    });

    expect(updated.title).toBe('Libro actualizado');
    expect(updated.cdu).toBe('93/94');
    expect(updated.signature).toBe('93/94 AUT LIB');
    expect(updated.label_printed).toBe(0);
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

  test('getAll filtra por colección, favoritos, prestables y tejuelo impreso', () => {
    const b1 = bookService.create({
      title: 'Libro Favorito',
      language: 'es',
      favorite: 1,
      loanable: 1,
      label_printed: 1,
      authors: [{ id: 1, role: 'author', author_order: 1 }],
    });
    const b2 = bookService.create({
      title: 'Libro No Prestable',
      language: 'es',
      favorite: 0,
      loanable: 0,
      label_printed: 0,
      authors: [{ id: 2, role: 'author', author_order: 1 }],
    });

    const col = db.prepare('INSERT INTO collections (name) VALUES (?)').run('Narrativa');
    const collectionId = Number(col.lastInsertRowid);
    db.prepare('INSERT INTO book_collections (book_id, collection_id) VALUES (?, ?)').run(b1.id, collectionId);

    const byCollection = bookService.getAll({ collection_id: collectionId });
    expect(byCollection.length).toBe(1);
    expect(byCollection[0].id).toBe(b1.id);

    const favorites = bookService.getAll({ favorite: 1 });
    expect(favorites.length).toBe(1);
    expect(favorites[0].id).toBe(b1.id);

    const loanables = bookService.getAll({ loanable: 1 });
    expect(loanables.some((b) => b.id === b1.id)).toBe(true);
    expect(loanables.some((b) => b.id === b2.id)).toBe(false);

    const printed = bookService.getAll({ label_printed: 1 });
    expect(printed.length).toBe(1);
    expect(printed[0].id).toBe(b1.id);
  });
});
