const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const { createInMemoryDb, loadServiceWithDb } = require('../helpers/test-db');

describe('userService', () => {
  let db;
  let userService;

  beforeEach(() => {
    db = createInMemoryDb();
    userService = loadServiceWithDb('src/main/services/userService.js', db);

    db.prepare('INSERT INTO books (title, loanable, read_status) VALUES (?, ?, ?)').run('Libro base', 1, 'unread');
  });

  afterEach(() => {
    db.close();
  });

  test('create guarda usuario con defaults y campos opcionales', () => {
    const created = userService.create({
      name: 'Ana Perez',
      email: 'ana@example.com',
      phone: '555-123',
    });

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Ana Perez');
    expect(created.email).toBe('ana@example.com');
    expect(created.trust_level).toBe(3);
    expect(created.active).toBe(1);
  });

  test('update modifica usuario y mantiene persistencia', () => {
    const created = userService.create({ name: 'Carlos' });

    const updated = userService.update(created.id, {
      name: 'Carlos Mendez',
      trust_level: 5,
      active: 0,
    });

    expect(updated.name).toBe('Carlos Mendez');
    expect(updated.trust_level).toBe(5);
    expect(updated.active).toBe(0);
  });

  test('search busca por nombre, email o teléfono', () => {
    userService.create({ name: 'Lucia', email: 'lucia@correo.com' });
    userService.create({ name: 'Mario', phone: '999-111' });

    const byName = userService.search('Luc');
    expect(byName.length).toBe(1);
    expect(byName[0].name).toBe('Lucia');

    const byPhone = userService.search('999');
    expect(byPhone.length).toBe(1);
    expect(byPhone[0].name).toBe('Mario');
  });

  test('remove falla cuando el usuario tiene préstamo activo', () => {
    const user = userService.create({ name: 'Usuario con prestamo' });

    db.prepare(
      `INSERT INTO loans (book_id, user_id, loan_date, due_date, status)
       VALUES (?, ?, ?, ?, 'active')`
    ).run(1, user.id, '2026-02-01', '2026-02-15');

    expect(() => userService.remove(user.id)).toThrow('préstamos activos');
  });

  test('remove elimina usuario si no tiene préstamos activos', () => {
    const user = userService.create({ name: 'Usuario libre' });

    const removed = userService.remove(user.id);
    expect(removed).toBe(true);
    expect(userService.getById(user.id)).toBe(null);
  });
});
