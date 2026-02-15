const { describe, test, expect, beforeAll } = require('bun:test');

describe('BookList empty state', () => {
  let BookList;

  beforeAll(() => {
    global.Store = { get: () => 'grid', set: () => {} };
    BookList = require('../../src/renderer/scripts/components/book-list.js');
  });

  test('muestra estado de biblioteca vacía cuando no hay filtros activos', () => {
    const cfg = BookList.__test.getEmptyStateConfig({});
    expect(cfg.message).toBe('No hay libros en tu biblioteca');
    expect(cfg.showAddButton).toBe(true);
  });

  test('muestra estado de sin resultados cuando hay filtros activos', () => {
    const cfg = BookList.__test.getEmptyStateConfig({
      search: 'dune',
      favorite: 1,
    });
    expect(cfg.message).toBe('No se encontraron libros con los filtros actuales');
    expect(cfg.showAddButton).toBe(false);
  });
});
