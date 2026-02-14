const { describe, test, expect } = require('bun:test');
const {
  authorSchema,
  bookSchema,
  userSchema,
  parseSchema,
} = require('../../src/main/services/validators');

describe('validators', () => {
  test('authorSchema normaliza strings y valida nombre obligatorio', () => {
    const parsed = parseSchema(authorSchema, {
      name: '  Ursula K. Le Guin  ',
      website: '',
      biography: '  ',
    });

    expect(parsed.name).toBe('Ursula K. Le Guin');
    expect(parsed.website).toBe(null);
    expect(parsed.biography).toBe(null);
  });

  test('authorSchema falla con URL inválida', () => {
    expect(() =>
      parseSchema(authorSchema, {
        name: 'Autor X',
        website: 'ftp://invalid-url',
      })
    ).toThrow('URL inválida');
  });

  test('bookSchema aplica defaults críticos', () => {
    const parsed = parseSchema(bookSchema, {
      title: 'El libro',
      language: 'es',
    });

    expect(parsed.read_status).toBe('unread');
    expect(parsed.favorite).toBe(0);
    expect(parsed.loanable).toBe(1);
    expect(Array.isArray(parsed.authors)).toBe(true);
  });

  test('userSchema valida email', () => {
    expect(() =>
      parseSchema(userSchema, {
        name: 'Ana',
        email: 'email-invalido',
      })
    ).toThrow('Email inválido');
  });
});
