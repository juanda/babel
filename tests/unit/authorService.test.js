const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('authorService', () => {
  let db;
  let authorService;

  beforeEach(() => {
    db = createInMemoryDb();
    authorService = loadServiceWithDb('src/main/services/authorService.js', db);
  });

  afterEach(() => {
    db.close();
  });

  test('create guarda autor y normaliza campos opcionales vacíos', () => {
    const created = authorService.create({
      name: '  Gabriel Garcia Marquez  ',
      website: '',
      biography: '  ',
      nationality: 'Colombiana',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Gabriel Garcia Marquez');
    expect(created.website).toBe(null);
    expect(created.biography).toBe(null);
    expect(created.nationality).toBe('Colombiana');
  });

  test('update modifica autor existente', () => {
    const created = authorService.create({ name: 'Ursula Le Guin' });

    const updated = authorService.update(created.id, {
      name: 'Ursula K. Le Guin',
      nationality: 'Estadounidense',
      website: 'https://example.com',
    });

    expect(updated.name).toBe('Ursula K. Le Guin');
    expect(updated.nationality).toBe('Estadounidense');
    expect(updated.website).toBe('https://example.com');
  });

  test('search encuentra por nombre y nacionalidad', () => {
    authorService.create({ name: 'Julio Cortazar', nationality: 'Argentina' });
    authorService.create({ name: 'Jane Austen', nationality: 'Britanica' });

    const byName = authorService.search('Cort');
    expect(byName.length).toBe(1);
    expect(byName[0].name).toBe('Julio Cortazar');

    const byCountry = authorService.search('Brit');
    expect(byCountry.length).toBe(1);
    expect(byCountry[0].name).toBe('Jane Austen');
  });

  test('remove elimina autor y getById devuelve null', () => {
    const created = authorService.create({ name: 'Autor Temporal' });

    const removed = authorService.remove(created.id);
    expect(removed).toBe(true);
    expect(authorService.getById(created.id)).toBe(null);
  });

  test('update falla si el autor no existe', () => {
    expect(() => authorService.update(999, { name: 'X' })).toThrow('Autor no encontrado');
  });
});
